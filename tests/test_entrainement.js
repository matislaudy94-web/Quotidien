// Tests de bout en bout du MODE ENTRAÎNEMENT (Playwright, Chromium en émulation iPhone).
// Lancer : node tests/test_entrainement.js   (démarre lui-même le serveur de test local)
// Couvre les 18 scénarios du cahier des charges, dont la non-contamination des mesures du test.
const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const PORT = 8768, BASE = `http://localhost:${PORT}`;
const G = require(path.join(__dirname, "..", "grilles.json"));
const E = require(path.join(__dirname, "..", "entrainement.json")).grilles;
const CAPT = process.env.CAPTURES || path.join(__dirname, "..", "captures_tests");
let echecs = 0;
const ok = (cond, msg) => { console.log((cond ? "  OK   " : "  ÉCHEC ") + msg); if (!cond) echecs++; };
const db = async () => (await fetch(BASE + "/__test/db")).json();
const rpc = async (nom, params) => (await fetch(`${BASE}/rest/v1/rpc/${nom}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) })).json();
const jourParis = () => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());

// Joue une grille : `faux` essais faux (combinaisons distinctes), puis les groupes demandés.
async function jouer(page, g, groupes, faux = 0) {
  for (let i = 0; i < faux; i++) {
    const a = g.groupes[i % 4].mots, b = g.groupes[(i + 1) % 4].mots;
    for (const m of [a[0], a[1], b[i % 4], b[(i + 1) % 4]]) await page.getByRole("button", { name: m, exact: true }).click();
    await page.getByRole("button", { name: "Valider" }).click();
    if (i < faux - 1 || groupes.length) await page.getByRole("button", { name: "Désélectionner" }).click();
  }
  for (const gi of groupes) {
    for (const m of g.groupes[gi].mots) await page.getByRole("button", { name: m, exact: true }).click();
    await page.getByRole("button", { name: "Valider" }).click();
    await page.waitForTimeout(450); // envol des cartes
  }
}
const motsPlateau = (page) => page.$$eval("#plateau .tile", t => t.map(x => x.textContent).sort());
const memes = (a, b) => a.slice().sort().join() === b.slice().sort().join();
const xpDe = (page, pid, id) => page.evaluate(([pid, id]) => { const P = window.QuotidienProgression; const c = P.calculer(P.lireJournal(pid), "2026-01-01"); const d = c.detailParties.find(x => x.grille === id); return { xp: c.xp, partie: d ? d.xp : null }; }, [pid, id]);

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
    // Session : grille 1 aujourd'hui
    const cal = {}; G.forEach((g, i) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + i); cal[new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d)] = g.id; });
    const s = await rpc("a_creer_session", { code: "code-test", p_nom: "Entraînement", p_calendrier: cal });
    const [{ id: A }] = await rpc("a_creer_participants", { code: "code-test", p_session: s.id, n: 1 });
    const { page } = await nouveau();

    console.log("1. Accueil : grille du jour ET mode entraînement visibles");
    await page.goto(`${BASE}/?p=${A}`); await page.waitForSelector("#btn-jouer");
    ok(await page.locator("#carte-jour").isVisible() && await page.locator("#carte-entr").isVisible(), "deux cartes : « La grille du jour » et « Mode entraînement »");
    ok(/Une nouvelle grille chaque jour/.test(await page.locator("#carte-jour").innerText()) && /Entraînement/.test(await page.locator("#carte-entr").innerText()) && /exercices à enchaîner/.test(await page.locator("#carte-entr").innerText()), "les deux modes sont expliqués en une phrase");
    ok(await page.locator("#mini-jeux").isVisible() && await page.evaluate(() => document.getElementById("mini-jeux").getBoundingClientRect().top > document.getElementById("carte-jour").getBoundingClientRect().top), "les mini-jeux sont mis en avant juste sous la grille du jour");
    ok(await page.locator("#btn-jouer.primary").count() === 1 && await page.locator("#btn-entr.primary").count() === 0, "tant que la grille du jour n'est pas jouée, elle reste le bouton principal");

    console.log("2-3. Grille du jour : comportement inchangé");
    await page.click("#btn-jouer"); await page.waitForSelector(".tile");
    ok(memes(await motsPlateau(page), G[0].groupes.flatMap(g => g.mots)), "la grille du jour est la grille 1 du calendrier");
    ok(/Grille du/.test(await page.locator("#date-grille").innerText()), "en-tête « Grille du … » (pas d'étiquette entraînement)");
    await jouer(page, G[0], [0, 1, 2, 3], 1);
    await page.waitForSelector("#fin:not(.hidden)", { timeout: 5000 });
    ok(await page.locator("#questionnaire-panel").isVisible() && await page.locator("#btn-partager").isVisible(), "écran de fin du jour : questionnaire et invitation présents");
    ok(await page.locator("#continuer-entr").isVisible() && /S'entraîner/.test(await page.locator("#continuer-entr").innerText()), "proposition « S'entraîner » placée après le questionnaire");
    const pos = await page.evaluate(() => [document.getElementById("questionnaire-panel").getBoundingClientRect().top, document.getElementById("continuer-entr").getBoundingClientRect().top]);
    ok(pos[0] < pos[1], "le questionnaire vient avant la proposition d'entraînement");
    const xpJour = (await xpDe(page, A, "g1")).partie;
    ok(xpJour === 50, "grille du jour facile résolue avec 1 erreur : 50 XP (barème inchangé) → " + xpJour);

    console.log("4. Ouvrir le mode entraînement");
    await page.click('#nav-bas [data-ecran="accueil"]'); await page.waitForSelector("#btn-entr");
    ok(await page.locator("#btn-jouer.primary").count() === 0 && await page.locator("#btn-entr").isVisible(), "grille du jour terminée : « Voir mon résultat » n'est plus le bouton principal, l'entraînement est à portée de main");
    await page.click("#btn-entr"); await page.waitForSelector("#ecran-entrainement:not(.hidden)");
    ok(/Jouer l'exercice 1/.test(await page.locator("#btn-entr-continuer").innerText()), "écran entraînement : « Jouer l'exercice 1 »");
    ok(await page.locator(".exo:not([disabled])").count() === 1 && await page.locator(".exo.verrouille").count() === E.length - 1, "seul l'exercice 1 est ouvert, les autres verrouillés");
    ok(await page.locator(".chapitre").count() === 5 && await page.locator(".chapitre .astuce").count() === 5, "5 chapitres, chacun avec une astuce");
    await page.screenshot({ path: path.join(CAPT, "entr_1_parcours.png"), fullPage: true });

    console.log("5. Réussir un exercice");
    await page.click("#btn-entr-continuer"); await page.waitForSelector(".tile");
    ok(/Entraînement/i.test(await page.locator("#date-grille").innerText()) && /1 \/ 20/.test(await page.locator("#date-grille").innerText()), "en-tête : « Entraînement · Exercice 1 / 20 »");
    ok(/Chapitre 1/.test(await page.locator("#tagline").innerText()), "le chapitre est indiqué sous l'en-tête");
    ok(memes(await motsPlateau(page), E[0].groupes.flatMap(g => g.mots)), "les 16 mots sont ceux de l'exercice 1");
    await page.screenshot({ path: path.join(CAPT, "entr_2_jeu.png") });
    await jouer(page, E[0], [0, 1, 2, 3]);
    await page.waitForSelector("#fin:not(.hidden)", { timeout: 5000 });
    const finTxt = await page.locator("#fin").innerText();
    ok(/Bravo/i.test(finTxt) && /0\s*Erreur/i.test(finTxt) && /Temps/i.test(finTxt), "écran de réussite : résultat, erreurs, temps");
    ok(await page.locator("#solution .expl").count() === 4, "les explications des 4 groupes sont affichées");
    ok(/\+\d+\s*XP/.test(await page.locator("#recompenses").innerText()), "XP gagnée affichée : " + (await page.locator("#recompenses .gain-xp").innerText()).replace(/\s+/g, " "));
    const x1 = await xpDe(page, A, "e01");
    ok(x1.partie === 75, "exercice facile, 1re tentative, sans erreur : 50 + 25 = 75 XP → " + x1.partie);
    ok(!(await page.locator("#questionnaire-panel").isVisible()) && !(await page.locator("#btn-partager").count() && await page.locator("#btn-partager").isVisible()), "pas de questionnaire ni d'invitation en entraînement");
    ok(await page.locator("#entr-suivant").isVisible() && await page.locator("#entr-revoir").isVisible() && await page.locator("#entr-parcours2").isVisible(), "boutons : Exercice suivant, Revoir les solutions, Retour à l'entraînement");
    await page.screenshot({ path: path.join(CAPT, "entr_3_reussite.png"), fullPage: true });

    console.log("6-7. Exercice suivant");
    await page.click("#entr-suivant"); await page.waitForSelector(".tile");
    ok(/2 \/ 20/.test(await page.locator("#date-grille").innerText()) && memes(await motsPlateau(page), E[1].groupes.flatMap(g => g.mots)), "on arrive sur l'exercice 2, avec ses 16 mots");
    ok(await page.locator("#dlg-regles[open]").count() === 0, "aucune boîte de dialogue ne bloque l'enchaînement");

    console.log("8. Échouer après quatre erreurs");
    await jouer(page, E[1], [], 4);
    await page.waitForSelector("#fin:not(.hidden)", { timeout: 5000 });
    ok(/Pas cette fois/i.test(await page.locator("#resume").innerText()), "écran d'échec « Pas cette fois »");
    ok(await page.locator("#entr-reessayer").isVisible() && await page.locator("#entr-passer").isVisible() && await page.locator("#entr-solution").count() === 0, "deux choix : Réessayer, Passer (plus de bouton « Comprendre la solution »)");
    ok(!(await page.locator("#solution").isVisible()) && /La solution reste cachée/.test(await page.locator("#resume").innerText()), "la solution n'est PAS révélée après un échec");
    ok(!/XP/.test(await page.locator("#recompenses").innerText()), "aucune XP pour un échec");
    ok((await xpDe(page, A, "e02")).partie === null, "l'échec n'entre pas dans le journal de progression");
    await page.screenshot({ path: path.join(CAPT, "entr_4_echec.png"), fullPage: true });

    console.log("9-10. Réessayer");
    const xpAvantRetry = (await xpDe(page, A, "x")).xp;
    await page.click("#entr-reessayer"); await page.waitForSelector(".tile");
    ok(await page.locator(".tile").count() === 16 && await page.locator("#trouves .group").count() === 0, "16 mots remis, aucun groupe trouvé");
    ok(await page.locator(".tile.sel").count() === 0 && (await page.locator("#nb-groupes").innerText()) === "0/4", "sélection effacée, 0/4");
    ok(await page.locator("#points .coeur.used").count() === 0, "4 cœurs : erreurs remises à zéro");
    await page.waitForTimeout(1100);
    ok(/⏱ 0:0[0-9]/.test(await page.locator("#chrono").innerText()), "chronomètre reparti de zéro : " + await page.locator("#chrono").innerText());
    const meta = await page.evaluate((pid) => JSON.parse(localStorage.getItem("quotidien_entr_meta_" + pid)), A);
    ok(meta.e02.tentatives === 2, "tentative n° 2 enregistrée (l'ancienne reste distinguable)");
    ok((await xpDe(page, A, "x")).xp === xpAvantRetry, "réessayer ne touche pas à la progression générale");
    await jouer(page, E[1], [0, 1, 2, 3]);
    await page.waitForSelector("#fin:not(.hidden)", { timeout: 5000 });
    const x2 = await xpDe(page, A, "e02");
    ok(x2.partie === 50, "réussite à la 2e tentative, sans erreur : 50 XP, PAS de bonus sans faute → " + x2.partie);
    ok(/tentative 2/.test(await page.locator("#resume").innerText()), "l'écran indique « tentative 2 »");

    console.log("11. Échec avec un groupe trouvé : seul ce groupe est rappelé, la solution reste cachée");
    await page.click("#entr-suivant"); await page.waitForSelector(".tile");
    await jouer(page, E[2], [0]);
    for (let i = 0; i < 4; i++) { const x = E[2].groupes[1 + i % 3].mots, y = E[2].groupes[1 + (i + 1) % 3].mots;
      for (const m of [x[0], x[1], y[i % 4], y[(i + 1) % 4]]) await page.getByRole("button", { name: m, exact: true }).click();
      await page.getByRole("button", { name: "Valider" }).click(); if (i < 3) await page.getByRole("button", { name: "Désélectionner" }).click(); }
    await page.waitForSelector("#entr-reessayer");
    ok(await page.locator("#solution .group").count() === 1 && /Tes groupes trouvés/.test(await page.locator("#solution").innerText()), "seul le groupe trouvé est rappelé");
    const txt11 = (await page.locator("#fin").innerText()).toUpperCase();
    ok(E[2].groupes.slice(1).every(g => !txt11.includes(g.categorie.toUpperCase())), "les 3 autres catégories restent secrètes");
    await page.click("#entr-reessayer"); await page.waitForSelector(".tile");
    await jouer(page, E[2], [0, 1, 2, 3]);
    await page.waitForSelector("#fin:not(.hidden)", { timeout: 5000 });
    ok(await page.locator("#solution .group").count() === 4 && /Les explications/.test(await page.locator("#solution").innerText()), "exercice réussi : la solution complète et les explications s'affichent");
    ok((await xpDe(page, A, "e03")).partie > 0, "réussite à la 2e tentative : XP créditée (la solution n'avait pas été montrée)");

    console.log("12. Passer à la suite sans récompense");
    await page.click("#entr-suivant"); await page.waitForSelector(".tile");
    await jouer(page, E[3], [], 4);
    await page.waitForSelector("#entr-passer");
    await page.click("#entr-passer"); await page.waitForSelector(".tile");
    ok(/5 \/ 20/.test(await page.locator("#date-grille").innerText()), "« Passer » ouvre l'exercice 5");
    ok((await xpDe(page, A, "e04")).partie === null, "exercice passé : aucune XP");

    console.log("14 (reprise). Quitter en cours de partie, recharger, reprendre");
    await jouer(page, E[4], [0]);
    for (const m of [E[4].groupes[1].mots[0], E[4].groupes[1].mots[1], E[4].groupes[2].mots[0], E[4].groupes[2].mots[1]]) await page.getByRole("button", { name: m, exact: true }).click();
    await page.getByRole("button", { name: "Valider" }).click();
    await page.getByRole("button", { name: "Désélectionner" }).click();
    await page.getByRole("button", { name: E[4].groupes[1].mots[0], exact: true }).click();
    await page.getByRole("button", { name: E[4].groupes[1].mots[1], exact: true }).click();
    const tAvant = await page.evaluate(() => document.getElementById("chrono").textContent);
    await page.click("#btn-quitter"); await page.waitForSelector("#ecran-entrainement:not(.hidden)");
    ok(/Reprendre l'exercice 5/.test(await page.locator("#btn-entr-continuer").innerText()), "après « ← » : retour au parcours, « Reprendre l'exercice 5 »");
    ok(await page.locator('.exo.passe[data-exo="e04"]').count() === 1, "l'exercice 4 apparaît comme « passé », rejouable plus tard");
    await page.waitForTimeout(3000); // temps passé hors de la partie
    await page.reload(); await page.waitForSelector("#btn-entr");
    await page.click("#btn-entr"); await page.click("#btn-entr-continuer"); await page.waitForSelector(".tile");
    ok(await page.locator("#trouves .group").count() === 1 && await page.locator("#points .coeur.used").count() === 1, "après rechargement : 1 groupe trouvé et 1 erreur conservés");
    ok(await page.locator(".tile.sel").count() === 2, "les 2 mots sélectionnés sont conservés");
    const tApres = await page.evaluate(() => document.getElementById("chrono").textContent);
    const sec = (t) => { const m = t.match(/(\d+):(\d+)/); return +m[1] * 60 + +m[2]; };
    ok(sec(tApres) - sec(tAvant) <= 1, `le chronomètre n'a pas compté le temps hors partie (${tAvant.trim()} → ${tApres.trim()})`);

    console.log("13. Aucune récompense créditée deux fois");
    const xpTotal = (await xpDe(page, A, "x")).xp;
    await page.click("#btn-quitter"); await page.waitForSelector(".exo");
    await page.click('[data-exo="e01"]'); await page.waitForSelector(".tile");
    await jouer(page, E[0], [0, 1, 2, 3]);
    await page.waitForSelector("#fin:not(.hidden)", { timeout: 5000 });
    ok(/déjà réussi/.test(await page.locator("#recompenses").innerText()), "rejouer l'exercice 1 : « déjà réussi, pas d'XP »");
    await page.click("#entr-suivant").catch(() => {}); await page.waitForSelector(".tile");
    ok((await xpDe(page, A, "x")).xp === xpTotal, "XP totale inchangée après avoir rejoué et cliqué sur « Exercice suivant » (" + xpTotal + ")");
    const journalE = await page.evaluate((pid) => JSON.parse(localStorage.getItem("quotidien_journal_" + pid)).map(e => e.grille + (e.mode ? ":" + e.mode : "")), A);
    ok(journalE.join() === "g1,e01:entrainement,e02:entrainement,e03:entrainement", "journal : g1 (jour), e01, e02 et e03 (entraînement), une seule fois chacun → " + journalE.join());

    console.log("14. Recharger : progression conservée");
    await page.reload(); await page.waitForSelector("#carte-entr");
    ok(/3\/20 réussis/.test(await page.locator("#carte-entr").innerText()), "après rechargement : 3/20 réussis (e01, e02, e03) → " + (await page.locator("#carte-entr .chiffre").innerText()).replace(/\s+/g, " "));
    ok(/Terminée/.test(await page.locator("#carte-jour").innerText()), "la grille du jour reste « Terminée »");

    console.log("15. Statistiques séparées");
    await page.click('#nav-bas [data-ecran="stats"]'); await page.waitForSelector("#ecran-stats:not(.hidden)");
    const st = await page.locator("#ecran-stats").innerText();
    ok(/Grilles du jour/i.test(st) && /Entraînement/i.test(st) && /Progression/i.test(st), "trois rubriques : grilles du jour, entraînement, progression");
    ok(/1\s*Grilles terminées/i.test(st) && /100 %/.test(st), "grilles du jour : 1 terminée, 100 % (l'entraînement n'entre pas dans le taux)");
    ok(/3\/20\s*Exercices réussis/i.test(st) && /3 avec XP/.test(st) && /1\s*Exercices passés/i.test(st), "entraînement : 3/20 réussis dont 3 avec XP, 1 passé");
    await page.screenshot({ path: path.join(CAPT, "entr_5_stats.png"), fullPage: true });

    console.log("17. Données de l'expérimentation non contaminées");
    const d = await db();
    const ev = d.evenements.filter(e => e.participant_id === A);
    const typesTest = ["debut", "essai", "fin", "indice", "recompense", "demande_suivante", "questionnaire", "partage"];
    ok(ev.filter(e => typesTest.includes(e.type)).every(e => e.grille === "g1"), "tous les événements du test portent sur la grille du jour (g1), aucun sur un exercice");
    ok(ev.filter(e => e.type === "fin").length === 1 && ev.filter(e => e.type === "debut").length === 1, "une seule partie au sens du test (1 début, 1 fin)");
    const visites = ev.filter(e => e.type === "visite");
    ok(visites.length === 3 && visites.every(v => ["premiere_visite", "revisite_meme_jour"].includes(v.donnees.classe)), "visites : seulement les 3 chargements de page, aucune comptée comme retour spontané (" + visites.map(v => v.donnees.classe).join(", ") + ")");
    const tr = ev.filter(e => e.type === "entrainement");
    const actions = [...new Set(tr.map(e => e.donnees.action))].sort().join();
    ok(actions === "debut,fin,ouverture,passe", "traces d'entraînement séparées (type « entrainement ») : " + actions);
    ok(tr.filter(e => e.donnees.action === "fin" && e.donnees.gagne).every(e => /^e\d\d$/.test(e.grille)), "les fins d'exercice portent l'identifiant de l'exercice (e01…), jamais une grille du calendrier");
    ok(JSON.stringify(tr).length < 20000 && tr.length < 60, "volume raisonnable : " + tr.length + " traces d'entraînement");

    console.log("16. Mode démo indépendant");
    const { page: pd } = await nouveau();
    await pd.goto(`${BASE}/?demo=1`); await pd.waitForSelector("#btn-entr");
    ok(/0\/20 réussis/.test(await pd.locator("#carte-entr").innerText()), "démo : entraînement à 0/20, indépendant du participant");
    await pd.click("#btn-entr"); await pd.click("#btn-entr-continuer"); await pd.waitForSelector(".tile");
    await jouer(pd, E[0], [0, 1, 2, 3]);
    await pd.waitForSelector("#fin:not(.hidden)", { timeout: 5000 });
    ok((await xpDe(pd, "demo", "e01")).partie === 75, "démo : l'exercice 1 rapporte 75 XP au profil de démo");
    const d2 = await db();
    ok(d2.evenements.length === d.evenements.length, "démo : aucun événement envoyé au serveur");
    await pd.click('#nav-bas [data-ecran="accueil"]'); await pd.waitForSelector("#carte-grilles [data-grille]");
    ok(await pd.locator("#carte-grilles [data-grille]").count() >= 10 && /Démo|démonstration/i.test(await pd.locator("#carte-jour").innerText()), "démo : la grille de démonstration et son sélecteur sont toujours là");

    console.log("18. Petits écrans (iPhone SE)");
    const { page: pse } = await nouveau(devices["iPhone SE"]);
    await pse.goto(`${BASE}/?demo=1`); await pse.waitForSelector("#btn-entr");
    await pse.click("#btn-entr"); await pse.waitForSelector("#ecran-entrainement:not(.hidden)");
    ok(!(await pse.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), "écran entraînement : aucun défilement horizontal");
    const exo = await pse.locator("#ecran-entrainement .exo").first().boundingBox();
    ok(exo.height >= 44 && exo.width >= 44, `zones tactiles des exercices ≥ 44 px (${Math.round(exo.width)}×${Math.round(exo.height)})`);
    await pse.click("#btn-entr-continuer"); await pse.waitForSelector(".tile");
    const vis = await pse.evaluate(() => { const r = document.getElementById("btn-valider").getBoundingClientRect(); return r.bottom <= window.innerHeight && r.top >= 0; });
    ok(vis, "en partie, le bouton Valider reste visible à l'écran");
    ok(!(await pse.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), "en partie : aucun défilement horizontal");
    await pse.screenshot({ path: path.join(CAPT, "entr_6_iphone_se.png") });
    await jouer(pse, E[0], [], 4);
    await pse.waitForSelector("#entr-reessayer");
    const boutons = await pse.evaluate(() => ["entr-reessayer", "entr-passer"].map(id => document.getElementById(id).getBoundingClientRect().height));
    ok(boutons.every(h => h >= 44), "boutons de l'écran d'échec ≥ 44 px de haut (" + boutons.map(Math.round).join(", ") + ")");

    ok(erreurs.length === 0, "aucune erreur JavaScript " + erreurs.join(" | "));
  } catch (e) {
    console.error(e); echecs++;
  } finally {
    await browser.close(); srv.kill();
    console.log(echecs ? `${echecs} échec(s)` : "Mode entraînement : tous les tests passent.");
    process.exit(echecs ? 1 : 0);
  }
})();
