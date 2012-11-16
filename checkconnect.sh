#!/bin/bash

ping 8.8.8.8
if [ $? -eq 0 ]
then
    echo "0 means command success"
else
    echo "non 0 means not success failure, specific commands have exact code for each of failure messages"
fi