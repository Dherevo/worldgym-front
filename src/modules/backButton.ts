import { App as CapApp } from "@capacitor/app";
import { isApp } from "@/modules/platform";

// Top-level screens: from them the back button goes to the home, and from the home it leaves the app
const ROOTS = ['/', '/stats', '/challenges', '/nutrition', '/cycle', '/profile'];

// The Android back button (app only) goes back one screen of the app instead of closing it
export function initBackButton(router: any): void {
    if (!isApp || !router) return;

    CapApp.addListener('backButton', () => {
        const path: string = router.currentRoute.value.path;

        if (ROOTS.includes(path) || !window.history.state?.back) {
            if (path === '/') CapApp.exitApp();
            else router.replace('/');
            return;
        }
        router.back();
    });
}
