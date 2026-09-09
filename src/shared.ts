// ══════════════════════════════════════════════════════════════
// SHARED DATA & HELPERS – ERP Seem Semrac v2.0
// Spec : SPEC-ERP-GPAO-V1.8 / EN 9100:2018 / ISO 9001:2015
// ══════════════════════════════════════════════════════════════

export const APP_VERSION = 'v2.0 – SPEC-ERP-GPAO-V1.8'

// Échappement HTML COMPLET (5 remplacements) — helper unique du dépôt (sûr en contenu texte ET en attribut).
// Auparavant redéclaré à l'identique dans 15 pages service ; centralisé ici pour éviter toute dérive d'échappement.
export const escX = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

// ─── VALIDATION DIRECTION : rebouclage vers l'enregistrement d'origine ────────
// La décision Direction vit dans la table `validations` (statut valide/refuse/en_attente,
// + decided_by/decided_at/commentaire, + ref_table/ref_id vers l'objet source).
// On indexe ces lignes par (ref_table, ref_id) pour pouvoir afficher, DANS chaque liste
// d'origine, un badge « Direction : validé / refusé / en attente ». Sans migration.
export function buildValDirMap(validations: any[]): Record<string, any> {
  const m: Record<string, any> = {}
  for (const v of (Array.isArray(validations) ? validations : [])) {
    if (!v || !v.ref_table || v.ref_id == null || v.ref_id === '') continue
    const key = String(v.ref_table) + '::' + String(v.ref_id)
    if (!m[key]) m[key] = v   // getValidations() trie par created_at desc → on garde la plus récente
  }
  return m
}
// Mode de refus (stocké dans validations.payload.refus_mode) : 'annulation' (annulation
// totale) ou 'revision' (renvoi en révision — défaut). Helper unique pour le lire.
export function refusMode(v: any): 'annulation' | 'revision' {
  const m = v && v.payload && (typeof v.payload === 'string' ? safeJson(v.payload) : v.payload)
  return (m && m.refus_mode === 'annulation') ? 'annulation' : 'revision'
}
function safeJson(s: string): any { try { return JSON.parse(s) } catch { return null } }

// Rend le badge de décision Direction pour l'objet (table, id) — chaîne vide si jamais soumis.
export function valDirBadge(map: Record<string, any>, table: string, id: any): string {
  if (!map || id == null) return ''
  const v = map[String(table) + '::' + String(id)]
  if (!v) return ''
  const st = v.statut || 'en_attente'
  const annul = st === 'refuse' && refusMode(v) === 'annulation'
  const cfg = st === 'valide'
    ? { bg: '#dcfce7', col: '#15803d', ic: 'fa-check', txt: 'Direction ✓' }
    : st === 'refuse'
    ? (annul
        ? { bg: '#fee2e2', col: '#b91c1c', ic: 'fa-ban', txt: 'Direction ✗ Annulé' }
        : { bg: '#ffedd5', col: '#c2410c', ic: 'fa-pen', txt: 'Direction ✎ Révision' })
    : { bg: '#fef3c7', col: '#92400e', ic: 'fa-hourglass-half', txt: 'Direction …' }
  const decLbl = st === 'valide' ? 'Validé' : st === 'refuse' ? (annul ? 'Refusé (annulation totale)' : 'Refusé (renvoi en révision)') : 'En attente'
  const tip = st === 'en_attente'
    ? 'En attente de validation de la Direction'
    : `${decLbl} par ${v.decided_by || 'Direction'}${v.decided_at ? ' le ' + String(v.decided_at).slice(0, 10) : ''}${v.commentaire ? ' — ' + v.commentaire : ''}`
  return `<span title="${escX(tip)}" style="display:inline-flex;align-items:center;gap:3px;background:${cfg.bg};color:${cfg.col};border-radius:999px;padding:2px 8px;font-size:.62rem;font-weight:700;white-space:nowrap;"><i class="fas ${cfg.ic}"></i>${cfg.txt}</span>`
}

// ─── COÛT SOUS-TRAITANCE (forfait minimum + prix unitaire pièce) ──────────────
// Décision métier : pour une étape sous-traitée, le coût réel d'une commande de
// `qte` pièces = max(forfait minimum ; qte × prix unitaire pièce).
// Le forfait est donc un plancher de facturation indépendant de la quantité.
export function coutEtapeST(etape: { forfait_st_ht?: number; prix_unitaire_st_ht?: number; cout_st_unitaire?: number }, qte: number): number {
  const q = Math.max(0, Number(qte) || 0)
  const unit = Number(etape?.prix_unitaire_st_ht ?? etape?.cout_st_unitaire ?? 0) || 0
  const forfait = Number(etape?.forfait_st_ht ?? 0) || 0
  return Math.max(forfait, q * unit)
}

// ─── Décomposition d'UNE étape de gamme (SOURCE UNIQUE de vérité) ───────────────────────────────
// Renvoie, pour une étape, ses coûts (€) et temps (min) ventilés — utilisé À LA FOIS par
// `computeNomCostForQty` (agrégat CRU) ET par l'analyse DT (affichage « coût/pièce » + panneau
// « temps & coûts par poste »). Un seul point de calcul ⇒ le total par poste RÉCONCILIE toujours
// avec le CRU (moSerie+machineSerie+stOrder), sans dérive possible entre les deux chemins.
//   coûts : moPc/machPc = € variable/pièce (× q) ; moFixe/machFixe = € fixe/lot (réglage + op. fixe, compté 1×)
//   ST    : forfait/unit → coût = max(forfait ; q×unit) (JAMAIS moPc/machPc)
//   temps : reglageMin/moMin/machineMin (convention de computeNomCostForQty, pour reglageMinTotal…)
// ⚠ machine_taux_h = 0 signifie « pas de taux machine sur l'étape » ⇒ coût machine 0 (+ incrément OPEX
//   du poste via machineRate), et NON un repli sur le défaut nomenclature (piège de l'ancien `|| défaut`).
export function etapeDecomp(
  e: any,
  tauxMoDef: number,
  tauxMachDef: number,
  machineRate?: (machineId: string, baseRate: number) => number,
) {
  const mr = (mid: any, base: number): number => (machineRate && mid != null && mid !== '') ? machineRate(String(mid), base) : base
  const z = { st: false, forfait: 0, unit: 0, moPc: 0, machPc: 0, moFixe: 0, machFixe: 0, reglageMin: 0, moMin: 0, machineMin: 0 }
  if (!e) return z
  if (e.type === 'sous_traite') {
    return { ...z, st: true, forfait: Math.max(0, Number(e.forfait_st_ht ?? 0) || 0), unit: Number(e.prix_unitaire_st_ht ?? e.cout_st_unitaire ?? 0) || 0 }
  }
  if (e.temps_variable_mille != null || e.temps_reglage_mille != null || e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null) {
    // Étape importée : temps en MILLIÈMES d'heure → heures = millième / 1000
    const isMach = e.ressource === 'machine'
    const taux = isMach ? mr(e.machine_id, tauxMachDef) : tauxMoDef
    const varH = (Number(e.temps_variable_mille) || 0) / 1000
    const r = { ...z }
    // Réglage : deux temps distincts quand ils sont renseignés — ROP occupe l'opérateur,
    // RGM immobilise la machine, et un réglage occupe souvent LES DEUX simultanément.
    // Sans eux, on retombe sur le champ historique, imputé à la ressource de l'étape :
    // les nomenclatures déjà chiffrées gardent donc exactement le même coût.
    const aSplit = e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null
    let regH = 0
    if (aSplit) {
      const ropH = (Number(e.temps_reglage_op_mille) || 0) / 1000
      const rgmH = (Number(e.temps_reglage_machine_mille) || 0) / 1000
      r.moFixe += ropH * tauxMoDef
      r.machFixe += rgmH * mr(e.machine_id, tauxMachDef)
      regH = ropH + rgmH
    } else {
      regH = (Number(e.temps_reglage_mille) || 0) / 1000
      if (isMach) r.machFixe += regH * taux; else r.moFixe += regH * taux           // réglage = fixe / lot
    }
    if (e.est_fixe) { if (isMach) r.machFixe += varH * taux; else r.moFixe += varH * taux }  // opération fixe / lot
    else { if (isMach) r.machPc += varH * taux; else r.moPc += varH * taux }                 // opération variable / pièce
    r.reglageMin = regH * 60
    if (isMach) r.machineMin = varH * 60; else r.moMin = varH * 60
    return r
  }
  // Étape manuelle (minutes) — logique historique
  const tMo = Number(e.temps_mo_min ?? e.temps_unitaire_min ?? 0) || 0
  const tReg = Number(e.temps_reglage_min ?? 0) || 0            // ROP — réglage opérateur
  const tRegMach = Number(e.temps_reglage_machine_min ?? 0) || 0 // RGM — réglage machine
  const tMach = Number(e.temps_machine_min ?? ((e.machine_id || e.machine_taux_h) ? (e.temps_unitaire_min ?? 0) : 0)) || 0
  const tauxMo = Number(e.taux_mo_h ?? 0) || 0
  const tauxMach = mr(e.machine_id, Number(e.machine_taux_h ?? 0) || 0)   // machine : base étape + incrément OPEX poste (0 si non renseigné)
  return { ...z, moPc: tMo / 60 * tauxMo, machPc: tMach / 60 * tauxMach, moFixe: tReg / 60 * tauxMo, machFixe: tRegMach / 60 * tauxMach, reglageMin: tReg + tRegMach, moMin: tMo, machineMin: tMach }
}

