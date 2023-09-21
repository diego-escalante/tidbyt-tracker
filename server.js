var express = require("express");
var app = express();
var db = require("./database.js");
var config = require("config");
const {exec} = require('child_process');

var HTTP_PORT = 8000;

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

TIDBYT_DEVICE_ID = config.get("tidbyt_device_id")
TIDBYT_API_TOKEN = config.get("tidbyt_api_token")

// Start server
app.listen(HTTP_PORT, () => {
    console.log("Tidbyt Tracker running on port " + HTTP_PORT);
});


// Root endpoint
app.get("/", (req, res, next) => {
    res.json({"message":"Ok"});
});

app.get("/api/trackers", (req, res, next) => {
    var sql = `SELECT * FROM trackers`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({"error": err.message})
            return;
        }
        res.json(rows);
    });
});

app.get("/api/tracker/:id", (req, res, next) => {
    db.get(`SELECT * FROM trackers WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({"error": err.message});
            return;
        }
        if (!row) {
            res.status(404).json({"error": `No tracker with id ${req.params.id} found!`});
            return;
        }
        res.json(row);
    });
});

app.post("/api/tracker", (req, res, next) => {
    if (!req.body.habit) {
        res.status(400).json({"error": "No habit specified in query parameter."});
        return;
    }

    var columns = "(habit";
    var values = [req.body.habit];
    var valuesPlaceholder = '(?';

    if (req.body.first_tracked_day) {
        columns += ", first_tracked_day";
        values.push(req.body.first_tracked_day);
        valuesPlaceholder += ", ?";
    }

    if (req.body.color) {
        columns += ", color";
        values.push(req.body.color);
        valuesPlaceholder += ", ?";
    }

    if (req.body.color_failure) {
        columns += ", color_failure";
        values.push(req.body.color_failure);
        valuesPlaceholder += ", ?";
    }

    if (req.body.color_neutral) {
        columns += ", color_neutral";
        values.push(req.body.color_neutral);
        valuesPlaceholder += ", ?";
    }

    columns += ")";
    valuesPlaceholder += ")";

    db.run(`INSERT INTO trackers ${columns} VALUES ${valuesPlaceholder}`, values, (err) => {
        if (err) {
            res.status(500).json({"error": err.message});
            return;
        }
        res.json({"message":"Ok"});
    });
});

app.patch("/api/tracker/:id", (req, res, next) => {
    var data = {
        habit: req.body.habit,
        first_tracked_day: req.body.first_tracked_day,
        color: req.body.color,
        color_failure: req.body.color_failure,
        color_neutral: req.body.color_neutral
    }
    db.run(
        `UPDATE trackers SET 
           habit = COALESCE(?, habit), 
           first_tracked_day = COALESCE(?, first_tracked_day), 
           color = COALESCE(?, color),
           color_failure = COALESCE(?, color_failure),
           color_neutral = COALESCE(?, color_neutral)
           WHERE id = ?`,
        [data.habit, data.first_tracked_day, data.color, data.color_failure, data.color_neutral, req.params.id],
        function(err, result) {
            if (err) {
                res.status(500).json({"error": err.message});
                return;
            }
            if (this.changes == 0) {
                res.status(400).json({"error": "No changes were made."});
                return;
            }
            res.json({
                message: "success",
                changes: this.changes
            })
    });
});

app.delete("/api/tracker/:id", (req, res, next) => {
    db.run(
        'DELETE FROM trackers WHERE id = ?',
        req.params.id,
        function(err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            if (this.changes == 0) {
                res.status(400).json({"error": "No changes were made."});
                return;
            }
            res.json({"message":"deleted", changes: this.changes})
    });
})

app.get("/api/habits", (req, res, next) => {
    if (!req.query.habit) {
        res.status(400).json({"error": "No habit specified in query parameter."});
        return;
    }

    // TODO: Could validate req.query.to and req.query.from before using.
    var to = req.query.to ? req.query.to : new Date().toISOString().slice(0, 10); 
    var from = req.query.from ? req.query.from : getFirstDayOfWeek52WeeksAgo(new Date()).toISOString().slice(0, 10);

    var sql = `SELECT date, status FROM habits WHERE habit = '${req.query.habit}' AND date BETWEEN '${from}' AND '${to}'`;
    db.all(sql, (err, rows) => {
        if (err) {
            res.status(500).json({"error": err.message});
            return;
        }
        map = {}
        for (row of rows) {
            map[row.date] = row.status;
        }
        res.json(map);
    });
});

app.post("/api/habits", (req, res, next) => {
    var errors = [];

    if (!req.body.habit) {
        errors.push("No habit specified in body.");
    }

    if (!req.body.status) {
        errors.push("No status specified in body.")
    }

    if (errors.length) {
        res.status(400).json({"error": errors.join(" ")});
        return;
    }

    var sql;
    if (!req.body.date) {
        sql = `REPLACE INTO habits (habit, status) VALUES ('${req.body.habit}', '${req.body.status}')`;
    } else {
        sql = `REPLACE INTO habits (date, habit, status) VALUES ('${req.body.date}', '${req.body.habit}', '${req.body.status}')`;
    }

    db.run(sql, (err) => {
        if (err) {
            res.status(500).json({"error": err.message});
            return;
        }
        res.json({"message":"Ok"});
    });

    err = pushToTidbyt(req.body.habit)
    if (err) {
        console.log("Error when pushing to Tidbyt: " + err)
    }
});

// Default response for any other requests.
app.use(function(req, res) {
    res.json({"message":"404!"})
    res.status(404);
});

function pushToTidbyt(habit, color, first_tracked_day = "", color_failure = "", color_neutral = "") {
    if (!habit) {
        console.log("Can't push to tidbyt device; no habit defined.")
        return
    }

    var render_command = `pixlet render tidbyt_tracker.star habit=${habit}`
    
    if (color) {
        render_command += ` color=${color}`
    }

    if (first_tracked_day) {
        render_command += ` first_tracked_day=${first_tracked_day}`
    }

    if (color_failure) {
        render_command += ` color_failure=${color_failure}`
    }

    if (color_neutral) {
        render_command += ` color_neutral=${color_neutral}`
    }

    exec(render_command, (err, stdout, stderr) => {
        if (err) {
            return err;
        }
        exec(`pixlet push -i ${habit}Tracker -t ${TIDBYT_API_TOKEN} ${TIDBYT_DEVICE_ID} tidbyt_tracker.webp`, (err, stdout, stderr) => {
            if (err) {
                return err;
            }
        });
    });
}


function getFirstDayOfWeek52WeeksAgo(date) {
    var firstDayOfWeek = new Date(date.setDate(date.getDate() - date.getDay())); 
    var result = new Date(firstDayOfWeek);
    result.setDate(firstDayOfWeek.getDate() - 52 * 7);
    return result;
}