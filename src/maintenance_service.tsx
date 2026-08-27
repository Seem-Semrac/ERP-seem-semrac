// ══════════════════════════════════════════════════════════════
// SERVICE MAINTENANCE – GMAO ERP Seem Semrac v2.0
// Interventions · Plan préventif · MTBF · Pièces · Dashboard
// SPEC-ERP-GPAO-V1.8 / EN 9100:2018 / ISO 14001
// ══════════════════════════════════════════════════════════════
import { escX, layout, serviceHeader, demandeAchatModal, computePosteRates } from './shared'
import type { OrdreMaintenance, PlanPreventif, MtbfMachine } from './types'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

const YEL   = '#eab308'
const YEL_D = '#ca8a04'
const TODAY = new Date().toISOString().slice(0, 10)

// ─── Données de démonstration ─────────────────────────────────

const OM_DEFAULT: OrdreMaintenance[] = []

const PP_DEFAULT: PlanPreventif[] = []

const MTBF_DEFAULT: MtbfMachine[] = []

// ─── Helpers ──────────────────────────────────────────────────

function prioBadge(p: string) {
  const m: Record<string,[string,string]> = {
    critique: ['#fee2e2','#b91c1c'],
    urgent:   ['#fef3c7','#92400e'],
    normal:   ['#f0fdf4','#15803d'],
  }
  const [bg,col] = m[p] ?? ['#f1f5f9','#6b7280']
  return `<span style="background:${bg};color:${col};border-radius:999px;padding:2px 9px;font-size:.65rem;font-weight:700;">${p.toUpperCase()}</span>`
}

function statutOM(s: string) {
  const m: Record<string,[string,string,string]> = {
    ouvert:      ['#dbeafe','#1d4ed8','Ouvert'],
    en_cours:    ['#fef3c7','#92400e','En cours'],
    en_attente:  ['#f3e8ff','#6b21a8','En attente PDR'],
    termine:     ['#dcfce7','#15803d','Terminé'],
    annule:      ['#f1f5f9','#6b7280','Annulé'],
  }
  const [bg,col,lbl] = m[s] ?? ['#f1f5f9','#6b7280',s]
  return `<span style="background:${bg};color:${col};border-radius:999px;padding:2px 10px;font-size:.67rem;font-weight:700;">${lbl}</span>`
}

function typeOM(t: string) {
  const m: Record<string,[string,string,string]> = {
    correctif:   ['#fee2e2','#b91c1c','fa-wrench'],
    preventif:   ['#dcfce7','#15803d','fa-calendar-check'],
    amelioratif: ['#dbeafe','#1d4ed8','fa-arrow-up'],
    vgp:         ['#fef3c7','#92400e','fa-shield-alt'],
    inspection:  ['#f3e8ff','#6b21a8','fa-search'],
  }
  const [bg,col,ic] = m[t] ?? ['#f1f5f9','#6b7280','fa-tools']
  return `<span style="background:${bg};color:${col};border-radius:6px;padding:2px 9px;font-size:.65rem;font-weight:700;display:inline-flex;align-items:center;gap:3px;"><i class="fas ${ic}" style="font-size:.6rem;"></i>${t}</span>`
}

function urgenceColor(dateStr: string | undefined): string {
  if (!dateStr) return '#6b7280'
  const days = Math.round((new Date(dateStr).getTime() - new Date(TODAY).getTime()) / 86400000)
  if (days < 0)  return '#b91c1c'
  if (days <= 3) return '#d97706'
  if (days <= 7) return '#f59e0b'
  return '#15803d'
}

function kpi(icon: string, col: string, val: string|number, lbl: string, sub='') {
  return `<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${col};">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div style="width:36px;height:36px;border-radius:10px;background:${col}18;display:flex;align-items:center;justify-content:center;"><i class="fas ${icon}" style="color:${col};font-size:.9rem;"></i></div>
      <div style="font-size:1.5rem;font-weight:900;color:#111827;">${val}</div>
    </div>
    <div style="font-size:.75rem;font-weight:700;color:#374151;">${lbl}</div>
    ${sub?`<div style="font-size:.67rem;color:#9ca3af;margin-top:2px;">${sub}</div>`:''}
  </div>`
}

function card(content: string) {
  return `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:22px;margin-bottom:18px;">${content}</div>`
}

function sec(lbl: string, ic='fa-tools') {
  return `<div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:12px;display:flex;align-items:center;gap:6px;"><i class="fas ${ic}" style="font-size:.6rem;"></i>${lbl}<span style="flex:1;height:1px;background:#f1f5f9;display:block;margin-left:6px;"></span></div>`
}

// ══════════════════════════════════════════════════════════════
// PANEL 1 – DASHBOARD
// ══════════════════════════════════════════════════════════════

