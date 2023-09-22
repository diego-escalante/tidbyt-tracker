const cron = require('node-cron');
const db = require("../db/db.js");
const pushToTidbyt = require('../tidbyt/tidbyt.js');

// Push new webp's for all trackers to the tidbyt display at the start of a new day.
cron.schedule("5 0 0 * * *", function () {
    console.log("It's a brand new day! Updating all trackers!");
    
    db.getTrackers()
        .then(rows => {
            Promise.all(rows.map(row => pushToTidbyt(row.habit, row.color, row.first_tracked_day, row.color_failure, row.color_neutral, true)))
                .then(results => {
                    console.log(`Updated all trackers!`);
                })
                .catch(error => {
                    console.error("Unable to update all trackers: ", error)
                });
        })
        .catch(error => {
            console.error("Unable to retrieve data for trackers:", error);
        })
  });