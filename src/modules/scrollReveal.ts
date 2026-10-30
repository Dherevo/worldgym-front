// Fade-up reveal for page sections as they enter the viewport.
// Pages render async (v-if after fetch), so a MutationObserver tags new targets as they appear.
// SectionTile roots are skipped (their head is revealed instead): the tile holds a position:fixed modal, and an
// ancestor with opacity/transform would trap it in its own stacking context and let later sections paint over it.
const SELECTOR = '[class$="-page"] > *:not(.modal-overlay):not(.section-tile), .section-tile > .st-head, .exercises-list > *, .workout-list > *';
const OVERLAY = '.modal-overlay, .st-overlay';
const CLEANUP_MS = 800;

export default function initScrollReveal() {
    if (typeof IntersectionObserver === 'undefined') return;

    const seen = new WeakSet<Element>();

    const finish = (el: HTMLElement) => {
        el.classList.remove('reveal', 'is-visible');
        el.style.transitionDelay = '';
    };

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target as HTMLElement;
            io.unobserve(el);
            el.classList.add('is-visible');
            // Drop the helper classes afterwards so they never interfere with hover transforms/transitions
            setTimeout(() => finish(el), CLEANUP_MS);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    // A modal opened inside a section that is still revealing: settle that section right away
    const settleAround = (overlay: Element) => {
        for (let p = overlay.parentElement; p; p = p.parentElement) {
            if (p.classList.contains('reveal')) { io.unobserve(p); finish(p as HTMLElement); }
        }
    };

    const tag = (root: ParentNode) => {
        if (root instanceof Element && root.matches(OVERLAY)) settleAround(root);
        root.querySelectorAll(OVERLAY).forEach(settleAround);
        const found: Element[] = [];
        if (root instanceof Element && root.matches(SELECTOR)) found.push(root);
        root.querySelectorAll(SELECTOR).forEach((el) => found.push(el));
        found.forEach((el) => {
            if (seen.has(el)) return;
            seen.add(el);
            const slot = el.matches('.st-head') ? el.parentElement! : el;
            const index = Array.prototype.indexOf.call(slot.parentElement?.children ?? [], slot);
            (el as HTMLElement).style.transitionDelay = `${Math.min(index, 5) * 60}ms`;
            el.classList.add('reveal');
            io.observe(el);
        });
    };

    new MutationObserver((mutations) => {
        mutations.forEach((m) => m.addedNodes.forEach((n) => { if (n instanceof Element) tag(n); }));
    }).observe(document.body, { childList: true, subtree: true });

    tag(document.body);
}
