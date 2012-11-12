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
    title: 'Fishtnk Setup'
  });
});

app.get('/new', function(req, res){

  res.render('setup', {
    title: 'Fishtnk Setup'
  });
});

// Gets status
app.get('/status', function(req,res) {
  res.send(config);
});

// Retrieves SSIDs
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


// Modifies SSIDs
app.post('/ssid', function(req,res) {
  var conf = {}
  console.log("Changing wlan: " + conf);

  var configFile = fs.readFile(configPath);
  var content = JSON.parse(configFile);
  config.network.ssid = req.body.ssid;
  config.network.pass = req.body.pass;
  config.owner.owner = req.body.owner;
  config.owner.email = req.body.email;
  config.owner.first = new Date();

  console.log(content)

});

app.get('/temp/:temp', function(req,res) {
  if(req.params.temp == '') {
    temp = Math.floor(config.lamp.temp);
  } else {
    temp = Math.floor(req.params.temp);
  }
  tempValue(temp);
});

app.get('/lum/:lum', function(req,res) {
  if(req.params.lum == '') {
    lum = Math.floor(config.lamp.lum);
  } else {
    lum = Math.floor(req.params.lum);
  }

  lumValue(lum);

});

app.get('/alarm/:time', function(req,res) {
  alarm = req.params.time;
  alarmOn = true;
  config.alarm.time = alarm;
  config.alarm.on = alarmOn;
});

app.post('/config/:type?/:ssid?/:pass?', function(req,res) {
  changeNetwork('adhoc');
}); 


///////////////////////
// Server setup modes//
///////////////////////

var broadcastMode = function() {
  changeNetwork("adhoc"); 
}

var joinMode = function() {
  changeNetwork(config.network.type, config.network.ssid, config.network.pass); 
}

var changeNetwork = function(type,ssid,pass) {
  var network = fs.readFile('../interfaces.txt');
  var current, output, netConf;
  switch(type) {
    case 'wpa':
      netConf = ' '+
          'network={' +
          'ssid="' + ssid + '"' +
          'proto=RSN' +
          'key_mgmt=WPA-PSK' +
          'pairwise=CCMP TKIP' +
          'group=CCMP TKIP' +
          'psk="' + pass + '"'+
          '}';

      fs.writeFile(network, netConf, function(err) {
        if (err) {
          console.log('There has been an error saving wpa network data.');
          console.log(err.message);
          }
      });

      exec('./etc/init.d/networking restart'
        , function (error, stdout, stderr) {
          if(error) console.log("Err: " + error + stderr);
          output = stdout.toString();
          console.log(output);
        });

      break;
    case 'wep':
      netConf = ' '+
          'network={' +
          'ssid="' + ssid + '"' +
          'proto=RSN' +
          'key_mgmt=WPA-PSK' +
          'pairwise=CCMP TKIP' +
          'group=CCMP TKIP' +
          'psk="' + pass + '"'+
          '}';

      fs.writeFile(network, netConf, function(err) {
        if (err) {
          console.log('There has been an error saving wpa network data.');
          console.log(err.message);
          }
      });
      break;
    case 'adhoc': //adhoc

      // First get the wireless up
      exec('ifconfig wlan0 up'
        , function (error, stdout, stderr) {
          if(error) console.log("Err: " + error + stderr);
          output = stdout.toString();
          console.log(output);
        });

      // Setup the wireless network into adhoc mode
      exec('iwconfig wlan0 mode ad-hoc'
        , function (error, stdout, stderr) {
          if(error) console.log("Err: " + error + stderr);
          output = stdout.toString();
          console.log(ssid);
        });

      // Setup the wireless network to adhoc mode
      exec('iwconfig wlan0 essid "owl"'
        , function (error, stdout, stderr) {
          if(error) console.log("Err: " + error + stderr);
          output = stdout.toString();
          console.log(ssid);
        });

      // Set a static IP
      exec('sudo ifconfig wlan0 inet 172.0.0.1'
        , function (error, stdout, stderr) {
          if(error) console.log("Err: " + error + stderr);
          output = stdout.toString();
          console.log(ssid);
        });

      break;
    default:
      broadcastMode();  
      break;
  }
  
  return;
}


var reset = function() {
  var configFile = fs.readFile('../config_default.js');
  var content = JSON.parse(configFile);
    fs.writeFile(configPath, JSON.stringify(content), function(err) {
    if (err) {
      console.log('There has been an error saving your configuration data.');
      console.log(err.message);
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

  fs.writeFile(configPath, JSON.stringify(config), function(err) {
    if (err) {
      console.log('There has been an error saving your configuration data.');
      console.log(err.message);
      } else {
        console.log("File written!");
      }
    });
}


//////////////////////////
// Arduino firmata loop//
////////////////////////
//var board = new Board('/dev/tty.usbmodem411', function() { // This is for OSX testing
//var board = new Board('/dev/ttyACM0', function(err) { // This is for Arduino UNO
var board = new Board('/dev/ttyUSB0', function(err) { // For Arduino Nano w/ 328 on RPI
  
    console.log('connected ' + JSON.stringify(board));
    

    board.pinMode(lumPin, board.MODES.PWM);
    board.pinMode(temPin, board.MODES.PWM);
    board.pinMode(testPin, board.MODES.PWM)

    console.trace("Setting board modes");
     // setInterval(function(){
     //   //console.log("Setting lum" + lum + "and temp" + temp);
     //   board.analogWrite(lumPin, lum);
     //   if(lum==0)
     //     board.analogWrite(temPin, lum);
     //   else board.analogWrite(temPin, temp);
     //   //board.analogWrite(testPin, (new Date().getMilliseconds)%255);
     //   if(alarmOn) {
     //     if( new Date().getHours() == alarm) {
     //           if(alarmOn){
     //           lum += 1;
     //           temp += 1;
     //           //alarmOn = false;
     //           }
     //     }
     //   }
     // },100);
});

var lumValue = function(lum) {
  board.analogWrite(lumPin, lum);
  console.log("Setting lum value to " + lum)
}

var tempValue = function(temp) {
  board.analogWrite(temPin, temp);
  console.log("Setting temp value to " + temp)
}


// var saveToDisk = function() {
//   setInterval(function() {
//     saveToConfig();
//   }, 30000)
// }


app.listen(3000);
console.log("THE OWL LIVES");