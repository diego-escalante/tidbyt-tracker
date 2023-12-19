const router = require('express').Router();
const db = require("../../db/db.js");
const tidbyt = require('../../tidbyt/tidbyt.js');

router.get("/", (req, res, next) => {
    try {
        res.json(db.getHabits(req.query.habit, req.query.from, req.query.to));
    } catch (e) {
        console.error(e);
        res.status(500).json({"error": e.message});
    }
});

router.get("/:id", (req, res, next) => {
    try {
        var row = db.getHabit(req.params.id);
        if (!row) {
            res.status(400).json({"error": `No habit with id ${req.params.id} found!`});
        } else {
            res.json(row);
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({"error": e.message});
    }
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

    try {
        db.createOrUpdateHabit(req.body.habit, req.body.status, req.body.date);
        res.json({"message":"Ok"});
    } catch (e) {
        console.error(e);
        res.status(500).json({"error": e.message});
    }
        //TODO: This old code used to push the new habit data to the display. It should be elsewhere probably.
        // .then(result => {
        //     // This is not very atomic, and having to get all trackers is yucky.
        //     db.getTrackers()
        //         .then(rows => {
        //             var tracker = rows.find((row) => row.habit == req.body.habit);
        //             if (tracker) {
        //                 tidbyt.pushTracker(tracker.habit, tracker.color, tracker.first_tracked_day, tracker.color_failure, tracker.color_neutral, false)
        //                     .then(result => {
        //                         res.json({"message": "Ok"});
        //                         return;
        //                     })
        //                     .catch(error => {
        //                         res.status(500).json({"error": `Updated data successfully but unable to push to Tidbyt: ${error.message}. Consider trying to push again.`});
        //                         return;
        //                     })
        //             } else {
        //                 res.status(500).json({"error": `Updated data successfully but unable to push to Tidbyt because no tracker with the habit ${row.body.habit} was found.`});
        //                 return;
        //             }
        //         })
        //         .catch(error => {
        //             res.status(500).json({"error": `Updated data successfully but unable to get trackers to push to Tidbyt: ${error.message}. Consider trying to push again.`});
        //             return;
        //         })
        // })  
});

router.delete("/:id", (req, res, next) => {
    try {
        var info = db.deleteHabit(req.params.id)
        if (info.changes > 0) {
            res.json({
                message: "deleted",
                changes: info.changes
            });
        } else {
            res.status(400).json({"error": `No habit was deleted; no habit with id ${req.params.id}`});
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({"error": e.message});
    }
});

module.exports = router;