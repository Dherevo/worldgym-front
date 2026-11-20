import { App, http, Storage, translate } from "lib";
import auth from "@/modules/auth";
import userStore from "@/modules/userStore";

// Device preferences shared by the side menu (wide screens) and the profile (phones): language, light/dark mode, log out

export const LANGUAGES = [
    { code: 'ca', label: 'CA' },
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
];

export function currentLanguage(): string {
    return translate.currentLanguage;
}

export function setLanguage(code: string) {
    if (code === currentLanguage()) return;

    Storage.set('language', code);

    // The translation engine keeps its state outside Vue's reactivity system, so switching
    // language does not re-render mounted components or PrimeVue's own locale.
    // A reload picks up the language we just saved via main.ts and keeps everything consistent.
    const persist = userStore.data
        ? http.put('/account/locale', { locale: code }).promise().catch(() => {})
        : Promise.resolve();

    persist.then(() => window.location.reload());
}

export function isDarkTheme(): boolean {
    return (localStorage.getItem('wg_theme') || 'dark') === 'dark';
}

// Returns true when the dark mode is now on
export function toggleDarkTheme(): boolean {
    const dark = !isDarkTheme();
    const theme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wg_theme', theme);
    return dark;
}

// Asks for confirmation; resolves to true when the session was closed
export function logout(): Promise<boolean> {
    return App.confirm(translate.get('layout.logoutConfirm'))
    .then((value: boolean) => {
        if (value) auth.logout();
        return !!value;
    });
}
