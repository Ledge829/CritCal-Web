/*
Promotional key-art build card for CritCal.

NOT a dashboard — this is character-first promotional art. The character
portrait dominates (50%+ of the canvas), the element gradient sets the mood,
and text overlays the artwork naturally rather than sitting in boxes.

The design goal: even without reading a single number, you know exactly
which character the card is for — the portrait and element atmosphere do
that work.

Canvas: 660 × 460 at 1x (drawn at 2x for retina). Slightly taller than
a banner — closer to a character-reveal card aspect ratio.

Usage:
    const blob = await window.generateRatingCard(resultData, charInfo);
*/

(function () {
    "use strict";

    var W = 660;
    var H = 460;
    var SCALE = 2;

    // Element color profiles
    var EL = {
        pyro:   { hex: "#E0785C", dark: "#3D1E17" },
        hydro:  { hex: "#5B9BD6", dark: "#1A2B3E" },
        anemo:  { hex: "#6BC7AE", dark: "#1C332C" },
        electro:{ hex: "#B18FE0", dark: "#2E1F3E" },
        dendro: { hex: "#97BE58", dark: "#263317" },
        cryo:   { hex: "#83C6DE", dark: "#1C323B" },
        geo:    { hex: "#D6B96C", dark: "#3A311B" },
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
        if (num >= 1000) return Math.round(num).toLocaleString();
        return num.toFixed(0);
    }

    // ==========================================================
    // PORTRAIT — large, dominant, fades into gradient
    // ==========================================================

    function drawPortrait(ctx, cx, cy, radius, charInfo) {
        return new Promise(function (resolve) {
            var info = charInfo || {};
            var initial = (info.name || "?").charAt(0).toUpperCase();
            var url = info.portrait;
            var e = el(info.element);
            var c = e.hex;

            if (!url) {
                drawInitial(ctx, cx, cy, radius, initial, c);
                resolve();
                return;
            }

            var img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = function () {
                // Soft glowing orb behind portrait
                var glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius + 40);
                glow.addColorStop(0, c + "30");
                glow.addColorStop(0.6, c + "15");
                glow.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = glow;
                ctx.fillRect(cx - radius - 60, cy - radius - 60, radius * 2 + 120, radius * 2 + 120);

                // Draw portrait clipped to circle
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
                ctx.restore();

                // Very subtle ring
                ctx.beginPath();
                ctx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
                ctx.closePath();
                ctx.strokeStyle = c + "30";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                resolve();
            };

            img.onerror = function () {
                drawInitial(ctx, cx, cy, radius, initial, c);
                resolve();
            };

            img.src = url;
        });
    }

    function drawInitial(ctx, cx, cy, radius, letter, color) {
        var glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius + 40);
        glow.addColorStop(0, color + "30");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(cx - radius - 60, cy - radius - 60, radius * 2 + 120, radius * 2 + 120);

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fill();
        ctx.strokeStyle = color + "55";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = color;
        ctx.font = "500 48px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(letter, cx, cy + 2);
    }

    // ==========================================================
    // TIER BADGE — subtle chip, supports the art
    // ==========================================================

    var TIER_STYLE = {
        "bis":             { bg: "rgba(214,185,108,0.25)", fg: "#D6B96C" },
        "secondary":       { bg: "rgba(91,155,214,0.25)",  fg: "#5B9BD6" },
        "f2p":             { bg: "rgba(107,199,174,0.25)", fg: "#6BC7AE" },
        "niche":           { bg: "rgba(177,143,224,0.25)", fg: "#B18FE0" },
        "unlisted":        { bg: "rgba(152,162,179,0.25)", fg: "#98A2B3" },
        "unrecognized":    { bg: "rgba(224,137,155,0.25)", fg: "#E0899B" },
        "type mismatch":   { bg: "rgba(224,137,155,0.25)", fg: "#E0899B" },
        "hybrid":          { bg: "rgba(152,162,179,0.25)", fg: "#98A2B3" },
        "fragmented":      { bg: "rgba(224,137,155,0.25)", fg: "#E0899B" },
    };

    function drawTier(ctx, label, x, y) {
        var key = (label || "").toLowerCase();
        var t = TIER_STYLE[key] || TIER_STYLE.unlisted;
        var w = 46, h = 16;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x + w - 8, y);
        ctx.arcTo(x + w, y, x + w, y + 8, 8);
        ctx.lineTo(x + w, y + h - 8);
        ctx.arcTo(x + w, y + h, x + w - 8, y + h, 8);
        ctx.lineTo(x + 8, y + h);
        ctx.arcTo(x, y + h, x, y + h - 8, 8);
        ctx.lineTo(x, y + 8);
        ctx.arcTo(x, y, x + 8, y, 8);
        ctx.closePath();
        ctx.fillStyle = t.bg;
        ctx.fill();

        ctx.fillStyle = t.fg;
        ctx.font = "700 8px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
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
        ctx.textBaseline = "top";

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

        var name = result.character || "Unknown";
        var buildTitle = result.build_title || "";
        var grade = result.grade || "?";
        var score = result.overall_score != null ? result.overall_score : "--";
        var cv = result.crit_value != null ? result.crit_value : "--";
        var cr = result.crit_rate != null ? result.crit_rate : "--";
        var cd = result.crit_dmg != null ? result.crit_dmg : "--";

        // ==========================================================
        // 1. BACKGROUND — element gradient
        // ==========================================================

        // Base dark
        ctx.fillStyle = "#080A0E";
        ctx.fillRect(0, 0, W, H);

        // Element atmosphere — large soft radial gradient
        var atmos = ctx.createRadialGradient(W / 2, H * 0.3, 30, W / 2, H * 0.3, H * 0.75);
        atmos.addColorStop(0, eHex + "40");
        atmos.addColorStop(0.4, eHex + "20");
        atmos.addColorStop(0.7, eDark + "AA");
        atmos.addColorStop(1, "#080A0E");
        ctx.fillStyle = atmos;
        ctx.fillRect(0, 0, W, H);

        // ==========================================================
        // 2. PORTRAIT — large, dominant
        // ==========================================================

        var portRadius = 150;
        var portCX = W / 2;
        var portCY = Math.round(H * 0.36);
        await drawPortrait(ctx, portCX, portCY, portRadius, info);

        // ==========================================================
        // 3. BOTTOM VIGNETTE — dark fade for text readability
        // ==========================================================

        var vig = ctx.createLinearGradient(0, H * 0.48, 0, H);
        vig.addColorStop(0, "rgba(8,10,14,0)");
        vig.addColorStop(0.35, "rgba(8,10,14,0.6)");
        vig.addColorStop(0.65, "rgba(8,10,14,0.92)");
        vig.addColorStop(1, "#080A0E");
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);

        // ==========================================================
        // 4. TOP ACCENT — thin element glow line
        // ==========================================================

        ctx.shadowColor = eHex;
        ctx.shadowBlur = 8;
        ctx.fillStyle = eHex;
        ctx.fillRect(PAD, 0, W - PAD * 2, 2.5);
        ctx.shadowBlur = 0;

        // ==========================================================
        // 5. CHARACTER NAME + TITLE
        // ==========================================================

        var PAD = 28;
        var leftX = PAD;

        ctx.textAlign = "left";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 6;

        // Name — prominent
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "600 26px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(name, leftX, 260);

        // Rarity stars + element tag inline
        var rarity = info.rarity || 5;
        var starStr = "";
        for (var si = 0; si < rarity; si++) starStr += "★";
        ctx.fillStyle = rarity >= 5 ? "#D6B96C" : "#B79EDB";
        ctx.font = "13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        var nameW = ctx.measureText(name).width;
        ctx.fillText(starStr, leftX + nameW + 10, 263);

        // Element + weapon type tag
        if (info.element) {
            var tagX = leftX + nameW + 10 + ctx.measureText(starStr).width + 12;
            ctx.fillStyle = eHex;
            ctx.font = "400 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(capitalize(info.element), tagX, 267);
        }

        // Build title
        if (buildTitle) {
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.font = "400 12px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(buildTitle, leftX, 295);
        }

        ctx.shadowBlur = 0;

        // ==========================================================
        // 6. GRADE + SCORE — clean, minimal
        // ==========================================================

        var gradeY = 260;

        // Grade circle on the right
        var gCX = W - PAD - 36;
        var gCY = gradeY + 4;

        ctx.save();
        ctx.beginPath();
        ctx.arc(gCX, gCY + 36, 36, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = gradeColor + "20";
        ctx.fill();
        ctx.strokeStyle = gradeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = gradeColor;
        ctx.font = "700 30px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(grade, gCX, gCY + 36 + 1);
        ctx.textBaseline = "top";
        ctx.restore();

        // Score + CV above/right of grade
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "600 20px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(String(score), gCX - 50, gradeY);

        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "400 9px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("SCORE", gCX - 50, gradeY + 26);

        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "400 12px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("CV " + cv, gCX - 50, gradeY + 44);

        // ==========================================================
        // 7. CRIT RATIO — subtle
        // ==========================================================

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "400 11px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("CR " + cr + "%  /  CD " + cd + "%", leftX, 322);

        // ==========================================================
        // 8. STATS — single line, compact
        // ==========================================================

        var stats = result.stats_used || {};
        var statDefs = [
            { key: "hp",  label: "HP",  ikey: "hp" },
            { key: "atk", label: "ATK", ikey: "atk" },
            { key: "def", label: "DEF", ikey: "def" },
            { key: "elemental_mastery", label: "EM",  ikey: "em" },
            { key: "energy_recharge",   label: "ER",  ikey: "er" },
        ];
        var hasAnyStat = statDefs.some(function (s) { return stats[s.key] != null && stats[s.key] > 0; });

        if (hasAnyStat) {
            var statY = 348;
            ctx.textAlign = "left";
            var spacing = 0;

            for (var si = 0; si < statDefs.length; si++) {
                var sd = statDefs[si];
                var val = stats[sd.key];
                var display = (val != null && val > 0) ? fmtStat(sd.ikey, val) : null;
                if (display === null) continue;

                // Each stat block: value + label
                var block = sd.label + "  " + display;
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.font = "400 11px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText(block, leftX + spacing, statY);

                spacing += ctx.measureText(block + "     ").width;
            }
        }

        // ==========================================================
        // 9. EQUIPMENT — minimal, low-opacity
        // ==========================================================

        var eqY = 385;
        var hasWeapon = result.weapon_name;
        var hasSet = result.primary_artifact_set_name;

        if (hasWeapon || hasSet) {
            ctx.textAlign = "left";

            if (hasWeapon) {
                var wr = result.weapon_refinement ? " R" + result.weapon_refinement : "";
                ctx.fillStyle = "rgba(255,255,255,0.6)";
                ctx.font = "400 11px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText(result.weapon_name + wr, leftX, eqY);

                if (result.weapon_tier) {
                    drawTier(ctx, result.weapon_tier, W - PAD - 46, eqY - 2);
                }
                eqY += 19;
            }

            if (hasSet) {
                var sc = result.primary_artifact_set_count ? result.primary_artifact_set_count + "pc" : "";
                ctx.fillStyle = "rgba(255,255,255,0.6)";
                ctx.font = "400 11px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText(result.primary_artifact_set_name + (sc ? "  " + sc : ""), leftX, eqY);

                if (result.artifact_tier) {
                    drawTier(ctx, result.artifact_tier, W - PAD - 46, eqY - 2);
                }
            }
        }

        // ==========================================================
        // 10. FOOTER — barely there
        // ==========================================================

        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "400 9px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("CritCal  ·  trycritcal.vercel.app", W / 2, H - 16);

        // ==========================================================
        // OUTPUT
        // ==========================================================

        return new Promise(function (resolve) {
            canvas.toBlob(function (blob) {
                resolve(blob);
            }, "image/png");
        });
    };

})();
