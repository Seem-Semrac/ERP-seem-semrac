// ══════════════════════════════════════════════════════════════
// OAS – Service Oxydation Anodique Sulfurique
// ══════════════════════════════════════════════════════════════
import { escX, layout, serviceHeader, demandeAchatModal } from './shared'
import type { BonDeTravail, Operateur, Balancelle, ReleveEau, ReleveBain, Lot } from './types'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

const TODAY = () => new Date().toISOString().slice(0, 10)
const MAX_SURFACE_MM2 = 550000

// ─── Données de démonstration ─────────────────────────────────

const BAL_DEFAULT: Balancelle[] = []

const EAU_DEFAULT: ReleveEau[] = []

const BAINS_DEFAULT: ReleveBain[] = []

// Lots de démo arrivés à l'étape OAS (fallback si pas de DB)
const LOTS_OAS_DEFAULT: any[] = []

// ─── Helpers ──────────────────────────────────────────────────

const CYAN = '#06b6d4'
const CYAN_D = '#0891b2'

function tabId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
}

const TH = (t: string) => `<th style="text-align:left;padding:8px 12px;font-size:.7rem;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;white-space:nowrap;">${t}</th>`
const TD = (v: string) => `<td style="padding:8px 12px;font-size:.78rem;color:#374151;border-bottom:1px solid #f1f5f9;vertical-align:middle;">${v}</td>`

function statutBadge(s: string) {
  const map: Record<string, [string, string]> = {
    en_cours:     ['#3b82f6', 'En cours'],
    termine:      ['#22c55e', 'Terminé'],
    annule:       ['#94a3b8', 'Annulé'],
    conforme:     ['#22c55e', 'Conforme'],
    non_conforme: ['#ef4444', 'Non conforme'],
    a_verifier:   ['#f59e0b', 'À vérifier'],
    a_programmer: ['#f59e0b', 'À programmer'],
    programme:    ['#3b82f6', 'Programmé'],
    recu:         ['#f97316', 'Reçu'],
    en_oas:       ['#06b6d4', 'En OAS'],
  }
  const [c, l] = map[s] ?? ['#94a3b8', s]
  return `<span style="background:${c}22;color:${c};border-radius:999px;padding:2px 9px;font-size:.65rem;font-weight:700;">${l}</span>`
}

function conformeBadge(ok?: boolean) {
  if (ok === undefined) return '<span style="color:#94a3b8;font-size:.72rem;">—</span>'
  return ok
    ? '<span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 8px;font-size:.65rem;font-weight:700;">✓ Conforme</span>'
    : '<span style="background:#fee2e2;color:#b91c1c;border-radius:999px;padding:2px 8px;font-size:.65rem;font-weight:700;">✗ NC</span>'
}

// ─── Calcul des lots éligibles OAS ────────────────────────────
//  Un lot est éligible si toutes ses étapes précédentes (seq < seq_OAS) sont
//  soldées. L'OAS lui-même n'a pas de BDT propre dans cette refonte : c'est
//  le passage automatique du BDT précédent à 'solde' qui déclenche l'arrivée
//  du lot dans la liste OAS.
function computeLotsOAS(lots: Lot[], bdts: BonDeTravail[], balancelles: Balancelle[]): any[] {
  const TODAY_ISO = TODAY()
  // Regroupement des BDT par lot
  const bdtsByLot: Record<string, BonDeTravail[]> = {}
  bdts.forEach(b => {
    const k = b.lot_id || ''
    if (!k) return
    if (!bdtsByLot[k]) bdtsByLot[k] = []
    bdtsByLot[k].push(b)
  })

  const out: any[] = []
  for (const lot of lots) {
    const bdtsLot = (bdtsByLot[lot.id] || []).slice().sort((a:any,b:any)=>((a.seq??9999)-(b.seq??9999)))
    if (bdtsLot.length === 0) continue
    // ── Détection de la porte OAS ──
    // Modèle cible : les étapes OAS n'ont PAS de BDT. Le BDT juste avant la porte porte
    // oas_apres=true, celui juste après oas_avant=true. Le lot est « en OAS » dès que le BDT
    // oas_apres est soldé et tant que le BDT oas_avant n'est ni reçu ni soldé.
    let estEnOAS = false, bdtPrec: string | null = null, bdtSuivant: string | null = null
    const idxApres = bdtsLot.findIndex((b: any) => b.oas_apres === true)
    if (idxApres >= 0) {
      const bAvant: any = bdtsLot[idxApres]
      const bApres: any = bdtsLot.find((b: any) => b.oas_avant === true && (Number(b.seq) || 0) > (Number(bAvant.seq) || 0)) || bdtsLot[idxApres + 1] || null
      const avantSolde = ['solde', 'termine'].includes(String(bAvant.statut))
      const apresFait = bApres ? ['solde', 'termine', 'recu'].includes(String(bApres.statut)) : false
      estEnOAS = avantSolde && !apresFait
      bdtPrec = bAvant.id
      bdtSuivant = bApres ? bApres.id : null
    } else {
      // Legacy : BDT OAS repéré par l'opération (« oxydation anodique »)
      const idxOAS = bdtsLot.findIndex(b => (b.operation || '').toLowerCase().includes('oxydation anodique'))
      if (idxOAS >= 0) {
        const precSoldes = bdtsLot.slice(0, idxOAS).every((b: any) => ['solde', 'termine'].includes(String(b.statut)))
        const oasStatut = String((bdtsLot[idxOAS] as any).statut || '')
        estEnOAS = precSoldes && !['solde', 'termine'].includes(oasStatut)
        bdtPrec = idxOAS - 1 >= 0 ? bdtsLot[idxOAS - 1].id : null
        bdtSuivant = idxOAS + 1 < bdtsLot.length ? bdtsLot[idxOAS + 1].id : null
      } else {
        const tousSoldes = bdtsLot.every((b: any) => ['solde', 'termine'].includes(String(b.statut)))
        if (tousSoldes) continue // lot fini
      }
    }
    if (!estEnOAS) continue

    // Surface unitaire par défaut : on peut avoir un champ dédié sur le lot ou défaut générique
    const surface_unit_default = (lot as any).surface_unit_default ?? 1000
    // Quantité totale du lot
    const qteLot = Number(lot.qte || 0)
    // Quantité déjà traitée via balancelles (somme des qtés des items du lot)
    let qteTraitee = 0
    for (const bal of balancelles) {
      const items = parseBalItems(bal)
      if (items.length > 0) {
        for (const it of items) if (String(it.lot_id) === String(lot.id)) qteTraitee += Number(it.qte || 0)
      } else if (String(bal.lot_id || '') === String(lot.id)) {
        qteTraitee += Number(bal.quantite || 0)
      }
    }
    const progression = qteLot > 0 ? Math.min(100, Math.round(qteTraitee / qteLot * 100)) : 0
    out.push({
      id: lot.id,
      client_nom: lot.client_nom,
      piece: lot.piece,
      qte: qteLot,
      qte_traitee: qteTraitee,
      progression,
      surface_unit_default,
      bdt_precedent: bdtPrec,
      bdt_suivant: bdtSuivant,
      statut: progression >= 100 ? 'termine' : 'en_oas',
      date_arrivee: (lot as any).updated_at || (lot as any).created_at || TODAY_ISO,
    })
  }
  return out
}

function parseBalItems(b: Balancelle): any[] {
  if (!b.observations) return []
  try {
    const obj = JSON.parse(b.observations)
    if (obj && Array.isArray(obj.items)) return obj.items
  } catch (_e) {}
  return []
}

function balTotalSurface(b: Balancelle): number {
  const items = parseBalItems(b)
  if (items.length === 0) return 0
  return items.reduce((s, it) => s + Number(it.surface_unit || 0) * Number(it.qte || 0), 0)
}

const TABS = ['Lots & Balancelles', 'Relevé consommation eau', 'Relevés périodiques bains', 'Dashboard OAS']
const TAB_IDS = TABS.map(tabId)

