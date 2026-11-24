// Reorders a list by dragging its handle with a finger or a mouse.
// HTML5 drag and drop (`draggable`, `dragstart`, `drop`) does not start with a finger in the app, so it is not used.
//
// Call it from `@pointerdown` on the handle (the handle needs `touch-action: none`). `items` are the elements of the list
// in order and `index` is the one being moved. The moved element follows the finger, a line marks where it will land, the
// page scrolls near its top and bottom edges, and `onDone(to)` is called with the new index when it is released.
const EDGE = 90;          // px from the top of the screen where the page scrolls up
const BOTTOM_EDGE = 150;  // px from the bottom (the bottom tab bar is there)
const SPEED = 14;         // px per frame

export function dragReorder(e: PointerEvent, items: HTMLElement[], index: number, onDone: (to: number) => void): void {
    const handle = e.currentTarget as HTMLElement;
    const dragged = items[index];
    if (!dragged) return;

    e.preventDefault();
    handle.setPointerCapture?.(e.pointerId);

    const others = items.filter((_, i) => i !== index);
    const startY = e.clientY;
    const startScroll = window.scrollY;
    let pointerY = e.clientY;
    let to = index;
    let frame = 0;

    dragged.classList.add('reorder-dragging');
    document.body.classList.add('reordering');

    const mark = () => {
        others.forEach(o => o.classList.remove('drop-before', 'drop-after'));
        if (!others.length) return;
        if (to < others.length) others[to].classList.add('drop-before');
        else others[others.length - 1].classList.add('drop-after');
    };

    // The element follows the finger (also while the page scrolls) and the landing place is where its centre is
    const update = () => {
        dragged.style.transform = `translateY(${pointerY - startY + window.scrollY - startScroll}px)`;
        to = others.filter(o => {
            const r = o.getBoundingClientRect();
            return r.top + r.height / 2 < pointerY;
        }).length;
        mark();
    };

    const tick = () => {
        if (pointerY < EDGE) window.scrollBy(0, -SPEED);
        else if (pointerY > window.innerHeight - BOTTOM_EDGE) window.scrollBy(0, SPEED);
        update();
        frame = requestAnimationFrame(tick);
    };

    const onMove = (ev: PointerEvent) => { pointerY = ev.clientY; };

    const finish = (apply: boolean) => {
        cancelAnimationFrame(frame);
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onCancel);
        handle.releasePointerCapture?.(e.pointerId);
        dragged.classList.remove('reorder-dragging');
        dragged.style.transform = '';
        others.forEach(o => o.classList.remove('drop-before', 'drop-after'));
        document.body.classList.remove('reordering');
        if (apply && to !== index) onDone(to);
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onCancel);
    frame = requestAnimationFrame(tick);
}
