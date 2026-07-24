/*
 * Build rating card for CritCal — premium polish pass.
 *
 * LAYOUT:
 *   LEFT  (~54%) — structured build information with score as hero
 *   RIGHT (~46%) — character gacha splash art, blended into the
 *                  left panel via wide element-colored gradient
 *
 * Visual hierarchy: Score → Character → Crit Ratio → Stats → Equipment
 * Every element gets the eye in the right order.
 *
 * Canvas: 1000 × 540 (drawn at 2x for retina).
 */

(function () {
    "use strict";

    var W = 1000;
    var H = 540;
    var SCALE = 2;

    var SPLASH_LEFT = 460;    // art starts blending here (~46%)
    var PAD = 32;              // left panel content padding
    var CONTENT_W = SPLASH_LEFT - PAD * 2;  // ~396px
    var ATMO_FADE = 220;       // wide gradient blends art into panel

    // ==========================================================
    // ELEMENT ATMOSPHERE PROFILES
    //
    // Each element has a distinct mood. The `hex` is the accent
    // color used for glows and badges; `dark` is the deep base;
    // `glow` is used for the bloom behind the character.
    // ==========================================================

    var EL = {
        pyro:   { hex: "#E0785C", dark: "#1A0E0A", glow: "#E0785C" },
        hydro:  { hex: "#5B9BD6", dark: "#0A141E", glow: "#5B9BD6" },
        anemo:  { hex: "#6BC7AE", dark: "#0A1814", glow: "#6BC7AE" },
        electro:{ hex: "#B18FE0", dark: "#0F0A1A", glow: "#B18FE0" },
        dendro: { hex: "#97BE58", dark: "#0F1408", glow: "#97BE58" },
        cryo:   { hex: "#83C6DE", dark: "#0A1418", glow: "#83C6DE" },
        geo:    { hex: "#D6B96C", dark: "#14100A", glow: "#D6B96C" },
    };

    function el(key) {
        return EL[key] || EL.hydro;
    }

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

    function roundRect(ctx, x, y, w, h, r) {
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
        var bw = 46, bh = 18;
        ctx.save();
        roundRect(ctx, x, y, bw, bh, 9);
        ctx.fillStyle = t.bg;
        ctx.fill();
        ctx.fillStyle = t.fg;
        ctx.font = "700 8.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x + bw / 2, y + bh / 2 + 1);
        ctx.restore();
    }

    function drawGradeBadge(ctx, letter, x, y, color) {
        var size = 34;
        roundRect(ctx, x, y, size, size, 10);
        ctx.fillStyle = color + "20";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        roundRect(ctx, x, y, size, size, 10);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = "700 17px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(letter, x + size / 2, y + size / 2 + 1);
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
        var scoreText = result.overall_score != null ? String(result.overall_score) : "--";
        var cv = result.crit_value != null ? result.crit_value : "--";
        var cr = result.crit_rate != null ? result.crit_rate : "--";
        var cd = result.crit_dmg != null ? result.crit_dmg : "--";
        var splashUrl = info.splash || null;
        var stats = result.stats_used || {};

        ctx.textBaseline = "top";

        // ==========================================================
        // 1. BACKGROUND — deep void + element atmosphere glow
        // ==========================================================

        ctx.fillStyle = "#080A0E";
        ctx.fillRect(0, 0, W, H);

        // Element bloom — centered on the splash art area, radiating
        // outward so both panels share the same atmospheric lighting.
        var bloomCX = SPLASH_LEFT + (W - SPLASH_LEFT) * 0.35;
        var bloomCY = H * 0.4;
        var bloom = ctx.createRadialGradient(bloomCX, bloomCY, 10, bloomCX, bloomCY, H * 0.95);
        bloom.addColorStop(0, eHex + "45");
        bloom.addColorStop(0.25, eHex + "25");
        bloom.addColorStop(0.55, eDark + "AA");
        bloom.addColorStop(1, "#080A0E");
        ctx.fillStyle = bloom;
        ctx.fillRect(0, 0, W, H);

        // Deeper tone on the far left so the info panel stays readable
        var leftShade = ctx.createLinearGradient(0, 0, SPLASH_LEFT * 0.6, 0);
        leftShade.addColorStop(0, "rgba(8,10,14,0.5)");
        leftShade.addColorStop(1, "rgba(8,10,14,0)");
        ctx.fillStyle = leftShade;
        ctx.fillRect(0, 0, Math.round(SPLASH_LEFT * 0.6), H);

        // ==========================================================
        // 2. SPLASH ART — blended via wide gradient + element tint
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
                // Less aggressive cover — scale so more of the character
                // is visible than a strict cover crop would allow.
                var pw = W - SPLASH_LEFT;   // 540
                var ph = H;                 // 540
                var imgScale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
                // Slightly reduce scale so we see more of the character
                imgScale = imgScale * 0.92;
                var sw = pw / imgScale;
                var sh = ph / imgScale;
                var sx = (img.naturalWidth - sw) / 2;
                // Bias toward the face (upper portion of the art)
                var sy = Math.max(0, (img.naturalHeight - sh) * 0.1);

                ctx.save();
                ctx.beginPath();
                ctx.rect(SPLASH_LEFT, 0, pw, ph);
                ctx.clip();
                ctx.drawImage(img, sx, sy, sw, sh, SPLASH_LEFT, 0, pw, ph);
                ctx.restore();

                // Primary gradient — dark-to-transparent fade on the
                // left edge of the art, making it emerge from the bg.
                var fadeGrad = ctx.createLinearGradient(SPLASH_LEFT, 0, SPLASH_LEFT + ATMO_FADE, 0);
                fadeGrad.addColorStop(0,    "rgba(8,10,14,1)");
                fadeGrad.addColorStop(0.25, "rgba(8,10,14,0.6)");
                fadeGrad.addColorStop(0.5,  "rgba(8,10,14,0.25)");
                fadeGrad.addColorStop(0.75, "rgba(8,10,14,0.08)");
                fadeGrad.addColorStop(1,    "rgba(8,10,14,0)");
                ctx.fillStyle = fadeGrad;
                ctx.fillRect(SPLASH_LEFT, 0, ATMO_FADE, ph);

                // Element-tinted overlay — washes the left edge of the
                // art in the character's element color so it blends
                // naturally with the info panel's atmosphere.
                var elOverlay = ctx.createLinearGradient(SPLASH_LEFT, 0, SPLASH_LEFT + ATMO_FADE * 0.5, 0);
                elOverlay.addColorStop(0, eDark);
                elOverlay.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = elOverlay;
                ctx.fillRect(SPLASH_LEFT, 0, Math.round(ATMO_FADE * 0.5), ph);
            }
        }

        // ==========================================================
        // 3. LEFT PANEL — build information
        // ==========================================================

        var x = PAD;
        ctx.textAlign = "left";

        // ---- 3a. OVERALL SCORE (hero) + Grade badge ----
        var y = 28;
        // Score number — big, bold, white
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 52px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(scoreText, x, y);

        // Score label beneath
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "500 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("OVERALL SCORE", x, y + 56);

        // Grade badge — sits beside the score value
        var gradeBadgeX = x + ctx.measureText(scoreText).width + 14;
        drawGradeBadge(ctx, grade, gradeBadgeX, y + 4, gradeColor);

        // ---- 3b. CHARACTER NAME ----
        y = 100;
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 26px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(charName, x, y);

        // ---- 3c. ELEMENT BADGE + RARITY + WEAPON TYPE ----
        y = 134;
        var elemLabel = capitalize(info.element || "");

        if (elemLabel) {
            var badgeW = Math.max(ctx.measureText(elemLabel).width + 16, 50);
            roundRect(ctx, x, y, badgeW, 22, 11);
            ctx.fillStyle = eHex + "22";
            ctx.fill();

            ctx.fillStyle = eHex;
            ctx.font = "600 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textBaseline = "top";
            ctx.fillText(elemLabel, x + 8, y + 6);
        }

        // Rarity stars
        var starStr = "";
        var rarity = info.rarity || 4;
        for (var si = 0; si < rarity; si++) starStr += "★";
        if (starStr) {
            var starX = x + (elemLabel ? badgeW + 10 : 0);
            ctx.fillStyle = rarity >= 5 ? "#D6B96C" : "#B79EDB";
            ctx.font = "14px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textBaseline = "top";
            ctx.fillText(starStr, starX, y + 4);
        }

        // ---- 3d. ACCENT RULE ----
        var ruleY = y + 36;
        ctx.save();
        ctx.strokeStyle = eHex + "35";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, ruleY);
        ctx.lineTo(x + CONTENT_W, ruleY);
        ctx.stroke();
        ctx.restore();

        // ---- 3e. CRIT RATIO ----
        var cy = ruleY + 20;

        // Section label
        ctx.fillStyle = "rgba(255,255,255,0.40)";
        ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("CRIT RATIO", x, cy);

        // CR / CD values — on one line, prominent
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 18px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textBaseline = "top";
        var critLabel = "CR " + cr + "%  /  CD " + cd + "%";
        ctx.fillText(critLabel, x, cy + 15);

        // CV — right-aligned on the same line
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,255,255,0.50)";
        ctx.font = "500 14px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("CV " + cv, x + CONTENT_W, cy + 17);
        ctx.textAlign = "left";

        // ---- 3f. STATS ----
        var sy = cy + 56;

        ctx.fillStyle = "rgba(255,255,255,0.40)";
        ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("STATS", x, sy);

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
        var labelW = 38;  // fixed width for perfect alignment

        for (var j = 0; j < entries.length; j++) {
            var col = j % 2;
            var row = (j / 2) | 0;
            var ex = x + (col === 0 ? 0 : halfCol);
            var ey = statTop + row * 24;

            ctx.fillStyle = "rgba(255,255,255,0.60)";
            ctx.font = "500 13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(entries[j].label, ex, ey);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "600 14px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(entries[j].value, ex + labelW, ey);
        }

        // ---- 3g. EQUIPMENT (only if data was provided) ----
        var hasWeapon = result.weapon_name;
        var hasSet = result.primary_artifact_set_name;

        if (hasWeapon || hasSet) {
            var statRows = Math.ceil(entries.length / 2);
            var eqTop = statTop + Math.max(statRows, 3) * 24 + 18;

            ctx.fillStyle = "rgba(255,255,255,0.40)";
            ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText("EQUIPMENT", x, eqTop);

            var eqY = eqTop + 18;

            if (hasWeapon) {
                var wr = result.weapon_refinement ? "  R" + result.weapon_refinement : "";
                ctx.fillStyle = "rgba(255,255,255,0.80)";
                ctx.font = "500 13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText(result.weapon_name + wr, x, eqY);
                if (result.weapon_tier) {
                    drawTierBadge(ctx, result.weapon_tier, x + CONTENT_W - 46, eqY - 1);
                }
                eqY += 24;
            }

            if (hasSet) {
                var setLabel = result.primary_artifact_set_name;
                if (result.primary_artifact_set_count) {
                    setLabel += "  " + result.primary_artifact_set_count + "pc";
                }
                ctx.fillStyle = "rgba(255,255,255,0.80)";
                ctx.font = "500 13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText(setLabel, x, eqY);
                if (result.artifact_tier) {
                    drawTierBadge(ctx, result.artifact_tier, x + CONTENT_W - 46, eqY - 1);
                }
            }
        }

        // ---- 3h. FOOTER ----
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.font = "400 8.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textBaseline = "bottom";
        ctx.fillText("CritCal", W - 18, H - 16);

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
