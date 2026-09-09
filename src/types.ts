// ══════════════════════════════════════════════════════════════
// TYPES – ERP Seem Semrac v2.0
// Interfaces TypeScript calquées sur le schéma Supabase
// ══════════════════════════════════════════════════════════════

export type Priorite = 'normal' | 'urgent' | 'critique'
export type Activite = 'Seem' | 'Semrac' | 'both' | 'ST'

export interface Shift {
  id: string
  label: string
  start_h: number
  end_h: number
  color: string
  icon: string
}

export interface Client {
  id: string
  nom: string
  contact?: string
  poste?: string
  email?: string
  tel?: string
  adresse?: string
  adresse_rue?: string
  adresse_cp?: string
  adresse_ville?: string
  facturation_differente?: boolean
  fact_rue?: string
  fact_cp?: string
  fact_ville?: string
  credits: number
  credit_montant: number
  mode_facturation?: string
  siret?: string
  created_at?: string
}

export interface Operateur {
  id: string
  nom: string
  prenom?: string
  activite: Activite
  poste?: string
  shift_id?: string
  competences: string[]
  habilitations: string[]
  niveau: Record<string, unknown>
  actif: boolean
  created_at?: string
}

export interface Machine {
  id: string
  nom: string
  code: string
  activite: Activite
  categorie?: string
  operations: string[]
  shift_id?: string
  capacite_h: number
  statut: 'operationnel' | 'maintenance' | 'arret'
  couleur?: string
  created_at?: string
}

export interface Absence {
  id: string
  operateur_id: string
  type: string
  date_absence: string
  created_at?: string
}

export interface PieceDT {
  ref_interne: string
  nom_plan?: string
  ref_client?: string
  quantite: number
  matiere?: string
  traitement?: string
  oxydation_anodique?: boolean
  oxydation_noire?: boolean
  exigences?: string[]
  notes?: string
  // Si true → pas besoin de nomenclature pour cette pièce (déjà à jour)
  piece_existante_a_jour?: boolean
  nomenclature_id?: string
  // Champs renseignés par le BE lors de l'analyse DT
  cout_matiere?: number
  cout_mo?: number
  cout_st?: number
  cout_fg?: number
  marge_pct?: number
  cru?: number
  prix_vente?: number
  temps_unitaire_min?: number
  gamme_operatoire?: string
}

export interface DemandeTravaux {
  id: string
  num_affaire: string
  affaire_id?: string
  client_id?: string
  client_nom?: string
  pieces: string[]
  pieces_detail?: PieceDT[]
  type_dt?: string
  statut: string
  activite?: Activite
  priorite: Priorite
  analyste?: string
  budget?: number
  date_dt: string
  delai?: string
  contact?: string
  montant: number
  cahier_charges?: string[]
  commercial_id?: string
  contact_client_id?: string
  created_at?: string
  updated_at?: string
}

export interface Offre {
  id: string
  num_affaire: string
  dt_ref?: string
  client_id?: string
  client_nom?: string
  pieces: string[]
  montant: number
  marge?: number
  date_offre: string
  validite?: string
  statut: string
  version?: number
  motif_negociation?: string
  vendeur?: string
  has_st: boolean
  rep?: string
  created_at?: string
  updated_at?: string
}

export interface Commande {
  id: string
  num_affaire: string
  client_id?: string
  client_nom?: string
  offre_id?: string
  pieces: string[]
  montant: number
  date_cmd: string
  date_liv?: string
  activite?: Activite
  statut: string
  has_st: boolean
  bdt_total: number
  bdt_soldes: number
  retard: boolean
  created_at?: string
  updated_at?: string
}

export interface Lot {
  id: string
  cmd_id?: string
  client_nom?: string
  piece?: string
  qte?: number
  statut: string
  date_debut?: string
  date_fin?: string
  created_at?: string
}

