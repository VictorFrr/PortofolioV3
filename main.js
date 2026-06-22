/* ============================================================
   MAIN.JS — Victor Ponthus Portfolio v3
   ============================================================ */

let currentLang  = localStorage.getItem('lang')  || 'fr';
let currentTheme = localStorage.getItem('theme') || 'dark';
let revealObserver = null;

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(currentTheme);
  initScrollReveal();
  renderSkills();
  renderProjects();
  applyLang(currentLang);
  initNavbar();
  initHamburger();
  initLangSwitcher();
  initThemeToggle();
  initModal();
  initContactForm();
  initScrollProgress();
  initTypingEffect();
  initCounters();
  document.querySelectorAll('.reveal').forEach(el => observeReveal(el));
});

/* ── THEME ─────────────────────────────────────────────────── */
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
}
function initThemeToggle() {
  const btn = document.getElementById('themeBtn');
  if (btn) btn.addEventListener('click', () => applyTheme(currentTheme === 'dark' ? 'light' : 'dark'));
}

/* ── i18n ──────────────────────────────────────────────────── */
function tr(key) {
  const keys = key.split('.');
  let val = TRANSLATIONS[currentLang];
  for (const k of keys) { if (!val) return key; val = val[k]; }
  return val ?? key;
}
function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.lang === lang));
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = tr(el.dataset.i18n);
    if (v !== el.dataset.i18n) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const v = tr(el.dataset.i18nPh);
    if (v) el.placeholder = v;
  });
  renderSkills();
  renderProjects();
}
function initLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      if (btn.dataset.lang !== currentLang) applyLang(btn.dataset.lang);
    }));
}

/* ── SCROLL REVEAL ─────────────────────────────────────────── */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      const isCard = entry.target.classList.contains('project-card')
                  || entry.target.classList.contains('skill-category');
      setTimeout(() => entry.target.classList.add('visible'), isCard ? i * 60 : 0);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });
}
function observeReveal(el) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight) el.classList.add('visible');
  else if (revealObserver) revealObserver.observe(el);
  else el.classList.add('visible');
}

/* ── RENDER SKILLS ─────────────────────────────────────────── */
function renderSkills() {
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;
  const cats = TRANSLATIONS[currentLang].skills.categories;
  grid.innerHTML = cats.map(cat => `
    <div class="skill-category reveal">
      <h3 class="cat-title"><span class="cat-icon">⬡</span> ${cat.name}</h3>
      <div class="skill-tags">${cat.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </div>`).join('');
  grid.querySelectorAll('.reveal').forEach(el => observeReveal(el));
}

/* ── RENDER PROJECTS ───────────────────────────────────────── */
const GH_SVG  = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`;
const EXT_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;
  const lbl = TRANSLATIONS[currentLang].projects.details;
  const MAX_TECH = 3;
  grid.innerHTML = PROJECTS.map(p => {
    const d = p[currentLang];
    const visibleTech = d.tech.slice(0, MAX_TECH);
    const extra = d.tech.length - MAX_TECH;
    const links = [
      p.github ? `<a href="${p.github}" target="_blank" rel="noopener" title="GitHub" onclick="event.stopPropagation()">${GH_SVG}</a>` : '',
      p.demo   ? `<a href="${p.demo}"   target="_blank" rel="noopener" title="Demo"   onclick="event.stopPropagation()">${EXT_SVG}</a>` : '',
    ].join('');
    return `
      <article class="project-card reveal" data-id="${p.id}" tabindex="0" role="button" aria-label="${d.title}">
        <div class="card-image">
          <img src="${p.image}" alt="${d.title}" loading="lazy"/>
          <div class="card-image-overlay"><span>${lbl} →</span></div>
        </div>
        <div class="card-body">
          <div class="card-top">
            <div class="card-number">${p.num}</div>
            <div class="card-links">${links}</div>
          </div>
          <h3 class="card-title">${d.title}</h3>
          <p class="card-desc">${d.short}</p>
          <div class="card-tech">
            ${visibleTech.map(t => `<span>${t}</span>`).join('')}
            ${extra > 0 ? `<span class="more">+${extra}</span>` : ''}
          </div>
        </div>
      </article>`;
  }).join('');
  grid.querySelectorAll('.project-card').forEach(card => {
    observeReveal(card);
    card.addEventListener('click', () => openModal(card.dataset.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.dataset.id); }
    });
  });
}

/* ── NAVBAR ────────────────────────────────────────────────── */
function initNavbar() {
  const navbar   = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    let cur = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 160) cur = s.id; });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${cur}`));
  }, { passive: true });
}

