/**********************
* OWL - The Smart Light
* Fishtnk Design
* IxD and Code by Relay Studio
*
* See documentation at
* http://github.com/relaystudio/fishtnk-owl
***********************/

var log = false;
if(process.argv[2] == 'log' || process.argv[2] == 'test')
  log = true;
var configPath = 'config.js';

var express = require('express')
  , util = require('util')
  , url = require('url')
  , fs = require('fs')
  , sys = require('sys')
  , exec = require('child_process').exec
  , config = require(__dirname + '/../configLoad.js') || {} ;


  if(log) console.log('Current config');
  if(log) console.log(config);

  //if(process.argv[2] !== 'test')
    //var five = require("johnny-five")
    // or "./lib/johnny-five" when running from the source

  if(process.argv[2] !== 'test') {
    //var board = new five.Board()
    var Board = require('firmata').Board;
    if(log) console.log("Loading Firmata")
    }
  else {
    var board = {};
  }
  //, serialport = require('serialport')
  //, gpio = require('gpio');
  
var writePath;  
if(process.argv[2] !== 'test')
  writePath = '/mnt/settings/owl/'
else
  writePath = __dirname + '../'

var arduino;

var mode = 0; // Setup mode

var lumPin = 11
  , temPin = 10
  , testPin = 13;

var lum = 255
  , temp = 127
  , alarm = 7;

var alarmOn = false;

// for Firmata
var app = module.exports = express();

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

  ////////////////////////
 // Primary Routes     //
////////////////////////

app.get('/', function(req, res){

  res.render('index', {
    title: 'Fishtnk Owl'
  });
});

app.get('/new', function(req, res){

  res.render('setup', {
    title: 'Fishtnk Setup'
  });
});

// Gets status
app.get('/status', function(req,res) {
  if(log) console.log('Sending config status' + config)
  res.send(config);
});

// Retrieves SSIDs
app.get('/ssid', function(req,res) {
  var ssid = '';
  var ssidArr = [];

  exec('iwlist wlan0 scanning | grep ESSID'
  , function (error, stdout, stderr) {
    if(error) if(log) console.log("Err: " + error + stderr);
    ssid = stdout.toString();//.match('/"[^"]+"/');
    if(log) console.log(ssid);
    ssidArr = ssid.split("                    ESSID:");
    if(log) console.log('ssidArr:' + ssidArr);
    for(i=1;i<ssidArr.length;i++) {
      ssidArr[i-1] = ssidArr[i].match('\"(.*?)\"')[1];
      if(log) console.log("ID " + i-1 + ":" + ssidArr[i-1]);
    }
    ssidArr.pop();
    res.send(ssidArr);
  });
  
  if(log) console.log(JSON.stringify(ssidArr));
  //TEST
  //ssidArr = ['Lurgan Beach', 'duffer', 'ROGERS8195',''];
});


// Modifies SSIDs
app.post('/ssid', function(req,res) {
  var conf = {}
  if(log) console.log("Changing wlan: " + conf);

  var configFile = fs.readFile(configPath);
  var content = JSON.parse(configFile);
  config.network.ssid = req.body.ssid;
  config.network.pass = req.body.pass;
  config.owner.owner = req.body.owner;
  config.owner.email = req.body.email;
  config.owner.first = new Date();

  if(log) console.log(content)

});

app.get('/lightState', function(req,res) {
  res.send({"temp":temp, "lum":lum});
});

app.get('/temp/:temp', function(req,res) {
  temp = req.params.temp;
  tempValue(temp);
  res.send('okay!');
});

app.get('/lum/:lum', function(req,res) {
  lum = req.params.lum;
  lumValue(lum);
  res.send('okay!');
});

app.get('/alarm/:time/:duration?', function(req,res) {
  alarm = req.params.time;
  alarmOn = true;
  config.alarm.time = alarm;
  config.alarm.on = alarmOn;
});

app.post('/config/:type?/:ssid?/:pass?', function(req,res) {
  switch(req.params.type) {
    case 'wep':
      config.network.type = "wep"
      break;
    case 'wpa':
      config.network.type = "wpa"
      break;
    default:
      break;
  }

  config.network.ssid = req.params.ssid;
  config.network.pass = req.params.pass;

  if(log) console.log("Changing network")

  joinMode();

}); 


///////////////////////
// Server setup modes//
///////////////////////

var broadcastMode = function() {
  changeNetwork("adhoc"); 
}

var joinMode = function() {
  if(log) console.log("Attempting to join network");
  changeNetwork(config.network.type, config.network.ssid, config.network.pass);
};

var changeNetwork = function(type,ssid,pass,callback) {
  var network = '/etc/network.conf';
  var current, output, netConf;

  if(log) console.log("Setting up network re: config file");

  exec('sh ' + __dirname + '/../endAdhoc.sh'
  , function (error, stdout, stderr) {
    if(error) if(log) console.log("Err: " + error + stderr);
    output = stdout.toString();
    if(log) console.log(output);
  });

  switch(type) {
    case 'wpa':
          exec('sh ' + __dirname + '/../connect.sh wpa ' + ssid + ' ' + pass
        , function (error, stdout, stderr) {
          if(error) if(log) console.log("Err: " + error + stderr);
          output = stdout.toString();
          if(log) console.log(output);
        });
      break;

    case 'wep':
          exec('sh ' + __dirname + '/../connect.sh wep ' + ssid + ' ' + pass
        , function (error, stdout, stderr) {
          if(error) if(log) console.log("Err: " + error + stderr);
          output = stdout.toString();
          if(log) console.log(output);
        });
      break;

    case 'adhoc': //adhoc

      exec('sh ' + __dirname + '/../broadcast.sh'
        , function (error, stdout, stderr) {
          if(error) if(log) console.log("Err: " + error + stderr);
          output = stdout.toString();
          if(log) console.log(output);
        });
      break;

    default:
      broadcastMode();  
      break;
  }

  saveToConfig();
  return;
}


