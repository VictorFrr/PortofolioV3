import { useEffect, useRef } from 'react';
import albums from '../data/albums.json';
import './MusicSection.css';

const GAP = 28;
// Tant que albums.json est vide, on montre des carrés de couleur pour voir l'effet
const placeholders = Array.from({ length: 16 }, (_, i) => ({ src: null, alt: '', hue: (i * 47) % 360 }));

export default function MusicSection() {
  const items = albums.length ? albums : placeholders;
  const root = useRef(null);
  const refs = useRef([]);

  useEffect(() => {
    const el = root.current;
    const n = items.length;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let step = 0, vw = 0, pos = 0, vel = 0, raf = 0, last = 0;
    let visible = false, dragging = false, dragX = 0, lastY = window.scrollY;

    const measure = () => {
      vw = el.clientWidth;
      step = refs.current[0].offsetWidth + GAP;
    };

    const frame = (t) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(t - last || 16, 50) / 16.67;
      last = t;
      if (!dragging) {
        pos += ((reduce ? 0 : 0.5) + vel) * dt; // dérive lente + inertie du scroll
        vel *= Math.pow(0.93, dt);
        if (Math.abs(vel) < 0.01) vel = 0;
      }
      const total = n * step, half = vw / 2;
      for (let i = 0; i < n; i++) {
        const x = ((((i * step - pos) % total) + total) % total) - step; // boucle infinie
        const d = Math.max(-1.4, Math.min(1.4, (x + step / 2 - half) / half));
        const ad = Math.abs(d);
        const node = refs.current[i];
        node.style.transform =
          `translate3d(${x}px,-50%,${-ad * 140}px) rotateY(${-d * 38}deg) scale(${1 - ad * 0.18})`;
        node.style.opacity = 1 - ad * 0.4;
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => { if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); });
    const ro = new ResizeObserver(measure);
    io.observe(el); ro.observe(el); measure();

    // Le scroll de la page pousse les covers (pas de blocage de la molette)
    const onScroll = () => {
      const y = window.scrollY;
      if (visible) vel = Math.max(-40, Math.min(40, vel + (y - lastY) * 0.35));
      lastY = y;
    };
    const down = (e) => { dragging = true; dragX = e.clientX; el.setPointerCapture(e.pointerId); el.classList.add('is-drag'); };
    const move = (e) => { if (!dragging) return; const dx = e.clientX - dragX; dragX = e.clientX; pos -= dx; vel = -dx * 0.8; };
    const up = () => { dragging = false; el.classList.remove('is-drag'); };

    window.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [items]);

  return (
    <section id="music" className="music" ref={root} aria-label="Musique">
      {items.map((a, i) => (
        <div key={a.src || i} className="music__item" ref={(node) => (refs.current[i] = node)}>
          {a.src ? (
            <img src={a.src} alt={a.alt} width="600" height="600" draggable={false} loading="lazy" decoding="async" />
          ) : (
            <div className="music__ph" style={{ background: `linear-gradient(135deg,hsl(${a.hue} 60% 42%),hsl(${a.hue + 40} 60% 16%))` }} />
          )}
        </div>
      ))}
    </section>
  );
}
