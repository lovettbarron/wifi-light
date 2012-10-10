
/**
 * Module dependencies.
 */

var configPath = '../config.js';

var express = require('express')
  , util = require('util')
  , url = require('url')
  , fs = require('fs')
  , sys = require('sys')
  , exec = require('child_process').exec
  , config = require('../configLoad.js')
  , gpio = require('gpio');
    
var mode = 0; // Setup mode

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Rpi functions
var _open = function(pin, fn) { return gpio.export(pin, {ready: fn}); };

var _close = function(pin, fn) {
  if(typeof pin === "number") {
    gpio.unexport(pin, fn);
  } else if(typeof pin === "object") {
    pin.unexport(fn);
  }
};

var checkMode = function() {
  return config.setupMode;
};


// Routes

app.get('/', function(req, res){

  res.render('index', {
    title: 'Fishtnk Setup'
  });
});

app.get('/ssid', function(req,res) {
  var ssid = ''
  , ssidArr = [];
  exec('iwlist wlan0 scanning | grep ESSID'
  , function (error, stdout, stderr) {
    if(error) console.log("Err: " + error + stderr);
    ssid = stdout.toString();//.match('/"[^"]+"/');
    console.log(ssid);
    ssidArr = ssid.split("                    ESSID:");
    console.log('ssidArr:' + ssidArr);
    for(i=1;i<ssidArr.length;i++) {
      ssidArr[i-1] = ssidArr[i].match('\"(.*?)\"')[1];
      console.log(ssidArr[i-1])
    }
    
  });
  
  console.log(ssidArr);
  //TEST
  ssidArr = ['Lurgan Beach', 'duffer', 'ROGERS8195',''];

  res.send(ssidArr);
});

app.post('/ssid', function(req,res) {
var conf = {}
console.log("Changing wlan: " + conf);

  var configFile = fs.readFileSync(configPath);
  var content = JSON.parse(configFile);
  content.network.ssid = "testing"
  content.network.pass = req.body.pass;
  content.owner.owner = req.body.user;
  content.owner.email = req.body.email;
  content.owner.first = new Date();

  console.log(content)

  fs.writeFile(configPath, JSON.stringify(content), function(err) {
    if (err) {
      console.log('There has been an error saving your configuration data.');
      console.log(err.message);
      return;
    }
    console.log('Configuration saved successfully.')
    // If successful, 
    // call script that changes /etc/network/interfaces
    // and returns some successful result

  })

});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.settings.port, app.settings.env);