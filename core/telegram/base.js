const config = require('../../config/general');
const request = require('request');
const Logger = require("../utils/logger");
const logger = new Logger("tg/base");
const inspect = require("util").inspect;

function send_request(path, json_data, callback) {
    let params = {
        uri: config.telegram_url + path,
        method: 'POST',
        json: json_data,
        headers: {
            "Content-Type": "application/json"
        }
    };
    logger.verbose("Sending: ", require("util").inspect(params));
    request(params, function (error, response, body) {
        if (typeof callback === "function")
            callback(error, response, body)
    })
}

function set_webhook(webhook_url, certificate, callback) {
    let params = {
        uri: config.telegram_url + "/setWebhook",
        method: 'POST',
        formData: {
            url: webhook_url,
            certificate: certificate
        }
    };
    request(params, function (error, response, body) {
        callback(error, response, body)
    })
}

function handle_updates(offset, limit, timeout, allowed_updates, update_handler, callback) {
    logger.verbose("Aquiring updates with id >= ", offset);

    if (typeof update_handler !== 'function'){
        return false;
    }
    let json_data = {};
    if (offset) json_data.offset = offset;
    if (limit) json_data.limit = limit;
    if (timeout) json_data.timeout = timeout/1000;
    if (allowed_updates) json_data.allowed_updates = allowed_updates;

    let params = {
        uri: config.telegram_url + "/getUpdates",
        method: 'POST',
        json: json_data,
        timeout: timeout
    };
    request(params, function (error, response, body) {
        if (error) {
            logger.error(error);
            return
        }
        logger.verbose("got update response");
        if (body && body.ok) {
            logger.verbose("got body ok");
            if (body.result) {
                logger.verbose("got body results:");
                logger.verbose(require("util").inspect(body.result));
                const actions = body.result.map(update_handler);
                Promise.all(actions).then(callback).catch(err => {
                    logger.error("Error handling updates");
                    logger.error(inspect(body));
                    callback(body);
                });
            }
        } else {
            logger.error("Error retrieving updates");
            logger.error(inspect(body));
            callback(body);
        }
    });
}

function bold_md(text) {
    return "*"+text+"*"
}
function italic_md(text) {
    return "_"+text+"_"
}
function monospaced_md(text) {
    return "`"+text+"`"
}
function url_md(text, url) {
    return "["+text+"](" + url + ")"
}
function mention_md(text, user_id) {
    return "["+text+"](tg://user?id=" + user_id + ")"
}

module.exports.request = send_request;
module.exports.set_webhook = set_webhook;
module.exports.get_updates = handle_updates;
module.exports.markdown = {
    bold: bold_md,
    italic: italic_md,
    monospaced: monospaced_md,
    link: url_md,
    mention: mention_md
};