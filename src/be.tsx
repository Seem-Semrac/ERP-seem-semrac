// ══════════════════════════════════════════════════════════════
// BUREAU D'ÉTUDES – ERP Seem Semrac v2.0
// Nomenclatures · Analyse DT · Prépa technique · Dashboard
// ══════════════════════════════════════════════════════════════
import { escX, layout, pageHeader, serviceHeader, bulkToolbar, bulkSelectAssets } from './shared'
import type { DemandeTravaux, Commande, Nomenclature, Offre } from './types'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

// ─── CONSTANTES CALCUL (fallback si pas de données DB) ─────────
const TAUX_MO_DEFAULT   = 30   // €/h — moyenne MO de secours
const COUT_MACHINE_DEFAULT = 35 // €/h — coût horaire machine moyen de secours

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
  machines: Array<{ id: string; nom: string; code?: string; activite?: string; categorie?: string; statut?: string; taux_horaire: number | null }>
  taux_operateur: { moyen: number; seem: number; semrac: number }
  fournisseurs_st: Array<{ id: string; nom: string; operation?: string; qualification?: string; statut?: string }>
  process_atelier?: Array<{ id: string; nom: string; code?: string; activite?: string; categorie?: string; requiert_machine?: boolean; machine_id?: string | null; poste_id?: string | null; statut?: string }>
  postes?: Array<{ id: string; nom: string; code?: string | null; activite?: string | null; couleur?: string | null }>
  sous_traitants?: Array<{ id: string; nom: string; tarifs?: Array<{ operation: string; forfait_ht?: number; prix_unitaire_piece_ht?: number }>; prestations?: string[] }>
  fournisseurs?: Array<{ id: string; nom: string; categorie?: string | null; activite?: string; familles_fourniture?: string[]; catalogue?: any[] }>
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
  // Catalogue commercial (produits_fournisseurs) pour la sélection matière en nomenclature
  const PRODUITS_NOM = (dbProduits ?? []).map((p: any) => ({
    fournisseur_id: p.fournisseur_id, reference: p.reference, designation: p.designation,
    prix: p.prix, date_prix: p.date_prix, categorie: p.categorie, conditionnement: p.conditionnement,
  }))
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
  const composantsCount = (n:any) => Array.isArray(n?.composants) ? n.composants.length : 0
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
  const BE_REFS = dbRefs ?? { machines: [], taux_operateur: { moyen: TAUX_MO_DEFAULT, seem: TAUX_MO_DEFAULT, semrac: TAUX_MO_DEFAULT }, fournisseurs_st: [], process_atelier: [], sous_traitants: [], fournisseurs: [] }
  const TAUX_MO_RESOLVED = BE_REFS.taux_operateur.moyen || TAUX_MO_DEFAULT
  const MACHINES_AVG = BE_REFS.machines.filter(m => m.taux_horaire != null).map(m => m.taux_horaire as number)
  const COUT_MACHINE_AVG = MACHINES_AVG.length
    ? +(MACHINES_AVG.reduce((s,n)=>s+n,0)/MACHINES_AVG.length).toFixed(2)
    : COUT_MACHINE_DEFAULT

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
                      <button onclick="nomSupprimer('${n.id}','${n.num_nom ?? ''}')"
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
                      <button onclick="nomSupprimer('${n.id}','${n.num_nom ?? ''}')"
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
    ${bulkSelectAssets([{ key: 'nom', base: '/api/nomenclature/', label: 'nomenclature(s)' }, { key: 'nomm', base: '/api/nomenclature/', label: 'nomenclature(s) mère(s)' }])}

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

        <!-- COL GAUCHE : IDENTITÉ + FOURNITURES -->
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

          <!-- Fournitures : 2 compartiments (Matière / Accessoires) -->
          <div id="nom-fournitures-block">

            <!-- COMPARTIMENT MATIÈRE -->
            <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:16px;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <div style="font-size:.72rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;flex:1;"><i class="fas fa-layer-group" style="color:#0ea5e9;margin-right:6px;"></i>Matière (tôle)</div>
                <button onclick="nomAddMatiere()" style="padding:5px 12px;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:white;border:none;border-radius:7px;cursor:pointer;font-size:.75rem;font-weight:700;display:flex;align-items:center;gap:5px;"><i class="fas fa-plus"></i>Ajouter matière</button>
              </div>
              <div style="font-size:.64rem;color:#94a3b8;margin-bottom:10px;">Fournisseur « matière » + réf catalogue → prix tôle <strong>auto si &lt; 6 mois</strong>, sinon « Demande de prix ». Prix tôle ÷ Pc/tôle = prix matière / pièce.</div>
              <div style="display:grid;grid-template-columns:130px 1fr 150px 104px 56px 64px 24px;gap:4px;margin-bottom:4px;padding:0 2px;">
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Réf. matière</span>
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Désignation</span>
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Fournisseur</span>
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">Prix tôle</span>
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">Pc/tôle</span>
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">€/pièce</span>
                <span></span>
              </div>
              <div id="nom-matieres-list"></div>
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
              <div style="font-size:.64rem;color:#94a3b8;margin-bottom:10px;">(Prix paquet ÷ quantité par paquet) × nombre par pièce = prix accessoire / pièce.</div>
              <div style="display:grid;grid-template-columns:120px 1fr 110px 72px 62px 60px 78px 26px;gap:4px;margin-bottom:4px;padding:0 2px;">
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Réf catalogue</span>
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Désignation</span>
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Fournisseur</span>
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">Prix paquet</span>
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">Qté/paq</span>
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">Nb/pc</span>
                <span style="font-size:.6rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;">€/pièce</span>
                <span></span>
              </div>
              <div id="nom-accessoires-list"></div>
              <div style="margin-top:8px;display:flex;justify-content:flex-end;padding-top:8px;border-top:1.5px solid #f1f5f9;">
                <span style="font-size:.78rem;font-weight:800;color:#374151;">Total accessoires / pièce : <span id="nom-total-accessoire" style="color:#8b5cf6;">0,00 €</span></span>
              </div>
            </div>
          </div>

        </div>

        <!-- COL DROITE : TEMPS + CALCULS -->
        <div style="display:flex;flex-direction:column;gap:16px;">

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
              <div>Taux MO moyen DB <span style="font-weight:800;color:#374151;">${TAUX_MO_RESOLVED.toFixed(2)} €/h</span></div>
              <div>Machines référencées <span style="font-weight:800;color:#374151;">${BE_REFS.machines.length}</span></div>
              <div>Sous-traitants actifs <span style="font-weight:800;color:#374151;">${(BE_REFS.sous_traitants?.length ?? BE_REFS.fournisseurs_st.length)}</span></div>
            </div>
            <!-- Header colonnes -->
            <div style="font-size:.62rem;color:#7c3aed;font-weight:700;margin:0 2px 5px;"><i class="fas fa-clock" style="margin-right:4px;"></i>Temps en <strong>millièmes d'heure</strong> (1000&nbsp;‰&nbsp;=&nbsp;1&nbsp;h) — totaux affichés en heures/minutes</div>
            <div style="display:grid;grid-template-columns:34px 84px 1fr 1.2fr 58px 58px 58px 62px 88px 26px;gap:4px;margin-bottom:4px;padding:0 2px;">
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">N°</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;">Type</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;" title="Poste d'atelier (interne) / sous-traitant">Poste</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;" title="Process du poste choisi (interne) / opération (sous-traité)">Process</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;" title="ROP — réglage OPÉRATEUR, en millièmes d'heure (1000 = 1 h). Coût fixe par lot, au taux main d'œuvre.">ROP ‰h</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;" title="RGM — réglage MACHINE, en millièmes d'heure (1000 = 1 h). Coût fixe par lot, au taux machine.">RGM ‰h</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;" title="Temps main d'œuvre / homme — millièmes d'heure (1000 = 1 h)">MO ‰h</span>
              <span style="font-size:.58rem;font-weight:700;color:#9ca3af;text-transform:uppercase;text-align:right;" title="Temps machine — millièmes d'heure (1000 = 1 h)">Mach ‰h</span>
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
                <div><div style="font-size:.78rem;font-weight:700;color:#374151;"><i class="fas fa-gears" style="color:#10b981;margin-right:7px;"></i>Main d'œuvre variable</div><div style="font-size:.62rem;color:#9ca3af;margin-left:22px;">MO + machine / pièce</div></div>
                <span id="nom-calc-movar" style="font-size:1rem;font-weight:800;color:#10b981;">0,00 €</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:9px 14px;">
                <div style="font-size:.78rem;font-weight:700;color:#374151;"><i class="fas fa-industry" style="color:#b45309;margin-right:7px;"></i>Sous-traitance</div>
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
                    <div><div style="font-size:.76rem;font-weight:700;color:#374151;"><i class="fas fa-gears" style="color:#10b981;margin-right:7px;"></i>Main d'œuvre variable</div><div style="font-size:.6rem;color:#9ca3af;margin-left:22px;">MO + machine × quantité</div></div>
                    <span id="nom-calc-s-movar" style="font-size:.95rem;font-weight:800;color:#10b981;">0,00 €</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;background:white;border-radius:8px;padding:8px 12px;">
                    <div style="font-size:.76rem;font-weight:700;color:#374151;"><i class="fas fa-industry" style="color:#b45309;margin-right:7px;"></i>Sous-traitance</div>
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
        <span style="background:#cffafe;color:#0e7490;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${CMDS_PREP.length}</span>
      </div>
      <input type="text" placeholder="Rechercher…" oninput="beFilter('be-tbl-prep',this.value)"
        style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:200px;"/>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      ${CMDS_PREP.length === 0 ? emptyRow('Aucune préparation technique en attente') : `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="be-tbl-prep">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;${TH}">N° CMD / Affaire</th>
            <th style="text-align:left;${TH}">Client</th>
            <th style="text-align:left;${TH}">Pièce(s)</th>
            <th style="text-align:center;${TH}">Activité</th>
            <th style="text-align:center;${TH}">Livraison</th>
            <th style="text-align:center;${TH}">Statut</th>
            <th style="text-align:center;${TH}">Action</th>
          </tr></thead>
          <tbody>
            ${CMDS_PREP.map(cmd => `
            <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
              <td style="${TD}"><div style="font-weight:700;color:#374151;">${escX(cmd.id)}</div><div style="font-size:.68rem;color:#9ca3af;">Aff. N°${escX(cmd.numAffaire)}</div></td>
              <td style="${TD}font-weight:600;color:#374151;">${escX(cmd.client)}</td>
              <td style="${TD}color:#6b7280;font-size:.78rem;">${(cmd.pieces||[]).map((x:any)=>escX(x)).join(', ')}</td>
              <td style="${TD}text-align:center;font-size:.75rem;color:#374151;">${escX(cmd.activite)}</td>
              <td style="${TD}text-align:center;font-size:.75rem;color:#6b7280;">${cmd.dateLiv}</td>
              <td style="${TD}text-align:center;">${statutDTBadge(cmd.statut)}</td>
              <td style="${TD}text-align:center;">
                <a href="/be/preparation" style="padding:5px 12px;background:linear-gradient(135deg,#0891b2,#0e7490);color:white;border-radius:7px;font-size:.72rem;font-weight:700;text-decoration:none;">
                  <i class="fas fa-cogs" style="margin-right:4px;"></i>Préparer
                </a>
              </td>
            </tr>`).join('')}
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
    // Prix « à re-demander » = absent, ou daté de plus de 6 mois (183 j)
    const _dd = r.derniere_date ? Date.parse(r.derniere_date) : NaN
    const needsRfq = (r.prix == null) || isNaN(_dd) || (Date.now() - _dd) >= 183 * 86400000
    return `<tr data-cat="${grp}" data-act="${refEsc(act)}" style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:7px 10px;font-weight:700;color:#4338ca;font-size:.78rem;">${refEsc(r.reference)}</td>
      <td style="padding:7px 10px;font-size:.78rem;color:#374151;">${refEsc(r.designation)}</td>
      <td style="padding:7px 10px;"><span style="background:#eef2ff;color:#4338ca;border-radius:6px;padding:1px 8px;font-size:.64rem;font-weight:700;">${refEsc(famLabel(r.famille || ''))}${r.categorie && grp === 'matiere_premiere' ? ' · ' + refEsc(r.categorie) : ''}</span></td>
      <td style="padding:7px 10px;"><span style="background:${act === 'Seem' ? '#dbeafe' : act === 'Semrac' ? '#fce7f3' : '#f1f5f9'};color:${act === 'Seem' ? '#1d4ed8' : act === 'Semrac' ? '#9d174d' : '#475569'};border-radius:6px;padding:1px 8px;font-size:.64rem;font-weight:700;">${refEsc(act)}</span></td>
      <td style="padding:7px 10px;font-size:.76rem;color:#64748b;">${refEsc(r.fournisseur_nom || '—')}</td>
      <td style="padding:7px 10px;text-align:right;font-weight:800;color:#0f766e;font-size:.8rem;">${prix}</td>
      <td style="padding:7px 10px;text-align:center;white-space:nowrap;"><button onclick="beEditCatalog('${refJs(r.id)}','${refJs(r.fournisseur_id||'')}','${refJs(r.reference)}','${refJs(r.designation)}','${grp}','${refJs(act)}')" title="Modifier cette référence" style="background:#ecfdf5;color:#047857;border:none;border-radius:6px;padding:4px 9px;font-size:.68rem;font-weight:700;cursor:pointer;margin-right:5px;"><i class="fas fa-pen" style="margin-right:4px;"></i>Éditer</button><button onclick="refEvol('${refEsc(r.reference)}',this)" data-desig="${refEsc(r.designation)}" style="background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:4px 9px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-chart-line" style="margin-right:4px;"></i>Évolution</button>${needsRfq ? `<button onclick="beRfqForRef('${refJs(r.reference)}','${refJs(r.designation)}','${grp}')" title="Prix absent ou daté de plus de 6 mois — lancer une demande de prix" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:6px;padding:4px 9px;font-size:.68rem;font-weight:700;cursor:pointer;margin-left:5px;"><i class="fas fa-file-invoice-dollar" style="margin-right:4px;"></i>Demande de prix</button>` : ''}</td>
    </tr>`
  }).join('')
  const catPill = (cat: string, lbl: string) => `<button onclick="refSetCat('${cat}')" id="refcat-${cat}" class="ref-pill" style="border:1.5px solid #e2e8f0;background:white;color:#475569;border-radius:999px;padding:5px 13px;font-size:.74rem;font-weight:700;cursor:pointer;">${lbl}</button>`
  const tabRefs = `
  <div id="be-panel-refs" style="display:none;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
      <span style="font-weight:800;font-size:1rem;color:#1e293b;"><i class="fas fa-boxes" style="color:#6366f1;margin-right:7px;"></i>Références — matières, fournitures &amp; outils</span>
      <span style="color:#94a3b8;font-size:.74rem;">${REFS_STOCK.length} référence(s)</span>
    </div>
    <div style="font-size:.74rem;color:#64748b;margin-bottom:10px;">Catalogue des références achetées. « Évolution » montre le prix unitaire au fil des bons de commande. Le catalogue s'alimente automatiquement à la validation des BC, des demandes de prix, et <strong>depuis les nomenclatures du BE</strong>.</div>
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
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;position:sticky;top:0;">${['Réf.', 'Désignation', 'Catégorie', 'Activité', 'Fournisseur', 'Dernier PU', 'Évolution'].map(h => `<th style="padding:8px 10px;text-align:left;font-size:.62rem;text-transform:uppercase;color:#6b7280;font-weight:700;">${h}</th>`).join('')}</tr></thead>
          <tbody>${refRows || '<tr><td colspan="7" style="text-align:center;padding:30px;color:#cbd5e1;font-size:.8rem;">Aucune référence.</td></tr>'}</tbody>
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
      { id: 'prep',      label: 'Préparations tech.', icon: 'fa-cogs',           badge: CMDS_PREP.length },
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
        <div><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Catégorie</label><select id="becat-cat" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"><option value="matiere_premiere">Matière</option><option value="accessoire">Accessoire</option><option value="outillage">Outillage</option><option value="consommable">Consommable</option><option value="chimique">Chimique</option></select></div>
        <div style="grid-column:1/-1;"><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Désignation *</label><input id="becat-desig" placeholder="libellé produit" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"/></div>
        <div><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Prix HT (optionnel)</label><input id="becat-prix" type="number" step="0.01" placeholder="sinon « en attente »" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"/></div>
        <div><label style="display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Activité</label><select id="becat-act" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;box-sizing:border-box;"><option value="both">Les deux</option><option value="Seem">Seem</option><option value="Semrac">Semrac</option></select></div>
      </div>
      <div style="font-size:.66rem;color:#94a3b8;margin-top:8px;">Sans prix, l'entrée reste « en attente de prix » (à compléter via une demande de prix).</div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;border-top:1px solid #f1f5f9;padding-top:14px;">
        <button onclick="document.getElementById('be-catalog-overlay').style.display='none'" style="background:#f1f5f9;color:#374151;border:none;border-radius:8px;padding:8px 16px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="beSaveCatalog()" style="background:linear-gradient(135deg,#059669,#047857);color:white;border:none;border-radius:8px;padding:8px 16px;font-weight:800;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i>Enregistrer</button>
      </div>
    </div>
  </div>

  <style>
  .nom-f-row{display:grid;grid-template-columns:130px 1fr 90px 70px 70px 110px 28px;gap:4px;margin-bottom:4px;align-items:center;}
  .nom-f-inp{border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 8px;font-size:.76rem;background:#f8fafc;outline:none;width:100%;min-width:0;text-overflow:ellipsis;box-sizing:border-box;}
  #nom-etapes-list > div, #nom-matieres-list > div, #nom-accessoires-list > div{min-width:0;}
  #nom-etapes-list > div > *, #nom-matieres-list > div > *, #nom-accessoires-list > div > *{min-width:0;}
  .nom-f-inp:focus{border-color:#8b5cf6;background:white;}
  </style>

  <script>
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
    var steps=[]; nomEtapes.forEach(function(e,i){ var isMach=(e.type==='interne')&&(e.machine_id||String(e.ressource||'').toLowerCase()==='machine'); if(isMach)steps.push({e:e,ord:e.ordre||(i+1)}); });
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
  function gedRenderAll(){ gedRenderZone('plan_client'); gedRenderZone('plan_cao'); nomRenderFaoList(); }
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
    }).catch(function(){});
  }
  function nomRefClientDel(id){
    fetch('/api/references-clients/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(){
      nomRefsClientsLoad(((document.getElementById('nom-f-code')||{}).value)||'');
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
      if(j&&j.ok){ inp.value=''; if(cat==='plan_cao'){ var pf=document.getElementById('nom-f-planfic'); if(pf&&!pf.value&&j.document)pf.value=j.document.fichier_nom; } gedLoad(); beNotif('ok','fa-check','Fichier joint.'); }
      else beNotif('err','fa-times',(j&&j.error)||'Echec de l envoi.');
    }).catch(function(){ beNotif('err','fa-times','Erreur reseau.'); });
  }
  async function gedDelete(id){ if(!await appConfirm('Supprimer ce fichier ?'))return; fetch('/api/ged/'+id,{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ gedLoad(); beNotif('ok','fa-check','Fichier supprimé.'); } else beNotif('err','fa-times',(j&&j.error)||'Echec.'); }).catch(function(){ beNotif('err','fa-times','Erreur reseau.'); }); }
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
  function beOpenCatalogModal(){
    document.getElementById('becat-id').value='';
    var t=document.getElementById('becat-title'); if(t)t.innerHTML='<i class="fas fa-book" style="color:#047857;margin-right:6px;"></i>Nouvelle entrée catalogue';
    ['becat-ref','becat-desig','becat-prix'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});
    document.getElementById('becat-cat').value='matiere_premiere'; document.getElementById('becat-act').value='both';
    beCatFillFourn('');
    document.getElementById('be-catalog-overlay').style.display='flex';
  }
  // Édition en place d'une référence depuis BE › Références (réutilise le même modal)
  function beEditCatalog(id, fid, ref, desig, cat, act){
    document.getElementById('becat-id').value=id||'';
    var t=document.getElementById('becat-title'); if(t)t.innerHTML='<i class="fas fa-pen" style="color:#047857;margin-right:6px;"></i>Modifier la référence';
    document.getElementById('becat-ref').value=ref||'';
    document.getElementById('becat-desig').value=desig||'';
    document.getElementById('becat-cat').value=cat||'matiere_premiere';
    document.getElementById('becat-act').value=act||'both';
    document.getElementById('becat-prix').value='';   // vide = ne change pas le prix (piloté par RFQ)
    beCatFillFourn(fid||'');
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
    var payload={ fournisseur_id:fid, fournisseur_nom:fnom, reference:ref, designation:desig,
      categorie:document.getElementById('becat-cat').value, prix:(isFinite(prixV)&&prixV>0)?prixV:null,
      activite:document.getElementById('becat-act').value, source_prix:'be' };
    var url=id?('/api/produits-fournisseurs/'+encodeURIComponent(id)):'/api/produits-fournisseurs';
    var method=id?'PUT':'POST';
    try{ var r=await fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); var j=await r.json();
      if(j&&j.ok){ beNotif('ok','fa-check', id?'Référence modifiée — actualisation…':'Entrée catalogue enregistrée — actualisation…'); setTimeout(function(){softReload();},700); }
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
  function beRfqOpen(origine){ document.getElementById('be-rfq-origine').value=origine||'libre'; var b=document.getElementById('be-rfq-lines'); if(b && !b.querySelector('.berfq-line')) beRfqAddLine(); document.getElementById('be-rfq-overlay').style.display='flex'; }
  // Depuis la liste catalogue : ouvre le modal pré-rempli avec la référence dont le prix est absent/périmé
  function beRfqForRef(ref, desig, cat){ document.getElementById('be-rfq-origine').value='catalogue'; var d=document.getElementById('be-rfq-dtref'); if(d)d.value=''; var b=document.getElementById('be-rfq-lines'); if(b) b.innerHTML=''; beRfqAddLine(); var tr=document.querySelector('#be-rfq-lines .berfq-line'); if(tr){ tr.querySelector('.br-ref').value=ref||''; tr.querySelector('.br-des').value=desig||ref||''; var cs=tr.querySelector('.br-cat'); if(cs&&cat)cs.value=cat; } document.getElementById('be-rfq-overlay').style.display='flex'; }
  function beRfqCollect(){ var out=[]; document.querySelectorAll('#be-rfq-lines .berfq-line').forEach(function(tr){ var des=tr.querySelector('.br-des').value.trim(); if(!des) return; var q=tr.querySelector('.br-qte').value; out.push({ reference:tr.querySelector('.br-ref').value.trim()||null, designation:des, quantite_estimee:(q!==''?parseFloat(q):null), categorie:tr.querySelector('.br-cat').value }); }); return out; }
  function beRfqSubmit(){
    var lignes=beRfqCollect();
    if(!lignes.length){ beNotif('err','fa-exclamation-circle','Ajoutez au moins un article (désignation).'); return; }
    var origine=document.getElementById('be-rfq-origine').value;
    var dtref=document.getElementById('be-rfq-dtref').value.trim()||null;
    var notes=document.getElementById('be-rfq-notes').value.trim()||null;
    // §6 : une demande de prix PAR référence
    var calls=lignes.map(function(l){ return fetch('/api/demandes-prix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ origine:origine, dt_ref:dtref, notes:notes, demandeur:'BE', lignes:[l] })}).then(function(r){return r.json();}).catch(function(){return {ok:false};}); });
    Promise.all(calls).then(function(res){
      var ok=res.filter(function(j){return j&&j.ok;});
      if(ok.length){ document.getElementById('be-rfq-overlay').style.display='none'; document.getElementById('be-rfq-lines').innerHTML=''; beNotif('ok','fa-paper-plane', ok.length>1 ? (ok.length+' demandes de prix envoyées aux Achats (une par référence).') : ('Demande de prix '+ok[0].numero+' envoyée aux Achats.')); }
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
  var nomMatieres    = [];   // [{ ref, designation, fournisseur, source_id, prix_tole, nb_par_tole }]
  var nomAccessoires = [];   // [{ ref, designation, fournisseur, source_id, prix_paquet, qte_paquet, nb_par_piece }]
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
    var payload = nomCollectPayload(nomCurrentStatut || 'en_cours');
    if(!payload.num_nom){ pushNotif('err','fa-exclamation-triangle','Le N° de nomenclature (réf. pièce) est obligatoire.'); return; }
    if(!await appConfirm('Créer la révision '+nomNextIndice(nomCurrentIndice)+' ? L\\'indice '+nomCurrentIndice+' actuel sera conservé.')) return;
    try{
      var res = await fetch('/api/nomenclature/'+payload.id+'/nouvel-indice', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      var data = await res.json();
      if(data.ok){
        var num = (data.data && data.data.num_nom) || data.num_nom || '';
        pushNotif('ok','fa-code-branch', (num?num+' — ':'') + 'Nouvel indice '+data.indice+' créé (révision '+nomCurrentIndice+' conservée).', 4500);
        setTimeout(function(){ window.location.replace('/be/service?'+Date.now()+'#noms'); }, 1000);
      } else { pushNotif('err','fa-ban', 'Erreur : '+(data.error||'inconnue')); }
    }catch(e){ pushNotif('err','fa-exclamation-circle','Erreur réseau : '+e.message); }
  }

  // Référentiels chargés côté serveur (machines avec taux horaire, fournisseurs ST, taux MO moyens)
  var BE_REFS_JS = ${sjX(BE_REFS)};
  var TAUX_MO_MOYEN     = BE_REFS_JS.taux_operateur.moyen || ${TAUX_MO_RESOLVED};
  var COUT_MACHINE_MOY  = ${COUT_MACHINE_AVG};

  var TYPES_FOURN = ['Matière première','Visserie / Boulonnerie','Composant acheté','Emballage','Consommable','Sous-traitance','Outillage','Autre'];

  // ── NOMENCLATURES STANDARD / MÈRE ────────────────────────────
  // Toutes les nomenclatures standard (pour le sélecteur de composants des mères)
  var NOM_STANDARDS = ${sjX(NOMS_STD.map((n:any)=>({id:n.id,num_nom:n.num_nom,code_ref_produit:n.code_ref_produit,description:n.description,prix_revient_unitaire:n.prix_revient_unitaire||0})))};
  // Toutes les révisions (toutes versions confondues) indexées par id → pour récupérer/ouvrir une révision
  var NOM_BY_ID = ${sjX(Object.fromEntries((NOMS as any[]).map(n => [String(n.id), n])))};
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
        setTimeout(function(){ window.location.replace('/be/service?'+Date.now()+'#noms'); },900);
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
    if (fourBlock) fourBlock.style.display = (t === 'mere') ? 'none' : 'block';
    if (t === 'mere') nomRenderComposants();
    nomCalcTotaux();
  }

  // ── Composants d'une mère (assemblage de standards) ──
  function nomAddComposant() {
    nomComposants.push({ nom_id:'', num_nom:'', code:'', prix:0, qte:1 });
    nomRenderComposants();
  }
  function nomRemoveComposant(i) { nomComposants.splice(i,1); nomRenderComposants(); nomCalcTotaux(); }
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
    nomCurrentId = null;
    GED_DOCS = []; gedRefreshUi(); gedRenderAll();   // GED : nouvelle nomenclature → zones masquées jusqu'à enregistrement
    nomCurrentStatut = 'brouillon';
    nomCurrentIndice = 'A';
    nomCurrentGroupe = null;
    nomFournitures = [];
    nomMatieres    = [];
    nomAccessoires = [];
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
    document.getElementById('nom-f-masse').value = '';
    document.getElementById('nom-f-dims').value = '';
    (document.getElementById('nom-f-surface')||{}).value = '';
    document.getElementById('nom-f-createur').value = '';
    document.getElementById('nom-f-notes').value = '';
    // Type → standard par défaut ; composants vidés
    nomComposants = [];
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
  function nomOpenForm(nom) {
    if (nom && nom.id) {
      ErpLock.acquire('nomenclature:' + nom.id, {
        onOk: function(){ nomOpenFormReal(nom); },
        onBlocked: function(by){ pushNotif('err','fa-lock','Nomenclature en cours d\\'édition par ' + by + ' — patientez qu\\'il ait terminé (la liste se met à jour en direct).', 7000); },
        onLost: function(by){ pushNotif('err','fa-lock', (by || 'Quelqu\\'un d\\'autre') + ' a pris la main sur cette nomenclature — enregistrez prudemment.', 7000); }
      });
    } else { nomOpenFormReal(nom); }
  }
  function nomOpenFormReal(nom) {
    nomCurrentId = nom.id || null;
    gedRefreshUi(); gedLoad();   // GED : charge les documents rattachés à cette nomenclature
    nomRefsClientsLoad(nom.code_ref_produit || nom.num_nom || '');   // répertoire clients de cette pièce
    nomCurrentStatut = nom.statut || 'brouillon';
    nomCurrentIndice = nom.indice || 'A';
    nomCurrentGroupe = nom.version_groupe || nom.id || null;
    nomFournitures = [];
    nomMatieres    = [];
    nomAccessoires = [];
    nomEtapes      = Array.isArray(nom.etapes_production) ? nom.etapes_production.slice() : [];
    // Compat anciennes étapes (temps_unitaire_min unique) → temps MO (+ machine si une machine était liée)
    nomEtapes.forEach(function(e){
      if (e.temps_mo_min == null && e.temps_machine_min == null && e.temps_unitaire_min != null) {
        e.temps_mo_min = e.temps_unitaire_min;
        e.temps_machine_min = (e.machine_id || e.machine_taux_h) ? e.temps_unitaire_min : 0;
      }
      // Gammes importées (temps en MILLIÈMES d'heure) → rendre réglage/MO/machine VISIBLES en minutes.
      //   millième → minutes = ×0.06 (×60/1000). Réglage = part fixe/lot ; MO ou machine selon la ressource du process.
      //   Le calcul de coût serveur reste basé sur les millièmes (source de vérité) ; ici on dérive l'affichage.
      var hasMille = (e.temps_variable_mille != null || e.temps_reglage_mille != null || e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null);
      if (hasMille && e.type == null) e.type = 'interne';   // gammes importées = procédés internes (ni ST)
      if (hasMille && e.temps_reglage_min == null && e.temps_mo_min == null && e.temps_machine_min == null) {
        var isMach = (e.ressource === 'machine');
        var varMin = (Number(e.temps_variable_mille) || 0) * 0.06;
        // ROP et RGM s'ils existent, sinon le champ historique impute a la ressource de l'etape.
        var aSplit = (e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null);
        var ropMin = aSplit ? (Number(e.temps_reglage_op_mille) || 0) * 0.06 : (isMach ? 0 : (Number(e.temps_reglage_mille) || 0) * 0.06);
        var rgmMin = aSplit ? (Number(e.temps_reglage_machine_mille) || 0) * 0.06 : (isMach ? (Number(e.temps_reglage_mille) || 0) * 0.06 : 0);
        if (e.est_fixe) { if (isMach) { rgmMin += varMin; } else { ropMin += varMin; } varMin = 0; }   // operation fixe = comptee par lot
        var r2 = function(x){ return Math.round(x * 100) / 100; };
        e.temps_reglage_min = r2(ropMin);
        e.temps_reglage_machine_min = r2(rgmMin);
        e.temps_mo_min      = r2(isMach ? 0 : varMin);
        e.temps_machine_min = r2(isMach ? varMin : 0);
        if (e.taux_mo_h == null) e.taux_mo_h = Number(nom.taux_mo) || TAUX_MO_MOYEN;
        if (isMach && e.machine_taux_h == null) e.machine_taux_h = Number(nom.cout_machine_h) || 50;
        if (isMach && !e.machine_nom) e.machine_nom = e.process_nom || '';
      }
    });
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
    nomComposants = (nt === 'mere' && Array.isArray(nom.composants))
      ? nom.composants.map(function(c){ return { nom_id:c.nom_id||'', num_nom:c.num_nom||'', code:c.code||'', prix:c.prix||0, qte:c.qte!=null?c.qte:1 }; })
      : [];
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
    fetch('/api/nomenclature/' + encodeURIComponent(id) + '/fournitures')
      .then(function(r){ return r.json(); })
      .then(function(j){
        if (!j || !j.ok || !Array.isArray(j.fournitures)) return;
        nomMatieres = []; nomAccessoires = [];
        // Résout l'id fournisseur depuis le nom enregistré → re-sélectionne la liste déroulante
        var _fid = function(nom){ var f = (NOM_FOURNISSEURS||[]).find(function(x){ return String(x.nom||'').toLowerCase().trim() === String(nom||'').toLowerCase().trim(); }); return f?f.id:''; };
        j.fournitures.forEach(function(f){
          if (f.categorie === 'matiere') {
            nomMatieres.push({ ref:f.ref_stock||'', designation:f.designation||'', fournisseur:f.fournisseur||'', source_id:_fid(f.fournisseur),
              prix_tole: parseFloat(f.prix_unitaire)||0, nb_par_tole: parseFloat(f.nb_par_tole)||1 });
          } else {
            // accessoire (ou ancienne fourniture sans catégorie → traitée en accessoire)
            nomAccessoires.push({ ref:f.ref_stock||'', designation:f.designation||'', fournisseur:f.fournisseur||'', source_id:_fid(f.fournisseur),
              prix_paquet: parseFloat(f.prix_unitaire)||0,
              qte_paquet: (f.qte_paquet!=null ? parseFloat(f.qte_paquet)||1 : 1),
              nb_par_piece: parseFloat(f.quantite_par_piece)||1 });
          }
        });
        nomRenderMatieres(); nomRenderAccessoires(); nomCalcTotaux();
      })
      .catch(function(){ /* silent */ });
  }

  function nomCloseForm() {
    if (nomCurrentId) ErpLock.release('nomenclature:' + nomCurrentId);   // relâche le verrou d'édition
    document.getElementById('nom-form-view').style.display = 'none';
    document.getElementById('nom-list-view').style.display = 'block';
  }

  // ── FOURNITURES : Matière (tôle) + Accessoires ───────────────
  function nomAddMatiere() {
    nomMatieres.push({ ref:'', designation:'', fournisseur:'', source_id:'', prix_tole:0, nb_par_tole:1 });
    nomRenderMatieres();
  }
  function nomRemoveMatiere(idx) { nomMatieres.splice(idx,1); nomRenderMatieres(); nomCalcTotaux(); }
  function nomAddAccessoire() {
    nomAccessoires.push({ ref:'', designation:'', fournisseur:'', source_id:'', prix_paquet:0, qte_paquet:1, nb_par_piece:1 });
    nomRenderAccessoires();
  }
  function nomRemoveAccessoire(idx) { nomAccessoires.splice(idx,1); nomRenderAccessoires(); nomCalcTotaux(); }

  // ── Fournisseurs (réels) pour l'autocomplétion nomenclature — SOURCE d'abord ──
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
  // Prix « frais » = daté de moins de 6 mois ET non nul (au-delà -> nouvelle demande de prix)
  function nomPrixFrais(datePrix, prix){ if(prix==null||prix==='') return false; if(!datePrix) return false; var t=Date.parse(datePrix); if(isNaN(t)) return false; return (Date.now()-t) < (183*86400000); }
  function nomMatProds(sid){ return NOM_PRODUITS.filter(function(p){ return String(p.fournisseur_id)===String(sid) && p.categorie==='matiere_premiere'; }); }
  function nomMatProdByRef(sid, ref){ return nomMatProds(sid).find(function(p){ return String(p.reference)===String(ref); }) || null; }
  function nomMatProdByDes(sid, des){ return nomMatProds(sid).find(function(p){ return String(p.designation||'').trim()===String(des||'').trim(); }) || null; }
  // §4 : sélection RÉF d'abord (tous fournisseurs visibles), PUIS le fournisseur
  function nomMatProdsAll(){
    var vis={}; nomFournVisibles('matiere').forEach(function(f){ vis[String(f.id)]=1; });
    return NOM_PRODUITS.filter(function(p){ return p.categorie==='matiere_premiere' && vis[String(p.fournisseur_id)]; });
  }
  function nomMatProdByRefAny(ref){ return nomMatProdsAll().find(function(p){ return String(p.reference)===String(ref); }) || null; }
  function nomMatProdByDesAny(des){ return nomMatProdsAll().find(function(p){ return String(p.designation||'').trim()===String(des||'').trim(); }) || null; }
  function nomMatSuppliersForRef(ref){
    var seen={}, out=[];
    nomMatProdsAll().forEach(function(p){ if(String(p.reference)===String(ref) && !seen[String(p.fournisseur_id)]){ seen[String(p.fournisseur_id)]=1; var f=nomFournById(p.fournisseur_id); if(f) out.push(f); } });
    return out;
  }
  function nomMatFournSelect(i, m){
    if(!(m.ref||m.designation)) return '<select class="nom-f-inp" disabled><option>— choisir une référence —</option></select>';
    var sups = m.ref ? nomMatSuppliersForRef(m.ref) : [];
    var list = sups.length ? sups : nomFournVisibles('matiere');
    var opts = list.map(function(f){ return '<option value="'+f.id+'"'+(String(m.source_id)===String(f.id)?' selected':'')+'>'+String(f.nom||'?').replace(/</g,'&lt;')+'</option>'; }).join('');
    return '<select class="nom-f-inp" onchange="nomMatiereSetFourn('+i+',this.value)"><option value="">'+(sups.length?'— Fournisseur —':'— Fournisseur (à chiffrer) —')+'</option>'+opts+'</select>';
  }
  function nomEntiteActuelle(){ var ent=document.getElementById('nom-f-entite'); return ent?ent.value:''; }
  // Un fournisseur "fournit" une famille (matiere/accessoire) s'il est tagué (familles_fourniture) OU s'il a une réf de cette catégorie
  function nomFournFournit(f, cat){
    var fam = (f && Array.isArray(f.familles_fourniture)) ? f.familles_fourniture : [];
    if(cat === 'matiere') return fam.indexOf('matiere') >= 0;  // §1 : uniquement les fournisseurs avec la case « matière » cochée
    if(fam.indexOf(cat) >= 0) return true;
    var c = (f && Array.isArray(f.catalogue)) ? f.catalogue : [];
    if(c.some(function(it){ return it && it.categorie===cat; })) return true;
    // Accessoire : un fournisseur « fournit » aussi la famille s'il porte une réf de cette catégorie au catalogue produits_fournisseurs
    return !!(f && NOM_PRODUITS.some(function(p){ return String(p.fournisseur_id)===String(f.id) && p.categorie===cat; }));
  }
  // Tous les fournisseurs de l'entité courante (toutes familles) — pour assigner un accessoire NOUVEAU (réf absente de tout catalogue)
  function nomFournAll(){
    var actv = nomEntiteActuelle();
    return NOM_FOURNISSEURS.filter(function(f){ var a=f.activite; return !actv || actv==='both' || !a || a==='both' || a===actv; });
  }
  function nomFournVisibles(cat){
    var actv = nomEntiteActuelle();
    return NOM_FOURNISSEURS.filter(function(f){
      var a=f.activite; var actOk = !actv || actv==='both' || !a || a==='both' || a===actv;
      return actOk && nomFournFournit(f, cat);
    });
  }
  function nomFournById(id){ return NOM_FOURNISSEURS.find(function(f){ return String(f.id)===String(id); }) || null; }
  function nomFournItems(f, cat){ var c=(f&&Array.isArray(f.catalogue))?f.catalogue:[]; return c.filter(function(it){ return it && (it.categorie===cat || !it.categorie); }); }
  // Case 1 : liste déroulante des FOURNISSEURS de la famille
  function nomFournSelect(cat, selId, onchange){
    var opts = nomFournVisibles(cat).map(function(f){ return '<option value="'+f.id+'"'+(String(selId)===String(f.id)?' selected':'')+'>'+String(f.nom||'?').replace(/</g,'&lt;')+'</option>'; }).join('');
    return '<select class="nom-f-inp" onchange="'+onchange+'"><option value="">— Fournisseur —</option>'+opts+'</select>';
  }
  // Case 2 : liste déroulante des RÉFS au catalogue du fournisseur choisi (filtrées par famille)
  function nomRefSelect(f, cat, selRef, onchange){
    if(!f) return '<select class="nom-f-inp" disabled><option value="">— choisir fournisseur —</option></select>';
    var seen={}; var items = nomFournItems(f,cat).filter(function(it){ if(!it.ref||seen[it.ref])return false; seen[it.ref]=1; return true; });
    if(items.length===0) return '<select class="nom-f-inp" disabled><option value="">(aucune réf au catalogue)</option></select>';
    var opts = items.map(function(it){ return '<option value="'+(it.ref||'').replace(/"/g,'&quot;')+'"'+(selRef===it.ref?' selected':'')+'>'+((it.ref||'')+' — '+(it.designation||'')).replace(/</g,'&lt;')+'</option>'; }).join('');
    return '<select class="nom-f-inp" onchange="'+onchange+'"><option value="">— Réf catalogue —</option>'+opts+'</select>';
  }
  // Re-render quand l'entité (Seem/Semrac) change → re-filtre les fournisseurs visibles
  document.addEventListener('change', function(e){ if(e.target && e.target.id === 'nom-f-entite'){ nomRenderMatieres(); nomRenderAccessoires(); nomRenderEtapes(); } });
  if(document.readyState !== 'loading'){ setTimeout(function(){ nomRenderMatieres(); nomRenderAccessoires(); }, 0); }
  else document.addEventListener('DOMContentLoaded', function(){ nomRenderMatieres(); nomRenderAccessoires(); });

  // ── Matière (§4) : RÉF/désignation d'abord → fournisseur(s) possibles → prix ──
  function nomMatiereSetRef(i, ref){
    var m=nomMatieres[i]; m.ref=ref; m.rfq_pending=false;
    var p=nomMatProdByRefAny(ref); if(p && !m.designation) m.designation=p.designation||'';
    var sups=nomMatSuppliersForRef(ref);
    if(sups.length===1){ m.source_id=sups[0].id; m.fournisseur=sups[0].nom; }
    else if(!sups.some(function(f){return String(f.id)===String(m.source_id);})){ m.source_id=''; m.fournisseur=''; }
    nomMatiereApplyPrix(m); nomRenderMatieres(); nomCalcTotaux();
  }
  function nomMatiereSetDes(i, des){
    var m=nomMatieres[i]; m.designation=des; m.rfq_pending=false;
    var p=nomMatProdByDesAny(des);
    if(p){ if(!m.ref) m.ref=p.reference||''; var sups=nomMatSuppliersForRef(p.reference); if(sups.length===1){ m.source_id=sups[0].id; m.fournisseur=sups[0].nom; } }
    nomMatiereApplyPrix(m); nomRenderMatieres(); nomCalcTotaux();
  }
  function nomMatiereSetFourn(i, fId){
    var f=nomFournById(fId); var m=nomMatieres[i];
    m.source_id=fId; m.fournisseur=f?f.nom:''; m.rfq_pending=false;
    nomMatiereApplyPrix(m); nomRenderMatieres(); nomCalcTotaux();
  }
  // §3 : prix tôle = prix catalogue si < 6 mois ; sinon 0 et statut pour proposer une demande de prix
  function nomMatiereApplyPrix(m){
    m._prixStatus = 'none'; m._prixDate = null;
    if(!m.source_id || !(m.ref || m.designation)){ if(m.rfq_pending) m._prixStatus='pending'; m.prix_tole = 0; return; }
    var p = m.ref ? nomMatProdByRef(m.source_id, m.ref) : nomMatProdByDes(m.source_id, m.designation);
    if(p){ m._prixDate = p.date_prix; if(!m.designation) m.designation = p.designation||''; if(!m.ref && p.reference) m.ref = p.reference;
      if(nomPrixFrais(p.date_prix, p.prix)){ m.prix_tole = parseFloat(p.prix)||0; m._prixStatus='fresh'; m.rfq_pending=false; return; }
    }
    m.prix_tole = 0; m._prixStatus = m.rfq_pending ? 'pending' : 'stale';
  }
  // §3 cas 2 : créer une demande de prix pour cette ligne (réf + désignation + quantité de la ligne)
  function nomMatiereRFQ(i){
    var m = nomMatieres[i];
    if(!m.source_id || !(m.ref || m.designation)){ beNotif('err','fa-exclamation-circle','Choisissez un fournisseur et une référence/désignation.'); return; }
    var nref = (document.querySelector('#nom-f-ref,#nom-f-designation,#nom-f-piece,#nom-f-nom,#nom-f-libelle')||{}).value || '';
    var payload = { origine:'nomenclature', dt_ref:nref||null, demandeur:'BE',
      lignes:[{ reference:m.ref||null, designation:m.designation||m.ref||'Matière', quantite_estimee:(parseFloat(m.nb_par_tole)||null), categorie:'matiere_premiere' }] };
    fetch('/api/demandes-prix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ m.rfq_pending=true; m._rfqNum=j.numero; nomMatiereApplyPrix(m); nomRenderMatieres(); beNotif('ok','fa-paper-plane','Demande de prix '+j.numero+' envoyée aux Achats.'); } else beNotif('err','fa-ban','Échec de la demande.'); })
      .catch(function(){ beNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  // §5 : vérifier si la réponse RFQ est arrivée → MAJ prix + recalcul
  function nomMatiereCheckPrix(i){
    var m = nomMatieres[i]; if(!m.ref && !m.designation) return;
    fetch('/api/produit-prix?fournisseur='+encodeURIComponent(m.source_id||'')+'&reference='+encodeURIComponent(m.ref||''))
      .then(function(r){return r.json();}).then(function(j){
        if(j&&j.ok && nomPrixFrais(j.date_prix, j.prix)){ m.prix_tole=parseFloat(j.prix)||0; m.rfq_pending=false; m._prixStatus='fresh'; if(j.designation&&!m.designation)m.designation=j.designation; nomRenderMatieres(); nomCalcTotaux(); beNotif('ok','fa-check','Prix reçu : '+(parseFloat(j.prix)||0).toFixed(2)+' € — coûts recalculés.'); }
        else beNotif('ok','fa-clock','Pas encore de réponse pour cette référence.');
      }).catch(function(){});
  }
  // §5 : au retour sur l'onglet, rafraîchit automatiquement les lignes en attente
  if(!window.__nomMatFocusBound){ window.__nomMatFocusBound=true; window.addEventListener('focus', function(){
    if(!Array.isArray(nomMatieres)) return;
    nomMatieres.forEach(function(m){ if(!(m.rfq_pending && (m.ref||m.designation))) return;
      fetch('/api/produit-prix?fournisseur='+encodeURIComponent(m.source_id||'')+'&reference='+encodeURIComponent(m.ref||''))
        .then(function(r){return r.json();}).then(function(j){ if(j&&j.ok && nomPrixFrais(j.date_prix, j.prix)){ m.prix_tole=parseFloat(j.prix)||0; m.rfq_pending=false; m._prixStatus='fresh'; nomRenderMatieres(); nomCalcTotaux(); } }).catch(function(){});
    });
  }); }
  function nomMatierePrixPiece(m){ var n=parseFloat(m.nb_par_tole)||0; return n>0 ? ((parseFloat(m.prix_tole)||0)/n) : 0; }
  function nomRenderMatieres(){
    var c = document.getElementById('nom-matieres-list'); if(!c) return;
    if(nomMatieres.length===0){ c.innerHTML = '<div style="text-align:center;padding:14px;color:#9ca3af;font-size:.76rem;border:1.5px dashed #e2e8f0;border-radius:8px;">Aucune matière — cliquez « Ajouter matière »</div>'; return; }
    c.innerHTML = nomMatieres.map(function(m,i){
      nomMatiereApplyPrix(m);
      var pp = nomMatierePrixPiece(m).toFixed(4);
      var all = nomMatProdsAll();
      var refDl='matdl-ref-'+i, desDl='matdl-des-'+i, seenR={}, seenD={};
      var refOpts = all.filter(function(p){ if(!p.reference||seenR[p.reference])return false; seenR[p.reference]=1; return true; }).map(function(p){ return '<option value="'+(p.reference||'').replace(/"/g,'&quot;')+'">'+(p.designation||'').replace(/"/g,'&quot;')+'</option>'; }).join('');
      var desOpts = all.filter(function(p){ var d=(p.designation||'').trim(); if(!d||seenD[d])return false; seenD[d]=1; return true; }).map(function(p){ return '<option value="'+(p.designation||'').replace(/"/g,'&quot;')+'">'+(p.reference||'').replace(/"/g,'&quot;')+'</option>'; }).join('');
      var priceCell;
      if(m._prixStatus==='fresh'){ priceCell='<div title="Prix catalogue de moins de 3 mois" style="text-align:right;font-size:.78rem;font-weight:800;color:#0ea5e9;padding:5px 4px;">'+(parseFloat(m.prix_tole)||0).toFixed(2)+' €</div>'; }
      else if(m._prixStatus==='pending'){ priceCell='<button onclick="nomMatiereCheckPrix('+i+')" title="Demande envoyée — vérifier la réponse" style="font-size:.62rem;font-weight:700;border:none;border-radius:6px;padding:5px 3px;background:#fef3c7;color:#92400e;cursor:pointer;line-height:1.1;"><i class="fas fa-hourglass-half"></i> vérifier</button>'; }
      else if(m.source_id && (m.ref||m.designation)){ priceCell='<button onclick="nomMatiereRFQ('+i+')" title="Aucun prix récent — demander un prix aux Achats" style="font-size:.58rem;font-weight:700;border:none;border-radius:6px;padding:4px 3px;background:#dbeafe;color:#1d4ed8;cursor:pointer;line-height:1.05;"><i class="fas fa-file-invoice-dollar"></i> demande<br>de prix</button>'; }
      else { priceCell='<div style="text-align:right;color:#cbd5e1;padding:5px 4px;">—</div>'; }
      return '<div style="margin-bottom:4px;">'
        + '<div style="display:grid;grid-template-columns:130px 1fr 150px 104px 56px 64px 24px;gap:4px;align-items:center;">'
        + '<input class="nom-f-inp" list="'+refDl+'" placeholder="Réf. matière" value="'+(m.ref||'').replace(/"/g,'&quot;')+'" onchange="nomMatiereSetRef('+i+',this.value)"/>'
        + '<input class="nom-f-inp" list="'+desDl+'" placeholder="Désignation" value="'+(m.designation||'').replace(/"/g,'&quot;')+'" onchange="nomMatiereSetDes('+i+',this.value)"/>'
        + nomMatFournSelect(i, m)
        + priceCell
        + '<input class="nom-f-inp" type="number" step="1" min="1" placeholder="Pc" value="'+(m.nb_par_tole||1)+'" oninput="nomMatieres['+i+'].nb_par_tole=parseFloat(this.value)||0;nomCalcTotaux();" onchange="nomRenderMatieres()" style="text-align:right;"/>'
        + '<div style="text-align:right;font-size:.74rem;font-weight:700;color:#0ea5e9;padding:5px 4px;">'+pp+' €</div>'
        + '<button onclick="nomRemoveMatiere('+i+')" title="Supprimer" style="width:24px;height:24px;border-radius:6px;border:none;background:#fee2e2;color:#dc2626;cursor:pointer;font-weight:700;">×</button>'
        + '</div>'
        + '<datalist id="'+refDl+'">'+refOpts+'</datalist><datalist id="'+desDl+'">'+desOpts+'</datalist>'
        + '</div>';
    }).join('');
    nomCalcTotaux();
  }

  // ── Accessoires : RÉF d'abord (catalogue produits_fournisseurs, comme la matière) → fournisseurs qui l'ont → prix/qté auto ──
  function nomAccProds(sid){ return NOM_PRODUITS.filter(function(p){ return String(p.fournisseur_id)===String(sid) && p.categorie==='accessoire'; }); }
  // TOUTES les réfs accessoires existantes (déroulement complet dans la datalist) — non filtré par « fournisseur visible »
  // (sinon un fournisseur non tagué « accessoire » masquait ses réfs). Filtre d'activité indulgent : garde si activité inconnue/compatible.
  function nomAccProdsAll(){
    var actv = nomEntiteActuelle();
    return NOM_PRODUITS.filter(function(p){
      if(p.categorie!=='accessoire') return false;
      if(!actv) return true;
      var f = nomFournById(p.fournisseur_id); var a = f ? f.activite : null;
      return !a || a==='both' || a===actv;
    });
  }
  function nomAccProdByRefAny(ref){ return nomAccProdsAll().find(function(p){ return String(p.reference)===String(ref); }) || null; }
  function nomAccProdByDesAny(des){ return nomAccProdsAll().find(function(p){ return String(p.designation||'').trim()===String(des||'').trim(); }) || null; }
  function nomAccSuppliersForRef(ref){
    var seen={}, out=[];
    nomAccProdsAll().forEach(function(p){ if(String(p.reference)===String(ref) && !seen[String(p.fournisseur_id)]){ seen[String(p.fournisseur_id)]=1; var f=nomFournById(p.fournisseur_id); if(f) out.push(f); } });
    return out;
  }
  function nomAccFournSelect(i, a){
    if(!(a.ref||a.designation)) return '<select class="nom-f-inp" disabled><option>— choisir une référence —</option></select>';
    // Réf connue → seuls les fournisseurs qui portent cette réf au catalogue ; réf nouvelle → tous les fournisseurs de l'entité
    var sups = a.ref ? nomAccSuppliersForRef(a.ref) : [];
    var list = sups.length ? sups : nomFournAll();
    var opts = list.map(function(f){ return '<option value="'+f.id+'"'+(String(a.source_id)===String(f.id)?' selected':'')+'>'+String(f.nom||'?').replace(/</g,'&lt;')+'</option>'; }).join('');
    return '<select class="nom-f-inp" onchange="nomAccSetFourn('+i+',this.value)"><option value="">'+(sups.length?'— Fournisseur —':'— Fournisseur (à chiffrer) —')+'</option>'+opts+'</select>';
  }
  function nomAccApplyProd(a, p){ if(!p) return; if(!a.designation) a.designation = p.designation||''; if(!a.ref && p.reference) a.ref = p.reference; if(p.prix!=null) a.prix_paquet = parseFloat(p.prix)||a.prix_paquet||0; if(p.conditionnement!=null && parseFloat(p.conditionnement)>0) a.qte_paquet = parseFloat(p.conditionnement); }
  function nomAccSetRef(i, ref){
    var a = nomAccessoires[i]; a.ref = ref;
    var sups = nomAccSuppliersForRef(ref);
    if(sups.length===1){ a.source_id = sups[0].id; a.fournisseur = sups[0].nom; }   // une seule source → auto-sélection
    var p = a.source_id ? nomAccProds(a.source_id).find(function(x){ return String(x.reference)===String(ref); }) : nomAccProdByRefAny(ref);
    nomAccApplyProd(a, p);
    nomRenderAccessoires(); nomCalcTotaux();
  }
  function nomAccSetDes(i, des){
    var a = nomAccessoires[i]; a.designation = des;
    if(!a.ref){ var p = nomAccProdByDesAny(des); if(p){ a.ref = p.reference||''; var sups=nomAccSuppliersForRef(a.ref); if(sups.length===1){ a.source_id=sups[0].id; a.fournisseur=sups[0].nom; } nomAccApplyProd(a, p); } }
    nomRenderAccessoires(); nomCalcTotaux();
  }
  function nomAccSetFourn(i, fId){
    var a = nomAccessoires[i]; var f = nomFournById(fId); a.source_id = fId; a.fournisseur = f ? f.nom : '';
    if(a.ref){ var p = nomAccProds(fId).find(function(x){ return String(x.reference)===String(a.ref); }); nomAccApplyProd(a, p); }
    nomRenderAccessoires(); nomCalcTotaux();
  }
  function nomAccPrixPiece(a){ var q=parseFloat(a.qte_paquet)||0; return q>0 ? (((parseFloat(a.prix_paquet)||0)/q)*(parseFloat(a.nb_par_piece)||0)) : 0; }
  // Prix accessoire = prix CATALOGUE si < 6 mois ; sinon 0 + statut → bouton « demande de prix » (PAS de saisie manuelle du prix)
  function nomAccApplyPrixStatus(a){
    a._prixStatus='none';
    if(!(a.ref||a.designation)){ if(a.rfq_pending) a._prixStatus='pending'; return; }
    var p = a.source_id ? nomAccProds(a.source_id).find(function(x){ return String(x.reference)===String(a.ref); }) : nomAccProdByRefAny(a.ref);
    if(!p && a.designation) p = nomAccProdByDesAny(a.designation);
    if(p && nomPrixFrais(p.date_prix, p.prix)){ a.prix_paquet=parseFloat(p.prix)||0; a._prixStatus='fresh'; a.rfq_pending=false; return; }
    a.prix_paquet=0; a._prixStatus = a.rfq_pending ? 'pending' : ((a.source_id && (a.ref||a.designation)) ? 'stale' : 'none');
  }
  function nomAccRFQ(i){
    var a = nomAccessoires[i];
    if(!(a.ref || a.designation)){ beNotif('err','fa-exclamation-circle','Choisissez une référence ou une désignation.'); return; }
    var nref = (document.querySelector('#nom-f-ref,#nom-f-designation,#nom-f-piece,#nom-f-nom,#nom-f-libelle')||{}).value || '';
    var payload = { origine:'nomenclature', dt_ref:nref||null, demandeur:'BE',
      lignes:[{ reference:a.ref||null, designation:a.designation||a.ref||'Accessoire', quantite_estimee:(parseFloat(a.nb_par_piece)||null), categorie:'accessoire' }] };
    fetch('/api/demandes-prix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ a.rfq_pending=true; a._rfqNum=j.numero; nomRenderAccessoires(); beNotif('ok','fa-paper-plane','Demande de prix '+j.numero+' envoyée aux Achats.'); } else beNotif('err','fa-ban','Échec de la demande.'); })
      .catch(function(){ beNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  function nomAccRFQCheck(i){
    var a = nomAccessoires[i]; if(!a.ref && !a.designation) return;
    fetch('/api/produit-prix?fournisseur='+encodeURIComponent(a.source_id||'')+'&reference='+encodeURIComponent(a.ref||''))
      .then(function(r){return r.json();}).then(function(j){
        if(j&&j.ok && nomPrixFrais(j.date_prix, j.prix)){ a.prix_paquet=parseFloat(j.prix)||0; a.rfq_pending=false; a._prixStatus='fresh'; if(j.designation&&!a.designation)a.designation=j.designation; nomRenderAccessoires(); nomCalcTotaux(); beNotif('ok','fa-check','Prix reçu : '+(parseFloat(j.prix)||0).toFixed(2)+' € — coûts recalculés.'); }
        else beNotif('ok','fa-clock','Pas encore de réponse pour cette référence.');
      }).catch(function(){});
  }
  function nomRenderAccessoires(){
    var c = document.getElementById('nom-accessoires-list'); if(!c) return;
    if(nomAccessoires.length===0){ c.innerHTML = '<div style="text-align:center;padding:14px;color:#9ca3af;font-size:.76rem;border:1.5px dashed #e2e8f0;border-radius:8px;">Aucun accessoire — cliquez « Ajouter accessoire »</div>'; return; }
    var all = nomAccProdsAll();
    c.innerHTML = nomAccessoires.map(function(a,i){
      nomAccApplyPrixStatus(a);
      var pp = nomAccPrixPiece(a).toFixed(4);
      var refDl='accdl-ref-'+i, desDl='accdl-des-'+i, seenR={}, seenD={};
      var refOpts = all.filter(function(p){ if(!p.reference||seenR[p.reference])return false; seenR[p.reference]=1; return true; }).map(function(p){ return '<option value="'+(p.reference||'').replace(/"/g,'&quot;')+'">'+(p.designation||'').replace(/"/g,'&quot;')+'</option>'; }).join('');
      var desOpts = all.filter(function(p){ var d=(p.designation||'').trim(); if(!d||seenD[d])return false; seenD[d]=1; return true; }).map(function(p){ return '<option value="'+(p.designation||'').replace(/"/g,'&quot;')+'">'+(p.reference||'').replace(/"/g,'&quot;')+'</option>'; }).join('');
      var priceCell;
      if(a._prixStatus==='fresh'){ priceCell='<div title="Prix catalogue de moins de 6 mois" style="text-align:right;font-size:.78rem;font-weight:800;color:#0ea5e9;padding:5px 4px;">'+(parseFloat(a.prix_paquet)||0).toFixed(2)+' €</div>'; }
      else if(a._prixStatus==='pending'){ priceCell='<button onclick="nomAccRFQCheck('+i+')" title="Demande envoyée — vérifier la réponse" style="font-size:.62rem;font-weight:700;border:none;border-radius:6px;padding:5px 3px;background:#fef3c7;color:#92400e;cursor:pointer;line-height:1.1;"><i class="fas fa-hourglass-half"></i> vérifier</button>'; }
      else if(a.source_id && (a.ref||a.designation)){ priceCell='<button onclick="nomAccRFQ('+i+')" title="Aucun prix récent au catalogue — demander un prix aux Achats" style="font-size:.58rem;font-weight:700;border:none;border-radius:6px;padding:4px 3px;background:#dbeafe;color:#1d4ed8;cursor:pointer;line-height:1.05;"><i class="fas fa-file-invoice-dollar"></i> demande<br>de prix</button>'; }
      else { priceCell='<div style="text-align:right;color:#cbd5e1;padding:5px 4px;">—</div>'; }
      return '<div style="margin-bottom:4px;">'
        + '<div style="display:grid;grid-template-columns:130px 1fr 150px 92px 58px 54px 70px 24px;gap:4px;align-items:center;">'
        + '<input class="nom-f-inp" list="'+refDl+'" placeholder="Réf. (ou nouvelle)" value="'+(a.ref||'').replace(/"/g,'&quot;')+'" onchange="nomAccSetRef('+i+',this.value)"/>'
        + '<input class="nom-f-inp" list="'+desDl+'" placeholder="Désignation" value="'+(a.designation||'').replace(/"/g,'&quot;')+'" onchange="nomAccSetDes('+i+',this.value)"/>'
        + nomAccFournSelect(i, a)
        + priceCell
        + '<input class="nom-f-inp" type="number" step="0.001" min="0" placeholder="Qté" value="'+(a.qte_paquet||1)+'" oninput="nomAccessoires['+i+'].qte_paquet=parseFloat(this.value)||0;nomCalcTotaux();" onchange="nomRenderAccessoires()" style="text-align:right;"/>'
        + '<input class="nom-f-inp" type="number" step="0.001" min="0" placeholder="Nb" value="'+(a.nb_par_piece||1)+'" oninput="nomAccessoires['+i+'].nb_par_piece=parseFloat(this.value)||0;nomCalcTotaux();" onchange="nomRenderAccessoires()" style="text-align:right;"/>'
        + '<div style="text-align:right;font-size:.74rem;font-weight:700;color:#8b5cf6;padding:5px 6px;">'+pp+' €</div>'
        + '<button onclick="nomRemoveAccessoire('+i+')" title="Supprimer" style="width:24px;height:24px;border-radius:6px;border:none;background:#fee2e2;color:#dc2626;cursor:pointer;font-weight:700;">×</button>'
        + '</div>'
        + '<datalist id="'+refDl+'">'+refOpts+'</datalist><datalist id="'+desDl+'">'+desOpts+'</datalist>'
        + '</div>';
    }).join('');
    nomCalcTotaux();
  }

  // ── ÉTAPES DE PRODUCTION ─────────────────────────────────────
  // Une étape = { ordre, nom, type ('interne'|'sous_traite'),
  //               process_id, process_nom, machine_id, machine_nom, machine_taux_h,
  //               temps_reglage_min, temps_mo_min, temps_machine_min, taux_mo_h,
  //               operation_st, fournisseur_st_id, fournisseur_st_nom,
  //               forfait_st_ht, prix_unitaire_st_ht, cout_st_unitaire }
  // Coût interne/pièce = taux_mo × (temps_mo + réglage)/60 + taux_machine × temps_machine/60
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
      taux_mo_h: TAUX_MO_MOYEN,
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
      nomEtapes[idx].temps_machine_min = 0;
    }
    nomRenderEtapes();
  }

  // Interne : choix d'un process → machine liée auto-renseignée (ou MO seule si manuel) ; le poste suit le process
  function nomOnEtapeProcessChange(idx, processId) {
    var p = (BE_REFS_JS.process_atelier || []).find(function(x){ return x.id === processId; });
    nomEtapes[idx].process_id = processId;
    nomEtapes[idx].process_nom = p ? p.nom : '';
    if (p && p.poste_id) nomEtapes[idx].poste_id = p.poste_id;   // le process fixe le poste (cohérence)
    if (p && !nomEtapes[idx].nom) nomEtapes[idx].nom = p.nom;
    var m = (p && p.requiert_machine && p.machine_id)
      ? BE_REFS_JS.machines.find(function(x){ return x.id === p.machine_id; })
      : null;
    nomEtapes[idx].machine_id = m ? m.id : '';
    nomEtapes[idx].machine_nom = m ? m.nom : '';
    nomEtapes[idx].machine_taux_h = m ? (Number(m.cout_h != null ? m.cout_h : m.taux_horaire) || 0) : 0;   // taux horaire machine du process = coût machine du CRU
    // Process manuel (sans machine) → pas de temps machine
    if (!m) nomEtapes[idx].temps_machine_min = 0;
    // OAS : le traitement de surface se chiffre au PRIX, pas au temps. On bascule l'étape et on
    // remet les temps à zéro pour qu'aucun coût horaire résiduel ne vienne s'ajouter au prix.
    var oas = nomEstProcessOAS(p);
    nomEtapes[idx].est_oas = oas;
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

  // Coût unitaire d'une étape :
  //   - Interne : taux_mo × (temps_mo + réglage)/60 + taux_machine × temps_machine/60
  //   - Sous-traitée : prix unitaire pièce du ST (le forfait est appliqué comme plancher à la commande)
  function nomEtapeCoutMO(e) { return ((e.temps_mo_min||0) + (e.temps_reglage_min||0))/60 * (e.taux_mo_h || TAUX_MO_MOYEN); }
  // Part RÉGLAGE du coût MO d'une étape (fixe / lot — ne se multiplie pas avec la quantité produite).
  // ROP au taux MO + RGM au taux machine — les deux sont fixes par lot.
  function nomEtapeCoutReglage(e) { return (e.temps_reglage_min||0)/60 * (e.taux_mo_h || TAUX_MO_MOYEN) + (e.temps_reglage_machine_min||0)/60 * (e.machine_taux_h || nomMachCoutH(e.machine_id) || 0); }
  function nomMachCoutH(mid){ if(!mid) return 0; var m=(BE_REFS_JS.machines||[]).find(function(x){return String(x.id)===String(mid);}); return m?(Number(m.cout_h!=null?m.cout_h:m.taux_horaire)||0):0; }
  function nomEtapeCoutMachine(e) { return ((e.temps_machine_min||0) + (e.temps_reglage_machine_min||0))/60 * (e.machine_taux_h || nomMachCoutH(e.machine_id) || 0); }   // operation + reglage machine, au taux horaire de la machine
  function nomEtapeCoutUnitaire(e) {
    if (e.type === 'sous_traite') {
      return (e.prix_unitaire_st_ht != null ? e.prix_unitaire_st_ht : (e.cout_st_unitaire || 0)) || 0;
    }
    // OAS : prix direct, aucun temps ne doit être valorisé (cf. etapeDecomp dans shared.ts).
    if (e.est_oas === true) return Number(e.prix_oas_unitaire) || 0;
    return nomEtapeCoutMO(e) + nomEtapeCoutMachine(e);
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
    var PROCS = (BE_REFS_JS.process_atelier || []).filter(function(p){ var a=String(p.activite||'').toLowerCase(); return !a || a==='both' || a==='tout' || a==='seem & semrac' || a===_entPl; });
    // Postes filtrés par site (comme les process) → alimentent le select « Poste »
    var POSTES = (BE_REFS_JS.postes || []).filter(function(p){ var a=String(p.activite||'').toLowerCase(); return !a || a==='both' || a==='tout' || a==='seem & semrac' || a===_entPl; });
    var _procById = {}; (BE_REFS_JS.process_atelier || []).forEach(function(p){ _procById[String(p.id)]=p; });
    var ST_OPS = nomStOperations();
    c.innerHTML = nomEtapes.map(function(e, i){
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
          var mm = (p.requiert_machine && p.machine_id) ? BE_REFS_JS.machines.find(function(x){return x.id===p.machine_id;}) : null;
          var sub = mm ? (' · '+mm.nom) : (p.requiert_machine ? '' : ' · manuel');
          return '<option value="'+p.id+'"'+(e.process_id===p.id?' selected':'')+'>'+String(p.nom||'').replace(/</g,'&lt;')+sub+'</option>';
        }).join('');
        var hint = e.machine_nom ? ('<div style="font-size:.58rem;color:#94a3b8;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+e.machine_nom+(e.machine_taux_h?(' · '+e.machine_taux_h.toFixed(2)+' €/h'):'')+'</div>') : (e.process_id?'<div style="font-size:.58rem;color:#94a3b8;margin-top:1px;">manuel (MO)</div>':'');
        var _isMachStep = !!(e.machine_id || String(e.ressource||'').toLowerCase()==='machine');
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
      // ── Colonne coût ── (décomposition selon la formule : MO = taux_mo×(temps_mo+réglage)/60 ; Mach = taux_machine×temps_machine/60)
      var coutCol;
      if (e.type === 'interne') {
        var moE  = nomEtapeCoutMO(e);
        var macE = nomEtapeCoutMachine(e);
        coutCol = '<div style="text-align:right;padding:3px 6px;line-height:1.2;">'
          + '<div style="font-size:.6rem;color:#0ea5e9;font-weight:700;" title="MO = taux MO moyen x (temps MO + reglage) / 60">MO '+moE.toFixed(2)+' €</div>'
          + '<div style="font-size:.6rem;color:#9333ea;font-weight:700;" title="Machine = taux machine x temps machine / 60">Mach '+macE.toFixed(2)+' €</div>'
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
      var estOas = (e.est_oas === true);
      // OAS : tous les temps sont grisés — le traitement se chiffre au prix du bain, pas à l'heure.
      var greyTime = (e.type === 'sous_traite') || estOas;
      var noMachine = (e.type === 'interne' && !e.machine_id && e.ressource !== 'machine');
      var greyStyle = 'text-align:right;background:#eef2f7;color:#cbd5e1;cursor:not-allowed;';
      // oninput : met à jour le modèle + les totaux SANS re-render (sinon la saisie multi-chiffres bug — ex. « 10 »).
      // onchange (sortie de champ) : rafraîchit la colonne coût de l'étape.
      // Saisie en MILLIÈMES d'heure (1000 = 1 h). Stockage interne conservé en minutes (min = ‰ × 0.06)
      // → aucun impact sur le moteur de coût / l'OF / les dashboards. Affichage input = min × 1000/60.
      var mkTime = function(field, val){ var mil = val ? +((Number(val)*1000/60).toFixed(1)) : 0; return '<input class="nom-f-inp" type="number" step="1" min="0" inputmode="decimal" placeholder="0" title="1000 millièmes = 1 heure" value="'+mil+'" oninput="nomEtapes['+i+'].'+field+'=(parseFloat(this.value)||0)*60/1000;nomCalcTotaux()" onchange="nomRenderEtapes()" style="text-align:right;"/>'; };
      var greyInput = function(titleTxt){ return '<input class="nom-f-inp" type="number" placeholder="—" disabled title="'+titleTxt+'" style="'+greyStyle+'"/>'; };
      // ROP = reglage operateur (au taux MO) · RGM = reglage machine (au taux machine).
      // Les deux sont des couts FIXES par lot, jamais multiplies par la quantite.
      var motifGris = estOas ? 'Traitement OAS : on saisit un prix, pas un temps' : 'Non applicable en sous-traitance';
      var regInput = greyTime ? greyInput(motifGris) : mkTime('temps_reglage_min', e.temps_reglage_min);
      var regMacInput = (greyTime || noMachine) ? greyInput(greyTime ? motifGris : 'Process manuel — pas de machine a regler') : mkTime('temps_reglage_machine_min', e.temps_reglage_machine_min);
      var moInput  = greyTime ? greyInput(motifGris) : mkTime('temps_mo_min', e.temps_mo_min);
      var macInput = (greyTime || noMachine) ? greyInput(greyTime ? motifGris : 'Process manuel — pas de machine') : mkTime('temps_machine_min', e.temps_machine_min);
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
    // Totaux étapes
    var reglageTotal  = 0, unitaireTotal = 0, etapesTotal = 0, machineTotal = 0;
    nomEtapes.forEach(function(e){
      reglageTotal  += (e.temps_reglage_min || 0) + (e.temps_reglage_machine_min || 0);   // ROP + RGM
      unitaireTotal += (e.temps_mo_min || 0) + (e.temps_machine_min || 0);
      etapesTotal  += nomEtapeCoutUnitaire(e);
      if (e.type === 'interne') machineTotal += nomEtapeCoutMachine(e);
    });
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
    var stUnitTotal = 0, stSerie = 0, reglageFixe = 0;
    nomEtapes.forEach(function(e){
      if (e.type === 'sous_traite') {
        var unit = (e.prix_unitaire_st_ht != null ? e.prix_unitaire_st_ht : (e.cout_st_unitaire||0)) || 0;
        var forfait = e.forfait_st_ht || 0;
        stUnitTotal += unit;
        stSerie += Math.max(forfait, qSerie * unit);
      } else {
        reglageFixe += nomEtapeCoutReglage(e);   // coût réglage = fixe / lot (inclus dans prixRevient unitaire)
      }
    });
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
    return {
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
      composants:       isMere ? nomComposants.filter(function(c){return c.nom_id;}).map(function(c){ return { nom_id:c.nom_id, num_nom:c.num_nom, code:c.code, prix:c.prix, qte:parseFloat(c.qte)||1 }; }) : null,
      masse_kg:         (function(){ var g=parseFloat(document.getElementById('nom-f-masse')?.value); return (!isNaN(g) && g>0) ? +(g/1000).toFixed(6) : null; })(),  // saisie en g → stock en kg
      dimensions:       document.getElementById('nom-f-dims')?.value || null,
      surface_totale_dm2: (function(){ var v=parseFloat(document.getElementById('nom-f-surface')?.value); return (!isNaN(v) && v>0) ? +(v/10000).toFixed(6) : null; })(),
      temps_matiere_h:  unitaireTotal ? +(unitaireTotal/60).toFixed(3) : null,
      temps_machine_h:  null,
      taux_mo:          TAUX_MO_MOYEN,
      cout_machine_h:   COUT_MACHINE_MOY,
      prix_mo_unitaire:       isMere ? 0 : parseFloat(moTotal.toFixed(2)),
      cout_machine_unitaire:  isMere ? 0 : parseFloat(machineTotal.toFixed(2)),
      prix_revient_unitaire:  parseFloat(prixRevientUnit.toFixed(2)),
      temps_reglage_total_min:  reglageTotal,
      temps_unitaire_total_min: unitaireTotal,
      etapes_production: nomEtapes,
      notes:            document.getElementById('nom-f-notes')?.value || null,
      cree_par:         document.getElementById('nom-f-createur')?.value || null,
      statut:           statut,
      fournitures:      [].concat(
        nomMatieres.filter(function(m){ return m.ref || m.designation; }).map(function(m){
          var n = parseFloat(m.nb_par_tole)||0;
          return { type_fourniture:'matiere', categorie:'matiere', designation:m.designation||'', ref_stock:m.ref||'',
            quantite_par_piece: (n>0 ? +(1/n).toFixed(6) : null), nb_par_tole: n||null, qte_paquet: null,
            prix_unitaire: parseFloat(m.prix_tole)||0, prix_total_par_piece: +nomMatierePrixPiece(m).toFixed(4), fournisseur:m.fournisseur||'' };
        }),
        nomAccessoires.filter(function(a){ return a.ref || a.designation; }).map(function(a){
          return { type_fourniture:'accessoire', categorie:'accessoire', designation:a.designation||'', ref_stock:a.ref||'',
            quantite_par_piece: parseFloat(a.nb_par_piece)||0, nb_par_tole: null, qte_paquet: parseFloat(a.qte_paquet)||null,
            prix_unitaire: parseFloat(a.prix_paquet)||0, prix_total_par_piece: +nomAccPrixPiece(a).toFixed(4), fournisseur:a.fournisseur||'' };
        })
      )
    };
  }

  async function nomSave(statut) {
    var payload = nomCollectPayload(statut);
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
        nomCurrentStatut = statut;
        if (statut === 'valide') {
          pushNotif('ok','fa-check-circle', (num ? num+' — ' : '') + 'Nomenclature validée — elle rejoint la liste des nomenclatures faites.', 4500);
          setTimeout(function(){ window.location.replace('/be/service?' + Date.now() + '#noms'); }, 900);
          return;
        }
        // Enregistrement simple : on RESTE dans la nomenclature, la progression est sauvegardée
        // et la nomenclature demeure dans « à faire ».
        if (nouvelIndice && data.indice) pushNotif('ok','fa-code-branch', (num ? num+' — ' : '') + 'Nouvel indice '+data.indice+' créé (révision conservée).', 4500);
        else pushNotif('ok','fa-save', (num ? num+' — ' : '') + 'Progression enregistrée. Vous restez sur la nomenclature.', 3500);
        var _b = document.getElementById('nom-form-statut-badge');
        if (_b) _b.innerHTML = '<span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:800;">Enregistrée · à valider</span>';
        if (typeof gedRefreshUi === 'function') gedRefreshUi();   // les pièces jointes deviennent possibles dès qu'un id existe
      } else {
        pushNotif('err','fa-ban', data.error || 'Enregistrement refusé.', 8000);
      }
    } catch(e) {
      pushNotif('err','fa-exclamation-circle','Erreur réseau : ' + e.message, 6000);
    }
  }

  // Suppression in-place : on retire uniquement la ligne supprimée et on re-numérote
  // les indices. Pas de reload complet → évite le flash "tout s'efface".
  async function nomSupprimer(id, num) {
    if (!await appConfirm('Supprimer la nomenclature ' + num + ' ? Cette action est irreversible.')) return;
    try {
      var res = await fetch('/api/nomenclature/' + id, { method: 'DELETE' });
      var data = await res.json();
      if (!data.ok) {
        pushNotif('err','fa-exclamation-triangle','Erreur suppression: ' + (data.error || 'inconnu'), 5000);
        return;
      }
      pushNotif('ok','fa-trash','Nomenclature ' + num + ' supprimée.', 4000);
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
            + '<td style="${TD}text-align:right;color:#0284c7;" title="MO réglage inclus · '+c.moMinTotal+'+'+c.reglageMinTotal+' min/pc">'+fe(c.moSerie)+'</td>'
            + '<td style="${TD}text-align:right;color:#9333ea;" title="'+c.machineMinTotal+' min machine/pc">'+fe(c.machineSerie)+'</td>'
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
