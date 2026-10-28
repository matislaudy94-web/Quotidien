# Quotidien — prototype de test

Jeu de mots quotidien : 16 mots à répartir en 4 groupes de 4. Ce prototype sert uniquement à tester l'intérêt réel de joueurs (environ 30), pour 0 €.

## Ce qu'il contient

| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu (mobile et ordinateur, sans téléchargement). |
| `admin.html` | Tableau de bord administrateur (protégé par un code). |
| `grilles.json` | Les 3 grilles (source). Après modification : `python3 verifier_grilles.py` puis `python3 generer_grilles_js.py`. |
| `grilles.js` | Les grilles, générées depuis `grilles.json` (ne pas modifier à la main). |
| `config.js` | Adresse de la base Supabase et clé **publique**. |
| `api.js` | Appels à la base. |
| `verifier_grilles.py` | Vérifie chaque grille : 16 mots distincts, 4×4, et **une seule solution** compte tenu des leurres déclarés. |
| `tests/` | Serveur de test local (base simulée) et tests automatisés du parcours complet. |

## Architecture (gratuite)

- **Pages web statiques**, sans dépendance. Hébergement gratuit (GitHub Pages).
- **Base de données** : projet Supabase gratuit `quotidien` (Paris), distinct du projet de l'appli sport.
  - Les tables ne sont **pas lisibles** avec la clé publique.
  - Les joueurs ne peuvent qu'appeler 4 fonctions d'enregistrement.
  - Les fonctions d'administration exigent le code administrateur.
- Les résultats de **tous** les testeurs sont centralisés dans cette base. Ce n'est vrai **que** pour la version hébergée connectée à Supabase. Ouvrir `index.html` directement depuis un ordinateur ne fonctionne pas (le navigateur bloque les appels) : utiliser l'adresse en ligne.

## Lancer un test

1. Ouvrir `admin.html` (adresse en ligne) et entrer le code administrateur.
2. **Créer une session** : nom et premier jour.
   - Le calendrier se remplit tout seul : grille 1 le premier jour, grille 2 le lendemain, grille 3 le surlendemain.
   - Le changement de jour se fait à minuit, heure de Paris.
3. **Créer les participants** (par exemple 30). Ils sont répartis automatiquement en groupe R et groupe S, en alternance.
4. Pour chaque testeur, cliquer **« Copier le lien »** au moment où on le lui envoie, puis coller ce lien dans le message.
   - Un lien différent par personne.
   - Le clic enregistre « lien envoyé ».
5. **Chaque matin**, ouvrir la section « Rappels à envoyer aujourd'hui ». Elle liste uniquement les membres du groupe R qui ont demandé une autre grille.
   - Générer le lien de rappel et l'envoyer.
   - **Ne jamais envoyer de rappel au groupe S.**
6. Pour tester soi-même sans fausser les chiffres, utiliser le lien **« Jouer en mode démo »** : rien n'est enregistré, et on peut recommencer une grille.

### Message type à envoyer aux testeurs

> Salut ! Je teste un petit jeu de mots en français : 16 mots à classer en 4 groupes, environ 3 minutes. C'est anonyme, aucune inscription. Voici ton lien personnel : [lien]. Merci !

Ne pas présenter le jeu comme « le mien » si on veut des avis francs.

## Définitions des mesures (à lire avant d'interpréter)

| Mesure | Définition exacte |
|---|---|
| Lien envoyé | L'administrateur a cliqué « Copier le lien » pour ce participant. |
| A ouvert | Au moins une visite enregistrée. **Ce n'est pas une preuve d'intérêt.** |
| A commencé | A sélectionné au moins un mot. |
| A terminé | A trouvé les 4 groupes ou épuisé ses 4 erreurs. |
| A demandé une autre grille | A cliqué « Oui, je veux jouer la prochaine ». |
| **Retour après rappel** | Visite un jour ultérieur, via un lien de rappel généré pour lui dans les 24 h précédentes. |
| Retour rappel probable | Visite un jour ultérieur **sans** lien de rappel, alors qu'un rappel lui a été envoyé dans les 24 h précédentes. Ce n'est **pas** compté comme spontané. |
| **Retour spontané** | Visite un jour ultérieur à sa visite précédente, sans aucun rappel envoyé dans les 24 h précédentes. L'entrée peut être un favori, son lien personnel, ou l'adresse tapée. |
| Revisite le même jour | Ne compte pas comme un retour. |
| A cliqué « Inviter » | Clic sur le bouton de partage (partage natif ou copie du message). Le joueur a **tenté** de partager ; on ne sait pas s'il a vraiment envoyé le message. |
| **A fait venir un invité qui a joué** | Une personne est arrivée par son lien d'invitation et a commencé une partie. C'est le partage **effectif**. |
| Organique | Personne arrivée sur l'adresse du jeu sans lien personnel ni invitation. |

