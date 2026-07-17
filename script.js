console.log("We are live ~ Ledge • July 16");

// Time-of-day greeting -- only present on the homepage, so this must
// not assume the element exists (script.js is shared across every page).
const greeting = document.querySelector(".greeting");

if (greeting) {
    const hour = new Date().getHours();

    if (hour < 12) {
        greeting.textContent = "☀️ Good morning.";
    } else if (hour < 18) {
        greeting.textContent = "🌤️ Good afternoon.";
    } else {
        greeting.textContent = "🌙 Good evening.";
    }
}

// Mobile navigation toggle
const menuButton = document.querySelector(".menu-button");
const desktopNav = document.querySelector(".desktop-nav");

menuButton?.addEventListener("click", () => {
    desktopNav?.classList.toggle("nav-open");
});

// Close the mobile menu after tapping a link, so it doesn't stay open
// on the page you just navigated to.
desktopNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
        desktopNav.classList.remove("nav-open");
    });
});

// Homepage startup message -- only present on the homepage.
const messages = [

    "Ready for another evaluation?",

    "Let's optimize another build.",

    "Hope your artifact rolls were kind.",

    "Transparent scoring starts here.",

    "Every point explained."

];

const randomMessage = messages[
    Math.floor(Math.random() * messages.length)
];

const furinaMessage = document.querySelector(".furina-message p");

if(furinaMessage){

    furinaMessage.textContent = `"${randomMessage}"`;

}
