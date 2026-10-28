// Tests unitaires du moteur du Défi express (node tests/test_defi.js).
const path = require("path"), fs = require("fs");
const memoire = {};
global.window = global;
global.localStorage = { getItem: k => (k in memoire ? memoire[k] : null), setItem: (k, v) => { memoire[k] = String(v); }, removeItem: k => { delete memoire[k]; } };
window.QUOTIDIEN_DEFI = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "defi.json"), "utf8"));
require(path.join(__dirname, "..", "defi.js"));
const D = window.QuotidienDefi, B = window.QUOTIDIEN_DEFI;
let ko = 0; const ok = (c, m) => { console.log((c ? "  OK   " : "  ÉCHEC ") + m); if (!c) ko++; };

// 1. Reproductibilité
const s1 = D.genererSuite("graine-test"), s2 = D.genererSuite("graine-test"), s3 = D.genererSuite("autre-graine");
ok(JSON.stringify(s1) === JSON.stringify(s2), "même graine → exactement les mêmes 30 paliers (duel équitable)");
ok(JSON.stringify(s1) !== JSON.stringify(s3), "graine différente → paliers différents");
ok(s1.length === 30 && s1.every((p, i) => p.groupes.length === D.format(i + 1).groupes && p.groupes.every(g => g.mots.length === D.format(i + 1).taille)), "30 paliers, tailles conformes (2×2 → 2×3 → 3×2 → 3×3 → 4×3)");

// 2. Règles de tirage sur un grand nombre de parties
const cat = Object.fromEntries(B.categories.map(c => [c.id, c]));
const inc = new Set(B.incompatibles.flatMap(([a, b]) => [a + "|" + b, b + "|" + a]));
let viol = 0, motsDup = 0, plusieurs = 0, total = 0, repet = 0;
const vus = new Set(), vusMots = new Set();
const N = 3000;
for (let k = 0; k < N; k++) {
  const suite = D.genererSuite("s" + k);
  suite.forEach((p, i) => {
    total++;
    const ids = p.groupes.map(g => g.id);
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      if (cat[ids[a]].famille === cat[ids[b]].famille || inc.has(ids[a] + "|" + ids[b])) viol++;
    }
    const mots = p.mots; if (new Set(mots).size !== mots.length) motsDup++;
    // chaque mot affiché n'appartient qu'à UNE des catégories tirées
    for (const m of mots) if (ids.filter(id => cat[id].mots.includes(m)).length !== 1) plusieurs++;
    const prec = suite.slice(Math.max(0, i - 3), i).flatMap(q => q.groupes.map(g => g.id));
    if (ids.some(id => prec.includes(id))) repet++;
    vus.add(ids.slice().sort().join("+") + ":" + p.groupes.map(g => g.mots.slice().sort().join(",")).sort().join("/"));
    if (i === 12) vusMots.add(p.mots.slice().sort().join(","));
  });
}
ok(viol === 0, `${total} paliers tirés : jamais deux catégories de la même famille ni incompatibles (${viol} violation)`);
ok(motsDup === 0 && plusieurs === 0, "aucun mot en double sur un plateau, chaque mot appartient à une seule catégorie tirée");
ok(repet / total < 0.01, `catégories des 3 paliers précédents évitées (${repet} répétitions sur ${total})`);
ok(vus.size / total > 0.999, `variété : ${vus.size} paliers distincts sur ${total} tirés`);
ok(vusMots.size === N, `palier 13 (3 groupes de 3) : ${vusMots.size} plateaux différents sur ${N} parties`);

// 3. Vérification d'une sélection
const p = s1[4];
ok(D.groupeDe(p, p.groupes[1].mots) === 1, "les mots d'un groupe sont reconnus");
ok(D.groupeDe(p, [p.groupes[0].mots[0], p.groupes[1].mots[1], p.groupes[0].mots[1]]) === -1, "un mélange de deux groupes est refusé");
ok(D.groupeDe(p, p.groupes[0].mots.slice(0, 2)) === -1, "une sélection incomplète est refusée");

// 4. Classement
const cl = [{ p: "A", paliers: 8, temps_ms: 90000 }, { p: "B", paliers: 10, temps_ms: 200000 }, { p: "C", paliers: 8, temps_ms: 70000 }].sort(D.comparer);
ok(cl.map(x => x.p).join("") === "BCA", "classement : le plus de paliers d'abord, puis le plus rapide (B, C, A)");

// 5. Records et badges (aucune XP)
let r = D.enregistrerPartie("t", { paliers: 6, temps_ms: 80000, serieSansErreur: 6, meilleurPalierMs: 2500 });
ok(r.nouveauRecord && r.badges.map(b => b.id).sort().join() === "lancee,reflexe", "6 paliers, un palier en 2,5 s : record + badges Sur la lancée et Réflexe");
r = D.enregistrerPartie("t", { paliers: 4, temps_ms: 30000, serieSansErreur: 4 });
ok(!r.nouveauRecord && r.badges.length === 0 && r.etat.record.paliers === 6, "partie moins bonne : record conservé, aucun badge");
r = D.enregistrerPartie("t", { paliers: 6, temps_ms: 60000, serieSansErreur: 2 });
ok(r.nouveauRecord, "même nombre de paliers mais plus rapide : nouveau record");
r = D.enregistrerPartie("t", { paliers: 11, temps_ms: 200000, serieSansErreur: 10, salon: "ABC123" });
ok(r.badges.map(b => b.id).sort().join() === "duelliste,fusee,main_sure", "11 paliers dont 10 sans erreur, en groupe : Fusée, Main sûre, Joueur d'équipe");
ok(D.marquerChampion("t").id === "champion" && D.marquerChampion("t") === null, "badge Champion du salon donné une seule fois");
ok(D.lire("t").parties === 4 && !("xp" in D.lire("t")), "4 parties comptées, aucune XP stockée");
ok(memoire["quotidien_journal_t"] === undefined, "le Défi n'écrit rien dans le journal de progression (XP)");

console.log(ko ? ko + " échec(s)" : "Moteur du Défi : tous les tests passent.");
process.exit(ko ? 1 : 0);
