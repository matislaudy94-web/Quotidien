# Réécrire les explications des groupes (jeu Quotidien)

Quotidien est un jeu de mots français : 16 mots à répartir en 4 groupes de 4. Après une grille RÉUSSIE, chaque groupe s'affiche
avec sa catégorie, ses 4 mots et une « explication ». Aujourd'hui beaucoup d'explications se contentent de répéter la catégorie
(« Quatre félins. », « Quatre sortes de pâtes. ») ou d'énumérer (« Vin blanc, mariage blanc, bulletin blanc, examen blanc. »).
Le fondateur trouve ça trop court. Il faut qu'en lisant l'explication on APPRENNE quelque chose ou qu'on COMPRENNE le lien.

## Ce que doit faire une explication
- En français, 1 ou 2 phrases, **entre 70 et 190 caractères** (la carte est étroite sur téléphone ; jamais plus de 200).
- Ne jamais simplement répéter la catégorie. Dire ce qui relie vraiment les 4 mots, avec un détail utile :
  - expressions / mots à compléter (« ___ blanc ») : donner le SENS des expressions les moins évidentes
    (ex. « Un mariage blanc est fictif, un bulletin blanc ne désigne aucun candidat, un examen blanc sert d'entraînement. »)
  - mots cachés, doubles sens, jeux de lettres : montrer le mécanisme pour chaque mot si possible (« PASSABLE cache SABLE… »)
  - catégories simples (félins, pâtes, planètes…) : un détail distinctif court et CERTAIN (« Le guépard est le plus rapide
    des quatre ; le lion est le seul à vivre en groupe. »), ou ce qui les distingue des intrus de la grille.
- Si la grille déclare des pièges (`rattachements_plausibles` : un mot qui semblait aller ailleurs), les mentionner brièvement
  dans l'explication du groupe concerné : « Piège : MARRON est aussi une couleur, mais il complète les fruits à coque. »
- Les mots de la grille s'écrivent en MAJUSCULES comme dans la grille. Pas d'emoji. Ton simple et chaleureux, grand public.
- **Exactitude absolue** : n'écris que des faits dont tu es sûr. Pas d'étymologie inventée, pas de chiffre approximatif.
  En cas de doute, choisis un détail plus simple et sûr. Une explication fausse est pire qu'une explication courte.
- L'explication doit correspondre EXACTEMENT à la catégorie et aux 4 mots du groupe (ne rien changer d'autre dans les grilles).
- Une explication déjà riche et juste (plus de 70 caractères, qui explique vraiment) peut être gardée telle quelle ou améliorée.

## Format de sortie
Écris UN fichier JSON (UTF-8, `ensure_ascii=False`) au chemin indiqué : un objet { "<id de grille>": [expl1, expl2, expl3, expl4] }
dans le MÊME ORDRE que les groupes de la grille, pour TOUTES les grilles de ton lot. Ne modifie aucun autre fichier.
Avant de rendre, vérifie avec un petit script Python : toutes les grilles du lot présentes, 4 explications chacune,
longueurs entre 70 et 200 caractères. Relis ensuite chaque explication une dernière fois pour l'exactitude.
Rends un court compte rendu : nombre de grilles traitées, et les explications dont tu n'es pas totalement sûr (s'il y en a).