// ─── Calcul complet du coût d'une nomenclature pour une quantité (pour l'analyse DT) ──────────
// Reprend la même logique que le formulaire BE : matière + accessoires + MO/(réglage)/machine internes
// + sous-traitance au forfait (max(forfait ; qté×unitaire)). Tout est calculé pour `qte` pièces.
export function computeNomCostForQty(
  nom: any,
  fournitures: any[],
  qte: number,
  opts?: { machineRate?: (machineId: string, baseRate: number) => number },
) {
  const q = Math.max(1, Number(qte) || 1)
  // Phase E : taux machine d'une étape = taux de base + incrément OPEX du POSTE de la machine (ou override),
  // appliqué par etapeDecomp via opts.machineRate. Sans machineRate (ou incrément 0) → CRU inchangé (non-régression).
  // Coût des fournitures en UNITÉS D'ACHAT ENTIÈRES, arrondi SUPÉRIEUR (on n'achète ni une demi-tôle ni un demi-paquet).
  //   Matière     : nb de TÔLES   = ceil(qté / nb_par_tole)            ; coût = nb de tôles   × prix de la tôle.
  //   Accessoires : nb de PAQUETS = ceil(nb par pièce × qté / qte_paquet) ; coût = nb de paquets × prix du paquet.
  //   Repli LINÉAIRE (prix_total_par_piece × qté) si les champs d'unité d'achat manquent (compat imports).
  let matiereSerieOnly = 0, accessoireSerie = 0
  for (const f of (fournitures || [])) {
    if (f && f.categorie === 'matiere') {
      const npt = Number(f.nb_par_tole) || 0          // nb de pièces par tôle
      const prixTole = Number(f.prix_unitaire) || 0   // prix d'une tôle
      if (npt > 0 && prixTole > 0) matiereSerieOnly += Math.ceil(q / npt) * prixTole   // tôles entières
      else matiereSerieOnly += (Number(f.prix_total_par_piece) || 0) * q               // repli linéaire
      continue
    }
    const qpp = Number(f?.quantite_par_piece) || 0   // nb d'accessoires par pièce
    const qtePaq = Number(f?.qte_paquet) || 0        // nb d'accessoires par paquet
    const prixPaq = Number(f?.prix_unitaire) || 0    // prix d'un paquet
    if (qpp > 0 && qtePaq > 0 && prixPaq > 0) accessoireSerie += Math.ceil((qpp * q) / qtePaq) * prixPaq   // paquets entiers
    else accessoireSerie += (Number(f?.prix_total_par_piece) || 0) * q   // repli linéaire
  }
  const matiere = matiereSerieOnly / q               // ramené à la pièce (baisse par paliers quand la qté monte)
  const accessoire = accessoireSerie / q             // idem (amorti du paquet)
  const etapes = Array.isArray(nom?.etapes_production) ? nom.etapes_production : []
  const tauxMoDef = Number(nom?.taux_mo) || 45
  const tauxMachDef = Number(nom?.cout_machine_h) || 50
  let moPiece = 0, machinePiece = 0, reglageMin = 0, moMin = 0, machineMin = 0, stOrder = 0
  let moFixeSerie = 0, machFixeSerie = 0   // temps fixes par lot (réglage + opérations fixes), en €
  for (const e of etapes) {
    const d = etapeDecomp(e, tauxMoDef, tauxMachDef, opts?.machineRate)   // décomposition par étape (source UNIQUE partagée avec l'analyse DT)
    if (d.st) { stOrder += coutEtapeST(e, q); continue }
    moPiece += d.moPc; machinePiece += d.machPc; moFixeSerie += d.moFixe; machFixeSerie += d.machFixe
    reglageMin += d.reglageMin; moMin += d.moMin; machineMin += d.machineMin
  }
  const matierePiece = matiere + accessoire
  const matiereSerie = matiereSerieOnly + accessoireSerie   // matière (tôles entières) + accessoires (paquets entiers)
  const moSerie = moPiece * q + moFixeSerie
  const machineSerie = machinePiece * q + machFixeSerie
  const totalSerie = matiereSerie + moSerie + machineSerie + stOrder
  const r2 = (n: number) => Math.round(n * 100) / 100
  const r4 = (n: number) => Math.round(n * 10000) / 10000
  return {
    qte: q,
    matiere: r2(matiere), accessoire: r2(accessoire), matierePiece: r4(matierePiece),
    moPiece: r4(moPiece), machinePiece: r4(machinePiece),
    reglageMinTotal: reglageMin, moMinTotal: moMin, machineMinTotal: machineMin,
    matiereSerie: r2(matiereSerie), moSerie: r2(moSerie), machineSerie: r2(machineSerie),
    accessoireSerie: r2(accessoireSerie), matiereLineaireSerie: r2(matiereSerieOnly),   // matière seule (tôles entières), hors accessoires
    stOrder: r2(stOrder),
    totalSerie: r2(totalSerie), perPiece: r4(q > 0 ? totalSerie / q : totalSerie),
    prixRevientUnitaireNom: nom?.prix_revient_unitaire != null ? Number(nom.prix_revient_unitaire) : null,
  }
}

// ─── Taux horaire effectif d'un POSTE (Phase E : OPEX poste → taux → CRU) ──────────────────────
// Le POSTE est l'unité de coût : l'OPEX (achats machine reçus, année civile) de ses machines est amorti
// sur ses heures productives BUDGÉTÉES (Σ capacité × 220 jours ouvrés) → un INCRÉMENT €/h commun à toutes
// ses machines, AJOUTÉ au taux de base de chaque étape machine. Garantit la non-régression : l'incrément
// vaut 0 tant qu'aucun achat machine n'est reçu, donc le CRU d'une pièce sans achat machine est inchangé.
// Un taux manuel (postes.taux_horaire_manuel) prime en ABSOLU s'il est posé (override + confirmation côté UI),
// et se réinitialise au nouvel exercice (colonne remise à null).
export const HEURES_JOURS_OUVRES = 220
export function computePosteRates(machines: any[] = [], machinesOpex: any[] = [], postes: any[] = [], annee?: number) {
  const an = Number(annee) || new Date().getFullYear()
  // Achats machine reçus (colonne DÉDIÉE `achats_ht`, JAMAIS `cout_total_ht`), cumulés par machine, POUR
  // L'EXERCICE (année civile). `cout_total_ht` = OPEX annuel complet (Maintenance/Finances) ⇒ ne PAS le mélanger ici,
  // sinon une ligne d'OPEX pré-existante gonflerait le taux sans aucun achat (violation de la non-régression).
  const achatByMachine: Record<string, number> = {}
  for (const o of (machinesOpex || [])) {
    if (Number(o?.annee) !== an) continue
    const k = String(o.machine_id)
    achatByMachine[k] = (achatByMachine[k] || 0) + (Number(o.achats_ht) || 0)
  }
  const posteById: Record<string, any> = {}
  for (const p of (postes || [])) posteById[String(p.id)] = p
  // Taux horaire (cout_h) de CHAQUE machine (avec ou sans poste) → base du coût machine du CRU.
  const coutHByMachine: Record<string, number> = {}
  for (const m of (machines || [])) coutHByMachine[String((m as any).id)] = Number((m as any).cout_h ?? (m as any).taux_horaire) || 0
  const agg: Record<string, { heures: number; achat: number; baseAnnual: number; machines: string[] }> = {}
  for (const m of (machines || [])) {
    const pid = (m as any).poste_id ? String((m as any).poste_id) : ''
    if (!pid) continue
    const e = agg[pid] = agg[pid] || { heures: 0, achat: 0, baseAnnual: 0, machines: [] }
    const capa = Number((m as any).capacite_h) || 0
    const coutH = Number((m as any).cout_h ?? (m as any).taux_horaire) || 0
    e.heures += capa * HEURES_JOURS_OUVRES
    e.baseAnnual += coutH * capa * HEURES_JOURS_OUVRES
    e.achat += achatByMachine[String((m as any).id)] || 0
    e.machines.push(String((m as any).id))
  }
  const byPoste: Record<string, { heures: number; achat: number; baseWeighted: number; increment: number; manuel: number | null; tauxEffectif: number; machines: string[] }> = {}
  const byMachine: Record<string, { pid: string; increment: number; manuel: number | null; coutH: number }> = {}
  for (const pid of Object.keys(agg)) {
    const e = agg[pid]
    const p = posteById[pid] || {}
    const increment = e.heures > 0 ? e.achat / e.heures : 0        // €/h supplémentaire dû aux achats machine reçus
    const baseWeighted = e.heures > 0 ? e.baseAnnual / e.heures : 0 // taux de base indicatif (moyenne pondérée cout_h)
    const rawManuel = (p as any).taux_horaire_manuel
    const manuel = (rawManuel != null && rawManuel !== '' && !isNaN(Number(rawManuel))) ? Number(rawManuel) : null
    const tauxEffectif = manuel != null ? manuel : baseWeighted + increment
    byPoste[pid] = { heures: e.heures, achat: e.achat, baseWeighted, increment, manuel, tauxEffectif, machines: e.machines }
    for (const mid of e.machines) byMachine[mid] = { pid, increment, manuel, coutH: coutHByMachine[mid] ?? 0 }
  }
  // Closure passée à computeNomCostForQty : taux horaire de LA MACHINE (cout_h) + incrément OPEX du poste (ou override absolu).
  // Le coût machine du CRU suit le taux de la machine du process choisi ; `baseRate` (taux stocké sur l'étape) ne sert
  // plus que de repli si la machine n'est pas rattachée à un poste (donc absente de byMachine).
  const machineRate = (machineId: string, baseRate: number): number => {
    const r = byMachine[String(machineId)]
    const coutH = coutHByMachine[String(machineId)] || 0
    if (!r) return coutH > 0 ? coutH : baseRate       // machine sans poste : son cout_h seul (aucun incrément OPEX)
    if (r.manuel != null) return r.manuel             // override manuel du poste : prime en absolu
    return (r.coutH || coutH || baseRate) + r.increment   // cout_h de la machine + incrément OPEX du poste
  }
  return { byPoste, byMachine, machineRate, annee: an }
}

// ─── OPÉRATIONS PAR ACTIVITÉ ──────────────────────────────────
export const OPS_SEMRAC = [
  'Poinçonnage / Laser','Ébavurage','Pliage','Montage',
  'Soudure TIG/MIG/MAG','Fraisage / Taraudage','Ponçage',
  'Sérigraphie','Emballage SEMRAC'
]
export const OPS_SEEM = [
  'Tronçonnage','Usinage CN','Ébavurage','Thermocollage',
  'Oxydation anodique sulfurique','Emballage SEEM'
]

// ─── OPÉRATEURS ───────────────────────────────────────────────
export const OPERATEURS = [
  { id:'op1', nom:'Antoine D.',    prenom:'Antoine',  activite:'Seem',   poste:'Usinage CN1',     shift:'matin',    competences:['Tronçonnage','Usinage CN','Ébavurage'],                              habilitations:['Product Safety Awareness','Counterfeit Prevention'], niveau:{} },
  { id:'op2', nom:'Karim B.',      prenom:'Karim',    activite:'Seem',   poste:'Usinage CN2',     shift:'matin',    competences:['Usinage CN','Ébavurage','Emballage SEEM'],                          habilitations:['Product Safety Awareness'], niveau:{} },
  { id:'op3', nom:'Isabelle R.',   prenom:'Isabelle', activite:'Seem',   poste:'Contrôle',        shift:'journee',  competences:['Thermocollage','Oxydation anodique sulfurique','Emballage SEEM'],    habilitations:['Product Safety Awareness','Counterfeit Prevention'], niveau:{} },
  { id:'op4', nom:'Marc T.',       prenom:'Marc',     activite:'Semrac', poste:'Presse / Laser',  shift:'matin',    competences:['Poinçonnage / Laser','Ébavurage','Pliage'],                          habilitations:['Product Safety Awareness'], niveau:{} },
  { id:'op5', nom:'Sophie L.',     prenom:'Sophie',   activite:'Semrac', poste:'Pliage',          shift:'matin',    competences:['Pliage','Montage','Ébavurage'],                                       habilitations:['Product Safety Awareness'], niveau:{} },
  { id:'op6', nom:'Julien M.',     prenom:'Julien',   activite:'Semrac', poste:'Soudure',         shift:'apmidi',   competences:['Soudure TIG/MIG/MAG','Montage','Fraisage / Taraudage'],              habilitations:['Product Safety Awareness','Counterfeit Prevention'], niveau:{} },
  { id:'op7', nom:'Nadia K.',      prenom:'Nadia',    activite:'Semrac', poste:'Montage',         shift:'apmidi',   competences:['Montage','Ponçage','Sérigraphie','Emballage SEMRAC'],                 habilitations:['Product Safety Awareness'], niveau:{} },
  { id:'op8', nom:'Frédéric G.',   prenom:'Frédéric', activite:'Seem',   poste:'Tour CNC',        shift:'matin',    competences:['Tronçonnage','Usinage CN','Fraisage / Taraudage'],                   habilitations:['Product Safety Awareness','Counterfeit Prevention'], niveau:{} },
]

