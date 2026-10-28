# Quotidien — prototype de test

Jeu de mots quotidien : 16 mots à répartir en 4 groupes de 4. Ce prototype sert uniquement à tester l'intérêt réel de joueurs (environ 30), pour 0 €.

## Ce qu'il contient

| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu (mobile et ordinateur, sans téléchargement). |
| `admin.html` | Tableau de bord administrateur (protégé par un code). |
| `grilles.json` | Les 45 grilles (source), 15 faciles / 15 intermédiaires / 15 difficiles, chacune avec un champ `niveau`. Les grilles 31 à 45 sont dans `nouvelles_grilles.json` (copie de travail, même contenu). Après modification : `python3 verifier_grilles.py` puis `python3 generer_grilles_js.py`. |
| `grilles.js` | Les grilles, générées depuis `grilles.json` (ne pas modifier à la main). |
| `defi.json` | La banque du **Défi express** : 86 catégories simples réparties en 19 familles, et la liste des paires de catégories à ne jamais tirer ensemble. `defi_banque.js` est généré à partir d'elle. Vérification : `python3 verifier_defi.py`. |
| `defi.js` | Moteur du Défi : tirage reproductible à partir d'une graine, paliers, classement, records et badges (sans XP). |
| `entrainement.json` | La banque du **mode entraînement** : 20 exercices en 5 chapitres, distincte du calendrier (aucun mot en commun). `entrainement.js` est généré à partir d'elle par `python3 generer_grilles_js.py`. |
| `progression.js` | Progression du joueur : barème d'XP, niveaux, objectifs, badges, statistiques. Seule source de vérité, tout est recalculé depuis le journal local des parties terminées. |
| `config.js` | Adresse de la base Supabase et clé **publique**. |
| `api.js` | Appels à la base. |
| `verifier_grilles.py` | `python3 verifier_grilles.py` (calendrier) ou `python3 verifier_grilles.py entrainement.json`. Vérifie aussi qu'aucun mot n'est partagé entre les deux banques. Pour chaque grille : 16 mots distincts, 4×4, niveau renseigné, aucun mot répété d'une grille à l'autre, et **une seule solution** compte tenu des leurres déclarés (`rattachements_plausibles`). |
| `tests/` | Serveur de test local (base simulée) et tests automatisés du parcours complet. |

## La banque de grilles

- 45 grilles, 3 niveaux (15 / 15 / 15) : g1–g30 vérifiées avant lancement, g31–g45 ajoutées le 28/10/2026 (deux relectures indépendantes, 3 bloquants corrigés : « canon de neige », BOUGIE pièce de voiture, VIENNOISERIE ne contient pas VIENNE). Le niveau n'est **pas** affiché au joueur, pour ne pas influencer la difficulté ressentie que mesure le questionnaire.
- Chaque grille passe deux contrôles : le script `verifier_grilles.py` (structure, unicité de la solution en tenant compte des pièges déclarés, aucun mot réutilisé entre grilles) et une relecture indépendante (recherche d'une autre répartition défendable, expressions fausses ou rares, mots cachés involontaires, calibrage de la difficulté). Les grilles à mots cachés sont en plus passées à un scan automatique des 16 mots (notes, couleurs, pays, prénoms).
- Ces contrôles réduisent fortement le risque d'injustice mais ne le suppriment pas : une grille jugée injuste par plusieurs testeurs (question « associations justes ? » et commentaires) doit être retirée ou corrigée **entre deux sessions**, jamais pendant.
- Une grille à retirer : la supprimer du calendrier de la session plutôt que du fichier, pour garder la numérotation stable.

## Le mode entraînement

**Pourquoi une banque distincte.** Les 45 grilles du calendrier restent réservées au jour prévu : les rendre jouables en avance révélerait la grille de demain et fausserait le test. Le mode entraînement utilise donc ses **propres** 20 exercices (`entrainement.json`), qui passent les mêmes contrôles (script : structure, une seule solution, aucun mot partagé avec le calendrier ; deux relectures indépendantes le 28/10/2026). Pour en ajouter : compléter `entrainement.json` (champ `chapitre`), lancer `python3 verifier_grilles.py entrainement.json`, faire relire, puis `python3 generer_grilles_js.py`. S'il n'y a aucun exercice, l'écran l'indique au lieu d'en simuler.

**Parcours.** 5 chapitres de 4 exercices (Échauffement, Expressions à trou, Doubles sens, Mots cachés, Expert), chacun avec une astuce. Un exercice s'ouvre quand le précédent est **réussi ou passé**. Après une réussite : « Exercice suivant » (seulement s'il existe), « Revoir les solutions », « Retour à l'entraînement », lien « Accueil ». Rien ne se lance sans clic du joueur. Après le dernier exercice, l'écran d'entraînement propose de rejouer, de revoir ses résultats ou de revenir à l'accueil.

