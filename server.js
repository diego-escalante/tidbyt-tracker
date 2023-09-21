var express = require("express");
var app = express();

const trackersRoutes = require('./routes/api/trackers-routes.js');
const habitsRoutes = require('./routes/api/habits-routes.js');

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

// Trackers API
app.use('/api/trackers', trackersRoutes);

// Habits API
app.use('/api/habits', habitsRoutes);

// Default response for any other requests.
app.use(function(req, res) {
    res.json({"message":"404!"})
    res.status(404);
});