// ─── SHIFTS ───────────────────────────────────────────────────
export const SHIFTS: Record<string,{label:string;start:number;end:number;color:string;icon:string}> = {
  matin:   { label:'Matin',       start:6,  end:14, color:'#3b82f6', icon:'fa-sun' },
  apmidi:  { label:'Après-midi',  start:14, end:22, color:'#8b5cf6', icon:'fa-cloud-sun' },
  soir:    { label:'Soirée/Nuit', start:22, end:30, color:'#0f172a', icon:'fa-moon' },
  journee: { label:'Journée',     start:7,  end:17, color:'#10b981', icon:'fa-briefcase' },
}

// ─── ABSENCES SIMULÉES ────────────────────────────────────────
export const ABSENCES: Record<string,{type:string;dates:string[]}> = {
  op3: { type:'Congé payé',   dates:['2026-03-10','2026-03-11','2026-03-12'] },
  op6: { type:'Maladie',      dates:['2026-03-09','2026-03-10'] },
}

// ─── MACHINES / POSTES DE TRAVAIL ────────────────────────────
export const MACHINES = [
  // Seem
  { id:'m1',  nom:'Tour CNC Mazak',       code:'CNC-01', activite:'Seem',   categorie:'Usinage',    operations:['Usinage CN','Tronçonnage'],                       shift:'matin',   capacite_h:8,  statut:'operationnel', couleur:'#3b82f6' },
  { id:'m2',  nom:'Centre Usinage Fanuc', code:'CNC-02', activite:'Seem',   categorie:'Usinage',    operations:['Usinage CN','Fraisage / Taraudage'],               shift:'matin',   capacite_h:8,  statut:'operationnel', couleur:'#0ea5e9' },
  { id:'m3',  nom:'Tronçonneuse Kasto',   code:'TRN-01', activite:'Seem',   categorie:'Débit',      operations:['Tronçonnage'],                                     shift:'matin',   capacite_h:8,  statut:'operationnel', couleur:'#06b6d4' },
  { id:'m4',  nom:'Poste Thermocollage',  code:'THC-01', activite:'Seem',   categorie:'Assemblage', operations:['Thermocollage'],                                   shift:'journee', capacite_h:10, statut:'operationnel', couleur:'#10b981' },
  { id:'m5',  nom:'Bain Oxydation OAS',   code:'OAS-01', activite:'Seem',   categorie:'Traitement', operations:['Oxydation anodique sulfurique'],                   shift:'journee', capacite_h:10, statut:'maintenance',  couleur:'#f59e0b' },
  // Semrac
  { id:'m6',  nom:'Laser Trumpf 3030',    code:'LSR-01', activite:'Semrac', categorie:'Découpe',    operations:['Poinçonnage / Laser'],                             shift:'matin',   capacite_h:8,  statut:'operationnel', couleur:'#ec4899' },
  { id:'m7',  nom:'Presse Plieuse Amada', code:'PLI-01', activite:'Semrac', categorie:'Pliage',     operations:['Pliage'],                                          shift:'matin',   capacite_h:8,  statut:'operationnel', couleur:'#a855f7' },
  { id:'m8',  nom:'Poste Soudure TIG',    code:'SOU-01', activite:'Semrac', categorie:'Soudure',    operations:['Soudure TIG/MIG/MAG'],                             shift:'apmidi',  capacite_h:8,  statut:'operationnel', couleur:'#f97316' },
  { id:'m9',  nom:'Poste Soudure MIG',    code:'SOU-02', activite:'Semrac', categorie:'Soudure',    operations:['Soudure TIG/MIG/MAG'],                             shift:'matin',   capacite_h:8,  statut:'arret',        couleur:'#ef4444' },
  { id:'m10', nom:'Table Montage A',      code:'MON-01', activite:'Semrac', categorie:'Montage',    operations:['Montage','Ébavurage','Ponçage'],                   shift:'apmidi',  capacite_h:8,  statut:'operationnel', couleur:'#8b5cf6' },
  { id:'m11', nom:'Poste Sérigraphie',    code:'SER-01', activite:'Semrac', categorie:'Finition',   operations:['Sérigraphie','Ponçage'],                           shift:'matin',   capacite_h:8,  statut:'operationnel', couleur:'#14b8a6' },
  { id:'m12', nom:'Zone Emballage',       code:'EMB-01', activite:'both',   categorie:'Logistique', operations:['Emballage SEEM','Emballage SEMRAC'],               shift:'journee', capacite_h:10, statut:'operationnel', couleur:'#64748b' },
]

// ─── BDT SIMULÉS ──────────────────────────────────────────────
export const BDT_DATA = [
  { id:'BDT-091', op:'op1', machine:'m1',  cmd:'CMD-2026-081', lot:'LOT-2026-091', client:'Legrand',   piece:'DISSIP-A24',  operation:'Usinage CN',              duree:2.5, debut:6,   priorite:'urgent',   statut:'recu',       activite:'Seem',   baseline:'BL-2026-031', matiere_ok:true,  pv_requis:true  },
  { id:'BDT-092', op:'op2', machine:'m2',  cmd:'CMD-2026-082', lot:'LOT-2026-092', client:'Bosch',     piece:'DISSIP-B11',  operation:'Ébavurage',               duree:1.5, debut:6,   priorite:'normal',   statut:'recu',       activite:'Seem',   baseline:'BL-2026-031', matiere_ok:true,  pv_requis:false },
  { id:'BDT-093', op:'op4', machine:'m6',  cmd:'CMD-2026-083', lot:'LOT-2026-093', client:'Valeo',     piece:'TOLE-C07',    operation:'Poinçonnage / Laser',     duree:3.0, debut:6,   priorite:'critique', statut:'recu',       activite:'Semrac', baseline:'BL-2026-032', matiere_ok:false, pv_requis:true  },
  { id:'BDT-094', op:'op5', machine:'m7',  cmd:'CMD-2026-084', lot:'LOT-2026-094', client:'Faurecia',  piece:'SUPPORT-D4',  operation:'Pliage',                  duree:2.0, debut:6,   priorite:'normal',   statut:'programme',  activite:'Semrac', baseline:'BL-2026-032', matiere_ok:true,  pv_requis:false },
  { id:'BDT-095', op:'op1', machine:'m3',  cmd:'CMD-2026-085', lot:'LOT-2026-095', client:'Schneider', piece:'DISSIP-E11',  operation:'Tronçonnage',             duree:1.0, debut:8.5, priorite:'normal',   statut:'programme',  activite:'Seem',   baseline:'BL-2026-033', matiere_ok:true,  pv_requis:false },
  { id:'BDT-096', op:'op4', machine:'m7',  cmd:'CMD-2026-086', lot:'LOT-2026-096', client:'Renault',   piece:'TOLE-F03',    operation:'Pliage',                  duree:2.0, debut:9,   priorite:'urgent',   statut:'programme',  activite:'Semrac', baseline:'BL-2026-032', matiere_ok:true,  pv_requis:false },
  { id:'BDT-097', op:'op6', machine:'m8',  cmd:'CMD-2026-087', lot:'LOT-2026-097', client:'Legrand',   piece:'CHASSIS-G2',  operation:'Soudure TIG/MIG/MAG',    duree:4.0, debut:14,  priorite:'normal',   statut:'programme',  activite:'Semrac', baseline:'BL-2026-034', matiere_ok:true,  pv_requis:true  },
  { id:'BDT-098', op:'op7', machine:'m10', cmd:'CMD-2026-088', lot:'LOT-2026-098', client:'Valeo',     piece:'SUPPORT-H1',  operation:'Montage',                 duree:3.0, debut:14,  priorite:'urgent',   statut:'programme',  activite:'Semrac', baseline:'BL-2026-034', matiere_ok:true,  pv_requis:false },
  { id:'BDT-099', op:'op3', machine:'m4',  cmd:'CMD-2026-089', lot:'LOT-2026-099', client:'Bosch',     piece:'DISSIP-I09',  operation:'Thermocollage',           duree:2.0, debut:7,   priorite:'normal',   statut:'programme',  activite:'Seem',   baseline:'BL-2026-033', matiere_ok:true,  pv_requis:false },
  { id:'BDT-100', op:'op8', machine:'m2',  cmd:'CMD-2026-090', lot:'LOT-2026-100', client:'Faurecia',  piece:'PIECE-J05',   operation:'Fraisage / Taraudage',    duree:3.5, debut:6,   priorite:'critique', statut:'recu',       activite:'Seem',   baseline:'BL-2026-033', matiere_ok:true,  pv_requis:true  },
  { id:'BDT-101', op:'op2', machine:'m12', cmd:'CMD-2026-091', lot:'LOT-2026-101', client:'Schneider', piece:'DISSIP-K14',  operation:'Emballage SEEM',          duree:1.0, debut:7.5, priorite:'normal',   statut:'programme',  activite:'Seem',   baseline:'BL-2026-031', matiere_ok:true,  pv_requis:false },
  { id:'BDT-102', op:'op5', machine:'m10', cmd:'CMD-2026-092', lot:'LOT-2026-102', client:'Renault',   piece:'TOLE-L22',    operation:'Ébavurage',               duree:1.5, debut:8,   priorite:'normal',   statut:'programme',  activite:'Semrac', baseline:'BL-2026-032', matiere_ok:true,  pv_requis:false },
  { id:'BDT-ST1', op:'ST',  machine:null,  cmd:'CMD-2026-093', lot:'LOT-2026-103', client:'Legrand',   piece:'PIECE-OXY',   operation:'Oxydation anodique sulfurique', duree:8.0, debut:6, priorite:'normal', statut:'st',        activite:'Seem',   baseline:'BL-2026-033', matiere_ok:true,  pv_requis:false },
  { id:'BDT-ST2', op:'ST',  machine:null,  cmd:'CMD-2026-094', lot:'LOT-2026-104', client:'Valeo',     piece:'PIECE-SER',   operation:'Sérigraphie',             duree:8.0, debut:6,   priorite:'urgent',   statut:'st',         activite:'Semrac', baseline:'BL-2026-032', matiere_ok:true,  pv_requis:false },
  { id:'BDT-103', op:'pending', machine:null, cmd:'CMD-2026-095', lot:'LOT-2026-105', client:'Airbus', piece:'BRACKET-M1', operation:'Usinage CN',              duree:3.0, debut:6,   priorite:'critique', statut:'a_programmer', activite:'Seem', baseline:'BL-2026-035', matiere_ok:false, pv_requis:true },
]

