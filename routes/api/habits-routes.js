const router = require('express').Router();
const db = require("../../db/db.js");
const tidbyt = require("../../tidbyt/tidbyt.js")
const {SqliteError} = require('better-sqlite3')

router.get("/", (req, res, next) => {
    try {
        res.json(db.getHabits(req.query.habit, req.query.from, req.query.to));
    } catch (e) {
        if (e instanceof SqliteError) {
            console.error(e);
            res.status(500).json({"error": e.message});
        } else {
            res.status(400).json({"error": e.message});
        }
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
        if (e instanceof SqliteError) {
            console.error(e);
            res.status(500).json({"error": e.message});
        } else {
            res.status(400).json({"error": e.message});
        }
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
        // Update display.
        tidbyt.pushTracker(db.getTrackerByHabit(req.body.habit))
        .then(result => res.json({"message":"Ok"}))
        .catch(error => new Error(error));
    } catch (e) {
        if (e instanceof SqliteError) {
            console.error(e);
            res.status(500).json({"error": e.message});
        } else {
            res.status(400).json({"error": e.message});
        }
    }
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
        if (e instanceof SqliteError) {
            console.error(e);
            res.status(500).json({"error": e.message});
        } else {
            res.status(400).json({"error": e.message});
        }
    }
});

module.exports = router;