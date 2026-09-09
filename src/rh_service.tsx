// ══════════════════════════════════════════════════════════════
// SERVICE RH — GMAO RH v2.0
// Gestion unifiée : Employés · Habilitations · Compétences · Temps
// ══════════════════════════════════════════════════════════════
import { escX, layout, demandeAchatModal, validationCheckbox, buildValDirMap, valDirBadge } from './shared'
import type { Employe, Certification, CompetenceOperateur, Pointage } from './types'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

const INDIGO   = '#6366f1'
const INDIGO_D = '#4f46e5'
const TODAY    = new Date().toISOString().slice(0, 10)

// ─── DEMO DATA ────────────────────────────────────────────────

const EMPLOYES_DEFAULT: Employe[] = []

const CERTS_DEFAULT: Certification[] = []

// Compétences : [op, emp_id, activite, niveau]
const MATRIX_OPS = ['Tronçonnage','Usinage CN','Ébavurage','Thermocollage','Oxydation anodique','Poinçonnage / Laser','Pliage','Soudure TIG/MIG/MAG','Montage','Sérigraphie','Emballage']
const MATRIX_EMPS = [
  { id:'emp1', initiales:'A.D', nom:'Dupont A.',  act:'Seem' },
  { id:'emp2', initiales:'K.B', nom:'Benali K.',  act:'Seem' },
  { id:'emp3', initiales:'I.R', nom:'Renard I.',  act:'Seem' },
  { id:'emp8', initiales:'F.G', nom:'Gautier F.', act:'Seem' },
  { id:'emp4', initiales:'M.T', nom:'Tessier M.', act:'Semrac' },
  { id:'emp5', initiales:'S.L', nom:'Laurent S.', act:'Semrac' },
  { id:'emp6', initiales:'J.M', nom:'Martin J.',  act:'Semrac' },
  { id:'emp7', initiales:'N.K', nom:'Khelifa N.', act:'Semrac' },
]
// niveau par opération × employé (dans l'ordre MATRIX_EMPS)
const MATRIX_LEVELS: number[][] = [
  [3,2,0,3, 0,0,0,0], // Tronçonnage
  [3,3,0,3, 0,0,0,0], // Usinage CN
  [2,2,2,2, 2,2,1,2], // Ébavurage
  [0,0,3,0, 0,0,0,0], // Thermocollage
  [0,0,2,0, 0,0,0,0], // Oxydation anodique
  [0,0,0,0, 3,1,0,0], // Poinçonnage / Laser
  [0,0,0,0, 2,3,0,1], // Pliage
  [0,0,0,0, 0,0,3,1], // Soudure TIG/MIG/MAG
  [0,0,0,0, 1,2,2,3], // Montage
  [0,0,0,0, 1,1,0,2], // Sérigraphie
  [2,1,2,2, 2,2,1,2], // Emballage
]

const POINTAGES_DEFAULT: Pointage[] = []

// ─── HELPERS ──────────────────────────────────────────────────

function kpi(icon: string, label: string, val: string, color: string, sub = '') {
  return `<div style="background:white;border-radius:14px;padding:18px 20px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.04);border-top:3px solid ${color};">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div style="width:36px;height:36px;border-radius:10px;background:${color}20;display:flex;align-items:center;justify-content:center;color:${color};font-size:.95rem;flex-shrink:0;"><i class="fas ${icon}"></i></div>
      <span style="font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;">${label}</span>
    </div>
    <div style="font-size:1.7rem;font-weight:800;color:#111827;">${val}</div>
    ${sub ? `<div style="font-size:.7rem;color:#9ca3af;margin-top:4px;">${sub}</div>` : ''}
  </div>`
}

function certBadge(statut: string) {
  if (statut === 'valide')       return `<span style="background:#dcfce7;color:#16a34a;border:1px solid #86efac;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;">Valide</span>`
  if (statut === 'expire')       return `<span style="background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;">Expiré</span>`
  if (statut === 'a_renouveler') return `<span style="background:#fffbeb;color:#d97706;border:1px solid #fde68a;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;">À renouveler</span>`
  return `<span style="background:#f1f5f9;color:#64748b;border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;">${statut}</span>`
}

function typeCertBadge(type: string) {
  const m: Record<string,string> = { habilitation:'#3b82f6', diplome:'#8b5cf6', certification:'#06b6d4', formation:'#10b981' }
  const c = m[type] ?? '#6b7280'
  return `<span style="background:${c}15;color:${c};border:1px solid ${c}40;border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:700;">${type}</span>`
}

function ptStatutBadge(statut: string) {
  if (statut === 'valide')   return `<span style="background:#dcfce7;color:#16a34a;border-radius:999px;padding:2px 9px;font-size:.68rem;font-weight:700;"><i class="fas fa-check" style="margin-right:3px;"></i>Validé</span>`
  if (statut === 'corrige')  return `<span style="background:#fffbeb;color:#d97706;border-radius:999px;padding:2px 9px;font-size:.68rem;font-weight:700;"><i class="fas fa-edit" style="margin-right:3px;"></i>Corrigé</span>`
  return `<span style="background:#f1f5f9;color:#64748b;border-radius:999px;padding:2px 9px;font-size:.68rem;font-weight:700;"><i class="fas fa-clock" style="margin-right:3px;"></i>En cours</span>`
}

function activiteBadge(a: string | undefined) {
  if (!a) return ''
  const m: Record<string,string> = { Seem:'#3b82f6', Semrac:'#ec4899', both:'#8b5cf6', ST:'#f59e0b' }
  return `<span style="background:${m[a]??'#6b7280'}20;color:${m[a]??'#6b7280'};border-radius:6px;padding:1px 8px;font-size:.68rem;font-weight:700;">${a}</span>`
}

function niveauCell(n: number, op: string, empIdx: number) {
  const styles: string[] = [
    'background:#f8fafc;color:#94a3b8;',
    'background:#fef9c3;color:#ca8a04;',
    'background:#dcfce7;color:#16a34a;',
    'background:#dbeafe;color:#1d4ed8;',
  ]
  const labels = ['—','★','★★','★★★']
  const opKey = op.replace(/[^a-zA-Z]/g,'')
  return `<td style="padding:6px;text-align:center;"><div class="rh-matrix-cell" id="cell_${opKey}_${empIdx}" style="${styles[n]}border-radius:6px;padding:4px 8px;font-weight:700;font-size:.82rem;cursor:pointer;" onclick="rhUpdateNiveau('${opKey}',${empIdx},${n})">${labels[n]}</div></td>`
}

const TH = 'style="padding:9px 12px;text-align:left;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;border-bottom:1.5px solid #f1f5f9;"'
const TD = 'style="padding:10px 12px;font-size:.8rem;color:#374151;border-bottom:1px solid #f9fafb;"'

// ─── PANEL: DASHBOARD ─────────────────────────────────────────

function panelDashboard(emps: Employe[], certs: Certification[], pts: Pointage[], conges: any[] = []) {
  const actifs = emps.filter(e => e.statut === 'actif').length
  const absToday = pts.filter(p => p.type === 'conge' || p.type === 'maladie').length
  const expired  = certs.filter(c => c.statut === 'expire').length
  const toRenew  = certs.filter(c => c.statut === 'a_renouveler').length
  const masseSal = emps.reduce((s,e) => s + (e.taux_horaire ?? 0) * 151.67, 0)
  const seem   = emps.filter(e => e.activite === 'Seem').length
  const semrac = emps.filter(e => e.activite === 'Semrac').length
  const admin  = emps.filter(e => e.activite === 'both' || (!e.activite)).length
  const totalH = pts.reduce((s,p) => s + (p.heures_travaillees ?? 0), 0)

  const alertCerts = certs.filter(c => c.statut !== 'valide').slice(0,5)

  return `
  <div style="padding:24px;display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:8px;">
    ${kpi('fa-users','Effectif actif', String(actifs), INDIGO, `${seem} Seem · ${semrac} Semrac · ${admin} Admin`)}
    ${kpi('fa-umbrella-beach','Absences aujourd\'hui', String(absToday), '#f59e0b', 'congés & arrêts maladie')}
    ${kpi('fa-times-circle','Habilit. expirées', String(expired), '#ef4444', 'action requise urgente')}
    ${kpi('fa-exclamation-triangle','À renouveler ≤30j', String(toRenew), '#f59e0b', 'surveiller les échéances')}
    ${kpi('fa-euro-sign','Masse salariale / mois', Math.round(masseSal).toLocaleString('fr-FR') + ' €', '#10b981', 'estimation brut chargé')}
  </div>

  <div style="padding:0 24px 24px;display:grid;grid-template-columns:1fr 1fr;gap:20px;">
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
      <div style="font-size:.72rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px;"><i class="fas fa-exclamation-triangle" style="color:#f59e0b;margin-right:6px;"></i>Habilitations à surveiller</div>
      ${alertCerts.length === 0
        ? `<div style="color:#10b981;font-size:.82rem;text-align:center;padding:20px;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>Toutes les habilitations sont valides</div>`
        : `<table style="width:100%;border-collapse:collapse;">
        <tr><th ${TH}>Employé</th><th ${TH}>Habilitation</th><th ${TH}>Expiration</th><th ${TH}>Statut</th></tr>
        ${alertCerts.map(c => `<tr>
          <td ${TD}>${escX(c.employe_nom ?? '—')}</td>
          <td ${TD}><span style="font-weight:600;">${escX(c.intitule)}</span>${c.critique ? ' <span style="color:#ef4444;font-size:.65rem;">⚠️ CRITIQUE</span>' : ''}</td>
          <td ${TD}>${c.date_expiration ?? 'Sans date'}</td>
          <td ${TD}>${certBadge(c.statut)}</td>
        </tr>`).join('')}
      </table>`
      }
    </div>

    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
      <div style="font-size:.72rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;margin-bottom:14px;"><i class="fas fa-clock" style="color:${INDIGO};margin-right:6px;"></i>Pointages du jour — ${TODAY}</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><th ${TH}>Employé</th><th ${TH}>Arrivée</th><th ${TH}>Départ</th><th ${TH}>Heures</th><th ${TH}>Statut</th></tr>
        ${pts.map(p => `<tr>
          <td ${TD}><span style="font-weight:600;">${escX(p.employe_nom)}</span></td>
          <td ${TD}>${p.heure_arrivee ?? '—'}</td>
          <td ${TD}>${p.heure_depart ?? '<span style="color:#3b82f6;font-weight:600;">En cours</span>'}</td>
          <td ${TD}>${p.heures_travaillees ? p.heures_travaillees.toFixed(2) + ' h' : '—'}</td>
          <td ${TD}>${ptStatutBadge(p.statut)}</td>
        </tr>`).join('')}
        <tr style="background:#f8fafc;">
          <td ${TD} colspan="3"><strong>Total journée</strong></td>
          <td ${TD}><strong>${totalH.toFixed(2)} h</strong></td>
          <td ${TD}></td>
        </tr>
      </table>
    </div>
  </div>`
}

// ─── PANEL: EMPLOYÉS ──────────────────────────────────────────

// Services de l'ERP — même liste que MENU_SERVICES dans auth.ts.
const RH_SERVICES: Record<string,string> = {
  commercial: 'Commercial', be: "Bureau d'Études", achats: 'Achats', production: 'Production',
  oas: 'OAS', qualite: 'Qualité', securite: 'Sécurité', environnement: 'Environnement',
  expeditions: 'Expéditions', stock: 'Stock', maintenance: 'Maintenance', plans: 'Plan / Bâtiment',
  rh: 'RH', compta: 'Comptabilité', direction: 'Direction',
}

const RH_ROLE_LABELS: Record<string,string> = { operateur:'Opérateur', oas:'OAS (opérateur)', qualite:'Qualité', commercial:'Commercial', bei:'Bureau d\'Études', achats:'Achats', logistique:'Logistique', production:'Production', comptable:'Comptable', maintenance:'Maintenance', rh:'RH', direction:'Direction' }
function roleBadge(role: string, entite?: string) {
  const r = role || 'operateur'
  if (r === 'operateur') {
    const col = entite === 'Semrac' ? '#ec4899' : '#3b82f6'
    return `<span style="background:${col}18;color:${col};border-radius:6px;padding:2px 8px;font-size:.66rem;font-weight:700;">Opérateur ${entite || ''}</span>`
  }
  if (r === 'oas') {
    return `<span style="background:#06b6d418;color:#0e7490;border-radius:6px;padding:2px 8px;font-size:.66rem;font-weight:700;">OAS ${entite || ''}</span>`
  }
  if (r === 'qualite') {
    return `<span style="background:#7c3aed18;color:#6d28d9;border-radius:6px;padding:2px 8px;font-size:.66rem;font-weight:700;">Qualité</span>`
  }
  return `<span style="background:#ede9fe;color:#5b21b6;border-radius:6px;padding:2px 8px;font-size:.66rem;font-weight:700;">${RH_ROLE_LABELS[r] || r}</span>`
}
function panelEmployes(emps: Employe[], vdMap: Record<string, any> = {}) {
  const shiftLabel: Record<string,string> = { matin:'Matin 6h-14h', apmidi:'Après-midi 14h-22h', journee:'Journée 7h-17h', soir:'Nuit' }
  const isOpRole = (r: string) => r === 'operateur' || r === 'oas'   // l'OAS est un opérateur (présence/planning)
  const opsSeem = emps.filter(e => isOpRole((e as any).role) && e.activite === 'Seem')
  const opsSemrac = emps.filter(e => isOpRole((e as any).role) && e.activite === 'Semrac')
  const supports = emps.filter(e => !isOpRole((e as any).role))
  const empRow = (e: any) => `<tr class="emp-row" data-cat="${isOpRole(e.role)?('op-'+(e.activite||'')):'support'}" data-nom="${escX((e.nom+' '+(e.prenom??'')).toLowerCase())}" style="transition:background .15s;cursor:pointer;" onclick="rhOpenFiche('${e.id}')" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
      <td ${TD}><span style="font-family:monospace;font-size:.75rem;color:#6b7280;">${escX(e.matricule ?? e.id ?? '—')}</span></td>
      <td ${TD}><div style="font-weight:700;color:#111827;">${escX(e.nom)} ${escX(e.prenom ?? '')}</div><div style="font-size:.68rem;color:#9ca3af;">${escX(e.email ?? '')}</div></td>
      <td ${TD}>${roleBadge(e.role, e.activite)}</td>
      <td ${TD}>${escX(e.poste ?? '—')}</td>
      <td ${TD}><span style="background:#f1f5f9;border-radius:6px;padding:2px 8px;font-size:.72rem;font-weight:600;">${escX(e.type_contrat ?? 'CDI')}</span></td>
      <td ${TD}><span style="font-size:.72rem;color:#6b7280;">${escX(shiftLabel[e.shift_id ?? ''] ?? e.shift_id ?? '—')}</span></td>
      <td ${TD} style="text-align:center;">${e.has_pin ? '<i class="fas fa-key" style="color:#16a34a;" title="Identifiant ERP actif"></i>' : '<i class="fas fa-key" style="color:#cbd5e1;" title="Pas de code PIN"></i>'}</td>
      <td ${TD}><div style="display:flex;flex-direction:column;gap:3px;align-items:flex-start;"><span style="background:${e.statut==='actif'?'#dcfce7':'#fee2e2'};color:${e.statut==='actif'?'#16a34a':'#b91c1c'};border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;">${e.statut}</span>${valDirBadge(vdMap,'salaries',e.id)}</div></td>
      <td ${TD} style="text-align:center;white-space:nowrap;">
        <button onclick="event.stopPropagation();rhOpenFiche('${e.id}')" style="padding:4px 10px;background:#eef2ff;color:#4338ca;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;margin-right:4px;"><i class="fas fa-folder-open"></i> Fiche</button>
        <button onclick="event.stopPropagation();rhDeleteEmp('${e.id}','${((e.nom||'')+' '+(e.prenom||'')).trim().replace(/'/g,"\\'")}')" style="padding:4px 10px;background:#fef2f2;color:#b91c1c;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;" title="Supprimer ce salarié"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`
  const section = (title: string, icon: string, col: string, list: any[]) => list.length === 0 ? '' : `
    <div style="display:flex;align-items:center;gap:8px;margin:18px 0 8px;"><i class="fas ${icon}" style="color:${col};"></i><span style="font-weight:800;color:#111827;font-size:.88rem;">${title}</span><span style="background:${col}18;color:${col};border-radius:999px;padding:1px 9px;font-size:.68rem;font-weight:800;">${list.length}</span></div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;margin-bottom:8px;"><table style="width:100%;border-collapse:collapse;">
      <thead><tr><th ${TH}>ID / Matricule</th><th ${TH}>Nom Prénom</th><th ${TH}>Rôle</th><th ${TH}>Poste</th><th ${TH}>Contrat</th><th ${TH}>Shift</th><th ${TH} style="text-align:center;">ERP</th><th ${TH}>Statut</th><th ${TH} style="text-align:center;">Action</th></tr></thead>
      <tbody>${list.map(empRow).join('')}</tbody></table></div>`
  return `
  <div style="padding:20px 24px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #f1f5f9;flex-wrap:wrap;">
    <div style="font-size:.95rem;font-weight:800;color:#111827;"><i class="fas fa-users" style="color:${INDIGO};margin-right:8px;"></i>Effectif (${emps.length})</div>
    <div style="margin-left:auto;position:relative;">
      <i class="fas fa-search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:.8rem;"></i>
      <input id="rhSearchEmpInput" type="text" placeholder="Rechercher…" oninput="rhSearchEmp(this.value)" style="padding:7px 12px 7px 30px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.78rem;width:200px;"/>
    </div>
    <button onclick="rhOpenFiche('')" style="padding:8px 18px;border-radius:9px;background:linear-gradient(135deg,${INDIGO},${INDIGO_D});color:white;border:none;cursor:pointer;font-size:.8rem;font-weight:700;"><i class="fas fa-user-plus" style="margin-right:6px;"></i>Nouvel employé</button>
  </div>
  <div style="padding:12px 24px 24px;">
    ${section('Opérateurs Seem','fa-cog','#3b82f6',opsSeem)}
    ${section('Opérateurs Semrac','fa-cog','#ec4899',opsSemrac)}
    ${section('Fonctions support','fa-briefcase','#8b5cf6',supports)}
    ${emps.length===0?'<div style="text-align:center;padding:40px;color:#9ca3af;">Aucun salarié. Cliquez « Nouvel employé ».</div>':''}
  </div>`
}

