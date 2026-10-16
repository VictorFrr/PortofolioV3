// ===========================================================
//  CONTENU — c'est le SEUL fichier à modifier pour faire vivre le site.
//  Nouveau projet ? Copie un bloc dans PROJECTS (le premier = le plus récent).
//  Nouvelle étape de vie ? Ajoute une ligne dans EDU ou EXP.
// ===========================================================
export const REV = "2026.10"; // change quand tu fais une grosse mise à jour

export const ME = {
  tagline: "Je construis des choses qui compilent, qui scannent, qui s'allument.",
  chips: ["École 42 — Piscine réussie", "Tronc commun en cours", "Bac Pro CIEL · mention Bien"],
  bio: "Sorti d'un Bac Pro CIEL (cybersécurité, informatique, réseaux, électronique) avec mention Bien, j'ai décroché ma place à l'école 42 en passant la Piscine. J'y suis en tronc commun. Je code en C, je fais du pentest en labo, je soude, je monte des serveurs avec du matériel de récup — et je cours, je roule et je marche pour garder la tête claire.",
  links: [
    { label: "GitHub", url: "https://github.com/VictorFrr" },
    // { label: "LinkedIn", url: "https://..." },
    // { label: "Email", url: "mailto:..." },
  ],
};

// [étiquette, valeur] — le style « absolute maximum ratings » d'une datasheet
export const SPECS = [
  ["École 42", "Piscine réussie"],
  ["Tronc commun", "En cours"],
  ["Projets", "11"],
  ["Stages", "6"],
  ["10 km", "< 55 min"],
  ["5 km", "< 26 min"],
  ["Langages", "C · Python · JS · PHP"],
  ["Anglais", "Courant"],
];

export const PROJECTS = [
  { id: "VF-011", title: "Tetris en C", kind: "Programmation C",
    short: "Un Tetris complet, programmé en C.",
    points: ["Écrit entièrement en C", "Pièces, rotations, collisions, lignes complètes", "Premier vrai projet de jeu bas niveau"],
    tech: ["C", "Algorithmique"], link: null /* ajoute ton lien GitHub ici */ },
  { id: "VF-010", title: "ECORP — Elite Cyber Operations & Research Platform", kind: "Cybersécurité · Python",
    short: "Toolkit de 25+ outils en console, inspiré de Mr. Robot. Projet de fin de Bac Pro CIEL.",
    points: ["7 catégories : mots de passe, pentest, réseau, PC, OSINT, paramètres, aide légale", "Détection de mots de passe compromis (HIBP, k-anonymat SHA-1)", "DirBuster, scanner de sous-domaines, scan nmap, IP lookup, OSINT pseudo", "Bilingue FR/EN, licence GPL-2.0"],
    tech: ["Python 3.11", "Flet", "Custom Tkinter", "python-nmap"], link: "https://github.com/juto222/Projet-Lyc-e", demo: "https://ecorp-site.vercel.app" },
  { id: "VF-009", title: "ESP32 Marauder", kind: "Pentest sans fil · Embarqué",
    short: "ESP32 + antenne externe + écran tactile : outil portable de pentest Wi-Fi & Bluetooth.",
    points: ["Scan et sniffing Wi-Fi / Bluetooth", "Interface tactile embarquée", "Utilisé uniquement dans un cadre éducatif et légal"],
    tech: ["ESP32", "Marauder", "Wi-Fi", "Bluetooth"] },
  { id: "VF-008", title: "Gestionnaire de mots de passe", kind: "Sécurité · Python",
    short: "Coffre-fort chiffré 100 % local, protégé par un mot de passe maître.",
    points: ["Aucune donnée envoyée sur le réseau", "Interface Custom Tkinter, générateur intégré", "Logique de sécurité séparée de l'UI"],
    tech: ["Python", "Custom Tkinter", "Chiffrement"] },
  { id: "VF-007", title: "Serveur Debian auto-hébergé", kind: "Systèmes · Réseau",
    short: "Serveur monté pour ~25 € avec du matériel récupéré lors d'un stage chez Dell.",
    points: ["Installation et administration à distance de Debian", "Serveur web de test", "Évolutions prévues : RAID, sécurité, nouveaux services"],
    tech: ["Debian", "Linux", "Réseau local"] },
  { id: "VF-006", title: "Keylogger pédagogique", kind: "Sensibilisation · Python",
    short: "Module du toolkit, fait avec un camarade pour comprendre les spywares et mieux s'en défendre.",
    points: ["Tests uniquement sur machines autorisées, personnes consentantes", "Screenshots, presse-papier, détection de motifs", "Isolé et documenté comme outil de sensibilisation"],
    tech: ["Python", "Custom Tkinter", "Bot Discord"] },
  { id: "VF-005", title: "Borne d'arcade", kind: "Électronique · Fabrication",
    short: "Borne construite à la main : Raspberry Pi 4, RetroPie, écran Dell récupéré, structure en bois.",
    points: ["Découpe, ponçage, câblage, configuration — tout fait main", "~15 consoles émulées", "100 % fonctionnelle et autonome"],
    tech: ["Raspberry Pi 4", "RetroPie", "Électronique"] },
  { id: "VF-004", title: "Contrôleur audio Bluetooth", kind: "Embarqué · Python",
    short: "Stream Deck maison : potentiomètres + ESP32 pour régler le volume de chaque application.",
    points: ["L'ESP32 envoie les valeurs en Bluetooth", "Script Python en tâche de fond, lancé au démarrage de Windows", "Boîtier physique entièrement fonctionnel"],
    tech: ["ESP32", "Bluetooth", "Python"] },
  { id: "VF-003", title: "Montage PC custom", kind: "Hardware",
    short: "PC fixe assemblé de A à Z : Ryzen 5 5600X, RTX 4060, 32 Go DDR4.",
    points: ["Choix des pièces, assemblage, câblage propre", "Tests de stabilité et de performances"],
    tech: ["Ryzen 5 5600X", "RTX 4060", "Assemblage"] },
  { id: "VF-002", title: "Outil VBA — fusion & nettoyage Excel", kind: "Automatisation",
    short: "Macro qui fusionne des fichiers Excel, nettoie les données et tient un journal d'import.",
    points: ["Remplace une manipulation manuelle sujette aux erreurs", "Journal d'import horodaté"],
    tech: ["VBA", "Excel"] },
  { id: "VF-001", title: "Sites web", kind: "Front-end",
    short: "Plusieurs portfolios (dont celui-ci) et un site vitrine pour une entreprise familiale.",
    points: ["HTML, CSS, JavaScript natif", "Déployés sur Vercel"],
    tech: ["HTML", "CSS", "JavaScript", "Vercel"] },
];

