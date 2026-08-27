// ══════════════════════════════════════════════════════════════
// DASHBOARDS KPI PAR SERVICE – ERP Seem Semrac v2.0
// 100% relié aux vraies tables via getDashboardData() (queries.ts).
// Calculs centralisés dans kpi.ts · rendu via dash_ui.ts (Chart.js).
// Aucune donnée fictive : tables vides → KPI à 0 / « aucune donnée ».
// ══════════════════════════════════════════════════════════════
import { layout, pageHeader } from './shared'
import type { DashboardData } from './queries'
import * as K from './kpi'
import * as U from './dash_ui'
import { computeRisqueChimique, SEIRICH_NIVEAUX, computeBilanGES } from './qref'
import type { DashFilter } from './dash_filter'
import { filterQS } from './dash_filter'

const { fmtEur, esc, num, lc, pctOf, isOpen, MONTHS_FR, objectif, prioColor } = K

// ─── helpers locaux de mise en page ───────────────────────────
const grid = (cols: string, gap = 14) => (html: string) => `<div style="display:grid;grid-template-columns:${cols};gap:${gap}px;margin-bottom:22px;">${html}</div>`
const g4 = grid('repeat(4,1fr)'); const g5 = grid('repeat(5,1fr)'); const g6 = grid('repeat(6,1fr)')
const wrap = (content: string) => `<div style="padding:22px 30px;">${content}</div>`
const monthLabels = MONTHS_FR
const lineChart = (id: string, labels: string[], datasets: any[], h = 220) => U.chartBlock(id, 'line', { labels, datasets }, { plugins: { legend: { display: datasets.length > 1 } }, scales: { y: { beginAtZero: true } }, elements: { line: { tension: .35 }, point: { radius: 2 } } }, h)
const barChart = (id: string, labels: string[], datasets: any[], opts: any = {}, h = 220) => U.chartBlock(id, 'bar', { labels, datasets }, { plugins: { legend: { display: datasets.length > 1 } }, scales: { y: { beginAtZero: true } }, ...opts }, h)
const doughnut = (id: string, labels: string[], data: number[], colors: string[], h = 220) => U.chartBlock(id, 'doughnut', { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] }, { cutout: '62%', plugins: { legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 12 } } } }, h)
// Extra-head des dashboards : Chart.js + (en mode ?print=1) le CSS/print + auto-impression.
const dEH = (f?: DashFilter) => U.DASH_HEAD + (f && f.print ? U.PRINT_HEAD : '')

