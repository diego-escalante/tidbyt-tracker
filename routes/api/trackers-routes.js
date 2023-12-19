const router = require('express').Router();
const db = require("../../db/db.js");

router.get("/", (req, res, next) => {
    try {
        res.json(db.getTrackers())
    } catch (e) {
        console.error(e);
        res.status(500).json({"error": e.message});
    }
});

router.get("/:id", (req, res, next) => {
    try {
        var row = db.getTracker(req.params.id)
        if (!row) {
            res.status(404).json({"error": `No tracker with id ${req.params.id} found!`});
        } else {
            res.json(row);
        }
    } catch (e) {
        console.error(e)
        res.status(500).json({"error": e.message});
    }
});

router.post("/", (req, res, next) => {
    if (!req.body.habit) {
        res.status(400).json({"error": "No habit specified in query parameter."});
        return;
    }

    try {
        db.createTracker(req.body.habit, req.body.first_tracked_day, req.body.color, req.body.color_failure, req.body.color_neutral);
        res.json({"message":"Ok"});
    } catch (e) {
        console.error(e);
        res.status(500).json({"error": e.message});
    }
});

router.patch("/:id", (req, res, next) => {
    try {
        if (!req.body.habit && !req.body.first_tracked_day && !req.body.color && !req.body.color_failure && !req.body.color_neutral) {
            res.status(400).json({"error": "No changes were made; No relevant fields were provided to update."});
            return;
        }
        var info = db.updateTracker(req.params.id, req.body.habit, req.body.first_tracked_day, req.body.color, req.body.color_failure, req.body.color_neutral)
        if (info.changes > 0) {
            res.json({
                message: "success",
                changes: info.changes
            });
        } else {
            res.status(400).json({"error": `No changes were made; no tracker with id ${req.params.id}`});
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({"error": e.message});
    }
});

router.delete("/:id", (req, res, next) => {
    try {
        var info = db.deleteTracker(req.params.id)
        if (info.changes > 0) {
            res.json({
                message: "deleted",
                changes: info.changes
            });
        } else {
            res.status(400).json({"error": `No tracker was deleted; no tracker with id ${req.params.id}`});
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({"error": e.message});
    }
});

module.exports = router;
