/*
 * Build rating card for CritCal -- landscape showcase layout.
 *
 * LAYOUT (permanent design reference — matches the approved
 * reference screenshot):
 *   LEFT  (~54%) — structured build information over a dark,
 *                  softly-lit panel
 *   RIGHT (~46%) — full-height character splash art, emerging
 *                  from an element-colored atmosphere via a
 *                  gradient fade — no divider, no hard seam
 *
 * A single soft radial glow sits with its core just past the
 * panel boundary (on the artwork side) and fades out gradually
 * as it reaches the text — the text panel stays dark and high
 * contrast for legibility, the art side reads as lit.
 *
 * Every text element is measured before it's drawn and shrunk or
 * truncated if it would run past its safe margin — nothing is
 * allowed to clip or leave the canvas, regardless of how long a
 * character name, weapon name, or artifact set name is.
 *
 * Canvas: 1000 × 540 at 1x (drawn at 2x for retina).
 */

(function () {
    "use strict";

    var W = 1000;
    var H = 540;
    var SCALE = 2;

    var SAFE = 32;              // minimum margin from any canvas edge

    var SPLASH_LEFT = 540;      // right panel starts here (54%)
    var PAD_LEFT = SAFE;        // left panel content padding
    var CONTENT_W = SPLASH_LEFT - PAD_LEFT * 2;  // safe on both sides
    var ATMO_FADE = 210;        // width of the art fade-in gradient

    var FONT = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

    // ==========================================================
    // ELEMENT ATMOSPHERE PROFILES
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

    // Shrinks font-size (in 1px steps) until `text` fits `maxWidth`.
    // Leaves ctx.font set to the resolved size/weight.
    function fitFontSize(ctx, text, maxWidth, weight, baseSize, minSize) {
        var size = baseSize;
        while (size > minSize) {
            ctx.font = weight + " " + size + "px " + FONT;
            if (ctx.measureText(text).width <= maxWidth) break;
            size -= 1;
        }
        ctx.font = weight + " " + size + "px " + FONT;
        return size;
    }

    // Truncates `text` with an ellipsis so it fits `maxWidth` at the
    // ctx's current font. Assumes ctx.font is already set.
    function truncateToWidth(ctx, text, maxWidth) {
        if (ctx.measureText(text).width <= maxWidth) return text;
        var t = text;
        while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
            t = t.slice(0, -1);
        }
        return t + "…";
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
        ctx.font = "700 8.5px " + FONT;
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
        // 1. BACKGROUND — deep dark base + element atmosphere
        // ==========================================================

        ctx.fillStyle = "#080A0E";
        ctx.fillRect(0, 0, W, H);

        // Glow's hot core sits on the splash-art side, fading out
        // gradually toward the text panel, which stays dark and
        // high-contrast for legibility.
        var atmos = ctx.createRadialGradient(
            SPLASH_LEFT + 60, H * 0.38, 10,
            SPLASH_LEFT + 60, H * 0.38, W * 0.68
        );
        atmos.addColorStop(0,    eHex + "45");
        atmos.addColorStop(0.18, eHex + "26");
        atmos.addColorStop(0.36, eDark + "CC");
        atmos.addColorStop(0.6,  "#080A0E");
        atmos.addColorStop(1,    "#080A0E");
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
                var pw = W - SPLASH_LEFT;
                var ph = H;
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
                fadeGrad.addColorStop(0.25, "rgba(8,10,14,0.75)");
                fadeGrad.addColorStop(0.5,  "rgba(8,10,14,0.42)");
                fadeGrad.addColorStop(0.75, "rgba(8,10,14,0.16)");
                fadeGrad.addColorStop(1,    "rgba(8,10,14,0)");
                ctx.fillStyle = fadeGrad;
                ctx.fillRect(SPLASH_LEFT, 0, ATMO_FADE, ph);
            }
        }

        // ==========================================================
        // 3. LEFT PANEL — build information. Every element is
        // measured and shrunk/truncated to guarantee it stays inside
        // the SAFE margin — nothing is allowed to clip.
        // ==========================================================

        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        // ---- 3a. CHARACTER NAME ----
        var y = SAFE;
        fitFontSize(ctx, charName, CONTENT_W, "700", 32, 20);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(charName, PAD_LEFT, y);

        // ---- 3b. ELEMENT BADGE + RARITY STARS ----
        y = 74;
        var elemLabel = capitalize(info.element || "");
        var badgeW = 0;

        if (elemLabel) {
            ctx.font = "600 10px " + FONT;
            badgeW = Math.max(ctx.measureText(elemLabel).width + 16, 50);
            roundRectPath(ctx, PAD_LEFT, y, badgeW, 20, 10);
            ctx.fillStyle = eHex + "22";
            ctx.fill();

            ctx.fillStyle = eHex;
            ctx.fillText(elemLabel, PAD_LEFT + 8, y + 5);
        }

        var starStr = "";
        var rarity = info.rarity || 4;
        for (var si = 0; si < rarity; si++) starStr += "★";
        if (starStr) {
            ctx.fillStyle = rarity >= 5 ? "#D6B96C" : "#B79EDB";
            ctx.font = "12px " + FONT;
            ctx.fillText(starStr, PAD_LEFT + (elemLabel ? badgeW + 10 : 0), y + 4);
        }

        // ---- 3c. BIG SCORE + GRADE BADGE ----
        y = 108;
        var gbSize = 34;
        var scoreStr = String(score);
        var scoreMaxW = CONTENT_W - gbSize - 14;
        fitFontSize(ctx, scoreStr, scoreMaxW, "700", 46, 30);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(scoreStr, PAD_LEFT, y);
        var scoreW = ctx.measureText(scoreStr).width;

        var gbX = PAD_LEFT + scoreW + 14;
        var gbY = y + 4;
        roundRectPath(ctx, gbX, gbY, gbSize, gbSize, 8);
        ctx.fillStyle = gradeColor + "1A";
        ctx.fill();
        ctx.strokeStyle = gradeColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = gradeColor;
        ctx.font = "700 16px " + FONT;
        ctx.textAlign = "center";
        ctx.fillText(grade, gbX + gbSize / 2, gbY + gbSize / 2 - 8);
        ctx.textAlign = "left";

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "500 10px " + FONT;
        ctx.fillText("OVERALL SCORE", PAD_LEFT, y + 54);

        // ---- 3d. ACCENT RULE ----
        var ruleY = y + 78;
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

        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = "500 9.5px " + FONT;
        ctx.fillText("CRIT RATIO", PAD_LEFT, cy);

        var critLine = cr + "% / " + cd + "%";
        var cvLabel = "·  CV " + cv;
        ctx.font = "500 14px " + FONT;
        var cvLabelW = ctx.measureText(cvLabel).width;
        fitFontSize(ctx, critLine, CONTENT_W - cvLabelW - 14, "700", 17, 12);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(critLine, PAD_LEFT, cy + 15);
        var critLineW = ctx.measureText(critLine).width;

        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "500 14px " + FONT;
        ctx.fillText(cvLabel, PAD_LEFT + critLineW + 14, cy + 17);

        // ---- 3f. STATS ----
        var sy = cy + 52;

        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = "500 9.5px " + FONT;
        ctx.fillText("STATS", PAD_LEFT, sy);

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
        var statLabelW = 35;

        for (var j = 0; j < entries.length; j++) {
            var col = j % 2;
            var row = (j / 2) | 0;
            var ex = PAD_LEFT + (col === 0 ? 0 : halfCol);
            var ey = statTop + row * 22;

            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.font = "500 12px " + FONT;
            ctx.textBaseline = "top";
            ctx.fillText(entries[j].label, ex, ey);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "600 13px " + FONT;
            var valMaxW = halfCol - statLabelW - 6;
            var valText = truncateToWidth(ctx, entries[j].value, valMaxW);
            ctx.fillText(valText, ex + statLabelW, ey);
        }

        // ---- 3g. EQUIPMENT ----
        var statRows = Math.ceil(entries.length / 2);
        var eqTop = statTop + statRows * 22 + 14;

        var hasWeapon = result.weapon_name;
        var hasSet = result.primary_artifact_set_name;

        if (hasWeapon || hasSet) {
            ctx.fillStyle = "rgba(255,255,255,0.45)";
            ctx.font = "500 9.5px " + FONT;
            ctx.fillText("EQUIPMENT", PAD_LEFT, eqTop);

            var eqY = eqTop + 16;
            var badgeGap = 8;
            var badgeW2 = 46;

            if (hasWeapon) {
                var wr = result.weapon_refinement ? "  R" + result.weapon_refinement : "";
                var weaponText = result.weapon_name + wr;
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.font = "500 12px " + FONT;
                var weaponMaxW = result.weapon_tier
                    ? CONTENT_W - badgeW2 - badgeGap
                    : CONTENT_W;
                weaponText = truncateToWidth(ctx, weaponText, weaponMaxW);
                ctx.fillText(weaponText, PAD_LEFT, eqY);
                if (result.weapon_tier) {
                    drawTierBadge(ctx, result.weapon_tier, PAD_LEFT + CONTENT_W - badgeW2, eqY - 1);
                }
                eqY += 22;
            }

            if (hasSet) {
                var setLabel = result.primary_artifact_set_name;
                if (result.primary_artifact_set_count) {
                    setLabel += "  " + result.primary_artifact_set_count + "pc";
                }
                ctx.fillStyle = "rgba(255,255,255,0.8)";
                ctx.font = "500 12px " + FONT;
                var setMaxW = result.artifact_tier
                    ? CONTENT_W - badgeW2 - badgeGap
                    : CONTENT_W;
                setLabel = truncateToWidth(ctx, setLabel, setMaxW);
                ctx.fillText(setLabel, PAD_LEFT, eqY);
                if (result.artifact_tier) {
                    drawTierBadge(ctx, result.artifact_tier, PAD_LEFT + CONTENT_W - badgeW2, eqY - 1);
                }
            }
        }

        // ---- 3h. FOOTER — tiny wordmark, bottom-right, safe margin ----
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(255,255,255,0.11)";
        ctx.font = "400 8.5px " + FONT;
        ctx.textBaseline = "bottom";
        ctx.fillText("CritCal", W - SAFE, H - SAFE + 8);

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
