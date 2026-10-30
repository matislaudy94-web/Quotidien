// Tests de bout en bout d'« Expression mystère » (Playwright, Chromium en émulation iPhone 13 et SE).
// node tests/test_expression_parcours.js
const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const PORT = 8778, BASE = `http://localhost:${PORT}`;
const G = require(path.join(__dirname, "..", "grilles.json"));
const XB = require(path.join(__dirname, "..", "expressions.json")).expressions;
const CAPT = process.env.CAPTURES || path.join(__dirname, "..", "captures_tests");
let echecs = 0;
const ok = (cond, msg) => { console.log((cond ? "  OK   " : "  ÉCHEC ") + msg); if (!cond) echecs++; };
const db = async () => (await fetch(BASE + "/__test/db")).json();
const rpc = async (nom, params) => (await fetch(`${BASE}/rest/v1/rpc/${nom}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) })).json();
const TYPES_TEST = ["debut", "essai", "fin", "indice", "recompense", "demande_suivante", "questionnaire", "partage"];

// Expression affichée : retrouvée dans la banque à partir des 4 propositions.
async function courante(page) {
  const props = await page.$$eval("#ecran-expression [data-prop]", t => t.map(x => x.dataset.prop));
  return XB.find(x => [x.mot].concat(x.leurres).sort().join() === props.slice().sort().join());
}
async function jouer(page, fautes = [], verif) {
  const vues = [];
  for (let k = 0; k < 5; k++) {
    await page.waitForSelector("#expr-valider:not(.hidden)");
    const x = await courante(page); vues.push(x.id);
    const choix = fautes.includes(k) ? x.leurres[0] : x.mot;
    if (verif && k === 0) await verif(x);
    if (!(await page.locator("#expr-suite").count())) {
      await page.click(`#ecran-expression [data-prop="${choix}"]`);
      await page.click("#expr-valider");
    }
    await page.waitForSelector("#expr-suite");
    await page.click("#expr-suite");
  }
  await page.waitForSelector("#expr-rejouer");
  return vues;
}

