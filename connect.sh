#!/bin/bash

if ["$1" = 'wpa']
then
( 	echo update_config=1; 
	echo ctrl_interface=/var/run/wpa_supplicant; 
	echo network={
	echo ssid=\"$2\"
	echo psk=\"$2\" 
	echo }
	) >> /etc/wpasupplicant/wpa_supplicant.conf
	wpa_supplicant -B -i wlan0 -c /etc/wpa_supplicant/wpa_supplicant.conf
	dhclient wlan0

	return 1
else if ["$1" ='wep']
then
	ifconfig wlan0 up
	iwconfig wlan0 essid $2 key $3
	dhclient wlan0
	return 1
else
	return 0
	fi
fi