var fs = require('fs');
var config = fs.readFileSync(__dirname + '/config.js');

module.exports = config;