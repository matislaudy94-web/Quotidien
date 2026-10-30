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
# Versions de rechange des grilles de démo (variantes.json) : vide si le fichier n'existe pas encore.
v = json.load(open("variantes.json")) if os.path.exists("variantes.json") else {}
open("variantes.js", "w").write(
    "// Fichier généré depuis variantes.json par : python3 generer_grilles_js.py\n"
    "// Versions de rechange des grilles de démo (2 par grille), vérifiées par verifier_variantes.py.\n"
    "window.QUOTIDIEN_VARIANTES = " + json.dumps(v, ensure_ascii=False, indent=1) + ";\n")
print("variantes.js régénéré :", sum(len(x) for x in v.values()), "versions de rechange")
# Mini-jeu « Le mot intrus » (intrus.json) : banque éditoriale vérifiée par verifier_intrus.py.
it = json.load(open("intrus.json")) if os.path.exists("intrus.json") else {"version": 0, "questions": []}
open("intrus_banque.js", "w").write(
    "// Fichier généré depuis intrus.json par : python3 generer_grilles_js.py\n"
    "// Banque du mini-jeu « Le mot intrus » (vérifiée par verifier_intrus.py, relue avant publication).\n"
    "window.QUOTIDIEN_INTRUS = " + json.dumps(it, ensure_ascii=False, indent=1) + ";\n")
print("intrus_banque.js régénéré :", len(it["questions"]), "questions (version", str(it.get("version")) + ")")
# Mini-jeu « Expression mystère » (expressions.json) : banque éditoriale vérifiée par verifier_expressions.py.
ex = json.load(open("expressions.json")) if os.path.exists("expressions.json") else {"version": 0, "expressions": []}
open("expressions_banque.js", "w").write(
    "// Fichier généré depuis expressions.json par : python3 generer_grilles_js.py\n"
    "// Banque du mini-jeu « Expression mystère » (vérifiée par verifier_expressions.py, relue avant publication).\n"
    "window.QUOTIDIEN_EXPRESSIONS = " + json.dumps(ex, ensure_ascii=False, indent=1) + ";\n")
print("expressions_banque.js régénéré :", len(ex["expressions"]), "expressions (version", str(ex.get("version")) + ")")
