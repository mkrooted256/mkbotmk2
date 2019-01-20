const config = require('../config/general');
const certificate = require('../config/tls');

const tg_base = require('../core/telegram/base');
const fs = require("fs");
const DB = require("../core/db");
const db = new DB();
const tls = require('tls');
const express = require('express');
const app = express();
const body_parser = require('body-parser');
const inspect = require("util").inspect;

const Logger = require('../core/utils/logger');
const logger = new Logger("bot");

const dictionary = require('../core/dictionary');
const dicts = fs.readdirSync('../dictionary/');
for (let user_dict in dicts)
    if (dicts.hasOwnProperty(user_dict))
        dictionary.import(require("../dictionary/" + dicts[user_dict]));
global.__ = dictionary.eval;

const update_manager = require('../core/update_manager');

const POLLING_TYPE = 'LONG_POLLING';
app.use(body_parser.json());

logger.info("Starting main init queue");
db.init(true).then(function () {
    logger.verbose("CHECK1:", db.client!==undefined);
    return db.check_connection()
}).then(_ => {
    logger.info("Launching update manager init");
    return update_manager.init(db)
}).catch(err => {
    logger.error("Something wrong with DB, shutting down:");
    logger.error(err);
}).then(_ => {
    logger.verbose("Loading logic modules...");
    const m_files = fs.readdirSync('../bot_logic/');
    const actions = m_files.map(function (filename) {
        const manager = require("../bot_logic/" + filename);
        logger.verbose("Loading update handler (", filename, ")");
        return update_manager.import(manager);
    });
    return Promise.all(actions)
}).catch(function(err) {
    logger.error("Error on handlers import:", inspect(err))
}).then(function() {
    start_getting_updates();
    start_static_server();

    process.on("SIGINT", exit);
    process.on("SIGTERM", exit);
});

function update() {
    logger.info("Waiting for update...");

    tg_base.get_updates(
        db.values.offset.get(),
        100,
        config.polling_interval,
        null,
        update_manager.handle,
        function () {
            setTimeout(update, 1000)
        }
    )
}

function start_webhook() {
    app.all(config.webhook_path, function (req, res) {
        update_manager.handle(req.body);
        console.log("Received update:");
        console.log(req.body);
        res.sendStatus(200);
    });
    app.all("/", function (req, res) {
        res.sendStatus(200);
    });

    const server = tls.createServer({
        key: certificate.private_key,
        cert: certificate.public_cert,
        ca: [
            certificate.csr
        ]
    }, /*app*/ function (res) {
        res.write("helloworld");
        res.pipe(res);
    }).listen(config.host.port, "0.0.0.0", function () {
        console.log(arguments);
        console.log("Started webserver on " + config.host.host + ":" + config.host.port);
        tg_base.set_webhook(
            config.webhook_url,
            certificate.public_cert,
            function (error, response, body) {
                console.log(body);
                console.log("Requested webhook");
            });
    });

    // app.listen(80);
}

function start_static_server() {
    logger.info("Static server up on 8888");

    app.use("/static", express.static("../public"));
    app.listen(8888);
}

function start_getting_updates() {
    logger.info("Let's begin receiving updates!");

    if (POLLING_TYPE === 'WEBHOOK') {
        start_webhook();
    } else {
        update();
    }
}

function exit() {
    db.db_cleanup();
    process.exit(1);
}