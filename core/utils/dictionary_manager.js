var dictionary = {};
const Logger = require("../utils/logger");
const logger = new Logger("dictionary");

function add_phrase(id, value, language) {
    if (!language) language = 'global';
    if (!dictionary[language]) dictionary[language] = {};
    if (!dictionary[language][id]) {
        dictionary[language][id] = value;
        logger.verbose("Dictionary - New record[" + language + "]: " + id + " = '" + value + "'");
    } else {
        logger.verbose("Dictionary - Record[" + language + "] with id " + id + " exists. To overwrite, use dictionary_manager.update_phrase");
    }
}

function update_phrase(id, value, language) {
    if (!language) language = 'global';
    if (!dictionary[language]) dictionary[language] = {};
    dictionary[language][id] = value;
    logger.verbose("Dictionary - Record updated[" + language + "]: " + id + " = '" + value + "'");
}

function import_dictionary(dictionary_manager) {
    var storage = dictionary_manager.dictionary;
    for (var lang in storage) {
        if (storage.hasOwnProperty(lang)) {
            for (var id in storage[lang]) {
                if (storage[lang].hasOwnProperty(id)) {
                    update_phrase(id, storage[lang][id], lang)
                }
            }
        }
    }
}

function evaluate(id, lang) {
    if (!lang) lang = 'global';
    if (dictionary[lang] && dictionary[lang][id]) {
        return dictionary[lang][id]
    }
    return "__" + id + ((lang === 'global') ? "" : ("_" + lang))
}

module.exports.eval = evaluate;
module.exports.add_phrase = add_phrase;
module.exports.update_phrase = update_phrase;
module.exports.import = import_dictionary;
module.exports.dictionary = dictionary;