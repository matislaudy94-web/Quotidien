#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analyse des deux exports CSV de admin.html (test utilisateur « Quotidien »).

Usage :
    python3 analyse/analyser_export.py participants.csv evenements.csv [--sortie rapport.md]

Python 3.9+ standard, aucune dépendance. Le script ne contacte aucun serveur :
il ne lit que les deux fichiers fournis et grilles.json (niveau prévu des grilles).

Les noms de colonnes viennent du code de admin.html (section « Export CSV ») :
  - participants : admin.html, bouton « btn-csv-participants » (ligne 429 au 12/11/2026)
  - événements   : admin.html, bouton « btn-csv-evenements » (ligne 435 au 12/11/2026)
Si une colonne manque dans un export réel, le rapport le dit et continue avec le reste.
"""
import argparse
import csv
import io
import json
import math
import os
import re
import statistics
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone

try:
    from zoneinfo import ZoneInfo
    PARIS = ZoneInfo("Europe/Paris")
except Exception:  # Windows sans le paquet « tzdata », ou Python < 3.9
    PARIS = None

# ---------------------------------------------------------------------------
# Colonnes attendues (copiées de admin.html, lignes 429 et 435 au 12/11/2026)
# ---------------------------------------------------------------------------
COLS_PARTICIPANTS = ["id", "groupe", "invite_par", "lien_envoye_le", "visites", "a_commence",
                     "grilles_commencees", "grilles_terminees", "grilles_resolues",
                     "a_demande_autre_grille", "jours_revenu_sans_rappel", "retours_apres_rappel",
                     "retours_rappel_probable", "clics_inviter", "invites_ayant_joue",
                     "appareils_distincts", "rappels_envoyes", "derniere_visite"]
COLS_EVENEMENTS = ["id", "date_heure_utc", "jour_paris", "participant", "groupe", "visite", "grille",
                   "type", "classe_visite", "entree", "appareil", "correct", "erreurs", "gagne",
                   "duree_s", "donnees_json"]

# Types d'événements (tests/serveur_test.js lignes 41 et 44)
TYPES_CONNUS = {"visite", "debut", "essai", "fin", "demande_suivante", "partage", "questionnaire",
                "regles", "recompense", "indice", "entrainement", "defi", "minijeu"}
# Classes de visite attribuées par la base (tests/serveur_test.js ligne 40)
CLASSES = ["premiere_visite", "revisite_meme_jour", "retour_apres_rappel", "retour_rappel_probable",
           "retour_defi", "retour_spontane"]
LIB_CLASSE = {"premiere_visite": "Première visite", "revisite_meme_jour": "Revisite le même jour (pas un retour)",
              "retour_apres_rappel": "Retour après rappel", "retour_rappel_probable": "Retour rappel probable",
              "retour_defi": "Retour par le lien de Défi d'un ami", "retour_spontane": "Retour spontané",
              "": "Classe absente"}
LIB_GROUPE = {"R": "R (rappels)", "S": "S (sans rappel)", "invite": "Invités", "organique": "Organiques"}

# Seuils (modifiables ici ; ils sont rappelés dans le rapport)
SEUIL_N = 10            # en dessous : « non interprétable »
SEUIL_IC_LARGE = 0.30   # intervalle de confiance plus large que 30 points : ordre de grandeur seulement
PALIERS_JOURS = [1, 2, 3, 5, 7, 10, 14]
RETENTION_K = [1, 3, 7]
# Calibrage des grilles (indicatif) : (niveau prévu) -> règles, appliquées seulement si n terminées >= SEUIL_N
CAL_FACILE_REUSSITE_MIN = 0.70
CAL_FACILE_ERREURS_MAX = 2.5
CAL_INTER_REUSSITE_MIN = 0.40
CAL_INTER_REUSSITE_MAX = 0.95
CAL_DIFFICILE_REUSSITE_MAX = 0.90
CAL_INJUSTE_MIN = 3     # au moins 3 personnes « plusieurs injustes »…
CAL_INJUSTE_PART = 0.30  # … et au moins 30 % des réponses


# ---------------------------------------------------------------------------
# Outils statistiques et de mise en forme
# ---------------------------------------------------------------------------
def wilson(k, n, z=1.959964):
    """Intervalle de confiance à 95 % de Wilson pour k succès sur n. None si n = 0."""
    if not n:
        return None
    p = k / n
    d = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / d
    demi = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (0.0 if k <= 0 else max(0.0, centre - demi), 1.0 if k >= n else min(1.0, centre + demi))


def pc(x):
    return f"{round(100 * x)} %"


def prop(k, n):
    """« k/n = p % [IC 95 % : a–b %] », avec l'étiquette « non interprétable » si n < 10."""
    if not n:
        return f"{k}/0 : non calculable"
    lo, hi = wilson(k, n)
    s = f"{k}/{n} = {pc(k / n)} [IC 95 % : {round(100 * lo)}–{round(100 * hi)} %]"
    if n < SEUIL_N:
        s += f" · non interprétable (n < {SEUIL_N})"
    return s


def fr(x, dec=1):
    return f"{x:.{dec}f}".replace(".", ",")


def stat_num(valeurs, genre="moyenne", unite=""):
    """Moyenne ou médiane avec son effectif, étiquetée si n < 10."""
    v = [x for x in valeurs if x is not None]
    if not v:
        return "– (n = 0)"
    val = statistics.mean(v) if genre == "moyenne" else statistics.median(v)
    txt = (fr(val) if genre == "moyenne" else (str(int(round(val))) if unite else fr(val))) + unite
    s = f"{txt} (n = {len(v)})"
    if len(v) < SEUIL_N:
        s += f" · non interprétable (n < {SEUIL_N})"
    return s


def cellule(x):
    return str(x).replace("|", "\\|").replace("\r", " ").replace("\n", " ")


def tableau(entetes, lignes):
    out = ["| " + " | ".join(cellule(e) for e in entetes) + " |",
           "|" + "|".join(["---"] * len(entetes)) + "|"]
    for l in lignes:
        out.append("| " + " | ".join(cellule(c) for c in l) + " |")
    return out


# ---------------------------------------------------------------------------
# Lecture des fichiers
# ---------------------------------------------------------------------------
RE_APOSTROPHE = re.compile(r"^'(?=[=+\-@\t\r])")


def lire_csv(chemin, avert):
    """Lit un CSV de admin.html : BOM UTF-8, séparateur « ; », guillemets doublés, retours ligne dans les cellules.
    Renvoie (colonnes, lignes sous forme de dictionnaires)."""
    with open(chemin, "rb") as f:
        brut = f.read()
    try:
        texte = brut.decode("utf-8-sig")
    except UnicodeDecodeError:
        texte = brut.decode("cp1252", errors="replace")
        avert.append(f"`{os.path.basename(chemin)}` n'est pas en UTF-8 (fichier probablement ré-enregistré par Excel) : "
                     "les accents et les dates peuvent être abîmés. Utiliser le fichier tel que téléchargé.")
    texte = texte.lstrip("\ufeff")
    premiere = texte.split("\n", 1)[0]
    sep = ";"
    if premiere.count(";") == 0 and premiere.count(",") > 0:
        sep = ","
        avert.append(f"`{os.path.basename(chemin)}` : séparateur « , » détecté au lieu de « ; » (fichier ré-enregistré ?).")
    elif premiere.count(";") == 0 and premiere.count("\t") > 0:
        sep = "\t"
        avert.append(f"`{os.path.basename(chemin)}` : séparateur tabulation détecté au lieu de « ; » (fichier ré-enregistré ?).")
    lecteur = csv.reader(io.StringIO(texte, newline=""), delimiter=sep, quotechar='"')
    lignes = [l for l in lecteur if any(c.strip() for c in l)]
    if not lignes:
        return [], []
    cols = [c.strip().lstrip("\ufeff").lower() for c in lignes[0]]
    res, mal = [], 0
    for l in lignes[1:]:
        if len(l) != len(cols):
            mal += 1
        # admin.html (fonction csv) place une apostrophe devant un texte qui commence par = + - @ pour qu'un tableur
        # ne l'exécute pas comme une formule : on la retire pour retrouver la valeur d'origine.
        res.append({c: RE_APOSTROPHE.sub("", l[i].strip()) if i < len(l) else "" for i, c in enumerate(cols)})
    if mal:
        avert.append(f"`{os.path.basename(chemin)}` : {mal} ligne(s) n'ont pas le même nombre de cellules que l'en-tête "
                     "(lues quand même, cellules manquantes laissées vides).")
    return cols, res


RE_ISO = re.compile(r"^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d+))?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?$", re.I)
RE_FR = re.compile(r"^(\d{2})/(\d{2})/(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$")


