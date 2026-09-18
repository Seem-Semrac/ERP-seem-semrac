// ══════════════════════════════════════════════════════════════
// BUREAU D'ÉTUDES – ERP Seem Semrac v2.0
// Nomenclatures · Analyse DT · Prépa technique · Dashboard
// ══════════════════════════════════════════════════════════════
import { escX, layout, pageHeader, serviceHeader, bulkToolbar, bulkSelectAssets, PRIX_VALIDITE_JOURS, composantsDe, prixMoyenClientJs, qtePaquetDe } from './shared'
import type { DemandeTravaux, Commande, Nomenclature, Offre } from './types'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

// ─── COÛT D'UNE ÉTAPE CÔTÉ NAVIGATEUR — MIROIR EXACT de etapeDecomp (src/shared.ts) ─────────────
// Coût horaire porté par le PROCESS (14/09/2026). Source JS UNIQUE, injectée telle quelle dans la page
// BE (formulaire nomenclature) ET dans la page /be/analyse (étapes ajoutées) : aucune troisième copie.
// Parité vérifiée par un test qui confronte beEtapeDecomp à etapeDecomp serveur (écart < 0,01 €).
//   beTauxAtelierClient(refs) : équivalent navigateur de construireTauxAtelier, bâti sur les référentiels
//     déjà résolus par le serveur (getBeRefs) — process_atelier[] { id, type, taux_machine, taux_source,
//     machine_id, statut } et taux_homme { moyen, seem, semrac, manquant } (MOYENNES seulement).
//   beEtapeDecomp(e, tx, site) : classement ROP / RGM / THV / TMV, formats minutes ET millièmes, OAS / ST.
// ⚠ Chaîne JS brute : ni accent grave, ni dollar-accolade, ni barre oblique inverse, ni apostrophe
//   dans les chaînes (elle est injectée dans deux gabarits TSX).
export const BE_ETAPE_COUT_JS = `
function beTauxAtelierClient(refs){
  var procs = (refs && Array.isArray(refs.process_atelier)) ? refs.process_atelier : [];
  var th = (refs && refs.taux_homme && typeof refs.taux_homme === "object") ? refs.taux_homme : null;
  var vide = function(v){ return v == null || v === ""; };
  var cle = function(s){ return String(s == null ? "" : s).trim().toLowerCase(); };
  var nbOuNull = function(v){ if (vide(v)) return null; var n = Number(v); return isFinite(n) ? n : null; };
  var typeDe = function(p){
    if (!p) return "manuel";
    if (p.type === "machine" || p.type === "manuel" || p.type === "oas") return p.type;
    if (p.est_oas === true) return "oas";
    return vide(p.machine_id) ? "manuel" : "machine";
  };
  var parId = Object.create(null);
  procs.forEach(function(p){ if (p && !vide(p.id)) parId[String(p.id)] = p; });
  var hp = { moyen: th ? nbOuNull(th.moyen) : null, seem: th ? nbOuNull(th.seem) : null, semrac: th ? nbOuNull(th.semrac) : null };
  var processDe = function(pid){ return vide(pid) ? null : (parId[String(pid)] || null); };
  var processMachineDeMachine = function(mid){
    if (vide(mid)) return null;
    var l = procs.filter(function(p){ return p && !vide(p.id) && typeDe(p) === "machine" && !vide(p.machine_id) && String(p.machine_id) === String(mid); });
    if (l.length === 1) return l[0];
    if (l.length > 1) { var actifs = l.filter(function(p){ return cle(p.statut) !== "inactif"; }); if (actifs.length === 1) return actifs[0]; }
    return null;
  };
  var tauxMachine = function(pid, mid){
    var p = processDe(pid);
    if (!p && !vide(mid)) p = processMachineDeMachine(mid);
    if (!p) return { taux: 0, source: "sans_process", pid: null };
    var id = String(p.id), t = typeDe(p);
    if (t === "oas") return { taux: 0, source: "oas", pid: id };
    if (t === "manuel") return { taux: 0, source: "manuel", pid: id };
    var v = nbOuNull(p.taux_machine), s = p.taux_source;
    if (s === "process" || s === "transition_machine") return { taux: (v != null && v >= 0) ? v : 0, source: s, pid: id };
    if (s == null && v != null && v > 0) return { taux: v, source: "process", pid: id };
    return { taux: 0, source: "manquant", pid: id };
  };
  return {
    tauxHomme: function(site){ var k = cle(site); if ((k === "seem" || k === "semrac") && hp[k] != null) return hp[k]; return hp.moyen != null ? hp.moyen : 0; },
    hommeManquant: hp.moyen == null,
    hommeParSite: hp,
    processDe: processDe,
    processMachineDeMachine: processMachineDeMachine,
    tauxMachine: tauxMachine,
    typeProcess: typeDe
  };
}
function beEtapeDecomp(e, tx, site){
  var nb = function(v){ var n = Number(v); return isFinite(n) ? n : 0; };
  var vide = function(v){ return v == null || v === ""; };
  var r = { st: false, oas: false, forfait: 0, unit: 0, moPc: 0, machPc: 0, moFixe: 0, machFixe: 0, reglageMin: 0, moMin: 0, machineMin: 0,
    hommeH_fixe: 0, hommeH_pc: 0, machineH_fixe: 0, machineH_pc: 0, tauxHomme: 0, tauxMachine: 0,
    typeProcess: null, sourceTauxMachine: null, manquants: [], process: null };
  if (!e) return r;
  if (e.type === "sous_traite") {
    r.st = true;
    r.forfait = Math.max(0, Number(e.forfait_st_ht != null ? e.forfait_st_ht : 0) || 0);
    r.unit = Number(e.prix_unitaire_st_ht != null ? e.prix_unitaire_st_ht : (e.cout_st_unitaire != null ? e.cout_st_unitaire : 0)) || 0;
    return r;
  }
  if (e.est_oas === true || e.type === "oas") {
    r.st = true; r.oas = true; r.typeProcess = "oas"; r.sourceTauxMachine = "oas";
    r.forfait = Math.max(0, Number(e.forfait_oas_ht != null ? e.forfait_oas_ht : 0) || 0);
    r.unit = Number(e.prix_oas_unitaire != null ? e.prix_oas_unitaire : (e.prix_unitaire_oas_ht != null ? e.prix_unitaire_oas_ht : 0)) || 0;
    return r;
  }
  var pid = vide(e.process_id) ? null : e.process_id;
  var mid = vide(e.machine_id) ? null : e.machine_id;
  var millieme = e.temps_variable_mille != null || e.temps_reglage_mille != null || e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null;
  var proc = null;
  if (tx) { proc = tx.processDe(pid); if (!proc && mid) proc = tx.processMachineDeMachine(mid); }
  if (proc && tx.typeProcess(proc) === "oas") {
    r.st = true; r.oas = true; r.typeProcess = "oas"; r.sourceTauxMachine = "oas"; r.process = proc;
    r.forfait = Math.max(0, Number(e.forfait_oas_ht != null ? e.forfait_oas_ht : 0) || 0);
    r.unit = Number(e.prix_oas_unitaire != null ? e.prix_oas_unitaire : (e.prix_unitaire_oas_ht != null ? e.prix_unitaire_oas_ht : 0)) || 0;
    return r;
  }
  var tp = proc ? tx.typeProcess(proc)
    : millieme ? (e.ressource === "machine" ? "machine" : "manuel")
    : ((mid || (!tx && nb(e.machine_taux_h) > 0)) ? "machine" : "manuel");
  var estMach = tp === "machine";
  var ropH = 0, rgmH = 0, thvH = 0, tmvH = 0;
  if (millieme) {
    var varH = nb(e.temps_variable_mille) / 1000;
    if (e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null) {
      ropH = nb(e.temps_reglage_op_mille) / 1000;
      rgmH = nb(e.temps_reglage_machine_mille) / 1000;
    } else if (estMach) rgmH = nb(e.temps_reglage_mille) / 1000;
    else ropH = nb(e.temps_reglage_mille) / 1000;
    if (estMach) tmvH = varH; else thvH = varH;
  } else {
    ropH = nb(e.temps_reglage_min) / 60;
    rgmH = nb(e.temps_reglage_machine_min) / 60;
    thvH = (e.temps_mo_min != null ? nb(e.temps_mo_min) : (estMach ? 0 : nb(e.temps_unitaire_min))) / 60;
    tmvH = (e.temps_machine_min != null ? nb(e.temps_machine_min) : (estMach ? nb(e.temps_unitaire_min) : 0)) / 60;
  }
  var tmvValorise = estMach ? tmvH : 0;
  r.hommeH_fixe = ropH + rgmH;
  r.machineH_fixe = estMach ? rgmH : 0;
  if (e.est_fixe) { r.hommeH_fixe += thvH; r.machineH_fixe += tmvValorise; }
  else { r.hommeH_pc = thvH; r.machineH_pc = tmvValorise; }
  r.reglageMin = (ropH + rgmH) * 60;
  r.moMin = thvH * 60;
  r.machineMin = tmvValorise * 60;
  r.typeProcess = tp;
  r.process = proc;
  if (tx) {
    r.tauxHomme = tx.tauxHomme(site);
    var tm = tx.tauxMachine(pid, mid);
    r.sourceTauxMachine = (estMach && !proc) ? "sans_process" : tm.source;
    r.tauxMachine = estMach ? tm.taux : 0;
  } else {
    r.tauxHomme = nb(e.taux_mo_h);
    r.tauxMachine = estMach ? nb(e.machine_taux_h) : 0;
  }
  r.moPc = r.hommeH_pc * r.tauxHomme;
  r.moFixe = r.hommeH_fixe * r.tauxHomme;
  r.machPc = r.machineH_pc * r.tauxMachine;
  r.machFixe = r.machineH_fixe * r.tauxMachine;
  if (tx) {
    var hH = r.hommeH_fixe + r.hommeH_pc, mH = r.machineH_fixe + r.machineH_pc;
    if (hH > 0 && tx.hommeManquant) r.manquants.push("taux_homme");
    if (mH > 0 && r.sourceTauxMachine === "manquant") r.manquants.push("taux_machine");
    if ((mH > 0 && r.sourceTauxMachine === "sans_process") || (!proc && !estMach && tmvH > 0)) r.manquants.push("sans_process");
  }
  return r;
}
function beLibelleManquant(code){
  if (code === "taux_homme") return "Coût chargé RH à renseigner (fiche salarié, service RH) : le temps homme est compté 0 €";
  if (code === "taux_machine") return "Taux horaire machine à saisir sur le process (Production › Postes & Process) : le temps machine est compté 0 €";
  if (code === "sans_process") return "Étape sans process machine : son temps machine n’est pas valorisé (choisir le process)";
  return String(code);
}
`

// ─── MAPPERS ──────────────────────────────────────────────────
function mapDT(d: DemandeTravaux) {
  return {
    id:           d.id,
    numAffaire:   d.num_affaire,
    client:       d.client_nom ?? '—',
    pieces:       d.pieces,
    piecesDetail: d.pieces_detail ?? [],
    type:         d.type_dt   ?? '—',
    statut:       d.statut,
    priorite:     d.priorite,
    analyste:     d.analyste  ?? '—',
    date:         d.date_dt,
    delai:        d.delai     ?? '',
    activite:     d.activite  ?? '',
  }
}
function mapCmd(c: Commande) {
  return {
    id:         c.id,
    numAffaire: c.num_affaire,
    client:     c.client_nom ?? '—',
    pieces:     c.pieces,
    statut:     c.statut,
    dateLiv:    c.date_liv   ?? '—',
    activite:   c.activite   ?? '—',
  }
}

// ─── BADGES ───────────────────────────────────────────────────
const prioBadge = (p: string) => {
  const m: Record<string,[string,string]> = {
    critique: ['#fee2e2','#b91c1c'],
    urgent:   ['#fef9c3','#854d0e'],
    normal:   ['#f0fdf4','#15803d'],
  }
  const [bg, col] = m[p] ?? ['#f1f5f9','#6b7280']
  return `<span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${bg};color:${col};">${p}</span>`
}

const statutDTBadge = (s: string) => {
  const m: Record<string,[string,string,string]> = {
    a_programmer:     ['#fef9c3','#854d0e','À programmer'],
    attente_prep:     ['#dbeafe','#1d4ed8','Attente prépa'],
    attente_num:      ['#f3e8ff','#5b21b6','Attente N° produit'],
    attente_prep_num: ['#fce7f3','#9d174d','Attente prépa + N°'],
    programmee:       ['#dcfce7','#15803d','Programmée ✓'],
    en_production:    ['#d1fae5','#065f46','En production'],
  }
  const [bg, col, lbl] = m[s] ?? ['#f1f5f9','#6b7280', s]
  return `<span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${bg};color:${col};">${lbl}</span>`
}

const nomStatutBadge = (s: string) => {
  const m: Record<string,[string,string,string]> = {
    brouillon: ['#f1f5f9','#6b7280','Brouillon'],
    en_cours:  ['#dbeafe','#1d4ed8','En cours'],
    valide:    ['#dcfce7','#15803d','Validée ✓'],
  }
  const [bg, col, lbl] = m[s] ?? ['#f1f5f9','#6b7280', s]
  return `<span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${bg};color:${col};">${lbl}</span>`
}

const emptyRow = (msg: string) =>
  `<div style="padding:48px;text-align:center;color:#9ca3af;">
    <i class="fas fa-inbox" style="font-size:2rem;margin-bottom:12px;display:block;"></i>
    <div style="font-weight:600;margin-bottom:4px;">${msg}</div>
    <div style="font-size:.78rem;">Les données s'afficheront ici depuis Supabase</div>
  </div>`

const TH = 'padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;'
const TD = 'padding:10px 14px;'

// ══════════════════════════════════════════════════════════════
type BeRefs = {
  machines: Array<{ id: string; nom: string; code?: string; activite?: string; categorie?: string; statut?: string; cnc?: boolean; poste_id?: string | null }>
  // Coût chargé RH MOYEN des opérateurs actifs (null = aucun) — jamais un taux individuel
  taux_homme?: { moyen: number | null; seem: number | null; semrac: number | null; manquant: boolean }
  taux_operateur?: { moyen: number; seem: number; semrac: number }   // alias transitoire (plus lu ici)
  taux_erreur?: string | null
  fournisseurs_st: Array<{ id: string; nom: string; operation?: string; qualification?: string; statut?: string }>
  process_atelier?: Array<{ id: string; nom: string; code?: string; activite?: string; categorie?: string; requiert_machine?: boolean; machine_id?: string | null; poste_id?: string | null; statut?: string; est_oas?: boolean
    type?: 'machine' | 'manuel' | 'oas'; taux_horaire_machine?: number | null; taux_machine?: number; taux_source?: string }>
  postes?: Array<{ id: string; nom: string; code?: string | null; activite?: string | null; couleur?: string | null }>
  sous_traitants?: Array<{ id: string; nom: string; tarifs?: Array<{ operation: string; forfait_ht?: number; prix_unitaire_piece_ht?: number }>; prestations?: string[] }>
  // Lot H1 : le jsonb `fournisseurs.catalogue` n'est PLUS lu par cette page (il était vide sur les
  // 155 fournisseurs, sonde du 17/09/2026). La seule source du catalogue est `produits_fournisseurs`
  // (→ PRODUITS_NOM / NOM_PRODUITS). Ne pas le rebrancher ici.
  fournisseurs?: Array<{ id: string; nom: string; categorie?: string | null; activite?: string; familles_fourniture?: string[] }>
}

export const pageServiceBE = (
  dbDts?:  DemandeTravaux[],
  dbCmds?: Commande[],
  dbNoms?: Nomenclature[],
  dbRefs?: BeRefs,
  dbRefsStock?: any[],
  dbProduits?: any[],
  dbBeUsers?: any[],
  dbOffres?: Offre[],
  dbPreps?: any[],
) => {
  const BE_USERS = dbBeUsers ?? []
  const DTS  = dbDts  ? dbDts.map(mapDT)   : []
  const CMDS = dbCmds ? dbCmds.map(mapCmd) : []
  const OFFS = dbOffres ?? []
  const NOMS = dbNoms ?? []
  const REFS_STOCK: any[] = dbRefsStock ?? []
  // ── Catalogue fournisseurs injecté au navigateur (lot H1, contrat §3) ──────────────────────────
  // `produits_fournisseurs` lu en `select('*')` : c'est la SOURCE UNIQUE du prix moyen
  // multi-fournisseurs (une ligne de nomenclature ne porte plus de fournisseur).
  // ⚠ `qte_paquet` reste `null` quand la colonne n'existe pas encore (cloud sans cloud-13) :
  //   `qtePaquetDe()` retombe alors sur l'ancien libellé `conditionnement`, puis sur « non déclaré »
  //   (compté 1 ET signalé en orange). Aucun affichage n'est conditionné à l'existence de la colonne.
  // `fournisseur_nom` est nécessaire (badge « n fournisseur(s) », « conditionnement non déclaré chez X ») :
  //   à défaut de la colonne dénormalisée, on le résout par l'id depuis les référentiels.
  const FOURN_NOM_PAR_ID: Record<string, string> = {}
  for (const f of ((dbRefs?.fournisseurs ?? []) as any[])) if (f && f.id != null) FOURN_NOM_PAR_ID[String(f.id)] = String(f.nom || '')
  const PRODUITS_NOM = (dbProduits ?? []).map((p: any) => ({
    fournisseur_id: p.fournisseur_id,
    fournisseur_nom: p.fournisseur_nom || FOURN_NOM_PAR_ID[String(p.fournisseur_id ?? '')] || '',
    reference: p.reference, designation: p.designation,
    prix: p.prix, qte_paquet: p.qte_paquet ?? null, conditionnement: p.conditionnement,
    date_prix: p.date_prix, categorie: p.categorie, source_prix: p.source_prix ?? null,
  }))
  // Qté/paquet par id de ligne catalogue — colonne de l'onglet « Références » et pré-remplissage de
  // la modale « Entrée catalogue ». Lue via `qtePaquetDe` (repli `conditionnement`), donc compatible
  // avec une base sans la colonne.
  const QTE_PAQUET_PAR_ID: Record<string, number | null> = {}
  for (const p of ((dbProduits ?? []) as any[])) if (p && p.id != null) QTE_PAQUET_PAR_ID[String(p.id)] = qtePaquetDe(p)
  // Accessoires chiffrés dont le conditionnement n'est pas déclaré : leur prix entre dans la moyenne
  // « à la pièce ». C'est la donnée qui fausse un coût d'un facteur 100 → on l'affiche en tête d'onglet.
  const ACC_SANS_QP = ((dbProduits ?? []) as any[]).filter((p: any) =>
    p && /accessoire/i.test(String(p.categorie || '')) && Number(p.prix) > 0 && qtePaquetDe(p) === null).length
  // Validité d'un prix catalogue : constante UNIQUE de shared.ts (lot H0) — libellé dérivé pour les infobulles
  const PRIX_VALIDITE_LIB = `${Math.round(PRIX_VALIDITE_JOURS / 30.44)} mois`
  // ── Versionnage par indice (A, B, C…) ──
  // version_groupe regroupe toutes les révisions d'un même produit ; on n'affiche dans la liste
  // que la révision la plus récente (indice max), les autres restent récupérables via la liste déroulante.
  const grpKey = (n:any) => String(n.version_groupe || n.id)
  const indiceVal = (n:any) => String(n.indice || 'A').toUpperCase().charCodeAt(0)
  const VERSIONS_MAP: Record<string, any[]> = {}
  for (const n of NOMS as any[]) {
    const k = grpKey(n)
    ;(VERSIONS_MAP[k] = VERSIONS_MAP[k] || []).push(n)
  }
  for (const k of Object.keys(VERSIONS_MAP)) VERSIONS_MAP[k].sort((a, b) => indiceVal(a) - indiceVal(b))
  // dernière révision de chaque groupe
  const latestOf = (n:any) => { const g = VERSIONS_MAP[grpKey(n)]; return g[g.length - 1] }
  const isLatest = (n:any) => latestOf(n).id === n.id
  // Deux types uniquement : « standard » (une seule pièce) et « mère » (assemblage de standards)
  // Standards/Mères = uniquement VALIDÉES (un brouillon ne se déverse pas ici tant qu'il n'est pas validé)
  const NOMS_STD   = NOMS.filter((n:any) => (n.type_nom || 'standard') !== 'mere' && isLatest(n) && n.statut === 'valide')
  const NOMS_MERES = NOMS.filter((n:any) => n.type_nom === 'mere' && isLatest(n) && n.statut === 'valide')
  // Brouillons (non validés) = catégorie « à traiter » dédiée
  const NOMS_BROUILLONS = NOMS.filter((n:any) => isLatest(n) && n.statut !== 'valide')
  // Sélecteur d'indice pour une ligne : liste déroulante de TOUTES les révisions du produit
  // (toujours un menu déroulant, même avec un seul indice) + option pour créer l'indice suivant.
  const indiceSelect = (n:any, couleur:string) => {
    const versions = VERSIONS_MAP[grpKey(n)] || [n]
    const latest = versions[versions.length - 1]
    const nextChar = String.fromCharCode(indiceVal(latest) + 1)
    const opts = versions.map(v => `<option value="${v.id}"${v.id === n.id ? ' selected' : ''}>Indice ${v.indice || 'A'}${v.statut === 'valide' ? ' ✓' : ''}</option>`).join('')
    const createOpt = `<option value="__new__:${latest.id}">➕ Créer indice ${nextChar}…</option>`
    return `<select onchange="nomChangerIndice(this.value)" title="Choisir une révision ou créer l'indice suivant (l'ancien est conservé)" style="font-weight:800;font-family:monospace;color:${couleur};background:${couleur}10;border:1.5px solid ${couleur}44;border-radius:6px;padding:3px 6px;cursor:pointer;font-size:.74rem;">${opts}${createOpt}</select>`
  }
  // Lecture tolérante (lot H0) : `composants` arrive en tableau (jsonb) OU en chaîne JSON (colonne TEXT du schéma Docker)
  const composantsCount = (n:any) => composantsDe(n?.composants).length
  // Entité Seem / Semrac
  const nomEntite = (n:any) => (n.entite === 'Semrac' ? 'Semrac' : 'Seem')
  const entiteBadge = (n:any) => nomEntite(n) === 'Semrac'
    ? '<span style="background:#fee2e2;color:#991b1b;border:1px solid #fecaca;border-radius:999px;padding:1px 9px;font-size:.64rem;font-weight:800;">Semrac</span>'
    : '<span style="background:#dcfce7;color:#166534;border:1px solid #bbf7d0;border-radius:999px;padding:1px 9px;font-size:.64rem;font-weight:800;">Seem</span>'
  // Boutons de filtre Seem/Semrac pour une liste (cible un tableau par id)
  const entiteFilterBtns = (tblId:string) => {
    const seemN = NOMS.filter((n:any)=> (tblId.includes('meres') ? n.type_nom==='mere' : (n.type_nom||'standard')!=='mere') && isLatest(n) && nomEntite(n)==='Seem').length
    const semracN = NOMS.filter((n:any)=> (tblId.includes('meres') ? n.type_nom==='mere' : (n.type_nom||'standard')!=='mere') && isLatest(n) && nomEntite(n)==='Semrac').length
    return `<div style="display:inline-flex;gap:4px;">
      <button type="button" onclick="nomFilterEntite('${tblId}','tous',this)" class="nom-ent-btn" data-tbl="${tblId}" style="padding:5px 12px;border-radius:7px;border:1.5px solid #8b5cf6;background:#8b5cf6;color:white;cursor:pointer;font-size:.72rem;font-weight:700;">Toutes</button>
      <button type="button" onclick="nomFilterEntite('${tblId}','Seem',this)" class="nom-ent-btn" data-tbl="${tblId}" style="padding:5px 12px;border-radius:7px;border:1.5px solid #bbf7d0;background:white;color:#166534;cursor:pointer;font-size:.72rem;font-weight:700;">Seem (${seemN})</button>
      <button type="button" onclick="nomFilterEntite('${tblId}','Semrac',this)" class="nom-ent-btn" data-tbl="${tblId}" style="padding:5px 12px;border-radius:7px;border:1.5px solid #fecaca;background:white;color:#991b1b;cursor:pointer;font-size:.72rem;font-weight:700;">Semrac (${semracN})</button>
    </div>`
  }
  const nomLabelById = (id:any) => { const m:any = NOMS.find((n:any)=>String(n.id)===String(id)); return m ? (m.num_nom || m.code_ref_produit || id) : '—' }
  const nomTypeBadge = (t:any) => {
    if (t === 'mere')  return '<span style="background:#fef3c7;color:#b45309;border:1px solid #fde68a;border-radius:999px;padding:1px 9px;font-size:.64rem;font-weight:800;"><i class="fas fa-sitemap" style="margin-right:4px;"></i>Mère</span>'
    return '<span style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:999px;padding:1px 9px;font-size:.64rem;font-weight:800;"><i class="fas fa-file" style="margin-right:4px;"></i>Standard</span>'
  }

  const DTS_BE       = DTS.filter(d => d.statut === 'en_attente_be')
  const DTS_NOM_WAIT = DTS.filter(d => d.statut === 'en_attente_nomenclature')
  const DTS_OFFRES   = DTS.filter(d => ['dans_offres', 'commande_creee'].includes(d.statut))   // analysée : dans les offres OU commande créée (terminée) → reste consultable (Visualiser)
  const OFF_BY_DT: Record<string, any> = {}
  ;(OFFS as any[]).forEach((o: any) => { if (o && o.dt_ref) OFF_BY_DT[String(o.dt_ref)] = o })
  const offAcceptedBE = (o: any) => !!o && ['acceptee', 'validee', 'signed', 'signee'].includes(String(o.statut))
  const CMDS_PREP = CMDS.filter(c => ['attente_prep','a_programmer'].includes(c.statut))
  // Preparations techniques REELLES (table preparations_techniques) : c'est ce que la
  // validation de prepa met a jour. Sert la liste des TRAITEES, sous celle a traiter.
  const PREPS_A_FAIRE = (dbPreps ?? []).filter((p: any) => String(p.statut || '') !== 'faite')
    .sort((a: any, b: any) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
  const PREPS_FAITES = (dbPreps ?? []).filter((p: any) => String(p.statut || '') === 'faite')
    .sort((a: any, b: any) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
  const NOMS_PEND = NOMS.filter(n => n.statut !== 'valide')

  // Map ref_interne (lowercase) → num_nom validé pour le même num_affaire (pour status par pièce)
  const VALID_BY_AFFAIRE: Record<string, Set<string>> = {}
  NOMS.filter(n => n.statut === 'valide' && n.num_affaire).forEach(n => {
    const key = String(n.num_affaire)
    if (!VALID_BY_AFFAIRE[key]) VALID_BY_AFFAIRE[key] = new Set()
    VALID_BY_AFFAIRE[key].add((n.code_ref_produit ?? '').toLowerCase())
  })

  // Pour chaque DT en attente nomenclature → liste des pièces à faire et celles déjà OK
  const DTS_NOM_AVEC_PIECES = DTS_NOM_WAIT.map(dt => {
    const pieces = (dt.piecesDetail as any[]) || []
    const validSet = VALID_BY_AFFAIRE[dt.numAffaire] || new Set()
    const aFaire = pieces
      .filter(p => !p.piece_existante_a_jour && !validSet.has((p.ref_interne ?? '').toLowerCase()))
    const dejaOk = pieces.length - aFaire.length
    return { ...dt, piecesAFaire: aFaire, piecesDejaOk: dejaOk, piecesTotal: pieces.length }
  })

  // ── TYPES DT ─────────────────────────────────────────────────
  const DT_TYPES = ['Nouveau produit', 'Maj produit', 'Maj prix']

  // ── RÉFÉRENTIELS BE (machines, taux MO, fournisseurs ST) ─────
  // Coût horaire porté par le PROCESS (14/09/2026) : plus aucun taux inventé (fini 30/35/45/50).
  //   taux machine = process_atelier[].taux_machine (résolu serveur) ; taux homme = taux_homme (moyennes RH).
  const BE_REFS: BeRefs = dbRefs ?? { machines: [], taux_homme: { moyen: null, seem: null, semrac: null, manquant: true }, fournisseurs_st: [], process_atelier: [], sous_traitants: [], fournisseurs: [] }
  const TH_RH: any = (BE_REFS && (BE_REFS as any).taux_homme && typeof (BE_REFS as any).taux_homme === 'object') ? (BE_REFS as any).taux_homme : {}
  const fmtTauxRH = (v: any) => (typeof v === 'number' && Number.isFinite(v)) ? `${v.toFixed(2).replace('.', ',')} €/h` : 'à renseigner dans RH'
  const PROCS_SANS_TAUX = (Array.isArray(BE_REFS?.process_atelier) ? BE_REFS.process_atelier : [])
    .filter((p: any) => p && p.type === 'machine' && p.taux_source === 'manquant' && String(p.statut || '').toLowerCase() !== 'inactif')

  // ── ONGLET NOMENCLATURES ──────────────────────────────────────
  const piecesToFaireTotal = DTS_NOM_AVEC_PIECES.reduce((s, d) => s + d.piecesAFaire.length, 0)

  const sectionAFaire = `
    <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border:1.5px solid #fbbf24;border-radius:14px;padding:16px 20px;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <i class="fas fa-clipboard-list" style="color:#b45309;font-size:1.05rem;"></i>
        <div style="font-size:.95rem;font-weight:800;color:#78350f;">Nomenclatures à faire (depuis DT validées)</div>
        <span style="background:#b45309;color:white;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${piecesToFaireTotal}</span>
        <span style="font-size:.72rem;color:#92400e;">${DTS_NOM_AVEC_PIECES.length} DT en attente</span>
      </div>
      ${DTS_NOM_AVEC_PIECES.length === 0 ? `
      <div style="background:white;border-radius:10px;padding:14px 16px;font-size:.78rem;color:#854d0e;">
        <i class="fas fa-check-circle" style="margin-right:6px;color:#15803d;"></i>Aucune DT n'attend de nomenclature actuellement. Les DT « Nouveau produit » / « Maj produit » validées côté commercial arriveront ici.
      </div>` : `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${DTS_NOM_AVEC_PIECES.map(dt => `
        <div style="background:white;border-radius:12px;padding:12px 16px;box-shadow:0 1px 2px rgba(0,0,0,.05);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div>
              <div style="font-weight:800;color:#1e1b4b;font-size:.88rem;display:flex;align-items:center;gap:8px;">
                <span style="font-family:monospace;color:#7c3aed;">${escX(dt.id)}</span>
                <span style="color:#374151;">·</span>
                <span style="color:#374151;">${escX(dt.client)}</span>
                <span style="font-size:.7rem;font-weight:700;padding:1px 8px;border-radius:999px;background:#ede9fe;color:#5b21b6;">${escX(dt.type)}</span>
                ${prioBadge(dt.priorite)}
              </div>
              <div style="font-size:.7rem;color:#6b7280;margin-top:3px;">
                ${dt.piecesAFaire.length} pièce(s) à nomencler · ${dt.piecesDejaOk} pièce(s) OK / ${dt.piecesTotal} total
              </div>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${dt.piecesAFaire.map((p:any) => `
            <button onclick="nomNewFromDT('${dt.numAffaire}', ${sjX({ ref:p.ref_interne, plan:p.nom_plan||'', ref_client:p.ref_client||'', qte:p.quantite||1 }).replace(/"/g,'&quot;')})"
              style="display:inline-flex;align-items:center;gap:6px;background:#ede9fe;border:1.5px solid #c4b5fd;border-radius:8px;padding:5px 12px;font-size:.74rem;font-weight:700;color:#5b21b6;cursor:pointer;">
              <i class="fas fa-plus-circle"></i>${escX(p.ref_interne)} ${p.quantite ? '×'+p.quantite : ''}
            </button>`).join('')}
          </div>
        </div>`).join('')}
      </div>`}
    </div>`

  const defaultSubtab = piecesToFaireTotal > 0 ? 'tofaire' : 'standards'
  const tabNoms = `
  <div id="be-panel-noms" style="display:block;">

    <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
      <button onclick="beRfqOpen('nomenclature')" style="background:linear-gradient(135deg,#0ea5e9,#0369a1);color:white;border:none;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer;font-size:.78rem;"><i class="fas fa-file-invoice-dollar" style="margin-right:5px;"></i>Créer une demande de prix</button>
    </div>

    <!-- VUE LISTE -->
    <div id="nom-list-view">

      <!-- SOUS-ONGLETS (À créer / Standards / Mères) -->
      <div style="display:flex;gap:8px;margin-bottom:16px;background:#f1f5f9;border-radius:12px;padding:4px;width:fit-content;">
        <button id="nom-subtab-btn-tofaire" onclick="switchNomSubtab('tofaire')"
          style="padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-weight:700;font-size:.8rem;display:flex;align-items:center;gap:7px;background:${defaultSubtab==='tofaire'?'#8b5cf6':'transparent'};color:${defaultSubtab==='tofaire'?'white':'#64748b'};box-shadow:${defaultSubtab==='tofaire'?'0 2px 8px rgba(139,92,246,.3)':'none'};">
          <i class="fas fa-clipboard-list"></i>Nomenclatures à créer
          <span style="background:${defaultSubtab==='tofaire'?'rgba(255,255,255,.25)':'#fef3c7'};color:${defaultSubtab==='tofaire'?'white':'#92400e'};border-radius:999px;padding:1px 9px;font-size:.66rem;font-weight:800;">${piecesToFaireTotal}</span>
        </button>
        <button id="nom-subtab-btn-brouillons" onclick="switchNomSubtab('brouillons')"
          style="padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-weight:700;font-size:.8rem;display:flex;align-items:center;gap:7px;background:transparent;color:#64748b;box-shadow:none;">
          <i class="fas fa-pen-ruler"></i>En cours — à valider
          <span style="background:#fef3c7;color:#b45309;border-radius:999px;padding:1px 9px;font-size:.66rem;font-weight:800;">${NOMS_BROUILLONS.length}</span>
        </button>
        <button id="nom-subtab-btn-standards" onclick="switchNomSubtab('standards')"
          style="padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-weight:700;font-size:.8rem;display:flex;align-items:center;gap:7px;background:${defaultSubtab!=='tofaire'?'#8b5cf6':'transparent'};color:${defaultSubtab!=='tofaire'?'white':'#64748b'};box-shadow:${defaultSubtab!=='tofaire'?'0 2px 8px rgba(139,92,246,.3)':'none'};">
          <i class="fas fa-file"></i>Standards (1 pièce)
          <span style="background:${defaultSubtab!=='tofaire'?'rgba(255,255,255,.25)':'#ede9fe'};color:${defaultSubtab!=='tofaire'?'white':'#5b21b6'};border-radius:999px;padding:1px 9px;font-size:.66rem;font-weight:800;">${NOMS_STD.length}</span>
        </button>
        <button id="nom-subtab-btn-meres" onclick="switchNomSubtab('meres')"
          style="padding:8px 18px;border-radius:8px;border:none;cursor:pointer;font-weight:700;font-size:.8rem;display:flex;align-items:center;gap:7px;background:transparent;color:#64748b;box-shadow:none;">
          <i class="fas fa-sitemap"></i>Mères (assemblages)
          <span style="background:#fef3c7;color:#b45309;border-radius:999px;padding:1px 9px;font-size:.66rem;font-weight:800;">${NOMS_MERES.length}</span>
        </button>
      </div>

      <!-- PANNEAU : À CRÉER -->
      <div id="nom-subtab-tofaire" style="display:${defaultSubtab==='tofaire'?'block':'none'};">
        ${sectionAFaire}
      </div>

      <!-- PANNEAU : BROUILLONS À TRAITER (nomenclatures non validées) -->
      <div id="nom-subtab-brouillons" style="display:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
          <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-pen-ruler" style="color:#d97706;"></i>Nomenclatures en cours <span style="font-size:.72rem;font-weight:600;color:#94a3b8;">— enregistrées mais pas encore validées : elles rejoindront Standards / Mères par « Enregistrer et valider »</span>
            <span style="background:#fef3c7;color:#b45309;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${NOMS_BROUILLONS.length}</span>
          </div>
          <input type="text" placeholder="Rechercher…" oninput="beFilter('nom-brouillons-tbl',this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:160px;"/>
        </div>
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
          ${NOMS_BROUILLONS.length === 0
            ? emptyRow('Aucun brouillon en cours — les nomenclatures non validées apparaîtront ici jusqu\'à leur validation')
            : `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="nom-brouillons-tbl">
              <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
                <th style="text-align:left;${TH}">N° NOM</th><th style="text-align:center;${TH}">Indice</th><th style="text-align:center;${TH}">Entité</th>
                <th style="text-align:left;${TH}">N° Affaire</th><th style="text-align:left;${TH}">Code Réf</th><th style="text-align:left;${TH}">Description</th>
                <th style="text-align:center;${TH}">Type</th><th style="text-align:center;${TH}">Créé le</th><th style="text-align:center;${TH}">Action</th>
              </tr></thead><tbody>
                ${NOMS_BROUILLONS.map((n) => `<tr data-entite="${nomEntite(n)}" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fffbeb'" onmouseleave="this.style.background=''">
                  <td style="${TD}"><span style="font-weight:700;color:#d97706;font-family:monospace;">${escX(n.num_nom ?? '—')}</span></td>
                  <td style="${TD}text-align:center;font-family:monospace;font-weight:700;">${escX(n.indice || 'A')}</td>
                  <td style="${TD}text-align:center;">${entiteBadge(n)}</td>
                  <td style="${TD}font-size:.78rem;color:#6b7280;">${n.num_affaire ? escX(n.num_affaire) : '<span style="color:#94a3b8;font-style:italic;">Libre</span>'}</td>
                  <td style="${TD}"><span style="font-weight:700;color:#111827;">${escX(n.code_ref_produit ?? '—')}</span></td>
                  <td style="${TD}color:#6b7280;font-size:.78rem;max-width:180px;">${escX(n.description ?? '—')}</td>
                  <td style="${TD}text-align:center;font-size:.72rem;color:#6b7280;">${n.type_nom === 'mere' ? 'Mère' : 'Standard'}</td>
                  <td style="${TD}text-align:center;font-size:.75rem;color:#6b7280;">${(n.created_at ?? '').slice(0,10)}</td>
                  <td style="${TD}text-align:center;"><div style="display:flex;gap:6px;justify-content:center;">
                    <button onclick="nomOpenForm(${sjX(n).replace(/"/g,'&quot;')})" style="padding:5px 12px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-pen" style="margin-right:4px;"></i>Terminer</button>
                    <button onclick="nomSupprimer('${n.id}','${n.num_nom ?? ''}')" style="padding:5px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;" title="Supprimer"><i class="fas fa-trash"></i></button>
                  </div></td>
                </tr>`).join('')}
              </tbody></table></div>`}
        </div>
      </div>

      <!-- PANNEAU : NOMENCLATURES STANDARD -->
      <div id="nom-subtab-standards" style="display:${defaultSubtab!=='tofaire'?'block':'none'};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
          <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-file" style="color:#8b5cf6;"></i>Nomenclatures standard <span style="font-size:.72rem;font-weight:600;color:#94a3b8;">— une seule pièce</span>
            <span style="background:#ede9fe;color:#5b21b6;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${NOMS_STD.length}</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            ${bulkToolbar('nom', '#8b5cf6')}
            ${entiteFilterBtns('nom-tbl')}
            <input type="text" placeholder="Rechercher…" oninput="beFilter('nom-tbl',this.value)"
              style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:160px;"/>
            <button onclick="nomNewStandard()"
              style="padding:7px 16px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:700;display:flex;align-items:center;gap:6px;">
              <i class="fas fa-plus"></i>Nouvelle nomenclature standard
            </button>
          </div>
        </div>

        <div id="nom-list-card" style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
          ${NOMS_STD.length === 0
            ? `<div id="nom-empty-state">${emptyRow('Aucune nomenclature standard — Les demandes générées depuis les DTs "Nouveau produit" apparaîtront ici')}</div>`
            : `
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="nom-tbl">
              <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
                <th class="bcell bcell-nom" style="display:none;text-align:center;${TH}"><input type="checkbox" onclick="bulkAll('nom',this.checked)" title="Tout sélectionner"/></th>
                <th style="text-align:center;${TH}">#</th>
                <th style="text-align:left;${TH}">N° NOM</th>
                <th style="text-align:center;${TH}">Indice</th>
                <th style="text-align:center;${TH}">Entité</th>
                <th style="text-align:left;${TH}">N° Affaire</th>
                <th style="text-align:left;${TH}">Code Réf Produit</th>
                <th style="text-align:left;${TH}">Description</th>
                <th style="text-align:center;${TH}">Statut</th>
                <th style="text-align:center;${TH}">Prix de revient</th>
                <th style="text-align:center;${TH}">Créé le</th>
                <th style="text-align:center;${TH}">Action</th>
              </tr></thead>
              <tbody>
                ${NOMS_STD.map((n, idx) => `
                <tr data-nom-row="${n.id}" data-entite="${nomEntite(n)}" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
                  <td class="bcell bcell-nom" style="display:none;text-align:center;"><input type="checkbox" class="bsel" data-bulk="nom" data-id="${escX(n.id)}" onclick="bulkCount('nom')"/></td>
                  <td style="${TD}text-align:center;font-weight:800;color:#94a3b8;font-family:monospace;font-size:.78rem;">${(idx+1).toString().padStart(2,'0')}</td>
                  <td style="${TD}"><span style="font-weight:700;color:#8b5cf6;font-family:monospace;">${escX(n.num_nom ?? '—')}</span></td>
                  <td style="${TD}text-align:center;">${indiceSelect(n,'#8b5cf6')}</td>
                  <td style="${TD}text-align:center;">${entiteBadge(n)}</td>
                  <td style="${TD}font-size:.78rem;color:#6b7280;">${n.num_affaire ? escX(n.num_affaire) : '<span style="color:#94a3b8;font-style:italic;">Libre</span>'}</td>
                  <td style="${TD}"><span style="font-weight:700;color:#111827;">${escX(n.code_ref_produit ?? '—')}</span></td>
                  <td style="${TD}color:#6b7280;font-size:.78rem;max-width:180px;">${escX(n.description ?? '—')}</td>
                  <td style="${TD}text-align:center;">${nomStatutBadge(n.statut)}</td>
                  <td style="${TD}text-align:center;font-weight:700;color:#111827;">${n.prix_revient_unitaire ? n.prix_revient_unitaire.toFixed(2) + ' €' : '—'}</td>
                  <td style="${TD}text-align:center;font-size:.75rem;color:#6b7280;">${(n.created_at ?? '').slice(0,10)}</td>
                  <td style="${TD}text-align:center;">
                    <div style="display:flex;gap:6px;justify-content:center;">
                      <button onclick="nomOpenForm(${sjX(n).replace(/"/g,'&quot;')})"
                        style="padding:5px 12px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;">
                        <i class="fas fa-edit" style="margin-right:4px;"></i>Ouvrir
                      </button>
                      <button onclick="nomSupprimer('${n.id}','${n.num_nom ?? ''}',1)"
                        style="padding:5px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;"
                        title="Supprimer">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </div>

        <div style="margin-top:12px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:10px 16px;font-size:.76rem;color:#166534;">
          <i class="fas fa-info-circle" style="margin-right:6px;"></i>
          Une <strong>nomenclature standard</strong> décrit <strong>une seule pièce</strong> (sa matière, ses fournitures, sa gamme). Les <strong>mères</strong> en sont des assemblages.
        </div>
      </div>

      <!-- PANNEAU : NOMENCLATURES MÈRES -->
      <div id="nom-subtab-meres" style="display:none;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
          <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-sitemap" style="color:#b45309;"></i>Nomenclatures mères <span style="font-size:.72rem;font-weight:600;color:#94a3b8;">— assemblage de standards</span>
            <span style="background:#fef3c7;color:#b45309;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${NOMS_MERES.length}</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            ${bulkToolbar('nomm', '#b45309')}
            ${entiteFilterBtns('nom-meres-tbl')}
            <input type="text" placeholder="Rechercher…" oninput="beFilter('nom-meres-tbl',this.value)"
              style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:160px;"/>
            <button onclick="nomNewMere()"
              style="padding:7px 16px;background:linear-gradient(135deg,#f59e0b,#b45309);color:white;border:none;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:700;display:flex;align-items:center;gap:6px;">
              <i class="fas fa-plus"></i>Nouvelle mère
            </button>
          </div>
        </div>
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
          ${NOMS_MERES.length === 0
            ? `<div style="padding:40px;text-align:center;color:#9ca3af;"><i class="fas fa-sitemap" style="font-size:1.8rem;margin-bottom:10px;display:block;color:#cbd5e1;"></i><div style="font-weight:600;margin-bottom:4px;">Aucune nomenclature mère</div><div style="font-size:.78rem;">Cliquez « + Nouvelle mère » puis assemblez des nomenclatures standard.</div></div>`
            : `
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="nom-meres-tbl">
              <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
                <th class="bcell bcell-nomm" style="display:none;text-align:center;${TH}"><input type="checkbox" onclick="bulkAll('nomm',this.checked)" title="Tout sélectionner"/></th>
                <th style="text-align:center;${TH}">#</th>
                <th style="text-align:left;${TH}">N° NOM</th>
                <th style="text-align:center;${TH}">Indice</th>
                <th style="text-align:center;${TH}">Entité</th>
                <th style="text-align:left;${TH}">Code Réf Produit</th>
                <th style="text-align:left;${TH}">Description</th>
                <th style="text-align:center;${TH}">Composants</th>
                <th style="text-align:center;${TH}">Statut</th>
                <th style="text-align:center;${TH}">Prix de revient</th>
                <th style="text-align:center;${TH}">Action</th>
              </tr></thead>
              <tbody>
                ${NOMS_MERES.map((n, idx) => `
                <tr data-nom-row="${n.id}" data-entite="${nomEntite(n)}" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
                  <td class="bcell bcell-nomm" style="display:none;text-align:center;"><input type="checkbox" class="bsel" data-bulk="nomm" data-id="${escX(n.id)}" onclick="bulkCount('nomm')"/></td>
                  <td style="${TD}text-align:center;font-weight:800;color:#94a3b8;font-family:monospace;font-size:.78rem;">${(idx+1).toString().padStart(2,'0')}</td>
                  <td style="${TD}"><span style="font-weight:700;color:#b45309;font-family:monospace;"><i class="fas fa-sitemap" style="margin-right:4px;"></i>${escX(n.num_nom ?? '—')}</span></td>
                  <td style="${TD}text-align:center;">${indiceSelect(n,'#b45309')}</td>
                  <td style="${TD}text-align:center;">${entiteBadge(n)}</td>
                  <td style="${TD}"><span style="font-weight:700;color:#111827;">${escX(n.code_ref_produit ?? '—')}</span></td>
                  <td style="${TD}color:#6b7280;font-size:.78rem;max-width:180px;">${escX(n.description ?? '—')}</td>
                  <td style="${TD}text-align:center;font-weight:700;color:#b45309;">${composantsCount(n)} standard${composantsCount(n)!==1?'s':''}</td>
                  <td style="${TD}text-align:center;">${nomStatutBadge(n.statut)}</td>
                  <td style="${TD}text-align:center;font-weight:700;color:#111827;">${n.prix_revient_unitaire ? n.prix_revient_unitaire.toFixed(2) + ' €' : '—'}</td>
                  <td style="${TD}text-align:center;">
                    <div style="display:flex;gap:6px;justify-content:center;">
                      <button onclick="nomOpenForm(${sjX(n).replace(/"/g,'&quot;')})"
                        style="padding:5px 12px;background:linear-gradient(135deg,#f59e0b,#b45309);color:white;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;">
                        <i class="fas fa-edit" style="margin-right:4px;"></i>Ouvrir
                      </button>
                      <button onclick="nomSupprimer('${n.id}','${n.num_nom ?? ''}',1)"
                        style="padding:5px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;" title="Supprimer">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>`}
        </div>
        <div style="margin-top:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 16px;font-size:.76rem;color:#92400e;">
          <i class="fas fa-info-circle" style="margin-right:6px;"></i>
          Une <strong>nomenclature mère</strong> est un <strong>assemblage de nomenclatures standard</strong> (chacune avec sa quantité). Son prix de revient est la somme des standards qui la composent.
        </div>
      </div>
    </div>
    ${bulkSelectAssets([{ key: 'nom', base: '/api/nomenclature/', label: 'nomenclature(s)', motif: true }, { key: 'nomm', base: '/api/nomenclature/', label: 'nomenclature(s) mère(s)', motif: true }])}

    <!-- FORMULAIRE NOMENCLATURE -->
    <div id="nom-form-view" style="display:none;margin:0 auto;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
        <button onclick="nomCloseForm()" style="padding:7px 14px;border:1.5px solid #e2e8f0;border-radius:8px;background:white;cursor:pointer;font-size:.8rem;font-weight:600;display:flex;align-items:center;gap:6px;color:#374151;">
          <i class="fas fa-arrow-left"></i>Retour à la liste
        </button>
        <div style="font-size:1rem;font-weight:800;color:#111827;" id="nom-form-title">Nouvelle nomenclature</div>
        <div id="nom-form-statut-badge" style="margin-left:4px;"></div>
        <div style="margin-left:auto;display:flex;gap:8px;">
          <button onclick="nomSave('en_cours')" title="Enregistre la progression sans quitter la nomenclature — elle reste dans « à faire »" style="padding:8px 18px;border-radius:8px;background:#dbeafe;border:none;cursor:pointer;font-size:.8rem;font-weight:700;color:#1d4ed8;display:flex;align-items:center;gap:6px;">
            <i class="fas fa-save"></i>Enregistrer
          </button>
          <button onclick="nomSave('valide')" title="Enregistre ET valide : la nomenclature passe dans la liste des nomenclatures faites" style="padding:8px 20px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:8px;cursor:pointer;font-size:.8rem;font-weight:700;display:flex;align-items:center;gap:6px;">
            <i class="fas fa-check-circle"></i>Enregistrer et valider
          </button>
        </div>
      </div>

      <!-- BANDEAU RÉVISION / INDICE -->
      <div id="nom-revision-banner" style="display:none;align-items:center;gap:16px;flex-wrap:wrap;background:#faf5ff;border:1.5px solid #e9d5ff;border-radius:12px;padding:12px 18px;margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:.72rem;font-weight:800;color:#6b21a8;text-transform:uppercase;">Indice actuel</span>
          <span id="nom-indice-actuel" style="font-weight:900;font-family:monospace;font-size:1rem;color:#7c3aed;background:#ede9fe;border:1px solid #c4b5fd;border-radius:6px;padding:2px 12px;">A</span>
        </div>
        <button type="button" onclick="nomCreerNouvelIndice()" style="display:inline-flex;align-items:center;gap:7px;padding:8px 16px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;border:none;border-radius:9px;cursor:pointer;font-size:.8rem;font-weight:700;">
          <i class="fas fa-code-branch"></i>Incrémenter l'indice → <span id="nom-indice-next">B</span>
        </button>
        <span style="font-size:.72rem;color:#6b21a8;flex:1;min-width:200px;"><i class="fas fa-info-circle" style="margin-right:5px;"></i>Crée une nouvelle révision avec les modifications en cours. <strong>L'ancienne révision n'est pas effacée</strong> — elle reste récupérable via la liste déroulante d'indice.</span>
      </div>

      <div style="display:grid;grid-template-columns:minmax(340px,0.78fr) minmax(0,1.22fr);gap:20px;">

        <!-- COL GAUCHE : IDENTITÉ (les compartiments Matière / Accessoires sont passés en tête de la colonne DROITE, lot H1 §10) -->
        <div style="display:flex;flex-direction:column;gap:16px;">

          <!-- Identité -->
          <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
            <div style="font-size:.72rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px;"><i class="fas fa-tag" style="color:#8b5cf6;margin-right:6px;"></i>Identification</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° Nomenclature = réf. pièce <span style="color:#ef4444;">*</span></label>
                <input id="nom-f-num" type="text" placeholder="ex: SEEM-DISSIP-A24" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;font-weight:700;"/>
              </div>
              <div>
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° Affaire (optionnel)</label>
                <input id="nom-f-affaire" type="text" placeholder="ex: 2026-081" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/>
              </div>
              <div style="grid-column:1/-1;">
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Entité <span style="color:#ef4444;">*</span></label>
                <select id="nom-f-entite" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;font-weight:700;">
                  <option value="Seem">Seem</option>
                  <option value="Semrac">Semrac</option>
                </select>
              </div>
              <div style="grid-column:1/-1;">
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Type de nomenclature</label>
                <input type="hidden" id="nom-f-type" value="standard"/>
                <div style="display:inline-flex;background:#f1f5f9;border-radius:9px;padding:3px;gap:2px;">
                  <button type="button" id="nom-type-btn-standard" onclick="nomSetType('standard')" style="border:none;cursor:pointer;border-radius:7px;padding:7px 16px;font-size:.78rem;font-weight:700;background:#fff;color:#6d28d9;box-shadow:0 1px 3px rgba(0,0,0,.12);transition:all .12s;"><i class="fas fa-file" style="margin-right:5px;"></i>Standard (1 pièce)</button>
                  <button type="button" id="nom-type-btn-mere" onclick="nomSetType('mere')" style="border:none;cursor:pointer;border-radius:7px;padding:7px 16px;font-size:.78rem;font-weight:700;background:transparent;color:#64748b;box-shadow:none;transition:all .12s;"><i class="fas fa-sitemap" style="margin-right:5px;"></i>Mère (assemblage)</button>
                </div>
              </div>
              <div id="nom-f-mere-block" style="grid-column:1/-1;display:none;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                  <div style="font-size:.72rem;font-weight:800;color:#b45309;text-transform:uppercase;letter-spacing:.04em;"><i class="fas fa-sitemap" style="margin-right:5px;"></i>Composants — nomenclatures standard</div>
                  <button type="button" onclick="nomAddComposant()" style="padding:5px 12px;background:#f59e0b;color:#fff;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:4px;"></i>Ajouter un standard</button>
                </div>
                <div id="nom-f-composants-list"></div>
                <div style="margin-top:8px;text-align:right;font-size:.74rem;color:#92400e;font-weight:700;">Total composants : <span id="nom-composants-total">0.00 €</span></div>
              </div>
              <div style="grid-column:1/-1;">
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Code produit <span style="font-weight:500;text-transform:none;color:#94a3b8;">(optionnel · = N° par défaut)</span></label>
                <input id="nom-f-code" type="text" placeholder="ex: SEEM-DISSIP-A24-001" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.88rem;font-weight:700;background:#f8fafc;outline:none;"/>
              </div>
              <div style="grid-column:1/-1;">
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Description produit</label>
                <input id="nom-f-desc" type="text" placeholder="Désignation complète du produit" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/>
              </div>
              <div>
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° de plan</label>
                <input id="nom-f-numplan" type="text" placeholder="ex: PL-138001 ind. A" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/>
              </div>
              <div>
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Nom du fichier CAO</label>
                <input id="nom-f-planfic" type="text" placeholder="ex: PL-138001_A.pdf" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/>
                <div id="nom-plan-ouvrir" style="margin-top:4px;font-size:.7rem;"></div>
              </div>
              <div>
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Masse pour 1 pc (g)</label>
                <input id="nom-f-masse" type="number" step="0.1" placeholder="0" oninput="nomCalcTotaux()" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/>
              </div>
              <div>
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Dimensions pour 1 pc</label>
                <input id="nom-f-dims" type="text" placeholder="ex: 150 × 80 × 20 mm" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/>
              </div>
              <div>
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Surface totale pour 1 pc (mm²)</label>
                <input id="nom-f-surface" type="number" step="1" placeholder="0" title="Surface développée d'une pièce en mm² — sert au calcul de la charge des balancelles OAS (convertie en dm² au stockage)" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/>
              </div>
              <div>
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Créé par</label>
                <select id="nom-f-createur" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"><option value="">— Analyste —</option>${BE_USERS.map((u: any) => { const nm = `${u.prenom || ''} ${u.nom || ''}`.trim(); return nm ? `<option value="${escX(nm)}">${escX(nm)}</option>` : '' }).join('')}</select>
              </div>
              <div>
                <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Notes</label>
                <input id="nom-f-notes" type="text" placeholder="Remarques..." style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/>
              </div>
            </div>
          </div>

          <!-- RÉPERTOIRE : clients qui commandent cette référence (réf interne ↔ réf client ↔ plan) -->
          <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div style="font-size:.72rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;"><i class="fas fa-people-group" style="color:#6366f1;margin-right:6px;"></i>Clients &amp; réfs de cette pièce</div>
              <span style="font-size:.66rem;color:#94a3b8;">réf interne ↔ réf client ↔ plan</span>
            </div>
            <div id="nom-refs-clients-list" style="margin-bottom:10px;"><div style="font-size:.72rem;color:#cbd5e1;">Enregistrez la nomenclature (Brouillon) puis rouvrez-la — les clients qui commandent cette réf (depuis les DT) apparaissent ici.</div></div>
            <div id="nom-refs-clients-add" style="display:none;gap:6px;flex-wrap:wrap;align-items:flex-end;">
              <div><label style="display:block;font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Client</label><input id="rc-client" placeholder="Nom du client" style="border:1.5px solid #e2e8f0;border-radius:7px;padding:5px 8px;font-size:.74rem;"/></div>
              <div><label style="display:block;font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Réf. client</label><input id="rc-refclient" placeholder="Ex: 94402" style="border:1.5px solid #e2e8f0;border-radius:7px;padding:5px 8px;font-size:.74rem;"/></div>
              <div><label style="display:block;font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">N° plan</label><input id="rc-numplan" placeholder="Plan client" style="border:1.5px solid #e2e8f0;border-radius:7px;padding:5px 8px;font-size:.74rem;"/></div>
              <button onclick="nomRefClientAdd()" style="background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:7px;padding:6px 12px;font-size:.74rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:4px;"></i>Ajouter</button>
            </div>
          </div>

          <!-- GED : documents rattachés (plan client, plan CAO, programmes FAO) -->
          <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:16px;">
            <div style="font-size:.72rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;"><i class="fas fa-folder-open" style="color:#6366f1;margin-right:6px;"></i>Documents (GED)</div>
            <div id="ged-need-save" style="display:none;font-size:.72rem;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 11px;"><i class="fas fa-info-circle" style="margin-right:5px;"></i>Enregistrez la nomenclature (Brouillon), puis rouvrez-la pour joindre les fichiers.</div>
            <div id="ged-zones" style="display:none;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                <div>
                  <label style="display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:5px;"><i class="fas fa-file-contract" style="margin-right:4px;color:#6366f1;"></i>Plan client</label>
                  <div id="ged-list-plan_client" style="margin-bottom:6px;"></div>
                  <div style="display:flex;gap:5px;align-items:center;"><input type="file" id="ged-input-plan_client" accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff,.dwg,.dxf" style="font-size:.66rem;flex:1;min-width:0;"/><button onclick="gedUpload('ged-input-plan_client','plan_client')" style="background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:5px 10px;font-size:.68rem;font-weight:700;cursor:pointer;white-space:nowrap;">Joindre</button></div>
                </div>
                <div>
                  <label style="display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:5px;"><i class="fas fa-drafting-compass" style="margin-right:4px;color:#6366f1;"></i>Plan CAO</label>
                  <div id="ged-list-plan_cao" style="margin-bottom:6px;"></div>
                  <div style="display:flex;gap:5px;align-items:center;"><input type="file" id="ged-input-plan_cao" accept=".step,.stp,.stl,.igs,.iges,.sldprt,.pdf,.dwg,.dxf" style="font-size:.66rem;flex:1;min-width:0;"/><button onclick="gedUpload('ged-input-plan_cao','plan_cao')" style="background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:5px 10px;font-size:.68rem;font-weight:700;cursor:pointer;white-space:nowrap;">Joindre</button></div>
                </div>
              </div>
              <div style="margin-top:14px;">
                <label style="display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:5px;"><i class="fas fa-microchip" style="margin-right:4px;color:#6366f1;"></i>Programmes FAO (par étape machine)</label>
                <div id="ged-fao-list"></div>
              </div>
            </div>
          </div>

        </div>

        <!-- COL DROITE : FOURNITURES + TEMPS + CALCULS -->
        <div style="display:flex;flex-direction:column;gap:16px;">

          <!-- ═══ FOURNITURES : 2 compartiments (Matière / Accessoires) ═══════════════════════════
               Lot H1 §10 : déplacés EN TÊTE de la colonne droite (la colonne gauche, étroite depuis
               le commit d8028d4414, faisait déborder les lignes : à 1600 px et moins la croix de
               suppression passait SOUS les cartes de droite et n'était plus cliquable).
               Une ligne ne porte plus ni fournisseur ni qté/paquet : elle porte une RÉFÉRENCE, et son
               prix est la MOYENNE de tous les fournisseurs qui la portent au catalogue.
               En-tête et lignes partagent la même classe de grille (.nom-mat-grid / .nom-acc-grid). -->
          <div id="nom-fournitures-block">

            <!-- COMPARTIMENT MATIÈRE -->
            <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="font-size:.72rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;flex:1;"><i class="fas fa-layer-group" style="color:#0ea5e9;margin-right:6px;"></i>Matière (tôle)</div>
                <button onclick="nomAddMatiere()" style="padding:5px 12px;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:white;border:none;border-radius:7px;cursor:pointer;font-size:.75rem;font-weight:700;display:flex;align-items:center;gap:5px;"><i class="fas fa-plus"></i>Ajouter matière</button>
              </div>
              <div style="font-size:.64rem;color:#94a3b8;margin-bottom:10px;">Cherchez par <strong>référence ou désignation</strong> (tout le catalogue, tous fournisseurs) : le prix de la tôle est la <strong>moyenne des fournisseurs</strong> qui portent la référence. Prix de plus de ${PRIX_VALIDITE_LIB} : orange, demande de prix conseillée. Aucun prix : rouge (« coût incomplet »), la validation reste permise. Prix tôle ÷ Pc/tôle = prix matière / pièce.</div>
              <div class="nom-grid-scroll">
              <div class="nom-mat-grid nom-grid-head">
                <span title="Référence catalogue de la matière (sans fournisseur)" style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Réf. matière</span>
                <span title="Désignation — la recherche fonctionne aussi ici" style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Désignation</span>
                <span title="Nombre de pièces découpées dans une tôle (dépend de l'imbrication, saisi au BE)" style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">Pc/tôle</span>
                <span title="Prix estimé par pièce = prix moyen d'une tôle ÷ Pc/tôle" style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">Prix estimé / pièce</span>
                <span title="Demande de prix aux Achats (possible à tout moment)"></span>
                <span></span>
              </div>
              <div id="nom-matieres-list"></div>
              </div>
              <div style="margin-top:8px;display:flex;justify-content:flex-end;padding-top:8px;border-top:1.5px solid #f1f5f9;">
                <span style="font-size:.78rem;font-weight:800;color:#374151;">Total matière / pièce : <span id="nom-total-matiere" style="color:#0ea5e9;">0,00 €</span></span>
              </div>
            </div>

            <!-- COMPARTIMENT ACCESSOIRES -->
            <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="font-size:.72rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;flex:1;"><i class="fas fa-screwdriver-wrench" style="color:#8b5cf6;margin-right:6px;"></i>Accessoires</div>
                <button onclick="nomAddAccessoire()" style="padding:5px 12px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:7px;cursor:pointer;font-size:.75rem;font-weight:700;display:flex;align-items:center;gap:5px;"><i class="fas fa-plus"></i>Ajouter accessoire</button>
              </div>
              <div style="font-size:.64rem;color:#94a3b8;margin-bottom:10px;">Cherchez par <strong>référence ou désignation</strong> ; le prix à la pièce est la <strong>moyenne des fournisseurs</strong>, chacun ramené à la pièce par sa <strong>quantité par paquet</strong>. Celle-ci se déclare au <strong>catalogue</strong> (BE › Références ou fiche fournisseur), plus ici. Non déclarée chez un fournisseur : son prix est compté à la pièce et signalé en orange.</div>
              <div class="nom-grid-scroll">
              <div class="nom-acc-grid nom-grid-head">
                <span title="Référence catalogue de l'accessoire (sans fournisseur)" style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Réf catalogue</span>
                <span title="Désignation — la recherche fonctionne aussi ici" style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Désignation</span>
                <span title="Nombre d'accessoires par pièce fabriquée" style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">Nb/pièce</span>
                <span title="Prix estimé par pièce fabriquée = prix moyen d'UNE pièce d'accessoire × Nb/pièce" style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">Prix estimé / pièce</span>
                <span title="Demande de prix aux Achats (possible à tout moment)"></span>
                <span></span>
              </div>
              <div id="nom-accessoires-list"></div>
              </div>
              <div style="margin-top:8px;display:flex;justify-content:flex-end;padding-top:8px;border-top:1.5px solid #f1f5f9;">
                <span style="font-size:.78rem;font-weight:800;color:#374151;">Total accessoires / pièce : <span id="nom-total-accessoire" style="color:#8b5cf6;">0,00 €</span></span>
              </div>
            </div>
          </div>

          <!-- Étapes de production -->
          <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
              <div style="font-size:.72rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;flex:1;">
                <i class="fas fa-cogs" style="color:#8b5cf6;margin-right:6px;"></i>Étapes de production
              </div>
              <span style="font-size:.62rem;color:#94a3b8;font-style:italic;margin-right:2px;" title="Machines et process se créent dans Production → « Postes & Process ». Ici on ne fait que les choisir."><i class="fas fa-circle-info" style="margin-right:3px;"></i>Postes / process gérés en Production</span>
              <button onclick="nomAddEtape()" style="padding:5px 12px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:7px;cursor:pointer;font-size:.75rem;font-weight:700;display:flex;align-items:center;gap:5px;">
                <i class="fas fa-plus"></i>Ajouter étape
              </button>
            </div>
            <div style="background:#f8fafc;border-radius:8px;padding:8px 12px;margin-bottom:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:.7rem;color:#6b7280;">
              <div title="Taux horaire HOMME = coût chargé RH moyen des opérateurs actifs du site (fiche salarié). Le taux MACHINE est porté par chaque process machine (Production › Postes &amp; Process).">Coût chargé RH moyen <span style="font-weight:800;color:#374151;">Seem ${escX(fmtTauxRH(TH_RH.seem ?? TH_RH.moyen))} · Semrac ${escX(fmtTauxRH(TH_RH.semrac ?? TH_RH.moyen))}</span></div>
              <div title="Process machine dont le taux horaire machine n'est pas encore saisi">Process machine sans taux <span style="font-weight:800;color:${PROCS_SANS_TAUX.length ? '#b45309' : '#374151'};">${PROCS_SANS_TAUX.length}</span></div>
              <div>Sous-traitants actifs <span style="font-weight:800;color:#374151;">${(BE_REFS.sous_traitants?.length ?? BE_REFS.fournisseurs_st?.length ?? 0)}</span></div>
            </div>
            <!-- Données de coût manquantes (taux machine à saisir, coût chargé RH absent, étape sans process) -->
            ${(BE_REFS as any)?.taux_erreur ? `<div id="nom-taux-erreur" style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:.7rem;color:#991b1b;line-height:1.5;"><div style="font-weight:800;"><i class="fas fa-circle-exclamation" style="margin-right:5px;"></i>Taux de l'atelier illisibles : les coûts affichés ne sont PAS fiables</div><div>La lecture a échoué (${escX(String((BE_REFS as any).taux_erreur))}) — ce n'est pas une donnée absente. Enregistrement des nomenclatures bloqué : rechargez la page quand la base répond.</div></div>` : ''}
            <div id="nom-taux-alerte" style="display:none;background:#fff7ed;border:1.5px solid #fed7aa;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:.7rem;color:#9a3412;line-height:1.5;"></div>
            <!-- Header colonnes -->
            <div style="font-size:.62rem;color:#7c3aed;font-weight:700;margin:0 2px 5px;"><i class="fas fa-clock" style="margin-right:4px;"></i>Temps en <strong>millièmes d'heure</strong> (1000&nbsp;‰&nbsp;=&nbsp;1&nbsp;h) — totaux affichés en heures/minutes</div>
            <div style="display:grid;grid-template-columns:34px 84px 1fr 1.2fr 58px 58px 58px 62px 88px 26px;gap:4px;margin-bottom:4px;padding:0 2px;">
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">N°</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Type</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;" title="Poste d'atelier (interne) / sous-traitant">Poste</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;" title="Process du poste choisi (interne) / opération (sous-traité)">Process</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;" title="ROP — réglage homme, en millièmes d'heure (1000 = 1 h). Temps HOMME, fixe par lot, au coût chargé RH moyen du site.">ROP ‰h</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;" title="RGM — réglage machine, en millièmes d'heure (1000 = 1 h). Temps HOMME + MACHINE, fixe par lot : coût chargé RH + taux horaire machine du process (process machine seulement).">RGM ‰h</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;" title="THV — temps homme variable, par pièce, en millièmes d'heure (1000 = 1 h). Temps HOMME, au coût chargé RH moyen du site.">MO ‰h</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;" title="TMV — temps machine variable, par pièce, en millièmes d'heure (1000 = 1 h). Temps MACHINE seul, au taux horaire machine du process (process machine seulement).">Mach ‰h</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">Coût/pc</span>
              <span></span>
            </div>
            <div id="nom-etapes-list"></div>
            <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding-top:8px;border-top:1.5px solid #f1f5f9;">
              <div style="background:#f8fafc;border-radius:8px;padding:8px 12px;text-align:center;">
                <div style="font-size:.6rem;color:#6b7280;text-transform:uppercase;font-weight:700;">Réglage total</div>
                <div style="font-size:.92rem;font-weight:800;color:#374151;"><span id="nom-total-reglage">0h00</span></div>
              </div>
              <div style="background:#f8fafc;border-radius:8px;padding:8px 12px;text-align:center;">
                <div style="font-size:.6rem;color:#6b7280;text-transform:uppercase;font-weight:700;">Temps MO + Machine</div>
                <div style="font-size:.92rem;font-weight:800;color:#374151;"><span id="nom-total-unitaire">0h00</span></div>
              </div>
              <div style="background:#f8fafc;border-radius:8px;padding:8px 12px;text-align:center;">
                <div style="font-size:.6rem;color:#6b7280;text-transform:uppercase;font-weight:700;">Coût étapes</div>
                <div style="font-size:.92rem;font-weight:800;color:#8b5cf6;"><span id="nom-total-etapes">0,00</span> €</div>
              </div>
            </div>
          </div>

          <!-- Calculs automatiques -->
          <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1.5px solid #c4b5fd;border-radius:14px;padding:20px;">
            <div style="font-size:.72rem;font-weight:800;color:#5b21b6;text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px;"><i class="fas fa-calculator" style="margin-right:6px;"></i>Prix de revient unitaire — Calcul automatique</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div style="font-size:.6rem;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:.05em;margin:-4px 2px 2px;">Détail des prix (par pièce)</div>
              <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:9px 14px;">
                <div style="font-size:.78rem;font-weight:700;color:#374151;"><i class="fas fa-layer-group" style="color:#0ea5e9;margin-right:7px;"></i>Matière</div>
                <span id="nom-calc-matiere-d" style="font-size:1rem;font-weight:800;color:#0ea5e9;">0,00 €</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:9px 14px;">
                <div style="font-size:.78rem;font-weight:700;color:#374151;"><i class="fas fa-screwdriver-wrench" style="color:#8b5cf6;margin-right:7px;"></i>Accessoire</div>
                <span id="nom-calc-accessoire-d" style="font-size:1rem;font-weight:800;color:#8b5cf6;">0,00 €</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:9px 14px;">
                <div><div style="font-size:.78rem;font-weight:700;color:#374151;"><i class="fas fa-wrench" style="color:#f59e0b;margin-right:7px;"></i>Main d'œuvre fixe</div><div style="font-size:.62rem;color:#9ca3af;margin-left:22px;">réglage — coût / lot</div></div>
                <span id="nom-calc-mofixe" style="font-size:1rem;font-weight:800;color:#f59e0b;">0,00 €</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:9px 14px;">
                <div><div style="font-size:.78rem;font-weight:700;color:#374151;"><i class="fas fa-gears" style="color:#10b981;margin-right:7px;"></i>Main d'œuvre variable</div><div style="font-size:.62rem;color:#9ca3af;margin-left:22px;">homme + machine / pièce</div></div>
                <span id="nom-calc-movar" style="font-size:1rem;font-weight:800;color:#10b981;">0,00 €</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:9px 14px;">
                <div style="font-size:.78rem;font-weight:700;color:#374151;"><i class="fas fa-industry" style="color:#b45309;margin-right:7px;"></i>Sous-traitance · OAS</div>
                <span id="nom-calc-st-d" style="font-size:1rem;font-weight:800;color:#b45309;">0,00 €</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#8b5cf6,#6d28d9);border-radius:10px;padding:14px 16px;margin-top:4px;">
                <div>
                  <div style="font-size:.88rem;font-weight:800;color:white;">PRIX DE REVIENT UNITAIRE</div>
                  <div style="font-size:.65rem;color:rgba(255,255,255,.7);">Fournitures + MO + Machine</div>
                </div>
                <span id="nom-calc-total" style="font-size:1.4rem;font-weight:800;color:white;">0,00 €</span>
              </div>

              <!-- Estimation pour une quantité de commande : applique le forfait ST (plancher) -->
              <div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:10px;padding:12px 14px;margin-top:6px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
                  <div style="font-size:.72rem;font-weight:800;color:#b45309;text-transform:uppercase;letter-spacing:.04em;"><i class="fas fa-truck-loading" style="margin-right:5px;"></i>Estimation commande (forfait ST inclus)</div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <label style="font-size:.7rem;font-weight:700;color:#92400e;">Quantité</label>
                    <input id="nom-qte-serie" type="number" min="1" step="1" value="1" oninput="nomCalcTotaux()" style="width:80px;border:1.5px solid #fed7aa;border-radius:7px;padding:5px 8px;font-size:.8rem;text-align:right;background:white;outline:none;"/>
                  </div>
                </div>
                <div style="font-size:.6rem;font-weight:800;color:#b45309;text-transform:uppercase;letter-spacing:.05em;margin:2px 0 6px;">Détail des prix pour la quantité</div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:8px 12px;">
                    <div style="font-size:.76rem;font-weight:700;color:#374151;"><i class="fas fa-layer-group" style="color:#0ea5e9;margin-right:7px;"></i>Matière</div>
                    <span id="nom-calc-s-matiere" style="font-size:.95rem;font-weight:800;color:#0ea5e9;">0,00 €</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:8px 12px;">
                    <div style="font-size:.76rem;font-weight:700;color:#374151;"><i class="fas fa-screwdriver-wrench" style="color:#8b5cf6;margin-right:7px;"></i>Accessoire</div>
                    <span id="nom-calc-s-accessoire" style="font-size:.95rem;font-weight:800;color:#8b5cf6;">0,00 €</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:8px 12px;">
                    <div><div style="font-size:.76rem;font-weight:700;color:#374151;"><i class="fas fa-wrench" style="color:#f59e0b;margin-right:7px;"></i>Main d'œuvre fixe</div><div style="font-size:.6rem;color:#9ca3af;margin-left:22px;">réglage — coût / lot (compté 1×)</div></div>
                    <span id="nom-calc-s-mofixe" style="font-size:.95rem;font-weight:800;color:#f59e0b;">0,00 €</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:8px 12px;">
                    <div><div style="font-size:.76rem;font-weight:700;color:#374151;"><i class="fas fa-gears" style="color:#10b981;margin-right:7px;"></i>Main d'œuvre variable</div><div style="font-size:.6rem;color:#9ca3af;margin-left:22px;">homme + machine × quantité</div></div>
                    <span id="nom-calc-s-movar" style="font-size:.95rem;font-weight:800;color:#10b981;">0,00 €</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:8px 12px;">
                    <div style="font-size:.76rem;font-weight:700;color:#374151;"><i class="fas fa-industry" style="color:#b45309;margin-right:7px;"></i>Sous-traitance · OAS</div>
                    <span id="nom-calc-s-st" style="font-size:.95rem;font-weight:800;color:#b45309;">0,00 €</span>
                  </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#f59e0b,#b45309);border-radius:10px;padding:13px 16px;margin-top:8px;">
                  <div>
                    <div style="font-size:.84rem;font-weight:800;color:white;">COÛT TOTAL POUR <span id="nom-calc-s-qte">1</span> PC</div>
                    <div style="font-size:.62rem;color:rgba(255,255,255,.8);">Revient réel : <span id="nom-calc-revient-reel">0,00</span> €/pc · dont ST <span id="nom-calc-st-serie">0,00</span> €</div>
                  </div>
                  <span style="font-size:1.35rem;font-weight:800;color:white;"><span id="nom-calc-total-serie">0,00</span> €</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Statut validation -->
          <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
            <div style="font-size:.72rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px;"><i class="fas fa-shield-alt" style="color:#8b5cf6;margin-right:6px;"></i>Validation</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button onclick="nomSave('en_cours')" title="Enregistre la progression sans quitter la nomenclature" style="flex:1;padding:10px;border:1.5px solid #bfdbfe;border-radius:8px;background:#eff6ff;cursor:pointer;font-size:.78rem;font-weight:700;color:#1d4ed8;">
                <i class="fas fa-save" style="display:block;font-size:1.2rem;margin-bottom:4px;"></i>Enregistrer
              </button>
              <button onclick="nomSave('valide')" title="Fait passer la nomenclature dans la liste des nomenclatures faites" style="flex:1;padding:10px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);border:none;border-radius:8px;cursor:pointer;font-size:.78rem;font-weight:700;color:white;">
                <i class="fas fa-check-circle" style="display:block;font-size:1.2rem;margin-bottom:4px;"></i>Enregistrer et valider
              </button>
            </div>
            <div id="nom-f-id" style="display:none;"></div>
          </div>

          <!-- Journal EN 9100 : toutes les modifications d'une nomenclature validée -->
          <div id="nom-journal-card" style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:18px 20px;margin-top:14px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
              <div style="font-size:.72rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;"><i class="fas fa-clipboard-list" style="color:#8b5cf6;margin-right:6px;"></i>Journal des modifications · EN 9100</div>
              <select id="nom-journal-portee" onchange="nomJournalLoad()" style="margin-left:auto;border:1.5px solid #e2e8f0;border-radius:7px;padding:3px 6px;font-size:.7rem;background:#f8fafc;">
                <option value="fiche">Cette révision</option>
                <option value="groupe">Toutes les révisions</option>
              </select>
            </div>
            <div id="nom-journal-list" style="font-size:.74rem;color:#475569;"><div style="color:#94a3b8;">Aucun historique avant le premier enregistrement.</div></div>
          </div>

        </div>
      </div>
    </div>
  </div>`

  // ── ONGLET ANALYSE DT ────────────────────────────────────────
  // Sérialise les données DTs pour le JS (pré-remplissage du panneau d'analyse).
  // IMPORTANT : inclure les DT analysées (DTS_OFFRES) et pas seulement celles en attente BE,
  // sinon le bouton « Visualiser » d'une DT déjà analysée (statut dans_offres) échoue
  // (« DT introuvable ») car beOuvrirAnalyseDT cherche l'id dans BE_DTS_MAP.
  const DTS_BE_JSON = JSON.stringify([...DTS_BE, ...DTS_OFFRES])
  const tabAnalyse = `
  <div id="be-panel-analyse" style="display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-drafting-compass" style="color:#6366f1;"></i>DTs en attente d'analyse BE
        <span style="background:#e0e7ff;color:#4338ca;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${DTS_BE.length}</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button onclick="beRfqOpen('analyse_dt')" style="background:linear-gradient(135deg,#0ea5e9,#0369a1);color:white;border:none;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer;font-size:.78rem;white-space:nowrap;"><i class="fas fa-file-invoice-dollar" style="margin-right:5px;"></i>Demande de prix</button>
        <input type="text" placeholder="Rechercher…" oninput="beFilter('be-tbl-analyse',this.value)"
          style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:200px;"/>
      </div>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      ${DTS_BE.length === 0 ? emptyRow('Aucune DT en attente d\'analyse BE') : `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="be-tbl-analyse">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;${TH}">N° DT / Affaire</th>
            <th style="text-align:left;${TH}">Client</th>
            <th style="text-align:left;${TH}">Pièce(s) · Qté</th>
            <th style="text-align:left;${TH}">Type DT</th>
            <th style="text-align:center;${TH}">Priorité</th>
            <th style="text-align:center;${TH}">Date DT</th>
            <th style="text-align:center;${TH}">Analyste</th>
            <th style="text-align:center;${TH}">Action</th>
          </tr></thead>
          <tbody>
            ${DTS_BE.map(dt => {
              const piecesAff = (dt.piecesDetail && dt.piecesDetail.length)
                ? (dt.piecesDetail as any[]).map(p=>`${escX(p.ref_interne||p.ref_client||'?')} <strong style="color:#15803d;">×${p.quantite||1}</strong>`).join('<br/>')
                : (dt.pieces||[]).map((x:any)=>escX(x)).join(', ')
              return `
            <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
              <td style="${TD}"><div style="font-weight:700;color:#6366f1;">${escX(dt.id)}</div><div style="font-size:.68rem;color:#9ca3af;">Aff. N°${escX(dt.numAffaire)}</div></td>
              <td style="${TD}font-weight:600;color:#374151;">${escX(dt.client)}</td>
              <td style="${TD}color:#6b7280;font-size:.76rem;max-width:200px;line-height:1.5;">${piecesAff||'<span style="color:#cbd5e1;font-style:italic;">aucune pièce</span>'}</td>
              <td style="${TD}">
                <span style="padding:2px 10px;border-radius:999px;font-size:.7rem;font-weight:700;${dt.type==='Nouveau produit'?'background:#ede9fe;color:#5b21b6;':dt.type==='Maj produit'?'background:#dbeafe;color:#1d4ed8;':'background:#fef9c3;color:#854d0e;'}">
                  ${escX(dt.type)}
                </span>
              </td>
              <td style="${TD}text-align:center;">${prioBadge(dt.priorite)}</td>
              <td style="${TD}text-align:center;font-size:.75rem;color:#6b7280;">${dt.date}</td>
              <td style="${TD}text-align:center;font-weight:600;color:#374151;font-size:.75rem;">${escX(dt.analyste)}</td>
              <td style="${TD}text-align:center;">
                <div style="display:flex;gap:4px;justify-content:center;">
                  <a href="/be/analyse?dt=${encodeURIComponent(dt.id)}"
                    style="padding:5px 12px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border-radius:7px;font-size:.72rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
                    <i class="fas fa-drafting-compass"></i>Analyser
                  </a>
                  <button onclick="beOuvrirAnalyseDT('${dt.id}')"
                    style="padding:5px 12px;background:#eef2ff;color:#4338ca;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Visualiser rapidement le CRU et la décomposition par pièce (lecture seule)">
                    <i class="fas fa-eye"></i>Visualiser
                  </button>
                </div>
              </td>
            </tr>`}).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
    <div style="margin-top:12px;background:#e0e7ff;border-radius:10px;padding:10px 16px;font-size:.76rem;color:#3730a3;">
      <i class="fas fa-lightbulb" style="margin-right:6px;"></i>
      Les pièces (réfs + quantités) saisies dans la DT côté commercial sont <strong>chargées automatiquement</strong> ci-dessous. Les DTs de type <strong>Nouveau produit</strong> génèrent une demande de nomenclature à l'onglet Nomenclatures.
    </div>

    <!-- DT ANALYSÉES (dans les offres) — ré-éditables tant que l'offre n'est pas acceptée -->
    <div style="margin-top:24px;display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-clipboard-check" style="color:#15803d;"></i>DT analysées — offres &amp; commandes
        <span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${DTS_OFFRES.length}</span>
      </div>
      <input type="text" placeholder="Rechercher…" oninput="beFilter('be-tbl-analysees',this.value)" style="margin-left:auto;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:200px;"/>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      ${DTS_OFFRES.length === 0 ? emptyRow('Aucune DT analysée pour le moment') : `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="be-tbl-analysees">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;${TH}">N° DT / Affaire</th>
            <th style="text-align:left;${TH}">Client</th>
            <th style="text-align:left;${TH}">Pièce(s) · Qté</th>
            <th style="text-align:right;${TH}">Montant offre</th>
            <th style="text-align:center;${TH}">Statut offre</th>
            <th style="text-align:center;${TH}">Action</th>
          </tr></thead>
          <tbody>
            ${DTS_OFFRES.map(dt => {
              const off = OFF_BY_DT[String(dt.id)]
              const accepted = offAcceptedBE(off)
              const cmdCreee = dt.statut === 'commande_creee'
              const frozen = accepted || cmdCreee   // analyse figée : offre acceptée OU commande créée (terminée)
              const piecesAff = (dt.piecesDetail && dt.piecesDetail.length)
                ? (dt.piecesDetail as any[]).map(p=>`${escX(p.ref_interne||p.ref_client||'?')} <strong style="color:#15803d;">×${p.quantite||1}</strong>`).join('<br/>')
                : (dt.pieces||[]).map((x:any)=>escX(x)).join(', ')
              const montant = off && off.montant != null ? Number(off.montant).toLocaleString('fr-FR') + ' €' : '—'
              const statutBadge = cmdCreee
                ? "<span style='background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:800;'>Commande créée</span>"
                : !off
                ? "<span style='background:#f1f5f9;color:#6b7280;border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:800;'>Pas d'offre</span>"
                : accepted
                ? "<span style='background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:800;'>Offre acceptée</span>"
                : "<span style='background:#e0e7ff;color:#3730a3;border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:800;'>Offre en cours</span>"
              const action = frozen
                ? `<span style="display:inline-flex;align-items:center;gap:4px;color:#9ca3af;font-size:.7rem;font-weight:700;" title="${cmdCreee ? 'Commande créée' : 'Offre acceptée'} : l'analyse est figée."><i class="fas fa-lock"></i>Analyse figée</span>
                   <button onclick="beOuvrirAnalyseDT('${dt.id}')" style="padding:5px 12px;background:#eef2ff;color:#4338ca;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-eye"></i> Visualiser</button>`
                : `<a href="/be/analyse?dt=${encodeURIComponent(dt.id)}" style="padding:5px 12px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border-radius:7px;font-size:.72rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-pen-to-square"></i>Ré-éditer l'analyse</a>
                   <button onclick="beOuvrirAnalyseDT('${dt.id}')" style="padding:5px 12px;background:#eef2ff;color:#4338ca;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-eye"></i> Visualiser</button>`
              return `
            <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
              <td style="${TD}"><div style="font-weight:700;color:#6366f1;">${escX(dt.id)}</div><div style="font-size:.68rem;color:#9ca3af;">Aff. N°${escX(dt.numAffaire)}</div></td>
              <td style="${TD}font-weight:600;color:#374151;">${escX(dt.client)}</td>
              <td style="${TD}color:#6b7280;font-size:.76rem;max-width:200px;line-height:1.5;">${piecesAff || '—'}</td>
              <td style="${TD}text-align:right;font-weight:700;color:#374151;">${montant}</td>
              <td style="${TD}text-align:center;">${statutBadge}</td>
              <td style="${TD}text-align:center;"><div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">${action}</div></td>
            </tr>`}).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
    <div style="margin-top:10px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 16px;font-size:.76rem;color:#166534;">
      <i class="fas fa-circle-info" style="margin-right:6px;"></i>
      L'analyse d'une DT reste <strong>ré-éditable</strong> tant que son offre n'a pas été <strong>acceptée</strong> par le client. Les <strong>marges par produit</strong> fixées dans l'offre sont conservées lors d'une ré-édition.
    </div>

    <!-- PANNEAU ANALYSE DT (pièces téléversées depuis la DT commercial) -->
    <div id="be-analyse-detail" style="display:none;background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-top:16px;border-top:3px solid #6366f1;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
        <div>
          <div style="font-size:.95rem;font-weight:800;color:#1e1b4b;display:flex;align-items:center;gap:8px;"><i class="fas fa-eye" style="color:#6366f1;"></i>Visualisation DT <span id="be-ad-id" style="font-family:monospace;color:#1e1b4b;"></span> <span style="background:#eef2ff;color:#4338ca;border-radius:6px;padding:1px 7px;font-size:.6rem;font-weight:800;letter-spacing:.04em;">LECTURE SEULE</span></div>
          <div style="font-size:.72rem;color:#6b7280;margin-top:4px;">Client <strong id="be-ad-client">—</strong> · Type <strong id="be-ad-type">—</strong> · Activité <strong id="be-ad-activite">—</strong> · Priorité <strong id="be-ad-prio">—</strong></div>
        </div>
        <button onclick="beFermerAnalyseDT()" style="background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.78rem;cursor:pointer;color:#374151;"><i class="fas fa-times" style="margin-right:4px;"></i>Fermer</button>
      </div>
      <div id="be-ad-banner" style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:#3730a3;">
        <i class="fas fa-calculator" style="margin-right:6px;"></i>Analyse auto-calculée depuis les <strong>nomenclatures validées</strong> des pièces : matière (pour la quantité), MO, machine, réglage et sous-traitance (forfait minimum inclus).
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.78rem;">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;${TH}">Réf. interne</th>
            <th style="text-align:left;${TH}">Nomenclature</th>
            <th style="text-align:right;${TH}">Qté</th>
            <th style="text-align:right;${TH}" title="Matière + accessoires pour la quantité">Matière</th>
            <th style="text-align:right;${TH}" title="Main d'œuvre (réglage inclus) pour la quantité">MO</th>
            <th style="text-align:right;${TH}">Machine</th>
            <th style="text-align:right;${TH}" title="Sous-traitance : max(forfait ; qté×unitaire)">S/traitance</th>
            <th style="text-align:right;${TH}">Total série</th>
            <th style="text-align:right;${TH}">€ / pièce</th>
          </tr></thead>
          <tbody id="be-ad-pieces"></tbody>
          <tfoot id="be-ad-foot"></tfoot>
        </table>
      </div>
      <div style="margin-top:12px;font-size:.7rem;color:#94a3b8;"><i class="fas fa-eye" style="margin-right:5px;"></i>Vue en lecture seule (CRU &amp; décomposition par pièce). Pour éditer la gamme, les coûts, l'analyste et les exigences, ouvrez le formulaire complet via « Analyser ». Les BDT/BDS sont générés à la validation de la commande, puis visibles en production.</div>
    </div>
  </div>`

  // ── ONGLET PRÉPARATIONS TECHNIQUES ───────────────────────────
  const tabPrep = `
  <div id="be-panel-prep" style="display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-cogs" style="color:#0891b2;"></i>Préparations techniques en attente
        <span style="background:#cffafe;color:#0e7490;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${PREPS_A_FAIRE.length}</span>
      </div>
      <input type="text" placeholder="Rechercher…" oninput="beFilter('be-tbl-prep',this.value)"
        style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:200px;"/>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      ${PREPS_A_FAIRE.length === 0 ? emptyRow('Aucune préparation technique en attente') : `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="be-tbl-prep">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;${TH}">N° préparation</th>
            <th style="text-align:left;${TH}">DT / Affaire</th>
            <th style="text-align:left;${TH}">Pièce</th>
            <th style="text-align:left;${TH}">Ce qui reste à préparer</th>
            <th style="text-align:center;${TH}">Commande</th>
            <th style="text-align:center;${TH}">Action</th>
          </tr></thead>
          <tbody>
            ${PREPS_A_FAIRE.map((p: any) => {
              const reste = [p.manque_plan ? 'Plan' : '', p.manque_code_cnc ? 'Programme CN (FAO)' : ''].filter(Boolean)
              return `
            <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
              <td style="${TD}font-weight:700;color:#0891b2;font-size:.78rem;">${escX(p.id)}</td>
              <td style="${TD}"><div style="font-weight:700;color:#374151;font-size:.78rem;">${escX(p.dt_ref ?? '—')}</div><div style="font-size:.68rem;color:#6366f1;">Aff. N°${escX(p.num_affaire ?? '—')}</div></td>
              <td style="${TD}font-weight:600;color:#374151;">${escX(p.piece ?? p.code_ref_produit ?? '—')}</td>
              <td style="${TD}color:#6b7280;font-size:.78rem;">${reste.length ? escX(reste.join(' + ')) : 'Préparation technique'}</td>
              <td style="${TD}text-align:center;font-size:.75rem;color:#6b7280;">${escX(p.cmd_ref ?? '—')}</td>
              <td style="${TD}text-align:center;">
                <a href="/be/preparation" style="padding:5px 12px;background:linear-gradient(135deg,#0891b2,#0e7490);color:white;border-radius:7px;font-size:.72rem;font-weight:700;text-decoration:none;">
                  <i class="fas fa-cogs" style="margin-right:4px;"></i>Préparer
                </a>
              </td>
            </tr>`}).join('')}
          </tbody>
        </table>
      </div>`}
    </div>

    <!-- Les preparations techniques DEJA TRAITEES, juste sous celles a traiter.
         Source : la table preparations_techniques (statut « faite »), c'est-a-dire
         ce que la validation de prepa met a jour. -->
    <div style="margin-top:26px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
        <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-check-double" style="color:#16a34a;"></i>Préparations techniques traitées
          <span style="background:#dcfce7;color:#166534;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${PREPS_FAITES.length}</span>
        </div>
        <span style="font-size:.72rem;color:#9ca3af;font-weight:600;">· plan et codes programme enregistrés dans la nomenclature · la porte production du lot est ouverte</span>
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;font-size:.82rem;">
          <thead><tr style="background:#f0fdf4;border-bottom:2px solid #dcfce7;">
            ${['N° préparation', 'DT / Affaire', 'Pièce', 'Ce qui a été préparé', 'Terminée le']
              .map((t, i) => `<th style="text-align:${i >= 4 ? 'center' : 'left'};padding:10px 14px;color:#166534;font-size:.68rem;text-transform:uppercase;font-weight:700;">${t}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${PREPS_FAITES.length === 0
              ? `<tr><td colspan="5" style="padding:34px;text-align:center;color:#9ca3af;font-size:.82rem;"><i class="fas fa-inbox" style="font-size:1.6rem;display:block;margin-bottom:6px;"></i>Aucune préparation terminée pour le moment.</td></tr>`
              : PREPS_FAITES.map((p: any) => {
                  const manques = [p.manque_plan ? 'Plan' : '', p.manque_code_cnc ? 'Programme CN (FAO)' : ''].filter(Boolean)
                  return `<tr style="border-bottom:1px solid #f9fafb;">
                    <td style="padding:10px 14px;font-weight:700;color:#0891b2;font-size:.78rem;">${escX(p.id)}</td>
                    <td style="padding:10px 14px;"><div style="font-weight:700;color:#374151;font-size:.78rem;">${escX(p.dt_ref ?? '—')}</div><div style="font-size:.68rem;color:#6366f1;">Affaire N° ${escX(p.num_affaire ?? '—')}</div></td>
                    <td style="padding:10px 14px;color:#374151;font-weight:600;">${escX(p.piece ?? p.code_ref_produit ?? '—')}</td>
                    <td style="padding:10px 14px;color:#475569;font-size:.78rem;">${manques.length ? escX(manques.join(' + ')) : 'Préparation technique'}</td>
                    <td style="padding:10px 14px;text-align:center;color:#6b7280;font-size:.78rem;">${escX(String(p.updated_at ?? '').slice(0, 10) || '—')}</td>
                  </tr>`
                }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`

  // ── ONGLET DASHBOARD ──────────────────────────────────────────
  const dtsBE     = DTS_BE.length
  const cmdsPrep  = CMDS_PREP.length
  const nomsPend  = NOMS_PEND.length
  const critiques = DTS_BE.filter(d => d.priorite === 'critique').length
  const urgents   = DTS_BE.filter(d => d.priorite === 'urgent').length
  const dtsOffres = DTS.filter(d => d.statut === 'dans_offres').length
  const dtsCmds   = DTS.filter(d => d.statut === 'commande_creee').length
  const dtsRefus  = DTS.filter(d => d.statut === 'refus').length
  const nomsValid = NOMS.filter(n => n.statut === 'valide').length

  const tabDashboard = `
  <div id="be-panel-dashboard" style="display:none;">
    <div style="font-size:1rem;font-weight:800;color:#111827;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
      <i class="fas fa-chart-bar" style="color:#f59e0b;"></i>Dashboard Bureau d'Études
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${([
        ['DTs en attente BE',    dtsBE,     '#6366f1','fa-drafting-compass'],
        ['Nomenclatures en cours', nomsPend, '#8b5cf6','fa-sitemap'],
        ['Préparations',         cmdsPrep,  '#0891b2','fa-cogs'],
        ['Nomenclatures validées',nomsValid,'#10b981','fa-check-circle'],
      ] as [string,number,string,string][]).map(([l,v,c,ic]) => `
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${c};text-align:center;">
        <i class="fas ${ic}" style="font-size:1.2rem;color:${c};margin-bottom:8px;display:block;"></i>
        <div style="font-size:1.8rem;font-weight:800;color:${c};">${v}</div>
        <div style="font-size:.7rem;color:#6b7280;font-weight:600;margin-top:4px;">${l}</div>
      </div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
        <div style="font-size:.78rem;font-weight:800;color:#374151;margin-bottom:14px;"><i class="fas fa-stream" style="color:#6366f1;margin-right:6px;"></i>Pipeline DTs</div>
        ${([
          ['En attente BE',    dtsBE,    '#fef3c7','#92400e'],
          ['Dans les offres',  dtsOffres,'#e0e7ff','#3730a3'],
          ['Commandes créées', dtsCmds,  '#d1fae5','#065f46'],
          ['Refus',            dtsRefus, '#fee2e2','#b91c1c'],
        ] as [string,number,string,string][]).map(([l,v,bg,col]) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:8px;margin-bottom:6px;background:${bg};">
          <span style="font-size:.78rem;font-weight:600;color:${col};">${l}</span>
          <span style="font-size:.9rem;font-weight:800;color:${col};">${v}</span>
        </div>`).join('')}
      </div>
      <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
        <div style="font-size:.78rem;font-weight:800;color:#374151;margin-bottom:14px;"><i class="fas fa-exclamation-triangle" style="color:#f59e0b;margin-right:6px;"></i>Alertes</div>
        ${critiques > 0 ? `<div style="background:#fee2e2;border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;"><i class="fas fa-exclamation-circle" style="color:#b91c1c;font-size:1.1rem;"></i><div><div style="font-size:.82rem;font-weight:700;color:#b91c1c;">${critiques} DT(s) CRITIQUE(S)</div><div style="font-size:.7rem;color:#ef4444;">Traitement prioritaire immédiat</div></div></div>` : ''}
        ${urgents > 0 ? `<div style="background:#fef3c7;border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;"><i class="fas fa-clock" style="color:#854d0e;font-size:1.1rem;"></i><div><div style="font-size:.82rem;font-weight:700;color:#854d0e;">${urgents} DT(s) URGENT(ES)</div></div></div>` : ''}
        ${nomsPend > 0 ? `<div style="background:#ede9fe;border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;"><i class="fas fa-sitemap" style="color:#5b21b6;"></i><div><div style="font-size:.82rem;font-weight:700;color:#5b21b6;">${nomsPend} nomenclature(s) en attente</div></div></div>` : ''}
        ${cmdsPrep > 0 ? `<div style="background:#dbeafe;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;"><i class="fas fa-cogs" style="color:#1d4ed8;"></i><div><div style="font-size:.82rem;font-weight:700;color:#1d4ed8;">${cmdsPrep} préparation(s) bloquent la production</div></div></div>` : ''}
        ${critiques === 0 && urgents === 0 && nomsPend === 0 && cmdsPrep === 0 ? `<div style="text-align:center;padding:24px;color:#9ca3af;"><i class="fas fa-check-circle" style="font-size:1.8rem;color:#bbf7d0;display:block;margin-bottom:8px;"></i><div style="font-weight:600;">Aucune alerte active</div></div>` : ''}
      </div>
    </div>
    <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
      <div style="font-size:.78rem;font-weight:800;color:#374151;margin-bottom:14px;"><i class="fas fa-bolt" style="color:#f59e0b;margin-right:6px;"></i>Accès rapides</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        ${([
          ['#be-noms',    '#8b5cf6','fa-sitemap',         'Nomenclatures',       'Créer · Suivre · Valider'],
          ['#be-analyse', '#6366f1','fa-drafting-compass','Analyse DT',          'Faisabilité & CRU'],
          ['#be-prep',    '#0891b2','fa-cogs',             'Prépa technique',     'Plans & Gammes'],
        ] as [string,string,string,string,string][]).map(([tab,col,ic,titre,sous]) => `
        <button onclick="switchBETab('${tab.replace('#be-','')}')" style="background:${col}11;border:1.5px solid ${col}33;border-radius:10px;padding:14px;cursor:pointer;text-align:center;display:block;width:100%;"
           onmouseenter="this.style.background='${col}22'" onmouseleave="this.style.background='${col}11'">
          <i class="fas ${ic}" style="font-size:1.4rem;color:${col};display:block;margin-bottom:8px;"></i>
          <div style="font-size:.8rem;font-weight:700;color:${col};">${titre}</div>
          <div style="font-size:.68rem;color:#6b7280;margin-top:3px;">${sous}</div>
        </button>`).join('')}
      </div>
    </div>
  </div>`

  // ── ONGLET RÉFÉRENCES (matières / fournitures / outils) ──────
  const refEsc = (s: any) => String(s ?? '').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  // Échappement pour un argument JS en chaîne simple-quote DANS un onclick (gère l'apostrophe : « Vis d'assemblage »)
  const refJs = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/</g, '&lt;')
  const REF_CATS: [string, string][] = [
    ['matiere_premiere', 'Matière'], ['accessoire', 'Accessoires'], ['outillage', 'Outils'],
    ['chimique', 'Produits chimiques'], ['consommable', 'Consommable'], ['autre', 'Autres'],
  ]
  const famGroup = (f: string) => f === 'matiere_premiere' ? 'matiere_premiere' : ((f === 'accessoire' || f === 'fourniture' || f === 'composant') ? 'accessoire' : (f === 'outillage' ? 'outillage' : (f === 'chimique' ? 'chimique' : (f === 'consommable' ? 'consommable' : 'autre'))))
  const famLabel = (f: string) => (REF_CATS.find(c => c[0] === famGroup(f)) || ['', 'Autres'])[1]
  const refRows = REFS_STOCK.map((r: any) => {
    const grp = famGroup(r.famille || ''); const act = r.activite || 'both'
    const prix = r.prix != null ? Number(r.prix).toFixed(2) + ' €' : '—'
    // Lot H1 : la qté/paquet d'un accessoire se déclare ICI (catalogue), plus ligne par ligne dans
    // chaque nomenclature. Non déclarée sur un accessoire = prix compris « à la pièce » (signalé
    // en orange dans l'éditeur) : on le dit dès la liste.
    const qpv = QTE_PAQUET_PAR_ID[String(r.id ?? '')] ?? null
    const qpCell = grp === 'accessoire'
      ? (qpv != null
        ? `<span title="Le prix catalogue est celui d'un paquet de ${qpv} pièce(s)" style="font-weight:800;color:#6d28d9;">${escX(String(qpv))}</span>`
        : `<span title="Conditionnement non déclaré : le prix catalogue sera compris comme un prix à la pièce. Cliquez « Éditer » pour saisir la quantité par paquet." style="color:#c2410c;font-weight:700;">non déclarée</span>`)
      : '<span style="color:#cbd5e1;">—</span>'
    // Prix « à re-demander » = absent, ou daté de plus de PRIX_VALIDITE_JOURS (6 mois) — constante de shared.ts
    const _dd = r.derniere_date ? Date.parse(r.derniere_date) : NaN
    const needsRfq = (r.prix == null) || isNaN(_dd) || (Date.now() - _dd) >= PRIX_VALIDITE_JOURS * 86400000
    // Demande de prix possible À TOUT MOMENT (lot H0) ; aspect « conseillé » (orange) seulement si prix absent ou périmé
    const rfqBtn = `<button onclick="beRfqForRef('${refJs(r.reference)}','${refJs(r.designation)}','${grp}')" title="${needsRfq ? `Prix absent ou daté de plus de ${PRIX_VALIDITE_LIB} — demande de prix conseillée` : `Prix de moins de ${PRIX_VALIDITE_LIB} — vous pouvez tout de même redemander un prix`}" style="${needsRfq ? 'background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;' : 'background:#f8fafc;color:#475569;border:1px solid #e2e8f0;'}border-radius:6px;padding:4px 9px;font-size:.68rem;font-weight:700;cursor:pointer;margin-left:5px;"><i class="fas fa-file-invoice-dollar" style="margin-right:4px;"></i>Demande de prix</button>`
    return `<tr data-cat="${grp}" data-act="${refEsc(act)}" style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:7px 10px;font-weight:700;color:#4338ca;font-size:.78rem;">${refEsc(r.reference)}</td>
      <td style="padding:7px 10px;font-size:.78rem;color:#374151;">${refEsc(r.designation)}</td>
      <td style="padding:7px 10px;"><span style="background:#eef2ff;color:#4338ca;border-radius:6px;padding:1px 8px;font-size:.64rem;font-weight:700;">${refEsc(famLabel(r.famille || ''))}${r.categorie && grp === 'matiere_premiere' ? ' · ' + refEsc(r.categorie) : ''}</span></td>
      <td style="padding:7px 10px;"><span style="background:${act === 'Seem' ? '#dbeafe' : act === 'Semrac' ? '#fce7f3' : '#f1f5f9'};color:${act === 'Seem' ? '#1d4ed8' : act === 'Semrac' ? '#9d174d' : '#475569'};border-radius:6px;padding:1px 8px;font-size:.64rem;font-weight:700;">${refEsc(act)}</span></td>
      <td style="padding:7px 10px;font-size:.76rem;color:#64748b;">${refEsc(r.fournisseur_nom || '—')}</td>
      <td style="padding:7px 10px;text-align:right;font-size:.74rem;">${qpCell}</td>
      <td style="padding:7px 10px;text-align:right;font-weight:800;color:#0f766e;font-size:.8rem;">${prix}</td>
      <td style="padding:7px 10px;text-align:center;white-space:nowrap;"><button onclick="beEditCatalog('${refJs(r.id)}','${refJs(r.fournisseur_id||'')}','${refJs(r.reference)}','${refJs(r.designation)}','${grp}','${refJs(act)}','${refJs(qpv == null ? '' : String(qpv))}','${refJs(r.prix == null ? '' : String(r.prix))}')" title="Modifier cette référence" style="background:#ecfdf5;color:#047857;border:none;border-radius:6px;padding:4px 9px;font-size:.68rem;font-weight:700;cursor:pointer;margin-right:5px;"><i class="fas fa-pen" style="margin-right:4px;"></i>Éditer</button><button onclick="refEvol('${refEsc(r.reference)}',this)" data-desig="${refEsc(r.designation)}" style="background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:4px 9px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-chart-line" style="margin-right:4px;"></i>Évolution</button>${rfqBtn}</td>
    </tr>`
  }).join('')
  const catPill = (cat: string, lbl: string) => `<button onclick="refSetCat('${cat}')" id="refcat-${cat}" class="ref-pill" style="border:1.5px solid #e2e8f0;background:white;color:#475569;border-radius:999px;padding:5px 13px;font-size:.74rem;font-weight:700;cursor:pointer;">${lbl}</button>`
  const tabRefs = `
  <div id="be-panel-refs" style="display:none;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
      <span style="font-weight:800;font-size:1rem;color:#1e293b;"><i class="fas fa-boxes" style="color:#6366f1;margin-right:7px;"></i>Références — matières, fournitures &amp; outils</span>
      <span style="color:#94a3b8;font-size:.74rem;">${REFS_STOCK.length} référence(s)</span>
    </div>
    <div style="font-size:.74rem;color:#64748b;margin-bottom:10px;">Catalogue des références achetées. « Évolution » montre le prix unitaire au fil des bons de commande. Le catalogue s'alimente automatiquement à la validation des BC, des demandes de prix, et <strong>depuis les nomenclatures du BE</strong>. La <strong>quantité par paquet</strong> d'un accessoire se déclare ici (« Éditer ») : c'est elle qui ramène le prix d'un paquet au prix d'une pièce dans les nomenclatures.</div>
    ${ACC_SANS_QP > 0 ? `<div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:.72rem;color:#9a3412;"><i class="fas fa-triangle-exclamation" style="margin-right:6px;"></i><strong>${ACC_SANS_QP} accessoire(s)</strong> n'ont pas de quantité par paquet déclarée : leur prix catalogue est compris <strong>à la pièce</strong> dans le prix moyen des nomenclatures (signalé en orange). Cliquez « Éditer » sur la ligne pour la saisir.</div>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
      <button onclick="beOpenFournModal()" style="background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:8px;padding:6px 12px;font-size:.75rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Fournisseur / Sous-traitant</button>
      <button onclick="beOpenCatalogModal()" style="background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;border-radius:8px;padding:6px 12px;font-size:.75rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Entrée catalogue</button>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;align-items:center;">
      <span style="font-size:.66rem;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-right:2px;">Catégorie</span>
      ${catPill('all', 'Toutes')}${REF_CATS.map(c => catPill(c[0], c[1])).join('')}
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">
      <span style="font-size:.66rem;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-right:2px;">Activité</span>
      <button onclick="refSetAct('all')" id="refact-all" class="ref-apill" style="border:1.5px solid #e2e8f0;background:#6366f1;color:white;border-radius:999px;padding:5px 13px;font-size:.74rem;font-weight:700;cursor:pointer;">Tous</button>
      <button onclick="refSetAct('Seem')" id="refact-Seem" class="ref-apill" style="border:1.5px solid #e2e8f0;background:white;color:#475569;border-radius:999px;padding:5px 13px;font-size:.74rem;font-weight:700;cursor:pointer;">Seem</button>
      <button onclick="refSetAct('Semrac')" id="refact-Semrac" class="ref-apill" style="border:1.5px solid #e2e8f0;background:white;color:#475569;border-radius:999px;padding:5px 13px;font-size:.74rem;font-weight:700;cursor:pointer;">Semrac</button>
      <input id="ref-search" oninput="refApply()" placeholder="🔍 réf, désignation, fournisseur…" style="margin-left:auto;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 11px;font-size:.76rem;outline:none;min-width:240px;"/>
    </div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;max-height:640px;overflow-y:auto;">
        <table id="be-refs-table" style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;position:sticky;top:0;">${[['Réf.', ''], ['Désignation', ''], ['Catégorie', ''], ['Activité', ''], ['Fournisseur', ''], ['Qté/paquet', "Accessoires : nombre de pièces par paquet, auquel se rapporte le prix catalogue. C'est ICI qu'il se déclare (plus dans chaque nomenclature)."], ['Dernier PU', ''], ['Évolution', '']].map(([h, t]) => `<th${t ? ` title="${escX(t)}"` : ''} style="padding:8px 10px;text-align:left;font-size:.62rem;text-transform:uppercase;color:#6b7280;font-weight:700;">${h}</th>`).join('')}</tr></thead>
          <tbody>${refRows || '<tr><td colspan="8" style="text-align:center;padding:30px;color:#cbd5e1;font-size:.8rem;">Aucune référence.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  </div>`

  // ── ASSEMBLAGE ───────────────────────────────────────────────
  const content = `
  ${serviceHeader({
    icon: 'fa-drafting-compass',
    color: '#6366f1',
    darkBg: '#1e1b4b',
    title: "Bureau d'Études",
    subtitle: 'Bureau d\'études · Nomenclatures · Analyse DT · Prépa technique · EN 9100:2018 §7.3',
    tabs: [
      { id: 'noms',      label: 'Nomenclatures',    icon: 'fa-sitemap',          badge: NOMS_PEND.length + piecesToFaireTotal },
      { id: 'analyse',   label: 'Analyse DT',       icon: 'fa-drafting-compass', badge: DTS_BE.length },
      { id: 'prep',      label: 'Préparations tech.', icon: 'fa-cogs',           badge: PREPS_A_FAIRE.length },   // le badge suit la liste affichee
      { id: 'refs',      label: 'Références',        icon: 'fa-boxes',            badge: REFS_STOCK.length },
      { id: 'dashboard', label: 'Dashboard BE',     icon: 'fa-chart-bar' },
    ],
    switchFn: 'switchBETab',
    tabIdPrefix: 'be-tab',
    activeId: 'noms'
  })}

  <div style="padding:22px 30px;">
    ${tabNoms}
    ${tabAnalyse}
    ${tabPrep}
    ${tabRefs}
    ${tabDashboard}
  </div>

  <div id="refEvolModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000;align-items:center;justify-content:center;" onclick="if(event.target===this)this.style.display='none'">
    <div style="background:white;border-radius:14px;padding:20px;width:640px;max-width:94vw;max-height:88vh;overflow:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <span id="refEvolTitle" style="font-weight:800;color:#1e293b;font-size:.95rem;"><i class="fas fa-chart-line" style="color:#6366f1;margin-right:6px;"></i></span>
        <button onclick="document.getElementById('refEvolModal').style.display='none'" style="background:#f1f5f9;border:none;border-radius:8px;padding:6px 11px;cursor:pointer;font-size:.8rem;">Fermer</button>
      </div>
      <div id="refEvolBody"></div>
    </div>
  </div>

  <div id="be-rfq-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2100;align-items:center;justify-content:center;" onclick="if(event.target===this)this.style.display='none'">
    <div style="background:white;border-radius:16px;width:720px;max-width:95vw;max-height:90vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="padding:16px 22px;background:linear-gradient(135deg,#0ea5e9,#0369a1);border-radius:16px 16px 0 0;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-weight:800;color:white;"><i class="fas fa-file-invoice-dollar" style="margin-right:8px;"></i>Nouvelle demande de prix</div>
        <button onclick="document.getElementById('be-rfq-overlay').style.display='none'" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:18px 22px;">
        <input type="hidden" id="be-rfq-origine"/>
        <div style="font-size:.74rem;color:#64748b;margin-bottom:12px;">Listez les articles à chiffrer. La demande part au service Achats (« À traiter »). Le <strong>prix officiel</strong> sera mis à jour à la validation de la réponse.</div>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <input id="be-rfq-dtref" placeholder="N° affaire / DT à lier (vide = demande libre)" style="flex:1;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.8rem;"/>
          <input id="be-rfq-notes" placeholder="Note (optionnel)" style="flex:1;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.8rem;"/>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f8fafc;">${['Référence', 'Désignation *', 'Qté est.', 'Catégorie', ''].map((h, i) => `<th style="text-align:${i === 2 ? 'right' : 'left'};padding:5px 8px;font-size:.6rem;text-transform:uppercase;color:#6b7280;">${h}</th>`).join('')}</tr></thead>
          <tbody id="be-rfq-lines"></tbody>
        </table>
        <button onclick="beRfqAddLine()" style="margin-top:8px;background:#eef2ff;color:#4338ca;border:none;border-radius:7px;padding:5px 11px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:4px;"></i>Ajouter un article</button>
        <!-- Lot H1 §6 : destinataires. Une ligne de nomenclature n'a plus de fournisseur ; on propose
             donc TOUS ceux qui portent la référence au catalogue (cochés d'office), sinon le choix libre. -->
        <div id="be-rfq-dest-wrap" style="display:none;margin-top:14px;border-top:1px solid #f1f5f9;padding-top:12px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
            <span style="font-size:.66rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;"><i class="fas fa-paper-plane" style="margin-right:5px;color:#0ea5e9;"></i>Destinataires</span>
            <span id="be-rfq-dest-info" style="font-size:.68rem;color:#94a3b8;"></span>
            <span style="margin-left:auto;display:inline-flex;gap:6px;">
              <button type="button" onclick="beRfqDestAll(true)" style="background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;border-radius:6px;padding:3px 9px;font-size:.66rem;font-weight:700;cursor:pointer;">Tout cocher</button>
              <button type="button" onclick="beRfqDestAll(false)" style="background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;border-radius:6px;padding:3px 9px;font-size:.66rem;font-weight:700;cursor:pointer;">Tout décocher</button>
            </span>
          </div>
          <div id="be-rfq-dest" style="display:flex;flex-wrap:wrap;gap:6px 14px;max-height:170px;overflow-y:auto;"></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;border-top:1px solid #f1f5f9;padding-top:14px;">
          <button onclick="document.getElementById('be-rfq-overlay').style.display='none'" style="background:#f1f5f9;color:#374151;border:none;border-radius:8px;padding:8px 16px;font-weight:600;cursor:pointer;">Annuler</button>
          <button onclick="beRfqSubmit()" style="background:linear-gradient(135deg,#0ea5e9,#0369a1);color:white;border:none;border-radius:8px;padding:8px 16px;font-weight:800;cursor:pointer;"><i class="fas fa-paper-plane" style="margin-right:5px;"></i>Envoyer aux Achats</button>
        </div>
      </div>
    </div>
  </div>

  <!-- (Modales création machine / process retirées : machines & process se gèrent en Production → « Postes & Process ») -->

  <!-- Modale création fournisseur / sous-traitant (point 8) -->
  <div id="be-fourn-overlay" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:22px;width:460px;max-width:94vw;max-height:90vh;overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.35);">
      <div style="font-size:.95rem;font-weight:800;color:#1e293b;margin-bottom:14px;"><i class="fas fa-truck" style="color:#4338ca;margin-right:6px;"></i>Nouveau fournisseur / sous-traitant</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Type</label><select id="befn-type" onchange="beFournTypeChange()" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"><option value="fournisseur">Fournisseur</option><option value="sous_traitant">Sous-traitant</option></select></div>
        <div><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Code</label><input id="befn-code" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"/></div>
        <div style="grid-column:1/-1;"><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Nom *</label><input id="befn-nom" placeholder="Raison sociale" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"/></div>
        <div><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Email</label><input id="befn-email" type="email" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"/></div>
        <div><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Téléphone</label><input id="befn-tel" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"/></div>
        <div id="befn-prest-wrap" style="grid-column:1/-1;display:none;"><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Prestations (séparées par des virgules)</label><input id="befn-prest" placeholder="ex: Oxydation, Sérigraphie, Zingage" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"/></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;border-top:1px solid #f1f5f9;padding-top:14px;">
        <button onclick="document.getElementById('be-fourn-overlay').style.display='none'" style="background:#f1f5f9;color:#374151;border:none;border-radius:8px;padding:8px 16px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="beSaveFourn()" style="background:linear-gradient(135deg,#4f46e5,#4338ca);color:white;border:none;border-radius:8px;padding:8px 16px;font-weight:800;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i>Créer</button>
      </div>
    </div>
  </div>
  <!-- Modale entrée catalogue (point 8) -->
  <div id="be-catalog-overlay" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:22px;width:460px;max-width:94vw;max-height:90vh;overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.35);">
      <div id="becat-title" style="font-size:.95rem;font-weight:800;color:#1e293b;margin-bottom:14px;"><i class="fas fa-book" style="color:#047857;margin-right:6px;"></i>Nouvelle entrée catalogue</div>
      <input type="hidden" id="becat-id"/>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="grid-column:1/-1;"><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Fournisseur</label><select id="becat-fourn" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"></select></div>
        <div><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Référence *</label><input id="becat-ref" placeholder="réf. catalogue" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"/></div>
        <div><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Catégorie</label><select id="becat-cat" onchange="beCatMaj()" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"><option value="matiere_premiere">Matière</option><option value="accessoire">Accessoire</option><option value="outillage">Outillage</option><option value="consommable">Consommable</option><option value="chimique">Chimique</option><option value="autre">Autres</option></select></div>
        <div style="grid-column:1/-1;"><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Désignation *</label><input id="becat-desig" placeholder="libellé produit" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"/></div>
        <div><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Prix HT (optionnel)</label><input id="becat-prix" type="number" step="0.01" placeholder="sinon « en attente »" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"/></div>
        <div><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Activité</label><select id="becat-act" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"><option value="both">Les deux</option><option value="Seem">Seem</option><option value="Semrac">Semrac</option></select></div>
        <div id="becat-qtepaq-wrap" style="grid-column:1/-1;"><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Quantité par paquet <span style="font-weight:500;text-transform:none;color:#94a3b8;">(accessoires — nb de pièces auquel se rapporte le prix ci-dessus)</span></label><input id="becat-qtepaq" type="number" step="1" min="1" placeholder="ex : 100 (vide = non déclarée)" title="Le prix catalogue d'un accessoire est le prix du PAQUET. Sans cette quantité, il sera compris comme un prix à la pièce." style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"/></div>
      </div>
      <div id="becat-note" style="font-size:.66rem;color:#94a3b8;margin-top:8px;">Sans prix, l'entrée reste « en attente de prix » (à compléter via une demande de prix). La quantité par paquet se déclare <strong>uniquement ici</strong> : les nomenclatures n'en portent plus.</div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;border-top:1px solid #f1f5f9;padding-top:14px;">
        <button onclick="document.getElementById('be-catalog-overlay').style.display='none'" style="background:#f1f5f9;color:#374151;border:none;border-radius:8px;padding:8px 16px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="beSaveCatalog()" style="background:linear-gradient(135deg,#059669,#047857);color:white;border:none;border-radius:8px;padding:8px 16px;font-weight:800;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i>Enregistrer</button>
      </div>
    </div>
  </div>

  <!-- Lot H1 : liste déroulante filtrée « réf OU désignation » (un seul popup pour toutes les lignes) -->
  <div id="nom-ref-pop" role="listbox" aria-label="Références du catalogue"></div>
  <!-- Lot H1 : détail du prix moyen d'une référence (clic sur la cellule « Prix estimé / pièce ») -->
  <div id="nom-prix-detail"></div>

  <style>
  /* ── Compartiments Matière / Accessoires (lot H1 §10, 17/09/2026) ────────────────────────────────
     UNE classe de grille par compartiment, partagée TELLE QUELLE par l'en-tête et par les lignes
     (nomRenderMatieres / nomRenderAccessoires) : deux gabarits recopiés à la main décalaient les
     colonnes de 38 à 50 px. Six pistes seulement depuis le retrait des colonnes Fournisseur et
     Qté/paquet : Réf · Désignation · Pc-tôle ou Nb-pièce · Prix estimé/pièce · demande de prix · croix.
     La piste Désignation a un minimum FIXE (minmax(96px,1fr)) : avec « 1fr » seul, le libellé de
     l'en-tête et le champ de la ligne imposent des minimums différents et tout glisse à partir de là.
     L'en-tête n'a AUCUN padding horizontal (2 px suffisaient à décaler les mesures).
     .nom-grid-scroll = filet : à 1280 px la grille défile DANS la carte, la croix reste dedans et
     cliquable (avant le lot H1 elle passait sous les cartes voisines et ne répondait plus).
     Pistes 3 et 4 (relecture 17/09/2026) : elles étaient FIXES (52 px et 132 px) et coupaient leur
     contenu à TOUTES les largeurs — « 120 » pièces par tôle s'affichait « 1… », « 0,125 » accessoire
     par pièce « 0… », et le badge multi-fournisseurs (la raison d'être du lot) était tronqué dès
     2 fournisseurs, si bien que le marqueur « · cond. ? » n'était JAMAIS visible. Elles ont désormais
     un minimum réaliste et grandissent avec la place (c'est la piste Désignation, en 1fr, qui
     absorbait tout : 189 px à 1280 et 441 px à 1920).
     Somme des minimums = 104+96+64+190+26+24 + 5 gaps de 4 px = 524 px : la grille tient toujours
     dans la carte à 1280 px, et .nom-grid-scroll reste le filet au-delà. */
  #nom-fournitures-block{display:flex;flex-direction:column;gap:16px;}
  .nom-mat-grid{display:grid;grid-template-columns:minmax(104px,.55fr) minmax(96px,1fr) minmax(64px,.16fr) minmax(190px,.42fr) 26px 24px;gap:4px;align-items:center;}
  .nom-acc-grid{display:grid;grid-template-columns:minmax(104px,.55fr) minmax(96px,1fr) minmax(64px,.16fr) minmax(190px,.42fr) 26px 24px;gap:4px;align-items:center;}
  .nom-grid-head{margin-bottom:4px;padding:0;}
  .nom-grid-head > span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .nom-grid-scroll{overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;padding-bottom:2px;}
  /* Cellule « prix estimé » : valeur sur UNE ligne (nowrap : « 10,4000 € » passait sur deux lignes et
     faisait monter la ligne de 27,8 à 45,5 px) + une ligne de badge « n fourn. · min–max ». */
  .nom-prix-cell{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;gap:0;min-width:0;padding:2px 0;cursor:pointer;}
  .nom-prix-val{max-width:100%;min-width:0;text-align:right;font-size:.78rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.25;}
  .nom-prix-badge{max-width:100%;min-width:0;text-align:right;font-size:.58rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;}
  .nom-rfq-ico{flex:0 0 auto;width:26px;height:24px;border-radius:6px;cursor:pointer;font-size:.66rem;padding:0;line-height:1;}
  .nom-f-inp{border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 8px;font-size:.76rem;background:#f8fafc;outline:none;width:100%;min-width:0;text-overflow:ellipsis;box-sizing:border-box;}
  #nom-etapes-list > div, #nom-matieres-list > div, #nom-accessoires-list > div{min-width:0;}
  #nom-etapes-list > div > *, #nom-matieres-list > div > *, #nom-accessoires-list > div > *{min-width:0;}
  .nom-mat-grid > *, .nom-acc-grid > *{min-width:0;}
  .nom-f-inp:focus{border-color:#8b5cf6;background:white;}
  /* Liste déroulante « réf OU désignation » : filtrée par chercherReferences (module partagé), donc
     casse ET accents ignorés — ce qu'une <datalist> du navigateur ne sait pas faire. */
  #nom-ref-pop{position:fixed;z-index:2500;display:none;max-height:288px;overflow-y:auto;background:#fff;border:1.5px solid #cbd5e1;border-radius:10px;box-shadow:0 18px 44px rgba(15,23,42,.22);padding:4px;}
  #nom-ref-pop .nrp{display:flex;gap:10px;align-items:baseline;padding:5px 8px;border-radius:7px;cursor:pointer;white-space:nowrap;}
  #nom-ref-pop .nrp:hover, #nom-ref-pop .nrp.on{background:#eef2ff;}
  #nom-ref-pop .nrp-r{flex:0 0 auto;font-family:monospace;font-weight:800;color:#4338ca;font-size:.74rem;}
  #nom-ref-pop .nrp-d{flex:1 1 auto;min-width:0;color:#374151;font-size:.74rem;overflow:hidden;text-overflow:ellipsis;}
  #nom-ref-pop .nrp-n{flex:0 0 auto;font-size:.62rem;color:#94a3b8;font-weight:700;}
  #nom-ref-pop .nrp-vide{padding:8px 10px;color:#94a3b8;font-size:.72rem;white-space:normal;}
  /* Détail du prix moyen (clic sur la cellule) : fournisseur, prix catalogue, conditionnement, date. */
  #nom-prix-detail{position:fixed;z-index:2400;display:none;max-width:460px;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;box-shadow:0 18px 44px rgba(15,23,42,.22);padding:12px 14px;font-size:.74rem;color:#374151;}
  #nom-prix-detail table{width:100%;border-collapse:collapse;}
  #nom-prix-detail th{text-align:left;font-size:.56rem;text-transform:uppercase;color:#9ca3af;font-weight:700;padding:3px 6px;}
  #nom-prix-detail td{padding:3px 6px;font-size:.72rem;border-top:1px solid #f1f5f9;white-space:nowrap;}
  </style>

  <script>
  // ══ PRIX MOYEN MULTI-FOURNISSEURS — code du serveur, ré-émis tel quel (lot H1, contrat §3) ══
  // «prixMoyenClientJs()» rend le TEXTE des fonctions de src/prix_moyen.ts (Function.toString) :
  // normaliserReference, memeReference, categorieFourniture, categorieCompatible, nombrePositif,
  // arrondiPrix, qtePaquetDe, prixPerime, prixMoyenReference, chercherReferences, optionsReferences,
  // doublonsFournitures, premierDoublonFourniture, messageDoublonFourniture, recalculerFournitures.
  // Aucun échappement à faire dessus (ce n'est pas une donnée : pur ASCII, sans backtick, sans « \${ »,
  // sans « </ »). ⚠ NE JAMAIS recopier une règle de prix à la main ici : le navigateur et le serveur
  // doivent rendre le même chiffre (l'écart écran / analyse DT est déjà arrivé au lot H0).
  // Injecté tout en haut du bloc : la modale « Entrée catalogue » l'utilise aussi (nombrePositif).
  ${prixMoyenClientJs()}
  var BE_TABS = ['noms','analyse','prep','refs','dashboard'];
  function beNotif(t,i,m){ if(typeof pushNotif==='function') pushNotif(t,i,m,5000); else alert(String(m).replace(/<[^>]+>/g,'')); }
  // ── GED : documents (plan client / plan CAO / programmes FAO) de la nomenclature courante ──
  var GED_DOCS = [];
  function gedIcon(cat){ return cat==='plan_client'?'fa-file-contract':cat==='plan_cao'?'fa-drafting-compass':cat==='programme_fao'?'fa-microchip':'fa-file'; }
  function gedItemHtml(d){
    return '<div style="display:flex;align-items:center;gap:6px;font-size:.72rem;padding:2px 0;">'
      +'<i class="fas '+gedIcon(d.categorie)+'" style="color:#6366f1;"></i>'
      +'<a href="/api/ged/file/'+d.id+'" target="_blank" rel="noopener" title="Ouvrir" style="color:#4338ca;font-weight:600;text-decoration:none;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+String(d.fichier_nom||'fichier').replace(/</g,'&lt;')+'</a>'
      +'<button onclick="gedDelete(\\''+d.id+'\\')" title="Supprimer" style="border:none;background:#fee2e2;color:#dc2626;border-radius:5px;width:20px;height:20px;cursor:pointer;font-weight:700;">×</button>'
      +'</div>';
  }
  function gedRefreshUi(){ var has=!!nomCurrentId; var z=document.getElementById('ged-zones'); var n=document.getElementById('ged-need-save'); if(z)z.style.display=has?'':'none'; if(n)n.style.display=has?'none':''; }
  function gedRenderZone(cat){ var el=document.getElementById('ged-list-'+cat); if(!el)return; var it=GED_DOCS.filter(function(d){return d.categorie===cat;}); el.innerHTML=it.length?it.map(gedItemHtml).join(''):'<div style="font-size:.64rem;color:#cbd5e1;">Aucun fichier</div>'; }
  function nomRenderFaoList(){
    var el=document.getElementById('ged-fao-list'); if(!el)return;
    var steps=[]; nomEtapes.forEach(function(e,i){ var isMach=(e.type==='interne')&&(nomEtapeDecomp(e).typeProcess==='machine'); if(isMach)steps.push({e:e,ord:e.ordre||(i+1)}); });   // étape machine = type du process (règle unique), même sans machine rattachée
    if(!steps.length){ el.innerHTML='<div style="font-size:.64rem;color:#cbd5e1;">Aucune étape machine dans la gamme.</div>'; return; }
    el.innerHTML=steps.map(function(s){
      var docs=GED_DOCS.filter(function(d){return d.categorie==='programme_fao'&&String(d.etape_ordre)===String(s.ord);});
      return '<div style="border:1px solid #eef2f7;border-radius:8px;padding:7px 9px;margin-bottom:6px;">'
        +'<div style="font-size:.7rem;font-weight:700;color:#374151;">#'+s.ord+' · '+String(s.e.nom||s.e.process_nom||'étape').replace(/</g,'&lt;')+(s.e.machine_nom?(' <span style="color:#94a3b8;font-weight:500;">'+String(s.e.machine_nom).replace(/</g,'&lt;')+'</span>'):'')+'</div>'
        +'<div style="margin:3px 0;">'+(docs.length?docs.map(gedItemHtml).join(''):'<div style="font-size:.62rem;color:#cbd5e1;">Aucun programme</div>')+'</div>'
        +'<div style="display:flex;gap:5px;align-items:center;"><input type="file" id="ged-fao-input-'+s.ord+'" accept=".nc,.mpf,.tap,.txt,.h,.iso,.eia,.cnc,.pgm" style="font-size:.64rem;flex:1;min-width:0;"/><button onclick="gedUpload(\\'ged-fao-input-'+s.ord+'\\',\\'programme_fao\\','+s.ord+')" style="background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:4px 9px;font-size:.66rem;font-weight:700;cursor:pointer;white-space:nowrap;">Joindre</button></div>'
        +'</div>';
    }).join('');
  }
  // ── Journal EN 9100 de la nomenclature ouverte ──
  var NOM_JOURNAL_LIB={creation:'Création',validation:'Validation',modification:'Modification',devalidation:'Dévalidation',prepa_technique:'Préparation technique',nouvel_indice:'Nouvel indice',suppression:'Suppression',suppression_echouee:'Suppression annulée',document_ajoute:'Document ajouté',document_retire:'Document retiré',reference_client:'Référence client'};
  var NOM_JOURNAL_SEQ=0;
  function nomJournalEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function nomJournalTxt(v){ return (v==null||v==='')?'':((typeof v==='object')?JSON.stringify(v):String(v)); }
  // Valeur affichée : coupée AUTOUR de la première différence avec l'autre côté (deux textes longs
  // qui ne diffèrent qu'à la fin s'afficheraient sinon identiques) ; la valeur entière est au survol.
  function nomJournalVal(v,autre){ if(v==null||v==='') return '<span style="color:#cbd5e1;">∅</span>'; var s=nomJournalTxt(v), o=nomJournalTxt(autre), d=0; while(d<s.length&&d<o.length&&s.charAt(d)===o.charAt(d)) d++; var deb=Math.max(0,Math.min(d-30,s.length-90)); var vu=s.length>90?((deb>0?'…':'')+s.slice(deb,deb+90)+(deb+90<s.length?'…':'')):s; return '<span title="'+nomJournalEsc(s)+'">'+nomJournalEsc(vu)+'</span>'; }
  function nomJournalLoad(){
    var el=document.getElementById('nom-journal-list'); if(!el) return;
    var tok=++NOM_JOURNAL_SEQ;
    if(!nomCurrentId){ el.innerHTML='<div style="color:#94a3b8;">Aucun historique avant le premier enregistrement.</div>'; return; }
    var idDemande=nomCurrentId;
    var portee=(document.getElementById('nom-journal-portee')||{}).value||'fiche';
    fetch('/api/nomenclature/'+encodeURIComponent(idDemande)+'/journal?portee='+portee,{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){
      // Réponse périmée (une autre fiche est ouverte, ou une autre portée choisie entre-temps) : ignorée.
      if(tok!==NOM_JOURNAL_SEQ||idDemande!==nomCurrentId) return;
      if(!j||!j.ok){ el.innerHTML='<div style="color:#b91c1c;">Journal illisible : '+nomJournalEsc((j&&j.error)||'erreur')+'</div>'; return; }
      if(!j.disponible){ el.innerHTML='<div style="color:#b45309;"><i class="fas fa-triangle-exclamation" style="margin-right:5px;"></i>Journal indisponible : sa table n’existe pas encore sur cette base (script cloud-5).</div>'; return; }
      var e=j.entrees||[];
      if(!e.length){ el.innerHTML='<div style="color:#94a3b8;">Aucune modification tracée. Le journal commence à la validation de la nomenclature.</div>'; return; }
      el.innerHTML=(j.tronque?'<div style="color:#b45309;margin-bottom:8px;"><i class="fas fa-triangle-exclamation" style="margin-right:5px;"></i>Les 500 dernières entrées sont affichées : l’historique complet est conservé en base.</div>':'')+e.map(function(x){
        var ch=x.changements||[]; var d=new Date(x.created_at); var quand=isNaN(d.getTime())?'':d.toLocaleString('fr-FR');
        return '<div style="border-left:3px solid #ddd6fe;padding:6px 10px;margin-bottom:8px;">'
          +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;"><strong style="color:#5b21b6;">'+nomJournalEsc(NOM_JOURNAL_LIB[x.evenement]||x.evenement)+'</strong>'
          +'<span style="color:#94a3b8;">'+nomJournalEsc(quand)+'</span>'
          +'<span>· '+nomJournalEsc(x.auteur_nom||'?')+(x.auteur_matricule?' ('+nomJournalEsc(x.auteur_matricule)+')':'')+'</span>'
          +(x.indice?'<span style="background:#f5f3ff;color:#6d28d9;border-radius:999px;padding:0 7px;font-size:.66rem;">ind. '+nomJournalEsc(x.indice)+'</span>':'')
          +(x.auteur_source&&x.auteur_source!=='session'?'<span style="color:#b45309;font-size:.66rem;">'+(x.auteur_source==='bootstrap'?'compte de secours':'sans authentification')+'</span>':'')
          +'</div>'
          +(ch.length?'<ul style="margin:4px 0 0 16px;padding:0;">'+ch.map(function(c){ return '<li>'+nomJournalEsc(c.champ)+' : '+nomJournalVal(c.avant,c.apres)+' → '+nomJournalVal(c.apres,c.avant)+(c.detail?' <i class="fas fa-circle-info" style="color:#a78bfa;cursor:help;" title="'+nomJournalEsc(JSON.stringify(c.detail))+'"></i>':'')+'</li>'; }).join('')+'</ul>':'')
          +(x.motif?'<div style="color:#64748b;">Motif : '+nomJournalEsc(x.motif)+'</div>':'')
          +'</div>';
      }).join('');
    }).catch(function(){ if(tok===NOM_JOURNAL_SEQ) el.innerHTML='<div style="color:#b91c1c;">Journal : erreur réseau.</div>'; });
  }
  function gedRenderAll(){ gedRenderZone('plan_client'); gedRenderZone('plan_cao'); nomRenderFaoList(); nomRenderLienPlan(); }
  // Le nom du plan s'affiche dans le bloc Identification (champ Nom du fichier CAO), mais ce
  // champ n'est que du texte : on cherchait le plan la ou il est ecrit, sans pouvoir l'ouvrir.
  // Le fichier, lui, vit dans la GED (zone Plan CAO, plus bas). On pose le lien sous le nom.
  function nomRenderLienPlan(){
    var el=document.getElementById('nom-plan-ouvrir'); if(!el) return;
    var nomFic=String((document.getElementById('nom-f-planfic')||{}).value||'').trim();
    var plans=GED_DOCS.filter(function(d){ return d.categorie==='plan_cao'||d.categorie==='plan_client'; });
    var doc=plans.find(function(d){ return nomFic && String(d.fichier_nom||'').trim()===nomFic; }) || plans[plans.length-1];
    if(doc){
      el.innerHTML='<a href="/api/ged/file/'+doc.id+'" target="_blank" rel="noopener" style="color:#4338ca;font-weight:700;text-decoration:none;"><i class="fas fa-eye" style="margin-right:4px;"></i>Ouvrir le plan</a>'
        +(plans.length>1?' <span style="color:#94a3b8;">('+plans.length+' plans joints, voir la zone Plan CAO)</span>':'');
      return;
    }
    // Un nom sans fichier : la prepa ou une saisie a pu n ecrire que le nom. On le dit.
    el.innerHTML=(nomFic && nomCurrentId)
      ? '<span style="color:#b45309;"><i class="fas fa-circle-info" style="margin-right:4px;"></i>Seul le nom est enregistré : le fichier n’a pas été déposé dans l’ERP. Joignez-le dans la zone Plan CAO.</span>'
      : '';
  }
  function gedLoad(){ if(!nomCurrentId){ GED_DOCS=[]; gedRenderAll(); return; } fetch('/api/ged/nomenclature/'+encodeURIComponent(nomCurrentId)).then(function(r){return r.json();}).then(function(j){ GED_DOCS=(j&&j.documents)||[]; gedRenderAll(); }).catch(function(){}); }
  // ── Répertoire « Clients & réfs » de la pièce (réf interne ↔ client ↔ réf client ↔ plan) ──
  function nomRefsClientsLoad(code){
    var list=document.getElementById('nom-refs-clients-list'); var addBox=document.getElementById('nom-refs-clients-add'); if(!list) return;
    code=(code||'').trim();
    if(!code){ list.innerHTML='<div style="font-size:.72rem;color:#cbd5e1;">Renseignez d\\'abord la réf. interne de la pièce.</div>'; if(addBox)addBox.style.display='none'; return; }
    if(addBox) addBox.style.display='flex';
    list.innerHTML='<div style="font-size:.72rem;color:#94a3b8;">Chargement…</div>';
    fetch('/api/references-clients?code_ref_interne='+encodeURIComponent(code)).then(function(r){return r.json();}).then(function(j){
      var rows=(j&&j.refs)||[];
      var esc=function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');};
      if(!rows.length){ list.innerHTML='<div style="font-size:.72rem;color:#94a3b8;">Aucun client pour cette réf. Ajoutez-en un ci-dessous, ou il apparaîtra dès qu\\'une DT client sera validée.</div>'; return; }
      list.innerHTML='<table style="width:100%;border-collapse:collapse;font-size:.75rem;"><thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:5px 8px;color:#6b7280;">Client</th><th style="text-align:left;padding:5px 8px;color:#6b7280;">Réf. client</th><th style="text-align:left;padding:5px 8px;color:#6b7280;">Plan</th><th></th></tr></thead><tbody>'+rows.map(function(m){
        var plan = m.plan_doc_id ? '<a href="/api/ged/file/'+esc(m.plan_doc_id)+'" target="_blank" style="color:#4338ca;font-weight:700;text-decoration:none;"><i class="fas fa-file-arrow-down" style="margin-right:4px;"></i>'+esc(m.num_plan||'Ouvrir')+'</a>' : (m.num_plan?esc(m.num_plan):'<span style="color:#94a3b8;font-style:italic;">none</span>');
        return '<tr style="border-bottom:1px solid #f7f8fa;"><td style="padding:5px 8px;font-weight:600;color:#374151;">'+esc(m.client_nom||m.client_id||'—')+'</td><td style="padding:5px 8px;font-family:monospace;">'+esc(m.ref_client||'—')+'</td><td style="padding:5px 8px;">'+plan+'</td><td style="padding:5px 8px;text-align:right;"><button onclick="nomRefClientDel(\\''+esc(m.id)+'\\')" title="Retirer" style="border:none;background:#fee2e2;color:#dc2626;border-radius:5px;width:20px;height:20px;cursor:pointer;">×</button></td></tr>';
      }).join('')+'</tbody></table>';
    }).catch(function(){ list.innerHTML='<div style="font-size:.72rem;color:#dc2626;">Erreur de chargement.</div>'; });
  }
  function nomRefClientAdd(){
    var code=((document.getElementById('nom-f-code')||{}).value || (document.getElementById('nom-f-num')||{}).value || '').trim();
    if(!code){ if(typeof pushNotif==='function') pushNotif('err','fa-exclamation-triangle','Renseignez la réf. interne d\\'abord.'); return; }
    var body={ code_ref_interne:code, client_nom:(document.getElementById('rc-client')||{}).value||null, ref_client:(document.getElementById('rc-refclient')||{}).value||null, num_plan:(document.getElementById('rc-numplan')||{}).value||null, nomenclature_id:nomCurrentId||null };
    fetch('/api/references-clients',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ if(typeof pushNotif==='function') pushNotif('err','fa-times',(j&&j.error)||'Échec.'); return; }
      ['rc-client','rc-refclient','rc-numplan'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
      nomRefsClientsLoad(code);
      nomJournalLoad();
      if(j.journal===false&&typeof pushNotif==='function') pushNotif('warn','fa-clipboard-list','Référence enregistrée, mais le journal EN 9100 n’a pas pu l’écrire : '+String(j.journal_raison||'').replace(/[<>]/g,'')+'.',9000);
    }).catch(function(){});
  }
  function nomRefClientDel(id){
    fetch('/api/references-clients/'+encodeURIComponent(id)+'?nomenclature_id='+encodeURIComponent(nomCurrentId||''),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){
      nomRefsClientsLoad(((document.getElementById('nom-f-code')||{}).value)||'');
      nomJournalLoad();
      if(j&&j.journal===false&&typeof pushNotif==='function') pushNotif('warn','fa-clipboard-list','Référence retirée, mais le journal EN 9100 n’a pas pu l’écrire : '+String(j.journal_raison||'').replace(/[<>]/g,'')+'.',9000);
    }).catch(function(){});
  }

  function gedUpload(inputId, cat, etapeOrdre){
    if(!nomCurrentId){ beNotif('err','fa-exclamation-triangle','Enregistrez la nomenclature (Brouillon) avant de joindre des fichiers.'); return; }
    var inp=document.getElementById(inputId);
    if(!inp||!inp.files||!inp.files.length){ beNotif('info','fa-info-circle','Choisissez un fichier a joindre.'); return; }
    var f=inp.files[0];
    var fd=new FormData(); fd.append('file',f); fd.append('nomenclature_id',nomCurrentId); fd.append('categorie',cat);
    if(etapeOrdre!=null) fd.append('etape_ordre',String(etapeOrdre));
    beNotif('info','fa-upload','Envoi de '+f.name+'…');
    fetch('/api/ged/upload',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(j){
      if(j&&j.ok){ inp.value=''; if(cat==='plan_cao'){ var pf=document.getElementById('nom-f-planfic'); if(pf&&!pf.value&&j.document)pf.value=j.document.fichier_nom; } gedLoad(); nomJournalLoad(); beNotif('ok','fa-check','Fichier joint.'); if(j.journal===false) beNotif('warn','fa-clipboard-list','Fichier joint, mais le journal EN 9100 n’a pas pu l’écrire : '+String(j.journal_raison||'').replace(/[<>]/g,'')+'.'); }
      else beNotif('err','fa-times',(j&&j.error)||'Echec de l envoi.');
    }).catch(function(){ beNotif('err','fa-times','Erreur reseau.'); });
  }
  async function gedDelete(id){ if(!await appConfirm('Supprimer ce fichier ?'))return; fetch('/api/ged/'+id,{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ gedLoad(); nomJournalLoad(); beNotif('ok','fa-check','Fichier supprimé.'); if(j.journal===false) beNotif('warn','fa-clipboard-list','Fichier supprimé, mais le journal EN 9100 n’a pas pu l’écrire : '+String(j.journal_raison||'').replace(/[<>]/g,'')+'.'); } else beNotif('err','fa-times',(j&&j.error)||'Echec.'); }).catch(function(){ beNotif('err','fa-times','Erreur reseau.'); }); }
  // (Point 10 retiré : la création machine/process se fait en Production → « Postes & Process ». La gamme ne fait que CHOISIR.)
  // ── Point 8 : créer fournisseur/ST + entrée catalogue depuis le BE ──
  function beFournTypeChange(){ var t=document.getElementById('befn-type').value; document.getElementById('befn-prest-wrap').style.display=(t==='sous_traitant')?'':'none'; }
  function beOpenFournModal(){ ['befn-nom','befn-code','befn-email','befn-tel','befn-prest'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';}); document.getElementById('befn-type').value='fournisseur'; beFournTypeChange(); document.getElementById('be-fourn-overlay').style.display='flex'; }
  async function beSaveFourn(){
    var nom=(document.getElementById('befn-nom').value||'').trim();
    if(!nom){ beNotif('err','fa-exclamation-triangle','Le nom est obligatoire.'); return; }
    var type=document.getElementById('befn-type').value;
    var payload={ nom:nom, code:(document.getElementById('befn-code').value||'').trim()||null, email:(document.getElementById('befn-email').value||'').trim()||null, tel:(document.getElementById('befn-tel').value||'').trim()||null };
    var url='/api/achats/fournisseur';
    if(type==='sous_traitant'){ url='/api/achats/sous-traitant'; payload.prestations=(document.getElementById('befn-prest').value||'').trim()||null; }
    try{ var r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); var j=await r.json();
      if(j&&j.ok){ beNotif('ok','fa-check',(type==='sous_traitant'?'Sous-traitant':'Fournisseur')+' créé — actualisation…'); setTimeout(function(){softReload();},700); }
      else beNotif('err','fa-times',(j&&j.error)||'Échec de la création.'); }
    catch(e){ beNotif('err','fa-times','Erreur réseau.'); }
  }
  function beCatFillFourn(selected){
    var sel=document.getElementById('becat-fourn');
    sel.innerHTML='<option value="">— fournisseur —</option>'+((BE_REFS_JS&&BE_REFS_JS.fournisseurs)||[]).map(function(f){return '<option value="'+f.id+'">'+String(f.nom||'').replace(/</g,'&lt;')+'</option>';}).join('');
    sel.value=selected||'';
  }
  // Modale catalogue : ce que la fenêtre annonce doit correspondre à ce que le serveur fait.
  //   • « Quantité par paquet » ne sert QU'AUX ACCESSOIRES (son propre libellé le dit) : elle était
  //     pourtant affichée pour une matière ou un produit chimique — la liste n'avait aucun onchange.
  //   • Le champ Prix et la note de bas de modale disaient « sinon en attente de prix » MÊME en
  //     modification, où laisser le prix vide ne l'efface pas : l'utilisateur venu déclarer une
  //     quantité par paquet croyait effacer le prix. Mêmes textes que la fiche fournisseur (pfHint).
  function beCatMaj(){
    var cat=(document.getElementById('becat-cat')||{}).value||'';
    var w=document.getElementById('becat-qtepaq-wrap'); if(w) w.style.display=(cat==='accessoire')?'block':'none';
    var edition=!!((document.getElementById('becat-id')||{}).value||'').trim();
    var p=document.getElementById('becat-prix');
    if(p) p.placeholder = edition ? 'laisser vide = garder le prix actuel' : 'sinon « en attente »';
    var n=document.getElementById('becat-note');
    if(n) n.innerHTML = (edition
      ? 'Laisser le prix vide <strong>n\\'efface jamais</strong> le prix en base (il est piloté par les demandes de prix).'
      : 'Sans prix, l\\'entrée reste « en attente de prix » (à compléter via une demande de prix).')
      + ' ' + (cat==='accessoire'
        ? '« Prix HT » = prix du <strong>paquet</strong> et « Quantité par paquet » = nombre de <strong>pièces</strong> dedans ; sans elle, le prix sera compris comme un prix à la pièce.'
        : (cat==='matiere_premiere'
          ? '« Prix HT » = prix d\\'<strong>une tôle</strong> ; le nombre de pièces par tôle dépend de la géométrie et reste saisi dans la nomenclature.'
          : '« Prix HT » est le prix de l\\'unité de commande. La quantité par paquet ne sert qu\\'aux accessoires.'));
  }
  function beOpenCatalogModal(){
    document.getElementById('becat-id').value='';
    var t=document.getElementById('becat-title'); if(t)t.innerHTML='<i class="fas fa-book" style="color:#047857;margin-right:6px;"></i>Nouvelle entrée catalogue';
    ['becat-ref','becat-desig','becat-prix','becat-qtepaq'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
    document.getElementById('becat-cat').value='matiere_premiere'; document.getElementById('becat-act').value='both';
    beCatFillFourn(''); beCatMaj();
    document.getElementById('be-catalog-overlay').style.display='flex';
  }
  // Édition en place d'une référence depuis BE › Références (réutilise le même modal)
  // Lot H1 : «qtepaq» = quantité par paquet déjà au catalogue (vide = non déclarée) ; «prix» = prix
  // actuel, pré-rempli comme sur la fiche fournisseur (le serveur ne « rajeunit » pas un prix inchangé).
  function beEditCatalog(id, fid, ref, desig, cat, act, qtepaq, prix){
    document.getElementById('becat-id').value=id||'';
    var t=document.getElementById('becat-title'); if(t)t.innerHTML='<i class="fas fa-pen" style="color:#047857;margin-right:6px;"></i>Modifier la référence';
    document.getElementById('becat-ref').value=ref||'';
    document.getElementById('becat-desig').value=desig||'';
    // Catégorie inconnue de la liste (« autre » avant qu'elle n'y figure, valeur d'import) : on ne
    // laisse JAMAIS le select vide (selectedIndex = -1) — le geste naturel « choisir la 1re entrée »
    // reclassait la référence en Matière et la sortait du compartiment qui la propose.
    var cs=document.getElementById('becat-cat');
    cs.value=cat||'matiere_premiere';
    if(cs.selectedIndex<0) cs.value='autre';
    if(cs.selectedIndex<0) cs.value='matiere_premiere';
    document.getElementById('becat-act').value=act||'both';
    document.getElementById('becat-prix').value=(prix==null?'':String(prix));
    var q=document.getElementById('becat-qtepaq'); if(q) q.value=(qtepaq==null?'':String(qtepaq));
    beCatFillFourn(fid||''); beCatMaj();
    document.getElementById('be-catalog-overlay').style.display='flex';
  }
  async function beSaveCatalog(){
    var id=(document.getElementById('becat-id').value||'').trim();
    var ref=(document.getElementById('becat-ref').value||'').trim();
    var desig=(document.getElementById('becat-desig').value||'').trim();
    if(!ref||!desig){ beNotif('err','fa-exclamation-triangle','Référence et désignation obligatoires.'); return; }
    var sel=document.getElementById('becat-fourn'); var fid=sel.value||null;
    var fnom=(fid&&sel.options[sel.selectedIndex])?sel.options[sel.selectedIndex].text:null;
    var prixV=parseFloat(document.getElementById('becat-prix').value);
    // Qté/paquet : nombre > 0 seulement (nombrePositif, module partagé). Vide / 0 / texte => champ
    // OMIS du corps : le serveur n'écrase jamais une valeur existante par du vide (contrat §6).
    // ...et seulement pour un ACCESSOIRE : la quantité par paquet n'a pas de sens ailleurs (le champ
    // est d'ailleurs masqué par beCatMaj hors accessoire, mais sa valeur survit à un changement de catégorie).
    var qp=(document.getElementById('becat-cat').value==='accessoire')
      ? nombrePositif((document.getElementById('becat-qtepaq')||{}).value) : null;
    var payload={ fournisseur_id:fid, fournisseur_nom:fnom, reference:ref, designation:desig,
      categorie:document.getElementById('becat-cat').value, prix:(isFinite(prixV)&&prixV>0)?prixV:null,
      activite:document.getElementById('becat-act').value, source_prix:'be' };
    if(qp!==null) payload.qte_paquet=qp;
    var url=id?('/api/produits-fournisseurs/'+encodeURIComponent(id)):'/api/produits-fournisseurs';
    var method=id?'PUT':'POST';
    try{ var r=await fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); var j=await r.json();
      if(j&&j.ok){
        // Contrat §6 / §12 : base sans la colonne «qte_paquet» (cloud avant cloud-13) => le reste est
        // enregistré et le serveur le DIT (avertissement, statut 200). Jamais une erreur bloquante.
        if(j.avertissement) beNotif('warn','fa-triangle-exclamation', String(j.avertissement));
        beNotif('ok','fa-check', id?'Référence modifiée — actualisation…':'Entrée catalogue enregistrée — actualisation…');
        setTimeout(function(){softReload();}, j.avertissement?2600:700);
      }
      else beNotif('err','fa-times',(j&&j.error)||'Échec de l\\'enregistrement.'); }
    catch(e){ beNotif('err','fa-times','Erreur réseau.'); }
  }
  function beRfqLineHtml(){ return '<tr class="berfq-line">'
    +'<td style="padding:3px 6px;"><input class="br-ref" placeholder="(option)" style="width:100%;border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 7px;font-family:monospace;font-size:.74rem;"/></td>'
    +'<td style="padding:3px 6px;"><input class="br-des" placeholder="Désignation" style="width:100%;border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 7px;font-size:.74rem;"/></td>'
    +'<td style="padding:3px 6px;text-align:right;"><input class="br-qte" type="number" step="any" min="0" style="width:70px;border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 5px;text-align:right;font-size:.74rem;"/></td>'
    +'<td style="padding:3px 6px;"><select class="br-cat" style="border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 4px;font-size:.72rem;"><option value="matiere_premiere">Matière</option><option value="accessoire">Accessoires</option><option value="outillage">Outils</option><option value="chimique">Chimique</option><option value="consommable">Consommable</option><option value="autre">Autres</option></select></td>'
    +'<td style="text-align:center;"><button type="button" onclick="beRfqDelLine(this)" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1rem;">×</button></td>'
    +'</tr>'; }
  function beRfqAddLine(){ document.getElementById('be-rfq-lines').insertAdjacentHTML('beforeend', beRfqLineHtml()); }
  function beRfqDelLine(b){ var tr=b.closest('tr'); if(tr) tr.remove(); }
  // ── Destinataires (lot H1 §6) ─────────────────────────────────────────────────────────────────
  // Une ligne de nomenclature n'a plus de fournisseur : on propose TOUS ceux qui portent la référence
  // au catalogue (cochés d'office). Référence nouvelle (aucun porteur) → choix libre, rien de coché.
  var BE_RFQ_APRES = null;   // rappel après envoi (marque la ligne « demande en cours »)
  function beRfqDestVider(){
    BE_RFQ_APRES = null;
    var w=document.getElementById('be-rfq-dest-wrap'), d=document.getElementById('be-rfq-dest'), n=document.getElementById('be-rfq-dest-info');
    if(w) w.style.display='none';
    if(d) d.innerHTML='';
    if(n) n.textContent='';
  }
  function beRfqDestRemplir(porteurs, info){
    var w=document.getElementById('be-rfq-dest-wrap'), d=document.getElementById('be-rfq-dest'), n=document.getElementById('be-rfq-dest-info');
    if(!w||!d) return;
    var liste = (porteurs && porteurs.length) ? porteurs : (typeof nomFournAll==='function' ? nomFournAll().map(function(f){ return { id:f.id, nom:f.nom }; }) : []);
    var coches = !!(porteurs && porteurs.length);
    d.innerHTML = liste.map(function(f,i){
      return '<label style="display:inline-flex;align-items:center;gap:5px;font-size:.74rem;color:#374151;cursor:pointer;">'
        + '<input type="checkbox" class="berfq-dest" data-fid="'+((f.id==null)?'':String(f.id).replace(/"/g,'&quot;'))+'" data-fnom="'+String(f.nom||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')+'"'+(coches?' checked':'')+'/>'
        + String(f.nom||'(sans nom)').replace(/&/g,'&amp;').replace(/</g,'&lt;')
        + '</label>';
    }).join('');
    if(n) n.textContent = info || (coches
      ? (liste.length+' fournisseur(s) portent cette référence au catalogue — tous cochés.')
      : 'Aucun fournisseur ne porte encore cette référence : choisissez librement (sans coche, les Achats décideront).');
    w.style.display='';
  }
  function beRfqDestAll(on){ document.querySelectorAll('#be-rfq-dest .berfq-dest').forEach(function(c){ c.checked=!!on; }); }
  function beRfqDestCollect(){
    var out=[];
    document.querySelectorAll('#be-rfq-dest .berfq-dest').forEach(function(c){
      if(!c.checked) return;
      out.push({ id:c.getAttribute('data-fid')||null, nom:c.getAttribute('data-fnom')||null });
    });
    return out;
  }
  function beRfqOpen(origine){ beRfqDestVider(); document.getElementById('be-rfq-origine').value=origine||'libre'; var b=document.getElementById('be-rfq-lines'); if(b && !b.querySelector('.berfq-line')) beRfqAddLine(); document.getElementById('be-rfq-overlay').style.display='flex'; }
  // Depuis la liste catalogue : ouvre le modal pré-rempli avec la référence dont le prix est absent/périmé
  function beRfqForRef(ref, desig, cat){
    beRfqDestVider();
    document.getElementById('be-rfq-origine').value='catalogue';
    var d=document.getElementById('be-rfq-dtref'); if(d)d.value='';
    var b=document.getElementById('be-rfq-lines'); if(b) b.innerHTML='';
    beRfqAddLine();
    var tr=document.querySelector('#be-rfq-lines .berfq-line');
    if(tr){ tr.querySelector('.br-ref').value=ref||''; tr.querySelector('.br-des').value=desig||ref||''; var cs=tr.querySelector('.br-cat'); if(cs&&cat)cs.value=cat; }
    if(typeof nomFournisseursDeRef==='function') beRfqDestRemplir(nomFournisseursDeRef(ref, cat));
    document.getElementById('be-rfq-overlay').style.display='flex';
  }
  // Depuis une LIGNE de nomenclature (spec §6) : réf, désignation, quantité et destinataires pré-remplis.
  function beRfqOuvrirLigne(o){
    o = o || {};
    beRfqDestVider();
    BE_RFQ_APRES = (typeof o.apres === 'function') ? o.apres : null;
    document.getElementById('be-rfq-origine').value='nomenclature';
    var d=document.getElementById('be-rfq-dtref'); if(d) d.value=o.dtref||'';
    var nt=document.getElementById('be-rfq-notes'); if(nt) nt.value='';
    var b=document.getElementById('be-rfq-lines'); if(b) b.innerHTML='';
    beRfqAddLine();
    var tr=document.querySelector('#be-rfq-lines .berfq-line');
    if(tr){
      tr.querySelector('.br-ref').value=o.reference||'';
      tr.querySelector('.br-des').value=o.designation||o.reference||'';
      tr.querySelector('.br-qte').value=(o.quantite!=null?String(o.quantite):'');
      var cs=tr.querySelector('.br-cat'); if(cs&&o.categorie) cs.value=o.categorie;
    }
    beRfqDestRemplir(o.fournisseurs);
    document.getElementById('be-rfq-overlay').style.display='flex';
  }
  function beRfqCollect(){ var out=[]; document.querySelectorAll('#be-rfq-lines .berfq-line').forEach(function(tr){ var des=tr.querySelector('.br-des').value.trim(); if(!des) return; var q=tr.querySelector('.br-qte').value; out.push({ reference:tr.querySelector('.br-ref').value.trim()||null, designation:des, quantite_estimee:(q!==''?parseFloat(q):null), categorie:tr.querySelector('.br-cat').value }); }); return out; }
  function beRfqSubmit(){
    var lignes=beRfqCollect();
    if(!lignes.length){ beNotif('err','fa-exclamation-circle','Ajoutez au moins un article (désignation).'); return; }
    var origine=document.getElementById('be-rfq-origine').value;
    var dtref=document.getElementById('be-rfq-dtref').value.trim()||null;
    var notes=document.getElementById('be-rfq-notes').value.trim()||null;
    var cibles=beRfqDestCollect();   // fournisseurs_cibles : une réponse vide est créée par fournisseur coché
    var apres=BE_RFQ_APRES;
    // §6 : une demande de prix PAR référence
    var calls=lignes.map(function(l){ return fetch('/api/demandes-prix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ origine:origine, dt_ref:dtref, notes:notes, demandeur:'BE', fournisseurs_cibles:cibles, lignes:[l] })}).then(function(r){return r.json();}).catch(function(){return {ok:false};}); });
    Promise.all(calls).then(function(res){
      var ok=res.filter(function(j){return j&&j.ok;});
      if(ok.length){
        document.getElementById('be-rfq-overlay').style.display='none';
        document.getElementById('be-rfq-lines').innerHTML='';
        beRfqDestVider();
        if(apres) { try { apres(ok[0]); } catch(e) {} }
        beNotif('ok','fa-paper-plane', ok.length>1 ? (ok.length+' demandes de prix envoyées aux Achats (une par référence).') : ('Demande de prix '+ok[0].numero+' envoyée aux Achats'+(cibles.length?(' — '+cibles.length+' fournisseur(s) destinataire(s)'):'')+'.'));
      }
      else beNotif('err','fa-ban','Échec de l\\'envoi.');
    });
  }
  var _refCat='all', _refAct='all';
  function refSetCat(c){ _refCat=c; document.querySelectorAll('.ref-pill').forEach(function(b){ b.style.background='white'; b.style.color='#475569'; }); var el=document.getElementById('refcat-'+c); if(el){ el.style.background='#6366f1'; el.style.color='white'; } refApply(); }
  function refSetAct(a){ _refAct=a; document.querySelectorAll('.ref-apill').forEach(function(b){ b.style.background='white'; b.style.color='#475569'; }); var el=document.getElementById('refact-'+a); if(el){ el.style.background='#6366f1'; el.style.color='white'; } refApply(); }
  function refApply(){ var q=((document.getElementById('ref-search')||{}).value||'').toLowerCase(); var tb=document.getElementById('be-refs-table'); if(!tb) return; tb.querySelectorAll('tbody tr').forEach(function(tr){ var okc=(_refCat==='all'||tr.getAttribute('data-cat')===_refCat); var oka=(_refAct==='all'||tr.getAttribute('data-act')===_refAct); var okq=(!q||tr.textContent.toLowerCase().indexOf(q)>=0); tr.style.display=(okc&&oka&&okq)?'':'none'; }); }
  async function refEvol(reference, btn){ var desig=btn.getAttribute('data-desig')||reference; var m=document.getElementById('refEvolModal'); var body=document.getElementById('refEvolBody'); document.getElementById('refEvolTitle').innerHTML='<i class="fas fa-chart-line" style="color:#6366f1;margin-right:6px;"></i>'+reference+' — '+desig; body.innerHTML='<div style="text-align:center;padding:30px;color:#94a3b8;">Chargement…</div>'; m.style.display='flex'; try{ var r=await fetch('/api/ref-prix/'+encodeURIComponent(reference)); var j=await r.json(); var h=(j.historique||[]); if(!h.length){ body.innerHTML='<div style="text-align:center;padding:30px;color:#cbd5e1;">Aucun historique de prix pour cette référence. Il se remplit à chaque bon de commande validé.</div>'; return; } body.innerHTML=refEvolRender(h); }catch(e){ body.innerHTML='<div style="color:#b91c1c;padding:20px;">Erreur de chargement.</div>'; } }
  function refEvolRender(h){
    var pts=h.map(function(x){return {d:(x.date_prix||'').slice(0,10), p:Number(x.prix_unitaire)||0, q:x.quantite, f:x.fournisseur_nom||'', bc:x.bc_num||''};});
    var prices=pts.map(function(p){return p.p;}); var mn=Math.min.apply(null,prices), mx=Math.max.apply(null,prices); if(mx===mn){mx=mn+1;mn=Math.max(0,mn-1);}
    var W=560,H=160,ml=46,mr=12,mt=12,mb=22, n=pts.length;
    var X=function(i){return ml+(n<=1?(W-ml-mr)/2:i/(n-1)*(W-ml-mr));}, Y=function(p){return mt+(1-(p-mn)/(mx-mn))*(H-mt-mb);};
    var poly=pts.map(function(p,i){return X(i).toFixed(1)+','+Y(p.p).toFixed(1);}).join(' ');
    var dots=pts.map(function(p,i){return '<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(p.p).toFixed(1)+'" r="3" fill="#6366f1"><title>'+p.d+' : '+p.p.toFixed(2)+' € ('+p.f+')</title></circle>';}).join('');
    var first=prices[0], last=prices[n-1], delta=first?((last-first)/first*100):0;
    var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;"><line x1="'+ml+'" y1="'+(H-mb)+'" x2="'+(W-mr)+'" y2="'+(H-mb)+'" stroke="#e2e8f0"/><line x1="'+ml+'" y1="'+mt+'" x2="'+ml+'" y2="'+(H-mb)+'" stroke="#e2e8f0"/><text x="'+(ml-5)+'" y="'+(Y(mx)+3).toFixed(1)+'" text-anchor="end" font-size="8" fill="#94a3b8">'+mx.toFixed(2)+'</text><text x="'+(ml-5)+'" y="'+(Y(mn)+3).toFixed(1)+'" text-anchor="end" font-size="8" fill="#94a3b8">'+mn.toFixed(2)+'</text><polyline points="'+poly+'" fill="none" stroke="#6366f1" stroke-width="2"/>'+dots+'</svg>';
    var rows=pts.slice().reverse().map(function(p){return '<tr style="border-bottom:1px solid #f8fafc;"><td style="padding:5px 10px;font-size:.74rem;color:#64748b;">'+p.d+'</td><td style="padding:5px 10px;text-align:right;font-weight:800;color:#0f766e;font-size:.78rem;">'+p.p.toFixed(2)+' €</td><td style="padding:5px 10px;text-align:right;font-size:.74rem;color:#64748b;">'+(p.q!=null?p.q:'—')+'</td><td style="padding:5px 10px;font-size:.74rem;color:#64748b;">'+p.f+'</td><td style="padding:5px 10px;font-size:.72rem;color:#94a3b8;">'+p.bc+'</td></tr>';}).join('');
    return '<div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;"><div style="background:#f8fafc;border-radius:8px;padding:8px 14px;"><div style="font-size:.58rem;color:#94a3b8;text-transform:uppercase;font-weight:700;">Dernier prix</div><div style="font-size:1.1rem;font-weight:900;color:#0f766e;">'+last.toFixed(2)+' €</div></div><div style="background:#f8fafc;border-radius:8px;padding:8px 14px;"><div style="font-size:.58rem;color:#94a3b8;text-transform:uppercase;font-weight:700;">Évolution</div><div style="font-size:1.1rem;font-weight:900;color:'+(delta>0?'#b91c1c':delta<0?'#15803d':'#64748b')+';">'+(delta>0?'+':'')+delta.toFixed(1)+'%</div></div><div style="background:#f8fafc;border-radius:8px;padding:8px 14px;"><div style="font-size:.58rem;color:#94a3b8;text-transform:uppercase;font-weight:700;">Points</div><div style="font-size:1.1rem;font-weight:900;color:#4338ca;">'+n+'</div></div></div>'+svg+'<table style="width:100%;border-collapse:collapse;margin-top:10px;"><thead><tr style="background:#f8fafc;">'+['Date','PU','Qté','Fournisseur','BC'].map(function(x,i){return '<th style="padding:6px 10px;text-align:'+(i===1||i===2?'right':'left')+';font-size:.58rem;text-transform:uppercase;color:#6b7280;">'+x+'</th>';}).join('')+'</tr></thead><tbody>'+rows+'</tbody></table>';
  }

  function switchBETab(id) {
    BE_TABS.forEach(function(t) {
      var panel = document.getElementById('be-panel-'+t);
      var btn   = document.getElementById('be-tab-'+t);
      var on    = (t === id);
      if (panel) panel.style.display = on ? 'block' : 'none';
      if (btn) btn.classList.toggle('active', on);
    });
  }

  function beFilter(tableId, q) {
    var tbl = document.getElementById(tableId);
    if (!tbl) return;
    var lq = q.toLowerCase();
    tbl.querySelectorAll('tbody tr').forEach(function(tr) {
      tr.style.display = tr.textContent.toLowerCase().indexOf(lq) >= 0 ? '' : 'none';
    });
  }

  // ── NOMENCLATURE FORM ──────────────────────────────────────
  var nomFournitures = [];   // legacy (conservé pour compat ; remplacé par matières + accessoires)
  // Lot H1 : une ligne de fourniture porte une RÉFÉRENCE, plus de fournisseur ni de qté/paquet.
  // «prix_*_enr» = copie enregistrée dans la nomenclature, repli quand la référence n'a aucun prix
  // au catalogue (détail complet en tête du bloc « FOURNITURES »).
  var nomMatieres    = [];   // [{ ref, designation, nb_par_tole,  prix_tole_enr }]
  var nomAccessoires = [];   // [{ ref, designation, nb_par_piece, prix_piece_enr }]
  // État de la lecture des fournitures de la fiche ouverte (relecture 17/09/2026) :
  //   'ok'      = ce qui est à l'écran EST l'état de la base (fiche neuve, ou lecture réussie) ;
  //   'attente' = fiche existante dont la lecture n'est pas revenue ;
  //   'erreur'  = lecture en ÉCHEC (503 PostgREST / RLS) — l'écran affiche « Aucune matière » alors
  //               que la base en a : tout enregistrement est BLOQUÉ (il effacerait les fournitures).
  var nomFournituresEtat = 'ok';
  var nomEtapes      = [];
  var nomCurrentId   = null;
  var nomCurrentStatut = 'brouillon';
  var nomCurrentIndice = 'A';
  var nomCurrentGroupe = null;
  // Indice suivant (A→B→C…)
  function nomNextIndice(ind){ var c=(String(ind||'A').toUpperCase().charCodeAt(0)); return String.fromCharCode(c+1); }
  // Met à jour le libellé du bouton « → B »
  function nomMajIndiceLabel(){ var nx=document.getElementById('nom-indice-next'); if(nx) nx.textContent=nomNextIndice(nomCurrentIndice); }
  // Bouton « Incrémenter l'indice » : crée une nouvelle révision sans effacer l'ancienne
  async function nomCreerNouvelIndice(){
    if(!nomCurrentId){ pushNotif('err','fa-exclamation-triangle','Enregistrez d\\'abord la nomenclature avant d\\'incrémenter l\\'indice.'); return; }
    if (nomTauxIllisibles() || nomFournituresIllisibles()) return;
    // Lot H0 : une révision NAÎT en cours (comme depuis la liste), jamais « valide » par recopie du statut courant.
    // La validation repasse par « Enregistrer et valider » (événement « validation » + instantané au journal EN 9100).
    var payload = nomCollectPayload('en_cours');
    payload.statut = 'en_cours';
    // La révision est une INSERTION (pas de composants ni de fournitures existants à protéger) :
    // ces drapeaux ne sont pas des colonnes.
    delete payload.vider_composants; delete payload.vider_fournitures;
    if(!payload.num_nom){ pushNotif('err','fa-exclamation-triangle','Le N° de nomenclature (réf. pièce) est obligatoire.'); return; }
    if(!await appConfirm('Créer la révision '+nomNextIndice(nomCurrentIndice)+' ? L\\'indice '+nomCurrentIndice+' actuel sera conservé.')) return;
    try{
      var res = await fetch('/api/nomenclature/'+payload.id+'/nouvel-indice', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      var data = await res.json();
      if(data.ok){
        var num = (data.data && data.data.num_nom) || data.num_nom || '';
        pushNotif('ok','fa-code-branch', (num?num+' — ':'') + 'Nouvel indice '+data.indice+' créé (révision '+nomCurrentIndice+' conservée).', 4500);
        if (data.journal === false) pushNotif('warn','fa-clipboard-list','Révision créée, mais le journal EN 9100 n’a pas pu la tracer : '+String(data.journal_raison||'').replace(/[<>]/g,'')+'.',9000);
        setTimeout(function(){ window.location.replace('/be/service?'+Date.now()+'#noms'); }, data.journal === false ? 6000 : 1000);
      } else { pushNotif('err','fa-ban', 'Erreur : '+(data.error||'inconnue')); }
    }catch(e){ pushNotif('err','fa-exclamation-circle','Erreur réseau : '+e.message); }
  }

  // Référentiels chargés côté serveur (process avec type + taux machine résolu, coût chargé RH moyen, fournisseurs ST)
  var BE_REFS_JS = ${sjX(BE_REFS)};
  // ── Coût horaire porté par le PROCESS (14/09/2026) — moteur partagé avec /be/analyse (miroir de etapeDecomp) ──
${BE_ETAPE_COUT_JS}
  var NOM_TX = beTauxAtelierClient(BE_REFS_JS);
  // Site de la nomenclature (taux homme = coût chargé RH moyen de CE site)
  function nomSite(){ var s=document.getElementById('nom-f-entite'); return (s && s.value === 'Semrac') ? 'Semrac' : 'Seem'; }
  // Décomposition d'une étape au prix du jour : taux machine du process EN DIRECT, taux homme du site
  function nomEtapeDecomp(e){ if (!NOM_TX) NOM_TX = beTauxAtelierClient(BE_REFS_JS); return beEtapeDecomp(e, NOM_TX, nomSite()); }
  // Lecture des taux en ÉCHEC côté serveur (≠ taux absent) : le coût recalculé à l'enregistrement serait faux
  // (prix de revient sans temps homme ou machine, taux_mo vide) et tracé « recalcul » au journal EN 9100, qui ne
  // s'efface pas. On bloque donc tout enregistrement de nomenclature jusqu'au rechargement de la page.
  function nomTauxIllisibles(){
    if (!BE_REFS_JS || !BE_REFS_JS.taux_erreur) return false;
    pushNotif('err','fa-ban','Enregistrement bloqué : taux de l\\'atelier illisibles ('+String(BE_REFS_JS.taux_erreur).replace(/</g,'&lt;')+'). Rechargez la page quand la base répond.', 9000);
    return true;
  }
  // Même principe pour les FOURNITURES : tant que leur lecture a échoué, l'écran ne reflète pas la
  // base et l'enregistrement les effacerait (upsertFournitures supprime puis réinsère).
  function nomFournituresIllisibles(){
    if (nomFournituresEtat !== 'erreur') return false;
    pushNotif('err','fa-ban','Enregistrement bloqué : les matières et accessoires de cette fiche n\\'ont pas pu être relus. Les enregistrer maintenant les effacerait. Refermez puis rouvrez la fiche.', 12000);
    return true;
  }

  var TYPES_FOURN = ['Matière première','Visserie / Boulonnerie','Composant acheté','Emballage','Consommable','Sous-traitance','Outillage','Autre'];

  // ── NOMENCLATURES STANDARD / MÈRE ────────────────────────────
  // Toutes les nomenclatures standard (pour le sélecteur de composants des mères)
  var NOM_STANDARDS = ${sjX(NOMS_STD.map((n:any)=>({id:n.id,num_nom:n.num_nom,code_ref_produit:n.code_ref_produit,description:n.description,prix_revient_unitaire:n.prix_revient_unitaire||0})))};
  // Toutes les révisions (toutes versions confondues) indexées par id → pour récupérer/ouvrir une révision
  var NOM_BY_ID = ${sjX(Object.fromEntries((NOMS as any[]).map(n => [String(n.id), n])))};
  // Lot H0 : lecture TOLÉRANTE des composants d'une mère — tableau (jsonb) OU chaîne JSON (colonne TEXT du schéma
  // Docker). Miroir client de composantsDe (shared.ts). Renvoie toujours un tableau.
  function nomComposantsDe(v){
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') { var s = v.trim(); if (!s) return []; try { var p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch(e) { return []; } }
    return [];
  }
  // Lot H0 : fiche FRAÎCHE à l'ouverture. Les boutons de la liste embarquent l'objet du rendu serveur : rouvrir juste
  // après un enregistrement montrait l'ancienne version (et la réenregistrer l'écrasait). On relit donc la fiche par
  // GET /api/nomenclature/:id ; repli sur NOM_BY_ID (tenu à jour par nomSave), puis sur l'objet sérialisé.
  function nomFicheFraiche(nom){
    var id = (nom && nom.id != null) ? String(nom.id) : '';
    var repli = (id && NOM_BY_ID[id]) ? NOM_BY_ID[id] : nom;
    if (!id) return Promise.resolve(repli);
    var ctrl = (typeof AbortController === 'function') ? new AbortController() : null;
    var minuteur = ctrl ? setTimeout(function(){ try { ctrl.abort(); } catch(e) {} }, 6000) : null;
    var opts = { cache: 'no-store', headers: { 'Accept': 'application/json' } };
    if (ctrl) opts.signal = ctrl.signal;
    return fetch('/api/nomenclature/' + encodeURIComponent(id), opts)
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        var f = (j && j.ok) ? (j.data || j.nomenclature || null) : null;
        if (f && typeof f === 'object' && String(f.id) === id) { NOM_BY_ID[id] = f; return f; }
        return repli;
      })
      .catch(function(){ return repli; })
      .then(function(res){ if (minuteur) clearTimeout(minuteur); return res; });
  }
  // Lot H0 : après un enregistrement réussi, l'instantané local reprend ce qui vient d'être écrit (repli de nomFicheFraiche).
  function nomMajInstantane(payload, data){
    var id = String((data && data.id) || (payload && payload.id) || ''); if (!id) return;
    var maj = Object.assign({}, NOM_BY_ID[id] || {});
    Object.keys(payload || {}).forEach(function(k){
      if (k === 'fournitures' || k === 'vider_composants' || k === 'temps_reglage_total_min' || k === 'temps_unitaire_total_min') return;
      maj[k] = payload[k];
    });
    maj.id = (data && data.id) || payload.id;
    if (data && data.statut) maj.statut = data.statut;
    if (data && data.indice) maj.indice = data.indice;
    if (data && data.num_nom) maj.num_nom = data.num_nom;
    NOM_BY_ID[id] = maj;
  }
  // Ouvrir une révision choisie dans la liste déroulante d'indice
  function nomSelectVersion(id){ var n = NOM_BY_ID[String(id)]; if(n) nomOpenForm(n); }
  // onchange du sélecteur d'indice : ouvrir une révision OU créer l'indice suivant (option « __new__:<id> »)
  function nomChangerIndice(val){
    if(val && val.indexOf('__new__:')===0){ nomCreerIndiceDepuisListe(val.slice(8)); return; }
    nomSelectVersion(val);
  }
  // Crée une nouvelle révision (indice suivant) depuis la liste, en clonant la dernière révision (ancienne conservée).
  async function nomCreerIndiceDepuisListe(baseId){
    var base = NOM_BY_ID[String(baseId)];
    var ref = base ? (base.code_ref_produit || base.num_nom || base.id) : baseId;
    if(!await appConfirm('Créer la révision suivante de « '+ref+' » ?\\nL\\'indice actuel est conservé ; le nouvel indice reprend la nomenclature (modifiable ensuite).')){
      setTimeout(function(){ window.location.replace('/be/service?'+Date.now()+'#noms'); }, 50); // réinitialise le select
      return;
    }
    fetch('/api/nomenclature/'+encodeURIComponent(baseId)+'/nouvel-indice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ id: baseId })})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Création de l\\'indice échouée.'); return; }
        pushNotif('ok','fa-code-branch','Nouvel indice '+(j.indice||'')+' créé (révision précédente conservée).',4500);
        if(j.journal===false) pushNotif('warn','fa-clipboard-list','Révision créée, mais le journal EN 9100 n’a pas pu la tracer : '+String(j.journal_raison||'').replace(/[<>]/g,'')+'.',9000);
        setTimeout(function(){ window.location.replace('/be/service?'+Date.now()+'#noms'); },j.journal===false?6000:900);
      }).catch(function(){ pushNotif('err','fa-times','Erreur réseau.'); });
  }
  // Filtre Seem / Semrac d'une liste de nomenclatures
  function nomFilterEntite(tblId, ent, btn){
    var tbl=document.getElementById(tblId);
    if(tbl){ tbl.querySelectorAll('tbody tr').forEach(function(tr){ if(!tr.dataset.entite) return; tr.style.display=(ent==='tous'||tr.dataset.entite===ent)?'':'none'; }); }
    document.querySelectorAll('.nom-ent-btn[data-tbl="'+tblId+'"]').forEach(function(b){
      b.style.background='white';
      if(b.textContent.indexOf('Semrac')>=0){ b.style.color='#991b1b'; b.style.borderColor='#fecaca'; }
      else if(b.textContent.indexOf('Seem')>=0){ b.style.color='#166534'; b.style.borderColor='#bbf7d0'; }
      else { b.style.color='#8b5cf6'; b.style.borderColor='#8b5cf6'; }
    });
    if(btn){
      if(ent==='Semrac'){ btn.style.background='#991b1b'; btn.style.color='white'; btn.style.borderColor='#991b1b'; }
      else if(ent==='Seem'){ btn.style.background='#166534'; btn.style.color='white'; btn.style.borderColor='#166534'; }
      else { btn.style.background='#8b5cf6'; btn.style.color='white'; btn.style.borderColor='#8b5cf6'; }
    }
  }
  // Composants de la mère en cours d'édition : [{nom_id, num_nom, code, prix, qte}]
  var nomComposants = [];
  // Lot H0 : garde-fou contre l'écrasement des composants. Une liste VIDE n'est envoyée que si l'utilisateur a
  // explicitement retiré / changé des composants (drapeau vider_composants) ; sinon la clé est omise et la base garde les siens.
  var nomComposantsModifies = false;
  var nomTypeCharge = 'standard';   // type de la fiche à l'ouverture (mère → standard = retrait explicite des composants)

  // Bascule le type de nomenclature (standard / mère)
  function nomSetType(t) {
    if (t !== 'mere') t = 'standard';
    var inp = document.getElementById('nom-f-type');
    if (inp) inp.value = t;
    ['standard','mere'].forEach(function(k){
      var b = document.getElementById('nom-type-btn-'+k);
      if (!b) return;
      var on = (k === t);
      b.style.background = on ? '#fff' : 'transparent';
      b.style.color      = on ? '#6d28d9' : '#64748b';
      b.style.boxShadow  = on ? '0 1px 3px rgba(0,0,0,.12)' : 'none';
    });
    var mb = document.getElementById('nom-f-mere-block');
    if (mb) mb.style.display = (t === 'mere') ? 'block' : 'none';
    // Une mère est un assemblage : la matière/fournitures propres ne s'appliquent pas.
    var fourBlock = document.getElementById('nom-fournitures-block');
    // '' rend la main à la feuille de style (#nom-fournitures-block = flex colonne + gap) : 'block'
    // écraserait la mise en page et recollerait les deux compartiments.
    if (fourBlock) fourBlock.style.display = (t === 'mere') ? 'none' : '';
    if (t === 'mere') nomRenderComposants();
    nomCalcTotaux();
  }

  // ── Composants d'une mère (assemblage de standards) ──
  function nomAddComposant() {
    nomComposants.push({ nom_id:'', num_nom:'', code:'', prix:0, qte:1 });
    nomRenderComposants();
  }
  function nomRemoveComposant(i) { nomComposants.splice(i,1); nomComposantsModifies = true; nomRenderComposants(); nomCalcTotaux(); }
  function nomComposantTotal() {
    return nomComposants.reduce(function(s,c){ return s + ((parseFloat(c.prix)||0) * (parseFloat(c.qte)||0)); }, 0);
  }
  function nomRenderComposants() {
    var c = document.getElementById('nom-f-composants-list');
    if (!c) return;
    if (!nomComposants.length) {
      c.innerHTML = '<div style="text-align:center;padding:12px;color:#9ca3af;font-size:.74rem;border:1.5px dashed #fde68a;border-radius:8px;background:#fff;">Aucun composant. Cliquez « Ajouter un standard » pour assembler la mère.</div>';
    } else {
      c.innerHTML = nomComposants.map(function(cp, i){
        var opts = '<option value="">— Choisir un standard —</option>' + NOM_STANDARDS.map(function(s){
          var label = ((s.num_nom||'') + ' · ' + (s.code_ref_produit||'')).replace(/</g,'&lt;').replace(/"/g,'&quot;');
          return '<option value="'+s.id+'"'+(String(s.id)===String(cp.nom_id)?' selected':'')+'>'+label+'</option>';
        }).join('');
        var lineTotal = ((parseFloat(cp.prix)||0)*(parseFloat(cp.qte)||0)).toFixed(2);
        return '<div style="display:grid;grid-template-columns:1fr 70px 80px 28px;gap:6px;align-items:center;background:#fff;border:1px solid #fde68a;border-radius:8px;padding:6px 8px;margin-bottom:4px;">'
          + '<select onchange="nomComposantPick('+i+',this.value)" style="border:1px solid #e2e8f0;border-radius:6px;padding:4px 6px;font-size:.76rem;">'+opts+'</select>'
          + '<input type="number" step="0.001" min="0" value="'+(cp.qte!=null?cp.qte:1)+'" oninput="nomComposants['+i+'].qte=parseFloat(this.value)||0;nomRenderComposants();nomCalcTotaux();" style="border:1px solid #e2e8f0;border-radius:6px;padding:4px 6px;font-size:.76rem;text-align:right;" title="Quantité"/>'
          + '<div style="text-align:right;font-size:.74rem;font-weight:700;color:#92400e;">'+lineTotal+' €</div>'
          + '<button type="button" onclick="nomRemoveComposant('+i+')" style="width:24px;height:24px;border-radius:6px;border:none;background:#fee2e2;color:#dc2626;cursor:pointer;font-weight:700;">×</button>'
          + '</div>';
      }).join('');
    }
    var tot = document.getElementById('nom-composants-total');
    if (tot) tot.textContent = nomComposantTotal().toFixed(2) + ' €';
  }
  function nomComposantPick(i, id) {
    var s = NOM_STANDARDS.find(function(x){ return String(x.id) === String(id); });
    nomComposantsModifies = true;
    nomComposants[i].nom_id = id;
    nomComposants[i].num_nom = s ? (s.num_nom||'') : '';
    nomComposants[i].code = s ? (s.code_ref_produit||'') : '';
    nomComposants[i].prix = s ? (s.prix_revient_unitaire||0) : 0;
    nomRenderComposants(); nomCalcTotaux();
  }

  // « + Nouvelle mère » → formulaire mère vierge
  function nomNewMere() {
    nomNewForm();
    nomSetType('mere');
    document.getElementById('nom-form-title').textContent = 'Nouvelle nomenclature mère';
  }
  // « + Nouvelle nomenclature standard » → formulaire standard vierge
  function nomNewStandard() {
    nomNewForm();
    nomSetType('standard');
    document.getElementById('nom-form-title').textContent = 'Nouvelle nomenclature standard';
  }

  function nomNewForm() {
    nomOuvertureJeton++; nomOuvertureCible = null;   // relecture H0 : une ouverture encore en vol ne remplacera pas ce formulaire
    nomCurrentId = null;
    GED_DOCS = []; gedRefreshUi(); gedRenderAll();   // GED : nouvelle nomenclature → zones masquées jusqu'à enregistrement
    nomJournalLoad();                                 // journal : rien avant le premier enregistrement
    nomCurrentStatut = 'brouillon';
    nomCurrentIndice = 'A';
    nomCurrentGroupe = null;
    nomFournitures = [];
    nomMatieres    = [];
    nomAccessoires = [];
    nomFournituresEtat = 'ok';   // fiche neuve : la liste affichée EST la liste à enregistrer
    nomEtapes      = [];
    // Nouveau produit → indice A, pas de bandeau de révision (bouton inutile tant que non enregistré)
    var rb=document.getElementById('nom-revision-banner'); if(rb) rb.style.display='none';
    document.getElementById('nom-f-id').textContent = '';
    document.getElementById('nom-f-num').value = '';
    document.getElementById('nom-f-affaire').value = '';
    var ent0=document.getElementById('nom-f-entite'); if(ent0) ent0.value='Seem';
    document.getElementById('nom-f-code').value = '';
    document.getElementById('nom-f-desc').value = '';
    var _np0=document.getElementById('nom-f-numplan'); if(_np0)_np0.value='';
    var _pf0=document.getElementById('nom-f-planfic'); if(_pf0)_pf0.value='';
    var _po0=document.getElementById('nom-plan-ouvrir'); if(_po0)_po0.innerHTML='';   // pas de lien herite de la fiche precedente
    document.getElementById('nom-f-masse').value = '';
    document.getElementById('nom-f-dims').value = '';
    (document.getElementById('nom-f-surface')||{}).value = '';
    document.getElementById('nom-f-createur').value = '';
    document.getElementById('nom-f-notes').value = '';
    // Type → standard par défaut ; composants vidés
    nomComposants = [];
    nomComposantsModifies = false;
    nomTypeCharge = 'standard';
    nomSetType('standard');
    document.getElementById('nom-form-title').textContent = 'Nouvelle nomenclature';
    document.getElementById('nom-form-statut-badge').innerHTML = '';
    nomRenderMatieres();
    nomRenderAccessoires();
    nomRenderEtapes();
    nomCalcTotaux();
    document.getElementById('nom-list-view').style.display = 'none';
    document.getElementById('nom-form-view').style.display = 'block';
  }

  // Création de nomenclature pré-remplie depuis une pièce d'une DT en attente nomenclature.
  // Une fois la nomenclature validée, l'API serveur fait basculer la DT vers en_attente_be automatiquement.
  function nomNewFromDT(numAffaire, piece) {
    nomNewForm();
    document.getElementById('nom-f-affaire').value = numAffaire || '';
    document.getElementById('nom-f-num').value     = piece.ref || '';
    document.getElementById('nom-f-code').value    = piece.ref || '';
    // Réf client + client → bloc « Clients & réfs » (pas dans la description : c'est le BE qui remplit la description).
    // Quantité DT → reste dans la DT, réapparaît à l'Analyse DT ; jamais reportée dans la nomenclature.
    document.getElementById('nom-f-desc').value = '';
    var _np1=document.getElementById('nom-f-numplan'); if(_np1)_np1.value = piece.plan || '';
    document.getElementById('nom-form-title').textContent = 'Nouvelle nomenclature (DT ' + numAffaire + ')';
    nomRefsClientsLoad(piece.ref || '');   // affiche les clients déjà reliés à cette réf (depuis les DT validées)
    pushNotif('info','fa-link','Nomenclature pré-remplie depuis la DT ' + numAffaire + '. Validez-la pour débloquer l\\'analyse BE.', 5500);
  }

  // Ouverture verrouillée : une nomenclature existante ne peut être éditée que par une personne à la fois.
  // Relecture H0 : l'ouverture est asynchrone (relecture jusqu'à 6 s). Chaque ouverture / nouvelle fiche / fermeture prend
  // un jeton : une réponse arrivée après coup (autre fiche ouverte entre-temps) est ignorée, et son verrou relâché.
  var nomOuvertureJeton = 0;
  var nomOuvertureCible = null;
  function nomOpenForm(nom) {
    var jeton = ++nomOuvertureJeton;
    nomOuvertureCible = (nom && nom.id) ? String(nom.id) : null;
    if (nom && nom.id) {
      ErpLock.acquire('nomenclature:' + nom.id, {
        // Lot H0 : on ouvre la fiche relue en base (repli : instantané local, puis objet de la liste)
        onOk: function(){ nomFicheFraiche(nom).then(function(f){
          if (jeton !== nomOuvertureJeton) {
            var fv = document.getElementById('nom-form-view');
            var affichee = !!(fv && fv.style.display !== 'none' && String(nomCurrentId || '') === String(nom.id));
            if (String(nom.id) !== String(nomOuvertureCible || '') && !affichee) ErpLock.release('nomenclature:' + nom.id);
            return;
          }
          nomOpenFormReal(f || nom);
        }); },
        onBlocked: function(by){ pushNotif('err','fa-lock','Nomenclature en cours d\\'édition par ' + by + ' — patientez qu\\'il ait terminé (la liste se met à jour en direct).', 7000); },
        onLost: function(by){ pushNotif('err','fa-lock', (by || 'Quelqu\\'un d\\'autre') + ' a pris la main sur cette nomenclature — enregistrez prudemment.', 7000); }
      });
    } else { nomOpenFormReal(nom); }
  }
  function nomOpenFormReal(nom) {
    nomCurrentId = nom.id || null;
    gedRefreshUi(); gedLoad();   // GED : charge les documents rattachés à cette nomenclature
    nomJournalLoad();            // journal EN 9100 de cette fiche
    nomRefsClientsLoad(nom.code_ref_produit || nom.num_nom || '');   // répertoire clients de cette pièce
    nomCurrentStatut = nom.statut || 'brouillon';
    nomCurrentIndice = nom.indice || 'A';
    nomCurrentGroupe = nom.version_groupe || nom.id || null;
    nomFournitures = [];
    nomMatieres    = [];
    nomAccessoires = [];
    nomFournituresEtat = nom.id ? 'attente' : 'ok';   // fiche existante : l'écran ne fait pas foi tant que la relecture n'a pas répondu
    nomEtapes      = Array.isArray(nom.etapes_production) ? nom.etapes_production.slice() : [];
    // Le site pilote le taux homme des étapes : il est posé AVANT la mise en forme des anciennes étapes.
    var _entOpen = document.getElementById('nom-f-entite'); if (_entOpen) _entOpen.value = (nom.entite === 'Semrac') ? 'Semrac' : 'Seem';
    // Compat anciennes étapes et gammes importées → temps VISIBLES en minutes, SANS changer leur coût :
    // chaque conversion donne, au format minutes, exactement la décomposition du moteur (nomEtapeDecomp).
    nomEtapes.forEach(function(e){ nomEtapeCompleterMinutes(e); });
    // Bandeau de révision : indice actuel + bouton d'incrément
    var rb=document.getElementById('nom-revision-banner'); if(rb) rb.style.display='flex';
    var ia=document.getElementById('nom-indice-actuel'); if(ia) ia.textContent = nomCurrentIndice;
    nomMajIndiceLabel();
    document.getElementById('nom-f-id').textContent = nom.id || '';
    document.getElementById('nom-f-num').value = nom.num_nom || '';
    document.getElementById('nom-f-affaire').value = nom.num_affaire || '';
    document.getElementById('nom-f-entite').value = (nom.entite === 'Semrac') ? 'Semrac' : 'Seem';
    document.getElementById('nom-f-code').value = nom.code_ref_produit || '';
    document.getElementById('nom-f-desc').value = nom.description || '';
    var _np2=document.getElementById('nom-f-numplan'); if(_np2)_np2.value = nom.num_plan || '';
    var _pf2=document.getElementById('nom-f-planfic'); if(_pf2)_pf2.value = nom.plan_fichier || '';
    document.getElementById('nom-f-masse').value = (nom.masse_kg != null && nom.masse_kg !== '') ? +(Number(nom.masse_kg) * 1000).toFixed(3) : '';  // kg (DB) → g (saisie)
    document.getElementById('nom-f-dims').value = nom.dimensions || '';
    // Surface saisie en mm² (stockée en dm² : 1 dm² = 10 000 mm²)
    var _surf = document.getElementById('nom-f-surface'); if(_surf) _surf.value = (nom.surface_totale_dm2 != null && nom.surface_totale_dm2 !== '') ? Math.round(nom.surface_totale_dm2 * 10000) : '';
    document.getElementById('nom-f-createur').value = nom.cree_par || '';
    document.getElementById('nom-f-notes').value = nom.notes || '';
    // Type standard / mère + composants (pour une mère)
    var nt = (nom.type_nom === 'mere') ? 'mere' : 'standard';
    // Lot H0 : lecture tolérante (tableau ou chaîne JSON) — sinon une mère rouverte perdait ses composants
    nomComposants = (nt === 'mere')
      ? nomComposantsDe(nom.composants).filter(function(c){ return c && typeof c === 'object'; }).map(function(c){ return { nom_id:c.nom_id||'', num_nom:c.num_nom||'', code:c.code||'', prix:c.prix||0, qte:c.qte!=null?c.qte:1 }; })
      : [];
    nomComposantsModifies = false;
    nomTypeCharge = nt;
    nomSetType(nt);
    document.getElementById('nom-form-title').textContent = nom.num_nom || 'Nomenclature';
    nomRenderMatieres();
    nomRenderAccessoires();
    nomRenderEtapes();
    nomCalcTotaux();
    // Recharge les fournitures persistées (matière + accessoires) et les répartit dans les 2 compartiments
    if (nom.id) nomLoadFournitures(nom.id);
    document.getElementById('nom-list-view').style.display = 'none';
    document.getElementById('nom-form-view').style.display = 'block';
  }

  // Charge les fournitures d'une nomenclature et les éclate en matières / accessoires
  function nomLoadFournitures(id) {
    var jeton = nomOuvertureJeton;   // relecture H0 : fournitures d'une fiche quittée entre-temps → ignorées
    fetch('/api/nomenclature/' + encodeURIComponent(id) + '/fournitures')
      .then(function(r){ return r.json(); })
      .then(function(j){
        if (jeton !== nomOuvertureJeton || String(nomCurrentId || '') !== String(id)) return;
        // ⚠ Lecture en ÉCHEC : l'écran affiche deux compartiments VIDES alors que la base a peut-être
        //   des fournitures. Le retour silencieux d'avant laissait croire à une fiche sans matière et
        //   l'« Enregistrer » suivant les effaçait vraiment. On le DIT et on bloque l'enregistrement
        //   jusqu'à la réouverture de la fiche (même patron que nomTauxIllisibles).
        if (!j || !j.ok || !Array.isArray(j.fournitures)) {
          nomFournituresEtat = 'erreur';
          beNotif('err','fa-triangle-exclamation','Matières et accessoires de cette fiche ILLISIBLES ('+String((j&&j.error)||'aucune réponse').replace(/[<>]/g,'')+'). Les compartiments affichés sont vides mais la base ne l\\'est pas forcément : l\\'enregistrement est bloqué. Refermez puis rouvrez la fiche quand la base répond.', 14000);
          return;
        }
        nomFournituresEtat = 'ok';
        nomMatieres = []; nomAccessoires = [];
        // Lot H1 (contrat §4) : lecture compatible des DEUX modèles. Une ANCIENNE ligne porte encore
        // «fournisseur» + «qte_paquet» et un «prix_unitaire» qui est le prix du PAQUET : on ramène sa
        // copie au prix d'UNE pièce pour l'affichage, et on la marque «_ancien_modele».
        // Rien n'est réécrit en base ici : la bascule au nouveau modèle n'a lieu qu'au prochain
        // enregistrement VOLONTAIRE (aucune reprise en masse). Le champ «fournisseur» n'est plus lu :
        // la ligne est chiffrée par le prix moyen de sa référence, tous fournisseurs confondus.
        j.fournitures.forEach(function(f){
          var cat = categorieFourniture((f.categorie != null && f.categorie !== '') ? f.categorie : f.type_fourniture);
          var pu = nombrePositif(f.prix_unitaire);
          if (cat === 'matiere') {
            var npt = nombrePositif(f.nb_par_tole);
            nomMatieres.push({ ref:f.ref_stock||'', designation:f.designation||'',
              nb_par_tole: (npt===null ? 1 : npt), prix_tole_enr: pu });
          } else {
            // accessoire (ou ancienne fourniture sans catégorie → traitée en accessoire)
            var qp  = nombrePositif(f.qte_paquet);
            var nbp = nombrePositif(f.quantite_par_piece);
            nomAccessoires.push({ ref:f.ref_stock||'', designation:f.designation||'',
              nb_par_piece: (nbp===null ? 1 : nbp),
              prix_piece_enr: (pu===null ? null : (qp===null ? pu : arrondiPrix(pu/qp))),
              _ancien_modele: (qp !== null || (f.fournisseur != null && String(f.fournisseur) !== '')) });
          }
        });
        nomRenderMatieres(); nomRenderAccessoires(); nomCalcTotaux();
      })
      .catch(function(){
        if (jeton !== nomOuvertureJeton || String(nomCurrentId || '') !== String(id)) return;
        nomFournituresEtat = 'erreur';
        beNotif('err','fa-triangle-exclamation','Matières et accessoires de cette fiche non chargés (erreur réseau) : l\\'enregistrement est bloqué pour ne pas les effacer. Rouvrez la fiche.', 12000);
      });
  }

  function nomCloseForm() {
    nomOuvertureJeton++; nomOuvertureCible = null;   // relecture H0 : une ouverture encore en vol ne rouvrira pas le formulaire
    if (nomCurrentId) ErpLock.release('nomenclature:' + nomCurrentId);   // relâche le verrou d'édition
    document.getElementById('nom-form-view').style.display = 'none';
    document.getElementById('nom-list-view').style.display = 'block';
  }

  // ══ FOURNITURES : Matière (tôle) + Accessoires — lot H1 (17/09/2026) ═══════════════════════════
  // Une ligne ne porte plus de FOURNISSEUR ni de QTÉ/PAQUET : elle porte une RÉFÉRENCE.
  // Son prix est la MOYENNE des prix de tous les fournisseurs qui portent cette référence au
  // catalogue (produits_fournisseurs → NOM_PRODUITS), calculée par «prixMoyenReference» — LA MÊME
  // fonction que le serveur (injectée en tête de ce <script>). Aucune règle de prix n'est recopiée ici.
  //   matière    : prix moyen d'UNE TÔLE ÷ Pc/tôle = prix matière par pièce (Pc/tôle reste saisi au BE).
  //   accessoire : prix moyen d'UNE PIÈCE (chaque fournisseur ramené à la pièce par sa qté/paquet,
  //                déclarée au CATALOGUE) × Nb/pièce.
  // Conventions des deux listes :
  //   nomMatieres[i]    = { ref, designation, nb_par_tole,  prix_tole_enr,  rfq_pending, _rfqId, _rfqAt, _rfqClos, _pm, _prixTole, _prixPiece, _statut }
  //   nomAccessoires[i] = { ref, designation, nb_par_piece, prix_piece_enr, rfq_pending, …,      _pm, _prixPiece, _prixTotal, _statut, _ancien_modele }
  //   «prix_*_enr» = COPIE ENREGISTRÉE dans la nomenclature. Elle ne sert que de repli quand la
  //   référence n'a AUCUN prix au catalogue : le prix affiché n'est alors jamais remis à 0 (règle du
  //   lot H0), exactement comme «recalculerFournitures» côté serveur laisse la copie telle quelle.
  // Argument «k» des fonctions ci-dessous : 1 = matière, 0 = accessoire (un nombre, pas une chaîne :
  // il part dans des attributs onclick/oninput, où une chaîne imposerait un échappement de plus).

  function nomFourListe(k){ return k ? nomMatieres : nomAccessoires; }
  function nomFourCat(k){ return k ? 'matiere' : 'accessoire'; }
  function nomFourRendre(k){ if(k) nomRenderMatieres(); else nomRenderAccessoires(); }
  function nomEscH(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function nomEscA(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
  function nomFmt(v,d){ var n=Number(v); if(!isFinite(n)) n=0; return n.toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d}); }
  function nomFmtEur(v,d){ return nomFmt(v,d)+' €'; }

  function nomAddMatiere() {
    nomMatieres.push({ ref:'', designation:'', nb_par_tole:1, prix_tole_enr:null });
    nomRenderMatieres();
  }
  function nomAddAccessoire() {
    nomAccessoires.push({ ref:'', designation:'', nb_par_piece:1, prix_piece_enr:null });
    nomRenderAccessoires();
  }
  function nomFourRemove(k, i) { nomFourListe(k).splice(i,1); nomPopFermer(); nomPrixDetailFermer(); nomFourRendre(k); nomCalcTotaux(); }

  // ── Fournisseurs (réels) : plus aucun choix de fournisseur sur une ligne ; ils ne servent plus
  //    qu'aux DESTINATAIRES d'une demande de prix (§6) et au nom affiché dans le détail du prix.
  var NOM_FOURNISSEURS = (BE_REFS_JS.fournisseurs || []);
  var NOM_PRODUITS = ${sjX(PRODUITS_NOM)};
  // ── Temps réel (polling ~7 s) : la liste des nomenclatures se rafraîchit quand elle change — jamais pendant une édition ──
  var NOM_SIG = ${JSON.stringify(`${NOMS.length}:${NOMS.filter((n: any) => n.statut === 'valide').length}:${(NOMS as any[]).reduce((m: string, n: any) => { const u = String(n.updated_at || n.created_at || ''); return u > m ? u : m }, '')}`)};
  setInterval(function(){
    var fv=document.getElementById('nom-form-view'); if(fv && fv.style.display!=='none') return;   // on édite -> pas de reload
    var panel=document.getElementById('be-panel-noms'); if(!panel || panel.style.display==='none') return;   // pas sur l'onglet Nomenclatures
    fetch('/api/be/noms-signature').then(function(r){return r.json();}).then(function(j){
      if(j && j.ok && j.sig && j.sig!==NOM_SIG){ NOM_SIG=j.sig; if(window.pushNotif)pushNotif('info','fa-sync','Nomenclatures mises à jour — actualisation…',2500); setTimeout(function(){softReload();},900); }
    }).catch(function(){});
  }, 7000);
  // Prix « frais » = daté de moins de PRIX_VALIDITE_JOURS (6 mois, constante de shared.ts) ET non nul.
  // Ne sert plus qu'à juger UNE ligne catalogue (réponse à une demande de prix) : le chiffrage d'une
  // ligne de nomenclature passe par prixMoyenReference / prixPerime (module partagé).
  var NOM_PRIX_VALIDITE_JOURS = ${JSON.stringify(PRIX_VALIDITE_JOURS)};
  var NOM_PRIX_VALIDITE_LIB = ${sjX(PRIX_VALIDITE_LIB)};
  function nomPrixFrais(datePrix, prix){ if(nombrePositif(prix)===null) return false; return !prixPerime(datePrix, NOM_PRIX_VALIDITE_JOURS); }
  // Lot H0 : une demande peut viser une ligne dont le prix est DÉJÀ frais. Elle n'est « répondue » que par un prix daté
  // du jour de la demande ou après ; sinon l'attente disparaîtrait aussitôt (le prix frais existant la solderait).
  // Une demande connue du serveur (_rfqId) n'est répondue qu'une fois VALIDÉE par les Achats (statut
  // « cloturee », constaté par nomRfqVerifier) ; la règle de date ne reste qu'en repli.
  function nomRfqRepondue(item, datePrix){ if(!item || !item._rfqAt) return true; if(item._rfqClos) return true; if(item._rfqId) return false; var t=Date.parse(datePrix); if(isNaN(t)) return false; return t >= Math.floor(item._rfqAt/86400000)*86400000; }
  // Le catalogue local (NOM_PRODUITS, rendu serveur) suit un prix reçu, sinon le rendu suivant le
  // jugerait encore absent. Écriture TOLÉRANTE de qte_paquet : la route /api/produit-prix peut ne pas
  // rendre ce champ (cloud sans cloud-13, ou route pas encore étendue) — on ne l'écrase alors jamais.
  function nomMajProduitLocal(l, cat){
    if (!l || !l.reference) return;
    var p = null, i;
    for (i=0;i<NOM_PRODUITS.length;i++){
      var x = NOM_PRODUITS[i];
      if (String(x.fournisseur_id==null?'':x.fournisseur_id) === String(l.fournisseur_id==null?'':l.fournisseur_id) && memeReference(x.reference, l.reference)) { p = x; break; }
    }
    if (p) {
      p.prix = l.prix; p.date_prix = l.date_prix;
      if (nombrePositif(l.qte_paquet) !== null) p.qte_paquet = l.qte_paquet;
      if (l.conditionnement != null && l.conditionnement !== '') p.conditionnement = l.conditionnement;
      if (!p.designation) p.designation = l.designation || '';
      if (!p.fournisseur_nom && l.fournisseur_nom) p.fournisseur_nom = l.fournisseur_nom;
      if (!p.categorie && (l.categorie || cat)) p.categorie = l.categorie || cat;
      return;
    }
    NOM_PRODUITS.push({ fournisseur_id: l.fournisseur_id, fournisseur_nom: l.fournisseur_nom || '', reference: l.reference,
      designation: l.designation || '', prix: l.prix, qte_paquet: (nombrePositif(l.qte_paquet)!==null ? l.qte_paquet : null),
      conditionnement: l.conditionnement, date_prix: l.date_prix, categorie: l.categorie || cat, source_prix: l.source_prix || 'rfq' });
  }
  // Vérifie la réponse à la demande de prix d'une ligne. Plus de fournisseur sur la ligne : on relit
  // TOUTES les lignes chiffrées de la référence (elles entrent toutes dans la moyenne).
  //  1) demande connue (_rfqId) : attend sa VALIDATION par les Achats ; 2) relecture du catalogue ;
  //  3) mise à jour de NOM_PRODUITS → la moyenne se recalcule au rendu suivant.
  //  fini(etat, n) : 'attente' | 'recu' (n prix récents) | 'sans_prix' (validée sans prix récent)
  function nomRfqVerifier(item, cat, fini){
    var statut = (item._rfqId && !item._rfqClos)
      ? fetch('/api/demandes-prix/'+encodeURIComponent(item._rfqId), { cache:'no-store' }).then(function(r){ return r.json(); }).then(function(j){ if (j && j.ok && j.demande && j.demande.statut === 'cloturee') item._rfqClos = true; })
      : Promise.resolve();
    return statut.then(function(){
      if (item._rfqId && !item._rfqClos) { fini('attente', 0); return; }
      // La CATÉGORIE part toujours : sans elle la route se rabattait sur « accessoire » et publiait,
      // pour une ligne matière, un prix moyen de sémantique accessoire (prix de la TÔLE annoncé
      // comme prix à la pièce). Pour la matière on joint aussi le nb de pièces par tôle (géométrie).
      var mat = (categorieFourniture(cat) === 'matiere');
      var q = (item.ref ? ('reference='+encodeURIComponent(item.ref)) : ('designation='+encodeURIComponent(item.designation||'')))
        + '&categorie=' + (mat ? 'matiere' : 'accessoire')
        + (mat && nombrePositif(item.nb_par_tole) !== null ? ('&nb_par_tole=' + encodeURIComponent(item.nb_par_tole)) : '');
      return fetch('/api/produit-prix?'+q, { cache:'no-store' }).then(function(r){ return r.json(); }).then(function(j){
        var lignes = (j && j.ok && Array.isArray(j.lignes)) ? j.lignes : [];
        var ok = lignes.filter(function(l){ return nomPrixFrais(l.date_prix, l.prix) && nomRfqRepondue(item, l.date_prix); });
        ok.forEach(function(l){
          nomMajProduitLocal(l, cat);
          if (!item.ref && l.reference) item.ref = l.reference;
          if (!item.designation && l.designation) item.designation = l.designation;
        });
        fini(ok.length ? 'recu' : (item._rfqClos ? 'sans_prix' : 'attente'), ok.length);
      });
    }).catch(function(){});
  }
  // Applique le résultat de nomRfqVerifier ; bruit = clic explicite (message « pas encore de réponse »).
  function nomRfqAppliquer(item, etat, n, rendre, bruit){
    if (!item.rfq_pending) return;   // demande abandonnée entre-temps (référence changée par l'utilisateur)
    if (etat === 'attente') { if (bruit) beNotif('ok','fa-clock','Pas encore de réponse validée par les Achats pour cette ligne.'); return; }
    item.rfq_pending = false; item._rfqAt = null;
    rendre(); nomCalcTotaux();
    if (etat === 'recu') beNotif('ok','fa-check', (n>1 ? ('Prix reçus de '+n+' fournisseurs') : 'Prix reçu') + ' — prix moyen et coûts recalculés.');
    else beNotif('warn','fa-exclamation-circle','Demande de prix validée, mais aucun prix récent pour cette référence (prix actuel conservé).');
  }

  // ── Chiffrage d'une ligne — prix moyen du catalogue (module partagé) ────────────────────────────
  // Référence absente du catalogue, ou sans aucun prix : «incomplet». On GARDE alors la copie
  // enregistrée (jamais de remise à 0 au rendu, lot H0) et la ligne passe en orange « hors
  // catalogue » ; sans copie non plus, elle passe en ROUGE « coût incomplet » (la validation de la
  // nomenclature reste permise, spec §3).
  function nomMatiereAppliquer(m){
    var pm = prixMoyenReference(NOM_PRODUITS, m.ref||'', 'matiere', { nbParTole: m.nb_par_tole, validiteJours: NOM_PRIX_VALIDITE_JOURS });
    m._pm = pm;
    if (m.rfq_pending && !pm.incomplet && nomRfqRepondue(m, pm.date_plus_recente)) { m.rfq_pending = false; m._rfqAt = null; }
    var enr = nombrePositif(m.prix_tole_enr);
    if (pm.incomplet) { m._prixTole = (enr===null ? 0 : enr); m._statut = m.rfq_pending ? 'pending' : (enr===null ? 'incomplet' : 'garde'); }
    else { m._prixTole = pm.prix_base; m._statut = m.rfq_pending ? 'pending' : (pm.perime ? 'perime' : 'ok'); }
    var npt = nombrePositif(m.nb_par_tole);
    m._prixPiece = (npt===null) ? 0 : arrondiPrix(m._prixTole / npt);
    return pm;
  }
  function nomAccAppliquer(a){
    var pm = prixMoyenReference(NOM_PRODUITS, a.ref||'', 'accessoire', { validiteJours: NOM_PRIX_VALIDITE_JOURS });
    a._pm = pm;
    if (a.rfq_pending && !pm.incomplet && nomRfqRepondue(a, pm.date_plus_recente)) { a.rfq_pending = false; a._rfqAt = null; }
    var enr = nombrePositif(a.prix_piece_enr);
    if (pm.incomplet) { a._prixPiece = (enr===null ? 0 : enr); a._statut = a.rfq_pending ? 'pending' : (enr===null ? 'incomplet' : 'garde'); }
    else { a._prixPiece = pm.prix_unitaire; a._statut = a.rfq_pending ? 'pending' : ((pm.perime || pm.sans_conditionnement.length) ? 'perime' : 'ok'); }
    var nbp = nombrePositif(a.nb_par_piece);
    // §8 : plus jamais 0 quand la qté/paquet manque — c'est « prix moyen à la pièce × nb par pièce ».
    a._prixTotal = (nbp===null) ? 0 : arrondiPrix(a._prixPiece * nbp);
    return pm;
  }
  // Recalculées à chaque appel (le prix moyen dépend de NOM_PRODUITS, qu'une réponse de RFQ met à jour).
  function nomMatierePrixPiece(m){ nomMatiereAppliquer(m); return Number(m._prixPiece)||0; }
  function nomAccPrixPiece(a){ nomAccAppliquer(a); return Number(a._prixTotal)||0; }

  // ── Recherche « réf OU désignation » sans fournisseur (spec §1) ─────────────────────────────────
  // Liste déroulante filtrée, accessible au clavier (↑ ↓ Entrée Échap, clic). Pourquoi pas une
  // <datalist> : le navigateur refiltre NOS options avec sa propre comparaison LITTÉRALE, qui ne sait
  // pas ignorer les accents (« tole » ne proposait pas « Tôle aluminium »). Le filtrage est donc fait
  // par «chercherReferences» (module partagé : sous-chaîne sur la référence OU la désignation, casse
  // et accents ignorés, une entrée par référence, tous fournisseurs) et la liste est rendue ici.
  // UN seul popup pour toutes les lignes : aucun DOM par ligne, aucune fuite au re-rendu.
  var NOM_POP = { k:1, i:-1, mode:'ref', opts:[], actif:-1, input:null };
  var NOM_POP_MAX = 60;
  function nomPopFermer(){
    var p = document.getElementById('nom-ref-pop');
    if (p) { p.style.display='none'; p.innerHTML=''; }
    if (NOM_POP.input && NOM_POP.input.setAttribute) {
      NOM_POP.input.setAttribute('aria-expanded','false');
      // Le champ est annoncé comme un combobox ARIA : sans aria-activedescendant, un lecteur d'écran
      // n'entend RIEN changer quand on parcourt la liste avec ↑ / ↓.
      NOM_POP.input.removeAttribute('aria-activedescendant');
    }
    NOM_POP.input = null; NOM_POP.opts = []; NOM_POP.actif = -1;
  }
  function nomPopMajActiveDescendant(){
    if (!NOM_POP.input || !NOM_POP.input.setAttribute) return;
    if (NOM_POP.actif >= 0 && NOM_POP.opts.length) NOM_POP.input.setAttribute('aria-activedescendant','nrp-'+NOM_POP.actif);
    else NOM_POP.input.removeAttribute('aria-activedescendant');
  }
  function nomPopRendre(){
    var p = document.getElementById('nom-ref-pop'); if(!p) return;
    if (!NOM_POP.opts.length) {
      p.innerHTML = '<div class="nrp-vide">Aucune référence du catalogue ne correspond. La saisie libre est permise : la ligne restera en « coût incomplet » jusqu\\'à une demande de prix.</div>';
      nomPopMajActiveDescendant();
      return;
    }
    var h = '', j;
    for (j=0;j<NOM_POP.opts.length;j++){
      var o = NOM_POP.opts[j];
      h += '<div class="nrp'+(j===NOM_POP.actif?' on':'')+'" role="option" id="nrp-'+j+'" data-j="'+j+'" aria-selected="'+(j===NOM_POP.actif?'true':'false')+'" title="'+nomEscA((o.fournisseurs||[]).join(', '))+'">'
        + '<span class="nrp-r">'+nomEscH(o.reference)+'</span>'
        + '<span class="nrp-d">'+nomEscH(o.designation||'(sans désignation)')+'</span>'
        + '<span class="nrp-n">'+o.nb_fournisseurs+' fourn.</span>'
        + '</div>';
    }
    p.innerHTML = h;
    nomPopMajActiveDescendant();
    var a = document.getElementById('nrp-'+NOM_POP.actif);
    if (a && a.scrollIntoView) a.scrollIntoView({ block:'nearest' });
  }
  function nomPopOuvrir(input){
    var p = document.getElementById('nom-ref-pop'); if(!p || !input) return;
    NOM_POP.k = parseInt(input.getAttribute('data-nk'),10) ? 1 : 0;
    NOM_POP.i = parseInt(input.getAttribute('data-ni'),10) || 0;
    NOM_POP.mode = input.getAttribute('data-nm') || 'ref';
    NOM_POP.input = input;
    NOM_POP.opts = chercherReferences(NOM_PRODUITS, input.value, nomFourCat(NOM_POP.k), NOM_POP_MAX);
    NOM_POP.actif = NOM_POP.opts.length ? 0 : -1;
    var r = input.getBoundingClientRect();
    var vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
    p.style.display = 'block';
    p.style.minWidth = Math.max(260, Math.round(r.width)) + 'px';
    p.style.maxWidth = Math.max(280, Math.min(560, vw-12)) + 'px';
    nomPopRendre();
    var w = p.offsetWidth || 300, hh = p.offsetHeight || 200;
    p.style.left = Math.max(6, Math.min(Math.round(r.left), vw - w - 6)) + 'px';
    p.style.top  = ((vh - r.bottom) > (hh + 8) ? Math.round(r.bottom) + 4 : Math.max(6, Math.round(r.top) - hh - 4)) + 'px';
    input.setAttribute('aria-expanded','true');
  }
  function nomPopBouger(d){
    if (!NOM_POP.opts.length) return;
    NOM_POP.actif = (NOM_POP.actif + d + NOM_POP.opts.length) % NOM_POP.opts.length;
    nomPopRendre();
  }
  function nomPopChoisir(j){
    var o = NOM_POP.opts[j]; if(!o) return;
    var k = NOM_POP.k, i = NOM_POP.i, mode = NOM_POP.mode, inp = NOM_POP.input;
    nomPopFermer();
    // ⚠ Le champ va disparaître au re-rendu, et le navigateur envoie alors son « change » — avec le
    // TEXTE TAPÉ (« tole alu »), qui écraserait la référence choisie. On aligne donc sa valeur, puis
    // on provoque le change TOUT DE SUITE (blur) pendant qu'il est inoffensif.
    if (inp) {
      try { inp.value = (mode === 'des') ? (o.designation || o.reference) : o.reference; inp.blur(); } catch(e) {}
    }
    nomFourSetRefDes(k, i, o.reference, o.designation);   // choisir remplit LES DEUX champs
    // Après le blur ci-dessus le focus est sur <body> et le Tab suivant repartait du haut de la page.
    // Choisir une entrée remplit DÉJÀ la référence ET la désignation : le champ suivant à remplir est
    // la quantité (elle n'a pas de liste déroulante, donc aucun popup ne se rouvre sous les doigts).
    var c = document.getElementById(k ? 'nom-matieres-list' : 'nom-accessoires-list');
    if (c) {
      var suiv = c.querySelector('[data-nq="'+i+'"][data-nk="'+(k?1:0)+'"]');
      if (suiv && suiv.focus) { try { suiv.focus(); if (suiv.select) suiv.select(); } catch(e) {} }
    }
  }
  // Délégation d'événements (une seule fois) : les lignes sont re-rendues en permanence.
  if (!window.__nomPopBound) { window.__nomPopBound = true;
    document.addEventListener('input', function(e){
      var t = e.target; if (t && t.getAttribute && t.getAttribute('data-nm')) nomPopOuvrir(t);
    });
    document.addEventListener('focusin', function(e){
      var t = e.target;
      if (t && t.getAttribute && t.getAttribute('data-nm')) { nomPopOuvrir(t); return; }
      if (!(t && t.closest && t.closest('#nom-ref-pop'))) nomPopFermer();
    });
    document.addEventListener('keydown', function(e){
      var t = e.target;
      // La cellule de prix est atteignable au clavier (tabindex) : Entrée / Espace ouvre son détail.
      if (t && t.classList && t.classList.contains('nom-prix-cell') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        nomPrixDetail(parseInt(t.getAttribute('data-nk'),10)?1:0, parseInt(t.getAttribute('data-prix'),10)||0, t);
        return;
      }
      if (!(t && t.getAttribute && t.getAttribute('data-nm'))) return;
      var key = e.key;
      if (key === 'ArrowDown') { if (NOM_POP.input) nomPopBouger(1); else nomPopOuvrir(t); e.preventDefault(); return; }
      if (key === 'ArrowUp')   { if (NOM_POP.input) { nomPopBouger(-1); e.preventDefault(); } return; }
      if (key === 'Enter')     { if (NOM_POP.input && NOM_POP.actif >= 0) { e.preventDefault(); nomPopChoisir(NOM_POP.actif); } return; }
      if (key === 'Escape')    { if (NOM_POP.input) { e.preventDefault(); nomPopFermer(); } return; }
      if (key === 'Tab')       { nomPopFermer(); return; }
    });
    document.addEventListener('mousedown', function(e){
      var t = e.target;
      var row = (t && t.closest) ? t.closest('#nom-ref-pop .nrp') : null;
      if (row) { e.preventDefault(); nomPopChoisir(parseInt(row.getAttribute('data-j'),10)||0); return; }   // avant le blur
      if (!(t && t.closest && t.closest('#nom-ref-pop')) && !(t && t.getAttribute && t.getAttribute('data-nm'))) nomPopFermer();
      if (!(t && t.closest && (t.closest('#nom-prix-detail') || t.closest('.nom-prix-cell')))) nomPrixDetailFermer();
    });
    window.addEventListener('resize', function(){ nomPopFermer(); nomPrixDetailFermer(); });
    document.addEventListener('scroll', function(e){
      var t = e.target;
      if (t && t.closest && (t.closest('#nom-ref-pop') || t.closest('#nom-prix-detail'))) return;   // le popup défile : il ne se ferme pas
      nomPopFermer(); nomPrixDetailFermer();
    }, true);
  }
  // Entrée du catalogue correspondant EXACTEMENT à une référence / une désignation saisie.
  function nomOptionDeRef(ref, cat){
    if (normaliserReference(ref) === '') return null;
    var l = chercherReferences(NOM_PRODUITS, ref, cat, 0), i;
    for (i=0;i<l.length;i++) if (memeReference(l[i].reference, ref)) return l[i];
    return null;
  }
  function nomOptionDeDes(des, cat){
    var n = normaliserReference(des);
    if (n === '') return null;
    var l = chercherReferences(NOM_PRODUITS, des, cat, 0), i;
    for (i=0;i<l.length;i++) if (normaliserReference(l[i].designation) === n) return l[i];
    return null;
  }

  // ── Doublons (spec §4 / contrat §5) : une même référence normalisée ne peut figurer qu'UNE fois
  //    dans la nomenclature, matière et accessoires CONFONDUS. Mêmes fonctions que le serveur
  //    (doublonsFournitures / messageDoublonFourniture) : message identique, ligne refusée, rien envoyé.
  function nomFournituresPourDoublons(){
    var out = [];
    nomMatieres.forEach(function(m){ out.push({ ref_stock:m.ref||'', designation:m.designation||'', categorie:'matiere' }); });
    nomAccessoires.forEach(function(a){ out.push({ ref_stock:a.ref||'', designation:a.designation||'', categorie:'accessoire' }); });
    return out;
  }
  // Rang GLOBAL d'une ligne dans la liste envoyée au serveur (matières d'abord, puis accessoires).
  function nomFourRang(k, i){ return k ? i : (nomMatieres.length + i); }
  function nomDoublonSurLigne(k, i){
    var gs = doublonsFournitures(nomFournituresPourDoublons());
    var r = nomFourRang(k, i), g, j;
    for (g=0;g<gs.length;g++) for (j=0;j<gs[g].indices.length;j++) if (gs[g].indices[j] === r) return gs[g];
    return null;
  }
  // ⚠ RELECTURE 17/09/2026 — le doublon se teste AVANT de toucher à la ligne. L'ordre précédent était
  //   : (1) écrire la nouvelle référence, (2) puisqu'elle a changé, EFFACER la copie de prix
  //   enregistrée (prix_*_enr) et annuler la demande de prix en cours, (3) constater le doublon et
  //   ne remettre QUE ref et designation. La copie de prix et la demande de prix n'étaient jamais
  //   restaurées : une ligne hors catalogue repassait en « coût incomplet », affichait 0,0000 € et
  //   l'« Enregistrer » suivant écrivait prix_unitaire = 0 en base (la remise à 0 interdite par H0,
  //   tracée à jamais au journal EN 9100) — alors que la saisie de l'utilisateur avait été REFUSÉE.
  //   On simule donc la ligne candidate sur une COPIE et on ne modifie rien si elle fait doublon.
  function nomDoublonSiCle(k, i, ref, des){
    var lignes = nomFournituresPourDoublons();
    var r = nomFourRang(k, i);
    if (!lignes[r]) return null;
    lignes[r] = { ref_stock: String(ref==null?'':ref), designation: String(des==null?'':des), categorie: nomFourCat(k) };
    var gs = doublonsFournitures(lignes), g, j;
    for (g=0;g<gs.length;g++) for (j=0;j<gs[g].indices.length;j++) if (gs[g].indices[j] === r) return gs[g];
    return null;
  }
  // Rafraîchit UNE ligne SANS réécrire la liste. Réécrire tout le compartiment en innerHTML détruit le
  // champ que l'utilisateur vient d'atteindre : en frappe normale (taper une réf, cliquer dans le
  // champ de la ligne suivante) le focus retombait sur <body> et les caractères tapés étaient PERDUS
  // — invisible en test lent, systématique à vitesse humaine. Ici aucun champ de saisie n'est
  // remplacé : on aligne leur valeur et on ne re-rend que la cellule de prix et le bouton de demande
  // de prix. Rend false si la ligne n'est pas à l'écran (le rendu complet reste le secours).
  function nomFourMajLigne(k, i){
    var c = document.getElementById(k ? 'nom-matieres-list' : 'nom-accessoires-list'); if(!c) return false;
    var l = nomFourListe(k)[i]; if(!l) return false;
    var kk = (k?1:0);
    var iRef = c.querySelector('[data-nk="'+kk+'"][data-ni="'+i+'"][data-nm="ref"]');
    var iDes = c.querySelector('[data-nk="'+kk+'"][data-ni="'+i+'"][data-nm="des"]');
    if (!iRef || !iDes) return false;
    if (k) nomMatiereAppliquer(l); else nomAccAppliquer(l);
    if (iRef.value !== String(l.ref||'')) iRef.value = String(l.ref||'');
    if (iDes.value !== String(l.designation||'')) iDes.value = String(l.designation||'');
    iRef.setAttribute('title', (l.ref?(l.ref+'\\n'):'')+'Cherchez par référence OU par désignation (casse et accents ignorés) — la saisie libre est permise');
    iDes.setAttribute('title', (l.designation?(l.designation+'\\n'):'')+'Cherchez aussi ici : choisir une entrée remplit la référence');
    var cel = c.querySelector('[data-prix="'+i+'"]');
    if (cel) cel.outerHTML = nomFourPrixCellHtml(k, l, i);
    var btn = c.querySelector('[data-rfq="'+i+'"][data-nk="'+kk+'"]');
    if (btn) btn.outerHTML = nomFourRfqBtnHtml(k, l, i);
    return true;
  }
  function nomFourRafraichir(k, i){ if (!nomFourMajLigne(k, i)) nomFourRendre(k); nomCalcTotaux(); }

  // ── Saisie d'une ligne ─────────────────────────────────────────────────────────────────────────
  // Changer la RÉFÉRENCE change l'identité de la ligne : la copie de prix enregistrée et la demande
  // de prix en cours ne la concernent plus (règle du lot H0).
  function nomFourSetRefDes(k, i, ref, des){
    var l = nomFourListe(k)[i]; if(!l) return;
    var avRef = l.ref || '';
    var nRef = String(ref==null?'':ref).replace(/^\\s+|\\s+$/g,'').replace(/\\s+/g,' ');
    var nDes = (des != null && String(des) !== '') ? String(des) : (l.designation || '');
    // Doublon : refus AVANT toute écriture (rien n'est ni modifié ni effacé), comme le serveur refuse
    // en 409 avant upsertFournitures. Le rendu remet le champ sur la valeur réellement retenue.
    var d = nomDoublonSiCle(k, i, nRef, nDes);
    if (d) { beNotif('err','fa-clone', messageDoublonFourniture(d)); nomFourRafraichir(k, i); return; }
    l.ref = nRef;
    if (des != null && String(des) !== '') l.designation = String(des);
    if (!memeReference(avRef, l.ref)) {
      l.rfq_pending = false; l._rfqId = null; l._rfqAt = null; l._rfqClos = false;
      if (k) l.prix_tole_enr = null; else { l.prix_piece_enr = null; l._ancien_modele = false; }
    }
    nomFourRafraichir(k, i);
  }
  function nomFourSetRef(k, i, ref){
    var l = nomFourListe(k)[i]; if(!l) return;
    var o = nomOptionDeRef(ref, nomFourCat(k));
    // Référence connue du catalogue : on reprend son orthographe et on remplit la désignation si elle est vide.
    nomFourSetRefDes(k, i, o ? o.reference : ref, (o && !(l.designation||'')) ? o.designation : null);
  }
  // Désignation tapée librement : elle reste un libellé. Elle ne fixe la référence que si la ligne
  // n'en a pas encore (sinon changer le libellé d'une ligne référencée changerait l'article chiffré).
  function nomFourSetDes(k, i, des){
    var l = nomFourListe(k)[i]; if(!l) return;
    var nDes = String(des==null?'':des).replace(/^\\s+|\\s+$/g,'');
    if (!(l.ref||'')) {
      var o = nomOptionDeDes(nDes, nomFourCat(k));
      if (o) { nomFourSetRefDes(k, i, o.reference, o.designation); return; }
    }
    // Même règle qu'en saisie de référence : on teste le doublon AVANT d'écrire (une ligne sans
    // référence est comparée sur sa désignation), sinon un refus laissait la ligne à moitié modifiée.
    var d = nomDoublonSiCle(k, i, l.ref||'', nDes);
    if (d) { beNotif('err','fa-clone', messageDoublonFourniture(d)); nomFourRafraichir(k, i); return; }
    l.designation = nDes;
    nomFourRafraichir(k, i);
  }
  // Pc/tôle (matière) ou Nb/pièce (accessoire) : saisie en continu → on ne re-rend QUE la cellule de
  // prix (un re-rendu complet ferait perdre le focus au champ en cours de frappe).
  function nomFourSetQte(k, i, v){
    var l = nomFourListe(k)[i]; if(!l) return;
    var n = parseFloat(String(v==null?'':v).replace(',','.'));
    if (!isFinite(n) || n < 0) n = 0;
    if (k) l.nb_par_tole = n; else l.nb_par_piece = n;
    if (k) nomMatiereAppliquer(l); else nomAccAppliquer(l);   // sans ce recalcul la cellule resterait sur l'ancienne quantité
    var cel = document.querySelector('#'+(k?'nom-matieres-list':'nom-accessoires-list')+' [data-prix="'+i+'"]');
    if (cel) cel.outerHTML = nomFourPrixCellHtml(k, l, i);
    nomCalcTotaux();
  }

  // ── Cellule « Prix estimé / pièce » ────────────────────────────────────────────────────────────
  // Valeur (€ par pièce de nomenclature) + badge « n fournisseur(s) · min–max ». Couleurs :
  //   compartiment (bleu / violet) = prix moyen frais · ORANGE = au moins un prix de plus de 6 mois,
  //   conditionnement non déclaré, ou référence hors catalogue (copie enregistrée conservée) ·
  //   ROUGE = aucun prix du tout (« coût incomplet ») · AMBRE = demande de prix en cours.
  function nomFourCouleur(k, statut){
    if (statut === 'incomplet') return '#dc2626';
    if (statut === 'garde' || statut === 'perime') return '#c2410c';
    if (statut === 'pending') return '#92400e';
    return k ? '#0ea5e9' : '#8b5cf6';
  }
  function nomFourBadge(k, l){
    var pm = l._pm || {}, det = pm.detail || [], dec = k ? 2 : 4;
    if (l._statut === 'incomplet') return { txt:'coût incomplet', col:'#dc2626' };
    if (l._statut === 'garde')     return { txt:'hors catalogue', col:'#c2410c' };
    // Le badge chiffre la BASE (€/tôle en matière, €/pièce d'accessoire) : ce n'est pas la valeur de
    // la colonne (€ par pièce fabriquée), d'où l'unité rappelée. Fourchette seulement si elle existe.
    var t = det.length + ' fourn. · ';
    t += (det.length > 1 && pm.min !== pm.max)
      ? (nomFmt(pm.min, dec) + '–' + nomFmt(pm.max, dec) + ' €')
      : nomFmtEur(pm.prix_base, dec);
    t += k ? '/tôle' : '/pce';
    if (pm.sans_conditionnement && pm.sans_conditionnement.length) t += ' · cond. ?';
    return { txt:t, col:(l._statut === 'ok' ? '#94a3b8' : '#c2410c') };
  }
  // Infobulle (survol) : la même information que le détail, en texte.
  function nomFourTitre(k, l){
    var pm = l._pm || {}, det = pm.detail || [], dec = k ? 2 : 4, j;
    if (!det.length) {
      var enr = nombrePositif(k ? l.prix_tole_enr : l.prix_piece_enr);
      return (enr===null
        ? 'Aucun prix au catalogue pour cette référence : coût de revient incomplet (la validation reste possible).'
        : 'Référence absente du catalogue (ou sans prix) : le prix enregistré dans la nomenclature est conservé ('+nomFmtEur(enr,dec)+' / '+(k?'tôle':'pièce')+').')
        + '\\nCliquez pour le détail — le bouton à droite envoie une demande de prix aux Achats.';
    }
    var t = det.length+' fournisseur(s) — prix moyen '+nomFmtEur(pm.prix_base, dec)+' / '+(k?'tôle':'pièce');
    for (j=0;j<det.length && j<8;j++){
      var d = det[j];
      t += '\\n· '+(d.fournisseur_nom||'(fournisseur inconnu)')+' : '+nomFmtEur(d.prix_catalogue,2)
        + (k ? '' : (' le paquet de '+(d.qte_paquet==null?'? (non déclaré)':nomFmt(d.qte_paquet,0))+' → '+nomFmtEur(d.prix_converti,4)+'/pce'))
        + (d.date_prix ? (' ('+String(d.date_prix).slice(0,10)+(d.perime?', périmé':'')+')') : ' (sans date)');
    }
    if (det.length > 8) t += '\\n· … (' + (det.length-8) + ' de plus)';
    t += '\\nCliquez pour le détail complet.';
    return t;
  }
  function nomFourPrixCellHtml(k, l, i){
    var val = nomFmtEur(k ? l._prixPiece : l._prixTotal, 4);
    var b = nomFourBadge(k, l);
    return '<div class="nom-prix-cell" data-prix="'+i+'" data-nk="'+(k?1:0)+'" role="button" tabindex="0" aria-label="Prix estimé — détail du prix moyen" title="'+nomEscA(nomFourTitre(k,l))+'" onclick="nomPrixDetail('+(k?1:0)+','+i+',this)">'
      + '<span class="nom-prix-val" style="color:'+nomFourCouleur(k, l._statut)+';">'+nomEscH(val)+'</span>'
      + '<span class="nom-prix-badge" style="color:'+b.col+';">'+nomEscH(b.txt)+'</span>'
      + '</div>';
  }
  // Bouton « demande de prix » (colonne dédiée) : disponible À TOUT MOMENT (lot H0), orange quand
  // elle est conseillée (prix périmé, hors catalogue ou absent), sablier quand une demande est en cours.
  function nomFourRfqBtnHtml(k, l, i){
    var kk = (k?1:0);
    if (l._statut === 'pending') {
      return '<button type="button" class="nom-rfq-ico" data-rfq="'+i+'" data-nk="'+kk+'" onclick="nomLigneRFQCheck('+kk+','+i+')" title="Demande de prix envoyée — vérifier la réponse des Achats" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;"><i class="fas fa-hourglass-half"></i></button>';
    }
    var conseil = (l._statut !== 'ok');
    var style = conseil ? 'background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;' : 'background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;';
    var titre = conseil
      ? 'Demande de prix conseillée (prix absent, hors catalogue ou de plus de '+NOM_PRIX_VALIDITE_LIB+') — envoyer aux Achats'
      : 'Prix de moins de '+NOM_PRIX_VALIDITE_LIB+' — vous pouvez tout de même demander un nouveau prix';
    return '<button type="button" class="nom-rfq-ico" data-rfq="'+i+'" data-nk="'+kk+'" onclick="nomLigneRFQ('+kk+','+i+')" title="'+nomEscA(titre)+'" style="'+style+'"><i class="fas fa-file-invoice-dollar"></i></button>';
  }

  // ── Détail du prix moyen (clic sur la cellule) ─────────────────────────────────────────────────
  function nomPrixDetailFermer(){ var p=document.getElementById('nom-prix-detail'); if(p){ p.style.display='none'; p.innerHTML=''; p.removeAttribute('data-cle'); } }
  function nomPrixDetailHtml(k, l){
    var pm = l._pm || {}, det = pm.detail || [], dec = k ? 2 : 4, j;
    var uni = k ? 'la tôle' : 'la pièce';
    var h = '<div style="font-weight:800;color:#1e293b;font-family:monospace;">'+nomEscH(l.ref||'(sans référence)')+'</div>'
      + '<div style="font-size:.7rem;color:#64748b;margin-bottom:8px;">'+nomEscH(l.designation||'')+'</div>';
    if (!det.length) {
      var enr = nombrePositif(k ? l.prix_tole_enr : l.prix_piece_enr);
      h += '<div style="color:#b91c1c;font-weight:700;">Aucun prix au catalogue pour cette référence — le coût de revient est incomplet (la validation reste permise).</div>';
      if (enr !== null) h += '<div style="margin-top:6px;color:#c2410c;">Prix enregistré dans la nomenclature, <strong>conservé</strong> : '+nomEscH(nomFmtEur(enr,dec))+' / '+uni+'.</div>';
      h += '<div style="margin-top:8px;font-size:.7rem;color:#64748b;">Le bouton « demande de prix » de la ligne envoie la référence aux Achats ; à la validation de leur réponse, le prix de chaque fournisseur chiffré entre dans la moyenne.</div>';
      return h;
    }
    h += '<div style="margin-bottom:8px;">Prix moyen de <strong>'+det.length+' fournisseur(s)</strong> : <strong>'+nomEscH(nomFmtEur(pm.prix_base, dec))+'</strong> / '+uni
      + (det.length>1 ? ' (de '+nomEscH(nomFmtEur(pm.min,dec))+' à '+nomEscH(nomFmtEur(pm.max,dec))+')' : '') + '</div>';
    if (k) h += '<div style="margin:-4px 0 8px;font-size:.72rem;color:#64748b;">÷ '+nomEscH(nomFmt(nombrePositif(l.nb_par_tole)||0,0))+' pièce(s) par tôle = <strong>'+nomEscH(nomFmtEur(l._prixPiece,4))+'</strong> par pièce.</div>';
    else h += '<div style="margin:-4px 0 8px;font-size:.72rem;color:#64748b;">× '+nomEscH(nomFmt(nombrePositif(l.nb_par_piece)||0,3))+' par pièce fabriquée = <strong>'+nomEscH(nomFmtEur(l._prixTotal,4))+'</strong> par pièce.</div>';
    h += '<table><thead><tr><th>Fournisseur</th><th style="text-align:right;">Prix catalogue</th>'
      + (k ? '' : '<th style="text-align:right;">Qté/paquet</th><th style="text-align:right;">€/pièce</th>')
      + '<th>Date</th></tr></thead><tbody>';
    for (j=0;j<det.length;j++){
      var d = det[j];
      h += '<tr><td>'+nomEscH(d.fournisseur_nom||'(fournisseur inconnu)')+'</td>'
        + '<td style="text-align:right;">'+nomEscH(nomFmtEur(d.prix_catalogue,2))+'</td>';
      if (!k) h += '<td style="text-align:right;'+(d.sans_conditionnement?'color:#c2410c;font-weight:700;':'')+'">'+(d.qte_paquet==null?'non déclarée':nomEscH(nomFmt(d.qte_paquet,0)))+'</td>'
        + '<td style="text-align:right;font-weight:800;">'+nomEscH(nomFmtEur(d.prix_converti,4))+'</td>';
      h += '<td style="'+(d.perime?'color:#c2410c;font-weight:700;':'color:#64748b;')+'">'+nomEscH(String(d.date_prix||'—').slice(0,10))+'</td></tr>';
    }
    h += '</tbody></table>';
    if (pm.sans_conditionnement && pm.sans_conditionnement.length) h += '<div style="margin-top:8px;color:#c2410c;font-size:.7rem;">Conditionnement non déclaré chez <strong>'+nomEscH(pm.sans_conditionnement.join(', '))+'</strong> : leur prix est compté <strong>à la pièce</strong>. Déclarez la quantité par paquet dans BE › Références (« Éditer ») ou sur la fiche fournisseur.</div>';
    if (pm.perime) h += '<div style="margin-top:6px;color:#c2410c;font-size:.7rem;">Au moins un prix a plus de '+NOM_PRIX_VALIDITE_LIB+' — demande de prix conseillée.</div>';
    if (l._ancien_modele) h += '<div style="margin-top:6px;font-size:.7rem;color:#6d28d9;">Cette ligne a été enregistrée à l\\'ancien modèle (fournisseur + quantité par paquet dans la nomenclature). Elle est <strong>affichée</strong> au prix moyen ; elle ne passera au nouveau modèle qu\\'au prochain enregistrement de la nomenclature.</div>';
    return h;
  }
  function nomPrixDetail(k, i, el){
    var l = nomFourListe(k)[i]; if(!l) return;
    var p = document.getElementById('nom-prix-detail'); if(!p) return;
    var cle = (k?1:0)+':'+i;
    if (p.style.display === 'block' && p.getAttribute('data-cle') === cle) { nomPrixDetailFermer(); return; }
    p.setAttribute('data-cle', cle);
    p.innerHTML = nomPrixDetailHtml(k, l);
    p.style.display = 'block';
    var r = el.getBoundingClientRect(), vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
    var w = p.offsetWidth || 360, hh = p.offsetHeight || 180;
    p.style.left = Math.max(6, Math.min(Math.round(r.right) - w, vw - w - 6)) + 'px';
    p.style.top  = ((vh - r.bottom) > (hh + 8) ? Math.round(r.bottom) + 4 : Math.max(6, Math.round(r.top) - hh - 4)) + 'px';
  }

  // ── Demande de prix d'une LIGNE (spec §6) ──────────────────────────────────────────────────────
  // La modale s'ouvre PRÉ-REMPLIE (référence, désignation, quantité) et propose comme destinataires
  // tous les fournisseurs qui portent la référence au catalogue, cochés d'office ; aucun ne la porte
  // (référence nouvelle) → choix libre parmi les fournisseurs de l'entité.
  function nomFournisseursDeRef(ref, cat){
    var out = [], vus = {}, i;
    if (normaliserReference(ref) === '') return out;
    for (i=0;i<NOM_PRODUITS.length;i++){
      var p = NOM_PRODUITS[i];
      if (!p || !memeReference(p.reference, ref)) continue;
      if (!categorieCompatible(p.categorie, cat)) continue;
      var id = (p.fournisseur_id==null) ? '' : String(p.fournisseur_id);
      var f = id ? nomFournById(id) : null;
      var nom = String(p.fournisseur_nom || (f ? f.nom : '') || '');
      var cle = id || ('nom:'+normaliserReference(nom));
      if (!id && !nom) continue;
      if (vus[cle]) continue;
      vus[cle] = 1;
      out.push({ id: id || null, nom: nom });
    }
    return out;
  }
  function nomLigneRFQ(k, i){
    var l = nomFourListe(k)[i]; if(!l) return;
    if (!(l.ref || l.designation)) { beNotif('err','fa-exclamation-circle','Saisissez une référence ou une désignation avant de demander un prix.'); return; }
    var qte = nombrePositif(k ? l.nb_par_tole : l.nb_par_piece);
    beRfqOuvrirLigne({
      reference: l.ref || '',
      designation: l.designation || l.ref || (k ? 'Matière' : 'Accessoire'),
      categorie: k ? 'matiere_premiere' : 'accessoire',
      quantite: qte,
      dtref: (document.getElementById('nom-f-num')||{}).value || '',
      fournisseurs: nomFournisseursDeRef(l.ref, nomFourCat(k)),
      apres: function(j){
        l.rfq_pending = true; l._rfqAt = Date.now(); l._rfqNum = j.numero; l._rfqId = j.id || null; l._rfqClos = false;
        nomFourRendre(k);
      }
    });
  }
  function nomLigneRFQCheck(k, i){
    var l = nomFourListe(k)[i]; if(!l) return;
    if (!l.ref && !l.designation) return;
    nomRfqVerifier(l, k ? 'matiere_premiere' : 'accessoire', function(etat, n){ nomRfqAppliquer(l, etat, n, function(){ nomFourRendre(k); }, true); });
  }
  // Au retour sur l'onglet, rafraîchit automatiquement les lignes en attente (matière ET accessoires).
  if (!window.__nomFourFocusBound) { window.__nomFourFocusBound = true; window.addEventListener('focus', function(){
    [1,0].forEach(function(k){
      var lst = nomFourListe(k);
      if (!Array.isArray(lst)) return;
      lst.forEach(function(l){
        if (!(l.rfq_pending && (l.ref || l.designation))) return;
        nomRfqVerifier(l, k ? 'matiere_premiere' : 'accessoire', function(etat, n){ nomRfqAppliquer(l, etat, n, function(){ nomFourRendre(k); }, false); });
      });
    });
  }); }

  // ── Fournisseurs visibles (destinataires de RFQ seulement) ─────────────────────────────────────
  function nomEntiteActuelle(){ var ent=document.getElementById('nom-f-entite'); return ent?ent.value:''; }
  function nomFournById(id){ return NOM_FOURNISSEURS.find(function(f){ return String(f.id)===String(id); }) || null; }
  // Tous les fournisseurs compatibles avec l'entité courante. Le jsonb «fournisseurs.catalogue» n'est
  // PLUS lu (vide sur les 155 fournisseurs) : la seule source du catalogue est NOM_PRODUITS.
  function nomFournAll(){
    var actv = nomEntiteActuelle();
    return NOM_FOURNISSEURS.filter(function(f){ var a=f.activite; return !actv || actv==='both' || !a || a==='both' || a===actv; });
  }

  // Re-render quand l'entité (Seem/Semrac) change → re-filtre les fournisseurs proposés en RFQ
  document.addEventListener('change', function(e){ if(e.target && e.target.id === 'nom-f-entite'){ nomRenderMatieres(); nomRenderAccessoires(); nomRenderEtapes(); } });
  if(document.readyState !== 'loading'){ setTimeout(function(){ nomRenderMatieres(); nomRenderAccessoires(); }, 0); }
  else document.addEventListener('DOMContentLoaded', function(){ nomRenderMatieres(); nomRenderAccessoires(); });

  // ── Rendu d'une ligne — MÊME grille que l'en-tête (.nom-mat-grid / .nom-acc-grid) ──────────────
  // 6 colonnes : Réf · Désignation · Pc/tôle ou Nb/pièce · Prix estimé/pièce · demande de prix · croix.
  function nomFourLigneHtml(k, l, i){
    var kk = (k?1:0);
    if (k) nomMatiereAppliquer(l); else nomAccAppliquer(l);
    // La colonne est étroite : l'infobulle rappelle d'abord la VALEUR saisie (« 0,125 », « 120 »),
    // sinon l'utilisateur ne peut pas relire ce qu'il a tapé sans cliquer dans le champ.
    var qChamp = k
      ? '<input class="nom-f-inp" data-nq="'+i+'" data-nk="'+kk+'" type="number" step="1" min="1" placeholder="Pc" title="'+nomEscA((l.nb_par_tole==null||l.nb_par_tole===''?'':(l.nb_par_tole+'\\n'))+'Nombre de pièces découpées dans une tôle')+'" value="'+nomEscA(l.nb_par_tole==null?'':l.nb_par_tole)+'" oninput="nomFourSetQte(1,'+i+',this.value)" style="text-align:right;"/>'
      : '<input class="nom-f-inp" data-nq="'+i+'" data-nk="'+kk+'" type="number" step="0.001" min="0" placeholder="Nb" title="'+nomEscA((l.nb_par_piece==null||l.nb_par_piece===''?'':(l.nb_par_piece+'\\n'))+'Nombre d\\'accessoires par pièce fabriquée')+'" value="'+nomEscA(l.nb_par_piece==null?'':l.nb_par_piece)+'" oninput="nomFourSetQte(0,'+i+',this.value)" style="text-align:right;"/>';
    return '<div style="margin-bottom:4px;">'
      + '<div class="'+(k?'nom-mat-grid':'nom-acc-grid')+'">'
      // Le champ est étroit : son infobulle rappelle d'abord la valeur complète (elle peut être coupée).
      + '<input class="nom-f-inp" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="nom-ref-pop" autocomplete="off" data-nk="'+kk+'" data-ni="'+i+'" data-nm="ref" placeholder="'+(k?'Réf. matière':'Réf. ou nouvelle')+'" title="'+nomEscA((l.ref?(l.ref+'\\n'):'')+'Cherchez par référence OU par désignation (casse et accents ignorés) — la saisie libre est permise')+'" value="'+nomEscA(l.ref||'')+'" onchange="nomFourSetRef('+kk+','+i+',this.value)"/>'
      + '<input class="nom-f-inp" role="combobox" aria-expanded="false" aria-autocomplete="list" aria-controls="nom-ref-pop" autocomplete="off" data-nk="'+kk+'" data-ni="'+i+'" data-nm="des" placeholder="Désignation" title="'+nomEscA((l.designation?(l.designation+'\\n'):'')+'Cherchez aussi ici : choisir une entrée remplit la référence')+'" value="'+nomEscA(l.designation||'')+'" onchange="nomFourSetDes('+kk+','+i+',this.value)"/>'
      + qChamp
      + nomFourPrixCellHtml(k, l, i)
      + nomFourRfqBtnHtml(k, l, i)
      + '<button type="button" onclick="nomFourRemove('+kk+','+i+')" title="Supprimer cette ligne" style="width:24px;height:24px;border-radius:6px;border:none;background:#fee2e2;color:#dc2626;cursor:pointer;font-weight:700;line-height:1;padding:0;">×</button>'
      + '</div>'
      + '</div>';
  }
  // ⚠ GARDE DE RÉ-ENTRANCE. Réécrire la liste supprime le champ en cours d'édition ; le navigateur
  // envoie alors son « change », dont le gestionnaire redemande un rendu — EN PLEIN MILIEU de
  // l'affectation innerHTML en cours. Chrome lève « The node to be removed is no longer a child of
  // this node. Perhaps it was moved in a blur event handler? » et la ligne reste à moitié rendue.
  // On mémorise donc la demande et on la rejoue au tour d'événement suivant (jamais en cascade).
  var NOM_RENDU_EN_COURS = 0, NOM_RENDU_A_REFAIRE = 0;
  function nomRenderMatieres(){ nomFourRendreProtege(1); }
  function nomRenderAccessoires(){ nomFourRendreProtege(0); }
  function nomFourRendreProtege(k){
    if (NOM_RENDU_EN_COURS) { NOM_RENDU_A_REFAIRE = NOM_RENDU_A_REFAIRE | (k ? 1 : 2); return; }
    NOM_RENDU_EN_COURS = 1;
    try { nomFourRendreListe(k); } finally { NOM_RENDU_EN_COURS = 0; }
    var reste = NOM_RENDU_A_REFAIRE; NOM_RENDU_A_REFAIRE = 0;
    if (reste) setTimeout(function(){ if (reste & 1) nomFourRendreProtege(1); if (reste & 2) nomFourRendreProtege(0); }, 0);
  }
  function nomFourRendreListe(k){
    var c = document.getElementById(k ? 'nom-matieres-list' : 'nom-accessoires-list'); if(!c) return;
    var lst = nomFourListe(k);
    if (lst.length === 0) c.innerHTML = '<div style="text-align:center;padding:14px;color:#9ca3af;font-size:.76rem;border:1.5px dashed #e2e8f0;border-radius:8px;">'+(k ? 'Aucune matière — cliquez « Ajouter matière »' : 'Aucun accessoire — cliquez « Ajouter accessoire »')+'</div>';
    else c.innerHTML = lst.map(function(l,i){ return nomFourLigneHtml(k, l, i); }).join('');
    nomCalcTotaux();
  }

  // ── ÉTAPES DE PRODUCTION ─────────────────────────────────────
  // Une étape = { ordre, nom, type ('interne'|'sous_traite'),
  //               process_id, process_nom, machine_id, machine_nom, machine_taux_h (copie informative),
  //               temps_reglage_min (ROP), temps_reglage_machine_min (RGM), temps_mo_min (THV), temps_machine_min (TMV),
  //               taux_mo_h (copie informative), operation_st, fournisseur_st_id, fournisseur_st_nom,
  //               forfait_st_ht, prix_unitaire_st_ht, cout_st_unitaire }
  // Coût interne = (ROP + RGM + THV) × coût chargé RH du site + (RGM + TMV) × taux machine du process (nomEtapeDecomp)
  // ── Formats de temps d'une étape ──
  // Gamme importée : temps en MILLIÈMES d'heure (lus EN PRIORITÉ par le moteur, serveur comme navigateur).
  // Ancien format : temps_unitaire_min unique. Le formulaire, lui, saisit des MINUTES (affichées en ‰h).
  function nomEtapeAMilliemes(e){ return !!e && (e.temps_variable_mille != null || e.temps_reglage_mille != null || e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null); }
  // À l'ouverture : complète les minutes d'une étape qui n'en a pas, en conservant son coût.
  //   Millièmes : ROP / RGM (ou réglage historique = RGM si process machine, ROP sinon) ; variable = TMV si
  //   machine, THV sinon. Opération fixe (est_fixe) : sur un process manuel elle rejoint le ROP (homme, par
  //   lot) ; sur un process machine elle reste en TMV, compté par lot grâce au drapeau est_fixe.
  //   Ancien format : temps_unitaire_min = TMV sur une étape machine, THV sinon (règle du moteur).
  function nomEtapeCompleterMinutes(e){
    if (!e) return;
    var r4 = function(x){ return Math.round(x * 10000) / 10000; };
    var d = nomEtapeDecomp(e);
    var mach = (d.typeProcess === 'machine');
    if (nomEtapeAMilliemes(e)) {
      if (e.type == null) e.type = 'interne';   // gammes importées = procédés internes (ni ST)
      if (e.temps_reglage_min == null && e.temps_mo_min == null && e.temps_machine_min == null && e.type === 'interne' && e.est_oas !== true) {
        var varMin = (Number(e.temps_variable_mille) || 0) * 0.06;
        var aSplit = (e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null);
        var ropMin = aSplit ? (Number(e.temps_reglage_op_mille) || 0) * 0.06 : (mach ? 0 : (Number(e.temps_reglage_mille) || 0) * 0.06);
        var rgmMin = aSplit ? (Number(e.temps_reglage_machine_mille) || 0) * 0.06 : (mach ? (Number(e.temps_reglage_mille) || 0) * 0.06 : 0);
        var thvMin = mach ? 0 : varMin, tmvMin = mach ? varMin : 0;
        if (e.est_fixe && !mach) { ropMin += thvMin; thvMin = 0; }
        e.temps_reglage_min = r4(ropMin);
        e.temps_reglage_machine_min = r4(rgmMin);
        e.temps_mo_min      = r4(thvMin);
        e.temps_machine_min = r4(tmvMin);
        if (mach && !e.machine_nom) e.machine_nom = e.process_nom || '';
      }
      return;
    }
    if (e.temps_mo_min == null && e.temps_machine_min == null && e.temps_unitaire_min != null) {
      e.temps_mo_min = mach ? 0 : (Number(e.temps_unitaire_min) || 0);
      e.temps_machine_min = mach ? (Number(e.temps_unitaire_min) || 0) : 0;
    }
  }
  // Toute saisie sur une étape importée la fait passer au format minutes : sans cela le moteur continuerait
  // de lire ses millièmes et la saisie resterait sans effet sur le coût (et l'OF imprime déjà les minutes).
  function nomEtapeEnMinutes(e){
    if (!nomEtapeAMilliemes(e)) return;
    nomEtapeCompleterMinutes(e);
    if (e.temps_reglage_min == null && e.temps_mo_min == null && e.temps_machine_min == null) return;   // rien d'équivalent en minutes (ST / OAS)
    delete e.temps_variable_mille; delete e.temps_reglage_mille; delete e.temps_reglage_op_mille; delete e.temps_reglage_machine_mille;
  }
  function nomAddEtape() {
    nomEtapes.push({
      ordre: nomEtapes.length + 1,
      nom: '',
      type: 'interne',
      process_id: '',
      process_nom: '',
      machine_id: '',
      machine_nom: '',
      machine_taux_h: 0,
      programme: '',
      programme_fichier: '',
      temps_reglage_min: 0,
      temps_mo_min: 0,
      temps_machine_min: 0,
      taux_mo_h: nomEtapeTauxHomme(),   // copie INFORMATIVE (le moteur lit le taux en direct)
      operation_st: '',
      fournisseur_st_id: '',
      fournisseur_st_nom: '',
      forfait_st_ht: 0,
      prix_unitaire_st_ht: 0,
      est_oas: false,
      prix_oas_unitaire: 0,
      forfait_oas_ht: 0,
      cout_st_unitaire: 0
    });
    nomRenderEtapes();
  }

  function nomRemoveEtape(idx) {
    nomEtapes.splice(idx, 1);
    // Renumérote
    nomEtapes.forEach(function(e, i){ e.ordre = i + 1; });
    nomRenderEtapes();
  }

  // Référentiels sous-traitance dérivés des tarifs des ST
  var NOM_STS = (BE_REFS_JS.sous_traitants || []);
  function nomStOperations() {
    var set = {};
    NOM_STS.forEach(function(s){ (s.tarifs||[]).forEach(function(t){ if(t && t.operation) set[t.operation]=1; }); });
    return Object.keys(set).sort();
  }
  function nomStsForOperation(op) {
    if(!op) return [];
    return NOM_STS.filter(function(s){ return (s.tarifs||[]).some(function(t){ return t && t.operation===op; }); });
  }
  function nomStTarif(stId, op) {
    var s = NOM_STS.find(function(x){ return x.id===stId; });
    if(!s) return null;
    return (s.tarifs||[]).find(function(t){ return t && t.operation===op; }) || null;
  }

  function nomOnEtapeTypeChange(idx, value) {
    nomEtapeEnMinutes(nomEtapes[idx]);
    nomEtapes[idx].type = value;
    if (value === 'sous_traite') {
      nomEtapes[idx].process_id = '';
      nomEtapes[idx].process_nom = '';
      nomEtapes[idx].machine_id = '';
      nomEtapes[idx].machine_nom = '';
      nomEtapes[idx].machine_taux_h = 0;
      // Les temps réglage/MO/machine ne s'appliquent pas à la sous-traitance (coût = prix pièce ST)
      nomEtapes[idx].temps_reglage_min = 0;
      nomEtapes[idx].temps_mo_min = 0;
      nomEtapes[idx].temps_machine_min = 0;
    } else {
      nomEtapes[idx].operation_st = '';
      nomEtapes[idx].fournisseur_st_id = '';
      nomEtapes[idx].fournisseur_st_nom = '';
      nomEtapes[idx].forfait_st_ht = 0;
      nomEtapes[idx].prix_unitaire_st_ht = 0;
      nomEtapes[idx].cout_st_unitaire = 0;
    }
    nomRenderEtapes();
  }

  // Interne : choix du POSTE → les process choisissables = ceux du poste. Efface le process s'il n'appartient plus au poste.
  // Le poste n'entre pas dans le coût : une étape importée (millièmes) N'EST PAS convertie ici. Sa conversion
  // attend le choix du process, qui seul fixe le classement de ses temps (voir nomOnEtapeProcessChange).
  // Process retiré : les temps sont CONSERVÉS (un temps machine resté sans process est signalé « sans process »
  // par le moteur et affiché en orange) — les effacer ferait disparaître le temps variable du coût et de l'OF.
  function nomOnEtapePosteChange(idx, posteId) {
    nomEtapes[idx].poste_id = posteId;
    var cur = nomEtapes[idx].process_id;
    var p = cur ? (BE_REFS_JS.process_atelier || []).find(function(x){ return String(x.id)===String(cur); }) : null;
    if (!p || String(p.poste_id||'') !== String(posteId||'')) {
      nomEtapes[idx].process_id = '';
      nomEtapes[idx].process_nom = '';
      nomEtapes[idx].machine_id = '';
      nomEtapes[idx].machine_nom = '';
      nomEtapes[idx].machine_taux_h = 0;
    }
    nomRenderEtapes();
  }

  // Taux homme du site (copie INFORMATIVE posée sur l'étape ; le moteur relit toujours le taux en direct)
  function nomEtapeTauxHomme(){ if (!NOM_TX) NOM_TX = beTauxAtelierClient(BE_REFS_JS); return Math.round((NOM_TX.tauxHomme(nomSite()) || 0) * 100) / 100; }
  // Interne : choix d'un process → machine liée auto-renseignée (ou homme seul si manuel) ; le poste suit le process
  function nomOnEtapeProcessChange(idx, processId) {
    var et = nomEtapes[idx];
    var p = (BE_REFS_JS.process_atelier || []).find(function(x){ return String(x.id) === String(processId); });
    var oas = nomEstProcessOAS(p);
    et.process_id = processId;
    et.process_nom = p ? p.nom : '';
    if (p && p.poste_id) et.poste_id = p.poste_id;   // le process fixe le poste (cohérence)
    if (p && !et.nom) et.nom = p.nom;
    // Process MACHINE (type résolu serveur) : il reste machine même sans machine rattachée.
    var estMach = !!p && NOM_TX.typeProcess(p) === 'machine';
    var m = (estMach && p.machine_id)
      ? (BE_REFS_JS.machines || []).find(function(x){ return String(x.id) === String(p.machine_id); })
      : null;
    et.machine_id = (estMach && p.machine_id) ? p.machine_id : '';
    et.machine_nom = m ? m.nom : '';
    et.est_oas = oas;
    // Étape importée (millièmes) : ses minutes affichées ont été déduites à l'ouverture avec l'ANCIEN process.
    // On les re-déduit APRÈS avoir posé le nouveau process : le temps variable devient TMV sur un process
    // machine, THV sinon (règle du moteur), au lieu d'être classé machine puis effacé.
    if (p && nomEtapeAMilliemes(et)) {
      delete et.temps_reglage_min; delete et.temps_reglage_machine_min; delete et.temps_mo_min; delete et.temps_machine_min;
      nomEtapeEnMinutes(et);
    }
    // Copies INFORMATIVES : taux horaire machine DU PROCESS et coût chargé RH moyen du site
    et.machine_taux_h = estMach ? (Number(p.taux_machine) || 0) : 0;
    et.taux_mo_h = nomEtapeTauxHomme();
    // Process non machine choisi : aucun temps machine. Ses temps restent du temps HOMME, visibles et valorisés :
    // le RGM rejoint le ROP, le TMV rejoint le THV (l'opération est désormais faite à la main). Aucun process
    // choisi (« — Process — ») : les temps restent tels quels, le moteur signale l'étape « sans process ».
    if (p && !estMach) {
      var _rgm = Number(et.temps_reglage_machine_min) || 0;
      if (_rgm > 0) { et.temps_reglage_min = (Number(et.temps_reglage_min) || 0) + _rgm; et.temps_reglage_machine_min = 0; }
      var _tmv = Number(et.temps_machine_min) || 0;
      if (_tmv > 0) { et.temps_mo_min = (Number(et.temps_mo_min) || 0) + _tmv; }
      et.temps_machine_min = 0;
    }
    // OAS : le traitement de surface se chiffre au PRIX, pas au temps. On bascule l'étape et on
    // remet les temps à zéro pour qu'aucun coût horaire résiduel ne vienne s'ajouter au prix.
    if (oas) {
      nomEtapes[idx].temps_reglage_min = 0;
      nomEtapes[idx].temps_reglage_machine_min = 0;
      nomEtapes[idx].temps_mo_min = 0;
      nomEtapes[idx].temps_machine_min = 0;
      nomEtapes[idx].machine_taux_h = 0;
    }
    nomRenderEtapes();
  }

  // Détection OAS, calquée sur celle du planning de production (isOasProc) : drapeau explicite,
  // activité OAS, poste nommé OAS, ou intitulé de process évoquant un traitement de surface.
  function nomEstProcessOAS(p) {
    if (!p) return false;
    if (p.est_oas === true || p.activite === 'OAS') return true;
    var po = (BE_REFS_JS.postes || []).find(function(x){ return String(x.id) === String(p.poste_id); });
    if (po) {
      var pn = String(po.nom || '').trim();
      if (po.activite === 'OAS' || pn.toUpperCase() === 'OAS' || /oxyd|anodis|traitement.*surf|surtec/i.test(pn)) return true;
    }
    return /oxyd|anodis|surtec|d[ée]sox|chromat|passiv/i.test(String(p.nom || ''));
  }

  // Sous-traité (ORDRE : ST d'abord) : choix du SOUS-TRAITANT → réinitialise l'opération
  function nomOnEtapeSTChange(idx, stId) {
    var s = NOM_STS.find(function(x){ return x.id === stId; });
    nomEtapes[idx].fournisseur_st_id = stId;
    nomEtapes[idx].fournisseur_st_nom = s ? s.nom : '';
    nomEtapes[idx].operation_st = '';
    nomEtapes[idx].forfait_st_ht = 0;
    nomEtapes[idx].prix_unitaire_st_ht = 0;
    nomEtapes[idx].cout_st_unitaire = 0;
    nomRenderEtapes();
  }

  // … puis choix de l'OPÉRATION → applique le tarif du ST sélectionné (prix unitaire pièce + forfait)
  function nomOnEtapeOperationChange(idx, op) {
    nomEtapes[idx].operation_st = op;
    if (!nomEtapes[idx].nom || nomEtapes[idx].nom === nomEtapes[idx].fournisseur_st_nom) nomEtapes[idx].nom = op;
    var t = nomStTarif(nomEtapes[idx].fournisseur_st_id, op);
    var pu = t ? (parseFloat(t.prix_unitaire_piece_ht) || 0) : 0;
    nomEtapes[idx].forfait_st_ht = t ? (parseFloat(t.forfait_ht) || 0) : 0;
    nomEtapes[idx].prix_unitaire_st_ht = pu;
    nomEtapes[idx].cout_st_unitaire = pu;
    nomRenderEtapes(); nomCalcTotaux();
  }

  // Opérations déclarées (tarifs) d'un sous-traitant donné
  function nomStOperationsFor(stId) {
    var s = NOM_STS.find(function(x){ return x.id===stId; });
    if(!s) return [];
    var set={}; (s.tarifs||[]).forEach(function(t){ if(t && t.operation) set[t.operation]=1; });
    return Object.keys(set).sort();
  }

  // Coût d'une étape — TOUT passe par nomEtapeDecomp (miroir exact de etapeDecomp serveur) :
  //   homme   = (ROP + RGM + THV) × coût chargé RH moyen du site
  //   machine = (RGM + TMV) × taux horaire machine DU PROCESS (process machine seulement)
  //   ST / OAS = un prix (le forfait est un plancher appliqué à la commande), jamais un temps.
  // Valeurs « pour 1 pièce » : le réglage (fixe / lot) y est inclus, comme le prix de revient unitaire.
  function nomEtapeCoutMO(e) { var d = nomEtapeDecomp(e); return d.st ? 0 : (d.moPc + d.moFixe); }
  // Part FIXE / lot d'une étape (réglages ROP + RGM et opérations fixes) — ne se multiplie pas avec la quantité.
  function nomEtapeCoutReglage(e) { var d = nomEtapeDecomp(e); return d.st ? 0 : (d.moFixe + d.machFixe); }
  function nomEtapeCoutMachine(e) { var d = nomEtapeDecomp(e); return d.st ? 0 : (d.machPc + d.machFixe); }
  function nomEtapeCoutUnitaire(e) {
    var d = nomEtapeDecomp(e);
    if (d.st) return d.unit;   // sous-traitance : prix pièce du ST ; OAS : prix pièce du traitement
    return d.moPc + d.machPc + d.moFixe + d.machFixe;
  }

  // ── Glisser-déposer pour réordonner les procédés (l'ordre = séquence de fabrication → BDT) ──
  var _etapeDragIdx = null;
  function nomEtapeDragStart(ev, i){ _etapeDragIdx = i; try{ ev.dataTransfer.effectAllowed='move'; ev.dataTransfer.setData('text/plain', String(i)); }catch(e){} }
  function nomEtapeDragOver(ev){ ev.preventDefault(); try{ ev.dataTransfer.dropEffect='move'; }catch(e){} }
  function nomEtapeDragEnd(){ _etapeDragIdx = null; }
  function nomEtapeDrop(ev, target){
    ev.preventDefault();
    var src = _etapeDragIdx;
    if(src==null){ try{ var d=ev.dataTransfer.getData('text/plain'); src = (d!==''?parseInt(d,10):null); }catch(e){} }
    if(src==null || isNaN(src) || src===target) return;
    var moved = nomEtapes.splice(src,1)[0];
    nomEtapes.splice(target,0,moved);
    nomEtapes.forEach(function(e,k){ e.ordre = k+1; });   // renumérote la séquence
    _etapeDragIdx = null;
    nomRenderEtapes(); nomCalcTotaux();
  }
  function nomRenderEtapes() {
    var c = document.getElementById('nom-etapes-list');
    if (!c) return;
    if (nomEtapes.length === 0) {
      c.innerHTML = '<div style="text-align:center;padding:16px;color:#9ca3af;font-size:.78rem;border:1.5px dashed #e2e8f0;border-radius:8px;">Aucune étape — cliquez sur « + Ajouter étape »</div>';
      nomCalcTotaux();
      return;
    }
    // N2 : filtrage strict des process par site (SEEM → process SEEM, SEMRAC → process SEMRAC ; 'both'/non typés visibles partout)
    var _entPl = String((document.getElementById('nom-f-entite')||{}).value || '').toLowerCase();
    // Lot G (16/09/2026) : les process OAS (activité « OAS », migration 014 / cloud-12) restent proposés dans la gamme des deux sites.
    var PROCS = (BE_REFS_JS.process_atelier || []).filter(function(p){ var a=String(p.activite||'').toLowerCase(); return !a || a==='both' || a==='tout' || a==='seem & semrac' || a==='oas' || a===_entPl; });
    // Postes filtrés par site (comme les process) → alimentent le select « Poste »
    var POSTES = (BE_REFS_JS.postes || []).filter(function(p){ var a=String(p.activite||'').toLowerCase(); return !a || a==='both' || a==='tout' || a==='seem & semrac' || a===_entPl; });
    var _procById = {}; (BE_REFS_JS.process_atelier || []).forEach(function(p){ _procById[String(p.id)]=p; });
    var ST_OPS = nomStOperations();
    var _escH = function(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); };
    var _eur = function(v){ return (Number(v)||0).toFixed(2).replace('.', ','); };
    c.innerHTML = nomEtapes.map(function(e, i){
      var d = nomEtapeDecomp(e);   // décomposition au prix du jour (taux du process en direct, coût RH du site)
      var cout = nomEtapeCoutUnitaire(e).toFixed(2);
      // ── Colonne « Type » (1re case à choisir) : interne / sous-traité ──
      var typeCol = '<select class="nom-f-inp" onchange="nomOnEtapeTypeChange('+i+', this.value)">'
        + '<option value="interne"'+(e.type==='interne'?' selected':'')+'>Interne</option>'
        + '<option value="sous_traite"'+(e.type==='sous_traite'?' selected':'')+'>Sous-traité</option>'
        + '</select>';
      // Poste courant : explicite (e.poste_id), sinon dérivé du process choisi (compat gammes existantes)
      var curPoste = e.poste_id || (e.process_id && _procById[String(e.process_id)] ? (_procById[String(e.process_id)].poste_id||'') : '') || '';
      // ── Colonne « Poste » (2e case) : interne = poste d'atelier ; ST = sous-traitant ──
      var posteCol;
      if (e.type === 'interne') {
        var posteOpts = POSTES.map(function(p){ return '<option value="'+p.id+'"'+(String(curPoste)===String(p.id)?' selected':'')+'>'+String(p.nom||'?').replace(/</g,'&lt;')+'</option>'; }).join('');
        posteCol = '<select class="nom-f-inp" onchange="nomOnEtapePosteChange('+i+', this.value)"><option value="">— Poste —</option>'+posteOpts+'</select>';
      } else {
        var stSelOpts = NOM_STS.map(function(s){ return '<option value="'+s.id+'"'+(e.fournisseur_st_id===s.id?' selected':'')+'>'+String(s.nom||'?').replace(/</g,'&lt;')+'</option>'; }).join('');
        posteCol = '<select class="nom-f-inp" onchange="nomOnEtapeSTChange('+i+', this.value)"><option value="">— Sous-traitant —</option>'+stSelOpts+'</select>';
      }
      // ── Colonne « Process » (3e case) : interne = process DU POSTE choisi ; ST = opération ──
      var midCol;
      if (e.type === 'interne') {
        // Process choisissables = UNIQUEMENT ceux rattachés au poste courant
        var procsForPoste = PROCS.filter(function(p){ return String(p.poste_id||'')===String(curPoste||''); });
        var procOpts = procsForPoste.map(function(p){
          // Libellé : type du process (règle serveur typeProcess) + machine + alerte si le taux machine manque
          var tpP = NOM_TX.typeProcess(p);
          var mm = (tpP === 'machine' && p.machine_id) ? (BE_REFS_JS.machines||[]).find(function(x){return String(x.id)===String(p.machine_id);}) : null;
          var sub = (tpP === 'machine') ? (' · '+(mm ? mm.nom : 'machine')+(p.taux_source === 'manquant' ? ' · taux à saisir' : ''))
            : (tpP === 'oas' ? ' · OAS' : ' · manuel');
          return '<option value="'+_escH(p.id)+'"'+(String(e.process_id||'')===String(p.id)?' selected':'')+'>'+_escH(String(p.nom||'')+sub)+'</option>';
        }).join('');
        // Indication sous le process : d'où vient le coût horaire de l'étape
        var _hs = 'font-size:.58rem;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        var _mn = e.machine_nom ? (_escH(e.machine_nom)+' · ') : '';
        var hint = '';
        if (d.typeProcess === 'machine' && (e.process_id || e.machine_id)) {
          if (d.sourceTauxMachine === 'process') hint = '<div style="'+_hs+'color:#94a3b8;" title="Taux horaire machine saisi sur le process (réglage machine et temps machine). Le temps homme est au coût chargé RH.">'+_mn+'Machine · '+_eur(d.tauxMachine)+' €/h</div>';
          else if (d.sourceTauxMachine === 'transition_machine') hint = '<div style="'+_hs+'color:#94a3b8;" title="Taux provisoire repris du coût horaire de la machine, en attendant la saisie du taux sur le process (script cloud-7).">'+_mn+'Machine · '+_eur(d.tauxMachine)+' €/h (provisoire)</div>';
          else if (d.sourceTauxMachine === 'manquant') hint = '<div style="'+_hs+'color:#b45309;font-weight:700;" title="Saisir le taux horaire machine de ce process dans Production › Postes &amp; Process : en attendant, le temps machine vaut 0 €.">'+_mn+'Machine · taux à saisir</div>';
          else hint = '<div style="'+_hs+'color:#b45309;font-weight:700;" title="Aucun process machine unique ne porte cette machine : choisir le process pour valoriser le temps machine.">'+_mn+'Machine · process à choisir</div>';
        } else if (d.typeProcess === 'manuel' && e.process_id) {
          hint = '<div style="'+_hs+'color:#94a3b8;" title="Process manuel : tout le temps est du temps homme, valorisé au coût chargé RH moyen du site (fiche salarié).">Manuel · homme au coût chargé RH'+(NOM_TX.hommeManquant ? ' (à renseigner)' : (' ('+_eur(d.tauxHomme)+' €/h)'))+'</div>';
        } else if (d.typeProcess === 'oas' && e.process_id) {
          hint = '<div style="'+_hs+'color:#4338ca;" title="Process OAS : aucun bon de travail n est généré, aucun temps n est valorisé.">OAS · aucun temps valorisé</div>';
        }
        var _isMachStep = (d.typeProcess === 'machine');
        // Code programme = UNIQUEMENT pour les machines CNC. Machine identifiée non-CNC → pas de champ ;
        // MAIS on garde toujours le champ si un code existe déjà (aucune perte de donnée) ou si la machine
        // n'est pas résolue (gamme importée sans machine_id) → pas de régression.
        var _stepMach = e.machine_id ? (BE_REFS_JS.machines||[]).find(function(x){return String(x.id)===String(e.machine_id);}) : null;
        var _hasProg = !!(e.programme || e.programme_fichier);
        var _showProg = _isMachStep && (_stepMach ? (!!_stepMach.cnc || _hasProg) : true);
        var progInput = _showProg ? (''
          + '<input class="nom-f-inp" type="text" placeholder="N° programme machine" value="'+String(e.programme||'').replace(/"/g,'&quot;')+'" oninput="nomEtapes['+i+'].programme=this.value" title="Numero de programme machine (imprime sur l OF)" style="margin-top:2px;font-size:.62rem;padding:2px 5px;"/>'
          + '<input class="nom-f-inp" type="text" placeholder="Fichier programme (.nc, .mpf...)" value="'+String(e.programme_fichier||'').replace(/"/g,'&quot;')+'" oninput="nomEtapes['+i+'].programme_fichier=this.value" title="Nom du fichier programme CN" style="margin-top:2px;font-size:.62rem;padding:2px 5px;"/>'
        ) : '';
        var _procPrompt = curPoste ? '— Process —' : '(choisir un poste)';
        var _procDis = curPoste ? '' : ' disabled';
        midCol = '<div><select class="nom-f-inp" onchange="nomOnEtapeProcessChange('+i+', this.value)"'+_procDis+'><option value="">'+_procPrompt+'</option>'+procOpts+'</select>'+hint+progInput+'</div>';
      } else {
        var ops = nomStOperationsFor(e.fournisseur_st_id);
        var opOpts2 = ops.map(function(op){
          var t = nomStTarif(e.fournisseur_st_id, op);
          var pu = t ? (parseFloat(t.prix_unitaire_piece_ht)||0) : 0;
          return '<option value="'+op.replace(/"/g,'&quot;')+'"'+(e.operation_st===op?' selected':'')+'>'+op+' ('+pu.toFixed(2)+' €/pc)</option>';
        }).join('');
        var dis = e.fournisseur_st_id ? '' : ' disabled';
        midCol = '<select class="nom-f-inp" onchange="nomOnEtapeOperationChange('+i+', this.value)"'+dis+'><option value="">'+(e.fournisseur_st_id?'— Opération —':'(choisir sous-traitant)')+'</option>'+opOpts2+'</select>';
      }
      // ── Colonne coût ── homme = (ROP + RGM + THV) × coût chargé RH ; machine = (RGM + TMV) × taux machine du process
      var coutCol;
      if (e.type === 'interne') {
        var moE  = nomEtapeCoutMO(e);
        var macE = nomEtapeCoutMachine(e);
        var _txtTM = (d.typeProcess === 'machine') ? ((d.sourceTauxMachine === 'manquant' || d.sourceTauxMachine === 'sans_process') ? 'à saisir' : (_eur(d.tauxMachine)+' €/h')) : 'process non machine : 0';
        coutCol = '<div style="text-align:right;padding:3px 6px;line-height:1.2;"'+(d.manquants.length ? (' title="'+_escH(d.manquants.map(beLibelleManquant).join(' · '))+'"') : '')+'>'
          + '<div style="font-size:.6rem;color:#0ea5e9;font-weight:700;" title="Homme = (ROP + RGM + THV) × coût chargé RH moyen du site ('+(NOM_TX.hommeManquant ? 'à renseigner dans RH' : (_eur(d.tauxHomme)+' €/h'))+'), réglage compris pour 1 pièce">Homme '+moE.toFixed(2)+' €</div>'
          + '<div style="font-size:.6rem;color:#9333ea;font-weight:700;" title="Machine = (RGM + TMV) × taux horaire machine du process ('+_txtTM+')">Mach '+macE.toFixed(2)+' €'+(d.manquants.length ? ' <i class="fas fa-triangle-exclamation" style="color:#b45309;"></i>' : '')+'</div>'
          + '<div style="font-size:.74rem;color:#374151;font-weight:800;border-top:1px solid #eef2f7;margin-top:1px;padding-top:1px;">'+cout+' €</div>'
          + '</div>';
      } else if (e.est_oas === true) {
        // OAS : saisie directe du prix. Le forfait éventuel est un plancher de facturation
        // (coût du bain), exactement comme en sous-traitance : coût = max(forfait ; qté × prix).
        var oasHint = e.forfait_oas_ht ? ('<div style="font-size:.56rem;color:#b45309;text-align:right;margin-top:1px;">forfait '+Number(e.forfait_oas_ht).toFixed(0)+' €</div>') : '';
        coutCol = '<div><input class="nom-f-inp" type="number" step="0.01" placeholder="€/pc" title="Traitement de surface : prix par pièce (aucun temps n est saisi)" value="'+(e.prix_oas_unitaire||0)+'" oninput="nomEtapes['+i+'].prix_oas_unitaire=parseFloat(this.value)||0;nomCalcTotaux()" onchange="nomRenderEtapes()" style="text-align:right;border-color:#c7d2fe;"/>'
          + '<div style="font-size:.54rem;color:#4338ca;text-align:right;margin-top:1px;font-weight:700;">OAS · prix</div>' + oasHint + '</div>';
      } else {
        var forfaitHint = e.forfait_st_ht ? ('<div style="font-size:.56rem;color:#b45309;text-align:right;margin-top:1px;">forfait '+e.forfait_st_ht.toFixed(0)+' €</div>') : '';
        coutCol = '<div><input class="nom-f-inp" type="number" step="0.01" placeholder="€/pc" value="'+(e.prix_unitaire_st_ht||0)+'" oninput="nomEtapes['+i+'].prix_unitaire_st_ht=parseFloat(this.value)||0;nomEtapes['+i+'].cout_st_unitaire=nomEtapes['+i+'].prix_unitaire_st_ht;nomCalcTotaux()" style="text-align:right;"/>'+forfaitHint+'</div>';
      }
      // Champs temps : réglage + MO + machine. Grisés en sous-traitance ; le temps machine est aussi grisé pour un process manuel (sans machine).
      var estOas = (e.est_oas === true) || d.oas === true;   // drapeau de l'étape OU process de type OAS
      // OAS : tous les temps sont grisés — le traitement se chiffre au prix du bain, pas à l'heure.
      var greyTime = (e.type === 'sous_traite') || estOas;
      // Temps machine (RGM, TMV) : seulement pour un process MACHINE — un process machine sans machine rattachée
      // reste machine. Sur une étape non machine, une valeur déjà saisie reste visible (et modifiable) avec son effet.
      var noMachine = (e.type === 'interne' && d.typeProcess !== 'machine');
      var greyStyle = 'text-align:right;background:#eef2f7;color:#cbd5e1;cursor:not-allowed;';
      // oninput : met à jour le modèle + les totaux SANS re-render (sinon la saisie multi-chiffres bug — ex. « 10 »).
      // onchange (sortie de champ) : rafraîchit la colonne coût de l'étape.
      // Saisie en MILLIÈMES d'heure (1000 = 1 h). Stockage interne conservé en minutes (min = ‰ × 0.06)
      // → aucun impact sur le moteur de coût / l'OF / les dashboards. Affichage input = min × 1000/60.
      var mkTime = function(field, val, titre, alerte){ var mil = val ? +((Number(val)*1000/60).toFixed(1)) : 0; return '<input class="nom-f-inp" type="number" step="1" min="0" inputmode="decimal" placeholder="0" title="'+(titre || '1000 millièmes = 1 heure')+'" value="'+mil+'" oninput="nomEtapeEnMinutes(nomEtapes['+i+']);nomEtapes['+i+'].'+field+'=(parseFloat(this.value)||0)*60/1000;nomCalcTotaux()" onchange="nomRenderEtapes()" style="text-align:right;'+(alerte ? 'border-color:#fdba74;background:#fff7ed;' : '')+'"/>'; };
      var greyInput = function(titleTxt){ return '<input class="nom-f-inp" type="number" placeholder="—" disabled title="'+titleTxt+'" style="'+greyStyle+'"/>'; };
      // ROP = reglage operateur (au taux MO) · RGM = reglage machine (au taux machine).
      // Les deux sont des couts FIXES par lot, jamais multiplies par la quantite.
      var motifGris = estOas ? 'Traitement OAS : on saisit un prix, pas un temps' : 'Non applicable en sous-traitance';
      var regInput = greyTime ? greyInput(motifGris) : mkTime('temps_reglage_min', e.temps_reglage_min, 'ROP — réglage homme (1000 = 1 h) : temps homme, fixe par lot');
      var regMacInput = greyTime ? greyInput(motifGris)
        : (!noMachine ? mkTime('temps_reglage_machine_min', e.temps_reglage_machine_min, 'RGM — réglage machine (1000 = 1 h) : temps homme + machine, fixe par lot')
        : ((Number(e.temps_reglage_machine_min) || 0) > 0 ? mkTime('temps_reglage_machine_min', e.temps_reglage_machine_min, 'Process non machine : ce réglage compte en temps homme seulement (aucun taux machine)', true)
        : greyInput('Process manuel — pas de machine à régler (choisir un process machine)')));
      var moInput  = greyTime ? greyInput(motifGris) : mkTime('temps_mo_min', e.temps_mo_min, 'THV — temps homme variable par pièce (1000 = 1 h)');
      var macInput = greyTime ? greyInput(motifGris)
        : (!noMachine ? mkTime('temps_machine_min', e.temps_machine_min, 'TMV — temps machine variable par pièce (1000 = 1 h) : temps machine seul')
        : ((Number(e.temps_machine_min) || 0) > 0 ? mkTime('temps_machine_min', e.temps_machine_min, 'Process non machine : ce temps machine n est PAS valorisé — le passer en temps homme ou choisir un process machine', true)
        : greyInput('Process manuel — pas de machine (choisir un process machine)')));
      return '<div ondragover="nomEtapeDragOver(event)" ondrop="nomEtapeDrop(event,'+i+')" style="display:grid;grid-template-columns:34px 84px 1fr 1.2fr 58px 58px 58px 62px 88px 26px;gap:4px;margin-bottom:4px;align-items:start;">'
        + '<div draggable="true" ondragstart="nomEtapeDragStart(event,'+i+')" ondragend="nomEtapeDragEnd(event)" title="Glisser pour réordonner les procédés" style="text-align:center;cursor:grab;font-size:.74rem;font-weight:800;color:#94a3b8;font-family:monospace;padding-top:6px;user-select:none;"><i class="fas fa-grip-vertical" style="color:#cbd5e1;font-size:.66rem;"></i> '+(e.ordre || (i+1))+'</div>'
        + typeCol
        + posteCol
        + midCol
        + regInput
        + regMacInput
        + moInput
        + macInput
        + coutCol
        + '<button onclick="nomRemoveEtape('+i+')" title="Supprimer" style="width:24px;height:24px;border-radius:6px;border:none;background:#fee2e2;color:#dc2626;cursor:pointer;font-size:.8rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:3px;">×</button>'
        + '</div>';
    }).join('');
    nomCalcTotaux();
    nomRenderFaoList();   // GED : liste FAO (par étape machine) synchronisée avec la gamme
  }

  // Total matière + accessoires par pièce (Σ prix/pièce des 2 compartiments)
  function nomTotalMatiere(){ return nomMatieres.reduce(function(s,m){ return s + nomMatierePrixPiece(m); }, 0); }
  function nomTotalAccessoire(){ return nomAccessoires.reduce(function(s,a){ return s + nomAccPrixPiece(a); }, 0); }
  // Formate un nombre de MINUTES (stockage interne) en « HhMM » pour l'affichage des résultats.
  function nomHhMM(mins){ mins = Math.max(0, Math.round(Number(mins)||0)); var h = Math.floor(mins/60), m = mins - h*60; return h + 'h' + (m<10?'0':'') + m; }

  function nomCalcTotaux() {
    var totalMatiere = nomTotalMatiere(), totalAccessoire = nomTotalAccessoire();
    var totalFourn = totalMatiere + totalAccessoire;
    // Totaux étapes — UNE décomposition par étape (nomEtapeDecomp = miroir de etapeDecomp serveur)
    var reglageTotal  = 0, unitaireTotal = 0, etapesTotal = 0, machineTotal = 0;
    var stUnitTotal = 0, reglageFixe = 0, _decomps = [];
    nomEtapes.forEach(function(e){
      var d = nomEtapeDecomp(e); _decomps.push(d);
      reglageTotal  += d.reglageMin;                  // ROP + RGM (minutes)
      unitaireTotal += d.moMin + d.machineMin;        // THV + TMV valorisé (minutes / pièce)
      if (d.st) { etapesTotal += d.unit; stUnitTotal += d.unit; return; }   // ST / OAS : prix pièce
      etapesTotal  += d.moPc + d.machPc + d.moFixe + d.machFixe;
      machineTotal += d.machPc + d.machFixe;
      reglageFixe  += d.moFixe + d.machFixe;           // fixe / lot (réglages + opérations fixes)
    });
    nomRenderAlerteTaux(_decomps);
    // Pour une mère : le prix de revient = somme des standards composants.
    var isMere = (document.getElementById('nom-f-type') && document.getElementById('nom-f-type').value === 'mere');
    var prixRevient = isMere ? nomComposantTotal() : (totalFourn + etapesTotal);

    var fmt = function(v){ return v.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}); };
    var el = function(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; };
    el('nom-total-fourn',     fmt(totalFourn) + ' €');
    el('nom-total-matiere',   fmt(totalMatiere) + ' €');
    el('nom-total-accessoire',fmt(totalAccessoire) + ' €');
    el('nom-calc-fourn',      fmt(totalFourn) + ' €');
    el('nom-calc-mo',         fmt(etapesTotal) + ' €');
    el('nom-calc-machine',    fmt(machineTotal) + ' €');
    el('nom-calc-total',      fmt(prixRevient) + ' €');
    el('nom-total-reglage',   nomHhMM(reglageTotal));
    el('nom-total-unitaire',  nomHhMM(unitaireTotal));
    el('nom-total-etapes',    fmt(etapesTotal));

    // ── Estimation pour une quantité de commande : applique le forfait ST (plancher) ──
    // Coût réel ST d'une commande de Q pièces = Σ max(forfait_i ; Q × prix_unitaire_i)
    // Le RÉGLAGE est un coût FIXE par lot (la machine se règle une fois, qu'on fasse 1 ou 10 000 pièces) :
    // il est compté UNE seule fois, jamais multiplié par Q. Seuls MO/machine variables + fournitures × Q.
    var qSerie = parseInt((document.getElementById('nom-qte-serie')||{}).value, 10);
    if (!qSerie || qSerie < 1) qSerie = 1;
    var stSerie = 0;
    // Sous-traitance ET OAS : max(forfait ; Q × prix pièce) — même chemin que le moteur (etapeDecomp)
    _decomps.forEach(function(d){ if (d.st) stSerie += Math.max(d.forfait, qSerie * d.unit); });
    // varPerPiece = part réellement variable : fournitures + MO/machine (hors réglage) + (étapes internes hors ST)
    var varPerPiece = prixRevient - stUnitTotal - reglageFixe;
    var totalSerie = reglageFixe + varPerPiece * qSerie + stSerie;
    var revientReel = qSerie > 0 ? totalSerie / qSerie : prixRevient;
    el('nom-calc-st-serie',      fmt(stSerie));
    el('nom-calc-total-serie',   fmt(totalSerie));
    el('nom-calc-revient-reel',  fmt(revientReel));

    // ── Détail des 5 postes (par pièce) — la somme = prix de revient unitaire ──
    var dMoVar = etapesTotal - stUnitTotal - reglageFixe;   // MO + machine variables / pièce (étapes internes hors réglage)
    if (dMoVar < 0) dMoVar = 0;
    el('nom-calc-matiere-d',    fmt(totalMatiere) + ' €');
    el('nom-calc-accessoire-d', fmt(totalAccessoire) + ' €');
    el('nom-calc-mofixe',       fmt(reglageFixe) + ' €');    // MO fixe = réglage (coût / lot)
    el('nom-calc-movar',        fmt(dMoVar) + ' €');
    el('nom-calc-st-d',         fmt(stUnitTotal) + ' €');

    // ── Mêmes 5 postes, mais pour la QUANTITÉ voulue (simulation série) ──
    el('nom-calc-s-matiere',    fmt(totalMatiere * qSerie) + ' €');
    el('nom-calc-s-accessoire', fmt(totalAccessoire * qSerie) + ' €');
    el('nom-calc-s-mofixe',     fmt(reglageFixe) + ' €');        // réglage = fixe / lot (compté une seule fois)
    el('nom-calc-s-movar',      fmt(dMoVar * qSerie) + ' €');
    el('nom-calc-s-st',         fmt(stSerie) + ' €');            // sous-traitance : max(forfait ; qté × unitaire)
    el('nom-calc-s-qte',        String(qSerie));
  }

  // Alerte « coût incomplet » : ce qui manque pour chiffrer (taux machine à saisir, coût chargé RH, process).
  function nomRenderAlerteTaux(decomps){
    var box = document.getElementById('nom-taux-alerte'); if (!box) return;
    var vus = {}, procsSansTaux = [];
    (decomps || []).forEach(function(d){
      (d.manquants || []).forEach(function(m){ vus[m] = true; });
      if ((d.manquants || []).indexOf('taux_machine') >= 0 && d.process && procsSansTaux.indexOf(d.process.nom) < 0) procsSansTaux.push(d.process.nom);
    });
    var codes = Object.keys(vus);
    if (!codes.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
    var esc0 = function(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;'); };
    box.innerHTML = '<div style="font-weight:800;margin-bottom:2px;"><i class="fas fa-triangle-exclamation" style="margin-right:5px;"></i>Coût de revient incomplet</div>'
      + codes.map(function(c){ return '<div>• ' + esc0(beLibelleManquant(c)) + (c === 'taux_machine' && procsSansTaux.length ? (' — ' + esc0(procsSansTaux.join(', '))) : '') + '</div>'; }).join('');
    box.style.display = 'block';
  }

  function nomCollectPayload(statut) {
    var totalFourn  = nomTotalMatiere() + nomTotalAccessoire();
    var reglageTotal=0, unitaireTotal=0, etapesTotal=0, machineTotal=0;
    nomEtapes.forEach(function(e){
      reglageTotal  += e.temps_reglage_min || 0;
      unitaireTotal += (e.temps_mo_min || 0) + (e.temps_machine_min || 0);
      etapesTotal += nomEtapeCoutUnitaire(e);
      if (e.type === 'interne') machineTotal += nomEtapeCoutMachine(e);
    });
    var moTotal = etapesTotal - machineTotal;
    var nType = (document.getElementById('nom-f-type')?.value === 'mere') ? 'mere' : 'standard';
    var isMere = (nType === 'mere');
    var composantsTot = nomComposantTotal();
    var prixRevientUnit = isMere ? composantsTot : (totalFourn + etapesTotal);
    var payload = {
      id:               nomCurrentId,
      indice:           nomCurrentIndice,
      version_groupe:   nomCurrentGroupe,
      entite:           (document.getElementById('nom-f-entite')?.value === 'Semrac') ? 'Semrac' : 'Seem',
      num_nom:          document.getElementById('nom-f-num')?.value || null,
      num_affaire:      document.getElementById('nom-f-affaire')?.value || null,
      code_ref_produit: document.getElementById('nom-f-code')?.value || document.getElementById('nom-f-num')?.value || null,
      description:      document.getElementById('nom-f-desc')?.value || null,
      num_plan:         document.getElementById('nom-f-numplan')?.value || null,
      plan_fichier:     document.getElementById('nom-f-planfic')?.value || null,
      type_nom:         nType,
      parent_id:        null,
      qte_par_mere:     null,
      composants:       null,   // posé plus bas par nomComposantsPourEnvoi (lot H0)
      masse_kg:         (function(){ var g=parseFloat(document.getElementById('nom-f-masse')?.value); return (!isNaN(g) && g>0) ? +(g/1000).toFixed(6) : null; })(),  // saisie en g → stock en kg
      dimensions:       document.getElementById('nom-f-dims')?.value || null,
      surface_totale_dm2: (function(){ var v=parseFloat(document.getElementById('nom-f-surface')?.value); return (!isNaN(v) && v>0) ? +(v/10000).toFixed(6) : null; })(),
      temps_matiere_h:  unitaireTotal ? +(unitaireTotal/60).toFixed(3) : null,
      temps_machine_h:  null,
      // Copies INFORMATIVES (plus lues par aucun calcul) : coût chargé RH moyen du site ; plus de taux machine
      // « moyen » (le taux machine est porté par chaque process).
      taux_mo:          NOM_TX.hommeManquant ? null : nomEtapeTauxHomme(),
      cout_machine_h:   null,
      prix_mo_unitaire:       isMere ? 0 : parseFloat(moTotal.toFixed(2)),
      cout_machine_unitaire:  isMere ? 0 : parseFloat(machineTotal.toFixed(2)),
      prix_revient_unitaire:  parseFloat(prixRevientUnit.toFixed(2)),
      temps_reglage_total_min:  reglageTotal,
      temps_unitaire_total_min: unitaireTotal,
      etapes_production: nomEtapesPourEnregistrement(),
      notes:            document.getElementById('nom-f-notes')?.value || null,
      cree_par:         document.getElementById('nom-f-createur')?.value || null,
      statut:           statut,
      // ── Fournitures au NOUVEAU modèle (lot H1, contrat §4) ────────────────────────────────────
      // «fournisseur» et «qte_paquet» ne sont PLUS envoyés (colonnes conservées en base, pas de DROP) :
      // la ligne porte une référence, son prix est le prix moyen du catalogue. Les OMETTRE (plutôt que
      // les envoyer vides) laisse le journal EN 9100 tracer la bascule en une seule entrée « recalcul ».
      // ⚠ «prix_unitaire» = prix moyen d'UNE TÔLE (matière) / d'UNE PIÈCE (accessoire), et
      //   «prix_total_par_piece» est OBLIGATOIRE : sans «qte_paquet», «computeNomCostForQty» passe au
      //   calcul LINÉAIRE prix_total_par_piece × qté (« linéaire au BE, paquets au BC »).
      fournitures:      [].concat(
        nomMatieres.filter(function(m){ return m.ref || m.designation; }).map(function(m){
          nomMatiereAppliquer(m);
          var n = nombrePositif(m.nb_par_tole);
          return { type_fourniture:'matiere', categorie:'matiere', designation:m.designation||'', ref_stock:m.ref||'',
            quantite_par_piece: (n!==null ? +(1/n).toFixed(6) : null), nb_par_tole: n,
            prix_unitaire: Number(m._prixTole)||0, prix_total_par_piece: +(Number(m._prixPiece)||0).toFixed(4) };
        }),
        nomAccessoires.filter(function(a){ return a.ref || a.designation; }).map(function(a){
          nomAccAppliquer(a);
          var nbp = nombrePositif(a.nb_par_piece);
          return { type_fourniture:'accessoire', categorie:'accessoire', designation:a.designation||'', ref_stock:a.ref||'',
            quantite_par_piece: (nbp===null ? 0 : nbp), nb_par_tole: null,
            prix_unitaire: Number(a._prixPiece)||0, prix_total_par_piece: +(Number(a._prixTotal)||0).toFixed(4) };
        })
      )
    };
    // Relecture 17/09/2026 : une liste de fournitures VIDE n'efface celles de la base que si l'écran
    // fait FOI (fiche neuve, ou relecture réussie). Sinon le serveur refuse en 409 (« fournitures_vides »)
    // — même protection que vider_composants pour les mères.
    if (payload.fournitures.length === 0 && nomFournituresEtat === 'ok') payload.vider_fournitures = true;
    // Lot H0 : composants — jamais une liste vide qui écraserait ceux de la base sans action explicite
    var envoi = nomComposantsPourEnvoi(isMere);
    if (envoi.omettre) {
      // Relecture H0 : composants gardés en base → leur coût aussi (sinon prix_revient_unitaire = 0 écrasait la mère)
      delete payload.composants;
      delete payload.prix_revient_unitaire; delete payload.prix_mo_unitaire; delete payload.cout_machine_unitaire;
    }
    else payload.composants = envoi.composants;
    if (envoi.vider) payload.vider_composants = true;
    return payload;
  }
  // Lot H0 : décide ce qui part dans « composants ».
  //  - mère avec au moins un composant choisi → la liste ;
  //  - mère sans composant : [] + vider_composants si l'utilisateur a retiré / changé des composants (fiche existante),
  //    [] pour une fiche jamais enregistrée ou qui n'était pas une mère à l'ouverture, sinon clé OMISE avec les champs de
  //    coût (la base garde ses composants ET leur coût : lecture ratée, instantané périmé) ;
  //  - standard : null ; + vider_composants si la fiche était une mère à l'ouverture (bascule explicite du type).
  function nomComposantsPourEnvoi(isMere){
    if (!isMere) return (nomCurrentId && nomTypeCharge === 'mere') ? { composants: null, vider: true } : { composants: null };
    var liste = nomComposants.filter(function(c){ return c && c.nom_id; }).map(function(c){ return { nom_id:c.nom_id, num_nom:c.num_nom, code:c.code, prix:c.prix, qte:parseFloat(c.qte)||1 }; });
    if (liste.length) return { composants: liste };
    if (!nomCurrentId) return { composants: [] };
    if (nomTypeCharge !== 'mere') return { composants: [] };   // standard devenu mère : aucune liste en base à protéger
    if (nomComposantsModifies) return { composants: [], vider: true };
    return { omettre: true };
  }

  // Étapes enregistrées : copies INFORMATIVES des taux du jour (taux_mo_h = coût chargé RH du site,
  // machine_taux_h = taux du process machine), tracées « recalcul » au journal EN 9100. Le moteur ne les lit pas.
  function nomEtapesPourEnregistrement(){
    return nomEtapes.map(function(e){
      if (!e || e.type !== 'interne' || e.est_oas === true) return e;
      var d = nomEtapeDecomp(e), c = Object.assign({}, e);
      c.taux_mo_h = NOM_TX.hommeManquant ? null : Math.round(d.tauxHomme * 100) / 100;
      c.machine_taux_h = (d.typeProcess === 'machine') ? Math.round(d.tauxMachine * 100) / 100 : 0;
      return c;
    });
  }

  async function nomSave(statut) {
    // Une nomenclature DEJA validee reste validee quand on l'enregistre. Le bouton
    // Enregistrer envoyait en_cours et la devalidait en silence : elle quittait la liste
    // des faites et la cascade de production. Le serveur applique la meme regle.
    if (nomTauxIllisibles() || nomFournituresIllisibles()) return;
    // Lot H1 §4 : garde-fou des DOUBLONS avant tout envoi — même fonction que le serveur
    // (premierDoublonFourniture / messageDoublonFourniture), donc même message. Côté serveur le
    // refus (409) arrive AVANT l'effacement des fournitures ; ici on n'envoie rien du tout.
    var _dbl = premierDoublonFourniture(nomFournituresPourDoublons());
    if (_dbl) { pushNotif('err','fa-clone', messageDoublonFourniture(_dbl), 10000); return; }
    var dejaValidee = (nomCurrentStatut === 'valide');
    var statutEffectif = (statut !== 'valide' && dejaValidee) ? 'valide' : statut;
    var payload = nomCollectPayload(statutEffectif);
    if (!payload.num_nom) {
      pushNotif('err','fa-exclamation-triangle','Le N° de nomenclature (réf. pièce) est obligatoire.');
      return;
    }
    // (L'incrément d'indice se fait via le bouton dédié « Incrémenter l'indice », pas au save.)
    var nouvelIndice = false;
    try {
      var url = payload.id ? '/api/nomenclature/'+payload.id : '/api/nomenclature';
      var method = payload.id ? 'PUT' : 'POST';
      var res = await fetch(url, {
        method: method,
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      var data = await res.json();
      if (data.ok) {
        var num = data.num_nom || (data.data && data.data.num_nom) || '';
        // ⚠ POINT CRITIQUE : on récupère l'identifiant renvoyé par le serveur. Sans lui, le
        // deuxième « Enregistrer » repartait en POST et créait un DOUBLON (le serveur n'écrase
        // que les brouillons de même réf+indice, pas les « en cours »). C'est ce qui donnait
        // l'impression que le bouton ne fonctionnait pas.
        if (data.id) nomCurrentId = data.id;
        if (data.indice) nomCurrentIndice = data.indice;
        // Statut RÉEL renvoyé par le serveur (une fiche validée entre-temps le reste côté serveur) :
        // c'est lui qui choisit le message, le badge et les enregistrements suivants.
        nomCurrentStatut = data.statut || statutEffectif;
        if (statut !== 'valide' && nomCurrentStatut === 'valide') dejaValidee = true;
        // Lot H0 : l'instantané local suit l'enregistrement (une réouverture sans rechargement ne montre plus l'ancienne version)
        nomMajInstantane(payload, data);
        // Les composants envoyés sont désormais ceux de la base : un prochain enregistrement repart de cet état.
        nomComposantsModifies = false;
        nomTypeCharge = (payload.type_nom === 'mere') ? 'mere' : 'standard';
        if (statut === 'valide') {
          pushNotif('ok','fa-check-circle', (num ? num+' — ' : '') + 'Nomenclature validée — elle rejoint la liste des nomenclatures faites.', 4500);
          // Journal EN 9100 en échec : on laisse le temps de LIRE l'avertissement avant de quitter la page.
          var _delai = 900;
          if (data.journal === false) { pushNotif('warn','fa-clipboard-list','Validation enregistrée, mais le journal EN 9100 n’a pas pu la tracer : '+String(data.journal_raison||'').replace(/[<>]/g,'')+'.',9000); _delai = 6000; }
          setTimeout(function(){ window.location.replace('/be/service?' + Date.now() + '#noms'); }, _delai);
          return;
        }
        if (dejaValidee) {
          pushNotif('ok','fa-save', (num ? num+' — ' : '') + 'Modifications enregistrées — la nomenclature reste validée.', 4000);
          var _bv = document.getElementById('nom-form-statut-badge');
          if (_bv) _bv.innerHTML = '<span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:800;">Validée</span>';
          if (typeof gedRefreshUi === 'function') gedRefreshUi();
          if (data.journal === false) pushNotif('warn','fa-clipboard-list','Modification enregistrée, mais le journal EN 9100 n’a pas pu l’écrire : '+String(data.journal_raison||'').replace(/[<>]/g,'')+'.',9000);
          if (typeof nomJournalLoad === 'function') nomJournalLoad();
          return;
        }
        // Enregistrement simple : on RESTE dans la nomenclature, la progression est sauvegardée
        // et la nomenclature demeure dans « à faire ».
        if (nouvelIndice && data.indice) pushNotif('ok','fa-code-branch', (num ? num+' — ' : '') + 'Nouvel indice '+data.indice+' créé (révision conservée).', 4500);
        else pushNotif('ok','fa-save', (num ? num+' — ' : '') + 'Progression enregistrée. Vous restez sur la nomenclature.', 3500);
        if (data.journal === false) pushNotif('warn','fa-clipboard-list','Modification enregistrée, mais le journal EN 9100 n’a pas pu l’écrire : '+String(data.journal_raison||'').replace(/[<>]/g,'')+'.',9000);
        var _b = document.getElementById('nom-form-statut-badge');
        if (_b) _b.innerHTML = '<span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:800;">Enregistrée · à valider</span>';
        if (typeof gedRefreshUi === 'function') gedRefreshUi();   // les pièces jointes deviennent possibles dès qu'un id existe
        if (typeof nomJournalLoad === 'function') nomJournalLoad();
      } else if (data.code === 'doublon_reference') {
        // 409 du serveur : la même référence figure deux fois. Refus AVANT toute écriture — les
        // fournitures de la fiche sont intactes. Le message est celui du module partagé.
        pushNotif('err','fa-clone', data.error || 'Doublon de référence dans les fournitures.', 12000);
      } else if (data.code === 'fournitures_vides') {
        // 409 du serveur : la fiche a des fournitures en base et l'écran en envoyait zéro (lecture
        // ratée, onglet resté ouvert). Rien n'a été effacé — il faut rouvrir la fiche.
        nomFournituresEtat = 'erreur';
        pushNotif('err','fa-ban', data.error || 'Enregistrement refusé : la liste des fournitures envoyée est vide.', 14000);
      } else {
        pushNotif('err','fa-ban', data.error || 'Enregistrement refusé.', 8000);
      }
    } catch(e) {
      pushNotif('err','fa-exclamation-circle','Erreur réseau : ' + e.message, 6000);
    }
  }

  // Suppression in-place : on retire uniquement la ligne supprimée et on re-numérote
  // les indices. Pas de reload complet → évite le flash "tout s'efface".
  async function nomSupprimer(id, num, suivi) {
    // Une nomenclature VALIDÉE (ou validée puis dévalidée) ne se supprime qu'avec un MOTIF, inscrit
    // au journal EN 9100. Les listes Standards / Mères ne contiennent que des validées (suivi = 1).
    var motif = null;
    if (suivi) {
      motif = await appMotif('Supprimer la nomenclature ' + num + ' ? Cette action est irréversible.\\nIndiquez le motif : il sera inscrit au journal EN 9100.', { title: 'Supprimer une nomenclature validée', okLabel: 'Supprimer' });
      if (motif === null) return;
    } else if (!await appConfirm('Supprimer la nomenclature ' + num + ' ? Cette action est irreversible.')) return;
    try {
      var envoyer = function(m){ return fetch('/api/nomenclature/' + id, m ? { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ motif: m }) } : { method: 'DELETE' }).then(function(r){ return r.json(); }); };
      var data = await envoyer(motif);
      // Brouillon issu d'une fiche validée puis dévalidée : le serveur réclame le motif.
      if (!data.ok && data.motif_requis) {
        motif = await appMotif('La nomenclature ' + num + ' a déjà été validée : sa suppression est inscrite au journal EN 9100.\\nIndiquez le motif.', { title: 'Motif de suppression', okLabel: 'Supprimer' });
        if (motif === null) return;
        data = await envoyer(motif);
      }
      if (!data.ok) {
        pushNotif('err','fa-exclamation-triangle','Erreur suppression: ' + (data.error || 'inconnu'), 5000);
        return;
      }
      pushNotif('ok','fa-trash','Nomenclature ' + num + ' supprimée.', 4000);
      if (data.journal === false) pushNotif('warn','fa-clipboard-list','Nomenclature supprimée, mais le journal EN 9100 n’a pas pu tracer la suppression : '+String(data.journal_raison||'').replace(/[<>]/g,'')+'.',9000);
      // Retire uniquement la ligne concernée
      var row = document.querySelector('tr[data-nom-row="' + id + '"]');
      if (row) row.remove();
      // Re-numérote les # et si plus aucune ligne, affiche l'état vide
      var rows = document.querySelectorAll('#nom-tbl tbody tr');
      rows.forEach(function(tr, i){
        var firstTd = tr.querySelector('td');
        if (firstTd) firstTd.textContent = String(i+1).padStart(2,'0');
      });
      if (rows.length === 0) {
        var card = document.getElementById('nom-list-card');
        if (card) card.innerHTML = '<div style="padding:48px;text-align:center;color:#9ca3af;"><i class="fas fa-inbox" style="font-size:2rem;margin-bottom:12px;display:block;"></i><div style="font-weight:600;margin-bottom:4px;">Aucune nomenclature</div><div style="font-size:.78rem;">Cliquez sur « + Nouvelle nomenclature » ou validez une DT « Nouveau produit » côté commercial</div></div>';
      }
      // Mets à jour les compteurs (badge de l'onglet et du sous-onglet)
      var newCount = rows.length;
      var existingBadge = document.querySelector('#nom-subtab-btn-standards span');
      if (existingBadge) existingBadge.textContent = String(newCount);
      var headerBadge = document.querySelector('#nom-subtab-standards div span[style*="border-radius:999px"]');
      if (headerBadge) headerBadge.textContent = String(newCount);
    } catch(e) {
      pushNotif('err','fa-exclamation-triangle','Erreur réseau: ' + e.message, 5000);
    }
  }

  // Bascule entre les sous-onglets « À créer » / « Standards » / « Mères »
  function switchNomSubtab(which) {
    var ids = ['tofaire', 'brouillons', 'standards', 'meres'];
    ids.forEach(function(s){
      var panel = document.getElementById('nom-subtab-' + s);
      var btn   = document.getElementById('nom-subtab-btn-' + s);
      var on    = (s === which);
      if (panel) panel.style.display = on ? 'block' : 'none';
      if (btn) {
        var accent = (s === 'meres') ? '#b45309' : (s === 'brouillons' ? '#d97706' : '#8b5cf6');
        btn.style.background = on ? accent : 'transparent';
        btn.style.color      = on ? 'white' : '#64748b';
        btn.style.boxShadow  = on ? '0 2px 8px rgba(139,92,246,.3)' : 'none';
        var pill = btn.querySelector('span');
        if (pill) {
          var offBg = (s === 'standards') ? '#ede9fe' : '#fef3c7';
          var offFg = (s === 'standards') ? '#5b21b6' : (s === 'meres' || s === 'brouillons' ? '#b45309' : '#92400e');
          pill.style.background = on ? 'rgba(255,255,255,.25)' : offBg;
          pill.style.color      = on ? 'white' : offFg;
        }
      }
    });
  }

  function beAnalyserDT(dtId, numAffaire, typeDT) {
    if (typeDT === 'Nouveau produit') {
      pushNotif('info','fa-sitemap','DT type Nouveau produit detectee — Demande NOM-'+numAffaire+' creee dans onglet Nomenclatures.');
    }
    pushNotif('ok','fa-drafting-compass','Analyse DT '+dtId+' ouverte. Affaire N°'+numAffaire+' ('+typeDT+')');
  }

  // Carte des DTs en attente BE (sérialisée côté serveur) → ouverture du panneau d'analyse pré-rempli
  var BE_DTS_MAP = {};
  try { (${DTS_BE_JSON}).forEach(function(d){ BE_DTS_MAP[d.id] = d; }); } catch(e){}

  function beOuvrirAnalyseDT(dtId){
    var dt = BE_DTS_MAP[dtId];
    if(!dt){ pushNotif('err','fa-times','DT introuvable',3500); return; }
    window._adDtId = dtId;
    document.getElementById('be-ad-id').textContent       = dt.id;
    document.getElementById('be-ad-client').textContent   = dt.client || '—';
    document.getElementById('be-ad-type').textContent     = dt.type || '—';
    document.getElementById('be-ad-activite').textContent = dt.activite || '—';
    document.getElementById('be-ad-prio').textContent     = dt.priorite || '—';
    var tb = document.getElementById('be-ad-pieces');
    var tf = document.getElementById('be-ad-foot');
    tb.innerHTML = '<tr><td colspan="9" style="padding:24px;text-align:center;color:#9ca3af;font-size:.78rem;"><i class="fas fa-spinner fa-spin" style="margin-right:6px;"></i>Calcul de l\\'analyse depuis les nomenclatures…</td></tr>';
    if(tf) tf.innerHTML = '';
    var panel = document.getElementById('be-analyse-detail');
    if(panel){ panel.style.display = 'block'; panel.scrollIntoView({behavior:'smooth', block:'nearest'}); }
    var fe = function(v){ return (Number(v)||0).toFixed(2) + ' €'; };
    fetch('/api/be/analyse-dt/' + encodeURIComponent(dtId))
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(!j || !j.ok){ tb.innerHTML = '<tr><td colspan="9" style="padding:24px;text-align:center;color:#ef4444;font-size:.78rem;">'+((j&&j.error)||'Erreur de calcul')+'</td></tr>'; return; }
        var pieces = j.pieces || [];
        if(!pieces.length){
          tb.innerHTML = '<tr><td colspan="9" style="padding:24px;text-align:center;color:#9ca3af;font-size:.78rem;">Aucune pièce renseignée dans la DT.</td></tr>';
          return;
        }
        var exigChips = function(p){ var ex=(p.exigences||[]); if(!ex.length) return ''; return '<div style="margin-top:3px;display:flex;flex-wrap:wrap;gap:3px;">'+ex.map(function(x){ return '<span style="background:#ecfeff;color:#0e7490;border:1px solid #a5f3fc;border-radius:5px;padding:0 5px;font-size:.6rem;font-weight:700;" title="Exigence de norme">'+String(x).replace(/</g,'&lt;')+'</span>'; }).join('')+'</div>'; };
        tb.innerHTML = pieces.map(function(p){
          if(!p.nomenclature || !p.cost){
            if(p.piece_existante_a_jour){
              return '<tr style="border-bottom:1px solid #dcfce7;background:#f0fdf4;">'
                + '<td style="${TD}font-weight:700;color:#15803d;font-family:monospace;">'+(p.ref_interne||'—')+exigChips(p)+'</td>'
                + '<td colspan="8" style="${TD}color:#15803d;font-size:.74rem;"><i class="fas fa-check-circle" style="margin-right:5px;"></i>Pièce déjà à jour — pas de nomenclature requise.</td>'
                + '</tr>';
            }
            return '<tr style="border-bottom:1px solid #fee2e2;background:#fff7f7;">'
              + '<td style="${TD}font-weight:700;color:#b91c1c;font-family:monospace;">'+(p.ref_interne||'—')+exigChips(p)+'</td>'
              + '<td colspan="2" style="${TD}color:#b91c1c;font-size:.74rem;"><i class="fas fa-exclamation-triangle" style="margin-right:5px;"></i>Nomenclature manquante</td>'
              + '<td colspan="6" style="${TD}color:#b91c1c;font-size:.72rem;">Créez la nomenclature de cette pièce pour compléter l\\'analyse.</td>'
              + '</tr>';
          }
          var c = p.cost; var draft = (p.nomenclature.statut==='brouillon');
          return '<tr style="border-bottom:1px solid #f9fafb;'+(draft?'background:#fffbeb;':'')+'">'
            + '<td style="${TD}font-weight:700;color:#374151;font-family:monospace;">'+(p.ref_interne||'—')+(p.ref_client?'<div style="font-size:.66rem;color:#9ca3af;font-family:inherit;">'+p.ref_client+'</div>':'')+exigChips(p)+'</td>'
            + '<td style="${TD}font-size:.74rem;color:#6366f1;font-weight:700;">'+(p.nomenclature.num_nom||'—')+' <span style="background:#eef2ff;border-radius:5px;padding:0 5px;font-size:.62rem;">'+(p.nomenclature.indice||'A')+'</span>'+(draft?' <span style="background:#fef3c7;color:#b45309;border-radius:5px;padding:0 5px;font-size:.6rem;font-weight:800;">brouillon</span>':'')+'</td>'
            + '<td style="${TD}text-align:right;font-weight:800;color:#15803d;">×'+c.qte+'</td>'
            + '<td style="${TD}text-align:right;color:#0ea5e9;font-weight:700;" title="dont accessoires '+fe(c.accessoire)+'">'+fe(c.matiereSerie)+'</td>'
            + '<td style="${TD}text-align:right;color:#0284c7;" title="Temps HOMME (ROP + RGM + THV) au coût chargé RH moyen du site'+(p.taux_homme!=null&&!p.homme_manquant?(' · '+(Number(p.taux_homme)||0).toFixed(2)+' €/h'):' · coût RH à renseigner')+' — réglage/lot inclus · '+(Number(c.moMinTotal)||0).toFixed(1)+' min/pc + '+(Number(c.reglageMinTotal)||0).toFixed(1)+' min/lot">'+fe(c.moSerie)+'</td>'
            + '<td style="${TD}text-align:right;color:#9333ea;" title="Temps MACHINE (RGM + TMV) au taux horaire machine de chaque process · '+(Number(c.machineMinTotal)||0).toFixed(1)+' min machine/pc">'+fe(c.machineSerie)+((p.manquants&&p.manquants.length)?' <i class="fas fa-triangle-exclamation" style="color:#b45309;" title="'+String(p.manquants.map(beLibelleManquant).join(' · ')).replace(/"/g,'&quot;')+'"></i>':'')+'</td>'
            + '<td style="${TD}text-align:right;color:#b45309;">'+fe(c.stOrder)+'</td>'
            + '<td style="${TD}text-align:right;font-weight:800;color:#111827;">'+fe(c.totalSerie)+'</td>'
            + '<td style="${TD}text-align:right;font-weight:700;color:#374151;">'+(Number(c.perPiece)||0).toFixed(3)+' €</td>'
            + '</tr>';
        }).join('');
        if(tf){
          tf.innerHTML = '<tr style="background:#f8fafc;border-top:2px solid #e2e8f0;">'
            + '<td colspan="7" style="${TD}text-align:right;font-weight:800;color:#374151;">TOTAL ANALYSE'+(j.missing>0?' <span style="color:#b91c1c;font-weight:700;font-size:.72rem;">('+j.missing+' pièce(s) sans nomenclature)</span>':'')+'</td>'
            + '<td style="${TD}text-align:right;font-weight:800;font-size:1rem;color:#4338ca;"><span id="be-ad-total">'+fe(j.totalSerie)+'</span></td>'
            + '<td></td></tr>';
        }
        var banner = document.getElementById('be-ad-banner');
        if(banner){
          if(j.missing>0){ banner.style.background='#fff7ed'; banner.style.borderColor='#fed7aa'; banner.style.color='#b45309'; banner.innerHTML='<i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i><strong>'+j.missing+' pièce(s)</strong> sans nomenclature : créez-les pour compléter l\\'analyse.'; }
          else if(j.drafts>0){ banner.style.background='#fffbeb'; banner.style.borderColor='#fde68a'; banner.style.color='#92400e'; banner.innerHTML='<i class="fas fa-pen-ruler" style="margin-right:6px;"></i><strong>'+j.drafts+' nomenclature(s) en brouillon</strong> — analyse <strong>visible</strong> mais <strong>non validable</strong> tant qu\\'elles ne sont pas validées.'; }
          else { banner.style.background='#f0fdf4'; banner.style.borderColor='#86efac'; banner.style.color='#166534'; banner.innerHTML='<i class="fas fa-check-circle" style="margin-right:6px;"></i>Toutes les nomenclatures sont validées — analyse complète.'; }
          // Coût incomplet (taux machine à saisir, coût chargé RH absent, étape sans process) : signalé, jamais masqué
          var _manq = {}; pieces.forEach(function(p){ (p.manquants||[]).forEach(function(m){ _manq[m] = true; }); });
          var _codes = Object.keys(_manq);
          if(_codes.length){ banner.innerHTML += '<div style="margin-top:6px;padding-top:6px;border-top:1px dashed currentColor;color:#9a3412;font-size:.74rem;"><i class="fas fa-triangle-exclamation" style="margin-right:6px;"></i><strong>Coût incomplet :</strong> '+_codes.map(beLibelleManquant).join(' · ').replace(/</g,'&lt;')+'</div>'; }
        }
      })
      .catch(function(){ tb.innerHTML = '<tr><td colspan="9" style="padding:24px;text-align:center;color:#ef4444;font-size:.78rem;">Erreur réseau lors du calcul.</td></tr>'; });
    if(dt.type === 'Nouveau produit'){
      pushNotif('info','fa-sitemap','DT « Nouveau produit » — pensez à créer la demande de nomenclature NOM-'+dt.numAffaire+'.',5500);
    }
  }

  function beFermerAnalyseDT(){
    var p = document.getElementById('be-analyse-detail');
    if(p) p.style.display = 'none';
  }
  (function() {
    var hash = (window.location.hash || '').replace('#be-','').replace('#','');
    if (BE_TABS.indexOf(hash) >= 0) switchBETab(hash);
    else switchBETab('noms');
    nomRenderMatieres();
    nomRenderAccessoires();
  })();
  </script>`

  return layout('Bureau d\'Études — Service BE', content, 'be-service')
}
