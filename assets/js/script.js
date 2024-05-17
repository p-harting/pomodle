const mainContainer = document.getElementsByTagName('main')[0];
let workTimer;
let relaxTimer;

//Saves time left before reload
window.addEventListener('beforeunload', function(event) {
    localStorage.setItem('time_left', reverseTimeFormat(timer.innerHTML));
    localStorage.setItem('timer_status', 'paused');
});

document.addEventListener('DOMContentLoaded', function () {
    // Checks if username is stored, if not loads login.html
    if (localStorage.getItem('username')) {
        loadContent("main.html");
    } else {
        localStorage.setItem('timer_status', 'stopped');
        localStorage.setItem('status', 'none');
        loadContent("login.html");
    }
});

/**
 * Loads content from a specified page URL and replaces the HTML content of the main container element with it.
 */
async function loadContent(page) {
    let response = await fetch(page);
    let content = await response.text();
    mainContainer.innerHTML = content;

    if (page === "login.html") {
        document.getElementById('login-form').addEventListener('submit', function (event) {
            event.preventDefault();
            let username = document.getElementById('username').value;
            let goal = document.getElementById('goal').value;
            localStorage.setItem("username", username);
            localStorage.setItem("goal", goal);
            loadContent("main.html");
        });
    }

    // Adds event listener for timer buttons
    document.getElementById('start').addEventListener('click', function () {
        startTimer(100);
    });

    document.getElementById('pause').addEventListener('click', function () {
        pauseTimer();
    });

    startTimerFromSavedState();
}

/**
 * Formats a given number of seconds into a string with minutes and seconds.
 */
function formatTime(seconds) {
    // Calculates minutes and seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    let minutesString = String(minutes);
    let secondsString = String(remainingSeconds);

    // Adds zeros if necessary
    if (minutesString.length < 2) {
        minutesString = '0' + minutesString;
    }
    if (secondsString.length < 2) {
        secondsString = '0' + secondsString;
    }

    const formattedTime = minutesString + ':' + secondsString;

    return formattedTime;
}

/**
 * Converts a time string in the format "minutes:seconds" into total seconds.
 */
function reverseTimeFormat(time) {
    let timeParts = time.split(':');

    let minutes = parseInt(timeParts[0]);
    let seconds = parseInt(timeParts[1]);

    let totalSeconds = (minutes * 60) + seconds;

    return totalSeconds;
}

/**
 * Initiates a countdown timer with the specified duration in seconds.
 */
function startTimer(seconds) {
    const timer = document.getElementById('timer');
    let currentValue = seconds;

    // Checks if a timer is running
    if (relaxTimer || workTimer) {
        console.log('Already running');
        return;
    }

    //Starts worktimer based on status
    if (localStorage.getItem('timer_status') === 'stopped' &&
        (localStorage.getItem('status') === 'work' ||
            localStorage.getItem('status') === 'none')) {

        localStorage.setItem('timer_status', 'running');
        localStorage.setItem('status', 'work');

        workTimer = setInterval(function () {
            if (currentValue > 0) {
                currentValue -= 1;
                timer.innerHTML = formatTime(currentValue);
            } else {
                clearInterval(workTimer);
                workTimer = null;
            }
        }, 1000);
    } //Checks if timer is paused and starts with saved time
    else if (localStorage.getItem('timer_status') === 'paused') {
        localStorage.setItem('timer_status', 'running');
        let currentValue = localStorage.getItem('time_left');
        workTimer = setInterval(function () {
            if (currentValue > 0) {
                currentValue -= 1;
                timer.innerHTML = formatTime(currentValue);
            } else {
                clearInterval(workTimer);
                workTimer = null;
            }
        }, 1000);
    }
}

/**
 * Pauses the currently running countdown timer.
 */
function pauseTimer() {
    const timer = document.getElementById('timer');
    if (localStorage.getItem('timer_status') === 'running') {
        localStorage.setItem('timer_status', 'paused');
        localStorage.setItem('time_left', reverseTimeFormat(timer.innerHTML));

        if (localStorage.getItem('status') === 'work') {
            clearInterval(workTimer);
            workTimer = null;
        } else if (localStorage.getItem('status') === 'relax') {
            clearInterval(relaxTimer);
            relaxTimer = null;
        }
    }
}

/**
 * Starts the timer with the saved state from local storage, if available.
 */
function startTimerFromSavedState() {
    const timerStatus = localStorage.getItem('timer_status');
    const timeLeft = localStorage.getItem('time_left');
    const status = localStorage.getItem('status');

    if (timerStatus === 'paused' && timeLeft && (status === 'work' || status === 'relax')) {
        startTimer(parseInt(timeLeft));
    }
}