function panelDashboard(oms: OrdreMaintenance[], pps: PlanPreventif[], mtbf: MtbfMachine[], machines: any[] = [], fiche: Record<string, any> = {}) {
  const omOuverts   = oms.filter(o => o.statut === 'ouvert' || o.statut === 'en_cours').length
  const omCritiques = oms.filter(o => o.priorite === 'critique' && o.statut !== 'termine' && o.statut !== 'annule').length
  const machArret   = mtbf.filter(m => m.statut_machine === 'arret').length
  const coutTotal   = mtbf.reduce((s,m)=>s+m.cout_maintenance, 0)
  const dispoMoy    = mtbf.length > 0 ? (mtbf.reduce((s,m)=>s+(m.disponibilite_pct??0),0)/mtbf.length).toFixed(1) : '—'
  // Disponibilité & TRS CALCULÉS (depuis les OM réels), prioritaires sur le champ stocké
  const _dvals = (machines || []).map((m: any) => fiche[String(m.id)]?.dispo).filter((v: any) => v != null) as number[]
  const dispoCalc = _dvals.length ? (_dvals.reduce((a, b) => a + b, 0) / _dvals.length).toFixed(1) : dispoMoy
  const _tvals = (machines || []).map((m: any) => fiche[String(m.id)]?.trs).filter((v: any) => v != null) as number[]
  const trsMoy = _tvals.length ? Math.round(_tvals.reduce((a, b) => a + b, 0) / _tvals.length) : null

  const ppUrgents = pps.filter(p => {
    if (!p.prochain_prevu) return false
    const days = Math.round((new Date(p.prochain_prevu).getTime() - new Date(TODAY).getTime()) / 86400000)
    return days <= 7
  })

  return `
  <div id="mnt-panel-dashboard" style="display:none;">
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;">
      ${kpi('fa-clipboard-list',    YEL,         omOuverts,              'OM ouverts / en cours',    'Interventions actives')}
      ${kpi('fa-exclamation-circle','#ef4444',   omCritiques,            'OM critiques',              'Action immédiate requise')}
      ${kpi('fa-server',            '#3b82f6',   dispoCalc+'%',          'Disponibilité moy.',        'Calculée MTBF/MTTR')}
      ${kpi('fa-gauge-high',        '#8b5cf6',   (trsMoy!=null?trsMoy+'%':'—'), 'TRS moyen*',          'Dispo × Qualité')}
      ${kpi('fa-euro-sign',         '#22c55e',   coutTotal.toLocaleString('fr-FR',{maximumFractionDigits:0})+' EUR', 'Coût maintenance', 'Cumul YTD')}
      ${kpi('fa-power-off',         '#ef4444',   machArret,              'Machines arrêtées',         'Nécessitent intervention')}
    </div>

    <!-- Disponibilité & TRS par machine (calculé depuis les OM) -->
    ${card(`
      ${sec('Disponibilité & TRS par machine (calculé)', 'fa-gauge-high')}
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;">
        <thead><tr style="background:#faf5ff;">
          <th style="text-align:left;padding:8px 10px;font-size:.62rem;text-transform:uppercase;color:#6b21a8;">Machine</th>
          <th style="text-align:center;padding:8px 10px;font-size:.62rem;text-transform:uppercase;color:#6b21a8;">Disponibilité</th>
          <th style="text-align:center;padding:8px 10px;font-size:.62rem;text-transform:uppercase;color:#6b21a8;">TRS*</th>
          <th style="text-align:center;padding:8px 10px;font-size:.62rem;text-transform:uppercase;color:#6b21a8;">MTBF</th>
          <th style="text-align:center;padding:8px 10px;font-size:.62rem;text-transform:uppercase;color:#6b21a8;">MTTR</th>
          <th style="text-align:center;padding:8px 10px;font-size:.62rem;text-transform:uppercase;color:#6b21a8;">Pannes</th>
          <th style="text-align:center;padding:8px 10px;font-size:.62rem;text-transform:uppercase;color:#6b21a8;">Qualité</th>
        </tr></thead>
        <tbody>
          ${(machines || []).map((m: any) => {
            const f = fiche[String(m.id)] || {}
            const dCol = f.dispo == null ? '#94a3b8' : (f.dispo >= 90 ? '#16a34a' : (f.dispo >= 75 ? '#d97706' : '#ef4444'))
            const tCol = f.trs == null ? '#94a3b8' : (f.trs >= 85 ? '#16a34a' : (f.trs >= 65 ? '#d97706' : '#ef4444'))
            return `<tr style="border-bottom:1px solid #f9fafb;">
              <td style="padding:8px 10px;font-weight:700;color:#1e293b;">${escX(m.nom)}${m.code ? ` <span style="color:#9ca3af;font-size:.7rem;">(${escX(m.code)})</span>` : ''}</td>
              <td style="padding:8px 10px;text-align:center;"><div style="display:flex;align-items:center;gap:6px;justify-content:center;"><div style="background:#e2e8f0;border-radius:999px;height:6px;width:54px;overflow:hidden;"><div style="height:100%;background:${dCol};width:${f.dispo != null ? f.dispo : 0}%;"></div></div><span style="font-weight:700;color:${dCol};font-size:.74rem;">${f.dispo != null ? Number(f.dispo).toFixed(0) + '%' : '—'}</span></div></td>
              <td style="padding:8px 10px;text-align:center;font-weight:800;color:${tCol};">${f.trs != null ? f.trs + '%' : '—'}</td>
              <td style="padding:8px 10px;text-align:center;color:#6366f1;font-weight:600;">${f.mtbf != null ? (f.mtbf >= 48 ? (f.mtbf / 24).toFixed(1) + ' j' : f.mtbf.toFixed(1) + ' h') : '—'}</td>
              <td style="padding:8px 10px;text-align:center;color:#0d9488;font-weight:600;">${f.mttr != null ? f.mttr.toFixed(1) + ' h' : '—'}</td>
              <td style="padding:8px 10px;text-align:center;color:#ef4444;font-weight:600;">${f.nbPannes != null ? f.nbPannes : 0}</td>
              <td style="padding:8px 10px;text-align:center;color:#64748b;">${f.qualPct != null ? f.qualPct + '%' : '—'}</td>
            </tr>`
          }).join('') || `<tr><td colspan="7" style="text-align:center;padding:20px;color:#cbd5e1;">Aucune machine</td></tr>`}
        </tbody>
      </table></div>
      <div style="font-size:.64rem;color:#9ca3af;margin-top:8px;">* TRS partiel = Disponibilité × Qualité (Performance / cadence théorique non encore mesurée). Disponibilité = MTBF/(MTBF+MTTR) depuis les OM.</div>
    `)}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;">
      <!-- Statut machines -->
      ${card(`
        ${sec('Statut machines', 'fa-industry')}
        <div style="display:grid;gap:10px;">
          ${mtbf.map(m => {
            const col = m.statut_machine === 'operationnel' ? '#22c55e' : m.statut_machine === 'maintenance' ? '#f59e0b' : '#ef4444'
            const lbl = m.statut_machine === 'operationnel' ? 'Opérationnel' : m.statut_machine === 'maintenance' ? 'En maintenance' : 'Arrêt'
            const ic  = m.statut_machine === 'operationnel' ? 'fa-check-circle' : m.statut_machine === 'maintenance' ? 'fa-tools' : 'fa-times-circle'
            return `<div style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:10px;background:${col}08;border:1px solid ${col}30;">
              <i class="fas ${ic}" style="color:${col};font-size:1rem;flex-shrink:0;"></i>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:.82rem;color:#111827;">${escX(m.machine_nom)} <span style="color:#9ca3af;font-size:.7rem;">(${escX(m.machine_code??'')})</span></div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                  <div style="background:#e2e8f0;border-radius:999px;height:5px;width:80px;overflow:hidden;">
                    <div style="height:100%;background:${col};width:${m.disponibilite_pct??0}%;border-radius:999px;"></div>
                  </div>
                  <span style="font-size:.68rem;color:${col};font-weight:700;">${m.disponibilite_pct??'?'}%</span>
                  <span style="font-size:.68rem;color:#9ca3af;">MTBF: ${m.mtbf_h??'?'}h</span>
                </div>
              </div>
              <span style="font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:999px;background:${col}20;color:${col};white-space:nowrap;">${lbl}</span>
            </div>`
          }).join('')}
        </div>
      `)}

      <!-- Prochains PM urgents -->
      ${card(`
        ${sec('Prochains PM urgents (≤7 jours)', 'fa-calendar-alt')}
        ${ppUrgents.length === 0
          ? `<div style="text-align:center;padding:24px;color:#9ca3af;font-size:.82rem;"><i class="fas fa-check-circle" style="color:#22c55e;font-size:1.5rem;display:block;margin-bottom:8px;"></i>Aucun PM urgent cette semaine</div>`
          : ppUrgents.map(p => {
              const days = Math.round((new Date(p.prochain_prevu!).getTime() - new Date(TODAY).getTime()) / 86400000)
              const col  = days < 0 ? '#b91c1c' : days === 0 ? '#d97706' : '#f59e0b'
              return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f8fafc;">
                <div style="width:36px;height:36px;border-radius:8px;background:${col}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <span style="font-size:.8rem;font-weight:900;color:${col};">${days<0?'J+'+Math.abs(days):days===0?'Auj.':'J-'+days}</span>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:700;font-size:.8rem;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escX(p.intitule)}</div>
                  <div style="font-size:.65rem;color:#9ca3af;">${escX(p.machine_nom)} · ${escX(p.responsable??'')}</div>
                </div>
                <span style="font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:999px;background:${col}20;color:${col};flex-shrink:0;">${p.type}</span>
              </div>`
            }).join('')}
        <div style="margin-top:14px;">
          <button onclick="mntShowTab('preventif')" style="width:100%;padding:8px;background:#fffbeb;color:#92400e;border:1px solid #fde68a;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;">
            <i class="fas fa-calendar-check" style="margin-right:4px;"></i>Voir le plan préventif complet
          </button>
        </div>
      `)}
    </div>

    <!-- OM récents ouverts -->
    ${card(`
      ${sec('Ordres de maintenance actifs', 'fa-clipboard-list')}
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
          <thead><tr style="background:#fffbeb;border-bottom:2px solid #fde68a;">
            <th style="text-align:left;padding:8px 10px;color:#92400e;font-size:.65rem;text-transform:uppercase;">N° OM</th>
            <th style="text-align:left;padding:8px 10px;color:#92400e;font-size:.65rem;text-transform:uppercase;">Type</th>
            <th style="text-align:left;padding:8px 10px;color:#92400e;font-size:.65rem;text-transform:uppercase;">Machine</th>
            <th style="text-align:left;padding:8px 10px;color:#92400e;font-size:.65rem;text-transform:uppercase;">Titre</th>
            <th style="text-align:center;padding:8px 10px;color:#92400e;font-size:.65rem;text-transform:uppercase;">Priorité</th>
            <th style="text-align:center;padding:8px 10px;color:#92400e;font-size:.65rem;text-transform:uppercase;">Statut</th>
            <th style="text-align:center;padding:8px 10px;color:#92400e;font-size:.65rem;text-transform:uppercase;">Prévu le</th>
          </tr></thead>
          <tbody>
            ${oms.filter(o=>o.statut!=='termine'&&o.statut!=='annule').slice(0,8).map(o => `
            <tr style="border-bottom:1px solid #fef9c3;" onmouseenter="this.style.background='#fffbeb'" onmouseleave="this.style.background=''">
              <td style="padding:7px 10px;font-family:monospace;font-weight:700;color:#374151;font-size:.75rem;">${escX(o.num_om??o.id.slice(0,8))}</td>
              <td style="padding:7px 10px;">${typeOM(o.type)}</td>
              <td style="padding:7px 10px;font-weight:600;color:#374151;font-size:.78rem;">${escX(o.machine_nom??'—')}</td>
              <td style="padding:7px 10px;color:#374151;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escX(o.titre)}</td>
              <td style="padding:7px 10px;text-align:center;">${prioBadge(o.priorite)}</td>
              <td style="padding:7px 10px;text-align:center;">${statutOM(o.statut)}</td>
              <td style="padding:7px 10px;text-align:center;font-weight:600;color:${urgenceColor(o.date_prevue)};font-size:.75rem;">${o.date_prevue??'—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `)}
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PANEL 2 – INTERVENTIONS / OM
// ══════════════════════════════════════════════════════════════

function panelInterventions(oms: OrdreMaintenance[], machines: any[] = [], sals: any[] = []) {
  const enPanne = (machines || []).filter((m: any) => m.statut === 'arret' || m.date_panne)
  const omOpenByMachine: Record<string, any> = {}
  ;(oms || []).forEach((o: any) => { if (o.statut !== 'termine' && o.statut !== 'annule' && o.machine_id) omOpenByMachine[String(o.machine_id)] = o })
  const omOuverts = (oms || []).filter((o: any) => o.statut !== 'termine' && o.statut !== 'annule')
  const omTermines = (oms || []).filter((o: any) => o.statut === 'termine')
  const prioBadge = (p: string) => { const m: any = { critique: ['#fee2e2', '#b91c1c'], urgent: ['#fef3c7', '#92400e'], normal: ['#dcfce7', '#15803d'] }; const [bg, co] = m[p] || m.normal; return `<span style="background:${bg};color:${co};border-radius:999px;padding:1px 8px;font-size:.62rem;font-weight:700;">${p || 'normal'}</span>` }
  const statBadge = (s: string) => { const m: any = { ouvert: ['#fee2e2', '#b91c1c', 'Ouvert'], en_cours: ['#dbeafe', '#1d4ed8', 'En cours'], en_attente: ['#fef9c3', '#854d0e', 'En attente'], termine: ['#dcfce7', '#15803d', 'Terminé'], annule: ['#f1f5f9', '#64748b', 'Annulé'] }; const [bg, co, l] = m[s] || m.ouvert; return `<span style="background:${bg};color:${co};border-radius:999px;padding:1px 9px;font-size:.64rem;font-weight:700;">${l}</span>` }
  const sinceTxt = (d: any) => { if (!d) return '—'; const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000); return days <= 0 ? "aujourd'hui" : (days + ' j') }
  const panneRows = enPanne.length ? enPanne.map((m: any) => {
    const om = omOpenByMachine[String(m.id)]
    return `<tr style="border-bottom:1px solid #f9fafb;">
      <td style="padding:9px 12px;font-weight:700;color:#1e293b;">${escX(m.nom)} <span style="color:#94a3b8;font-size:.66rem;font-family:monospace;">${escX(m.code || '')}</span></td>
      <td style="padding:9px 12px;font-size:.78rem;color:#374151;">${escX(m.activite || '')}</td>
      <td style="padding:9px 12px;font-size:.74rem;color:#b91c1c;">${escX(m.motif_panne || 'Panne déclarée')}</td>
      <td style="padding:9px 12px;text-align:center;font-size:.74rem;color:#64748b;">${sinceTxt(m.date_panne)}</td>
      <td style="padding:9px 12px;text-align:center;">${om
        ? `<span style="color:#1d4ed8;font-size:.72rem;font-weight:700;"><i class="fas fa-clipboard-list" style="margin-right:4px;"></i>${escX(om.num_om)} en cours</span>`
        : `<button onclick="mntCreerOMpanne('${m.id}')" style="padding:6px 14px;background:linear-gradient(135deg,#eab308,#ca8a04);color:white;border:none;border-radius:8px;font-size:.74rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:4px;"></i>Créer un OM</button>`}</td>
    </tr>`
  }).join('') : `<tr><td colspan="5" style="text-align:center;padding:24px;color:#16a34a;font-size:.82rem;"><i class="fas fa-check-circle" style="display:block;font-size:1.4rem;margin-bottom:6px;"></i>Aucune machine en panne — tout tourne.</td></tr>`
  const omRows = omOuverts.length ? omOuverts.map((o: any) => `
    <tr style="border-bottom:1px solid #f9fafb;">
      <td style="padding:9px 12px;font-family:monospace;font-size:.74rem;color:#6b7280;">${escX(o.num_om || '—')}</td>
      <td style="padding:9px 12px;font-weight:700;color:#1e293b;">${escX(o.machine_nom || '—')}</td>
      <td style="padding:9px 12px;font-size:.78rem;color:#374151;">${escX(o.titre || '—')}</td>
      <td style="padding:9px 12px;text-align:center;">${prioBadge(o.priorite)}</td>
      <td style="padding:9px 12px;text-align:center;">${statBadge(o.statut)}</td>
      <td style="padding:9px 12px;text-align:center;font-size:.72rem;color:#64748b;">${o.date_signalement || '—'}</td>
      <td style="padding:9px 12px;text-align:center;white-space:nowrap;">
        <button onclick="mntOpenOM('${o.id}')" style="padding:5px 11px;background:#eef2ff;color:#4338ca;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;margin-right:4px;"><i class="fas fa-pen"></i> Ouvrir</button>
        <button onclick="mntCloturerOM('${o.id}')" style="padding:5px 11px;background:#dcfce7;color:#15803d;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-flag-checkered"></i> Clôturer</button>
      </td>
    </tr>`).join('') : `<tr><td colspan="7" style="text-align:center;padding:20px;color:#cbd5e1;font-size:.8rem;">Aucun OM en cours.</td></tr>`
  const histRows = omTermines.slice(0, 30).map((o: any) => `
    <tr style="border-bottom:1px solid #f9fafb;">
      <td style="padding:8px 12px;font-family:monospace;font-size:.72rem;color:#6b7280;">${escX(o.num_om || '—')}</td>
      <td style="padding:8px 12px;font-weight:600;color:#374151;">${escX(o.machine_nom || '—')}</td>
      <td style="padding:8px 12px;font-size:.76rem;color:#374151;">${escX(o.titre || '—')}</td>
      <td style="padding:8px 12px;text-align:center;font-weight:800;color:#0d9488;">${o.duree_h != null ? Number(o.duree_h).toFixed(1) + ' h' : '—'}</td>
      <td style="padding:8px 12px;text-align:center;font-size:.72rem;color:#64748b;">${o.date_fin ? String(o.date_fin).slice(0, 10) : '—'}</td>
    </tr>`).join('')
  const salOpts = (sals || []).map((s: any) => `<option value="${`${s.prenom ?? ''} ${s.nom ?? ''}`.trim().replace(/"/g, '&quot;')}">${escX(`${s.prenom ?? ''} ${s.nom ?? ''}`.trim())}</option>`).join('')
  // Styles et options du formulaire de CRÉATION d'OM (machines triées, panne signalée en premier repère)
  const FL = 'display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'
  const FI = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;'
  const machOpts = [...(machines || [])]
    .sort((a: any, b: any) => String(a.nom || '').localeCompare(String(b.nom || '')))
    .map((m: any) => {
      const enArret = m.statut === 'arret' || m.date_panne
      const lbl = `${m.nom || m.id}${m.code ? ' (' + m.code + ')' : ''}${m.activite ? ' · ' + m.activite : ''}${enArret ? ' — EN PANNE' : ''}`
      return `<option value="${String(m.id).replace(/"/g, '&quot;')}">${escX(lbl)}</option>`
    }).join('')
  return `<div id="mnt-panel-interventions" style="display:none;">
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:18px;border-top:3px solid #ef4444;">
      <div style="padding:13px 18px;font-weight:800;color:#b91c1c;font-size:.92rem;border-bottom:1px solid #f1f5f9;background:#fef2f2;"><i class="fas fa-triangle-exclamation" style="margin-right:7px;"></i>Machines en panne — à traiter <span style="background:#fee2e2;color:#b91c1c;border-radius:999px;padding:1px 9px;font-size:.7rem;">${enPanne.length}</span><span style="font-weight:500;color:#94a3b8;font-size:.7rem;margin-left:8px;">déclarées en panne dans Production › Process atelier</span></div>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;"><thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Machine</th><th style="text-align:left;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Atelier</th><th style="text-align:left;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Motif</th><th style="text-align:center;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Depuis</th><th style="text-align:center;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Action</th></tr></thead><tbody>${panneRows}</tbody></table></div>
    </div>

    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:18px;">
      <div style="padding:13px 18px;font-weight:800;color:#111827;font-size:.92rem;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <span><i class="fas fa-clipboard-list" style="margin-right:7px;color:#eab308;"></i>Ordres de maintenance en cours <span style="background:#fef3c7;color:#92400e;border-radius:999px;padding:1px 9px;font-size:.7rem;">${omOuverts.length}</span></span>
        <button onclick="mntNewOM()" style="padding:8px 16px;background:linear-gradient(135deg,#eab308,#ca8a04);color:white;border:none;border-radius:9px;font-size:.78rem;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Nouvel OM</button>
      </div>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;"><thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">N° OM</th><th style="text-align:left;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Machine</th><th style="text-align:left;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Titre</th><th style="text-align:center;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Priorité</th><th style="text-align:center;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Statut</th><th style="text-align:center;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Signalé</th><th style="text-align:center;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Actions</th></tr></thead><tbody>${omRows}</tbody></table></div>
    </div>

    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="padding:13px 18px;font-weight:800;color:#111827;font-size:.92rem;border-bottom:1px solid #f1f5f9;"><i class="fas fa-history" style="margin-right:7px;color:#0d9488;"></i>Interventions clôturées (MTTR) <span style="background:#ccfbf1;color:#0f766e;border-radius:999px;padding:1px 9px;font-size:.7rem;">${omTermines.length}</span></div>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;"><thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">N° OM</th><th style="text-align:left;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Machine</th><th style="text-align:left;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Titre</th><th style="text-align:center;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">MTTR</th><th style="text-align:center;padding:8px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Clôturé</th></tr></thead><tbody>${histRows || `<tr><td colspan="5" style="text-align:center;padding:18px;color:#cbd5e1;">Aucune intervention clôturée</td></tr>`}</tbody></table></div>
    </div>

    <!-- Modal CRÉATION d'un OM (saisie complète : machine, type, titre, priorité, responsable, planification) -->
    <div id="mntNewOMModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:7000;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:18px;width:640px;max-width:95vw;max-height:92vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.3);">
        <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#eab308,#ca8a04);">
          <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-clipboard-list" style="margin-right:8px;"></i>Nouvel ordre de maintenance</div>
          <button onclick="mntCloseNewOM()" style="background:rgba(255,255,255,.2);border:none;color:white;border-radius:8px;padding:5px 11px;cursor:pointer;font-weight:700;">✕</button>
        </div>
        <div style="padding:20px 22px;">
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:9px 14px;margin-bottom:16px;font-size:.76rem;color:#92400e;">
            <i class="fas fa-circle-info" style="margin-right:6px;"></i>Le n° d'OM est attribué automatiquement. L'intervention démarre au statut <strong>Ouvert</strong> ; le temps d'arrêt (MTTR) court jusqu'à la clôture.
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="${FL}">Machine *</label><select id="nom_machine" style="${FI}"><option value="">— Choisir —</option>${machOpts}</select></div>
            <div><label style="${FL}">Type d'intervention</label><select id="nom_type" style="${FI}"><option value="correctif">Correctif (panne / dépannage)</option><option value="preventif">Préventif (planifié)</option></select></div>
            <div style="grid-column:1/-1;"><label style="${FL}">Titre *</label><input id="nom_titre" type="text" placeholder="Ex : Remplacement courroie broche" style="${FI}"/></div>
            <div style="grid-column:1/-1;"><label style="${FL}">Description / symptôme constaté</label><textarea id="nom_desc" rows="3" placeholder="Ce qui a été observé, le contexte, les premiers constats…" style="${FI}resize:vertical;"></textarea></div>
            <div><label style="${FL}">Priorité</label><select id="nom_prio" style="${FI}"><option value="normal">Normale</option><option value="urgent" selected>Urgente</option><option value="critique">Critique (arrêt de production)</option></select></div>
            <div><label style="${FL}">Responsable</label><input id="nom_resp" list="mnt-sal-list" type="text" placeholder="Qui pilote l'intervention" style="${FI}"/></div>
            <div><label style="${FL}">Date d'intervention prévue</label><input id="nom_dateprev" type="date" style="${FI}"/></div>
            <div><label style="${FL}">Durée estimée (h)</label><input id="nom_duree" type="number" step="any" min="0" placeholder="0" style="${FI}"/></div>
          </div>
        </div>
        <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
          <button onclick="mntCloseNewOM()" style="padding:10px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:10px;font-weight:600;cursor:pointer;">Annuler</button>
          <button onclick="mntSaveNewOM()" style="padding:10px 18px;background:linear-gradient(135deg,#eab308,#ca8a04);color:white;border:none;border-radius:10px;font-weight:800;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Créer l'OM</button>
        </div>
      </div>
    </div>

    <!-- Modal OM -->
    <div id="mntOMModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:7000;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:18px;width:620px;max-width:95vw;max-height:92vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,.3);">
        <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#eab308,#ca8a04);">
          <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-clipboard-check" style="margin-right:8px;"></i><span id="mntOMTitle">Ordre de maintenance</span></div>
          <button onclick="document.getElementById('mntOMModal').style.display='none'" style="background:rgba(255,255,255,.2);border:none;color:white;border-radius:8px;padding:5px 11px;cursor:pointer;font-weight:700;">✕</button>
        </div>
        <div style="padding:20px 22px;">
          <input type="hidden" id="mom_id"/>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="grid-column:1/-1;"><label style="${'display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'}">Titre</label><input id="mom_titre" type="text" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
            <div style="grid-column:1/-1;"><label style="${'display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'}">Description / diagnostic</label><textarea id="mom_desc" rows="2" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;resize:vertical;'}"></textarea></div>
            <div><label style="${'display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'}">Priorité</label><select id="mom_prio" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;'}"><option value="normal">Normale</option><option value="urgent">Urgente</option><option value="critique">Critique</option></select></div>
            <div><label style="${'display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'}">Statut</label><select id="mom_statut" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;'}"><option value="ouvert">Ouvert</option><option value="en_cours">En cours</option><option value="en_attente">En attente</option></select></div>
            <div><label style="${'display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'}">Responsable</label><input id="mom_resp" list="mnt-sal-list" type="text" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;'}"/><datalist id="mnt-sal-list">${salOpts}</datalist></div>
            <div><label style="${'display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'}">Intervenant</label><input id="mom_interv" list="mnt-sal-list" type="text" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
            <div><label style="${'display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'}">Coût réel (€)</label><input id="mom_cout" type="number" step="any" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
            <div><label style="${'display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'}">Pièces utilisées</label><input id="mom_pieces" type="text" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
            <div style="grid-column:1/-1;"><label style="${'display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'}">Cause racine</label><input id="mom_cause" type="text" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
            <div style="grid-column:1/-1;"><label style="${'display:block;font-size:.64rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'}">Observations</label><textarea id="mom_obs" rows="2" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.82rem;background:#f8fafc;box-sizing:border-box;resize:vertical;'}"></textarea></div>
          </div>
        </div>
        <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;gap:8px;">
          <button onclick="mntCloturerOM(document.getElementById('mom_id').value)" style="padding:10px 18px;background:#dcfce7;color:#15803d;border:none;border-radius:10px;font-weight:800;cursor:pointer;"><i class="fas fa-flag-checkered" style="margin-right:5px;"></i>Clôturer l'intervention</button>
          <div style="display:flex;gap:8px;">
            <button onclick="document.getElementById('mntOMModal').style.display='none'" style="padding:10px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:10px;font-weight:600;cursor:pointer;">Fermer</button>
            <button onclick="mntSaveOM()" style="padding:10px 18px;background:linear-gradient(135deg,#eab308,#ca8a04);color:white;border:none;border-radius:10px;font-weight:800;cursor:pointer;"><i class="fas fa-save" style="margin-right:5px;"></i>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  </div>`
}

function panelPreventif(machines: any[] = []) {
  const esc = (s: any) => String(s ?? '').replace(/"/g, '&quot;')
  const items = (machines || []).map((m: any) => {
    const col = m.activite === 'Seem' ? '#1d4ed8' : m.activite === 'Semrac' ? '#be185d' : '#5b21b6'
    return `<div class="prev-mitem" data-id="${esc(m.id)}" data-nom="${esc(m.nom)}" onclick="prevSelect(this)" style="padding:9px 11px;border:1px solid #f1f5f9;border-left:3px solid ${col};border-radius:9px;cursor:pointer;margin-bottom:6px;transition:all .12s;">
      <div style="font-weight:700;color:#1e293b;font-size:.8rem;">${escX(m.nom)}</div>
      <div style="font-size:.64rem;color:#94a3b8;">${escX(m.code || '')} · ${escX(m.activite || '')}</div>
    </div>`
  }).join('')
  return `<div id="mnt-panel-preventif" style="display:none;">
    <div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:4px;"><i class="fas fa-calendar-check" style="color:#eab308;margin-right:7px;"></i>Plan préventif — usure &amp; remplacement des pièces</div>
    <div style="font-size:.76rem;color:#64748b;margin-bottom:16px;">Heures de fonctionnement (issues des BDT) et suivi d'usure des pièces remplaçables par machine. Définissez la durée de vie conseillée et la date du dernier remplacement dans l'onglet « Pièces &amp; PDR ».</div>
    <div style="display:grid;grid-template-columns:290px 1fr;gap:16px;align-items:start;">
      <div class="card" style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:12px;position:sticky;top:12px;">
        <div style="font-weight:800;color:#854d0e;font-size:.82rem;margin-bottom:8px;"><i class="fas fa-cogs" style="margin-right:6px;"></i>Machines <span style="background:#fef3c7;color:#92400e;border-radius:999px;padding:1px 8px;font-size:.66rem;">${(machines || []).length}</span></div>
        <input id="prev-search" type="text" placeholder="🔍 Rechercher…" oninput="prevFilter()" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.76rem;outline:none;box-sizing:border-box;margin-bottom:8px;"/>
        <div id="prev-mlist" style="max-height:600px;overflow-y:auto;">${items || '<div style="padding:20px;text-align:center;color:#cbd5e1;font-size:.78rem;">Aucune machine</div>'}</div>
      </div>
      <div>
        <div id="prev-empty" class="card" style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:46px;text-align:center;color:#94a3b8;"><i class="fas fa-hand-pointer" style="font-size:1.8rem;display:block;margin-bottom:10px;color:#cbd5e1;"></i>Choisissez une machine pour voir ses heures de fonctionnement et l'usure de ses pièces.</div>
        <div id="prev-content" style="display:none;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
            <i class="fas fa-cog" style="color:#eab308;font-size:1.1rem;"></i><span id="prev-nom" style="font-weight:800;font-size:1rem;color:#111827;"></span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
            <div style="background:white;border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #eab308;text-align:center;"><div id="prev-h-year" style="font-size:1.5rem;font-weight:800;color:#ca8a04;">—</div><div style="font-size:.7rem;color:#6b7280;font-weight:600;">Heures tournées (année)</div></div>
            <div style="background:white;border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #6366f1;text-align:center;"><div id="prev-h-total" style="font-size:1.5rem;font-weight:800;color:#6366f1;">—</div><div style="font-size:.7rem;color:#6b7280;font-weight:600;">Heures totales (BDT)</div></div>
            <div style="background:white;border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #ef4444;text-align:center;"><div id="prev-alerts" style="font-size:1.5rem;font-weight:800;color:#ef4444;">—</div><div style="font-size:.7rem;color:#6b7280;font-weight:600;">Pièces à remplacer</div></div>
          </div>
          <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
            <div style="padding:12px 16px;font-weight:800;color:#111827;font-size:.88rem;border-bottom:1px solid #f1f5f9;"><i class="fas fa-screwdriver-wrench" style="margin-right:6px;color:#eab308;"></i>Pièces remplaçables — usure &amp; échéance</div>
            <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;"><thead><tr style="background:#f8fafc;">
              <th style="text-align:left;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Pièce</th><th style="text-align:left;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Référence</th><th style="text-align:center;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Durée de vie</th><th style="text-align:center;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Dernier rempl.</th><th style="text-align:center;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Utilisé depuis</th><th style="text-align:center;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Restant avant rempl.</th><th style="text-align:left;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;width:160px;">Usure</th><th style="text-align:center;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;"></th>
            </tr></thead><tbody id="prev-parts-tbody"></tbody></table></div>
          </div>
        </div>
      </div>
    </div>
  </div>`
}

function panelMTBF(oms: OrdreMaintenance[] = [], machines: any[] = []) {
  return `<div id="mnt-panel-mtbf" style="display:none;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <div style="font-weight:800;color:#111827;font-size:1rem;"><i class="fas fa-chart-line" style="color:#eab308;margin-right:7px;"></i>Fiabilité — MTTR &amp; MTBF</div>
      <div style="display:flex;gap:4px;background:white;border-radius:10px;padding:4px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
        <button id="mtbf-f-all" onclick="mntMtbfFilter('all',this)" class="mtbf-pill active">Tout l'atelier</button>
        <button id="mtbf-f-Seem" onclick="mntMtbfFilter('Seem',this)" class="mtbf-pill">SEEM</button>
        <button id="mtbf-f-Semrac" onclick="mntMtbfFilter('Semrac',this)" class="mtbf-pill">SEMRAC</button>
      </div>
      <span style="font-size:.7rem;color:#94a3b8;">MTTR = temps moyen de réparation · MTBF = temps moyen entre pannes</span>
    </div>
    <style>.mtbf-pill{padding:6px 14px;border-radius:8px;border:none;background:transparent;color:#64748b;font-size:.78rem;font-weight:700;cursor:pointer;}.mtbf-pill.active{background:linear-gradient(135deg,#eab308,#ca8a04);color:white;}</style>
    <div id="mtbf-kpis" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;"></div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="padding:13px 18px;font-weight:800;color:#111827;font-size:.9rem;border-bottom:1px solid #f1f5f9;">Indicateurs par machine</div>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;"><thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Machine</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Atelier</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">Pannes</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">MTTR (h)</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">MTBF (h)</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#6b7280;">État</th></tr></thead><tbody id="mtbf-tbody"></tbody></table></div>
    </div>
  </div>`
}

function panelPieces(machines: any[] = [], pieces: any[] = []) {
  const machOpts = (machines || []).map((m: any) => `<option value="${m.id}">${escX(m.nom)}${m.code ? ` (${escX(m.code)})` : ''}</option>`).join('')
  return `<div id="mnt-panel-pieces" style="display:none;">
    <div style="font-weight:800;color:#111827;font-size:1rem;margin-bottom:6px;"><i class="fas fa-cogs" style="color:#eab308;margin-right:7px;"></i>Pièces de rechange (PDR) par machine</div>
    <div style="font-size:.76rem;color:#64748b;margin-bottom:16px;">Sélectionnez une machine pour gérer ses pièces de rechange et leurs fournisseurs.</div>
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
      <label style="font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Machine :</label>
      <select id="pdr_machine" onchange="mntPdrSelect(this.value)" style="border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:.84rem;background:#f8fafc;min-width:280px;"><option value="">— Choisir une machine —</option>${machOpts}</select>
    </div>
    <div id="pdr_zone" style="display:none;">
      <div class="card" style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:16px;margin-bottom:16px;">
        <div style="font-weight:800;color:#0f766e;font-size:.85rem;margin-bottom:12px;"><i class="fas fa-plus-circle" style="margin-right:6px;"></i>Ajouter une pièce de rechange</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
          <div style="grid-column:1/-1;"><label style="${'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'}">Désignation *</label><input id="pdr_desig" type="text" placeholder="ex : Courroie trapézoïdale A38" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
          <div><label style="${'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'}">Référence</label><input id="pdr_ref" type="text" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
          <div><label style="${'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'}">Fournisseur</label><input id="pdr_fourn" list="pdr-fourn-list" type="text" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
          <div><label style="${'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'}">Prix unitaire (€)</label><input id="pdr_prix" type="number" step="any" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
          <div><label style="${'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'}">Stock actuel</label><input id="pdr_stock" type="number" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
          <div><label style="${'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'}">Stock mini</label><input id="pdr_mini" type="number" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
          <div><label style="${'display:block;font-size:.62rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px;'}">Emplacement</label><input id="pdr_empl" type="text" placeholder="Magasin / casier" style="${'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#f8fafc;box-sizing:border-box;'}"/></div>
          <div><label style="${'display:block;font-size:.62rem;font-weight:700;color:#ca8a04;text-transform:uppercase;margin-bottom:3px;'}">Durée de vie conseillée (h)</label><input id="pdr_vie" type="number" step="any" placeholder="ex : 2000" title="Heures de fonctionnement avant remplacement conseillé (plan préventif)" style="${'width:100%;border:1.5px solid #fde68a;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#fffbeb;box-sizing:border-box;'}"/></div>
          <div><label style="${'display:block;font-size:.62rem;font-weight:700;color:#ca8a04;text-transform:uppercase;margin-bottom:3px;'}">Dernier remplacement</label><input id="pdr_dernier" type="date" title="Date du dernier remplacement (compteur d'usure du préventif)" style="${'width:100%;border:1.5px solid #fde68a;border-radius:8px;padding:7px 9px;font-size:.8rem;background:#fffbeb;box-sizing:border-box;'}"/></div>
        </div>
        <button onclick="mntPdrAdd()" style="margin-top:12px;padding:9px 18px;background:linear-gradient(135deg,#eab308,#ca8a04);color:white;border:none;border-radius:9px;font-weight:800;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Ajouter la pièce</button>
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
        <div style="padding:13px 18px;font-weight:800;color:#111827;font-size:.9rem;border-bottom:1px solid #f1f5f9;">Pièces de rechange <span id="pdr_count" style="background:#fef3c7;color:#92400e;border-radius:999px;padding:1px 9px;font-size:.7rem;"></span></div>
        <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;"><thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Désignation</th><th style="text-align:left;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Référence</th><th style="text-align:left;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Fournisseur</th><th style="text-align:center;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Prix</th><th style="text-align:center;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Stock</th><th style="text-align:left;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;">Emplac.</th><th style="text-align:center;padding:8px 12px;font-size:.62rem;text-transform:uppercase;color:#6b7280;"></th></tr></thead><tbody id="pdr_tbody"></tbody></table></div>
      </div>
    </div>
    <div id="pdr_empty" style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:42px;text-align:center;color:#94a3b8;"><i class="fas fa-hand-pointer" style="font-size:1.8rem;display:block;margin-bottom:10px;color:#cbd5e1;"></i>Choisissez une machine pour voir et gérer ses pièces de rechange.</div>
  </div>`
}

function panelPosteCosts(postes: any[] = [], cost: Record<string, any> = {}, rates: Record<string, any> = {}) {
  const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fmt = (v: number) => Math.round(Number(v) || 0).toLocaleString('fr-FR') + ' €'
  const list = (postes || []).filter((p: any) => p.statut !== 'inactif')
  let tOpex = 0, tMaint = 0
  const rows = list.map((p: any) => {
    const c = cost[String(p.id)] || { opexAn: 0, maintAn: 0, machines: [] }
    const tco = (c.opexAn || 0) + (c.maintAn || 0); tOpex += c.opexAn || 0; tMaint += c.maintAn || 0
    const pr = rates[String(p.id)] || null
    const tauxEff = pr ? Number(pr.tauxEffectif) || 0 : 0
    const tauxManuel = pr && pr.manuel != null
    const tauxIncr = pr ? Number(pr.increment) || 0 : 0
    return `<tr style="border-bottom:1px solid #f9fafb;">
      <td style="padding:10px 14px;font-weight:700;color:#1e293b;"><span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${p.couleur || '#8b5cf6'};margin-right:7px;"></span>${esc(p.nom)}</td>
      <td style="padding:10px 14px;text-align:center;font-weight:700;color:${c.machines.length ? '#0ea5e9' : '#cbd5e1'};">${c.machines.length || '—'}</td>
      <td style="padding:10px 14px;text-align:right;color:#6b7280;">${fmt(c.opexAn)}</td>
      <td style="padding:10px 14px;text-align:right;color:#c2410c;font-weight:700;">${fmt(c.maintAn)}</td>
      <td style="padding:10px 14px;text-align:right;font-weight:800;color:#7c3aed;">${fmt(tco)}</td>
      <td style="padding:10px 14px;text-align:right;font-weight:800;color:${tauxManuel ? '#b45309' : (tauxIncr > 0 ? '#0d9488' : '#475569')};">${c.machines.length ? tauxEff.toFixed(2) + ' €/h' + (tauxManuel ? '<div style="font-size:.58rem;color:#b45309;font-weight:700;">manuel</div>' : (tauxIncr > 0 ? '<div style="font-size:.58rem;color:#0d9488;font-weight:700;">dont +' + tauxIncr.toFixed(2) + ' achats</div>' : '')) : '—'}</td>
    </tr>`
  }).join('')
  return `<div id="mnt-panel-postes" style="display:none;">
    <div class="card" style="overflow:hidden;">
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#1e293b;font-size:.9rem;"><i class="fas fa-object-group" style="color:#8b5cf6;margin-right:7px;"></i>Coûts par poste — OPEX + maintenance (TCO annuel)</div>
      ${list.length === 0 ? `<div style="padding:24px;text-align:center;color:#94a3b8;font-size:.82rem;">Aucun poste défini. Créez des postes dans <strong>Production → onglet Machines → « Postes de travail »</strong>.</div>` : `
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.82rem;">
        <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
          <th style="text-align:left;padding:10px 14px;font-size:.66rem;text-transform:uppercase;color:#6b7280;font-weight:800;">Poste</th>
          <th style="text-align:center;padding:10px 14px;font-size:.66rem;text-transform:uppercase;color:#6b7280;font-weight:800;">Machines</th>
          <th style="text-align:right;padding:10px 14px;font-size:.66rem;text-transform:uppercase;color:#6b7280;font-weight:800;">OPEX annuel</th>
          <th style="text-align:right;padding:10px 14px;font-size:.66rem;text-transform:uppercase;color:#6b7280;font-weight:800;">Maintenance ${new Date().getFullYear()}</th>
          <th style="text-align:right;padding:10px 14px;font-size:.66rem;text-transform:uppercase;color:#6b7280;font-weight:800;">TCO annuel</th>
          <th style="text-align:right;padding:10px 14px;font-size:.66rem;text-transform:uppercase;color:#0d9488;font-weight:800;" title="Taux qui alimente le CRU : base + achats machine reçus / heures budgétées (ou override manuel). Réglé en Production.">Taux/h effectif</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr style="background:#faf5ff;border-top:2px solid #ede9fe;">
          <td colspan="2" style="padding:10px 14px;font-weight:800;color:#7c3aed;">TOTAL POSTES</td>
          <td style="padding:10px 14px;text-align:right;font-weight:800;color:#6b7280;">${fmt(tOpex)}</td>
          <td style="padding:10px 14px;text-align:right;font-weight:800;color:#c2410c;">${fmt(tMaint)}</td>
          <td style="padding:10px 14px;text-align:right;font-weight:900;color:#7c3aed;">${fmt(tOpex + tMaint)}</td>
          <td></td>
        </tr></tfoot>
      </table></div>`}
      <div style="padding:10px 18px;border-top:1px solid #f1f5f9;font-size:.72rem;color:#64748b;"><i class="fas fa-link" style="color:#8b5cf6;margin-right:5px;"></i>Même agrégation qu'en Production : OPEX annuel (réel/théorique) des machines du poste + coût des OM de leurs machines. TCO = OPEX + maintenance.</div>
    </div>
  </div>`
}
function panelFiche(machines: any[] = []) {
  const opts = (machines || []).map((m: any) => `<option value="${escX(m.id)}">${escX(m.nom)}${m.code ? ` (${escX(m.code)})` : ''}</option>`).join('')
  return `<div id="mnt-panel-fiche" style="display:none;">
    <div style="font-weight:800;color:#111827;font-size:1rem;margin-bottom:6px;"><i class="fas fa-id-card" style="color:#eab308;margin-right:7px;"></i>Fiche machine 360</div>
    <div style="font-size:.76rem;color:#64748b;margin-bottom:16px;">Coût total de possession (OPEX + usage production + maintenance + pièces), fiabilité et historique complet de tout ce qui est passé sur la machine.</div>
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
      <label style="font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;">Machine :</label>
      <select id="fiche_machine" onchange="mntFicheRender(this.value)" style="border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 12px;font-size:.84rem;background:#f8fafc;min-width:300px;"><option value="">— Choisir une machine —</option>${opts}</select>
    </div>
    <div id="fiche_zone"></div>
    <div id="fiche_empty" style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:42px;text-align:center;color:#94a3b8;"><i class="fas fa-hand-pointer" style="font-size:1.8rem;display:block;margin-bottom:10px;color:#cbd5e1;"></i>Choisissez une machine pour ouvrir sa fiche 360.</div>
  </div>`
}

export const pageServiceMaintenance = (
  dbOMs?:  OrdreMaintenance[],
  dbPPs?:  PlanPreventif[],
  dbMTBF?: MtbfMachine[],
  dbMachines?: any[],
  dbPieces?: any[],
  dbSals?: any[],
  dbMachineHours?: Record<string, { d: string; h: number }[]>,
  dbOpex?: any[],
  dbControles?: any[],
  dbHist?: any[],
  dbPostes?: any[],
) => {
  const OMS: any[]  = dbOMs ?? []
  const PPS  = dbPPs  ?? []
  const MTBF = dbMTBF ?? []
  const MACHINES: any[] = dbMachines ?? []
  const PIECES: any[]   = dbPieces ?? []
  const SALS: any[]     = dbSals ?? []
  const MACHINE_HOURS: Record<string, { d: string; h: number }[]> = dbMachineHours ?? {}

  // ─── FICHE MACHINE 360 : agrégation coûts (OPEX + usage prod + maintenance + PDR),
  //     fiabilité et traçabilité de tout ce qui est passé sur la machine. ──────────
  const OPEX: any[]      = dbOpex ?? []
  const CONTROLES: any[] = dbControles ?? []
  const HIST: any[]      = dbHist ?? []
  const FYEAR = new Date().getFullYear()
  const FYEAR_S = String(FYEAR)
  // OPEX trié année desc en amont → le 1er vu pour une machine est le plus récent
  const opexByMachine: Record<string, any> = {}
  for (const o of OPEX) { const k = String(o.machine_id); if (!(k in opexByMachine)) opexByMachine[k] = o }
  // ─── Coût PAR POSTE (régularisé avec la Production) : par poste, OPEX annuel + maintenance de ses machines ───
  const POSTES: any[] = dbPostes ?? []
  // Phase E : taux horaire effectif par poste (même moteur que le CRU) — affiché en « Coûts postes » pour réconcilier.
  const POSTE_RATES = computePosteRates(MACHINES, OPEX, POSTES, FYEAR)
  const posteCost: Record<string, { opexAn: number; maintAn: number; maintTot: number; machines: string[] }> = {}
  for (const m of MACHINES) {
    const pid = (m as any).poste_id ? String((m as any).poste_id) : ''
    if (!pid) continue
    const e = (posteCost[pid] = posteCost[pid] || { opexAn: 0, maintAn: 0, maintTot: 0, machines: [] })
    e.machines.push(String(m.id))
    const ox = opexByMachine[String(m.id)]
    e.opexAn += (ox && ox.cout_total_ht != null) ? Number(ox.cout_total_ht) : (Number((m as any).cout_h) || 0) * (Number((m as any).capacite_h) || 0) * 220
  }
  for (const o of OMS) {
    const m = MACHINES.find((x: any) => String(x.id) === String((o as any).machine_id || ''))
    if (!m || !(m as any).poste_id) continue
    const e = posteCost[String((m as any).poste_id)]; if (!e) continue
    const c = Number((o as any).cout_reel) || 0; e.maintTot += c
    if (String((o as any).date_cloture || (o as any).date_signalement || '').slice(0, 4) === FYEAR_S) e.maintAn += c
  }

  const FICHE: Record<string, any> = {}
  for (const m of MACHINES) {
    const id = String(m.id)
    const hrs = MACHINE_HOURS[id] || []
    const heuresTot = hrs.reduce((s, x) => s + (Number(x.h) || 0), 0)
    const heuresAn  = hrs.reduce((s, x) => s + ((x.d && String(x.d).slice(0, 4) === FYEAR_S) ? (Number(x.h) || 0) : 0), 0)
    const opex = opexByMachine[id] || null
    const taux = opex && opex.taux_horaire != null ? Number(opex.taux_horaire) : 0
    const opexAnnuel = opex && opex.cout_total_ht != null ? Number(opex.cout_total_ht) : 0
    const coutAbsorbeTot = +(heuresTot * taux).toFixed(2)
    const coutAbsorbeAn  = +(heuresAn * taux).toFixed(2)

    const omsM = OMS.filter((o: any) => String(o.machine_id) === id)
    const maintTot = omsM.reduce((s: number, o: any) => s + (Number(o.cout_reel) || 0), 0)
    const maintAn  = omsM.reduce((s: number, o: any) => {
      const d = String(o.date_fin || o.date_debut || o.date_signalement || o.created_at || '').slice(0, 4)
      return s + (d === FYEAR_S ? (Number(o.cout_reel) || 0) : 0)
    }, 0)
    const omOuverts = omsM.filter((o: any) => o.statut !== 'termine' && o.statut !== 'annule').length

    const pcs = PIECES.filter((p: any) => String(p.machine_id) === id)
    const pdrValeur = pcs.reduce((s: number, p: any) => s + (Number(p.prix_unitaire) || 0) * (Number(p.stock_actuel) || 0), 0)
    const pdrSousMini = pcs.filter((p: any) => p.stock_mini != null && Number(p.stock_actuel) <= Number(p.stock_mini) && Number(p.stock_mini) > 0).length

    const ctrl = CONTROLES.filter((c: any) => String(c.machine_id) === id)
    const ctrlConf = ctrl.filter((c: any) => c.conforme !== false).length
    const ctrlPct = ctrl.length ? Math.round(ctrlConf / ctrl.length * 100) : null

    const histM = HIST.filter((h: any) => String(h.machine_id) === id)
    const hist = histM.slice(0, 20).map((h: any) => ({
      d: String(h.created_at || '').slice(0, 10), op: h.operation || null, piece: h.piece || null,
      client: h.client_nom || null, t: h.temps_reel != null ? Number(h.temps_reel) : null,
      res: h.resultat || h.statut || null, who: h.operateur_nom || null,
    }))
    const omsList = omsM.slice(0, 12).map((o: any) => ({
      num: o.num_om || o.id, type: o.type, titre: o.titre, statut: o.statut,
      cout: o.cout_reel != null ? Number(o.cout_reel) : null,
      d: String(o.date_fin || o.date_signalement || o.created_at || '').slice(0, 10),
    }))

    // ─── Fiabilité (MTTR/MTBF/Disponibilité) depuis les OM + TRS ───
    const durs = omsM.filter((o: any) => o.statut === 'termine').map((o: any) => (o.duree_h != null ? Number(o.duree_h) : null)).filter((x: any) => x != null && isFinite(x)) as number[]
    const mttr = durs.length ? durs.reduce((a, b) => a + b, 0) / durs.length : null
    const sigs = omsM.map((o: any) => o.date_signalement).filter(Boolean).map((d: any) => new Date(d).getTime()).filter((t: number) => isFinite(t)).sort((a: number, b: number) => a - b)
    let mtbf: number | null = null
    if (sigs.length >= 2) { const g: number[] = []; for (let i = 1; i < sigs.length; i++) g.push((sigs[i] - sigs[i - 1]) / 3600000); mtbf = g.reduce((a, b) => a + b, 0) / g.length }
    // Disponibilité = MTBF/(MTBF+MTTR) ; 100% si la machine n'a jamais eu d'OM ; null si non calculable
    const dispo = omsM.length === 0 ? 100 : ((mtbf != null && mttr != null && (mtbf + mttr) > 0) ? +(mtbf / (mtbf + mttr) * 100).toFixed(1) : null)
    // Qualité = part des passages machine conformes (historique BDT machine)
    const qBad = histM.filter((h: any) => h.resultat === 'nc' || h.resultat === 'non_conforme').length
    const qualPct = histM.length ? Math.round((histM.length - qBad) / histM.length * 100) : null
    // TRS = Dispo × Performance × Qualité. Performance non mesurée (cadence théorique requise)
    // → TRS PARTIEL = Dispo × Qualité, clairement étiqueté côté UI.
    const trs = (dispo != null && qualPct != null) ? Math.round(dispo / 100 * qualPct / 100 * 100) : null

    FICHE[id] = {
      id, nom: m.nom, code: m.code || '', activite: m.activite || '', statut: m.statut || 'operationnel', annee: FYEAR,
      taux, opexAnnuel, heuresTot: Math.round(heuresTot), heuresAn: Math.round(heuresAn),
      coutAbsorbeTot, coutAbsorbeAn,
      maintTot: +maintTot.toFixed(2), maintAn: +maintAn.toFixed(2), nbOM: omsM.length, omOuverts,
      pdrCount: pcs.length, pdrValeur: +pdrValeur.toFixed(2), pdrSousMini,
      ctrlN: ctrl.length, ctrlPct,
      tcoAn: +(opexAnnuel + maintAn).toFixed(2),
      mttr: mttr != null ? +mttr.toFixed(1) : null, mtbf: mtbf != null ? +mtbf.toFixed(1) : null,
      nbPannes: omsM.length, dispo, qualPct, trs,
      hist, omsList,
    }
  }

  const isDemo = false

  const omOuverts = OMS.filter((o: any) => o.statut !== 'termine' && o.statut !== 'annule').length
  const omCrit    = OMS.filter((o: any) => o.priorite === 'critique' && o.statut !== 'termine' && o.statut !== 'annule').length

  const TABS = [
    ['interventions','Interventions / OM','fa-clipboard-list'],
    ['preventif',    'Plan Préventif',    'fa-calendar-check'],
    ['mtbf',         'MTBF & Historique', 'fa-chart-line'],
    ['fiche',        'Fiche 360',         'fa-id-card'],
    ['postes',       'Coûts postes',      'fa-object-group'],
    ['pieces',       'Pièces & PDR',      'fa-cogs'],
    ['dashboard',    'Dashboard',         'fa-tachometer-alt'],
  ] as const

  const content = `
  <div style="font-family:Inter,system-ui,sans-serif;">

    ${serviceHeader({
      icon: 'fa-tools',
      color: YEL,
      darkBg: '#422006',
      title: 'Service Maintenance',
      subtitle: 'GMAO · OM · Préventif · MTBF · PDR · Historique · EN 9100:2018',
      tabs: TABS.map(([id,lbl,ic]) => ({ id, label: lbl, icon: ic, badge:
          id==='interventions' ? (omOuverts || undefined)
        : id==='pieces'        ? (PIECES.length || undefined)
        : id==='postes'        ? (POSTES.filter((p:any)=>p.statut!=='inactif').length || undefined)
        : undefined })),
      switchFn: 'mntShowTab',
      tabIdPrefix: 'mnt-tab',
      activeId: 'interventions'
    })}

    ${isDemo ? `
    <div style="background:#fffbeb;border-bottom:2px solid #fde68a;padding:8px 20px;font-size:.75rem;color:#92400e;display:flex;align-items:center;gap:8px;">
      <i class="fas fa-info-circle"></i>
      <span><strong>Mode démonstration</strong> — Aucun OM/PM en base de données. Les données affichées sont des exemples. Créez votre premier ordre de maintenance via l&#39;onglet "Interventions".</span>
    </div>` : ''}

    <div style="padding:22px 30px;">
      ${panelDashboard(OMS, PPS, MTBF, MACHINES, FICHE)}
      ${panelInterventions(OMS, MACHINES, SALS)}
      ${panelPreventif(MACHINES)}
      ${panelMTBF(OMS, MACHINES)}
      ${panelFiche(MACHINES)}
      ${panelPosteCosts(POSTES, posteCost, POSTE_RATES.byPoste)}
      ${panelPieces(MACHINES, PIECES)}
    </div>
  </div>

  <script>
  var MNT_TABS=['dashboard','interventions','preventif','mtbf','pieces','fiche','postes'];
  var MNT_OMS=${sjX(OMS.map((o:any)=>({id:o.id,num_om:o.num_om,machine_id:o.machine_id,machine_nom:o.machine_nom,titre:o.titre,description:o.description,priorite:o.priorite,statut:o.statut,responsable:o.responsable,intervenant:o.intervenant,date_signalement:o.date_signalement,date_debut:o.date_debut,date_fin:o.date_fin,duree_h:o.duree_h,cout_reel:o.cout_reel,pieces_utilisees:o.pieces_utilisees,observations:o.observations,cause_racine:o.cause_racine,action_preventive:o.action_preventive}))).replace(/</g,'\\u003c')};
  var MNT_MACHINES=${sjX(MACHINES.map((m:any)=>({id:m.id,nom:m.nom,code:m.code,activite:m.activite,statut:m.statut,date_panne:m.date_panne}))).replace(/</g,'\\u003c')};
  var MNT_PIECES=${sjX(PIECES.map((p:any)=>({id:p.id,machine_id:p.machine_id,designation:p.designation,reference:p.reference,fournisseur:p.fournisseur,prix_unitaire:p.prix_unitaire,stock_actuel:p.stock_actuel,stock_mini:p.stock_mini,emplacement:p.emplacement,duree_vie_h:p.duree_vie_h,date_dernier_remplacement:p.date_dernier_remplacement,remplacable:p.remplacable}))).replace(/</g,'\\u003c')};
  var MNT_BDT=${sjX(MACHINE_HOURS).replace(/</g,'\\u003c')};
  var MNT_FICHE=${sjX(FICHE).replace(/</g,'\\u003c')};

  function mntShowTab(id){
    MNT_TABS.forEach(function(t){
      var p=document.getElementById('mnt-panel-'+t);
      var b=document.getElementById('mnt-tab-'+t);
      if(p) p.style.display=(t===id)?'block':'none';
      if(b) b.classList.toggle('active',t===id);
    });
  }

  function mntSwitchPP(id){
    ['planning','gammes','ajouter'].forEach(function(p){
      var el=document.getElementById('mnt-pp-panel-'+p);
      var btn=document.getElementById('mnt-pp-'+p);
      if(el) el.style.display=(p===id)?'block':'none';
      if(btn) btn.classList.toggle('mnt-sub-active',p===id);
    });
  }

  var mntFiltStatut='tous', mntFiltType='tous', mntFiltPrio='toutes', mntSrchOM='';

  function mntApplyFiltersOM(){
    var rows=document.querySelectorAll('#mnt-om-tbody tr[data-om]');
    rows.forEach(function(tr){
      var st  = mntFiltStatut==='tous'  || tr.dataset.statut===mntFiltStatut;
      var tp  = mntFiltType==='tous'    || tr.dataset.type===mntFiltType;
      var pr  = mntFiltPrio==='toutes'  || tr.dataset.prio===mntFiltPrio;
      var sr  = !mntSrchOM || tr.textContent.toLowerCase().indexOf(mntSrchOM)>=0;
      tr.style.display=(st&&tp&&pr&&sr)?'':'none';
    });
  }

  function mntFiltreOM(s){
    mntFiltStatut=s;
    document.querySelectorAll('[id^="mnt-fom-"]').forEach(function(b){b.classList.remove('mnt-f-active');});
    var el=document.getElementById('mnt-fom-'+s);
    if(el) el.classList.add('mnt-f-active');
    mntApplyFiltersOM();
  }

  function mntFiltreType(t){
    mntFiltType=t;
    document.querySelectorAll('[id^="mnt-ftype-"]').forEach(function(b){b.classList.remove('mnt-f-active');});
    var el=document.getElementById('mnt-ftype-'+t);
    if(el) el.classList.add('mnt-f-active');
    mntApplyFiltersOM();
  }

  function mntFiltrePrio(p){
    mntFiltPrio=p;
    document.querySelectorAll('[id^="mnt-fprio-"]').forEach(function(b){b.classList.remove('mnt-f-active');});
    var el=document.getElementById('mnt-fprio-'+p);
    if(el) el.classList.add('mnt-f-active');
    mntApplyFiltersOM();
  }

  function mntSearchOM(q){ mntSrchOM=q.toLowerCase().trim(); mntApplyFiltersOM(); }

  // ── Création OM depuis une machine en panne ──
  function mntCreerOMpanne(machineId){
    fetch('/api/maintenance/om',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({machine_id:machineId})})
      .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-clipboard-list','OM '+((j.om&&j.om.num_om)||'')+' créé.',4000); setTimeout(function(){ softReload(); },800); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  // ── Création d'un OM (saisie complète) ──
  function mntNewOM(machineId){
    function set(f,v){ var e=document.getElementById(f); if(e) e.value=(v==null?'':v); }
    set('nom_machine', machineId||''); set('nom_type','correctif'); set('nom_titre',''); set('nom_desc','');
    set('nom_prio','urgent'); set('nom_resp',''); set('nom_dateprev',''); set('nom_duree','');
    document.getElementById('mntNewOMModal').style.display='flex';
    var t=document.getElementById('nom_titre'); if(t) setTimeout(function(){ t.focus(); },80);
  }
  function mntCloseNewOM(){ document.getElementById('mntNewOMModal').style.display='none'; }
  function mntSaveNewOM(){
    function val(f){ var e=document.getElementById(f); return e? String(e.value||"").trim() : ""; }
    var machine=val('nom_machine'), titre=val('nom_titre');
    if(!machine){ pushNotif('err','fa-exclamation-circle','Choisissez la machine concernee.'); return; }
    if(!titre){ pushNotif('err','fa-exclamation-circle','Donnez un titre a l intervention.'); return; }
    var payload={ machine_id:machine, type:val('nom_type')||'correctif', titre:titre,
      description:val('nom_desc')||null, priorite:val('nom_prio')||'normal', responsable:val('nom_resp')||null,
      date_prevue:val('nom_dateprev')||null, duree_h:parseFloat(val('nom_duree'))||null };
    fetch('/api/maintenance/om',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Creation echouee.'); return; }
        mntCloseNewOM();
        pushNotif('ok','fa-clipboard-list','OM <strong>'+((j.om&&j.om.num_om)||'')+'</strong> cree — statut Ouvert.',5000);
        setTimeout(function(){ location.hash='interventions'; softReload(); },800);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); });
  }

  function mntOpenOM(id){
    var o=MNT_OMS.find(function(x){return String(x.id)===String(id);}); if(!o) return;
    function set(f,v){ var e=document.getElementById(f); if(e) e.value=(v==null?'':v); }
    set('mom_id',o.id); set('mom_titre',o.titre); set('mom_desc',o.description); set('mom_prio',o.priorite||'normal'); set('mom_statut',o.statut||'ouvert'); set('mom_resp',o.responsable); set('mom_interv',o.intervenant); set('mom_cout',o.cout_reel); set('mom_pieces',o.pieces_utilisees); set('mom_cause',o.cause_racine); set('mom_obs',o.observations);
    var t=document.getElementById('mntOMTitle'); if(t) t.textContent=((o.num_om||'OM'))+' — '+(o.machine_nom||'');
    document.getElementById('mntOMModal').style.display='flex';
  }
  function mntSaveOM(){
    var id=document.getElementById('mom_id').value; if(!id) return;
    function v(f){ var e=document.getElementById(f); return e?e.value:''; }
    var payload={ titre:v('mom_titre'), description:v('mom_desc'), priorite:v('mom_prio'), statut:v('mom_statut'), responsable:v('mom_resp'), intervenant:v('mom_interv'), cout_reel:v('mom_cout')||null, pieces_utilisees:v('mom_pieces'), cause_racine:v('mom_cause'), observations:v('mom_obs') };
    fetch('/api/maintenance/om/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-save','OM enregistré (sans clôture).',3500); setTimeout(function(){ softReload(); },700); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  async function mntCloturerOM(id){
    if(!id) return; if(!await appConfirm('Clôturer cette intervention ? La machine sera remise en service et le MTTR calculé.')) return;
    var body={}; var mi=document.getElementById('mom_id');
    if(mi && String(mi.value)===String(id)){ var v=function(f){var e=document.getElementById(f);return e?e.value:'';}; body={cout_reel:v('mom_cout')||null,observations:v('mom_obs'),cause_racine:v('mom_cause'),pieces_utilisees:v('mom_pieces'),intervenant:v('mom_interv')}; }
    fetch('/api/maintenance/om/'+encodeURIComponent(id)+'/cloturer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
      .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-flag-checkered','Intervention clôturée — MTTR '+(j.mttr_h!=null?Number(j.mttr_h).toFixed(1)+' h':'')+'. Machine remise en service.',5000); setTimeout(function(){ softReload(); },900); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  // ── MTTR / MTBF ──
  var MNT_MTBF_FILTER='all';
  function mntMtbfFilter(f,btn){ MNT_MTBF_FILTER=f; ['all','Seem','Semrac'].forEach(function(x){var b=document.getElementById('mtbf-f-'+x); if(b)b.classList.toggle('active',x===f);}); mntRenderMTBF(); }
  function mntComputeMachine(m){
    var oms=MNT_OMS.filter(function(o){ return String(o.machine_id)===String(m.id); });
    var durs=oms.filter(function(o){return o.statut==='termine';}).map(function(o){ return o.duree_h!=null?Number(o.duree_h):null; }).filter(function(x){return x!=null&&isFinite(x);});
    var mttr= durs.length? durs.reduce(function(a,b){return a+b;},0)/durs.length : null;
    var sigs=oms.map(function(o){ return o.date_signalement; }).filter(Boolean).map(function(d){return new Date(d).getTime();}).filter(function(t){return isFinite(t);}).sort(function(a,b){return a-b;});
    var mtbf=null; if(sigs.length>=2){ var g=[]; for(var i=1;i<sigs.length;i++){ g.push((sigs[i]-sigs[i-1])/3600000); } mtbf=g.reduce(function(a,b){return a+b;},0)/g.length; }
    return { nbPannes:oms.length, mttr:mttr, mtbf:mtbf };
  }
  function mntRenderMTBF(){
    var machs=MNT_MACHINES.filter(function(m){ return MNT_MTBF_FILTER==='all' || m.activite===MNT_MTBF_FILTER || m.activite==='both'; });
    var rows='', sumMttr=0,nM=0,sumMtbf=0,nB=0,totP=0;
    machs.forEach(function(m){ var r=mntComputeMachine(m); totP+=r.nbPannes; if(r.mttr!=null){sumMttr+=r.mttr;nM++;} if(r.mtbf!=null){sumMtbf+=r.mtbf;nB++;}
      var etat = m.statut==='arret'?'<span style="color:#b91c1c;font-weight:700;">En panne</span>':(m.statut==='maintenance'?'<span style="color:#ca8a04;font-weight:700;">Maintenance</span>':'<span style="color:#16a34a;font-weight:700;">OK</span>');
      rows+='<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:9px 12px;font-weight:700;"><a onclick="mntFicheOpen(\\''+m.id+'\\')" style="color:#1e293b;cursor:pointer;text-decoration:underline;text-decoration-style:dotted;" title="Ouvrir la fiche 360">'+m.nom+'</a></td><td style="padding:9px 12px;text-align:center;font-size:.74rem;color:#64748b;">'+(m.activite||'')+'</td><td style="padding:9px 12px;text-align:center;">'+r.nbPannes+'</td><td style="padding:9px 12px;text-align:center;font-weight:700;color:#0d9488;">'+(r.mttr!=null?r.mttr.toFixed(1):'—')+'</td><td style="padding:9px 12px;text-align:center;font-weight:700;color:#6366f1;">'+(r.mtbf!=null?(r.mtbf>=48?(r.mtbf/24).toFixed(1)+' j':r.mtbf.toFixed(1)+' h'):'—')+'</td><td style="padding:9px 12px;text-align:center;">'+etat+'</td></tr>';
    });
    var tb=document.getElementById('mtbf-tbody'); if(tb) tb.innerHTML=rows||'<tr><td colspan="6" style="text-align:center;padding:20px;color:#cbd5e1;">Aucune machine</td></tr>';
    var gMttr= nM?(sumMttr/nM):null, gMtbf= nB?(sumMtbf/nB):null;
    var dispo= (gMttr!=null&&gMtbf!=null&&(gMttr+gMtbf)>0)? (gMtbf/(gMtbf+gMttr)*100):null;
    function kp(lbl,val,col){ return '<div style="background:white;border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid '+col+';text-align:center;"><div style="font-size:1.5rem;font-weight:800;color:'+col+';">'+val+'</div><div style="font-size:.7rem;color:#6b7280;font-weight:600;">'+lbl+'</div></div>'; }
    var k=document.getElementById('mtbf-kpis'); if(k) k.innerHTML= kp('MTTR moyen', gMttr!=null?gMttr.toFixed(1)+' h':'—','#0d9488') + kp('MTBF moyen', gMtbf!=null?(gMtbf/24).toFixed(1)+' j':'—','#6366f1') + kp('Disponibilité', dispo!=null?dispo.toFixed(1)+' %':'—','#16a34a') + kp('Total pannes', String(totP),'#ef4444');
  }
  // ── Pièces de rechange (PDR) ──
  function mntPdrSelect(machineId){
    var zone=document.getElementById('pdr_zone'), empty=document.getElementById('pdr_empty');
    if(!machineId){ if(zone)zone.style.display='none'; if(empty)empty.style.display='block'; return; }
    if(zone)zone.style.display='block'; if(empty)empty.style.display='none';
    var pcs=MNT_PIECES.filter(function(p){return String(p.machine_id)===String(machineId);});
    var rows=pcs.map(function(p){
      var low=(p.stock_actuel!=null&&p.stock_mini!=null&&Number(p.stock_actuel)<=Number(p.stock_mini)&&Number(p.stock_mini)>0);
      return '<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:8px 12px;font-weight:600;color:#1e293b;">'+(p.designation||'')+'</td><td style="padding:8px 12px;font-family:monospace;font-size:.72rem;color:#6b7280;">'+(p.reference||'—')+'</td><td style="padding:8px 12px;font-size:.76rem;color:#374151;">'+(p.fournisseur||'—')+'</td><td style="padding:8px 12px;text-align:center;font-size:.76rem;">'+(p.prix_unitaire!=null?Number(p.prix_unitaire).toFixed(2)+' €':'—')+'</td><td style="padding:8px 12px;text-align:center;'+(low?'color:#b91c1c;font-weight:700;':'')+'">'+(p.stock_actuel!=null?p.stock_actuel:0)+(p.stock_mini?(' / '+p.stock_mini):'')+(low?' ⚠':'')+'</td><td style="padding:8px 12px;font-size:.72rem;color:#64748b;">'+(p.emplacement||'—')+'</td><td style="padding:8px 12px;text-align:center;"><button onclick="mntPdrDelete(\\''+p.id+'\\')" style="background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.7rem;"><i class="fas fa-trash"></i></button></td></tr>';
    }).join('');
    var tb=document.getElementById('pdr_tbody'); if(tb) tb.innerHTML=rows||'<tr><td colspan="7" style="text-align:center;padding:18px;color:#cbd5e1;">Aucune pièce — ajoutez-en ci-dessus.</td></tr>';
    var c=document.getElementById('pdr_count'); if(c) c.textContent=pcs.length;
  }
  function mntPdrAdd(){
    var mid=document.getElementById('pdr_machine').value; if(!mid){ pushNotif('err','fa-exclamation-circle','Choisissez une machine.'); return; }
    function v(f){var e=document.getElementById(f);return e?e.value.trim():'';}
    var desig=v('pdr_desig'); if(!desig){ pushNotif('err','fa-exclamation-circle','Désignation requise.'); return; }
    var payload={ machine_id:mid, designation:desig, reference:v('pdr_ref'), fournisseur:v('pdr_fourn'), prix_unitaire:v('pdr_prix')||null, stock_actuel:v('pdr_stock')||0, stock_mini:v('pdr_mini')||0, emplacement:v('pdr_empl'), duree_vie_h:v('pdr_vie')||null, date_dernier_remplacement:v('pdr_dernier')||null };
    fetch('/api/maintenance/piece',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-plus','Pièce ajoutée.',3000); setTimeout(function(){ softReload(); },700); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  async function mntPdrDelete(id){ if(!await appConfirm('Supprimer cette pièce ?')) return; fetch('/api/maintenance/piece/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-trash','Pièce supprimée.',2500); setTimeout(function(){ softReload(); },600); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); }); }
  // ── Préventif (inchangé, démo) ──
  function mntGenererOM(machine,gamme){ pushNotif('ok','fa-clipboard-list','OM préventif créé pour '+machine+' — '+gamme,4000); mntShowTab('interventions'); }
  function mntSaveGamme(){ pushNotif('ok','fa-save','Gamme enregistrée.',4000); mntSwitchPP('planning'); }
  function mntDemandeIntervention(nom){ pushNotif('info','fa-phone','Coordonnées '+nom+' affichées.',4000); }
  // ── Plan préventif : heures de fonctionnement (BDT) + usure des pièces ──
  function _prevYearStart(){ return (new Date().getFullYear())+'-01-01'; }
  function prevHours(mid, sinceDate){ var arr=(MNT_BDT&&MNT_BDT[String(mid)])||[]; var s=0; arr.forEach(function(x){ if(!sinceDate || (x.d && x.d>=sinceDate)) s+=Number(x.h)||0; }); return s; }
  function prevFilter(){ var q=(document.getElementById('prev-search').value||'').toLowerCase(); document.querySelectorAll('#prev-mlist .prev-mitem').forEach(function(el){ el.style.display=(!q||(el.getAttribute('data-nom')||'').toLowerCase().indexOf(q)>=0)?'':'none'; }); }
  function prevSelect(el){
    document.querySelectorAll('#prev-mlist .prev-mitem').forEach(function(x){x.style.background='';});
    el.style.background='#fffbeb';
    var id=el.getAttribute('data-id'), nom=el.getAttribute('data-nom');
    document.getElementById('prev-empty').style.display='none';
    document.getElementById('prev-content').style.display='block';
    document.getElementById('prev-nom').textContent=nom;
    var yearH=prevHours(id,_prevYearStart()), totH=prevHours(id,null);
    document.getElementById('prev-h-year').textContent=Math.round(yearH)+' h';
    document.getElementById('prev-h-total').textContent=Math.round(totH)+' h';
    var pcs=MNT_PIECES.filter(function(p){return String(p.machine_id)===String(id) && p.remplacable!==false;});
    var alerts=0;
    var rows=pcs.map(function(p){
      var vie=(p.duree_vie_h!=null)?Number(p.duree_vie_h):null;
      var since = p.date_dernier_remplacement ? prevHours(id, p.date_dernier_remplacement) : totH;
      var remaining = (vie!=null)? (vie - since) : null;
      var pct = (vie!=null && vie>0)? Math.min(100, Math.max(0, since/vie*100)) : null;
      var barCol = pct==null?'#cbd5e1':(pct>=100?'#dc2626':(pct>=80?'#d97706':'#16a34a'));
      if(remaining!=null && remaining<=0) alerts++;
      var remTxt = (remaining==null)?'<span style="color:#cbd5e1;">durée de vie ?</span>':(remaining<=0?'<span style="color:#b91c1c;font-weight:800;">À REMPLACER</span>':('<span style="font-weight:700;color:'+(pct>=80?'#d97706':'#16a34a')+';">'+Math.round(remaining)+' h</span>'));
      return '<tr style="border-bottom:1px solid #f9fafb;">'
        +'<td style="padding:8px 12px;font-weight:600;color:#1e293b;">'+(p.designation||'')+'</td>'
        +'<td style="padding:8px 12px;font-family:monospace;font-size:.72rem;color:#6b7280;">'+(p.reference||'—')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;font-size:.76rem;">'+(vie!=null?Math.round(vie)+' h':'<button onclick="prevSetVie(\\''+p.id+'\\')" style="background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:.66rem;font-weight:700;">définir</button>')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;font-size:.72rem;color:#64748b;">'+(p.date_dernier_remplacement||'—')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;font-weight:700;color:#374151;">'+Math.round(since)+' h</td>'
        +'<td style="padding:8px 12px;text-align:center;">'+remTxt+'</td>'
        +'<td style="padding:8px 12px;">'+(pct==null?'<span style="color:#cbd5e1;font-size:.7rem;">—</span>':'<div style="background:#e2e8f0;border-radius:999px;height:7px;overflow:hidden;"><div style="height:100%;width:'+pct.toFixed(0)+'%;background:'+barCol+';"></div></div><div style="font-size:.6rem;color:#94a3b8;margin-top:2px;">'+pct.toFixed(0)+'%</div>')+'</td>'
        +'<td style="padding:8px 12px;text-align:center;white-space:nowrap;"><button onclick="prevRemplacer(\\''+p.id+'\\')" title="Marquer la pièce remplacée" style="background:#dcfce7;color:#15803d;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.7rem;font-weight:700;"><i class="fas fa-rotate"></i></button></td>'
        +'</tr>';
    }).join('');
    document.getElementById('prev-parts-tbody').innerHTML=rows||'<tr><td colspan="8" style="text-align:center;padding:18px;color:#cbd5e1;">Aucune pièce remplaçable — ajoutez-en dans « Pièces & PDR ».</td></tr>';
    document.getElementById('prev-alerts').textContent=alerts;
  }
  async function prevRemplacer(id){ if(!await appConfirm('Marquer cette pièce remplacée aujourd\\'hui ? Le compteur d\\'usure repart à zéro.')) return; var today=new Date().toISOString().slice(0,10); fetch('/api/maintenance/piece/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({date_dernier_remplacement:today})}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-rotate','Remplacement enregistré.',3000); setTimeout(function(){ softReload(); },700); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); }); }
  function prevSetVie(id){ var v=prompt('Durée de vie conseillée de la pièce, en heures de fonctionnement :',''); if(v===null) return; var n=parseFloat(String(v).replace(',','.')); if(!isFinite(n)||n<=0){ pushNotif('err','fa-exclamation-circle','Valeur invalide.'); return; } fetch('/api/maintenance/piece/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({duree_vie_h:n})}).then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-save','Durée de vie enregistrée.',3000); setTimeout(function(){ softReload(); },700); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); }); }
  // ── Fiche machine 360 ──
  function mntEur(n){ return (Number(n)||0).toLocaleString('fr-FR',{maximumFractionDigits:0})+' €'; }
  function mntFicheOpen(id){ mntShowTab('fiche'); var sel=document.getElementById('fiche_machine'); if(sel) sel.value=id; mntFicheRender(id); var p=document.getElementById('mnt-panel-fiche'); if(p) p.scrollIntoView({behavior:'smooth',block:'start'}); }
  // Deep-link depuis la maquette bâtiment : #machine=<id> ouvre directement la fiche 360.
  window.addEventListener('DOMContentLoaded',function(){ var mm=/machine=([^&]+)/.exec(location.hash||''); if(mm){ var id=decodeURIComponent(mm[1]); setTimeout(function(){ try{ mntFicheOpen(id); }catch(e){} },250); } });
  function mntFicheRender(id){
    var z=document.getElementById('fiche_zone'), e=document.getElementById('fiche_empty');
    if(!id){ if(z) z.innerHTML=''; if(e) e.style.display='block'; return; }
    var f=MNT_FICHE[String(id)];
    if(!f){ if(z) z.innerHTML=''; if(e) e.style.display='block'; return; }
    if(e) e.style.display='none';
    var stLbl=f.statut==='arret'?'En panne':(f.statut==='maintenance'?'En maintenance':'Opérationnel');
    function kpi(lbl,val,col,sub){ return '<div style="background:white;border-radius:12px;padding:13px 15px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid '+col+';"><div style="font-size:1.3rem;font-weight:800;color:'+col+';line-height:1.1;">'+val+'</div><div style="font-size:.67rem;color:#6b7280;font-weight:700;margin-top:3px;">'+lbl+'</div>'+(sub?'<div style="font-size:.61rem;color:#9ca3af;margin-top:1px;">'+sub+'</div>':'')+'</div>'; }
    var h='';
    h+='<div style="background:linear-gradient(135deg,#eab308,#ca8a04);border-radius:14px;padding:16px 20px;color:white;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">'
      +'<div><div style="font-size:1.15rem;font-weight:800;">'+(f.nom||'')+(f.code?' <span style="opacity:.7;font-size:.8rem;">('+f.code+')</span>':'')+'</div>'
      +'<div style="font-size:.72rem;opacity:.85;margin-top:2px;">Atelier '+(f.activite||'-')+' &middot; Année '+f.annee+'</div></div>'
      +'<div style="background:rgba(255,255,255,.18);border-radius:999px;padding:6px 14px;font-weight:700;font-size:.8rem;"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:'+(f.statut==='operationnel'?'#86efac':'#fecaca')+';margin-right:6px;"></span>'+stLbl+'</div></div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">'
      +kpi('TCO '+f.annee, mntEur(f.tcoAn), '#7c3aed', 'OPEX + maintenance')
      +kpi('OPEX annuel', mntEur(f.opexAnnuel), '#0d9488', f.taux?(f.taux.toFixed(1)+' €/h'):'taux n/a')
      +kpi('Maintenance '+f.annee, mntEur(f.maintAn), '#ef4444', f.nbOM+' OM ('+f.omOuverts+' ouverts)')
      +kpi('Coût absorbé prod.', mntEur(f.coutAbsorbeAn), '#2563eb', f.heuresAn+' h BDT × taux')
      +kpi('Valeur PDR stock', mntEur(f.pdrValeur), '#d97706', f.pdrCount+' pièces'+(f.pdrSousMini?(' · '+f.pdrSousMini+' sous mini'):''))
      +'</div>';
    h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:14px 0;">'
      +kpi('Disponibilité', f.dispo!=null?f.dispo.toFixed(1)+'%':'—', f.dispo==null?'#94a3b8':(f.dispo>=90?'#16a34a':(f.dispo>=75?'#d97706':'#ef4444')), 'MTBF/(MTBF+MTTR)')
      +kpi('TRS*', f.trs!=null?f.trs+'%':'—', f.trs==null?'#94a3b8':(f.trs>=85?'#16a34a':(f.trs>=65?'#d97706':'#ef4444')), 'Dispo × Qualité')
      +kpi('MTTR', f.mttr!=null?f.mttr.toFixed(1)+' h':'—', '#0d9488', 'réparation moy.')
      +kpi('MTBF', f.mtbf!=null?(f.mtbf>=48?(f.mtbf/24).toFixed(1)+' j':f.mtbf.toFixed(1)+' h'):'—', '#6366f1', 'entre pannes')
      +kpi('Pannes', String(f.nbPannes), '#ef4444', 'total OM')
      +kpi('Heures machine', f.heuresTot+' h', '#0ea5e9', 'temps machine (analyse DT)')
      +kpi('SPC cotes', f.ctrlN?(f.ctrlPct+'%'):'—', f.ctrlPct==null?'#94a3b8':(f.ctrlPct>=99?'#16a34a':'#d97706'), f.ctrlN+' relevés conf.')
      +'</div>';
    var hr=(f.hist||[]).map(function(x){
      var rc=(x.res==='nc'||x.res==='non_conforme')?'#b91c1c':((x.res==='solde'||x.res==='conforme')?'#16a34a':'#64748b');
      return '<tr style="border-bottom:1px solid #f9fafb;">'
        +'<td style="padding:7px 10px;font-size:.72rem;color:#64748b;white-space:nowrap;">'+(x.d||'—')+'</td>'
        +'<td style="padding:7px 10px;font-size:.76rem;font-weight:600;color:#1e293b;">'+(x.op||'—')+'</td>'
        +'<td style="padding:7px 10px;font-size:.74rem;color:#374151;">'+(x.piece||'—')+'</td>'
        +'<td style="padding:7px 10px;font-size:.72rem;color:#64748b;">'+(x.client||'—')+'</td>'
        +'<td style="padding:7px 10px;text-align:right;font-size:.74rem;font-weight:700;color:#0ea5e9;">'+(x.t!=null?x.t+' h':'—')+'</td>'
        +'<td style="padding:7px 10px;text-align:center;"><span style="color:'+rc+';font-size:.7rem;font-weight:700;">'+(x.res||'')+'</span></td></tr>';
    }).join('');
    var maintR=(f.omsList||[]).map(function(o){
      return '<tr style="border-bottom:1px solid #f9fafb;">'
        +'<td style="padding:7px 10px;font-size:.72rem;font-family:monospace;color:#6b7280;">'+(o.num||'')+'</td>'
        +'<td style="padding:7px 10px;font-size:.74rem;color:#374151;">'+(o.titre||o.type||'—')+'</td>'
        +'<td style="padding:7px 10px;font-size:.72rem;color:#64748b;white-space:nowrap;">'+(o.d||'—')+'</td>'
        +'<td style="padding:7px 10px;text-align:right;font-size:.74rem;font-weight:700;color:#ef4444;">'+(o.cout!=null?mntEur(o.cout):'—')+'</td></tr>';
    }).join('');
    h+='<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:14px;align-items:start;">';
    h+='<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">'
      +'<div style="padding:11px 16px;font-weight:800;color:#111827;font-size:.84rem;border-bottom:1px solid #f1f5f9;"><i class="fas fa-route" style="color:#0ea5e9;margin-right:6px;"></i>Historique de production <span style="color:#9ca3af;font-weight:600;font-size:.72rem;">(ce qui est passé sur la machine)</span></div>'
      +'<div style="overflow-x:auto;max-height:360px;overflow-y:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;position:sticky;top:0;"><th style="text-align:left;padding:7px 10px;font-size:.6rem;text-transform:uppercase;color:#6b7280;">Date</th><th style="text-align:left;padding:7px 10px;font-size:.6rem;text-transform:uppercase;color:#6b7280;">Opération</th><th style="text-align:left;padding:7px 10px;font-size:.6rem;text-transform:uppercase;color:#6b7280;">Pièce</th><th style="text-align:left;padding:7px 10px;font-size:.6rem;text-transform:uppercase;color:#6b7280;">Client</th><th style="text-align:right;padding:7px 10px;font-size:.6rem;text-transform:uppercase;color:#6b7280;">Temps</th><th style="text-align:center;padding:7px 10px;font-size:.6rem;text-transform:uppercase;color:#6b7280;">Rés.</th></tr></thead><tbody>'+(hr||'<tr><td colspan="6" style="text-align:center;padding:20px;color:#cbd5e1;font-size:.78rem;">Aucun passage enregistré (historique BDT machine vide).</td></tr>')+'</tbody></table></div></div>';
    h+='<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">'
      +'<div style="padding:11px 16px;font-weight:800;color:#111827;font-size:.84rem;border-bottom:1px solid #f1f5f9;"><i class="fas fa-screwdriver-wrench" style="color:#ef4444;margin-right:6px;"></i>Maintenance <span style="color:#9ca3af;font-weight:600;font-size:.72rem;">('+mntEur(f.maintTot)+' cumul)</span></div>'
      +'<div style="overflow-x:auto;max-height:360px;overflow-y:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;position:sticky;top:0;"><th style="text-align:left;padding:7px 10px;font-size:.6rem;text-transform:uppercase;color:#6b7280;">OM</th><th style="text-align:left;padding:7px 10px;font-size:.6rem;text-transform:uppercase;color:#6b7280;">Intervention</th><th style="text-align:left;padding:7px 10px;font-size:.6rem;text-transform:uppercase;color:#6b7280;">Date</th><th style="text-align:right;padding:7px 10px;font-size:.6rem;text-transform:uppercase;color:#6b7280;">Coût</th></tr></thead><tbody>'+(maintR||'<tr><td colspan="4" style="text-align:center;padding:20px;color:#cbd5e1;font-size:.78rem;">Aucune intervention.</td></tr>')+'</tbody></table></div></div>';
    h+='</div>';
    h+='<div style="font-size:.66rem;color:#9ca3af;margin-top:12px;line-height:1.5;"><i class="fas fa-circle-info" style="margin-right:4px;"></i>Heures machine = temps machine uniquement, dérivé de la gamme (analyse DT). TCO = OPEX annuel (machines_opex) + maintenance annuelle (ordres_maintenance) ; coût absorbé = heures machine × taux horaire (indicateur de charge, hors TCO). * TRS partiel = Disponibilité × Qualité ; Performance (cadence théorique) non encore mesurée.</div>';
    z.innerHTML=h;
  }
  (function(){ var fs={}; MNT_PIECES.forEach(function(p){ if(p.fournisseur) fs[p.fournisseur]=1; }); var dl=document.createElement('datalist'); dl.id='pdr-fourn-list'; Object.keys(fs).forEach(function(f){ var o=document.createElement('option'); o.value=f; dl.appendChild(o); }); document.body.appendChild(dl); try{ mntRenderMTBF(); }catch(e){} })();

  // Onglet initial : tous les panneaux sont rendus en display:none — sans cet appel la page s'ouvre VIDE.
  // Honore le hash (#preventif, #postes, …) sinon Interventions (= activeId du serviceHeader).
  (function(){ try{ var h=(location.hash||'').replace('#',''); mntShowTab(MNT_TABS.indexOf(h)>=0?h:'interventions'); }catch(e){} })();
  </script>

  <style>
  .mnt-sub-tab{padding:7px 14px;border:none;border-radius:8px;background:transparent;color:#64748b;font-size:.76rem;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:5px;}
  .mnt-sub-tab i{font-size:.65rem;}
  .mnt-sub-active{background:white;color:${YEL_D};font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.1);}
  .mnt-f-btn{padding:5px 12px;border:none;border-radius:6px;background:transparent;color:#64748b;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .15s;text-transform:capitalize;}
  .mnt-f-active{background:${YEL};color:white !important;font-weight:700;}
  </style>`

  return layout('Service Maintenance – GMAO', content + demandeAchatModal('Maintenance', '#f97316'), 'service-maintenance')
}
