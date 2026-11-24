// Swipe left/right on a page to go to the next/previous tab, like turning the pages of a book.
// Only used in the app (the web keeps its own swipe for the side menu). Gestures that belong to something else are
// left alone: inputs, horizontally scrollable strips (day selector, tab bar, tables), swipe rows and charts.
const MIN_DISTANCE = 70;
const IGNORE = 'input, textarea, select, canvas, .swipe-row, [data-no-swipe]';

function belongsToSomethingElse(target: EventTarget | null): boolean {
    let el = target as HTMLElement | null;
    while (el && el !== document.body) {
        if (el.matches?.(IGNORE)) return true;
        if (el.scrollWidth > el.clientWidth + 1 && ['auto', 'scroll'].includes(getComputedStyle(el).overflowX)) return true;
        el = el.parentElement;
    }
    return false;
}

// The listeners are on the document (the page content may render after the page is mounted) and only act on touches
// that start inside `areaSelector`. dir: 1 = next tab (finger moved left), -1 = previous tab.
// Returns a function that removes the listeners.
export function swipeTabs(areaSelector: string, onSwipe: (dir: 1 | -1) => void): () => void {
    let start: { x: number; y: number } | null = null;

    const onStart = (e: TouchEvent) => {
        start = null;
        if (e.touches.length !== 1 || !(e.target as Element | null)?.closest?.(areaSelector) || belongsToSomethingElse(e.target)) return;
        start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onEnd = (e: TouchEvent) => {
        const s = start;
        start = null;
        if (!s || !e.changedTouches.length) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dy) > Math.abs(dx) * 0.6) return;
        onSwipe(dx < 0 ? 1 : -1);
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
        document.removeEventListener('touchstart', onStart);
        document.removeEventListener('touchend', onEnd);
    };
}

// Slide-in of the new content from the side it came from (restarts the CSS animation each time)
export function slideIn(el: HTMLElement | null | undefined, dir: 1 | -1) {
    if (!el) return;
    el.classList.remove('slide-from-right', 'slide-from-left');
    el.getBoundingClientRect();   // forces a reflow so the animation restarts
    el.classList.add(dir === 1 ? 'slide-from-right' : 'slide-from-left');
}
