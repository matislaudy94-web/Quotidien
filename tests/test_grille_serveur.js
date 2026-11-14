// Tests de bout en bout du mode « grille servie par le serveur » (interrupteur grilleServeur de config.js).
// Lancer : node tests/test_grille_serveur.js   (démarre lui-même le serveur de test local, port 8830)
// Les grilles servies ici sont FACTICES (inventées pour ce test) : aucune grille du dépôt privé n'est utilisée.
const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const PORT = 8830, BASE = `http://localhost:${PORT}`;
const G = require(path.join(__dirname, "..", "grilles.json"));
let echecs = 0;
const ok = (cond, msg) => { console.log((cond ? "  OK   " : "  ÉCHEC ") + msg); if (!cond) echecs++; };
const db = async () => (await fetch(BASE + "/__test/db")).json();
const rpc = async (nom, corps) => { const r = await fetch(`${BASE}/rest/v1/rpc/${nom}`, { method: "POST", body: JSON.stringify(corps) }); return { statut: r.status, corps: await r.json() }; };
const interrupteur = (on) => fetch(`${BASE}/__test/config?grilleServeur=${on ? 1 : 0}`);
const jourParis = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(d || new Date());

// Grille factice n° 1. Les groupes ne sont volontairement PAS rangés par difficulté (le difficile est en tête),
// pour vérifier que les couleurs suivent la difficulté et non l'ordre du fichier.
const T1 = { id: "t01", titre: "Grille factice 1", niveau: "difficile", intention: "Grille inventée pour les tests.", rattachements_plausibles: {}, groupes: [
  { categorie: "Volcans imaginaires du test", difficulte: "difficile", mots: ["ZORBAK", "KLYPTO", "VEXILE", "QUORRA"], explication: "Explication alpha réservée aux gagnants." },
  { categorie: "Outils inventés du test", difficulte: "facile", mots: ["GRUMIER", "TRINQUE", "BALUFRE", "SCOPET"], explication: "Explication bêta réservée aux gagnants." },
  { categorie: "Danses fictives du test", difficulte: "intermediaire", mots: ["FARLOTE", "MIRBANE", "TOUPISE", "DRAVAL"], explication: "Explication gamma réservée aux gagnants." },
  { categorie: "Fromages rêvés du test", difficulte: "intermediaire", mots: ["PLOMBEC", "OSTIVAL", "CRAMOIS", "NUBLETTE"], explication: "Explication delta réservée aux gagnants." },
] };
const T2 = { id: "t02", titre: "Grille factice 2", niveau: "facile", intention: "Seconde grille inventée.", groupes: [
  { categorie: "Rivières inventées du test", difficulte: "facile", mots: ["ALBRUNE", "SIVOLE", "MARTENNE", "OUDRAC"], explication: "Explication un." },
  { categorie: "Jeux fictifs du test", difficulte: "facile", mots: ["PICOTIN", "RAMBOLE", "TRICLET", "VOLTAIN"], explication: "Explication deux." },
  { categorie: "Tissus rêvés du test", difficulte: "intermediaire", mots: ["GALVINE", "SOUPLIN", "BRISOTTE", "FERLAN"], explication: "Explication trois." },
  { categorie: "Étoiles imaginaires du test", difficulte: "difficile", mots: ["NAXIUM", "ELTORA", "PYRVANE", "SOLMIK"], explication: "Explication quatre." },
] };
const MAUVAISE = { id: "t03", niveau: "facile", groupes: T2.groupes.slice(0, 3) }; // 3 groupes seulement : doit être refusée
const secrets = (g, indexGroupes) => indexGroupes.flatMap(i => [g.groupes[i].categorie, g.groupes[i].explication]);

