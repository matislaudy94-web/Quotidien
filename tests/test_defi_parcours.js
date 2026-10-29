// Tests de bout en bout du DÉFI EXPRESS (Playwright, émulation iPhone) : solo, salon à 3 joueurs,
// une seule tentative, classement, visiteur non participant, mesures du test non contaminées.
// Lancer : node tests/test_defi_parcours.js
const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const PORT = 8769, BASE = `http://localhost:${PORT}`;
const G = require(path.join(__dirname, "..", "grilles.json"));
const CAPT = process.env.CAPTURES || path.join(__dirname, "..", "captures_tests");
let echecs = 0;
const ok = (c, m) => { console.log((c ? "  OK   " : "  ÉCHEC ") + m); if (!c) echecs++; };
const db = async () => (await fetch(BASE + "/__test/db")).json();
const rpc = async (nom, params) => (await fetch(`${BASE}/rest/v1/rpc/${nom}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) })).json();

// Résout le palier affiché : regroupe les mots visibles grâce à la banque (chaque mot appartient à une seule catégorie).
async function resoudrePalier(page, { faux = 0 } = {}) {
  const mots = await page.$$eval("#defi-plateau [data-mot]", t => t.map(x => x.dataset.mot));
  const groupes = await page.evaluate((mots) => {
    const cats = window.QUOTIDIEN_DEFI.categories, g = {};
    for (const m of mots) { const c = cats.find(c => c.mots.includes(m)); (g[c.id] = g[c.id] || []).push(m); }
    return Object.values(g);
  }, mots);
  for (let i = 0; i < faux; i++) { // une erreur volontaire : un mot de chacun de deux groupes (+ complément)
    const k = groupes[0].length, sel = [groupes[0][0], groupes[1][0]].concat(groupes[1].slice(1, k - 1));
    for (const m of sel) await page.click(`#defi-plateau [data-mot="${m}"]`);
    await page.waitForTimeout(600);
  }
  for (const gr of groupes) { for (const m of gr) await page.click(`#defi-plateau [data-mot="${m}"]`); await page.waitForTimeout(220); }
  await page.waitForTimeout(900);
  return mots;
}
async function jouerPaliers(page, n) { const vus = []; for (let i = 0; i < n; i++) vus.push((await resoudrePalier(page)).slice().sort().join(",")); return vus; }

