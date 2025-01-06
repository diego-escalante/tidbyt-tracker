var config = require("config");

const express = require("express");
const app = express();

// Load up the cron tasks
const cron = require('./cron/tidbyt-cron.js');

const trackersRoutes = require('./routes/api/trackers-routes.js');
const habitsRoutes = require('./routes/api/habits-routes.js');
const mainRoutes = require('./routes/routes.js');

const HTTP_PORT = 8000;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'))

// Start server
app.listen(HTTP_PORT, () => {
    console.log("Tidbyt Tracker running on port " + HTTP_PORT);
    // On startup, always push the trackers with the data.
    console.log("Tidbyt Tracker just started! Updating all trackers!")
    cron.getDataAndUpdateTrackers();
});

app.get('/', (req, res) => {
    res.render('index');
  });

// Main routes.
app.use('/', mainRoutes);

// Trackers API
app.use('/api/trackers', trackersRoutes);

// Habits API
app.use('/api/habits', habitsRoutes);

// Default response for any other requests.
app.use(function(req, res) {
    res.json({"message":"404!"})
    res.status(404);
});
