// Gestures that belong to something else must not start a page swipe: inputs, horizontally scrollable strips
// (day selector, chips, tables), swipe rows and anything marked data-no-swipe.
const IGNORE = 'input, textarea, select, .swipe-row:not(.plain), [data-no-swipe]';

export function belongsToSomethingElse(target: EventTarget | null): boolean {
    let el = target as HTMLElement | null;
    while (el && el !== document.body) {
        if (el.matches?.(IGNORE)) return true;
        if (el.scrollWidth > el.clientWidth + 1 && ['auto', 'scroll'].includes(getComputedStyle(el).overflowX)) return true;
        el = el.parentElement;
    }
    return false;
}