// ─── PANEL: HABILITATIONS ─────────────────────────────────────

function panelHabilitations(certs: Certification[], emps: Employe[] = []) {
  const urgents = certs.filter(c => c.statut !== 'valide')
  const empOptions = emps.map(e => `<option value="${e.id}">${escX((`${e.prenom ?? ''} ${e.nom ?? ''}`).trim() || e.nom)}</option>`).join('')
  const empSelect = `<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Salarié *</label>
    <select id="cert_emp" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;color:#374151;background:#f8fafc;outline:none;">
    <option value="">— Choisir un salarié —</option>${empOptions}</select></div>`
  return `
  <div style="padding:20px 24px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #f1f5f9;">
    <button class="rh-sub-cert" onclick="rhSwitchSub('cert',0)" style="padding:7px 16px;border-radius:8px;border:1.5px solid #6366f1;background:#6366f1;color:white;cursor:pointer;font-size:.78rem;font-weight:700;"><i class="fas fa-list" style="margin-right:6px;"></i>Vue d'ensemble</button>
    <button class="rh-sub-cert" onclick="rhSwitchSub('cert',1)" style="padding:7px 16px;border-radius:8px;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;font-size:.78rem;font-weight:600;"><i class="fas fa-exclamation-triangle" style="margin-right:6px;color:#f59e0b;"></i>Alertes (${urgents.length})</button>
    <button class="rh-sub-cert" onclick="rhResetCertForm();rhSwitchSub('cert',2)" style="padding:7px 16px;border-radius:8px;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;font-size:.78rem;font-weight:600;"><i class="fas fa-plus" style="margin-right:6px;"></i>Ajouter</button>
  </div>

  <div class="rh-sub-panel-cert" style="padding:20px 24px;">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
      <button class="rh-f-btn" style="background:#6366f1;color:white;border-color:#6366f1;" onclick="rhFilterCert('tous',this)">Toutes (${certs.length})</button>
      <button class="rh-f-btn" onclick="rhFilterCert('habilitation',this)">Habilitations</button>
      <button class="rh-f-btn" onclick="rhFilterCert('certification',this)">Certifications</button>
      <button class="rh-f-btn" onclick="rhFilterCert('diplome',this)">Diplômes</button>
      <button class="rh-f-btn" onclick="rhFilterCert('formation',this)">Formations</button>
    </div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;">
    <table id="certTable" style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th ${TH}>Employé</th><th ${TH}>Type</th><th ${TH}>Intitulé</th><th ${TH}>Organisme</th>
        <th ${TH}>Obtention</th><th ${TH}>Expiration</th><th ${TH}>Statut</th><th ${TH}>Critique</th><th ${TH}>Actions</th>
      </tr></thead>
      <tbody>
        ${certs.length ? certs.map(c => `<tr class="cert-row" data-type="${c.type}" style="transition:background .15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
          <td ${TD}><span style="font-weight:600;">${escX(c.employe_nom ?? '—')}</span></td>
          <td ${TD}>${typeCertBadge(c.type)}</td>
          <td ${TD}>${escX(c.intitule)}</td>
          <td ${TD}><span style="font-size:.75rem;color:#6b7280;">${escX(c.organisme ?? '—')}</span></td>
          <td ${TD}><span style="font-size:.75rem;">${c.date_obtention ?? '—'}</span></td>
          <td ${TD}><span style="font-size:.75rem;${c.statut !== 'valide' ? 'color:#ef4444;font-weight:700;' : ''}">${c.date_expiration ?? 'Illimitée'}</span></td>
          <td ${TD}>${certBadge(c.statut)}</td>
          <td ${TD}>${c.critique ? '<span style="color:#ef4444;font-weight:700;font-size:.8rem;">⚠️ OUI</span>' : '<span style="color:#94a3b8;font-size:.75rem;">Non</span>'}</td>
          <td ${TD}><div style="display:flex;gap:5px;white-space:nowrap;"><button onclick="rhEditCert('${c.id}')" title="Modifier" style="width:28px;height:28px;border-radius:7px;border:1px solid #c7d2fe;background:#eef2ff;color:#4338ca;cursor:pointer;"><i class="fas fa-pen"></i></button><button onclick="rhSupprimerCert('${c.id}')" title="Supprimer" style="width:28px;height:28px;border-radius:7px;border:1px solid #fca5a5;background:#fef2f2;color:#b91c1c;cursor:pointer;"><i class="fas fa-trash"></i></button></div></td>
        </tr>`).join('') : `<tr><td colspan="9" style="text-align:center;padding:36px;color:#9ca3af;font-size:.83rem;"><i class="fas fa-certificate" style="font-size:1.6rem;display:block;margin-bottom:8px;opacity:.3;"></i>Aucune habilitation enregistrée — utilisez l'onglet « Ajouter » pour en déclarer une (rattachée à un salarié).</td></tr>`}
      </tbody>
    </table>
    </div>
  </div>

  <div class="rh-sub-panel-cert" style="padding:20px 24px;display:none;">
    ${urgents.length === 0
      ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:24px;text-align:center;color:#16a34a;font-weight:700;"><i class="fas fa-check-circle" style="font-size:1.5rem;display:block;margin-bottom:8px;"></i>Aucune alerte — toutes les habilitations sont valides</div>`
      : `
      ${certs.filter(c=>c.statut==='expire').length > 0 ? `
      <div style="margin-bottom:20px;">
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:14px 18px;margin-bottom:10px;font-weight:700;color:#dc2626;font-size:.82rem;"><i class="fas fa-times-circle" style="margin-right:8px;"></i>Habilitations EXPIRÉES — Action immédiate requise</div>
        ${certs.filter(c=>c.statut==='expire').map(c => `
        <div style="background:white;border-radius:10px;border:1.5px solid #fca5a5;padding:14px 18px;margin-bottom:8px;display:flex;align-items:center;gap:16px;">
          <div style="flex:1;"><div style="font-weight:700;font-size:.85rem;">${escX(c.employe_nom)} — ${escX(c.intitule)}</div><div style="font-size:.72rem;color:#6b7280;margin-top:2px;">Organisme: ${escX(c.organisme ?? '—')} · Expirée le: ${c.date_expiration ?? 'N/A'}</div></div>
          ${c.critique ? '<span style="background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:3px 10px;font-size:.7rem;font-weight:700;">CRITIQUE</span>' : ''}
          <button onclick="rhRenouvelerCert('${c.id}','${(c.employe_nom??'').replace(/'/g,"\\'")}')" style="padding:6px 14px;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;font-size:.75rem;font-weight:700;">Renouveler</button>
        </div>`).join('')}
      </div>` : ''}
      ${certs.filter(c=>c.statut==='a_renouveler').length > 0 ? `
      <div>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 18px;margin-bottom:10px;font-weight:700;color:#d97706;font-size:.82rem;"><i class="fas fa-exclamation-triangle" style="margin-right:8px;"></i>À renouveler prochainement</div>
        ${certs.filter(c=>c.statut==='a_renouveler').map(c => `
        <div style="background:white;border-radius:10px;border:1.5px solid #fde68a;padding:14px 18px;margin-bottom:8px;display:flex;align-items:center;gap:16px;">
          <div style="flex:1;"><div style="font-weight:700;font-size:.85rem;">${escX(c.employe_nom)} — ${escX(c.intitule)}</div><div style="font-size:.72rem;color:#6b7280;margin-top:2px;">Organisme: ${escX(c.organisme ?? '—')} · Expire le: ${c.date_expiration ?? 'N/A'}</div></div>
          ${c.critique ? '<span style="background:#fffbeb;color:#d97706;border:1px solid #fde68a;border-radius:6px;padding:3px 10px;font-size:.7rem;font-weight:700;">CRITIQUE</span>' : ''}
          <button onclick="rhRenouvelerCert('${c.id}','${(c.employe_nom??'').replace(/'/g,"\\'")}')" style="padding:6px 14px;background:#f59e0b;color:white;border:none;border-radius:8px;cursor:pointer;font-size:.75rem;font-weight:700;">Renouveler</button>
        </div>`).join('')}
      </div>` : ''}
    `}
  </div>

  <div class="rh-sub-panel-cert" style="padding:20px 24px;display:none;">
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:28px;max-width:760px;">
      <div style="font-size:.85rem;font-weight:800;color:#111827;margin-bottom:20px;"><i class="fas fa-certificate" style="color:${INDIGO};margin-right:8px;"></i><span id="cert_form_title">Ajouter une habilitation / certification</span></div>
      <input type="hidden" id="cert_edit_id" value=""/>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        ${empSelect}
        ${fldSel('Type *','cert_type',['habilitation','diplome','certification','formation'])}
        <div style="grid-column:1/-1;">${fld('Intitulé *','text','cert_intitule')}</div>
        ${fld('Organisme','text','cert_org')} ${fld('Date obtention','date','cert_obtention')}
        ${fld('Date expiration','date','cert_expiration')}
        <div style="display:flex;align-items:center;gap:10px;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;">
          <input type="checkbox" id="cert_critique" style="width:16px;height:16px;accent-color:${INDIGO};"/>
          <label for="cert_critique" style="font-size:.82rem;font-weight:600;color:#374151;">Habilitation critique (EN 9100)</label>
        </div>
        <div style="grid-column:1/-1;">${fldArea('Notes','cert_notes')}</div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:20px;">
        <button onclick="rhSauvegarderCert()" style="padding:9px 24px;border-radius:10px;background:linear-gradient(135deg,${INDIGO},${INDIGO_D});color:white;border:none;cursor:pointer;font-size:.83rem;font-weight:700;"><i class="fas fa-save" style="margin-right:6px;"></i><span id="cert_form_btn">Enregistrer</span></button>
      </div>
    </div>
  </div>`
}

// ─── PANEL: MATRICE COMPÉTENCES ───────────────────────────────

type MatriceEmp = { id: string; nom: string; initiales: string; act: string; poste?: string }
type MatriceOp  = { code: string; nom: string; activite?: string }

function buildEmpsForMatrix(emps?: Employe[]): MatriceEmp[] {
  if (!emps || emps.length === 0) return [] as any   // pas de données démo : matrice vide si aucun salarié
  // On garde les opérateurs de production actifs (Seem / Semrac / les deux)
  return emps
    .filter(e => e.statut === 'actif' && (e.activite === 'Seem' || e.activite === 'Semrac' || e.activite === 'both'))
    .map(e => {
      const nomComplet = `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() || e.nom || e.id
      const initiales = (e.prenom ? e.prenom.charAt(0) : nomComplet.charAt(0)) + '.' + (e.nom ? e.nom.charAt(0) : '')
      return { id: e.id, nom: nomComplet, initiales: initiales.toUpperCase(), act: e.activite || 'Seem', poste: e.poste }
    })
}

function buildOpsForMatrix(processes?: any[]): MatriceOp[] {
  if (!processes || processes.length === 0) {
    // Fallback : la liste statique historique
    return MATRIX_OPS.map(op => ({ code: op, nom: op }))
  }
  return processes.map((p: any) => ({ code: String(p.id || p.code || p.nom), nom: String(p.nom || p.code || p.id), activite: p.activite }))
}

