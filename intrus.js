// Mini-jeu « Le mot intrus » : moteur (tirage d'une série, records, trophées). Aucune XP, aucun lien avec la grille du jour.
// La banque (intrus.json → intrus_banque.js) est éditoriale et vérifiée par verifier_intrus.py : rien n'est généré à la volée.
(function () {
  const BANQUE = window.QUOTIDIEN_INTRUS || { version: 0, questions: [] };
  const TAILLE_SERIE = 5;
  // Composition d'une série : 2 faciles, 2 moyennes, 1 difficile, dans cet ordre (la difficulté monte).
  const COMPOSITION = ["facile", "facile", "moyen", "moyen", "difficile"];

  function aleatoire(graine) { // mulberry32 : même graine → même série (utile aux tests)
    let a = graine >>> 0;
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function melanger(liste, rnd) { const t = liste.slice(); for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; } return t; }

  // Tire une série : les questions jamais vues d'abord ; quand tout a été vu, on recommence le tour.
  // Les 4 mots sont mélangés à chaque partie (l'intrus n'est jamais à une place fixe).
  function tirerSerie(vues, graine) {
    const rnd = aleatoire(graine == null ? (Math.random() * 2 ** 32) >>> 0 : graine);
    const dejaVues = new Set(vues || []), prises = new Set();
    const serie = [];
    for (const niv of COMPOSITION) {
      const du = BANQUE.questions.filter(q => q.difficulte === niv && !prises.has(q.id));
      const neuves = du.filter(q => !dejaVues.has(q.id));
      const pool = neuves.length ? neuves : du;
      if (!pool.length) continue;
      const q = pool[Math.floor(rnd() * pool.length)];
      prises.add(q.id);
      serie.push(Object.assign({}, q, { ordre: melanger(q.mots, rnd) }));
    }
    return serie;
  }

  const BADGES = [
    { id: "oeil", nom: "Œil de lynx", icone: "🔎", description: "Faire 5/5 dans une série." },
    { id: "trois_parfaites", nom: "Fin limier", icone: "🕵️", description: "Faire 5/5 dans trois séries." },
    { id: "tour", nom: "Tour complet", icone: "📚", description: "Avoir vu toutes les questions de la banque." },
  ];
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const cle = (profil) => "quotidien_intrus_" + profil;
  function lire(profil) {
    const e = store.get(cle(profil)) || {};
    return { series: e.series | 0, meilleur: e.meilleur == null ? null : e.meilleur | 0, parfaites: e.parfaites | 0,
      bonnes: e.bonnes | 0, repondues: e.repondues | 0, vues: Array.isArray(e.vues) ? e.vues : [], badges: e.badges || {},
      dernieres: Array.isArray(e.dernieres) ? e.dernieres : [] };
  }
  // partie = { score, total, ids } ; renvoie { nouveauRecord, badges, etat }
  function enregistrerSerie(profil, partie) {
    const e = lire(profil), date = new Date().toISOString();
    e.series++; e.bonnes += partie.score; e.repondues += partie.total;
    const nouveauRecord = e.meilleur == null || partie.score > e.meilleur;
    if (nouveauRecord) e.meilleur = partie.score;
    if (partie.score === partie.total && partie.total === TAILLE_SERIE) e.parfaites++;
    e.vues = Array.from(new Set(e.vues.concat(partie.ids)));
    // Quand toute la banque a été vue, le tour recommence (les questions déjà vues peuvent revenir).
    const total = BANQUE.questions.length;
    const tourFini = total > 0 && BANQUE.questions.every(q => e.vues.includes(q.id));
    e.dernieres = [{ score: partie.score, total: partie.total, date }].concat(e.dernieres).slice(0, 10);
    const gagnes = [];
    const gagner = (id) => { if (!e.badges[id]) { e.badges[id] = date; gagnes.push(BADGES.find(b => b.id === id)); } };
    if (partie.score === TAILLE_SERIE) gagner("oeil");
    if (e.parfaites >= 3) gagner("trois_parfaites");
    if (tourFini) { gagner("tour"); e.vues = []; }
    store.set(cle(profil), e);
    return { nouveauRecord, badges: gagnes, etat: e };
  }

  window.QuotidienIntrus = { BANQUE, TAILLE_SERIE, COMPOSITION, BADGES, tirerSerie, lire, enregistrerSerie, aleatoire };
})();