def lire_date(s, compteur=None):
    """Date ISO avec ou sans fuseau -> datetime en UTC. Sans fuseau : supposée UTC (la colonne s'appelle date_heure_utc)."""
    s = (s or "").strip()
    if not s:
        return None
    m = RE_ISO.match(s)
    if m:
        a, mo, j, h, mi, sec, frac, tz = m.groups()
        micro = int(((frac or "") + "000000")[:6])
        try:
            d = datetime(int(a), int(mo), int(j), int(h), int(mi), int(sec or 0), micro)
        except ValueError:
            return None
        if tz and tz.upper() != "Z":
            signe = 1 if tz[0] == "+" else -1
            chiffres = tz[1:].replace(":", "")
            decal = timedelta(hours=int(chiffres[:2]), minutes=int(chiffres[2:4] or 0))
            return (d - signe * decal).replace(tzinfo=timezone.utc)
        if not tz and compteur is not None:
            compteur["sans_fuseau"] += 1
        return d.replace(tzinfo=timezone.utc)
    m = RE_FR.match(s)
    if m:
        j, mo, a, h, mi, sec = m.groups()
        if compteur is not None:
            compteur["format_excel"] += 1
        try:
            return datetime(int(a), int(mo), int(j), int(h), int(mi), int(sec or 0), tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def lire_jour(s):
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})", (s or "").strip())
    if not m:
        m2 = re.match(r"^(\d{2})/(\d{2})/(\d{4})", (s or "").strip())
        if not m2:
            return None
        try:
            return date(int(m2.group(3)), int(m2.group(2)), int(m2.group(1)))
        except ValueError:
            return None
    try:
        return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    except ValueError:
        return None


def jour_paris(dt):
    return dt.astimezone(PARIS).date() if (dt and PARIS) else None


def booleen(s):
    if isinstance(s, bool):
        return s
    s = str(s if s is not None else "").strip().lower()
    if s in ("1", "true", "vrai", "oui"):
        return True
    if s in ("0", "false", "faux", "non"):
        return False
    return None


def nombre(s):
    if isinstance(s, bool):
        return None
    if isinstance(s, (int, float)):
        return s
    s = str(s if s is not None else "").strip().replace(",", ".").replace("\u202f", "").replace(" ", "")
    if not s:
        return None
    try:
        x = float(s)
        return int(x) if x == int(x) else x
    except ValueError:
        return None


def charger_grilles(chemin, avert):
    """grilles.json : liste ordonnée {id, titre, niveau, groupes…}. L'ordre du fichier est l'ordre du calendrier."""
    if not chemin or not os.path.exists(chemin):
        avert.append("`grilles.json` introuvable : le niveau prévu des grilles et le calendrier (grille prévue chaque jour) "
                     "ne sont pas disponibles. Indiquer son chemin avec `--grilles`.")
        return []
    try:
        with open(chemin, encoding="utf-8") as f:
            g = json.load(f)
        return [x for x in g if isinstance(x, dict) and x.get("id")]
    except Exception as e:
        avert.append(f"`grilles.json` illisible ({e}) : niveaux prévus et calendrier non disponibles.")
        return []


def normaliser_evenements(cols, lignes, avert, qual):
    """Transforme chaque ligne en dictionnaire homogène. Chaque champ est pris dans sa colonne, sinon dans donnees_json."""
    a = set(cols)
    cpt = Counter()
    evs, json_ko, sans_date, ecart_jour = [], 0, 0, 0
    for i, l in enumerate(lignes):
        d = {}
        brut = l.get("donnees_json", "")
        if brut:
            try:
                d = json.loads(brut)
                if not isinstance(d, dict):
                    d = {}
            except ValueError:
                json_ko += 1
        dt = lire_date(l.get("date_heure_utc", ""), cpt)
        jcol = lire_jour(l.get("jour_paris", ""))
        j = jour_paris(dt) or jcol
        if dt and PARIS and jcol and jcol != j:
            ecart_jour += 1
        if j is None:
            sans_date += 1

        def champ(col, cle, conv=lambda x: x):
            v = l.get(col, "") if col in a else ""
            if v == "" and cle in d and d[cle] is not None:
                v = d[cle]
            return conv(v)

        evs.append({
            "rang": i, "id": l.get("id", ""), "dt": dt, "jour": j,
            "p": l.get("participant", ""), "groupe": l.get("groupe", ""), "visite": l.get("visite", ""),
            "grille": l.get("grille", ""), "type": l.get("type", ""),
            "classe": str(champ("classe_visite", "classe") or ""), "entree": str(champ("entree", "entree") or ""),
            "appareil": str(champ("appareil", "appareil") or ""),
            "correct": champ("correct", "correct", booleen), "erreurs": champ("erreurs", "erreurs", nombre),
            "gagne": champ("gagne", "gagne", booleen), "duree_s": champ("duree_s", "duree_s", nombre),
            "d": d,
        })
    if json_ko:
        avert.append(f"{json_ko} cellule(s) `donnees_json` illisibles (JSON abîmé) : leurs détails sont ignorés.")
    if cpt["sans_fuseau"]:
        avert.append(f"{cpt['sans_fuseau']} date(s) sans fuseau horaire : supposées en UTC (nom de la colonne : `date_heure_utc`).")
    if cpt["format_excel"]:
        avert.append(f"{cpt['format_excel']} date(s) au format JJ/MM/AAAA (fichier ré-enregistré par un tableur ?) : supposées en UTC, "
                     "secondes et fuseau peut-être perdus.")
    if ecart_jour:
        avert.append(f"{ecart_jour} événement(s) dont la colonne `jour_paris` ne correspond pas à `date_heure_utc` convertie en heure de Paris : "
                     "le script utilise sa propre conversion.")
    if PARIS is None:
        avert.append("Fuseau « Europe/Paris » indisponible sur cet ordinateur (sous Windows : `pip install tzdata`) : "
                     "les jours sont lus dans la colonne `jour_paris` de l'export au lieu d'être recalculés.")
    qual["sans_date"] = sans_date
    # ordre chronologique stable (date serveur, puis ordre du fichier)
    evs.sort(key=lambda e: (e["dt"] or datetime.max.replace(tzinfo=timezone.utc), e["rang"]))
    return evs