export interface BonDeTravail {
  id: string
  operateur_id?: string
  machine_id?: string
  cmd_id?: string
  lot_id?: string
  num_affaire?: string
  client_nom?: string
  piece: string
  operation: string
  duree: number
  debut?: number
  priorite: Priorite
  statut: string
  activite?: Activite
  baseline?: string
  matiere_ok: boolean
  pv_requis: boolean
  temps_alloue?: number
  temps_reel?: number
  temps_machine_alloue?: number
  created_at?: string
  updated_at?: string
}

export interface Credit {
  id: string
  client_id?: string
  client_nom?: string
  motif: string
  montant: number
  solde: number
  date_credit: string
  statut: 'actif' | 'partiel' | 'cloture'
  vendeur?: string
  saisi_par?: string
  created_at?: string
  updated_at?: string
}

export interface DemandeAchat {
  id: string
  demandeur?: string
  type_da?: string
  article: string
  fournisseur?: string
  qte?: string
  priorite: Priorite
  statut: string
  date_da: string
  livraison?: string
  created_at?: string
  updated_at?: string
}

export interface NonConformite {
  id: string
  date_nc: string
  type_nc: string
  lot_ref?: string
  client_nom?: string
  gravite: 'Mineure' | 'Majeure' | 'Critique' | 'Bloquante'
  statut: string
  detecteur?: string
  operation?: string
  categorie?: 'administratif' | 'operation'
  entite?: 'Seem' | 'Semrac'
  created_at?: string
  updated_at?: string
}

export interface BonDeLivraison {
  id: string
  cmd_id?: string
  client_nom?: string
  date_bl: string
  qte: number
  statut: string
  transport?: string
  otd?: string
  created_at?: string
  updated_at?: string
  type_bl?: 'client' | 'bst'
  fournisseur_st_id?: string
  date_envoi_prevu?: string
  lot_id?: string
  piece?: string
  operation?: string
}

export interface BonDeCommande {
  id: string
  created_at?: string
  updated_at?: string
  num_bc?: string
  type: 'fournisseur' | 'st'
  fournisseur?: string
  fournisseur_st_id?: string
  da_id?: string
  articles?: string
  montant?: number
  date_bc: string
  date_livraison_prevue?: string
  date_livraison?: string
  statut: 'brouillon' | 'envoye' | 'confirme' | 'recu' | 'recu_partiel' | 'recu_total' | 'cloture'
  notes?: string
  pv_id?: string
  bl_id?: string
  accuse_fournisseur_le?: string
  date_relance?: string
  qte_commandee?: number
  qte_recue?: number
  fournisseur_nom?: string
  sous_traitant_id?: string
  transporteur?: string
  transporteur_ref?: string
}

export interface Habilitation {
  id: string
  operateur_id?: string
  certification: string
  date_obtention?: string
  date_expiration?: string
  statut: 'valide' | 'expire' | 'a_renouveler'
  critique: boolean
  created_at?: string
}

export interface FournisseurSt {
  id: string
  nom: string
  operation?: string
  localisation?: string
  qualification?: string
  statut: 'actif' | 'suspendu' | 'en_evaluation'
  otd?: number
  scoring?: number
  created_at?: string
}

export interface DemandeSite {
  id: string
  nom: string
  prenom?: string
  email: string
  telephone?: string
  societe?: string
  type_demande: string
  message: string
  statut: 'nouveau' | 'en_cours' | 'traite' | 'archive'
  priorite: 'normal' | 'urgent' | 'critique'
  note_interne?: string
  traite_par?: string
  traite_le?: string
  created_at: string
}

export interface Balancelle {
  id: string
  created_at?: string
  num_session: string
  lot_id?: string
  piece?: string
  quantite?: number
  bain_nom?: string
  operateur_id?: string
  date_entree: string
  date_sortie?: string
  duree_min?: number
  statut: 'en_cours' | 'termine' | 'annule'
  resultat?: 'conforme' | 'non_conforme' | 'a_verifier'
  observations?: string
}

export interface ReleveEau {
  id: string
  created_at?: string
  date_releve: string
  operateur_id?: string
  volume_m3?: number
  ph?: number
  temperature?: number
  turbidite?: number
  chlore?: number
  observations?: string
  conforme?: boolean
}