// ══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════
export const pageServiceOAS = (
  _dbBDTsOAS?: BonDeTravail[],
  dbBalancelles?: Balancelle[],
  dbRelevesEau?: ReleveEau[],
  dbRelevesBains?: ReleveBain[],
  dbOps?: Operateur[],
  dbBdtsAll?: BonDeTravail[],
  dbLots?: Lot[],
  dbNomenclatures?: any[],
  dbOasProcesses?: any[],
) => {
  const today = TODAY()
  // Types de bain OAS = NOMS des process OAS (postes/process d'activité OAS). Défaut = anciennes valeurs si aucun process OAS.
  const _escO = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const oasTypes: string[] = (() => {
    const names = (dbOasProcesses ?? []).map((p: any) => String(p.nom || '').trim()).filter(Boolean)
    const uniq = Array.from(new Set(names))
    return uniq.length ? uniq : ['OAS incolore', 'OAS noire', 'Désoxydation']
  })()
  const oasTypeOptions = oasTypes.map((t) => `<option value="${_escO(t)}">${_escO(t)}</option>`).join('')
  // Surface unitaire RELIÉE À LA NOMENCLATURE (dm² → mm²), par référence/désignation pièce.
  const _normP = (s: any) => String(s || '').toLowerCase().trim()
  const surfMm2ParPiece = (piece: any): number | null => {
    const p = _normP(piece); if (!p) return null
    const n = (dbNomenclatures || []).find((x: any) => _normP(x.code_ref_produit) === p || _normP(x.description) === p)
            || (dbNomenclatures || []).find((x: any) => _normP(x.code_ref_produit) && p.includes(_normP(x.code_ref_produit)))
    const v = n && n.surface_totale_dm2 != null ? Number(n.surface_totale_dm2) * 10000 : null
    return v && v > 0 ? v : null
  }
  const balancelles = dbBalancelles ?? []
  const relevesEau  = dbRelevesEau ?? []
  const relevesBains = dbRelevesBains ?? []

  // ── Calcul des lots à l'OAS (transfert auto depuis BDT précédent) ─
  let lotsOAS: any[] = []
  if (dbLots && dbBdtsAll && dbLots.length > 0) {
    lotsOAS = computeLotsOAS(dbLots, dbBdtsAll, balancelles)
  }
  if (lotsOAS.length === 0) lotsOAS = LOTS_OAS_DEFAULT.map(l => {
    const qteTraitee = balancelles
      .filter(b => parseBalItems(b).some(it => it.lot_id === l.id) || b.lot_id === l.id)
      .reduce((s, b) => {
        const items = parseBalItems(b)
        if (items.length > 0) return s + items.filter(it => it.lot_id === l.id).reduce((ss, it) => ss + Number(it.qte || 0), 0)
        return s + Number(b.quantite || 0)
      }, 0)
    const progression = l.qte > 0 ? Math.min(100, Math.round(qteTraitee / l.qte * 100)) : 0
    return { ...l, qte_traitee: qteTraitee, progression, statut: progression >= 100 ? 'termine' : 'en_oas' }
  })

  const lotsActifs   = lotsOAS.filter(l => l.statut !== 'termine')
  const lotsTermines = lotsOAS.filter(l => l.statut === 'termine')

  // Liste des lots disponibles pour le formulaire balancelle (dropdown)
  const lotsDropdown = lotsActifs.map(l => ({
    id: l.id, client: l.client_nom, piece: l.piece, qte: l.qte, qte_traitee: l.qte_traitee,
    // Priorité à la surface de la nomenclature (DB) ; repli sur la valeur démo/lot.
    surface_unit_default: surfMm2ParPiece(l.piece) ?? l.surface_unit_default,
  }))

  // Mapping lot → numéro d'affaire (cmd_id) pour la recherche balancelles
  const lotToAffaire: Record<string, string> = {}
  if (dbLots) {
    for (const l of dbLots) if (l.id && l.cmd_id) lotToAffaire[String(l.id)] = String(l.cmd_id)
  }

  // ── Opérateur names ──────────────────────────────────────────
  const opsMap: Record<string, string> = {}
  if (dbOps) dbOps.forEach(o => { opsMap[o.id] = o.nom })

  // ── KPIs dashboard ──────────────────────────────────────────
  const balEnCours  = balancelles.filter(b => b.statut === 'en_cours').length
  const balTermine  = balancelles.filter(b => b.statut === 'termine').length
  const balNC       = balancelles.filter(b => b.resultat === 'non_conforme').length
  const tauxConf    = balTermine > 0 ? Math.round((balTermine - balNC) / balTermine * 100) : 100
  const totalEau    = relevesEau.reduce((s, r) => s + (r.volume_m3 ?? 0), 0)
  const lastBain    = relevesBains.find(r => r.bain_nom === 'Principal OAS')
  const bainConf    = relevesBains.filter(r => r.conforme === false).length

  // ── Tableau lots actifs (à traiter) ──────────────────────────
  const lotsActifsRows = lotsActifs.map(l => {
    const progColor = l.progression >= 80 ? '#22c55e' : l.progression >= 40 ? '#3b82f6' : '#f59e0b'
    return `<tr>
      ${TD(`<span style="font-weight:700;color:#0891b2;">${escX(l.id)}</span>`)}
      ${TD(escX(l.client_nom ?? '—'))}
      ${TD(escX(l.piece ?? '—'))}
      ${TD(`<span style="font-weight:700;">${l.qte_traitee}</span> / ${l.qte}`)}
      ${TD(`<div style="display:flex;align-items:center;gap:6px;"><div style="flex:1;height:8px;background:#e2e8f0;border-radius:4px;min-width:80px;"><div style="height:100%;width:${l.progression}%;background:${progColor};border-radius:4px;"></div></div><span style="font-size:.72rem;font-weight:700;color:${progColor};">${l.progression}%</span></div>`)}
      ${TD(statutBadge(l.statut))}
      ${TD(l.bdt_suivant ? `<span style="font-size:.72rem;color:#64748b;">${escX(l.bdt_suivant)}</span>` : '<span style="color:#94a3b8;font-size:.72rem;">—</span>')}
      ${TD(`<button onclick="openBalFromLot('${escX(l.id)}')" style="padding:5px 11px;border-radius:7px;background:linear-gradient(135deg,${CYAN},${CYAN_D});color:white;border:none;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-atom" style="margin-right:4px;"></i>Balancelle</button>`)}
    </tr>`
  }).join('')

  // ── Tableau balancelles en cours (sous le tableau des lots) ──
  const balRows = balancelles.map(b => {
    const dMin = b.date_sortie && b.date_entree
      ? Math.round((new Date(b.date_sortie).getTime() - new Date(b.date_entree).getTime()) / 60000)
      : b.duree_min
    const durLabel = dMin ? `${Math.floor(dMin/60)}h${String(dMin%60).padStart(2,'0')}` : '<span style="color:#3b82f6;font-weight:700;">En cours…</span>'
    const items = parseBalItems(b)
    const surfTot = balTotalSurface(b)
    const surfPct = Math.min(100, Math.round(surfTot / MAX_SURFACE_MM2 * 100))
    const surfColor = surfPct >= 90 ? '#ef4444' : surfPct >= 70 ? '#f59e0b' : '#22c55e'
    const refsTxt = items.length > 0
      ? items.map(it => `${escX(it.lot_id)}/${escX(it.ref || it.piece || '—')} ×${it.qte}`).join(' · ')
      : `${escX(b.lot_id || '—')} · ${escX(b.piece || '—')} ×${b.quantite || 0}`
    // Affaires liées : on prend les cmd_id de tous les lots concernés
    const lotsLies = items.length > 0 ? items.map(it => String(it.lot_id)).filter(Boolean) : [String(b.lot_id || '')]
    const affaires = Array.from(new Set(lotsLies.map(l => lotToAffaire[l]).filter(Boolean))).join(' ')
    const searchKey = `${b.num_session || ''} ${lotsLies.join(' ')} ${affaires}`.toLowerCase()
    return `<tr class="bal-row" data-search="${escX(searchKey)}" data-affaires="${escX(affaires)}" data-lots="${escX(lotsLies.join(' '))}">
      ${TD(`<span style="font-weight:700;color:#0891b2;">${escX(b.num_session)}</span>${affaires ? `<div style="font-size:.6rem;color:#64748b;margin-top:2px;">Aff. ${escX(affaires)}</div>` : ''}`)}
      ${TD(`<div style="font-size:.72rem;color:#374151;max-width:240px;line-height:1.4;">${refsTxt}</div>`)}
      ${TD(`<div style="display:flex;align-items:center;gap:6px;"><div style="flex:1;height:6px;background:#e2e8f0;border-radius:3px;min-width:60px;"><div style="height:100%;width:${surfPct}%;background:${surfColor};border-radius:3px;"></div></div><span style="font-size:.65rem;font-weight:700;color:${surfColor};">${surfPct}%</span></div><span style="font-size:.6rem;color:#94a3b8;">${Math.round(surfTot)} / ${MAX_SURFACE_MM2} mm²</span>`)}
      ${TD(escX(b.bain_nom ?? 'Principal OAS'))}
      ${TD(b.date_entree ? new Date(b.date_entree).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—')}
      ${TD(b.date_sortie ? new Date(b.date_sortie).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—')}
      ${TD(durLabel)}
      ${TD(statutBadge(b.statut))}
      ${TD(b.resultat ? statutBadge(b.resultat) : '<span style="color:#94a3b8;font-size:.72rem;">—</span>')}
      ${TD(b.statut === 'en_cours' ? `<button onclick="openCloreBalModal('${escX(b.id)}','${escX(b.num_session)}','${escX(b.lot_id || '')}','${escX((b.piece || '').replace(/'/g, "\\'"))}')" style="padding:4px 10px;border-radius:7px;background:#22c55e;color:white;border:none;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-clipboard-check" style="margin-right:3px;"></i>Clore + autocontrôle</button>` : '<span style="color:#94a3b8;font-size:.72rem;">—</span>')}
    </tr>`
  }).join('')

  // ── Tableau lots terminés ────────────────────────────────────
  const lotsTerminesRows = lotsTermines.map(l => `<tr>
    ${TD(`<span style="font-weight:700;color:#15803d;">${escX(l.id)}</span>`)}
    ${TD(escX(l.client_nom ?? '—'))}
    ${TD(escX(l.piece ?? '—'))}
    ${TD(`<span style="font-weight:700;">${l.qte_traitee}</span> / ${l.qte}`)}
    ${TD(`<span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 9px;font-size:.65rem;font-weight:700;">✓ 100% OAS</span>`)}
    ${TD(l.bdt_suivant ? `<span style="font-size:.72rem;color:#0891b2;font-weight:700;">→ ${escX(l.bdt_suivant)}</span>` : '<span style="color:#94a3b8;font-size:.72rem;">Aucune étape suivante</span>')}
  </tr>`).join('')

  // ── Panel 3: Relevés eau ─────────────────────────────────────
  const eauRows = relevesEau.map(r => `<tr>
    ${TD(new Date(r.date_releve).toLocaleDateString('fr-FR'))}
    ${TD(opsMap[r.operateur_id ?? ''] ? escX(opsMap[r.operateur_id ?? '']) : '<span style="color:#94a3b8;">—</span>')}
    ${TD(r.volume_m3 != null ? r.volume_m3.toFixed(3) + ' m³' : '—')}
    ${TD(r.ph != null ? String(r.ph) : '—')}
    ${TD(r.temperature != null ? r.temperature + ' °C' : '—')}
    ${TD(r.turbidite != null ? r.turbidite + ' NTU' : '—')}
    ${TD(r.chlore != null ? r.chlore + ' mg/L' : '—')}
    ${TD(conformeBadge(r.conforme))}
    ${TD(r.observations ? `<span style="font-size:.72rem;color:#64748b;">${escX(r.observations)}</span>` : '—')}
  </tr>`).join('')

  // ── Panel 4: Relevés bains ───────────────────────────────────
  const bainColors: Record<string, string> = {
    'Principal OAS': '#06b6d4',
    'Bain de lavage': '#14b8a6',
    'Rinçage 1': '#10b981',
    'Rinçage 2': '#3b82f6',
    'Neutralisation': '#8b5cf6',
  }
  const bainsRows = relevesBains.map(r => {
    const c = bainColors[r.bain_nom] ?? '#64748b'
    return `<tr>
      ${TD(new Date(r.date_releve).toLocaleDateString('fr-FR'))}
      ${TD(`<span style="background:${c}22;color:${c};border-radius:999px;padding:2px 9px;font-size:.65rem;font-weight:700;">${escX(r.bain_nom)}</span>`)}
      ${TD(r.ph != null ? String(r.ph) : '—')}
      ${TD(r.temperature != null ? r.temperature + ' °C' : '—')}
      ${TD(r.concentration_gl != null ? r.concentration_gl + ' g/L' : '—')}
      ${TD(r.densite != null ? String(r.densite) : '—')}
      ${TD(r.titrage_acide != null ? r.titrage_acide + ' g/L' : '—')}
      ${TD(r.titrage_alu != null ? r.titrage_alu + ' g/L' : '—')}
      ${TD(r.conductivite != null ? r.conductivite + ' mS/cm' : '—')}
      ${TD(conformeBadge(r.conforme))}
      ${TD(r.observations ? `<span style="font-size:.72rem;color:#64748b;">${escX(r.observations)}</span>` : '—')}
    </tr>`
  }).join('')

  // ── Panel 5: Dashboard ───────────────────────────────────────
  const kpi = (icon: string, color: string, val: string|number, label: string, sub = '') =>
    `<div class="card" style="padding:18px;display:flex;align-items:center;gap:12px;">
      <div style="width:42px;height:42px;border-radius:12px;background:${color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <i class="fas ${icon}" style="color:${color};font-size:1.1rem;"></i>
      </div>
      <div>
        <div style="font-size:1.5rem;font-weight:900;color:#1e293b;">${val}</div>
        <div style="font-size:.72rem;font-weight:600;color:#64748b;">${label}</div>
        ${sub ? `<div style="font-size:.65rem;color:#94a3b8;">${sub}</div>` : ''}
      </div>
    </div>`

  // Évolution pH bain principal (5 derniers relevés)
  const phHistory = relevesBains
    .filter(r => r.bain_nom === 'Principal OAS' && r.ph != null)
    .slice(0, 5)
    .reverse()

  const phBars = phHistory.map(r => {
    const pct = Math.min(100, Math.round(r.ph! / 2 * 100))
    const ok = r.ph! >= 0.7 && r.ph! <= 1.1
    const c = ok ? '#22c55e' : '#ef4444'
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;">
      <span style="font-size:.65rem;font-weight:700;color:${c};">${r.ph}</span>
      <div style="width:100%;background:#e2e8f0;border-radius:4px 4px 0 0;height:80px;display:flex;align-items:flex-end;">
        <div style="width:100%;height:${pct}%;background:${c};border-radius:4px 4px 0 0;"></div>
      </div>
      <span style="font-size:.6rem;color:#94a3b8;">${new Date(r.date_releve).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})}</span>
    </div>`
  }).join('')

  const bainStatRows = (['Principal OAS','Bain de lavage','Rinçage 1','Rinçage 2','Neutralisation'] as const).map(bnom => {
    const last = relevesBains.filter(r => r.bain_nom === bnom).sort((a,b) => b.date_releve.localeCompare(a.date_releve))[0]
    const c = bainColors[bnom]
    return `<tr>
      ${TD(`<span style="background:${c}22;color:${c};border-radius:999px;padding:2px 9px;font-size:.65rem;font-weight:700;">${bnom}</span>`)}
      ${TD(last ? new Date(last.date_releve).toLocaleDateString('fr-FR') : '—')}
      ${TD(last?.ph != null ? String(last.ph) : '—')}
      ${TD(last?.temperature != null ? last.temperature + ' °C' : '—')}
      ${TD(last ? conformeBadge(last.conforme) : '—')}
    </tr>`
  }).join('')

  const content = `
<style>
  .oas-panel{display:none;}
  .oas-panel.active{display:block;}
  .form-label{display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;}
  .form-input{width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.85rem;background:#f8fafc;outline:none;color:#374151;box-sizing:border-box;}
  .btn{padding:9px 18px;border-radius:9px;border:none;cursor:pointer;font-size:.83rem;font-weight:700;display:inline-flex;align-items:center;gap:5px;}
  .btn-secondary{background:#f1f5f9;color:#374151;}
  .bal-item-row{display:grid;grid-template-columns:1.2fr 1.5fr .9fr .9fr auto;gap:8px;margin-bottom:8px;align-items:end;}
</style>

${(() => {
  const ICONS = ['fa-layer-group','fa-water','fa-flask','fa-tachometer-alt']
  // Badges = nombre d'éléments des onglets-listes (Dashboard = pas de liste → pas de badge)
  const BADGES: (number | undefined)[] = [lotsActifs.length, relevesEau.length, relevesBains.length, undefined]
  return serviceHeader({
    icon: 'fa-atom',
    color: CYAN,
    darkBg: '#164e63',
    title: 'Service OAS — Oxydation Anodique Sulfurique',
    subtitle: 'Mickaël · Lots OAS · Balancelles multi-réf · Bains · Eau · EN 9100:2018',
    tabs: TABS.map((t, i) => ({ id: TAB_IDS[i], label: t, icon: ICONS[i], badge: BADGES[i] })),
    switchFn: 'showOasTab',
    tabIdPrefix: 'oastab',
    activeId: TAB_IDS[0]
  })
})()}

<!-- ═══ PANEL 1 : LOTS À PASSER + BALANCELLES (regroupés) ════════ -->
<div id="oaspanel-${TAB_IDS[0]}" class="oas-panel active">
  <div style="padding:24px;max-width:1500px;margin:0 auto;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
      <div>
        <h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">Lots à passer en OAS &amp; Balancelles</h1>
        <div style="font-size:.78rem;color:#64748b;margin-top:2px;">${lotsActifs.length} lot${lotsActifs.length!==1?'s':''} arrivés à l'étape OAS (transfert automatique au solde du BDT précédent) · ${balEnCours} balancelle${balEnCours!==1?'s':''} en cours</div>
      </div>
      <button onclick="openNewBal()" style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px;background:linear-gradient(135deg,${CYAN},${CYAN_D});color:white;border-radius:10px;font-size:.85rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(6,182,212,.3);"><i class="fas fa-plus"></i>Nouvelle balancelle</button>
    </div>

    <!-- Tableau Lots à l'OAS -->
    <div style="margin-bottom:8px;font-size:.82rem;font-weight:800;color:#0e7490;display:flex;align-items:center;gap:6px;"><i class="fas fa-layer-group" style="color:${CYAN};"></i>Lots arrivés à l'OAS (progression OAS calculée sur la quantité des balancelles)</div>
    <div class="card" style="overflow:hidden;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f0f9ff;">${TH('Lot')}${TH('Client')}${TH('Pièce')}${TH('Pièces traitées')}${TH('Progression OAS')}${TH('Statut')}${TH('Étape suivante')}${TH('Action')}</tr></thead>
        <tbody>${lotsActifsRows || `<tr><td colspan="8" style="text-align:center;padding:32px;color:#94a3b8;">Aucun lot actuellement à l'OAS. Les lots arrivent ici dès que le BDT précédent est soldé.</td></tr>`}</tbody>
      </table>
    </div>

    <!-- Tableau Balancelles avec recherche -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;flex-wrap:wrap;">
      <div style="font-size:.82rem;font-weight:800;color:#0e7490;display:flex;align-items:center;gap:6px;"><i class="fas fa-atom" style="color:${CYAN};"></i>Balancelles (sessions OAS — multi-références sur jauge 0 → ${MAX_SURFACE_MM2.toLocaleString('fr-FR')} mm²)</div>
      <div style="position:relative;">
        <i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:.78rem;"></i>
        <input id="balSearchInput" type="text" placeholder="Rechercher par n° affaire / lot / session…" oninput="filterBalancelles(this.value)" style="padding:7px 12px 7px 30px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.78rem;width:280px;background:white;outline:none;"/>
      </div>
    </div>
    <div class="card" style="overflow:hidden;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f0f9ff;">${TH('Session')}${TH('Lot(s) / Réf · Qté')}${TH('Charge surface')}${TH('Bain')}${TH('Entrée')}${TH('Sortie')}${TH('Durée')}${TH('Statut')}${TH('Résultat')}${TH('Action')}</tr></thead>
        <tbody id="balTableBody">${balRows || `<tr><td colspan="10" style="text-align:center;padding:32px;color:#94a3b8;">Aucune balancelle. Cliquez « Nouvelle balancelle » pour démarrer une session multi-références.</td></tr>`}</tbody>
      </table>
    </div>

    <!-- Liste dédiée lots terminés (sous les balancelles) -->
    <div style="margin-bottom:8px;font-size:.82rem;font-weight:800;color:#15803d;display:flex;align-items:center;gap:6px;"><i class="fas fa-check-circle" style="color:#22c55e;"></i>Lots OAS terminés (100% complétude) — bascule auto vers l'étape suivante</div>
    <div class="card" style="overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f0fdf4;">${TH('Lot')}${TH('Client')}${TH('Pièce')}${TH('Pièces traitées')}${TH('Statut OAS')}${TH('Bascule vers')}</tr></thead>
        <tbody>${lotsTerminesRows || `<tr><td colspan="6" style="text-align:center;padding:24px;color:#94a3b8;">Aucun lot terminé pour le moment.</td></tr>`}</tbody>
      </table>
    </div>
  </div>
