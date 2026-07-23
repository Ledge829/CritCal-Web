/*
Canvas-based rating card generator for CritCal.

Draws a PNG build card (like akasha.cv) from a rate_build API response.
No external dependencies -- uses the built-in Canvas API.

Card layout (540 x 760 at 1x, drawn at 2x for retina):
  - Element-colored top accent bar
  - Character portrait (circle) + name + build title
  - Grade circle + overall score
  - Crit value + ratio
  - Stats row (HP / ATK / DEF / EM / ER)
  - Equipment rows (weapon + artifact set) with tier badges
  - CritCal footer watermark

Use:
    const blob = await generateRatingCard(resultData, charInfo);
    // blob is a PNG ready for <a download> or navigator.share()
*/

(function () {
    "use strict";

    // Card dimensions at 1x. Canvas renders at 2x for retina.
    var W = 540;
    var H = 760;
    var SCALE = 2;

    // Pixel positions -- all in 1x coordinates (canvas is scaled 2x).
    // These are calculated to give consistent spacing across sections.
    var L = 32;  // left margin (also right)
    var R = W - L;

    // Element color palette (same as the design system -- CSS / icons.js)
    var ELEMENT_ACCENTS = {
        pyro:   "#E0785C",
        hydro:  "#5B9BD6",
        anemo:  "#6BC7AE",
        electro:"#B18FE0",
        dendro: "#97BE58",
        cryo:   "#83C6DE",
        geo:    "#D6B96C",
    };

    var TEXT_DIM = "#98A2B3";
    var TEXT_FAINT = "#666F7F";

    // Grade colors mirror GRADE_COLORS from script.js
    var GRADE_HEX = {
        S: "#6BC7AE", A: "#5B9BD6", B: "#B18FE0", C: "#D6B96C", D: "#E0899B",
    };

    // ==========================================================
    // HELPERS
    // ==========================================================

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    function capitalize(s) {
        if (!s) return "";
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function fmtStat(key, val) {
        if (val == null) return "—";
        var num = Number(val);
        if (key === "er") return num.toFixed(0) + "%";
        if (num >= 1000) return Math.round(num).toLocaleString();
        return Math.round(num).toFixed(0);
    }

    // ==========================================================
    // PORTRAIT / INITIAL FALLBACK
    // ==========================================================

    /**
     * Draws the character portrait clipped to a circle, falling back
     * to an initial-letter avatar if the image can't load (CORS, etc.).
     * Returns a Promise that resolves when drawing is done.
     */
    function drawPortrait(ctx, cx, cy, radius, charInfo) {
        return new Promise(function (resolve) {
            var initial = (charInfo.name || "?").charAt(0).toUpperCase();
            var url = charInfo.portrait;

            if (!url) {
                drawInitial(ctx, cx, cy, radius, initial, charInfo.element);
                resolve();
                return;
            }

            var img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = function () {
                // Clip to circle and draw
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
                ctx.restore();
                resolve();
            };

            img.onerror = function () {
                drawInitial(ctx, cx, cy, radius, initial, charInfo.element);
                resolve();
            };

            img.src = url;
        });
    }

    function drawInitial(ctx, cx, cy, radius, letter, element) {
        var color = ELEMENT_ACCENTS[element] || "#5B9BD6";
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = "bold 32px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(letter, cx, cy + 1);
        ctx.restore();
    }

    // ==========================================================
    // MAIN RENDERER
    // ==========================================================

    /**
     * Generates a PNG rating card.
     *
     * @param {Object} result - The full rate_build API response.
     * @param {Object} charInfo - Character metadata with:
     *   { element, portrait, name, key } — the shape from /characters API.
     * @returns {Promise<Blob>} A PNG Blob.
     */
    // eslint-disable-next-line no-unused-vars
    window.generateRatingCard = async function (result, charInfo) {
        var canvas = document.createElement("canvas");
        canvas.width = W * SCALE;
        canvas.height = H * SCALE;
        var ctx = canvas.getContext("2d");
        ctx.scale(SCALE, SCALE);
        ctx.textBaseline = "top";

        var elColor = ELEMENT_ACCENTS[charInfo && charInfo.element] || "#5B9BD6";
        var gradeColor = result.embed_color || GRADE_HEX[result.grade] || "#5B9BD6";

        // ---- BACKGROUND ----
        ctx.fillStyle = "#0A0D13";
        ctx.fillRect(0, 0, W, H);

        // Card surface (slightly lighter than bg)
        roundRect(ctx, 8, 8, W - 16, H - 16, 16);
        ctx.fillStyle = "#10141C";
        ctx.fill();

        // Top accent bar (element-colored)
        roundRect(ctx, 8, 8, W - 16, 6, 3);
        ctx.fillStyle = elColor;
        ctx.fill();

        // ---- PORTRAIT ----
        var portraitCY = 72;
        await drawPortrait(ctx, W / 2, portraitCY, 38, charInfo);

        // ---- NAME + TITLE ----
        ctx.fillStyle = "#EEF1F5";
        ctx.font = "600 22px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(result.character || "Unknown", W / 2, 125);

        if (result.build_title) {
            ctx.fillStyle = TEXT_DIM;
            ctx.font = "400 11px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(result.build_title, W / 2, 153);
        }

        // ---- DIVIDER 1 ----
        var y = 180;
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L, y);
        ctx.lineTo(R, y);
        ctx.stroke();

        // ---- GRADE + SCORE ----
        y = 208;
        var gcR = 34;
        // Grade circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(L + gcR, y + gcR, gcR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = gradeColor + "18";  // ~10% opacity
        ctx.fill();
        ctx.strokeStyle = gradeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = gradeColor;
        ctx.font = "700 28px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(result.grade || "?", L + gcR, y + gcR + 1);
        ctx.textBaseline = "top";
        ctx.restore();

        // Score number
        ctx.fillStyle = "#EEF1F5";
        ctx.font = "600 32px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText((result.overall_score != null ? result.overall_score : "--"), L + gcR * 2 + 20, y + 4);

        ctx.fillStyle = TEXT_DIM;
        ctx.font = "400 11px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("Overall Score", L + gcR * 2 + 20, y + 42);

        // Crit value label at right
        ctx.fillStyle = TEXT_FAINT;
        ctx.font = "400 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("CRIT VALUE", R, y + 4);

        ctx.fillStyle = "#EEF1F5";
        ctx.font = "600 24px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(String(result.crit_value != null ? result.crit_value : "--"), R, y + 20);

        // ---- CRIT RATIO ----
        y = 290;
        ctx.fillStyle = TEXT_DIM;
        ctx.font = "400 13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        var cr = result.crit_rate != null ? result.crit_rate : "--";
        var cd = result.crit_dmg != null ? result.crit_dmg : "--";
        ctx.fillText("Crit Rate " + cr + "%  /  Crit DMG " + cd + "%", W / 2, y);

        // Grade description (short, centered)
        if (result.grade_description) {
            ctx.fillStyle = TEXT_FAINT;
            ctx.font = "400 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(result.grade_description, W / 2, y + 20);
        }

        // ---- DIVIDER 2 ----
        y = 328;
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L, y);
        ctx.lineTo(R, y);
        ctx.stroke();

        // ---- STATS ----
        y = 345;
        ctx.fillStyle = TEXT_FAINT;
        ctx.font = "600 9px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("STATS", W / 2, y);

        y += 22;
        var stats = (result.stats_used) || {};
        var statKeys = ["hp", "atk", "def", "elemental_mastery", "energy_recharge"];
        var statLabels = ["HP", "ATK", "DEF", "EM", "ER"];
        var statDisplayKeys = ["hp", "atk", "def", "em", "er"];

        // Check if any stat has a non-zero value
        var hasStats = statKeys.some(function (k) { return stats[k] != null && stats[k] > 0; });

        if (hasStats) {
            var cellW = (R - L) / statKeys.length;
            for (var si = 0; si < statKeys.length; si++) {
                var sx = L + cellW * si + cellW / 2;
                var rawVal = stats[statKeys[si]];

                ctx.fillStyle = "#EEF1F5";
                ctx.font = "600 16px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText(fmtStat(statDisplayKeys[si], rawVal), sx, y);

                ctx.fillStyle = TEXT_FAINT;
                ctx.font = "400 9px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText(statLabels[si], sx, y + 22);
            }
            y += 50;
        }

        // ---- DIVIDER 3 ----
        y += 2;
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L, y);
        ctx.lineTo(R, y);
        ctx.stroke();

        // ---- EQUIPMENT ----
        y += 18;
        var hasEq = result.weapon_name || result.primary_artifact_set_name;

        if (hasEq) {
            ctx.fillStyle = TEXT_FAINT;
            ctx.font = "600 9px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("EQUIPMENT", W / 2, y);

            y += 22;

            // Weapon row
            if (result.weapon_name) {
                var wepRefine = result.weapon_refinement ? " R" + result.weapon_refinement : "";
                drawEqRow(ctx, L, y, R, result.weapon_name + wepRefine, "Weapon", result.weapon_tier);
                y += 36;
            }

            // Artifact set row
            if (result.primary_artifact_set_name) {
                var setCount = result.primary_artifact_set_count ? result.primary_artifact_set_count + "pc" : "";
                var setLabel = "Artifacts" + (setCount ? " · " + setCount : "");
                drawEqRow(ctx, L, y, R, result.primary_artifact_set_name, setLabel, result.artifact_tier);
                y += 36;
            }
        } else {
            ctx.fillStyle = TEXT_FAINT;
            ctx.font = "400 11px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("No equipment data provided", W / 2, y + 4);
            y += 30;
        }

        // ---- FOOTER ----
        ctx.fillStyle = TEXT_FAINT;
        ctx.font = "400 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CritCal · critcal.vercel.app", W / 2, H - 32);

        // Grade-color stripe at bottom
        roundRect(ctx, 8, H - 10, W - 16, 4, 2);
        ctx.fillStyle = gradeColor;
        ctx.fill();

        // ---- PRODUCE BLOB ----
        return new Promise(function (resolve) {
            canvas.toBlob(function (blob) {
                resolve(blob);
            }, "image/png");
        });
    };

    // ==========================================================
    // EQUIPMENT ROW HELPER
    // ==========================================================

    var TIER_CLASSES = {
        bis: "gold",
        secondary: "primary",
        f2p: "green",
        niche: "purple",
        unlisted: "neutral",
        unrecognized: "red",
        "type mismatch": "red",
        hybrid: "neutral",
        fragmented: "red",
    };

    var TIER_BG = {
        gold:   "rgba(214,185,108,0.18)",
        primary:"rgba(91,155,214,0.18)",
        green:  "rgba(107,199,174,0.18)",
        purple: "rgba(177,143,224,0.18)",
        neutral:"rgba(152,162,179,0.18)",
        red:    "rgba(224,137,155,0.18)",
    };

    var TIER_FG = {
        gold:   "#D6B96C",
        primary:"#5B9BD6",
        green:  "#6BC7AE",
        purple: "#B18FE0",
        neutral:"#98A2B3",
        red:    "#E0899B",
    };

    function drawEqRow(ctx, x, y, right, name, label, tier) {
        // Item name
        ctx.fillStyle = "#EEF1F5";
        ctx.font = "600 13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(name, x, y);

        // Label below
        ctx.fillStyle = TEXT_FAINT;
        ctx.font = "400 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(label, x, y + 18);

        // Tier badge (if present)
        if (tier) {
            var tierLower = tier.toLowerCase();
            var badgeGroup = TIER_CLASSES[tierLower] || "neutral";
            var badgeW = 52;
            var badgeH = 20;
            var badgeX = right - badgeW;

            ctx.save();
            roundRect(ctx, badgeX, y + 2, badgeW, badgeH, 10);
            ctx.fillStyle = TIER_BG[badgeGroup] || TIER_BG.neutral;
            ctx.fill();

            ctx.fillStyle = TIER_FG[badgeGroup] || TIER_FG.neutral;
            ctx.font = "700 9px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(tier, badgeX + badgeW / 2, y + 2 + badgeH / 2 + 1);
            ctx.textBaseline = "top";
            ctx.restore();
        }
    }

})();
