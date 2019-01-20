const base = require('./base');

function kick_from_group(chat_id, user_id, callback) {
    base.request("/kickChatMember", {chat_id: chat_id, user_id: user_id}, callback)
}

function get_member(chat_id, user_id, callback) {
    base.request("/getChatMember", {chat_id: chat_id, user_id: user_id}, callback)
}

module.exports.kick_user = kick_from_group;
module.exports.get_member = get_member;
