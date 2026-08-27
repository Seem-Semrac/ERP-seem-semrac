-- ==========================================================================
-- ERP Seem Semrac - SCHEMA COMPLET reproductible (public), STRUCTURE SEULE.
-- Genere par pg_dump --schema-only de la base Docker locale (77 tables :
-- colonnes/types/contraintes/index + RLS permissive + grants anon).
-- AUCUNE donnee metier (sur a committer).
--
-- APPLICATION : auto-execute a la 1re initialisation de la base Docker (cuit
-- dans db.Dockerfile -> /docker-entrypoint-initdb.d/migrations/) : donc
-- 'docker compose up -d --build' sur une VM neuve cree tout le schema, SANS cloud.
-- REGENERER apres un changement de schema :
--   docker exec erp-db pg_dump -U postgres -d postgres --schema-only --no-owner -n public > docker/db/seed/schema.sql
--   puis retirer les meta-commandes psql restrict/unrestrict et rendre le CREATE SCHEMA idempotent (IF NOT EXISTS).
-- Clone EXACT avec donnees : voir db/seed/README.md (pg_dump du cloud -> restore).
-- ==========================================================================
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: promote_import_batch(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.promote_import_batch(p_batch text) RETURNS TABLE(id bigint, result text)
    LANGUAGE plpgsql
    AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT s.id FROM public.import_staging s
            WHERE s.batch_id = p_batch AND s.status = 'validated' ORDER BY s.id LOOP
    id := r.id; result := public.promote_import_row(r.id); RETURN NEXT;
  END LOOP;
END $$;


--
-- Name: promote_import_row(bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.promote_import_row(p_id bigint) RETURNS text
    LANGUAGE plpgsql
    AS $_$
DECLARE
  r     public.import_staging%ROWTYPE;
  v_cols text;
  v_sql  text;
BEGIN
  SELECT * INTO r FROM public.import_staging WHERE id = p_id;
  IF r.id IS NULL THEN RETURN 'not_found'; END IF;
  IF r.status <> 'validated' THEN RETURN 'skip: statut=' || r.status; END IF;

  -- Colonnes = clés du mapping ∩ colonnes réelles de la table cible.
  SELECT string_agg(quote_ident(c.column_name), ', ')
    INTO v_cols
    FROM information_schema.columns c
   WHERE c.table_schema = 'public'
     AND c.table_name = r.target_table
     AND r.mapped ? c.column_name;

  IF v_cols IS NULL THEN
    UPDATE public.import_staging SET status='error', error='aucune colonne du mapping ne correspond à '||r.target_table WHERE id=p_id;
    RETURN 'error: aucune colonne valide';
  END IF;

  v_sql := format(
    'INSERT INTO public.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::public.%I, $1)',
    r.target_table, v_cols, v_cols, r.target_table);

  BEGIN
    EXECUTE v_sql USING r.mapped;
    UPDATE public.import_staging SET status='inserted', inserted_at=now(), error=NULL WHERE id=p_id;
    RETURN 'inserted';
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.import_staging SET status='error', error=SQLERRM WHERE id=p_id;
    RETURN 'error: ' || SQLERRM;
  END;
END $_$;


--
-- Name: validate_import_batch(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_import_batch(p_batch text, p_by text DEFAULT 'manuel'::text) RETURNS bigint
    LANGUAGE sql
    AS $$
  WITH upd AS (
    UPDATE public.import_staging
       SET status='validated', validated_by=p_by, validated_at=now()
     WHERE batch_id=p_batch AND status='pending'
     RETURNING 1)
  SELECT count(*) FROM upd;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: absences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.absences (
    id text NOT NULL,
    operateur_id text,
    type text,
    date_absence text,
    created_at text
);


--
-- Name: actions_correctives; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actions_correctives (
    id text NOT NULL,
    numero numeric,
    type text,
    origine text,
    source text,
    description text,
    analyse_5p jsonb,
    cause_racine text,
    action text,
    responsable text,
    diffusion text,
    date_ouverture text,
    date_echeance text,
    date_cloture text,
    efficacite text,
    statut text,
    created_at text,
    updated_at text,
    source_type text,
    source_ref text
);


--
-- Name: audit_grille; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_grille (
    id text NOT NULL,
    titre text NOT NULL,
    cible text DEFAULT 'poste'::text NOT NULL,
    referentiel text,
    version integer DEFAULT 1 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_programme; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_programme (
    id text NOT NULL,
    exercice integer,
    type text DEFAULT 'process'::text NOT NULL,
    entite_auditee text,
    famille text,
    perimetre text,
    themes text,
    themes_transverses text,
    referentiels text,
    trimestre integer,
    date_cible date,
    temps_estime_min integer,
    auditeur text,
    auditeur_2 text,
    audite_principal text,
    statut text DEFAULT 'a_planifier'::text NOT NULL,
    date_realisation date,
    date_rapport date,
    date_retour_audite date,
    plan_action_solde boolean DEFAULT false NOT NULL,
    date_cloture date,
    grille_id text,
    rapport_url text,
    reponses jsonb,
    constat text,
    non_conformite text,
    axe_amelioration text,
    observations text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_question; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_question (
    id text NOT NULL,
    grille_id text NOT NULL,
    ordre integer DEFAULT 0 NOT NULL,
    section text,
    theme_code text,
    clause_ref text,
    libelle text NOT NULL,
    preuve_attendue text,
    mode text DEFAULT 'manuel'::text NOT NULL,
    sonde text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bons_de_commande; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bons_de_commande (
    id text NOT NULL,
    affaire_id text,
    demande_achat_id text,
    type_bc text,
    fournisseur_id text,
    sous_traitant_id text,
    lignes jsonb,
    montant_ht numeric,
    devise text,
    date_bc text,
    date_livraison text,
    conditions_paiement text,
    statut text,
    notes text,
    created_at text,
    updated_at text,
    num_bc text,
    fournisseur_nom text,
    articles text,
    bl_id text,
    pv_id text,
    transporteur text,
    transporteur_ref text,
    categorie text,
    machine_id text,
    poste_id text,
    opex_greffe boolean,
    num_affaire text,
    cmd_ref text,
    qte_commandee text,
    qte_recue numeric,
    accuse_fournisseur_le timestamp with time zone,
    date_relance timestamp with time zone
);


--
-- Name: bons_de_livraison; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bons_de_livraison (
    id text NOT NULL,
    cmd_id text,
    client_nom text,
    date_bl text,
    qte numeric,
    statut text,
    transport text,
    otd text,
    created_at text,
    updated_at text,
    affaire_id text,
    type_bl text,
    fournisseur_st_id text,
    date_envoi_prevu text,
    lot_id text,
    piece text,
    operation text,
    bc_id text,
    transporteur_ref text,
    lignes text,
    prix_transport text,
    facture_id text,
    partiel boolean
);


--
-- Name: bons_de_travail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bons_de_travail (
    id text NOT NULL,
    num_affaire text,
    cmd_id text,
    cmd_ref text,
    lot_id text,
    lot_ref text,
    piece text,
    operation text,
    machine_id text,
    operateur_id text,
    operateur_nom text,
    activite text,
    statut text,
    duree numeric,
    temps_reel numeric,
    matiere_ok boolean,
    seq integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    date_prevue date,
    temps_machine_alloue numeric
);


--
-- Name: certifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certifications (
    id text NOT NULL,
    created_at text,
    salarie_id text,
    employe_nom text,
    type text,
    intitule text,
    organisme text,
    date_obtention text,
    date_expiration text,
    statut text,
    critique boolean,
    notes text,
    updated_at text
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id text NOT NULL,
    nom text,
    contact text,
    poste text,
    email text,
    tel text,
    adresse text,
    credits numeric,
    credit_montant numeric,
    mode_facturation text,
    siret text,
    created_at text,
    user_id text,
    source text,
    notes_internes text,
    first_name text,
    last_name text,
    company text,
    updated_at text,
    adresse_rue text,
    adresse_cp text,
    adresse_ville text,
    facturation_differente boolean,
    fact_rue text,
    fact_cp text,
    fact_ville text,
    code_client text,
    activite text,
    tva_intra text,
    contacts jsonb,
    contact_principal text
);


--
-- Name: commandes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commandes (
    id text NOT NULL,
    num_affaire text,
    client_nom text,
    montant numeric,
    statut text,
    date_cmd date,
    date_liv date,
    bdt_total integer,
    bdt_soldes integer,
    cout_reel numeric,
    marge_reelle numeric,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    avoir_applique numeric DEFAULT 0
);


--
-- Name: conges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    salarie_id text,
    type text,
    date_debut date,
    date_fin date,
    nb_jours numeric,
    nb_heures numeric,
    statut text,
    valide_par text,
    valide_le timestamp with time zone
);


--
-- Name: credits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credits (
    id text NOT NULL,
    client_id text,
    client_nom text,
    motif text,
    montant numeric,
    solde numeric,
    date_credit text,
    statut text,
    vendeur text,
    saisi_par text,
    created_at text,
    updated_at text,
    num_avoir text,
    num_affaire text,
    nc_id text,
    type text,
    mode_restitution text,
    origine text,
    facture_source_id text,
    facture_cible_id text
);


--
-- Name: demandes_achat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demandes_achat (
    id text NOT NULL,
    demandeur text,
    type_da text,
    article text,
    fournisseur text,
    qte text,
    priorite text,
    statut text,
    date_da text,
    livraison text,
    created_at text,
    updated_at text,
    affaire_id text,
    visible boolean,
    genere_par_adt boolean,
    bc_draft text,
    type_bc text,
    fournisseur_id text,
    categorie text,
    machine_id text,
    poste_id text,
    operateur_id text,
    num_affaire text,
    cmd_ref text
);


--
-- Name: demandes_prix; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demandes_prix (
    id text NOT NULL,
    numero text,
    statut text,
    origine text,
    dt_id text,
    dt_ref text,
    nomenclature_id text,
    demandeur text,
    date_creation text,
    date_envoi text,
    date_cloture text,
    activite text,
    notes text
);


--
-- Name: demandes_travaux; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demandes_travaux (
    id text NOT NULL,
    num_affaire text,
    client_id text,
    client_nom text,
    pieces jsonb,
    type_dt text,
    statut text,
    activite text,
    priorite text,
    analyste text,
    budget text,
    date_dt text,
    delai text,
    contact text,
    montant numeric,
    created_at text,
    updated_at text,
    affaire_id text,
    cahier_charges jsonb,
    pieces_detail jsonb,
    commercial_id text,
    contact_client_id text,
    besoins_achat text
);


--
-- Name: derogations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.derogations (
    id text NOT NULL,
    numero numeric,
    date_demande text,
    emetteur text,
    client text,
    contact text,
    tel text,
    email text,
    designation text,
    cmd_client text,
    ref_client text,
    ar text,
    notre_ref text,
    type_demande text,
    descriptif text,
    quantite text,
    decision text,
    decision_client text,
    commentaire text,
    date_cloture text,
    statut text,
    created_at text,
    updated_at text,
    nc_ref text
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id text NOT NULL,
    categorie text,
    nomenclature_id text,
    version_groupe text,
    etape_ordre text,
    fichier_nom text,
    storage_path text,
    mime text,
    taille numeric,
    plan_num text,
    plan_indice text,
    uploaded_par text,
    uploaded_at text,
    actif boolean
);


--
-- Name: ecme; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecme (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text,
    designation text,
    type text,
    marque text,
    modele text,
    numero_serie text,
    num_commande text,
    localisation text,
    activite text,
    responsable text,
    etendue_mesure text,
    resolution text,
    incertitude text,
    organisme text,
    certificat_ref text,
    periodicite_mois integer,
    date_dernier_etalonnage date,
    date_prochain_etalonnage date,
    date_mise_service date,
    statut text,
    reforme boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ecme_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecme_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ecme_id uuid,
    ecme_code text,
    date_verif date DEFAULT CURRENT_DATE NOT NULL,
    intervenant text,
    lieu text DEFAULT 'interne'::text,
    famille text,
    interventions text,
    mesures jsonb,
    ej numeric,
    ef numeric,
    classe_justesse text,
    classe_fidelite text,
    classe_globale text,
    resultat text,
    decision text,
    motif_nc text,
    visa text,
    a_refaire_avant date,
    cale_etalon text,
    pv_ref text,
    indice text,
    certificat_ref text,
    organisme text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ecritures_comptables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecritures_comptables (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    journal text,
    piece text,
    date_ecriture date,
    valide boolean,
    compte text,
    libelle text,
    debit numeric,
    credit numeric,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: edit_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.edit_locks (
    resource text,
    holder_id text,
    holder_label text,
    acquired_at text,
    heartbeat_at text
);


--
-- Name: factures_client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factures_client (
    id text NOT NULL,
    cmd_id text,
    montant_ht numeric,
    num_facture text,
    client_nom text,
    num_affaire text,
    bl_id text,
    date_facture date,
    date_echeance date,
    tva_pct numeric,
    montant_tva numeric,
    montant_ttc numeric,
    prix_transport numeric,
    partielle boolean,
    statut text,
    validation_hierarchique boolean,
    validation_statut text,
    lignes jsonb,
    notes text,
    mode_paiement text,
    date_paiement date,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: factures_fournisseur; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factures_fournisseur (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    num_facture text,
    type text DEFAULT 'fournisseur'::text,
    fournisseur_nom text,
    date_facture date,
    date_echeance date,
    montant_ht numeric,
    tva_pct numeric,
    montant_tva numeric,
    montant_ttc numeric,
    statut text DEFAULT 'a_valider'::text,
    date_paiement date,
    mode_paiement text,
    compte_charge text,
    notes text
);


--
-- Name: fai; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fai (
    id text NOT NULL,
    nomenclature_id text,
    num_nom text,
    indice text,
    commande_ref text,
    type text DEFAULT 'complet'::text,
    statut text DEFAULT 'a_faire'::text NOT NULL,
    date_realisation date,
    realise_par text,
    conforme boolean,
    caracteristiques jsonb,
    rapport_url text,
    observations text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fournisseurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fournisseurs (
    id text NOT NULL,
    code text,
    nom text,
    contact text,
    email text,
    tel text,
    adresse text,
    siret text,
    tva_intracom text,
    delai_moyen_j text,
    conditions_paiement text,
    famille_produits jsonb,
    actif boolean,
    notes text,
    created_at text,
    catalogue jsonb,
    activite text,
    categorie text,
    mode_reglement text,
    otd_methode text,
    qualification text,
    conditions_standards text,
    scoring text,
    familles_fourniture jsonb
);


--
-- Name: fournisseurs_st; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fournisseurs_st (
    id text NOT NULL,
    nom text,
    operation text,
    localisation text,
    qualification text,
    statut text,
    otd numeric,
    scoring numeric,
    created_at text
);


--
-- Name: hse_aspects_impacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_aspects_impacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    activite text,
    aspect text,
    impact text,
    milieu text,
    condition text,
    gravite integer,
    frequence integer,
    maitrise integer,
    criticite integer,
    significatif boolean DEFAULT false,
    exigence text,
    maitrise_moyens text,
    action text,
    responsable text,
    echeance date,
    statut text DEFAULT 'a_traiter'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    probabilite integer,
    sensibilite integer,
    maitrise_technique integer,
    maitrise_humaine integer,
    maitrise_organisationnelle integer,
    etape_cycle_vie text
);


--
-- Name: hse_atex_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_atex_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    nom text,
    type_zone text,
    localisation text,
    origine_risque text,
    substances text,
    materiel_requis text,
    mesures text,
    date_revue date,
    created_at timestamp with time zone DEFAULT now(),
    sources_inflammation text,
    mesures_protection text,
    evaluateur text
);


--
-- Name: hse_conformite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_conformite (
    id text NOT NULL,
    entite text,
    domaine text,
    obligation text,
    reference_reglementaire text,
    applicable boolean,
    statut text,
    date_dernier_controle text,
    date_echeance text,
    responsable text,
    preuve_url text,
    observations text,
    created_at text,
    source text,
    type_texte text,
    date_parution date
);


--
-- Name: hse_dechets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_dechets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    date_dechet date,
    code_dechet text,
    designation text,
    dangereux boolean DEFAULT false,
    quantite numeric,
    unite text,
    zone_producteur text,
    filiere text,
    transporteur text,
    exutoire text,
    bsdd_num text,
    trackdechets_id text,
    statut text DEFAULT 'enleve'::text,
    created_at timestamp with time zone DEFAULT now(),
    source_type text,
    source_ref text
);


--
-- Name: hse_diagnostic_iso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_diagnostic_iso (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    chapitre text,
    titre text,
    niveau_actuel integer,
    niveau_cible integer,
    constat text,
    action text,
    responsable text,
    echeance date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: hse_diagnostic_iso26000; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_diagnostic_iso26000 (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    code text,
    titre text,
    niveau_actuel integer,
    niveau_cible integer,
    constat text,
    action text,
    responsable text,
    echeance date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: hse_epi_catalogue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_epi_catalogue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    nom text,
    categorie text,
    norme_en text,
    duree_vie_mois integer,
    ref_stock text,
    fournisseur text,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hse_epi_dotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_epi_dotations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    salarie_id text,
    salarie_nom text,
    epi_id uuid,
    epi_nom text,
    taille text,
    quantite integer DEFAULT 1,
    date_remise date,
    date_peremption date,
    signature boolean DEFAULT false,
    statut text DEFAULT 'en_service'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hse_epi_zone; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_epi_zone (
    id text NOT NULL,
    entite text,
    zone text,
    epi text,
    obligatoire boolean,
    consignes text,
    created_at text,
    updated_at text
);


--
-- Name: hse_exercices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_exercices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    type text,
    date_exercice date,
    site text,
    nb_participants integer,
    duree_min integer,
    scenario text,
    observations text,
    conforme boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hse_exposition_chimique; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_exposition_chimique (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    produit_id uuid,
    produit_nom text,
    unite_travail text,
    zone text,
    tache text,
    procede text,
    quantite_utilisee numeric,
    unite text,
    frequence text,
    volatilite text,
    protection_collective text,
    epi boolean DEFAULT false,
    maintenance_ko boolean DEFAULT false,
    issu_transformation boolean DEFAULT false,
    non_utilise_1an boolean DEFAULT false,
    rejet_milieu boolean DEFAULT false,
    score_sante integer,
    niveau_sante integer,
    score_incendie integer,
    score_env integer,
    significatif boolean DEFAULT false,
    observations text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: hse_flash; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_flash (
    id text NOT NULL,
    numero numeric,
    date text,
    secteur text,
    evenement text,
    mesures text,
    diffusion text,
    gravite text,
    pilote text,
    statut text,
    created_at text,
    updated_at text
);


--
-- Name: hse_formations_requises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_formations_requises (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    poste text,
    formation text,
    obligatoire boolean DEFAULT true,
    periodicite_mois integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hse_incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_incidents (
    id text NOT NULL,
    entite text,
    type text,
    date_incident text,
    heure text,
    salarie_id text,
    salarie_nom text,
    zone text,
    poste text,
    partie_corps text,
    nature_lesion text,
    gravite text,
    avec_arret boolean,
    jours_arret numeric,
    temoins text,
    description text,
    premiers_secours text,
    declaration_cpam_date text,
    analyse_causes text,
    actions_correctives text,
    responsable text,
    statut text,
    date_cloture text,
    created_at text,
    updated_at text
);


--
-- Name: hse_mesures_env; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_mesures_env (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    type text,
    date_mesure date,
    point_mesure text,
    parametre text,
    valeur numeric,
    unite text,
    vle numeric,
    conforme boolean DEFAULT true,
    organisme text,
    observations text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hse_parties_interessees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_parties_interessees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    partie text NOT NULL,
    type text,
    attentes text,
    influence integer,
    maitrise integer,
    score integer,
    exigence_retenue text,
    mode_reponse text,
    statut text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: hse_plans_prevention; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_plans_prevention (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    type text,
    entreprise_exterieure text,
    operation text,
    date_debut date,
    date_fin date,
    risques text,
    mesures text,
    signataires text,
    valide_par text,
    statut text DEFAULT 'en_cours'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hse_produits_chimiques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_produits_chimiques (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    nom text,
    fournisseur_id text,
    fournisseur_nom text,
    ref_stock text,
    cas text,
    fds_ref text,
    fds_url text,
    fds_date date,
    etat text,
    pictogrammes jsonb DEFAULT '[]'::jsonb,
    mentions_danger jsonb DEFAULT '[]'::jsonb,
    cmr text,
    vlep text,
    zone_stockage text,
    retention boolean DEFAULT false,
    compatibilites text,
    quantite numeric,
    unite text,
    statut text DEFAULT 'en_stock'::text,
    created_at timestamp with time zone DEFAULT now(),
    num_identification text
);


--
-- Name: COLUMN hse_produits_chimiques.num_identification; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.hse_produits_chimiques.num_identification IS 'N° d''identification du produit chimique (interne / registre / UFI), distinct de ref_stock (codes GPAO) et cas (n° CAS).';


--
-- Name: hse_risques; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_risques (
    id text NOT NULL,
    entite text,
    unite_travail text,
    zone text,
    danger text,
    situation text,
    risque text,
    gravite numeric,
    frequence numeric,
    maitrise numeric,
    criticite numeric,
    mesures_existantes text,
    mesures_prevues text,
    responsable text,
    echeance text,
    statut text,
    created_at text,
    annee numeric,
    famille text,
    famille_code numeric,
    ut_source text,
    probabilite numeric,
    freq_expo numeric,
    gravite_brute numeric,
    coef numeric,
    score_brut numeric,
    produits text,
    plan_action text,
    priorite numeric,
    source text,
    cle_naturelle text,
    updated_at text
);


--
-- Name: hse_rse_indicateurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_rse_indicateurs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    periode text,
    categorie text,
    code text,
    libelle text,
    valeur numeric,
    unite text,
    cible numeric,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: hse_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hse_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entite text,
    type text,
    equipement text,
    machine_id text,
    organisme text,
    date_controle date,
    date_prochaine date,
    periodicite_mois integer,
    resultat text,
    levee_reserves text,
    rapport_url text,
    statut text DEFAULT 'a_jour'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: import_staging; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.import_staging (
    id bigint NOT NULL,
    batch_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    source_file text,
    target_table text NOT NULL,
    row_index integer,
    source_row jsonb,
    mapped jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    error text,
    validated_by text,
    validated_at timestamp with time zone,
    inserted_at timestamp with time zone
);


--
-- Name: import_staging_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.import_staging_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: import_staging_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.import_staging_id_seq OWNED BY public.import_staging.id;


--
-- Name: kpi_objectifs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpi_objectifs (
    id text NOT NULL,
    code text,
    libelle text,
    cible numeric,
    unite text,
    sens text,
    seuil_alerte numeric,
    entite text,
    updated_at text
);


--
-- Name: lots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lots (
    id text NOT NULL,
    cmd_id text,
    piece text,
    qte numeric,
    qte_initiale numeric,
    statut text,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    libere_le timestamp with time zone,
    libere_par text
);


--
-- Name: machines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.machines (
    id text NOT NULL,
    nom text,
    code text,
    activite text,
    categorie text,
    operations jsonb,
    shift_id text,
    capacite_h numeric,
    statut text,
    couleur text,
    created_at text,
    cout_h numeric,
    ordre numeric,
    date_panne text,
    motif_panne text,
    tolerance_defaut text,
    poste_id text,
    cnc boolean,
    valeur_achat text,
    duree_amortissement_ans text
);


--
-- Name: machines_opex; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.machines_opex (
    id text NOT NULL,
    machine_id text,
    annee numeric,
    cout_total_ht numeric,
    heures_productives numeric,
    taux_horaire numeric,
    notes text,
    base_cout_h text,
    achats_ht text
);


--
-- Name: mouvements_perissables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mouvements_perissables (
    id numeric NOT NULL,
    perissable_id text,
    date_sortie text,
    qte_sortie numeric,
    n_commande_client text,
    motif text,
    inventaire_apres numeric,
    created_at text
);


--
-- Name: mouvements_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mouvements_stock (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    type text,
    article_id text,
    article_nom text,
    quantite numeric,
    quantite_avant numeric,
    quantite_apres numeric,
    date_mvt date,
    motif text,
    categorie text,
    bc_id text,
    lot_id text,
    created_at timestamp with time zone DEFAULT now(),
    bdt_id text,
    operateur text,
    machine_id text,
    poste_id text,
    stock_id text,
    reference text
);


--
-- Name: nomenclatures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nomenclatures (
    id text NOT NULL,
    created_at text,
    updated_at text,
    num_nom text,
    num_affaire text,
    lot_id text,
    code_ref_produit text,
    description text,
    statut text,
    masse_kg text,
    dimensions text,
    temps_matiere_h numeric,
    temps_machine_h text,
    taux_mo numeric,
    cout_machine_h numeric,
    prix_mo_unitaire numeric,
    cout_machine_unitaire numeric,
    prix_revient_unitaire numeric,
    notes text,
    cree_par text,
    valide_par text,
    date_validation text,
    type_nom text,
    parent_id text,
    qte_par_mere text,
    composants text,
    indice text,
    version_groupe text,
    entite text,
    surface_totale_dm2 text,
    etapes_production jsonb,
    num_plan text,
    plan_fichier text
);


--
-- Name: non_conformites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.non_conformites (
    id text NOT NULL,
    date_nc text,
    type_nc text,
    lot_ref text,
    client_nom text,
    gravite text,
    statut text,
    detecteur text,
    operation text,
    created_at text,
    updated_at text,
    affaire_id text,
    categorie text,
    entite text,
    type_defaut text,
    type_cause text,
    description text,
    ref_article text,
    n_commande text,
    designation text,
    action_corrective text,
    nb_pieces numeric,
    nb_litige numeric,
    frc text,
    bdt_id text,
    nb_pieces_nc text,
    prix_vente_unitaire text,
    prix_revient_unitaire text,
    montant_avoir text,
    decision_retour text,
    num_facture text,
    avoir_id text,
    cmdp_id text,
    num_affaire text,
    fournisseur_nom text,
    lieu_detection text,
    lieu_imputation text,
    responsable text
);


--
-- Name: offres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.offres (
    id text NOT NULL,
    num_affaire text,
    dt_ref text,
    client_id text,
    client_nom text,
    pieces jsonb,
    montant numeric,
    marge numeric,
    date_offre text,
    validite text,
    statut text,
    vendeur text,
    has_st boolean,
    rep text,
    created_at text,
    updated_at text,
    affaire_id text,
    adt_id text,
    lettre_offre text,
    coeff_marge numeric,
    methode_fact text,
    cgv text,
    montant_revient numeric,
    version numeric,
    motif_negociation text,
    mode_livraison text,
    frais_transport numeric,
    date_envoi text,
    mode_reglement text
);


--
-- Name: ordres_maintenance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ordres_maintenance (
    id text NOT NULL,
    created_at text,
    updated_at text,
    num_om text,
    type text,
    machine_id text,
    machine_nom text,
    titre text,
    description text,
    priorite text,
    statut text,
    responsable text,
    intervenant text,
    date_signalement text,
    date_prevue text,
    date_debut text,
    date_fin text,
    duree_h numeric,
    cout_estime text,
    cout_reel text,
    pieces_utilisees text,
    observations text,
    cause_racine text,
    action_preventive text,
    piece_id text,
    origine text
);


--
-- Name: pieces_rechange; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pieces_rechange (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    nom text,
    reference text,
    machine_id text,
    machine_nom text,
    duree_vie_h numeric,
    stock integer
);


--
-- Name: plan_marqueurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_marqueurs (
    id text NOT NULL,
    plan_id text,
    type text,
    x numeric,
    y numeric,
    w numeric,
    h numeric,
    label text,
    ref_table text,
    ref_id text,
    couleur text,
    icone text,
    notes text,
    created_at text
);


--
-- Name: plans_batiment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans_batiment (
    id text NOT NULL,
    nom text,
    entite text,
    image_doc_id text,
    notes text,
    actif boolean,
    created_at text
);


--
-- Name: plans_controle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans_controle (
    id text NOT NULL,
    num_ligne numeric,
    operation text,
    classification_client text,
    parametres text,
    ecme_outils text,
    frequence_echantillonnage text,
    critere_acceptation text,
    responsable text,
    type_controle text,
    plan_reaction text,
    activite text,
    ordre numeric,
    statut text,
    created_at text,
    updated_at text
);


--
-- Name: plans_preventif; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans_preventif (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    actif boolean DEFAULT true,
    machine_id text,
    machine_nom text,
    intitule text,
    instructions text,
    responsable text,
    prochain_prevu date,
    dernier_fait date,
    frequence_jours integer,
    duree_h numeric,
    cout_estime numeric
);


--
-- Name: pointages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pointages (
    id text NOT NULL,
    salarie_id text,
    date_pointage text,
    heure_arrivee text,
    heure_depart_pause text,
    heure_retour_pause text,
    heure_depart text,
    type_horaire text,
    seuil_journalier_h numeric,
    duree_pause text,
    duree_totale text,
    duree_totale_s numeric,
    heures_decimales numeric,
    heures_jour text,
    heures_soir text,
    heures_supp text,
    heures_supp_s numeric,
    absent boolean,
    motif_absence text,
    valide boolean,
    valide_par text,
    valide_le text,
    notes text,
    created_at text,
    updated_at text,
    employe_id text,
    employe_nom text,
    pause_min numeric,
    heures_travaillees numeric,
    type text,
    statut text,
    correction_motif text
);


--
-- Name: postes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.postes (
    id text NOT NULL,
    nom text,
    code text,
    activite text,
    couleur text,
    ordre numeric,
    statut text,
    notes text,
    created_at text,
    taux_horaire_manuel text
);


--
-- Name: process_atelier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.process_atelier (
    id text NOT NULL,
    nom text,
    code text,
    activite text,
    categorie text,
    requiert_machine boolean,
    machine_id text,
    operations jsonb,
    couleur text,
    statut text,
    ordre numeric,
    created_at text,
    est_oas boolean,
    poste_id text
);


--
-- Name: produits_fournisseurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produits_fournisseurs (
    id text NOT NULL,
    fournisseur_id text,
    fournisseur_nom text,
    reference text,
    designation text,
    prix numeric,
    devise text,
    unite text,
    date_prix text,
    source_prix text,
    delai_jours text,
    mini_commande text,
    conditionnement text,
    categorie text,
    statut text,
    activite text,
    notes text,
    created_at text,
    updated_at text
);


--
-- Name: pv_controle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pv_controle (
    id text DEFAULT gen_random_uuid() NOT NULL,
    created_at text,
    num_pv text,
    date_pv text,
    operateur_id text,
    type_controle text,
    type_lien text,
    lot_id text,
    bl_id text,
    piece text,
    client_nom text,
    statut text,
    cp text,
    cpk text,
    decision text,
    observations text,
    nc_ouverte boolean,
    bc_id text,
    fournisseur text,
    anomalie boolean
);


--
-- Name: quarantaines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quarantaines (
    id text DEFAULT gen_random_uuid() NOT NULL,
    created_at text,
    lot_id text,
    piece text,
    client_nom text,
    date_mise_quarantaine text,
    motif text,
    pv_id text,
    nc_id text,
    statut text,
    libere_par text,
    libere_le text,
    duree_jours text
);


--
-- Name: rapports_8d; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rapports_8d (
    id text NOT NULL,
    affaire_id text,
    nc_id text,
    client_id text,
    d1_equipe text,
    d2_probleme text,
    d3_actions_imm text,
    d4_causes_racines text,
    d5_actions_corr text,
    d6_mise_en_oeuvre text,
    d7_prevention text,
    d8_conclusion text,
    statut text,
    gravite text,
    date_ouverture text,
    date_cloture text,
    responsable text,
    created_at text,
    updated_at text
);


--
-- Name: ref_prix_historique; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ref_prix_historique (
    id text NOT NULL,
    created_at text,
    stock_id text,
    reference text,
    designation text,
    categorie_ref text,
    fournisseur_id text,
    fournisseur_nom text,
    prix_unitaire numeric,
    quantite text,
    date_prix text,
    bc_id text,
    bc_num text,
    activite text,
    source text
);


--
-- Name: references_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.references_clients (
    id text NOT NULL,
    code_ref_interne text,
    client_id text,
    client_nom text,
    ref_client text,
    num_plan text,
    plan_doc_id text,
    nomenclature_id text,
    entite text,
    created_at text,
    updated_at text
);


--
-- Name: salaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salaries (
    id text NOT NULL,
    nom text,
    prenom text,
    poste text,
    shift_id text,
    competences jsonb,
    habilitations jsonb,
    niveau jsonb,
    actif boolean,
    created_at text,
    metier text,
    date_entree text,
    contrat text,
    email text,
    user_id text,
    taux_horaire_charge numeric,
    cout_horaire_note text,
    entite text,
    est_operateur boolean,
    matricule text,
    date_naissance text,
    telephone text,
    adresse text,
    urgence_contact text,
    urgence_tel text,
    pin text,
    role text,
    autorisations jsonb,
    solde_conges numeric,
    solde_rtt numeric,
    manager_id text,
    roles jsonb,
    sexe text,
    oeth boolean DEFAULT false,
    date_sortie date
);


--
-- Name: sous_traitants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sous_traitants (
    id text NOT NULL,
    code text,
    nom text,
    contact text,
    email text,
    tel text,
    adresse text,
    siret text,
    prestations jsonb,
    certifications text,
    delai_moyen_j text,
    taux_horaire_ht numeric,
    actif boolean,
    notes text,
    created_at text,
    couleur text,
    approved boolean,
    tarifs jsonb,
    catalogue jsonb,
    activite text,
    categorie text,
    mode_reglement text,
    otd_methode text,
    qualification text,
    conditions_standards text,
    scoring text,
    conditions_paiement text
);


--
-- Name: stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock (
    id text NOT NULL,
    reference text,
    designation text,
    famille text,
    unite text,
    stock_actuel numeric,
    stock_mini numeric,
    stock_maxi numeric,
    emplacement text,
    fournisseur_id text,
    prix_achat_ht numeric,
    delai_appro_j numeric,
    notes text,
    actif boolean,
    created_at text,
    updated_at text,
    categorie text,
    activite text,
    point_commande numeric,
    qte_commande numeric,
    consommation_mensuelle text,
    derniere_entree text,
    dernier_mouvement text,
    auto_reappro boolean
);


--
-- Name: validations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.validations (
    id text NOT NULL,
    created_at text,
    domaine text,
    type text,
    objet text,
    montant numeric,
    priorite text,
    emetteur text,
    ref_table text,
    ref_id text,
    payload jsonb,
    statut text,
    commentaire text,
    decided_at text,
    decided_by text,
    entite text
);


--
-- Name: import_staging id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_staging ALTER COLUMN id SET DEFAULT nextval('public.import_staging_id_seq'::regclass);


--
-- Name: absences absences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absences
    ADD CONSTRAINT absences_pkey PRIMARY KEY (id);


--
-- Name: actions_correctives actions_correctives_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actions_correctives
    ADD CONSTRAINT actions_correctives_pkey PRIMARY KEY (id);


--
-- Name: audit_grille audit_grille_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_grille
    ADD CONSTRAINT audit_grille_pkey PRIMARY KEY (id);


--
-- Name: audit_programme audit_programme_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_programme
    ADD CONSTRAINT audit_programme_pkey PRIMARY KEY (id);


--
-- Name: audit_question audit_question_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_question
    ADD CONSTRAINT audit_question_pkey PRIMARY KEY (id);


--
-- Name: bons_de_commande bons_de_commande_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bons_de_commande
    ADD CONSTRAINT bons_de_commande_pkey PRIMARY KEY (id);


--
-- Name: bons_de_livraison bons_de_livraison_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bons_de_livraison
    ADD CONSTRAINT bons_de_livraison_pkey PRIMARY KEY (id);


--
-- Name: bons_de_travail bons_de_travail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bons_de_travail
    ADD CONSTRAINT bons_de_travail_pkey PRIMARY KEY (id);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: commandes commandes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes
    ADD CONSTRAINT commandes_pkey PRIMARY KEY (id);


--
-- Name: conges conges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conges
    ADD CONSTRAINT conges_pkey PRIMARY KEY (id);


--
-- Name: credits credits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credits
    ADD CONSTRAINT credits_pkey PRIMARY KEY (id);


--
-- Name: demandes_achat demandes_achat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandes_achat
    ADD CONSTRAINT demandes_achat_pkey PRIMARY KEY (id);


--
-- Name: demandes_prix demandes_prix_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandes_prix
    ADD CONSTRAINT demandes_prix_pkey PRIMARY KEY (id);


--
-- Name: demandes_travaux demandes_travaux_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demandes_travaux
    ADD CONSTRAINT demandes_travaux_pkey PRIMARY KEY (id);


--
-- Name: derogations derogations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.derogations
    ADD CONSTRAINT derogations_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: ecme ecme_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecme
    ADD CONSTRAINT ecme_pkey PRIMARY KEY (id);


--
-- Name: ecme_verifications ecme_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecme_verifications
    ADD CONSTRAINT ecme_verifications_pkey PRIMARY KEY (id);


--
-- Name: ecritures_comptables ecritures_comptables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecritures_comptables
    ADD CONSTRAINT ecritures_comptables_pkey PRIMARY KEY (id);


--
-- Name: factures_client factures_client_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factures_client
    ADD CONSTRAINT factures_client_pkey PRIMARY KEY (id);


--
-- Name: factures_fournisseur factures_fournisseur_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factures_fournisseur
    ADD CONSTRAINT factures_fournisseur_pkey PRIMARY KEY (id);


--
-- Name: fai fai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fai
    ADD CONSTRAINT fai_pkey PRIMARY KEY (id);


--
-- Name: fournisseurs fournisseurs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fournisseurs
    ADD CONSTRAINT fournisseurs_pkey PRIMARY KEY (id);


--
-- Name: fournisseurs_st fournisseurs_st_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fournisseurs_st
    ADD CONSTRAINT fournisseurs_st_pkey PRIMARY KEY (id);


--
-- Name: hse_aspects_impacts hse_aspects_impacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_aspects_impacts
    ADD CONSTRAINT hse_aspects_impacts_pkey PRIMARY KEY (id);


--
-- Name: hse_atex_zones hse_atex_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_atex_zones
    ADD CONSTRAINT hse_atex_zones_pkey PRIMARY KEY (id);


--
-- Name: hse_conformite hse_conformite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_conformite
    ADD CONSTRAINT hse_conformite_pkey PRIMARY KEY (id);


--
-- Name: hse_dechets hse_dechets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_dechets
    ADD CONSTRAINT hse_dechets_pkey PRIMARY KEY (id);


--
-- Name: hse_diagnostic_iso26000 hse_diagnostic_iso26000_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_diagnostic_iso26000
    ADD CONSTRAINT hse_diagnostic_iso26000_pkey PRIMARY KEY (id);


--
-- Name: hse_diagnostic_iso hse_diagnostic_iso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_diagnostic_iso
    ADD CONSTRAINT hse_diagnostic_iso_pkey PRIMARY KEY (id);


--
-- Name: hse_epi_catalogue hse_epi_catalogue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_epi_catalogue
    ADD CONSTRAINT hse_epi_catalogue_pkey PRIMARY KEY (id);


--
-- Name: hse_epi_dotations hse_epi_dotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_epi_dotations
    ADD CONSTRAINT hse_epi_dotations_pkey PRIMARY KEY (id);


--
-- Name: hse_epi_zone hse_epi_zone_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_epi_zone
    ADD CONSTRAINT hse_epi_zone_pkey PRIMARY KEY (id);


--
-- Name: hse_exercices hse_exercices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_exercices
    ADD CONSTRAINT hse_exercices_pkey PRIMARY KEY (id);


--
-- Name: hse_exposition_chimique hse_exposition_chimique_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_exposition_chimique
    ADD CONSTRAINT hse_exposition_chimique_pkey PRIMARY KEY (id);


--
-- Name: hse_flash hse_flash_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_flash
    ADD CONSTRAINT hse_flash_pkey PRIMARY KEY (id);


--
-- Name: hse_formations_requises hse_formations_requises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_formations_requises
    ADD CONSTRAINT hse_formations_requises_pkey PRIMARY KEY (id);


--
-- Name: hse_incidents hse_incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_incidents
    ADD CONSTRAINT hse_incidents_pkey PRIMARY KEY (id);


--
-- Name: hse_mesures_env hse_mesures_env_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_mesures_env
    ADD CONSTRAINT hse_mesures_env_pkey PRIMARY KEY (id);


--
-- Name: hse_parties_interessees hse_parties_interessees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_parties_interessees
    ADD CONSTRAINT hse_parties_interessees_pkey PRIMARY KEY (id);


--
-- Name: hse_plans_prevention hse_plans_prevention_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_plans_prevention
    ADD CONSTRAINT hse_plans_prevention_pkey PRIMARY KEY (id);


--
-- Name: hse_produits_chimiques hse_produits_chimiques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_produits_chimiques
    ADD CONSTRAINT hse_produits_chimiques_pkey PRIMARY KEY (id);


--
-- Name: hse_risques hse_risques_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_risques
    ADD CONSTRAINT hse_risques_pkey PRIMARY KEY (id);


--
-- Name: hse_rse_indicateurs hse_rse_indicateurs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_rse_indicateurs
    ADD CONSTRAINT hse_rse_indicateurs_pkey PRIMARY KEY (id);


--
-- Name: hse_verifications hse_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_verifications
    ADD CONSTRAINT hse_verifications_pkey PRIMARY KEY (id);


--
-- Name: import_staging import_staging_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_staging
    ADD CONSTRAINT import_staging_pkey PRIMARY KEY (id);


--
-- Name: kpi_objectifs kpi_objectifs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpi_objectifs
    ADD CONSTRAINT kpi_objectifs_pkey PRIMARY KEY (id);


--
-- Name: lots lots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lots
    ADD CONSTRAINT lots_pkey PRIMARY KEY (id);


--
-- Name: machines_opex machines_opex_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machines_opex
    ADD CONSTRAINT machines_opex_pkey PRIMARY KEY (id);


--
-- Name: machines machines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.machines
    ADD CONSTRAINT machines_pkey PRIMARY KEY (id);


--
-- Name: mouvements_perissables mouvements_perissables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mouvements_perissables
    ADD CONSTRAINT mouvements_perissables_pkey PRIMARY KEY (id);


--
-- Name: mouvements_stock mouvements_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mouvements_stock
    ADD CONSTRAINT mouvements_stock_pkey PRIMARY KEY (id);


--
-- Name: nomenclatures nomenclatures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomenclatures
    ADD CONSTRAINT nomenclatures_pkey PRIMARY KEY (id);


--
-- Name: non_conformites non_conformites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.non_conformites
    ADD CONSTRAINT non_conformites_pkey PRIMARY KEY (id);


--
-- Name: offres offres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.offres
    ADD CONSTRAINT offres_pkey PRIMARY KEY (id);


--
-- Name: ordres_maintenance ordres_maintenance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ordres_maintenance
    ADD CONSTRAINT ordres_maintenance_pkey PRIMARY KEY (id);


--
-- Name: pieces_rechange pieces_rechange_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pieces_rechange
    ADD CONSTRAINT pieces_rechange_pkey PRIMARY KEY (id);


--
-- Name: plan_marqueurs plan_marqueurs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_marqueurs
    ADD CONSTRAINT plan_marqueurs_pkey PRIMARY KEY (id);


--
-- Name: plans_batiment plans_batiment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans_batiment
    ADD CONSTRAINT plans_batiment_pkey PRIMARY KEY (id);


--
-- Name: plans_controle plans_controle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans_controle
    ADD CONSTRAINT plans_controle_pkey PRIMARY KEY (id);


--
-- Name: plans_preventif plans_preventif_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans_preventif
    ADD CONSTRAINT plans_preventif_pkey PRIMARY KEY (id);


--
-- Name: pointages pointages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pointages
    ADD CONSTRAINT pointages_pkey PRIMARY KEY (id);


--
-- Name: postes postes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postes
    ADD CONSTRAINT postes_pkey PRIMARY KEY (id);


--
-- Name: process_atelier process_atelier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.process_atelier
    ADD CONSTRAINT process_atelier_pkey PRIMARY KEY (id);


--
-- Name: produits_fournisseurs produits_fournisseurs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produits_fournisseurs
    ADD CONSTRAINT produits_fournisseurs_pkey PRIMARY KEY (id);


--
-- Name: pv_controle pv_controle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pv_controle
    ADD CONSTRAINT pv_controle_pkey PRIMARY KEY (id);


--
-- Name: quarantaines quarantaines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quarantaines
    ADD CONSTRAINT quarantaines_pkey PRIMARY KEY (id);


--
-- Name: rapports_8d rapports_8d_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rapports_8d
    ADD CONSTRAINT rapports_8d_pkey PRIMARY KEY (id);


--
-- Name: ref_prix_historique ref_prix_historique_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ref_prix_historique
    ADD CONSTRAINT ref_prix_historique_pkey PRIMARY KEY (id);


--
-- Name: references_clients references_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.references_clients
    ADD CONSTRAINT references_clients_pkey PRIMARY KEY (id);


--
-- Name: salaries salaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salaries
    ADD CONSTRAINT salaries_pkey PRIMARY KEY (id);


--
-- Name: sous_traitants sous_traitants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sous_traitants
    ADD CONSTRAINT sous_traitants_pkey PRIMARY KEY (id);


--
-- Name: stock stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock
    ADD CONSTRAINT stock_pkey PRIMARY KEY (id);


--
-- Name: validations validations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.validations
    ADD CONSTRAINT validations_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_prog_cible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_prog_cible ON public.audit_programme USING btree (date_cible);


--
-- Name: idx_audit_prog_exercice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_prog_exercice ON public.audit_programme USING btree (exercice);


--
-- Name: idx_audit_prog_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_prog_statut ON public.audit_programme USING btree (statut);


--
-- Name: idx_audit_q_grille; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_q_grille ON public.audit_question USING btree (grille_id);


--
-- Name: idx_ecme_verif_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ecme_verif_code ON public.ecme_verifications USING btree (ecme_code);


--
-- Name: idx_ecme_verif_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ecme_verif_date ON public.ecme_verifications USING btree (date_verif DESC);


--
-- Name: idx_ecme_verif_ecme; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ecme_verif_ecme ON public.ecme_verifications USING btree (ecme_id);


--
-- Name: idx_fai_nom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fai_nom ON public.fai USING btree (nomenclature_id);


--
-- Name: idx_hse_aspects_activite; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hse_aspects_activite ON public.hse_aspects_impacts USING btree (activite);


--
-- Name: idx_hse_aspects_significatif; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hse_aspects_significatif ON public.hse_aspects_impacts USING btree (significatif);


--
-- Name: idx_hse_conformite_echeance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hse_conformite_echeance ON public.hse_conformite USING btree (date_echeance);


--
-- Name: idx_hse_epi_dot_perem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hse_epi_dot_perem ON public.hse_epi_dotations USING btree (date_peremption);


--
-- Name: idx_hse_expo_niveau; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hse_expo_niveau ON public.hse_exposition_chimique USING btree (niveau_sante);


--
-- Name: idx_hse_expo_produit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hse_expo_produit ON public.hse_exposition_chimique USING btree (produit_id);


--
-- Name: idx_hse_expo_signif; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hse_expo_signif ON public.hse_exposition_chimique USING btree (significatif);


--
-- Name: idx_hse_incidents_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hse_incidents_date ON public.hse_incidents USING btree (date_incident DESC);


--
-- Name: idx_hse_verifs_prochaine; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hse_verifs_prochaine ON public.hse_verifications USING btree (date_prochaine);


--
-- Name: idx_import_staging_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_staging_batch ON public.import_staging USING btree (batch_id);


--
-- Name: idx_import_staging_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_staging_status ON public.import_staging USING btree (status);


--
-- Name: hse_exposition_chimique hse_exposition_chimique_produit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hse_exposition_chimique
    ADD CONSTRAINT hse_exposition_chimique_produit_id_fkey FOREIGN KEY (produit_id) REFERENCES public.hse_produits_chimiques(id) ON DELETE SET NULL;


--
-- Name: audit_grille; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_grille ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_grille audit_grille anon all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "audit_grille anon all" ON public.audit_grille TO anon USING (true) WITH CHECK (true);


--
-- Name: audit_programme; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_programme ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_programme audit_programme anon all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "audit_programme anon all" ON public.audit_programme TO anon USING (true) WITH CHECK (true);


--
-- Name: audit_question; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_question ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_question audit_question anon all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "audit_question anon all" ON public.audit_question TO anon USING (true) WITH CHECK (true);


--
-- Name: ecme; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ecme ENABLE ROW LEVEL SECURITY;

--
-- Name: ecme ecme_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ecme_all ON public.ecme USING (true) WITH CHECK (true);


--
-- Name: ecme_verifications ecme_verif_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ecme_verif_all ON public.ecme_verifications USING (true) WITH CHECK (true);


--
-- Name: ecme_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ecme_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: factures_fournisseur; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.factures_fournisseur ENABLE ROW LEVEL SECURITY;

--
-- Name: factures_fournisseur factures_fournisseur_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY factures_fournisseur_all ON public.factures_fournisseur USING (true) WITH CHECK (true);


--
-- Name: fai; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fai ENABLE ROW LEVEL SECURITY;

--
-- Name: fai fai anon all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "fai anon all" ON public.fai TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_aspects_impacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_aspects_impacts ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_aspects_impacts hse_aspects_impacts_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_aspects_impacts_all ON public.hse_aspects_impacts USING (true) WITH CHECK (true);


--
-- Name: hse_atex_zones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_atex_zones ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_atex_zones hse_atex_zones_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_atex_zones_anon_all ON public.hse_atex_zones TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_conformite; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_conformite ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_conformite hse_conformite_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_conformite_anon_all ON public.hse_conformite TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_dechets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_dechets ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_dechets hse_dechets_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_dechets_anon_all ON public.hse_dechets TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_diagnostic_iso hse_diag_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_diag_all ON public.hse_diagnostic_iso USING (true) WITH CHECK (true);


--
-- Name: hse_diagnostic_iso; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_diagnostic_iso ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_diagnostic_iso26000; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_diagnostic_iso26000 ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_epi_catalogue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_epi_catalogue ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_epi_catalogue hse_epi_catalogue_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_epi_catalogue_anon_all ON public.hse_epi_catalogue TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_epi_dotations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_epi_dotations ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_epi_dotations hse_epi_dotations_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_epi_dotations_anon_all ON public.hse_epi_dotations TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_exercices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_exercices ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_exercices hse_exercices_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_exercices_anon_all ON public.hse_exercices TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_exposition_chimique; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_exposition_chimique ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_exposition_chimique hse_exposition_chimique_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_exposition_chimique_all ON public.hse_exposition_chimique USING (true) WITH CHECK (true);


--
-- Name: hse_formations_requises; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_formations_requises ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_formations_requises hse_formations_requises_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_formations_requises_anon_all ON public.hse_formations_requises TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_incidents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_incidents ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_incidents hse_incidents_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_incidents_anon_all ON public.hse_incidents TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_diagnostic_iso26000 hse_iso26000_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_iso26000_all ON public.hse_diagnostic_iso26000 USING (true) WITH CHECK (true);


--
-- Name: hse_mesures_env; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_mesures_env ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_mesures_env hse_mesures_env_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_mesures_env_anon_all ON public.hse_mesures_env TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_parties_interessees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_parties_interessees ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_parties_interessees hse_pi_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_pi_all ON public.hse_parties_interessees USING (true) WITH CHECK (true);


--
-- Name: hse_plans_prevention; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_plans_prevention ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_plans_prevention hse_plans_prevention_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_plans_prevention_anon_all ON public.hse_plans_prevention TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_produits_chimiques; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_produits_chimiques ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_produits_chimiques hse_produits_chimiques anon all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "hse_produits_chimiques anon all" ON public.hse_produits_chimiques TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_produits_chimiques hse_produits_chimiques_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_produits_chimiques_anon_all ON public.hse_produits_chimiques TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_risques; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_risques ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_risques hse_risques_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_risques_anon_all ON public.hse_risques TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_rse_indicateurs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_rse_indicateurs ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_rse_indicateurs hse_rse_indicateurs_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_rse_indicateurs_anon_all ON public.hse_rse_indicateurs TO anon USING (true) WITH CHECK (true);


--
-- Name: hse_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hse_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: hse_verifications hse_verifications_anon_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hse_verifications_anon_all ON public.hse_verifications TO anon USING (true) WITH CHECK (true);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION promote_import_batch(p_batch text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.promote_import_batch(p_batch text) TO anon;
GRANT ALL ON FUNCTION public.promote_import_batch(p_batch text) TO authenticated;
GRANT ALL ON FUNCTION public.promote_import_batch(p_batch text) TO service_role;


--
-- Name: FUNCTION promote_import_row(p_id bigint); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.promote_import_row(p_id bigint) TO anon;
GRANT ALL ON FUNCTION public.promote_import_row(p_id bigint) TO authenticated;
GRANT ALL ON FUNCTION public.promote_import_row(p_id bigint) TO service_role;


--
-- Name: FUNCTION validate_import_batch(p_batch text, p_by text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.validate_import_batch(p_batch text, p_by text) TO anon;
GRANT ALL ON FUNCTION public.validate_import_batch(p_batch text, p_by text) TO authenticated;
GRANT ALL ON FUNCTION public.validate_import_batch(p_batch text, p_by text) TO service_role;


--
-- Name: TABLE absences; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.absences TO anon;
GRANT ALL ON TABLE public.absences TO authenticated;
GRANT ALL ON TABLE public.absences TO service_role;


--
-- Name: TABLE actions_correctives; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.actions_correctives TO anon;
GRANT ALL ON TABLE public.actions_correctives TO authenticated;
GRANT ALL ON TABLE public.actions_correctives TO service_role;


--
-- Name: TABLE audit_grille; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_grille TO anon;
GRANT ALL ON TABLE public.audit_grille TO authenticated;
GRANT ALL ON TABLE public.audit_grille TO service_role;


--
-- Name: TABLE audit_programme; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_programme TO anon;
GRANT ALL ON TABLE public.audit_programme TO authenticated;
GRANT ALL ON TABLE public.audit_programme TO service_role;


--
-- Name: TABLE audit_question; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_question TO anon;
GRANT ALL ON TABLE public.audit_question TO authenticated;
GRANT ALL ON TABLE public.audit_question TO service_role;


--
-- Name: TABLE bons_de_commande; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.bons_de_commande TO anon;
GRANT ALL ON TABLE public.bons_de_commande TO authenticated;
GRANT ALL ON TABLE public.bons_de_commande TO service_role;


--
-- Name: TABLE bons_de_livraison; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.bons_de_livraison TO anon;
GRANT ALL ON TABLE public.bons_de_livraison TO authenticated;
GRANT ALL ON TABLE public.bons_de_livraison TO service_role;


--
-- Name: TABLE bons_de_travail; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.bons_de_travail TO anon;
GRANT ALL ON TABLE public.bons_de_travail TO authenticated;
GRANT ALL ON TABLE public.bons_de_travail TO service_role;


--
-- Name: TABLE certifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.certifications TO anon;
GRANT ALL ON TABLE public.certifications TO authenticated;
GRANT ALL ON TABLE public.certifications TO service_role;


--
-- Name: TABLE clients; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.clients TO anon;
GRANT ALL ON TABLE public.clients TO authenticated;
GRANT ALL ON TABLE public.clients TO service_role;


--
-- Name: TABLE commandes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.commandes TO anon;
GRANT ALL ON TABLE public.commandes TO authenticated;
GRANT ALL ON TABLE public.commandes TO service_role;


--
-- Name: TABLE conges; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.conges TO anon;
GRANT ALL ON TABLE public.conges TO authenticated;
GRANT ALL ON TABLE public.conges TO service_role;


--
-- Name: TABLE credits; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.credits TO anon;
GRANT ALL ON TABLE public.credits TO authenticated;
GRANT ALL ON TABLE public.credits TO service_role;


--
-- Name: TABLE demandes_achat; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.demandes_achat TO anon;
GRANT ALL ON TABLE public.demandes_achat TO authenticated;
GRANT ALL ON TABLE public.demandes_achat TO service_role;


--
-- Name: TABLE demandes_prix; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.demandes_prix TO anon;
GRANT ALL ON TABLE public.demandes_prix TO authenticated;
GRANT ALL ON TABLE public.demandes_prix TO service_role;


--
-- Name: TABLE demandes_travaux; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.demandes_travaux TO anon;
GRANT ALL ON TABLE public.demandes_travaux TO authenticated;
GRANT ALL ON TABLE public.demandes_travaux TO service_role;


--
-- Name: TABLE derogations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.derogations TO anon;
GRANT ALL ON TABLE public.derogations TO authenticated;
GRANT ALL ON TABLE public.derogations TO service_role;


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.documents TO anon;
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO service_role;


--
-- Name: TABLE ecme; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ecme TO anon;
GRANT ALL ON TABLE public.ecme TO authenticated;
GRANT ALL ON TABLE public.ecme TO service_role;


--
-- Name: TABLE ecme_verifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ecme_verifications TO anon;
GRANT ALL ON TABLE public.ecme_verifications TO authenticated;
GRANT ALL ON TABLE public.ecme_verifications TO service_role;


--
-- Name: TABLE ecritures_comptables; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ecritures_comptables TO anon;
GRANT ALL ON TABLE public.ecritures_comptables TO authenticated;
GRANT ALL ON TABLE public.ecritures_comptables TO service_role;


--
-- Name: TABLE edit_locks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.edit_locks TO anon;
GRANT ALL ON TABLE public.edit_locks TO authenticated;
GRANT ALL ON TABLE public.edit_locks TO service_role;


--
-- Name: TABLE factures_client; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.factures_client TO anon;
GRANT ALL ON TABLE public.factures_client TO authenticated;
GRANT ALL ON TABLE public.factures_client TO service_role;


--
-- Name: TABLE factures_fournisseur; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.factures_fournisseur TO anon;
GRANT ALL ON TABLE public.factures_fournisseur TO authenticated;
GRANT ALL ON TABLE public.factures_fournisseur TO service_role;


--
-- Name: TABLE fai; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fai TO anon;
GRANT ALL ON TABLE public.fai TO authenticated;
GRANT ALL ON TABLE public.fai TO service_role;


--
-- Name: TABLE fournisseurs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fournisseurs TO anon;
GRANT ALL ON TABLE public.fournisseurs TO authenticated;
GRANT ALL ON TABLE public.fournisseurs TO service_role;


--
-- Name: TABLE fournisseurs_st; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fournisseurs_st TO anon;
GRANT ALL ON TABLE public.fournisseurs_st TO authenticated;
GRANT ALL ON TABLE public.fournisseurs_st TO service_role;


--
-- Name: TABLE hse_aspects_impacts; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_aspects_impacts TO anon;
GRANT ALL ON TABLE public.hse_aspects_impacts TO authenticated;
GRANT ALL ON TABLE public.hse_aspects_impacts TO service_role;


--
-- Name: TABLE hse_atex_zones; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_atex_zones TO anon;
GRANT ALL ON TABLE public.hse_atex_zones TO authenticated;
GRANT ALL ON TABLE public.hse_atex_zones TO service_role;


--
-- Name: TABLE hse_conformite; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_conformite TO anon;
GRANT ALL ON TABLE public.hse_conformite TO authenticated;
GRANT ALL ON TABLE public.hse_conformite TO service_role;


--
-- Name: TABLE hse_dechets; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_dechets TO anon;
GRANT ALL ON TABLE public.hse_dechets TO authenticated;
GRANT ALL ON TABLE public.hse_dechets TO service_role;


--
-- Name: TABLE hse_diagnostic_iso; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_diagnostic_iso TO anon;
GRANT ALL ON TABLE public.hse_diagnostic_iso TO authenticated;
GRANT ALL ON TABLE public.hse_diagnostic_iso TO service_role;


--
-- Name: TABLE hse_diagnostic_iso26000; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_diagnostic_iso26000 TO anon;
GRANT ALL ON TABLE public.hse_diagnostic_iso26000 TO authenticated;
GRANT ALL ON TABLE public.hse_diagnostic_iso26000 TO service_role;


--
-- Name: TABLE hse_epi_catalogue; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_epi_catalogue TO anon;
GRANT ALL ON TABLE public.hse_epi_catalogue TO authenticated;
GRANT ALL ON TABLE public.hse_epi_catalogue TO service_role;


--
-- Name: TABLE hse_epi_dotations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_epi_dotations TO anon;
GRANT ALL ON TABLE public.hse_epi_dotations TO authenticated;
GRANT ALL ON TABLE public.hse_epi_dotations TO service_role;


--
-- Name: TABLE hse_epi_zone; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_epi_zone TO anon;
GRANT ALL ON TABLE public.hse_epi_zone TO authenticated;
GRANT ALL ON TABLE public.hse_epi_zone TO service_role;


--
-- Name: TABLE hse_exercices; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_exercices TO anon;
GRANT ALL ON TABLE public.hse_exercices TO authenticated;
GRANT ALL ON TABLE public.hse_exercices TO service_role;


--
-- Name: TABLE hse_exposition_chimique; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_exposition_chimique TO anon;
GRANT ALL ON TABLE public.hse_exposition_chimique TO authenticated;
GRANT ALL ON TABLE public.hse_exposition_chimique TO service_role;


--
-- Name: TABLE hse_flash; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_flash TO anon;
GRANT ALL ON TABLE public.hse_flash TO authenticated;
GRANT ALL ON TABLE public.hse_flash TO service_role;


--
-- Name: TABLE hse_formations_requises; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_formations_requises TO anon;
GRANT ALL ON TABLE public.hse_formations_requises TO authenticated;
GRANT ALL ON TABLE public.hse_formations_requises TO service_role;


--
-- Name: TABLE hse_incidents; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_incidents TO anon;
GRANT ALL ON TABLE public.hse_incidents TO authenticated;
GRANT ALL ON TABLE public.hse_incidents TO service_role;


--
-- Name: TABLE hse_mesures_env; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_mesures_env TO anon;
GRANT ALL ON TABLE public.hse_mesures_env TO authenticated;
GRANT ALL ON TABLE public.hse_mesures_env TO service_role;


--
-- Name: TABLE hse_parties_interessees; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_parties_interessees TO anon;
GRANT ALL ON TABLE public.hse_parties_interessees TO authenticated;
GRANT ALL ON TABLE public.hse_parties_interessees TO service_role;


--
-- Name: TABLE hse_plans_prevention; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_plans_prevention TO anon;
GRANT ALL ON TABLE public.hse_plans_prevention TO authenticated;
GRANT ALL ON TABLE public.hse_plans_prevention TO service_role;


--
-- Name: TABLE hse_produits_chimiques; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_produits_chimiques TO anon;
GRANT ALL ON TABLE public.hse_produits_chimiques TO authenticated;
GRANT ALL ON TABLE public.hse_produits_chimiques TO service_role;


--
-- Name: TABLE hse_risques; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_risques TO anon;
GRANT ALL ON TABLE public.hse_risques TO authenticated;
GRANT ALL ON TABLE public.hse_risques TO service_role;


--
-- Name: TABLE hse_rse_indicateurs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_rse_indicateurs TO anon;
GRANT ALL ON TABLE public.hse_rse_indicateurs TO authenticated;
GRANT ALL ON TABLE public.hse_rse_indicateurs TO service_role;


--
-- Name: TABLE hse_verifications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hse_verifications TO anon;
GRANT ALL ON TABLE public.hse_verifications TO authenticated;
GRANT ALL ON TABLE public.hse_verifications TO service_role;


--
-- Name: TABLE import_staging; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.import_staging TO anon;
GRANT ALL ON TABLE public.import_staging TO authenticated;
GRANT ALL ON TABLE public.import_staging TO service_role;


--
-- Name: SEQUENCE import_staging_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.import_staging_id_seq TO anon;
GRANT ALL ON SEQUENCE public.import_staging_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.import_staging_id_seq TO service_role;


--
-- Name: TABLE kpi_objectifs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.kpi_objectifs TO anon;
GRANT ALL ON TABLE public.kpi_objectifs TO authenticated;
GRANT ALL ON TABLE public.kpi_objectifs TO service_role;


--
-- Name: TABLE lots; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.lots TO anon;
GRANT ALL ON TABLE public.lots TO authenticated;
GRANT ALL ON TABLE public.lots TO service_role;


--
-- Name: TABLE machines; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.machines TO anon;
GRANT ALL ON TABLE public.machines TO authenticated;
GRANT ALL ON TABLE public.machines TO service_role;


--
-- Name: TABLE machines_opex; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.machines_opex TO anon;
GRANT ALL ON TABLE public.machines_opex TO authenticated;
GRANT ALL ON TABLE public.machines_opex TO service_role;


--
-- Name: TABLE mouvements_perissables; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.mouvements_perissables TO anon;
GRANT ALL ON TABLE public.mouvements_perissables TO authenticated;
GRANT ALL ON TABLE public.mouvements_perissables TO service_role;


--
-- Name: TABLE mouvements_stock; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.mouvements_stock TO anon;
GRANT ALL ON TABLE public.mouvements_stock TO authenticated;
GRANT ALL ON TABLE public.mouvements_stock TO service_role;


--
-- Name: TABLE nomenclatures; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.nomenclatures TO anon;
GRANT ALL ON TABLE public.nomenclatures TO authenticated;
GRANT ALL ON TABLE public.nomenclatures TO service_role;


--
-- Name: TABLE non_conformites; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.non_conformites TO anon;
GRANT ALL ON TABLE public.non_conformites TO authenticated;
GRANT ALL ON TABLE public.non_conformites TO service_role;


--
-- Name: TABLE offres; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.offres TO anon;
GRANT ALL ON TABLE public.offres TO authenticated;
GRANT ALL ON TABLE public.offres TO service_role;


--
-- Name: TABLE ordres_maintenance; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ordres_maintenance TO anon;
GRANT ALL ON TABLE public.ordres_maintenance TO authenticated;
GRANT ALL ON TABLE public.ordres_maintenance TO service_role;


--
-- Name: TABLE pieces_rechange; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pieces_rechange TO anon;
GRANT ALL ON TABLE public.pieces_rechange TO authenticated;
GRANT ALL ON TABLE public.pieces_rechange TO service_role;


--
-- Name: TABLE plan_marqueurs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.plan_marqueurs TO anon;
GRANT ALL ON TABLE public.plan_marqueurs TO authenticated;
GRANT ALL ON TABLE public.plan_marqueurs TO service_role;


--
-- Name: TABLE plans_batiment; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.plans_batiment TO anon;
GRANT ALL ON TABLE public.plans_batiment TO authenticated;
GRANT ALL ON TABLE public.plans_batiment TO service_role;


--
-- Name: TABLE plans_controle; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.plans_controle TO anon;
GRANT ALL ON TABLE public.plans_controle TO authenticated;
GRANT ALL ON TABLE public.plans_controle TO service_role;


--
-- Name: TABLE plans_preventif; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.plans_preventif TO anon;
GRANT ALL ON TABLE public.plans_preventif TO authenticated;
GRANT ALL ON TABLE public.plans_preventif TO service_role;


--
-- Name: TABLE pointages; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pointages TO anon;
GRANT ALL ON TABLE public.pointages TO authenticated;
GRANT ALL ON TABLE public.pointages TO service_role;


--
-- Name: TABLE postes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.postes TO anon;
GRANT ALL ON TABLE public.postes TO authenticated;
GRANT ALL ON TABLE public.postes TO service_role;


--
-- Name: TABLE process_atelier; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.process_atelier TO anon;
GRANT ALL ON TABLE public.process_atelier TO authenticated;
GRANT ALL ON TABLE public.process_atelier TO service_role;


--
-- Name: TABLE produits_fournisseurs; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.produits_fournisseurs TO anon;
GRANT ALL ON TABLE public.produits_fournisseurs TO authenticated;
GRANT ALL ON TABLE public.produits_fournisseurs TO service_role;


--
-- Name: TABLE pv_controle; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.pv_controle TO anon;
GRANT ALL ON TABLE public.pv_controle TO authenticated;
GRANT ALL ON TABLE public.pv_controle TO service_role;


--
-- Name: TABLE quarantaines; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.quarantaines TO anon;
GRANT ALL ON TABLE public.quarantaines TO authenticated;
GRANT ALL ON TABLE public.quarantaines TO service_role;


--
-- Name: TABLE rapports_8d; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.rapports_8d TO anon;
GRANT ALL ON TABLE public.rapports_8d TO authenticated;
GRANT ALL ON TABLE public.rapports_8d TO service_role;


--
-- Name: TABLE ref_prix_historique; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.ref_prix_historique TO anon;
GRANT ALL ON TABLE public.ref_prix_historique TO authenticated;
GRANT ALL ON TABLE public.ref_prix_historique TO service_role;


--
-- Name: TABLE references_clients; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.references_clients TO anon;
GRANT ALL ON TABLE public.references_clients TO authenticated;
GRANT ALL ON TABLE public.references_clients TO service_role;


--
-- Name: TABLE salaries; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.salaries TO anon;
GRANT ALL ON TABLE public.salaries TO authenticated;
GRANT ALL ON TABLE public.salaries TO service_role;


--
-- Name: TABLE sous_traitants; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sous_traitants TO anon;
GRANT ALL ON TABLE public.sous_traitants TO authenticated;
GRANT ALL ON TABLE public.sous_traitants TO service_role;


--
-- Name: TABLE stock; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.stock TO anon;
GRANT ALL ON TABLE public.stock TO authenticated;
GRANT ALL ON TABLE public.stock TO service_role;


--
-- Name: TABLE validations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.validations TO anon;
GRANT ALL ON TABLE public.validations TO authenticated;
GRANT ALL ON TABLE public.validations TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--




-- ═══════════════════════════════════════════════════════════════════════════
-- ERP : TABLES COMPLÉMENTAIRES (appendice au schéma pg_dump)
-- ---------------------------------------------------------------------------
-- Tables présentes dans le cloud/prod mais ABSENTES du miroir Docker local au
-- moment du pg_dump. Reconstituées ici depuis la source de vérité du code
-- (interfaces src/types.ts + payloads d'insert src/queries.ts/index.tsx) pour
-- qu'une VM neuve ait TOUT le schéma sans accès cloud.
-- Colonnes toutes nullable (sur-ensemble sûr : aucun insert de l'app ne casse),
-- id text PK avec fallback uuid, RLS permissive anon + grants (motif ERP).
-- Régénéré par le pipeline de dérivation ; ne pas éditer à la main.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.affaires (
  id text primary key default gen_random_uuid()::text,
  annee numeric,
  numero numeric
);
alter table public.affaires enable row level security;
drop policy if exists affaires_anon_all on public.affaires;
create policy affaires_anon_all on public.affaires for all to anon using (true) with check (true);
grant all on table public.affaires to anon;
grant all on table public.affaires to authenticated;
grant all on table public.affaires to service_role;

create table if not exists public.affectation_poste (
  id text primary key default gen_random_uuid()::text,
  operateur_id text,
  process_id text,
  date_affectation date,
  shift text,
  poste_nom text,
  operateur_nom text,
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.affectation_poste enable row level security;
drop policy if exists affectation_poste_anon_all on public.affectation_poste;
create policy affectation_poste_anon_all on public.affectation_poste for all to anon using (true) with check (true);
grant all on table public.affectation_poste to anon;
grant all on table public.affectation_poste to authenticated;
grant all on table public.affectation_poste to service_role;

create table if not exists public.audits (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz default now(),
  type_norme text,
  date_audit date,
  auditeur text,
  statut text,
  score numeric,
  nb_ecarts numeric,
  nb_observations numeric,
  prochain_audit date,
  observations text,
  conforme boolean
);
alter table public.audits enable row level security;
drop policy if exists audits_anon_all on public.audits;
create policy audits_anon_all on public.audits for all to anon using (true) with check (true);
grant all on table public.audits to anon;
grant all on table public.audits to authenticated;
grant all on table public.audits to service_role;

create table if not exists public.balancelles (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz default now(),
  num_session text,
  lot_id text,
  piece text,
  quantite numeric,
  bain_nom text,
  operateur_id text,
  date_entree date,
  date_sortie date,
  duree_min numeric,
  statut text,
  resultat text,
  observations text
);
alter table public.balancelles enable row level security;
drop policy if exists balancelles_anon_all on public.balancelles;
create policy balancelles_anon_all on public.balancelles for all to anon using (true) with check (true);
grant all on table public.balancelles to anon;
grant all on table public.balancelles to authenticated;
grant all on table public.balancelles to service_role;

create table if not exists public.bons_sous_traitance (
  id text primary key default gen_random_uuid()::text,
  cmd_ref text,
  lot_ref text,
  cmd_id text,
  lot_id text,
  client_nom text,
  piece text,
  operation text,
  qte numeric,
  sous_traitant_id text,
  statut text,
  priorite text,
  seq numeric,
  duree_days numeric,
  date_envoi date,
  date_debut date,
  date_retour_prevue date,
  date_retour_effective date,
  date_livraison date,
  predecesseur_fin date,
  couleur text,
  notes text,
  bc_id text,
  updated_at timestamptz default now()
);
alter table public.bons_sous_traitance enable row level security;
drop policy if exists bons_sous_traitance_anon_all on public.bons_sous_traitance;
create policy bons_sous_traitance_anon_all on public.bons_sous_traitance for all to anon using (true) with check (true);
grant all on table public.bons_sous_traitance to anon;
grant all on table public.bons_sous_traitance to authenticated;
grant all on table public.bons_sous_traitance to service_role;

create table if not exists public.commandes_prioritaires (
  id text primary key default gen_random_uuid()::text,
  num_affaire text,
  affaire_source text,
  nc_id text,
  client_nom text,
  ref_article text,
  designation text,
  qte numeric,
  cout_revient_unitaire numeric,
  prix_vente_unitaire numeric,
  montant_estime numeric,
  statut text,
  cmd_id text,
  created_at timestamptz default now()
);
alter table public.commandes_prioritaires enable row level security;
drop policy if exists commandes_prioritaires_anon_all on public.commandes_prioritaires;
create policy commandes_prioritaires_anon_all on public.commandes_prioritaires for all to anon using (true) with check (true);
grant all on table public.commandes_prioritaires to anon;
grant all on table public.commandes_prioritaires to authenticated;
grant all on table public.commandes_prioritaires to service_role;

create table if not exists public.competences_operateur (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz default now(),
  salarie_id text,
  employe_nom text,
  operation text,
  activite text,
  niveau numeric,
  date_evaluation date,
  evaluateur text,
  notes text,
  updated_at timestamptz default now()
);
alter table public.competences_operateur enable row level security;
drop policy if exists competences_operateur_anon_all on public.competences_operateur;
create policy competences_operateur_anon_all on public.competences_operateur for all to anon using (true) with check (true);
grant all on table public.competences_operateur to anon;
grant all on table public.competences_operateur to authenticated;
grant all on table public.competences_operateur to service_role;

create table if not exists public.controles_cotes (
  id text primary key default gen_random_uuid()::text,
  machine_id text,
  machine_nom text,
  bdt_id text,
  piece text,
  cote text,
  nominale numeric,
  tol_min numeric,
  tol_max numeric,
  mesure numeric,
  ecart numeric,
  ecart_norm numeric,
  operateur_id text,
  operateur_nom text,
  controleur text,
  source text,
  ecme_id text,
  conforme boolean,
  date_controle timestamptz
);
alter table public.controles_cotes enable row level security;
drop policy if exists controles_cotes_anon_all on public.controles_cotes;
create policy controles_cotes_anon_all on public.controles_cotes for all to anon using (true) with check (true);
grant all on table public.controles_cotes to anon;
grant all on table public.controles_cotes to authenticated;
grant all on table public.controles_cotes to service_role;

create table if not exists public.demandes_prix_lignes (
  id text primary key default gen_random_uuid()::text,
  demande_prix_id numeric,
  reference text,
  designation text,
  quantite_estimee numeric,
  unite text,
  categorie text,
  commentaire text,
  created_at timestamptz default now()
);
alter table public.demandes_prix_lignes enable row level security;
drop policy if exists demandes_prix_lignes_anon_all on public.demandes_prix_lignes;
create policy demandes_prix_lignes_anon_all on public.demandes_prix_lignes for all to anon using (true) with check (true);
grant all on table public.demandes_prix_lignes to anon;
grant all on table public.demandes_prix_lignes to authenticated;
grant all on table public.demandes_prix_lignes to service_role;

create table if not exists public.demandes_prix_reponses (
  id text primary key default gen_random_uuid()::text,
  demande_prix_id text,
  ligne_id text,
  fournisseur_id text,
  fournisseur_nom text,
  prix_unitaire numeric,
  delai_jours numeric,
  validite_date date,
  commentaire text,
  date_reponse timestamptz,
  retenu boolean,
  created_at timestamptz default now()
);
alter table public.demandes_prix_reponses enable row level security;
drop policy if exists demandes_prix_reponses_anon_all on public.demandes_prix_reponses;
create policy demandes_prix_reponses_anon_all on public.demandes_prix_reponses for all to anon using (true) with check (true);
grant all on table public.demandes_prix_reponses to anon;
grant all on table public.demandes_prix_reponses to authenticated;
grant all on table public.demandes_prix_reponses to service_role;

create table if not exists public.demandes_site (
  id text primary key default gen_random_uuid()::text,
  nom text,
  prenom text,
  email text,
  telephone text,
  societe text,
  type_demande text,
  message text,
  statut text,
  priorite text,
  note_interne text,
  traite_par text,
  traite_le date,
  created_at timestamptz default now()
);
alter table public.demandes_site enable row level security;
drop policy if exists demandes_site_anon_all on public.demandes_site;
create policy demandes_site_anon_all on public.demandes_site for all to anon using (true) with check (true);
grant all on table public.demandes_site to anon;
grant all on table public.demandes_site to authenticated;
grant all on table public.demandes_site to service_role;

create table if not exists public.etudes_capabilite (
  id text primary key default gen_random_uuid()::text,
  type text,
  ressource_id text,
  ressource_nom text,
  caracteristique text,
  unite text,
  usl numeric,
  lsl numeric,
  cible numeric,
  nominale numeric,
  seuil numeric,
  production_totale numeric,
  mesures jsonb,
  n numeric,
  moyenne numeric,
  ecart_type numeric,
  cv numeric,
  cp numeric,
  cpk numeric,
  cpm numeric,
  dpmo numeric,
  niveau_sigma numeric,
  conforme_pct numeric,
  nc_pct numeric,
  verdict text,
  operateur text,
  notes text,
  date_etude date,
  created_at timestamptz default now()
);
alter table public.etudes_capabilite enable row level security;
drop policy if exists etudes_capabilite_anon_all on public.etudes_capabilite;
create policy etudes_capabilite_anon_all on public.etudes_capabilite for all to anon using (true) with check (true);
grant all on table public.etudes_capabilite to anon;
grant all on table public.etudes_capabilite to authenticated;
grant all on table public.etudes_capabilite to service_role;

create table if not exists public.fournitures_nomenclature (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz default now(),
  nomenclature_id text,
  type_fourniture text,
  designation text,
  ref_stock text,
  quantite_par_piece numeric,
  prix_unitaire numeric,
  prix_total_par_piece numeric,
  fournisseur text,
  categorie text,
  nb_par_tole numeric,
  qte_paquet numeric
);
alter table public.fournitures_nomenclature enable row level security;
drop policy if exists fournitures_nomenclature_anon_all on public.fournitures_nomenclature;
create policy fournitures_nomenclature_anon_all on public.fournitures_nomenclature for all to anon using (true) with check (true);
grant all on table public.fournitures_nomenclature to anon;
grant all on table public.fournitures_nomenclature to authenticated;
grant all on table public.fournitures_nomenclature to service_role;

create table if not exists public.habilitations (
  id text primary key default gen_random_uuid()::text,
  operateur_id text,
  certification text,
  date_obtention date,
  date_expiration date,
  statut text,
  critique boolean,
  created_at timestamptz default now()
);
alter table public.habilitations enable row level security;
drop policy if exists habilitations_anon_all on public.habilitations;
create policy habilitations_anon_all on public.habilitations for all to anon using (true) with check (true);
grant all on table public.habilitations to anon;
grant all on table public.habilitations to authenticated;
grant all on table public.habilitations to service_role;

create table if not exists public.interlocuteurs (
  id text primary key default gen_random_uuid()::text,
  entite_type text,
  entite_id text,
  nom text,
  fonction text,
  email text,
  telephone text,
  principal boolean,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.interlocuteurs enable row level security;
drop policy if exists interlocuteurs_anon_all on public.interlocuteurs;
create policy interlocuteurs_anon_all on public.interlocuteurs for all to anon using (true) with check (true);
grant all on table public.interlocuteurs to anon;
grant all on table public.interlocuteurs to authenticated;
grant all on table public.interlocuteurs to service_role;

create table if not exists public.machine_bdt_historique (
  id text primary key default gen_random_uuid()::text,
  bdt_id text,
  process_id text,
  machine_id text,
  operateur_id text,
  operateur_nom text,
  matricule text,
  action text,
  statut text,
  resultat text,
  debut_reel text,
  fin_reel text,
  temps_reel numeric,
  piece text,
  operation text,
  client_nom text,
  created_at timestamptz default now()
);
alter table public.machine_bdt_historique enable row level security;
drop policy if exists machine_bdt_historique_anon_all on public.machine_bdt_historique;
create policy machine_bdt_historique_anon_all on public.machine_bdt_historique for all to anon using (true) with check (true);
grant all on table public.machine_bdt_historique to anon;
grant all on table public.machine_bdt_historique to authenticated;
grant all on table public.machine_bdt_historique to service_role;

create table if not exists public.mtbf_machines (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz default now(),
  machine_id text,
  machine_nom text,
  machine_code text,
  periode_debut text,
  periode_fin text,
  heures_fonctionnement numeric,
  nb_pannes numeric,
  mtbf_h numeric,
  mttr_h numeric,
  disponibilite_pct numeric,
  cout_maintenance numeric,
  statut_machine text
);
alter table public.mtbf_machines enable row level security;
drop policy if exists mtbf_machines_anon_all on public.mtbf_machines;
create policy mtbf_machines_anon_all on public.mtbf_machines for all to anon using (true) with check (true);
grant all on table public.mtbf_machines to anon;
grant all on table public.mtbf_machines to authenticated;
grant all on table public.mtbf_machines to service_role;

create table if not exists public.operateur_bdt_historique (
  id text primary key default gen_random_uuid()::text,
  bdt_id text,
  process_id text,
  machine_id text,
  operateur_id text,
  operateur_nom text,
  matricule text,
  action text,
  statut text,
  resultat text,
  debut_reel text,
  fin_reel text,
  temps_reel numeric,
  piece text,
  operation text,
  client_nom text,
  created_at timestamptz default now()
);
alter table public.operateur_bdt_historique enable row level security;
drop policy if exists operateur_bdt_historique_anon_all on public.operateur_bdt_historique;
create policy operateur_bdt_historique_anon_all on public.operateur_bdt_historique for all to anon using (true) with check (true);
grant all on table public.operateur_bdt_historique to anon;
grant all on table public.operateur_bdt_historique to authenticated;
grant all on table public.operateur_bdt_historique to service_role;

create table if not exists public.operateur_presence (
  id text primary key default gen_random_uuid()::text,
  operateur_id text,
  operateur_nom text,
  activite text,
  date_presence date,
  shift text,
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.operateur_presence enable row level security;
drop policy if exists operateur_presence_anon_all on public.operateur_presence;
create policy operateur_presence_anon_all on public.operateur_presence for all to anon using (true) with check (true);
grant all on table public.operateur_presence to anon;
grant all on table public.operateur_presence to authenticated;
grant all on table public.operateur_presence to service_role;

create table if not exists public.produits_perissables (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz default now(),
  nom text,
  reference text,
  fournisseur text,
  date_ouverture date,
  date_expiration date,
  duree_vie_jours numeric,
  statut text,
  quantite numeric,
  unite text,
  emplacement text,
  observations text,
  code_produit text,
  date_reception date,
  delai_appro text,
  date_alerte date,
  lieu_utilisation text,
  n_commande_fournisseur text,
  n_lot_fournisseur text,
  qte_initiale numeric,
  fournisseur_id text
);
alter table public.produits_perissables enable row level security;
drop policy if exists produits_perissables_anon_all on public.produits_perissables;
create policy produits_perissables_anon_all on public.produits_perissables for all to anon using (true) with check (true);
grant all on table public.produits_perissables to anon;
grant all on table public.produits_perissables to authenticated;
grant all on table public.produits_perissables to service_role;

create table if not exists public.releves_bains (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz default now(),
  date_releve date,
  bain_nom text,
  operateur_id text,
  ph numeric,
  temperature numeric,
  concentration_gl numeric,
  densite numeric,
  titrage_acide numeric,
  titrage_alu numeric,
  conductivite numeric,
  observations text,
  conforme boolean
);
alter table public.releves_bains enable row level security;
drop policy if exists releves_bains_anon_all on public.releves_bains;
create policy releves_bains_anon_all on public.releves_bains for all to anon using (true) with check (true);
grant all on table public.releves_bains to anon;
grant all on table public.releves_bains to authenticated;
grant all on table public.releves_bains to service_role;

create table if not exists public.releves_eau (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz default now(),
  date_releve date,
  operateur_id text,
  volume_m3 numeric,
  ph numeric,
  temperature numeric,
  turbidite numeric,
  chlore numeric,
  observations text,
  conforme boolean
);
alter table public.releves_eau enable row level security;
drop policy if exists releves_eau_anon_all on public.releves_eau;
create policy releves_eau_anon_all on public.releves_eau for all to anon using (true) with check (true);
grant all on table public.releves_eau to anon;
grant all on table public.releves_eau to authenticated;
grant all on table public.releves_eau to service_role;

create table if not exists public.shifts (
  id text primary key default gen_random_uuid()::text,
  label text,
  start_h numeric,
  end_h numeric,
  color text,
  icon text
);
alter table public.shifts enable row level security;
drop policy if exists shifts_anon_all on public.shifts;
create policy shifts_anon_all on public.shifts for all to anon using (true) with check (true);
grant all on table public.shifts to anon;
grant all on table public.shifts to authenticated;
grant all on table public.shifts to service_role;

-- preparations_techniques (DDL versionnée offre_cascade_schema.sql) + colonnes liées
create table if not exists public.preparations_techniques (
  id text primary key, num_affaire text, dt_ref text, cmd_ref text,
  code_ref_produit text, piece text, type text default 'nouvelle',
  manque_code_cnc boolean default false, manque_plan boolean default false,
  statut text default 'a_faire', responsable text, echeance date,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.preparations_techniques enable row level security;
drop policy if exists prep_all on public.preparations_techniques;
create policy prep_all on public.preparations_techniques for all to anon using (true) with check (true);
grant all on table public.preparations_techniques to anon;
grant all on table public.preparations_techniques to authenticated;
grant all on table public.preparations_techniques to service_role;

-- Colonnes ajoutées par offre_cascade (porte « matière reçue ») — idempotent
alter table public.demandes_achat   add column if not exists num_affaire text;
alter table public.demandes_achat   add column if not exists cmd_ref     text;
alter table public.bons_de_commande add column if not exists num_affaire text;
alter table public.bons_de_commande add column if not exists cmd_ref     text;
alter table public.bons_de_commande add column if not exists date_livraison_initiale date;
alter table public.bons_de_commande add column if not exists date_reception_reelle   date;

-- Retour client annonce en Qualite (NC) -> receptionne en Expeditions (BL type 'retour_client')
alter table public.non_conformites add column if not exists retour_attendu      boolean default false;
alter table public.non_conformites add column if not exists qte_retour_attendue numeric;
alter table public.non_conformites add column if not exists date_retour_prevue  text;
alter table public.non_conformites add column if not exists retour_statut       text;
alter table public.non_conformites add column if not exists bl_retour_id        text;
alter table public.non_conformites add column if not exists date_retour_reelle  text;
alter table public.bons_de_livraison add column if not exists nc_id text;

notify pgrst, 'reload schema';
