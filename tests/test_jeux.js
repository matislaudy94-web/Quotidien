// Tests de bout en bout : navigation (5 onglets, bouton retour), onglet Jeux, mini-jeu « Le mot intrus », partage,
// séparation des données du test (node tests/test_jeux.js ; Playwright, Chromium en émulation iPhone).
const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const PORT = 8776, BASE = `http://localhost:${PORT}`;
const G = require(path.join(__dirname, "..", "grilles.json"));
const Q = require(path.join(__dirname, "..", "intrus.json")).questions;
const CAPT = process.env.CAPTURES || path.join(__dirname, "..", "captures_tests");
let echecs = 0;
const ok = (cond, msg) => { console.log((cond ? "  OK   " : "  ÉCHEC ") + msg); if (!cond) echecs++; };
const db = async () => (await fetch(BASE + "/__test/db")).json();
const rpc = async (nom, params) => (await fetch(`${BASE}/rest/v1/rpc/${nom}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) })).json();
const TYPES_TEST = ["debut", "essai", "fin", "indice", "recompense", "demande_suivante", "questionnaire", "partage"];

// Joue une série du mot intrus : répond juste partout sauf aux questions listées dans `fautes` (indices 0 à 4).
async function jouerIntrus(page, fautes = []) {
  for (let k = 0; k < 5; k++) {
    await page.waitForSelector("#ecran-intrus [data-mot]:not([disabled])");
    const mots = await page.$$eval("#ecran-intrus [data-mot]", t => t.map(x => x.dataset.mot));
    const q = Q.find(x => x.mots.slice().sort().join() === mots.slice().sort().join());
    const choix = fautes.includes(k) ? mots.find(m => m !== q.intrus) : q.intrus;
    await page.click(`#ecran-intrus [data-mot="${choix}"]`);
    await page.waitForSelector("#intrus-suite");
    if (k === 0) {
      await page.waitForTimeout(1200);
      ok(/Question 1/.test(await page.locator("#ecran-intrus .palier").innerText()), "pas d'enchaînement automatique : la question reste affichée tant qu'on ne touche pas « Question suivante »");
      const r = await page.locator(".retour-intrus").innerText();
      ok((fautes.includes(0) ? /Pas tout à fait/.test(r) : /Bien vu/.test(r)) && r.includes(q.critere) && r.includes(q.explication), "retour immédiat : verdict, critère et explication de la banque");
      ok(await page.locator(".tile.im.juste").count() === 1 && /✓/.test(await page.locator(".tile.im.juste").innerText()), "le bon mot est marqué ✓ (pas seulement en couleur)");
      ok(await page.locator("#ecran-intrus [data-mot]:not([disabled])").count() === 0, "après la réponse, les mots ne sont plus cliquables");
    }
    if (k === 2 && fautes.includes(2)) ok(await page.locator(".tile.im.faux").count() === 1 && /✗/.test(await page.locator(".tile.im.faux").innerText()), "mauvaise réponse : le mot choisi est marqué ✗ et l'intrus ✓");
    await page.click("#intrus-suite");
  }
  await page.waitForSelector("#intrus-rejouer");
}

