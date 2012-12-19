fishtnk-owl
===========

## Install guide
Occidentalis 0.2 from adafruit `http://learn.adafruit.com/adafruit-raspberry-pi-educational-linux-distro/occidentalis-v0-dot-2`

Setup wireless via `IWconfig` or bash scripts

Setup sudo `/etc/sudoers`
`%admin ALL=(ALL) NOPASSWD: ALL`

Compile node 0.8.11
```
wget http://nodejs.org/dist/v0.8.11/node-v0.8.11.tar.gz
tar -zxf node-v0.8.11.tar.gz
cd node-v0.8.11
./configure
make
sudo make install
```

`npm install express jade johnny-five`
Note: I've run into trouble with this, at times, but not consistently.
`https://github.com/rwldrn/johnny-five/issues/58`


Fishtnk owl light - node and linuxdistro (if possible)

```
/*
Duemilanove
Serial chip: FTDI FT232RL;
Serial port: /dev/ttyUSB0

Uno
Serial chip: Atmel ATmega16U2 (or 8U2 on older boards); 
Serial port: /dev/ttyACM0

Leonardo
Serial chip: Atmel ATmega32U4 (built-in); 
Serial port: /dev/ttyACM0

OMS Omega-328U
Serial chip: Silicon Labs CP210x; 
Serial port: /dev/ttyUSB0.
*/
```

### Sudo at startup
http://askubuntu.com/questions/21343/how-to-make-sudo-remember-my-password-and-how-to-add-an-application-to-startup?rq=1


### Lock file
Call `lockfilecheck`
IF sys is in the middle of backing up temp config, abort write
Check sys