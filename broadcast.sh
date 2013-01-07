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
systemctl stop wicd && echo "systemctl wtop wicd"
iwconfig wlan0 down && echo "wlan0 down"
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
/etc/init.d/dnsmasq && echo "dnsmasq started"

echo "--------------------------------------"
echo "ESSID : $myessid"
#[ "$mywepkey" ] && echo "WEP KEY : $mywepkey"
echo "This computer's IP : $myip"
echo "--------------------------------------"

# debug
iwconfig $mywlan

#iptables -A FORWARD -i wlan0 -o eth0 -s 10.0.0.0/24 -m state --state NEW -j ACCEPT
#iptables -A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT
#iptables -A POSTROUTING -t nat -j MASQUERADE
#sh -c "echo 1 > /proc/sys/net/ipv4/ip_forward"