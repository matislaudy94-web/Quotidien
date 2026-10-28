"""Vérifie la structure des grilles et compte les solutions possibles,
en tenant compte des rattachements plausibles déclarés (leurres).

Usage :
  python3 verifier_grilles.py                      -> banque du calendrier (grilles.json)
  python3 verifier_grilles.py entrainement.json    -> banque d'entraînement
Dans tous les cas, on vérifie aussi qu'aucun mot n'est partagé entre les deux banques
(un mot vu en entraînement ne doit pas aider à résoudre une grille du calendrier)."""
import json, sys, os
from collections import Counter

def charger(chemin):
    d = json.load(open(chemin))
    return d["grilles"] if isinstance(d, dict) else d

def verifier_grille(g):
    cats = [x["categorie"] for x in g["groupes"]]
    words = [w for x in g["groupes"] for w in x["mots"]]
    errs = []
    if len(g["groupes"]) != 4: errs.append("pas 4 groupes")
    if any(len(x["mots"]) != 4 for x in g["groupes"]): errs.append("un groupe n'a pas 4 mots")
    if len(set(words)) != 16: errs.append("mots non distincts")
    if len(set(cats)) != 4: errs.append("catégories non distinctes")
    if any(x["difficulte"] not in ("facile", "intermediaire", "difficile") for x in g["groupes"]): errs.append("difficulté invalide")
    if any(not x["explication"].strip() for x in g["groupes"]): errs.append("explication vide")
    if g.get("niveau") not in ("facile", "intermediaire", "difficile"): errs.append("niveau de grille manquant ou invalide")
    for w, extra in g.get("rattachements_plausibles", {}).items():
        if w not in words: errs.append(f"leurre déclaré pour un mot absent : {w}")
        for c in extra:
            if c not in cats: errs.append(f"leurre {w} -> catégorie inconnue : {c}")
    cand = {}
    for x in g["groupes"]:
        for w in x["mots"]:
            cand[w] = {x["categorie"]}
    for w, extra in g.get("rattachements_plausibles", {}).items():
        if w in cand: cand[w] |= {c for c in extra if c in cats}
    n = [0]
    def rec(i, counts):
        if i == 16:
            n[0] += all(c == 4 for c in counts.values()); return
        for c in cand[words[i]]:
            if counts[c] < 4:
                counts[c] += 1; rec(i + 1, counts); counts[c] -= 1
    if len(words) == 16: rec(0, {c: 0 for c in cats})
    decoys = {w: sorted(c - {next(x['categorie'] for x in g['groupes'] if w in x['mots'])}) for w, c in cand.items() if len(c) > 1}
    return errs, n[0], decoys, words

def main():
    cible = sys.argv[1] if len(sys.argv) > 1 else "grilles.json"
    grids = charger(cible)
    ok = True
    allwords = {}
    ids = Counter(g["id"] for g in grids)
    if any(v > 1 for v in ids.values()): print("Identifiants en double :", [k for k, v in ids.items() if v > 1]); ok = False
    for g in grids:
        errs, n, decoys, words = verifier_grille(g)
        for w in words: allwords.setdefault(w, []).append(g["id"])
        print(f"{g['id']}: structure {'OK' if not errs else errs} | solutions compatibles = {n} | leurres = {decoys or 'aucun'}")
        ok &= (not errs and n == 1)
    dup = {w: ids for w, ids in allwords.items() if len(ids) > 1}
    print("Mots répétés entre grilles :", dup or "aucun")
    ok &= not dup
    # Croisement des deux banques
    autres = [f for f in ("grilles.json", "entrainement.json") if os.path.exists(f) and os.path.abspath(f) != os.path.abspath(cible)]
    for f in autres:
        mots_autre = {w for g in charger(f) for x in g["groupes"] for w in x["mots"]}
        commun = sorted(set(allwords) & mots_autre)
        print(f"Mots partagés avec {f} :", commun or "aucun")
        ok &= not commun
    print("Niveaux :", dict(Counter(g.get("niveau") for g in grids)))
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
