/*
Centralized character portrait resolution.

WHY THIS FILE EXISTS: every page (homepage, browse, analyze) calls
portraitHtml() instead of building its own <img> tag, so there is
exactly one place in the whole project that knows where a character's
image file lives.

CURRENT STATE: this repo does not yet contain actual character PNGs.
No image generation tool or network access was available to source real
official artwork, and Genshin character art is copyrighted, so nothing
here was invented or hotlinked. What IS built is the full delivery
pipeline: point this at real files and every card, homepage panel, and
analyze-page preview across the whole site picks them up with zero
other code changes.

HOW TO ADD REAL PORTRAITS LATER:
  1. Drop a square PNG (transparent background recommended) at
     assets/characters/<canonical_key>.png -- canonical_key is exactly
     the "key" field from the /characters API response (e.g. "hutao",
     "sara", "raiden"), matching characters.py's own keys one-to-one.
  2. That's it. Nothing else changes -- PORTRAIT_BASE_PATH below is the
     only path fragment in the whole project; every card already
     requests assets/characters/<key>.png.
  3. Optimize each PNG for the web first (compress; a portrait rarely
     needs to exceed ~40-60KB at typical card display sizes).

FALLBACK BEHAVIOR: every portrait is requested as a real <img> with
loading="lazy" (so offscreen cards on the 108-character browse page
don't even issue a network request until scrolled near) and an
onerror handler that replaces it with a plain initial-letter avatar,
colored by element, so a missing file never shows a broken-image icon.
Until real PNGs exist, every card will fall back this way -- lazy
loading means only the handful of cards visible on first paint attempt
the request immediately, the rest only 404 as the person scrolls to
them.
*/

const PORTRAIT_BASE_PATH = "assets/characters/";

function characterPortraitUrl(key) {
    return `${PORTRAIT_BASE_PATH}${key}.png`;
}

/**
 * Builds a self-contained portrait <span>: a lazy-loaded <img> that,
 * on load error (including "file doesn't exist yet"), replaces itself
 * with an initial-letter fallback. Both states render at the same
 * fixed size, so there's no layout shift either way. Use this when
 * building a whole card/row from a template string (the wrapper
 * element doesn't already exist in the page).
 *
 * @param {object} c - a character object with .key, .name, .element
 *   (the shape returned by the /characters API)
 * @param {string} sizeClass - the wrapper's CSS class, e.g.
 *   "character-portrait", "update-avatar", "featured-portrait" --
 *   all already styled in style.css.
 */
function portraitHtml(c, sizeClass) {
    const color = elementColor(c.element);
    return `
        <span class="${sizeClass}" style="--el-color: ${color}">
            ${portraitInnerHtml(c)}
        </span>
    `;
}

/**
 * Same fallback behavior as portraitHtml(), but returns just the
 * <img> tag with no wrapper -- use this when the sizing/color
 * container element already exists in static HTML (e.g. the homepage's
 * featured-character card) and you're only setting its .innerHTML.
 */
function portraitInnerHtml(c) {
    const initial = (c.name || "?").charAt(0).toUpperCase();
    const url = characterPortraitUrl(c.key);
    const name = escapeHtmlAttr(c.name || "");

    return `<img
        src="${url}"
        alt="${name}"
        loading="lazy"
        decoding="async"
        onerror="this.parentElement.textContent='${escapeJsString(initial)}'"
    >`;
}

function escapeHtmlAttr(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeJsString(str) {
    return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
