// Tests unitaires d'« Expression mystère » : moteur (expression.js) et XP (progression.js). node tests/test_expression.js
const path = require("path"), fs = require("fs");
const memoire = {};
global.window = global;
global.localStorage = { getItem: k => (k in memoire ? memoire[k] : null), setItem: (k, v) => { memoire[k] = String(v); }, removeItem: k => { delete memoire[k]; } };
window.QUOTIDIEN_EXPRESSIONS = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "expressions.json"), "utf8"));
require(path.join(__dirname, "..", "expression.js"));
require(path.join(__dirname, "..", "progression.js"));
const X = window.QuotidienExpression, P = window.QuotidienProgression, B = window.QUOTIDIEN_EXPRESSIONS.expressions;
let ko = 0; const ok = (c, m) => { console.log((c ? "  OK   " : "  ÉCHEC ") + m); if (!c) ko++; };
const J = "2026-11-02";

console.log("1. Banque");
ok(B.length >= 40, `banque : ${B.length} expressions`);
ok(B.every(x => x.texte.split("___").length === 2 && x.leurres.length === 3 && !x.leurres.includes(x.mot)), "un trou par expression, 3 leurres différents du mot");
ok(X.partiePossible(), "assez d'expressions pour composer une partie");

console.log("2. Tirage d'une partie");
const p1 = X.tirerPartie([], 7);
ok(p1.length === 5 && new Set(p1.map(x => x.id)).size === 5, "5 expressions, aucune répétition dans la partie");
ok(p1[0].difficulte === "facile" && p1[1].difficulte === "facile" && p1[2].difficulte === "intermediaire" && p1[3].difficulte === "intermediaire" && ["intermediaire", "difficile"].includes(p1[4].difficulte), "progression : 2 faciles, 2 intermédiaires, puis intermédiaire ou difficile");
ok(p1.every(x => x.propositions.length === 4 && x.propositions.includes(x.mot) && x.leurres.every(l => x.propositions.includes(l))), "4 propositions : le bon mot et ses 3 leurres");
ok(JSON.stringify(X.tirerPartie([], 7)) === JSON.stringify(p1), "même graine → même partie (reproductible)");
const places = new Set(); for (let g = 0; g < 200; g++) X.tirerPartie([], g).forEach(x => places.add(x.propositions.indexOf(x.mot)));
ok(places.size === 4, "le bon mot apparaît à chacune des 4 places selon les parties");
let neuves = true; for (let g = 0; g < 50; g++) if (X.tirerPartie(p1.map(x => x.id), g).some(x => p1.some(y => y.id === x.id))) neuves = false;
ok(neuves, "les expressions déjà vues ne reviennent pas tant qu'il en reste de nouvelles");

console.log("3. Statistiques locales");
let r = X.enregistrerPartie("t", { id: "a", score: 4, total: 5, vues: p1.map(x => x.id), trouvees: p1.slice(0, 4).map(x => x.id), duree_s: 80 });
ok(!r.deja && r.nouveauRecord && r.etat.meilleur === 4 && r.etat.parties === 1, "première partie : 4/5, record");
r = X.enregistrerPartie("t", { id: "a", score: 4, total: 5, vues: [], trouvees: [], duree_s: 80 });
ok(r.deja && X.lire("t").parties === 1, "la même partie enregistrée deux fois ne compte qu'une fois");
r = X.enregistrerPartie("t", { id: "b", score: 5, total: 5, vues: [], trouvees: [p1[4].id], duree_s: 60 });
const e = X.lire("t");
ok(e.parties === 2 && e.meilleur === 5 && e.parfaites === 1 && e.bonnes === 9 && e.repondues === 10 && e.trouvees.length === 5, "compteurs réels : 2 parties, meilleur 5/5, 1 parfaite, 9/10, 5 expressions découvertes");

console.log("4. XP dans le système de progression existant");
const ids = B.map(x => x.id);
let g = P.enregistrerExpression("p", { id: "1", trouvees: ids.slice(0, 4), score: 4, total: 5, duree_s: 90, jour: J }, J);
ok(g.gains.xpPartie === 20 && g.gains.xp === 70 && g.gains.objectifs.map(o => o.id).sort().join() === "expr_premiere,expr_quatre", "4 expressions nouvelles : 4 × 5 = 20 XP + objectifs « première partie » (20) et « 4/5 » (30) = 70 XP");
g = P.enregistrerExpression("p", { id: "1", trouvees: ids.slice(0, 4), score: 4, total: 5, jour: J }, J);
ok(g.deja, "la même partie (même identifiant) ne crédite rien une seconde fois");
g = P.enregistrerExpression("p", { id: "2", trouvees: ids.slice(0, 4), score: 4, total: 5, jour: J }, J);
ok(!g.deja && g.gains.xp === 0, "rejouer et retrouver les mêmes expressions : 0 XP");
g = P.enregistrerExpression("p", { id: "3", trouvees: ids.slice(4, 9), score: 5, total: 5, jour: J }, J);
ok(g.gains.xpPartie === 25 && g.gains.objectifs.map(o => o.id).join() === "expr_parfaite", "partie parfaite avec 5 nouvelles : +25 XP et objectif « Sans fausse note » (40)");
g = P.enregistrerExpression("p", { id: "4", trouvees: ids.slice(9, 10), score: 1, total: 5, jour: J }, J);
ok(g.gains.objectifs.map(o => o.id).join() === "expr_dix", "10 expressions différentes trouvées : objectif « Dix expressions »");
const c = P.calculer(P.lireJournal("p"), J);
ok(c.xp === 70 + 0 + 25 + 40 + 5 + 50, "XP totale exacte : " + c.xp);
ok(c.stats.terminees === 0 && c.stats.taux === null && c.stats.serie.actuelle === 0 && c.stats.quotidien.terminees === 0, "aucune partie d'Expression mystère n'est comptée comme une grille (terminées, taux, série)");
ok(!c.objectifs.find(o => o.id === "premier_defi").termine && !c.badges.find(b => b.id === "premiere_grille").obtenu, "les objectifs et badges des grilles ne sont pas débloqués par Expression mystère");
P.enregistrerPartie("p", { grille: "g1", niveau: "facile", jour: J, gagne: true, erreurs: 1, groupes: 4, duree_s: 200, indices: 0 }, J);
const c2 = P.calculer(P.lireJournal("p"), J);
ok(c2.stats.terminees === 1 && c2.stats.taux === 1 && c2.objectifs.find(o => o.id === "premier_defi").termine, "une vraie grille ensuite : comptée normalement (1 terminée, taux 100 %)");

console.log(ko ? `${ko} échec(s)` : "Expression mystère (moteur et XP) : tous les tests passent.");
process.exit(ko ? 1 : 0);
