const fs = require('fs');

const override = [];

function get_config(name) {
    var target = "/srv/it4142_bot/config/" + name;
    if (fs.existsSync(target))
        return require(target);
    else
        return undefined;
}

function get_route(name) {
    var target = "/receive/router/" + name;
    if (fs.existsSync(target))
        return require(target);
    else
        return undefined;
}

module.exports.get_route = get_route;
module.exports.get_config = get_config;