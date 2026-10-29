"""Fusionne les nouvelles explications (expl/*.json) dans les banques, en ne touchant QUE le champ « explication ».

Usage : python3 expl/fusionner.py [--ecrire]
Sans --ecrire : contrôle seulement (toutes les grilles couvertes, 4 explications, 60 à 200 caractères)."""
import json, sys, os, glob
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
nouv = {}
for f in sorted(glob.glob(os.path.join(R, "expl", "*.json"))):
    for k, v in json.load(open(f)).items():
        assert k not in nouv, f"{k} en double ({f})"
        nouv[k] = v

def appliquer(grilles, etiquette):
    err = []
    for g in grilles:
        e = nouv.get(g["id"])
        if e is None: err.append(f"{g['id']} : pas de nouvelle explication"); continue
        if len(e) != 4: err.append(f"{g['id']} : {len(e)} explications"); continue
        for x, t in zip(g["groupes"], e):
            t = t.strip()
            if not (60 <= len(t) <= 200): err.append(f"{g['id']} : longueur {len(t)} « {t} »")
            x["explication"] = t
    print(f"{etiquette} : {len(grilles)} grilles, {'OK' if not err else str(len(err)) + ' problème(s)'}")
    for x in err: print("   ", x)
    return not err

cal = json.load(open(os.path.join(R, "grilles.json")))
var = json.load(open(os.path.join(R, "variantes.json")))
ent = json.load(open(os.path.join(R, "entrainement.json")))
ok = appliquer(cal, "calendrier") & appliquer([v for vs in var.values() for v in vs], "versions de rechange") & appliquer(ent["grilles"], "entraînement")
if "--ecrire" in sys.argv:
    if not ok: sys.exit("Rien écrit : corriger d'abord.")
    json.dump(cal, open(os.path.join(R, "grilles.json"), "w"), ensure_ascii=False, indent=2); open(os.path.join(R, "grilles.json"), "a").write("\n")
    json.dump(var, open(os.path.join(R, "variantes.json"), "w"), ensure_ascii=False, indent=1); open(os.path.join(R, "variantes.json"), "a").write("\n")
    json.dump(ent, open(os.path.join(R, "entrainement.json"), "w"), ensure_ascii=False, indent=1); open(os.path.join(R, "entrainement.json"), "a").write("\n")
    print("Écrit.")
sys.exit(0 if ok else 1)