// ─── SIDEBAR COMMUNE (style monochrome épuré, accent orange actif) ─
const SIDEBAR_ITEMS: Array<{ href: string; icon: string; label: string; active: string; svc?: string }> = [
  { href: '/',                     icon: 'fa-home',              label: 'Accueil',       active: 'home' },
  { href: '/dashboard',            icon: 'fa-gauge-high',        label: 'Tableaux de bord', active: 'dashboard-hub', svc: '' },   // hub visible par tous ; chaque tableau reste filtré par son propre service
  { href: '/commercial/service',   icon: 'fa-briefcase',         label: 'Commercial',    active: 'service-commercial' },
  { href: '/be/service',           icon: 'fa-drafting-compass',  label: 'Bureau Études', active: 'be-service' },
  { href: '/achats/service',       icon: 'fa-shopping-cart',     label: 'Achats',        active: 'achats-service' },
  { href: '/production/service',   icon: 'fa-cogs',              label: 'Production',    active: 'service-prod' },
  { href: '/oas/service',          icon: 'fa-flask',             label: 'OAS',           active: 'service-oas' },
  { href: '/qualite/service',      icon: 'fa-shield-alt',        label: 'Qualité',       active: 'service-qualite' },
  { href: '/securite/service',     icon: 'fa-helmet-safety',     label: 'Sécurité',      active: 'service-securite' },
  { href: '/environnement/service', icon: 'fa-leaf',             label: 'Environnement', active: 'service-environnement' },
  { href: '/expeditions/service',  icon: 'fa-truck',             label: 'Expéditions',   active: 'service-expeditions' },
  { href: '/stock/service',        icon: 'fa-warehouse',         label: 'Stocks',        active: 'service-stock' },
  { href: '/maintenance/service',  icon: 'fa-wrench',            label: 'Maintenance',   active: 'service-maintenance' },
  { href: '/plans/service',        icon: 'fa-building',          label: 'Plan / Bâtiment', active: 'service-plans' },
  { href: '/rh/service',           icon: 'fa-users',             label: 'RH',            active: 'service-rh' },
  { href: '/compta/service',       icon: 'fa-calculator',        label: 'Comptabilité',  active: 'service-compta' },
  { href: '/direction/service',    icon: 'fa-chart-line',        label: 'Direction',     active: 'service-direction' },
]

// ─── Logo Seem Semrac (SVG inline, couleurs de marque) ────────
export const seemMark = (s = 34) => `<svg width="${s}" height="${s}" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;display:block;"><rect x="2" y="8" width="62" height="62" rx="7" fill="#8FD0EE"/><rect x="18" y="24" width="48" height="48" rx="5" fill="#29ABE2"/><rect x="2" y="52" width="18" height="18" fill="#16181d"/></svg>`
export const seemLogo = (h = 64) => `<svg height="${h}" viewBox="0 0 360 130" xmlns="http://www.w3.org/2000/svg" style="display:block;"><rect x="2" y="14" width="74" height="74" rx="8" fill="#8FD0EE"/><rect x="20" y="32" width="56" height="56" rx="6" fill="#29ABE2"/><rect x="2" y="66" width="20" height="20" fill="#16181d"/><text x="92" y="58" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="50" fill="#5B4E9A">Seem</text><text x="92" y="112" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="50" fill="#1E3A8F">Semrac</text></svg>`

export const SIDEBAR_V2 = (active = '') => `
<aside id="erpSidebar" style="width:236px;min-height:100vh;flex-shrink:0;display:flex;flex-direction:column;background:linear-gradient(180deg,#0e6ba8 0%,#0a3f63 100%);position:sticky;top:0;height:100vh;overflow-y:auto;border-right:1px solid rgba(255,255,255,.08);">
  <div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.12);flex-shrink:0;display:flex;align-items:center;gap:10px;">
    ${seemMark(34)}
    <div style="min-width:0;">
      <div style="font-weight:800;font-size:.82rem;color:white;letter-spacing:-.01em;">Seem Semrac</div>
      <div style="font-size:.6rem;color:#9fd4ec;">ERP v2.0 <span style="font-size:.55rem;padding:0 5px;border-radius:999px;background:rgba(16,185,129,.15);color:#6ee7b7;font-weight:800;">EN9100</span></div>
    </div>
    <button onclick="erpToggleSidebar()" id="erpSidebarHide" title="Replier le menu (utiliser toute la largeur)" aria-label="Replier le menu" style="margin-left:auto;flex-shrink:0;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);border-radius:7px;width:30px;height:30px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;padding:0;">
      <span style="display:block;width:14px;height:2px;background:#cdeaf8;border-radius:2px;"></span>
      <span style="display:block;width:14px;height:2px;background:#cdeaf8;border-radius:2px;"></span>
      <span style="display:block;width:14px;height:2px;background:#cdeaf8;border-radius:2px;"></span>
    </button>
  </div>
  <nav style="flex:1;padding:10px 8px;font-size:.84rem;overflow-y:auto;display:flex;flex-direction:column;gap:2px;">
    ${SIDEBAR_ITEMS.map(it => {
      const on = active === it.active
      return `<a href="${it.href}" data-svc="${it.svc !== undefined ? it.svc : (it.href === '/' ? '' : it.href.split('/')[1])}" class="sb-link${on?' active':''}" style="display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:6px;color:${on?'white':'#cdeaf8'};background:${on?'rgba(255,255,255,.18)':'transparent'};text-decoration:none;font-weight:${on?'700':'500'};border-left:3px solid ${on?'#f97316':'transparent'};transition:all .15s;position:relative;">
        <i class="fas ${it.icon}" style="color:${on?'#fb923c':'#7dd3fc'};width:18px;text-align:center;flex-shrink:0;font-size:.95rem;"></i>
        <span>${it.label}</span>
      </a>`
    }).join('')}
  </nav>
  <div style="padding:10px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0;">
    <div id="sb-userbox" style="display:none;align-items:center;gap:9px;padding:8px 12px;margin-bottom:8px;background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.18);border-radius:8px;">
      <i class="fas fa-circle-user" style="color:#7dd3fc;font-size:1.15rem;"></i>
      <div style="min-width:0;flex:1;">
        <div id="sb-username" style="font-size:.74rem;font-weight:700;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
        <div id="sb-userrole" style="font-size:.58rem;color:#94a3b8;text-transform:capitalize;"></div>
      </div>
      <a href="/logout" title="Déconnexion" style="color:#fca5a5;text-decoration:none;font-size:.95rem;flex-shrink:0;"><i class="fas fa-right-from-bracket"></i></a>
    </div>
    <a href="/manuels" data-svc="" title="Mode d'emploi de l'ERP — les manuels de vos services" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:6px;background:rgba(139,92,246,.16);color:#c4b5fd;font-weight:700;font-size:.78rem;text-decoration:none;transition:all .15s;margin-bottom:8px;${active === 'manuels' ? 'box-shadow:inset 0 0 0 1px rgba(196,181,253,.55);' : ''}">
      <i class="fas fa-book-open" style="width:18px;text-align:center;"></i>Manuels d'utilisation
    </a>
    <a href="/rh/pointage" data-svc="" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:6px;background:rgba(14,165,233,.14);color:#7dd3fc;font-weight:700;font-size:.78rem;text-decoration:none;transition:all .15s;">
      <i class="fas fa-fingerprint" style="width:18px;text-align:center;"></i>Système de pointage
    </a>
    <div style="font-size:.58rem;color:#7fb8d6;text-align:center;margin-top:8px;">${APP_VERSION}</div>
  </div>
</aside>
<style>
  .sb-link:hover:not(.active){background:rgba(255,255,255,.12)!important;color:#ffffff!important;}
</style>
<script>
(function(){
  fetch('/api/me').then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok||!j.user) return;
    var u=j.user, nav=Array.isArray(j.nav)?j.nav:[];
    // Masque tout service que le rôle ne peut PAS lire (data-svc absent de la nav).
    // Les liens sans data-svc (Accueil, Pointage) restent toujours visibles.
    document.querySelectorAll('[data-svc]').forEach(function(el){
      var s=el.getAttribute('data-svc'); if(!s) return;
      if(nav.indexOf(s)<0) el.style.display='none';
    });
    var box=document.getElementById('sb-userbox'); if(box) box.style.display='flex';
    var nm=document.getElementById('sb-username'); if(nm) nm.textContent=u.nom||'';
    var rl=document.getElementById('sb-userrole'); if(rl) rl.textContent=u.role||'';
  }).catch(function(){});
})();
</script>`

