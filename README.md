# Quotidien — prototype de test

Jeu de mots quotidien : 16 mots à répartir en 4 groupes de 4. Ce prototype sert uniquement à tester l'intérêt réel de joueurs (environ 30), pour 0 €.

## Ce qu'il contient

| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu (mobile et ordinateur, sans téléchargement). |
| `admin.html` | Tableau de bord administrateur (protégé par un code). |
| `grilles.json` | Les 45 grilles (source), 15 faciles / 15 intermédiaires / 15 difficiles, chacune avec un champ `niveau`. `nouvelles_grilles.json` est une ancienne copie de travail des grilles 31 à 45 (avant réécriture des explications) : elle n'est plus tenue à jour, la seule source est `grilles.json`. Après modification : `python3 verifier_grilles.py` puis `python3 generer_grilles_js.py`. |
| `grilles.js` | Les grilles, générées depuis `grilles.json` (ne pas modifier à la main). |
| `defi.json` | La banque du **Défi express** : 86 catégories simples réparties en 19 familles, et la liste des paires de catégories à ne jamais tirer ensemble. `defi_banque.js` est généré à partir d'elle. Vérification : `python3 verifier_defi.py`. |
| `defi.js` | Moteur du Défi : tirage reproductible à partir d'une graine, paliers, classement, records et badges (sans XP). |
| `variantes.json` | **Versions de rechange des grilles de démo** : 2 par grille (90 en tout), même difficulté, autres mots et autres groupes. `variantes.js` est généré à partir d'elle. Vérification : `python3 verifier_variantes.py`. |
| `entrainement.json` | La banque du **mode entraînement** : 20 exercices en 5 chapitres, distincte du calendrier (aucun mot en commun). `entrainement.js` est généré à partir d'elle par `python3 generer_grilles_js.py`. |
| `intrus.json` | La banque du mini-jeu **Le mot intrus** : 60 questions éditoriales (26 faciles, 22 moyennes, 12 difficiles), versionnées (`version`). `intrus_banque.js` est généré à partir d'elle. Vérification : `python3 verifier_intrus.py`, puis relecture humaine obligatoire avant toute publication. |
| `intrus.js` | Moteur du mot intrus : tirage d'une série de 5 questions, records et trophées (sans XP). |
| `expressions.json` | La banque du mini-jeu **Expression mystère** : expressions françaises vérifiées (mot manquant, indice, 3 leurres, sens, exemple, catégorie, difficulté). `expressions_banque.js` est généré à partir d'elle. Vérification : `python3 verifier_expressions.py` (dont la protection du calendrier), puis relecture humaine. |
| `expression.js` | Moteur d'Expression mystère : tirage d'une partie de 5 expressions, propositions, statistiques locales. L'XP passe par `progression.js`. |
| `progression.js` | Progression du joueur : barème d'XP, niveaux, objectifs, badges, statistiques. Seule source de vérité, tout est recalculé depuis le journal local des parties terminées. |
| `config.js` | Adresse de la base Supabase et clé **publique**. |
| `api.js` | Appels à la base. |
| `verifier_grilles.py` | `python3 verifier_grilles.py` (calendrier) ou `python3 verifier_grilles.py entrainement.json`. Vérifie aussi qu'aucun mot n'est partagé entre les deux banques. Pour chaque grille : 16 mots distincts, 4×4, niveau renseigné, aucun mot répété d'une grille à l'autre, et **une seule solution** compte tenu des leurres déclarés (`rattachements_plausibles`). |
| `tests/` | Serveur de test local (base simulée) et tests automatisés du parcours complet. |

## Démo : 3 versions par grille

En démo, chaque grille existe en **3 versions** de même difficulté : l'originale et deux versions de rechange (`variantes.json`). **Chaque partie terminée fait passer à la version suivante** (1 → 2 → 3 → 1) : après un échec, « Réessayer avec d'autres mots » propose une grille entièrement nouvelle (aucun des 16 mots déjà vus, aucune catégorie déjà vue), pour qu'on ne refasse pas de mémoire la même grille. Réussir **n'importe quelle version** débloque la grille suivante ; l'XP reste comptée une seule fois par grille (première partie terminée).

Contrôles de `verifier_variantes.py` : une seule solution (leurres déclarés), même niveau que l'original, aucun mot ni aucune catégorie commune avec l'original ou l'autre version, aucun mot du calendrier ni de l'entraînement, et aucun mot réutilisé d'un niveau à l'autre dans les versions (0 au 29/10/2026). Relecture : écrites en 4 lots, relues par 4 relecteurs indépendants (7 bloquants corrigés), puis les 58 grilles réécrites relues de nouveau (3 bloquants corrigés : mots cachés involontaires AMINE, rosé, et « gris nacré »).

Les versions de rechange ne servent qu'en démo : les participants jouent toujours la grille du jour du calendrier.

## La banque de grilles

