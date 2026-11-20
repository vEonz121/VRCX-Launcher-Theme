import { computed, reactive, watch } from 'vue';

/**
 * Launcher theme state. Kept in localStorage (it is a per-machine visual
 * preference, not account data) so it also works in the browser preview.
 */

const STORAGE_KEY = 'VRCX_launcherTheme_v1';

export const backgroundPresets = [
    { id: 'xmb', label: 'Wave', description: 'Flowing ribbons, console-menu style' },
    { id: 'aurora', label: 'Aurora', description: 'Slow drifting colour clouds' },
    { id: 'mesh', label: 'Nebula', description: 'Rotating gradient mesh' },
    { id: 'bokeh', label: 'Bokeh', description: 'Floating soft lights' },
    { id: 'world', label: 'World art', description: 'Blurred art of the focused instance' },
    { id: 'image', label: 'Custom image', description: 'Your own picture, blurred' },
    { id: 'solid', label: 'Minimal', description: 'Still gradient, no motion' }
];

export const accentPresets = [
    { id: 'iris', label: 'Iris', hue: 265 },
    { id: 'ocean', label: 'Ocean', hue: 225 },
    { id: 'cyan', label: 'Cyan', hue: 200 },
    { id: 'mint', label: 'Mint', hue: 160 },
    { id: 'lime', label: 'Lime', hue: 130 },
    { id: 'amber', label: 'Amber', hue: 70 },
    { id: 'coral', label: 'Coral', hue: 30 },
    { id: 'rose', label: 'Rose', hue: 0 },
    { id: 'magenta', label: 'Magenta', hue: 330 }
];

/** Full-theme presets: one click sets everything. */
export const themePresets = [
    {
        id: 'midnight-wave',
        label: 'Midnight Wave',
        values: { background: 'xmb', hue: 225, glassOpacity: 0.14, blur: 22, radius: 22, motion: 1, tint: 0.35 }
    },
    {
        id: 'aurora-glass',
        label: 'Aurora Glass',
        values: { background: 'aurora', hue: 160, glassOpacity: 0.12, blur: 26, radius: 24, motion: 0.8, tint: 0.3 }
    },
    {
        id: 'sakura',
        label: 'Sakura',
        values: { background: 'bokeh', hue: 340, glassOpacity: 0.16, blur: 20, radius: 26, motion: 0.7, tint: 0.4 }
    },
    {
        id: 'nebula',
        label: 'Nebula',
        values: { background: 'mesh', hue: 285, glassOpacity: 0.1, blur: 28, radius: 20, motion: 1, tint: 0.35 }
    },
    {
        id: 'sunset',
        label: 'Sunset',
        values: { background: 'xmb', hue: 30, glassOpacity: 0.14, blur: 22, radius: 22, motion: 0.9, tint: 0.45 }
    },
    {
        id: 'immersive',
        label: 'Immersive',
        values: { background: 'world', hue: 200, glassOpacity: 0.12, blur: 24, radius: 22, motion: 1, tint: 0.25 }
    },
    {
        id: 'focus',
        label: 'Focus',
        values: { background: 'solid', hue: 220, glassOpacity: 0.2, blur: 16, radius: 14, motion: 0.3, tint: 0.2 }
    }
];

const defaults = Object.freeze({
    enabled: true, // false = classic VRCX layout
    background: 'xmb',
    hue: 225,
    tint: 0.35, // how strongly the accent tints the background
    glassOpacity: 0.14,
    blur: 22,
    radius: 22,
    motion: 1, // animation speed multiplier, 0 = still
    transitions: true,
    imageUrl: '',
    gridColumns: 5,
    gridRows: 4,
    refreshSeconds: 60,
    showEmptyHint: true,
    includeSolo: true, // show instances with a single friend
    joinMode: 'vr', // 'vr' | 'desktop'
    sortBy: 'friends', // 'friends' | 'players' | 'name'
    clock24h: true
});

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...defaults };
        const parsed = JSON.parse(raw);
        return { ...defaults, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
    } catch {
        return { ...defaults };
    }
}

const state = reactive(load());

let saveTimer = null;
watch(
    state,
    () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch {
                // storage unavailable: keep in memory only
            }
        }, 150);
        applyCssVariables();
    },
    { deep: true }
);

function clamp(v, min, max) {
    const n = Number(v);
    if (Number.isNaN(n)) return min;
    return Math.min(max, Math.max(min, n));
}

export function applyCssVariables(root = typeof document !== 'undefined' ? document.documentElement : null) {
    if (!root) return;
    const h = clamp(state.hue, 0, 360);
    const s = root.style;
    s.setProperty('--vl-hue', String(h));
    s.setProperty('--vl-accent', `oklch(0.72 0.17 ${h})`);
    s.setProperty('--vl-accent-strong', `oklch(0.64 0.2 ${h})`);
    s.setProperty('--vl-accent-soft', `oklch(0.72 0.17 ${h} / 0.22)`);
    s.setProperty('--vl-accent-glow', `oklch(0.72 0.2 ${h} / 0.55)`);
    s.setProperty('--vl-glass', `oklch(1 0 0 / ${clamp(state.glassOpacity, 0, 0.6)})`);
    s.setProperty('--vl-glass-strong', `oklch(0.22 0.02 ${h} / ${clamp(0.55 + state.glassOpacity, 0, 0.95)})`);
    s.setProperty('--vl-glass-border', `oklch(1 0 0 / ${clamp(state.glassOpacity + 0.08, 0.06, 0.5)})`);
    s.setProperty('--vl-blur', `${clamp(state.blur, 0, 60)}px`);
    s.setProperty('--vl-radius', `${clamp(state.radius, 0, 40)}px`);
    s.setProperty('--vl-motion', String(clamp(state.motion, 0, 3)));
    s.setProperty('--vl-tint', String(clamp(state.tint, 0, 1)));
    s.setProperty('--vl-dur', state.transitions ? '420ms' : '0ms');
}

export function useLauncherTheme() {
    const backgroundLabel = computed(
        () => backgroundPresets.find((p) => p.id === state.background)?.label ?? state.background
    );

    function applyPreset(presetId) {
        const preset = themePresets.find((p) => p.id === presetId);
        if (!preset) return;
        Object.assign(state, preset.values);
    }

    function reset() {
        const keepEnabled = state.enabled;
        Object.assign(state, { ...defaults, enabled: keepEnabled });
    }

    return { theme: state, defaults, backgroundLabel, applyPreset, reset };
}

export const launcherTheme = state;
