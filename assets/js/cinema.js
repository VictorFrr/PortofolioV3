// Section Cinéma : carrousel 3D (coverflow) de mes films notés 5★ sur Letterboxd.
// Données : data/films.json — affiches : assets/posters/<slug>.jpg
const reel = document.getElementById("reel");
if (reel) init();

async function init() {
  let films = [];
  try { films = (await (await fetch("data/films.json")).json()).filter((f) => f.rating === 5); } catch {}
  if (!films.length) { document.getElementById("cinema").hidden = true; return; }

  const n = films.length;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cap = document.getElementById("reel-cap");
  const capTitle = cap.querySelector(".reel__title");
  const capMeta = cap.querySelector(".reel__meta");
  const capLink = cap.querySelector(".reel__link");
  const mod = (a, m) => ((a % m) + m) % m;

  const nodes = films.map((f) => {
    const d = document.createElement("div");
    d.className = "reel__item";
    const ph = document.createElement("span");
    ph.textContent = f.title;
    const img = new Image();
    img.src = `assets/posters/${f.slug}.jpg`; img.alt = `${f.title} (${f.year})`;
    img.width = 500; img.height = 750; img.decoding = "async"; img.draggable = false;
    img.onerror = () => img.remove();
    d.append(ph, img);
    reel.appendChild(d);
    return d;
  });

  // pos = position (flottante) du film au centre ; target = position visée
  let pos = reduce ? 0 : -2.6, target = 0, w = 0, shown = -1;
  let raf = 0, last = 0, visible = false, hover = false, dragging = false, started = reduce;
  let dragX = 0, dragPos = 0, moved = 0;

  const measure = () => { w = nodes[0].offsetWidth; draw(); };

  function draw() {
    for (let i = 0; i < n; i++) {
      const d = mod(i - pos + n / 2, n) - n / 2;      // écart au centre, dans [-n/2, n/2)
      const ad = Math.abs(d), s = Math.sign(d);
      const x = s * w * (0.68 * Math.min(ad, 1) + 0.3 * Math.max(0, Math.min(ad, 3) - 1));
      const z = -Math.min(ad, 3) * 120;
      const ry = -s * Math.min(ad, 1) * 50;
      const sc = 1 - Math.min(ad, 2) * 0.09;
      const op = ad <= 1.2 ? 1 : Math.max(0, 1 - (ad - 1.2) * 0.55);
      const el = nodes[i];
      el.style.transform = `translate3d(${x}px,0,${z}px) rotateY(${ry}deg) scale(${sc})`;
      el.style.opacity = op;
      el.style.zIndex = 100 - Math.round(ad * 10);
      el.style.pointerEvents = op < 0.05 ? "none" : "auto";
      el.style.filter = ad < 0.5 ? "none" : `brightness(${1 - Math.min(ad, 2) * 0.16})`;
    }
    const idx = mod(Math.round(pos), n);
    if (idx !== shown) {
      shown = idx;
      const f = films[idx];
      capTitle.textContent = f.title;
      capMeta.textContent = `${f.year} · ★★★★★`;
      capLink.href = f.uri;
    }
  }

  function frame(t) {
    raf = 0;
    const dt = Math.min(t - last || 16, 50) / 16.67; last = t;
    if (!dragging) {
      pos += (target - pos) * (1 - Math.pow(0.88, dt));
      if (Math.abs(target - pos) < 0.001) pos = target;
    }
    draw();
    if (dragging || pos !== target) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const go = (k) => { target = Math.round(target) + k; kick(); };

  // Boutons, clavier
  document.getElementById("reel-prev").onclick = () => go(-1);
  document.getElementById("reel-next").onclick = () => go(1);
  reel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
  });

  // Glisser (souris / tactile), sans pointer-capture pour garder les clics sur les affiches
  reel.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    dragging = true; moved = 0; dragX = e.clientX; dragPos = pos; reel.classList.add("is-drag"); kick();
    const move = (ev) => {
      const dx = ev.clientX - dragX; moved = Math.max(moved, Math.abs(dx));
      pos = dragPos - dx / (w * 0.68); target = pos;
    };
    const up = () => {
      removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up);
      dragging = false; reel.classList.remove("is-drag"); target = Math.round(pos); kick();
    };
    addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
  });

  // Clic : l'affiche du centre ouvre Letterboxd, une affiche sur le côté vient au centre
  nodes.forEach((el, i) => el.addEventListener("click", () => {
    if (moved > 6) return;
    const c = Math.round(pos), rel = mod(i - c + n / 2, n) - n / 2;
    if (rel === 0) window.open(films[i].uri, "_blank", "noopener");
    else { target = c + rel; kick(); }
  }));

  // Défilement automatique quand la section est visible (pas si reduced-motion)
  setInterval(() => {
    if (!reduce && visible && started && !hover && !dragging && !document.hidden) go(1);
  }, 3800);
  reel.addEventListener("pointerenter", () => (hover = true));
  reel.addEventListener("pointerleave", () => (hover = false));
  reel.addEventListener("focusin", () => (hover = true));
  reel.addEventListener("focusout", () => (hover = false));

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !started) { started = true; target = 0; kick(); }   // entrée : l'affiche glisse jusqu'au centre
  }, { threshold: 0.35 }).observe(reel);
  new ResizeObserver(measure).observe(reel);
  measure();
}
