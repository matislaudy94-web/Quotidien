#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test de analyse/analyser_export.py sur des DONNÉES FICTIVES.

Les deux CSV sont fabriqués ici, dans un dossier temporaire supprimé à la fin : rien n'est écrit dans le dépôt.
Tous les identifiants commencent par « FIC » (fictif). Aucun chiffre de ce fichier n'est un résultat du test réel.

    python3 tests/test_analyse.py
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import date

RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SCRIPT = os.path.join(RACINE, "analyse", "analyser_export.py")
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.join(RACINE, "analyse"))
import analyser_export as A  # noqa: E402

echecs = 0


def ok(condition, libelle, detail=""):
    global echecs
    if condition:
        print("  OK   " + libelle)
    else:
        echecs += 1
        print("  ÉCHEC " + libelle + (" → " + str(detail) if detail else ""))


# ---------------------------------------------------------------------------
# Même écriture CSV que admin.html (fonction csv) : BOM, « ; », guillemets doublés, fins de ligne \r\n,
# apostrophe devant un texte qui commence par = + - @ (protection contre les formules de tableur)
# ---------------------------------------------------------------------------
def csv_admin(lignes):
    def cell(v):
        s = "" if v is None else json.dumps(v, ensure_ascii=False, separators=(",", ":")) if isinstance(v, (dict, list)) else str(v)
        if isinstance(v, str) and re.match(r"[=+\-@\t\r]", s):
            s = "'" + s
        return '"' + s.replace('"', '""') + '"' if re.search(r'[;"\n\r]', s) else s
    return "﻿" + "\r\n".join(";".join(cell(c) for c in l) for l in lignes)


def jour_paris(iso):
    return A.jour_paris(A.lire_date(iso)).isoformat()


class Base:
    """Petite base fictive : mêmes champs que tests/serveur_test.js (participants, evenements)."""

    def __init__(self):
        self.participants, self.evenements = [], []

    def participant(self, pid, groupe, invite_par="", lien="2026-10-31T18:00:00+00:00", rappels=0):
        self.participants.append({"id": pid, "groupe": groupe, "invite_par": invite_par,
                                  "lien_envoye_le": lien if groupe in ("R", "S") else "", "rappels": rappels})

    def ev(self, quand, pid, typ, grille="", **donnees):
        self.evenements.append({"id": len(self.evenements) + 1, "created_at": quand, "participant_id": pid,
                                "visite_id": "v" + pid + quand[8:10], "grille": grille, "type": typ, "donnees": donnees})

    def visite(self, quand, pid, classe, entree="lien_personnel", grille="", appareil=None):
        self.ev(quand, pid, "visite", grille, entree=entree, classe=classe, token=entree == "rappel", appareil=appareil or "app-" + pid)

    def partie(self, jour, heure, pid, grille, gagne=None, erreurs=0, duree=120):
        self.ev(f"{jour}T{heure}:00+00:00", pid, "debut", grille, t_client=f"{jour}T{heure}:00.000Z")
        if gagne is not None:
            self.ev(f"{jour}T{heure}:30.123456+00:00", pid, "fin", grille, gagne=gagne, erreurs=erreurs, groupes_trouves=[],
                    nb_groupes_trouves=4 if gagne else 1, duree_s=duree, duree_brute_s=duree + 5, nb_essais=4 + erreurs, indices=0)

    def fichiers(self, dossier, sans_p=(), sans_e=()):
        """Écrit les deux exports avec les colonnes et les calculs de admin.html (section « Export CSV »)."""
        gr = {p["id"]: p["groupe"] for p in self.participants}
        tp = [list(A.COLS_PARTICIPANTS)]
        for p in self.participants:
            ev = [e for e in self.evenements if e["participant_id"] == p["id"]]
            vis = [e for e in ev if e["type"] == "visite"]
            cls = lambda c: [v for v in vis if v["donnees"]["classe"] == c]
            uniq = lambda l: " ".join(dict.fromkeys(l))
            actifs = sum(1 for x in self.participants if x["invite_par"] == p["id"]
                         and any(e["type"] == "debut" and e["participant_id"] == x["id"] for e in self.evenements))
            tp.append([p["id"], p["groupe"], p["invite_par"], p["lien_envoye_le"], len(vis),
                       1 if any(e["type"] == "debut" for e in ev) else 0,
                       uniq(e["grille"] for e in ev if e["type"] == "debut"), uniq(e["grille"] for e in ev if e["type"] == "fin"),
                       uniq(e["grille"] for e in ev if e["type"] == "fin" and e["donnees"].get("gagne")),
                       1 if any(e["type"] == "demande_suivante" for e in ev) else 0,
                       len({jour_paris(v["created_at"]) for v in cls("retour_spontane")}), len(cls("retour_apres_rappel")),
                       len(cls("retour_rappel_probable")),
                       sum(1 for e in ev if e["type"] == "partage" and e["donnees"].get("methode") not in ("annule", "echec")),
                       actifs, len({v["donnees"]["appareil"] for v in vis if v["donnees"].get("appareil")}), p["rappels"],
                       vis[-1]["created_at"] if vis else ""])
        te = [list(A.COLS_EVENEMENTS)]
        b = lambda v: "" if v is None else (1 if v else 0)
        for e in self.evenements:
            d = e["donnees"]
            te.append([e["id"], e["created_at"], jour_paris(e["created_at"]), e["participant_id"], gr[e["participant_id"]], e["visite_id"],
                       e["grille"], e["type"], d.get("classe", ""), d.get("entree", ""), d.get("appareil", ""), b(d.get("correct")),
                       "" if d.get("erreurs") is None else d["erreurs"], b(d.get("gagne")), "" if d.get("duree_s") is None else d["duree_s"], d])

        def retirer(t, sans):
            garde = [i for i, c in enumerate(t[0]) if c not in sans]
            return [[l[i] for i in garde] for l in t]
        fp, fe = os.path.join(dossier, "participants_FICTIFS.csv"), os.path.join(dossier, "evenements_FICTIFS.csv")
        for chemin, t in ((fp, retirer(tp, sans_p)), (fe, retirer(te, sans_e))):
            with open(chemin, "w", encoding="utf-8", newline="") as f:
                f.write(csv_admin(t))
        return fp, fe


