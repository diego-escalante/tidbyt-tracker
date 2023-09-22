const cron = require('node-cron');
const db = require("../db/db.js");
const pushToTidbyt = require('../tidbyt/tidbyt.js');

// Push new webp's for all trackers to the tidbyt display at the start of a new day.
cron.schedule("5 0 0 * * *", function () {
    console.log("It's a brand new day! Updating all trackers!");
    
    // This is basically the same DB call from GET /api/trackers, should probably de-duplicate this code and put all the DB queries together. 
    var sql = `SELECT * FROM trackers`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.log(`Unable to retrieve trackers: ${err}`);
            return;
        }
        
        for (row of rows) {
            pushToTidbyt(row.habit, row.color, row.first_tracked_day, row.color_failure, row.color_neutral);
        }
        
    });

  });