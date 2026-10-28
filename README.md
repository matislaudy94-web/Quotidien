# Quotidien — prototype de test

Jeu de mots quotidien : 16 mots à répartir en 4 groupes de 4. Ce prototype sert uniquement à tester l'intérêt réel de joueurs (environ 30), pour 0 €.

## Ce qu'il contient

| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu (mobile et ordinateur, sans téléchargement). |
| `admin.html` | Tableau de bord administrateur (protégé par un code). |
| `grilles.json` | Les 45 grilles (source), 15 faciles / 15 intermédiaires / 15 difficiles, chacune avec un champ `niveau`. Les grilles 31 à 45 sont dans `nouvelles_grilles.json` (copie de travail, même contenu). Après modification : `python3 verifier_grilles.py` puis `python3 generer_grilles_js.py`. |
| `grilles.js` | Les grilles, générées depuis `grilles.json` (ne pas modifier à la main). |
| `progression.js` | Progression du joueur : barème d'XP, niveaux, objectifs, badges, statistiques. Seule source de vérité, tout est recalculé depuis le journal local des parties terminées. |
| `config.js` | Adresse de la base Supabase et clé **publique**. |
| `api.js` | Appels à la base. |
| `verifier_grilles.py` | Vérifie chaque grille : 16 mots distincts, 4×4, niveau renseigné, aucun mot répété d'une grille à l'autre, et **une seule solution** compte tenu des leurres déclarés (`rattachements_plausibles`). |
| `tests/` | Serveur de test local (base simulée) et tests automatisés du parcours complet. |

## La banque de grilles

- 45 grilles, 3 niveaux (15 / 15 / 15) : g1–g30 vérifiées avant lancement, g31–g45 ajoutées le 28/10/2026 (deux relectures indépendantes, 3 bloquants corrigés : « canon de neige », BOUGIE pièce de voiture, VIENNOISERIE ne contient pas VIENNE). Le niveau n'est **pas** affiché au joueur, pour ne pas influencer la difficulté ressentie que mesure le questionnaire.
- Chaque grille passe deux contrôles : le script `verifier_grilles.py` (structure, unicité de la solution en tenant compte des pièges déclarés, aucun mot réutilisé entre grilles) et une relecture indépendante (recherche d'une autre répartition défendable, expressions fausses ou rares, mots cachés involontaires, calibrage de la difficulté). Les grilles à mots cachés sont en plus passées à un scan automatique des 16 mots (notes, couleurs, pays, prénoms).
- Ces contrôles réduisent fortement le risque d'injustice mais ne le suppriment pas : une grille jugée injuste par plusieurs testeurs (question « associations justes ? » et commentaires) doit être retirée ou corrigée **entre deux sessions**, jamais pendant.
- Une grille à retirer : la supprimer du calendrier de la session plutôt que du fichier, pour garder la numérotation stable.

## La progression du joueur (XP, niveaux, objectifs, badges)

**Principe.** Le navigateur garde un *journal* des parties terminées : une entrée par grille, à la **première** partie terminée seulement. XP, niveau, objectifs, badges et statistiques sont **recalculés** à chaque affichage à partir de ce journal (`progression.js`). Conséquences : rejouer une grille ne rapporte rien ; recharger la page ne crédite rien deux fois ; un objectif ou un badge ne peut pas être validé deux fois ; le changement de jour ne déclenche aucune récompense. Il n'existe aucun compteur d'XP stocké séparément, donc rien à désynchroniser.

**Barème d'XP** (par grille, une seule fois) :

| Action | XP |
|---|---|
| Grille résolue (4 groupes trouvés) | facile 50 · intermédiaire 75 · difficile 100 |
| Résolue sans aucune erreur | +25 |
| Partie terminée sans résoudre (4 erreurs) | 15 |
| Objectif réalisé | de 30 à 250 (voir ci-dessous) |
| Badge débloqué | +10 |
| Indice utilisé | −15 par indice (la partie rapporte au moins 15) ; un indice fait perdre le bonus « sans erreur » |

**Niveaux** (déblocage par XP uniquement, jamais par jours consécutifs ; la grille du jour reste accessible quel que soit le niveau) :

| N° | Nom | XP requis |
|---|---|---|
| 1 | Débutant | 0 |
| 2 | Curieux | 120 |
| 3 | Explorateur | 350 |
| 4 | Stratège | 700 |
| 5 | Maître des mots | 1 200 |

**Objectifs** (une seule fois chacun) : Premier défi (terminer 1 grille, 30 XP) · Esprit logique (résoudre 1 grille sans erreur, 50) · Fin limier (résoudre 3 grilles, 60) · Explorateur (terminer 5 grilles différentes, 80) · Trois sans-faute (résoudre 3 grilles sans erreur, 120) · Marathon (terminer 15 grilles, 150) · Grand chelem (résoudre 25 grilles, 250). L'accueil montre au plus 3 objectifs non réalisés.

**Badges** (+10 XP chacun) : Première grille (terminer une partie) · Sans-faute (résoudre sans erreur) · Tête froide (résoudre après 3 erreurs) · Éclair (résoudre en moins de 90 s) · Costaud (résoudre une grille difficile) · Persévérant (terminer 10 grilles) · Collectionneur (résoudre 20 grilles) · Maître des mots (atteindre le niveau 5).

**Pas de récompense liée à la connexion quotidienne.** La série de jours consécutifs est affichée dans les statistiques, mais ne rapporte ni XP ni badge : récompenser le retour quotidien rendrait la mesure du « retour spontané » ininterprétable.

**Indices.** Un indice met en évidence deux mots d'un même groupe non trouvé (le plus facile restant), sans donner la catégorie. Un indice par grille ; un second se débloque après 2 erreurs. Événement `indice` tracé côté serveur (numéro, mots, erreurs au moment).

**Chronomètre.** Temps de réflexion affiché pendant la partie, sans limite. Il ne tourne que lorsque la grille est à l'écran et la page visible (pause si on quitte vers l'accueil ou si le téléphone est verrouillé). La durée `duree_s` des événements `fin` est ce temps actif ; `duree_brute_s` garde l'écart brut entre premier mot et fin.

