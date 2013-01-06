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