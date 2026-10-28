// Tests automatisés de bout en bout (Playwright, Chromium en émulation iPhone).
// Lancer : node tests/test_parcours.js   (démarre lui-même le serveur de test local)
const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const PORT = 8765, BASE = `http://localhost:${PORT}`;
const G = require(path.join(__dirname, "..", "grilles.json"));
let echecs = 0;
const ok = (cond, msg) => { console.log((cond ? "  OK   " : "  ÉCHEC ") + msg); if (!cond) echecs++; };
const db = async () => (await fetch(BASE + "/__test/db")).json();

async function jouer(page, groupesAJouer, faux = 0) {
  const g = G[0];
  for (let i = 0; i < faux; i++) {
    // essai faux : 2 mots du groupe i%4, 2 mots du groupe (i+1)%4 — combinaisons distinctes
    const a = g.groupes[i % 4].mots, b = g.groupes[(i + 1) % 4].mots;
    for (const m of [a[0], a[1], b[i % 4], b[(i + 1) % 4]]) await page.getByRole("button", { name: m, exact: true }).click();
    await page.getByRole("button", { name: "Valider" }).click();
    await page.getByRole("button", { name: "Désélectionner" }).click();
  }
  for (const gi of groupesAJouer) {
    for (const m of g.groupes[gi].mots) await page.getByRole("button", { name: m, exact: true }).click();
    await page.getByRole("button", { name: "Valider" }).click();
  }
}