var reset = function() {
  var configFile = fs.readFile(__dirname + '/config_default.js');
  var content = JSON.parse(configFile);
    fs.writeFile(configPath, JSON.stringify(content), function(err) {
    if (err) {
      if(log) console.log('There has been an error saving your configuration data.');
      if(log) console.log(err.message);
      return;
      }
    });
  };

var light = function(lum, temp) {

  // if(lum >= 0)
  //   board.analogWrite(lumPin, lum);
  // if(temp >= 0)
  //   board.analogWrite(temPin, temp);
};

var checkMode = function() {
  return config.setupMode;
};

var saveToConfig = function() {
  //  var configFile = fs.readFileSync('../ config.js');
  // var content = JSON.parse(configFile);
  var lockPath = '/mnt/settings/'

  exec('sh ' + __dirname + '/../lockfile.sh'
      , function (error, stdout, stderr) {
        if(error) if(log) console.log("Err: " + error + stderr);
        output = stdout.toString();

        if(output = "0") {
         if(log) console.log("Writing to ram disk")
           exec('touch ' + lockPath + 'update.flag'
          , function (error, stdout, stderr) {
            if(log) console.log("Lock file written");
            });
         fs.writeFile(writePath + configPath, JSON.stringify(config), function(err) {
          if (err) {
            if(log) console.log('There has been an error saving your configuration data.');
            if(log) console.log(err.message);
            } else {
              if(log) console.log("Config file written!");
            }
          });
        } else {
          if(log) console.log("The ram disk is currently locked, saving to storage")
        }
    });

}


//////////////////////////
// Arduino firmata loop//
////////////////////////

var lumValue = function(val) {
  if(process.argv[2] !== 'test')
    board.lum(val);
  //arduino.analogWrite(lumPin, val);
  if(log) console.log("Setting lum value to " + val)
}

var tempValue = function(val) {
  if(process.argv[2] !== 'test')
      board.temp(val);
  //arduino.analogWrite(temPin, val);
  if(log) console.log("Setting temp value to " + val)
}



////////////////////////////////////
// // // Johnny Five stuff // // //
//////////////////////////////////


// board.mock = true;
/*
if(process.argv[2] !== 'test') {
  var lumLED, tempLED;
  board.on("ready", function() {
    lumLED = new five.Led({ pin: lumPin });
    tempLED = new five.Led({ pin: temPin });

     // board.repl.inject({
     //   lumLED: lumLED
     //   , tempLED: tempLED
     // });

     // lumLED.fadeIn();
      //tempLED.fadeIn();

 });

 board.temp = function(val) {
  tempLED.brightness(val);
  //lumLED.brightness(lum);
 }

board.lum = function(val) {
    //tempLED.brightness(temp);
      lumLED.brightness(val);
   }



}*/


// Board.prototype.temp = function(val) {
//   this.analogWrite(temPin, val);
//  }

// Board.prototype.lum = function(val) {
//   this.analogWrite(lumPin, val);
//   }

// tty.usbserial-A901C760
//arduino = new Board('/dev/ttyUSB0', function(err) { // For Arduino Nano w/ 328 on RPI
// Board = new Board('/dev/ttyACM0', function(err) { // For Arduino Nano w/ 328 on OSX

var board = new Board('/dev/ttyACM0', function(err) {
    if(log) console.log('Arduino connected');
    

    board.pinMode(lumPin, board.MODES.PWM);
    board.pinMode(temPin, board.MODES.PWM);
    board.pinMode(testPin, board.MODES.PWM)

    //setInterval(function(){
      if(log) console.log("Setting lum " + lum + " and temp " + temp);
      board.analogWrite(lumPin, lum);
      board.analogWrite(temPin, temp);
    //},100)
});

 board.temp = function(val) {
  board.analogWrite(temPin, val);
  //lumLED.brightness(lum);
 }

board.lum = function(val) {
    //tempLED.brightness(temp);
      board.analogWrite(lumPin, val);
   }



// This stuff runs re: connection

  var connectToFlag = false;

  exec('iwlist wlan0 scanning | grep ESSID'
  , function (error, stdout, stderr) {
    if(error) if(log) console.log("Err: " + error + stderr);
    ssid = stdout.toString();//.match('/"[^"]+"/');
    if(log) console.log(ssid);
    ssidArr = ssid.split("                    ESSID:");
    //if(log) console.log('ssidArr:' + ssidArr);
    for(i=1;i<ssidArr.length;i++) {
      ssidArr[i-1] = ssidArr[i].match('\"(.*?)\"')[1];
      //if(log) console.log("ID " + i-1 + ":" + ssidArr[i-1]);

      if( ssidArr[i-1] == config.network.ssid) {
        connectToFlag = true;
        if(log) console.log("Detected " + ssidArr[i-1] + " locally")
        }
    }
    ssidArr.pop();
  });


  if(connectToFlag) {
    if(log) console.log("Joining network " + config.network.ssid);
    joinMode();
} else {
  if(log) console.log("No viable config detected, starting adhoc");
  broadcastMode();
}

if(process.platform == 'linux')
  app.listen(80);
else
  app.listen(3000);
if(log) console.log("THE OWL LIVES");