/*
Canvas-based build card — banner/widget style inspired by akasha.cv.

Produces a wide, compact PNG card (720 x 360 at 1x, drawn at 2x for retina)
that fits comfortably in social feeds, Discord embeds, or as a share image.

Layout (L = left column ~180px, R = right column ~516px):
  ┌─────────────────────────────────────────────────────────────┐
  │ ██ element-colored top bar                                  │
  │                                                              │
  │  ┌────────┐  Character Name      ┌───┐  Score  Crit Value  │
  │  │Portrait│  ★★★★★  Element      │ S │  92.6   352         │
  │  │  72px  │  Build Title         └───┘                     │
  │  │ circle │  HP 32k  ATK 1.2k                              │
  │  │ on bg  │  DEF 720  EM   40  ER 181%                    │
  │  └────────┘                                                │
  │              Staff of Homa R1                   [BiS]      │
  │              4pc Crimson Witch of Flames        [BiS]      │
  │                                                              │
  │              CritCal · trycritcal.vercel.app                │
  │ ██ grade-colored bottom bar                                 │
  └─────────────────────────────────────────────────────────────┘

Usage:
    const blob = await window.generateRatingCard(resultData, charInfo);
    // PNG blob ready for <a download> or navigator.share()
*/

(function () {
    "use strict";

    // Banner dimensions (2:1 ratio)
    var W = 720;
    var H = 388;
    var SCALE = 2;

    // Layout constants (1x coords)
    var PAD = 20;          // outer padding
    var LEFT_W = 140;      // left column width (portrait area)
    var LEFT_CX = PAD + Math.round(LEFT_W / 2);  // portrait center X
    var RIGHT_X = PAD + LEFT_W + 16;             // right column start X
    var RIGHT_W = W - RIGHT_X - PAD;             // right column width

    // Element accent palette (matches design system)
    var ELEMENT = {
        pyro:   { hex: "#E0785C", glow: "rgba(224,120,92,0.20)" },
        hydro:  { hex: "#5B9BD6", glow: "rgba(91,155,214,0.20)" },
        anemo:  { hex: "#6BC7AE", glow: "rgba(107,199,174,0.20)" },
        electro:{ hex: "#B18FE0", glow: "rgba(177,143,224,0.20)" },
        dendro: { hex: "#97BE58", glow: "rgba(151,190,88,0.20)"  },
        cryo:   { hex: "#83C6DE", glow: "rgba(131,198,222,0.20)" },
        geo:    { hex: "#D6B96C", glow: "rgba(214,185,108,0.20)" },
    };

    function el(key) {
        return ELEMENT[key] || ELEMENT.hydro;
    }

    // ==========================================================
    // CANVAS UTILITIES
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
        if (num >= 10000) return Math.round(num / 1000) + "k";
        if (num >= 1000) return Math.round(num).toLocaleString();
        if (key === "em") return num.toFixed(0);
        return num.toFixed(0);
    }

    // ==========================================================
    // PORTRAIT
    // ==========================================================

    function drawPortrait(ctx, cx, cy, radius, charInfo) {
        return new Promise(function (resolve) {
            var info = charInfo || {};
            var initial = (info.name || "?").charAt(0).toUpperCase();
            var url = info.portrait;
            var e = el(info.element);

            // Glow ring behind portrait
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = e.glow;
            ctx.fill();
            ctx.restore();

            if (!url) {
                drawInitial(ctx, cx, cy, radius, initial, e.hex);
                resolve();
                return;
            }

            var img = new Image();
            img.crossOrigin = "anonymous";

            img.onload = function () {
                ctx.save();
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);

                // Thin border over the image
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.strokeStyle = e.hex + "55";
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
                resolve();
            };

            img.onerror = function () {
                drawInitial(ctx, cx, cy, radius, initial, e.hex);
                resolve();
            };

            img.src = url;
        });
    }

    function drawInitial(ctx, cx, cy, radius, letter, color) {
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
        ctx.font = "600 30px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(letter, cx, cy + 1);
        ctx.restore();
    }

    // ==========================================================
    // TIER BADGE
    // ==========================================================

    var TIER_META = {
        "bis":             { bg: "rgba(214,185,108,0.20)", fg: "#D6B96C" },
        "secondary":       { bg: "rgba(91,155,214,0.20)",  fg: "#5B9BD6" },
        "f2p":             { bg: "rgba(107,199,174,0.20)", fg: "#6BC7AE" },
        "niche":           { bg: "rgba(177,143,224,0.20)", fg: "#B18FE0" },
        "unlisted":        { bg: "rgba(152,162,179,0.20)", fg: "#98A2B3" },
        "unrecognized":    { bg: "rgba(224,137,155,0.20)", fg: "#E0899B" },
        "type mismatch":   { bg: "rgba(224,137,155,0.20)", fg: "#E0899B" },
        "hybrid":          { bg: "rgba(152,162,179,0.20)", fg: "#98A2B3" },
        "fragmented":      { bg: "rgba(224,137,155,0.20)", fg: "#E0899B" },
    };

    function drawTierBadge(ctx, label, x, y) {
        var key = (label || "").toLowerCase();
        var meta = TIER_META[key] || TIER_META.unlisted;
        var bw = 48, bh = 18;
        roundRect(ctx, x, y, bw, bh, 9);
        ctx.fillStyle = meta.bg;
        ctx.fill();
        ctx.fillStyle = meta.fg;
        ctx.font = "700 8px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x + bw / 2, y + bh / 2 + 1);
        ctx.textBaseline = "top";
    }

    // ==========================================================
    // MAIN RENDERER
    // ==========================================================

    /**
     * Generates a PNG build card in banner/widget style.
     * @param {Object} result - Full rate_build API response.
     * @param {Object} charInfo - { element, portrait, name, key, rarity }.
     * @returns {Promise<Blob>}
     */
    window.generateRatingCard = async function (result, charInfo) {
        var canvas = document.createElement("canvas");
        canvas.width = W * SCALE;
        canvas.height = H * SCALE;
        var ctx = canvas.getContext("2d");
        ctx.scale(SCALE, SCALE);
        ctx.textBaseline = "top";

        var info = charInfo || {};
        var e = el(info.element);
        var gradeColor = result.embed_color;
        if (!gradeColor) {
            var g = (result.grade || "")[0];
            gradeColor = { S: "#6BC7AE", A: "#5B9BD6", B: "#B18FE0", C: "#D6B96C", D: "#E0899B" }[g] || "#5B9BD6";
        }

        var name = result.character || "Unknown";
        var buildTitle = result.build_title || "";
        var grade = result.grade || "?";
        var score = result.overall_score != null ? result.overall_score : "--";
        var cv = result.crit_value != null ? result.crit_value : "--";
        var cr = result.crit_rate != null ? result.crit_rate : "--";
        var cd = result.crit_dmg != null ? result.crit_dmg : "--";

        // ---- BACKGROUND ----
        ctx.fillStyle = "#0A0D13";
        ctx.fillRect(0, 0, W, H);

        // Subtle element gradient on the left column
        var grad = ctx.createRadialGradient(LEFT_CX, 70, 10, LEFT_CX, 100, 180);
        grad.addColorStop(0, e.hex + "20");
        grad.addColorStop(1, "rgba(10,13,19,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, LEFT_W + PAD + 20, H);

        // Card surface (slightly lighter panel)
        roundRect(ctx, 8, 8, W - 16, H - 16, 14);
        ctx.fillStyle = "#10141C";
        ctx.fill();

        // ---- TOP ACCENT BAR (element-colored) ----
        roundRect(ctx, 8, 8, W - 16, 5, 2.5);
        ctx.fillStyle = e.hex;
        ctx.fill();

        // ---- PORTRAIT (left column) ----
        var portY = 48;
        await drawPortrait(ctx, LEFT_CX, portY + 36, 36, info);

        // Element label below portrait
        if (info.element) {
            ctx.fillStyle = e.hex;
            ctx.font = "500 9px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(capitalize(info.element), LEFT_CX, portY + 82);
        }

        // ---- NAME + STARS (top of right column) ----
        var x = RIGHT_X;
        ctx.textAlign = "left";
        ctx.fillStyle = "#EEF1F5";
        ctx.font = "600 20px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(name, x, 40);

        // Rarity stars next to/subtitle
        var rarity = info.rarity || 5;
        var starStr = "";
        for (var si = 0; si < rarity; si++) starStr += "★";
        ctx.fillStyle = rarity >= 5 ? "#D6B96C" : "#B79EDB";
        ctx.font = "12px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(starStr, x + ctx.measureText(name).width + 10, 44);
        // Also show weapon type
        ctx.fillStyle = "#666F7F";
        ctx.font = "400 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        var wepTypeX = x + ctx.measureText(name).width + 10 + ctx.measureText(starStr).width + 12;
        // Only if we have a weapon type from somewhere... skip if not available

        // Build title
        if (buildTitle) {
            ctx.fillStyle = "#98A2B3";
            ctx.font = "400 11px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(buildTitle, x, 66);
        }

        // ---- GRADE CIRCLE (right side) ----
        var gX = W - PAD - 34;
        var gY = 38;

        ctx.save();
        ctx.beginPath();
        ctx.arc(gX, gY + 34, 34, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = gradeColor + "18";
        ctx.fill();
        ctx.strokeStyle = gradeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = gradeColor;
        ctx.font = "700 28px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(grade, gX, gY + 34 + 1);
        ctx.textBaseline = "top";
        ctx.restore();

        // Score label above grade circle
        ctx.fillStyle = "#666F7F";
        ctx.font = "500 8px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SCORE", gX, gY - 10);

        // Score value to the right of grade, or... actually let me put score and CV in a column right of the grade circle
        var infoX = gX + 44;
        ctx.textAlign = "left";
        ctx.fillStyle = "#EEF1F5";
        ctx.font = "600 18px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(String(score), infoX, gY + 6);

        ctx.fillStyle = "#666F7F";
        ctx.font = "400 8px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("OVERALL SCORE", infoX, gY + 30);

        ctx.fillStyle = "#EEF1F5";
        ctx.font = "600 14px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("CV " + cv, infoX, gY + 48);

        // ---- CRIT RATIO ROW ----
        var rowY = 100;
        ctx.fillStyle = "#98A2B3";
        ctx.font = "400 11px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Crit Rate " + cr + "%  /  Crit DMG " + cd + "%", x, rowY);

        // Grade description
        if (result.grade_description) {
            ctx.fillStyle = "#666F7F";
            ctx.font = "400 9px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(result.grade_description, x, rowY + 16);
        }

        // ---- STATS ROW ----
        var statsY = 142;
        var stats = result.stats_used || {};
        var statDefs = [
            { key: "hp",  label: "HP",  ikey: "hp" },
            { key: "atk", label: "ATK", ikey: "atk" },
            { key: "def", label: "DEF", ikey: "def" },
            { key: "elemental_mastery", label: "EM",  ikey: "em" },
            { key: "energy_recharge",   label: "ER",  ikey: "er" },
        ];
        var hasStats = statDefs.some(function (s) { return stats[s.key] != null && stats[s.key] > 0; });

        if (hasStats) {
            // Background panel for stats
            var statPanelX = x;
            var statPanelY = statsY;
            var statPanelW = RIGHT_W;
            var statPanelH = 42;
            roundRect(ctx, statPanelX, statPanelY, statPanelW, statPanelH, 8);
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            ctx.fill();

            var statCount = statDefs.length;
            var cellW = Math.floor(statPanelW / statCount);
            for (var i = 0; i < statCount; i++) {
                var sd = statDefs[i];
                var sx = statPanelX + cellW * i + Math.floor(cellW / 2);

                if (stats[sd.key] != null && stats[sd.key] > 0) {
                    ctx.fillStyle = "#EEF1F5";
                    ctx.font = "600 16px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText(fmtStat(sd.ikey, stats[sd.key]), sx, statPanelY + 7);

                    ctx.fillStyle = "#666F7F";
                    ctx.font = "500 8px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                    ctx.fillText(sd.label, sx, statPanelY + 30);
                }
            }
        }

        // ---- EQUIPMENT ----
        var eqY = hasStats ? statsY + statPanelH + 14 : statsY + 10;

        var hasWeapon = result.weapon_name;
        var hasArtifact = result.primary_artifact_set_name;

        if (hasWeapon || hasArtifact) {
            // Background panel
            var eqPanelX = x;
            var eqPanelH = (hasWeapon && hasArtifact ? 58 : 34);
            roundRect(ctx, eqPanelX, eqY, RIGHT_W, eqPanelH, 8);
            ctx.fillStyle = "rgba(255,255,255,0.03)";
            ctx.fill();

            var eqInnerY = eqY + 8;

            if (hasWeapon) {
                var wepRefine = result.weapon_refinement ? " R" + result.weapon_refinement : "";
                ctx.textAlign = "left";
                ctx.fillStyle = "#EEF1F5";
                ctx.font = "600 12px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText(result.weapon_name + wepRefine, eqPanelX + 10, eqInnerY);

                ctx.fillStyle = "#666F7F";
                ctx.font = "400 9px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText("Weapon", eqPanelX + 10, eqInnerY + 18);

                if (result.weapon_tier) {
                    drawTierBadge(ctx, result.weapon_tier, eqPanelX + RIGHT_W - 62, eqInnerY);
                }

                eqInnerY += 28;
            }

            if (hasArtifact) {
                ctx.textAlign = "left";
                ctx.fillStyle = "#EEF1F5";
                ctx.font = "600 12px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                var setCount = result.primary_artifact_set_count ? result.primary_artifact_set_count + "pc" : "";
                ctx.fillText(result.primary_artifact_set_name + (setCount ? "  (" + setCount + ")" : ""), eqPanelX + 10, eqInnerY);

                ctx.fillStyle = "#666F7F";
                ctx.font = "400 9px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.fillText("Artifact Set", eqPanelX + 10, eqInnerY + 18);

                if (result.artifact_tier) {
                    drawTierBadge(ctx, result.artifact_tier, eqPanelX + RIGHT_W - 62, eqInnerY);
                }
            }
        }

        // ---- FOOTER ----
        ctx.fillStyle = "#444C5A";
        ctx.font = "400 9px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CritCal  ·  trycritcal.vercel.app", W / 2, H - 24);

        // ---- BOTTOM ACCENT BAR (grade-colored) ----
        roundRect(ctx, 8, H - 11, W - 16, 5, 2.5);
        ctx.fillStyle = gradeColor;
        ctx.fill();

        // ---- PRODUCE BLOB ----
        return new Promise(function (resolve) {
            canvas.toBlob(function (blob) {
                resolve(blob);
            }, "image/png");
        });
    };

})();