def scenario():
    """Test fictif de 3 jours (1er au 3 novembre 2026, heure de Paris) : 6 R, 6 S, 1 invité, 1 organique, 1 orphelin."""
    B = Base()
    Rs, Ss = [f"FICR0{i}" for i in range(1, 7)], [f"FICS0{i}" for i in range(1, 7)]
    for i, p in enumerate(Rs):
        B.participant(p, "R", rappels=1 if i < 2 else 0)
    for p in Ss:
        B.participant(p, "S")
    B.participant("FICINV", "invite", invite_par="FICR01")
    B.participant("FICORG", "organique")
    B.participant("FICORP", "organique")  # orphelin : aucune visite
    # Hors période : visite la veille du J1 (essai de l'administrateur)
    B.visite("2026-10-31T10:00:00+00:00", "FICR04", "premiere_visite")
    # ---- J1 = 1er novembre : les 12 testeurs jouent g1
    for i, p in enumerate(Rs + Ss):
        B.visite(f"2026-11-01T09:{10 + i}:00+00:00", p, "premiere_visite" if p != "FICR04" else "retour_spontane", grille="g1")
        perdu = p in ("FICS05", "FICS06")
        B.partie("2026-11-01", f"10:{10 + i}", p, "g1", gagne=not perdu, erreurs=4 if perdu else (1 if p in Rs else 0), duree=100 + 10 * i)
    B.ev("2026-11-01T10:10:45+00:00", "FICR01", "fin", "g1", gagne=True, erreurs=1, duree_s=100)  # doublon (rechargement)
    for p in ("FICR01", "FICR02", "FICS01"):
        B.ev("2026-11-01T10:09:00+00:00", p, "essai", "g1", mots=["TÊTE", "MER", "COUP", "PIED"], correct=False, un_de_moins=True, numero=1)
    B.ev("2026-11-01T10:09:10+00:00", "FICR01", "essai", "g1", mots=["A", "B", "C", "D"], correct=True, numero=2)
    B.visite("2026-11-01T12:00:00+00:00", "FICR02", "revisite_meme_jour", appareil="-app-autre")  # 2e appareil ; « - » initial => apostrophe
    B.ev("2026-11-01T10:40:00+00:00", "FICR01", "questionnaire", "g1", justesse="toutes", difficulte="bien_dosee", envie="oui",
         gene='Le mot "COUP" ; ambigu\nsur deux lignes')
    B.ev("2026-11-01T10:41:00+00:00", "FICS05", "questionnaire", "g1", justesse="plusieurs_injustes", difficulte="trop_difficile", envie="non", gene="")
    B.ev("2026-11-01T10:20:00+00:00", "FICS05", "indice", "g1", numero=1, mots=["X", "Y"], erreurs_au_moment=2)
    B.ev("2026-11-01T10:45:00+00:00", "FICR01", "partage", "g1", methode="copie")
    B.ev("2026-11-01T10:46:00+00:00", "FICR03", "partage", "g1", methode="annule")
    B.visite("2026-11-01T15:00:00+00:00", "FICINV", "premiere_visite", entree="invitation", grille="g1")
    B.partie("2026-11-01", "15:01", "FICINV", "g1")  # commence sans terminer : abandon
    B.visite("2026-11-01T16:00:00+00:00", "FICORG", "premiere_visite", entree="sans_lien", grille="g1")
    B.ev("2026-11-01T11:00:00+00:00", "FICR03", "minijeu", jeu="intrus", action="ouverture")
    B.ev("2026-11-01T11:00:10+00:00", "FICR03", "minijeu", jeu="intrus", action="debut", questions=["i1"])
    B.ev("2026-11-01T11:02:00+00:00", "FICR03", "minijeu", jeu="intrus", action="fin", score=4, total=5, duree_s=90)
    # ---- J2 = 2 novembre
    B.visite("2026-11-01T23:30:00+00:00", "FICR06", "retour_spontane", grille="g2")  # 23 h 30 UTC = 0 h 30 à Paris le 2
    B.partie("2026-11-01", "23:31", "FICR06", "g2")                                   # donc J2, abandon de g2
    B.visite("2026-11-02T08:00:00+00:00", "FICR01", "retour_apres_rappel", entree="rappel", grille="g2")
    B.partie("2026-11-02", "08:01", "FICR01", "g2", gagne=True, erreurs=2)
    B.visite("2026-11-02T08:10:00+00:00", "FICR02", "retour_rappel_probable", grille="g2")
    B.partie("2026-11-02", "08:11", "FICR02", "g2", gagne=False, erreurs=4)
    B.visite("2026-11-02T08:20:00+00:00", "FICS01", "retour_spontane", grille="g2")
    B.partie("2026-11-02", "08:21", "FICS01", "g2", gagne=True, erreurs=0)
    B.visite("2026-11-02T08:30:00+00:00", "FICS02", "retour_spontane", grille="g2")  # revient sans jouer
    B.visite("2026-11-02T08:40:00+00:00", "FICR03", "retour_spontane", grille="g2")  # revient sans jouer
    # ---- J3 = 3 novembre
    B.visite("2026-11-03T08:00:00+00:00", "FICS01", "retour_spontane", grille="g3")
    B.partie("2026-11-03", "08:01", "FICS01", "g3", gagne=True, erreurs=1)
    B.visite("2026-11-03T09:00:00+00:00", "FICR01", "retour_spontane", grille="g3")
    B.ev("2026-11-03T09:01:00+00:00", "FICR01", "entrainement", "", action="ouverture")
    B.ev("2026-11-03T09:01:10+00:00", "FICR01", "entrainement", "e01", action="debut", tentative=1)
    B.ev("2026-11-03T09:03:00+00:00", "FICR01", "entrainement", "e01", action="fin", gagne=True, erreurs=0, duree_s=100, tentative=1)
    return B


