# Quotidien — prototype de test

Jeu de mots quotidien : 16 mots à répartir en 4 groupes de 4. Ce prototype sert uniquement à tester l'intérêt réel de joueurs (environ 30), pour 0 €.

## Ce qu'il contient

| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu (mobile et ordinateur, sans téléchargement). |
| `admin.html` | Tableau de bord administrateur (protégé par un code). |
| `grilles.json` | Les 30 grilles (source), 10 faciles / 10 intermédiaires / 10 difficiles, chacune avec un champ `niveau`. Après modification : `python3 verifier_grilles.py` puis `python3 generer_grilles_js.py`. |
| `grilles.js` | Les grilles, générées depuis `grilles.json` (ne pas modifier à la main). |
| `config.js` | Adresse de la base Supabase et clé **publique**. |
| `api.js` | Appels à la base. |
| `verifier_grilles.py` | Vérifie chaque grille : 16 mots distincts, 4×4, niveau renseigné, aucun mot répété d'une grille à l'autre, et **une seule solution** compte tenu des leurres déclarés (`rattachements_plausibles`). |
| `tests/` | Serveur de test local (base simulée) et tests automatisés du parcours complet. |

## La banque de grilles

- 30 grilles, 3 niveaux (10 / 10 / 10). Le niveau n'est **pas** affiché au joueur, pour ne pas influencer la difficulté ressentie que mesure le questionnaire.
- Chaque grille passe deux contrôles : le script `verifier_grilles.py` (structure, unicité de la solution en tenant compte des pièges déclarés, aucun mot réutilisé entre grilles) et une relecture indépendante (recherche d'une autre répartition défendable, expressions fausses ou rares, mots cachés involontaires, calibrage de la difficulté). Les grilles à mots cachés sont en plus passées à un scan automatique des 16 mots (notes, couleurs, pays, prénoms).
- Ces contrôles réduisent fortement le risque d'injustice mais ne le suppriment pas : une grille jugée injuste par plusieurs testeurs (question « associations justes ? » et commentaires) doit être retirée ou corrigée **entre deux sessions**, jamais pendant.
- Une grille à retirer : la supprimer du calendrier de la session plutôt que du fichier, pour garder la numérotation stable.

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
   - L'ordre des 30 grilles alterne volontairement les niveaux sur les premiers jours (1 facile, 2 intermédiaire, 3 difficile) ; le protocole de décision à 14 jours reste inchangé.
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
- La durée de résolution ne compte que le temps entre le premier mot touché et la fin : une pause téléphone en poche l'allonge.

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
| 28/10/2026 (avant tout test) | Compte à rebours jusqu'à la prochaine grille (minuit, heure de Paris) en fin de partie. | Fait partie du jeu ; n'est pas un rappel ; le classement des visites est inchangé. |
| 28/10/2026 (avant tout test) | Règles ouvertes automatiquement à la première visite (événement `regles` avec `auto: true`). | À distinguer des consultations volontaires des règles (`auto` absent). |

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
- l'avertissement « lien personnel » affiché au joueur.

Le classement des visites et les droits d'accès ont été testés **directement sur la vraie base** :
- spontané, après rappel et rappel probable ;
- code faux refusé, tables illisibles, fonctions internes inaccessibles.

**Reste à vérifier à la main après la mise en ligne** :
- une partie complète sur un vrai iPhone (Safari), y compris le compte à rebours au passage de minuit ;
- l'ouverture d'un lien depuis WhatsApp ou Instagram ;
- le partage natif (feuille de partage iOS).
