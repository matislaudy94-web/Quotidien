// Démo : déblocage des grilles et enchaînement (node tests/test_demo_niveaux.js).
// Scénario signalé : rater une grille, la réussir ensuite → la grille suivante doit se débloquer et être proposée.
const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const PORT = 8773, BASE = `http://localhost:${PORT}`;
const G = require(path.join(__dirname, "..", "grilles.json"));
const CAPT = process.env.CAPTURES || path.join(__dirname, "..", "captures_tests");
let echecs = 0;
const ok = (c, m) => { console.log((c ? "  OK   " : "  ÉCHEC ") + m); if (!c) echecs++; };

(async () => {
  const srv = spawn("node", [path.join(__dirname, "serveur_test.js")], { env: { ...process.env, PORT: String(PORT) }, stdio: "inherit" });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch();
  const erreurs = [];
  require("fs").mkdirSync(CAPT, { recursive: true });
  try {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    await ctx.addInitScript(() => { try { localStorage.setItem("quotidien_regles_vues_demo", "true"); } catch (e) {} });
    const p = await ctx.newPage();
    p.on("pageerror", e => erreurs.push(String(e)));
    const clic = (m) => p.getByRole("button", { name: m, exact: true }).click();
    const gagner = async (g) => { for (const gr of g.groupes) { for (const m of gr.mots) await clic(m); await p.getByRole("button", { name: "Valider" }).click(); await p.waitForTimeout(450); } await p.waitForSelector("#fin:not(.hidden)"); };
    const perdre = async (g) => { for (let i = 0; i < 4; i++) { const a = g.groupes[i % 4].mots, c = g.groupes[(i + 1) % 4].mots;
      for (const m of [a[0], a[1], c[i % 4], c[(i + 1) % 4]]) await clic(m); await p.getByRole("button", { name: "Valider" }).click(); if (i < 3) await p.getByRole("button", { name: "Désélectionner" }).click(); } await p.waitForSelector("#fin:not(.hidden)"); };
    const plateau = async () => (await p.$$eval("#plateau .tile", t => t.map(x => x.textContent))).sort().join();
    const mots = (g) => g.groupes.flatMap(x => x.mots).sort().join();

    console.log("1. Accueil de la démo : carte des grilles");
    await p.goto(`${BASE}/?demo=1`); await p.waitForSelector("#carte-grilles [data-grille]");
    ok(await p.locator('#carte-grilles [data-grille="g1"]:not([disabled])').count() === 1 && await p.locator('#carte-grilles [data-grille="g2"][disabled]').count() === 1, "grille 1 ouverte, grille 2 verrouillée");
    await p.screenshot({ path: path.join(CAPT, "demo_1_accueil.png"), fullPage: true });

    console.log("2. Réussir la grille 1 : la grille 2 est débloquée et proposée tout de suite");
    await p.click('#carte-grilles [data-grille="g1"]'); await p.waitForSelector(".tile");
    await gagner(G[0]);
    ok(/Grille 2 débloquée/.test(await p.locator("#suite-demo").innerText()), "« 🔓 Grille 2 débloquée ! » sous le résultat");
    const pos = await p.evaluate(() => [document.getElementById("demo-suivante").getBoundingClientRect().top, document.getElementById("solution").getBoundingClientRect().top]);
    ok(pos[0] < pos[1], "le bouton « Jouer la grille 2 » est placé avant la solution");
    ok(await p.locator("#questionnaire-panel").isHidden(), "pas de questionnaire en démo (rien n'est envoyé)");
    await p.waitForTimeout(1800); await p.screenshot({ path: path.join(CAPT, "demo_2_fin_reussie.png"), fullPage: true });
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(600);
    ok(await p.locator("#cta-collant.visible").count() === 1 && /Grille 2 débloquée/.test(await p.locator("#cta-collant").innerText()), "en faisant défiler, le bouton « Jouer → » reste visible en bas d'écran");
    await p.screenshot({ path: path.join(CAPT, "demo_3_cta_collant.png") });
    await p.click("#cta-collant-btn"); await p.waitForSelector(".tile");
    ok(/Grille n° 2/.test(await p.locator("#date-grille").innerText()) && await plateau() === mots(G[1]), "un clic lance directement la grille 2");
    ok(await p.locator("#cta-collant.visible").count() === 0, "le bouton collant disparaît pendant la partie");

    console.log("3. Le cas signalé : rater la grille 2, puis la réussir");
    await perdre(G[1]);
    ok(/Réessayer la grille/.test(await p.locator("#suite-demo").innerText()) && !/débloquée/.test(await p.locator("#suite-demo").innerText()), "échec : « Réessayer la grille », rien de débloqué");
    await p.click("#demo-reessayer"); await p.waitForSelector(".tile");
    ok(await p.locator("#trouves .group").count() === 0 && await p.locator("#points .coeur.used").count() === 0, "nouvelle partie propre (0 groupe, 4 cœurs)");
    await gagner(G[1]);
    ok(/Grille 3 débloquée/.test(await p.locator("#suite-demo").innerText()), "réussie après un échec : « Grille 3 débloquée ! »");
    await p.click("#demo-suivante"); await p.waitForSelector(".tile");
    ok(await plateau() === mots(G[2]), "la grille 3 se lance");
    await gagner(G[2]);
    ok(/Grille 4 débloquée/.test(await p.locator("#suite-demo").innerText()), "grille 3 réussie → « Grille 4 débloquée ! »");

    console.log("4. Retour à l'accueil et rechargement");
    await p.reload(); await p.waitForSelector("#carte-grilles [data-grille]");
    ok(await p.locator('#carte-grilles [data-grille="g4"]:not([disabled])').count() === 1 && await p.locator('#carte-grilles [data-grille="g5"][disabled]').count() === 1, "après rechargement : grille 4 ouverte, grille 5 verrouillée");
    ok(await p.locator("#carte-grilles .exo.reussi").count() === 3, "3 grilles marquées réussies ✓");
    ok(/Grille 4/.test(await p.locator("#carte-jour h2").innerText()), "l'accueil propose directement la grille 4");
    await p.goto(`${BASE}/?demo=1&g=g2`); await p.waitForSelector("#btn-suivante");
    ok(/Jouer la grille 3/.test(await p.locator("#btn-suivante").innerText()) && /Réussie/.test(await p.locator("#carte-jour").innerText()), "sur une grille déjà réussie : « Réussie ✓ » et « Jouer la grille 3 → »");
    await p.goto(`${BASE}/?demo=1&g=g9`); await p.waitForSelector("#carte-jour");
    ok(!/Grille 9/.test(await p.locator("#carte-jour h2").innerText()), "une grille verrouillée demandée par l'adresse n'est pas ouverte");
    await p.goto(`${BASE}/?demo=1`); await p.waitForSelector("#carte-grilles [data-grille]");
    await p.screenshot({ path: path.join(CAPT, "demo_4_accueil_progression.png"), fullPage: true });

    console.log("5. XP inchangée par le déblocage (une seule fois par grille)");
    const j = await p.evaluate(() => JSON.parse(localStorage.getItem("quotidien_journal_demo")));
    ok(j.length === 3 && j.find(e => e.grille === "g2").gagne === false, "journal : g2 compte pour sa première partie (perdue), l'XP n'est pas créditée deux fois");
    ok(erreurs.length === 0, "aucune erreur JavaScript " + erreurs.join(" | "));
  } catch (e) { console.error(e); echecs++; }
  finally {
    await browser.close(); srv.kill();
    console.log(echecs ? `${echecs} échec(s)` : "Démo, déblocage des grilles : tous les tests passent.");
    process.exit(echecs ? 1 : 0);
  }
})();
