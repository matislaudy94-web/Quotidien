# Vérification des explications (jeu Quotidien)

Les explications des groupes viennent d'être réécrites (consignes : /home/claude/quotidien/expl/CONSIGNES.md, à lire).
Elles s'affichent sous chaque groupe quand le joueur a réussi la grille. Tu es le vérificateur : tu ne les as pas écrites.

Pour CHAQUE explication de ton lot, vérifie :
1. **Exactitude** : chaque fait est vrai (définitions, sens des expressions, géographie, histoire, étymologies, chiffres).
   Une étymologie incertaine ou une légende présentée comme un fait = erreur. Un superlatif discutable = erreur.
2. **Cohérence avec le groupe** : l'explication correspond à la catégorie et aux 4 mots ; les mécanismes de mots cachés
   sont justes lettre par lettre (« d-INDE » : DINDE contient bien INDE) ; aucun mot de la grille n'est mal orthographié.
3. **Pièges** : quand un « Piège » est cité, le mot cité est bien dans la grille et l'affirmation est juste.
4. **Forme** : 60 à 200 caractères, français correct, pas de faute, pas d'emoji, mots de la grille en MAJUSCULES.

N'invente pas de problème : une explication juste et claire, même simple, est validée.
Tu NE modifies PAS les fichiers de grilles. Écris tes corrections dans le fichier JSON indiqué :
{ "<id de grille>": { "<index du groupe 0-3>": "<nouvelle explication complète, 70 à 190 caractères>" } }
(objet vide {} si rien à corriger). Chaque nouvelle explication doit elle-même être sûre et respecter les consignes.
Compte rendu final : nombre d'explications relues, liste des corrections avec une phrase de justification chacune.
