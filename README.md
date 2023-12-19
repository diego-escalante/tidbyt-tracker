# Tidbyt Tracker

# Setup
1. Install [Pixlet](https://tidbyt.dev/docs/build/installing-pixlet)
2. Install [Node and NPM](https://nodejs.org/en/download)
3. Clone this repo.
4. `cd` into the repo.
5. Run `npm install`.
6. In the config directory, rename default.json.example to default.json and add your API token and Tidbyt device ID in the file in order to be able to display trackers on your Tidbyt. If either is missing, the app will skip pushing to a Tidbyt (but you can still use `pixlet serve` to test on a browser.)
6. Run `npm start`.

install Raspberry Pi OS Lite (32-bit for Raspberry Pi Zero W)
Connect it to your network, enable SSH.

sudo apt update
sudo apt upgrade



TODOs:

* When deleting a tracker, use pixlet to remove from tidbyt too?
* UI?
* Put on Pi and document process
* Complete README.md
* Replace all Date stuff with Dayjs.
* Ensure all dates across the codebase are in the local timezone.

Known issues:
* Cannot remove already set Tracker fields. Either set a new value or delete the Tracker and make a new one.