import { translate } from 'lib';
import localDate from '@/modules/localDate';

// "Last done: 3 days ago" for a habit, from its `last_done` day (Y-m-d) or null when never completed
export function lastDoneLabel(last: string | null | undefined): string {
    if (!last) return translate.get('habits.lastDone.never');
    const [y, m, d] = last.split('-').map(Number);
    const [ty, tm, td] = localDate().split('-').map(Number);
    const days = Math.round((new Date(ty, tm - 1, td).getTime() - new Date(y, m - 1, d).getTime()) / 86400000);
    if (days <= 0) return translate.get('habits.lastDone.today');
    if (days === 1) return translate.get('habits.lastDone.yesterday');
    return translate.get('habits.lastDone.days', { n: days });
}
