// API_BASE from script.js, icon/color helpers from icons.js,
// portraitHtml/portraitInnerHtml from portraits.js.

const uidInput = document.getElementById("uid-input");
const uidBtn = document.getElementById("uid-search-btn");
const resultArea = document.getElementById("uid-result-area");

// ---------- Auto-search from ?uid=XXX ----------
const params = new URLSearchParams(window.location.search);
const initialUid = params.get("uid");
if (initialUid) {
    uidInput.value = initialUid;
    searchUid(initialUid);
}

// ---------- Event handlers ----------
uidBtn.addEventListener("click", () => {
    const uid = (uidInput.value || "").trim();
    if (!uid) { uidInput.focus(); return; }
    searchUid(uid);
});

uidInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const uid = (uidInput.value || "").trim();
        if (!uid) { uidInput.focus(); return; }
        searchUid(uid);
    }
});

// ---------- Loading ----------
function setLoading() {
    resultArea.innerHTML = `
        <div class="uid-loading">
            <div class="spinner" style="margin:0 auto 16px;"></div>
            <p id="uid-loading-msg">Fetching showcase from Enka.Network...</p>
        </div>
    `;
    resultArea.scrollIntoView({ behavior: "smooth", block: "start" });

    // After 5s, show a "still waking up" message
    setTimeout(() => {
        const msg = document.getElementById("uid-loading-msg");
        if (msg) {
            msg.textContent =
                "Still working — the API server may be waking up from sleep. " +
                "This can take up to a minute on the first request.";
        }
    }, 5000);
}

