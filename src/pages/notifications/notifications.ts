import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import BackButton from "@/components/back-button/back-button.vue";
import SwipeRow from "@/components/swipe-row/swipe-row.vue";
import { InboxItem, iconOf, parseUtc, refreshUnread, state } from "@/modules/notifications";

// Everything that was sent to the phone, so it is not lost when the system notification is swiped away.
// The API keeps the kind, the key of the message and its values; the text is built here.
@Component({ components: { BackButton, SwipeRow } })
class NotificationsPage extends Vue {

    items: InboxItem[] = [];
    loading = true;

    created() {
        this.load();
    }

    get unread(): number {
        return this.items.filter(n => !n.read).length;
    }

    load() {
        this.loading = true;
        http.get('/notifications').promise()
        .then((res: any) => {
            this.items = res?.items ?? [];
            state.unread = res?.unread ?? 0;
        })
        .catch(() => App.notification(translate.get('notifications.error')).setType('error').show())
        .finally(() => { this.loading = false; });
    }

    goBack() {
        if (window.history.state?.back) this.back();
        else this.to('/');
    }

    icon(n: InboxItem): string {
        return iconOf(n.kind);
    }

    // The message in the language of the moment; the meal comes as a key (breakfast, lunch, dinner)
    text(n: InboxItem, part: 'title' | 'body'): string {
        const params: Record<string, any> = { ...n.params };
        if (params.meal) params.meal = translate.get(`notifications.meals.${params.meal}`);
        return translate.get(`notifications.msg.${n.key}.${part}`, params);
    }

    when(n: InboxItem): string {
        const d = parseUtc(n.created_at);
        const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
        if (minutes < 1) return translate.get('notifications.now');

        const lang = ({ ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as any)[translate.currentLanguage] ?? 'ca-ES';
        const sameDay = d.toDateString() === new Date().toDateString();
        return sameDay
            ? d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString(lang, { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
    }

    // Tapping one marks it as read and goes to the screen it points to
    open(n: InboxItem) {
        if (!n.read) {
            n.read = true;
            state.unread = Math.max(0, state.unread - 1);
            http.patch(`/notifications/${n.id}/read`).promise().catch(() => refreshUnread());
        }
        if (n.route && n.route.startsWith('/')) this.to(n.route);
    }

    markAll() {
        this.items.forEach(n => { n.read = true; });
        state.unread = 0;
        http.post('/notifications/read').promise().catch(() => this.load());
    }

    remove(n: InboxItem) {
        this.items = this.items.filter(x => x.id !== n.id);
        if (!n.read) state.unread = Math.max(0, state.unread - 1);
        http.delete(`/notifications/${n.id}`).promise().catch(() => this.load());
    }

    clear() {
        App.confirm(translate.get('notifications.confirmClear')).then((ok: boolean) => {
            if (!ok) return;
            this.items = [];
            state.unread = 0;
            http.delete('/notifications').promise().catch(() => this.load());
        });
    }
}
export default toNative(NotificationsPage);
