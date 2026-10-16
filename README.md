# Victor — portfolio

Site statique, **zéro build, zéro dépendance**. HTML + CSS + JS natif (modules ES).

## Faire vivre le site
Tout le contenu est dans **`content.js`** — c'est le seul fichier à toucher :
- nouveau projet → copie un bloc dans `PROJECTS` (le plus récent en premier, numéro `VF-0xx` suivant)
- nouvelle étape (école, stage, diplôme) → une ligne dans `EDU` ou `EXP`
- nouveaux records / chiffres → `SPECS`
- liens (LinkedIn, mail…) → `ME.links`
- change `REV` après une grosse mise à jour

## Déployer
Push sur GitHub, puis sur Vercel : *Add New → Project → importer le repo → Deploy*. Aucune config.

## Vie privée
`index.html` contient `noindex` : Google n'indexe pas le site. Supprime cette ligne quand tu voudras être trouvable.
Pour tester en local : `npx serve .` (les modules ES ne marchent pas en ouvrant le fichier directement).