**Statistiques** : grilles terminées (dont résolues), taux de réussite = résolues ÷ terminées, groupes trouvés, erreurs, XP et niveau, meilleur résultat (grille résolue avec le moins d'erreurs, puis la plus rapide), série actuelle et record. Une partie seulement commencée n'entre dans aucune statistique.

**Trace côté serveur.** À chaque crédit, un événement `recompense` est envoyé (xp gagnée, objectifs et badges débloqués, niveau avant/après, XP total). Il sert à l'analyse ; le calcul reste local.

**Limites de la progression**
- Stockage local (navigateur) : pas de synchronisation entre appareils ou navigateurs, pas de compte. Un joueur qui change d'appareil repart de zéro côté progression (ses parties restent dans la base de test). Effacer les données du navigateur efface la progression.
- Le parcours ne propose pas de grilles supplémentaires : les 45 grilles sont réservées au calendrier quotidien (jours 1 à 45). Pour ajouter un mode « entraînement », il faudra une **seconde banque de grilles** distincte du calendrier (même format `grilles.json`, vérifiée de la même façon), sinon les joueurs découvriraient la grille de demain en avance.
- Le mode démo a sa propre progression (profil `demo`), réinitialisable depuis « Mes stats » ; elle ne touche jamais celle d'un participant.
- La progression modifie l'expérience testée : à partir du 28/10, on teste « Quotidien avec progression », pas le jeu nu.
- **La difficulté n'est pas montrée aux participants** (ni l'étiquette de la grille, ni le maximum d'XP avant de jouer, ni le niveau de chaque groupe dans la solution), pour ne pas suggérer la réponse « difficulté ressentie » du questionnaire. Elle reste visible en mode démo et dans le tableau de bord. Après la partie, l'XP gagnée (50 / 75 / 100) permet à un joueur qui connaît le barème de déduire le niveau : c'est accepté.

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
   - Le calendrier se remplit tout seul : une grille par jour dans l'ordre du fichier (grille 1 le premier jour, … grille 30 le trentième). Il reste modifiable dans « Modifier le calendrier ».
   - L'ordre des 45 grilles alterne volontairement les niveaux sur les premiers jours (1 facile, 2 intermédiaire, 3 difficile) ; le protocole de décision à 14 jours reste inchangé.
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

> Salut ! Je teste un petit jeu de mots en français : 16 mots à classer en 4 groupes, environ 3 minutes. C'est anonyme, aucune inscription. Voici ton lien : [lien]. **Ce lien est personnel. Pour inviter quelqu'un à jouer, utilise le bouton de partage à la fin de la partie.** Merci !

Ce message est copiable d'un clic dans le tableau de bord. Ne pas présenter le jeu comme « le mien » si on veut des avis francs.

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
| ⚠ Appareils | Nombre de navigateurs différents ayant ouvert ce lien personnel (identifiant aléatoire par navigateur). 2 ou plus = lien transféré **ou** même personne sur deux appareils : impossible de trancher, à lire avec prudence. |

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

## Limites de l'expérimentation (à lire avant d'interpréter les résultats)

**Les grilles sont-elles présentées dans le même ordre à tout le monde ?**
Oui : grille 1 le premier jour, grille 2 le deuxième, grille 3 le troisième, pour tous. Conséquence : on ne peut pas séparer « la grille 2 plaît moins » de « au deuxième jour, on revient moins ». Avec ~30 personnes, un tirage au sort de l'ordre n'aurait de toute façon pas assez de puissance. Un participant qui rate un jour joue la grille du jour, pas celle qu'il a manquée (sauf « grille forcée » par l'administrateur).

