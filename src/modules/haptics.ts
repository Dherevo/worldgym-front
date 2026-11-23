import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isApp } from "@/modules/platform";

// Small vibrations that make the taps feel native. Only in the app; in the browser nothing happens.

export function hapticTap() {
    if (isApp) Haptics.impact({ style: ImpactStyle.Light }).catch(() => { /* no vibrator */ });
}

export function hapticSuccess() {
    if (isApp) Haptics.notification({ type: NotificationType.Success }).catch(() => { /* no vibrator */ });
}

// A light tick on every tap of a button or tab (one listener for the whole app)
export function initTapHaptics() {
    if (!isApp) return;
    let last = 0;
    document.addEventListener('click', (e: Event) => {
        const el = (e.target as HTMLElement | null)?.closest?.('button, [role="button"], [role="tab"], a.tab-bar-item') as HTMLElement | null;
        if (!el || (el as HTMLButtonElement).disabled) return;
        const now = Date.now();
        if (now - last < 120) return;
        last = now;
        hapticTap();
    }, { passive: true, capture: true });
}
