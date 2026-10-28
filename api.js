// Petit client pour les fonctions de la base (aucune dépendance).
// Chaque appel est une requête POST vers /rest/v1/rpc/<fonction>.
(function () {
  const cfg = window.QUOTIDIEN_CONFIG;

  const DELAI_CLIENT_MS = 20000; // au-delà, la requête est abandonnée côté navigateur et l'appel échoue

  async function rpc(nom, params) {
    const ctrl = new AbortController();
    const minuterie = setTimeout(() => ctrl.abort(), DELAI_CLIENT_MS);
    let res;
    try {
      res = await fetch(cfg.supabaseUrl + "/rest/v1/rpc/" + nom, {
      signal: ctrl.signal,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.supabaseKey,
        Authorization: "Bearer " + cfg.supabaseKey,
      },
      body: JSON.stringify(params || {}),
      });
    } finally { clearTimeout(minuterie); }
    const texte = await res.text();
    let corps = null;
    try { corps = texte ? JSON.parse(texte) : null; } catch (e) { corps = texte; }
    if (!res.ok) {
      const msg = (corps && corps.message) || ("Erreur " + res.status);
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return corps;
  }

  window.QuotidienAPI = { rpc };
})();