def main():
    print("Fonctions de base")
    lo, hi = A.wilson(4, 15)
    ok(round(100 * lo) == 11 and round(100 * hi) == 52, "Wilson 4/15 = 11–52 % (exemple du README)", (lo, hi))
    ok(A.wilson(0, 0) is None and A.wilson(0, 10)[0] == 0 and A.wilson(10, 10)[1] == 1, "Wilson : n = 0 et bornes 0 / 1")
    ok("non interprétable" in A.prop(3, 6) and "non interprétable" not in A.prop(10, 12) and "IC 95 %" in A.prop(10, 12), "étiquette « non interprétable » si n < 10 seulement")
    ok(A.prop(0, 0).endswith("non calculable"), "0/0 : non calculable, pas de pourcentage")
    d = A.lire_date("2026-11-01T23:30:00.123456+00:00")
    ok(A.PARIS is not None and A.jour_paris(d) == date(2026, 11, 2), "23 h 30 UTC le 1er novembre = 2 novembre à Paris")
    ok(A.lire_date("2026-11-01T22:30:00Z") == A.lire_date("2026-11-02 00:30:00+02:00") == A.lire_date("2026-11-01T22:30:00"), "dates ISO : Z, décalage, sans fuseau (UTC)")
    ok(A.jour_paris(A.lire_date("2026-07-14T22:30:00Z")) == date(2026, 7, 15), "heure d'été prise en compte")

    with tempfile.TemporaryDirectory(prefix="quotidien_test_analyse_") as tmp:
        B = scenario()
        fp, fe = B.fichiers(tmp)
        brut = open(fe, "rb").read()
        ok(brut.startswith(b"\xef\xbb\xbf") and b"\r\n" in brut and b'""COUP""' in brut, "exports fictifs écrits comme admin.html (BOM, \\r\\n, guillemets doublés)")
        av = []
        cols, lignes = A.lire_csv(fe, av)
        ok(cols == A.COLS_EVENEMENTS and len(lignes) == len(B.evenements) and not av, "lecture du CSV : en-tête sans BOM, une ligne par événement", av)
        ok(b";'-app-autre;" in brut and [l["appareil"] for l in lignes if l["appareil"].startswith("-")] == ["-app-autre"], "apostrophe anti-formule de l'export retirée à la lecture")
        q = [l for l in lignes if l["type"] == "questionnaire"][0]
        ok(json.loads(q["donnees_json"])["gene"] == 'Le mot "COUP" ; ambigu\nsur deux lignes', "cellule JSON avec point-virgule, guillemets et retour à la ligne")

        print("Rapport sur le scénario fictif")
        rapport, r = A.analyser(fp, fe, os.path.join(RACINE, "grilles.json"))
        ok(r["periode"] == (date(2026, 11, 1), date(2026, 11, 3)), "période déduite des grilles jouées : 1er au 3 novembre", r["periode"])
        ok(r["hors_periode"] == 1, "1 événement hors période (veille du J1), exclu", r["hors_periode"])
        ok(r["participants"] == {"R": 6, "S": 6, "invite": 1, "organique": 2}, "participants par groupe", r["participants"])
        ok(r["orphelins"] == ["FICORP"], "identifiant orphelin sans visite repéré", r["orphelins"])
        ok(r["multi_appareils"] == ["FICR02"], "participant à 2 appareils repéré", r["multi_appareils"])
        ok(r["doublons_fin"] == 1, "doublon de fin (participant, grille) repéré", r["doublons_fin"])
        ok(all(not v for v in r["discordances"].values()), "les deux fichiers sont cohérents entre eux", r["discordances"])
        e = r["entonnoir"]
        ok([e["*"][k] for k in ("crees", "lien", "ouvert", "commence", "termine", "resolu")] == [15, 12, 14, 13, 12, 10], "entonnoir total 15 → 12 → 14 → 13 → 12 → 10", e["*"])
        ok(e["S"]["resolu"] == 4 and e["R"]["resolu"] == 6 and e["invite"]["commence"] == 1 and e["invite"]["termine"] == 0 and e["organique"]["ouvert"] == 1, "entonnoir par groupe")
        ok(e["invite"]["lien"] == "sans objet", "« lien envoyé » sans objet pour les invités")
        p = r["participation"]
        ok((p[1]["total"], p[2]["total"], p[3]["total"]) == (13, 4, 1) and p[2]["R"] == 3 and p[2]["S"] == 1, "participation J1 = 13, J2 = 4 (dont la partie de 0 h 30 à Paris), J3 = 1", p)
        ret = r["retention"]
        ok(ret["R"]["J1"] == (3, 6) and ret["S"]["J1"] == (1, 6) and ret["*"]["J1"] == (4, 13), "rétention J1 : R 3/6, S 1/6, total 4/13", ret)
        ok(ret["*"]["J3"] == (0, 0) and ret["*"]["J7"] == (0, 0), "J3 et J7 non calculables sur 3 jours (personne n'est éligible)")
        ok(r["jours_joues"]["*"][2] == (4, 15) and r["jours_joues"]["S"][3] == (1, 6), "a joué ≥ 2 jours : 4/15 ; ≥ 3 jours en S : 1/6", r["jours_joues"])
        ok(r["retours"]["R"]["retour_apres_rappel"] == (1, 6) and r["retours"]["S"]["retour_spontane"] == (2, 6) and r["retours"]["R"]["retour_spontane"] == (4, 6),
           "retours selon la classe de visite de la base (FICR04 compris : sa visite d'avant J1 décale son classement)", r["retours"])
        ok("Une visite antérieure à J1" in rapport, "avertissement : visite avant J1 = première visite du test classée « retour »")
        g1 = r["grilles"]["g1"]
        ok((g1["commence"], g1["termine"], g1["resolu"], g1["abandons"]) == (13, 12, 10, 1), "g1 : 13 ont commencé, 12 terminé, 10 résolu, 1 abandon", g1)
        ok(abs(g1["erreurs_moy"] - 14 / 12) < 1e-9, "g1 : erreurs moyennes sur la première fin seulement", g1["erreurs_moy"])
        ok(g1["top_faux"] == ("COUP, MER, PIED, TÊTE", 3), "g1 : essai faux le plus fréquent", g1["top_faux"])
        ok(g1["indices"] == 1 and g1["questionnaires"] == 2 and g1["difficulte"] == {"bien_dosee": 1, "trop_difficile": 1} and g1["justesse"]["plusieurs_injustes"] == 1, "g1 : indices et questionnaire")
        ok(r["grilles"]["g2"]["abandons"] == 1 and "non interprétable" in r["grilles"]["g2"]["lecture"][0], "g2 : abandon compté, calibrage « non interprétable » (n < 10)")
        ok("facile" in rapport and re.search(r"\| g1 \| facile \|", rapport), "niveau prévu lu dans grilles.json")
        m = r["modes"]
        ok(m["Mot intrus"] == {"ouvert": 1, "joueurs": 1, "commencees": 1, "terminees": 1} and m["Entraînement"]["terminees"] == 1 and m["Défi express"]["joueurs"] == 0, "mini-jeux et entraînement par mode", m)
        ok(r["minijeu_retour"] == {"mini_revenu": 1, "mini_pas": 0, "sans_revenu": 7, "sans_pas": 12}, "mini-jeu le jour J × retour J+1 (comptes bruts)", r["minijeu_retour"])
        ok(r["partage"] == {"clics": 1, "cliqueurs": 1, "invites": 1, "invites_effectifs": 1}, "partage : 1 clic (annulation écartée), 1 invité effectif", r["partage"])
        ok(not r["anomalies_S"], "aucun rappel au groupe S dans le scénario")

        print("Honnêteté statistique")
        ok("3/6 = 50 % [IC 95 % : 19–81 %] · non interprétable (n < 10)" in rapport, "J1 du groupe R affiché avec k/n, intervalle de Wilson et étiquette")
        ok("10/12 = 83 % [IC 95 % : 55–95 %]" in rapport, "réussite de g1 affichée avec k/n et intervalle")
        pcts = re.findall(r"[^|\n]{0,40}\d+ %", "\n".join(l for l in rapport.split("\n") if not l.startswith(("**Règles", "*Règles")) and "IC 95" not in l and "entre" not in l))
        ok(not pcts, "aucun pourcentage sans effectif ni intervalle dans le rapport", pcts[:3])
        ok("## 8. Ce que ces données permettent de conclure / ne permettent pas de conclure" in rapport, "section finale présente")
        non = "\n".join(r["conclusions"]["non"])
        ok("Comparer R et S sur le retour à J1" in non and "aucune comparaison possible" in non, "R / S déclaré non comparable (moins de 10 par groupe)")
        ok("Comparer finement R et S : 6 participant(s) en R (6 ont joué) et 6 en S" in non, "rappel R / S généré avec les effectifs réels")
        ok("Rétention J7" in non and "Non calculable" in non, "J7 annoncé non calculable plutôt qu'à 0 %")
        ok("Dire que les mini-jeux font revenir" in non, "lien mini-jeu / retour présenté comme non causal")

        print("Ligne de commande")
        sortie = os.path.join(tmp, "rapport_FICTIF.md")
        c = subprocess.run([sys.executable, "-B", SCRIPT, fp, fe, "--sortie", sortie], capture_output=True, text=True)
        ok(c.returncode == 0 and os.path.exists(sortie) and open(sortie, encoding="utf-8").read().startswith("# Quotidien"), "commande complète avec --sortie", c.stderr[-300:])
        c = subprocess.run([sys.executable, "-B", SCRIPT, fp, fe, "--fin", "2026-11-02"], capture_output=True, text=True, encoding="utf-8")
        ok(c.returncode == 0 and "J2 = 02/11/2026" in c.stdout, "--fin exclut le dernier jour ; rapport affiché à l'écran", c.stderr[-300:])
        c = subprocess.run([sys.executable, "-B", SCRIPT, os.path.join(tmp, "absent.csv"), fe], capture_output=True, text=True)
        ok(c.returncode == 2 and "introuvable" in c.stderr, "fichier introuvable : message clair et code 2")

        print("Exports incomplets ou abîmés")
        sous = os.path.join(tmp, "incomplet")
        os.mkdir(sous)
        fp2, fe2 = B.fichiers(sous, sans_p=("lien_envoye_le", "rappels_envoyes"), sans_e=("classe_visite", "donnees_json", "appareil"))
        rapport2, r2 = A.analyser(fp2, fe2, os.path.join(RACINE, "grilles.json"))
        ok(r2["colonnes_absentes"] == {"participants": ["lien_envoye_le", "rappels_envoyes"], "evenements": ["classe_visite", "appareil", "donnees_json"]}, "colonnes absentes listées", r2["colonnes_absentes"])
        ok("`classe_visite`" in rapport2 and "Non calculable" in rapport2 and "`lien_envoye_le`" in rapport2, "le rapport dit clairement ce qui manque")
        ok(r2["entonnoir"]["*"]["commence"] == 13 and r2["entonnoir"]["*"]["lien"] == "n. c." and r2["retention"]["*"]["J1"] == (4, 13) and "retours" not in r2,
           "le reste est calculé quand même (entonnoir, rétention)")
        ok(r2["multi_appareils"] == ["FICR02"], "repli sur `appareils_distincts` de l'export participants")
        sous = os.path.join(tmp, "sans_json")
        os.mkdir(sous)
        fp3, fe3 = B.fichiers(sous, sans_e=("classe_visite", "gagne", "erreurs"))
        _, r3 = A.analyser(fp3, fe3, os.path.join(RACINE, "grilles.json"))
        ok(r3["entonnoir"]["*"]["resolu"] == 10 and r3["retours"]["R"]["retour_apres_rappel"] == (1, 6), "colonnes absentes retrouvées dans `donnees_json`")
        _, r4 = A.analyser(fp, fe, os.path.join(tmp, "pas_de_grilles.json"))
        ok(r4["entonnoir"]["*"]["commence"] == 13 and r4["periode"][0] == date(2026, 10, 31), "sans grilles.json : le script continue (début = premier événement)", r4["periode"])
        vide = os.path.join(tmp, "vide.csv")
        open(vide, "w").close()
        rapport5, r5 = A.analyser(vide, vide)
        ok("## 8." in rapport5 and r5["hors_periode"] == 0, "fichiers vides : rapport produit sans erreur")

    ok(not os.path.exists(tmp), "dossier temporaire supprimé : aucune donnée fictive laissée sur le disque")
    avant = {f for f in os.listdir(os.path.join(RACINE, "analyse")) if not f.startswith("__")}
    ok(avant <= {"analyser_export.py", "README.md"}, "rien d'autre que le script et son mode d'emploi dans analyse/", avant)
    print()
    print("Tous les contrôles sont passés." if not echecs else f"{echecs} contrôle(s) en échec.")
    return 1 if echecs else 0


if __name__ == "__main__":
    sys.exit(main())
