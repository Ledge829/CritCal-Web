// API_BASE comes from script.js, icon helpers come from icons.js (both loaded before this file).

const grid = document.getElementById("character-grid");
const searchInput = document.getElementById("search-input");
const elementPills = document.querySelectorAll(".element-pill");
const resultCount = document.getElementById("result-count");

let allCharacters = [];
let activeElement = "";

grid.innerHTML = renderSkeletons(12);

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

elementPills.forEach((pill) => {
    pill.addEventListener("click", () => {
        elementPills.forEach((p) => p.classList.remove("is-active"));
        pill.classList.add("is-active");
        activeElement = pill.dataset.element || "";
        render();
    });
});

function render() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = allCharacters.filter((c) => {
        const matchesQuery = !query || c.name.toLowerCase().includes(query);
        const matchesElement = !activeElement || c.element === activeElement;
        return matchesQuery && matchesElement;
    });

    resultCount.textContent = `${filtered.length} character${filtered.length === 1 ? "" : "s"}`;

    if (!filtered.length) {
        grid.innerHTML = `<p class="loading-text">No characters match that search.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(characterCardHtml).join("");
}

function characterCardHtml(c) {
    const color = elementColor(c.element);
    const roles = (c.roles || []).join(" · ");
    const initial = (c.name || "?").charAt(0).toUpperCase();

    return `
        <a class="character-card" href="analyze.html?character=${encodeURIComponent(c.name)}" style="--el-color: ${color}">
            <div class="character-portrait">${initial}</div>
            <div class="character-info">
                <span class="character-name">${escapeHtml(c.name)}</span>
                <div class="character-meta">
                    <span class="element-badge" style="--el-color: ${color}">
                        ${elementIcon(c.element)}
                        ${capitalize(c.element || "")}
                    </span>
                    ${c.weapon_type ? `<span class="weapon-type-icon" title="${capitalize(c.weapon_type)}">${weaponTypeIcon(c.weapon_type)}</span>` : ""}
                    ${rarityStars(c.rarity)}
                </div>
                ${roles ? `<span class="character-roles">${escapeHtml(roles)}</span>` : ""}
            </div>
        </a>
    `;
}

function renderSkeletons(count) {
    return Array.from({ length: count }).map(() => `
        <div class="character-card" style="pointer-events:none;">
            <div class="skeleton" style="width:52px;height:52px;border-radius:15px;"></div>
            <div class="character-info">
                <div class="skeleton" style="width:70%;height:15px;"></div>
                <div class="skeleton" style="width:50%;height:12px;margin-top:6px;"></div>
            </div>
        </div>
    `).join("");
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
}
