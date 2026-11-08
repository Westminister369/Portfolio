import { TOOLS, logoHTML } from "./tools.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

requestAnimationFrame(() => document.documentElement.classList.add("is-loaded"));

/* ── Toolbox + marquee (logos from tools.js) ── */
const tools = $("#tools");
if (tools) {
  tools.innerHTML = TOOLS.map((t) => `<div class="tool" data-cat="${t.cat}">${logoHTML(t)}<span>${t.name}</span></div>`).join("");
  $$(".filters button").forEach((b) =>
    b.addEventListener("click", () => {
      $$(".filters button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      const f = b.dataset.filter;
      $$(".tool", tools).forEach((t) => t.classList.toggle("is-dim", f !== "all" && t.dataset.cat !== f));
    })
  );
}

const marquee = $("#marquee");
if (marquee) {
  const items = TOOLS.map((t) => `<span class="marquee-item">${logoHTML(t)}${t.name}</span>`).join("");
  marquee.innerHTML = items + items.replace(/<span class="marquee-item"/g, '<span class="marquee-item" aria-hidden="true"');
}

/* ── Nav: hide on scroll down, active section, mobile menu ── */
const nav = $("#nav");
const menuBtn = $(".nav-menu");
menuBtn?.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  menuBtn.setAttribute("aria-expanded", open);
});
$$(".nav-links a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", false); }));

const progress = $(".progress");
let lastY = scrollY;
const onScroll = () => {
  const y = scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  if (!nav.classList.contains("is-open")) nav.classList.toggle("is-hidden", y > lastY && y > 400);
  lastY = y;
};
let scrollQueued = false;
addEventListener("scroll", () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(() => { scrollQueued = false; onScroll(); });
}, { passive: true });
onScroll();

const sections = $$("main section[id]");
const links = new Map($$(".nav-links a").map((a) => [a.getAttribute("href").slice(1), a]));
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    links.forEach((a) => a.classList.remove("is-active"));
    let id = e.target.id;
    if (id === "cases") id = "work";
    if (id === "credentials") id = "toolkit";
    links.get(id)?.classList.add("is-active");
  });
}, { rootMargin: "-45% 0px -50% 0px" });
sections.forEach((s) => sectionObserver.observe(s));

/* ── Reveal on scroll ── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-in"); revealObs.unobserve(e.target); }
  });
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
$$(".reveal").forEach((el) => revealObs.observe(el));

/* ── Count-up stats ── */
const countObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    countObs.unobserve(e.target);
    const el = e.target;
    const to = parseFloat(el.dataset.count);
    const dec = +(el.dataset.decimals || 0);
    const pre = el.dataset.prefix || "";
    const small = el.querySelector("small");
    const suffix = small ? small.outerHTML : el.dataset.suffix || "";
    const fmt = (v) => pre + v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
    if (reduced) { el.innerHTML = fmt(to); return; }
    const t0 = performance.now(), dur = 1800;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.innerHTML = fmt(to * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.4 });
$$("[data-count]").forEach((el) => countObs.observe(el));

/* draw sparkline when visible */
$$(".draw").forEach((p) => {
  const len = p.getTotalLength();
  p.style.strokeDasharray = len;
  p.style.strokeDashoffset = reduced ? 0 : len;
  p.style.transition = "stroke-dashoffset 2.4s cubic-bezier(.2,.7,.2,1) .3s";
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { p.style.strokeDashoffset = 0; o.disconnect(); } }).observe(p);
});

/* ── Experience accordion ── */
$$(".role-head").forEach((btn) =>
  btn.addEventListener("click", () => {
    const role = btn.closest(".role");
    const open = role.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open);
  })
);

