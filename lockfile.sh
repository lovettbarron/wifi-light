#!/bin/bash

# Simple example for writing using a lockfile.
# You may be able to do this from within node using something like: https://github.com/isaacs/lockfile
# Simple rules: if the lockfile exists, don't write. If it doesn't, create it, write, delete it.
# You can test this script using two shells both running this script

LOCKFILE="owl-settings"

# Acquire a lock. This will instantly continue if the lock isn't availble. -r 1 will try again in 5 seconds
lockfile-create $LOCKFILE -r 0
LOCKED=$?

if [[ $LOCKED -eq 0 ]]
then
  echo "Not locked, writing..."
  sleep 10s #This is just to simulate a long operation
  lockfile-remove $LOCKFILE
  echo "Lock released"
else
  echo "Locked, not writing"
fi
