import { http } from "lib";

// Color themes. The tokens of each one live in src/themes/<key>.scss; here only the list and its swatches
// (header, accent, background) for the picker. The light/dark mode is a separate choice.
export interface Palette {
    key: string;
    swatch: [string, string, string];
}

export const PALETTES: Palette[] = [
    { key: 'worldgym', swatch: ['#424530', '#E09132', '#FFEFCD'] },
    { key: 'ocean', swatch: ['#14233D', '#4C9BFF', '#EAF2FB'] },
    { key: 'violet', swatch: ['#2B1B54', '#9A6BFF', '#F3EEFD'] },
    { key: 'olive', swatch: ['#3A4220', '#A3B34C', '#F1F3E4'] },
];

export const DEFAULT_PALETTE = 'worldgym';
const STORAGE_KEY = 'wg_palette';

export function isPalette(key: unknown): key is string {
    return typeof key === 'string' && PALETTES.some(p => p.key === key);
}

// What the browser remembers (it avoids a flash of the default theme before the user data arrives)
export function currentPalette(): string {
    const attr = document.documentElement.getAttribute('data-palette');
    return isPalette(attr) ? attr : DEFAULT_PALETTE;
}

export function applyPalette(key: string) {
    const palette = isPalette(key) ? key : DEFAULT_PALETTE;
    document.documentElement.setAttribute('data-palette', palette);
    try { localStorage.setItem(STORAGE_KEY, palette); } catch { /* private mode: it just is not remembered */ }
}

// The theme saved in the user's account, once the user data is there
export function applyUserPalette(user: { theme?: string | null } | null) {
    if (user) applyPalette(isPalette(user.theme) ? user.theme : DEFAULT_PALETTE);
}

// A theme picked by the user: applied now and saved in the account so it follows them to every device
export function savePalette(key: string): Promise<unknown> {
    applyPalette(key);
    return http.put('/account/theme').data({ theme: key }).promise();
}
