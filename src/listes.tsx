// ══════════════════════════════════════════════════════════════
// LISTES DE DEMANDES PAR SERVICE – ERP Seem Semrac v2.0
// Spec CDC §4 – Statuts, workflows, KPI par service
// ══════════════════════════════════════════════════════════════
import { escX, layout, pageHeader, afterBox, APP_VERSION } from './shared'
import type { DemandeTravaux, Offre, Commande, DemandeAchat, NonConformite, BonDeLivraison, BonDeTravail, Lot, FournisseurSt } from './types'

const J = (v: any) => JSON.stringify(v)
const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

// ─── DONNÉES DE FALLBACK (maquette) ───────────────────────────
const DT_LIST_DEFAULT: any[] = []

const OFFRES_LIST_DEFAULT: any[] = []

const CMD_LIST_DEFAULT: any[] = []

const DA_LIST_DEFAULT: any[] = []

const NC_LIST_DEFAULT: any[] = []

const BL_LIST_DEFAULT: any[] = []

// ─── MAPPERS DB → FORMAT FRONTEND ─────────────────────────────

function mapDT(d: DemandeTravaux) {
  return {
    id: d.id,
    date: d.date_dt,
    client: d.client_nom ?? '',
    activite: d.activite ?? 'Seem',
    type: d.type_dt ?? '',
    priorite: d.priorite,
    statut: d.statut,
    delai: d.delai ?? '',
    contact: d.contact ?? '',
    montant: d.montant ?? 0,
  }
}

function mapOffre(o: Offre) {
  return {
    id: o.id,
    dt: o.dt_ref ?? '—',
    client: o.client_nom ?? '',
    date: o.date_offre,
    montant: o.montant,
    marge: o.marge ?? 0,
    statut: o.statut,
    validite: o.validite ?? '—',
    rep: o.rep ?? '—',
  }
}

function mapCommande(c: Commande) {
  return {
    id: c.id,
    off: c.offre_id ?? '—',
    client: c.client_nom ?? '',
    date: c.date_cmd,
    montant: c.montant,
    activite: c.activite ?? 'Seem',
    statut: c.statut,
    livraison: c.date_liv ?? '—',
    retard: c.retard,
    bdtTotal: c.bdt_total,
    bdtSoldes: c.bdt_soldes,
  }
}

function mapDA(d: DemandeAchat) {
  return {
    id: d.id,
    demandeur: d.demandeur ?? '',
    type: d.type_da ?? '',
    article: d.article,
    fournisseur: d.fournisseur ?? '',
    qte: d.qte ?? '',
    priorite: d.priorite,
    statut: d.statut,
    date: d.date_da,
    livraison: d.livraison ?? '—',
  }
}

function mapNC(n: NonConformite) {
  return {
    id: n.id,
    date: n.date_nc,
    type: n.type_nc,
    lot: n.lot_ref ?? '—',
    client: n.client_nom ?? '—',
    gravite: n.gravite,
    statut: n.statut,
    detecteur: n.detecteur ?? '',
    operation: n.operation ?? '',
  }
}

function mapBL(b: BonDeLivraison) {
  return {
    id: b.id,
    cmd: b.cmd_id ?? '—',
    client: b.client_nom ?? '',
    date: b.date_bl,
    qte: b.qte,
    statut: b.statut,
    transport: b.transport ?? '',
    otd: b.otd ?? '—',
  }
}

// ─── HELPERS ──────────────────────────────────────────────────
const badge = (statut: string) => {
  const map: Record<string,[string,string,string]> = {
    'Nouveau':           ['#eff6ff','#1d4ed8','#bfdbfe'],
    'Nouveau (DA)':      ['#eff6ff','#1d4ed8','#bfdbfe'],
    'BE en cours':       ['#fff7ed','#b45309','#fed7aa'],
    'Offre envoyée':     ['#faf5ff','#6d28d9','#ddd6fe'],
    'Validation Direction':['#fefce8','#854d0e','#fef08a'],
    'Commande validée':  ['#f0fdf4','#15803d','#bbf7d0'],
    'NC en cours':       ['#fef2f2','#b91c1c','#fecaca'],
    'Envoyée':           ['#eff6ff','#1d4ed8','#bfdbfe'],
    'En attente':        ['#fff7ed','#b45309','#fed7aa'],
    'Acceptée':          ['#f0fdf4','#15803d','#bbf7d0'],
    'Refusée':           ['#fef2f2','#b91c1c','#fecaca'],
    'À valider':         ['#fefce8','#854d0e','#fef08a'],
    'BC envoyé':         ['#faf5ff','#6d28d9','#ddd6fe'],
    'En attente val.':   ['#fff7ed','#b45309','#fed7aa'],
    'Reçue ✅':          ['#f0fdf4','#15803d','#bbf7d0'],
    'Nouveau (ST)':      ['#eff6ff','#1d4ed8','#bfdbfe'],
    'ST commandée':      ['#faf5ff','#6d28d9','#ddd6fe'],
    'Retard fournisseur':['#fef2f2','#b91c1c','#fecaca'],
    '8D en cours':       ['#fff7ed','#b45309','#fed7aa'],
    'Clôturée':          ['#f0fdf4','#15803d','#bbf7d0'],
    '8D envoyé':         ['#faf5ff','#6d28d9','#ddd6fe'],
    'Contention':        ['#fef2f2','#b91c1c','#fecaca'],
    'Retour four.':      ['#fff7ed','#b45309','#fed7aa'],
    'En production':     ['#fff7ed','#b45309','#fed7aa'],
    'Programmée':        ['#eff6ff','#1d4ed8','#bfdbfe'],
    'Expédiée':          ['#f0fdf4','#15803d','#bbf7d0'],
    'Retard – NC':       ['#fef2f2','#b91c1c','#fecaca'],
    'À planifier':       ['#fefce8','#854d0e','#fef08a'],
    'Livré ✅':          ['#f0fdf4','#15803d','#bbf7d0'],
    'Planifié':          ['#eff6ff','#1d4ed8','#bfdbfe'],
    'En préparation':    ['#fff7ed','#b45309','#fed7aa'],
    'Retard ⚠':         ['#fef2f2','#b91c1c','#fecaca'],
  }
  const [bg,color,border] = map[statut] || ['#f8fafc','#6b7280','#e2e8f0']
  return `<span style="background:${bg};color:${color};border:1px solid ${border};border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;white-space:nowrap;">${statut}</span>`
}

const prio = (p: string) => {
  const map: Record<string,string> = { critique:'#fef2f2|#b91c1c|#fecaca', urgent:'#fffbeb|#b45309|#fde68a', normal:'#f0fdf4|#15803d|#bbf7d0' }
  const [bg,c,b] = (map[p]||map.normal).split('|')
  return `<span style="background:${bg};color:${c};border:1px solid ${b};border-radius:999px;padding:2px 8px;font-size:.65rem;font-weight:700;">${p}</span>`
}

const tableHead = (...cols: string[]) => `
<thead>
  <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
    ${cols.map(c=>`<th style="padding:10px 14px;font-size:.68rem;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;text-align:left;white-space:nowrap;">${c}</th>`).join('')}
  </tr>
</thead>`

// ══════════════════════════════════════════════════════════════
// PAGE LISTE DT COMMERCIAL
// ══════════════════════════════════════════════════════════════
export const pageDTListe = (dbData?: DemandeTravaux[]) => {
  const DT_LIST = dbData ? dbData.map(mapDT) : []
  const nb = (s: string) => DT_LIST.filter(d=>d.statut===s).length
  const content = `
${pageHeader('fas fa-list-alt','#3b82f6,#1d4ed8','Suivi Demandes Travaux (DT)','Corinne · Historique complet · Statuts · Filtres activité',['DT','Commercial'])}
<div style="padding:16px 20px;">

  <!-- KPI RAPIDES -->
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:16px;">
    ${[
      {label:'Total DT',val:DT_LIST.length,icon:'fa-file-alt',c:'#3b82f6',bg:'#eff6ff'},
      {label:'Nouvelles',val:DT_LIST.filter(d=>d.statut==='Nouveau').length,icon:'fa-inbox',c:'#6366f1',bg:'#f5f3ff'},
      {label:'BE en cours',val:DT_LIST.filter(d=>d.statut==='BE en cours').length,icon:'fa-drafting-compass',c:'#f59e0b',bg:'#fffbeb'},
      {label:'Offre envoyée',val:DT_LIST.filter(d=>d.statut==='Offre envoyée').length,icon:'fa-paper-plane',c:'#8b5cf6',bg:'#f5f3ff'},
      {label:'Commandées',val:DT_LIST.filter(d=>d.statut==='Commande validée').length,icon:'fa-check-circle',c:'#22c55e',bg:'#f0fdf4'},
      {label:'Critiques',val:DT_LIST.filter(d=>d.priorite==='critique').length,icon:'fa-exclamation-triangle',c:'#ef4444',bg:'#fef2f2'},
    ].map(s=>`
    <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);border:1px solid #f1f5f9;text-align:center;">
      <div style="width:36px;height:36px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
        <i class="fas ${s.icon}" style="color:${s.c};font-size:.9rem;"></i>
      </div>
      <div style="font-size:1.5rem;font-weight:900;color:#111827;">${s.val}</div>
      <div style="font-size:.65rem;color:#6b7280;">${s.label}</div>
    </div>`).join('')}
  </div>

  <!-- FILTRE + BOUTON -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
    <div style="display:flex;gap:4px;background:white;border-radius:12px;padding:4px;box-shadow:0 1px 3px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
      <button onclick="filterDT('all')" id="fdt-all" style="padding:5px 14px;border-radius:8px;background:transparent;color:#64748b;border:none;font-size:.75rem;font-weight:700;cursor:pointer;">Toutes</button>
      <button onclick="filterDT('Seem')" id="fdt-Seem" style="padding:5px 14px;border-radius:8px;background:transparent;color:#64748b;border:none;font-size:.75rem;font-weight:600;cursor:pointer;">Seem</button>
      <button onclick="filterDT('Semrac')" id="fdt-Semrac" style="padding:5px 14px;border-radius:8px;background:transparent;color:#64748b;border:none;font-size:.75rem;font-weight:600;cursor:pointer;">Semrac</button>
    </div>
    <div style="display:flex;gap:4px;background:white;border-radius:12px;padding:4px;box-shadow:0 1px 3px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
      <button onclick="toggleEnCours(true)" id="btn-encours" style="padding:5px 14px;border-radius:8px;background:#3b82f6;color:white;border:none;font-size:.75rem;font-weight:700;cursor:pointer;"><i class="fas fa-eye" style="margin-right:5px;"></i>DT en cours</button>
      <button onclick="toggleEnCours(false)" id="btn-toutes" style="padding:5px 14px;border-radius:8px;background:transparent;color:#64748b;border:none;font-size:.75rem;font-weight:600;cursor:pointer;">Toutes les DT</button>
    </div>
    <input type="text" placeholder="Rechercher client, DT…" oninput="searchDT(this.value)" style="border:1.5px solid #e2e8f0;border-radius:10px;padding:7px 14px;font-size:.82rem;outline:none;background:#f8fafc;flex:1;max-width:280px;"/>
    <a href="/commercial/dt" style="margin-left:auto;display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;padding:9px 20px;border-radius:10px;font-weight:700;font-size:.82rem;text-decoration:none;box-shadow:0 2px 8px rgba(59,130,246,.3);">
      <i class="fas fa-plus"></i> Nouvelle DT
    </a>
  </div>
  <div style="margin-bottom:10px;display:flex;align-items:center;gap:8px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:8px 14px;font-size:.78rem;color:#1d4ed8;">
    <i class="fas fa-info-circle"></i> <strong>Mode "DT en cours"</strong> : seules les DT actives sont affichées (hors Acceptées et Refus). Cliquez "Toutes les DT" pour voir l'historique complet.
  </div>

  <!-- TABLE DT -->
  <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;" id="dtTable">
      ${tableHead('N° DT','Date','Client','Activité','Type','Priorité','Statut','Délai souhaité','Montant €','Actions')}
      <tbody id="dtBody">
        ${DT_LIST.map(d=>`
        <tr class="dt-row" data-act="${d.activite}" data-statut="${d.statut}" style="border-bottom:1px solid #f8fafc;transition:background .15s;" onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background=''">
          <td style="padding:11px 14px;"><a href="/commercial/dt" style="font-weight:800;color:#3b82f6;text-decoration:none;font-size:.82rem;font-family:monospace;">${d.id}</a></td>
          <td style="padding:11px 14px;font-size:.78rem;color:#6b7280;">${d.date}</td>
          <td style="padding:11px 14px;font-size:.82rem;font-weight:700;color:#111827;">${escX(d.client)}</td>
          <td style="padding:11px 14px;"><span style="background:${d.activite==='Seem'?'#dbeafe':'#fce7f3'};color:${d.activite==='Seem'?'#1d4ed8':'#9d174d'};border-radius:6px;padding:2px 9px;font-size:.68rem;font-weight:700;">${escX(d.activite)}</span></td>
          <td style="padding:11px 14px;font-size:.75rem;color:#6b7280;">${escX(d.type)}</td>
          <td style="padding:11px 14px;">${prio(d.priorite)}</td>
          <td style="padding:11px 14px;">${badge(d.statut)}</td>
          <td style="padding:11px 14px;font-size:.75rem;color:${new Date(d.delai)<new Date('2026-03-15')?'#b91c1c':'#374151'};font-weight:${new Date(d.delai)<new Date('2026-03-15')?'700':'400'};">${d.delai}</td>
          <td style="padding:11px 14px;font-size:.8rem;font-weight:700;color:#374151;">${d.montant>0?d.montant.toLocaleString()+' €':'—'}</td>
          <td style="padding:11px 14px;"><div style="display:flex;gap:5px;">
            <a href="/commercial/dt" style="padding:4px 10px;background:#eff6ff;color:#1d4ed8;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;border:1px solid #bfdbfe;">Voir</a>
            <a href="/be/analyse" style="padding:4px 10px;background:#fff7ed;color:#b45309;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;border:1px solid #fed7aa;">BE →</a>
          </div></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>
