import os
import subprocess
import re
subprocess.call("iwlist wlan0 scanning | grep ESSID",shell=True)