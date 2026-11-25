import { translate } from "lib";

// Why a ready-made routine (or a day of it) fits today, as a sentence: the muscles not trained this week first, then the rest
export function routineWhy(r: any): string {
    const reasons: string[] = r?.reasons ?? [];
    if (reasons.includes('fresh') && r.fresh_groups?.length) return translate.get('routineTemplates.whyFresh', { groups: r.fresh_groups.join(', ') });
    const key = ['week_empty', 'gentle', 'intense', 'beginner'].find(k => reasons.includes(k)) ?? reasons.find(k => k !== 'fresh');
    return key ? translate.get(`routineTemplates.why.${key}`) : '';
}

// "Dia 2: Esquena i bíceps" (or just "Dia 2")
export function routineDayLabel(r: any): string {
    if (!r?.day) return '';
    const base = translate.get('routineTemplates.day', { n: r.day.number });
    return r.day.name ? `${base}: ${r.day.name}` : base;
}
