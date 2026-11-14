-- =====================================================================================================
-- Quotidien — grille servie par le serveur (interrupteur « grilleServeur » de config.js)
--
--   *** NON EXÉCUTÉ ***  Ce fichier n'a été lancé sur aucune base, pas même une base locale :
--   il a été écrit à la main en miroir de tests/serveur_test.js (qui, lui, est testé).
--   À relire, puis à appliquer d'abord sur une branche ou une copie de la base.
--
-- CE QU'IL CRÉE
--   Tables (RLS activée, aucune politique, aucun droit pour anon / authenticated) :
--     public.grilles_serveur   les grilles dont la solution ne doit jamais partir dans le navigateur
--     public.parties           une partie par participant et par grille (source de vérité du jeu)
--   Fonctions appelables avec la clé publique (rôle anon) :
--     public.q_grille(p_id, p_grille)            grille du jour : 16 mots mélangés + état de la partie
--     public.q_essai(p_id, p_mots, p_grille)     juge un essai de 4 mots
--     public.q_indice(p_id, p_grille)            donne un indice (2 mots d'un même groupe)
--     public.a_grilles_serveur(code)             admin : liste des grilles (id, niveau, groupes)
--     public.a_charger_grilles(code, p_grilles)  admin : ajoute ou met à jour des grilles
--   Fonctions internes (aucun droit d'exécution pour public / anon / authenticated) :
--     public._gs_id_en_jeu, public._gs_publics, public._gs_ordre, public._gs_refus
--
-- CE QU'IL NE TOUCHE PAS
--   Aucune table ni fonction existante n'est modifiée : participants, sessions, evenements, admin_secret,
--   q_identifier, q_rejoindre, q_visite, q_evenement, g_*, d_*, a_* existantes restent telles quelles.
--   Il LIT seulement public.participants (id, session_id, grille_forcee) et public.sessions (id, calendrier),
--   et APPELLE public._verifier_admin(code).
--   Tant que config.js garde grilleServeur: false, le jeu n'appelle aucune de ces fonctions.
--
-- REVENIR EN ARRIÈRE (remettre d'abord grilleServeur à false dans config.js et publier) :
--   drop function if exists public.q_grille(text, text);
--   drop function if exists public.q_essai(text, text[], text);
--   drop function if exists public.q_indice(text, text);
--   drop function if exists public.a_grilles_serveur(text);
--   drop function if exists public.a_charger_grilles(text, jsonb);
--   drop function if exists public._gs_id_en_jeu(text, text, text, text);
--   drop function if exists public._gs_publics(jsonb);
--   drop function if exists public._gs_ordre(text, text, jsonb);
--   drop function if exists public._gs_refus(jsonb);
--   drop table if exists public.parties;          -- efface les parties jouées en mode serveur
--   drop table if exists public.grilles_serveur;  -- efface les grilles chargées (elles restent dans le dépôt privé)
--
-- ÉCART VOLONTAIRE PAR RAPPORT AU CONTRAT INITIAL
--   q_grille, q_essai et q_indice acceptent un paramètre facultatif p_grille (null par défaut : les appels
--   q_grille(p_id), q_essai(p_id, p_mots) et q_indice(p_id) du contrat fonctionnent tels quels). Il sert à
--   finir une partie commencée avant minuit : si le participant a une partie NON TERMINÉE sur la grille
--   nommée, c'est elle qui est en jeu ; sinon c'est la grille du jour. Il ne permet donc d'atteindre que
--   une grille que ce participant a déjà commencée quand elle était sa grille du jour.
--
-- À VÉRIFIER SUR LA VRAIE BASE AVANT D'APPLIQUER (voir aussi le README)
--   1. public._verifier_admin(text) existe, lève une exception si le code est faux, et peut être appelée
--      par le propriétaire de ces fonctions.
--   2. participants.id est bien stocké en majuscules (on compare à upper(p_id)) ; grille_forcee vaut null
--      ou '' quand rien n'est forcé ; sessions.calendrier a bien la forme {"AAAA-MM-JJ": "id"}.
--   3. q_identifier applique la même règle (grille forcée, sinon calendrier du jour à Paris) et ne tient
--      pas compte d'autre chose (session inactive, par exemple) pour choisir la grille.
--   4. Le rôle des appels du site est bien anon (clé « publishable »).
--   5. Aucune table public.parties ni public.grilles_serveur n'existe déjà avec une autre forme
--      (« create table if not exists » ne la corrigerait pas).
-- =====================================================================================================

begin;

-- ---------- Tables ----------

-- Les grilles servies par le serveur. « groupes » a la forme de grilles.json :
-- [{categorie, difficulte, mots: [4 mots], explication}] (4 groupes, dans l'ordre du fichier).
create table if not exists public.grilles_serveur (
  id      text primary key,
  niveau  text not null,
  groupes jsonb not null
);
alter table public.grilles_serveur enable row level security;
revoke all on table public.grilles_serveur from public, anon, authenticated;

-- Une partie par participant et par grille.
--   trouves : index (0 à 3) des groupes trouvés, dans l'ordre où ils l'ont été
--   essais  : [{mots: [4 mots triés], juste, presque}], dans l'ordre
--   indices : [{groupe: index, mots: [2 mots]}]
-- Pas de clé étrangère vers participants : ce fichier ne dépend d'aucune contrainte existante.
create table if not exists public.parties (
  participant_id text        not null,
  grille_id      text        not null,
  trouves        int[]       not null default '{}',
  essais         jsonb       not null default '[]'::jsonb,
  erreurs        int         not null default 0,
  indices        jsonb       not null default '[]'::jsonb,
  terminee       boolean     not null default false,
  gagnee         boolean     not null default false,
  debut          timestamptz not null default now(),
  fin            timestamptz,
  primary key (participant_id, grille_id)
);
alter table public.parties enable row level security;
revoke all on table public.parties from public, anon, authenticated;

-- ---------- Fonctions internes ----------

-- Grille en jeu pour un participant : sa grille forcée, sinon celle du calendrier de sa session à la date
-- du jour (heure de Paris), exactement comme le navigateur le fait avec la réponse de q_identifier.
-- Exception : si le navigateur nomme une autre grille (p_demandee) sur laquelle ce participant a une partie
-- non terminée, c'est celle-là (partie commencée avant minuit).
create or replace function public._gs_id_en_jeu(p_participant text, p_session text, p_forcee text, p_demandee text)
returns text
language plpgsql stable
set search_path = ''
as $$
declare
  v_id   text;
  v_jour text;
begin
  v_id := nullif(p_forcee, '');
  if v_id is null then
    v_jour := to_char((now() at time zone 'Europe/Paris')::date, 'YYYY-MM-DD');
    select s.calendrier ->> v_jour into v_id from public.sessions s where s.id = p_session;
  end if;
  if p_demandee is not null and p_demandee is distinct from v_id
     and exists (select 1 from public.parties pa
                  where pa.participant_id = p_participant and pa.grille_id = p_demandee and not pa.terminee) then
    return p_demandee;
  end if;
  return v_id;
end
$$;

-- Les 4 groupes tels qu'on peut les montrer, dans l'ordre de la grille : index (0 à 3) et couleur.
-- Couleur = rang du groupe par difficulté puis par index, même règle que couleurDe() dans index.html.
create or replace function public._gs_publics(p_groupes jsonb)
returns jsonb
language sql immutable
set search_path = ''
as $$
  select coalesce(jsonb_agg(x.g order by x.idx), '[]'::jsonb)
  from (
    select (e.ord - 1)::int as idx,
           jsonb_build_object(
             'index', (e.ord - 1)::int,
             'couleur', (row_number() over (order by case e.grp ->> 'difficulte'
                                                       when 'facile' then 0 when 'intermediaire' then 1
                                                       when 'difficile' then 2 else 3 end, e.ord) - 1)::int,
             'categorie', e.grp -> 'categorie',
             'difficulte', e.grp -> 'difficulte',
             'mots', e.grp -> 'mots',
             'explication', e.grp -> 'explication') as g
    from jsonb_array_elements(p_groupes) with ordinality as e(grp, ord)
  ) x
$$;

-- Les 16 mots dans un ordre mélangé, stable pour un participant et une grille (tri sur une empreinte md5),
-- et jamais l'ordre des groupes (si le hasard y menait, le premier mot passe à la fin).
create or replace function public._gs_ordre(p_participant text, p_grille text, p_groupes jsonb)
returns jsonb
language plpgsql immutable
set search_path = ''
as $$
declare
  v_naturel jsonb;
  v_ordre   jsonb;
begin
  select jsonb_agg(m.mot order by g.ord, m.ord),
         jsonb_agg(m.mot order by md5(p_participant || ':' || p_grille || ':' || m.mot) collate "C")
    into v_naturel, v_ordre
    from jsonb_array_elements(p_groupes) with ordinality as g(grp, ord)
   cross join lateral jsonb_array_elements_text(g.grp -> 'mots') with ordinality as m(mot, ord);
  if v_ordre = v_naturel then
    v_ordre := (v_ordre - 0) || jsonb_build_array(v_ordre -> 0);
  end if;
  return v_ordre;
end
$$;

-- Contrôle d'une grille à charger. Renvoie la raison du refus, ou null si elle est bien formée :
-- identifiant simple, niveau connu, 4 groupes de 4 mots, 16 mots tous différents.
create or replace function public._gs_refus(p jsonb)
returns text
language plpgsql immutable
set search_path = ''
as $$
declare
  v_grp jsonb;
  v_n   int;
begin
  if p is null or jsonb_typeof(p) is distinct from 'object' then return 'format'; end if;
  if jsonb_typeof(p -> 'id') is distinct from 'string' then return 'id'; end if;
  if (p ->> 'id') !~ '^[A-Za-z0-9_-]{1,10}$' then return 'id'; end if;
  if jsonb_typeof(p -> 'niveau') is distinct from 'string' then return 'niveau'; end if;
  if (p ->> 'niveau') not in ('facile', 'intermediaire', 'difficile') then return 'niveau'; end if;
  if jsonb_typeof(p -> 'groupes') is distinct from 'array' then return 'groupes'; end if;
  if jsonb_array_length(p -> 'groupes') <> 4 then return 'groupes'; end if;
  for v_grp in select e.x from jsonb_array_elements(p -> 'groupes') as e(x) loop
    if jsonb_typeof(v_grp) is distinct from 'object' then return 'groupe'; end if;
    if jsonb_typeof(v_grp -> 'categorie') is distinct from 'string' then return 'groupe'; end if;
    if btrim(v_grp ->> 'categorie') = '' then return 'groupe'; end if;
    if jsonb_typeof(v_grp -> 'difficulte') is distinct from 'string' then return 'groupe'; end if;
    if (v_grp ->> 'difficulte') not in ('facile', 'intermediaire', 'difficile') then return 'groupe'; end if;
    if jsonb_typeof(v_grp -> 'mots') is distinct from 'array' then return 'mots'; end if;
    if jsonb_array_length(v_grp -> 'mots') <> 4 then return 'mots'; end if;
    if exists (select 1 from jsonb_array_elements(v_grp -> 'mots') as m(x)
                where jsonb_typeof(m.x) is distinct from 'string' or btrim(coalesce(m.x #>> '{}', '')) = '') then
      return 'mots';
    end if;
  end loop;
  select count(distinct m.mot) into v_n
    from jsonb_array_elements(p -> 'groupes') as g(grp)
   cross join lateral jsonb_array_elements_text(g.grp -> 'mots') as m(mot);
  if v_n <> 16 then return 'mots_distincts'; end if;
  return null;
end
$$;

-- ---------- q_grille : la grille du jour, sans sa solution ----------
-- Réponses :
--   participant inconnu                 {ok:false}
--   grille du jour hors grilles_serveur {ok:true, serveur:false, id}      (le navigateur joue sa grille locale)
--   grille servie                       {ok:true, serveur:true, id, mots:[16], partie:{trouves, erreurs, essais,
--                                        terminee, gagnee, indices}}
--     + niveau          seulement si la partie est terminée
--     + solution        seulement si la partie est terminée ET gagnée
-- Avant la fin, rien d'autre que les groupes déjà trouvés ne sort : ni catégorie, ni explication, ni niveau.
create or replace function public.q_grille(p_id text, p_grille text default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pid     text;
  v_session text;
  v_forcee  text;
  v_gid     text;
  v_niveau  text;
  v_groupes jsonb;
  v_pub     jsonb;
  v_pa      public.parties%rowtype;
  v_rep     jsonb;
begin
  select p.id, p.session_id, p.grille_forcee into v_pid, v_session, v_forcee
    from public.participants p where p.id = upper(p_id);
  if v_pid is null then return jsonb_build_object('ok', false); end if;

  v_gid := public._gs_id_en_jeu(v_pid, v_session, v_forcee, p_grille);
  select g.niveau, g.groupes into v_niveau, v_groupes from public.grilles_serveur g where g.id = v_gid;
  if v_groupes is null then
    return jsonb_build_object('ok', true, 'serveur', false, 'id', v_gid);
  end if;

  -- Pas de partie : v_pa reste vide (tous ses champs sont null), d'où les coalesce ci-dessous.
  select * into v_pa from public.parties pa where pa.participant_id = v_pid and pa.grille_id = v_gid;
  v_pub := public._gs_publics(v_groupes);

  v_rep := jsonb_build_object(
    'ok', true, 'serveur', true, 'id', v_gid,
    'mots', public._gs_ordre(v_pid, v_gid, v_groupes),
    'partie', jsonb_build_object(
      'trouves', (select coalesce(jsonb_agg((v_pub -> t.idx) order by t.pos), '[]'::jsonb)
                    from unnest(coalesce(v_pa.trouves, '{}'::int[])) with ordinality as t(idx, pos)),
      'erreurs', coalesce(v_pa.erreurs, 0),
      'essais', coalesce(v_pa.essais, '[]'::jsonb),
      'terminee', coalesce(v_pa.terminee, false),
      'gagnee', coalesce(v_pa.gagnee, false),
      -- les indices sont rendus sans l'index de leur groupe
      'indices', (select coalesce(jsonb_agg(jsonb_build_object('mots', i.x -> 'mots') order by i.pos), '[]'::jsonb)
                    from jsonb_array_elements(coalesce(v_pa.indices, '[]'::jsonb)) with ordinality as i(x, pos))));

  if coalesce(v_pa.terminee, false) then
    v_rep := v_rep || jsonb_build_object('niveau', v_niveau);
    if coalesce(v_pa.gagnee, false) then
      v_rep := v_rep || jsonb_build_object('solution', v_pub);
    end if;
  end if;
  return v_rep;
end
$$;

-- ---------- q_essai : juge un essai de 4 mots ----------
-- Réponses :
--   {ok:false, raison}   inconnu | grille (pas de grille servie) | mots (pas 4 mots distincts de la grille, ou
--                        un mot d'un groupe déjà trouvé) | terminee | limite (60 essais enregistrés)
--   {ok:true, deja:true} essai déjà tenté (même ensemble de mots) : ne coûte rien
--   {ok:true, juste, presque, erreurs, terminee, gagnee}
--     + groupe {index, couleur, categorie, difficulte, mots, explication}  si l'essai est juste
--     + niveau                                                              si la partie est terminée
--     + solution [4 groupes]                                                si elle est gagnée
-- Après 4 erreurs : terminee = true, gagnee = false, et la solution n'est PAS renvoyée.
create or replace function public.q_essai(p_id text, p_mots text[], p_grille text default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pid     text;
  v_session text;
  v_forcee  text;
  v_gid     text;
  v_niveau  text;
  v_groupes jsonb;
  v_pub     jsonb;
  v_pa      public.parties%rowtype;
  v_tri     jsonb;
  v_somme   int;
  v_max     int;
  v_gi      int;
  v_juste   boolean;
  v_presque boolean;
  v_rep     jsonb;
begin
  select p.id, p.session_id, p.grille_forcee into v_pid, v_session, v_forcee
    from public.participants p where p.id = upper(p_id);
  if v_pid is null then return jsonb_build_object('ok', false, 'raison', 'inconnu'); end if;

  v_gid := public._gs_id_en_jeu(v_pid, v_session, v_forcee, p_grille);
  select g.niveau, g.groupes into v_niveau, v_groupes from public.grilles_serveur g where g.id = v_gid;
  if v_groupes is null then return jsonb_build_object('ok', false, 'raison', 'grille'); end if;

  -- 4 mots, tous différents, tous dans la grille
  if p_mots is null or array_ndims(p_mots) is distinct from 1 or cardinality(p_mots) <> 4 then
    return jsonb_build_object('ok', false, 'raison', 'mots');
  end if;
  if (select count(distinct u.m) from unnest(p_mots) as u(m) where u.m is not null) <> 4
     or (select count(*)
           from jsonb_array_elements(v_groupes) as g(grp)
          cross join lateral jsonb_array_elements_text(g.grp -> 'mots') as w(mot)
          where w.mot = any(p_mots)) <> 4 then
    return jsonb_build_object('ok', false, 'raison', 'mots');
  end if;

  -- La partie est créée au premier essai, puis sa ligne est verrouillée : deux requêtes simultanées
  -- du même participant passent l'une après l'autre.
  insert into public.parties (participant_id, grille_id) values (v_pid, v_gid)
    on conflict (participant_id, grille_id) do nothing;
  select * into v_pa from public.parties pa
   where pa.participant_id = v_pid and pa.grille_id = v_gid for update;

  if v_pa.terminee then return jsonb_build_object('ok', false, 'raison', 'terminee'); end if;

  -- Essai déjà tenté (même ensemble de mots) : il ne coûte rien.
  v_tri := to_jsonb(array(select u.m from unnest(p_mots) as u(m) order by u.m collate "C"));
  if exists (select 1 from jsonb_array_elements(v_pa.essais) as e(x) where (e.x -> 'mots') = v_tri) then
    return jsonb_build_object('ok', true, 'deja', true);
  end if;

  -- Garde-fou de volume (une partie normale compte au plus 7 essais).
  if jsonb_array_length(v_pa.essais) >= 60 then return jsonb_build_object('ok', false, 'raison', 'limite'); end if;

  -- Pour chaque groupe NON trouvé : combien des 4 mots lui appartiennent.
  select coalesce(sum(c.n), 0)::int, coalesce(max(c.n), 0)::int, min(c.idx) filter (where c.n = 4)
    into v_somme, v_max, v_gi
    from (
      select (g.ord - 1)::int as idx,
             (select count(*) from jsonb_array_elements_text(g.grp -> 'mots') as w(mot) where w.mot = any(p_mots))::int as n
        from jsonb_array_elements(v_groupes) with ordinality as g(grp, ord)
       where not ((g.ord - 1)::int = any(v_pa.trouves))
    ) c;
  -- Un des mots appartient à un groupe déjà trouvé.
  if v_somme <> 4 then return jsonb_build_object('ok', false, 'raison', 'mots'); end if;

  v_juste := (v_max = 4);
  v_presque := (v_max = 3);
  v_pa.essais := v_pa.essais || jsonb_build_array(jsonb_build_object('mots', v_tri, 'juste', v_juste, 'presque', v_presque));
  if v_juste then
    v_pa.trouves := v_pa.trouves || v_gi;
    if cardinality(v_pa.trouves) >= 4 then v_pa.terminee := true; v_pa.gagnee := true; end if;
  else
    v_pa.erreurs := v_pa.erreurs + 1;
    if v_pa.erreurs >= 4 then v_pa.terminee := true; v_pa.gagnee := false; end if;
  end if;
  if v_pa.terminee then v_pa.fin := now(); end if;

  update public.parties pa
     set trouves = v_pa.trouves, essais = v_pa.essais, erreurs = v_pa.erreurs,
         terminee = v_pa.terminee, gagnee = v_pa.gagnee, fin = v_pa.fin
   where pa.participant_id = v_pid and pa.grille_id = v_gid;

  v_pub := public._gs_publics(v_groupes);
  v_rep := jsonb_build_object('ok', true, 'juste', v_juste, 'presque', v_presque,
                              'erreurs', v_pa.erreurs, 'terminee', v_pa.terminee, 'gagnee', v_pa.gagnee);
  if v_juste then
    v_rep := v_rep || jsonb_build_object('groupe', v_pub -> v_gi);
  end if;
  if v_pa.terminee then
    v_rep := v_rep || jsonb_build_object('niveau', v_niveau);
    -- La solution ne part qu'après une réussite ; jamais après un échec.
    if v_pa.gagnee then
      v_rep := v_rep || jsonb_build_object('solution', v_pub);
    end if;
  end if;
  return v_rep;
end
$$;

-- ---------- q_indice : deux mots d'un même groupe non trouvé ----------
-- Même règle que le jeu local : 1 indice par grille, un second après 2 erreurs ; le groupe est « le plus
-- facile restant » (difficulté, puis ordre dans la grille) parmi ceux qui n'ont pas déjà eu d'indice.
-- Réponses : {ok:true, mots:[2]} ou {ok:false}.
create or replace function public.q_indice(p_id text, p_grille text default null)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_pid     text;
  v_session text;
  v_forcee  text;
  v_gid     text;
  v_groupes jsonb;
  v_pa      public.parties%rowtype;
  v_gi      int;
  v_grp     jsonb;
  v_mots    jsonb;
begin
  select p.id, p.session_id, p.grille_forcee into v_pid, v_session, v_forcee
    from public.participants p where p.id = upper(p_id);
  if v_pid is null then return jsonb_build_object('ok', false); end if;

  v_gid := public._gs_id_en_jeu(v_pid, v_session, v_forcee, p_grille);
  select g.groupes into v_groupes from public.grilles_serveur g where g.id = v_gid;
  if v_groupes is null then return jsonb_build_object('ok', false); end if;

  insert into public.parties (participant_id, grille_id) values (v_pid, v_gid)
    on conflict (participant_id, grille_id) do nothing;
  select * into v_pa from public.parties pa
   where pa.participant_id = v_pid and pa.grille_id = v_gid for update;

  if v_pa.terminee then return jsonb_build_object('ok', false); end if;
  if least(2, 1 + case when v_pa.erreurs >= 2 then 1 else 0 end) - jsonb_array_length(v_pa.indices) <= 0 then
    return jsonb_build_object('ok', false);
  end if;

  select c.idx, c.grp into v_gi, v_grp
    from (select (g.ord - 1)::int as idx, g.grp
            from jsonb_array_elements(v_groupes) with ordinality as g(grp, ord)) c
   where not (c.idx = any(v_pa.trouves))
     and not exists (select 1 from jsonb_array_elements(v_pa.indices) as i(x) where (i.x ->> 'groupe')::int = c.idx)
   order by case c.grp ->> 'difficulte' when 'facile' then 0 when 'intermediaire' then 1
                                        when 'difficile' then 2 else 3 end, c.idx
   limit 1;
  if v_gi is null then return jsonb_build_object('ok', false); end if;

  -- Deux des quatre mots, toujours les mêmes pour ce participant et cette grille.
  select jsonb_agg(s.mot order by s.k collate "C") into v_mots
    from (select w.mot, md5(v_pid || ':' || v_gid || ':indice:' || w.mot) as k
            from jsonb_array_elements_text(v_grp -> 'mots') as w(mot)
           order by md5(v_pid || ':' || v_gid || ':indice:' || w.mot) collate "C"
           limit 2) s;

  update public.parties pa
     set indices = v_pa.indices || jsonb_build_array(jsonb_build_object('groupe', v_gi, 'mots', v_mots))
   where pa.participant_id = v_pid and pa.grille_id = v_gid;

  return jsonb_build_object('ok', true, 'mots', v_mots);
end
$$;

-- ---------- Administration ----------

-- Liste des grilles servies (id, niveau, groupes), pour que le tableau de bord affiche leurs catégories.
create or replace function public.a_grilles_serveur(code text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
begin
  perform public._verifier_admin(code);
  return (select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'niveau', g.niveau, 'groupes', g.groupes)
                                    order by g.id collate "C"), '[]'::jsonb)
            from public.grilles_serveur g);
end
$$;

-- Ajoute ou met à jour des grilles à partir d'un tableau au format des lots
-- ([{id, niveau, groupes: [{categorie, difficulte, mots, explication}], …}] ; les autres champs sont ignorés).
-- Une grille mal formée est refusée (les autres sont chargées).
-- Réponse : {ok:true, recues, creees:[id], mises_a_jour:[id], refusees:[{id, raison}]} ou {ok:false, raison:'format'}.
create or replace function public.a_charger_grilles(code text, p_grilles jsonb)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  v_g        jsonb;
  v_id       text;
  v_raison   text;
  v_propre   jsonb;
  v_existe   boolean;
  v_creees   jsonb := '[]'::jsonb;
  v_maj      jsonb := '[]'::jsonb;
  v_refusees jsonb := '[]'::jsonb;
begin
  perform public._verifier_admin(code);
  if p_grilles is null or jsonb_typeof(p_grilles) is distinct from 'array' then
    return jsonb_build_object('ok', false, 'raison', 'format');
  end if;

  for v_g in select e.x from jsonb_array_elements(p_grilles) as e(x) loop
    v_raison := public._gs_refus(v_g);
    if v_raison is not null then
      v_id := null;
      if jsonb_typeof(v_g) = 'object' then
        if jsonb_typeof(v_g -> 'id') = 'string' then v_id := v_g ->> 'id'; end if;
      end if;
      v_refusees := v_refusees || jsonb_build_array(jsonb_build_object('id', v_id, 'raison', v_raison));
      continue;
    end if;

    v_id := v_g ->> 'id';
    -- On ne garde que les champs utiles au jeu (ni intention, ni rattachements, ni notes).
    select jsonb_agg(jsonb_build_object(
             'categorie', g.grp -> 'categorie',
             'difficulte', g.grp -> 'difficulte',
             'mots', g.grp -> 'mots',
             'explication', case when jsonb_typeof(g.grp -> 'explication') = 'string'
                                 then g.grp -> 'explication' else to_jsonb(''::text) end) order by g.ord)
      into v_propre
      from jsonb_array_elements(v_g -> 'groupes') with ordinality as g(grp, ord);

    select exists (select 1 from public.grilles_serveur gs where gs.id = v_id) into v_existe;
    insert into public.grilles_serveur (id, niveau, groupes) values (v_id, v_g ->> 'niveau', v_propre)
      on conflict (id) do update set niveau = excluded.niveau, groupes = excluded.groupes;
    if v_existe then
      v_maj := v_maj || jsonb_build_array(v_id);
    else
      v_creees := v_creees || jsonb_build_array(v_id);
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'recues', jsonb_array_length(p_grilles),
                            'creees', v_creees, 'mises_a_jour', v_maj, 'refusees', v_refusees);
end
$$;

-- ---------- Droits ----------
-- Supabase accorde par défaut l'exécution des nouvelles fonctions de « public » à anon et authenticated :
-- on retire tout, puis on n'accorde que ce qui doit être appelable avec la clé publique.
revoke all on function public._gs_id_en_jeu(text, text, text, text) from public, anon, authenticated;
revoke all on function public._gs_publics(jsonb)                    from public, anon, authenticated;
revoke all on function public._gs_ordre(text, text, jsonb)          from public, anon, authenticated;
revoke all on function public._gs_refus(jsonb)                      from public, anon, authenticated;

revoke all on function public.q_grille(text, text)          from public, anon, authenticated;
revoke all on function public.q_essai(text, text[], text)   from public, anon, authenticated;
revoke all on function public.q_indice(text, text)          from public, anon, authenticated;
revoke all on function public.a_grilles_serveur(text)       from public, anon, authenticated;
revoke all on function public.a_charger_grilles(text, jsonb) from public, anon, authenticated;

grant execute on function public.q_grille(text, text)          to anon;
grant execute on function public.q_essai(text, text[], text)   to anon;
grant execute on function public.q_indice(text, text)          to anon;
grant execute on function public.a_grilles_serveur(text)       to anon;
grant execute on function public.a_charger_grilles(text, jsonb) to anon;

commit;

-- L'API (PostgREST) doit relire le schéma pour voir les nouvelles fonctions.
notify pgrst, 'reload schema';
