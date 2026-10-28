"""Vérifie la banque du Défi express (defi.json).
- chaque mot n'apparaît qu'une fois dans toute la banque (sinon deux groupes pourraient le revendiquer) ;
- chaque catégorie a au moins 4 mots et une famille connue ;
- les incompatibilités désignent des catégories existantes ;
- signale (sans bloquer) les mots aussi présents dans le calendrier ou l'entraînement.
Le contrôle des tirages eux-mêmes (familles distinctes, incompatibilités) est fait par tests/test_defi.js."""
import json, sys
from collections import Counter
d = json.load(open("defi.json"))
ok = True
fam = set(d["familles"])
ids = Counter(c["id"] for c in d["categories"])
if any(v > 1 for v in ids.values()): print("Identifiants en double :", [k for k, v in ids.items() if v > 1]); ok = False
mots = {}
for c in d["categories"]:
    if c["famille"] not in fam: print("Famille inconnue :", c["id"], c["famille"]); ok = False
    if len(c["mots"]) < 4: print("Moins de 4 mots :", c["id"]); ok = False
    if len(set(c["mots"])) != len(c["mots"]): print("Mot répété dans", c["id"]); ok = False
    for m in c["mots"]:
        if m != m.upper(): print("Mot pas en majuscules :", m); ok = False
        mots.setdefault(m, []).append(c["id"])
dup = {m: v for m, v in mots.items() if len(v) > 1}
print("Mots présents dans deux catégories :", dup or "aucun"); ok &= not dup
for a, b in d["incompatibles"]:
    if a not in ids or b not in ids: print("Incompatibilité inconnue :", a, b); ok = False
par_fam = Counter(c["famille"] for c in d["categories"])
print(f"{len(d['categories'])} catégories, {len(mots)} mots, {len(fam)} familles :", dict(par_fam))
for f in ("grilles.json", "entrainement.json"):
    try:
        g = json.load(open(f)); g = g["grilles"] if isinstance(g, dict) else g
        communs = sorted(set(mots) & {w for x in g for grp in x["groupes"] for w in grp["mots"]})
        print(f"Mots aussi présents dans {f} (autorisé, catégories simples) : {len(communs)}")
    except FileNotFoundError: pass
sys.exit(0 if ok else 1)
