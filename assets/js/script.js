const mainContainer = document.getElementsByTagName('main')[0];
let workTimer;
let relaxTimer;
let productivityPointTimer;

// Defines the pomodoro time spans
const workTime = 1500;
const relaxTime = 300;

// Saves time left before reload
window.addEventListener('beforeunload', function (event) {
    localStorage.setItem('time_left', reverseTimeFormat(timer.innerHTML));
    localStorage.setItem('timer_status', 'paused');
});

document.addEventListener('DOMContentLoaded', async function () {
    // Checks if username is stored, if not loads login.html
    if (localStorage.getItem('username')) {
        const path = window.location.pathname;
        const file = path.split("/").pop();
        if (file === '404.html') {
            await loadContent('404.html');
        }
        await loadContent('main.html');
    } else {
        localStorage.setItem('timer_status', 'stopped');
        localStorage.setItem('status', 'none');
        localStorage.setItem('productivity_points', 0.0);
        updateButtonStates();
        localStorage.setItem('multiplicator', 0);
        await loadContent('login.html');
    }
});

/**
 * Loads content from a specified page URL and replaces the HTML content of the main container element with it.
 */
async function loadContent(page) {
    let response = await fetch(page);
    let content = await response.text();
    mainContainer.innerHTML = content;

    if (page === 'login.html') {
        document.getElementById('login-form').addEventListener('submit', function (event) {
            event.preventDefault();
            const usernameInput = document.getElementById('username-input').value;
            const goalInput = document.getElementById('goal-input').value;
            localStorage.setItem('username', usernameInput);
            localStorage.setItem('goal', goalInput);
            loadContent('main.html');
        });
    } else {
        document.getElementById('music-player').style.display = 'flex';
    }

    // Load history from localStorage
    loadHistory();

    // Load shop from items.json
    loadShop();

    // Set the default tab to be opened
    document.getElementById('timer-container').style.display = 'flex';
    document.querySelector('.tablinks').classList.add('active');

    // Load new quote
    getQuote();

    // Start Idle Interval
    startIdle();

    // Change username in header
    const username = document.getElementById('username');
    username.innerHTML = localStorage.getItem('username');

    // Load a new quote
    getQuote();

    // Initialize the audio player
    audioPlayer();

    // Load help
    loadHelp();

    // Checks if taskname exist and changes it
    if (localStorage.getItem('taskname') === null) {
        localStorage.setItem('taskname', 'Set the name of your task');
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
        if (tasknameDiv.contentEditable === 'true') {
            tasknameDiv.contentEditable = 'false';
            this.textContent = 'Edit';
            localStorage.setItem('taskname', tasknameDiv.textContent);
        } else {
            tasknameDiv.contentEditable = 'true';
            this.textContent = 'Save';
        }
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

    // Start timer based on the current status
    const status = localStorage.getItem('status');
    const timerStatus = localStorage.getItem('timer_status');
    const timeLeft = parseInt(localStorage.getItem('time_left'));

    if (timerStatus === 'paused' && timeLeft > 0) {
        currentValue = timeLeft;
    }

    if (status === 'work' || status === 'none') {
        localStorage.setItem('timer_status', 'running');
        localStorage.setItem('status', 'work');

        workTimer = setInterval(function () {
            if (currentValue > 0) {
                currentValue -= 1;
                timer.innerHTML = formatTime(currentValue);
            } else {
                clearInterval(workTimer);
                const audio = new Audio('assets/music/notification.mp3');
                audio.play();
                workTimer = null;
                createHistoryItem();
                localStorage.setItem('status', 'relax');
                startTimer(relaxTime);
            }
        }, 1000);
    } else if (status === 'relax') {
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
    localStorage.setItem('timer_status', 'stopped');
    localStorage.setItem('status', 'none');
    localStorage.setItem('time_left', 1500);
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

/**
 * Creates a new history item for the finished task, updates the productivity points, and refreshes the UI.
 */
function createHistoryItem() {
    const historyContainer = document.getElementById('history-container');
    const finishedTask = document.createElement('div');
    finishedTask.className = 'history-item';

    const lastTaskname = document.createElement('p');
    const lastTasknameText = document.createTextNode(localStorage.getItem('taskname'));
    lastTaskname.appendChild(lastTasknameText);

    const lastReward = document.createElement('p');
    const lastRewardText = document.createTextNode('100 PP');
    lastReward.appendChild(lastRewardText);

    finishedTask.appendChild(lastTaskname);
    finishedTask.appendChild(lastReward);
    historyContainer.appendChild(finishedTask);

    saveHistoryItem(localStorage.getItem('taskname'), '100 PP');
    localStorage.setItem('productivity_points', parseFloat(localStorage.getItem('productivity_points', '0.0')) + 100);
    showToast('You may now relax.');
    updateButtonStates();
    const points = document.getElementById('points');
    points.innerHTML = localStorage.getItem('productivity_points');
    getQuote();
}


/**
 * Saves a new history item consisting of a task name and its associated reward to the local storage.
 */
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

/**
 * Loads the history of tasks and their associated rewards from local storage and displays them in the history container.
 */
function loadHistory() {
    const historyContainer = document.getElementById('history-container');
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

        const lastTaskname = document.createElement('p');
        const lastTasknameText = document.createTextNode(history[i].taskName);
        lastTaskname.appendChild(lastTasknameText);

        const lastReward = document.createElement('p');
        const lastRewardText = document.createTextNode(history[i].reward);
        lastReward.appendChild(lastRewardText);

        finishedTask.appendChild(lastTaskname);
        finishedTask.appendChild(lastReward);

        historyContainer.appendChild(finishedTask);
    }
}

/**
 * Opens the specified tab by displaying its content and setting its corresponding tab link as active.
 * Hides all other tab contents and removes the 'active' class from other tab links.
 */
function openTab(event, tabName) {
    const tabcontent = document.getElementsByClassName('tabcontent');
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = 'none';
    }

    const tablinks = document.getElementsByClassName('tablinks');
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(' active', '');
    }

    document.getElementById(tabName).style.display = 'flex';
    event.currentTarget.className += ' active';
}

