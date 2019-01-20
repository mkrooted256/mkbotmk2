const base = require('./base');

/**
 *
 * @param {int|string} chat_id
 * @param {int} message_id
 * @param {object} reply_markup
 * @param {function} callback
 */
function edit_message_reply_markup(chat_id, message_id, reply_markup, callback) {
    var params = {
        chat_id: chat_id,
        message_id: message_id,
        reply_markup: reply_markup
    };
    base.request('/editMessageReplyMarkup', params, callback)
}

/**
 *
 * @param chat_id
 * @param message_id
 * @param {function} callback
 */
function delete_message(chat_id, message_id, callback) {
    var params = {
        chat_id: chat_id,
        message_id: message_id
    };
    base.request('/deleteMessage', params, callback)

}

module.exports.msg_reply_markup = edit_message_reply_markup;
module.exports.delete_msg = delete_message;