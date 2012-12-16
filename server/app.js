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
  , five = require("johnny-five")
    // or "./lib/johnny-five" when running from the source
  //, board = new five.Board()
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
  //res.send(config);
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
  temp = req.params.temp;
  tempValue(temp);
  res.send('okay!');
});

app.get('/lum/:lum', function(req,res) {
  lum = req.params.lum;
  lumValue(lum);
  res.send('okay!');
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
  var network = '/etc/network.conf';
  var current, output, netConf;
  switch(type) {
    case 'wpa':
          exec('../connect.sh ' + ssid + ' ' + pass
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

      exec('../broadcast.sh'
        , function (error, stdout, stderr) {
          if(error) console.log("Err: " + error + stderr);
          output = stdout.toString();
          console.log(output);
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

var lumValue = function(lum) {
  board.lum(lum);
  console.log("Setting lum value to " + lum)
}

var tempValue = function(temp) {
  //board.analogWrite(temPin, temp);
  board.temp(temp);
  console.log("Setting temp value to " + temp)
}


/* 
////////////////////////////////////
// // // Johnny Five stuff // // //
//////////////////////////////////
board.on("ready", function() {
  var lumLED, tempLED;
  lumLED = new five.Led({ pin: lumPin });
  tempLED = new five.Led({ pin: temPin });

   board.repl.inject({
     lumLED: lumLED
     , tempLED: tempLED
   });

   // lumLED.fadeIn();
   // tempLED.fadeIn();


   board.temp = function(val) {
    tempLED.brightness(val);
    //lumLED.brightness(lum);
   }

  board.lum = function(val) {
      //tempLED.brightness(temp);
      lumLED.brightness(val);
     }

}); */

var board = new Board('/dev/ttyUSB0', function(err) { // For Arduino Nano w/ 328 on RPI
  
    console.log('connected ' + JSON.stringify(board));
    

    board.pinMode(lumPin, board.MODES.PWM);
    board.pinMode(temPin, board.MODES.PWM);
    board.pinMode(testPin, board.MODES.PWM)

    console.trace("Setting board modes");

   board.prototype.temp = function(val) {
    board.analogWrite(temPin, val);
     }

    board.prototype.lum = function(val) {
      board.analogWrite(lumPin, val);
      }
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



// var saveToDisk = function() {
//   setInterval(function() {
//     saveToConfig();
//   }, 30000)
// }
broadcastMode();



app.listen(3000);
console.log("THE OWL LIVES");