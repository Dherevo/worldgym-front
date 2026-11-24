import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, translate } from "lib";
import SectionTile from "@/components/section-tile/section-tile.vue";
import BackButton from "@/components/back-button/back-button.vue";

// Calendar of trained days: the month with arrows and the whole year
@Component({ components: { SectionTile, BackButton } })
class CalendarPage extends Vue {

    loading = false;

    // Overview (last workouts and calendar)
    overview: any = null;

    // Calendar: current month + the whole year in a modal
    calMonthOffset = 0;

    showYear = false;

    get dateLocale() {
        const l = translate.currentLanguage;
        return l === 'es' ? 'es-ES' : l === 'en' ? 'en-GB' : 'ca-ES';
    }

    isoDate(d: Date): string {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    get weekdayLabels(): string[] {
        // 2024-01-01 was a Monday
        return [0, 1, 2, 3, 4, 5, 6].map(i => new Date(2024, 0, 1 + i).toLocaleDateString(this.dateLocale, { weekday: 'narrow' }));
    }

    get calendarMonth() {
        return this.monthData(this.calMonthOffset);
    }

    // The last 12 months (the newest first), each with its days
    get yearMonths() {
        return Array.from({ length: 12 }, (_, i) => ({ ...this.monthData(-i), key: i }));
    }

    monthData(offset: number) {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const y = first.getFullYear();
        const m = first.getMonth();

        const counts: Record<string, number> = {};
        for (const c of this.overview?.calendar ?? []) counts[c.date] = c.count;

        const todayKey = this.isoDate(now);
        const lead = (first.getDay() + 6) % 7; // Monday first
        const days = new Date(y, m + 1, 0).getDate();
        const cells: any[] = [];
        let trained = 0;
        for (let i = 0; i < lead; i++) cells.push(null);
        for (let d = 1; d <= days; d++) {
            const key = this.isoDate(new Date(y, m, d));
            const count = counts[key] ?? 0;
            if (count > 0) trained++;
            cells.push({ day: d, date: key, count, level: count === 0 ? 0 : Math.min(3, count + 1), today: key === todayKey, future: key > todayKey });
        }

        const label = first.toLocaleDateString(this.dateLocale, { month: 'long', year: 'numeric' });
        return { label: label.charAt(0).toUpperCase() + label.slice(1), cells, trained };
    }

    // The calendar data covers the last 53 weeks
    get canGoBack(): boolean {
        const from = this.overview?.calendar_from as string | undefined;
        if (!from) return false;
        const [y, m] = from.split('-').map(Number);
        const now = new Date();
        const target = new Date(now.getFullYear(), now.getMonth() + this.calMonthOffset - 1, 1);
        return target >= new Date(y, m - 1, 1);
    }

    formatHistoryDate(date: string) {
        return new Date(date).toLocaleDateString(this.dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
    }

    created() {
        this.loading = true;
        http.get('/stats/overview')
        .then((res: any) => { this.overview = res; })
        .catch(() => {})
        .finally(() => { this.loading = false; });
    }

    goBack() {
        if (window.history.state?.back) this.back();
        else this.to('/stats');
    }
}
export default toNative(CalendarPage);
