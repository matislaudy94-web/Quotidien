"""Vérifie les versions de rechange des grilles de démo (variantes.json).

Format : { "g3": [grille_version_2, grille_version_3], ... } pour chaque grille du calendrier.
Une version de rechange sert quand le joueur rate une grille en démo : il réessaie avec d'autres mots,
d'autres groupes, au même niveau de difficulté.

Contrôles (bloquants) :
- structure et UNE seule solution (mêmes règles que verifier_grilles.py, leurres compris) ;
- même niveau que la grille d'origine ;
- aucun mot commun avec la grille d'origine ni avec l'autre version du même niveau ;
- aucune catégorie identique à celles de la grille d'origine ou de l'autre version ;
- aucun mot du calendrier (grilles.json) ni de l'entraînement (entrainement.json) : rien ne doit aider
  à résoudre une grille du test ;
- identifiants « g3b », « g3c ».
Signalé sans bloquer : un mot réutilisé dans les versions de deux niveaux différents.

Usage : python3 verifier_variantes.py [fichier]   (par défaut variantes.json)"""
import json, sys, os
from collections import defaultdict
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from verifier_grilles import verifier_grille, charger

def main():
    chemin = sys.argv[1] if len(sys.argv) > 1 else "variantes.json"
    racine = os.path.dirname(os.path.abspath(__file__))
    cal = {g["id"]: g for g in charger(os.path.join(racine, "grilles.json"))}
    mots_cal = {w for g in cal.values() for x in g["groupes"] for w in x["mots"]}
    ent = os.path.join(racine, "entrainement.json")
    mots_ent = {w for g in charger(ent) for x in g["groupes"] for w in x["mots"]} if os.path.exists(ent) else set()
    var = json.load(open(chemin))
    ok = True
    usage = defaultdict(set)
    for gid, versions in var.items():
        if gid not in cal: print(f"{gid}: niveau inconnu"); ok = False; continue
        orig = cal[gid]
        mots_orig = {w for x in orig["groupes"] for w in x["mots"]}
        cats_vues = {x["categorie"].lower() for x in orig["groupes"]}
        mots_vus = set(mots_orig)
        if len(versions) != 2: print(f"{gid}: il faut exactement 2 versions de rechange ({len(versions)})"); ok = False
        for k, v in enumerate(versions):
            attendu = gid + "bc"[k] if k < 2 else "?"
            errs, n, leurres, mots = verifier_grille(v)
            if v.get("id") != attendu: errs.append(f"identifiant attendu {attendu}")
            if v.get("niveau") != orig["niveau"]: errs.append(f"niveau {v.get('niveau')} ≠ {orig['niveau']}")
            communs = sorted(set(mots) & mots_vus)
            if communs: errs.append(f"mots déjà vus dans ce niveau : {communs}")
            cats = {x["categorie"].lower() for x in v["groupes"]}
            if cats & cats_vues: errs.append(f"catégories déjà vues dans ce niveau : {sorted(cats & cats_vues)}")
            c_cal = sorted(set(mots) & mots_cal)
            if c_cal: errs.append(f"mots du calendrier : {c_cal}")
            c_ent = sorted(set(mots) & mots_ent)
            if c_ent: errs.append(f"mots de l'entraînement : {c_ent}")
            for w in mots: usage[w].add(gid)
            mots_vus |= set(mots); cats_vues |= cats
            print(f"{v.get('id')}: {'OK' if not errs else errs} | solutions = {n} | leurres = {leurres or 'aucun'}")
            ok &= (not errs and n == 1)
    manquants = [g for g in cal if g not in var]
    if manquants: print("Niveaux sans versions de rechange :", ", ".join(manquants))
    rep = {w: sorted(s) for w, s in usage.items() if len(s) > 1}
    print(f"Mots réutilisés entre niveaux (non bloquant) : {len(rep)}" + (f" → {dict(list(rep.items())[:15])}" if rep else ""))
    print(f"{sum(len(v) for v in var.values())} versions de rechange pour {len(var)} niveaux")
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