/* ── HAMBURGER ─────────────────────────────────────────────── */
function initHamburger() {
  const h = document.getElementById('hamburger');
  const m = document.getElementById('mobileMenu');
  if (!h || !m) return;
  h.addEventListener('click', () => { h.classList.toggle('open'); m.classList.toggle('open'); });
  document.querySelectorAll('.mob-link').forEach(l =>
    l.addEventListener('click', () => { m.classList.remove('open'); h.classList.remove('open'); }));
}

/* ── MODAL ─────────────────────────────────────────────────── */
function initModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  if (!overlay || !closeBtn) return;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}
function openModal(id) {
  const p = PROJECTS.find(x => x.id === id);
  if (!p) return;
  const d = p[currentLang];
  const T = TRANSLATIONS[currentLang].projects;
  document.getElementById('modalImage').src                 = p.image;
  document.getElementById('modalImage').alt                 = d.title;
  document.getElementById('modalNum').textContent           = p.num;
  document.getElementById('modalTitle').textContent         = d.title;
  document.getElementById('modalContextLabel').textContent  = T.context;
  document.getElementById('modalContext').textContent       = d.context;
  document.getElementById('modalFeaturesLabel').textContent = T.features;
  document.getElementById('modalFeatures').innerHTML        = d.features.map(f => `<li>${f}</li>`).join('');
  document.getElementById('modalTechLabel').textContent     = T.tech;
  document.getElementById('modalTech').innerHTML            = d.tech.map(t => `<span>${t}</span>`).join('');
  document.getElementById('modalActions').innerHTML         = [
    p.github ? `<a href="${p.github}" target="_blank" rel="noopener">${GH_SVG} ${T.github}</a>` : '',
    p.demo   ? `<a href="${p.demo}"   target="_blank" rel="noopener">${EXT_SVG} ${T.demo}</a>`   : '',
  ].join('');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── CONTACT FORM ──────────────────────────────────────────── */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (!form || !note) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn      = form.querySelector('button[type="submit"]');
    const T        = TRANSLATIONS[currentLang].contact;
    const ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

    btn.disabled    = true;
    btn.textContent = '...';

    const payload = {
      name:    document.getElementById('fname').value,
      email:   document.getElementById('femail').value,
      message: document.getElementById('fmessage').value,
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        note.textContent = T.success;
        note.style.color = 'var(--accent)';
        form.reset();
      } else throw new Error();
    } catch {
      const sub  = encodeURIComponent('Contact depuis portfolio');
      const body = encodeURIComponent(`Nom: ${payload.name}\nEmail: ${payload.email}\n\n${payload.message}`);
      window.open(`mailto:victor.ponthus@gmail.com?subject=${sub}&body=${body}`);
      note.textContent = T.error;
      note.style.color = 'var(--ink-mute)';
    }

    btn.textContent = T.send;
    btn.disabled    = false;
  });
}

/* ── SCROLL PROGRESS ───────────────────────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
}

/* ── TYPING EFFECT ─────────────────────────────────────────── */
function initTypingEffect() {
  const el = document.getElementById('typedName');
  if (!el) return;
  const text = 'Victor Ponthus';
  let i = 0;
  const fullWidth = el.offsetWidth;
  if (fullWidth > 0) el.style.minWidth = fullWidth + 'px';
  el.innerHTML = '<span class="typed-cursor"></span>';
  function type() {
    if (i < text.length) {
      el.innerHTML = text.slice(0, ++i) + '<span class="typed-cursor"></span>';
      setTimeout(type, 70 + Math.random() * 40);
    }
  }
  setTimeout(type, 700);
}

/* ── COUNTERS ──────────────────────────────────────────────── */
function initCounters() {
  const nums = document.querySelectorAll('.stat-num[data-count]');
  if (!nums.length || !('IntersectionObserver' in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const dur    = 1400;
      const start  = performance.now();
      (function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const e = 1 - Math.pow(2, -10 * p);
        el.textContent = Math.round(e * target);
        if (p < 1) requestAnimationFrame(tick);
      })(start);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  nums.forEach(el => obs.observe(el));
}
