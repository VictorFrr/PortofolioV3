// Usage: TMDB_KEY=ta_cle node scripts/fetch-posters.mjs
// Télécharge les affiches dans public/posters/. Les films déjà présents sont ignorés.
import fs from "node:fs/promises";
import path from "node:path";

const KEY = process.env.TMDB_KEY;
if (!KEY) { console.error("Manque TMDB_KEY"); process.exit(1); }

const films = JSON.parse(await fs.readFile("src/data/films.json", "utf8"));
await fs.mkdir("public/posters", { recursive: true });

const missing = [];
for (const f of films) {
  const out = path.join("public/posters", `${f.slug}.jpg`);
  try { await fs.access(out); continue; } catch {}

  const q = new URLSearchParams({ api_key: KEY, query: f.title, year: String(f.year) });
  let res = await (await fetch(`https://api.themoviedb.org/3/search/movie?${q}`)).json();
  let hit = res.results?.find((r) => r.poster_path);
  if (!hit) { // retry sans l'année (dates parfois décalées)
    q.delete("year");
    res = await (await fetch(`https://api.themoviedb.org/3/search/movie?${q}`)).json();
    hit = res.results?.find((r) => r.poster_path);
  }
  if (!hit) { missing.push(f.title); console.log("✗", f.title); continue; }

  const img = await fetch(`https://image.tmdb.org/t/p/w500${hit.poster_path}`);
  await fs.writeFile(out, Buffer.from(await img.arrayBuffer()));
  console.log("✓", f.title);
}
if (missing.length) console.log("\nSans affiche (fallback affiché par le composant):", missing.join(", "));