Le classement des visites est fait **par la base**, pas par le navigateur du joueur.

## Exporter les résultats

Dans `admin.html`, section **Export** :
- **Participants (CSV)** : une ligne par participant avec toutes les mesures.
- **Tous les événements (CSV)** : une ligne par événement brut.

Le séparateur est le point-virgule ; les fichiers s'ouvrent dans Excel ou Google Sheets.

## Données enregistrées (vie privée)

- Identifiant aléatoire de 6 caractères.
- Visites (date, type d'entrée).
- Essais (mots choisis), erreurs, groupes trouvés, durée.
- Clics sur « inviter » et « prochaine grille ».
- Réponses au questionnaire.

Aucun nom, e-mail, téléphone ou adresse. Pas de publicité, pas d'outil de suivi tiers. Les joueurs voient cette explication en bas de page.

## Limites connues (honnêtes)

1. **Identification d'un joueur.** Un joueur est reconnu par son lien personnel (`?p=…`) ou par la mémoire de son navigateur.
   - S'il revient depuis un autre appareil ou un autre navigateur **sans** son lien personnel, il apparaît comme un nouveau participant « organique ». Son retour spontané n'est alors pas compté : les chiffres de retour sont des **minimums**.
   - Les navigateurs intégrés à Instagram ou Messenger ont leur propre mémoire. Le lien personnel affiché en fin de partie limite ce problème.
2. **« Retour spontané » ne prouve pas l'absence de toute incitation.** Un testeur peut avoir été relancé par un ami, ou par un message de groupe que l'administrateur n'a pas enregistré. Seuls les rappels générés dans le tableau de bord sont connus.
3. **Partage.** Le clic sur « Inviter » est mesuré, pas l'envoi réel. Seules les arrivées par le lien d'invitation prouvent un partage.
4. **Solutions visibles dans le code de la page** pour un utilisateur averti. C'est sans conséquence pour un test de 30 personnes, mais à corriger avant un lancement public.
5. **Abus.** La clé publique permet d'appeler les fonctions d'enregistrement. Des limites existent : 1 000 événements par participant, 300 arrivées invitées ou organiques par session. Un acteur malveillant pourrait néanmoins ajouter de faux événements. C'est acceptable pour un test privé, pas pour un lancement.
6. **Projet Supabase gratuit.** Il est mis en pause après une période d'inactivité (environ une semaine, selon les conditions actuelles de Supabase). Il faut le réactiver depuis le tableau de bord Supabase avant un nouveau test.
7. **Le code administrateur** est vérifié par la base (haché). Le changer nécessite une commande SQL : demander à Claude.
8. **Mode démo.** Le bouton « Recommencer » n'existe qu'en mode démo, pour ne pas fausser les données des vrais testeurs.

## Tests effectués

`node tests/test_parcours.js` lance un serveur local avec une base **simulée**, puis un navigateur Chromium en émulation iPhone. Ces tests vérifient :
- la création de la session et des participants (alternance R/S) ;
- l'enregistrement de « lien envoyé » ;
- une victoire avec une erreur, puis une défaite avec la solution révélée ;
- qu'un essai répété ne coûte pas d'erreur ;
- le questionnaire et la conservation de la partie après rechargement ;
- la création d'un invité ;
- le lendemain : retour après rappel (groupe R) et retour spontané (groupe S) ;
- l'absence du groupe S dans les rappels ;
- l'entonnoir, les résultats par grille et les deux exports CSV ;
- le mode démo sans enregistrement ;
- l'absence de débordement sur iPhone SE et iPhone 13.

Le classement des visites et les droits d'accès ont été testés **directement sur la vraie base** :
- spontané, après rappel et rappel probable ;
- code faux refusé, tables illisibles, fonctions internes inaccessibles.

**Reste à vérifier à la main après la mise en ligne** :
- une partie sur un vrai iPhone (Safari) ;
- l'ouverture d'un lien depuis WhatsApp ou Instagram ;
- le partage natif (feuille de partage iOS).
