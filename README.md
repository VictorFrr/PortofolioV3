# Portfolio — style "datasheet"

Un portfolio personnel en une page, pensé comme la fiche technique (*datasheet*) d'un composant électronique. Site statique, **zéro build, zéro dépendance** : HTML + CSS + JS natif (modules ES). Pas de framework, pas de `npm install`.

C'est le portfolio de Victor, mais le template est libre de réutilisation — si le style te plaît, fork-le et remplace le contenu par le tien.

## Structure du projet
```
index.html     → structure de la page (sections, à ne presque jamais toucher)
content.js     → TOUT le contenu (le seul fichier à éditer au quotidien)
app.js         → injecte le contenu de content.js dans index.html
style.css      → le design "datasheet"
```

## Faire vivre le site (ou te l'approprier)
Tout le contenu éditable vit dans **`content.js`** :
- `ME` → nom, accroche, bio, chips, liens (GitHub, LinkedIn, mail…)
- `SPECS` → la liste de stats/chiffres façon "specs techniques"
- `PROJECTS` → tes projets (le plus récent en premier)
- `EDU` / `EXP` → parcours scolaire et stages/expériences
- `STACK` → tes compétences techniques, groupées par catégorie
- `HOBBIES` → tes centres d'intérêt hors travail, groupés par catégorie
- `COUNTRIES` → les pays visités, affichés en pastilles
- `REV` → change cette valeur après une grosse mise à jour, elle s'affiche dans le footer

Pour réutiliser ce template pour toi-même : fork le repo, remplace les valeurs dans `content.js` par les tiennes (et retire/adapte les sections dont tu n'as pas besoin dans `index.html` + `app.js`).

## Déployer
Push sur GitHub, puis sur [Vercel](https://vercel.com) : *Add New → Project → importer le repo → Deploy*. Aucune configuration nécessaire — c'est un site statique.

## Développement local
Les modules ES ne fonctionnent pas en ouvrant `index.html` directement dans le navigateur (double-clic). Il faut un petit serveur local :
```
npx serve .
```

## Vie privée
`index.html` contient une balise `noindex` : les moteurs de recherche n'indexent pas le site tant qu'elle est présente. Supprime-la le jour où tu veux être trouvable sur Google.
