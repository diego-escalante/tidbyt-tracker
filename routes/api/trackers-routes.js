const router = require('express').Router();
const db = require("../../db/db.js");

router.get("/", (req, res, next) => {
    db.getTrackers()
        .then(rows => {
            res.json(rows);
            return;
        })
        .catch(error => {
            console.error(error);
            res.status(500).json({"error": error.message});
            return;
        });
});

router.get("/:id", (req, res, next) => {
    db.getTracker(req.params.id)
        .then(row => {
            if (!row) {
                res.status(404).json({"error": `No tracker with id ${req.params.id} found!`});
                return;
            }
            res.json(row);
            return;
        })
        .catch(error => {
            console.error(error);
            res.status(500).json({"error": error.message});
        });
});

router.post("/", (req, res, next) => {
    if (!req.body.habit) {
        res.status(400).json({"error": "No habit specified in query parameter."});
        return;
    }

    db.createTracker(req.body.habit, req.body.first_tracked_day, req.body.color, req.body.color_failure, req.body.color_neutral)
        .then(_ => {
            res.json({"message":"Ok"});
            return;
        })
        .catch(error => {
            console.error(error);
            res.status(500).json({"error": error.message});
        });
});

router.patch("/:id", (req, res, next) => {
    db.updateTracker(req.params.id, req.body.habit, req.body.first_tracked_day, req.body.color, req.body.color_failure, req.body.color_neutral)
        .then(result => {
            res.json({
                message: "success",
                changes: result
            });
            return;
        })
        .catch(error => {
            res.status(500).json({"error": error.message})
        });
});

router.delete("/:id", (req, res, next) => {
    db.deleteTracker(req.params.id)
        .then(result => {
            res.json({
                message: "deleted",
                changes: result
            });
            return;
        })
        .catch(error => {
            res.status(500).json({"error": error.message});
        });
});

module.exports = router;
