import { PushNotifications } from "@capacitor/push-notifications";
import { App, http, translate } from "lib";
import { isApp, platform } from "@/modules/platform";
import { refreshUnread, state as inbox } from "@/modules/notifications";

// Push notifications (Firebase Cloud Messaging) of the installed app: asks for the permission, sends the token of the
// phone to the API and opens the screen a notification points to. Only exists in the app: in the browser every
// function does nothing. What is sent, and when, is decided by the API (see PushRules.php).

const TOKEN_KEY = 'wg_push_token';
const DEVICE_KEY = 'wg_device_id';

let initialized = false;
let openRoute: ((route: string) => void) | null = null;
let pendingRoute: string | null = null;

function read(key: string): string | null {
    try { return window.localStorage.getItem(key); } catch { return null; }
}

function write(key: string, value: string | null) {
    try {
        if (value === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
    } catch { /* storage unavailable */ }
}

// Stable id of this phone: a new token of the same phone replaces the old one on the server
function deviceId(): string {
    let id = read(DEVICE_KEY);
    if (!id) {
        id = (window.crypto as any)?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
        write(DEVICE_KEY, id);
    }
    return id as string;
}

function sendToken(token: string) {
    http.post('/push/devices').data({ token, device_id: deviceId(), platform })
    .promise()
    .catch(() => { /* retried on the next start */ });
}

function open(route: string) {
    if (openRoute) openRoute(route);
    else pendingRoute = route;
}

// The layout says how to navigate; a route waiting from a notification that opened the app goes through at once
export function setPushRouteHandler(handler: (route: string) => void) {
    openRoute = handler;
    if (pendingRoute) {
        const route = pendingRoute;
        pendingRoute = null;
        handler(route);
    }
}

// Call once the user is logged in
export async function initPush(): Promise<void> {
    if (!isApp || initialized) return;
    initialized = true;

    try {
        await PushNotifications.createChannel({
            id: 'reminders',
            name: translate.get('push.title'),
            description: translate.get('push.sub'),
            importance: 4,
            visibility: 1,
        });
    } catch { /* the channel already exists */ }

    PushNotifications.addListener('registration', t => {
        write(TOKEN_KEY, t.value);
        sendToken(t.value);
    });
    PushNotifications.addListener('registrationError', () => {});

    // A notification tapped: open the screen it points to (only paths of the app)
    PushNotifications.addListener('pushNotificationActionPerformed', action => {
        const data = action.notification?.data;
        // Tapping it counts as reading it
        if (data?.id) http.patch(`/notifications/${data.id}/read`).promise().then(refreshUnread).catch(() => {});
        const route = data?.route;
        if (typeof route === 'string' && route.startsWith('/')) open(route);
    });

    // With the app open the system shows nothing: say it inside
    PushNotifications.addListener('pushNotificationReceived', n => {
        inbox.unread++;
        refreshUnread();
        if (n.title) App.notification(n.body ? `${n.title}: ${n.body}` : n.title).show();
    });

    try {
        const current = await PushNotifications.checkPermissions();
        let state = current.receive;
        if (state === 'prompt' || state === 'prompt-with-rationale') state = (await PushNotifications.requestPermissions()).receive;
        if (state === 'granted') await PushNotifications.register();
    } catch { /* without permission the app works the same, just without reminders */ }
}

// On log out: this phone must stop receiving the reminders of the account
export async function forgetPush(): Promise<void> {
    if (!isApp) return;

    const token = read(TOKEN_KEY);
    write(TOKEN_KEY, null);
    if (!token) return;

    try { await http.delete('/push/devices', { token }).promise(); } catch { /* the server drops dead tokens by itself */ }
}