(async () => {
  const srv = spawn("node", [path.join(__dirname, "serveur_test.js")], { env: { ...process.env, PORT: String(PORT) }, stdio: "inherit" });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch();
  const erreurs = [];
  const nouveau = async (device = devices["iPhone 13"]) => {
    const ctx = await browser.newContext({ ...device });
    await ctx.addInitScript(() => { try { localStorage.setItem("quotidien_regles_vues", "true"); localStorage.setItem("quotidien_regles_vues_demo", "true"); } catch (e) {} });
    const page = await ctx.newPage();
    page.on("pageerror", e => erreurs.push(String(e)));
    page.on("console", m => { if (m.type() === "error" && !/401/.test(m.text())) erreurs.push(m.text()); });
    return { ctx, page };
  };
  require("fs").mkdirSync(CAPT, { recursive: true });
  try {
    const cal = {}; G.forEach((g, i) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + i); cal[new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d)] = g.id; });
    const s = await rpc("a_creer_session", { code: "code-test", p_nom: "Expressions", p_calendrier: cal });
    const [{ id: A }] = await rpc("a_creer_participants", { code: "code-test", p_session: s.id, n: 1 });
    const { page } = await nouveau();

    console.log("1. Accès depuis l'onglet Jeux");
    await page.goto(`${BASE}/?p=${A}`); await page.waitForSelector("#carte-jour");
    ok(await page.locator("#carte-expression").isVisible(), "accueil : tuile Expression mystère");
    await page.click('#nav-bas [data-ecran="jeux"]'); await page.waitForSelector("#jeu-expression");
    const carte = await page.locator("#jeu-expression").innerText();
    ok(/Expression mystère/.test(carte) && /2 à 4 min/.test(carte) && /Jouer/.test(await page.locator("#jeu-expression-btn").innerText()) && !/meilleur score/i.test(carte), "carte : nom, description, durée, bouton « Jouer », pas de score tant qu'on n'a pas joué");
    await page.click("#jeu-expression-btn"); await page.waitForSelector("#expr-go");
    const acc = await page.locator("#ecran-expression").innerText();
    ok(/EXPRESSION MYSTÈRE/i.test(acc) && /mot qui manque/i.test(acc) && /2 à 4 minutes/.test(acc) && !/Meilleur score/.test(acc), "écran d'accueil : titre, principe, durée, aucun meilleur score fictif");
    await page.screenshot({ path: path.join(CAPT, "expr_1_accueil.png"), fullPage: true });

    console.log("2-10. Une partie complète");
    await page.click("#expr-go");
    const vues1 = await jouer(page, [0], async (x) => {
      const t = await page.locator("#ecran-expression").innerText();
      ok(/Expression 1/.test(t) && await page.locator(".barre-expr").count() === 1, "numéro « Expression 1 / 5 » et barre de progression");
      ok(await page.locator("#expr-texte .trou").innerText() === "______" && t.includes(x.indice), "expression avec un emplacement vide, et l'indice");
      ok(await page.locator("#ecran-expression [data-prop]").count() === 4 && await page.locator("#expr-valider").isDisabled(), "4 propositions ; « Valider » inactif tant qu'aucune n'est choisie");
      await page.click(`#ecran-expression [data-prop="${x.leurres[1]}"]`);
      await page.click(`#ecran-expression [data-prop="${x.leurres[0]}"]`);
      ok(await page.locator('[data-prop][aria-checked="true"]').count() === 1 && await page.locator(`[data-prop="${x.leurres[0]}"]`).getAttribute("aria-checked") === "true", "on peut changer de proposition : une seule reste sélectionnée");
      ok((await page.locator("#expr-texte .trou").innerText()).toUpperCase() === x.leurres[0], "la proposition choisie s'affiche dans l'expression");
      ok(await page.locator("#expr-valider").isEnabled(), "« Valider » actif après un choix");
      await page.screenshot({ path: path.join(CAPT, "expr_2_question.png") });
      // Double validation : deux clics immédiats ne valident qu'une fois
      await page.evaluate(() => { const b = document.getElementById("expr-valider"); b.click(); b.click(); });
      await page.waitForSelector("#expr-suite");
      const ret = await page.locator("#expr-retour").innerText();
      ok(/Raté/.test(ret) && ret.includes(x.mot) && ret.includes(x.complete) && ret.includes(x.sens) && ret.includes(x.exemple), "mauvaise réponse : verdict, bonne réponse, expression complète, sens et exemple");
      ok(/✗/.test(await page.locator(".tile.ep.faux").innerText()) && /✓/.test(await page.locator(".tile.ep.juste").innerText()), "✗ sur le choix, ✓ sur la bonne réponse (pas seulement des couleurs)");
      ok(await page.locator(".retour-intrus").count() === 1, "deux clics rapides sur « Valider » : une seule validation");
      await page.waitForTimeout(1200);
      ok(/Expression 1/.test(await page.locator("#ecran-expression .palier").innerText()), "pas de passage automatique à l'expression suivante");
      await page.screenshot({ path: path.join(CAPT, "expr_3_explication.png"), fullPage: true });
    }).catch(async e => { throw e; });
    // La fonction jouer a déjà validé la question 1 dans `verif` : on vérifie le reste à la fin.
    const fin = await page.locator("#ecran-expression").innerText();
    ok(/4\/5/.test(fin) && /80 %/.test(fin) && /temps/i.test(fin), "résultat : 4/5, 80 %, temps total");
    ok(/\+70 XP/.test(fin) && /4 expressions trouvées pour la première fois/.test(fin) && /Première expression mystère/.test(fin) && /Fin connaisseur/.test(fin), "XP réellement gagnées : 4 × 5 + objectifs (première partie 20, 4/5 30) = +70 XP");
    ok(await page.locator("#expr-rejouer").isVisible() && await page.locator("#expr-revoir").isVisible() && await page.locator('#ecran-expression [data-ecran="jeux"]').isVisible(), "boutons : Rejouer (principal), Revoir les expressions, Retour aux jeux");
    ok(await page.locator("#expr-revue .expl-intrus").count() === 5 && await page.locator("#expr-revue .expl-intrus.faux").count() === 1, "les 5 expressions de la partie, la ratée signalée");
    await page.click("#expr-revoir"); await page.waitForTimeout(500);
    ok(await page.evaluate(() => document.getElementById("expr-revue").getBoundingClientRect().top < window.innerHeight), "« Revoir les expressions » amène à la liste");
    await page.screenshot({ path: path.join(CAPT, "expr_4_resultat.png"), fullPage: true });

    console.log("11-17. Persistance, rejeu, pas de double récompense");
    await page.reload(); await page.waitForSelector("#carte-jour");
    ok(/Meilleur : 4\/5/.test(await page.locator("#carte-expression").innerText()), "après rechargement : meilleur score 4/5 sur l'accueil");
    ok(/70 XP/.test(await page.locator("#carte-xp").innerText()), "XP conservée : 70 XP");
    await page.click('#nav-bas [data-ecran="jeux"]'); await page.click("#jeu-expression-btn"); await page.click("#expr-go");
    const vues2 = await jouer(page, []);
    ok(vues2.every(id => !vues1.includes(id)) && new Set(vues2).size === 5, "rejouer : 5 nouvelles expressions, aucune déjà vue, aucune répétée");
    const fin2 = await page.locator("#ecran-expression").innerText();
    ok(/5\/5/.test(fin2) && /\+65 XP/.test(fin2) && /Sans fausse note/.test(fin2) && /Niveau supérieur/.test(fin2), "5/5 : +25 XP + objectif parfait (40) = +65 XP, passage au niveau 2");
    await page.reload(); await page.waitForSelector("#carte-xp");
    ok(/135 XP/.test(await page.locator("#carte-xp").innerText()), "XP totale après rechargement : 135 (rien n'est crédité deux fois)");
    await page.click('#nav-bas [data-ecran="stats"]'); await page.waitForSelector("#ecran-stats:not(.hidden)");
    const st = (await page.locator("#ecran-stats").innerText()).replace(/\s+/g, " ");
    ok(/2 Parties terminées/i.test(st) && /5\/5 Meilleur score/i.test(st) && /90 % Réussite moyenne/i.test(st) && /9\/\d+ Expressions découvertes/i.test(st), "stats : 2 parties, meilleur 5/5, 90 % de réussite, 9 expressions découvertes");
    ok(/0 Grilles terminées/i.test(st), "stats de la grille du jour inchangées (0 grille terminée)");
    await page.click('#nav-bas [data-ecran="progression"]'); await page.waitForSelector("#ecran-progression:not(.hidden)");
    const pr = await page.locator("#ecran-progression").innerText();
    ok(/Première expression mystère/.test(pr) && /Sans fausse note/.test(pr), "Progression : objectifs d'Expression mystère");

    console.log("20. Aucun impact sur la grille du jour et les données du test");
    await page.click('#nav-bas [data-ecran="accueil"]'); await page.waitForSelector("#carte-jour");
    ok(/À jouer/.test(await page.locator("#carte-jour").innerText()), "la grille du jour reste « À jouer »");
    const ev = (await db()).evenements.filter(e => e.participant_id === A);
    ok(ev.filter(e => TYPES_TEST.includes(e.type)).length === 0, "aucun événement du test (pas de « recompense », « fin »…)");
    const mj = ev.filter(e => e.type === "minijeu" && e.donnees.jeu === "expression");
    ok(mj.filter(e => e.donnees.action === "fin").length === 2 && mj.every(e => e.grille === null), "événements « minijeu » (jeu expression) : 2 fins de partie, sans grille");
    const fin1 = mj.find(e => e.donnees.action === "fin");
    ok(fin1.donnees.score === 4 && fin1.donnees.xp === 70, "trace de fin : score 4 et XP 70");

    console.log("19. Petit écran (iPhone SE)");
    const { page: ps } = await nouveau(devices["iPhone SE"]);
    await ps.goto(`${BASE}/?demo=1`); await ps.waitForSelector("#carte-expression");
    await ps.click("#btn-expression"); await ps.click("#expr-go"); await ps.waitForSelector("#expr-valider");
    ok(!(await ps.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), "aucun défilement horizontal");
    ok((await ps.$$eval("#ecran-expression [data-prop]", t => t.map(x => x.scrollWidth <= x.clientWidth + 1 && x.getBoundingClientRect().height >= 44))).every(Boolean), "propositions lisibles, dans leur case, hauteur ≥ 44 px");
    const x0 = await courante(ps); await ps.click(`#ecran-expression [data-prop="${x0.mot}"]`);
    const vis = await ps.evaluate(() => { const r = document.getElementById("expr-valider").getBoundingClientRect(); return r.bottom <= window.innerHeight; });
    ok(vis, "le bouton « Valider » est visible sans défiler");
    await ps.screenshot({ path: path.join(CAPT, "expr_5_iphone_se.png") });

    ok(erreurs.length === 0, "aucune erreur JavaScript " + erreurs.join(" | "));
  } catch (e) { console.error(e); echecs++; }
  finally {
    await browser.close(); srv.kill();
    console.log(echecs ? `${echecs} échec(s)` : "Expression mystère (parcours) : tous les tests passent.");
    process.exit(echecs ? 1 : 0);
  }
})();