// Le plus récent en premier. `hot: true` = mis en avant en orange.
export const EDU = [
  { when: "2026 →", what: "École 42 — tronc commun", note: "Admis après la Piscine. Apprentissage par projets, en C.", hot: true },
  { when: "Juil. 2026", what: "Piscine de l'école 42 — réussie", note: "Examen d'entrée : admis.", hot: true },
  { when: "Juin 2026", what: "Bac Pro CIEL — mention Bien", note: "sept. 2023 → juil. 2026" },
  { when: "Juin 2024", what: "Habilitation électrique B1V" },
  { when: "Juin 2023", what: "Brevet des collèges" },
  { when: "Mai 2023", what: "ASSR 2" },
  { when: "2022 — 2023", what: "Option Sciences Numériques", note: "Robotique, participation à un concours." },
  { when: "2019 — 2023", what: "Collège" },
];

export const EXP = [
  { when: "Nov.–déc. 2025", what: "Polyclinique Saint-Roch", note: "Stage · 10 nov. → 20 déc." },
  { when: "Mars–avr. 2025", what: "Dell", note: "Stage · 10 mars → 12 avr." },
  { when: "Sept.–oct. 2024", what: "Dell", note: "Stage · 30 sept. → 19 oct." },
  { when: "Juin 2024", what: "Recursurve", note: "Stage · 5 → 22 juin" },
  { when: "Janv.–fév. 2024", what: "Chaveroche", note: "Stage · 22 janv. → 10 fév." },
  { when: "Nov. 2023", what: "Point S", note: "Stage de 3e · 20 → 25 nov." },
  { when: "Étés 2022 → 2025", what: "Travail saisonnier", note: "Agriculture" },
];

export const STACK = [
  ["Code", ["C", "Python", "JavaScript", "HTML / CSS", "PHP", "VBA"]],
  ["Sécurité", ["Pentest (Kali)", "pfSense", "Cisco Packet Tracer", "OSINT", "Chiffrement"]],
  ["Systèmes", ["Debian", "Ubuntu", "Kali", "Arch", "Fedora", "Windows Server 2008", "Git"]],
  ["Électronique", ["Proteus", "Soudure traversante", "ESP32", "Raspberry Pi"]],
  ["Création", ["Unreal Engine 5", "Blender", "IA générative (Claude, Gemini, Copilot, DeepSeek)"]],
];

// Hors du travail — ce qui tourne quand l'écran est éteint.
export const HOBBIES = [
  ["Sport", ["Course à pied", "Vélo", "Randonnée", "Musculation"]],
  ["Cuisine", ["Poulet curry coco", "Gratin dauphinois", "Kibbeh (spécialité irakienne)"]],
  ["Musique & ciné", ["Piano", "Filmo Kubrick complète", "100+ films / an"]],
  ["Jeux vidéo", ["Valorant · Diamant", "Faceit (CS) · Niveau 6"]],
];

// Pays visités.
export const COUNTRIES = [
  "🇫🇷 France", "🇪🇸 Espagne", "🇵🇹 Portugal", "🇮🇹 Italie", "🇹🇭 Thaïlande",
  "🇹🇷 Turquie", "🇲🇦 Maroc", "🇳🇱 Pays-Bas", "🇪🇬 Égypte", "🇺🇸 États-Unis",
  "🇪🇸 Canaries", "🇬🇷 Crète", "🇪🇸 Majorque",
];