function panelMatrice(emps?: Employe[], comps?: CompetenceOperateur[], processes?: any[]) {
  const EMPS = buildEmpsForMatrix(emps)
  const OPS  = buildOpsForMatrix(processes)
  // Indexe les niveaux courants : { 'salarieId|opCode': niveau } (colonne DB = salarie_id)
  const lvlMap: Record<string, number> = {}
  ;(comps ?? []).forEach((c: any) => {
    const sid = c.salarie_id ?? c.employe_id
    if (!sid || !c.operation) return
    lvlMap[`${sid}|${c.operation}`] = Math.max(0, Math.min(3, Number(c.niveau) || 0))
  })
  const niveauCellDyn = (empId: string, opCode: string, act: string) => {
    const n = lvlMap[`${empId}|${opCode}`] ?? 0
    const styles: string[] = [
      'background:#f8fafc;color:#94a3b8;',
      'background:#fef9c3;color:#ca8a04;',
      'background:#dcfce7;color:#16a34a;',
      'background:#dbeafe;color:#1d4ed8;',
    ]
    const labels = ['—','★','★★','★★★']
    return `<td class="matrix-cell-col" data-act="${act}" style="padding:6px;text-align:center;"><div class="rh-matrix-cell" data-emp="${empId}" data-op="${escX(opCode)}" data-niv="${n}" style="${styles[n]}border-radius:6px;padding:4px 8px;font-weight:700;font-size:.82rem;cursor:pointer;user-select:none;" onclick="rhCycleNiveau(this)" title="Cliquer pour changer le niveau">${labels[n]}</div></td>`
  }

  const matrixTable = `
  <div style="overflow-x:auto;">
    <table style="border-collapse:collapse;min-width:700px;">
      <thead>
        <tr>
          <th style="padding:8px 14px;text-align:left;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #f1f5f9;min-width:180px;">Process atelier</th>
          ${EMPS.map(e => `<th class="matrix-col" data-act="${e.act}" style="padding:8px 6px;text-align:center;font-size:.7rem;font-weight:700;color:#374151;border-bottom:2px solid #f1f5f9;min-width:70px;">
            <div style="width:32px;height:32px;border-radius:50%;background:${e.act==='Seem'?'#eff6ff':e.act==='both'?'#f5f3ff':'#fdf2f8'};border:2px solid ${e.act==='Seem'?'#3b82f6':e.act==='both'?'#8b5cf6':'#ec4899'};display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:800;color:${e.act==='Seem'?'#1d4ed8':e.act==='both'?'#6d28d9':'#be185d'};margin:0 auto 4px;" title="${escX(e.nom)}${e.poste?' · '+escX(e.poste):''}">${escX(e.initiales)}</div>
            <div style="font-size:.6rem;">${escX(e.nom.split(' ')[0])}</div>
          </th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${OPS.map(op => `<tr class="matrix-row" data-act="${op.activite || 'both'}" style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:8px 14px;font-size:.78rem;font-weight:600;color:#374151;">${escX(op.nom)}${op.activite?` <span style="font-size:.6rem;color:#94a3b8;font-weight:500;">(${op.activite})</span>`:''}</td>
          ${EMPS.map(e => niveauCellDyn(e.id, op.code, e.act)).join('')}
        </tr>`).join('')}
      </tbody>
    </table>
    <div style="padding:12px 4px 4px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;font-size:.7rem;color:#64748b;">
      <span><i class="fas fa-info-circle" style="color:#6366f1;margin-right:4px;"></i>${EMPS.length} opérateur(s) actif(s) · ${OPS.length} process</span>
      <span><i class="fas fa-mouse-pointer" style="color:#94a3b8;margin-right:4px;"></i>Cliquez une cellule pour faire évoluer le niveau · sauvegarde automatique en base</span>
    </div>
  </div>`

  // Diagramme dynamique : process → opérateurs habilités (niveau ≥ 1)
  const procRows = OPS.map(op => {
    const habilites = EMPS
      .map(e => ({ emp: e, niv: lvlMap[`${e.id}|${op.code}`] ?? 0 }))
      .filter(x => x.niv >= 1)
      .sort((a,b) => b.niv - a.niv)
    const actColor = op.activite === 'Semrac' ? '#ec4899' : op.activite === 'both' ? '#8b5cf6' : '#3b82f6'
    const actBg    = op.activite === 'Semrac' ? '#fdf2f8' : op.activite === 'both' ? '#f5f3ff' : '#eff6ff'
    const empPills = habilites.length === 0
      ? '<span style="font-size:.7rem;color:#ef4444;font-weight:600;font-style:italic;"><i class="fas fa-exclamation-triangle" style="margin-right:4px;"></i>Aucun opérateur habilité — risque de blocage</span>'
      : habilites.map(({ emp, niv }) => {
          const lvlIcon = ['','★','★★','★★★'][niv]
          const lvlCol  = niv === 1 ? '#ca8a04' : niv === 2 ? '#16a34a' : '#1d4ed8'
          const lvlBg   = niv === 1 ? '#fef9c3' : niv === 2 ? '#dcfce7' : '#dbeafe'
          return `<span style="display:inline-flex;align-items:center;gap:5px;background:${lvlBg};color:${lvlCol};border-radius:999px;padding:3px 10px;font-size:.7rem;font-weight:700;border:1px solid ${lvlCol}33;">
            <span style="width:18px;height:18px;border-radius:50%;background:${emp.act==='Seem'?'#3b82f6':'#ec4899'};color:white;font-size:.55rem;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">${escX(emp.initiales.replace('.',''))}</span>
            ${escX(emp.nom.split(' ')[0])} <span style="opacity:.7;">${lvlIcon}</span>
          </span>`
        }).join(' ')
    return `<div style="display:flex;gap:14px;padding:12px 14px;border-bottom:1px solid #f1f5f9;align-items:flex-start;">
      <div style="flex-shrink:0;min-width:220px;padding:8px 12px;background:${actBg};border-radius:10px;border-left:4px solid ${actColor};">
        <div style="font-weight:800;font-size:.78rem;color:#111827;">${escX(op.nom)}</div>
        ${op.activite ? `<div style="font-size:.62rem;color:${actColor};font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-top:2px;">${op.activite}</div>` : ''}
        <div style="font-size:.62rem;color:#94a3b8;margin-top:3px;">${habilites.length} opérateur${habilites.length>1?'s':''} habilité${habilites.length>1?'s':''}</div>
      </div>
      <div style="flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding-top:6px;">${empPills}</div>
    </div>`
  }).join('')

  const orgChart = `
  <div style="display:flex;flex-direction:column;gap:18px;">
    <!-- Section 1 : Diagramme process → opérateurs habilités -->
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="width:36px;height:36px;border-radius:10px;background:${INDIGO}22;display:flex;align-items:center;justify-content:center;color:${INDIGO};font-size:1rem;"><i class="fas fa-project-diagram"></i></div>
        <div>
          <div style="font-weight:800;font-size:.95rem;color:#111827;">Diagramme process → opérateurs habilités</div>
          <div style="font-size:.7rem;color:#6b7280;">Une ligne par process atelier · pastilles = opérateurs habilités · niveau ★ → ★★★</div>
        </div>
      </div>
      <div style="border:1px solid #f1f5f9;border-radius:14px;overflow:hidden;background:white;">
        ${procRows || '<div style="text-align:center;padding:32px;color:#94a3b8;font-size:.78rem;"><i class="fas fa-info-circle" style="margin-right:6px;"></i>Aucun process à afficher</div>'}
      </div>
    </div>

    <!-- Section 2 : Organigramme général -->
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <div style="width:36px;height:36px;border-radius:10px;background:#f9731622;display:flex;align-items:center;justify-content:center;color:#f97316;font-size:1rem;"><i class="fas fa-sitemap"></i></div>
        <div>
          <div style="font-weight:800;font-size:.95rem;color:#111827;">Organigramme services</div>
          <div style="font-size:.7rem;color:#6b7280;">Vue arborescente des services Seem &amp; Semrac</div>
        </div>
      </div>
      <div style="overflow-x:auto;padding:14px;border:1px solid #f1f5f9;border-radius:14px;background:white;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;min-width:900px;">
          <div style="background:linear-gradient(135deg,${INDIGO},${INDIGO_D});color:white;border-radius:12px;padding:12px 24px;font-weight:800;font-size:.85rem;text-align:center;min-width:180px;">Direction Générale</div>
          <div style="width:2px;height:24px;background:#cbd5e1;"></div>
          <div style="display:flex;gap:30px;align-items:flex-start;">
            ${[
              { label:'Service Commercial',  sub:'Corinne Moreau',     color:'#f59e0b' },
              { label:'Bureau d\'Études',    sub:'Joël / David',       color:'#8b5cf6' },
              { label:'Service Qualité',     sub:'Pierre-Yves Blanc',  color:'#ef4444' },
              { label:'Service Production',  sub:'Sylvie R.',          color:'#f97316' },
              { label:'GMAO Maintenance',    sub:'Resp. Maintenance',  color:'#eab308' },
              { label:'Service OAS',         sub:'Mickael',            color:'#06b6d4' },
            ].map(svc => {
              const members = EMPS
                .filter(e => (svc.label.includes('Production') && (e.act==='Seem' || e.act==='Semrac')) || (svc.label.includes('Qualité') && /qualit/i.test(e.poste||'')))
                .map(e => e.nom)
              return `
              <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
                <div style="width:2px;height:24px;background:#cbd5e1;"></div>
                <div style="background:white;border:2px solid ${svc.color};border-radius:10px;padding:10px 16px;text-align:center;min-width:140px;box-shadow:0 2px 8px ${svc.color}22;">
                  <div style="font-weight:700;font-size:.78rem;color:#111827;">${svc.label}</div>
                  <div style="font-size:.68rem;color:#6b7280;margin-top:4px;">${svc.sub}</div>
                </div>
                ${members.length > 0 ? `
                  <div style="width:2px;height:16px;background:#cbd5e1;"></div>
                  <div style="display:flex;flex-direction:column;gap:4px;align-items:center;">
                    ${members.map(m => `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:5px 12px;font-size:.7rem;font-weight:600;color:#374151;">${escX(m)}</div>`).join('')}
                  </div>
                ` : ''}
              </div>`
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`

  return `
  <div style="padding:20px 24px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #f1f5f9;">
    <button class="rh-sub-mat" onclick="rhSwitchSub('mat',0)" style="padding:7px 16px;border-radius:8px;border:1.5px solid #6366f1;background:#6366f1;color:white;cursor:pointer;font-size:.78rem;font-weight:700;"><i class="fas fa-th" style="margin-right:6px;"></i>Matrice Production</button>
    <button class="rh-sub-mat" onclick="rhSwitchSub('mat',1)" style="padding:7px 16px;border-radius:8px;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;font-size:.78rem;font-weight:600;"><i class="fas fa-project-diagram" style="margin-right:6px;"></i>Diagramme</button>
  </div>

  <div class="rh-sub-panel-mat" style="padding:20px 24px;">
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:16px;">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <span style="font-size:.72rem;font-weight:700;color:#6b7280;">Légende :</span>
        <span style="background:#f8fafc;color:#94a3b8;border-radius:6px;padding:3px 10px;font-size:.72rem;font-weight:700;">—&nbsp; Non formé</span>
        <span style="background:#fef9c3;color:#ca8a04;border-radius:6px;padding:3px 10px;font-size:.72rem;font-weight:700;">★&nbsp; En formation</span>
        <span style="background:#dcfce7;color:#16a34a;border-radius:6px;padding:3px 10px;font-size:.72rem;font-weight:700;">★★&nbsp; Autonome</span>
        <span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:3px 10px;font-size:.72rem;font-weight:700;">★★★&nbsp; Expert</span>
      </div>
      <div style="margin-left:auto;display:inline-flex;background:#f1f5f9;border-radius:11px;padding:3px;gap:2px;" id="matf-group">
        <button id="matf-tous" onclick="rhFilterMatrice('tous',this)" class="matf-btn" data-on="1" style="display:inline-flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:9px;padding:7px 15px;font-size:.78rem;font-weight:700;background:#fff;color:#4338ca;box-shadow:0 1px 3px rgba(0,0,0,.1);"><i class="fas fa-layer-group"></i>Tous <span style="background:#eef2ff;color:#4338ca;border-radius:999px;padding:0 7px;font-size:.64rem;">${EMPS.length}</span></button>
        <button id="matf-Seem" onclick="rhFilterMatrice('Seem',this)" class="matf-btn" data-on="0" style="display:inline-flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:9px;padding:7px 15px;font-size:.78rem;font-weight:700;background:transparent;color:#64748b;"><span style="width:9px;height:9px;border-radius:50%;background:#3b82f6;"></span>Seem <span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:0 7px;font-size:.64rem;">${EMPS.filter((e:any)=>e.act==='Seem').length}</span></button>
        <button id="matf-Semrac" onclick="rhFilterMatrice('Semrac',this)" class="matf-btn" data-on="0" style="display:inline-flex;align-items:center;gap:6px;border:none;cursor:pointer;border-radius:9px;padding:7px 15px;font-size:.78rem;font-weight:700;background:transparent;color:#64748b;"><span style="width:9px;height:9px;border-radius:50%;background:#ec4899;"></span>Semrac <span style="background:#fce7f3;color:#be185d;border-radius:999px;padding:0 7px;font-size:.64rem;">${EMPS.filter((e:any)=>e.act==='Semrac').length}</span></button>
      </div>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:16px;overflow:hidden;" id="rh-mat-table">
      ${matrixTable}
    </div>
  </div>

  <div class="rh-sub-panel-mat" style="padding:20px 24px;display:none;">
    ${orgChart}
  </div>`
}

// ─── PANEL: GESTION DES TEMPS ─────────────────────────────────

function panelTemps(pts: Pointage[]) {
  const totalH = pts.reduce((s,p) => s + (p.heures_travaillees ?? 0), 0)
  return `
  <div style="padding:20px 24px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #f1f5f9;">
    <button class="rh-sub-temps" onclick="rhSwitchSub('temps',0)" style="padding:7px 16px;border-radius:8px;border:1.5px solid #6366f1;background:#6366f1;color:white;cursor:pointer;font-size:.78rem;font-weight:700;"><i class="fas fa-calendar-day" style="margin-right:6px;"></i>Journée (${TODAY})</button>
    <button class="rh-sub-temps" onclick="rhSwitchSub('temps',1)" style="padding:7px 16px;border-radius:8px;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;font-size:.78rem;font-weight:600;"><i class="fas fa-history" style="margin-right:6px;"></i>Historique</button>
    <button class="rh-sub-temps" onclick="rhSwitchSub('temps',2)" style="padding:7px 16px;border-radius:8px;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;font-size:.78rem;font-weight:600;"><i class="fas fa-edit" style="margin-right:6px;"></i>Corrections</button>
  </div>

  <div class="rh-sub-panel-temps" style="padding:20px 24px;">
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;margin-bottom:16px;">
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th ${TH}>Employé</th><th ${TH}>Arrivée</th><th ${TH}>Départ</th><th ${TH}>Pause</th>
        <th ${TH}>Heures</th><th ${TH}>Type</th><th ${TH}>Statut</th><th ${TH}>Validé par</th><th ${TH}>Actions</th>
      </tr></thead>
      <tbody>
        ${pts.map(p => `<tr style="transition:background .15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
          <td ${TD}><span style="font-weight:700;">${escX(p.employe_nom)}</span></td>
          <td ${TD}><span style="font-family:monospace;font-weight:600;">${p.heure_arrivee ?? '—'}</span></td>
          <td ${TD}><span style="font-family:monospace;${!p.heure_depart?'color:#3b82f6;font-weight:600;':'font-weight:600;'}">${p.heure_depart ?? 'En cours'}</span></td>
          <td ${TD}>${p.pause_min ?? 30} min</td>
          <td ${TD}><span style="font-weight:700;color:#111827;">${p.heures_travaillees ? p.heures_travaillees.toFixed(2) + ' h' : '—'}</span></td>
          <td ${TD}><span style="background:#f1f5f9;border-radius:6px;padding:2px 8px;font-size:.72rem;font-weight:600;">${escX(p.type)}</span></td>
          <td ${TD}>${ptStatutBadge(p.statut)}</td>
          <td ${TD}><span style="font-size:.75rem;color:#6b7280;">${escX(p.valide_par ?? (p.correction_motif ? p.correction_motif.slice(0,30)+'…' : '—'))}</span></td>
          <td ${TD}>
            <button onclick="rhOuvrirModif('${p.id}','${(p.employe_nom ?? '').replace(/'/g,"\\'")}','${p.heure_arrivee ?? ''}','${p.heure_depart ?? ''}')"
              style="padding:5px 12px;background:#6366f1;color:white;border:none;border-radius:6px;cursor:pointer;font-size:.72rem;font-weight:700;display:inline-flex;align-items:center;gap:4px;">
              <i class="fas fa-edit"></i>Modifier
            </button>
          </td>
        </tr>`).join('')}
      </tbody>
      <tfoot><tr style="background:#f8fafc;">
        <td ${TD} colspan="4"><strong>TOTAL JOURNÉE</strong></td>
        <td ${TD}><strong style="font-size:.9rem;">${totalH.toFixed(2)} h</strong></td>
        <td ${TD} colspan="4"></td>
      </tr></tfoot>
    </table>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;font-size:.78rem;color:#1d4ed8;">
      <i class="fas fa-info-circle" style="margin-right:6px;"></i>Les pointages sont alimentés depuis la page <a href="/rh/pointage" style="font-weight:700;color:#1d4ed8;">Pointage</a>. Les corrections nécessitent une autorisation responsable.
    </div>
  </div>

  <div class="rh-sub-panel-temps" style="padding:20px 24px;display:none;">
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center;">
      <select style="padding:7px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.78rem;background:white;">
        <option>Tous les employés</option>
        ${Array.from(new Set(pts.map((p:any)=>p.employe_nom).filter(Boolean))).map(n=>`<option>${escX(n)}</option>`).join('')}
      </select>
      <select style="padding:7px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:.78rem;background:white;">
        ${(()=>{ const out:string[]=[]; const base=new Date(); const dow=(base.getDay()+6)%7; base.setDate(base.getDate()-dow); for(let k=0;k<4;k++){ const m=new Date(base); m.setDate(base.getDate()-k*7); out.push('<option>Semaine du '+m.toLocaleDateString('fr-FR')+'</option>'); } return out.join(''); })()}
      </select>
      <button onclick="pushNotif('info','fa-download','Export Excel généré.')" style="padding:7px 16px;border-radius:8px;background:white;border:1.5px solid #e2e8f0;cursor:pointer;font-size:.78rem;font-weight:600;"><i class="fas fa-download" style="margin-right:6px;color:#6b7280;"></i>Exporter Excel</button>
    </div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th ${TH}>Date</th><th ${TH}>Employé</th><th ${TH}>Arrivée</th><th ${TH}>Départ</th>
        <th ${TH}>Heures</th><th ${TH}>Type</th><th ${TH}>Statut</th>
      </tr></thead>
      <tbody>
        ${pts.map(p => `<tr>
          <td ${TD}>${p.date_pointage}</td>
          <td ${TD}><span style="font-weight:600;">${escX(p.employe_nom)}</span></td>
          <td ${TD}>${p.heure_arrivee ?? '—'}</td>
          <td ${TD}>${p.heure_depart ?? '—'}</td>
          <td ${TD}>${p.heures_travaillees ? p.heures_travaillees.toFixed(2)+' h' : '—'}</td>
          <td ${TD}>${escX(p.type)}</td>
          <td ${TD}>${ptStatutBadge(p.statut)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    </div>
  </div>

  <div class="rh-sub-panel-temps" style="padding:20px 24px;display:none;">
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:28px;max-width:700px;">
      <div style="font-size:.85rem;font-weight:800;color:#111827;margin-bottom:6px;"><i class="fas fa-edit" style="color:${INDIGO};margin-right:8px;"></i>Demande de correction de pointage</div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;font-size:.77rem;color:#92400e;margin-bottom:18px;"><i class="fas fa-shield-alt" style="margin-right:6px;"></i>Toute correction requiert l'autorisation d'un responsable. La raison est tracée et archivée.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        ${fldSel('Employé *','corr_emp',EMPLOYES_DEFAULT.map(e=>e.nom+' '+(e.prenom??'')))}
        ${fld('Date concernée *','date','corr_date')}
        ${fld('Heure arrivée corrigée','time','corr_arrivee')}
        ${fld('Heure départ corrigée','time','corr_depart')}
        ${fldSel('Autorisation accordée par *','corr_auth',['Responsable Production (Sylvie R.)','Responsable Qualité (P.-Y. Blanc)','Direction Générale'])}
        <div style="grid-column:1/-1;">${fldArea('Motif de correction * (obligatoire)','corr_motif')}</div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:20px;">
        <button onclick="rhSauvegarderCorrection()" style="padding:9px 24px;border-radius:10px;background:linear-gradient(135deg,${INDIGO},${INDIGO_D});color:white;border:none;cursor:pointer;font-size:.83rem;font-weight:700;"><i class="fas fa-paper-plane" style="margin-right:6px;"></i>Soumettre la correction</button>
      </div>
    </div>
  </div>`
}

// ─── FORM HELPERS ─────────────────────────────────────────────

function fld(label: string, type: string, id: string) {
  return `<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">${label}</label>
    <input id="${id}" type="${type}" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;color:#374151;background:#f8fafc;outline:none;"/></div>`
}
function fldSel(label: string, id: string, opts: string[]) {
  return `<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">${label}</label>
    <select id="${id}" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;color:#374151;background:#f8fafc;outline:none;">
    ${opts.map(o=>`<option>${escX(o)}</option>`).join('')}</select></div>`
}
function fldArea(label: string, id: string) {
  return `<div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">${label}</label>
    <textarea id="${id}" rows="3" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;color:#374151;background:#f8fafc;outline:none;resize:vertical;"></textarea></div>`
}

// ─── BARRE DE NAVIGATION RH (commune à toutes les pages RH) ────
function rhNavBar(active: string): string {
  const MENUS = [
    { href:'/rh/employes',       icon:'fa-users',          label:'Employés' },
    { href:'/rh/habilitations',  icon:'fa-certificate',    label:'Habilitations & Certifications' },
    { href:'/rh/competences',    icon:'fa-th',             label:'Matrice Compétences' },
    { href:'/rh/organigramme',   icon:'fa-sitemap',        label:'Organigramme' },
    { href:'/rh/temps',          icon:'fa-clock',          label:'Gestion des Temps' },
    { href:'/rh/service',        icon:'fa-tachometer-alt', label:'Dashboard' },
  ]
  return `
  <div id="svc-hdr-bar" style="background:${INDIGO};padding:10px 24px;display:flex;align-items:center;gap:12px;">
    <i class="fas fa-users" style="color:white;font-size:1rem;"></i>
    <span style="color:white;font-weight:800;font-size:.9rem;">Service RH</span>
    <span style="color:rgba(255,255,255,.5);font-size:.7rem;">· EN 9100:2018</span>
  </div>
  ${demandeAchatModal('RH', INDIGO)}
  <div style="background:linear-gradient(135deg,#0f172a,#312e81);padding:0 16px;display:flex;gap:2px;overflow-x:auto;border-bottom:3px solid ${INDIGO};">
    ${MENUS.map(m => {
      const isActive = m.href === active
      return `<a href="${m.href}" style="display:inline-flex;align-items:center;gap:7px;padding:11px 18px;text-decoration:none;font-size:.8rem;font-weight:${isActive?'700':'600'};white-space:nowrap;border-bottom:3px solid ${isActive?INDIGO:'transparent'};margin-bottom:-3px;background:${isActive?'rgba(99,102,241,.2)':'transparent'};color:${isActive?'white':'rgba(255,255,255,.55)'};border-radius:6px 6px 0 0;transition:all .15s;" onmouseover="if(this.style.color!=='white')this.style.color='rgba(255,255,255,.85)'" onmouseout="if(this.getAttribute('data-active')!=='1')this.style.color='rgba(255,255,255,.55)'" data-active="${isActive?'1':'0'}">
        <i class="fas ${m.icon}"></i>${m.label}
      </a>`
    }).join('')}
  </div>`
}

// ─── MAIN PAGE — DASHBOARD ────────────────────────────────────

export function pageServiceRH(dbEmps?: Employe[], dbCerts?: Certification[], dbMatrix?: CompetenceOperateur[], dbPts?: Pointage[], dbConges?: any[]): string {
  const emps  = dbEmps ?? []
  const certs = dbCerts ?? []
  const pts   = dbPts ?? []
  const conges = dbConges ?? []

  const content = rhNavBar('/rh/service') + `<div style="background:#f8fafc;min-height:80vh;">${panelDashboard(emps, certs, pts, conges)}</div>`
  return layout('RH — Dashboard', content, 'service-rh')
}

// ─── PAGE ORGANIGRAMME (éditable) ─────────────────────────────
export function pageRHOrganigramme(dbSals?: any[]): string {
  const sals = (dbSals ?? []).filter((s: any) => s.actif !== false)
  const byId: Record<string, any> = {}
  sals.forEach((s: any) => { byId[String(s.id)] = s })
  const children: Record<string, any[]> = {}
  const roots: any[] = []
  sals.forEach((s: any) => {
    const mid = s.manager_id && byId[String(s.manager_id)] && String(s.manager_id) !== String(s.id) ? String(s.manager_id) : null
    if (mid) (children[mid] = children[mid] || []).push(s)
    else roots.push(s)
  })
  const sortFn = (a: any, b: any) => String(a.nom || '').localeCompare(String(b.nom || ''))
  roots.sort(sortFn); Object.values(children).forEach(arr => arr.sort(sortFn))
  const full = (s: any) => `${s.prenom ?? ''} ${s.nom ?? ''}`.trim() || s.id
  const initials = (s: any) => ((String(s.prenom ?? '').trim()[0] || '') + (String(s.nom ?? '').trim()[0] || '')).toUpperCase() || '?'
  const entCol: Record<string, string> = { Seem: '#1d4ed8', Semrac: '#be185d', Support: '#0f766e' }
  const renderedIds = new Set<string>()
  const nodeHtml = (s: any): string => {
    if (renderedIds.has(String(s.id))) return ''
    renderedIds.add(String(s.id))
    const kids = (children[String(s.id)] || []).filter((k: any) => !renderedIds.has(String(k.id)))
    const col = entCol[String(s.entite)] || '#6366f1'
    const nb = (children[String(s.id)] || []).length
    return `<li>
      <div class="occard" style="border-top-color:${col};">
        <div class="ocav" style="background:${col};">${escX(initials(s))}</div>
        <div style="font-weight:800;font-size:.78rem;color:#1e293b;line-height:1.15;">${escX(full(s))}</div>
        <div style="font-size:.66rem;color:#64748b;">${escX(s.poste || s.role || '—')}</div>
        <div style="margin-top:2px;display:flex;gap:4px;align-items:center;">
          ${s.entite ? `<span style="background:${col}18;color:${col};border-radius:5px;padding:0 6px;font-size:.55rem;font-weight:700;">${s.entite}</span>` : ''}
          ${nb ? `<span style="color:#94a3b8;font-size:.55rem;"><i class="fas fa-users" style="margin-right:2px;"></i>${nb}</span>` : ''}
        </div>
      </div>
      ${kids.length ? `<ul>${kids.map(nodeHtml).join('')}</ul>` : ''}
    </li>`
  }
  let lis = roots.map(nodeHtml).join('')
  const orphans = sals.filter((s: any) => !renderedIds.has(String(s.id)))
  if (orphans.length) lis += orphans.map(nodeHtml).join('')
  const chart = sals.length ? `<div class="oc"><ul>${lis}</ul></div>` : '<div style="color:#9ca3af;padding:40px;text-align:center;">Aucun salarié actif.</div>'

  const opt = (selfId: string, cur: any) => '<option value="">— Aucun (sommet) —</option>' + sals.filter((o: any) => String(o.id) !== selfId).sort(sortFn).map((o: any) => `<option value="${o.id}"${String(cur || '') === String(o.id) ? ' selected' : ''}>${escX(full(o))}${o.poste ? ` — ${escX(o.poste)}` : ''}</option>`).join('')
  const editRows = sals.slice().sort(sortFn).map((s: any) => {
    const col = entCol[String(s.entite)] || '#6366f1'
    return `<div style="display:flex;align-items:center;gap:12px;padding:9px 14px;border-bottom:1px solid #f1f5f9;">
      <div style="width:30px;height:30px;border-radius:50%;background:${col};color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.72rem;flex-shrink:0;">${escX(initials(s))}</div>
      <div style="flex:1;min-width:0;"><span style="font-weight:700;color:#1e293b;font-size:.82rem;">${escX(full(s))}</span> <span style="color:#94a3b8;font-size:.7rem;">${escX(s.poste || '')}</span></div>
      <label style="font-size:.66rem;color:#6b7280;font-weight:700;white-space:nowrap;">Responsable :</label>
      <select onchange="orgSetManager('${s.id}', this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 9px;font-size:.78rem;background:#f8fafc;min-width:260px;">${opt(String(s.id), s.manager_id)}</select>
    </div>`
  }).join('')

  const content = rhNavBar('/rh/organigramme') + `
  <style>
    .org-pill{padding:8px 18px;border-radius:10px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:.82rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:7px;box-shadow:0 1px 3px rgba(0,0,0,.06);}
    .org-pill.active{background:linear-gradient(135deg,#4f46e5,#6366f1);color:white;border-color:transparent;}
    .oc{display:flex;padding-top:6px;min-width:max-content;}
    .oc ul{display:flex;flex-wrap:nowrap;justify-content:center;padding:0;margin:0;}
    .oc > ul{flex-wrap:wrap;gap:6px;align-items:flex-start;}
    .oc li{list-style:none;text-align:center;position:relative;padding:22px 7px 0;}
    .oc li::before,.oc li::after{content:'';position:absolute;top:0;right:50%;border-top:2px solid #cbd5e1;width:50%;height:22px;}
    .oc li::after{right:auto;left:50%;border-left:2px solid #cbd5e1;}
    .oc li:only-child{padding-top:6px;}
    .oc li:only-child::before,.oc li:only-child::after{display:none;}
    .oc li:first-child::before,.oc li:last-child::after{border:0 none;}
    .oc li:last-child::before{border-right:2px solid #cbd5e1;border-radius:0 7px 0 0;}
    .oc li:first-child::after{border-radius:7px 0 0 0;}
    .oc ul ul::before{content:'';position:absolute;top:0;left:50%;border-left:2px solid #cbd5e1;width:0;height:22px;}
    .oc > ul > li{padding-top:0;}
    .oc > ul > li::before,.oc > ul > li::after{display:none;border:0;}
    .occard{display:inline-flex;flex-direction:column;align-items:center;gap:1px;border:1px solid #e2e8f0;border-top:3px solid #6366f1;border-radius:12px;padding:10px 16px;background:white;box-shadow:0 2px 6px rgba(0,0,0,.06);min-width:158px;transition:all .15s;}
    .occard:hover{box-shadow:0 8px 22px rgba(0,0,0,.13);transform:translateY(-2px);}
    .ocav{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:.82rem;margin-bottom:3px;box-shadow:0 2px 6px rgba(0,0,0,.15);}
  </style>
  <div style="background:#f8fafc;min-height:80vh;padding:22px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap;">
      <div style="font-weight:900;font-size:1.15rem;color:#111827;display:flex;align-items:center;gap:9px;"><i class="fas fa-sitemap" style="color:${INDIGO};"></i>Organigramme</div>
      <div style="display:flex;gap:8px;margin-left:8px;">
        <button id="orgpill-chart" onclick="orgView('chart')" class="org-pill active"><i class="fas fa-diagram-project"></i>Vue organigramme</button>
        <button id="orgpill-edit" onclick="orgView('edit')" class="org-pill"><i class="fas fa-user-pen"></i>Liens hiérarchiques</button>
      </div>
      <span style="margin-left:auto;font-size:.72rem;color:#94a3b8;">${sals.length} salariés actifs</span>
    </div>

    <div id="org-view-chart">
      <div style="background:white;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:24px;overflow-x:auto;">${chart}</div>
      <div style="margin-top:10px;font-size:.72rem;color:#94a3b8;"><i class="fas fa-info-circle" style="margin-right:5px;"></i>Définissez les rattachements dans l'onglet « Liens hiérarchiques » pour construire la hiérarchie.</div>
    </div>

    <div id="org-view-edit" style="display:none;">
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;max-width:760px;">
        <div style="padding:12px 16px;font-size:.72rem;color:#6b7280;background:#eef2ff;border-bottom:1px solid #e0e7ff;font-weight:600;"><i class="fas fa-info-circle" style="margin-right:5px;color:${INDIGO};"></i>Choisissez le responsable hiérarchique de chaque salarié — l'organigramme se met à jour automatiquement.</div>
        ${editRows || '<div style="padding:24px;text-align:center;color:#9ca3af;">Aucun salarié</div>'}
      </div>
    </div>

    <script>
      function orgView(v){
        document.getElementById('org-view-chart').style.display=(v==='chart')?'block':'none';
        document.getElementById('org-view-edit').style.display=(v==='edit')?'block':'none';
        var bc=document.getElementById('orgpill-chart'), be=document.getElementById('orgpill-edit');
        if(bc) bc.classList.toggle('active',v==='chart'); if(be) be.classList.toggle('active',v==='edit');
      }
      function orgSetManager(id, mgr){
        fetch('/api/rh/salarie/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({manager_id:mgr||null})})
          .then(function(r){return r.json();}).then(function(j){
            if(j&&j.error){ pushNotif('err','fa-ban',j.error); return; }
            pushNotif('ok','fa-sitemap','Rattachement mis à jour.',2200); setTimeout(function(){ softReload(); },450);
          }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
      }
    </script>
  </div>`
  return layout('RH — Organigramme', content, 'service-rh')
}

// ─── PAGE EMPLOYÉS ────────────────────────────────────────────
export function pageRHEmployes(dbEmps?: Employe[], dbOrphans?: any[], canWriteRH = false, dbValidations?: any[]): string {
  const emps = dbEmps ?? []
  const orphans = dbOrphans ?? []
  const VD_MAP = buildValDirMap(dbValidations || [])   // décisions Direction par (ref_table, ref_id)
  const FINP = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;color:#374151;'
  const FLBL = 'display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'
  const roleOptions = Object.entries(RH_ROLE_LABELS).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')
  const ficheModal = `
  <div id="rhFicheModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:6000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;max-width:640px;width:94%;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,${INDIGO},${INDIGO_D});position:sticky;top:0;">
        <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-id-card" style="margin-right:8px;"></i><span id="rhFicheTitle">Fiche salarié</span></div>
        <button onclick="rhCloseFiche()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:22px;">
        <input type="hidden" id="f_id"/>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><label style="${FLBL}">Nom *</label><input id="f_nom" type="text" style="${FINP}"/></div>
          <div><label style="${FLBL}">Prénom</label><input id="f_prenom" type="text" style="${FINP}"/></div>
          <div><label style="${FLBL}">Rôle principal *</label><select id="f_role" onchange="rhRoleChange()" style="${FINP}">${roleOptions}</select></div>
          <div id="f_entite_wrap"><label style="${FLBL}">Activité (opérateur)</label><select id="f_entite" style="${FINP}"><option>Seem</option><option>Semrac</option></select></div>
          <div><label style="${FLBL}">Poste</label><input id="f_poste" type="text" placeholder="Ex : Usinage CN" style="${FINP}"/></div>
          <div><label style="${FLBL}">Contrat</label><select id="f_contrat" style="${FINP}"><option>CDI</option><option>CDD</option><option>Apprenti</option><option>Interim</option><option>Stage</option></select></div>
          <div><label style="${FLBL}">Shift</label><select id="f_shift" style="${FINP}"><option value="matin">Matin 6h-14h</option><option value="apmidi">Après-midi 14h-22h</option><option value="journee">Journée 7h-17h</option><option value="soir">Nuit</option></select></div>
          <div><label style="${FLBL}">Date d'entrée</label><input id="f_date" type="date" style="${FINP}"/></div>
          <div><label style="${FLBL}">Taux horaire chargé (€/h) ${canWriteRH ? '<span title="Confidentiel — maintenir le clic pour révéler" style="color:#94a3b8;"><i class="fas fa-lock"></i></span>' : ''}</label>${canWriteRH
            ? `<input id="f_taux" type="password" step="0.01" autocomplete="off" onmousedown="rhTauxReveal()" onmouseup="rhTauxMask()" onmouseleave="rhTauxMask()" ontouchstart="rhTauxReveal()" ontouchend="rhTauxMask()" style="${FINP}" placeholder="•••"/><div style="font-size:.6rem;color:#94a3b8;margin-top:2px;">Masqué — <strong>maintenez le clic</strong> pour révéler / éditer.</div>`
            : `<input id="f_taux" type="text" value="***" disabled style="${FINP}background:#f1f5f9;color:#94a3b8;letter-spacing:.25em;"/><div style="font-size:.6rem;color:#94a3b8;margin-top:2px;">Réservé aux droits d'écriture RH.</div>`
          }</div>
          <div><label style="${FLBL}">Email</label><input id="f_email" type="email" style="${FINP}"/></div>
          <div><label style="${FLBL}">Téléphone</label><input id="f_tel" type="text" style="${FINP}"/></div>
          <div><label style="${FLBL}">Statut</label><select id="f_actif" style="${FINP}"><option value="true">Actif</option><option value="false">Inactif</option></select></div>
          <div style="grid-column:1/-1;"><label style="${FLBL}">Adresse</label><input id="f_adresse" type="text" style="${FINP}"/></div>
          <div style="grid-column:1/-1;">
            <label style="${FLBL}">Rôles supplémentaires <span style="font-weight:500;text-transform:none;color:#94a3b8;">(cumul des accès — optionnel)</span></label>
            <div style="display:flex;flex-wrap:wrap;gap:7px;">
              ${Object.entries(RH_ROLE_LABELS).map(([v, l]) => `<label style="display:inline-flex;align-items:center;gap:5px;font-size:.75rem;color:#374151;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:4px 10px;cursor:pointer;"><input type="checkbox" class="f-role-extra" value="${v}" style="width:14px;height:14px;accent-color:#6366f1;"/>${l}</label>`).join('')}
            </div>
            <div style="font-size:.66rem;color:#94a3b8;margin-top:4px;"><i class="fas fa-circle-info" style="margin-right:4px;"></i>Le rôle principal fixe le métier et l'entité ; les rôles cochés <strong>ajoutent</strong> leurs droits d'accès (permissions cumulées).</div>
          </div>
        </div>
        <div style="margin-top:14px;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px;background:#f8fafc;">
          <div style="font-size:.72rem;font-weight:800;color:#334155;margin-bottom:4px;"><i class="fas fa-user-shield" style="margin-right:6px;color:#6366f1;"></i>Accès par service — au-delà des rôles</div>
          <div style="font-size:.66rem;color:#94a3b8;margin-bottom:10px;">Maintenez <strong>Ctrl</strong> (ou <strong>Cmd</strong>) pour sélectionner plusieurs services. Laissez les deux listes vides pour vous en tenir aux droits du rôle.</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label style="${FLBL}"><i class="fas fa-eye" style="margin-right:5px;color:#0891b2;"></i>Peut LIRE</label>
              <select id="f_lire" multiple size="8" style="${FINP}height:auto;padding:6px;">
                ${Object.entries(RH_SERVICES).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="${FLBL}"><i class="fas fa-pen" style="margin-right:5px;color:#c2410c;"></i>Peut ÉCRIRE</label>
              <select id="f_ecrire" multiple size="8" style="${FINP}height:auto;padding:6px;">
                ${Object.entries(RH_SERVICES).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="font-size:.66rem;color:#94a3b8;margin-top:8px;"><i class="fas fa-circle-info" style="margin-right:4px;"></i>Un service en <strong>écriture</strong> donne aussi la lecture. Dès qu'au moins un service est choisi, ces deux listes <strong>remplacent</strong> les droits du rôle : elles définissent seules ce que la personne voit et modifie.</div>
        </div>
        <div style="margin-top:14px;border:1.5px dashed #c7d2fe;border-radius:10px;padding:12px;background:#eef2ff;">
          <div style="font-size:.72rem;font-weight:800;color:#4338ca;margin-bottom:8px;"><i class="fas fa-key" style="margin-right:5px;"></i>Identifiants ERP (pointage · soldage des bons · habilitations)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div><label style="${FLBL}">Identifiant / Matricule</label><input id="f_matricule" type="text" placeholder="OP-010" style="${FINP}"/></div>
            <div><label style="${FLBL}">Code PIN (MDP)</label><input id="f_pin" type="text" inputmode="numeric" placeholder="••••" style="${FINP}"/></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
            <div><label style="${FLBL}">Solde congés payés (h)</label><input id="f_solde" type="number" step="1" style="${FINP}"/></div>
            <div><label style="${FLBL}">Solde RTT / repos (h)</label><input id="f_solde_rtt" type="number" step="1" style="${FINP}"/></div>
          </div>
          <div id="f_role_perms" style="font-size:.68rem;color:#6366f1;margin-top:8px;"></div>
        </div>
        <div style="margin-top:14px;border:1.5px dashed #bbf7d0;border-radius:10px;padding:12px;background:#f0fdf4;">
          <div style="font-size:.72rem;font-weight:800;color:#166534;margin-bottom:8px;"><i class="fas fa-users" style="margin-right:5px;"></i>Données sociales (RSE — égalité F/H · OETH · turnover)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <div><label style="${FLBL}">Sexe</label><select id="f_sexe" style="${FINP}"><option value="">—</option><option value="F">Femme</option><option value="H">Homme</option></select></div>
            <div><label style="${FLBL}">Travailleur handicapé (OETH)</label><select id="f_oeth" style="${FINP}"><option value="false">Non</option><option value="true">Oui</option></select></div>
            <div><label style="${FLBL}">Date de sortie</label><input id="f_sortie" type="date" style="${FINP}"/></div>
          </div>
        </div>
        <div id="f_valideur" style="margin-top:12px;border:1.5px solid #fde68a;border-radius:10px;padding:12px;background:#fffbeb;display:none;">
          <div style="font-size:.72rem;font-weight:800;color:#92400e;margin-bottom:8px;"><i class="fas fa-user-shield" style="margin-right:5px;"></i>Habilitation requise — un responsable RH/Direction doit valider la création</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div><label style="${FLBL}">Matricule validateur</label><input id="f_val_mat" type="text" style="${FINP}"/></div>
            <div><label style="${FLBL}">Code PIN validateur</label><input id="f_val_pin" type="password" style="${FINP}"/></div>
          </div>
        </div>
      </div>
      <div style="padding:10px 22px 0;">${validationCheckbox('f_vd', 'Soumettre cette fiche à la validation de la Direction (embauche / changement de rôle)')}</div>
      <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;position:sticky;bottom:0;background:white;">
        <button onclick="rhCloseFiche()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="rhSaveFiche()" style="padding:9px 18px;background:linear-gradient(135deg,${INDIGO},${INDIGO_D});color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-save" style="margin-right:5px;"></i><span id="rhFicheSaveLabel">Enregistrer</span></button>
      </div>
    </div>
  </div>`
  const js = `<script>
var RH_CAN_WRITE=${canWriteRH ? 'true' : 'false'};
var RH_EMPS=${sjX(emps.map((e:any)=>({id:e.id,nom:e.nom,prenom:e.prenom,role:e.role,roles:e.roles,activite:e.activite,poste:e.poste,type_contrat:e.type_contrat,shift_id:e.shift_id,date_entree:e.date_entree,taux_horaire:(canWriteRH ? e.taux_horaire : null),email:e.email,telephone:e.telephone,adresse:e.adresse,statut:e.statut,matricule:e.matricule,solde_conges:e.solde_conges,solde_rtt:e.solde_rtt,sexe:e.sexe,oeth:e.oeth,date_sortie:e.date_sortie})))};
var RH_PERMS={operateur:'Atelier : pointage, solder/réception BDT, autocontrôle (PIN perso). Lecture Prod/OAS/Qualité/Expéditions.',oas:'OAS (écriture). Lecture Prod/BE/Qualité/Stock/Maintenance/Sécurité. Pointage + autocontrôle.',qualite:'Qualité + Sécurité + Habilitations/certifications (écriture). Lecture Prod/OAS/BE/Expé/Stock/Maintenance.',commercial:'Commercial (écriture). Lecture BE/Prod/Qualité/Expéditions/Stock.',bei:'Bureau d\\'études (écriture). Lecture Commercial/Achats/Prod/OAS/Qualité/Sécurité/Stock/Maintenance.',achats:'Achats + Stock (écriture). Lecture Commercial/BE/Prod/Expéditions/Maintenance.',logistique:'Expéditions + Stock (écriture). Lecture Commercial/Achats/Production.',production:'Production (écriture). Lecture BE/Achats/OAS/Qualité/Sécurité/Expé/Stock/Maintenance.',comptable:'Comptabilité (écriture). Lecture RH/Commercial/Achats/Expéditions/Stock.',maintenance:'Maintenance (écriture). Lecture Achats/Prod/OAS/Stock/Sécurité.',rh:'RH : salariés, congés, habilitations (écriture). Lecture Compta/Production/Sécurité.',direction:'Accès complet (administrateur).'};
function rhSearchEmp(q){ var lq=(q||'').toLowerCase(); document.querySelectorAll('.emp-row').forEach(function(r){r.style.display=(r.dataset.nom||'').indexOf(lq)>=0?'':'none';}); }
function rhRoleChange(){
  var role=document.getElementById('f_role').value;
  document.getElementById('f_entite_wrap').style.display=(role==='operateur'||role==='oas')?'block':'none';
  var p=document.getElementById('f_role_perms'); if(p) p.innerHTML='<i class="fas fa-shield-alt" style="margin-right:4px;"></i>Autorisations ERP : <strong>'+(RH_PERMS[role]||'—')+'</strong>';
}
function rhOpenFiche(id){
  var creating=!id;
  document.getElementById('f_id').value=id||'';
  document.getElementById('rhFicheTitle').textContent=creating?'Nouvel employé':'Fiche salarié';
  document.getElementById('rhFicheSaveLabel').textContent=creating?'Créer le salarié':'Enregistrer';
  document.getElementById('f_valideur').style.display=creating?'block':'none';
  var e=creating?{}:(RH_EMPS.find(function(x){return String(x.id)===String(id);})||{});
  document.getElementById('f_nom').value=e.nom||'';
  document.getElementById('f_prenom').value=e.prenom||'';
  document.getElementById('f_role').value=e.role||'operateur';
  var _rs=Array.isArray(e.roles)?e.roles:[]; var _prim=e.role||'operateur';
  document.querySelectorAll('.f-role-extra').forEach(function(cb){ cb.checked = _rs.indexOf(cb.value)>=0 && cb.value!==_prim; });
  // Accès par service : jetons « lire:<service> » / « ecrire:<service> » dans autorisations.
  var _au=Array.isArray(e.autorisations)?e.autorisations:[];
  var _sel=function(selectId, prefixe){
    var el=document.getElementById(selectId); if(!el) return;
    var choisis={};
    _au.forEach(function(t){ t=String(t||''); if(t.indexOf(prefixe)===0) choisis[t.slice(prefixe.length)]=1; });
    for(var i=0;i<el.options.length;i++){ el.options[i].selected = !!choisis[el.options[i].value]; }
  };
  _sel('f_lire','lire:'); _sel('f_ecrire','ecrire:');
  document.getElementById('f_entite').value=e.activite==='Semrac'?'Semrac':'Seem';
  document.getElementById('f_poste').value=e.poste||'';
  document.getElementById('f_contrat').value=e.type_contrat||'CDI';
  document.getElementById('f_shift').value=e.shift_id||'matin';
  document.getElementById('f_date').value=e.date_entree||'';
  if(RH_CAN_WRITE){ var _ft=document.getElementById('f_taux'); if(_ft){ _ft.value=(e.taux_horaire!=null?e.taux_horaire:''); _ft.type='password'; } }
  document.getElementById('f_email').value=e.email||'';
  document.getElementById('f_tel').value=e.telephone||'';
  document.getElementById('f_actif').value=(e.statut==='inactif')?'false':'true';
  document.getElementById('f_adresse').value=e.adresse||'';
  document.getElementById('f_matricule').value=e.matricule||'';
  document.getElementById('f_pin').value='';
  document.getElementById('f_solde').value=(e.solde_conges!=null?e.solde_conges:175);
  document.getElementById('f_solde_rtt').value=(e.solde_rtt!=null?e.solde_rtt:0);
  var _fx=document.getElementById('f_sexe'); if(_fx) _fx.value=e.sexe||'';
  var _fo=document.getElementById('f_oeth'); if(_fo) _fo.value=(e.oeth===true?'true':'false');
  var _fs=document.getElementById('f_sortie'); if(_fs) _fs.value=e.date_sortie||'';
  document.getElementById('f_val_mat').value=''; document.getElementById('f_val_pin').value='';
  rhRoleChange();
  document.getElementById('rhFicheModal').style.display='flex';
}
function rhCloseFiche(){ document.getElementById('rhFicheModal').style.display='none'; }
// Taux horaire confidentiel : révélé UNIQUEMENT tant que le clic est maintenu, et seulement si droits d'écriture RH.
function rhTauxReveal(){ if(!RH_CAN_WRITE) return; var el=document.getElementById('f_taux'); if(el) el.type='text'; }
function rhTauxMask(){ if(!RH_CAN_WRITE) return; var el=document.getElementById('f_taux'); if(el) el.type='password'; }
var RH_ORPHANS=${sjX(orphans.map((o: any) => ({ raw: o.raw, nom: o.nom, prenom: o.prenom })))};
function rhOpenFicheFromOrphan(i){ var o=RH_ORPHANS[i]||{}; rhOpenFiche(''); document.getElementById('f_nom').value=o.nom||o.raw||''; document.getElementById('f_prenom').value=o.prenom||''; document.getElementById('f_poste').focus(); }
function rhSaveFiche(){
  var id=document.getElementById('f_id').value;
  var nom=document.getElementById('f_nom').value.trim(); if(!nom){ pushNotif('err','fa-exclamation-circle','Nom requis.'); return; }
  var _prim=document.getElementById('f_role').value;
  var _extras=[].slice.call(document.querySelectorAll('.f-role-extra:checked')).map(function(x){return x.value;});
  var _vals=function(selectId){ var el=document.getElementById(selectId); if(!el) return []; return [].slice.call(el.selectedOptions||[]).map(function(o){return o.value;}); };
  var _lire=_vals('f_lire'), _ecrire=_vals('f_ecrire');
  // L'écriture implique la lecture : inutile de cocher les deux côtés pour un même service.
  var _jetons=_ecrire.map(function(v){return 'ecrire:'+v;}).concat(_lire.filter(function(v){return _ecrire.indexOf(v)<0;}).map(function(v){return 'lire:'+v;}));
  var _roles=[_prim].concat(_extras.filter(function(r){return r!==_prim;}));
  var payload={ nom:nom, prenom:document.getElementById('f_prenom').value.trim(), role:_prim, roles:_roles, acces_services:_jetons, entite:document.getElementById('f_entite').value, poste:document.getElementById('f_poste').value.trim(), contrat:document.getElementById('f_contrat').value, shift_id:document.getElementById('f_shift').value, date_entree:document.getElementById('f_date').value||null, taux_horaire_charge:parseFloat(document.getElementById('f_taux').value)||null, email:document.getElementById('f_email').value.trim(), telephone:document.getElementById('f_tel').value.trim(), adresse:document.getElementById('f_adresse').value.trim(), actif:document.getElementById('f_actif').value==='true', matricule:document.getElementById('f_matricule').value.trim()||null, solde_conges:parseFloat(document.getElementById('f_solde').value), solde_rtt:parseFloat(document.getElementById('f_solde_rtt').value)||0, sexe:(document.getElementById('f_sexe')||{}).value||null, oeth:((document.getElementById('f_oeth')||{}).value==='true'), date_sortie:(document.getElementById('f_sortie')||{}).value||null };
  if(!RH_CAN_WRITE) delete payload.taux_horaire_charge;   // jamais de taux depuis un compte sans droit d'écriture RH
  var pin=document.getElementById('f_pin').value.trim(); if(pin) payload.pin=pin;
  var url, method;
  if(id){ url='/api/rh/salarie/'+encodeURIComponent(id); method='PATCH'; }
  else { url='/api/rh/salarie'; method='POST'; payload.valideur_matricule=document.getElementById('f_val_mat').value.trim(); payload.valideur_pin=document.getElementById('f_val_pin').value.trim(); }
  fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Enregistrement échoué.'); return; }
    var _sid=(j.salarie&&j.salarie.id)||id||null;
    submitValidation('rh','f_vd',{type:id?'Changement fiche salarié':'Nouveau salarié',objet:nom+' — '+document.getElementById('f_role').value,priorite:'normal',ref_table:'salaries',ref_id:_sid});
    rhCloseFiche(); pushNotif('ok','fa-user-check',id?'Fiche mise à jour.':('Salarié créé. Identifiants ERP actifs.'+(j.linked?' '+j.linked+' enregistrement(s) HSE rattaché(s).':'')),5000); setTimeout(function(){ softReload(); },800);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
async function rhDeleteEmp(id,nom){
  if(!id){ pushNotif('err','fa-ban','Identifiant manquant.'); return; }
  if(!await appConfirm('Supprimer définitivement le salarié '+(nom||id)+' ?\\n\\nCette action est irréversible et libère son matricule ERP.')) return;
  var mat=prompt('Matricule du valideur RH/Direction :','');
  if(mat===null) return;
  var pin=prompt('Code PIN du valideur :','');
  if(pin===null) return;
  fetch('/api/rh/salarie/'+encodeURIComponent(id),{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({valideur_matricule:mat.trim(),valideur_pin:pin.trim()})})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Suppression échouée.'); return; }
      pushNotif('ok','fa-trash','Salarié '+(nom||id)+' supprimé.',4500);
      setTimeout(function(){ softReload(); },800);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
</script>`
  const orphBadge = (n: number, lbl: string, col: string) => n ? `<span style="background:${col}1a;color:${col};border-radius:999px;padding:1px 8px;font-size:.64rem;font-weight:700;margin-right:4px;">${n} ${lbl}</span>` : ''
  const orphanBox = orphans.length ? `
  <div style="margin:0 16px 14px;background:white;border:1.5px solid #fde68a;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
    <div style="padding:12px 18px;background:#fffbeb;border-bottom:1px solid #fde68a;display:flex;align-items:center;gap:9px;">
      <i class="fas fa-user-plus" style="color:#d97706;"></i>
      <span style="font-weight:800;color:#92400e;">Salariés à rattacher</span>
      <span style="background:#f59e0b;color:white;border-radius:999px;padding:1px 9px;font-size:.66rem;font-weight:800;">${orphans.length}</span>
      <span style="font-size:.72rem;color:#a16207;">cités dans les accidents · dotations EPI · habilitations, mais absents de la base salariés</span>
    </div>
    <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;">
      <tbody>${orphans.map((o: any, i: number) => `
        <tr style="border-bottom:1px solid #f8fafc;">
          <td style="padding:9px 18px;font-weight:700;color:#111827;">${escX(o.raw)}</td>
          <td style="padding:9px 12px;">${orphBadge(o.incidents, 'accident(s)', '#dc2626')}${orphBadge(o.dotations, 'EPI', '#7c3aed')}${orphBadge(o.certs, 'habilit.', '#0891b2')}</td>
          <td style="padding:9px 18px;text-align:right;"><button onclick="rhOpenFicheFromOrphan(${i})" style="padding:6px 13px;background:linear-gradient(135deg,${INDIGO},${INDIGO_D});color:white;border:none;border-radius:8px;font-weight:700;font-size:.74rem;cursor:pointer;white-space:nowrap;"><i class="fas fa-user-plus" style="margin-right:5px;"></i>Créer &amp; rattacher</button></td>
        </tr>`).join('')}</tbody>
    </table></div>
  </div>` : ''
  const content = rhNavBar('/rh/employes') + `<div style="background:#f8fafc;min-height:80vh;padding-top:14px;">${orphanBox}${panelEmployes(emps, VD_MAP)}</div>` + ficheModal + js
  return layout('RH — Employés', content, 'service-rh')
}

// ─── PAGE HABILITATIONS ───────────────────────────────────────
export function pageRHHabilitations(dbCerts?: Certification[], dbEmps?: Employe[]): string {
  // Données réelles uniquement (plus de démo) : certifications + salariés depuis la DB
  const certs = dbCerts ?? []
  const emps = dbEmps ?? []
  const empsJson = JSON.stringify(emps.map(e => ({ id: e.id, nom: `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() || e.nom })))
  const styles = `<style>
    .rh-f-btn{padding:6px 15px;border-radius:999px;border:1.5px solid #e2e8f0;background:white;color:#475569;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px;}
    .rh-f-btn:hover{border-color:#c7d2fe;color:#4f46e5;background:#f5f3ff;}
    .rh-sub-cert{transition:all .15s;}
  </style>`
  const js = `<script>
var RH_CERT_EMPS = ${empsJson};
var RH_CERTS = ${sjX(certs.map((c: any) => ({ id: c.id, salarie_id: c.salarie_id, employe_nom: c.employe_nom, type: c.type, intitule: c.intitule, organisme: c.organisme, date_obtention: c.date_obtention, date_expiration: c.date_expiration, critique: c.critique, notes: c.notes })))};
function rhSwitchSub(group,n){
  document.querySelectorAll('.rh-sub-'+group).forEach(function(t,i){ var on=(i===n); t.style.background=on?'#6366f1':'white'; t.style.color=on?'white':'#374151'; t.style.borderColor=on?'#6366f1':'#e2e8f0'; });
  document.querySelectorAll('.rh-sub-panel-'+group).forEach(function(p,i){ p.style.display=i===n?'block':'none'; });
}
function rhFilterCert(type,el){
  el.parentElement.querySelectorAll('.rh-f-btn').forEach(function(b){b.style.background='white';b.style.color='#374151';b.style.borderColor='#e2e8f0';});
  el.style.background='#6366f1';el.style.color='white';el.style.borderColor='#6366f1';
  document.querySelectorAll('.cert-row').forEach(function(r){r.style.display=type==='tous'||r.dataset.type===type?'':'none';});
}
// Réinitialise le formulaire en mode « création » (depuis l'onglet Ajouter)
function rhResetCertForm(){
  var ids=['cert_intitule','cert_org','cert_obtention','cert_expiration','cert_notes'];
  ids.forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
  var em=document.getElementById('cert_emp'); if(em) em.value='';
  var ty=document.getElementById('cert_type'); if(ty) ty.value='habilitation';
  var cr=document.getElementById('cert_critique'); if(cr) cr.checked=false;
  var ed=document.getElementById('cert_edit_id'); if(ed) ed.value='';
  var t=document.getElementById('cert_form_title'); if(t) t.textContent='Ajouter une habilitation / certification';
  var b=document.getElementById('cert_form_btn'); if(b) b.textContent='Enregistrer';
}
// Ouvre le formulaire pré-rempli pour modifier une habilitation existante
function rhEditCert(id){
  var c=RH_CERTS.find(function(x){return String(x.id)===String(id);});
  if(!c){pushNotif('err','fa-times','Habilitation introuvable.');return;}
  var set=function(id,v){var e=document.getElementById(id);if(e)e.value=(v==null?'':v);};
  set('cert_edit_id',c.id);
  set('cert_emp',c.salarie_id); set('cert_type',c.type||'habilitation'); set('cert_intitule',c.intitule);
  set('cert_org',c.organisme); set('cert_obtention',c.date_obtention); set('cert_expiration',c.date_expiration);
  set('cert_notes',c.notes);
  var cr=document.getElementById('cert_critique'); if(cr) cr.checked=!!c.critique;
  var t=document.getElementById('cert_form_title'); if(t) t.textContent='Modifier l\\'habilitation';
  var b=document.getElementById('cert_form_btn'); if(b) b.textContent='Enregistrer les modifications';
  rhSwitchSub('cert',2);
  window.scrollTo({top:0,behavior:'smooth'});
}
async function rhSauvegarderCert(){
  var sel=document.getElementById('cert_emp');
  var salId=sel?sel.value:'';
  var intitule=(document.getElementById('cert_intitule')||{}).value||'';
  if(!salId){pushNotif('err','fa-exclamation','Sélectionnez un salarié.');return;}
  if(!intitule.trim()){pushNotif('err','fa-exclamation','Intitulé requis.');return;}
  var editId=(document.getElementById('cert_edit_id')||{}).value||'';
  var emp=RH_CERT_EMPS.find(function(x){return String(x.id)===String(salId);});
  var body={
    salarie_id:salId,
    employe_nom:emp?emp.nom:null,
    type:(document.getElementById('cert_type')||{}).value||'habilitation',
    intitule:intitule.trim(),
    organisme:(document.getElementById('cert_org')||{}).value||null,
    date_obtention:(document.getElementById('cert_obtention')||{}).value||null,
    date_expiration:(document.getElementById('cert_expiration')||{}).value||null,
    critique:!!(document.getElementById('cert_critique')||{}).checked,
    notes:(document.getElementById('cert_notes')||{}).value||null
  };
  var btn=event&&event.target?event.target:null; if(btn){btn.disabled=true;btn.style.opacity=.6;}
  try{
    var url=editId?('/api/rh/certification/'+encodeURIComponent(editId)):'/api/rh/certification';
    var method=editId?'PATCH':'POST';
    var r=await fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    var j=await r.json();
    if(j.ok){pushNotif('ok','fa-certificate',editId?'Habilitation modifiée.':'Habilitation enregistrée.');setTimeout(function(){softReload();},700);}
    else{pushNotif('err','fa-times','Erreur : '+(j.error||'inconnue'));if(btn){btn.disabled=false;btn.style.opacity=1;}}
  }catch(e){pushNotif('err','fa-times','Erreur réseau.');if(btn){btn.disabled=false;btn.style.opacity=1;}}
}
async function rhRenouvelerCert(id,nom){
  try{
    var r=await fetch('/api/rh/certification/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({statut:'valide',date_obtention:new Date().toISOString().slice(0,10)})});
    var j=await r.json();
    if(j.ok){pushNotif('ok','fa-redo','Renouvellement enregistré pour '+nom);setTimeout(function(){softReload();},700);}
    else pushNotif('err','fa-times','Erreur : '+(j.error||'inconnue'));
  }catch(e){pushNotif('err','fa-times','Erreur réseau.');}
}
async function rhSupprimerCert(id){
  if(!await appConfirm('Supprimer cette habilitation ?'))return;
  try{
    var r=await fetch('/api/rh/certification/'+encodeURIComponent(id),{method:'DELETE'});
    var j=await r.json();
    if(j.ok){pushNotif('ok','fa-trash','Habilitation supprimée.');setTimeout(function(){softReload();},600);}
    else pushNotif('err','fa-times','Erreur : '+(j.error||'inconnue'));
  }catch(e){pushNotif('err','fa-times','Erreur réseau.');}
}
</script>`
  const content = styles + rhNavBar('/rh/habilitations') + `<div style="background:#f8fafc;min-height:80vh;">${panelHabilitations(certs, emps)}</div>` + js
  return layout('RH — Habilitations', content, 'service-rh')
}

// ─── PAGE MATRICE COMPÉTENCES ─────────────────────────────────
export function pageRHCompetences(dbEmps?: Employe[], dbComps?: CompetenceOperateur[], dbProcess?: any[]): string {
  const emps  = dbEmps ?? []
  const comps = (dbComps && dbComps.length > 0) ? dbComps : []
  const procs = (dbProcess && dbProcess.length > 0) ? dbProcess : []
  const js = `<script>
function rhFilterMatrice(act,el){
  // Segmented control : bouton actif = fond blanc + ombre
  document.querySelectorAll('#matf-group .matf-btn').forEach(function(b){ b.style.background='transparent'; b.style.color='#64748b'; b.style.boxShadow='none'; b.setAttribute('data-on','0'); });
  if(el){ el.style.background='#fff'; el.style.color='#4338ca'; el.style.boxShadow='0 1px 3px rgba(0,0,0,.1)'; el.setAttribute('data-on','1'); }
  // « les deux » (both) reste visible quel que soit le site choisi
  var show=function(a){ return act==='tous' || a===act || a==='both'; };
  // Colonnes = en-tête (th) ET toutes les cellules niveau de la colonne (sinon le tableau se désaligne)
  document.querySelectorAll('.matrix-col, .matrix-cell-col').forEach(function(c){ c.style.display=show(c.dataset.act)?'':'none'; });
  // Lignes = process filtrés par activité
  document.querySelectorAll('.matrix-row').forEach(function(r){ r.style.display=show(r.dataset.act)?'':'none'; });
}
function rhSwitchSub(group,n){
  document.querySelectorAll('.rh-sub-'+group).forEach(function(t,i){
    var on=(i===n);
    t.style.background=on?'#6366f1':'white';
    t.style.color=on?'white':'#374151';
    t.style.borderColor=on?'#6366f1':'#e2e8f0';
  });
  document.querySelectorAll('.rh-sub-panel-'+group).forEach(function(p,i){p.style.display=i===n?'block':'none';});
  try{ sessionStorage.setItem('rhCompetencesSub', String(n)); }catch(e){}
}
function rhCycleNiveau(cell){
  if(!cell) return;
  var n=parseInt(cell.dataset.niv||'0',10); var nxt=(n+1)%4;
  var labels=['—','★','★★','★★★'];
  var styles=['background:#f8fafc;color:#94a3b8;','background:#fef9c3;color:#ca8a04;','background:#dcfce7;color:#16a34a;','background:#dbeafe;color:#1d4ed8;'];
  cell.textContent=labels[nxt];
  cell.setAttribute('style', styles[nxt]+'border-radius:6px;padding:4px 8px;font-weight:700;font-size:.82rem;cursor:pointer;user-select:none;');
  cell.dataset.niv=String(nxt);
  var empId=cell.dataset.emp, opCode=cell.dataset.op;
  fetch('/api/rh/competence',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({employe_id:empId, operation:opCode, niveau:nxt})
  }).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban','Sauvegarde échouée'); cell.dataset.niv=String(n); cell.textContent=labels[n]; cell.setAttribute('style', styles[n]+'border-radius:6px;padding:4px 8px;font-weight:700;font-size:.82rem;cursor:pointer;user-select:none;'); return; }
    pushNotif('ok','fa-star','Niveau enregistré : '+labels[nxt]);
  }).catch(function(){
    pushNotif('err','fa-exclamation-circle','Erreur réseau');
    cell.dataset.niv=String(n); cell.textContent=labels[n];
    cell.setAttribute('style', styles[n]+'border-radius:6px;padding:4px 8px;font-weight:700;font-size:.82rem;cursor:pointer;user-select:none;');
  });
}
function rhRestoreCompetencesSub(){ try{ var v=sessionStorage.getItem('rhCompetencesSub'); if(v!=null){ rhSwitchSub('mat', parseInt(v,10)||0); } }catch(e){} }
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', rhRestoreCompetencesSub); } else { rhRestoreCompetencesSub(); }
</script>`
  const content = rhNavBar('/rh/competences') + `<div style="background:#f8fafc;min-height:80vh;">${panelMatrice(emps, comps, procs)}</div>` + js
  return layout('RH — Matrice Compétences', content, 'service-rh')
}

// ─── PAGE GESTION DES TEMPS ───────────────────────────────────
export function pageRHTemps(dbPts?: Pointage[], dbEmps?: any[], dbConges?: any[], dbPresences?: any[]): string {
  const empsT: any[] = dbEmps ?? []
  const congesT: any[] = dbConges ?? []
  const presT: any[] = dbPresences ?? []
  // Noms = source de vérité RH (salariés). Index id → nom complet.
  const empNameById: Record<string, string> = {}
  empsT.forEach((e: any) => { empNameById[String(e.id)] = `${e.prenom ?? ''} ${e.nom ?? ''}`.trim() || String(e.id) })
  // Pas de badgeuse temps réel : à défaut de pointages réels, on dérive les temps depuis
  // la PRÉSENCE saisie (gestion des temps) → vrais noms RH, plus aucune donnée démo.
  const SHIFT_HMS: Record<string, { a: string; d: string; h: number }> = {
    matin:   { a: '06:00', d: '14:00', h: 7.5 },
    apmidi:  { a: '14:00', d: '22:00', h: 7.5 },
    journee: { a: '07:00', d: '17:00', h: 9.5 },
    soir:    { a: '22:00', d: '06:00', h: 7.5 },
  }
  const ptsFromPresence: any[] = presT
    .filter((p: any) => p.shift && p.shift !== 'absent')
    .map((p: any) => {
      const sh = SHIFT_HMS[p.shift] || SHIFT_HMS.journee
      return {
        id: 'PRES-' + p.operateur_id + '-' + p.date_presence,
        employe_id: p.operateur_id,
        employe_nom: empNameById[String(p.operateur_id)] || p.operateur_nom || String(p.operateur_id),
        date_pointage: p.date_presence,
        heure_arrivee: sh.a, heure_depart: sh.d, pause_min: 30,
        heures_travaillees: sh.h,
        type: 'présence', statut: 'valide', valide_par: 'Planning présence',
      }
    })
  const pts: any[] = (dbPts && dbPts.length > 0) ? dbPts : ptsFromPresence
  const modifModal = `
  <div id="rhModifModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9100;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:32px;width:480px;box-shadow:0 24px 64px rgba(0,0,0,.25);">
      <div id="rhModifNom" style="font-size:.95rem;font-weight:800;color:#111827;margin-bottom:20px;"><i class="fas fa-edit" style="color:#6366f1;margin-right:8px;"></i></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Heure arrivée corrigée</label>
          <input id="rhModifArr" type="time" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Heure départ corrigée</label>
          <input id="rhModifDep" type="time" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/></div>
        <div style="grid-column:1/-1;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Motif *</label>
          <input id="rhModifMotif" type="text" placeholder="Motif obligatoire" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;background:#f8fafc;outline:none;"/></div>
      </div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
        <div style="font-size:.72rem;font-weight:700;color:#92400e;margin-bottom:8px;"><i class="fas fa-shield-alt" style="margin-right:6px;"></i>Autorisation RH — ADM001 ou ADM002 uniquement</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <input id="rhAuthMat" type="text" placeholder="Matricule RH" style="border:1.5px solid #fde68a;border-radius:8px;padding:.4rem .7rem;font-size:.82rem;background:white;outline:none;font-family:monospace;text-transform:uppercase;"/>
          <input id="rhAuthCode" type="password" placeholder="Code secret" style="border:1.5px solid #fde68a;border-radius:8px;padding:.4rem .7rem;font-size:.82rem;background:white;outline:none;"/>
        </div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button onclick="rhFermerModif()" style="padding:8px 18px;border-radius:8px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;font-size:.82rem;font-weight:600;color:#374151;">Annuler</button>
        <button onclick="rhValiderModif()" style="padding:8px 20px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;border:none;cursor:pointer;font-size:.82rem;font-weight:700;"><i class="fas fa-check" style="margin-right:5px;"></i>Valider</button>
      </div>
    </div>
  </div>`
  const js = `<script>
function rhSwitchSub(group,n){
  document.querySelectorAll('.rh-sub-'+group).forEach(function(t,i){t.style.background=i===n?'#6366f1':'white';t.style.color=i===n?'white':'#374151';t.style.borderColor=i===n?'#6366f1':'#e2e8f0';});
  document.querySelectorAll('.rh-sub-panel-'+group).forEach(function(p,i){p.style.display=i===n?'block':'none';});
}
var _rhModifId=null,_rhModifNom='';
function rhOuvrirModif(pid,nom,arr,dep){
  _rhModifId=pid;_rhModifNom=nom;
  document.getElementById('rhModifNom').textContent='Modifier — '+nom;
  document.getElementById('rhModifArr').value=arr||'';document.getElementById('rhModifDep').value=dep||'';
  document.getElementById('rhModifMotif').value='';document.getElementById('rhAuthMat').value='';document.getElementById('rhAuthCode').value='';
  document.getElementById('rhModifModal').style.display='flex';
}
function rhFermerModif(){document.getElementById('rhModifModal').style.display='none';}
function rhValiderModif(){
  var mat=document.getElementById('rhAuthMat').value.trim().toUpperCase();
  var code=document.getElementById('rhAuthCode').value.trim();
  var motif=document.getElementById('rhModifMotif').value.trim();
  if(!mat||!code){pushNotif('err','fa-times','Matricule et code requis.');return;}
  if(['ADM001','ADM002'].indexOf(mat)<0){pushNotif('err','fa-ban','Matricule '+mat+' non habilité.');return;}
  if(code.length<3){pushNotif('err','fa-lock','Code incorrect.');return;}
  if(!motif){pushNotif('warn','fa-edit','Motif obligatoire.');return;}
  pushNotif('ok','fa-check','Pointage de '+_rhModifNom+' modifié par '+mat+'.');
  rhFermerModif();
}
function rhSauvegarderCorrection(){pushNotif('warn','fa-edit','Correction soumise.');}
</script>`
  // ── Cumul du mois en cours par salarié (somme heures_travaillees) ──
  const ym = new Date().toISOString().slice(0, 7)
  const cumulByEmp: Record<string, number> = {}
  pts.forEach((p: any) => {
    if ((p.date_pointage || '').startsWith(ym) && p.heures_travaillees) {
      const k = p.employe_nom || p.employe_id || '—'
      cumulByEmp[k] = (cumulByEmp[k] || 0) + Number(p.heures_travaillees)
    }
  })
  const totalMois = Object.values(cumulByEmp).reduce((s, v) => s + v, 0)
  const cumulRows = Object.entries(cumulByEmp).sort((a, b) => b[1] - a[1]).map(([nom, h]) =>
    `<tr><td ${TD}>${escX(nom)}</td><td ${TD} style="text-align:right;font-weight:700;color:#111827;">${h.toFixed(1)} h</td><td ${TD} style="text-align:right;color:${h>=151?'#16a34a':'#d97706'};font-weight:700;">${Math.round(h/151.67*100)}%</td></tr>`).join('')
  const moisLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // ── Demandes de congés ──
  const congesPend = congesT.filter((c: any) => c.statut === 'demande')
  const congesHist = congesT.filter((c: any) => c.statut !== 'demande')
  const TYPE_CONGE: Record<string, string> = { conge_paye: 'Congé payé', rtt: 'RTT', maladie: 'Maladie', sans_solde: 'Sans solde', evenement_familial: 'Événement familial', formation: 'Formation', recup: 'Récupération' }
  const congeStatutBadge = (s: string) => {
    const m: Record<string, string> = { demande: '#fef3c7|#92400e|En attente', valide: '#dcfce7|#16a34a|Validé', refuse: '#fee2e2|#b91c1c|Refusé', annule: '#f1f5f9|#64748b|Annulé' }
    const [bg, co, l] = (m[s] || m.demande).split('|')
    return `<span style="background:${bg};color:${co};border-radius:999px;padding:2px 9px;font-size:.66rem;font-weight:700;">${l}</span>`
  }
  const congeRow = (c: any, pending: boolean) => `<tr>
    <td ${TD}><strong>${escX(c.salarie_nom || c.salarie_id)}</strong></td>
    <td ${TD}>${escX(TYPE_CONGE[c.type] || c.type)}</td>
    <td ${TD} style="font-size:.75rem;">${c.date_debut} → ${c.date_fin}</td>
    <td ${TD} style="text-align:center;font-weight:700;">${c.nb_heures != null ? c.nb_heures + ' h' : (c.nb_jours != null ? (c.nb_jours * 7) + ' h' : '—')}</td>
    <td ${TD}>${congeStatutBadge(c.statut)}</td>
    <td ${TD} style="text-align:center;">${pending
      ? `<button onclick="rhValiderConge('${c.id}','valide')" style="padding:4px 10px;background:#dcfce7;color:#15803d;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;margin-right:4px;"><i class="fas fa-check"></i> Valider</button><button onclick="rhValiderConge('${c.id}','refuse')" style="padding:4px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-times"></i></button>`
      : `<span style="font-size:.7rem;color:#94a3b8;">${escX(c.valide_par || '')}</span>`}</td>
  </tr>`
  const empOptions = empsT.map((e: any) => `<option value="${e.id}">${escX(e.nom)} ${escX(e.prenom || '')}${e.solde_conges != null ? ` (solde ${e.solde_conges}h)` : ''}</option>`).join('')

  const panelCongesCumul = `
  <div style="padding:0 24px 24px;display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">
    <!-- CUMUL MOIS -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;">
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-weight:800;color:#111827;font-size:.88rem;"><i class="fas fa-calendar-check" style="color:${INDIGO};margin-right:7px;"></i>Cumul du mois — ${moisLabel}</span>
        <span style="font-size:.8rem;font-weight:800;color:${INDIGO};">${totalMois.toFixed(1)} h</span>
      </div>
      <table style="width:100%;border-collapse:collapse;"><thead><tr><th ${TH}>Salarié</th><th ${TH} style="text-align:right;">Heures</th><th ${TH} style="text-align:right;">vs 151,67h</th></tr></thead>
      <tbody>${cumulRows || `<tr><td colspan="3" style="text-align:center;padding:24px;color:#9ca3af;">Aucun pointage ce mois.</td></tr>`}</tbody></table>
    </div>
    <!-- CONGÉS -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden;">
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#111827;font-size:.88rem;"><i class="fas fa-umbrella-beach" style="color:#0ea5e9;margin-right:7px;"></i>Absences & congés</div>
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;background:#f8fafc;">
        <div style="font-size:.7rem;font-weight:800;color:#6b7280;text-transform:uppercase;margin-bottom:8px;">Nouvelle demande</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <select id="cg_sal" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 8px;font-size:.78rem;grid-column:1/-1;"><option value="">— Salarié —</option>${empOptions}</select>
          <select id="cg_type" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 8px;font-size:.78rem;">${Object.entries(TYPE_CONGE).map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}</select>
          <input id="cg_motif" type="text" placeholder="Motif" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 8px;font-size:.78rem;"/>
          <input id="cg_debut" type="date" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 8px;font-size:.78rem;"/>
          <input id="cg_fin" type="date" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 8px;font-size:.78rem;"/>
          <input id="cg_heures" type="number" step="1" min="0" placeholder="Heures (auto = j ouvrés × 7)" title="Laisser vide pour calcul auto : jours ouvrés × 7 h" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 8px;font-size:.78rem;grid-column:1/-1;"/>
        </div>
        <button onclick="rhDemandeConge()" style="margin-top:8px;width:100%;padding:8px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;border:none;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane" style="margin-right:5px;"></i>Soumettre la demande</button>
      </div>
      <div style="padding:10px 18px;font-size:.72rem;font-weight:800;color:#92400e;">À valider (${congesPend.length})</div>
      <table style="width:100%;border-collapse:collapse;"><tbody>${congesPend.length ? congesPend.map((c: any) => congeRow(c, true)).join('') : `<tr><td colspan="6" style="text-align:center;padding:14px;color:#9ca3af;font-size:.78rem;">Aucune demande en attente</td></tr>`}</tbody></table>
      ${congesHist.length ? `<div style="padding:10px 18px;font-size:.72rem;font-weight:800;color:#64748b;border-top:1px solid #f1f5f9;">Historique</div><table style="width:100%;border-collapse:collapse;"><tbody>${congesHist.slice(0, 8).map((c: any) => congeRow(c, false)).join('')}</tbody></table>` : ''}
    </div>
  </div>`

  const congeJs = `<script>
function rhDemandeConge(){
  var sal=document.getElementById('cg_sal').value; var d1=document.getElementById('cg_debut').value; var d2=document.getElementById('cg_fin').value;
  if(!sal||!d1||!d2){ pushNotif('err','fa-exclamation-circle','Salarié, date début et fin requis.'); return; }
  fetch('/api/rh/conge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({salarie_id:sal,type:document.getElementById('cg_type').value,date_debut:d1,date_fin:d2,motif:document.getElementById('cg_motif').value,heures:parseFloat((document.getElementById('cg_heures')||{}).value)||null})})
    .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif('ok','fa-paper-plane','Demande de congé soumise ('+(j.conge&&(j.conge.nb_heures!=null?j.conge.nb_heures+' h':j.conge.nb_jours+' j'))+').',4000); setTimeout(function(){softReload();},800); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function rhValiderConge(id,decision){
  fetch('/api/rh/conge/'+encodeURIComponent(id)+'/valider',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:decision,valide_par:'RH'})})
    .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
      pushNotif('ok','fa-check-circle',decision==='valide'?('Congé validé · '+(j.absences_creees||0)+' jour(s) posés au planning.'):'Congé refusé.',5000); setTimeout(function(){softReload();},900); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
</script>`

  const silaeBar = `<div style="padding:14px 24px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
    <span style="font-size:.74rem;font-weight:800;color:#475569;"><i class="fas fa-file-export" style="margin-right:5px;color:#6366f1;"></i>Export paie (Silae)</span>
    <input type="month" id="silaeMois" value="${new Date().toISOString().slice(0, 7)}" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:5px 9px;font-size:.8rem;background:white;"/>
    <button onclick="window.location='/api/rh/export-silae?mois='+encodeURIComponent(document.getElementById('silaeMois').value||'')" style="background:linear-gradient(135deg,#6366f1,#4f46e5);color:white;border:none;border-radius:8px;padding:6px 14px;font-weight:700;font-size:.78rem;cursor:pointer;"><i class="fas fa-download" style="margin-right:5px;"></i>Exporter CSV</button>
    <span style="font-size:.68rem;color:#94a3b8;">Heures normales / sup. / nuit + absences + congés par salarié → à mapper aux rubriques Silae.</span>
  </div>`
  const content = rhNavBar('/rh/temps') + `<div style="background:#f8fafc;min-height:80vh;">${silaeBar}${panelTemps(pts)}${panelCongesCumul}</div>` + modifModal + js + congeJs
  return layout('RH — Gestion des Temps', content, 'service-rh')
}


// ─── PAGE POINTAGE ────────────────────────────────────────────

export function pagePointage(dbPts?: Pointage[], dbEmps?: Employe[]): string {
  const pts = dbPts ?? []
  const _ptToday = new Date().toISOString().slice(0, 10)
  const _fmtH = (t: any) => { if (!t) return ''; const s = String(t); return s.indexOf('T') >= 0 ? s.slice(11, 16) : s.slice(0, 5) }
  // Derniers pointages du jour (réels, depuis la base)
  const recentEvents = pts
    .filter(p => (p.date_pointage ?? '') === _ptToday && p.heure_arrivee)
    .slice(0, 8)
    .map(p => {
      const events: string[] = []
      if (p.heure_arrivee) events.push(`<span style="font-family:monospace;font-weight:700;color:#10b981;">${_fmtH(p.heure_arrivee)}</span> — ${escX(p.employe_nom)} — <span style="color:#10b981;">Arrivée</span>`)
      if (p.heure_depart)  events.push(`<span style="font-family:monospace;font-weight:700;color:#ef4444;">${_fmtH(p.heure_depart)}</span> — ${escX(p.employe_nom)} — <span style="color:#ef4444;">Sortie</span>`)
      return events.join('<br/>')
    }).join('<br/>')

  const CGL = 'display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;'
  const CGI = 'width:100%;border:1.5px solid #e2e8f0;border-radius:9px;padding:.55rem .8rem;font-size:.88rem;background:#f8fafc;outline:none;box-sizing:border-box;color:#374151;'
  const content = `
  <div style="min-height:100vh;background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%);display:flex;flex-direction:column;align-items:center;padding:40px 24px;gap:32px;">

    <!-- Back link -->
    <div style="width:100%;display:flex;justify-content:space-between;align-items:center;">
      <a href="/rh/service" style="display:inline-flex;align-items:center;gap:8px;color:rgba(255,255,255,.6);font-size:.82rem;font-weight:600;text-decoration:none;">
        <i class="fas fa-arrow-left"></i>Service RH
      </a>
      <div style="color:rgba(255,255,255,.4);font-size:.75rem;">${new Date().toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
    </div>

    <!-- Clock -->
    <div style="text-align:center;">
      <div id="ptBigClock" style="font-family:'Courier New',monospace;font-size:5rem;font-weight:900;color:white;letter-spacing:.05em;line-height:1;text-shadow:0 0 40px rgba(99,102,241,.6);"></div>
      <div style="color:rgba(255,255,255,.4);font-size:.9rem;margin-top:8px;letter-spacing:.1em;text-transform:uppercase;">Terminal de Pointage · Seem Semrac</div>
    </div>

    <!-- 4 Action Buttons -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;width:100%;">
      ${([
        { action:'arrivee',     icon:'fa-sign-in-alt',  label:'Arrivée',      sub:'Début de service',   color:'#10b981', glow:'rgba(16,185,129,.4)' },
        { action:'debut_pause', icon:'fa-pause-circle', label:'Début Pause',  sub:'Pause déjeuner',     color:'#f59e0b', glow:'rgba(245,158,11,.4)' },
        { action:'fin_pause',   icon:'fa-play-circle',  label:'Fin Pause',    sub:'Retour en service',  color:'#3b82f6', glow:'rgba(59,130,246,.4)' },
        { action:'sortie',      icon:'fa-sign-out-alt', label:'Sortie',       sub:'Fin de service',     color:'#ef4444', glow:'rgba(239,68,68,.4)' },
      ] as {action:string,icon:string,label:string,sub:string,color:string,glow:string}[]).map(b => `
      <button onclick="ptShowModal('${b.action}','${b.label}')"
        style="background:rgba(255,255,255,.05);border:2px solid ${b.color}40;border-radius:20px;padding:28px 16px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:12px;transition:all .2s;color:white;"
        onmouseenter="this.style.background='${b.color}22';this.style.borderColor='${b.color}';this.style.transform='translateY(-4px)';this.style.boxShadow='0 12px 40px ${b.glow}'"
        onmouseleave="this.style.background='rgba(255,255,255,.05)';this.style.borderColor='${b.color}40';this.style.transform='';this.style.boxShadow=''">
        <div style="width:64px;height:64px;border-radius:50%;background:${b.color}20;border:2px solid ${b.color};display:flex;align-items:center;justify-content:center;">
          <i class="fas ${b.icon}" style="font-size:1.6rem;color:${b.color};"></i>
        </div>
        <div>
          <div style="font-size:1rem;font-weight:800;letter-spacing:.02em;">${b.label}</div>
          <div style="font-size:.72rem;color:rgba(255,255,255,.5);margin-top:3px;">${b.sub}</div>
        </div>
      </button>`).join('')}
    </div>

    <!-- Demande de congé (tous salariés) -->
    <div style="width:100%;">
      <button onclick="cgOpenModal()"
        style="width:100%;background:rgba(20,184,166,.12);border:2px solid rgba(20,184,166,.5);border-radius:16px;padding:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:12px;transition:all .2s;color:white;font-size:.95rem;font-weight:800;"
        onmouseenter="this.style.background='rgba(20,184,166,.25)';this.style.borderColor='#14b8a6'"
        onmouseleave="this.style.background='rgba(20,184,166,.12)';this.style.borderColor='rgba(20,184,166,.5)'">
        <i class="fas fa-umbrella-beach" style="color:#5eead4;font-size:1.2rem;"></i>Faire une demande de congé
      </button>
    </div>

    <!-- Recent events log -->
    <div style="width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:20px;">
      <div style="font-size:.72rem;font-weight:800;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px;"><i class="fas fa-history" style="margin-right:6px;"></i>Derniers pointages du jour</div>
      <div id="ptEventLog" style="font-size:.82rem;color:rgba(255,255,255,.7);line-height:2;">
        ${recentEvents || '<span style="color:rgba(255,255,255,.3);font-style:italic;">Aucun pointage enregistré aujourd\'hui</span>'}
      </div>
    </div>

  </div>

  <!-- Modal pointage -->
  <div id="ptModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9200;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:20px;padding:36px;width:420px;box-shadow:0 24px 80px rgba(0,0,0,.4);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
        <div id="ptModalIcon" style="width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;"></div>
        <div>
          <div id="ptModalTitle" style="font-size:1rem;font-weight:800;color:#111827;"></div>
          <div style="font-size:.72rem;color:#6b7280;margin-top:2px;">Identifiez-vous pour valider le pointage</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px;">
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Matricule *</label>
          <input id="ptMatricule" type="text" placeholder="Votre matricule / identifiant" autocomplete="off"
            style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:.6rem .85rem;font-size:.9rem;background:#f8fafc;outline:none;font-family:monospace;text-transform:uppercase;"
            oninput="this.value=this.value.toUpperCase()"/>
        </div>
        <div>
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Code secret *</label>
          <input id="ptCode" type="password" placeholder="••••" autocomplete="new-password"
            style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:.6rem .85rem;font-size:.9rem;background:#f8fafc;outline:none;"
            onkeydown="if(event.key==='Enter')ptValider()"/>
        </div>
      </div>
      <div id="ptModalErr" style="display:none;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;font-size:.78rem;color:#dc2626;margin-bottom:14px;"></div>
      <div style="display:flex;gap:10px;">
        <button onclick="ptCloseModal()" style="flex:1;padding:11px;border-radius:10px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;font-size:.85rem;font-weight:600;color:#374151;">Annuler</button>
        <button id="ptValiderBtn" onclick="ptValider()" style="flex:2;padding:11px;border-radius:10px;border:none;cursor:pointer;font-size:.85rem;font-weight:700;color:white;background:linear-gradient(135deg,#6366f1,#4f46e5);">
          <i class="fas fa-check" style="margin-right:6px;"></i>Valider le pointage
        </button>
      </div>
    </div>
  </div>

  <!-- Modal demande de congé -->
  <div id="cgModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9300;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:20px;width:560px;max-width:94%;box-shadow:0 24px 80px rgba(0,0,0,.4);overflow:hidden;">
      <div style="padding:18px 24px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#14b8a6,#0d9488);">
        <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-umbrella-beach" style="margin-right:8px;"></i>Demande de congé / absence</div>
        <button onclick="cgCloseModal()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:20px 24px;">
        <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:10px 14px;font-size:.76rem;color:#0f766e;margin-bottom:16px;"><i class="fas fa-info-circle" style="margin-right:5px;"></i>Identifiez-vous avec votre matricule et code. La demande part en validation : Direction (fonctions support) ou Production / Présence opérateurs (opérateurs).</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><label style="${CGL}">Matricule *</label><input id="cg_matricule" type="text" placeholder="ex: MAT-042" style="${CGI}"/></div>
          <div><label style="${CGL}">Code secret *</label><input id="cg_pin" type="password" placeholder="••••" style="${CGI}"/></div>
          <div><label style="${CGL}">Nom *</label><input id="cg_nom" type="text" style="${CGI}"/></div>
          <div><label style="${CGL}">Prénom *</label><input id="cg_prenom" type="text" style="${CGI}"/></div>
          <div><label style="${CGL}">Type</label><select id="cg_type" style="${CGI}"><option value="conge_paye">Congé payé</option><option value="rtt">RTT</option><option value="maladie">Maladie</option><option value="sans_solde">Sans solde</option><option value="autre">Autre</option></select></div>
          <div></div>
          <div><label style="${CGL}">Date début *</label><input id="cg_d1" type="date" style="${CGI}"/></div>
          <div><label style="${CGL}">Date fin *</label><input id="cg_d2" type="date" style="${CGI}"/></div>
          <div style="grid-column:1/-1;"><label style="${CGL}">Motif</label><input id="cg_motif" type="text" placeholder="Optionnel" style="${CGI}"/></div>
        </div>
      </div>
      <div style="padding:14px 24px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="cgCloseModal()" style="padding:10px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:10px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="cgSubmit()" style="padding:10px 18px;background:linear-gradient(135deg,#14b8a6,#0d9488);color:white;border:none;border-radius:10px;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane" style="margin-right:5px;"></i>Envoyer la demande</button>
      </div>
    </div>
  </div>

  <script>
  var _ptAction='', _ptLabel='';
  var PT_COLORS={arrivee:'#10b981',debut_pause:'#f59e0b',fin_pause:'#3b82f6',sortie:'#ef4444'};
  var PT_ICONS={arrivee:'fa-sign-in-alt',debut_pause:'fa-pause-circle',fin_pause:'fa-play-circle',sortie:'fa-sign-out-alt'};
  function ptTick(){
    var d=new Date();
    var h=String(d.getHours()).padStart(2,'0');
    var m=String(d.getMinutes()).padStart(2,'0');
    var s=String(d.getSeconds()).padStart(2,'0');
    var el=document.getElementById('ptBigClock');
    if(el)el.textContent=h+':'+m+':'+s;
  }
  ptTick();setInterval(ptTick,1000);

  function ptShowModal(action,label){
    _ptAction=action;_ptLabel=label;
    var col=PT_COLORS[action]||'#6366f1';
    var ico=PT_ICONS[action]||'fa-clock';
    document.getElementById('ptModalIcon').style.background=col+'20';
    document.getElementById('ptModalIcon').style.border='2px solid '+col;
    document.getElementById('ptModalIcon').innerHTML='<i class="fas '+ico+'" style="color:'+col+'"></i>';
    document.getElementById('ptModalTitle').textContent='Pointage — '+label;
    document.getElementById('ptValiderBtn').style.background='linear-gradient(135deg,'+col+','+col+'cc)';
    document.getElementById('ptMatricule').value='';
    document.getElementById('ptCode').value='';
    document.getElementById('ptModalErr').style.display='none';
    document.getElementById('ptModal').style.display='flex';
    setTimeout(function(){document.getElementById('ptMatricule').focus();},100);
  }
  function ptCloseModal(){document.getElementById('ptModal').style.display='none';}
  // ── Demande de congé depuis la borne ──
  function _cgVal(id){ var e=document.getElementById(id); return e?String(e.value).trim():''; }
  function cgOpenModal(){ var m=document.getElementById('ptMatricule'); if(m&&m.value) document.getElementById('cg_matricule').value=m.value.trim(); document.getElementById('cgModal').style.display='flex'; setTimeout(function(){ var e=document.getElementById('cg_matricule'); if(e&&!e.value) e.focus(); },100); }
  function cgCloseModal(){ document.getElementById('cgModal').style.display='none'; }
  function cgSubmit(){
    var payload={ matricule:_cgVal('cg_matricule'), pin:_cgVal('cg_pin'), nom:_cgVal('cg_nom'), prenom:_cgVal('cg_prenom'), type:_cgVal('cg_type'), date_debut:_cgVal('cg_d1'), date_fin:_cgVal('cg_d2'), motif:_cgVal('cg_motif') };
    if(!payload.matricule||!payload.pin){ pushNotif('err','fa-exclamation-circle','Matricule et code requis.',4000); return; }
    if(!payload.date_debut||!payload.date_fin){ pushNotif('err','fa-exclamation-circle','Dates de début et de fin requises.',4000); return; }
    fetch('/api/pointage/demande-conge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Demande refusée (identifiants ?).',5000); return; }
        cgCloseModal();
        ['cg_matricule','cg_pin','cg_nom','cg_prenom','cg_motif','cg_d1','cg_d2'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
        pushNotif('ok','fa-paper-plane','Demande envoyée ('+(j.nb_heures!=null?j.nb_heures+' h':'')+') → '+(j.routed||'validation')+'. En attente de validation.',7000);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  function ptValider(){
    var mat=document.getElementById('ptMatricule').value.trim().toUpperCase();
    var code=document.getElementById('ptCode').value.trim();
    var err=document.getElementById('ptModalErr');
    if(!mat){err.textContent='Le matricule est requis.';err.style.display='block';return;}
    if(!code){err.textContent='Le code PIN est requis.';err.style.display='block';return;}
    var btn=document.getElementById('ptValiderBtn'); btn.disabled=true; btn.style.opacity=.6;
    fetch('/api/rh/pointage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({matricule:mat,pin:code,action:_ptAction})})
      .then(function(r){return r.json();}).then(function(j){
        btn.disabled=false; btn.style.opacity=1;
        if(!j||!j.ok){ err.textContent=(j&&j.error)||'Pointage refusé.'; err.style.display='block'; return; }
        var col=PT_COLORS[_ptAction]||'#10b981';
        var log=document.getElementById('ptEventLog');
        if(log){ var cur=log.innerHTML; if(cur.indexOf('Aucun pointage')>=0) cur=''; var line='<span style="font-family:monospace;font-weight:700;color:'+col+';">'+(j.heure||'')+'</span> — '+j.operateur+' — <span style="color:'+col+';">'+_ptLabel+'</span>'+(j.heures!=null?(' · '+j.heures+'h'):'')+'<br/>'; log.innerHTML=line+cur; }
        pushNotif('ok','fa-check-circle',j.operateur+' — '+_ptLabel+' enregistré à '+j.heure+(j.heures!=null?(' · '+j.heures+'h travaillées'):''));
        ptCloseModal();
      }).catch(function(){ btn.disabled=false; btn.style.opacity=1; err.textContent='Erreur réseau.'; err.style.display='block'; });
  }
  </script>`

  return layout('Pointage & Temps', content, 'service-pointage')
}
