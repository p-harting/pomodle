const mainContainer = document.getElementsByTagName('main')[0];

// Checks if username is stored, if not loads login.html
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('username')) {
        loadContent("../../index.html");
    } else {
        loadContent("../../login.html");
    }
});

/**
 * Loads content from a specified page URL and replaces the HTML content of the main container element with it.
 */
async function loadContent(page) {
    let response = await fetch(page);
    let content = await response.text();
    mainContainer.innerHTML = content;

    if(page === "../../login.html") {
        document.getElementById('login-form').addEventListener('submit', function(event) {
            event.preventDefault();
            let username = document.getElementById('username').value;
            let goal = document.getElementById('goal').value;
            localStorage.setItem("username", username);
            localStorage.setItem("goal", goal);
            loadContent("../../index.html");
        });
    }
}