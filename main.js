// ============================================================
//  MAIN.JS — App logic (i18n render, interactions, theme)
// ============================================================
(function(){
  "use strict";

  let LANG = localStorage.getItem("lang") || (navigator.language||"fr").slice(0,2);
  if (LANG !== "fr" && LANG !== "en") LANG = "fr";

  const $ = (sel, ctx) => (ctx||document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx||document).querySelectorAll(sel));

  function t(){ return TRANSLATIONS[LANG]; }

  function safe(fn, label){
    try { fn(); } catch(err) { console.error("Render block failed:", label, err); }
  }

  /* ---------------- THEME ---------------- */
  function initTheme(){
    const saved = localStorage.getItem("theme");
    const theme = saved || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
  }
  function toggleTheme(){
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateThemeIcon(next);
    window.dispatchEvent(new CustomEvent("themechange", { detail:{ theme:next } }));
  }
  function updateThemeIcon(theme){
    const btn = $("#theme-toggle");
    if(!btn) return;
    btn.innerHTML = theme === "dark" ? iconSun() : iconMoon();
    btn.setAttribute("aria-label", theme === "dark" ? t().theme.light : t().theme.dark);
  }
  function iconSun(){ return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke-linecap="round"/></svg>`; }
  function iconMoon(){ return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>`; }

  /* ---------------- LANG ---------------- */
  function setLang(lang){
    LANG = lang;
    localStorage.setItem("lang", lang);
    document.documentElement.setAttribute("lang", lang);
    render();
  }

  /* ---------------- RENDER ---------------- */
  function render(){
    const d = t();

    safe(() => {
      // nav
      $("#nav-skills").textContent = d.nav.skills;
      $("#nav-projects").textContent = d.nav.projects;
      $("#nav-about").textContent = d.nav.about;
      $("#nav-contact").textContent = d.nav.contact;
      $("#lang-btn").textContent = LANG.toUpperCase();
    }, "nav");

    safe(() => {
      // hero
      $("#hero-tag").textContent = d.hero.tag;
      $("#hero-greet").textContent = d.hero.greeting;
      $("#hero-name").textContent = d.hero.name;
      $("#hero-sub").textContent = d.hero.sub;
      $("#hero-cta-projects").textContent = d.hero.cta_projects;
      $("#hero-cta-contact").textContent = d.hero.cta_contact;
      $("#scroll-label").textContent = d.hero.scroll;
    }, "hero");

    safe(() => {
      // stats
      $("#stat-projects-label").textContent = d.stats.projects;
      $("#stat-langs-label").textContent = d.stats.langs;
      $("#stat-years-label").textContent = d.stats.years;
      $("#stat-consoles-label").textContent = d.stats.consoles;
    }, "stats");

    safe(() => {
      // skills
      $("#skills-eyebrow").textContent = d.skills.eyebrow;
      $("#skills-title").textContent = d.skills.title;
      renderSkills(d);
    }, "skills");

    safe(() => {
      // projects
      $("#projects-eyebrow").textContent = d.projects.eyebrow;
      $("#projects-title").textContent = d.projects.title;
      renderProjects(d);
    }, "projects");

    safe(() => {
      // about
      $("#about-eyebrow").textContent = d.about.eyebrow;
      $("#about-title").textContent = d.about.title;
      $("#about-lead").textContent = d.about.lead;
      $("#about-sub").textContent = d.about.sub;
      renderCountries();
      $("#about-cooking-title").textContent = d.about.cooking.title;
      $("#about-cooking-desc").textContent = d.about.cooking.desc;
      $("#about-cinema-title").textContent = d.about.cinema.title;
      $("#about-cinema-desc").textContent = d.about.cinema.desc;
      $("#about-cinema-fav1").textContent = d.about.cinema.fav1;
      $("#about-cinema-fav2").textContent = d.about.cinema.fav2;
      $("#about-sport-title").textContent = d.about.sport.title;
      $("#about-sport-desc").textContent = d.about.sport.desc;
    }, "about");

    safe(() => {
      // contact
      $("#contact-eyebrow").textContent = d.contact.eyebrow;
      $("#contact-heading").textContent = d.contact.heading;
      $("#contact-sub").textContent = d.contact.sub;
      $("#label-name").textContent = d.contact.name;
      $("#label-email").textContent = d.contact.email;
      $("#label-message").textContent = d.contact.message;
      $("#input-name").placeholder = d.contact.name_ph;
      $("#input-email").placeholder = d.contact.email_ph;
      $("#input-message").placeholder = d.contact.msg_ph;
      $("#submit-btn").textContent = d.contact.send;
      $("#availability-label").textContent = (LANG==="fr" ? "Disponible pour stage / alternance" : "Available for internship / apprenticeship");
    }, "contact");

    safe(() => {
      // footer
      $("#footer-copy").textContent = d.footer.copy;
      $("#footer-back-label").textContent = d.footer.back_top;
    }, "footer");

    safe(() => {
      updateThemeIcon(document.documentElement.getAttribute("data-theme") || "dark");
    }, "theme-icon");
  }

  function renderSkills(d){
    const grid = $("#skills-grid");
    grid.innerHTML = d.skills.categories.map(cat => `
      <div class="skill-card" data-reveal>
        <h3>${cat.name}</h3>
        <div class="tag-list">
          ${cat.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
        </div>
      </div>
    `).join("");
    observeReveals();
  }

  function renderProjects(d){
    const list = $("#projects-list");
    list.innerHTML = PROJECTS.map((p, i) => {
      const c = p[LANG];
      return `
        <div class="project-row" data-reveal data-index="${i}" tabindex="0" role="button" aria-label="${c.title}">
          <div class="row-num">${p.num}</div>
          <div class="row-main">
            <div class="row-title">${c.title}</div>
            <div class="row-short">${c.short}</div>
          </div>
          <div class="row-tech">
            ${c.tech.slice(0,3).map(tc => `<span>${tc}</span>`).join("")}
          </div>
          <div class="row-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 19 19 5M9 5h10v10" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>
      `;
    }).join("");
    $$(".project-row", list).forEach(row => {
      row.addEventListener("click", () => openModal(parseInt(row.dataset.index,10)));
      row.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); openModal(parseInt(row.dataset.index,10)); } });
    });
    observeReveals();
  }

  function renderCountries(){
    const wrap = $("#country-list");
    wrap.innerHTML = COUNTRIES.map(c => `<span class="country-tag">${c.flag} ${c[LANG]}</span>`).join("");
  }

  /* ---------------- MODAL ---------------- */
  function openModal(index){
    const p = PROJECTS[index];
    const c = p[LANG];
    const d = t();
    $("#modal-num").textContent = `${p.num} / ${String(PROJECTS.length).padStart(2,"0")}`;
    $("#modal-title").textContent = c.title;
    $("#modal-github").href = p.github;
    $("#modal-github").style.display = p.github ? "inline-flex" : "none";
    $("#modal-demo").href = p.demo || "#";
    $("#modal-demo").style.display = p.demo ? "inline-flex" : "none";
    $("#modal-label-context").textContent = d.projects.context;
    $("#modal-context").textContent = c.context;
    $("#modal-label-features").textContent = d.projects.features;
    $("#modal-features").innerHTML = c.features.map(f => `<li>${f}</li>`).join("");
    $("#modal-label-tech").textContent = d.projects.tech;
    $("#modal-tech").innerHTML = c.tech.map(tc => `<span class="tag">${tc}</span>`).join("");
    $("#modal-backdrop").classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeModal(){
    $("#modal-backdrop").classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---------------- REVEAL ON SCROLL ---------------- */
  let revealObserver;
  function observeReveals(){
    if (typeof IntersectionObserver === "undefined") {
      // No IO support: just show everything immediately, no animation.
      $$("[data-reveal]").forEach(el => el.classList.add("in"));
      return;
    }
    if(!revealObserver){
      revealObserver = new IntersectionObserver(entries => {
        entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add("in"); revealObserver.unobserve(e.target); } });
      }, { threshold: 0.12 });
    }
    $$("[data-reveal]").forEach(el => { if(!el.classList.contains("in")) revealObserver.observe(el); });
  }

  /* ---------------- NAV SCROLL STATE ---------------- */
  function initNavScroll(){
    const nav = $("#nav");
    function onScroll(){
      if(window.scrollY > 40) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive:true });
    onScroll();
  }

  /* ---------------- CONTACT FORM ---------------- */
  function initForm(){
    const form = $("#contact-form");
    if(!form) return;
    form.addEventListener("submit", function(e){
      e.preventDefault();
      const msgEl = $("#form-msg");
      const d = t();
      const action = form.getAttribute("action");
      if(!action || action.includes("YOUR_FORM_ID")){
        msgEl.textContent = d.contact.error;
        msgEl.className = "form-msg err";
        return;
      }
      const data = new FormData(form);
      msgEl.textContent = "...";
      msgEl.className = "form-msg";
      fetch(action, { method:"POST", body:data, headers:{ "Accept":"application/json" } })
        .then(r => {
          if(r.ok){ msgEl.textContent = d.contact.success; msgEl.className = "form-msg ok"; form.reset(); }
          else { msgEl.textContent = d.contact.error; msgEl.className = "form-msg err"; }
        })
        .catch(() => { msgEl.textContent = d.contact.error; msgEl.className = "form-msg err"; });
    });
  }

  /* ---------------- INIT ---------------- */
  function init(){
    document.documentElement.setAttribute("lang", LANG);
    safe(initTheme, "initTheme");
    safe(render, "render");
    safe(initNavScroll, "initNavScroll");
    safe(initForm, "initForm");

    safe(() => {
      $("#theme-toggle").addEventListener("click", toggleTheme);
      $("#lang-btn").addEventListener("click", () => setLang(LANG === "fr" ? "en" : "fr"));
      $("#modal-close").addEventListener("click", closeModal);
      $("#modal-backdrop").addEventListener("click", e => { if(e.target.id === "modal-backdrop") closeModal(); });
      document.addEventListener("keydown", e => { if(e.key === "Escape") closeModal(); });
    }, "controls");

    safe(() => {
      $$('a[href^="#"]').forEach(a => {
        a.addEventListener("click", e => {
          const id = a.getAttribute("href");
          if(id.length > 1){
            const target = $(id);
            if(target){ e.preventDefault(); target.scrollIntoView({ behavior:"smooth" }); }
          }
        });
      });
    }, "anchor-links");

    safe(animateCounters, "animateCounters");

    window.addEventListener("load", () => {
      setTimeout(() => { const l = $("#loader"); if(l) l.classList.add("hidden"); }, 300);
    });
    setTimeout(() => { const l = $("#loader"); if(l) l.classList.add("hidden"); }, 2500);
  }

  function animateCounters(){
    const targets = { "stat-projects-num": 10, "stat-langs-num": 6, "stat-years-num": 3, "stat-consoles-num": 15 };

    if (typeof IntersectionObserver === "undefined") {
      Object.keys(targets).forEach(id => { const el = document.getElementById(id); if(el) el.textContent = targets[id] + "+"; });
      return;
    }

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const el = entry.target;
          const end = targets[el.id];
          let cur = 0;
          const step = Math.max(1, Math.round(end/30));
          const iv = setInterval(() => {
            cur += step;
            if(cur >= end){ cur = end; clearInterval(iv); }
            el.textContent = cur + "+";
          }, 30);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    Object.keys(targets).forEach(id => { const el = document.getElementById(id); if(el) obs.observe(el); });
  }

  document.addEventListener("DOMContentLoaded", function(){
    try {
      init();
    } catch (err) {
      console.error("Init error:", err);
      const l = document.getElementById("loader");
      if (l) l.classList.add("hidden");
    }
  });
})();
