
export const isMobile = window.innerWidth <= 768;
export const mobileScale = 0.5;
export const THEME = 'retro';

export const ICONS = {
    birth: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    graduation: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    enrollment: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    certificate: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    military: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    internship: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    project: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    other: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>'
};

export const SKY_STOPS = THEME === 'minimal' ? ['#020617', '#0F172A', '#1E293B', '#0F172A'] : ['#0F172A', '#1E1B4B', '#4C1D95', '#701A75'];

export const state = {
    currentLang: 'ko',
    isScrolledToEnd: false,
    currentFinaleP: 0,
    LAST_ZONE_START: 0,
    // Game State
    isJumping: false,
    isDucking: false,
    keys: { left: false, right: false },
    collectedIds: new Set(),
    totalScore: 0,
    perfectCount: 0,
    comboCount: 0,
    maxCombo: 0,
    // Animation/UI State
    isGameHudVisible: false,
    isStatSectionCounted: false,
};

// --- UTILITY FUNCTIONS ---

export const escapeHtml = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildLangAttrs(obj) {
    if (!obj) return 'data-ko="" data-en="" data-ja=""';
    if (typeof obj === 'string') return `data-ko="${escapeHtml(obj)}" data-en="${escapeHtml(obj)}" data-ja="${escapeHtml(obj)}"`;
    return `data-ko="${escapeHtml(obj.ko || '')}" data-en="${escapeHtml(obj.en || obj.ko || '')}" data-ja="${escapeHtml(obj.ja || obj.ko || '')}"`;
}

export function getStr(obj, lang) {
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.ko || '';
}

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function mixColors(hexA, hexB, t) {
    const c1 = hexToRgb(hexA);
    const c2 = hexToRgb(hexB);
    return `rgb(${Math.round(lerp(c1[0], c2[0], t))}, ${Math.round(lerp(c1[1], c2[1], t))}, ${Math.round(lerp(c1[2], c2[2], t))})`;
}

export function getSkyColor(progress) {
    const segCount = SKY_STOPS.length - 1;
    const segment = Math.min(Math.floor(progress * segCount), segCount - 1);
    const localT = progress * segCount - segment;
    return mixColors(SKY_STOPS[segment], SKY_STOPS[segment + 1], localT);
}
