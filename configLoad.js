var fs = require('fs');
var config = fs.readFileSync('../config.js');

module.exports = config;