</div>

<!-- ═══ PANEL 2 : RELEVÉS EAU ════════════════════════════════════ -->
<div id="oaspanel-${TAB_IDS[1]}" class="oas-panel">
  <div style="padding:24px;margin:0 auto;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div>
        <h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">Relevés de consommation d&#39;eau</h1>
        <div style="font-size:.78rem;color:#64748b;margin-top:2px;">${relevesEau.length} relevé${relevesEau.length!==1?'s':''} · Volume total : ${totalEau.toFixed(3)} m³</div>
      </div>
      <button onclick="openNewEau()" style="display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:linear-gradient(135deg,#0284c7,#0369a1);color:white;border-radius:10px;font-size:.82rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(2,132,199,.3);"><i class="fas fa-plus"></i> Nouveau relevé</button>
    </div>
    <div class="card" style="overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f0f9ff;">${TH('Date')}${TH('Opérateur')}${TH('Volume')}${TH('pH')}${TH('Temp.')}${TH('Turbidité')}${TH('Chlore')}${TH('Conformité')}${TH('Observations')}</tr></thead>
        <tbody>${eauRows || `<tr><td colspan="9" style="text-align:center;padding:40px;color:#94a3b8;">Aucun relevé enregistré.</td></tr>`}</tbody>
      </table>
    </div>
  </div>
