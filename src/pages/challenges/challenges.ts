import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";
import UserAvatar from "@/components/user-avatar/user-avatar.vue";

type Tab = 'ranking' | 'available';

// Monthly and custom challenges: ranking of the ones the user joined, and the ones they can still join
@Component({ components: { UserAvatar } })
class ChallengesPage extends Vue {

    tab: Tab = 'ranking';
    loading = false;
    challenges: any[] = [];
    medals: any = null;

    // Challenge shown in the ranking tab, with its ranking and the user's days
    selectedId: number | null = null;
    detail: any = null;
    loadingDetail = false;
    joiningId: number | null = null;

    created() {
        this.fetchAll();
    }

    fetchAll() {
        this.loading = true;
        http.get('/challenges/medals')
        .then((res: any) => { this.medals = res; })
        .catch(() => {});

        http.get('/challenges')
        .then((res: any) => {
            this.challenges = res.items ?? [];
            // Joined ones live in the ranking tab; with none joined, the useful tab is the list
            const joined = this.joined;
            if (!joined.length) this.tab = 'available';
            if (joined.length && !joined.some((c: any) => c.id === this.selectedId)) this.select(joined[0].id);
        })
        .catch(() => App.notification(translate.get('challenges.errors.load')).setType('error').show())
        .finally(() => { this.loading = false; });
    }

    get joined(): any[] {
        return this.challenges.filter(c => c.joined);
    }

    get hasMedals(): boolean {
        return !!this.medals && (this.medals.gold + this.medals.silver + this.medals.bronze) > 0;
    }

    select(id: number) {
        this.selectedId = id;
        this.loadingDetail = true;
        http.get(`/challenges/${id}`)
        .then((res: any) => { if (this.selectedId === id) this.detail = res; })
        .catch(() => App.notification(translate.get('challenges.errors.load')).setType('error').show())
        .finally(() => { this.loadingDetail = false; });
    }

    join(c: any) {
        if (this.joiningId) return;
        this.joiningId = c.id;
        http.post(`/challenges/${c.id}/join`).data({})
        .then(() => {
            this.tab = 'ranking';
            this.selectedId = c.id;
            this.fetchAll();
            this.select(c.id);
        })
        .catch(() => App.notification(translate.get('challenges.errors.join')).setType('error').show())
        .finally(() => { this.joiningId = null; });
    }

    leave(c: any) {
        App.confirm(translate.get('challenges.confirmLeave')).then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/challenges/${c.id}/leave`)
            .then(() => { this.selectedId = null; this.detail = null; this.fetchAll(); })
            .catch(() => App.notification(translate.get('challenges.errors.leave')).setType('error').show());
        });
    }

    unit(c: any): string {
        return translate.get(`challenges.units.${c.metric}`);
    }

    percent(done: number, goal: number): number {
        return goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
    }

    fmt(n: number): string {
        return Number(n).toLocaleString();
    }

    range(c: any): string {
        const f = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
        return translate.get('challenges.range', { from: f(c.starts_on), to: f(c.ends_on) });
    }

    // Informative: what is left to reach the suggested minimum of today
    get dailyHint(): string {
        const d = this.detail;
        if (!d?.my || !d.daily_min) return '';
        const left = d.daily_min - d.my.today;
        return left > 0
            ? translate.get('challenges.dailyLeft', { n: this.fmt(left) })
            : translate.get('challenges.dailyReached');
    }

    medalIcon(position: number): string {
        return ['🥇', '🥈', '🥉'][position - 1] ?? '';
    }

    dayLabel(date: string): string {
        return String(Number(date.slice(8, 10)));
    }
}
export default toNative(ChallengesPage);
