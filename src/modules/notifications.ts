import { reactive } from "vue";
import { http } from "lib";

// Inbox of notifications (the bell): the API keeps what it sent, with the kind, the key of the message and its values.
// The text is built here, in the language of the moment (translations `notifications.msg.<key>`).
// `state.unread` feeds the badge of the bell in the layout.
export const state = reactive({ unread: 0 });

export interface InboxItem {
    id: number;
    kind: string;
    key: string;
    params: Record<string, any>;
    route: string | null;
    read: boolean;
    created_at: string;
}

export function refreshUnread(): void {
    http.get('/notifications').promise()
    .then((res: any) => { state.unread = res?.unread ?? 0; })
    .catch(() => { /* the badge just keeps its value */ });
}

// The API sends timestamps in UTC without a zone ("Y-m-d H:i:s")
export function parseUtc(value: string): Date {
    const iso = value.includes('T') ? value : value.replace(' ', 'T');
    return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + 'Z');
}

// Icon of the bell list, by kind of notification
export function iconOf(kind: string): string {
    if (kind.startsWith('workout')) return 'heroicons-outline/bolt';
    if (kind.startsWith('meal') || kind === 'protein') return 'heroicons-outline/fire';
    if (kind === 'weigh') return 'heroicons-outline/scale';
    if (kind === 'habits' || kind === 'steps') return 'heroicons-outline/check-circle';
    if (kind.startsWith('challenge')) return 'heroicons-outline/trophy';
    if (kind === 'weekly') return 'heroicons-outline/chart-bar';
    if (kind === 'cycle') return 'heroicons-outline/calendar';
    return 'heroicons-outline/bell';
}
