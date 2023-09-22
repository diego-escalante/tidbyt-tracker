var sqlite3 = require("sqlite3")
const DBSOURCE = "./db/db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message)
        throw err
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS habits (
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            habit TEXT NOT NULL,
            status TEXT NOT NULL,
            PRIMARY KEY (date, habit),
            CONSTRAINT valid_date CHECK(date IS date(date, '+0 days'))
            )`,
        (err) => {
            if (err) {
                console.error(err.message);
                throw err;
            }
            db.run(`CREATE TABLE IF NOT EXISTS trackers (
                id INTEGER PRIMARY KEY,
                habit TEXT NOT NULL UNIQUE,
                first_tracked_day TEXT,
                color TEXT,
                color_failure TEXT,
                color_neutral TEXT
            )`,
            (err) => {
                if (err) {
                    console.error(err.message);
                    throw err;
                }
            });
            console.log("Connected to the sqlite database successfully!")
            // generateTestEntries();
        });
    }
});

// function generateTestEntries() {
//     console.log("Generating test entries...")
//     var currentDate = new Date();
//     for (var i = 0; i < 500; i++) {
//         currentDate.setDate(currentDate.getDate() - 1);
//         var dateStr = currentDate.toISOString().slice(0, 10);
//         var habit = "Walk Ginger";
//         var rand = Math.random();
//         var status;
//         if (rand < 0.7) {
//             status = "SUCCESS";
//         } else if (rand < 0.9) {
//             status = "FAILURE";
//         } else {
//             status = "SKIPPED";
//         }
//         var sql = `REPLACE INTO habits (date, habit, status) VALUES ('${dateStr}', '${habit}', '${status}')`
//         db.run(sql, (err) => {
//             if (err) {
//                 throw err;
//             }
//         });
//     }
//     console.log("Generated entries!")
// }

module.exports = db
