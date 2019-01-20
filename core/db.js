const db_conf = require('../config/db');
const config = require('../config/general');
const MongoClient = require("mongodb").MongoClient;
const Logger = require("./utils/logger");
const logger = new Logger("db/backend");
const DBuffer = require("./utils/DatabaseBuffer");
const inspect = require("util").inspect;

const STORAGE_COLL_NAME = "keyvalues";


function DB() {
    this.init_error = false;
    this.init_was = false;
    this.cc = 0;

    const local_db = this;

    this.init = function init(offset_buffer) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(db_conf.mongo_url, {useNewUrlParser: true}).then(c => {
                logger.info("Successfully got connection from 3rdparty promise", !!c);
                local_db.client = c;
                local_db.init_was = true;

                if (offset_buffer) {
                    local_db.values = {};
                    local_db.values.offset = new DBuffer("offset", {
                        create: function() {
                            logger.verbose("offset C handler");
                            return new Promise((resolve, reject) => {
                                var storage;
                                local_db.get_storage().then(s => {
                                    storage = s;
                                    return storage.findOne({key: "last_offset"})
                                }).then(result => {
                                    if (!result || !result.value) {
                                        return storage.insertOne({key: "last_offset", value: config.initial_offset});
                                    }
                                    logger.verbose("FindOne result:");
                                    logger.verbose(inspect(result));

                                    resolve();
                                }).then(result => {
                                    if (result) {
                                        logger.verbose("last offset Insert Result:");
                                        logger.verbose(inspect(result));
                                        resolve();
                                    }
                                }).catch( error => {
                                    logger.error("DBuffer/offset C error:", error);
                                })
                            })
                        },
                        read: function () {
                            logger.verbose("offset R handler");
                            return new Promise((resolve, reject) => {
                                local_db.get_storage().then(storage => {
                                    return storage.findOne({key: "last_offset"})
                                }).then(offset => {
                                    resolve(offset.value)
                                }).catch(error => {
                                    logger.error("DBuffer/offset R error:", error);
                                })
                            })
                        },
                        update: function (new_offset) {
                            logger.verbose("offset U handler");
                            return new Promise((resolve, reject) => {
                                local_db.get_storage().then(storage => {
                                    return storage.updateOne({key: "last_offset"}, {$set: {value: new_offset}})
                                }).then(resolve).catch(err => {
                                    logger.error("DBuffer/offset U error:", err);
                                })
                            })
                        },
                        exists: true
                    });
                }
                resolve();
            }).catch(err => {
                logger.error("mongo_client setup error:", err);
                local_db.init_error = true;
                reject(err);
            });
        })
    };

    this.db_cleanup = function db_cleanup() {
        if (local_db.values.offset.get()) {
            local_db.values.offset.push();
            logger.info("Pushing offset to db before exit");
        }
        if (local_db.client)
            local_db.client.close(true);

    };

    this.get_connection = function get_connection() {
        return new Promise(function (resolve, reject) {
            if (local_db.init_was) {
                logger.verbose("GETTING CONNECTION", local_db.cc === 0 || !!local_db.cc);
                local_db.cc = local_db.cc + 1;

                if (!local_db.client) {
                    logger.error("!client wtf, so: ", local_db.init_was);
                    reject("client is undefined");
                }
                else {
                    // logger.verbose("got client:",require("util").inspect(local_db.client), inspect(local_db.client.db));
                    const db_inst = local_db.client.db(db_conf.mongo_db_name);
                    // logger.info("successfully got db: ", inspect(db_inst));
                    resolve(db_inst)
                }
            } else {
                reject("not initialized");
            }
        });
    };

    this.get_storage = function get_storage() {
        return new Promise(function (resolve, reject) {
            local_db.get_connection().then(dbo => {
                return dbo.collection(STORAGE_COLL_NAME);
            }).then(storage => {
                resolve(storage);
            }).catch(err => {
                logger.error("get_storage error:", err);
                reject(err);
            })
        })
    };
    this.get_collection = function get_collection(collection) {
        return new Promise(function (resolve, reject) {
            local_db.get_connection().then(dbo => {
                return dbo.collection(collection);
            }).then(storage => {
                resolve(storage);
            }).catch(err => {
                logger.error("get_collection error:", err);
                reject(err);
            })
        })
    };

    this.check_connection = function check_connection() {
        return new Promise(function (res1, rej1) {
            let p = new Promise(resolve => resolve());
            if (!local_db.client) {
                logger.info("Client is not ready, creating support init promise");
                p = local_db.init();
            }
            p.then(function () {
                logger.info("Checking connection to db...");
                return new Promise(function (resolve, reject) {
                    if (local_db.init_error) reject("init_error");

                    local_db.get_connection().then(db => {
                        db.collection(STORAGE_COLL_NAME, function (error, storage) {
                            if (error) {
                                logger.error("check conn db error:", error);
                                reject(error);
                            } else {
                                storage.updateOne({key: "last_startup"}, {$set: {key: "last_startup", value: Date.now()}}, {upsert: true}, function (err, result) {
                                    if (err) {
                                        logger.error("check conn insert error:", err);
                                        reject(err);
                                    } else {
                                        resolve(result);
                                    }
                                })
                            }
                        });
                    }).catch(err => {
                        logger.error("check conn top-level error:",err);
                        reject(err);
                    });
                });
            }).then(result => {
                logger.verbose("db conn check successful");
                res1(result)
            }).catch(e => {
                rej1(e)
            })
        })
    };
}

module.exports = DB;