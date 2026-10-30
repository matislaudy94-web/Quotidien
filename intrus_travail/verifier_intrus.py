"""Contrôle de /home/claude/quotidien/intrus.json selon CONSIGNES.md."""
import json, re, sys, unicodedata
from collections import Counter

BASE = "/home/claude/quotidien/"
data = json.load(open(BASE + "intrus.json", encoding="utf-8"))
grilles = json.load(open(BASE + "grilles.json", encoding="utf-8"))

def sans_accents(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

# Mots du calendrier : mots des groupes + mots en majuscules cités ailleurs dans le fichier
calendrier = {m for g in grilles for gr in g["groupes"] for m in gr["mots"]}
texte = open(BASE + "grilles.json", encoding="utf-8").read()
majuscules = set(re.findall(r"\b[A-ZÀ-ÖØ-ÞŒ][A-ZÀ-ÖØ-ÞŒ\-]+\b", texte))
interdits = calendrier | {m.strip("-") for m in majuscules if len(m.strip("-")) > 1}
interdits_norm = {sans_accents(m) for m in interdits}

def variantes(m):
    n = sans_accents(m)
    v = {n, n + "S", n + "X", n + "E", n + "ES"}
    for suf in ("S", "X", "E", "ES"):
        if n.endswith(suf):
            v.add(n[: -len(suf)])
    return v

erreurs, avertissements = [], []
qs = data["questions"]
if data.get("version") != 1:
    erreurs.append("version != 1")
if len(qs) != 60:
    erreurs.append(f"{len(qs)} questions au lieu de 60")
ids = [q["id"] for q in qs]
if ids != [f"i{i:03d}" for i in range(1, 61)]:
    erreurs.append("ids non conformes (i001..i060)")
if len(set(ids)) != len(ids):
    erreurs.append("ids en double")
rep = Counter(q["difficulte"] for q in qs)
if rep != Counter({"facile": 25, "moyen": 23, "difficile": 12}):
    erreurs.append(f"répartition : {dict(rep)}")
themes = Counter(q["theme"] for q in qs)
for t, n in themes.items():
    if n > 5:
        erreurs.append(f"thème {t} : {n} questions")
champs = {"id", "difficulte", "theme", "consigne", "mots", "intrus", "critere", "explication"}
vus = {}
positions = Counter()
for q in qs:
    i = q["id"]
    if set(q) != champs:
        erreurs.append(f"{i} champs {set(q) ^ champs}")
    m = q["mots"]
    if len(m) != 4 or len(set(m)) != 4:
        erreurs.append(f"{i} : il faut 4 mots distincts")
    if q["intrus"] not in m:
        erreurs.append(f"{i} : intrus absent des mots")
    else:
        positions[m.index(q["intrus"])] += 1
    for w in m:
        if w != w.upper() or not re.fullmatch(r"[A-ZÀ-ÖØ-ÞŒ\-]+", w):
            erreurs.append(f"{i} : mot mal formé {w}")
        if w in vus:
            erreurs.append(f"{i} : {w} déjà utilisé dans {vus[w]}")
        vus[w] = i
        if w in interdits or sans_accents(w) in interdits_norm:
            erreurs.append(f"{i} : {w} est un mot du calendrier")
        else:
            proches = variantes(w) & interdits_norm
            if proches:
                avertissements.append(f"{i} : {w} proche de {proches}")
    L = len(q["explication"])
    if not 70 <= L <= 190:
        erreurs.append(f"{i} : explication {L} caractères")
    if not q["consigne"].startswith("Trouve l'intrus"):
        erreurs.append(f"{i} : consigne")
    if q["difficulte"] == "difficile" and q["consigne"] == "Trouve l'intrus.":
        avertissements.append(f"{i} : question difficile sans consigne précise")
    if q["intrus"] in q["critere"].split():
        erreurs.append(f"{i} : le critère cite l'intrus")
    # mots du calendrier écrits en majuscules dans le critère ou l'explication
    for tok in re.findall(r"[A-ZÀ-ÖØ-ÞŒ][A-ZÀ-ÖØ-ÞŒ\-]+", q["critere"] + " " + q["explication"]):
        if tok in interdits:
            erreurs.append(f"{i} : texte cite en majuscules le mot du calendrier {tok}")
    # mots du calendrier en minuscules dans le texte (signalé, non bloquant)
    for tok in re.findall(r"[a-zà-öø-ÿœ]+", (q["critere"] + " " + q["explication"]).lower()):
        if tok.upper() in calendrier:
            avertissements.append(f"{i} : texte contient « {tok} » (mot du calendrier)")

print("Questions :", len(qs), "| répartition :", dict(rep))
print("Thèmes :", dict(themes))
print("Positions de l'intrus :", dict(sorted(positions.items())))
print("Mots du calendrier contrôlés :", len(interdits))
for a in avertissements:
    print("AVERTISSEMENT", a)
for e in erreurs:
    print("ERREUR", e)
print("OK" if not erreurs else f"{len(erreurs)} erreur(s)")
sys.exit(1 if erreurs else 0)
