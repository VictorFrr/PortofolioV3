// Usage: node scripts/fetch-covers.mjs   (Node 18+, après `npm i -D sharp`)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(ROOT, 'public/music');
const DATA = path.join(ROOT, 'src/data/albums.json');
const CACHE = path.join(HERE, 'cache.json');
const SIZE = 600;
const DELAY = 3200; // l'API iTunes limite à ~20 requêtes/min

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const slug = (s) => norm(s).replace(/ /g, '-');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const words = (s) => norm(s).split(' ').filter((w) => w.length > 2);

async function search(artist, album) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(`${artist} ${album}`)}&entity=album&limit=10`;
  for (let t = 0; t < 4; t++) {
    const res = await fetch(url);
    if (res.ok) return (await res.json()).results;
    await sleep(30000);
  }
  throw new Error('iTunes API inaccessible');
}

function pick(results, artist, album) {
  const a = words(artist), al = norm(album);
  let best = null;
  for (const r of results) {
    const rn = norm(r.collectionName);
    const score = (a.some((w) => norm(r.artistName).includes(w)) ? 2 : 0)
      + (rn.includes(al) || al.includes(rn.replace(/ (deluxe|expanded|remastered).*$/, '')) ? 2 : 0);
    const better = !best || score > best.score || (score === best.score && rn.length < best.len);
    if (better) best = { r, score, len: rn.length };
  }
  return best;
}

// Mélange avec seed + jamais 2 covers du même artiste côte à côte (boucle comprise)
function shuffle(list) {
  let s = 42;
  const rnd = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  const n = a.length, same = (i, j) => a[(i + n) % n].artist === a[(j + n) % n].artist;
  for (let pass = 0; pass < 20; pass++) {
    let clean = true;
    for (let i = 0; i < n; i++) {
      if (!same(i, i + 1)) continue;
      clean = false;
      for (let k = 0; k < n; k++) {
        const j = (i + 2 + k) % n; // candidat à échanger avec i+1
        const x = (i + 1) % n;
        [a[x], a[j]] = [a[j], a[x]];
        if (!same(i, x) && !same(x, x + 1) && !same(j - 1, j) && !same(j, j + 1)) break;
        [a[x], a[j]] = [a[j], a[x]];
      }
    }
    if (clean) break;
  }
  return a;
}

await fs.mkdir(OUT, { recursive: true });
const cache = JSON.parse(await fs.readFile(CACHE, 'utf8').catch(() => '{}'));
const lines = (await fs.readFile(path.join(HERE, 'albums.txt'), 'utf8'))
  .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

const entries = [];
for (const line of lines) {
  const [artist, ...rest] = line.split(' - ');
  const album = rest.join(' - ');
  const file = `${slug(artist)}-${slug(album)}.webp`;
  const dest = path.join(OUT, file);
  const cached = cache[line] && (await fs.stat(dest).catch(() => null));
  if (!cached) {
    try {
      const found = pick(await search(artist, album), artist, album);
      if (!found) { console.log(`✗ ${line} → rien trouvé`); await sleep(DELAY); continue; }
      const img = await fetch(found.r.artworkUrl100.replace('100x100bb', `${SIZE}x${SIZE}bb`));
      const buf = Buffer.from(await img.arrayBuffer());
      await sharp(buf).resize(SIZE, SIZE).webp({ quality: 82 }).toFile(dest);
      cache[line] = `${found.r.collectionName} — ${found.r.artistName}`;
      console.log(`${found.score >= 4 ? '✓' : '? VÉRIFIE'} ${line} → ${cache[line]}`);
      await fs.writeFile(CACHE, JSON.stringify(cache, null, 2));
    } catch (e) { console.log(`✗ ${line} → ${e.message}`); }
    await sleep(DELAY);
  }
  entries.push({ src: `/music/${file}`, alt: `${album} — ${artist}`, artist });
}

const ok = [];
for (const e of entries) if (await fs.stat(path.join(ROOT, 'public', e.src)).catch(() => null)) ok.push(e);
await fs.writeFile(DATA, JSON.stringify(shuffle(ok), null, 2));
console.log(`\n${ok.length}/${lines.length} covers → src/data/albums.json`);
