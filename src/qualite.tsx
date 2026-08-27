// ══════════════════════════════════════════════════════════════
// QUALITÉ – Service Qualité unifié
// PV Contrôle · NC · 8D · Libération lots · Audits · Périssables · Dashboard
// ══════════════════════════════════════════════════════════════
import { escX, layout, serviceHeader, demandeAchatModal, buildValDirMap, valDirBadge } from './shared'
import { brandBlockHTML, BRAND } from './brand'
import { referentielsPanel, paretoCard, normeGrid, isoGridScript, ecmeTypeLabel, ECME_TYPES, ecmeStatutLive, ecmeAvecGrille, ecmeEstPC, ecmeResultatLabel, ECME_RESULTATS, ecmeAddMonths, AUDIT_THEMES_PROCESS, AUDIT_THEMES_TERRAIN, AUDIT_REFERENTIELS, NC_TYPE_OPTS, NC_IMPUTATIONS, NC_NATURES, NC_ACTIONS_IMMEDIATES, NC_STATUTS_LISTE, NC_CAUSE_OPTS, NC_POSTES_LISTE, NC_RESPONSABLES } from './qref'
import type {
  NonConformite, PVControle, Quarantaine, Audit, ProduitPerissable, Operateur
} from './types'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

const RED   = '#ef4444'
const RED_D = '#dc2626'
const TODAY = () => new Date().toISOString().slice(0, 10)

// ─── Données de démonstration ─────────────────────────────────

const NC_DEFAULT: NonConformite[] = []

const PV_DEFAULT: PVControle[] = []

const QUARANTAINES_DEFAULT: Quarantaine[] = []

const AUDITS_DEFAULT: Audit[] = []

const PERISSABLES_DEFAULT: ProduitPerissable[] = []

// ─── Helpers ──────────────────────────────────────────────────

const TH = (t: string) => `<th style="text-align:left;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;">${t}</th>`
const THC = (t: string) => `<th style="text-align:center;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;">${t}</th>`
const TD = (v: string, extra = '') => `<td style="padding:8px 12px;font-size:.79rem;color:#374151;border-bottom:1px solid #f8fafc;vertical-align:middle;${extra}">${v}</td>`
const TDC = (v: string, extra = '') => `<td style="padding:8px 12px;font-size:.79rem;color:#374151;border-bottom:1px solid #f8fafc;vertical-align:middle;text-align:center;${extra}">${v}</td>`

function badge(bg: string, col: string, txt: string) {
  return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:.68rem;font-weight:700;background:${bg};color:${col};">${txt}</span>`
}

function graviteBadge(g: string) {
  const m: Record<string,[string,string]> = {
    Mineure:   ['#fef9c3','#854d0e'],
    Majeure:   ['#fed7aa','#9a3412'],
    Critique:  ['#fee2e2','#b91c1c'],
    Bloquante: ['#1f2937','#f87171'],
  }
  return badge(m[g]?.[0]??'#f1f5f9', m[g]?.[1]??'#6b7280', g)
}

function ncStatutBadge(s: string) {
  const m: Record<string,[string,string,string]> = {
    en_cours:  ['#dbeafe','#1d4ed8','En cours'],
    '8D_ouvert':['#fef3c7','#92400e','8D ouvert'],
    cloture:   ['#dcfce7','#15803d','Clôturé ✓'],
    traite:    ['#dcfce7','#15803d','Traité ✓'],
  }
  const v = m[s] ?? ['#f1f5f9','#6b7280', s]
  return badge(v[0], v[1], v[2])
}

function pvStatutBadge(s: string) {
  const m: Record<string,[string,string,string]> = {
    en_cours:  ['#dbeafe','#1d4ed8','En cours'],
    valide:    ['#dcfce7','#15803d','Validé ✓'],
    refuse:    ['#fee2e2','#b91c1c','Refusé'],
    nc_ouverte:['#fef3c7','#92400e','NC ouverte'],
  }
  const v = m[s] ?? ['#f1f5f9','#6b7280', s]
  return badge(v[0], v[1], v[2])
}

function pvDecisionBadge(d?: string) {
  if (!d) return '<span style="color:#9ca3af;">—</span>'
  const m: Record<string,[string,string,string]> = {
    libere:             ['#dcfce7','#15803d','Libéré ✓'],
    libere_derogation:  ['#fef3c7','#854d0e','Libéré (dérogation)'],
    bloque:             ['#fee2e2','#b91c1c','Bloqué ✗'],
  }
  const v = m[d] ?? ['#f1f5f9','#6b7280', d]
  return badge(v[0], v[1], v[2])
}

function quarStatutBadge(s: string) {
  const m: Record<string,[string,string,string]> = {
    en_cours: ['#fef3c7','#92400e','En quarantaine'],
    en_validation: ['#dbeafe','#1d4ed8','Validation Direction'],
    libere:   ['#dcfce7','#15803d','Libéré ✓'],
    libere_derogation: ['#e0e7ff','#4338ca','Libéré (dérogation)'],
    rejete:   ['#fee2e2','#b91c1c','Rejeté'],
  }
  const v = m[s] ?? ['#f1f5f9','#6b7280', s]
  return badge(v[0], v[1], v[2])
}

function auditStatutBadge(s: string) {
  const m: Record<string,[string,string,string]> = {
    planifie: ['#dbeafe','#1d4ed8','Planifié'],
    en_cours: ['#fef3c7','#92400e','En cours'],
    realise:  ['#dcfce7','#15803d','Réalisé ✓'],
    cloture:  ['#f1f5f9','#6b7280','Clôturé'],
  }
  const v = m[s] ?? ['#f1f5f9','#6b7280', s]
  return badge(v[0], v[1], v[2])
}

function perStatutBadge(s: string) {
  const m: Record<string,[string,string,string]> = {
    valide:       ['#dcfce7','#15803d','Valide ✓'],
    a_renouveler: ['#fef3c7','#92400e','À renouveler ⚠'],
    expire:       ['#fee2e2','#b91c1c','Expiré ✗'],
    archive:      ['#f1f5f9','#6b7280','Archivé'],
  }
  const v = m[s] ?? ['#f1f5f9','#6b7280', s]
  return badge(v[0], v[1], v[2])
}

function ncOrigineBadge(type: string, detecteur?: string) {
  if (type === 'NC Fournisseur' || detecteur === 'Réception') return badge('#e0e7ff','#3730a3','Fournisseur')
  if (detecteur === 'Client' || type === 'NC Client') return badge('#fce7f3','#9d174d','Client')
  if (detecteur === 'Audit') return badge('#f3e8ff','#6b21a8','Audit')
  if (detecteur === 'Opérateur') return badge('#cffafe','#0e7490','Auto-BDT')
  if (detecteur === 'Contrôleur') return badge('#fef9c3','#78350f','Auto-OAS')
  return badge('#f1f5f9','#6b7280','Manuel')
}

function kpiCard(icon: string, col: string, val: string|number, lbl: string, sub = '') {
  return `<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${col};">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div style="width:36px;height:36px;border-radius:10px;background:${col}18;display:flex;align-items:center;justify-content:center;">
        <i class="fas ${icon}" style="color:${col};font-size:.9rem;"></i>
      </div>
      <div style="font-size:1.5rem;font-weight:900;color:#111827;">${val}</div>
    </div>
    <div style="font-size:.75rem;font-weight:700;color:#374151;">${lbl}</div>
    ${sub ? `<div style="font-size:.68rem;color:#9ca3af;margin-top:2px;">${sub}</div>` : ''}
  </div>`
}

function panelHdr(title: string, icon: string, col: string, count?: number) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
    <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
      <i class="fas ${icon}" style="color:${col};"></i>${title}
      ${count !== undefined ? `<span style="background:${col}20;color:${col};border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${count}</span>` : ''}
    </div>
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PANELS
// ══════════════════════════════════════════════════════════════

function deriverOriginePV(pv: PVControle): 'oas' | 'bdt' | 'bl_fourn' | 'bl_st' | 'retour_client' | 'autre' {
  const obs = String((pv as any).observations || '').toLowerCase()
  const pvAny = pv as any
  if (obs.includes('retour client')) return 'retour_client'
  if (pv.type_controle === 'reception') {
    if (obs.includes('sous-traitant') || obs.includes('sous traitant') || obs.includes('sous_traitant')) return 'bl_st'
    return 'bl_fourn'
  }
  if (pv.type_controle === 'autocontrole' || pv.type_controle === 'intermediaire' || pv.type_controle === 'final') {
    if (obs.includes('balancelle') || obs.includes('oxydation') || obs.includes('oas')) return 'oas'
    if (obs.includes('bdt') || pvAny.lot_id) return 'bdt'
  }
  return 'autre'
}

function origineBadge(o: string) {
  const m: Record<string, [string, string, string]> = {
    oas:           ['#cffafe', '#0e7490', 'OAS'],
    bdt:           ['#fed7aa', '#c2410c', 'BDT'],
    bl_fourn:      ['#dbeafe', '#1d4ed8', 'BL Fournisseur'],
    bl_st:         ['#ede9fe', '#6d28d9', 'BL Sous-traitant'],
    retour_client: ['#fee2e2', '#b91c1c', 'Retour client'],
    autre:         ['#f1f5f9', '#475569', 'Autre'],
  }
  const [bg, co, l] = m[o] || m.autre
  return `<span style="background:${bg};color:${co};border-radius:999px;padding:2px 9px;font-size:.66rem;font-weight:700;">${l}</span>`
}

function panelPV(pvs: PVControle[]) {
  const origines: Array<{ key: string; label: string; icon: string }> = [
    { key: 'tous',          label: 'Tous',                   icon: 'fa-th-list' },
    { key: 'oas',           label: 'OAS',                    icon: 'fa-atom' },
    { key: 'bdt',           label: 'BDT',                    icon: 'fa-hard-hat' },
    { key: 'bl_fourn',      label: 'BL Fournisseur',         icon: 'fa-truck' },
    { key: 'bl_st',         label: 'BL Sous-traitant',       icon: 'fa-people-arrows' },
    { key: 'retour_client', label: 'Retour client',          icon: 'fa-undo' },
  ]
  const cnt: Record<string, number> = { tous: pvs.length, oas: 0, bdt: 0, bl_fourn: 0, bl_st: 0, retour_client: 0, autre: 0 }
  pvs.forEach(pv => { const o = deriverOriginePV(pv); cnt[o] = (cnt[o] || 0) + 1 })

  return `
  <div id="qual-panel-pv" style="display:block;">
    ${panelHdr('PV de Contrôle Qualité','fa-clipboard-check',RED, pvs.length)}
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#991b1b;display:flex;align-items:center;gap:10px;">
      <i class="fas fa-info-circle"></i>
      <span>Un PV peut provenir de l'<strong>OAS</strong> (balancelle clôturée), d'un <strong>BDT</strong> soldé, d'un <strong>BL fournisseur</strong> (réception), d'un <strong>BL sous-traitant</strong> (retour ST) ou d'un <strong>retour client</strong>. Filtrez ci-dessous selon l'origine.</span>
    </div>

    <!-- Filtres par origine -->
    <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:.68rem;font-weight:800;color:#94a3b8;text-transform:uppercase;align-self:center;margin-right:4px;">Origine</span>
      ${origines.map((o, i) => `<button onclick="qualFiltrePV('${o.key}')" id="pv-filter-${o.key}" class="pv-filter-btn${i===0?' pf-active':''}" style="padding:5px 13px;border-radius:999px;border:1.5px solid ${i===0?RED+'60':'#e2e8f0'};background:${i===0?RED+'15':'#f8fafc'};color:${i===0?RED:'#6b7280'};font-size:.72rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;"><i class="fas ${o.icon}" style="font-size:.7rem;"></i>${o.label}<span style="background:${i===0?RED+'25':'#e2e8f0'};color:${i===0?RED:'#475569'};border-radius:999px;padding:1px 7px;font-size:.62rem;font-weight:800;">${cnt[o.key] ?? 0}</span></button>`).join('')}
    </div>

    <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px;">
      <input type="text" id="pv-search" placeholder="Rechercher…" oninput="qualFilter('qual-tbl-pv',this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:220px;"/>
      <button onclick="qualOpenModal('pv')" style="padding:8px 18px;background:linear-gradient(135deg,${RED},${RED_D});color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Nouveau PV</button>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;" id="qual-tbl-pv">
          <thead><tr style="background:#fafafa;border-bottom:2px solid #f1f5f9;">
            ${TH('N° PV')}${TH('Date')}${TH('Origine')}${TH('Type contrôle')}${TH('Lien')}${TH('Pièce')}${TH('Client / Fourn.')}${THC('Cp/Cpk')}${THC('Statut')}${THC('Décision')}${THC('Actions')}
          </tr></thead>
          <tbody>
            ${pvs.length === 0 ? `<tr><td colspan="11" style="text-align:center;padding:32px;color:#9ca3af;font-size:.82rem;"><i class="fas fa-clipboard" style="font-size:1.5rem;display:block;margin-bottom:8px;color:#e2e8f0;"></i>Aucun PV de contrôle</td></tr>` :
            pvs.map(pv => {
              const orig = deriverOriginePV(pv)
              return `
            <tr class="pv-row" data-origine="${orig}" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
              ${TD(`<div style="font-weight:700;color:${RED};">${escX(pv.num_pv ?? pv.id)}</div>`)}
              ${TD(`<span style="font-size:.75rem;color:#6b7280;">${pv.date_pv}</span>`)}
              ${TD(origineBadge(orig))}
              ${TD(`<span style="font-size:.75rem;color:#374151;">${pv.type_controle ?? '—'}</span>`)}
              ${TD(pv.type_lien === 'lot' ? badge('#dbeafe','#1d4ed8','Lot') + ` <span style="font-size:.72rem;color:#6b7280;margin-left:4px;">${escX(pv.lot_id??'')}</span>` : badge('#fef3c7','#92400e','BL') + ` <span style="font-size:.72rem;color:#6b7280;margin-left:4px;">${escX(pv.bl_id??'')}</span>`)}
              ${TD(`<span style="font-weight:600;">${escX(pv.piece ?? '—')}</span>`)}
              ${TD(escX(pv.client_nom ?? '—'))}
              ${TDC(pv.cp !== undefined ? `<span style="font-weight:700;color:${(pv.cpk??0)>=1.33?'#15803d':(pv.cpk??0)>=1?'#854d0e':'#b91c1c'};">${pv.cp?.toFixed(2)} / ${pv.cpk?.toFixed(2)}</span>` : '<span style="color:#9ca3af;">N/A</span>')}
              ${TDC(pvStatutBadge(pv.statut))}
              ${TDC(pvDecisionBadge(pv.decision))}
              ${TDC(`<div style="display:flex;gap:6px;justify-content:center;">
                <button onclick="qualOpenNC('${pv.id}')" title="Ouvrir NC" style="padding:5px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-exclamation-triangle"></i></button>
                <button onclick="qualLiberLot('${pv.id}')" title="Libérer lot" style="padding:5px 10px;background:#dcfce7;color:#15803d;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-unlock"></i></button>
              </div>`)}
            </tr>`}).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`
}

