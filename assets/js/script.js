const mainContainer = document.getElementsByTagName('main')[0];
let workTimer;
let relaxTimer;

// Defines the pomodoro time spans
const workTime = 10;
const relaxTime = 5;

// Saves time left before reload
window.addEventListener('beforeunload', function (event) {
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
        localStorage.setItem('productivity_points', '0');
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

    // Checks if taskname exist and changes it
    if (localStorage.getItem('taskname') === null) {
        localStorage.setItem('taskname', 'Set the name of your task')
    }
    const tasknameDiv = document.getElementById('taskname');
    tasknameDiv.textContent = localStorage.getItem('taskname');

    // Adds event listener for timer buttons
    document.getElementById('start').addEventListener('click', function () {
        startTimer(workTime);
    });

    document.getElementById('pause').addEventListener('click', function () {
        pauseTimer();
    });

    document.getElementById('reset').addEventListener('click', function () {
        resetTimer();
    });

    startTimerFromSavedState();

    // Edit taskname
    document.getElementById('edit').addEventListener('click', function () {
        const tasknameDiv = document.getElementById('taskname');
        if (tasknameDiv.contentEditable === "true") {
            tasknameDiv.contentEditable = "false";
            this.textContent = "Edit";
            localStorage.setItem("taskname", tasknameDiv.textContent);
        } else {
            tasknameDiv.contentEditable = "true";
            this.textContent = "Save";
        }
    });

    // Load history from localStorage
    loadHistory();

    // Load shop from items.json
    loadShop();

    // Load new quote
    getQuote();
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

    // Starts work timer based on status
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
                createHistoryItem();
                localStorage.setItem('status', 'relax');
                startTimer(relaxTime);
            }
        }, 1000);
    } // Checks if timer is paused and starts with saved time
    else if (localStorage.getItem('timer_status') === 'paused') {
        localStorage.setItem('timer_status', 'running');
        let currentValue = localStorage.getItem('time_left');
        workTimer = setInterval(function () {
            if (currentValue > 0) {
                currentValue -= 1;
                timer.innerHTML = formatTime(currentValue);
            } else {
                if (localStorage.getItem('status') === 'work') {
                    localStorage.setItem('status', 'relax')
                    clearInterval(workTimer);
                    workTimer = null;
                    startTimer(relaxTime);
                } else if (localStorage.getItem('status') === 'relax') {
                    localStorage.setItem('status', 'work')
                    clearInterval(relaxTimer);
                    relaxTimer = null;
                    startTimer(workTime);
                }
            }
        }, 1000);
    } else if (localStorage.getItem('status') === 'relax') {
        localStorage.setItem('timer_status', 'running');

        relaxTimer = setInterval(function () {
            if (currentValue > 0) {
                currentValue -= 1;
                timer.innerHTML = formatTime(currentValue);
            } else {
                clearInterval(relaxTimer);
                relaxTimer = null;
                localStorage.setItem('status', 'work');
                localStorage.setItem('timer_status', 'stopped');
                startTimer(workTime);
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
 * Resets timer.
 */
function resetTimer() {
    if (localStorage.getItem('status') === 'work') {
        clearInterval(workTimer);
        workTimer = null;
    } else if (localStorage.getItem('status') === 'relax') {
        clearInterval(relaxTimer);
        relaxTimer = null;
    }
    localStorage.setItem('timer_status', 'stopped')
    localStorage.setItem('status', 'none')
    localStorage.setItem('time_left', 1500)
    const timer = document.getElementById('timer');
    timer.innerHTML = '25:00';
}

/**
 * Starts the timer with the saved state from local storage, if available.
 */
function startTimerFromSavedState() {
    const timerStatus = localStorage.getItem('timer_status');
    const timeLeft = localStorage.getItem('time_left');
    const status = localStorage.getItem('status');

    if (timerStatus === 'paused' && timeLeft && (status === 'work' || status === 'relax')) {
        const timer = document.getElementById('timer');
        timer.innerHTML = formatTime(timeLeft);
    }
}

function createHistoryItem() {
    const historyContainer = document.getElementById("history-container");
    const finishedTask = document.createElement('div');
    finishedTask.className = 'history-item';

    const lastTaskname = document.createElement("p");
    const lastTasknameText = document.createTextNode(localStorage.getItem('taskname'));
    lastTaskname.appendChild(lastTasknameText);

    const lastReward = document.createElement("p");
    const lastRewardText = document.createTextNode('20 PP');
    lastReward.appendChild(lastRewardText);

    finishedTask.appendChild(lastTaskname);
    finishedTask.appendChild(lastReward);
    historyContainer.appendChild(finishedTask);

    saveHistoryItem(localStorage.getItem('taskname'), '100 PP');
    localStorage.setItem('productivity_points', parseInt(localStorage.getItem('productivity_points', '0')) + 100);
    getQuote();
}

function saveHistoryItem(taskName, reward) {
    let history = localStorage.getItem('history');

    // If there is no history, set it to an empty array
    if (history === null) {
        history = [];
    } else {
        history = JSON.parse(history);
    }

    // Create a new history item
    let newHistoryItem = {
        taskName: taskName,
        reward: reward
    };

    history.push(newHistoryItem);
    localStorage.setItem('history', JSON.stringify(history));
}

function loadHistory() {
    const historyContainer = document.getElementById("history-container");
    let history = localStorage.getItem('history');

    // If there is no history, set it to an empty array
    if (history === null) {
        history = [];
    } else {
        history = JSON.parse(history);
    }

    // Loop through each item in the history
    for (let i = 0; i < history.length; i++) {
        const finishedTask = document.createElement('div');
        finishedTask.className = 'history-item';

        const lastTaskname = document.createElement("p");
        const lastTasknameText = document.createTextNode(history[i].taskName);
        lastTaskname.appendChild(lastTasknameText);

        const lastReward = document.createElement("p");
        const lastRewardText = document.createTextNode(history[i].reward);
        lastReward.appendChild(lastRewardText);

        finishedTask.appendChild(lastTaskname);
        finishedTask.appendChild(lastReward);

        historyContainer.appendChild(finishedTask);
    }
}

function openTab(event, tabName) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    const tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "flex";
    event.currentTarget.className += " active";
}

// Set the default tab to be opened
document.getElementById("timer-container").style.display = "flex";
document.querySelector(".tablinks").classList.add("active");

async function loadShop() {
    const response = await fetch('assets/items.json');
    const items = await response.json();

    const shopContainer = document.getElementById("shop-container");

    // Loop through each item in the JSON array
    for (let i = 0; i < items.length; i++) {
        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';

        // Create a div for item details
        const itemDetails = document.createElement('div');
        itemDetails.className = 'item-details';

        // Create and append item name
        const itemName = document.createElement("h3");
        itemName.className = 'item-name';
        const itemNameText = document.createTextNode(items[i].name);
        itemName.appendChild(itemNameText);
        itemDetails.appendChild(itemName);

        // Create and append item description
        const itemDescription = document.createElement("p");
        itemDescription.className = 'item-description';
        const itemDescriptionText = document.createTextNode(items[i].description);
        itemDescription.appendChild(itemDescriptionText);
        itemDetails.appendChild(itemDescription);

        // Create and append item cost
        const itemCost = document.createElement("p");
        itemCost.className = 'item-cost';
        const itemCostText = document.createTextNode(`Cost: ${items[i].cost}`);
        itemCost.appendChild(itemCostText);
        itemDetails.appendChild(itemCost);

        // Create a div for the buy button
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        // Create and append buy button
        const buyButton = document.createElement("button");
        buyButton.className = 'buy-button';
        buyButton.textContent = 'Buy';
        buyButton.setAttribute('data-name', items[i].name);
        buyButton.setAttribute('data-cost', items[i].cost);
        buyButton.addEventListener('click', buyItem);
        buttonContainer.appendChild(buyButton);

        // Append item details and button container to the shop item
        shopItem.appendChild(itemDetails);
        shopItem.appendChild(buttonContainer);

        // Append the shop item to the shop container
        shopContainer.appendChild(shopItem);
    }
}

function buyItem(event) {
    const button = event.target;
    const itemCost = parseInt(button.getAttribute('data-cost'));
    let points = parseInt(localStorage.getItem('productivity_points'));

    if (points >= itemCost) {
        points -= itemCost;
        localStorage.setItem('productivity_points', points);
        saveBoughtItem(button.getAttribute('data-name'));
        alert("Purchase successful!");
    } else {
        alert("Not enough points!");
    }
}

function saveBoughtItem(name) {
    let items = localStorage.getItem('items');

    // If there are no items, set it to an empty array
    if (items === null) {
        items = [];
    } else {
        items = JSON.parse(items);
    }

    // Check if the item already exists in the items array
    let itemExists = false;
    for (let i = 0; i < items.length; i++) {
        if (items[i].item === name) {
            items[i].amount += 1;
            itemExists = true;
            break;
        }
    }

    // If the item does not exist, create a new list item
    if (!itemExists) {
        let newItem = {
            item: name,
            amount: 1
        };
        items.push(newItem);
    }

    localStorage.setItem('items', JSON.stringify(items));
}

async function getQuote() {
    const response = await fetch("https://api.quotable.io/random");
    const quotes = await response.json();
    const quote = document.getElementById('quote');
    const author = document.getElementById('author');
    quote.innerHTML = quotes.content;
    author.innerHTML = `-${quotes.author}`;
}