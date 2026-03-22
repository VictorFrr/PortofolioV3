/* ============================================================
   MAIN.JS — Victor Ponthus Portfolio
   i18n | Theme | Render | Modal | Scroll | Form
   ============================================================ */

// ── STATE ────────────────────────────────────────────────────
let currentLang  = localStorage.getItem('lang')  || 'fr';
let currentTheme = localStorage.getItem('theme') || 'dark';

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(currentTheme);
  applyLang(currentLang);
  renderSkills();
  renderProjects();
  initNavbar();
  initHamburger();
  initLangSwitcher();
  initThemeToggle();
  initScrollReveal();
  initModal();
  initContactForm();
});

// ── THEME ────────────────────────────────────────────────────
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function initThemeToggle() {
  document.getElementById('themeBtn').addEventListener('click', () => {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });
}

// ── i18n ─────────────────────────────────────────────────────
function t(key) {
  const keys = key.split('.');
  let val = TRANSLATIONS[currentLang];
  for (const k of keys) val = val?.[k];
  return val ?? key;
}

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // Update lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Update data-i18n text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });

  // Re-render dynamic sections
  renderSkills();
  renderProjects();

  // Update html lang
  document.documentElement.lang = lang;
}

function initLangSwitcher() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });
}

// ── RENDER SKILLS ────────────────────────────────────────────
function renderSkills() {
  const grid = document.getElementById('skillsGrid');
  const cats = t('skills.categories');
  grid.innerHTML = cats.map(cat => `
    <div class="skill-category reveal">
      <h3 class="cat-title"><span class="cat-icon">⬡</span> ${cat.name}</h3>
      <div class="skill-tags">
        ${cat.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>
  `).join('');
  // re-observe new elements
  grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ── RENDER PROJECTS ──────────────────────────────────────────
const GH_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`;
const EXT_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  const detailsLabel = t('projects.details');

  grid.innerHTML = PROJECTS.map(p => {
    const data = p[currentLang];
    const links = [
      p.github ? `<a href="${p.github}" target="_blank" rel="noopener" title="GitHub" onclick="event.stopPropagation()">${GH_SVG}</a>` : '',
      p.demo   ? `<a href="${p.demo}"   target="_blank" rel="noopener" title="Demo"   onclick="event.stopPropagation()">${EXT_SVG}</a>` : '',
    ].join('');

    return `
      <article class="project-card reveal" data-id="${p.id}">
        <div class="card-image">
          <img src="${p.image}" alt="${data.title}" loading="lazy" />
          <div class="card-image-overlay"><span>${detailsLabel} →</span></div>
        </div>
        <div class="card-body">
          <div class="card-top">
            <div class="card-number">${p.num}</div>
            <div class="card-links">${links}</div>
          </div>
          <h3 class="card-title">${data.title}</h3>
          <p class="card-desc">${data.short}</p>
          <div class="card-tech">${data.tech.map(t => `<span>${t}</span>`).join('')}</div>
        </div>
      </article>
    `;
  }).join('');

  // Observe + click
  grid.querySelectorAll('.project-card').forEach(card => {
    revealObserver.observe(card);
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

// ── NAVBAR ───────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);

    // Active link
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 140) current = s.id;
    });
    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }, { passive: true });
}

// ── HAMBURGER ────────────────────────────────────────────────
function initHamburger() {
  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobileMenu');

  hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  document.querySelectorAll('.mob-link').forEach(l =>
    l.addEventListener('click', () => mobileMenu.classList.remove('open'))
  );
}

// ── SCROLL REVEAL ────────────────────────────────────────────
let revealObserver;

function initScrollReveal() {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 70);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ── MODAL ────────────────────────────────────────────────────
function initModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
  closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

function openModal(id) {
  const p = PROJECTS.find(p => p.id === id);
  if (!p) return;
  const data = p[currentLang];
  const T    = TRANSLATIONS[currentLang].projects;

  // Image
  document.getElementById('modalImage').src = p.image;
  document.getElementById('modalImage').alt = data.title;

  // Header
  document.getElementById('modalNum').textContent = p.num;

  // Actions
  const actionsEl = document.getElementById('modalActions');
  actionsEl.innerHTML = [
    p.github ? `<a href="${p.github}" target="_blank" rel="noopener">${GH_SVG} ${T.github}</a>` : '',
    p.demo   ? `<a href="${p.demo}"   target="_blank" rel="noopener">${EXT_SVG} ${T.demo}</a>`   : '',
  ].join('');

  document.getElementById('modalTitle').textContent = data.title;

  // Context
  document.getElementById('modalContextLabel').textContent  = T.context;
  document.getElementById('modalContext').textContent       = data.context;

  // Features
  document.getElementById('modalFeaturesLabel').textContent = T.features;
  document.getElementById('modalFeatures').innerHTML        =
    data.features.map(f => `<li>${f}</li>`).join('');

  // Tech
  document.getElementById('modalTechLabel').textContent = T.tech;
  document.getElementById('modalTech').innerHTML        =
    data.tech.map(t => `<span>${t}</span>`).join('');

  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── CONTACT FORM ─────────────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = '...';

    // ← Replace with your Formspree endpoint
    const ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';
    const T = TRANSLATIONS[currentLang].contact;

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
      // Fallback: open mail client
      const subject = encodeURIComponent('Portfolio contact');
      const body    = encodeURIComponent(payload.message);
      window.location.href = `mailto:victor.ponthus@gmail.com?subject=${subject}&body=${body}`;
      note.textContent = T.error;
      note.style.color = 'var(--text-muted)';
    }

    btn.textContent = T.send;
    btn.disabled    = false;
  });
}
