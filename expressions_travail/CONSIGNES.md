# Banque du mini-jeu « Expression mystère » (jeu Quotidien)

Quotidien est un jeu de mots français grand public (adultes francophones, pas un public scolaire). Nouveau mini-jeu :
le joueur voit une expression française connue avec UN mot manquant (« Avoir le cœur sur la ___ »), un indice sur son
sens, et 4 propositions (le bon mot + 3 leurres). Il choisit, valide, puis lit le sens et un exemple. Partie = 5 expressions.

## À produire
`/home/claude/quotidien/expressions.json` (UTF-8, ensure_ascii=False, indent=1) :
{
 "version": 1,
 "expressions": [
  { "id": "x001", "difficulte": "facile", "categorie": "corps",
    "texte": "Avoir le cœur sur la ___",
    "mot": "MAIN",
    "complete": "Avoir le cœur sur la main",
    "indice": "Se dit d'une personne très généreuse.",
    "leurres": ["JOUE", "TÊTE", "PEAU"],
    "sens": "Être généreux, toujours prêt à donner ou à rendre service sans rien attendre en retour.",
    "exemple": "Elle a le cœur sur la main : elle a prêté sa voiture à un voisin qu'elle connaît à peine.",
    "variantes": [] }
 ]
}
- **50 expressions** : 20 « facile », 20 « intermediaire », 10 « difficile ». Identifiants x001 à x050.
- `categorie` parmi : quotidien, animaux, corps, nourriture, emotions, travail, chance, imagees, difficiles (varier ;
  ne pas forcer une répartition au détriment de la qualité).
- `texte` : l'expression à l'infinitif (ou sa forme usuelle) avec exactement un `___` à la place du mot manquant.
  `complete` : la même avec le mot (en minuscules, accents corrects). `mot` et `leurres` en MAJUSCULES accentuées.
- `indice` : décrit le SENS ou la situation d'usage, sans contenir le mot ni un leurre. 1 phrase courte.
- `sens` : 60 à 200 caractères, explication claire et exacte. `exemple` : une phrase naturelle qui emploie l'expression
  (conjuguée si besoin). `variantes` : autres formes réellement admises du MOT (souvent vide) — pour une future saisie libre.

## Règles éditoriales (bloquantes)
1. **Expression réelle et courante en France**, sens exact, orthographe exacte. N'invente rien. Pas de variante régionale
   non signalée. Les faciles doivent être connues de presque tout le monde ; les difficiles restent des expressions
   réelles et utilisées (pas de vocabulaire rare inutile).
2. **Un seul mot possible** : aucun leurre ne doit former une expression réelle et admise avec le même cadre ET le même
   sens. Ex. pour « Avoir un ___ dans la gorge » (CHAT), éviter un leurre qui marcherait aussi. Vérifie chaque leurre.
3. **Leurres plausibles** : même nature et, si possible, même genre/nombre que le mot (la phrase reste grammaticale),
   du même univers (pour « tomber dans les POMMES » : POIRES, PRUNES… plutôt que des mots absurdes). Pas d'ambiguïté
   injuste : le bon mot doit l'emporter clairement pour quelqu'un qui connaît l'expression.
4. **Pas d'étymologie inventée** : explique le sens ; si tu évoques une origine, seulement si elle est solidement établie.
5. **Le mot à trouver est un seul mot** (pas de mot composé avec espace). Pas de doublon d'expression dans la banque.
6. **PROTECTION DU TEST (bloquant)** : le calendrier du test (`/home/claude/quotidien/grilles.json`) contient des
   groupes d'expressions à trou (« Prendre la ___ », « Donner sa ___ », « Coup de ___ », « Mal de ___ »…). Aucune
   expression du mini-jeu ne doit aider à les résoudre. Le script `python3 /home/claude/quotidien/verifier_expressions.py`
   refuse : une expression qui contient le cadre d'un groupe du calendrier ET un mot de ce groupe (ex. « Donner sa langue
   au chat » → groupe « Donner sa ___ » contient LANGUE) ; un mot à trouver qui appartient à un groupe d'expressions du
   calendrier (ex. MOUCHE, FUITE, CHAT…). Lis la liste de ces groupes dans grilles.json avant d'écrire.

## Avant de rendre
Lance `python3 /home/claude/quotidien/verifier_expressions.py /home/claude/quotidien/expressions.json` jusqu'à « OK ».
Puis relis chaque expression selon les règles 1 à 3 (pour chaque leurre : « est-ce que ça se dit aussi ? »).
Compte rendu : nombre d'expressions, et celles dont tu doutes le plus (mieux vaut remplacer que garder une douteuse).
Ne modifie aucun autre fichier du projet (scripts de travail éventuels dans /home/claude/quotidien/expressions_travail/).