**Après 4 erreurs (entraînement seulement).** La solution n'est pas révélée d'office. Trois choix : **Réessayer** (nouvelle tentative : 16 mots remis, erreurs, sélection et chronomètre à zéro ; le numéro de tentative est conservé), **Comprendre la solution** (les 4 groupes et leurs explications), **Passer à la suite** (l'exercice reste rejouable depuis le parcours). La grille du jour garde son comportement : solution révélée après 4 erreurs.

**Règles d'XP de l'entraînement** (même barème que la grille du jour) :
- XP à la **première réussite** d'un exercice seulement ; rejouer un exercice réussi ne rapporte rien.
- Échec, exercice passé : 0 XP, aucune entrée dans la progression.
- Solution consultée avant de réussir : la réussite ne rapporte rien (sinon on gagnerait de l'XP en recopiant).
- Réussite après un échec (tentative 2 ou plus) : XP normale, mais **pas** de bonus « sans erreur ».
- Les exercices réussis comptent pour les objectifs et badges comme des grilles terminées et résolues (les objectifs « 15 grilles » et « 25 grilles » deviennent atteignables pendant un test de 14 jours).
- Le taux de réussite, le meilleur résultat et la série ne portent que sur les grilles du jour.

**Reprise.** Une partie d'entraînement quittée (bouton ←, fermeture, rechargement) reprend avec ses groupes trouvés, ses erreurs, sa sélection et son temps actif (le temps hors partie n'est pas compté). Une tentative terminée n'est jamais restaurée : rouvrir l'exercice lance une nouvelle tentative. Sauvegardes séparées : `quotidien_entr_<profil>_<exercice>` et `quotidien_entr_meta_<profil>` (tentatives, réussi, passé, solution vue) ; la grille du jour garde `quotidien_etat_…`.

**Interrupteur.** Dans `config.js`, `entrainement: "tous"` (participants et démo, valeur actuelle), `"demo"` (démo seulement : le test reste limité à la grille du jour) ou `"aucun"`.

## Le Défi express

**Principe.** Jeu chronométré séparé de la grille du jour : à chaque palier, des mots de 2 à 4 catégories sont mélangés ; le joueur touche les mots d'un même groupe, la vérification est automatique. **30 secondes par palier**, chaque erreur retire **5 secondes**, la partie s'arrête quand le temps est écoulé (ou à l'abandon). Tailles : paliers 1–3 = 2 groupes de 2 mots, 4–7 = 2 × 3, 8–12 = 3 × 2, 13–18 = 3 × 3, 19–30 = 4 × 3. Le chrono ne s'arrête pas si on quitte l'écran (sinon on pourrait chercher les réponses).

**Aléatoire.** Rien n'est écrit à l'avance : une *graine* (texte aléatoire) détermine toute la suite des paliers. En solo, une nouvelle graine à chaque partie. Règles du tirage : jamais deux catégories de la même famille, jamais deux catégories déclarées incompatibles (ex. Couleurs et Fruits, Planètes et Mois à cause de MARS), pas de catégorie déjà vue dans les 3 paliers précédents. Mesuré sur 90 000 paliers tirés (`node tests/test_defi.js`) : 0 violation de ces règles, 89 975 paliers différents ; au palier 13, 3 000 parties donnent 3 000 plateaux différents.

**Banque.** 86 catégories simples (pas d'expressions à trou ni de mots cachés), chaque mot dans une seule catégorie. Deux relectures indépendantes le 28/10/2026 ont cherché les mots qui iraient dans une catégorie d'une autre famille : 19 mots ambigus et 11 mots trop difficiles remplacés, 60 paires de catégories déclarées incompatibles. Environ 250 mots du Défi existent aussi dans le calendrier : accepté, car le Défi ne montre que des catégories évidentes et ne révèle ni les pièges ni les expressions des grilles.

**Groupes, façon petit bac (2 à 6 joueurs).** « Créer un groupe » donne un nom, un code de 6 caractères et un lien `?groupe=CODE` (valable 30 jours). Les amis rejoignent par le lien ou en tapant le code, avec un pseudo (unique dans le groupe). L'écran du groupe sert de **salle d'attente** : membres en ligne (rafraîchi toutes les 2,5 s), invitation à partager, résultats en direct.
- **L'hôte lance chaque manche** (2 membres au moins). Compte à rebours commun de 5 secondes, calé sur l'heure du serveur ; les membres présents sur l'écran du groupe démarrent automatiquement, les autres ont un bouton « Jouer la manche ». Tout le monde joue **le même tirage**, révélé seulement au départ de sa partie.
- **Une seule partie par manche.** Une partie interrompue (page fermée ou rechargée) est enregistrée au dernier palier réussi. Un membre arrivé après le lancement joue la manche suivante.
- **Fin de manche** : quand tous les membres présents au lancement ont fini, ou si l'hôte « clôt la manche » (possible dès qu'un joueur a fini et que plus personne ne joue ; les absents ne marquent pas de point), ou automatiquement 16 minutes après le départ.
- **Points (petit bac)** : dans une manche, classement par paliers puis temps ; le premier marque autant de points qu'il y a de joueurs classés, le dernier 1 point, les ex æquo le même nombre. **Classement général** : total des points, puis nombre de victoires, puis total de paliers ; sinon ex æquo.
- L'hôte lance la manche suivante quand la précédente est terminée.

**Sans XP.** Le Défi n'écrit rien dans la progression. Il a son record personnel (paliers puis temps), son nombre de parties et 8 badges-trophées : Sur la lancée (5 paliers), Fusée (10), Inarrêtable (20), Sans limite (30), Main sûre (10 paliers d'affilée sans erreur), Réflexe (un palier en moins de 3 s), Joueur d'équipe (terminer une manche de groupe), Champion de manche (gagner seul une manche où au moins 2 joueurs sont classés).

**Interrupteur.** `config.js` : `defi: "tous"` (valeur actuelle), `"demo"` ou `"aucun"`.

**Stockage.** Base : tables `defi_groupes`, `defi_membres`, `defi_manches`, `defi_resultats` (séparées des tables du test, illisibles par la clé publique), fonctions `g_creer`, `g_rejoindre`, `g_etat`, `g_lancer`, `g_commencer`, `g_score`, `g_cloturer`. Les anciennes tables `defi_salons` / `defi_scores` (salons asynchrones, version du 28/10 après-midi) ne sont plus utilisées par l'interface. Navigateur : `quotidien_defi_<profil>` (record, badges, groupes), `quotidien_defi_encours` (manche en cours), `quotidien_pseudo`.

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
- Défi express (participants seulement) : ouverture, fin de partie (paliers, temps, erreurs, solo ou groupe), groupe créé, groupe rejoint, manche lancée. Dans les groupes : le **pseudo**, la présence sur l'écran du groupe et les scores, visibles des membres pendant 30 jours.
- Mode entraînement : ouverture, début, fin (réussi ou non, erreurs, durée, indices, numéro de tentative), solution consultée, exercice passé.
- Réponses au questionnaire.

Aucun nom, e-mail, téléphone ou adresse. Pas de publicité, pas d'outil de suivi tiers. Les joueurs voient cette explication en bas de page.

## Limites de l'expérimentation (à lire avant d'interpréter les résultats)

- **Défi express** : sans compte, un joueur décidé peut tricher (envoi d'un faux score par les outils du navigateur ; le serveur ne refuse que les scores invraisemblables ; un même joueur sur deux appareils compte pour deux membres). Acceptable pour un jeu entre amis, pas pour des récompenses. Le départ « simultané » dépend de la connexion de chacun (rafraîchissement toutes les 2,5 s, départ calé sur l'heure du serveur) : quelques centaines de millisecondes d'écart sont possibles, sans effet sur le classement, puisque chacun a son propre chrono de 30 s par palier.

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
| 28/10/2026 (avant tout test) | **Défi en groupes façon petit bac** (hôte, salle d'attente, manches simultanées, points et classement général) : remplace les salons asynchrones. Lien `?groupe=CODE` (l'ancien `?defi=` reste accepté). Actions de l'événement `defi` : `ouverture`, `fin` (champ `groupe`), `groupe_cree`, `groupe_rejoint`, `manche_lancee`. Banque du Défi : troisième relecture (TROMBONE, VOILE et 8 mots ambigus remplacés, 6 paires ajoutées). | Mêmes règles d'isolement que le Défi (visite `retour_defi`, aucune donnée de test pendant le Défi). |
| 28/10/2026 (avant tout test) | **Défi express** (jeu chronométré, salons de 2 à 6 amis). Nouvelle classe de visite **`retour_defi`** : un participant arrivé par le lien de Défi d'un ami (`entree = defi`) n'est **pas** compté comme retour spontané (ordre : première visite, même jour, rappel, **défi**, rappel probable, spontané). Nouvelle ligne de l'entonnoir « Revenu par le lien de Défi d'un ami ». Nouveau type d'événement `defi` (action : `ouverture`, `fin`, `salon_cree`, `salon_rejoint`) ; pendant le Défi aucun événement du test n'est envoyé. Un ami non participant qui ouvre un lien de défi n'est pas inscrit au test (avant : toute personne sans lien devenait participant « organique » ; ce n'est plus vrai pour les liens `?defi=`). Barre du bas : l'onglet « Parcours » devient « Défi » (le parcours reste accessible depuis l'accueil). | **Change le produit testé** : le Défi est un motif de revenir et un canal d'invitation. Les retours qu'il provoque sont isolés (`retour_defi`), mais un participant qui joue beaucoup au Défi peut revenir plus (ou moins) à la grille du jour. À garder en tête ; comparer si besoin à un test avec `defi: "demo"`. Le classement « retour spontané » reste défini comme avant pour toutes les autres entrées. |
| 28/10/2026 (avant tout test) | **Mode entraînement** (banque distincte de 20 exercices). Nouveau type d'événement `entrainement` (champ `action` : `ouverture`, `debut`, `fin`, `solution`, `passe` ; `grille` = identifiant d'exercice e01…). Pendant l'entraînement, **aucun** événement du test n'est envoyé (`debut`, `essai`, `fin`, `indice`, `recompense`, `demande_suivante`, `questionnaire`, `partage`) et **aucune visite** n'est enregistrée (pas de rechargement de page) : « Exercice suivant » ne peut pas compter comme un retour. Seul `regles` peut partir pendant l'entraînement, alors sans grille. Le tableau de bord affiche l'entraînement dans un tableau séparé. Sur l'écran de fin de la grille du jour, une proposition « S'entraîner » est ajoutée **après** le questionnaire. Statistiques du joueur séparées (grilles du jour / entraînement / progression) ; série et taux de réussite calculés sur les grilles du jour seulement. | **Change le produit testé** : les participants peuvent jouer davantage le même jour, ce qui peut modifier le retour du lendemain (dans un sens ou dans l'autre) et la réponse à « Oui, je veux jouer la prochaine ». À garder en tête à la lecture, et à comparer à un test sans entraînement si besoin (`entrainement: "demo"` dans `config.js`). Les compteurs de l'entonnoir et le classement des visites sont inchangés. |
| 28/10/2026 (avant tout test) | Seconde relecture indépendante des 45 grilles (3 lots). Corrections : g14 ACCOLADE → CROCHET (pas une ponctuation), BOUCHÉES → FORMES ; g27 SERVICE → HOMMAGE et CORDON → COURT (deux répartitions alternatives) ; g28 MERLE → MÉSANGE (Robert Merle, écrivain), SÈVE → PÉTALE ; g30 MESURER → EXPERTISER ; g39 PAIX → ZOO ; g42 FLEURISTE → MERCERIE ; catégories reformulées (g22, g29, g30) et explications corrigées (g14, g23, g35, g36, g38). | Aucun compteur modifié. |
| 28/10/2026 (avant tout test) | Banque portée de 30 à 45 grilles (jours 31–45 du calendrier) ; corrections sans effet sur la solution des grilles 1–30 (g21 IRIS → PAPYRUS, leurres déclarés g9/g16/g27). Interface : cartes persistantes (sélection animée), envol des 4 cartes d'un groupe trouvé, mélange animé, changement de grille de démo sans rechargement. | Aucun compteur ni événement modifié. |
| 28/10/2026 (avant tout test) | Compte à rebours jusqu'à la prochaine grille (minuit, heure de Paris) en fin de partie. | Fait partie du jeu ; n'est pas un rappel ; le classement des visites est inchangé. |
| 28/10/2026 (avant tout test) | Règles ouvertes automatiquement à la première visite (événement `regles` avec `auto: true`). | À distinguer des consultations volontaires des règles (`auto` absent). |
| 28/10/2026 (avant tout test) | Difficulté masquée dans l'interface participant (carte du jour, maximum d'XP, niveaux des groupes dans la solution) ; conservée en démo et en admin. Compte à rebours ajouté sur l'accueil quand la grille du jour est terminée. | Aucun compteur modifié. La question « difficulté ressentie » n'est plus amorcée. |
| 28/10/2026 (avant tout test) | Indice (2 mots d'un même groupe, 1 par grille + 1 après 2 erreurs, −15 XP) : nouvel événement `indice`, champ `indices` dans `fin`. Chronomètre de temps actif : `duree_s` = temps actif (pauses exclues), `duree_brute_s` ajouté. | Le temps médian de réflexion de l'admin exclut désormais les pauses. Le nombre d'indices par grille devient une mesure de difficulté. |
| 28/10/2026 (avant tout test) | Bouton « ← » pour quitter une partie en cours (état conservé, reprise depuis l'accueil) ; tutoriel en 3 étapes à la première visite (remplace les règles ; même événement `regles` avec `auto: true`) ; en démo, grilles débloquées dans l'ordre et sélecteur limité à l'accueil. | Aucun compteur modifié. |
| 28/10/2026 (avant tout test) | Écran d'accueil avant la grille (carte du jour + bouton « Jouer maintenant »), progression locale (XP, niveaux, objectifs, badges), nouvel événement `recompense`. | « A ouvert la page » = visite de l'accueil ; « a commencé » = premier mot touché (inchangé). Le produit testé inclut désormais la progression ; aucune récompense n'est liée au retour quotidien. |

## Tests effectués

`node tests/test_defi.js` (19 vérifications) : reproductibilité du tirage, règles de tirage sur 90 000 paliers, variété, vérification des sélections, classement, records et badges, aucune XP. `node tests/test_defi_parcours.js` (iPhone 13 et SE, plusieurs téléphones en même temps) : partie solo (paliers, chrono, erreur −5 s, temps écoulé, record), nouveau tirage à chaque partie, création de groupe, ami non participant qui rejoint (pseudo déjà pris refusé, non inscrit au test), arrivée en direct dans la salle d'attente, lancement par l'hôte, compte à rebours et départ automatique communs, même tirage, points du petit bac, classement général avec égalités, retardataire renvoyé à la manche suivante, rechargement en pleine manche, absent et clôture par l'hôte, visite `retour_defi`, mesures du test non contaminées, mode démo, code invalide.

`node tests/test_entrainement.js` (71 vérifications, iPhone 13 et iPhone SE) couvre le mode entraînement : accueil avec les deux modes, grille du jour inchangée, ouverture du parcours, réussite et « Exercice suivant », échec après 4 erreurs, « Réessayer » (remise à zéro de la tentative, chronomètre, progression intacte), « Comprendre la solution » (puis réussite sans XP), « Passer » sans XP, reprise après rechargement (groupes, erreurs, sélection, temps actif), absence de double crédit, statistiques séparées, mode démo indépendant, données du test non contaminées (seuls les événements de la grille du jour, visites non comptées comme retours, traces `entrainement` séparées), petits écrans (pas de défilement horizontal, zones tactiles ≥ 44 px, bouton Valider visible).

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
