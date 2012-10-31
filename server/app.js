/**********************
* OWL - The Smart Light
* Fishtnk Design
* IxD and Code by Relay Studio
*
* See documentation at
* http://github.com/relaystudio/fishtnk-owl
***********************/

var configPath = '../config.js';

var express = require('express')
  , util = require('util')
  , url = require('url')
  , fs = require('fs')
  , sys = require('sys')
  , exec = require('child_process').exec
  , config = require('../configLoad.js')
  //, serialport = require('serialport')
  , Board = require('firmata').Board;
  //, gpio = require('gpio');
    
var mode = 0; // Setup mode

var lumPin = 6
  , temPin = 5
  , testPin = 13;

var lum = 255
  , temp = 127
  , alarm = 7;

// for Firmata
//var board = new Board('/dev/tty.usbmodem411', function() {
var board = new Board('/dev/ttyACM0', function(err) {
    console.log('connected');
    

    board.pinMode(lumPin, board.MODES.PWM);
    board.pinMode(temPin, board.MODES.PWM);
    board.pinMode(testPin, board.MODES.PWM)

    setInterval(function(){
      console.log("Setting lum" + lum + "and temp" + temp);
      board.analogWrite(lumPin, lum);
      board.analogWrite(temPin, temp);
      board.analogWrite(testPin, (new Date().getMilliseconds)%255);
    },10)
});


//var app = module.exports = express.createServer();
var app = module.exports = express();

//var SerialPort = serialport.SerialPort; // localize object constructor

//var serial = new SerialPort("/dev/ttyACM0");
//var serialPort = new SerialPort("/dev/tty.usbmodem621");
//var serialPort = new SerialPort("/dev/ttyACM0");

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



// FOR GPIO
var _open = function(pin, fn) { return gpio.export(pin, {ready: fn}); };

var _close = function(pin, fn) {
  if(typeof pin === "number") {
    gpio.unexport(pin, fn);
  } else if(typeof pin === "object") {
    pin.unexport(fn);
  }
};

// FOR SERIAL
var light = function(lum, temp) {
  // if(lum >= 0)
  //   serialPort.write("l"+lum);
  // if(temp >= 0)
  //   serialPort.write("t"+temp);


  if(lum >= 0)
    board.analogWrite(lumPin, lum);
  if(temp >= 0)
    board.analogWrite(temPin, temp);


  // This should _really_ update on 
  // response from the arduino that
  // serial wrote successfully.
  //updateLampConfig(lum,temp);
};

var checkMode = function() {
  return config.setupMode;
};


// Routes
// serialPort.on('data', function (data) {
//   sys.puts("owl: " + data);
//   //if(data)
// });


app.get('/', function(req, res){

  res.render('index', {
    title: 'Fishtnk Setup'
  });
});

app.get('/ssid', function(req,res) {
  var ssid = '';
  var ssidArr = [];

  exec('iwlist wlan0 scanning | grep ESSID'
  , function (error, stdout, stderr) {
    if(error) console.log("Err: " + error + stderr);
    ssid = stdout.toString();//.match('/"[^"]+"/');
    console.log(ssid);
    ssidArr = ssid.split("                    ESSID:");
    console.log('ssidArr:' + ssidArr);
    for(i=1;i<ssidArr.length;i++) {
      ssidArr[i-1] = ssidArr[i].match('\"(.*?)\"')[1];
      console.log("ID " + i-1 + ":" + ssidArr[i-1]);
    }
    ssidArr.pop();
    res.send(ssidArr);
  });
  
  console.log(JSON.stringify(ssidArr));
  //TEST
  //ssidArr = ['Lurgan Beach', 'duffer', 'ROGERS8195',''];
});

app.post('/ssid', function(req,res) {
  var conf = {}
  console.log("Changing wlan: " + conf);

  var configFile = fs.readFileSync(configPath);
  var content = JSON.parse(configFile);
  content.network.ssid = req.body.ssid;
  content.network.pass = req.body.pass;
  content.owner.owner = req.body.owner;
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

app.post('/light/:lum?/:temp?', function(req,res) {
  var lum, temp;
  if(req.params.lum == '') {
    lum = config.lamp.lum;
  } else {
    lum = req.params.lum;
  }

  if(req.params.temp == '') {
    temp = config.lamp.temp;
  } else {
    temp = req.params.temp;
  }

  light(lum, temp);
}); 

app.get('/temp/:temp', function(req,res) {

  if(req.params.temp == '') {
    temp = Math.floor(config.lamp.temp);
  } else {
    temp = Math.floor(req.params.temp);
  }

 // light(-1, req.params.temp);
  console.log("Setting temp " + req.params.temp);
  res.send('Done temp ' + req.params.temp);
});

app.get('/lum/:lum', function(req,res) {
  if(req.params.lum == '') {
    lum = Math.floor(config.lamp.lum);
  } else {
    lum = Math.floor(req.params.lum);
  }

 // light(lum, -1);
  console.log("Setting lum " + req.params.lum);
  res.send('Done lum ' + req.params.lum);
});

app.get('/alarm/:time', function(req,res) {
  var configFile = fs.readFileSync('../config.js');
  var content = JSON.parse(configFile);
  alarm = req.params.time;
  console.log("Setting lum " + req.params.lum);
  res.send('Done lum ' + req.params.lum);
  
  content.alarm.time = alarm;

  fs.writeFile(configPath, JSON.stringify(content), function(err) {
    if (err) {
      console.log('There has been an error saving config data.');
      console.log(err.message);
      return;
      }
  });
});


///////////////////////
// Server setup modes//
///////////////////////

var broadcastMode = function() {
  var configFile = fs.readFileSync('../config.js');
  var content = JSON.parse(configFile);
  
}

var joinMode = function() {
  var configFile = fs.readFileSync('../config.js');
  var content = JSON.parse(configFile);
  
}


var reset = function() {
  var configFile = fs.readFileSync('../config_default.js');
  var content = JSON.parse(configFile);
    fs.writeFile(configPath, JSON.stringify(content), function(err) {
    if (err) {
      console.log('There has been an error saving your configuration data.');
      console.log(err.message);
      return;
      }
    });
  };

var updateLampConfig = function(lum,temp) {
  var configFile = fs.readFileSync('../config.js');
  var content = JSON.parse(configFile);
  content.lamp.lum = lum;
  content.lamp.temp = temp;
  fs.writeFile(configPath, JSON.stringify(content), function(err) {
    if (err) {
      console.log('There has been an error saving config data.');
      console.log(err.message);
      return;
      }
  });
};

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.settings.port, app.settings.env);