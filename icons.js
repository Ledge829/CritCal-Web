/*
Shared icon library -- small, original geometric SVG glyphs (not copies
of official game symbols) for elements, weapon types, rarity stars, and
UI chrome. Every page includes this before its own script so functions
here are available globally without any bundler/import step.
*/

const ELEMENT_COLORS = {
    pyro: "#FF6B4A",
    hydro: "#4EA7FF",
    anemo: "#6FE0C0",
    electro: "#C79BFF",
    dendro: "#A8D24A",
    cryo: "#9BE3FF",
    geo: "#FFD86B",
};

const ELEMENT_ICONS = {
    pyro: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-1 4.5-2.5 6.5C8 10.5 7 12.3 7 14.5 7 18.6 9.7 22 12 22s5-3.4 5-7.5c0-2-.8-3.4-1.8-4.8-.3 1.6-1.2 2.6-2.2 2.6-1.3 0-2-1.3-1.5-2.8.6-1.9 1.2-4-.5-7.5z"/></svg>',
    hydro: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9 7 5 11.5 5 15.5 5 19.6 8.1 23 12 23s7-3.4 7-7.5C19 11.5 15 7 12 2z"/></svg>',
    anemo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8c3-3 8-3 9 0s-2 4-4 2 0-5 3-5 6 2 6 5"/></svg>',
    electro: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
    dendro: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c5 1 9 5 9 10a9 9 0 0 1-9 9c-1-5 0-9 2-12-3 2-4 6-4 10a9 9 0 0 1-7-9c3-1 6 0 8 2-1-4 0-8 1-10z"/></svg>',
    cryo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M4.5 6l15 12M4.5 18l15-12M2 12h20"/></svg>',
    geo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 6-3 12H7L4 8z"/></svg>',
};

const WEAPON_TYPE_ICONS = {
    sword: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 3.5 20.5 9.5 10 20 4 21 5 15z"/><path d="M6 15l3 3"/></svg>',
    claymore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 21 11 10 22 3 21 4 14z"/></svg>',
    polearm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20 18 6M14 2l4 4-3 3-4-4z"/></svg>',
    bow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3c8 3 8 15 0 18M6 3l14 18M6 21 20 3"/></svg>',
    catalyst: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2 20 7v10l-8 5-8-5V7z"/><circle cx="12" cy="12" r="3"/></svg>',
};

const UI_ICONS = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    analyze: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7"/></svg>',
    characters: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
    guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L6 21l1.6-7L2.2 9.2l7.1-.6z"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 8l10 6 10-6z"/><path d="M2 14l10 6 10-6"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h10M17 6h3M4 12h4M11 12h9M4 18h13M20 18h0"/><circle cx="14" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="8" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="17" cy="18" r="2" fill="currentColor" stroke="none"/></svg>',
    gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 6-3 12M15 3l-3 6 3 12"/></svg>',
    server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/></svg>',
};

function elementIcon(element) {
    return ELEMENT_ICONS[element] || "";
}

function elementColor(element) {
    return ELEMENT_COLORS[element] || "#4EA7FF";
}

function weaponTypeIcon(type) {
    return WEAPON_TYPE_ICONS[(type || "").toLowerCase()] || "";
}

function rarityStars(rarity) {
    const count = Number(rarity) || 4;
    const cls = count >= 5 ? "r5" : "r4";
    return `<span class="rarity-stars ${cls}">${UI_ICONS.star.repeat(count)}</span>`;
}
