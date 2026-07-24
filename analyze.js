// API_BASE, escapeHtml, capitalize, GRADE_COLORS, tierClass from script.js;
// icon/color helpers from icons.js; portraitInnerHtml from portraits.js.

const form = document.getElementById("analyze-form");
const submitButton = document.getElementById("submit-button");
const resultArea = document.getElementById("result-area");
const characterInput = document.getElementById("character");
const characterOptions = document.getElementById("character-options");
const characterPreview = document.getElementById("character-preview");
const previewAvatar = document.getElementById("preview-avatar");
const previewText = document.getElementById("preview-text");

let allCharacters = [];
let _lastResult = null;
let _lastCharInfo = null;

// ---------- Autocomplete + character preview data ----------
cachedFetch(`${API_BASE}/characters`, "characters")
    .then((data) => {
        allCharacters = data.characters || [];
        const frag = document.createDocumentFragment();
        for (const c of allCharacters) {
            const opt = document.createElement("option");
            opt.value = c.name;
            frag.appendChild(opt);
        }
        characterOptions.appendChild(frag);
        updateCharacterPreview();
    })
    .catch(() => {
        // Autocomplete/preview just won't populate -- not fatal, plain text still works.
    });

// ---------- Live character preview as the person types ----------
function updateCharacterPreview() {
    const typed = characterInput.value.trim().toLowerCase();
    const match = typed && allCharacters.find((c) => c.name.toLowerCase() === typed);

    if (!match) {
        characterPreview.classList.remove("is-visible");
        return;
    }

    previewAvatar.style.setProperty("--el-color", elementColor(match.element));
    previewAvatar.innerHTML = portraitInnerHtml(match);
    const roles = (match.roles || []).join(" · ");
    previewText.textContent = `${capitalize(match.element || "")}${match.rarity ? ` · ${match.rarity}★` : ""}${roles ? ` · ${roles}` : ""}`;
    characterPreview.classList.add("is-visible");
}

characterInput.addEventListener("input", updateCharacterPreview);

// ---------- Pre-fill from ?character=Name (used by the browse page) ----------
const params = new URLSearchParams(window.location.search);
const prefillCharacter = params.get("character");
if (prefillCharacter) {
    characterInput.value = prefillCharacter;
}
// Pre-fill other fields from shareable URL params
const paramMap = {
    "crit_rate": "crit_rate",
    "crit_dmg": "crit_dmg",
    "atk": "atk",
    "hp": "hp",
    "def": "def",
    "em": "elemental_mastery",
    "er": "energy_recharge",
    "weapon": "weapon",
    "artifacts": "artifacts",
};
Object.keys(paramMap).forEach((key) => {
    const val = params.get(key);
    const el = document.getElementById(paramMap[key]);
    if (val && el) el.value = val;
});

// ---------- Form submission ----------
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const body = {
        character: characterInput.value.trim(),
        crit_rate: document.getElementById("crit_rate").value,
        crit_dmg: document.getElementById("crit_dmg").value,
        atk: document.getElementById("atk").value,
    };

    const weapon = document.getElementById("weapon").value.trim();
    if (weapon) body.weapon = weapon;

    const artifacts = document.getElementById("artifacts").value.trim();
    if (artifacts) body.artifacts = artifacts;

    const hp = document.getElementById("hp").value;
    if (hp) body.hp = hp;

    const def = document.getElementById("def").value;
    if (def) body.def = def;

    const em = document.getElementById("elemental_mastery").value;
    if (em) body.elemental_mastery = em;

    const er = document.getElementById("energy_recharge").value;
    if (er) body.energy_recharge = er;

    const scaling = document.getElementById("character_scaling").value;
    if (scaling) body.character_scaling = scaling;

    const idealRatio = document.getElementById("ideal_crit_ratio").value;
    if (idealRatio) body.ideal_crit_ratio = idealRatio;

    setLoadingState();

    try {
        const data = await callApi(body);
        if (data.error) {
            renderError(data.error);
        } else {
            renderResult(data);
            // Store character info for the download button.
            const typed = (body.character || "").trim().toLowerCase();
            _lastCharInfo = typed && allCharacters.find((c) => c.name.toLowerCase() === typed) || null;
            _lastResult = data;
        }
    } catch (err) {
        renderError(
            "Couldn't reach CritCal's API. This can happen if the server is still waking up " +
            "(free hosting sleeps after inactivity) -- try again in about a minute."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = `${UI_ICONS.analyze}Rate this build`;
    }
});