</div>

<!-- ═══ PANEL 3 : RELEVÉS BAINS ══════════════════════════════════ -->
<div id="oaspanel-${TAB_IDS[2]}" class="oas-panel">
  <div style="padding:24px;margin:0 auto;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div>
        <h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">Relevés périodiques des bains</h1>
        <div style="font-size:.78rem;color:#64748b;margin-top:2px;">${relevesBains.length} relevé${relevesBains.length!==1?'s':''} · ${bainConf > 0 ? `<span style="color:#ef4444;font-weight:700;">${bainConf} hors seuil</span>` : '<span style="color:#22c55e;font-weight:700;">Tous conformes</span>'}</div>
      </div>
      <button onclick="openNewBain()" style="display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;border-radius:10px;font-size:.82rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(109,40,217,.3);"><i class="fas fa-plus"></i> Nouveau relevé</button>
    </div>
    <div class="card" style="overflow:auto;">
      <table style="width:100%;border-collapse:collapse;min-width:900px;">
        <thead><tr style="background:#f0f9ff;">${TH('Date')}${TH('Bain')}${TH('pH')}${TH('Temp.')}${TH('Conc. (g/L)')}${TH('Densité')}${TH('Titrage H₂SO₄')}${TH('Titrage Al')}${TH('Conductivité')}${TH('Conformité')}${TH('Observations')}</tr></thead>
        <tbody>${bainsRows || `<tr><td colspan="11" style="text-align:center;padding:40px;color:#94a3b8;">Aucun relevé enregistré.</td></tr>`}</tbody>
      </table>
    </div>
  </div>
