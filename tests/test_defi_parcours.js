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
    ok(await pa.locator("#carte-defi").isVisible() && /30 secondes par palier/.test(await pa.locator("#carte-defi").innerText()), "accueil : carte « Défi express » visible");
    ok(await pa.locator('#nav-bas [data-ecran="defi"]').count() === 1, "onglet « Défi » dans la barre du bas");
    await pa.click('#nav-bas [data-ecran="defi"]'); await pa.waitForSelector("#defi-solo");
    ok(/5 secondes/.test(await pa.locator("#ecran-defi").innerText()), "règles du Défi affichées (30 s par palier, −5 s par erreur)");
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
    await jouerPaliers(pa, 3);
    ok(/Palier 5/.test(await pa.locator(".defi-tete").innerText()) && await pa.locator("#defi-plateau [data-mot]").count() === 6, "palier 5 : 6 mots (2 groupes de 3)");
    await pa.screenshot({ path: path.join(CAPT, "defi_3_palier5.png") });
    // Laisser le temps s'écouler sur le palier 5
    await pa.waitForSelector("#fin-rejouer", { timeout: 40000 });
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

    console.log("4. Créer un défi entre amis (salon) depuis l'accueil du Défi");
    await pa.click("#fin-defi"); await pa.waitForSelector("#defi-amis");
    await pa.click("#defi-amis"); await pa.fill("#champ-pseudo", "Matis"); await pa.click("#form-pseudo button");
    await pa.waitForSelector(".linkbox input");
    const lien = await pa.locator(".linkbox input").inputValue();
    const code = new URL(lien).searchParams.get("defi");
    ok(/^[A-Z0-9]{6}$/.test(code), "salon créé, lien de défi : " + lien.replace(BASE, ""));
    await pa.click("#salon-jouer"); await pa.click("#form-pseudo button"); await pa.waitForSelector("#defi-plateau [data-mot]");
    const sequenceA = await jouerPaliers(pa, 3);
    await pa.click("#defi-abandon"); await pa.click("#defi-abandon");
    await pa.waitForSelector("#fin-classement");
    ok(/3 paliers/.test(await pa.locator("#ecran-defi").innerText()), "A abandonne après 3 paliers réussis");
    await pa.click("#fin-classement"); await pa.waitForSelector(".classement");
    ok(/Matis \(toi\)/.test(await pa.locator(".classement").innerText()) && /3 paliers/.test(await pa.locator(".classement").innerText()), "classement : Matis, 3 paliers");
    ok(await pa.locator("#salon-jouer").count() === 0, "une seule partie : plus de bouton « Jouer » pour A");

    console.log("5. Un ami NON participant ouvre le lien (pas d'inscription au test)");
    const nbParticipantsAvant = (await db()).participants.length;
    const { page: pc } = await nouveau(devices["iPhone SE"]);
    await pc.goto(lien); await pc.waitForSelector(".classement, #salon-jouer");
    ok(/Le défi de Matis/.test(await pc.locator("#ecran-defi").innerText()), "l'ami voit « Le défi de Matis »");
    ok(await pc.locator("#nav-bas").isHidden() && /seulement au Défi/.test(await pc.locator("#ecran-defi").innerText()), "visiteur : pas de navigation du test, message clair");
    await pc.screenshot({ path: path.join(CAPT, "defi_5_salon_ami.png"), fullPage: true });
    await pc.click("#salon-jouer"); await pc.fill("#champ-pseudo", "Léa <b>"); await pc.click("#form-pseudo button");
    await pc.waitForSelector("#defi-plateau [data-mot]");
    const sequenceC = await jouerPaliers(pc, 4);
    ok(JSON.stringify(sequenceC.slice(0, 3)) === JSON.stringify(sequenceA), "même tirage que Matis sur les 3 premiers paliers (duel équitable)");
    ok(!(await pc.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), "iPhone SE : aucun défilement horizontal en partie");
    await pc.click("#defi-abandon"); await pc.click("#defi-abandon"); await pc.waitForSelector("#fin-classement");
    await pc.click("#fin-classement"); await pc.waitForSelector(".classement");
    const cl = await pc.locator(".classement").innerText();
    ok(/^🥇\s*Léa b \(toi\)/m.test(cl.trim()) || /🥇\s+Léa b/.test(cl), "classement : Léa (4 paliers) devant Matis (3) — pseudo nettoyé : " + cl.replace(/\s+/g, " "));
    ok((await db()).participants.length === nbParticipantsAvant, "aucun participant créé pour l'ami (le test n'est pas touché)");
    const etatC = await pc.evaluate(() => JSON.parse(localStorage.getItem("quotidien_defi_invite")));
    ok(etatC.badges.duelliste && etatC.badges.champion, "badges de l'ami : Duelliste et Champion du salon");
    await pc.screenshot({ path: path.join(CAPT, "defi_6_classement.png"), fullPage: true });

    console.log("6. Une seule tentative, même après rechargement");
    await pc.goto(lien); await pc.waitForSelector(".classement");
    ok(await pc.locator("#salon-jouer").count() === 0, "rouvrir le lien : on voit le classement, pas de seconde partie");
    const r2 = await rpc("d_commencer", { p_code: code, p_joueur: await pc.evaluate(() => localStorage.getItem("quotidien_appareil")), p_pseudo: "Triche" });
    ok(r2.ok === false && r2.raison === "deja_joue", "le serveur refuse une seconde tentative du même appareil");

    console.log("7. Participant B arrive par le lien : visite classée « retour_defi »");
    const { page: pb } = await nouveau();
    await pb.goto(`${BASE}/?p=${B}`); await pb.waitForSelector("#btn-jouer"); // première visite
    await fetch(BASE + "/__test/decaler?jours=1");
    await pb.goto(`${BASE}/?p=${B}&defi=${code}`); await pb.waitForSelector(".classement, #salon-jouer");
    let d = await db();
    const visB = d.evenements.filter(e => e.participant_id === B && e.type === "visite");
    ok(visB.length === 2 && visB[1].donnees.classe === "retour_defi" && visB[1].donnees.entree === "defi", "le lendemain, arrivée par un lien de défi → « retour_defi », pas « retour_spontane »");
    // B commence puis recharge la page en pleine partie : son score s'arrête au dernier palier réussi
    await pb.click("#salon-jouer"); await pb.fill("#champ-pseudo", "Bob"); await pb.click("#form-pseudo button");
    await pb.waitForSelector("#defi-plateau [data-mot]");
    await jouerPaliers(pb, 2);
    await pb.reload(); await pb.waitForTimeout(1500);
    d = await db();
    const scoreB = d.scores.find(x => x.salon === code && x.pseudo === "Bob");
    ok(scoreB && scoreB.paliers === 2, "B recharge en pleine partie : score enregistré à 2 paliers (pas de seconde chance)");
    ok(/retour_defi/.test(JSON.stringify(d.evenements.filter(e => e.participant_id === B && e.type === "visite").map(v => v.donnees.classe))) &&
       !d.evenements.some(e => e.participant_id === B && e.type === "visite" && e.donnees.classe === "retour_spontane"), "aucune visite de B comptée comme retour spontané");

    console.log("8. Mesures du test non contaminées");
    const evA = d.evenements.filter(e => e.participant_id === A);
    ok(!evA.some(e => ["debut", "essai", "fin", "indice", "recompense"].includes(e.type)), "aucun événement de partie du test pour A (il n'a joué qu'au Défi)");
    const acts = [...new Set(evA.filter(e => e.type === "defi").map(e => e.donnees.action))].sort().join();
    ok(acts === "fin,ouverture,salon_cree,salon_rejoint", "traces séparées « defi » : " + acts);
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
    await px.goto(`${BASE}/?defi=ZZZZZZ`); await px.waitForSelector("#salon-retour");
    ok(/introuvable/.test(await px.locator("#ecran-defi").innerText()), "lien inconnu : message « Défi introuvable » et proposition de jouer en solo");

    ok(erreurs.length === 0, "aucune erreur JavaScript " + erreurs.join(" | "));
  } catch (e) { console.error(e); echecs++; }
  finally {
    await browser.close(); srv.kill();
    console.log(echecs ? `${echecs} échec(s)` : "Défi express : tous les tests passent.");
    process.exit(echecs ? 1 : 0);
  }
})();