export interface PVControle {
  id: string
  created_at?: string
  num_pv?: string
  date_pv: string
  operateur_id?: string
  type_controle?: 'autocontrole' | 'intermediaire' | 'final' | 'reception'
  type_lien?: 'lot' | 'livraison'
  lot_id?: string
  bl_id?: string
  piece?: string
  client_nom?: string
  statut: 'en_cours' | 'valide' | 'refuse' | 'nc_ouverte'
  cp?: number
  cpk?: number
  decision?: 'libere' | 'libere_derogation' | 'bloque'
  observations?: string
  nc_ouverte?: boolean
}

export interface Quarantaine {
  id: string
  created_at?: string
  lot_id?: string
  piece?: string
  client_nom?: string
  date_mise_quarantaine: string
  motif?: string
  pv_id?: string
  nc_id?: string
  statut: 'en_cours' | 'en_validation' | 'libere' | 'rejete'
  libere_par?: string
  libere_le?: string
  duree_jours?: number
}

export interface Audit {
  id: string
  created_at?: string
  type_norme: 'ISO 9001' | 'EN 9100' | string
  date_audit?: string
  auditeur?: string
  statut: 'planifie' | 'en_cours' | 'realise' | 'cloture'
  score?: number
  nb_ecarts?: number
  nb_observations?: number
  prochain_audit?: string
  observations?: string
  conforme?: boolean
}

// ── Module Audits de conformité (SMI QSE + SI) ──
export interface AuditProgramme {
  id: string
  created_at?: string
  exercice?: number
  type?: 'process' | 'poste' | 'flash' | 'procede' | 'client' | string
  entite_auditee?: string
  famille?: 'PILOTAGE' | 'REALISATION' | 'SUPPORT' | string
  perimetre?: string
  themes?: string                 // CSV codes ('A,I,J,K' ou 'T1,T2,...')
  themes_transverses?: string
  referentiels?: string           // CSV ('9001,9100,45001,14001,27001')
  trimestre?: number
  date_cible?: string
  temps_estime_min?: number
  auditeur?: string
  auditeur_2?: string
  audite_principal?: string
  statut?: 'a_planifier' | 'planifie' | 'realise' | 'rapport_envoye' | 'retour_recu' | 'cloture' | string
  date_realisation?: string
  date_rapport?: string
  date_retour_audite?: string
  plan_action_solde?: boolean
  date_cloture?: string
  grille_id?: string
  rapport_url?: string
  reponses?: any                  // [{question_id, etat:'C'|'NC'|'AXE', preuve, nc_id}]
  constat?: string
  non_conformite?: string
  axe_amelioration?: string
  observations?: string
}
export interface AuditGrille {
  id: string
  created_at?: string
  titre: string
  cible?: 'poste' | 'process' | 'procede' | string
  referentiel?: string
  version?: number
  active?: boolean
  description?: string
}
export interface AuditQuestion {
  id: string
  created_at?: string
  grille_id: string
  ordre?: number
  section?: string
  theme_code?: string
  clause_ref?: string
  libelle: string
  preuve_attendue?: string
  mode?: 'auto' | 'assiste' | 'manuel' | string
  sonde?: string
}
export interface Fai {
  id: string
  created_at?: string
  nomenclature_id?: string
  num_nom?: string
  indice?: string
  commande_ref?: string
  type?: 'complet' | 'partiel' | 'delta' | string
  statut?: 'a_faire' | 'en_cours' | 'valide' | 'refuse' | string
  date_realisation?: string
  realise_par?: string
  conforme?: boolean
  caracteristiques?: any
  rapport_url?: string
  observations?: string
}

export interface ProduitPerissable {
  id: string
  created_at?: string
  nom: string
  reference?: string
  fournisseur?: string
  date_ouverture?: string
  date_expiration?: string
  duree_vie_jours?: number
  statut: 'valide' | 'expire' | 'a_renouveler' | 'archive'
  quantite?: number
  unite?: string
  emplacement?: string
  observations?: string
  // Suivi par lot (PRA2-D1)
  code_produit?: string
  date_reception?: string
  delai_appro?: string
  date_alerte?: string
  lieu_utilisation?: string
  n_commande_fournisseur?: string
  n_lot_fournisseur?: string
  qte_initiale?: number
}

