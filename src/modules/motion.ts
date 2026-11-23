// Helpers of the animations of the app. Rule: only `transform` and `opacity` (and SVG strokes) are animated, so a
// mid-range phone keeps 60 fps; and nothing moves when the phone asks for reduced motion.

export function reducedMotion(): boolean {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Calls `update` with the value going from `from` to `to` (ease-out) and returns a function that stops it
export function tween(from: number, to: number, ms: number, update: (v: number) => void, done?: () => void): () => void {
    if (reducedMotion() || ms <= 0 || from === to) {
        update(to);
        done?.();
        return () => {};
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        const eased = 1 - Math.pow(1 - t, 3);
        update(from + (to - from) * eased);
        if (t < 1) frame = requestAnimationFrame(step);
        else done?.();
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
}
