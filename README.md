# Portfolio — Victor Ponthus

Site statique (HTML / CSS / JS vanilla + Three.js pour la scène 3D du hero). Aucun build, aucune dépendance npm.

## Déployer sur Vercel

1. Crée un repo Git avec ces fichiers (ou importe le zip directement dans Vercel : "Add New Project" → "Upload").
2. Aucune configuration nécessaire — `vercel.json` est déjà inclus, Vercel détecte un site statique automatiquement.
3. Déploie.

## Formulaire de contact

Le formulaire pointe vers Formspree (`index.html`, attribut `action` du `<form id="contact-form">`).
Remplace `YOUR_FORM_ID` par ton véritable ID Formspree (gratuit sur formspree.io) :

```html
<form id="contact-form" action="https://formspree.io/f/abcd1234" method="POST">
```

Tant que l'ID n'est pas remplacé, le formulaire affichera un message d'erreur propre plutôt que d'échouer silencieusement.

## Structure

- `index.html` — structure de la page, tous les textes sont injectés en JS (i18n)
- `data.js` — toutes les données : traductions FR/EN, projets, pays visités
- `style.css` — design system complet (tokens CSS, thème clair/sombre)
- `scene.js` — scène 3D interactive (réseau de nœuds, Three.js) dans le hero
- `main.js` — rendu i18n, modal projets, thème, animations au scroll, formulaire
- `images/` — icônes SVG des projets (conservées du site précédent)

## Personnalisation rapide

- Couleur d'accent : variable `--accent` dans `style.css`
- Email de contact : lien `mailto:` dans `index.html`
- Contenu des projets / traductions : tout est dans `data.js`