export interface MouvementPerissable {
  id?: number
  perissable_id?: string
  date_sortie?: string
  qte_sortie?: number
  n_commande_client?: string
  motif?: string
  inventaire_apres?: number
  created_at?: string
}

// ─── STOCK ────────────────────────────────────────────────────

export type StatutStock = 'critique' | 'bas' | 'moyen' | 'haut'
export type CategorieStock = 'matiere_premiere' | 'consommable' | 'chimique' | 'emballage' | 'securite' | 'outillage' | 'piece_rechange'

export interface ArticleStock {
  id: string
  created_at?: string
  updated_at?: string
  nom: string
  reference?: string
  categorie: CategorieStock
  activite: 'Seem' | 'Semrac' | 'both'
  fournisseur?: string
  unite: string
  quantite: number
  seuil_mini: number
  point_commande: number
  seuil_maxi: number
  qte_commande?: number
  prix_unitaire?: number
  delai_fournisseur?: number
  emplacement?: string
  derniere_entree?: string
  dernier_mouvement?: string
  consommation_mensuelle?: number
}

export interface MouvementStock {
  id: string
  created_at?: string
  article_id: string
  article_nom?: string
  type: 'entree' | 'sortie' | 'ajustement' | 'inventaire'
  quantite: number
  quantite_avant?: number
  quantite_apres?: number
  date_mvt: string
  motif?: string
  operateur?: string
  cmd_id?: string
  lot_id?: string
  da_id?: string
  bl_id?: string
}

// ─── MAINTENANCE (GMAO) ───────────────────────────────────────

export interface OrdreMaintenance {
  id: string
  created_at?: string
  updated_at?: string
  num_om?: string
  type: 'correctif' | 'preventif' | 'amelioratif' | 'vgp' | 'inspection'
  machine_id?: string
  machine_nom?: string
  titre: string
  description?: string
  priorite: 'normal' | 'urgent' | 'critique'
  statut: 'ouvert' | 'en_cours' | 'en_attente' | 'termine' | 'annule'
  responsable?: string
  intervenant?: string
  date_signalement?: string
  date_prevue?: string
  date_debut?: string
  date_fin?: string
  duree_h?: number
  cout_estime?: number
  cout_reel?: number
  pieces_utilisees?: string
  observations?: string
  cause_racine?: string
  action_preventive?: string
}

export interface PlanPreventif {
  id: string
  created_at?: string
  machine_id?: string
  machine_nom: string
  intitule: string
  type: 'hebdo' | 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel' | 'vgp'
  frequence_jours?: number
  responsable?: string
  dernier_fait?: string
  prochain_prevu?: string
  duree_h?: number
  instructions?: string
  actif: boolean
  cout_estime?: number
}

export interface MtbfMachine {
  id: string
  created_at?: string
  machine_id: string
  machine_nom: string
  machine_code?: string
  periode_debut?: string
  periode_fin?: string
  heures_fonctionnement: number
  nb_pannes: number
  mtbf_h?: number
  mttr_h?: number
  disponibilite_pct?: number
  cout_maintenance: number
  statut_machine: 'operationnel' | 'maintenance' | 'arret'
}

// ─── NOMENCLATURE ────────────────────────────────────────────

export interface EtapeProduction {
  ordre: number
  nom: string
  type: 'interne' | 'sous_traite'
  machine_id?: string
  machine_nom?: string
  machine_taux_h?: number
  temps_reglage_min: number             // ROP — réglage opérateur (minutes)
  temps_reglage_machine_min?: number    // RGM — réglage machine (minutes)
  temps_unitaire_min: number
  temps_mo_min?: number
  temps_machine_min?: number
  taux_mo_h?: number
  fournisseur_st_id?: string
  fournisseur_st_nom?: string
  cout_st_unitaire?: number
  // Prépa technique : n° + fichier programme CN (FAO) rattaché à l'étape machine
  programme?: string
  programme_fichier?: string
  process_id?: string
  process_nom?: string
  ressource?: string
  est_oas?: boolean
  oas_avant?: boolean
  oas_apres?: boolean
  // Étapes importées (temps en millièmes d'heure)
  temps_variable_mille?: number
  temps_reglage_mille?: number          // historique : réglage unique, imputé à la ressource de l'étape
  temps_reglage_op_mille?: number       // ROP — réglage opérateur, imputé au taux MO
  temps_reglage_machine_mille?: number  // RGM — réglage machine, imputé au taux machine
  est_fixe?: boolean
}