/**
 * Loads the items available in the shop by fetching data from the 'items.json' file.
 * Initializes and updates button states based on the user's points and previously purchased items.
 * Listens for click events on buy buttons to handle item purchase.
 */
async function loadShop() {
    const response = await fetch('assets/items.json');
    const items = await response.json();

    const shopContainer = document.getElementById('shop-container');

    // Clear existing items
    shopContainer.innerHTML = '';

    // Loop through each item in the JSON array
    for (let i = 0; i < items.length; i++) {
        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';

        // Create a div for the image
        const itemImage = document.createElement('img');
        itemImage.className = 'item-image';
        const imageName = items[i].name.toLowerCase().split(' ').join('-');
        itemImage.src = `assets/images/items/${imageName}.jpg`;

        // Create a div for item details
        const itemDetails = document.createElement('div');
        itemDetails.className = 'item-details';

        // Create and append item name
        const itemName = document.createElement('h3');
        itemName.className = 'item-name';
        const itemNameText = document.createTextNode(items[i].name);
        itemName.appendChild(itemNameText);
        itemDetails.appendChild(itemName);

        // Create and append item description
        const itemDescription = document.createElement('p');
        itemDescription.className = 'item-description';
        const itemDescriptionText = document.createTextNode(items[i].description);
        itemDescription.appendChild(itemDescriptionText);
        itemDetails.appendChild(itemDescription);

        // Create and append item cost
        const itemCost = document.createElement('p');
        itemCost.className = 'item-cost';
        const itemCostText = document.createTextNode(`Cost: ${items[i].cost}`);
        itemCost.appendChild(itemCostText);
        itemDetails.appendChild(itemCost);

        // Create and append item rate
        const itemRate = document.createElement('p');
        itemRate.className = 'item-rate';
        const itemRateText = document.createTextNode(`Rate: ${items[i].rate}`);
        itemRate.appendChild(itemRateText);
        itemDetails.appendChild(itemRate);

        // Create a div for the buy button
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        // Create and append buy button
        const buyButton = document.createElement('button');
        buyButton.className = 'buy-button pink-button';
        buyButton.textContent = 'Buy';
        buyButton.setAttribute('data-name', items[i].name);

        let selectedItem = null; // Initialize selectedItem outside of the if block
        let allItems = localStorage.getItem('items');
        allItems = JSON.parse(allItems);

        if (allItems) { // Check if allItems is not null or undefined
            for (let j = 0; j < allItems.length; j++) {
                if (allItems[j].item === items[i].name) {
                    selectedItem = allItems[j];
                    break;
                }
            }
        }

        // Calculate the data-cost
        if (selectedItem) {
            const dataCost = items[i].cost * selectedItem.amount;
            buyButton.setAttribute('data-cost', dataCost);
        } else {
            buyButton.setAttribute('data-cost', items[i].cost);
        }

        buyButton.setAttribute('data-rate', items[i].rate);
        buyButton.addEventListener('click', buyItem);
        buttonContainer.appendChild(buyButton);

        // Append item image, details and button container to the shop item
        shopItem.appendChild(itemImage);
        shopItem.appendChild(itemDetails);
        shopItem.appendChild(buttonContainer);

        // Append the shop item to the shop container
        shopContainer.appendChild(shopItem);
    }

    // Update button states based on current points
    updateShopPrices();
    updateButtonStates();
}


