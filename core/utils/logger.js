var util = require("util");
fs = require('fs');
const config = require("../../config/general");
const request = require("request");

const LOG_PATH = config.log_path || "../../logs/";
const DEFAULT_TAG = "global";
const DEFAULT_CONSOLE_LOGGING_LVL = 0;
const DEFAULT_FILE_LOGGING_LVL = 0;

const LEVELS = {
    0: "VERBOSE",
    1: "INFO   ",
    2: "WARN   ",
    3: "ERROR  ",
    4: "PANIC  "
};

function log_to_file(path, level, tag, data) {
    fs.appendFileSync(path, util.format(
        "%s - %s - %s: %s\r\n",
        new Date().toDateString(),
        LEVELS[level] || "       ",
        tag || DEFAULT_TAG,
        arguments.slice(3).join(" ")
    ))
}

function log_to_console(level, tag, data) {
    var log_func = level > 1 ? console.error : console.log;
    log_func(util.format(
        "%s - %s - %s: %s",
        new Date().toDateString(),
        LEVELS[level] || "       ",
        tag || DEFAULT_TAG,
        arguments.slice(3).join(" ")
    ))
}

/**
 * Logging functionality by mkrooted
 *
 * @param {string} [tag]
 * @param {int} [file_log_level]
 * @param {int} [stdout_log_level]
 * @constructor
 */
function Logger(tag, file_log_level, stdout_log_level) {
    this.tag = (tag && typeof tag === "string" ? tag : false) || DEFAULT_TAG;
    this.file_level = DEFAULT_FILE_LOGGING_LVL;
    if (file_log_level) this.file_level = file_log_level;
    this.console_level = DEFAULT_CONSOLE_LOGGING_LVL;
    if (stdout_log_level) this.file_level = stdout_log_level;
    const date = new Date();
    this.path = LOG_PATH + date.getDate() + "-" + date.getMonth()+1 + "-" + date.getFullYear() + " "
        + date.getHours() + "-" + date.getMinutes() + "-" + date.getSeconds() + ".log";

    const logger = this;

    /**
     * General log function
     * @param {int} level
     * @param {...*} data
     */
    this.log = function (level, data) {
        console.log(arguments);
        console.log([].slice.call(arguments, 1));
        var now = new Date().toUTCString();
        if (level >= logger.file_level) {
            fs.appendFileSync(logger.path, util.format(
                "%s - %s - %s: %s\r\n",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments, 1).join(" ")
            ), {flag: 'a'})
        }
        if (level >= logger.console_level) {
            var log_func = console.log;
            log_func(util.format(
                "%s - %s - %s: %s",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments, 1).join(" ")
            ))
        }
    };

    /**
     * @method verbose
     * Log data with INFO log level
     * @param data
     */
    this.verbose = function (data) {
        var level = 0;
        var now = new Date().toUTCString();
        if (level >= logger.file_level) {
            fs.appendFileSync(logger.path, util.format(
                "%s - %s - %s: %s\r\n",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments).join(" ")
            ), {flag: 'a'})
        }
        if (level >= logger.console_level) {
            var log_func = console.log;
            log_func(util.format(
                "%s - %s - %s: %s",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments).join(" ")
            ))
        }
    };

    /**
     * @method info
     * Log data with INFO log level
     * @param data
     */
    this.info = function (data) {
        var level = 1;
        var now = new Date().toUTCString();
        if (level >= logger.file_level) {
            fs.appendFileSync(logger.path, util.format(
                "%s - %s - %s: %s\r\n",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments).join(" ")
            ), {flag: 'a'})
        }
        if (level >= logger.console_level) {
            var log_func = console.log;
            log_func(util.format(
                "%s - %s - %s: %s",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments).join(" ")
            ))
        }
    };

    /**
     * @method warn
     * Log data with WARN log level
     * @param data
     */
    this.warning = function (data) {
        var level = 2;
        var now = new Date().toUTCString();
        if (level >= logger.file_level) {
            fs.appendFileSync(logger.path, util.format(
                "%s - %s - %s: %s\r\n",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments).join(" ")
            ), {flag: 'a'})
        }
        if (level >= logger.console_level) {
            var log_func = console.log;
            log_func(util.format(
                "%s - %s - %s: %s",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments).join(" ")
            ))
        }
    };

    /**
     * @method err
     * Log data with ERROR log level
     * @param data
     */
    this.error = function (data) {
        var level = 3;
        var now = new Date().toUTCString();
        if (level >= logger.file_level) {
            fs.appendFileSync(logger.path, util.format(
                "%s - %s - %s: %s\r\n",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments).join(" ")
            ), {flag: 'a'})
        }
        if (level >= logger.console_level) {
            var log_func = console.log;
            log_func(util.format(
                "%s - %s - %s: %s",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments).join(" ")
            ))
        }
        let msg = util.format(
            "%s - %s - %s: %s",
            now,
            LEVELS[level] || "       ",
            logger.tag,
            Array.prototype.slice.call(arguments).join(" ")
        );
        const mkrooted_id = 211399446;
        let options = {
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            json: {
                chat_id: mkrooted_id,
                text: msg
            }
        };
        request(config.telegram_url + "/sendMessage", options);
    };

    /**
     * @method panic
     * Log data with PANIC log level
     * @param data
     */
    this.panic = function (data) {
        var level = 4;
        var now = new Date().toUTCString();
        if (level >= logger.file_level) {
            fs.appendFileSync(logger.path, util.format(
                "%s - %s - %s: %s\r\n",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments).join(" ")
            ), {flag: 'a'})
        }
        if (level >= logger.console_level) {
            var log_func = console.log;
            log_func(util.format(
                "%s - %s - %s: %s",
                now,
                LEVELS[level] || "       ",
                logger.tag,
                Array.prototype.slice.call(arguments).join(" ")
            ))
        }
    };
}

module.exports = Logger;
module.exports.LogLevel = {
    verbose: 0,
    info: 1,
    warn: 2,
    error: 3,
    panic: 4
};