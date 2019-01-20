const Logger = require("./utils/logger");
const logger = new Logger("update_manager");

let db;
const handlers = [];
const commands = [];
const startup_actions = [];
const init_actions = [];

let name = "general";
let initialized = false;

const update_types = [
    'message',
    'edited_message',
    'channel_post',
    'edited_channel_post',
    'inline_query',
    'chosen_inline_result',
    'callback_query'
];

/**
 * Add middleware for parsing specific type of updates
 *
 * Types:
 * - 'message'
 * - 'edited_message'
 * - 'channel_post'
 * - 'edited_channel_post'
 * - 'inline_query'
 * - 'chosen_inline_result'
 * - 'callback_query'
 *
 *
 * @param {string} type Type of update
 * @param {function(Update)} func Handler function
 */
function add_handler(type, func) {
    handlers.push({
        "type": type,
        "func": func
    })
}

function init(DB) {
    return new Promise(function (resolve, reject) {
        if (!initialized) {
            if (!DB) {
                reject(name + " - init - No DB client!!");
            }
            db = DB;
        }
        resolve();
    })
}

/**
 * Entry point for single update
 * Possible types:
 * - message
 * - edited_message
 * - channel_post
 * - edited_channel_post
 * - inline_query
 * - chosen_inline_result
 * - callback_query
 *
 * @param update
 */
function handle(update) {
    return new Promise(function (resolve, reject) {
        init(db).then(function () {
            const last_offset = db.values.offset.get();

            if (update.hasOwnProperty("message")) {
                // TODO: Add special command handler using Telegram Entities

                logger.verbose("Message detected (", update.message.message_id, ") in chat", update.message.chat.id);

                for (const h of handlers) {
                    for (const field in update) {
                        if (update.hasOwnProperty(field) && h.type === field && typeof h.func === "function") {
                            h.func(update)
                        }
                    }
                }

                // logger.verbose("last offset:", last_offset, "u_id", update.update_id);
                if (last_offset <= update.update_id) {
                    // logger.verbose("updating last_offset to ", update.update_id + 1);
                    db.values.offset.set(update.update_id + 1)
                }
            }
            resolve();
        }).catch(e => {
            logger.error("Update handler '"+name+"' error: ", e);
            reject(e);
        });
    })
}

/**
 * Import handlers from other update handler.
 *
 * @param {update_manager} update_handler source handler
 */
function import_manager(update_handler) {
    return new Promise(function (resolve, reject) {
        if (initialized) {
            handlers.concat(update_handler.handlers);
            update_handler.init(db).then(function () {
                logger.info("All manager init actions done in "+name);
                logger.verbose(require("util").inspect(update_handler.startup_actions));
                return Promise.all(update_handler.startup_actions);
            }).then(function() {
                logger.info("All startup actions for hndler done in "+name);
                initialized = true;
                resolve();
            }).catch(reject);
        } else {
            logger.info("Skipping import cause manager '"+name+"' is not initialized");
            resolve();
        }
    });
}

function on_startup(action) {
    startup_actions.push(action)
}

/**
 * Add middleware to handle specific command
 *
 * Options are:
 * - arg_delimiter - separator between argumnets
 * - argc_min - min number of arguments
 * - argc_max - max number of arguments
 *
 * @param cmd {string}
 * @param handler {function(Update, argv)}
 * @param options {object}
 */
function add_command(cmd, handler, options) {
    if (!(typeof handler === "function"))
        return;
    let command = {
        cmd: cmd,
        argc_min: 1,
        argc_max: 1,
        arg_delim: "\\w+",
        handler: handler
    };

    if (options.arg_delim) command.arg_delim = options.arg_delim;
    if (options.argc_min) command.argc_min = options.argc_min;
    if (options.argc_max) command.argc_max = options.argc_max;

    commands.push(command);
}

module.exports.handlers = handlers;
module.exports.startup_actions = startup_actions;
module.exports.handle = handle;
module.exports.on = add_handler;
module.exports.import = import_manager;
module.exports.on_startup = on_startup;
module.exports.init = init;
module.exports.get_db = () => db;

update_types.forEach(function (type) {
    module.exports['on_' + type] = function (func) {
        add_handler(type, func)
    }
});