# ---------------------------------------------------------------------------
# Analyse
# ---------------------------------------------------------------------------
def analyser(chemin_participants, chemin_evenements, chemin_grilles=None, debut=None, fin=None):
    """Renvoie (rapport Markdown, dictionnaire des résultats chiffrés)."""
    avert, qual, res = [], {}, {}
    R = []  # lignes du rapport
    colsP, lignesP = lire_csv(chemin_participants, avert)
    colsE, lignesE = lire_csv(chemin_evenements, avert)
    manqueP = [c for c in COLS_PARTICIPANTS if c not in colsP]
    manqueE = [c for c in COLS_EVENEMENTS if c not in colsE]
    surplusP = [c for c in colsP if c not in COLS_PARTICIPANTS]
    surplusE = [c for c in colsE if c not in COLS_EVENEMENTS]
    aP, aE = set(colsP), set(colsE)
    a_json = "donnees_json" in aE
    grilles = charger_grilles(chemin_grilles, avert)
    ordre = [g["id"] for g in grilles]
    rang_grille = {g: i for i, g in enumerate(ordre)}
    niveau = {g["id"]: g.get("niveau") or "?" for g in grilles}

    tous_ev = normaliser_evenements(colsE, lignesE, avert, qual)

    def dispo(*champs):
        """Un champ d'événement est disponible s'il a sa colonne ou s'il peut venir de donnees_json."""
        directs = {"classe": "classe_visite", "entree": "entree", "appareil": "appareil", "correct": "correct",
                   "erreurs": "erreurs", "gagne": "gagne", "duree_s": "duree_s"}
        return all((directs.get(c, c) in aE) or (c in directs and a_json) for c in champs)

    def absent(quoi, colonnes):
        return f"*Non calculable : {quoi} — colonne(s) absente(s) de l'export : {', '.join('`' + c + '`' for c in colonnes)}.*"

    # ---- Participants : union de l'export participants et des identifiants vus dans les événements
    P = {}
    for l in lignesP:
        pid = l.get("id", "")
        if not pid:
            continue
        P[pid] = {"id": pid, "groupe": l.get("groupe", "") or "inconnu", "invite_par": l.get("invite_par", ""),
                  "csv": l, "dans_export": True}
    hors_export = set()
    for e in tous_ev:
        if e["p"] and e["p"] not in P:
            hors_export.add(e["p"])
            P[e["p"]] = {"id": e["p"], "groupe": e["groupe"] or "inconnu", "invite_par": "", "csv": {}, "dans_export": False}
    groupes = [g for g in ["R", "S", "invite", "organique"] if any(p["groupe"] == g for p in P.values())]
    groupes += sorted({p["groupe"] for p in P.values()} - set(groupes))
    lib_g = lambda g: LIB_GROUPE.get(g, g)
    membres = lambda g: [p for p in P.values() if g == "*" or p["groupe"] == g]

    # ---- Calendrier : la date du premier jour n'est PAS dans les exports. On la déduit des grilles jouées.
    debut_source = "indiquée avec `--debut`"
    dates = [e["jour"] for e in tous_ev if e["jour"]]
    if debut is None and dates:
        cand = Counter()
        base = [e for e in tous_ev if e["type"] == "debut" and e["jour"] and e["grille"] in rang_grille]
        for e in base:
            cand[e["jour"] - timedelta(days=rang_grille[e["grille"]])] += 1
        if cand:
            debut, nb = cand.most_common(1)[0]
            debut_source = (f"déduite des événements : {nb}/{len(base)} débuts de partie correspondent à « grille n le jour n » "
                            "(README, « Lancer un test »). À vérifier, ou imposer avec `--debut AAAA-MM-JJ`")
        else:
            debut = min(dates)
            debut_source = ("prise égale au premier événement, faute de pouvoir la déduire des grilles "
                            "(à imposer avec `--debut AAAA-MM-JJ`)")
    fin_source = "indiquée avec `--fin`" if fin else "dernier événement de l'export"
    if fin is None and dates:
        fin = max(d for d in dates if debut is None or d >= debut) if any(debut is None or d >= debut for d in dates) else max(dates)
    if debut and ordre:
        fin_cal = debut + timedelta(days=len(ordre) - 1)
        if fin and fin > fin_cal:
            fin, fin_source = fin_cal, f"dernier jour du calendrier ({len(ordre)} grilles)"

    def prevue(j):
        if not (debut and ordre):
            return None
        i = (j - debut).days
        return ordre[i] if 0 <= i < len(ordre) else None

    hors = [e for e in tous_ev if e["jour"] and debut and fin and not (debut <= e["jour"] <= fin)]
    EV = [e for e in tous_ev if e["jour"] and debut and fin and debut <= e["jour"] <= fin]
    nb_jours = (fin - debut).days + 1 if (debut and fin) else 0
    jours = [debut + timedelta(days=i) for i in range(nb_jours)]

    par_p = defaultdict(list)
    for e in EV:
        par_p[e["p"]].append(e)
    de_type = lambda p, t: [e for e in par_p.get(p, []) if e["type"] == t]

    # Premières fins par (participant, grille) : une partie terminée deux fois ne compte qu'une fois (README, « doublons »).
    fins, doublons_fin = {}, Counter()
    for e in EV:
        if e["type"] == "fin":
            cle = (e["p"], e["grille"])
            if cle in fins:
                doublons_fin[cle] += 1
            else:
                fins[cle] = e
    debuts = defaultdict(set)   # grille -> participants ayant commencé
    jours_joues = defaultdict(set)  # participant -> jours avec au moins un « debut » (grille du calendrier)
    for e in EV:
        if e["type"] == "debut":
            debuts[e["grille"]].add(e["p"])
            jours_joues[e["p"]].add(e["jour"])

    # =======================================================================
    R.append("# Quotidien — analyse des exports du test utilisateur")
    R.append("")
    R.append(f"Rapport produit le {datetime.now().strftime('%d/%m/%Y à %H:%M')} par `analyse/analyser_export.py` à partir de "
             f"`{os.path.basename(chemin_participants)}` et `{os.path.basename(chemin_evenements)}`.")
    R.append("")
    R.append(f"**Règles de lecture.** Chaque pourcentage est écrit `k/n = p % [IC 95 % : a–b %]` (intervalle de confiance de Wilson). "
             f"Tout indicateur calculé sur moins de {SEUIL_N} personnes ou parties est étiqueté « non interprétable ». "
             "Les jours sont comptés en heure de Paris. Les comptes bruts sont fiables ; les pourcentages sont des ordres de grandeur ; "
             "la comparaison fine R / S ne l'est pas à ces effectifs (README, « Limites de l'expérimentation »).")
    R.append("")

    # ------------------------------------------------------------------ 1
    R.append("## 1. Qualité des données")
    R.append("")
    R.append(f"- Fichier participants : **{len(lignesP)} lignes**, {len(colsP)} colonnes. Fichier événements : **{len(lignesE)} lignes**, {len(colsE)} colonnes.")
    for nom, manque, surplus in (("participants", manqueP, surplusP), ("événements", manqueE, surplusE)):
        if manque:
            R.append(f"- ⚠ Colonnes attendues **absentes** du fichier {nom} : {', '.join('`' + c + '`' for c in manque)}. "
                     "Les indicateurs qui en dépendent sont signalés « non calculable » plus bas.")
        else:
            R.append(f"- Fichier {nom} : toutes les colonnes attendues sont présentes.")
        if surplus:
            R.append(f"- Colonnes non prévues dans le fichier {nom} (ignorées) : {', '.join('`' + c + '`' for c in surplus)}.")
    if dates:
        dts = [e["dt"] for e in tous_ev if e["dt"]]
        R.append(f"- Événements datés du **{min(dates).strftime('%d/%m/%Y')} au {max(dates).strftime('%d/%m/%Y')}** (heure de Paris)"
                 + (f" ; premier horodatage {min(dts).isoformat()}, dernier {max(dts).isoformat()}." if dts else "."))
    else:
        R.append("- ⚠ Aucun événement daté : ni `date_heure_utc` ni `jour_paris` exploitables. Les analyses par jour sont impossibles.")
    if debut and fin:
        R.append(f"- **Période analysée : J1 = {debut.strftime('%d/%m/%Y')} → J{nb_jours} = {fin.strftime('%d/%m/%Y')}** ({nb_jours} jours). "
                 f"Date de début {debut_source}. Fin : {fin_source}. "
                 "Si l'export a été fait en cours de journée, le dernier jour est incomplet : relancer avec `--fin` sur la veille.")
    R.append(f"- Événements **hors période** : {len(hors)} (avant J1 : {sum(1 for e in hors if e['jour'] < debut) if debut else 0} ; "
             f"après la fin : {sum(1 for e in hors if e['jour'] > fin) if fin else 0}). Événements sans date exploitable : {qual['sans_date']}. "
             "**Ils sont exclus de toutes les sections suivantes.**")
    if hors:
        qui = Counter(e["p"] for e in hors)
        R.append(f"  - Participants concernés : {', '.join(f'{p} ({n})' for p, n in qui.most_common(10))}{'…' if len(qui) > 10 else ''}.")
        if any(e["type"] == "visite" and e["jour"] < debut for e in hors):
            R.append("  - ⚠ Une visite antérieure à J1 fait classer par la base la première visite du test en « retour » (souvent « retour spontané ») "
                     "au lieu de « première visite » : pour ces participants, les retours de la section 4 sont surestimés d'une unité.")
    inconnus = Counter(e["type"] for e in EV if e["type"] not in TYPES_CONNUS)
    if "type" in aE:
        R.append("- Événements par type (dans la période) : " + (", ".join(f"{t or '(vide)'} {n}" for t, n in Counter(e["type"] for e in EV).most_common()) or "aucun") + ".")
        if inconnus:
            R.append(f"- ⚠ Types d'événements inconnus du script (ignorés) : {', '.join(f'{t or chr(40) + 'vide' + chr(41)} ({n})' for t, n in inconnus.items())}.")
    else:
        R.append("- ⚠ Colonne `type` absente : presque rien n'est calculable à partir des événements.")
    R.append("")
    R.append("**Participants par groupe et par type d'entrée** (personnel = lien personnel créé par l'administrateur, groupes R et S ; "
             "invité = arrivé par le lien d'invitation d'un joueur ; organique = arrivé sans lien).")
    R.append("")
    entree_de = lambda g: {"R": "personnel", "S": "personnel", "invite": "invité", "organique": "organique"}.get(g, "inconnu")
    R += tableau(["Groupe", "Type d'entrée", "Participants", "dont absents de l'export participants"],
                 [[lib_g(g), entree_de(g), len(membres(g)), sum(1 for p in membres(g) if not p["dans_export"])] for g in groupes]
                 + [["Total", "", len(P), len(hors_export)]])
    R.append("")
    res["participants"] = {g: len(membres(g)) for g in groupes}
    if hors_export:
        R.append(f"- ⚠ {len(hors_export)} identifiant(s) présents dans les événements mais absents de l'export participants "
                 f"(exports faits à des moments différents ?) : {', '.join(sorted(hors_export)[:10])}. Leur groupe est lu dans les événements.")
    if "entree" in aE or a_json:
        ent = Counter(e["entree"] or "(vide)" for e in EV if e["type"] == "visite")
        R.append("- Visites par type d'entrée (champ `entree` : `lien_personnel`, `rappel`, `invitation`, `sans_lien`, `defi`) : "
                 + (", ".join(f"{k} {v}" for k, v in ent.most_common()) or "aucune visite") + ".")
    # Orphelins
    a_visite = {p for p in P if de_type(p, "visite")}
    a_visite_tout = {e["p"] for e in tous_ev if e["type"] == "visite"}
    orphelins = sorted(p for p in P if p not in a_visite_tout)
    orph_org = [p for p in orphelins if P[p]["groupe"] == "organique"]
    orph_invite = [p for p in orphelins if P[p]["groupe"] == "invite"]
    R.append(f"- **Identifiants sans aucune visite** : {len(orphelins)} au total, dont {len(orph_org)} organique(s) "
             f"(orphelins créés par un rechargement de page : {', '.join(orph_org[:12]) or '–'}), {len(orph_invite)} invité(s), "
             f"et {len(orphelins) - len(orph_org) - len(orph_invite)} lien(s) personnel(s) R/S jamais ouvert(s) (ce ne sont pas des orphelins : "
             "ils restent au dénominateur de l'entonnoir).")
    res["orphelins"] = orph_org
    # Appareils
    if dispo("appareil"):
        app = defaultdict(set)
        for e in EV:
            if e["type"] == "visite" and e["appareil"]:
                app[e["p"]].add(e["appareil"])
        multi = sorted(p for p, s in app.items() if len(s) >= 2)
        R.append(f"- **Participants vus sur 2 appareils ou plus** : {len(multi)} ({', '.join(f'{p} : {len(app[p])}' for p in multi[:12]) or '–'}). "
                 "Lien transféré ou même personne sur deux appareils : impossible de trancher, à lire avec prudence.")
    elif "appareils_distincts" in aP:
        multi = sorted(p["id"] for p in P.values() if (nombre(p["csv"].get("appareils_distincts")) or 0) >= 2)
        R.append(f"- **Participants vus sur 2 appareils ou plus** (colonne `appareils_distincts` de l'export participants) : {len(multi)} ({', '.join(multi[:12]) or '–'}).")
    else:
        multi = []
        R.append("- " + absent("participants à 2 appareils ou plus", ["appareil", "donnees_json", "appareils_distincts"]))
    res["multi_appareils"] = multi
    nb_doublons = sum(doublons_fin.values())
    R.append(f"- **Doublons de `fin`** par (participant, grille) : {nb_doublons} événement(s) en trop sur {len(doublons_fin)} partie(s) "
             f"({', '.join(f'{p}/{g}' for (p, g) in list(doublons_fin)[:10]) or '–'}). Seule la première fin est comptée.")
    res["doublons_fin"] = nb_doublons
    # Événements antérieurs à l'envoi du lien
    if "lien_envoye_le" in aP:
        avant = Counter()
        for p in P.values():
            le = lire_date(p["csv"].get("lien_envoye_le", ""))
            if le:
                avant[p["id"]] = sum(1 for e in par_p.get(p["id"], []) if e["dt"] and e["dt"] < le)
        avant = +avant
        R.append(f"- Événements enregistrés **avant** que le lien soit marqué « envoyé » : {sum(avant.values())} "
                 f"({', '.join(f'{p} ({n})' for p, n in avant.most_common(8)) or '–'}). Possible essai de l'administrateur, ou lien envoyé avant le clic « Copier le lien ».")
    # Jour client différent du jour serveur
    if a_json:
        differe = 0
        for e in EV:
            tc = lire_date(str(e["d"].get("t_client", "")))
            if tc and e["dt"] and jour_paris(tc) and jour_paris(tc) != e["jour"]:
                differe += 1
        R.append(f"- Événements dont l'heure du téléphone (`t_client`) tombe un autre jour que l'heure du serveur : {differe} "
                 "(envoi différé après une coupure réseau, ou téléphone mal réglé). Le script utilise l'heure du serveur.")
    # Grille différente du calendrier
    if debut and ordre:
        ecarts = [e for e in EV if e["type"] == "debut" and e["grille"] and prevue(e["jour"]) and e["grille"] != prevue(e["jour"])]
        R.append(f"- Parties commencées sur une **autre grille que celle prévue ce jour-là** : {len(ecarts)} "
                 f"({', '.join(sorted({e['p'] + '/' + e['grille'] for e in ecarts})[:10]) or '–'}) : grille forcée, calendrier modifié ou date de début mal déduite.")
    # Cohérence entre les deux fichiers
    if "type" in aE and lignesP:
        tests = []
        if "visites" in aP:
            tests.append(("visites", lambda p, ev: sum(1 for e in ev if e["type"] == "visite")))
        if "a_commence" in aP:
            tests.append(("a_commence", lambda p, ev: 1 if any(e["type"] == "debut" for e in ev) else 0))
        tous_par_p = defaultdict(list)
        for e in tous_ev:
            tous_par_p[e["p"]].append(e)
        discord = defaultdict(list)
        for p in P.values():
            if not p["dans_export"]:
                continue
            for col, f in tests:
                v = nombre(p["csv"].get(col, ""))
                if v is not None and v != f(p, tous_par_p.get(p["id"], [])):
                    discord[col].append(p["id"])
        if tests:
            R.append("- Cohérence des deux fichiers (colonnes recalculées depuis les événements, hors période comprise) : "
                     + " ; ".join(f"`{c}` : {len(discord[c])} participant(s) en désaccord" + (f" ({', '.join(discord[c][:6])})" if discord[c] else "") for c, _ in tests)
                     + ". Un désaccord indique des exports faits à des moments différents ou un fichier modifié.")
        res["discordances"] = {c: list(discord[c]) for c, _ in tests}
    for a in avert:
        R.append(f"- ⚠ {a}")
    R.append("")

    # ------------------------------------------------------------------ 2
    R.append("## 2. Entonnoir (comptes bruts)")
    R.append("")
    R.append("Une personne compte une seule fois par ligne. « A ouvert » = au moins une visite (ce n'est pas une preuve d'intérêt) ; "
             "« a commencé » = au moins un mot sélectionné ; « a terminé » = 4 groupes trouvés ou 4 erreurs ; « a résolu » = 4 groupes trouvés. "
             "« Lien envoyé » ne concerne que les liens personnels (R et S).")
    R.append("")
    etapes = [("crees", "Participants dans les exports"), ("lien", "Lien envoyé"), ("ouvert", "A ouvert"),
              ("commence", "A commencé"), ("termine", "A terminé au moins une grille"), ("resolu", "A résolu au moins une grille")]
    a_lien = "lien_envoye_le" in aP
    a_type = "type" in aE
    terminants = {p for (p, g) in fins}
    resolveurs = {p for (p, g), e in fins.items() if e["gagne"]}
    commencants = {p for p in P if de_type(p, "debut")}
    ens = {"crees": set(P), "lien": {p["id"] for p in P.values() if p["csv"].get("lien_envoye_le")},
           "ouvert": a_visite, "commence": commencants, "termine": terminants, "resolu": resolveurs}
    ent = {}
    lignes_t = []
    for cle, lib in etapes:
        l = [lib]
        for g in groupes + ["*"]:
            ids = {p["id"] for p in membres(g)}
            if cle == "lien" and not a_lien:
                v = "n. c."
            elif cle == "lien" and g not in ("R", "S", "*"):
                v = "sans objet"
            elif cle not in ("crees", "lien") and not a_type:
                v = "n. c."
            elif cle == "resolu" and not dispo("gagne"):
                v = "n. c."
            else:
                v = len(ens[cle] & ids)
            ent.setdefault(g, {})[cle] = v
            l.append(v)
        lignes_t.append(l)
    R += tableau(["Étape"] + [lib_g(g) for g in groupes] + ["Total"], lignes_t)
    R.append("")
    res["entonnoir"] = ent
    if not a_lien:
        R.append(absent("« lien envoyé »", ["lien_envoye_le"]))
        R.append("")
    if a_type:
        perso = {p["id"] for p in P.values() if p["groupe"] in ("R", "S")}
        R.append("Passage d'une étape à la suivante, liens personnels uniquement (R + S réunis) :")
        R.append("")
        chaine = [("lien", "ouvert", "Ont ouvert, parmi les liens envoyés"), ("ouvert", "commence", "Ont commencé, parmi ceux qui ont ouvert"),
                  ("commence", "termine", "Ont terminé, parmi ceux qui ont commencé"), ("termine", "resolu", "Ont résolu, parmi ceux qui ont terminé")]
        for a, b, lib in chaine:
            if a == "lien" and not a_lien:
                continue
            base = ens[a] & perso
            R.append(f"- {lib} : {prop(len(base & ens[b]), len(base))}")
        sans_envoi = (ens["ouvert"] & perso) - ens["lien"] if a_lien else set()
        if sans_envoi:
            R.append(f"- ⚠ {len(sans_envoi)} participant(s) R/S ont ouvert sans que le lien soit marqué « envoyé » ({', '.join(sorted(sans_envoi)[:8])}) : "
                     "clic « Copier le lien » oublié.")
        R.append("")

    # ------------------------------------------------------------------ 3
    R.append("## 3. Participation par jour de test")
    R.append("")
    if not (a_type and jours):
        R.append(absent("participation par jour", ["type", "date_heure_utc / jour_paris"]))
    else:
        R.append("« A joué la grille du jour » = a sélectionné au moins un mot (événement `debut`) ce jour-là, heure de Paris"
                 + (", sur la grille prévue au calendrier." if ordre else " (grille prévue inconnue : toute grille compte)."))
        R.append("")
        lignes_t, part_jour = [], {}
        for i, j in enumerate(jours):
            gp = prevue(j)
            joueurs, autres = set(), set()
            for e in EV:
                if e["type"] == "debut" and e["jour"] == j:
                    (joueurs if (gp is None or e["grille"] == gp) else autres).add(e["p"])
            term = {p for p in joueurs if any((p, g) in fins for g in ([gp] if gp else {e["grille"] for e in de_type(p, "debut") if e["jour"] == j}))}
            reso = {p for p in term if any(fins[(p, g)]["gagne"] for g in ([gp] if gp else {e["grille"] for e in de_type(p, "debut") if e["jour"] == j}) if (p, g) in fins)}
            part_jour[i + 1] = {g: sum(1 for p in joueurs if P[p]["groupe"] == g) for g in groupes}
            part_jour[i + 1]["total"] = len(joueurs)
            lignes_t.append([f"J{i + 1}", j.strftime("%d/%m"), (f"{gp} ({niveau.get(gp, '?')})" if gp else "–")]
                            + [part_jour[i + 1][g] for g in groupes] + [len(joueurs), len(term), len(reso), len(autres)])
        R += tableau(["Jour", "Date", "Grille prévue (niveau)"] + [lib_g(g) for g in groupes]
                     + ["Total ayant joué", "dont ont terminé", "dont ont résolu", "Ont joué une autre grille"], lignes_t)
        res["participation"] = part_jour
        R.append("")
        R.append("Lecture : ce sont des comptes bruts. Tout le monde joue les grilles dans le même ordre : une baisse un jour donné "
                 "peut venir de la grille comme du rang du jour, on ne peut pas les séparer.")
    R.append("")

    # ------------------------------------------------------------------ 4
    R.append("## 4. Rétention")
    R.append("")
    if not (a_type and jours):
        R.append(absent("rétention", ["type", "date_heure_utc / jour_paris"]))
        R.append("")
    else:
        R.append("**Définitions.** « A joué un jour » = au moins un `debut` de grille du calendrier ce jour-là (heure de Paris ; "
                 "entraînement, Défi et mini-jeux ne comptent pas). **Jk** = a joué exactement k jours après son premier jour de jeu. "
                 f"Dénominateur de Jk = joueurs dont le jour « premier jour + k » tombe dans la période (jusqu'au {fin.strftime('%d/%m/%Y')}) : "
                 "les autres n'ont pas encore eu l'occasion de revenir et ne sont pas comptés comme des échecs.")
        R.append("")
        premier = {p: min(s) for p, s in jours_joues.items()}
        ret = {}
        cols_g = groupes + ["*"]
        lignes_t = []
        for k in RETENTION_K:
            l = [f"J{k}"]
            for g in cols_g:
                elig = [p["id"] for p in membres(g) if p["id"] in premier and premier[p["id"]] + timedelta(days=k) <= fin]
                ok = [p for p in elig if premier[p] + timedelta(days=k) in jours_joues[p]]
                ret.setdefault(g, {})[f"J{k}"] = (len(ok), len(elig))
                l.append(prop(len(ok), len(elig)))
            lignes_t.append(l)
        R += tableau(["Rétention"] + [lib_g(g) for g in groupes] + ["Total"], lignes_t)
        R.append("")
        res["retention"] = ret
        R.append("**A joué au moins k jours différents** (dénominateur : tous les participants du groupe présents dans les exports ; "
                 "un participant arrivé tard n'a pas pu cumuler autant de jours que les autres).")
        R.append("")
        lignes_t, cumul = [], {}
        for k in [k for k in PALIERS_JOURS if k <= max(nb_jours, 1)]:
            l = [f"≥ {k} jour{'s' if k > 1 else ''}"]
            for g in cols_g:
                n = len(membres(g))
                x = sum(1 for p in membres(g) if len(jours_joues.get(p["id"], ())) >= k)
                cumul.setdefault(g, {})[k] = (x, n)
                l.append(prop(x, n))
            lignes_t.append(l)
        R += tableau(["A joué"] + [lib_g(g) for g in groupes] + ["Total"], lignes_t)
        R.append("")
        res["jours_joues"] = cumul
        # Classes de visite
        R.append("**Retours spontanés et retours après rappel** (classement fait par la base, colonne `classe_visite`).")
        R.append("")
        if not dispo("classe"):
            R.append(absent("retours spontanés / après rappel", ["classe_visite", "donnees_json"]))
            R.append("")
        else:
            visites = [e for e in EV if e["type"] == "visite"]
            classes = CLASSES + sorted({e["classe"] for e in visites} - set(CLASSES))
            lignes_t = []
            for c in classes:
                l = [LIB_CLASSE.get(c, c)]
                for g in cols_g:
                    vs = [e for e in visites if e["classe"] == c and (g == "*" or P[e["p"]]["groupe"] == g)]
                    l.append(f"{len(vs)} visite(s), {len({e['p'] for e in vs})} pers.")
                if any(e["classe"] == c for e in visites) or c in CLASSES:
                    lignes_t.append(l)
            R += tableau(["Classe de visite"] + [lib_g(g) for g in groupes] + ["Total"], lignes_t)
            R.append("")
            R.append("Part des personnes revenues au moins une fois, parmi celles qui ont ouvert le jeu :")
            R.append("")
            retours = {}
            for c, lib in (("retour_spontane", "Revenu sans rappel (au moins 1 jour)"), ("retour_apres_rappel", "Revenu après un rappel"),
                           ("retour_rappel_probable", "Retour « rappel probable » (rappel envoyé, lien non cliqué)"), ("retour_defi", "Revenu par le lien de Défi d'un ami")):
                for g in [x for x in ("R", "S") if x in groupes]:
                    base = {p["id"] for p in membres(g)} & a_visite
                    x = {e["p"] for e in visites if e["classe"] == c} & base
                    retours.setdefault(g, {})[c] = (len(x), len(base))
                    R.append(f"- {lib}, groupe {g} : {prop(len(x), len(base))}")
            res["retours"] = retours
            R.append("")
            # J1 décomposé
            R.append("Parmi les joueurs revenus jouer à J1, classe de leur visite ce jour-là (comptes bruts ; priorité : après rappel, rappel probable, Défi, spontané) :")
            R.append("")
            prio = ["retour_apres_rappel", "retour_rappel_probable", "retour_defi", "retour_spontane"]
            lignes_t = []
            for g in cols_g:
                cpt = Counter()
                for p in membres(g):
                    pid = p["id"]
                    if pid in premier and premier[pid] + timedelta(days=1) in jours_joues[pid]:
                        cl = {e["classe"] for e in de_type(pid, "visite") if e["jour"] == premier[pid] + timedelta(days=1)}
                        cpt[next((c for c in prio if c in cl), "autre")] += 1
                lignes_t.append([lib_g(g) if g != "*" else "Total"] + [cpt[c] for c in prio] + [cpt["autre"]])
            R += tableau(["Groupe", "Après rappel", "Rappel probable", "Lien de Défi", "Spontané", "Sans visite classée ce jour-là"], lignes_t)
            R.append("")
            anomalies = {e["p"] for e in visites if e["classe"] in ("retour_apres_rappel", "retour_rappel_probable") and P[e["p"]]["groupe"] == "S"}
            if "rappels_envoyes" in aP:
                anomalies |= {p["id"] for p in membres("S") if (nombre(p["csv"].get("rappels_envoyes")) or 0) > 0}
                nR = len(membres("R"))
                rap = sum(1 for p in membres("R") if (nombre(p["csv"].get("rappels_envoyes")) or 0) > 0)
                R.append(f"- Membres du groupe R pour lesquels au moins un lien de rappel a été généré : **{rap}/{nR}** (colonne `rappels_envoyes`). "
                         "Le groupe R mesure donc « rappel possible sur demande », pas « rappel reçu » : seuls ceux qui ont demandé une autre grille sont relancés.")
            if anomalies:
                R.append(f"- ⚠ **Protocole** : {len(anomalies)} membre(s) du groupe S ont un rappel ou un retour lié à un rappel ({', '.join(sorted(anomalies))}). "
                         "Le groupe S ne devait recevoir aucun rappel : la comparaison R / S est contaminée.")
            res["anomalies_S"] = sorted(anomalies)
            R.append("- Les retours sont des **minimums** : une personne revenue depuis un autre navigateur sans son lien devient un nouvel « organique ». "
                     "Un retour « spontané » peut cacher une relance faite hors du tableau de bord (message d'un ami, groupe).")
            R.append("")

    # ------------------------------------------------------------------ 5
    R.append("## 5. Résultats par grille")
    R.append("")
    if not a_type or "grille" not in aE:
        R.append(absent("résultats par grille", ["type", "grille"]))
        R.append("")
    else:
        R.append("Réussite = parties résolues / parties terminées (première fin de chaque joueur). Erreurs moyennes sur les parties terminées (0 à 4). "
                 "Temps actif = `duree_s`, pauses exclues. Abandon = a commencé sans jamais terminer (une partie encore en cours le jour de l'export y est comptée).")
        R.append("")
        vues = [g for g in ordre if g in debuts or any(k[1] == g for k in fins)]
        vues += sorted({g for g in list(debuts) + [k[1] for k in fins] if g and g not in rang_grille})
        t1, t2, resg, signaux = [], [], {}, []
        for g in vues:
            F = [e for (p, gg), e in fins.items() if gg == g]
            gagnes = [e for e in F if e["gagne"]]
            com = debuts.get(g, set())
            aband = com - {e["p"] for e in F}
            ind = [e for e in EV if e["type"] == "indice" and e["grille"] == g]
            faux = Counter()
            faux_qui = defaultdict(set)
            for e in EV:
                if e["type"] == "essai" and e["grille"] == g and e["correct"] is False and isinstance(e["d"].get("mots"), list):
                    cle = ", ".join(sorted(str(m) for m in e["d"]["mots"]))
                    faux[cle] += 1
                    faux_qui[cle].add(e["p"])
            Q = {}
            for e in EV:
                if e["type"] == "questionnaire" and e["grille"] == g:
                    Q[e["p"]] = e["d"]
            QL = list(Q.values())
            dif = Counter(q.get("difficulte") for q in QL if q.get("difficulte"))
            jus = Counter(q.get("justesse") for q in QL if q.get("justesse"))
            taux = len(gagnes) / len(F) if F else None
            err = [e["erreurs"] for e in F if e["erreurs"] is not None]
            err_moy = statistics.mean(err) if err else None
            # --- lecture du calibrage : règles explicites
            niv = niveau.get(g, "?")
            lecture = []
            if len(F) < SEUIL_N:
                lecture.append(f"non interprétable (n = {len(F)} < {SEUIL_N})")
            elif not dispo("gagne"):
                lecture.append("non calculable (`gagne` absent)")
            else:
                trop_dur = sum(dif.values()) >= 5 and dif["trop_difficile"] * 2 >= sum(dif.values())
                trop_facile = sum(dif.values()) >= 5 and dif["trop_facile"] * 2 >= sum(dif.values())
                if niv == "facile" and (taux < CAL_FACILE_REUSSITE_MIN or (err_moy is not None and err_moy >= CAL_FACILE_ERREURS_MAX) or trop_dur):
                    lecture.append("plus dure que prévu")
                elif niv == "intermediaire" and (taux < CAL_INTER_REUSSITE_MIN or trop_dur):
                    lecture.append("plus dure que prévu")
                elif niv == "intermediaire" and ((taux >= CAL_INTER_REUSSITE_MAX and (err_moy or 0) < 0.5) or trop_facile):
                    lecture.append("plus facile que prévu")
                elif niv == "difficile" and ((taux >= CAL_DIFFICILE_REUSSITE_MAX and (err_moy or 0) < 1) or trop_facile):
                    lecture.append("plus facile que prévu")
                elif niv in ("facile", "intermediaire", "difficile"):
                    lecture.append("conforme au niveau prévu (ordre de grandeur)")
                else:
                    lecture.append("niveau prévu inconnu")
            if jus["plusieurs_injustes"] >= CAL_INJUSTE_MIN and jus["plusieurs_injustes"] >= CAL_INJUSTE_PART * sum(jus.values()):
                lecture.append(f"associations à relire ({jus['plusieurs_injustes']} « plusieurs injustes »)")
            if lecture and ("plus " in lecture[0] or len(lecture) > 1):
                signaux.append(f"{g} (prévue {niv}) : {' ; '.join(lecture)}")
            top = faux.most_common(1)
            t1.append([g, niv, len(com), len(F), len(aband),
                       prop(len(gagnes), len(F)) if dispo("gagne") else "n. c.",
                       stat_num(err, "moyenne") if dispo("erreurs") else "n. c.",
                       stat_num([e["duree_s"] for e in gagnes], "mediane", " s") if dispo("duree_s", "gagne") else "n. c.",
                       stat_num([e["duree_s"] for e in F], "mediane", " s") if dispo("duree_s") else "n. c.",
                       f"{len({e['p'] for e in ind})} joueur(s), {len(ind)} indice(s)"])
            t2.append([g, niv,
                       (f"{top[0][0]} — {top[0][1]} fois, {len(faux_qui[top[0][0]])} joueur(s)" if top else ("aucun" if a_json else "n. c.")),
                       (f"{len(QL)} rép. : trop facile {dif['trop_facile']}, bien dosée {dif['bien_dosee']}, trop difficile {dif['trop_difficile']}" if a_json else "n. c."),
                       (f"toutes {jus['toutes']}, la plupart {jus['la_plupart']}, plusieurs injustes {jus['plusieurs_injustes']}" if a_json else "n. c."),
                       " ; ".join(lecture)])
            resg[g] = {"commence": len(com), "termine": len(F), "resolu": len(gagnes), "abandons": len(aband),
                       "erreurs_moy": err_moy, "indices": len(ind), "top_faux": top[0] if top else None,
                       "questionnaires": len(QL), "difficulte": dict(dif), "justesse": dict(jus), "lecture": lecture}
        res["grilles"] = resg
        if not vues:
            R.append("Aucune partie commencée dans la période.")
        else:
            R += tableau(["Grille", "Niveau prévu", "Ont commencé", "Ont terminé", "Abandons", "Réussite", "Erreurs moyennes",
                          "Temps actif médian (résolues)", "Temps actif médian (terminées)", "Indices"], t1)
            R.append("")
            R += tableau(["Grille", "Niveau prévu", "Essai faux le plus fréquent", "Difficulté ressentie (questionnaire)",
                          "Associations justes ? (questionnaire)", "Lecture du calibrage"], t2)
            R.append("")
            if not a_json:
                R.append(absent("essais faux, questionnaire", ["donnees_json"]))
                R.append("")
            R.append(f"**Règles de lecture du calibrage** (indicatives, appliquées seulement à partir de {SEUIL_N} parties terminées) : "
                     f"grille prévue *facile* signalée « plus dure que prévu » si réussite < {pc(CAL_FACILE_REUSSITE_MIN)}, ou erreurs moyennes ≥ {fr(CAL_FACILE_ERREURS_MAX)}, "
                     "ou au moins la moitié de « trop difficile » (5 réponses minimum) ; "
                     f"*intermédiaire* : « plus dure » si réussite < {pc(CAL_INTER_REUSSITE_MIN)}, « plus facile » si réussite ≥ {pc(CAL_INTER_REUSSITE_MAX)} avec moins de 0,5 erreur ; "
                     f"*difficile* : « plus facile que prévu » si réussite ≥ {pc(CAL_DIFFICILE_REUSSITE_MAX)} avec moins d'1 erreur en moyenne ; "
                     f"« associations à relire » dès {CAL_INJUSTE_MIN} personnes « plusieurs injustes » représentant au moins {pc(CAL_INJUSTE_PART)} des réponses.")
            R.append("")
            R.append("Grilles à regarder en priorité : " + ("; ".join(signaux) if signaux else "aucune ne ressort avec ces règles et ces effectifs") + ".")
            R.append("")
            if a_json:
                genes = [(e["grille"], str(e["d"].get("gene")).strip()) for e in EV if e["type"] == "questionnaire" and str(e["d"].get("gene") or "").strip()]
                if genes:
                    R.append(f"**Ce qui a gêné (réponses libres, {len(genes)})** — à lire une par une, c'est la matière la plus fiable de ce test :")
                    R.append("")
                    for g, t in genes:
                        R.append(f"- {g} : « {cellule(t)} »")
                    R.append("")
        res["signaux_grilles"] = signaux

    # ------------------------------------------------------------------ 6
    R.append("## 6. Mini-jeux et entraînement")
    R.append("")
    if not (a_type and a_json):
        R.append(absent("mini-jeux et entraînement (le mode et l'action sont dans le JSON)", ["type", "donnees_json"]))
        R.append("")
    else:
        modes = [("Entraînement", lambda e: e["type"] == "entrainement", True),
                 ("Défi express", lambda e: e["type"] == "defi", False),
                 ("Mot intrus", lambda e: e["type"] == "minijeu" and e["d"].get("jeu") == "intrus", True),
                 ("Expression mystère", lambda e: e["type"] == "minijeu" and e["d"].get("jeu") == "expression", True)]
        lignes_t, resm = [], {}
        for lib, f, a_debut in modes:
            ev = [e for e in EV if f(e)]
            act = lambda a: [e for e in ev if e["d"].get("action") == a]
            joueurs = {e["p"] for e in ev if e["d"].get("action") in ("debut", "fin")}
            resm[lib] = {"ouvert": len({e["p"] for e in act("ouverture")}), "joueurs": len(joueurs),
                         "commencees": len(act("debut")) if a_debut else None, "terminees": len(act("fin"))}
            lignes_t.append([lib, resm[lib]["ouvert"], len(joueurs),
                             sum(1 for p in joueurs if P[p]["groupe"] == "R"), sum(1 for p in joueurs if P[p]["groupe"] == "S"),
                             len(act("debut")) if a_debut else "non tracé", len(act("fin"))])
        R += tableau(["Mode", "Ont ouvert", "Ont joué (≥ 1 partie commencée ou terminée)", "dont R", "dont S", "Parties commencées", "Parties terminées"], lignes_t)
        res["modes"] = resm
        R.append("")
        defi_fin = [e for e in EV if e["type"] == "defi" and e["d"].get("action") == "fin"]
        R.append(f"- Défi express : {sum(1 for e in defi_fin if e['d'].get('groupe'))} partie(s) terminée(s) en groupe sur {len(defi_fin)} ; "
                 f"{sum(1 for e in EV if e['type'] == 'defi' and e['d'].get('action') in ('groupe_cree', 'salon_cree'))} groupe(s) créé(s). "
                 "Le début d'une partie de Défi n'est pas tracé (seulement l'ouverture et la fin). Les amis non participants n'apparaissent nulle part.")
        R.append(f"- Entraînement : {sum(1 for e in EV if e['type'] == 'entrainement' and e['d'].get('action') == 'fin' and e['d'].get('gagne'))} exercice(s) réussi(s), "
                 f"{sum(1 for e in EV if e['type'] == 'entrainement' and e['d'].get('action') == 'passe')} passé(s).")
        R.append("")
        R.append("**Mini-jeu le jour J et retour à J+1 (comptes bruts, aucun pourcentage).** Unité : un « participant-jour », "
                 "c'est-à-dire un participant un jour où il a eu au moins un événement, quand le lendemain est dans la période. "
                 "« A joué un mini-jeu » = entraînement, Mot intrus ou Expression mystère commencé ou terminé, ou Défi terminé, ce jour-là. "
                 "« Revenu à J+1 » = au moins un événement le lendemain.")
        R.append("")
        actif, mini = defaultdict(set), defaultdict(set)
        for e in EV:
            actif[e["p"]].add(e["jour"])
            a = e["d"].get("action")
            if (e["type"] in ("entrainement", "minijeu") and a in ("debut", "fin")) or (e["type"] == "defi" and a == "fin"):
                mini[e["p"]].add(e["jour"])
        croise, pers = Counter(), defaultdict(set)
        for p, js in actif.items():
            for j in js:
                if j + timedelta(days=1) <= fin:
                    cle = (j in mini[p], (j + timedelta(days=1)) in js)
                    croise[cle] += 1
                    pers[cle].add(p)
        R += tableau(["Le jour J", "Revenu à J+1", "Pas revenu à J+1", "Participants distincts concernés"],
                     [["A joué un mini-jeu", croise[(True, True)], croise[(True, False)], len(pers[(True, True)] | pers[(True, False)])],
                      ["N'a pas joué de mini-jeu", croise[(False, True)], croise[(False, False)], len(pers[(False, True)] | pers[(False, False)])]])
        res["minijeu_retour"] = {"mini_revenu": croise[(True, True)], "mini_pas": croise[(True, False)],
                                 "sans_revenu": croise[(False, True)], "sans_pas": croise[(False, False)]}
        R.append("")
        R.append("Lecture : ce tableau ne prouve aucun effet. Les joueurs les plus motivés jouent à la fois aux mini-jeux et reviennent le lendemain ; "
                 "un même participant compte plusieurs fois (une fois par jour actif).")
        R.append("")

    # ------------------------------------------------------------------ 7
    R.append("## 7. Partage")
    R.append("")
    if not a_type:
        R.append(absent("partage", ["type"]))
    else:
        part = [e for e in EV if e["type"] == "partage"]
        if a_json:
            rates = [e for e in part if e["d"].get("methode") in ("annule", "echec")]
            ok = [e for e in part if e["d"].get("methode") not in ("annule", "echec")]
            R.append(f"- **Clics « Inviter »** (partage natif ou copie du message, hors annulations et échecs, même règle que le tableau de bord) : "
                     f"**{len(ok)} clic(s) par {len({e['p'] for e in ok})} personne(s)** ; méthodes : "
                     + (", ".join(f"{k} {v}" for k, v in Counter(e['d'].get('methode') or '(vide)' for e in ok).most_common()) or "–")
                     + f". Annulés ou en échec : {len(rates)}.")
        else:
            ok = part
            R.append(f"- Clics « Inviter » : {len(part)} événement(s) `partage` par {len({e['p'] for e in part})} personne(s). "
                     "`donnees_json` absent : impossible d'écarter les partages annulés ou en échec.")
        cliqueurs = {e["p"] for e in ok}
        base = a_visite & {p["id"] for p in P.values() if p["groupe"] in ("R", "S")}
        R.append(f"- Part des participants R + S ayant ouvert le jeu qui ont cliqué « Inviter » : {prop(len(cliqueurs & base), len(base))}")
        invites = [p for p in P.values() if p["groupe"] == "invite" or p["invite_par"]]
        inv_joue = [p for p in invites if p["id"] in commencants]
        parrains = Counter(p["invite_par"] for p in inv_joue if p["invite_par"])
        R.append(f"- **Invités arrivés par un lien d'invitation : {len(invites)} ; invités effectifs (ont commencé une partie) : {len(inv_joue)}**"
                 + (f", amenés par {len(parrains)} participant(s) ({', '.join(f'{p} : {n}' for p, n in parrains.most_common(8))})." if "invite_par" in aP else ". Colonne `invite_par` absente : on ne sait pas qui les a invités."))
        if "clics_inviter" in aP and "invites_ayant_joue" in aP:
            R.append(f"- Contrôle avec l'export participants : somme de `clics_inviter` = {sum(nombre(p['csv'].get('clics_inviter')) or 0 for p in P.values())}, "
                     f"participants avec `invites_ayant_joue` ≥ 1 = {sum(1 for p in P.values() if (nombre(p['csv'].get('invites_ayant_joue')) or 0) >= 1)}.")
        if a_json:
            autres = Counter((e["type"] if e["type"] == "defi" else e["d"].get("jeu")) for e in EV
                             if e["type"] in ("defi", "minijeu") and e["d"].get("action") == "partage")
            R.append(f"- Partages de score sans lien d'invitation (hors mesure) : Défi {autres['defi']}, Mot intrus {autres['intrus']}.")
        R.append("- Un clic « Inviter » est une intention : on ne sait pas si le message est parti. Seul l'invité qui commence une partie prouve un partage. "
                 "Un lien personnel transféré à la place du lien d'invitation n'est pas compté ici (voir « 2 appareils ou plus »).")
        res["partage"] = {"clics": len(ok), "cliqueurs": len(cliqueurs), "invites": len(invites), "invites_effectifs": len(inv_joue)}
    R.append("")

    # ------------------------------------------------------------------ 8
    R.append("## 8. Ce que ces données permettent de conclure / ne permettent pas de conclure")
    R.append("")
    oui, non = [], []
    nR, nS = len(membres("R")), len(membres("S"))
    jR = sum(1 for p in membres("R") if p["id"] in commencants)
    jS = sum(1 for p in membres("S") if p["id"] in commencants)
    n_term, n_res = len(fins), sum(1 for e in fins.values() if e["gagne"])

    def juger(lib, k, n):
        """Règle : n < 10 -> pas de conclusion ; IC plus large que 30 points -> ordre de grandeur ; sinon estimation."""
        if n < SEUIL_N:
            non.append(f"{lib} : {prop(k, n)}. Moins de {SEUIL_N} cas : aucun pourcentage à retenir, seulement le compte brut ({k} sur {n}).")
            return
        lo, hi = wilson(k, n)
        if hi - lo > SEUIL_IC_LARGE:
            oui.append(f"{lib} : {prop(k, n)}. Intervalle large ({round(100 * (hi - lo))} points) : à lire comme « entre {round(100 * lo)} % et {round(100 * hi)} % », pas comme un chiffre précis.")
        else:
            oui.append(f"{lib} : {prop(k, n)}. Intervalle de {round(100 * (hi - lo))} points : estimation utilisable, sans lire les unités.")

    if a_type:
        oui.append(f"Comptes bruts (fiables) : {len(a_visite)} personne(s) ont ouvert, {len(commencants)} ont commencé, {len(terminants)} ont terminé au moins une grille, "
                   f"{len(resolveurs)} en ont résolu au moins une ; {n_term} partie(s) terminée(s) dont {n_res} résolue(s), sur {nb_jours} jour(s) observé(s).")
        base = a_visite & {p["id"] for p in P.values() if p["groupe"] in ("R", "S")}
        juger("Part des testeurs R + S qui commencent une partie après avoir ouvert le lien", len(base & commencants), len(base))
        juger("Part des testeurs R + S qui terminent, parmi ceux qui commencent", len(commencants & terminants & {p["id"] for p in P.values() if p["groupe"] in ("R", "S")}),
              len(commencants & {p["id"] for p in P.values() if p["groupe"] in ("R", "S")}))
        if dispo("gagne"):
            juger("Taux de réussite toutes grilles confondues (parties terminées)", n_res, n_term)
    if "retention" in res:
        for k in RETENTION_K:
            x, n = res["retention"]["*"][f"J{k}"]
            if n == 0:
                non.append(f"Rétention J{k} : aucun joueur n'a encore atteint son jour « premier jour + {k} » dans la période ({nb_jours} jour(s) observé(s)). Non calculable.")
            else:
                juger(f"Rétention J{k}, tous groupes confondus", x, n)
        # R contre S
        if "R" in groupes and "S" in groupes:
            (kr, nr), (ks, ns) = res["retention"]["R"]["J1"], res["retention"]["S"]["J1"]
            if nr < SEUIL_N or ns < SEUIL_N:
                non.append(f"Comparer R et S sur le retour à J1 : R {prop(kr, nr)} ; S {prop(ks, ns)}. Au moins un groupe a moins de {SEUIL_N} joueurs éligibles : aucune comparaison possible.")
            else:
                (lr, hr), (ls, hs) = wilson(kr, nr), wilson(ks, ns)
                if lr <= hs and ls <= hr:
                    non.append(f"Dire que le rappel change le retour à J1 : R {prop(kr, nr)} ; S {prop(ks, ns)}. Les deux intervalles se chevauchent : "
                               "aucune différence démontrée, ni dans un sens ni dans l'autre. « Pas de différence visible » ne veut pas dire « pas d'effet ».")
                else:
                    oui.append(f"Écart net entre R et S sur le retour à J1 : R {prop(kr, nr)} ; S {prop(ks, ns)}. Les intervalles ne se chevauchent pas : "
                               "c'est compatible avec un effet du rappel, à confirmer par un second test (un seul test, groupes d'environ 15, rappels envoyés seulement à ceux qui les demandent).")
        non.append(f"Comparer finement R et S : {nR} participant(s) en R ({jR} ont joué) et {nS} en S ({jS} ont joué). À ces effectifs, un écart de 3 ou 4 personnes entre les groupes "
                   "peut venir du hasard de la répartition. Seul un écart massif (par exemple 0 contre 8) mérite d'être retenu.")
    if res.get("anomalies_S"):
        non.append(f"Utiliser le groupe S comme groupe « sans rappel » sans réserve : {len(res['anomalies_S'])} membre(s) de S ont un rappel enregistré.")
    if "grilles" in res:
        g_ok = [g for g, x in res["grilles"].items() if x["termine"] >= SEUIL_N]
        g_ko = [g for g, x in res["grilles"].items() if x["termine"] < SEUIL_N]
        if g_ok:
            oui.append(f"Repérer une grille nettement ratée ou nettement trop facile parmi les {len(g_ok)} grille(s) ayant au moins {SEUIL_N} parties terminées ({', '.join(g_ok[:12])}{'…' if len(g_ok) > 12 else ''}), "
                       "en ordre de grandeur. Les essais faux les plus fréquents et les réponses libres sont exploitables tels quels pour corriger une grille.")
        if g_ko:
            non.append(f"Juger la difficulté de {len(g_ko)} grille(s) jouée(s) par moins de {SEUIL_N} personnes jusqu'au bout ({', '.join(g_ko[:12])}{'…' if len(g_ko) > 12 else ''}).")
        if res["grilles"]:
            non.append("Classer deux grilles entre elles, ou séparer « cette grille plaît moins » de « ce jour-là on revient moins » : tout le monde joue les grilles dans le même ordre, "
                       "et les joueurs encore présents au jour 10 ne sont plus les mêmes qu'au jour 1 (les plus motivés restent).")
            nq = sum(x["questionnaires"] for x in res["grilles"].values())
            non.append(f"Généraliser le questionnaire : {nq} réponse(s) pour {n_term} partie(s) terminée(s). Seuls ceux qui ont voulu répondre l'ont fait ; "
                       "les réponses décrivent ces personnes, pas l'ensemble des joueurs.")
    if "minijeu_retour" in res:
        m = res["minijeu_retour"]
        non.append(f"Dire que les mini-jeux font revenir : {m['mini_revenu'] + m['mini_pas']} participant-jour(s) avec mini-jeu contre {m['sans_revenu'] + m['sans_pas']} sans. "
                   "C'est une simple coïncidence observée (les plus motivés font les deux), sans groupe de comparaison.")
    if "partage" in res:
        s = res["partage"]
        (oui if s["invites_effectifs"] else non).append(
            f"Partage : {s['clics']} clic(s) « Inviter » par {s['cliqueurs']} personne(s), {s['invites_effectifs']} invité(s) ayant réellement joué. "
            + ("Le partage effectif existe, en compte brut ; rien ne permet d'en tirer un taux de viralité." if s["invites_effectifs"]
               else "Aucun partage effectif observé : on ne peut pas conclure que les joueurs partageront, seulement que certains ont cliqué."))
    if res.get("multi_appareils"):
        non.append(f"Garantir « un identifiant = une personne » : {len(res['multi_appareils'])} lien(s) ouvert(s) sur 2 appareils ou plus.")
    non.append("Mesurer les retours réels : les chiffres de retour sont des minimums (changement de navigateur sans lien personnel = nouveau participant), "
               "et les relances faites hors du tableau de bord sont invisibles.")
    non.append("Extrapoler à de vrais utilisateurs : les testeurs ont été recrutés par l'auteur du test, savent qu'ils participent à un test, "
               f"et le produit a été observé {nb_jours} jour(s) seulement.")
    R.append("**Ce que ces données permettent de conclure**")
    R.append("")
    R += [f"- {x}" for x in oui] or ["- Rien de chiffré : les colonnes nécessaires manquent ou les effectifs sont tous inférieurs à 10."]
    R.append("")
    R.append("**Ce qu'elles ne permettent pas de conclure**")
    R.append("")
    R += [f"- {x}" for x in non]
    R.append("")
    R.append(f"*Règles appliquées : moins de {SEUIL_N} cas = aucun pourcentage retenu ; intervalle de confiance plus large que {round(100 * SEUIL_IC_LARGE)} points = ordre de grandeur seulement ; "
             "R contre S = conclusion seulement si les deux intervalles à 95 % ne se chevauchent pas.*")
    R.append("")
    res["conclusions"] = {"oui": oui, "non": non}
    res["periode"] = (debut, fin)
    res["hors_periode"] = len(hors)
    res["colonnes_absentes"] = {"participants": manqueP, "evenements": manqueE}
    return "\n".join(R), res


