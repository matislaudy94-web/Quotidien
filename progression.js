// Progression du joueur : XP, niveaux, objectifs, badges, statistiques.
// SEULE SOURCE DE VÉRITÉ : tout est recalculé à partir du « journal » (la liste des parties terminées),
// une entrée par grille (première partie terminée seulement). Rien n'est stocké en double, donc :
// - une grille rejouée ne rapporte rien ; - un rechargement ne crédite rien deux fois ;
// - les objectifs et badges se déduisent des parties, ils ne peuvent pas être « validés » deux fois.
// Stockage : localStorage du navigateur (pas de compte). La progression ne se synchronise pas entre appareils.
(function () {
  "use strict";

  // ---------- Barème d'XP ----------
  const BAREME = {
    resolue: { facile: 50, intermediaire: 75, difficile: 100 }, // grille résolue (4 groupes trouvés)
    terminee: 15,                                               // partie terminée sans résoudre (4 erreurs)
    sansFaute: 25,                                              // bonus : résolue sans aucune erreur
    badge: 10,                                                  // chaque badge débloqué
    indice: 15,                                                 // retiré par indice utilisé (la partie rapporte au moins « terminee »)
  };

  // ---------- Niveaux ----------
  const NIVEAUX = [
    { n: 1, nom: "Débutant", xp: 0, description: "Tu découvres le jeu : 16 mots, 4 groupes, 4 erreurs.", cible: "Les premières grilles du calendrier sont les plus accessibles." },
    { n: 2, nom: "Curieux", xp: 120, description: "Tu as pris le pli. Les expressions à trou ne te font plus peur.", cible: "Une grille résolue sans faute suffit souvent à y arriver." },
    { n: 3, nom: "Explorateur", xp: 350, description: "Tu repères les pièges : un mot qui semble aller dans deux groupes.", cible: "Environ cinq grilles résolues." },
    { n: 4, nom: "Stratège", xp: 700, description: "Tu gardes tes erreurs pour la fin et tu utilises les « presque ».", cible: "Une dizaine de grilles, dont des intermédiaires." },
    { n: 5, nom: "Maître des mots", xp: 1200, description: "Mots cachés, homophones, doubles sens : rien ne t'échappe.", cible: "Les grilles difficiles résolues sans faute font la différence." },
  ];

  // ---------- Objectifs (XP, une seule fois chacun) ----------
  // progression(s) renvoie [actuel, cible]. Terminé dès que actuel >= cible.
  const OBJECTIFS = [
    { id: "premier_defi", titre: "Premier défi", description: "Terminer une grille.", xp: 30, progression: s => [s.terminees, 1] },
    { id: "esprit_logique", titre: "Esprit logique", description: "Résoudre une grille sans aucune erreur.", xp: 50, progression: s => [s.sansFaute, 1] },
    { id: "fin_limier", titre: "Fin limier", description: "Résoudre 3 grilles.", xp: 60, progression: s => [s.resolues, 3] },
    { id: "explorateur", titre: "Explorateur", description: "Terminer 5 grilles différentes.", xp: 80, progression: s => [s.terminees, 5] },
    { id: "trois_sans_faute", titre: "Trois sans-faute", description: "Résoudre 3 grilles sans erreur.", xp: 120, progression: s => [s.sansFaute, 3] },
    { id: "marathon", titre: "Marathon", description: "Terminer 15 grilles.", xp: 150, progression: s => [s.terminees, 15] },
    { id: "grand_chelem", titre: "Grand chelem", description: "Résoudre 25 grilles.", xp: 250, progression: s => [s.resolues, 25] },
  ];

  // ---------- Badges (collection ; chaque badge rapporte BAREME.badge) ----------
  const BADGES = [
    { id: "premiere_grille", nom: "Première grille", description: "Terminer une première partie.", icone: "🎯", condition: s => s.terminees >= 1 },
    { id: "sans_faute", nom: "Sans-faute", description: "Résoudre une grille sans erreur.", icone: "💎", condition: s => s.sansFaute >= 1 },
    { id: "tete_froide", nom: "Tête froide", description: "Résoudre une grille après 3 erreurs.", icone: "🧊", condition: s => s.resoluesAvec3Erreurs >= 1 },
    { id: "eclair", nom: "Éclair", description: "Résoudre une grille en moins de 90 secondes.", icone: "⚡", condition: s => s.resoluesRapides >= 1 },
    { id: "costaud", nom: "Costaud", description: "Résoudre une grille de niveau difficile.", icone: "🧠", condition: s => s.resoluesDifficiles >= 1 },
    { id: "perseverant", nom: "Persévérant", description: "Terminer 10 grilles.", icone: "🔥", condition: s => s.terminees >= 10 },
    { id: "collectionneur", nom: "Collectionneur", description: "Résoudre 20 grilles.", icone: "🏆", condition: s => s.resolues >= 20 },
    { id: "maitre", nom: "Maître des mots", description: "Atteindre le niveau 5.", icone: "👑", condition: (s, niveauSansCeBadge) => niveauSansCeBadge >= 5 },
  ];

  // ---------- Stockage ----------
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const cleJournal = (profil) => "quotidien_journal_" + profil;

  function lireJournal(profil) {
    const j = store.get(cleJournal(profil));
    return Array.isArray(j) ? j : [];
  }

  // ---------- Calculs ----------
  function jourPrecedent(iso) {
    const [a, m, j] = iso.split("-").map(Number);
    return new Date(Date.UTC(a, m - 1, j - 1, 12)).toISOString().slice(0, 10);
  }

  function serie(journal, aujourdhui) {
    // Série = jours consécutifs (heure de Paris) avec au moins une grille terminée. Affichée seulement, jamais récompensée.
    const jours = [...new Set(journal.map(e => e.jour))].sort();
    if (!jours.length) return { actuelle: 0, record: 0 };
    let record = 1, courante = 1;
    for (let i = 1; i < jours.length; i++) {
      courante = jourPrecedent(jours[i]) === jours[i - 1] ? courante + 1 : 1;
      record = Math.max(record, courante);
    }
    const dernier = jours[jours.length - 1];
    const actuelle = (dernier === aujourdhui || dernier === jourPrecedent(aujourdhui)) ? courante : 0;
    return { actuelle, record };
  }

  function calculer(journal, aujourdhui) {
    const resolues = journal.filter(e => e.gagne);
    const s = {
      terminees: journal.length,
      resolues: resolues.length,
      groupes: journal.reduce((a, e) => a + (e.groupes || 0), 0),
      erreurs: journal.reduce((a, e) => a + (e.erreurs || 0), 0),
      sansFaute: resolues.filter(e => e.erreurs === 0 && !(e.indices | 0)).length,
      resoluesAvec3Erreurs: resolues.filter(e => e.erreurs === 3).length,
      resoluesRapides: resolues.filter(e => typeof e.duree_s === "number" && e.duree_s < 90).length,
      resoluesDifficiles: resolues.filter(e => e.niveau === "difficile").length,
      taux: journal.length ? resolues.length / journal.length : null, // résolues / terminées
      meilleure: null,
      serie: serie(journal, aujourdhui),
    };
    if (resolues.length) {
      s.meilleure = resolues.slice().sort((a, b) => (a.erreurs - b.erreurs) || ((a.duree_s ?? 1e9) - (b.duree_s ?? 1e9)))[0];
    }
    // XP des parties
    let xpParties = 0;
    const detailParties = journal.map(e => {
      let xp = e.gagne ? (BAREME.resolue[e.niveau] || BAREME.resolue.intermediaire) : BAREME.terminee;
      if (e.gagne && e.erreurs === 0 && !(e.indices | 0)) xp += BAREME.sansFaute;
      xp = Math.max(BAREME.terminee, xp - BAREME.indice * (e.indices | 0));
      xpParties += xp;
      return { grille: e.grille, xp };
    });
    // Objectifs
    const objectifs = OBJECTIFS.map(o => {
      const [actuel, cible] = o.progression(s);
      const termine = actuel >= cible;
      return { id: o.id, titre: o.titre, description: o.description, xp: o.xp, actuel: Math.min(actuel, cible), cible, termine,
               etat: termine ? "termine" : actuel > 0 ? "en_cours" : "a_commencer" };
    });
    const xpObjectifs = objectifs.filter(o => o.termine).reduce((a, o) => a + o.xp, 0);
    // Badges (le badge « Maître » dépend du niveau calculé sans lui, pour éviter une boucle)
    const badgesSansMaitre = BADGES.filter(b => b.id !== "maitre").map(b => ({ b, obtenu: b.condition(s) }));
    const xpAvantMaitre = xpParties + xpObjectifs + badgesSansMaitre.filter(x => x.obtenu).length * BAREME.badge;
    const niveauSansMaitre = niveauPour(xpAvantMaitre).n;
    const badges = BADGES.map(b => {
      const obtenu = b.id === "maitre" ? b.condition(s, niveauSansMaitre) : b.condition(s);
      return { id: b.id, nom: b.nom, description: b.description, icone: b.icone, obtenu };
    });
    const xpBadges = badges.filter(b => b.obtenu).length * BAREME.badge;
    const xp = xpParties + xpObjectifs + xpBadges;
    const niveau = niveauPour(xp);
    const suivant = NIVEAUX.find(n => n.n === niveau.n + 1) || null;
    return {
      stats: s, xp, xpParties, xpObjectifs, xpBadges, detailParties,
      niveau, suivant,
      xpDansNiveau: xp - niveau.xp,
      xpPourSuivant: suivant ? suivant.xp - niveau.xp : 0,
      objectifs, badges,
      niveaux: NIVEAUX.map(n => ({ ...n, etat: n.n < niveau.n ? "termine" : n.n === niveau.n ? (suivant ? "en_cours" : "termine") : n.n === niveau.n + 1 ? "accessible" : "verrouille" })),
    };
  }

  function niveauPour(xp) {
    let niv = NIVEAUX[0];
    for (const n of NIVEAUX) if (xp >= n.xp) niv = n;
    return niv;
  }

  // ---------- Enregistrer une partie terminée ----------
  // partie = { grille, niveau, jour, gagne, erreurs, groupes, duree_s }
  // Renvoie { deja, avant, apres, gains } ; deja = true si cette grille avait déjà été comptée (aucun changement).
  function enregistrerPartie(profil, partie, aujourdhui) {
    const journal = lireJournal(profil);
    const avant = calculer(journal, aujourdhui);
    if (journal.some(e => e.grille === partie.grille)) return { deja: true, avant, apres: avant, gains: null };
    const entree = { grille: partie.grille, niveau: partie.niveau, jour: partie.jour, gagne: !!partie.gagne,
      erreurs: partie.erreurs | 0, groupes: partie.groupes | 0, duree_s: typeof partie.duree_s === "number" ? partie.duree_s : null, indices: partie.indices | 0, t: Date.now() };
    journal.push(entree);
    store.set(cleJournal(profil), journal);
    const apres = calculer(journal, aujourdhui);
    const xpPartie = apres.detailParties.find(d => d.grille === partie.grille).xp;
    const gains = {
      xp: apres.xp - avant.xp,
      xpPartie,
      sansFaute: entree.gagne && entree.erreurs === 0 && !entree.indices,
      objectifs: apres.objectifs.filter(o => o.termine && !avant.objectifs.find(a => a.id === o.id).termine),
      badges: apres.badges.filter(b => b.obtenu && !avant.badges.find(a => a.id === b.id).obtenu),
      niveauAvant: avant.niveau, niveauApres: apres.niveau,
      montee: apres.niveau.n > avant.niveau.n,
    };
    return { deja: false, avant, apres, gains };
  }

  function reinitialiser(profil) { store.del(cleJournal(profil)); }

  window.QuotidienProgression = { BAREME, NIVEAUX, OBJECTIFS, BADGES, lireJournal, calculer, enregistrerPartie, reinitialiser };
})();
