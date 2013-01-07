var fs = require('fs');
var dir = '/mnt/settings/owl';
// fs.existsSync('/mnt/settings/owl', function (exists) {
//   dir = exists ? '/mnt/settings/owl' : '.';
// });
if(process.platform == 'darwin') dir = '.';

var config = fs.readFileSync(dir + '/config.js');
console.log(config.toString());
module.exports = JSON.parse(config);