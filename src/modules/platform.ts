import { Capacitor } from "@capacitor/core";

// True inside the installed mobile app (Capacitor); false in the browser. Features that only make sense on the
// phone (syncing the steps, notifications on the lock screen...) are shown only when this is true.
export const isApp: boolean = Capacitor.isNativePlatform();
export const platform: string = Capacitor.getPlatform();
