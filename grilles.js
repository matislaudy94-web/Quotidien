// Fichier généré depuis grilles.json par : python3 generer_grilles_js.py
// Ne pas modifier à la main : modifier grilles.json, puis relancer le script.
window.QUOTIDIEN_GRILLES = [
 {
  "id": "g1",
  "titre": "Grille 1",
  "intention": "Grille d'accueil : catégories concrètes, aucun leurre volontaire. Mesure le plancher de difficulté.",
  "groupes": [
   {
    "categorie": "Fromages français",
    "difficulte": "facile",
    "mots": [
     "BRIE",
     "COMTÉ",
     "ROQUEFORT",
     "REBLOCHON"
    ],
    "explication": "Quatre fromages français très connus."
   },
   {
    "categorie": "Ustensiles de cuisine",
    "difficulte": "facile",
    "mots": [
     "LOUCHE",
     "PASSOIRE",
     "ÉCUMOIRE",
     "MANDOLINE"
    ],
    "explication": "Objets de cuisine. La mandoline est aussi un instrument, mais ici c'est la râpe à lames."
   },
   {
    "categorie": "___ de terre",
    "difficulte": "facile",
    "mots": [
     "POMME",
     "VER",
     "TREMBLEMENT",
     "MOTTE"
    ],
    "explication": "Pomme de terre, ver de terre, tremblement de terre, motte de terre."
   },
   {
    "categorie": "Coup de ___",
    "difficulte": "intermediaire",
    "mots": [
     "FOUDRE",
     "POUCE",
     "THÉÂTRE",
     "SOLEIL"
    ],
    "explication": "Coup de foudre, coup de pouce, coup de théâtre, coup de soleil."
   }
  ],
  "rattachements_plausibles": {}
 },
 {
  "id": "g2",
  "titre": "Grille 2",
  "intention": "Grille de jeux de langue : un groupe de mots cachés. Mesure si ce type d'association est perçu comme juste.",
  "groupes": [
   {
    "categorie": "Planètes du système solaire",
    "difficulte": "facile",
    "mots": [
     "MARS",
     "VÉNUS",
     "SATURNE",
     "JUPITER"
    ],
    "explication": "Quatre planètes. Mars est aussi un mois, sans autre groupe concerné ici."
   },
   {
    "categorie": "Danses",
    "difficulte": "intermediaire",
    "mots": [
     "SALSA",
     "TANGO",
     "VALSE",
     "JAVA"
    ],
    "explication": "La java est une danse de bal musette."
   },
   {
    "categorie": "Avoir le ___ (un état d'âme)",
    "difficulte": "intermediaire",
    "mots": [
     "CAFARD",
     "BOURDON",
     "BLUES",
     "TRAC"
    ],
    "explication": "Avoir le cafard, le bourdon, le blues (être triste), le trac (avoir peur avant de se produire)."
   },
   {
    "categorie": "Un animal caché dans le mot",
    "difficulte": "difficile",
    "mots": [
     "BOUCHERIE",
     "CHEVALET",
     "LOUPE",
     "PIRATE"
    ],
    "explication": "BOUC-herie, CHEVAL-et, LOUP-e, pi-RAT-e."
   }
  ],
  "rattachements_plausibles": {
   "BLUES": [
    "Danses"
   ],
   "CAFARD": [
    "animal (au sens propre, pas caché)"
   ],
   "BOURDON": [
    "animal (au sens propre, pas caché)"
   ]
  }
 },
 {
  "id": "g3",
  "titre": "Grille 3",
  "intention": "Grille à leurre volontaire : plusieurs fruits rouges sont aussi des nuances de rouge. La solution reste unique. Mesure si un leurre est perçu comme astucieux ou injuste.",
  "groupes": [
   {
    "categorie": "Fruits rouges",
    "difficulte": "facile",
    "mots": [
     "FRAISE",
     "FRAMBOISE",
     "CERISE",
     "GROSEILLE"
    ],
    "explication": "Quatre fruits rouges."
   },
   {
    "categorie": "Écrivains français",
    "difficulte": "facile",
    "mots": [
     "HUGO",
     "ZOLA",
     "BALZAC",
     "PROUST"
    ],
    "explication": "Victor Hugo, Émile Zola, Honoré de Balzac, Marcel Proust."
   },
   {
    "categorie": "Porte-___",
    "difficulte": "intermediaire",
    "mots": [
     "MONNAIE",
     "CLÉS",
     "PAROLE",
     "BONHEUR"
    ],
    "explication": "Porte-monnaie, porte-clés, porte-parole, porte-bonheur."
   },
   {
    "categorie": "Nuances de rouge",
    "difficulte": "intermediaire",
    "mots": [
     "BORDEAUX",
     "CARMIN",
     "GRENAT",
     "VERMILLON"
    ],
    "explication": "Bordeaux, carmin, grenat, vermillon. Cerise, fraise, framboise et groseille sont aussi des couleurs, mais il faut les quatre fruits pour compléter l'autre groupe : le leurre est volontaire."
   }
  ],
  "rattachements_plausibles": {
   "CERISE": [
    "Nuances de rouge"
   ],
   "FRAISE": [
    "Nuances de rouge"
   ],
   "FRAMBOISE": [
    "Nuances de rouge"
   ],
   "GROSEILLE": [
    "Nuances de rouge"
   ]
  }
 }
];
