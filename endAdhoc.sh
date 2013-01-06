#!/bin/bash

# Kill wifi

echo -n "Killing DHCP server... "
killall dnsmasq && echo "OK"
echo -n "Killing wireless... "
# restoring the wlan interface to "default" mode
ifconfig wlan0 down
iwconfig wlan0 mode managed
iwconfig wlan0 essid off
iwconfig wlan0 key off
echo "OK"
echo "Wireless Ad-hoc mode terminated."

exit 0