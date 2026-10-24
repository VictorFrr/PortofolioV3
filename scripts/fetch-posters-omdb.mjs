// Usage: OMDB_KEY=ta_cle node scripts/fetch-posters-omdb.mjs
// Clé gratuite (email seulement) : https://www.omdbapi.com/apikey.aspx  (1000 requêtes/jour)
import fs from "node:fs/promises";
import path from "node:path";

const KEY = process.env.OMDB_KEY;
if (!KEY) { console.error("Manque OMDB_KEY"); process.exit(1); }

const films = JSON.parse(await fs.readFile("src/data/films.json", "utf8"));
await fs.mkdir("public/posters", { recursive: true });

const missing = [];
for (const f of films) {
  const out = path.join("public/posters", `${f.slug}.jpg`);
  try { await fs.access(out); continue; } catch {}

  const ask = async (withYear) => {
    const q = new URLSearchParams({ apikey: KEY, t: f.title });
    if (withYear) q.set("y", String(f.year));
    return (await fetch(`https://www.omdbapi.com/?${q}`)).json();
  };
  let res = await ask(true);
  if (res.Response === "False") res = await ask(false); // retry sans l'année
  if (res.Response === "False" || !res.Poster || res.Poster === "N/A") {
    missing.push(f.title); console.log("✗", f.title); continue;
  }

  const url = res.Poster.replace(/SX\d+/, "SX500"); // meilleure résolution
  const img = await fetch(url);
  if (!img.ok) { missing.push(f.title); console.log("✗", f.title); continue; }
  await fs.writeFile(out, Buffer.from(await img.arrayBuffer()));
  console.log("✓", f.title);
}
if (missing.length) console.log("\nSans affiche (fallback affiché par le composant):", missing.join(", "));
