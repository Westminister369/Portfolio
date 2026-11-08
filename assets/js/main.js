import { ICONS } from "./icons.js";

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

requestAnimationFrame(() => document.documentElement.classList.add("is-loaded"));

/* ── Tools data (brand glyphs from Simple Icons; monograms where none exists) ── */
const BRAND = {
  claude: "#D97757", openai: "#111111", googlegemini: "#8E75B2", googlecolab: "#F9AB00",
  notion: "#111111", airtable: "#18BFFF", googlesheets: "#34A853", slack: "#4A154B",
  zoho: "#E42527", googleanalytics: "#E37400", looker: "#4285F4", wordpress: "#21759B",
  sanity: "#F03E2F", googlesearchconsole: "#458CF5", semrush: "#FF642D", canva: "#00C4CC",
  adobe: "#FF0000", figma: "#F24E1E", linkedin: "#0A66C2", youtube: "#FF0000",
  github: "#181717", miro: "#FFD02F",
};
const TOOLS = [
  ["claude", "Claude", "ai"], ["openai", "GPT-4o", "ai"], ["googlegemini", "Google AI Studio", "ai"],
  ["googlecolab", "Google Colab", "ai"], ["#LB", "Labelbox", "ai"], ["#V7", "V7 Labs", "ai"],
  ["#Co", "Copilot", "ai"],
  ["#Cl", "Clay", "growth"], ["#In", "Instantly", "growth"], ["#Wa", "Waalaxy", "growth"],
  ["linkedin", "LinkedIn", "growth"], ["youtube", "YouTube", "growth"], ["wordpress", "WordPress", "growth"],
  ["sanity", "Sanity", "growth"], ["#RM", "Rank Math", "growth"], ["googlesearchconsole", "Search Console", "growth"],
  ["semrush", "Semrush", "growth"],
  ["googleanalytics", "GA4", "ops"], ["looker", "Looker Studio", "ops"], ["zoho", "Zoho CRM", "ops"],
  ["notion", "Notion", "ops"], ["airtable", "Airtable", "ops"], ["googlesheets", "Google Sheets", "ops"],
  ["#Xl", "Excel · M365", "ops"], ["slack", "Slack", "ops"], ["github", "GitHub", "ops"],
  ["canva", "Canva", "design"], ["adobe", "Adobe CC", "design"], ["figma", "Figma", "design"], ["miro", "Miro", "design"],
];
const svgFor = (slug) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[slug].p}"/></svg>`;

const tools = $("#tools");
if (tools) {
  tools.innerHTML = TOOLS.map(([slug, name, cat]) => {
    const glyph = slug.startsWith("#") ? `<span class="mono" aria-hidden="true">${slug.slice(1)}</span>` : svgFor(slug);
    const brand = BRAND[slug] ? ` style="--brand:${BRAND[slug]}"` : "";
    return `<div class="tool" data-cat="${cat}"${brand}>${glyph}<span>${name}</span></div>`;
  }).join("");
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
  const items = TOOLS.filter(([s]) => !s.startsWith("#"))
    .map(([slug, name]) => `<span class="marquee-item" style="--brand:${BRAND[slug]}">${svgFor(slug)}${name}</span>`)
    .join("");
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
addEventListener("scroll", onScroll, { passive: true });
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
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { ring.classList.remove("is-on"); dot.classList.remove("is-on"); });
  document.addEventListener("pointerover", (e) => {
    ring.classList.toggle("is-link", !!e.target.closest("a, button, .tool, [data-tilt]"));
  });
  (function loop() {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  })();

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
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transition = "box-shadow .45s, transform .12s linear";
      el.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg) translateY(-4px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "box-shadow .45s, transform .8s cubic-bezier(.2,.7,.2,1)";
      el.style.transform = "";
    });
  });

  // Portrait parallax
  const portrait = $("[data-parallax] img");
  const plate = $("[data-parallax] .portrait-plate");
  addEventListener("pointermove", (e) => {
    if (scrollY > innerHeight) return;
    const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
    portrait.style.transform = `translate(${x * -14}px, ${y * -8}px)`;
    plate.style.transform = `translate(${x * 10}px, ${y * 6}px)`;
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
  addEventListener("scroll", upd, { passive: true });
  upd();
}
