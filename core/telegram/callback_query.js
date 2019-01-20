const base = require('./base');

/**
 * Answer to callback query. It is required to answer to every query bot receives
 *
 * @param {string} query_id
 * @param {string|null} text
 * @param {boolean|null} show_alert
 * @param {string|null} url
 * @param {int|null} cache_time
 * @param {function(err, res, body)} callback
 */
function answer(query_id, text, show_alert, url, cache_time, callback) {
    var params = {
        callback_query_id: query_id
    };
    if (text) params.query_id = query_id;
    if (show_alert) params.show_alert = show_alert;
    if (url) params.url = url;
    if (cache_time) params.cache_time = cache_time;

    base.request('/answerCallbackQuery', params, callback)
}

module.exports.answer = answer;