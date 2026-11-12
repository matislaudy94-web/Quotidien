# Analyse des exports du test

Ce dossier contient un seul outil : `analyser_export.py`. Il lit les deux fichiers CSV téléchargés depuis `admin.html` et écrit un rapport en français. Il ne se connecte à rien (ni à Supabase, ni à Internet) et ne modifie aucun fichier du jeu.

**Ce dossier ne contient aucun résultat.** Tant que les exports réels n'ont pas été fournis, il n'existe aucun chiffre du test. Les seules données d'essai sont fabriquées par `tests/test_analyse.py`, dans un dossier temporaire effacé à la fin, avec des identifiants qui commencent par « FIC » (fictif).

## Mode d'emploi

1. Ouvrir `admin.html` (adresse en ligne), section **Export**, et cliquer les deux boutons : **Participants (CSV)** puis **Tous les événements (CSV)**. Faire les deux à la suite, le même jour.
2. **Ne pas ouvrir puis ré-enregistrer ces fichiers avec Excel** : Excel change les dates et le séparateur. Pour les regarder, travailler sur une copie.
3. Ouvrir un terminal dans le dossier `Quotidien` et lancer (en remplaçant les noms par ceux des fichiers téléchargés) :

   ```
   python3 analyse/analyser_export.py quotidien_participants_XXXX.csv quotidien_evenements_XXXX.csv --sortie rapport.md
   ```

4. Ouvrir `rapport.md` (dans un éditeur de texte, ou sur GitHub qui affiche les tableaux). Sans `--sortie`, le rapport s'affiche dans le terminal.

Il faut Python 3.9 ou plus récent, sans rien installer. Sous Windows, si le rapport signale que le fuseau « Europe/Paris » est indisponible : `pip install tzdata`, puis relancer.

Options utiles :

| Option | Quand s'en servir |
|---|---|
| `--fin 2026-11-14` | L'export a été fait en cours de journée : indiquer la veille, pour ne pas compter une journée incomplète comme un jour sans retour. |
| `--debut 2026-11-01` | La date du premier jour n'est pas dans les exports ; le script la déduit des grilles jouées et l'écrit dans le rapport. L'imposer si elle est fausse. |
| `--grilles chemin/grilles.json` | Si le script est lancé ailleurs que dans le dépôt. |

Vérifier que l'outil fonctionne (données fictives, rien n'est enregistré) : `python3 tests/test_analyse.py`. Chaque ligne doit commencer par `OK`.

## Ce que contient le rapport

1. Qualité des données (lignes, colonnes manquantes, période, orphelins, appareils multiples, événements hors période, doublons).
2. Entonnoir : lien envoyé → a ouvert → a commencé → a terminé → a résolu.
3. Participation par jour de test (J1, J2…).
4. Rétention J1, J3, J7 et « a joué au moins k jours », par groupe ; retours spontanés et après rappel.
5. Résultats par grille, avec le niveau prévu dans `grilles.json`.
6. Mini-jeux et entraînement.
7. Partage.
8. Ce que les données permettent de conclure, et ce qu'elles ne permettent pas.

Si une colonne manque dans un export, le rapport l'écrit en tête de section 1 et marque « non calculable » les seuls indicateurs concernés.

## Définitions

Elles reprennent celles du `README.md` principal (« Définitions des mesures ») ; en cas de doute, c'est lui qui fait foi.

| Terme | Définition utilisée par le script |
|---|---|
| Jour | Jour en heure de Paris, recalculé à partir de `date_heure_utc`. Une partie commencée à 0 h 30 à Paris compte pour le nouveau jour. |
| J1, J2… (jour de test) | J1 = premier jour du calendrier de la session. |
| A ouvert | Au moins un événement `visite`. Ce n'est pas une preuve d'intérêt. |
| A commencé | Au moins un événement `debut` (un mot sélectionné). |
| A terminé / a résolu | Événement `fin` ; résolu si `gagne` vaut 1. Si une partie a deux `fin` (rechargement), seule la première compte. |
| A joué un jour | Au moins un `debut` de grille du calendrier ce jour-là. L'entraînement, le Défi et les mini-jeux ne comptent pas. |
| Rétention Jk | A joué exactement k jours après son premier jour de jeu. Ne sont comptés que les joueurs pour qui ce jour est déjà passé dans la période analysée. |
| Retour spontané, après rappel, rappel probable, par le Défi | Classement fait par la base à chaque visite (colonne `classe_visite`) ; le script ne le recalcule pas. |
| Abandon | A commencé une grille sans jamais la terminer. |
| Réussite d'une grille | Parties résolues / parties terminées. |
| Temps actif | `duree_s` : temps à l'écran, pauses exclues. |
| Clic « Inviter » | Événement `partage` dont la méthode n'est ni `annule` ni `echec`. Intention de partager, pas preuve d'envoi. |
| Invité effectif | Participant du groupe `invite` qui a commencé une partie. |
| Orphelin | Identifiant « organique » sans aucune visite (créé par un rechargement de page). |
| Participant-jour | Un participant, un jour où il a au moins un événement. Unité du tableau « mini-jeu le jour J / retour à J+1 ». |

## Comment lire les chiffres

- Chaque pourcentage est écrit `k/n = p % [IC 95 % : a–b %]`. `k/n` est le compte réel. L'intervalle (méthode de Wilson) donne la fourchette dans laquelle se trouverait vraisemblablement le « vrai » pourcentage avec beaucoup plus de joueurs. Exemple : 4/15 = 27 % se lit « entre 11 % et 52 % ».
- **« non interprétable »** : l'indicateur repose sur moins de 10 personnes ou parties. Garder le compte brut, oublier le pourcentage.
- Les groupes R et S comptent une quinzaine de personnes chacun : le rapport ne conclut à une différence que si les deux intervalles ne se chevauchent pas, ce qui demande un écart massif.
- La « lecture du calibrage » des grilles applique des seuils indicatifs, écrits dans le rapport et modifiables en tête de `analyser_export.py` (`SEUIL_N`, `CAL_…`).

## Ce que les exports ne permettent pas de calculer

- **Le calendrier de la session** (quelle grille quel jour) n'est pas exporté : il est déduit de la règle « grille n le jour n ». Si le calendrier a été modifié à la main, utiliser `--debut` et lire la ligne « autre grille que celle prévue ».
- **La date et l'heure des rappels** ne sont pas exportées (seulement leur nombre par participant, `rappels_envoyes`). On ne peut pas mesurer le délai entre un rappel et un retour, ni reclasser les visites.
- **Les amis non participants du Défi** et les scores des groupes ne sont pas dans les exports.
- **Le début d'une partie de Défi** n'est pas tracé (ouverture et fin seulement).
- **L'envoi réel d'une invitation** : seul le clic est connu.
- **Les joueurs qui changent de navigateur** sans leur lien deviennent de nouveaux « organiques » : les retours sont des minimums.
- **La raison d'un abandon** et tout ce qui se passe hors de l'écran.
