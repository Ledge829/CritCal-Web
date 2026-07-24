/*
 * Build rating card for CritCal — production-ready.
 *
 * One unified composition: character splash art flows into the
 * element atmosphere on the left, with cleanly structured build
 * data overlaid. Every character gets unique framing from their
 * splash art's aspect ratio, and text never overflows.
 *
 * Visual hierarchy: Name → Score → Crit → Stats → Equipment
 *
 * Canvas: 1000 × 540 (drawn at 2x for retina).
 */

(function () {
    "use strict";

    var W = 1000;
    var H = 540;
    var SCALE = 2;

    var SPLASH_LEFT = 470;
    var PAD = 32;
    var CONTENT_W = SPLASH_LEFT - PAD * 2;   // ~406px
    var ATMO_FADE = 280;

    // ==========================================================
    // ELEMENT ATMOSPHERE
    // ==========================================================

    var EL = {
        pyro:   { hex: "#E0785C", dark: "#1A0E0A",
                  glow: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 18; i++) {
                          var px = cx + (i * 37 + 11) % w - w / 2;
                          var py = cy + (i * 53 + 7) % h - h / 2;
                          ctx.globalAlpha = 0.035 + (i % 4) * 0.008;
                          ctx.fillStyle = "#E0785C";
                          ctx.beginPath(); ctx.arc(px, py, 1 + (i % 3), 0, Math.PI * 2); ctx.fill();
                      }
                  } },
        hydro:  { hex: "#5B9BD6", dark: "#0A141E",
                  glow: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 12; i++) {
                          var px = cx + (i * 47 + 13) % w - w / 2;
                          var py = cy + (i * 61 + 5) % h - h / 2;
                          ctx.globalAlpha = 0.03 + (i % 5) * 0.006;
                          ctx.strokeStyle = "#5B9BD6"; ctx.lineWidth = 0.5;
                          ctx.beginPath(); ctx.moveTo(px - 7, py); ctx.lineTo(px + 7, py); ctx.stroke();
                      }
                  } },
        anemo:  { hex: "#6BC7AE", dark: "#0A1814",
                  glow: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 15; i++) {
                          var px = cx + (i * 43 + 17) % w - w / 2;
                          var py = cy + (i * 59 + 3) % h - h / 2;
                          ctx.globalAlpha = 0.03 + (i % 4) * 0.006;
                          ctx.strokeStyle = "#6BC7AE"; ctx.lineWidth = 0.5;
                          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (i % 5 - 2) * 5, py - 9); ctx.stroke();
                      }
                  } },
        electro:{ hex: "#B18FE0", dark: "#0F0A1A",
                  glow: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 20; i++) {
                          var px = cx + (i * 31 + 19) % w - w / 2;
                          var py = cy + (i * 47 + 11) % h - h / 2;
                          ctx.globalAlpha = 0.035 + (i % 3) * 0.008;
                          ctx.strokeStyle = "#B18FE0"; ctx.lineWidth = 0.5;
                          var r = 3 + (i % 4);
                          ctx.beginPath(); ctx.moveTo(px - r, py - r); ctx.lineTo(px + r, py + r); ctx.stroke();
                          ctx.beginPath(); ctx.moveTo(px + r, py - r); ctx.lineTo(px - r, py + r); ctx.stroke();
                      }
                  } },
        dendro: { hex: "#97BE58", dark: "#0F1408",
                  glow: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 16; i++) {
                          var px = cx + (i * 41 + 23) % w - w / 2;
                          var py = cy + (i * 67 + 7) % h - h / 2;
                          ctx.globalAlpha = 0.035 + (i % 4) * 0.006;
                          ctx.fillStyle = "#97BE58";
                          ctx.beginPath(); ctx.arc(px, py, 1.5 + (i % 3), 0, Math.PI * 2); ctx.fill();
                      }
                  } },
        cryo:   { hex: "#83C6DE", dark: "#0A1418",
                  glow: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 14; i++) {
                          var px = cx + (i * 53 + 29) % w - w / 2;
                          var py = cy + (i * 71 + 13) % h - h / 2;
                          ctx.globalAlpha = 0.03 + (i % 4) * 0.006;
                          ctx.strokeStyle = "#83C6DE"; ctx.lineWidth = 0.5;
                          var r = 3 + (i % 3);
                          ctx.beginPath();
                          ctx.moveTo(px, py - r); ctx.lineTo(px + r, py);
                          ctx.lineTo(px, py + r); ctx.lineTo(px - r, py);
                          ctx.closePath(); ctx.stroke();
                      }
                  } },
        geo:    { hex: "#D6B96C", dark: "#14100A",
                  glow: function (ctx, cx, cy, w, h) {
                      for (var i = 0; i < 12; i++) {
                          var px = cx + (i * 37 + 5) % w - w / 2;
                          var py = cy + (i * 43 + 17) % h - h / 2;
                          ctx.globalAlpha = 0.035 + (i % 4) * 0.006;
                          ctx.fillStyle = "#D6B96C";
                          ctx.fillRect(px - 2, py - 2, 4 + (i % 3), 4 + (i % 3));
                      }
                  } },
    };

    function el(key) { return EL[key] || EL.hydro; }

    function capitalize(s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
    }

    function fmtStat(key, val) {
        if (val == null) return "—";
        var num = Number(val);
        return key === "er" ? num.toFixed(0) + "%" : num >= 10000 ? Math.round(num / 1000) + "k" : Math.round(num).toLocaleString();
    }

    // Truncate text with ellipsis if it exceeds maxWidth
    function truncate(ctx, text, maxWidth) {
        if (ctx.measureText(text).width <= maxWidth) return text;
        var ell = "…";
        for (var i = text.length - 1; i > 0; i--) {
            var t = text.substring(0, i) + ell;
            if (ctx.measureText(t).width <= maxWidth) return t;
        }
        return ell;
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
        var m = {
            bis: { bg: "rgba(214,185,108,0.20)", fg: "#D6B96C" },
            secondary: { bg: "rgba(91,155,214,0.20)", fg: "#5B9BD6" },
            f2p: { bg: "rgba(107,199,174,0.20)", fg: "#6BC7AE" },
            niche: { bg: "rgba(177,143,224,0.20)", fg: "#B18FE0" },
            unlisted: { bg: "rgba(152,162,179,0.20)", fg: "#98A2B3" },
            unrecognized: { bg: "rgba(224,137,155,0.20)", fg: "#E0899B" },
            "type mismatch": { bg: "rgba(224,137,155,0.20)", fg: "#E0899B" },
            hybrid: { bg: "rgba(152,162,179,0.20)", fg: "#98A2B3" },
            fragmented: { bg: "rgba(224,137,155,0.20)", fg: "#E0899B" },
        };
        var t = m[key] || m.unlisted;
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

    // Deterministic integer hash from a string (for per-character variation)
    function nameSeed(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
        return Math.abs(h);
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
            gradeColor = ({ S: "#6BC7AE", A: "#5B9BD6", B: "#B18FE0", C: "#D6B96C", D: "#E0899B" })[gl] || "#5B9BD6";
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
        // 1. BACKGROUND — cinematic spotlight behind all content.
        // No dark overlays — everything is a soft coloured glow so
        // text, stats, and artwork stay 100% opaque and sharp.
        // ==========================================================

        ctx.fillStyle = "#080A0E";
        ctx.fillRect(0, 0, W, H);

        // Element bloom — large soft glow radiating from the join
        // between the info panel and splash art, using the character's
        // own element colour. No dark/gray overlay on top.
        var bloomCX = SPLASH_LEFT + (W - SPLASH_LEFT) * 0.25;
        var bloomCY = H * 0.4;
        var bloom = ctx.createRadialGradient(bloomCX, bloomCY, 10, bloomCX, bloomCY, H * 1.0);
        bloom.addColorStop(0, eHex + "50");    // bright centre, element-coloured
        bloom.addColorStop(0.35, eHex + "25"); // soft mid
        bloom.addColorStop(0.65, eHex + "0A"); // faint edge
        bloom.addColorStop(1, "#080A0E");
        ctx.fillStyle = bloom;
        ctx.fillRect(0, 0, W, H);

        // Spotlight — a second, tighter glow centred on the left panel
        // so the build info area gets its own warm lighting separate
        // from the splash art bloom. Pure coloured light, no tint.
        var spotCX = SPLASH_LEFT * 0.45;
        var spotCY = H * 0.45;
        var spot = ctx.createRadialGradient(spotCX, spotCY, 10, spotCX, spotCY, H * 0.55);
        spot.addColorStop(0, eHex + "20");
        spot.addColorStop(0.5, eHex + "08");
        spot.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, SPLASH_LEFT, H);

        // Element-themed environmental particles in the centre zone
        e.glow(ctx, SPLASH_LEFT * 0.5, H * 0.45, SPLASH_LEFT * 0.65, H * 0.55);

        // ==========================================================
        // 2. SPLASH ART — per-character framing + rim light
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
                var imgScale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * 0.78;
                var sw = pw / imgScale;
                var sh = ph / imgScale;
                var sx = (img.naturalWidth - sw) / 2;

                // Per-character vertical framing: use aspect ratio +
                // name hash so every character gets a unique crop that
                // prioritises the face/upper body.
                var aspect = img.naturalHeight / img.naturalWidth;
                var baseOff = aspect > 1.45 ? 0.03 : (aspect < 1.2 ? 0.18 : 0.07);
                var seed = nameSeed(charName);
                var variation = (seed % 14) * 0.006;
                var sy = Math.max(0, (img.naturalHeight - sh) * Math.min(baseOff + variation, 0.25));

                ctx.save();
                ctx.beginPath();
                ctx.rect(SPLASH_LEFT, 0, pw, ph);
                ctx.clip();
                ctx.drawImage(img, sx, sy, sw, sh, SPLASH_LEFT, 0, pw, ph);
                ctx.restore();

                // Primary fade — dark base to transparent
                var fadeGrad = ctx.createLinearGradient(SPLASH_LEFT, 0, SPLASH_LEFT + ATMO_FADE, 0);
                fadeGrad.addColorStop(0,    "rgba(8,10,14,1)");
                fadeGrad.addColorStop(0.2,  "rgba(8,10,14,0.55)");
                fadeGrad.addColorStop(0.45, "rgba(8,10,14,0.2)");
                fadeGrad.addColorStop(0.7,  "rgba(8,10,14,0.05)");
                fadeGrad.addColorStop(1,    "rgba(8,10,14,0)");
                ctx.fillStyle = fadeGrad;
                ctx.fillRect(SPLASH_LEFT, 0, ATMO_FADE, ph);

                // Element-coloured overlay on the art's left edge
                var elBlend = ctx.createLinearGradient(SPLASH_LEFT, 0, SPLASH_LEFT + ATMO_FADE * 0.45, 0);
                elBlend.addColorStop(0, eDark);
                elBlend.addColorStop(0.6, eDark + "99");
                elBlend.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = elBlend;
                ctx.fillRect(SPLASH_LEFT, 0, Math.round(ATMO_FADE * 0.45), ph);

                // Rim light
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
        var textShadow = "rgba(0,0,0,0.4)";

        // ---- 3a. CHARACTER NAME — largest element, clear hierarchy ----
        ctx.shadowColor = textShadow;
        ctx.shadowBlur = 6;
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 32px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        var displayName = truncate(ctx, charName, CONTENT_W);
        ctx.fillText(displayName, x, 24);
        ctx.shadowBlur = 0;

        // ---- 3b. ELEMENT + RARITY ----
        var y = 64;
        var elemLabel = capitalize(info.element || "");

        if (elemLabel) {
            var badgeW = Math.max(ctx.measureText(elemLabel).width + 18, 52);
            roundRect(ctx, x, y, badgeW, 22, 11);
            ctx.fillStyle = eHex + "22";
            ctx.fill();
            ctx.fillStyle = eHex;
            ctx.font = "600 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(elemLabel, x + 9, y + 6);
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

        // ---- 3c. SCORE + GRADE — one unified block ----
        var scoreY = 104;

        // Score number — dominant, with shadow
        ctx.shadowColor = textShadow;
        ctx.shadowBlur = 6;
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 48px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(scoreText, x, scoreY);
        ctx.shadowBlur = 0;

        // Grade badge — sits to the right of the score with a fixed gap.
        // If it would overflow, reduce the gap.
        var scoreW = ctx.measureText(scoreText).width;
        var gradeGap = 14;
        var badgeX = x + scoreW + gradeGap;
        var badgeMaxX = x + CONTENT_W - 30;  // must fit 30px badge
        var gradeBadgeSize = 30;
        if (badgeX + gradeBadgeSize > x + CONTENT_W) {
            // Not enough room — position grade below the score instead
            badgeX = x;
            drawGradeBadge(ctx, grade, badgeX, scoreY + 54, gradeColor);
        } else {
            drawGradeBadge(ctx, grade, badgeX, scoreY + 9, gradeColor);
        }

        // "OVERALL SCORE" label — below both
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.font = "500 10px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("OVERALL SCORE", x, scoreY + 56);

        // ---- 3d. ACCENT RULE ----
        var ruleY = scoreY + 76;
        ctx.save();
        ctx.strokeStyle = eHex + "30";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, ruleY);
        ctx.lineTo(x + CONTENT_W, ruleY);
        ctx.stroke();
        ctx.restore();

        // ---- 3e. CRIT RATIO — with CV inline ----
        var cy = ruleY + 22;

        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("CRIT RATIO", x, cy);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 18px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        var critLine = "CR " + cr + "%  /  CD " + cd + "%";
        var critW = ctx.measureText(critLine).width;
        ctx.fillText(critLine, x, cy + 16);

        // CV inline after a thin separator
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.font = "500 14px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        var cvLabel = " ·  CV " + cv;
        ctx.fillText(cvLabel, x + critW + 8, cy + 18);

        // ---- 3f. STATS — 2-column, perfectly aligned ----
        var sy = cy + 62;

        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText("STATS", x, sy);

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
            if (val != null && val > 0) entries.push({ label: sd.label, value: fmtStat(sd.fmtKey, val) });
        }

        var statTop = sy + 16;
        var colW = CONTENT_W / 2;
        var labelW = 38;

        ctx.shadowColor = textShadow;
        ctx.shadowBlur = 4;
        for (var j = 0; j < entries.length; j++) {
            var col = j % 2;
            var row = (j / 2) | 0;
            var ex = x + (col === 0 ? 0 : colW);
            var ey = statTop + row * 24;

            ctx.fillStyle = "rgba(255,255,255,0.60)";
            ctx.font = "500 13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(entries[j].label, ex, ey);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "600 14px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText(entries[j].value, ex + labelW, ey);
        }
        ctx.shadowBlur = 0;

        // ---- 3g. EQUIPMENT — premium inline badges ----
        var hasWeapon = result.weapon_name;
        var hasSet = result.primary_artifact_set_name;

        if (hasWeapon || hasSet) {
            var statRows = Math.ceil(entries.length / 2);
            var eqTop = statTop + Math.max(statRows, 3) * 24 + 12;

            ctx.fillStyle = "rgba(255,255,255,0.35)";
            ctx.font = "500 9.5px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
            ctx.fillText("EQUIPMENT", x, eqTop);

            var eqY = eqTop + 18;

            if (hasWeapon) {
                var wr = result.weapon_refinement ? "  R" + result.weapon_refinement : "";
                var rawW = result.weapon_name + wr;

                // Leave room for the badge (46px) + gap (10px)
                var maxTextW = CONTENT_W - 56;
                ctx.font = "500 13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                var weaponDisplay = truncate(ctx, rawW, maxTextW);
                var wW = ctx.measureText(weaponDisplay).width;

                ctx.fillStyle = "rgba(255,255,255,0.80)";
                ctx.fillText(weaponDisplay, x, eqY);

                if (result.weapon_tier) {
                    drawTierBadge(ctx, result.weapon_tier, x + wW + 10, eqY);
                }
                eqY += 24;
            }

            if (hasSet) {
                var setLabel = result.primary_artifact_set_name;
                if (result.primary_artifact_set_count) setLabel += "  " + result.primary_artifact_set_count + "pc";

                var maxTextW = CONTENT_W - 56;
                ctx.font = "500 13px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
                var setDisplay = truncate(ctx, setLabel, maxTextW);
                var sW = ctx.measureText(setDisplay).width;

                ctx.fillStyle = "rgba(255,255,255,0.80)";
                ctx.fillText(setDisplay, x, eqY);

                if (result.artifact_tier) {
                    drawTierBadge(ctx, result.artifact_tier, x + sW + 10, eqY);
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
