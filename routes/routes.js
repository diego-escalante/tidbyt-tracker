const router = require('express').Router();
const tidbyt = require('../tidbyt/tidbyt.js');
const db = require('../db/db.js');
const dayjs = require('dayjs');
const {SqliteError} = require('better-sqlite3');

router.get("/log", (req, res, next) => {
    if (!req.query.habit) {
        res.status(400).json({"error": "Missing habit query parameter."});
    }
    var date = req.query.date;
    if (!date) {
        date = dayjs().format('YYYY-MM-DD').toString();
    }
    var status = req.query.status;
    if (!status) {
        status = "SUCCESS";
    }
    try {
        db.createOrUpdateHabit(req.query.habit, status, date);
        var tracker = db.getTrackerByHabit(req.query.habit);
        if (tracker) {
            tidbyt.pushTrackers([tracker], false)
            .then(result => {
                res.json({"message": "Ok"});
                return;
            })
            .catch(err => {
                throw err;
            });
        } else {
            res.json({"message":"Ok"});
        }
    } catch (e) {
        if (e instanceof SqliteError) {
            console.error(e);
            res.status(500).json({"error": e.message});
        } else {
            res.status(400).json({"error": e.message});
        }
    }
});

router.get("/update-trackers", (req, res, next) => {
    try {
        tidbyt.pushTrackers(db.getTrackers(), true)
            .then(result => {
                res.json({"message":"Ok"});
            })
            .catch(err => {
                throw err
            });
    } catch (e) {
        console.error(e);
        res.status(500).json({"error": e.message})
    }
});

module.exports = router;