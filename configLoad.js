var fs = require('fs');
var dir = '/mnt/setting/owl';
var config = fs.readFileSync(dir + '/config.js');
console.log(config.toString());
module.exports = JSON.parse(config);