- 45 grilles, 3 niveaux (15 / 15 / 15) : g1–g30 vérifiées avant lancement, g31–g45 ajoutées le 28/10/2026 (deux relectures indépendantes, 3 bloquants corrigés : « canon de neige », BOUGIE pièce de voiture, VIENNOISERIE ne contient pas VIENNE). Le niveau n'est **pas** affiché au joueur, pour ne pas influencer la difficulté ressentie que mesure le questionnaire.
- Chaque grille passe deux contrôles : le script `verifier_grilles.py` (structure, unicité de la solution en tenant compte des pièges déclarés, aucun mot réutilisé entre grilles) et une relecture indépendante (recherche d'une autre répartition défendable, expressions fausses ou rares, mots cachés involontaires, calibrage de la difficulté). Les grilles à mots cachés sont en plus passées à un scan automatique des 16 mots (notes, couleurs, pays, prénoms).
- **Relecture globale du 30/10/2026** (avant le test), par 9 relecteurs indépendants : calendrier, 90 versions de démo, 20 exercices, Défi, mot intrus, expression mystère. Grilles : g15 BICHE → ESCALIER (une biche a vraiment une tête, une queue et des pieds : 3 solutions) ; pièges non déclarés ajoutés (g12 tigre blanc, g20 LOUIS prénom-mot, g13b peinture à l'HUILE, g27c mener une EMBUSCADE) ; g3 « Pierres qui sont aussi des couleurs » → « Pierres précieuses et fines » (le nom révélait le critère des fruits) ; g36 « Ils ont un manche… ou des manches » ; g42 « Contiennent A, E, I, O et U » ; versions : g3c PÉTUNIA → GLYCINE, g15c QUARANTAINE → ADOLESCENCE, g18c GENETTE → ROUQUIN, g27b FRUITS → CHAPEAU (même niveau que l'originale), g45b PÉLARDON → SAINTE-MAURE ; une quinzaine d'explications et d'intentions corrigées. Entraînement : les astuces des chapitres 2, 4 et 5 donnaient des réponses (« Tête de ___ », « Faux ___ », puis le critère caché de chaque exercice dans l'ordre) → astuces générales ; chapitre 5 commence par le verlan (contenus de e17 et e18 échangés, identifiants gardés) ; e13 « Alliages ». Règles (tutoriel) : l'exemple du piège MARRON ne permettait pas de trancher (NOISETTE et PISTACHE sont aussi des couleurs) → quatre couleurs sûres, trois fruits à coque.
- Ces contrôles réduisent fortement le risque d'injustice mais ne le suppriment pas : une grille jugée injuste par plusieurs testeurs (question « associations justes ? » et commentaires) doit être retirée ou corrigée **entre deux sessions**, jamais pendant.
- Une grille à retirer : la supprimer du calendrier de la session plutôt que du fichier, pour garder la numérotation stable.

## Le mode entraînement

**Pourquoi une banque distincte.** Les 45 grilles du calendrier restent réservées au jour prévu : les rendre jouables en avance révélerait la grille de demain et fausserait le test. Le mode entraînement utilise donc ses **propres** 20 exercices (`entrainement.json`), qui passent les mêmes contrôles (script : structure, une seule solution, aucun mot partagé avec le calendrier ; deux relectures indépendantes le 28/10/2026). Pour en ajouter : compléter `entrainement.json` (champ `chapitre`), lancer `python3 verifier_grilles.py entrainement.json`, faire relire, puis `python3 generer_grilles_js.py`. S'il n'y a aucun exercice, l'écran l'indique au lieu d'en simuler.

**Parcours.** 5 chapitres de 4 exercices (Échauffement, Expressions à trou, Doubles sens, Mots cachés, Expert), chacun avec une astuce. Un exercice s'ouvre quand le précédent est **réussi ou passé**. Après une réussite : « Exercice suivant » (seulement s'il existe), « Revoir les solutions », « Retour à l'entraînement », lien « Accueil ». Rien ne se lance sans clic du joueur. Après le dernier exercice, l'écran d'entraînement propose de rejouer, de revoir ses résultats ou de revenir à l'accueil.

**La solution ne s'affiche jamais après un échec (tous les modes, depuis le 29/10/2026).** Après 4 erreurs, la partie s'arrête ; l'écran de fin ne rappelle que les groupes que le joueur a lui-même trouvés (« Tes groupes trouvés »), les autres restent secrets. La solution complète et ses explications ne s'affichent qu'une fois la grille ou l'exercice **réussi**. En entraînement, deux choix après un échec : **Réessayer** (nouvelle tentative : 16 mots remis, erreurs, sélection et chronomètre à zéro ; le numéro de tentative est conservé) ou **Passer à la suite** (l'exercice reste rejouable depuis le parcours). Le bouton « Comprendre la solution » a été retiré. En démo : « Réessayer avec d'autres mots ». Grille du jour : un seul essai, la solution n'est donc pas montrée à un participant qui a perdu.

**Règles d'XP de l'entraînement** (même barème que la grille du jour) :
- XP à la **première réussite** d'un exercice seulement ; rejouer un exercice réussi ne rapporte rien.
- Échec, exercice passé : 0 XP, aucune entrée dans la progression.
- Solution consultée avant de réussir : la réussite ne rapporte rien. Cas devenu impossible depuis que la solution n'est plus montrée après un échec ; la règle reste pour les exercices déjà marqués « solution vue ».
- Réussite après un échec (tentative 2 ou plus) : XP normale, mais **pas** de bonus « sans erreur ».
- Les exercices réussis comptent pour les objectifs et badges comme des grilles terminées et résolues (les objectifs « 15 grilles » et « 25 grilles » deviennent atteignables pendant un test de 14 jours).
- Le taux de réussite, le meilleur résultat et la série ne portent que sur les grilles du jour.

**Reprise.** Une partie d'entraînement quittée (bouton ←, fermeture, rechargement) reprend avec ses groupes trouvés, ses erreurs, sa sélection et son temps actif (le temps hors partie n'est pas compté). Une tentative terminée n'est jamais restaurée : rouvrir l'exercice lance une nouvelle tentative. Sauvegardes séparées : `quotidien_entr_<profil>_<exercice>` et `quotidien_entr_meta_<profil>` (tentatives, réussi, passé, solution vue) ; la grille du jour garde `quotidien_etat_…`.

**Interrupteur.** Dans `config.js`, `entrainement: "tous"` (participants et démo, valeur actuelle), `"demo"` (démo seulement : le test reste limité à la grille du jour) ou `"aucun"`.

## Le Défi express

**Principe.** Jeu chronométré séparé de la grille du jour : à chaque palier, des mots de 2 à 4 catégories sont mélangés ; le joueur touche les mots d'un même groupe, la vérification est automatique. **Un seul chrono de 30 secondes pour toute la partie** (règles du 29/10/2026) : chaque groupe trouvé **rajoute 2 secondes**, chaque erreur **en retire 2** ; la partie s'arrête quand le chrono tombe à zéro (ou à l'abandon). Le chrono est figé pendant l'animation « Palier réussi » (0,8 s). Classement : le plus de paliers, puis le temps de jeu écoulé au moment du dernier palier réussi (le plus court gagne). Les records obtenus avec les anciennes règles (30 s par palier, −5 s par erreur) sont mis de côté (« ancien record ») ; les badges déjà gagnés restent. Tailles : paliers 1–3 = 2 groupes de 2 mots, 4–7 = 2 × 3, 8–12 = 3 × 2, 13–18 = 3 × 3, 19–30 = 4 × 3. Le chrono ne s'arrête pas si on quitte l'écran (sinon on pourrait chercher les réponses).

**Aléatoire.** Rien n'est écrit à l'avance : une *graine* (texte aléatoire) détermine toute la suite des paliers. En solo, une nouvelle graine à chaque partie. Règles du tirage : jamais deux catégories de la même famille, jamais deux catégories déclarées incompatibles (ex. Couleurs et Fruits, Planètes et Mois à cause de MARS), pas de catégorie déjà vue dans les 3 paliers précédents. Mesuré sur 90 000 paliers tirés (`node tests/test_defi.js`) : 0 violation de ces règles, 89 975 paliers différents ; au palier 13, 3 000 parties donnent 3 000 plateaux différents.

**Banque.** 86 catégories simples (pas d'expressions à trou ni de mots cachés), chaque mot dans une seule catégorie. Deux relectures indépendantes le 28/10/2026 ont cherché les mots qui iraient dans une catégorie d'une autre famille : 19 mots ambigus et 11 mots trop difficiles remplacés, 60 paires de catégories déclarées incompatibles. Relecture globale du 30/10/2026 : 21 paires ajoutées pour les liens forts entre catégories de familles différentes, qui donnaient deux regroupements défendables quand 2 groupes de 2 mots sont tirés (LONDRES/ANGLAIS, SUSHI/JAPON, TANGO/ARGENTINE, NOËL/SAPIN, THÉ/TASSE…), INDIEN → MER ROUGE (seul, « indien » se lit comme une nationalité), OREILLE → LÈVRE ; 86 paires au total. Environ 250 mots du Défi existent aussi dans le calendrier : accepté, car le Défi ne montre que des catégories évidentes et ne révèle ni les pièges ni les expressions des grilles.

**Groupes, façon petit bac (2 à 6 joueurs).** « Créer un groupe » donne un nom, un code de 6 caractères et un lien `?groupe=CODE` (valable 30 jours). Les amis rejoignent par le lien ou en tapant le code, avec un pseudo (unique dans le groupe). L'écran du groupe sert de **salle d'attente** : membres en ligne (rafraîchi toutes les 2,5 s), invitation à partager, résultats en direct.
- **L'hôte lance chaque manche** (2 membres au moins). Compte à rebours commun de 5 secondes, calé sur l'heure du serveur ; les membres présents sur l'écran du groupe démarrent automatiquement, les autres ont un bouton « Jouer la manche ». Tout le monde joue **le même tirage**, révélé seulement au départ de sa partie.
- **Une seule partie par manche.** Une partie interrompue (page fermée ou rechargée) est enregistrée au dernier palier réussi. Un membre arrivé après le lancement joue la manche suivante.
- **Fin de manche** : quand tous les membres présents au lancement ont fini, ou si l'hôte « clôt la manche » (possible dès qu'un joueur a fini et que plus personne ne joue ; les absents ne marquent pas de point), ou automatiquement 16 minutes après le départ.
- **Points (petit bac)** : dans une manche, classement par paliers puis temps ; le premier marque autant de points qu'il y a de joueurs classés, le dernier 1 point, les ex æquo le même nombre. **Classement général** : total des points, puis nombre de victoires, puis total de paliers ; sinon ex æquo.
- L'hôte lance la manche suivante quand la précédente est terminée.

**Sans XP.** Le Défi n'écrit rien dans la progression. Il a son record personnel (paliers puis temps), son nombre de parties et 8 badges-trophées : Sur la lancée (5 paliers), Fusée (10), Inarrêtable (20), Sans limite (30), Main sûre (10 paliers d'affilée sans erreur), Réflexe (un palier en moins de 3 s), Joueur d'équipe (terminer une manche de groupe), Champion de manche (gagner seul une manche où au moins 2 joueurs sont classés).

**Interrupteur.** `config.js` : `defi: "tous"` (valeur actuelle), `"demo"` ou `"aucun"`.

**Stockage.** Base : tables `defi_groupes`, `defi_membres`, `defi_manches`, `defi_resultats` (séparées des tables du test, illisibles par la clé publique), fonctions `g_creer`, `g_rejoindre`, `g_etat`, `g_lancer`, `g_commencer`, `g_score`, `g_cloturer`. Les anciennes tables `defi_salons` / `defi_scores` (salons asynchrones, version du 28/10 après-midi) ne sont plus utilisées par l'interface. Navigateur : `quotidien_defi_<profil>` (record, badges, groupes), `quotidien_defi_encours` (manche en cours), `quotidien_pseudo`.

## Navigation (depuis le 30/10/2026)

Barre du bas : **Accueil · Quotidien · Jeux · Progression · Stats**.
- **Accueil** : niveau et XP, grille du jour (action principale, bouton vert), trois tuiles de jeux, derniers résultats (seulement s'il y en a), 2 objectifs en cours.
- **Quotidien** : ouvre directement la grille du jour (en démo : la grille de démo en cours). Aucun accès aux grilles futures.
- **Jeux** : tous les modes en cartes, en 3 sections (voir plus bas). Les écrans du Défi, de l'entraînement et du mot intrus allument cet onglet.
- **Progression** : niveau, objectifs, badges (grille + entraînement), trophées des jeux et liste des niveaux, avec un sommaire en haut.
- **Stats** : statistiques par mode. Pas de page « Profil » : il n'y a pas de compte, on n'en simule pas.

**Bouton retour du téléphone** (geste iPhone, bouton Android) : il ramène à l'écran parent au lieu de fermer Quotidien (exercice → parcours d'entraînement → Jeux → accueil ; mot intrus ou Défi → Jeux ; Progression, Stats, Jeux → accueil). Depuis l'accueil, il quitte normalement. Pendant une partie de Défi, il ne fait rien (le chrono tourne : on quitte avec « Abandonner »). Une boîte de dialogue ouverte se ferme. Technique : une seule entrée d'historique est gardée tant qu'on n'est pas sur l'accueil.

## L'onglet Jeux

Chaque carte indique : nom, une phrase, durée approximative, type de réflexion, état réel du joueur (records, avancement), un bouton. Aucun faux score : une carte sans donnée le dit (« Pas encore de record »). Les boutons des jeux sont à la couleur du jeu ; le vert reste réservé à la grille du jour, rappelée en haut de l'onglet tant qu'elle n'est pas jouée.

| Section | Carte | Ce que c'est |
|---|---|---|
| Défis rapides | Défi express | Le Défi existant (solo ou groupe). |
| Défis rapides | Expression mystère | Mini-jeu (ci-dessous), le seul qui rapporte de l'XP. |
| Défis rapides | Le mot intrus | Mini-jeu (ci-dessous). |
| Pour progresser | Mode entraînement | Le parcours de 20 exercices en 5 chapitres (« parcours par chapitres » : c'est le même mode, les chapitres sont affichés sur la carte). |
| Pour se challenger | Défi sans erreur | Pas un mode séparé : le défi de réussir un exercice d'entraînement **au premier essai, sans erreur ni indice**. Compteur calculé depuis le journal réel (entrées d'entraînement gagnées, 0 erreur, 0 indice, tentative 1). Le bouton ouvre le prochain exercice. |
| Pour se challenger | Mes records | Meilleurs résultats réellement enregistrés : Défi (paliers), mot intrus (score), grille (meilleur résultat), sans erreur (compteur). |

Les jeux non développés (feuille de route) n'apparaissent pas dans l'onglet.

## Expression mystère

**Règles.** Une partie = **5 expressions** : questions 1 et 2 faciles, 3 et 4 intermédiaires, 5 intermédiaire ou difficile ; jamais deux fois la même dans une partie ; les expressions jamais vues d'abord (quand toute la banque a été vue, le tour recommence). Chaque question montre l'expression avec un trou, un **indice** sur son sens et **4 propositions** (le mot et 3 leurres, dans un ordre mélangé). Le joueur touche une proposition (elle s'inscrit dans le trou ; il peut changer d'avis), puis **Valider** (une seule validation, même en cas de double clic). Ensuite : ✓ / ✗ (pas seulement des couleurs), la bonne réponse, l'expression complète, son **sens** et un **exemple**. « Expression suivante » quand le joueur le décide. Fin : score sur 5, pourcentage, temps total (mesuré, sans chrono affiché pendant la partie), XP réellement gagnée, objectifs débloqués, la liste des 5 expressions ; boutons « Rejouer » (principal), « Revoir les expressions », « Retour aux jeux ». Quitter en cours de partie ne l'enregistre pas.

**Pourquoi « choisir puis valider »** (plutôt qu'une réponse immédiate comme au mot intrus) : c'est le choix du fondateur ; sur téléphone, il évite qu'un mauvais toucher compte comme réponse, et voir le mot s'inscrire dans l'expression aide à décider. Une saisie libre est prévue plus tard (champ `variantes` de la banque).

**XP (dans le système existant, pas un second système).** +5 XP par expression trouvée **pour la première fois** (une expression ne rapporte qu'une fois, au total ; rejouer ne rapporte rien de plus ; plafond = 5 × nombre d'expressions). 4 objectifs : Première expression mystère (terminer une partie, 20 XP), Fin connaisseur (au moins 4/5, 30 XP), Sans fausse note (5/5, 40 XP), Dix expressions (10 expressions différentes trouvées, 50 XP). Technique : `PROG.enregistrerExpression` ajoute au journal une entrée `mode: "expression"` par expression nouvellement trouvée et une entrée `mode: "expression-partie"` par partie (0 XP, sert aux objectifs) ; une partie a un identifiant et n'est jamais enregistrée deux fois. Ces entrées sont **exclues** de tout ce qui concerne les grilles : grilles terminées et résolues, taux de réussite, série, objectifs et badges des grilles. Aucun événement « recompense » (événement du test) n'est envoyé pour ces parties.

**Statistiques** (onglet Stats, depuis le stockage local `quotidien_expression_<profil>`) : parties terminées, meilleur score, réussite moyenne, expressions découvertes (trouvées au moins une fois), parties parfaites. Sans partie : un message, aucun chiffre fictif.

**Banque.** `expressions.json` (version 1). Règles éditoriales : expression réelle et courante, sens et orthographe exacts, aucun leurre qui formerait une expression admise de même sens, leurres plausibles du même univers, pas d'étymologie incertaine présentée comme un fait, indice sans le mot ni un leurre. **Protection du test** (vérifiée par script) : aucune expression ne contient le cadre d'un groupe d'expressions du calendrier avec un mot de ce groupe (« Donner sa langue au chat » est refusé à cause du groupe « Donner sa ___ » de la grille 22), et aucun mot à trouver n'appartient à un groupe d'expressions du calendrier. Écrite par un rédacteur, contrôlée par script, relue par un relecteur indépendant le 30/10/2026 (44 validées, 1 leurre bloquant corrigé : HARENGS pour « serrés comme des sardines », 5 corrections mineures dont 4 variantes admises ajoutées pour la future saisie libre : HALLEBARDES, MÉTRO, PLAT, GENOUX). Pour enrichir : compléter `expressions.json`, augmenter `version`, `python3 verifier_expressions.py`, faire relire, `python3 generer_grilles_js.py`. Si la banque ne permet pas une partie valide, le jeu affiche un message et n'apparaît pas dans les Jeux.

**Données.** Participants seulement : événements `minijeu` avec `jeu = expression` (`ouverture`, `debut` avec les identifiants, `fin` avec score, durée, XP et réponses). Interrupteur `expression` dans `config.js`.

## Le mot intrus

**Règles.** Une série = **5 questions** : 2 faciles, 2 moyennes, 1 difficile, dans cet ordre. Chaque question montre une consigne et **4 mots** (ordre mélangé à chaque partie) : trois partagent un point commun, le quatrième est l'intrus. Le joueur touche un mot : réponse immédiate (✓ / ✗, pas seulement des couleurs), puis le critère et l'explication. Il passe à la suite **quand il le décide** (« Question suivante »). Pas de chrono, pas de deuxième essai. À la fin : score sur 5, les 5 explications, « Rejouer » (5 nouvelles questions) et « Autres jeux » ; rien ne se relance tout seul. Quitter en cours de série ne l'enregistre pas.

**Tirage.** Les questions jamais vues d'abord ; quand toute la banque a été vue, le tour recommence. Les questions vues sont mémorisées sur l'appareil.

**Récompenses.** Aucune XP (pour ne pas mélanger avec la grille du jour). Record = meilleur score sur 5. Trophées : Œil de lynx (5/5 une fois), Fin limier (5/5 trois fois), Tour complet (toute la banque vue). Stockage local `quotidien_intrus_<profil>`.

**Banque.** `intrus.json`, version 2, 60 questions. Règles éditoriales : une seule réponse raisonnablement défendable (chaque mot a été testé comme intrus possible par un autre critère), relation des trois autres plus précise que celle qui inclut l'intrus, mots connus du grand public, pas de classification contestable, consigne précise quand plusieurs lectures sont possibles (questions de forme : anagramme, mot caché…). **Aucun mot du calendrier du test** (vérifié par script) : le mini-jeu ne peut pas donner la réponse d'une grille future. Certaines catégories existent aussi dans des grilles (félins, fromages…), avec d'autres mots. Écrite par un rédacteur, contrôlée par `verifier_intrus.py`, relue par un relecteur indépendant (30/10/2026 : 52 validées, 3 erreurs bloquantes et 5 ambiguïtés mineures corrigées, dont un mot caché faux que le script ne voyait pas ; le script vérifie désormais chaque « X cache Y » lettre par lettre) ; seconde relecture le 30/10/2026 (version 2) : 2 questions à deux réponses défendables corrigées (CORSE, seule île française → CRÈTE ; FÉMUR, seul os de la cuisse → MOLLET remplacé par QUADRICEPS) et 3 retouches (aïkido = art martial, « deux têtes » du biceps, i046 passée en facile). Les explications ne répètent pas le critère affiché juste au-dessus. Pour ajouter des questions : compléter `intrus.json`, augmenter `version`, lancer `python3 verifier_intrus.py`, faire relire, puis `python3 generer_grilles_js.py`. S'il y a moins de 5 questions, le jeu est masqué.

**Données.** Participants seulement : événements de type **`minijeu`** (champ `jeu` = `intrus`, `action` = `ouverture`, `debut`, `fin` avec score et questions, `partage`). Aucun événement du test, aucune visite, aucun lien avec une grille. Interrupteur `intrus` dans `config.js` (`"tous"`, `"demo"`, `"aucun"`).

## Partage des résultats

Le partage est toujours volontaire (bouton). Grille du jour : inchangé (emojis de couleur, jamais les mots ni les catégories). Défi express et mot intrus (nouveau) : score et une ligne d'emojis (✅❌ par question, 🟩 par palier). Feuille de partage du téléphone si elle existe, sinon copie dans le presse-papiers avec un message « Score copié ». **Pas de lien** dans les partages des participants : un lien vers le site inscrirait l'ami au test sans passer par l'invitation mesurée. En démo, le lien de la démo est ajouté (il n'inscrit personne). Une carte image (capture partageable) est dans la feuille de route.

## Feuille de route des mini-jeux (non développés, non affichés aux joueurs)

Architecture prévue : une banque JSON par jeu (contenu séparé du moteur), un script `verifier_<jeu>.py`, un petit moteur (`<jeu>.js`) sur le modèle de `intrus.js`, une carte dans `rendreJeux()` (index.html), des événements `minijeu` avec `jeu = <nom>`, un interrupteur dans `config.js`. Aucun ne sera affiché avant d'être développé et testé.

1. **Expression mystère, saisie libre** : la version à 4 propositions existe (30/10/2026) ; la saisie libre validée contre les `variantes` reste à faire.
2. **Mots cachés** : repérer un mot court dans un mot long (un animal caché…). Le mot doit apparaître lettre par lettre ; règle explicite sur les accents (É = E ou non, à fixer et vérifier par script) ; l'explication montre la position exacte.
3. **Groupe mystère** : retrouver une association parmi 5 ou 6 mots (un seul groupe), avec le savoir-faire éditorial des grilles, sans copier une grille.
4. **Défi sans erreur (mode dédié)** : variante où la première erreur termine la partie, sans indice, sur les grilles d'entraînement uniquement (jamais le calendrier). Aujourd'hui, seul le compteur « sans erreur » existe.
5. **Défi personnel** : battre son record sur un exercice compatible, à partir des données réellement enregistrées.
6. **Carte de résultat image** (canvas) pour le partage, sans solution.

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
- Expression mystère (participants seulement) : ouverture, début (identifiants des expressions), fin (score, durée, XP gagnée, réponses justes ou fausses).
- Mot intrus (participants seulement) : ouverture, début (identifiants des questions), fin (score, réponses justes ou fausses, durée), partage.
- Réponses au questionnaire.

Aucun nom, e-mail, téléphone ou adresse. Pas de publicité, pas d'outil de suivi tiers. Les joueurs voient cette explication en bas de page.

## Limites de l'expérimentation (à lire avant d'interpréter les résultats)

- **Défi express** : sans compte, un joueur décidé peut tricher (envoi d'un faux score par les outils du navigateur ; le serveur ne refuse que les scores invraisemblables ; un même joueur sur deux appareils compte pour deux membres). Acceptable pour un jeu entre amis, pas pour des récompenses. Le départ « simultané » dépend de la connexion de chacun (rafraîchissement toutes les 2,5 s, départ calé sur l'heure du serveur) : quelques centaines de millisecondes d'écart sont possibles, sans effet sur le classement, puisque chacun a son propre chrono.

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

## Mettre en ligne (GitHub Pages)

1. Vérifier : `python3 verifier_grilles.py`, `python3 verifier_grilles.py entrainement.json`, `python3 verifier_variantes.py`, `python3 verifier_defi.py`, `python3 verifier_intrus.py`, `python3 verifier_expressions.py`, puis `python3 generer_grilles_js.py`.
2. Tester : `node tests/test_progression.js`, `node tests/test_defi.js`, `node tests/test_intrus.js`, `node tests/test_expression.js`, puis `node tests/test_parcours.js`, `node tests/test_entrainement.js`, `node tests/test_defi_parcours.js`, `node tests/test_demo_niveaux.js`, `node tests/test_jeux.js`, `node tests/test_expression_parcours.js` (Playwright requis).
3. Publier : `git push` sur la branche `main` du dépôt `matislaudy94-web/Quotidien`. GitHub Pages republie le site en 1 à 2 minutes (onglet *Actions* du dépôt pour suivre). Adresse : https://matislaudy94-web.github.io/Quotidien/ (Q majuscule).
4. Côté base : le type d'événement `minijeu` a été ajouté à la fonction `q_evenement` le 30/10/2026 (migration `evenement_type_minijeu`). Rien d'autre à faire.

## Journal des changements de la logique de collecte

Règle : aucune règle de comptabilisation ne change pendant un test. Tout changement est noté ici avec sa date.

| Date | Changement | Effet sur la lecture des résultats |
|---|---|---|
| 28/10/2026 (avant tout test) | Ajout d'un identifiant d'appareil anonyme (aléatoire, par navigateur) envoyé avec chaque visite. Nouvelle colonne « Appareils » et ligne « ⚠ Lien ouvert sur 2 appareils ou plus ». | Permet de repérer les liens transférés. Aucun autre compteur modifié. |
| 30/10/2026 (avant tout test) | **Nouveau mini-jeu « Expression mystère »** (onglet Jeux et tuile d'accueil) : +5 XP par expression trouvée la première fois et 4 objectifs **dans la progression existante** ; ces parties sont exclues des statistiques et objectifs des grilles. Événements `minijeu` (`jeu = expression`), lignes dédiées dans le tableau de bord hors mesures. | **Change le produit testé** et, pour les participants qui y jouent, **leur XP et leur niveau** (affichage seulement). Aucun compteur de l'entonnoir, aucun événement du test, aucun classement de visite modifié ; l'événement « recompense » (grille du jour) peut désormais porter un `xp_total` qui inclut de l'XP gagnée hors grille : pour l'analyse, utiliser `xp_partie`, inchangé. |
| 30/10/2026 (avant tout test) | **Réorganisation** : barre du bas Accueil · Quotidien · Jeux · Progression · Stats (avant : Accueil · Jouer · Défi · Badges · Stats) ; onglet **Jeux** (3 sections) ; onglet **Progression** (niveaux, objectifs, badges, trophées réunis) ; accueil allégé (3 tuiles de jeux, derniers résultats, 2 objectifs au lieu de 3, raccourcis supprimés) ; bouton retour du téléphone géré. **Nouveau mini-jeu « Le mot intrus »** (sans XP, records et trophées) avec un **nouveau type d'événement `minijeu`** (base : `q_evenement` accepte `minijeu`). Défi express : bouton « Partager mon score » (sans lien) et « Autres jeux » en fin de partie, trace `defi` action `partage` ; banque : MENTON → PAUPIÈRE (aussi une ville), DELTA retiré (aussi un relief). Tableau de bord : lignes du mot intrus et du partage du Défi dans le tableau hors mesures. | **Change le produit testé** (un jeu de plus, navigation différente) : les participants peuvent jouer davantage le même jour, ce qui peut jouer sur le retour du lendemain, de la même façon pour R et S. Aucun compteur de l'entonnoir, aucun événement du test, aucun classement de visite modifié. Le mot intrus ne crée ni visite ni événement du test. Le changement de banque du Défi modifie les tirages d'une graine donnée (sans effet : aucune manche en cours). |
| 29/10/2026 (avant tout test) | **Défi express : changements de format signalés** (paliers 4, 8, 13 et 19). Au palier qui précède : « Attention : au prochain palier, N groupes de T mots ». Au changement : annonce plein écran (nouveau format, ancien format, schéma des groupes, consigne), chrono arrêté, fermeture d'un toucher ou après 2,6 s. Pendant tout le palier : format surligné « Nouveau ! » dans l'en-tête. | Hors mesures du test. En groupe, chaque joueur a le chrono arrêté pendant l'annonce : pas d'effet sur le classement. |
| 29/10/2026 (avant tout test) | **Défi express : un seul chrono de 30 s pour toute la partie, +2 s par groupe trouvé, −2 s par erreur** (avant : 30 s par palier, −5 s par erreur). Départage : temps de jeu au dernier palier réussi. Anciens records locaux mis de côté. **Écran de fin** : la solution et ses explications viennent juste sous le résultat (avant : sous le récapitulatif XP et le partage) ; l'XP gagnée reste annoncée dans le résultat, son détail et le bouton d'invitation passent dessous. **Explications des groupes réécrites** (calendrier, versions de rechange, entraînement) : sens des expressions, mécanisme des mots cachés, pièges signalés ; catégories et mots inchangés. | Défi : hors mesures du test, aucun compteur touché. Écran de fin : l'ordre change mais tous les blocs restent ; « Oui, je veux jouer la prochaine » et le questionnaire gardent leur place après la solution. Aucun événement ni classement de visite modifié. |
| 29/10/2026 (avant tout test) | **Solution jamais montrée après un échec** (grille du jour, démo, entraînement) : seuls les groupes trouvés par le joueur sont rappelés ; solution et explications après une réussite seulement. Bouton « Comprendre la solution » retiré (l'action `solution` des traces d'entraînement n'est plus émise). Accueil : les mini-jeux (Entraînement, Défi express) sont regroupés en deux tuiles colorées juste sous la grille du jour ; une fois la grille du jour jouée, « Voir mon résultat » n'est plus le bouton vert principal. | **Change ce que voit un participant qui perd** : il ne découvre plus les groupes manqués. Peut jouer sur la frustration, la curiosité et donc le retour du lendemain, dans un sens ou dans l'autre, de la même façon pour les groupes R et S. Aucun compteur, événement ni classement de visite modifié. |
| 29/10/2026 (avant tout test) | **Démo : 3 versions par grille** (90 versions de rechange). Chaque partie terminée en démo passe à la version suivante ; XP et déblocage restent par grille. | Aucun effet sur les participants ni sur les mesures (démo uniquement). |
| 28/10/2026 (avant tout test) | **Démo : déblocage corrigé et enchaînement.** Une grille de démo ratée puis réussie débloquait pas la suivante (le déblocage lisait le journal d'XP, qui ne garde que la première partie de chaque grille) : les réussites de démo sont désormais gardées à part (`quotidien_demo_reussies`), l'XP reste comptée une seule fois. Carte des grilles (✓ réussie / à jouer / 🔒) à la place du menu déroulant ; après une réussite, « 🔓 Grille n débloquée » et « Jouer la grille n → » juste sous le résultat, avec un bouton qui reste visible en bas d'écran ; après un échec, « Réessayer la grille ». Pas de questionnaire en démo. Même bouton collant pour « Exercice suivant » en entraînement. | Aucun effet sur les participants ni sur les mesures (démo et entraînement uniquement). |
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

`node tests/test_demo_niveaux.js` : démo, rotation des 3 versions (aucun mot déjà vu au réessai, retour à la version 1 après la 3), carte des grilles, déblocage après réussite (y compris réussite après un échec), grille suivante proposée et lancée en un clic, bouton collant, rechargement, XP comptée une seule fois.

`node tests/test_defi.js` (19 vérifications) : reproductibilité du tirage, règles de tirage sur 90 000 paliers, variété, vérification des sélections, classement, records et badges, aucune XP. `node tests/test_defi_parcours.js` (iPhone 13 et SE, plusieurs téléphones en même temps) : partie solo (paliers, chrono unique, erreur −2 s, groupe +2 s, annonce des changements de format, temps écoulé, record), nouveau tirage à chaque partie, création de groupe, ami non participant qui rejoint (pseudo déjà pris refusé, non inscrit au test), arrivée en direct dans la salle d'attente, lancement par l'hôte, compte à rebours et départ automatique communs, même tirage, points du petit bac, classement général avec égalités, retardataire renvoyé à la manche suivante, rechargement en pleine manche, absent et clôture par l'hôte, visite `retour_defi`, mesures du test non contaminées, mode démo, code invalide.

`node tests/test_expression.js` : banque, tirage (5 expressions sans répétition, progression facile → difficile, propositions = mot + 3 leurres, reproductible, bon mot à toutes les places, expressions vues évitées), statistiques locales (une partie comptée une fois), XP (4 nouvelles = 20 + objectifs = 70, même partie = rien, rejouer = 0, parfaite, 10 expressions, total exact), aucune partie comptée comme grille, objectifs des grilles intacts, grille réelle ensuite comptée normalement. `node tests/test_expression_parcours.js` (iPhone 13 et SE) : accès depuis Jeux, accueil du jeu sans score fictif, question (numéro, barre, trou, indice, 4 propositions, Valider inactif), changement de proposition, mot inscrit dans l'expression, double clic = une validation, mauvaise réponse (verdict, bonne réponse, expression, sens, exemple, ✓/✗), pas d'enchaînement automatique, résultat (score, %, temps, XP +70 détaillée, objectifs), revoir les expressions, persistance après rechargement, rejeu sans expression déjà vue, partie parfaite et montée de niveau, aucun double crédit (135 XP), stats et progression, grille du jour intacte, aucun événement du test, événements `minijeu`, iPhone SE (pas de débordement, propositions ≥ 44 px, Valider visible).

`node tests/test_jeux.js` (iPhone 13 et SE) : barre du bas (5 onglets), onglet Jeux (3 sections, 5 cartes avec durée et bouton, états réels sans faux score, rappel de la grille du jour), série complète du mot intrus (pas d'enchaînement automatique, retour immédiat ✓/✗, critère et explication, 4/5, explications, rejouer), partage (copie, sans lien pour un participant, lien démo en démo), événements `minijeu` séparés et aucun événement du test, aucune XP, records sur l'accueil, l'onglet Jeux, les stats et la progression, bouton retour du téléphone (mot intrus → Jeux → accueil → sortie ; exercice → parcours avec sauvegarde ; Défi en cours non interrompu), fin du Défi (partage, autres jeux), démo sans événement, iPhone SE (pas de débordement, libellés de la barre entiers, zones tactiles ≥ 44 px, mots dans leur case), aucune erreur JavaScript. `node tests/test_intrus.js` : banque (taille, aucun mot du calendrier), tirage (composition 2/2/1, sans doublon, reproductible, mots mélangés, intrus à toutes les places, questions vues évitées), records et trophées, aucune XP.

`node tests/test_entrainement.js` (71 vérifications, iPhone 13 et iPhone SE) couvre le mode entraînement : accueil avec les deux modes, grille du jour inchangée, ouverture du parcours, réussite et « Exercice suivant », échec après 4 erreurs, « Réessayer » (remise à zéro de la tentative, chronomètre, progression intacte), échec avec un groupe trouvé (seul ce groupe rappelé, solution cachée, puis réussite avec XP), « Passer » sans XP, reprise après rechargement (groupes, erreurs, sélection, temps actif), absence de double crédit, statistiques séparées, mode démo indépendant, données du test non contaminées (seuls les événements de la grille du jour, visites non comptées comme retours, traces `entrainement` séparées), petits écrans (pas de défilement horizontal, zones tactiles ≥ 44 px, bouton Valider visible).

`node tests/test_parcours.js` lance un serveur local avec une base **simulée**, puis un navigateur Chromium en émulation iPhone. Ces tests vérifient :
- la création de la session et des participants (alternance R/S) ;
- l'enregistrement de « lien envoyé » ;
- une victoire avec une erreur, puis une défaite (solution non révélée, seul le groupe trouvé rappelé) ;
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
