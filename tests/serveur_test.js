// Serveur de test LOCAL : sert les fichiers du prototype et simule la base (en mémoire).
// La logique de classement des visites reproduit celle des fonctions SQL (testées séparément sur la vraie base).
const http = require("http"), fs = require("fs"), path = require("path");
const RACINE = path.join(__dirname, "..");
const CODE = "code-test";
const db = { sessions: [], participants: [], rappels: [], evenements: [], salons: [], scores: [], groupes: [], membres: [], manches: [], resultats: [] };
// ---- Groupes du Défi (reproduit les fonctions SQL g_*) ----
const pseudoOk = (p) => String(p || "").trim().replace(/[<>"&]/g, "").slice(0, 16);
const t = (d) => new Date(d).getTime();
function statutManche(m) {
  const now = maintenant().getTime();
  if (m.close_le) return "terminee";
  if (now < t(m.demarre_le)) return "compte_a_rebours";
  const nMembres = db.membres.filter(x => x.groupe === m.groupe && t(x.rejoint_le) <= t(m.lancee_le)).length;
  const rs = db.resultats.filter(r => r.manche === m.id);
  const finis = rs.filter(r => r.termine_le).length, enCours = rs.filter(r => !r.termine_le && now - t(r.commence_le) < 16 * 60000).length;
  if (finis >= nMembres) return "terminee";
  if (enCours === 0 && now > t(m.demarre_le) + 16 * 60000) return "terminee";
  return "en_cours";
}
const cloturable = (m) => statutManche(m) === "en_cours" && db.resultats.some(r => r.manche === m.id && r.termine_le) && !db.resultats.some(r => r.manche === m.id && !r.termine_le && maintenant().getTime() - t(r.commence_le) < 16 * 60000);
const derniereManche = (code) => db.manches.filter(m => m.groupe === code).sort((a, b) => b.numero - a.numero)[0];
let decalageJours = 0; // pour simuler « le lendemain »
const maintenant = () => new Date(Date.now() + decalageJours * 86400000);
const jour = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(d));
const nid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
// ---- Grille servie par le serveur (reproduit sql/2026-11-14_grille_serveur.sql, fonction par fonction) ----
db.grilles_serveur = []; db.parties = [];
const md5 = (s) => require("crypto").createHash("md5").update(s, "utf8").digest("hex");
const GS_DIFF = { facile: 0, intermediaire: 1, difficile: 2 };
let grilleServeur = process.env.GRILLE_SERVEUR === "1"; // interrupteur servi dans config.js (éteint par défaut)
const gsParticipant = (id) => db.participants.find(x => x.id === String(id || "").toUpperCase());
// Grille du jour d'un participant : grille forcée, sinon calendrier de sa session à la date du jour (heure de Paris).
function gsIdDuJour(p) { const s = db.sessions.find(x => x.id === p.session_id); return p.grille_forcee || (s && s.calendrier && s.calendrier[jour(maintenant())]) || null; }
// Grille en jeu : celle du jour ; ou celle que le client nomme, s'il y a déjà une partie non terminée dessus (partie à cheval sur minuit).
function gsIdEnJeu(p, demandee) { const j = gsIdDuJour(p); return demandee && demandee !== j && db.parties.some(x => x.participant_id === p.id && x.grille_id === demandee && !x.terminee) ? demandee : j; }
// Groupes tels qu'on peut les montrer : index dans la grille et couleur (rang par difficulté puis par index, comme couleurDe() du client).
function gsPublics(groupes) { const tri = groupes.map((g, i) => i).sort((a, b) => GS_DIFF[groupes[a].difficulte] - GS_DIFF[groupes[b].difficulte] || a - b);
  return groupes.map((g, i) => ({ index: i, couleur: tri.indexOf(i), categorie: g.categorie, difficulte: g.difficulte, mots: g.mots, explication: g.explication })); }
// Ordre des 16 mots : stable par participant et par grille (tri sur md5), jamais l'ordre des groupes.
function gsOrdre(pid, gid, groupes) { const naturel = groupes.flatMap(g => g.mots), k = (m) => md5(pid + ":" + gid + ":" + m);
  const o = naturel.slice().sort((a, b) => k(a) < k(b) ? -1 : k(a) > k(b) ? 1 : 0); if (o.join("|") === naturel.join("|")) o.push(o.shift()); return o; }
const gsTri = (mots) => mots.slice().sort((a, b) => Buffer.compare(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"))); // ordre des octets, comme collate "C"
function gsPartie(p, gid, creer) { let x = db.parties.find(y => y.participant_id === p.id && y.grille_id === gid);
  if (!x && creer) { x = { participant_id: p.id, grille_id: gid, trouves: [], essais: [], erreurs: 0, indices: [], terminee: false, gagnee: false, debut: maintenant().toISOString(), fin: null }; db.parties.push(x); } return x; }
const gsNiveau = (v) => ["facile", "intermediaire", "difficile"].includes(v);
function gsValider(g) { // renvoie la raison du refus, ou null si la grille est bien formée
  if (!g || typeof g !== "object" || Array.isArray(g)) return "format";
  if (typeof g.id !== "string" || !/^[A-Za-z0-9_-]{1,10}$/.test(g.id)) return "id";
  if (!gsNiveau(g.niveau)) return "niveau";
  if (!Array.isArray(g.groupes) || g.groupes.length !== 4) return "groupes";
  for (const gr of g.groupes) { if (!gr || typeof gr !== "object" || typeof gr.categorie !== "string" || !gr.categorie.trim() || !gsNiveau(gr.difficulte)) return "groupe";
    if (!Array.isArray(gr.mots) || gr.mots.length !== 4 || gr.mots.some(m => typeof m !== "string" || !m.trim())) return "mots"; }
  if (new Set(g.groupes.flatMap(gr => gr.mots)).size !== 16) return "mots_distincts";
  return null; }
function admin(c) { if (c !== CODE) { const e = new Error("code administrateur invalide"); e.status = 401; throw e; } }
const F = {
  q_identifier({ p_id }) { const p = db.participants.find(x => x.id === String(p_id).toUpperCase()); if (!p) return { existe: false };
    const s = db.sessions.find(x => x.id === p.session_id); return { existe: true, id: p.id, session_id: s.id, calendrier: s.calendrier, grille_forcee: p.grille_forcee, session_active: s.active }; },
  q_rejoindre({ p_invite_par }) { const inv = p_invite_par && db.participants.find(x => x.id === p_invite_par.toUpperCase());
    const sid = inv ? inv.session_id : (db.sessions.filter(s => s.active).slice(-1)[0] || {}).id; if (!sid) return { ok: false };
    const p = { id: nid(), session_id: sid, groupe: inv ? "invite" : "organique", invite_par: inv ? inv.id : null, grille_forcee: null, lien_envoye_le: null, created_at: maintenant().toISOString() };
    db.participants.push(p); return { ok: true, id: p.id }; },
  q_visite({ p_id, p_visite, p_entree, p_token, p_grille, p_appareil }) { const p = db.participants.find(x => x.id === p_id); if (!p) return { ok: false };
    const now = maintenant(); const vis = db.evenements.filter(e => e.participant_id === p.id && e.type === "visite");
    const recent = (r) => now - new Date(r.created_at) < 86400000;
    const tokOk = p_token && db.rappels.some(r => r.token === p_token && r.participant_id === p.id && recent(r));
    const rapRecent = db.rappels.some(r => r.participant_id === p.id && recent(r));
    const classe = !vis.length ? "premiere_visite" : vis.some(v => jour(v.created_at) === jour(now)) ? "revisite_meme_jour" : tokOk ? "retour_apres_rappel" : p_entree === "defi" ? "retour_defi" : rapRecent ? "retour_rappel_probable" : "retour_spontane";
    db.evenements.push({ id: db.evenements.length + 1, participant_id: p.id, session_id: p.session_id, visite_id: p_visite, grille: p_grille, type: "visite", donnees: { entree: p_entree, classe, token: !!p_token, appareil: p_appareil || null }, created_at: now.toISOString() });
    return { ok: true, classe }; },
  q_evenement({ p_id, p_visite, p_grille, p_type, p_donnees }) { const p = db.participants.find(x => x.id === p_id); if (!p) return false;
    if (!["debut","essai","fin","demande_suivante","partage","questionnaire","regles","recompense","indice","entrainement","defi","minijeu"].includes(p_type)) return false;
    db.evenements.push({ id: db.evenements.length + 1, participant_id: p.id, session_id: p.session_id, visite_id: p_visite, grille: p_grille, type: p_type, donnees: p_donnees || {}, created_at: maintenant().toISOString() }); return true; },
  q_grille({ p_id, p_grille }) { const p = gsParticipant(p_id); if (!p) return { ok: false };
    const id = gsIdEnJeu(p, p_grille), g = db.grilles_serveur.find(x => x.id === id); if (!g) return { ok: true, serveur: false, id };
    const x = gsPartie(p, id) || { trouves: [], essais: [], erreurs: 0, indices: [], terminee: false, gagnee: false }, pub = gsPublics(g.groupes);
    const r = { ok: true, serveur: true, id, mots: gsOrdre(p.id, id, g.groupes),
      partie: { trouves: x.trouves.map(i => pub[i]), erreurs: x.erreurs, essais: x.essais, terminee: x.terminee, gagnee: x.gagnee, indices: x.indices.map(i => ({ mots: i.mots })) } };
    if (x.terminee) { r.niveau = g.niveau; if (x.gagnee) r.solution = pub; } // jamais de solution ni de niveau avant la fin, jamais de solution après un échec
    return r; },
  q_essai({ p_id, p_mots, p_grille }) { const p = gsParticipant(p_id); if (!p) return { ok: false, raison: "inconnu" };
    const id = gsIdEnJeu(p, p_grille), g = db.grilles_serveur.find(x => x.id === id); if (!g) return { ok: false, raison: "grille" };
    const tous = g.groupes.flatMap(gr => gr.mots);
    if (!Array.isArray(p_mots) || p_mots.length !== 4 || new Set(p_mots).size !== 4 || p_mots.some(m => !tous.includes(m))) return { ok: false, raison: "mots" };
    const x = gsPartie(p, id, true); if (x.terminee) return { ok: false, raison: "terminee" };
    const tri = gsTri(p_mots); if (x.essais.some(e => e.mots.join("|") === tri.join("|"))) return { ok: true, deja: true }; // essai répété : ne coûte rien
    if (x.essais.length >= 60) return { ok: false, raison: "limite" };
    const compte = g.groupes.map((gr, i) => x.trouves.includes(i) ? 0 : gr.mots.filter(m => p_mots.includes(m)).length);
    if (compte.reduce((a, b) => a + b, 0) !== 4) return { ok: false, raison: "mots" }; // un mot appartient à un groupe déjà trouvé
    const max = Math.max(...compte), juste = max === 4, presque = max === 3, gi = compte.indexOf(4);
    x.essais.push({ mots: tri, juste, presque });
    if (juste) { x.trouves.push(gi); if (x.trouves.length === 4) { x.terminee = true; x.gagnee = true; } }
    else { x.erreurs++; if (x.erreurs >= 4) x.terminee = true; }
    if (x.terminee) x.fin = maintenant().toISOString();
    const pub = gsPublics(g.groupes), r = { ok: true, juste, presque, erreurs: x.erreurs, terminee: x.terminee, gagnee: x.gagnee };
    if (juste) r.groupe = pub[gi];
    if (x.terminee) { r.niveau = g.niveau; if (x.gagnee) r.solution = pub; }
    return r; },
  q_indice({ p_id, p_grille }) { const p = gsParticipant(p_id); if (!p) return { ok: false };
    const id = gsIdEnJeu(p, p_grille), g = db.grilles_serveur.find(x => x.id === id); if (!g) return { ok: false };
    const x = gsPartie(p, id, true); if (x.terminee) return { ok: false };
    if (Math.min(2, 1 + (x.erreurs >= 2 ? 1 : 0)) - x.indices.length <= 0) return { ok: false }; // 1 indice par grille, un second après 2 erreurs
    const cand = g.groupes.map((gr, i) => i).filter(i => !x.trouves.includes(i) && !x.indices.some(n => n.groupe === i))
      .sort((a, b) => GS_DIFF[g.groupes[a].difficulte] - GS_DIFF[g.groupes[b].difficulte] || a - b); if (!cand.length) return { ok: false };
    const k = (m) => md5(p.id + ":" + id + ":indice:" + m);
    const mots = g.groupes[cand[0]].mots.slice().sort((a, b) => k(a) < k(b) ? -1 : k(a) > k(b) ? 1 : 0).slice(0, 2);
    x.indices.push({ groupe: cand[0], mots }); return { ok: true, mots }; },
  // ---- Défi express (reproduit les fonctions SQL d_*) ----
  d_creer_salon({ p_joueur, p_pseudo, p_graine }) { const pseudo = String(p_pseudo || "").trim().replace(/[<>"&]/g, "").slice(0, 16);
    if (String(p_joueur || "").length < 6 || !pseudo) return { ok: false, raison: "pseudo" };
    const code = nid(); const graine = String(p_graine || "").replace(/[^a-z0-9]/g, "") || Math.random().toString(36).slice(2, 12);
    db.salons.push({ code, graine: graine.slice(0, 20), createur: p_joueur, createur_pseudo: pseudo, max_joueurs: 6, expire_le: new Date(maintenant().getTime() + 7 * 86400000).toISOString() });
    return p_graine ? { ok: true, code, graine: graine.slice(0, 20) } : { ok: true, code }; },
  d_salon({ p_code, p_joueur }) { const s = db.salons.find(x => x.code === String(p_code).toUpperCase().trim()); if (!s) return { existe: false };
    const sc = db.scores.filter(x => x.salon === s.code); const moi = sc.find(x => x.joueur === p_joueur);
    return { existe: true, code: s.code, createur_pseudo: s.createur_pseudo, max_joueurs: s.max_joueurs, expire_le: s.expire_le, ouvert: new Date(s.expire_le) > maintenant(),
      moi: moi ? { pseudo: moi.pseudo, paliers: moi.paliers, temps_ms: moi.temps_ms } : null,
      joueurs: sc.map(x => ({ pseudo: x.pseudo, paliers: x.paliers, temps_ms: x.temps_ms, termine: x.paliers != null, moi: x.joueur === p_joueur })) }; },
  d_commencer({ p_code, p_joueur, p_pseudo }) { const s = db.salons.find(x => x.code === String(p_code).toUpperCase().trim()); if (!s) return { ok: false, raison: "inconnu" };
    if (new Date(s.expire_le) <= maintenant()) return { ok: false, raison: "ferme" };
    const pseudo = String(p_pseudo || "").trim().replace(/[<>"&]/g, "").slice(0, 16); if (String(p_joueur || "").length < 6 || !pseudo) return { ok: false, raison: "pseudo" };
    if (db.scores.some(x => x.salon === s.code && x.joueur === p_joueur)) return { ok: false, raison: "deja_joue" };
    if (db.scores.filter(x => x.salon === s.code).length >= s.max_joueurs) return { ok: false, raison: "complet" };
    db.scores.push({ salon: s.code, joueur: p_joueur, pseudo, paliers: null, temps_ms: null }); return { ok: true, graine: s.graine }; },
  d_score({ p_code, p_joueur, p_paliers, p_temps_ms }) {
    if (p_paliers == null || p_paliers < 0 || p_paliers > 30 || p_temps_ms == null || p_temps_ms < p_paliers * 500 || p_temps_ms > 900000) return { ok: false, raison: "invalide" };
    const x = db.scores.find(y => y.salon === String(p_code).toUpperCase().trim() && y.joueur === p_joueur && y.paliers == null); if (!x) return { ok: false };
    x.paliers = p_paliers; x.temps_ms = p_temps_ms; return { ok: true }; },
  g_creer({ p_joueur, p_pseudo, p_nom }) { const ps = pseudoOk(p_pseudo); if (String(p_joueur || "").length < 6 || !ps) return { ok: false, raison: "pseudo" };
    const code = nid(); db.groupes.push({ code, nom: pseudoOk(p_nom) || "Groupe de " + ps, hote: p_joueur, max_membres: 6, expire_le: new Date(maintenant().getTime() + 30 * 86400000).toISOString() });
    db.membres.push({ groupe: code, joueur: p_joueur, pseudo: ps, rejoint_le: maintenant().toISOString(), vu_le: maintenant().toISOString() }); return { ok: true, code }; },
  g_rejoindre({ p_code, p_joueur, p_pseudo }) { const g = db.groupes.find(x => x.code === String(p_code).toUpperCase().trim()); if (!g) return { ok: false, raison: "inconnu" };
    const ps = pseudoOk(p_pseudo); if (String(p_joueur || "").length < 6 || !ps) return { ok: false, raison: "pseudo" };
    const deja = db.membres.find(x => x.groupe === g.code && x.joueur === p_joueur); if (deja) { deja.pseudo = ps; return { ok: true, deja: true }; }
    const ms = db.membres.filter(x => x.groupe === g.code); if (ms.length >= g.max_membres) return { ok: false, raison: "complet" };
    if (ms.some(x => x.pseudo.toLowerCase() === ps.toLowerCase())) return { ok: false, raison: "pseudo_pris" };
    db.membres.push({ groupe: g.code, joueur: p_joueur, pseudo: ps, rejoint_le: maintenant().toISOString(), vu_le: maintenant().toISOString() }); return { ok: true }; },
  g_etat({ p_code, p_joueur }) { const g = db.groupes.find(x => x.code === String(p_code).toUpperCase().trim()); if (!g) return { existe: false };
    const now = maintenant(); const moi = db.membres.find(x => x.groupe === g.code && x.joueur === p_joueur); if (moi) moi.vu_le = now.toISOString();
    const m = derniereManche(g.code); const ms = db.membres.filter(x => x.groupe === g.code);
    const general = ms.map(mb => { let points = 0, manches = 0, victoires = 0, paliers = 0;
      for (const mm of db.manches.filter(x => x.groupe === g.code && statutManche(x) === "terminee")) {
        const rs = db.resultats.filter(r => r.manche === mm.id && r.termine_le); const r = rs.find(x => x.joueur === mb.joueur); if (!r) continue;
        const rang = 1 + rs.filter(x => x.paliers > r.paliers || (x.paliers === r.paliers && x.temps_ms < r.temps_ms)).length;
        points += rs.length - rang + 1; manches++; if (rang === 1) victoires++; paliers += r.paliers; }
      return { pseudo: mb.pseudo, moi: mb.joueur === p_joueur, points, manches, victoires, paliers }; })
      .sort((a, b) => b.points - a.points || b.victoires - a.victoires || b.paliers - a.paliers || a.pseudo.localeCompare(b.pseudo));
    return { existe: true, code: g.code, nom: g.nom, ouvert: t(g.expire_le) > now.getTime(), max_membres: g.max_membres, maintenant: now.toISOString(), membre: !!moi, hote: g.hote === p_joueur,
      membres: ms.map(x => ({ pseudo: x.pseudo, hote: x.joueur === g.hote, moi: x.joueur === p_joueur, en_ligne: now.getTime() - t(x.vu_le) < 12000 })),
      manche: m ? { numero: m.numero, demarre_le: m.demarre_le, statut: statutManche(m), cloturable: cloturable(m), je_participe: !!moi && t(moi.rejoint_le) <= t(m.lancee_le),
        mon_resultat: (r => r ? { paliers: r.paliers, temps_ms: r.temps_ms, termine: !!r.termine_le } : null)(db.resultats.find(r => r.manche === m.id && r.joueur === p_joueur)),
        resultats: db.resultats.filter(r => r.manche === m.id).map(r => ({ pseudo: ms.find(x => x.joueur === r.joueur).pseudo, moi: r.joueur === p_joueur, paliers: r.paliers, temps_ms: r.temps_ms, termine: !!r.termine_le })) } : null,
      general, manches_jouees: db.manches.filter(x => x.groupe === g.code && statutManche(x) === "terminee").length }; },
  g_lancer({ p_code, p_joueur }) { const g = db.groupes.find(x => x.code === String(p_code).toUpperCase().trim()); if (!g) return { ok: false, raison: "inconnu" };
    if (g.hote !== p_joueur) return { ok: false, raison: "pas_hote" };
    if (db.membres.filter(x => x.groupe === g.code).length < 2) return { ok: false, raison: "seul" };
    const m = derniereManche(g.code); if (m && statutManche(m) !== "terminee") return { ok: false, raison: "en_cours" };
    const numero = (m ? m.numero : 0) + 1, now = maintenant().getTime();
    db.manches.push({ id: db.manches.length + 1, groupe: g.code, numero, graine: Math.random().toString(16).slice(2, 14), lancee_le: new Date(now + 1).toISOString(), demarre_le: new Date(now + 5000).toISOString(), close_le: null });
    return { ok: true, numero }; },
  g_commencer({ p_code, p_joueur }) { const g = db.groupes.find(x => x.code === String(p_code).toUpperCase().trim()); if (!g) return { ok: false, raison: "inconnu" };
    const moi = db.membres.find(x => x.groupe === g.code && x.joueur === p_joueur); if (!moi) return { ok: false, raison: "pas_membre" };
    const m = derniereManche(g.code); if (!m) return { ok: false, raison: "pas_de_manche" };
    if (t(moi.rejoint_le) > t(m.lancee_le)) return { ok: false, raison: "arrive_apres" };
    const st = statutManche(m); if (st === "terminee") return { ok: false, raison: "terminee" }; if (st === "compte_a_rebours") return { ok: false, raison: "pas_encore", demarre_le: m.demarre_le };
    if (db.resultats.some(r => r.manche === m.id && r.joueur === p_joueur)) return { ok: false, raison: "deja_joue" };
    db.resultats.push({ manche: m.id, joueur: p_joueur, paliers: null, temps_ms: null, commence_le: maintenant().toISOString(), termine_le: null }); return { ok: true, graine: m.graine, numero: m.numero }; },
  g_score({ p_code, p_joueur, p_numero, p_paliers, p_temps_ms }) {
    if (p_paliers == null || p_paliers < 0 || p_paliers > 30 || p_temps_ms == null || p_temps_ms < p_paliers * 500 || p_temps_ms > 900000) return { ok: false, raison: "invalide" };
    const m = db.manches.find(x => x.groupe === String(p_code).toUpperCase().trim() && x.numero === p_numero); if (!m) return { ok: false };
    const r = db.resultats.find(x => x.manche === m.id && x.joueur === p_joueur && x.paliers == null); if (!r) return { ok: false };
    r.paliers = p_paliers; r.temps_ms = p_temps_ms; r.termine_le = maintenant().toISOString(); return { ok: true }; },
  g_cloturer({ p_code, p_joueur }) { const g = db.groupes.find(x => x.code === String(p_code).toUpperCase().trim()); if (!g) return { ok: false, raison: "inconnu" };
    if (g.hote !== p_joueur) return { ok: false, raison: "pas_hote" }; const m = derniereManche(g.code);
    if (!m || !cloturable(m)) return { ok: false, raison: "rien_a_clore" }; m.close_le = maintenant().toISOString(); return { ok: true }; },
  a_sessions({ code }) { admin(code); return db.sessions.slice().reverse(); },
  a_creer_session({ code, p_nom, p_calendrier }) { admin(code); db.sessions.forEach(s => s.active = false); const s = { id: "S" + nid(), nom: p_nom, calendrier: p_calendrier, active: true, created_at: new Date().toISOString() }; db.sessions.push(s); return { id: s.id }; },
  a_maj_session({ code, p_session, p_calendrier, p_active }) { admin(code); const s = db.sessions.find(x => x.id === p_session); if (p_calendrier) s.calendrier = p_calendrier; if (p_active) { db.sessions.forEach(x => x.active = false); s.active = true; } return null; },
  a_creer_participants({ code, p_session, n }) { admin(code); const res = []; for (let i = 0; i < n; i++) { const nb = db.participants.filter(p => p.session_id === p_session && ["R","S"].includes(p.groupe)).length;
    const p = { id: nid(), session_id: p_session, groupe: nb % 2 ? "S" : "R", invite_par: null, grille_forcee: null, lien_envoye_le: null, created_at: new Date().toISOString() }; db.participants.push(p); res.push({ id: p.id, groupe: p.groupe }); } return res; },
  a_lien_envoye({ code, p_id }) { admin(code); const p = db.participants.find(x => x.id === p_id); p.lien_envoye_le = p.lien_envoye_le || new Date().toISOString(); return null; },
  a_creer_rappel({ code, p_id, p_grille }) { admin(code); const t = Math.random().toString(16).slice(2, 14); db.rappels.push({ token: t, participant_id: p_id, grille: p_grille, created_at: maintenant().toISOString() }); return t; },
  a_forcer_grille({ code, p_id, p_grille }) { admin(code); db.participants.find(x => x.id === p_id).grille_forcee = p_grille || null; return null; },
  a_grilles_serveur({ code }) { admin(code); return db.grilles_serveur.slice().sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(g => ({ id: g.id, niveau: g.niveau, groupes: g.groupes })); },
  a_charger_grilles({ code, p_grilles }) { admin(code); if (!Array.isArray(p_grilles)) return { ok: false, raison: "format" };
    const r = { ok: true, recues: p_grilles.length, creees: [], mises_a_jour: [], refusees: [] };
    for (const g of p_grilles) { const raison = gsValider(g); if (raison) { r.refusees.push({ id: g && !Array.isArray(g) && typeof g.id === "string" ? g.id : null, raison }); continue; }
      const propre = { id: g.id, niveau: g.niveau, groupes: g.groupes.map(gr => ({ categorie: gr.categorie, difficulte: gr.difficulte, mots: gr.mots, explication: typeof gr.explication === "string" ? gr.explication : "" })) };
      const i = db.grilles_serveur.findIndex(x => x.id === g.id); if (i >= 0) { db.grilles_serveur[i] = propre; r.mises_a_jour.push(g.id); } else { db.grilles_serveur.push(propre); r.creees.push(g.id); } }
    return r; },
  a_donnees({ code, p_session }) { admin(code); const P = db.participants.filter(p => p.session_id === p_session);
    return { participants: P, rappels: db.rappels.filter(r => P.some(p => p.id === r.participant_id)), evenements: db.evenements.filter(e => e.session_id === p_session) }; },
};
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png" };
const serveur = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__test/decaler") { decalageJours = Number(url.searchParams.get("jours")); res.end("ok"); return; }
  // Interrupteur « grille servie par le serveur » : /__test/config?grilleServeur=1 (ou variable GRILLE_SERVEUR=1 au lancement).
  if (url.pathname === "/__test/config") { grilleServeur = url.searchParams.get("grilleServeur") === "1"; res.end("ok"); return; }
  if (url.pathname === "/__test/db") { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(db)); return; }
  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    let corps = ""; req.on("data", c => corps += c); req.on("end", () => {
      const nom = url.pathname.split("/").pop();
      try { const r = F[nom](JSON.parse(corps || "{}")); res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(r === undefined ? null : r)); }
      catch (e) { res.statusCode = e.status || 400; res.end(JSON.stringify({ message: e.message })); }
    }); return;
  }
  let fichier = url.pathname === "/" ? "/index.html" : url.pathname;
  if (fichier === "/config.js") { res.setHeader("Content-Type", types[".js"]); res.end(`window.QUOTIDIEN_CONFIG={supabaseUrl:"http://localhost:${PORT}",supabaseKey:"test"${grilleServeur ? ",grilleServeur:true" : ""}};`); return; }
  const chemin = path.join(RACINE, path.normalize(fichier));
  if (!chemin.startsWith(RACINE) || !fs.existsSync(chemin)) { res.statusCode = 404; res.end("404"); return; }
  res.setHeader("Content-Type", types[path.extname(chemin)] || "application/octet-stream"); res.end(fs.readFileSync(chemin));
});
const PORT = Number(process.env.PORT || 8765);
serveur.listen(PORT, () => console.log("serveur de test sur http://localhost:" + PORT));
module.exports = { CODE };
