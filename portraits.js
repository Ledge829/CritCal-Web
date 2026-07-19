/*
Centralized character portrait resolution.

WHY THIS FILE EXISTS: every page (homepage, browse, analyze) calls
portraitHtml() instead of building its own <img> tag, so there is
exactly one place in the whole project that knows where a character's
image comes from.

SOURCE OF TRUTH: characters.py now has a "portrait" field per character,
populated with a verified Enka.Network UI icon URL
(https://enka.network/ui/UI_AvatarIcon_<InternalName>.png) --
cross-checked against Enka's own published character metadata rather
than guessed, since several characters' internal codenames differ from
their display name (Amber -> Ambor, Yanfei -> Feiyan, Kirara -> Momoka,
Raiden -> Shougun, etc.). The /characters API returns this as `portrait`
on every character object. No images are stored in this repo.

GAP CHARACTERS: a handful of very recently released characters (the
newest Nod-Krai/Natlan-era additions) aren't in Enka's public data yet,
so their API `portrait` field is null. For those, this file falls back
to a local self-hosted path (assets/characters/<key>.png) in case one
gets added manually later -- see characterPortraitUrl() below -- and
finally to a plain initial-letter avatar if neither resolves.

FALLBACK CHAIN (all handled by one onerror, no layout shift either way):
  1. characters.py's verified Enka URL (covers the large majority of characters)
  2. assets/characters/<key>.png, if a portrait is manually added there later
  3. initial-letter avatar, colored by element

Every <img> uses loading="lazy", so offscreen cards on the 108-character
browse page don't even issue a network request until scrolled near.
*/

const LOCAL_PORTRAIT_BASE_PATH = "assets/characters/";

function localPortraitUrl(key) {
    return `${LOCAL_PORTRAIT_BASE_PATH}${key}.png`;
}

/**
 * Builds a self-contained portrait <span>: a lazy-loaded <img> that
 * tries the Enka URL first, falls back to a local asset, then to an
 * initial-letter avatar. Use this when building a whole card/row from
 * a template string (the wrapper element doesn't already exist yet).
 *
 * @param {object} c - a character object with .key, .name, .element,
 *   and optionally .portrait (the shape returned by the /characters API)
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
 * Same fallback chain as portraitHtml(), but returns just the <img>
 * tag with no wrapper -- use this when the sizing/color container
 * element already exists in static HTML (e.g. the homepage's
 * featured-character card) and you're only setting its .innerHTML.
 */
function portraitInnerHtml(c) {
    const initial = (c.name || "?").charAt(0).toUpperCase();
    const primaryUrl = c.portrait || localPortraitUrl(c.key);
    const localFallbackUrl = localPortraitUrl(c.key);
    const name = escapeHtmlAttr(c.name || "");

    // onerror chain: first failure tries the local asset path (only
    // meaningfully different from the primary when c.portrait was set,
    // i.e. the Enka URL failed) -- second failure gives up and shows
    // the letter. data-stage tracks which attempt we're on.
    return `<img
        src="${primaryUrl}"
        alt="${name}"
        loading="lazy"
        decoding="async"
        data-stage="0"
        data-local="${escapeHtmlAttr(localFallbackUrl)}"
        data-initial="${escapeHtmlAttr(initial)}"
        onerror="
            if (this.dataset.stage === '0' && this.src !== this.dataset.local) {
                this.dataset.stage = '1';
                this.src = this.dataset.local;
            } else {
                this.parentElement.textContent = this.dataset.initial;
            }
        "
    >`;
}

function escapeHtmlAttr(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
