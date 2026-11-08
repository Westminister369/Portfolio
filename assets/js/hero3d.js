// Hero: floating porcelain tool tiles (three.js). White on white; tiles lean
// toward the cursor, push away when it gets close, show brand colour on hover,
// and drift apart as you scroll.
import * as THREE from "three";
import { RoundedBoxGeometry } from "../vendor/RoundedBoxGeometry.js";
import { RoomEnvironment } from "../vendor/RoomEnvironment.js";
import { ICONS } from "./icons.js";

const canvas = document.getElementById("hero-canvas");
const hero = document.querySelector(".hero");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const SLUGS = [
  ["claude", "#D97757"], ["openai", "#111111"], ["notion", "#111111"], ["figma", "#F24E1E"],
  ["googleanalytics", "#E37400"], ["airtable", "#18BFFF"], ["slack", "#4A154B"], ["canva", "#00C4CC"],
  ["googlegemini", "#8E75B2"], ["wordpress", "#21759B"], ["zoho", "#E42527"], ["looker", "#4285F4"],
  ["googlesheets", "#34A853"], ["linkedin", "#0A66C2"], ["adobe", "#FF0000"], ["miro", "#E6B800"],
];

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
} catch (e) {
  hero.classList.add("no-webgl");
}

if (renderer) init();