<script>
const DT_FAITES = ['Commande validée','Acceptée','Refus'];
let dtEnCoursMode = true;
let dtActFilter = 'all';
function applyDTFilters() {
  document.querySelectorAll('.dt-row').forEach(r=>{
    const act = r.dataset.act;
    const statut = r.dataset.statut || '';
    const actMatch = dtActFilter==='all' || act===dtActFilter;
    const coursMatch = !dtEnCoursMode || !DT_FAITES.includes(statut);
    r.style.display = (actMatch && coursMatch) ? '' : 'none';
  });
}
function filterDT(act) {
  dtActFilter = act;
  applyDTFilters();
  ['all','Seem','Semrac'].forEach(a=>{
    const btn=document.getElementById('fdt-'+a);
    if(btn){btn.style.background=a===act?'#3b82f6':'transparent';btn.style.color=a===act?'white':'#64748b';}
  });
}
function toggleEnCours(mode) {
  dtEnCoursMode = mode;
  applyDTFilters();
  document.getElementById('btn-encours').style.background = mode?'#3b82f6':'transparent';
  document.getElementById('btn-encours').style.color = mode?'white':'#64748b';
  document.getElementById('btn-toutes').style.background = !mode?'#3b82f6':'transparent';
  document.getElementById('btn-toutes').style.color = !mode?'white':'#64748b';
}
function searchDT(v) {
  const q=v.toLowerCase();
  document.querySelectorAll('.dt-row').forEach(r=>{
    r.style.display=r.textContent.toLowerCase().includes(q)?'':'none';
  });
}
// Appliquer le filtre "en cours" par défaut au chargement
document.addEventListener('DOMContentLoaded', () => applyDTFilters());
</script>`
  return layout('Liste DT – Commercial', content, 'dt')
}

// ══════════════════════════════════════════════════════════════
// PAGE LISTE OFFRES COMMERCIALES
// ══════════════════════════════════════════════════════════════
export const pageOffresListe = (dbData?: Offre[]) => {
  const OFFRES_LIST = dbData ? dbData.map(mapOffre) : []
  const total = OFFRES_LIST.reduce((s,o)=>s+o.montant,0)
  const acceptees = OFFRES_LIST.filter(o=>o.statut==='Acceptée')
  const tauxConv = Math.round(acceptees.length/OFFRES_LIST.length*100)
  const content = `
${pageHeader('fas fa-file-invoice-dollar','#6366f1,#4338ca','Suivi Offres Commerciales','Corinne · Taux conversion · Montants · Statuts relances',['OFF','PRC1-D5'])}
<div style="padding:16px 20px;">
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px;">
    ${[
      {label:'Total offres',val:OFFRES_LIST.length,icon:'fa-file-invoice-dollar',c:'#6366f1',bg:'#f5f3ff'},
      {label:'En attente',val:OFFRES_LIST.filter(o=>o.statut==='En attente'||o.statut==='Envoyée').length,icon:'fa-clock',c:'#f59e0b',bg:'#fffbeb'},
      {label:'Acceptées',val:acceptees.length,icon:'fa-handshake',c:'#22c55e',bg:'#f0fdf4'},
      {label:'Taux conv.',val:tauxConv+'%',icon:'fa-percent',c:'#3b82f6',bg:'#eff6ff'},
      {label:'CA pipeline',val:(total/1000).toFixed(0)+'k€',icon:'fa-euro-sign',c:'#10b981',bg:'#f0fdf4'},
    ].map(s=>`
    <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);border:1px solid #f1f5f9;text-align:center;">
      <div style="width:36px;height:36px;border-radius:10px;background:${s.bg};display:flex;align-items:center;justify-content:center;margin:0 auto 8px;">
        <i class="fas ${s.icon}" style="color:${s.c};font-size:.9rem;"></i>
      </div>
      <div style="font-size:1.4rem;font-weight:900;color:#111827;">${s.val}</div>
      <div style="font-size:.65rem;color:#6b7280;">${s.label}</div>
    </div>`).join('')}
  </div>
  <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
    <a href="/commercial/offre" style="display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;padding:9px 20px;border-radius:10px;font-weight:700;font-size:.82rem;text-decoration:none;">
      <i class="fas fa-plus"></i> Nouvelle Offre
    </a>
  </div>
  <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      ${tableHead('N° Offre','DT associé','Client','Date','Montant HT','Marge %','Validité','Statut','Réponse','Actions')}
      <tbody>
        ${OFFRES_LIST.map(o=>`
        <tr style="border-bottom:1px solid #f8fafc;" onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background=''">
          <td style="padding:11px 14px;font-weight:800;color:#6366f1;font-size:.82rem;font-family:monospace;">${o.id}</td>
          <td style="padding:11px 14px;font-size:.78rem;color:#3b82f6;">${escX(o.dt)}</td>
          <td style="padding:11px 14px;font-size:.82rem;font-weight:700;">${escX(o.client)}</td>
          <td style="padding:11px 14px;font-size:.75rem;color:#6b7280;">${o.date}</td>
          <td style="padding:11px 14px;font-weight:700;color:#374151;">${o.montant.toLocaleString()} €</td>
          <td style="padding:11px 14px;"><span style="font-weight:700;color:${o.marge>=25?'#15803d':o.marge>=18?'#b45309':'#b91c1c'};">${o.marge}%</span></td>
          <td style="padding:11px 14px;font-size:.75rem;color:#6b7280;">${escX(o.validite)}</td>
          <td style="padding:11px 14px;">${badge(o.statut)}</td>
          <td style="padding:11px 14px;font-size:.75rem;color:#6b7280;">${escX(o.rep)}</td>
          <td style="padding:11px 14px;"><a href="/commercial/offre" style="padding:4px 10px;background:#f5f3ff;color:#6366f1;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;border:1px solid #ddd6fe;">Voir</a></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>`
  return layout('Offres Commerciales', content, 'offre')
}

// ══════════════════════════════════════════════════════════════
// PAGE LISTE COMMANDES
// ══════════════════════════════════════════════════════════════
export const pageCmdListe = (dbData?: Commande[]) => {
  const CMD_LIST = dbData ? dbData.map(mapCommande) : []
  const caTotal = CMD_LIST.filter(c=>c.statut!=='À planifier').reduce((s,c)=>s+c.montant,0)
  const content = `
${pageHeader('fas fa-clipboard-check','#0ea5e9,#0284c7','Suivi Commandes Clients','Statuts · OTD · Livraisons · Pipeline',['CMD','OTD'])}
<div style="padding:16px 20px;">
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px;">
    ${[
      {label:'Commandes',val:CMD_LIST.length,icon:'fa-clipboard-list',c:'#0ea5e9',bg:'#f0f9ff'},
      {label:'En production',val:CMD_LIST.filter(c=>c.statut==='En production'||c.statut==='Programmée').length,icon:'fa-industry',c:'#f59e0b',bg:'#fffbeb'},
      {label:'Expédiées',val:CMD_LIST.filter(c=>c.statut==='Expédiée').length,icon:'fa-truck',c:'#22c55e',bg:'#f0fdf4'},
      {label:'En retard',val:CMD_LIST.filter(c=>c.retard).length,icon:'fa-exclamation-triangle',c:'#ef4444',bg:'#fef2f2'},
      {label:'CA actif',val:(caTotal/1000).toFixed(0)+'k€',icon:'fa-euro-sign',c:'#10b981',bg:'#f0fdf4'},
    ].map(s=>`
    <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);border:1px solid #f1f5f9;text-align:center;">
      <i class="fas ${s.icon}" style="color:${s.c};font-size:1rem;margin-bottom:6px;display:block;"></i>
      <div style="font-size:1.4rem;font-weight:900;color:#111827;">${s.val}</div>
      <div style="font-size:.65rem;color:#6b7280;">${s.label}</div>
    </div>`).join('')}
  </div>
  <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      ${tableHead('N° CMD','Offre','Client','Date','Montant','Activité','Statut','Avancement','Lots traités','Livraison','OTD','Actions')}
      <tbody>
        ${CMD_LIST.map(c=>{
          const pct = c.bdtTotal>0?Math.round(c.bdtSoldes/c.bdtTotal*100):0;
          const barCol = pct>=100?'#22c55e':pct>=50?'#f59e0b':pct>0?'#f97316':'#e2e8f0';
          return `
        <tr style="border-bottom:1px solid #f8fafc;${c.retard?'background:#fff5f5;':''}" onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background='${c.retard?'#fff5f5':''}'">
          <td style="padding:11px 14px;font-weight:800;color:#0ea5e9;font-size:.82rem;font-family:monospace;">${c.id}</td>
          <td style="padding:11px 14px;font-size:.75rem;color:#6b7280;">${escX(c.off)}</td>
          <td style="padding:11px 14px;font-weight:700;">${escX(c.client)}</td>
          <td style="padding:11px 14px;font-size:.75rem;color:#6b7280;">${c.date}</td>
          <td style="padding:11px 14px;font-weight:700;">${c.montant.toLocaleString()} €</td>
          <td style="padding:11px 14px;"><span style="background:${c.activite==='Seem'?'#dbeafe':'#fce7f3'};color:${c.activite==='Seem'?'#1d4ed8':'#9d174d'};border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:700;">${c.activite}</span></td>
          <td style="padding:11px 14px;">${badge(c.statut)}</td>
          <td style="padding:11px 14px;min-width:110px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="flex:1;height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:${barCol};border-radius:4px;transition:width .3s;"></div>
              </div>
              <span style="font-size:.72rem;font-weight:700;color:${pct>=100?'#15803d':pct>=50?'#b45309':'#6b7280'};">${pct}%</span>
            </div>
          </td>
          <td style="padding:11px 14px;text-align:center;font-size:.78rem;">
            <span style="font-weight:700;color:#22c55e;">${c.bdtSoldes}</span><span style="color:#9ca3af;">/</span><span style="font-weight:600;">${c.bdtTotal}</span><span style="color:#9ca3af;font-size:.68rem;"> BDT</span>
          </td>
          <td style="padding:11px 14px;font-size:.75rem;color:${c.retard?'#b91c1c':'#374151'};font-weight:${c.retard?700:400};">${c.livraison}${c.retard?' ⚠':''}</td>
          <td style="padding:11px 14px;"><span style="font-weight:700;color:${c.retard?'#b91c1c':'#15803d'};font-size:.75rem;">${c.retard?'En retard':'—'}</span></td>
          <td style="padding:11px 14px;"><div style="display:flex;gap:4px;">
            <a href="/production/ordonnancement" style="padding:4px 9px;background:#f0f9ff;color:#0284c7;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;border:1px solid #bae6fd;">Prod →</a>
            <a href="/expedition/bl" style="padding:4px 9px;background:#f0fdf4;color:#15803d;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;border:1px solid #bbf7d0;">BL →</a>
          </div></td>
        </tr>`}).join('')}
      </tbody>
    </table>
  </div>
</div>`
  return layout('Commandes Clients', content, 'cmd')
}

