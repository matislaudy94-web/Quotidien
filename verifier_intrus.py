"""Vérifie la banque du mini-jeu « Le mot intrus » (intrus.json).

Contrôles bloquants :
- version entière ; identifiants uniques « iNNN » ;
- 4 mots distincts en MAJUSCULES, l'intrus parmi eux ; difficulté facile / moyen / difficile ;
- consigne, critère et explication présents (explication de 60 à 200 caractères) ;
- aucun mot réutilisé d'une question à l'autre ;
- aucun mot du calendrier du test (grilles.json) : le mini-jeu ne doit pas aider à résoudre une grille future ;
- mots cachés : chaque « X cache Y » annoncé est vérifié lettre par lettre (accents ignorés) ;
- de quoi composer une série (2 faciles, 2 moyennes, 1 difficile) ; au moins 10 questions par difficulté conseillées.
Le contrôle automatique ne remplace pas la relecture humaine : une seule réponse doit être raisonnablement défendable.

Usage : python3 verifier_intrus.py [fichier]   (par défaut intrus.json)"""
import json, sys, os, re, unicodedata
from collections import Counter

def sans_accents(t):
    return "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn").upper()

def main():
    chemin = sys.argv[1] if len(sys.argv) > 1 else "intrus.json"
    racine = os.path.dirname(os.path.abspath(__file__))
    cal = json.load(open(os.path.join(racine, "grilles.json")))
    mots_cal = {w for g in cal for x in g["groupes"] for w in x["mots"]}
    d = json.load(open(chemin))
    err = []
    if not isinstance(d.get("version"), int): err.append("version manquante")
    qs = d.get("questions", [])
    ids = [q.get("id") for q in qs]
    for k, n in Counter(ids).items():
        if n > 1: err.append(f"identifiant en double : {k}")
    vus = {}
    for q in qs:
        i = q.get("id", "?")
        if not re.fullmatch(r"i\d{3}", str(i)): err.append(f"{i} : identifiant invalide")
        m = q.get("mots", [])
        if len(m) != 4 or len(set(m)) != 4: err.append(f"{i} : il faut 4 mots distincts")
        if any(w != w.upper() or not w.strip() for w in m): err.append(f"{i} : mots en MAJUSCULES attendus")
        if q.get("intrus") not in m: err.append(f"{i} : l'intrus n'est pas parmi les mots")
        if q.get("difficulte") not in ("facile", "moyen", "difficile"): err.append(f"{i} : difficulté invalide")
        for champ in ("consigne", "critere", "explication", "theme"):
            if not str(q.get(champ, "")).strip(): err.append(f"{i} : champ « {champ} » vide")
        e = q.get("explication", "")
        if not (60 <= len(e) <= 200): err.append(f"{i} : explication de {len(e)} caractères (60 à 200)")
        # Mots cachés : chaque « X cache Y » du critère ou de l'explication est vérifié lettre par lettre (accents ignorés).
        for a, b in re.findall(r"([A-ZÀ-ÖØ-Þ]{3,}) cache (?:l'|le |la |les |un |une )?([A-ZÀ-ÖØ-Þ]{2,})", q.get("critere", "") + " " + e):
            if sans_accents(b) not in sans_accents(a): err.append(f"{i} : {a} ne contient pas {b}")
        for b, a in re.findall(r"on trouve (?:l'|le |la |les )?([A-ZÀ-ÖØ-Þ]{2,}) dans ([A-ZÀ-ÖØ-Þ]{3,})", e):
            if sans_accents(b) not in sans_accents(a): err.append(f"{i} : {a} ne contient pas {b}")
        for w in m:
            if w in vus: err.append(f"{i} : {w} déjà utilisé dans {vus[w]}")
            vus.setdefault(w, i)
            if w in mots_cal: err.append(f"{i} : {w} est un mot du calendrier du test")
    nb = Counter(q.get("difficulte") for q in qs)
    if nb["facile"] < 2 or nb["moyen"] < 2 or nb["difficile"] < 1: err.append(f"pas de quoi composer une série : {dict(nb)}")
    themes = Counter(q.get("theme") for q in qs)
    print(f"{len(qs)} questions (version {d.get('version')}) : {dict(nb)} ; thèmes : {dict(themes)}")
    pos = Counter(q["mots"].index(q["intrus"]) for q in qs if q.get("intrus") in q.get("mots", []))
    print(f"Position de l'intrus dans le fichier (mélangée en jeu) : {dict(sorted(pos.items()))}")
    for x in err: print("ERREUR", x)
    print("OK" if not err else f"{len(err)} erreur(s)")
    sys.exit(0 if not err else 1)

if __name__ == "__main__":
    main()