function iconTexture(slug, color) {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d");
  g.translate(s * 0.2, s * 0.2);
  g.scale((s * 0.6) / 24, (s * 0.6) / 24);
  g.fillStyle = color;
  g.fill(new Path2D(ICONS[slug].p));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function init() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xe9e5dd, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-4, 6, 8);
  scene.add(key);

  const tileGeo = new RoundedBoxGeometry(1, 1, 0.3, 6, 0.22);
  const tileMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.18,
    sheen: 0.4, sheenColor: new THREE.Color(0xf3efe7),
  });
  const iconGeo = new THREE.PlaneGeometry(0.62, 0.62);

  const world = new THREE.Group();
  scene.add(world);

  const tiles = SLUGS.map(([slug, brand], i) => {
    const group = new THREE.Group();
    const tile = new THREE.Mesh(tileGeo, tileMat);
    const grey = new THREE.MeshBasicMaterial({ map: iconTexture(slug, "#4a4843"), transparent: true, opacity: 0.85, depthWrite: false });
    const color = new THREE.MeshBasicMaterial({ map: iconTexture(slug, brand), transparent: true, opacity: 0, depthWrite: false });
    const iconA = new THREE.Mesh(iconGeo, grey);
    const iconB = new THREE.Mesh(iconGeo, color);
    iconA.position.z = iconB.position.z = 0.152;
    iconB.position.z += 0.001;
    // mirror the glyph on the back so a spinning tile never shows a blank face
    const backA = new THREE.Mesh(iconGeo, grey), backB = new THREE.Mesh(iconGeo, color);
    backA.rotation.y = backB.rotation.y = Math.PI;
    backA.position.z = backB.position.z = -0.152;
    backB.position.z -= 0.001;
    group.add(tile, iconA, iconB, backA, backB);
    tile.userData.index = i;
    world.add(group);
    return {
      group, tile, color, hover: 0,
      seed: Math.random() * Math.PI * 2,
      speed: 0.35 + Math.random() * 0.35,
      spin: (Math.random() - 0.5) * 0.6,
      base: new THREE.Vector3(),
      push: new THREE.Vector3(),
      scale: 1,
    };
  });

  // Lay tiles out on a loose ellipse around the portrait (desktop) or the whole hero (mobile).
  let visW = 1, visH = 1;
  function layout() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    visW = visH * camera.aspect;
    const wide = w > 900;
    // anchor the ring on the portrait's real position (it sits below the copy on phones)
    const hr = hero.getBoundingClientRect();
    const pr = document.querySelector(".portrait").getBoundingClientRect();
    const pcx = ((pr.left + pr.width / 2 - hr.left) / w - 0.5) * visW;
    const pcy = -((pr.top + pr.height / 2 - hr.top) / h - 0.5) * visH;
    const cx = wide ? visW * 0.24 : pcx;
    const cy = wide ? -visH * 0.02 : pcy;
    const rx = wide ? visW * 0.26 : visW * 0.5;
    const ry = wide ? visH * 0.4 : (pr.height / h) * visH * 0.62;
    const n = tiles.length;
    tiles.forEach((t, i) => {
      // desktop: a 270° arc that opens toward the text column;
      // mobile: a lower arc hugging the sides and base of the portrait, away from the copy
      const a = wide
        ? -Math.PI * 0.72 + (i / (n - 1)) * Math.PI * 1.44 + Math.sin(i * 12.9898) * 0.08
        : -Math.PI * 1.12 + (i / (n - 1)) * Math.PI * 1.24 + Math.sin(i * 12.9898) * 0.05;
      const r = 0.82 + ((i * 7) % 5) * 0.06;
      const z = -2.5 + ((i * 5) % 7) * 0.55;
      let x = cx + Math.cos(a) * rx * r;
      // keep the text column clear-ish on desktop: tiles that land far left get pushed back
      const behindText = wide && x < visW * 0.02;
      t.base.set(behindText ? x - visW * 0.04 : x, cy + Math.sin(a) * ry * r, behindText ? z - 3.5 : z);
      t.scale = (wide ? 1.05 : 0.62) *(behindText ? 0.8 : 1) * (0.85 + ((i * 3) % 4) * 0.08);
    });
  }

  const pointer = new THREE.Vector2(0, 0);
  const target = new THREE.Vector2(0, 0);
  let pointerActive = false;
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    target.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointerActive = true;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => { pointerActive = false; target.set(0, 0); });

  const ray = new THREE.Raycaster();
  const tileMeshes = tiles.map((t) => t.tile);
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  let hovered = -1;

  let scrollP = 0;
  const onScroll = () => { scrollP = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.9))); };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }).observe(hero);

  // Intro: tiles grow in from the centre
  let intro = reduced ? 1 : 0;
  const clock = new THREE.Clock();
  let raf = 0;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    intro = reduced ? 1 : Math.min(1, t * 0.7); // wall-clock based, so slow devices don't drag the intro
    const ease = 1 - Math.pow(1 - intro, 3);

    pointer.lerp(target, 0.06);
    world.rotation.y = pointer.x * 0.18 + scrollP * 0.5;
    world.rotation.x = -pointer.y * 0.12 + scrollP * 0.15;
    world.position.y = scrollP * visH * 0.25;

    // pointer in world space at z=0
    ray.setFromCamera(pointer, camera);
    ray.ray.intersectPlane(planeZ, hit);

    if (pointerActive) {
      ray.setFromCamera(target, camera);
      const hits = ray.intersectObjects(tileMeshes, false);
      hovered = hits.length ? hits[0].object.userData.index : -1;
    } else hovered = -1;
    canvas.style.cursor = hovered >= 0 ? "pointer" : "";

    tiles.forEach((tl, i) => {
      const g = tl.group;
      const bob = reduced ? 0 : Math.sin(t * tl.speed + tl.seed) * 0.22;
      const spread = 1 + scrollP * 0.9;
      const bx = tl.base.x * spread * ease, by = tl.base.y * spread * ease + bob;

      // gentle repel from the cursor
      if (pointerActive) {
        const dx = bx - hit.x, dy = by - hit.y;
        const d = Math.hypot(dx, dy);
        const f = Math.max(0, 1.8 - d) * 0.5;
        tl.push.x += ((d ? dx / d : 0) * f - tl.push.x) * 0.08;
        tl.push.y += ((d ? dy / d : 0) * f - tl.push.y) * 0.08;
      } else {
        tl.push.multiplyScalar(0.92);
      }

      g.position.set(bx + tl.push.x, by + tl.push.y, tl.base.z + scrollP * 2);
      const on = i === hovered;
      tl.hover += ((on ? 1 : 0) - tl.hover) * 0.12;
      tl.color.opacity = tl.hover;
      const s = tl.scale * ease * (1 + tl.hover * 0.18);
      g.scale.setScalar(Math.max(s, 0.0001));

      const idle = reduced ? 0 : t * 0.25 * tl.spin;
      g.rotation.x = Math.sin(t * 0.4 + tl.seed) * 0.25 * (1 - tl.hover) - pointer.y * 0.3;
      g.rotation.y = (Math.cos(t * 0.3 + tl.seed) * 0.35 + idle) * (1 - tl.hover) + pointer.x * 0.35;
      g.rotation.z = Math.sin(t * 0.2 + tl.seed) * 0.1 * (1 - tl.hover);
    });

    canvas.style.opacity = String(1 - scrollP * 0.85);
    renderer.render(scene, camera);
  }

  function loop() {
    cancelAnimationFrame(raf);
    const step = () => {
      if (!visible) return;
      frame();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  layout();
  addEventListener("load", layout);
  document.fonts?.ready.then(layout);
  addEventListener("resize", () => { layout(); if (reduced) frame(); });
  if (reduced) { intro = 1; frame(); }
  loop();
}
