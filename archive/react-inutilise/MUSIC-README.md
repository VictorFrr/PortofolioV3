# Section Musique
1. Copie `src/`, `scripts/`, `public/music/` dans ton dépôt (fusionne les dossiers).
2. `npm i -D sharp`
3. `node scripts/fetch-covers.mjs` (~4 min pour 60 albums, limite de l'API iTunes). Relis les lignes marquées "? VÉRIFIE".
4. Dans `App.jsx`: `import MusicSection from './components/MusicSection'` puis `<MusicSection />`.
5. `git add . && git commit && git push`

Ajouter un album : une ligne dans `scripts/albums.txt`, relancer le script (le cache évite de tout retélécharger).
