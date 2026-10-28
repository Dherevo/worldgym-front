// Local Y-m-d. toISOString() would give the UTC date, which is the wrong day late in the evening.
export default function localDate(d: Date = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
