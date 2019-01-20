const tg_send = require('../core/telegram/send');
const tg_chat = require('../core/telegram/chat');
const tg_cquery = require('../core/telegram/callback_query');
const tg_edit = require('../core/telegram/edit');
const manager = require('../core/update_manager');
const inspect = require("util").inspect;

const Logger = require('../core/utils/logger');
const logger = new Logger("logic/main");
const start_date = Date.now();
logger.info("Startup date =", start_date);

manager.name = "logic/main";
db = manager.get_db();

let replied_users = [];

// manager.on_message(function (update) {
//     logger.info("GOT IT! update_id=", update.update_id, "update.date=", update.message.date);
//     if (update.message.date*1000 < start_date) {
//         logger.verbose("Ignoring update with date =", update.message.date, "< ", start_date);
//         return;
//     }
//
//     if (!update.message.text) return;
//
//     let msg = "";
//     if (!Array.from(replied_users).find(x => x === update.message.from.id)) {
//         replied_users.push(update.message.from.id);
//
//         logger.verbose("Adding",update.message.from.id,"to replied users");
//         logger.verbose("Replied users:", inspect(replied_users));
//
//         if (update.message.from.username === "shulzhenovski") {
//             msg = "Ха, пидор"
//         } else if (update.message.from.username === "your_still_small_voice") {
//             msg = "Konichiwa senpai ~~"
//         } else if (update.message.from.username === "manyasha_n_m") {
//             msg = "Meine respektierung, der beste Headman der Welt o/"
//         } else if (update.message.from.username === "DimaOnistrat_Fi81") {
//             msg = "👋👋👋"
//         }  else {
//             return
//         }
//         tg_send.message(update.message.chat.id, msg, update.message.message_id, (error, response, body) => {
//             logger.verbose("MSG sent");
//             if (error) {
//                 logger.error("Error while sending reply:", error);
//             }
//             if (!body.ok) {
//                 logger.error("Error sending reply");
//                 logger.error(inspect(body));
//             }
//         });
//     }
// });

manager.on_message(function (update) {
    if (update.message.date*1000 < start_date) {
        return;
    }
    if (!update.message.text || update.message.from.username !== "Ol8een") return;

    const p = 0.075;
    if (Math.random() <= p) {
        tg_send.message(update.message.chat.id, "А как там лабы по проге?", update.message.message_id, (error, response, body) => {});
    }
});

manager.on_message(function (update) {
    if (update.message.date*1000 < start_date) {
        return;
    }
    const msg = update.message;

    if (msg.from.username === "mkrooted" ||
        msg.from.username === "shulzhenovski" ||
        msg.from.username === "Ol8een")
    {
        let send_w_rid = RegExp("^/?send\\s+(-?\\d+)\\s+\\[(\\d+)]\\s+\"(.+)\""); // with reply_id
        let send_raw = RegExp("^/?send\\s+(-?\\d+)\\s+\"(.+)\""); // without reply_id

        let r = send_w_rid.exec(msg.text);
        if (r) {
            logger.verbose("Okay, here are groups:",r[1], r[2], r[3]);
            tg_send.message(r[1], r[3], Number(r[2]), function (error, res, body) {
                if (error) {
                    logger.error("Error while sending reply:", error);
                    tg_send.message(msg.chat.id, "Error: "+inspect(error), msg.message_id, function(){})
                }
                if (!body.ok) {
                    logger.error("Error sending reply");
                    logger.error(inspect(body));
                    tg_send.message(msg.chat.id, "Body not ok: "+inspect(error), msg.message_id, function(){})
                }
            });
            return;
        }
        r = send_raw.exec(msg.text);
        if (r) {
            logger.verbose("Okay, here are groups:",r[1], r[2]);
            tg_send.message(r[1], r[2], null, function (error, res, body) {
                if (error) {
                    logger.error("Error while sending reply:", error);
                    tg_send.message(msg.chat.id, "Error: "+inspect(error), msg.message_id, function(){})
                }
                if (!body.ok) {
                    logger.error("Error sending reply");
                    logger.error(inspect(body));
                    tg_send.message(msg.chat.id, "Body not ok: "+inspect(error), msg.message_id, function(){})
                }
            });
        }
        r = RegExp("^/?get_info").exec(msg.text);
        if (r) {
            tg_send.message(update.message.chat.id, inspect(update).trim(), update.message.message_id, function (error, res, body) {
                if (error) {
                    logger.error("Error while sending reply:", error);
                    tg_send.message(msg.chat.id, "Error: "+inspect(error), msg.message_id, function(){})
                }
                if (!body.ok) {
                    logger.error("Error sending reply");
                    logger.error(inspect(body));
                    tg_send.message(msg.chat.id, "Body not ok: "+inspect(error), msg.message_id, function(){})
                }

            });
        }
        if (msg.text === "omega delete" || msg.text === "/omega_delete") {
            tg_edit.delete_msg(msg.chat.id, msg.reply_to_message.message_id);
            tg_edit.delete_msg(msg.chat.id, msg.message_id);
        }
    }
});

manager.on_message(function (update) {
    const msg = update.message;

    if (/^я пидор/i.test(msg.text)) {
        db.get_collection("pidors").then(coll => {
            logger.verbose("Collection: ", inspect(coll));
            coll.insertOne({chat: msg.chat.id, user: msg.from.id}, function (err, result) {
                logger.verbose("pidor inserts:", result.insertedCount)
            });
            tg_send.message(msg.chat.id, "Я запомню", msg.message_id);
        }).catch(err => {
            logger.error(err);
        })
    } else if (/(?:пидор)|(?:pidor)/i.test(msg.text)) {
        db.get_collection("pidors").then(coll => {
            return coll.find({chat: msg.chat.id}).toArray()
        }).then(pidors => {
            logger.verbose("Known: ", inspect(pidors));
            if (pidors.length > 0) {
                logger.verbose("Looking for pidor...");
                const pidor = pidors[Math.floor(Math.random() * pidors.length)];
                logger.verbose("Found:", inspect(pidor));
                tg_chat.get_member(msg.chat.id, pidor.user, function (err, resp, pidor_info) {
                    logger.verbose("pidorinfo: ", inspect(pidor_info));
                    if (pidor_info && pidor_info.ok && pidor_info.result && pidor_info.result.user) {

                        tg_send.message(msg.chat.id, "ПИДОР ДЕТЕКТЕД: @"+pidor_info.result.user.username+" ("+pidor_info.result.user.first_name+" "+pidor_info.result.user.last_name+")");
                    } else {
                        tg_send.message(msg.chat.id, "Он, похоже, ливнул 😑")
                    }
                });
            }
        }).catch(err => {
            logger.error(err);
        });
    }
});

module.exports = manager;