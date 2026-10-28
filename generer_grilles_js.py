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
