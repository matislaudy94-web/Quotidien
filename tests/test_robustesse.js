// Tests de robustesse « conditions réelles » (Playwright, Chromium en émulation iPhone 13 et iPhone SE).
// Lancer : node tests/test_robustesse.js   (démarre son propre serveur de test, port 8790 ; PORT=… pour en changer)
//
// Scénarios : 1. passage à minuit (heure de Paris)   2. hors-ligne   3. localStorage plein / indisponible / corrompu
//             4. retour arrière et double onglet      5. paramètres d'URL hostiles   6. partage
//             7. rotation en paysage                  8. texte agrandi à 130 %
//
// Trois sortes de lignes :
//   OK            la vérification passe ;
//   ÉCHEC         régression : la suite sort avec un code ≠ 0 ;
//   À CORRIGER    DÉFAUT CONNU du jeu, découvert par cette suite et pas encore corrigé. Compté à part, ne fait pas
//                 échouer la suite. L'assertion n'est PAS affaiblie : le jour où le défaut est corrigé, la ligne passe
//                 en « OK … [défaut Dn corrigé] » et il suffit de remplacer connu(…) par ok(…).
//   NOTE          constat sans verdict (comportement documenté, ou limite de la simulation).
//
// Ce que Chromium ne simule pas (vrai Safari iOS, feuille de partage native, navigateur intégré de WhatsApp, vrai
// cache de retour arrière) n'est PAS testé ici : voir la check-list manuelle du README (« Reste à vérifier à la main »).
//
// Remarque : la suite compare « aujourd'hui » (heure de Paris) entre Node et le serveur simulé ; ne pas la lancer
// dans la minute qui précède le vrai minuit de Paris.
const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const PORT = Number(process.env.PORT || 8790), BASE = `http://localhost:${PORT}`;
const G = require(path.join(__dirname, "..", "grilles.json"));
const SCRIPTS = ["api.js", "grilles.js", "entrainement.js", "variantes.js", "defi_banque.js", "defi.js", "intrus_banque.js", "intrus.js", "expressions_banque.js", "expression.js", "progression.js"];

let echecs = 0, nbOk = 0, nbConnus = 0, nbNotes = 0;
const ok = (cond, msg) => { console.log((cond ? "  OK   " : "  ÉCHEC ") + msg); if (cond) nbOk++; else echecs++; };
// DÉFAUT CONNU : la condition décrit le comportement CORRECT attendu. Fausse aujourd'hui → « À CORRIGER ».
// Les fonctions d'index.html sont citées par leur nom (les numéros de ligne changent à chaque correction).
const connu = (cond, ref, msg) => {
  if (cond) { console.log(`  OK   ${msg}  [défaut ${ref} corrigé : remplacer connu() par ok()]`); nbOk++; }
  else { console.log(`  À CORRIGER  [${ref}] ${msg}`); nbConnus++; }
};
const note = (msg) => { console.log("  NOTE " + msg); nbNotes++; };

// ---------- Dates (heure de Paris) ----------
const jourParis = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d || new Date());
const plusJours = (iso, n) => { const [a, m, j] = iso.split("-").map(Number); return new Date(Date.UTC(a, m - 1, j + n, 12)).toISOString().slice(0, 10); };
const dateLongue = (iso) => { const [a, m, j] = iso.split("-").map(Number); return new Date(Date.UTC(a, m - 1, j, 12)).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }); };
// Instant (ms) où il est h:mn:s à Paris le jour donné.
function instantParis(iso, h, mn, s) {
  const [a, m, j] = iso.split("-").map(Number); const voulu = Date.UTC(a, m - 1, j, h, mn, s); let t = voulu;
  for (let i = 0; i < 2; i++) {
    const v = Object.fromEntries(new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(t)).map(p => [p.type, p.value]));
    t += voulu - Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour % 24, +v.minute, +v.second);
  }
  return t;
}
const J0 = jourParis(), J1 = plusJours(J0, 1), J2 = plusJours(J0, 2);

