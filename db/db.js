var sqlite3 = require("sqlite3")
const DBSOURCE = "./db/db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        throw err;
    } else {
        Promise.all([createHabitsTable(), createTrackersTable()])
            .then(results => {
                console.log("Ensured that required tables exist.")
                console.log("Connected to the sqlite database successfully!");
                // generateTestEntries("Walk Ginger");
            })
            .catch(error => {
                console.error("Unable to create table!");
                throw error;
            });
    }
});

function createTrackersTable() {
    return new Promise((resolve, reject) => {
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
                reject(err);
            }
            resolve("trackers");
        });
    })
}

function createHabitsTable() {
    return new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS habits (
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            habit TEXT NOT NULL,
            status TEXT NOT NULL,
            PRIMARY KEY (date, habit),
            CONSTRAINT valid_date CHECK(date IS date(date, '+0 days'))
            )`,
        (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}


// TODO: Helper function for now, delete later.
function generateTestEntries(habit) {
    console.log("Generating test entries...")
    var currentDate = new Date();
    for (var i = 0; i < 500; i++) {
        currentDate.setDate(currentDate.getDate() - 1);
        var dateStr = currentDate.toISOString().slice(0, 10);
        var rand = Math.random();
        var status;
        if (rand < 0.7) {
            status = "SUCCESS";
        } else if (rand < 0.9) {
            status = "FAILURE";
        } else {
            status = "SKIPPED";
        }
        var sql = `REPLACE INTO habits (date, habit, status) VALUES ('${dateStr}', '${habit}', '${status}')`
        db.run(sql, (err) => {
            if (err) {
                throw err;
            }
        });
    }
    console.log("Generated entries!")
}

// Trackers Table

exports.getTrackers = function() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM trackers`, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    });
}

exports.getTracker = function(id) {
    return new Promise((resolve, reject) => {
        if (!Number.isInteger(Number(id))) {
            return reject(new Error(`Cannot get tracker; id ${id} is invalid.`));
        }

        db.get(`SELECT * FROM trackers WHERE id = ?`, [id], (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(row);
        });
    });
}

// TODO: remove after all the db code is moved to this module.
exports.olddb = db
