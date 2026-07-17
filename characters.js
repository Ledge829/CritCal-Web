const API_BASE = "https://critcal.onrender.com";

const grid = document.getElementById("character-grid");
const searchInput = document.getElementById("search-input");
const elementFilter = document.getElementById("element-filter");
const resultCount = document.getElementById("result-count");

const ELEMENT_COLORS = {
    pyro: "#FF6B4A",
    hydro: "#4EA7FF",
    anemo: "#6FE0C0",
    electro: "#C79BFF",
    dendro: "#A8D24A",
    cryo: "#9BE3FF",
    geo: "#FFD86B",
};

let allCharacters = [];

grid.innerHTML = `<p class="loading-text">Loading characters...</p>`;

fetch(`${API_BASE}/characters`)
    .then((r) => r.json())
    .then((data) => {
        allCharacters = data.characters || [];
        render();
    })
    .catch(() => {
        grid.innerHTML = `
            <p class="loading-text">
                Couldn't reach CritCal's API. The server may be waking up from sleep --
                try refreshing in about a minute.
            </p>
        `;
    });

searchInput.addEventListener("input", render);
elementFilter.addEventListener("change", render);

function render() {
    const query = searchInput.value.trim().toLowerCase();
    const element = elementFilter.value;

    const filtered = allCharacters.filter((c) => {
        const matchesQuery = !query || c.name.toLowerCase().includes(query);
        const matchesElement = !element || c.element === element;
        return matchesQuery && matchesElement;
    });

    resultCount.textContent = `${filtered.length} character${filtered.length === 1 ? "" : "s"}`;

    if (!filtered.length) {
        grid.innerHTML = `<p class="loading-text">No characters match that search.</p>`;
        return;
    }

    grid.innerHTML = filtered.map((c) => {
        const color = ELEMENT_COLORS[c.element] || "#4EA7FF";
        const roles = (c.roles || []).join(" / ");
        return `
            <a class="character-card" href="analyze.html?character=${encodeURIComponent(c.name)}" style="--accent: ${color}">
                <span class="character-element">${capitalize(c.element || "")}</span>
                <span class="character-name">${escapeHtml(c.name)}</span>
                <span class="character-roles">${escapeHtml(roles)}</span>
            </a>
        `;
    }).join("");
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }
      