/**
 * Updates the states of buy buttons based on the user's productivity points.
 * Disables buy buttons with costs higher than the available points and applies a grey style.
 */
function updateButtonStates() {
    let points = parseFloat(localStorage.getItem('productivity_points'));
    let buyButtons = document.querySelectorAll('.buy-button');

    buyButtons.forEach(function (button) {
        let cost = parseInt(button.getAttribute('data-cost'));
        if (points < cost) {
            button.disabled = true;
            button.classList.add('grey-button');
        } else {
            button.disabled = false;
            button.classList.remove('grey-button');
        }
    });

    // Update points display
    let pointsDisplay = document.getElementById('points');
    pointsDisplay.innerHTML = points;
}

/**
 * Updates the displayed prices of items in the shop based on their data-cost attributes.
 */
function updateShopPrices() {
    const shopItems = document.querySelectorAll('.shop-item');

    shopItems.forEach(function (shopItem) {
        const buyButton = shopItem.querySelector('.buy-button');
        if (buyButton) {
            const itemCost = buyButton.getAttribute('data-cost');
            const itemCostElement = shopItem.querySelector('.item-cost');
            if (itemCostElement) {
                itemCostElement.textContent = `Cost: ${itemCost}`;
            }
        }
    });
}


/**
 * Handles the purchase of an item when its corresponding buy button is clicked.
 */
function buyItem(event) {
    const button = event.target;
    const itemCost = parseInt(button.getAttribute('data-cost'));
    let points = parseInt(localStorage.getItem('productivity_points'));

    if (points >= itemCost) {
        points -= itemCost;
        localStorage.setItem('productivity_points', points);
        updateButtonStates();
        saveBoughtItem(button.getAttribute('data-name'));
        showToast('Purchase successful!');
        const multiplicator = parseInt(localStorage.getItem('multiplicator'));
        localStorage.setItem('multiplicator', multiplicator + parseInt(button.getAttribute('data-rate')));
        loadShop();
        updateShopPrices();

    } else {
        showToast('Not enough points!');
    }
}

/**
 * Saves the purchased item by updating the local storage with the item's name and quantity.
 */
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

/**
 * Retrieves a random quote from the Quotable API and displays it.
 */
async function getQuote() {
    const response = await fetch('https://api.quotable.io/random');
    const quotes = await response.json();
    const quote = document.getElementById('quote');
    const author = document.getElementById('author');
    quote.innerHTML = quotes.content;
    author.innerHTML = `-${quotes.author}`;
}

