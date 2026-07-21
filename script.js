console.log("We are live ~ Ledge");

// Shared across every page
const API_BASE = "https://critcal.onrender.com";

// ---------- UID Search Logic ----------
const uidInput = document.getElementById("uid-input");
const searchBtn = document.getElementById("search-btn");
const resultArea = document.getElementById("result-area");

async function searchUid() {
    const uid = uidInput.value.trim();
    if (!uid) return;

    // Show loading
    resultArea.innerHTML = `
        <div class="result-card loading-card">
            <div class="spinner"></div>
            <p>Fetching build data from Enka.Network...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_BASE}/rate/uid`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid }),
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Failed to fetch build");

        // Render success card
        resultArea.innerHTML = `
            <div class="result-card">
                <div class="grade-header">
                    <div class="grade-circle" style="--grade-color: ${data.embed_color}">
                        ${data.grade}
                    </div>
                    <div>
                        <h2>${data.character}</h2>
                        <p class="build-title">${data.build_title}</p>
                    </div>
                </div>
                <p class="grade-description">${data.grade_description}</p>
            </div>
        `;
    } catch (err) {
        resultArea.innerHTML = `
            <div class="result-card error-card">
                <h3>Error</h3>
                <p>${err.message}</p>
            </div>
        `;
    }
}

searchBtn?.addEventListener("click", searchUid);
uidInput?.addEventListener("keypress", (e) => { if (e.key === "Enter") searchUid(); });

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
