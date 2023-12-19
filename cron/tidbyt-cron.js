const cron = require('node-cron');
const db = require("../db/db.js");
const tidbyt = require('../tidbyt/tidbyt.js');

// On startup, always push the trackers with the data.
console.log("Tidbyt Tracker just started! Updating all trackers!")
getDataAndUpdateTrackers();

// Push new webp's for all trackers to the tidbyt display at the start of a new day.
cron.schedule("5 0 0 * * *", function () {
    console.log("It's a brand new day! Updating all trackers!");
    getDataAndUpdateTrackers();
    
});

// Delete any old irrelevant data once per day.
cron.schedule("10 0 0 * * *", function () {
    console.log("Cleaning up old data!");
    db.deleteOldHabits(730); // 2 years, why not?
});

function getDataAndUpdateTrackers() {
    try {
        tidbyt.pushTrackers(db.getTrackers(), false)
            .then(results => {
                console.log(`Updated all trackers!`);
            })
            .catch(error => {
                console.error("Unable to update all trackers: ", error);
            });
    } catch (e) {
        console.error("Unable to update trackers: ", e);
    }
}