# Tidbyt Tracker

The Tidbyt Tracker is a Node.js app that allows you to track and display a year worth's of daily goals on a [Tidbyt display](https://tidbyt.com/).

# How It Works
The Tidbyt Tracker was designed to run continuously on a Raspberry Pi connected to a local network. At its core, it is just a small sqlite database that stores daily habit tracking data, a few http endpoints to read and write the data, and a few other features to render up-to-date data onto a Tidbyt. The basic process is as follows:

1. The user, connected to the same local network, sends an HTTP request to the Tidbyt Tracker with a date, status (success, failure, skipped), and habit to log.
2. The Tracker records the new data in the database.
3. The Tracker renders a new image of the habit's data.
4. The Tracker pushes the image to Tidbyt servers.
5. Tidbyt in turn displays the image on the user's Tidbyt device.

# Features
* Displays a rolling-year worth's of daily habit tracking.
* Allows the user to mark a day as SUCCESS, FAILURE, or SKIPPED in the case no action is needed that day (e.g. rest days for exercise habit tracking).
* Allows color customization of the Tracker display for each of the possible habit statuses.
* Allows for an abritrary amount of independent habits to be tracked; A Tidbyt can cycle through each habit's view.
* Allows the user to set a starting day for habit tracking.
* Auotmatically considers the present day a failure if the user does not mark it as a success or skipped before the day ends.
* Automatically cleans up old irrelevant data.
* Displays little relevant motivation messages alongside the tracked data.
* Displays the success percentage of the year to know how good you are sticking to your habit building.
* Displays a streak counter to keep you motivated.
* Exposes a CRUD RESTful API to manage the database's habit data directly as needed.

# How To Use
Unfortunately, there is currently no UI, so the Tracker is used through a series of HTTP requests. However, once the initial setup is done, it is quite easy to use.

## Setting Up a New Habit to Track
`POST /api/trackers` with the following key/value pairs in the body:
* `habit`: The name of the habit to track. Only letters, digits, and spaces are allowed.
* `first_tracked_day`: (Optional) a date in the format of YYYY-MM-DD to start the tracker display from.
* `color`: (Optional) A hex color code to represent successful days. (Default: #00FF00)
* `color_failure`: (Optional) A hex color code to represent failed days. (Default: #FF0000)
* `color_neutral`: (Optional) A hex color code to represent neutral/skipped days. (Default: #111111)

### Body Examples
* `{"habit": "Exercise"}`: Creates a new tracker that will display "Exercise" habit data.
* `{"habit": "Walk Dog", "first_tracked_day": "2023-02-23", "color": "#FFFF00"}`: Creates a new tracker that will display "Walk Dog" habit data, with successful days colored as yellow. Your doggy will thank you.

## Daily Habit Tracking
Once individual habit trackers are set up using the process above, you can easily log daily habit activity by visiting `/` in your browser. A very basic UI there will let you select the habit, status, and date to log.

# API
* TODO: Fill out.

# Limitations
Because of the deliberate choices made for this project, there are known limitations to the Tidbyt Tracker:
* The Tracker needs to be constantly up and running. It was designed with the idea of putting it on small Raspberry Pi, turning it on, and forgetting about it, but you could very well put on your laptop or desktop and ensure it running most of the time.
* The Tracker needs to be accessible on your local network, and you can only interact with it in said network. The Tracker only uses the open internet when it pushes the rendered image to the Tidbyt servers. I guess it is possible to expose the Tracker server publicly so you can log habit data while out and about, but the good and bad consequences of that are up to you to handle.
* If the Tracker is not up and running, it is possible it misses its cron schedule to update the Tidbyt device with a new render at the beginning of a new day. To the user, it will appear that the display got stuck in the past.

# Setup

## Raspberry Pi Setup
Because the Tidbyt Tracker was designed to be put on a Raspberry Pi, the steps to set up the RPi are provided and are as followed:
1. Get yourself a modern Raspberry Pi with wifi capabilities. (Raspberry Pi Zero 2 W is a great choice.)
2. Download and install the [Raspberry Pi Imager](https://www.raspberrypi.com/software/). (You could also choose to install an RPi OS without it manually, but the Imager has some nifty features we are going to use.)
3. Choose the appropriate Raspberry Pi Device.
4. Choose an Operating System. (For a Raspberry Pi Zero 2 W, `Raspberry Pi OS (Legacy, 64-bit) Lite` is a great choice, as the Tidbyt Tracker does not need a desktop environment.)
5. After connecting an SD card that you'll use for the RPi, choose it under Storage.
6. Click Next. 
7. You'll be asked if you'd like to apply OS customization settings. Click Edit Settings. Set the following settings:
    1. (Optional) Set a hostname. (You can use this name to easily make HTTP requests from another device in your network. e.g: http://tidbyt-tracker.local)
    2. Set a username and password.
    3. Configure Wireless LAN. This step is important so your RPi automatically connects to your wifi network.
    4. Set Locale Settings appropriately to the location you intend on using the Tidbyt Tracker.
    5. Under the Services tab, enable SSH. (Along with the Wireless LAN configuration from above, these configurations allow you to just power up your RPi without the need to hook it up to a screen or keyboard to fully set up.)
8. After all the configuration settings are set, click Save. On the prompt to use OS customization settings, click Yes.
9. Continue through any more Imager prompts and install the Rasbperry Pi OS into the SD card.
10. Insert your storage card into the Rpi, and plug it into power. Let it boot up.
11. SSH into it.
12. Run `sudo apt update` and `sudo apt upgrade`.
13. Continue to follow the Tracker Setup steps below.

## Tracker Setup
1. Install [Pixlet](https://tidbyt.dev/docs/build/installing-pixlet)
    * Make sure you download the correct pixlet release. For Raspberry Pi Zero 2 W, you want the linux arm64 version, not amd64.
2. Install [Node and NPM](https://nodejs.org/en/download)
    * Personally, I found the easiest way to install Nodejs on a Pi Zero is to first install [nvm](https://github.com/nvm-sh/nvm), and then use nvm to install node. (`nvm install --lts`)
3. Install [Git](https://git-scm.com/downloads) if you don't have it.
3. Clone this repo: `git clone https://github.com/diego-escalante/tidbyt-tracker.git`
4. `cd` into the repo.
5. Run `npm install`.
6. In the config directory, rename default.json.example to default.json and add your API token and Tidbyt device ID in the file in order to be able to display trackers on your Tidbyt. If either is missing, the app will skip pushing to a Tidbyt (but you can still use `pixlet serve` to test on a browser.)
6. Run `npm start`.

# Why is this not just a published community app?
Tidbyt allows anyone to create and publish apps for all Tidbyt users to use. There are [hundreds of cool apps](https://tidbyt.com/pages/apps) available that allow any user to easily put on their devices through the official Tidbyt app on their phone. So why is the Tidbyt Tracker not just one of these apps that is easy to set up and use?

The main reason is that something needs to store the tracking data and Tidbyt does not do this. Tidbyt apps can make requests to get data from the internet to render images, but that's largely it. In order for the Tidbyt Tracker to be a published community app, the Tracker would need to be a standalone service on the web, with a Tidbyt app simply pulling the data from it and rendering an image from it. This is outside the scope (and budget!) of this project.

# Known Issues
* Cannot remove already set Tracker fields. Either set a new value or delete the Tracker and make a new one.

# Possible Future Features
* UI
* Automatically creating/deleting trackers on the Tidbyt device.