#!/bin/bash
ifconfig wlan0 up
iwconfig wlan0 essid $1 key $2
dhclient wlan0