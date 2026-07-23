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

// ---------- Shared helpers (used by analyze.js, characters.js, uid-search.js) ----------

/**
 * Escapes a string for safe insertion into HTML body text.
 * Uses DOM parsing (not regex) so it's correct for any text content.
 */
function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
}

/**
 * Capitalizes the first character of a string, lowercasing the rest.
 */
function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Maps grade letters (S/A/B/C/D) to their hex embed colors.
 * Used by the analyze and UID-search result renderers.
 */
const GRADE_COLORS = {
    S: "#6BC7AE", A: "#5B9BD6", B: "#B18FE0", C: "#D6B96C", D: "#E0899B",
};

/**
 * Converts a weapon/artifact tier string to a CSS class name,
 * e.g. "Type Mismatch" -> "tier-type-mismatch", "BiS" -> "tier-bis".
 */
function tierClass(tier) {
    if (!tier) return "";
    return "tier-" + tier.toLowerCase().replace(/\s+/g, "-");
}

// (No cursor-tracked hover effects here on purpose -- a mousemove
// listener firing on every pixel of pointer movement is exactly the
// kind of "unnecessary JS" the calmer, performance-first design is
// meant to avoid, and the flatter card style doesn't call for it.)

// ---------- Live character count (any page with a #char-count-* element) ----------
const countElements = document.querySelectorAll('[id^="char-count"]');
if (countElements.length > 0 && typeof API_BASE !== "undefined") {
    fetch(`${API_BASE}/characters`)
        .then((r) => r.json())
        .then((data) => {
            const count = data.count;
            if (count) {
                countElements.forEach((el) => { el.textContent = count; });
            }
        })
        .catch(() => {
            // Leave the static fallback ("120+") in place.
        });
}

// ---------- Homepage UID search: redirect to uid-search.html ----------
const uidInput = document.getElementById("uid-input-home");
const uidBtn = document.getElementById("uid-search-home-btn");

function goToUidSearch() {
    const uid = (uidInput.value || "").trim();
    if (!uid) {
        uidInput.focus();
        return;
    }
    window.location.href = `uid-search.html?uid=${encodeURIComponent(uid)}`;
}

uidBtn?.addEventListener("click", goToUidSearch);
uidInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") goToUidSearch();
});
