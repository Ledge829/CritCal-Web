/*
 * Build rating card for CritCal -- landscape showcase layout.
 *
 * LAYOUT:
 *   LEFT  (~55%) — structured build information
 *   RIGHT (~45%) — character gacha splash art, emerging from
 *                  an element-colored atmosphere via a gradient fade
 *
 * The splash art is the visual anchor; the data reads cleanly
 * on the left with strong typographic hierarchy. Nothing overlaps.
 *
 * Canvas: 1000 × 540 at 1x (drawn at 2x for retina).
 *
 * Inspired by the Akasha.cv philosophy of art-as-composition:
 * the character portrait drives the card's atmosphere, and the
 * data is cleanly layered alongside it — not floating, not beside
 * it as a separate panel, but sharing the same element-toned canvas.
 */

(function () {
    "use strict";

    var W = 1000;
    var H = 540;
    var SCALE = 2;

    var SPLASH_LEFT = 540;    // right panel starts here (54%)
    var PAD_LEFT = 30;         // left panel content padding
    var CONTENT_W = SPLASH_LEFT - PAD_LEFT * 2;  // ~480px
    var ATMO_FADE = 120;       // width of the art fade-in gradient

    // ==========================================================
    // ELEMENT ATMOSPHERE PROFILES
    //
    // Each element gets a distinct visual mood. The `hex` is the
    // bright accent color; `dark` is the deep atmospheric tone
    // used as the card's base background.
    // ==========================================================

    var EL = {
        pyro:   { hex: "#E0785C", dark: "#1A0E0A" },
        hydro:  { hex: "#5B9BD6", dark: "#0A141E" },
        anemo:  { hex: "#6BC7AE", dark: "#0A1814" },
        electro:{ hex: "#B18FE0", dark: "#0F0A1A" },
        dendro: { hex: "#97BE58", dark: "#0F1408" },
        cryo:   { hex: "#83C6DE", dark: "#0A1418" },
        geo:    { hex: "#D6B96C", dark: "#14100A" },
    };

    function el(key) {
        return EL[key] || EL.hydro;
    }

    // ==========================================================
    // HELPERS
    // ==========================================================

    function capitalize(s) {
        if (!s) return "";
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function fmtStat(key, val) {
        if (val == null) return "—";
        var num = Number(val);
        if (key === "er") return num.toFixed(0) + "%";
        if (num >= 10000) return Math.round(num / 1000) + "k";
        return Math.round(num).toLocaleString();
    }

    function roundRectPath(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
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

    function drawTierBadge(ctx, label, x, y) {
        if (!label) return;
        var key = (label + "").toLowerCase();
        var styles = {
            bis:             { bg: "rgba(214,185,108,0.22)", fg: "#D6B96C" },
            secondary:       { bg: "rgba(91,155,214,0.22)",  fg: "#5B9BD6" },
            f2p:             { bg: "rgba(107,199,174,0.22)", fg: "#6BC7AE" },
            niche:           { bg: "rgba(177,143,224,0.22)", fg: "#B18FE0" },
            unlisted:        { bg: "rgba(152,162,179,0.22)", fg: "#98A2B3" },
            unrecognized:    { bg: "rgba(224,137,155,0.22)", fg: "#E0899B" },
            "type mismatch": { bg: "rgba(224,137,155,0.22)", fg: "#E0899B" },
            hybrid:          { bg: "rgba(152,162,179,0.22)", fg: "#98A2B3" },
            fragmented:      { bg: "rgba(224,137,155,0.22)", fg: "#E0899B" },
        };
        var t = styles[key] || styles.unlisted;
        var w = 46, h = 18;
        ctx.save();
        roundRectPath(ctx, x, y, w, h, 9);
        ctx.fillStyle = t.bg;
        ctx.fill();
        ctx.fillStyle = t.fg;
        ctx.font = "700 8.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x + w / 2, y + h / 2 + 1);
        ctx.restore();
    }

    // ==========================================================
    // MAIN RENDERER
    // ==========================================================

    window.generateRatingCard = async function (result, charInfo) {
        var canvas = document.createElement("canvas");
        canvas.width = W * SCALE;
        canvas.height = H * SCALE;
        var ctx = canvas.getContext("2d");
        ctx.scale(SCALE, SCALE);

        var info = charInfo || {};
        var e = el(info.element);
        var eHex = e.hex;
        var eDark = e.dark;

        // Grade color
        var gradeColor = result.embed_color;
        if (!gradeColor) {
            var gl = (result.grade || "")[0];
            gradeColor = { S: "#6BC7AE", A: "#5B9BD6", B: "#B18FE0", C: "#D6B96C", D: "#E0899B" }[gl] || "#5B9BD6";
        }

        var charName = result.character || "Unknown";
        var grade = result.grade || "?";
        var score = result.overall_score != null ? result.overall_score : "--";
        var cv = result.crit_value != null ? result.crit_value : "--";
        var cr = result.crit_rate != null ? result.crit_rate : "--";
        var cd = result.crit_dmg != null ? result.crit_dmg : "--";
        var splashUrl = info.splash || null;
        var stats = result.stats_used || {};

        ctx.textBaseline = "top";

        // ==========================================================
        // 1. BACKGROUND — deep void base + element atmosphere
        // ==========================================================

        // Solid dark base
        ctx.fillStyle = "#080A0E";
        ctx.fillRect(0, 0, W, H);

        // Element atmosphere — a large radial glow centered near the
        // join between the info panel and splash art, so the same
        // lighting falls across both halves of the card.
        var atmos = ctx.createRadialGradient(
            SPLASH_LEFT - 80, H * 0.4, 20,
            SPLASH_LEFT - 80, H * 0.4, H * 0.95
        );
        atmos.addColorStop(0, eHex + "30");
        atmos.addColorStop(0.35, eHex + "15");
        atmos.addColorStop(0.65, eDark + "AA");
        atmos.addColorStop(1, "#080A0E");
        ctx.fillStyle = atmos;
        ctx.fillRect(0, 0, W, H);

        // ==========================================================
        // 2. SPLASH ART (right side) — with gradient blend into bg
        // ==========================================================

        if (splashUrl) {
            var img = await new Promise(function (resolve) {
                var i = new Image();
                i.crossOrigin = "anonymous";
                i.onload = function () { resolve(i); };
                i.onerror = function () { resolve(null); };
                i.src = splashUrl;
            });

            if (img) {
                // Cover: fill the right panel while maintaining aspect
                // ratio. Gacha splash art has the character's face in
                // the upper portion, so bias the vertical crop upward
                // (15% above, 85% below) instead of centering it — a
                // centered crop would cut the face off for most characters.
                var pw = W - SPLASH_LEFT;   // 460
                var ph = H;                 // 540
                var imgScale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
                var sw = pw / imgScale;
                var sh = ph / imgScale;
                var sx = (img.naturalWidth - sw) / 2;
                var sy = Math.max(0, (img.naturalHeight - sh) * 0.15);

                ctx.save();
                ctx.beginPath();
                ctx.rect(SPLASH_LEFT, 0, pw, ph);
                ctx.clip();
                ctx.drawImage(img, sx, sy, sw, sh, SPLASH_LEFT, 0, pw, ph);
                ctx.restore();

                // Gradient mask — left edge of the art fades into the
                // dark background so the character "emerges" from the
                // atmosphere rather than sitting in a box.
                var fadeGrad = ctx.createLinearGradient(SPLASH_LEFT, 0, SPLASH_LEFT + ATMO_FADE, 0);
                fadeGrad.addColorStop(0,    "rgba(8,10,14,1)");
                fadeGrad.addColorStop(0.4,  "rgba(8,10,14,0.5)");
                fadeGrad.addColorStop(0.7,  "rgba(8,10,14,0.15)");
                fadeGrad.addColorStop(1,    "rgba(8,10,14,0)");
                ctx.fillStyle = fadeGrad;
                ctx.fillRect(SPLASH_LEFT, 0, ATMO_FADE, ph);
            }
        }

        // ==========================================================
        // 3. LEFT PANEL — build information
        // ==========================================================

        ctx.textAlign = "left";

        // ---- 3a. GRADE + SCORE ----
        var y = 30;
        ctx.fillStyle = gradeColor;
        ctx.font = "700 48px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(grade, PAD_LEFT, y);

        // Score beside grade
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "600 20px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(String(score), PAD_LEFT + 60, y + 8);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "500 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("OVERALL SCORE", PAD_LEFT + 60, y + 32);

        // ---- 3b. CHARACTER NAME ----
        y = 90;
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 26px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(charName, PAD_LEFT, y);

        // ---- 3c. ELEMENT BADGE + RARITY STARS ----
        y = 126;
        var elemLabel = capitalize(info.element || "");

        if (elemLabel) {
            var badgeW = Math.max(ctx.measureText(elemLabel).width + 16, 50);
            roundRectPath(ctx, PAD_LEFT, y, badgeW, 20, 10);
            ctx.fillStyle = eHex + "22";
            ctx.fill();

            ctx.fillStyle = eHex;
            ctx.font = "600 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textBaseline = "top";
            ctx.fillText(elemLabel, PAD_LEFT + 8, y + 5);
        }

        // Rarity stars
        var starStr = "";
        var rarity = info.rarity || 4;
        for (var si = 0; si < rarity; si++) starStr += "★";
        if (starStr) {
            ctx.fillStyle = rarity >= 5 ? "#D6B96C" : "#B79EDB";
            ctx.font = "12px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textBaseline = "top";
            ctx.fillText(starStr, PAD_LEFT + (elemLabel ? badgeW + 10 : 0), y + 4);
        }

        // ---- 3d. ACCENT RULE ----
        var ruleY = y + 34;
        ctx.save();
        ctx.strokeStyle = eHex + "35";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD_LEFT, ruleY);
        ctx.lineTo(PAD_LEFT + CONTENT_W, ruleY);
        ctx.stroke();
        ctx.restore();

        // ---- 3e. CRIT RATIO ----
        var cy = ruleY + 18;

        // Label
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textBaseline = "top";
        ctx.fillText("CRIT RATIO", PAD_LEFT, cy);

        // CR / CD values
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 17px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        var critLine = cr + "% / " + cd + "%";
        ctx.fillText(critLine, PAD_LEFT, cy + 15);

        // CV — right-aligned
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "500 14px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("CV " + cv, PAD_LEFT + CONTENT_W, cy + 17);
        ctx.textAlign = "left";

        // ---- 3f. STATS ----
        var sy = cy + 52;

        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("STATS", PAD_LEFT, sy);

        // Build a clean array of non-zero stats
        var statDefs = [
            { key: "hp",  label: "HP",  fmtKey: "hp" },
            { key: "atk", label: "ATK", fmtKey: "atk" },
            { key: "def", label: "DEF", fmtKey: "def" },
            { key: "elemental_mastery", label: "EM", fmtKey: "em" },
            { key: "energy_recharge",   label: "ER", fmtKey: "er" },
        ];
        var entries = [];
        for (var i = 0; i < statDefs.length; i++) {
            var sd = statDefs[i];
            var val = stats[sd.key];
            if (val != null && val > 0) {
                entries.push({ label: sd.label, value: fmtStat(sd.fmtKey, val) });
            }
        }

        var statTop = sy + 16;
        var halfCol = CONTENT_W / 2;
        var statLabelW = 35;  // fixed width for the label column

        for (var j = 0; j < entries.length; j++) {
            var col = j % 2;
            var row = (j / 2) | 0;
            var ex = PAD_LEFT + (col === 0 ? 0 : halfCol);
            var ey = statTop + row * 22;

            // Label
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.font = "500 12px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textBaseline = "top";
            ctx.fillText(entries[j].label, ex, ey);

            // Value
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "600 13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(entries[j].value, ex + statLabelW, ey);
        }

        // ---- 3h. EQUIPMENT ----
        var statRows = Math.ceil(entries.length / 2);
        var eqTop = statTop + statRows * 22 + 14;

        var hasWeapon = result.weapon_name;
        var hasSet = result.primary_artifact_set_name;

        // ---- 3g. EQUIPMENT (only if data was provided) ----
        if (hasWeapon || hasSet) {
            ctx.fillStyle = "rgba(255,255,255,0.45)";
            ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText("EQUIPMENT", PAD_LEFT, eqTop);

            var eqY = eqTop + 16;

            if (hasWeapon) {
                var wr = result.weapon_refinement ? "  R" + result.weapon_refinement : "";
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.font = "500 12px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText(result.weapon_name + wr, PAD_LEFT, eqY);
                if (result.weapon_tier) {
                    drawTierBadge(ctx, result.weapon_tier, PAD_LEFT + CONTENT_W - 46, eqY - 1);
                }
                eqY += 22;
            }

            if (hasSet) {
                var setLabel = result.primary_artifact_set_name;
                if (result.primary_artifact_set_count) {
                    setLabel += "  " + result.primary_artifact_set_count + "pc";
                }
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.font = "500 12px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText(setLabel, PAD_LEFT, eqY);
                if (result.artifact_tier) {
                    drawTierBadge(ctx, result.artifact_tier, PAD_LEFT + CONTENT_W - 46, eqY - 1);
                }
            }
        }

        // ---- 3g. FOOTER ----
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textBaseline = "bottom";
        ctx.fillText("CritCal  ·  Open Source  ·  Built by the community", W / 2, H - 18);

        // ==========================================================
        // 4. OUTPUT
        // ==========================================================

        return new Promise(function (resolve) {
            canvas.toBlob(function (blob) {
                resolve(blob);
            }, "image/png");
        });
    };

})();
