// Mini-jeu « Expression mystère » : moteur (tirage d'une partie, propositions, statistiques locales).
// La banque (expressions.json → expressions_banque.js) est éditoriale et vérifiée par verifier_expressions.py.
// L'XP passe par progression.js (enregistrerExpression) : ce fichier ne calcule aucune XP.
(function () {
  const BANQUE = window.QUOTIDIEN_EXPRESSIONS || { version: 0, expressions: [] };
  const TAILLE = 5;
  // Questions 1-2 faciles, 3-4 intermédiaires, 5 intermédiaire ou difficile.
  const COMPOSITION = [["facile"], ["facile"], ["intermediaire"], ["intermediaire"], ["intermediaire", "difficile"]];

  function aleatoire(graine) { // mulberry32 : même graine → même partie (tests)
    let a = graine >>> 0;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function melanger(liste, rnd) { const t = liste.slice(); for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; } return t; }

  // Assez de contenu pour une partie valide ?
  function partiePossible() {
    const n = (niv) => BANQUE.expressions.filter(x => x.difficulte === niv).length;
    return n("facile") >= 2 && n("intermediaire") >= 2 && n("intermediaire") + n("difficile") >= 3;
  }
  // Tire une partie : expressions jamais vues d'abord, aucune répétition dans la partie ; propositions mélangées.
  function tirerPartie(vues, graine) {
    if (!partiePossible()) return null;
    const rnd = aleatoire(graine == null ? (Math.random() * 2 ** 32) >>> 0 : graine);
    const deja = new Set(vues || []), prises = new Set(), partie = [];
    for (const niveaux of COMPOSITION) {
      const du = BANQUE.expressions.filter(x => niveaux.includes(x.difficulte) && !prises.has(x.id));
      const neuves = du.filter(x => !deja.has(x.id));
      const pool = neuves.length ? neuves : du;
      const x = pool[Math.floor(rnd() * pool.length)];
      prises.add(x.id);
      partie.push(Object.assign({}, x, { propositions: melanger([x.mot].concat(x.leurres), rnd) }));
    }
    return partie;
  }

  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const cle = (profil) => "quotidien_expression_" + profil;
  function lire(profil) {
    const e = store.get(cle(profil)) || {};
    return { parties: e.parties | 0, meilleur: e.meilleur == null ? null : e.meilleur | 0, parfaites: e.parfaites | 0,
      bonnes: e.bonnes | 0, repondues: e.repondues | 0, vues: Array.isArray(e.vues) ? e.vues : [],
      trouvees: Array.isArray(e.trouvees) ? e.trouvees : [], dernieres: Array.isArray(e.dernieres) ? e.dernieres : [], ids: Array.isArray(e.ids) ? e.ids : [] };
  }
  // partie = { id, score, total, vues: [ids], trouvees: [ids], duree_s } ; une partie (id) n'est comptée qu'une fois.
  function enregistrerPartie(profil, partie) {
    const e = lire(profil);
    if (e.ids.includes(partie.id)) return { deja: true, nouveauRecord: false, etat: e };
    e.ids = e.ids.concat([partie.id]).slice(-50);
    e.parties++; e.bonnes += partie.score; e.repondues += partie.total;
    const nouveauRecord = e.meilleur == null || partie.score > e.meilleur;
    if (nouveauRecord) e.meilleur = partie.score;
    if (partie.score === partie.total) e.parfaites++;
    e.vues = Array.from(new Set(e.vues.concat(partie.vues)));
    e.trouvees = Array.from(new Set(e.trouvees.concat(partie.trouvees)));
    // Quand toute la banque a été vue, les expressions peuvent revenir (on garde la liste des trouvées).
    if (BANQUE.expressions.length && BANQUE.expressions.every(x => e.vues.includes(x.id))) e.vues = [];
    e.dernieres = [{ score: partie.score, total: partie.total, duree_s: partie.duree_s, date: new Date().toISOString() }].concat(e.dernieres).slice(0, 10);
    store.set(cle(profil), e);
    return { deja: false, nouveauRecord, etat: e };
  }

  window.QuotidienExpression = { BANQUE, TAILLE, COMPOSITION, partiePossible, tirerPartie, lire, enregistrerPartie, aleatoire };
})();
