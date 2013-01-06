#!/bin/bash

ping 8.8.8.8
if [ $? -eq 0 ]
then
    echo "0"
else
    echo "1"
fi