(async () => {
  const srv = spawn("node", [path.join(__dirname, "serveur_test.js")], { env: { ...process.env, PORT: String(PORT) }, stdio: "inherit" });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch();
  const erreurs = [];
  const nouveau = async (device = devices["iPhone 13"]) => {
    const ctx = await browser.newContext({ ...device, permissions: ["clipboard-read", "clipboard-write"] });
    await ctx.addInitScript(() => { try { localStorage.setItem("quotidien_regles_vues", "true"); localStorage.setItem("quotidien_regles_vues_demo", "true"); } catch (e) {} });
    const page = await ctx.newPage();
    page.on("pageerror", e => erreurs.push(String(e)));
    page.on("console", m => { if (m.type() === "error" && !/401/.test(m.text())) erreurs.push(m.text()); });
    return { ctx, page };
  };
  require("fs").mkdirSync(CAPT, { recursive: true });
  try {
    const cal = {}; G.forEach((g, i) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + i); cal[new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d)] = g.id; });
    const s = await rpc("a_creer_session", { code: "code-test", p_nom: "Jeux", p_calendrier: cal });
    const [{ id: A }] = await rpc("a_creer_participants", { code: "code-test", p_session: s.id, n: 1 });
    const { page } = await nouveau();

    console.log("1. Navigation : 5 onglets");
    await page.goto(`${BASE}/?p=${A}`); await page.waitForSelector("#carte-jour");
    const libs = await page.$$eval("#nav-bas button", b => b.map(x => x.textContent.replace(/\s+/g, " ").trim()));
    ok(libs.join("|") === "🏠Accueil|📅Quotidien|🎮Jeux|🏆Progression|📊Stats", "barre du bas : " + libs.join(" · "));
    await page.screenshot({ path: path.join(CAPT, "jeux_0_accueil.png"), fullPage: true });

    console.log("2. Onglet Jeux");
    await page.click('#nav-bas [data-ecran="jeux"]'); await page.waitForSelector("#ecran-jeux:not(.hidden)");
    const tj = await page.locator("#ecran-jeux").innerText();
    ok(/Défis rapides/.test(tj) && /Pour progresser/.test(tj) && /Pour se challenger/.test(tj), "trois sections : Défis rapides, Pour progresser, Pour se challenger");
    for (const id of ["defi", "intrus", "entr", "sans-erreur", "records"]) {
      const c = page.locator(`#jeu-${id}`);
      ok(await c.count() === 1 && await page.locator(`#jeu-${id}-btn`).isVisible() && /⏱|📱/.test(await c.innerText()), `carte « ${(await c.locator("h3").innerText())} » : description, indications et bouton d'action`);
    }
    ok(/0\/20/.test(await page.locator("#jeu-sans-erreur").innerText()) && /Pas encore de record/.test(await page.locator("#jeu-defi").innerText()), "états réels : aucun faux score (0/20 sans erreur, pas encore de record)");
    ok(await page.locator(".rappel-jour").isVisible(), "rappel de la grille du jour, pas encore jouée");
    ok(await page.locator('#nav-bas [data-ecran="jeux"].on').count() === 1, "onglet Jeux allumé");
    await page.screenshot({ path: path.join(CAPT, "jeux_1_onglet.png"), fullPage: true });

    console.log("3. Le mot intrus : une série de 5 questions");
    await page.click("#jeu-intrus-btn"); await page.waitForSelector("#intrus-go");
    ok(await page.locator('#nav-bas [data-ecran="jeux"].on').count() === 1, "le mot intrus reste rattaché à l'onglet Jeux");
    await page.click("#intrus-go");
    await page.waitForSelector("#ecran-intrus [data-mot]");
    ok(await page.locator("#ecran-intrus [data-mot]").count() === 4 && /Question 1/.test(await page.locator("#ecran-intrus .palier").innerText()), "question 1 : 4 mots");
    await page.screenshot({ path: path.join(CAPT, "jeux_2_question.png") });
    await jouerIntrus(page, [2]);
    const fin = await page.locator("#ecran-intrus").innerText();
    ok(/4\/5/.test(fin) && /Nouveau record/.test(fin), "écran de fin : 4/5 et nouveau record");
    ok(await page.locator(".expl-intrus").count() === 5 && await page.locator(".expl-intrus.faux").count() === 1, "les 5 explications, la question ratée signalée");
    ok(await page.locator("#intrus-rejouer").isVisible() && await page.locator('#ecran-intrus [data-ecran="jeux"]').isVisible(), "boutons : Rejouer et Autres jeux (pas de nouvelle partie automatique)");
    await page.screenshot({ path: path.join(CAPT, "jeux_3_fin_intrus.png"), fullPage: true });

    console.log("4. Partage volontaire du score");
    await page.click("#intrus-partager"); await page.waitForTimeout(400);
    const presse = await page.evaluate(() => navigator.clipboard.readText());
    ok(/Le mot intrus : 4\/5/.test(presse) && /✅✅❌✅✅/.test(presse) && !/http/.test(presse), "texte copié : score et résultats, sans lien (un lien inscrirait un ami au test) → " + presse.replace(/\n/g, " / "));
    ok(/copié/.test(await page.locator("#intrus-partage-ok").innerText()), "retour visuel « Score copié »");

    console.log("5. Données du test non contaminées");
    await page.waitForTimeout(500);
    const ev = (await db()).evenements.filter(e => e.participant_id === A);
    const mj = ev.filter(e => e.type === "minijeu");
    ok(mj.length > 0 && mj.every(e => e.donnees.jeu === "intrus" && e.grille === null), "événements du mot intrus : type « minijeu », jeu « intrus », sans grille");
    ok([...new Set(mj.map(e => e.donnees.action))].sort().join() === "debut,fin,ouverture,partage", "actions tracées : ouverture, début, fin, partage → " + [...new Set(mj.map(e => e.donnees.action))].join());
    ok(mj.find(e => e.donnees.action === "fin").donnees.score === 4, "fin : score 4 enregistré");
    ok(ev.filter(e => TYPES_TEST.includes(e.type)).length === 0, "aucun événement du test (début, fin, partage…) : la série n'est pas comptée comme une grille");
    const xp = await page.evaluate((pid) => localStorage.getItem("quotidien_journal_" + pid), A);
    ok(xp === null, "aucune XP : le journal de progression reste vide");

    console.log("6. Records visibles partout");
    await page.click('#ecran-intrus [data-ecran="jeux"]'); await page.waitForSelector("#ecran-jeux:not(.hidden)");
    ok(/4\/5/.test(await page.locator("#jeu-intrus").innerText()) && /4\/5/.test(await page.locator("#jeu-records").innerText()), "onglet Jeux : meilleur score 4/5 (carte et records)");
    await page.click('#nav-bas [data-ecran="accueil"]'); await page.waitForSelector("#carte-intrus");
    ok(/Meilleur : 4\/5/.test(await page.locator("#carte-intrus").innerText()), "accueil : tuile « Meilleur : 4/5 »");
    ok(/Le mot intrus/.test(await page.locator("#accueil-recents").innerText()), "accueil : la série apparaît dans « Tes derniers résultats »");
    await page.click('#nav-bas [data-ecran="stats"]'); await page.waitForSelector("#ecran-stats:not(.hidden)");
    ok(/le mot intrus/i.test(await page.locator("#ecran-stats").innerText()) && /80 %/.test(await page.locator("#ecran-stats").innerText()), "stats : rubrique mot intrus (80 % de bonnes réponses)");

    console.log("7. Bouton retour du téléphone");
    await page.click('#nav-bas [data-ecran="jeux"]'); await page.waitForSelector("#ecran-jeux:not(.hidden)");
    await page.click("#jeu-intrus-btn"); await page.waitForSelector("#intrus-go");
    await page.goBack(); await page.waitForSelector("#ecran-jeux:not(.hidden)");
    ok(page.url().includes("?p=" + A), "retour depuis le mot intrus → onglet Jeux (on reste dans Quotidien)");
    await page.goBack(); await page.waitForSelector("#ecran-accueil:not(.hidden)");
    ok(page.url().includes("?p=" + A), "retour depuis Jeux → accueil");
    await page.click('#nav-bas [data-ecran="jeux"]'); await page.click("#jeu-entr-btn"); await page.waitForSelector("#ecran-entrainement:not(.hidden)");
    await page.click("#btn-entr-continuer"); await page.waitForSelector("#plateau .tile");
    await page.locator("#plateau .tile").first().click(); await page.waitForTimeout(200);
    await page.goBack(); await page.waitForSelector("#ecran-entrainement:not(.hidden)");
    ok(/Reprendre l'exercice 1/.test(await page.locator("#btn-entr-continuer").innerText()), "retour pendant un exercice → parcours d'entraînement, exercice sauvegardé (« Reprendre »)");
    await page.goBack(); await page.waitForSelector("#ecran-jeux:not(.hidden)");
    await page.goBack(); await page.waitForSelector("#ecran-accueil:not(.hidden)");
    await page.goBack(); await page.waitForTimeout(500);
    ok(!page.url().includes("?p="), "retour depuis l'accueil → on quitte bien l'application (pas de piège)");

    console.log("8. Défi express : fin de partie");
    await page.goto(`${BASE}/?p=${A}`); await page.waitForSelector("#carte-jour");
    await page.click('#nav-bas [data-ecran="jeux"]'); await page.click("#jeu-defi-btn"); await page.click("#defi-solo");
    await page.waitForSelector("#defi-plateau [data-mot]");
    await page.goBack(); await page.waitForTimeout(400);
    ok(await page.locator("#ecran-defi-jeu:not(.hidden)").count() === 1, "retour pendant une partie de Défi : la partie continue (on quitte avec « Abandonner »)");
    await page.click("#defi-abandon"); await page.click("#defi-abandon"); await page.waitForSelector("#fin-rejouer");
    ok(await page.locator("#fin-partager").isVisible() && await page.locator('#ecran-defi [data-ecran="jeux"]').isVisible(), "fin du Défi : « Partager mon score » et « Autres jeux »");
    await page.click("#fin-partager"); await page.waitForTimeout(300);
    ok(/Défi express : 0 palier/.test(await page.evaluate(() => navigator.clipboard.readText())), "partage du score du Défi (copie)");

    console.log("9. Démo");
    const { page: pd } = await nouveau();
    await pd.goto(`${BASE}/?demo=1`); await pd.waitForSelector("#carte-intrus");
    const avant = (await db()).evenements.length;
    await pd.click("#btn-intrus"); await pd.click("#intrus-go"); await jouerIntrus(pd, []);
    ok(/5\/5/.test(await pd.locator("#ecran-intrus").innerText()) && /Œil de lynx/.test(await pd.locator("#ecran-intrus").innerText()), "démo : 5/5 et trophée « Œil de lynx »");
    await pd.click("#intrus-partager"); await pd.waitForTimeout(300);
    ok(/\?demo=1/.test(await pd.evaluate(() => navigator.clipboard.readText())), "démo : le partage contient le lien de la démo");
    ok((await db()).evenements.length === avant, "démo : aucun événement envoyé");
    await pd.click('#nav-bas [data-ecran="progression"]'); await pd.waitForSelector("#ecran-progression:not(.hidden)");
    ok(/le mot intrus/i.test(await pd.locator("#ecran-progression").innerText()) && await pd.locator("#ecran-progression .badge.obtenu").count() >= 1, "Progression : trophée du mot intrus obtenu");

    console.log("10. Petit écran (iPhone SE)");
    const { page: ps } = await nouveau(devices["iPhone SE"]);
    await ps.goto(`${BASE}/?demo=1`); await ps.waitForSelector("#carte-intrus");
    const debord = () => ps.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    ok(!(await debord()), "accueil : aucun défilement horizontal");
    const coupes = await ps.$$eval("#nav-bas button", b => b.filter(x => x.scrollWidth > x.clientWidth + 1).length);
    ok(coupes === 0, "barre du bas : aucun libellé coupé");
    const tailles = await ps.$$eval("#nav-bas button, .mini-zone", b => b.map(x => Math.round(Math.min(x.getBoundingClientRect().width, x.getBoundingClientRect().height))));
    ok(tailles.every(t => t >= 44), "zones tactiles ≥ 44 px (barre du bas et tuiles) : " + tailles.join(", "));
    await ps.click('#nav-bas [data-ecran="jeux"]'); await ps.waitForSelector("#ecran-jeux:not(.hidden)");
    ok(!(await debord()), "onglet Jeux : aucun défilement horizontal");
    await ps.screenshot({ path: path.join(CAPT, "jeux_4_se.png"), fullPage: true });
    await ps.click("#jeu-intrus-btn"); await ps.click("#intrus-go"); await ps.waitForSelector("#ecran-intrus [data-mot]");
    ok(!(await debord()), "question du mot intrus : aucun défilement horizontal");
    const mots = await ps.$$eval("#ecran-intrus [data-mot]", t => t.map(x => x.scrollWidth <= x.clientWidth + 1));
    ok(mots.every(Boolean), "les 4 mots tiennent dans leur case");
    await ps.screenshot({ path: path.join(CAPT, "jeux_5_question_se.png") });

    ok(erreurs.length === 0, "aucune erreur JavaScript " + erreurs.join(" | "));
  } catch (e) { console.error(e); echecs++; }
  finally {
    await browser.close(); srv.kill();
    console.log(echecs ? `${echecs} échec(s)` : "Navigation, Jeux et mot intrus : tous les tests passent.");
    process.exit(echecs ? 1 : 0);
  }
})();
