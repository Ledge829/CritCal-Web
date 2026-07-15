console.log("We are live ~ Ledge • July 16");

const greeting = document.querySelector(".greeting");

const hour = new Date().getHours();

if(hour < 12){

    greeting.textContent = "☀️ Good morning.";

}
else if(hour < 18){

    greeting.textContent = "🌤️ Good afternoon.";

}
else{

    greeting.textContent = "🌙 Good evening.";

}

// Placeholder for future menu functionality
const menuButton = document.querySelector(".menu-button");

menuButton?.addEventListener("click", () => {

    console.log("Open mobile navigation");

});

// Homepage startup message
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
