
/**
 * Module dependencies.
 */

var express = require('express')
  , util = require('util')
  , url = require('url')
  , fs = require('fs')
  , sys = require('sys')
  , exec = require('child_process').exec
  , config = require('../config.js')
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
  var ssid;
  exec('iwlist wlan0 scanning | grep ESSID'
    ,  function (error, stdout, stderr) {
      if(error) console.log("Err: " + error + stderr);
      ssid = stdout.toString().match('/"[^"]+"/');
  });
  
  console.log(ssid);

})

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.settings.port, app.settings.env);