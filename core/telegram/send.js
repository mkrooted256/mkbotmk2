const base = require("./base");
const fs = require("fs");
const Logger = require("../utils/logger");
const logger = new Logger("tg/send");

/**
 * Send message to chat
 *
 * @param {int} chat_id
 * @param {string} text
 * @param {int|null} [reply_msg_id]
 * @param {function(error=, response=, body=)} [callback]
 * @param {Object|[[object]]|null} [reply_markup]
 * @param {boolean} [markdown]
 */
function message(chat_id, text, reply_msg_id, callback, reply_markup, markdown) {
    let params = {
        chat_id: chat_id,
        text: text
    };
    if (markdown) params.parse_mode = "Markdown";
    if (typeof reply_msg_id === "number") {
        params.reply_to_message_id = reply_msg_id;
    }
    if (reply_markup) params.reply_markup = reply_markup;
    base.request("/sendMessage", params, callback);
}

/**
 * Send photo to chat
 *
 * @param {int} chat_id
 * @param {string|File|{filepath: string}} photo
 * @param {string|null} caption
 * @param {int|null} reply_msg_id
 * @param {function(err=, res=, body=)} callback
 */
function photo(chat_id, photo, caption, reply_msg_id, callback) {
    var params = {
        chat_id: chat_id
    };
    if (typeof photo === "string") {
        params.photo = photo
    } else if ('filepath' in photo) {
        params.photo = "http://mkrooted.online:8000/images/" + photo.filepath
    } else if (photo) {
        params.form = {
            photo: photo
        }
    } else {
        logger.error("invalid photo argument");
        callback(null);
        return
    }
    if (caption) params.caption = caption; 
    if (reply_msg_id) params.reply_to_message_id = reply_msg_id;
    base.request('/sendPhoto', params, callback)
}

module.exports.message = message;
module.exports.photo = photo;