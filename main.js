/* =============================================
   NAVBAR SCROLL
   ============================================= */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

/* =============================================
   HAMBURGER MENU
   ============================================= */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

document.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* =============================================
   SCROLL REVEAL
   ============================================= */
const revealEls = document.querySelectorAll(
  '.skill-category, .project-card, .contact-text, .contact-form, .section-header'
);

revealEls.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => observer.observe(el));

/* =============================================
   CONTACT FORM (Formspree ready)
   ============================================= */
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = form.querySelector('button[type="submit"]');
  btn.textContent = 'Envoi en cours...';
  btn.disabled = true;

  // Pour activer l'envoi réel, remplace l'URL ci-dessous par ton endpoint Formspree :
  // https://formspree.io/f/XXXXXXXX
  const FORMSPREE_URL = 'https://formspree.io/f/xpqyeegr';

  const data = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value,
  };

  try {
    const res = await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      note.textContent = '✓ Message envoyé ! Je te réponds bientôt.';
      note.style.color = 'var(--accent)';
      form.reset();
    } else {
      throw new Error();
    }
  } catch {
    // Fallback : ouvre le client mail
    note.textContent = 'Configure Formspree ou utilise le lien mail ci-dessous.';
    note.style.color = 'var(--text-muted)';
    window.location.href = `mailto:ton@email.com?subject=Message depuis le portfolio&body=${encodeURIComponent(data.message)}`;
  }

  btn.textContent = 'Envoyer le message';
  btn.disabled = false;
});

/* =============================================
   ACTIVE NAV HIGHLIGHT ON SCROLL
   ============================================= */
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
  });
  navAnchors.forEach(a => {
    a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--accent)' : '';
  });
});
