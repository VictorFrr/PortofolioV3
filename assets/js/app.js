import { REV, ME, SPECS, PROJECTS, EDU, EXP, STACK, HOBBIES, COUNTRIES } from "./content.js";
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

$("#doc-ref").textContent = `DATASHEET · VF-42 · RÉV. ${REV}`;
$("#tagline").textContent = ME.tagline;
$("#bio").textContent = ME.bio;
$("#chips").innerHTML = ME.chips.map((c, i) => `<li${i === 0 ? ' class="hot"' : ""}>${esc(c)}</li>`).join("");
$("#specs-list").innerHTML = SPECS.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");

$("#parts-list").innerHTML = PROJECTS.map((p) => `
  <details class="part" data-r>
    <summary><span class="mono id">${esc(p.id)}</span><span class="t">${esc(p.title)}</span><span class="mono kind">${esc(p.kind)}</span><i></i></summary>
    <div class="pb"><p>${esc(p.short)}</p><ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
    <div class="tags">${p.tech.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
    <div class="plinks">${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">Code ↗</a>` : ""}${p.demo ? `<a href="${esc(p.demo)}" target="_blank" rel="noopener">Démo ↗</a>` : ""}</div></div>
  </details>`).join("");

const rows = (a) => a.map((r) => `<div class="row${r.hot ? " hot" : ""}" data-r><span class="mono when">${esc(r.when)}</span><div><b>${esc(r.what)}</b>${r.note ? `<small>${esc(r.note)}</small>` : ""}</div></div>`).join("");
$("#edu").innerHTML = rows(EDU);
$("#exp").innerHTML = rows(EXP);
$("#stack").innerHTML = STACK.map(([g, t]) => `<div class="grp" data-r><h4 class="mono">${esc(g)}</h4><div class="tags">${t.map((x) => `<span>${esc(x)}</span>`).join("")}</div></div>`).join("");
$("#hobbies").innerHTML = HOBBIES.map(([g, t]) => `<div class="grp" data-r><h4 class="mono">${esc(g)}</h4><div class="tags">${t.map((x) => `<span>${esc(x)}</span>`).join("")}</div></div>`).join("");
$("#countries").innerHTML = COUNTRIES.map((c) => `<li>${esc(c)}</li>`).join("");
$("#links").innerHTML = ME.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} <span>↗</span></a>`).join("");
$("#yr").textContent = new Date().getFullYear();
$("#rev-n").textContent = REV;

// Apparition au scroll
const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.1 }) : null;
document.querySelectorAll("[data-r]").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

// Puce 3D qui suit la souris
const chip = $("#chip");
if (chip && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let tx = 0, ty = 0, x = 0, y = 0;
  addEventListener("pointermove", (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; });
  (function loop() {
    x += (tx - x) * 0.08; y += (ty - y) * 0.08;
    chip.style.transform = `rotateX(${58 - y * 26}deg) rotateZ(${-38 + x * 40}deg)`;
    requestAnimationFrame(loop);
  })();
}
