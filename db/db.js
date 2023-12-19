const DBSOURCE = "./db/tidbyt-tracker.db";
const dayjs = require('dayjs');
var customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

// Initialize DB connection.
const db = new require('better-sqlite3')(DBSOURCE);
console.log("Established connection to the database!");

// Create trackers table if it does not exist.
db.prepare(`CREATE TABLE IF NOT EXISTS trackers (
    id INTEGER PRIMARY KEY,
    habit TEXT NOT NULL UNIQUE,
    first_tracked_day TEXT,
    color TEXT,
    color_failure TEXT,
    color_neutral TEXT
    )`).run();

// Create habits table if it does not exist.
db.prepare(`CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    habit TEXT NOT NULL,
    status TEXT NOT NULL,
    UNIQUE(date, habit),
    CONSTRAINT valid_date CHECK(date is date(date, '+0 days'))
    )`).run();


// TODO: Helper function for now, delete later.
function generateTestEntries(habit) {
    console.log(`Generating test entries for habit "${habit}"...`)

    var habits = [];
    var currentDate = new Date();
    for (var i = 0; i < 500; i++) {
        currentDate.setDate(currentDate.getDate() - 1);
        var date = currentDate.toISOString().slice(0, 10);
        var rand = Math.random();
        var status;
        if (rand < 0.7) {
            status = "SUCCESS";
        } else if (rand < 0.9) {
            status = "FAILURE";
        } else {
            status = "SKIPPED";
        }
        habits.push({"date": date, "habit": habit, "status": status});
    }
    const statement = db.prepare('REPLACE INTO habits (date, habit, status) VALUES (@date, @habit, @status)');
    const transaction = db.transaction((habits) => {
        for (const habit of habits) {
            statement.run(habit);
        }
    });
    transaction(habits);
    console.log("Generated entries!");
}
generateTestEntries("Walk Ginger");

// === Trackers Table ===
exports.getTrackers = function() {
    return db.prepare("SELECT * FROM trackers").all();
}

exports.getTracker = function(id) {
    if (!Number.isInteger(Number(id))) {
        throw new Error(`Cannot get tracker; id ${id} is invalid.`);
    }
    return db.prepare("SELECT * FROM trackers WHERE id = ?").get(id);
}

exports.createTracker = function(habit, first_tracked_day, color, color_failure, color_neutral) {
    if (!isHabitNameValid(habit)) {
        throw new Error(`Cannot create tracker, as habit name ${habit} is invalid.`);
    }
    return db.prepare("INSERT INTO trackers (habit, first_tracked_day, color, color_failure, color_neutral) VALUES (?, ?, ?, ?, ?)")
        .run(habit, first_tracked_day, color, color_failure, color_neutral);
}

exports.updateTracker = function(id, habit, first_tracked_day, color, color_failure, color_neutral) {
    if (!Number.isInteger(Number(id))) {
        throw new Error(`Cannot update tracker; id ${id} is invalid.`);
    }
    if (habit && !isHabitNameValid(habit)) {
        throw new Error(`Cannot update tracker; habit ${habit} is invalid.`);
    }

    return db.prepare(`UPDATE trackers SET 
                    habit = COALESCE(?, habit), 
                    first_tracked_day = COALESCE(?, first_tracked_day), 
                    color = COALESCE(?, color),
                    color_failure = COALESCE(?, color_failure),
                    color_neutral = COALESCE(?, color_neutral)
                    WHERE id = ?`)
        .run(habit, first_tracked_day, color, color_failure, color_neutral, id);
}

exports.deleteTracker = function(id) {
    if (!Number.isInteger(Number(id))) {
        throw new Error(`Cannot delete tracker; id ${id} is invalid.`);
    }
    return db.prepare("DELETE FROM trackers WHERE id = ?").run(id);
}

// === Habits Table ===
exports.getHabits = function(habit, from, to) {
    var sql = 'SELECT * FROM habits';
    var params = [];

    if (habit || from || to) {
        sql += ' WHERE';

        if (habit) {
            // Validate habit.
            if (!isHabitNameValid(habit)) {
                throw new Error(`Cannot get habit data; habit ${habit} is invalid.`);
            }
            sql += ' habit = ?';
            params.push(habit);

            if (from || to) {
                sql += ' AND';
            }
        }

        if (from || to) {
            // If from or to is set, ensure both are set.
            if (!from || !to) {
                throw new Error(`Cannot get habit data; both from and to must be set, or neither.`);
            }

            // Validate from and to.
            if (!isDateValid(from)) {
                throw new Error(`Cannot get habit data; from date ${from} is invalid.`);
            }
            if (!isDateValid(to)) {
                throw new Error(`Cannot get habit data; to date ${to} is invalid.`);
            }

            sql += ' date BETWEEN ? AND ?';
            params.push(from, to);
        }
    }
    return db.prepare(sql).all(params);
}

exports.getHabit = function(id) {
    if (!Number.isInteger(Number(id))) {
        throw new Error(`Cannot get habit; id ${id} is invalid.`);
    }
    return db.prepare("SELECT * FROM habits WHERE id = ?").get(id);
}

exports.createOrUpdateHabit = function(habit, status, date) {
    if (!isHabitNameValid(habit)) {
        throw new Error(`Cannot create habit; habit name ${habit} is invalid.`);
    }

    if (!isStatusValid) {
        throw new Error(`Cannot create habit; status ${status} is invalid.`);
    }
    var sql;
    var params;
    if (date) {
        if (!isDateValid(date)) {
            throw new Error(`Cannot create habit; date ${date} is invalid.`);
        }
        sql = "REPLACE INTO habits (date, habit, status) VALUES (?, ?, ?)"
        params = [date, habit, status]
    } else {
        sql = "REPLACE INTO habits (habit, status) VALUES (?, ?)"
        params = [habit, status]
    }

    db.prepare(sql).run(params);
}

exports.deleteHabit = function(id) {
    if (!Number.isInteger(Number(id))) {
        throw new Error(`Cannot delete habit; id ${id} is invalid.`);
    }
    return db.prepare("DELETE FROM habits WHERE id = ?").run(id);
}

exports.deleteOldHabits = function(olderThanDays) {
    if (!Number.isInteger(Number(olderThanDays))) {
        throw new Error(`Cannot delete habits; ${olderThanDays} is an invalid number of days.`);
    }
    return db.prepare(`DELETE FROM habits WHERE date < date('now', '-${olderThanDays} day')`).run()
}

// === Helpers ===
function isStatusValid(status) {
    // If status is not a string it is invalid.
    return !((typeof habit !== 'string' && !(habit instanceof String)));
}

function isDateValid(date) {
    return dayjs(date, 'YYYY-MM-DD', true).isValid();
}

function isHabitNameValid(habit) {
    // If habit is not a string or if it's empty or if it's just whitespace, or if it has whitespace at the start or finish, it is invalid.
    if ((typeof habit !== 'string' && !(habit instanceof String)) || !habit.trim() || habit !== habit.trim()) {
        return false;
    }
    // The habit is valid if it is alphanumeric (with spaces in between).
    return /^[A-Za-z0-9\s]+$/.test(habit);
}