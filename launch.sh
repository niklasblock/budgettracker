#!/bin/bash
cd /Users/niklasblock/src/home/budgettracker
/Library/Frameworks/Python.framework/Versions/3.13/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 > /tmp/budgettracker.log 2>&1 &
sleep 4
open -a "Google Chrome" http://127.0.0.1:8000/static/index.html