export interface Nomenclature {
  id: string
  created_at?: string
  updated_at?: string
  num_nom?: string
  num_affaire?: string
  lot_id?: string
  code_ref_produit?: string
  description?: string
  statut: 'brouillon' | 'en_cours' | 'valide'
  entite?: string
  type_nom?: string
  indice?: string
  version_groupe?: string
  num_plan?: string          // n° de plan client (texte affiché, ex: "PL-138001 ind. A")
  plan_fichier?: string      // nom du fichier CAO (désignation lisible)
  plan_num?: string          // n° de plan (base) — recherche / classification (Phase 2)
  plan_indice?: string       // indice du plan client
  surface_totale_dm2?: number
  masse_kg?: number
  dimensions?: string
  temps_matiere_h?: number
  temps_machine_h?: number
  temps_reglage_total_min?: number
  temps_unitaire_total_min?: number
  taux_mo?: number
  cout_machine_h?: number
  prix_mo_unitaire?: number
  cout_machine_unitaire?: number
  prix_revient_unitaire?: number
  etapes_production?: EtapeProduction[]
  notes?: string
  cree_par?: string
  valide_par?: string
  date_validation?: string
}

export interface FournitureNomenclature {
  id: string
  created_at?: string
  nomenclature_id?: string
  type_fourniture?: string
  categorie?: string        // 'matiere' | 'accessoire'
  designation?: string
  ref_stock?: string
  quantite_par_piece?: number
  nb_par_tole?: number      // matière : nb pièces par tôle
  qte_paquet?: number       // accessoire : qté contenue dans un paquet
  prix_unitaire?: number    // matière : prix tôle ; accessoire : prix paquet
  prix_total_par_piece?: number
  fournisseur?: string
}

// ─── GED (documents rattachés : plans clients, plans CAO, programmes FAO) ──
export interface Document {
  id: string
  categorie: 'plan_client' | 'plan_cao' | 'programme_fao' | 'analyse_dt' | 'autre'
  nomenclature_id?: string    // lien souple : id de nomenclature, OU id de DT pour les documents d'analyse (categorie 'analyse_dt')
  version_groupe?: string
  etape_ordre?: number       // FAO rattaché à une étape machine (sinon absent)
  fichier_nom: string
  storage_path: string
  mime?: string
  taille?: number
  plan_num?: string
  plan_indice?: string
  uploaded_par?: string
  uploaded_at?: string
  actif?: boolean
}

// ─── RH ───────────────────────────────────────────────────────

export interface Employe {
  id: string
  created_at?: string
  updated_at?: string
  matricule?: string
  nom: string
  prenom?: string
  date_naissance?: string
  date_embauche?: string
  date_fin_contrat?: string
  type_contrat?: 'CDI' | 'CDD' | 'Apprenti' | 'Interim' | 'Stage'
  statut: 'actif' | 'conge' | 'arret' | 'quitte'
  activite?: Activite
  poste?: string
  service?: string
  shift_id?: string
  taux_horaire?: number
  email?: string
  telephone?: string
  adresse?: string
  urgence_contact?: string
  urgence_tel?: string
  notes?: string
}

export interface Certification {
  id: string
  created_at?: string
  employe_id?: string
  employe_nom?: string
  type: 'habilitation' | 'diplome' | 'certification' | 'formation'
  intitule: string
  organisme?: string
  date_obtention?: string
  date_expiration?: string
  statut: 'valide' | 'expire' | 'a_renouveler'
  critique: boolean
  notes?: string
}