</div>

<!-- ═══ PANEL 4 : DASHBOARD OAS ══════════════════════════════════ -->
<div id="oaspanel-${TAB_IDS[3]}" class="oas-panel">
  <div style="padding:24px;margin:0 auto;">
    <div style="margin-bottom:20px;"><h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">Dashboard OAS</h1><div style="font-size:.78rem;color:#64748b;margin-top:2px;">Indicateurs temps réel · Bain chimique · Conformité · Eau · ${today}</div></div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:24px;">
      ${kpi('fa-atom', CYAN, balancelles.length, 'Sessions totales', `${balEnCours} en cours`)}
      ${kpi('fa-check-double', '#22c55e', tauxConf + '%', 'Taux conformité', `${balNC} NC sur ${balTermine}`)}
      ${kpi('fa-layer-group', '#f97316', lotsActifs.length, 'Lots actifs à l\'OAS', `${lotsTermines.length} terminés`)}
      ${kpi('fa-water', '#0284c7', totalEau.toFixed(2) + ' m³', 'Eau consommée (période)', `${relevesEau.length} relevés`)}
      ${kpi('fa-flask', bainConf > 0 ? '#ef4444' : '#22c55e', bainConf > 0 ? bainConf + ' NC' : 'OK', 'État des bains', lastBain ? `pH bain = ${lastBain.ph}` : 'Pas de relevé')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <div class="card" style="padding:20px;">
        <div style="font-weight:700;color:#1e293b;font-size:.88rem;margin-bottom:16px;display:flex;align-items:center;gap:6px;"><i class="fas fa-chart-bar" style="color:${CYAN};"></i> Évolution pH — Bain Principal OAS</div>
        ${phHistory.length > 0
          ? `<div style="display:flex;align-items:flex-end;gap:8px;height:100px;">${phBars}</div>
             <div style="font-size:.65rem;color:#94a3b8;margin-top:6px;">Tolérance : pH 0.7 – 1.1 (H₂SO₄ 180 g/L)</div>`
          : '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:.78rem;">Pas de données pH</div>'}
      </div>
      <div class="card" style="overflow:hidden;">
        <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#1e293b;font-size:.88rem;display:flex;align-items:center;gap:6px;"><i class="fas fa-flask" style="color:#7c3aed;"></i> Dernier état des bains</div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f8fafc;">${TH('Bain')}${TH('Dernier relevé')}${TH('pH')}${TH('Temp.')}${TH('État')}</tr></thead>
          <tbody>${bainStatRows}</tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- ═══ MODAL : NOUVELLE BALANCELLE (multi-réf + jauge) ══════════ -->
<div id="newBalModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
  <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:780px;margin:1rem;overflow:hidden;max-height:92vh;overflow-y:auto;">
    <div style="padding:14px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,${CYAN},${CYAN_D});position:sticky;top:0;z-index:10;">
      <h3 style="font-weight:800;color:white;font-size:.98rem;margin:0;"><i class="fas fa-atom" style="margin-right:8px;"></i>Nouvelle balancelle OAS — multi-références</h3>
      <button onclick="closeBalModal()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
    </div>
    <div style="padding:22px;">
      <!-- Info contexte -->
      <div style="background:#ecfeff;border:1px solid #67e8f9;border-radius:10px;padding:12px 14px;font-size:.78rem;color:#0e7490;margin-bottom:18px;line-height:1.5;">
        <i class="fas fa-info-circle" style="margin-right:5px;"></i>Sélectionnez les lots arrivés à l'OAS. Pour chaque lot, indiquez la référence, la surface unitaire (mm²) et le nombre de pièces que vous mettez sur la balancelle. La jauge se met à jour automatiquement (max <strong>${MAX_SURFACE_MM2.toLocaleString('fr-FR')} mm²</strong>).
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:16px;">
        <div>
          <label class="form-label">N° Session (auto)</label>
          <input id="nb_num" type="text" class="form-input" readonly style="background:#f8fafc;"/>
        </div>
        <div>
          <label class="form-label">Type de traitement (bain) *</label>
          <select id="nb_type" class="form-input">${oasTypeOptions}</select>
          <div style="font-size:.64rem;color:#94a3b8;margin-top:3px;"><i class="fas fa-info-circle" style="margin-right:3px;"></i>Choix = process du/des poste(s) OAS (Production → Postes, activité OAS).</div>
        </div>
        <div>
          <label class="form-label">Bain *</label>
          <select id="nb_bain" class="form-input">
            <option>Principal OAS</option>
            <option>Bain de lavage</option>
            <option>Rinçage 1</option>
            <option>Rinçage 2</option>
            <option>Neutralisation</option>
            <option>Bain 2 (essais)</option>
          </select>
        </div>
        <div>
          <label class="form-label">Heure entrée *</label>
          <input id="nb_entree" type="datetime-local" class="form-input"/>
        </div>
      </div>

      <!-- En-tête des items + bouton Ajouter -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div style="font-weight:800;color:#1e293b;font-size:.85rem;"><i class="fas fa-list" style="color:${CYAN};margin-right:5px;"></i>Références sur la balancelle</div>
        <button onclick="addBalItem()" style="padding:6px 12px;border-radius:8px;background:#ecfeff;color:#0e7490;border:1.5px solid #67e8f9;cursor:pointer;font-size:.75rem;font-weight:700;"><i class="fas fa-plus" style="margin-right:4px;"></i>Ajouter une référence</button>
      </div>

      <div id="balItemsList"></div>

      <!-- Jauge charge -->
      <div style="background:#f8fafc;border-radius:12px;padding:14px 18px;margin-top:18px;border:1px solid #e2e8f0;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:.82rem;font-weight:800;color:#1e293b;"><i class="fas fa-gauge-high" style="color:${CYAN};margin-right:5px;"></i>Charge balancelle (surface totale)</span>
          <span id="balGaugeLabel" style="font-size:.85rem;font-weight:800;color:${CYAN};">0 / ${MAX_SURFACE_MM2.toLocaleString('fr-FR')} mm² (0%)</span>
        </div>
        <div style="height:18px;background:#e2e8f0;border-radius:10px;overflow:hidden;position:relative;">
          <div id="balGaugeBar" style="height:100%;width:0%;background:linear-gradient(90deg,#22c55e,#06b6d4);border-radius:10px;transition:width .25s ease, background .25s ease;"></div>
        </div>
        <div id="balGaugeMsg" style="font-size:.7rem;color:#94a3b8;margin-top:5px;">Ajoutez des références pour calculer la charge.</div>
      </div>

      <div style="margin-top:14px;">
        <label class="form-label">Observations</label>
        <textarea id="nb_obs" rows="2" class="form-input" style="resize:vertical;"></textarea>
      </div>
    </div>
    <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;background:white;position:sticky;bottom:0;">
      <button onclick="closeBalModal()" class="btn btn-secondary">Annuler</button>
      <button onclick="creerBalancelle()" class="btn" style="background:linear-gradient(135deg,${CYAN},${CYAN_D});color:white;"><i class="fas fa-save"></i>Enregistrer la balancelle</button>
    </div>
  </div>
</div>

<!-- ═══ MODAL : RELEVÉ EAU ════════════════════════════════════════ -->
<div id="newEauModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
  <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:560px;margin:1rem;overflow:hidden;">
    <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#0284c7,#0369a1);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-water" style="margin-right:8px;"></i>Relevé consommation d&#39;eau</h3><button onclick="document.getElementById('newEauModal').style.display='none'" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
    <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div><label class="form-label">Date *</label><input id="eau_date" type="date" value="${today}" class="form-input"/></div>
      <div><label class="form-label">Volume (m³)</label><input id="eau_vol" type="number" step="0.001" placeholder="1.250" class="form-input"/></div>
      <div><label class="form-label">pH</label><input id="eau_ph" type="number" step="0.01" placeholder="7.0" class="form-input"/></div>
      <div><label class="form-label">Température (°C)</label><input id="eau_temp" type="number" step="0.1" placeholder="18.0" class="form-input"/></div>
      <div><label class="form-label">Turbidité (NTU)</label><input id="eau_turb" type="number" step="0.1" placeholder="1.0" class="form-input"/></div>
      <div><label class="form-label">Chlore (mg/L)</label><input id="eau_chlore" type="number" step="0.01" placeholder="0.10" class="form-input"/></div>
      <div style="grid-column:span 2;"><label class="form-label">Observations</label><textarea id="eau_obs" rows="2" class="form-input" style="resize:vertical;"></textarea></div>
      <div style="grid-column:span 2;display:flex;align-items:center;gap:8px;"><input id="eau_conf" type="checkbox" checked style="width:16px;height:16px;"/><label style="font-size:.82rem;font-weight:600;color:#374151;">Conforme aux seuils réglementaires</label></div>
    </div>
    <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="document.getElementById('newEauModal').style.display='none'" class="btn btn-secondary">Annuler</button><button onclick="enregistrerEau()" class="btn" style="background:linear-gradient(135deg,#0284c7,#0369a1);color:white;"><i class="fas fa-save"></i> Enregistrer</button></div>
  </div>
</div>

<!-- ═══ MODAL : RELEVÉ BAIN ═══════════════════════════════════════ -->
<div id="newBainModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
  <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:620px;margin:1rem;overflow:hidden;max-height:90vh;overflow-y:auto;">
    <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#7c3aed,#6d28d9);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-flask" style="margin-right:8px;"></i>Relevé périodique bain</h3><button onclick="document.getElementById('newBainModal').style.display='none'" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
    <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div><label class="form-label">Date *</label><input id="bain_date" type="date" value="${today}" class="form-input"/></div>
      <div><label class="form-label">Bain *</label><select id="bain_nom" class="form-input"><option>Principal OAS</option><option>Bain de lavage</option><option>Rinçage 1</option><option>Rinçage 2</option><option>Neutralisation</option></select></div>
      <div><label class="form-label">pH</label><input id="bain_ph" type="number" step="0.01" placeholder="0.85" class="form-input"/></div>
      <div><label class="form-label">Température (°C)</label><input id="bain_temp" type="number" step="0.1" placeholder="21.0" class="form-input"/></div>
      <div><label class="form-label">Concentration (g/L)</label><input id="bain_conc" type="number" step="0.1" placeholder="180" class="form-input"/></div>
      <div><label class="form-label">Densité</label><input id="bain_dens" type="number" step="0.001" placeholder="1.127" class="form-input"/></div>
      <div><label class="form-label">Titrage H₂SO₄ (g/L)</label><input id="bain_ta" type="number" step="0.1" placeholder="185" class="form-input"/></div>
      <div><label class="form-label">Titrage Al (g/L)</label><input id="bain_tal" type="number" step="0.1" placeholder="8.2" class="form-input"/></div>
      <div><label class="form-label">Conductivité (mS/cm)</label><input id="bain_cond" type="number" step="0.1" placeholder="420" class="form-input"/></div>
      <div style="display:flex;align-items:center;gap:8px;align-self:end;"><input id="bain_conf" type="checkbox" checked style="width:16px;height:16px;"/><label style="font-size:.82rem;font-weight:600;color:#374151;">Conforme</label></div>
      <div style="grid-column:span 2;"><label class="form-label">Observations</label><textarea id="bain_obs" rows="2" class="form-input" style="resize:vertical;"></textarea></div>
    </div>
    <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="document.getElementById('newBainModal').style.display='none'" class="btn btn-secondary">Annuler</button><button onclick="enregistrerBain()" class="btn" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;"><i class="fas fa-save"></i> Enregistrer</button></div>
  </div>
</div>

<!-- ═══ MODAL : CLÔTURE BALANCELLE + AUTOCONTRÔLE → PV ══════════ -->
<div id="cloreBalModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:550;">
  <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:680px;margin:1rem;overflow:hidden;max-height:92vh;overflow-y:auto;">
    <div style="padding:14px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#22c55e,#16a34a);position:sticky;top:0;z-index:10;">
      <h3 style="font-weight:800;color:white;font-size:.98rem;margin:0;"><i class="fas fa-clipboard-check" style="margin-right:8px;"></i>Clôture balancelle — Autocontrôle OAS</h3>
      <button onclick="closeCloreBalModal()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
    </div>
    <div style="padding:22px;">
      <div id="cloreBalCtx" style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:10px 14px;font-size:.78rem;color:#15803d;margin-bottom:16px;font-weight:600;"></div>

      <div style="font-weight:800;color:#1e293b;font-size:.85rem;margin-bottom:8px;"><i class="fas fa-flask" style="color:#22c55e;margin-right:5px;"></i>Mesures finales</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;">
        <div><label class="form-label">pH final bain</label><input id="cb_ph" type="number" step="0.01" placeholder="0.85" class="form-input"/></div>
        <div><label class="form-label">Température finale (°C)</label><input id="cb_temp" type="number" step="0.1" placeholder="21.0" class="form-input"/></div>
        <div><label class="form-label">Épaisseur anodique (µm)</label><input id="cb_epais" type="number" step="0.1" placeholder="20" class="form-input"/></div>
        <div><label class="form-label">Cp</label><input id="cb_cp" type="number" step="0.01" placeholder="1.33" class="form-input"/></div>
        <div><label class="form-label">Cpk</label><input id="cb_cpk" type="number" step="0.01" placeholder="1.20" class="form-input"/></div>
        <div><label class="form-label">Heure de sortie *</label><input id="cb_sortie" type="datetime-local" class="form-input"/></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div>
          <label class="form-label">Aspect visuel</label>
          <select id="cb_aspect" class="form-input">
            <option value="Uniforme">Uniforme — couleur homogène</option>
            <option value="Léger voile">Léger voile</option>
            <option value="Tache locale">Tache locale</option>
            <option value="Coulure">Coulure</option>
            <option value="Brûlure">Brûlure</option>
          </select>
        </div>
        <div>
          <label class="form-label">Résultat autocontrôle *</label>
          <select id="cb_resultat" class="form-input">
            <option value="conforme">✓ Conforme — libéré</option>
            <option value="non_conforme">✗ Non conforme — bloqué (NC ouverte)</option>
          </select>
        </div>
      </div>

      <div style="margin-bottom:14px;">
        <label class="form-label">Observations / anomalies</label>
        <textarea id="cb_obs" rows="2" class="form-input" placeholder="Couleur bain, résistances, anomalies, actions correctives…" style="resize:vertical;"></textarea>
      </div>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;margin-bottom:8px;">
        <div style="font-size:.74rem;font-weight:800;color:#92400e;margin-bottom:8px;"><i class="fas fa-id-badge" style="margin-right:5px;"></i>Identification opérateur (PIN requis)</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <input id="cb_mat" type="text" placeholder="Matricule" style="border:1.5px solid #fde68a;border-radius:8px;padding:.5rem .75rem;font-size:.85rem;background:white;outline:none;font-family:monospace;text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()"/>
          <input id="cb_pin" type="password" placeholder="Code PIN" style="border:1.5px solid #fde68a;border-radius:8px;padding:.5rem .75rem;font-size:.85rem;background:white;outline:none;"/>
        </div>
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 14px;font-size:.72rem;color:#1d4ed8;"><i class="fas fa-clipboard-list" style="margin-right:4px;"></i>À validation, un <strong>PV de contrôle</strong> est automatiquement créé dans le service Qualité (type : autocontrôle).</div>
    </div>
    <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;background:white;position:sticky;bottom:0;">
      <button onclick="closeCloreBalModal()" class="btn btn-secondary">Annuler</button>
      <button onclick="confirmerCloreBal()" class="btn" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:white;"><i class="fas fa-check"></i>Valider la clôture + créer le PV</button>
    </div>
  </div>
</div>

<script>
// ─── Navigation onglets ──────────────────────────────────────
var OAS_TABS=${sjX(TAB_IDS)};
function showOasTab(id){
  OAS_TABS.forEach(function(t){
    var p=document.getElementById('oaspanel-'+t); if(p){ p.classList.toggle('active',t===id); }
    var b=document.getElementById('oastab-'+t);  if(b){ if(t===id) b.classList.add('active'); else b.classList.remove('active'); }
  });
}

// ─── Données contexte balancelle ─────────────────────────────
var OAS_LOTS_DROPDOWN = ${sjX(lotsDropdown)};
var MAX_SURFACE_MM2 = ${MAX_SURFACE_MM2};
var balItemCounter = 0;

function lotOptionsHtml(selectedId){
  var html='<option value="">— Choisir un lot —</option>';
  for(var i=0;i<OAS_LOTS_DROPDOWN.length;i++){
    var l=OAS_LOTS_DROPDOWN[i];
    var sel=(String(l.id)===String(selectedId||''))?' selected':'';
    var restant=Math.max(0,(l.qte||0)-(l.qte_traitee||0));
    html+='<option value="'+l.id+'" data-surface="'+(l.surface_unit_default||1000)+'" data-restant="'+restant+'"'+sel+'>'+l.id+' · '+(l.piece||'—')+' · reste '+restant+' pcs</option>';
  }
  return html;
}

function addBalItem(preselectLotId){
  var idx = ++balItemCounter;
  var list = document.getElementById('balItemsList');
  if(!list) return;
  var div = document.createElement('div');
  div.className = 'bal-item-row';
  div.id = 'balItem_'+idx;
  div.innerHTML = ''
    + '<div><label class="form-label">Lot</label><select class="form-input balItem-lot" onchange="onBalLotChange('+idx+')">'+lotOptionsHtml(preselectLotId)+'</select></div>'
    + '<div><label class="form-label">Référence pièce</label><input type="text" class="form-input balItem-ref" placeholder="DISSIP-A24"/></div>'
    + '<div><label class="form-label">Surface unitaire (mm²)</label><input type="number" step="1" min="0" class="form-input balItem-surf" oninput="recomputeBalGauge()" placeholder="1000"/></div>'
    + '<div><label class="form-label">Nb pièces</label><input type="number" step="1" min="0" class="form-input balItem-qte" oninput="recomputeBalGauge()" placeholder="0"/></div>'
    + '<div><button onclick="removeBalItem('+idx+')" title="Supprimer cette référence" style="padding:8px 11px;border-radius:8px;background:#fef2f2;color:#b91c1c;border:1.5px solid #fca5a5;cursor:pointer;"><i class="fas fa-trash"></i></button></div>';
  list.appendChild(div);
  if(preselectLotId) onBalLotChange(idx);
}

function onBalLotChange(idx){
  var row = document.getElementById('balItem_'+idx);
  if(!row) return;
  var sel = row.querySelector('.balItem-lot');
  var opt = sel.options[sel.selectedIndex];
  if(!opt) return;
  var surf = opt.getAttribute('data-surface');
  var surfInput = row.querySelector('.balItem-surf');
  if(surf && !surfInput.value){ surfInput.value = surf; }
  // Préremplir la référence avec la pièce si vide
  var refInput = row.querySelector('.balItem-ref');
  var lotId = sel.value;
  if(lotId && !refInput.value){
    var lot = OAS_LOTS_DROPDOWN.find(function(l){return String(l.id)===String(lotId);});
    if(lot) refInput.value = lot.piece || '';
  }
  recomputeBalGauge();
}

function removeBalItem(idx){
  var row = document.getElementById('balItem_'+idx);
  if(row) row.parentNode.removeChild(row);
  recomputeBalGauge();
}

function recomputeBalGauge(){
  var rows = document.querySelectorAll('#balItemsList .bal-item-row');
  var total = 0;
  rows.forEach(function(r){
    var s = parseFloat(r.querySelector('.balItem-surf').value)||0;
    var q = parseFloat(r.querySelector('.balItem-qte').value)||0;
    total += s*q;
  });
  var pct = Math.min(150, Math.round(total/MAX_SURFACE_MM2*100));
  var pctClamped = Math.min(100, pct);
  var bar = document.getElementById('balGaugeBar');
  var lbl = document.getElementById('balGaugeLabel');
  var msg = document.getElementById('balGaugeMsg');
  if(!bar||!lbl||!msg) return;
  bar.style.width = pctClamped + '%';
  var bg = '#22c55e';
  if(pct>=90 && pct<=100) bg = '#f59e0b';
  if(pct>100) bg = '#ef4444';
  bar.style.background = pct>100 ? bg : 'linear-gradient(90deg,#22c55e,'+(pct>=70?'#f59e0b':'#06b6d4')+')';
  lbl.textContent = Math.round(total).toLocaleString('fr-FR')+' / '+MAX_SURFACE_MM2.toLocaleString('fr-FR')+' mm² ('+pct+'%)';
  lbl.style.color = pct>100 ? '#ef4444' : (pct>=85 ? '#d97706' : '#0e7490');
  if(pct>100){ msg.innerHTML='<i class="fas fa-exclamation-triangle" style="color:#ef4444;margin-right:4px;"></i><strong style="color:#ef4444;">Charge dépassée</strong> : retirez des pièces ou réduisez la quantité.'; }
  else if(pct>=85){ msg.innerHTML='<i class="fas fa-info-circle" style="color:#d97706;margin-right:4px;"></i>Charge proche du maximum, marge limitée.'; }
  else if(rows.length===0){ msg.textContent='Ajoutez des références pour calculer la charge.'; }
  else { msg.textContent='Charge OK · marge libre = '+Math.round(MAX_SURFACE_MM2-total).toLocaleString('fr-FR')+' mm².'; }
}

function openNewBal(){
  var now=new Date(); var pad=function(n){return String(n).padStart(2,'0');};
  var dt=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+'T'+pad(now.getHours())+':'+pad(now.getMinutes());
  document.getElementById('nb_entree').value=dt;
  document.getElementById('nb_num').value='OAS-'+now.getFullYear()+'-'+String(Math.floor(Math.random()*9000)+1000);
  document.getElementById('nb_obs').value='';
  // Reset items
  document.getElementById('balItemsList').innerHTML='';
  balItemCounter=0;
  addBalItem(); // démarre avec une ligne
  recomputeBalGauge();
  document.getElementById('newBalModal').style.display='flex';
}
function openBalFromLot(lotId){
  openNewBal();
  // Pré-sélectionne le lot dans la première ligne
  setTimeout(function(){
    var first = document.querySelector('#balItem_1 .balItem-lot');
    if(first){ first.value = lotId; onBalLotChange(1); }
  }, 50);
}
function closeBalModal(){ document.getElementById('newBalModal').style.display='none'; }

function creerBalancelle(){
  var rows = document.querySelectorAll('#balItemsList .bal-item-row');
  if(rows.length===0){ pushNotif('err','fa-exclamation-circle','Ajoutez au moins une référence.'); return; }
  var items=[]; var ok=true;
  rows.forEach(function(r){
    var lot=r.querySelector('.balItem-lot').value;
    var ref=r.querySelector('.balItem-ref').value;
    var s=parseFloat(r.querySelector('.balItem-surf').value)||0;
    var q=parseFloat(r.querySelector('.balItem-qte').value)||0;
    if(!lot){ ok=false; }
    if(s<=0||q<=0){ ok=false; }
    items.push({lot_id:lot, ref:ref, surface_unit:s, qte:q});
  });
  if(!ok){ pushNotif('err','fa-exclamation-circle','Chaque ligne doit avoir un lot, une surface > 0 et une quantité > 0.'); return; }
  var total = items.reduce(function(s,it){return s+it.surface_unit*it.qte;},0);
  if(total>MAX_SURFACE_MM2){ pushNotif('err','fa-ban','Surface totale '+Math.round(total)+' mm² > limite ('+MAX_SURFACE_MM2+' mm²).'); return; }
  var payload = {
    num_session: document.getElementById('nb_num').value,
    type_traitement: document.getElementById('nb_type').value,
    bain_nom: document.getElementById('nb_bain').value,
    date_entree: new Date(document.getElementById('nb_entree').value).toISOString(),
    observations: document.getElementById('nb_obs').value,
    items: items
  };
  fetch('/api/oas/balancelle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Création échouée.'); return; }
      closeBalModal();
      pushNotif('ok','fa-atom','Balancelle <strong>'+payload.num_session+'</strong> créée · '+items.length+' réf · '+(j.charge_pct||0)+'% de charge.',5500);
      setTimeout(function(){softReload();},900);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}

