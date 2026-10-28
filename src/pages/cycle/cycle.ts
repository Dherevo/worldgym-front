import { Component, Vue, toNative } from "vue-facing-decorator";
import { http, App, translate } from "lib";

type DayKind = 'period' | 'predicted' | 'ovulation' | 'fertile';

interface CalendarCell {
    date: string;
    day: number;
    inMonth: boolean;
    isToday: boolean;
    kind: DayKind | null;
}

const DAY_MS = 86400000;

// Local Y-m-d, so dates do not shift with the timezone like toISOString() does
function ymd(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

function parse(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function diffDays(a: string, b: string): number {
    return Math.round((parse(a).getTime() - parse(b).getTime()) / DAY_MS);
}

@Component({})
class CyclePage extends Vue {

    periods: any[] = [];
    cycles: any[] = [];
    cycleLength = 28;
    periodLength = 5;
    loading = false;

    // First day of the month shown in the calendar
    month: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    showModal = false;
    editingId: number | null = null;
    startDate = '';
    endDate = '';
    saving = false;

    readonly todayStr = ymd(new Date());

    created() {
        this.fetchCycle();
    }

    fetchCycle() {
        this.loading = true;
        http.get('/cycle')
        .then((res: any) => this.apply(res))
        .catch(() => App.notification(translate.get('cycle.errors.load')).setType('error').show())
        .finally(() => { this.loading = false; });
    }

    apply(res: any) {
        this.periods = res.periods ?? [];
        this.cycles = res.cycles ?? [];
        this.cycleLength = res.cycle_length;
        this.periodLength = res.period_length;
    }

    get dateLocale(): string {
        return ({ ca: 'ca-ES', es: 'es-ES', en: 'en-GB' } as any)[translate.currentLanguage] ?? 'ca-ES';
    }

    formatDate(date: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
        return parse(date).toLocaleDateString(this.dateLocale, opts);
    }

    get monthLabel(): string {
        return this.month.toLocaleDateString(this.dateLocale, { month: 'long', year: 'numeric' });
    }

    // Monday-first week header, localised through Intl instead of hardcoded lists
    get weekdays(): string[] {
        const monday = new Date(2024, 0, 1);
        return Array.from({ length: 7 }, (_, i) =>
            new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
                .toLocaleDateString(this.dateLocale, { weekday: 'short' }));
    }

    // date -> what that day is. Real periods win over predictions, ovulation over the rest of the window.
    get dayKinds(): Map<string, DayKind> {
        const map = new Map<string, DayKind>();
        const mark = (from: string, to: string, kind: DayKind) => {
            for (let d = parse(from); ymd(d) <= to; d.setDate(d.getDate() + 1)) {
                const key = ymd(d);
                if (!map.has(key)) map.set(key, kind);
            }
        };

        for (const c of this.cycles.filter(c => !c.predicted)) mark(c.period_start, c.period_end, 'period');
        for (const c of this.cycles.filter(c => c.predicted)) mark(c.period_start, c.period_end, 'predicted');
        for (const c of this.cycles) mark(c.ovulation, c.ovulation, 'ovulation');
        for (const c of this.cycles) mark(c.fertile_start, c.fertile_end, 'fertile');

        return map;
    }

    get cells(): CalendarCell[] {
        const first = new Date(this.month.getFullYear(), this.month.getMonth(), 1);
        const offset = (first.getDay() + 6) % 7; // Monday = 0
        const start = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
        const rows = Math.ceil((offset + new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()) / 7);

        return Array.from({ length: rows * 7 }, (_, i) => {
            const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
            const date = ymd(d);
            return {
                date,
                day: d.getDate(),
                inMonth: d.getMonth() === first.getMonth(),
                isToday: date === this.todayStr,
                kind: this.dayKinds.get(date) ?? null,
            };
        });
    }

    changeMonth(delta: number) {
        this.month = new Date(this.month.getFullYear(), this.month.getMonth() + delta, 1);
    }

    get hasData(): boolean {
        return this.periods.length > 0;
    }

    get todayStatus(): string {
        const kind = this.dayKinds.get(this.todayStr);
        if (kind === 'period' || kind === 'predicted') return translate.get('cycle.today.period');
        if (kind === 'ovulation') return translate.get('cycle.today.ovulation');
        if (kind === 'fertile') return translate.get('cycle.today.fertile');
        return translate.get('cycle.today.none');
    }

    // First estimated cycle whose date (picked by `field`) has not passed yet
    private upcoming(field: string, endField?: string): any | null {
        return this.cycles.find(c => (c[endField ?? field] as string) >= this.todayStr) ?? null;
    }

    get nextPeriod(): any | null {
        // Predicted periods only: a logged one is already happening or over
        return this.cycles.find(c => c.predicted && c.period_start >= this.todayStr) ?? null;
    }

    get nextOvulation(): any | null {
        return this.upcoming('ovulation');
    }

    get nextFertile(): any | null {
        return this.upcoming('fertile_start', 'fertile_end');
    }

    relative(date: string): string {
        const n = diffDays(date, this.todayStr);
        if (n === 0) return translate.get('cycle.cards.todayLabel');
        if (n === 1) return translate.get('cycle.cards.inOneDay');
        if (n > 1) return translate.get('cycle.cards.inDays', { n });
        return translate.get('cycle.cards.daysAgo', { n: -n });
    }

    get fertileRange(): string {
        const c = this.nextFertile;
        if (!c) return '';
        const short: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        return `${this.formatDate(c.fertile_start, short)} – ${this.formatDate(c.fertile_end, short)}`;
    }

    get history(): any[] {
        return [...this.periods].reverse();
    }

    periodRange(p: any): string {
        const short: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        return p.end_date
            ? `${this.formatDate(p.start_date, short)} – ${this.formatDate(p.end_date, short)}`
            : `${this.formatDate(p.start_date, short)} (${translate.get('cycle.ongoing')})`;
    }

    openCreate() {
        this.editingId = null;
        this.startDate = this.todayStr;
        this.endDate = '';
        this.showModal = true;
    }

    openEdit(p: any) {
        this.editingId = p.id;
        this.startDate = p.start_date;
        this.endDate = p.end_date ?? '';
        this.showModal = true;
    }

    save() {
        if (this.saving || !this.startDate) return;
        this.saving = true;

        const body = { start_date: this.startDate, end_date: this.endDate || null };
        const request = this.editingId
            ? http.put(`/cycle/periods/${this.editingId}`)
            : http.post('/cycle/periods');

        request.data(body)
        .then((res: any) => {
            this.apply(res);
            this.showModal = false;
        })
        .catch((e: any) => {
            const code = e?.error ?? e?.data?.error ?? '';
            const key = code === 'period.overlap' ? 'overlap' : code === 'period.invalid' ? 'invalid' : 'save';
            App.notification(translate.get(`cycle.errors.${key}`)).setType('error').show();
        })
        .finally(() => { this.saving = false; });
    }

    remove(p: any) {
        App.confirm(translate.get('cycle.confirmDelete', { date: this.formatDate(p.start_date) }))
        .then((ok: boolean) => {
            if (!ok) return;
            http.delete(`/cycle/periods/${p.id}`)
            .then((res: any) => this.apply(res))
            .catch(() => App.notification(translate.get('cycle.errors.delete')).setType('error').show());
        });
    }
}
export default toNative(CyclePage);
