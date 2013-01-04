var fs = require('fs');
var config = fs.readFileSync(__dirname + '/config.js');
console.log(config.toString());
module.exports = config;