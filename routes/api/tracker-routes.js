const router = require('express').Router();
const db = require("../../database.js");

router.get("/", (req, res, next) => {
    var sql = `SELECT * FROM trackers`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({"error": err.message});
            return;
        }
        res.json(rows);
    });
});

router.get("/:id", (req, res, next) => {
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

router.post("/", (req, res, next) => {
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

router.patch("/:id", (req, res, next) => {
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
            });
    });
});

router.delete("/:id", (req, res, next) => {
    db.run(
        'DELETE FROM trackers WHERE id = ?',
        req.params.id,
        function(err, result) {
            if (err){
                res.status(400).json({"error": res.message});
                return;
            }
            if (this.changes == 0) {
                res.status(400).json({"error": "No changes were made."});
                return;
            }
            res.json({"message":"deleted", changes: this.changes});
    });
});

module.exports = router;