function panelNC(ncs: NonConformite[], vdMap: Record<string, any> = {}) {
  const origines = ['Toutes','Auto-OAS','Auto-BDT','Fournisseur','Client','Audit','Manuel']
  return `
  <div id="qual-panel-nc" style="display:none;">
    ${panelHdr('Non-Conformités','fa-exclamation-triangle',RED, ncs.length)}
    <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#78350f;display:flex;align-items:center;gap:10px;">
      <i class="fas fa-info-circle"></i>
      <span>Les NC peuvent être créées <strong>automatiquement</strong> (fin de balancelle OAS, soldage BDT, réception fournisseur) ou <strong>manuellement</strong>. Un rapport 8D ne peut être ouvert qu'à partir d'une NC existante.</span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">
      <div style="flex:1;"></div>
      <input type="text" placeholder="Rechercher…" oninput="qualFilter('qual-tbl-nc',this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:200px;"/>
      <button onclick="qualOpenModal('nc')" style="padding:8px 18px;background:linear-gradient(135deg,${RED},${RED_D});color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Nouvelle NC</button>
    </div>
    <div style="display:flex;gap:18px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
      <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:.68rem;font-weight:800;color:#94a3b8;text-transform:uppercase;margin-right:4px;">Catégorie</span>
        ${[['Toutes','Toutes'],['administratif','Administratif'],['prod','Production']].map(([k,l],i) => `<button onclick="qualFiltreNCCat('${k}')" id="nc-cat-${k}" class="nc-cat-btn${i===0?' nc-active':''}" style="padding:4px 12px;border-radius:999px;border:1.5px solid ${i===0?'#6366f160':'#e2e8f0'};background:${i===0?'#6366f115':'#f8fafc'};color:${i===0?'#4338ca':'#6b7280'};font-size:.72rem;font-weight:700;cursor:pointer;">${l}</button>`).join('')}
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:.68rem;font-weight:800;color:#94a3b8;text-transform:uppercase;margin-right:4px;">Entité</span>
        ${[['Toutes','Toutes'],['Seem','Seem'],['Semrac','Semrac']].map(([k,l],i) => `<button onclick="qualFiltreNCEnt('${k}')" id="nc-ent-${k}" class="nc-ent-btn${i===0?' ne-active':''}" style="padding:4px 12px;border-radius:999px;border:1.5px solid ${i===0?'#0891b260':'#e2e8f0'};background:${i===0?'#0891b215':'#f8fafc'};color:${i===0?'#0e7490':'#6b7280'};font-size:.72rem;font-weight:700;cursor:pointer;">${l}</button>`).join('')}
      </div>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;" id="qual-tbl-nc">
          <thead><tr style="background:#fafafa;border-bottom:2px solid #f1f5f9;">
            ${TH('N° NC')}${TH('Entrée')}${TH('Fin traitement')}${TH('Type NC')}${TH('Catégorie')}${TH('Entité')}${TH('Lot')}${TH('Article')}${TH('Fournisseur')}${TH('Client')}${TH('Détection')}${TH('Imputation')}${TH('FRC')}${THC('Gravité')}${THC('Statut')}${THC('Actions')}
          </tr></thead>
          <tbody>
            ${ncs.length === 0 ? `<tr><td colspan="16" style="text-align:center;padding:32px;color:#9ca3af;font-size:.82rem;">Aucune non-conformité</td></tr>` :
            ncs.map(nc => `
            <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''" data-origine="${ncOrigineKey(nc.type_nc, nc.detecteur)}" data-categorie="${ncCategorieKey(nc)}" data-entite="${ncEntiteKey(nc) || 'NA'}">
              ${TD(`<div onclick="qualEditNC('${escX(nc.id)}')" style="font-weight:700;color:${RED};cursor:pointer;text-decoration:underline;" title="Rouvrir / modifier cette NC">${escX(nc.id)}</div>`)}
              ${TD(`<span style="font-size:.75rem;color:#6b7280;">${nc.date_nc ?? '—'}</span>`)}
              ${TD(/clotur|clôtur|ferm|clos|libér|liber|rejet|résolu|resolu|trait|annul/i.test(String(nc.statut||'')) ? `<span style="font-size:.75rem;color:#16a34a;font-weight:600;">${String(((nc as any).date_cloture ?? (nc as any).updated_at) || '').slice(0,10) || '—'}</span>` : '<span style="font-size:.72rem;color:#9ca3af;">en cours</span>')}
              ${TD(`<span style="font-size:.75rem;">${escX(nc.type_nc)}</span>`)}
              ${TD(ncCategorieBadge(nc))}
              ${TD(ncEntiteBadge(nc))}
              ${TD(`<span style="font-size:.74rem;font-weight:700;color:#374151;">${escX(nc.lot_ref ?? '—')}</span>`)}
              ${TD(`${(nc as any).ref_article ? `<div style="font-size:.72rem;color:#4338ca;font-family:monospace;font-weight:700;">${escX((nc as any).ref_article)}</div>` : ''}${(nc as any).designation ? `<div style="font-size:.66rem;color:#94a3b8;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escX((nc as any).designation)}</div>` : ''}${(!(nc as any).ref_article && !(nc as any).designation) ? '<span style="color:#9ca3af;">—</span>' : ''}`)}
              ${TD(`<span style="font-size:.72rem;color:#7c3aed;">${(nc as any).fournisseur_nom ? escX((nc as any).fournisseur_nom) : '<span style="color:#9ca3af;">—</span>'}</span>`)}
              ${TD(`<span style="font-size:.72rem;color:#374151;">${nc.client_nom ? escX(nc.client_nom) : '<span style="color:#9ca3af;">—</span>'}</span>`)}
              ${TD(`<span style="font-size:.7rem;color:#374151;">${escX((nc as any).lieu_detection ?? nc.operation ?? '—')}</span>`)}
              ${TD(`<span style="font-size:.7rem;color:#374151;">${escX((nc as any).lieu_imputation ?? '—')}</span>`)}
              ${TD(`<span style="font-size:.72rem;color:#6b7280;">${escX((nc as any).frc ?? '—')}</span>`)}
              ${TDC(graviteBadge(nc.gravite))}
              ${TDC(`<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">${ncStatutBadge(nc.statut)}${valDirBadge(vdMap, 'non_conformites', nc.id)}</div>`)}
              ${TDC(`<div style="display:flex;gap:6px;justify-content:center;">
                <button onclick="qualOuvrir8D('${nc.id}')" style="padding:5px 12px;background:${nc.statut==='8D_ouvert'?'#f1f5f9':'linear-gradient(135deg,#f59e0b,#d97706)'};color:${nc.statut==='8D_ouvert'?'#6b7280':'white'};border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;${nc.statut==='cloture'?'opacity:.5;cursor:not-allowed;':''}">${nc.statut==='8D_ouvert'?'8D en cours':'Ouvrir 8D'}</button>
                <button onclick="qualDerogFromNC('${escX(nc.id)}')" title="Créer une dérogation liée à cette NC" style="padding:5px 10px;background:#fff7ed;color:#c2410c;border:1.5px solid #fed7aa;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-file-signature"></i></button>
                <button onclick="qualQuarFromNC('${escX(nc.id)}')" title="Mettre un objet en quarantaine (depuis cette NC)" style="padding:5px 10px;background:#fffbeb;color:#92400e;border:1.5px solid #fde68a;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-box-archive"></i></button>
                ${(String(nc.type_nc || '').toLowerCase().includes('client') || nc.detecteur === 'Client') ? ((nc as any).decision_retour ? `<span title="Retour déjà traité (${escX((nc as any).decision_retour)})" style="padding:5px 8px;background:#ecfdf5;color:#047857;border:1.5px solid #a7f3d0;border-radius:7px;font-size:.66rem;font-weight:800;">${(nc as any).decision_retour === 'avoir' ? 'Avoir ' + escX((nc as any).avoir_id || '') : (nc as any).decision_retour === 'commande_p' ? 'Cmd P ' + escX((nc as any).cmdp_id || '') : 'Refusé'}</span>` : `<button onclick="qualTraiterRetour('${escX(nc.id)}')" title="Traiter le retour client : avoir ou commande prioritaire" style="padding:5px 10px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-rotate-left" style="margin-right:4px;"></i>Retour</button>`) : ''}
              </div>`)}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div id="quarNCModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1150;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;width:92%;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#111827;"><i class="fas fa-box-archive" style="color:#92400e;margin-right:8px;"></i>Mettre en quarantaine</div>
        <div style="padding:18px 20px;">
          <input type="hidden" id="qn_ncid"/>
          <div style="font-size:.72rem;color:#6b7280;margin-bottom:10px;">Isoler <strong>n'importe quel objet</strong> de l'usine (lot, palette, outillage, réception…) lié à cette NC, en attendant une décision.</div>
          <div style="display:grid;gap:10px;">
            <div><label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Objet mis en quarantaine *</label><input id="qn_label" type="text" placeholder="Ex. Palette zone B3, Outillage 1408296001, Réception fournisseur X…" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;"/></div>
            <div><label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Lot / réf. (optionnel)</label><input id="qn_ref" type="text" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;"/></div>
            <div><label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Motif</label><textarea id="qn_motif" rows="2" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;resize:vertical;"></textarea></div>
          </div>
        </div>
        <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
          <button onclick="document.getElementById('quarNCModal').style.display='none'" style="padding:9px 16px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:600;cursor:pointer;">Annuler</button>
          <button onclick="qnSubmit()" style="padding:9px 16px;background:linear-gradient(135deg,#d97706,#92400e);color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;"><i class="fas fa-box-archive" style="margin-right:5px;"></i>Mettre en quarantaine</button>
        </div>
      </div>
    </div>
    <script>
      window.NC_LINK=${sjX(ncs.map((n: any) => ({ id: n.id, client_nom: n.client_nom, designation: (n as any).designation, operation: n.operation, ref_article: (n as any).ref_article, lot_ref: n.lot_ref, description: (n as any).description, nb_pieces: (n as any).nb_pieces, n_commande: (n as any).n_commande, affaire_id: (n as any).affaire_id })))};
      window.NC_LISTES=${sjX({ types: NC_TYPE_OPTS, imputations: NC_IMPUTATIONS, natures: NC_NATURES, actions: NC_ACTIONS_IMMEDIATES, statuts: NC_STATUTS_LISTE, causes: NC_CAUSE_OPTS, postes: NC_POSTES_LISTE, responsables: NC_RESPONSABLES })};
      window.NC_FORM=${sjX(Object.fromEntries((ncs as any[]).map((n: any) => [n.id, { type_nc: n.type_nc || '', categorie: n.categorie || '', entite: n.entite || '', gravite: n.gravite || '', detecteur: n.detecteur || '', fournisseur_nom: n.fournisseur_nom || '', client_nom: n.client_nom || '', frc: n.frc || '', lot_ref: n.lot_ref || '', ref_article: n.ref_article || '', designation: n.designation || '', type_defaut: n.type_defaut || '', type_cause: n.type_cause || '', action_corrective: n.action_corrective || '', statut: n.statut || '', responsable: n.responsable || '', lieu_detection: n.lieu_detection || '', lieu_imputation: n.lieu_imputation || '', description: n.description || '' }])))};
      function qualQuarFromNC(ncId){ var nc=(window.NC_LINK||[]).find(function(x){return String(x.id)===String(ncId);})||{}; function set(f,v){var e=document.getElementById(f); if(e)e.value=(v==null?'':v);} set('qn_ncid',ncId); set('qn_label',nc.designation||nc.ref_article||nc.lot_ref||''); set('qn_ref',nc.lot_ref||''); set('qn_motif','NC '+ncId+(nc.description?(' \\u2014 '+nc.description):'')); document.getElementById('quarNCModal').style.display='flex'; }
      function qnSubmit(){ var id=document.getElementById('qn_ncid').value; var label=document.getElementById('qn_label').value; if(!label){ pushNotif('err','fa-exclamation-circle','Renseignez l\\'objet \\u00e0 mettre en quarantaine.'); return; } fetch('/api/qualite/nc/'+encodeURIComponent(id)+'/quarantaine',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({objet_label:label, objet_ref:document.getElementById('qn_ref').value, motif:document.getElementById('qn_motif').value})}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'\\u00c9chec.'); return; } pushNotif('ok','fa-box-archive','Mis en quarantaine ('+(j.id||'')+') \\u2014 voir l\\'onglet Quarantaine.',4000); document.getElementById('quarNCModal').style.display='none'; setTimeout(function(){softReload();},900); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur r\\u00e9seau.'); }); }
    </script>
    ${retourModalHTML()}
  </div>`
}

// Modal « Traiter le retour client » : facture → affaire, lot + nb pièces, prix de vente (avoir) / coût de revient (commande P)
function retourModalHTML(): string {
  const lb = 'display:block;font-size:.62rem;font-weight:800;color:#6b7280;text-transform:uppercase;margin:8px 0 3px;letter-spacing:.03em;'
  const ip = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.82rem;box-sizing:border-box;'
  return `
  <div id="retourModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(3px);z-index:600;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.3);width:100%;max-width:560px;margin:1rem;max-height:92vh;overflow-y:auto;">
      <div style="padding:14px 20px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;display:flex;align-items:center;justify-content:space-between;">
        <h3 style="font-weight:800;font-size:.95rem;"><i class="fas fa-rotate-left" style="margin-right:8px;"></i>Traiter le retour client — <span id="rt-ncid"></span></h3>
        <button onclick="closeRt()" style="background:none;border:none;color:rgba(255,255,255,.85);font-size:1.15rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:16px 20px;">
        <div id="rt-info" style="font-size:.76rem;color:#475569;background:#f8fafc;border:1px solid #eef2f7;border-radius:10px;padding:9px 12px;margin-bottom:6px;"></div>
        <div style="display:flex;gap:10px;">
          <div style="flex:1;"><label style="${lb}">N° de facture</label><input id="rt-facture" placeholder="ex : FA-2026-…" style="${ip}"/></div>
          <div style="flex:1;"><label style="${lb}">N° d'affaire (base de la numérotation)</label><input id="rt-affaire" oninput="rtRenumber()" placeholder="ex : AFF-2026-001" style="${ip}"/></div>
        </div>
        <label style="${lb}">Lot(s) concerné(s)</label><input id="rt-lot" style="${ip}"/>
        <div style="display:flex;gap:10px;">
          <div style="width:130px;"><label style="${lb}">Pièces NC</label><input id="rt-nb" type="number" min="0" step="1" oninput="rtCalc()" style="${ip}"/></div>
          <div style="flex:1;"><label style="${lb}">Prix de vente unit. (€) → avoir</label><input id="rt-pv" type="number" min="0" step="0.01" oninput="rtCalc()" style="${ip}"/></div>
          <div style="flex:1;"><label style="${lb}">Coût de revient unit. (€) → cmd P</label><input id="rt-pr" type="number" min="0" step="0.01" oninput="rtCalc()" placeholder="auto nomenclature" style="${ip}"/></div>
        </div>
        <div id="rt-calc" style="display:flex;gap:10px;margin-top:12px;">
          <div style="flex:1;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:9px 12px;">
            <div style="font-size:.62rem;font-weight:800;color:#6d28d9;text-transform:uppercase;">Montant de l'avoir</div>
            <div id="rt-montant-avoir" style="font-size:1.15rem;font-weight:900;color:#5b21b6;">0,00 €</div>
            <div id="rt-num-avoir" style="font-size:.64rem;color:#7c3aed;font-weight:700;">AV-—</div>
          </div>
          <div style="flex:1;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:9px 12px;">
            <div style="font-size:.62rem;font-weight:800;color:#c2410c;text-transform:uppercase;">Coût relance (revient)</div>
            <div id="rt-montant-relance" style="font-size:1.15rem;font-weight:900;color:#9a3412;">0,00 €</div>
            <div id="rt-num-cmdp" style="font-size:.64rem;color:#ea580c;font-weight:700;">CMDP-—</div>
          </div>
        </div>
      </div>
      <div style="padding:12px 20px;border-top:1px solid #f1f5f9;display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="rtSubmit('refuse')" style="padding:8px 14px;background:#fef2f2;color:#b91c1c;border:1.5px solid #fecaca;border-radius:9px;font-weight:700;font-size:.78rem;cursor:pointer;">Refuser le retour</button>
        <span style="flex:1;"></span>
        <button onclick="rtSubmit('avoir')" style="padding:8px 16px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:9px;font-weight:800;font-size:.78rem;cursor:pointer;"><i class="fas fa-receipt" style="margin-right:5px;"></i>Faire un avoir</button>
        <button onclick="rtSubmit('commande_p')" style="padding:8px 16px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;border-radius:9px;font-weight:800;font-size:.78rem;cursor:pointer;"><i class="fas fa-bolt" style="margin-right:5px;"></i>Commande prioritaire</button>
      </div>
    </div>
    <script>
      function rtEsc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
      function rtVal(id){ var e=document.getElementById(id); return e?e.value:""; }
      function qualTraiterRetour(id){
        var n=(window.NC_LINK||[]).find(function(x){return String(x.id)===String(id);})||{id:id};
        window.RT_CUR=n;
        document.getElementById("rt-ncid").textContent=id;
        document.getElementById("rt-info").innerHTML="Client : <b>"+rtEsc(n.client_nom||"—")+"</b> · Réf : <b>"+rtEsc(n.ref_article||n.designation||"—")+"</b>"+(n.n_commande?(" · Cmd : <b>"+rtEsc(n.n_commande)+"</b>"):"");
        document.getElementById("rt-facture").value="";
        document.getElementById("rt-affaire").value=rtEsc(n.affaire_id||n.n_commande||"");
        document.getElementById("rt-lot").value=rtEsc(n.lot_ref||"");
        document.getElementById("rt-nb").value=(n.nb_pieces!=null?n.nb_pieces:"");
        document.getElementById("rt-pv").value=""; document.getElementById("rt-pr").value="";
        rtRenumber(); rtCalc();
        document.getElementById("retourModal").style.display="flex";
      }
      function closeRt(){ var m=document.getElementById("retourModal"); if(m) m.style.display="none"; }
      function rtRenumber(){
        var raw=(rtVal("rt-affaire")||"").trim();
        var m=raw.match(/(\\d{4})[-/](\\d{1,5})\\s*$/);
        var year=m?m[1]:String(new Date().getFullYear());
        var xx=m?(("00"+m[2]).slice(-Math.max(3,m[2].length))):(((raw.replace(/\\D/g,"")||"X")+"").padStart(3,"0"));
        document.getElementById("rt-num-avoir").textContent="AV-"+year+"-"+xx;
        document.getElementById("rt-num-cmdp").textContent="CMDP-"+year+"-"+xx;
      }
      function rtCalc(){
        var nb=parseFloat(rtVal("rt-nb"))||0, pv=parseFloat(rtVal("rt-pv"))||0, pr=parseFloat(rtVal("rt-pr"))||0;
        var fmt=function(v){ return (Math.round(v*100)/100).toFixed(2).replace(".",",")+" €"; };
        document.getElementById("rt-montant-avoir").textContent=fmt(nb*pv);
        document.getElementById("rt-montant-relance").textContent=fmt(nb*pr);
      }
      function rtSubmit(decision){
        var n=window.RT_CUR||{}; var id=n.id;
        var body={ decision:decision,
          num_facture:rtVal("rt-facture")||null, num_affaire:rtVal("rt-affaire")||null,
          lot_ref:rtVal("rt-lot")||null, nb_pieces_nc:parseInt(rtVal("rt-nb"),10)||0,
          prix_vente_unitaire:parseFloat(rtVal("rt-pv"))||0, prix_revient_unitaire:parseFloat(rtVal("rt-pr"))||0,
          ref_article:n.ref_article||null, designation:n.designation||null, client_nom:n.client_nom||null };
        if(decision==="avoir" && !(body.prix_vente_unitaire>0 && body.nb_pieces_nc>0)){ if(typeof pushNotif==="function") pushNotif("err","fa-exclamation-triangle","Renseignez le prix de vente unitaire et le nombre de pièces.",4000); return; }
        if(decision!=="refuse" && body.nb_pieces_nc<=0){ if(typeof pushNotif==="function") pushNotif("err","fa-exclamation-triangle","Renseignez le nombre de pièces.",4000); return; }
        fetch("/api/qualite/nc/"+encodeURIComponent(id)+"/traiter-retour",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
          .then(function(r){return r.json();}).then(function(j){
            if(!j||!j.ok){ if(typeof pushNotif==="function") pushNotif("err","fa-times",(j&&j.error)||"Échec du traitement.",5000); return; }
            var msg=decision==="refuse"?"Retour refusé.":decision==="avoir"?("Avoir "+j.num+" créé."):("Commande prioritaire "+j.num+" créée.");
            if(typeof pushNotif==="function") pushNotif("ok","fa-check-circle",msg+" (voir Commercial › Avoirs & Commandes P)",6000);
            closeRt(); setTimeout(function(){ softReload(); },1200);
          }).catch(function(){ if(typeof pushNotif==="function") pushNotif("err","fa-times","Erreur réseau.",5000); });
      }
    </script>
  </div>`
}

// Avancement d'un rapport 8D : nombre d'étapes D1→D8 renseignées
function r8dProgress(r: any): { done: number; pct: number } {
  const steps = [
    Array.isArray(r.d1_equipe) ? r.d1_equipe.length > 0 : !!r.d1_equipe,
    !!r.d2_probleme, !!r.d3_actions_imm, !!r.d4_causes_racines,
    Array.isArray(r.d5_actions_corr) ? r.d5_actions_corr.length > 0 : !!r.d5_actions_corr,
    !!r.d6_mise_en_oeuvre, !!r.d7_prevention, !!r.d8_conclusion,
  ]
  const done = steps.filter(Boolean).length
  return { done, pct: Math.round(done / 8 * 100) }
}
function r8dStatutBadge(s: string): string {
  const map: Record<string, [string, string, string]> = {
    ouvert:                ['Ouvert', '#3b82f6', '#dbeafe'],
    en_cours:              ['En cours', '#d97706', '#fef3c7'],
    en_attente_validation: ['À valider', '#8b5cf6', '#ede9fe'],
    clos:                  ['Clôturé', '#16a34a', '#dcfce7'],
  }
  const [lbl, col, bg] = map[s] || ['—', '#6b7280', '#f1f5f9']
  return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${bg};color:${col};font-size:.68rem;font-weight:800;">${lbl}</span>`
}

function panel8D(rapports: any[]) {
  const R = rapports || []
  const enCours   = R.filter(r => r.statut !== 'clos')
  const completes = R.filter(r => r.statut === 'clos')
  const probleme  = (r: any) => (r.d2_probleme ? String(r.d2_probleme).split(/\r?\n/)[0] : '—')

  const rowEnCours = (r: any) => {
    const { done, pct } = r8dProgress(r)
    const lien = `/qualite/8d?id=${encodeURIComponent(r.id)}`
    return `
    <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
      ${TD(`<div style="font-weight:700;color:#f59e0b;">${escX(r.id)}</div>`)}
      ${TD(`<div style="font-weight:600;color:#374151;font-size:.78rem;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escX(probleme(r))}</div>${r.nc_id ? `<div style="font-size:.68rem;color:${RED};">NC: ${escX(r.nc_id)}</div>` : ''}`)}
      ${TDC(graviteBadge(r.gravite))}
      ${TD(`<span style="font-size:.78rem;">${escX(r.client_id ?? '—')}</span>`)}
      ${TD(`<span style="font-size:.75rem;color:#6b7280;">${escX(r.responsable ?? '—')}</span>`)}
      ${TDC(r8dStatutBadge(r.statut))}
      ${TDC(`<div style="display:flex;align-items:center;gap:8px;">
        <div style="flex:1;height:6px;background:#f1f5f9;border-radius:999px;min-width:70px;">
          <div style="height:100%;background:linear-gradient(90deg,#f59e0b,#d97706);border-radius:999px;width:${pct}%;"></div>
        </div>
        <span style="font-size:.68rem;color:#92400e;font-weight:700;">D${done}/8</span>
      </div>`)}
      ${TDC(`<div style="display:flex;gap:6px;justify-content:center;">
        <a href="${lien}" style="padding:5px 12px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border-radius:7px;font-size:.7rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-pen"></i>Compléter</a>
        <button onclick="qual8DTerminer('${r.id}')" title="Marquer le rapport comme complété" style="padding:5px 12px;background:#dcfce7;color:#16a34a;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-check"></i></button>
      </div>`)}
    </tr>`
  }
  const rowComplete = (r: any) => `
    <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
      ${TD(`<div style="font-weight:700;color:#16a34a;">${escX(r.id)}</div>`)}
      ${TD(`<div style="font-weight:600;color:#374151;font-size:.78rem;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escX(probleme(r))}</div>`)}
      ${TDC(graviteBadge(r.gravite))}
      ${TD(`<span style="font-size:.78rem;">${escX(r.client_id ?? '—')}</span>`)}
      ${TD(`<span style="font-size:.75rem;color:#6b7280;">${escX(r.responsable ?? '—')}</span>`)}
      ${TDC(`<span style="font-size:.75rem;color:#6b7280;">${r.date_cloture ?? '—'}</span>`)}
      ${TDC(`<a href="/qualite/8d?id=${encodeURIComponent(r.id)}" style="padding:5px 12px;background:#f1f5f9;color:#374151;border-radius:7px;font-size:.7rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-eye"></i>Voir</a>`)}
    </tr>`

  return `
  <div id="qual-panel-8d" style="display:none;">
    ${panelHdr('Rapports 8D','fa-project-diagram','#f59e0b', enCours.length)}
    <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
      <button onclick="qual8DNouveau()" style="padding:9px 20px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;box-shadow:0 2px 8px rgba(245,158,11,.3);">
        <i class="fas fa-plus-circle"></i>Créer un rapport 8D
      </button>
      <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:8px 14px;font-size:.78rem;color:#78350f;display:flex;align-items:center;gap:8px;flex:1;">
        <i class="fas fa-info-circle"></i>
        <span>Un rapport 8D peut être ouvert <strong>librement</strong> ou <strong>depuis une NC existante</strong> (onglet NC → "Ouvrir 8D").</span>
      </div>
    </div>
    <!-- Formulaire 8D autonome (masqué par défaut) -->
    <div id="qual-8d-form" style="display:none;background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.08);padding:24px;margin-bottom:18px;border-top:3px solid #f59e0b;">
      <div style="font-size:.88rem;font-weight:800;color:#111827;margin-bottom:16px;"><i class="fas fa-project-diagram" style="color:#f59e0b;margin-right:8px;"></i>Nouveau rapport 8D — Création autonome</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Titre du problème *</label>
          <input id="8d-titre" type="text" placeholder="Description courte du problème" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Client concerné</label>
          <input id="8d-client" type="text" placeholder="ex: Legrand, Valeo…" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Gravité</label>
          <select id="8d-gravite" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;">
            <option value="mineure">Mineure</option>
            <option value="majeure" selected>Majeure</option>
            <option value="critique">Critique</option>
            <option value="bloquante">Bloquante</option>
          </select></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Lot / Réf. produit</label>
          <input id="8d-lot" type="text" placeholder="ex: LOT-2026-091" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Responsable 8D</label>
          <input id="8d-resp" type="text" placeholder="Nom du pilote" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date détection</label>
          <input id="8d-date" type="date" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/></div>
        <div style="grid-column:1/-1;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Description du problème (D2)</label>
          <textarea id="8d-desc" rows="2" placeholder="Qui, Quoi, Où, Quand, Comment, Combien, Pourquoi…" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;resize:vertical;"></textarea></div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button onclick="document.getElementById('qual-8d-form').style.display='none'" style="padding:8px 18px;border:1.5px solid #e2e8f0;border-radius:8px;background:white;cursor:pointer;font-size:.82rem;font-weight:600;color:#374151;">Annuler</button>
        <button onclick="qual8DSave()" style="padding:8px 20px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:8px;cursor:pointer;font-size:.82rem;font-weight:700;"><i class="fas fa-save" style="margin-right:6px;"></i>Créer le rapport 8D</button>
      </div>
    </div>

    <!-- Liste 1 : rapports à créer / en cours -->
    <div style="font-size:.82rem;font-weight:800;color:#92400e;margin:4px 0 10px;display:flex;align-items:center;gap:8px;"><i class="fas fa-spinner"></i>Rapports 8D à compléter / en cours <span style="background:#fef3c7;color:#92400e;border-radius:999px;padding:1px 9px;font-size:.7rem;">${enCours.length}</span></div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:24px;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;" id="qual-tbl-8d">
          <thead><tr style="background:#fafafa;border-bottom:2px solid #f1f5f9;">
            ${TH('N° 8D')}${TH('Problème')}${TH('Gravité')}${TH('Client')}${TH('Responsable')}${THC('Statut')}${THC('Avancement')}${THC('Actions')}
          </tr></thead>
          <tbody>
            ${enCours.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:32px;color:#9ca3af;font-size:.82rem;"><i class="fas fa-project-diagram" style="font-size:1.5rem;display:block;margin-bottom:8px;color:#fde68a;"></i>Aucun rapport 8D en cours — cliquez sur « Créer un rapport 8D »</td></tr>` :
            enCours.map(rowEnCours).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Liste 2 : rapports complétés -->
    <div style="font-size:.82rem;font-weight:800;color:#166534;margin:4px 0 10px;display:flex;align-items:center;gap:8px;"><i class="fas fa-check-circle"></i>Rapports 8D complétés <span style="background:#dcfce7;color:#166534;border-radius:999px;padding:1px 9px;font-size:.7rem;">${completes.length}</span></div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;" id="qual-tbl-8d-done">
          <thead><tr style="background:#fafafa;border-bottom:2px solid #f1f5f9;">
            ${TH('N° 8D')}${TH('Problème')}${TH('Gravité')}${TH('Client')}${TH('Responsable')}${THC('Clôturé le')}${THC('Actions')}
          </tr></thead>
          <tbody>
            ${completes.length === 0 ? `<tr><td colspan="7" style="text-align:center;padding:32px;color:#9ca3af;font-size:.82rem;">Aucun rapport 8D complété pour le moment</td></tr>` :
            completes.map(rowComplete).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`
}

function panelQuarantaine(qs: Quarantaine[]) {
  const enCours = qs.filter(q => q.statut === 'en_cours')
  return `
  <div id="qual-panel-quarantaine" style="display:none;">
    ${panelHdr('Quarantaine','fa-ban','#b91c1c', enCours.length)}
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#b91c1c;display:flex;align-items:center;gap:10px;"><i class="fas fa-ban"></i><span>Flux <strong>séparé</strong> : les lots bloqués (au contrôle final ou ailleurs) sont mis en quarantaine et traités ici, indépendamment de la libération.</span></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      ${kpiCard('fa-ban','#ef4444', enCours.length, 'Lots en quarantaine','En attente de décision')}
      ${kpiCard('fa-clock','#f59e0b', enCours.length>0 ? Math.max(...enCours.map(q=>q.duree_jours??0)) : 0, 'Durée max (jours)','Lot le plus ancien')}
      ${kpiCard('fa-check-circle','#22c55e', qs.filter(q=>q.statut==='libere').length, 'Libérés (total)','Depuis le début')}
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;" id="qual-tbl-liberation">
          <thead><tr style="background:#fafafa;border-bottom:2px solid #f1f5f9;">
            ${TH('N° Quarantaine')}${TH('Lot / Réf.')}${TH('Pièce')}${TH('Client')}${TH('Motif')}${THC('Mise en Q.')}${THC('Durée (j)')}${THC('Statut')}${THC('Actions')}
          </tr></thead>
          <tbody>
            ${qs.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:32px;color:#9ca3af;font-size:.82rem;">Aucun lot en quarantaine</td></tr>` :
            qs.map(q => `
            <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
              ${TD(`<div style="font-weight:700;color:#8b5cf6;">${escX(q.id)}</div>`)}
              ${TD(`<span style="font-size:.75rem;font-weight:600;color:#374151;">${escX(q.lot_id ?? '—')}</span>`)}
              ${TD(escX(q.piece ?? '—'))}
              ${TD(escX(q.client_nom ?? '—'))}
              ${TD(`<span style="font-size:.73rem;color:#6b7280;max-width:180px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escX(q.motif ?? '—')}</span>`)}
              ${TDC(`<span style="font-size:.75rem;color:#6b7280;">${q.date_mise_quarantaine}</span>`)}
              ${TDC(`<span style="font-weight:700;color:${(q.duree_jours??0)>5?'#b91c1c':(q.duree_jours??0)>2?'#92400e':'#374151'};">${q.duree_jours ?? '—'}</span>`)}
              ${TDC(quarStatutBadge(q.statut))}
              ${TDC(q.statut === 'en_cours' ? `<button onclick="qualStatuerQuar('${q.id}')" style="padding:5px 14px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-gavel" style="margin-right:5px;"></i>Statuer</button>` : ((q.statut as string) === 'en_validation' ? `<span style="font-size:.68rem;color:#1d4ed8;font-weight:700;"><i class="fas fa-hourglass-half" style="margin-right:4px;"></i>Validation Direction</span>` : `<span style="color:#9ca3af;font-size:.72rem;">${q.libere_par ? 'Par '+escX(q.libere_par) : '—'}${q.libere_le ? ' · '+escX(q.libere_le) : ''}</span>`))}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div id="quarStatuerModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1150;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;width:92%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#111827;"><i class="fas fa-gavel" style="color:#6d28d9;margin-right:8px;"></i>Statuer la sortie de quarantaine — <span id="qs_title"></span></div>
        <div style="padding:18px 20px;">
          <input type="hidden" id="qs_id"/>
          <div style="margin-bottom:14px;"><label style="display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Décision par</label><input id="qs_auteur" type="text" value="Qualité" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;"/></div>
          <div style="border:1.5px solid #e9d5ff;border-radius:10px;padding:12px;margin-bottom:10px;">
            <div style="font-weight:800;color:#6d28d9;font-size:.78rem;margin-bottom:4px;"><i class="fas fa-crown" style="margin-right:6px;"></i>1 · Validation managériale</div>
            <div style="font-size:.7rem;color:#6b7280;margin-bottom:8px;">Soumettre à la Direction ; sa décision libère ou rejette automatiquement.</div>
            <div style="display:flex;gap:8px;align-items:center;"><select id="qs_prio" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 9px;font-size:.78rem;background:#f8fafc;"><option value="normal">Priorité normale</option><option value="critique">Critique</option></select><button onclick="qsSubmit('validation')" style="padding:7px 14px;background:#ede9fe;color:#6d28d9;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.76rem;">Soumettre à la Direction</button></div>
          </div>
          <div style="border:1.5px solid #fed7aa;border-radius:10px;padding:12px;margin-bottom:10px;">
            <div style="font-weight:800;color:#c2410c;font-size:.78rem;margin-bottom:4px;"><i class="fas fa-file-signature" style="margin-right:6px;"></i>2 · Dérogation</div>
            <div style="font-size:.7rem;color:#6b7280;margin-bottom:8px;">Créer une demande de dérogation (le lot est libéré sous dérogation, à compléter dans l'onglet Dérogations).</div>
            <button onclick="qsSubmit('derogation')" style="padding:7px 14px;background:#fff7ed;color:#c2410c;border:1.5px solid #fed7aa;border-radius:8px;font-weight:700;cursor:pointer;font-size:.76rem;">Créer une dérogation</button>
          </div>
          <div style="border:1.5px solid #bbf7d0;border-radius:10px;padding:12px;">
            <div style="font-weight:800;color:#15803d;font-size:.78rem;margin-bottom:4px;"><i class="fas fa-pen" style="margin-right:6px;"></i>3 · Décision immédiate</div>
            <textarea id="qs_texte" rows="2" placeholder="Décision (ex. Libéré après retouche / Rebut / Accepté en l'état…)" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;resize:vertical;margin-bottom:8px;"></textarea>
            <div style="display:flex;gap:8px;"><button onclick="qsImmediate('libere')" style="padding:7px 14px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.76rem;"><i class="fas fa-unlock" style="margin-right:5px;"></i>Libérer</button><button onclick="qsImmediate('rejete')" style="padding:7px 14px;background:#fee2e2;color:#b91c1c;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.76rem;">Rejeter</button></div>
          </div>
        </div>
        <div style="padding:12px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;">
          <button onclick="document.getElementById('quarStatuerModal').style.display='none'" style="padding:9px 16px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:600;cursor:pointer;">Fermer</button>
        </div>
      </div>
    </div>
    <script>
      window.QUAR_DATA=${sjX(qs.map((q: any) => ({ id: q.id, piece: q.piece, lot_id: q.lot_id, nc_id: q.nc_id, client_nom: q.client_nom })))};
      function qualStatuerQuar(id){ var q=(window.QUAR_DATA||[]).find(function(x){return String(x.id)===String(id);})||{}; document.getElementById('qs_id').value=id; document.getElementById('qs_title').textContent=(q.piece||q.lot_id||q.id||''); document.getElementById('qs_texte').value=''; document.getElementById('quarStatuerModal').style.display='flex'; }
      function qsPost(body){ var id=document.getElementById('qs_id').value; return fetch('/api/qualite/quarantaine/'+encodeURIComponent(id)+'/statuer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json();}); }
      function qsSubmit(mode){ qsPost({mode:mode, auteur:document.getElementById('qs_auteur').value, priorite:document.getElementById('qs_prio').value}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'\\u00c9chec.'); return; } pushNotif('ok','fa-check',mode==='validation'?'Soumis \\u00e0 la validation de la Direction.':('D\\u00e9rogation '+(j.derogation||'')+' cr\\u00e9\\u00e9e \\u2014 \\u00e0 compl\\u00e9ter dans D\\u00e9rogations.'),4500); document.getElementById('quarStatuerModal').style.display='none'; setTimeout(function(){softReload();},900); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur r\\u00e9seau.'); }); }
      function qsImmediate(issue){ var texte=document.getElementById('qs_texte').value; if(!texte){ pushNotif('err','fa-exclamation-circle','Renseignez la d\\u00e9cision.'); return; } qsPost({mode:'immediate', issue:issue, texte:texte, auteur:document.getElementById('qs_auteur').value}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'\\u00c9chec.'); return; } pushNotif('ok','fa-check',issue==='libere'?'Lot lib\\u00e9r\\u00e9.':'Lot rejet\\u00e9.',3500); document.getElementById('quarStatuerModal').style.display='none'; setTimeout(function(){softReload();},900); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur r\\u00e9seau.'); }); }
    </script>
  </div>`
}

// Libération des lots = contrôle qualité FINAL (tous BDT soldés) avant expédition.
function panelLiberation(aLiberer: any[] = [], liberes: any[] = []) {
  const lotRow = (l: any, released: boolean) => `
    <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
      ${TD(`<div style="font-weight:700;color:#8b5cf6;">${escX(l.id)}</div>`)}
      ${TD(`<span style="font-size:.75rem;font-weight:600;color:#374151;">${escX(l.piece ?? '—')}</span>`)}
      ${TD(`<span style="font-size:.73rem;color:#6b7280;">${escX(l.cmd_id ?? '—')}</span>`)}
      ${TDC(`<span style="font-size:.74rem;color:#374151;">${l.qte ?? '—'}</span>`)}
      ${TDC(`<span style="font-size:.68rem;color:#15803d;font-weight:700;"><i class="fas fa-check-circle" style="margin-right:3px;"></i>${l.nb_bdt ?? 0} BDT soldés</span>`)}
      ${TDC(released
        ? `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;"><span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:800;">Libéré ✓</span>${l.libere_par ? `<span style="font-size:.6rem;color:#94a3b8;">${escX(l.libere_par)}</span>` : ''}</div>`
        : `<button onclick="qualOpenLiberation('${escX(l.id)}')" style="padding:5px 12px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-clipboard-check" style="margin-right:4px;"></i>PV de libération</button>`)}
    </tr>`
  return `
  <div id="qual-panel-liberation" style="display:none;">
    ${panelHdr('Libération de Lots','fa-unlock-alt','#8b5cf6', aLiberer.length)}
    <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#5b21b6;display:flex;align-items:center;gap:10px;"><i class="fas fa-unlock-alt"></i><span><strong>Contrôle qualité final avant expédition.</strong> Un lot apparaît ici une fois <strong>tous ses BDT soldés</strong> : il doit passer un <strong>PV de libération</strong> (libéré, ou bloqué → quarantaine) avant de partir en expédition. Une commande n'est expédiable que si <strong>tous ses lots</strong> sont libérés.</span></div>
    <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Lots terminés à libérer <span style="background:#ede9fe;color:#5b21b6;border-radius:999px;padding:1px 8px;font-size:.68rem;">${aLiberer.length}</span></div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#fafafa;border-bottom:2px solid #f1f5f9;">${TH('N° Lot')}${TH('Pièce')}${TH('Commande')}${THC('Qté')}${THC('Production')}${THC('Action')}</tr></thead>
        <tbody>${aLiberer.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:28px;color:#9ca3af;font-size:.82rem;">Aucun lot terminé en attente de libération</td></tr>` : aLiberer.map((l: any) => lotRow(l, false)).join('')}</tbody>
      </table></div>
    </div>
    <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Lots libérés <span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:1px 8px;font-size:.68rem;">${liberes.length}</span></div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#fafafa;border-bottom:2px solid #f1f5f9;">${TH('N° Lot')}${TH('Pièce')}${TH('Commande')}${THC('Qté')}${THC('Production')}${THC('Statut')}</tr></thead>
        <tbody>${liberes.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:24px;color:#9ca3af;font-size:.82rem;">Aucun lot libéré</td></tr>` : liberes.map((l: any) => lotRow(l, true)).join('')}</tbody>
      </table></div>
    </div>
  </div>`
}

// ══════════════════════════════════════════════════════════════
// MODULE AUDITS DE CONFORMITÉ (SMI QSE + SI) — 8 sous-onglets imbriqués
// ══════════════════════════════════════════════════════════════
const AUDIT_STATUTS: Record<string, [string, string, string]> = {
  a_planifier:    ['#f1f5f9', '#475569', 'À planifier'],
  planifie:       ['#dbeafe', '#1d4ed8', 'Planifié'],
  realise:        ['#fef3c7', '#92400e', 'Réalisé'],
  rapport_envoye: ['#e0e7ff', '#4338ca', 'Rapport envoyé'],
  retour_recu:    ['#cffafe', '#0e7490', 'Retour reçu'],
  cloture:        ['#dcfce7', '#15803d', 'Clôturé'],
}
function progStatutBadge(s: string) { const m = AUDIT_STATUTS[s] || ['#f1f5f9', '#475569', s || '—']; return badge(m[0], m[1], m[2]) }
const REF_COLORS: Record<string, string> = { '9001': '#0891b2', '9100': '#4338ca', '45001': '#c2410c', '14001': '#15803d', '27001': '#7c3aed' }
function refTagsHTML(csv: string) {
  return String(csv || '').split(',').map(r => r.trim()).filter(Boolean).map(r => {
    const c = REF_COLORS[r] || '#64748b'
    return `<span style="display:inline-block;padding:1px 6px;border-radius:6px;font-size:.6rem;font-weight:800;background:${c}1f;color:${c};margin:1px;">${escX(r)}</span>`
  }).join('')
}
function themeTagsHTML(csv: string) {
  return String(csv || '').split(',').map(r => r.trim()).filter(Boolean).map(r =>
    `<span style="display:inline-block;padding:1px 5px;border-radius:5px;font-size:.6rem;font-weight:700;background:#f1f5f9;color:#475569;margin:1px;">${escX(r)}</span>`).join('')
}
const AUDIT_TYPES: Record<string, [string, string]> = {
  process: ['#4338ca', 'Processus'], poste: ['#0891b2', 'Poste'], flash: ['#0d9488', 'Flash'],
  procede: ['#c2410c', 'Procédé spécial'], client: ['#7c3aed', 'Exigence client'],
}
function auditTypeBadge(t: string) { const m = AUDIT_TYPES[t] || ['#64748b', t || '—']; return badge(m[0] + '1f', m[0], m[1]) }
function progTrimestre(a: any): number {
  if (a.trimestre) return Number(a.trimestre)
  if (a.date_cible) { const mo = new Date(a.date_cible).getMonth(); if (!isNaN(mo)) return Math.floor(mo / 3) + 1 }
  return 0
}
function progRow(a: any): string {
  const isLate = a.date_cible && String(a.date_cible).slice(0, 10) < TODAY() && a.statut !== 'realise' && a.statut !== 'cloture' && a.statut !== 'rapport_envoye' && a.statut !== 'retour_recu'
  const solde = a.statut === 'cloture' || !!a.plan_action_solde
  return `<tr data-ex="${escX(String(a.exercice || ''))}" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
    ${TD(`<div style="font-weight:700;color:#0e7490;">${escX(a.entite_auditee || '—')}</div>${a.famille ? `<div style="font-size:.62rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;">${escX(a.famille)}</div>` : ''}`)}
    ${TDC(auditTypeBadge(a.type))}
    ${TD(themeTagsHTML(a.themes))}
    ${TD(refTagsHTML(a.referentiels))}
    ${TDC(`<span style="font-size:.72rem;color:#6b7280;">${a.date_cible ? escX(String(a.date_cible).slice(0, 10)) : '—'}${isLate ? ' <i class="fas fa-triangle-exclamation" style="color:#dc2626;" title="En retard"></i>' : ''}</span>`)}
    ${TD(`<span style="font-size:.73rem;">${escX(a.auditeur || '—')}</span>${a.audite_principal ? `<div style="font-size:.62rem;color:#94a3b8;">audité : ${escX(a.audite_principal)}</div>` : ''}`)}
    ${TDC(progStatutBadge(a.statut))}
    ${TDC(`<div style="display:flex;gap:5px;justify-content:center;">
      <button onclick="auditEditLigne('${escX(a.id)}')" title="Modifier (date, auditeur, statut…)" style="border:none;background:#eff6ff;color:#2563eb;border-radius:6px;padding:5px 8px;cursor:pointer;font-size:.72rem;"><i class="fas fa-pen"></i></button>
      <button onclick="auditFill('${escX(a.id)}')" title="Remplir la fiche d'évaluation" style="border:none;background:#ecfeff;color:#0e7490;border-radius:6px;padding:5px 8px;cursor:pointer;font-size:.72rem;"><i class="fas fa-clipboard-check"></i></button>
      ${solde
        ? `<a href="/api/audit/programme/${escX(a.id)}/rapport.pdf" target="_blank" title="Télécharger le rapport d'audit (PDF)" style="text-decoration:none;background:#dcfce7;color:#15803d;border-radius:6px;padding:5px 8px;font-size:.72rem;font-weight:700;"><i class="fas fa-file-arrow-down"></i></a>`
        : `<span title="Rapport disponible une fois l'audit soldé" style="background:#f8fafc;color:#cbd5e1;border-radius:6px;padding:5px 8px;font-size:.72rem;cursor:not-allowed;"><i class="fas fa-file-pdf"></i></span>`}
      <button onclick="auditDelLigne('${escX(a.id)}')" title="Supprimer" style="border:none;background:#fee2e2;color:#b91c1c;border-radius:6px;padding:5px 8px;cursor:pointer;font-size:.72rem;"><i class="fas fa-trash"></i></button>
    </div>`)}
  </tr>`
}
function progTableHTML(list: any[], emptyMsg: string): string {
  return `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;"><div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#fafafa;">${TH('Entité auditée')}${THC('Type')}${TH('Thèmes')}${TH('Référentiels')}${THC('Date cible')}${TH('Auditeur')}${THC('Statut')}${THC('Actions')}</tr></thead>
      <tbody>${list.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:26px;color:#9ca3af;font-size:.82rem;">${emptyMsg}</td></tr>` : list.map(progRow).join('')}</tbody>
    </table></div></div>`
}
function viveCardHTML(s: any): string {
  const M: Record<string, [string, string, string, string]> = {
    conforme: ['#dcfce7', '#15803d', 'fa-circle-check', 'Conforme'],
    nc:       ['#fee2e2', '#b91c1c', 'fa-circle-xmark', 'Écart détecté'],
    inconnu:  ['#f1f5f9', '#64748b', 'fa-circle-question', 'Non renseigné'],
  }
  const m = M[s.statut] || M['inconnu']
  return `<div style="background:white;border:1px solid #eef2f7;border-left:4px solid ${m[1]};border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.05);">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><i class="fas ${m[2]}" style="color:${m[1]};"></i><span style="font-weight:800;color:#111827;font-size:.82rem;">${escX(s.label)}</span></div>
    <div style="font-size:.74rem;color:#6b7280;min-height:32px;">${escX(s.preuve)}</div>
    <div style="margin-top:6px;display:flex;align-items:center;justify-content:space-between;">${badge(m[0], m[1], m[3])}<span style="font-size:.66rem;color:#9ca3af;">${s.ko > 0 ? s.ko + ' / ' : ''}${s.total} enreg.</span></div>
  </div>`
}
function coverageMatrixHTML(prog: any[]): string {
  const procRows = Array.from(new Set(prog.filter(p => p.type === 'process').map(p => p.entite_auditee).filter(Boolean)))
  const themeCodes = AUDIT_THEMES_PROCESS.map(t => t[0])
  const cell = (ent: string, code: string) => {
    const lines = prog.filter(p => p.entite_auditee === ent && String(p.themes || '').split(',').map(x => x.trim()).includes(code))
    if (!lines.length) return `<td style="text-align:center;color:#e2e8f0;">·</td>`
    const done = lines.some(l => l.statut === 'realise' || l.statut === 'cloture' || l.statut === 'rapport_envoye' || l.statut === 'retour_recu')
    return `<td style="text-align:center;"><span style="color:${done ? '#15803d' : '#2563eb'};" title="${done ? 'Audité' : 'Planifié'}"><i class="fas ${done ? 'fa-circle-check' : 'fa-circle'}" style="font-size:.66rem;"></i></span></td>`
  }
  if (!procRows.length) return `<div style="color:#9ca3af;font-size:.8rem;padding:12px;">Aucun audit processus au programme.</div>`
  return `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.7rem;">
    <thead><tr style="background:#fafafa;">${TH('Processus')}${themeCodes.map(c => `<th style="padding:6px 4px;text-align:center;font-size:.66rem;font-weight:800;color:#0e7490;" title="${escX((AUDIT_THEMES_PROCESS.find(t => t[0] === c) || [,''])[1] || '')}">${c}</th>`).join('')}</tr></thead>
    <tbody>${procRows.map(ent => `<tr style="border-bottom:1px solid #f8fafc;">${TD(`<span style="font-weight:600;">${escX(String(ent))}</span>`)}${themeCodes.map(c => cell(String(ent), c)).join('')}</tr>`).join('')}</tbody>
  </table></div>`
}

// Calendrier annuel des audits : 12 mois, une case/jour colorée selon l'ÉTAT de l'audit du jour —
//   bleu pâle = aucun audit · bleu foncé = programmé (affecté) · jaune = pas fait (échéance dépassée, rien noté)
//   rouge = non conforme (NC ouverte) · vert = soldé conforme.
function auditYearCalendar(ex: any, items: any[]): string {
  const year = Number(ex) || new Date().getFullYear()
  const today = TODAY()
  const byDate: Record<string, any[]> = {}
  for (const p of items) {
    if (!p.date_cible) continue
    const d = String(p.date_cible).slice(0, 10)
    if (d.slice(0, 4) !== String(year)) continue
    ;(byDate[d] = byDate[d] || []).push(p)
  }
  const stateOf = (p: any): string => {
    const done = ['realise', 'cloture', 'rapport_envoye', 'retour_recu'].includes(p.statut) || !!p.date_realisation
    const hasNC = !!(p.non_conformite && String(p.non_conformite).trim())
    const solde = p.plan_action_solde === true || p.statut === 'cloture'
    if (hasNC && !solde) return 'nc'                 // non conforme, NC ouverte
    if (solde || done) return 'conforme'             // soldé / réalisé sans NC ouverte
    const overdue = p.date_cible && String(p.date_cible).slice(0, 10) < today
    return overdue ? 'nonfait' : 'affecte'           // pas fait (dépassé) / programmé à venir
  }
  const PRIO: Record<string, number> = { nc: 4, nonfait: 3, affecte: 2, conforme: 1 }
  const COL: Record<string, [string, string, string]> = {
    nc: ['#dc2626', '#ffffff', 'Non conforme'], nonfait: ['#eab308', '#422006', 'Pas fait / rien noté'],
    affecte: ['#1d4ed8', '#ffffff', 'Programmé'], conforme: ['#16a34a', '#ffffff', 'Soldé conforme'],
  }
  const dayState = (auds: any[]): string => { let best = 'conforme'; for (const p of auds) { const s = stateOf(p); if (PRIO[s] > PRIO[best]) best = s } return best }
  const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const WD = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const p2 = (n: number) => String(n).padStart(2, '0')
  const months = Array.from({ length: 12 }, (_, mi) => {
    const startDow = (new Date(year, mi, 1).getDay() + 6) % 7   // Lundi = 0
    const nDays = new Date(year, mi + 1, 0).getDate()
    let cells = ''
    for (let i = 0; i < startDow; i++) cells += '<div></div>'
    for (let day = 1; day <= nDays; day++) {
      const ds = `${year}-${p2(mi + 1)}-${p2(day)}`
      const aud = byDate[ds]
      if (aud) {
        const [bg, fg, lbl] = COL[dayState(aud)]
        cells += `<div data-audday="${ds}" data-audred="1" title="${escX(aud.map((a: any) => a.entite_auditee || a.id).join(' · '))} — ${lbl} — cliquer" style="min-height:15px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:5px;font-size:.6rem;font-weight:800;cursor:pointer;background:${bg};color:${fg};box-shadow:0 0 0 1px rgba(0,0,0,.12);">${day}</div>`
      } else {
        cells += `<div data-audday="${ds}" data-audred="0" title="Aucun audit — cliquer pour en programmer un" style="min-height:15px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:5px;font-size:.6rem;font-weight:600;cursor:pointer;background:#dbeafe;color:#60a5fa;">${day}</div>`
      }
    }
    return `<div style="background:white;border:1px solid #eef2f7;border-radius:10px;padding:8px;">
      <div style="font-weight:800;color:#0e7490;font-size:.66rem;text-transform:uppercase;margin-bottom:5px;text-align:center;">${MOIS[mi]}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:2px;">${WD.map(w => `<div style="text-align:center;font-size:.5rem;color:#94a3b8;font-weight:700;">${w}</div>`).join('')}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">${cells}</div>
    </div>`
  }).join('')
  const leg = (bg: string, lbl: string) => `<span style="display:inline-flex;align-items:center;gap:4px;"><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:${bg};border:1px solid rgba(0,0,0,.12);"></span> ${lbl}</span>`
  return `<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      <div style="font-weight:800;color:#111827;font-size:.86rem;">Planning annuel ${year} des audits</div>
      <div style="font-size:.65rem;color:#64748b;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">${leg('#dbeafe', 'Aucun')}${leg('#1d4ed8', 'Programmé')}${leg('#eab308', 'Pas fait')}${leg('#dc2626', 'Non conforme')}${leg('#16a34a', 'Soldé conforme')}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:22px;">${months}</div>`
}

function progYearBlock(ex: any, items: any[], visible: boolean): string {
  const done = (p: any) => p.statut === 'realise' || p.statut === 'cloture' || p.statut === 'rapport_envoye' || p.statut === 'retour_recu'
  const nRealise = items.filter(done).length
  const tauxReal = items.length ? Math.round(nRealise / items.length * 100) : 0
  const nLate = items.filter(p => p.date_cible && String(p.date_cible).slice(0, 10) < TODAY() && !done(p)).length
  const nSoldes = items.filter(p => p.plan_action_solde).length
  return `<div class="au-exblock" data-exblock="${escX(String(ex))}" style="display:${visible ? 'block' : 'none'};">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;">
      ${kpiCard('fa-list-ol', '#0891b2', items.length, 'Lignes au programme', 'Exercice ' + escX(String(ex)))}
      ${kpiCard('fa-circle-check', '#22c55e', tauxReal + '%', 'Taux de réalisation', nRealise + ' / ' + items.length)}
      ${kpiCard('fa-triangle-exclamation', '#ef4444', nLate, 'En retard', 'Date cible dépassée')}
      ${kpiCard('fa-clipboard-check', '#8b5cf6', nSoldes, "Plans d'action soldés", '')}
    </div>
    ${auditYearCalendar(ex, items)}
    ${(() => {
      const cats: Array<[string, string, string, string]> = [
        ['process', 'Audits de processus (thèmes A–K)', 'fa-sitemap', '#4338ca'],
        ['poste', 'Audits de poste & flash (thèmes T1–T9)', 'fa-hard-hat', '#0891b2'],
        ['procede', 'Procédés spéciaux (soudure, traitement de surface OAS / Surtec 650, CND…)', 'fa-fire', '#c2410c'],
        ['client', 'Exigences client (flowdown)', 'fa-user-check', '#7c3aed'],
      ]
      const known = new Set(['process', 'poste', 'flash', 'procede', 'client'])
      const secs = cats.map(([key, label, icon, col]) => {
        const its = items.filter(p => key === 'poste' ? (p.type === 'poste' || p.type === 'flash') : p.type === key)
        if (!its.length) return ''
        return `<div style="margin-bottom:18px;">
          <div style="font-size:.74rem;font-weight:800;color:${col};text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;"><i class="fas ${icon}" style="margin-right:5px;"></i>${label} <span style="background:#e2e8f0;color:#475569;border-radius:999px;padding:0 8px;font-size:.66rem;">${its.length}</span></div>
          ${progTableHTML(its, '')}
        </div>`
      }).join('')
      const others = items.filter(p => !known.has(p.type))
      const oth = others.length ? `<div style="margin-bottom:18px;"><div style="font-size:.74rem;font-weight:800;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Autres</div>${progTableHTML(others, '')}</div>` : ''
      return (secs + oth) || progTableHTML([], 'Aucune ligne pour cet exercice — cliquez « Nouvelle ligne » ou importez le classeur.')
    })()}
  </div>`
}

// Filtre par domaine normatif (module Environnement/Sécurité) via referentiels/themes ;
// sans domaine → tout (Qualité). EXPORTÉ pour que le badge de l'onglet compte le MÊME
// périmètre que le panneau : sinon l'onglet annonce 25 lignes et le panneau en montre 3.
export function auditProgDomaine(programme: any[] = [], domaine?: string): any[] {
  if (!domaine) return programme || []
  return (programme || []).filter((p: any) => {
    const r = String(p.referentiels || ''); const th = String(p.themes || '').split(',').map(s => s.trim())
    if (domaine === 'environnement') return r.includes('14001') || th.includes('J')
    if (domaine === 'securite') return r.includes('45001') || th.includes('I')
    return true
  })
}

// Norme portée par un service : Qualité = tout le SMI (hub), Sécurité = ISO 45001,
// Environnement = ISO 14001. Sert à ne montrer, dans chaque service, QUE les critères
// normatifs et les grilles qui le concernent.
const DOMAINE_NORME: Record<string, string> = { securite: 'ISO 45001', environnement: 'ISO 14001' }

export function panelAudit(audits: Audit[], programme: any[] = [], grilles: any[] = [], questions: any[] = [], auto: Record<string, any> = {}, fai: any[] = [], opts: { domaine?: string; titre?: string; nu?: boolean; extras?: Array<{ id: string; label: string; icone: string; badge?: number; html: string }> } = {}) {
  const prog = auditProgDomaine(programme, opts.domaine)
  // Norme du service (undefined en Qualité → aucun filtrage, le hub voit tout le SMI).
  const _norme = opts.domaine ? DOMAINE_NORME[opts.domaine] : ''
  const _normeNum = _norme ? _norme.replace(/\D/g, '') : ''   // '45001' | '14001'
  const exercices = Array.from(new Set(prog.map(p => Number(p.exercice)).filter(n => !!n))).sort((a, b) => a - b)
  const curEx = exercices.length ? exercices[exercices.length - 1] : 0
  const nextEx = (curEx || new Date().getFullYear()) + 1
  const qs = questions || []
  // Thèmes d'audit portant la norme du service (I → SST, J → environnement, T5/T7/T8/T9 → SST).
  const _themeDuDomaine = (t: [string, string, string, string]) => !_normeNum || String(t[2]).replace(/\D/g, ' ').includes(_normeNum)
  const themesProc = AUDIT_THEMES_PROCESS.filter(_themeDuDomaine)
  const themesTerrain = AUDIT_THEMES_TERRAIN.filter(_themeDuDomaine)
  const _codesDomaine = new Set([...themesProc, ...themesTerrain].map(t => t[0]))

  // Grilles pertinentes pour le service. ⚠ Ne PAS filtrer sur `referentiel` : en base il
  // vaut « combine » pour 4 grilles sur 5 — il ne discrimine rien. On filtre sur les
  // THÈMES des questions, qui eux sont normatifs : une grille concerne le service si elle
  // pose au moins une question d'un thème de sa norme (ou si son référentiel la nomme).
  const grl = (grilles || []).filter((g: any) => {
    if (!_normeNum) return true
    const ref = String(g.referentiel || '').replace(/\D/g, '')
    if (ref && ref.includes(_normeNum)) return true
    const gq = qs.filter((q: any) => String(q.grille_id) === String(g.id))
    if (!gq.length) return true                       // grille neuve, encore sans question
    return gq.some((q: any) => _codesDomaine.has(String(q.theme_code || '')))
  })
  const autoArr = Object.values(auto || {})
  const nProc = prog.filter(p => p.type === 'process').length
  const nPoste = prog.filter(p => p.type === 'poste' || p.type === 'flash').length
  const nLate = prog.filter(p => p.date_cible && String(p.date_cible).slice(0, 10) < TODAY() && p.statut !== 'realise' && p.statut !== 'cloture' && p.statut !== 'rapport_envoye' && p.statut !== 'retour_recu').length
  const nRealise = prog.filter(p => p.statut === 'realise' || p.statut === 'cloture' || p.statut === 'rapport_envoye' || p.statut === 'retour_recu').length
  const tauxReal = prog.length ? Math.round(nRealise / prog.length * 100) : 0
  const nSoldes = prog.filter(p => p.plan_action_solde).length
  const viveNC = autoArr.filter((s: any) => s.statut === 'nc').length
  const viveOK = autoArr.filter((s: any) => s.statut === 'conforme').length
  // Constats : réponses NC/AXE des lignes + anciennes colonnes texte
  const constats: any[] = []
  prog.forEach((p: any) => {
    const reps = Array.isArray(p.reponses) ? p.reponses : []
    reps.forEach((r: any, i: number) => { if (r && (r.etat === 'NC' || r.etat === 'AXE')) constats.push({ prog: p, idx: i, etat: r.etat, libelle: r.libelle || '', preuve: r.preuve || '', nc_id: r.nc_id || '' }) })
    if (p.non_conformite) constats.push({ prog: p, idx: -1, etat: 'NC', libelle: p.non_conformite, preuve: '', nc_id: '' })
    if (p.axe_amelioration) constats.push({ prog: p, idx: -2, etat: 'AXE', libelle: p.axe_amelioration, preuve: '', nc_id: '' })
  })

  // Onglets STANDARD (identiques dans Qualité, Sécurité, Environnement) + onglets propres au
  // domaine passés par le module (Veille, Parties intéressées, autodiagnostics…). Une SEULE
  // barre : avant, Sécurité/Environnement empilaient leur propre barre au-dessus de celle-ci,
  // avec des compteurs contradictoires (programme non filtré vs filtré).
  const _extras = opts.extras || []
  const SUBS: Array<[string, string, string, number]> = [
    ['programme', 'Programme', 'fa-calendar-alt', prog.length],
    ['constats', "Constats & plans d'action", 'fa-triangle-exclamation', constats.length],
    ['grilles', 'Grilles', 'fa-list-check', grl.length],
    ['ref', 'Référentiels', 'fa-book', 0],
    ..._extras.map(e => [e.id, e.label, e.icone, e.badge || 0] as [string, string, string, number]),
  ]
  const subBtn = (s: [string, string, string, number], i: number) =>
    `<button id="audit-subbtn-${s[0]}" onclick="auditSub('${s[0]}')" style="padding:7px 13px;border:none;border-radius:8px;font-size:.76rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;background:${i === 0 ? '#0891b2' : 'transparent'};color:${i === 0 ? '#fff' : '#64748b'};"><i class="fas ${s[2]}"></i>${s[1]}${s[3] ? `<span style="background:${i === 0 ? 'rgba(255,255,255,.25)' : '#e2e8f0'};border-radius:999px;padding:0 6px;font-size:.62rem;">${s[3]}</span>` : ''}</button>`

  const wrap = (id: string, i: number, body: string) => `<div id="audit-sub-${id}" style="display:${i === 0 ? 'block' : 'none'};">${body}</div>`

  // ── 1) PROGRAMME (par exercice, avec reconduction annuelle) ──
  const subProgramme = wrap('programme', 0, `
    <div style="background:#ecfeff;border:1px solid #cffafe;border-radius:10px;padding:9px 14px;margin-bottom:16px;font-size:.75rem;color:#155e75;">
      <i class="fas fa-circle-info" style="margin-right:6px;"></i><strong>Ordonnancement annuel</strong> des audits internes (EN 9100 §9.2) — programme glissant fondé sur le risque. Chaque processus/poste/procédé audité ≥ 1×/an. Cycle : planifié → réalisé → constat (NC/8D) → plan d'action → clôture. Utilisez <strong>« Reconduire »</strong> en fin d'exercice pour générer l'année suivante.
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-size:.72rem;font-weight:700;color:#64748b;">Exercice :</span>
        ${exercices.length ? exercices.map(ex => `<button id="au-yearbtn-${ex}" onclick="auditYear('${ex}')" style="padding:5px 12px;border:1px solid #cffafe;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;background:${ex === curEx ? '#0891b2' : '#fff'};color:${ex === curEx ? '#fff' : '#0e7490'};">${ex}</button>`).join('') : '<span style="color:#94a3b8;font-size:.78rem;">aucun exercice</span>'}
        ${curEx ? `<button onclick="auditReconduire()" title="Recopier le programme vers l'année suivante" style="margin-left:6px;padding:5px 12px;border:1px dashed #94a3b8;border-radius:8px;font-size:.76rem;font-weight:700;cursor:pointer;background:#f8fafc;color:#475569;"><i class="fas fa-rotate-right" style="margin-right:5px;"></i>Reconduire pour ${nextEx}</button>` : ''}
      </div>
      <button onclick="auditNewLigne()" style="padding:8px 18px;background:linear-gradient(135deg,#0891b2,#0e7490);color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Nouvelle ligne</button>
    </div>
    ${exercices.length ? exercices.map(ex => progYearBlock(ex, prog.filter(p => Number(p.exercice) === ex), ex === curEx)).join('') : progTableHTML(prog.filter(p => !p.exercice), 'Aucune ligne au programme — cliquez « Nouvelle ligne » ou importez le classeur.')}`)

  // (Programme réunit tous les audits ; les catégories process/poste/procédé y sont séparées en sections — voir progYearBlock.)

  // ── GRILLES ──
  const qByGrille: Record<string, any[]> = {}
  qs.forEach(q => { (qByGrille[String(q.grille_id)] = qByGrille[String(q.grille_id)] || []).push(q) })
  const modeBadge = (m: string) => m === 'auto' ? badge('#dcfce7', '#15803d', 'AUTO') : m === 'assiste' ? badge('#dbeafe', '#1d4ed8', 'ASSISTÉ') : badge('#f1f5f9', '#64748b', 'MANUEL')
  const subGrilles = wrap('grilles', 3, `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <div><div style="font-weight:800;color:#111827;font-size:.86rem;">Bibliothèque de grilles d'audit</div><div style="font-size:.72rem;color:#94a3b8;">Question par question · mode AUTO / ASSISTÉ / MANUEL + sonde ERP</div></div>
      <button onclick="auditNewGrille()" style="padding:8px 16px;background:linear-gradient(135deg,#0891b2,#0e7490);color:white;border:none;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Nouvelle grille</button>
    </div>
    ${grl.length === 0 ? `<div style="color:#9ca3af;font-size:.82rem;padding:20px;background:white;border-radius:12px;">${_norme
      ? `Aucune grille d'audit <strong>${_norme}</strong> — cliquez « Nouvelle grille » pour créer le questionnaire des services à auditer sur cette norme. Les grilles portant un autre référentiel restent dans leur service.`
      : 'Aucune grille — créez-en une ou importez les 4 grilles du classeur (contrôle final, soudure, emballage, informatique).'}</div>` : grl.map(g => {
      const gq = (qByGrille[String(g.id)] || []).sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
      return `<div style="background:white;border:1px solid #eef2f7;border-radius:12px;margin-bottom:12px;overflow:hidden;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 15px;background:#f8fafc;border-bottom:1px solid #eef2f7;">
          <div><span style="font-weight:800;color:#0e7490;">${escX(g.titre)}</span> <span style="font-size:.66rem;color:#94a3b8;">${escX(g.cible || '')}${g.referentiel ? ' · ' + escX(g.referentiel) : ''} · ${gq.length} question(s)</span>${_norme ? ' ' + badge('#ecfeff', '#0e7490', `${gq.filter((q: any) => _codesDomaine.has(String(q.theme_code || ''))).length} question(s) ${_norme}`) : ''}${g.active === false ? ' ' + badge('#fee2e2', '#b91c1c', 'inactive') : ''}</div>
          <div style="display:flex;gap:6px;">
            <a href="/api/audit/grille/${escX(g.id)}/vierge.pdf" target="_blank" title="Grille vierge imprimable (PDF)" style="text-decoration:none;background:#faf5ff;color:#7c3aed;border-radius:6px;padding:5px 10px;font-size:.72rem;"><i class="fas fa-print"></i> vierge</a>
            <button onclick="auditAddQuestion('${escX(g.id)}')" style="border:none;background:#ecfeff;color:#0e7490;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:.72rem;"><i class="fas fa-plus"></i> question</button>
            <button onclick="auditDelGrille('${escX(g.id)}')" style="border:none;background:#fee2e2;color:#b91c1c;border-radius:6px;padding:5px 9px;cursor:pointer;font-size:.72rem;"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        ${gq.length === 0 ? `<div style="padding:12px 15px;color:#9ca3af;font-size:.76rem;">Aucune question.</div>` : `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#fff;">${TH('#')}${TH('Question')}${TH('Clause')}${THC('Thème')}${THC('Mode')}${TH('Sonde ERP')}${THC('')}</tr></thead>
          <tbody>${gq.map((q, i) => `<tr style="border-bottom:1px solid #f8fafc;">
            ${TDC(`<span style="color:#94a3b8;font-size:.72rem;">${q.ordre || i + 1}</span>`)}
            ${TD(`<div style="font-size:.76rem;">${escX(q.libelle)}</div>${q.preuve_attendue ? `<div style="font-size:.64rem;color:#94a3b8;">preuve : ${escX(q.preuve_attendue)}</div>` : ''}`)}
            ${TD(`<span style="font-size:.68rem;color:#6b7280;">${escX(q.clause_ref || '—')}</span>`)}
            ${TDC(`<span style="font-size:.66rem;font-weight:700;color:#475569;">${escX(q.theme_code || '—')}</span>`)}
            ${TDC(modeBadge(q.mode))}
            ${TD(`<span style="font-size:.66rem;color:#0e7490;">${escX(q.sonde || (q.mode === 'manuel' ? '—' : ''))}</span>`)}
            ${TDC(`<button onclick="auditEditQuestion('${escX(q.id)}')" title="Modifier la question" style="border:none;background:none;color:#2563eb;cursor:pointer;margin-right:5px;"><i class="fas fa-pen"></i></button><button onclick="auditDelQuestion('${escX(q.id)}')" title="Supprimer" style="border:none;background:none;color:#dc2626;cursor:pointer;"><i class="fas fa-times"></i></button>`)}
          </tr>`).join('')}</tbody></table></div>`}
      </div>`
    }).join('')}`)

  // ── CONSTATS & PLANS D'ACTION ──
  const subConstats = wrap('constats', 5, `
    <div style="font-weight:800;color:#111827;font-size:.86rem;margin-bottom:6px;">Constats d'audit & plans d'action</div>
    <div style="font-size:.74rem;color:#94a3b8;margin-bottom:14px;">Chaque écart devient une non-conformité (détecteur « Audit ») suivant le cycle 8D → clôture.</div>
    ${constats.length === 0 ? `<div style="color:#9ca3af;font-size:.82rem;padding:20px;background:white;border-radius:12px;">Aucun constat enregistré.</div>` : `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;"><div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#fafafa;">${TH('Audit / entité')}${THC('Type')}${TH('Constat')}${TH('Preuve')}${THC('Action')}</tr></thead>
        <tbody>${constats.map((c, i) => `<tr style="border-bottom:1px solid #f8fafc;">
          ${TD(`<span style="font-weight:600;color:#0e7490;">${escX(c.prog.entite_auditee || '—')}</span>`)}
          ${TDC(c.etat === 'NC' ? badge('#fee2e2', '#b91c1c', 'NC') : badge('#fef3c7', '#92400e', 'Axe'))}
          ${TD(`<span style="font-size:.76rem;">${escX(c.libelle || '—')}</span>`)}
          ${TD(`<span style="font-size:.7rem;color:#94a3b8;">${escX(c.preuve || '—')}</span>`)}
          ${TDC(c.nc_id ? badge('#dcfce7', '#15803d', 'NC ' + escX(c.nc_id)) : `<button onclick="auditToNC('${escX(c.prog.id)}',${c.idx})" style="border:none;background:#ecfeff;color:#0e7490;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:.7rem;font-weight:700;"><i class="fas fa-arrow-right"></i> Convertir en NC</button>`)}
        </tr>`).join('')}</tbody></table></div></div>`}`)

  // ── 7) RÉFÉRENTIELS ──
  const themeRow = (t: [string, string, string, string]) => `<tr style="border-bottom:1px solid #f8fafc;">
    ${TDC(`<span style="font-family:monospace;font-weight:800;color:#0e7490;">${t[0]}</span>`)}${TD(`<span style="font-weight:600;">${escX(t[1])}</span>`)}${TD(`<span style="font-size:.68rem;color:#6b7280;">${escX(t[2])}</span>`)}${TD(`<span style="font-size:.72rem;color:#374151;">${escX(t[3])}</span>`)}
  </tr>`
  // Qualité = hub du SMI (les 5 normes). Sécurité et Environnement ne montrent QUE la
  // leur : afficher EN 9100 ou ISO 27001 dans un service SST n'a pas de sens, et ouvrir
  // par défaut sur l'ISO 9001 y enterrait la norme réellement à suivre.
  const normes = _norme ? [_norme] : ['ISO 9001', 'EN 9100', 'ISO 45001', 'ISO 14001', 'ISO 27001']
  const normeIcon = (n: string) => n.includes('EN') ? 'fa-plane' : n.includes('27001') ? 'fa-lock' : n.includes('14001') ? 'fa-leaf' : n.includes('45001') ? 'fa-helmet-safety' : 'fa-certificate'
  const subRef = wrap('ref', 7, `
    ${_norme ? `<div style="background:#ecfeff;border:1px solid #cffafe;border-radius:10px;padding:9px 14px;margin-bottom:16px;font-size:.75rem;color:#155e75;"><i class="fas fa-circle-info" style="margin-right:6px;"></i>Ce service ne montre que les critères <strong>${_norme}</strong>. Le référentiel complet du SMI (ISO 9001, EN 9100, ISO 45001, ISO 14001, ISO 27001) est dans <strong>Qualité › Audit Conformité › Référentiels</strong>.</div>` : ''}
    <div style="font-weight:800;color:#111827;font-size:.86rem;margin-bottom:10px;">Thèmes d'audit PROCESSUS${_norme ? ` — ${_norme}` : ' (A–K) — référentiel combiné SMI QSE + SI'}</div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;margin-bottom:22px;"><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;">${THC('Code')}${TH('Thème')}${TH('Chapitres / clauses')}${TH('Périmètre & exigences clés')}</tr></thead><tbody>${themesProc.map(themeRow).join('')}</tbody></table></div></div>
    ${themesTerrain.length ? `<div style="font-weight:800;color:#111827;font-size:.86rem;margin-bottom:10px;">Thèmes d'audit de POSTE / terrain${_norme ? ` — ${_norme}` : ' (T1–T9)'}</div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;margin-bottom:22px;"><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;">${THC('Code')}${TH('Thème terrain')}${TH('Correspondance')}${TH('Éléments vérifiés au poste')}</tr></thead><tbody>${themesTerrain.map(themeRow).join('')}</tbody></table></div></div>` : ''}
    <div style="font-weight:800;color:#111827;font-size:.86rem;margin-bottom:10px;">Grille de conformité clause-par-clause${_norme ? ` — ${_norme}` : 's (auto-évaluation)'}</div>
    <div style="display:flex;gap:4px;margin-bottom:16px;background:#f1f5f9;border-radius:10px;padding:4px;width:fit-content;flex-wrap:wrap;">
      ${normes.map((n, i) => `<button onclick="qualSwitchNorme('${n.replace(/\s/g, '_')}')" id="norme-btn-${n.replace(/\s/g, '_')}" class="norme-tab${i === 0 ? ' norme-active' : ''}"><i class="fas ${normeIcon(n)}"></i>${n}</button>`).join('')}
    </div>
    ${normes.map((n, i) => `<div id="norme-panel-${n.replace(/\s/g, '_')}" style="display:${i === 0 ? 'block' : 'none'};">${normeGrid(n)}</div>`).join('')}
    ${isoGridScript()}`)

  // Le wrapper `qual-panel-audit` (masqué, piloté par qualShowTab) n'appartient qu'à la page
  // Qualité. Les modules Sécurité / Environnement insèrent ce panneau DANS leur propre onglet :
  // sans `nu:true`, ils héritaient d'un conteneur display:none qu'aucune fonction de leur page
  // ne sait ouvrir → planning et bouton « Nouvelle ligne » présents dans le DOM mais invisibles.
  const _ouvre = opts.nu ? '<div>' : '<div id="qual-panel-audit" style="display:none;">'
  return `
  ${_ouvre}
    ${panelHdr(opts.titre || 'Audits de Conformité — SMI QSE + SI', 'fa-shield-alt', '#0891b2')}
    <div style="display:flex;gap:4px;margin-bottom:20px;background:#f1f5f9;border-radius:10px;padding:4px;flex-wrap:wrap;">
      ${SUBS.map((s, i) => subBtn(s, i)).join('')}
    </div>
    ${subProgramme}${subGrilles}${subConstats}${subRef}${_extras.map(e => `<div id="audit-sub-${e.id}" style="display:none;">${e.html}</div>`).join('')}
    <div id="audit-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1100;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;padding:26px;max-width:860px;width:94%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);"><div id="audit-modal-content"></div></div>
    </div>
    <script>
      var AUDIT_PROG=${sjX(prog)};
      var AUDIT_GRILLES=${sjX(grl)};
      var AUDIT_Q=${sjX(qs)};
      var AUDIT_AUTO=${sjX(auto || {})};
      var AUDIT_CUR_EX=${sjX(String(curEx || ''))};
      var AUDIT_REFS=${sjX(AUDIT_REFERENTIELS)};
      var AUDIT_TP=${sjX(AUDIT_THEMES_PROCESS)};
      var AUDIT_TT=${sjX(AUDIT_THEMES_TERRAIN)};
    </script>
    ${auditModuleScript()}
  </div>`
}

export function auditModuleScript(): string {
  return `<script>
  (function(){
    function aEsc(s){ s=(s==null?'':String(s)); return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function today(){ return new Date().toISOString().slice(0,10); }
    var LBL='display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;margin-top:10px;';
    var INP='width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;';
    function aInp(id,label,ph,type){ return '<label style="'+LBL+'">'+aEsc(label)+'</label><input id="'+id+'" type="'+(type||'text')+'" placeholder="'+aEsc(ph||'')+'" style="'+INP+'"/>'; }
    function aTxt(id,label,ph){ return '<label style="'+LBL+'">'+aEsc(label)+'</label><textarea id="'+id+'" placeholder="'+aEsc(ph||'')+'" style="'+INP+'min-height:60px;"></textarea>'; }
    function aSel(id,label,opts){ var o=opts.map(function(x){return '<option value="'+aEsc(x[0])+'">'+aEsc(x[1])+'</option>';}).join(''); return '<label style="'+LBL+'">'+aEsc(label)+'</label><select id="'+id+'" style="'+INP+'">'+o+'</select>'; }
    function aHead(t){ return '<div style="font-weight:800;font-size:1.02rem;color:#111827;margin-bottom:6px;"><i class="fas fa-shield-alt" style="color:#0891b2;margin-right:7px;"></i>'+aEsc(t)+'</div>'; }
    function aBtns(saveFn,saveLbl){ return '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;"><button onclick="auditCloseModal()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button><button onclick="'+saveFn+'" style="padding:9px 20px;background:linear-gradient(135deg,#0891b2,#0e7490);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">'+aEsc(saveLbl)+'</button></div>'; }
    function val(id){ var e=document.getElementById(id); return e?e.value.trim():''; }
    function findProg(id){ for(var i=0;i<AUDIT_PROG.length;i++){ if(String(AUDIT_PROG[i].id)===String(id)) return AUDIT_PROG[i]; } return null; }
    function setv(i,v){ var e=document.getElementById(i); if(e) e.value=(v==null?'':v); }
    // ── Calendrier annuel interactif : case rouge = voir l'audit ; case bleue = affecter un audit non programmé ──
    var AU_STLBL={planifie:'Planifié',realise:'Réalisé',cloture:'Clôturé',rapport_envoye:'Rapport envoyé',retour_recu:'Retour reçu',en_cours:'En cours'};
    function auditDayClick(date){
      var onDay=(AUDIT_PROG||[]).filter(function(p){return String(p.date_cible||'').slice(0,10)===date;});
      var ex=document.getElementById('auditDayModal'); if(ex) ex.remove();
      function arow(p,tag){ return '<div data-audset="'+aEsc(p.id)+'" data-date="'+aEsc(date)+'" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border:1px solid #f1f5f9;border-radius:9px;margin-bottom:6px;cursor:pointer;"><div style="font-weight:700;color:#1e293b;font-size:.82rem;">'+aEsc(p.entite_auditee||p.id)+'</div>'+tag+'</div>'; }
      var html='';
      if(onDay.length){
        html+='<div style="font-weight:800;font-size:1rem;color:#111827;margin-bottom:14px;"><i class="fas fa-calendar-check" style="color:#dc2626;margin-right:8px;"></i>Audit(s) programmé(s) le '+aEsc(date)+'</div>';
        html+=onDay.map(function(p){return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;border:1px solid #f1f5f9;border-radius:9px;margin-bottom:8px;"><div><div style="font-weight:700;color:#1e293b;font-size:.84rem;">'+aEsc(p.entite_auditee||p.id)+'</div><div style="font-size:.66rem;color:#94a3b8;">'+aEsc(p.id)+' · '+aEsc(AU_STLBL[p.statut]||p.statut||'')+'</div></div><button data-audunset="'+aEsc(p.id)+'" style="padding:4px 10px;border:none;background:#fef2f2;color:#dc2626;border-radius:6px;font-size:.68rem;font-weight:700;cursor:pointer;">Déprogrammer</button></div>';}).join('');
      } else {
        var libres=(AUDIT_PROG||[]).filter(function(p){return !p.date_cible;});
        var autres=(AUDIT_PROG||[]).filter(function(p){return p.date_cible;});
        html+='<div style="font-weight:800;font-size:1rem;color:#111827;margin-bottom:4px;"><i class="fas fa-calendar-plus" style="color:#3b82f6;margin-right:8px;"></i>Programmer un audit le '+aEsc(date)+'</div>';
        html+='<div style="font-size:.72rem;color:#64748b;margin-bottom:12px;">Choisis un audit à affecter à cette date.</div>';
        if(libres.length){ html+='<div style="font-size:.64rem;font-weight:800;color:#3b82f6;text-transform:uppercase;margin:4px 0;">Non programmés ('+libres.length+')</div>'+libres.map(function(p){return arow(p,'<span style="font-size:.62rem;color:#94a3b8;">à programmer</span>');}).join(''); }
        else { html+='<div style="font-size:.72rem;color:#94a3b8;margin-bottom:6px;">Tous les audits ont déjà une date — clique pour en <strong>déplacer</strong> un ici.</div>'; }
        html+='<div style="font-size:.64rem;font-weight:800;color:#94a3b8;text-transform:uppercase;margin:10px 0 4px;">Déjà datés (déplacer)</div>'+autres.map(function(p){return arow(p,'<span style="font-size:.62rem;color:#cbd5e1;">'+aEsc(String(p.date_cible).slice(0,10))+'</span>');}).join('');
      }
      var m=document.createElement('div'); m.id='auditDayModal';
      m.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1200;display:flex;align-items:center;justify-content:center;padding:20px;';
      m.innerHTML='<div style="background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:24px;max-width:560px;width:100%;max-height:82vh;overflow:auto;">'+html+'<div style="text-align:right;margin-top:14px;"><button data-audclose="1" style="padding:8px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Fermer</button></div></div>';
      m.addEventListener('click',function(e){ if(e.target===m) m.remove(); });
      document.body.appendChild(m);
    }
    function auditSetDate(id,date){ fetch('/api/audit/programme/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({date_cible:date})}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-calendar-check','Audit programmé le '+date+'.',3000); setTimeout(function(){softReload();},700); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); }); }
    function auditUnsetDate(id){ fetch('/api/audit/programme/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({date_cible:''})}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-calendar-minus','Audit déprogrammé.',3000); setTimeout(function(){softReload();},700); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); }); }
    document.addEventListener('click',function(e){ if(!e.target||!e.target.closest) return; var cell=e.target.closest('[data-audday]'); if(cell){ auditDayClick(cell.getAttribute('data-audday')); return; } var s=e.target.closest('[data-audset]'); if(s){ auditSetDate(s.getAttribute('data-audset'),s.getAttribute('data-date')); return; } var u=e.target.closest('[data-audunset]'); if(u){ auditUnsetDate(u.getAttribute('data-audunset')); return; } if(e.target.getAttribute&&e.target.getAttribute('data-audclose')){ var md=document.getElementById('auditDayModal'); if(md) md.remove(); } });
    var AU_SONDES=[['','— aucune (manuel) —'],['ecme','ECME étalonnage'],['certifications','Habilitations/certifications'],['duer','DUER année'],['fds','FDS chimie'],['perissables','Périssables'],['vgp','VGP'],['releves_bains','Suivi de bain (Surtec/OAS)'],['nc_ouvertes','NC ouvertes'],['actions_retard','Actions en retard'],['fai','FAI/EN 9102'],['scorecard_st','Sous-traitants approuvés'],['dechets_dangereux_traces','Env — Déchets dangereux tracés (BSDD)'],['rejets_hors_vle','Env — Rejets dans les VLE'],['atex_revue','Env — Zones ATEX à jour'],['aes_non_maitrise','Env — AES maîtrisés']];

    window.auditSub=function(id){
      // Liste DYNAMIQUE : les modules Securite/Environnement ajoutent leurs propres onglets
      // (veille, parties, iso14001...) via opts.extras — une liste figee les laissait masques.
      var _ids=[].slice.call(document.querySelectorAll('[id^="audit-subbtn-"]')).map(function(x){ return x.id.replace('audit-subbtn-',''); });
      if(!_ids.length) _ids=['programme','grilles','constats','ref'];
      _ids.forEach(function(t){
        var p=document.getElementById('audit-sub-'+t); var b=document.getElementById('audit-subbtn-'+t);
        if(p) p.style.display=(t===id)?'block':'none';
        if(b){ if(t===id){ b.style.background='#0891b2'; b.style.color='#fff'; var sp=b.querySelector('span'); if(sp) sp.style.background='rgba(255,255,255,.25)'; } else { b.style.background='transparent'; b.style.color='#64748b'; var s2=b.querySelector('span'); if(s2) s2.style.background='#e2e8f0'; } }
      });
      if(typeof isoApply==='function'){ try{ isoApply(); }catch(e){} }
    };
    // ── Exercice (année) : filtre le programme + les audits process/poste ──
    window.auditYear=function(y){
      y=String(y); window.AUDIT_CUR_EX=y;
      document.querySelectorAll('.au-exblock').forEach(function(b){ b.style.display=(b.getAttribute('data-exblock')===y)?'block':'none'; });
      document.querySelectorAll('[id^="au-yearbtn-"]').forEach(function(b){ var on=(b.id==='au-yearbtn-'+y); b.style.background=on?'#0891b2':'#fff'; b.style.color=on?'#fff':'#0e7490'; });
    };
    window.auditReconduire=function(){
      var from=Number(window.AUDIT_CUR_EX); if(!from){ if(typeof pushNotif==='function') pushNotif('error','fa-triangle-exclamation','Aucun exercice à reconduire',4000); return; }
      var to=from+1;
      var go=function(){ auditSend('/api/audit/programme/reconduire','POST',{from:from,to:to},'Programme reconduit pour '+to+'.'); };
      if(typeof appConfirm==='function') appConfirm('Reconduire tout le programme '+from+' vers '+to+' ? Les dates sont décalées d\\'un an et les statuts remis à « planifié ».',go); else if(confirm('Reconduire vers '+to+' ?')) go();
    };
    if(window.AUDIT_CUR_EX){ try{ window.auditYear(window.AUDIT_CUR_EX); }catch(e){} }
    function auditModal(html){ var o=document.getElementById('audit-modal-overlay'); var b=document.getElementById('audit-modal-content'); if(!o||!b) return; b.innerHTML=html; o.style.display='flex'; }
    window.auditCloseModal=function(){ var o=document.getElementById('audit-modal-overlay'); if(o) o.style.display='none'; };

    function auditSend(url,method,body,okMsg){
      fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined})
        .then(function(r){ return r.json().catch(function(){return {};}).then(function(j){ return {ok:r.ok,j:j}; }); })
        .then(function(res){ if(res.ok){ if(typeof pushNotif==='function') pushNotif('ok','fa-check',okMsg||'Enregistré.',3500); auditCloseModal(); if(typeof softReload==='function') softReload(); else location.reload(); } else { if(typeof pushNotif==='function') pushNotif('error','fa-triangle-exclamation',(res.j&&res.j.error)||'Erreur serveur',5000); } })
        .catch(function(){ if(typeof pushNotif==='function') pushNotif('error','fa-triangle-exclamation','Erreur reseau',5000); });
    }

    // ── Nouvelle ligne de programme ──
    window.auditNewLigne=function(){
      var refs=AUDIT_REFS.map(function(r){ return '<label style="display:inline-flex;align-items:center;gap:4px;margin-right:10px;font-size:.75rem;"><input type="checkbox" class="au-ref" value="'+aEsc(r[0])+'"/> '+aEsc(r[1])+'</label>'; }).join('');
      var grilleOpts=[['','— aucune —']].concat(AUDIT_GRILLES.map(function(g){ return [g.id,g.titre]; }));
      var html=aHead('Nouvelle ligne de programme d\\'audit')
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        +'<div>'+aSel('au_type','Type',[['process','Processus'],['poste','Poste'],['flash','Flash'],['procede','Procédé spécial'],['client','Exigence client']])+'</div>'
        +'<div>'+aSel('au_famille','Famille (process)',[['','—'],['PILOTAGE','Pilotage'],['REALISATION','Réalisation'],['SUPPORT','Support']])+'</div>'
        +'</div>'
        +aInp('au_entite','Entité auditée (processus / poste / procédé)','ex: Soudure, OAS, Surtec 650, CND')
        +aInp('au_themes','Thèmes (codes séparés par virgule)','ex: G,I,J ou T1,T2,T5')
        +'<label style="'+LBL+'">Référentiels couverts</label><div style="padding:4px 0;">'+refs+'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        +'<div>'+aInp('au_datecible','Date cible','','date')+'</div>'
        +'<div>'+aInp('au_temps','Temps estimé (min)','30','number')+'</div>'
        +'<div>'+aInp('au_auditeur','Auditeur','')+'</div>'
        +'<div>'+aInp('au_audite','Audité principal','')+'</div>'
        +'</div>'
        +aSel('au_grille','Grille associée',grilleOpts)
        +aBtns('auditSaveLigne()','Ajouter au programme');
      auditModal(html);
    };
    window.auditSaveLigne=function(){
      var refs=[]; document.querySelectorAll('.au-ref:checked').forEach(function(c){ refs.push(c.value); });
      var entite=val('au_entite'); if(!entite){ if(typeof pushNotif==='function') pushNotif('error','fa-triangle-exclamation','Entité auditée obligatoire',4000); return; }
      var body={ type:val('au_type'), entite_auditee:entite, famille:val('au_famille')||null, themes:val('au_themes'), referentiels:refs.join(','), date_cible:val('au_datecible')||null, temps_estime_min:val('au_temps')?Number(val('au_temps')):null, auditeur:val('au_auditeur'), audite_principal:val('au_audite'), grille_id:val('au_grille')||null, statut:val('au_datecible')?'planifie':'a_planifier' };
      auditSend('/api/audit/programme','POST',body,'Ligne ajoutée au programme.');
    };

    // ── Modifier une ligne (dates, auditeur, statut…) ──
    var AU_STATUTS=[['a_planifier','À planifier'],['planifie','Planifié'],['realise','Réalisé'],['rapport_envoye','Rapport envoyé'],['retour_recu','Retour reçu'],['cloture','Clôturé']];
    window.auditEditLigne=function(id){
      var p=findProg(id); if(!p){ return; }
      var refs=AUDIT_REFS.map(function(r){ var on=(String(p.referentiels||'').split(',').indexOf(r[0])>=0); return '<label style="display:inline-flex;align-items:center;gap:4px;margin-right:10px;font-size:.75rem;"><input type="checkbox" class="au-eref" value="'+aEsc(r[0])+'"'+(on?' checked':'')+'/> '+aEsc(r[1])+'</label>'; }).join('');
      var grilleOpts=[['','— aucune —']].concat(AUDIT_GRILLES.map(function(g){ return [g.id,g.titre]; }));
      var html=aHead('Modifier — '+(p.entite_auditee||''))
        +aInp('ae_entite','Entité auditée','')
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        +'<div>'+aInp('ae_datecible','Date d\\'audit (cible)','','date')+'</div>'
        +'<div>'+aSel('ae_statut','Statut',AU_STATUTS)+'</div>'
        +'<div>'+aInp('ae_auditeur','Auditeur','')+'</div>'
        +'<div>'+aInp('ae_audite','Audité principal','')+'</div>'
        +'</div>'
        +aInp('ae_themes','Thèmes (codes séparés par virgule)','')
        +'<label style="'+LBL+'">Référentiels couverts</label><div style="padding:4px 0;">'+refs+'</div>'
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        +'<div>'+aInp('ae_temps','Temps estimé (min)','','number')+'</div>'
        +'<div>'+aSel('ae_grille','Grille associée',grilleOpts)+'</div>'
        +'</div>'
        +aBtns('auditSaveEdit(\\''+id+'\\')','Enregistrer');
      auditModal(html);
      function setv(i,v){ var e=document.getElementById(i); if(e) e.value=(v==null?'':v); }
      setv('ae_entite',p.entite_auditee); setv('ae_datecible',String(p.date_cible||'').slice(0,10)); setv('ae_statut',p.statut||'planifie');
      setv('ae_auditeur',p.auditeur); setv('ae_audite',p.audite_principal); setv('ae_themes',p.themes); setv('ae_temps',p.temps_estime_min); setv('ae_grille',p.grille_id);
    };
    window.auditSaveEdit=function(id){
      var refs=[]; document.querySelectorAll('.au-eref:checked').forEach(function(c){ refs.push(c.value); });
      var body={ entite_auditee:val('ae_entite'), date_cible:val('ae_datecible')||null, statut:val('ae_statut'), auditeur:val('ae_auditeur'), audite_principal:val('ae_audite'), themes:val('ae_themes'), referentiels:refs.join(','), temps_estime_min:val('ae_temps')?Number(val('ae_temps')):null, grille_id:val('ae_grille')||null };
      auditSend('/api/audit/programme/'+encodeURIComponent(id),'PATCH',body,'Ligne modifiée.');
    };

    // ── Réaliser / remplir la grille ──
    window.auditFill=function(id){
      var p=findProg(id); if(!p){ return; }
      var qs=AUDIT_Q.filter(function(q){ return String(q.grille_id)===String(p.grille_id); }).sort(function(a,b){ return (a.ordre||0)-(b.ordre||0); });
      var head=aHead('Réaliser l\\'audit — '+(p.entite_auditee||''));
      var body='';
      if(!p.grille_id||!qs.length){ body='<div style="color:#6b7280;font-size:.8rem;margin:8px 0;">Aucune grille associée. Vous pouvez tout de même consigner un constat global ci-dessous.</div>'; }
      else {
        body=qs.map(function(q,i){
          var pre=''; if(q.mode==='auto'&&q.sonde&&AUDIT_AUTO[q.sonde]){ var st=AUDIT_AUTO[q.sonde].statut; pre=(st==='conforme'?'C':(st==='nc'?'NC':'')); }
          var opt=function(v,lbl,col){ return '<label style="display:inline-flex;align-items:center;gap:3px;margin-right:8px;font-size:.72rem;color:'+col+';"><input type="radio" name="q_'+i+'" value="'+v+'"'+(pre===v?' checked':'')+'/> '+lbl+'</label>'; };
          var badgeAuto=(q.mode==='auto'?' <span style="font-size:.6rem;font-weight:800;color:#15803d;">AUTO'+(AUDIT_AUTO[q.sonde]?' · '+aEsc(AUDIT_AUTO[q.sonde].preuve):'')+'</span>':'');
          return '<div data-qid="'+aEsc(q.id)+'" data-qlbl="'+aEsc(q.libelle)+'" data-qsonde="'+aEsc(q.sonde||'')+'" style="border-bottom:1px solid #f1f5f9;padding:9px 0;">'
            +'<div style="font-size:.76rem;font-weight:600;color:#374151;margin-bottom:4px;">'+(i+1)+'. '+aEsc(q.libelle)+badgeAuto+'</div>'
            +opt('C','Conforme','#15803d')+opt('NC','Non conforme','#b91c1c')+opt('AXE','Axe d\\'amélioration','#92400e')
            +'<input class="q_pv" placeholder="Preuve / constat" style="'+INP+'margin-top:5px;font-size:.74rem;"/></div>';
        }).join('');
      }
      var foot=aTxt('au_constat','Constat / observations générales','')
        +'<div style="display:flex;justify-content:space-between;gap:8px;margin-top:18px;flex-wrap:wrap;">'
        +'<button onclick="auditCloseModal()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap;">'
        +'<button onclick="auditSaveFill(\\''+id+'\\',false)" title="Enregistrer sans clôturer (l\\'audit reste modifiable)" style="padding:9px 18px;background:#e0f2fe;color:#0369a1;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-floppy-disk" style="margin-right:5px;"></i>Enregistrer (réalisé)</button>'
        +'<button onclick="auditSaveFill(\\''+id+'\\',true)" title="Solder et clôturer — le rapport PDF devient téléchargeable" style="padding:9px 18px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-lock" style="margin-right:5px;"></i>Solder l\\'audit</button>'
        +'</div></div>';
      auditModal(head+'<div style="font-size:.72rem;color:#94a3b8;margin-bottom:6px;">Renseignez chaque question (Conforme / Non conforme / Axe) + la preuve/constat, puis <strong>Enregistrer</strong> (modifiable) ou <strong>Solder l\\'audit</strong> (clôture → rapport PDF).</div><div style="max-height:58vh;overflow-y:auto;margin:8px 0;padding-right:4px;">'+body+'</div>'+foot);
    };
    window.auditSaveFill=function(id, solder){
      var reps=[]; document.querySelectorAll('#audit-modal-content [data-qid]').forEach(function(d){
        var sel=d.querySelector('input[type=radio]:checked'); var pv=d.querySelector('.q_pv');
        if(sel){ reps.push({ question_id:d.getAttribute('data-qid'), libelle:d.getAttribute('data-qlbl'), sonde:d.getAttribute('data-qsonde'), etat:sel.value, preuve:pv?pv.value:'' }); }
      });
      var body={ statut: solder?'cloture':'realise', date_realisation:today(), reponses:reps, observations:val('au_constat') };
      if(solder){ body.plan_action_solde=true; body.date_cloture=today(); }
      auditSend('/api/audit/programme/'+encodeURIComponent(id),'PATCH',body, solder?'Audit soldé et clôturé — rapport téléchargeable.':'Audit réalisé enregistré.');
    };
    window.auditDelLigne=function(id){
      var go=function(){ auditSend('/api/audit/programme/'+encodeURIComponent(id),'DELETE',null,'Ligne supprimée.'); };
      if(typeof appConfirm==='function') appConfirm('Supprimer cette ligne du programme ?',go); else if(confirm('Supprimer ?')) go();
    };
    window.auditToNC=function(progId,idx){
      auditSend('/api/audit/constat-to-nc','POST',{ prog_id:progId, idx:idx },'Non-conformité créée (détecteur Audit).');
    };

    // ── Grilles ──
    window.auditNewGrille=function(){
      var html=aHead('Nouvelle grille d\\'audit')
        +aInp('ag_titre','Titre','ex: Grille contrôle final')
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        +'<div>'+aSel('ag_cible','Cible',[['poste','Poste'],['process','Processus'],['procede','Procédé spécial']])+'</div>'
        +'<div>'+aInp('ag_ref','Référentiel','ex: combine, 45001, 27001')+'</div>'
        +'</div>'
        +aBtns('auditSaveGrille()','Créer la grille');
      auditModal(html);
    };
    window.auditSaveGrille=function(){
      var t=val('ag_titre'); if(!t){ if(typeof pushNotif==='function') pushNotif('error','fa-triangle-exclamation','Titre obligatoire',4000); return; }
      auditSend('/api/audit/grille','POST',{ titre:t, cible:val('ag_cible'), referentiel:val('ag_ref') },'Grille créée.');
    };
    window.auditDelGrille=function(id){
      var go=function(){ auditSend('/api/audit/grille/'+encodeURIComponent(id),'DELETE',null,'Grille supprimée.'); };
      if(typeof appConfirm==='function') appConfirm('Supprimer cette grille et ses questions ?',go); else if(confirm('Supprimer ?')) go();
    };
    window.auditAddQuestion=function(gid){
      var sondes=AU_SONDES;
      var html=aHead('Nouvelle question')
        +aTxt('aq_lib','Question','')
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        +'<div>'+aInp('aq_clause','Clause','ex: EN 9100 §8.5.2')+'</div>'
        +'<div>'+aInp('aq_theme','Thème','ex: T2')+'</div>'
        +'</div>'
        +aInp('aq_preuve','Preuve attendue','')
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        +'<div>'+aSel('aq_mode','Mode',[['manuel','Manuel'],['assiste','Assisté'],['auto','Auto']])+'</div>'
        +'<div>'+aSel('aq_sonde','Sonde ERP (auto)',sondes)+'</div>'
        +'</div>'
        +'<input type="hidden" id="aq_gid" value="'+aEsc(gid)+'"/>'
        +aBtns('auditSaveQuestion()','Ajouter la question');
      auditModal(html);
    };
    window.auditSaveQuestion=function(){
      var lib=val('aq_lib'); if(!lib){ if(typeof pushNotif==='function') pushNotif('error','fa-triangle-exclamation','Question obligatoire',4000); return; }
      var sonde=val('aq_sonde'); var mode=val('aq_mode'); if(sonde&&mode==='manuel') mode='auto';
      auditSend('/api/audit/question','POST',{ grille_id:val('aq_gid'), libelle:lib, clause_ref:val('aq_clause'), theme_code:val('aq_theme'), preuve_attendue:val('aq_preuve'), mode:mode, sonde:sonde },'Question ajoutée.');
    };
    window.auditDelQuestion=function(id){
      var go=function(){ auditSend('/api/audit/question/'+encodeURIComponent(id),'DELETE',null,'Question supprimée.'); };
      if(typeof appConfirm==='function') appConfirm('Supprimer cette question ?',go); else if(confirm('Supprimer ?')) go();
    };
    window.auditEditQuestion=function(id){
      var q=null; for(var i=0;i<AUDIT_Q.length;i++){ if(String(AUDIT_Q[i].id)===String(id)){ q=AUDIT_Q[i]; break; } }
      if(!q){ return; }
      var html=aHead('Modifier la question')
        +aTxt('eq_lib','Question','')
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        +'<div>'+aInp('eq_clause','Clause','ex: EN 9100 §8.5.2')+'</div>'
        +'<div>'+aInp('eq_theme','Thème','ex: T2')+'</div>'
        +'</div>'
        +aInp('eq_preuve','Preuve attendue','')
        +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
        +'<div>'+aSel('eq_mode','Mode',[['manuel','Manuel'],['assiste','Assisté'],['auto','Auto']])+'</div>'
        +'<div>'+aSel('eq_sonde','Sonde ERP (auto)',AU_SONDES)+'</div>'
        +'</div>'
        +'<input type="hidden" id="eq_id" value="'+aEsc(id)+'"/>'
        +aBtns('auditSaveEditQuestion()','Enregistrer');
      auditModal(html);
      setv('eq_lib',q.libelle); setv('eq_clause',q.clause_ref); setv('eq_theme',q.theme_code); setv('eq_preuve',q.preuve_attendue); setv('eq_mode',q.mode||'manuel'); setv('eq_sonde',q.sonde);
    };
    window.auditSaveEditQuestion=function(){
      var id=val('eq_id'); var lib=val('eq_lib'); if(!lib){ if(typeof pushNotif==='function') pushNotif('error','fa-triangle-exclamation','Question obligatoire',4000); return; }
      var sonde=val('eq_sonde'); var mode=val('eq_mode'); if(sonde&&mode==='manuel') mode='auto';
      auditSend('/api/audit/question/'+encodeURIComponent(id),'PATCH',{ libelle:lib, clause_ref:val('eq_clause'), theme_code:val('eq_theme'), preuve_attendue:val('eq_preuve'), mode:mode, sonde:sonde },'Question modifiée.');
    };
  })();
  </script>`
}

function perStatutCalc(p: any): string {
  if (p.statut === 'archive') return 'archive'
  const today = new Date().toISOString().slice(0, 10)
  const exp = (p.date_expiration || '').slice(0, 10)
  const alerte = (p.date_alerte || '').slice(0, 10)
  if (exp && exp < today) return 'expire'
  if (alerte && alerte <= today) return 'a_renouveler'
  if (exp) { const d = (Date.parse(exp) - Date.parse(today)) / 86400000; if (d <= 30) return 'a_renouveler' }
  return 'valide'
}
function panelPerissables(prods: any[], mvts: any[] = [], fournisseurs: any[] = []) {
  const QI = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;'
  const QL = 'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'
  const sortiesPar: Record<string, number> = {}
  for (const m of mvts) { const k = String(m.perissable_id || ''); sortiesPar[k] = (sortiesPar[k] || 0) + 1 }
  const withSt = prods.map((p: any) => ({ ...p, _st: perStatutCalc(p) }))
  const expires = withSt.filter((p) => p._st === 'expire')
  const warning = withSt.filter((p) => p._st === 'a_renouveler')
  return `
  <div id="qual-panel-perissables" style="display:none;">
    ${panelHdr('Produits Périssables','fa-hourglass-half','#f59e0b', prods.length)}
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:9px 14px;margin-bottom:12px;font-size:.76rem;color:#9a3412;"><i class="fas fa-circle-info" style="margin-right:6px;"></i><strong>Gestion des produits périssables (PRA2-D1)</strong> — suivi par lot (réception, péremption, date d'alerte, lieu) avec consommation FIFO. Le statut est recalculé automatiquement.</div>
    ${expires.length > 0 ? `<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:10px;padding:10px 16px;margin-bottom:12px;font-size:.8rem;color:#b91c1c;"><i class="fas fa-exclamation-circle" style="margin-right:8px;"></i><strong>${expires.length} lot(s) expiré(s)</strong> — retrait immédiat requis.</div>` : ''}
    ${warning.length > 0 ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:10px 16px;margin-bottom:12px;font-size:.8rem;color:#92400e;"><i class="fas fa-exclamation-triangle" style="margin-right:8px;"></i><strong>${warning.length} lot(s) à renouveler / proches péremption.</strong></div>` : ''}
    <style>.pef-pill{padding:6px 14px;border-radius:8px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:.78rem;font-weight:700;cursor:pointer;}.pef-pill.active{background:linear-gradient(135deg,#d97706,#b45309);color:white;border-color:transparent;}</style>
    <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">
      <button id="pef-all" onclick="perFilter('all',this)" class="pef-pill active">Tous</button>
      <button id="pef-valide" onclick="perFilter('valide',this)" class="pef-pill">Valides</button>
      <button id="pef-a_renouveler" onclick="perFilter('a_renouveler',this)" class="pef-pill">À renouveler</button>
      <button id="pef-expire" onclick="perFilter('expire',this)" class="pef-pill">Expirés</button>
      <button id="pef-archive" onclick="perFilter('archive',this)" class="pef-pill">Archivés / épuisés</button>
      <div style="margin-left:auto;display:flex;gap:8px;">
        <input type="text" placeholder="Rechercher…" oninput="qualFilter('qual-tbl-per',this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:220px;"/>
        <button onclick="perOpen('')" style="padding:8px 18px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Nouveau lot</button>
      </div>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;min-width:980px;" id="qual-tbl-per">
          <thead><tr style="background:#fafafa;border-bottom:2px solid #f1f5f9;">
            ${TH('Produit')}${TH('Code')}${TH('Réception')}${TH('Péremption')}${TH('Alerte')}${TH('Lieu')}${THC('Inventaire')}${THC('Sorties')}${THC('Statut')}${THC('Actions')}
          </tr></thead>
          <tbody>
            ${withSt.length === 0 ? `<tr><td colspan="10" style="text-align:center;padding:32px;color:#9ca3af;">Aucun lot — cliquez sur « Nouveau lot » ou importez le fichier PRA2-D1.</td></tr>` :
            withSt.map((p: any) => `
            <tr data-statut="${p._st}" style="border-bottom:1px solid #f9fafb;${p._st==='expire'?'background:#fff5f5;':''}" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background='${p._st==='expire'?'#fff5f5':''}'">
              ${TD(`<div style="font-weight:700;color:#374151;font-size:.78rem;">${escX(p.nom)}</div><div style="font-size:.66rem;color:#9ca3af;">${escX(p.fournisseur ?? '')}${p.n_lot_fournisseur?' · lot '+escX(p.n_lot_fournisseur):''}</div>`)}
              ${TD(`<span style="font-size:.72rem;font-family:monospace;color:#6b7280;">${escX(p.code_produit ?? p.reference ?? '—')}</span>`)}
              ${TD(`<span style="font-size:.74rem;color:#6b7280;">${(p.date_reception ?? p.date_ouverture ?? '—')}</span>`)}
              ${TD(`<span style="font-size:.74rem;font-weight:700;color:${p._st==='expire'?'#b91c1c':p._st==='a_renouveler'?'#92400e':'#374151'};">${p.date_expiration ?? '—'}</span>`)}
              ${TD(`<span style="font-size:.72rem;color:${p._st==='a_renouveler'?'#92400e':'#9ca3af'};">${p.date_alerte ?? '—'}</span>`)}
              ${TD(`<span style="font-size:.72rem;color:#6b7280;">${escX(p.lieu_utilisation ?? p.emplacement ?? '—')}</span>`)}
              ${TDC(`<span style="font-weight:800;color:#374151;">${p.quantite ?? '—'}</span>${p.qte_initiale!=null?`<span style="font-size:.64rem;color:#cbd5e1;">/${p.qte_initiale}</span>`:''} ${escX(p.unite ?? '')}`)}
              ${TDC(`<span style="font-size:.72rem;color:#64748b;">${sortiesPar[String(p.id)] || 0}</span>`)}
              ${TDC(perStatutBadge(p._st))}
              ${TDC(`<div style="display:flex;gap:5px;justify-content:center;">
                <button onclick="perSortie('${escX(p.id)}','${escX(p.nom)}',${Number(p.quantite)||0})" title="Sortie (consommation)" style="padding:5px 9px;background:#fef3c7;color:#92400e;border:none;border-radius:7px;font-size:.7rem;cursor:pointer;"><i class="fas fa-arrow-right-from-bracket"></i></button>
                <button onclick="perOpen('${escX(p.id)}')" title="Modifier" style="padding:5px 9px;background:#f1f5f9;color:#475569;border:none;border-radius:7px;font-size:.7rem;cursor:pointer;"><i class="fas fa-pen"></i></button>
                <button onclick="perDelete('${escX(p.id)}')" title="Supprimer" style="padding:5px 9px;background:#fee2e2;color:#b91c1c;border:none;border-radius:7px;font-size:.7rem;cursor:pointer;"><i class="fas fa-trash"></i></button>
              </div>`)}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="perModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1100;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;width:92%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <div style="padding:18px 22px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#111827;" id="perModalTitle"><i class="fas fa-hourglass-half" style="color:#d97706;margin-right:8px;"></i>Nouveau lot périssable</div>
        <div style="padding:20px 22px;">
          <input type="hidden" id="per_id"/>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <div style="grid-column:span 2;"><label style="${QL}">Produit</label><input id="per_nom" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Code produit</label><input id="per_code" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Fournisseur</label><input id="per_four" type="text" list="per_four_list" style="${QI}"/><datalist id="per_four_list">${fournisseurs.map((f: any) => `<option value="${escX(f.nom)}"></option>`).join('')}</datalist></div>
            <div><label style="${QL}">N° lot fournisseur</label><input id="per_lot" type="text" style="${QI}"/></div>
            <div><label style="${QL}">N° commande fourn.</label><input id="per_cmd" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Date réception</label><input id="per_recep" type="date" style="${QI}"/></div>
            <div><label style="${QL}">Date péremption</label><input id="per_exp" type="date" style="${QI}"/></div>
            <div><label style="${QL}">Date d'alerte</label><input id="per_alerte" type="date" style="${QI}"/></div>
            <div><label style="${QL}">Délai appro</label><input id="per_delai" type="text" placeholder="8 semaines" style="${QI}"/></div>
            <div><label style="${QL}">Lieu d'utilisation</label><input id="per_lieu" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Qté initiale</label><input id="per_qini" type="number" style="${QI}"/></div>
            <div><label style="${QL}">Inventaire courant</label><input id="per_qte" type="number" style="${QI}"/></div>
            <div><label style="${QL}">Unité</label><input id="per_unite" type="text" placeholder="boîtier / L / kg" style="${QI}"/></div>
            <div style="grid-column:span 3;"><label style="${QL}">Observations</label><input id="per_obs" type="text" style="${QI}"/></div>
          </div>
        </div>
        <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
          <button onclick="document.getElementById('perModal').style.display='none'" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:600;cursor:pointer;">Annuler</button>
          <button onclick="perSave()" style="padding:9px 18px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;"><i class="fas fa-save" style="margin-right:5px;"></i>Enregistrer</button>
        </div>
      </div>
    </div>

    <div id="perSortieModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1100;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;width:92%;max-width:420px;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <div style="padding:18px 22px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#111827;" id="perSortieTitle"><i class="fas fa-arrow-right-from-bracket" style="color:#d97706;margin-right:8px;"></i>Sortie de stock</div>
        <div style="padding:18px 22px;">
          <input type="hidden" id="ps_id"/>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div><label style="${QL}">Quantité sortie</label><input id="ps_qte" type="number" min="1" style="${QI}"/></div>
            <div><label style="${QL}">Date</label><input id="ps_date" type="date" style="${QI}"/></div>
            <div><label style="${QL}">N° commande client</label><input id="ps_cmd" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Motif</label><input id="ps_motif" type="text" placeholder="mise en œuvre…" style="${QI}"/></div>
          </div>
        </div>
        <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
          <button onclick="document.getElementById('perSortieModal').style.display='none'" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:600;cursor:pointer;">Annuler</button>
          <button onclick="perSortieSave()" style="padding:9px 18px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i>Valider la sortie</button>
        </div>
      </div>
    </div>

    <script>
      window.PER_DATA=${sjX(prods.map((p: any) => ({ id: p.id, nom: p.nom, code_produit: p.code_produit, reference: p.reference, fournisseur: p.fournisseur, n_lot_fournisseur: p.n_lot_fournisseur, n_commande_fournisseur: p.n_commande_fournisseur, date_reception: p.date_reception, date_expiration: p.date_expiration, date_alerte: p.date_alerte, delai_appro: p.delai_appro, lieu_utilisation: p.lieu_utilisation, qte_initiale: p.qte_initiale, quantite: p.quantite, unite: p.unite, observations: p.observations })))};
      window.PER_FOURN=${sjX(fournisseurs.map((f: any) => ({ id: f.id, nom: f.nom })))};
      function perV(f){var e=document.getElementById(f);return e?e.value:'';}
      function perFilter(f,btn){ ['all','valide','a_renouveler','expire','archive'].forEach(function(x){var b=document.getElementById('pef-'+x); if(b)b.classList.toggle('active',x===f);}); document.querySelectorAll('#qual-tbl-per tbody tr[data-statut]').forEach(function(tr){ var s=tr.getAttribute('data-statut'); tr.style.display=(f==='all'||s===f)?'':'none'; }); }
      function perOpen(id){
        function set(f,v){var e=document.getElementById(f); if(e) e.value=(v==null?'':v);}
        var o = id ? (window.PER_DATA.find(function(x){return String(x.id)===String(id);})||{}) : {};
        set('per_id',o.id||''); set('per_nom',o.nom); set('per_code',o.code_produit); set('per_four',o.fournisseur); set('per_lot',o.n_lot_fournisseur); set('per_cmd',o.n_commande_fournisseur); set('per_recep',o.date_reception); set('per_exp',o.date_expiration); set('per_alerte',o.date_alerte); set('per_delai',o.delai_appro); set('per_lieu',o.lieu_utilisation); set('per_qini',o.qte_initiale); set('per_qte',o.quantite); set('per_unite',o.unite); set('per_obs',o.observations);
        document.getElementById('perModalTitle').innerHTML='<i class="fas fa-hourglass-half" style="color:#d97706;margin-right:8px;"></i>'+(id?('Lot — '+(o.nom||'')):'Nouveau lot périssable');
        document.getElementById('perModal').style.display='flex';
      }
      function perSave(){
        var nom=perV('per_nom'); if(!nom){ pushNotif('err','fa-exclamation-circle','Nom du produit requis.'); return; }
        var four=perV('per_four'); var fo=(window.PER_FOURN||[]).find(function(x){return String(x.nom)===String(four);});
        var p={ nom:nom, code_produit:perV('per_code'), reference:perV('per_code'), fournisseur:four, fournisseur_id:(fo?fo.id:null), n_lot_fournisseur:perV('per_lot'), n_commande_fournisseur:perV('per_cmd'), date_reception:perV('per_recep')||null, date_ouverture:perV('per_recep')||null, date_expiration:perV('per_exp')||null, date_alerte:perV('per_alerte')||null, delai_appro:perV('per_delai'), lieu_utilisation:perV('per_lieu'), emplacement:perV('per_lieu'), qte_initiale:perV('per_qini')||null, quantite:perV('per_qte')||null, unite:perV('per_unite'), observations:perV('per_obs') };
        var id=perV('per_id'); var url=id?'/api/qualite/perissable/'+encodeURIComponent(id):'/api/qualite/perissable';
        fetch(url,{method:id?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-save','Lot enregistré.',3000); setTimeout(function(){ softReload(); },700); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
      }
      async function perDelete(id){ if(!await appConfirm('Supprimer ce lot périssable ?')) return; fetch('/api/qualite/perissable/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-trash','Lot supprimé.',2500); setTimeout(function(){ softReload(); },600); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); }); }
      function perSortie(id,nom,reste){ document.getElementById('ps_id').value=id; document.getElementById('ps_qte').value=''; document.getElementById('ps_qte').max=reste; document.getElementById('ps_date').value=new Date().toISOString().slice(0,10); document.getElementById('ps_cmd').value=''; document.getElementById('ps_motif').value=''; document.getElementById('perSortieTitle').innerHTML='<i class="fas fa-arrow-right-from-bracket" style="color:#d97706;margin-right:8px;"></i>Sortie — '+nom+' (reste '+reste+')'; document.getElementById('perSortieModal').style.display='flex'; }
      function perSortieSave(){
        var id=perV('ps_id'); var q=parseFloat(perV('ps_qte')); if(!(q>0)){ pushNotif('err','fa-exclamation-circle','Quantité invalide.'); return; }
        fetch('/api/qualite/perissable/'+encodeURIComponent(id)+'/sortie',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({qte_sortie:q,date_sortie:perV('ps_date'),n_commande_client:perV('ps_cmd'),motif:perV('ps_motif')})}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-check','Sortie enregistrée — reste '+j.reste+'.',3500); setTimeout(function(){ softReload(); },700); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
      }
    </script>
  </div>`
}

function panelDashboard(ncs: NonConformite[], pvs: PVControle[], qs: Quarantaine[], audits: Audit[], prog: any[] = [], auto: Record<string, any> = {}) {
  const autoArr = Object.values(auto || {})
  const viveNC = autoArr.filter((s: any) => s.statut === 'nc').length
  const viveOK = autoArr.filter((s: any) => s.statut === 'conforme').length
  const auDone = (p: any) => p.statut === 'realise' || p.statut === 'cloture' || p.statut === 'rapport_envoye' || p.statut === 'retour_recu'
  const auReal = prog.filter(auDone).length
  const auTaux = prog.length ? Math.round(auReal / prog.length * 100) : 0
  const auLate = prog.filter(p => p.date_cible && String(p.date_cible).slice(0, 10) < TODAY() && !auDone(p)).length
  const auSoldes = prog.filter(p => p.plan_action_solde).length
  const ncOpen   = ncs.filter(n => n.statut !== 'cloture').length
  const ncCrit   = ncs.filter(n => n.gravite === 'Critique' || n.gravite === 'Bloquante').length
  const pvOK     = pvs.filter(p => p.statut === 'valide').length
  const qJours   = qs.filter(q=>q.statut==='en_cours').map(q=>q.duree_jours??0)
  const lastAudit = audits.find(a=>a.statut==='realise')
  const gravites  = ['Mineure','Majeure','Critique','Bloquante'].map(g => ({g, n: ncs.filter(x=>x.gravite===g).length}))
  const maxG = Math.max(...gravites.map(x=>x.n), 1)
  const gravCol: Record<string,string> = {Mineure:'#f59e0b',Majeure:'#f97316',Critique:'#ef4444',Bloquante:'#991b1b'}
  return `
  <div id="qual-panel-dashboard" style="display:none;">
    ${panelHdr('Dashboard Qualité','fa-tachometer-alt',RED)}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${kpiCard('fa-exclamation-triangle',RED, ncOpen, 'NC ouvertes', `dont ${ncCrit} critiques/bloquantes`)}
      ${kpiCard('fa-project-diagram','#f59e0b', ncs.filter(n=>n.statut==='8D_ouvert').length, 'Rapports 8D actifs', '')}
      ${kpiCard('fa-ban','#8b5cf6', qs.filter(q=>q.statut==='en_cours').length, 'Lots en quarantaine', qJours.length>0?`Max ${Math.max(...qJours)}j`:'Aucun')}
      ${kpiCard('fa-clipboard-check','#22c55e', pvOK, 'PV validés', `${pvs.length} total`)}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
        <div style="font-weight:800;color:#111827;margin-bottom:16px;font-size:.88rem;">Répartition NC par gravité</div>
        ${gravites.map(({g,n}) => `
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:.75rem;font-weight:700;color:#374151;">${g}</span>
            <span style="font-size:.75rem;font-weight:800;color:${gravCol[g]};">${n}</span>
          </div>
          <div style="height:8px;background:#f1f5f9;border-radius:999px;">
            <div style="height:100%;background:${gravCol[g]};border-radius:999px;width:${Math.round(n/maxG*100)}%;transition:width .4s;"></div>
          </div>
        </div>`).join('')}
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
        <div style="font-weight:800;color:#111827;margin-bottom:16px;font-size:.88rem;">Conformité audits</div>
        ${audits.filter(a=>a.statut==='realise'||a.statut==='cloture').slice(0,4).map(a => `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px;border-radius:8px;background:#f8fafc;">
          <div style="font-size:.7rem;font-weight:700;color:#374151;width:70px;flex-shrink:0;">${escX(a.type_norme)}</div>
          <div style="font-size:.7rem;color:#6b7280;flex:1;">${a.date_audit}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            ${a.score !== undefined ? `<div style="height:6px;width:60px;background:#f1f5f9;border-radius:999px;"><div style="height:100%;background:${(a.score??0)>=85?'#22c55e':(a.score??0)>=70?'#f59e0b':'#ef4444'};border-radius:999px;width:${a.score}%;"></div></div>
            <span style="font-size:.72rem;font-weight:800;color:${(a.score??0)>=85?'#15803d':'#92400e'};">${a.score}%</span>` : ''}
          </div>
          ${a.conforme !== undefined ? badge(a.conforme?'#dcfce7':'#fee2e2',a.conforme?'#15803d':'#b91c1c',a.conforme?'OK':'⚠') : ''}
        </div>`).join('')}
        ${lastAudit ? `<div style="margin-top:12px;font-size:.72rem;color:#6b7280;">Prochain : <strong>${lastAudit.prochain_audit ?? 'À planifier'}</strong></div>` : ''}
      </div>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
        <div style="font-weight:800;color:#111827;font-size:.88rem;"><i class="fas fa-chart-column" style="color:${RED};margin-right:7px;"></i>Pareto des non-conformités <span id="paretoBread" style="font-size:.72rem;color:#94a3b8;font-weight:600;"></span></div>
        <div id="paretoAxes" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
      </div>
      <div id="paretoChart" style="width:100%;overflow-x:auto;"></div>
      <div style="font-size:.68rem;color:#94a3b8;margin-top:8px;">Barres = nb de NC (tri décroissant) · courbe = % cumulé · pointillés = seuil 80/20. Sur l'axe <strong>Nature</strong>, clique une grande famille pour voir ses sous-catégories.</div>
    </div>
    <script>
    window.PARETO_NC=${sjX(ncs.map((n: any) => ({ nature: (n as any).type_defaut || '', cause: (n as any).type_cause || '', poste: (n as any).lieu_detection || '', imput: (n as any).lieu_imputation || '', type: n.type_nc || '', resp: (n as any).responsable || '' })))};
    (function(){
      var AXES=[['nature','Nature'],['cause','Cause (5M)'],['poste','Poste'],['imput','Imputation'],['type','Type NC'],['resp','Responsable']];
      var axis='nature', drill=null, labels=[];
      function esc(s){return String(s).replace(/[<>&]/g,function(c){return c==='<'?'&lt;':c==='>'?'&gt;':'&amp;';});}
      function dist(){var m={};(window.PARETO_NC||[]).forEach(function(n){var v=String(n[axis]||'').trim();if(!v)return;if(axis==='nature'){if(!drill){v=v.split(' - ')[0];}else if(v.split(' - ')[0]!==drill)return;}m[v]=(m[v]||0)+1;});return Object.entries(m).sort(function(a,b){return b[1]-a[1];});}
      function render(){
        var ax=document.getElementById('paretoAxes');if(!ax)return;
        ax.innerHTML=AXES.map(function(a){var on=a[0]===axis;return '<button data-axis="'+a[0]+'" style="padding:4px 12px;border-radius:999px;font-size:.72rem;font-weight:700;cursor:pointer;border:1.5px solid '+(on?'#ef4444':'#e2e8f0')+';background:'+(on?'#ef4444':'white')+';color:'+(on?'white':'#64748b')+';">'+a[1]+'</button>';}).join('');
        var bread=document.getElementById('paretoBread');
        bread.innerHTML=(axis==='nature'&&drill)?'— famille : <strong style="color:#ef4444;">'+esc(drill)+'</strong> <button id="paretoReset" style="margin-left:6px;border:none;background:#f1f5f9;border-radius:6px;padding:1px 7px;font-size:.66rem;cursor:pointer;">← toutes familles</button>':'';
        var d=dist();labels=d.map(function(x){return x[0];});
        var c=document.getElementById('paretoChart');
        if(!d.length){c.innerHTML='<div style="text-align:center;padding:40px;color:#cbd5e1;font-size:.82rem;">Aucune donnée sur cet axe</div>';return;}
        var total=d.reduce(function(s,x){return s+x[1];},0)||1,maxC=d[0][1]||1,n=d.length;
        var W=Math.max(760,n*82),H=340,mL=40,mR=46,mT=16,mB=120,pW=W-mL-mR,pH=H-mT-mB,bY=mT+pH,band=pW/n,bw=Math.min(band*0.6,42);
        var yP=function(p){return mT+pH*(1-p/100);};
        var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;min-width:'+Math.min(W,760)+'px;height:auto;">';
        [0,20,40,60,80,100].forEach(function(p){var y=yP(p);svg+='<line x1="'+mL+'" y1="'+y+'" x2="'+(mL+pW)+'" y2="'+y+'" stroke="'+(p===80?'#fca5a5':'#f1f5f9')+'"'+(p===80?' stroke-dasharray="4 3"':'')+'/><text x="'+(mL+pW+5)+'" y="'+(y+3)+'" font-size="9" fill="#9ca3af">'+p+'%</text>';});
        var cum=0,pts=[],clk=(axis==='nature'&&!drill);
        d.forEach(function(row,i){var cx=mL+band*i+band/2,h=(row[1]/maxC)*pH,y=bY-h,bx=cx-bw/2;svg+='<rect x="'+bx+'" y="'+y+'" width="'+bw+'" height="'+h+'" rx="3" fill="#f87171"'+(clk?' data-drill="'+i+'" style="cursor:pointer;"':'')+'><title>'+esc(row[0])+' : '+row[1]+'</title></rect><text x="'+cx+'" y="'+(y-4)+'" font-size="10" font-weight="700" fill="#b91c1c" text-anchor="middle">'+row[1]+'</text>';cum+=row[1];pts.push(cx+','+yP(cum/total*100));var lbl=row[0].length>16?row[0].slice(0,15)+'…':row[0];svg+='<text x="'+cx+'" y="'+(bY+12)+'" font-size="9" fill="#475569" text-anchor="end" transform="rotate(-35 '+cx+' '+(bY+12)+')">'+esc(lbl)+'</text>';});
        svg+='<polyline points="'+pts.join(' ')+'" fill="none" stroke="#6366f1" stroke-width="2"/>';
        pts.forEach(function(p){var xy=p.split(',');svg+='<circle cx="'+xy[0]+'" cy="'+xy[1]+'" r="3" fill="#6366f1"/>';});
        svg+='</svg>';c.innerHTML=svg;
      }
      document.addEventListener('click',function(e){if(!e.target||!e.target.closest)return;var b=e.target.closest('[data-axis]');if(b){axis=b.getAttribute('data-axis');drill=null;render();return;}var r=e.target.closest('[data-drill]');if(r){drill=labels[+r.getAttribute('data-drill')];render();return;}if(e.target.id==='paretoReset'){drill=null;render();}});
      render();
    })();
    <\/script>
    <div style="border-top:2px solid #f1f5f9;margin:24px 0 18px;"></div>
    <div style="font-weight:800;color:#111827;font-size:.95rem;margin-bottom:14px;"><i class="fas fa-shield-alt" style="color:#0891b2;margin-right:8px;"></i>Audits de conformité (SMI QSE + SI)</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;">
      ${kpiCard('fa-circle-check', '#22c55e', auTaux + '%', 'Réalisation du programme', auReal + ' / ' + prog.length)}
      ${kpiCard('fa-triangle-exclamation', '#ef4444', auLate, 'Audits en retard', 'Date cible dépassée')}
      ${kpiCard('fa-heart-pulse', viveNC ? '#ef4444' : '#22c55e', viveOK + '/' + autoArr.length, 'Items auto conformes', viveNC + ' écart(s)')}
      ${kpiCard('fa-clipboard-check', '#8b5cf6', auSoldes, "Plans d'action soldés", '')}
    </div>
    <div style="background:${viveNC ? '#fef2f2' : '#f0fdf4'};border:1px solid ${viveNC ? '#fecaca' : '#bbf7d0'};border-radius:10px;padding:10px 15px;margin-bottom:14px;font-size:.78rem;color:${viveNC ? '#991b1b' : '#166534'};">
      <i class="fas fa-heart-pulse" style="margin-right:7px;"></i><strong>Conformité vive — surveillance auto-observée</strong> — calculée en temps réel sur les données de l'ERP. ${viveNC ? `<strong>${viveNC} écart(s)</strong> détecté(s).` : 'Aucun écart auto-détecté.'} <span style="color:#64748b;">Un item au rouge = l'ERP n'est pas rempli au bon endroit ; le constat s'écrit tout seul.</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;margin-bottom:20px;">
      ${autoArr.length === 0 ? `<div style="color:#9ca3af;font-size:.82rem;">Sondes indisponibles (module audit non chargé).</div>` : autoArr.map((s: any) => viveCardHTML(s)).join('')}
    </div>
    <div style="font-weight:800;color:#111827;font-size:.86rem;margin-bottom:10px;"><i class="fas fa-table-cells" style="color:#0891b2;margin-right:6px;"></i>Matrice de couverture — Processus × Thèmes (A–K)</div>
    <div style="background:#ecfeff;border:1px solid #cffafe;border-radius:8px;padding:7px 12px;margin-bottom:10px;font-size:.72rem;color:#155e75;"><i class="fas fa-circle-check" style="color:#15803d;"></i> audité &nbsp; <i class="fas fa-circle" style="color:#2563eb;"></i> planifié &nbsp; · = jamais couvert (exhaustivité EN 9100 §9.2)</div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:12px;">${coverageMatrixHTML(prog)}</div>
  </div>`
}

// helper origine clé pour filtrage
function ncOrigineKey(type: string, detecteur?: string): string {
  if (type === 'NC Fournisseur' || detecteur === 'Réception') return 'Fournisseur'
  if (detecteur === 'Client' || type === 'NC Client') return 'Client'
  if (detecteur === 'Audit') return 'Audit'
  if (detecteur === 'Opérateur') return 'Auto-BDT'
  if (detecteur === 'Contrôleur') return 'Auto-OAS'
  return 'Manuel'
}

// Catégorie d'une NC : administratif vs opération (utilise la colonne si présente, sinon heuristique)
function ncCategorieKey(nc: NonConformite): 'administratif' | 'prod' {
  const c = (nc as any).categorie
  if (c === 'administratif') return 'administratif'
  if (c === 'prod' || c === 'operation') return 'prod'   // ancien 'operation' → 'prod'
  const op = (nc.operation || '').toLowerCase()
  const admin = !op || ['réception', 'reception', 'expédition', 'expedition', 'documentation', 'administratif', 'commande', 'facturation'].some(k => op.includes(k))
  return admin ? 'administratif' : 'prod'
}
function ncEntiteKey(nc: NonConformite): 'Seem' | 'Semrac' | '' {
  if (nc.entite === 'Seem' || nc.entite === 'Semrac') return nc.entite
  return ''
}
function ncCategorieBadge(nc: NonConformite): string {
  return ncCategorieKey(nc) === 'prod'
    ? badge('#dbeafe', '#1e40af', 'Production')
    : badge('#f3e8ff', '#6b21a8', 'Administratif')
}
function ncEntiteBadge(nc: NonConformite): string {
  const e = ncEntiteKey(nc)
  if (e === 'Seem') return badge('#dcfce7', '#166534', 'Seem')
  if (e === 'Semrac') return badge('#fee2e2', '#991b1b', 'Semrac')
  return `<span style="font-size:.72rem;color:#cbd5e1;">—</span>`
}

// ══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════

// ─── PANEL : Étude de capabilité (SPC machine / process) ──────
function panelCapabilite(capas: any[], machs: any[], procs: any[], controles: any[] = []) {
  const esc = (s: any) => String(s ?? '').replace(/"/g, '&quot;')
  // Ressources = TOUS les process atelier (machine / manuel) + uniquement les machines SANS process lié
  // (sinon une machine et son process homonyme apparaîtraient en double).
  const procMachineIds = new Set((procs || []).map((p: any) => p.machine_id).filter(Boolean).map(String))
  const seenNom = new Set<string>()
  const resources: any[] = []
  ;(procs || []).forEach((p: any) => {
    const key = String(p.nom || '').trim().toLowerCase()
    if (key && seenNom.has(key)) return
    if (key) seenNom.add(key)
    resources.push({ id: String(p.id), nom: p.nom, type: p.requiert_machine ? 'machine' : 'manuel', kind: 'process', activite: p.activite || '' })
  })
  ;(machs || []).forEach((m: any) => {
    if (procMachineIds.has(String(m.id))) return            // déjà représentée par son process
    const key = String(m.nom || '').trim().toLowerCase()
    if (key && seenNom.has(key)) return
    if (key) seenNom.add(key)
    resources.push({ id: String(m.id), nom: m.nom, type: 'machine', kind: 'machine', activite: m.activite || '', code: m.code || '' })
  })
  // Dernière étude par ressource_id (pour badge + préremplissage)
  const studyByRes: Record<string, any> = {}
  ;(capas || []).forEach((e: any) => { const k = String(e.ressource_id || ''); if (k && !studyByRes[k]) studyByRes[k] = e })
  const vColor = (v: string) => v === 'capable' ? '#15803d' : (v === 'limite' ? '#854d0e' : (v === 'non_capable' ? '#b91c1c' : '#94a3b8'))
  const vBg = (v: string) => v === 'capable' ? '#dcfce7' : (v === 'limite' ? '#fef9c3' : (v === 'non_capable' ? '#fee2e2' : '#f1f5f9'))
  const resItems = resources.length ? resources.map((r: any) => {
    const st = studyByRes[r.id]
    const cpk = st && st.cpk != null ? Number(st.cpk).toFixed(2) : null
    const badge = r.type === 'machine'
      ? '<span style="background:#e0f2fe;color:#0369a1;border-radius:5px;padding:1px 6px;font-size:.58rem;font-weight:700;">Machine</span>'
      : '<span style="background:#f1f5f9;color:#475569;border-radius:5px;padding:1px 6px;font-size:.58rem;font-weight:700;">Manuel</span>'
    const cpkBadge = cpk != null ? `<span style="background:${vBg(st.verdict)};color:${vColor(st.verdict)};border-radius:999px;padding:1px 7px;font-size:.6rem;font-weight:800;">Cpk ${cpk}</span>` : '<span style="color:#cbd5e1;font-size:.6rem;">— non étudié —</span>'
    return `<div class="capa-res-item" data-id="${esc(r.id)}" data-nom="${esc(r.nom)}" data-type="${r.type}" data-kind="${r.kind}" onclick="capaSelectRes(this)" style="padding:9px 11px;border:1px solid #f1f5f9;border-radius:9px;cursor:pointer;margin-bottom:6px;transition:all .12s;">
      <div style="display:flex;align-items:center;gap:6px;justify-content:space-between;">
        <span style="font-weight:700;color:#1e293b;font-size:.8rem;">${escX(r.nom)}</span>${badge}
      </div>
      <div style="margin-top:4px;display:flex;align-items:center;justify-content:space-between;">${cpkBadge}<span style="color:#cbd5e1;font-size:.58rem;">${escX(r.activite || '')}</span></div>
    </div>`
  }).join('') : '<div style="text-align:center;padding:24px;color:#cbd5e1;font-size:.78rem;">Aucun process / machine en base.</div>'

  // ─── CARTES DE CONTRÔLE MACHINE (écarts réduits — agrège toutes les pièces) ──
  const _ncdf = (z: number) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(z))
    const d = 0.3989423 * Math.exp(-z * z / 2)
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
    return z > 0 ? 1 - p : p
  }
  const ctrlByMachine: Record<string, any[]> = {}
  ;(controles || []).forEach((x: any) => { const k = String(x.machine_id || x.machine_nom || '—'); (ctrlByMachine[k] = ctrlByMachine[k] || []).push(x) })
  const machNomById: Record<string, string> = {}
  ;(machs || []).forEach((m: any) => { machNomById[String(m.id)] = m.nom })
  const spcCard = (nom: string, icon: string, iconCol: string, rows: any[], compact = false) => {
    const chrono = [...rows].sort((a, b) => String(a.date_controle).localeCompare(String(b.date_controle)))
    const en = chrono.map(r => Number(r.ecart_norm) || 0)
    const n = en.length
    const mean = en.reduce((s, v) => s + v, 0) / (n || 1)
    const sigma = n > 1 ? Math.sqrt(en.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1)) : 0
    const cp = sigma > 0 ? 1 / (3 * sigma) : null
    const cpu = sigma > 0 ? (1 - mean) / (3 * sigma) : null
    const cpl = sigma > 0 ? (mean + 1) / (3 * sigma) : null
    const cpk = (cpu != null && cpl != null) ? Math.min(cpu, cpl) : null
    const ppm = sigma > 0 ? Math.round((_ncdf(-((1 - mean) / sigma)) + _ncdf(-((mean + 1) / sigma))) * 1e6) : null
    const nbConf = chrono.filter(r => r.conforme !== false).length
    const pctConf = n ? Math.round(nbConf / n * 100) : 0
    const nOp = chrono.filter(r => r.source !== 'qualite').length
    const nQ = n - nOp
    const verdict = cpk == null ? 'insuffisant' : cpk >= 1.33 ? 'capable' : cpk >= 1 ? 'limite' : 'non_capable'
    const vc = verdict === 'capable' ? '#15803d' : verdict === 'limite' ? '#b45309' : verdict === 'non_capable' ? '#b91c1c' : '#64748b'
    const vbg = verdict === 'capable' ? '#dcfce7' : verdict === 'limite' ? '#fef9c3' : verdict === 'non_capable' ? '#fee2e2' : '#f1f5f9'
    const cotes = Array.from(new Set(chrono.map(r => r.cote).filter(Boolean)))
    const W = 640, H = compact ? 150 : 190, padL = 30, padR = 12, padT = 12, padB = 18
    const yMax = Math.max(1.3, ...en.map(v => Math.abs(v)), Math.abs(mean) + 3 * sigma) * 1.05
    const xOf = (i: number) => padL + (n <= 1 ? (W - padL - padR) / 2 : i / (n - 1) * (W - padL - padR))
    const yOf = (v: number) => padT + (1 - (v + yMax) / (2 * yMax)) * (H - padT - padB)
    const hl = (y: number, col: string, dash = '') => `<line x1="${padL}" y1="${yOf(y).toFixed(1)}" x2="${W - padR}" y2="${yOf(y).toFixed(1)}" stroke="${col}" stroke-width="1" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`
    const poly = chrono.map((r, i) => `${xOf(i).toFixed(1)},${yOf(en[i]).toFixed(1)}`).join(' ')
    const pts = chrono.map((r, i) => `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(en[i]).toFixed(1)}" r="3" fill="${Math.abs(en[i]) > 1 ? '#ef4444' : (r.source === 'qualite' ? '#7c3aed' : '#0d9488')}"><title>${esc(r.cote)} · ${esc(r.piece || '')} · mesuré ${esc(r.mesure)} (écart réduit ${en[i].toFixed(2)})</title></circle>`).join('')
    const svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="#cbd5e1"/>
      ${hl(1, '#ef4444', '5 3')}${hl(-1, '#ef4444', '5 3')}${hl(0, '#16a34a')}
      ${sigma > 0 ? hl(mean, '#2563eb') + hl(mean + 3 * sigma, '#f59e0b', '2 2') + hl(mean - 3 * sigma, '#f59e0b', '2 2') : ''}
      <text x="2" y="${(yOf(1) + 3).toFixed(1)}" font-size="8" fill="#ef4444">+1</text>
      <text x="2" y="${(yOf(-1) + 3).toFixed(1)}" font-size="8" fill="#ef4444">-1</text>
      <text x="3" y="${(yOf(0) + 3).toFixed(1)}" font-size="8" fill="#16a34a">0</text>
      <polyline points="${poly}" fill="none" stroke="#0d9488" stroke-width="1.1" opacity=".45"/>
      ${pts}
    </svg>`
    const kpi = (lbl: string, val: string, col: string) => `<div style="background:#f8fafc;border-radius:8px;padding:6px 8px;text-align:center;"><div style="font-size:.95rem;font-weight:900;color:${col};">${val}</div><div style="font-size:.55rem;color:#94a3b8;text-transform:uppercase;font-weight:700;">${lbl}</div></div>`
    return `<div class="card" style="padding:14px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <i class="fas ${icon}" style="color:${iconCol};"></i><span style="font-weight:800;color:#111827;font-size:.9rem;">${esc(nom)}</span>
        <span style="background:${vbg};color:${vc};border-radius:999px;padding:1px 9px;font-size:.62rem;font-weight:800;">${verdict === 'capable' ? 'Capable' : verdict === 'limite' ? 'Limite' : verdict === 'non_capable' ? 'Non capable' : 'À étoffer'}</span>
        <span style="color:#94a3b8;font-size:.66rem;margin-left:auto;">${n} mesure(s) · ${nOp} opérateur / ${nQ} qualité</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10px;">
        ${kpi('Cp', cp != null ? cp.toFixed(2) : '—', '#0d9488')}${kpi('Cpk', cpk != null ? cpk.toFixed(2) : '—', vc)}${kpi('σ réduit', sigma.toFixed(3), '#2563eb')}${kpi('% conforme', pctConf + '%', pctConf >= 99 ? '#15803d' : '#b45309')}${kpi('PPM', ppm != null ? ppm.toLocaleString('fr-FR') : '—', '#b91c1c')}
      </div>
      ${svg}
      ${cotes.length ? `<div style="font-size:.6rem;color:#64748b;margin-top:6px;">Cotes : ${cotes.slice(0, 8).map(c => `<span style="background:#f1f5f9;border-radius:5px;padding:1px 6px;margin-right:3px;">${esc(c)}</span>`).join('')}${cotes.length > 8 ? ' …' : ''}</div>` : ''}
      <div style="font-size:.57rem;color:#94a3b8;margin-top:4px;text-align:center;">Carte aux écarts réduits — chaque point = un contrôle de cote (toutes pièces confondues). Rouge = hors tolérance · Violet = qualité.</div>
    </div>`
  }
  const ccEmpty = '<div style="text-align:center;padding:22px;color:#cbd5e1;font-size:.78rem;">Aucun contrôle enregistré pour ce process. Cliquez « Nouveau contrôle » (les opérateurs les saisissent aussi depuis leur BDT).</div>'
  // ── Un panneau de contrôle PAR RESSOURCE (process / machine) : liste + carte complète + par opérateur ──
  const procPanels = resources.map((res: any) => {
    const procRec = (procs || []).find((p: any) => String(p.id) === String(res.id))
    const machId = res.kind === 'machine' ? String(res.id) : (procRec && procRec.machine_id ? String(procRec.machine_id) : '')
    const machRec = (machs || []).find((m: any) => String(m.id) === machId)
    const rows = machId ? (controles || []).filter((c: any) => String(c.machine_id) === machId) : []
    const sorted = [...rows].sort((a, b) => String(b.date_controle).localeCompare(String(a.date_controle)))
    const listeRows = sorted.map((c: any, idx: number) => {
      const op = c.source === 'qualite' ? 'Qualité' : ((c.operateur_nom && String(c.operateur_nom).trim()) || '—')
      const conf = c.conforme !== false
      return `<tr data-op="${esc(op)}" data-i="${idx}" style="border-bottom:1px solid #f8fafc;">
        <td style="padding:6px 8px;font-size:.68rem;color:#64748b;white-space:nowrap;">${esc(String(c.date_controle || '').slice(0, 16).replace('T', ' '))}</td>
        <td style="padding:6px 8px;font-size:.72rem;font-weight:700;color:#374151;">${esc(c.cote)}</td>
        <td style="padding:6px 8px;font-size:.7rem;color:#64748b;">${esc(c.piece || '—')}</td>
        <td style="padding:6px 8px;font-size:.72rem;text-align:right;">${esc(c.mesure)}</td>
        <td style="padding:6px 8px;font-size:.72rem;text-align:right;font-weight:700;color:${Math.abs(Number(c.ecart_norm) || 0) > 1 ? '#b91c1c' : '#0f766e'};">${(Number(c.ecart_norm) || 0).toFixed(2)}</td>
        <td style="padding:6px 8px;"><span style="background:${c.source === 'qualite' ? '#f3e8ff' : '#f0fdfa'};color:${c.source === 'qualite' ? '#7c3aed' : '#0f766e'};border-radius:5px;padding:1px 7px;font-size:.62rem;font-weight:700;">${esc(op)}</span></td>
        <td style="padding:6px 8px;text-align:center;"><span style="color:${conf ? '#15803d' : '#b91c1c'};font-weight:800;font-size:.74rem;">${conf ? '✓' : '✗'}</span></td>
      </tr>`
    }).join('')
    const liste = rows.length ? `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">${['Date', 'Cote', 'Pièce', 'Mesure', 'Écart réd.', 'Par', 'Conf.'].map(h => `<th style="padding:7px 8px;text-align:left;font-size:.6rem;text-transform:uppercase;color:#6b7280;">${h}</th>`).join('')}</tr></thead>
      <tbody id="proc-liste-tb-${esc(res.id)}">${listeRows}</tbody></table>` : ccEmpty
    const carteComplete = rows.length ? spcCard(res.nom, 'fa-microchip', '#0d9488', rows) : ccEmpty
    const byCtrl: Record<string, any[]> = {}
    ;(rows as any[]).forEach((r: any) => { const k = r.source === 'qualite' ? '§Qualité' : ((r.operateur_nom && String(r.operateur_nom).trim()) || 'Opérateur'); (byCtrl[k] = byCtrl[k] || []).push(r) })
    const indiv = rows.length ? Object.entries(byCtrl).map(([ctrl, rs]) => { const isQ = ctrl === '§Qualité'; return spcCard(isQ ? 'Contrôle Qualité' : ctrl, isQ ? 'fa-clipboard-check' : 'fa-user', isQ ? '#7c3aed' : '#0d9488', rs as any[], true) }).join('') : ccEmpty
    const tabBtn = (t: string, lbl: string, ic: string, on: boolean) => `<button id="pt-${t}-${esc(res.id)}" onclick="procTab('${esc(res.id)}','${t}')" style="background:${on ? '#0d9488' : 'transparent'};color:${on ? '#fff' : '#475569'};border:none;border-radius:7px;padding:6px 13px;font-size:.73rem;font-weight:700;cursor:pointer;"><i class="fas ${ic}" style="margin-right:5px;"></i>${lbl}</button>`
    return `<div id="proc-panel-${esc(res.id)}" class="proc-panel" style="display:none;flex-direction:column;gap:14px;">
      <div class="card" style="padding:14px 18px;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <i class="fas ${res.type === 'machine' ? 'fa-microchip' : 'fa-cog'}" style="color:#0d9488;font-size:1.05rem;"></i>
          <span style="font-weight:800;font-size:1rem;color:#111827;">${esc(res.nom)}</span>
          ${machRec ? `<span style="background:#e0f2fe;color:#0369a1;border-radius:6px;padding:2px 8px;font-size:.64rem;font-weight:700;">Machine : ${esc(machRec.nom)}${machRec.tolerance_defaut != null ? ` · tol ±${esc(machRec.tolerance_defaut)}` : ''}</span>` : '<span style="background:#fef9c3;color:#854d0e;border-radius:6px;padding:2px 8px;font-size:.64rem;font-weight:700;">Process manuel — pas de machine liée</span>'}
          <span style="color:#94a3b8;font-size:.7rem;">${rows.length} contrôle(s)</span>
          ${machId ? `<button onclick="procNouveau('${esc(machId)}')" style="margin-left:auto;background:#0d9488;color:#fff;border:none;border-radius:9px;padding:8px 16px;font-size:.82rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:6px;"></i>Nouveau contrôle</button>` : ''}
        </div>
        <div style="display:inline-flex;background:#f1f5f9;border-radius:9px;padding:3px;gap:2px;margin-top:12px;">
          ${tabBtn('liste', 'Liste des contrôles', 'fa-list', true)}${tabBtn('carte', 'Carte complète', 'fa-chart-area', false)}${rows.length ? tabBtn('indiv', 'Par opérateur', 'fa-users', false) : ''}
        </div>
      </div>
      <div id="pv-liste-${esc(res.id)}" class="card" style="padding:14px;">
        ${rows.length ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-weight:800;color:#0f766e;font-size:.82rem;">Contrôles enregistrés</span><label style="font-size:.72rem;color:#475569;cursor:pointer;"><input type="checkbox" onchange="procSortOp('${esc(res.id)}',this.checked)"/> Trier par opérateur</label></div>` : ''}
        ${liste}
      </div>
      <div id="pv-carte-${esc(res.id)}" style="display:none;">${carteComplete}</div>
      <div id="pv-indiv-${esc(res.id)}" style="display:none;">${indiv}</div>
    </div>`
  }).join('')
  const machineOptions = (machs || []).map((m: any) => `<option value="${esc(m.id)}" data-tol="${m.tolerance_defaut != null ? m.tolerance_defaut : ''}">${esc(m.nom)}</option>`).join('')
  const machineCardsSection = `
    <div id="ccModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:14px;padding:20px;width:480px;max-width:94vw;max-height:92vh;overflow:auto;">
        <div style="font-weight:800;font-size:1rem;margin-bottom:14px;color:#0f766e;"><i class="fas fa-ruler-combined" style="margin-right:6px;"></i>Contrôle de cote — Qualité</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div style="grid-column:1/3;"><label class="cc-l">Machine</label><select id="cc_machine" onchange="ccMachineTol()" class="cc-i">${machineOptions}</select></div>
          <div><label class="cc-l">Pièce</label><input id="cc_piece" class="cc-i" placeholder="réf pièce"/></div>
          <div><label class="cc-l">Cote</label><input id="cc_cote" class="cc-i" placeholder="ex : Ø12 H7"/></div>
          <div><label class="cc-l">Nominale</label><input id="cc_nom" type="number" step="any" oninput="ccMachineTol()" class="cc-i"/></div>
          <div><label class="cc-l">Mesure</label><input id="cc_mes" type="number" step="any" class="cc-i"/></div>
          <div><label class="cc-l">Tol. mini (LSL)</label><input id="cc_tmin" type="number" step="any" class="cc-i"/></div>
          <div><label class="cc-l">Tol. maxi (USL)</label><input id="cc_tmax" type="number" step="any" class="cc-i"/></div>
          <div style="grid-column:1/3;"><label class="cc-l">Contrôleur</label><input id="cc_ctrl" class="cc-i" placeholder="nom"/></div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
          <button onclick="ccCloseModal()" style="background:#f1f5f9;border:none;border-radius:8px;padding:8px 14px;font-size:.8rem;cursor:pointer;">Annuler</button>
          <button onclick="ccSubmit()" style="background:#0d9488;color:white;border:none;border-radius:8px;padding:8px 14px;font-size:.8rem;font-weight:700;cursor:pointer;">Enregistrer</button>
        </div>
      </div>
    </div>
    <style>.cc-l{display:block;font-size:.6rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:2px;}.cc-i{width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:6px 9px;font-size:.8rem;box-sizing:border-box;}</style>
    <script>
    function ccOpenModal(){document.getElementById('ccModal').style.display='flex';}
    function ccCloseModal(){document.getElementById('ccModal').style.display='none';}
    function ccMachineTol(){ var sel=document.getElementById('cc_machine'); var o=sel.options[sel.selectedIndex]; var tol=o?parseFloat(o.getAttribute('data-tol')):NaN; var nom=parseFloat(document.getElementById('cc_nom').value); if(isFinite(tol)&&isFinite(nom)){ if(document.getElementById('cc_tmin').value==='')document.getElementById('cc_tmin').value=+(nom-tol).toFixed(4); if(document.getElementById('cc_tmax').value==='')document.getElementById('cc_tmax').value=+(nom+tol).toFixed(4); } }
    function ccView(v){ var c=v==='complete'; document.getElementById('cc_view_complete').style.display=c?'':'none'; document.getElementById('cc_view_indiv').style.display=c?'none':''; var bc=document.getElementById('cc_tab_complete'),bi=document.getElementById('cc_tab_indiv'); bc.style.background=c?'#0d9488':'transparent'; bc.style.color=c?'#fff':'#475569'; bi.style.background=c?'transparent':'#0d9488'; bi.style.color=c?'#475569':'#fff'; var h=document.getElementById('cc_view_hint'); if(h)h.textContent=c?'Carte complète = bilan de tous les contrôles (opérateurs + qualité) → la capabilité de la machine.':'Cartes individuelles = une carte par opérateur (et par la qualité), avec son propre Cp/Cpk dans le process.'; }
    async function ccSubmit(){
      var sel=document.getElementById('cc_machine');
      var p={machine_id:sel.value,machine_nom:(sel.options[sel.selectedIndex]||{}).text||'',piece:document.getElementById('cc_piece').value,cote:document.getElementById('cc_cote').value,nominale:document.getElementById('cc_nom').value,mesure:document.getElementById('cc_mes').value,tol_min:document.getElementById('cc_tmin').value,tol_max:document.getElementById('cc_tmax').value,controleur:document.getElementById('cc_ctrl').value,source:'qualite'};
      if(!p.cote||p.nominale===''||p.mesure===''||p.tol_min===''||p.tol_max===''){alert('Cote, nominale, mesure et tolérances requises.');return;}
      var r=await fetch('/api/controles/cote',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
      var j=await r.json(); if(j.ok){softReload();}else{alert(j.error||'Erreur');}
    }
    </script>`

  return `
  <div id="qual-panel-capabilite" style="display:none;">
    <div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:4px;display:flex;align-items:center;gap:8px;"><i class="fas fa-chart-area" style="color:#0d9488;"></i>Étude de capabilité — machines &amp; process atelier</div>
    <div style="font-size:.76rem;color:#64748b;margin-bottom:16px;">Sélectionnez un process / machine à gauche : vous y retrouvez la <strong>liste des contrôles de cotes</strong> (triables par opérateur), la <strong>carte complète</strong> (capabilité de la machine = bilan de tous les contrôles via l'écart réduit), les cartes <strong>par opérateur</strong>, et le bouton <strong>« Nouveau contrôle »</strong>. Les contrôles faits par les opérateurs sur leurs BDT remontent automatiquement sur la machine correspondante.</div>

    ${machineCardsSection}

    <div style="display:grid;grid-template-columns:300px 1fr;gap:16px;align-items:start;">
      <!-- LISTE DES RESSOURCES -->
      <div class="card" style="padding:12px;position:sticky;top:12px;">
        <div style="font-weight:800;color:#0f766e;font-size:.82rem;margin-bottom:8px;"><i class="fas fa-sitemap" style="margin-right:6px;"></i>Process &amp; machines <span style="background:#ccfbf1;color:#0f766e;border-radius:999px;padding:1px 8px;font-size:.66rem;">${resources.length}</span></div>
        <input id="capa_res_search" type="text" placeholder="🔍 Rechercher…" oninput="capaFilterRes()" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.76rem;outline:none;box-sizing:border-box;margin-bottom:8px;"/>
        <div id="capa_res_list" style="max-height:620px;overflow-y:auto;">${resItems}</div>
      </div>

      <!-- WORKSPACE -->
      <div id="capa_ws_empty" class="card" style="padding:48px;text-align:center;color:#94a3b8;">
        <i class="fas fa-hand-pointer" style="font-size:2rem;display:block;margin-bottom:12px;color:#cbd5e1;"></i>Sélectionnez un process ou une machine dans la liste pour démarrer / consulter son étude de capabilité.
      </div>
      <div id="capa_ws" style="display:none;flex-direction:column;gap:16px;">
        ${procPanels}
      </div>
      <div id="capa_ws_legacy" style="display:none;flex-direction:column;gap:16px;">

        <!-- ancien formulaire d'étude manuelle (conservé, masqué) -->
        <div class="card" style="padding:16px 18px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
            <i class="fas fa-cog" style="color:#0d9488;font-size:1.1rem;"></i>
            <span id="capa_ws_nom" style="font-weight:800;font-size:1rem;color:#111827;"></span>
            <span id="capa_ws_type"></span>
            <span id="capa_ws_saved" style="font-size:.7rem;color:#94a3b8;"></span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
            <div><label style="font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Caractéristique</label><input id="capa_carac" type="text" placeholder="ex : Ø12 H7" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;"/></div>
            <div><label style="font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Unité</label><input id="capa_unite" type="text" placeholder="mm" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;"/></div>
            <div><label style="font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Seuil capabilité</label><input id="capa_seuil" type="number" step="any" value="1.33" oninput="capaCompute()" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;"/></div>
            <div><label style="font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Production totale</label><input id="capa_prod" type="number" step="any" value="1000000" oninput="capaCompute()" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;"/></div>
            <div><label style="font-size:.62rem;font-weight:700;color:#dc2626;text-transform:uppercase;">LSL (tol. mini)</label><input id="capa_lsl" type="number" step="any" oninput="capaCompute()" style="width:100%;border:1.5px solid #fecaca;border-radius:8px;padding:6px 9px;font-size:.8rem;background:#fef2f2;box-sizing:border-box;"/></div>
            <div><label style="font-size:.62rem;font-weight:700;color:#2563eb;text-transform:uppercase;">Valeur nominale</label><input id="capa_nom" type="number" step="any" oninput="capaCompute()" placeholder="auto = milieu" style="width:100%;border:1.5px solid #bfdbfe;border-radius:8px;padding:6px 9px;font-size:.8rem;background:#eff6ff;box-sizing:border-box;"/></div>
            <div><label style="font-size:.62rem;font-weight:700;color:#dc2626;text-transform:uppercase;">USL (tol. maxi)</label><input id="capa_usl" type="number" step="any" oninput="capaCompute()" style="width:100%;border:1.5px solid #fecaca;border-radius:8px;padding:6px 9px;font-size:.8rem;background:#fef2f2;box-sizing:border-box;"/></div>
            <div><label style="font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Opérateur</label><input id="capa_operateur" type="text" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;"/></div>
          </div>
          <div style="margin-top:12px;">
            <label style="font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Mesures <span id="capa_ncount" style="color:#0d9488;"></span> <span style="font-weight:500;text-transform:none;color:#94a3b8;">(espace, virgule ou retour ligne)</span></label>
            <textarea id="capa_mesures" rows="3" oninput="capaCompute()" placeholder="12.01 12.03 11.99 12.00 …" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;resize:vertical;font-family:monospace;"></textarea>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
            <button onclick="capaSave()" style="padding:10px 20px;background:linear-gradient(135deg,#0d9488,#14b8a6);color:white;border:none;border-radius:10px;font-size:.84rem;font-weight:800;cursor:pointer;"><i class="fas fa-save" style="margin-right:6px;"></i>Enregistrer l'étude</button>
            <span style="font-size:.7rem;color:#94a3b8;">σ = écart-type échantillon · Cm = Cp/(1+9·(Cp−Cpk)²)</span>
          </div>
        </div>

        <!-- KPIs + verdict -->
        <div id="capa_kpis"></div>

        <!-- Gaussienne + nuage des mesures -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="card" style="padding:14px;"><div style="font-weight:800;color:#0f766e;font-size:.82rem;margin-bottom:6px;"><i class="fas fa-bell" style="margin-right:5px;"></i>Distribution (gaussienne &amp; histogramme)</div><div id="capa_chart_gauss"></div></div>
          <div class="card" style="padding:14px;"><div style="font-weight:800;color:#0f766e;font-size:.82rem;margin-bottom:6px;"><i class="fas fa-braille" style="margin-right:5px;"></i>Nuage des mesures</div><div id="capa_chart_run"></div></div>
        </div>

        <!-- Tableau conventionnel σ / Cpk / DPMO -->
        <div class="card" style="padding:14px;"><div style="font-weight:800;color:#0f766e;font-size:.82rem;margin-bottom:8px;"><i class="fas fa-table" style="margin-right:5px;"></i>Tableau conventionnel — niveau de qualité (votre position est surlignée)</div><div id="capa_conv_table" style="overflow-x:auto;"></div></div>

        <!-- Convergence + Fiabilité -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="card" style="padding:14px;"><div style="font-weight:800;color:#0f766e;font-size:.82rem;margin-bottom:2px;"><i class="fas fa-wave-square" style="margin-right:5px;"></i>Convergence des indices selon le nombre de mesures</div><div style="font-size:.66rem;color:#94a3b8;margin-bottom:6px;">Les indices se stabilisent quand l'échantillon grandit → confirme que l'étude est représentative.</div><div id="capa_chart_conv"></div></div>
          <div class="card" style="padding:14px;"><div style="font-weight:800;color:#0f766e;font-size:.82rem;margin-bottom:2px;"><i class="fas fa-bullseye" style="margin-right:5px;"></i>Fiabilité — incertitude selon le nombre de mesures</div><div style="font-size:.66rem;color:#94a3b8;margin-bottom:6px;">L'incertitude sur la moyenne décroît en 1/√n : indique à partir de combien de mesures l'étude devient fiable.</div><div id="capa_chart_rel"></div></div>
        </div>

      </div>
    </div>

    <script>
      var _capaSel=null;
      // ── Stats normales ──
      function _erf(x){ var s=x<0?-1:1; x=Math.abs(x); var t=1/(1+0.3275911*x); var y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x); return s*y; }
      function _ncdf(z){ return 0.5*(1+_erf(z/Math.SQRT2)); }
      function capaNum(id){ var e=document.getElementById(id); var v=e?e.value:''; return (v===''||v==null)?null:parseFloat(String(v).replace(',','.')); }
      function capaParse(){ var t=(document.getElementById('capa_mesures')||{value:''}).value; return t.split(/[\\s,;]+/).map(function(v){return parseFloat(String(v).replace(',','.'));}).filter(function(v){return isFinite(v);}); }
      function capaF(x,d){ if(x==null||!isFinite(x)) return '—'; var p=Math.pow(10,d==null?2:d); return (Math.round(x*p)/p).toString(); }
      function capaCore(xs,usl,lsl,seuil){
        var n=xs.length; if(n<2) return {n:n,verdict:'na'};
        var mean=xs.reduce(function(a,b){return a+b;},0)/n;
        var s=Math.sqrt(xs.reduce(function(a,b){return a+(b-mean)*(b-mean);},0)/(n-1));
        var cv= mean!==0 ? s/Math.abs(mean) : null;
        var hasU=usl!=null&&isFinite(usl), hasL=lsl!=null&&isFinite(lsl);
        if(!(s>0)) return {n:n,mean:mean,sigma:0,cv:cv,verdict:'na',min:Math.min.apply(null,xs),max:Math.max.apply(null,xs)};
        var cp=(hasU&&hasL)?(usl-lsl)/(6*s):null;
        var cpu=hasU?(usl-mean)/(3*s):Infinity, cpl=hasL?(mean-lsl)/(3*s):Infinity;
        var cpk=Math.min(cpu,cpl); if(!isFinite(cpk)) cpk=(hasU||hasL)?(isFinite(cpu)?cpu:(isFinite(cpl)?cpl:null)):null;
        var cm=(cp!=null&&cpk!=null)?cp/(1+9*Math.pow(cp-cpk,2)):null;
        var pAbove=hasU?Math.max(0,1-_ncdf((usl-mean)/s)):0, pBelow=hasL?Math.max(0,_ncdf((lsl-mean)/s)):0;
        var nc=Math.min(1,pAbove+pBelow); var dpmo=nc*1e6; var yld=1-nc;
        var niveau=cpk!=null?3*cpk:null;
        var verdict=cpk==null?'na':(cpk>=seuil?'capable':(cpk>=1.0?'limite':'non_capable'));
        return {n:n,mean:mean,sigma:s,cv:cv,cp:cp,cpk:cpk,cm:cm,dpmo:dpmo,yield:yld,niveau:niveau,conformePct:yld*100,ncPct:nc*100,min:Math.min.apply(null,xs),max:Math.max.apply(null,xs),verdict:verdict};
      }
      function capaRunning(xs,usl,lsl,seuil){
        var conv=[], rel=[]; var n=0,mean=0,M2=0;
        var hasU=usl!=null&&isFinite(usl), hasL=lsl!=null&&isFinite(lsl);
        for(var i=0;i<xs.length;i++){ n++; var x=xs[i]; var d=x-mean; mean+=d/n; M2+=d*(x-mean);
          if(n>=2){ var s=Math.sqrt(M2/(n-1)); var cp=null,cpk=null,cm=null,err=null;
            if(s>0){ cp=(hasU&&hasL)?(usl-lsl)/(6*s):null; var cu=hasU?(usl-mean)/(3*s):Infinity, cl=hasL?(mean-lsl)/(3*s):Infinity; cpk=Math.min(cu,cl); if(!isFinite(cpk)) cpk=(hasU||hasL)?(isFinite(cu)?cu:cl):null; cm=(cp!=null&&cpk!=null)?cp/(1+9*Math.pow(cp-cpk,2)):null; err=3*seuil*s/Math.sqrt(n); }
            conv.push({k:n,cp:cp,cpk:cpk,cm:cm}); rel.push({k:n,err:err}); }
        }
        return {conv:conv,rel:rel};
      }
      // ── Graphiques SVG ──
      function _sc(v,a,b,p,q){ if(b===a) return (p+q)/2; return p+(v-a)/(b-a)*(q-p); }
      function capaLineChart(series,hlines,opts){
        opts=opts||{}; var W=opts.w||440,H=opts.h||180,ml=44,mr=14,mt=14,mb=26;
        var xs=[],ys=[]; series.forEach(function(s){ s.pts.forEach(function(p){ if(p[1]!=null&&isFinite(p[1])){xs.push(p[0]);ys.push(p[1]);} }); }); (hlines||[]).forEach(function(h){ if(h.y!=null&&isFinite(h.y)) ys.push(h.y); });
        if(xs.length<1) return '<div style="color:#cbd5e1;text-align:center;padding:30px;font-size:.78rem;">Données insuffisantes</div>';
        var xmin=opts.xmin!=null?opts.xmin:Math.min.apply(null,xs), xmax=opts.xmax!=null?opts.xmax:Math.max.apply(null,xs);
        var ymin=opts.ymin!=null?opts.ymin:Math.min.apply(null,ys), ymax=opts.ymax!=null?opts.ymax:Math.max.apply(null,ys);
        if(ymax===ymin){ymax=ymin+1;ymin-=1;} var pad=(ymax-ymin)*0.1; ymin-=pad; ymax+=pad;
        var SX=function(x){return _sc(x,xmin,xmax,ml,W-mr);}, SY=function(y){return _sc(y,ymin,ymax,H-mb,mt);};
        var g='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;font-family:Inter,sans-serif;">';
        g+='<line x1="'+ml+'" y1="'+(H-mb)+'" x2="'+(W-mr)+'" y2="'+(H-mb)+'" stroke="#cbd5e1"/><line x1="'+ml+'" y1="'+mt+'" x2="'+ml+'" y2="'+(H-mb)+'" stroke="#cbd5e1"/>';
        for(var t=0;t<=2;t++){ var yy=ymin+(ymax-ymin)*t/2, py=SY(yy); g+='<line x1="'+ml+'" y1="'+py+'" x2="'+(W-mr)+'" y2="'+py+'" stroke="#f1f5f9"/><text x="'+(ml-4)+'" y="'+(py+3)+'" text-anchor="end" font-size="8" fill="#94a3b8">'+(Math.round(yy*100)/100)+'</text>'; }
        (hlines||[]).forEach(function(h){ if(h.y==null||!isFinite(h.y))return; var py=SY(h.y); g+='<line x1="'+ml+'" y1="'+py+'" x2="'+(W-mr)+'" y2="'+py+'" stroke="'+h.color+'" stroke-dasharray="4 3"/><text x="'+(W-mr-2)+'" y="'+(py-2)+'" text-anchor="end" font-size="8" fill="'+h.color+'">'+h.label+'</text>'; });
        series.forEach(function(s){ var d='',started=false; s.pts.forEach(function(p){ if(p[1]==null||!isFinite(p[1]))return; d+=(started?'L':'M')+SX(p[0]).toFixed(1)+' '+SY(p[1]).toFixed(1)+' '; started=true; }); if(d) g+='<path d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="'+(s.width||1.8)+'"/>'; if(s.dots){ s.pts.forEach(function(p){ if(p[1]==null||!isFinite(p[1]))return; g+='<circle cx="'+SX(p[0]).toFixed(1)+'" cy="'+SY(p[1]).toFixed(1)+'" r="1.6" fill="'+s.color+'"/>'; }); } });
        g+='<text x="'+((ml+W-mr)/2)+'" y="'+(H-2)+'" text-anchor="middle" font-size="8" fill="#94a3b8">'+(opts.xlab||'')+'</text>';
        var lx=ml+6,ly=mt+9; series.forEach(function(s){ if(!s.label)return; g+='<rect x="'+lx+'" y="'+(ly-6)+'" width="9" height="3" fill="'+s.color+'"/><text x="'+(lx+12)+'" y="'+(ly-2)+'" font-size="8" fill="#475569">'+s.label+'</text>'; lx+=String(s.label).length*5.2+26; });
        return g+'</svg>';
      }
      function capaHistoChart(xs,mean,sigma,lsl,usl,nom){
        var W=440,H=190,ml=30,mr=14,mt=16,mb=24;
        var lo=Math.min.apply(null,xs), hi=Math.max.apply(null,xs);
        if(lsl!=null&&isFinite(lsl))lo=Math.min(lo,lsl); if(usl!=null&&isFinite(usl))hi=Math.max(hi,usl);
        var sp=hi-lo||1; lo-=sp*0.12; hi+=sp*0.12; sp=hi-lo;
        var bins=Math.max(8,Math.min(22,Math.round(Math.sqrt(xs.length))*2)), w=sp/bins, ct=new Array(bins).fill(0);
        xs.forEach(function(v){ var k=Math.floor((v-lo)/w); if(k<0)k=0; if(k>=bins)k=bins-1; ct[k]++; });
        var maxRf=Math.max.apply(null,ct)/xs.length||1; var pdfMaxBin= sigma>0 ? (1/(sigma*Math.sqrt(2*Math.PI)))*w : 0;
        var top=Math.max(maxRf,pdfMaxBin)||1;
        var SX=function(x){return ml+(x-lo)/sp*(W-ml-mr);}, SY=function(v){return (H-mb)-(v/top)*(H-mb-mt);};
        var g='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;font-family:Inter,sans-serif;">';
        g+='<line x1="'+ml+'" y1="'+(H-mb)+'" x2="'+(W-mr)+'" y2="'+(H-mb)+'" stroke="#cbd5e1"/>';
        for(var i=0;i<bins;i++){ var rf=ct[i]/xs.length; if(rf<=0)continue; var bx=SX(lo+i*w), bw=(W-ml-mr)/bins; g+='<rect x="'+(bx+1).toFixed(1)+'" y="'+SY(rf).toFixed(1)+'" width="'+(bw-2).toFixed(1)+'" height="'+((H-mb)-SY(rf)).toFixed(1)+'" fill="#5eead4" opacity="0.75"/>'; }
        if(sigma>0){ var d=''; for(var t=0;t<=64;t++){ var xv=lo+sp*t/64; var pdf=Math.exp(-0.5*Math.pow((xv-mean)/sigma,2))/(sigma*Math.sqrt(2*Math.PI))*w; d+=(t?'L':'M')+SX(xv).toFixed(1)+' '+SY(pdf).toFixed(1)+' '; } g+='<path d="'+d+'" fill="none" stroke="#0d9488" stroke-width="2"/>'; }
        function vm(val,color,lbl){ if(val==null||!isFinite(val)||val<lo||val>hi)return ''; var px=SX(val); return '<line x1="'+px.toFixed(1)+'" y1="'+mt+'" x2="'+px.toFixed(1)+'" y2="'+(H-mb)+'" stroke="'+color+'" stroke-width="1.5" stroke-dasharray="4 3"/><text x="'+px.toFixed(1)+'" y="'+(mt-3)+'" text-anchor="middle" font-size="8" font-weight="700" fill="'+color+'">'+lbl+'</text>'; }
        g+=vm(lsl,'#dc2626','LSL')+vm(usl,'#dc2626','USL')+vm(nom,'#2563eb','Nom')+vm(mean,'#16a34a','x̄');
        return g+'</svg>';
      }
      function capaConvTable(r,seuil){
        var rows=''; var here= r&&r.niveau!=null ? Math.max(1,Math.min(6,Math.round(r.niveau))) : null;
        for(var k=1;k<=6;k++){ var cpk=(k/3); var dpmo=2*(1-_ncdf(k))*1e6; var yld=100-dpmo/1e4;
          var hl=(here===k); var bg=hl?'#0d9488':'transparent', co=hl?'white':'#374151';
          rows+='<tr style="background:'+bg+';color:'+co+';">'
            +'<td style="padding:6px 12px;font-weight:'+(hl?'800':'600')+';">'+k+' σ'+(hl?' &nbsp;◀ vous êtes ici':'')+'</td>'
            +'<td style="padding:6px 12px;text-align:center;">'+cpk.toFixed(2)+'</td>'
            +'<td style="padding:6px 12px;text-align:center;">'+(dpmo>=1?Math.round(dpmo).toLocaleString('fr-FR'):dpmo.toFixed(2))+'</td>'
            +'<td style="padding:6px 12px;text-align:center;">'+(yld>=99.999?yld.toFixed(5):yld.toFixed(3))+' %</td>'
            +'<td style="padding:6px 12px;text-align:center;">'+(k>=5?'Excellent':(k>=4?'Bon':(k>=3?'Moyen':'Insuffisant')))+'</td></tr>';
        }
        return '<table style="width:100%;border-collapse:collapse;font-size:.78rem;"><thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">'
          +'<th style="padding:7px 12px;text-align:left;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Niveau σ</th>'
          +'<th style="padding:7px 12px;text-align:center;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Cpk équiv.</th>'
          +'<th style="padding:7px 12px;text-align:center;font-size:.64rem;text-transform:uppercase;color:#6b7280;">DPMO</th>'
          +'<th style="padding:7px 12px;text-align:center;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Rendement</th>'
          +'<th style="padding:7px 12px;text-align:center;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Appréciation</th></tr></thead><tbody>'+rows+'</tbody></table>';
      }
      // ── Sélection ressource ──
      function capaFilterRes(){ var q=(document.getElementById('capa_res_search').value||'').toLowerCase(); document.querySelectorAll('#capa_res_list .capa-res-item').forEach(function(el){ var t=((el.getAttribute('data-nom')||'')+' '+(el.getAttribute('data-type')||'')).toLowerCase(); el.style.display=(!q||t.indexOf(q)>=0)?'':'none'; }); }
      function capaSelectRes(el){
        document.querySelectorAll('#capa_res_list .capa-res-item').forEach(function(x){ x.style.background=''; x.style.borderColor='#f1f5f9'; });
        el.style.background='#f0fdfa'; el.style.borderColor='#5eead4';
        var id=el.getAttribute('data-id');
        document.getElementById('capa_ws_empty').style.display='none';
        document.getElementById('capa_ws').style.display='flex';
        document.querySelectorAll('#capa_ws .proc-panel').forEach(function(p){ p.style.display='none'; });
        var panel=document.getElementById('proc-panel-'+id);
        if(panel) panel.style.display='flex';
        try{ sessionStorage.setItem('capaSel', id); }catch(e){}
        try{ document.getElementById('capa_ws').scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){}
      }
      function procTab(id,v){
        ['liste','carte','indiv'].forEach(function(t){ var pv=document.getElementById('pv-'+t+'-'+id); if(pv) pv.style.display=(t===v)?'':'none'; var bt=document.getElementById('pt-'+t+'-'+id); if(bt){ bt.style.background=(t===v)?'#0d9488':'transparent'; bt.style.color=(t===v)?'#fff':'#475569'; } });
      }
      function procSortOp(id,on){
        var tb=document.getElementById('proc-liste-tb-'+id); if(!tb) return;
        var rows=[].slice.call(tb.querySelectorAll('tr'));
        rows.sort(function(a,b){ if(on){ var d=(a.getAttribute('data-op')||'').localeCompare(b.getAttribute('data-op')||''); if(d!==0) return d; } return (+a.getAttribute('data-i'))-(+b.getAttribute('data-i')); });
        rows.forEach(function(r){ tb.appendChild(r); });
      }
      function procNouveau(machId){
        var sel=document.getElementById('cc_machine'); if(sel){ sel.value=machId; }
        ['cc_piece','cc_cote','cc_nom','cc_mes','cc_tmin','cc_tmax','cc_ctrl'].forEach(function(i){ var e=document.getElementById(i); if(e) e.value=''; });
        if(typeof ccMachineTol==='function'){ try{ ccMachineTol(); }catch(e){} }
        if(typeof ccOpenModal==='function'){ ccOpenModal(); }
      }
      (function(){ try{ var id=sessionStorage.getItem('capaSel'); if(!id) return; var items=document.querySelectorAll('#capa_res_list .capa-res-item'); for(var i=0;i<items.length;i++){ if(items[i].getAttribute('data-id')===id){ capaSelectRes(items[i]); break; } } }catch(e){} })();
      // ── Calcul + rendu ──
      function capaCompute(){
        if(!_capaSel) return;
        var xs=capaParse(), usl=capaNum('capa_usl'), lsl=capaNum('capa_lsl'), nom=capaNum('capa_nom'), seuil=capaNum('capa_seuil')||1.33, prod=capaNum('capa_prod')||0;
        document.getElementById('capa_ncount').textContent='('+xs.length+')';
        var kbox=document.getElementById('capa_kpis');
        if(xs.length<2){ kbox.innerHTML='<div class="card" style="padding:18px;color:#94a3b8;text-align:center;font-size:.82rem;">Saisissez au moins 2 mesures.</div>'; ['capa_chart_gauss','capa_chart_run','capa_chart_conv','capa_chart_rel','capa_conv_table'].forEach(function(id){var e=document.getElementById(id);if(e)e.innerHTML='';}); return; }
        var r=capaCore(xs,usl,lsl,seuil); var col=r.verdict==='capable'?'#15803d':(r.verdict==='limite'?'#854d0e':(r.verdict==='non_capable'?'#b91c1c':'#64748b'));
        var vlabel=r.verdict==='capable'?'CAPABLE':(r.verdict==='limite'?'LIMITE':(r.verdict==='non_capable'?'NON CAPABLE':'N/A'));
        var nomEff = nom!=null?nom : ((usl!=null&&lsl!=null)?(usl+lsl)/2:null);
        function k(lbl,val,sub,c){ return '<div style="background:white;border-radius:10px;padding:10px 12px;box-shadow:0 1px 3px rgba(0,0,0,.06);text-align:center;"><div style="font-size:.6rem;color:#94a3b8;font-weight:700;text-transform:uppercase;">'+lbl+'</div><div style="font-size:1.15rem;font-weight:800;color:'+(c||'#1e293b')+';">'+val+'</div>'+(sub?'<div style="font-size:.58rem;color:#94a3b8;">'+sub+'</div>':'')+'</div>'; }
        var ncCount= prod>0 ? Math.round(r.ncPct/100*prod) : null;
        kbox.innerHTML='<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:8px;">'
          + k('Cp',capaF(r.cp),'dispersion',col) + k('Cpk',capaF(r.cpk),'centrage',col) + k('Cm',capaF(r.cm),'réglage')
          + k('Moyenne',capaF(r.mean,3)) + k('σ (EC)',capaF(r.sigma,4)) + k('Cv',r.cv!=null?capaF(r.cv*100,2)+'%':'—')
          + '</div><div style="display:grid;grid-template-columns:repeat(4,1fr) 1.4fr;gap:8px;">'
          + k('DPMO',r.dpmo!=null?Math.round(r.dpmo).toLocaleString('fr-FR'):'—','défauts/M',r.dpmo!=null&&r.dpmo>66807?'#b91c1c':'#15803d')
          + k('Niveau σ',capaF(r.niveau,2),'court terme') + k('Rendement',capaF(r.conformePct,3)+'%') + k('Non conf.',ncCount!=null?ncCount.toLocaleString('fr-FR'):capaF(r.ncPct,3)+'%',ncCount!=null?'sur '+prod.toLocaleString('fr-FR'):'')
          + '<div style="background:'+col+'18;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;"><div style="font-size:.6rem;color:'+col+';font-weight:700;">VERDICT (seuil '+seuil+')</div><div style="font-size:1.2rem;font-weight:900;color:'+col+';">'+vlabel+'</div></div>'
          + '</div>';
        // charts
        document.getElementById('capa_chart_gauss').innerHTML=capaHistoChart(xs,r.mean,r.sigma,lsl,usl,nomEff);
        var runHl=[]; if(lsl!=null)runHl.push({y:lsl,color:'#dc2626',label:'LSL'}); if(usl!=null)runHl.push({y:usl,color:'#dc2626',label:'USL'}); runHl.push({y:r.mean,color:'#16a34a',label:'x̄'});
        document.getElementById('capa_chart_run').innerHTML=capaLineChart([{pts:xs.map(function(v,i){return [i+1,v];}),color:'#0d9488',width:1.2,dots:true,label:'mesure'}],runHl,{xlab:'n° mesure'});
        document.getElementById('capa_conv_table').innerHTML=capaConvTable(r,seuil);
        var run=capaRunning(xs,usl,lsl,seuil);
        document.getElementById('capa_chart_conv').innerHTML=capaLineChart([
          {pts:run.conv.map(function(o){return [o.k,o.cp];}),color:'#3b82f6',label:'Cp'},
          {pts:run.conv.map(function(o){return [o.k,o.cpk];}),color:'#0d9488',label:'Cpk'},
          {pts:run.conv.map(function(o){return [o.k,o.cm];}),color:'#a855f7',label:'Cm'}
        ],[{y:seuil,color:'#ef4444',label:'seuil '+seuil}],{xlab:'nombre de mesures'});
        document.getElementById('capa_chart_rel').innerHTML=capaLineChart([
          {pts:run.rel.map(function(o){return [o.k,o.err];}),color:'#f59e0b',width:2,label:'incertitude ±'}
        ],[],{xlab:'nombre de mesures',ymin:0});
      }
      function capaSave(){
        if(!_capaSel){ pushNotif('err','fa-exclamation-circle','Sélectionnez un process.'); return; }
        var xs=capaParse();
        if(xs.length<2){ pushNotif('err','fa-exclamation-circle','Au moins 2 mesures requises.'); return; }
        if(capaNum('capa_usl')==null&&capaNum('capa_lsl')==null){ pushNotif('err','fa-exclamation-circle','Au moins une limite (USL ou LSL).'); return; }
        var payload={ type:_capaSel.type, ressource_id:_capaSel.id, ressource_nom:_capaSel.nom, caracteristique:(document.getElementById('capa_carac').value||'').trim()||null, unite:(document.getElementById('capa_unite').value||'').trim()||null, usl:capaNum('capa_usl'), lsl:capaNum('capa_lsl'), nominale:capaNum('capa_nom'), cible:capaNum('capa_nom'), seuil:capaNum('capa_seuil'), production_totale:capaNum('capa_prod'), mesures:xs, operateur:(document.getElementById('capa_operateur').value||'').trim()||null };
        fetch('/api/qualite/capabilite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
          .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-save','Étude enregistrée pour '+_capaSel.nom+' — Cpk '+(j.etude&&j.etude.cpk!=null?Number(j.etude.cpk).toFixed(2):'—')+'.',5000); setTimeout(function(){ softReload(); },900); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
      }
    </script>
  </div>`
}

// ─── PANEL : Contrôle des ECME (équipements de contrôle, mesure et essai) ──
function panelEcme(ecmes: any[]) {
  const today = new Date().toISOString().slice(0, 10)
  const QI = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;'
  const QL = 'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'
  const withS = ecmes.map((e: any) => ({ e, s: ecmeStatutLive(e, today) }))
  const total = ecmes.length
  const nValide = withS.filter((x) => x.s.code === 'valide').length
  const nBientot = withS.filter((x) => x.s.code === 'bientot').length
  const nRetard = withS.filter((x) => x.s.code === 'retard').length
  const nReforme = withS.filter((x) => x.s.code === 'reforme').length
  const aFaire = withS.filter((x) => x.s.code === 'retard' || x.s.code === 'bientot')
    .sort((a, b) => String(a.e.date_prochain_etalonnage || '').localeCompare(String(b.e.date_prochain_etalonnage || '')))
  const nVerifs = ecmes.reduce((s: number, e: any) => s + ((e.verifications || []).length), 0)
  const rows = ecmes.length ? withS.map(({ e, s }) => {
    const nH = (e.verifications || []).length
    return `<tr data-statut="${s.code}" style="border-bottom:1px solid #f9fafb;">
      <td style="padding:9px 12px;font-family:monospace;font-size:.74rem;color:#6b7280;">${escX(e.code || '—')}</td>
      <td style="padding:9px 12px;"><span style="font-weight:700;color:#1e293b;">${escX(e.designation || '')}</span>${e.marque ? `<div style="font-size:.66rem;color:#94a3b8;">${escX(e.marque)}${e.numero_serie ? ' · ' + escX(e.numero_serie) : ''}</div>` : ''}</td>
      <td style="padding:9px 12px;font-size:.78rem;color:#374151;">${escX(ecmeTypeLabel(e.type))}${e.type ? `<div style="font-size:.64rem;color:#94a3b8;font-family:monospace;">${escX(e.type)}</div>` : ''}</td>
      <td style="padding:9px 12px;font-size:.76rem;color:#64748b;">${escX(e.localisation || '—')}</td>
      <td style="padding:9px 12px;text-align:center;font-size:.76rem;color:#64748b;">${e.periodicite_mois || 12} mois</td>
      <td style="padding:9px 12px;text-align:center;font-size:.74rem;color:#64748b;">${e.date_dernier_etalonnage || '—'}</td>
      <td style="padding:9px 12px;text-align:center;font-size:.74rem;font-weight:700;color:${s.color};">${e.date_prochain_etalonnage || '—'}${s.jours != null && s.code !== 'valide' ? `<div style="font-size:.6rem;font-weight:600;">${s.jours < 0 ? Math.abs(s.jours) + ' j de retard' : 'dans ' + s.jours + ' j'}</div>` : ''}</td>
      <td style="padding:9px 12px;text-align:center;"><span style="background:${s.bg};color:${s.color};border-radius:999px;padding:2px 9px;font-size:.64rem;font-weight:800;">${s.label}</span></td>
      <td style="padding:9px 12px;text-align:center;white-space:nowrap;">
        <button onclick="ecmeVerifOpen('${e.id}')" title="Nouvelle vérification (PV)" style="background:#ede9fe;color:#6d28d9;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.7rem;font-weight:700;margin-right:3px;"><i class="fas fa-ruler-combined"></i></button>
        <button onclick="ecmeFiche('${e.id}')" title="Fiche de vie${nH ? ' (' + nH + ')' : ''}" style="background:#e0f2fe;color:#0369a1;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.7rem;font-weight:700;margin-right:3px;position:relative;"><i class="fas fa-file-lines"></i>${nH ? `<span style="position:absolute;top:-6px;right:-6px;background:#0369a1;color:white;border-radius:999px;font-size:.55rem;padding:0 4px;font-weight:800;">${nH}</span>` : ''}</button>
        <button onclick="ecmeOpen('${e.id}')" title="Modifier l'identité" style="background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.7rem;margin-right:3px;"><i class="fas fa-pen"></i></button>
        <button onclick="ecmeDelete('${e.id}')" title="Supprimer" style="background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.7rem;"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`
  }).join('') : `<tr><td colspan="9" style="text-align:center;padding:30px;color:#9ca3af;">Aucun ECME enregistré. Cliquez sur « Nouvel ECME ».</td></tr>`
  const kpi = (val: any, lbl: string, col: string, sub = '') => `<div style="background:white;border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${col};text-align:center;"><div style="font-size:1.5rem;font-weight:800;color:${col};">${val}</div><div style="font-size:.7rem;color:#6b7280;font-weight:600;">${lbl}</div>${sub ? `<div style="font-size:.6rem;color:#94a3b8;">${sub}</div>` : ''}</div>`
  // Bandeau « contrôles à faire » (recalculé live)
  const aFaireHTML = aFaire.length ? `<div style="background:linear-gradient(135deg,#fff7ed,#fef2f2);border:1px solid #fecaca;border-radius:14px;padding:14px 18px;margin-bottom:16px;">
    <div style="font-weight:800;color:#b91c1c;font-size:.9rem;margin-bottom:8px;"><i class="fas fa-triangle-exclamation" style="margin-right:6px;"></i>Contrôles à faire — ${aFaire.length} ECME <span style="font-weight:500;color:#9a3412;font-size:.74rem;">(en retard ou échéance ≤ 30 jours, actualisé au ${today})</span></div>
    <div style="display:flex;flex-wrap:wrap;gap:7px;">
      ${aFaire.slice(0, 24).map(({ e, s }) => `<button onclick="ecmeVerifOpen('${e.id}')" title="Vérifier ${escX(e.designation || '')}" style="display:inline-flex;align-items:center;gap:6px;background:white;border:1px solid ${s.color}55;border-radius:999px;padding:4px 11px;cursor:pointer;font-size:.72rem;font-weight:700;color:#334155;"><span style="width:8px;height:8px;border-radius:50%;background:${s.color};"></span>${escX(e.code || e.designation || '')}<span style="color:${s.color};font-weight:800;">${s.jours != null && s.jours < 0 ? '+' + Math.abs(s.jours) + 'j' : s.jours + 'j'}</span></button>`).join('')}
      ${aFaire.length > 24 ? `<span style="align-self:center;font-size:.72rem;color:#9a3412;font-weight:700;">+ ${aFaire.length - 24} autres…</span>` : ''}
    </div>
  </div>` : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:12px 18px;margin-bottom:16px;font-size:.82rem;color:#15803d;font-weight:700;"><i class="fas fa-circle-check" style="margin-right:6px;"></i>Aucun contrôle en retard ni à échéance proche — tout le parc ECME est dans sa validité.</div>`
  // options type ECME pour les datalists (code → libellé)
  const ecmeTypeOpts = Object.keys(ECME_TYPES).map((c) => `<option value="${c}">${c} — ${escX(ECME_TYPES[c])}</option>`).join('')
  return `<div id="qual-panel-ecme" style="display:none;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
      <div style="font-weight:800;font-size:1.05rem;color:#111827;display:flex;align-items:center;gap:8px;"><i class="fas fa-ruler-combined" style="color:#7c3aed;"></i>Contrôle des ECME <span style="font-weight:500;color:#94a3b8;font-size:.78rem;">Équipements de Contrôle, Mesure &amp; Essai · contrôles périodiques &amp; fiche de vie</span></div>
      <button onclick="ecmeOpen('')" style="padding:8px 18px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Nouvel ECME</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px;">
      ${kpi(total, 'ECME au parc', '#7c3aed', nVerifs + ' vérif. tracées')}${kpi(nValide, 'Valides', '#16a34a')}${kpi(nBientot, 'À vérifier < 30 j', '#d97706')}${kpi(nRetard, 'En retard', '#dc2626')}${kpi(nReforme, 'Réformés', '#64748b')}
    </div>
    ${aFaireHTML}
    <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;">
      <button id="ecf-all" onclick="ecmeFilter('all',this)" class="ecf-pill active">Tous</button>
      <button id="ecf-retard" onclick="ecmeFilter('retard',this)" class="ecf-pill">En retard</button>
      <button id="ecf-bientot" onclick="ecmeFilter('bientot',this)" class="ecf-pill">À vérifier bientôt</button>
      <button id="ecf-valide" onclick="ecmeFilter('valide',this)" class="ecf-pill">Valides</button>
      <button id="ecf-reforme" onclick="ecmeFilter('reforme',this)" class="ecf-pill">Réformés</button>
    </div>
    <style>.ecf-pill{padding:6px 14px;border-radius:8px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:.78rem;font-weight:700;cursor:pointer;}.ecf-pill.active{background:linear-gradient(135deg,#6d28d9,#7c3aed);color:white;border-color:transparent;}.ecv-in{width:100%;border:1px solid #e2e8f0;border-radius:6px;padding:4px 5px;font-size:.72rem;text-align:center;box-sizing:border-box;}.ecv-cell{padding:3px 4px;}</style>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="ecme-table"><thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
        <th style="text-align:left;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Code</th><th style="text-align:left;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Désignation</th><th style="text-align:left;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Type</th><th style="text-align:left;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Localisation</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Périod.</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Dernière vérif.</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Prochaine</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Statut</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Actions</th>
      </tr></thead><tbody id="ecme-tbody">${rows}</tbody></table></div>
    </div>

    ${ecmeEditModalHTML(QI, QL, ecmeTypeOpts)}
    ${ecmeVerifModalHTML(QI, QL)}
    ${ecmeFicheModalHTML()}

    <script>
      window.ECME_DATA=${sjX(ecmes.map((e: any) => ({ id: e.id, code: e.code, designation: e.designation, type: e.type, marque: e.marque, modele: e.modele, numero_serie: e.numero_serie, num_commande: e.num_commande, localisation: e.localisation, activite: e.activite, responsable: e.responsable, etendue_mesure: e.etendue_mesure, resolution: e.resolution, incertitude: e.incertitude, periodicite_mois: e.periodicite_mois, date_dernier_etalonnage: e.date_dernier_etalonnage, date_prochain_etalonnage: e.date_prochain_etalonnage, organisme: e.organisme, certificat_ref: e.certificat_ref, date_mise_service: e.date_mise_service, reforme: e.reforme, notes: e.notes, verifications: (e.verifications || []).map((v: any) => ({ id: v.id, date_verif: v.date_verif, intervenant: v.intervenant, lieu: v.lieu, famille: v.famille, interventions: v.interventions, resultat: v.resultat, decision: v.decision, classe_globale: v.classe_globale, classe_justesse: v.classe_justesse, classe_fidelite: v.classe_fidelite, ej: v.ej, ef: v.ef, visa: v.visa, a_refaire_avant: v.a_refaire_avant, cale_etalon: v.cale_etalon, pv_ref: v.pv_ref, certificat_ref: v.certificat_ref, organisme: v.organisme, motif_nc: v.motif_nc, mesures: v.mesures })) }))).replace(/</g, '\\u003c')};
      ${ecmePanelScript()}
    </script>
  </div>`
}

// ── Modale d'identité ECME (fiche de vie — en-tête matériel) ──
function ecmeEditModalHTML(QI: string, QL: string, ecmeTypeOpts: string): string {
  return `<div id="ecmeModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:7000;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:18px;width:720px;max-width:95vw;max-height:92vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.3);">
        <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#7c3aed,#6d28d9);">
          <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-ruler-combined" style="margin-right:8px;"></i><span id="ecmeModalTitle">Nouvel ECME</span></div>
          <button onclick="document.getElementById('ecmeModal').style.display='none'" style="background:rgba(255,255,255,.2);border:none;color:white;border-radius:8px;padding:5px 11px;cursor:pointer;font-weight:700;">✕</button>
        </div>
        <div style="padding:20px 22px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <input type="hidden" id="ec_id"/>
          <div><label style="${QL}">Identification (code)</label><input id="ec_code" type="text" placeholder="JP 1" style="${QI}"/></div>
          <div style="grid-column:2/-1;"><label style="${QL}">Désignation *</label><input id="ec_designation" type="text" placeholder="Jauge de profondeur digitale" style="${QI}"/></div>
          <div><label style="${QL}">Type ECME</label><input id="ec_type" list="ecme-types" type="text" placeholder="JP" style="${QI}"/><datalist id="ecme-types">${ecmeTypeOpts}</datalist></div>
          <div><label style="${QL}">Marque</label><input id="ec_marque" type="text" placeholder="HOLEX" style="${QI}"/></div>
          <div><label style="${QL}">Modèle / réf.</label><input id="ec_modele" type="text" placeholder="41 87428 150" style="${QI}"/></div>
          <div><label style="${QL}">N° série</label><input id="ec_serie" type="text" style="${QI}"/></div>
          <div><label style="${QL}">N° commande achat</label><input id="ec_cmd" type="text" placeholder="67275" style="${QI}"/></div>
          <div><label style="${QL}">Emplacement / affectation</label><input id="ec_loc" type="text" placeholder="SEEM / Métrologie" style="${QI}"/></div>
          <div><label style="${QL}">Activité</label><select id="ec_act" style="${QI}"><option value="">—</option><option>Seem</option><option>Semrac</option><option value="both">Seem &amp; Semrac</option></select></div>
          <div><label style="${QL}">Responsable</label><input id="ec_resp" type="text" placeholder="Dimitri LEFEL" style="${QI}"/></div>
          <div><label style="${QL}">Capacité / étendue</label><input id="ec_etendue" type="text" placeholder="0-150 mm" style="${QI}"/></div>
          <div><label style="${QL}">Précision / résolution</label><input id="ec_resolution" type="text" placeholder="±0,03 mm" style="${QI}"/></div>
          <div><label style="${QL}">Incertitude</label><input id="ec_incert" type="text" style="${QI}"/></div>
          <div><label style="${QL}">Périodicité (mois)</label><input id="ec_period" type="number" value="12" style="${QI}"/></div>
          <div><label style="${QL}">Dernière vérification</label><input id="ec_dernier" type="date" style="${QI}"/></div>
          <div><label style="${QL}">Mise en service</label><input id="ec_mes" type="date" style="${QI}"/></div>
          <div><label style="${QL}">Organisme (si externe)</label><input id="ec_organisme" type="text" placeholder="Labo / interne" style="${QI}"/></div>
          <div><label style="${QL}">Réf. certificat</label><input id="ec_cert" type="text" style="${QI}"/></div>
          <div style="display:flex;align-items:flex-end;gap:6px;padding-bottom:6px;"><label style="display:flex;align-items:center;gap:6px;font-size:.74rem;color:#374151;font-weight:600;cursor:pointer;"><input id="ec_reforme" type="checkbox" style="width:16px;height:16px;"/>Réformé (hors service définitif)</label></div>
          <div style="grid-column:1/-1;"><label style="${QL}">Notes</label><input id="ec_notes" type="text" style="${QI}"/></div>
        </div>
        <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
          <button onclick="document.getElementById('ecmeModal').style.display='none'" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:600;cursor:pointer;">Annuler</button>
          <button onclick="ecmeSave()" style="padding:9px 18px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;"><i class="fas fa-save" style="margin-right:5px;"></i>Enregistrer</button>
        </div>
      </div>
    </div>`
}

// ── Modale PV de vérification (grille métrologique famille-consciente) ──
function ecmeVerifModalHTML(QI: string, QL: string): string {
  const resOpts = ECME_RESULTATS.map((r) => `<option value="${r[0]}">${r[0]} — ${r[1]}</option>`).join('')
  return `<div id="ecvModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:7010;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:18px;width:860px;max-width:96vw;max-height:94vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.3);">
        <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#6d28d9,#4c1d95);">
          <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-clipboard-check" style="margin-right:8px;"></i>PV de vérification — <span id="ecv_titre"></span></div>
          <button onclick="document.getElementById('ecvModal').style.display='none'" style="background:rgba(255,255,255,.2);border:none;color:white;border-radius:8px;padding:5px 11px;cursor:pointer;font-weight:700;">✕</button>
        </div>
        <div style="padding:18px 22px;">
          <input type="hidden" id="ecv_ecme_id"/><input type="hidden" id="ecv_famille"/><input type="hidden" id="ecv_ej"/><input type="hidden" id="ecv_ef"/>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:14px;">
            <div><label style="${QL}">Date</label><input id="ecv_date" type="date" style="${QI}"/></div>
            <div><label style="${QL}">Intervenant</label><input id="ecv_intervenant" type="text" placeholder="BEGUEL Louis" style="${QI}"/></div>
            <div><label style="${QL}">Lieu</label><select id="ecv_lieu" onchange="ecvToggleLieu()" style="${QI}"><option value="interne">Interne</option><option value="externe">Externe (labo)</option></select></div>
            <div><label style="${QL}">Étalon utilisé (cale n°)</label><input id="ecv_cale" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Réf. PV</label><input id="ecv_pvref" type="text" placeholder="H2025089" style="${QI}"/></div>
            <div><label style="${QL}">Indice</label><input id="ecv_indice" type="text" style="${QI}"/></div>
            <div style="grid-column:3/-1;"><label style="${QL}">Interventions réalisées</label><input id="ecv_interventions" type="text" placeholder="Vérification, nettoyage…" style="${QI}"/></div>
          </div>
          <div id="ecv_grid_wrap" style="margin-bottom:14px;"></div>
          <div id="ecv_ext_wrap" style="display:none;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
            <div style="font-weight:700;font-size:.78rem;color:#475569;margin-bottom:8px;">Étalonnage externe / vérification simple</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;">
              <div><label style="${QL}">Organisme</label><input id="ecv_organisme" type="text" placeholder="Laboratoire" style="${QI}"/></div>
              <div><label style="${QL}">Réf. certificat</label><input id="ecv_certif" type="text" style="${QI}"/></div>
            </div>
          </div>
          <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:12px 14px;margin-bottom:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:11px;align-items:end;">
            <div><div style="${QL}">Erreur justesse (Ej)</div><div id="ecv_disp_ej" style="font-size:1.05rem;font-weight:800;color:#6d28d9;">—</div></div>
            <div><div style="${QL}">Erreur fidélité (Ef)</div><div id="ecv_disp_ef" style="font-size:1.05rem;font-weight:800;color:#6d28d9;">—</div></div>
            <div><label style="${QL}">Classe justesse</label><input id="ecv_cl_just" type="text" placeholder="0" style="${QI}"/></div>
            <div><label style="${QL}">Classe fidélité</label><input id="ecv_cl_fid" type="text" placeholder="0" style="${QI}"/></div>
            <div style="grid-column:1/-1;font-size:.64rem;color:#7c3aed;"><i class="fas fa-circle-info" style="margin-right:4px;"></i>Ej et Ef sont calculés automatiquement. La classe se lit sur le tableau des écarts et se saisit ici.</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:11px;align-items:end;">
            <div><label style="${QL}">Résultat</label><select id="ecv_resultat" style="${QI}">${resOpts}</select></div>
            <div><label style="${QL}">Décision</label><select id="ecv_decision" onchange="ecvToggleDecision()" style="${QI}"><option value="conforme">Conforme</option><option value="non_conforme">Non conforme</option></select></div>
            <div><label style="${QL}">Classe retenue</label><input id="ecv_cl_glob" type="text" placeholder="0" style="${QI}"/></div>
            <div><label style="${QL}">Visa responsable</label><input id="ecv_visa" type="text" placeholder="AA" style="${QI}"/></div>
            <div id="ecv_motif_wrap" style="grid-column:1/-1;display:none;"><label style="${QL}">Motif de non-conformité</label><input id="ecv_motif" type="text" style="${QI}"/></div>
            <div><label style="${QL}">À refaire avant</label><input id="ecv_arefaire" type="date" style="${QI}"/><div style="font-size:.6rem;color:#94a3b8;margin-top:2px;">auto = date + périodicité</div></div>
          </div>
        </div>
        <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;gap:8px;align-items:center;">
          <div style="font-size:.68rem;color:#94a3b8;">La vérification alimente la fiche de vie et recalcule la prochaine échéance.</div>
          <div style="display:flex;gap:8px;">
            <button onclick="document.getElementById('ecvModal').style.display='none'" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:600;cursor:pointer;">Annuler</button>
            <button onclick="ecmeVerifSave()" style="padding:9px 18px;background:linear-gradient(135deg,#6d28d9,#4c1d95);color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;"><i class="fas fa-save" style="margin-right:5px;"></i>Enregistrer le PV</button>
          </div>
        </div>
      </div>
    </div>`
}

// ── Modale fiche de vie (identité + journal d'opérations) ──
function ecmeFicheModalHTML(): string {
  return `<div id="ecfModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:7005;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:18px;width:900px;max-width:96vw;max-height:94vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.3);">
        <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#0369a1,#075985);">
          <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-file-lines" style="margin-right:8px;"></i>Fiche de vie — <span id="ecf_titre"></span></div>
          <div style="display:flex;gap:8px;">
            <button id="ecf_pdf" style="background:rgba(255,255,255,.2);border:none;color:white;border-radius:8px;padding:5px 12px;cursor:pointer;font-weight:700;font-size:.76rem;"><i class="fas fa-print" style="margin-right:5px;"></i>PDF</button>
            <button onclick="document.getElementById('ecfModal').style.display='none'" style="background:rgba(255,255,255,.2);border:none;color:white;border-radius:8px;padding:5px 11px;cursor:pointer;font-weight:700;">✕</button>
          </div>
        </div>
        <div id="ecf_body" style="padding:20px 22px;"></div>
      </div>
    </div>`
}

// ── JS client du panneau ECME (identité + PV de vérification + fiche de vie) ──
function ecmePanelScript(): string {
  return `
    function _ecV(id){ var e=document.getElementById(id); return e?String(e.value).trim():''; }
    function _ecS(id,val){ var e=document.getElementById(id); if(e) e.value=(val==null?'':val); }
    function _ecT(id,txt){ var e=document.getElementById(id); if(e) e.textContent=txt; }
    function _ecNum(x){ if(x==null||x==='')return null; var n=parseFloat(String(x).replace(',','.')); return isFinite(n)?n:null; }
    function _ecMoy(a){ return a.length ? a.reduce(function(s,x){return s+x;},0)/a.length : null; }
    function _ecEt(a){ return a.length ? Math.max.apply(null,a)-Math.min.apply(null,a) : null; }
    function _ecR(n){ return n==null?null:Math.round(n*10000)/10000; }
    function _ecAddMonths(iso,m){ if(!iso)return ''; var p=iso.slice(0,10).split('-'); var y=+p[0],mo=+p[1],d=+p[2]; var t=mo-1+(+m||12); y+=Math.floor(t/12); mo=(t%12)+1; var last=new Date(Date.UTC(y,mo,0)).getUTCDate(); d=Math.min(d,last); return y+'-'+('0'+mo).slice(-2)+'-'+('0'+d).slice(-2); }
    function _ecFind(id){ return (window.ECME_DATA||[]).find(function(x){return String(x.id)===String(id);})||null; }
    var ECV_BECS=['Grands becs exterieurs','Petits becs exterieurs','Extremites grands becs','Extremites petits becs','Becs interieurs'];

    function ecmeFilter(f){ ['all','retard','bientot','valide','reforme'].forEach(function(x){var b=document.getElementById('ecf-'+x); if(b)b.classList.toggle('active',x===f);}); document.querySelectorAll('#ecme-tbody tr[data-statut]').forEach(function(tr){ var s=tr.dataset.statut; tr.style.display=(f==='all'||s===f)?'':'none'; }); }

    function ecmeOpen(id){
      var o = id ? (_ecFind(id)||{}) : {};
      _ecS('ec_id',o.id||''); _ecS('ec_code',o.code); _ecS('ec_designation',o.designation); _ecS('ec_type',o.type); _ecS('ec_marque',o.marque); _ecS('ec_modele',o.modele); _ecS('ec_serie',o.numero_serie); _ecS('ec_cmd',o.num_commande); _ecS('ec_loc',o.localisation); _ecS('ec_act',o.activite||''); _ecS('ec_resp',o.responsable); _ecS('ec_etendue',o.etendue_mesure); _ecS('ec_resolution',o.resolution); _ecS('ec_incert',o.incertitude); _ecS('ec_period',o.periodicite_mois!=null?o.periodicite_mois:12); _ecS('ec_dernier',o.date_dernier_etalonnage); _ecS('ec_mes',o.date_mise_service); _ecS('ec_organisme',o.organisme); _ecS('ec_cert',o.certificat_ref); _ecS('ec_notes',o.notes);
      var rf=document.getElementById('ec_reforme'); if(rf) rf.checked=!!o.reforme;
      document.getElementById('ecmeModalTitle').textContent = id ? ('Modifier - '+(o.designation||'')) : 'Nouvel ECME';
      document.getElementById('ecmeModal').style.display='flex';
    }
    function ecmeSave(){
      var desig=_ecV('ec_designation'); if(!desig){ pushNotif('err','fa-exclamation-circle','Designation requise.'); return; }
      var id=_ecV('ec_id');
      var payload={ code:_ecV('ec_code'), designation:desig, type:_ecV('ec_type'), marque:_ecV('ec_marque'), modele:_ecV('ec_modele'), numero_serie:_ecV('ec_serie'), num_commande:_ecV('ec_cmd'), localisation:_ecV('ec_loc'), activite:_ecV('ec_act'), responsable:_ecV('ec_resp'), etendue_mesure:_ecV('ec_etendue'), resolution:_ecV('ec_resolution'), incertitude:_ecV('ec_incert'), periodicite_mois:_ecV('ec_period')||12, date_dernier_etalonnage:_ecV('ec_dernier')||null, date_mise_service:_ecV('ec_mes')||null, organisme:_ecV('ec_organisme'), certificat_ref:_ecV('ec_cert'), reforme:document.getElementById('ec_reforme').checked, notes:_ecV('ec_notes') };
      var url = id ? '/api/qualite/ecme/'+encodeURIComponent(id) : '/api/qualite/ecme';
      fetch(url,{method:id?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Echec.'); return; } pushNotif('ok','fa-save','ECME enregistre.',3000); setTimeout(function(){ softReload(); },700); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); });
    }
    async function ecmeDelete(id){ if(!await appConfirm('Supprimer cet ECME et son historique ?')) return; fetch('/api/qualite/ecme/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Echec.'); return; } pushNotif('ok','fa-trash','ECME supprime.',2500); setTimeout(function(){ softReload(); },600); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); }); }

    function ecvToggleLieu(){ var ext=document.getElementById('ecv_lieu').value==='externe'; document.getElementById('ecv_ext_wrap').style.display=ext?'block':'none'; document.getElementById('ecv_grid_wrap').style.display=ext?'none':'block'; }
    function ecvToggleDecision(){ document.getElementById('ecv_motif_wrap').style.display=(document.getElementById('ecv_decision').value==='non_conforme')?'block':'none'; }

    function ecvBuildGrid(fam){
      fam=(fam||'').toUpperCase(); var h='';
      if(fam==='PC'){
        h+='<div style="font-weight:700;font-size:.8rem;color:#475569;margin-bottom:8px;">Mesures sur les becs (pied a coulisse)</div>';
        h+='<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.72rem;"><thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:5px 8px;">Section</th><th style="padding:5px;">Vc (cale)</th><th style="padding:5px;">Cr 1</th><th style="padding:5px;">Cr 2</th><th style="padding:5px;">Cr 3</th><th style="padding:5px;">Vcr (moy.)</th><th style="padding:5px;">Ej</th></tr></thead><tbody>';
        for(var i=0;i<ECV_BECS.length;i++){ h+='<tr><td style="padding:4px 8px;color:#475569;">'+ECV_BECS[i]+'</td><td class="ecv-cell"><input class="ecv-in" id="ecvb_'+i+'_vc" oninput="ecvCompute()"/></td>'; for(var c=0;c<3;c++){ h+='<td class="ecv-cell"><input class="ecv-in" id="ecvb_'+i+'_c'+c+'" oninput="ecvCompute()"/></td>'; } h+='<td style="text-align:center;font-weight:700;color:#334155;"><span id="ecvb_'+i+'_vcr">-</span></td><td style="text-align:center;font-weight:800;"><span id="ecvb_'+i+'_ej">-</span></td></tr>'; }
        h+='</tbody></table></div>'; return h;
      }
      h+='<div style="font-weight:700;font-size:.8rem;color:#475569;margin-bottom:8px;">Mesure de justesse - '+(fam||'instrument')+' (cotes nominales &amp; 5 releves par point)</div>';
      h+='<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.72rem;"><thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:5px 8px;"></th>';
      for(var p=0;p<4;p++){ h+='<th style="padding:5px;">Point '+(p+1)+'</th>'; }
      h+='</tr></thead><tbody><tr><td style="padding:4px 8px;color:#475569;font-weight:700;">Cote nominale (Cn)</td>';
      for(var p=0;p<4;p++){ h+='<td class="ecv-cell"><input class="ecv-in" id="ecvj_'+p+'_cn" oninput="ecvCompute()"/></td>'; }
      h+='</tr>';
      for(var m=0;m<5;m++){ h+='<tr><td style="padding:4px 8px;color:#64748b;">Mesure '+(m+1)+'</td>'; for(var p=0;p<4;p++){ h+='<td class="ecv-cell"><input class="ecv-in" id="ecvj_'+p+'_m'+m+'" oninput="ecvCompute()"/></td>'; } h+='</tr>'; }
      h+='<tr style="background:#faf5ff;"><td style="padding:4px 8px;font-weight:700;color:#6d28d9;">Moyenne (MJ)</td>';
      for(var p=0;p<4;p++){ h+='<td style="text-align:center;font-weight:700;color:#6d28d9;"><span id="ecvj_'+p+'_mj">-</span></td>'; }
      h+='</tr><tr style="background:#faf5ff;"><td style="padding:4px 8px;font-weight:700;color:#6d28d9;">Ej = Cn - MJ</td>';
      for(var p=0;p<4;p++){ h+='<td style="text-align:center;font-weight:800;color:#6d28d9;"><span id="ecvj_'+p+'_ej">-</span></td>'; }
      h+='</tr></tbody></table></div><div style="font-size:.64rem;color:#94a3b8;margin-top:4px;">Ef (fidelite) = etendue des releves au point de plus fort ecart de justesse.</div>';
      return h;
    }
    function ecvCompute(){
      var fam=(_ecV('ecv_famille')||'').toUpperCase(); var gEj=null,gEf=null;
      if(fam==='PC'){
        for(var i=0;i<ECV_BECS.length;i++){ var vc=_ecNum(_ecV('ecvb_'+i+'_vc')); var cr=[]; for(var c=0;c<3;c++){ var x=_ecNum(_ecV('ecvb_'+i+'_c'+c)); if(x!=null)cr.push(x); } var vcr=_ecMoy(cr),ej=(vcr!=null&&vc!=null)?vcr-vc:null,et=_ecEt(cr); _ecT('ecvb_'+i+'_vcr',vcr==null?'-':_ecR(vcr)); _ecT('ecvb_'+i+'_ej',ej==null?'-':_ecR(ej)); if(ej!=null&&(gEj==null||Math.abs(ej)>Math.abs(gEj)))gEj=ej; if(et!=null&&(gEf==null||et>gEf))gEf=et; }
      } else {
        var worstEt=null,worstAbs=-1;
        for(var p=0;p<4;p++){ var cn=_ecNum(_ecV('ecvj_'+p+'_cn')); var mm=[]; for(var m=0;m<5;m++){ var x=_ecNum(_ecV('ecvj_'+p+'_m'+m)); if(x!=null)mm.push(x); } var mj=_ecMoy(mm),ej=(mj!=null&&cn!=null)?cn-mj:null; _ecT('ecvj_'+p+'_mj',mj==null?'-':_ecR(mj)); _ecT('ecvj_'+p+'_ej',ej==null?'-':_ecR(ej)); if(ej!=null&&(gEj==null||Math.abs(ej)>Math.abs(gEj)))gEj=ej; if(ej!=null&&Math.abs(ej)>worstAbs){ worstAbs=Math.abs(ej); worstEt=_ecEt(mm); } }
        gEf=worstEt;
      }
      _ecT('ecv_disp_ej',gEj==null?'-':_ecR(gEj)); _ecT('ecv_disp_ef',gEf==null?'-':_ecR(gEf));
      document.getElementById('ecv_ej').value=(gEj==null?'':_ecR(gEj)); document.getElementById('ecv_ef').value=(gEf==null?'':_ecR(gEf));
    }
    function ecvBuildMesures(fam){
      fam=(fam||'').toUpperCase();
      if(fam==='PC'){ var becs=[]; for(var i=0;i<ECV_BECS.length;i++){ var vc=_ecNum(_ecV('ecvb_'+i+'_vc')); var cr=[]; for(var c=0;c<3;c++){ var x=_ecNum(_ecV('ecvb_'+i+'_c'+c)); if(x!=null)cr.push(x); } if(vc!=null||cr.length)becs.push({libelle:ECV_BECS[i],vc:vc,releves:cr}); } return {becs:becs}; }
      var pts=[]; for(var p=0;p<4;p++){ var cn=_ecNum(_ecV('ecvj_'+p+'_cn')); var mm=[]; for(var m=0;m<5;m++){ var x=_ecNum(_ecV('ecvj_'+p+'_m'+m)); if(x!=null)mm.push(x); } if(cn!=null||mm.length)pts.push({cn:cn,releves:mm}); } return {justesse:pts};
    }
    function ecmeVerifOpen(id){
      var o=_ecFind(id); if(!o){ pushNotif('err','fa-ban','ECME introuvable.'); return; }
      document.getElementById('ecv_ecme_id').value=o.id; var fam=(o.type||'').toUpperCase(); document.getElementById('ecv_famille').value=fam;
      _ecT('ecv_titre',(o.code?o.code+' - ':'')+(o.designation||''));
      var today=new Date().toISOString().slice(0,10);
      _ecS('ecv_date',today); _ecS('ecv_intervenant',''); _ecS('ecv_cale',''); _ecS('ecv_pvref',''); _ecS('ecv_indice',''); _ecS('ecv_interventions','');
      _ecS('ecv_organisme',o.organisme||''); _ecS('ecv_certif',o.certificat_ref||'');
      _ecS('ecv_cl_just',''); _ecS('ecv_cl_fid',''); _ecS('ecv_cl_glob',''); _ecS('ecv_visa',''); _ecS('ecv_motif','');
      document.getElementById('ecv_resultat').value='B'; document.getElementById('ecv_decision').value='conforme'; document.getElementById('ecv_lieu').value='interne';
      _ecS('ecv_arefaire',_ecAddMonths(today,o.periodicite_mois||12));
      var hasGrid=(fam==='PC'||fam==='JP'||fam==='MI'||fam==='CO'||fam==='FO');
      document.getElementById('ecv_grid_wrap').innerHTML = hasGrid ? ecvBuildGrid(fam) : '<div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:12px 14px;font-size:.76rem;color:#64748b;">Famille sans grille de mesures detaillee - renseigner le resultat, la decision et le visa (et le certificat si etalonnage externe).</div>';
      document.getElementById('ecv_ej').value=''; document.getElementById('ecv_ef').value=''; _ecT('ecv_disp_ej','-'); _ecT('ecv_disp_ef','-');
      ecvToggleLieu(); ecvToggleDecision(); document.getElementById('ecvModal').style.display='flex';
    }
    function ecmeVerifSave(){
      var id=_ecV('ecv_ecme_id'); if(!id)return;
      var fam=_ecV('ecv_famille'); var lieu=document.getElementById('ecv_lieu').value;
      var mesures=(lieu==='interne')?ecvBuildMesures(fam):null;
      var payload={ date_verif:_ecV('ecv_date')||null, intervenant:_ecV('ecv_intervenant'), lieu:lieu, famille:fam, interventions:_ecV('ecv_interventions'), mesures:mesures, ej:(_ecV('ecv_ej')!==''?parseFloat(_ecV('ecv_ej')):null), ef:(_ecV('ecv_ef')!==''?parseFloat(_ecV('ecv_ef')):null), classe_justesse:_ecV('ecv_cl_just'), classe_fidelite:_ecV('ecv_cl_fid'), classe_globale:_ecV('ecv_cl_glob'), resultat:document.getElementById('ecv_resultat').value, decision:document.getElementById('ecv_decision').value, motif_nc:_ecV('ecv_motif'), visa:_ecV('ecv_visa'), a_refaire_avant:_ecV('ecv_arefaire')||null, cale_etalon:_ecV('ecv_cale'), pv_ref:_ecV('ecv_pvref'), indice:_ecV('ecv_indice'), certificat_ref:_ecV('ecv_certif'), organisme:_ecV('ecv_organisme') };
      fetch('/api/qualite/ecme/'+encodeURIComponent(id)+'/verification',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Echec.'); return; } pushNotif('ok','fa-clipboard-check','PV enregistre - prochaine echeance '+((j.ecme&&j.ecme.date_prochain_etalonnage)||'')+'.',4500); setTimeout(function(){ softReload(); },800); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); });
    }
    function ecmeVerifFromFiche(){ document.getElementById('ecfModal').style.display='none'; if(window._ecfCur) ecmeVerifOpen(window._ecfCur); }
    function ecmeFiche(id){
      var o=_ecFind(id); if(!o)return; window._ecfCur=o.id;
      _ecT('ecf_titre',(o.code?o.code+' - ':'')+(o.designation||''));
      var pdf=document.getElementById('ecf_pdf'); pdf.onclick=function(){ window.open('/api/qualite/ecme/'+encodeURIComponent(o.id)+'/fiche-vie.pdf','_blank'); };
      var esc=function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
      var idl=function(l,v){ return '<div><div style="font-size:.6rem;text-transform:uppercase;color:#94a3b8;font-weight:700;">'+l+'</div><div style="font-size:.82rem;color:#1e293b;font-weight:600;">'+(v||'-')+'</div></div>'; };
      var h='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;margin-bottom:16px;">';
      h+=idl('Identification',esc(o.code))+idl('Designation',esc(o.designation))+idl('Type',esc(o.type))+idl('Emplacement',esc(o.localisation));
      h+=idl('Marque',esc(o.marque))+idl('Modele',esc(o.modele))+idl('N. serie',esc(o.numero_serie))+idl('N. commande',esc(o.num_commande));
      h+=idl('Responsable',esc(o.responsable))+idl('Capacite',esc(o.etendue_mesure))+idl('Precision',esc(o.resolution))+idl('Periodicite',(o.periodicite_mois||12)+' mois');
      h+=idl('Mise en service',esc(o.date_mise_service))+idl('Derniere verif.',esc(o.date_dernier_etalonnage))+idl('Prochaine',esc(o.date_prochain_etalonnage))+idl('Reforme',o.reforme?'Oui':'Non');
      h+='</div><div style="font-weight:800;color:#0369a1;font-size:.9rem;margin-bottom:8px;"><i class="fas fa-clock-rotate-left" style="margin-right:6px;"></i>Journal des operations ('+((o.verifications||[]).length)+')</div>';
      var vs=(o.verifications||[]);
      if(!vs.length){ h+='<div style="color:#94a3b8;font-size:.82rem;padding:14px;background:#f8fafc;border-radius:10px;">Aucune verification enregistree. Cliquez sur Nouvelle verification pour saisir le premier PV.</div>'; }
      else{
        h+='<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.74rem;"><thead><tr style="background:#f1f5f9;"><th style="text-align:left;padding:6px 9px;">Date</th><th style="text-align:left;padding:6px 9px;">Intervenant</th><th style="padding:6px 9px;">Lieu</th><th style="text-align:left;padding:6px 9px;">Interventions</th><th style="padding:6px 9px;">Ej</th><th style="padding:6px 9px;">Ef</th><th style="padding:6px 9px;">Res.</th><th style="padding:6px 9px;">Decision / classe</th><th style="padding:6px 9px;">Visa</th><th style="padding:6px 9px;">A refaire</th></tr></thead><tbody>';
        for(var i=0;i<vs.length;i++){ var v=vs[i]; var dec=(v.decision==='non_conforme')?'<span style="color:#b91c1c;font-weight:800;">NC</span>':'<span style="color:#15803d;font-weight:800;">C</span>'; if(v.classe_globale)dec+=' / '+esc(v.classe_globale); h+='<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:5px 9px;">'+esc(v.date_verif)+'</td><td style="padding:5px 9px;">'+esc(v.intervenant)+'</td><td style="padding:5px 9px;text-align:center;">'+(v.lieu==='externe'?'Ext':'Int')+'</td><td style="padding:5px 9px;">'+esc(v.interventions)+(v.certificat_ref?' - cert. '+esc(v.certificat_ref):'')+'</td><td style="padding:5px 9px;text-align:center;">'+(v.ej==null?'-':v.ej)+'</td><td style="padding:5px 9px;text-align:center;">'+(v.ef==null?'-':v.ef)+'</td><td style="padding:5px 9px;text-align:center;">'+esc(v.resultat)+'</td><td style="padding:5px 9px;text-align:center;">'+dec+(v.motif_nc?'<div style="font-size:.62rem;color:#b91c1c;">'+esc(v.motif_nc)+'</div>':'')+'</td><td style="padding:5px 9px;text-align:center;">'+esc(v.visa)+'</td><td style="padding:5px 9px;text-align:center;">'+esc(v.a_refaire_avant)+'</td></tr>'; }
        h+='</tbody></table></div>';
      }
      h+='<div style="margin-top:14px;text-align:right;"><button onclick="ecmeVerifFromFiche()" style="padding:8px 16px;background:linear-gradient(135deg,#6d28d9,#4c1d95);color:white;border:none;border-radius:9px;font-weight:700;cursor:pointer;font-size:.8rem;"><i class="fas fa-plus" style="margin-right:5px;"></i>Nouvelle verification</button></div>';
      document.getElementById('ecf_body').innerHTML=h; document.getElementById('ecfModal').style.display='flex';
    }
  `
}

// ─── PANEL : Dérogations (registre PMQ3-D4 + formulaire PMQ3-D3 + export PDF) ──
function panelDerogations(derogs: any[]) {
  const QI = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;'
  const QL = 'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'
  const total = derogs.length
  const enCours = derogs.filter((d: any) => (d.statut || 'en_cours') === 'en_cours').length
  const accord = derogs.filter((d: any) => d.decision === 'AT' || d.decision === 'AL').length
  const refus = derogs.filter((d: any) => d.decision === 'R').length
  const decBadge = (d: string) => {
    if (d === 'AT') return badge('#dcfce7', '#15803d', 'Accord total')
    if (d === 'AL') return badge('#fef9c3', '#854d0e', 'Accord limité')
    if (d === 'R') return badge('#fee2e2', '#b91c1c', 'Refus')
    return `<span style="font-size:.72rem;color:#cbd5e1;">en attente</span>`
  }
  const stBadge = (s: string) => {
    if (s === 'solde' || s === 'S') return badge('#dcfce7', '#166534', 'Soldée')
    if (s === 'annule' || s === 'AN') return badge('#f1f5f9', '#64748b', 'Annulée')
    if (s === 'envoye') return badge('#dbeafe', '#1d4ed8', 'Envoyée (attente)')
    return badge('#fef3c7', '#92400e', 'En cours')
  }
  const rows = derogs.length === 0
    ? `<tr><td colspan="8" style="text-align:center;padding:30px;color:#9ca3af;">Aucune dérogation enregistrée — cliquez sur « Nouvelle dérogation ».</td></tr>`
    : derogs.map((d: any) => `
      <tr data-statut="${escX(d.statut || 'en_cours')}" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
        ${TD(`<div style="font-weight:800;color:#ea580c;">${escX(d.id || d.numero || '')}</div><div style="font-size:.68rem;color:#9ca3af;">${escX(d.date_demande || '')}</div>`)}
        ${TD(`<div style="font-weight:700;color:#374151;">${escX(d.client || '—')}</div><div style="font-size:.68rem;color:#9ca3af;">${escX(d.contact || '')}</div>`)}
        ${TD(`<span style="font-size:.74rem;color:#374151;">${escX(d.designation || '—')}</span>`)}
        ${TD(`<span style="font-size:.72rem;font-family:monospace;color:#6b7280;">${escX(d.notre_ref || d.ref_client || '—')}</span>`)}
        ${TDC(`<span style="font-size:.72rem;font-weight:700;color:#475569;">${escX(d.type_demande || '—')}</span>`)}
        ${TDC(decBadge(d.decision))}
        ${TDC(stBadge(d.statut || 'en_cours'))}
        ${TDC(`<div style="display:flex;gap:6px;justify-content:center;align-items:center;">
          ${d.decision === 'R' && d.decision_client ? `<span title="Traité : ${escX(d.decision_client)}" style="font-size:.64rem;color:#15803d;font-weight:700;white-space:nowrap;">✓ ${escX(d.decision_client)}</span>` : (d.decision === 'R' && (d.statut || '') !== 'solde' ? `<button onclick="derogTraiterRefus('${escX(d.id)}')" title="Traiter le refus (avoir / commande P)" style="padding:5px 10px;background:#ffedd5;color:#c2410c;border:none;border-radius:7px;font-size:.7rem;cursor:pointer;font-weight:700;"><i class="fas fa-gavel"></i></button>` : '')}
          <button onclick="derogPdf('${escX(d.id)}')" title="Exporter PDF" style="padding:5px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:7px;font-size:.7rem;cursor:pointer;"><i class="fas fa-file-pdf"></i></button>
          <button onclick="derogOpen('${escX(d.id)}')" title="Modifier" style="padding:5px 10px;background:#f1f5f9;color:#475569;border:none;border-radius:7px;font-size:.7rem;cursor:pointer;"><i class="fas fa-pen"></i></button>
        </div>`)}
      </tr>`).join('')
  return `
  <div id="qual-panel-derogations" style="display:none;">
    ${panelHdr('Dérogations', 'fa-file-signature', '#ea580c', total)}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;">
      ${kpiCard('fa-file-signature', '#ea580c', total, 'Dérogations', 'Registre PMQ3-D4')}
      ${kpiCard('fa-hourglass-half', '#f59e0b', enCours, 'En cours', '')}
      ${kpiCard('fa-check-circle', '#22c55e', accord, 'Accordées', 'AT + AL')}
      ${kpiCard('fa-times-circle', '#ef4444', refus, 'Refusées', '')}
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px;">
      <input type="text" placeholder="Rechercher…" oninput="qualFilter('qual-tbl-derog',this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:220px;"/>
      <button onclick="derogOpen('')" style="padding:8px 18px;background:linear-gradient(135deg,#ea580c,#c2410c);color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Nouvelle dérogation</button>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;" id="qual-tbl-derog">
          <thead><tr style="background:#fafafa;border-bottom:2px solid #f1f5f9;">
            ${TH('N° / Date')}${TH('Client / Contact')}${TH('Désignation')}${TH('Réf.')}${THC('Type')}${THC('Décision')}${THC('Statut')}${THC('Actions')}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>

    <!-- Modal formulaire dérogation (PMQ3-D3) -->
    <div id="derogModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1100;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;width:92%;max-width:720px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <div style="padding:18px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">
          <div style="font-weight:800;color:#111827;" id="derogModalTitle"><i class="fas fa-file-signature" style="color:#ea580c;margin-right:8px;"></i>Nouvelle demande de dérogation</div>
          <span style="font-size:.68rem;color:#9ca3af;">PMQ3-D3</span>
        </div>
        <div style="padding:20px 22px;">
          <input type="hidden" id="dg_id"/>
          <input type="hidden" id="dg_nc_ref"/>
          <div id="dg_nc_banner" style="display:none;background:#fef2f2;border:1.5px solid #fecaca;border-radius:9px;padding:8px 12px;margin-bottom:12px;font-size:.74rem;color:#b91c1c;font-weight:700;"><i class="fas fa-link" style="margin-right:6px;"></i>Dérogation liée à la NC <span id="dg_nc_label"></span></div>
          <div style="font-weight:800;color:#ea580c;font-size:.7rem;text-transform:uppercase;margin-bottom:8px;">Émetteur / Issuer</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
            <div><label style="${QL}">Date / Date</label><input id="dg_date" type="date" style="${QI}"/></div>
            <div><label style="${QL}">Émise par / Issued by</label><input id="dg_emetteur" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Service</label><input id="dg_service" type="text" value="Qualité" style="${QI}"/></div>
            <div><label style="${QL}">Tél. / Phone</label><input id="dg_tel_em" type="text" style="${QI}"/></div>
            <div style="grid-column:span 2;"><label style="${QL}">Email</label><input id="dg_email_em" type="text" value="qualite@seem-semrac.com" style="${QI}"/></div>
          </div>
          <div style="font-weight:800;color:#ea580c;font-size:.7rem;text-transform:uppercase;margin-bottom:8px;">Destinataire / Recipient</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
            <div><label style="${QL}">Société / Company</label><input id="dg_client" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Nom / Name</label><input id="dg_contact" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Tél. / Phone</label><input id="dg_tel" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Email</label><input id="dg_email" type="text" style="${QI}"/></div>
          </div>
          <div style="font-weight:800;color:#ea580c;font-size:.7rem;text-transform:uppercase;margin-bottom:8px;">Références</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
            <div style="grid-column:span 3;"><label style="${QL}">Désignation</label><input id="dg_designation" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Votre Cde / Your order</label><input id="dg_cmd" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Votre Réf. / Your réf.</label><input id="dg_refcli" type="text" style="${QI}"/></div>
            <div><label style="${QL}">AR</label><input id="dg_ar" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Notre Réf. / Our réf.</label><input id="dg_notreref" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Quantité</label><input id="dg_qte" type="number" style="${QI}"/></div>
            <div><label style="${QL}">Type de demande</label><select id="dg_type" style="${QI}"><option value="">—</option><option value="AC">AC</option><option value="AE">AE</option><option value="AR">AR</option></select></div>
          </div>
          <div style="margin-bottom:14px;"><label style="${QL}">Descriptif de la demande / Description</label><textarea id="dg_descriptif" rows="4" style="${QI}resize:vertical;"></textarea></div>
          <div style="font-weight:800;color:#ea580c;font-size:.7rem;text-transform:uppercase;margin-bottom:8px;">Décision client / Customer decision</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
            <div><label style="${QL}">Décision</label><select id="dg_decision" style="${QI}"><option value="">— en attente —</option><option value="AT">AT — Accord total</option><option value="AL">AL — Accord limité</option><option value="R">R — Refus</option></select></div>
            <div><label style="${QL}">Statut</label><select id="dg_statut" style="${QI}"><option value="en_cours">En cours (brouillon)</option><option value="envoye">Envoyée au client (attente réponse)</option><option value="solde">Soldée</option><option value="annule">Annulée</option></select></div>
            <div style="grid-column:span 2;"><label style="${QL}">Commentaire</label><textarea id="dg_commentaire" rows="2" style="${QI}resize:vertical;"></textarea></div>
          </div>
        </div>
        <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
          <button onclick="document.getElementById('derogModal').style.display='none'" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:600;cursor:pointer;">Annuler</button>
          <button onclick="derogPdf('')" style="padding:9px 18px;background:#fee2e2;color:#b91c1c;border:none;border-radius:9px;font-weight:700;cursor:pointer;"><i class="fas fa-file-pdf" style="margin-right:5px;"></i>Exporter PDF</button>
          <button onclick="derogSave()" style="padding:9px 18px;background:linear-gradient(135deg,#ea580c,#c2410c);color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;"><i class="fas fa-save" style="margin-right:5px;"></i>Enregistrer</button>
        </div>
      </div>
    </div>

    <!-- Modal « Traiter le refus » (refus → avoir / commande P, façon retour client) -->
    <div id="derogRefusModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1150;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;width:92%;max-width:540px;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#111827;"><i class="fas fa-gavel" style="color:#c2410c;margin-right:8px;"></i>Traiter le refus — dérogation <span id="dr_title"></span></div>
        <div style="padding:18px 20px;">
          <input type="hidden" id="dr_id"/>
          <div style="font-size:.72rem;color:#6b7280;margin-bottom:10px;">Le client a refusé la dérogation. Choisissez la suite commerciale : un <strong>avoir</strong> (geste financier) ou une <strong>commande prioritaire</strong> (refaire les pièces), sinon un refus sec.</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div style="grid-column:span 2;"><label style="${QL}">N° d'affaire (base de numérotation AV / CMDP)</label><input id="dr_affaire" type="text" oninput="drRenum()" style="${QI}"/></div>
            <div style="grid-column:span 2;"><label style="${QL}">Réf. / désignation</label><input id="dr_design" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Nb de pièces</label><input id="dr_qte" type="number" value="1" oninput="drRenum()" style="${QI}"/></div>
            <div><label style="${QL}">Prix de vente unit. (€) → avoir</label><input id="dr_pv" type="number" step="0.01" oninput="drRenum()" style="${QI}"/></div>
            <div style="grid-column:span 2;"><label style="${QL}">Coût de revient unit. (€) → commande P</label><input id="dr_pr" type="number" step="0.01" style="${QI}"/></div>
          </div>
          <div id="dr_preview" style="margin-top:10px;font-size:.72rem;color:#6b7280;"></div>
        </div>
        <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;">
          <button onclick="document.getElementById('derogRefusModal').style.display='none'" style="padding:9px 14px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:600;cursor:pointer;">Annuler</button>
          <button onclick="drSubmit('refuse')" style="padding:9px 14px;background:#fee2e2;color:#b91c1c;border:none;border-radius:9px;font-weight:700;cursor:pointer;">Refus sec</button>
          <button onclick="drSubmit('avoir')" style="padding:9px 14px;background:#ede9fe;color:#6d28d9;border:none;border-radius:9px;font-weight:700;cursor:pointer;"><i class="fas fa-undo-alt" style="margin-right:5px;"></i>Faire un avoir</button>
          <button onclick="drSubmit('commande_p')" style="padding:9px 14px;background:linear-gradient(135deg,#ea580c,#c2410c);color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;"><i class="fas fa-bolt" style="margin-right:5px;"></i>Commande P</button>
        </div>
      </div>
    </div>

    <script>
      window.DEROG_DATA=${sjX(derogs.map((d: any) => ({ id: d.id, numero: d.numero, date_demande: d.date_demande, emetteur: d.emetteur, service: d.service, tel_em: d.tel_em, email_em: d.email_em, client: d.client, contact: d.contact, tel: d.tel, email: d.email, designation: d.designation, cmd_client: d.cmd_client, ref_client: d.ref_client, ar: d.ar, notre_ref: d.notre_ref, quantite: d.quantite, type_demande: d.type_demande, descriptif: d.descriptif, decision: d.decision, statut: d.statut, commentaire: d.commentaire, nc_ref: d.nc_ref })))};
      function drRenum(){ var aff=derogVal('dr_affaire'); var m=String(aff).match(/(\\d{4})[-/](\\d{1,5})\\s*$/); var yr=m?m[1]:String(new Date().getFullYear()); var xx=m?(''+m[2]).padStart(3,'0'):((String(aff).replace(/\\D/g,'')||'X').padStart(3,'0')); var nb=parseFloat(derogVal('dr_qte'))||0; var pv=parseFloat(derogVal('dr_pv'))||0; var el=document.getElementById('dr_preview'); if(el) el.innerHTML='Avoir <b>AV-'+yr+'-'+xx+'</b> ('+(pv*nb).toFixed(2)+' \\u20ac) &nbsp;\\u00b7&nbsp; Commande <b>CMDP-'+yr+'-'+xx+'</b>'; }
      function derogTraiterRefus(id){ var o=(window.DEROG_DATA.find(function(x){return String(x.id)===String(id);})||{}); function set(f,v){var e=document.getElementById(f); if(e) e.value=(v==null?'':v);} set('dr_id',o.id||''); set('dr_affaire',o.notre_ref||o.cmd_client||''); set('dr_design',o.designation||o.ref_client||''); set('dr_qte',o.quantite||1); set('dr_pv',''); set('dr_pr',''); document.getElementById('dr_title').textContent=o.id||''; drRenum(); document.getElementById('derogRefusModal').style.display='flex'; }
      function drSubmit(decision){ var id=derogVal('dr_id'); if(!id) return; var p={ decision:decision, num_affaire:derogVal('dr_affaire'), ref:derogVal('dr_design'), designation:derogVal('dr_design'), nb:parseFloat(derogVal('dr_qte'))||1, prix_vente:parseFloat(derogVal('dr_pv'))||0, cout_revient:parseFloat(derogVal('dr_pr'))||0 };
        fetch('/api/qualite/derogation/'+encodeURIComponent(id)+'/traiter-refus',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'\\u00c9chec.'); return; } pushNotif('ok','fa-check',(decision==='avoir'?'Avoir '+j.num+' cr\\u00e9\\u00e9':decision==='commande_p'?'Commande P '+j.num+' cr\\u00e9\\u00e9e':'Refus enregistr\\u00e9')+' (voir Commercial \\u203a Avoirs & Commandes P).',5000); document.getElementById('derogRefusModal').style.display='none'; setTimeout(function(){softReload();},900); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur r\\u00e9seau.'); }); }
      var BRAND_BLOCK=${sjX(brandBlockHTML())}; var BRAND_BLEU=${sjX(BRAND.bleu)}; var BRAND_VIOLET=${sjX(BRAND.violet)};
      function derogNcBanner(ref){ var b=document.getElementById('dg_nc_banner'), l=document.getElementById('dg_nc_label'); if(b&&l){ if(ref){ l.textContent=ref; b.style.display='block'; } else { b.style.display='none'; } } }
      function derogVal(f){var e=document.getElementById(f);return e?e.value:'';}
      function derogOpen(id){
        function set(f,v){var e=document.getElementById(f); if(e) e.value=(v==null?'':v);}
        var o = id ? (window.DEROG_DATA.find(function(x){return String(x.id)===String(id);})||{}) : {};
        set('dg_id',o.id||''); set('dg_date',o.date_demande||new Date().toISOString().slice(0,10)); set('dg_emetteur',o.emetteur); set('dg_service',o.service||'Qualité'); set('dg_tel_em',o.tel_em); set('dg_email_em',o.email_em||'qualite@seem-semrac.com');
        set('dg_client',o.client); set('dg_contact',o.contact); set('dg_tel',o.tel); set('dg_email',o.email);
        set('dg_designation',o.designation); set('dg_cmd',o.cmd_client); set('dg_refcli',o.ref_client); set('dg_ar',o.ar); set('dg_notreref',o.notre_ref); set('dg_qte',o.quantite); set('dg_type',o.type_demande||'');
        set('dg_descriptif',o.descriptif); set('dg_decision',o.decision||''); set('dg_statut',o.statut||'en_cours'); set('dg_commentaire',o.commentaire);
        set('dg_nc_ref',o.nc_ref||''); derogNcBanner(o.nc_ref||'');
        document.getElementById('derogModalTitle').innerHTML = '<i class="fas fa-file-signature" style="color:#ea580c;margin-right:8px;"></i>'+(id?('Dérogation '+(o.id||'')):'Nouvelle demande de dérogation');
        document.getElementById('derogModal').style.display='flex';
      }
      // Crée une dérogation pré-remplie depuis une NC (lien nc_ref).
      function qualDerogFromNC(ncId){
        var nc=(window.NC_LINK||[]).find(function(x){return String(x.id)===String(ncId);})||{};
        derogOpen('');
        function set(f,v){var e=document.getElementById(f); if(e) e.value=(v==null?'':v);}
        set('dg_client',nc.client_nom); set('dg_designation',nc.designation||nc.operation); set('dg_refcli',nc.ref_article); set('dg_notreref',nc.lot_ref); set('dg_descriptif',nc.description); set('dg_type','AC');
        set('dg_nc_ref',nc.id||''); derogNcBanner(nc.id||'');
        document.getElementById('derogModalTitle').innerHTML='<i class="fas fa-file-signature" style="color:#ea580c;margin-right:8px;"></i>Dérogation depuis NC '+(nc.id||'');
        document.getElementById('derogModal').style.display='flex';
      }
      function derogPayload(){
        return { id:derogVal('dg_id')||null, date_demande:derogVal('dg_date')||null, emetteur:derogVal('dg_emetteur'), service:derogVal('dg_service'), tel_em:derogVal('dg_tel_em'), email_em:derogVal('dg_email_em'), client:derogVal('dg_client'), contact:derogVal('dg_contact'), tel:derogVal('dg_tel'), email:derogVal('dg_email'), designation:derogVal('dg_designation'), cmd_client:derogVal('dg_cmd'), ref_client:derogVal('dg_refcli'), ar:derogVal('dg_ar'), notre_ref:derogVal('dg_notreref'), quantite:derogVal('dg_qte')||null, type_demande:derogVal('dg_type'), descriptif:derogVal('dg_descriptif'), decision:derogVal('dg_decision'), statut:derogVal('dg_statut')||'en_cours', commentaire:derogVal('dg_commentaire'), nc_ref:derogVal('dg_nc_ref')||null };
      }
      function derogSave(){
        var p=derogPayload();
        if(!p.client && !p.designation){ pushNotif('err','fa-exclamation-circle','Renseignez au moins le client ou la désignation.'); return; }
        var id=derogVal('dg_id');
        var url = id ? '/api/qualite/derogation/'+encodeURIComponent(id) : '/api/qualite/derogation';
        fetch(url,{method:id?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})
          .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec — la table derogations existe-t-elle ? (lancez qhse_schema.sql)'); return; } pushNotif('ok','fa-save','Dérogation enregistrée.',3000); setTimeout(function(){ softReload(); },800); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
      }
      function derogPdf(id){
        var o = id ? (window.DEROG_DATA.find(function(x){return String(x.id)===String(id);})||{}) : derogPayload();
        function e(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
        var DEC={AT:'Accord total / Total agreement',AL:'Accord limité / Limited agreement',R:'Refus / Rejected'};
        function ligne(l1,v){ return '<tr><td class="lbl">'+l1+'</td><td class="val">'+e(v||'')+'</td></tr>'; }
        var html=''
          +'<html><head><meta charset="utf-8"><title>Dérogation '+e(o.id||'')+'</title><style>'
          +'@page{size:A4;margin:14mm;} body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:12px;}'
          +'.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid '+BRAND_VIOLET+';padding-bottom:8px;margin-bottom:14px;}'
          +'.hd h1{font-size:16px;margin:0;color:#c2410c;} .hd .meta{text-align:right;font-size:11px;color:#555;}'
          +'h2{font-size:11px;text-transform:uppercase;color:#c2410c;border-bottom:1px solid #f0c9a8;margin:14px 0 6px;padding-bottom:2px;}'
          +'table{width:100%;border-collapse:collapse;} td{padding:3px 6px;vertical-align:top;} td.lbl{width:34%;color:#555;font-weight:bold;}'
          +'.desc{border:1px solid #ddd;border-radius:5px;padding:8px;min-height:90px;white-space:pre-wrap;}'
          +'.dec{border:2px solid #ea580c;border-radius:6px;padding:8px;margin-top:6px;font-weight:bold;}'
          +'.sign{display:flex;justify-content:space-between;margin-top:34px;font-size:11px;color:#555;} .sign div{border-top:1px solid #999;width:42%;padding-top:4px;text-align:center;}'
          +'*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
          +'</style></head><body>'
          +'<div class="hd">'+BRAND_BLOCK+'<div class="meta"><div style="font-size:15px;font-weight:bold;color:'+BRAND_BLEU+';">DEMANDE DE DÉROGATION</div><div style="font-size:10px;color:#888;">REQUEST FOR DEVIATION</div>Réf. PMQ3-D3 · N° '+e(o.id||o.numero||'')+'<br>'+e(o.date_demande||'')+'</div></div>'
          +'<h2>Émetteur / Issuer</h2><table>'+ligne('Émise par / Issued by',o.emetteur)+ligne('Service',o.service)+ligne('Tél. / Phone',o.tel_em)+ligne('Email',o.email_em)+'</table>'
          +'<h2>Destinataire / Recipient</h2><table>'+ligne('Société / Company',o.client)+ligne('Nom / Name',o.contact)+ligne('Tél. / Phone',o.tel)+ligne('Email',o.email)+'</table>'
          +'<h2>Références</h2><table>'+ligne('Désignation',o.designation)+ligne('Votre Cde / Your order',o.cmd_client)+ligne('Votre Réf. / Your réf.',o.ref_client)+ligne('AR',o.ar)+ligne('Notre Réf. / Our réf.',o.notre_ref)+ligne('Quantité',o.quantite)+ligne('Type de demande',o.type_demande)+'</table>'
          +'<h2>Descriptif de la demande / Description</h2><div class="desc">'+e(o.descriptif||'')+'</div>'
          +'<h2>Décision client / Customer decision</h2><div class="dec">'+e(DEC[o.decision]||'En attente / Pending')+'</div>'
          +(o.commentaire?'<table>'+ligne('Commentaire',o.commentaire)+'</table>':'')
          +'<div class="sign"><div>Émetteur / Issuer</div><div>Client / Customer</div></div>'
          +'<\\/body><\\/html>';
        var w=window.open('','_blank'); if(!w){ pushNotif('err','fa-ban','Autorisez les pop-ups pour exporter le PDF.'); return; }
        w.document.open(); w.document.write(html); w.document.close();
        setTimeout(function(){ w.focus(); w.print(); }, 350);
      }
    </script>
  </div>`
}

// ─── PANEL : Plan de contrôle EN9100 / ISO9001 (plan d'inspection) ──
function panelPlanControle(plans: any[], procs: any[] = [], ecmes: any[] = []) {
  const QI = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;'
  const QL = 'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'
  const opOpts = Array.from(new Set(procs.map((p: any) => String(p.nom || p.libelle || p.process || p.operation || '').trim()).filter(Boolean))).sort()
  const ecmeOpts = Array.from(new Set(ecmes.map((e: any) => String(e.designation || e.code || '').trim()).filter(Boolean))).sort()
  const opDatalist = `<datalist id="pc_op_list">${opOpts.map(o => `<option value="${escX(o)}"></option>`).join('')}</datalist>`
  const ecmeDatalist = `<datalist id="pc_ecme_list">${ecmeOpts.map(o => `<option value="${escX(o)}"></option>`).join('')}</datalist>`
  const total = plans.length
  const ops = new Set(plans.map((p: any) => (p.operation || '').trim()).filter(Boolean)).size
  const avecEcme = plans.filter((p: any) => p.ecme_outils && String(p.ecme_outils).trim()).length
  const destr = plans.filter((p: any) => /destructif/i.test(String(p.type_controle || '')) && !/non/i.test(String(p.type_controle || ''))).length
  const tcBadge = (v: string) => /non destructif/i.test(v) ? badge('#dcfce7', '#15803d', 'Non destructif') : (/destructif/i.test(v) ? badge('#fef9c3', '#92400e', 'Destructif') : (v ? escX(v) : '—'))
  const cell = (v: any, w = 180) => `<div style="max-width:${w}px;font-size:.74rem;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escX(v ?? '')}">${escX(v ?? '—')}</div>`
  const rows = plans.length === 0
    ? `<tr><td colspan="11" style="text-align:center;padding:30px;color:#9ca3af;">Aucune ligne de plan de contrôle — cliquez sur « Nouvelle ligne » ou importez le brouillon EN9100.</td></tr>`
    : plans.map((p: any) => `
      <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
        ${TDC(`<span style="font-weight:800;color:#0891b2;">${escX(p.num_ligne ?? '')}</span>`)}
        ${TD(`<div style="font-weight:700;color:#374151;font-size:.78rem;">${escX(p.operation || '—')}</div><div style="font-size:.66rem;color:#9ca3af;">${escX(p.classification_client || '')}</div>`)}
        ${TD(cell(p.parametres, 200))}
        ${TD(cell(p.ecme_outils, 150))}
        ${TD(cell(p.frequence_echantillonnage, 150))}
        ${TD(cell(p.critere_acceptation, 120))}
        ${TD(`<span style="font-size:.74rem;color:#374151;">${escX(p.responsable || '—')}</span>`)}
        ${TDC(tcBadge(String(p.type_controle || '')))}
        ${TD(cell(p.plan_reaction, 200))}
        ${TDC(`<div style="display:flex;gap:6px;justify-content:center;">
          <button onclick="pcOpen('${escX(p.id)}')" title="Modifier" style="padding:5px 9px;background:#f1f5f9;color:#475569;border:none;border-radius:7px;font-size:.7rem;cursor:pointer;"><i class="fas fa-pen"></i></button>
          <button onclick="pcDelete('${escX(p.id)}')" title="Supprimer" style="padding:5px 9px;background:#fee2e2;color:#b91c1c;border:none;border-radius:7px;font-size:.7rem;cursor:pointer;"><i class="fas fa-trash"></i></button>
        </div>`)}
      </tr>`).join('')
  return `
  <div id="qual-panel-plan-controle" style="display:none;">
    ${panelHdr('Plan de contrôle EN 9100 / ISO 9001', 'fa-list-check', '#0891b2', total)}
    <div style="background:#ecfeff;border:1px solid #cffafe;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:.78rem;color:#155e75;">
      <i class="fas fa-circle-info" style="margin-right:6px;"></i><strong>Plan de contrôle (PRP1-D9)</strong> — plan d'inspection EN 9100/AS9100 : pour chaque opération (réception → contrôle final), les paramètres à contrôler, l'ECME/outil, la fréquence & l'échantillonnage, le critère d'acceptation (règle <strong>C=0</strong>), le responsable, le type de contrôle et le plan de réaction en cas d'écart.
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;">
      ${kpiCard('fa-list-check', '#0891b2', total, 'Lignes de contrôle', '')}
      ${kpiCard('fa-gears', '#0d9488', ops, 'Opérations couvertes', '')}
      ${kpiCard('fa-ruler-combined', '#7c3aed', avecEcme, 'Avec ECME/outil', '')}
      ${kpiCard('fa-vial', '#f59e0b', destr, 'Contrôles destructifs', '')}
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px;">
      <input type="text" placeholder="Rechercher…" oninput="qualFilter('qual-tbl-pc',this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:220px;"/>
      <button onclick="pcPdf()" style="padding:8px 14px;background:#fff;border:1.5px solid #cffafe;color:#0e7490;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-file-pdf"></i>Exporter PDF</button>
      <button onclick="pcOpen('')" style="padding:8px 18px;background:linear-gradient(135deg,#0891b2,#0e7490);color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Nouvelle ligne</button>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;min-width:1100px;" id="qual-tbl-pc">
          <thead><tr style="background:#fafafa;border-bottom:2px solid #f1f5f9;">
            ${THC('N°')}${TH('Opération / Classification')}${TH('Paramètres')}${TH('ECME / Outils')}${TH('Fréquence & échantillon')}${TH('Critère')}${TH('Responsable')}${THC('Type')}${TH('Plan de réaction')}${THC('Actions')}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>

    <div id="pcModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1100;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;width:92%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <div style="padding:18px 22px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#111827;" id="pcModalTitle"><i class="fas fa-list-check" style="color:#0891b2;margin-right:8px;"></i>Nouvelle ligne de contrôle</div>
        <div style="padding:20px 22px;">
          <input type="hidden" id="pc_id"/>
          <div style="display:grid;grid-template-columns:90px 1fr 1fr;gap:10px;margin-bottom:12px;">
            <div><label style="${QL}">N° ligne</label><input id="pc_num" type="number" style="${QI}"/></div>
            <div><label style="${QL}">Opération</label><input id="pc_op" type="text" list="pc_op_list" style="${QI}"/>${opDatalist}</div>
            <div><label style="${QL}">Classification client</label><input id="pc_class" type="text" style="${QI}"/></div>
          </div>
          <div style="margin-bottom:12px;"><label style="${QL}">Paramètres à contrôler</label><textarea id="pc_param" rows="2" style="${QI}resize:vertical;"></textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div><label style="${QL}">ECME / Outils</label><input id="pc_ecme" type="text" list="pc_ecme_list" style="${QI}"/>${ecmeDatalist}</div>
            <div><label style="${QL}">Fréquence & échantillonnage</label><input id="pc_freq" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Critère d'acceptation</label><input id="pc_crit" type="text" placeholder="C=0 (Zéro défaut)" style="${QI}"/></div>
            <div><label style="${QL}">Responsable</label><input id="pc_resp" type="text" style="${QI}"/></div>
            <div><label style="${QL}">Type de contrôle</label><input id="pc_type" type="text" placeholder="Non destructif / Destructif" style="${QI}"/></div>
            <div><label style="${QL}">Activité</label><select id="pc_act" style="${QI}"><option value="">—</option><option>Seem</option><option>Semrac</option><option value="both">Seem &amp; Semrac</option></select></div>
          </div>
          <div style="margin-bottom:6px;"><label style="${QL}">Plan de réaction (en cas d'écart)</label><textarea id="pc_reac" rows="2" style="${QI}resize:vertical;"></textarea></div>
        </div>
        <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
          <button onclick="document.getElementById('pcModal').style.display='none'" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:9px;font-weight:600;cursor:pointer;">Annuler</button>
          <button onclick="pcSave()" style="padding:9px 18px;background:linear-gradient(135deg,#0891b2,#0e7490);color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;"><i class="fas fa-save" style="margin-right:5px;"></i>Enregistrer</button>
        </div>
      </div>
    </div>

    <script>
      window.PC_DATA=${sjX(plans.map((p: any) => ({ id: p.id, num_ligne: p.num_ligne, operation: p.operation, classification_client: p.classification_client, parametres: p.parametres, ecme_outils: p.ecme_outils, frequence_echantillonnage: p.frequence_echantillonnage, critere_acceptation: p.critere_acceptation, responsable: p.responsable, type_controle: p.type_controle, plan_reaction: p.plan_reaction, activite: p.activite })))};
      var BRAND_BLOCK=${sjX(brandBlockHTML())}; var BRAND_BLEU=${sjX(BRAND.bleu)}; var BRAND_VIOLET=${sjX(BRAND.violet)};
      function pcVal(f){var e=document.getElementById(f);return e?e.value:'';}
      function pcOpen(id){
        function set(f,v){var e=document.getElementById(f); if(e) e.value=(v==null?'':v);}
        var o = id ? (window.PC_DATA.find(function(x){return String(x.id)===String(id);})||{}) : {};
        set('pc_id',o.id||''); set('pc_num',o.num_ligne); set('pc_op',o.operation); set('pc_class',o.classification_client); set('pc_param',o.parametres); set('pc_ecme',o.ecme_outils); set('pc_freq',o.frequence_echantillonnage); set('pc_crit',o.critere_acceptation); set('pc_resp',o.responsable); set('pc_type',o.type_controle); set('pc_act',o.activite||''); set('pc_reac',o.plan_reaction);
        document.getElementById('pcModalTitle').innerHTML='<i class="fas fa-list-check" style="color:#0891b2;margin-right:8px;"></i>'+(id?('Ligne '+(o.num_ligne||'')):'Nouvelle ligne de contrôle');
        document.getElementById('pcModal').style.display='flex';
      }
      function pcSave(){
        var p={ num_ligne:pcVal('pc_num')||null, operation:pcVal('pc_op'), classification_client:pcVal('pc_class'), parametres:pcVal('pc_param'), ecme_outils:pcVal('pc_ecme'), frequence_echantillonnage:pcVal('pc_freq'), critere_acceptation:pcVal('pc_crit'), responsable:pcVal('pc_resp'), type_controle:pcVal('pc_type'), activite:pcVal('pc_act'), plan_reaction:pcVal('pc_reac') };
        if(!p.operation){ pushNotif('err','fa-exclamation-circle','Opération requise.'); return; }
        var id=pcVal('pc_id');
        var url = id ? '/api/qualite/plan-controle/'+encodeURIComponent(id) : '/api/qualite/plan-controle';
        fetch(url,{method:id?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})
          .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-save','Ligne enregistrée.',3000); setTimeout(function(){ softReload(); },700); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
      }
      async function pcDelete(id){ if(!await appConfirm('Supprimer cette ligne de contrôle ?')) return; fetch('/api/qualite/plan-controle/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-trash','Ligne supprimée.',2500); setTimeout(function(){ softReload(); },600); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); }); }
      function pcPdf(){
        function e(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
        var rows=(window.PC_DATA||[]).slice().sort(function(a,b){return (a.num_ligne||0)-(b.num_ligne||0);});
        if(!rows.length){ pushNotif('err','fa-exclamation-circle','Aucune ligne à exporter.'); return; }
        var body=rows.map(function(p){return '<tr>'
          +'<td class="c">'+e(p.num_ligne)+'</td>'
          +'<td>'+e(p.operation)+(p.classification_client?'<div class="sub">'+e(p.classification_client)+'</div>':'')+'</td>'
          +'<td>'+e(p.parametres)+'</td><td>'+e(p.ecme_outils)+'</td><td>'+e(p.frequence_echantillonnage)+'</td>'
          +'<td class="c">'+e(p.critere_acceptation)+'</td><td>'+e(p.responsable)+'</td><td>'+e(p.type_controle)+'</td><td>'+e(p.plan_reaction)+'</td></tr>';}).join('');
        var html='<html><head><meta charset="utf-8"><title>Plan de contrôle EN 9100</title><style>'
          +'@page{size:A4 landscape;margin:9mm;} body{font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#111;}'
          +'.hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid '+BRAND_VIOLET+';padding-bottom:6px;margin-bottom:10px;}'
          +'h1{font-size:15px;color:#0e7490;margin:0;} .meta{font-size:10px;color:#555;text-align:right;}'
          +'table{width:100%;border-collapse:collapse;} th,td{border:1px solid #bbb;padding:3px 4px;vertical-align:top;text-align:left;}'
          +'th{background:#eef1f8;color:'+BRAND_BLEU+';font-size:8px;text-transform:uppercase;} td.c{text-align:center;font-weight:bold;} .sub{color:#777;font-size:7.5px;}'
          +'*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
          +'</style></head><body>'
          +'<div class="hd">'+BRAND_BLOCK+'<div class="meta"><div style="font-size:14px;font-weight:bold;color:'+BRAND_BLEU+';">Plan de Contrôle EN 9100 / ISO 9001</div>Réf. PRP1-D9 · Règle d\\'acceptation : C=0 (zéro défaut)<br>'+rows.length+' lignes de contrôle</div></div>'
          +'<table><thead><tr><th>N°</th><th>Opération / Classification</th><th>Paramètres à contrôler</th><th>ECME / Outils</th><th>Fréquence &amp; échantillonnage</th><th>Critère</th><th>Responsable</th><th>Type de contrôle</th><th>Plan de réaction</th></tr></thead><tbody>'+body+'</tbody></table>'
          +'<\\/body><\\/html>';
        var w=window.open('','_blank'); if(!w){ pushNotif('err','fa-ban','Autorisez les pop-ups pour exporter le PDF.'); return; }
        w.document.open(); w.document.write(html); w.document.close();
        setTimeout(function(){ w.focus(); w.print(); }, 350);
      }
    </script>
  </div>`
}

export const pageServiceQualite = (
  dbNCs?:      NonConformite[],
  dbPVs?:      PVControle[],
  dbQs?:       Quarantaine[],
  dbAudits?:   Audit[],
  dbPeriss?:   ProduitPerissable[],
  _dbOps?:     Operateur[],
  dbR8D?:      any[],
  dbMachines?: any[],
  dbProcess?:  any[],
  dbCapabilites?: any[],
  dbEcme?:     any[],
  dbControles?: any[],
  dbDerogations?: any[],
  dbPlansControle?: any[],
  dbMouvementsPer?: any[],
  dbFournisseurs?: any[],
  dbValidations?: any[],
  dbLiberation?: { aLiberer: any[]; liberes: any[] },
  dbAuditProgramme?: any[],
  dbAuditGrilles?: any[],
  dbAuditQuestions?: any[],
  dbAuditAuto?: Record<string, any>,
  dbFai?: any[],
) => {
  const VD_MAP = buildValDirMap(dbValidations || [])   // décisions Direction par (ref_table, ref_id)
  const MACHS: any[] = dbMachines ?? []
  const PROCS: any[] = (dbProcess ?? []).filter((p: any) => p.statut !== 'inactif')
  const CAPAS: any[] = dbCapabilites ?? []
  const ECMES: any[] = dbEcme ?? []
  const CONTROLES: any[] = dbControles ?? []
  const NCS   = dbNCs    ?? []
  const PVS   = dbPVs    ?? []
  const QS    = dbQs     ?? []
  const AUDS  = dbAudits ?? []
  const PERS  = dbPeriss ?? []
  const R8DS  = dbR8D    ?? []
  const DEROGS = dbDerogations ?? []
  const PLANSC = dbPlansControle ?? []
  const MVTPER = dbMouvementsPer ?? []
  const FOURNS = dbFournisseurs ?? []
  const LIB = dbLiberation ?? { aLiberer: [], liberes: [] }
  const AUDIT_PROG = dbAuditProgramme ?? []
  const AUDIT_GRL  = dbAuditGrilles ?? []
  const AUDIT_QS   = dbAuditQuestions ?? []
  const AUDIT_AUTO = dbAuditAuto ?? {}
  const FAIS       = dbFai ?? []

  const TABS = [
    ['pv',          'PV de Contrôle',         'fa-clipboard-check',   '#ef4444'],
    ['nc',          'Non-Conformités',         'fa-exclamation-triangle','#ef4444'],
    ['8d',          'Rapports 8D',             'fa-project-diagram',   '#f59e0b'],
    ['derogations', 'Dérogations',             'fa-file-signature',    '#ea580c'],
    ['liberation',  'Libération Lots',         'fa-unlock-alt',        '#8b5cf6'],
    ['quarantaine', 'Quarantaine',             'fa-ban',               '#b91c1c'],
    ['ecme',        'Contrôle des ECME',       'fa-ruler-combined',    '#7c3aed'],
    ['capabilite',  'Étude de capabilité',     'fa-chart-area',        '#0d9488'],
    ['perissables', 'Produits Périssables',    'fa-hourglass-half',    '#f59e0b'],
    ['plan-controle','Plan de contrôle',       'fa-list-check',        '#0891b2'],
    ['audit',       'Audit Conformité',        'fa-shield-alt',        '#0891b2'],
    ['referentiels','Référentiels',            'fa-book',              '#ea580c'],
    ['dashboard',   'Dashboard Qualité',       'fa-tachometer-alt',    '#ef4444'],
  ] as const

  const content = `
  <div style="font-family:Inter,system-ui,sans-serif;">

    ${serviceHeader({
      icon: 'fa-shield-alt',
      color: RED,
      darkBg: '#450a0a',
      title: 'Service Qualité',
      subtitle: 'Pierre-Yves · Agathe · PV Contrôle · NC · 8D · Libération · Audits · EN 9100:2018',
      tabs: TABS.map(([id,lbl,ic]) => {
        const cnt = ({
          'pv':            PVS.length,
          'nc':            NCS.length,
          '8d':            R8DS.filter((r: any) => r.statut !== 'clos').length,
          'liberation':    LIB.aLiberer.length,
          'quarantaine':   QS.filter((q: any) => q.statut === 'en_cours').length,
          'plan-controle': PLANSC.length,
          'audit':         AUDS.length,
          'ecme':          ECMES.length,
          'perissables':   PERS.length,
          'derogations':   DEROGS.length,
        } as Record<string, number>)[id]
        return { id, label: lbl, icon: ic, badge: cnt || undefined }
      }),
      switchFn: 'qualShowTab',
      tabIdPrefix: 'qual-tab',
      activeId: 'pv'
    })}

    <div style="padding:22px 30px;">

      ${panelPV(PVS)}
      ${panelNC(NCS, VD_MAP)}
      ${panel8D(R8DS)}
      ${panelLiberation(LIB.aLiberer, LIB.liberes)}
      ${panelQuarantaine(QS)}
      ${panelAudit(AUDS, AUDIT_PROG, AUDIT_GRL, AUDIT_QS, AUDIT_AUTO, FAIS)}
      ${panelCapabilite(CAPAS, MACHS, PROCS, CONTROLES)}
      ${panelEcme(ECMES)}
      ${panelPlanControle(PLANSC, PROCS, ECMES)}
      ${panelPerissables(PERS, MVTPER, FOURNS)}
      ${panelDerogations(DEROGS)}
      ${referentielsPanel()}
      ${panelDashboard(NCS, PVS, QS, AUDS, AUDIT_PROG, AUDIT_AUTO)}

    </div>
  </div>

  <!-- MODALS -->
  <div id="qual-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div id="qual-modal-box" style="background:white;border-radius:16px;padding:28px;max-width:560px;width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div id="qual-modal-content"></div>
    </div>
  </div>

  <script>
  var QUAL_TABS=['pv','nc','8d','derogations','liberation','quarantaine','audit','capabilite','ecme','plan-controle','perissables','referentiels','dashboard'];

  function qualShowTab(id){
    QUAL_TABS.forEach(function(t){
      var p=document.getElementById('qual-panel-'+t);
      var b=document.getElementById('qual-tab-'+t);
      if(p) p.style.display=(t===id)?'block':'none';
      if(b) b.classList.toggle('active',t===id);
    });
  }

  function qualFilter(tableId, q){
    var tbl=document.getElementById(tableId);
    if(!tbl) return;
    var lq=q.toLowerCase().trim();
    tbl.querySelectorAll('tbody tr').forEach(function(tr){
      tr.style.display=(!lq||tr.textContent.toLowerCase().indexOf(lq)>=0)?'':'none';
    });
  }

  var __ncF={origine:'Toutes',categorie:'Toutes',entite:'Toutes'};
  function qualApplyNC(){
    var tbl=document.getElementById('qual-tbl-nc');
    if(!tbl) return;
    tbl.querySelectorAll('tbody tr').forEach(function(tr){
      if(!tr.dataset.origine && !tr.dataset.categorie) return; // ligne "aucune"
      var okO=(__ncF.origine==='Toutes'||tr.dataset.origine===__ncF.origine);
      var okC=(__ncF.categorie==='Toutes'||tr.dataset.categorie===__ncF.categorie);
      var okE=(__ncF.entite==='Toutes'||tr.dataset.entite===__ncF.entite);
      tr.style.display=(okO&&okC&&okE)?'':'none';
    });
  }
  function qualFiltreNC(origine){
    __ncF.origine=origine;
    document.querySelectorAll('.nc-filter-btn').forEach(function(b){
      b.classList.remove('nf-active');
      b.style.background='#f8fafc'; b.style.color='#6b7280'; b.style.borderColor='#e2e8f0';
    });
    var active=document.getElementById('nc-filter-'+origine.replace(/\\s/g,'-'));
    if(active){ active.classList.add('nf-active'); active.style.background='${RED}15'; active.style.color='${RED}'; active.style.borderColor='${RED}60'; }
    qualApplyNC();
  }
  function qualFiltrePV(key){
    document.querySelectorAll('.pv-filter-btn').forEach(function(b){
      b.classList.remove('pf-active');
      b.style.background='#f8fafc'; b.style.color='#6b7280'; b.style.borderColor='#e2e8f0';
      var cnt=b.querySelector('span'); if(cnt){ cnt.style.background='#e2e8f0'; cnt.style.color='#475569'; }
    });
    var active=document.getElementById('pv-filter-'+key);
    if(active){
      active.classList.add('pf-active');
      active.style.background='${RED}15'; active.style.color='${RED}'; active.style.borderColor='${RED}60';
      var cnt=active.querySelector('span'); if(cnt){ cnt.style.background='${RED}25'; cnt.style.color='${RED}'; }
    }
    document.querySelectorAll('.pv-row').forEach(function(tr){
      tr.style.display=(key==='tous'||tr.dataset.origine===key)?'':'none';
    });
  }
  function qualFiltreNCCat(cat){
    __ncF.categorie=cat;
    document.querySelectorAll('.nc-cat-btn').forEach(function(b){
      b.classList.remove('nc-active');
      b.style.background='#f8fafc'; b.style.color='#6b7280'; b.style.borderColor='#e2e8f0';
    });
    var active=document.getElementById('nc-cat-'+cat);
    if(active){ active.classList.add('nc-active'); active.style.background='#6366f115'; active.style.color='#4338ca'; active.style.borderColor='#6366f160'; }
    qualApplyNC();
  }
  function qualFiltreNCEnt(ent){
    __ncF.entite=ent;
    document.querySelectorAll('.nc-ent-btn').forEach(function(b){
      b.classList.remove('ne-active');
      b.style.background='#f8fafc'; b.style.color='#6b7280'; b.style.borderColor='#e2e8f0';
    });
    var active=document.getElementById('nc-ent-'+ent);
    if(active){ active.classList.add('ne-active'); active.style.background='#0891b215'; active.style.color='#0e7490'; active.style.borderColor='#0891b260'; }
    qualApplyNC();
  }

  function qualSwitchNorme(norme){
    document.querySelectorAll('[id^="norme-panel-"]').forEach(function(p){
      var n=p.id.replace('norme-panel-','');
      p.style.display=(n===norme)?'block':'none';
      var b=document.getElementById('norme-btn-'+n);
      if(b) b.classList.toggle('norme-active',n===norme);
    });
  }

  function qualAddNorme(){
    var nom=prompt('Nom de la nouvelle norme (ex: NADCAP, AS9100):');
    if(nom && nom.trim()) pushNotif('ok','fa-plus','Section "'+nom.trim()+'" sera ajoutee par un administrateur.',5000);
  }

  function qualOpenModal(type){
    var overlay=document.getElementById('qual-modal-overlay');
    var box=document.getElementById('qual-modal-content');
    if(!overlay||!box) return;
    overlay.style.display='flex';
    if(type==='pv'){
      box.innerHTML=modalPVHTML();
    } else if(type==='nc'){
      window.__ncEditId=null;
      box.innerHTML=modalNCHTML();
    } else if(type==='perissable'){
      box.innerHTML=modalPerissableHTML();
    } else if(type==='liberation'){
      box.innerHTML=modalLiberationHTML(LIB_CUR_LOT);
    } else if(type.startsWith('audit-')){
      var norme=type.replace('audit-','').replace(/_/g,' ');
      box.innerHTML=modalAuditHTML(norme);
    }
  }
  var LIB_CUR_LOT='';
  // Rouvrir une NC dans son formulaire pour la modifier (clic sur le n° NC)
  function qualEditNC(id){
    var d=(window.NC_FORM||{})[id]; if(!d){ pushNotif('err','fa-ban','NC introuvable.'); return; }
    qualOpenModal('nc');            // construit un formulaire neuf + remet __ncEditId à null
    window.__ncEditId=id;
    function set(fid,val){ var e=document.getElementById(fid); if(e) e.value=(val==null?'':val); }
    set('nc_type',d.type_nc); set('nc_cat',d.categorie); set('nc_entite',d.entite);
    set('nc_gravite',d.gravite); set('nc_detecteur',d.detecteur);
    set('nc_fournisseur',d.fournisseur_nom); set('nc_client',d.client_nom);
    set('nc_frc',d.frc); set('nc_lot',d.lot_ref); set('nc_ref',d.ref_article); set('nc_desig',d.designation);
    set('nc_cmd',d.n_commande); set('nc_qte_ret',d.qte_retour_attendue); set('nc_date_ret',d.date_retour_prevue);
    var _r=document.getElementById('nc_retour'); if(_r){ _r.checked=(d.retour_attendu===true); ncToggleRetour(); }
    set('nc_nature',d.type_defaut); set('nc_cause',d.type_cause); set('nc_action',d.action_corrective);
    set('nc_statut',d.statut); set('nc_responsable',d.responsable);
    set('nc_lieu_det',d.lieu_detection); set('nc_lieu_imp',d.lieu_imputation);
    set('nc_desc',d.description);
    if(typeof ncCatToggle==='function') ncCatToggle();
    var t=document.getElementById('nc_modal_title'); if(t) t.innerHTML='<i class="fas fa-pen" style="color:#dc2626;"></i>Modifier la NC '+id;
  }
  function qualOpenLiberation(lotId){ LIB_CUR_LOT=lotId; qualOpenModal('liberation'); }
  function modalLiberationHTML(lotId){
    return '<div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:6px;display:flex;align-items:center;gap:8px;"><i class="fas fa-clipboard-check" style="color:#8b5cf6;"></i>PV de libération de lot</div>'+
    '<div style="font-size:.78rem;color:#6b7280;margin-bottom:16px;">Lot <strong>'+lotId+'</strong> — contrôle qualité final avant expédition.</div>'+
    '<input type="hidden" id="lib_lot" value="'+lotId+'"/>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fldI('Cp (optionnel)','number','lib_cp','ex: 1.33')+fldI('Cpk (optionnel)','number','lib_cpk','ex: 1.20')+
    '</div>'+
    fldI('Observations / résultat du contrôle','textarea','lib_obs','Conformité dimensionnelle, aspect, documents…')+
    '<div style="display:flex;justify-content:space-between;gap:8px;margin-top:18px;">'+
    '<button onclick="qualCloseModal()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'+
    '<div style="display:flex;gap:8px;">'+
    '<button onclick="qualSaveLiberation(\\'bloque\\')" style="padding:9px 16px;background:#fee2e2;color:#b91c1c;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-ban" style="margin-right:5px;"></i>Bloquer (quarantaine)</button>'+
    '<button onclick="qualSaveLiberation(\\'libere\\')" style="padding:9px 16px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-unlock" style="margin-right:5px;"></i>Libérer le lot</button>'+
    '</div></div>';
  }
  function qualSaveLiberation(decision){
    function v(id){var e=document.getElementById(id);return e?e.value:'';}
    var lot=v('lib_lot'); if(!lot) return;
    var body={ decision:decision, cp:v('lib_cp')||null, cpk:v('lib_cpk')||null, observations:v('lib_obs')||null };
    fetch('/api/qualite/lot/'+encodeURIComponent(lot)+'/liberer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      .then(function(r){return r.json();}).then(function(j){
        if(j.ok){ qualCloseModal(); if(decision==='libere') pushNotif('ok','fa-unlock','Lot '+lot+' libéré (PV '+(j.num_pv||'')+'). Prêt pour expédition.',5000); else pushNotif('ok','fa-ban','Lot '+lot+' bloqué → mis en quarantaine.',5000); setTimeout(function(){softReload();},900); }
        else pushNotif('err','fa-ban', j.error||'Échec.');
      }).catch(function(){ pushNotif('err','fa-ban','Erreur réseau.'); });
  }

  function qualCloseModal(){
    var o=document.getElementById('qual-modal-overlay');
    if(o) o.style.display='none';
  }

  document.addEventListener('click',function(e){
    var o=document.getElementById('qual-modal-overlay');
    if(e.target===o) qualCloseModal();
  });

  function pvSetLienLot(){ document.getElementById('pvBLFld').style.display='none'; document.getElementById('pvLotFld').style.display='block'; }
  function pvSetLienBL(){  document.getElementById('pvLotFld').style.display='none'; document.getElementById('pvBLFld').style.display='block'; }

  function modalPVHTML(){
    return '<div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:20px;display:flex;align-items:center;gap:8px;"><i class="fas fa-clipboard-check" style="color:${RED};"></i>Nouveau PV de controle</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fld('Date PV','date')+fld('Type controle','select','autocontrole|intermediaire|final|reception fournisseur')+
    '</div>'+
    '<div style="display:flex;gap:8px;margin-bottom:14px;">'+
    '<button onclick="pvSetLienLot()" style="flex:1;padding:8px;border:1.5px solid #3b82f6;border-radius:8px;background:#dbeafe;cursor:pointer;font-size:.8rem;font-weight:600;">Lie a un Lot</button>'+
    '<button onclick="pvSetLienBL()" style="flex:1;padding:8px;border:1.5px solid #e2e8f0;border-radius:8px;background:#f8fafc;cursor:pointer;font-size:.8rem;font-weight:600;">Lie a un BL</button>'+
    '</div>'+
    '<div id="pvLotFld" style="margin-bottom:14px;">'+fld('N Lot','text','LOT-2026-XXX')+'</div>'+
    '<div id="pvBLFld" style="display:none;margin-bottom:14px;">'+fld('N BL','text','BL-2026-XXX')+'</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fld('Piece','text','Reference piece')+fld('Client','text','Raison sociale')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fld('Cp','number','1.33')+fld('Cpk','number','1.20')+
    '</div>'+
    fld('Observations','textarea','')+
    '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">'+
    '<button onclick="qualCloseModal()" style="padding:9px 20px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'+
    '<button onclick="qualSavePV()" style="padding:9px 20px;background:linear-gradient(135deg,${RED},${RED_D});color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Creer le PV</button>'+
    '</div>';
  }

  function modalNCHTML(){
    var LB='display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;';
    var SL='width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;';
    return '<div id="nc_modal_title" style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:20px;display:flex;align-items:center;gap:8px;"><i class="fas fa-exclamation-triangle" style="color:${RED};"></i>Nouvelle Non-Conformité</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fldI('Date détection','date','nc_date')+fldI('Type NC *','select','nc_type',window.NC_LISTES.types.join('|'))+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    '<div><label style="'+LB+'">Catégorie *</label><select id="nc_cat" onchange="ncCatToggle()" style="'+SL+'"><option value="">— Choisir —</option><option value="administratif">Administratif</option><option value="prod">Production</option></select></div>'+
    '<div id="nc_entite_wrap"><label style="'+LB+'">Entité *</label><select id="nc_entite" style="'+SL+'"><option value="">— Choisir —</option><option>Seem</option><option>Semrac</option></select><div style="font-size:.6rem;color:#94a3b8;margin-top:3px;">Uniquement pour une NC de production.</div></div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fldI('Gravité','select','nc_gravite','Mineure|Majeure|Critique|Bloquante')+fldI('Détecteur','select','nc_detecteur','Opérateur|Contrôleur|Client|Auditeur|Réception')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fldI('Nature de la NC','select','nc_nature',window.NC_LISTES.natures.join('|'))+fldI('Nature de la cause','select','nc_cause',window.NC_LISTES.causes.join('|'))+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fldI('Action immédiate','select','nc_action',window.NC_LISTES.actions.join('|'))+fldI('Statut','select','nc_statut',window.NC_LISTES.statuts.join('|'))+
    '</div>'+
    '<div style="margin-bottom:14px;">'+fldI('Responsable','select','nc_responsable',window.NC_LISTES.responsables.join('|'))+'</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fldI('Fournisseur / ST','text','nc_fournisseur','Raison sociale (si NC fournisseur/ST)')+fldI('Client','text','nc_client','Raison sociale (si NC client)')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fldI('FRC client (n° de la NC chez le client)','text','nc_frc','Réf. NC côté client')+fldI('LOT concerné','text','nc_lot','LOT-2026-XXXX')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fldI('Code article (nomenclature)','text','nc_ref','ex: 128076')+fldI('Désignation','text','nc_desig','Désignation de l\\'article')+
    // Retour client : c est ICI qu on annonce que la marchandise revient. Les Expeditions
    //   voient alors le retour dans leur onglet Receptions et enregistrent son arrivee
    //   (BL de retour rattache a la commande client saisie ci-dessous).
    '<div style="border:1.5px solid #fecaca;background:#fef2f2;border-radius:10px;padding:12px 14px;margin-bottom:14px;">'+
      '<label style="display:flex;align-items:center;gap:9px;font-size:.82rem;font-weight:700;color:#991b1b;cursor:pointer;">'+
        '<input type="checkbox" id="nc_retour" onchange="ncToggleRetour()"/> <i class="fas fa-box-open"></i> Retour de marchandise prevu (le client renvoie les pieces)'+
      '</label>'+
      '<div id="nc_retour_box" style="display:none;margin-top:12px;">'+
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">'+
        fldI('N° de commande client','text','nc_cmd','Commande d origine')+fldI('Quantite retournee','number','nc_qte_ret','0')+fldI('Retour prevu le','date','nc_date_ret','')+
        '</div>'+
        '<div style="font-size:.72rem;color:#b91c1c;margin-top:8px;">Le retour apparaitra dans <strong>Expeditions &rsaquo; Receptions</strong>, ou son arrivee sera enregistree.</div>'+
      '</div>'+
    '</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fldI('Poste (lieu de détection)','select','nc_lieu_det',window.NC_LISTES.postes.join('|'))+fldI('Imputation (service responsable)','select','nc_lieu_imp',window.NC_LISTES.imputations.join('|'))+
    '</div>'+
    fldI('Description de la NC','textarea','nc_desc','')+
    '<label style="display:flex;align-items:center;gap:9px;padding:9px 12px;margin-top:14px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:9px;font-size:.76rem;color:#92400e;font-weight:600;cursor:pointer;"><input type="checkbox" id="nc_vd" style="width:16px;height:16px;accent-color:#f59e0b;"/><i class="fas fa-crown" style="color:#f59e0b;"></i>Soumettre à la validation de la Direction</label>'+
    '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">'+
    '<button onclick="qualCloseModal()" style="padding:9px 20px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'+
    '<button onclick="qualSaveNC()" style="padding:9px 20px;background:linear-gradient(135deg,${RED},${RED_D});color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Créer NC</button>'+
    '</div>';
  }

  function modalPerissableHTML(){
    return '<div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:20px;display:flex;align-items:center;gap:8px;"><i class="fas fa-hourglass-half" style="color:#f59e0b;"></i>Ajouter un produit périssable</div>'+
    fld('Nom du produit','text','ex: Acide sulfurique 98%')+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0;">'+
    fld('Référence','text','Réf. fabricant')+fld('Fournisseur','text','Nom fournisseur')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fld('Date ouverture','date')+fld('Date expiration','date')+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fld('Quantité','number','0')+fld('Unité','text','L / kg / m')+fld('Emplacement','text','Zone / machine')+
    '</div>'+
    fld('Observations','textarea','')+
    '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">'+
    '<button onclick="qualCloseModal()" style="padding:9px 20px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'+
    '<button onclick="qualSavePer()" style="padding:9px 20px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Ajouter</button>'+
    '</div>';
  }

  function qualPlanifierAudit(){
    pushNotif('ok','fa-calendar-check','Audit planifie. Rappels automatiques J-30 et J-7.',5000);
    qualCloseModal();
  }

  function modalAuditHTML(norme){
    return '<div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:20px;display:flex;align-items:center;gap:8px;"><i class="fas fa-shield-alt" style="color:#0891b2;"></i>Planifier un audit '+norme+'</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">'+
    fld('Date audit','date')+fld('Auditeur','text','Bureau Veritas / LRQA')+
    '</div>'+
    fld('Observations / perimetre','textarea','')+
    '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">'+
    '<button onclick="qualCloseModal()" style="padding:9px 20px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'+
    '<button onclick="qualPlanifierAudit()" style="padding:9px 20px;background:linear-gradient(135deg,#0891b2,#0e7490);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Planifier</button>'+
    '</div>';
  }

  function fld(label,type,placeholder){
    if(type==='textarea') return '<div style="margin-bottom:2px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">'+label+'</label><textarea placeholder="'+placeholder+'" rows="3" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;resize:vertical;box-sizing:border-box;"></textarea></div>';
    if(type==='select') return '<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">'+label+'</label><select style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"><option value="">— Choisir —</option>'+placeholder.split('|').map(function(o){return '<option>'+o+'</option>';}).join('')+'</select></div>';
    return '<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">'+label+'</label><input type="'+type+'" placeholder="'+(placeholder||'')+'" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;box-sizing:border-box;"/></div>';
  }
  // Variante avec id pour pouvoir lire les valeurs au submit
  function fldI(label,type,id,placeholder){
    if(type==='textarea') return '<div style="margin-bottom:2px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">'+label+'</label><textarea id="'+id+'" placeholder="'+(placeholder||'')+'" rows="3" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;resize:vertical;box-sizing:border-box;"></textarea></div>';
    if(type==='select') return '<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">'+label+'</label><select id="'+id+'" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"><option value="">— Choisir —</option>'+placeholder.split('|').map(function(o){var M={administratif:'Administratif',operation:'Opération',prod:'Production',interne:'Interne',client:'Client','fournisseur/st':'Fournisseur / ST'};var lbl=M[o]||(o.charAt(0).toUpperCase()+o.slice(1));return '<option value="'+o+'">'+lbl+'</option>';}).join('')+'</select></div>';
    return '<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">'+label+'</label><input id="'+id+'" type="'+type+'" placeholder="'+(placeholder||'')+'" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;box-sizing:border-box;"/></div>';
  }

  function qualSavePV(){ pushNotif('ok','fa-clipboard-check','PV créé et archivé. Lot mis à jour.',5000); qualCloseModal(); }
  function ncCatToggle(){ var c=(document.getElementById('nc_cat')||{}).value; var w=document.getElementById('nc_entite_wrap'); if(w) w.style.display=(c==='administratif')?'none':'block'; }
  function ncToggleRetour(){ var c=document.getElementById('nc_retour'); var b=document.getElementById('nc_retour_box'); if(b) b.style.display=(c&&c.checked)?'block':'none'; }
  function qualSaveNC(){
    function v(id){var e=document.getElementById(id);return e?e.value:'';}
    var cat=v('nc_cat'), ent=v('nc_entite');
    if(!cat){ pushNotif('err','fa-exclamation','Choisissez la catégorie (administratif / production).',4000); return; }
    // Une NC administrative n'est PAS reliée à Seem/Semrac ; l'entité n'est requise qu'en production.
    if(cat!=='administratif' && !ent){ pushNotif('err','fa-exclamation','Choisissez l\\'entité (Seem / Semrac) pour une NC de production.',4000); return; }
    var body={
      type_nc: v('nc_type')||'interne',
      categorie: cat,
      entite: cat==='administratif' ? null : (ent||null),
      gravite: v('nc_gravite')||'Majeure',
      detecteur: v('nc_detecteur')||null,
      fournisseur_nom: v('nc_fournisseur')||null,
      client_nom: v('nc_client')||null,
      frc: v('nc_frc')||null,
      lot_ref: v('nc_lot')||null,
      ref_article: v('nc_ref')||null,
      designation: v('nc_desig')||null,
      lieu_detection: v('nc_lieu_det')||null,
      lieu_imputation: v('nc_lieu_imp')||null,
      type_defaut: v('nc_nature')||null,
      type_cause: v('nc_cause')||null,
      action_corrective: v('nc_action')||null,
      responsable: v('nc_responsable')||null,
      description: v('nc_desc')||null,
      statut: v('nc_statut')||'Ouvert',
      n_commande: v('nc_cmd')||null,
      retour_attendu: !!(document.getElementById('nc_retour')||{}).checked,
      qte_retour_attendue: parseFloat(v('nc_qte_ret'))||null,
      date_retour_prevue: v('nc_date_ret')||null,
      retour_statut: (document.getElementById('nc_retour')||{}).checked ? 'attendu' : null
    };
    var editId=window.__ncEditId;
    var url=editId?('/api/qualite/non-conformites/'+encodeURIComponent(editId)):'/api/production/non-conformites';
    fetch(url,{method:editId?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      .then(function(r){return r.json();})
      .then(function(j){
        if(j&&(j.ok||j.data)){
          if(!editId) submitValidation('qualite','nc_vd',{type:'NC '+body.gravite,objet:(body.lot_ref||body.operation||'NC')+' — '+body.gravite,priorite:(body.gravite==='Bloquante'||body.gravite==='Critique')?'urgent':'normal',ref_table:'non_conformites',ref_id:(j.data&&j.data.id)||null});
          pushNotif('ok','fa-exclamation-triangle','NC '+((j.data&&j.data.id)||editId||'')+(editId?' modifiée.':' créée.'),4000);
          window.__ncEditId=null; qualCloseModal(); setTimeout(function(){softReload();},700);
        } else pushNotif('err','fa-times','Erreur : '+(j&&j.error||'inconnue'),5000);
      })
      .catch(function(){ pushNotif('err','fa-times','Erreur réseau.',5000); });
  }
  function qualSavePer(){ pushNotif('ok','fa-hourglass-half','Produit périssable ajouté.',5000); qualCloseModal(); }
  function qualOpenNC(pvId){ qualShowTab('nc'); qualOpenModal('nc'); }
  function qualLiberLot(pvId){ qualShowTab('liberation'); }
  function qualOuvrir8D(ncId){ pushNotif('info','fa-project-diagram','Ouverture du rapport 8D pour '+ncId+'…',2500); window.location.href='/qualite/8d?nc='+encodeURIComponent(ncId); }
  function qual8DNouveau(){
    var f=document.getElementById('qual-8d-form');
    if(f){ f.style.display=f.style.display==='none'?'block':'none'; }
    var d=document.getElementById('8d-date'); if(d) d.value=new Date().toISOString().slice(0,10);
  }
  function qual8DSave(){
    var titre=document.getElementById('8d-titre');
    if(!titre||!titre.value.trim()){ pushNotif('err','fa-exclamation','Le titre du problème est obligatoire.'); return; }
    var v=function(id){ var e=document.getElementById(id); return e?e.value.trim():''; };
    var desc=v('8d-desc'), lot=v('8d-lot');
    var d2=titre.value.trim();
    if(desc) d2+='\\n'+desc;
    if(lot)  d2+='\\nLot/Réf: '+lot;
    var payload={
      d2_probleme:d2,
      client_id:v('8d-client')||null,
      gravite:v('8d-gravite')||'majeure',
      responsable:v('8d-resp')||null,
      date_ouverture:v('8d-date')||new Date().toISOString().slice(0,10),
      statut:'en_cours'
    };
    fetch('/api/qualite/rapports-8d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();})
      .then(function(res){
        if(res&&res.error){ pushNotif('err','fa-exclamation','Erreur : '+res.error); return; }
        var num=(res&&res.data&&res.data.id);
        pushNotif('ok','fa-project-diagram','Rapport '+(num||'8D')+' créé — '+titre.value+' · ouverture…',4000);
        setTimeout(function(){ if(num){ window.location.href='/qualite/8d?id='+encodeURIComponent(num); } else { softReload(); } },700);
      })
      .catch(function(){ pushNotif('err','fa-exclamation','Erreur réseau lors de la création du rapport 8D.'); });
  }
  async function qual8DTerminer(id){
    if(!await appConfirm('Marquer le rapport '+id+' comme complété (clôturé) ?')) return;
    fetch('/api/qualite/rapports-8d/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({statut:'clos',date_cloture:new Date().toISOString().slice(0,10)})})
      .then(function(r){return r.json();})
      .then(function(res){
        if(res&&res.error){ pushNotif('err','fa-exclamation','Erreur : '+res.error); return; }
        pushNotif('ok','fa-check-circle','Rapport '+id+' clôturé — déplacé dans les rapports complétés.',5000);
        setTimeout(function(){ softReload(); },700);
      })
      .catch(function(){ pushNotif('err','fa-exclamation','Erreur réseau.'); });
  }
  async function qualLibererLot(qId){
    if(!await appConfirm('Confirmer la libération de ce lot ?')) return;
    var r=await fetch('/api/quarantaine/'+encodeURIComponent(qId)+'/liberer',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    var j=await r.json().catch(function(){return{ok:false};});
    if(j.ok){ pushNotif('ok','fa-unlock','Lot libéré. Expédition débloquée.',5000); setTimeout(function(){softReload();},800); }
    else pushNotif('err','fa-ban',j.error||'Libération impossible');
  }
  async function qualRejeterLot(qId){
    if(!await appConfirm('Confirmer le rejet de ce lot ?')) return;
    var r=await fetch('/api/quarantaine/'+encodeURIComponent(qId)+'/rejeter',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    var j=await r.json().catch(function(){return{ok:false};});
    if(j.ok){ pushNotif('err','fa-times','Lot rejeté.',5000); setTimeout(function(){softReload();},800); }
    else pushNotif('err','fa-ban',j.error||'Rejet impossible');
  }
  function qualArchiverPer(id){ pushNotif('ok','fa-archive','Produit archivé.',4000); }
  async function qualSupprimerPer(id){ if(await appConfirm('Supprimer ce produit périssable ?')){ pushNotif('ok','fa-trash','Produit supprimé.',4000); } }
  </script>

  <style>
  .norme-tab{padding:7px 16px;border:none;border-radius:8px;background:transparent;color:#64748b;font-size:.8rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .15s;}
  .norme-active{background:white;color:#0891b2;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.1);}
  </style>`

  return layout('Service Qualité', content + demandeAchatModal('Qualité', '#ef4444', FOURNS.map((f: any) => ({ id: f.id, nom: f.nom }))), 'service-qualite')
}