// ─── LAYOUT PRINCIPAL ─────────────────────────────────────────
export const layout = (title: string, content: string, active = '', extraHead = '') => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} · ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    *{font-family:'Inter',sans-serif;box-sizing:border-box;}
    body{background:#f1f5f9;}
    .card{background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 8px 24px rgba(0,0,0,.05);}
    .form-label{display:block;font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;}
    .form-input{width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.85rem;color:#374151;background:#f8fafc;outline:none;transition:border-color .2s,box-shadow .2s;}
    .form-input:focus{border-color:#3b82f6;background:white;box-shadow:0 0 0 3px rgba(59,130,246,.12);}
    .btn{display:inline-flex;align-items:center;gap:.5rem;padding:.5rem 1.2rem;border-radius:10px;font-weight:700;font-size:.83rem;cursor:pointer;transition:all .2s;border:none;}
    .btn-primary{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;box-shadow:0 2px 8px rgba(59,130,246,.3);}
    .btn-primary:hover{transform:translateY(-1px);}
    .btn-success{background:linear-gradient(135deg,#22c55e,#16a34a);color:white;}
    .btn-danger{background:linear-gradient(135deg,#ef4444,#dc2626);color:white;}
    .btn-secondary{background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;}
    .badge{display:inline-flex;align-items:center;gap:.3rem;padding:2px 10px;border-radius:999px;font-size:.7rem;font-weight:700;}
    .badge-critique{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;}
    .badge-urgent{background:#fffbeb;color:#b45309;border:1px solid #fde68a;}
    .badge-normal{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;}
    .badge-info{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;}
    .badge-purple{background:#f5f3ff;color:#5b21b6;border:1px solid #ddd6fe;}
    .badge-gray{background:#f8fafc;color:#6b7280;border:1px solid #e2e8f0;}
    .after-box{background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:1rem;}
    .notif-banner{position:fixed;top:1rem;right:1rem;z-index:9000;max-width:380px;}
    .notif{background:white;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.15);padding:.9rem 1.1rem;border-left:4px solid;margin-bottom:.5rem;font-size:.8rem;animation:slideIn .3s ease;}
    .notif-ok{border-color:#22c55e;} .notif-warn{border-color:#f59e0b;} .notif-err{border-color:#ef4444;} .notif-info{border-color:#3b82f6;}
    @keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
    .section-title{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem;}
    .section-title::after{content:'';flex:1;height:1px;background:#f1f5f9;}
    .chip-mail{background:#ecfdf5;border:1px solid #6ee7b7;color:#065f46;border-radius:6px;padding:2px 9px;font-size:.72rem;font-weight:600;}
    .chip-doc{background:#fef3c7;border:1px solid #fcd34d;color:#92400e;border-radius:6px;padding:2px 9px;font-size:.72rem;font-weight:600;}
    .chip-action{background:#f3e8ff;border:1px solid #c4b5fd;color:#4c1d95;border-radius:6px;padding:2px 9px;font-size:.72rem;font-weight:600;}
    .chip-en9100{background:#1e3a5f;color:#93c5fd;border:1px solid #3b82f6;border-radius:6px;padding:2px 9px;font-size:.7rem;font-weight:700;}
    select.form-input option:disabled{color:#9ca3af;font-style:italic;}
  </style>
  ${extraHead}
</head>
<body style="min-height:100vh;display:flex;">
${SIDEBAR_V2(active)}
<!-- Bouton de réouverture, visible UNIQUEMENT menu replié (position fixe, au-dessus du contenu). -->
<button onclick="erpToggleSidebar()" id="erpSidebarShow" title="Afficher le menu" aria-label="Afficher le menu" style="display:none;position:fixed;top:10px;left:10px;z-index:8000;background:#0a3f63;border:1px solid rgba(255,255,255,.22);border-radius:8px;width:34px;height:34px;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;padding:0;box-shadow:0 3px 12px rgba(0,0,0,.28);">
  <span style="display:block;width:16px;height:2px;background:#cdeaf8;border-radius:2px;"></span>
  <span style="display:block;width:16px;height:2px;background:#cdeaf8;border-radius:2px;"></span>
  <span style="display:block;width:16px;height:2px;background:#cdeaf8;border-radius:2px;"></span>
</button>
<script>
  // Repli / affichage de la barre latérale — l'état est mémorisé (localStorage) et
  // appliqué AVANT le rendu du contenu pour éviter un clignotement au chargement.
  function erpApplySidebar(off){
    var a=document.getElementById('erpSidebar'), s=document.getElementById('erpSidebarShow');
    if(a) a.style.display = off ? 'none' : 'flex';
    if(s) s.style.display = off ? 'flex' : 'none';
  }
  function erpToggleSidebar(){
    var a=document.getElementById('erpSidebar');
    var off = !(a && a.style.display === 'none');
    try{ localStorage.setItem('erpSidebar', off ? 'off' : 'on'); }catch(e){}
    erpApplySidebar(off);
  }
  (function(){ var v='on'; try{ v=localStorage.getItem('erpSidebar')||'on'; }catch(e){} if(v==='off') erpApplySidebar(true); })();
</script>
<main style="flex:1;overflow-y:auto;min-width:0;">
  ${content}
</main>
<div class="notif-banner" id="notifBanner"></div>
<script>
function pushNotif(type,icon,msg,dur=5000){
  const b=document.getElementById('notifBanner');
  if(!b)return;
  const id='n'+Date.now();
  const d=document.createElement('div');
  d.id=id;d.className='notif notif-'+type;
  d.innerHTML='<i class="fas '+icon+' mr-2"></i>'+msg+' <button onclick="document.getElementById(\\''+id+'\\').remove()" style="float:right;background:none;border:none;cursor:pointer;color:#9ca3af;margin-left:8px;"><i class="fas fa-times"></i></button>';
  b.appendChild(d);
  setTimeout(()=>{const e=document.getElementById(id);if(e){e.style.transition='opacity .4s';e.style.opacity='0';setTimeout(()=>{const e2=document.getElementById(id);if(e2)e2.remove();},400);}},dur);
}
function confirmSend(msg){
  pushNotif('ok','fa-check-circle',msg||'Formulaire validé. Flux Power Automate déclenché.',6000);
}
// Rechargement FLUIDE (remplace location.reload()) : conserve la POSITION DE DÉFILEMENT à travers le rechargement
// (l'onglet actif est déjà préservé par le hash d'URL que reload() conserve). Plus de saut en haut de page / perte de contexte.
function softReload(){
  try{ sessionStorage.setItem('__erpScroll', JSON.stringify({ p: location.pathname, h: location.hash||'', y: (window.scrollY||document.documentElement.scrollTop||0), t: Date.now() })); }catch(e){}
  location.reload();
}
if(typeof window!=='undefined') window.softReload=softReload;
(function(){ try{
  var raw=sessionStorage.getItem('__erpScroll'); if(!raw) return; sessionStorage.removeItem('__erpScroll');
  var st=JSON.parse(raw); if(!st||st.p!==location.pathname||(Date.now()-(st.t||0))>15000) return;
  var doScroll=function(){ try{ window.scrollTo(0, st.y||0); }catch(e){} };
  if(document.readyState==='complete'){ setTimeout(doScroll,50); } else { window.addEventListener('load', function(){ setTimeout(doScroll,60); }); }
}catch(e){} })();
// Confirmation INTERNE à l'app (remplace window.confirm) — modale au design de l'ERP, renvoie une Promise<boolean>.
// Usage : if(!(await appConfirm('Message ?'))) return;  ·  danger auto si le message évoque une suppression.
function appConfirm(message, opts){
  opts = opts || {};
  return new Promise(function(resolve){
    var old = document.getElementById('appConfirmOverlay'); if(old) old.remove();
    var msgStr = String(message==null?'':message);
    var danger = (opts.danger!==undefined) ? !!opts.danger : /supprim|effac|irr[ée]vers|d[ée]finiti|retir|annul/i.test(msgStr);
    var accent = danger ? '#dc2626' : '#4338ca';
    var icon = opts.icon || (danger ? 'fa-triangle-exclamation' : 'fa-circle-question');
    var title = opts.title || (danger ? 'Confirmation requise' : 'Confirmer');
    var okLabel = opts.okLabel || (danger ? 'Confirmer' : 'Confirmer');
    var cancelLabel = opts.cancelLabel || 'Annuler';
    var safeMsg = msgStr.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br>');
    var ov = document.createElement('div');
    ov.id = 'appConfirmOverlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(3px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;';
    ov.innerHTML = "<div role='dialog' aria-modal='true' style='background:white;border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.28);width:100%;max-width:440px;overflow:hidden;'>"
      + "<div style='padding:16px 20px;display:flex;align-items:center;gap:11px;border-bottom:1px solid #f1f5f9;'>"
      +   "<span style='width:34px;height:34px;border-radius:50%;background:"+accent+"18;display:flex;align-items:center;justify-content:center;flex:none;'><i class='fas "+icon+"' style='color:"+accent+";'></i></span>"
      +   "<div style='font-weight:800;font-size:.95rem;color:#111827;'>"+title+"</div></div>"
      + "<div style='padding:18px 20px;font-size:.86rem;color:#374151;line-height:1.55;'>"+safeMsg+"</div>"
      + "<div style='padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:9px;'>"
      +   "<button id='appConfirmNo' type='button' style='padding:9px 16px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:700;cursor:pointer;font-size:.82rem;'>"+cancelLabel+"</button>"
      +   "<button id='appConfirmYes' type='button' style='padding:9px 18px;background:"+accent+";color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;font-size:.82rem;'>"+okLabel+"</button>"
      + "</div></div>";
    document.body.appendChild(ov);
    var onKey;
    var done = function(v){ try{ ov.remove(); }catch(e){} document.removeEventListener('keydown', onKey); resolve(v); };
    onKey = function(e){ if(e.key==='Escape') done(false); else if(e.key==='Enter') done(true); };
    document.getElementById('appConfirmYes').onclick = function(){ done(true); };
    document.getElementById('appConfirmNo').onclick = function(){ done(false); };
    ov.addEventListener('mousedown', function(e){ if(e.target===ov) done(false); });
    document.addEventListener('keydown', onKey);
    var y=document.getElementById('appConfirmYes'); if(y) y.focus();
  });
}
if(typeof window!=='undefined') window.appConfirm=appConfirm;
// Combobox recherchable AU DESIGN DE L'APP — améliore AUTOMATIQUEMENT tous les <input list="…datalist…"> :
// menu déroulant stylé + filtrage à la frappe + navigation clavier, en conservant l'onchange existant (on
// re-déclenche l'événement 'change' à la sélection). Non invasif : lit les <option> du datalist puis détache
// l'attribut list (supprime le menu natif). Chaque input ré-rendu est un nouvel élément → relu à son focus.
(function(){
  var panel=null, activeInput=null, hi=-1, items=[];
  function ensurePanel(){
    if(panel) return panel;
    panel=document.createElement('div');
    panel.id='appComboPanel';
    panel.style.cssText='position:fixed;z-index:99990;display:none;background:white;border:1.5px solid #e2e8f0;border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.16);max-height:264px;overflow:auto;font-size:.82rem;color:#334155;';
    document.body.appendChild(panel);
    panel.addEventListener('mousedown',function(e){ var it=e.target.closest('[data-cv]'); if(it){ e.preventDefault(); pick(it.getAttribute('data-cv')); } });
    return panel;
  }
  function optsOf(input){
    if(input._comboOpts) return input._comboOpts;
    var arr=[]; var lid=input.getAttribute('list');
    if(lid){ var dl=document.getElementById(lid); if(dl){ Array.prototype.forEach.call(dl.querySelectorAll('option'),function(o){ var v=(o.getAttribute('value')!=null)?o.getAttribute('value'):o.value; var lbl=(o.textContent||'').trim(); if(v==null) return; arr.push({v:String(v), l:(lbl&&lbl!==String(v))?(String(v)+' — '+lbl):String(v)}); }); } input.removeAttribute('list'); }
    input._comboOpts=arr; return arr;
  }
  function esc2(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function render(input){
    var all=optsOf(input); if(!all.length){ hide(); return; }
    var q=(input.value||'').toLowerCase().trim();
    items=all.filter(function(o){ return !q || (o.v+' '+o.l).toLowerCase().indexOf(q)>=0; }).slice(0,60);
    var p=ensurePanel();
    if(!items.length){ p.style.display='none'; activeInput=input; return; }
    hi=-1;
    p.innerHTML=items.map(function(o){ return "<div data-cv=\\""+esc2(o.v)+"\\" style='padding:7px 12px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-bottom:1px solid #f5f7fa;'>"+esc2(o.l)+"</div>"; }).join('');
    var r=input.getBoundingClientRect();
    p.style.left=r.left+'px'; p.style.top=(r.bottom+3)+'px'; p.style.minWidth=r.width+'px'; p.style.maxWidth=Math.max(r.width,360)+'px';
    p.style.display='block'; activeInput=input;
  }
  function pick(v){ if(!activeInput) return; var inp=activeInput; inp.value=v; hide();
    try{ inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true})); }
    catch(e){ var ev=document.createEvent('HTMLEvents'); ev.initEvent('change',true,false); inp.dispatchEvent(ev); }
    try{ inp.focus(); }catch(e){} }
  function hide(){ if(panel) panel.style.display='none'; activeInput=null; hi=-1; }
  function moveHi(d){ var p=panel; if(!p||p.style.display==='none'||!items.length) return; hi=(hi+d+items.length)%items.length; Array.prototype.forEach.call(p.children,function(c,i){ c.style.background=(i===hi)?'#eef2ff':''; if(i===hi&&c.scrollIntoView) c.scrollIntoView({block:'nearest'}); }); }
  document.addEventListener('focusin',function(e){ var t=e.target; if(t&&t.tagName==='INPUT'&&(t.getAttribute('list')||t._comboOpts)) render(t); });
  document.addEventListener('input',function(e){ if(e.target===activeInput) render(e.target); });
  document.addEventListener('keydown',function(e){ if(!activeInput||!panel||panel.style.display==='none') return; if(e.key==='ArrowDown'){ e.preventDefault(); moveHi(1); } else if(e.key==='ArrowUp'){ e.preventDefault(); moveHi(-1); } else if(e.key==='Enter'){ if(hi>=0&&items[hi]){ e.preventDefault(); pick(items[hi].v); } } else if(e.key==='Escape'){ hide(); } });
  document.addEventListener('focusout',function(e){ var t=e.target; if(t===activeInput) setTimeout(function(){ if(document.activeElement!==t) hide(); },150); });
  window.addEventListener('scroll',function(){ if(activeInput) hide(); }, true);
  window.addEventListener('resize',function(){ if(activeInput) hide(); });
})();
// Envoie une demande à la file de validation Direction (si la case est cochée).
// checkboxId : id de la case ; info : { type, objet, montant?, priorite?, ref_table?, ref_id?, entite? }
function submitValidation(domaine, checkboxId, info){
  var cb=document.getElementById(checkboxId);
  if(!cb||!cb.checked) return Promise.resolve(null);
  var body=Object.assign({domaine:domaine}, info||{});
  return fetch('/api/validations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){return r.json();})
    .then(function(j){ if(j&&j.ok) pushNotif('ok','fa-crown','Soumis à la validation Direction.',4000); return j; })
    .catch(function(){ return null; });
}
// ── Verrou d'édition générique réutilisable (empêche 2 personnes d'éditer la même ressource) ──
// Usage : ErpLock.acquire('nomenclature:'+id, { label:'Mon nom', onBlocked:function(by){...}, onLost:function(by){...} })
//         ErpLock.release('nomenclature:'+id)   (libération auto à la fermeture de l'onglet)
var ErpLock = {
  _cid:null, _hb:{}, _lost:{},
  cid:function(){ if(this._cid)return this._cid; var k; try{ k=sessionStorage.getItem('erp_lock_cid'); if(!k){ k='c'+Math.random().toString(36).slice(2)+Date.now().toString(36); sessionStorage.setItem('erp_lock_cid',k); } }catch(e){ k='c'+Math.random().toString(36).slice(2); } this._cid=k; return k; },
  acquire:function(resource, opts){ opts=opts||{}; var self=this;
    return fetch('/api/locks/acquire',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resource:resource,holder_id:this.cid(),holder_label:opts.label||null})})
      .then(function(r){return r.json();}).then(function(j){
        if(j && j.acquired){ self._lost[resource]=opts.onLost||null; self._beat(resource); if(opts.onOk)opts.onOk(); return true; }
        if(opts.onBlocked)opts.onBlocked((j&&j.holder_label)||'un autre utilisateur'); return false;
      }).catch(function(){ if(opts.onOk)opts.onOk(); return true; });
  },
  _beat:function(resource){ var self=this; this._stop(resource);
    this._hb[resource]=setInterval(function(){
      fetch('/api/locks/heartbeat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resource:resource,holder_id:self.cid()})})
        .then(function(r){return r.json();}).then(function(j){ if(j && j.held===false){ self._stop(resource); var cb=self._lost[resource]; if(cb)cb((j&&j.holder_label)||''); } }).catch(function(){});
    }, 15000);
  },
  _stop:function(resource){ if(this._hb[resource]){ clearInterval(this._hb[resource]); delete this._hb[resource]; } },
  release:function(resource){ this._stop(resource); var body=JSON.stringify({resource:resource,holder_id:this.cid()});
    try{ if(navigator.sendBeacon){ navigator.sendBeacon('/api/locks/release', new Blob([body],{type:'application/json'})); return; } }catch(e){}
    fetch('/api/locks/release',{method:'POST',headers:{'Content-Type':'application/json'},body:body,keepalive:true}).catch(function(){});
  },
  releaseAll:function(){ var self=this; Object.keys(this._hb).forEach(function(r){ self.release(r); }); }
};
window.addEventListener('beforeunload', function(){ ErpLock.releaseAll(); });
</script>
</body>
</html>`

// ─── Case « Soumettre à la validation Direction » (réutilisable) ──
// À placer dans un formulaire ; la fonction submitValidation(domaine, id, info)
// (script global du layout) l'envoie à la file Direction si elle est cochée.
export const validationCheckbox = (id = 'vd-submit', label = 'Soumettre à la validation de la Direction') => `
  <label style="display:flex;align-items:center;gap:9px;padding:9px 12px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:9px;font-size:.76rem;color:#92400e;font-weight:600;cursor:pointer;margin:4px 0;">
    <input type="checkbox" id="${id}" style="width:16px;height:16px;accent-color:#f59e0b;cursor:pointer;"/>
    <i class="fas fa-crown" style="color:#f59e0b;"></i><span>${label}</span>
  </label>`

// ─── HELPERS HTML ─────────────────────────────────────────────
// En-tête de page standardisé : bandeau coloré (mêmes couleurs/template que les pages principales des services).
// `color` = paire de teintes "c1,c2" pour le dégradé (ex : '#f87171,#b91c1c').
export const pageHeader = (icon: string, color: string, title: string, subtitle: string, badges: string[] = []) => `
<div style="background:linear-gradient(135deg,${color});padding:14px 24px;display:flex;align-items:center;gap:14px;border-bottom:1px solid rgba(0,0,0,.08);position:sticky;top:0;z-index:30;box-shadow:0 1px 4px rgba(0,0,0,.08);">
  <div style="width:44px;height:44px;border-radius:13px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;color:white;font-size:1.15rem;flex-shrink:0;">
    <i class="${icon}"></i>
  </div>
  <div style="min-width:0;">
    <h1 style="font-size:1.08rem;font-weight:800;color:white;margin:0;text-shadow:0 1px 2px rgba(0,0,0,.12);">${title}</h1>
    <p style="color:rgba(255,255,255,.82);font-size:.72rem;margin:3px 0 0;">${subtitle}</p>
  </div>
  <div style="margin-left:auto;display:flex;align-items:center;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;">
    ${badges.map(b=>`<span style="background:rgba(255,255,255,.2);color:white;border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:700;white-space:nowrap;">${b}</span>`).join('')}
  </div>
</div>`

// ─── EN-TÊTE DE SERVICE UNIFIÉ (style Direction Générale / RH) ──
// Bandeau coloré plein + barre d'onglets sur fond dégradé sombre.
// Sous-navigation « Planning » commune aux deux vues de planning : PROGRAMMATION (par poste,
// /production/service) et AFFECTATION (par opérateur, /production/planning). Rendue en tête de
// chaque page → les deux plannings forment un seul outil « Planning » à deux sous-onglets.
// Usage : serviceHeader({ icon, color, darkBg, title, subtitle, tabs, switchFn, tabIdPrefix, activeId?, action? })
export type SvcTab = { id: string; label: string; icon: string; badge?: string | number }
export type SvcAction = { href: string; icon: string; label: string }

export const serviceHeader = (cfg: {
  icon:        string                // ex: 'fa-briefcase'
  color:       string                // ex: '#3b82f6' — accent principal
  darkBg:      string                // ex: '#1e3a5f' — teinte dégradée sombre (mélangée avec #0f172a)
  title:       string
  subtitle?:   string
  tabs:        SvcTab[]
  switchFn:    string                // ex: 'switchSvcTab'  — appelé avec l'id de l'onglet
  tabIdPrefix: string                // ex: 'svc-tab'      — id DOM = `${prefix}-${tab.id}`
  activeId?:   string                // si omis → premier onglet
  action?:     SvcAction             // bouton action à droite du bandeau (optionnel)
}) => {
  const activeId = cfg.activeId ?? cfg.tabs[0]?.id ?? ''
  const subtitle = cfg.subtitle ?? ''
  const action   = cfg.action
  return `
<div id="svc-hdr-bar" style="background:${cfg.color};padding:12px 24px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(0,0,0,.08);">
  <i class="fas ${cfg.icon}" style="color:white;font-size:1.1rem;"></i>
  <span style="color:white;font-weight:800;font-size:.95rem;">${cfg.title}</span>
  ${subtitle ? `<span style="color:rgba(255,255,255,.65);font-size:.72rem;margin-left:4px;">· ${subtitle}</span>` : ''}
  ${action ? `<a href="${action.href}" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(255,255,255,.2);color:white;border-radius:8px;font-size:.77rem;font-weight:700;text-decoration:none;border:1px solid rgba(255,255,255,.25);"><i class="fas ${action.icon}"></i>${action.label}</a>` : ''}
</div>
<div style="background:linear-gradient(135deg,#0f172a,${cfg.darkBg});padding:12px 16px 0;display:flex;align-items:flex-end;gap:4px;overflow-x:auto;border-bottom:3px solid ${cfg.color};">
  ${cfg.tabs.map(t => {
    const isActive = t.id === activeId
    return `<button onclick="${cfg.switchFn}('${t.id}')" id="${cfg.tabIdPrefix}-${t.id}" class="svc-hdr-tab${isActive ? ' active' : ''}" style="--svc-color:${cfg.color};"><i class="fas ${t.icon}"></i>${t.label}${t.badge != null ? `<span class="svc-hdr-tab-badge">${t.badge}</span>` : ''}</button>`
  }).join('')}
</div>
<style>
.svc-hdr-tab{padding:10px 18px;border:none;background:transparent;color:rgba(255,255,255,.6);border-radius:8px 8px 0 0;cursor:pointer;font-weight:600;font-size:.8rem;border-bottom:3px solid transparent;margin-bottom:-3px;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;transition:all .15s;}
.svc-hdr-tab.active{color:white;background:rgba(255,255,255,.12);border-bottom-color:var(--svc-color,#fff);font-weight:700;}
.svc-hdr-tab:not(.active):hover{color:rgba(255,255,255,.85);background:rgba(255,255,255,.06);}
.svc-hdr-tab-badge{background:rgba(255,255,255,.25);color:white;border-radius:999px;padding:1px 8px;font-size:.65rem;font-weight:800;margin-left:4px;}
</style>`
}

// ─── Modale « Demande d'achat » réutilisable (DA libre, non rattachée à une commande) ───
// Embeddable dans n'importe quel service (OAS, Stock, Maintenance, Expéditions, Qualité…). UNE par page.
// Place un bouton via onclick="ouvrirDemandeAchat()". POST /api/achats/da → apparaît dans la liste DA des Achats.
export const demandeAchatModal = (serviceLabel: string, accent = '#10b981', fournisseurs: Array<{ id: any; nom: string }> = []): string => `
<button id="da-banner-btn" onclick="ouvrirDemandeAchat()" title="Créer une demande d'achat (transmise aux Achats)" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(255,255,255,.2);color:white;border:1px solid rgba(255,255,255,.3);border-radius:8px;font-size:.77rem;font-weight:700;cursor:pointer;"><i class="fas fa-cart-plus"></i>Demande d'achat</button>
<div id="da-widget-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:7000;align-items:center;justify-content:center;">
  <div style="background:white;border-radius:16px;max-width:520px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">
    <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,${accent},${accent}cc);">
      <div style="font-weight:800;font-size:1rem;color:white;display:flex;align-items:center;gap:8px;"><i class="fas fa-cart-plus"></i>Demande d'achat — ${serviceLabel}</div>
      <button onclick="fermerDemandeAchat()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
    </div>
    <div style="padding:22px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div style="grid-column:1/-1;font-size:.72rem;color:#6b7280;"><i class="fas fa-info-circle" style="margin-right:5px;color:${accent};"></i>Demande libre (non rattachée à une commande). Elle sera transmise aux Achats pour traitement.</div>
      <div style="grid-column:1/-1;"><label style="display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Article / Désignation *</label><input id="da_w_article" type="text" placeholder="Désignation de l'article…" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;"/></div>
      <div><label style="display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Type</label><select id="da_w_type" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;"><option>Matière</option><option>Outillage</option><option>Consommable</option><option>Chimique</option><option>EPI / Sécurité</option><option>Pièce détachée</option><option>Sous-traitance</option><option>Autre</option></select></div>
      <div><label style="display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Quantité</label><input id="da_w_qte" type="text" placeholder="ex : 10 u" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;"/></div>
      <div><label style="display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Fournisseur pressenti</label><input id="da_w_fourn" type="text" ${fournisseurs.length ? 'list="da_w_fourn_list"' : ''} placeholder="Nom (option)" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;"/>${fournisseurs.length ? `<datalist id="da_w_fourn_list">${fournisseurs.map(f => `<option value="${String(f.nom || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"></option>`).join('')}</datalist>` : ''}</div>
      <div><label style="display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Priorité</label><select id="da_w_prio" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;"><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critique">Critique</option></select></div>
      <div><label style="display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;">Livraison souhaitée</label><input id="da_w_liv" type="date" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;"/></div>
      <div style="grid-column:1/-1;">${validationCheckbox('da_w_vd', 'Soumettre cette demande à la validation de la Direction (DA libre / investissement)')}</div>
    </div>
    <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
      <button onclick="fermerDemandeAchat()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
      <button onclick="soumettreDemandeAchat()" style="padding:9px 18px;background:linear-gradient(135deg,${accent},${accent}cc);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane" style="margin-right:5px;"></i>Envoyer aux Achats</button>
    </div>
  </div>
</div>
<script>
var DA_FOURN=${JSON.stringify(fournisseurs.map(f => ({ id: f.id, nom: f.nom }))).replace(/</g, '\\u003c')};
// Place le bouton « Demande d'achat » en haut à droite de la bannière du service (fallback : flottant haut-droite).
(function(){ try{ var b=document.getElementById('da-banner-btn'), bar=document.getElementById('svc-hdr-bar'); if(b&&bar){ b.style.marginLeft='auto'; bar.appendChild(b); } else if(b){ b.style.position='fixed'; b.style.top='12px'; b.style.right='24px'; b.style.zIndex='6900'; b.style.boxShadow='0 4px 14px rgba(0,0,0,.2)'; b.style.background='rgba(15,23,42,.85)'; b.style.borderRadius='999px'; b.style.padding='9px 16px'; } }catch(e){} })();
function ouvrirDemandeAchat(){ var m=document.getElementById('da-widget-overlay'); if(m) m.style.display='flex'; }
function fermerDemandeAchat(){ var m=document.getElementById('da-widget-overlay'); if(m) m.style.display='none'; }
function soumettreDemandeAchat(){
  var v=function(id){ var e=document.getElementById(id); return e?(e.value||'').trim():''; };
  var article=v('da_w_article');
  if(!article){ if(window.pushNotif) pushNotif('err','fa-exclamation-circle','La désignation est requise.'); else alert('Désignation requise.'); return; }
  var _fn=v('da_w_fourn'); var _fo=(DA_FOURN||[]).find(function(x){return String(x.nom)===String(_fn);});
  var payload={ article:article, type_da:v('da_w_type')||'Matière', qte:v('da_w_qte'), fournisseur:_fn, fournisseur_id:(_fo?_fo.id:null), priorite:(document.getElementById('da_w_prio')||{}).value||'normal', livraison:v('da_w_liv')||null, demandeur:${JSON.stringify(serviceLabel)} };
  fetch('/api/achats/da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ if(window.pushNotif) pushNotif('err','fa-ban',(j&&j.error)||'Échec de la demande.'); return; }
      if(window.submitValidation) submitValidation('achats','da_w_vd',{type:'Demande d\\'achat',objet:article+(v('da_w_qte')?' ('+v('da_w_qte')+')':''),priorite:(document.getElementById('da_w_prio')||{}).value||'normal',ref_table:'demandes_achat',ref_id:(j.da&&j.da.id)||null});
      var _cb=document.getElementById('da_w_vd'); if(_cb)_cb.checked=false;
      fermerDemandeAchat();
      if(window.pushNotif) pushNotif('ok','fa-cart-plus','Demande d\\'achat <strong>'+j.da.id+'</strong> envoyée aux Achats.',5000);
      var ids=['da_w_article','da_w_qte','da_w_fourn','da_w_liv']; ids.forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
    }).catch(function(){ if(window.pushNotif) pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
</script>`

// ═══════════════════════════════════════════════════════════════════
// SÉLECTION MULTIPLE + SUPPRESSION GROUPÉE (réutilisable, listes primaires)
// -------------------------------------------------------------------
// Wiring par liste :
//  1) bouton d'en-tête : ${bulkToolbar('clients')}
//  2) en-tête de table : <th class="bcell bcell-clients" style="display:none;text-align:center;">
//        <input type="checkbox" onclick="bulkAll('clients',this.checked)"/></th>
//  3) chaque ligne      : <td class="bcell bcell-clients" style="display:none;text-align:center;"
//        onclick="event.stopPropagation()"><input type="checkbox" class="bsel" data-bulk="clients"
//        data-id="ID" onclick="event.stopPropagation();bulkCount('clients')"/></td>
//  4) une fois par page : ${bulkSelectAssets([{ key:'clients', base:'/api/client/', label:'client(s)' }])}
// La suppression appelle DELETE base+id ; un 409 (élément référencé) est compté comme échec et signalé.
export const bulkToolbar = (key: string, accent = '#6366f1'): string => `<span style="display:inline-flex;align-items:center;gap:8px;">
  <button id="bulkbtn-${key}" data-on="0" onclick="bulkMode('${key}')" style="display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border:1.5px solid ${accent};background:white;color:${accent};border-radius:9px;font-weight:700;font-size:.78rem;cursor:pointer;white-space:nowrap;"><i class="fas fa-square-check"></i>Sélectionner</button>
  <span id="bulkbar-${key}" style="display:none;align-items:center;gap:8px;">
    <span id="bulkcount-${key}" style="font-size:.76rem;font-weight:700;color:#475569;white-space:nowrap;">0 sélectionné(s)</span>
    <button onclick="bulkAsk('${key}')" style="padding:7px 13px;border:none;background:#dc2626;color:white;border-radius:9px;font-weight:700;font-size:.78rem;cursor:pointer;white-space:nowrap;"><i class="fas fa-trash" style="margin-right:5px;"></i>Supprimer</button>
    <button onclick="bulkMode('${key}')" style="padding:7px 11px;border:1.5px solid #e2e8f0;background:white;color:#64748b;border-radius:9px;font-weight:600;font-size:.78rem;cursor:pointer;">Annuler</button>
  </span>
</span>`

export const bulkSelectAssets = (groups: Array<{ key: string; base: string; label?: string }>): string => {
  const cfg = JSON.stringify(Object.fromEntries(groups.map(g => [g.key, { base: g.base, label: g.label || 'élément(s)' }]))).replace(/</g, '\\u003c')
  return `
<div id="bulk-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:8000;align-items:center;justify-content:center;">
  <div style="background:white;border-radius:16px;max-width:430px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">
    <div style="padding:16px 22px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#111827;"><i class="fas fa-triangle-exclamation" style="color:#dc2626;margin-right:8px;"></i>Confirmer la suppression</div>
    <div id="bulk-modal-msg" style="padding:20px 22px;font-size:.85rem;color:#374151;line-height:1.5;"></div>
    <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
      <button onclick="document.getElementById('bulk-modal').style.display='none'" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:600;cursor:pointer;">Annuler</button>
      <button onclick="bulkConfirm()" style="padding:9px 18px;background:#dc2626;color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;"><i class="fas fa-trash" style="margin-right:5px;"></i>Supprimer définitivement</button>
    </div>
  </div>
</div>
<script>
var BULK_CFG=${cfg};
var _bulkPending=null;
function _bboxes(key){ return document.querySelectorAll('input.bsel[data-bulk="'+key+'"]'); }
function bulkMode(key){
  var btn=document.getElementById('bulkbtn-'+key); if(!btn) return;
  var on=btn.getAttribute('data-on')==='1'; on=!on; btn.setAttribute('data-on',on?'1':'0');
  document.querySelectorAll('.bcell-'+key).forEach(function(c){ c.style.display=on?'table-cell':'none'; });
  var bar=document.getElementById('bulkbar-'+key); if(bar) bar.style.display=on?'inline-flex':'none';
  btn.style.display=on?'none':'inline-flex';
  if(!on){ _bboxes(key).forEach(function(b){ b.checked=false; }); }
  bulkCount(key);
}
function bulkAll(key,ch){ _bboxes(key).forEach(function(b){ var tr=b.closest('tr'); if(!tr||tr.style.display!=='none') b.checked=ch; }); bulkCount(key); }
function bulkCount(key){ var n=0; _bboxes(key).forEach(function(b){ if(b.checked)n++; }); var s=document.getElementById('bulkcount-'+key); if(s) s.textContent=n+' sélectionné(s)'; return n; }
function bulkAsk(key){
  var n=bulkCount(key);
  if(!n){ if(window.pushNotif) pushNotif('warn','fa-info-circle','Aucun élément sélectionné.'); else alert('Aucun élément sélectionné.'); return; }
  _bulkPending=key;
  document.getElementById('bulk-modal-msg').innerHTML='Voulez-vous vraiment supprimer <b>'+n+'</b> '+((BULK_CFG[key]||{}).label||'élément(s)')+' ?<br><span style="color:#b91c1c;">Cette action est irréversible.</span>';
  document.getElementById('bulk-modal').style.display='flex';
}
function bulkConfirm(){
  var key=_bulkPending; if(!key) return;
  var base=(BULK_CFG[key]||{}).base; var ids=[];
  _bboxes(key).forEach(function(b){ if(b.checked) ids.push(b.getAttribute('data-id')); });
  document.getElementById('bulk-modal').style.display='none';
  if(!base||!ids.length) return;
  if(window.pushNotif) pushNotif('ok','fa-hourglass-half','Suppression de '+ids.length+'…',1500);
  var done=0,failed=0;
  Promise.all(ids.map(function(id){
    return fetch(base+encodeURIComponent(id),{method:'DELETE'})
      .then(function(r){ return r.ok?(r.json().catch(function(){return {ok:true};})):{ok:false}; })
      .then(function(j){ if(j&&j.ok!==false) done++; else failed++; })
      .catch(function(){ failed++; });
  })).then(function(){
    if(window.pushNotif) pushNotif(failed?'warn':'ok', failed?'fa-triangle-exclamation':'fa-check', done+' supprimé(s)'+(failed?(' · '+failed+' échec(s) — élément(s) référencé(s) ?'):''), 5500);
    setTimeout(function(){ softReload(); }, 950);
  });
}
</script>`
}

// ─── Panneau « Interlocuteurs » réutilisable (contacts multiples, relié à la DB) ───
// Embeddable dans une fiche fournisseur / sous-traitant / client. Un seul par page.
// entiteType ∈ 'fournisseur' | 'sous_traitant' | 'client'.
export const interlocuteursPanel = (entiteType: string, entiteId: string, accent = '#6366f1'): string => `
<div class="card" style="padding:0;overflow:hidden;margin-top:16px;">
  <div style="display:flex;align-items:center;gap:8px;padding:14px 18px;border-bottom:1px solid #f1f5f9;">
    <i class="fas fa-address-book" style="color:${accent};"></i>
    <span style="font-weight:800;color:#111827;font-size:.9rem;">Interlocuteurs</span>
    <span id="ilcCount" style="background:#eef2ff;color:#4338ca;border-radius:999px;padding:1px 9px;font-size:.66rem;font-weight:800;">0</span>
    <button onclick="ilcShowForm('')" style="margin-left:auto;padding:6px 14px;background:${accent};color:white;border:none;border-radius:8px;font-size:.76rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Ajouter</button>
  </div>
  <div id="ilcForm" style="display:none;padding:14px 18px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
    <input type="hidden" id="ilc_id"/>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div><label style="font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Nom *</label><input id="ilc_nom" type="text" placeholder="Nom Prénom" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.4rem .7rem;font-size:.82rem;box-sizing:border-box;"/></div>
      <div><label style="font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Fonction</label><input id="ilc_fonction" type="text" placeholder="ex: Responsable Achats" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.4rem .7rem;font-size:.82rem;box-sizing:border-box;"/></div>
      <div><label style="font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Email</label><input id="ilc_email" type="email" placeholder="contact@..." style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.4rem .7rem;font-size:.82rem;box-sizing:border-box;"/></div>
      <div><label style="font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Téléphone</label><input id="ilc_tel" type="text" placeholder="06 .. .. .. .." style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.4rem .7rem;font-size:.82rem;box-sizing:border-box;"/></div>
    </div>
    <label style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:.78rem;color:#374151;cursor:pointer;"><input id="ilc_principal" type="checkbox"/> Interlocuteur principal</label>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
      <button onclick="ilcCancel()" style="padding:6px 14px;border:1.5px solid #e2e8f0;background:white;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;">Annuler</button>
      <button onclick="ilcSave()" style="padding:6px 16px;background:${accent};color:white;border:none;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i>Enregistrer</button>
    </div>
  </div>
  <div id="ilcList" style="padding:8px 18px;"><div style="padding:18px;text-align:center;color:#9ca3af;font-size:.8rem;">Chargement…</div></div>
</div>
<script>
var ILC_TYPE='${entiteType}', ILC_ID='${entiteId}', ILC_ACCENT='${accent}';
function ilcNotif(t,i,m){ if(typeof pushNotif==='function'){pushNotif(t,i,m);} }
function ilcEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function ilcLoad(){
  fetch('/api/interlocuteurs?type='+encodeURIComponent(ILC_TYPE)+'&id='+encodeURIComponent(ILC_ID))
    .then(function(r){return r.json();}).then(function(j){ ilcRender((j&&j.interlocuteurs)||[]); })
    .catch(function(){ document.getElementById('ilcList').innerHTML='<div style="padding:14px;color:#ef4444;font-size:.8rem;">Erreur de chargement.</div>'; });
}
function ilcRender(list){
  var cnt=document.getElementById('ilcCount'); if(cnt) cnt.textContent=list.length;
  var el=document.getElementById('ilcList');
  if(!list.length){ el.innerHTML='<div style="padding:18px;text-align:center;color:#9ca3af;font-size:.8rem;">Aucun interlocuteur — cliquez « Ajouter ».</div>'; window.__ilcCache=[]; return; }
  el.innerHTML=list.map(function(p){
    var badge=p.principal?'<span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:1px 8px;font-size:.6rem;font-weight:800;margin-left:6px;">Principal</span>':'';
    var det=[]; if(p.fonction)det.push(ilcEsc(p.fonction)); if(p.email)det.push('<a href="mailto:'+ilcEsc(p.email)+'" style="color:'+ILC_ACCENT+';text-decoration:none;">'+ilcEsc(p.email)+'</a>'); if(p.telephone)det.push(ilcEsc(p.telephone));
    return '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f4f4f5;">'
      +'<div style="width:30px;height:30px;border-radius:50%;background:'+ILC_ACCENT+'18;color:'+ILC_ACCENT+';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.78rem;flex-shrink:0;">'+ilcEsc((p.nom||'?').charAt(0).toUpperCase())+'</div>'
      +'<div style="flex:1;min-width:0;"><div style="font-weight:700;color:#111827;font-size:.84rem;">'+ilcEsc(p.nom)+badge+'</div><div style="font-size:.72rem;color:#6b7280;">'+det.join(' · ')+'</div></div>'
      +'<button onclick="ilcShowForm(\\''+p.id+'\\')" title="Modifier" style="padding:5px 9px;background:#eef2ff;color:#4338ca;border:none;border-radius:6px;font-size:.72rem;cursor:pointer;"><i class="fas fa-pen"></i></button>'
      +'<button onclick="ilcDelete(\\''+p.id+'\\')" title="Supprimer" style="padding:5px 9px;background:#fef2f2;color:#b91c1c;border:none;border-radius:6px;font-size:.72rem;cursor:pointer;margin-left:4px;"><i class="fas fa-trash"></i></button>'
      +'</div>';
  }).join('');
  window.__ilcCache=list;
}
function ilcShowForm(id){
  var p=(window.__ilcCache||[]).filter(function(x){return String(x.id)===String(id);})[0]||{};
  document.getElementById('ilc_id').value=id||'';
  document.getElementById('ilc_nom').value=p.nom||'';
  document.getElementById('ilc_fonction').value=p.fonction||'';
  document.getElementById('ilc_email').value=p.email||'';
  document.getElementById('ilc_tel').value=p.telephone||'';
  document.getElementById('ilc_principal').checked=!!p.principal;
  document.getElementById('ilcForm').style.display='block';
}
function ilcCancel(){ document.getElementById('ilcForm').style.display='none'; }
function ilcSave(){
  var nom=document.getElementById('ilc_nom').value.trim();
  if(!nom){ ilcNotif('err','fa-exclamation-circle','Le nom est requis.'); return; }
  var id=document.getElementById('ilc_id').value;
  var body={ entite_type:ILC_TYPE, entite_id:ILC_ID, nom:nom,
    fonction:document.getElementById('ilc_fonction').value.trim()||null,
    email:document.getElementById('ilc_email').value.trim()||null,
    telephone:document.getElementById('ilc_tel').value.trim()||null,
    principal:document.getElementById('ilc_principal').checked };
  var url=id?('/api/interlocuteurs/'+encodeURIComponent(id)):'/api/interlocuteurs';
  var method=id?'PATCH':'POST';
  fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ ilcNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
      ilcNotif('ok','fa-check-circle',id?'Interlocuteur modifié.':'Interlocuteur ajouté.'); ilcCancel(); ilcLoad(); })
    .catch(function(){ ilcNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
async function ilcDelete(id){
  if(!(await appConfirm('Supprimer cet interlocuteur ?'))) return;
  fetch('/api/interlocuteurs/'+encodeURIComponent(id),{method:'DELETE',headers:{'Content-Type':'application/json'},body:'{}'})
    .then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ ilcNotif('info','fa-trash','Interlocuteur supprimé.'); ilcLoad(); } });
}
ilcLoad();
</script>`

export const afterBox = (mails: string[], docs: string[], actions: string[], dest = '') => `
<div class="after-box" style="margin-top:16px;">
  <div style="font-size:.72rem;font-weight:800;color:#1d4ed8;margin-bottom:8px;"><i class="fas fa-bolt mr-1" style="color:#3b82f6;"></i>Après validation – Flux automatique Power Automate</div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;">
    ${mails.map(m=>`<span class="chip-mail"><i class="fas fa-envelope mr-1"></i>${m}</span>`).join('')}
    ${docs.map(d=>`<span class="chip-doc"><i class="fas fa-file mr-1"></i>${d}</span>`).join('')}
    ${actions.map(a=>`<span class="chip-action"><i class="fas fa-arrow-right mr-1"></i>${a}</span>`).join('')}
    ${dest?`<span style="margin-left:auto;font-size:.72rem;color:#1d4ed8;font-weight:600;"><i class="fas fa-user mr-1"></i>→ ${dest}</span>`:''}
  </div>
</div>`
