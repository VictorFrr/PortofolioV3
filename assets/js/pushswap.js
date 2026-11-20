// ===========================================================
//  PUSH_SWAP — démo interactive (section #pushswap)
//  Piles a / b dessinées dans un <canvas>, code C affiché façon gdb.
//  Le moteur (pushswap-engine.js) rejoue ton algorithme ; ici on ne fait
//  que naviguer dans cette trace : avancer, reculer, lecture, points d'arrêt.
// ===========================================================
import { SOURCE, SOURCE_FILE, trace } from "./pushswap-engine.js";

const $ = (s, r = document) => r.querySelector(s);
const root = $("#ps");

const MAXN = 100; // au-delà, la trace devient trop lourde pour un navigateur
const DEFAULT_N = 40;
const SPEEDS = [400, 220, 120, 70, 40, 20, 8, 0]; // ms par opération (0 = le plus vite possible)
const DEFAULT_SPEED = 4;
const OPS = ["pa", "pb", "ra", "rb", "rrb"]; // les seules opérations utilisées par medium
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (root) init();

function init() {
  const el = {
    n: $("#ps-n"), nOut: $("#ps-n-out"), shuffle: $("#ps-shuffle"),
    form: $("#ps-form"), input: $("#ps-input"), msg: $("#ps-msg"),
    speed: $("#ps-speed"), play: $("#ps-play"),
    state: $("#ps-state"), cv: $("#ps-canvas"), scrub: $("#ps-scrub"), prog: $("#ps-prog"),
    ops: $("#ps-ops"), code: $("#ps-code"), file: $("#ps-file"), lineinfo: $("#ps-lineinfo"),
    bt: $("#ps-bt"), loc: $("#ps-loc"), out: $("#ps-out"),
  };
  const btn = {
    back: $("#ps-back"), step: $("#ps-step"), next: $("#ps-next"),
    finish: $("#ps-finish"), op: $("#ps-op"),
  };
  const S = {
    run: null, ev: [], pos: 0, cmd: "start",
    playing: false, raf: 0, last: 0, budget: 0,
    bps: new Set(), touched: false, drawn: "",
  };

  // ---------- Code C : coloration légère ----------
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TOKEN = /(#\w+)|("(?:[^"\\]|\\.)*")|\b(void|int|while|if|else|return|sizeof)\b|\b(t_stack|t_borne|t_bench)\b|\b(\d+)\b|\b([a-z_]\w*)(?=\()/g;
  function highlight(src) {
    let out = "", last = 0;
    for (const m of src.matchAll(TOKEN)) {
      out += esc(src.slice(last, m.index));
      const cls = m[1] || m[2] ? "c-p" : m[3] ? "c-k" : m[4] ? "c-t" : m[5] ? "c-n" : "c-f";
      out += `<span class="${cls}">${esc(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return out + esc(src.slice(last));
  }

  const SRC = SOURCE.replace(/\n$/, "").split("\n");
  el.file.textContent = SOURCE_FILE;
  el.code.innerHTML = SRC.map((t, i) =>
    `<div class="ps-l" data-l="${i + 1}"><button type="button" class="ps-g" tabindex="-1" aria-label="Point d'arrêt ligne ${i + 1}"><span class="ps-n">${i + 1}</span><span class="ps-m">   </span></button><span class="ps-c">${highlight(t) || " "}</span></div>`
  ).join("");
  const lineEl = [null, ...el.code.querySelectorAll(".ps-l")];
  let curLine = 0;

  function markText(l) {
    const bp = S.bps.has(l), cur = l === curLine;
    return (bp ? "B+" : "  ") + (cur ? ">" : " ");
  }
  function paintLine(l) {
    const d = lineEl[l];
    if (!d) return;
    d.classList.toggle("cur", l === curLine);
    d.classList.toggle("bp", S.bps.has(l));
    d.querySelector(".ps-m").textContent = markText(l);
  }
  function toggleBp(l) {
    S.touched = true;
    if (S.bps.has(l)) S.bps.delete(l);
    else S.bps.add(l);
    paintLine(l);
  }
  el.code.addEventListener("click", (e) => {
    const g = e.target.closest(".ps-g");
    if (g) toggleBp(+g.parentElement.dataset.l);
  });

  // ---------- Données ----------
  function randomValues(n) {
    const pool = [];
    for (let v = -99; v <= 99; v++) pool.push(v);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, n);
  }
  function parseList(txt) {
    const parts = txt.trim().split(/[\s,;]+/).filter(Boolean);
    if (parts.length < 2) return { err: "Donne au moins 2 nombres." };
    if (parts.length > MAXN) return { err: `Maximum ${MAXN} nombres.` };
    const vals = [];
    for (const p of parts) {
      if (!/^[+-]?\d+$/.test(p)) return { err: `Error : « ${p} » n'est pas un entier.` };
      const x = Number(p);
      if (x > 2147483647 || x < -2147483648) return { err: `Error : ${p} dépasse la taille d'un int.` };
      vals.push(x);
    }
    const seen = new Set();
    for (const x of vals) {
      if (seen.has(x)) return { err: `Error : ${x} apparaît deux fois, push_swap refuse les doublons.` };
      seen.add(x);
    }
    return { vals };
  }

  function load(values, autoplay) {
    pause();
    S.run = trace(values);
    S.ev = S.run.events;
    S.pos = 0;
    S.cmd = "start";
    S.drawn = "";
    el.scrub.max = S.ev.length - 1;
    el.nOut.textContent = values.length;
    el.n.value = Math.min(MAXN, Math.max(+el.n.min, values.length));
    render();
    if (autoplay && !REDUCED) play();
  }

  // ---------- Navigation façon gdb ----------
  const last = () => S.ev.length - 1;
  function goTo(p, cmd) {
    S.touched = true;
    pause();
    S.pos = Math.max(0, Math.min(last(), p));
    if (cmd) S.cmd = cmd;
    render();
  }
  // Prochain événement qui vérifie `pred`, ou qui tombe sur un point d'arrêt.
  function seek(pred) {
    const cur = S.ev[S.pos];
    for (let q = S.pos + 1; q <= last(); q++) {
      if (pred(S.ev[q], cur) || S.bps.has(S.ev[q].l)) return q;
    }
    return last();
  }
  const ACTIONS = {
    back: () => goTo(S.pos - 1, "reverse-step"),
    step: () => goTo(S.pos + 1, "step"),
    next: () => goTo(seek((q, c) => q.fr.d <= c.fr.d), "next"),
    finish: () => goTo(seek((q, c) => q.fr.d < c.fr.d), "finish"),
    op: () => goTo(seek((q, c) => q.o > c.o), "next-op"),
  };
  for (const k of Object.keys(btn)) btn[k].addEventListener("click", ACTIONS[k]);

  // ---------- Lecture (continue) ----------
  function costs() {
    const base = SPEEDS[+el.speed.value];
    return { op: base, line: base * 0.22, scan: base * 0.03 };
  }
  function play() {
    if (S.playing) return;
    if (S.pos >= last()) S.pos = 0;
    S.playing = true;
    S.cmd = "continue";
    S.budget = 0;
    S.last = performance.now();
    el.play.classList.add("on");
    el.play.firstChild.textContent = "Pause ";
    S.raf = requestAnimationFrame(tick);
  }
  function pause() {
    S.playing = false;
    cancelAnimationFrame(S.raf);
    el.play.classList.remove("on");
    el.play.firstChild.textContent = "Lecture ";
  }
  function togglePlay() {
    S.touched = true;
    if (S.playing) {
      pause();
      render();
    } else play();
  }
  function tick(now) {
    if (!S.playing) return;
    S.budget += Math.min(64, now - S.last);
    S.last = now;
    const c = costs();
    let guard = 0;
    while (S.budget > 0 && S.pos < last() && guard++ < 600) {
      S.pos++;
      const e = S.ev[S.pos];
      S.budget -= e.sc ? c.scan : e.x ? c.op : c.line;
      if (S.bps.has(e.l)) {
        pause();
        break;
      }
    }
    if (S.pos >= last()) pause();
    render();
    if (S.playing) S.raf = requestAnimationFrame(tick);
  }
  el.play.addEventListener("click", togglePlay);

  // ---------- Contrôles données ----------
  el.n.addEventListener("input", () => (el.nOut.textContent = el.n.value));
  el.n.addEventListener("change", () => {
    S.touched = true;
    load(randomValues(+el.n.value), true);
  });
  el.shuffle.addEventListener("click", () => {
    S.touched = true;
    el.msg.textContent = "";
    load(randomValues(+el.n.value), true);
  });
  el.form.addEventListener("submit", (e) => {
    e.preventDefault();
    S.touched = true;
    const r = parseList(el.input.value);
    el.msg.textContent = r.err || "";
    if (r.vals) load(r.vals, true);
  });
  el.scrub.addEventListener("input", () => goTo(+el.scrub.value, "jump"));

  // ---------- Raccourcis clavier (uniquement quand le focus est dans la démo) ----------
  root.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.matches("input, textarea")) return;
    switch (e.key) {
      case "s": case "ArrowRight": ACTIONS.step(); break;
      case "n": ACTIONS.next(); break;
      case "f": ACTIONS.finish(); break;
      case "o": ACTIONS.op(); break;
      case "r": case "ArrowLeft": ACTIONS.back(); break;
      case "c": togglePlay(); break;
      case "b": toggleBp(S.ev[S.pos].l); break;
      case " ":
        if (e.target.matches("button")) return; // la barre d'espace active déjà le bouton
        togglePlay();
        break;
      default: return;
    }
    e.preventDefault();
  });

  // ---------- Dessin des piles ----------
  const css = getComputedStyle(document.documentElement);
  const col = (n, d) => css.getPropertyValue(n).trim() || d;
  const C = { ink: col("--ink", "#12110f"), sig: col("--sig", "#ff4d1a"), dim: col("--dim", "#6b675f"), paper: col("--paper", "#ece8df") };
  const LOW = [212, 206, 191]; // petits index : clair
  const HIGH = [29, 27, 24]; // grands index : sombre
  const ramp = (t) => `rgb(${LOW.map((l, i) => Math.round(l + (HIGH[i] - l) * t)).join(",")})`;
  const MONO = '"JetBrains Mono", ui-monospace, monospace';
  const ctx = el.cv.getContext("2d");
  let cw = 0, ch = 0;

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cw = el.cv.clientWidth;
    ch = el.cv.clientHeight;
    el.cv.width = Math.round(cw * dpr);
    el.cv.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S.drawn = "";
    draw();
  }
  if ("ResizeObserver" in window) new ResizeObserver(fit).observe(el.cv);
  else addEventListener("resize", fit);

  const isHot = (ph, idx) =>
    ph.t === "chunk" ? idx >= ph.min && idx <= ph.max
      : ph.t === "pick" || ph.t === "btoa" || ph.t === "pa" ? idx === ph.target : false;

  function draw() {
    const e = S.ev[S.pos];
    if (!e || !cw) return;
    const key = `${S.pos}|${cw}|${ch}`;
    if (key === S.drawn) return;
    S.drawn = key;

    const snap = S.run.snaps[e.o];
    const n = S.run.n;
    const padT = 30, gap = 26, gut = 46;
    const colW = (cw - gap) / 2;
    const barMax = colW - gut;
    const rowH = Math.min(16, (ch - padT - 4) / n);
    const solid = rowH >= 4 ? rowH - 1 : rowH;
    ctx.clearRect(0, 0, cw, ch);
    ctx.textBaseline = "alphabetic";

    [["a", snap.a, 0], ["b", snap.b, colW + gap]].forEach(([name, arr, x0]) => {
      ctx.font = `500 12px ${MONO}`;
      ctx.fillStyle = C.ink;
      ctx.textAlign = "left";
      ctx.fillText(`pile ${name}`, x0, 16);
      ctx.font = `11px ${MONO}`;
      ctx.fillStyle = C.dim;
      ctx.textAlign = "right";
      ctx.fillText(arr.length ? `${arr.length}` : "vide", x0 + colW, 16);
      ctx.fillStyle = C.ink;
      ctx.fillRect(x0 + gut - 1, padT - 3, 1, ch - padT);

      for (let p = 0; p < arr.length; p++) {
        const idx = arr[p];
        const t = n > 1 ? idx / (n - 1) : 0;
        const w = Math.max(6, ((idx + 1) / n) * barMax);
        const y = padT + p * rowH;
        ctx.fillStyle = isHot(e.ph, idx) ? C.sig : e.ix ? ramp(t) : "#b9b4a8";
        ctx.fillRect(x0 + gut, y, w, solid);
        if (rowH >= 12) {
          ctx.font = `10px ${MONO}`;
          ctx.textAlign = "left";
          ctx.fillStyle = isHot(e.ph, idx) || t > 0.5 ? C.paper : C.ink;
          ctx.fillText(String(S.run.sortedV[idx]), x0 + gut + 5, y + rowH - 4);
        }
      }
      // repères (tmpa, tmp, k)
      for (const m of e.m || []) {
        if (m.s !== name || m.p >= arr.length) continue;
        const y = padT + m.p * rowH;
        const w = Math.max(6, ((arr[m.p] + 1) / n) * barMax);
        ctx.strokeStyle = C.sig;
        ctx.fillStyle = C.sig;
        ctx.lineWidth = 1.5;
        if (m.outline) ctx.strokeRect(x0 + gut - 0.5, y - 0.5, w + 1, solid + 1);
        const cy = y + solid / 2;
        ctx.beginPath();
        ctx.moveTo(x0 + gut - 6, cy - 4);
        ctx.lineTo(x0 + gut - 1, cy);
        ctx.lineTo(x0 + gut - 6, cy + 4);
        ctx.fill();
        ctx.font = `500 10px ${MONO}`;
        ctx.textAlign = "right";
        ctx.fillText(m.label, x0 + gut - 10, cy + 3.5);
      }
    });
  }

  // ---------- Textes d'accompagnement ----------
  const fmt = (v) => (v === null ? "?" : v);
  function stateText(e, snap) {
    const p = e.ph;
    const nb = snap.b.length;
    switch (p.t) {
      case "setup": return e.ix ? "Je définis les bornes de la tranche à traiter." : "Préparation : chaque valeur va recevoir son rang (son index), puis je coupe en tranches.";
      case "chunk": return `Tranche ${p.c}/${p.k}, index ${p.min} à ${p.max}. ${fmt(e.v[1]) === "?" ? 0 : e.v[1]}/${p.size} envoyés dans b.`;
      case "loop": return nb ? `b contient ${nb} élément${nb > 1 ? "s" : ""}. Je prends le plus grand, je l'amène au sommet, puis pa.` : "b est vide.";
      case "higher": return `Je parcours b pour trouver le plus grand index (${nb} éléments à regarder).`;
      case "pick": return `Le plus grand index de b est ${p.target}, en position ${p.pos}.`;
      case "btoa": return p.max === 0 ? `L'index ${p.target} est déjà au sommet de b.` : `${p.dir} : je fais tourner b pour amener l'index ${p.target} au sommet, par le chemin le plus court.`;
      case "pa": return `pa : l'index ${p.target} passe de b vers a.`;
      case "done": return S.run.ok ? `a est trié : ${S.run.n} éléments en ${S.run.names.length} opérations.` : "Terminé.";
      default: return "";
    }
  }
  const row = (k, v) => `<span class="k">${k}</span> = ${v}`;
  const borneText = (state, min, max) =>
    state === "alloc" ? row("*borne", `{min = ${fmt(min)}, max = ${fmt(max)}}`) : state === "freed" ? row("borne", "&lt;libérée&gt;") : row("borne", "?");
  function localsText(e) {
    const v = e.v;
    switch (e.fr.fn) {
      case "meduim": return row("i", fmt(v[0]));
      case "chunk": return [row("i", fmt(v[0])), row("j", fmt(v[1])), row("k", fmt(v[2])), row("n", fmt(v[3])), borneText(v[4], v[5], v[6])].join("\n");
      case "chunktob": return [row("tmpa -&gt; index", fmt(v[0])), row("i", fmt(v[1])), row("*borne", `{min = ${v[2]}, max = ${v[3]}}`)].join("\n");
      case "higher": return [row("tmp -&gt; index", v[0] === -1 ? "NULL" : fmt(v[0])), row("i", fmt(v[1])), row("j", fmt(v[2])), row("k", fmt(v[3]))].join("\n");
      case "btoa": return [row("j", fmt(v[0])), row("max", v[1])].join("\n");
      default: return "";
    }
  }
  function btText(e) {
    const fr = [{ fn: e.fr.fn, line: e.l }, ...e.fr.up];
    const lines = fr.map((f, i) => `<span class="k">#${i}</span>  ${f.fn} (...) at ${SOURCE_FILE}:${f.line}`);
    lines.push(`<span class="k">#${fr.length}</span>  main (argc=..., argv=...)`);
    return lines.join("\n");
  }

  // ---------- Compteurs ----------
  el.ops.innerHTML = OPS.map((o) => `<div class="ps-op"><span class="mono">${o}</span><b data-op="${o}">0</b></div>`).join("") +
    `<div class="ps-op tot"><span class="mono">total</span><b data-op="total">0</b></div>`;
  const opCells = Object.fromEntries([...el.ops.querySelectorAll("b")].map((b) => [b.dataset.op, b]));

  // ---------- Rendu global ----------
  function setText(node, html, isHtml) {
    if (node._v === html) return;
    node._v = html;
    if (isHtml) node.innerHTML = html;
    else node.textContent = html;
  }
  function render() {
    const e = S.ev[S.pos];
    if (!e) return;
    const snap = S.run.snaps[e.o];

    // code : ligne courante
    const prev = curLine;
    curLine = e.l;
    if (prev !== curLine) {
      paintLine(prev);
      paintLine(curLine);
      const d = lineEl[curLine], box = el.code;
      if (d && (d.offsetTop < box.scrollTop + box.clientHeight * 0.2 || d.offsetTop > box.scrollTop + box.clientHeight * 0.75)) {
        box.scrollTop = d.offsetTop - box.clientHeight / 2;
      }
    }
    setText(el.lineinfo, `ligne ${curLine}/${SRC.length}`);
    setText(el.bt, btText(e), true);
    setText(el.loc, localsText(e), true);

    // sortie standard + invite gdb
    const done = S.pos === last();
    const tail = S.run.names.slice(Math.max(0, e.o - 5), e.o);
    const lines = tail.map((x) => esc(x));
    if (done) lines.push(`<span class="k">[Inferior 1 (process 4242) exited normally]</span>`);
    lines.push(`<span class="pr">(gdb)</span> ${esc(S.cmd)}`);
    setText(el.out, lines.join("\n"), true);

    // piles + textes
    draw();
    setText(el.state, stateText(e, snap));
    for (const o of OPS) setText(opCells[o], String(snap.c[o]));
    setText(opCells.total, String(e.o));
    setText(el.prog, `${e.o}/${S.run.names.length}`);
    if (+el.scrub.value !== S.pos) el.scrub.value = S.pos;

    // boutons
    btn.back.disabled = S.pos === 0;
    for (const k of ["step", "next", "finish", "op"]) btn[k].disabled = done;
    el.cv.setAttribute("aria-label", `Piles a (${snap.a.length} éléments) et b (${snap.b.length} éléments), ${e.o} opérations effectuées`);
  }

  // ---------- Démarrage ----------
  el.speed.value = DEFAULT_SPEED;
  el.n.value = DEFAULT_N;
  load(randomValues(DEFAULT_N), false);
  fit();

  // Lecture automatique, une seule fois, quand la démo arrive à l'écran.
  if ("IntersectionObserver" in window && !REDUCED) {
    const io = new IntersectionObserver((es) => {
      const r = es[0];
      // assez visible : la moitié de l'écran, ou 40 % de la démo si elle est plus petite
      if (r.intersectionRect.height < innerHeight * 0.5 && r.intersectionRatio < 0.4) return;
      io.disconnect();
      if (!S.touched) play();
    }, { threshold: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6] });
    io.observe(root);
  }
}