(async () => {
  const srv = spawn("node", [path.join(__dirname, "serveur_test.js")], { env: { ...process.env, PORT: String(PORT) }, stdio: "inherit" });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch();
  const erreurs = [];
  const nouveau = async (device = devices["iPhone 13"]) => {
    const ctx = await browser.newContext({ ...device, permissions: ["clipboard-read", "clipboard-write"] });
    await ctx.addInitScript(() => { try { localStorage.setItem("quotidien_regles_vues", "true"); localStorage.setItem("quotidien_regles_vues_demo", "true"); delete Navigator.prototype.share; } catch (e) {} });
    const page = await ctx.newPage();
    page.on("pageerror", e => erreurs.push(String(e)));
    page.on("console", m => { if (m.type() === "error" && !/401/.test(m.text())) erreurs.push(m.text()); });
    return { ctx, page };
  };
  require("fs").mkdirSync(CAPT, { recursive: true });
  try {
    const cal = {}; G.forEach((g, i) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + i); cal[new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d)] = g.id; });
    const s = await rpc("a_creer_session", { code: "code-test", p_nom: "Défi", p_calendrier: cal });
    const [{ id: A }, { id: B }] = await rpc("a_creer_participants", { code: "code-test", p_session: s.id, n: 2 });

    console.log("1. Accès au Défi");
    const { page: pa } = await nouveau();
    await pa.goto(`${BASE}/?p=${A}`); await pa.waitForSelector("#carte-defi");
    ok(await pa.locator("#carte-defi").isVisible() && /30 s au chrono/.test(await pa.locator("#carte-defi").innerText()), "accueil : carte « Défi express » visible");
    ok(await pa.locator('#nav-bas [data-ecran="defi"]').count() === 1, "onglet « Défi » dans la barre du bas");
    await pa.click('#nav-bas [data-ecran="defi"]'); await pa.waitForSelector("#defi-solo");
    ok(/30 secondes pour toute la partie/.test(await pa.locator("#ecran-defi").innerText()) && /rajoute 2 secondes/.test(await pa.locator("#ecran-defi").innerText()) && /en retire 2/.test(await pa.locator("#ecran-defi").innerText()), "règles du Défi affichées (30 s pour toute la partie, +2 s par groupe, −2 s par erreur)");
    await pa.screenshot({ path: path.join(CAPT, "defi_1_accueil.png"), fullPage: true });

    console.log("2. Partie solo : paliers, chrono, erreur, fin");
    await pa.click("#defi-solo"); await pa.waitForSelector("#defi-plateau [data-mot]");
    ok(await pa.locator("#nav-bas").isHidden(), "pendant la partie, la barre du bas est masquée");
    ok(await pa.locator("#defi-plateau [data-mot]").count() === 4 && /Palier 1/.test(await pa.locator(".defi-tete").innerText()), "palier 1 : 4 mots (2 groupes de 2)");
    const b1 = await pa.locator("#defi-chrono b").innerText();
    ok(/^(30|29) s$/.test(b1), "chrono de 30 secondes : " + b1);
    await pa.screenshot({ path: path.join(CAPT, "defi_2_palier1.png") });
    await resoudrePalier(pa, { faux: 1 });
    ok(/Palier 2/.test(await pa.locator(".defi-tete").innerText()), "palier 1 réussi malgré une erreur → palier 2");
    // Un seul chrono : il continue d'un palier à l'autre (pas de remise à 30 s), +2 s par groupe, −2 s par erreur.
    const sec = async () => parseInt(await pa.locator("#defi-chrono b").innerText(), 10);
    const lirePrecis = () => pa.evaluate(() => window.__resteDefi() / 1000);
    const groupesP2 = await pa.evaluate((mots) => { const cats = window.QUOTIDIEN_DEFI.categories, g = {};
      for (const m of mots) { const c = cats.find(c => c.mots.includes(m)); (g[c.id] = g[c.id] || []).push(m); } return Object.values(g); },
      await pa.$$eval("#defi-plateau [data-mot]", t => t.map(x => x.dataset.mot)));
    const avantErr = await lirePrecis();
    await pa.click(`#defi-plateau [data-mot="${groupesP2[0][0]}"]`); await pa.click(`#defi-plateau [data-mot="${groupesP2[1][0]}"]`);
    await pa.waitForTimeout(600);
    const apresErr = await lirePrecis();
    ok(avantErr - apresErr >= 1.8 && avantErr - apresErr <= 3, `une erreur retire 2 s (${avantErr.toFixed(1)} → ${apresErr.toFixed(1)} s)`);
    for (const m of groupesP2[0]) await pa.click(`#defi-plateau [data-mot="${m}"]`);
    await pa.waitForTimeout(350);
    const apresGroupe = await lirePrecis();
    ok(apresGroupe - apresErr >= 1.2 && apresGroupe - apresErr <= 2.1, `un groupe trouvé rajoute 2 s (${apresErr.toFixed(1)} → ${apresGroupe.toFixed(1)} s)`);
    const avantDernier = await lirePrecis();
    for (const m of groupesP2[1]) await pa.click(`#defi-plateau [data-mot="${m}"]`);
    await pa.waitForTimeout(1100);
    const palier3 = await lirePrecis();
    ok(/Palier 3/.test(await pa.locator(".defi-tete").innerText()) && palier3 - avantDernier >= 1.2 && palier3 - avantDernier <= 2.1,
      `le chrono continue d'un palier à l'autre, avec le bonus du dernier groupe et sans remise à 30 s (${avantDernier.toFixed(1)} → ${palier3.toFixed(1)} s)`);
    ok(/Attention : au prochain palier, 2 groupes de 3 mots/.test(await pa.locator("#ecran-defi-jeu").innerText()), "palier 3 : le changement de format à venir est signalé (« au prochain palier, 2 groupes de 3 mots »)");
    await resoudrePalier(pa).catch(() => {});
    await pa.waitForSelector("#annonce-format", { timeout: 3000 });
    ok(/2 groupes de 3 mots/.test(await pa.locator("#annonce-format").innerText()) && /Avant : 2 groupes de 2 mots/.test(await pa.locator("#annonce-format").innerText()), "palier 4 : annonce plein écran « Nouveau format : 2 groupes de 3 mots »");
    const fige1 = await lirePrecis(); await pa.waitForTimeout(700); const fige2 = await lirePrecis();
    ok(Math.abs(fige1 - fige2) < 0.05, `le chrono est arrêté pendant l'annonce (${fige1.toFixed(2)} → ${fige2.toFixed(2)} s)`);
    await pa.screenshot({ path: path.join(CAPT, "defi_annonce_format.png") });
    await pa.click("#annonce-ok"); await pa.waitForSelector("#annonce-format", { state: "detached" });
    ok(await pa.locator(".defi-tete .format.change").count() === 1 && /Nouveau/i.test(await pa.locator(".defi-tete .format").innerText()), "pendant le palier 4, le format est surligné « Nouveau ! » dans l'en-tête");
    await pa.screenshot({ path: path.join(CAPT, "defi_palier4_nouveau_format.png") });
    await jouerPaliers(pa, 1);
    ok(await pa.locator(".defi-tete .format.change").count() === 0, "au palier 5 (même format), plus de surlignage");
    ok(/Palier 5/.test(await pa.locator(".defi-tete").innerText()) && await pa.locator("#defi-plateau [data-mot]").count() === 6, "palier 5 : 6 mots (2 groupes de 3)");
    await pa.screenshot({ path: path.join(CAPT, "defi_3_palier5.png") });
    // Laisser le temps s'écouler sur le palier 5
    await pa.waitForSelector("#fin-rejouer", { timeout: 70000 });
    const fin = await pa.locator("#ecran-defi").innerText();
    ok(/4 paliers/.test(fin) && /Temps écoulé au palier 5/.test(fin), "temps écoulé : 4 paliers réussis, fin au palier 5");
    ok(/Nouveau record/.test(fin), "premier score = nouveau record");
    const etatA = await pa.evaluate((pid) => JSON.parse(localStorage.getItem("quotidien_defi_" + pid)), A);
    ok(etatA.record.paliers === 4 && etatA.parties === 1, "record local : 4 paliers, 1 partie");
    const xp = await pa.evaluate((pid) => localStorage.getItem("quotidien_journal_" + pid), A);
    ok(xp === null, "le Défi ne crédite aucune XP (journal de progression vide)");
    await pa.screenshot({ path: path.join(CAPT, "defi_4_fin_solo.png"), fullPage: true });

    console.log("3. Aléatoire : deux parties solo ne se ressemblent pas");
    await pa.click("#fin-rejouer"); await pa.waitForSelector("#defi-plateau [data-mot]");
    const p1a = (await pa.$$eval("#defi-plateau [data-mot]", t => t.map(x => x.dataset.mot))).sort().join();
    await pa.click("#defi-abandon"); await pa.click("#defi-abandon"); await pa.waitForSelector("#fin-rejouer");
    await pa.click("#fin-rejouer"); await pa.waitForSelector("#defi-plateau [data-mot]");
    const p1b = (await pa.$$eval("#defi-plateau [data-mot]", t => t.map(x => x.dataset.mot))).sort().join();
    ok(p1a !== p1b, "nouveau tirage à chaque partie solo (" + p1a + " ≠ " + p1b + ")");
    await pa.click("#defi-abandon"); await pa.click("#defi-abandon"); await pa.waitForSelector("#fin-defier");

    console.log("4. Créer un groupe (hôte A, participant)");
    await pa.click("#fin-defi"); await pa.waitForSelector("#defi-creer");
    await pa.click("#defi-creer"); await pa.fill("#champ-nom", "Les cousins"); await pa.fill("#champ-pseudo", "Matis"); await pa.click("#form-groupe button");
    await pa.waitForSelector("#g-manche");
    const lien = await pa.locator(".linkbox input").inputValue();
    const code = new URL(lien).searchParams.get("groupe");
    ok(/^[A-Z0-9]{6}$/.test(code) && /Les cousins/.test(await pa.locator("#ecran-defi").innerText()), "groupe « Les cousins » créé, lien : " + lien.replace(BASE, ""));
    ok(await pa.locator("#g-lancer").isDisabled() && /au moins 2 membres/.test(await pa.locator("#g-manche").innerText()), "seul dans le groupe : « Lancer la manche 1 » désactivé");
    await pa.screenshot({ path: path.join(CAPT, "defi_5_groupe_hote.png"), fullPage: true });

    console.log("5. Un ami NON participant rejoint par le lien (pas d'inscription au test)");
    const nbParticipantsAvant = (await db()).participants.length;
    const { page: pc } = await nouveau(devices["iPhone SE"]);
    await pc.goto(lien); await pc.waitForSelector("#form-rejoindre");
    ok(/Les cousins/i.test(await pc.locator("#ecran-defi").innerText()) && /Matis/i.test(await pc.locator("#ecran-defi").innerText()), "l'ami voit le groupe « Les cousins » et ses membres");
    ok(await pc.locator("#nav-bas").isHidden() && /seulement au Défi/.test(await pc.locator("#ecran-defi").innerText()), "visiteur : pas de navigation du test, message clair");
    await pc.fill("#champ-pseudo", "matis"); await pc.click("#form-rejoindre button"); await pc.waitForTimeout(600);
    ok(/déjà pris/.test(await pc.locator("#groupe-err").innerText()), "pseudo déjà pris dans le groupe : refusé");
    await pc.fill("#champ-pseudo", "Léa <b>"); await pc.click("#form-rejoindre button"); await pc.waitForSelector("#g-manche");
    ok(/En attente : Matis lance la manche 1/.test(await pc.locator("#g-manche").innerText()), "l'ami attend dans la salle d'attente : « Matis lance la manche 1 »");
    await pa.waitForFunction(() => /Léa b/i.test(document.getElementById("ecran-defi").innerText), null, { timeout: 8000 });
    ok(await pa.locator("#g-lancer").isEnabled(), "l'hôte voit arriver Léa en direct ; « Lancer la manche 1 » s'active");
    ok((await db()).participants.length === nbParticipantsAvant, "aucun participant créé pour l'ami (le test n'est pas touché)");

    console.log("6. Manche 1 : départ commun, même tirage, points du petit bac");
    await pa.click("#g-lancer");
    await pa.waitForSelector("#compte-manche", { timeout: 5000 });
    await pc.waitForSelector("#compte-manche", { timeout: 8000 });
    ok(true, "compte à rebours affiché chez l'hôte et chez l'ami");
    await pa.screenshot({ path: path.join(CAPT, "defi_6_compte_a_rebours.png") });
    await Promise.all([pa.waitForSelector("#defi-plateau [data-mot]", { timeout: 12000 }), pc.waitForSelector("#defi-plateau [data-mot]", { timeout: 12000 })]);
    ok(true, "les deux parties démarrent toutes seules à la fin du compte à rebours");
    const motsA = (await pa.$$eval("#defi-plateau [data-mot]", t => t.map(x => x.dataset.mot))).sort().join();
    const motsC = (await pc.$$eval("#defi-plateau [data-mot]", t => t.map(x => x.dataset.mot))).sort().join();
    ok(motsA === motsC, "même tirage pour les deux joueurs : " + motsA);
    await Promise.all([jouerPaliers(pa, 2), jouerPaliers(pc, 3)]);
    for (const p of [pa, pc]) { await p.click("#defi-abandon"); await p.click("#defi-abandon"); await p.waitForSelector("#fin-classement"); await p.click("#fin-classement"); }
    await pa.waitForFunction(() => /Résultats de la manche 1/.test(document.getElementById("ecran-defi").innerText), null, { timeout: 8000 });
    const res1 = await pa.locator("#g-manche").innerText();
    ok(/Léa b[\s\S]*3 pal\.[\s\S]*\+2 pts[\s\S]*Matis[\s\S]*2 pal\.[\s\S]*\+1 pt/.test(res1), "résultats de la manche 1 : Léa 3 paliers +2 pts, Matis 2 paliers +1 pt");
    ok(/Classement général/.test(await pa.locator("#ecran-defi").innerText()) && /Lancer la manche 2/.test(res1), "classement général affiché, l'hôte peut lancer la manche 2");
    await pc.waitForFunction(() => /Classement général/.test(document.getElementById("ecran-defi").innerText), null, { timeout: 8000 });
    const etatC = await pc.evaluate(() => JSON.parse(localStorage.getItem("quotidien_defi_invite")));
    ok(etatC.badges.duelliste && etatC.badges.champion, "badges de l'ami : Joueur d'équipe et Champion de manche");
    await pc.screenshot({ path: path.join(CAPT, "defi_7_resultats_manche.png"), fullPage: true });
    const r2 = await rpc("g_commencer", { p_code: code, p_joueur: await pc.evaluate(() => localStorage.getItem("quotidien_appareil")) });
    ok(r2.ok === false, "une manche terminée ne peut plus être jouée (" + r2.raison + ")");
    await pc.close();

    console.log("7. Le lendemain : B (participant) arrive par le lien du groupe, manche 2 avec absent, rechargement et clôture");
    const { page: pb } = await nouveau();
    await pb.goto(`${BASE}/?p=${B}`); await pb.waitForSelector("#btn-jouer"); // première visite de B
    await fetch(BASE + "/__test/decaler?jours=1");
    await pb.goto(`${BASE}/?p=${B}&groupe=${code}`); await pb.waitForSelector("#form-rejoindre");
    let d = await db();
    const visB = d.evenements.filter(e => e.participant_id === B && e.type === "visite");
    ok(visB.length === 2 && visB[1].donnees.classe === "retour_defi" && visB[1].donnees.entree === "defi", "arrivée par le lien du groupe le lendemain → « retour_defi », pas « retour_spontane »");
    await pb.fill("#champ-pseudo", "Bob"); await pb.click("#form-rejoindre button"); await pb.waitForSelector("#g-manche");
    await pa.waitForFunction(() => /Bob/i.test(document.getElementById("ecran-defi").innerText), null, { timeout: 8000 });
    await pa.click("#g-lancer");
    await Promise.all([pa.waitForSelector("#defi-plateau [data-mot]", { timeout: 12000 }), pb.waitForSelector("#defi-plateau [data-mot]", { timeout: 12000 })]);
    // Un retardataire arrive pendant la manche : il jouera la suivante
    const { page: pz } = await nouveau();
    await pz.goto(lien); await pz.waitForSelector("#form-rejoindre"); await pz.fill("#champ-pseudo", "Zoé"); await pz.click("#form-rejoindre button");
    await pz.waitForFunction(() => /tu joueras la suivante/.test(document.getElementById("ecran-defi").innerText), null, { timeout: 8000 });
    ok(true, "un membre arrivé pendant la manche 2 voit « tu joueras la suivante »");
    await jouerPaliers(pb, 2);
    await pb.reload(); await pb.waitForTimeout(1500);
    d = await db();
    const m2 = d.manches.find(m => m.groupe === code && m.numero === 2);
    const rB = d.resultats.find(r => r.manche === m2.id && d.membres.find(x => x.joueur === r.joueur && x.pseudo === "Bob"));
    ok(rB && rB.paliers === 2 && rB.termine_le, "B recharge en pleine manche : score enregistré à 2 paliers, pas de seconde chance");
    await jouerPaliers(pa, 1); await pa.click("#defi-abandon"); await pa.click("#defi-abandon"); await pa.waitForSelector("#fin-classement"); await pa.click("#fin-classement");
    await pa.waitForSelector("#g-clore", { timeout: 8000 });
    ok(/Manche 2 en cours/.test(await pa.locator("#g-manche").innerText()), "Léa est absente : la manche 2 reste en cours, l'hôte peut la clore");
    await pa.click("#g-clore"); await pa.click("#g-clore");
    await pa.waitForFunction(() => /Résultats de la manche 2/.test(document.getElementById("ecran-defi").innerText), null, { timeout: 8000 });
    const gen = await pa.locator("#ecran-defi").innerText();
    ok(/Bob[\s\S]*2 pal\.[\s\S]*\+2 pts[\s\S]*Matis[\s\S]*1 pal\.[\s\S]*\+1 pt/.test(await pa.locator("#g-manche").innerText()), "manche 2 close : Bob +2 pts, Matis +1 pt, Léa absente sans point");
    const lignesGen = await pa.$$eval("#ecran-defi .panel:last-of-type .classement tr, #ecran-defi .classement tr", trs => trs.map(t => t.innerText.replace(/\s+/g, " ").trim()));
    const gen2 = lignesGen.filter(l => /pts? /.test(l) && /victoire/.test(l));
    ok(gen2.length === 4 && /^🥇 Léa b 2 pts 1 victoire$/.test(gen2[0]) && /^🥈 Bob 2 pts 1 victoire$/.test(gen2[1]) && /^🥉 Matis \(toi\) 2 pts 0 victoire$/.test(gen2[2]) && /^4 Zoé 0 pt/.test(gen2[3]),
      "classement général : à égalité de points, les victoires puis les paliers départagent → " + gen2.join(" | "));
    await pa.screenshot({ path: path.join(CAPT, "defi_8_classement_general.png"), fullPage: true });
    d = await db();
    ok(!d.evenements.some(e => e.participant_id === B && e.type === "visite" && e.donnees.classe === "retour_spontane"), "aucune visite de B comptée comme retour spontané");

    console.log("8. Mesures du test non contaminées");
    const evA = d.evenements.filter(e => e.participant_id === A);
    ok(!evA.some(e => ["debut", "essai", "fin", "indice", "recompense"].includes(e.type)), "aucun événement de partie du test pour A (il n'a joué qu'au Défi)");
    const acts = [...new Set(evA.filter(e => e.type === "defi").map(e => e.donnees.action))].sort().join();
    ok(acts === "fin,groupe_cree,manche_lancee,ouverture", "traces séparées « defi » : " + acts);
    ok(evA.filter(e => e.type === "visite").length === 1, "A : une seule visite (le Défi ne recharge pas la page)");

    console.log("9. Mode démo");
    const { page: pd } = await nouveau();
    await pd.goto(`${BASE}/?demo=1`); await pd.waitForSelector("#carte-defi");
    const avant = (await db()).evenements.length;
    await pd.click("#btn-defi"); await pd.click("#defi-solo"); await pd.waitForSelector("#defi-plateau [data-mot]");
    await jouerPaliers(pd, 1);
    await pd.click("#defi-abandon"); await pd.click("#defi-abandon"); await pd.waitForSelector("#fin-rejouer");
    ok(/1 palier/.test(await pd.locator("#ecran-defi").innerText()) && (await db()).evenements.length === avant, "démo : partie jouée, aucun événement envoyé");
    await pd.click('[data-ecran="accueil"]'); await pd.waitForSelector("#carte-defi");
    ok(/Record : 1 palier/.test(await pd.locator("#carte-defi").innerText()), "démo : record affiché sur la carte de l'accueil");
    await pd.click('#nav-bas [data-ecran="badges"]'); await pd.waitForSelector("#ecran-badges:not(.hidden)");
    ok(/Badges du Défi/.test(await pd.locator("#ecran-badges").innerText()) && /sans XP|pas d'XP/i.test(await pd.locator("#ecran-badges").innerText()), "écran Badges : section « Badges du Défi », sans XP");
    await pd.click('#nav-bas [data-ecran="stats"]'); await pd.waitForSelector("#ecran-stats:not(.hidden)");
    ok(/Défi express/i.test(await pd.locator("#ecran-stats").innerText()) && /Record de paliers/i.test(await pd.locator("#ecran-stats").innerText()), "écran Stats : rubrique Défi (record, parties)");

    console.log("10. Lien de défi invalide");
    const { page: px } = await nouveau();
    await px.goto(`${BASE}/?groupe=ZZZZZZ`); await px.waitForSelector("#g-solo");
    ok(/introuvable/.test(await px.locator("#ecran-defi").innerText()), "lien inconnu : message « Groupe introuvable » et proposition de jouer en solo");

    ok(erreurs.length === 0, "aucune erreur JavaScript " + erreurs.join(" | "));
  } catch (e) { console.error(e); echecs++; }
  finally {
    await browser.close(); srv.kill();
    console.log(echecs ? `${echecs} échec(s)` : "Défi express : tous les tests passent.");
    process.exit(echecs ? 1 : 0);
  }
})();
