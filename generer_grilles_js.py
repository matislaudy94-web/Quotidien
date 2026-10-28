"""Régénère grilles.js (calendrier) et entrainement.js (mode entraînement) à partir des fichiers JSON.
À lancer après toute modification de grilles.json ou entrainement.json (après verifier_grilles.py)."""
import json, os
g = json.load(open("grilles.json"))
open("grilles.js", "w").write(
    "// Fichier généré depuis grilles.json par : python3 generer_grilles_js.py\n"
    "// Ne pas modifier à la main : modifier grilles.json, puis relancer le script.\n"
    "window.QUOTIDIEN_GRILLES = " + json.dumps(g, ensure_ascii=False, indent=1) + ";\n")
print("grilles.js régénéré :", len(g), "grilles")
if os.path.exists("entrainement.json"):
    e = json.load(open("entrainement.json"))
    open("entrainement.js", "w").write(
        "// Fichier généré depuis entrainement.json par : python3 generer_grilles_js.py\n"
        "// Banque d'entraînement, DISTINCTE du calendrier : aucun mot en commun (vérifié par verifier_grilles.py).\n"
        "window.QUOTIDIEN_ENTRAINEMENT = " + json.dumps(e, ensure_ascii=False, indent=1) + ";\n")
    print("entrainement.js régénéré :", len(e["grilles"]), "exercices,", len(e["chapitres"]), "chapitres")
if os.path.exists("defi.json"):
    d = json.load(open("defi.json"))
    open("defi_banque.js", "w").write(
        "// Fichier généré depuis defi.json par : python3 generer_grilles_js.py\n"
        "// Banque du Défi express : catégories, familles et incompatibilités (vérifiées par verifier_defi.py).\n"
        "window.QUOTIDIEN_DEFI = " + json.dumps(d, ensure_ascii=False, indent=1) + ";\n")
    print("defi_banque.js régénéré :", len(d["categories"]), "catégories,", sum(len(c["mots"]) for c in d["categories"]), "mots")
