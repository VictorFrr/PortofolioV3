// Section Cinéma : posters des films notés 4★+ sur Letterboxd (données dans src/data/films.json)
const grid = document.getElementById("cine-grid");
if (grid) init();

async function init() {
  let films = [];
  try { films = await (await fetch("src/data/films.json")).json(); } catch {}
  if (!films.length) { document.getElementById("cinema").hidden = true; return; }

  const stars = (n) => "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "");
  const bar = document.getElementById("cine-bar");
  const filters = [[4, "Tous"], [4.5, "★★★★½+"], [5, "★★★★★"]];
  let min = 4;

  const count = document.createElement("span");
  count.className = "mono";
  bar.appendChild(count);

  const buttons = filters.map(([v, label]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `${label} · ${films.filter((f) => f.rating >= v).length}`;
    b.onclick = () => { min = v; render(); };
    bar.appendChild(b);
    return [v, b];
  });

  function render() {
    const shown = films.filter((f) => f.rating >= min);
    count.textContent = `${shown.length} films`;
    buttons.forEach(([v, b]) => b.setAttribute("aria-pressed", String(v === min)));

    grid.replaceChildren(...shown.map((f) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = f.uri; a.target = "_blank"; a.rel = "noopener";

      const ph = document.createElement("span");
      ph.className = "cine__ph"; ph.textContent = f.title;

      const img = new Image();
      img.src = `posters/${f.slug}.jpg`; img.alt = `${f.title} (${f.year})`;
      img.loading = "lazy"; img.decoding = "async"; img.draggable = false;
      img.onerror = () => li.remove(); // pas d'affiche => pas de tuile

      const info = document.createElement("span");
      info.className = "cine__info";
      const t = document.createElement("b"); t.textContent = f.title;
      const m = document.createElement("i"); m.textContent = `${f.year} · ${stars(f.rating)}`;
      info.append(t, m);

      a.append(ph, img, info);
      li.appendChild(a);
      return li;
    }));
  }
  render();
}
