const router = require('express').Router();
const db = require("../../db/db.js");
const pushToTidbyt = require('../../tidbyt/tidbyt.js');

router.get("/", (req, res, next) => {
    db.getHabits(req.query.habit, req.query.from, req.query.to)
        .then(result => {
            res.json(result);
            return;
        })
        .catch(error => {
            res.status(500).json({"error": error.message});
        })
});

router.post("/", (req, res, next) => {
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

module.exports = router;

function getFirstDayOfWeek52WeeksAgo(date) {
    var firstDayOfWeek = new Date(date.setDate(date.getDate() - date.getDay())); 
    var result = new Date(firstDayOfWeek);
    result.setDate(firstDayOfWeek.getDate() - 52 * 7);
    return result;
}
