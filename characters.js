// API_BASE from script.js, icon/color helpers from icons.js, portraitHtml from portraits.js.

const grid = document.getElementById("character-grid");
const searchInput = document.getElementById("search-input");
const elementPills = document.querySelectorAll(".element-pill");
const resultCount = document.getElementById("result-count");

let allCharacters = [];
let activeElement = "";

grid.innerHTML = renderSkeletons(12);

cachedFetch(`${API_BASE}/characters`, "characters")
    .then((data) => {
        if (!data || !data.characters) throw new Error("no data");
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
        elementPills.forEach((p) => {
            p.classList.remove("is-active");
            p.setAttribute("aria-pressed", "false");
        });
        pill.classList.add("is-active");
        pill.setAttribute("aria-pressed", "true");
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

    return `
        <a class="character-card" href="analyze.html?character=${encodeURIComponent(c.name)}" style="--el-color: ${color}">
            ${portraitHtml(c, "character-portrait")}
            <div class="character-info">
                <span class="character-name">${escapeHtml(c.name)}</span>
                <div class="character-meta">
                    <span class="element-badge" style="--el-color: ${color}">
                        ${elementIcon(c.element)}
                        ${capitalize(c.element || "")}
                    </span>
                    ${c.weapon_type ? `<span class="weapon-type-icon" title="${capitalize(c.weapon_type)}" aria-hidden="true">${weaponTypeIcon(c.weapon_type)}</span>` : ""}
                    ${rarityStars(c.rarity)}
                </div>
                ${roles ? `<span class="character-roles">${escapeHtml(roles)}</span>` : ""}
            </div>
        </a>
    `;
}

function renderSkeletons(count) {
    return Array.from({ length: count }).map(() => `
        <div class="character-card" style="pointer-events:none;" aria-hidden="true">
            <div class="skeleton" style="width:48px;height:48px;border-radius:13px;"></div>
            <div class="character-info">
                <div class="skeleton" style="width:70%;height:14px;"></div>
                <div class="skeleton" style="width:50%;height:11px;margin-top:6px;"></div>
            </div>
        </div>
    `).join("");
}