export interface CompetenceOperateur {
  id: string
  created_at?: string
  employe_id?: string
  employe_nom?: string
  operation: string
  activite?: Activite
  niveau: number
  date_evaluation?: string
  evaluateur?: string
  notes?: string
}

export interface Pointage {
  id: string
  created_at?: string
  updated_at?: string
  employe_id?: string
  employe_nom?: string
  date_pointage: string
  heure_arrivee?: string
  heure_depart?: string
  pause_min?: number
  heures_travaillees?: number
  type: 'normal' | 'heures_sup' | 'conge' | 'maladie' | 'formation' | 'deplacement'
  statut: 'brouillon' | 'valide' | 'corrige'
  valide_par?: string
  correction_motif?: string
  notes?: string
}

// ─── COMPTABILITÉ ────────────────────────────────────────────

export interface FactureClient {
  id: string
  created_at?: string
  updated_at?: string
  num_facture?: string
  client_nom?: string
  num_affaire?: string
  date_facture: string
  date_echeance?: string
  montant_ht: number
  tva_pct?: number
  montant_tva?: number
  montant_ttc: number
  statut: 'brouillon' | 'envoyee' | 'partiellement_payee' | 'payee' | 'en_retard' | 'litige'
  date_paiement?: string
  mode_paiement?: string
  relance_count?: number
  derniere_relance?: string
  notes?: string
}

export interface FactureFournisseur {
  id: string
  created_at?: string
  updated_at?: string
  num_facture?: string
  type: 'fournisseur' | 'sous_traitant'
  fournisseur_nom?: string
  date_facture: string
  date_echeance?: string
  montant_ht: number
  tva_pct?: number
  montant_tva?: number
  montant_ttc: number
  statut: 'a_valider' | 'validee' | 'a_payer' | 'payee' | 'litige'
  date_paiement?: string
  mode_paiement?: string
  compte_charge?: string
  notes?: string
}

export interface EcritureComptable {
  id: string
  created_at?: string
  date_ecriture: string
  journal: 'VTE' | 'ACH' | 'BQ' | 'OD' | 'SAL'
  piece?: string
  compte: string
  libelle?: string
  debit: number
  credit: number
  lettrage?: string
  saisi_par?: string
  valide: boolean
}

export interface ReleveBain {
  id: string
  created_at?: string
  date_releve: string
  bain_nom: 'Principal OAS' | 'Rinçage 1' | 'Rinçage 2' | 'Neutralisation'
  operateur_id?: string
  ph?: number
  temperature?: number
  concentration_gl?: number
  densite?: number
  titrage_acide?: number
  titrage_alu?: number
  conductivite?: number
  observations?: string
  conforme?: boolean
}

// ══════════════════════════════════════════════════════════════
// MODULE SÉCURITÉ (HSE / RSE) — tables hse_*
// ══════════════════════════════════════════════════════════════

// DUER — recensement des dangers / évaluation des risques
export interface HseRisque {
  id?: string
  entite?: string
  unite_travail?: string
  zone?: string
  danger?: string
  situation?: string
  risque?: string
  gravite?: number
  frequence?: number
  maitrise?: number
  criticite?: number
  mesures_existantes?: string
  mesures_prevues?: string
  responsable?: string
  echeance?: string
  statut?: string
  created_at?: string
}

// Accidents / presqu'accidents / maladies professionnelles
export interface HseIncident {
  id?: string
  entite?: string
  type?: string
  date_incident?: string
  heure?: string
  salarie_id?: string
  salarie_nom?: string
  zone?: string
  poste?: string
  partie_corps?: string
  nature_lesion?: string
  gravite?: string
  avec_arret?: boolean
  jours_arret?: number
  temoins?: string
  description?: string
  premiers_secours?: string
  declaration_cpam_date?: string
  analyse_causes?: string
  actions_correctives?: string
  responsable?: string
  statut?: string
  date_cloture?: string
  created_at?: string
}