/**
 * Starts the idle timer for earning productivity points.
 * Points are only incremented if the user's status is set to 'work' and the timer is running.
 */
function startIdle() {
    if (productivityPointTimer) {
        clearInterval(productivityPointTimer);
    }

    productivityPointTimer = setInterval(function () {
        if (localStorage.getItem('status') === 'work' && localStorage.getItem('timer_status') === 'running') {
            const pointsElement = document.getElementById('points');
            let points = parseFloat(localStorage.getItem('productivity_points'));
            const increment = parseFloat(localStorage.getItem('multiplicator')) / 10;
            points += increment;
            localStorage.setItem('productivity_points', points.toFixed(1));
            pointsElement.innerHTML = points.toFixed(1);
            updateButtonStates();
        }
    }, 1000);
}


/**
 * Sets up an audio player with basic functionalities such as play/pause, previous/next song,
 * seek bar control, and volume control.
 */
function audioPlayer() {
    const audioPlayer = document.createElement('audio');
    const playPauseButton = document.getElementById('play-pause');
    const prevButton = document.getElementById('prev-song');
    const nextButton = document.getElementById('next-song');
    const seekBar = document.getElementById('seek-bar');
    const volumeControl = document.getElementById('volume-control');

    // Array of music files
    const musicFiles = [
        'assets/music/space.mp3',
        'assets/music/layitoff.mp3',
        'assets/music/timeout.mp3',
        'assets/music/toolate.mp3'
    ];

    let currentSongIndex = 0;

    // Function to load the current song
    function loadSong() {
        audioPlayer.src = musicFiles[currentSongIndex];
    }

    // Load the first song but don't play it
    loadSong();

    // Play/Pause functionality
    playPauseButton.addEventListener('click', function () {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseButton.innerHTML = '<i class="fa fa-pause"></i>';
        } else {
            audioPlayer.pause();
            playPauseButton.innerHTML = '<i class="fa fa-play"></i>';
        }
    });

    // Previous song functionality
    prevButton.addEventListener('click', function () {
        currentSongIndex = (currentSongIndex - 1 + musicFiles.length) % musicFiles.length;
        loadSong();
        audioPlayer.play();
        playPauseButton.innerHTML = '<i class="fa fa-pause"></i>';
    });

    // Next song functionality
    nextButton.addEventListener('click', function () {
        currentSongIndex = (currentSongIndex + 1) % musicFiles.length;
        loadSong();
        audioPlayer.play();
        playPauseButton.innerHTML = '<i class="fa fa-pause"></i>';
    });

    // Seek bar functionality
    audioPlayer.addEventListener('timeupdate', function () {
        seekBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    });

    seekBar.addEventListener('input', function () {
        audioPlayer.currentTime = (seekBar.value / 100) * audioPlayer.duration;
    });

    // Volume control functionality
    volumeControl.addEventListener('input', function () {
        audioPlayer.volume = volumeControl.value;
    });
}


/**
 * Sets up the functionality to load and display the help section pop up.
 */
function loadHelp() {
    document.getElementById("help-button").addEventListener("click", function () {
        document.getElementById("help").style.display = "flex";
    });

    document.querySelector(".close-help").addEventListener("click", function () {
        document.getElementById("help").style.display = "none";
    });
}

/**
 * Validates the input of the username
 */
function validateUsernam() {
    const input = document.getElementById('username-input');
    const trimmedValue = input.value.trim();
    if (trimmedValue.length >= 1 && trimmedValue.length <= 12) {
        input.setCustomValidity('');
    } else {
        input.setCustomValidity('Username must be between 1 and 12 characters.');
    }
}

/**
 * Shows a toast in the bottom right corner
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    const toastContainer = document.getElementById('toast-container');
    toastContainer.appendChild(toast);

    setTimeout(function () {
        toast.classList.add('show');
    }, 100);

    setTimeout(function () {
        toast.classList.remove('show');

        setTimeout(function () {
            toastContainer.removeChild(toast);
        }, 500);
    }, 3000);
}