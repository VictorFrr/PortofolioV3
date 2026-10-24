# Portfolio — style « datasheet »

Portfolio personnel en une page, pensé comme la fiche technique d'un composant électronique.
Site statique : **HTML + CSS + JS natif (modules ES)**, zéro build, zéro dépendance.

## Structure

```
index.html            Structure de la page
vercel.json           Déploiement : en-têtes de sécurité + cache des images
assets/
  css/style.css       Tout le design (base, musique, cinéma)
  js/content.js       ★ TOUT le contenu texte — le seul fichier à éditer au quotidien
  js/app.js           Injecte content.js dans index.html (+ puce 3D, apparition au scroll)
  js/music.js         Section Musique
  js/cinema.js        Section Cinéma
  js/main.js          Point d'entrée (importe les trois fichiers ci-dessus)
  music/, posters/    Pochettes (.webp) et affiches (.jpg)
data/                 albums.json, films.json
tools/                Scripts Node pour regénérer pochettes et affiches
archive/              Ancien code / fichiers non utilisés — supprimable (non déployé)
```

## Modifier le contenu
Tout est dans `assets/js/content.js` : `ME`, `SPECS`, `PROJECTS` (le plus récent en premier), `EDU`, `EXP`, `STACK`, `HOBBIES`, `COUNTRIES`, `REV`.

## Ajouter un film
1. Ajouter une entrée dans `data/films.json` (`title`, `year`, `rating`, `uri`, `slug`). Seuls les films `rating: 5` s'affichent.
2. `node tools/fetch-posters-wiki.mjs` télécharge l'affiche dans `assets/posters/`.

## Ajouter un album
1. Ajouter `Artiste - Album` dans `tools/albums.txt`.
2. `npm i -D sharp` (une fois), puis `node tools/fetch-covers.mjs`. Relire les lignes « ? VÉRIFIE ».

## Développement local
Les modules ES ne marchent pas en double-cliquant sur `index.html` : lancer `npx serve .`

## Déployer
GitHub → [Vercel](https://vercel.com) : *Add New → Project → importer le repo → Deploy*. `.vercelignore` exclut `archive/` et `tools/`.

## Vie privée
`index.html` contient `noindex, nofollow` : le site n'est pas indexé tant que cette ligne est présente.
