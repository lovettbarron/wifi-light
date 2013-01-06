var fs = require('fs');
var dir = '.';
fs.existsSync('/mnt/settings/owl', function (exists) {
  dir = exists ? '/mnt/settings/owl' : '.';
});
var config = fs.readFileSync(dir + '/config.js');
console.log(config.toString());
module.exports = JSON.parse(config);