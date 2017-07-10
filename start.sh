#!/bin/bash
# change to the folder of the file
cd `dirname $0`
forever stop app.js
forever start -l app.log  -a app.js
forever stop monitor.js
forever start -l monitor.log  -a monitor.js