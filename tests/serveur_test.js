// Serveur de test LOCAL : sert les fichiers du prototype et simule la base (en mémoire).
// La logique de classement des visites reproduit celle des fonctions SQL (testées séparément sur la vraie base).
const http = require("http"), fs = require("fs"), path = require("path");
const RACINE = path.join(__dirname, "..");
const CODE = "code-test";
const db = { sessions: [], participants: [], rappels: [], evenements: [] };
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
  q_visite({ p_id, p_visite, p_entree, p_token, p_grille }) { const p = db.participants.find(x => x.id === p_id); if (!p) return { ok: false };
    const now = maintenant(); const vis = db.evenements.filter(e => e.participant_id === p.id && e.type === "visite");
    const recent = (r) => now - new Date(r.created_at) < 86400000;
    const tokOk = p_token && db.rappels.some(r => r.token === p_token && r.participant_id === p.id && recent(r));
    const rapRecent = db.rappels.some(r => r.participant_id === p.id && recent(r));
    const classe = !vis.length ? "premiere_visite" : vis.some(v => jour(v.created_at) === jour(now)) ? "revisite_meme_jour" : tokOk ? "retour_apres_rappel" : rapRecent ? "retour_rappel_probable" : "retour_spontane";
    db.evenements.push({ id: db.evenements.length + 1, participant_id: p.id, session_id: p.session_id, visite_id: p_visite, grille: p_grille, type: "visite", donnees: { entree: p_entree, classe, token: !!p_token }, created_at: now.toISOString() });
    return { ok: true, classe }; },
  q_evenement({ p_id, p_visite, p_grille, p_type, p_donnees }) { const p = db.participants.find(x => x.id === p_id); if (!p) return false;
    if (!["debut","essai","fin","demande_suivante","partage","questionnaire","regles"].includes(p_type)) return false;
    db.evenements.push({ id: db.evenements.length + 1, participant_id: p.id, session_id: p.session_id, visite_id: p_visite, grille: p_grille, type: p_type, donnees: p_donnees || {}, created_at: maintenant().toISOString() }); return true; },
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
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json" };
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