**Comment distingue-t-on un retour spontané d'un retour après sollicitation ?**
C'est la base qui classe chaque visite, pas le navigateur :
- *retour après rappel* : la visite arrive par un lien de rappel généré dans le tableau de bord moins de 24 h avant ;
- *retour rappel probable* : un rappel a été généré pour cette personne dans les 24 h, mais elle est venue sans cliquer dessus ;
- *retour spontané* : visite un autre jour que la précédente, sans aucun rappel généré dans les 24 h.
Le **compte à rebours** affiché en fin de partie fait partie du jeu : il n'est pas un rappel et ne change pas ce classement. En revanche, tout message envoyé au joueur en dehors du tableau de bord (un ami qui le relance, un message de groupe) est invisible pour le système : les retours « spontanés » peuvent inclure ces cas. Ne jamais envoyer de rappel au groupe S.

**Comment sont comptabilisées les invitations ?**
Deux niveaux : le clic sur « Inviter » (intention : partage natif ou copie du message) et l'*invitation effective* (une personne arrive par le lien `?inv=ID` du joueur et commence une partie). Seul le second prouve un partage. Un lien personnel transféré à la place du lien d'invitation n'est pas compté comme invitation ; il est signalé par la colonne ⚠ Appareils.

**Comment éviter les doublons dans les statistiques ?**
- Une personne = un identifiant, compté une seule fois par ligne de l'entonnoir.
- Une partie terminée deux fois (rechargement) n'est comptée qu'une fois par grille (première fin).
- Une revisite le même jour ne compte pas comme retour.
- Le bouton « Réessayer » d'un chargement lent ne relance jamais une requête déjà en cours.
- Reste un cas : si le joueur **recharge la page** pendant la toute première création de son identifiant, un identifiant orphelin (sans visite) peut être créé côté serveur. Il apparaît comme participant « organique » sans aucune visite et se repère donc facilement.

