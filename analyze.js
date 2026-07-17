const API_BASE = "https://critcal.onrender.com";

const form = document.getElementById("analyze-form");
const submitButton = document.getElementById("submit-button");
const resultArea = document.getElementById("result-area");
const characterInput = document.getElementById("character");
const characterOptions = document.getElementById("character-options");

// ---------- Autocomplete: populate the character datalist ----------
// Failing silently here is fine -- the character field still works as
// plain free text if this fetch doesn't come back, the API resolves
// names/aliases either way.
fetch(`${API_BASE}/characters`)
    .then((r) => r.json())
    .then((data) => {
        const frag = document.createDocumentFragment();
        for (const c of data.characters || []) {
            const opt = document.createElement("option");
            opt.value = c.name;
            frag.appendChild(opt);
        }
        characterOptions.appendChild(frag);
    })
    .catch(() => {
        // Autocomplete just won't populate -- not fatal.
    });

// ---------- Pre-fill from ?character=Name (used by the browse page) ----------
const params = new URLSearchParams(window.location.search);
const prefillCharacter = params.get("character");
if (prefillCharacter) {
    characterInput.value = prefillCharacter;
}

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
        }
    } catch (err) {
        renderError(
            "Couldn't reach CritCal's API. This can happen if the server is still waking up " +
            "(free hosting sleeps after inactivity) -- try again in about a minute."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Rate this build";
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
    submitButton.textContent = "Calculating...";
    resultArea.hidden = false;
    resultArea.innerHTML = `
        <div class="result-card loading-card">
            <div class="spinner"></div>
            <p id="loading-message">Calculating your build...</p>
        </div>
    `;
    // Free hosting on Render spins the server down after inactivity --
    // the very first request after a while can take 30-50+ seconds
    // while it wakes back up. Let the person know what's happening
    // instead of leaving them staring at a spinner with no context.
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

function tierClass(tier) {
    if (!tier) return "";
    return "tier-" + tier.toLowerCase().replace(/\s+/g, "-");
}

function renderResult(data) {
    const weaponBadge = data.weapon_tier
        ? `<span class="tier-badge ${tierClass(data.weapon_tier)}">${escapeHtml(data.weapon_tier)}</span>`
        : "";
    const artifactBadge = data.artifact_tier
        ? `<span class="tier-badge ${tierClass(data.artifact_tier)}">${escapeHtml(data.artifact_tier)}</span>`
        : "";

    const equipmentSection = (data.weapon_name || data.primary_artifact_set_name) ? `
        <div class="result-section">
            <h3>Equipment</h3>
            ${data.weapon_name ? `<p><strong>Weapon:</strong> ${escapeHtml(data.weapon_name)}${data.weapon_refinement ? ` (R${data.weapon_refinement})` : ""} ${weaponBadge}</p>` : ""}
            ${data.primary_artifact_set_name ? `<p><strong>Artifacts:</strong> ${escapeHtml(data.primary_artifact_set_name)} (${data.primary_artifact_set_count}pc) ${artifactBadge}</p>` : ""}
        </div>
    ` : "";

    const benchmarkSection = (data.benchmark_status && data.benchmark_status.length) ? `
        <div class="result-section">
            <h3>Benchmarks</h3>
            <ul class="result-list">
                ${data.benchmark_status.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
            </ul>
        </div>
    ` : "";

    const recommendationsSection = (data.recommendations && data.recommendations.length) ? `
        <div class="result-section">
            <h3>Recommendations</h3>
            <ul class="result-list">
                ${data.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
            </ul>
        </div>
    ` : "";

    resultArea.innerHTML = `
        <div class="result-card">

            <div class="grade-header">
                <div class="grade-circle" style="border-color: ${escapeHtml(data.embed_color || "#4EA7FF")}; color: ${escapeHtml(data.embed_color || "#4EA7FF")}">
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
                    <span class="score-label">Overall Score</span>
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
                <h3>Build Summary</h3>
                <p>${escapeHtml(data.build_description || "")}</p>
            </div>

            ${equipmentSection}
            ${benchmarkSection}
            ${recommendationsSection}

        </div>
    `;
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }
      
