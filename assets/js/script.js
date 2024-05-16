const mainContainer = document.getElementsByTagName('main')[0];

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
    
    //Adds event listener for buttons
    document.getElementById('start').addEventListener('click', function() {
        startTimer();
    });
}

function startTimer() {
    setInterval(function() {
        const timer = document.getElementById('timer');
        let currentValue = parseInt(timer.innerHTML, 10);
        currentValue += 1;
        timer.innerHTML = currentValue;
    }, 1000);
}