// API_BASE from script.js, icon/color helpers from icons.js,
// portraitHtml/portraitInnerHtml from portraits.js.
//
// eslint-disable-next-line no-unused-vars
/* global API_BASE, elementIcon, elementColor, rarityStars, UI_ICONS, portraitInnerHtml */

(function () {
    "use strict";

    const uidInput = document.getElementById("uid-input");
    const uidBtn = document.getElementById("uid-search-btn");
    const resultArea = document.getElementById("uid-result-area");

    // Bail silently if DOM elements are missing (prevent error cascade).
    if (!uidInput || !uidBtn || !resultArea) return;

    const GRADE_COLORS = {
        S: "#6BC7AE", A: "#5B9BD6", B: "#B18FE0", C: "#D6B96C", D: "#E0899B",
    };

    let expandedIndex = null;

    // ---------- Core search ----------
    async function searchUid(uid) {
        setLoading();
        try {
            const response = await fetch(
                API_BASE + "/uid/" + encodeURIComponent(uid) + "/showcase"
            );
            if (!response.ok) {
                // Try to parse an error body, fall back to status text.
                let msg = "Server returned " + response.status;
                try {
                    const errBody = await response.json();
                    if (errBody.error) msg = errBody.error;
                } catch (_) { /* ignore parse failure */ }
                setError(msg);
                return;
            }
            const data = await response.json();
            if (data.error) { setError(data.error); return; }
            if (!data.characters || data.characters.length === 0) {
                setError("No showcased characters found for this UID.");
                return;
            }
            renderResults(data);
        } catch (err) {
            setError(
                "Couldn't reach CritCal's API. The server may be waking up " +
                "from sleep — try again in about a minute."
            );
        }
    }

    // ---------- Auto-search from ?uid=XXX ----------
    // IMPORTANT: wrapped in try/catch so a failure here doesn't prevent
    // the event listeners below from being registered.
    (function autoInit() {
        try {
            const params = new URLSearchParams(window.location.search);
            const initialUid = params.get("uid");
            if (initialUid) {
                uidInput.value = initialUid;
                // Use setTimeout to ensure listeners are registered first.
                setTimeout(function () { searchUid(initialUid); }, 0);
            }
        } catch (_) { /* auto-init failed — user can search manually */ }
    })();

    // ---------- Event handlers ----------
    function doSearch() {
        const uid = (uidInput.value || "").trim();
        if (!uid) { uidInput.focus(); return; }
        searchUid(uid);
    }

    uidBtn.addEventListener("click", doSearch);
    uidInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") doSearch();
    });

    // ---------- UI states ----------
    function setLoading() {
        resultArea.innerHTML =
            '<div class="uid-loading">' +
                '<div class="spinner" style="margin:0 auto 16px;"></div>' +
                '<p id="uid-loading-msg">Fetching showcase from Enka.Network...</p>' +
            '</div>';
        resultArea.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(function () {
            var msg = document.getElementById("uid-loading-msg");
            if (msg) {
                msg.textContent =
                    "Still working — the API server may be waking up from sleep. " +
                    "This can take up to a minute on the first request.";
            }
        }, 5000);
    }

    function setError(message) {
        resultArea.innerHTML =
            '<div class="uid-error-card">' +
                '<h3>Couldn’t load that showcase</h3>' +
                '<p>' + escHtml(message) + '</p>' +
            '</div>';
    }

    // ---------- Render results ----------
    function renderResults(data) {
        expandedIndex = null;
        var html =
            '<div class="uid-summary-bar">' +
                '<span>UID <strong>' + escHtml(data.uid) + '</strong> · ' +
                data.count + ' character' + (data.count !== 1 ? "s" : "") + '</span>' +
                '<span class="uid-summary-hint">Tap a card for the full rating</span>' +
            '</div>' +
            '<div class="uid-char-grid">';
        for (var i = 0; i < data.characters.length; i++) {
            html += characterCardHtml(data.characters[i], i);
        }
        html += '</div>';
        resultArea.innerHTML = html;

        // Attach click handlers.
        for (var j = 0; j < data.characters.length; j++) {
            attachCardHandler(j);
        }
    }

    function attachCardHandler(index) {
        var card = document.getElementById("uid-card-" + index);
        if (!card) return;
        card.addEventListener("click", function () {
            if (expandedIndex !== null && expandedIndex !== index) {
                var prev = document.getElementById("uid-detail-" + expandedIndex);
                if (prev) prev.classList.remove("is-open");
            }
            var detail = document.getElementById("uid-detail-" + index);
            if (!detail) return;
            var isOpening = !detail.classList.contains("is-open");
            detail.classList.toggle("is-open", isOpening);
            expandedIndex = isOpening ? index : null;
            if (isOpening) {
                detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        });
    }

    // ---------- Character card HTML (summary) ----------
    function characterCardHtml(c, index) {
        var color = elementColor(c.element);
        var gradeColor = c.embed_color || GRADE_COLORS[c.grade] || "#5B9BD6";
        var initial = (c.character || "?").charAt(0).toUpperCase();
        var avatarHtml = c.portrait
            ? portraitInnerHtml({
                key: c.character ? c.character.toLowerCase().replace(/\s+/g, "") : "",
                name: c.character,
                element: c.element,
                portrait: c.portrait,
              })
            : initial;

        return '' +
            '<div class="uid-char-card" id="uid-card-' + index + '" ' +
                 'style="--el-color:' + color + ';--grade-color:' + gradeColor + '">' +
                '<div class="uid-char-summary">' +
                    '<span class="uid-char-avatar">' + avatarHtml + '</span>' +
                    '<div class="uid-char-info">' +
                        '<strong>' + escHtml(c.character) + '</strong>' +
                        '<span class="uid-char-meta">' +
                            (c.element
                                ? '<span class="element-badge" style="--el-color:' + color + '">' +
                                   elementIcon(c.element) + cap(c.element) + '</span>'
                                : "") +
                            (c.rarity ? rarityStars(c.rarity) : "") +
                            '<span class="character-roles">' + escHtml(c.build_title || "") + '</span>' +
                        '</span>' +
                    '</div>' +
                    '<div class="uid-char-stats">' +
                        '<div class="uid-char-grade" style="--grade-color:' + gradeColor + '">' +
                            escHtml(c.grade || "?") +
                        '</div>' +
                        '<div class="uid-char-score">' +
                            '<span class="score-value" style="color:' + gradeColor + '">' +
                                (c.overall_score != null ? c.overall_score : "--") +
                            '</span>' +
                            '<span class="score-label">Score</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="uid-char-detail" id="uid-detail-' + index + '">' +
                    detailHtml(c) +
                '</div>' +
            '</div>';
    }

    // ---------- Full detail HTML (inside expandable panel) ----------
    function detailHtml(c) {
        var gradeColor = c.embed_color || GRADE_COLORS[c.grade] || "#5B9BD6";

        var weaponBadge = c.weapon_tier
            ? '<span class="tier-badge ' + tierCls(c.weapon_tier) + '">' + escHtml(c.weapon_tier) + '</span>'
            : "";
        var artifactBadge = c.artifact_tier
            ? '<span class="tier-badge ' + tierCls(c.artifact_tier) + '">' + escHtml(c.artifact_tier) + '</span>'
            : "";

        var eqHtml = "";
        if (c.weapon_name || c.primary_artifact_set_name) {
            eqHtml = '<div class="uid-detail-eq">';
            if (c.weapon_name) {
                eqHtml +=
                    '<div class="uid-eq-row">' +
                        '<span><strong>' + escHtml(c.weapon_name) + '</strong>' +
                        '<span>Weapon' + (c.weapon_refinement ? ' &middot; R' + c.weapon_refinement : "") +
                        '</span></span>' +
                        weaponBadge +
                    '</div>';
            }
            if (c.primary_artifact_set_name) {
                eqHtml +=
                    '<div class="uid-eq-row">' +
                        '<span><strong>' + escHtml(c.primary_artifact_set_name) + '</strong>' +
                        '<span>Artifacts &middot; ' + (c.primary_artifact_set_count || "?") + 'pc' +
                        (c.has_four_piece_set_bonus ? ' &middot; 4pc active' : "") +
                        '</span></span>' +
                        artifactBadge +
                    '</div>';
            }
            eqHtml += '</div>';
        }

        var benchHtml = "";
        if (c.benchmark_status && c.benchmark_status.length) {
            benchHtml = '<div class="uid-detail-benchmarks">' +
                '<div class="result-section-title" style="font-size:10.5px;margin-bottom:8px;">' +
                    UI_ICONS.shield + 'Benchmarks</div><ul>';
            for (var b = 0; b < c.benchmark_status.length; b++) {
                benchHtml += '<li>' + escHtml(c.benchmark_status[b]) + '</li>';
            }
            benchHtml += '</ul></div>';
        }

        var recsHtml = "";
        if (c.recommendations && c.recommendations.length) {
            recsHtml = '<div style="margin-top:12px;">' +
                '<div class="result-section-title" style="font-size:10.5px;margin-bottom:8px;">' +
                    UI_ICONS.sparkle + 'Recommendations</div>' +
                '<ul class="uid-detail-recs">';
            for (var r = 0; r < c.recommendations.length; r++) {
                recsHtml += '<li>' + escHtml(c.recommendations[r]) + '</li>';
            }
            recsHtml += '</ul></div>';
        }

        return '' +
            '<div class="uid-detail-grade" style="--grade-color:' + gradeColor + '">' +
                '<div class="uid-detail-circle">' + escHtml(c.grade || "?") + '</div>' +
                '<div>' +
                    '<h3>' + escHtml(c.character) + '</h3>' +
                    '<p style="font-size:12px;color:var(--text-dim);">' + escHtml(c.build_title || "") + '</p>' +
                '</div>' +
            '</div>' +
            '<p class="uid-detail-desc">' + escHtml(c.grade_description || "") + '</p>' +
            '<div class="uid-detail-scores">' +
                '<div class="score-chip">' +
                    '<span class="score-value" style="color:' + gradeColor + '">' +
                        (c.overall_score != null ? c.overall_score : "--") +
                    '</span>' +
                    '<span class="score-label">Score</span>' +
                '</div>' +
                '<div class="score-chip">' +
                    '<span class="score-value">' + (c.crit_value != null ? c.crit_value : "--") + '</span>' +
                    '<span class="score-label">Crit Value</span>' +
                '</div>' +
                '<div class="score-chip">' +
                    '<span class="score-value">' + (c.crit_rate != null ? c.crit_rate : "--") + '% / ' +
                    (c.crit_dmg != null ? c.crit_dmg : "--") + '%</span>' +
                    '<span class="score-label">Crit Ratio</span>' +
                '</div>' +
            '</div>' +
            (c.build_description
                ? '<div style="margin-bottom:12px;">' +
                    '<div class="result-section-title" style="font-size:10.5px;margin-bottom:8px;">' +
                        UI_ICONS.layers + 'Build Summary</div>' +
                    '<p style="color:var(--text-dim);font-size:12.5px;line-height:1.6;">' +
                        escHtml(c.build_description) + '</p>' +
                  '</div>'
                : "") +
            eqHtml +
            benchHtml +
            recsHtml;
    }

    // ---------- Tiny helpers ----------
    function tierCls(tier) {
        return tier ? "tier-" + tier.toLowerCase().replace(/\s+/g, "-") : "";
    }
    function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
    function escHtml(str) {
        var d = document.createElement("div");
        d.textContent = String(str);
        return d.innerHTML;
    }
})();
