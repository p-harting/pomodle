const mainContainer = document.getElementsByTagName('main')[0];
let workTimer;
let pauseTimer;

document.addEventListener('DOMContentLoaded', function() {
    // Checks if username is stored, if not loads login.html
    if (localStorage.getItem('username')) {
        loadContent("main.html");
    } else {
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

    if(page === "login.html") {
        document.getElementById('login-form').addEventListener('submit', function(event) {
            event.preventDefault();
            let username = document.getElementById('username').value;
            let goal = document.getElementById('goal').value;
            localStorage.setItem("username", username);
            localStorage.setItem("goal", goal);
            loadContent("main.html");
        });
    }
    
    // Adds event listener for buttons
    document.getElementById('start').addEventListener('click', function() {
        startWorkTimer();
    });
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
 * Starts a countdown timer for a 25 minute work period, updating the displayed time every second.
 * When the timer reaches zero, it starts the 5 minute pause timer.
 */
function startWorkTimer() {
    const timer = document.getElementById('timer');
    let currentValue = 1500;
    timer.innerHTML = formatTime(currentValue);

    // Checks if work timer is already running
    if (workTimer) {
        return;
    }

    // Sets work timer
    workTimer = setInterval(function() {
        if (currentValue > 0) {
            currentValue -= 1;
            timer.innerHTML = formatTime(currentValue);
        } else {
            clearInterval(workTimer);
            workTimer = null;
            startPauseTimer();
        }
    }, 1000);
}

/**
 * Starts a countdown timer for a 5 minute pause period, updating the displayed time every second.
 * When the timer reaches zero, it starts the 25 minute work timer.
 */
function startPauseTimer() {
    const timer = document.getElementById('timer');
    let currentValue = 300;
    timer.innerHTML = formatTime(currentValue);

    // Checks if pause timer is already running
    if (pauseTimer) {
        return;
    }

    // Sets pause timer
    pauseTimer = setInterval(function() {
        if (currentValue > 0) {
            currentValue -= 1;
            timer.innerHTML = formatTime(currentValue);
        } else {
            clearInterval(pauseTimer);
            pauseTimer = null;
            startWorkTimer();
        }
    }, 1000);
}