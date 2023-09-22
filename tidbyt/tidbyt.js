const {exec} = require('child_process');

var config = require("config");
const tidbyt_device_id = config.get("tidbyt_device_id");
const tidbyt_api_token = config.get("tidbyt_api_token");
const tidbyt_path = "./tidbyt";

function pushTrackersToTidbyt(trackers, background) {
    return new Promise((resolve, reject) => {
        Promise.all(trackers.map(tracker => pushTrackerToTidbyt(tracker.habit, tracker.color, tracker.first_tracked_day, tracker.color_failure, tracker.color_neutral, background)))
            .then(results => {
                resolve(results);
            })
            .catch(error => {
                reject(error);
            });
    });
}

function pushTrackerToTidbyt(habit, color = "", first_tracked_day = "", color_failure = "", color_neutral = "", background) {
    return new Promise((resolve, reject) => {
        if (!habit) {
            return reject(new Error("Can't push to tidbyt device; no habit defined."));
        }

        var render_command = `pixlet render ${tidbyt_path}/tidbyt_tracker.star habit="${habit}"`;
        
        if (color) {
            render_command += ` color=${color}`;
        }
    
        if (first_tracked_day) {
            render_command += ` first_tracked_day=${first_tracked_day}`;
        }
    
        if (color_failure) {
            render_command += ` color_failure=${color_failure}`;
        }
    
        if (color_neutral) {
            render_command += ` color_neutral=${color_neutral}`;
        }

        // Installation IDs cannot have spaces, only alphanumeric characters.
        var installation_id = `${habit.replace(" ", "")}Tracker`;
        var push_command = `pixlet push -i ${installation_id} -t ${tidbyt_api_token} ${tidbyt_device_id} ${tidbyt_path}/tidbyt_tracker.webp`;
        if (background) {
            push_command += " -b";
        }
    
        console.log(`Rendering ${habit} tracker with command: ${render_command}`)
        exec(render_command, (error, stdout, stderr) => {
            if (stdout) {
                console.log(`Pixlet render stdout: ${stdout}`);
            }
            if (stderr) {
                console.log(`Pixlet render stderr: ${stderr}`);
            }
            if (error) {
                return reject(error);
            }
            console.log(`Pushing ${habit} tracker.`)
            exec(push_command, (error, stdout, stderr) => {
                if (stdout) {
                    console.log(`Pixlet push stdout: ${stdout}`);
                }
                if (stderr) {
                    console.log(`Pixlet push stderr: ${stderr}`);
                }
                if (error) {
                    return reject(error);
                }
                return resolve(habit);
            });
        });
    });
}

module.exports = pushTrackersToTidbyt;