// ─── Clôture balancelle via formulaire d'autocontrôle ────────
var _cloreBalId=null, _cloreBalNum='';
function openCloreBalModal(id,num,lotId,piece){
  _cloreBalId=id; _cloreBalNum=num;
  var ctx=document.getElementById('cloreBalCtx');
  if(ctx) ctx.innerHTML='<i class="fas fa-atom" style="margin-right:5px;"></i>Session <strong>'+num+'</strong> · Lot <strong>'+(lotId||'—')+'</strong> · Pièce <strong>'+(piece||'—')+'</strong>';
  var now=new Date(); var pad=function(n){return String(n).padStart(2,'0');};
  document.getElementById('cb_sortie').value=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate())+'T'+pad(now.getHours())+':'+pad(now.getMinutes());
  ['cb_ph','cb_temp','cb_epais','cb_cp','cb_cpk','cb_obs','cb_mat','cb_pin'].forEach(function(k){ var el=document.getElementById(k); if(el) el.value=''; });
  document.getElementById('cb_aspect').value='Uniforme';
  document.getElementById('cb_resultat').value='conforme';
  document.getElementById('cloreBalModal').style.display='flex';
}
function closeCloreBalModal(){ document.getElementById('cloreBalModal').style.display='none'; _cloreBalId=null; }
function confirmerCloreBal(){
  if(!_cloreBalId){ closeCloreBalModal(); return; }
  var mat=(document.getElementById('cb_mat').value||'').trim();
  var pin=(document.getElementById('cb_pin').value||'').trim();
  if(!mat||!pin){ pushNotif('err','fa-id-badge','Matricule + code PIN requis.'); return; }
  var sortieRaw=document.getElementById('cb_sortie').value;
  if(!sortieRaw){ pushNotif('err','fa-exclamation-circle','Heure de sortie obligatoire.'); return; }
  var payload={
    matricule:mat, pin:pin,
    date_sortie:new Date(sortieRaw).toISOString(),
    resultat:document.getElementById('cb_resultat').value,
    ph_final:parseFloat(document.getElementById('cb_ph').value)||null,
    temperature_finale:parseFloat(document.getElementById('cb_temp').value)||null,
    epaisseur_um:parseFloat(document.getElementById('cb_epais').value)||null,
    cp:parseFloat(document.getElementById('cb_cp').value)||null,
    cpk:parseFloat(document.getElementById('cb_cpk').value)||null,
    aspect:document.getElementById('cb_aspect').value,
    observations:document.getElementById('cb_obs').value||''
  };
  fetch('/api/oas/balancelle/'+encodeURIComponent(_cloreBalId)+'/cloturer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Clôture refusée (matricule/PIN ?).'); return; }
      closeCloreBalModal();
      pushNotif('ok','fa-clipboard-check','Balancelle <strong>'+_cloreBalNum+'</strong> clôturée · PV <strong>'+(j.pv_num||'créé')+'</strong> envoyé à la Qualité.',6000);
      setTimeout(function(){softReload();},1100);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}

