const db_conf = require("../../config/db");
const Logger = require("./logger");

function DatabaseBuffer(id, parameters) {
    let {create, read, update, exists, update_interval, init_value} = parameters;

    this.logger = new Logger("db/buffer/"+id);
    this.logger.verbose("Constructing");

    const BI = this;

    this.id = id;
    this.data = {};
    this.update_interval = update_interval || db_conf.cache_update_interval;
    this.in_sync = true;
    this.handlers = {
        C: function () {
            // BI.logger.verbose("C handler");
            return create && create()
        },
        R: function () {
            // BI.logger.verbose("R handler");
            return read && read()
        },
        U: function () {
            // BI.logger.verbose("U handler");
            return update && update()
        }
    };

    this.set = function (value) {
        BI.logger.verbose("set", value);
        BI.in_sync = false;
        BI.data.local = value;
    };
    this.get = function () {
        return BI.data.local;
    };

    this.push = function () {
        BI.logger.verbose("push request");
        return new Promise((resolve, reject) => {
            BI.handlers.U(BI.data.local).then(_ => {
                BI.in_sync = true;
                resolve();
            }).catch(reject)
        })
    };

    if (exists) {
        this.handlers.R().then(value => {
            BI.data.real = value;
            BI.data.local = value;
        });
    } else {
        this.handlers.C().then(_ => {
            BI.logger.verbose("C().then(...)");
            BI.data.real = init_value;
            BI.data.local = init_value;
            if (init_value) {
                BI.push().then(_ => {
                    BI.logger.verbose("Pushed successful");
                }).catch(e => {
                    BI.logger.error("Push failed:", e)
                });
            }
        })
    }

    this.timer = setInterval(this.push, this.update_interval);

    this.force_set = function (value) {
        return new Promise((resolve, reject) => {
            BI.set(value);
            BI.push().then(resolve);
        })
    };

    this.stop = function () {
        BI.timer.clearInterval();
    }
}

module.exports = DatabaseBuffer;