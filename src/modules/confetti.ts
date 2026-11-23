import { reducedMotion } from "@/modules/motion";
import { hapticSuccess } from "@/modules/haptics";

// A short burst of confetti over the screen (a canvas that removes itself). It also vibrates once.
const COLORS = ['#E09132', '#2AB7A9', '#B86FD8', '#6FBF4A', '#F5A524', '#6C8EBF', '#D9442F'];

export function celebrate(count = 70) {
    hapticSuccess();
    if (reducedMotion() || typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) { canvas.remove(); return; }
    ctx.scale(dpr, dpr);

    const pieces = Array.from({ length: count }, () => ({
        x: w / 2 + (Math.random() - 0.5) * w * 0.3,
        y: h * 0.35,
        vx: (Math.random() - 0.5) * 11,
        vy: -Math.random() * 12 - 4,
        size: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));

    const start = performance.now();
    const DURATION = 2200;
    const draw = (now: number) => {
        const t = now - start;
        ctx.clearRect(0, 0, w, h);
        const fade = t > DURATION - 500 ? Math.max(0, (DURATION - t) / 500) : 1;
        for (const p of pieces) {
            p.vy += 0.35;
            p.vx *= 0.99;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            ctx.save();
            ctx.globalAlpha = fade;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            ctx.restore();
        }
        if (t < DURATION) requestAnimationFrame(draw);
        else canvas.remove();
    };
    requestAnimationFrame(draw);
}