(async () => {
  const srv = spawn("node", [path.join(__dirname, "serveur_test.js")], { env: { ...process.env, PORT: String(PORT) }, stdio: "inherit" });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch();
  const erreursConsole = [];
  const iphone = devices["iPhone 13"];
  // Ouvre une adresse puis, depuis l'accueil, lance la partie (ou affiche le résultat) via la carte du jour.
  const aller = async (p, url, cliquer = true) => {
    await p.goto(url);
    await p.waitForSelector("#btn-jouer, #erreur:not(.hidden), #btn-reessayer", { timeout: 15000 }).catch(() => {});
    if (cliquer && await p.locator("#btn-jouer").count()) await p.click("#btn-jouer");
  };
  const nouveau = async (opts = {}, reglesVues = false) => {
    const ctx = await browser.newContext({ ...iphone, permissions: ["clipboard-read", "clipboard-write"], ...opts });
    if (reglesVues) await ctx.addInitScript(() => { try { localStorage.setItem("quotidien_regles_vues", "true"); } catch (e) {} });
    await ctx.addInitScript(() => { try { delete Navigator.prototype.share; } catch (e) {} });
    const page = await ctx.newPage();
    page.on("console", m => { if (m.type() === "error") erreursConsole.push(m.text()); });
    page.on("pageerror", e => erreursConsole.push(String(e)));
    return { ctx, page };
  };
  try {
    console.log("1. Administration");
    const { page: adm } = await nouveau({ ...devices["Desktop Chrome"], isMobile: false });
    await adm.goto(BASE + "/admin.html");
    await adm.fill("#code", "mauvais"); await adm.click("#form-connexion button");
    await adm.waitForSelector("#err-connexion:has-text('incorrect')"); ok(true, "code faux refusé");
    await adm.fill("#code", "code-test"); await adm.click("#form-connexion button");
    await adm.waitForSelector("#app:not(.hidden)");
    await adm.click("summary:has-text('Créer une nouvelle session')");
    const today = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
    await adm.fill("#s-nom", "Test auto"); await adm.fill("#s-debut", today); await adm.click("#form-session button");
    await adm.waitForSelector("#info-session:has-text('Session active')");
    await adm.fill("#n-participants", "4"); await adm.click("#form-participants button");
    await adm.waitForSelector("#tab-participants [data-lien]");
    let d = await db();
    ok(d.participants.length === 4 && d.participants.filter(p => p.groupe === "R").length === 2, "4 participants créés, alternance R/S");
    const [A, B, C] = d.participants.map(p => p.id);
    await adm.click(`[data-lien="${A}"]`); await adm.waitForTimeout(300);
    await adm.click(`[data-lien="${B}"]`); await adm.waitForTimeout(300);
    d = await db(); ok(d.participants.filter(p => p.lien_envoye_le).length === 2, "« lien envoyé » enregistré au clic sur Copier");

    console.log("2. Joueur A (groupe R) gagne avec 1 erreur");
    const { page: pa } = await nouveau();
    await aller(pa, `${BASE}/?p=${A}`);
    await pa.waitForSelector(".tile");
    ok(await pa.locator(".tile").count() === 16, "16 cartes affichées");
    const debord = await pa.evaluate(() => ({ page: document.documentElement.scrollWidth > window.innerWidth,
      cartes: [...document.querySelectorAll(".tile")].filter(t => { const a = t.firstElementChild.getBoundingClientRect(), b = t.getBoundingClientRect(); return a.left < b.left - 0.5 || a.right > b.right + 0.5; }).map(t => t.textContent) }));
    ok(!debord.page, "aucun défilement horizontal sur iPhone");
    ok(debord.cartes.length === 0, "aucun mot ne déborde de sa carte " + (debord.cartes.join(",") || ""));
    ok(await pa.locator("#dlg-regles[open]").count() === 1, "première visite : le tutoriel s'ouvre automatiquement");
    ok((await pa.locator("#tuto-suiv").innerText()) === "Suivant" && (await pa.locator('.tuto-etape[data-etape="1"]:not(.hidden)').count()) === 1, "tutoriel : étape 1/3 affichée");
    await pa.click("#tuto-suiv"); await pa.click("#tuto-suiv");
    ok((await pa.locator("#tuto-suiv").innerText()).startsWith("Compris") && (await pa.locator('.tuto-etape[data-etape="3"]:not(.hidden)').count()) === 1, "tutoriel : étape 3/3, bouton « Compris »");
    await pa.click("#tuto-suiv"); await pa.waitForSelector("#dlg-regles:not([open])", { state: "attached" });
    await pa.getByRole("button", { name: "Règles" }).click(); await pa.waitForSelector("#dlg-regles[open]");
    ok((await pa.locator('.tuto-etape[data-etape="1"]:not(.hidden)').count()) === 1, "le « ? » rouvre le tutoriel à l'étape 1");
    await pa.click("#tuto-suiv"); await pa.click("#tuto-suiv"); await pa.click("#tuto-suiv");
    // Quitter une partie en cours et la reprendre
    await pa.locator(".tile").first().click();
    ok(await pa.locator("#btn-quitter:not(.hidden)").count() === 1, "bouton « ← Accueil » visible pendant la partie");
    await pa.click("#btn-quitter"); await pa.waitForSelector("#ecran-accueil:not(.hidden)");
    ok(/Reprendre la partie/.test(await pa.locator("#btn-jouer").innerText()) && /En cours/.test(await pa.locator("#carte-jour").innerText()), "après avoir quitté : carte « En cours », bouton « Reprendre la partie »");
    await pa.click("#btn-jouer"); await pa.waitForSelector(".tile");
    ok(await pa.locator(".tile.sel").count() === 1, "la sélection en cours est retrouvée");
    await pa.getByRole("button", { name: "Désélectionner" }).click();
    await jouer(pa, [0, 1, 2], 1);
    await pa.waitForTimeout(500);
    const visible = await pa.evaluate(() => { const r = document.querySelector("#btn-valider").getBoundingClientRect(); return r.bottom <= window.innerHeight && r.top >= 0; });
    ok(visible, "le bouton Valider reste visible à l'écran après 3 groupes trouvés (iPhone 13)");
    ok(await pa.locator("#trouves .expl").count() === 0 && await pa.locator("#trouves .group").count() === 3, "groupes trouvés affichés en version compacte pendant la partie");
    await jouer(pa, [3], 0);
    await pa.waitForSelector("#fin:not(.hidden)");
    ok(await pa.locator("#resume h2").innerText() === "Bravo !", "écran de victoire");
    ok((await pa.locator("#resume").innerText()).includes("1 erreur"), "résumé : 1 erreur");
    ok(await pa.locator("#solution .expl").count() === 4, "explications des 4 groupes affichées");
    ok(/Prochaine grille dans\s+\d{2}h \d{2}min \d{2}s/i.test((await pa.locator("#compte-a-rebours").innerText()).replace(/\n/g, " ")), "compte à rebours affiché : " + (await pa.locator("#compte-a-rebours").innerText()).replace(/\n/g, " "));
    const cible = await pa.evaluate(() => { const t = document.querySelector("#compte-a-rebours").innerText.match(/(\d{2})h (\d{2})min (\d{2})s/); return t ? (+t[1] * 3600 + +t[2] * 60 + +t[3]) : -1; });
    const attendu = Math.round((new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })).setHours(24, 0, 0, 0) - new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })).getTime()) / 1000);
    ok(Math.abs(cible - attendu) < 90, `le compte à rebours vise minuit heure de Paris (écart ${Math.abs(cible - attendu)} s)`);
    await pa.click("#btn-demande"); await pa.waitForSelector("#apres-demande:not(.hidden)");
    ok((await pa.locator("#apres-demande").innerText()).includes("Ne le transmets pas"), "avertissement « lien personnel » affiché");
    await pa.click("#btn-partager"); await pa.waitForSelector("#partage-ok:not(.hidden)");
    const presse = await pa.evaluate(() => navigator.clipboard.readText());
    ok(presse.includes("?inv=" + A) && presse.includes("🟨"), "texte de partage avec lien d'invitation et grille d'émojis");
    await pa.click("label:has-text('Oui, toutes')"); await pa.click("label:has-text('Bien dosée')"); await pa.click("label:has-text('Peut-être')");
    await pa.fill("textarea[name=gene]", "Le groupe coup de était facile");
    await pa.click("#questionnaire button"); await pa.waitForSelector("#merci:not(.hidden)");
    ok(await pa.locator("#merci").isVisible(), "message de remerciement visible");
    await aller(pa, pa.url()); await pa.waitForSelector("#fin:not(.hidden)");
    ok(await pa.locator("#merci:not(.hidden)").count() === 1, "après rechargement : partie terminée conservée, pas de nouvelle partie");
    ok(await pa.locator("#bloc-recompenses").count() === 0, "après rechargement : les récompenses ne sont pas affichées (ni créditées) une 2e fois");
    ok(pa.url().endsWith("?p=" + A), "l'adresse affichée est le lien personnel (à mettre en favori)");

    console.log("3. Joueur B (groupe S) perd après 4 erreurs, avec un indice");
    const g0 = G[0];
    const { page: pb } = await nouveau({}, true);
    await aller(pb, `${BASE}/?p=${B}`); await pb.waitForSelector(".tile");
    ok((await pb.locator("#indice-restant").innerText()) === "1" && await pb.locator("#btn-indice").isEnabled(), "1 indice disponible au départ");
    await pb.click("#btn-indice"); await pb.waitForTimeout(300);
    const motsIndice = await pb.locator(".tile.indice").allInnerTexts();
    ok(motsIndice.length === 2 && g0 && g0.groupes.some(gr => motsIndice.every(m => gr.mots.includes(m))), "l'indice met en évidence 2 mots du même groupe : " + motsIndice.join(", "));
    ok(await pb.locator("#btn-indice").isDisabled() && (await pb.locator("#indice-restant").innerText()) === "0", "après usage : plus d'indice (le 2e viendra après 2 erreurs)");
    ok(/⏱ 0:0\d/.test(await pb.locator("#chrono").innerText()), "chronomètre affiché et démarré : " + await pb.locator("#chrono").innerText());
    await jouer(pb, [0], 0);
    // même essai deux fois : ne doit pas compter d'erreur
    const g = g0;
    const fauxMots = [g.groupes[1].mots[0], g.groupes[1].mots[1], g.groupes[2].mots[0], g.groupes[2].mots[1]];
    for (const m of fauxMots) await pb.getByRole("button", { name: m, exact: true }).click();
    await pb.getByRole("button", { name: "Valider" }).click();
    await pb.getByRole("button", { name: "Valider" }).click();
    ok((await pb.locator("#message").innerText()).includes("Déjà essayé"), "un essai répété ne coûte pas d'erreur");
    ok(await pb.locator(".coeur.used").count() === 1, "après 1 erreur : exactement 1 cœur éteint");
    const chevauche = await pb.evaluate(() => { const a = document.querySelector("#message .bulle").getBoundingClientRect(), b = document.querySelector("#plateau").getBoundingClientRect();
      return !(a.bottom <= b.top || a.top >= b.bottom || a.right <= b.left || a.left >= b.right); });
    ok(!chevauche, "le message d'erreur ne recouvre aucune carte");
    ok(await pb.locator("#btn-valider").isEnabled(), "Valider actif avec 4 mots sélectionnés");
    await pb.getByRole("button", { name: "Désélectionner" }).click();
    ok(await pb.locator("#btn-valider").isDisabled(), "Valider inactif sans 4 mots sélectionnés");
    for (const k of [[1, 3], [2, 3], [1, 2]]) {
      const ms = [g.groupes[k[0]].mots[2], g.groupes[k[0]].mots[3], g.groupes[k[1]].mots[2], g.groupes[k[1]].mots[3]];
      for (const m of ms) await pb.getByRole("button", { name: m, exact: true }).click();
      await pb.getByRole("button", { name: "Valider" }).click();
      if (await pb.locator("#jeu:not(.hidden)").count()) await pb.getByRole("button", { name: "Désélectionner" }).click();
    }
    await pb.waitForSelector("#fin:not(.hidden)");
    ok(await pb.locator("#resume h2").innerText() === "Partie terminée", "défaite après 4 erreurs");
    ok((await pb.locator("#resume").innerText()).includes("1 groupe trouvé sur 4"), "résumé : 1 groupe sur 4 et solution révélée");
    ok(await pb.locator("#btn-indice").count() === 1, "après 2 erreurs un 2e indice s'était débloqué (bouton présent)");
    d = await db();
    const indB = d.evenements.filter(e => e.participant_id === B && e.type === "indice");
    const finB = d.evenements.find(e => e.participant_id === B && e.type === "fin");
    ok(indB.length === 1 && finB && finB.donnees.indices === 1 && typeof finB.donnees.duree_s === "number", "serveur : 1 événement indice pour B, fin.indices = 1, durée active enregistrée");
    ok(await pb.locator("#solution .lvl").count() === 0, "participant : aucun niveau de groupe affiché dans la solution");

    console.log("4. Invitation : un nouveau joueur arrive par le lien de A");
    const { page: pi } = await nouveau({}, true);
    await aller(pi, `${BASE}/?inv=${A}`); await pi.waitForSelector(".tile");
    await pi.locator(".tile").first().click();
    await pi.waitForTimeout(400);
    d = await db();
    const invite = d.participants.find(p => p.invite_par === A);
    ok(invite && invite.groupe === "invite", "participant « invité » créé et rattaché à A");
    ok(d.evenements.some(e => e.participant_id === invite.id && e.type === "debut"), "l'invité a commencé une partie");
    ok(d.evenements.filter(e => e.type === "visite" && e.participant_id === A).every(e => e.donnees.appareil), "identifiant d'appareil enregistré avec les visites");
    console.log("4b. Lien personnel de A ouvert depuis un autre appareil");
    const { page: px } = await nouveau({}, true);
    await aller(px, `${BASE}/?p=${A}`, false); await px.waitForSelector("#carte-jour"); await px.waitForTimeout(400);
    d = await db();
    const appsA = new Set(d.evenements.filter(e => e.type === "visite" && e.participant_id === A).map(e => e.donnees.appareil));
    ok(appsA.size === 2, "le lien de A apparaît sur 2 appareils distincts (détectable dans le tableau de bord)");

    console.log("5. Le lendemain : A revient par un lien de rappel, B revient seul");
    await fetch(BASE + "/__test/decaler?jours=1");
    await adm.clock.install({ time: new Date(Date.now() + 86400000) });
    await adm.reload(); await adm.waitForSelector("#app:not(.hidden)"); await adm.waitForTimeout(600);
    ok(await adm.locator(`[data-rappel="${A}"]`).count() === 1, "A (R, a demandé) apparaît dans les rappels à envoyer");
    ok(await adm.locator(`[data-rappel="${B}"]`).count() === 0, "B (groupe S) n'apparaît jamais dans les rappels");
    await adm.click(`[data-rappel="${A}"]`); await adm.waitForSelector("#tab-rappels [data-copier]");
    const lienRappel = await adm.locator("#tab-rappels [data-copier]").first().getAttribute("data-copier");
    await aller(pa, lienRappel); await pa.waitForSelector("#fin:not(.hidden), .tile");
    await aller(pb, `${BASE}/?p=${B}`); await pb.waitForSelector("#fin:not(.hidden), .tile");
    // C n'a jamais reçu son lien : aucune visite
    await pa.waitForTimeout(400);
    d = await db();
    const cl = (id) => d.evenements.filter(e => e.participant_id === id && e.type === "visite").map(e => e.donnees.classe);
    ok(cl(A).includes("retour_apres_rappel"), "A classé « retour après rappel » : " + cl(A).join(", "));
    ok(cl(B).includes("retour_spontane"), "B classé « retour spontané » : " + cl(B).join(", "));
    ok(!pa.url().includes("&r="), "le jeton de rappel disparaît de l'adresse (un favori ne compte pas comme rappel)");

    console.log("6. Tableau de bord et export");
    await adm.click("#btn-actualiser"); await adm.waitForTimeout(500);
    const ent = await adm.locator("#tab-entonnoir").innerText();
    const ligne = (lib) => ent.split("\n").find(l => l.startsWith(lib)) || "";
    ok(/Revenu sans rappel \(au moins 1 jour\)\s+0.*\s1 \(/.test(ligne("Revenu sans rappel (au moins 1 jour)")), "entonnoir : R = 0, S = 1 retour sans rappel → « " + ligne("Revenu sans rappel (au moins 1 jour)").replace(/\s+/g, " ") + " »");
    ok(/A fait venir un invité qui a joué\s+1/.test(ligne("A fait venir un invité qui a joué")), "entonnoir : 1 invitation effective");
    ok(/Lien ouvert sur 2 appareils ou plus\s+1/.test(ligne("⚠ Lien ouvert sur 2 appareils ou plus")), "entonnoir : 1 lien ouvert sur plusieurs appareils → " + ligne("⚠ Lien ouvert sur 2 appareils ou plus").replace(/\s+/g, " "));
    ok((await adm.locator("#tab-participants").innerText()).includes("⚠"), "participant signalé ⚠ dans le tableau");
    const res = await adm.locator("#res-grille").innerText();
    ok(res.includes("Le groupe coup de était facile"), "commentaire libre visible dans les résultats de la grille 1");
    ok(/Ont terminé\s+2/.test(res), "grille 1 : 2 parties terminées");
    const [dl] = await Promise.all([adm.waitForEvent("download"), adm.click("#btn-csv-evenements")]);
    const contenu = require("fs").readFileSync(await dl.path(), "utf8");
    ok(contenu.split("\r\n").length > 10 && contenu.includes("retour_spontane"), "export CSV des événements");
    const [dl2] = await Promise.all([adm.waitForEvent("download"), adm.click("#btn-csv-participants")]);
    ok(require("fs").readFileSync(await dl2.path(), "utf8").includes("jours_revenu_sans_rappel"), "export CSV des participants");

    console.log("6b. Chargement lent");
    const { page: pl } = await nouveau({}, true);
    let appels = 0; let liberer;
    const bloque = new Promise(r => liberer = r);
    await pl.route("**/rest/v1/rpc/q_identifier", async (route) => { appels++; await bloque; await route.continue(); });
    await pl.clock.install();
    const navLente = pl.goto(`${BASE}/?p=${C}`);
    await pl.waitForSelector("#chargement");
    await pl.clock.runFor(8500);
    ok((await pl.locator("#chargement").innerText()).includes("plus de temps que prévu"), "message après 8 s de chargement");
    ok(await pl.locator("#btn-reessayer").count() === 1, "bouton Réessayer proposé");
    await pl.click("#btn-reessayer"); await pl.clock.runFor(500);
    ok(appels === 1, "Réessayer pendant une requête en cours n'envoie pas de 2e requête (appels = " + appels + ")");
    liberer(); await navLente; await pl.waitForSelector("#btn-jouer", { timeout: 15000 }); await pl.click("#btn-jouer"); await pl.waitForSelector(".tile, #fin:not(.hidden)", { timeout: 15000 });
    ok(true, "la partie se charge quand le serveur répond enfin");
    ok(await pl.locator("#dlg-regles[open]").count() === 0 && await pl.locator("#dlg-regles .exemple-tuiles span").count() === 12, "tutoriel : exemples visuels présents (3 étapes)");

    console.log("7. Mode démo : rien n'est enregistré");
    const avant = (await db()).evenements.length;
    const { page: pd } = await nouveau();
    await aller(pd, `${BASE}/?demo=1&g=g2`, false); await pd.waitForSelector("#carte-jour");
    ok(/Intermédiaire/.test(await pd.locator("#carte-jour").innerText()) === false && /Grille 1/.test(await pd.locator("#carte-jour").innerText()), "démo : la grille 2 est verrouillée tant que la 1 n'est pas résolue → la grille 1 est proposée");
    ok(await pd.locator('#carte-grilles [data-grille="g2"][disabled]').count() === 1 && await pd.locator('#carte-grilles [data-grille="g1"]:not([disabled])').count() === 1, "démo : grille 2 verrouillée sur la carte des grilles, grille 1 ouverte");
    ok(/Facile/.test(await pd.locator("#carte-jour").innerText()), "démo : la difficulté reste visible");
    await pd.click('#nav-bas [data-ecran="stats"]'); await pd.waitForTimeout(200);
    ok(await pd.locator("#banniere-demo.hidden").count() === 1, "démo : le sélecteur de grille n'apparaît pas hors de l'accueil");
    await pd.click('#nav-bas [data-ecran="accueil"]'); await pd.waitForTimeout(200);
    await pd.click("#btn-jouer"); await pd.waitForSelector(".tile");
    if (await pd.locator("#dlg-regles[open]").count()) { await pd.click("#tuto-suiv"); await pd.click("#tuto-suiv"); await pd.click("#tuto-suiv"); }
    ok(await pd.getByRole("button", { name: "GUITARE", exact: true }).count() === 1, "la démo affiche la grille 1");
    await pd.locator(".tile").first().click(); await pd.waitForTimeout(300);
    ok((await db()).evenements.length === avant, "aucun événement enregistré en démo");

    console.log("9. Progression (XP, niveaux, objectifs, badges, stats, navigation)");
    // A a résolu g1 (facile) avec 1 erreur en quelques secondes : 50 XP + objectif Premier défi 30 + badges Première grille et Éclair 20 = 100 XP, niveau 1.
    // Même « lendemain » que le serveur pour la page de A.
    await pa.clock.install({ time: new Date(Date.now() + 86400000) });
    await aller(pa, `${BASE}/?p=${A}`, false); await pa.waitForSelector("#carte-xp");
    const txtXp = await pa.locator("#carte-xp").innerText();
    ok(/Niveau 1/i.test(txtXp) && /100 XP/.test(txtXp), "accueil de A : niveau 1, 100 XP → " + txtXp.replace(/\n/g, " | "));
    ok(/100 \/ 120 XP vers le niveau 2/.test(txtXp.replace(/\s+/g, " ")), "barre : 100 / 120 XP vers le niveau 2");
    const cj = (await pa.locator("#carte-jour").innerText()).replace(/\s+/g, " ");
    ok(/À jouer/.test(cj) && /XP à gagner/.test(cj) && !/Intermédiaire|Facile|Difficile|Jusqu'à/.test(cj), "jour 2 : carte du jour à jouer, SANS difficulté ni maximum d'XP (participant) → " + cj);
    await aller(pa, `${BASE}/?p=${A}`, true); await pa.waitForSelector(".tile");
    await aller(pa, `${BASE}/?p=${A}`, false); await pa.waitForSelector("#carte-jour");
    const objs = await pa.locator("#accueil-objectifs .objectif").count();
    ok(objs === 3, "3 objectifs affichés sur l'accueil (" + objs + ")");
    ok((await pa.locator("#accueil-objectifs").innerText()).includes("Esprit logique") && !(await pa.locator("#accueil-objectifs").innerText()).includes("Premier défi"), "l'objectif réalisé (Premier défi) a laissé la place au suivant");
    const navVisible = await pa.locator("#nav-bas:not(.hidden)").count() === 1;
    ok(navVisible, "navigation basse visible sur l'accueil");
    await pa.click('#nav-bas [data-ecran="accueil"]'); await pa.click('#accueil-parcours [data-ecran="parcours"]'); await pa.waitForSelector("#ecran-parcours:not(.hidden)");
    const parc = (await pa.locator("#ecran-parcours").innerText()).replace(/\s+/g, " ");
    ok(/Curieux.*Prochain.*il te manque 20 XP/.test(parc) && /Explorateur.*Verrouillé/.test(parc), "parcours : Curieux prochain (manque 20 XP), Explorateur verrouillé");
    await pa.click('#nav-bas [data-ecran="badges"]'); await pa.waitForSelector("#ecran-badges:not(.hidden)");
    ok((await pa.locator("#ecran-badges .grille-badges").first().locator(".badge.obtenu").count()) === 2 && (await pa.locator("#ecran-badges .grille-badges").first().locator(".badge.verrouille").count()) === 6, "badges : 2 obtenus (Première grille, Éclair), 6 à débloquer");
    await pa.click('#nav-bas [data-ecran="stats"]'); await pa.waitForSelector("#ecran-stats:not(.hidden)");
    const st = (await pa.locator("#ecran-stats").innerText()).replace(/\s+/g, " ");
    ok(/1 Grilles terminées dont 1 résolue/i.test(st) && /100 % Taux de réussite/i.test(st) && /4 Groupes trouvés/i.test(st) && /1 Erreurs/i.test(st), "stats cohérentes avec la partie : 1 terminée, 1 résolue, 100 %, 4 groupes, 1 erreur → " + st.slice(0, 160));
    await pa.click('#nav-bas [data-ecran="jeu"]'); await pa.waitForSelector(".tile");
    ok(await pa.locator("#nav-bas.hidden").count() === 1, "pendant la partie, la navigation basse s'efface (barre de jeu seule)");
    // Démo dans le même navigateur : progression séparée
    await aller(pa, `${BASE}/?demo=1&g=g1`); await pa.waitForSelector(".tile");
    if (await pa.locator("#dlg-regles[open]").count()) { await pa.click("#tuto-suiv"); await pa.click("#tuto-suiv"); await pa.click("#tuto-suiv"); }
    await jouer(pa, [0, 1, 2, 3], 0); await pa.waitForSelector("#bloc-recompenses", { timeout: 10000 });
    const rec = (await pa.locator("#bloc-recompenses").innerText()).replace(/\s+/g, " ");
    ok(/\+185 XP/.test(rec) && /Niveau supérieur/.test(rec) && /Curieux/.test(rec), "démo g1 sans faute et rapide : +185 XP (75 + 30 + 50 + 3 badges) et passage au niveau 2 → " + rec.slice(0, 120));
    // Démo g2 avec un indice, sans erreur : 75 − 15 = 60, pas de bonus sans-faute, objectif Fin limier non atteint (2 résolues)
    await aller(pa, `${BASE}/?demo=1&g=g2`); await pa.waitForSelector(".tile");
    await pa.click("#btn-indice"); await pa.waitForTimeout(200);
    for (const gi of [0, 1, 2, 3]) { for (const m of G[1].groupes[gi].mots) await pa.getByRole("button", { name: m, exact: true }).click(); await pa.getByRole("button", { name: "Valider" }).click(); await pa.waitForTimeout(100); }
    await pa.waitForSelector("#bloc-recompenses", { timeout: 10000 });
    const rec2 = (await pa.locator("#bloc-recompenses").innerText()).replace(/\s+/g, " ");
    ok(/1 indice \(−15\)/.test(rec2) && /\+60 XP/.test(rec2) && !/sans faute/.test(rec2), "démo g2 avec indice : 75 − 15 = 60 XP, pas de bonus sans-faute → " + rec2.slice(0, 140));
    ok(/Objectif : Premier défi/.test(rec) && /Objectif : Esprit logique/.test(rec) && /Badge : Sans-faute/.test(rec), "récompenses détaillées : 2 objectifs, badges");
    await aller(pa, `${BASE}/?demo=1&g=g1`, false); await pa.waitForSelector("#carte-xp");
    ok(/245 XP/.test(await pa.locator("#carte-xp").innerText()), "démo : XP conservée après rechargement (185 + 60)");
    ok(await pa.locator('#carte-grilles [data-grille="g3"]:not([disabled])').count() === 1 && await pa.locator('#carte-grilles [data-grille="g4"][disabled]').count() === 1, "démo : grilles 1 et 2 résolues → grille 3 débloquée, grille 4 encore verrouillée");
    ok(/Rejouer \(sans XP\)/.test(await pa.locator("#btn-jouer").innerText()), "démo : la grille déjà comptée propose « Rejouer (sans XP) »");
    await pa.click("#btn-jouer"); await pa.waitForSelector(".tile"); await jouer(pa, [0, 1, 2, 3], 0); await pa.waitForSelector("#fin:not(.hidden)");
    await pa.waitForTimeout(1200);
    ok(await pa.locator("#bloc-recompenses").count() === 0, "rejouer la même grille ne crédite rien (pas de bloc récompenses)");
    await aller(pa, `${BASE}/?demo=1`, false); await pa.waitForSelector("#carte-xp");
    ok(/245 XP/.test(await pa.locator("#carte-xp").innerText()), "démo : toujours 245 XP après avoir rejoué");
    await aller(pa, `${BASE}/?p=${A}`, false); await pa.waitForSelector("#carte-xp");
    ok(/100 XP/.test(await pa.locator("#carte-xp").innerText()), "la progression réelle de A (100 XP) n'a pas été touchée par la démo");
    // Réinitialisation démo
    await aller(pa, `${BASE}/?demo=1`, false); await pa.click('#nav-bas [data-ecran="stats"]'); await pa.waitForSelector("#btn-reinit"); await pa.click("#btn-reinit");
    await pa.waitForTimeout(300);
    ok((await pa.locator("#ecran-stats").innerText()).includes("apparaîtront après ta première partie"), "démo : réinitialisation → état vide propre");
    // Événement recompense tracé côté serveur pour A
    d = await db();
    const recA = d.evenements.filter(e => e.participant_id === A && e.type === "recompense");
    ok(recA.length === 1 && recA[0].donnees.xp === 100 && recA[0].donnees.objectifs.includes("premier_defi") && recA[0].donnees.badges.includes("eclair"), "trace serveur : 1 événement « recompense » pour A, xp 100, objectif premier_defi, badge eclair");

    console.log("8. Captures d'écran");
    await aller(pa, `${BASE}/?p=${A}`, false); await pa.waitForSelector("#carte-xp"); await pa.waitForTimeout(900);
    await pa.screenshot({ path: path.join(__dirname, "capture_accueil_iphone.png"), fullPage: true });
    await pa.click('#accueil-parcours [data-ecran="parcours"]'); await pa.waitForTimeout(300);
    await pa.screenshot({ path: path.join(__dirname, "capture_parcours_iphone.png"), fullPage: true });
    await pi.screenshot({ path: path.join(__dirname, "capture_jeu_iphone.png") });
    await pa.screenshot({ path: path.join(__dirname, "capture_fin_iphone.png"), fullPage: true });
    await adm.setViewportSize({ width: 1200, height: 900 });
    await adm.screenshot({ path: path.join(__dirname, "capture_admin.png"), fullPage: true });

    ok(erreursConsole.filter(e => !/401|Failed to load resource/.test(e)).length === 0, "aucune erreur JavaScript " + erreursConsole.join(" | "));
  } catch (e) { console.error(e); echecs++; }
  await browser.close(); srv.kill();
  console.log(echecs ? `\n${echecs} échec(s)` : "\nTous les tests passent.");
  process.exit(echecs ? 1 : 0);
})();