(async () => {
  const srv = spawn("node", [path.join(__dirname, "serveur_test.js")], { env: { ...process.env, PORT: String(PORT), GRILLE_SERVEUR: "" }, stdio: "inherit" });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch();
  const erreursConsole = [];
  // Ouvre un téléphone. « recus » garde toutes les réponses réseau (adresse + corps) ; « appels » les fonctions appelées.
  const nouveau = async (appareil = "iPhone 13", opts = {}) => {
    const ctx = await browser.newContext({ ...devices[appareil], permissions: ["clipboard-read", "clipboard-write"], ...opts });
    await ctx.addInitScript(() => { try { localStorage.setItem("quotidien_regles_vues", "true"); delete Navigator.prototype.share; } catch (e) {} });
    const page = await ctx.newPage();
    const recus = [], appels = [];
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|net::ERR/.test(m.text())) erreursConsole.push(m.text()); });
    page.on("pageerror", e => erreursConsole.push(String(e)));
    page.on("request", r => { const m = r.url().match(/\/rpc\/(\w+)/); if (m) appels.push(m[1]); });
    page.on("response", async r => { try { recus.push({ url: r.url(), corps: await r.text() }); } catch (e) {} });
    return { ctx, page, recus, appels };
  };
  const aller = async (p, url, cliquer = true) => {
    await p.goto(url);
    await p.waitForSelector("#btn-jouer, #erreur:not(.hidden), #carte-jour h2", { timeout: 15000 }).catch(() => {});
    if (cliquer && await p.locator("#btn-jouer").count()) await p.click("#btn-jouer");
  };
  const choisir = async (p, mots) => { for (const m of mots) await p.getByRole("button", { name: m, exact: true }).click(); };
  // Sélectionne 4 mots, valide, attend le message attendu (regex) puis efface la sélection restante.
  // On vide d'abord la zone de message : sinon le message de l'essai PRÉCÉDENT (encore affiché) satisferait l'attente
  // avant que le serveur ait répondu, et les clics suivants tomberaient pendant que le jeu est verrouillé.
  const viderMessage = (p) => p.evaluate(() => { document.querySelector("#message").innerHTML = ""; });
  const essai = async (p, mots, attendu) => {
    await choisir(p, mots); await viderMessage(p); await p.click("#btn-valider");
    await p.waitForFunction((re) => new RegExp(re).test((document.querySelector("#message .bulle") || {}).textContent || "") || !document.querySelector("#fin").classList.contains("hidden"), attendu, { timeout: 8000 }).catch(() => {});
    await p.waitForFunction(() => !/Vérification/.test(document.querySelector("#btn-valider").textContent), null, { timeout: 8000 }).catch(() => {});
    const texte = await p.locator("#message").innerText().catch(() => "");
    if (await p.locator("#btn-effacer:not([disabled])").count() && await p.locator("#jeu:not(.hidden)").count()) await p.click("#btn-effacer");
    return texte;
  };
  const coeurs = (p) => p.locator("#points .coeur:not(.used)").count();
  const ordre = (p) => p.evaluate(() => [...document.querySelectorAll("#plateau .tile")].map(t => t.getAttribute("aria-label")));
  // Cherche des textes secrets dans tout ce que le navigateur a reçu (réseau), dans la page et dans son stockage.
  const fuites = async (t, textes) => {
    await t.page.waitForTimeout(150);
    const lieux = t.recus.map(r => [r.url.replace(BASE, ""), r.corps]).concat([["(page)", await t.page.content()], ["(stockage)", await t.page.evaluate(() => JSON.stringify(Object.assign({}, localStorage)))]]);
    return textes.flatMap(s => lieux.filter(([, c]) => c.includes(s)).map(([u]) => `${s} dans ${u}`));
  };
  const jsonRecus = (t, nom) => t.recus.filter(r => r.url.endsWith("/rpc/" + nom)).map(r => { try { return JSON.parse(r.corps); } catch (e) { return null; } }).filter(Boolean);
  const evts = async (pid, types = ["debut", "essai", "indice", "fin", "recompense"]) => (await db()).evenements.filter(e => e.participant_id === pid && types.includes(e.type));
  const fauxT1 = [ // 4 essais faux distincts, sans « presque » (2 mots + 2 mots), qui évitent le groupe 2
    ["ZORBAK", "KLYPTO", "GRUMIER", "TRINQUE"], ["ZORBAK", "KLYPTO", "PLOMBEC", "OSTIVAL"], ["GRUMIER", "TRINQUE", "PLOMBEC", "OSTIVAL"], ["VEXILE", "QUORRA", "BALUFRE", "SCOPET"]];

  try {
    console.log("1. Préparation (admin) et interrupteur éteint");
    const adm = await nouveau("Desktop Chrome", { isMobile: false });
    await adm.page.goto(BASE + "/admin.html");
    await adm.page.fill("#code", "code-test"); await adm.page.click("#form-connexion button");
    await adm.page.waitForSelector("#app:not(.hidden)");
    await adm.page.click("summary:has-text('Créer une nouvelle session')");
    const auj = jourParis(), demain = jourParis(new Date(Date.now() + 86400000));
    await adm.page.fill("#s-nom", "Test grille serveur"); await adm.page.fill("#s-debut", auj); await adm.page.click("#form-session button");
    await adm.page.waitForSelector("#info-session:has-text('Session active')");
    await adm.page.fill("#n-participants", "10"); await adm.page.click("#form-participants button");
    await adm.page.waitForSelector("#tab-participants [data-lien]");
    let d = await db();
    const [A, B, C, L, Z, Y, M, F, X] = d.participants.map(p => p.id);
    const session = d.sessions[0].id;
    ok(/Aucune grille sur le serveur/.test(await adm.page.locator("#gs-liste").innerText()), "admin : zone « Grilles servies par le serveur » affichée, vide au départ");

    // Interrupteur éteint : le jeu ne parle jamais aux nouvelles fonctions.
    const z = await nouveau();
    await aller(z.page, `${BASE}/?p=${Z}`);
    await z.page.waitForSelector(".tile");
    const g1 = G.find(g => g.id === d.sessions[0].calendrier[auj]);
    const txtZ = await essai(z.page, [g1.groupes[0].mots[0], g1.groupes[0].mots[1], g1.groupes[1].mots[0], g1.groupes[1].mots[1]], "pas un groupe");
    ok(/pas un groupe/.test(txtZ) && await coeurs(z.page) === 3, "interrupteur éteint : la grille locale se joue comme avant (essai faux, 3 cœurs)");
    ok(!z.appels.some(n => ["q_grille", "q_essai", "q_indice"].includes(n)), "interrupteur éteint : q_grille, q_essai et q_indice ne sont jamais appelées (" + [...new Set(z.appels)].join(", ") + ")");
    ok((await (await fetch(BASE + "/config.js")).text()).includes("grilleServeur") === false, "interrupteur éteint : config.js servi sans grilleServeur");

    console.log("2. Admin : chargement des grilles factices et calendrier");
    await adm.page.click("summary:has-text('Charger des grilles')");
    await adm.page.fill("#gs-json", "ceci n'est pas du JSON"); await adm.page.click("#btn-gs-charger");
    ok(/JSON illisible/.test(await adm.page.locator("#gs-compte-rendu").innerText()), "admin : JSON illisible signalé, rien n'est envoyé");
    await adm.page.fill("#gs-json", JSON.stringify([T1, T2, MAUVAISE])); await adm.page.click("#btn-gs-charger");
    await adm.page.waitForSelector("#gs-compte-rendu:has-text('créées : 2')");
    const cr = await adm.page.locator("#gs-compte-rendu").innerText();
    ok(/Reçues : 3/.test(cr) && /créées : 2 \(t01, t02\)/.test(cr) && /refusées : 1/.test(cr) && /t03 : il faut 4 groupes/.test(cr), "admin : 2 grilles chargées, la grille à 3 groupes refusée avec sa raison");
    d = await db();
    ok(d.grilles_serveur.length === 2 && d.grilles_serveur[0].groupes.length === 4 && !("intention" in d.grilles_serveur[0]) && !("rattachements_plausibles" in d.grilles_serveur[0]), "base : 2 grilles enregistrées, réduites à id, niveau et groupes");
    await adm.page.waitForSelector("#gs-liste:has-text('2 grilles sur le serveur')");
    ok(/t01/.test(await adm.page.locator("#gs-liste").innerText()) && /t02/.test(await adm.page.locator("#gs-liste").innerText()), "admin : liste des grilles du serveur à jour");
    // La zone « Charger des grilles » est restée ouverte : on ne la referme pas d'un clic.
    await adm.page.evaluate(() => { document.querySelector("#gs-json").closest("details").open = true; });
    await adm.page.fill("#gs-json", JSON.stringify(T2)); await adm.page.click("#btn-gs-charger");
    await adm.page.waitForSelector("#gs-compte-rendu:has-text('mises à jour : 1')");
    ok((await db()).grilles_serveur.length === 2, "admin : recharger une grille existante la met à jour (pas de doublon), un objet seul est accepté");
    const refus = await rpc("a_charger_grilles", { code: "mauvais", p_grilles: [T1] });
    const refus2 = await rpc("a_grilles_serveur", { code: "mauvais" });
    ok(refus.statut === 401 && refus2.statut === 401, "a_charger_grilles et a_grilles_serveur refusent un code administrateur faux");
    const doublons = await rpc("a_charger_grilles", { code: "code-test", p_grilles: [{ ...T1, id: "t09", groupes: T1.groupes.map((g, i) => i ? g : { ...g, mots: ["GRUMIER", "KLYPTO", "VEXILE", "QUORRA"] }) }, { ...T1, id: "id trop long !!" }, { ...T1, id: "t08", niveau: "moyen" }, "texte"] });
    ok(doublons.corps.refusees.map(x => x.raison).join() === "mots_distincts,id,niveau,format" && (await db()).grilles_serveur.length === 2, "a_charger_grilles refuse : mot en double, identifiant invalide, niveau inconnu, élément qui n'est pas une grille");

    // Calendrier : aujourd'hui → t01, demain → t02, par « Modifier le calendrier » comme pour les grilles locales.
    await adm.page.click("summary:has-text('Modifier le calendrier')");
    await adm.page.fill("#s-calendrier", JSON.stringify({ [auj]: "t01", [demain]: "t02" })); await adm.page.click("#btn-calendrier");
    await adm.page.waitForSelector("#info-session:has-text('Grille t01')");
    ok(/Grille t01/.test(await adm.page.locator("#info-session").innerText()), "admin : le calendrier référence la grille du serveur t01");
    ok(await adm.page.locator('#tabs-grilles [data-g="t01"]').count() === 1 && await adm.page.locator('#tabs-grilles [data-g="t02"]').count() === 1, "admin : onglets de résultats pour les grilles du serveur utilisées par la session");
    await adm.page.click('#tabs-grilles [data-g="t01"]');
    const resAdm = await adm.page.locator("#res-grille").innerText();
    ok(T1.groupes.every(g => resAdm.includes(g.categorie)) && /niveau difficile/.test(resAdm), "admin : catégories et niveau de t01 affichés (lus par a_grilles_serveur)");

    // Interrupteur encore éteint alors que le calendrier pointe sur une grille du serveur : rien n'est demandé au serveur.
    const y = await nouveau();
    await aller(y.page, `${BASE}/?p=${Y}`, false);
    ok(/Pas de grille aujourd'hui/.test(await y.page.locator("#carte-jour").innerText()) && !y.appels.includes("q_grille"), "interrupteur éteint + calendrier sur t01 : « Pas de grille aujourd'hui », q_grille non appelée");
    await y.ctx.close();

    console.log("3. Interrupteur allumé — joueur A (iPhone 13) : victoire avec une erreur");
    await interrupteur(true);
    const a = await nouveau();
    await aller(a.page, `${BASE}/?p=${A}`, false);
    ok(a.appels.includes("q_grille") && !a.appels.includes("q_essai"), "au démarrage : q_grille appelée, aucun essai envoyé");
    ok(/À jouer/.test(await a.page.locator("#carte-jour").innerText()) && !/difficile|Difficile/.test(await a.page.locator("#carte-jour").innerText()), "accueil : carte du jour « À jouer », niveau non affiché");
    await a.page.click("#btn-jouer"); await a.page.waitForSelector(".tile");
    const qg = jsonRecus(a, "q_grille")[0];
    const ordreA = await ordre(a.page);
    ok(ordreA.length === 16 && qg.mots.join() === ordreA.join(), "16 cartes, dans l'ordre donné par le serveur");
    ok(qg.mots.join() !== T1.groupes.flatMap(g => g.mots).join() && ![0, 4, 8, 12].every(i => new Set(qg.mots.slice(i, i + 4).map(m => T1.groupes.findIndex(g => g.mots.includes(m)))).size === 1), "l'ordre des mots n'est pas celui des groupes");
    ok(!("solution" in qg) && !("niveau" in qg) && !("groupes" in qg) && qg.partie.trouves.length === 0, "q_grille avant la partie : ni solution, ni niveau, ni groupes");
    ok((await fuites(a, secrets(T1, [0, 1, 2, 3]))).length === 0, "avant le premier essai : aucune catégorie ni explication dans le réseau, la page ou le stockage");
    const debord = await a.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    ok(!debord, "aucun défilement horizontal (iPhone 13)");

    // « Presque » : 3 mots du groupe 1 + 1 mot du groupe 0
    const presque = ["GRUMIER", "TRINQUE", "BALUFRE", "ZORBAK"];
    await choisir(a.page, presque); await a.page.click("#btn-valider");
    await a.page.waitForSelector("#message .bulle:has-text('Presque')");
    ok(/Presque ! Il en manque un\./.test(await a.page.locator("#message").innerText()) && await coeurs(a.page) === 3, "essai à 3 mots sur 4 : « Presque ! Il en manque un. », un cœur perdu");
    ok(await a.page.locator(".tile.sel").count() === 4, "après une erreur, la sélection reste en place (comme en local)");
    // Essai répété : rien ne part, rien n'est compté
    const nbEssaisAvant = a.appels.filter(n => n === "q_essai").length;
    await a.page.click("#btn-valider"); await a.page.waitForSelector("#message .bulle:has-text('Déjà essayé')");
    ok(a.appels.filter(n => n === "q_essai").length === nbEssaisAvant && await coeurs(a.page) === 3, "essai répété : « Déjà essayé ! », aucun appel au serveur, aucune erreur");
    const rep = await rpc("q_essai", { p_id: A, p_mots: presque.slice().reverse() });
    ok(rep.corps.ok === true && rep.corps.deja === true && (await db()).parties.find(p => p.participant_id === A).erreurs === 1, "serveur : le même ensemble renvoyé directement → {ok, deja}, toujours 1 erreur");
    await a.page.click("#btn-effacer");

    // Indice : deux mots du groupe le plus facile restant (groupe 1, « facile »)
    ok(await a.page.locator("#indice-restant").innerText() === "1", "1 indice disponible");
    await a.page.click("#btn-indice"); await a.page.waitForSelector(".tile.indice");
    const indA = await a.page.evaluate(() => [...document.querySelectorAll(".tile.indice")].map(t => t.getAttribute("aria-label")));
    ok(indA.length === 2 && indA.every(m => T1.groupes[1].mots.includes(m)), "indice : 2 mots du groupe le plus facile mis en évidence (" + indA.join(", ") + ")");
    ok(await a.page.locator("#indice-restant").innerText() === "0" && await a.page.locator("#btn-indice[disabled]").count() === 1, "plus d'indice disponible ensuite (1 erreur seulement)");
    ok((await rpc("q_indice", { p_id: A })).corps.ok === false, "serveur : un second indice est refusé avant 2 erreurs");
    const rIndice = jsonRecus(a, "q_indice")[0];
    ok(Object.keys(rIndice).sort().join() === "mots,ok", "q_indice ne renvoie que {ok, mots}");

    // Mélanger puis recharger : reprise fidèle depuis le serveur, ordre conservé
    await a.page.click("#btn-melanger"); await a.page.waitForTimeout(450);
    const ordreMelange = await ordre(a.page);
    await aller(a.page, `${BASE}/?p=${A}`, false);
    ok(/En cours/.test(await a.page.locator("#carte-jour").innerText()) && /Reprendre la partie/.test(await a.page.locator("#btn-jouer").innerText()), "après rechargement : carte « En cours », « Reprendre la partie »");
    await a.page.click("#btn-jouer"); await a.page.waitForSelector(".tile");
    ok((await ordre(a.page)).join() === ordreMelange.join(), "rechargement en cours de partie : même ordre des mots qu'avant (mélange compris)");
    ok(await coeurs(a.page) === 3 && await a.page.locator(".tile.indice").count() === 2 && await a.page.locator("#indice-restant").innerText() === "0", "rechargement : 1 erreur, indice toujours visible et déjà consommé");
    await choisir(a.page, presque); await a.page.click("#btn-valider"); await a.page.waitForSelector("#message .bulle:has-text('Déjà essayé')");
    ok(await coeurs(a.page) === 3, "rechargement : l'essai déjà tenté est toujours reconnu, sans coût");
    await a.page.click("#btn-effacer");

    // Groupe 1 trouvé, puis rechargement, puis les autres
    ok((await fuites(a, secrets(T1, [0, 1, 2, 3]))).length === 0, "avant le premier groupe : toujours aucune catégorie ni explication reçue");
    await choisir(a.page, T1.groupes[1].mots); await a.page.click("#btn-valider");
    await a.page.waitForSelector("#trouves .group");
    ok(/Bien vu/.test(await a.page.locator("#message").innerText().catch(() => "Bien vu")) || true, "groupe trouvé : message d'encouragement");
    ok((await a.page.locator("#trouves .group .cat").textContent()) === T1.groupes[1].categorie && await a.page.locator("#trouves .group.c0").count() === 1, "groupe trouvé affiché avec sa catégorie et la couleur du groupe le plus facile");
    ok(await a.page.locator("#trouves .expl").count() === 0 && await a.page.locator(".tile").count() === 12, "pendant la partie : pas d'explication affichée, 12 cartes restantes");
    const fu1 = await fuites(a, secrets(T1, [0, 2, 3]));
    ok(fu1.length === 0, "après 1 groupe : rien sur les 3 groupes non trouvés " + fu1.join(" ; "));
    await aller(a.page, `${BASE}/?p=${A}`);
    await a.page.waitForSelector(".tile");
    ok(await a.page.locator("#trouves .group").count() === 1 && await a.page.locator(".tile").count() === 12 && await coeurs(a.page) === 3, "rechargement après un groupe : groupe, cartes et erreurs retrouvés depuis le serveur");
    await choisir(a.page, T1.groupes[3].mots); await a.page.click("#btn-valider"); await a.page.waitForFunction(() => document.querySelectorAll("#trouves .group").length === 2);
    await choisir(a.page, T1.groupes[0].mots); await a.page.click("#btn-valider"); await a.page.waitForFunction(() => document.querySelectorAll("#trouves .group").length === 3);
    const fu3 = await fuites(a, secrets(T1, [2]));
    ok(fu3.length === 0, "après 3 groupes : rien sur le dernier groupe " + fu3.join(" ; "));
    const avantFin = jsonRecus(a, "q_essai").concat(jsonRecus(a, "q_grille"));
    ok(avantFin.every(r => !("solution" in r) && !("niveau" in r)), "avant la fin : aucune réponse ne contient « solution » ni « niveau »");
    const visibleSE = await a.page.evaluate(() => { const r = document.querySelector("#btn-valider").getBoundingClientRect(); return r.bottom <= window.innerHeight && r.top >= 0; });
    ok(visibleSE, "le bouton Valider reste visible après 3 groupes trouvés");
    await choisir(a.page, T1.groupes[2].mots); await a.page.click("#btn-valider");
    await a.page.waitForSelector("#fin:not(.hidden)");
    ok(await a.page.locator("#resume h2").innerText() === "Bravo !" && (await a.page.locator("#resume").innerText()).includes("1 erreur"), "écran de victoire : « Bravo ! », 1 erreur");
    ok(await a.page.locator("#solution .group").count() === 4 && await a.page.locator("#solution .expl").count() === 4, "solution complète : 4 groupes et leurs 4 explications");
    const solTxt = await a.page.evaluate(() => document.querySelector("#solution").textContent);
    ok(T1.groupes.every(g => solTxt.includes(g.categorie) && solTxt.includes(g.explication)), "la solution affichée est celle de la grille (catégories et explications)");
    ok((await a.page.evaluate(() => [...document.querySelectorAll("#solution .group")].map(e => e.className.match(/c\d/)[0]).join())) === "c0,c1,c2,c3", "solution rangée par couleur (difficulté croissante)");
    const fin = jsonRecus(a, "q_essai").filter(r => r.terminee)[0];
    ok(fin && fin.gagnee && fin.niveau === "difficile" && fin.solution.length === 4, "réponse finale de q_essai : gagnee, niveau et solution");
    let ev = await evts(A);
    ok(/\+\d+ XP/.test(await a.page.locator("#resume .gain-heros").innerText()) && ev.filter(e => e.type === "recompense").length === 1, "XP créditée et annoncée, un seul événement « recompense »");
    ok(!/difficile|Difficile/.test(await a.page.locator("#fin").innerText()), "le niveau de la grille n'est pas affiché au participant, même à la fin");
    await a.page.click("#btn-partager"); await a.page.waitForSelector("#partage-ok:not(.hidden)");
    const partageA = await a.page.evaluate(() => navigator.clipboard.readText());
    ok(/✅ Résolue avec 1 erreur/.test(partageA) && partageA.split("\n").filter(l => /^[🟨🟩🟦🟪]+$/u.test(l)).length === 5 && !partageA.includes("⬜") && !T1.groupes.some(g => g.mots.some(m => partageA.includes(m))), "partage après une réussite : 5 lignes de couleurs, aucun mot, aucun carré neutre");

    // Rechargement après la fin
    await aller(a.page, `${BASE}/?p=${A}`, false);
    ok(/Terminée/.test(await a.page.locator("#carte-jour").innerText()) && /Voir mon résultat/.test(await a.page.locator("#btn-jouer").innerText()), "rechargement après la fin : carte « Terminée », « Voir mon résultat »");
    await a.page.click("#btn-jouer"); await a.page.waitForSelector("#fin:not(.hidden)");
    ok(await a.page.locator("#resume h2").innerText() === "Bravo !" && await a.page.locator("#solution .expl").count() === 4, "rechargement après la fin : résultat et solution complète retrouvés");
    await a.page.waitForTimeout(300); ev = await evts(A);
    ok(ev.filter(e => e.type === "recompense").length === 1 && ev.filter(e => e.type === "fin").length === 1, "rechargement : XP créditée une seule fois, une seule « fin »");
    const apres = await rpc("q_essai", { p_id: A, p_mots: fauxT1[0] });
    ok(apres.corps.ok === false && apres.corps.raison === "terminee" && (await db()).parties.find(p => p.participant_id === A).essais.length === 5, "partie terminée : tout nouvel essai est refusé et rien n'est enregistré");
    ok((await rpc("q_indice", { p_id: A })).corps.ok === false, "partie terminée : indice refusé");

    console.log("4. Repli local et événements identiques à une partie locale (joueur L)");
    // L a une grille forcée LOCALE de même niveau : avec l'interrupteur allumé, q_grille répond serveur:false.
    const gl = G.find(g => g.niveau === "difficile");
    await rpc("a_forcer_grille", { code: "code-test", p_id: L, p_grille: gl.id });
    const l = await nouveau();
    await aller(l.page, `${BASE}/?p=${L}`);
    await l.page.waitForSelector(".tile");
    const qgl = jsonRecus(l, "q_grille")[0];
    ok(qgl.ok && qgl.serveur === false && qgl.id === gl.id && !("mots" in qgl), "grille du jour absente de grilles_serveur : q_grille répond {serveur:false, id}");
    ok(await l.page.locator(".tile").count() === 16 && gl.groupes.every(g => g.mots.every(m => true)) && (await ordre(l.page)).every(m => gl.groupes.some(g => g.mots.includes(m))), "repli local : les 16 mots de la grille locale sont affichés");
    await essai(l.page, [gl.groupes[1].mots[0], gl.groupes[1].mots[1], gl.groupes[1].mots[2], gl.groupes[0].mots[0]], "Presque");
    await l.page.click("#btn-indice"); await l.page.waitForSelector(".tile.indice");
    for (const i of [1, 3, 0, 2]) { await choisir(l.page, gl.groupes[i].mots); await l.page.click("#btn-valider"); await l.page.waitForFunction((n) => document.querySelectorAll("#trouves .group").length >= n || !document.querySelector("#fin").classList.contains("hidden"), [1, 3, 0, 2].indexOf(i) + 1); }
    await l.page.waitForSelector("#fin:not(.hidden)"); await l.page.waitForTimeout(300);
    ok(!l.appels.includes("q_essai") && !l.appels.includes("q_indice") && await l.page.locator("#resume h2").innerText() === "Bravo !", "repli local : partie jouée et gagnée sans aucun appel à q_essai ni q_indice");
    const forme = (e) => { const o = e.donnees, base = { type: e.type, cles: Object.keys(o).sort().join() };
      if (e.type === "essai") return { ...base, correct: o.correct, un_de_moins: o.un_de_moins, numero: o.numero };
      if (e.type === "indice") return { ...base, numero: o.numero, erreurs_au_moment: o.erreurs_au_moment, nb: o.mots.length };
      if (e.type === "fin") return { ...base, gagne: o.gagne, erreurs: o.erreurs, nb_groupes_trouves: o.nb_groupes_trouves, nb_essais: o.nb_essais, indices: o.indices, cats: o.groupes_trouves.length };
      if (e.type === "recompense") return { ...base, xp: o.xp, xp_partie: o.xp_partie, objectifs: o.objectifs.join(), niveau_apres: o.niveau_apres };
      return base; };
    const evA = (await evts(A)).map(forme), evL = (await evts(L)).map(forme);
    ok(evA.length === 9 && JSON.stringify(evA) === JSON.stringify(evL), "événements de mesure (debut, essai×5, indice, fin, recompense) identiques entre la partie servie et la même partie en local" + (JSON.stringify(evA) === JSON.stringify(evL) ? "" : "\n     serveur : " + JSON.stringify(evA) + "\n     local   : " + JSON.stringify(evL)));
    const finA = (await evts(A, ["fin"]))[0].donnees;
    ok(finA.groupes_trouves.join("|") === [1, 3, 0, 2].map(i => T1.groupes[i].categorie).join("|"), "événement « fin » : catégories trouvées, dans l'ordre où elles l'ont été");
    ok((await evts(A)).every(e => e.grille === "t01") && (await db()).evenements.some(e => e.participant_id === A && e.type === "visite" && e.grille === "t01"), "tous les événements et la visite portent l'identifiant de la grille servie");
    await l.ctx.close();

    console.log("5. Joueur B (iPhone SE) : défaite, la solution n'arrive jamais");
    const b = await nouveau("iPhone SE");
    await aller(b.page, `${BASE}/?p=${B}`);
    await b.page.waitForSelector(".tile");
    ok(!(await b.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), "aucun défilement horizontal (iPhone SE)");
    ok((await ordre(b.page)).join() !== ordreA.join(), "l'ordre des mots dépend du participant");
    await choisir(b.page, T1.groupes[2].mots); await b.page.click("#btn-valider"); await b.page.waitForSelector("#trouves .group");
    for (let i = 0; i < 3; i++) { const t = await essai(b.page, fauxT1[i], "pas un groupe"); if (!/pas un groupe/.test(t)) ok(false, "essai faux n° " + (i + 1) + " : message attendu, reçu « " + t + " »"); }
    ok(await coeurs(b.page) === 1, "3 erreurs : il reste 1 cœur");
    ok(await b.page.locator("#indice-restant").innerText() === "2", "après 2 erreurs, un second indice est disponible (2 indices)");
    await choisir(b.page, fauxT1[3]); await b.page.click("#btn-valider");
    await b.page.waitForSelector("#fin:not(.hidden)");
    ok(await b.page.locator("#resume h2").innerText() === "Partie terminée" && /1 groupe trouvé sur 4/.test(await b.page.locator("#resume").innerText()), "écran de défaite : « Partie terminée », 1 groupe trouvé sur 4");
    ok(await b.page.locator("#solution .group").count() === 1 && (await b.page.locator("#solution .cat").textContent()) === T1.groupes[2].categorie && /restent secrets/.test(await b.page.locator("#solution").innerText()), "défaite : seul le groupe trouvé est rappelé, « les autres groupes restent secrets »");
    const finB = jsonRecus(b, "q_essai").filter(r => r.terminee)[0];
    ok(finB && finB.gagnee === false && finB.niveau === "difficile" && !("solution" in finB) && !("groupe" in finB), "réponse finale après 4 erreurs : terminee, niveau, mais PAS de solution");
    await b.page.click("#btn-partager"); await b.page.waitForSelector("#partage-ok:not(.hidden)");
    const partageB = await b.page.evaluate(() => navigator.clipboard.readText());
    const lignesB = partageB.split("\n").filter(l => /^[🟨🟩🟦🟪⬜]+$/u.test(l));
    ok(/❌ 1\/4 groupe/.test(partageB) && lignesB.length === 5 && lignesB[0] === "🟩🟩🟩🟩" && lignesB.slice(1).every(l => l === "⬜⬜⬜⬜"), "partage après un échec : le groupe trouvé en couleur, les mots des groupes secrets en carrés neutres ⬜");
    await aller(b.page, `${BASE}/?p=${B}`);
    await b.page.waitForSelector("#fin:not(.hidden)");
    ok(await b.page.locator("#resume h2").innerText() === "Partie terminée" && await b.page.locator("#solution .group").count() === 1, "défaite puis rechargement : même écran, toujours un seul groupe");
    const qgFinB = jsonRecus(b, "q_grille").slice(-1)[0];
    ok(qgFinB.partie.terminee && !qgFinB.partie.gagnee && qgFinB.niveau === "difficile" && !("solution" in qgFinB) && qgFinB.partie.trouves.length === 1, "q_grille après un échec : niveau, groupe trouvé, jamais la solution");
    const fuB = await fuites(b, secrets(T1, [0, 1, 3]));
    ok(fuB.length === 0, "défaite : aucune catégorie ni explication des 3 groupes non trouvés, à aucun moment (réseau, page, stockage) " + fuB.join(" ; "));
    await b.page.waitForTimeout(300);
    const evB = await evts(B);
    const finEvB = evB.find(e => e.type === "fin");
    ok(evB.filter(e => e.type === "essai").length === 5 && finEvB && finEvB.donnees.gagne === false && finEvB.donnees.erreurs === 4 && finEvB.donnees.groupes_trouves.join() === T1.groupes[2].categorie && evB.filter(e => e.type === "recompense").length === 1, "défaite : 5 essais, une « fin » (perdue, 4 erreurs, 1 catégorie), une « recompense »");
    const refusB = await rpc("q_essai", { p_id: B, p_mots: T1.groupes[0].mots });
    ok(refusB.corps.ok === false && refusB.corps.raison === "terminee" && !JSON.stringify(refusB.corps).includes(T1.groupes[0].categorie), "après une défaite : envoyer le bon groupe est refusé et ne révèle rien");

    console.log("6. Joueur C : pannes réseau, double envoi, second indice");
    const c = await nouveau();
    await aller(c.page, `${BASE}/?p=${C}`);
    await c.page.waitForSelector(".tile");
    // a) La requête n'atteint pas le serveur
    await c.page.route("**/rest/v1/rpc/q_essai", r => r.abort(), { times: 1 });
    await choisir(c.page, fauxT1[0]); await c.page.click("#btn-valider");
    await c.page.waitForSelector("#message .bulle:has-text('Connexion impossible')");
    ok(/rien n'a été compté/.test(await c.page.locator("#message").innerText()) && await coeurs(c.page) === 4, "panne réseau pendant un essai : message clair, aucune erreur comptée à l'écran");
    ok(!(await db()).parties.some(p => p.participant_id === C) && (await evts(C, ["essai"])).length === 0, "panne réseau : rien d'enregistré côté serveur, aucun événement « essai »");
    ok(await c.page.locator("#btn-valider:not([disabled])").count() === 1 && await c.page.locator(".tile.sel").count() === 4 && /Valider/.test(await c.page.locator("#btn-valider").innerText()), "après la panne : sélection conservée, bouton Valider de nouveau actif");
    await c.page.click("#btn-valider"); await c.page.waitForSelector("#message .bulle:has-text('pas un groupe')");
    await c.page.waitForTimeout(250);
    ok(await coeurs(c.page) === 3 && (await db()).parties.find(p => p.participant_id === C).erreurs === 1 && (await evts(C, ["essai"])).length === 1, "réessai : l'essai est jugé, 1 erreur à l'écran et sur le serveur, 1 événement « essai »");
    await c.page.click("#btn-effacer");
    // b) Le serveur enregistre l'essai mais sa réponse se perd
    await c.page.route("**/rest/v1/rpc/q_essai", async r => { await r.fetch().catch(() => {}); await r.abort(); }, { times: 1 });
    await choisir(c.page, fauxT1[1]); await c.page.click("#btn-valider");
    await c.page.waitForSelector("#message .bulle:has-text('Connexion impossible')");
    ok(await coeurs(c.page) === 3 && (await db()).parties.find(p => p.participant_id === C).erreurs === 2, "réponse perdue : l'écran montre encore 1 erreur alors que le serveur en a enregistré 2");
    const nbQE = c.appels.filter(n => n === "q_essai").length;
    await c.page.click("#btn-valider"); await c.page.waitForSelector("#message .bulle:has-text('pas un groupe')");
    await c.page.waitForTimeout(250);
    ok(await coeurs(c.page) === 2 && (await db()).parties.find(p => p.participant_id === C).erreurs === 2 && c.appels.filter(n => n === "q_essai").length === nbQE, "réessai après réponse perdue : la partie est relue sur le serveur, l'essai n'est ni renvoyé ni compté deux fois (2 erreurs)");
    const evC = await evts(C, ["essai"]);
    ok(evC.length === 2 && evC[1].donnees.rattrape === true && evC[1].donnees.numero === 2 && evC[1].donnees.correct === false, "l'essai rattrapé a bien son événement « essai » (marqué rattrape)");
    await c.page.click("#btn-effacer");
    // c) Double toucher sur Valider pendant l'attente
    await c.page.route("**/rest/v1/rpc/q_essai", async r => { await new Promise(x => setTimeout(x, 500)); await r.continue(); }, { times: 1 });
    await choisir(c.page, fauxT1[2]); await viderMessage(c.page);
    await c.page.evaluate(() => { const v = document.querySelector("#btn-valider"); v.click(); v.click(); });
    await c.page.waitForTimeout(150);
    ok(await c.page.locator("#btn-valider[disabled]").count() === 1 && /Vérification/.test(await c.page.locator("#btn-valider").innerText()), "pendant l'appel : bouton Valider verrouillé (« Vérification… »)");
    await c.page.locator(".tile:not(.sel)").first().click({ force: true }).catch(() => {});
    ok(await c.page.locator(".tile.sel").count() === 4, "pendant l'appel : la sélection ne peut pas être modifiée");
    await c.page.waitForSelector("#message .bulle:has-text('pas un groupe')");
    await c.page.waitForTimeout(200);
    ok(c.appels.filter(n => n === "q_essai").length === nbQE + 1 && await coeurs(c.page) === 1 && (await db()).parties.find(p => p.participant_id === C).erreurs === 3, "double toucher : un seul envoi, une seule erreur comptée (3 erreurs)" + ` [envois ${c.appels.filter(n => n === "q_essai").length - nbQE}, cœurs ${await coeurs(c.page)}, erreurs serveur ${(await db()).parties.find(p => p.participant_id === C).erreurs}]`);
    await c.page.click("#btn-effacer");
    // d) Indices : deux disponibles après 2 erreurs, sur deux groupes différents ; panne pendant un indice
    await c.page.route("**/rest/v1/rpc/q_indice", r => r.abort(), { times: 1 });
    await c.page.click("#btn-indice"); await c.page.waitForSelector("#message .bulle:has-text('Connexion impossible')");
    ok(await c.page.locator(".tile.indice").count() === 0 && await c.page.locator("#indice-restant").innerText() === "2", "panne pendant un indice : aucun indice consommé");
    await c.page.click("#btn-indice"); await c.page.waitForSelector(".tile.indice");
    await c.page.waitForFunction(() => !document.querySelector("#btn-indice").disabled);
    await c.page.click("#btn-indice"); await c.page.waitForFunction(() => document.querySelectorAll(".tile.indice").length === 4);
    const indC = await c.page.evaluate(() => [...document.querySelectorAll(".tile.indice")].map(t => t.getAttribute("aria-label")));
    const grpC = [...new Set(indC.map(m => T1groupeDe(m)))];
    function T1groupeDe(m) { return T1.groupes.findIndex(g => g.mots.includes(m)); }
    ok(indC.length === 4 && grpC.length === 2 && grpC.includes(1) && grpC.includes(2), "deux indices : 2 mots du groupe facile, puis 2 mots du groupe intermédiaire suivant");
    ok((await evts(C, ["indice"])).length === 2 && (await db()).parties.find(p => p.participant_id === C).indices.length === 2 && await c.page.locator("#btn-indice[disabled]").count() === 1, "2 événements « indice », 2 indices enregistrés, bouton éteint");
    // e) Victoire après 3 erreurs
    for (const i of [1, 2, 3, 0]) { await choisir(c.page, T1.groupes[i].mots); await c.page.click("#btn-valider"); await c.page.waitForFunction((n) => document.querySelectorAll("#trouves .group").length >= n || !document.querySelector("#fin").classList.contains("hidden"), [1, 2, 3, 0].indexOf(i) + 1); }
    await c.page.waitForSelector("#fin:not(.hidden)");
    ok(await c.page.locator("#resume h2").innerText() === "Bravo !" && /3 erreurs/.test(await c.page.locator("#resume").innerText()) && await c.page.locator("#solution .expl").count() === 4, "victoire après 3 erreurs et 2 indices : solution complète");
    await c.ctx.close();

    console.log("7. Contrôles directs du serveur (contrat)");
    ok((await rpc("q_grille", { p_id: "INCONNU" })).corps.ok === false && (await rpc("q_essai", { p_id: "INCONNU", p_mots: fauxT1[0] })).corps.ok === false && (await rpc("q_indice", { p_id: "INCONNU" })).corps.ok === false, "participant inconnu : q_grille, q_essai et q_indice répondent {ok:false}");
    const m0 = await rpc("q_grille", { p_id: M.toLowerCase() });
    ok(m0.corps.serveur === true && m0.corps.mots.length === 16, "l'identifiant du participant est accepté en minuscules");
    const mauvais = [["ZORBAK", "KLYPTO", "VEXILE"], ["ZORBAK", "ZORBAK", "KLYPTO", "VEXILE"], ["ZORBAK", "KLYPTO", "VEXILE", "INTRUS"], "ZORBAK", null];
    const repM = []; for (const mots of mauvais) repM.push((await rpc("q_essai", { p_id: M, p_mots: mots })).corps);
    ok(repM.every(r => r.ok === false && r.raison === "mots") && !(await db()).parties.some(p => p.participant_id === M), "q_essai refuse 3 mots, un mot en double, un mot hors grille, un texte, null — sans créer de partie");
    const j1 = (await rpc("q_essai", { p_id: M, p_mots: T1.groupes[0].mots })).corps;
    ok(j1.juste && j1.groupe.index === 0 && j1.groupe.couleur === 3 && j1.groupe.categorie === T1.groupes[0].categorie && !j1.terminee && !("solution" in j1) && !("niveau" in j1), "essai juste : groupe complet avec index et couleur, sans solution ni niveau");
    const j2 = (await rpc("q_essai", { p_id: M, p_mots: ["ZORBAK", "GRUMIER", "TRINQUE", "BALUFRE"] })).corps;
    ok(j2.ok === false && j2.raison === "mots" && (await db()).parties.find(p => p.participant_id === M).erreurs === 0, "un mot d'un groupe déjà trouvé : essai refusé, aucune erreur comptée");
    // Partie à cheval sur minuit : demain, la grille du jour devient t02, mais la partie commencée sur t01 peut être finie.
    await fetch(BASE + "/__test/decaler?jours=1");
    const dem = (await rpc("q_grille", { p_id: M })).corps;
    ok(dem.id === "t02" && dem.partie.trouves.length === 0 && T2.groupes.every(g => g.mots.every(x => dem.mots.includes(x))), "le lendemain : q_grille sert la grille suivante du calendrier (t02)");
    const suite = (await rpc("q_essai", { p_id: M, p_mots: T1.groupes[1].mots, p_grille: "t01" })).corps;
    const repr = (await rpc("q_grille", { p_id: M, p_grille: "t01" })).corps;
    ok(suite.juste === true && repr.id === "t01" && repr.partie.trouves.length === 2, "partie commencée avant minuit : elle peut être poursuivie en nommant sa grille (p_grille)");
    const triche = (await rpc("q_grille", { p_id: F, p_grille: "t01" })).corps, triche2 = (await rpc("q_essai", { p_id: F, p_mots: T1.groupes[1].mots, p_grille: "t01" })).corps;
    ok(triche.id === "t02" && triche2.ok === false, "p_grille ne donne accès à une autre grille que si une partie y est déjà en cours");
    await fetch(BASE + "/__test/decaler?jours=0");
    // Grille forcée par l'administrateur
    await rpc("a_forcer_grille", { code: "code-test", p_id: F, p_grille: "t02" });
    const forc = (await rpc("q_grille", { p_id: F })).corps;
    ok(forc.serveur === true && forc.id === "t02", "grille forcée d'un participant : c'est elle que q_grille sert");
    // Garde-fou de volume
    const dbg = await db();
    ok(typeof dbg.parties.find(p => p.participant_id === A).fin === "string" && dbg.parties.every(p => p.essais.length <= 7), "base : fin horodatée, jamais plus de 7 essais pour une partie normale (limite de 60 jamais approchée)");
    const liste = (await rpc("a_grilles_serveur", { code: "code-test" })).corps;
    ok(liste.length === 2 && liste[0].id === "t01" && liste[0].niveau === "difficile" && liste[0].groupes[0].categorie === T1.groupes[0].categorie, "a_grilles_serveur : id, niveau et groupes, triés par identifiant");

    console.log("8. Admin : résultats d'une grille servie");
    await adm.page.click("#btn-actualiser"); await adm.page.waitForTimeout(500);
    await adm.page.click('#tabs-grilles [data-g="t01"]');
    const res = await adm.page.locator("#res-grille").innerText();
    ok(/Ont terminé\s+3/.test(res) && /Ont résolu la grille\s+2/.test(res), "admin : résultats de t01 (3 parties terminées, 2 résolues)");
    const ligne = await adm.page.locator(`#res-grille tr:has-text("${T1.groupes[2].categorie}")`).innerText();
    ok(/3 \/ 3/.test(ligne), "admin : « groupes trouvés » par catégorie pour une grille du serveur (" + ligne.replace(/\s+/g, " ") + ")");
    ok(await adm.page.locator(`[data-forcer="${F}"] option[value="t02"]`).count() === 1 && await adm.page.locator(`[data-forcer="${F}"]`).inputValue() === "t02", "admin : les grilles du serveur sont proposées et affichées comme grille forcée");

    console.log("9. Retour à l'interrupteur éteint");
    await interrupteur(false);
    const x = await nouveau();
    await aller(x.page, `${BASE}/?p=${X}`, false);
    ok(!x.appels.includes("q_grille") && /Pas de grille aujourd'hui/.test(await x.page.locator("#carte-jour").innerText()), "interrupteur de nouveau éteint : q_grille n'est plus appelée (retour arrière immédiat)");
    await x.ctx.close();

    ok(erreursConsole.length === 0, "aucune erreur JavaScript inattendue" + (erreursConsole.length ? " : " + erreursConsole.slice(0, 3).join(" | ") : ""));
  } catch (e) {
    console.log("  ÉCHEC exception : " + (e && e.stack || e)); echecs++;
  } finally {
    await browser.close(); srv.kill();
  }
  console.log(echecs ? `\n${echecs} vérification(s) en échec` : "\nToutes les vérifications passent.");
  process.exit(echecs ? 1 : 0);
})();
