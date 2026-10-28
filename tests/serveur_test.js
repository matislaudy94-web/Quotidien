// Serveur de test LOCAL : sert les fichiers du prototype et simule la base (en mémoire).
// La logique de classement des visites reproduit celle des fonctions SQL (testées séparément sur la vraie base).
const http = require("http"), fs = require("fs"), path = require("path");
const RACINE = path.join(__dirname, "..");
const CODE = "code-test";
const db = { sessions: [], participants: [], rappels: [], evenements: [], salons: [], scores: [] };
let decalageJours = 0; // pour simuler « le lendemain »
const maintenant = () => new Date(Date.now() + decalageJours * 86400000);
const jour = (d) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(d));
const nid = () => Math.random().toString(36).slice(2, 8).toUpperCase();
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
    if (!["debut","essai","fin","demande_suivante","partage","questionnaire","regles","recompense","indice","entrainement","defi"].includes(p_type)) return false;
    db.evenements.push({ id: db.evenements.length + 1, participant_id: p.id, session_id: p.session_id, visite_id: p_visite, grille: p_grille, type: p_type, donnees: p_donnees || {}, created_at: maintenant().toISOString() }); return true; },
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
  a_sessions({ code }) { admin(code); return db.sessions.slice().reverse(); },
  a_creer_session({ code, p_nom, p_calendrier }) { admin(code); db.sessions.forEach(s => s.active = false); const s = { id: "S" + nid(), nom: p_nom, calendrier: p_calendrier, active: true, created_at: new Date().toISOString() }; db.sessions.push(s); return { id: s.id }; },
  a_maj_session({ code, p_session, p_calendrier, p_active }) { admin(code); const s = db.sessions.find(x => x.id === p_session); if (p_calendrier) s.calendrier = p_calendrier; if (p_active) { db.sessions.forEach(x => x.active = false); s.active = true; } return null; },
  a_creer_participants({ code, p_session, n }) { admin(code); const res = []; for (let i = 0; i < n; i++) { const nb = db.participants.filter(p => p.session_id === p_session && ["R","S"].includes(p.groupe)).length;
    const p = { id: nid(), session_id: p_session, groupe: nb % 2 ? "S" : "R", invite_par: null, grille_forcee: null, lien_envoye_le: null, created_at: new Date().toISOString() }; db.participants.push(p); res.push({ id: p.id, groupe: p.groupe }); } return res; },
  a_lien_envoye({ code, p_id }) { admin(code); const p = db.participants.find(x => x.id === p_id); p.lien_envoye_le = p.lien_envoye_le || new Date().toISOString(); return null; },
  a_creer_rappel({ code, p_id, p_grille }) { admin(code); const t = Math.random().toString(16).slice(2, 14); db.rappels.push({ token: t, participant_id: p_id, grille: p_grille, created_at: maintenant().toISOString() }); return t; },
  a_forcer_grille({ code, p_id, p_grille }) { admin(code); db.participants.find(x => x.id === p_id).grille_forcee = p_grille || null; return null; },
  a_donnees({ code, p_session }) { admin(code); const P = db.participants.filter(p => p.session_id === p_session);
    return { participants: P, rappels: db.rappels.filter(r => P.some(p => p.id === r.participant_id)), evenements: db.evenements.filter(e => e.session_id === p_session) }; },
};
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png" };
const serveur = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/__test/decaler") { decalageJours = Number(url.searchParams.get("jours")); res.end("ok"); return; }
  if (url.pathname === "/__test/db") { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(db)); return; }
  if (url.pathname.startsWith("/rest/v1/rpc/")) {
    let corps = ""; req.on("data", c => corps += c); req.on("end", () => {
      const nom = url.pathname.split("/").pop();
      try { const r = F[nom](JSON.parse(corps || "{}")); res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(r === undefined ? null : r)); }
      catch (e) { res.statusCode = e.status || 400; res.end(JSON.stringify({ message: e.message })); }
    }); return;
  }
  let fichier = url.pathname === "/" ? "/index.html" : url.pathname;
  if (fichier === "/config.js") { res.setHeader("Content-Type", types[".js"]); res.end(`window.QUOTIDIEN_CONFIG={supabaseUrl:"http://localhost:${PORT}",supabaseKey:"test"};`); return; }
  const chemin = path.join(RACINE, path.normalize(fichier));
  if (!chemin.startsWith(RACINE) || !fs.existsSync(chemin)) { res.statusCode = 404; res.end("404"); return; }
  res.setHeader("Content-Type", types[path.extname(chemin)] || "application/octet-stream"); res.end(fs.readFileSync(chemin));
});
const PORT = Number(process.env.PORT || 8765);
serveur.listen(PORT, () => console.log("serveur de test sur http://localhost:" + PORT));
module.exports = { CODE };
