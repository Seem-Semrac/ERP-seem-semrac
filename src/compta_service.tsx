// ══════════════════════════════════════════════════════════════
// SERVICE COMPTABILITÉ – ERP Seem Semrac v2.0
// Spec : SPEC-ERP-GPAO-V1.8 / EN 9100:2018 / ISO 9001:2015
// ══════════════════════════════════════════════════════════════

import { escX, layout, serviceHeader, buildValDirMap, valDirBadge } from './shared'
import { brandBlockHTML, BRAND } from './brand'

// Décisions Direction indexées par (ref_table, ref_id). Posé au début de pageServiceCompta
// (rendu SYNCHRONE) → visible par les builders module-level (buildARegler…).
let CPT_VD_MAP: Record<string, any> = {}
import type { FactureClient, FactureFournisseur, EcritureComptable } from './types'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

// ─── COLORS ───────────────────────────────────────────────────
const EMERALD = '#10b981'
const EMERALD_D = '#059669'

// ─── FORMATTER ────────────────────────────────────────────────
// Null-safe : une seule facture au montant NULL faisait planter (500) TOUT le service Compta.
const fmt = (n: any) => (Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

// ─── DEMO DATA ────────────────────────────────────────────────
const FACT_CLI_DEFAULT: FactureClient[] = []

const FACT_FOURN_DEFAULT: FactureFournisseur[] = []

const ECRITURES_DEFAULT: EcritureComptable[] = []

// ─── BADGE HELPERS ────────────────────────────────────────────
function statutCliBadge(s: string): string {
  const map: Record<string, [string, string]> = {
    brouillon:          ['#6b7280','#f3f4f6'],
    envoyee:            ['#2563eb','#eff6ff'],
    partiellement_payee:['#d97706','#fffbeb'],
    payee:              ['#16a34a','#f0fdf4'],
    en_retard:          ['#dc2626','#fef2f2'],
    litige:             ['#7c3aed','#f5f3ff'],
  }
  const labels: Record<string,string> = {
    brouillon:'Brouillon', envoyee:'Envoyée', partiellement_payee:'Partiel.',
    payee:'Payée', en_retard:'En retard', litige:'Litige'
  }
  const [col, bg] = map[s] || ['#6b7280','#f3f4f6']
  return `<span style="background:${bg};color:${col};border:1px solid ${col}33;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;white-space:nowrap;">${labels[s]||s}</span>`
}

function statutFournBadge(s: string): string {
  const map: Record<string, [string, string]> = {
    a_valider:['#d97706','#fffbeb'],
    validee:  ['#2563eb','#eff6ff'],
    a_payer:  ['#dc2626','#fef2f2'],
    payee:    ['#16a34a','#f0fdf4'],
    litige:   ['#7c3aed','#f5f3ff'],
  }
  const labels: Record<string,string> = {
    a_valider:'À valider', validee:'Validée', a_payer:'À payer', payee:'Payée', litige:'Litige'
  }
  const [col, bg] = map[s] || ['#6b7280','#f3f4f6']
  return `<span style="background:${bg};color:${col};border:1px solid ${col}33;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;white-space:nowrap;">${labels[s]||s}</span>`
}

function journalBadge(j: string): string {
  const map: Record<string,[string,string]> = {
    VTE:['#2563eb','#eff6ff'],
    ACH:['#d97706','#fffbeb'],
    BQ: ['#16a34a','#f0fdf4'],
    OD: ['#6b7280','#f3f4f6'],
    SAL:['#7c3aed','#f5f3ff'],
  }
  const [col, bg] = map[j] || ['#6b7280','#f3f4f6']
  return `<span style="background:${bg};color:${col};border:1px solid ${col}33;border-radius:999px;padding:2px 9px;font-size:.68rem;font-weight:800;letter-spacing:.04em;">${j}</span>`
}

// ─── TABLE STYLES ─────────────────────────────────────────────
const TH = `style="padding:8px 12px;text-align:left;font-size:.67rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;border-bottom:2px solid #f1f5f9;background:#f8fafc;white-space:nowrap;"`
const TD = `style="padding:8px 12px;font-size:.78rem;color:#374151;border-bottom:1px solid #f8fafc;vertical-align:middle;"`

// ─── RETARD CALCULATION ───────────────────────────────────────
function retardJours(dateEch: string): number {
  const today = new Date()
  const ech = new Date(dateEch)
  return Math.floor((today.getTime() - ech.getTime()) / 86400000)
}

// ─── TAB 1: DASHBOARD ─────────────────────────────────────────
function buildDashboard(fc: FactureClient[], ff: FactureFournisseur[]): string {
  const yearOf = (d?: string) => (d || '').slice(0, 4)
  const monthOf = (d?: string) => parseInt((d || '0000-00').slice(5, 7), 10) - 1
  // Année de référence = année la plus récente présente dans les données
  const allYears = [...fc.map(f => yearOf(f.date_facture)), ...ff.map(f => yearOf(f.date_facture))].filter(Boolean)
  const year = allYears.sort().reverse()[0] || String(new Date().getFullYear())
  const fcY = fc.filter(f => yearOf(f.date_facture) === year)
  const ffY = ff.filter(f => yearOf(f.date_facture) === year)

  // ── Agrégats annuels ──
  const caHT          = fcY.reduce((s, f) => s + f.montant_ht, 0)
  const encaisseTTC   = fcY.filter(f => f.statut === 'payee').reduce((s, f) => s + f.montant_ttc, 0)
  const enAttente     = fcY.filter(f => ['envoyee', 'en_retard', 'partiellement_payee'].includes(f.statut)).reduce((s, f) => s + f.montant_ttc, 0)
  const chargesHT     = ffY.reduce((s, f) => s + f.montant_ht, 0)
  const payeTTC       = ffY.filter(f => f.statut === 'payee').reduce((s, f) => s + f.montant_ttc, 0)
  const aPayer        = ffY.filter(f => ['a_payer', 'validee', 'a_valider'].includes(f.statut)).reduce((s, f) => s + f.montant_ttc, 0)

  // ── Marge brute ──
  const margeTreso = encaisseTTC - payeTTC          // encaissé − payé (réalisé, TTC)
  const margeHT    = caHT - chargesHT               // CA HT − charges HT (comptable)
  const tauxMarge  = caHT > 0 ? (margeHT / caHT * 100) : 0
  const encoursCli = fcY.filter(f => f.statut !== 'payee' && f.statut !== 'brouillon').reduce((s, f) => s + f.montant_ttc, 0)
  const dso = caHT > 0 ? Math.round((encoursCli / caHT) * 365) : 0

  // ── Base 100 annuelle : indice mensuel du CA HT (base 100 = 1er mois facturé) ──
  const moisLbl = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
  const caMois = Array(12).fill(0) as number[]
  const chargeMois = Array(12).fill(0) as number[]
  fcY.forEach(f => { const m = monthOf(f.date_facture); if (m >= 0 && m < 12) caMois[m] += f.montant_ht })
  ffY.forEach(f => { const m = monthOf(f.date_facture); if (m >= 0 && m < 12) chargeMois[m] += f.montant_ht })
  const lastMonth = Math.max(0, ...caMois.map((v, i) => v > 0 ? i : -1), ...chargeMois.map((v, i) => v > 0 ? i : -1))
  const firstIdx = caMois.findIndex(v => v > 0)
  const baseVal = firstIdx >= 0 ? caMois[firstIdx] : 0
  const indices = caMois.map(v => baseVal > 0 ? Math.round(v / baseVal * 100) : 0)
  const maxIndice = Math.max(100, ...indices.slice(0, lastMonth + 1))
  const indiceCourant = indices[lastMonth] || 100
  const cumulCA = caMois.slice(0, lastMonth + 1).reduce((s, v) => s + v, 0)
  const cumulCharge = chargeMois.slice(0, lastMonth + 1).reduce((s, v) => s + v, 0)

  const retards = fcY.filter(f => f.statut === 'en_retard')
  const litiges = fcY.filter(f => f.statut === 'litige')

  // Top 5 clients par CA
  const clientMap: Record<string, { total: number; count: number }> = {}
  fcY.forEach(f => {
    if (!clientMap[f.client_nom!]) clientMap[f.client_nom!] = { total: 0, count: 0 }
    clientMap[f.client_nom!].total += f.montant_ht
    clientMap[f.client_nom!].count++
  })
  const top5 = Object.entries(clientMap).sort((a, b) => b[1].total - a[1].total).slice(0, 5)

  // Charges par catégorie (engagées, non encore payées)
  const chargeMap: Record<string, number> = {}
  ffY.filter(f => f.statut !== 'payee').forEach(f => {
    const k = f.compte_charge || 'Autres'
    chargeMap[k] = (chargeMap[k] || 0) + f.montant_ht
  })

  // Prochaines échéances (par rapport à aujourd'hui)
  const today = new Date()
  const soon = [
    ...fc.filter(f => f.date_echeance && f.statut !== 'payee').map(f => ({ type: 'client', nom: f.client_nom!, num: f.num_facture!, ech: f.date_echeance!, ttc: f.montant_ttc })),
    ...ff.filter(f => f.date_echeance && f.statut !== 'payee').map(f => ({ type: 'fourn', nom: f.fournisseur_nom!, num: f.num_facture!, ech: f.date_echeance!, ttc: f.montant_ttc })),
  ].filter(e => {
    const diff = (new Date(e.ech).getTime() - today.getTime()) / 86400000
    return diff >= -40 && diff <= 40
  }).sort((a, b) => a.ech.localeCompare(b.ech)).slice(0, 12)

  // ── Graphe base 100 (barres verticales inline) ──
  const chartBars = indices.slice(0, lastMonth + 1).map((idx, m) => {
    const h = maxIndice > 0 ? Math.round(idx / maxIndice * 120) : 0
    const up = m === 0 || idx >= (indices[m - 1] || 0)
    const col = up ? EMERALD : '#ef4444'
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;">
      <div style="font-size:.62rem;font-weight:800;color:${col};">${idx}</div>
      <div style="width:60%;max-width:34px;height:${h}px;background:linear-gradient(180deg,${col},${col}aa);border-radius:4px 4px 0 0;" title="${moisLbl[m]} : ${fmt(caMois[m])} (indice ${idx})"></div>
      <div style="font-size:.6rem;color:#9ca3af;">${moisLbl[m]}</div>
    </div>`
  }).join('')

  return `
  <!-- BANDEAU PÉRIODE -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
    <span style="font-size:.95rem;font-weight:900;color:#111827;">Exercice ${year}</span>
    <span style="font-size:.72rem;color:#6b7280;">· Indicateurs cumulés du 01/01 au mois courant · données factures clients + fournisseurs/ST</span>
  </div>

  <!-- KPI CARDS -->
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px;">
    ${kpiCard('fa-chart-line', EMERALD, 'CA facturé ' + year, fmt(caHT), 'Hors taxes · cumul annuel')}
    ${kpiCard('fa-hand-holding-usd', '#3b82f6', 'Encaissé (rentré)', fmt(encaisseTTC), 'Règlements clients reçus TTC')}
    ${kpiCard('fa-money-bill-wave', '#ef4444', 'Décaissé (payé)', fmt(payeTTC), 'Fournisseurs + ST réglés TTC')}
    ${kpiCard('fa-clock', '#f59e0b', 'En attente règlement', fmt(enAttente), 'Clients envoyées + retard')}
    ${kpiCard('fa-file-invoice-dollar', '#7c3aed', 'Reste à payer F/ST', fmt(aPayer), 'À valider + à payer')}
  </div>

  <!-- MARGE BRUTE + BASE 100 -->
  <div style="display:grid;grid-template-columns:1.05fr 1.35fr;gap:16px;margin-bottom:16px;">

    <!-- MARGE BRUTE GLOBALE -->
    <div class="card" style="padding:18px;border-top:3px solid ${EMERALD};">
      <div style="font-size:.78rem;font-weight:800;color:#374151;margin-bottom:14px;"><i class="fas fa-balance-scale-right mr-2" style="color:${EMERALD};"></i>Marge brute globale ${year}</div>

      <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:12px;">
        <div style="font-size:2rem;font-weight:900;color:${margeTreso >= 0 ? EMERALD_D : '#dc2626'};line-height:1;">${fmt(margeTreso)}</div>
        <div style="font-size:.7rem;color:#6b7280;padding-bottom:4px;">encaissé − payé (réalisé)</div>
      </div>

      <!-- barre encaissé vs payé -->
      ${(() => {
        const base = Math.max(encaisseTTC, payeTTC, 1)
        return `
        <div style="margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;font-size:.7rem;font-weight:700;color:#3b82f6;margin-bottom:3px;"><span>Rentré (encaissé)</span><span>${fmt(encaisseTTC)}</span></div>
          <div style="height:10px;background:#eff6ff;border-radius:999px;overflow:hidden;"><div style="height:100%;width:${Math.round(encaisseTTC / base * 100)}%;background:linear-gradient(90deg,#3b82f6,#60a5fa);"></div></div>
        </div>
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:.7rem;font-weight:700;color:#ef4444;margin-bottom:3px;"><span>Sorti (payé)</span><span>${fmt(payeTTC)}</span></div>
          <div style="height:10px;background:#fef2f2;border-radius:999px;overflow:hidden;"><div style="height:100%;width:${Math.round(payeTTC / base * 100)}%;background:linear-gradient(90deg,#ef4444,#f87171);"></div></div>
        </div>`
      })()}

      <div style="border-top:1px solid #f1f5f9;padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div><div style="font-size:.64rem;color:#9ca3af;text-transform:uppercase;font-weight:700;">Marge HT comptable</div><div style="font-size:1rem;font-weight:800;color:#111827;">${fmt(margeHT)}</div><div style="font-size:.62rem;color:#9ca3af;">CA HT − charges HT</div></div>
        <div><div style="font-size:.64rem;color:#9ca3af;text-transform:uppercase;font-weight:700;">Taux de marge</div><div style="font-size:1rem;font-weight:800;color:${tauxMarge >= 0 ? EMERALD_D : '#dc2626'};">${tauxMarge.toFixed(1)} %</div><div style="font-size:.62rem;color:#9ca3af;">DSO ${dso} j</div></div>
      </div>
    </div>

    <!-- BASE 100 ANNUELLE -->
    <div class="card" style="padding:18px;border-top:3px solid #7c3aed;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <div style="font-size:.78rem;font-weight:800;color:#374151;"><i class="fas fa-chart-bar mr-2" style="color:#7c3aed;"></i>Base 100 annuelle — activité ${year}</div>
        <div style="text-align:right;"><span style="font-size:1.3rem;font-weight:900;color:#7c3aed;">${indiceCourant}</span><span style="font-size:.66rem;color:#9ca3af;margin-left:4px;">indice courant</span></div>
      </div>
      <div style="font-size:.66rem;color:#9ca3af;margin-bottom:10px;">Indice du CA HT mensuel — base 100 = ${moisLbl[firstIdx >= 0 ? firstIdx : 0]} ${year} (${fmt(baseVal)})</div>
      <div style="display:flex;align-items:flex-end;gap:6px;height:150px;padding:6px 2px 0;border-bottom:1px solid #e5e7eb;">
        ${chartBars || '<div style="color:#9ca3af;font-size:.78rem;margin:auto;">Aucune donnée</div>'}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:.68rem;">
        <span style="color:#6b7280;">Cumul CA HT : <strong style="color:${EMERALD_D};">${fmt(cumulCA)}</strong></span>
        <span style="color:#6b7280;">Cumul charges HT : <strong style="color:#dc2626;">${fmt(cumulCharge)}</strong></span>
      </div>
    </div>
  </div>

  <!-- KPI secondaire -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;">
    ${kpiCard('fa-percent', '#0891b2', 'Charges engagées HT', fmt(chargesHT), 'Fournisseurs + ST ' + year)}
    ${kpiCard('fa-coins', EMERALD, 'Trésorerie nette', fmt(margeTreso), 'Encaissé − décaissé')}
    ${kpiCard('fa-file-invoice', '#3b82f6', 'Factures clients', String(fcY.length), 'émises sur ' + year)}
    ${kpiCard('fa-receipt', '#ef4444', 'Factures F/ST', String(ffY.length), 'reçues sur ' + year)}
  </div>

  <!-- ALERTS -->
  ${retards.length > 0 ? `
  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px 18px;margin-bottom:14px;">
    <div style="font-size:.8rem;font-weight:800;color:#b91c1c;margin-bottom:10px;"><i class="fas fa-exclamation-triangle mr-2"></i>Factures en retard (${retards.length})</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${retards.map(f => `
      <div style="background:white;border:1px solid #fecaca;border-radius:8px;padding:8px 14px;font-size:.75rem;">
        <span style="font-weight:700;color:#b91c1c;">${escX(f.num_facture)}</span>
        <span style="color:#6b7280;margin:0 6px;">·</span>
        <span>${escX(f.client_nom)}</span>
        <span style="color:#6b7280;margin:0 6px;">·</span>
        <span style="font-weight:700;color:#374151;">${fmt(f.montant_ttc)}</span>
        <span style="margin-left:8px;background:#fef2f2;color:#dc2626;border-radius:4px;padding:1px 7px;font-size:.68rem;font-weight:700;">J+${retardJours(f.date_echeance!)}</span>
        ${f.relance_count ? `<span style="margin-left:4px;font-size:.68rem;color:#9ca3af;">${f.relance_count} relance(s)</span>` : ''}
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${litiges.length > 0 ? `
  <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;margin-bottom:14px;">
    <div style="font-size:.8rem;font-weight:800;color:#92400e;margin-bottom:10px;"><i class="fas fa-exclamation-circle mr-2"></i>Litiges en cours (${litiges.length})</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${litiges.map(f => `
      <div style="background:white;border:1px solid #fde68a;border-radius:8px;padding:8px 14px;font-size:.75rem;">
        <span style="font-weight:700;color:#92400e;">${escX(f.num_facture)}</span>
        <span style="color:#6b7280;margin:0 6px;">·</span>
        <span>${escX(f.client_nom)}</span>
        <span style="color:#6b7280;margin:0 6px;">·</span>
        <span style="font-weight:700;color:#374151;">${fmt(f.montant_ttc)}</span>
        ${f.notes ? `<div style="font-size:.68rem;color:#92400e;margin-top:2px;"><i class="fas fa-info-circle mr-1"></i>${escX(f.notes)}</div>` : ''}
      </div>`).join('')}
    </div>
  </div>` : ''}

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
    <!-- TOP 5 CLIENTS -->
    <div class="card" style="padding:16px;">
      <div style="font-size:.75rem;font-weight:800;color:#374151;margin-bottom:12px;"><i class="fas fa-trophy mr-2" style="color:${EMERALD};"></i>Top 5 Clients par CA (${year})</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th ${TH}>Client</th>
          <th ${TH} style="text-align:right;">CA HT</th>
          <th ${TH} style="text-align:center;">Nb fact.</th>
        </tr></thead>
        <tbody>
          ${top5.map(([nom, v]) => `
          <tr>
            <td ${TD}><span style="font-weight:600;">${escX(nom)}</span></td>
            <td ${TD} style="text-align:right;font-weight:700;color:${EMERALD_D};">${fmt(v.total)}</td>
            <td ${TD} style="text-align:center;">${v.count}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <!-- CHARGES PAR CATÉGORIE -->
    <div class="card" style="padding:16px;">
      <div style="font-size:.75rem;font-weight:800;color:#374151;margin-bottom:12px;"><i class="fas fa-layer-group mr-2" style="color:#f59e0b;"></i>Charges à payer par catégorie</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th ${TH}>Compte charge</th>
          <th ${TH} style="text-align:right;">Montant HT</th>
        </tr></thead>
        <tbody>
          ${Object.entries(chargeMap).map(([k, v]) => `
          <tr>
            <td ${TD} style="font-size:.73rem;">${escX(k)}</td>
            <td ${TD} style="text-align:right;font-weight:700;color:#dc2626;">${fmt(v)}</td>
          </tr>`).join('')}
          <tr style="background:#fef2f2;">
            <td ${TD} style="font-weight:800;color:#b91c1c;">TOTAL</td>
            <td ${TD} style="text-align:right;font-weight:800;color:#b91c1c;">${fmt(Object.values(chargeMap).reduce((s,v)=>s+v,0))}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- PROCHAINES ÉCHÉANCES -->
  <div class="card" style="padding:16px;">
    <div style="font-size:.75rem;font-weight:800;color:#374151;margin-bottom:12px;"><i class="fas fa-calendar-check mr-2" style="color:#3b82f6;"></i>Prochaines échéances – 30 jours</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th ${TH}>Type</th>
        <th ${TH}>N° Facture</th>
        <th ${TH}>Tiers</th>
        <th ${TH}>Échéance</th>
        <th ${TH} style="text-align:right;">Montant TTC</th>
      </tr></thead>
      <tbody>
        ${soon.map(e => {
          const retard = retardJours(e.ech)
          return `<tr>
            <td ${TD}><span style="background:${e.type==='client'?'#eff6ff':'#fff7ed'};color:${e.type==='client'?'#1d4ed8':'#c2410c'};border-radius:4px;padding:1px 7px;font-size:.68rem;font-weight:700;">${e.type === 'client' ? 'CLIENT' : 'FOURN.'}</span></td>
            <td ${TD} style="font-weight:600;">${escX(e.num)}</td>
            <td ${TD}>${escX(e.nom)}</td>
            <td ${TD}>${e.ech}${retard > 0 ? ` <span style="color:#dc2626;font-weight:700;font-size:.68rem;">J+${retard}</span>` : ''}</td>
            <td ${TD} style="text-align:right;font-weight:700;">${fmt(e.ttc)}</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>
  </div>`
}

function kpiCard(icon: string, color: string, label: string, value: string, sub: string): string {
  return `<div class="card" style="padding:16px;border-top:3px solid ${color};">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div style="width:34px;height:34px;border-radius:10px;background:${color}18;display:flex;align-items:center;justify-content:center;color:${color};font-size:.95rem;flex-shrink:0;">
        <i class="fas ${icon}"></i>
      </div>
      <span style="font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;">${label}</span>
    </div>
    <div style="font-size:1.3rem;font-weight:900;color:#111827;">${value}</div>
    <div style="font-size:.67rem;color:#9ca3af;margin-top:2px;">${sub}</div>
  </div>`
}

// ─── TAB 2: FACTURES CLIENTS ───────────────────────────────────
function buildFacturesClients(fc: FactureClient[]): string {
  const aRelancer = fc.filter(f => ['envoyee','en_retard','partiellement_payee'].includes(f.statut))

  const clients = Array.from(new Set((fc || []).map((f: any) => f.client_nom).filter(Boolean))).sort()

  return `
  <!-- SUB-TABS FACTURES CLI -->
  <div style="display:flex;gap:0;border-bottom:2px solid #f1f5f9;margin-bottom:16px;">
    <button class="cpt-sub-fc" onclick="cptSwitchSub('fc',0)" style="padding:8px 20px;font-size:.78rem;font-weight:700;border:none;background:none;cursor:pointer;color:${EMERALD};border-bottom:2px solid ${EMERALD};margin-bottom:-2px;">Liste</button>
    <button class="cpt-sub-fc" onclick="cptSwitchSub('fc',1)" style="padding:8px 20px;font-size:.78rem;font-weight:700;border:none;background:none;cursor:pointer;color:#6b7280;border-bottom:2px solid transparent;margin-bottom:-2px;">Créer facture</button>
    <button class="cpt-sub-fc" onclick="cptSwitchSub('fc',2)" style="padding:8px 20px;font-size:.78rem;font-weight:700;border:none;background:none;cursor:pointer;color:#6b7280;border-bottom:2px solid transparent;margin-bottom:-2px;">Relances <span style="background:#ef4444;color:white;border-radius:999px;padding:1px 7px;font-size:.65rem;margin-left:4px;">${aRelancer.length}</span></button>
  </div>

  <!-- LISTE : en attente de règlement (haut) puis réglées (bas) -->
  <div class="cpt-sub-panel-fc">
    ${(() => {
      const isReglee = (s: string) => s === 'payee'
      const fcAttente = fc.filter(f => !isReglee(f.statut))
      const fcReglees = fc.filter(f => isReglee(f.statut))
      const rowFC = (f: FactureClient) => {
        const retard = f.date_echeance ? retardJours(f.date_echeance) : 0
        const retardStr = (f.statut === 'en_retard' && retard > 0) ? `<span style="color:#dc2626;font-weight:800;font-size:.75rem;">J+${retard}</span>` : `<span style="color:#9ca3af;font-size:.73rem;">—</span>`
        return `<tr style="transition:background .15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
          <td ${TD} style="font-weight:700;color:#1d4ed8;">${escX(f.num_facture || f.id)}${(f as any).partielle ? ' <span style="font-size:.58rem;font-weight:700;color:#b45309;background:#fffbeb;border-radius:5px;padding:1px 5px;">partielle</span>' : ''}</td>
          <td ${TD}>${escX(f.client_nom || '—')}</td>
          <td ${TD} style="font-size:.73rem;color:#6b7280;">${escX(f.num_affaire || '—')}</td>
          <td ${TD} style="font-size:.73rem;">${f.date_facture}</td>
          <td ${TD} style="font-size:.73rem;">${f.date_echeance || '—'}</td>
          <td ${TD} style="text-align:right;font-weight:600;">${fmt(f.montant_ht)}</td>
          <td ${TD} style="text-align:right;font-weight:700;">${fmt(f.montant_ttc)}</td>
          <td ${TD}>${statutCliBadge(f.statut)} ${retardStr}</td>
          <td ${TD}>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              ${f.statut === 'brouillon' ? `<button onclick="cptEnvoyerFacture('${f.id}')" style="padding:3px 10px;border-radius:6px;font-size:.68rem;font-weight:700;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;"><i class="fas fa-paper-plane mr-1"></i>Envoyer</button>` : ''}
              ${f.statut !== 'payee' && f.statut !== 'brouillon' ? `<button onclick="cptPayerFacture('${f.id}')" style="padding:3px 10px;border-radius:6px;font-size:.68rem;font-weight:700;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;"><i class="fas fa-check mr-1"></i>Payée</button>` : ''}
              <button onclick="cptExportPDF('${f.id}')" style="padding:3px 10px;border-radius:6px;font-size:.68rem;font-weight:700;border:none;background:#fef2f2;color:#dc2626;cursor:pointer;"><i class="fas fa-file-pdf mr-1"></i>PDF</button>
            </div>
          </td>
        </tr>`
      }
      const tableHead = `<thead><tr>${TH ? '' : ''}
        <th ${TH}>N° Facture</th><th ${TH}>Client</th><th ${TH}>Affaire</th><th ${TH}>Date</th><th ${TH}>Échéance</th>
        <th ${TH} style="text-align:right;">HT</th><th ${TH} style="text-align:right;">TTC</th><th ${TH}>Statut</th><th ${TH}>Actions</th>
      </tr></thead>`
      const totAttente = fcAttente.reduce((s, f) => s + (f.montant_ttc || 0), 0)
      const totReglees = fcReglees.reduce((s, f) => s + (f.montant_ttc || 0), 0)
      return `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <i class="fas fa-hourglass-half" style="color:#d97706;"></i><span style="font-weight:800;color:#111827;font-size:.92rem;">Factures en attente de règlement</span>
        <span style="background:#fffbeb;color:#b45309;border-radius:999px;padding:1px 10px;font-size:.7rem;font-weight:800;">${fcAttente.length}</span>
        <span style="margin-left:auto;font-size:.78rem;font-weight:700;color:#b45309;">${fmt(totAttente)} TTC</span>
      </div>
      <div class="card" style="overflow:hidden;margin-bottom:22px;">
        <table style="width:100%;border-collapse:collapse;">${tableHead}
          <tbody>${fcAttente.length ? fcAttente.map(rowFC).join('') : `<tr><td colspan="9" style="text-align:center;padding:22px;color:#9ca3af;">Aucune facture en attente</td></tr>`}</tbody>
        </table>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <i class="fas fa-check-circle" style="color:#16a34a;"></i><span style="font-weight:800;color:#111827;font-size:.92rem;">Factures réglées</span>
        <span style="background:#f0fdf4;color:#16a34a;border-radius:999px;padding:1px 10px;font-size:.7rem;font-weight:800;">${fcReglees.length}</span>
        <span style="margin-left:auto;font-size:.78rem;font-weight:700;color:#16a34a;">${fmt(totReglees)} TTC encaissés</span>
      </div>
      <div class="card" style="overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">${tableHead}
          <tbody>${fcReglees.length ? fcReglees.map(rowFC).join('') : `<tr><td colspan="9" style="text-align:center;padding:22px;color:#9ca3af;">Aucune facture réglée</td></tr>`}</tbody>
        </table>
      </div>`
    })()}
  </div>

  <!-- CRÉER FACTURE -->
  <div class="cpt-sub-panel-fc" style="display:none;">
    <div class="card" style="padding:24px;max-width:720px;">
      <div style="font-size:.85rem;font-weight:800;color:#374151;margin-bottom:20px;"><i class="fas fa-plus-circle mr-2" style="color:${EMERALD};"></i>Nouvelle facture client</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div>
          <label class="form-label">Client *</label>
          <select id="fact_client" class="form-input">
            <option value="">— Sélectionner —</option>
            ${clients.map(c => `<option value="${escX(c)}">${escX(c)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">N° Affaire *</label>
          <input id="fact_affaire" type="text" class="form-input" placeholder="CMD-2026-xxx"/>
        </div>
        <div>
          <label class="form-label">Date facture *</label>
          <input id="fact_date" type="date" class="form-input" value="2026-05-11"/>
        </div>
        <div>
          <label class="form-label">Date d&#39;échéance *</label>
          <input id="fact_ech" type="date" class="form-input" value="2026-06-11"/>
        </div>
        <div style="grid-column:1/-1;">
          <label class="form-label">Désignation / Prestations *</label>
          <textarea id="fact_desc" class="form-input" rows="3" placeholder="Détail des prestations ou références articles…"></textarea>
        </div>
        <div>
          <label class="form-label">Montant HT (€) *</label>
          <input id="fact_ht" type="number" class="form-input" placeholder="0.00" step="0.01" oninput="cptAutoTVA()"/>
        </div>
        <div>
          <label class="form-label">TVA 20% (€)</label>
          <input id="fact_tva" type="number" class="form-input" placeholder="0.00" step="0.01" readonly style="background:#f1f5f9;color:#6b7280;"/>
        </div>
        <div>
          <label class="form-label">Montant TTC (€)</label>
          <input id="fact_ttc" type="number" class="form-input" placeholder="0.00" step="0.01" readonly style="background:#f1f5f9;color:#6b7280;"/>
        </div>
        <div>
          <label class="form-label">Mode de paiement</label>
          <select id="fact_mode" class="form-input">
            <option>Virement</option>
            <option>Chèque</option>
            <option>Prélèvement</option>
            <option>LCR</option>
          </select>
        </div>
        <div style="grid-column:1/-1;">
          <label class="form-label">Notes internes</label>
          <textarea id="fact_notes" class="form-input" rows="2" placeholder="Observations, conditions particulières…"></textarea>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:20px;">
        <button onclick="cptCreerFacture()" class="btn btn-success"><i class="fas fa-file-invoice mr-2"></i>Créer la facture</button>
        <button onclick="cptSwitchSub('fc',0)" class="btn btn-secondary">Annuler</button>
      </div>
    </div>
  </div>

  <!-- RELANCES -->
  <div class="cpt-sub-panel-fc" style="display:none;">
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:12px;">
      <i class="fas fa-bell" style="color:#d97706;font-size:1.1rem;"></i>
      <div>
        <span style="font-weight:800;color:#92400e;">${aRelancer.length} facture(s) à relancer</span>
        <span style="color:#6b7280;font-size:.78rem;margin-left:8px;">—</span>
        <span style="font-weight:700;color:#92400e;margin-left:8px;">${fmt(aRelancer.reduce((s,f)=>s+f.montant_ttc,0))} en jeu</span>
      </div>
    </div>
    <div class="card" style="overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th ${TH}>N° Facture</th>
          <th ${TH}>Client</th>
          <th ${TH}>Échéance</th>
          <th ${TH} style="text-align:right;">Montant TTC</th>
          <th ${TH}>Statut</th>
          <th ${TH}>Nb relances</th>
          <th ${TH}>Action</th>
        </tr></thead>
        <tbody>
          ${aRelancer.map(f => `
          <tr>
            <td ${TD} style="font-weight:700;color:#1d4ed8;">${escX(f.num_facture)}</td>
            <td ${TD}>${escX(f.client_nom)}</td>
            <td ${TD}>${f.date_echeance||'—'}${f.statut==='en_retard'?` <span style="color:#dc2626;font-weight:800;font-size:.68rem;">J+${retardJours(f.date_echeance!)}</span>`:''}</td>
            <td ${TD} style="text-align:right;font-weight:700;">${fmt(f.montant_ttc)}</td>
            <td ${TD}>${statutCliBadge(f.statut)}</td>
            <td ${TD} style="text-align:center;">${f.relance_count ?? 0}</td>
            <td ${TD}>
              <button onclick="cptRelancer('${f.id}','${f.client_nom}')" style="padding:4px 12px;border-radius:7px;font-size:.73rem;font-weight:700;border:none;background:${EMERALD};color:white;cursor:pointer;"><i class="fas fa-envelope mr-1"></i>Envoyer relance</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`
}

// ─── TAB 3: À RÉGLER ──────────────────────────────────────────
// Champ de formulaire (avec id) pour la modale facture fournisseur/ST
function ff_fld(label: string, type: string, id: string, opts: string): string {
  const base = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .7rem;font-size:.83rem;outline:none;box-sizing:border-box;'
  const lab = `<label style="display:block;font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">${label}</label>`
  if (type === 'select') {
    const o = opts.split('|').map(x => {
      const lbl = x === 'fournisseur' ? 'Fournisseur' : x === 'sous_traitant' ? 'Sous-traitant' : x
      return `<option value="${x}">${lbl}</option>`
    }).join('')
    return `<div>${lab}<select id="${id}" style="${base}">${o}</select></div>`
  }
  const onin = id === 'ff_ht' || id === 'ff_tva' ? ' oninput="cptFournAutoTTC()"' : ''
  return `<div>${lab}<input id="${id}" type="${type}" placeholder="${opts || ''}"${onin} style="${base}"/></div>`
}

// ─── PROFORMA : circuit « payer d'abord, facture à la réception » ─────────────
// Aucune colonne dédiée : l'état se DÉDUIT de trois faits déjà en base —
//   1. la facture proforma existe sous l'identifiant déterministe `FF-<bcId>` ;
//   2. le bon de commande porte `attente_paiement` tant qu'elle n'est pas réglée ;
//   3. la facture définitive est une pièce jointe GED sous la référence `BC:<bcId>`.
// La facture n'arrive qu'à la réception : c'est pourquoi une commande reçue sans pièce
// jointe est signalée « facture à joindre ».
type EtatProforma = 'a_payer' | 'payee_attente' | 'a_facturer' | 'complete'
function proformaLignes(ff: FactureFournisseur[], bcs: any[], PJ: Record<string, { id: string; nom: string }>) {
  const bcById: Record<string, any> = {}
  for (const b of (bcs || [])) bcById[String((b as any).id)] = b
  const recu = (s: any) => ['recu', 'recu_total', 'recu_partiel', 'controle', 'cloture'].includes(String(s || ''))
  return (ff || [])
    .filter((f: any) => String(f.id || '').startsWith('FF-') && /proforma/i.test(String(f.notes || '')))
    .map((f: any) => {
      const bcId = String(f.id).slice(3)
      const bc = bcById[bcId]
      const payee = String(f.statut) === 'payee' || !!f.date_paiement
      const pj = PJ[String(f.id)] || null
      let etat: EtatProforma = 'a_payer'
      if (payee && pj) etat = 'complete'
      else if (payee && bc && recu(bc.statut)) etat = 'a_facturer'
      else if (payee) etat = 'payee_attente'
      return { f, bc, bcId, etat, pj, payee }
    })
    .sort((a, b) => String(a.f.date_facture || '').localeCompare(String(b.f.date_facture || '')))
}

function buildARegler(ff: FactureFournisseur[], fc: FactureClient[], PJ: Record<string, { id: string; nom: string }> = {}, bcs: any[] = []): string {
  const fournisseurs = ff.filter(f => f.type === 'fournisseur')
  const sousTraitants = ff.filter(f => f.type === 'sous_traitant')
  const historique = [
    ...fc.filter(f => f.statut === 'payee').map(f => ({ type:'client', num:f.num_facture!, nom:f.client_nom!, date:f.date_paiement||'—', mode:f.mode_paiement||'—', ttc:f.montant_ttc })),
    ...ff.filter(f => f.statut === 'payee').map(f => ({ type:'fourn', num:f.num_facture!, nom:f.fournisseur_nom!, date:f.date_paiement||'—', mode:f.mode_paiement||'—', ttc:f.montant_ttc })),
  ].sort((a,b) => b.date.localeCompare(a.date))

  const totalAPayer = fournisseurs.filter(f => ['a_payer','validee'].includes(f.statut)).reduce((s,f)=>s+f.montant_ttc,0)
  const totalST = sousTraitants.filter(f => ['a_payer','validee'].includes(f.statut)).reduce((s,f)=>s+f.montant_ttc,0)
  // Énergie / EDF : chaque mensualité est une facture fournisseur (compte 606) ; l'échéancier = ces factures triées par échéance.
  const edf = ff.filter(f => /(^|[^0-9])606/.test(String(f.compte_charge||'')) || /edf|électric|electric|énerg|energ/i.test(String(f.fournisseur_nom||''))).sort((a,b)=>String(a.date_echeance||a.date_facture||'').localeCompare(String(b.date_echeance||b.date_facture||'')))
  const edfTotal = edf.reduce((s,f)=>s+f.montant_ttc,0)
  const edfPaye = edf.filter(f=>f.statut==='payee').reduce((s,f)=>s+f.montant_ttc,0)
  const edfReste = edfTotal - edfPaye

  const PROF = proformaLignes(ff, bcs, PJ)
  const profSection = (titre: string, icone: string, coul: string, etat: EtatProforma, aide: string) => {
    const l = PROF.filter(x => x.etat === etat)
    const total = l.reduce((s, x) => s + (Number(x.f.montant_ttc) || 0), 0)
    const lignes = l.map(x => `
      <tr style="border-bottom:1px solid #f8fafc;">
        <td style="padding:9px 12px;font-weight:700;color:#374151;font-size:.78rem;">${escX(x.f.num_facture || x.f.id)}
          <div style="font-family:monospace;font-size:.64rem;color:#94a3b8;">${escX(x.bcId)}</div></td>
        <td style="padding:9px 12px;font-size:.78rem;">${escX(x.f.fournisseur_nom || '—')}
          <div style="font-size:.62rem;color:${x.f.type === 'sous_traitant' ? '#7c3aed' : '#0369a1'};font-weight:700;">${x.f.type === 'sous_traitant' ? 'Sous-traitant' : 'Fournisseur'}</div></td>
        <td style="padding:9px 12px;font-size:.75rem;color:#64748b;">${escX(String(x.f.date_facture || '—').slice(0, 10))}</td>
        <td style="padding:9px 12px;font-size:.75rem;color:#64748b;">${escX(x.bc ? String((x.bc as any).articles || '—').slice(0, 46) : '—')}</td>
        <td style="padding:9px 12px;text-align:right;font-weight:800;color:#111827;">${fmt(Number(x.f.montant_ttc) || 0)}</td>
        <td style="padding:9px 12px;text-align:center;font-size:.72rem;color:#64748b;">${x.bc ? escX(String((x.bc as any).statut || '—')) : '<span style="color:#cbd5e1;">BC introuvable</span>'}</td>
        <td style="padding:9px 12px;text-align:center;">${
          etat === 'a_facturer'
            ? `<label style="display:inline-flex;align-items:center;gap:5px;padding:4px 11px;background:#fef3c7;color:#92400e;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-paperclip"></i>Joindre la facture<input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style="display:none;" onchange="cptProfJoindre('${escX(x.bcId)}',this)"/></label>`
            : (x.pj ? `<a href="/api/ged/file/${escX(x.pj.id)}" target="_blank" style="color:#15803d;font-size:.72rem;font-weight:700;text-decoration:none;"><i class="fas fa-file-invoice" style="margin-right:4px;"></i>Facture</a>`
                    : '<span style="color:#cbd5e1;font-size:.72rem;">—</span>')
        }</td>
      </tr>`).join('')
    return `
    <div class="card" style="overflow:hidden;margin-bottom:16px;border-top:3px solid ${coul};">
      <div style="padding:11px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-weight:800;color:#111827;font-size:.86rem;"><i class="fas ${icone}" style="color:${coul};margin-right:7px;"></i>${titre}</span>
        <span style="background:${coul}1a;color:${coul};border-radius:999px;padding:1px 9px;font-size:.68rem;font-weight:800;">${l.length}</span>
        <span style="font-size:.7rem;color:#94a3b8;">${aide}</span>
        ${l.length ? `<span style="margin-left:auto;font-weight:900;color:${coul};">${fmt(total)}</span>` : ''}
      </div>
      ${l.length ? `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#fafafa;">
          <th ${TH}>Facture / BC</th><th ${TH}>Fournisseur</th><th ${TH}>Date</th><th ${TH}>Articles</th>
          <th ${TH} style="text-align:right;">TTC</th><th ${TH} style="text-align:center;">Statut BC</th><th ${TH} style="text-align:center;">Facture définitive</th>
        </tr></thead><tbody>${lignes}</tbody></table></div>`
        : '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:.8rem;">Aucune.</div>'}
    </div>`
  }

  const fournTable = (list: FactureFournisseur[]) => `
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th ${TH}>N° Facture</th>
        <th ${TH}>Fournisseur</th>
        <th ${TH}>Date</th>
        <th ${TH}>Échéance</th>
        <th ${TH} style="text-align:right;">HT</th>
        <th ${TH} style="text-align:right;">TTC</th>
        <th ${TH}>Compte charge</th>
        <th ${TH}>Statut</th>
        <th ${TH}>Actions</th>
      </tr></thead>
      <tbody>
        ${list.map(f => `<tr data-statut="${f.statut}">
          <td ${TD} style="font-weight:700;">${escX(f.num_facture)}</td>
          <td ${TD}>${escX(f.fournisseur_nom)}</td>
          <td ${TD} style="font-size:.73rem;">${f.date_facture}</td>
          <td ${TD} style="font-size:.73rem;">${f.date_echeance||'—'}</td>
          <td ${TD} style="text-align:right;">${fmt(f.montant_ht)}</td>
          <td ${TD} style="text-align:right;font-weight:700;">${fmt(f.montant_ttc)}</td>
          <td ${TD} style="font-size:.7rem;color:#6b7280;">${escX(f.compte_charge||'—')}</td>
          <td ${TD}><div style="display:flex;flex-direction:column;gap:3px;">${statutFournBadge(f.statut)}${valDirBadge(CPT_VD_MAP,'factures_fournisseur',f.id)}</div></td>
          <td ${TD}>
            <div style="display:flex;gap:4px;">
              ${f.statut === 'a_valider' ? `<button onclick="cptValiderFourn('${escX(f.id)}','${escX(f.num_facture||f.id)}','${escX(f.fournisseur_nom||'')}',${Number(f.montant_ttc)||0})" style="padding:3px 10px;border-radius:6px;font-size:.68rem;font-weight:700;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;"><i class="fas fa-check mr-1"></i>Valider</button>` : ''}
              ${['a_payer','validee'].includes(f.statut) ? `<button onclick="cptPayerFourn('${escX(f.id)}','${escX(f.num_facture||f.id)}','${escX(f.fournisseur_nom||'')}',${Number(f.montant_ttc)||0})" style="padding:3px 10px;border-radius:6px;font-size:.68rem;font-weight:700;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;"><i class="fas fa-money-bill mr-1"></i>Payer</button>` : ''}
              ${PJ[f.id] ? `<a href="/api/ged/file/${escX(PJ[f.id].id)}" target="_blank" rel="noopener" title="Ouvrir la facture jointe : ${escX(PJ[f.id].nom)}" style="padding:3px 10px;border-radius:6px;font-size:.68rem;font-weight:700;text-decoration:none;background:#f5f3ff;color:#6d28d9;display:inline-flex;align-items:center;gap:4px;"><i class="fas fa-paperclip"></i>Facture</a>` : ''}
              ${f.notes ? `<span title="${escX(f.notes)}" style="color:#d97706;cursor:help;"><i class="fas fa-exclamation-triangle"></i></span>` : ''}
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`

  return `
  <!-- BARRE D'ACTIONS -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
    <div style="font-size:.8rem;color:#6b7280;">Saisissez les factures <strong>fournisseurs</strong> et <strong>sous-traitants</strong> à régler — elles alimentent la marge brute du dashboard.</div>
    <button onclick="cptOpenFournModal()" style="padding:9px 18px;background:linear-gradient(135deg,${EMERALD},${EMERALD_D});color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;"><i class="fas fa-plus"></i>Nouvelle facture fournisseur / ST</button>
  </div>

  <!-- MODALE NOUVELLE FACTURE FOURN/ST -->
  <div id="cptFournModal" style="display:none;position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1000;align-items:center;justify-content:center;padding:20px;">
    <div style="background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:26px;max-width:620px;width:100%;max-height:90vh;overflow:auto;">
      <div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:18px;display:flex;align-items:center;gap:8px;"><i class="fas fa-hand-holding-usd" style="color:${EMERALD};"></i>Nouvelle facture fournisseur / sous-traitant</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        ${ff_fld('Type *','select','ff_type','fournisseur|sous_traitant')}
        ${ff_fld('N° Facture','text','ff_num','FOURN-2026-XXXX')}
      </div>
      <div style="margin-bottom:12px;">${ff_fld('Fournisseur / Sous-traitant *','text','ff_nom','Raison sociale')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        ${ff_fld('Date facture','date','ff_date','')}
        ${ff_fld('Échéance','date','ff_ech','')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">
        ${ff_fld('Montant HT *','number','ff_ht','0.00')}
        ${ff_fld('TVA %','number','ff_tva','20')}
        ${ff_fld('Montant TTC','number','ff_ttc','auto')}
      </div>
      <div style="margin-bottom:12px;">${ff_fld('Compte de charge','select','ff_compte','601100 – Matières premières|604100 – Sous-traitance|606100 – Consommables|606300 – Énergie|615000 – Entretien/maintenance|Autres')}</div>
      <div style="margin-bottom:4px;">${ff_fld('Notes','text','ff_notes','')}</div>
      <div style="margin:8px 0;"><label style="display:flex;align-items:center;gap:9px;padding:9px 12px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:9px;font-size:.76rem;color:#92400e;font-weight:600;cursor:pointer;"><input type="checkbox" id="ff_vd" style="width:16px;height:16px;accent-color:#f59e0b;"/><i class="fas fa-crown" style="color:#f59e0b;"></i>Soumettre cette facture à la validation de la Direction</label></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;">
        <button onclick="cptCloseFournModal()" style="padding:9px 20px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="cptSaveFourn()" style="padding:9px 22px;background:linear-gradient(135deg,${EMERALD},${EMERALD_D});color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Enregistrer</button>
      </div>
    </div>
  </div>

  <!-- SUB-TABS RÉGLER -->
  <div style="display:flex;gap:0;border-bottom:2px solid #f1f5f9;margin-bottom:16px;">
    <button class="cpt-sub-rg" onclick="cptSwitchSub('rg',0)" style="padding:8px 20px;font-size:.78rem;font-weight:700;border:none;background:none;cursor:pointer;color:${EMERALD};border-bottom:2px solid ${EMERALD};margin-bottom:-2px;">Fournisseurs</button>
    <button class="cpt-sub-rg" onclick="cptSwitchSub('rg',1)" style="padding:8px 20px;font-size:.78rem;font-weight:700;border:none;background:none;cursor:pointer;color:#6b7280;border-bottom:2px solid transparent;margin-bottom:-2px;">Sous-traitants</button>
    <button class="cpt-sub-rg" onclick="cptSwitchSub('rg',2)" style="padding:8px 20px;font-size:.78rem;font-weight:700;border:none;background:none;cursor:pointer;color:#6b7280;border-bottom:2px solid transparent;margin-bottom:-2px;">Historique règlements</button>
    <button class="cpt-sub-rg" onclick="cptSwitchSub('rg',3)" style="padding:8px 20px;font-size:.78rem;font-weight:700;border:none;background:none;cursor:pointer;color:#6b7280;border-bottom:2px solid transparent;margin-bottom:-2px;"><i class="fas fa-bolt mr-1" style="color:#f59e0b;"></i>Énergie / EDF</button>
    <button class="cpt-sub-rg" onclick="cptSwitchSub('rg',4)" style="padding:8px 20px;font-size:.78rem;font-weight:700;border:none;background:none;cursor:pointer;color:#6b7280;border-bottom:2px solid transparent;margin-bottom:-2px;"><i class="fas fa-file-invoice-dollar mr-1" style="color:#7c3aed;"></i>Proforma${PROF.length ? ` <span style="background:#ede9fe;color:#6d28d9;border-radius:999px;padding:0 8px;font-size:.66rem;font-weight:800;">${PROF.length}</span>` : ''}</button>
  </div>

  <!-- FOURNISSEURS -->
  <div class="cpt-sub-panel-rg">
    <div style="display:flex;gap:6px;margin-bottom:12px;">
      <button onclick="cptFiltreFourn('tous')" class="cpt-f-btn cpt-f-active" style="padding:5px 14px;border-radius:999px;font-size:.75rem;font-weight:700;border:1.5px solid ${EMERALD};background:${EMERALD};color:white;cursor:pointer;">Tous</button>
      <button onclick="cptFiltreFourn('a_valider')" class="cpt-f-btn" style="padding:5px 14px;border-radius:999px;font-size:.75rem;font-weight:700;border:1.5px solid #fde68a;background:white;color:#d97706;cursor:pointer;">À valider (${fournisseurs.filter(f=>f.statut==='a_valider').length})</button>
      <button onclick="cptFiltreFourn('a_payer')" class="cpt-f-btn" style="padding:5px 14px;border-radius:999px;font-size:.75rem;font-weight:700;border:1.5px solid #fecaca;background:white;color:#dc2626;cursor:pointer;">À payer (${fournisseurs.filter(f=>f.statut==='a_payer').length})</button>
      <button onclick="cptFiltreFourn('litige')" class="cpt-f-btn" style="padding:5px 14px;border-radius:999px;font-size:.75rem;font-weight:700;border:1.5px solid #ddd6fe;background:white;color:#7c3aed;cursor:pointer;">Litiges</button>
    </div>
    <div class="card" style="overflow:hidden;" id="tblFourn">
      ${fournTable(fournisseurs)}
    </div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 16px;margin-top:12px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-weight:800;color:#b91c1c;font-size:.82rem;"><i class="fas fa-exclamation-circle mr-2"></i>Total à régler – Fournisseurs</span>
      <span style="font-weight:900;font-size:1.1rem;color:#b91c1c;">${fmt(totalAPayer)}</span>
    </div>
  </div>

  <!-- SOUS-TRAITANTS -->
  <div class="cpt-sub-panel-rg" style="display:none;">
    <div class="card" style="overflow:hidden;margin-bottom:12px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th ${TH}>N° Facture</th>
          <th ${TH}>Sous-traitant</th>
          <th ${TH}>Date</th>
          <th ${TH}>Échéance</th>
          <th ${TH} style="text-align:right;">HT</th>
          <th ${TH} style="text-align:right;">TTC</th>
          <th ${TH}>Compte</th>
          <th ${TH}>Statut</th>
          <th ${TH}>Actions</th>
        </tr></thead>
        <tbody>
          ${sousTraitants.map(f => `<tr>
            <td ${TD} style="font-weight:700;">${escX(f.num_facture)}</td>
            <td ${TD}>${escX(f.fournisseur_nom)}</td>
            <td ${TD} style="font-size:.73rem;">${f.date_facture}</td>
            <td ${TD} style="font-size:.73rem;">${f.date_echeance||'—'}</td>
            <td ${TD} style="text-align:right;">${fmt(f.montant_ht)}</td>
            <td ${TD} style="text-align:right;font-weight:700;">${fmt(f.montant_ttc)}</td>
            <td ${TD} style="font-size:.7rem;color:#6b7280;">${escX(f.compte_charge||'604100')}</td>
            <td ${TD}><div style="display:flex;flex-direction:column;gap:3px;">${statutFournBadge(f.statut)}${valDirBadge(CPT_VD_MAP,'factures_fournisseur',f.id)}</div></td>
            <td ${TD}>
              <div style="display:flex;gap:4px;">
                ${f.statut === 'a_valider' ? `<button onclick="cptValiderFourn('${escX(f.id)}','${escX(f.num_facture||f.id)}','${escX(f.fournisseur_nom||'')}',${Number(f.montant_ttc)||0})" style="padding:3px 10px;border-radius:6px;font-size:.68rem;font-weight:700;border:none;background:#eff6ff;color:#2563eb;cursor:pointer;"><i class="fas fa-check mr-1"></i>Valider</button>` : ''}
                ${['a_payer','validee'].includes(f.statut) ? `<button onclick="cptPayerFourn('${escX(f.id)}','${escX(f.num_facture||f.id)}','${escX(f.fournisseur_nom||'')}',${Number(f.montant_ttc)||0})" style="padding:3px 10px;border-radius:6px;font-size:.68rem;font-weight:700;border:none;background:#f0fdf4;color:#16a34a;cursor:pointer;"><i class="fas fa-money-bill mr-1"></i>Payer</button>` : ''}
                ${f.notes ? `<span title="${escX(f.notes)}" style="color:#d97706;cursor:help;"><i class="fas fa-exclamation-triangle"></i></span>` : ''}
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-weight:800;color:#b91c1c;font-size:.82rem;"><i class="fas fa-exclamation-circle mr-2"></i>Total à régler – Sous-traitants</span>
      <span style="font-weight:900;font-size:1.1rem;color:#b91c1c;">${fmt(totalST)}</span>
    </div>
  </div>

  <!-- HISTORIQUE -->
  <div class="cpt-sub-panel-rg" style="display:none;">
    <div class="card" style="overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th ${TH}>Type</th>
          <th ${TH}>N° Facture</th>
          <th ${TH}>Tiers</th>
          <th ${TH}>Date paiement</th>
          <th ${TH}>Mode</th>
          <th ${TH} style="text-align:right;">Montant TTC</th>
        </tr></thead>
        <tbody>
          ${historique.map(h => `<tr>
            <td ${TD}><span style="background:${h.type==='client'?'#eff6ff':'#fff7ed'};color:${h.type==='client'?'#1d4ed8':'#c2410c'};border-radius:4px;padding:1px 7px;font-size:.68rem;font-weight:700;">${h.type === 'client' ? 'CLIENT' : 'FOURN.'}</span></td>
            <td ${TD} style="font-weight:600;">${escX(h.num)}</td>
            <td ${TD}>${escX(h.nom)}</td>
            <td ${TD}>${h.date}</td>
            <td ${TD}><span style="background:#f0fdf4;color:#15803d;border-radius:4px;padding:1px 8px;font-size:.72rem;font-weight:600;">${escX(h.mode)}</span></td>
            <td ${TD} style="text-align:right;font-weight:700;color:${h.type==='client'?EMERALD_D:'#dc2626'};">${fmt(h.ttc)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- ÉNERGIE / EDF (échéancier) -->
  <div class="cpt-sub-panel-rg" style="display:none;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:.8rem;color:#6b7280;max-width:640px;">Échéancier des factures <strong>EDF</strong> (mensualités estimées + régularisation annuelle). Chaque échéance est une facture fournisseur au compte <strong>606300 – Énergie</strong> ; le <em>report</em> = le reste à payer, repris automatiquement dans la prévision de trésorerie.</div>
      <button onclick="cptOpenEdfModal()" style="padding:9px 18px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;"><i class="fas fa-bolt"></i>Nouvelle échéance EDF</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;"><div style="font-size:.66rem;color:#92400e;font-weight:800;text-transform:uppercase;">Total EDF</div><div style="font-size:1.2rem;font-weight:900;color:#b45309;">${fmt(edfTotal)}</div></div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 16px;"><div style="font-size:.66rem;color:#166534;font-weight:800;text-transform:uppercase;">Payé</div><div style="font-size:1.2rem;font-weight:900;color:#15803d;">${fmt(edfPaye)}</div></div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;"><div style="font-size:.66rem;color:#b91c1c;font-weight:800;text-transform:uppercase;">Reste à payer (report)</div><div style="font-size:1.2rem;font-weight:900;color:#dc2626;">${fmt(edfReste)}</div></div>
    </div>
    <div class="card" style="overflow:hidden;">
      ${edf.length ? fournTable(edf) : '<div style="padding:28px;text-align:center;color:#94a3b8;font-size:.85rem;"><i class="fas fa-bolt" style="display:block;font-size:1.6rem;margin-bottom:6px;color:#fde68a;"></i>Aucune facture EDF. Cliquez « Nouvelle échéance EDF » pour saisir les mensualités et la régularisation.</div>'}
    </div>
    <script>function cptOpenEdfModal(){ if(typeof cptOpenFournModal==='function')cptOpenFournModal(); var n=document.getElementById('ff_nom'); if(n)n.value='EDF'; var c=document.getElementById('ff_compte'); if(c)c.value='606300 – Énergie'; var t=document.getElementById('ff_type'); if(t)t.value='fournisseur'; var num=document.getElementById('ff_num'); if(num&&!num.value)num.value='EDF-'+(new Date().getFullYear()); }<\/script>
  </div>

  <!-- PROFORMA (fournisseurs & sous-traitants) -->
  <div class="cpt-sub-panel-rg" style="display:none;">
    <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:11px 16px;margin-bottom:16px;font-size:.8rem;color:#5b21b6;">
      <i class="fas fa-circle-info" style="margin-right:7px;"></i><strong>Commandes payées d'avance.</strong>
      Le fournisseur exige le règlement avant d'expédier : la proforma se paie d'abord, le bon de commande reste bloqué jusque-là,
      et la <strong>facture définitive n'arrive qu'à la réception</strong> — c'est à ce moment qu'on la joint ici.
    </div>
    ${profSection('1. À payer', 'fa-hourglass-half', '#dc2626', 'a_payer', 'Le bon de commande est bloqué tant que ce règlement n\'est pas fait.')}
    ${profSection('2. Payées — livraison attendue', 'fa-truck-fast', '#0ea5e9', 'payee_attente', 'Réglées : le bon de commande est libéré et part chez le fournisseur.')}
    ${profSection('3. Reçues — facture à joindre', 'fa-paperclip', '#d97706', 'a_facturer', 'La marchandise est arrivée : la facture définitive doit maintenant être versée au dossier.')}
    ${profSection('4. Complètes', 'fa-circle-check', '#16a34a', 'complete', 'Payées, reçues, facture au dossier — rien à faire.')}
    <script>
    function cptProfJoindre(bcId, input){
      var f = input.files && input.files[0]; if(!f) return;
      var fd = new FormData(); fd.append('file', f); fd.append('ref', 'BC:'+bcId); fd.append('categorie','facture_fournisseur');
      fetch('/api/ged/upload',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Le document n a pas pu etre joint.',7000); return; }
        pushNotif('ok','fa-paperclip','Facture jointe au bon de commande '+bcId+'.',4500);
        setTimeout(function(){ softReload(); }, 800);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
    }
    <\/script>
  </div>`
}

// ─── TAB 4: GRAND LIVRE ───────────────────────────────────────
function buildGrandLivre(ec: EcritureComptable[]): string {
  const totalDebit = ec.reduce((s, e) => s + e.debit, 0)
  const totalCredit = ec.reduce((s, e) => s + e.credit, 0)
  const solde = totalDebit - totalCredit

  return `
  <!-- FILTERS GRAND LIVRE -->
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">
    <div style="display:flex;gap:4px;">
      <button onclick="cptFiltreGL('tous')" style="padding:5px 14px;border-radius:999px;font-size:.75rem;font-weight:700;border:1.5px solid ${EMERALD};background:${EMERALD};color:white;cursor:pointer;">Tous journaux</button>
      ${['VTE','ACH','BQ','OD','SAL'].map(j => `<button onclick="cptFiltreGL('${j}')" style="padding:5px 12px;border-radius:999px;font-size:.75rem;font-weight:700;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;">${j}</button>`).join('')}
    </div>
    <div style="margin-left:auto;display:flex;gap:6px;align-items:center;">
      <input id="glSearch" type="text" placeholder="Rechercher compte / libellé…" oninput="cptSearchGL(this.value)" style="padding:6px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.78rem;width:200px;outline:none;"/>
      <input id="fecAnnee" type="number" min="2020" max="2099" value="${new Date().getFullYear()}" title="Année d'exercice" style="padding:6px 8px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.78rem;width:74px;outline:none;"/>
      <button onclick="window.location='/api/compta/export-fec?annee='+encodeURIComponent(document.getElementById('fecAnnee').value||'')" title="Export FEC (Fichier des Écritures Comptables) — importable dans Sage / expert-comptable" style="padding:6px 13px;border-radius:8px;border:none;background:linear-gradient(135deg,${EMERALD},#047857);color:white;font-size:.76rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="fas fa-file-export" style="margin-right:5px;"></i>Export FEC (Sage)</button>
    </div>
  </div>

  <div class="card" style="overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;" id="tblGL">
      <thead><tr>
        <th ${TH}>Date</th>
        <th ${TH}>Journal</th>
        <th ${TH}>Pièce</th>
        <th ${TH}>Compte</th>
        <th ${TH}>Libellé</th>
        <th ${TH} style="text-align:right;">Débit</th>
        <th ${TH} style="text-align:right;">Crédit</th>
        <th ${TH} style="text-align:center;">Lettrage</th>
        <th ${TH} style="text-align:center;">Validé</th>
      </tr></thead>
      <tbody>
        ${ec.map(e => `<tr data-journal="${e.journal}" data-compte="${escX(e.compte)}" data-libelle="${escX(e.libelle||'')}" style="transition:background .15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
          <td ${TD} style="font-size:.73rem;">${e.date_ecriture}</td>
          <td ${TD}>${journalBadge(e.journal)}</td>
          <td ${TD} style="font-size:.72rem;color:#6b7280;font-family:monospace;">${escX(e.piece||'—')}</td>
          <td ${TD} style="font-family:monospace;font-size:.78rem;font-weight:700;color:#1d4ed8;">${escX(e.compte)}</td>
          <td ${TD} style="max-width:200px;">${escX(e.libelle||'—')}</td>
          <td ${TD} style="text-align:right;font-weight:${e.debit>0?'700':'400'};color:${e.debit>0?'#1d4ed8':'#9ca3af'};">${e.debit > 0 ? fmt(e.debit) : '—'}</td>
          <td ${TD} style="text-align:right;font-weight:${e.credit>0?'700':'400'};color:${e.credit>0?'#dc2626':'#9ca3af'};">${e.credit > 0 ? fmt(e.credit) : '—'}</td>
          <td ${TD} style="text-align:center;font-family:monospace;font-weight:700;color:#7c3aed;font-size:.75rem;">${escX(e.lettrage||'')}</td>
          <td ${TD} style="text-align:center;">${e.valide ? '<i class="fas fa-check-circle" style="color:#16a34a;"></i>' : '<i class="fas fa-clock" style="color:#d97706;"></i>'}</td>
        </tr>`).join('')}
      </tbody>
      <tfoot>
        <tr style="background:#f0fdf4;border-top:2px solid #bbf7d0;">
          <td colspan="5" ${TD} style="font-weight:800;color:#374151;text-align:right;">TOTAUX</td>
          <td ${TD} style="text-align:right;font-weight:900;color:#1d4ed8;font-size:.88rem;">${fmt(totalDebit)}</td>
          <td ${TD} style="text-align:right;font-weight:900;color:#dc2626;font-size:.88rem;">${fmt(totalCredit)}</td>
          <td colspan="2" ${TD} style="text-align:center;font-weight:700;color:${solde>=0?'#1d4ed8':'#dc2626'};">Solde: ${fmt(Math.abs(solde))} ${solde>=0?'D':'C'}</td>
        </tr>
      </tfoot>
    </table>
  </div>`
}

// ─── TAB 5: TVA & DÉCLARATIONS ────────────────────────────────
function buildTVA(ec: EcritureComptable[]): string {
  // Périodes dynamiques : mois courant + mois précédent (date limite CA3 = le 19 du mois M+1)
  const _now = new Date()
  const _ym = (dt: Date) => dt.toISOString().slice(0, 7)
  const _moisLabel = (dt: Date) => { const s = dt.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1) }
  const _ca3 = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth() + 1, 19).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const _dCur = new Date(_now.getFullYear(), _now.getMonth(), 1)
  const _dPrev = new Date(_now.getFullYear(), _now.getMonth() - 1, 1)
  const curLabel = _moisLabel(_dCur), prevLabel = _moisLabel(_dPrev), curCa3 = _ca3(_dCur), prevCa3 = _ca3(_dPrev)

  // Mois courant
  const ecMai = ec.filter(e => e.date_ecriture.startsWith(_ym(_dCur)))
  const tvaMaiCollectee = ecMai.filter(e => e.compte.startsWith('4457')).reduce((s,e)=>s+e.credit,0)
  const tvaMaiDeductible = ecMai.filter(e => e.compte.startsWith('4456')).reduce((s,e)=>s+e.debit,0)
  const tvaMaiNette = tvaMaiCollectee - tvaMaiDeductible

  // Mois précédent (M-1)
  const ecAvril = ec.filter(e => e.date_ecriture.startsWith(_ym(_dPrev)))
  const tvaAvrilCollectee = ecAvril.filter(e => e.compte.startsWith('4457')).reduce((s,e)=>s+e.credit,0)
  const tvaAvrilDeductible = ecAvril.filter(e => e.compte.startsWith('4456')).reduce((s,e)=>s+e.debit,0)
  const tvaAvrilNette = tvaAvrilCollectee - tvaAvrilDeductible

  return `
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
    ${kpiCard('fa-receipt', '#dc2626', 'TVA Collectée (' + curLabel + ')', fmt(tvaMaiCollectee), 'Compte 4457xx – crédit')}
    ${kpiCard('fa-minus-circle', EMERALD, 'TVA Déductible (' + curLabel + ')', fmt(tvaMaiDeductible), 'Compte 4456xx – débit')}
    ${kpiCard('fa-balance-scale', '#7c3aed', 'TVA nette à reverser', fmt(tvaMaiNette), 'Collectée – Déductible')}
    ${kpiCard('fa-calendar-check', '#f59e0b', 'Date déclaration CA3', curCa3, 'Dépôt avant le 19 du mois M+1')}
  </div>

  <!-- TABLEAU PÉRIODES -->
  <div class="card" style="overflow:hidden;margin-bottom:20px;">
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th ${TH}>Période</th>
        <th ${TH} style="text-align:right;">TVA Collectée</th>
        <th ${TH} style="text-align:right;">TVA Déductible</th>
        <th ${TH} style="text-align:right;">TVA Nette</th>
        <th ${TH}>Date limite CA3</th>
        <th ${TH}>Statut</th>
      </tr></thead>
      <tbody>
        <tr style="background:#fef2f2;">
          <td ${TD} style="font-weight:700;">${curLabel}</td>
          <td ${TD} style="text-align:right;color:#dc2626;font-weight:700;">${fmt(tvaMaiCollectee)}</td>
          <td ${TD} style="text-align:right;color:${EMERALD_D};font-weight:700;">${fmt(tvaMaiDeductible)}</td>
          <td ${TD} style="text-align:right;font-weight:900;color:#7c3aed;">${fmt(tvaMaiNette)}</td>
          <td ${TD}>${curCa3}</td>
          <td ${TD}><span style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:999px;padding:2px 10px;font-size:.7rem;font-weight:700;">En cours</span></td>
        </tr>
        <tr>
          <td ${TD} style="font-weight:700;">${prevLabel}</td>
          <td ${TD} style="text-align:right;color:#dc2626;font-weight:700;">${fmt(tvaAvrilCollectee)}</td>
          <td ${TD} style="text-align:right;color:${EMERALD_D};font-weight:700;">${fmt(tvaAvrilDeductible)}</td>
          <td ${TD} style="text-align:right;font-weight:900;color:#7c3aed;">${fmt(tvaAvrilNette)}</td>
          <td ${TD}>${prevCa3}</td>
          <td ${TD}><span style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:999px;padding:2px 10px;font-size:.7rem;font-weight:700;">À déclarer</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- DÉTAIL AVRIL -->
  <div class="card" style="padding:20px;margin-bottom:16px;">
    <div style="font-size:.82rem;font-weight:800;color:#374151;margin-bottom:16px;"><i class="fas fa-search-dollar mr-2" style="color:#7c3aed;"></i>Détail déclaration – ${prevLabel}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div>
        <div style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">TVA Collectée (opérations imposables)</div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr><th ${TH}>Compte</th><th ${TH}>Libellé</th><th ${TH} style="text-align:right;">Montant</th></tr></thead>
          <tbody>
            ${ecAvril.filter(e=>e.compte.startsWith('4457')&&e.credit>0).map(e=>`
            <tr><td ${TD} style="font-family:monospace;font-size:.73rem;">${escX(e.compte)}</td><td ${TD} style="font-size:.73rem;">${escX(e.libelle||'')}</td><td ${TD} style="text-align:right;font-weight:700;color:#dc2626;">${fmt(e.credit)}</td></tr>`).join('')}
            <tr style="background:#fef2f2;"><td colspan="2" ${TD} style="font-weight:800;">Total collectée</td><td ${TD} style="text-align:right;font-weight:900;color:#dc2626;">${fmt(tvaAvrilCollectee)}</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <div style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">TVA Déductible (achats)</div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr><th ${TH}>Compte</th><th ${TH}>Libellé</th><th ${TH} style="text-align:right;">Montant</th></tr></thead>
          <tbody>
            ${ecAvril.filter(e=>e.compte.startsWith('4456')&&e.debit>0).map(e=>`
            <tr><td ${TD} style="font-family:monospace;font-size:.73rem;">${escX(e.compte)}</td><td ${TD} style="font-size:.73rem;">${escX(e.libelle||'')}</td><td ${TD} style="text-align:right;font-weight:700;color:${EMERALD_D};">${fmt(e.debit)}</td></tr>`).join('')}
            <tr style="background:#f0fdf4;"><td colspan="2" ${TD} style="font-weight:800;">Total déductible</td><td ${TD} style="text-align:right;font-weight:900;color:${EMERALD_D};">${fmt(tvaAvrilDeductible)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    <div style="margin-top:16px;display:flex;align-items:center;gap:12px;padding:12px 16px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;">
      <span style="font-weight:800;color:#5b21b6;font-size:.85rem;">TVA nette à reverser (${prevLabel}) :</span>
      <span style="font-weight:900;font-size:1.1rem;color:#7c3aed;">${fmt(tvaAvrilNette)}</span>
      <button onclick="cptExporterCA3()" style="margin-left:auto;padding:7px 18px;border-radius:9px;font-size:.78rem;font-weight:700;border:none;background:#7c3aed;color:white;cursor:pointer;"><i class="fas fa-percent mr-2"></i>Préparer déclaration CA3</button>
    </div>
  </div>`
}

// ─── TAB 6: BALANCE & TRÉSORERIE ──────────────────────────────
function buildBalance(ec: EcritureComptable[], fc: any[] = [], ff: any[] = []): string {
  // Compute balance by account
  // Comptes agrégés par RACINE PCG (non chevauchantes) : les générateurs d'écritures écrivent
  //   411000/707000/607000/401000/445710/445660/512000/531000, alors que la balance ne sommait
  //   que 411100/706100/601100 → elle affichait 0 sur Clients/Ventes/Achats malgré l'activité.
  //   On agrège désormais par racine, ce qui est aussi le comportement comptable attendu
  //   (les sous-comptes remontent sur leur compte collectif).
  const accounts: { code: string; label: string }[] = [
    { code:'411', label:'Clients' },
    { code:'401', label:'Fournisseurs' },
    { code:'512', label:'Banque' },
    { code:'531', label:'Caisse' },
    { code:'421', label:'Personnel – rémunérations' },
    { code:'431', label:'Cotis. sociales patronales' },
    { code:'601', label:'Achats matières premières' },
    { code:'604', label:'Sous-traitance' },
    { code:'606', label:'Énergie / fournitures non stockables' },
    { code:'607', label:'Achats de marchandises' },
    { code:'622', label:'Honoraires et frais' },
    { code:'641', label:'Salaires bruts' },
    { code:'681', label:'Dotations amort.' },
    { code:'701', label:'Ventes de produits finis' },
    { code:'706', label:'Prestations de services' },
    { code:'707', label:'Ventes de marchandises' },
    { code:'445710', label:'TVA collectée' },
    { code:'445660', label:'TVA déductible' },
  ]

  // Agrégation par PRÉFIXE de compte (un code complet reste un préfixe exact de lui-même).
  const getBalance = (code: string) => {
    const rows = ec.filter(e => String(e.compte || '').startsWith(code))
    const d = rows.reduce((s, e) => s + e.debit, 0)
    const c = rows.reduce((s, e) => s + e.credit, 0)
    return { debit: d, credit: c, soldeDeb: Math.max(0, d - c), soldeCred: Math.max(0, c - d) }
  }

  // Trésorerie — solde réel BANQUE (512) + CAISSE (531 : règlements en espèces, sinon invisibles)
  const bq = getBalance('512')
  const cs = getBalance('531')
  const soldeBanque = (bq.debit - bq.credit) + (cs.debit - cs.credit)
  // Prévisions J+30 : échéances RÉELLES des factures non payées (clients = encaissements, fournisseurs = décaissements)
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const ttc = (f: any) => Number(f.montant_ttc) || 0
  const encaissPrev = (fc || []).filter((f: any) => !f.date_paiement && f.statut !== 'payee' && f.date_echeance && String(f.date_echeance).slice(0, 10) <= in30).reduce((s: number, f: any) => s + ttc(f), 0)
  const decaissPrev = (ff || []).filter((f: any) => f.statut !== 'payee' && f.date_echeance && String(f.date_echeance).slice(0, 10) <= in30).reduce((s: number, f: any) => s + ttc(f), 0)
  const prevision30 = soldeBanque + encaissPrev - decaissPrev

  // Tendance trésorerie : solde mensuel CUMULÉ réel du compte 512000 (depuis les écritures)
  const yearRef = ec.reduce((y: string, e: any) => { const ey = String(e.date_ecriture || '').slice(0, 4); return ey > y ? ey : y }, String(new Date().getFullYear()))
  const moveBq = ec.filter(e => { const cc = String(e.compte || ''); return cc.startsWith('512') || cc.startsWith('531') })
  const curMonthIdx = String(yearRef) === String(new Date().getFullYear()) ? new Date().getMonth() : 11
  const MLAB = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const months: { label: string; val: number }[] = []
  for (let m = 0; m <= curMonthIdx; m++) {
    const endDate = new Date(Date.UTC(Number(yearRef), m + 1, 1)).toISOString().slice(0, 10)
    const cumul = moveBq.filter(e => String(e.date_ecriture || '').slice(0, 10) < endDate).reduce((s, e) => s + (e.debit - e.credit), 0)
    months.push({ label: MLAB[m], val: cumul })
  }
  if (!months.length) months.push({ label: MLAB[0], val: soldeBanque })
  const maxVal = Math.max(1, ...months.map(m => Math.abs(m.val)))

  return `
  <!-- BALANCE COMPTABLE -->
  <div class="card" style="overflow:hidden;margin-bottom:20px;">
    <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;font-size:.8rem;font-weight:800;color:#374151;"><i class="fas fa-book-open mr-2" style="color:${EMERALD};"></i>Balance des comptes</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th ${TH}>N° Compte</th>
        <th ${TH}>Intitulé</th>
        <th ${TH} style="text-align:right;">Total Débit</th>
        <th ${TH} style="text-align:right;">Total Crédit</th>
        <th ${TH} style="text-align:right;color:#1d4ed8;">Solde Débiteur</th>
        <th ${TH} style="text-align:right;color:#dc2626;">Solde Créditeur</th>
      </tr></thead>
      <tbody>
        ${accounts.map(a => {
          const b = getBalance(a.code)
          if (b.debit === 0 && b.credit === 0) return ''
          return `<tr onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
            <td ${TD} style="font-family:monospace;font-weight:700;color:#1d4ed8;">${a.code}</td>
            <td ${TD}>${a.label}</td>
            <td ${TD} style="text-align:right;color:#374151;">${b.debit > 0 ? fmt(b.debit) : '—'}</td>
            <td ${TD} style="text-align:right;color:#374151;">${b.credit > 0 ? fmt(b.credit) : '—'}</td>
            <td ${TD} style="text-align:right;font-weight:${b.soldeDeb>0?'700':'400'};color:${b.soldeDeb>0?'#1d4ed8':'#9ca3af'};">${b.soldeDeb > 0 ? fmt(b.soldeDeb) : '—'}</td>
            <td ${TD} style="text-align:right;font-weight:${b.soldeCred>0?'700':'400'};color:${b.soldeCred>0?'#dc2626':'#9ca3af'};">${b.soldeCred > 0 ? fmt(b.soldeCred) : '—'}</td>
          </tr>`
        }).join('')}
      </tbody>
      <tfoot>
        <tr style="background:#f0fdf4;border-top:2px solid #bbf7d0;">
          <td colspan="2" ${TD} style="font-weight:800;">TOTAUX</td>
          <td ${TD} style="text-align:right;font-weight:900;color:#1d4ed8;">${fmt(ec.reduce((s,e)=>s+e.debit,0))}</td>
          <td ${TD} style="text-align:right;font-weight:900;color:#dc2626;">${fmt(ec.reduce((s,e)=>s+e.credit,0))}</td>
          <td colspan="2" ${TD}></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- TRÉSORERIE -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div class="card" style="padding:20px;">
      <div style="font-size:.8rem;font-weight:800;color:#374151;margin-bottom:16px;"><i class="fas fa-piggy-bank mr-2" style="color:#3b82f6;"></i>Trésorerie estimée</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:10px;padding:14px;">
          <div style="font-size:.68rem;font-weight:700;color:#1d4ed8;text-transform:uppercase;margin-bottom:4px;">Solde bancaire</div>
          <div style="font-size:1.2rem;font-weight:900;color:#1e40af;">${fmt(soldeBanque)}</div>
          <div style="font-size:.65rem;color:#6b7280;margin-top:2px;">Compte 512000</div>
        </div>
        <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:10px;padding:14px;">
          <div style="font-size:.68rem;font-weight:700;color:${EMERALD_D};text-transform:uppercase;margin-bottom:4px;">Prévision J+30</div>
          <div style="font-size:1.2rem;font-weight:900;color:${prevision30>=0?EMERALD_D:'#dc2626'};">${fmt(prevision30)}</div>
          <div style="font-size:.65rem;color:#6b7280;margin-top:2px;">Encaiss. – Décaiss.</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;">
          <div style="font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Encaissements prévus</div>
          <div style="font-size:.95rem;font-weight:700;color:${EMERALD_D};">+${fmt(encaissPrev)}</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;">
          <div style="font-size:.65rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;">Décaissements prévus</div>
          <div style="font-size:.95rem;font-weight:700;color:#dc2626;">-${fmt(decaissPrev)}</div>
        </div>
      </div>
    </div>

    <!-- CASH FLOW BAR CHART -->
    <div class="card" style="padding:20px;">
      <div style="font-size:.8rem;font-weight:800;color:#374151;margin-bottom:16px;"><i class="fas fa-chart-bar mr-2" style="color:${EMERALD};"></i>Tendance trésorerie (${yearRef})</div>
      <div style="display:flex;align-items:flex-end;gap:10px;height:140px;padding-bottom:28px;border-bottom:2px solid #f1f5f9;position:relative;">
        ${months.map((m, i) => {
          const pct = Math.max(0, Math.round((m.val / maxVal) * 100))
          const isLast = i === months.length - 1
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div style="font-size:.62rem;font-weight:700;color:${isLast?EMERALD_D:'#6b7280'};">${fmt(m.val).replace(' €','')}</div>
            <div style="width:100%;background:${isLast?EMERALD:'#3b82f6'};border-radius:4px 4px 0 0;height:${pct}%;min-height:4px;transition:height .3s;opacity:${isLast?'1':'0.7'};"></div>
          </div>`
        }).join('')}
      </div>
      <div style="display:flex;gap:10px;padding-top:6px;">
        ${months.map((m,i) => `<div style="flex:1;text-align:center;font-size:.65rem;font-weight:${i===months.length-1?'800':'600'};color:${i===months.length-1?EMERALD_D:'#9ca3af'};">${m.label}</div>`).join('')}
      </div>
      <div style="margin-top:10px;font-size:.68rem;color:#9ca3af;text-align:center;"><i class="fas fa-info-circle mr-1"></i>Solde bancaire mensuel estimé (compte 512)</div>
    </div>
  </div>`
}

// ─── MAIN EXPORT ──────────────────────────────────────────────
// ─── TAB FACTURATION : regroupe Factures clients + Factures fournisseurs/ST ───
function buildFacturation(fc: FactureClient[], ff: FactureFournisseur[], PJ: Record<string, { id: string; nom: string }> = {}, bcs: any[] = []): string {
  const aRegler = ff.filter(f => ['a_payer', 'validee', 'a_valider'].includes(f.statut)).length
  return `
  <div style="display:flex;gap:4px;margin-bottom:18px;border-bottom:2px solid #e5e7eb;">
    <button class="cpt-fact-toggle cpt-fact-active" onclick="cptFactSection(0)" style="padding:10px 22px;font-size:.85rem;font-weight:800;border:none;background:none;cursor:pointer;color:#6b7280;border-bottom:3px solid transparent;margin-bottom:-2px;display:flex;align-items:center;gap:7px;">
      <i class="fas fa-file-invoice"></i>Factures clients
    </button>
    <button class="cpt-fact-toggle" onclick="cptFactSection(1)" style="padding:10px 22px;font-size:.85rem;font-weight:800;border:none;background:none;cursor:pointer;color:#6b7280;border-bottom:3px solid transparent;margin-bottom:-2px;display:flex;align-items:center;gap:7px;">
      <i class="fas fa-hand-holding-usd"></i>Factures fournisseurs / sous-traitants${aRegler ? ` <span style="background:#ef4444;color:white;border-radius:999px;padding:1px 8px;font-size:.65rem;">${aRegler}</span>` : ''}
    </button>
  </div>
  <div class="cpt-fact-section">${buildFacturesClients(fc)}</div>
  <div class="cpt-fact-section" style="display:none;">${buildARegler(ff, fc, PJ, bcs)}</div>`
}

export function pageServiceCompta(
  dbFactCli?: FactureClient[],
  dbFactFourn?: FactureFournisseur[],
  dbEcritures?: EcritureComptable[],
  dbValidations?: any[],
  dbPiecesJointes?: Record<string, { id: string; nom: string }>,
  dbBcs?: any[],
): string {
  CPT_VD_MAP = buildValDirMap(dbValidations || [])   // décisions Direction (rebouclage badge) — posé avant les builders (rendu synchrone)
  const isDemo = false
  const fc = dbFactCli ?? []
  const ff = dbFactFourn ?? []
  const bcs = dbBcs ?? []
  const ec = dbEcritures ?? []
  // Pieces jointes des factures fournisseurs, indexees par identifiant de facture.
  const PJ: Record<string, { id: string; nom: string }> = dbPiecesJointes ?? {}

  const demoBanner = isDemo ? `
  <div style="margin:16px 24px 0;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1.5px solid #6ee7b7;border-radius:12px;padding:10px 18px;display:flex;align-items:center;gap:12px;">
    <i class="fas fa-database" style="color:${EMERALD};font-size:1rem;"></i>
    <span style="font-size:.78rem;font-weight:700;color:#065f46;">Mode démonstration — Données de démonstration actives. Connectez votre base de données pour afficher les données réelles.</span>
    <span style="margin-left:auto;background:${EMERALD};color:white;border-radius:6px;padding:2px 10px;font-size:.7rem;font-weight:700;">DÉMO</span>
  </div>` : ''

  const tabs: { icon: string; label: string; badge?: number }[] = [
    { icon: 'fa-file-invoice',     label: 'Facturation', badge: fc.length + ff.length },
    { icon: 'fa-book',             label: 'Grand Livre', badge: ec.length },
    { icon: 'fa-percent',          label: 'TVA & Déclarations' },
    { icon: 'fa-balance-scale',    label: 'Balance & Trésorerie' },
    { icon: 'fa-tachometer-alt',   label: 'Dashboard' },
  ]

  const tabBar = serviceHeader({
    icon: 'fa-calculator',
    color: EMERALD,
    darkBg: '#064e3b',
    title: 'Service Comptabilité',
    subtitle: 'Factures · Grand Livre · TVA · Trésorerie — Seem Semrac · PCG 2026 / EN 9100:2018',
    tabs: tabs.map((t, i) => ({ id: String(i), label: t.label, icon: t.icon, badge: t.badge })),
    switchFn: 'cptShowTab',
    tabIdPrefix: 'cpt-tab',
    activeId: '0'
  })

  const panels = [
    buildFacturation(fc, ff, PJ, bcs),
    buildGrandLivre(ec),
    buildTVA(ec),
    buildBalance(ec, fc, ff),
    buildDashboard(fc, ff),
  ]

  const html = `
  ${tabBar}

  ${demoBanner}

  <!-- TAB PANELS -->
  <div style="padding:24px;">
    ${panels.map((p, i) => `
    <div class="cpt-tab-panel" style="display:${i === 0 ? 'block' : 'none'};">
      ${p}
    </div>`).join('')}
  </div>

  <style>
    .cpt-fact-toggle { transition:color .2s,border-color .2s; outline:none; }
    .cpt-fact-toggle.cpt-fact-active { color:${EMERALD} !important; border-bottom-color:${EMERALD} !important; }
    .cpt-fact-toggle:hover:not(.cpt-fact-active) { color:#374151 !important; }
    .cpt-sub-fc, .cpt-sub-rg { transition:color .2s,border-color .2s; outline:none; }
    .cpt-sub-fc.cpt-sub-active, .cpt-sub-rg.cpt-sub-active { color:${EMERALD} !important; border-bottom-color:${EMERALD} !important; }
    .cpt-f-btn { transition:all .2s; outline:none; }
    .cpt-f-btn.cpt-f-active { background:${EMERALD} !important; color:white !important; border-color:${EMERALD} !important; }
    .cpt-f-btn:hover:not(.cpt-f-active) { background:#f0fdf4 !important; }
    table tbody tr:last-child td { border-bottom:none; }
  </style>

  <script>
    function cptShowTab(n) {
      var idx = typeof n === 'string' ? Number(n) : n;
      document.querySelectorAll('.svc-hdr-tab[id^="cpt-tab-"]').forEach(function(t,i){t.classList.toggle('active',i===idx)});
      document.querySelectorAll('.cpt-tab-panel').forEach(function(p,i){p.style.display=i===idx?'block':'none'});
    }
    function cptSwitchSub(group, n) {
      document.querySelectorAll('.cpt-sub-'+group).forEach(function(t,i){t.classList.toggle('cpt-sub-active',i===n)})
      document.querySelectorAll('.cpt-sub-panel-'+group).forEach(function(p,i){p.style.display=i===n?'block':'none'})
    }
    function cptFactSection(n) {
      document.querySelectorAll('.cpt-fact-toggle').forEach(function(t,i){t.classList.toggle('cpt-fact-active',i===n)})
      document.querySelectorAll('.cpt-fact-section').forEach(function(p,i){p.style.display=i===n?'block':'none'})
    }
    function cptFiltreFactCli(statut) {
      document.querySelectorAll('#tblFactCli tbody tr').forEach(function(tr){
        tr.style.display=(statut==='tous'||tr.dataset.statut===statut)?'':'none'
      })
      document.querySelectorAll('.cpt-f-btn').forEach(function(b){b.classList.remove('cpt-f-active')})
      event.target.classList.add('cpt-f-active')
    }
    function cptFiltreFourn(statut) {
      document.querySelectorAll('#tblFourn tbody tr').forEach(function(tr){
        tr.style.display=(statut==='tous'||tr.dataset.statut===statut)?'':'none'
      })
      document.querySelectorAll('.cpt-f-btn').forEach(function(b){b.classList.remove('cpt-f-active')})
      event.target.classList.add('cpt-f-active')
    }
    function cptFiltreGL(journal) {
      document.querySelectorAll('#tblGL tbody tr').forEach(function(tr){
        tr.style.display=(journal==='tous'||tr.dataset.journal===journal)?'':'none'
      })
    }
    function cptSearchGL(q) {
      var sq=q.toLowerCase()
      document.querySelectorAll('#tblGL tbody tr').forEach(function(tr){
        var c=(tr.dataset.compte||'').toLowerCase()
        var l=(tr.dataset.libelle||'').toLowerCase()
        tr.style.display=(!sq||c.includes(sq)||l.includes(sq))?'':'none'
      })
    }
    function cptAutoTVA() {
      var ht=parseFloat(document.getElementById('fact_ht').value)||0
      document.getElementById('fact_tva').value=(ht*0.2).toFixed(2)
      document.getElementById('fact_ttc').value=(ht*1.2).toFixed(2)
    }
    function cptCreerFacture() { pushNotif('ok','fa-file-invoice','Facture créée. Prête à envoyer.'); }
    function cptEnvoyerFacture(id) { pushNotif('ok','fa-paper-plane','Facture envoyée par email. Statut: Envoyée.'); }
    function cptRelancer(id, client) { pushNotif('warn','fa-bell','Relance envoyée à '+client+'. Notification email déclenchée.'); }
    function cptPayerFacture(id) {
      fetch('/api/factures/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({statut:'payee'})})
        .then(function(r){return r.json();}).then(function(j){
          if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Mise à jour échouée.'); return; }
          pushNotif('ok','fa-check-circle','Facture <strong>'+id+'</strong> marquée payée.',4000); setTimeout(function(){ softReload(); },700);
        }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
    }
    // ── Export PDF auto-rempli d'une facture (impression navigateur) ──
    var CPT_FC = ${sjX(fc.map((f:any) => ({ id:f.id, num_facture:f.num_facture||f.id, client_nom:f.client_nom||'', num_affaire:f.num_affaire||'', date_facture:f.date_facture||'', date_echeance:f.date_echeance||'', montant_ht:f.montant_ht||0, tva_pct:f.tva_pct||20, montant_tva:f.montant_tva||0, montant_ttc:f.montant_ttc||0, prix_transport:(f as any).prix_transport||0, statut:f.statut, lignes:(f as any).lignes||null, notes:f.notes||'' })))};
    var BRAND_BLOCK=${sjX(brandBlockHTML())}; var BRAND_BLEU=${sjX(BRAND.bleu)}; var BRAND_VIOLET=${sjX(BRAND.violet)};
    function cptMoney(v){ return (Number(v)||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'; }
    function cptExportPDF(id){
      var cptE=function(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');};
      var f=CPT_FC.find(function(x){return String(x.id)===String(id);}); if(!f){ pushNotif('err','fa-times','Facture introuvable.'); return; }
      var lignesRows='';
      if(Array.isArray(f.lignes)&&f.lignes.length){
        lignesRows=f.lignes.map(function(l){ return '<tr><td>'+cptE(l.lot_id||l.article||'Ligne')+(l.piece?' — '+l.piece:'')+'</td><td style="text-align:center;">'+(l.qte!=null?l.qte:'')+'</td><td style="text-align:right;">—</td></tr>'; }).join('');
      } else {
        lignesRows='<tr><td>Prestation / livraison — affaire '+(f.num_affaire||'')+'</td><td style="text-align:center;">1</td><td style="text-align:right;">'+cptMoney(f.montant_ht-(f.prix_transport||0))+'</td></tr>';
      }
      if(f.prix_transport>0) lignesRows+='<tr><td>Frais de transport</td><td style="text-align:center;">1</td><td style="text-align:right;">'+cptMoney(f.prix_transport)+'</td></tr>';
      var html='<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>'+(f.num_facture||id)+'</title>'+
        '<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;}body{margin:0;padding:38px;color:#1e293b;}'+
        '.hd{display:flex;justify-content:space-between;border-bottom:3px solid '+BRAND_VIOLET+';padding-bottom:16px;margin-bottom:24px;}'+
        '.soc{font-size:13px;line-height:1.5;}.soc b{font-size:18px;color:#0ea5e9;}'+
        '.tt{text-align:right;}.tt h1{margin:0;font-size:26px;color:'+BRAND_BLEU+';letter-spacing:1px;}.tt .num{font-size:14px;font-weight:bold;margin-top:4px;}'+
        '.meta{display:flex;justify-content:space-between;margin-bottom:22px;font-size:13px;}'+
        '.box{border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;min-width:240px;}'+
        '.box .lbl{font-size:10px;text-transform:uppercase;color:#64748b;font-weight:bold;letter-spacing:.5px;}'+
        'table.it{width:100%;border-collapse:collapse;margin-bottom:18px;font-size:13px;}'+
        'table.it th{background:'+BRAND_BLEU+';color:white;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;}'+
        'table.it td{padding:9px 12px;border-bottom:1px solid #eef2f7;}'+
        '.tot{width:300px;margin-left:auto;font-size:13px;}.tot div{display:flex;justify-content:space-between;padding:5px 0;}'+
        '.tot .ttc{border-top:2px solid '+BRAND_BLEU+';margin-top:6px;padding-top:8px;font-size:16px;font-weight:bold;color:'+BRAND_BLEU+';}'+
        '.ft{margin-top:34px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px;}'+
        '.pay{display:inline-block;margin-top:8px;padding:4px 12px;border-radius:6px;font-weight:bold;font-size:12px;}'+
        '@page{size:A4 portrait;margin:12mm;}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}@media print{body{padding:0;}thead{display:table-header-group;}tr{page-break-inside:avoid;}}</style></head><body>'+
        '<div class="hd">'+BRAND_BLOCK+
        '<div class="tt"><h1>FACTURE</h1><div class="num">'+(f.num_facture||id)+'</div>'+(f.statut==='payee'?'<div class="pay" style="background:#dcfce7;color:#16a34a;">PAYÉE</div>':'<div class="pay" style="background:#fef3c7;color:#b45309;">EN ATTENTE DE RÈGLEMENT</div>')+'</div></div>'+
        '<div class="meta"><div class="box"><div class="lbl">Facturé à</div><div style="font-weight:bold;font-size:15px;margin-top:4px;">'+(f.client_nom||'—')+'</div><div style="color:#64748b;margin-top:2px;">Affaire '+(f.num_affaire||'—')+'</div></div>'+
        '<div class="box"><div class="lbl">Date facture</div><div style="margin:3px 0 8px;font-weight:bold;">'+(f.date_facture||'—')+'</div><div class="lbl">Échéance</div><div style="font-weight:bold;margin-top:3px;">'+(f.date_echeance||'—')+'</div></div></div>'+
        '<table class="it"><thead><tr><th>Désignation</th><th style="text-align:center;">Qté</th><th style="text-align:right;">Montant HT</th></tr></thead><tbody>'+lignesRows+'</tbody></table>'+
        '<div class="tot"><div><span>Total HT</span><span>'+cptMoney(f.montant_ht)+'</span></div><div><span>TVA ('+(f.tva_pct||20)+'%)</span><span>'+cptMoney(f.montant_tva)+'</span></div><div class="ttc"><span>Total TTC</span><span>'+cptMoney(f.montant_ttc)+'</span></div></div>'+
        '<div class="ft">'+(f.notes?('<div style="margin-bottom:6px;">'+cptE(f.notes)+'</div>'):'')+'Règlement par virement bancaire sous '+(f.date_echeance?'échéance indiquée':'30 jours')+'. Pas d\\'escompte pour paiement anticipé. TVA acquittée sur les débits. Document généré par l\\'ERP Seem Semrac.</div>'+
        '<script>window.onload=function(){window.print();}<\\/script></body></html>';
      var w=window.open('','_blank'); if(!w){ pushNotif('err','fa-ban','Autorisez les pop-ups pour l\\'export PDF.'); return; }
      w.document.open(); w.document.write(html); w.document.close();
      pushNotif('ok','fa-file-pdf','Facture '+(f.num_facture||id)+' — fenêtre d\\'impression PDF ouverte.',4000);
    }
    // Valider et Payer engagent de l'argent : on NOMME la facture concernee et on
    // demande confirmation. Le serveur renvoie ensuite l'identifiant reellement
    // modifie — s'il ne correspond pas a celui demande, on le signale au lieu de
    // laisser croire que tout s'est bien passe.
    function _cptEuro(m){ try{ return (Number(m)||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' \u20ac'; }catch(e){ return (Number(m)||0).toFixed(2)+' \u20ac'; } }
    function _cptApres(j, id, msgOk, icone){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Operation refusee.',7000); return; }
      var touche = (j.facture && j.facture.id) ? String(j.facture.id) : '';
      if(touche && touche !== String(id)){
        pushNotif('warn','fa-triangle-exclamation','Attention : le serveur a modifie '+touche+' alors que '+id+' etait demandee. Verifiez la liste.',12000);
      } else {
        pushNotif('ok',icone,msgOk,3500);
      }
      setTimeout(function(){softReload();},900);
    }
    async function cptValiderFourn(id, num, fourn, ttc) {
      if(!await appConfirm('Valider la facture '+(num||id)+' ?\\n\\n'+(fourn||'')+(ttc?'  \u00b7  '+_cptEuro(ttc):'')+'\\n\\nElle passera « a payer » et sera proposee au reglement. Cette facture UNIQUEMENT.')) return;
      fetch('/api/factures-fournisseur/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({statut:'a_payer',attendu:'a_valider'})})
        .then(function(r){return r.json();})
        .then(function(j){ _cptApres(j, id, 'Facture '+(num||id)+' validee. Prete au reglement.', 'fa-check'); })
        .catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); });
    }
    async function cptPayerFourn(id, num, fourn, ttc) {
      if(!await appConfirm('Marquer la facture '+(num||id)+' comme PAYEE ?\\n\\n'+(fourn||'')+(ttc?'  \u00b7  '+_cptEuro(ttc):'')+'\\n\\nSi elle est proforma, le bon de commande sera libere et partira chez le fournisseur. Cette facture UNIQUEMENT.')) return;
      fetch('/api/factures-fournisseur/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({statut:'payee',date_paiement:new Date().toISOString().slice(0,10),mode_paiement:'Virement'})})
        .then(function(r){return r.json();})
        .then(function(j){ _cptApres(j, id, 'Facture '+(num||id)+' marquee payee.'+(j&&j.bc_libere?' Bon de commande '+j.bc_libere+' libere.':''), 'fa-money-bill'); })
        .catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); });
    }
    function cptOpenFournModal(){ var m=document.getElementById('cptFournModal'); if(m){m.style.display='flex'; var d=document.getElementById('ff_date'); if(d&&!d.value)d.value=new Date().toISOString().slice(0,10);} }
    function cptCloseFournModal(){ var m=document.getElementById('cptFournModal'); if(m)m.style.display='none'; }
    function cptFournAutoTTC(){
      var ht=parseFloat((document.getElementById('ff_ht')||{}).value)||0;
      var tva=parseFloat((document.getElementById('ff_tva')||{}).value); if(isNaN(tva))tva=20;
      var ttc=document.getElementById('ff_ttc'); if(ttc)ttc.value=(ht*(1+tva/100)).toFixed(2);
    }
    function cptSaveFourn(){
      function v(id){var e=document.getElementById(id);return e?e.value:'';}
      var nom=v('ff_nom'), ht=parseFloat(v('ff_ht'))||0;
      if(!nom.trim()){ pushNotif('err','fa-exclamation','Nom du fournisseur/ST requis.'); return; }
      if(ht<=0){ pushNotif('err','fa-exclamation','Montant HT requis.'); return; }
      var tva=parseFloat(v('ff_tva')); if(isNaN(tva))tva=20;
      var body={ type:v('ff_type')||'fournisseur', num_facture:v('ff_num')||null, fournisseur_nom:nom.trim(),
        date_facture:v('ff_date')||null, date_echeance:v('ff_ech')||null, montant_ht:ht, tva_pct:tva,
        compte_charge:v('ff_compte')||null, notes:v('ff_notes')||null };
      fetch('/api/factures-fournisseur',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
        .then(function(r){return r.json();}).then(function(j){
          if(j.ok){ if(window.submitValidation) submitValidation('compta','ff_vd',{type:'Facture '+(body.type||'fournisseur'),objet:nom.trim()+' — '+ht.toFixed(2)+' € HT',montant:ht,priorite:'normal',ref_table:'factures_fournisseur',ref_id:(j.data&&j.data.id)||null}); pushNotif('ok','fa-check-circle','Facture '+(j.data&&j.data.num_facture?j.data.num_facture:'')+' enregistrée.',3500); cptCloseFournModal(); setTimeout(function(){softReload();},700); }
          else pushNotif('err','fa-times','Erreur : '+(j.error||'inconnue'));
        }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
    }
    function cptExporterCA3() { pushNotif('info','fa-percent','Déclaration CA3 préparée. Export PDF disponible.'); }
    // Init sub-tabs
    document.querySelectorAll('.cpt-sub-fc').forEach(function(t,i){if(i===0)t.classList.add('cpt-sub-active')})
    document.querySelectorAll('.cpt-sub-rg').forEach(function(t,i){if(i===0)t.classList.add('cpt-sub-active')})
  </script>`

  return layout('Service Comptabilité', html, 'service-compta')
}
