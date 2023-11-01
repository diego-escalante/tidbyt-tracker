install Raspberry Pi OS Lite (32-bit for Raspberry Pi Zero W)

Connect it to your network, enable SSH.

sudo apt update
sudo apt upgrade
sudo apt install sqlite3
sudo apt install python3-pip

pip3 install web.py


TODOs:
* More constraints on the tables? (color values should be '#XXXXXX').
* When deleting a tracker, use pixlet to remove from tidbyt too?
* UI?
* Init db script
* Put on Pi and document process
* Compete README.md
* Better distinction between 400 error and 500 error?
* Cron job to delete old data??
* Replace all Date stuff with Dayjs.