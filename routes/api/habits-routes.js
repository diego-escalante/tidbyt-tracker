const router = require('express').Router();
const db = require("../../db/db.js");
const tidbyt = require('../../tidbyt/tidbyt.js');

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

    db.createHabit(req.body.habit, req.body.status, req.body.date)
        .then(result => {
            // This is not very atomic, and having to get all trackers is yucky.
            db.getTrackers()
                .then(rows => {
                    var tracker = rows.find((row) => row.habit == req.body.habit);
                    if (tracker) {
                        tidbyt.pushTracker(tracker.habit, tracker.color, tracker.first_tracked_day, tracker.color_failure, tracker.color_neutral, false)
                            .then(result => {
                                res.json({"message": "Ok"});
                                return;
                            })
                            .catch(error => {
                                res.status(500).json({"error": `Updated data successfully but unable to push to Tidbyt: ${error.message}. Consider trying to push again.`});
                                return;
                            })
                    } else {
                        res.status(500).json({"error": `Updated data successfully but unable to push to Tidbyt because no tracker with the habit ${row.body.habit} was found.`});
                        return;
                    }
                })
                .catch(error => {
                    res.status(500).json({"error": `Updated data successfully but unable to get trackers to push to Tidbyt: ${error.message}. Consider trying to push again.`});
                    return;
                })
        })
        .catch(error => {
            res.status(500).json({"error": `Unable to save habit data: ${error.message}`});
            return;
        })    
});

module.exports = router;