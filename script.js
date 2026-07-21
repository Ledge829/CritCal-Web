console.log("We are live ~ Ledge");

// Shared across every page -- loaded here first so analyze.js and
// characters.js can both use it without redeclaring it (a duplicate
// `const API_BASE` in a second <script> tag would be a fatal
// SyntaxError, since plain scripts share one global scope).
const API_BASE = "https://critcal.onrender.com";

// ---------- Time-of-day greeting (homepage only) ----------
const greeting = document.querySelector(".greeting-text");

if (greeting) {
    const hour = new Date().getHours();
    if (hour < 12) {
        greeting.textContent = "Good morning";
    } else if (hour < 18) {
        greeting.textContent = "Good afternoon";
    } else {
        greeting.textContent = "Good evening";
    }
}

// ---------- Mobile nav drawer ----------
const menuButton = document.querySelector(".menu-button");
const mobileNav = document.querySelector(".mobile-nav");

function closeMobileNav() {
    menuButton?.classList.remove("is-open");
    mobileNav?.classList.remove("is-open");
    menuButton?.setAttribute("aria-expanded", "false");
}

menuButton?.addEventListener("click", () => {
    const willOpen = !mobileNav?.classList.contains("is-open");
    menuButton.classList.toggle("is-open", willOpen);
    mobileNav?.classList.toggle("is-open", willOpen);
    menuButton.setAttribute("aria-expanded", String(willOpen));
});

mobileNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileNav);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileNav();
});

// ---------- Furina flavor message (homepage only) ----------
const messages = [
    "Ready for another evaluation?",
    "Let's optimize another build.",
    "Hope your artifact rolls were kind.",
    "Transparent scoring starts here.",
    "Every point explained.",
];

const furinaMessage = document.querySelector(".furina-message-text");

if (furinaMessage) {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    furinaMessage.textContent = `"${randomMessage}"`;
}

// ---------- API status indicator (homepage only) ----------
const statusDot = document.querySelector(".status-dot");
const statusLabel = document.querySelector(".status-label");

if (statusDot && typeof API_BASE !== "undefined") {
    fetch(`${API_BASE}/ping`)
        .then((r) => {
            if (r.ok) {
                statusDot.classList.add("online");
                if (statusLabel) statusLabel.textContent = "API Online";
            } else {
                throw new Error("bad status");
            }
        })
        .catch(() => {
            statusDot.classList.add("offline");
            if (statusLabel) statusLabel.textContent = "API Waking Up";
        });
}


// ---------- UID Search Logic ----------
const uidInput = document.getElementById("uid-input");
const searchBtn = document.getElementById("search-btn");
const resultArea = document.getElementById("result-area");

async function searchUid() {
    const uid = uidInput.value.trim();
    if (!uid) return;

    resultArea.innerHTML = '<div class="loading-card"><div class="spinner"></div><p>Fetching showcase...</p></div>';

    try {
        const response = await fetch(`${API_BASE}/rate/uid`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed");

        // UI: Showcase grid
        resultArea.innerHTML = `
            <div class="detailed-result">
                <h3>Showcased Characters</h3>
                <div class="character-showcase-grid" id="char-grid"></div>
            </div>
        `;
        
        // This is a placeholder for the logic to populate characters based on Enka's response.
        // Requires full integration to map character icons.
        
    } catch (err) {
        resultArea.innerHTML = `<div class="result-card error-card"><h3>Error</h3><p>${err.message}</p></div>`;
    }
}

searchBtn?.addEventListener("click", searchUid);
uidInput?.addEventListener("keypress", (e) => { if (e.key === "Enter") searchUid(); });

