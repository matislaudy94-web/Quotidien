// Tests unitaires du mini-jeu « Le mot intrus » (node tests/test_intrus.js).
const path = require("path"), fs = require("fs");
const memoire = {};
global.window = global;
global.localStorage = { getItem: k => (k in memoire ? memoire[k] : null), setItem: (k, v) => { memoire[k] = String(v); }, removeItem: k => { delete memoire[k]; } };
window.QUOTIDIEN_INTRUS = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "intrus.json"), "utf8"));
require(path.join(__dirname, "..", "intrus.js"));
const I = window.QuotidienIntrus, Q = window.QUOTIDIEN_INTRUS.questions;
const CAL = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "grilles.json"), "utf8"));
let ko = 0; const ok = (c, m) => { console.log((c ? "  OK   " : "  ÉCHEC ") + m); if (!c) ko++; };

console.log("1. Banque");
ok(Q.length >= 40, `banque suffisante : ${Q.length} questions`);
const motsCal = new Set(CAL.flatMap(g => g.groupes.flatMap(x => x.mots)));
ok(Q.every(q => q.mots.every(w => !motsCal.has(w))), "aucun mot du calendrier du test");
ok(Q.every(q => q.mots.includes(q.intrus) && new Set(q.mots).size === 4), "4 mots distincts, l'intrus parmi eux");

console.log("2. Tirage d'une série");
const s = I.tirerSerie([], 42);
ok(s.length === 5 && s.map(q => q.difficulte).join() === "facile,facile,moyen,moyen,difficile", "5 questions : 2 faciles, 2 moyennes, 1 difficile, dans cet ordre");
ok(new Set(s.map(q => q.id)).size === 5, "aucune question en double dans une série");
ok(JSON.stringify(I.tirerSerie([], 42)) === JSON.stringify(s), "même graine → même série (reproductible)");
ok(s.every(q => q.ordre.slice().sort().join() === q.mots.slice().sort().join()), "les 4 mots sont présentés mélangés, sans en perdre");
let positions = new Set(); for (let g = 0; g < 200; g++) I.tirerSerie([], g).forEach(q => positions.add(q.ordre.indexOf(q.intrus)));
ok(positions.size === 4, "l'intrus apparaît à chacune des 4 places selon les parties");
// Les questions déjà vues sont évitées tant qu'il en reste de nouvelles
const vues = Q.filter(q => q.difficulte === "facile").slice(0, Q.filter(q => q.difficulte === "facile").length - 2).map(q => q.id);
let evite = true; for (let g = 0; g < 50; g++) if (I.tirerSerie(vues, g).some(q => vues.includes(q.id))) evite = false;
ok(evite, "les questions déjà vues ne reviennent pas tant qu'il reste des questions neuves");

console.log("3. Records et trophées (stockage local, sans XP)");
let r = I.enregistrerSerie("t", { score: 3, total: 5, ids: s.map(q => q.id) });
ok(r.nouveauRecord && r.etat.meilleur === 3 && r.badges.length === 0, "première série 3/5 : record 3, aucun trophée");
r = I.enregistrerSerie("t", { score: 2, total: 5, ids: [] });
ok(!r.nouveauRecord && I.lire("t").meilleur === 3, "série moins bonne : le record reste 3/5");
r = I.enregistrerSerie("t", { score: 5, total: 5, ids: [] });
ok(r.nouveauRecord && r.badges.map(b => b.id).join() === "oeil", "5/5 : nouveau record et trophée « Œil de lynx »");
I.enregistrerSerie("t", { score: 5, total: 5, ids: [] }); r = I.enregistrerSerie("t", { score: 5, total: 5, ids: [] });
ok(r.badges.map(b => b.id).join() === "trois_parfaites", "trois séries à 5/5 : trophée « Fin limier » (une seule fois)");
const e = I.lire("t");
ok(e.series === 5 && e.bonnes === 20 && e.repondues === 25 && e.dernieres.length === 5, "compteurs exacts : 5 séries, 20 bonnes réponses sur 25");
r = I.enregistrerSerie("t", { score: 1, total: 5, ids: Q.map(q => q.id) });
ok(r.badges.some(b => b.id === "tour") && I.lire("t").vues.length === 0, "toute la banque vue : trophée « Tour complet », le tour recommence");
ok(!Object.keys(memoire).some(k => /journal/.test(k)), "aucune écriture dans le journal de progression (pas d'XP)");

console.log(ko ? `${ko} échec(s)` : "Mot intrus : tous les tests passent.");
process.exit(ko ? 1 : 0);
