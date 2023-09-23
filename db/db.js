const sqlite3 = require("sqlite3")
const pushTrackersToTidbyt = require('../tidbyt/tidbyt.js');
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
                console.log("Updating all trackers!")
                updateAllTrackers();
            })
            .catch(error => {
                console.error("Unable to create table!");
                throw error;
            });
    }
});

// TODO: This function is nice but only relevant if the db hasn't been initialized.
//   Can be removed once a DB init process has been formalized.
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

// TODO: This function is nice but only relevant if the db hasn't been initialized.
//   Can be removed once a DB init process has been formalized.
function createHabitsTable() {
    return new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS habits (
            id INTEGER PRIMARY KEY,
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            habit TEXT NOT NULL,
            status TEXT NOT NULL,
            UNIQUE(date, habit),
            CONSTRAINT valid_date CHECK(date is date(date, '+0 days'))
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


// TODO: This is basically a copy of the logic in the tidbyt cron module, but I don't believe it is
//  worth the abstraction at this time. It can be reconsidered in the future depending on use.
function updateAllTrackers() {
    exports.getTrackers()
        .then(rows => {
            pushTrackersToTidbyt(rows, false)
                .then(results => {
                    console.log(`Updated all trackers!`);
                })
                .catch(error => {
                    console.error("Unable to update all trackers: ", error);
                });
        })
        .catch(error => {
            console.error("Unable to retrieve data for trackers:", error);
        })
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

exports.createTracker = function(habit, first_tracked_day, color, color_failure, color_neutral) {
    return new Promise((resolve, reject) => {
        if (!isHabitNameValid(habit)) {
            return reject(new Error(`Cannot create tracker, as habit name ${habit} is invalid.`));
        }

        db.run(`INSERT INTO trackers (habit, first_tracked_day, color, color_failure, color_neutral) VALUES (?, ?, ?, ?, ?)`,
            [habit, first_tracked_day, color, color_failure, color_neutral], 
            (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}

exports.updateTracker = function(id, habit, first_tracked_day, color, color_failure, color_neutral) {
    return new Promise((resolve, reject) => {
        if (!Number.isInteger(Number(id))) {
            return reject(new Error(`Cannot update tracker; id ${id} is invalid.`));
        }

        if (habit && !isHabitNameValid(habit)) {
            return reject(new Error(`Cannot update tracker; habit ${habit} is invalid.`));
        }

        db.run(
            `UPDATE trackers SET 
               habit = COALESCE(?, habit), 
               first_tracked_day = COALESCE(?, first_tracked_day), 
               color = COALESCE(?, color),
               color_failure = COALESCE(?, color_failure),
               color_neutral = COALESCE(?, color_neutral)
               WHERE id = ?`,
            [habit, first_tracked_day, color, color_failure, color_neutral, id],
            function(err, result) {
            if (err) {
                return reject(err);
            }
            if (this.changes == 0) {
                return reject(new Error("No changes were made."));
            }
            return resolve(this.changes);
        });
    });
}

exports.deleteTracker = function(id) {
    return new Promise((resolve, reject) => {
        if (!Number.isInteger(Number(id))) {
            return reject(new Error(`Cannot delete tracker; id ${id} is invalid.`));
        }

        db.run('DELETE FROM trackers WHERE id = ?', id, function(err, result) {
            if (err){
                return reject(err);
            }
            if (this.changes == 0) {
                return reject(new Error("No changes were made."));
            }
            return resolve(this.changes);
        });
    })
}

function isHabitNameValid(habit) {
    // If habit is not a string or if it's empty or if it's just whitespace, or if it has whitespace at the start or finish, it is invalid.
    if ((typeof habit !== 'string' && !(habit instanceof String)) || !habit.trim() || habit !== habit.trim()) {
        return false;
    }
    // The habit is valid if it is alphanumeric (with spaces in between).
    return /^[A-Za-z0-9\s]+$/.test(habit);

}

// TODO: remove after all the db code is moved to this module.
exports.olddb = db
