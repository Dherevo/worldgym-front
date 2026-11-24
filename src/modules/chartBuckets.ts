// Groups values by week (short periods) or by month (long ones), so a chart does not jump with every session:
// three leg days in one week make one bar, not three spikes. Weeks with nothing trained are empty bars.
const DAY = 86400000;

export type BucketUnit = 'day' | 'week' | 'month';
export type BucketAgg = 'sum' | 'max';
export interface Bucket { key: string; label: string; value: number }

// Up to 2 weeks: by day; up to about 3 months: by week; longer: by month
export function unitFor(from: Date, to: Date): BucketUnit {
    const days = (to.getTime() - from.getTime()) / DAY;
    return days <= 14 ? 'day' : days > 100 ? 'month' : 'week';
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function startOf(d: Date, unit: BucketUnit): Date {
    if (unit === 'month') return new Date(d.getFullYear(), d.getMonth(), 1);
    if (unit === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));   // Monday
    return x;
}

function next(d: Date, unit: BucketUnit): Date {
    if (unit === 'month') return new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (unit === 'day' ? 1 : 7));
}

// rows: dated values; from/to: the period shown (every bucket in between exists, even empty)
export function bucketize(rows: { date: string; value: number }[], from: Date, to: Date, agg: BucketAgg, locale: string): Bucket[] {
    const unit = unitFor(from, to);
    const longSpan = (to.getTime() - from.getTime()) / DAY > 400;
    const label = (d: Date) => unit === 'day'
        ? d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric' })
        : unit === 'week'
            ? d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
            : d.toLocaleDateString(locale, longSpan ? { month: 'short', year: '2-digit' } : { month: 'short' });

    const buckets = new Map<string, Bucket>();
    for (let d = startOf(from, unit); d <= to; d = next(d, unit)) {
        buckets.set(iso(d), { key: iso(d), label: label(d), value: 0 });
    }
    for (const r of rows) {
        const b = buckets.get(iso(startOf(new Date(r.date + 'T00:00:00'), unit)));
        if (!b || !Number.isFinite(r.value)) continue;
        b.value = agg === 'sum' ? b.value + r.value : Math.max(b.value, r.value);
    }
    return [...buckets.values()];
}
