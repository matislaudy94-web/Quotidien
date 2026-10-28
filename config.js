// Configuration du prototype Quotidien.
// La clé ci-dessous est une clé PUBLIQUE Supabase (prévue pour être dans le navigateur).
// Elle ne donne accès à aucune table : seules les fonctions q_* (joueurs) et a_* (admin, protégées par un code) sont appelables.
window.QUOTIDIEN_CONFIG = {
  supabaseUrl: "https://xxadgyslanxfzzszsbab.supabase.co",
  supabaseKey: "sb_publishable_ANnBVBUMDUfcZrmmfEVtbw_B6Zo-8Jh",
  // Mode entraînement : "tous" (participants et démo), "demo" (démo seulement, le test reste limité à la grille du jour),
  // ou "aucun". Changer cette valeur change le produit testé : le noter dans le journal du README.
  entrainement: "tous",
};
