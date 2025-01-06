function setHabitOptions() {
    const habitSelect = document.getElementById('habitSelect');
    fetch('/api/trackers')
    .then(response => response.json())
    .then(trackers => {
        trackers.forEach(tracker => {
            const option = document.createElement('option');
            option.value = tracker.habit;
            option.textContent = tracker.habit;
            habitSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error fetching trackers:', error);
    });
}

function setDefaultDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('dateInput').value = `${year}-${month}-${day}`;
}

// Function to make a POST request to the backend API
function logHabit(status) {
    const date = document.getElementById('dateInput').value;
    const habit = document.getElementById('habitSelect').value;
  
    var message = "";

    fetch('/api/habits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "date": date,
        "status": status,
        "habit": habit
      }),
    })
    .then(response => {
        if (!response.ok) {
            document.getElementById('message').innerText = `Unable to log habit data!`;
            throw new Error();
        }
        switch (status) {
            case 'SUCCESS':
                message = "Great job, stud!";
                break;
            case 'FAILURE':
                message = "Dang. Next time.";
                break;
            case 'SKIPPED':
                message = "Day has been skipped.";
                break;
        }
        return fetch(`/update-trackers/${habit}`);
    })
    .then(response => {
        if (!response.ok) {
            document.getElementById('message').innerText = `Logged habit data, but failed to update the display!`;
            throw new Error();
        }
        document.getElementById('message').innerText = message;
    })
    .catch(error => {
        // Do nothing.
    });
  }

function printCurrentDate() {
    const selectedDate = document.getElementById('dateInput').value;
    const selectedStatus = document.querySelector('input[name="status"]:checked').value;
    alert(`Selected Date: ${selectedDate}\nSelected Status: ${selectedStatus}`);
}

function onLoad() {
    setHabitOptions();
    setDefaultDate();
    document.getElementById("dateInput").addEventListener("change", () => {
        const outputDiv = document.getElementById("message").innerText = "";
    });
}

window.onload = onLoad;