// ──────────────────────────────────────────────────────────────
// HUB — Vue d'ensemble : une carte par dashboard, KPI phare + lien
// ──────────────────────────────────────────────────────────────
export const dashHub = (d: DashboardData) => {
  const com = K.commercial(d); const fin = K.finance(d); const prod = K.production(d); const qual = K.qualite(d)
  const ach = K.achats(d); const hrK = K.rh(d); const beK = K.be(d); const stk = K.stock(d)
  const maint = K.maintenance(d); const four = K.fournisseurs(d); const bal = ((d.balancelles || []) as any[]).length
  const cards = [
    { t: 'Direction', ic: 'fa-crown', c: '#f59e0b', url: '/dashboard/direction', v: fmtEur(com.caYTD), s: 'CA cumulé' },
    { t: 'Commercial', ic: 'fa-chart-line', c: '#3b82f6', url: '/dashboard/commercial', v: fmtEur(com.caMois), s: 'CA facturé (mois)' },
    { t: 'Finance', ic: 'fa-coins', c: '#0ea5e9', url: '/dashboard/finance', v: fmtEur(fin.tresorerie), s: 'Trésorerie nette' },
    { t: 'Bureau Études', ic: 'fa-drafting-compass', c: '#6366f1', url: '/dashboard/be', v: String(beK.dtAAnalyser.length), s: 'DT à analyser' },
    { t: 'Achats', ic: 'fa-shopping-cart', c: '#10b981', url: '/dashboard/achats', v: String(ach.daOpen.length), s: 'DA à traiter' },
    { t: 'Fournisseurs', ic: 'fa-truck', c: '#10b981', url: '/dashboard/fournisseurs', v: four.otdGlobal + '%', s: 'OTD global' },
    { t: 'Production', ic: 'fa-industry', c: '#ea580c', url: '/dashboard/production', v: prod.otd + '%', s: 'OTD' },
    { t: 'Programmation', ic: 'fa-calendar-week', c: '#f59e0b', url: '/dashboard/programmation', v: prod.chargePct + '%', s: 'Charge atelier' },
    { t: 'Qualité', ic: 'fa-clipboard-check', c: '#ef4444', url: '/dashboard/qualite', v: String(qual.ncOpen.length), s: 'NC ouvertes' },
    { t: 'OAS', ic: 'fa-atom', c: '#06b6d4', url: '/dashboard/oas', v: String(bal), s: 'Sessions OAS' },
    { t: 'Maintenance', ic: 'fa-wrench', c: '#eab308', url: '/dashboard/maintenance', v: (maint.disponibilite || maint.dispoParc) + '%', s: 'Disponibilité' },
    { t: 'Stock', ic: 'fa-warehouse', c: '#3b82f6', url: '/dashboard/stock', v: fmtEur(stk.valorisation), s: 'Valorisation' },
    { t: 'Expéditions', ic: 'fa-box-open', c: '#8b5cf6', url: '/dashboard/expedition', v: '→', s: 'BL & OTD' },
    { t: 'RH', ic: 'fa-users', c: '#14b8a6', url: '/dashboard/rh', v: String(hrK.effectif), s: 'Effectif actif' },
    { t: 'Environnement', ic: 'fa-leaf', c: '#16a34a', url: '/dashboard/environnement', v: '→', s: 'ISO 14001 · GES · RSE' },
  ]
  const content = wrap(grid('repeat(auto-fill,minmax(220px,1fr))')(cards.map(c => `
      <a href="${c.url}" style="text-decoration:none;color:inherit;">
        <div style="background:white;border-radius:14px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.04);border:1px solid #f1f5f9;">
          <div style="width:42px;height:42px;border-radius:12px;background:${c.c}18;display:flex;align-items:center;justify-content:center;margin-bottom:12px;"><i class="fas ${c.ic}" style="color:${c.c};font-size:1.05rem;"></i></div>
          <div style="font-size:1.5rem;font-weight:900;color:#111827;line-height:1;">${c.v}</div>
          <div style="font-size:.72rem;color:#9ca3af;margin-top:3px;">${esc(c.s)}</div>
          <div style="font-size:.82rem;font-weight:800;color:${c.c};margin-top:8px;">${esc(c.t)} <i class="fas fa-arrow-right" style="font-size:.65rem;"></i></div>
        </div>
      </a>`).join('')))
  return layout('Tableaux de bord', pageHeader('fas fa-table-columns', '#6366f1,#4338ca', 'Tableaux de bord', 'Vue globale — cliquez une carte pour ouvrir le dashboard', ['Vue globale']) + content, 'dashboard-hub', U.DASH_HEAD)
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD COMMERCIAL – Corinne
// ──────────────────────────────────────────────────────────────
export const dashCommercial = (d: DashboardData, f?: DashFilter) => {
  const k = K.commercial(d, f)
  const oConv = objectif(d, 'conversion')
  const clients = Array.from(new Set(((d.commandes || []) as any[]).map(c => c.client_nom).filter(Boolean))).sort() as string[]
  const dtQS = filterQS(f)
  const content = wrap(`
  ${g4(`
    ${U.kpiCard('fa-euro-sign', fmtEur(k.caMois), `CA facturé (${k.periodLabel})`, `Cumul ${fmtEur(k.caYTD)}`, '#3b82f6', '#eff6ff', { trend: k.trendCA, spark: k.serieCA, sparkColor: '#3b82f6' })}
    ${U.kpiCard('fa-handshake', k.conversion + '%', 'Taux conversion', `${k.offWon}/${k.offSent} offres`, '#22c55e', '#f0fdf4', { obj: U.kpiObj(k.conversion, oConv), href: '/commercial/offres-liste' + dtQS })}
    ${U.kpiCard('fa-coins', fmtEur(k.valeurPipeline), 'Pipeline en attente', `${k.offWait.length} offre(s)`, '#f59e0b', '#fffbeb')}
    ${U.kpiCard('fa-book', fmtEur(k.carnet), 'Carnet de commandes', `Panier moyen ${fmtEur(k.panierMoyen)}`, '#6366f1', '#f5f3ff', { href: '/commercial/dt-liste' + dtQS })}
  `)}
  ${grid('2fr 1fr')(`
    ${U.card(U.cardTitle(`Commandes ${f && f.active ? '(' + k.periodLabel + ')' : K.curYear()} — Seem vs Semrac (k€)`, 'fa-chart-bar', '#3b82f6') + (
      (k.seemS.some(v => v > 0) || k.semracS.some(v => v > 0))
        ? barChart('cmCommercial', k.monthLabels, [
          { label: 'Seem', data: k.seemS, backgroundColor: U.PAL_SEEM, borderRadius: 4 },
          { label: 'Semrac', data: k.semracS, backgroundColor: U.PAL_SEMRAC, borderRadius: 4 },
          ...(f && f.compare ? [{ type: 'line', label: 'Total N-1', data: k.cmdSeriePrev, borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, fill: false } as any] : []),
        ])
        : U.emptyState('Aucune commande sur la période')))}
    ${U.card(U.cardTitle(`Concentration clients${k.concentration ? ' — 1ᵉʳ = ' + k.concentration + '%' : ''}`, 'fa-chart-pie', '#6366f1') + (
      k.topClients.length ? doughnut('cmClients', k.topClients.map(c => String(c[0])), k.topClients.map(c => Math.round(c[1] / 1000)), U.PALETTE) + `<div style="margin-top:8px;">${k.paretoClients.map((p: any) => U.miniBar(esc(p.nom) + ' · cum ' + p.cumPct + '%', Math.round(p.montant / 1000), Math.round(k.paretoClients[0].montant / 1000), '#6366f1', 'k€')).join('')}</div>` : U.emptyState('Aucune commande client')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('DT en cours', 'fa-list-alt', '#3b82f6') + (k.dtOpen.length ? k.dtOpen.slice(0, 6).map((dt: any) => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f8fafc;">
        <div style="width:4px;height:32px;border-radius:2px;background:${prioColor(dt.priorite)};flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;"><div style="font-size:.75rem;font-weight:700;color:#374151;">${esc(dt.num_affaire || dt.id)}</div>
          <div style="font-size:.65rem;color:#9ca3af;">${esc(dt.client_nom || '—')} · ${esc(dt.statut)}</div></div>
        <a href="/commercial/dt-liste" style="font-size:.65rem;color:#3b82f6;text-decoration:none;font-weight:700;">→</a>
      </div>`).join('') : U.emptyState('Aucune DT en cours')) + `<a href="/commercial/dt-liste" style="display:block;text-align:center;margin-top:10px;font-size:.72rem;color:#3b82f6;font-weight:700;text-decoration:none;">Voir toutes les DT →</a>`)}
    ${U.card(U.cardTitle('Offres en attente réponse', 'fa-paper-plane', '#6366f1') + (k.offWait.length ? k.offWait.slice(0, 6).map((o: any) => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f8fafc;">
        <div style="flex:1;min-width:0;"><div style="font-size:.75rem;font-weight:700;color:#6366f1;">${esc(o.num_affaire || o.id)}</div>
          <div style="font-size:.65rem;color:#9ca3af;">${esc(o.client_nom || '—')} · ${fmtEur(num(o.montant))}</div></div>
        <span style="font-size:.65rem;color:#b45309;font-weight:700;background:#fffbeb;border-radius:6px;padding:2px 7px;">${esc(o.date_offre || '')}</span>
      </div>`).join('') : U.emptyState('Aucune offre en attente')) + `<a href="/commercial/offres-liste" style="display:block;text-align:center;margin-top:10px;font-size:.72rem;color:#6366f1;font-weight:700;text-decoration:none;">Voir toutes les offres →</a>`)}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard Commercial', pageHeader('fas fa-chart-line', '#3b82f6,#1d4ed8', 'Dashboard Commercial – Corinne', 'CA · Conversion · Pipeline · Carnet · Clients', ['KPI', 'Commercial']) + (f ? U.filterBar(f, '/dashboard/commercial', { clients, exportable: true }) : '') + content, 'service-commercial', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD BE – Joël / David
// ──────────────────────────────────────────────────────────────
export const dashBE = (d: DashboardData, f?: DashFilter) => {
  const k = K.be(d, f)
  const oMarge = objectif(d, 'marge_pct')
  const clients = Array.from(new Set(((d.dts || []) as any[]).map(x => x.client_nom).filter(Boolean))).sort() as string[]
  const sc = k.structureCout; const scTot = sc.matiere + sc.mo + sc.machine + sc.st
  const content = wrap(`
  ${g4(`
    ${U.kpiCard('fa-inbox', k.dtAAnalyser.length, 'DT à analyser', `${k.dtOpen.length} DT ouvertes`, '#6366f1', '#f5f3ff', { href: '/commercial/dt-liste' + filterQS(f) })}
    ${U.kpiCard('fa-check-circle', k.tauxAnalyse + '%', 'DT analysées', `${k.dtAnalysees}/${k.dtTotal}`, '#22c55e', '#f0fdf4')}
    ${U.kpiCard('fa-euro-sign', k.cruMoyen ? k.cruMoyen + '€' : '—', 'CRU moyen', `${k.nbChiffrees} nomenclature(s)`, '#3b82f6', '#eff6ff')}
    ${U.kpiCard('fa-percent', k.margeMoy ? k.margeMoy + '%' : '—', 'Marge brute moyenne', `Seem ${k.margeSeem}% · Semrac ${k.margeSemrac}%`, '#f59e0b', '#fffbeb', { obj: k.margeMoy ? U.kpiObj(k.margeMoy, oMarge) : undefined })}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Structure de coût moyenne du CRU', 'fa-layer-group', '#3b82f6') + (scTot > 0 ? barChart('beStruct', ['Moyenne CRU'], [
      { label: 'Matière', data: [sc.matiere], backgroundColor: '#3b82f6', stack: 's' },
      { label: 'Main d’œuvre', data: [sc.mo], backgroundColor: '#22c55e', stack: 's' },
      { label: 'Machine', data: [sc.machine], backgroundColor: '#f59e0b', stack: 's' },
      { label: 'Sous-traitance', data: [sc.st], backgroundColor: '#a855f7', stack: 's' },
    ], { indexAxis: 'y', scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true } }, plugins: { legend: { display: true } } }, 180) + `<div style="font-size:.68rem;color:#6b7280;margin-top:6px;">Matière ${sc.matiere}€ · MO ${sc.mo}€ · Machine ${sc.machine}€ · ST ${sc.st}€</div>` : U.emptyState('Aucune nomenclature chiffrée')))}
    ${U.card(U.cardTitle('Corrélation CRU ↔ marge', 'fa-braille', '#6366f1') + `<div style="font-size:.64rem;color:#94a3b8;margin-bottom:4px;">Axe X : CRU €/pièce · Axe Y : marge %</div>` + (k.cruMarge.length >= 2 ? U.chartBlock('beCruMarge', 'scatter', { datasets: [{ label: 'Pièces', data: k.cruMarge, backgroundColor: 'rgba(99,102,241,.5)', borderColor: '#6366f1', pointRadius: 4 }] }, { plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true }, y: { beginAtZero: true } } }, 220) : U.emptyState('Chiffrage insuffisant pour la corrélation')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Pièces les plus coûteuses (CRU €/pièce)', 'fa-coins', '#3b82f6') + (
      k.topCher.length ? barChart('beCru', k.topCher.map(p => String(p.ref).slice(0, 14)), [{ label: 'CRU', data: k.topCher.map(p => p.perPiece), backgroundColor: '#3b82f6', borderRadius: 4 }], { indexAxis: 'y' }) : U.emptyState('Aucune nomenclature chiffrée')))}
    ${U.card(U.cardTitle('Complétude des nomenclatures', 'fa-clipboard-check', '#22c55e') + (k.nbNoms ? `<div style="text-align:center;padding:12px 0;"><div style="font-size:2.6rem;font-weight:900;color:#22c55e;line-height:1;">${k.tauxCompletude}%</div><div style="font-size:.72rem;color:#6b7280;margin-top:4px;">${k.complet}/${k.nbNoms} nomenclatures complètes<br>(gamme + matière + validée)</div></div><div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;margin-top:6px;"><div style="width:${k.tauxCompletude}%;height:100%;background:#22c55e;border-radius:4px;"></div></div>` : U.emptyState('Aucune nomenclature')))}
  `)}
  ${grid('2fr 1fr')(`
    ${U.card(U.cardTitle('DT entrantes par mois', 'fa-chart-line', '#6366f1') + (k.serieDt.some(v => v > 0) ? lineChart('beDt', k.monthLabels, [
      { label: 'DT reçues', data: k.serieDt, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,.12)', fill: true },
      ...(f && f.compare ? [{ label: 'DT N-1', data: k.serieDtPrev, borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, fill: false } as any] : []),
    ]) : U.emptyState('Aucune DT sur la période')))}
    ${U.card(U.cardTitle('DT à traiter – File d’attente', 'fa-tasks', '#6366f1') + (k.dtAAnalyser.length ? k.dtAAnalyser.slice(0, 7).map((dt: any) => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:#f8fafc;margin-bottom:7px;border-left:3px solid ${prioColor(dt.priorite)};">
        <div style="flex:1;min-width:0;"><div style="font-size:.78rem;font-weight:700;color:#374151;">${esc(dt.num_affaire || dt.id)} · ${esc(dt.client_nom || '—')}</div>
          <div style="font-size:.65rem;color:#9ca3af;">${esc(dt.activite || '—')} · ${esc(dt.delai || dt.date_dt || '—')}</div></div>
        <span style="font-size:.65rem;color:#374151;background:#f1f5f9;border-radius:6px;padding:2px 8px;">${esc(dt.statut)}</span>
      </div>`).join('') : U.emptyState('Aucune DT à analyser')))}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard BE', pageHeader('fas fa-drafting-compass', '#6366f1,#4338ca', 'Dashboard Bureau d’Études – Joël / David', 'Analyses DT · Coûts de revient · Marge · Conformité', ['KPI', 'BE', 'CRU']) + (f ? U.filterBar(f, '/dashboard/be', { clients, exportable: true }) : '') + content, 'be-service', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD ACHATS – Morgane
// ──────────────────────────────────────────────────────────────
export const dashAchats = (d: DashboardData, f?: DashFilter) => {
  const k = K.achats(d, f); const four = K.fournisseurs(d, f)
  const oOtd = objectif(d, 'otd')
  const fournisseurs = Array.from(new Set([...((d.bcs || []) as any[]).map(b => b.fournisseur_nom), ...((d.facturesFournisseur || []) as any[]).map(x => x.fournisseur_nom), ...((d.das || []) as any[]).map(x => x.fournisseur)].filter(Boolean))).sort() as string[]
  const bcag = (ag: any) => [['0–30 j', 'b0_30', '#f59e0b'], ['30–60 j', 'b30_60', '#f97316'], ['60–90 j', 'b60_90', '#ef4444'], ['+90 j', 'b90', '#b91c1c']].map(([l, kk, c]) => U.miniBar(l as string, Math.round(ag[kk as string]), ag.total, c as string, '€')).join('')
  const content = wrap(`
  ${g4(`
    ${U.kpiCard('fa-shopping-cart', k.daOpen.length, 'DA à traiter', `${k.daCrit} critique(s)`, '#10b981', '#f0fdf4', { href: '/achats/da-liste' + filterQS(f) })}
    ${U.kpiCard('fa-file-invoice', k.bcOpen, 'BC en cours', `${k.bcTotal} BC au total`, '#3b82f6', '#eff6ff')}
    ${U.kpiCard('fa-exclamation-triangle', k.bcRetard.length, 'Retards fournisseur', k.bcRetard.length ? 'Livraison dépassée' : 'Aucun retard', k.bcRetard.length ? '#ef4444' : '#22c55e', k.bcRetard.length ? '#fef2f2' : '#f0fdf4')}
    ${U.kpiCard('fa-euro-sign', fmtEur(k.achatsMois), `Achats (${k.periodLabel})`, `Cumul ${fmtEur(k.achatsYTD)}`, '#f59e0b', '#fffbeb', { spark: k.serieAchats, sparkColor: '#f59e0b' })}
  `)}
  ${grid('2fr 1fr')(`
    ${U.card(U.cardTitle('Dépenses achats mensuelles', 'fa-chart-area', '#f59e0b') + (k.serieAchats.some(v => v > 0) ? lineChart('acDep', k.monthLabels, [
      { label: 'Achats HT', data: k.serieAchats.map(v => Math.round(v)), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.12)', fill: true },
      ...(f && f.compare ? [{ label: 'Achats HT N-1', data: k.serieAchatsPrev.map(v => Math.round(v)), borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, fill: false } as any] : []),
    ]) : U.emptyState('Aucune facture fournisseur')))}
    ${U.card(U.cardTitle('Pareto dépense fournisseur' + (k.depOnBc ? ' (BC engagés)' : ''), 'fa-trophy', '#10b981') + (k.paretoFourn.length ? k.paretoFourn.map((e, i) => U.miniBar(esc(e.nom) + ' · ' + e.cumPct + '%', Math.round(e.montant / 1000), Math.round(k.paretoFourn[0].montant / 1000) || 1, U.PALETTE[i % U.PALETTE.length], 'k€')).join('') : U.emptyState('Aucune dépense')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Ancienneté des BC en retard', 'fa-clock', '#ef4444') + (k.agingBC.total > 0 ? bcag(k.agingBC) + `<div style="margin-top:8px;font-size:.72rem;color:#6b7280;">${k.bcRetard.length} BC en retard · ${fmtEur(k.agingBC.total)}</div>` : U.emptyState('Aucun BC en retard de livraison')))}
    ${U.card(U.cardTitle('Répartition des DA par nature', 'fa-layer-group', '#10b981') + (k.daParCat.length ? doughnut('acDaCat', k.daParCat.map(c => String(c[0])), k.daParCat.map(c => c[1]), U.PALETTE) : U.emptyState('Aucune demande d’achat')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('DA en attente de traitement', 'fa-list-alt', '#10b981') + (k.daOpen.length ? k.daOpen.slice(0, 6).map((da: any) => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:#f8fafc;margin-bottom:7px;border-left:3px solid ${prioColor(da.priorite)};">
        <div style="flex:1;"><div style="font-size:.78rem;font-weight:700;">${esc(da.id)} · ${esc(da.article || '—')}</div>
          <div style="font-size:.65rem;color:#9ca3af;">Demandeur : ${esc(da.demandeur || '—')} · ${esc(da.statut)}</div></div>
        <span style="font-size:.65rem;background:#f1f5f9;border-radius:6px;padding:2px 8px;color:#374151;">${esc(da.priorite)}</span>
      </div>`).join('') : U.emptyState('Aucune DA en attente')) + `<a href="/achats/da-liste" style="display:block;text-align:center;margin-top:10px;font-size:.72rem;color:#10b981;font-weight:700;text-decoration:none;">Voir toutes les DA →</a>`)}
    ${U.card(U.cardTitle('Performance fournisseurs (OTD)', 'fa-star', '#f59e0b') + `<div style="margin-bottom:10px;">${U.gauge(four.otdGlobal, oOtd, 'OTD global réceptions')}</div>` + (four.scores.length ? four.scores.slice(0, 6).map(s => `
      <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f8fafc;">
        <div style="flex:1;font-size:.76rem;font-weight:700;color:#374151;">${esc(s.nom)}</div>
        <div style="font-size:.66rem;color:#6b7280;">OTD <strong style="color:${s.otd != null && s.otd >= 85 ? '#15803d' : '#b91c1c'};">${s.otd != null ? s.otd + '%' : '—'}</strong></div>
        <span style="font-size:.6rem;padding:2px 7px;border-radius:999px;background:${s.actif ? '#f0fdf4' : '#fffbeb'};color:${s.actif ? '#15803d' : '#b45309'};font-weight:700;">${esc(s.statut || '—')}</span>
      </div>`).join('') : U.emptyState('Aucun fournisseur qualifié')))}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard Achats', pageHeader('fas fa-shopping-cart', '#10b981,#059669', 'Dashboard Achats – Morgane', 'Appros · Délais · Dépenses · Fournisseurs', ['KPI', 'Achats']) + (f ? U.filterBar(f, '/dashboard/achats', { fournisseurs, exportable: true }) : '') + content, 'achats-service', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD PROGRAMMATION – Sylvie
// ──────────────────────────────────────────────────────────────
export const dashProgrammation = (d: DashboardData, f?: DashFilter) => {
  const p = K.production(d, f); const cp = K.chargePrevisionnelle(d, 8, f)
  const site = f && f.site ? lc(f.site) : ''; const client = f && f.client ? lc(f.client) : ''
  const passF = (x: any) => (!site || lc(x.activite) === site) && (!client || lc(x.client_nom) === client)
  const clients = Array.from(new Set(((d.commandes || []) as any[]).map(c => c.client_nom).filter(Boolean))).sort() as string[]
  const bdtOpen = (d.bdts || []).filter((x: any) => isOpen(x.statut) && passF(x))
  const bstOpen = (d.bsts || []).filter((x: any) => isOpen(x.statut) && (!client || lc(x.client_nom) === client))
  const ops = (d.salaries || []).filter((s: any) => s.est_operateur === true && s.actif !== false && (!site || lc(s.entite) === site))
  const absToday = new Set((d.absences || []).filter((a: any) => String(a.date_absence || '').slice(0, 10) === K.todayISO()).map((a: any) => a.operateur_id))
  const cmdAProg = (d.commandes || []).filter((c: any) => isOpen(c.statut) && num(c.bdt_total) === 0 && passF(c))
  const bdtNonAffectes = bdtOpen.filter((b: any) => !b.operateur_id)
  const bdtNonDates = bdtOpen.filter((b: any) => !b.date_prevue)
  const chargeParSite: Record<string, number> = {}
  for (const b of bdtOpen) { const a = (b as any).activite || '—'; chargeParSite[a] = (chargeParSite[a] || 0) + num((b as any).duree) }
  const loadByOp: Record<string, number> = {}
  for (const b of bdtOpen) { if ((b as any).operateur_id) loadByOp[(b as any).operateur_id] = (loadByOp[(b as any).operateur_id] || 0) + num((b as any).duree) }
  // Charge atelier recalculée sur le périmètre filtré (opérateurs du site) — production() ne filtre pas la capacité par site.
  const chargeHLoc = bdtOpen.reduce((s: number, b: any) => s + num(b.duree), 0)
  const opsDispoLoc = ops.filter((o: any) => !absToday.has(o.id)).length
  const capaHLoc = Math.max(1, opsDispoLoc * 7)
  const chargePctLoc = Math.round(chargeHLoc / capaHLoc * 100)
  const content = wrap(`
  ${g4(`
    ${U.kpiCard('fa-clipboard-list', bdtOpen.length, 'BDT actifs', `${bdtNonAffectes.length} à affecter`, '#f59e0b', '#fffbeb', { href: '/production/bdt-liste' + filterQS(f) })}
    ${U.kpiCard('fa-tachometer-alt', chargePctLoc + '%', 'Charge atelier', `${opsDispoLoc}/${ops.length} opérateurs · ${Math.round(chargeHLoc)}h/${capaHLoc}h`, chargePctLoc >= 90 ? '#ef4444' : '#3b82f6', chargePctLoc >= 90 ? '#fef2f2' : '#eff6ff')}
    ${U.kpiCard('fa-inbox', cmdAProg.length, 'Cmd à programmer', 'Sans lot/BDT créé', cmdAProg.length ? '#ef4444' : '#22c55e', cmdAProg.length ? '#fef2f2' : '#f0fdf4')}
    ${U.kpiCard('fa-industry', bstOpen.length, 'ST en cours', 'Bons sous-traitance', '#6366f1', '#f5f3ff')}
  `)}
  ${grid('3fr 1fr')(`
    ${U.card(U.cardTitle('Charge prévisionnelle 8 semaines (planifié vs capacité)', 'fa-chart-column', '#f97316') + (
      (cp.charge.some(v => v > 0) || cp.capaSemaine > 0)
        ? U.chartBlock('progChargePrev', 'bar', {
          labels: cp.labels,
          datasets: [
            { label: 'Charge planifiée (h)', data: cp.charge, backgroundColor: cp.charge.map(v => cp.capaSemaine > 0 && v > cp.capaSemaine ? '#ef4444' : '#f97316'), borderRadius: 4, order: 2 },
            { type: 'line', label: 'Capacité (h/sem)', data: cp.capacite, borderColor: '#111827', borderDash: [5, 4], pointRadius: 0, fill: false, order: 1 },
          ],
        }, { plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'heures' } } } }, 240)
        : U.emptyState('Aucun BDT planifié — les heures apparaissent dès qu’un BDT a une date prévue')))}
    ${U.card(U.cardTitle('Synthèse planning', 'fa-list-check', '#f97316') +
      `<div style="display:flex;flex-direction:column;gap:8px;">
        ${U.miniBar('Capacité / semaine', cp.capaSemaine, cp.capaSemaine || 1, '#22c55e', ' h')}
        <div style="display:flex;justify-content:space-between;font-size:.74rem;padding:6px 0;border-bottom:1px solid #f8fafc;"><span style="color:#374151;">Opérateurs actifs</span><span style="font-weight:800;">${cp.ops}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:.74rem;padding:6px 0;border-bottom:1px solid #f8fafc;"><span style="color:#374151;">Semaines en surcharge</span><span style="font-weight:800;color:${cp.surchargeWeeks ? '#dc2626' : '#16a34a'};">${cp.surchargeWeeks}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:.74rem;padding:6px 0;border-bottom:1px solid #f8fafc;"><span style="color:#374151;">Heures en retard (à replanifier)</span><span style="font-weight:800;color:${cp.retard ? '#f59e0b' : '#16a34a'};">${cp.retard} h</span></div>
        <div style="display:flex;justify-content:space-between;font-size:.74rem;padding:6px 0;"><span style="color:#374151;">Au-delà de 8 semaines</span><span style="font-weight:800;color:#6366f1;">${cp.auDela} h</span></div>
      </div>`)}
  `)}
  ${grid('2fr 1fr')(`
    ${U.card(`<div style="font-weight:800;color:#111827;margin-bottom:14px;font-size:.9rem;display:flex;align-items:center;justify-content:space-between;"><span><i class="fas fa-project-diagram" style="color:#f59e0b;margin-right:6px;"></i>Charge par opérateur – Aujourd'hui</span><a href="/production/affectation" style="font-size:.72rem;color:#f59e0b;font-weight:700;text-decoration:none;">Ouvrir Gantt →</a></div>` + (ops.length ? ops.slice(0, 10).map((o: any) => {
      const abs = absToday.has(o.id); const load = loadByOp[o.id] || 0; const pct = abs ? 0 : Math.min(100, Math.round(load / 8 * 100))
      const nom = `${o.prenom || ''} ${o.nom || ''}`.trim() || o.nom || '—'
      return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:${lc(o.entite) === 'seem' ? U.PAL_SEEM : U.PAL_SEMRAC};display:flex;align-items:center;justify-content:center;color:white;font-size:.65rem;font-weight:800;flex-shrink:0;">${esc(String(nom).charAt(0))}</div>
        <div style="width:120px;font-size:.72rem;font-weight:600;color:${abs ? '#9ca3af' : '#374151'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(nom)}</div>
        ${abs ? `<span style="font-size:.62rem;color:#b91c1c;font-weight:700;background:#fef2f2;border-radius:6px;padding:2px 8px;">Absent</span>` : `<div style="flex:1;height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e'};border-radius:4px;"></div></div><span style="font-size:.68rem;font-weight:700;color:${pct >= 90 ? '#b91c1c' : pct >= 70 ? '#b45309' : '#15803d'};width:35px;text-align:right;">${pct}%</span>`}
      </div>`
    }).join('') : U.emptyState('Aucun opérateur déclaré')))}
    ${U.card(U.cardTitle('Charge par opération (h)', 'fa-layer-group', '#f59e0b') + (Object.keys(p.chargeByOp).length ? K.topN(p.chargeByOp, 7).map(([op, h]) => U.miniBar(esc(op), Math.round(h * 10) / 10, Math.max(...Object.values(p.chargeByOp)), '#f59e0b', 'h')).join('') : U.emptyState('Aucun BDT actif')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Sous-traitance active', 'fa-industry', '#6366f1') + (bstOpen.length ? bstOpen.slice(0, 5).map((s: any) => `
      <div style="padding:10px;background:#f5f3ff;border-radius:10px;margin-bottom:8px;border:1px solid #ede9fe;">
        <div style="font-size:.75rem;font-weight:700;color:#4c1d95;">${esc(s.id)} · ${esc(s.operation || s.piece || '—')}</div>
        <div style="font-size:.65rem;color:#7c3aed;">${esc(s.client_nom || '—')}</div></div>`).join('') : U.emptyState('Aucune sous-traitance en cours')))}
    ${U.card(U.cardTitle('Commandes en attente prog.', 'fa-chart-bar', '#3b82f6') + (cmdAProg.length ? cmdAProg.slice(0, 6).map((c: any) => `
      <div style="padding:10px;background:#f8fafc;border-radius:10px;margin-bottom:8px;">
        <div style="font-size:.75rem;font-weight:700;color:#374151;">${esc(c.id)} · ${esc(c.client_nom || '—')}</div>
        <div style="font-size:.65rem;color:#9ca3af;">${fmtEur(num(c.montant))} · LOT à créer</div></div>`).join('') : U.emptyState('Toutes les commandes sont programmées')) + `<a href="/production/ordonnancement" style="display:block;text-align:center;margin-top:10px;font-size:.72rem;color:#f59e0b;font-weight:700;text-decoration:none;">Ordonnancer →</a>`)}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('File d’ordonnancement — BDT à traiter', 'fa-stream', '#f59e0b') + ((bdtNonAffectes.length || bdtNonDates.length) ? `<div style="display:flex;gap:8px;margin-bottom:10px;"><div style="flex:1;text-align:center;background:#fffbeb;border-radius:8px;padding:10px;"><div style="font-weight:900;font-size:1.4rem;color:#f59e0b;">${bdtNonAffectes.length}</div><div style="font-size:.6rem;color:#6b7280;">à affecter</div></div><div style="flex:1;text-align:center;background:#fef2f2;border-radius:8px;padding:10px;"><div style="font-weight:900;font-size:1.4rem;color:#ef4444;">${bdtNonDates.length}</div><div style="font-size:.6rem;color:#6b7280;">non planifiés</div></div></div>` + bdtOpen.slice(0, 6).map((b: any) => `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f8fafc;border-left:3px solid ${prioColor(b.priorite)};padding-left:8px;"><div style="flex:1;min-width:0;font-size:.72rem;font-weight:700;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(String(b.id))} · ${esc(b.operation || '—')}</div><span style="font-size:.6rem;color:#6b7280;">${num(b.duree)}h</span>${!b.operateur_id ? `<span style="font-size:.55rem;background:#fffbeb;color:#b45309;padding:1px 6px;border-radius:999px;font-weight:700;">à affecter</span>` : ''}</div>`).join('') + `<a href="/production/ordonnancement" style="display:block;text-align:center;margin-top:10px;font-size:.72rem;color:#f59e0b;font-weight:700;text-decoration:none;">Ordonnancer →</a>` : U.emptyState('Tout est affecté et planifié')))}
    ${U.card(U.cardTitle('Charge ouverte par site (h)', 'fa-sitemap', '#3b82f6') + (Object.keys(chargeParSite).length ? doughnut('progSite', Object.keys(chargeParSite), Object.values(chargeParSite).map(v => Math.round(v * 10) / 10), U.PALETTE) : U.emptyState('Aucun BDT actif')))}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard Programmation', pageHeader('fas fa-calendar-alt', '#f59e0b,#d97706', 'Dashboard Programmation – Sylvie', 'Charge atelier · BDT · Planning · Sous-traitance', ['KPI', 'Planning']) + (f ? U.filterBar(f, '/dashboard/programmation', { clients, exportable: true }) : '') + content, 'service-prod', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD PRODUCTION – Lénaïck
// ──────────────────────────────────────────────────────────────
export const dashProduction = (d: DashboardData, f?: DashFilter) => {
  const p = K.production(d, f); const q = K.qualite(d, f); const cp = K.chargePrevisionnelle(d, 8, f)
  const oOtd = objectif(d, 'otd'); const oOtk = objectif(d, 'otk'); const oRep = objectif(d, 'reprise')
  const bdts = (d.bdts || []) as any[]
  const clients = Array.from(new Set(((d.commandes || []) as any[]).map(c => c.client_nom).filter(Boolean))).sort() as string[]
  const content = wrap(`
  ${g5(`
    ${U.kpiCard('fa-check-double', p.avancement + '%', 'Avancement BDT', `${p.bdtSoldes}/${p.bdtTotal} soldés`, '#f97316', '#fff7ed', { href: '/production/bdt-liste' + filterQS(f) })}
    ${U.kpiCard('fa-truck', p.otd + '%', 'OTD', `${p.otdTot} cmd évaluées`, K.statutObjectif(p.otd, oOtd).color, '#f0fdf4', { obj: U.kpiObj(p.otd, oOtd) })}
    ${U.kpiCard('fa-clipboard-check', p.otk + '%', 'OTK', 'à l\'heure & conforme', K.statutObjectif(p.otk, oOtk).color, '#eff6ff', { obj: U.kpiObj(p.otk, oOtk) })}
    ${U.kpiCard('fa-hourglass-half', p.leadMoyen != null ? p.leadMoyen + ' j' : '—', 'Lead time moyen', 'cmd → livraison', '#8b5cf6', '#f5f3ff')}
    ${U.kpiCard('fa-redo', p.tauxReprise + '%', 'Taux de reprise', `${p.reprises} BDT · WIP ${p.wip}`, K.statutObjectif(p.tauxReprise, oRep).color, '#fffbeb', { obj: U.kpiObj(p.tauxReprise, oRep) })}
  `)}
  ${U.sectionTitle('Performance — jauges objectifs', 'fa-gauge-high')}
  ${grid('1fr 1fr 1fr 2fr')(`
    ${U.card(U.gauge(p.otd, oOtd, 'OTD'))}
    ${U.card(U.gauge(p.otk, oOtk, 'OTK'))}
    ${U.card(U.gauge(p.avancement, null, 'Avancement BDT'))}
    ${U.card(U.cardTitle('Charge par opération (BDT actifs, h)', 'fa-chart-bar', '#f97316') + (Object.keys(p.chargeByOp).length ? barChart('prodCharge', K.topN(p.chargeByOp, 8).map(e => String(e[0]).slice(0, 16)), [{ label: 'Heures', data: K.topN(p.chargeByOp, 8).map(e => Math.round(e[1] * 10) / 10), backgroundColor: '#f97316', borderRadius: 4 }], { indexAxis: 'y' }, 180) : U.emptyState('Aucun BDT actif')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Takt time & incidents', 'fa-stopwatch', '#8b5cf6') + `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="background:#f8fafc;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:1.3rem;font-weight:900;color:#111827;">${p.taktSeem != null ? p.taktSeem + ' min' : '—'}</div><div style="font-size:.7rem;color:#3b82f6;font-weight:700;">Takt Seem</div></div>
        <div style="background:#f8fafc;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:1.3rem;font-weight:900;color:#111827;">${p.taktSemrac != null ? p.taktSemrac + ' min' : '—'}</div><div style="font-size:.7rem;color:#ec4899;font-weight:700;">Takt Semrac</div></div>
        <div style="background:#fef2f2;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:1.3rem;font-weight:900;color:#b91c1c;">${q.ncOpen.length}</div><div style="font-size:.7rem;color:#b91c1c;font-weight:700;">NC ouvertes</div></div>
        <div style="background:#fffbeb;border-radius:10px;padding:12px;text-align:center;"><div style="font-size:1.3rem;font-weight:900;color:#b45309;">${p.reprises}</div><div style="font-size:.7rem;color:#b45309;font-weight:700;">Reprises</div></div>
      </div>`)}
    ${U.card(U.cardTitle('BDT récents', 'fa-list', '#6366f1') + (bdts.length ? `<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:2px solid #f1f5f9;">${['BDT', 'Opération', 'Durée', 'Statut'].map(h => `<th style="padding:6px 8px;font-size:.65rem;color:#6b7280;font-weight:700;text-align:left;">${h}</th>`).join('')}</tr></thead><tbody>${bdts.slice(0, 8).map((b: any) => `<tr style="border-bottom:1px solid #f8fafc;"><td style="padding:7px 8px;font-size:.72rem;font-weight:700;color:#374151;">${esc(b.id)}</td><td style="padding:7px 8px;font-size:.68rem;color:#6b7280;">${esc(b.operation || '—')}</td><td style="padding:7px 8px;font-size:.72rem;font-weight:700;">${num(b.duree)}h</td><td style="padding:7px 8px;"><span style="font-size:.62rem;padding:2px 7px;border-radius:999px;background:${/sold/.test(lc(b.statut)) ? '#f0fdf4' : '#eff6ff'};color:${/sold/.test(lc(b.statut)) ? '#15803d' : '#1d4ed8'};font-weight:700;">${esc(b.statut)}</span></td></tr>`).join('')}</tbody></table>` : U.emptyState('Aucun bon de travail')))}
  `)}
  ${U.sectionTitle('Charge atelier prévisionnelle (8 semaines)', 'fa-calendar-week')}
  ${grid('3fr 1fr')(`
    ${U.card(U.cardTitle('Heures planifiées vs capacité', 'fa-chart-column', '#f97316') + (
      (cp.charge.some(v => v > 0) || cp.capaSemaine > 0)
        ? U.chartBlock('prodChargePrev', 'bar', {
          labels: cp.labels,
          datasets: [
            { label: 'Charge planifiée (h)', data: cp.charge, backgroundColor: cp.charge.map(v => cp.capaSemaine > 0 && v > cp.capaSemaine ? '#ef4444' : '#f97316'), borderRadius: 4, order: 2 },
            { type: 'line', label: 'Capacité (h/sem)', data: cp.capacite, borderColor: '#111827', borderDash: [5, 4], pointRadius: 0, fill: false, order: 1 },
          ],
        }, { plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'heures' } } } }, 240)
        : U.emptyState('Aucun BDT planifié — les heures apparaissent dès qu\'un BDT a une date prévue')))}
    ${U.card(U.cardTitle('Synthèse', 'fa-list-check', '#f97316') +
      `<div style="display:flex;flex-direction:column;gap:8px;">
        ${U.miniBar('Capacité / semaine', cp.capaSemaine, cp.capaSemaine || 1, '#22c55e', ' h')}
        <div style="display:flex;justify-content:space-between;font-size:.74rem;padding:6px 0;border-bottom:1px solid #f8fafc;"><span style="color:#374151;">Opérateurs actifs</span><span style="font-weight:800;">${cp.ops}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:.74rem;padding:6px 0;border-bottom:1px solid #f8fafc;"><span style="color:#374151;">Semaines en surcharge</span><span style="font-weight:800;color:${cp.surchargeWeeks ? '#dc2626' : '#16a34a'};">${cp.surchargeWeeks}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:.74rem;padding:6px 0;border-bottom:1px solid #f8fafc;"><span style="color:#374151;">Heures en retard (à replanifier)</span><span style="font-weight:800;color:${cp.retard ? '#f59e0b' : '#16a34a'};">${cp.retard} h</span></div>
        <div style="display:flex;justify-content:space-between;font-size:.74rem;padding:6px 0;"><span style="color:#374151;">Au-delà de 8 semaines</span><span style="font-weight:800;color:#6366f1;">${cp.auDela} h</span></div>
      </div>`)}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Distribution du lead time', 'fa-chart-column', '#8b5cf6') + ((p.leadDist as number[]).some(v => v > 0) ? barChart('prodLead', ['< 7 j', '7-14 j', '14-30 j', '30 j +'], [{ label: 'Commandes', data: p.leadDist, backgroundColor: '#8b5cf6', borderRadius: 4 }]) : U.emptyState('Lead time indisponible')))}
    ${U.card(U.cardTitle('Productivité — temps alloué vs réel', 'fa-stopwatch', '#f97316') + (p.tempsAlloue ? `
      <div style="display:flex;gap:12px;">
        <div style="flex:1;background:#f8fafc;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:1.3rem;font-weight:900;color:#111827;">${p.tempsAlloue} h</div><div style="font-size:.7rem;color:#6b7280;">Alloué</div></div>
        <div style="flex:1;background:#f8fafc;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:1.3rem;font-weight:900;color:#111827;">${p.tempsReel} h</div><div style="font-size:.7rem;color:#6b7280;">Réel</div></div>
        <div style="flex:1;background:${(p.ecartTempsPct || 0) > 0 ? '#fef2f2' : '#f0fdf4'};border-radius:10px;padding:14px;text-align:center;"><div style="font-size:1.3rem;font-weight:900;color:${(p.ecartTempsPct || 0) > 0 ? '#dc2626' : '#16a34a'};">${p.ecartTempsPct != null ? (p.ecartTempsPct > 0 ? '+' : '') + p.ecartTempsPct + '%' : '—'}</div><div style="font-size:.7rem;color:#6b7280;">Écart</div></div>
      </div>` : U.emptyState('Temps alloué/réel non saisis sur les BDT')))}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard Production', pageHeader('fas fa-industry', '#ea580c,#c2410c', 'Dashboard Production – Lénaïck', 'OTD · OTK · Takt · Lead time · Charge · Incidents', ['KPI', 'Production']) + (f ? U.filterBar(f, '/dashboard/production', { clients, exportable: true }) : '') + content, 'service-prod', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD QUALITÉ – Pierre-Yves / Agathe
// ──────────────────────────────────────────────────────────────
export const dashQualite = (d: DashboardData, f?: DashFilter) => {
  const q = K.qualite(d, f)
  const oNC = objectif(d, 'taux_nc'); const oCpk = objectif(d, 'cpk'); const oPV = objectif(d, 'liberation_pv')
  const clients = Array.from(new Set(((d.ncs || []) as any[]).map(n => n.client_nom).filter(Boolean))).sort() as string[]
  const ecme = (d.ecme || []) as any[]
  const ecmeAEtalonner = ecme.filter(e => /etalonn|renouv|retard|du\b/.test(lc(e.statut)) || (e.date_prochain_etalonnage && String(e.date_prochain_etalonnage).slice(0, 10) <= K.todayISO())).length
  const audits = (d.audits || []) as any[]
  const content = wrap(`
  ${g5(`
    ${U.kpiCard('fa-exclamation-triangle', q.ncOpen.length, 'NC ouvertes', `${q.ncCrit} critique(s)`, '#ef4444', '#fef2f2', { href: '/qualite/nc-liste' + filterQS(f) })}
    ${U.kpiCard('fa-percent', q.tauxNC + '%', 'Taux de NC', `${q.ncTotal} NC / lots`, K.statutObjectif(q.tauxNC, oNC).color, '#fffbeb', { obj: U.kpiObj(q.tauxNC, oNC) })}
    ${U.kpiCard('fa-bullseye', q.cpkMoyen != null ? q.cpkMoyen : '—', 'Cpk moyen', `${q.nControles} contrôle(s) · PPM ${q.ppm != null ? q.ppm : '—'}`, q.cpkMoyen != null ? K.statutObjectif(q.cpkMoyen, oCpk).color : '#94a3b8', '#f5f3ff', { obj: q.cpkMoyen != null ? U.kpiObj(q.cpkMoyen, oCpk) : undefined })}
    ${U.kpiCard('fa-check-circle', q.pvTotal ? q.liberationPV + '%' : '—', 'Libération PV', `${q.pvTotal} PV`, q.pvTotal ? K.statutObjectif(q.liberationPV, oPV).color : '#94a3b8', '#f0fdf4', { obj: q.pvTotal ? U.kpiObj(q.liberationPV, oPV) : undefined })}
    ${U.kpiCard('fa-box', q.quarOpen, 'Quarantaines', `Durée moy. ${q.dureeMoyQuar != null ? q.dureeMoyQuar + ' j' : '—'} · ${q.r8dOpen} 8D`, '#6366f1', '#eff6ff')}
  `)}
  ${grid('2fr 1fr')(`
    ${U.card(U.cardTitle('Non-conformités par mois', 'fa-chart-line', '#ef4444') + ((q.serieNC.some(v => v > 0) || (f && f.compare)) ? lineChart('qNC', q.monthLabels, [{ label: 'NC', data: q.serieNC, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.12)', fill: true }, ...(f && f.compare ? [{ label: 'NC N-1', data: q.serieNCprev, borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, fill: false } as any] : [])]) : U.emptyState('Aucune non-conformité enregistrée')))}
    ${U.card(q.cpkMoyen != null ? U.gauge(q.conformePct || 0, null, 'Conformité cotes') + `<div style="text-align:center;font-size:.7rem;color:#6b7280;margin-top:6px;">Cp ${q.cpMoyen} · Cpk ${q.cpkMoyen} · PPM ${q.ppm}</div>` : U.cardTitle('Capabilité (SPC)', 'fa-bullseye', '#6366f1') + U.emptyState('Aucun contrôle de cote saisi'))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('NC actives à traiter', 'fa-list', '#ef4444') + (q.ncOpen.length ? q.ncOpen.slice(0, 6).map((n: any) => `
      <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:10px;background:${/bloquante|critique/.test(lc(n.gravite)) ? '#fef2f2' : '#f8fafc'};margin-bottom:6px;border-left:3px solid ${/bloquante|critique/.test(lc(n.gravite)) ? '#ef4444' : /majeure/.test(lc(n.gravite)) ? '#f59e0b' : '#6b7280'};">
        <div style="flex:1;"><div style="font-size:.75rem;font-weight:700;">${esc(n.id)} · ${esc(n.client_nom || '—')}</div>
          <div style="font-size:.63rem;color:#9ca3af;">${esc(n.type_nc || '—')} · ${esc(n.gravite)} · ${esc(n.statut)}</div></div>
        <span style="font-size:.63rem;color:#6b7280;">${esc(n.date_nc || '')}</span>
      </div>`).join('') : U.emptyState('Aucune non-conformité ouverte')) + `<a href="/qualite/nc-liste" style="display:block;text-align:center;margin-top:10px;font-size:.72rem;color:#ef4444;font-weight:700;text-decoration:none;">Voir toutes les NC →</a>`)}
    ${U.card(U.cardTitle('Contrôles & audits', 'fa-calendar-alt', '#6366f1') + `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        <div style="background:#f5f3ff;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:1.4rem;font-weight:900;color:#6366f1;">${ecmeAEtalonner}</div><div style="font-size:.68rem;color:#6b7280;font-weight:700;">ECME à étalonner</div><div style="font-size:.6rem;color:#9ca3af;">${ecme.length} instrument(s)</div></div>
        <div style="background:#eff6ff;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:1.4rem;font-weight:900;color:#3b82f6;">${audits.filter(a => /planif|prevu/.test(lc(a.statut))).length}</div><div style="font-size:.68rem;color:#6b7280;font-weight:700;">Audits à planifier</div><div style="font-size:.6rem;color:#9ca3af;">${audits.length} audit(s)</div></div>
      </div>`)}
  `)}
  ${U.sectionTitle('Analyse des non-conformités', 'fa-chart-pie')}
  ${grid('1fr 1fr 1fr')(`
    ${U.card(U.cardTitle('Pareto NC par type', 'fa-chart-bar', '#ef4444') + (q.ncByType.length ? barChart('qParType', q.ncByType.map(e => String(e[0]).slice(0, 18)), [{ label: 'NC', data: q.ncByType.map(e => e[1]), backgroundColor: '#ef4444', borderRadius: 4 }], { indexAxis: 'y' }, 180) : U.emptyState('Aucune NC')))}
    ${U.card(U.cardTitle('NC par gravité', 'fa-layer-group', '#f59e0b') + (q.ncByGravite.length ? doughnut('qGrav', q.ncByGravite.map(e => String(e[0])), q.ncByGravite.map(e => e[1]), ['#ef4444', '#f59e0b', '#3b82f6', '#94a3b8', '#22c55e'], 180) : U.emptyState('Aucune NC')))}
    ${U.card(U.cardTitle('Ancienneté des NC ouvertes', 'fa-hourglass-half', '#6366f1') + (q.ncOpen.length ? barChart('qAging', ['0-30 j', '30-60 j', '60-90 j', '90 j +'], [{ label: 'NC ouvertes', data: [q.ncAging.b0_30, q.ncAging.b30_60, q.ncAging.b60_90, q.ncAging.b90], backgroundColor: ['#22c55e', '#f59e0b', '#f97316', '#ef4444'], borderRadius: 4 }], {}, 180) : U.emptyState('Aucune NC ouverte')))}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard Qualité', pageHeader('fas fa-clipboard-check', '#ef4444,#dc2626', 'Dashboard Qualité – Pierre-Yves / Agathe', 'NC · SPC Cp/Cpk · PV · Quarantaines · ECME · EN9100', ['KPI', 'Qualité', 'EN9100']) + (f ? U.filterBar(f, '/dashboard/qualite', { clients, exportable: true }) : '') + content, 'service-qualite', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD EXPÉDITION – Sabine
// ──────────────────────────────────────────────────────────────
export const dashExpedition = (d: DashboardData, f?: DashFilter) => {
  const k = K.expedition(d, f)
  const oOtd = objectif(d, 'otd')
  const clients = Array.from(new Set([...((d.commandes || []) as any[]).map(c => c.client_nom), ...((d.bls || []) as any[]).map((b: any) => b.client_nom)].filter(Boolean))).sort() as string[]
  const content = wrap(`
  ${g4(`
    ${U.kpiCard('fa-truck-loading', k.cmdAExp.length, 'Cmd à expédier', k.cmdBloqueeQ.length ? k.cmdBloqueeQ.length + ' bloquée(s) qualité' : 'Production soldée + qualité OK', k.cmdBloqueeQ.length ? '#ef4444' : '#06b6d4', k.cmdBloqueeQ.length ? '#fef2f2' : '#ecfeff')}
    ${U.kpiCard('fa-check-circle', k.otdTot ? k.otd + '%' : '—', 'OTD livraisons', `${k.otdTot} cmd évaluées`, k.otdTot ? K.statutObjectif(k.otd, oOtd).color : '#94a3b8', '#f0fdf4', { obj: k.otdTot ? U.kpiObj(k.otd, oOtd) : undefined })}
    ${U.kpiCard('fa-file-signature', k.blClients.length, 'BL clients (total)', `${k.blPeriode} sur la période`, '#3b82f6', '#eff6ff')}
    ${U.kpiCard('fa-exclamation-triangle', k.cmdRetard.length, 'Retards en cours', k.cmdRetard.length ? 'Commandes en retard' : 'Aucun retard', k.cmdRetard.length ? '#ef4444' : '#22c55e', k.cmdRetard.length ? '#fef2f2' : '#f0fdf4')}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Commandes en attente d’expédition', 'fa-list-alt', '#06b6d4') + (k.cmdAExp.length ? k.cmdAExp.slice(0, 6).map((c: any) => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f8fafc;border-radius:10px;margin-bottom:7px;">
        <div style="flex:1;"><div style="font-size:.78rem;font-weight:700;">${esc(c.id)} · ${esc(c.client_nom || '—')}</div>
          <div style="font-size:.65rem;color:#9ca3af;">${fmtEur(num(c.montant))} · Liv. : ${esc(c.date_liv || '—')}</div></div>
        <span style="font-size:.65rem;background:#eff6ff;color:#1d4ed8;border-radius:6px;padding:2px 8px;font-weight:700;">${esc(c.statut)}</span>
      </div>`).join('') : U.emptyState('Aucune commande prête à expédier')) + `<a href="/expedition/bl-liste" style="display:block;text-align:center;margin-top:10px;font-size:.72rem;color:#06b6d4;font-weight:700;text-decoration:none;">Voir tous les BL →</a>`)}
    ${U.card(U.cardTitle('BL clients par mois', 'fa-chart-line', '#22c55e') + (k.blClients.length ? barChart('expBL', k.monthLabels, [
      { label: 'BL', data: k.blSeries, backgroundColor: '#06b6d4', borderRadius: 4 },
      ...(f && f.compare ? [{ type: 'line', label: 'BL N-1', data: k.blSeriesPrev, borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, backgroundColor: 'transparent' } as any] : []),
    ]) : U.emptyState('Aucun bon de livraison')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Volume expédié (qté) par mois', 'fa-boxes-stacked', '#0891b2') + (k.volSeries.some(v => v > 0) ? barChart('expVol', k.monthLabels, [{ label: 'Qté livrée', data: k.volSeries, backgroundColor: '#0891b2', borderRadius: 4 }]) : U.emptyState('Aucun volume expédié')))}
    ${U.card(U.cardTitle('Répartition par transporteur', 'fa-truck', '#6366f1') + (k.parTransporteur.length ? doughnut('expTransp', k.parTransporteur.map(t => String(t[0])), k.parTransporteur.map(t => t[1]), U.PALETTE) : U.emptyState('Aucun transporteur renseigné')))}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard Expédition', pageHeader('fas fa-truck-loading', '#06b6d4,#0891b2', 'Dashboard Expédition – Sabine', 'BL · OTD · Retards · Transport', ['KPI', 'Expédition', 'OTD']) + (f ? U.filterBar(f, '/dashboard/expedition', { clients, exportable: true }) : '') + content, 'service-expeditions', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD MAINTENANCE
// ──────────────────────────────────────────────────────────────
export const dashMaintenance = (d: DashboardData, f?: DashFilter) => {
  const m = K.maintenance(d, f)
  const oDispo = objectif(d, 'dispo_machine')
  const machineNames = Array.from(new Set(((d.machines || []) as any[]).map((x: any) => x.nom).filter(Boolean))).sort() as string[]
  const machines = (d.machines || []) as any[]
  const prevActif = (d.preventifs || []).filter((p: any) => p.actif)
  const oms = (d.oms || []) as any[]
  const upcoming: { m: string, d: string, t: string, p: string }[] = []
  for (const p of prevActif) { if ((p as any).prochain_prevu) upcoming.push({ m: (p as any).intitule || (p as any).machine_nom, d: String((p as any).prochain_prevu).slice(0, 10), t: (p as any).type || 'préventif', p: 'normal' }) }
  for (const o of oms.filter(x => isOpen(x.statut) && x.date_prevue)) upcoming.push({ m: o.titre || o.machine_nom || 'OM', d: String(o.date_prevue).slice(0, 10), t: o.type || 'OM', p: o.priorite || 'normal' })
  upcoming.sort((a, b) => a.d.localeCompare(b.d))
  const content = wrap(`
  ${g4(`
    ${U.kpiCard('fa-exclamation-circle', m.pannes, 'Machines en panne', `${m.omOpen} OM ouvert(s)`, m.pannes ? '#ef4444' : '#22c55e', m.pannes ? '#fef2f2' : '#f0fdf4')}
    ${U.kpiCard('fa-tachometer-alt', m.machinesTotal ? m.disponibilite + '%' : '—', 'Disponibilité parc', `OEE ${m.oee != null ? m.oee + '%' : '—'} · ${m.machinesTotal} machine(s)`, m.machinesTotal ? K.statutObjectif(m.disponibilite, oDispo).color : '#94a3b8', '#f0fdf4', { obj: m.machinesTotal ? U.kpiObj(m.disponibilite, oDispo) : undefined })}
    ${U.kpiCard('fa-tools', m.mttrMoyen != null ? m.mttrMoyen + 'h' : '—', 'MTTR moyen', m.mtbfMoyen != null ? `MTBF ${m.mtbfMoyen}h` : 'temps de réparation', '#3b82f6', '#eff6ff')}
    ${U.kpiCard('fa-shield-alt', m.ratioPreventif + '%', 'Ratio préventif', `${m.prev} prév. · ${m.corr} corr.${m.coutHoraireReel != null ? ' · ' + m.coutHoraireReel + '€/h réel' : ''}`, '#f59e0b', '#fffbeb')}
  `)}
  ${grid('1fr 1fr 1fr')(`
    ${U.card(U.gauge(m.disponibilite, oDispo, 'Disponibilité parc'))}
    ${U.card(U.cardTitle('Préventif vs Correctif', 'fa-balance-scale', '#f59e0b') + ((m.prev + m.corr) ? doughnut('maintRatio', ['Préventif', 'Correctif'], [m.prev, m.corr], ['#22c55e', '#ef4444'], 180) : U.emptyState('Aucun OM typé')))}
    ${U.card(U.cardTitle('Statut machines', 'fa-industry', '#eab308') + (machines.length ? machines.slice(0, 7).map((mc: any) => {
      const op = lc(mc.statut) === 'operationnel'; const col = op ? '#22c55e' : lc(mc.statut) === 'maintenance' ? '#3b82f6' : '#ef4444'
      return `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f8fafc;"><div style="flex:1;"><div style="font-size:.74rem;font-weight:700;">${esc(mc.nom)}</div><div style="font-size:.62rem;color:#6b7280;">${esc(mc.code || '')} · ${esc(mc.activite || '')}</div></div><span style="font-size:.62rem;font-weight:700;color:${col};background:${op ? '#f0fdf4' : col === '#3b82f6' ? '#eff6ff' : '#fef2f2'};border-radius:8px;padding:3px 9px;">${esc(mc.statut)}</span></div>`
    }).join('') : U.emptyState('Aucune machine déclarée')))}
  `)}
  ${U.card(U.cardTitle('Prochaines maintenances', 'fa-calendar-alt', '#3b82f6') + `<button onclick="(async()=>{const r=await fetch('/api/maintenance/preventif/generer',{method:'POST'});const j=await r.json().catch(()=>({}));alert(j&&j.ok?((j.created||0)+' OM préventif(s) généré(s).'):'Erreur de génération');softReload();})()" style="margin:0 0 12px;background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:8px;padding:7px 13px;font-size:.72rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-bolt"></i>Générer les OM préventifs dus</button>` + (upcoming.length ? upcoming.slice(0, 8).map(mu => `
    <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:#fffbeb;border-radius:10px;margin-bottom:6px;border-left:3px solid ${mu.p === 'urgent' || mu.p === 'critique' ? '#ef4444' : '#f59e0b'};">
      <div style="flex:1;"><div style="font-size:.75rem;font-weight:700;">${esc(mu.m)}</div><div style="font-size:.63rem;color:#9ca3af;">${esc(mu.t)} · ${esc(mu.d)}</div></div></div>`).join('') : U.emptyState('Aucune maintenance planifiée')))}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Backlog OM par âge', 'fa-hourglass-half', '#ef4444') + (m.omOpen ? `<div style="display:flex;gap:8px;margin-bottom:10px;">${([['0-7 j', 'b0_7', '#22c55e'], ['8-30 j', 'b8_30', '#f59e0b'], ['31-90 j', 'b31_90', '#f97316'], ['>90 j', 'b90', '#ef4444']] as [string, string, string][]).map(([l, kk, c]) => `<div style="flex:1;text-align:center;background:${c}14;border-radius:8px;padding:8px;"><div style="font-weight:900;font-size:1.2rem;color:${c};">${(m.backlog as any)[kk]}</div><div style="font-size:.58rem;color:#6b7280;">${l}</div></div>`).join('')}</div>` + (m.backlogTop.length ? m.backlogTop.map((o: any) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f8fafc;"><div style="flex:1;min-width:0;font-size:.72rem;font-weight:700;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(String(o.titre))}${o.machine ? ` · ${esc(String(o.machine))}` : ''}</div><span style="font-size:.64rem;font-weight:800;color:${o.age > 90 ? '#b91c1c' : o.age > 30 ? '#b45309' : '#6b7280'};">${o.age} j</span></div>`).join('') : '') : U.emptyState('Aucun OM ouvert')))}
    ${U.card(U.cardTitle('Coût de maintenance mensuel', 'fa-euro-sign', '#eab308') + (m.serieCoutMaint.some(v => v > 0) ? lineChart('mtCout', m.monthLabels, [
      { label: 'Coût OM', data: m.serieCoutMaint.map(v => Math.round(v)), borderColor: '#eab308', backgroundColor: 'rgba(234,179,8,.12)', fill: true },
      ...(f && f.compare ? [{ label: 'Coût OM N-1', data: m.serieCoutMaintPrev.map(v => Math.round(v)), borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, fill: false } as any] : []),
    ]) : U.emptyState('Aucun coût OM sur la période')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('OPEX par machine (€)', 'fa-coins', '#eab308') + (m.opexParMachine.length ? m.opexParMachine.map(([n, v], i) => U.miniBar(esc(n), Math.round(v), Math.round(m.opexParMachine[0][1]), U.PALETTE[i % U.PALETTE.length], '€')).join('') + `<div style="font-size:.66rem;color:#94a3b8;margin-top:8px;">Total OPEX ${fmtEur(m.coutOpexTotal)} · ${m.heuresProd} h productives${m.coutHoraireReel != null ? ' · ' + m.coutHoraireReel + ' €/h réel' : ''}</div>` : U.emptyState('OPEX machine non renseigné (machines_opex)')))}
    ${U.card(U.cardTitle('MTBF / MTTR par machine', 'fa-gauge', '#3b82f6') + (m.mtbfParMachine.length ? `<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:2px solid #f1f5f9;">${['Machine', 'MTBF', 'MTTR', 'Dispo', 'Pannes'].map(h => `<th style="padding:5px 7px;font-size:.62rem;color:#6b7280;font-weight:700;text-align:left;">${h}</th>`).join('')}</tr></thead><tbody>${m.mtbfParMachine.map((x: any) => `<tr style="border-bottom:1px solid #f8fafc;"><td style="padding:6px 7px;font-size:.7rem;font-weight:700;color:#374151;">${esc(x.nom)}</td><td style="padding:6px 7px;font-size:.7rem;">${x.mtbf || '—'}h</td><td style="padding:6px 7px;font-size:.7rem;color:${x.mttr > 24 ? '#b91c1c' : '#374151'};">${x.mttr || '—'}h</td><td style="padding:6px 7px;font-size:.7rem;">${x.dispo ? x.dispo + '%' : '—'}</td><td style="padding:6px 7px;font-size:.7rem;">${x.pannes || 0}</td></tr>`).join('')}</tbody></table>` : U.emptyState('Aucune donnée MTBF/MTTR par machine')))}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard Maintenance', pageHeader('fas fa-wrench', '#eab308,#ca8a04', 'Dashboard Maintenance', 'Disponibilité · MTBF/MTTR · Préventif · Coûts', ['KPI', 'GMAO']) + (f ? U.filterBar(f, '/dashboard/maintenance', { machines: machineNames, exportable: true }) : '') + content, 'service-maintenance', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD RH / COMPTA
// ──────────────────────────────────────────────────────────────
export const dashRH = (d: DashboardData, f?: DashFilter) => {
  const r = K.rh(d, f)
  const oAbs = objectif(d, 'absenteisme')
  const site = f && f.site ? lc(f.site) : ''
  const ops = (d.salaries || []).filter((s: any) => s.est_operateur === true && s.actif !== false && (!site || lc(s.entite) === site))
  const absSet = new Set((d.absences || []).filter((a: any) => String(a.date_absence || '').slice(0, 10) === K.todayISO()).map((a: any) => a.operateur_id))
  const entiteEntries = Object.entries(r.parEntite)
  const contratEntries = Object.entries(r.parContrat)
  const habilTot = r.habilAging.expire + r.habilAging.j30 + r.habilAging.j60 + r.habilAging.j90
  const content = wrap(`
  ${g4(`
    ${U.kpiCard('fa-users', r.effectif, 'Effectif actif', `${r.ops} opérateur(s)`, '#14b8a6', '#f0fdfa')}
    ${U.kpiCard('fa-calendar-times', r.absToday, `Absences (${r.periodLabel})`, `Absentéisme ${r.absenteisme}%`, r.absToday ? '#ef4444' : '#22c55e', r.absToday ? '#fef2f2' : '#f0fdf4', { obj: U.kpiObj(r.absenteisme, oAbs) })}
    ${U.kpiCard('fa-graduation-cap', r.certExp, 'Habilitations ⚠', `${r.certBientot} expire(nt) <30j`, '#f59e0b', '#fffbeb', { href: '/production/competences' + filterQS(f) })}
    ${U.kpiCard('fa-business-time', r.heuresMois + 'h', `Heures (${r.periodLabel})`, `dont ${r.heuresSup}h sup`, '#6366f1', '#f5f3ff')}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Effectif par entité', 'fa-sitemap', '#14b8a6') + (entiteEntries.length ? doughnut('rhEntite', entiteEntries.map(e => String(e[0])), entiteEntries.map(e => e[1]), U.PALETTE, 200) : U.emptyState('Aucun salarié')))}
    ${U.card(U.cardTitle('Répartition par type de contrat', 'fa-id-card', '#14b8a6') + (contratEntries.length ? doughnut('rhContrat', contratEntries.map(e => String(e[0])), contratEntries.map(e => e[1]) as number[], U.PALETTE, 200) : U.emptyState('Aucun salarié')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Tendance absentéisme (nb absences / mois)', 'fa-calendar-times', '#ef4444') + (r.serieAbs.some(v => v > 0) ? lineChart('rhAbsTrend', r.monthLabels, [
      { label: 'Absences', data: r.serieAbs, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.12)', fill: true },
      ...(f && f.compare ? [{ label: 'Absences N-1', data: r.serieAbsPrev, borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, fill: false } as any] : []),
    ]) : U.emptyState('Aucune absence sur la période')))}
    ${U.card(U.cardTitle('Ancienneté des habilitations', 'fa-hourglass-half', '#f59e0b') + (habilTot ? `<div style="display:flex;gap:8px;">${([['Déjà expiré', 'expire', '#ef4444'], ['< 30 j', 'j30', '#f97316'], ['30-60 j', 'j60', '#f59e0b'], ['60-90 j', 'j90', '#22c55e']] as [string, string, string][]).map(([l, kk, c]) => `<div style="flex:1;text-align:center;background:${c}14;border-radius:8px;padding:12px 6px;"><div style="font-weight:900;font-size:1.4rem;color:${c};">${(r.habilAging as any)[kk]}</div><div style="font-size:.58rem;color:#6b7280;margin-top:2px;">${l}</div></div>`).join('')}</div>` : U.emptyState('Aucune habilitation à échéance')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Présence opérateurs – Aujourd\'hui', 'fa-user-clock', '#14b8a6') + (ops.length ? ops.slice(0, 12).map((o: any) => {
      const abs = absSet.has(o.id); const nom = `${o.prenom || ''} ${o.nom || ''}`.trim() || o.nom || '—'
      return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f8fafc;"><div style="flex:1;font-size:.74rem;font-weight:700;color:#374151;">${esc(nom)}</div><span style="font-size:.62rem;padding:2px 9px;border-radius:999px;font-weight:700;background:${abs ? '#fef2f2' : '#f0fdf4'};color:${abs ? '#b91c1c' : '#15803d'};">${abs ? 'Absent' : 'Présent'}</span></div>`
    }).join('') : U.emptyState('Aucun opérateur déclaré')))}
    ${U.card(U.cardTitle('Habilitations / Certifications', 'fa-shield-alt', '#7c3aed') + (r.certs.length ? r.certs.slice(0, 10).map((c: any) => `
    <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f8fafc;">
      <div style="flex:1;min-width:0;"><div style="font-size:.74rem;font-weight:700;color:#374151;">${esc(c.employe_nom || '—')}</div><div style="font-size:.62rem;color:#9ca3af;">${esc(c.intitule || '')}</div></div>
      <span style="font-size:.6rem;padding:2px 7px;border-radius:6px;font-weight:700;background:${lc(c.statut) === 'valide' ? '#f0fdf4' : '#fef2f2'};color:${lc(c.statut) === 'valide' ? '#15803d' : '#b91c1c'};">${esc(c.statut)}</span>
    </div>`).join('') : U.emptyState('Aucune certification enregistrée')) + `<a href="/production/competences" style="display:block;text-align:center;margin-top:10px;font-size:.72rem;color:#7c3aed;font-weight:700;text-decoration:none;">Gérer les compétences →</a>`)}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard RH', pageHeader('fas fa-users-cog', '#14b8a6,#0d9488', 'Dashboard RH – Morgane', 'Effectif · Absentéisme · Heures · Habilitations', ['KPI', 'RH']) + (f ? U.filterBar(f, '/dashboard/rh', { exportable: true }) : '') + content, 'service-rh', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD FINANCE / TRÉSORERIE  (NOUVEAU)
// ──────────────────────────────────────────────────────────────
export const dashFinance = (d: DashboardData, f?: DashFilter) => {
  const fin = K.finance(d, f)
  const oMarge = objectif(d, 'marge_pct'); const oDso = objectif(d, 'dso'); const oDpo = objectif(d, 'dpo')
  const clients = Array.from(new Set(((d.facturesClient || []) as any[]).map(x => x.client_nom).filter(Boolean))).sort() as string[]
  const agrows = (ag: any) => [['0–30 j', 'b0_30', '#22c55e'], ['30–60 j', 'b30_60', '#f59e0b'], ['60–90 j', 'b60_90', '#f97316'], ['+90 j', 'b90', '#ef4444']].map(([l, k2, c]) => U.miniBar(l as string, Math.round(ag[k2 as string]), ag.total, c as string, '€')).join('')
  const content = wrap(`
  ${g4(`
    ${U.kpiCard('fa-euro-sign', fmtEur(fin.caHT), `CA HT (${fin.periodLabel})`, `Marge ${fmtEur(fin.margeHT)}`, '#3b82f6', '#eff6ff', { spark: fin.caSerie, sparkColor: '#3b82f6' })}
    ${U.kpiCard('fa-percent', fin.tauxMarge + '%', 'Taux de marge', `Charges ${fmtEur(fin.chargesHT)}`, K.statutObjectif(fin.tauxMarge, oMarge).color, '#f0fdf4', { obj: U.kpiObj(fin.tauxMarge, oMarge) })}
    ${U.kpiCard('fa-wallet', fmtEur(fin.tresorerie), 'Trésorerie nette', `Encaissé ${fmtEur(fin.encaisse)}`, fin.tresorerie >= 0 ? '#22c55e' : '#ef4444', fin.tresorerie >= 0 ? '#f0fdf4' : '#fef2f2')}
    ${U.kpiCard('fa-hourglass-half', fin.dso + ' j', 'DSO', `Encours ${fmtEur(fin.encoursClients)}`, K.statutObjectif(fin.dso, oDso).color, '#fffbeb', { obj: U.kpiObj(fin.dso, oDso) })}
  `)}
  ${grid('2fr 1fr')(`
    ${U.card(U.cardTitle('CA vs Charges (HT, €)', 'fa-chart-area', '#3b82f6') + ((fin.caSerie.some(v => v > 0) || fin.chSerie.some(v => v > 0)) ? lineChart('finCAch', fin.monthLabels, [
      { label: 'CA HT', data: fin.caSerie.map(v => Math.round(v)), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.10)', fill: true },
      { label: 'Charges HT', data: fin.chSerie.map(v => Math.round(v)), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.08)', fill: true },
      ...(f && f.compare ? [{ label: 'CA HT N-1', data: fin.caSeriePrev.map(v => Math.round(v)), borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, fill: false } as any] : []),
    ]) : U.emptyState('Aucune facture sur la période')))}
    ${U.card(U.cardTitle('Top clients (CA HT)', 'fa-trophy', '#3b82f6') + (fin.topClients.length ? fin.topClients.map(([n, v], i) => U.miniBar(esc(n), Math.round(v / 1000), Math.round(fin.topClients[0][1] / 1000), U.PALETTE[i % U.PALETTE.length], 'k€')).join('') : U.emptyState('Aucune facture client')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Encaissements vs Décaissements (TTC, €)', 'fa-exchange-alt', '#22c55e') + ((fin.encSerie.some(v => v > 0) || fin.decSerie.some(v => v > 0)) ? barChart('finCash', fin.monthLabels, [
      { label: 'Encaissé', data: fin.encSerie.map(v => Math.round(v)), backgroundColor: '#22c55e', borderRadius: 3 },
      { label: 'Décaissé', data: fin.decSerie.map(v => Math.round(v)), backgroundColor: '#ef4444', borderRadius: 3 },
    ]) : U.emptyState('Aucun règlement enregistré')))}
    ${U.card(U.cardTitle('Balance âgée — clients vs fournisseurs', 'fa-clock', '#f59e0b') + `
      <div style="font-size:.64rem;font-weight:800;color:#94a3b8;margin-bottom:4px;">CRÉANCES CLIENTS</div>${fin.aging.total > 0 ? agrows(fin.aging) : '<div style="font-size:.72rem;color:#9ca3af;">Aucune créance</div>'}
      <div style="font-size:.64rem;font-weight:800;color:#94a3b8;margin:8px 0 4px;">DETTES FOURNISSEURS</div>${fin.agingFourn.total > 0 ? agrows(fin.agingFourn) : '<div style="font-size:.72rem;color:#9ca3af;">Aucune dette</div>'}
      <div style="margin-top:10px;display:flex;justify-content:space-between;font-size:.74rem;"><span style="color:#374151;font-weight:700;">Impayés en retard</span><span style="color:#b91c1c;font-weight:800;">${fmtEur(fin.impayes)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:.74rem;"><span style="color:#374151;font-weight:700;">DPO fournisseurs</span><span style="color:${K.statutObjectif(fin.dpo, oDpo).color};font-weight:800;">${fin.dpo} j</span></div>`)}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard Finance', pageHeader('fas fa-coins', '#0ea5e9,#0369a1', 'Dashboard Finance / Trésorerie', 'CA · Marge · Trésorerie · DSO/DPO · Aging · Cash-flow', ['KPI', 'Finance']) + (f ? U.filterBar(f, '/dashboard/finance', { clients, exportable: true }) : '') + content, 'service-compta', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD STOCK / INVENTAIRE  (NOUVEAU)
// ──────────────────────────────────────────────────────────────
export const dashStock = (d: DashboardData, f?: DashFilter) => {
  const s = K.stock(d, f)
  const oRot = objectif(d, 'rotation_stock')
  const abcCells = [['A', s.abc.A, s.abc.valA, '#ef4444'], ['B', s.abc.B, s.abc.valB, '#f59e0b'], ['C', s.abc.C, s.abc.valC, '#22c55e']] as [string, number, number, string][]
  const content = wrap(`
  ${g4(`
    ${U.kpiCard('fa-warehouse', fmtEur(s.valorisation), 'Valorisation stock', `${s.nbArticles} référence(s)`, '#3b82f6', '#eff6ff')}
    ${U.kpiCard('fa-exclamation-triangle', s.ruptures.length, 'Ruptures', `${s.sousMini.length} sous le mini`, s.ruptures.length ? '#ef4444' : '#22c55e', s.ruptures.length ? '#fef2f2' : '#f0fdf4')}
    ${U.kpiCard('fa-sync-alt', s.rotation != null ? s.rotation : '—', 'Rotation stock', `Couverture ${s.couvertureMoy != null ? s.couvertureMoy + ' mois' : '—'}`, s.rotation != null ? K.statutObjectif(s.rotation, oRot).color : '#94a3b8', '#fffbeb', { obj: s.rotation != null ? U.kpiObj(s.rotation, oRot) : undefined })}
    ${U.kpiCard('fa-snowflake', s.deadStock.length, 'Dead stock (>6 mois)', `${fmtEur(s.valeurDead)} immobilisés`, s.deadStock.length ? '#f59e0b' : '#22c55e', s.deadStock.length ? '#fffbeb' : '#f0fdf4')}
  `)}
  ${grid('2fr 1fr')(`
    ${U.card(U.cardTitle(`Flux entrées / sorties (${s.periodLabel})`, 'fa-exchange-alt', '#3b82f6') + ((s.entreeSerie.some(v => v > 0) || s.sortieSerie.some(v => v > 0)) ? barChart('stkFlux', s.monthLabels, [
      { label: 'Entrées', data: s.entreeSerie.map(v => Math.round(v)), backgroundColor: '#22c55e', borderRadius: 3 },
      { label: 'Sorties', data: s.sortieSerie.map(v => Math.round(v)), backgroundColor: '#ef4444', borderRadius: 3 },
      ...(f && f.compare ? [{ type: 'line', label: 'Sorties N-1', data: s.sortieSeriePrev.map(v => Math.round(v)), borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, backgroundColor: 'transparent' } as any] : []),
    ]) : U.emptyState('Aucun mouvement de stock')))}
    ${U.card(U.cardTitle('Valeur par activité', 'fa-sitemap', '#6366f1') + (s.parActivite.length ? doughnut('stkAct', s.parActivite.map(c => String(c[0])), s.parActivite.map(c => Math.round(c[1])), U.PALETTE) : U.emptyState('Aucun stock valorisé')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Classement ABC (Pareto valeur)', 'fa-coins', '#3b82f6') + (s.paretoAbc.length ? U.chartBlock('stkAbc', 'bar', { labels: s.paretoAbc.map(x => String(x.ref).slice(0, 14)), datasets: [
      { label: 'Valeur €', data: s.paretoAbc.map(x => Math.round(x.valeur)), backgroundColor: '#3b82f6', borderRadius: 3, order: 2 },
      { type: 'line', label: '% cumulé', data: s.paretoAbc.map(x => x.cumPct), borderColor: '#ef4444', backgroundColor: 'transparent', yAxisID: 'y1', pointRadius: 0, order: 1 },
    ] }, { plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true }, y1: { position: 'right', min: 0, max: 100, grid: { display: false } } } }, 220) + `<div style="display:flex;gap:8px;margin-top:8px;">${abcCells.map(([cl, n, v, c]) => `<div style="flex:1;text-align:center;background:${c}14;border-radius:8px;padding:6px;"><div style="font-weight:900;color:${c};font-size:1.1rem;">${cl}</div><div style="font-size:.6rem;color:#6b7280;">${n} réf · ${fmtEur(v)}</div></div>`).join('')}</div>` : U.emptyState('Aucun article valorisé')))}
    ${U.card(U.cardTitle('Suggestions de réappro', 'fa-bell', '#ef4444') + (s.reappro.length ? `<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:2px solid #f1f5f9;">${['Référence', 'Stock', 'Pt cde', 'À commander', ''].map(h => `<th style="padding:5px 8px;font-size:.62rem;color:#6b7280;font-weight:700;text-align:left;">${h}</th>`).join('')}</tr></thead><tbody>${s.reappro.map(a => `<tr style="border-bottom:1px solid #f8fafc;"><td style="padding:6px 8px;font-size:.72rem;font-weight:700;color:#374151;">${esc(String(a.ref))}</td><td style="padding:6px 8px;font-size:.72rem;color:${a.stock <= 0 ? '#b91c1c' : '#374151'};">${a.stock} ${esc(a.unite)}</td><td style="padding:6px 8px;font-size:.72rem;color:#6b7280;">${a.point}</td><td style="padding:6px 8px;font-size:.72rem;font-weight:800;color:#10b981;">${a.qte} ${esc(a.unite)}</td><td style="padding:6px 8px;">${a.auto ? `<span style="font-size:.55rem;background:#eff6ff;color:#1d4ed8;padding:1px 6px;border-radius:999px;font-weight:700;">AUTO</span>` : ''}</td></tr>`).join('')}</tbody></table>` : U.emptyState('Aucun réappro suggéré')) + `<a href="/stock/service" style="display:block;text-align:center;margin-top:10px;font-size:.72rem;color:#ef4444;font-weight:700;text-decoration:none;">Gérer le stock →</a>`)}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard Stock', pageHeader('fas fa-warehouse', '#3b82f6,#1d4ed8', 'Dashboard Stock / Inventaire', 'Valorisation · Rotation · Couverture · Ruptures · ABC', ['KPI', 'Stock']) + (f ? U.filterBar(f, '/dashboard/stock', { exportable: true }) : '') + content, 'service-stock', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD FOURNISSEURS  (NOUVEAU)
// ──────────────────────────────────────────────────────────────
export const dashFournisseurs = (d: DashboardData, f?: DashFilter) => {
  const k = K.fournisseurs(d, f)
  const oOtd = objectif(d, 'otd')
  const top = k.scores.filter(s => s.depense > 0).slice(0, 8)
  const bubble = k.scores.filter(s => s.otd != null && s.depense > 0).map(s => ({ x: s.otd, y: Math.round(s.depense), r: Math.max(5, Math.min(24, 5 + s.nbBC * 2)) }))
  const ncTop = k.scores.filter(s => s.nc > 0).sort((a, b) => b.nc - a.nc).slice(0, 8)
  const content = wrap(`
  ${g4(`
    ${U.kpiCard('fa-truck', k.nbFournisseurs, 'Fournisseurs / ST', `${k.nbActifs} actif(s)`, '#10b981', '#f0fdf4')}
    ${U.kpiCard('fa-check-circle', k.otdGlobal + '%', 'OTD global', `Fill rate ${k.fillRate}% · réceptions`, K.statutObjectif(k.otdGlobal, oOtd).color, '#eff6ff', { obj: U.kpiObj(k.otdGlobal, oOtd) })}
    ${U.kpiCard('fa-euro-sign', fmtEur(k.depenseTotale), `Dépense (${k.periodLabel})`, `${k.ncTotal} NC fournisseur`, '#f59e0b', '#fffbeb', { spark: k.serieDep, sparkColor: '#f59e0b' })}
    ${U.kpiCard('fa-chart-pie', k.concentration + '%', 'Concentration', 'part du 1er fournisseur', k.concentration > 40 ? '#ef4444' : '#6366f1', k.concentration > 40 ? '#fef2f2' : '#f5f3ff')}
  `)}
  ${grid('2fr 1fr')(`
    ${U.card(U.cardTitle('Scorecard fournisseurs', 'fa-table', '#10b981') + (k.scores.length ? `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="border-bottom:2px solid #f1f5f9;">${['Fournisseur', 'Type', 'OTD', 'BC', 'Dépense', 'NC', 'Statut'].map(h => `<th style="padding:6px 8px;font-size:.64rem;color:#6b7280;font-weight:700;text-align:left;">${h}</th>`).join('')}</tr></thead>
      <tbody>${k.scores.slice(0, 12).map(s => `<tr style="border-bottom:1px solid #f8fafc;">
        <td style="padding:7px 8px;font-size:.72rem;font-weight:700;color:#374151;">${esc(s.nom)}</td>
        <td style="padding:7px 8px;font-size:.64rem;"><span style="padding:1px 7px;border-radius:999px;background:${s.type === 'st' ? '#f5f3ff' : '#eff6ff'};color:${s.type === 'st' ? '#6d28d9' : '#1d4ed8'};font-weight:700;">${s.type === 'st' ? 'ST' : 'Fourn.'}</span></td>
        <td style="padding:7px 8px;font-size:.72rem;font-weight:700;color:${s.otd != null ? (s.otd >= 85 ? '#15803d' : '#b91c1c') : '#9ca3af'};">${s.otd != null ? s.otd + '%' : '—'}</td>
        <td style="padding:7px 8px;font-size:.72rem;color:#6b7280;">${s.nbBC}</td>
        <td style="padding:7px 8px;font-size:.72rem;font-weight:700;">${fmtEur(s.depense)}</td>
        <td style="padding:7px 8px;font-size:.72rem;font-weight:700;color:${s.nc > 0 ? '#b91c1c' : '#9ca3af'};">${s.nc || '—'}</td>
        <td style="padding:7px 8px;font-size:.62rem;"><span style="padding:1px 7px;border-radius:999px;background:${s.actif ? '#f0fdf4' : '#fffbeb'};color:${s.actif ? '#15803d' : '#b45309'};font-weight:700;">${esc(s.statut || '—')}</span></td>
      </tr>`).join('')}</tbody></table>` : U.emptyState('Aucun fournisseur référencé')))}
    ${U.card(U.cardTitle('Dépense par fournisseur', 'fa-chart-pie', '#f59e0b') + (top.length ? doughnut('fourDep', top.map(s => s.nom), top.map(s => Math.round(s.depense)), U.PALETTE) : U.emptyState('Aucune dépense')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Nuage OTD × dépense', 'fa-braille', '#6366f1') + `<div style="font-size:.64rem;color:#94a3b8;margin-bottom:4px;">Axe X : OTD % · Axe Y : dépense € · taille : nb BC</div>` + (bubble.length ? U.chartBlock('fourScatter', 'bubble', { datasets: [{ label: 'Fournisseurs', data: bubble, backgroundColor: 'rgba(99,102,241,.45)', borderColor: '#6366f1' }] }, { plugins: { legend: { display: false } }, scales: { x: { min: 0, max: 100, title: { display: true, text: 'OTD %' } }, y: { beginAtZero: true, title: { display: true, text: 'Dépense €' } } } }, 240) : U.emptyState('OTD/dépense insuffisants')))}
    ${U.card(U.cardTitle('NC par fournisseur', 'fa-exclamation-triangle', '#ef4444') + (ncTop.length ? ncTop.map((s, i) => U.miniBar(esc(s.nom), s.nc, ncTop[0].nc, '#ef4444', '')).join('') : U.emptyState('Aucune NC fournisseur enregistrée')))}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard Fournisseurs', pageHeader('fas fa-truck', '#10b981,#047857', 'Dashboard Fournisseurs', 'OTD · Fill rate · Dépenses · Concentration · Scorecard', ['KPI', 'Achats']) + (f ? U.filterBar(f, '/dashboard/fournisseurs', { exportable: true }) : '') + content, 'achats-service', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD DIRECTION – Vision consolidée
// ──────────────────────────────────────────────────────────────
export const dashDirection = (d: DashboardData, f?: DashFilter) => {
  const com = K.commercial(d, f); const fin = K.finance(d, f); const prod = K.production(d, f)
  const qual = K.qualite(d, f); const maint = K.maintenance(d); const hr = K.rh(d)
  const oOtd = objectif(d, 'otd'); const oMarge = objectif(d, 'marge_pct'); const oDso = objectif(d, 'dso'); const oDispo = objectif(d, 'dispo_machine'); const oAbs = objectif(d, 'absenteisme')
  const st = K.stock(d); const cav = K.caPrevisionnel(d, 6)
  const clients = Array.from(new Set(((d.commandes || []) as any[]).map(c => c.client_nom).filter(Boolean))).sort() as string[]

  // Jalons critiques réels
  const jalons: { t: string, d: string, p: string, icon: string, url: string }[] = []
  for (const n of qual.ncOpen.filter((x: any) => /critique|bloquante/.test(lc(x.gravite))).slice(0, 3)) jalons.push({ t: 'NC ' + n.gravite, d: n.id + ' · ' + (n.client_nom || ''), p: 'critique', icon: 'fa-exclamation-triangle', url: '/qualite/nc-liste' })
  if (fin.impayes > 0) jalons.push({ t: 'Impayés en retard', d: fmtEur(fin.impayes), p: 'critique', icon: 'fa-file-invoice-dollar', url: '/dashboard/finance' })
  for (const r of st.ruptures.slice(0, 2)) jalons.push({ t: 'Rupture stock', d: esc(r.designation || r.reference || ''), p: 'urgent', icon: 'fa-box-open', url: '/dashboard/stock' })
  if (hr.congesPending > 0) jalons.push({ t: hr.congesPending + ' congé(s) à valider', d: 'Demandes en attente', p: 'normal', icon: 'fa-plane-departure', url: '/direction/validation' })
  for (const a of (d.audits || []).filter((x: any) => /planif/.test(lc(x.statut))).slice(0, 2)) jalons.push({ t: 'Audit ' + (a.type_norme || ''), d: 'Préparation requise', p: 'normal', icon: 'fa-calendar-check', url: '/qualite/service' })

  const content = wrap(`
  ${g6(`
    ${U.kpiCard('fa-euro-sign', fmtEur(com.caMois), 'CA facturé (mois)', 'YTD ' + fmtEur(com.caYTD), '#3b82f6', '#eff6ff', { trend: com.trendCA })}
    ${U.kpiCard('fa-percent', fin.tauxMarge + '%', 'Marge brute', `Trésorerie ${fmtEur(fin.tresorerie)}`, K.statutObjectif(fin.tauxMarge, oMarge).color, '#f0fdf4', { obj: U.kpiObj(fin.tauxMarge, oMarge) })}
    ${U.kpiCard('fa-truck', prod.otd + '%', 'OTD global', `Lead ${prod.leadMoyen != null ? prod.leadMoyen + 'j' : '—'}`, K.statutObjectif(prod.otd, oOtd).color, '#f0fdf4', { obj: U.kpiObj(prod.otd, oOtd) })}
    ${U.kpiCard('fa-exclamation-triangle', qual.ncOpen.length, 'NC actives', `${qual.r8dOpen} 8D · NC ${qual.tauxNC}%`, '#ef4444', '#fef2f2')}
    ${U.kpiCard('fa-hourglass-half', fin.dso + ' j', 'DSO', `Encours ${fmtEur(fin.encoursClients)}`, K.statutObjectif(fin.dso, oDso).color, '#fffbeb', { obj: U.kpiObj(fin.dso, oDso) })}
    ${U.kpiCard('fa-tachometer-alt', maint.machinesTotal ? maint.disponibilite + '%' : '—', 'Dispo machines', `Absentéisme ${hr.absenteisme}%`, maint.machinesTotal ? K.statutObjectif(maint.disponibilite, oDispo).color : '#94a3b8', '#eff6ff')}
  `)}
  ${grid('2fr 1fr')(`
    ${U.card(U.cardTitle('CA vs Charges (k€)', 'fa-chart-area', '#3b82f6') + ((fin.caSerie.some(v => v > 0) || fin.chSerie.some(v => v > 0)) ? lineChart('dirCA', fin.monthLabels, [
      { label: 'CA HT', data: fin.caSerie.map(v => Math.round(v / 1000)), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,.10)', fill: true },
      { label: 'Charges HT', data: fin.chSerie.map(v => Math.round(v / 1000)), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.08)', fill: true },
      ...(f && f.compare ? [{ label: 'CA HT N-1', data: fin.caSeriePrev.map(v => Math.round(v / 1000)), borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, fill: false } as any] : []),
    ]) : U.emptyState('Aucune donnée financière sur la période')))}
    ${U.card(U.cardTitle('Jalons critiques', 'fa-bell', '#ef4444') + (jalons.length ? jalons.slice(0, 7).map(j => `
      <div style="display:flex;align-items:start;gap:8px;padding:9px 12px;background:${j.p === 'critique' ? '#fef2f2' : j.p === 'urgent' ? '#fffbeb' : '#f8fafc'};border-radius:10px;margin-bottom:6px;border-left:3px solid ${j.p === 'critique' ? '#ef4444' : j.p === 'urgent' ? '#f59e0b' : '#22c55e'};">
        <i class="fas ${j.icon}" style="color:${j.p === 'critique' ? '#ef4444' : j.p === 'urgent' ? '#f59e0b' : '#6b7280'};font-size:.85rem;margin-top:1px;flex-shrink:0;"></i>
        <div style="flex:1;"><div style="font-size:.75rem;font-weight:700;">${esc(j.t)}</div><div style="font-size:.63rem;color:#9ca3af;">${esc(j.d)}</div></div>
        <a href="${j.url}" style="font-size:.62rem;color:#f59e0b;font-weight:700;text-decoration:none;">→</a>
      </div>`).join('') : U.emptyState('Aucun jalon critique')))}
  `)}
  ${U.sectionTitle('Chiffre d\'affaires prévisionnel (carnet à venir)', 'fa-chart-line')}
  ${g4(`
    ${U.kpiCard('fa-coins', fmtEur(cav.totalCarnet), 'Carnet total à venir', `${cav.nbCmd} commande(s) ouverte(s)`, '#3b82f6', '#eff6ff')}
    ${U.kpiCard('fa-calendar-check', fmtEur(cav.totalHorizon), 'CA programmé (6 mois)', 'livraisons planifiées', '#22c55e', '#f0fdf4')}
    ${U.kpiCard('fa-clock-rotate-left', fmtEur(cav.retard), 'À livrer en retard', cav.retard > 0 ? 'échéance dépassée' : 'aucun retard', cav.retard > 0 ? '#dc2626' : '#16a34a', cav.retard > 0 ? '#fef2f2' : '#f0fdf4')}
    ${U.kpiCard('fa-forward', fmtEur(cav.auDela), 'Au-delà de 6 mois', 'carnet long terme', '#6366f1', '#f5f3ff')}
  `)}
  ${grid('2fr 1fr')(`
    ${U.card(U.cardTitle('CA programmé par mois de livraison (k€)', 'fa-chart-column', '#3b82f6') + (
      (cav.seem.some(v => v > 0) || cav.semrac.some(v => v > 0))
        ? barChart('dirCaPrev', cav.labels, [
          { label: 'Seem', data: cav.seem.map(v => Math.round(v / 1000)), backgroundColor: U.PAL_SEEM, borderRadius: 4, stack: 'ca' },
          { label: 'Semrac', data: cav.semrac.map(v => Math.round(v / 1000)), backgroundColor: U.PAL_SEMRAC, borderRadius: 4, stack: 'ca' },
        ], { plugins: { legend: { display: true } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } })
        : U.emptyState('Aucune commande à livrer datée — renseignez la date de livraison des commandes')))}
    ${U.card(U.cardTitle('Détail mensuel', 'fa-list', '#3b82f6') + cav.labels.map((l, i) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #f8fafc;">
        <span style="font-size:.74rem;color:#374151;font-weight:600;">${esc(l)}</span>
        <span style="font-size:.78rem;font-weight:800;color:#1d4ed8;">${fmtEur(cav.montant[i])}</span>
      </div>`).join(''))}
  `)}
  ${U.sectionTitle('Objectifs vs Réel', 'fa-bullseye')}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Pilotage KPIs', 'fa-bullseye', '#6366f1') + `
      ${U.bulletTarget('OTD livraison', prod.otd, oOtd, n => n + '%')}
      ${U.bulletTarget('Marge brute', fin.tauxMarge, oMarge, n => n + '%')}
      ${U.bulletTarget('Disponibilité machines', maint.disponibilite, oDispo, n => n + '%')}
      ${U.bulletTarget('Absentéisme', hr.absenteisme, oAbs, n => n + '%')}
    `)}
    ${U.card(U.cardTitle('Répartition CA par client', 'fa-chart-pie', '#3b82f6') + (com.topClients.length ? doughnut('dirClients', com.topClients.map(c => String(c[0])), com.topClients.map(c => Math.round(c[1] / 1000)), U.PALETTE) : U.emptyState('Aucune commande')))}
  `)}
  ${grid('repeat(4,1fr)')(`
    ${U.card(U.cardTitle('Qualité', 'fa-clipboard-check', '#22c55e') + [
      { l: 'NC ouvertes', v: qual.ncOpen.length }, { l: 'NC critiques', v: qual.ncCrit }, { l: '8D en cours', v: qual.r8dOpen }, { l: 'Cpk moyen', v: qual.cpkMoyen ?? '—' }, { l: 'Libération PV', v: qual.pvTotal ? qual.liberationPV + '%' : '—' },
    ].map(({ l, v }) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f8fafc;font-size:.72rem;"><span style="color:#374151;">${l}</span><span style="font-weight:700;color:#15803d;">${v}</span></div>`).join(''))}
    ${U.card(U.cardTitle('RH', 'fa-users', '#14b8a6') + [
      { l: 'Effectif actif', v: hr.effectif }, { l: 'Opérateurs', v: hr.ops }, { l: 'Absents ce jour', v: hr.absToday }, { l: 'Congés à valider', v: hr.congesPending }, { l: 'Habilit. <30j', v: hr.certBientot },
    ].map(({ l, v }) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f8fafc;font-size:.72rem;"><span style="color:#374151;">${l}</span><span style="font-weight:700;color:#0d9488;">${v}</span></div>`).join(''))}
    ${U.card(U.cardTitle('Stock & Achats', 'fa-warehouse', '#f59e0b') + [
      { l: 'Valorisation', v: fmtEur(st.valorisation) }, { l: 'Ruptures', v: st.ruptures.length }, { l: 'Rotation', v: st.rotation ?? '—' }, { l: 'Carnet cmd', v: fmtEur(com.carnet) }, { l: 'Pipeline', v: fmtEur(com.valeurPipeline) }, { l: 'Marge réelle prod.', v: (() => { const mr = (d.commandes || []).filter((c: any) => c.marge_reelle != null); return mr.length ? fmtEur(mr.reduce((s: number, c: any) => s + num(c.marge_reelle), 0)) : '—'; })() },
    ].map(({ l, v }) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f8fafc;font-size:.72rem;"><span style="color:#374151;">${l}</span><span style="font-weight:700;color:#b45309;">${v}</span></div>`).join(''))}
    ${U.card(U.cardTitle('Accès rapide', 'fa-link', '#6366f1') + [
      { l: 'Finance / Trésorerie', url: '/dashboard/finance', icon: 'fa-coins', c: '#0ea5e9' },
      { l: 'Stock / Inventaire', url: '/dashboard/stock', icon: 'fa-warehouse', c: '#3b82f6' },
      { l: 'Fournisseurs', url: '/dashboard/fournisseurs', icon: 'fa-truck', c: '#10b981' },
      { l: 'Validations', url: '/direction/validation', icon: 'fa-crown', c: '#f59e0b' },
      { l: 'Objectifs KPI', url: '/reglages/objectifs', icon: 'fa-sliders-h', c: '#6366f1' },
    ].map(l => `<a href="${l.url}" style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f8fafc;text-decoration:none;"><i class="fas ${l.icon}" style="color:${l.c};width:16px;font-size:.8rem;"></i><span style="font-size:.72rem;color:#374151;font-weight:600;">${l.l}</span><i class="fas fa-chevron-right" style="color:#e2e8f0;font-size:.65rem;margin-left:auto;"></i></a>`).join(''))}
  `)}
  ${U.chartScript()}`)
  return layout('Dashboard Direction', pageHeader('fas fa-crown', '#f59e0b,#d97706', 'Dashboard Direction – Vision Consolidée', 'CA · Marge · OTD · Trésorerie · Qualité · RH · Objectifs', ['Direction', 'KPI', 'Stratégie']) + (f ? U.filterBar(f, '/dashboard/direction', { clients, exportable: true }) : '') + content, 'service-direction', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD OAS – Mickael
// ──────────────────────────────────────────────────────────────
export const dashOAS = (d: DashboardData, f?: DashFilter) => {
  const k = K.oas(d, f)
  const content = wrap(`
  ${g4(`
    ${U.kpiCard('fa-atom', k.sessionsPeriode, `Sessions OAS (${k.periodLabel})`, `${k.sessionsTotal} au total`, '#06b6d4', '#ecfeff')}
    ${U.kpiCard('fa-check-circle', k.relevesBains.length ? k.bainsConf + '%' : '—', 'Conformité bains', `${k.relevesBains.length} relevé(s)${k.bainsAlerte ? ' · ' + k.bainsAlerte + ' NC' : ''}`, '#22c55e', '#f0fdf4', { spark: k.phSerie.length > 1 ? k.phSerie : undefined, sparkColor: '#06b6d4' })}
    ${U.kpiCard('fa-clipboard-check', k.tauxSession != null ? k.tauxSession + '%' : '—', 'Conformité sessions', `${k.sessTermine} session(s) terminée(s)`, k.tauxSession != null && k.tauxSession < 95 ? '#f59e0b' : '#22c55e', '#f0fdf4')}
    ${U.kpiCard('fa-stopwatch', k.dureeMoy != null ? k.dureeMoy + ' min' : '—', 'Durée moyenne', 'traitement OAS', '#6366f1', '#f5f3ff')}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('État des bains – Derniers paramètres', 'fa-vials', '#06b6d4') + (k.bains.length ? k.bains.map((b: any) => `
      <div style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:12px;background:${b.conforme !== false ? '#f0fdf4' : '#fffbeb'};margin-bottom:8px;border:1px solid ${b.conforme !== false ? '#bbf7d0' : '#fde68a'};">
        <div style="flex:1;"><div style="font-size:.82rem;font-weight:800;color:#374151;">${esc(b.bain_nom || '—')}</div>
          <div style="display:flex;gap:12px;margin-top:5px;flex-wrap:wrap;">
            <span style="font-size:.7rem;color:#6b7280;">Conc. <strong>${b.concentration_gl != null ? esc(b.concentration_gl) + ' g/L' : '—'}</strong></span>
            <span style="font-size:.7rem;color:#6b7280;">T° <strong>${b.temperature != null ? esc(b.temperature) + '°C' : '—'}</strong></span>
            <span style="font-size:.7rem;color:#6b7280;">pH <strong>${b.ph != null ? esc(b.ph) : '—'}</strong></span>
          </div></div>
        <span style="font-size:.72rem;font-weight:700;color:${b.conforme !== false ? '#15803d' : '#b45309'};background:white;border-radius:8px;padding:4px 10px;border:1px solid ${b.conforme !== false ? '#bbf7d0' : '#fde68a'};">${b.conforme !== false ? 'OK' : '⚠'}</span>
      </div>`).join('') : U.emptyState('Aucun relevé de bain')))}
    ${U.card(U.cardTitle('Sessions par mois', 'fa-chart-bar', '#06b6d4') + (k.balancelles.length ? barChart('oasSess', k.monthLabels, [
      { label: 'Sessions', data: k.balSeries, backgroundColor: '#06b6d4', borderRadius: 4 },
      ...(f && f.compare ? [{ type: 'line', label: 'Sessions N-1', data: k.balSeriesPrev, borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, backgroundColor: 'transparent' } as any] : []),
    ]) : U.emptyState('Aucune session')))}
  `)}
  ${U.card(U.cardTitle('Relevés d’eau (autosurveillance rejets)', 'fa-faucet-drip', '#0ea5e9') + (k.relevesEau.length ? `<table style="width:100%;border-collapse:collapse;"><thead><tr style="border-bottom:2px solid #f1f5f9;">${['Date', 'Volume', 'pH', 'Chlore', 'Turbidité', 'Conforme'].map(h => `<th style="padding:5px 8px;font-size:.62rem;color:#6b7280;font-weight:700;text-align:left;">${h}</th>`).join('')}</tr></thead><tbody>${k.relevesEau.slice(0, 10).map((r: any) => `<tr style="border-bottom:1px solid #f8fafc;"><td style="padding:6px 8px;font-size:.7rem;">${esc(String(r.date_releve || '').slice(0, 10))}</td><td style="padding:6px 8px;font-size:.7rem;">${r.volume_m3 != null ? esc(r.volume_m3) + ' m³' : '—'}</td><td style="padding:6px 8px;font-size:.7rem;">${r.ph != null ? esc(r.ph) : '—'}</td><td style="padding:6px 8px;font-size:.7rem;">${r.chlore != null ? esc(r.chlore) : '—'}</td><td style="padding:6px 8px;font-size:.7rem;">${r.turbidite != null ? esc(r.turbidite) : '—'}</td><td style="padding:6px 8px;">${r.conforme === false ? '<span style="color:#b91c1c;font-weight:700;font-size:.68rem;">✗ NC</span>' : '<span style="color:#15803d;font-weight:700;font-size:.68rem;">✓</span>'}</td></tr>`).join('')}</tbody></table>` : U.emptyState('Aucun relevé d’eau (source : module OAS)')))}
  ${U.chartScript()}`)
  return layout('Dashboard OAS', pageHeader('fas fa-atom', '#06b6d4,#0891b2', 'Dashboard OAS – Mickael', 'Oxydation anodique · Bains · Conformité · Traçabilité', ['KPI', 'OAS', 'ISO 14001']) + (f ? U.filterBar(f, '/dashboard/oas', { exportable: true }) : '') + content, 'service-oas', dEH(f))
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD ENVIRONNEMENT – SME ISO 14001 (déchets · rejets · conformité · AES)
// ──────────────────────────────────────────────────────────────
const DOM_LBL: Record<string, string> = { icpe: 'ICPE', iso14001: 'ISO 14001', rse: 'RSE', iso26000: 'ISO 26000', atex: 'ATEX', autre: 'Autre' }
const CONF_STAT_COL: Record<string, string> = { conforme: '#22c55e', non_conforme: '#ef4444', partiel: '#f59e0b', a_verifier: '#94a3b8' }
const CONF_STAT_LBL: Record<string, string> = { conforme: 'Conforme', non_conforme: 'Non conforme', partiel: 'Partiel', a_verifier: 'À vérifier' }

export const dashEnvironnement = (d: DashboardData, f?: DashFilter) => {
  const k = K.environnement(d, f)
  const ges = computeBilanGES((d.facturesFournisseur || []) as any[])
  const oConf = objectif(d, 'conformite_env'), oBsd = objectif(d, 'bsd_conforme'), oValo = objectif(d, 'taux_valo')
  const oDD = objectif(d, 'dechets_dd'), oDND = objectif(d, 'dechets_dnd'), oEau = objectif(d, 'conso_eau')

  // Indicateur veille : conformité par domaine × statut (barres groupées)
  const confDatasets = k.confStatuts.map(st => ({
    label: CONF_STAT_LBL[st] || st,
    data: k.confParDomaine.map(x => x.counts[k.confStatuts.indexOf(st)]),
    backgroundColor: CONF_STAT_COL[st] || '#94a3b8', borderRadius: 3,
  }))
  const confLabels = k.confParDomaine.map(x => DOM_LBL[x.domaine] || x.domaine)

  // Risque chimique environnement (SEIRICH, lecture)
  const chimEnv = ((d.chimiques || []) as any[]).map((c: any) => ({ c, r: computeRisqueChimique(c) }))
    .filter((x: any) => x.r.niveauEnv >= 2).sort((a: any, b: any) => b.r.niveauEnv - a.r.niveauEnv).slice(0, 8)
  const nivChip = (n: number) => { const m = SEIRICH_NIVEAUX[n] || SEIRICH_NIVEAUX[0]; return `<span style="display:inline-block;padding:2px 9px;border-radius:999px;font-size:.65rem;font-weight:800;background:${m[0]};color:${m[1]};">${m[2]}</span>` }

  const content = wrap(`
  ${g6(`
    ${U.kpiCard('fa-recycle', k.nbDechets, 'Déchets tracés', `${k.nbDD} dangereux (DD)`, '#16a34a', '#f0fdf4')}
    ${U.kpiCard('fa-scale-balanced', k.tauxConf + '%', 'Conformité réglementaire', `${k.confConforme}/${k.confApp} obligations`, '#0ea5e9', '#f0f9ff', { obj: U.kpiObj(k.tauxConf, oConf) })}
    ${U.kpiCard('fa-triangle-exclamation', k.rejetsNC, 'Rejets hors VLE', k.rejetsNC ? 'mesures non conformes' : 'aucun dépassement', k.rejetsNC ? '#dc2626' : '#16a34a', k.rejetsNC ? '#fef2f2' : '#f0fdf4')}
    ${U.kpiCard('fa-seedling', k.aesSignif, 'Aspects significatifs', `${k.aspTotal} aspect(s) — ISO 14001`, k.aesSignif ? '#c2410c' : '#16a34a', k.aesSignif ? '#fff7ed' : '#f0fdf4')}
    ${U.kpiCard('fa-file-lines', k.bsdConforme + '%', 'BSD conformes', `${k.bsdOk}/${k.ddTotal} DD tracés`, '#6366f1', '#f5f3ff', { obj: U.kpiObj(k.bsdConforme, oBsd) })}
    ${U.kpiCard('fa-burst', k.incidentsAn, 'Incidents env. (an)', k.atexRevue ? `${k.atexRevue} revue(s) ATEX due(s)` : 'objectif ≤ 3/an', k.incidentsAn > 3 ? '#dc2626' : '#16a34a', k.incidentsAn > 3 ? '#fef2f2' : '#f0fdf4')}
  `)}
  ${grid('1fr 1fr 1fr')(`
    ${U.card(U.cardTitle('Conformité réglementaire', 'fa-gauge-high', '#0ea5e9') + U.gauge(k.tauxConf, oConf, 'Taux de conformité') + `<div style="margin-top:10px;">${U.gauge(k.tauxValo, oValo, 'Déchets valorisés')}</div>`)}
    ${U.card(U.cardTitle('Répartition des déchets (DD / DND)', 'fa-chart-pie', '#16a34a') + (k.nbDechets ? doughnut('envDdDnd', ['Dangereux (DD)', 'Non dangereux (DND)'], [k.nbDD, k.nbDND], ['#ef4444', '#22c55e']) : U.emptyState('Aucun déchet tracé')))}
    ${U.card(U.cardTitle('Objectifs quantités & eau', 'fa-bullseye', '#0d9488') + U.bulletTarget('Déchets dangereux (t/an)', k.tDD, oDD, (n) => n + ' t') + U.bulletTarget('Déchets non dangereux (t/an)', k.tDND, oDND, (n) => n + ' t') + U.bulletTarget('Consommation eau (m³/an)', k.consoEauAn, oEau, (n) => n + ' m³') + `<div style="font-size:.68rem;color:#94a3b8;margin-top:6px;"><i class="fas fa-circle-info"></i> Cibles éditables dans les objectifs KPI.</div>`)}
  `)}
  ${grid('2fr 1fr')(`
    ${U.card(U.cardTitle(`Déchets produits par mois (${f && f.active ? 'période' : K.curYear()}, kg)`, 'fa-chart-column', '#16a34a') + (
      (k.serieDD.some(v => v > 0) || k.serieDND.some(v => v > 0))
        ? barChart('envDechetsM', k.monthLabels, [
          { label: 'Dangereux', data: k.serieDD, backgroundColor: '#ef4444', borderRadius: 3, stack: 'd' },
          { label: 'Non dangereux', data: k.serieDND, backgroundColor: '#22c55e', borderRadius: 3, stack: 'd' },
          ...(f && f.compare ? [{ type: 'line', label: 'Total N-1', data: k.serieDDprev.map((v, i) => v + (k.serieDNDprev[i] || 0)), borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, backgroundColor: 'transparent' } as any] : []),
        ], { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } })
        : U.emptyState('Aucun déchet enregistré cette année')))}
    ${U.card(U.cardTitle('Déchets par filière (kg)', 'fa-truck-ramp-box', '#0d9488') + (k.parFiliere.length ? k.parFiliere.map(([f, v], i) => U.miniBar(esc(f), Math.round(v), Math.round(k.parFiliere[0][1]), U.PALETTE[i % U.PALETTE.length], ' kg')).join('') : U.emptyState('Aucune filière')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Indicateur de la veille réglementaire (état × domaine)', 'fa-clipboard-check', '#0ea5e9') + (k.confParDomaine.length ? barChart('envVeille', confLabels, confDatasets, { plugins: { legend: { display: true } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }) : U.emptyState('Aucune obligation de conformité')))}
    ${U.card(U.cardTitle(`Consommation eau / énergie (${f && f.active ? 'période' : K.curYear()})`, 'fa-chart-area', '#0ea5e9') + (
      (k.consoEauSerie.some(v => v > 0) || k.consoEnergieSerie.some(v => v > 0))
        ? lineChart('envConso', k.monthLabels, [
          { label: 'Eau (m³)', data: k.consoEauSerie, borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,.12)', fill: true },
          { label: 'Énergie (kWh)', data: k.consoEnergieSerie, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,.10)', fill: true },
          ...(f && f.compare ? [{ label: 'Eau N-1 (m³)', data: k.consoEauSeriePrev, borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, fill: false } as any] : []),
        ])
        : U.emptyState('Aucune mesure de consommation')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Risque chimique - environnement (SEIRICH)', 'fa-radiation', '#16a34a') + (chimEnv.length ? `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;"><th style="text-align:left;padding:7px 9px;font-size:.62rem;font-weight:800;color:#64748b;text-transform:uppercase;">Produit</th><th style="text-align:right;padding:7px 9px;font-size:.62rem;font-weight:800;color:#64748b;text-transform:uppercase;">Quantité</th><th style="text-align:center;padding:7px 9px;font-size:.62rem;font-weight:800;color:#64748b;text-transform:uppercase;">Niveau env.</th></tr></thead><tbody>${chimEnv.map(({ c, r }: any) => `<tr style="border-bottom:1px solid #f8fafc;"><td style="padding:6px 9px;font-size:.76rem;color:#374151;">${esc(c.nom || '—')}</td><td style="padding:6px 9px;font-size:.76rem;color:#374151;text-align:right;">${c.quantite != null && c.quantite !== '' ? esc(c.quantite) + ' ' + esc(c.unite || '') : '—'}</td><td style="padding:6px 9px;text-align:center;">${nivChip(r.niveauEnv)}</td></tr>`).join('')}</tbody></table></div>` : U.emptyState('Aucun produit à risque environnemental notable')))}
    ${U.card(U.cardTitle('Aspects environnementaux par milieu', 'fa-leaf', '#16a34a') + (k.aspParMilieu.length ? k.aspParMilieu.map(([m, v], i) => U.miniBar(esc(m), Math.round(v), Math.round(k.aspParMilieu[0][1]), U.PALETTE[i % U.PALETTE.length])).join('') : U.emptyState('Aucun aspect environnemental')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Bilan GES — répartition par scope (tCO₂e)', 'fa-earth-europe', '#16a34a') + (ges.total > 0 ? doughnut('envGes', ['Scope 1 — direct', 'Scope 2 — électricité', 'Scope 3 — indirect'], [ges.scope1, ges.scope2, ges.scope3], ['#dc2626', '#f59e0b', '#6366f1']) + `<div style="text-align:center;font-weight:800;color:#16a34a;margin-top:8px;">Total : ${ges.total} tCO₂e (${ges.annee}) — méthode monétaire</div>` : U.emptyState('Aucune facture fournisseur — bilan GES vide')))}
    ${U.card(U.cardTitle('Postes d’émission (tCO₂e)', 'fa-smog', '#6366f1') + (ges.postes.length ? ges.postes.slice(0, 7).map((p: any, i: number) => U.miniBar(esc(p.poste) + ' · S' + p.scope, p.tco2, ges.postes[0].tco2, U.PALETTE[i % U.PALETTE.length], ' t')).join('') : U.emptyState('Aucun poste d’émission')))}
  `)}
  ${grid('1fr 1fr')(`
    ${U.card(U.cardTitle('Veille réglementaire en alerte', 'fa-triangle-exclamation', '#dc2626') + (k.confAlerteRows.length ? `<div style="font-size:1.8rem;font-weight:900;color:#dc2626;margin-bottom:6px;">${k.confAlerte} <span style="font-size:.7rem;font-weight:600;color:#6b7280;">obligation(s) à traiter</span></div>` + k.confAlerteRows.slice(0, 7).map((o: any) => `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f8fafc;"><div style="flex:1;min-width:0;"><div style="font-size:.73rem;font-weight:700;color:#374151;">${esc(o.obligation || o.reference_reglementaire || o.libelle || '—')}</div><div style="font-size:.61rem;color:#9ca3af;">${esc(DOM_LBL[lc(o.domaine)] || o.domaine || '—')}${o.date_echeance ? ' · échéance ' + esc(String(o.date_echeance).slice(0, 10)) : ''}</div></div><span style="font-size:.58rem;padding:1px 7px;border-radius:999px;background:${(CONF_STAT_COL[lc(o.statut)] || '#94a3b8')}22;color:${CONF_STAT_COL[lc(o.statut)] || '#94a3b8'};font-weight:700;">${esc(CONF_STAT_LBL[lc(o.statut)] || o.statut || '—')}</span></div>`).join('') : U.emptyState('Aucune obligation en alerte')))}
    ${U.card(U.cardTitle('Incidents / rejets hors VLE par mois', 'fa-burst', '#dc2626') + (k.incidentsSerie.some(v => v > 0) ? lineChart('envIncidents', k.monthLabels, [
      { label: 'Incidents', data: k.incidentsSerie, borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,.12)', fill: true },
      ...(f && f.compare ? [{ label: 'Incidents N-1', data: k.incidentsSeriePrev, borderColor: '#94a3b8', borderDash: [5, 4], pointRadius: 0, fill: false } as any] : []),
    ]) : U.emptyState('Aucune mesure environnementale enregistrée')))}
  `)}
  ${k.rseGroups.length ? U.card(U.cardTitle('Indicateurs RSE (social · environnement · gouvernance)', 'fa-handshake-angle', '#0d9488') + `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">${k.rseGroups.map((g: any) => `<div><div style="font-size:.66rem;font-weight:800;color:#0d9488;text-transform:uppercase;margin-bottom:6px;letter-spacing:.04em;">${esc(g.cat)}</div>${g.items.map((it: any) => `<div style="display:flex;justify-content:space-between;gap:8px;font-size:.72rem;padding:4px 0;border-bottom:1px solid #f8fafc;"><span style="color:#374151;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(it.libelle)}</span><span style="font-weight:700;color:#111827;white-space:nowrap;">${it.valeur != null && it.valeur !== '' ? esc(it.valeur) : '—'}${it.cible != null && it.cible !== '' ? ` <span style="color:#94a3b8;font-weight:500;">/ ${esc(it.cible)} ${esc(it.unite)}</span>` : ''}</span></div>`).join('')}</div>`).join('')}</div>`) : ''}
  ${U.chartScript()}`)
  return layout('Dashboard Environnement', pageHeader('fas fa-leaf', '#16a34a,#047857', 'Dashboard Environnement – ISO 14001', 'Déchets · Rejets · Conformité · AES · Veille réglementaire', ['KPI', 'Environnement', 'ISO 14001']) + (f ? U.filterBar(f, '/dashboard/environnement', { exportable: true }) : '') + content, 'service-environnement', dEH(f))
}