// ---------- Error ----------
function setError(message) {
    resultArea.innerHTML = `
        <div class="uid-error-card">
            <h3>Couldn't load that showcase</h3>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

// ---------- Main search ----------
async function searchUid(uid) {
    setLoading();

    try {
        const response = await fetch(`${API_BASE}/uid/${encodeURIComponent(uid)}/showcase`);
        const data = await response.json();

        if (data.error) {
            setError(data.error);
            return;
        }

        if (!data.characters || data.characters.length === 0) {
            setError("No showcased characters found for this UID.");
            return;
        }

        renderResults(data);
    } catch (err) {
        setError(
            "Couldn't reach CritCal's API. The server may be waking up from sleep — " +
            "try again in about a minute."
        );
    }
}

// ---------- Render results ----------
let expandedIndex = null;

function renderResults(data) {
    expandedIndex = null;

    const summaryHtml = `
        <div class="uid-summary-bar">
            <span>UID <strong>${escapeHtml(data.uid)}</strong> &middot; ${data.count} character${data.count !== 1 ? "s" : ""}</span>
            <span style="font-size:11px;color:var(--text-faint);">Tap a card for the full rating</span>
        </div>
    `;

    const cardsHtml = data.characters
        .map((c, i) => characterCardHtml(c, i))
        .join("");

    resultArea.innerHTML = summaryHtml + `<div class="uid-char-grid">${cardsHtml}</div>`;

    // Attach click handlers to each card
    data.characters.forEach((c, i) => {
        const card = document.getElementById(`uid-card-${i}`);
        if (!card) return;
        card.addEventListener("click", () => {
            // Close previously open detail
            if (expandedIndex !== null && expandedIndex !== i) {
                const prevDetail = document.getElementById(`uid-detail-${expandedIndex}`);
                if (prevDetail) prevDetail.classList.remove("is-open");
            }
            const detail = document.getElementById(`uid-detail-${i}`);
            if (!detail) return;
            const isOpening = !detail.classList.contains("is-open");
            detail.classList.toggle("is-open", isOpening);
            expandedIndex = isOpening ? i : null;
            if (isOpening) {
                detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        });
    });
}

// ---------- Character card (summary) ----------
function characterCardHtml(c, index) {
    const color = elementColor(c.element);
    const gradeColor = c.embed_color || GRADE_COLORS[c.grade] || "#5B9BD6";
    const initial = (c.character || "?").charAt(0).toUpperCase();

    // Portrait inline
    const avatarHtml = c.portrait
        ? portraitInnerHtml({ key: "", name: c.character, element: c.element, portrait: c.portrait })
        : initial;

    return `
        <div class="uid-char-card" id="uid-card-${index}" style="--el-color:${color};--grade-color:${gradeColor}">
            <div class="uid-char-summary">
                <span class="uid-char-avatar">${avatarHtml}</span>
                <div class="uid-char-info">
                    <strong>${escapeHtml(c.character)}</strong>
                    <span class="uid-char-meta">
                        ${c.element ? `<span class="element-badge" style="--el-color:${color}">${elementIcon(c.element)}${capitalize(c.element)}</span>` : ""}
                        ${c.rarity ? rarityStars(c.rarity) : ""}
                        <span class="character-roles">${escapeHtml(c.build_title || "")}</span>
                    </span>
                </div>
                <div class="uid-char-stats">
                    <div class="uid-char-grade">${escapeHtml(c.grade || "?")}</div>
                    <div class="uid-char-score">
                        <span class="score-value" style="color:${gradeColor}">${c.overall_score ?? "--"}</span>
                        <span class="score-label">Score</span>
                    </div>
                </div>
            </div>

            <div class="uid-char-detail" id="uid-detail-${index}">
                ${detailHtml(c)}
            </div>
        </div>
    `;
}

// ---------- Full detail (rendered inside expandable panel) ----------
function detailHtml(c) {
    const gradeColor = c.embed_color || GRADE_COLORS[c.grade] || "#5B9BD6";

    const weaponBadge = c.weapon_tier
        ? `<span class="tier-badge ${tierClass(c.weapon_tier)}">${escapeHtml(c.weapon_tier)}</span>`
        : "";
    const artifactBadge = c.artifact_tier
        ? `<span class="tier-badge ${tierClass(c.artifact_tier)}">${escapeHtml(c.artifact_tier)}</span>`
        : "";

    const equipmentHtml =
        c.weapon_name || c.primary_artifact_set_name
            ? `<div class="uid-detail-eq">
                  ${c.weapon_name ? `
                      <div class="uid-eq-row">
                          <span><strong>${escapeHtml(c.weapon_name)}</strong><span>Weapon${c.weapon_refinement ? " &middot; R" + c.weapon_refinement : ""}</span></span>
                          ${weaponBadge}
                      </div>` : ""}
                  ${c.primary_artifact_set_name ? `
                      <div class="uid-eq-row">
                          <span><strong>${escapeHtml(c.primary_artifact_set_name)}</strong><span>Artifacts &middot; ${c.primary_artifact_set_count || "?"}pc${c.has_four_piece_set_bonus ? " &middot; 4pc active" : ""}</span></span>
                          ${artifactBadge}
                      </div>` : ""}
              </div>`
            : "";

    const benchmarkHtml =
        c.benchmark_status && c.benchmark_status.length
            ? `<div class="uid-detail-benchmarks">
                   <div class="result-section-title" style="font-size:10.5px;margin-bottom:8px;">${UI_ICONS.shield}Benchmarks</div>
                   <ul>${c.benchmark_status.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
               </div>`
            : "";

    const recsHtml =
        c.recommendations && c.recommendations.length
            ? `<div style="margin-top:12px;">
                   <div class="result-section-title" style="font-size:10.5px;margin-bottom:8px;">${UI_ICONS.sparkle}Recommendations</div>
                   <ul class="uid-detail-recs">${c.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
               </div>`
            : "";

    return `
        <div class="uid-detail-grade" style="--grade-color:${gradeColor}">
            <div class="uid-detail-circle">${escapeHtml(c.grade || "?")}</div>
            <div>
                <h3>${escapeHtml(c.character)}</h3>
                <p style="font-size:12px;color:var(--text-dim);">${escapeHtml(c.build_title || "")}</p>
            </div>
        </div>

        <p class="uid-detail-desc">${escapeHtml(c.grade_description || "")}</p>

        <div class="uid-detail-scores">
            <div class="score-chip">
                <span class="score-value" style="color:${gradeColor}">${c.overall_score ?? "--"}</span>
                <span class="score-label">Score</span>
            </div>
            <div class="score-chip">
                <span class="score-value">${c.crit_value ?? "--"}</span>
                <span class="score-label">Crit Value</span>
            </div>
            <div class="score-chip">
                <span class="score-value">${c.crit_rate ?? "--"}% / ${c.crit_dmg ?? "--"}%</span>
                <span class="score-label">Crit Ratio</span>
            </div>
        </div>

        ${c.build_description ? `
            <div style="margin-bottom:12px;">
                <div class="result-section-title" style="font-size:10.5px;margin-bottom:8px;">${UI_ICONS.layers}Build Summary</div>
                <p style="color:var(--text-dim);font-size:12.5px;line-height:1.6;">${escapeHtml(c.build_description)}</p>
            </div>
        ` : ""}

        ${equipmentHtml}
        ${benchmarkHtml}
        ${recsHtml}
    `;
}

// ---------- Helpers ----------

const GRADE_COLORS = {
    S: "#6BC7AE", A: "#5B9BD6", B: "#B18FE0", C: "#D6B96C", D: "#E0899B",
};

function tierClass(tier) {
    if (!tier) return "";
    return "tier-" + tier.toLowerCase().replace(/\s+/g, "-");
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
}