def main(argv=None):
    ici = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description="Analyse les deux exports CSV de admin.html et produit un rapport Markdown.")
    ap.add_argument("participants", help="export « Participants (CSV) »")
    ap.add_argument("evenements", help="export « Tous les événements (CSV) »")
    ap.add_argument("--sortie", help="fichier Markdown à écrire (sinon le rapport s'affiche à l'écran)")
    ap.add_argument("--debut", help="premier jour du test, AAAA-MM-JJ (sinon déduit des grilles jouées)")
    ap.add_argument("--fin", help="dernier jour à analyser, AAAA-MM-JJ (sinon dernier événement)")
    ap.add_argument("--grilles", default=os.path.join(ici, "..", "grilles.json"), help="chemin de grilles.json")
    a = ap.parse_args(argv)
    for f in (a.participants, a.evenements):
        if not os.path.isfile(f):
            print(f"Fichier introuvable : {f}", file=sys.stderr)
            return 2
    bornes = []
    for nom, v in (("--debut", a.debut), ("--fin", a.fin)):
        j = lire_jour(v) if v else None
        if v and not j:
            print(f"{nom} : date illisible « {v} » (format attendu : AAAA-MM-JJ)", file=sys.stderr)
            return 2
        bornes.append(j)
    rapport, _ = analyser(a.participants, a.evenements, a.grilles, bornes[0], bornes[1])
    if a.sortie:
        with open(a.sortie, "w", encoding="utf-8") as f:
            f.write(rapport + "\n")
        print(f"Rapport écrit dans {a.sortie}")
    else:
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
        print(rapport)
    return 0


if __name__ == "__main__":
    sys.exit(main())
