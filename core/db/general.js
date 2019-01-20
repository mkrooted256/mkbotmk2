const backend = require('../db');
const fs = require("fs");
const Logger = require("../utils/logger");
const logger = new Logger("db/general");

const db_config = require("../../config/db");

let last_offset_in_db = undefined;
let last_offset_update_time = undefined;

function init() {
    get_offset(function(err, offset) {
        if (err) {
            logger.error(err);
        } else {
            logger.info("New last update offset: ", offset);
            last_offset_in_db = offset;
        }
    });
    last_offset_update_time = Date.now();
}


function update_offset(new_value, callback) {
    backend.get_connection(function (err, db) {
        if (err) {
            logger.error(err);
            db.close();
            return
        }
        db.run("UPDATE General SET value=" + new_value + " WHERE key='offset'", function (err, rows, fields) {
            db.close();
            if (err) {
                logger.error(err);
                if (typeof callback === 'function') callback(err);
                return
            }
            if (typeof callback === 'function') callback(null);
        })
    })
}

function get_offset(callback) {
    backend.get_connection(function (err, db) {
        if (err) {
            logger.error(err);
            if (typeof callback === 'function') callback(err);
            db.close();
            return
        }
        db.get("SELECT value FROM General WHERE key='offset'", function (err, res) {
            db.close();
            if (err) {
                logger.error(err);
                if (typeof callback === 'function') callback(err);
                return
            }
            if (typeof callback === 'function') callback(null, res['value']);
        })
    })
}