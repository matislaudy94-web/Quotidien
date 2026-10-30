"""Contrôle complémentaire (plus strict que verifier_expressions.py) :
- cadre + mot d'un groupe du calendrier dans N'IMPORTE QUEL champ texte (indice, sens, exemple, complete) ;
- mot à trouver proche d'un mot d'un groupe (singulier/pluriel) ;
- mots des groupes d'expressions qui apparaissent ailleurs (avertissement) ;
- doublons de mots à trouver."""
import json, re, sys, unicodedata
from collections import Counter

def norm(t):
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", " ", t.replace("œ", "oe")).strip()

def racine(w):
    w = norm(w)
    return re.sub(r"(s|x)$", "", w)

cal = json.load(open("/home/claude/quotidien/grilles.json"))
cadres = []
for g in cal:
    for gr in g["groupes"]:
        c = gr["categorie"]
        if "___" in c:
            fixe = norm(re.sub(r"\(.*?\)", "", c).replace("___", " "))
            cadres.append((g["id"], c, fixe, [norm(w) for w in gr["mots"]]))
membres = {w for *_, m in cadres for w in m}
racines = {racine(w) for w in membres}

d = json.load(open("/home/claude/quotidien/expressions.json"))
err, avert = [], []
for x in d["expressions"]:
    i = x["id"]
    if racine(x["mot"]) in racines:
        err.append(f"{i} : {x['mot']} proche d'un mot du calendrier")
    for champ in ("complete", "indice", "sens", "exemple"):
        t = " " + norm(x[champ]) + " "
        for gid, cat, fixe, mb in cadres:
            if (" " + fixe + " ") in t and any(" " + w + " " in t for w in mb):
                err.append(f"{i} : champ {champ} reprend « {cat} » ({gid})")
        for w in membres:
            if " " + w + " " in t:
                avert.append(f"{i} : {champ} contient « {w} »")
    for l in x["leurres"]:
        if norm(l) in membres:
            avert.append(f"{i} : leurre {l} est un mot du calendrier")
for m, n in Counter(x["mot"] for x in d["expressions"]).items():
    if n > 1: err.append(f"mot en double : {m}")
for e in err: print("ERREUR", e)
for a in avert: print("avert.", a)
print("OK strict" if not err else f"{len(err)} erreur(s)")
