"""Vérifie la banque du mini-jeu « Expression mystère » (expressions.json).

Contrôles bloquants :
- version entière ; identifiants uniques « xNNN » ; difficulté facile / intermediaire / difficile ;
- « texte » contient exactement un trou « ___ » ; « complete » = texte avec le mot à la place du trou ;
- mot et 3 leurres en MAJUSCULES, tous distincts ; l'indice ne contient ni le mot ni un leurre ;
- sens (60 à 200 caractères), exemple (qui contient l'expression complète), catégorie présents ;
- aucune expression en double ; de quoi composer une partie (2 faciles, 3 intermédiaires ou difficiles) ;
- PROTECTION DU TEST : aucune expression ne doit aider à résoudre une grille du calendrier (grilles.json).
  Pour chaque groupe du calendrier de type « Prendre la ___ », on refuse une expression qui contient à la fois
  le cadre (« prendre la ») et un mot du groupe (MOUCHE, PORTE…), et un mot à trouver qui appartient à un groupe
  d'expressions du calendrier.
Le contrôle automatique ne remplace pas la relecture humaine (expression réelle, sens exact, leurres inacceptables).

Usage : python3 verifier_expressions.py [fichier]   (par défaut expressions.json)"""
import json, sys, os, re, unicodedata
from collections import Counter

def norm(t):
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", " ", t.replace("œ", "oe")).strip()

def mots(t):
    return set(norm(t).split())

def cadres_du_calendrier(racine):
    cal = json.load(open(os.path.join(racine, "grilles.json")))
    cadres = []
    for g in cal:
        for x in g["groupes"]:
            c = x["categorie"]
            if "___" not in c:
                continue
            fixe = re.sub(r"\(.*?\)", "", c).replace("___", " ")
            cadres.append((g["id"], c, norm(fixe), {norm(w) for w in x["mots"]}))
    return cadres

def main():
    chemin = sys.argv[1] if len(sys.argv) > 1 else "expressions.json"
    racine = os.path.dirname(os.path.abspath(__file__))
    cadres = cadres_du_calendrier(racine)
    membres_expr = set().union(*[m for _, _, _, m in cadres])
    d = json.load(open(chemin))
    err = []
    if not isinstance(d.get("version"), int): err.append("version manquante")
    xs = d.get("expressions", [])
    for k, n in Counter(x.get("id") for x in xs).items():
        if n > 1: err.append(f"identifiant en double : {k}")
    for k, n in Counter(norm(x.get("complete", "")) for x in xs).items():
        if n > 1: err.append(f"expression en double : {k}")
    for x in xs:
        i = x.get("id", "?")
        if not re.fullmatch(r"x\d{3}", str(i)): err.append(f"{i} : identifiant invalide")
        if x.get("difficulte") not in ("facile", "intermediaire", "difficile"): err.append(f"{i} : difficulté invalide")
        for champ in ("texte", "mot", "complete", "indice", "sens", "exemple", "categorie"):
            if not str(x.get(champ, "")).strip(): err.append(f"{i} : champ « {champ} » vide")
        t, m = x.get("texte", ""), x.get("mot", "")
        if t.count("___") != 1: err.append(f"{i} : le texte doit contenir exactement un « ___ »")
        elif norm(t.replace("___", m)) != norm(x.get("complete", "")): err.append(f"{i} : « complete » ne correspond pas au texte avec {m}")
        leurres = x.get("leurres", [])
        tous = [m] + leurres
        if len(leurres) != 3 or len(set(tous)) != 4: err.append(f"{i} : il faut 3 leurres distincts du mot")
        if any(w != w.upper() or not w.strip() for w in tous): err.append(f"{i} : mot et leurres en MAJUSCULES attendus")
        ind = mots(x.get("indice", ""))
        for w in tous:
            if mots(w) and mots(w) <= ind: err.append(f"{i} : l'indice contient « {w} »")
        s = x.get("sens", "")
        if not (60 <= len(s) <= 200): err.append(f"{i} : sens de {len(s)} caractères (60 à 200)")
        if norm(x.get("complete", "")) and norm(x.get("complete", "")).split()[-1] not in norm(x.get("exemple", "")):
            err.append(f"{i} : l'exemple ne semble pas employer l'expression")
        # Protection du test
        if norm(m) in membres_expr: err.append(f"{i} : {m} est un mot d'un groupe d'expressions du calendrier")
        txt = " " + norm(x.get("complete", "")) + " "
        for gid, cat, fixe, membres in cadres:
            if fixe and (" " + fixe + " ") in txt and any((" " + w + " ") in txt for w in membres):
                err.append(f"{i} : reprend le groupe « {cat} » de la grille {gid}")
    nb = Counter(x.get("difficulte") for x in xs)
    if nb["facile"] < 2 or nb["intermediaire"] + nb["difficile"] < 3: err.append(f"pas de quoi composer une partie : {dict(nb)}")
    print(f"{len(xs)} expressions (version {d.get('version')}) : {dict(nb)} ; catégories : {dict(Counter(x.get('categorie') for x in xs))}")
    for e in err: print("ERREUR", e)
    print("OK" if not err else f"{len(err)} erreur(s)")
    sys.exit(0 if not err else 1)

if __name__ == "__main__":
    main()
