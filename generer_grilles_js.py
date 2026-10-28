"""Régénère grilles.js à partir de grilles.json (à lancer après toute modification des grilles)."""
import json
g = json.load(open("grilles.json"))
open("grilles.js", "w").write(
    "// Fichier généré depuis grilles.json par : python3 generer_grilles_js.py\n"
    "// Ne pas modifier à la main : modifier grilles.json, puis relancer le script.\n"
    "window.QUOTIDIEN_GRILLES = " + json.dumps(g, ensure_ascii=False, indent=1) + ";\n")
print("grilles.js régénéré :", ", ".join(x["id"] for x in g))
