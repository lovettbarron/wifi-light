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

var lumPin = 12
  , temPin = 11
  , testPin = 13;

var lum = 255
  , temp = 127
  , alarm = 7;

var alarmOn = false;

// for Firmata
//var board = new Board('/dev/tty.usbmodem411', function() {

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

  ////////////////////////
 // Primary Routes     //
////////////////////////

app.get('/', function(req, res){

  res.render('index', {
    title: 'Fishtnk Setup'
  });
});

// Gets status
app.get('/status', function(req,res) {
  var configFile = fs.readFileSync(configPath);
  var content = JSON.parse(configFile);

  res.send(content);
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
}); 

app.get('/temp/:temp', function(req,res) {

  if(req.params.temp == '') {
    temp = Math.floor(config.lamp.temp);
  } else {
    temp = Math.floor(req.params.temp);
  }
      updateLampConfig(lum,temp);
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
    updateLampConfig(lum,temp);
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
  alarmOn = true;
  content.alarm.time = alarm;
  content.alarm.on = alarmOn;

  fs.writeFile(configPath, JSON.stringify(content), function(err) {
    if (err) {
      console.log('There has been an error saving config data.');
      console.log(err.message);
      return;
      }
  });
});

app.post('/config/:type?/:ssid?/:pass?', function(req,res) {
  changeNetwork('adhoc');
}); 


///////////////////////
// Server setup modes//
///////////////////////

var broadcastMode = function() {
  var configFile = fs.readFileSync('../config.js');
  var content = JSON.parse(configFile);
  changeNetwork("adhoc"); 
}

var joinMode = function() {
  var configFile = fs.readFileSync('../config.js');
  var content = JSON.parse(configFile);
  changeNetwork(content.network.type, content.network.ssid, content.network.pass); 
}

var changeNetwork = function(type,ssid,pass) {
  var network = fs.readFileSync('../interfaces.txt');
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
          console.log('There has been an error saving network data.');
          console.log(err.message);
          return;
          }
      });

      exec('sudo /etc/init.d/networking restart'
        , function (error, stdout, stderr) {
          if(error) console.log("Err: " + error + stderr);
          output = stdout.toString();
          console.log(output);
        });

      break;
    case 'wep':

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
      break;
  }
  
  return;
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
var light = function(lum, temp) {

  // if(lum >= 0)
  //   board.analogWrite(lumPin, lum);
  // if(temp >= 0)
  //   board.analogWrite(temPin, temp);
};

var checkMode = function() {
  return config.setupMode;
};


//////////////////////////
// Arduino firmata loop//
////////////////////////
var board = new Board('/dev/ttyACM0', function(err) {
    console.log('connected ' + board);
    

    board.pinMode(lumPin, board.MODES.PWM);
    board.pinMode(temPin, board.MODES.PWM);
    board.pinMode(testPin, board.MODES.PWM)

    // setInterval(function(){
    //   //console.log("Setting lum" + lum + "and temp" + temp);
    //   board.analogWrite(lumPin, lum);
    //   board.analogWrite(temPin, temp);
    //   //board.analogWrite(testPin, (new Date().getMilliseconds)%255);
    //   if(alarmOn) {
    //     if( new Date().getHours() == alarm) {
    //           if(alarmOn){
    //           lum += 10;
    //           temp += 10;
    //           alarmOn = false;
    //           }
    //     }
    //   }
    // },1000);
});


app.listen(3000);
console.log("THE OWL LIVES");