**Les données sont-elles conservées entre plusieurs visites ?**
Oui, côté serveur, par identifiant. Le navigateur garde aussi l'identifiant et l'état de la partie en cours. Si la personne revient depuis un **autre appareil ou un autre navigateur** (y compris le navigateur intégré d'Instagram ou de Messenger) **sans son lien personnel**, elle devient un nouveau participant « organique » : son retour n'est pas compté. Les chiffres de retour sont donc des **minimums**. Si elle revient **avec** son lien personnel, elle est reconnue, et le tableau de bord indique 2 appareils.

**Que se passe-t-il si le chargement échoue ?**
Après 8 s sans réponse : message + bouton « Réessayer » (qui attend la requête en cours plutôt que d'en lancer une autre). Après 20 s, la requête est abandonnée côté navigateur et une vraie relance devient possible. Les événements de jeu (essais, fin, questionnaire) sont mis en file d'attente dans le navigateur et renvoyés à la prochaine action ou visite : une coupure réseau pendant la partie ne les perd pas, sauf si le joueur efface les données de son navigateur avant qu'ils soient envoyés.

**Quelles mesures sont réellement fiables avec ~30 participants ?**
- Fiables : les comptes bruts (qui a commencé, terminé, résolu ; erreurs ; groupes trouvés ; essais faux les plus fréquents), les réponses écrites, et les écarts **très nets** (par exemple 0 retour spontané contre 8).
- À lire comme des ordres de grandeur : tous les pourcentages. Avec 15 personnes par groupe, 4 retours sur 15 signifie en réalité « entre 11 % et 52 % ».
- Non fiables : la comparaison fine groupe R / groupe S, la différence entre deux grilles, et tout ce qui repose sur moins de 10 personnes.
- La durée de résolution (`duree_s`) est le temps actif à l'écran ; une pause téléphone en poche ne l'allonge pas, mais un joueur qui lit la grille sans toucher l'écran ne la raccourcit pas non plus. `duree_brute_s` garde l'écart total.

**Autres limites**
- Les solutions sont lisibles dans le code de la page par un utilisateur averti. Sans conséquence pour un test privé ; à corriger avant un lancement public.
- La clé publique permet d'appeler les fonctions d'enregistrement. Limites en place : 1 000 événements par participant, 300 arrivées invitées/organiques par session. Un acteur malveillant pourrait quand même injecter de faux événements. Acceptable pour un test privé.
- Le projet Supabase gratuit se met en pause après une période d'inactivité (environ une semaine) : le réactiver avant un test.
- Le code administrateur est haché en base ; le changer demande une commande SQL (demander à Claude).
- Le bouton « Recommencer » n'existe qu'en mode démo.
- Le compte à rebours dépend de l'heure du téléphone : un téléphone très mal réglé afficherait une durée fausse. Le changement de fuseau n'a pas d'effet (minuit est calculé en heure de Paris).

## Journal des changements de la logique de collecte

Règle : aucune règle de comptabilisation ne change pendant un test. Tout changement est noté ici avec sa date.

| Date | Changement | Effet sur la lecture des résultats |
|---|---|---|
| 28/10/2026 (avant tout test) | Ajout d'un identifiant d'appareil anonyme (aléatoire, par navigateur) envoyé avec chaque visite. Nouvelle colonne « Appareils » et ligne « ⚠ Lien ouvert sur 2 appareils ou plus ». | Permet de repérer les liens transférés. Aucun autre compteur modifié. |
| 28/10/2026 (avant tout test) | Banque portée de 30 à 45 grilles (jours 31–45 du calendrier) ; corrections sans effet sur la solution des grilles 1–30 (g21 IRIS → PAPYRUS, leurres déclarés g9/g16/g27). Interface : cartes persistantes (sélection animée), envol des 4 cartes d'un groupe trouvé, mélange animé, changement de grille de démo sans rechargement. | Aucun compteur ni événement modifié. |
| 28/10/2026 (avant tout test) | Compte à rebours jusqu'à la prochaine grille (minuit, heure de Paris) en fin de partie. | Fait partie du jeu ; n'est pas un rappel ; le classement des visites est inchangé. |
| 28/10/2026 (avant tout test) | Règles ouvertes automatiquement à la première visite (événement `regles` avec `auto: true`). | À distinguer des consultations volontaires des règles (`auto` absent). |
| 28/10/2026 (avant tout test) | Difficulté masquée dans l'interface participant (carte du jour, maximum d'XP, niveaux des groupes dans la solution) ; conservée en démo et en admin. Compte à rebours ajouté sur l'accueil quand la grille du jour est terminée. | Aucun compteur modifié. La question « difficulté ressentie » n'est plus amorcée. |
| 28/10/2026 (avant tout test) | Indice (2 mots d'un même groupe, 1 par grille + 1 après 2 erreurs, −15 XP) : nouvel événement `indice`, champ `indices` dans `fin`. Chronomètre de temps actif : `duree_s` = temps actif (pauses exclues), `duree_brute_s` ajouté. | Le temps médian de réflexion de l'admin exclut désormais les pauses. Le nombre d'indices par grille devient une mesure de difficulté. |
| 28/10/2026 (avant tout test) | Bouton « ← » pour quitter une partie en cours (état conservé, reprise depuis l'accueil) ; tutoriel en 3 étapes à la première visite (remplace les règles ; même événement `regles` avec `auto: true`) ; en démo, grilles débloquées dans l'ordre et sélecteur limité à l'accueil. | Aucun compteur modifié. |
| 28/10/2026 (avant tout test) | Écran d'accueil avant la grille (carte du jour + bouton « Jouer maintenant »), progression locale (XP, niveaux, objectifs, badges), nouvel événement `recompense`. | « A ouvert la page » = visite de l'accueil ; « a commencé » = premier mot touché (inchangé). Le produit testé inclut désormais la progression ; aucune récompense n'est liée au retour quotidien. |

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
- l'absence de débordement sur iPhone SE et iPhone 13 ;
- la barre de boutons toujours visible après 3 groupes trouvés, et les groupes en version compacte pendant la partie ;
- le compte à rebours affiché et calé sur minuit heure de Paris ;
- le chargement lent : message après 8 s, bouton « Réessayer » sans seconde requête ;
- l'identifiant d'appareil enregistré, et le signalement d'un lien ouvert sur 2 appareils ;
- l'avertissement « lien personnel » affiché au joueur ;
- la progression : XP crédités une seule fois par grille (rechargement et rejouer sans effet), objectifs et badges attribués, montée de niveau, persistance après rechargement, carte du jour au changement de jour, séparation démo / participant, cohérence des statistiques, navigation entre les écrans, événement `recompense` tracé côté serveur. Le module `progression.js` a aussi 15 tests unitaires (`node tests/test_progression.js`).

Le classement des visites et les droits d'accès ont été testés **directement sur la vraie base** :
- spontané, après rappel et rappel probable ;
- code faux refusé, tables illisibles, fonctions internes inaccessibles.

**Reste à vérifier à la main après la mise en ligne** :
- une partie complète sur un vrai iPhone (Safari), y compris le compte à rebours au passage de minuit ;
- l'ouverture d'un lien depuis WhatsApp ou Instagram ;
- le partage natif (feuille de partage iOS).