async function callApi(body) {
    const response = await fetch(`${API_BASE}/rate/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return response.json();
}

function setLoadingState() {
    submitButton.disabled = true;
    submitButton.innerHTML = `<span class="spinner" style="width:17px;height:17px;border-width:2px;"></span> Calculating...`;
    resultArea.hidden = false;
    resultArea.innerHTML = `
        <div class="result-card loading-card">
            <div class="spinner"></div>
            <p id="loading-message">Calculating your build...</p>
        </div>
    `;
    setTimeout(() => {
        const msg = document.getElementById("loading-message");
        if (msg) {
            msg.textContent = "Still working -- the server may be waking up from sleep. This can take up to a minute on the first request.";
        }
    }, 6000);
    resultArea.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderError(message) {
    resultArea.innerHTML = `
        <div class="result-card error-card">
            <h3>Couldn't complete that analysis</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

function renderResult(data) {
    const gradeColor = data.embed_color || GRADE_COLORS[data.grade] || "#5B9BD6";

    const weaponBadge = data.weapon_tier
        ? `<span class="tier-badge ${tierClass(data.weapon_tier)}">${escapeHtml(data.weapon_tier)}</span>`
        : "";
    const artifactBadge = data.artifact_tier
        ? `<span class="tier-badge ${tierClass(data.artifact_tier)}">${escapeHtml(data.artifact_tier)}</span>`
        : "";

    const equipmentSection = (data.weapon_name || data.primary_artifact_set_name) ? `
        <div class="result-section">
            <div class="result-section-title">${UI_ICONS.gem}Equipment</div>
            ${data.weapon_name ? `
                <div class="equipment-row">
                    <span><strong>${escapeHtml(data.weapon_name)}</strong><span>Weapon${data.weapon_refinement ? ` &middot; R${data.weapon_refinement}` : ""}</span></span>
                    ${weaponBadge}
                </div>` : ""}
            ${data.primary_artifact_set_name ? `
                <div class="equipment-row">
                    <span><strong>${escapeHtml(data.primary_artifact_set_name)}</strong><span>Artifacts &middot; ${data.primary_artifact_set_count}pc</span></span>
                    ${artifactBadge}
                </div>` : ""}
        </div>
    ` : "";

    const benchmarkSection = (data.benchmark_status && data.benchmark_status.length) ? `
        <div class="result-section">
            <div class="result-section-title">${UI_ICONS.shield}Benchmarks</div>
            <ul class="result-list">
                ${data.benchmark_status.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
            </ul>
        </div>
    ` : "";

    const recommendationsSection = (data.recommendations && data.recommendations.length) ? `
        <div class="result-section">
            <div class="result-section-title">${UI_ICONS.sparkle}Recommendations</div>
            <ul class="result-list">
                ${data.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
            </ul>
        </div>
    ` : "";

    resultArea.innerHTML = `
        <div class="result-card">

            <div class="grade-header">
                <div class="grade-circle" style="--grade-color: ${escapeHtml(gradeColor)}">
                    ${escapeHtml(data.grade || "?")}
                </div>
                <div>
                    <h2>${escapeHtml(data.character || "")}</h2>
                    <p class="build-title">${escapeHtml(data.build_title || "")}</p>
                </div>
            </div>

            <p class="grade-description">${escapeHtml(data.grade_description || "")}</p>

            <div class="score-row">
                <div class="score-chip">
                    <span class="score-value">${data.overall_score ?? "--"}</span>
                    <span class="score-label">Score</span>
                </div>
                <div class="score-chip">
                    <span class="score-value">${data.crit_value ?? "--"}</span>
                    <span class="score-label">Crit Value</span>
                </div>
                <div class="score-chip">
                    <span class="score-value">${data.crit_rate ?? "--"}% / ${data.crit_dmg ?? "--"}%</span>
                    <span class="score-label">Crit Ratio</span>
                </div>
            </div>

            <div class="result-section">
                <div class="result-section-title">${UI_ICONS.layers}Build Summary</div>
                <p>${escapeHtml(data.build_description || "")}</p>
            </div>

            ${equipmentSection}
            ${benchmarkSection}
            ${recommendationsSection}

            <div class="result-section" style="text-align:center; display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
                <button type="button" class="btn btn-ghost" id="download-card-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download Image
                </button>
                <button type="button" class="btn btn-primary" id="share-link-btn" style="font-size:13px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    Share Build
                </button>
            </div>

        </div>
    `;

    // Wire up the download + share buttons
    console.log("result rendered, share btn in DOM:", !!document.getElementById("share-link-btn"));
    setTimeout(wireButtons, 0);
}

function wireButtons() {
    // Download button
    const dlBtn = document.getElementById("download-card-btn");
    if (dlBtn) {
        dlBtn.addEventListener("click", async function () {
            if (!_lastResult) return;
            dlBtn.disabled = true;
            dlBtn.textContent = "Generating...";
            try {
                const blob = await window.generateRatingCard(_lastResult, _lastCharInfo || {});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = (_lastResult.character || "build") + "-rating.png";
                a.click();
                URL.revokeObjectURL(url);
            } catch (err) {
                console.error("Card generation failed:", err);
            } finally {
                dlBtn.disabled = false;
                dlBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download Image`;
            }
        });
    }

    // Share button — copies a shareable URL with the build params
    const shareBtn = document.getElementById("share-link-btn");
    if (shareBtn) {
        shareBtn.addEventListener("click", function () {
            if (!_lastResult) return;
            const params = new URLSearchParams();
            params.set("character", _lastResult.character || "");
            params.set("crit_rate", _lastResult.crit_rate != null ? _lastResult.crit_rate : "");
            params.set("crit_dmg", _lastResult.crit_dmg != null ? _lastResult.crit_dmg : "");
            params.set("atk", _lastResult.stats_used ? _lastResult.stats_used.atk || "" : "");
            if (_lastResult.stats_used) {
                if (_lastResult.stats_used.hp) params.set("hp", _lastResult.stats_used.hp);
                if (_lastResult.stats_used.def) params.set("def", _lastResult.stats_used.def);
                if (_lastResult.stats_used.elemental_mastery) params.set("em", _lastResult.stats_used.elemental_mastery);
                if (_lastResult.stats_used.energy_recharge) params.set("er", _lastResult.stats_used.energy_recharge);
            }
            if (_lastResult.weapon_name) params.set("weapon", _lastResult.weapon_name + (_lastResult.weapon_refinement ? " r" + _lastResult.weapon_refinement : ""));
            if (_lastResult.primary_artifact_set_name) params.set("artifacts", _lastResult.primary_artifact_set_count + "pc " + _lastResult.primary_artifact_set_name);

            const url = window.location.origin + "/analyze.html?" + params.toString();
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function () {
                    shareBtn.textContent = "Copied!";
                    setTimeout(function () { shareBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share`; }, 2000);
                }).catch(function () { prompt("Copy this link:", url); });
            } else {
                prompt("Copy this link:", url);
            }
        });
    }
}