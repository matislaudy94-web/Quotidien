// Défi express : moteur (tirage reproductible, paliers, classement, records, badges).
// Aucune XP : le Défi a ses propres records et badges, séparés de la progression (progression.js).
// Tirage : une « graine » (texte) détermine toute la suite des paliers. Même graine = mêmes paliers
// pour tout le monde (duel équitable) ; partie solo = graine tirée au hasard à chaque partie.
(function () {
  "use strict";
  const BANQUE = window.QUOTIDIEN_DEFI || { familles: [], categories: [], incompatibles: [] };

  // ---------- Règles ----------
  // Règles du 29/10/2026 : UN seul chrono pour toute la partie (30 s au départ),
  // +2 s par groupe trouvé, −2 s par erreur. La partie s'arrête quand le chrono tombe à zéro.
  const REGLES = 2;
  const DUREE_MS = 30000;     // temps de départ de la partie
  const BONUS_MS = 2000;      // un groupe trouvé rajoute 2 secondes
  const PENALITE_MS = 2000;   // une erreur retire 2 secondes
  const MAX_PALIERS = 30;
  // Taille du plateau selon le palier : de 2 groupes de 2 mots à 4 groupes de 3 mots.
  function format(n) {
    if (n <= 3) return { groupes: 2, taille: 2 };
    if (n <= 7) return { groupes: 2, taille: 3 };
    if (n <= 12) return { groupes: 3, taille: 2 };
    if (n <= 18) return { groupes: 3, taille: 3 };
    return { groupes: 4, taille: 3 };
  }

  // ---------- Hasard reproductible ----------
  function hachage(texte) { // xmur3
    let h = 1779033703 ^ texte.length;
    for (let i = 0; i < texte.length; i++) { h = Math.imul(h ^ texte.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
  function aleatoire(graine) { // mulberry32
    let a = hachage(String(graine));
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function melanger(liste, rnd) { const a = liste.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function nouvelleGraine() {
    const alpha = "abcdefghijkmnopqrstuvwxyz23456789"; let s = "";
    try { const t = new Uint32Array(10); crypto.getRandomValues(t); for (const x of t) s += alpha[x % alpha.length]; }
    catch (e) { for (let i = 0; i < 10; i++) s += alpha[Math.floor(Math.random() * alpha.length)]; }
    return s;
  }

  // ---------- Incompatibilités ----------
  const incompat = new Set();
  for (const [a, b] of BANQUE.incompatibles || []) { incompat.add(a + "|" + b); incompat.add(b + "|" + a); }
  const compatibles = (a, b) => a.famille !== b.famille && !incompat.has(a.id + "|" + b.id);

  // ---------- Génération d'un palier ----------
  // Règles : catégories de familles différentes, jamais deux catégories déclarées incompatibles,
  // et (si possible) aucune catégorie déjà vue dans les 3 paliers précédents.
  function genererPalier(graine, n, recentes) {
    const rnd = aleatoire(graine + "#" + n);
    const { groupes, taille } = format(n);
    const cats = melanger(BANQUE.categories.filter(c => c.mots.length >= taille), rnd);
    const essayer = (exclure) => {
      const choix = [];
      for (const c of cats) {
        if (exclure.has(c.id)) continue;
        if (choix.every(d => compatibles(c, d))) choix.push(c);
        if (choix.length === groupes) return choix;
      }
      return null;
    };
    const choix = essayer(new Set(recentes || [])) || essayer(new Set());
    const grp = choix.map(c => ({ id: c.id, nom: c.nom, mots: melanger(c.mots, rnd).slice(0, taille) }));
    return { n, groupes: grp, taille, mots: melanger(grp.flatMap(g => g.mots), rnd) };
  }
  // Suite déterministe des paliers 1..nMax pour une graine.
  function genererSuite(graine, nMax) {
    const suite = [], recentes = [];
    for (let n = 1; n <= (nMax || MAX_PALIERS); n++) {
      const p = genererPalier(graine, n, recentes.slice(-3).flat());
      suite.push(p); recentes.push(p.groupes.map(g => g.id));
    }
    return suite;
  }
  // Renvoie l'index du groupe si les mots choisis forment exactement un groupe du palier, sinon -1.
  function groupeDe(palier, mots) {
    if (mots.length !== palier.taille) return -1;
    return palier.groupes.findIndex(g => mots.every(m => g.mots.includes(m)));
  }

  // ---------- Classement : le plus de paliers, puis le plus rapide à les atteindre ----------
  // temps_ms = temps de jeu écoulé au moment où le dernier palier a été réussi.
  const comparer = (a, b) => (b.paliers - a.paliers) || (a.temps_ms - b.temps_ms);

  // ---------- Records et badges (stockage local, sans XP) ----------
  const BADGES = [
    { id: "lancee", nom: "Sur la lancée", icone: "🔥", description: "Réussir 5 paliers dans une partie." },
    { id: "fusee", nom: "Fusée", icone: "🚀", description: "Réussir 10 paliers dans une partie." },
    { id: "inarretable", nom: "Inarrêtable", icone: "💥", description: "Réussir 20 paliers dans une partie." },
    { id: "sans_limite", nom: "Sans limite", icone: "🏁", description: "Réussir les 30 paliers." },
    { id: "main_sure", nom: "Main sûre", icone: "🎯", description: "Enchaîner 10 paliers sans aucune erreur." },
    { id: "reflexe", nom: "Réflexe", icone: "⚡", description: "Réussir un palier en moins de 3 secondes." },
    { id: "duelliste", nom: "Joueur d'équipe", icone: "⚔️", description: "Terminer une manche dans un groupe d'amis." },
    { id: "champion", nom: "Champion de manche", icone: "👑", description: "Gagner une manche de groupe où au moins 2 joueurs sont classés." },
  ];
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const cle = (profil) => "quotidien_defi_" + profil;
  function lire(profil) {
    const e = store.get(cle(profil)) || {};
    // Records obtenus avec les anciennes règles (30 s par palier) : pas comparables, on les met de côté. Les badges restent.
    if (e.parties && e.regles !== REGLES) { e.ancienRecord = e.record || null; e.record = null; e.dernieres = []; }
    e.regles = REGLES;
    return { regles: REGLES, ancienRecord: e.ancienRecord || null, parties: e.parties | 0, record: e.record || null, badges: e.badges || {}, salons: Array.isArray(e.salons) ? e.salons : [], dernieres: Array.isArray(e.dernieres) ? e.dernieres : [] };
  }
  function ecrire(profil, e) { store.set(cle(profil), e); }
  // partie = { paliers, temps_ms, serieSansErreur, meilleurPalierMs, salon }
  function enregistrerPartie(profil, partie) {
    const e = lire(profil);
    e.parties++;
    const score = { paliers: partie.paliers | 0, temps_ms: partie.temps_ms | 0, date: new Date().toISOString(), salon: partie.salon || null };
    const nouveauRecord = score.paliers > 0 && (!e.record || comparer(score, e.record) < 0);
    if (nouveauRecord) e.record = score;
    e.dernieres = [score].concat(e.dernieres).slice(0, 10);
    const gagnes = [];
    const gagner = (id) => { if (!e.badges[id]) { e.badges[id] = score.date; gagnes.push(BADGES.find(b => b.id === id)); } };
    if (score.paliers >= 5) gagner("lancee");
    if (score.paliers >= 10) gagner("fusee");
    if (score.paliers >= 20) gagner("inarretable");
    if (score.paliers >= MAX_PALIERS) gagner("sans_limite");
    if ((partie.serieSansErreur | 0) >= 10) gagner("main_sure");
    if (partie.meilleurPalierMs != null && partie.meilleurPalierMs < 3000) gagner("reflexe");
    if (partie.salon) gagner("duelliste");
    ecrire(profil, e);
    return { nouveauRecord, badges: gagnes, etat: e };
  }
  function marquerChampion(profil) {
    const e = lire(profil); if (e.badges.champion) return null;
    e.badges.champion = new Date().toISOString(); ecrire(profil, e); return BADGES.find(b => b.id === "champion");
  }
  function memoriserSalon(profil, salon) {
    const e = lire(profil);
    e.salons = [salon].concat(e.salons.filter(s => s.code !== salon.code)).slice(0, 20);
    ecrire(profil, e);
  }

  window.QuotidienDefi = { REGLES, DUREE_MS, BONUS_MS, PENALITE_MS, MAX_PALIERS, BADGES, format, aleatoire, nouvelleGraine, genererPalier, genererSuite, groupeDe, comparer,
    lire, enregistrerPartie, marquerChampion, memoriserSalon, BANQUE };
})();