// Catalogue EPI
export interface HseEpiCatalogue {
  id?: string
  entite?: string
  nom?: string
  categorie?: string
  norme_en?: string
  duree_vie_mois?: number
  ref_stock?: string
  fournisseur?: string
  notes?: string
  created_at?: string
}

// Dotation EPI nominative
export interface HseEpiDotation {
  id?: string
  entite?: string
  salarie_id?: string
  salarie_nom?: string
  epi_id?: string
  epi_nom?: string
  taille?: string
  quantite?: number
  date_remise?: string
  date_peremption?: string
  signature?: boolean
  statut?: string
  created_at?: string
}

// Produit chimique / FDS
export interface HseProduitChimique {
  id?: string
  entite?: string
  nom?: string
  fournisseur_id?: string
  fournisseur_nom?: string
  ref_stock?: string
  cas?: string
  fds_ref?: string
  fds_url?: string
  fds_date?: string
  etat?: string
  pictogrammes?: string[]
  mentions_danger?: string[]
  cmr?: string
  vlep?: string
  zone_stockage?: string
  retention?: boolean
  compatibilites?: string
  quantite?: number
  unite?: string
  statut?: string
  created_at?: string
}

// Registre des déchets (BSDD / Trackdéchets)
export interface HseDechet {
  id?: string
  entite?: string
  date_dechet?: string
  code_dechet?: string
  designation?: string
  dangereux?: boolean
  quantite?: number
  unite?: string
  zone_producteur?: string
  filiere?: string
  transporteur?: string
  exutoire?: string
  bsdd_num?: string
  trackdechets_id?: string
  statut?: string
  created_at?: string
}

// Mesure environnementale (eau / air / bruit / énergie)
export interface HseMesureEnv {
  id?: string
  entite?: string
  type?: string
  date_mesure?: string
  point_mesure?: string
  parametre?: string
  valeur?: number
  unite?: string
  vle?: number
  conforme?: boolean
  organisme?: string
  observations?: string
  created_at?: string
}

// Zone ATEX
export interface HseAtexZone {
  id?: string
  entite?: string
  nom?: string
  type_zone?: string
  localisation?: string
  origine_risque?: string
  substances?: string
  materiel_requis?: string
  mesures?: string
  date_revue?: string
  created_at?: string
}

// Vérification générale périodique (VGP)
export interface HseVerification {
  id?: string
  entite?: string
  type?: string
  equipement?: string
  machine_id?: string
  organisme?: string
  date_controle?: string
  date_prochaine?: string
  periodicite_mois?: number
  resultat?: string
  levee_reserves?: string
  rapport_url?: string
  statut?: string
  created_at?: string
}

// Matrice des formations requises
export interface HseFormationRequise {
  id?: string
  entite?: string
  poste?: string
  formation?: string
  obligatoire?: boolean
  periodicite_mois?: number
  created_at?: string
}

// Exercice d'évacuation / incendie
export interface HseExercice {
  id?: string
  entite?: string
  type?: string
  date_exercice?: string
  site?: string
  nb_participants?: number
  duree_min?: number
  scenario?: string
  observations?: string
  conforme?: boolean
  created_at?: string
}

// Plan de prévention / protocole / permis de feu
export interface HsePlanPrevention {
  id?: string
  entite?: string
  type?: string
  entreprise_exterieure?: string
  operation?: string
  date_debut?: string
  date_fin?: string
  risques?: string
  mesures?: string
  signataires?: string
  valide_par?: string
  statut?: string
  created_at?: string
}

// Indicateur RSE
export interface HseRseIndicateur {
  id?: string
  entite?: string
  periode?: string
  categorie?: string
  code?: string
  libelle?: string
  valeur?: number
  unite?: string
  cible?: number
  created_at?: string
}

// Matrice de conformité réglementaire
export interface HseConformite {
  id?: string
  entite?: string
  domaine?: string
  obligation?: string
  reference_reglementaire?: string
  applicable?: boolean
  statut?: string
  date_dernier_controle?: string
  date_echeance?: string
  responsable?: string
  preuve_url?: string
  observations?: string
  created_at?: string
}