// ══════════════════════════════════════════════════════════════
// PAGE LISTE DEMANDES D'ACHAT
// ══════════════════════════════════════════════════════════════
export const pageDAListe = (dbData?: DemandeAchat[]) => {
  const DA_LIST = dbData ? dbData.map(mapDA) : []
  const content = `
${pageHeader('fas fa-shopping-cart','#10b981,#059669','Suivi Demandes d\'Achat (DA)','Morgane · BC fournisseurs · Statuts · Alertes délais',['DA','Stock','EN9100'])}
<div style="padding:16px 20px;">
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:16px;">
    ${[
      {label:'Total DA',val:DA_LIST.length,icon:'fa-shopping-cart',c:'#10b981',bg:'#f0fdf4'},
      {label:'Nouvelles',val:DA_LIST.filter(d=>d.statut==='Nouveau').length,icon:'fa-inbox',c:'#6366f1',bg:'#f5f3ff'},
      {label:'BC envoyés',val:DA_LIST.filter(d=>d.statut==='BC envoyé').length,icon:'fa-paper-plane',c:'#3b82f6',bg:'#eff6ff'},
      {label:'Reçus ✅',val:DA_LIST.filter(d=>d.statut==='Reçue ✅').length,icon:'fa-check-circle',c:'#22c55e',bg:'#f0fdf4'},
      {label:'Retards',val:DA_LIST.filter(d=>d.statut==='Retard fournisseur').length,icon:'fa-exclamation-triangle',c:'#ef4444',bg:'#fef2f2'},
      {label:'Critiques',val:DA_LIST.filter(d=>d.priorite==='critique').length,icon:'fa-fire',c:'#dc2626',bg:'#fef2f2'},
    ].map(s=>`
    <div style="background:white;border-radius:12px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);text-align:center;">
      <i class="fas ${s.icon}" style="color:${s.c};font-size:.95rem;margin-bottom:6px;display:block;"></i>
      <div style="font-size:1.35rem;font-weight:900;color:#111827;">${s.val}</div>
      <div style="font-size:.63rem;color:#6b7280;">${s.label}</div>
    </div>`).join('')}
  </div>
  <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
    <a href="/achats/demande" style="display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#10b981,#059669);color:white;padding:9px 20px;border-radius:10px;font-weight:700;font-size:.82rem;text-decoration:none;">
      <i class="fas fa-plus"></i> Nouvelle DA
    </a>
  </div>
  <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      ${tableHead('N° DA','Demandeur','Type','Article','Fournisseur','Qté','Priorité','Statut','Livraison','Actions')}
      <tbody>
        ${DA_LIST.map(d=>`
        <tr style="border-bottom:1px solid #f8fafc;${d.statut==='Retard fournisseur'?'background:#fff5f5;':''}" onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background='${d.statut==='Retard fournisseur'?'#fff5f5':''}'">
          <td style="padding:10px 14px;font-weight:800;color:#10b981;font-size:.82rem;font-family:monospace;">${d.id}</td>
          <td style="padding:10px 14px;font-size:.78rem;font-weight:600;">${escX(d.demandeur)}</td>
          <td style="padding:10px 14px;font-size:.72rem;color:#6b7280;">${escX(d.type)}</td>
          <td style="padding:10px 14px;font-size:.8rem;font-weight:600;">${escX(d.article)}</td>
          <td style="padding:10px 14px;font-size:.75rem;">${escX(d.fournisseur)}</td>
          <td style="padding:10px 14px;font-size:.75rem;color:#374151;">${escX(d.qte)}</td>
          <td style="padding:10px 14px;">${prio(d.priorite)}</td>
          <td style="padding:10px 14px;">${badge(d.statut)}</td>
          <td style="padding:10px 14px;font-size:.75rem;color:${d.statut==='Retard fournisseur'?'#b91c1c':'#374151'};font-weight:${d.statut==='Retard fournisseur'?700:400};">${d.livraison}${d.statut==='Retard fournisseur'?' ⚠':''}</td>
          <td style="padding:10px 14px;"><a href="/achats/demande" style="padding:4px 9px;background:#f0fdf4;color:#059669;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;border:1px solid #bbf7d0;">Voir</a></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>`
  return layout('Demandes d\'Achat', content, 'da')
}

// ══════════════════════════════════════════════════════════════
// PAGE LISTE NON-CONFORMITÉS
// ══════════════════════════════════════════════════════════════
export const pageNCListe = (dbData?: NonConformite[]) => {
  const NC_LIST = dbData ? dbData.map(mapNC) : []
  const content = `
${pageHeader('fas fa-exclamation-triangle','#ef4444,#dc2626','Suivi Non-Conformités (NC)','Pierre-Yves / Agathe · NC internes, fournisseurs, clients · 8D',['NC','8D','EN9100 10.2'])}
<div style="padding:16px 20px;">
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px;">
    ${[
      {label:'Total NC',val:NC_LIST.length,icon:'fa-exclamation-triangle',c:'#ef4444',bg:'#fef2f2'},
      {label:'Critiques/Bloquantes',val:NC_LIST.filter(n=>n.gravite==='Critique'||n.gravite==='Bloquante').length,icon:'fa-fire',c:'#b91c1c',bg:'#fef2f2'},
      {label:'8D en cours',val:NC_LIST.filter(n=>n.statut.includes('8D')).length,icon:'fa-project-diagram',c:'#f59e0b',bg:'#fffbeb'},
      {label:'Clôturées',val:NC_LIST.filter(n=>n.statut==='Clôturée').length,icon:'fa-check-circle',c:'#22c55e',bg:'#f0fdf4'},
      {label:'NC Client',val:NC_LIST.filter(n=>n.type==='NC Client').length,icon:'fa-user-times',c:'#6366f1',bg:'#f5f3ff'},
    ].map(s=>`
    <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);text-align:center;">
      <i class="fas ${s.icon}" style="color:${s.c};font-size:1rem;margin-bottom:6px;display:block;"></i>
      <div style="font-size:1.4rem;font-weight:900;color:#111827;">${s.val}</div>
      <div style="font-size:.65rem;color:#6b7280;">${s.label}</div>
    </div>`).join('')}
  </div>
  <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
    <a href="/qualite/anomalie" style="display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;padding:9px 20px;border-radius:10px;font-weight:700;font-size:.82rem;text-decoration:none;">
      <i class="fas fa-plus"></i> Créer une NC
    </a>
  </div>
  <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      ${tableHead('N° NC','Date','Type','LOT/BDT','Client','Opération','Gravité','Statut','Détecteur','Actions')}
      <tbody>
        ${NC_LIST.map(n=>`
        <tr style="border-bottom:1px solid #f8fafc;${n.gravite==='Bloquante'?'background:#fff5f5;':''}" onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background='${n.gravite==='Bloquante'?'#fff5f5':''}'">
          <td style="padding:10px 14px;font-weight:800;color:#ef4444;font-size:.82rem;font-family:monospace;">${n.id}</td>
          <td style="padding:10px 14px;font-size:.75rem;color:#6b7280;">${n.date}</td>
          <td style="padding:10px 14px;font-size:.72rem;font-weight:600;color:#374151;">${escX(n.type)}</td>
          <td style="padding:10px 14px;font-size:.75rem;color:#6366f1;font-family:monospace;">${escX(n.lot)}</td>
          <td style="padding:10px 14px;font-size:.78rem;font-weight:600;">${escX(n.client)}</td>
          <td style="padding:10px 14px;font-size:.72rem;color:#6b7280;">${escX(n.operation)}</td>
          <td style="padding:10px 14px;">
            <span style="background:${n.gravite==='Bloquante'||n.gravite==='Critique'?'#fef2f2':n.gravite==='Majeure'?'#fffbeb':'#f8fafc'};color:${n.gravite==='Bloquante'||n.gravite==='Critique'?'#b91c1c':n.gravite==='Majeure'?'#b45309':'#6b7280'};border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:700;">${n.gravite}</span>
          </td>
          <td style="padding:10px 14px;">${badge(n.statut)}</td>
          <td style="padding:10px 14px;font-size:.72rem;color:#6b7280;">${escX(n.detecteur)}</td>
          <td style="padding:10px 14px;"><div style="display:flex;gap:4px;">
            <a href="/qualite/anomalie" style="padding:4px 9px;background:#fef2f2;color:#b91c1c;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;border:1px solid #fecaca;">NC</a>
            <a href="/qualite/8d" style="padding:4px 9px;background:#fffbeb;color:#b45309;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;border:1px solid #fde68a;">8D</a>
          </div></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>`
  return layout('Non-Conformités', content, 'anomalie')
}

// ══════════════════════════════════════════════════════════════
// PAGE LISTE BL / EXPÉDITIONS
// ══════════════════════════════════════════════════════════════
export const pageBLListe = (dbData?: BonDeLivraison[]) => {
  const BL_LIST = dbData ? dbData.map(mapBL) : []
  const content = `
${pageHeader('fas fa-truck-loading','#06b6d4,#0891b2','Suivi Bons de Livraison / Expéditions','Sabine · BLI · OTD · Suivi transport',['BL','OTD','Expédition'])}
<div style="padding:16px 20px;">
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px;">
    ${[
      {label:'Total BL',val:BL_LIST.length,icon:'fa-clipboard-list',c:'#06b6d4',bg:'#f0fdff'},
      {label:'Livrés',val:BL_LIST.filter(b=>b.statut==='Livré ✅').length,icon:'fa-check-circle',c:'#22c55e',bg:'#f0fdf4'},
      {label:'En préparation',val:BL_LIST.filter(b=>b.statut==='En préparation'||b.statut==='Planifié').length,icon:'fa-boxes',c:'#f59e0b',bg:'#fffbeb'},
      {label:'Retards',val:BL_LIST.filter(b=>b.statut==='Retard ⚠').length,icon:'fa-exclamation-triangle',c:'#ef4444',bg:'#fef2f2'},
      {label:'OTD',val:Math.round(BL_LIST.filter(b=>b.otd==='À temps').length/BL_LIST.filter(b=>b.otd!=='—').length*100)+'%',icon:'fa-tachometer-alt',c:'#10b981',bg:'#f0fdf4'},
    ].map(s=>`
    <div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);text-align:center;">
      <i class="fas ${s.icon}" style="color:${s.c};font-size:1rem;margin-bottom:6px;display:block;"></i>
      <div style="font-size:1.4rem;font-weight:900;color:#111827;">${s.val}</div>
      <div style="font-size:.65rem;color:#6b7280;">${s.label}</div>
    </div>`).join('')}
  </div>
  <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
    <a href="/expedition/bl" style="display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:white;padding:9px 20px;border-radius:10px;font-weight:700;font-size:.82rem;text-decoration:none;">
      <i class="fas fa-plus"></i> Créer un BL
    </a>
  </div>
  <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      ${tableHead('N° BLI','Commande','Client','Date expé.','Qté','Transport','Statut','OTD','Actions')}
      <tbody>
        ${BL_LIST.map(b=>`
        <tr style="border-bottom:1px solid #f8fafc;" onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background=''">
          <td style="padding:10px 14px;font-weight:800;color:#06b6d4;font-size:.82rem;font-family:monospace;">${b.id}</td>
          <td style="padding:10px 14px;font-size:.75rem;color:#6b7280;">${escX(b.cmd)}</td>
          <td style="padding:10px 14px;font-weight:700;">${escX(b.client)}</td>
          <td style="padding:10px 14px;font-size:.75rem;color:#374151;">${b.date}</td>
          <td style="padding:10px 14px;font-size:.78rem;font-weight:600;">${b.qte} pcs</td>
          <td style="padding:10px 14px;font-size:.72rem;color:#6b7280;">${escX(b.transport)}</td>
          <td style="padding:10px 14px;">${badge(b.statut)}</td>
          <td style="padding:10px 14px;"><span style="font-weight:700;color:${b.otd==='À temps'?'#15803d':b.otd==='—'?'#9ca3af':'#b91c1c'};font-size:.75rem;">${b.otd}</span></td>
          <td style="padding:10px 14px;"><a href="/expedition/bl" style="padding:4px 9px;background:#f0fdff;color:#0891b2;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;border:1px solid #a5f3fc;">Voir</a></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>`
  return layout('Expéditions / BL', content, 'bl')
}

// ══════════════════════════════════════════════════════════════
// PAGE LISTE BDT – PRODUCTION (Sylvie / Lénaïck)
// ══════════════════════════════════════════════════════════════
const BDT_LISTE_DEFAULT: any[] = []

const bdtStatutColor: Record<string,[string,string,string]> = {
  'Soldé ✅':     ['#f0fdf4','#15803d','#bbf7d0'],
  'En cours':     ['#fffbeb','#b45309','#fde68a'],
  'Programmé':    ['#eff6ff','#1d4ed8','#bfdbfe'],
  'Reçu':         ['#f5f3ff','#5b21b6','#ddd6fe'],
  'Attente mat.': ['#fef2f2','#b91c1c','#fecaca'],
  'Pending':      ['#fef2f2','#b91c1c','#fecaca'],
  'ST en cours':  ['#f5f3ff','#6d28d9','#ddd6fe'],
}
const bdtBadge = (s: string) => {
  const [bg,c,b] = bdtStatutColor[s] || ['#f8fafc','#6b7280','#e2e8f0']
  return `<span style="background:${bg};color:${c};border:1px solid ${b};border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;white-space:nowrap;">${s}</span>`
}

function mapBDT(b: BonDeTravail) {
  return { id:b.id, lot:b.lot_id??'—', client:b.client_nom??'', piece:b.piece, op:b.operation, operateur:b.operateur_id??'—', statut:b.statut, priorite:b.priorite, debut:b.debut!=null?String(b.debut):'—', duree:b.duree, fin:'—', activite:b.activite??'Seem', material_ok:b.matiere_ok, pv:b.pv_requis }
}

export const pageBDTListe = (dbData?: BonDeTravail[]) => {
  const BDT_LISTE = dbData ? dbData.map(mapBDT) : []
  const soldes = BDT_LISTE.filter(b=>b.statut==='Soldé ✅').length
  const enCours = BDT_LISTE.filter(b=>b.statut==='En cours').length
  const pending = BDT_LISTE.filter(b=>b.statut==='Pending'||b.statut==='Attente mat.').length
  const critiques = BDT_LISTE.filter(b=>b.priorite==='critique').length

  const content = `
${pageHeader('fas fa-hard-hat','#f97316,#ea580c','Suivi BDT – Production','Sylvie · Lénaïck · Statuts · Priorités · Opérateurs · Sous-traitance',['BDT','Production','EN9100'])}
<div style="padding:16px 20px;">

  <!-- KPIs -->
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:16px;">
    ${[
      {label:'Total BDT',val:BDT_LISTE.length,icon:'fa-clipboard-list',c:'#f97316',bg:'#fff7ed'},
      {label:'En cours',val:enCours,icon:'fa-play-circle',c:'#f59e0b',bg:'#fffbeb'},
      {label:'Programmés',val:BDT_LISTE.filter(b=>b.statut==='Programmé').length,icon:'fa-calendar-check',c:'#3b82f6',bg:'#eff6ff'},
      {label:'Soldés ✅',val:soldes,icon:'fa-check-double',c:'#22c55e',bg:'#f0fdf4'},
      {label:'Bloqués',val:pending,icon:'fa-exclamation-triangle',c:'#ef4444',bg:'#fef2f2'},
      {label:'Critiques',val:critiques,icon:'fa-fire',c:'#b91c1c',bg:'#fef2f2'},
    ].map(s=>`
    <div style="background:white;border-radius:12px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);text-align:center;border:1px solid #f1f5f9;">
      <i class="fas ${s.icon}" style="color:${s.c};font-size:.95rem;margin-bottom:5px;display:block;"></i>
      <div style="font-size:1.4rem;font-weight:900;color:#111827;">${s.val}</div>
      <div style="font-size:.62rem;color:#6b7280;">${s.label}</div>
    </div>`).join('')}
  </div>

  <!-- FILTRES -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
    <div style="display:flex;gap:4px;background:white;border-radius:12px;padding:4px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
      ${['all','En cours','Programmé','Reçu','Pending','Soldé ✅','ST en cours'].map((s,i)=>`
      <button onclick="filterBDT('${s}')" id="fbdt-${i}" style="padding:5px 12px;border-radius:8px;background:${s==='all'?'#f97316':'transparent'};color:${s==='all'?'white':'#64748b'};border:none;font-size:.72rem;font-weight:${s==='all'?700:600};cursor:pointer;">${s==='all'?'Tous':s}</button>`).join('')}
    </div>
    <div style="display:flex;gap:4px;background:white;border-radius:10px;padding:4px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
      <button onclick="filterAct('all')" style="padding:4px 10px;border-radius:6px;background:#f97316;color:white;border:none;font-size:.7rem;font-weight:700;cursor:pointer;">Tous</button>
      <button onclick="filterAct('Seem')" style="padding:4px 10px;border-radius:6px;background:transparent;color:#64748b;border:none;font-size:.7rem;font-weight:600;cursor:pointer;">Seem</button>
      <button onclick="filterAct('Semrac')" style="padding:4px 10px;border-radius:6px;background:transparent;color:#64748b;border:none;font-size:.7rem;font-weight:600;cursor:pointer;">Semrac</button>
      <button onclick="filterAct('ST')" style="padding:4px 10px;border-radius:6px;background:transparent;color:#64748b;border:none;font-size:.7rem;font-weight:600;cursor:pointer;">ST</button>
    </div>
    <a href="/production/affectation" style="margin-left:auto;display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;padding:9px 18px;border-radius:10px;font-weight:700;font-size:.78rem;text-decoration:none;box-shadow:0 2px 8px rgba(249,115,22,.3);">
      <i class="fas fa-project-diagram"></i> Gantt Affectation →
    </a>
  </div>

  <!-- TABLE BDT -->
  <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      ${tableHead('N° BDT','LOT','Client','Pièce','Opération','Opérateur','Activité','Priorité','Statut','Début','Durée (h)','Mat.','PV','Actions')}
      <tbody id="bdtBody">
        ${BDT_LISTE.map(b=>`
        <tr class="bdt-row" data-statut="${b.statut}" data-act="${b.activite}" style="border-bottom:1px solid #f8fafc;${b.priorite==='critique'&&b.statut!=='Soldé ✅'?'background:#fff5f5;':''}"
          onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background='${b.priorite==='critique'&&b.statut!=='Soldé ✅'?'#fff5f5':''}'">
          <td style="padding:9px 12px;font-weight:800;color:#f97316;font-size:.82rem;font-family:monospace;">${b.id}</td>
          <td style="padding:9px 12px;font-size:.72rem;color:#6366f1;">${escX(b.lot)}</td>
          <td style="padding:9px 12px;font-size:.78rem;font-weight:700;">${escX(b.client)}</td>
          <td style="padding:9px 12px;font-size:.72rem;color:#374151;">${escX(b.piece)}</td>
          <td style="padding:9px 12px;font-size:.75rem;font-weight:600;">${escX(b.op)}</td>
          <td style="padding:9px 12px;font-size:.75rem;color:${b.operateur==='— Non affecté'?'#b91c1c':'#374151'};font-weight:${b.operateur==='— Non affecté'?700:400};">${escX(b.operateur)}</td>
          <td style="padding:9px 12px;"><span style="background:${b.activite==='Seem'?'#dbeafe':b.activite==='ST'?'#f5f3ff':'#fce7f3'};color:${b.activite==='Seem'?'#1d4ed8':b.activite==='ST'?'#6d28d9':'#9d174d'};border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:700;">${b.activite}</span></td>
          <td style="padding:9px 12px;">${prio(b.priorite)}</td>
          <td style="padding:9px 12px;">${bdtBadge(b.statut)}</td>
          <td style="padding:9px 12px;font-size:.72rem;color:#6b7280;">${b.debut}</td>
          <td style="padding:9px 12px;font-size:.75rem;font-weight:600;color:#374151;">${b.duree}h</td>
          <td style="padding:9px 12px;font-size:.82rem;">${b.material_ok?'✅':'⚠️'}</td>
          <td style="padding:9px 12px;font-size:.82rem;">${b.pv?'📋':'—'}</td>
          <td style="padding:9px 12px;"><div style="display:flex;gap:4px;">
            <a href="/production/bdt" style="padding:4px 8px;background:#fff7ed;color:#b45309;border-radius:5px;font-size:.68rem;font-weight:700;text-decoration:none;border:1px solid #fde68a;">Voir</a>
            <a href="/production/affectation" style="padding:4px 8px;background:#eff6ff;color:#1d4ed8;border-radius:5px;font-size:.68rem;font-weight:700;text-decoration:none;border:1px solid #bfdbfe;">Planif.</a>
          </div></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>
<script>
function filterBDT(s) {
  document.querySelectorAll('.bdt-row').forEach(r=>{
    r.style.display=(s==='all'||r.dataset.statut===s)?'':'none';
  });
}
function filterAct(a) {
  document.querySelectorAll('.bdt-row').forEach(r=>{
    r.style.display=(a==='all'||r.dataset.act===a)?'':'none';
  });
}
</script>`
  return layout('Liste BDT – Production', content, 'bdt')
}

// ══════════════════════════════════════════════════════════════
// PAGE LISTE LOT EN COURS – PROGRAMMATION
// ══════════════════════════════════════════════════════════════
const LOT_LISTE_DEFAULT: any[] = []

function mapLot(l: Lot) {
  return { id:l.id, cmd:l.cmd_id??'—', client:l.client_nom??'', piece:l.piece??'', qte:l.qte??0, activite:'Seem', statut:l.statut, debut:l.date_debut??'—', livraison:l.date_fin??'—', avancement:0, priorite:'normal', bdtTotal:0, bdtSoldes:0 }
}

export const pageLOTListe = (dbData?: Lot[], dbOps?: any[], dbBdts?: any[]) => {
  const LOT_LISTE = dbData ? dbData.map(mapLot) : []
  const content = `
${pageHeader('fas fa-layer-group','#f59e0b,#d97706','Suivi LOT de fabrication','Sylvie · Avancement · BDT par LOT · Délais · Priorités',['LOT','Production','Planning'])}
<div style="padding:16px 20px;">
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px;">
    ${[
      {label:'LOT actifs',val:LOT_LISTE.length,icon:'fa-layer-group',c:'#f59e0b',bg:'#fffbeb'},
      {label:'En production',val:LOT_LISTE.filter(l=>l.statut==='En production').length,icon:'fa-industry',c:'#f97316',bg:'#fff7ed'},
      {label:'Programmés',val:LOT_LISTE.filter(l=>l.statut==='Programmé').length,icon:'fa-calendar-alt',c:'#3b82f6',bg:'#eff6ff'},
      {label:'Bloqués',val:LOT_LISTE.filter(l=>l.statut==='Mat. manquante').length,icon:'fa-exclamation-triangle',c:'#ef4444',bg:'#fef2f2'},
      {label:'Critiques',val:LOT_LISTE.filter(l=>l.priorite==='critique').length,icon:'fa-fire',c:'#b91c1c',bg:'#fef2f2'},
    ].map(s=>`
    <div style="background:white;border-radius:12px;padding:13px;box-shadow:0 1px 3px rgba(0,0,0,.07);text-align:center;">
      <i class="fas ${s.icon}" style="color:${s.c};font-size:.95rem;margin-bottom:5px;display:block;"></i>
      <div style="font-size:1.35rem;font-weight:900;color:#111827;">${s.val}</div>
      <div style="font-size:.63rem;color:#6b7280;">${s.label}</div>
    </div>`).join('')}
  </div>
  <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
    <a href="/production/ordonnancement" style="display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:9px 18px;border-radius:10px;font-weight:700;font-size:.78rem;text-decoration:none;">
      <i class="fas fa-plus"></i> Créer un LOT
    </a>
  </div>
  <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      ${tableHead('N° LOT','Commande','Client','Pièce','Qté','Activité','Statut','Priorité','Avancement','BDT','Livraison','Actions')}
      <tbody>
        ${LOT_LISTE.map(l=>{
          const pct = l.avancement
          const barColor = pct>=80?'#22c55e':pct>=40?'#f59e0b':pct>0?'#f97316':'#e2e8f0'
          return `
        <tr style="border-bottom:1px solid #f8fafc;${l.statut==='Mat. manquante'||l.statut==='À planifier'?'background:#fffbeb;':''}"
          onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background='${l.statut==='Mat. manquante'||l.statut==='À planifier'?'#fffbeb':''}'">
          <td style="padding:10px 12px;font-weight:800;color:#f59e0b;font-size:.82rem;font-family:monospace;">${l.id}</td>
          <td style="padding:10px 12px;font-size:.72rem;color:#6b7280;">${escX(l.cmd)}</td>
          <td style="padding:10px 12px;font-size:.78rem;font-weight:700;">${escX(l.client)}</td>
          <td style="padding:10px 12px;font-size:.75rem;">${escX(l.piece)}</td>
          <td style="padding:10px 12px;font-size:.78rem;font-weight:600;">${l.qte} pcs</td>
          <td style="padding:10px 12px;"><span style="background:${l.activite==='Seem'?'#dbeafe':'#fce7f3'};color:${l.activite==='Seem'?'#1d4ed8':'#9d174d'};border-radius:5px;padding:2px 8px;font-size:.68rem;font-weight:700;">${l.activite}</span></td>
          <td style="padding:10px 12px;">${badge(l.statut)}</td>
          <td style="padding:10px 12px;">${prio(l.priorite)}</td>
          <td style="padding:10px 12px;min-width:120px;">
            <div style="display:flex;align-items:center;gap:7px;">
              <div style="flex:1;height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:${barColor};border-radius:4px;"></div>
              </div>
              <span style="font-size:.72rem;font-weight:700;color:${pct>=80?'#15803d':pct>=40?'#b45309':'#6b7280'};">${pct}%</span>
            </div>
          </td>
          <td style="padding:10px 12px;font-size:.75rem;color:#374151;text-align:center;">
            <span style="font-weight:700;color:#22c55e;">${l.bdtSoldes}</span><span style="color:#9ca3af;">/</span><span style="font-weight:600;">${l.bdtTotal}</span>
          </td>
          <td style="padding:10px 12px;font-size:.75rem;color:${l.statut==='Mat. manquante'?'#b91c1c':'#374151'};font-weight:${l.statut==='Mat. manquante'?700:400};">${l.livraison}</td>
          <td style="padding:10px 12px;"><div style="display:flex;gap:4px;">
            <button onclick="voirBDTsLot('${l.id}','${l.cmd}','${l.client}','${l.piece}')" style="padding:4px 8px;background:#fff7ed;color:#b45309;border-radius:5px;font-size:.68rem;font-weight:700;border:1px solid #fde68a;cursor:pointer;">BDT</button>
            <a href="/production/affectation" style="padding:4px 8px;background:#eff6ff;color:#1d4ed8;border-radius:5px;font-size:.68rem;font-weight:700;text-decoration:none;border:1px solid #bfdbfe;">Gantt</a>
          </div></td>
        </tr>`}).join('')}
      </tbody>
    </table>
  </div>
</div>
  <!-- MODAL BDTs du LOT -->
  <div id="modalBDTsLot" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:6000;align-items:flex-start;justify-content:center;padding-top:40px;">
    <div style="background:white;border-radius:16px;width:95%;max-width:900px;max-height:88vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:16px 22px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
        <div>
          <div style="font-size:.95rem;font-weight:800;color:white;" id="lotBdtTitle"><i class="fas fa-hard-hat mr-2"></i>BDTs du LOT</div>
          <div style="font-size:.72rem;color:#fde68a;margin-top:2px;" id="lotBdtSubtitle"></div>
        </div>
        <button onclick="document.getElementById('modalBDTsLot').style.display='none'" style="background:rgba(255,255,255,.2);border:none;border-radius:8px;padding:7px 12px;cursor:pointer;color:white;font-weight:700;">&times;</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:16px 20px;">
        <div id="lotBdtTableContainer"></div>
      </div>
    </div>
  </div>

  <!-- MODAL GANTT (depuis lot) -->
  <div id="modalGanttLot" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:9500;flex-direction:column;">
    <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:14px 24px;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
      <div>
        <div style="font-size:1rem;font-weight:800;color:white;"><i class="fas fa-project-diagram mr-2"></i>Affecter sur le Gantt</div>
        <div id="ganttLotBdtInfo" style="font-size:.75rem;color:#a5b4fc;margin-top:2px;"></div>
      </div>
      <button onclick="fermerGanttLot()" style="background:rgba(255,255,255,.15);border:none;border-radius:8px;padding:7px 14px;cursor:pointer;color:white;font-size:.85rem;font-weight:700;"><i class="fas fa-times mr-1"></i>Fermer</button>
    </div>
    <div style="background:#eff6ff;padding:8px 24px;font-size:.78rem;color:#1e40af;font-weight:700;border-bottom:2px solid #bfdbfe;flex-shrink:0;">
      <i class="fas fa-tools mr-2"></i>Comp\u00e9tences requises\u00a0: <span id="ganttLotCompLabel" style="color:#ea580c;font-weight:800;"></span>
    </div>
    <div style="flex:1;overflow:auto;padding:20px 24px;">
      <div id="ganttLotGrid" style="min-width:720px;"></div>
    </div>
    <div style="background:#1e1b4b;padding:8px 24px;font-size:.72rem;color:#a5b4fc;text-align:center;flex-shrink:0;">
      <i class="fas fa-mouse-pointer mr-1"></i>Cliquez sur un cr\u00e9neau pour affecter le BDT \u00e0 cet op\u00e9rateur ce jour-l\u00e0.
    </div>
  </div>

  <script>
  var BDTS_LOT_JS=${sjX((dbBdts || []).filter((b:any)=>b && (b.lot_id||b.lot_ref)).map((b:any)=>({lotId:(b.lot_id||b.lot_ref), id:b.id, competences:(Array.isArray(b.competences)?b.competences.join(', '):(b.competences||b.operation||'')), dureeBDT:Number(b.duree)||0, dateLivClient:b.date_liv||b.dateLiv||'', datePrevue:b.date_prevue||'', debut:(b.debut!=null?Number(b.debut):null), statut:b.statut||''}))).replace(/</g,'\\u003c')};
  function fmtHLot(h){ if(h==null||isNaN(h))return ''; var hh=Math.floor(h),mm=Math.round((h-hh)*60); return hh+'h'+(mm<10?'0':'')+mm; }
  var currentLotBdtId='';
  var OPERATEURS_LOT=${sjX((dbOps || []).map((o:any)=>({nom:o.nom||((o.prenom||'')+' '+(o.nom||'')).trim(),poste:o.poste||'',shift:o.shift||o.shift_id||'',competences:Array.isArray(o.competences)?o.competences:[],color:(String(o.activite||o.entite||'').toLowerCase()==='semrac')?'#ec4899':'#3b82f6'}))).replace(/</g,'\\u003c')};
  var JOURS_LOT=${sjX((()=>{ const out:string[]=[]; const J=['Lun','Mar','Mer','Jeu','Ven']; const base=new Date(); const dow=(base.getDay()+6)%7; base.setDate(base.getDate()-dow); for(let k=0;k<5;k++){ const d=new Date(base); d.setDate(base.getDate()+k); out.push(J[k]+' '+String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')); } return out; })())};

  function voirBDTsLot(lotId,cmd,client,piece){
    var bdts=[];
    for(var i=0;i<BDTS_LOT_JS.length;i++){
      if(BDTS_LOT_JS[i].lotId===lotId) bdts.push(BDTS_LOT_JS[i]);
    }
    var title=document.getElementById('lotBdtTitle');
    if(title) title.innerHTML='<i class="fas fa-hard-hat mr-2"></i>BDTs du LOT \u2013 '+lotId;
    var sub=document.getElementById('lotBdtSubtitle');
    if(sub) sub.textContent=cmd+' \u2013 '+client+' \u2013 '+piece+' \u2013 '+bdts.length+' BDT(s)';
    var html='';
    if(bdts.length===0){
      html='<div style="padding:30px;text-align:center;color:#6b7280;"><i class="fas fa-info-circle mr-2"></i>Aucun BDT trouv\u00e9 pour ce lot.</div>';
    } else {
      html='<table style="width:100%;border-collapse:collapse;font-size:.8rem;">';
      html+='<thead><tr style="background:#f9fafb;">';
      html+='<th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:.65rem;text-transform:uppercase;">N\u00b0 BDT</th>';
      html+='<th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:.65rem;text-transform:uppercase;">Comp\u00e9tences</th>';
      html+='<th style="padding:8px 12px;text-align:center;color:#6b7280;font-size:.65rem;text-transform:uppercase;">Dur\u00e9e</th>';
      html+='<th style="padding:8px 12px;text-align:center;color:#6b7280;font-size:.65rem;text-transform:uppercase;">Livraison</th>';
      html+='<th style="padding:8px 12px;text-align:center;color:#6b7280;font-size:.65rem;text-transform:uppercase;">Programmé</th>';
      html+='<th style="padding:8px 12px;text-align:center;color:#6b7280;font-size:.65rem;text-transform:uppercase;">Statut</th>';
      html+='<th style="padding:8px 12px;text-align:center;color:#6b7280;font-size:.65rem;text-transform:uppercase;">Action</th>';
      html+='</tr></thead><tbody>';
      for(var j=0;j<bdts.length;j++){
        var b=bdts[j];
        var statBg=b.statut==='a_programmer'?'#fff7ed':'#dcfce7';
        var statCol=b.statut==='a_programmer'?'#9a3412':'#166534';
        var statLbl=b.statut==='a_programmer'?'\u00c0 programmer':'Affect\u00e9 \u2713';
        html+='<tr style="border-bottom:1px solid #f1f5f9;">';
        var focusLnk='/production/gantt-bdt?focusBdt='+encodeURIComponent(b.id);
        html+='<td style="padding:8px 12px;font-weight:700;"><a href="'+focusLnk+'" style="color:#ea580c;text-decoration:none;" title="Voir dans le planning">'+b.id+' <i class="fas fa-up-right-from-square" style="font-size:.58rem;opacity:.6;"></i></a></td>';
        html+='<td style="padding:8px 12px;color:#374151;">'+b.competences+'</td>';
        html+='<td style="padding:8px 12px;text-align:center;font-weight:700;">'+b.dureeBDT+'h</td>';
        html+='<td style="padding:8px 12px;text-align:center;color:#b45309;font-weight:600;">'+b.dateLivClient+'</td>';
        html+='<td style="padding:8px 12px;text-align:center;color:#4338ca;font-weight:600;">'+(b.datePrevue?(b.datePrevue+(b.debut!=null?' \u00b7 '+fmtHLot(b.debut):'')):'<span style="color:#cbd5e1;">\u2014</span>')+'</td>';
        html+='<td style="padding:8px 12px;text-align:center;"><span style="background:'+statBg+';color:'+statCol+';padding:2px 8px;border-radius:999px;font-size:.68rem;font-weight:700;">'+statLbl+'</span></td>';
        html+='<td style="padding:8px 12px;text-align:center;">';
        if(b.statut==='a_programmer'){
          html+='<button data-id="'+b.id+'" onclick="ouvrirGanttLot(this.dataset.id)" style="padding:4px 12px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-project-diagram mr-1"></i>Affecter</button>';
        } else {
          html+='<a href="'+focusLnk+'" style="color:#4338ca;font-size:.72rem;font-weight:700;text-decoration:none;"><i class="fas fa-location-crosshairs mr-1"></i>Voir au planning</a>';
        }
        html+='</td></tr>';
      }
      html+='</tbody></table>';
    }
    var container=document.getElementById('lotBdtTableContainer');
    if(container) container.innerHTML=html;
    document.getElementById('modalBDTsLot').style.display='flex';
  }

  function ouvrirGanttLot(bdtId){
    currentLotBdtId=bdtId;
    var bdt=null;
    for(var i=0;i<BDTS_LOT_JS.length;i++){if(BDTS_LOT_JS[i].id===bdtId){bdt=BDTS_LOT_JS[i];break;}}
    if(!bdt){pushNotif('warn','fa-exclamation','BDT introuvable.',3000);return;}
    var lbl=document.getElementById('ganttLotCompLabel');
    if(lbl) lbl.textContent=bdt.competences;
    var info=document.getElementById('ganttLotBdtInfo');
    if(info) info.textContent=bdtId+' \u2013 '+bdt.piece+' \u2013 '+bdt.client+' \u2013 Livraison : '+bdt.dateLivClient;
    var ops=[];
    for(var j=0;j<OPERATEURS_LOT.length;j++){
      if(OPERATEURS_LOT[j].competences.indexOf(bdt.competences)>=0) ops.push(OPERATEURS_LOT[j]);
    }
    var html='<table style="border-collapse:collapse;width:100%;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12);">';
    html+='<thead><tr style="background:#312e81;color:white;">';
    html+='<th style="padding:12px 16px;font-size:.8rem;font-weight:700;text-align:left;min-width:190px;">Op\u00e9rateur</th>';
    for(var d=0;d<JOURS_LOT.length;d++){
      html+='<th style="padding:12px 8px;font-size:.75rem;font-weight:700;text-align:center;min-width:120px;">'+JOURS_LOT[d]+'</th>';
    }
    html+='</tr></thead><tbody>';
    if(ops.length===0){
      html+='<tr><td colspan="6" style="padding:32px;text-align:center;color:#ef4444;font-weight:700;">Aucun op\u00e9rateur qualifi\u00e9 pour : '+bdt.competences+'</td></tr>';
    } else {
      for(var k=0;k<ops.length;k++){
        var op=ops[k];
        html+='<tr style="background:'+(k%2===0?'#fff':'#f8fafc')+';border-bottom:1px solid #f1f5f9;">';
        html+='<td style="padding:10px 14px;border-right:2px solid #e2e8f0;">';
        html+='<div style="display:flex;align-items:center;gap:10px;">';
        html+='<div style="width:34px;height:34px;border-radius:50%;background:'+op.color+';display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:.82rem;">'+op.nom.charAt(0)+'</div>';
        html+='<div><div style="font-weight:700;color:#1e293b;font-size:.8rem;">'+op.nom+'</div>';
        html+='<div style="font-size:.65rem;color:#6b7280;">'+op.poste+'</div></div></div></td>';
        for(var d2=0;d2<JOURS_LOT.length;d2++){
          var ds=JOURS_LOT[d2];
          html+='<td style="padding:5px 4px;text-align:center;">';
          html+='<button data-op="'+op.nom+'" data-date="'+ds+'" onclick="affecterDepuisLot(this.dataset.op,this.dataset.date)" ';
          html+='style="width:100%;padding:9px 4px;background:'+op.color+';color:white;border:none;border-radius:8px;cursor:pointer;font-size:.7rem;font-weight:700;" ';
          html+='onmouseenter="this.style.opacity=0.75" onmouseleave="this.style.opacity=1">';
          html+='<i class="fas fa-plus" style="margin-right:3px;"></i>Affecter</button></td>';
        }
        html+='</tr>';
      }
    }
    html+='</tbody></table>';
    var grid=document.getElementById('ganttLotGrid');
    if(grid) grid.innerHTML=html;
    // Hide lot modal, show gantt
    document.getElementById('modalBDTsLot').style.display='none';
    document.getElementById('modalGanttLot').style.display='flex';
  }

  function affecterDepuisLot(opNom,dateStr){
    var bdt=null;
    for(var i=0;i<BDTS_LOT_JS.length;i++){if(BDTS_LOT_JS[i].id===currentLotBdtId){bdt=BDTS_LOT_JS[i];break;}}
    var piece=bdt?bdt.piece:'?';
    pushNotif('ok','fa-calendar-check','BDT '+currentLotBdtId+' \u2013 '+piece+' affect\u00e9 \u00e0 '+opNom+' le '+dateStr+'.',7000);
    fermerGanttLot();
    // Return to lot BDT list
    document.getElementById('modalBDTsLot').style.display='flex';
  }

  function fermerGanttLot(){
    document.getElementById('modalGanttLot').style.display='none';
  }
  </script>`
  return layout('LOT de fabrication', content, 'ordo')
}

// ══════════════════════════════════════════════════════════════
// PAGE LISTE INTERVENTIONS MAINTENANCE
// ══════════════════════════════════════════════════════════════
// Adapte une ligne DB fournisseurs_st vers la forme attendue par le rendu (colonnes absentes → défaut neutre, aucune donnée inventée).
const mapFournisseurSt = (f: FournisseurSt) => ({
  id: f.id,
  nom: f.nom,
  type: 'SS Traitant',
  contact: '—',
  tel: '—',
  traitements: f.operation ? [f.operation] : [],
  standards: f.qualification ? [f.qualification] : [],
  bsc: Number(f.scoring) || 0,
  otd: Number(f.otd) || 0,
  delaiMoyH: 0,
  statut: f.statut === 'actif' ? 'APPROVED' : f.statut === 'en_evaluation' ? 'CONDITIONAL' : 'SUSPENDED',
})

export const pageFournisseursST = (dbData?: FournisseurSt[]) => {
  const FOURN_ST_LIST = dbData ? dbData.map(mapFournisseurSt) : []
  const approved = FOURN_ST_LIST.filter(f=>f.statut==='APPROVED').length
  const conditional = FOURN_ST_LIST.filter(f=>f.statut==='CONDITIONAL').length
  const otdMoy = FOURN_ST_LIST.length > 0 ? Math.round(FOURN_ST_LIST.reduce((s,f)=>s+f.otd,0)/FOURN_ST_LIST.length) : 0
  const content = `
${pageHeader('fas fa-handshake','#10b981,#059669','Fournisseurs & SS Traitants','Achats · P3 PSC · BSC · OTD · Standards · Devis',['EN9100','Achats','ST'])}
<div style="padding:16px 20px;">

  <!-- KPIs -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;">
    ${[
      {label:'Total fournisseurs/ST',val:FOURN_ST_LIST.length,icon:'fa-industry',c:'#10b981',bg:'#f0fdf4'},
      {label:'APPROVED ✅',val:approved,icon:'fa-check-circle',c:'#22c55e',bg:'#dcfce7'},
      {label:'CONDITIONAL ⚠',val:conditional,icon:'fa-exclamation-triangle',c:'#f59e0b',bg:'#fffbeb'},
      {label:'OTD moyen',val:otdMoy+'%',icon:'fa-truck',c:'#3b82f6',bg:'#eff6ff'},
    ].map(s=>`
    <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,.08);border:1px solid #f1f5f9;text-align:center;">
      <div style="width:40px;height:40px;border-radius:12px;background:${s.bg};display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">
        <i class="fas ${s.icon}" style="color:${s.c};font-size:1rem;"></i>
      </div>
      <div style="font-size:1.6rem;font-weight:900;color:#111827;">${s.val}</div>
      <div style="font-size:.7rem;color:#6b7280;">${s.label}</div>
    </div>`).join('')}
  </div>

  <!-- FILTRES -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
    <div style="display:flex;gap:4px;background:white;border-radius:10px;padding:4px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
      <button onclick="filterFST('all')" id="ffst-all" style="padding:5px 14px;border-radius:7px;background:#10b981;color:white;border:none;font-size:.75rem;font-weight:700;cursor:pointer;">Tous</button>
      <button onclick="filterFST('Fournisseur')" id="ffst-Fournisseur" style="padding:5px 14px;border-radius:7px;background:transparent;color:#64748b;border:none;font-size:.75rem;font-weight:600;cursor:pointer;">Fournisseurs</button>
      <button onclick="filterFST('SS Traitant')" id="ffst-SS Traitant" style="padding:5px 14px;border-radius:7px;background:transparent;color:#64748b;border:none;font-size:.75rem;font-weight:600;cursor:pointer;">SS Traitants</button>
    </div>
    <input type="text" placeholder="Rechercher nom, traitement, standard…" oninput="searchFST(this.value)" style="border:1.5px solid #e2e8f0;border-radius:10px;padding:7px 14px;font-size:.82rem;outline:none;background:#f8fafc;flex:1;max-width:300px;"/>
  </div>

  <!-- TABLEAU PRINCIPAL -->
  <div style="background:white;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;" id="fstTable">
      ${tableHead('Code','Nom','Type','Contact','Traitements','Standards','BSC','OTD %','Délai moy.','Statut','Actions')}
      <tbody id="fstBody">
        ${FOURN_ST_LIST.map(f=>`
        <tr class="fst-row" data-type="${f.type}" style="border-bottom:1px solid #f8fafc;" onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background=''">
          <td style="padding:10px 12px;font-weight:800;color:#10b981;font-size:.8rem;font-family:monospace;">${f.id}</td>
          <td style="padding:10px 12px;font-weight:700;font-size:.85rem;">${escX(f.nom)}</td>
          <td style="padding:10px 12px;">
            <span style="background:${f.type==='SS Traitant'?'#f5f3ff':'#f0fdf4'};color:${f.type==='SS Traitant'?'#6d28d9':'#15803d'};border:1px solid ${f.type==='SS Traitant'?'#ddd6fe':'#bbf7d0'};border-radius:999px;padding:2px 10px;font-size:.68rem;font-weight:700;">${f.type}</span>
          </td>
          <td style="padding:10px 12px;font-size:.75rem;">
            <div style="font-weight:600;">${escX(f.contact)}</div>
            <div style="color:#6b7280;font-size:.68rem;">${escX(f.tel)}</div>
          </td>
          <td style="padding:10px 12px;font-size:.72rem;max-width:150px;">
            ${f.traitements.map(t=>`<span style="display:inline-block;background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px;padding:1px 7px;margin:1px;font-size:.67rem;">${escX(t)}</span>`).join('')}
          </td>
          <td style="padding:10px 12px;font-size:.72rem;max-width:140px;">
            ${f.standards.map(s=>`<span style="display:inline-block;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:5px;padding:1px 7px;margin:1px;font-size:.66rem;font-weight:600;">${escX(s)}</span>`).join('')}
          </td>
          <td style="padding:10px 12px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:4px;">
              <div style="width:34px;height:34px;border-radius:50%;background:${f.bsc>=90?'#dcfce7':f.bsc>=80?'#fef9c3':'#fee2e2'};display:flex;align-items:center;justify-content:center;font-weight:900;font-size:.75rem;color:${f.bsc>=90?'#15803d':f.bsc>=80?'#854d0e':'#b91c1c'};">${f.bsc}</div>
            </div>
          </td>
          <td style="padding:10px 12px;text-align:center;">
            <span style="font-weight:700;font-size:.82rem;color:${f.otd>=90?'#15803d':f.otd>=80?'#b45309':'#b91c1c'};">${f.otd}%</span>
          </td>
          <td style="padding:10px 12px;font-size:.78rem;font-weight:600;text-align:center;color:#374151;">${f.delaiMoyH}h</td>
          <td style="padding:10px 12px;">
            <span style="background:${f.statut==='APPROVED'?'#dcfce7':'#fef9c3'};color:${f.statut==='APPROVED'?'#15803d':'#854d0e'};border:1px solid ${f.statut==='APPROVED'?'#bbf7d0':'#fde68a'};border-radius:999px;padding:3px 10px;font-size:.68rem;font-weight:700;">${f.statut}</span>
          </td>
          <td style="padding:10px 12px;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              <button onclick="showFicheP3('${f.id}')" style="padding:4px 9px;background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe;border-radius:6px;font-size:.68rem;font-weight:700;cursor:pointer;">Fiche P3</button>
              <button onclick="demandeDevis('${f.id}')" style="padding:4px 9px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:6px;font-size:.68rem;font-weight:700;cursor:pointer;">Devis</button>
              <button onclick="demandeAchat('${f.id}')" style="padding:4px 9px;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:6px;font-size:.68rem;font-weight:700;cursor:pointer;">DA</button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- MODALE FICHE P3 PSC -->
  <div id="ficheP3Modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:24px;max-width:640px;width:92%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="font-size:1rem;font-weight:800;color:#1e293b;margin:0;"><i class="fas fa-industry" style="color:#10b981;margin-right:8px;"></i>Fiche P3 PSC – <span id="p3FournNom"></span></h3>
        <button onclick="closeFicheP3()" style="border:none;background:#fef2f2;color:#b91c1c;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:700;">✕ Fermer</button>
      </div>
      <div id="p3Content" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.82rem;">
        <!-- Rempli dynamiquement -->
      </div>
      <div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:10px;">
        <div style="font-weight:700;font-size:.82rem;margin-bottom:8px;color:#374151;"><i class="fas fa-euro-sign" style="color:#10b981;margin-right:6px;"></i>Tarifs & Quantités</div>
        <table style="width:100%;font-size:.78rem;border-collapse:collapse;" id="p3Tarifs">
          <thead><tr style="background:#f1f5f9;"><th style="padding:6px 10px;text-align:left;">Traitement</th><th style="padding:6px 10px;text-align:center;">Qté 1</th><th style="padding:6px 10px;text-align:center;">Qté 2</th><th style="padding:6px 10px;text-align:center;">Qté 3</th><th style="padding:6px 10px;text-align:left;">Unité</th></tr></thead>
          <tbody id="p3TarifsBody"></tbody>
        </table>
      </div>
      <div style="margin-top:12px;padding:12px;background:#f0fdf4;border-radius:10px;">
        <div style="font-weight:700;font-size:.82rem;margin-bottom:8px;color:#15803d;"><i class="fas fa-certificate" style="margin-right:6px;"></i>Standards applicables</div>
        <div id="p3Standards" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
      </div>
    </div>
  </div>

</div>
<script>
const FST_DATA = ${J(FOURN_ST_LIST)};
function filterFST(type) {
  document.querySelectorAll('.fst-row').forEach(r=>{
    r.style.display = (type==='all'||r.dataset.type===type)?'':'none';
  });
  ['all','Fournisseur','SS Traitant'].forEach(t=>{
    const btn=document.getElementById('ffst-'+t);
    if(btn){btn.style.background=t===type?'#10b981':'transparent';btn.style.color=t===type?'white':'#64748b';}
  });
}
function searchFST(v) {
  const q=v.toLowerCase();
  document.querySelectorAll('.fst-row').forEach(r=>{
    r.style.display=r.textContent.toLowerCase().includes(q)?'':'none';
  });
}
function showFicheP3(id) {
  const f = FST_DATA.find(x=>x.id===id);
  if(!f) return;
  document.getElementById('p3FournNom').textContent = f.nom;
  document.getElementById('p3Content').innerHTML = [
    ['Code',f.id],['Type',f.type],['Contact',f.contact],['Téléphone',f.tel],
    ['Email',f.email],['Délai historique moyen',f.delaiMoyH+'h'],
    ['BSC Score',f.bsc+'/100'],['OTD',f.otd+'%'],['Statut EN9100',f.statut],
    ['P3 PSC Réf.',f.p3],['N°CHD',f.noCHD||'—'],
  ].map(([k,v])=>'<div style="background:#f8fafc;border-radius:8px;padding:10px 14px;"><div style="font-size:.65rem;color:#6b7280;font-weight:700;text-transform:uppercase;">'+k+'</div><div style="font-weight:600;color:#1e293b;margin-top:3px;">'+v+'</div></div>').join('');
  const tarifsHtml = f.traitements.map(t=>'<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:6px 10px;">'+t+'</td><td style="padding:6px 10px;text-align:center;">Sur devis</td><td style="padding:6px 10px;text-align:center;">\u2014</td><td style="padding:6px 10px;text-align:center;">\u2014</td><td style="padding:6px 10px;">pcs/kg/m\u00b2</td></tr>').join('');
  document.getElementById('p3TarifsBody').innerHTML = tarifsHtml;
  document.getElementById('p3Standards').innerHTML = f.standards.map(s=>'<span style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:6px;padding:4px 12px;font-size:.75rem;font-weight:700;">'+s+'</span>').join('');
  const modal = document.getElementById('ficheP3Modal');
  modal.style.display = 'flex';
}
function closeFicheP3() { document.getElementById('ficheP3Modal').style.display='none'; }
function demandeDevis(id) { const f=FST_DATA.find(x=>x.id===id); alert('Demande de devis initiée pour '+f.nom+' → Notification envoyée à Morgane (Achats)'); }
function demandeAchat(id) { const f=FST_DATA.find(x=>x.id===id); alert('DA créée pour '+f.nom+' → Lien généré dans la liste BSC & OTD'); }
</script>`
  return layout('Fournisseurs & SS Traitants', content, 'fournisseur')
}

// ══════════════════════════════════════════════════════════════
// PAGE RÉFÉRENCES PIÈCES À CRÉER
// ══════════════════════════════════════════════════════════════
const REF_A_CREER = [
  { id:'REF-2026-001', numPlan:'PLAN-1277-v1', numAffaire:'1277', cmdRef:'CMD-2026-1277', client:'Legrand SNC', desig:'DISSIP-A24 v3', statut:'a_creer', creePar:'', dateCree:'' },
  { id:'REF-2026-002', numPlan:'PLAN-1277-v2', numAffaire:'1277', cmdRef:'CMD-2026-1277', client:'Legrand SNC', desig:'DISSIP-A24 v4 (modif)', statut:'a_creer', creePar:'', dateCree:'' },
  { id:'REF-2026-003', numPlan:'PLAN-1279-v1', numAffaire:'1279', cmdRef:'CMD-2026-1279', client:'Bosch Rexroth', desig:'CARTER-B07', statut:'cree', creePar:'David', dateCree:'2026-03-10' },
  { id:'REF-2026-004', numPlan:'PLAN-1280-v1', numAffaire:'1280', cmdRef:'CMD-2026-1280', client:'Faurecia Exhaust', desig:'BRIDE-F03 MAS', statut:'a_creer', creePar:'', dateCree:'' },
  { id:'REF-2026-005', numPlan:'PLAN-1282-v1', numAffaire:'1282', cmdRef:'CMD-2026-1282', client:'Bosch Rexroth', desig:'PALIER-B12', statut:'a_creer', creePar:'', dateCree:'' },
]

export const pageReferencesPiecesACreer = () => {
  const nbACreer = REF_A_CREER.filter(r=>r.statut==='a_creer').length
  const nbCrees = REF_A_CREER.filter(r=>r.statut==='cree').length

  const content = `
  <div style="background:linear-gradient(135deg,#7c3aed,#4c1d95);padding:20px 24px;color:white;border-radius:0;">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <div style="background:rgba(255,255,255,.15);border-radius:10px;padding:8px 12px;"><i class="fas fa-barcode" style="font-size:1.2rem;"></i></div>
      <div>
        <h1 style="font-size:1.1rem;font-weight:800;margin:0;">Références Pièces à Créer</h1>
        <p style="font-size:.78rem;opacity:.8;margin:2px 0 0;">BE · Nouvelles pièces DT · Création numéros internes · N° plan · EN9100</p>
      </div>
      <div style="margin-left:auto;display:flex;gap:8px;">
        <span style="background:rgba(255,255,255,.15);padding:4px 10px;border-radius:6px;font-size:.72rem;font-weight:700;">Réf</span>
      </div>
    </div>
  </div>
  <div style="padding:22px 30px;">

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #ef4444;text-align:center;">
        <div style="font-size:2rem;font-weight:800;color:#ef4444;">${nbACreer}</div>
        <div style="font-size:.72rem;color:#6b7280;font-weight:600;">À créer</div>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #22c55e;text-align:center;">
        <div style="font-size:2rem;font-weight:800;color:#22c55e;">${nbCrees}</div>
        <div style="font-size:.72rem;color:#6b7280;font-weight:600;">Créées ce mois</div>
      </div>
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid #6366f1;text-align:center;">
        <div style="font-size:2rem;font-weight:800;color:#6366f1;">${REF_A_CREER.length}</div>
        <div style="font-size:.72rem;color:#6b7280;font-weight:600;">Total références</div>
      </div>
    </div>

    <!-- FILTRES -->
    <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center;flex-wrap:wrap;">
      <span style="font-size:.78rem;font-weight:600;color:#374151;">Filtrer :</span>
      ${[['tous','Toutes','#6b7280'],['a_creer','À créer','#ef4444'],['cree','Créées','#22c55e']].map(([s,l,c])=>'<button onclick="filtrerRef(\''+s+'\')" data-refst="'+s+'" style="padding:5px 14px;border-radius:999px;background:'+(s==='tous'?c+'20':'#f1f5f9')+';color:'+(s==='tous'?c:'#6b7280')+';border:1.5px solid '+(s==='tous'?c+'40':'#e2e8f0')+';font-size:.72rem;font-weight:700;cursor:pointer;">'+l+'</button>').join('')}
    </div>

    <!-- TABLE -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="refTable">
        <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">ID Réf</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° Plan</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">N° Affaire / CMD</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Client</th>
          <th style="text-align:left;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Désignation</th>
          <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Statut</th>
          <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Créé par / Date</th>
          <th style="text-align:center;padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;">Action</th>
        </tr></thead>
        <tbody>
          ${REF_A_CREER.map(r=>'<tr data-refst="'+r.statut+'" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background=\'#f8fafc\'" onmouseleave="this.style.background=\'\'">'
            +'<td style="padding:10px 14px;font-weight:700;color:#7c3aed;">'+r.id+'</td>'
            +'<td style="padding:10px 14px;font-family:monospace;color:#374151;font-size:.78rem;">'+r.numPlan+'</td>'
            +'<td style="padding:10px 14px;"><div style="font-weight:700;color:#374151;">'+r.cmdRef+'</div><div style="font-size:.68rem;color:#6366f1;">Affaire N° '+r.numAffaire+'</div></td>'
            +'<td style="padding:10px 14px;color:#374151;">'+r.client+'</td>'
            +'<td style="padding:10px 14px;color:#374151;font-weight:600;">'+r.desig+'</td>'
            +'<td style="padding:10px 14px;text-align:center;"><span style="padding:3px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:'+(r.statut==='a_creer'?'#fee2e2':'#dcfce7')+';color:'+(r.statut==='a_creer'?'#b91c1c':'#166534')+';"> '+(r.statut==='a_creer'?'À créer':'Créée ✓')+'</span></td>'
            +'<td style="padding:10px 14px;text-align:center;font-size:.75rem;color:#6b7280;">'+(r.creePar ? r.creePar+'<br>'+r.dateCree : '—')+'</td>'
            +'<td style="padding:10px 14px;text-align:center;">'+(r.statut==='a_creer'
              ? '<button onclick="ouvrirCreationRef(\''+r.id+'\',\''+r.desig+'\',\''+r.numPlan+'\')" style="padding:4px 12px;background:linear-gradient(135deg,#7c3aed,#4c1d95);color:white;border:none;border-radius:6px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus mr-1"></i>Créer N°</button>'
              : '<span style="font-size:.72rem;color:#22c55e;font-weight:600;"><i class="fas fa-check mr-1"></i>Fait</span>')
            +'</td>'
            +'</tr>').join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- MODAL CRÉATION RÉFÉRENCE -->
  <div id="modalCreeRef" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:5000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:28px;max-width:520px;width:92%;">
      <h3 style="font-size:1rem;font-weight:800;margin-bottom:4px;color:#7c3aed;"><i class="fas fa-barcode mr-2"></i>Créer la Référence Interne</h3>
      <p style="font-size:.8rem;color:#6b7280;margin-bottom:14px;">Référence : <strong id="refModalId"></strong></p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:12px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Désignation</label><input type="text" class="form-input" id="refDesigInput"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">N° Plan</label><input type="text" class="form-input" id="refPlanInput"/></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:12px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Ref interne proposée <span style="color:#ef4444;">*</span></label><input type="text" class="form-input" placeholder="Ex: DISSIP-A24-V3-001"/></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Famille produit</label><select class="form-input"><option>Dissipateur</option><option>Carter</option><option>Support</option><option>Bride</option><option>Tôlerie</option><option>Autre</option></select></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Valideur</label><select class="form-input"><option>Joël</option><option>David</option><option>Pierre-Yves</option></select></div>
        <div><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Date création</label><input type="date" class="form-input"/></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button onclick="document.getElementById('modalCreeRef').style.display='none'" style="background:#f1f5f9;color:#374151;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 20px;font-size:.83rem;cursor:pointer;">Annuler</button>
        <button onclick="validerCreationRef()" style="background:linear-gradient(135deg,#7c3aed,#4c1d95);color:white;border:none;border-radius:10px;padding:8px 22px;font-size:.83rem;font-weight:700;cursor:pointer;"><i class="fas fa-check mr-2"></i>Valider la création</button>
      </div>
    </div>
  </div>

  <script>
  function filtrerRef(s){
    document.querySelectorAll('[data-refst]').forEach(function(b){
      if(b.tagName==='BUTTON'){ b.style.background='#f1f5f9'; b.style.color='#6b7280'; b.style.borderColor='#e2e8f0'; }
    });
    var btn=document.querySelector('button[data-refst="'+s+'"]');
    if(btn){ btn.style.background='#f8f0ff'; btn.style.color='#7c3aed'; btn.style.borderColor='#ddd6fe'; }
    document.querySelectorAll('#refTable tbody tr').forEach(function(tr){
      tr.style.display = (s==='tous' || tr.dataset.refst===s) ? '' : 'none';
    });
  }
  function ouvrirCreationRef(id,desig,plan){
    document.getElementById('refModalId').textContent=id;
    var di=document.getElementById('refDesigInput'); if(di) di.value=desig;
    var pi=document.getElementById('refPlanInput'); if(pi) pi.value=plan;
    document.getElementById('modalCreeRef').style.display='flex';
  }
  function validerCreationRef(){
    if(typeof pushNotif!=='undefined') pushNotif('ok','fa-barcode','Référence interne créée et enregistrée en base de données.',5000);
    document.getElementById('modalCreeRef').style.display='none';
  }
  </script>`

  return layout('Références Pièces à Créer', content, 'refs-pieces')
}

// ══════════════════════════════════════════════════════════════
// PAGE PRÉPARATIONS TECHNIQUES
// ══════════════════════════════════════════════════════════════
export const prepCle = (cmdRef: any, piece: any) =>
  String(cmdRef ?? '').trim() + '|' + String(piece ?? '').toLowerCase().trim()

// ══════════════════════════════════════════════════════════════
// PAGE BDTs À PROGRAMMER
// ══════════════════════════════════════════════════════════════
