# Banque du mini-jeu « Le mot intrus » (jeu Quotidien)

Quotidien est un jeu de mots français grand public. Nouveau mini-jeu : le joueur voit 4 mots ; 3 partagent une relation
claire, le 4e est l'intrus. Il touche l'intrus, puis lit une explication. Une partie = 5 questions.

## À produire
Le fichier JSON `/home/claude/quotidien/intrus.json` (UTF-8, ensure_ascii=False, indent=1) :
{
 "version": 1,
 "questions": [
  { "id": "i001", "difficulte": "facile", "theme": "nature",
    "consigne": "Trouve l'intrus.",
    "mots": ["POMME", "POIRE", "CERISE", "COURGETTE"],
    "intrus": "COURGETTE",
    "critere": "POMME, POIRE et CERISE sont des fruits.",
    "explication": "La COURGETTE se cuisine comme un légume ; POMME, POIRE et CERISE sont des fruits qu'on croque au dessert." }
 ]
}
- **60 questions** : 25 « facile », 23 « moyen », 12 « difficile ». Identifiants i001 à i060.
- `mots` : 4 mots distincts, en MAJUSCULES avec accents (É, È, Ê, À, Ç…), l'intrus placé à une position variée (pas toujours en dernier).
- `critere` : une phrase qui dit ce que partagent les 3 autres (affichée après la réponse).
- `explication` : 70 à 190 caractères, dit pourquoi l'intrus n'en fait pas partie. Exacte, vérifiable, ton simple.
- `consigne` : « Trouve l'intrus. » par défaut. **Si plusieurs lectures sont possibles, la consigne précise le critère**
  (ex. « Trouve l'intrus : pense au sens des mots, pas à leur orthographe. » ou « Trouve l'intrus parmi ces métiers. »).
- `theme` : un mot court (nature, cuisine, géographie, langue, sport, culture, sciences, maison, métiers, expressions…).
- Variété : pas plus de 5 questions sur un même thème ; aucun mot utilisé dans deux questions.

## Règles éditoriales (bloquantes)
1. **Une seule réponse raisonnablement défendable.** Pour CHACUN des 4 mots, demande-toi : « pourrait-on défendre que
   CE mot est l'intrus, par un autre critère évident ? » (sens, catégorie, genre grammatical, nombre de lettres, première lettre,
   nature du mot, usage…). Si oui pour un autre mot que l'intrus, change la question. Exemple de piège à éviter :
   POMME — POIRE — BANANE — CAROTTE : la BANANE est aussi le seul fruit exotique ; on préfère des fruits homogènes.
2. Les 3 autres doivent partager une relation **plus précise** que celle qui inclut l'intrus (pas « ce sont tous des objets »).
3. Mots connus du grand public (adulte français moyen). Pas de classification scientifique contestable (tomate fruit ou
   légume, champignon plante, baleine poisson…), pas de piège fondé sur une ambiguïté.
4. Difficulté : « facile » = catégorie évidente ; « moyen » = relation moins immédiate (expressions, usages, origine) ;
   « difficile » = relation fine mais incontestable une fois expliquée (mots cachés, homonymes, formation des mots…).
   Les questions de forme (mot caché, anagramme, nombre de lettres) doivent l'annoncer dans la consigne.
5. **Aucun mot du calendrier du test** : n'utilise aucun mot présent dans `/home/claude/quotidien/grilles.json`
   (sinon le mini-jeu pourrait aider à résoudre une grille future du test). Calcule cette liste avec Python et vérifie.
6. Faits certains uniquement : pas de superlatif discutable, pas d'étymologie incertaine.

## Avant de rendre
Vérifie avec un script Python : 60 questions, ids uniques, 4 mots distincts, intrus dans mots, longueurs, répartition des
difficultés, aucun mot répété entre questions, aucun mot du calendrier. Puis relis chaque question selon la règle 1.
Compte rendu : nombre de questions, et celles dont tu doutes le plus (il vaut mieux en remplacer que d'en garder une douteuse).
