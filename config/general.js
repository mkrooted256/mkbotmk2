let fs = require("fs");
let config = {
    "host": {
        "host": "mkrooted.ddns.net",
        "port": 8443
    }
};

config.username = "mkrooted_omega_bot";
config.token = "782260529:AAHi3Na961xwVONUHxn59xrFOVSYUKo2I3A";
config.webhook_path = "/" + config.token;
config.webhook_url = "https://" + config.host.host + ":" + config.host.port + config.webhook_path;
config.telegram_url = "https://api.telegram.org/bot" + config.token;
config.polling_interval = 300*1000;
config.log_path = "D:/Projects/mkbotmk2/logs/";//"logs/";
config.initial_offset = 144597917;


module.exports = config;