var express = require("express");
var app = express();
var db = require("./database.js");
const {exec} = require('child_process');

var HTTP_PORT = 8000;

var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Start server
app.listen(HTTP_PORT, () => {
    console.log("Tidbyt Tracker running on port " + HTTP_PORT);
});


// Root endpoint
app.get("/", (req, res, next) => {
    res.json({"message":"Ok"});
});

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

function pushToTidbyt(habit) {
    exec(`pixlet render tidbyt_tracker.star habit=${habit}`, (err, stdout, stderr) => {
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        if (err) {
            return err;
        }
        exec(`pixlet push -i ${habit}Tracker inanely-breezy-elevated-topi-85d tidbyt_tracker.webp`, (err, stdout, stderr) => {
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