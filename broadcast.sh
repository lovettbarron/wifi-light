#!/bin/bash

# This script must be run as root.

# Requirements: iw, ifconfig commands, and dnsmasq.
# adapted from https://agentoss.wordpress.com/category/bash-scripts/

# User variables
mywlan="wlan0"
myessid="owl"
mychan="4"
mywepkey=""
myip="192.168.7.100"
mydhcprange="192.168.7.101,192.168.7.110"

# Main program
echo -n "Stopping wireless connections (if any)... "
# adapt to your system; I use wicd
systemctl stop wicd && echo "OK"
# for networkmanager
#systemctl stop NetworkManager

echo -n "Starting wireless Ad-hoc mode... "
ifconfig $mywlan down || exit 1
iwconfig $mywlan mode ad-hoc || exit 1
iwconfig $mywlan essid $myessid
iwconfig $mywlan channel $mychan
#[ "$mywepkey" ] && iwconfig $mywlan key $mywepkey

ifconfig $mywlan $myip
ifconfig $mywlan up && echo "OK"
echo -n "Starting DHCP server ... "
dnsmasq --dhcp-range="$mydhcprange" && echo "OK"

echo "--------------------------------------"
echo "ESSID : $myessid"
#[ "$mywepkey" ] && echo "WEP KEY : $mywepkey"
echo "This computer's IP : $myip"
echo "--------------------------------------"

# debug
iwconfig $mywlan

while true; do
echo -n "Enter 'q' to quit. "
read value
if [ "$value" == "q" ]; then
break
fi
done

echo -n "Killing DHCP server... "
killall dnsmasq && echo "OK"
echo -n "Killing wireless... "
# restoring the wlan interface to "default" mode
ifconfig $mywlan down
iwconfig $mywlan mode managed
iwconfig $mywlan essid off
iwconfig $mywlan key off
echo "OK"
echo "Wireless Ad-hoc mode terminated."

exit 0