// Démo : déblocage des grilles et enchaînement (node tests/test_demo_niveaux.js).
// Scénario signalé : rater une grille, la réussir ensuite → la grille suivante doit se débloquer et être proposée.
const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const PORT = 8773, BASE = `http://localhost:${PORT}`;
const G = require(path.join(__dirname, "..", "grilles.json"));
const V = require(path.join(__dirname, "..", "variantes.json"));
const versions = (i) => [G[i]].concat(V[G[i].id] || []);
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
    const perdreApres1 = async (g) => { for (const m of g.groupes[0].mots) await clic(m); await p.getByRole("button", { name: "Valider" }).click(); await p.waitForTimeout(450);
      for (let i = 0; i < 4; i++) { const a = g.groupes[1 + i % 3].mots, c = g.groupes[1 + (i + 1) % 3].mots;
        for (const m of [a[0], a[1], c[i % 4], c[(i + 1) % 4]]) await clic(m); await p.getByRole("button", { name: "Valider" }).click(); if (i < 3) await p.getByRole("button", { name: "Désélectionner" }).click(); }
      await p.waitForSelector("#fin:not(.hidden)"); };
    const textesFin = async () => (await p.locator("#fin").innerText()).toUpperCase();
    const plateau = async () => (await p.$$eval("#plateau .tile", t => t.map(x => x.textContent))).sort().join();
    const mots = (g) => g.groupes.flatMap(x => x.mots).sort().join();
    // Version de la grille i actuellement affichée (originale ou version de rechange)
    const affichee = async (i) => { const pl = await plateau(); return versions(i).find(v => mots(v) === pl); };

    console.log("1. Accueil de la démo : carte des grilles");
    await p.goto(`${BASE}/?demo=1`); await p.waitForSelector("#carte-grilles [data-grille]");
    ok(await p.locator('#carte-grilles [data-grille="g1"]:not([disabled])').count() === 1 && await p.locator('#carte-grilles [data-grille="g2"][disabled]').count() === 1, "grille 1 ouverte, grille 2 verrouillée");
    await p.screenshot({ path: path.join(CAPT, "demo_1_accueil.png"), fullPage: true });
    const ordre = await p.evaluate(() => ["carte-jour", "mini-jeux", "carte-grilles"].map(id => document.getElementById(id).getBoundingClientRect().top));
    ok(await p.locator("#mini-jeux").isVisible() && await p.locator("#carte-entr").isVisible() && await p.locator("#carte-defi").isVisible(), "accueil : les deux mini-jeux (Entraînement, Défi express) sont visibles");
    ok(ordre[0] < ordre[1] && ordre[1] < ordre[2], "les mini-jeux sont placés juste sous la grille, avant la carte des grilles");
    const hauts = await p.evaluate(() => ["carte-entr", "carte-defi"].map(id => Math.round(document.getElementById(id).getBoundingClientRect().top)));
    ok(hauts[0] === hauts[1], "les deux mini-jeux sont côte à côte");

    console.log("2. Réussir la grille 1 : la grille 2 est débloquée et proposée tout de suite");
    await p.click('#carte-grilles [data-grille="g1"]'); await p.waitForSelector(".tile");
    await gagner(G[0]);
    ok(/Grille 2 débloquée/.test(await p.locator("#suite-demo").innerText()), "« 🔓 Grille 2 débloquée ! » sous le résultat");
    const pos = await p.evaluate(() => { window.scrollTo(0, 0); return [document.getElementById("solution").getBoundingClientRect().top, window.innerHeight, document.getElementById("demo-suivante").getBoundingClientRect().top, document.getElementById("bloc-recompenses").getBoundingClientRect().top]; });
    ok(pos[0] < pos[1] * 0.75, `la solution commence dans le premier écran, sans descendre (à ${Math.round(pos[0])} px sur ${pos[1]})`);
    ok(pos[0] < pos[2] && pos[2] < pos[3], "ordre : résultat, solution, « Jouer la grille 2 », puis le détail de l'XP");
    ok(/\+\d+ XP/.test(await p.locator("#resume .gain-heros").innerText()), "l'XP gagnée reste annoncée dans le résultat");
    await p.waitForTimeout(400);
    ok(await p.locator("#cta-collant.visible").count() === 0, "au premier écran, aucun bandeau ne recouvre la solution");
    ok(await p.locator("#questionnaire-panel").isHidden(), "pas de questionnaire en démo (rien n'est envoyé)");
    await p.waitForTimeout(1800); await p.screenshot({ path: path.join(CAPT, "demo_2_fin_reussie.png"), fullPage: true });
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(600);
    ok(await p.locator("#cta-collant.visible").count() === 1 && /Grille 2 débloquée/.test(await p.locator("#cta-collant").innerText()), "en faisant défiler, le bouton « Jouer → » reste visible en bas d'écran");
    await p.screenshot({ path: path.join(CAPT, "demo_3_cta_collant.png") });
    await p.click("#cta-collant-btn"); await p.waitForSelector(".tile");
    ok(/Grille n° 2/.test(await p.locator("#date-grille").innerText()) && await plateau() === mots(G[1]), "un clic lance directement la grille 2");
    ok(await p.locator("#cta-collant.visible").count() === 0, "le bouton collant disparaît pendant la partie");

    console.log("3. Le cas signalé : rater la grille 2, puis la réussir — avec d'autres mots à chaque essai");
    const v1 = await affichee(1);
    ok(v1 && v1.id === "g2" && /version 1\/3/.test(await p.locator("#date-grille").innerText()), "premier essai de la grille 2 : version 1/3 (grille d'origine)");
    await perdre(v1);
    const tf1 = await textesFin();
    ok(await p.locator("#solution").isHidden() && v1.groupes.every(g => !tf1.includes(g.categorie.toUpperCase())), "échec sans groupe trouvé : aucune solution affichée (ni groupes, ni catégories)");
    ok(/La solution reste cachée/i.test(tf1), "le résultat dit que la solution reste cachée");
    ok(/Réessayer avec d'autres mots/.test(await p.locator("#suite-demo").innerText()) && /version 2\/3/.test(await p.locator("#suite-demo").innerText()) && !/débloquée/.test(await p.locator("#suite-demo").innerText()), "échec : « Réessayer avec d'autres mots (version 2/3) », rien de débloqué");
    await p.click("#demo-reessayer"); await p.waitForSelector(".tile");
    ok(await p.locator("#trouves .group").count() === 0 && await p.locator("#points .coeur.used").count() === 0, "nouvelle partie propre (0 groupe, 4 cœurs)");
    const v2 = await affichee(1);
    ok(v2 && v2.id === "g2b", "le réessai affiche la version 2 : " + (v2 ? v2.id : "inconnue"));
    const communs = v2 ? v2.groupes.flatMap(x => x.mots).filter(m => v1.groupes.flatMap(x => x.mots).includes(m)) : ["?"];
    ok(communs.length === 0, "aucun des 16 mots déjà vus : les groupes sont à refaire de zéro");
    ok(/version 2\/3/.test(await p.locator("#date-grille").innerText()), "l'en-tête indique « version 2/3 »");
    await perdre(v2);
    await p.click("#demo-reessayer"); await p.waitForSelector(".tile");
    const v3 = await affichee(1);
    ok(v3 && v3.id === "g2c", "deuxième échec : version 3 (" + (v3 ? v3.id : "?") + ")");
    await perdre(v3);
    await p.click("#demo-reessayer"); await p.waitForSelector(".tile");
    const v4 = await affichee(1);
    ok(v4 && v4.id === "g2", "troisième échec : retour à la version 1");
    await perdreApres1(v4);
    const tf4 = await textesFin();
    ok(await p.locator("#solution .group").count() === 1 && /Tes groupes trouvés/i.test(await p.locator("#solution h2").innerText()), "échec avec 1 groupe trouvé : seul ce groupe est rappelé (« Tes groupes trouvés »)");
    ok(v4.groupes.slice(1).every(g => !tf4.includes(g.categorie.toUpperCase()) && !g.mots.every(m => tf4.includes(m))), "les 3 groupes non trouvés restent secrets");
    await p.screenshot({ path: path.join(CAPT, "demo_5_echec_sans_solution.png"), fullPage: true });
    await p.click("#demo-reessayer"); await p.waitForSelector(".tile");
    const v5 = await affichee(1);
    await gagner(v5);
    ok(/Grille 3 débloquée/.test(await p.locator("#suite-demo").innerText()), "réussie après un échec : « Grille 3 débloquée ! »");
    ok(v5 && v5.id === "g2b", "réussite sur la version 2 : elle compte pour la grille 2");
    ok(await p.locator("#solution .group").count() === 4 && /La solution/.test(await p.locator("#solution h2").innerText()), "après une réussite, la solution complète et ses explications s'affichent");
    await p.click("#demo-suivante"); await p.waitForSelector(".tile");
    ok(await plateau() === mots(G[2]), "la grille 3 se lance (version 1)");
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
    ok(j.length === 3 && j.find(e => e.grille === "g2").gagne === false && !j.some(e => /g2[bc]/.test(e.grille)), "journal : g2 compte une seule fois (première partie), les versions de rechange ne créditent pas d'XP en plus");
    ok(erreurs.length === 0, "aucune erreur JavaScript " + erreurs.join(" | "));
  } catch (e) { console.error(e); echecs++; }
  finally {
    await browser.close(); srv.kill();
    console.log(echecs ? `${echecs} échec(s)` : "Démo, déblocage des grilles : tous les tests passent.");
    process.exit(echecs ? 1 : 0);
  }
})();
