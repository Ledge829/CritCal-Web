// API_BASE from script.js, icon/color helpers from icons.js,
// portraitHtml/portraitInnerHtml from portraits.js.
//
// eslint-disable-next-line no-unused-vars
/* global API_BASE, elementIcon, elementColor, rarityStars, UI_ICONS, STAT_ICONS, portraitInnerHtml, ELEMENT_COLORS */

(function () {
    "use strict";

    var uidInput = document.getElementById("uid-input");
    var uidBtn = document.getElementById("uid-search-btn");
    var resultArea = document.getElementById("uid-result-area");
    var historyArea = document.getElementById("uid-history");

    if (!uidInput || !uidBtn || !resultArea) return;

    var GRADE_COLORS = {
        S: "#6BC7AE", A: "#5B9BD6", B: "#B18FE0", C: "#D6B96C", D: "#E0899B",
    };
    var HISTORY_KEY = "critcal_uid_history";
    var MAX_HISTORY = 5;

    // ==========================================================
    // SEARCH HISTORY
    // ==========================================================

    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        } catch (_) { return []; }
    }

    function addHistory(uid) {
        var h = getHistory().filter(function (u) { return u !== uid; });
        h.unshift(uid);
        if (h.length > MAX_HISTORY) h = h.slice(0, MAX_HISTORY);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch (_) {}
        renderHistory();
    }

    function clearHistory() {
        try { localStorage.removeItem(HISTORY_KEY); } catch (_) {}
        renderHistory();
    }

    function renderHistory() {
        if (!historyArea) return;
        var h = getHistory();
        if (h.length === 0) {
            historyArea.classList.remove("is-visible");
            return;
        }
        var html =
            '<div class="uid-history-label">Recent UIDs</div>' +
            '<div class="uid-history-pills">';
        for (var i = 0; i < h.length; i++) {
            html +=
                '<span class="uid-history-pill" data-uid="' + escHtml(h[i]) + '">' +
                    escHtml(h[i]) +
                    ' <span class="pill-close" data-clear="' + escHtml(h[i]) + '">&times;</span>' +
                '</span>';
        }
        html +=
            '<span class="uid-history-pill" style="border-color:transparent;font-size:10px;color:var(--text-faint);cursor:pointer;" id="uid-clear-all">Clear</span>' +
            '</div>';
        historyArea.innerHTML = html;
        historyArea.classList.add("is-visible");

        // Click a pill to search that UID.
        historyArea.querySelectorAll(".uid-history-pill[data-uid]").forEach(function (el) {
            el.addEventListener("click", function (e) {
                if (e.target.classList.contains("pill-close")) return;
                var u = el.getAttribute("data-uid");
                if (u) { uidInput.value = u; searchUid(u); }
            });
        });
        // Close button on individual pill.
        historyArea.querySelectorAll(".pill-close").forEach(function (el) {
            el.addEventListener("click", function (e) {
                e.stopPropagation();
                var u = el.getAttribute("data-clear");
                if (u) {
                    var h2 = getHistory().filter(function (x) { return x !== u; });
                    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h2)); } catch (_) {}
                    renderHistory();
                }
            });
        });
        // Clear all.
        var clearBtn = document.getElementById("uid-clear-all");
        if (clearBtn) clearBtn.addEventListener("click", clearHistory);
    }

    // ==========================================================
    // CORE SEARCH
    // ==========================================================

    function searchUid(uid) {
        setLoading();
        addHistory(uid);

        fetch(API_BASE + "/uid/" + encodeURIComponent(uid) + "/showcase")
            .then(function (response) {
                if (!response.ok) {
                    // Try to extract a specific error from the body.
                    return response.json().then(function (errData) {
                        throw new ApiError(errData.error || friendlyError(response.status), response.status);
                    }).catch(function (err) {
                        if (err instanceof ApiError) throw err;
                        throw new ApiError(friendlyError(response.status), response.status);
                    });
                }
                return response.json();
            })
            .then(function (data) {
                if (data.error) throw new ApiError(data.error, 400);
                if (!data.characters || data.characters.length === 0) {
                    throw new ApiError("No showcased characters found for this UID.", 404);
                }
                renderResults(data);
            })
            .catch(function (err) {
                if (err instanceof ApiError) {
                    setError(err.message);
                } else if (err instanceof TypeError && err.message.indexOf("fetch") !== -1) {
                    setError("Couldn't reach CritCal's API. The server may be waking up from sleep — try again in about a minute.");
                } else {
                    setError("Something went wrong. Please try again.");
                }
            });
    }

    function ApiError(message, code) {
        this.message = message;
        this.code = code;
    }
    ApiError.prototype = Object.create(Error.prototype);

    function friendlyError(code) {
        switch (code) {
            case 400: return "That UID doesn't look valid. Please check it and try again.";
            case 404: return "No player found with that UID. Make sure the showcase is public.";
            case 424: return "Genshin Impact servers are under maintenance right now. Try again later.";
            case 429: return "Rate-limited by Enka.Network. Please wait a minute and try again.";
            case 502: case 503: case 504: return "The server is temporarily unavailable. Please try again in a moment.";
            default: return "Server returned an error (" + code + "). Please try again.";
        }
    }

    // ==========================================================
    // UI STATES
    // ==========================================================

    function setLoading() {
        var skeletonHtml = "";
        for (var i = 0; i < 4; i++) {
            skeletonHtml +=
                '<div class="uid-skeleton-card">' +
                    '<div class="uid-skeleton-avatar"></div>' +
                    '<div class="uid-skeleton-body">' +
                        '<div class="skeleton-line"></div>' +
                        '<div class="skeleton-line"></div>' +
                    '</div>' +
                    '<div class="uid-skeleton-badge"></div>' +
                '</div>';
        }
        resultArea.innerHTML =
            '<div class="uid-summary-bar"><span style="color:var(--text-faint);font-size:13px;">Loading showcase…</span></div>' +
            '<div class="uid-skeleton-grid">' + skeletonHtml + '</div>';
        resultArea.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function setError(message) {
        resultArea.innerHTML =
            '<div class="uid-error-card">' +
                '<h3>Couldn&#8217;t load that showcase</h3>' +
                '<p>' + escHtml(message) + '</p>' +
            '</div>';
    }

    // ==========================================================
    // RENDER RESULTS
    // ==========================================================

    function renderResults(data) {
        var shareUrl = window.location.origin + window.location.pathname + "?uid=" + encodeURIComponent(data.uid);
        var shareBtnId = "uid-share-btn";

        var html =
            '<div class="uid-summary-bar">' +
                '<span>UID <strong>' + escHtml(data.uid) + '</strong> &middot; ' +
                data.count + " character" + (data.count !== 1 ? "s" : "") + '</span>' +
                '<span style="display:flex;gap:6px;align-items:center;">' +
                    '<button class="uid-share-btn" id="' + shareBtnId + '">' +
                        UI_ICONS.info.replace('viewBox="0 0 24 24"', 'viewBox="0 0 24 24" width="12" height="12"') +
                        ' <span id="uid-share-text">Copy Link</span>' +
                    '</button>' +
                    '<span class="uid-summary-hint">Tap a card</span>' +
                '</span>' +
            '</div>' +
            '<div class="uid-char-grid">';

        for (var i = 0; i < data.characters.length; i++) {
            html += characterCardHtml(data.characters[i], i);
        }
        html += '</div>';
        resultArea.innerHTML = html;

        // Share button handler
        var shareBtn = document.getElementById(shareBtnId);
        if (shareBtn) {
            shareBtn.addEventListener("click", function () {
                var shareText = document.getElementById("uid-share-text");
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareUrl).then(function () {
                        if (shareText) shareText.textContent = "Copied!";
                        shareBtn.classList.add("is-copied");
                        setTimeout(function () {
                            if (shareText) shareText.textContent = "Copy Link";
                            shareBtn.classList.remove("is-copied");
                        }, 2000);
                    }).catch(function () { fallbackCopy(shareUrl, shareBtn); });
                } else {
                    fallbackCopy(shareUrl, shareBtn);
                }
            });
        }

        // Card click handlers
        for (var j = 0; j < data.characters.length; j++) {
            attachCardHandler(j, data.characters[j]);
        }
    }

    function fallbackCopy(text, btn) {
        var shareText = document.getElementById("uid-share-text");
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand("copy");
            if (shareText) shareText.textContent = "Copied!";
            btn.classList.add("is-copied");
            setTimeout(function () {
                if (shareText) shareText.textContent = "Copy Link";
                btn.classList.remove("is-copied");
            }, 2000);
        } catch (_) {}
        document.body.removeChild(ta);
    }

    function attachCardHandler(index, charData) {
        var card = document.getElementById("uid-card-" + index);
        if (!card) return;
        card.addEventListener("click", function () {
            showOverlay(charData);
        });
    }

    // ==========================================================
    // FULL-SCREEN OVERLAY
    // ==========================================================

    function showOverlay(c) {
        // Remove any existing overlay first.
        var existing = document.querySelector(".uid-overlay");
        if (existing) existing.remove();

        var overlay = document.createElement("div");
        overlay.className = "uid-overlay";
        overlay.innerHTML =
            '<div class="uid-overlay-card">' +
                '<button class="uid-overlay-close" aria-label="Close">&times;</button>' +
                '<div class="uid-overlay-body">' +
                    detailHeroHtml(c) +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Trigger the fade-in on the next frame so the browser composites it.
        requestAnimationFrame(function () {
            overlay.classList.add("is-open");
        });

        // Close button.
        var closeBtn = overlay.querySelector(".uid-overlay-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                closeOverlay(overlay);
            });
        }

        // Tap on backdrop closes.
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) closeOverlay(overlay);
        });

        // ESC closes.
        overlay._keyHandler = function (e) {
            if (e.key === "Escape") closeOverlay(overlay);
        };
        document.addEventListener("keydown", overlay._keyHandler);
    }

    function closeOverlay(overlay) {
        if (!overlay) return;
        overlay.classList.remove("is-open");

        // Clean up the key handler and remove from DOM after the short
        // fade-out completes.
        if (overlay._keyHandler) {
            document.removeEventListener("keydown", overlay._keyHandler);
        }
        setTimeout(function () { overlay.remove(); }, 200);
    }

    // ==========================================================
    // CHARACTER CARD (summary row)
    // ==========================================================

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
            '</div>';
    }

    // ==========================================================
    // DETAIL VIEW — redesigned with hero banner + stat icons
    // ==========================================================

    function detailHeroHtml(c) {
        var gradeColor = c.embed_color || GRADE_COLORS[c.grade] || "#5B9BD6";
        var elColor = elementColor(c.element);
        var initial = (c.character || "?").charAt(0).toUpperCase();

        // Portrait in the hero
        var portraitHtml;
        if (c.portrait) {
            portraitHtml = portraitInnerHtml({
                key: c.character ? c.character.toLowerCase().replace(/\s+/g, "") : "",
                name: c.character,
                element: c.element,
                portrait: c.portrait,
            });
        } else {
            portraitHtml = '<span class="initial-fallback">' + escHtml(initial) + '</span>';
        }

        // Stats row (only show stats that are > 0)
        var statsArr = [
            { key: "hp", label: "HP", value: c.stats_used ? c.stats_used.hp : null },
            { key: "atk", label: "ATK", value: c.stats_used ? c.stats_used.atk : null },
            { key: "def", label: "DEF", value: c.stats_used ? c.stats_used.def : null },
            { key: "em", label: "EM", value: c.stats_used ? c.stats_used.elemental_mastery : null },
            { key: "er", label: "ER", value: c.stats_used ? c.stats_used.energy_recharge : null },
        ];
        var hasStats = statsArr.some(function (s) { return s.value != null && s.value > 0; });

        var statsHtml = "";
        if (hasStats) {
            statsHtml = '<div class="uid-detail-stats">';
            for (var si = 0; si < statsArr.length; si++) {
                var s = statsArr[si];
                var val = (s.value != null && s.value > 0) ? s.value : "—";
                statsHtml +=
                    '<div class="uid-detail-stat">' +
                        '<div class="uid-detail-stat-icon">' + (STAT_ICONS[s.key] || "") + '</div>' +
                        '<span class="uid-detail-stat-value">' + fmtStat(s.key, val) + '</span>' +
                        '<span class="uid-detail-stat-label">' + s.label + '</span>' +
                    '</div>';
            }
            statsHtml += '</div>';
        }

        // Section title helper
        function sectionTitle(icon, label) {
            return '<div class="result-section-title" style="font-size:10.5px;margin-bottom:7px;">' +
                icon + escHtml(label) + '</div>';
        }

        // Equipment
        var eqHtml = "";
        if (c.weapon_name || c.primary_artifact_set_name) {
            eqHtml = '<div style="margin-bottom:12px;">' + sectionTitle(UI_ICONS.gem, "Equipment");
            if (c.weapon_name) {
                var wBadge = c.weapon_tier
                    ? '<span class="tier-badge ' + tierCls(c.weapon_tier) + '">' + escHtml(c.weapon_tier) + '</span>'
                    : "";
                eqHtml +=
                    '<div class="uid-eq-row">' +
                        '<span><strong>' + escHtml(c.weapon_name) + '</strong>' +
                        '<span>Weapon' + (c.weapon_refinement ? ' &middot; R' + c.weapon_refinement : "") +
                        '</span></span>' + wBadge +
                    '</div>';
            }
            if (c.primary_artifact_set_name) {
                var aBadge = c.artifact_tier
                    ? '<span class="tier-badge ' + tierCls(c.artifact_tier) + '">' + escHtml(c.artifact_tier) + '</span>'
                    : "";
                eqHtml +=
                    '<div class="uid-eq-row">' +
                        '<span><strong>' + escHtml(c.primary_artifact_set_name) + '</strong>' +
                        '<span>Artifacts &middot; ' + (c.primary_artifact_set_count || "?") + 'pc' +
                        (c.has_four_piece_set_bonus ? ' &middot; 4pc active' : "") +
                        '</span></span>' + aBadge +
                    '</div>';
            }
            eqHtml += '</div>';
        }

        // Benchmarks
        var benchHtml = "";
        if (c.benchmark_status && c.benchmark_status.length) {
            benchHtml = '<div class="uid-detail-benchmarks">' +
                sectionTitle(UI_ICONS.shield, "Benchmarks") + '<ul>';
            for (var b = 0; b < c.benchmark_status.length; b++) {
                benchHtml += '<li>' + escHtml(c.benchmark_status[b]) + '</li>';
            }
            benchHtml += '</ul></div>';
        }

        // Recommendations
        var recsHtml = "";
        if (c.recommendations && c.recommendations.length) {
            recsHtml = '<div style="margin-top:12px;">' +
                sectionTitle(UI_ICONS.sparkle, "Recommendations") +
                '<ul class="uid-detail-recs">';
            for (var r = 0; r < c.recommendations.length; r++) {
                recsHtml += '<li>' + escHtml(c.recommendations[r]) + '</li>';
            }
            recsHtml += '</ul></div>';
        }

        return '' +
            // Hero banner
            '<div class="uid-detail-hero" style="--el-color:' + elColor + ';--grade-color:' + gradeColor + '">' +
                '<div class="uid-detail-hero-portrait" style="border-color:' + elColor + '">' +
                    portraitHtml +
                '</div>' +
                '<h3>' + escHtml(c.character) + '</h3>' +
                (c.build_title ? '<p class="build-subtitle">' + escHtml(c.build_title) + '</p>' : "") +
                '<div class="uid-detail-hero-grade" style="--grade-color:' + gradeColor + '">' +
                    escHtml(c.grade || "?") +
                    ' <small>' + escHtml(c.grade_description || "") + '</small>' +
                '</div>' +
            '</div>' +

            // Scores
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

            // Build description
            (c.build_description
                ? '<div style="margin-bottom:12px;">' +
                    sectionTitle(UI_ICONS.layers, "Build Summary") +
                    '<p style="color:var(--text-dim);font-size:12.5px;line-height:1.6;">' +
                        escHtml(c.build_description) + '</p>' +
                  '</div>'
                : "") +

            // Stats (with icons)
            statsHtml +

            // Equipment
            eqHtml +

            // Benchmarks
            benchHtml +

            // Recommendations
            recsHtml;
    }

    // ==========================================================
    // HELPERS
    // ==========================================================

    function tierCls(tier) {
        return tier ? "tier-" + tier.toLowerCase().replace(/\s+/g, "-") : "";
    }

    function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

    function fmtStat(key, val) {
        if (val === "—" || val == null) return "—";
        var num = Number(val);
        if (key === "er") return num.toFixed(0) + "%";
        if (key === "em" || key === "hp" || key === "atk" || key === "def") {
            return num >= 1000 ? num.toLocaleString() : num.toFixed(0);
        }
        return num.toFixed(1);
    }

    function escHtml(str) {
        var d = document.createElement("div");
        d.textContent = String(str);
        return d.innerHTML;
    }

    // ==========================================================
    // INIT
    // ==========================================================

    renderHistory();

    // Auto-search from ?uid=XXX
    (function autoInit() {
        try {
            var p = new URLSearchParams(window.location.search);
            var u = p.get("uid");
            if (u) {
                uidInput.value = u;
                setTimeout(function () { searchUid(u); }, 0);
            }
        } catch (_) {}
    })();

    uidBtn.addEventListener("click", function () {
        var uid = (uidInput.value || "").trim();
        if (!uid) { uidInput.focus(); return; }
        searchUid(uid);
    });

    uidInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            var uid = (uidInput.value || "").trim();
            if (!uid) { uidInput.focus(); return; }
            searchUid(uid);
        }
    });

})();