// ---------- Serveur simulé ----------
const db = async () => (await fetch(BASE + "/__test/db")).json();
const rpc = async (nom, corps) => (await fetch(`${BASE}/rest/v1/rpc/${nom}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) })).json();
const decaler = (jours) => fetch(`${BASE}/__test/decaler?jours=${jours}`);
const evts = (d, pid, type) => d.evenements.filter(e => e.participant_id === pid && (!type || e.type === type));
const attendre = async (cond, ms = 5000) => { const fin = Date.now() + ms; while (Date.now() < fin) { if (await cond()) return true; await new Promise(r => setTimeout(r, 100)); } return false; };

// ---------- Jeu ----------
const motsDe = (g) => g.groupes.flatMap(x => x.mots);
async function jouerGroupes(page, g, indices) {
  for (const gi of indices) {
    for (const m of g.groupes[gi].mots) await page.getByRole("button", { name: m, exact: true }).click();
    await page.getByRole("button", { name: "Valider" }).click();
  }
}
async function essaiFaux(page, g, a = 1, b = 2) {
  for (const m of [g.groupes[a].mots[0], g.groupes[a].mots[1], g.groupes[b].mots[0], g.groupes[b].mots[1]]) await page.getByRole("button", { name: m, exact: true }).click();
  await page.getByRole("button", { name: "Valider" }).click();
  await page.getByRole("button", { name: "Désélectionner" }).click();
}
const texte = async (page, sel) => (await page.locator(sel).count()) ? (await page.locator(sel).first().innerText()).replace(/\s+/g, " ").trim() : "";
const plateau = (page) => page.$$eval("#plateau .tile", t => t.map(x => x.textContent.trim()));
const estGrille = (mots, g) => mots.length > 0 && mots.every(m => motsDe(g).includes(m));
// Mots qui dépassent de leur carte + défilement horizontal de la page.
const mesures = (page) => page.evaluate(() => ({
  debordePage: document.documentElement.scrollWidth > window.innerWidth + 1,
  motsHorsCarte: [...document.querySelectorAll("#plateau .tile")].filter(t => { const a = t.firstElementChild.getBoundingClientRect(), b = t.getBoundingClientRect();
    return a.left < b.left - 0.5 || a.right > b.right + 0.5 || a.top < b.top - 0.5 || a.bottom > b.bottom + 0.5; }).map(t => t.textContent),
  valider: (r => ({ haut: Math.round(r.top), bas: Math.round(r.bottom), visible: r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth, h: Math.round(r.height) }))(document.querySelector("#btn-valider").getBoundingClientRect()),
  vue: [window.innerWidth, window.innerHeight],
}));

(async () => {
  const srv = spawn("node", [path.join(__dirname, "serveur_test.js")], { env: { ...process.env, PORT: String(PORT) }, stdio: "inherit" });
  let browser = null;
  const fermer = async (code) => { try { if (browser) await browser.close(); } catch (e) {} srv.kill(); process.exit(code); };
  if (!await attendre(async () => { try { return (await fetch(BASE + "/__test/db")).ok; } catch (e) { return false; } }, 8000)) { console.error("Serveur de test injoignable sur le port " + PORT); return fermer(1); }
  browser = await chromium.launch();

  // Session et participants créés directement par les fonctions d'administration du serveur simulé.
  // Calendrier : aujourd'hui (heure de Paris) = g1, demain = g2, etc. — la même date que celle du serveur simulé.
  const calendrier = {}; for (let i = -1; i < 8; i++) calendrier[plusJours(J0, i)] = G[Math.max(0, i)].id;
  const ses = await rpc("a_creer_session", { code: "code-test", p_nom: "Robustesse", p_calendrier: calendrier });
  const reserve = (await rpc("a_creer_participants", { code: "code-test", p_session: ses.id, n: 80 })).map(p => p.id);
  const participant = () => reserve.pop();

  // Contexte iPhone. Par défaut : tutoriel déjà vu, navigator.share absent (comme les autres suites).
  const contextes = [];
  async function nouveau(appareil, opts = {}) {
    const ctx = await browser.newContext({ ...devices[appareil], permissions: ["clipboard-read", "clipboard-write"], ...(opts.contexte || {}) });
    contextes.push(ctx);
    if (opts.tuto !== true) await ctx.addInitScript(() => { try { localStorage.setItem("quotidien_regles_vues", "true"); } catch (e) {} });
    await ctx.addInitScript(() => { try { delete Navigator.prototype.share; } catch (e) {} });
    // Mémoire des « pageshow » (persisted = page rendue par le cache de retour arrière) et des boîtes de dialogue.
    await ctx.addInitScript(() => { window.addEventListener("pageshow", (e) => { try { sessionStorage.setItem("__ps", (sessionStorage.getItem("__ps") || "") + (e.persisted ? "P" : "n")); } catch (x) {} }); });
    for (const s of (opts.init || [])) await ctx.addInitScript(s);
    const suivre = (page) => { page.erreurs = []; page.consoleErr = []; page.dialogues = [];
      page.on("pageerror", e => page.erreurs.push(String(e)));
      page.on("console", m => { if (m.type() === "error") page.consoleErr.push(m.text()); });
      page.on("dialog", async d => { page.dialogues.push(d.message()); await d.dismiss().catch(() => {}); });
      return page; };
    const page = suivre(await ctx.newPage());
    return { ctx, page, autrePage: async () => suivre(await ctx.newPage()) };
  }
  // Erreurs JavaScript réelles : exceptions non rattrapées + erreurs console qui ne sont pas de simples échecs réseau.
  const errJs = (page) => page.erreurs.concat(page.consoleErr.filter(e => !/Failed to load resource|net::ERR_|ERR_INTERNET_DISCONNECTED|ERR_FAILED/.test(e)));
  const accueil = async (page, url) => { await page.goto(url); await page.waitForSelector("#btn-jouer, #erreur:not(.hidden)", { timeout: 15000 }); };
  const ouvrirPartie = async (page, url) => { await accueil(page, url); await page.click("#btn-jouer"); await page.waitForSelector(".tile, #fin:not(.hidden)"); };
  const section = async (titre, f) => { console.log(titre); try { await f(); } catch (e) { console.error(e); ok(false, "scénario interrompu : " + String(e).split("\n")[0]); } };

  // =====================================================================================================
  // 1. Passage à minuit (heure de Paris)
  // =====================================================================================================
  // L'horloge du NAVIGATEUR est pilotée par page.clock ; le serveur simulé, lui, prend l'heure réelle + un décalage
  // en jours (/__test/decaler). Pour rester cohérent : la page démarre « aujourd'hui 23:58 » (même jour que le
  // serveur), puis après minuit on décale le serveur d'un jour.
  async function scenarioMinuit(appareil, variante) {
    const minuit = instantParis(J1, 0, 0, 0);
    const franchir = async (page, apresMs) => { const t = await page.evaluate(() => Date.now()); await page.clock.fastForward(minuit - t + apresMs); };
    const ouvrir = async (pid, heure) => { const x = await nouveau(appareil); await x.page.clock.install({ time: new Date(instantParis(J0, 23, heure[0], heure[1])) }); return x.page; };
    await decaler(0);
    const A = participant(), B = participant(), C = participant();

    // A : partie EN COURS à minuit (1 groupe trouvé à 23:59).
    const pa = await ouvrir(A, [59, 0]);
    await ouvrirPartie(pa, `${BASE}/?p=${A}`);
    ok(estGrille(await plateau(pa), G[0]) && (await texte(pa, "#date-grille")).includes(dateLongue(J0)), `23:59 : la grille du ${dateLongue(J0)} (g1) est en cours`);
    await jouerGroupes(pa, G[0], [0]);
    // B : page ouverte sur l'accueil, pas encore jouée (téléphone posé, onglet resté ouvert).
    const pb = await ouvrir(B, [59, 0]);
    await accueil(pb, `${BASE}/?p=${B}`);
    ok(/À jouer/.test(await texte(pb, "#carte-jour")), "23:59 : accueil, grille du jour « À jouer »");
    // C : partie TERMINÉE avant minuit, compte à rebours affiché.
    const pc = await ouvrir(C, [58, 0]);
    await ouvrirPartie(pc, `${BASE}/?p=${C}`);
    await jouerGroupes(pc, G[0], [0, 1, 2, 3]); await pc.waitForSelector("#fin:not(.hidden)");
    const selCompte = variante === "accueil" ? "#compte-accueil" : "#compte-a-rebours";
    if (variante === "accueil") { await pc.click("#retour-accueil-fin button"); await pc.waitForSelector("#compte-accueil"); }
    const avant = await texte(pc, selCompte);
    const sec = (t) => { const m = t.match(/(\d{2})\s*h\s*(\d{2})\s*min\s*(\d{2})\s*s/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : -1; };
    const resteReel = Math.round((minuit - await pc.evaluate(() => Date.now())) / 1000);
    ok(sec(avant) >= 0 && Math.abs(sec(avant) - resteReel) <= 3, `avant minuit : compte à rebours « ${avant} » = temps réel jusqu'à minuit heure de Paris (${resteReel} s)`);

    // --- Minuit passe : il est 00:00:05 à Paris. Aucune page n'est rechargée. ---
    await franchir(pa, 5000); await franchir(pc, 5000); await decaler(1);
    ok(await pa.evaluate(() => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date())) === J1, `00:00:05 : pour le navigateur comme pour le serveur, on est le ${dateLongue(J1)}`);

    // C : compte à rebours à zéro.
    const apres = await texte(pc, selCompte);
    ok(await pc.locator("#btn-jouer-maintenant").count() === 1 && /disponible/.test(apres) && !/-\d|NaN/.test(apres), `compte à rebours à zéro (${variante === "accueil" ? "accueil" : "écran de fin"}) : remplacé par « ${apres} », ni négatif ni NaN`);
    await pc.click("#btn-jouer-maintenant"); await pc.waitForSelector("#btn-jouer");
    const carteC = await texte(pc, "#carte-jour");
    await pc.click("#btn-jouer"); await pc.waitForSelector(".tile");
    ok(/À jouer/.test(carteC) && estGrille(await plateau(pc), G[1]), "le bouton recharge la page : la grille du nouveau jour (g2) est proposée et jouable");

    // A : la partie de la veille, toujours à l'écran.
    ok(await pa.locator("#plateau .tile").count() === 12 && await pa.locator("#trouves .group").count() === 1 && await pa.locator("#jeu:not(.hidden)").count() === 1, "00:00:05, partie en cours : le plateau de la veille reste affiché, groupe trouvé conservé");
    await jouerGroupes(pa, G[0], [1, 2, 3]); await pa.waitForSelector("#fin:not(.hidden)");
    ok(await texte(pa, "#resume h2") === "Bravo !", "la partie de la veille peut encore être terminée après minuit");
    await attendre(async () => evts(await db(), A, "recompense").length === 1);
    let d = await db();
    const finA = evts(d, A, "fin");
    const journalA = await pa.evaluate((cle) => JSON.parse(localStorage.getItem(cle) || "[]"), "quotidien_journal_" + A);
    ok(finA.length === 1 && finA[0].grille === "g1" && journalA.length === 1 && journalA[0].grille === "g1", "elle est attribuée à la GRILLE de la veille (événement « fin » et journal local : g1), une seule fois");
    note(`attribution du JOUR : côté serveur l'événement « fin » est daté du ${jourParis(new Date(finA[0].created_at))} (jour de fin), côté joueur le journal local (série, « derniers résultats ») porte le ${journalA[0].jour}. La partie commencée le ${J0} compte donc pour le ${J1}.`);
    // Trois vérifications de non-régression (défauts trouvés par cette suite sur la version du 12/11, corrigés depuis
    // par verifierJour() et prochaineDate() dans index.html) : sans elles, après minuit, l'écran de fin annonçait la
    // grille du surlendemain, l'accueil affichait « Terminée » sous la date du jour, et l'onglet resté ouvert lançait
    // la grille de la veille sans enregistrer de visite.
    const suiteA = await texte(pa, "#suite");
    ok(/disponible/.test(suiteA) && !suiteA.includes(dateLongue(J2)), `écran de fin atteint après minuit : la grille du ${dateLongue(J1)} est proposée tout de suite (pas d'attente jusqu'au ${dateLongue(J2)}) → « ${suiteA.slice(0, 70)} »`);
    await pa.click("#retour-accueil-fin button"); await pa.waitForSelector("#ecran-accueil:not(.hidden)");
    const carteA = await texte(pa, "#carte-jour");
    ok(/À jouer/.test(carteA) && !/Terminée|déjà joué/.test(carteA) && carteA.includes(dateLongue(J1)), `retour à l'accueil après minuit, sans rechargement manuel : la grille du ${dateLongue(J1)} est « À jouer » → « ${carteA.slice(0, 70)} »`);
    await accueil(pa, `${BASE}/?p=${A}`);
    const carteA2 = await texte(pa, "#carte-jour");
    await pa.click("#btn-jouer"); await pa.waitForSelector(".tile");
    ok(/À jouer/.test(carteA2) && estGrille(await plateau(pa), G[1]) && (await pa.evaluate((c) => JSON.parse(localStorage.getItem(c) || "[]").length, "quotidien_journal_" + A)) === 1, "après un rechargement manuel : nouvelle grille (g2) proposée et jouable, progression de la veille conservée (1 partie au journal)");

    // B : onglet resté ouvert sur l'accueil, rouvert le lendemain matin (08:00) sans rechargement.
    await pb.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => window.__cache === true }); window.__cache = true; document.dispatchEvent(new Event("visibilitychange")); });
    await franchir(pb, 8 * 3600 * 1000);
    await pb.evaluate(() => { window.__cache = false; document.dispatchEvent(new Event("visibilitychange")); window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })); });
    await pb.waitForTimeout(600); await pb.waitForLoadState("load"); await pb.waitForSelector("#btn-jouer");
    await pb.click("#btn-jouer"); await pb.waitForSelector(".tile");
    const motsB = await plateau(pb), dateB = await texte(pb, "#date-grille");
    ok(estGrille(motsB, G[1]) && dateB.includes(dateLongue(J1)), `onglet resté ouvert sur l'accueil, rouvert le lendemain à 08:00 : « Jouer » lance la grille du jour (${estGrille(motsB, G[1]) ? "g2" : estGrille(motsB, G[0]) ? "g1, celle de la veille" : "?"}) sous le libellé « ${dateB} »`);
    await pb.locator(".tile").first().click(); await pb.waitForTimeout(500);
    d = await db();
    const visB = evts(d, B, "visite");
    ok(visB.some(v => jourParis(new Date(v.created_at)) === J1) && evts(d, B, "debut").every(e => e.grille === "g2"), `… et ce retour est mesuré : visites = ${visB.map(v => jourParis(new Date(v.created_at)) + " " + v.donnees.classe).join(", ")} ; « debut » envoyé pour ${evts(d, B, "debut").map(e => e.grille).join(",") || "–"}`);
    ok([pa, pb, pc].every(p => errJs(p).length === 0), "aucune erreur JavaScript au passage de minuit " + [pa, pb, pc].flatMap(errJs).join(" | "));
    await decaler(0);
  }

  // =====================================================================================================
  // 2. Hors-ligne
  // =====================================================================================================
  async function scenarioHorsLigne(appareil, variante) {
    const P = participant(); const { ctx, page } = await nouveau(appareil);
    await ouvrirPartie(page, `${BASE}/?p=${P}`);
    await jouerGroupes(page, G[0], [0]);
    await attendre(async () => evts(await db(), P, "essai").length === 1);
    await ctx.setOffline(true);
    await essaiFaux(page, G[0]); await jouerGroupes(page, G[0], [1, 2, 3]);
    await page.waitForSelector("#fin:not(.hidden)");
    ok(await texte(page, "#resume h2") === "Bravo !" && await page.locator("#bloc-recompenses").count() === 1, "coupure réseau en cours de partie : la partie se termine, résultat et XP affichés");
    const file = await page.evaluate(() => JSON.parse(localStorage.getItem("quotidien_file") || "[]").map(e => e.p_type));
    ok(file.join(",") === "essai,essai,essai,essai,fin,recompense", "événements mis en file dans le navigateur, dans l'ordre : " + file.join(", "));
    let d = await db();
    ok(evts(d, P, "fin").length === 0 && evts(d, P, "essai").length === 1, "rien n'est parvenu au serveur pendant la coupure");
    ok(errJs(page).length === 0, "aucune erreur JavaScript hors-ligne " + errJs(page).join(" | "));
    await ctx.setOffline(false);
    await page.waitForTimeout(1500);
    d = await db();
    note(`retour en ligne sans rien toucher pendant 1,5 s : ${evts(d, P, "fin").length ? "la file part toute seule" : "rien ne part (pas d'écouteur « online ») ; conforme au README : envoi « à la prochaine action ou visite ». Si le joueur ferme l'onglet ici, la fin de partie n'arrive qu'à sa prochaine visite"}`);
    if (variante === "action") await page.click("#btn-demande"); else await accueil(page, `${BASE}/?p=${P}`);
    const complet = await attendre(async () => evts(await db(), P, "recompense").length >= 1 && (await page.evaluate(() => JSON.parse(localStorage.getItem("quotidien_file") || "[]").length)) === 0);
    await page.waitForTimeout(400);
    const compte = async () => { const x = await db(); const n = (t) => evts(x, P, t).length; return { debut: n("debut"), essai: n("essai"), fin: n("fin"), recompense: n("recompense"), numeros: evts(x, P, "essai").map(e => e.donnees.numero).join(""), ordre: evts(x, P).filter(e => ["essai", "fin", "recompense"].includes(e.type)).map(e => e.type[0]).join("") }; };
    let c = await compte();
    ok(complet && c.debut === 1 && c.essai === 5 && c.fin === 1 && c.recompense === 1 && c.numeros === "12345" && c.ordre === "eeeeefr",
      `retour en ligne puis ${variante === "action" ? "une action" : "une nouvelle visite"} : tout est envoyé une seule fois et dans l'ordre (5 essais, 1 fin, 1 récompense) → ${JSON.stringify(c)}`);
    await accueil(page, `${BASE}/?p=${P}`); await page.waitForTimeout(600);
    const c2 = await compte();
    ok(c2.essai === 5 && c2.fin === 1 && c2.recompense === 1, "après un rechargement de plus : aucun renvoi (pas de doublon)");
    await page.click("#btn-jouer"); await page.waitForSelector("#fin:not(.hidden)");
    ok(await page.locator("#bloc-recompenses").count() === 0 && /100 XP|1\d\d XP/.test(await page.evaluate(() => document.querySelector("#carte-xp").textContent)), "la partie terminée hors-ligne est retrouvée, XP non créditée une 2e fois");
  }

  async function scenarioReponsePerdue(appareil) {
    // La requête atteint le serveur mais la réponse se perd (tunnel, changement d'antenne) : le navigateur croit à
    // un échec et renvoie l'événement à la prochaine action.
    const P = participant(); const { page } = await nouveau(appareil);
    await ouvrirPartie(page, `${BASE}/?p=${P}`);
    await jouerGroupes(page, G[0], [0, 1, 2]);
    await attendre(async () => evts(await db(), P, "essai").length === 3);
    let perdue = false;
    await page.route("**/rest/v1/rpc/q_evenement", async (route) => {
      if (!perdue && JSON.parse(route.request().postData() || "{}").p_type === "essai") { perdue = true; await route.fetch().catch(() => {}); return route.abort("connectionreset"); }
      return route.continue();
    });
    await jouerGroupes(page, G[0], [3]); await page.waitForSelector("#fin:not(.hidden)");
    await page.click("#btn-demande");
    await attendre(async () => evts(await db(), P, "demande_suivante").length === 1);
    const d = await db();
    // DÉFAUT D1 (index.html, envoyer() / viderFile() : aucun identifiant unique par événement ; un envoi dont la
    // réponse est perdue est rejoué tel quel). Mesuré sur le serveur SIMULÉ, qui n'élimine pas les doublons, comme
    // la fonction q_evenement décrite dans le README ; à confirmer sur la vraie base.
    connu(evts(d, P, "essai").length === 4, "D1", `réponse du serveur perdue pour un essai : il devrait n'être enregistré qu'une fois ; le serveur en a ${evts(d, P, "essai").length} pour 4 essais joués (numéros ${evts(d, P, "essai").map(e => e.donnees.numero).join(",")})`);
    ok(evts(d, P, "fin").length === 1 && evts(d, P, "recompense").length === 1, "… mais rien n'est perdu : la fin et la récompense, bloquées derrière, sont bien arrivées (1 fois chacune)");
  }

  async function scenarioPremierChargement(appareil) {
    const P = participant();
    // a) La page est servie (cache du navigateur) mais la base est injoignable.
    const { page } = await nouveau(appareil);
    await page.route("**/rest/v1/**", r => r.abort("internetdisconnected"));
    await page.goto(`${BASE}/?p=${P}`); await page.waitForSelector("#erreur:not(.hidden)", { timeout: 10000 });
    const msg = await texte(page, "#erreur");
    ok(/Impossible de joindre le serveur/.test(msg) && await page.locator("#erreur button").count() === 1 && await page.locator("#chargement.hidden").count() === 1, `premier chargement sans réseau vers la base : message clair + bouton, pas d'écran blanc → « ${msg} »`);
    ok(errJs(page).length === 0, "… sans erreur JavaScript " + errJs(page).join(" | "));
    await page.unroute("**/rest/v1/**");
    await page.click("#erreur button"); await page.waitForSelector("#btn-jouer");
    ok(/À jouer/.test(await texte(page, "#carte-jour")), "le réseau revient : « Réessayer » charge l'accueil");
    ok((await db()).participants.filter(p => p.groupe === "organique").length === 0, "aucun participant fantôme créé pendant les tentatives");
    // b) Vrai hors-ligne au tout premier chargement : rien n'est servi, c'est la page d'erreur du navigateur.
    const x = await nouveau(appareil); await x.ctx.setOffline(true);
    const refus = await x.page.goto(`${BASE}/?p=${P}`).then(() => "", e => String(e).match(/net::\w+/)?.[0] || "erreur");
    note(`premier chargement en mode avion : ${refus || "page servie ?"} → page d'erreur du NAVIGATEUR (le site n'a pas de service worker, il ne peut rien afficher). Sur iPhone : « Safari ne peut pas ouvrir la page ». Non testable ici, voir check-list manuelle.`);
    // c) Réseau instable : UN des fichiers du jeu ne se charge pas.
    const bloques = [];
    for (const s of SCRIPTS) {
      const y = await nouveau(appareil);
      await y.page.route("**/" + s, r => r.abort("connectionreset"));
      await y.page.goto(`${BASE}/?p=${P}`);
      const vu = await y.page.waitForSelector("#btn-jouer, #erreur:not(.hidden)", { timeout: 4000 }).then(() => true, () => false);
      if (!vu) bloques.push(`${s} → « ${await texte(y.page, "#chargement") || "écran vide"} »`);
      await y.ctx.close();
    }
    // (index.html, demarrer() : toute exception de _demarrer() est rattrapée et affichée comme une panne de connexion.)
    ok(bloques.length === 0, `un fichier du jeu ne se charge pas (réseau instable, ${SCRIPTS.length} fichiers essayés un par un) : jamais de « Chargement… » sans fin, l'accueil ou un message avec « Réessayer » apparaît ${bloques.join(" ; ")}`);
  }

  // =====================================================================================================
  // 3. localStorage plein, indisponible, corrompu
  // =====================================================================================================
  const visiteGuidee = async (page) => {
    // Parcourt les écrans principaux ; renvoie la liste des étapes qui n'ont pas abouti.
    const rates = [];
    const etape = async (nom, f) => { if (rates.length) return; try { await f(); } catch (e) { rates.push(nom); } };
    const t = { timeout: 1500 };
    await etape("accueil", () => page.waitForSelector("#btn-jouer", { timeout: 4000 }));
    await etape("grille", async () => { await page.click("#btn-jouer", t); await page.waitForSelector("#plateau .tile, #fin:not(.hidden)", t); });
    await etape("toucher un mot", async () => { if (await page.locator("#jeu:not(.hidden)").count()) { await page.locator("#plateau .tile").first().click(t); await page.waitForSelector("#plateau .tile.sel", t); await page.click("#btn-quitter", t); } else await page.click('#nav-bas [data-ecran="accueil"]', t); });
    for (const o of ["jeux", "progression", "stats"]) await etape("onglet " + o, async () => { await page.click(`#nav-bas [data-ecran="${o}"]`, t); await page.waitForSelector(`#ecran-${o}:not(.hidden)`, t); });
    await etape("accueil (retour)", async () => { await page.click('#nav-bas [data-ecran="accueil"]', t); await page.waitForSelector("#ecran-accueil:not(.hidden)", t); });
    for (const [b, e] of [["#btn-defi", "defi"], ["#btn-intrus", "intrus"], ["#btn-expression", "expression"], ["#btn-entr", "entrainement"]])
      await etape("jeu " + e, async () => { await page.click('#nav-bas [data-ecran="accueil"]', t); await page.click(b, t); await page.waitForSelector(`#ecran-${e}:not(.hidden)`, t); });
    return rates;
  };

  async function scenarioStockage(appareil, avecCorruption) {
    // a) Stockage plein : toute écriture lève QuotaExceededError (lecture possible).
    const plein = () => { Storage.prototype.setItem = function () { throw new DOMException("The quota has been exceeded.", "QuotaExceededError"); }; };
    // b) Stockage interdit : l'accès même à window.localStorage lève SecurityError (cookies bloqués, certains navigateurs intégrés).
    const interdit = () => { Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("The operation is insecure.", "SecurityError"); } }); };
    for (const [nom, init, ref] of [["plein (QuotaExceededError à l'écriture)", plein], ["indisponible (SecurityError à l'accès)", interdit]]) {
      const P = participant(); const { page } = await nouveau(appareil, { init: [init], tuto: true });
      await accueil(page, `${BASE}/?p=${P}`);
      ok(await page.locator("#btn-jouer").count() === 1 && errJs(page).length === 0, `localStorage ${nom} : la page démarre, accueil affiché, aucune erreur JavaScript ${errJs(page).join(" | ")}`);
      await page.click("#btn-jouer"); await page.waitForSelector(".tile");
      if (await page.locator("#dlg-regles[open]").count()) { await page.click("#tuto-suiv"); await page.click("#tuto-suiv"); await page.click("#tuto-suiv"); }
      await essaiFaux(page, G[0]); await jouerGroupes(page, G[0], [0, 1, 2, 3]);
      await page.waitForSelector("#fin:not(.hidden)");
      ok(await texte(page, "#resume h2") === "Bravo !" && errJs(page).length === 0, `localStorage ${nom} : la partie se joue jusqu'au bout sans erreur ${errJs(page).join(" | ")}`);
      await page.click("#btn-demande"); await page.waitForTimeout(900);
      const d = await db(); const types = evts(d, P).map(e => e.type);
      // DÉFAUT D2 (index.html, envoyer() / viderFile() : la file d'attente n'existe QUE dans localStorage ; store.set échoue en
      // silence, puis viderFile() relit une file vide) : sans stockage, AUCUN événement de jeu n'est
      // envoyé, alors que le réseau fonctionne. Seule la visite (envoi direct dans _demarrer) arrive.
      connu(types.includes("fin") && types.filter(x => x === "essai").length === 5, "D2", `localStorage ${nom} : la partie jouée en ligne devrait être enregistrée (1 début, 5 essais, 1 fin) ; reçu par le serveur : ${types.join(", ") || "rien"}`);
    }
    // c) Valeurs corrompues dans toutes les clés quotidien_* (indépendant de l'appareil : fait une seule fois).
    if (!avecCorruption) return null;
    const P = participant(); const { page } = await nouveau(appareil);
    await ouvrirPartie(page, `${BASE}/?p=${P}`);
    await jouerGroupes(page, G[0], [0]);
    await page.click("#btn-quitter"); await page.click("#btn-intrus"); await page.waitForSelector("#intrus-go");
    const cles = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("quotidien_")));
    const toutes = [...new Set(cles.concat(["quotidien_file", "quotidien_pid", "quotidien_appareil", "quotidien_regles_vues", "quotidien_pseudo", "quotidien_defi_encours", `quotidien_journal_${P}`, `quotidien_etat_${P}_g1`,
      `quotidien_entr_meta_${P}`, `quotidien_entr_${P}_e01`, `quotidien_defi_${P}`, `quotidien_intrus_${P}`, `quotidien_expression_${P}`]))];
    const essayer = async (valeur, cibles) => {
      const q = await (await nouveau(appareil)).ctx.newPage(); q.erreurs = []; q.on("pageerror", e => q.erreurs.push(String(e).split("\n")[0]));
      await q.goto(`${BASE}/tests/serveur_test.js`);   // même origine, sans lancer le jeu
      await q.evaluate(([ks, v]) => { localStorage.clear(); ks.forEach(k => localStorage.setItem(k, v)); }, [cibles || toutes, valeur]);
      await q.goto(`${BASE}/?p=${P}`);
      const rates = await visiteGuidee(q);
      const r = { rates, erreurs: [...new Set(q.erreurs)] }; await q.context().close(); return r;
    };
    const r1 = await essayer("{{{pas du json");
    const r2 = await essayer("");
    ok(r1.rates.length === 0 && r1.erreurs.length === 0 && r2.rates.length === 0 && r2.erreurs.length === 0,
      `${toutes.length} clés quotidien_* remplies de texte non-JSON (« {{{pas du json », chaîne vide) : la page démarre, tous les écrans s'ouvrent, aucune erreur ${[...r1.rates, ...r1.erreurs, ...r2.rates, ...r2.erreurs].join(" | ")}`);
    // JSON valide mais du mauvais type (clé écrite par une ancienne version du jeu, une extension, une restauration tronquée).
    // Une clé à la fois, pour savoir laquelle bloque quoi.
    const casses = [];
    for (const [cle, v] of [["quotidien_file", "{}"], [`quotidien_etat_${P}_g1`, "{}"], [`quotidien_journal_${P}`, "[null]"], [`quotidien_defi_${P}`, '"texte"'], ["quotidien_pseudo", "12345"], [`quotidien_intrus_${P}`, "[]"], [`quotidien_expression_${P}`, "12345"], [`quotidien_entr_meta_${P}`, '"texte"']]) {
      const r = await essayer(v, [cle]);
      if (r.rates.length || r.erreurs.length) casses.push(`${cle.replace(P, "ID")} = ${v} → bloqué à l'étape « ${r.rates[0] || "–"} »${r.erreurs.length ? " (" + r.erreurs[0] + ")" : " (message affiché : « Impossible de joindre le serveur »)"}`);
    }
    return casses;
  }

  // =====================================================================================================
  // 4. Retour arrière (bfcache) et double onglet
  // =====================================================================================================
  async function scenarioRetour(appareil) {
    const P = participant(); const { page } = await nouveau(appareil);
    await ouvrirPartie(page, `${BASE}/?p=${P}`);
    await jouerGroupes(page, G[0], [0]); await page.locator("#plateau .tile").first().click();
    await page.goto(`${BASE}/admin.html`); await page.waitForSelector("#form-connexion");
    await page.goBack(); await page.waitForSelector("#btn-jouer, #plateau .tile");
    const ps = await page.evaluate(() => sessionStorage.getItem("__ps"));
    note(`retour arrière : ${/P/.test(ps) ? "page rendue par le cache de retour arrière (pageshow persisted)" : "Chromium piloté par Playwright RECHARGE la page (bfcache désactivé) : le vrai cache de Safari iOS, qui ré-affiche la page figée sans la relancer, est à vérifier à la main"}`);
    if (await page.locator("#ecran-accueil:not(.hidden)").count()) {
      ok(/En cours/.test(await texte(page, "#carte-jour")) && /Reprendre/.test(await texte(page, "#btn-jouer")), "partie en cours → autre page → retour : accueil « En cours », bouton « Reprendre la partie »");
      await page.click("#btn-jouer"); await page.waitForSelector("#plateau .tile");
    }
    ok(await page.locator("#plateau .tile").count() === 12 && await page.locator("#trouves .group").count() === 1, "la partie reprend où elle en était (1 groupe trouvé, 12 mots)");
    await jouerGroupes(page, G[0], [1, 2, 3]); await page.waitForSelector("#fin:not(.hidden)");
    await attendre(async () => evts(await db(), P, "recompense").length === 1);
    await page.goto(`${BASE}/admin.html`); await page.waitForSelector("#form-connexion");
    await page.goBack(); await page.waitForSelector("#btn-jouer, #fin:not(.hidden)");
    if (await page.locator("#ecran-accueil:not(.hidden)").count()) await page.click("#btn-jouer");
    await page.waitForSelector("#fin:not(.hidden)"); await page.waitForTimeout(500);
    const d = await db();
    ok(evts(d, P, "debut").length === 1 && evts(d, P, "fin").length === 1 && evts(d, P, "recompense").length === 1 && await page.locator("#bloc-recompenses").count() === 0,
      "partie terminée → autre page → retour : résultat retrouvé, toujours 1 début, 1 fin, 1 récompense, XP non recréditée");
    ok(evts(d, P, "visite").map(v => v.donnees.classe).slice(1).every(c => c === "revisite_meme_jour"), "les rechargements du retour arrière sont classés « revisite même jour » (jamais « retour ») : " + evts(d, P, "visite").map(v => v.donnees.classe).join(", "));
    ok(errJs(page).length === 0, "aucune erreur JavaScript " + errJs(page).join(" | "));
  }

  async function scenarioDoubleOnglet(appareil) {
    const P = participant(); const { page: a, autrePage } = await nouveau(appareil);
    await ouvrirPartie(a, `${BASE}/?p=${P}`);
    const b = await autrePage(); await ouvrirPartie(b, `${BASE}/?p=${P}`);
    ok(await a.locator("#plateau .tile").count() === 16 && await b.locator("#plateau .tile").count() === 16, "le même lien ouvert dans deux onglets : la même grille dans les deux");
    // Onglet A : victoire avec 1 erreur.
    await essaiFaux(a, G[0]); await jouerGroupes(a, G[0], [0, 1, 2, 3]); await a.waitForSelector("#fin:not(.hidden)");
    await attendre(async () => evts(await db(), P, "recompense").length === 1);
    const xpA = await a.evaluate((c) => localStorage.getItem(c), "quotidien_journal_" + P);
    // Onglet B (resté sur le plateau de départ) : le joueur y revient et quitte vers l'accueil.
    await b.locator("#plateau .tile").first().click(); await b.click("#btn-quitter"); await b.waitForSelector("#ecran-accueil:not(.hidden)");
    const etatApres = await b.evaluate((c) => JSON.parse(localStorage.getItem(c)), `quotidien_etat_${P}_g1`);
    // DÉFAUT D4 (index.html, sauver() écrit l'état en mémoire de l'onglet sans relire celui du stockage ;
    // appelé par le bouton « ← », par chronoPause() à chaque passage en arrière-plan, par basculer()) :
    // l'onglet resté ouvert écrase la partie TERMINÉE par son vieil état « en cours ».
    connu(!!(etatApres && etatApres.fin), "D4", `partie terminée dans l'onglet A, puis simple « ← Accueil » dans l'onglet B : l'état sauvegardé devrait rester « terminé » ; il est redevenu ${etatApres && etatApres.fin ? "terminé" : `« en cours » (${(etatApres && etatApres.trouves || []).length} groupe trouvé, ${etatApres ? etatApres.erreurs : "?"} erreur)`}`);
    const carteB = await texte(b, "#carte-jour");
    // L'onglet B rejoue alors la grille en entier (cette fois sans erreur).
    await b.click("#btn-jouer"); await b.waitForSelector("#plateau .tile, #fin:not(.hidden)");
    const rejouable = await b.locator("#jeu:not(.hidden)").count() === 1;
    if (rejouable) { if (await b.locator("#btn-effacer:not([disabled])").count()) await b.click("#btn-effacer"); await jouerGroupes(b, G[0], [0, 1, 2, 3]); await b.waitForSelector("#fin:not(.hidden)"); await b.waitForTimeout(700); }
    await b.click('#nav-bas [data-ecran="accueil"]'); await b.waitForTimeout(300);
    const d = await db();
    ok(evts(d, P, "recompense").length === 1 && (await b.evaluate((c) => localStorage.getItem(c), "quotidien_journal_" + P)) === xpA && await b.locator("#bloc-recompenses").count() === 0,
      `pas de double crédit d'XP : 1 seule récompense, journal local inchangé (${JSON.parse(xpA).length} partie) → ${await texte(b, "#carte-xp .xp-txt")}`);
    const fins = evts(d, P, "fin");
    // DÉFAUT D5 (index.html, lancerGrille() reprend l'état écrasé ; terminer()
    // journalise « fin » sans vérifier qu'une fin existe déjà pour cette grille) : deuxième événement « fin ».
    connu(fins.length === 1, "D5", `pas de double événement « fin » : attendu 1 ; le serveur en a ${fins.length} pour g1 (${fins.map(f => f.donnees.erreurs + " erreur" + (f.donnees.erreurs > 1 ? "s" : "") + ", " + f.donnees.nb_essais + " essais").join(" puis ")}), ${evts(d, P, "essai").length} essais et ${evts(d, P, "debut").length} début ; accueil de B avant de rejouer : « ${carteB.slice(0, 60)} »`);
    ok(errJs(a).length === 0 && errJs(b).length === 0, "aucune erreur JavaScript dans les deux onglets " + errJs(a).concat(errJs(b)).join(" | "));
  }

  // =====================================================================================================
  // 5. Paramètres d'URL hostiles
  // =====================================================================================================
  async function scenarioUrl(appareil) {
    const propre = async (page) => (await page.evaluate(() => ({ xss: window.__xss === 1, img: document.querySelectorAll('img, script:not([src]):not(:last-of-type), iframe, svg[onload]').length, brut: /onerror|<script|javascript:/i.test(document.querySelector("main").innerHTML) })));
    const charge = "<img src=x onerror=window.__xss=1>";
    const nbP = async () => (await db()).participants.length;
    // a) ?groupe= hostile, visiteur sans identifiant (ami qui reçoit un lien de Défi trafiqué)
    for (const [param, valeur] of [["groupe", charge], ["defi", `"><script>window.__xss=1</script>`], ["groupe", "javascript:window.__xss=1//'\"`${7*7}"]]) {
      const avant = await nbP(); const { page } = await nouveau(appareil);
      await page.goto(`${BASE}/?${param}=${encodeURIComponent(valeur)}`);
      await page.waitForSelector("#ecran-defi:not(.hidden)", { timeout: 8000 }); await page.waitForTimeout(500);
      const p = await propre(page), t = await texte(page, "#ecran-defi");
      ok(!p.xss && !p.img && !p.brut && page.dialogues.length === 0 && errJs(page).length === 0 && /introuvable/i.test(t) && await nbP() === avant,
        `?${param}=${valeur.slice(0, 34)}… : aucun script exécuté, rien d'injecté, personne inscrit, message propre → « ${(t.match(/[^.]*introuvable[^.]*\./i) || [t.slice(0, 80)])[0].trim()} »`);
    }
    // b) le même lien hostile, ouvert par un participant
    const P = participant(); { const { page } = await nouveau(appareil);
      await page.goto(`${BASE}/?p=${P}&groupe=${encodeURIComponent(charge)}`); await page.waitForSelector("#ecran-defi:not(.hidden)", { timeout: 8000 }); await page.waitForTimeout(400);
      const p = await propre(page);
      ok(!p.xss && !p.img && !p.brut && errJs(page).length === 0 && page.url().endsWith("?p=" + P), "?p=…&groupe=<img…> pour un participant : rien d'exécuté, l'adresse redevient le lien personnel"); }
    // c) ?inv= très long
    { const avant = await nbP(); const { page } = await nouveau(appareil);
      const long = "A".repeat(6000) + charge;
      await accueil(page, `${BASE}/?inv=${encodeURIComponent(long)}`);
      const d = await db(); const cree = d.participants[d.participants.length - 1];
      const p = await propre(page);
      ok(d.participants.length === avant + 1 && cree.groupe === "organique" && cree.invite_par === null && page.url().endsWith("?p=" + cree.id) && page.url().length < 60 && !p.xss && !p.img && errJs(page).length === 0 && await page.locator("#btn-jouer").count() === 1,
        `?inv= de ${long.length} caractères + balise : la page démarre, un seul participant « organique » créé (aucune invitation attribuée), adresse nettoyée`); }
    // d) ?p= inconnu / hostile
    for (const valeur of ["ZZZZZZ", `<script>alert(1)</script>`, "' OR 1=1 --", "../../admin.html"]) {
      const avant = await nbP(); const { page } = await nouveau(appareil);
      await page.goto(`${BASE}/?p=${encodeURIComponent(valeur)}`); await page.waitForSelector("#erreur:not(.hidden)", { timeout: 8000 });
      const p = await propre(page), t = await texte(page, "#erreur");
      ok(/lien n'est pas valide/.test(t) && !p.xss && !p.img && page.dialogues.length === 0 && errJs(page).length === 0 && await nbP() === avant && await page.locator("#ecran-accueil.hidden").count() === 1,
        `?p=${valeur} : « ${t} », aucun script, aucun participant créé, pas de jeu affiché`);
    }
    // e) un participant connu de ce téléphone ouvre un lien ?p= erroné (faute de frappe, lien tronqué par une messagerie)
    { const Q = participant(); const { page } = await nouveau(appareil);
      await accueil(page, `${BASE}/?p=${Q}`);
      await page.goto(`${BASE}/?p=${Q.slice(0, 5)}`); await page.waitForSelector("#erreur:not(.hidden)");
      const avant = await nbP();
      await page.goto(`${BASE}/`); await page.waitForSelector("#btn-jouer, #erreur:not(.hidden)");
      const d = await db();
      // DÉFAUT D6 (index.html, _demarrer(), branche « !info.existe » : store.del("quotidien_pid") est exécuté même quand l'identifiant refusé vient
      // de l'adresse et non du stockage) : un lien ?p= invalide efface l'identifiant enregistré sur le téléphone ; à la
      // visite suivante sans lien, le joueur devient un NOUVEAU participant « organique » (progression à zéro).
      connu(page.url().endsWith("?p=" + Q) && d.participants.length === avant, "D6", `participant ${Q} : après un lien ?p= tronqué (${Q.slice(0, 5)}), revenir sur l'adresse nue devrait le reconnaître ; reconnu comme ${page.url().split("?p=")[1] || "?"}, ${d.participants.length - avant} participant « ${(d.participants[d.participants.length - 1] || {}).groupe} » créé en plus`); }
    // f) démo : ?g= hostile
    { const { page } = await nouveau(appareil);
      await accueil(page, `${BASE}/?demo=1&g=${encodeURIComponent(charge)}`);
      const p = await propre(page);
      ok(!p.xss && !p.img && errJs(page).length === 0 && /Grille 1/.test(await texte(page, "#carte-jour")), "?demo=1&g=<img…> : la démo ouvre la grille 1, rien d'injecté"); }
  }

  // =====================================================================================================
  // 6. Partage
  // =====================================================================================================
  async function scenarioPartage(appareil) {
    const P = participant();
    const espion = () => { window.__copies = []; window.__partages = []; window.__clipKO = false;
      const orig = Clipboard.prototype.writeText;
      Clipboard.prototype.writeText = function (t) { if (window.__clipKO) return Promise.reject(new DOMException("Write permission denied.", "NotAllowedError")); window.__copies.push(t); return orig.call(this, t); };
      const exec = document.execCommand.bind(document); document.execCommand = (...a) => window.__clipKO ? false : exec(...a); };
    const { page } = await nouveau(appareil, { init: [espion] });
    await ouvrirPartie(page, `${BASE}/?p=${P}`);
    await essaiFaux(page, G[0]); await jouerGroupes(page, G[0], [0, 1, 2, 3]); await page.waitForSelector("#fin:not(.hidden)");
    const partage = (mode) => page.evaluate((m) => { window.__copies.length = 0; window.__partages.length = 0;
      document.querySelectorAll("#partage-ok, #defi-copie").forEach(e => e.classList.add("hidden"));
      const def = (f) => Object.defineProperty(navigator, "share", { configurable: true, writable: true, value: f });
      if (m === "absent") def(undefined);
      if (m === "annule") def((d) => { window.__partages.push(d); return Promise.reject(new DOMException("Share canceled", "AbortError")); });
      if (m === "refuse") def((d) => { window.__partages.push(d); return Promise.reject(new DOMException("Permission denied", "NotAllowedError")); });
      if (m === "natif") def((d) => { window.__partages.push(d); return Promise.resolve(); }); }, mode);
    const etatPartage = async () => ({ copies: await page.evaluate(() => window.__copies.slice()), natifs: await page.evaluate(() => window.__partages.map(d => d.text || "")), copieAffiche: await page.locator("#partage-ok:not(.hidden)").count() === 1 });
    const dernierPartage = async () => { const e = evts(await db(), P, "partage"); return e.length ? e[e.length - 1].donnees.methode : null; };
    const nbPartages = async () => evts(await db(), P, "partage").length;
    const cliquer = async (n) => { await page.click("#btn-partager"); await attendre(async () => await nbPartages() === n, 3000); await page.waitForTimeout(150); };

    // a) navigator.share absent → presse-papiers
    await partage("absent"); await cliquer(1);
    let e = await etatPartage(); const presse = await page.evaluate(() => navigator.clipboard.readText());
    ok(e.copies.length === 1 && presse === e.copies[0] && e.copieAffiche && await dernierPartage() === "copie", "navigator.share absent : le texte est copié dans le presse-papiers, « Message copié » affiché, trace « copie »");
    const t = e.copies[0] || "";
    const motsFuites = motsDe(G[0]).filter(m => new RegExp("(^|[^A-ZÀ-Ü])" + m + "($|[^A-ZÀ-Ü])", "i").test(t));
    const catFuites = G[0].groupes.map(x => x.categorie).filter(c => t.toLowerCase().includes(c.toLowerCase()));
    ok(motsFuites.length === 0 && catFuites.length === 0 && !/titre|GUITARE/i.test(t.replace(/QUOTIDIEN/g, "")) && !t.includes(G[0].titre), `le texte partagé ne contient aucun mot de la grille ni aucune catégorie ${motsFuites.concat(catFuites).join(",")} → « ${t.replace(/\n/g, " / ")} »`);
    const liens = t.match(/https?:\/\/\S+/g) || [];
    ok(liens.length === 1 && liens[0].endsWith("?inv=" + P) && !t.includes("?p="), "grille du jour : un seul lien, le lien d'INVITATION ?inv= (invitation mesurée, voulu par le README) ; jamais le lien personnel ?p=");

    // b) navigator.share rejette : annulation par l'utilisateur
    await partage("annule"); await cliquer(2);
    e = await etatPartage();
    ok(e.natifs.length === 1 && e.copies.length === 0 && !e.copieAffiche && await dernierPartage() === "annule" && errJs(page).length === 0, "feuille de partage annulée (AbortError) : aucune erreur, rien copié, pas de faux « copié », trace « annule »");
    // c) navigator.share réussit
    await partage("natif"); await cliquer(3);
    e = await etatPartage();
    ok(e.natifs.length === 1 && e.natifs[0] === t && e.copies.length === 0 && !e.copieAffiche && await dernierPartage() === "partage_natif", "partage natif accepté : même texte, pas de « copié », trace « partage_natif »");
    // d) navigator.share refusé par le navigateur (NotAllowedError, navigateur intégré) → repli sur la copie
    await partage("refuse"); await cliquer(4);
    e = await etatPartage();
    ok(e.copies.length === 1 && e.copieAffiche && errJs(page).length === 0, "partage natif refusé par le navigateur (NotAllowedError) : repli sur la copie, « Message copié » affiché");
    // e) ni partage natif ni presse-papiers (navigateur intégré d'une messagerie)
    await partage("absent"); await page.evaluate(() => { window.__clipKO = true; }); await cliquer(5);
    e = await etatPartage();
    ok(!e.copieAffiche && e.copies.length === 0 && await dernierPartage() === "echec" && errJs(page).length === 0, "ni partage ni presse-papiers : pas de faux « copié », trace « echec », aucune erreur");
    const retourVisible = await page.evaluate(() => { const fp = document.querySelector("#fin-partage"); return /impossible|copie manuelle|sélectionne|appuie longuement/i.test(fp.innerText) || !!fp.querySelector("textarea, input"); });
    // DÉFAUT D7 (index.html, partager() : en cas d'échec de la copie, methode = "echec" est journalisé mais
    // RIEN n'est affiché, contrairement à partagerScore() « Copie impossible sur ce navigateur ») : le bouton
    // « Inviter quelqu'un à jouer » ne fait rien de visible.
    connu(retourVisible, "D7", "ni partage ni presse-papiers : le joueur devrait voir un message (ou le texte à copier à la main) ; le bouton « Inviter quelqu'un à jouer » ne produit aucun retour visible");
    // f) bouton « Copier » du lien personnel quand la copie échoue
    if (await page.locator("#btn-demande:not([disabled])").count()) await page.click("#btn-demande");
    await page.click("#apres-demande [data-copie]"); await page.waitForTimeout(200);
    const lib = await texte(page, "#apres-demande [data-copie]");
    // DÉFAUT D8 (index.html, brancherCopie() : dans le catch, « Copié » est affiché sans regarder le
    // résultat de document.execCommand("copy")) : faux « Copié » sur le lien personnel, celui qui sert à revenir.
    connu(lib !== "Copié", "D8", `copie du lien personnel impossible (presse-papiers refusé, execCommand → false) : le bouton ne devrait pas annoncer « Copié » ; il affiche « ${lib} »`);
    await page.evaluate(() => { window.__clipKO = false; });

    // g) Partage d'un score de jeu (Défi express) : aucun lien pour un participant.
    await page.click('#nav-bas [data-ecran="jeux"]'); await page.click("#jeu-defi-btn"); await page.click("#defi-solo");
    await page.waitForSelector("#defi-abandon"); const motsDefi = await page.$$eval("#ecran-defi-jeu button[data-mot], #ecran-defi-jeu .tile", b => b.map(x => x.textContent.trim()).filter(Boolean));
    await page.click("#defi-abandon"); await page.click("#defi-abandon"); await page.waitForSelector("#fin-partager");
    await partage("annule"); await page.click("#fin-partager"); await page.waitForTimeout(400);
    e = await etatPartage();
    ok(e.natifs.length === 1 && e.copies.length === 0 && await page.locator("#defi-copie:not(.hidden)").count() === 0 && errJs(page).length === 0, "Défi : partage du score annulé → aucune erreur, pas de faux « copié »");
    await partage("absent"); await page.click("#fin-partager"); await page.waitForSelector("#defi-copie:not(.hidden)");
    e = await etatPartage(); const ts = e.copies[0] || "";
    ok(e.copies.length === 1 && /palier/.test(ts) && !/https?:|localhost|\?p=|\?inv=|www\./.test(ts) && !ts.includes(P) && motsDefi.filter(m => m.length > 2 && ts.toUpperCase().includes(m.toUpperCase())).length === 0,
      `Défi : score copié, sans lien, sans identifiant, sans mot du tirage (${motsDefi.length} mots contrôlés) → « ${ts.replace(/\n/g, " / ")} »`);
  }

  // =====================================================================================================
  // 7. Rotation en paysage    8. Texte agrandi
  // =====================================================================================================
  const GL = G.find(g => g.id === "g11"); // contient le mot le plus long de la banque (MULTIPLICATION, 14 lettres)
  async function forcer(pid, gid) { await rpc("a_forcer_grille", { code: "code-test", p_id: pid, p_grille: gid }); }

  async function scenarioPaysage(appareil, paysage) {
    const P = participant(); await forcer(P, GL.id);
    const { page } = await nouveau(appareil);
    await ouvrirPartie(page, `${BASE}/?p=${P}`);
    await jouerGroupes(page, GL, [0]); await page.waitForTimeout(700);
    for (const m of GL.groupes[1].mots.slice(0, 2)) await page.getByRole("button", { name: m, exact: true }).click();
    await page.setViewportSize(paysage); await page.waitForTimeout(500);
    let m = await mesures(page);
    ok(!m.debordePage, `rotation en paysage ${m.vue.join("×")} pendant la partie : pas de débordement horizontal`);
    ok(m.motsHorsCarte.length === 0, "paysage : chaque mot reste dans sa carte (grille avec MULTIPLICATION) " + m.motsHorsCarte.join(","));
    ok(await page.locator(".tile.sel").count() === 2 && await page.locator("#trouves .group").count() === 1, "paysage : la sélection en cours et le groupe trouvé sont conservés");
    ok(m.valider.visible && m.valider.h >= 40, `paysage : bouton Valider à l'écran sans défiler (de ${m.valider.haut} à ${m.valider.bas} px sur ${m.vue[1]}), hauteur ${m.valider.h} px`);
    // Chaque carte doit pouvoir être amenée sous le doigt (non recouverte par la barre collante du bas).
    const cachees = await page.evaluate(() => [...document.querySelectorAll("#plateau .tile")].filter(t => { t.scrollIntoView({ block: "center" }); const r = t.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !(e && t.contains(e)); }).map(t => t.textContent));
    const zone = await page.evaluate(() => { window.scrollTo(0, 0); const b = document.querySelector(".barre-bas").getBoundingClientRect(), t = document.querySelector("#plateau .tile").getBoundingClientRect(); return { barre: Math.round(b.height), libre: Math.round(b.top), carte: Math.round(t.height) }; });
    ok(cachees.length === 0, `paysage : les 12 cartes sont toutes atteignables en défilant ${cachees.join(",")}`);
    note(`paysage ${m.vue.join("×")} : la barre du bas occupe ${zone.barre} px ; il reste ${zone.libre} px de haut pour le plateau (cartes de ${zone.carte} px) : le joueur doit faire défiler pour voir toutes les cartes — jouable, pas confortable`);
    for (const mot of GL.groupes[1].mots.slice(2)) await page.getByRole("button", { name: mot, exact: true }).click();
    ok(await page.locator("#btn-valider").isEnabled(), "paysage : 4 mots sélectionnés au doigt, Valider actif");
    await page.getByRole("button", { name: "Valider" }).click(); await page.waitForTimeout(900);
    ok(await page.locator("#trouves .group").count() === 2, "paysage : Valider fonctionne, 2e groupe trouvé");
    await page.setViewportSize(devices[appareil].viewport); await page.waitForTimeout(400);
    m = await mesures(page);
    ok(!m.debordePage && m.motsHorsCarte.length === 0 && m.valider.visible, "retour en portrait : pas de débordement, mots dans leurs cartes, Valider visible");
    await jouerGroupes(page, GL, [2, 3]); await page.waitForSelector("#fin:not(.hidden)");
    await page.setViewportSize(paysage); await page.waitForTimeout(300);
    ok(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) && errJs(page).length === 0, "paysage sur l'écran de fin : pas de débordement horizontal, aucune erreur JavaScript " + errJs(page).join(" | "));
  }

  async function scenarioTexteAgrandi(appareil) {
    // Réglage « aA → 130 % » de Safari : simulé par text-size-adjust (pris en compte par Chromium en émulation
    // mobile : la taille calculée de chaque texte est multipliée par 1,3, y compris les tailles en px).
    const zoom = () => { document.addEventListener("DOMContentLoaded", () => { const s = document.createElement("style"); s.textContent = "html,body{-webkit-text-size-adjust:130% !important;text-size-adjust:130% !important}"; document.head.appendChild(s); }); };
    const P = participant(); await forcer(P, GL.id);
    const { page } = await nouveau(appareil, { init: [zoom] });
    await ouvrirPartie(page, `${BASE}/?p=${P}`);
    const taille = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("#btn-melanger")).fontSize));
    const { page: temoin } = await nouveau(appareil); await ouvrirPartie(temoin, `${BASE}/?p=${P}`);
    const tailleTemoin = await temoin.evaluate(() => parseFloat(getComputedStyle(document.querySelector("#btn-melanger")).fontSize));
    ok(Math.abs(taille / tailleTemoin - 1.3) < 0.02, `la simulation agit vraiment : texte des boutons ${tailleTemoin} px → ${taille} px (×${(taille / tailleTemoin).toFixed(2)})`);
    let m = await mesures(page);
    ok(m.motsHorsCarte.length === 0, "texte à 130 % : les 16 mots restent dans leurs cartes (dont MULTIPLICATION) " + m.motsHorsCarte.join(","));
    const serrage = (pg) => pg.evaluate(() => [...document.querySelectorAll("#plateau .tile")].map(t => { const s = t.firstElementChild; const sx = +(s.style.transform.match(/scaleX\(([\d.]+)\)/) || [0, 1])[1]; return { mot: t.textContent, px: parseFloat(getComputedStyle(s).fontSize), sx }; }).sort((a, b) => a.sx - b.sx)[0]);
    const pire = await serrage(page), pireTemoin = await serrage(temoin);
    note(`lisibilité à 130 % : le mot le plus resserré est ${pire.mot} (${pire.px} px, largeur réduite à ${Math.round(pire.sx * 100)} %) ; sans agrandissement : ${pireTemoin.mot} (${pireTemoin.px} px, ${Math.round(pireTemoin.sx * 100)} %). Le mot tient dans la carte, mais plus le texte est agrandi, plus les mots longs sont comprimés`);
    ok(!m.debordePage, "texte à 130 % : pas de débordement horizontal pendant la partie");
    ok(m.valider.visible, `texte à 130 % : bouton Valider visible sans défiler (bas à ${m.valider.bas} px sur ${m.vue[1]})`);
    const barre = await page.evaluate(() => [...document.querySelectorAll("#actions-jeu .btn, #btn-indice, #chrono, .status .bloc")].filter(b => b.scrollWidth > b.clientWidth + 1 || b.getBoundingClientRect().right > window.innerWidth + 0.5).map(b => b.textContent.trim().slice(0, 14)));
    ok(barre.length === 0, "texte à 130 % : libellés de la barre de jeu (Mélanger, Effacer, Valider, Indice, chrono, compteurs) non coupés " + barre.join(","));
    await jouerGroupes(page, GL, [0, 1, 2]); await page.waitForTimeout(800);
    m = await mesures(page);
    ok(m.motsHorsCarte.length === 0 && m.valider.visible && !m.debordePage, "texte à 130 %, 3 groupes trouvés : mots dans leurs cartes, Valider toujours visible");
    const groupes = await page.evaluate(() => [...document.querySelectorAll("#trouves .group")].filter(g => g.scrollWidth > g.clientWidth + 1 || [...g.querySelectorAll("*")].some(e => e.getBoundingClientRect().right > g.getBoundingClientRect().right + 1)).length);
    ok(groupes === 0, "texte à 130 % : les bandeaux des groupes trouvés ne débordent pas");
    await jouerGroupes(page, GL, [3]); await page.waitForSelector("#fin:not(.hidden)"); await page.waitForTimeout(300);
    const fin = await page.evaluate(() => ({ deborde: document.documentElement.scrollWidth > window.innerWidth + 1, nav: (() => { const bs = [...document.querySelectorAll("#nav-bas button")]; const boites = bs.map(b => { const r = document.createRange(); r.selectNodeContents(b); const x = r.getBoundingClientRect(); return { nom: b.textContent.trim(), g: x.left, d: x.right, coupe: getComputedStyle(b).overflow !== "visible" && b.scrollWidth > b.clientWidth + 1, depasse: Math.max(0, b.scrollWidth - b.clientWidth) }; });
      return { gene: boites.filter((x, i) => x.coupe || x.g < -0.5 || x.d > window.innerWidth + 0.5 || (i > 0 && x.g < boites[i - 1].d - 0.5)).map(x => x.nom), depasse: boites.filter(x => x.depasse > 1).map(x => `${x.nom} (+${x.depasse} px)`) }; })() }));
    ok(!fin.deborde, "texte à 130 % : écran de fin sans débordement horizontal");
    ok(fin.nav.gene.length === 0, "texte à 130 % : libellés de la barre du bas ni coupés ni superposés " + fin.nav.gene.join(","));
    if (fin.nav.depasse.length) note("texte à 130 % : libellé plus large que son bouton, sans être coupé ni toucher le voisin : " + fin.nav.depasse.join(", "));
    await page.click('#nav-bas [data-ecran="accueil"]'); await page.waitForSelector("#ecran-accueil:not(.hidden)");
    for (const o of ["accueil", "jeux", "progression", "stats"]) { await page.click(`#nav-bas [data-ecran="${o}"]`); await page.waitForTimeout(150);
      const dx = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(dx <= 1, `texte à 130 % : onglet ${o} sans débordement horizontal${dx > 1 ? " (+" + dx + " px)" : ""}`); }
    ok(errJs(page).length === 0, "aucune erreur JavaScript " + errJs(page).join(" | "));
  }

  // =====================================================================================================
  try {
    const SE = "iPhone SE", I13 = "iPhone 13";
    await section("1. Passage à minuit, heure de Paris (iPhone 13 : compte à rebours sur l'écran de fin)", () => scenarioMinuit(I13, "fin"));
    await section("1b. Passage à minuit (iPhone SE : compte à rebours sur l'accueil)", () => scenarioMinuit(SE, "accueil"));
    await decaler(0);
    await section("2. Hors-ligne en cours de partie (iPhone 13, retour en ligne puis une action)", () => scenarioHorsLigne(I13, "action"));
    await section("2b. Hors-ligne en cours de partie (iPhone SE, retour en ligne puis nouvelle visite)", () => scenarioHorsLigne(SE, "visite"));
    await section("2c. Réponse du serveur perdue (iPhone 13)", () => scenarioReponsePerdue(I13));
    await section("2d. Premier chargement sans réseau (iPhone SE)", () => scenarioPremierChargement(SE));
    for (const a of [I13, SE]) await section(`3. localStorage plein, indisponible, corrompu (${a})`, async () => {
      const casses = await scenarioStockage(a, a === SE); if (!casses) return;
      // DÉFAUT D3 : une clé quotidien_* qui contient du JSON valide mais d'une forme inattendue bloque le jeu pour de bon
      // (aucune remise à zéro, « Réessayer » n'y change rien, et le message parle à tort de connexion) :
      //  - quotidien_file (index.html, envoyer() : file.push sur autre chose qu'un tableau) → toucher un mot ne fait plus rien ;
      //  - quotidien_etat_<id>_<grille> (index.html, lancerGrille() : etat.trouves / etat.essais supposés présents) → la grille ne s'ouvre pas ;
      //  - quotidien_journal_<id> (progression.js, serie() et calculer() : entrées supposées être des objets) → accueil bloqué ;
      //  - quotidien_defi_<id> (defi.js, lire() sans contrôle de forme ; appelé par rendreAccueil()) → accueil bloqué.
      connu(casses.length === 0, "D3", `clé quotidien_* au contenu JSON valide mais de forme inattendue (8 clés essayées une par une) : le jeu devrait repartir d'un état neuf ; ${casses.length} clés bloquent le joueur : ${casses.join(" || ")}`);
    });
    for (const a of [I13, SE]) await section(`4. Retour arrière et double onglet (${a})`, async () => { await scenarioRetour(a); await scenarioDoubleOnglet(a); });
    for (const a of [I13, SE]) await section(`5. Paramètres d'URL hostiles (${a})`, () => scenarioUrl(a));
    for (const a of [I13, SE]) await section(`6. Partage (${a})`, () => scenarioPartage(a));
    await section("7. Rotation en paysage pendant une partie (iPhone SE, 667×375)", () => scenarioPaysage(SE, { width: 667, height: 375 }));
    await section("7b. Rotation en paysage pendant une partie (iPhone 13, 844×390)", () => scenarioPaysage(I13, { width: 844, height: 390 }));
    for (const a of [SE, I13]) await section(`8. Texte agrandi à 130 % (${a})`, () => scenarioTexteAgrandi(a));
  } catch (e) { console.error(e); echecs++; }

  console.log(`\nRobustesse : ${nbOk} OK, ${nbConnus} À CORRIGER (défauts connus du jeu, détaillés en commentaire dans tests/test_robustesse.js), ${nbNotes} notes, ${echecs} échec(s).`);
  console.log(echecs ? `Robustesse : ${echecs} échec(s).` : "Robustesse : tous les tests passent.");
  await fermer(echecs ? 1 : 0);
})();
