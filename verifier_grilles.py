"""Vérifie la structure des grilles et compte les solutions possibles,
en tenant compte des rattachements plausibles déclarés (leurres)."""
import json, itertools, sys
grids = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "grilles.json"))
ok = True
allwords = {}
for g in grids:
    cats = [x["categorie"] for x in g["groupes"]]
    words = [w for x in g["groupes"] for w in x["mots"]]
    errs = []
    if len(g["groupes"]) != 4: errs.append("pas 4 groupes")
    if any(len(x["mots"]) != 4 for x in g["groupes"]): errs.append("un groupe n'a pas 4 mots")
    if len(set(words)) != 16: errs.append("mots non distincts")
    if any(x["difficulte"] not in ("facile", "intermediaire", "difficile") for x in g["groupes"]): errs.append("difficulté invalide")
    if any(not x["explication"].strip() for x in g["groupes"]): errs.append("explication vide")
    for w in words: allwords.setdefault(w, []).append(g["id"])
    # candidats : catégorie officielle + rattachements plausibles qui sont des catégories de la grille
    cand = {}
    for x in g["groupes"]:
        for w in x["mots"]:
            cand[w] = {x["categorie"]}
    for w, extra in g.get("rattachements_plausibles", {}).items():
        cand[w] |= {c for c in extra if c in cats}
    # compter les partitions : chaque mot dans une catégorie candidate, chaque catégorie exactement 4 mots
    n = [0]
    def rec(i, counts):
        if i == 16:
            n[0] += all(c == 4 for c in counts.values()); return
        w = words[i]
        for c in cand[w]:
            if counts[c] < 4:
                counts[c] += 1; rec(i + 1, counts); counts[c] -= 1
    rec(0, {c: 0 for c in cats})
    n = n[0]
    decoys = {w: sorted(c - {next(x['categorie'] for x in g['groupes'] if w in x['mots'])}) for w, c in cand.items() if len(c) > 1}
    print(f"{g['id']}: structure {'OK' if not errs else errs} | solutions compatibles = {n} | leurres = {decoys or 'aucun'}")
    ok &= (not errs and n == 1)
dup = {w: ids for w, ids in allwords.items() if len(ids) > 1}
print("Mots répétés entre grilles :", dup or "aucun")
sys.exit(0 if ok else 1)