// ─── Recherche balancelles par n° affaire / lot / session ────
function filterBalancelles(q){
  var lq=(q||'').toLowerCase().trim();
  document.querySelectorAll('.bal-row').forEach(function(r){
    r.style.display = (!lq || (r.getAttribute('data-search')||'').indexOf(lq) >= 0) ? '' : 'none';
  });
}

// ─── Modal relevé eau ────────────────────────────────────────
function openNewEau(){ document.getElementById('newEauModal').style.display='flex'; }
function enregistrerEau(){
  var d=document.getElementById('eau_date').value;
  if(!d){ pushNotif('err','fa-exclamation-circle','Date obligatoire.'); return; }
  var num=function(id){ var v=document.getElementById(id).value; if(v==null||v===''){return null;} var n=Number(v); return isNaN(n)?null:n; };
  var payload={
    date_releve:d,
    volume_m3:num('eau_vol'),
    ph:num('eau_ph'),
    temperature:num('eau_temp'),
    turbidite:num('eau_turb'),
    chlore:num('eau_chlore'),
    observations:document.getElementById('eau_obs').value||null,
    conforme:document.getElementById('eau_conf').checked
  };
  fetch('/api/oas/releve-eau',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Enregistrement échoué.'); return; }
      document.getElementById('newEauModal').style.display='none';
      if(j.hse_creee){ pushNotif('ok','fa-leaf','Relevé eau du '+d+' enregistré · '+j.hse_creee+' mesure(s) HSE créée(s).',5000); }
      else { pushNotif('ok','fa-water','Relevé eau du '+d+' enregistré.'); }
      setTimeout(function(){softReload();},800);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}

// ─── Modal relevé bain ───────────────────────────────────────
function openNewBain(){ document.getElementById('newBainModal').style.display='flex'; }
function enregistrerBain(){
  var d=document.getElementById('bain_date').value; var b=document.getElementById('bain_nom').value;
  if(!d||!b){ pushNotif('err','fa-exclamation-circle','Date et bain obligatoires.'); return; }
  var num=function(id){ var v=document.getElementById(id).value; if(v==null||v===''){return null;} var n=Number(v); return isNaN(n)?null:n; };
  var payload={
    date_releve:d,
    bain_nom:b,
    ph:num('bain_ph'),
    temperature:num('bain_temp'),
    concentration_gl:num('bain_conc'),
    densite:num('bain_dens'),
    titrage_acide:num('bain_ta'),
    titrage_alu:num('bain_tal'),
    conductivite:num('bain_cond'),
    observations:document.getElementById('bain_obs').value||null,
    conforme:document.getElementById('bain_conf').checked
  };
  fetch('/api/oas/releve-bain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Enregistrement échoué.'); return; }
      document.getElementById('newBainModal').style.display='none';
      if(j.nc_creee){ pushNotif('warn','fa-exclamation-triangle','Bain <strong>'+b+'</strong> non conforme : NC ouverte côté Qualité.',6000); }
      else { pushNotif('ok','fa-flask','Relevé bain <strong>'+b+'</strong> du '+d+' enregistré.'); }
      setTimeout(function(){softReload();},900);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
</script>`

  return layout('Service OAS', content + demandeAchatModal('OAS', '#06b6d4'), 'service-oas')
}
