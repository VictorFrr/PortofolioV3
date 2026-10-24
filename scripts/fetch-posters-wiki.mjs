// Usage: node scripts/fetch-posters-wiki.mjs
// Aucune clé, aucun compte. Lit l'infobox de l'article Wikipédia du film pour trouver son affiche.
// Relançable à volonté : les affiches déjà téléchargées sont ignorées.
import fs from "node:fs/promises";
import path from "node:path";

const UA = { "User-Agent": "portfolio-poster-fetch/1.0 (https://github.com/VictorFrr/PortofolioV3; personal portfolio)" };
const API = "https://en.wikipedia.org/w/api.php";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

// Requête avec pause systématique + gestion du "too many requests"
async function get(url, binary = false) {
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(900);
    const res = await fetch(url, { headers: UA });
    if (res.status === 429 || res.status === 503) {
      const wait = (Number(res.headers.get("retry-after")) || 20) * 1000;
      console.log(`  … trop de requêtes, pause ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) return null;
    if (binary) return Buffer.from(await res.arrayBuffer());
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { console.log("  … limite atteinte, pause 30s"); await sleep(30000); }
  }
  return null;
}

const api = (params) =>
  get(`${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`);

async function searchTitles(query) {
  const res = await api({ action: "query", list: "search", srsearch: query, srlimit: "6" });
  return (res?.query?.search ?? []).map((s) => s.title);
}

function pickTitle(titles, f) {
  const t = norm(f.title);
  const isFilm = (x) => /\((\d{4} )?(film|anime film|animated film)\)/i.test(x);
  return (
    titles.find((x) => isFilm(x) && x.includes(String(f.year))) ||
    titles.find((x) => isFilm(x) && norm(x).startsWith(t)) ||
    titles.find((x) => norm(x) === t) ||
    titles.find((x) => norm(x).startsWith(t)) ||
    null
  );
}

async function infoboxImage(title) {
  const res = await api({
    action: "query", prop: "revisions", rvprop: "content", rvslots: "main", titles: title,
  });
  const text = res?.query?.pages?.[0]?.revisions?.[0]?.slots?.main?.content ?? "";
  const m = text.match(/\|\s*(?:image|image_name|poster)\s*=\s*([^\n|]+)/i);
  if (!m) return null;
  let name = m[1].replace(/<!--.*?-->/g, "").trim()
    .replace(/^\[\[/, "").replace(/\]\]$/, "").replace(/^(File|Image):/i, "").trim();
  if (!name || name.startsWith("{{")) return null;
  return name;
}

async function imageUrl(name) {
  const res = await api({
    action: "query", titles: `File:${name}`, prop: "imageinfo", iiprop: "url", iiurlwidth: "500",
  });
  const info = res?.query?.pages?.[0]?.imageinfo?.[0];
  return info?.thumburl || info?.url || null;
}

const films = JSON.parse(await fs.readFile("src/data/films.json", "utf8"));
await fs.mkdir("posters", { recursive: true });

const missing = [];
for (const f of films) {
  const out = path.join("posters", `${f.slug}.jpg`);
  try { await fs.access(out); continue; } catch {}

  let title = pickTitle(await searchTitles(`${f.title} ${f.year} film`), f);
  if (!title) title = pickTitle(await searchTitles(`${f.title} ${f.year}`), f);
  const name = title ? await infoboxImage(title) : null;
  const url = name ? await imageUrl(name) : null;
  const img = url ? await get(url, true) : null;

  if (!img) { missing.push(f.title); console.log("✗", f.title, title ? `(article: ${title})` : ""); continue; }
  await fs.writeFile(out, img);
  console.log("✓", f.title, "→", title);
}
if (missing.length) console.log("\nSans affiche (fallback affiché par le composant):", missing.join(", "));