/* ── Modal ── */
const modal = $("#modal");
const modalContent = $("#modal-content");
let lastFocus = null;
function openModal(key) {
  const tpl = $(`#tpl-${key}`);
  if (!tpl) return;
  lastFocus = document.activeElement;
  modalContent.replaceChildren(tpl.content.cloneNode(true));
  modalContent.scrollTop = 0;
  if (!modal.open) modal.showModal();
  document.documentElement.classList.add("modal-open");
  history.replaceState(null, "", `#${key}`);
}
function closeModal() {
  modal.close();
}
modal.addEventListener("close", () => {
  document.documentElement.classList.remove("modal-open");
  history.replaceState(null, "", location.pathname + location.search);
  lastFocus?.focus?.({ preventScroll: true });
});
$(".modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
$$("[data-modal]").forEach((el) => el.addEventListener("click", () => openModal(el.dataset.modal)));
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#cs"], a[href^="#vol"]');
  if (!a) return;
  e.preventDefault();
  openModal(a.getAttribute("href").slice(1));
});
if (/^#(cs\d|vol\d)$/.test(location.hash)) openModal(location.hash.slice(1));

/* ── Pointer effects (desktop only) ── */
if (finePointer && !reduced) {
  // Soft cursor
  const ring = $(".cursor"), dot = $(".cursor-dot");
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    ring.classList.add("is-on"); dot.classList.add("is-on");
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { ring.classList.remove("is-on"); dot.classList.remove("is-on"); });
  document.addEventListener("pointerover", (e) => {
    ring.classList.toggle("is-link", !!e.target.closest("a, button, .tool, [data-tilt]"));
  });
  // the ring eases toward the pointer; the loop sleeps once it has caught up
  let ringRaf = 0;
  const loop = () => {
    rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    ringRaf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.3 ? requestAnimationFrame(loop) : 0;
  };
  addEventListener("pointermove", () => { if (!ringRaf) ringRaf = requestAnimationFrame(loop); }, { passive: true });

  // Magnetic buttons
  $$("[data-magnetic]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(e.clientX - r.left - r.width / 2) * 0.25}px`);
      el.style.setProperty("--my", `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
    });
    el.addEventListener("pointerleave", () => { el.style.setProperty("--mx", "0px"); el.style.setProperty("--my", "0px"); });
  });

  // 3D tilt cards
  $$("[data-tilt]").forEach((el) => {
    let q = false, ex = 0, ey = 0;
    el.addEventListener("pointermove", (e) => {
      ex = e.clientX; ey = e.clientY;
      if (q) return;
      q = true;
      requestAnimationFrame(() => {
        q = false;
        const r = el.getBoundingClientRect();
        const x = (ex - r.left) / r.width - 0.5;
        const y = (ey - r.top) / r.height - 0.5;
        el.style.transition = "box-shadow .45s, transform .12s linear";
        el.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg) translateY(-4px)`;
      });
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "box-shadow .45s, transform .8s cubic-bezier(.2,.7,.2,1)";
      el.style.transform = "";
    });
  });

  // Portrait parallax
  const portrait = $("[data-parallax] img");
  const plate = $("[data-parallax] .portrait-plate");
  let px = 0, py = 0, pQueued = false;
  addEventListener("pointermove", (e) => {
    if (scrollY > innerHeight) return;
    px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5;
    if (pQueued) return;
    pQueued = true;
    requestAnimationFrame(() => {
      pQueued = false;
      portrait.style.transform = `translate3d(${px * -14}px, ${py * -8}px, 0)`;
      plate.style.transform = `translate3d(${px * 10}px, ${py * 6}px, 0)`;
    });
  }, { passive: true });
}

/* ── Scroll-linked: footer arches rise ── */
const arches = $$(".arch");
if (arches.length && !reduced) {
  const archWrap = $(".arches");
  const upd = () => {
    const r = archWrap.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height + innerHeight * 0.3)));
    arches.forEach((a, i) => {
      const d = Math.abs(i - 3);
      a.style.setProperty("--y", `${(1 - p) * (40 + d * 30)}%`);
    });
  };
  let archesOn = false, archQueued = false;
  new IntersectionObserver(([e]) => { archesOn = e.isIntersecting; if (archesOn) upd(); }).observe(archWrap);
  addEventListener("scroll", () => {
    if (!archesOn || archQueued) return;
    archQueued = true;
    requestAnimationFrame(() => { archQueued = false; upd(); });
  }, { passive: true });
}
