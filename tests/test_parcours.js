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
    await pa.goto(`${BASE}/?p=${A}`);
    await pa.waitForSelector(".tile");
    ok(await pa.locator(".tile").count() === 16, "16 cartes affichées");
    const debord = await pa.evaluate(() => ({ page: document.documentElement.scrollWidth > window.innerWidth,
      cartes: [...document.querySelectorAll(".tile")].filter(t => { const a = t.firstElementChild.getBoundingClientRect(), b = t.getBoundingClientRect(); return a.left < b.left - 0.5 || a.right > b.right + 0.5; }).map(t => t.textContent) }));
    ok(!debord.page, "aucun défilement horizontal sur iPhone");
    ok(debord.cartes.length === 0, "aucun mot ne déborde de sa carte " + (debord.cartes.join(",") || ""));
    ok(await pa.locator("#dlg-regles[open]").count() === 1, "première visite : les règles s'ouvrent automatiquement");
    await pa.getByRole("button", { name: "Compris" }).click();
    await pa.getByRole("button", { name: "Règles" }).click(); await pa.waitForSelector("#dlg-regles[open]");
    await pa.getByRole("button", { name: "Compris" }).click();
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
    await pa.reload(); await pa.waitForSelector("#fin:not(.hidden)");
    ok(await pa.locator("#merci:not(.hidden)").count() === 1, "après rechargement : partie terminée conservée, pas de nouvelle partie");
    ok(pa.url().endsWith("?p=" + A), "l'adresse affichée est le lien personnel (à mettre en favori)");

    console.log("3. Joueur B (groupe S) perd après 4 erreurs");
    const { page: pb } = await nouveau({}, true);
    await pb.evaluate(() => {}).catch(() => {}); await pb.goto(`${BASE}/?p=${B}`); await pb.waitForSelector(".tile");
    await jouer(pb, [0], 0);
    // même essai deux fois : ne doit pas compter d'erreur
    const g = G[0];
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

    console.log("4. Invitation : un nouveau joueur arrive par le lien de A");
    const { page: pi } = await nouveau({}, true);
    await pi.evaluate(() => {}).catch(() => {}); await pi.goto(`${BASE}/?inv=${A}`); await pi.waitForSelector(".tile");
    await pi.locator(".tile").first().click();
    await pi.waitForTimeout(400);
    d = await db();
    const invite = d.participants.find(p => p.invite_par === A);
    ok(invite && invite.groupe === "invite", "participant « invité » créé et rattaché à A");
    ok(d.evenements.some(e => e.participant_id === invite.id && e.type === "debut"), "l'invité a commencé une partie");
    ok(d.evenements.filter(e => e.type === "visite" && e.participant_id === A).every(e => e.donnees.appareil), "identifiant d'appareil enregistré avec les visites");
    console.log("4b. Lien personnel de A ouvert depuis un autre appareil");
    const { page: px } = await nouveau({}, true);
    await px.goto(`${BASE}/?p=${A}`); await px.waitForSelector("#fin:not(.hidden), .tile"); await px.waitForTimeout(400);
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
    await pa.goto(lienRappel); await pa.waitForSelector("#fin:not(.hidden), .tile");
    await pb.goto(`${BASE}/?p=${B}`); await pb.waitForSelector("#fin:not(.hidden), .tile");
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
    liberer(); await navLente; await pl.waitForSelector(".tile, #fin:not(.hidden)", { timeout: 15000 });
    ok(true, "la partie se charge quand le serveur répond enfin");
    ok(await pl.locator("#dlg-regles[open]").count() === 0 && await pl.locator("#dlg-regles .exemple-tuiles span").count() === 4, "règles : exemple visuel à 4 mots présent");

    console.log("7. Mode démo : rien n'est enregistré");
    const avant = (await db()).evenements.length;
    const { page: pd } = await nouveau();
    await pd.goto(`${BASE}/?demo=1&g=g2`); await pd.waitForSelector(".tile");
    ok(await pd.getByRole("button", { name: "PIRATE", exact: true }).count() === 1, "la démo affiche la grille 2 demandée");
    await pd.locator(".tile").first().click(); await pd.waitForTimeout(300);
    ok((await db()).evenements.length === avant, "aucun événement enregistré en démo");

    console.log("8. Captures d'écran");
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
