// Hero: tool logos in their original colours, scattered across the hero.
// They float, lean away from the cursor, lift on hover and drift apart on
// scroll. Plain DOM + GPU-composited transforms (no WebGL), so it stays smooth
// on low-power laptops. Logos behind the headline/portrait are dimmed so the
// copy stays readable.
import { TOOLS, logoHTML } from "./tools.js";

const hero = document.querySelector(".hero");
const layer = document.getElementById("hero-logos");
const copy = document.querySelector(".hero-copy");
const portrait = document.querySelector(".portrait");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const lite =
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
  (navigator.deviceMemory && navigator.deviceMemory <= 4);

if (hero && layer) init();

// Small deterministic PRNG so the scatter is stable between visits.
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function init() {
  const pool = TOOLS.slice();
  const items = pool.map((t, i) => {
    const el = document.createElement("span");
    el.className = "hl";
    el.innerHTML = logoHTML(t);
    el.title = t.name;
    layer.appendChild(el);
    return { el, x: 0, y: 0, depth: 1, size: 40, op: 1, seed: i * 1.7, speed: 0.5 + ((i * 37) % 10) / 20, px: 0, py: 0, hover: 0 };
  });

  let W = 0, H = 0, active = items;

  function layout() {
    W = hero.clientWidth;
    H = hero.clientHeight;
    const mobile = W < 900;
    const count = Math.min(items.length, mobile ? 14 : lite ? 22 : items.length);
    const hr = hero.getBoundingClientRect();
    const rel = (r) => ({ l: r.left - hr.left, t: r.top - hr.top, r: r.right - hr.left, b: r.bottom - hr.top });
    const c = rel(copy.getBoundingClientRect());
    const p = rel(portrait.getBoundingClientRect());

    // Poisson-ish scatter: best-of-k candidates, keeps logos evenly spread.
    const rand = rng(7);
    const pts = [];
    const minD = Math.sqrt((W * H) / count) * 0.62;
    for (let i = 0; i < count; i++) {
      let best = null, bestD = -1;
      for (let k = 0; k < 24; k++) {
        const cx = W * (0.04 + rand() * 0.92);
        const cy = H * (0.12 + rand() * 0.8);
        let d = Infinity;
        for (const q of pts) d = Math.min(d, Math.hypot(q[0] - cx, q[1] - cy));
        if (d > bestD) { bestD = d; best = [cx, cy]; }
        if (d > minD) break;
      }
      pts.push(best);
    }

    active = items.slice(0, count);
    items.forEach((it, i) => {
      const on = i < count;
      it.el.style.display = on ? "" : "none";
      if (!on) return;
      const [x, y] = pts[i];
      it.depth = 0.55 + ((i * 7) % 10) / 22; // 0.55 – 1
      it.size = (mobile ? 26 : 34) + it.depth * (mobile ? 10 : 18);
      it.x = x;
      it.y = y;
      const inside = (r, pad) => x > r.l - pad && x < r.r + pad && y > r.t - pad && y < r.b + pad;
      // readable copy: logos behind text / portrait are faint
      it.op = inside(c, 24) ? 0.16 : inside(p, 0) ? 0.28 : 0.55 + it.depth * 0.4;
      it.el.style.width = it.el.style.height = it.size + "px";
      it.el.style.left = -it.size / 2 + "px";
      it.el.style.top = -it.size / 2 + "px";
      it.el.style.setProperty("--op", it.op);
    });
  }

  // pointer
  let mx = -9999, my = -9999, nx = 0, ny = 0, tx = 0, ty = 0, pointerIn = false;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
    tx = mx / r.width - 0.5;
    ty = my / r.height - 0.5;
    pointerIn = true;
    kick();
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { pointerIn = false; tx = ty = 0; mx = my = -9999; kick(); });

  // scroll
  let scrollP = 0;
  addEventListener("scroll", () => {
    scrollP = Math.min(1, Math.max(0, scrollY / (H * 0.9 || 1)));
    kick();
  }, { passive: true });

  // visibility: stop the loop entirely when the hero is off-screen or the tab is hidden
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(hero);
  document.addEventListener("visibilitychange", kick);

  const t0 = performance.now();
  let raf = 0, running = false, lastT = t0;

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) { running = false; return; }
    // light-mode devices: cap at ~30 fps
    if (lite && now - lastT < 32) { raf = requestAnimationFrame(frame); return; }
    lastT = now;
    const t = (now - t0) / 1000;
    const intro = reduced ? 1 : Math.min(1, t / 1.2);
    const ease = 1 - Math.pow(1 - intro, 3);
    nx += (tx - nx) * 0.08;
    ny += (ty - ny) * 0.08;
    const spread = 1 + scrollP * 0.5;
    const cx = W / 2, cy = H / 2;

    for (let i = 0; i < active.length; i++) {
      const it = active[i];
      const bob = reduced ? 0 : Math.sin(t * it.speed + it.seed) * 8 * it.depth;
      let x = cx + (it.x - cx) * spread - nx * 40 * it.depth;
      let y = cy + (it.y - cy) * spread + bob - ny * 30 * it.depth - scrollP * H * 0.25 * it.depth;

      // repel from cursor
      const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy);
      const reach = 140;
      const f = pointerIn && d < reach ? (1 - d / reach) * 46 : 0;
      it.px += ((d ? (dx / d) * f : 0) - it.px) * 0.12;
      it.py += ((d ? (dy / d) * f : 0) - it.py) * 0.12;
      x += it.px;
      y += it.py;

      const near = pointerIn && d < it.size * 0.7 ? 1 : 0;
      it.hover += (near - it.hover) * 0.15;
      const s = (0.4 + 0.6 * ease) * (1 + it.hover * 0.25);
      const rot = reduced ? 0 : Math.sin(t * 0.4 + it.seed) * 8 * (1 - it.hover);
      it.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      it.el.style.opacity = (it.op + it.hover * (1 - it.op)) * ease * (1 - scrollP * 0.9);
    }

    // with reduced motion there is nothing to animate once settled
    const settling = Math.abs(tx - nx) + Math.abs(ty - ny) > 0.001 || intro < 1;
    if (!reduced || settling) raf = requestAnimationFrame(frame);
    else running = false;
  }

  function kick() {
    if (!running && visible && !document.hidden) {
      running = true;
      raf = requestAnimationFrame(frame);
    }
  }

  layout();
  addEventListener("resize", () => { layout(); kick(); });
  addEventListener("load", layout);
  document.fonts?.ready.then(layout);
  kick();
}
