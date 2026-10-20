// Section Musique : covers en boucle infinie, faux 3D (transform CSS uniquement)
const el = document.getElementById("music-strip");
if (el) init();

async function init() {
  let albums = [];
  try { albums = await (await fetch("src/data/albums.json")).json(); } catch {}
  const items = albums.length ? albums
    : Array.from({ length: 16 }, (_, i) => ({ src: null, hue: (i * 47) % 360 })); // carrés de couleur en attendant
  const GAP = 28, n = items.length;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const nodes = items.map((a) => {
    const d = document.createElement("div");
    d.className = "music__item";
    if (a.src) {
      const img = new Image();
      img.src = "public" + a.src; img.alt = a.alt || ""; img.width = img.height = 600;
      img.loading = "lazy"; img.decoding = "async"; img.draggable = false;
      d.appendChild(img);
    } else {
      d.innerHTML = `<div class="music__ph" style="background:linear-gradient(135deg,hsl(${a.hue} 60% 42%),hsl(${a.hue + 40} 60% 16%))"></div>`;
    }
    el.appendChild(d);
    return d;
  });

  let step = 0, vw = 0, pos = 0, vel = 0, raf = 0, last = 0;
  let visible = false, dragging = false, dragX = 0, lastY = scrollY;
  const measure = () => { vw = el.clientWidth; step = nodes[0].offsetWidth + GAP; };

  const frame = (t) => {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(t - last || 16, 50) / 16.67; last = t;
    if (!dragging) {
      pos += ((reduce ? 0 : 0.5) + vel) * dt;
      vel *= Math.pow(0.93, dt);
      if (Math.abs(vel) < 0.01) vel = 0;
    }
    const total = n * step, half = vw / 2;
    for (let i = 0; i < n; i++) {
      const x = ((((i * step - pos) % total) + total) % total) - step;
      const d = Math.max(-1.4, Math.min(1.4, (x + step / 2 - half) / half));
      const ad = Math.abs(d);
      nodes[i].style.transform = `translate3d(${x}px,-50%,${-ad * 140}px) rotateY(${-d * 38}deg) scale(${1 - ad * 0.18})`;
      nodes[i].style.opacity = 1 - ad * 0.4;
    }
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(el);
  new ResizeObserver(measure).observe(el);
  measure();

  addEventListener("scroll", () => {
    const y = scrollY;
    if (visible) vel = Math.max(-40, Math.min(40, vel + (y - lastY) * 0.35));
    lastY = y;
  }, { passive: true });
  el.addEventListener("pointerdown", (e) => { dragging = true; dragX = e.clientX; el.setPointerCapture(e.pointerId); el.classList.add("is-drag"); });
  el.addEventListener("pointermove", (e) => { if (!dragging) return; const dx = e.clientX - dragX; dragX = e.clientX; pos -= dx; vel = -dx * 0.8; });
  const up = () => { dragging = false; el.classList.remove("is-drag"); };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
}
