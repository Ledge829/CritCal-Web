/*
 * Build rating card for CritCal — premium promotional art direction.
 *
 * The character splash art IS the composition; the UI is layered
 * alongside it, sharing the same element-toned atmosphere. Every
 * element flows together with no hard boundaries.
 *
 * Visual hierarchy: Character Name → Overall Score → Crit Stats →
 * Core Stats → Equipment, with element-themed atmosphere filling
 * the space between them.
 *
 * Canvas: 1000 × 540 (drawn at 2x for retina).
 */

(function () {
    "use strict";

    var W = 1000;
    var H = 540;
    var SCALE = 2;

    var SPLASH_LEFT = 470;    // art begins blending here
    var PAD = 32;
    var CONTENT_W = SPLASH_LEFT - PAD * 2;
    var ATMO_FADE = 280;       // generous blend zone

    // ==========================================================
    // ELEMENT ATMOSPHERE — each element has a distinct visual mood.
    // `.hex` accent, `.dark` deep base, `.particles` the tiny
    // floating elements that fill dead space in the center.
    // ==========================================================

    var EL = {
        pyro:   { hex: "#E0785C", dark: "#1A0E0A", accent: "#E0785C",
                  particles: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 18; i++) {
                          var px = cx + (i * 37 + 11) % w - w/2;
                          var py = cy + (i * 53 + 7) % h - h/2;
                          var r = 1 + (i % 3);
                          ctx.globalAlpha = 0.04 + (i % 4) * 0.01;
                          ctx.fillStyle = "#E0785C";
                          ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2); ctx.fill();
                      }
                      ctx.globalAlpha = 1;
                  } },
        hydro:  { hex: "#5B9BD6", dark: "#0A141E", accent: "#5B9BD6",
                  particles: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 12; i++) {
                          var px = cx + (i * 47 + 13) % w - w/2;
                          var py = cy + (i * 61 + 5) % h - h/2;
                          ctx.globalAlpha = 0.03 + (i % 5) * 0.008;
                          ctx.strokeStyle = "#5B9BD6";
                          ctx.lineWidth = 0.5;
                          ctx.beginPath(); ctx.moveTo(px - 8, py); ctx.lineTo(px + 8, py); ctx.stroke();
                      }
                      ctx.globalAlpha = 1;
                  } },
        anemo:  { hex: "#6BC7AE", dark: "#0A1814", accent: "#6BC7AE",
                  particles: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 15; i++) {
                          var px = cx + (i * 43 + 17) % w - w/2;
                          var py = cy + (i * 59 + 3) % h - h/2;
                          var dx = (i % 5 - 2) * 6;
                          ctx.globalAlpha = 0.03 + (i % 4) * 0.008;
                          ctx.strokeStyle = "#6BC7AE";
                          ctx.lineWidth = 0.5;
                          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + dx, py - 10); ctx.stroke();
                      }
                      ctx.globalAlpha = 1;
                  } },
        electro:{ hex: "#B18FE0", dark: "#0F0A1A", accent: "#B18FE0",
                  particles: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 20; i++) {
                          var px = cx + (i * 31 + 19) % w - w/2;
                          var py = cy + (i * 47 + 11) % h - h/2;
                          ctx.globalAlpha = 0.04 + (i % 3) * 0.01;
                          ctx.strokeStyle = "#B18FE0";
                          ctx.lineWidth = 0.5;
                          var a = i * 0.8, r = 3 + (i % 4);
                          ctx.beginPath(); ctx.moveTo(px - r, py - r); ctx.lineTo(px + r, py + r); ctx.stroke();
                          ctx.beginPath(); ctx.moveTo(px + r, py - r); ctx.lineTo(px - r, py + r); ctx.stroke();
                      }
                      ctx.globalAlpha = 1;
                  } },
        dendro: { hex: "#97BE58", dark: "#0F1408", accent: "#97BE58",
                  particles: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 16; i++) {
                          var px = cx + (i * 41 + 23) % w - w/2;
                          var py = cy + (i * 67 + 7) % h - h/2;
                          ctx.globalAlpha = 0.04 + (i % 4) * 0.008;
                          ctx.fillStyle = "#97BE58";
                          ctx.beginPath(); ctx.arc(px, py, 1.5 + (i % 3), 0, Math.PI*2); ctx.fill();
                      }
                      ctx.globalAlpha = 1;
                  } },
        cryo:   { hex: "#83C6DE", dark: "#0A1418", accent: "#83C6DE",
                  particles: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 14; i++) {
                          var px = cx + (i * 53 + 29) % w - w/2;
                          var py = cy + (i * 71 + 13) % h - h/2;
                          ctx.globalAlpha = 0.03 + (i % 4) * 0.008;
                          ctx.strokeStyle = "#83C6DE";
                          ctx.lineWidth = 0.5;
                          var r = 3 + (i % 3);
                          ctx.beginPath();
                          ctx.moveTo(px, py - r); ctx.lineTo(px + r, py);
                          ctx.lineTo(px, py + r); ctx.lineTo(px - r, py);
                          ctx.closePath(); ctx.stroke();
                      }
                      ctx.globalAlpha = 1;
                  } },
        geo:    { hex: "#D6B96C", dark: "#14100A", accent: "#D6B96C",
                  particles: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 12; i++) {
                          var px = cx + (i * 37 + 5) % w - w/2;
                          var py = cy + (i * 43 + 17) % h - h/2;
                          ctx.globalAlpha = 0.04 + (i % 4) * 0.008;
                          ctx.fillStyle = "#D6B96C";
                          ctx.fillRect(px - 2, py - 2, 4 + (i % 3), 4 + (i % 3));
                      }
                      ctx.globalAlpha = 1;
                  } },
    };

    function el(key) { return EL[key] || EL.hydro; }

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

    function drawGradeBadge(ctx, letter, x, y, color) {
        var s = 30;
        roundRect(ctx, x, y, s, s, 8);
        ctx.fillStyle = color + "18";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        roundRect(ctx, x, y, s, s, 8);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = "700 16px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(letter, x + s / 2, y + s / 2 + 1);
    }

    function drawTierBadge(ctx, label, x, y) {
        if (!label) return;
        var key = (label + "").toLowerCase();
        var styles = {
            bis:             { bg: "rgba(214,185,108,0.20)", fg: "#D6B96C" },
            secondary:       { bg: "rgba(91,155,214,0.20)",  fg: "#5B9BD6" },
            f2p:             { bg: "rgba(107,199,174,0.20)", fg: "#6BC7AE" },
            niche:           { bg: "rgba(177,143,224,0.20)", fg: "#B18FE0" },
            unlisted:        { bg: "rgba(152,162,179,0.20)", fg: "#98A2B3" },
            unrecognized:    { bg: "rgba(224,137,155,0.20)", fg: "#E0899B" },
            "type mismatch": { bg: "rgba(224,137,155,0.20)", fg: "#E0899B" },
            hybrid:          { bg: "rgba(152,162,179,0.20)", fg: "#98A2B3" },
            fragmented:      { bg: "rgba(224,137,155,0.20)", fg: "#E0899B" },
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

        // Grade colour
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
        // 1. BACKGROUND — deep void + element bloom + particles
        // ==========================================================

        // Deep base
        ctx.fillStyle = "#080A0E";
        ctx.fillRect(0, 0, W, H);

        // Primary bloom — large soft radial glow centred behind the
        // splash art, radiating across both halves of the card so
        // the atmosphere feels unified.
        var bloomCX = SPLASH_LEFT + (W - SPLASH_LEFT) * 0.3;
        var bloomCY = H * 0.4;
        var bloom = ctx.createRadialGradient(bloomCX, bloomCY, 10, bloomCX, bloomCY, H * 1.0);
        bloom.addColorStop(0, eHex + "40");
        bloom.addColorStop(0.3, eHex + "20");
        bloom.addColorStop(0.55, eDark + "AA");
        bloom.addColorStop(1, "#080A0E");
        ctx.fillStyle = bloom;
        ctx.fillRect(0, 0, W, H);

        // Secondary centre glow — fills the middle area so it never
        // feels like dead space, using a very soft spread.
        var centreGlow = ctx.createRadialGradient(SPLASH_LEFT * 0.55, H * 0.5, 10, SPLASH_LEFT * 0.55, H * 0.5, H * 0.7);
        centreGlow.addColorStop(0, eHex + "08");
        centreGlow.addColorStop(0.5, eHex + "05");
        centreGlow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = centreGlow;
        ctx.fillRect(0, 0, SPLASH_LEFT, H);

        // Element-themed subtle particles in the centre space
        e.particles(ctx, SPLASH_LEFT * 0.5, H * 0.45, SPLASH_LEFT * 0.7, H * 0.6);

        // Deeper vignette on the far left for text readability
        var leftShade = ctx.createLinearGradient(0, 0, SPLASH_LEFT * 0.5, 0);
        leftShade.addColorStop(0, "rgba(8,10,14,0.55)");
        leftShade.addColorStop(1, "rgba(8,10,14,0)");
        ctx.fillStyle = leftShade;
        ctx.fillRect(0, 0, Math.round(SPLASH_LEFT * 0.5), H);

        // ==========================================================
        // 2. SPLASH ART — wide blend + rim light
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
                var pw = W - SPLASH_LEFT;   // 530
                var ph = H;                 // 540

                // Intentional zoom-out: 78% of cover so we see the
                // character's full pose and body language, not just the face.
                var imgScale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * 0.78;
                var sw = pw / imgScale;
                var sh = ph / imgScale;
                var sx = (img.naturalWidth - sw) / 2;
                var sy = Math.max(0, (img.naturalHeight - sh) * 0.08);

                // Draw the splash art clipped to the right panel
                ctx.save();
                ctx.beginPath();
                ctx.rect(SPLASH_LEFT, 0, pw, ph);
                ctx.clip();
                ctx.drawImage(img, sx, sy, sw, sh, SPLASH_LEFT, 0, pw, ph);
                ctx.restore();

                // Primary fade — dark base to transparent, so the left
                // edge of the art emerges from the dark background.
                var fadeGrad = ctx.createLinearGradient(SPLASH_LEFT, 0, SPLASH_LEFT + ATMO_FADE, 0);
                fadeGrad.addColorStop(0,    "rgba(8,10,14,1)");
                fadeGrad.addColorStop(0.2,  "rgba(8,10,14,0.55)");
                fadeGrad.addColorStop(0.45, "rgba(8,10,14,0.2)");
                fadeGrad.addColorStop(0.7,  "rgba(8,10,14,0.05)");
                fadeGrad.addColorStop(1,    "rgba(8,10,14,0)");
                ctx.fillStyle = fadeGrad;
                ctx.fillRect(SPLASH_LEFT, 0, ATMO_FADE, ph);

                // Element-coloured overlay — washes the art's left edge
                // in the character's element so it shares the same colour
                // atmosphere as the info panel.
                var elBlend = ctx.createLinearGradient(SPLASH_LEFT, 0, SPLASH_LEFT + ATMO_FADE * 0.45, 0);
                elBlend.addColorStop(0, eDark);
                elBlend.addColorStop(0.6, eDark + "99");
                elBlend.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = elBlend;
                ctx.fillRect(SPLASH_LEFT, 0, Math.round(ATMO_FADE * 0.45), ph);

                // Subtle rim light — a soft vertical glow on the
                // visible edge of the art to separate the character
                // from the background.
                var rimX = SPLASH_LEFT + ATMO_FADE * 0.35;
                var rim = ctx.createLinearGradient(rimX, 0, rimX + 60, 0);
                rim.addColorStop(0, eHex + "00");
                rim.addColorStop(0.5, eHex + "10");
                rim.addColorStop(1, eHex + "00");
                ctx.fillStyle = rim;
                ctx.fillRect(rimX, 0, 60, ph);
            }
        }

        // ==========================================================
        // 3. LEFT PANEL — build information
        // ==========================================================

        var x = PAD;
        ctx.textAlign = "left";

        // ---- 3a. CHARACTER NAME — largest text, first thing you see ----
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 30px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(charName, x, 24);

        // ---- 3b. ELEMENT + RARITY ----
        var y = 62;
        var elemLabel = capitalize(info.element || "");

        if (elemLabel) {
            var badgeW = Math.max(ctx.measureText(elemLabel).width + 16, 50);
            roundRect(ctx, x, y, badgeW, 22, 11);
            ctx.fillStyle = eHex + "22";
            ctx.fill();
            ctx.fillStyle = eHex;
            ctx.font = "600 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(elemLabel, x + 8, y + 6);
        }

        var starStr = "";
        var rarity = info.rarity || 4;
        for (var si = 0; si < rarity; si++) starStr += "★";
        if (starStr) {
            var starX = x + (elemLabel ? badgeW + 10 : 0);
            ctx.fillStyle = rarity >= 5 ? "#D6B96C" : "#B79EDB";
            ctx.font = "14px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(starStr, starX, y + 4);
        }

        // ---- 3c. SCORE BLOCK — unified: big number + grade badge + label ----
        var scoreY = 100;

        // Score number — large, white, dominant
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 48px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textBaseline = "top";
        ctx.fillText(scoreText, x, scoreY);

        // Grade badge — sits to the right of the score, vertically
        // aligned to its middle.
        var scoreNumW = ctx.measureText(scoreText).width;
        drawGradeBadge(ctx, grade, x + scoreNumW + 12, scoreY + 9, gradeColor);

        // "OVERALL SCORE" label — cleanly below both
        ctx.fillStyle = "rgba(255,255,255,0.30)";
        ctx.font = "500 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("OVERALL SCORE", x, scoreY + 54);

        // ---- 3d. ACCENT RULE ----
        var ruleY = scoreY + 68;
        ctx.save();
        ctx.strokeStyle = eHex + "35";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, ruleY);
        ctx.lineTo(x + CONTENT_W, ruleY);
        ctx.stroke();
        ctx.restore();

        // ---- 3e. CRIT RATIO + CV — grouped together ----
        var cy = ruleY + 20;

        ctx.fillStyle = "rgba(255,255,255,0.40)";
        ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("CRIT RATIO", x, cy);

        // Crit values — CR / CD and CV in one cohesive line
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 18px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        var critLine = "CR " + cr + "%  /  CD " + cd + "%";
        var critW = ctx.measureText(critLine).width;
        ctx.fillText(critLine, x, cy + 15);

        // CV immediately after, separated by a thin dot
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "500 14px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("·  CV " + cv, x + critW + 12, cy + 17);

        // ---- 3f. STATS — 2-column grid, organised ----
        var sy = cy + 56;

        ctx.fillStyle = "rgba(255,255,255,0.40)";
        ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("STATS", x, sy);

        // Order stats by category: HP/ATK/DEF first, then EM/ER
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
        var colW = CONTENT_W / 2;
        var labelW = 40;

        for (var j = 0; j < entries.length; j++) {
            var col = j % 2;
            var row = (j / 2) | 0;
            var ex = x + (col === 0 ? 0 : colW);
            var ey = statTop + row * 24;

            ctx.fillStyle = "rgba(255,255,255,0.60)";
            ctx.font = "500 13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.textBaseline = "top";
            ctx.fillText(entries[j].label, ex, ey);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "600 14px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(entries[j].value, ex + labelW, ey);
        }

        // ---- 3g. EQUIPMENT — premium UI components ----
        var hasWeapon = result.weapon_name;
        var hasSet = result.primary_artifact_set_name;

        if (hasWeapon || hasSet) {
            var statRows = Math.ceil(entries.length / 2);
            var eqTop = statTop + Math.max(statRows, 3) * 24 + 14;

            ctx.fillStyle = "rgba(255,255,255,0.40)";
            ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText("EQUIPMENT", x, eqTop);

            var eqY = eqTop + 18;

            if (hasWeapon) {
                var wr = result.weapon_refinement ? "  R" + result.weapon_refinement : "";
                var weaponLabel = result.weapon_name + wr;

                ctx.fillStyle = "rgba(255,255,255,0.80)";
                ctx.font = "500 13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                ctx.textBaseline = "top";
                ctx.fillText(weaponLabel, x, eqY);

                // Tier badge — inline, right after the item name
                if (result.weapon_tier) {
                    var wLabelW = ctx.measureText(weaponLabel).width;
                    drawTierBadge(ctx, result.weapon_tier, x + wLabelW + 10, eqY);
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
                    var sLabelW = ctx.measureText(setLabel).width;
                    drawTierBadge(ctx, result.artifact_tier, x + sLabelW + 10, eqY);
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
