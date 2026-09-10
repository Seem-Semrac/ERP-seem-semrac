// ══════════════════════════════════════════════════════════════
// PRODUCTION – Planning Gantt BDT/BST · Commandes · Lots · Dashboards
// ══════════════════════════════════════════════════════════════
import { escX, layout, serviceHeader, OPERATEURS as OPS_FB, BDT_DATA, SHIFTS, ABSENCES, MACHINES, computePosteRates, estAnnule, badgeAnnule } from './shared'
import { LOGO_SVG, BRAND } from './brand'
import type { BonDeTravail, Machine, Operateur, Lot, Commande, FournisseurSt } from './types'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

// ─── FALLBACK DATA ────────────────────────────────────────────

// Operateurs enrichis avec shift (pour Gantt)
const OPS_DEFAULT: any[] = []

const BDT_DEFAULT: any[] = []

const OPS_SEEM_LIST   = ['Tronçonnage','Usinage CN','Ébavurage','Thermocollage','Oxydation anodique sulfurique','Emballage SEEM']
const OPS_SEMRAC_LIST = ['Poinçonnage / Laser','Ébavurage','Pliage','Montage','Soudure TIG/MIG/MAG','Fraisage / Taraudage','Ponçage','Sérigraphie','Emballage SEMRAC']
const OPS_ST_LIST     = ['Oxydation anodique sulfurique','Sérigraphie','Traitement thermique','Zingage','Peinture poudre','Brunissage']

const LOTS_DEFAULT: Lot[] = []

const CMD_DEFAULT: Commande[] = []

const FOURN_DEFAULT: any[] = []

// ─── HELPERS COMMUNS ──────────────────────────────────────────
const SEL_STYLE = 'border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.78rem;background:#f8fafc;outline:none;color:#374151;'
const Q_STYLE   = 'border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:220px;'

const prodSearchBar = (tableId: string, cols: [string,string][]) =>
  `<div style="display:flex;gap:8px;align-items:center;">
    <select id="sel-${tableId}" onchange="prodSearch('${tableId}')" style="${SEL_STYLE}">
      <option value="all">Tous les champs</option>
      ${cols.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
    </select>
    <input type="text" id="q-${tableId}" placeholder="Rechercher…" oninput="prodSearch('${tableId}')" style="${Q_STYLE}"/>
  </div>`

const PROD_SEARCH_FN = `function prodSearch(tableId){var sel=document.getElementById('sel-'+tableId);var inp=document.getElementById('q-'+tableId);var col=sel?sel.value:'all';var lq=inp?inp.value.toLowerCase().trim():'';var tbl=document.getElementById(tableId);if(!tbl)return;tbl.querySelectorAll('tbody tr').forEach(function(tr){var text=col==='all'?tr.textContent:(tr.dataset[col]||'');tr.style.display=(!lq||text.toLowerCase().indexOf(lq)>=0)?'':'none';});}`

const TH = (l: string) => `<th style="text-align:left;padding:8px 12px;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;border-bottom:2px solid #e2e8f0;white-space:nowrap;">${l}</th>`
const TD = (c: string) => `<td style="padding:8px 12px;font-size:.8rem;color:#374151;border-bottom:1px solid #f1f5f9;vertical-align:middle;">${c}</td>`

const STATUT_BADGE = (s: string) => {
  const m: Record<string,string> = { en_cours:'#ede9fe|#5b21b6', planifié:'#dbeafe|#1d4ed8', terminé:'#dcfce7|#166534', termine:'#dcfce7|#166534', retard:'#fef2f2|#b91c1c', sous_trait:'#e0e7ff|#3730a3', bloqué:'#fef2f2|#b91c1c', recu:'#fef9c3|#854d0e', programme:'#dbeafe|#1d4ed8', affecte:'#dbeafe|#1d4ed8', solde:'#dcfce7|#166534', a_programmer:'#f1f5f9|#475569', en_attente:'#f1f5f9|#475569', a_planifier:'#f1f5f9|#475569', planifie:'#dbeafe|#1d4ed8', envoye:'#fef9c3|#854d0e', st:'#e0e7ff|#3730a3' }
  // Un statut d'annulation retombait sur le repli gris, indistinguable d'un statut
  // inconnu : on le rend explicitement, quelle que soit son orthographe.
  if (estAnnule(s)) return badgeAnnule()
  const [bg,co] = (m[s]||'#f1f5f9|#64748b').split('|')
  return `<span style="border-radius:999px;padding:2px 9px;font-size:.62rem;font-weight:700;background:${bg};color:${co};">${(s||'—').replace(/_/g,' ')}</span>`
}
const PRIO_BADGE = (p: string) => {
  const m: Record<string,string> = { critique:'#fef2f2|#b91c1c|#fecaca', urgent:'#fffbeb|#b45309|#fde68a', normal:'#f0fdf4|#15803d|#bbf7d0' }
  const [bg,co,bo] = (m[p]||m.normal).split('|')
  return `<span style="border-radius:999px;padding:2px 8px;font-size:.62rem;font-weight:700;background:${bg};color:${co};border:1px solid ${bo};">${p}</span>`
}

// ─── PALETTE DE COULEURS PAR LOT (partagée BDT ↔ BST) ─────────
// Même algorithme côté BDT (file d'attente) et côté BST (barres + cartes en attente)
// pour garantir la continuité visuelle d'un lot dans tout le planning Production.
export const LOT_PALETTE = ['#2563eb','#db2777','#f59e0b','#059669','#7c3aed','#0891b2','#dc2626','#65a30d','#ea580c','#0d9488','#9333ea','#ca8a04','#0ea5e9','#c026d3','#16a34a','#e11d48','#4f46e5','#d97706']
export function buildLotColorMap(keys: (string|null|undefined)[]): Record<string,string> {
  const uniq = Array.from(new Set(keys.filter(Boolean) as string[])).sort()
  const m: Record<string,string> = {}
  uniq.forEach((k,i) => { m[k] = LOT_PALETTE[i % LOT_PALETTE.length] })
  return m
}

// ══════════════════════════════════════════════════════════════
// PAGE 1 : GANTT BDT – Opérateurs, shifts, drag-drop
// ══════════════════════════════════════════════════════════════
export const pageGanttBDT = (
  dbBDTs?:    BonDeTravail[],
  _machines?: Machine[],
  dbOps?:     Operateur[],
  dbProcesses?: any[],
  dbPostes?: any[],
) => {
  const TODAY = new Date().toISOString().slice(0,10)
  // Poste de chaque BDT — un BDT n'a pas de process_id, il se relie par son intitulé d'OPÉRATION.
  // Un process_atelier porte un poste_id + une liste d'opérations couvertes → on indexe op → poste.
  const _posteNom = new Map((dbPostes || []).map((p: any) => [String(p.id), String(p.nom || '')]))
  const _norm = (s: any) => String(s || '').trim().toLowerCase()
  const _opPoste = new Map<string, string>()
  for (const pr of (dbProcesses || []) as any[]) {
    const pn = _posteNom.get(String(pr.poste_id)) || ''
    if (!pn) continue
    if (pr.nom) _opPoste.set(_norm(pr.nom), pn)
    for (const o of (Array.isArray(pr.operations) ? pr.operations : [])) _opPoste.set(_norm(o), pn)
  }
  const posteOfBdt = (b: any) => _opPoste.get(_norm((b as any).operation)) || ''

  // Normalise Supabase BDTs → format Gantt
  const opsForGantt = (dbOps && dbOps.length > 0)
    ? dbOps.map(o => ({
        id: o.id, nom: o.nom, activite: o.activite,
        poste: o.poste||'', shift: deriveShift(o.shift_id),
        competences: o.competences||[]
      }))
    : OPS_DEFAULT

  const bdtsForGantt = (dbBDTs && dbBDTs.length > 0)
    ? dbBDTs.map(b => ({
        id: b.id,
        op: b.operateur_id || 'pending',
        client: b.client_nom||'',
        piece: b.piece,
        operation: b.operation,
        duree: b.duree,
        debut: b.debut||6,
        priorite: b.priorite,
        statut: b.statut,
        activite: b.activite||'Seem',
        poste: posteOfBdt(b),
        datePrevue: (b as any).date_prevue || '',
        tempsAlloue: b.duree,
        debutReel: null as string|null,
        finReel: null as string|null,
      }))
    : BDT_DEFAULT

  const OPS_J   = JSON.stringify(opsForGantt)
  const BDTS_J  = JSON.stringify(bdtsForGantt)
  const SHIFTS_J= JSON.stringify(SHIFTS)
  const ABS_J   = JSON.stringify(ABSENCES)
  const OPS_SE  = JSON.stringify(OPS_SEEM_LIST)
  const OPS_SM  = JSON.stringify(OPS_SEMRAC_LIST)
  const OPS_ST  = JSON.stringify(OPS_ST_LIST)

  const content = `
<style>
  .gantt-header-row{display:grid;grid-template-columns:300px 1fr;background:#1e293b;color:white;border-radius:12px 12px 0 0;}
  .gantt-body-row{display:grid;grid-template-columns:300px 1fr;border-bottom:1px solid #f1f5f9;}
  .op-info-cell{background:white;padding:8px 10px;display:flex;flex-direction:column;gap:3px;min-height:68px;border-right:2px solid #f1f5f9;}
  .op-info-cell.absent{background:#fef2f2;}
  .gantt-lane{position:relative;background:white;min-height:68px;}
  .gantt-lane.absent{background:repeating-linear-gradient(45deg,#fef2f2,#fef2f2 8px,#fee2e2 8px,#fee2e2 16px);}
  .gantt-tick{position:absolute;top:0;bottom:0;border-left:1px solid #f1f5f9;pointer-events:none;}
  .gantt-tick.major{border-left:1px solid #e2e8f0;}
  .shift-zone{position:absolute;top:0;bottom:0;opacity:.06;pointer-events:none;}
  .bdt-bar{position:absolute;top:6px;bottom:6px;border-radius:7px;display:flex;flex-direction:column;justify-content:center;padding:0 6px;cursor:pointer;font-size:.63rem;font-weight:700;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.15);z-index:2;transition:all .15s;}
  .bdt-bar:hover{filter:brightness(.9);z-index:10;box-shadow:0 4px 14px rgba(0,0,0,.25);}
  .bdt-bar.solde{opacity:.65;filter:grayscale(.3);}
  .bdt-bar.programme{border:2px dashed rgba(255,255,255,.5);}
  .drag-over{background:#dbeafe!important;outline:2px dashed #3b82f6;outline-offset:-2px;}
  .tooltip-box{position:fixed;background:#0f172a;color:white;border-radius:10px;padding:10px 14px;font-size:.75rem;pointer-events:none;z-index:1000;max-width:260px;box-shadow:0 8px 28px rgba(0,0,0,.4);display:none;}
  .pending-card{display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;border:1.5px dashed #fbd38d;background:#fffbeb;cursor:grab;font-size:.72rem;margin-bottom:6px;}
  .pending-card:active{cursor:grabbing;}
  .tab-gang{padding:5px 14px;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;background:transparent;border:none;}
  .tab-gang.active{background:#f97316;color:white;}
  .tab-gang:not(.active):hover{background:#f1f5f9;}
  .stat-pill{background:white;border-radius:10px;padding:.6rem .9rem;box-shadow:0 1px 3px rgba(0,0,0,.07);text-align:center;}
  #planFocusBtn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:.78rem;font-weight:700;border:1px solid #cbd5e1;background:white;color:#334155;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.07);transition:all .15s;}
  #planFocusBtn:hover{background:#f8fafc;}
  #prodWrap.plan-focus #planFocusBtn{background:#0f766e;color:white;border-color:#0f766e;}
  #prodWrap.plan-focus #bdtBottom{display:none;}
</style>

<div id="prodWrap" style="padding:20px;">
  <!-- Toolbar -->
  <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
    <div style="display:flex;align-items:center;gap:8px;background:white;border-radius:10px;padding:8px 12px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
      <i class="fas fa-calendar" style="color:#f97316;font-size:.85rem;"></i>
      <input type="date" id="planDate" value="${TODAY}" onchange="loadDay(this.value)" style="font-size:.85rem;font-weight:700;color:#1e293b;border:none;outline:none;background:transparent;cursor:pointer;"/>
      <button onclick="shiftDate(-1)" style="width:22px;height:22px;border-radius:5px;background:#f1f5f9;border:none;cursor:pointer;font-size:.8rem;">‹</button>
      <button onclick="shiftDate(1)"  style="width:22px;height:22px;border-radius:5px;background:#f1f5f9;border:none;cursor:pointer;font-size:.8rem;">›</button>
    </div>
    <div style="display:flex;gap:2px;background:white;border-radius:10px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
      <button onclick="setAct('all')"    id="fa-all"    class="tab-gang active">Tous</button>
      <button onclick="setAct('Seem')"   id="fa-Seem"   class="tab-gang">Seem</button>
      <button onclick="setAct('Semrac')" id="fa-Semrac" class="tab-gang">Semrac</button>
    </div>
    <div style="display:flex;gap:2px;background:white;border-radius:10px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
      <button onclick="setShift('all')"    id="fs-all"    class="tab-gang active">Tous shifts</button>
      <button onclick="setShift('matin')"  id="fs-matin"  class="tab-gang">Matin</button>
      <button onclick="setShift('apmidi')" id="fs-apmidi" class="tab-gang">Après-midi</button>
      <button onclick="setShift('journee')"id="fs-journee"class="tab-gang">Journée</button>
      <button onclick="setShift('soir')"   id="fs-soir"   class="tab-gang">Soirée</button>
    </div>
    <div style="flex:1;"></div>
    <div style="display:flex;align-items:center;gap:10px;font-size:.72rem;color:#64748b;">
      <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:#3b82f6;border:2px dashed rgba(255,255,255,.8);display:inline-block;"></span>Programmé</span>
      <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:#f59e0b;display:inline-block;"></span>Reçu</span>
      <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:#22c55e;display:inline-block;"></span>Soldé</span>
      <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:#ef4444;display:inline-block;"></span>Critique</span>
    </div>
    <button id="planFocusBtn" onclick="togglePlanFocus()" title="Masquer les BDT en attente et agrandir le planning de la journée">
      <i class="fas fa-up-right-and-down-left-from-center"></i> Agrandir le planning
    </button>
    <button onclick="openBdtModal()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border-radius:10px;font-size:.8rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(234,88,12,.3);">
      <i class="fas fa-plus"></i> Nouveau BDT
    </button>
  </div>

  <!-- Stats -->
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:14px;" id="statsBar"></div>

  <!-- GOULOTTE : BDT à classer (AU-DESSUS du planning) -->
  <div class="card" style="padding:16px;margin-bottom:16px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="font-weight:700;color:#1e293b;font-size:.85rem;display:flex;align-items:center;gap:6px;">
        <i class="fas fa-inbox" style="color:#f97316;"></i> BDT à classer / en attente d'affectation
        <span id="cntPend" style="background:#ffedd5;color:#c2410c;font-size:.65rem;font-weight:700;padding:1px 7px;border-radius:999px;">0</span>
      </div>
      <span style="font-size:.68rem;color:#94a3b8;">Glisser sur un opérateur du planning ci-dessous</span>
    </div>
    <div id="pendingList"></div>
  </div>

  <!-- Gantt -->
  <div class="card" id="ganttCard" style="overflow:hidden;margin-bottom:16px;">
    <div class="gantt-header-row">
      <div style="padding:8px 10px;border-right:1px solid rgba(255,255,255,.1);font-size:.72rem;font-weight:700;color:#94a3b8;display:flex;align-items:center;gap:6px;">
        <i class="fas fa-users" style="color:#64748b;"></i> Opérateur
      </div>
      <div id="hoursHdr" style="position:relative;min-height:34px;overflow:hidden;"></div>
    </div>
    <div id="ganttBody" style="border-radius:0 0 14px 14px;overflow:hidden;"></div>
  </div>

  <!-- Sous-traitance en cours (la goulotte BDT est desormais AU-DESSUS du planning) -->
  <div id="bdtBottom" style="display:grid;grid-template-columns:1fr;gap:12px;">
    <div class="card" style="padding:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div style="font-weight:700;color:#1e293b;font-size:.85rem;display:flex;align-items:center;gap:6px;">
          <i class="fas fa-industry" style="color:#6366f1;"></i> Sous-traitance en cours
          <span id="cntST" style="background:#ede9fe;color:#5b21b6;font-size:.65rem;font-weight:700;padding:1px 7px;border-radius:999px;">0</span>
        </div>
        <button onclick="openSTModal()" style="font-size:.72rem;color:#6366f1;cursor:pointer;background:none;border:none;font-weight:600;"><i class="fas fa-plus"></i> Nouvelle ST</button>
      </div>
      <div id="stList"></div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;">
        <div style="font-size:.65rem;color:#94a3b8;margin-bottom:6px;font-weight:600;">Opérations typiquement sous-traitées :</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;" id="stOpsList"></div>
      </div>
    </div>
  </div>
</div>

<!-- Tooltip -->
<div class="tooltip-box" id="ganttTT"></div>

<!-- Modal Nouveau BDT -->
<div id="bdtModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;z-index:500;">
  <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:620px;margin:1rem;overflow:hidden;max-height:90vh;overflow-y:auto;">
    <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#f97316,#ea580c);">
      <h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-plus-circle" style="margin-right:8px;"></i>Créer / Affecter un BDT</h3>
      <button onclick="closeModal('bdtModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
    </div>
    <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div><label class="form-label">N° Commande *</label><input id="m_cmd" type="text" placeholder="CMD-2026-XXXX" class="form-input"/></div>
      <div><label class="form-label">Client *</label><input id="m_client" type="text" placeholder="Raison sociale" class="form-input"/></div>
      <div><label class="form-label">Activité *</label>
        <select id="m_activite" class="form-input" onchange="updateModalOps()">
          <option value="">— Choisir —</option><option>Seem</option><option>Semrac</option>
        </select>
      </div>
      <div><label class="form-label">Opération *</label>
        <select id="m_operation" class="form-input" onchange="updateModalOpsEligibles()"><option value="">— Choisir activité —</option></select>
      </div>
      <div><label class="form-label">Pièce *</label><input id="m_piece" type="text" placeholder="DISSIP-A24" class="form-input"/></div>
      <div><label class="form-label">Durée (h) *</label><input id="m_duree" type="number" step="0.5" placeholder="2.5" class="form-input"/></div>
      <div><label class="form-label">Heure début</label><input id="m_debut" type="time" value="06:00" class="form-input"/></div>
      <div><label class="form-label">Priorité</label>
        <select id="m_priorite" class="form-input">
          <option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critique">Critique</option>
        </select>
      </div>
      <div style="grid-column:span 2;"><label class="form-label">Opérateur <span id="compHint" style="color:#f59e0b;font-style:italic;font-size:.72rem;font-weight:400;"></span></label>
        <select id="m_operateur" class="form-input"><option value="">— Choisir opération d'abord —</option></select>
      </div>
    </div>
    <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
      <button onclick="closeModal('bdtModal')" class="btn btn-secondary">Annuler</button>
      <button onclick="createBDT()" class="btn btn-primary"><i class="fas fa-plus"></i> Créer le BDT</button>
    </div>
  </div>
</div>

<!-- Modal Soldage -->
<div id="soldageModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
  <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:480px;margin:1rem;overflow:hidden;">
    <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#22c55e,#16a34a);">
      <h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-check-double" style="margin-right:8px;"></i>Soldage BDT</h3>
      <button onclick="closeModal('soldageModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
    </div>
    <div style="padding:20px;">
      <div id="soldageInfo" style="background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:12px;font-size:.82rem;"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label class="form-label">Heure fin réelle *</label><input id="s_fin" type="time" class="form-input"/></div>
        <div><label class="form-label">Résultat</label>
          <select id="s_resultat" class="form-input">
            <option value="ok">✅ Conforme</option>
            <option value="reprise">⚠️ Reprise partielle</option>
            <option value="nc">❌ Non-conformité</option>
          </select>
        </div>
      </div>
      <div style="margin-top:10px;"><label class="form-label">Observations</label>
        <textarea id="s_obs" rows="2" class="form-input" style="resize:vertical;"></textarea>
      </div>
    </div>
    <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
      <button onclick="closeModal('soldageModal')" class="btn btn-secondary">Annuler</button>
      <button onclick="confirmerSoldage()" class="btn btn-success"><i class="fas fa-check-double"></i> Solder</button>
    </div>
  </div>
</div>

<!-- Modal ST -->
<div id="stModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
  <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:540px;margin:1rem;overflow:hidden;">
    <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#6366f1,#4338ca);">
      <h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-industry" style="margin-right:8px;"></i>Nouvelle Sous-Traitance</h3>
      <button onclick="closeModal('stModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
    </div>
    <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div><label class="form-label">N° Commande</label><input type="text" placeholder="CMD-2026-XXXX" class="form-input"/></div>
      <div><label class="form-label">Client final</label><input type="text" placeholder="Client" class="form-input"/></div>
      <div><label class="form-label">Opération à ST</label>
        <select class="form-input" id="st_op"></select>
      </div>
      <div><label class="form-label">Sous-traitant</label><input type="text" placeholder="Raison sociale" class="form-input"/></div>
      <div><label class="form-label">Date retour prévue</label><input type="date" class="form-input"/></div>
      <div><label class="form-label">Priorité</label>
        <select class="form-input"><option>Normal</option><option>Urgent</option><option>Critique</option></select>
      </div>
    </div>
    <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
      <button onclick="closeModal('stModal')" class="btn btn-secondary">Annuler</button>
      <button onclick="createST()" class="btn" style="background:linear-gradient(135deg,#6366f1,#4338ca);color:white;"><i class="fas fa-paper-plane"></i> Commander</button>
    </div>
  </div>
</div>

<script>
var OPERATEURS = ${OPS_J};
var SHIFTS_MAP = ${SHIFTS_J};
var ABSENCES_MAP = ${ABS_J};
var OPS_SEEM = ${OPS_SE};
var OPS_SEMRAC = ${OPS_SM};
var OPS_ST_OPS = ${OPS_ST};

var BDTS = JSON.parse('${escapeForJS(JSON.stringify(bdtsForGantt))}');
var currentDate = '${TODAY}';
var filtAct = 'all', filtShift = 'all';
var dragId = null, soldageBdtId = null;

var DAY_START=5, DAY_END=23, TOTAL_H=18, PX_H=50;
var LANE_W = TOTAL_H*PX_H;
var PRIO_COLORS={normal:'#22c55e',urgent:'#f59e0b',critique:'#ef4444',st:'#6366f1'};
var STATUT_COLORS={programme:'#3b82f6',recu:'#f59e0b',solde:'#22c55e',st:'#6366f1'};

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){ buildAll(); populateSTOps(); restorePlanFocus(); focusBdtFromUrl(); });
} else { buildAll(); populateSTOps(); restorePlanFocus(); focusBdtFromUrl(); }
// Deep-link depuis la liste des lots : /production/gantt-bdt?focusBdt=<id> -> cale la journée + surligne le BDT
function highlightBDT(id){
  var el=document.querySelector('[data-bdtid="'+id+'"]'); if(!el) return false;
  el.scrollIntoView({behavior:'smooth',block:'center'});
  var o=el.style.outline, s=el.style.boxShadow;
  el.style.outline='3px solid #f59e0b'; el.style.boxShadow='0 0 0 6px rgba(245,158,11,.25)';
  setTimeout(function(){ el.style.outline=o; el.style.boxShadow=s; },3000);
  return true;
}
function focusBdtFromUrl(){
  try{
    var id=new URLSearchParams(location.search).get('focusBdt'); if(!id) return;
    var bdt=null; for(var i=0;i<BDTS.length;i++){ if(BDTS[i].id===id){ bdt=BDTS[i]; break; } }
    if(bdt && bdt.datePrevue && bdt.datePrevue!==currentDate){ loadDay(bdt.datePrevue); var pd=document.getElementById('planDate'); if(pd) pd.value=currentDate; }
    setTimeout(function(){ highlightBDT(id); },250);
  }catch(e){}
}

// ── Mode « Agrandir le planning » : rétracte la section BDT en attente + ST et fait remplir au Gantt toute la hauteur dispo ──
function updatePlanFocusBtn(on){ var b=document.getElementById('planFocusBtn'); if(b) b.innerHTML = on ? '<i class="fas fa-compress"></i> Réduire le planning' : '<i class="fas fa-up-right-and-down-left-from-center"></i> Agrandir le planning'; }
function sizePlanFocus(){ var w=document.getElementById('prodWrap'), card=document.getElementById('ganttCard'), body=document.getElementById('ganttBody'); if(!w||!card||!body) return;
  if(w.classList.contains('plan-focus')){ var top=card.getBoundingClientRect().top; var h=Math.max(280, Math.floor(window.innerHeight - top - 16)); card.style.height=h+'px'; card.style.display='flex'; card.style.flexDirection='column'; card.style.marginBottom='0'; body.style.flex='1'; body.style.minHeight='0'; body.style.overflowY='auto'; }
  else { card.style.height=''; card.style.display=''; card.style.flexDirection=''; card.style.marginBottom='16px'; body.style.flex=''; body.style.minHeight=''; body.style.overflowY='hidden'; } }
function togglePlanFocus(){ var w=document.getElementById('prodWrap'); if(!w) return; var on=!w.classList.contains('plan-focus'); w.classList.toggle('plan-focus',on); try{ localStorage.setItem('prodPlanFocus', on?'1':'0'); }catch(e){} updatePlanFocusBtn(on); sizePlanFocus(); }
function restorePlanFocus(){ var on=false; try{ on=localStorage.getItem('prodPlanFocus')==='1'; }catch(e){} var w=document.getElementById('prodWrap'); if(w&&on) w.classList.add('plan-focus'); updatePlanFocusBtn(on); sizePlanFocus(); }
window.addEventListener('resize', sizePlanFocus);

function buildAll(){ buildHoursHdr(); buildStats(); buildGantt(); buildPending(); buildST(); }

function shiftDate(d){ var dt=new Date(currentDate); dt.setDate(dt.getDate()+d); currentDate=dt.toISOString().split('T')[0]; document.getElementById('planDate').value=currentDate; buildAll(); }
function loadDay(v){ currentDate=v; buildAll(); }

function setAct(a){
  filtAct=a;
  var actIds=['all','Seem','Semrac'];
  actIds.forEach(function(x){ var el=document.getElementById('fa-'+x); if(el){el.classList.toggle('active',x===a);} });
  buildAll();
}
function setShift(s){
  filtShift=s;
  var shiftIds=['all','matin','apmidi','journee','soir'];
  shiftIds.forEach(function(x){ var el=document.getElementById('fs-'+x); if(el){el.classList.toggle('active',x===s);} });
  buildAll();
}

function isAbsent(opId,date){ return !!(ABSENCES_MAP[opId]&&ABSENCES_MAP[opId].dates&&ABSENCES_MAP[opId].dates.indexOf(date)>=0); }

function buildHoursHdr(){
  var hdr=document.getElementById('hoursHdr');
  hdr.innerHTML='';
  hdr.style.cssText='width:'+LANE_W+'px;position:relative;height:34px;';
  for(var h=DAY_START;h<=DAY_END;h++){
    var el=document.createElement('div');
    el.style.cssText='position:absolute;left:'+((h-DAY_START)*PX_H)+'px;width:'+PX_H+'px;text-align:center;padding:7px 0;font-size:.6rem;'+(h%2===0?'font-weight:700;color:#94a3b8;':'color:#64748b;');
    el.textContent=h+'h';
    hdr.appendChild(el);
  }
}

function buildGantt(){
  var dow=new Date(currentDate).getDay();
  var isWE=(dow===0||dow===6);
  var body=document.getElementById('ganttBody');
  body.innerHTML='';
  var ops=OPERATEURS.filter(function(op){
    if(filtAct!=='all'&&op.activite!==filtAct) return false;
    if(filtShift!=='all'&&op.shift!==filtShift) return false;
    return true;
  });
  if(ops.length===0){
    body.innerHTML='<div style="text-align:center;padding:40px;color:#94a3b8;font-size:.82rem;"><i class="fas fa-users" style="font-size:2rem;display:block;margin-bottom:8px;opacity:.3;"></i>Aucun opérateur pour ce filtre</div>';
    return;
  }
  ops.forEach(function(op){
    var absent=isAbsent(op.id,currentDate);
    var bdtsOp=BDTS.filter(function(b){ return b.op===op.id; });
    var sh=SHIFTS_MAP[op.shift]||SHIFTS_MAP['journee']||{label:'Journée',start:7,end:17,color:'#10b981'};
    var row=document.createElement('div');
    row.className='gantt-body-row';
    var actColor=op.activite==='Seem'?'#3b82f6':'#ec4899';
    var info=document.createElement('div');
    info.className='op-info-cell'+(absent?' absent':'');
    info.innerHTML='<div style="display:flex;align-items:center;gap:6px;">'+
      '<div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:.65rem;font-weight:700;flex-shrink:0;background:'+actColor+';">'+op.nom.charAt(0)+'</div>'+
      '<div><div style="font-size:.75rem;font-weight:700;color:#1e293b;">'+op.nom+'</div>'+
      '<div style="font-size:.62rem;color:#94a3b8;">'+op.poste+'</div></div>'+
      (absent?'<span style="margin-left:auto;background:#fef2f2;color:#b91c1c;font-size:.6rem;padding:1px 6px;border-radius:999px;font-weight:700;">Absent</span>':'')+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:4px;margin-top:3px;flex-wrap:wrap;">'+
      '<span style="font-size:.6rem;padding:1px 6px;border-radius:999px;font-weight:600;background:'+sh.color+'22;color:'+sh.color+';">'+sh.label+'</span>'+
      '<span style="font-size:.6rem;padding:1px 6px;border-radius:999px;font-weight:600;background:'+actColor+'22;color:'+actColor+';">'+op.activite+'</span>'+
      '<span style="font-size:.6rem;color:#94a3b8;">'+bdtsOp.filter(function(b){return b.statut!=='solde';}).length+' BDT</span>'+
      '</div>';
    var lane=document.createElement('div');
    lane.className='gantt-lane'+(absent?' absent':'');
    lane.style.cssText='position:relative;min-height:68px;width:'+LANE_W+'px;';
    lane.dataset.opid=op.id;
    for(var h=0;h<=TOTAL_H;h++){
      var t=document.createElement('div');
      t.className='gantt-tick'+(h%2===0?' major':'');
      t.style.left=(h*PX_H)+'px';
      lane.appendChild(t);
    }
    if(!absent&&!isWE){
      var z=document.createElement('div');
      z.className='shift-zone';
      z.style.cssText='left:'+Math.max(0,(sh.start-DAY_START)*PX_H)+'px;width:'+Math.min(TOTAL_H,(sh.end-sh.start))*PX_H+'px;background:'+sh.color+';';
      lane.appendChild(z);
      bdtsOp.forEach(function(bdt){ lane.appendChild(makeBdtBar(bdt)); });
      lane.addEventListener('dragover',function(e){ e.preventDefault(); lane.classList.add('drag-over'); });
      lane.addEventListener('dragleave',function(){ lane.classList.remove('drag-over'); });
      lane.addEventListener('drop',function(e){ e.preventDefault(); lane.classList.remove('drag-over'); if(dragId) affectBDT(dragId,op.id); dragId=null; });
    } else {
      var m=document.createElement('div');
      m.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#94a3b8;pointer-events:none;';
      m.innerHTML=absent?'<i class="fas fa-ban" style="margin-right:6px;color:#f87171;"></i>Absent':'<i class="fas fa-moon" style="margin-right:6px;"></i>Week-end';
      lane.appendChild(m);
    }
    if(!absent&&!isWE&&bdtsOp.length===0){
      var em=document.createElement('div');
      em.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.68rem;color:#d1d5db;pointer-events:none;';
      em.innerHTML='<i class="fas fa-inbox" style="margin-right:4px;"></i>Journée disponible';
      lane.appendChild(em);
    }
    row.appendChild(info); row.appendChild(lane); body.appendChild(row);
  });
}

function makeBdtBar(bdt){
  var startOff=Math.max(0,bdt.debut-DAY_START);
  var w=Math.max(bdt.duree*PX_H-4,30);
  var l=startOff*PX_H+2;
  var color=bdt.statut==='solde'?'#22c55e':bdt.statut==='recu'?'#f59e0b':PRIO_COLORS[bdt.priorite]||'#22c55e';
  var el=document.createElement('div');
  el.className='bdt-bar'+(bdt.statut==='solde'?' solde':'')+(bdt.statut==='programme'?' programme':'');
  el.draggable=true;
  el.dataset.bdtid=bdt.id;
  el.style.cssText='left:'+l+'px;width:'+w+'px;background:'+color+';color:white;';
  el.innerHTML='<div style="font-size:.58rem;font-weight:800;opacity:.85;">'+bdt.id+'</div>'+
    '<div style="font-size:.62rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(bdt.poste?'<i class="fas fa-location-dot" style="font-size:.5rem;opacity:.8;"></i> '+bdt.poste+' · ':'')+bdt.operation+'</div>'+
    '<div style="font-size:.58rem;opacity:.75;">'+bdt.client+' · '+bdt.duree+'h</div>';
  el.addEventListener('dragstart',function(e){ dragId=bdt.id; e.dataTransfer.setData('text/plain',bdt.id); });
  el.addEventListener('mouseenter',function(e){ showTT(e,bdt); });
  el.addEventListener('mousemove',function(e){ moveTT(e); });
  el.addEventListener('mouseleave',hideTT);
  el.addEventListener('dblclick',function(){ openSoldageModal(bdt.id); });
  el.addEventListener('contextmenu',function(e){ e.preventDefault(); openStatutMenu(e,bdt); });
  return el;
}

function openStatutMenu(e,bdt){
  var existingMenu=document.getElementById('ctxMenu'); if(existingMenu) existingMenu.remove();
  var transitions={programme:['recu'],recu:['solde','programme'],solde:[]};
  var next=transitions[bdt.statut]||[]; if(!next.length) return;
  var menu=document.createElement('div');
  menu.id='ctxMenu';
  menu.style.cssText='position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;background:white;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.2);z-index:999;min-width:190px;overflow:hidden;border:1px solid #f1f5f9;';
  var title=document.createElement('div');
  title.style.cssText='padding:.45rem .7rem;font-size:.7rem;font-weight:700;color:#64748b;background:#f8fafc;border-bottom:1px solid #f1f5f9;';
  title.innerHTML='<i class="fas fa-exchange-alt" style="margin-right:4px;"></i>'+bdt.id;
  menu.appendChild(title);
  var labels={recu:'<i class="fas fa-play" style="margin-right:6px;color:#f59e0b;"></i>Passer à Reçu',solde:'<i class="fas fa-check-double" style="margin-right:6px;color:#22c55e;"></i>Solder le BDT'};
  next.forEach(function(s){
    var item=document.createElement('div');
    item.style.cssText='padding:.45rem .7rem;font-size:.78rem;cursor:pointer;transition:background .1s;';
    item.innerHTML=labels[s]||s;
    item.addEventListener('mouseenter',function(){ item.style.background='#f1f5f9'; });
    item.addEventListener('mouseleave',function(){ item.style.background=''; });
    item.addEventListener('click',function(){ menu.remove(); if(s==='solde') openSoldageModal(bdt.id); else changerStatut(bdt.id,s); });
    menu.appendChild(item);
  });
  setTimeout(function(){ document.addEventListener('click',function handler(){ menu.remove(); document.removeEventListener('click',handler); },{once:true}); },50);
  document.body.appendChild(menu);
}

function changerStatut(bdtId,newStatut){
  var bdt=BDTS.find(function(b){ return b.id===bdtId; }); if(!bdt) return;
  bdt.statut=newStatut;
  if(newStatut==='recu'){ var now=new Date(); bdt.debutReel=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0'); }
  buildAll();
  pushNotif('info','fa-exchange-alt','BDT <strong>'+bdtId+'</strong> → '+newStatut);
}

function openSoldageModal(bdtId){
  soldageBdtId=bdtId;
  var bdt=BDTS.find(function(b){ return b.id===bdtId; }); if(!bdt) return;
  if(bdt.statut==='solde'){ pushNotif('info','fa-info-circle','Déjà soldé.'); return; }
  if(bdt.statut==='programme'){ pushNotif('warn','fa-exclamation-triangle','Passer à Reçu avant de solder.'); return; }
  var op=OPERATEURS.find(function(o){ return o.id===bdt.op; });
  document.getElementById('soldageInfo').innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.78rem;">'+
    '<div><span style="color:#94a3b8;">BDT : </span><strong>'+bdt.id+'</strong></div>'+
    '<div><span style="color:#94a3b8;">Opération : </span>'+bdt.operation+'</div>'+
    '<div><span style="color:#94a3b8;">Opérateur : </span>'+(op?op.nom:'—')+'</div>'+
    '<div><span style="color:#94a3b8;">Client : </span>'+bdt.client+'</div>'+
    '<div><span style="color:#94a3b8;">Durée allouée : </span><strong>'+bdt.tempsAlloue+'h</strong></div>'+
    '<div><span style="color:#94a3b8;">Pièce : </span>'+bdt.piece+'</div>'+
    '</div>';
  var now=new Date();
  document.getElementById('s_fin').value=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  var sm=document.getElementById('soldageModal'); sm.style.display='flex';
}

function confirmerSoldage(){
  var bdt=BDTS.find(function(b){ return b.id===soldageBdtId; }); if(!bdt) return;
  var finStr=document.getElementById('s_fin').value;
  var resultat=document.getElementById('s_resultat').value;
  if(!finStr){ pushNotif('err','fa-exclamation-circle','Heure de fin manquante.'); return; }
  bdt.statut='solde'; bdt.finReel=finStr;
  if(bdt.debutReel){
    var dParts=bdt.debutReel.split(':').map(Number);
    var fParts=finStr.split(':').map(Number);
    bdt.tempsReel=parseFloat(((fParts[0]*60+fParts[1]-dParts[0]*60-dParts[1])/60).toFixed(2));
  }
  closeModal('soldageModal'); buildAll();
  var ecart=bdt.tempsReel?(bdt.tempsReel-bdt.tempsAlloue).toFixed(2):0;
  pushNotif('ok','fa-check-double','BDT <strong>'+soldageBdtId+'</strong> soldé. Temps réel: '+bdt.tempsReel+'h. Écart: '+(ecart>0?'+':'')+ecart+'h');
  if(resultat==='nc') pushNotif('err','fa-exclamation-triangle','Non-conformité signalée → Fiche NC créée auto.');
  soldageBdtId=null;
}

function affectBDT(bdtId,opId){
  var bdt=BDTS.find(function(b){ return b.id===bdtId; }); if(!bdt) return;
  var op=OPERATEURS.find(function(o){ return o.id===opId; }); if(!op) return;
  if(op.activite!==bdt.activite){ pushNotif('err','fa-ban','Incompatibilité activité : '+op.nom+' ('+op.activite+') ≠ BDT '+bdt.activite); return; }
  if(op.competences.indexOf(bdt.operation)<0){ pushNotif('err','fa-ban',op.nom+' – habilitation manquante pour : '+bdt.operation); return; }
  if(isAbsent(opId,currentDate)){ pushNotif('err','fa-calendar-times',op.nom+' est absent. Affectation impossible.'); return; }
  bdt.op=opId; bdt.statut='programme';
  pushNotif('ok','fa-check-circle','BDT <strong>'+bdtId+'</strong> affecté à <strong>'+op.nom+'</strong>.');
  buildAll();
}

function buildStats(){
  var ops=OPERATEURS.filter(function(o){ return filtAct==='all'||o.activite===filtAct; });
  var bdtOps=BDTS.filter(function(b){ return b.op!=='ST'&&b.op!=='pending'&&ops.find(function(o){ return o.id===b.op; }); });
  var absIds=Object.keys(ABSENCES_MAP).filter(function(id){ return ABSENCES_MAP[id].dates&&ABSENCES_MAP[id].dates.indexOf(currentDate)>=0; });
  var chargeH=bdtOps.reduce(function(s,b){ return s+b.duree; },0);
  var dispOps=ops.filter(function(o){ return absIds.indexOf(o.id)<0; }).length;
  var capaTot=dispOps*8;
  var taux=capaTot>0?Math.round(chargeH/capaTot*100):0;
  var items=[
    {icon:'fa-clipboard-list',val:bdtOps.filter(function(b){return b.statut==='programme';}).length,label:'Programmés',color:'#3b82f6'},
    {icon:'fa-play-circle',val:bdtOps.filter(function(b){return b.statut==='recu';}).length,label:'En cours',color:'#f59e0b'},
    {icon:'fa-check-double',val:bdtOps.filter(function(b){return b.statut==='solde';}).length,label:'Soldés',color:'#22c55e'},
    {icon:'fa-inbox',val:BDTS.filter(function(b){return b.op==='pending';}).length,label:'En attente',color:'#ef4444'},
    {icon:'fa-industry',val:BDTS.filter(function(b){return b.op==='ST';}).length,label:'Sous-trait.',color:'#6366f1'},
    {icon:'fa-users',val:dispOps+'/'+ops.length,label:'Opér. dispo',color:'#10b981'},
    {icon:'fa-chart-bar',val:taux+'%',label:'Charge jour',color:'#f97316'},
  ];
  document.getElementById('statsBar').innerHTML=items.map(function(s){
    return '<div class="stat-pill"><i class="fas '+s.icon+'" style="color:'+s.color+';font-size:.9rem;"></i><div style="font-size:1.2rem;font-weight:900;color:#1e293b;margin:2px 0;">'+s.val+'</div><div style="font-size:.62rem;color:#94a3b8;">'+s.label+'</div></div>';
  }).join('');
}

function buildPending(){
  var p=BDTS.filter(function(b){ return b.op==='pending'; });
  document.getElementById('cntPend').textContent=p.length;
  document.getElementById('pendingList').innerHTML=p.length
    ?p.map(function(b){
      return '<div class="pending-card" draggable="true" data-bdtid="'+b.id+'" ondragstart="dragId=this.dataset.bdtid" id="pend-'+b.id+'">'+
        '<div style="width:8px;height:32px;border-radius:4px;flex-shrink:0;background:'+(PRIO_COLORS[b.priorite]||'#22c55e')+'"></div>'+
        '<div style="flex:1;min-width:0;">'+
          '<div style="font-weight:700;color:#1e293b;font-size:.75rem;">'+b.id+' <span style="background:#ede9fe;color:#6d28d9;font-weight:700;font-size:.62rem;padding:1px 7px;border-radius:999px;"><i class="fas fa-location-dot" style="font-size:.55rem;"></i> '+(b.poste||'sans poste')+'</span></div>'+
          '<div style="color:#94a3b8;font-size:.68rem;">'+b.client+' · '+b.piece+' · '+b.operation+' · '+b.duree+'h · <span style="color:'+(b.activite==='Seem'?'#3b82f6':'#ec4899')+';font-weight:600;">'+b.activite+'</span></div>'+
        '</div></div>';
    }).join('')
    :'<div style="text-align:center;padding:20px;color:#d1d5db;font-size:.75rem;"><i class="fas fa-check-circle" style="display:block;font-size:1.5rem;margin-bottom:4px;"></i>Tous les BDT sont affectés</div>';
}

function buildST(){
  var s=BDTS.filter(function(b){ return b.op==='ST'; });
  document.getElementById('cntST').textContent=s.length;
  document.getElementById('stList').innerHTML=s.length
    ?s.map(function(b){
      return '<div style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:8px;background:#ede9fe;border:1px solid #c4b5fd;font-size:.72rem;margin-bottom:4px;">'+
        '<i class="fas fa-industry" style="color:#6366f1;flex-shrink:0;"></i>'+
        '<div style="flex:1;"><div style="font-weight:700;color:#4338ca;">'+b.id+' · '+b.operation+'</div>'+
        '<div style="color:#6366f1;">'+b.client+' · '+b.piece+' · '+b.duree+'h</div></div>'+
        '</div>';
    }).join('')
    :'<div style="text-align:center;padding:12px;color:#d1d5db;font-size:.72rem;">Aucune ST en cours</div>';
}

function populateSTOps(){
  var cont=document.getElementById('stOpsList');
  if(cont) cont.innerHTML=OPS_ST_OPS.map(function(op){ return '<span style="background:#ede9fe;color:#5b21b6;border:1px solid #c4b5fd;border-radius:999px;padding:2px 8px;font-size:.65rem;">'+op+'</span>'; }).join('');
  var sel=document.getElementById('st_op');
  if(sel) sel.innerHTML=OPS_ST_OPS.map(function(op){ return '<option>'+op+'</option>'; }).join('');
}

function showTT(e,bdt){
  var op=OPERATEURS.find(function(o){ return o.id===bdt.op; });
  var tt=document.getElementById('ganttTT'); tt.style.display='block';
  tt.innerHTML='<div style="font-weight:700;font-size:.85rem;margin-bottom:4px;">'+bdt.id+'</div>'+
    '<div style="color:#93c5fd;font-size:.72rem;margin-bottom:8px;">'+bdt.operation+' · '+bdt.activite+'</div>'+
    '<div style="font-size:.72rem;line-height:1.6;">'+
    '<div><span style="opacity:.6;">Client : </span>'+bdt.client+'</div>'+
    '<div><span style="opacity:.6;">Pièce : </span>'+bdt.piece+'</div>'+
    '<div><span style="opacity:.6;">Durée : </span>'+bdt.tempsAlloue+'h</div>'+
    '<div><span style="opacity:.6;">Opérateur : </span>'+(op?op.nom:'—')+'</div>'+
    '<div><span style="opacity:.6;">Statut : </span><strong style="color:'+(STATUT_COLORS[bdt.statut]||'#22c55e')+';">'+bdt.statut+'</strong></div>'+
    '<div style="margin-top:4px;color:#fde68a;font-size:.65rem;">Dbl-clic = Soldage · Clic droit = Statut</div>'+
    '</div>';
  moveTT(e);
}
function moveTT(e){ var tt=document.getElementById('ganttTT'); tt.style.left=(e.clientX+16)+'px'; tt.style.top=(e.clientY+10)+'px'; }
function hideTT(){ document.getElementById('ganttTT').style.display='none'; }

function closeModal(id){
  var el=document.getElementById(id); if(el){ el.style.display='none'; }
}
function openBdtModal(){ document.getElementById('bdtModal').style.display='flex'; }
function openSTModal(){ document.getElementById('stModal').style.display='flex'; }

function updateModalOps(){
  var act=document.getElementById('m_activite').value;
  var ops=act==='Seem'?OPS_SEEM:act==='Semrac'?OPS_SEMRAC:[];
  document.getElementById('m_operation').innerHTML='<option value="">— Choisir opération —</option>'+ops.map(function(o){return '<option>'+o+'</option>';}).join('');
  document.getElementById('m_operateur').innerHTML='<option value="">— Choisir opération d&#39;abord —</option>';
}
function updateModalOpsEligibles(){
  var op=document.getElementById('m_operation').value;
  var act=document.getElementById('m_activite').value;
  var eligible=OPERATEURS.filter(function(o){ return o.activite===act&&o.competences.indexOf(op)>=0; });
  document.getElementById('compHint').textContent=eligible.length===0?'⚠ Aucun opérateur habilité':'';
  document.getElementById('m_operateur').innerHTML='<option value="">— Choisir —</option>'+eligible.map(function(o){return '<option value="'+o.id+'">'+o.nom+'</option>';}).join('');
}
function createBDT(){
  var cmd=document.getElementById('m_cmd').value;
  var client=document.getElementById('m_client').value;
  var op=document.getElementById('m_operation').value;
  var piece=document.getElementById('m_piece').value;
  var duree=parseFloat(document.getElementById('m_duree').value)||1;
  var debut=parseFloat((document.getElementById('m_debut').value||'06:00').split(':')[0]);
  var prio=document.getElementById('m_priorite').value;
  var opId=document.getElementById('m_operateur').value||'pending';
  var act=document.getElementById('m_activite').value;
  if(!cmd||!client||!op||!piece){ pushNotif('err','fa-exclamation-circle','Champs obligatoires manquants.'); return; }
  var newId='BDT-'+(900+BDTS.length+1);
  BDTS.push({id:newId,op:opId,client:client,piece:piece,operation:op,duree:duree,debut:debut,priorite:prio,statut:opId==='pending'?'a_programmer':'programme',activite:act,tempsAlloue:duree,debutReel:null,finReel:null});
  closeModal('bdtModal');
  buildAll();
  pushNotif('ok','fa-plus-circle','BDT <strong>'+newId+'</strong> créé. Notification Teams envoyée.');
}
function createST(){
  pushNotif('ok','fa-paper-plane','Commande ST envoyée. Fournisseur notifié. Archivage GED automatique.');
  closeModal('stModal');
}
</script>`

  return layout('Planning Gantt BDT', content, 'prod-gantt-bdt')
}

function deriveShift(shiftId?: string): string {
  if (!shiftId) return 'journee'
  const lower = shiftId.toLowerCase()
  if (lower.includes('matin') || lower.includes('morning')) return 'matin'
  if (lower.includes('apmidi') || lower.includes('apres') || lower.includes('après') || lower.includes('pm')) return 'apmidi'
  if (lower.includes('soir') || lower.includes('night') || lower.includes('nuit')) return 'soir'
  if (lower.includes('journee') || lower.includes('journée') || lower.includes('day')) return 'journee'
  return 'journee'
}

function escapeForJS(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
}

// ══════════════════════════════════════════════════════════════
// PAGE 2 : GANTT BST (SOUS-TRAITANCE) – vue 14 jours
// ══════════════════════════════════════════════════════════════
export const pageGanttBST = (
  dbLots?:        Lot[],
  dbFournisseurs?: FournisseurSt[],
) => {
  const LOTS  = dbLots ?? LOTS_DEFAULT
  const FOURN = dbFournisseurs ?? FOURN_DEFAULT

  const today = new Date()
  const DAYS: {label:string; iso:string}[] = Array.from({length:14}, (_,i) => {
    const d = new Date(today); d.setDate(today.getDate() + i)
    return { label: d.toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'2-digit'}), iso: d.toISOString().slice(0,10) }
  })
  const MS_DAY = 86400000
  const totalMs = 14 * MS_DAY

  const fournRows = FOURN.map(f => {
    const lots_f = LOTS.filter(l => l.statut === 'sous_trait' || l.statut === 'planifié').slice(0,3)
    const blocks = lots_f.map(l => {
      if (!l.date_debut || !l.date_fin) return ''
      const startMs = new Date(l.date_debut).getTime() - new Date(DAYS[0].iso).getTime()
      const endMs   = new Date(l.date_fin).getTime()   - new Date(DAYS[0].iso).getTime()
      const sp = Math.max(0, startMs / totalMs * 100).toFixed(1)
      const wp = Math.min(100 - parseFloat(sp), (endMs - startMs) / totalMs * 100).toFixed(1)
      return `<div draggable="true" title="${l.id} · ${escX(l.piece??'')} · du ${l.date_debut} au ${l.date_fin}" style="position:absolute;top:5px;bottom:5px;left:${sp}%;width:${wp}%;background:#6366f133;border:2px solid #6366f1;border-radius:6px;cursor:grab;display:flex;align-items:center;padding:0 6px;font-size:.6rem;font-weight:700;color:#4338ca;white-space:nowrap;overflow:hidden;">${l.id}</div>`
    }).join('')
    const otdC = (f.otd??0)>=90?'#22c55e':(f.otd??0)>=75?'#f59e0b':'#ef4444'
    return `<tr>
      <td style="padding:6px 10px;font-size:.72rem;font-weight:700;color:#374151;border-bottom:1px solid #f1f5f9;white-space:nowrap;min-width:200px;background:#fafafa;">
        <div style="font-weight:700;">${escX(f.nom)}</div>
        <div style="font-size:.62rem;color:#94a3b8;">${escX(f.operation??'')} · ${escX(f.localisation??'')}</div>
        <div style="font-size:.62rem;">OTD: <span style="font-weight:700;color:${otdC};">${f.otd??'—'}%</span></div>
      </td>
      <td style="position:relative;height:52px;padding:0;border-bottom:1px solid #f1f5f9;" ondragover="event.preventDefault()" ondrop="onDropFourn(event,'${f.id}')">
        ${blocks}
      </td>
    </tr>`
  }).join('')

  const dayHeaders = DAYS.map(d => {
    const isWE = new Date(d.iso).getDay() === 0 || new Date(d.iso).getDay() === 6
    return `<th style="text-align:center;padding:4px 2px;font-size:.6rem;font-weight:${isWE?'500':'700'};color:${isWE?'#cbd5e1':'#64748b'};border-bottom:2px solid #e2e8f0;white-space:nowrap;width:${100/14}%;background:${isWE?'#f8fafc':'white'};">${d.label}</th>`
  }).join('')

  const lotCards = LOTS.map(l => `
    <div draggable="true" data-lot="${l.id}" ondragstart="onLotDragStart(event)" style="background:white;border:1.5px solid #6366f1;border-radius:8px;padding:8px 12px;cursor:grab;flex-shrink:0;min-width:160px;">
      <div style="font-size:.7rem;font-weight:800;color:#4338ca;">${l.id}</div>
      <div style="font-size:.72rem;color:#374151;font-weight:600;">${escX(l.piece??'')}</div>
      <div style="font-size:.65rem;color:#64748b;">${escX(l.client_nom??'')} · qté ${l.qte??'?'}</div>
    </div>`).join('')

  const content = `
<div style="padding:24px;max-width:1600px;margin:0 auto;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
    <div>
      <h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">Planning Gantt Sous-Traitance</h1>
      <div style="font-size:.78rem;color:#64748b;margin-top:2px;">Vue 14 jours · Affectation lots fournisseurs ST · ${DAYS[0].iso} → ${DAYS[13].iso}</div>
    </div>
  </div>
  <div class="card" style="overflow:hidden;margin-bottom:20px;">
    <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;">
      <i class="fas fa-industry" style="color:#6366f1;"></i>
      <span style="font-weight:700;color:#1e293b;font-size:.88rem;">Fournisseurs ST · Gantt 14 jours</span>
      <span style="font-size:.72rem;color:#64748b;">${FOURN.length} fournisseur${FOURN.length!==1?'s':''}</span>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="text-align:left;padding:8px 10px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #e2e8f0;white-space:nowrap;min-width:200px;">Fournisseur</th>
          <th style="padding:0;border-bottom:2px solid #e2e8f0;"><table style="width:100%;border-collapse:collapse;"><thead><tr>${dayHeaders}</tr></thead></table></th>
        </tr></thead>
        <tbody>${fournRows||'<tr><td colspan="2" style="text-align:center;padding:40px;color:#94a3b8;">Aucun fournisseur ST en base de données.</td></tr>'}</tbody>
      </table>
    </div>
  </div>
  <div class="card">
    <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;">
      <i class="fas fa-layer-group" style="color:#6366f1;"></i>
      <span style="font-weight:700;color:#1e293b;font-size:.88rem;">Lots à affecter</span>
      <span style="font-size:.72rem;color:#64748b;">${LOTS.length} lot${LOTS.length!==1?'s':''} · Glissez sur une ligne fournisseur</span>
    </div>
    <div style="padding:14px;display:flex;flex-wrap:wrap;gap:10px;">
      ${lotCards||'<div style="color:#94a3b8;font-size:.78rem;">Aucun lot en base de données.</div>'}
    </div>
  </div>
</div>
<script>
var _dragLot=null;
function onLotDragStart(e){ _dragLot=e.currentTarget.dataset.lot; e.dataTransfer.effectAllowed='move'; }
function onDropFourn(e,fournId){ e.preventDefault(); if(!_dragLot) return; pushNotif('ok','fa-check-circle','Lot '+_dragLot+' affecté au fournisseur '+fournId+' (simulation).'); _dragLot=null; }
</script>`

  return layout('Planning Gantt Sous-Traitance', content, 'prod-gantt-bst')
}

// ══════════════════════════════════════════════════════════════
// PAGE 3 : COMMANDES EN COURS
// ══════════════════════════════════════════════════════════════
export const pageCommandesProd = (dbCmds?: Commande[]) => {
  const CMDS = dbCmds ?? CMD_DEFAULT
  const rows = CMDS.map(c => {
    const av = c.bdt_total>0 ? Math.round(c.bdt_soldes/c.bdt_total*100) : 0
    const retBadge = c.retard ? '<span style="border-radius:999px;padding:2px 9px;font-size:.62rem;font-weight:700;background:#fef2f2;color:#b91c1c;">Retard</span>' : STATUT_BADGE(c.statut)
    return `<tr data-num="${escX(c.num_affaire??'')}" data-client="${escX(c.client_nom??'')}" data-statut="${c.statut??''}" data-activite="${c.activite??''}" onclick="location.href='/production/commande/'+encodeURIComponent('${c.id}')" style="cursor:pointer;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
      ${TD(`<span style="font-weight:800;color:#1e293b;">${escX(c.id??c.num_affaire??'—')}</span>${c.num_affaire?`<div style="font-size:.62rem;color:#94a3b8;font-weight:600;">Affaire ${escX(c.num_affaire)}</div>`:''}`)}
      ${TD(escX(c.client_nom??'—'))}
      ${TD(escX((c.pieces??[]).join(', ')))}
      ${TD(`${(c.montant??0).toLocaleString('fr-FR')} €`)}
      ${TD(c.date_cmd??'—')}
      ${TD(c.date_liv ? `<span style="${c.retard?'color:#b91c1c;font-weight:700;':''}">${c.date_liv}</span>` : '—')}
      ${TD(retBadge)}
      ${TD(`<div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:6px;background:#e2e8f0;border-radius:3px;min-width:60px;"><div style="height:100%;width:${av}%;background:${av===100?'#22c55e':av>50?'#3b82f6':'#f59e0b'};border-radius:3px;"></div></div><span style="font-size:.7rem;font-weight:700;color:#374151;">${av}%</span></div>`)}
      ${TD(c.has_st?'<span style="background:#e0e7ff;color:#3730a3;border-radius:999px;padding:2px 8px;font-size:.62rem;font-weight:700;">ST</span>':'—')}
    </tr>`
  }).join('')

  const content = `
<div style="padding:24px;margin:0 auto;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
    <div>
      <h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">Commandes en cours</h1>
      <div style="font-size:.78rem;color:#64748b;margin-top:2px;">${CMDS.length} commande${CMDS.length!==1?'s':''}</div>
    </div>
    ${prodSearchBar('tbl-cmds-prod',[['num','N° affaire'],['client','Client'],['statut','Statut'],['activite','Activité']])}
  </div>
  <div class="card" style="overflow:hidden;">
    <table id="tbl-cmds-prod" style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#f8fafc;">${TH('N° CMD / Affaire')}${TH('Client')}${TH('Pièces')}${TH('Montant')}${TH('Date cmd')}${TH('Livraison')}${TH('Statut')}${TH('Avancement BDT')}${TH('ST')}</tr></thead>
      <tbody>${rows||'<tr><td colspan="9" style="text-align:center;padding:40px;color:#94a3b8;">Aucune commande en cours.</td></tr>'}</tbody>
    </table>
  </div>
</div>
<script>${PROD_SEARCH_FN}</script>`
  return layout('Commandes Production', content, 'prod-commandes')
}

// ══════════════════════════════════════════════════════════════
// PAGE 4 : LOTS EN COURS
// ══════════════════════════════════════════════════════════════
export const pageLotsProd = (dbLots?: Lot[]) => {
  const LOTS = dbLots ?? LOTS_DEFAULT
  const rows = LOTS.map(l => `
    <tr data-id="${l.id}" data-client="${escX(l.client_nom??'')}" data-piece="${escX(l.piece??'')}" data-statut="${l.statut??''}" onclick="location.href='/production/lot/'+encodeURIComponent('${l.id}')" style="cursor:pointer;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
      ${TD(`<span style="font-weight:700;color:#3b82f6;">${l.id}</span>`)}
      ${TD(escX(l.client_nom??'—'))}
      ${TD(escX(l.piece??'—'))}
      ${TD(l.qte!=null?String(l.qte):'—')}
      ${TD(l.date_debut??'—')}
      ${TD(l.date_fin??'—')}
      ${TD(STATUT_BADGE(l.statut))}
      ${TD(l.cmd_id?`<a href="/production/commande/${encodeURIComponent(l.cmd_id)}" onclick="event.stopPropagation()" style="color:#3b82f6;text-decoration:none;font-size:.78rem;">${l.cmd_id}</a>`:'—')}
      ${TD(`<button onclick="event.stopPropagation();location.href='/production/lot/'+encodeURIComponent('${l.id}')+'?print=1'" title="Imprimer l'ordre de fabrication" style="background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:7px;padding:4px 10px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-print"></i></button>`)}
    </tr>`).join('')

  const content = `
<div style="padding:24px;margin:0 auto;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
    <div>
      <h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">Lots en cours</h1>
      <div style="font-size:.78rem;color:#64748b;margin-top:2px;">${LOTS.length} lot${LOTS.length!==1?'s':''}</div>
    </div>
    ${prodSearchBar('tbl-lots-prod',[['id','Réf. lot'],['client','Client'],['piece','Pièce'],['statut','Statut']])}
  </div>
  <div class="card" style="overflow:hidden;">
    <table id="tbl-lots-prod" style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#f8fafc;">${TH('Réf. Lot')}${TH('Client')}${TH('Pièce')}${TH('Qté')}${TH('Début')}${TH('Fin')}${TH('Statut')}${TH('Commande')}${TH('OF')}</tr></thead>
      <tbody>${rows||'<tr><td colspan="9" style="text-align:center;padding:40px;color:#94a3b8;">Aucun lot en cours.</td></tr>'}</tbody>
    </table>
  </div>
</div>
<script>${PROD_SEARCH_FN}</script>`
  return layout('Lots Production', content, 'prod-lots')
}

// ══════════════════════════════════════════════════════════════
// PAGE 4bis : DÉTAIL COMMANDE — tous les lots, découpés en BDT/BDS
// ══════════════════════════════════════════════════════════════
const OP_KIND_BADGE = (k: string) => k === 'BDS'
  ? '<span style="border-radius:6px;padding:2px 7px;font-size:.6rem;font-weight:800;background:#ede9fe;color:#6d28d9;letter-spacing:.04em;">BDS</span>'
  : '<span style="border-radius:6px;padding:2px 7px;font-size:.6rem;font-weight:800;background:#dbeafe;color:#1d4ed8;letter-spacing:.04em;">BDT</span>'

const seqSort = (a: any, b: any) => {
  const sa = a.seq == null ? 9999 : Number(a.seq), sb = b.seq == null ? 9999 : Number(b.seq)
  if (sa !== sb) return sa - sb
  return String(a.id).localeCompare(String(b.id))
}

const normOps = (bdts: any[], bsts: any[]) => [
  ...bdts.map(b => ({ kind:'BDT', id:b.id, lotKey:(b.lot_id||b.lot_ref||null), piece:b.piece, operation:b.operation, statut:b.statut, seq:b.seq, priorite:b.priorite, client:b.client_nom })),
  ...bsts.map(s => ({ kind:'BDS', id:s.id, lotKey:(s.lot_id||s.lot_ref||null), piece:s.piece, operation:s.operation, statut:s.statut, seq:s.seq, priorite:s.priorite, client:s.client_nom, st:s.sous_traitant_id }))
]

const isSolde = (st: string) => /solde|soldé|termin/i.test(st || '')

const KPI_CARD = (label: string, value: string, color: string) =>
  `<div style="flex:1;min-width:120px;background:#f8fafc;border:1px solid #eef2f7;border-radius:12px;padding:12px 14px;">
    <div style="font-size:.64rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;">${label}</div>
    <div style="font-size:1.3rem;font-weight:900;color:${color};margin-top:3px;">${value}</div>
  </div>`

const opRowsHtml = (ops: any[]) => ops.slice().sort(seqSort).map((op, i) => `
  <tr>
    ${TD(`<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#f1f5f9;font-weight:800;font-size:.7rem;color:#475569;">${op.seq != null ? op.seq : (i + 1)}</span>`)}
    ${TD(OP_KIND_BADGE(op.kind))}
    ${TD(`<span style="font-weight:700;color:#1e293b;">${escX(op.operation || '—')}</span>`)}
    ${TD(escX(op.piece || '—'))}
    ${TD(`<span style="font-family:ui-monospace,monospace;font-size:.72rem;color:#64748b;">${op.id}</span>`)}
    ${TD(STATUT_BADGE(op.statut || '—'))}
  </tr>`).join('')

export const pageCommandeDetail = (
  routeId: string,
  cmd: Commande | undefined,
  lots: Lot[],
  bdts: any[],
  bsts: any[]
) => {
  const C: any = cmd ?? { id: routeId, num_affaire: routeId, client_nom: (bdts[0]?.client_nom) || (bsts[0]?.client_nom) || '—', pieces: [], montant: 0, date_cmd: '', date_liv: '', statut: '—', has_st: (bsts.length > 0), retard: false }
  const ops = normOps(bdts, bsts)

  // Regroupe les opérations par lot (lots réels + lots synthétiques pour les réf. orphelines)
  const groups = new Map<string, any>()
  lots.forEach(l => groups.set(String(l.id), { key: String(l.id), lot: l, ops: [] as any[] }))
  ops.forEach(op => {
    let key = op.lotKey ? String(op.lotKey) : ''
    if (!key) key = '__piece_' + (op.piece || '—')
    if (!groups.has(key)) {
      groups.set(key, { key, lot: { id: op.lotKey || '(hors lot)', client_nom: op.client, piece: op.piece, statut: '—', synthetic: true }, ops: [] })
    }
    groups.get(key).ops.push(op)
  })
  const groupArr = Array.from(groups.values()).filter(g => g.ops.length > 0 || !(g.lot as any).synthetic)

  const totalOps = ops.length
  const soldes = ops.filter(o => isSolde(o.statut)).length
  const av = totalOps > 0 ? Math.round(soldes / totalOps * 100) : 0
  const nbBdt = bdts.length, nbBds = bsts.length

  const lotCards = groupArr.map(g => {
    const L: any = g.lot
    const lotRef = L.synthetic
      ? `<span style="font-weight:800;color:#1e293b;">${L.id}</span><span style="margin-left:8px;font-size:.6rem;font-weight:700;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:1px 6px;">réf. seule</span>`
      : `<a href="/production/lot/${encodeURIComponent(L.id)}" style="font-weight:800;color:#3b82f6;text-decoration:none;">${L.id}</a>`
    const rows = opRowsHtml(g.ops)
    return `
    <div class="card" style="overflow:hidden;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 16px;background:#f8fafc;border-bottom:1px solid #eef2f7;">
        <div style="display:flex;align-items:center;gap:8px;"><i class="fas fa-layer-group" style="color:#6366f1;"></i>${lotRef}</div>
        <div style="font-size:.78rem;color:#475569;">${escX(L.piece || '—')}</div>
        ${L.qte != null ? `<div style="font-size:.72rem;color:#94a3b8;">Qté ${L.qte}</div>` : ''}
        ${!L.synthetic ? STATUT_BADGE(L.statut) : ''}
        <div style="margin-left:auto;font-size:.7rem;font-weight:700;color:#64748b;">${g.ops.length} opération${g.ops.length !== 1 ? 's' : ''}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#fff;">${TH('Ordre')}${TH('Type')}${TH('Opération')}${TH('Pièce')}${TH('N° Bon')}${TH('Statut')}</tr></thead>
        <tbody>${rows || `<tr><td colspan="6" style="text-align:center;padding:24px;color:#94a3b8;">Aucune opération pour ce lot.</td></tr>`}</tbody>
      </table>
    </div>`
  }).join('')

  const content = `
<div style="padding:24px;margin:0 auto;">
  <a href="/production/service?tab=commandes" style="display:inline-flex;align-items:center;gap:6px;color:#64748b;font-size:.78rem;text-decoration:none;margin-bottom:14px;"><i class="fas fa-arrow-left"></i> Retour aux commandes</a>
  <div class="card" style="padding:18px 20px;margin-bottom:16px;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;">
          <h1 style="font-size:1.45rem;font-weight:900;color:#1e293b;margin:0;">${escX(C.num_affaire || C.id)}</h1>
          ${C.retard ? '<span style="border-radius:999px;padding:2px 9px;font-size:.62rem;font-weight:700;background:#fef2f2;color:#b91c1c;">Retard</span>' : STATUT_BADGE(C.statut || '—')}
          ${C.has_st ? '<span style="background:#e0e7ff;color:#3730a3;border-radius:999px;padding:2px 8px;font-size:.62rem;font-weight:700;">Sous-traitance</span>' : ''}
        </div>
        <div style="font-size:.85rem;color:#475569;margin-top:4px;"><i class="fas fa-building" style="color:#94a3b8;margin-right:6px;"></i>${escX(C.client_nom || '—')}${C.date_liv ? ` · Livraison ${C.date_liv}` : ''}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:.64rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;">Montant</div>
        <div style="font-size:1.25rem;font-weight:900;color:#1e293b;">${(C.montant || 0).toLocaleString('fr-FR')} €</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
      ${KPI_CARD('Lots', String(groupArr.length), '#6366f1')}
      ${KPI_CARD('BDT (usine)', String(nbBdt), '#3b82f6')}
      ${KPI_CARD('BDS (sous-trait.)', String(nbBds), '#6d28d9')}
      ${KPI_CARD('Avancement', av + '%', av === 100 ? '#22c55e' : av > 50 ? '#3b82f6' : '#f59e0b')}
    </div>
  </div>
  <h2 style="font-size:.95rem;font-weight:800;color:#1e293b;margin:0 0 10px;">Lots & opérations <span style="font-weight:600;color:#94a3b8;font-size:.78rem;">(dans l'ordre des opérations)</span></h2>
  ${lotCards || `<div class="card" style="padding:40px;text-align:center;color:#94a3b8;">Aucun lot ni opération rattaché à cette commande.</div>`}
</div>`
  return layout('Commande ' + (C.num_affaire || C.id), content, 'prod-commandes')
}

// ══════════════════════════════════════════════════════════════
// PAGE 4ter : DÉTAIL LOT — liste des BDT/BDS = étapes de production
// ══════════════════════════════════════════════════════════════
export const pageLotDetail = (
  routeId: string,
  lot: Lot | undefined,
  cmd: Commande | undefined,
  bdts: any[],
  bsts: any[],
  detail?: any,
  nom?: any,
  planRef?: string
) => {
  const L: any = lot ?? { id: routeId, client_nom: (bdts[0]?.client_nom) || (bsts[0]?.client_nom) || '—', piece: (bdts[0]?.piece) || (bsts[0]?.piece) || '—', statut: '—', synthetic: true }
  const ops = normOps(bdts, bsts)
  const totalOps = ops.length
  const soldes = ops.filter(o => isSolde(o.statut)).length
  const av = totalOps > 0 ? Math.round(soldes / totalOps * 100) : 0
  const cmdId = (cmd?.id) || L.cmd_id || ''
  const cmdLabel = (cmd?.num_affaire) || cmdId
  const rows = opRowsHtml(ops)

  // ─── Lot 360 : cascade qualité + coût engagé ───
  const _LD = detail && detail.kpi ? detail : null
  const eur0 = (v: any) => (Number(v) || 0).toLocaleString('fr-FR') + ' €'
  const lkpi = (lbl: string, val: string, col: string, sub = '') => `<div style="background:#f8fafc;border-radius:10px;padding:11px 13px;border-top:3px solid ${col};"><div style="font-size:1.05rem;font-weight:800;color:${col};line-height:1.15;">${val}</div><div style="font-size:.63rem;color:#6b7280;font-weight:700;margin-top:2px;">${lbl}</div>${sub ? `<div style="font-size:.59rem;color:#9ca3af;">${sub}</div>` : ''}</div>`
  const ltbl = (title: string, icon: string, heads: any[], trows: string) => `<div style="margin-top:12px;"><div style="font-weight:700;font-size:.8rem;color:#374151;margin-bottom:5px;"><i class="fas ${icon}" style="margin-right:6px;color:#7c3aed;"></i>${title}</div><div style="border:1px solid #f1f5f9;border-radius:10px;overflow:hidden;max-height:200px;overflow-y:auto;"><table style="width:100%;border-collapse:collapse;font-size:.74rem;"><thead><tr style="background:#faf5ff;">${heads.map((h: any) => `<th style="text-align:${h.a || 'left'};padding:6px 9px;font-size:.6rem;text-transform:uppercase;color:#6b21a8;">${h.t}</th>`).join('')}</tr></thead><tbody>${trows || `<tr><td colspan="${heads.length}" style="text-align:center;padding:14px;color:#cbd5e1;">Aucun</td></tr>`}</tbody></table></div></div>`
  const pvRows = _LD ? _LD.pvs.map((p: any) => `<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:6px 9px;font-family:monospace;font-size:.7rem;">${escX(p.num)}</td><td style="padding:6px 9px;">${escX(p.type || '')}</td><td style="padding:6px 9px;text-align:center;">${escX(p.decision || p.statut || '')}</td><td style="padding:6px 9px;text-align:center;">${p.cpk != null ? p.cpk : '—'}</td><td style="padding:6px 9px;text-align:center;font-size:.66rem;">${escX(p.date || '')}</td></tr>`).join('') : ''
  const ncRows = _LD ? _LD.ncs.map((n: any) => `<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:6px 9px;font-family:monospace;font-size:.7rem;">${escX(n.id)}</td><td style="padding:6px 9px;">${escX(n.gravite || '')}</td><td style="padding:6px 9px;">${escX(n.statut || '')}</td><td style="padding:6px 9px;font-size:.66rem;">${escX(n.date || '')}</td></tr>`).join('') : ''
  const qRows = _LD ? _LD.quarantaines.map((q: any) => `<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:6px 9px;font-family:monospace;font-size:.7rem;">${escX(q.id)}</td><td style="padding:6px 9px;">${escX(q.statut || '')}</td><td style="padding:6px 9px;font-size:.7rem;">${escX(q.motif || '')}</td><td style="padding:6px 9px;font-size:.66rem;">${escX(q.date || '')}</td></tr>`).join('') : ''
  const lot360 = _LD ? `<div class="card" style="padding:18px 20px;margin-top:16px;">
    <div style="font-weight:800;color:#1e293b;font-size:.95rem;margin-bottom:12px;"><i class="fas fa-clipboard-check" style="color:#7c3aed;margin-right:7px;"></i>Pilotage qualité &amp; coût 360</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:10px;">
      ${lkpi('Coût engagé', eur0(_LD.kpi.coutEngage), '#7c3aed', 'matière+MO+machine')}
      ${lkpi('Matière', eur0(_LD.kpi.coutMat), '#d97706')}
      ${lkpi('MO', eur0(_LD.kpi.coutMO), '#6366f1', _LD.kpi.moH + ' h')}
      ${lkpi('Machine', eur0(_LD.kpi.coutMach), '#0d9488', _LD.kpi.machH + ' h')}
      ${lkpi('NC', String(_LD.kpi.nbNC), _LD.kpi.ncBloq ? '#dc2626' : '#94a3b8', _LD.kpi.ncBloq + ' bloquante(s)')}
      ${lkpi('Quarantaine', String(_LD.kpi.enQuar), _LD.kpi.enQuar ? '#dc2626' : '#22c55e', _LD.kpi.nbPV + ' PV · ' + _LD.kpi.nb8d + ' 8D')}
    </div>
    ${(_LD.kpi.ncBloq > 0 || _LD.kpi.enQuar > 0) ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;font-size:.74rem;color:#b91c1c;margin-top:12px;"><i class="fas fa-triangle-exclamation" style="margin-right:5px;"></i>Lot à risque : ${eur0(_LD.kpi.coutEngage)} déjà engagés, lot bloqué (NC/quarantaine) — coût caché en cas de rebut.</div>` : ''}
    ${ltbl('Contrôles (PV)', 'fa-vial', [{ t: 'PV' }, { t: 'Type' }, { t: 'Décision', a: 'center' }, { t: 'Cpk', a: 'center' }, { t: 'Date', a: 'center' }], pvRows)}
    ${ltbl('Non-conformités', 'fa-circle-exclamation', [{ t: 'NC' }, { t: 'Gravité' }, { t: 'Statut' }, { t: 'Date' }], ncRows)}
    ${_LD.quarantaines.length ? ltbl('Quarantaines', 'fa-box-archive', [{ t: 'ID' }, { t: 'Statut' }, { t: 'Motif' }, { t: 'Date' }], qRows) : ''}
  </div>` : ''

  const content = `
<div style="padding:24px;margin:0 auto;">
  <a href="/production/service?tab=commandes" style="display:inline-flex;align-items:center;gap:6px;color:#64748b;font-size:.78rem;text-decoration:none;margin-bottom:14px;"><i class="fas fa-arrow-left"></i> Retour aux commandes</a>
  <div class="card" style="padding:18px 20px;margin-bottom:16px;">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;">
          <i class="fas fa-layer-group" style="color:#6366f1;font-size:1.1rem;"></i>
          <h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">${L.id}</h1>
          ${!L.synthetic ? STATUT_BADGE(L.statut || '—') : ''}
        </div>
        <div style="font-size:.85rem;color:#475569;margin-top:4px;">${escX(L.piece || '—')} · ${escX(L.client_nom || '—')}${L.qte != null ? ` · Qté ${L.qte}` : ''}</div>
        <div style="font-size:.75rem;color:#64748b;margin-top:3px;display:flex;gap:12px;flex-wrap:wrap;">${((cmd?.num_affaire) || L.affaire_id) ? `<span>Affaire <b style="color:#334155;">${escX((cmd?.num_affaire) || L.affaire_id)}</b></span>` : ''}<span>Lot <b style="color:#334155;">${escX(L.id)}</b></span>${planRef ? `<span>Plan <b style="color:#334155;">${escX(planRef)}</b></span>` : ''}${(nom && nom.indice) ? `<span>Indice <b style="color:#334155;">${escX(nom.indice)}</b></span>` : ''}</div>
        ${cmdId ? `<div style="font-size:.78rem;margin-top:6px;"><i class="fas fa-file-invoice" style="color:#94a3b8;margin-right:6px;"></i>Commande <a href="/production/commande/${encodeURIComponent(cmdId)}" style="color:#3b82f6;text-decoration:none;font-weight:700;">${escX(cmdLabel)}</a></div>` : ''}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <button onclick="ofPdf()" title="Imprimer l'ordre de fabrication (fiche suiveuse)" style="display:inline-flex;align-items:center;gap:7px;padding:10px 15px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:10px;font-weight:700;font-size:.8rem;cursor:pointer;align-self:stretch;"><i class="fas fa-print"></i>Imprimer l'OF</button>
        ${KPI_CARD('Étapes', String(totalOps), '#6366f1')}
        ${KPI_CARD('Avancement', av + '%', av === 100 ? '#22c55e' : av > 50 ? '#3b82f6' : '#f59e0b')}
      </div>
    </div>
    <div style="margin-top:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">
        <span style="font-size:.72rem;font-weight:700;color:#64748b;">Avancement du lot</span>
        <span style="font-size:.72rem;font-weight:800;color:${av === 100 ? '#22c55e' : av > 50 ? '#3b82f6' : '#f59e0b'};">${soldes}/${totalOps} étapes soldées · ${av}%</span>
      </div>
      <div style="height:10px;background:#eef2f7;border-radius:6px;overflow:hidden;"><div style="height:100%;width:${av}%;background:${av === 100 ? '#22c55e' : av > 50 ? '#3b82f6' : '#f59e0b'};border-radius:6px;transition:width .5s;"></div></div>
    </div>
  </div>
  <h2 style="font-size:.95rem;font-weight:800;color:#1e293b;margin:0 0 10px;">Étapes de production <span style="font-weight:600;color:#94a3b8;font-size:.78rem;">(BDT usine & BDS sous-traitance, dans l'ordre)</span></h2>
  <div class="card" style="overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#f8fafc;">${TH('Ordre')}${TH('Type')}${TH('Opération')}${TH('Pièce')}${TH('N° Bon')}${TH('Statut')}</tr></thead>
      <tbody>${rows || `<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Aucune étape de production pour ce lot.</td></tr>`}</tbody>
    </table>
  </div>
  ${lot360}
</div>`
  // ─── Ordre de Fabrication (fiche suiveuse) imprimable — gamme = nomenclature.etapes_production ───
  const _qte = Number(L.qte) || 1
  const _bdtById: Record<string, any> = {}; bdts.forEach((b: any) => { _bdtById[String(b.id)] = b })
  const _etapes: any[] = (nom && Array.isArray(nom.etapes_production)) ? nom.etapes_production : []
  let ofOps: any[]
  if (_etapes.length) {
    // 2 formes de gamme : éditée (temps_*_min, minutes ÷60=h, MO ET machine possibles par étape)
    // ou importée (temps_reglage/variable_mille, ÷1000=h, une ressource/étape). Réglage = FIXE/lot ; MO+machine = PAR PIÈCE.
    ofOps = _etapes.slice().sort((a: any, b: any) => (Number(a.ordre) || 0) - (Number(b.ordre) || 0)).map((e: any, i: number) => {
      const hasMin = (e.temps_mo_min != null || e.temps_machine_min != null || e.temps_reglage_min != null)
      let reg: number, moU: number, machU: number
      if (hasMin) {
        reg = ((Number(e.temps_reglage_min) || 0) + (Number(e.temps_reglage_machine_min) || 0)) / 60   // ROP + RGM
        moU = (Number(e.temps_mo_min) || 0) / 60
        machU = (Number(e.temps_machine_min) || 0) / 60
      } else {
        reg = ((e.temps_reglage_op_mille != null || e.temps_reglage_machine_mille != null)
          ? ((Number(e.temps_reglage_op_mille) || 0) + (Number(e.temps_reglage_machine_mille) || 0))
          : (Number(e.temps_reglage_mille) || 0)) / 1000
        const uni = (Number(e.temps_variable_mille) || 0) / 1000
        const isMach = String(e.ressource || '').toLowerCase() === 'machine'
        moU = isMach ? 0 : uni; machU = isMach ? uni : 0
      }
      return { seq: e.ordre != null ? e.ordre : (i + 1), phase: e.phase || '', operation: e.nom || e.operation || '', poste: e.machine_nom || e.process_nom || '', res: '', prog: e.programme || e.num_programme || '', progFic: e.programme_fichier || '', reg, moU, machU, total: reg + (moU + machU) * _qte }
    })
  } else {
    // Repli : pas de gamme trouvée → étapes depuis les BDT (temps alloué seul)
    ofOps = ops.slice().sort(seqSort).map((op: any, i: number) => {
      const b = _bdtById[String(op.id)] || {}
      const t = b.temps_alloue != null ? b.temps_alloue : (b.duree != null ? b.duree : 0)
      const isBds = op.kind === 'BDS'
      return { seq: op.seq != null ? op.seq : (i + 1), phase: '', operation: op.operation, poste: isBds ? ('S/T' + (op.st ? ' — ' + op.st : '')) : (b.machine_id || ''), res: isBds ? 'S/T' : 'Machine', prog: '', progFic: '', reg: 0, moU: 0, machU: Number(t) || 0, total: Number(t) || 0 }
    })
  }
  const _tot = ofOps.reduce((a: any, o: any) => ({ reg: a.reg + o.reg, mo: a.mo + o.moU * _qte, mach: a.mach + o.machU * _qte, total: a.total + o.total }), { reg: 0, mo: 0, mach: 0, total: 0 })
  const ofData = { numLot: L.id, affaire: (cmd?.num_affaire) || L.affaire_id || cmdLabel || '', plan: (nom && nom.num_plan) || planRef || '', planFichier: (nom && nom.plan_fichier) || '', indice: (nom && nom.indice) || '', client: L.client_nom, piece: L.piece || (nom && nom.code_ref_produit) || '', qte: _qte, statut: L.synthetic ? '' : (L.statut || ''), dateDebut: L.date_debut, dateFin: L.date_fin, hasGamme: _etapes.length > 0, ops: ofOps, tot: _tot }
  const ofScript = `<script>
window.OF_DATA=${sjX(ofData)};
var BRAND_LOGO=${sjX(LOGO_SVG)}; var BRAND_VIOLET=${sjX(BRAND.violet)}; var BRAND_BLEU=${sjX(BRAND.bleu)};
function ofPdf(){
  var o=window.OF_DATA||{};
  function e(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function hm(h){ h=Number(h)||0; if(h<=0) return '—'; var m=Math.round(h*60); var H=Math.floor(m/60); var M=m%60; return H+'h'+(M<10?'0':'')+M; }
  var rows=(o.ops||[]).map(function(op){return '<tr>'
    +'<td class="c b">'+e(op.seq)+'</td>'
    +'<td class="c s">'+e(op.phase||'')+'</td>'
    +'<td>'+e(op.operation||'')+'</td>'
    +'<td>'+e(op.poste||'')+'</td>'
    +'<td class="c mono">'+e(op.prog||'')+(op.progFic?'<div class="s" style="text-align:center;">'+e(op.progFic)+'</div>':'')+'</td>'
    +'<td class="c">'+hm(op.reg)+'</td>'
    +'<td class="c">'+hm(op.moU)+'</td>'
    +'<td class="c">'+hm(op.machU)+'</td>'
    +'<td class="c b">'+hm(op.total)+'</td>'
    +'<td></td>'
    +'</tr>';}).join('');
  var t=o.tot||{reg:0,mo:0,mach:0,total:0};
  var totRow='<tr class="tot"><td colspan="5" class="r b">TOTAUX (qté '+e(o.qte)+')</td><td class="c b">'+hm(t.reg)+'</td><td class="c b">'+hm(t.mo)+'</td><td class="c b">'+hm(t.mach)+'</td><td class="c b">'+hm(t.total)+'</td><td></td></tr>';
  var html='<html><head><meta charset="utf-8"><title>OF '+e(o.numLot)+'</title><style>'
    +'@page{size:A4 landscape;margin:11mm;} body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:10.5px;}'
    +'.hd{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid '+BRAND_VIOLET+';padding-bottom:8px;margin-bottom:10px;}'
    +'.hd h1{font-size:18px;margin:0;color:'+BRAND_BLEU+';letter-spacing:.5px;} .hd .sub{font-size:10px;color:#666;margin-top:2px;} .hd .meta{text-align:right;font-size:10.5px;color:#555;} .hd .lg{width:70px;flex:0 0 70px;margin-right:12px;} .hd .lft{display:flex;align-items:center;}'
    +'*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
    +'.info{display:grid;grid-template-columns:repeat(4,1fr);gap:4px 16px;margin-bottom:10px;font-size:10.5px;}'
    +'.info span{color:#666;} .info b{color:#111;}'
    +'table{width:100%;border-collapse:collapse;} th,td{border:1px solid #bbb;padding:3px 5px;vertical-align:top;height:18px;}'
    +'th{background:#eef1f8;color:'+BRAND_BLEU+';font-size:8px;text-transform:uppercase;} td.c{text-align:center;} td.r{text-align:right;} td.b{font-weight:bold;} td.s{font-size:8.5px;color:#777;} td.mono{font-family:monospace;font-size:8.5px;color:#555;} tr.tot td{background:#f1f5ff;}'
    +'.leg{font-size:8.5px;color:#888;margin-top:5px;}'
    +'.sign{display:flex;justify-content:space-between;margin-top:22px;font-size:10px;color:#555;} .sign div{border-top:1px solid #999;width:30%;padding-top:4px;text-align:center;}'
    +'</style></head><body>'
    +'<div class="hd"><div class="lft"><div class="lg">'+BRAND_LOGO+'</div><div><h1>ORDRE DE FABRICATION</h1><div class="sub">Fiche suiveuse — Seem Semrac'+(o.hasGamme?'':' · gamme absente, temps depuis BDT')+'</div></div></div>'
    +'<div class="meta">Lot <b>'+e(o.numLot)+'</b><br>Affaire '+e(o.affaire||'—')+'<br>Édité le '+new Date().toLocaleDateString('fr-FR')+'</div></div>'
    +'<div class="info">'
    +'<div><span>N° Affaire :</span> <b>'+e(o.affaire||'—')+'</b></div>'
    +'<div><span>N° Lot :</span> <b>'+e(o.numLot||'—')+'</b></div>'
    +'<div><span>N° Plan :</span> <b>'+e(o.plan||'—')+'</b>'+(o.planFichier?' <span style="color:#888;">('+e(o.planFichier)+')</span>':'')+'</div>'
    +'<div><span>Indice :</span> <b>'+e(o.indice||'—')+'</b></div>'
    +'<div><span>Client :</span> <b>'+e(o.client||'—')+'</b></div>'
    +'<div><span>Pièce / réf :</span> <b>'+e(o.piece||'—')+'</b></div>'
    +'<div><span>Quantité :</span> <b>'+e(o.qte!=null?o.qte:'—')+'</b></div>'
    +'<div><span>Début / Fin :</span> <b>'+e(o.dateDebut||'—')+' → '+e(o.dateFin||'—')+'</b></div>'
    +'</div>'
    +'<table><thead><tr><th>N°</th><th>Phase</th><th>Opération</th><th>Poste / Machine</th><th>N° Programme</th><th>Réglage</th><th>Tps MO (u)</th><th>Tps Machine (u)</th><th>Total (×qté)</th><th>Visa</th></tr></thead>'
    +'<tbody>'+(rows||'<tr><td colspan="10" style="text-align:center;color:#999;padding:14px;">Aucune opération / gamme sur ce lot</td></tr>')+totRow+'</tbody></table>'
    +'<div class="leg">Temps en heures:minutes. Réglage = temps fixe par lot. Tps MO / Machine = temps <b>unitaire</b> (par pièce) ; Total = réglage + unitaire × quantité. N° Programme et Visa à compléter par l\\u0027opérateur.</div>'
    +'<div class="sign"><div>Préparateur</div><div>Opérateur(s)</div><div>Contrôle qualité</div></div>'
    +'</body></html>';
  var w=window.open('','_blank'); if(!w){ if(window.pushNotif)pushNotif('err','fa-ban','Autorisez les pop-ups pour imprimer.'); else alert('Autorisez les pop-ups pour imprimer.'); return; }
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(function(){ w.focus(); w.print(); }, 350);
}
try{ if(location && /[?&]print=1(&|$)/.test(location.search)) setTimeout(ofPdf, 500); }catch(_e){}
</script>`
  return layout('Lot ' + L.id, content + ofScript, 'prod-lots')
}

// ══════════════════════════════════════════════════════════════
// PAGE 5 : DASHBOARD PROGRAMMATION
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// PAGE UNIFIÉE : SERVICE PRODUCTION (6 onglets)
// ══════════════════════════════════════════════════════════════
export const pageServiceProd = (
  dbBDTs?:       BonDeTravail[],
  dbMachines?:   Machine[],
  dbOps?:        Operateur[],
  dbLots?:       Lot[],
  dbCmds?:       Commande[],
  dbFournisseurs?: any[],
  dbProcess?:    any[],
  dbBDS?:        any[],
  dbBCst?:       Record<string, any>,
  dbStock?:      any[],
  dbPresences?:  any[],
  dbAbsences?:   any[],
  dbMouvements?: any[],
  dbAffectations?: Record<string, any>,
  dbCongesOps?:  any[],
  dbPostes?:     any[],
  dbMachinesOpex?: any[],
  dbBdtsVigilance?: { id: string; piece: string; operation: string; lot_ref: string; num_affaire: string; cmd_ref: string; raison: string }[],
) => {
  const TODAY = new Date().toISOString().slice(0,10)
  const POSTES: any[] = (dbPostes ?? []).map((p:any) => ({ id:p.id, nom:p.nom, code:p.code||'', activite:p.activite||'', couleur:p.couleur||'#6366f1', ordre:p.ordre??100, statut:p.statut||'actif', taux_horaire_manuel:(p.taux_horaire_manuel ?? null) }))
  const CONGES_OPS: any[] = dbCongesOps ?? []
  const BDS_ROWS: any[] = (dbBDS && dbBDS.length > 0) ? dbBDS : []
  const BC_ST_BY_ID: Record<string, any> = dbBCst || {}
  const STOCK_ARTS: any[] = (dbStock ?? []).map((s:any) => ({ id:s.id, reference:s.reference, designation:s.designation, stock_actuel:s.stock_actuel, unite:s.unite, categorie:s.categorie }))
  const PRESENCES_DB: any[] = dbPresences ?? []
  const ABSENCES_RH: any[] = dbAbsences ?? []

  // ─── Parc machines réel + OPEX consommables temps réel ───────
  // Machines réelles (sinon démo) pour la gestion (modifier / supprimer) et l'OPEX.
  const MACH_REAL: any[] = (dbMachines && dbMachines.length > 0) ? (dbMachines as any[]) : (MACHINES as any[])
  // Prix d'achat HT par article (référencé par id et par référence)
  const stockPrice: Record<string, number> = {}
  for (const s of (dbStock ?? []) as any[]) {
    const p = Number(s.prix_achat_ht) || 0
    if (s.id != null) stockPrice[String(s.id)] = p
    if (s.reference) stockPrice[String(s.reference)] = p
  }
  // OPEX machine = somme des sorties stock « consommable » rattachées à la machine (qté × prix d'achat HT)
  const MOUV_ALL: any[] = dbMouvements ?? []
  const machOpex: Record<string, { total: number; nb: number; postes: Record<string, { qte: number; cout: number }> }> = {}
  for (const mv of MOUV_ALL) {
    if (String(mv.categorie || '') !== 'consommable' || !mv.machine_id) continue
    const pu = stockPrice[String(mv.article_id)] ?? stockPrice[String(mv.stock_id)] ?? 0
    const qte = Math.abs(Number(mv.quantite) || 0)
    const cout = qte * pu
    const k = String(mv.machine_id)
    const e = (machOpex[k] = machOpex[k] || { total: 0, nb: 0, postes: {} })
    e.total += cout; e.nb += 1
    const art = mv.article_nom || mv.article_id || 'Consommable'
    const pst = (e.postes[art] = e.postes[art] || { qte: 0, cout: 0 })
    pst.qte += qte; pst.cout += cout
  }
  const opexTotalReel = Object.values(machOpex).reduce((s, m) => s + m.total, 0)
  // ─── OPEX PAR POSTE = somme des machines du poste (réel conso + théorique cout_h×capacité×220) + conso tirées au poste (postes manuels) ───
  // C'est LE calcul régularisé : agrégation du même machOpex, réutilisé à l'identique en maintenance (fiche 360 / TCO par poste).
  const posteOpex: Record<string, { reel: number; theorique: number; machines: string[] }> = {}
  const _posteInit = (pid: string) => (posteOpex[pid] = posteOpex[pid] || { reel: 0, theorique: 0, machines: [] })
  for (const m of MACH_REAL) {
    const pid = m.poste_id ? String(m.poste_id) : ''
    if (!pid) continue
    const e = _posteInit(pid)
    e.machines.push(String(m.id))
    e.reel += (machOpex[String(m.id)]?.total || 0)
    e.theorique += (Number(m.cout_h) || 0) * (Number(m.capacite_h) || 0) * 220
  }
  for (const mv of MOUV_ALL) {   // consommables rattachés directement à un poste (postes manuels, sans machine)
    if (String(mv.categorie || '') !== 'consommable' || !mv.poste_id) continue
    const pu = stockPrice[String(mv.article_id)] ?? stockPrice[String(mv.stock_id)] ?? 0
    _posteInit(String(mv.poste_id)).reel += Math.abs(Number(mv.quantite) || 0) * pu
  }
  // Phase E — taux horaire EFFECTIF par poste : base (moyenne pondérée cout_h) + incrément OPEX achats machine
  //   reçus (année civile) / heures budgétées, ou override manuel (postes.taux_horaire_manuel). Même moteur que le CRU.
  const POSTE_RATES = computePosteRates(MACH_REAL, (dbMachinesOpex ?? []) as any[], POSTES, Number(TODAY.slice(0, 4)))
  // Comptage + LISTES machines / process par poste (pour l'admin postes + la vue imbriquée)
  const PROC_ALL: any[] = (dbProcess ?? [])
  const machCountByPoste: Record<string, number> = {}
  const procCountByPoste: Record<string, number> = {}
  const machListByPoste: Record<string, any[]> = {}
  const procListByPoste: Record<string, any[]> = {}
  for (const m of MACH_REAL) if (m.poste_id) { const k = String(m.poste_id); machCountByPoste[k] = (machCountByPoste[k] || 0) + 1; (machListByPoste[k] = machListByPoste[k] || []).push(m) }
  for (const p of PROC_ALL) if (p.poste_id) { const k = String(p.poste_id); procCountByPoste[k] = (procCountByPoste[k] || 0) + 1; (procListByPoste[k] = procListByPoste[k] || []).push(p) }
  const procType = (p: any) => p.est_oas ? 'OAS' : (p.requiert_machine ? 'Machine' : 'Manuel')
  const fmtEur = (v: number) => {
    const parts = (Math.round((Number(v) || 0) * 100) / 100).toFixed(2).split('.')
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + parts[1] + ' €'
  }

  // ─── Gantt BDT data ──────────────────────────────────────
  // Les lignes du planning sont désormais les PROCESS atelier (machine ou manuel),
  // séparés Seem / Semrac. Les BDT sont colorés par statut.
  const procForGantt = (dbProcess && dbProcess.length > 0)
    ? dbProcess.map((p:any) => ({id:p.id,nom:p.nom,activite:p.activite||'Seem',requiert_machine:!!p.requiert_machine,est_oas:!!p.est_oas,machine_id:p.machine_id||null,poste_id:p.poste_id||null,categorie:p.categorie||'',couleur:p.couleur||'#64748b',operations:Array.isArray(p.operations)?p.operations:[]}))
    : []
  const opsForGantt = (dbOps && dbOps.length > 0)
    ? dbOps.map(o => ({id:o.id,nom:o.nom,activite:o.activite,poste:o.poste||'',shift:deriveShift(o.shift_id),competences:o.competences||[]}))
    : OPS_DEFAULT
  const bdtsForGantt = (dbBDTs && dbBDTs.length > 0)
    ? dbBDTs.map(b => ({id:b.id,op:b.operateur_id||'',process:(b as any).process_id||'pending',client:b.client_nom||'',piece:b.piece,operation:b.operation,duree:b.duree,debut:b.debut!=null?Number(b.debut):6,priorite:b.priorite,statut:b.statut,resultat:(b as any).resultat||null,activite:b.activite||'Seem',machineId:b.machine_id||null,tempsAlloue:(b as any).temps_alloue||b.duree,debutReel:(b as any).debut_reel||null,finReel:(b as any).fin_reel||null,lotId:(b as any).lot_id||(b as any).lot_ref||null,numAffaire:(b as any).num_affaire||null,dateEcheance:(b as any).date_echeance||null,seq:(b as any).seq!=null?(b as any).seq:null,cmdId:(b as any).cmd_id||null,datePrevue:(b as any).date_prevue||null,oxydation:(b as any).oxydation||null}))
    : BDT_DEFAULT
  const PROCESS_J = JSON.stringify(procForGantt)
  const OPS_J  = JSON.stringify(opsForGantt)
  const SHIFTS_J = JSON.stringify(SHIFTS)
  const ABS_J  = JSON.stringify(ABSENCES)
  const OPS_SE = JSON.stringify(OPS_SEEM_LIST)
  const OPS_SM = JSON.stringify(OPS_SEMRAC_LIST)
  const OPS_ST_J = JSON.stringify(OPS_ST_LIST)
  // Machines réelles (pour rattacher un process à une machine dans l'onglet Process Ateliers)
  const machinesForProc = (dbMachines && dbMachines.length > 0)
    ? dbMachines.map((m:any) => ({id:m.id,nom:m.nom,code:m.code,activite:m.activite,cout_h:(m.cout_h ?? m.taux_horaire ?? 35)}))
    : []
  const MACHINES_PROC_J = JSON.stringify(machinesForProc)
  // ─── Référentiel Process Ateliers (onglet de gestion) ────
  const PROC_LIST: any[] = dbProcess ?? []
  const machNameById: Record<string,string> = {}
  ;(dbMachines ?? []).forEach((m:any)=>{ machNameById[m.id]=m.nom })
  const procMgmtRows = PROC_LIST.map((p:any)=>{
    const isOas = !!p.est_oas
    const isMach = !isOas && !!p.requiert_machine
    const actColor = p.activite==='Semrac' ? '#be185d' : p.activite==='both' ? '#5b21b6' : '#1d4ed8'
    const actBg    = p.activite==='Semrac' ? '#fce7f3' : p.activite==='both' ? '#f3e8ff' : '#dbeafe'
    const typeBadge = isOas
      ? '<span style="background:#cffafe;color:#0e7490;border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:700;"><i class="fas fa-flask" style="margin-right:4px;"></i>OAS</span>'
      : isMach
      ? '<span style="background:#e0f2fe;color:#0369a1;border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:700;"><i class="fas fa-cog" style="margin-right:4px;"></i>Machine</span>'
      : '<span style="background:#f1f5f9;color:#475569;border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:700;"><i class="fas fa-hand-paper" style="margin-right:4px;"></i>Manuel</span>'
    const machTxt = isMach ? (machNameById[p.machine_id] != null ? escX(machNameById[p.machine_id]) : '<span style="color:#ef4444;">— à rattacher —</span>') : '<span style="color:#cbd5e1;">n/a</span>'
    const statBg = p.statut==='actif' ? 'background:#dcfce7;color:#16a34a;' : 'background:#f1f5f9;color:#64748b;'
    return `<tr data-type="${isOas?'oas':isMach?'machine':'manuel'}" data-act="${p.activite}" data-pid="${p.id}" draggable="true" ondragstart="rowDragStart(event,'${p.id}','proc')" ondragover="rowDragOver(event)" ondrop="rowDrop(event,'${p.id}','proc')" ondragend="rowDragEnd(event)" style="border-bottom:1px solid #f9fafb;cursor:move;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
      <td style="padding:9px 14px;font-weight:700;color:#1e293b;"><i class="fas fa-grip-vertical" style="color:#cbd5e1;margin-right:7px;cursor:grab;" title="Glisser pour réordonner"></i>${escX(p.nom)}</td>
      <td style="padding:9px 14px;font-family:monospace;font-size:.72rem;color:#6b7280;">${escX(p.code ?? '—')}</td>
      <td style="padding:9px 14px;"><span style="background:${actBg};color:${actColor};border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:700;">${p.activite}</span></td>
      <td style="padding:9px 14px;">${typeBadge}</td>
      <td style="padding:9px 14px;font-size:.78rem;color:#374151;">${machTxt}</td>
      <td style="padding:9px 14px;font-size:.78rem;color:#6b7280;">${escX(p.categorie ?? '—')}</td>
      <td style="padding:9px 14px;text-align:center;"><span style="border-radius:999px;padding:3px 10px;font-size:.66rem;font-weight:700;${statBg}">${p.statut ?? 'actif'}</span></td>
      <td style="padding:9px 14px;text-align:center;white-space:nowrap;">
        <button onclick="toggleProcMachine('${p.id}',${isMach?'false':'true'})" title="Basculer machine / manuel" style="background:#eff6ff;color:#2563eb;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.7rem;font-weight:700;margin-right:4px;"><i class="fas fa-exchange-alt"></i></button>
        <button onclick="openProcEdit('${p.id}')" title="Modifier le nom / la machine rattachée" style="background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.7rem;font-weight:700;margin-right:4px;"><i class="fas fa-pen"></i></button>
        <button onclick="deleteProc('${p.id}','${(p.nom||'').replace(/'/g,'')}')" title="Supprimer" style="background:#fef2f2;color:#dc2626;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.7rem;font-weight:700;"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`
  }).join('')

  // ─── BST data (planning jour-par-jour) ───────────────────
  const LOTS_BST  = dbLots ?? LOTS_DEFAULT
  const FOURN     = dbFournisseurs ?? FOURN_DEFAULT

  // Sous-traitants (table sous_traitants) enrichis : prestations / process qu'ils savent faire.
  const fournForBst = FOURN.map((f:any) => {
    const ops = Array.isArray(f.prestations) ? f.prestations
      : (Array.isArray(f.operations) ? f.operations : (f.operation ? [f.operation] : []))
    return {
      id: f.id,
      nom: f.nom,
      operation: ops[0] || f.operation || '',
      operations: ops,
      localisation: f.localisation || f.adresse || '',
      qualification: f.qualification || (Array.isArray(f.certifications) ? f.certifications.join(', ') : '') || '',
      statut: f.actif === false ? 'suspendu' : (f.statut || 'actif'),
      otd: f.otd ?? null,
      scoring: f.scoring ?? null,
    }
  })

  // Statut affiché d'un BST piloté par son BC sous-traitant lié (bc_id) :
  //  BC 'brouillon' → en attente d'envoi ; 'envoye'/'accuse' → envoyé ; 'recu'/'recu_partiel' → revenu.
  const bstStatutFromBC = (bc: any, fallback: string): string => {
    const s = bc?.statut
    if (s === 'brouillon') return 'a_envoyer'
    if (s === 'envoye' || s === 'accuse') return 'envoye'
    if (s === 'recu' || s === 'recu_partiel') return 'recu'
    if (s === 'annule') return 'annule'
    return fallback
  }

  // Normalisation des BST (rows de bons_sous_traitance) — fallback démo si vide
  const bdsRowsForBst: any[] = (BDS_ROWS.length > 0 ? BDS_ROWS : LOTS_BST
    .filter(l => l.statut === 'sous_trait' || l.statut === 'planifié')
    .map((l:any, idx:number) => ({
      id: 'BST-DEMO-' + String(idx+1).padStart(3,'0'),
      lot_ref: l.id,
      cmd_ref: l.cmd_id || null,
      sous_traitant_id: (fournForBst[idx % Math.max(1,fournForBst.length)] || {}).id || null,
      client_nom: l.client_nom,
      piece: l.piece,
      operation: (fournForBst[idx % Math.max(1,fournForBst.length)] || {}).operation || 'Sous-traitance',
      qte: l.qte,
      statut: l.statut === 'sous_trait' ? 'envoye' : 'a_planifier',
      date_envoi: l.date_debut,
      date_debut: l.date_debut,
      date_retour_prevue: l.date_fin,
      duree_days: l.date_debut && l.date_fin ? Math.max(1, Math.round((new Date(l.date_fin).getTime()-new Date(l.date_debut).getTime())/86400000)) : 5,
    })))
    .map((s:any) => {
      const bc = s.bc_id ? BC_ST_BY_ID[s.bc_id] : null
      return { ...s, statut: bstStatutFromBC(bc, s.statut), bc_id: s.bc_id || null }
    })

  // ─── Présence opérateurs ─────────────────────────────────
  // Opérateurs de production (Seem / Semrac) — alimente le planning de présence.
  const opsForPresence = ((dbOps && dbOps.length > 0) ? dbOps : OPS_DEFAULT)
    .filter((o:any) => o.activite === 'Seem' || o.activite === 'Semrac')
    .map((o:any) => ({ id:o.id, nom:o.nom, activite:o.activite, poste:o.poste || '' }))
  const PRESENCES_JS = PRESENCES_DB.map((p:any) => ({ operateur_id:p.operateur_id, date:p.date_presence, shift:p.shift }))
  // Absences RH → cases « absent » (congé / maladie) qui surchargent la présence
  const ABSENCES_RH_JS = ABSENCES_RH.map((a:any) => ({ operateur_id:a.operateur_id, date:a.date_absence, type:a.type }))

  // Palette lot partagée BDT ↔ BST (continuité visuelle d'un lot dans tout le planning)
  const lotKeysAll: (string|null|undefined)[] = []
  bdtsForGantt.forEach((b:any) => { lotKeysAll.push(b.lotId || b.numAffaire || b.cmdId) })
  bdsRowsForBst.forEach((s:any) => { lotKeysAll.push(s.lot_ref || s.cmd_ref) })
  LOTS_BST.forEach((l:any) => { lotKeysAll.push(l.id) })
  const LOT_COLOR_MAP = buildLotColorMap(lotKeysAll)

  // ─── Commandes data ──────────────────────────────────────
  const CMDS = dbCmds ?? CMD_DEFAULT
  const cmdTableRows = CMDS.map(c=>{
    const av=c.bdt_total>0?Math.round(c.bdt_soldes/c.bdt_total*100):0
    const retBadge=c.retard?'<span style="border-radius:999px;padding:2px 9px;font-size:.62rem;font-weight:700;background:#fef2f2;color:#b91c1c;">Retard</span>':STATUT_BADGE(c.statut)
    return `<tr data-num="${escX(c.num_affaire??'')}" data-client="${escX(c.client_nom??'')}" data-statut="${c.statut??''}" data-activite="${c.activite??''}" onclick="location.href='/production/commande/'+encodeURIComponent('${c.id}')" style="cursor:pointer;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
      ${TD(`<span style="font-weight:800;color:#1e293b;">${escX(c.id??c.num_affaire??'—')}</span>${c.num_affaire?`<div style="font-size:.62rem;color:#94a3b8;font-weight:600;">Affaire ${escX(c.num_affaire)}</div>`:''}`)}
      ${TD(escX(c.client_nom??'—'))}${TD(escX((c.pieces??[]).join(', ')))}
      ${TD(`${(c.montant??0).toLocaleString('fr-FR')} €`)}
      ${TD(c.date_cmd??'—')}
      ${TD(c.date_liv?`<span style="${c.retard?'color:#b91c1c;font-weight:700;':''}">${c.date_liv}</span>`:'—')}
      ${TD(retBadge)}
      ${TD(`<div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;height:6px;background:#e2e8f0;border-radius:3px;min-width:60px;"><div style="height:100%;width:${av}%;background:${av===100?'#22c55e':av>50?'#3b82f6':'#f59e0b'};border-radius:3px;"></div></div><span style="font-size:.7rem;font-weight:700;">${av}%</span></div>`)}
      ${TD(c.has_st?'<span style="background:#e0e7ff;color:#3730a3;border-radius:999px;padding:2px 8px;font-size:.62rem;font-weight:700;">ST</span>':'—')}
    </tr>`
  }).join('')

  // ─── Lots data ───────────────────────────────────────────
  const LOTS = dbLots ?? LOTS_DEFAULT
  // Avancement par lot = opérations soldées (BDT usine + BDS sous-traitance) / total des opérations du lot
  const lotProgress = (lotId: string) => {
    const key = String(lotId)
    const bdtOf = bdtsForGantt.filter((b:any) => String(b.lotId||'') === key)
    const bdsOf = bdsRowsForBst.filter((s:any) => String(s.lot_ref||'') === key)
    const total = bdtOf.length + bdsOf.length
    const done = bdtOf.filter((b:any) => b.statut==='solde').length
      + bdsOf.filter((s:any) => s.statut==='recu' || s.statut==='solde').length
    const pct = total > 0 ? Math.round(done/total*100) : 0
    return { total, done, pct }
  }
  const progressBar = (pct: number, total: number, done: number) => {
    const col = pct===100 ? '#22c55e' : pct>50 ? '#3b82f6' : pct>0 ? '#f59e0b' : '#cbd5e1'
    return `<div style="display:flex;align-items:center;gap:8px;min-width:120px;">
      <div style="flex:1;height:7px;background:#eef2f7;border-radius:4px;overflow:hidden;min-width:70px;"><div style="height:100%;width:${pct}%;background:${col};border-radius:4px;transition:width .4s;"></div></div>
      <span style="font-size:.7rem;font-weight:800;color:${col};white-space:nowrap;">${pct}%</span>
      ${total>0?`<span style="font-size:.62rem;color:#94a3b8;white-space:nowrap;">${done}/${total}</span>`:''}
    </div>`
  }
  const lotTableRows = LOTS.map(l=>{
    const pr = lotProgress(l.id)
    return `
    <tr data-id="${l.id}" data-client="${escX(l.client_nom??'')}" data-piece="${escX(l.piece??'')}" data-statut="${l.statut??''}" onclick="location.href='/production/lot/'+encodeURIComponent('${l.id}')" style="cursor:pointer;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
      ${TD(`<span style="font-weight:700;color:#3b82f6;">${l.id}</span>`)}
      ${TD(escX(l.client_nom??'—'))}${TD(escX(l.piece??'—'))}${TD(l.qte!=null?String(l.qte):'—')}
      ${TD(l.date_debut??'—')}${TD(l.date_fin??'—')}${TD(STATUT_BADGE(l.statut))}
      ${TD(progressBar(pr.pct, pr.total, pr.done))}
      ${TD(l.cmd_id?`<a href="/production/commande/${encodeURIComponent(l.cmd_id)}" onclick="event.stopPropagation()" style="color:#3b82f6;text-decoration:none;font-size:.78rem;">${l.cmd_id}</a>`:'—')}
    </tr>`}).join('')

  // ─── Dashboard Programmation data ────────────────────────
  const BDTS_PROG = dbBDTs ?? (BDT_DEFAULT as unknown as BonDeTravail[])
  const cmdsEnCours = CMDS.filter(c=>c.statut!=='terminé'&&c.statut!=='validée')
  const lotsEnCours = LOTS.filter(l=>l.statut!=='terminé')
  const bdtsJour    = BDTS_PROG.filter(b=>b.statut!=='solde')
  const totalCharge = (BDTS_PROG.length>0?BDTS_PROG:BDT_DEFAULT as unknown as BonDeTravail[]).reduce((s,b)=>s+(b.duree||0),0)
  // Capacité = nombre d'opérateurs Seem/Semrac × 8h (depuis la DB si dispo)
  const opsCapaPool = (dbOps && dbOps.length > 0 ? dbOps : OPS_DEFAULT).filter((o:any)=>o.activite==='Seem'||o.activite==='Semrac')
  const capaTot  = Math.max(1, opsCapaPool.length*8)
  const txCharge = Math.round(totalCharge/capaTot*100)
  const WEEK_DAYS=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
  // Charge hebdomadaire dynamique : pour chaque jour, capacité = présents × 8h, charge = total BDT / 5j ouvrés
  const _todayDt = new Date(TODAY)
  const _diffMon = (_todayDt.getDay() + 6) % 7
  const _weekStart = new Date(_todayDt); _weekStart.setDate(_todayDt.getDate() - _diffMon)
  const _absMap = new Set(ABSENCES_RH.map((a:any) => `${a.operateur_id}|${a.date_absence}`))
  const _presByDayCount = (iso: string) => {
    const ids = new Set<string>()
    PRESENCES_DB.forEach((p:any) => {
      if (p.date_presence === iso && p.shift && p.shift !== 'absent' && !_absMap.has(`${p.operateur_id}|${iso}`)) ids.add(String(p.operateur_id))
    })
    return ids.size
  }
  const _chargePerOuvre = totalCharge / 5
  const weekLoad = Array.from({length: 7}, (_, i) => {
    const d = new Date(_weekStart); d.setDate(_weekStart.getDate() + i)
    const iso = d.toISOString().slice(0,10)
    const dow = d.getDay()
    if (dow === 0 || dow === 6) return 0
    const nbPres = _presByDayCount(iso)
    if (nbPres === 0) return 0
    return Math.min(150, Math.round(_chargePerOuvre / (nbPres * 8) * 100))
  })
  const kpiCard=(icon:string,color:string,val:string|number,label:string,sub='')=>
    `<div class="card" style="padding:20px;display:flex;align-items:center;gap:14px;"><div style="width:46px;height:46px;border-radius:14px;background:${color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas ${icon}" style="color:${color};font-size:1.2rem;"></i></div><div><div style="font-size:1.6rem;font-weight:900;color:#1e293b;">${val}</div><div style="font-size:.75rem;font-weight:600;color:#64748b;">${label}</div>${sub?`<div style="font-size:.68rem;color:#94a3b8;">${sub}</div>`:''}</div></div>`
  const lotRowsProg = lotsEnCours.map(l=>{
    const etape=l.statut==='sous_trait'?'Sous-traitance':l.statut==='bloqué'?'Bloqué':l.statut==='planifié'?'Planifié':'Production'
    const ec=l.statut==='bloqué'?'#ef4444':l.statut==='sous_trait'?'#6366f1':l.statut==='planifié'?'#3b82f6':'#22c55e'
    return `<tr>${TD(`<span style="font-weight:700;">${l.id}</span>`)}${TD(escX(l.client_nom??'—'))}${TD(escX(l.piece??'—'))}${TD(`<span style="background:${ec}22;color:${ec};border-radius:999px;padding:2px 9px;font-size:.65rem;font-weight:700;">${etape}</span>`)}${TD(l.date_fin??'—')}</tr>`
  }).join('')
  const cmdRowsProg = cmdsEnCours.slice(0,8).map(c=>{
    const av=c.bdt_total>0?Math.round(c.bdt_soldes/c.bdt_total*100):0
    return `<tr>${TD(`<span style="font-weight:700;">${escX(c.num_affaire??c.id)}</span>`)}${TD(escX(c.client_nom??'—'))}${TD(c.date_liv??'—')}${TD(`<div style="display:flex;align-items:center;gap:6px;"><div style="flex:1;height:5px;background:#e2e8f0;border-radius:3px;min-width:50px;"><div style="height:100%;width:${av}%;background:${av===100?'#22c55e':av>50?'#3b82f6':'#f59e0b'};border-radius:3px;"></div></div><span style="font-size:.68rem;font-weight:700;">${av}%</span></div>`)}${TD(c.retard?'<span style="color:#ef4444;font-weight:700;font-size:.75rem;">Retard</span>':'<span style="color:#22c55e;font-size:.75rem;">OK</span>')}</tr>`
  }).join('')

  // ─── Dashboard Production data ────────────────────────────
  const opsForModal2 = (dbOps&&dbOps.length>0)
    ? dbOps.map(o=>({id:o.id,nom:o.nom,activite:o.activite,shift:deriveShift(o.shift_id)}))
    : OPS_DEFAULT
  const now2=new Date(); const startOfYear=new Date(now2.getFullYear(),0,1)
  const joursOuvres=Math.round((now2.getTime()-startOfYear.getTime())/86400000*5/7)
  // OPEX par machine = données réelles du parc (MACH_REAL) : taux horaire réel, OPEX consommables réel (machOpex),
  // utilisation = charge BDT affectée à la machine / capacité hebdo.
  const _dpPalette = ['#3b82f6','#0ea5e9','#ec4899','#a855f7','#f97316','#8b5cf6','#06b6d4','#6366f1','#14b8a6','#e11d48']
  const _machLoadH: Record<string, number> = {}
  ;(dbBDTs ?? []).forEach((b:any) => { if (b.machine_id) _machLoadH[String(b.machine_id)] = (_machLoadH[String(b.machine_id)]||0) + Number(b.duree||0) })
  const machinesOpex = (MACH_REAL as any[]).filter((m:any) => m.statut !== 'arret').map((m:any, i:number) => {
    const tauxH = Number(m.cout_h ?? m.taux_horaire ?? 0)
    const capaH = Number(m.capacite_h ?? 8)
    const opReel = machOpex[String(m.id)]
    const utilisation = capaH > 0 ? Math.min(100, Math.round((_machLoadH[String(m.id)]||0) / (capaH * 5) * 100)) : 0
    return { nom: m.nom, code: m.code ?? '—', tauxH, utilisation, opex: opReel ? Math.round(opReel.total) : Math.round(tauxH * capaH * joursOuvres), couleur: _dpPalette[i % _dpPalette.length] }
  })
  const totalOpex = machinesOpex.reduce((s,m)=>s+m.opex,0)
  // TRS calculé sur données réelles : Qualité = BDT soldés sans NC ; Performance = temps alloué/réel ; Disponibilité = machines opérationnelles
  const _bdtsReal = (dbBDTs ?? []) as any[]
  const _soldes = _bdtsReal.filter(b => b.statut === 'solde')
  const _qual = _soldes.length ? Math.round(_soldes.filter(b => b.resultat !== 'nc').length / _soldes.length * 100) : 100
  const _perfPairs = _soldes.filter(b => Number(b.temps_reel) > 0 && Number(b.temps_alloue) > 0)
  const _perf = _perfPairs.length ? Math.min(100, Math.round(_perfPairs.reduce((s,b)=>s + Number(b.temps_alloue)/Number(b.temps_reel),0)/_perfPairs.length*100)) : 0
  const _machTot = (MACH_REAL as any[]).length
  const _dispo = _machTot ? Math.round((MACH_REAL as any[]).filter((m:any)=>m.statut==='operationnel'||m.statut==='actif').length / _machTot * 100) : 0
  const trsData = { disponibilite:_dispo, performance:_perf, qualite:_qual, trs:Math.round(_dispo*_perf*_qual/10000), trg:Math.round(_dispo*_perf/100), tre:_dispo }
  const gauge2=(label:string,val:number,color:string,sub:string)=>
    `<div class="card" style="padding:20px;text-align:center;"><div style="font-size:.75rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">${label}</div><div style="position:relative;width:120px;height:60px;margin:0 auto 8px;overflow:hidden;"><div style="width:120px;height:120px;border-radius:50%;background:conic-gradient(${color} 0% ${val}%,#e2e8f0 ${val}% 100%);clip-path:polygon(0 50%,100% 50%,100% 100%,0 100%);"></div><div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);font-size:1.5rem;font-weight:900;color:#1e293b;">${val}%</div></div><div style="font-size:.68rem;color:#94a3b8;">${sub}</div></div>`
  const bdtsSrc2=(dbBDTs&&dbBDTs.length>0)?dbBDTs.map(b=>({id:b.id,client:b.client_nom||'',piece:b.piece,operation:b.operation,duree:b.duree,priorite:b.priorite,statut:b.statut})):BDT_DEFAULT
  const bdtsToday2=bdtsSrc2.filter(b=>b.statut!=='solde').slice(0,8)
  const bdtRowsDProd=bdtsToday2.map(b=>{
    const pc=({critique:'#ef4444',urgent:'#f59e0b',normal:'#22c55e'} as Record<string,string>)[b.priorite]||'#22c55e'
    return `<tr>${TD(`<span style="font-weight:700;color:#1e293b;">${b.id}</span>`)}${TD(escX(b.client))}${TD(escX(b.piece))}${TD(escX(b.operation))}${TD(`<span style="border-radius:999px;padding:2px 8px;font-size:.62rem;font-weight:700;background:${pc}22;color:${pc};">${b.priorite}</span>`)}${TD(STATUT_BADGE(b.statut))}${TD(`<span style="color:#64748b;">${b.duree}h</span>`)}${TD(`<button onclick="dupBDT('${b.id}')" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:7px;background:#f1f5f9;border:1.5px solid #e2e8f0;font-size:.68rem;font-weight:700;cursor:pointer;color:#374151;"><i class="fas fa-copy"></i> Dupliquer</button>`)}</tr>`
  }).join('')
  const opexRows2=machinesOpex.map(m=>`<tr>${TD(`<div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:${m.couleur};flex-shrink:0;"></span><span style="font-weight:700;">${escX(m.nom)}</span></div>`)}${TD(`<span style="color:#64748b;">${escX(m.code)}</span>`)}${TD(`${m.tauxH} €/h`)}${TD(`<div style="display:flex;align-items:center;gap:6px;"><div style="flex:1;height:5px;background:#e2e8f0;border-radius:3px;min-width:60px;"><div style="height:100%;width:${m.utilisation}%;background:${m.couleur};border-radius:3px;"></div></div><span style="font-size:.7rem;">${m.utilisation}%</span></div>`)}${TD(`<span style="font-weight:700;color:#1e293b;">${m.opex.toLocaleString('fr-FR')} €</span>`)}</tr>`).join('')

  const content = `
<style>
  .gantt-header-row{display:grid;grid-template-columns:300px 1fr;background:#1e293b;color:white;border-radius:12px 12px 0 0;}
  .gantt-body-row{display:grid;grid-template-columns:300px 1fr;border-bottom:1px solid #f1f5f9;}
  .op-info-cell{background:white;padding:8px 10px;display:flex;flex-direction:column;gap:3px;min-height:68px;border-right:2px solid #f1f5f9;}
  .op-info-cell.absent{background:#fef2f2;}
  .gantt-lane{position:relative;background:white;min-height:68px;}
  .gantt-lane.absent{background:repeating-linear-gradient(45deg,#fef2f2,#fef2f2 8px,#fee2e2 8px,#fee2e2 16px);}
  .gantt-tick{position:absolute;top:0;bottom:0;border-left:1px solid #f1f5f9;pointer-events:none;}
  .gantt-tick.major{border-left:1px solid #e2e8f0;}
  .shift-zone{position:absolute;top:0;bottom:0;opacity:.06;pointer-events:none;}
  .bdt-bar{position:absolute;top:6px;bottom:6px;border-radius:7px;display:flex;flex-direction:column;justify-content:center;padding:0 6px;cursor:pointer;font-size:.63rem;font-weight:700;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.15);z-index:2;transition:all .15s;}
  .bdt-bar:hover{filter:brightness(.9);z-index:10;box-shadow:0 4px 14px rgba(0,0,0,.25);}
  .bdt-bar.solde{opacity:.65;filter:grayscale(.3);}
  .bdt-bar.programme{border:2px dashed rgba(255,255,255,.5);}
  .drag-over{background:#dbeafe!important;outline:2px dashed #3b82f6;outline-offset:-2px;}
  .tooltip-box{position:fixed;background:#0f172a;color:white;border-radius:10px;padding:10px 14px;font-size:.75rem;pointer-events:none;z-index:1000;max-width:260px;box-shadow:0 8px 28px rgba(0,0,0,.4);display:none;}
  .pending-card{display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:8px;border:1.5px dashed #fbd38d;background:#fffbeb;cursor:grab;font-size:.72rem;margin-bottom:6px;}
  .pending-card:active{cursor:grabbing;}
  .tab-gang{padding:5px 14px;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;background:transparent;border:none;}
  .tab-gang.active{background:#f97316;color:white;}
  .tab-gang:not(.active):hover{background:#f1f5f9;}
  .stat-pill{background:white;border-radius:10px;padding:.6rem .9rem;box-shadow:0 1px 3px rgba(0,0,0,.07);text-align:center;}
</style>

<!-- ═══ EN-TÊTE SERVICE + ONGLETS ════════════════════════════ -->
${serviceHeader({
  icon: 'fa-industry',
  color: '#f97316',
  darkBg: '#451a03',
  title: 'Service Production',
  subtitle: 'Sylvie · Planning · BDT/BST · Commandes · Lots · Machines · EN 9100:2018',
  tabs: [
    { id: 'gantt-bdt', label: 'Planning Gantt BDT',     icon: 'fa-calendar-alt' },
    { id: 'gantt-bst', label: 'Planning Gantt BST',     icon: 'fa-industry' },
    { id: 'presence',  label: 'Présence opérateurs',    icon: 'fa-user-clock' },
    { id: 'commandes', label: 'Commandes & Lots',       icon: 'fa-clipboard-list', badge: CMDS.length || undefined },
    { id: 'machines',  label: 'Process Ateliers',       icon: 'fa-sitemap', badge: PROC_LIST.length || undefined },
    { id: 'dash-prog', label: 'Dashboard Programmation',icon: 'fa-chart-pie' },
    { id: 'dash-prod', label: 'Dashboard Production',   icon: 'fa-tachometer-alt' },
  ],
  switchFn: 'showProdTab',
  tabIdPrefix: 'ptab',
  activeId: 'gantt-bdt'
})}

<!-- ═══ PANEL 1 : GANTT BDT ══════════════════════════════════ -->
<div id="ppanel-gantt-bdt">
  <div style="padding:20px;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:8px;background:white;border-radius:10px;padding:8px 12px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
        <i class="fas fa-calendar" style="color:#f97316;font-size:.85rem;"></i>
        <input type="date" id="planDate" value="${TODAY}" onchange="loadDay(this.value)" style="font-size:.85rem;font-weight:700;color:#1e293b;border:none;outline:none;background:transparent;cursor:pointer;"/>
        <button onclick="shiftDate(-1)" style="width:22px;height:22px;border-radius:5px;background:#f1f5f9;border:none;cursor:pointer;font-size:.8rem;">‹</button>
        <button onclick="shiftDate(1)"  style="width:22px;height:22px;border-radius:5px;background:#f1f5f9;border:none;cursor:pointer;font-size:.8rem;">›</button>
      </div>
      <div style="display:flex;gap:2px;background:white;border-radius:10px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
        <button onclick="setAct('all')"    id="fa-all"    class="tab-gang active">Tous</button>
        <button onclick="setAct('Seem')"   id="fa-Seem"   class="tab-gang">Seem</button>
        <button onclick="setAct('Semrac')" id="fa-Semrac" class="tab-gang">Semrac</button>
      </div>
      <div style="display:flex;gap:2px;background:white;border-radius:10px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
        <button onclick="setType('all')"     id="ft-all"     class="tab-gang active">Tous process</button>
        <button onclick="setType('machine')" id="ft-machine" class="tab-gang">Machine</button>
        <button onclick="setType('manuel')"  id="ft-manuel"  class="tab-gang">Manuel</button>
      </div>
      <div style="flex:1;"></div>
      <div style="display:flex;align-items:center;gap:10px;font-size:.72rem;color:#64748b;">
        <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:#3b82f6;border:2px dashed rgba(255,255,255,.8);display:inline-block;"></span>Programmé</span>
        <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:#f59e0b;display:inline-block;"></span>Reçu</span>
        <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:#22c55e;display:inline-block;"></span>Soldé</span>
        <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:#ef4444;display:inline-block;"></span>Soldé NC</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;background:white;border-radius:10px;padding:6px 10px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
        <i class="fas fa-search" style="color:#94a3b8;font-size:.78rem;"></i>
        <input id="affSearch" type="text" placeholder="N° d'affaire…" oninput="setAffaireFilter(this.value)" style="border:none;outline:none;background:transparent;font-size:.78rem;font-weight:600;color:#1e293b;width:120px;"/>
        <button id="affClear" onclick="clearAffaireFilter()" title="Effacer la recherche" style="display:none;align-items:center;justify-content:center;width:18px;height:18px;border-radius:5px;background:#f1f5f9;border:none;cursor:pointer;color:#64748b;font-size:.7rem;"><i class="fas fa-times"></i></button>
      </div>
      <button onclick="openBdtModal()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border-radius:10px;font-size:.8rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(234,88,12,.3);"><i class="fas fa-plus"></i> Nouveau BDT</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:14px;" id="statsBar"></div>
    <!-- CE QUI MANQUE ENCORE AUX ORDRES DE TRAVAIL.
         Ils sont TOUS au planning : on programme avant que la matiere arrive, c'est
         meme a cela que sert un planning. Cette carte dit seulement ce qu'il reste a
         obtenir avant de LANCER chacun d'eux, pour qu'on ne l'apprenne pas au pied
         de la machine. -->
    ${(dbBdtsVigilance ?? []).length ? `
    <div class="card" style="padding:14px 16px;border-radius:14px;margin-bottom:14px;border-left:4px solid #f59e0b;">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <span style="font-weight:700;color:#1e293b;font-size:.82rem;"><i class="fas fa-triangle-exclamation" style="color:#f59e0b;margin-right:6px;"></i>Ordres de travail programmables, mais pas encore lan\u00e7ables</span>
        <span style="background:#fef3c7;color:#92400e;font-size:.65rem;font-weight:700;padding:1px 8px;border-radius:999px;">${(dbBdtsVigilance ?? []).length}</span>
        <span style="font-size:.66rem;color:#94a3b8;">ils sont bien au planning \u00b7 il reste ceci \u00e0 obtenir avant de les lancer</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.76rem;">
          <thead><tr style="background:#fffbeb;">
            ${['N\u00b0 BDT','Affaire / Lot','Pi\u00e8ce','Op\u00e9ration','Ce qu\u2019il attend']
              .map((t) => `<th style="text-align:left;padding:7px 10px;color:#92400e;font-size:.62rem;text-transform:uppercase;font-weight:700;">${t}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${(dbBdtsVigilance ?? []).map((b) => `<tr style="border-bottom:1px solid #fef3c7;">
              <td style="padding:7px 10px;font-weight:700;color:#0891b2;">${escX(b.id)}</td>
              <td style="padding:7px 10px;color:#475569;">${escX(b.num_affaire || b.cmd_ref)}${b.lot_ref ? `<div style="font-size:.64rem;color:#0d9488;font-family:monospace;">${escX(b.lot_ref)}</div>` : ''}</td>
              <td style="padding:7px 10px;color:#374151;font-weight:600;">${escX(b.piece)}</td>
              <td style="padding:7px 10px;color:#6b7280;">${escX(b.operation)}</td>
              <td style="padding:7px 10px;"><span style="background:#fef3c7;color:#92400e;border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:700;">${escX(b.raison)}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : ''}

    <!-- GOULOTTE : BDT à classer AU-DESSUS du planning (pleine largeur) -->
    <div id="pendingDropZone" class="card" style="padding:14px 16px;border-radius:14px;transition:outline .12s;margin-bottom:14px;" ondragover="onPendingOver(event)" ondragleave="onPendingLeave(event)" ondrop="onPendingDrop(event)">
      <div style="margin-bottom:10px;">
        <div style="font-weight:700;color:#1e293b;font-size:.82rem;display:flex;align-items:center;gap:6px;"><i class="fas fa-inbox" style="color:#f97316;"></i> BDT à classer / en attente de programmation<span id="cntPend" style="background:#ffedd5;color:#c2410c;font-size:.65rem;font-weight:700;padding:1px 7px;border-radius:999px;margin-left:auto;">0</span></div>
        <div style="font-size:.62rem;color:#94a3b8;margin-top:3px;">Triés par échéance · chemin critique · Glisser une carte sur un process du planning ci-dessous, ou déposer ici pour déprogrammer</div>
      </div>
      <div id="pendingList" style="overflow-y:auto;max-height:240px;display:flex;flex-wrap:wrap;gap:8px;margin:0 -4px;padding:4px;"></div>
    </div>
    <div id="lotFocusBanner" style="display:none;align-items:center;gap:10px;background:linear-gradient(135deg,#faf5ff,#eff6ff);border:1px solid #ddd6fe;border-radius:12px;padding:8px 14px;margin-bottom:12px;flex-wrap:wrap;">
      <i class="fas fa-crosshairs" style="color:#7c3aed;"></i>
      <span style="font-size:.8rem;color:#5b21b6;font-weight:700;">Focus étape <span id="lotFocusLabel" style="font-family:monospace;font-weight:600;"></span></span>
      <span style="font-size:.72rem;color:#7c3aed;">— seuls le poste de cette étape et ceux de l'étape précédente / suivante restent affichés</span>
      <button onclick="clearFocusLot()" style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-size:.74rem;font-weight:700;color:#374151;background:white;border:1px solid #e2e8f0;border-radius:8px;padding:5px 12px;cursor:pointer;"><i class="fas fa-eye"></i> Tout afficher</button>
    </div>
    <div style="margin-bottom:16px;overflow-x:auto;">
      <div class="card" style="overflow:hidden;min-width:1120px;">
        <div class="gantt-header-row">
          <div style="padding:8px 10px;border-right:1px solid rgba(255,255,255,.1);font-size:.72rem;font-weight:700;color:#94a3b8;display:flex;align-items:center;gap:6px;"><i class="fas fa-cubes-stacked" style="color:#64748b;"></i> Postes</div>
          <div id="hoursHdr" style="position:relative;min-height:34px;overflow:hidden;"></div>
        </div>
        <div id="ganttBody" style="border-radius:0 0 14px 14px;overflow:hidden;"></div>
      </div>
    </div>
    <!-- Carte « Présence opérateurs » retirée : la section « Affectation des ressources aux postes » la remplace -->


    <!-- AFFECTATION DES RESSOURCES : opérateurs par plage horaire → sous-cases process DANS le planning ci-dessus -->
    <style>.proc-slot.drag-over{border-color:#6366f1 !important;border-style:solid !important;background:#eef2ff !important;} .proc-slot.sel-target{outline:2px dashed #6366f1;outline-offset:-2px;} .ops-card.sel,.pending-card.sel{outline:2px solid #6366f1;outline-offset:1px;}</style>
    <div class="card" style="padding:16px;margin-bottom:16px;">
      <div style="font-weight:700;color:#1e293b;font-size:.85rem;display:flex;align-items:center;gap:6px;margin-bottom:4px;"><i class="fas fa-people-arrows" style="color:#6366f1;"></i> Affectation des ressources aux postes — <span id="rhPosteJour" style="color:#4f46e5;"></span></div>
      <div style="font-size:.7rem;color:#94a3b8;margin-bottom:12px;">Glisse un opérateur <strong>ou</strong> clique-le pour le sélectionner, puis clique une sous-case (Matin / Après-midi / Soir) d'un process <strong>dans le planning ci-dessus</strong> — affectation programmée &amp; tracée pour le jour.</div>
      <div id="opsByShift"></div>
    </div>
  </div>
  <div class="tooltip-box" id="ganttTT"></div>
  <!-- Modal BDT -->
  <div id="bdtModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
    <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:620px;margin:1rem;overflow:hidden;max-height:90vh;overflow-y:auto;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#f97316,#ea580c);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-plus-circle" style="margin-right:8px;"></i>Créer / Affecter un BDT</h3><button onclick="closeModal('bdtModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div><label class="form-label">N° Commande *</label><input id="m_cmd" type="text" placeholder="CMD-2026-XXXX" class="form-input"/></div>
        <div><label class="form-label">Client *</label><input id="m_client" type="text" placeholder="Raison sociale" class="form-input"/></div>
        <div><label class="form-label">Activité *</label><select id="m_activite" class="form-input" onchange="updateModalOps()"><option value="">— Choisir —</option><option>Seem</option><option>Semrac</option></select></div>
        <div><label class="form-label">Opération *</label><select id="m_operation" class="form-input" onchange="updateModalOpsEligibles()"><option value="">— Choisir activité —</option></select></div>
        <div><label class="form-label">Pièce *</label><input id="m_piece" type="text" placeholder="DISSIP-A24" class="form-input"/></div>
        <div><label class="form-label">Durée (h) *</label><input id="m_duree" type="number" step="0.5" placeholder="2.5" class="form-input"/></div>
        <div><label class="form-label">Heure début</label><input id="m_debut" type="time" value="06:00" class="form-input"/></div>
        <div><label class="form-label">Priorité</label><select id="m_priorite" class="form-input"><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critique">Critique</option></select></div>
        <div style="grid-column:span 2;"><label class="form-label">Process atelier <span id="compHint" style="color:#f59e0b;font-style:italic;font-size:.72rem;font-weight:400;"></span></label><select id="m_process" class="form-input"><option value="">— Choisir activité d'abord —</option></select></div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('bdtModal')" class="btn btn-secondary">Annuler</button><button onclick="createBDT()" class="btn btn-primary"><i class="fas fa-plus"></i> Créer le BDT</button></div>
    </div>
  </div>
  <!-- Modal Soldage -->
  <div id="soldageModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
    <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:480px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#22c55e,#16a34a);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-check-double" style="margin-right:8px;"></i>Soldage BDT</h3><button onclick="closeModal('soldageModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;"><div id="soldageInfo" style="background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:12px;font-size:.82rem;"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div><label class="form-label">Heure fin réelle *</label><input id="s_fin" type="time" class="form-input"/></div><div><label class="form-label">Résultat</label><select id="s_resultat" class="form-input" onchange="sResultatChange()"><option value="ok">✅ Conforme</option><option value="reprise">⚠️ Reprise partielle</option><option value="nc">❌ Non-conformité</option></select></div></div><div id="s_grav_wrap" style="display:none;margin-top:10px;"><label class="form-label"><i class="fas fa-triangle-exclamation" style="margin-right:5px;color:#dc2626;"></i>Gravité de la non-conformité *</label><select id="s_gravite" class="form-input"><option value="Mineure">Mineure — non bloquant</option><option value="Majeure" selected>Majeure — non bloquant</option><option value="Critique">Critique — BLOQUE l'expédition</option><option value="Bloquante">Bloquante — BLOQUE l'expédition</option></select></div><div style="margin-top:10px;"><label class="form-label">Observations</label><textarea id="s_obs" rows="2" class="form-input" style="resize:vertical;"></textarea></div><div style="margin-top:12px;padding:12px;background:#fefce8;border:1px solid #fde68a;border-radius:10px;"><div style="font-size:.7rem;font-weight:700;color:#92400e;margin-bottom:8px;"><i class="fas fa-id-badge" style="margin-right:5px;"></i>Identification opérateur (matricule + code PIN)</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div><label class="form-label">Matricule *</label><input id="s_matricule" type="text" placeholder="OP-001" class="form-input" autocomplete="off"/></div><div><label class="form-label">Code PIN *</label><input id="s_pin" type="password" inputmode="numeric" placeholder="••••" class="form-input" autocomplete="off"/></div></div></div></div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('soldageModal')" class="btn btn-secondary">Annuler</button><button onclick="confirmerSoldage()" class="btn btn-success"><i class="fas fa-check-double"></i> Solder</button></div>
    </div>
  </div>
  <!-- Modal Réception (matricule + PIN) -->
  <div id="recuModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
    <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:440px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#f59e0b,#d97706);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-play" style="margin-right:8px;"></i>Réceptionner le BDT</h3><button onclick="closeModal('recuModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;"><div id="recuInfo" style="background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:12px;font-size:.82rem;"></div><div style="padding:12px;background:#fefce8;border:1px solid #fde68a;border-radius:10px;"><div style="font-size:.7rem;font-weight:700;color:#92400e;margin-bottom:8px;"><i class="fas fa-id-badge" style="margin-right:5px;"></i>Identification opérateur</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div><label class="form-label">Matricule *</label><input id="r_matricule" type="text" placeholder="OP-001" class="form-input" autocomplete="off"/></div><div><label class="form-label">Code PIN *</label><input id="r_pin" type="password" inputmode="numeric" placeholder="••••" class="form-input" autocomplete="off"/></div></div></div></div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('recuModal')" class="btn btn-secondary">Annuler</button><button onclick="confirmRecu()" class="btn" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;"><i class="fas fa-play"></i> Confirmer réception</button></div>
    </div>
  </div>
  <!-- Modal ST -->
  <div id="stModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
    <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:540px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#6366f1,#4338ca);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-industry" style="margin-right:8px;"></i>Nouvelle Sous-Traitance</h3><button onclick="closeModal('stModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div><label class="form-label">N° Commande</label><input type="text" placeholder="CMD-2026-XXXX" class="form-input"/></div><div><label class="form-label">Client final</label><input type="text" placeholder="Client" class="form-input"/></div><div><label class="form-label">Opération à ST</label><select class="form-input" id="st_op"></select></div><div><label class="form-label">Sous-traitant</label><input type="text" placeholder="Raison sociale" class="form-input"/></div><div><label class="form-label">Date retour prévue</label><input type="date" class="form-input"/></div><div><label class="form-label">Priorité</label><select class="form-input"><option>Normal</option><option>Urgent</option><option>Critique</option></select></div></div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('stModal')" class="btn btn-secondary">Annuler</button><button onclick="createST()" class="btn" style="background:linear-gradient(135deg,#6366f1,#4338ca);color:white;"><i class="fas fa-paper-plane"></i> Commander</button></div>
    </div>
  </div>
  <!-- Modal Déclaration de sortie matière (double-clic BDT) -->
  <div id="sortieModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
    <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:560px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#0ea5e9,#0284c7);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-dolly" style="margin-right:8px;"></i>Déclaration de sortie matière</h3><button onclick="closeModal('sortieModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;">
        <input type="hidden" id="sm_bdt_id"/><input type="hidden" id="sm_lot_id"/>
        <div id="sm_info" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#075985;"></div>
        <div style="margin-bottom:12px;"><label class="form-label">Type de sortie</label>
          <div style="display:flex;gap:8px;">
            <label style="flex:1;display:flex;align-items:center;gap:7px;border:1.5px solid #bae6fd;background:#f0f9ff;border-radius:9px;padding:9px 11px;cursor:pointer;font-size:.8rem;font-weight:700;color:#0369a1;"><input type="radio" name="sm_cat" value="matiere" checked onchange="smToggleCat()"/> Matière</label>
            <label style="flex:1;display:flex;align-items:center;gap:7px;border:1.5px solid #ddd6fe;background:#f5f3ff;border-radius:9px;padding:9px 11px;cursor:pointer;font-size:.8rem;font-weight:700;color:#6d28d9;"><input type="radio" name="sm_cat" value="fourniture" onchange="smToggleCat()"/> Fourniture</label>
            <label style="flex:1;display:flex;align-items:center;gap:7px;border:1.5px solid #fed7aa;background:#fff7ed;border-radius:9px;padding:9px 11px;cursor:pointer;font-size:.8rem;font-weight:700;color:#c2410c;"><input type="radio" name="sm_cat" value="consommable" onchange="smToggleCat()"/> Consommable machine</label>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;">
          <div><label class="form-label">Article (stock)</label><select id="sm_article" class="form-input"></select></div>
          <div><label class="form-label">Quantité *</label><input id="sm_qte" type="number" step="0.001" min="0" placeholder="0" class="form-input"/></div>
        </div>
        <div id="sm_machine_wrap" style="display:none;margin-top:12px;">
          <label class="form-label">Machine concernée (OPEX)</label>
          <select id="sm_machine" class="form-input"></select>
          <div id="sm_poste_row" style="margin-top:10px;display:none;">
            <label class="form-label">…ou Poste concerné <span style="color:#8b5cf6;font-weight:600;">(OPEX poste manuel)</span></label>
            <select id="sm_poste" class="form-input"></select>
          </div>
          <div style="font-size:.7rem;color:#c2410c;margin-top:5px;"><i class="fas fa-link" style="margin-right:4px;"></i>Le consommable sera tracé dans l'OPEX de la machine <strong>ou</strong> du poste choisi.</div>
        </div>
        <div style="margin-top:12px;"><label class="form-label">Observations</label><input id="sm_motif" type="text" placeholder="Motif / n° lot matière…" class="form-input"/></div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('sortieModal')" class="btn btn-secondary">Annuler</button><button onclick="confirmSortie()" class="btn" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;"><i class="fas fa-check"></i> Valider la sortie</button></div>
    </div>
  </div>
</div>

<!-- Bouton « Demande d'achat » OPÉRATEUR (borne PIN) : en haut à droite de la bannière (comme les autres services), plus flottant -->
<button id="oda-hdr-btn" onclick="odaOpen()" title="Demande d'achat (opérateur)" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(255,255,255,.2);color:white;border:1px solid rgba(255,255,255,.3);border-radius:8px;font-size:.77rem;font-weight:700;cursor:pointer;"><i class="fas fa-cart-plus"></i>Demande d'achat</button>
<script>
(function(){ try{ var b=document.getElementById('oda-hdr-btn'), bar=document.getElementById('svc-hdr-bar'); if(b&&bar){ b.style.marginLeft='auto'; bar.appendChild(b); } else if(b){ b.style.position='fixed'; b.style.top='12px'; b.style.right='24px'; b.style.zIndex='6900'; b.style.boxShadow='0 4px 14px rgba(0,0,0,.2)'; b.style.background='rgba(15,23,42,.85)'; b.style.borderRadius='999px'; b.style.padding='9px 16px'; } }catch(e){} })();
</script>
<div id="odaModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:520;">
  <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:520px;margin:1rem;overflow:hidden;">
    <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#f59e0b,#d97706);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-cart-plus" style="margin-right:8px;"></i>Demande d'achat opérateur</h3><button onclick="closeModal('odaModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
    <div style="padding:20px;">
      <div id="oda-ident" style="display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;">
        <div><label class="form-label">Matricule</label><input id="oda_mat" type="text" placeholder="Votre matricule" class="form-input"/></div>
        <div><label class="form-label">PIN</label><input id="oda_pin" type="password" placeholder="••••" class="form-input"/></div>
        <button onclick="odaIdentify()" class="btn btn-primary" style="height:38px;"><i class="fas fa-right-to-bracket"></i> Identifier</button>
      </div>
      <div id="oda-context" style="display:none;">
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:9px;padding:8px 12px;font-size:.78rem;color:#92400e;margin:0 0 12px;"><i class="fas fa-user-check" style="margin-right:5px;"></i><span id="oda_who"></span> · Poste : <select id="oda_poste" onchange="odaFillMachines()" style="border:1px solid #fde68a;border-radius:6px;padding:2px 6px;font-size:.76rem;font-weight:700;color:#92400e;background:white;"></select></div>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 10px;cursor:pointer;font-size:.78rem;font-weight:700;color:#374151;"><input type="radio" name="oda_cat" value="matiere" checked onchange="odaToggleCat()"/> Matière</label>
          <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 10px;cursor:pointer;font-size:.78rem;font-weight:700;color:#374151;"><input type="radio" name="oda_cat" value="accessoire" onchange="odaToggleCat()"/> Accessoire</label>
          <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 10px;cursor:pointer;font-size:.78rem;font-weight:700;color:#0369a1;"><input type="radio" name="oda_cat" value="machine" onchange="odaToggleCat()"/> Machine</label>
        </div>
        <div id="oda_machine_wrap" style="display:none;margin-bottom:12px;"><label class="form-label">Machine concernée (OPEX) *</label><select id="oda_machine" class="form-input"></select><div style="font-size:.66rem;color:#c2410c;margin-top:4px;"><i class="fas fa-bolt" style="margin-right:3px;"></i>Le prix ira sur l'OPEX de cette machine à la réception.</div></div>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px;margin-bottom:12px;">
          <div><label class="form-label">Article / désignation *</label><input id="oda_article" type="text" placeholder="Ex : plaquette carbure, huile de coupe…" class="form-input"/></div>
          <div><label class="form-label">Quantité</label><input id="oda_qte" type="number" min="1" value="1" class="form-input"/></div>
        </div>
        <div><label class="form-label">Priorité</label><select id="oda_prio" class="form-input"><option value="normal">Normale</option><option value="urgent">Urgente</option><option value="critique">Critique</option></select></div>
      </div>
    </div>
    <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('odaModal')" class="btn btn-secondary">Annuler</button><button id="oda_submit" onclick="odaSubmit()" class="btn btn-primary" style="display:none;background:linear-gradient(135deg,#f59e0b,#d97706);"><i class="fas fa-paper-plane"></i> Envoyer aux Achats</button></div>
  </div>
</div>

<!-- ═══ PANEL 2 : GANTT BST (jour-par-jour) ═══════════════════ -->
<div id="ppanel-gantt-bst" style="display:none;">
  <style>
    .bst-grid{display:grid;grid-template-columns:240px repeat(21, minmax(58px, 1fr));}
    .bst-day{border-left:1px solid #f1f5f9;background:white;position:relative;min-height:84px;}
    .bst-day.weekend{background:#f8fafc;}
    .bst-day.today{background:#fff7ed;}
    .bst-day.dragover{background:#dbeafe!important;outline:2px dashed #3b82f6;outline-offset:-2px;}
    .bst-info-cell{padding:10px 12px;background:#fafafa;border-right:2px solid #f1f5f9;display:flex;flex-direction:column;gap:3px;min-height:84px;}
    .bst-row{position:relative;border-bottom:1px solid #f1f5f9;}
    .bst-bar{position:absolute;top:8px;bottom:8px;border-radius:8px;padding:5px 8px;cursor:grab;font-size:.66rem;font-weight:700;color:white;display:flex;flex-direction:column;justify-content:center;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.15);z-index:2;transition:filter .15s, box-shadow .15s;}
    .bst-bar:hover{filter:brightness(.92);z-index:10;box-shadow:0 4px 16px rgba(0,0,0,.25);}
    .bst-bar:active{cursor:grabbing;}
    .bst-bar.a_envoyer{outline:2px dashed #f59e0b;outline-offset:-3px;}
    .bst-bar.envoye{outline:2px solid #0ea5e9;outline-offset:-3px;}
    .bst-bar.recu{outline:2px solid #22c55e;outline-offset:-3px;}
    .bst-bar.solde{opacity:.65;}
    .bst-bar .ic{font-size:.7rem;opacity:.9;margin-right:4px;}
    .bst-pending-card{background:white;border-radius:10px;padding:9px 12px;cursor:grab;min-width:200px;box-shadow:0 1px 3px rgba(0,0,0,.06);position:relative;overflow:hidden;}
    .bst-pending-card .strip{position:absolute;left:0;top:0;bottom:0;width:6px;}
  </style>
  <div style="padding:20px;max-width:1700px;margin:0 auto;">
    <!-- Barre d'outils -->
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:8px;background:white;border-radius:10px;padding:8px 12px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
        <i class="fas fa-calendar" style="color:#6366f1;font-size:.85rem;"></i>
        <input type="date" id="bstStartDate" value="${TODAY}" onchange="bstReload(this.value)" style="font-size:.85rem;font-weight:700;color:#1e293b;border:none;outline:none;background:transparent;cursor:pointer;"/>
        <button onclick="bstShiftDate(-7)" style="width:22px;height:22px;border-radius:5px;background:#f1f5f9;border:none;cursor:pointer;font-size:.8rem;" title="−7 jours">‹</button>
        <button onclick="bstShiftDate(7)"  style="width:22px;height:22px;border-radius:5px;background:#f1f5f9;border:none;cursor:pointer;font-size:.8rem;" title="+7 jours">›</button>
        <button onclick="bstShiftDate(-1)" style="width:22px;height:22px;border-radius:5px;background:#f1f5f9;border:none;cursor:pointer;font-size:.65rem;" title="−1 jour">−1j</button>
        <button onclick="bstShiftDate(1)"  style="width:22px;height:22px;border-radius:5px;background:#f1f5f9;border:none;cursor:pointer;font-size:.65rem;" title="+1 jour">+1j</button>
      </div>
      <div style="font-size:.74rem;color:#64748b;background:white;border-radius:10px;padding:8px 14px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
        Vue 21 jours · BST de 1 à 20+ jours · couleur = lot
      </div>
      <div style="flex:1;"></div>
      <div style="display:flex;align-items:center;gap:10px;font-size:.72rem;color:#64748b;background:white;border-radius:10px;padding:6px 12px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
        <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:#f59e0b;border:2px solid #f59e0b;display:inline-block;"></span>En attente d'envoi</span>
        <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:#0ea5e9;border:2px solid #0ea5e9;display:inline-block;"></span>Envoyé</span>
        <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:3px;background:#22c55e;display:inline-block;"></span>Revenu</span>
      </div>
      <button onclick="bstOpenNewModal()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border-radius:10px;font-size:.8rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 2px 8px rgba(67,56,202,.3);"><i class="fas fa-plus"></i> Nouveau BST</button>
    </div>

    <!-- KPIs synthèse -->
    <div id="bstKpis" style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px;"></div>

    <div id="bstFocusBanner" style="display:none;align-items:center;gap:10px;background:linear-gradient(135deg,#faf5ff,#eff6ff);border:1px solid #ddd6fe;border-radius:12px;padding:8px 14px;margin-bottom:12px;flex-wrap:wrap;">
      <i class="fas fa-crosshairs" style="color:#7c3aed;"></i>
      <span style="font-size:.8rem;color:#5b21b6;font-weight:700;">Focus étape <span id="bstFocusLabel" style="font-family:monospace;"></span></span>
      <span style="font-size:.72rem;color:#7c3aed;">— seuls le sous-traitant de cette étape et ceux de l'étape précédente / suivante restent affichés</span>
      <button onclick="clearFocusLotBst()" style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-size:.74rem;font-weight:700;color:#374151;background:white;border:1px solid #e2e8f0;border-radius:8px;padding:5px 12px;cursor:pointer;"><i class="fas fa-eye"></i> Tout afficher</button>
    </div>

    <!-- GOULOTTE : BDS a planifier AU-DESSUS du planning (symetrie avec le Gantt BDT) -->
    <div class="card">
      <div style="padding:12px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-inbox" style="color:#f97316;"></i>
        <span style="font-weight:700;color:#1e293b;font-size:.85rem;">BST à planifier</span>
        <span id="bstPendingCnt" style="background:#ffedd5;color:#c2410c;font-size:.65rem;font-weight:700;padding:1px 8px;border-radius:999px;">0</span>
        <span style="font-size:.7rem;color:#94a3b8;">Glisser une carte sur un jour pour planifier</span>
      </div>
      <div id="bstPendingList" style="padding:14px;display:flex;flex-wrap:wrap;gap:10px;"></div>
    </div>

    <!-- Grille principale -->
    <div class="card" style="overflow:hidden;margin-bottom:16px;">
      <div style="padding:12px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <i class="fas fa-industry" style="color:#6366f1;"></i>
        <span style="font-weight:700;color:#1e293b;font-size:.88rem;">Planning Sous-Traitance · grille jour-par-jour</span>
        <span style="font-size:.72rem;color:#64748b;">${fournForBst.length} sous-traitant${fournForBst.length!==1?'s':''} · ${bdsRowsForBst.length} BST</span>
        <div style="flex:1;"></div>
        <span style="font-size:.66rem;color:#94a3b8;"><i class="fas fa-mouse-pointer" style="margin-right:3px;"></i>Clic droit = menu · Glisser = déplacer</span>
      </div>
      <div style="overflow-x:auto;">
        <div id="bstHeader" class="bst-grid" style="background:#1e293b;color:white;font-size:.62rem;"></div>
        <div id="bstBody" style="background:white;"></div>
      </div>
    </div>


    <!-- Tooltip & menu contextuel (créés dynamiquement) -->
    <!-- Modal Nouveau BST -->
    <div id="bstNewModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
      <div style="background:white;border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:540px;margin:1rem;overflow:hidden;">
        <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#6366f1,#4338ca);">
          <h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-industry" style="margin-right:8px;"></i>Nouveau BST</h3>
          <button onclick="document.getElementById('bstNewModal').style.display='none'" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
        </div>
        <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><label class="form-label">Lot lié</label><select id="bst_lot" class="form-input"></select></div>
          <div><label class="form-label">Sous-traitant</label><select id="bst_fourn" class="form-input"></select></div>
          <div><label class="form-label">Opération ST</label><select id="bst_op" class="form-input"></select></div>
          <div><label class="form-label">Qté</label><input id="bst_qte" type="number" min="1" placeholder="50" class="form-input"/></div>
          <div><label class="form-label">Date envoi</label><input id="bst_start" type="date" value="${TODAY}" class="form-input"/></div>
          <div><label class="form-label">Durée (jours)</label><input id="bst_dur" type="number" min="1" max="60" value="5" class="form-input"/></div>
        </div>
        <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
          <button onclick="document.getElementById('bstNewModal').style.display='none'" class="btn btn-secondary">Annuler</button>
          <button onclick="bstCreate()" class="btn" style="background:linear-gradient(135deg,#6366f1,#4338ca);color:white;"><i class="fas fa-paper-plane"></i> Créer BST</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ═══ PANEL : PRÉSENCE OPÉRATEURS ══════════════════════════ -->
<div id="ppanel-presence" style="display:none;">
  <div style="padding:20px;max-width:1500px;margin:0 auto;">
    <style>.presview-pill{padding:8px 16px;border-radius:10px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:.82rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;box-shadow:0 1px 3px rgba(0,0,0,.06);}.presview-pill.active{background:linear-gradient(135deg,#0d9488,#14b8a6);color:white;border-color:transparent;}</style>
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button id="presViewBtn-grid" onclick="presView('grid')" class="presview-pill active"><i class="fas fa-calendar-week" style="margin-right:7px;"></i>Planning de présence</button>
      <button id="presViewBtn-conges" onclick="presView('conges')" class="presview-pill"><i class="fas fa-umbrella-beach" style="margin-right:7px;"></i>Demandes de congés à traiter<span id="presCongesCount" style="background:#14b8a6;color:white;border-radius:999px;padding:0 8px;font-size:.66rem;margin-left:7px;">${CONGES_OPS.length}</span></button>
    </div>
    <div id="presView-grid">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
      <div><h1 style="font-size:1.3rem;font-weight:900;color:#1e293b;margin:0;">Présence opérateurs</h1><div style="font-size:.76rem;color:#64748b;margin-top:2px;">Programmez les horaires (matin / journée / soir) par jour et par semaine · absences RH synchronisées</div></div>
      <div style="flex:1;"></div>
      <div style="display:flex;align-items:center;gap:8px;background:white;border-radius:10px;padding:6px 10px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
        <button onclick="presShiftWeek(-1)" style="width:26px;height:26px;border-radius:6px;background:#f1f5f9;border:none;cursor:pointer;">‹</button>
        <span id="presWeekLabel" style="font-size:.8rem;font-weight:700;color:#1e293b;min-width:180px;text-align:center;"></span>
        <button onclick="presShiftWeek(1)" style="width:26px;height:26px;border-radius:6px;background:#f1f5f9;border:none;cursor:pointer;">›</button>
      </div>
      <div style="display:flex;gap:2px;background:white;border-radius:10px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
        <button onclick="presSetAct('all',this)" id="pres-fa-all" class="tab-gang active">Tous</button>
        <button onclick="presSetAct('Seem',this)" id="pres-fa-Seem" class="tab-gang">Seem</button>
        <button onclick="presSetAct('Semrac',this)" id="pres-fa-Semrac" class="tab-gang">Semrac</button>
      </div>
    </div>
    <div style="display:flex;gap:14px;font-size:.7rem;color:#64748b;margin-bottom:10px;flex-wrap:wrap;align-items:center;">
      <span><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:#dbeafe;border:1px solid #93c5fd;margin-right:4px;"></span>Matin</span>
      <span><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:#dcfce7;border:1px solid #86efac;margin-right:4px;"></span>Journée</span>
      <span><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:#ede9fe;border:1px solid #c4b5fd;margin-right:4px;"></span>Soir</span>
      <span><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:#fef2f2;border:1px solid #fca5a5;margin-right:4px;"></span>Absent</span>
      <span><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:#f8fafc;border:1px solid #e2e8f0;margin-right:4px;"></span>Non programmé</span>
      <button onclick="openPresWeekModal()" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;border:none;background:linear-gradient(135deg,#f97316,#ea580c);color:white;cursor:pointer;font-size:.78rem;font-weight:700;"><i class="fas fa-calendar-week"></i>Programmer la semaine</button>
      <span style="color:#94a3b8;flex-basis:100%;"><i class="fas fa-info-circle" style="margin-right:4px;"></i>Cliquez une cellule pour faire défiler matin → journée → soir → absent → vide · ou utilisez « Programmer la semaine » pour appliquer un shift à toute la semaine</span>
    </div>
    <div class="card" style="overflow:hidden;">
      <div style="overflow-x:auto;"><div id="presGrid"></div></div>
    </div>
    </div><!-- /presView-grid -->

    <div id="presView-conges" style="display:none;">
      <div class="card" style="padding:16px 18px;border-left:4px solid #14b8a6;">
        <div style="font-weight:800;color:#0f766e;font-size:.92rem;display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
          <i class="fas fa-umbrella-beach"></i>Demandes de congés des opérateurs (Seem / Semrac) à traiter
          <span style="background:#ccfbf1;color:#0f766e;border-radius:999px;padding:1px 9px;font-size:.72rem;">${CONGES_OPS.length}</span>
        </div>
        <div style="font-size:.72rem;color:#94a3b8;margin-bottom:14px;">Approuver = pose l'absence au planning de présence + décompte les heures du solde de congés du salarié.</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${CONGES_OPS.length ? CONGES_OPS.map((cg:any) => { const heures = cg.nb_heures!=null?(cg.nb_heures+' h'):(cg.nb_jours!=null?(cg.nb_jours+' j'):'—'); return `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;color:#1e293b;font-size:.84rem;">${escX(cg.salarie_nom||cg.salarie_id||'—')} <span style="background:#ccfbf1;color:#0f766e;border-radius:999px;padding:1px 7px;font-size:.62rem;font-weight:700;">${(cg.type||'congé').replace('_',' ')}</span></div>
              <div style="font-size:.72rem;color:#64748b;">Du ${cg.date_debut||'—'} au ${cg.date_fin||'—'} · ${heures}${cg.motif?(' · '+escX(cg.motif)):''}</div>
            </div>
            <button onclick="validerCongeOp('${cg.id}','valide')" style="padding:8px 16px;background:#10b981;color:white;border:none;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i>Approuver</button>
            <button onclick="validerCongeOp('${cg.id}','refuse')" style="padding:8px 13px;background:#fee2e2;color:#b91c1c;border:none;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-times"></i></button>
          </div>`}).join('') : `<div style="text-align:center;padding:28px;color:#cbd5e1;font-size:.82rem;"><i class="fas fa-check-circle" style="display:block;font-size:1.6rem;margin-bottom:6px;"></i>Aucune demande de congé opérateur en attente.</div>`}
        </div>
      </div>
    </div>
  </div>

  <!-- Modal : Programmer la semaine entière -->
  <div id="presWeekModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:600;">
    <div style="background:white;border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:520px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#f97316,#ea580c);">
        <h3 style="font-weight:800;color:white;font-size:.98rem;margin:0;"><i class="fas fa-calendar-week" style="margin-right:8px;"></i>Programmer la semaine entière</h3>
        <button onclick="closePresWeekModal()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:22px;">
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px 14px;font-size:.78rem;color:#9a3412;margin-bottom:18px;"><i class="fas fa-info-circle" style="margin-right:5px;"></i>Choisissez un ou plusieurs opérateurs, le shift à appliquer, et la semaine cible. Les jours en absence RH ne seront pas touchés.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
          <div>
            <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Shift à appliquer *</label>
            <select id="presWkShift" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.85rem;background:#f8fafc;outline:none;">
              <option value="matin">Matin</option>
              <option value="journee">Journée</option>
              <option value="soir">Soir</option>
              <option value="absent">Absent</option>
              <option value="">Effacer (non programmé)</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Jours concernés *</label>
            <select id="presWkJours" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.85rem;background:#f8fafc;outline:none;">
              <option value="ouvres">Lun → Ven (5 jours ouvrés)</option>
              <option value="tous">Lun → Dim (7 jours)</option>
            </select>
          </div>
        </div>
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Opérateurs cibles *</label>
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <button onclick="presWkPickAll(true)" style="padding:4px 10px;border-radius:6px;border:1.5px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:.7rem;font-weight:700;color:#374151;">Tout cocher</button>
            <button onclick="presWkPickAll(false)" style="padding:4px 10px;border-radius:6px;border:1.5px solid #e2e8f0;background:#f8fafc;cursor:pointer;font-size:.7rem;font-weight:700;color:#374151;">Tout décocher</button>
            <button onclick="presWkPickAct('Seem')" style="padding:4px 10px;border-radius:6px;border:1.5px solid #93c5fd;background:#eff6ff;cursor:pointer;font-size:.7rem;font-weight:700;color:#1d4ed8;">Seem</button>
            <button onclick="presWkPickAct('Semrac')" style="padding:4px 10px;border-radius:6px;border:1.5px solid #f9a8d4;background:#fdf2f8;cursor:pointer;font-size:.7rem;font-weight:700;color:#be185d;">Semrac</button>
          </div>
          <div id="presWkOpsList" style="max-height:200px;overflow-y:auto;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px;background:#f8fafc;"></div>
        </div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="closePresWeekModal()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;font-size:.83rem;">Annuler</button>
        <button onclick="applyPresWeek()" style="padding:9px 22px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.83rem;"><i class="fas fa-check" style="margin-right:5px;"></i>Appliquer à la semaine</button>
      </div>
    </div>
  </div>
</div>

<!-- ═══ PANEL 3 : COMMANDES & LOTS (sous-onglets) ═════════════ -->
<div id="ppanel-commandes" style="display:none;">
  <div style="padding:24px;margin:0 auto;">
    <div style="display:inline-flex;background:#f1f5f9;border-radius:11px;padding:3px;gap:2px;margin-bottom:18px;">
      <button id="subBtn-commandes" onclick="showCmdSub('commandes')" style="display:inline-flex;align-items:center;gap:7px;border:none;cursor:pointer;border-radius:9px;padding:8px 16px;font-size:.8rem;font-weight:700;background:#fff;color:#ea580c;box-shadow:0 1px 3px rgba(0,0,0,.12);transition:all .12s;">
        <i class="fas fa-clipboard-list"></i> Commandes <span style="background:#ffedd5;color:#c2410c;font-size:.64rem;padding:1px 7px;border-radius:999px;">${CMDS.length}</span>
      </button>
      <button id="subBtn-lots" onclick="showCmdSub('lots')" style="display:inline-flex;align-items:center;gap:7px;border:none;cursor:pointer;border-radius:9px;padding:8px 16px;font-size:.8rem;font-weight:700;background:transparent;color:#64748b;transition:all .12s;">
        <i class="fas fa-layer-group"></i> Lots <span style="background:#e2e8f0;color:#475569;font-size:.64rem;padding:1px 7px;border-radius:999px;">${LOTS.length}</span>
      </button>
    </div>

    <div id="subview-commandes">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div><h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">Commandes en cours</h1><div style="font-size:.78rem;color:#64748b;margin-top:2px;">${CMDS.length} commande${CMDS.length!==1?'s':''} · cliquez une ligne pour ouvrir le détail</div></div>
        ${prodSearchBar('tbl-cmds-prod',[['num','N° affaire'],['client','Client'],['statut','Statut'],['activite','Activité']])}
      </div>
      <div class="card" style="overflow:hidden;">
        <table id="tbl-cmds-prod" style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f8fafc;">${TH('N° CMD / Affaire')}${TH('Client')}${TH('Pièces')}${TH('Montant')}${TH('Date cmd')}${TH('Livraison')}${TH('Statut')}${TH('Avancement BDT')}${TH('ST')}</tr></thead>
          <tbody>${cmdTableRows||'<tr><td colspan="9" style="text-align:center;padding:40px;color:#94a3b8;">Aucune commande en cours.</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <div id="subview-lots" style="display:none;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div><h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">Lots en cours</h1><div style="font-size:.78rem;color:#64748b;margin-top:2px;">${LOTS.length} lot${LOTS.length!==1?'s':''} · cliquez une ligne pour ouvrir les étapes de production</div></div>
        ${prodSearchBar('tbl-lots-prod',[['id','Réf. lot'],['client','Client'],['piece','Pièce'],['statut','Statut']])}
      </div>
      <div class="card" style="overflow:hidden;">
        <table id="tbl-lots-prod" style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f8fafc;">${TH('Réf. Lot')}${TH('Client')}${TH('Pièce')}${TH('Qté')}${TH('Début')}${TH('Fin')}${TH('Statut')}${TH('Avancement')}${TH('Commande')}</tr></thead>
          <tbody>${lotTableRows||'<tr><td colspan="9" style="text-align:center;padding:40px;color:#94a3b8;">Aucun lot en cours.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- ═══ PANEL 5 : DASHBOARD PROGRAMMATION ════════════════════ -->
<div id="ppanel-dash-prog" style="display:none;">
  <div style="padding:24px;margin:0 auto;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div><h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">Dashboard Programmation</h1><div style="font-size:.78rem;color:#64748b;margin-top:2px;">Charge opérateurs & machines · Suivi journalier et hebdomadaire</div></div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button onclick="shiftWeek(-1)" style="padding:6px 12px;border-radius:8px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;font-size:.8rem;">‹</button>
        <input type="date" id="dashDate" value="${TODAY}" onchange="updateDashDay(this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.82rem;font-weight:700;color:#1e293b;background:white;outline:none;cursor:pointer;"/>
        <button onclick="shiftWeek(1)"  style="padding:6px 12px;border-radius:8px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;font-size:.8rem;">›</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
      ${kpiCard('fa-clipboard-list','#3b82f6',cmdsEnCours.length,'Commandes en cours',`${CMDS.filter(c=>c.retard).length} en retard`)}
      ${kpiCard('fa-layer-group','#f97316',lotsEnCours.length,'Lots en cours',`${LOTS.filter(l=>l.statut==='bloqué').length} bloqués`)}
      ${kpiCard('fa-hard-hat','#22c55e',bdtsJour.length,'BDT actifs',`${BDT_DEFAULT.filter(b=>b.statut==='recu').length} en cours`)}
      ${kpiCard('fa-chart-bar','#8b5cf6',txCharge+'%','Charge journée',`${totalCharge.toFixed(1)}h / ${capaTot}h cap.`)}
    </div>
    <div class="card" style="padding:20px;margin-bottom:20px;">
      <div style="font-weight:700;color:#1e293b;font-size:.88rem;margin-bottom:16px;display:flex;align-items:center;gap:8px;"><i class="fas fa-chart-bar" style="color:#f97316;"></i> Charge opérateurs par jour</div>
      <div style="display:flex;align-items:flex-end;gap:12px;height:120px;">
        ${WEEK_DAYS.map((d,i)=>{
          const load=weekLoad[i]; const isToday=i===new Date(TODAY).getDay()-1
          const color=load>=85?'#ef4444':load>=70?'#f59e0b':'#22c55e'
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;"><div style="font-size:.68rem;font-weight:700;color:${color};">${load}%</div><div style="width:100%;background:${color};border-radius:6px 6px 0 0;height:${load}%;min-height:4px;${isToday?'box-shadow:0 0 0 2px #1e293b;':''}"></div><div style="font-size:.68rem;color:${isToday?'#1e293b':'#94a3b8'};font-weight:${isToday?'700':'400'};">${d}</div></div>`
        }).join('')}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="card" style="overflow:hidden;"><div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#1e293b;font-size:.85rem;"><i class="fas fa-layer-group" style="color:#f97316;margin-right:6px;"></i>Lots en cours · Étape de production</div><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;">${TH('Lot')}${TH('Client')}${TH('Pièce')}${TH('Étape')}${TH('Fin prévu')}</tr></thead><tbody>${lotRowsProg||'<tr><td colspan="5" style="text-align:center;padding:24px;color:#94a3b8;">Aucun lot.</td></tr>'}</tbody></table></div>
      <div class="card" style="overflow:hidden;"><div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#1e293b;font-size:.85rem;"><i class="fas fa-clipboard-list" style="color:#3b82f6;margin-right:6px;"></i>Commandes · Avancement</div><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;">${TH('N° CMD')}${TH('Client')}${TH('Livraison')}${TH('Avancement')}${TH('Statut')}</tr></thead><tbody>${cmdRowsProg||'<tr><td colspan="5" style="text-align:center;padding:24px;color:#94a3b8;">Aucune commande.</td></tr>'}</tbody></table></div>
    </div>
  </div>
</div>

<!-- ═══ PANEL 6 : DASHBOARD PRODUCTION ═══════════════════════ -->
<div id="ppanel-dash-prod" style="display:none;">
  <div style="padding:24px;margin:0 auto;">
    <div style="margin-bottom:20px;"><h1 style="font-size:1.35rem;font-weight:900;color:#1e293b;margin:0;">Dashboard Production</h1><div style="font-size:.78rem;color:#64748b;margin-top:2px;">OPEX machines · TRS/TRG/TRE · BDTs du jour · Exercice ${new Date().getFullYear()}</div></div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:24px;">
      ${gauge2('TRS',trsData.trs,'#22c55e','Taux de Rendement Synthétique')}
      ${gauge2('TRG',trsData.trg,'#3b82f6','Taux de Rendement Global')}
      ${gauge2('TRE',trsData.tre,'#8b5cf6','Taux de Rendement Économique')}
      <div class="card" style="padding:16px;grid-column:span 3;">
        <div style="font-weight:700;color:#1e293b;font-size:.85rem;margin-bottom:12px;"><i class="fas fa-sliders-h" style="color:#f97316;margin-right:6px;"></i>Composantes TRS</div>
        ${[['Disponibilité',trsData.disponibilite,'#3b82f6','Temps ouverture vs pannes/arrêts'],['Performance',trsData.performance,'#f59e0b','Cadence réelle vs théorique'],['Qualité',trsData.qualite,'#22c55e','Pièces conformes vs total produites']].map(([label,val,color,desc])=>`<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-size:.75rem;font-weight:700;color:#374151;">${label}</span><span style="font-size:.75rem;font-weight:700;color:${color};">${val}%</span></div><div style="height:8px;background:#e2e8f0;border-radius:4px;"><div style="height:100%;width:${val}%;background:${color};border-radius:4px;"></div></div><div style="font-size:.62rem;color:#94a3b8;margin-top:2px;">${desc}</div></div>`).join('')}
      </div>
    </div>
    <div class="card" style="overflow:hidden;margin-bottom:20px;">
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;"><div style="font-weight:700;color:#1e293b;font-size:.88rem;display:flex;align-items:center;gap:8px;"><i class="fas fa-euro-sign" style="color:#f59e0b;"></i>OPEX Machines · YTD ${new Date().getFullYear()} (${joursOuvres} jours ouvrés)</div><div style="font-size:.88rem;font-weight:900;color:#1e293b;">${totalOpex.toLocaleString('fr-FR')} € total</div></div>
      <table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;">${TH('Machine')}${TH('Code')}${TH('Taux/h')}${TH('Utilisation')}${TH('OPEX YTD')}</tr></thead><tbody>${opexRows2}</tbody></table>
    </div>
    <div class="card" style="overflow:hidden;">
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;"><div style="font-weight:700;color:#1e293b;font-size:.88rem;display:flex;align-items:center;gap:8px;"><i class="fas fa-hard-hat" style="color:#f97316;"></i>BDTs du jour — ${TODAY}</div><span style="font-size:.72rem;color:#64748b;">${bdtsToday2.length} BDT actifs · Double-cliquez pour dupliquer et réaffecter</span></div>
      <table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;">${TH('BDT')}${TH('Client')}${TH('Pièce')}${TH('Opération')}${TH('Priorité')}${TH('Statut')}${TH('Durée')}${TH('Actions')}</tr></thead><tbody>${bdtRowsDProd||'<tr><td colspan="8" style="text-align:center;padding:32px;color:#94a3b8;">Aucun BDT actif.</td></tr>'}</tbody></table>
    </div>
  </div>
  <!-- Modal duplication -->
  <div id="dupModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
    <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:480px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#f97316,#ea580c);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-copy" style="margin-right:8px;"></i>Dupliquer le BDT</h3><button onclick="document.getElementById('dupModal').style.display='none'" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;"><div id="dupInfo" style="background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:14px;font-size:.82rem;"></div><div><label class="form-label">Réaffecter à l'opérateur</label><select id="dupOp" class="form-input">${opsForModal2.map(o=>`<option value="${o.id}">${escX(o.nom)} (${o.activite} · ${o.shift})</option>`).join('')}</select></div><div style="margin-top:10px;"><label class="form-label">Heure de début</label><input id="dupDebut" type="time" value="06:00" class="form-input"/></div></div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="document.getElementById('dupModal').style.display='none'" class="btn btn-secondary">Annuler</button><button onclick="confirmDup()" class="btn btn-primary"><i class="fas fa-copy"></i> Dupliquer & Affecter</button></div>
    </div>
  </div>

  <!-- Modal fractionnement : séparer un BDT long en morceaux (par temps) -->
  <div id="splitModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
    <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:520px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-scissors" style="margin-right:8px;"></i>Séparer le BDT en morceaux</h3><button onclick="document.getElementById('splitModal').style.display='none'" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;">
        <div id="splitInfo" style="background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:14px;font-size:.82rem;"></div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
          <label class="form-label" style="margin:0;">Nombre de morceaux</label>
          <input id="splitN" type="number" min="2" max="12" value="2" oninput="splitRender(true)" style="width:80px;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 9px;font-size:.85rem;text-align:center;"/>
          <button type="button" onclick="splitRender(true)" style="font-size:.72rem;font-weight:700;color:#7c3aed;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:5px 10px;cursor:pointer;">Répartir également</button>
        </div>
        <div id="splitParts" style="display:grid;gap:8px;"></div>
        <div id="splitTotal" style="margin-top:10px;font-size:.78rem;"></div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="document.getElementById('splitModal').style.display='none'" class="btn btn-secondary">Annuler</button><button id="splitConfirmBtn" onclick="splitSave()" class="btn btn-primary" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><i class="fas fa-scissors"></i> Séparer</button></div>
    </div>
  </div>
</div>

<!-- ═══ PANEL 7 : MACHINES ATELIER ═══════════════════════════ -->
<div id="ppanel-machines" style="display:none;">
  <div style="padding:24px;margin:0 auto;">
    <div style="margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <div>
        <h1 style="font-size:1.2rem;font-weight:900;color:#1e293b;margin:0;"><i class="fas fa-sitemap" style="color:#f97316;margin-right:10px;"></i>Process Ateliers</h1>
        <div style="font-size:.78rem;color:#64748b;margin-top:2px;">Postes de travail · machines &amp; process regroupés · Seem &amp; Semrac · Coûts machines OPEX — ${new Date().getFullYear()}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <span style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:8px;padding:6px 14px;font-size:.75rem;font-weight:700;"><i class="fas fa-euro-sign" style="margin-right:5px;"></i>Coût total parc : ${MACH_REAL.reduce((s: number, m: any) => s + (Number(m.cout_h ?? m.taux_horaire ?? 0) || 0), 0).toLocaleString('fr-FR')} €/h</span>
      </div>
    </div>

    <!-- KPIs synthèse -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${[
        ['fa-cogs',        'Machines actives',    String(MACH_REAL.filter((m: any) => m.statut === 'operationnel' || m.statut === 'actif').length) + ' / ' + MACH_REAL.length, '#10b981'],
        ['fa-wrench',      'En maintenance',      String(MACH_REAL.filter((m: any) => m.statut === 'maintenance').length), '#f59e0b'],
        ['fa-times-circle','Arrêtées',            String(MACH_REAL.filter((m: any) => m.statut === 'arret').length), '#ef4444'],
        ['fa-euro-sign',   'OPEX annuel estimé',  (MACH_REAL.reduce((s: number, m: any) => s + (Number(m.cout_h ?? m.taux_horaire ?? 0) || 0) * (Number(m.capacite_h ?? 8) || 8) * 220, 0)).toLocaleString('fr-FR') + ' €', '#6366f1'],
      ].map(([ic, lbl, val, col]) => `
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${col};text-align:center;">
        <i class="fas ${ic}" style="color:${col};font-size:1.2rem;margin-bottom:8px;display:block;"></i>
        <div style="font-size:1.4rem;font-weight:800;color:${col};">${val}</div>
        <div style="font-size:.7rem;color:#6b7280;font-weight:600;margin-top:3px;">${lbl}</div>
      </div>`).join('')}
    </div>

    <!-- Bascule de volets : Postes & Process (défaut) | Machines -->
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button id="volbtn-pp" onclick="volShow('pp')" style="padding:8px 18px;border-radius:9px;border:none;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;cursor:pointer;font-size:.82rem;font-weight:700;"><i class="fas fa-object-group" style="margin-right:6px;"></i>Postes &amp; Process</button>
      <button id="volbtn-mach" onclick="volShow('mach')" style="padding:8px 18px;border-radius:9px;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;font-size:.82rem;font-weight:700;"><i class="fas fa-cogs" style="margin-right:6px;color:#f97316;"></i>Machines</button>
    </div>

    <!-- VOLET « Postes & Process » (affiché par défaut) -->
    <div id="vol-pp">
    <!-- (Référentiel des process à plat retiré : les process se créent et se gèrent DANS les postes ci-dessous ;
         les process non rattachés apparaissent dans le bac « À rattacher » sous la liste, à glisser sur un poste.) -->

    <!-- Postes de travail : regroupent machines + process ; OPEX agrégé par poste (repris en Maintenance) -->
    <div class="card" style="overflow:hidden;margin-bottom:20px;">
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#1e293b;font-size:.88rem;display:flex;align-items:center;justify-content:space-between;">
        <span><i class="fas fa-object-group" style="color:#8b5cf6;margin-right:7px;"></i>Postes de travail — machines + process regroupés · OPEX par poste</span>
        <button onclick="openPosteModal()" style="padding:5px 14px;border-radius:6px;border:none;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;cursor:pointer;font-size:.72rem;font-weight:700;"><i class="fas fa-plus" style="margin-right:5px;"></i>Nouveau poste</button>
      </div>
      ${POSTES.length === 0 ? `<div style="padding:22px;text-align:center;color:#94a3b8;font-size:.8rem;line-height:1.6;">Aucun poste défini. Cliquez « Nouveau poste » pour regrouper machines &amp; process.<br><span style="font-size:.72rem;">Si la création renvoie « table postes absente », exécutez d'abord <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">scripts_import/postes_schema.sql</code> dans Supabase.</span></div>` : `
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="postes-table">
        <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
          <th style="text-align:left;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Poste</th>
          <th style="text-align:left;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Code</th>
          <th style="text-align:left;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Activité</th>
          <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Machines</th>
          <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Process</th>
          <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#16a34a;">OPEX réel (YTD)</th>
          <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">OPEX théorique/an</th>
          <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#0d9488;" title="Taux horaire qui alimente le CRU des pièces : base + achats machine reçus / heures budgétées (ou override manuel)">Taux/h effectif</th>
          <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Actions</th>
        </tr></thead>
        <tbody id="poste-tbody">${POSTES.map((p:any) => {
          const ox = posteOpex[String(p.id)] || { reel: 0, theorique: 0, machines: [] }
          const nbM = machCountByPoste[String(p.id)] || 0, nbP = procCountByPoste[String(p.id)] || 0
          const dm = machListByPoste[String(p.id)] || [], dp = procListByPoste[String(p.id)] || []
          const canExpand = (dm.length + dp.length) > 0
          const pr = POSTE_RATES.byPoste[String(p.id)] || null
          const tauxEff = pr ? pr.tauxEffectif : 0
          const tauxManuel = pr && pr.manuel != null
          const tauxIncr = pr ? pr.increment : 0
          const autoTaux = pr ? (pr.baseWeighted + pr.increment) : 0
          return `<tr data-poid="${p.id}" draggable="true" ondragstart="rowDragStart(event,'${p.id}','poste')" ondragover="rowDragOver(event)" ondrop="rowDrop(event,'${p.id}','poste')" ondragend="rowDragEnd(event)" style="border-bottom:1px solid #f9fafb;cursor:move;">
            <td style="padding:10px 14px;font-weight:700;color:#1e293b;"><i class="fas fa-grip-vertical" style="color:#cbd5e1;margin-right:6px;cursor:grab;" title="Glisser pour réordonner les postes"></i>${canExpand ? `<button id="postexp-${p.id}" onclick="postToggleDet('${p.id}')" title="Voir process & machines du poste" style="border:none;background:none;cursor:pointer;color:#94a3b8;margin-right:5px;font-size:.78rem;"><i class="fas fa-chevron-right"></i></button>` : '<span style="display:inline-block;width:15px;"></span>'}<span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${p.couleur};margin-right:7px;"></span>${escX(p.nom)}</td>
            <td style="padding:10px 14px;font-family:monospace;font-size:.75rem;color:#6b7280;">${escX(p.code||'—')}</td>
            <td style="padding:10px 14px;"><span style="background:${p.activite==='Seem'?'#dbeafe':p.activite==='Semrac'?'#fce7f3':p.activite==='OAS'?'#ccfbf1':'#f3e8ff'};color:${p.activite==='Seem'?'#1d4ed8':p.activite==='Semrac'?'#be185d':p.activite==='OAS'?'#0f766e':'#5b21b6'};border-radius:6px;padding:2px 8px;font-size:.7rem;font-weight:700;">${p.activite||'—'}</span>${p.activite==='OAS'?' <span title="Hors planning — alimente les bains OAS" style="font-size:.58rem;color:#0f766e;"><i class="fas fa-flask"></i></span>':''}</td>
            <td style="padding:10px 14px;text-align:center;font-weight:700;color:${nbM>0?'#0ea5e9':'#cbd5e1'};">${nbM||'—'}</td>
            <td style="padding:10px 14px;text-align:center;font-weight:700;color:${nbP>0?'#8b5cf6':'#cbd5e1'};">${nbP||'—'}</td>
            <td style="padding:10px 14px;text-align:center;font-weight:800;color:${ox.reel>0?'#16a34a':'#cbd5e1'};">${ox.reel>0?fmtEur(ox.reel):'—'}</td>
            <td style="padding:10px 14px;text-align:center;font-weight:600;color:#94a3b8;">${ox.theorique>0?Math.round(ox.theorique).toLocaleString('fr-FR')+' €':'—'}</td>
            <td style="padding:10px 14px;text-align:center;white-space:nowrap;">
              ${nbM>0?`<span style="font-weight:800;color:${tauxManuel?'#b45309':(tauxIncr>0?'#0d9488':'#475569')};">${tauxEff.toFixed(2)} €/h</span>${tauxManuel?`<div style="font-size:.56rem;color:#b45309;font-weight:700;">manuel</div>`:(tauxIncr>0?`<div style="font-size:.56rem;color:#0d9488;font-weight:700;">dont +${tauxIncr.toFixed(2)} achats</div>`:'')}`:'<span style="color:#cbd5e1;">—</span>'}
            </td>
            <td style="padding:10px 14px;text-align:center;white-space:nowrap;">
              <button onclick="openProcModalForPoste('${p.id}')" title="Créer un process dans ce poste" style="background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.68rem;font-weight:700;margin-right:8px;"><i class="fas fa-plus" style="margin-right:3px;"></i>Process</button>
              <button onclick="posteSetTaux('${p.id}', ${autoTaux.toFixed(4)}, ${tauxManuel?pr.manuel:'null'})" title="Fixer / réinitialiser le taux horaire manuel du poste (override)" style="background:${tauxManuel?'#fffbeb':'#ecfeff'};color:${tauxManuel?'#b45309':'#0d9488'};border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:.7rem;font-weight:700;margin-right:4px;"><i class="fas fa-hand-holding-usd"></i></button>
              <button onclick="openPosteEdit('${p.id}')" title="Modifier" style="background:#f5f3ff;color:#7c3aed;border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:.7rem;font-weight:700;margin-right:4px;"><i class="fas fa-edit"></i></button>
              <button onclick="deletePosteFn('${p.id}','${(p.nom||'').replace(/[<>"'\\]/g,'')}')" title="Supprimer" style="background:#fef2f2;color:#dc2626;border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:.7rem;font-weight:700;"><i class="fas fa-trash"></i></button>
            </td>
          </tr>${canExpand ? `<tr id="postdet-${p.id}" style="display:none;background:#faf9ff;"><td colspan="9" style="padding:2px 14px 12px 42px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;padding-top:6px;">
              <div><div style="font-size:.62rem;font-weight:800;text-transform:uppercase;color:#8b5cf6;margin-bottom:5px;"><i class="fas fa-sitemap" style="margin-right:4px;"></i>Process (${dp.length})</div>${dp.length ? dp.map((x:any)=>`<div style="display:flex;align-items:center;gap:6px;font-size:.74rem;color:#374151;padding:3px 0;border-bottom:1px solid #f1f5f9;"><span style="font-weight:600;">${escX(x.nom)}</span><span style="font-size:.6rem;background:#ede9fe;color:#6d28d9;border-radius:5px;padding:1px 6px;">${procType(x)}</span>${x.machine_id && machNameById[x.machine_id] ? `<span style="font-size:.6rem;background:#e0f2fe;color:#0369a1;border-radius:5px;padding:1px 6px;" title="Machine rattachée à ce process"><i class="fas fa-cog" style="margin-right:3px;"></i>${escX(machNameById[x.machine_id])}</span>` : (x.requiert_machine ? '<span style="font-size:.58rem;color:#f59e0b;font-weight:700;" title="Ce process nécessite une machine — aucune rattachée"><i class="fas fa-triangle-exclamation" style="margin-right:2px;"></i>machine à rattacher</span>' : '')}<button onclick="openProcEdit('${x.id}')" title="Modifier ce process (nom, taux horaire, machine, poste)" style="margin-left:auto;background:#eef2ff;color:#4f46e5;border:none;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:.66rem;font-weight:700;"><i class="fas fa-pen"></i></button><button onclick="deleteProc('${x.id}','${(x.nom||'').replace(/[<>"'\\]/g,'')}')" title="Supprimer ce process" style="background:#fef2f2;color:#dc2626;border:none;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:.66rem;font-weight:700;"><i class="fas fa-trash"></i></button></div>`).join('') : '<div style="font-size:.7rem;color:#cbd5e1;">Aucun process rattaché</div>'}</div>
              <div><div style="font-size:.62rem;font-weight:800;text-transform:uppercase;color:#0ea5e9;margin-bottom:5px;"><i class="fas fa-cogs" style="margin-right:4px;"></i>Machines (${dm.length})</div>${dm.length ? dm.map((x:any)=>`<div style="font-size:.74rem;color:#374151;padding:3px 0;border-bottom:1px solid #f1f5f9;"><span style="font-weight:600;">${escX(x.nom)}</span>${x.cnc?' <span style="font-size:.58rem;background:#e0f2fe;color:#0369a1;border-radius:5px;padding:1px 6px;font-weight:700;">CNC</span>':''}<span style="float:right;color:${machOpex[String(x.id)]?'#16a34a':'#cbd5e1'};font-weight:700;">${machOpex[String(x.id)]?fmtEur(machOpex[String(x.id)].total):'—'}</span></div>`).join('') : '<div style="font-size:.7rem;color:#cbd5e1;">Aucune machine rattachée</div>'}</div>
            </div></td></tr>` : ''}`
        }).join('')}</tbody>
        <tfoot><tr style="background:#faf5ff;border-top:2px solid #ede9fe;">
          <td colspan="5" style="padding:10px 14px;font-weight:800;color:#7c3aed;">TOTAL POSTES</td>
          <td style="padding:10px 14px;text-align:center;font-weight:800;color:#16a34a;">${fmtEur(Object.values(posteOpex).reduce((s:number,o:any)=>s+o.reel,0))}</td>
          <td style="padding:10px 14px;text-align:center;font-weight:800;color:#7c3aed;">${Math.round(Object.values(posteOpex).reduce((s:number,o:any)=>s+o.theorique,0)).toLocaleString('fr-FR')} €</td>
          <td></td>
          <td></td>
        </tr></tfoot>
      </table></div>`}
      <div style="padding:10px 18px;border-top:1px solid #f1f5f9;font-size:.7rem;color:#64748b;">
        <i class="fas fa-bolt" style="color:#8b5cf6;margin-right:5px;"></i><strong>OPEX poste</strong> = somme de l'OPEX de ses machines (consommables réels + théorique coût/h × capacité) + consommables tirés directement au poste (postes manuels). Ce calcul est repris à l'identique en Maintenance.<br><i class="fas fa-hand-holding-usd" style="color:#0d9488;margin-right:5px;"></i><strong>Taux/h effectif</strong> = base (moyenne pondérée coût/h des machines) + <strong>achats machine reçus</strong> de l'année / heures budgétées (Σ capacité × 220 j). C'est ce taux qui alimente le <strong>CRU</strong> des pièces usinées au poste. Le bouton <i class="fas fa-hand-holding-usd" style="color:#0d9488;"></i> fixe un <strong>taux manuel</strong> (override, avec confirmation) qui prime en absolu.
      </div>
    </div>


    </div><!-- /vol-pp -->

    <!-- VOLET « Machines » -->
    <div id="vol-mach" style="display:none;">
    <!-- Liste machines -->
    <div class="card" style="overflow:hidden;margin-bottom:20px;">
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#1e293b;font-size:.88rem;display:flex;align-items:center;justify-content:space-between;">
        <span><i class="fas fa-table" style="color:#f97316;margin-right:7px;"></i>Parc machines — Détail coûts & OPEX</span>
        <div style="display:flex;gap:6px;align-items:center;">
          <button onclick="mach_filter('all',this)" id="mf-all" style="padding:5px 12px;border-radius:6px;border:1.5px solid #f97316;background:#f97316;color:white;cursor:pointer;font-size:.72rem;font-weight:700;">Tous</button>
          <button onclick="mach_filter('Seem',this)" id="mf-seem" style="padding:5px 12px;border-radius:6px;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;font-size:.72rem;font-weight:600;">SEEM</button>
          <button onclick="mach_filter('Semrac',this)" id="mf-semrac" style="padding:5px 12px;border-radius:6px;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;font-size:.72rem;font-weight:600;">SEMRAC</button>
          <button onclick="mach_filter('OAS',this)" id="mf-oas" style="padding:5px 12px;border-radius:6px;border:1.5px solid #e2e8f0;background:white;color:#374151;cursor:pointer;font-size:.72rem;font-weight:600;">OAS</button>
          <button onclick="openMachineModal()" style="padding:5px 14px;border-radius:6px;border:none;background:linear-gradient(135deg,#f97316,#ea580c);color:white;cursor:pointer;font-size:.72rem;font-weight:700;"><i class="fas fa-plus" style="margin-right:5px;"></i>Nouvelle machine</button>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="mach-table">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Machine</th>
            <th style="text-align:left;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Code</th>
            <th style="text-align:left;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Activité</th>
            <th style="text-align:left;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Catégorie</th>
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Taux/h</th>
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Capa./j</th>
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">OPEX théorique/an</th>
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#16a34a;">OPEX réel conso. (YTD)</th>
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Postes</th>
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Statut</th>
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Actions</th>
          </tr></thead>
          <tbody id="mach-tbody">
            ${MACH_REAL.length === 0 ? '<tr><td colspan="11" style="text-align:center;padding:28px;color:#94a3b8;">Aucune machine. Cliquez sur « Nouvelle machine ».</td></tr>' : MACH_REAL.map((m: any) => {
              const coutH = m.cout_h ?? m.taux_horaire ?? 35
              const opexAnnuel = coutH * (m.capacite_h ?? 8) * 220
              const op = machOpex[String(m.id)]
              const opexReel = op ? op.total : 0
              const nbPostes = op ? Object.keys(op.postes).length : 0
              const st = m.statut === 'operationnel' || m.statut === 'actif'
              const statutStyle = st ? 'background:#dcfce7;color:#16a34a;' : m.statut === 'maintenance' ? 'background:#fef9c3;color:#854d0e;' : 'background:#fee2e2;color:#b91c1c;'
              const statutTxt = st ? '✔ Opérationnel' : m.statut === 'maintenance' ? '⚙ Maintenance' : '✖ Arrêt'
              return `<tr data-act="${m.activite}" data-mid="${m.id}" draggable="true" ondragstart="rowDragStart(event,'${m.id}','mach')" ondragover="rowDragOver(event)" ondrop="rowDrop(event,'${m.id}','mach')" ondragend="rowDragEnd(event)" style="border-bottom:1px solid #f9fafb;cursor:move;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                <td style="padding:10px 14px;font-weight:700;color:#1e293b;"><i class="fas fa-grip-vertical" style="color:#cbd5e1;margin-right:7px;cursor:grab;" title="Glisser pour réordonner"></i>${escX(m.nom)}</td>
                <td style="padding:10px 14px;font-family:monospace;font-size:.75rem;color:#6b7280;">${escX(m.code ?? '—')}</td>
                <td style="padding:10px 14px;"><span style="background:${m.activite==='Seem'?'#dbeafe':m.activite==='Semrac'?'#fce7f3':m.activite==='OAS'?'#ccfbf1':'#f3e8ff'};color:${m.activite==='Seem'?'#1d4ed8':m.activite==='Semrac'?'#be185d':m.activite==='OAS'?'#0f766e':'#5b21b6'};border-radius:6px;padding:2px 8px;font-size:.7rem;font-weight:700;">${m.activite}</span>${m.activite==='OAS'?' <span title="Traitement de surface — hors planning" style="font-size:.58rem;color:#0f766e;"><i class="fas fa-flask"></i></span>':''}</td>
                <td style="padding:10px 14px;font-size:.78rem;color:#374151;">${escX(m.categorie ?? '—')}</td>
                <td style="padding:10px 14px;text-align:center;font-weight:700;color:#1e293b;">${coutH} €/h</td>
                <td style="padding:10px 14px;text-align:center;color:#6b7280;">${m.capacite_h ?? 8} h</td>
                <td style="padding:10px 14px;text-align:center;font-weight:600;color:#94a3b8;">${opexAnnuel.toLocaleString('fr-FR')} €</td>
                <td style="padding:10px 14px;text-align:center;font-weight:800;color:${opexReel>0?'#16a34a':'#cbd5e1'};">${opexReel>0?fmtEur(opexReel):'—'}</td>
                <td style="padding:10px 14px;text-align:center;">${nbPostes>0?`<button onclick="machShowPostes('${m.id}')" style="background:#ecfdf5;color:#16a34a;border:1px solid #a7f3d0;border-radius:6px;padding:3px 9px;cursor:pointer;font-size:.68rem;font-weight:700;">${nbPostes} poste${nbPostes>1?'s':''}</button>`:'<span style="color:#cbd5e1;font-size:.72rem;">—</span>'}</td>
                <td style="padding:10px 14px;text-align:center;"><span style="border-radius:999px;padding:3px 10px;font-size:.68rem;font-weight:700;${statutStyle}">${statutTxt}</span></td>
                <td style="padding:10px 14px;text-align:center;white-space:nowrap;">
                  ${st
                    ? `<button onclick="machDeclarerPanne('${m.id}','${(m.nom||'').replace(/'/g,'')}')" title="Déclarer la machine en panne (→ Service Maintenance)" style="background:#fff7ed;color:#c2410c;border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:.7rem;font-weight:700;margin-right:4px;"><i class="fas fa-triangle-exclamation"></i> Panne</button>`
                    : `<button onclick="machReparer('${m.id}','${(m.nom||'').replace(/'/g,'')}')" title="Remettre la machine en service" style="background:#ecfdf5;color:#16a34a;border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:.7rem;font-weight:700;margin-right:4px;"><i class="fas fa-rotate-left"></i> Réparée</button>`}
                  <button onclick="editMachine('${m.id}')" title="Modifier" style="background:#eff6ff;color:#2563eb;border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:.7rem;font-weight:700;margin-right:4px;"><i class="fas fa-edit"></i></button>
                  <button onclick="deleteMachineFn('${m.id}','${(m.nom||'').replace(/'/g,'')}')" title="Supprimer" style="background:#fef2f2;color:#dc2626;border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:.7rem;font-weight:700;"><i class="fas fa-trash"></i></button>
                </td>
              </tr>`
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background:#fff7ed;border-top:2px solid #fed7aa;">
              <td colspan="6" style="padding:10px 14px;font-weight:800;color:#c2410c;">TOTAL PARC</td>
              <td style="padding:10px 14px;text-align:center;font-weight:800;color:#c2410c;">${MACH_REAL.reduce((s: number, m: any) => s + (m.cout_h ?? m.taux_horaire ?? 35) * (m.capacite_h ?? 8) * 220, 0).toLocaleString('fr-FR')} €/an</td>
              <td style="padding:10px 14px;text-align:center;font-weight:800;color:#16a34a;">${fmtEur(opexTotalReel)}</td>
              <td colspan="3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div style="padding:10px 18px;border-top:1px solid #f1f5f9;font-size:.7rem;color:#64748b;">
        <i class="fas fa-bolt" style="color:#16a34a;margin-right:5px;"></i><strong>OPEX réel</strong> = somme des sorties stock de type « consommable » déclarées sur les BDT de la machine (qté × prix d'achat HT). Calculé en temps réel à partir des mouvements de stock.
      </div>
    </div>

    <!-- Postes de dépenses par machine (détail OPEX consommables) -->
    <div id="machPostesPanel" style="display:none;" class="card">
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#1e293b;font-size:.88rem;display:flex;align-items:center;justify-content:space-between;">
        <span><i class="fas fa-receipt" style="color:#16a34a;margin-right:7px;"></i>Postes de dépenses — <span id="machPostesNom"></span></span>
        <button onclick="document.getElementById('machPostesPanel').style.display='none'" style="background:#f1f5f9;border:none;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:.72rem;font-weight:700;color:#475569;">Fermer</button>
      </div>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;">
        <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
          <th style="text-align:left;padding:9px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Consommable</th>
          <th style="text-align:center;padding:9px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Qté consommée</th>
          <th style="text-align:right;padding:9px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Coût OPEX</th>
        </tr></thead>
        <tbody id="machPostesBody"></tbody>
      </table></div>
    </div>

    <!-- Évolution OPEX graphique simplifié -->
    <div class="card" style="padding:20px;">
      <div style="font-weight:700;color:#1e293b;font-size:.88rem;margin-bottom:16px;"><i class="fas fa-chart-line" style="color:#f97316;margin-right:7px;"></i>Évolution OPEX mensuel (12 derniers mois)</div>
      <div style="display:flex;align-items:flex-end;gap:8px;height:100px;">
        ${[38200,39100,37800,40500,39800,41200,40100,42300,41800,43100,42600,44200].map((v, i) => {
          const months = ['Juin','Jul','Aoû','Sep','Oct','Nov','Déc','Jan','Fév','Mar','Avr','Mai']
          const h = Math.round((v / 44200) * 100)
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
            <div style="font-size:.62rem;color:#94a3b8;font-weight:600;">${(v/1000).toFixed(0)}k</div>
            <div style="width:100%;background:linear-gradient(180deg,#f97316,#ea580c);border-radius:4px 4px 0 0;height:${h}px;"></div>
            <div style="font-size:.62rem;color:#6b7280;">${months[i]}</div>
          </div>`
        }).join('')}
      </div>
    </div>
    </div><!-- /vol-mach -->
  </div>
  <!-- Modal Nouveau / Édition poste de travail -->
  <div id="posteModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:520;">
    <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:520px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><h3 id="po_title" style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-object-group" style="margin-right:8px;"></i>Nouveau poste</h3><button onclick="closeModal('posteModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <input type="hidden" id="po_id"/>
        <div style="grid-column:span 2;"><label class="form-label">Nom du poste *</label><input id="po_nom" type="text" placeholder="Ex : Poste Usinage CN, Poste Pliage…" class="form-input"/></div>
        <div><label class="form-label">Code</label><input id="po_code" type="text" placeholder="PST-01" class="form-input"/></div>
        <div><label class="form-label">Activité *</label><select id="po_activite" class="form-input"><option value="Seem">Seem</option><option value="Semrac">Semrac</option><option value="both">Seem &amp; Semrac</option><option value="OAS">OAS (traitement de surface)</option></select><div style="font-size:.66rem;color:#94a3b8;margin-top:4px;"><i class="fas fa-info-circle" style="margin-right:3px;"></i>Un poste <strong>OAS</strong> n'apparaît pas dans le planning ; ses process alimentent les <strong>types de bain</strong> de l'onglet OAS.</div></div>
        <div><label class="form-label">Couleur (planning)</label><input id="po_couleur" type="color" value="#8b5cf6" class="form-input" style="height:38px;padding:3px;"/></div>
        <div><label class="form-label">Ordre d'affichage</label><input id="po_ordre" type="number" value="100" class="form-input"/></div>
      </div>
      <div style="padding:0 20px 10px;font-size:.7rem;color:#94a3b8;"><i class="fas fa-info-circle" style="margin-right:4px;"></i>Rattachez ensuite les machines et process à ce poste depuis leurs fiches (champ « Poste »).</div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('posteModal')" class="btn btn-secondary">Annuler</button><button id="po_save" onclick="savePoste()" class="btn btn-primary"><i class="fas fa-plus"></i> Créer le poste</button></div>
    </div>
  </div>
  <!-- Modal Nouveau / Édition process -->
  <div id="procModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
    <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:560px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#f97316,#ea580c);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-sitemap" style="margin-right:8px;"></i>Nouveau process atelier</h3><button onclick="closeModal('procModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="grid-column:span 2;"><label class="form-label">Nom du process *</label><input id="p_nom" type="text" placeholder="Ex : Tournage CNC, Ébavurage…" class="form-input"/></div>
        <div><label class="form-label">Code</label><input id="p_code" type="text" placeholder="PROC-XX" class="form-input"/></div>
        <div><label class="form-label">Activité *</label><select id="p_activite" class="form-input"><option value="Seem">Seem</option><option value="Semrac">Semrac</option><option value="both">Seem &amp; Semrac</option></select></div>
        <div><label class="form-label">Type *</label><select id="p_type" class="form-input" onchange="procTypeChange()"><option value="machine">Machine</option><option value="manuel">Manuel</option><option value="oas">OAS (traitement de surface)</option></select></div>
        <div id="p_machine_wrap"><label class="form-label">Machine rattachée</label><select id="p_machine" class="form-input"></select></div>
        <div><label class="form-label">Catégorie</label><input id="p_categorie" type="text" placeholder="Usinage, Finition…" class="form-input"/></div>
        <div><label class="form-label">Poste <span style="color:#8b5cf6;font-weight:600;">de travail</span></label><select id="p_poste" class="form-input"></select></div>
        <div><label class="form-label">Ordre d'affichage</label><input id="p_ordre" type="number" value="100" class="form-input"/></div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('procModal')" class="btn btn-secondary">Annuler</button><button onclick="createProcess()" class="btn btn-primary"><i class="fas fa-plus"></i> Créer le process</button></div>
    </div>
  </div>
  <!-- Modal Modifier process (nom + machine rattachée) -->
  <div id="procEditModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:520;">
    <div style="background:white;border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:440px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#6366f1,#4f46e5);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-pen" style="margin-right:8px;"></i>Modifier le process</h3><button onclick="closeModal('procEditModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:14px;">
        <input type="hidden" id="pe_id"/>
        <div><label class="form-label">Nom du process *</label><input id="pe_nom" type="text" class="form-input"/></div>
        <div><label class="form-label">Machine rattachée</label><select id="pe_machine" class="form-input" onchange="peMachineChange()"></select>
          <div style="font-size:.66rem;color:#94a3b8;margin-top:4px;"><i class="fas fa-info-circle" style="margin-right:3px;"></i>Choisir une machine bascule le process en « Machine » ; « Aucune » le laisse manuel.</div></div>
        <div><label class="form-label">Taux horaire <span style="color:#0d9488;font-weight:600;">(€/h)</span></label><input id="pe_taux" type="number" step="0.5" min="0" class="form-input"/>
          <div id="pe_taux_note" style="font-size:.66rem;color:#94a3b8;margin-top:4px;"><i class="fas fa-info-circle" style="margin-right:3px;"></i>Coût horaire de la machine associée (alimente le CRU des pièces via le taux du poste).</div></div>
        <div><label class="form-label">Poste <span style="color:#8b5cf6;font-weight:600;">de travail</span></label><select id="pe_poste" class="form-input"></select>
          <div style="font-size:.66rem;color:#94a3b8;margin-top:4px;"><i class="fas fa-info-circle" style="margin-right:3px;"></i>Le poste où ce process est planifié (les BDT de ce process s'y placent).</div></div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('procEditModal')" class="btn btn-secondary">Annuler</button><button onclick="saveProcEdit()" class="btn btn-primary"><i class="fas fa-save"></i> Enregistrer</button></div>
    </div>
  </div>
  <!-- Modal Nouvelle machine -->
  <div id="machineModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
    <div style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:560px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#f97316,#ea580c);"><h3 id="mc_modal_title" style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-cog" style="margin-right:8px;"></i>Nouvelle machine</h3><button onclick="closeModal('machineModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <input type="hidden" id="mc_id"/>
        <div style="grid-column:span 2;"><label class="form-label">Nom de la machine *</label><input id="mc_nom" type="text" placeholder="Ex : Tour CNC Mazak QT-200" class="form-input"/></div>
        <div><label class="form-label">Code</label><input id="mc_code" type="text" placeholder="CNC-03" class="form-input"/></div>
        <div><label class="form-label">Activité *</label><select id="mc_activite" class="form-input"><option value="Seem">Seem</option><option value="Semrac">Semrac</option><option value="both">Seem &amp; Semrac</option><option value="OAS">OAS (traitement de surface)</option></select></div>
        <div><label class="form-label">Catégorie</label><input id="mc_categorie" type="text" placeholder="Usinage, Découpe…" class="form-input"/></div>
        <div><label class="form-label">Capacité (h/jour)</label><input id="mc_capacite" type="number" step="0.5" value="8" class="form-input"/></div>
        <div><label class="form-label">Coût machine (€/h)</label><input id="mc_couth" type="number" step="0.5" value="35" class="form-input"/></div>
        <div><label class="form-label">Tolérance ± (mm) <span style="color:#0d9488;font-weight:600;">capabilité</span></label><input id="mc_tolerance" type="number" step="any" placeholder="ex : 0.05" class="form-input"/></div>
        <div><label class="form-label">Statut</label><select id="mc_statut" class="form-input"><option value="operationnel">Opérationnel</option><option value="maintenance">Maintenance</option><option value="arret">Arrêt</option></select></div>
        <div><label class="form-label">Poste <span style="color:#8b5cf6;font-weight:600;">de travail</span></label><select id="mc_poste" class="form-input" onchange="mcPosteChange()"></select></div>
        <div style="grid-column:span 2;"><label style="display:flex;align-items:center;gap:8px;font-size:.82rem;color:#374151;cursor:pointer;"><input id="mc_cnc" type="checkbox" style="width:15px;height:15px;"/> <i class="fas fa-microchip" style="color:#0ea5e9;"></i> Machine <strong>CNC</strong> <span style="font-size:.7rem;color:#94a3b8;font-weight:600;">— porte des codes programme (saisis en préparation technique) ; les machines non-CNC n'en ont pas</span></label></div>
        <div style="grid-column:span 2;"><label class="form-label">Opérations possibles (séparées par virgule)</label><input id="mc_operations" type="text" placeholder="Usinage CN, Tronçonnage…" class="form-input"/></div>
        <div style="grid-column:span 2;" id="mc_process_wrap"><label class="form-label">Process rattachés <span style="color:#8b5cf6;font-weight:600;">(du poste — plusieurs possibles)</span></label><div id="mc_proc_list" style="max-height:130px;overflow:auto;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 11px;background:#f8fafc;"></div><label id="mc_proc_new_wrap" style="display:flex;align-items:center;gap:6px;margin-top:7px;font-size:.76rem;color:#374151;cursor:pointer;"><input id="mc_proc_new" type="checkbox"/> Créer aussi un nouveau process (au nom de la machine)</label><div style="font-size:.66rem;color:#94a3b8;margin-top:3px;"><i class="fas fa-bolt" style="margin-right:3px;color:#f59e0b;"></i>La machine est rattachée à <strong>ces</strong> process ; son <strong>taux horaire (€/h)</strong> alimente le coût machine du CRU. Synchronisé avec l'édition du process.</div></div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('machineModal')" class="btn btn-secondary">Annuler</button><button id="mc_save_btn" onclick="createMachineFn()" class="btn btn-primary"><i class="fas fa-plus"></i> Créer la machine</button></div>
    </div>
  </div>
</div>

<script>
var MACH_DATA = ${sjX(MACH_REAL.map((m:any)=>({id:m.id,nom:m.nom,code:m.code,activite:m.activite,categorie:m.categorie,capacite_h:m.capacite_h,cout_h:(m.cout_h ?? m.taux_horaire ?? 35),tolerance_defaut:(m.tolerance_defaut ?? null),poste_id:(m.poste_id ?? null),cnc:!!m.cnc,operations:Array.isArray(m.operations)?m.operations.join(', '):(m.operations||''),statut:m.statut})))};
var POSTES_JS = ${sjX(POSTES)};
function _posteOptions(sel){ return '<option value="">— Aucun poste —</option>'+(POSTES_JS||[]).map(function(p){ return '<option value="'+p.id+'"'+(String(sel)===String(p.id)?' selected':'')+'>'+String(p.nom||'').replace(/</g,'&lt;')+'</option>'; }).join(''); }
function postToggleDet(id){ var r=document.getElementById('postdet-'+id), b=document.getElementById('postexp-'+id); if(!r) return; var open=(r.style.display==='none'); r.style.display=open?'':'none'; if(b) b.innerHTML=open?'<i class="fas fa-chevron-down"></i>':'<i class="fas fa-chevron-right"></i>'; }
// ── Override manuel du taux horaire d'un poste (Phase E) — fenêtre de confirmation obligatoire ──
async function posteSetTaux(id, autoTaux, currentManuel){
  var msg='Taux horaire MANUEL du poste (€/h). Laisser vide pour revenir au taux automatique ('+Number(autoTaux).toFixed(2)+' €/h). Ce taux prime en absolu et impacte le CRU des pieces usinees au poste.';
  var v=window.prompt(msg, (currentManuel!=null?String(currentManuel):''));
  if(v===null) return;
  v=String(v).trim().replace(',', '.');
  var payload;
  if(v===''){ if(!await appConfirm('Reinitialiser au taux automatique ('+Number(autoTaux).toFixed(2)+' €/h) ?')) return; payload={taux_horaire_manuel:null}; }
  else { var num=parseFloat(v); if(isNaN(num)||num<0){ if(window.pushNotif) pushNotif('err','fa-ban','Taux invalide.'); return; } if(!await appConfirm('Etes-vous sur ? Fixer le taux du poste a '+num.toFixed(2)+' €/h (override manuel) — impacte le CRU des pieces.')) return; payload={taux_horaire_manuel:num}; }
  fetch('/api/production/poste/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ if(window.pushNotif) pushNotif('ok','fa-check-circle','Taux du poste mis a jour.'); setTimeout(function(){softReload();},700); } else { if(window.pushNotif) pushNotif('err','fa-times',(j&&j.error)||'Erreur.'); } }).catch(function(e){ if(window.pushNotif) pushNotif('err','fa-times',e.message); });
}
window.posteSetTaux=posteSetTaux;
// ── Création d'un process DANS un poste (poste pré-rempli). Les MACHINES ne se créent QUE dans le volet « Machines ».
//    Le rattachement/déplacement d'un process se fait via sa modale d'édition (champ « Poste ») — plus de glisser-déposer.
function openProcModalForPoste(pid){ openProcModal(); var pp=document.getElementById('p_poste'); if(pp) pp.value=pid; }
window.openProcModalForPoste=openProcModalForPoste;
// ── Demande d'achat opérateur (borne PIN, restreinte au poste de l'affectation du jour) ──
var ODA={op:null,postes:[],machines:[]};
function odaOpen(){ document.getElementById('oda_mat').value=''; document.getElementById('oda_pin').value=''; document.getElementById('oda-ident').style.display=''; document.getElementById('oda-context').style.display='none'; document.getElementById('oda_submit').style.display='none'; document.getElementById('odaModal').style.display='flex'; }
function odaIdentify(){
  var mat=(document.getElementById('oda_mat').value||'').trim(), pin=(document.getElementById('oda_pin').value||'').trim();
  if(!mat||!pin){ pushNotif('err','fa-exclamation-circle','Matricule + PIN requis.'); return; }
  fetch('/api/production/operateur-contexte',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({matricule:mat,pin:pin})}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Identification échouée.',4500); return; }
    ODA.op=j.operateur; ODA.postes=j.postes||[]; ODA.machines=j.machines||[];
    document.getElementById('oda_who').textContent=j.operateur.nom;
    document.getElementById('oda_poste').innerHTML=ODA.postes.map(function(p){return '<option value="'+p.id+'">'+String(p.nom).replace(/</g,'&lt;')+'</option>';}).join('');
    document.getElementById('oda-ident').style.display='none'; document.getElementById('oda-context').style.display=''; document.getElementById('oda_submit').style.display='';
    odaFillMachines(); odaToggleCat();
  }).catch(function(){ pushNotif('err','fa-times','Erreur réseau.'); });
}
function odaFillMachines(){ var pid=document.getElementById('oda_poste').value; var sel=document.getElementById('oda_machine'); if(!sel) return; sel.innerHTML='<option value="">— Choisir —</option>'+ODA.machines.filter(function(m){return String(m.poste_id)===String(pid);}).map(function(m){return '<option value="'+m.id+'">'+String(m.nom).replace(/</g,'&lt;')+(m.cnc?' (CNC)':'')+'</option>';}).join(''); }
function odaToggleCat(){ var c=(document.querySelector('input[name=oda_cat]:checked')||{}).value; document.getElementById('oda_machine_wrap').style.display=(c==='machine')?'block':'none'; }
function odaSubmit(){
  var cat=(document.querySelector('input[name=oda_cat]:checked')||{}).value;
  var payload={ matricule:(document.getElementById('oda_mat').value||'').trim(), pin:(document.getElementById('oda_pin').value||'').trim(), categorie:cat, poste_id:document.getElementById('oda_poste').value, article:(document.getElementById('oda_article').value||'').trim(), qte:parseInt(document.getElementById('oda_qte').value,10)||1, priorite:document.getElementById('oda_prio').value };
  if(cat==='machine') payload.machine_id=document.getElementById('oda_machine').value;
  if(!payload.article){ pushNotif('err','fa-exclamation-circle','Désignation requise.'); return; }
  if(cat==='machine'&&!payload.machine_id){ pushNotif('err','fa-exclamation-circle','Choisissez la machine.'); return; }
  fetch('/api/production/demande-achat-operateur',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(j){
    if(j&&j.ok){ closeModal('odaModal'); pushNotif('ok','fa-cart-plus','Demande '+j.id+' envoyée aux Achats.',5000); }
    else pushNotif('err','fa-ban',(j&&j.error)||'Envoi échoué.',4500);
  }).catch(function(){ pushNotif('err','fa-times','Erreur réseau.'); });
}
function volShow(which){
  var m=document.getElementById('vol-mach'), p=document.getElementById('vol-pp');
  var bm=document.getElementById('volbtn-mach'), bp=document.getElementById('volbtn-pp');
  var offB='white', offC='#374151', offBd='1.5px solid #e2e8f0';
  if(which==='pp'){ if(m)m.style.display='none'; if(p)p.style.display='';
    if(bp){bp.style.background='linear-gradient(135deg,#8b5cf6,#7c3aed)';bp.style.color='white';bp.style.border='none';}
    if(bm){bm.style.background=offB;bm.style.color=offC;bm.style.border=offBd;} }
  else { if(p)p.style.display='none'; if(m)m.style.display='';
    if(bm){bm.style.background='linear-gradient(135deg,#f97316,#ea580c)';bm.style.color='white';bm.style.border='none';}
    if(bp){bp.style.background=offB;bp.style.color=offC;bp.style.border=offBd;} }
}
function openPosteModal(){ document.getElementById('po_id').value=''; document.getElementById('po_title').innerHTML='<i class="fas fa-object-group" style="margin-right:8px;"></i>Nouveau poste'; document.getElementById('po_save').innerHTML='<i class="fas fa-plus"></i> Créer le poste'; document.getElementById('po_nom').value=''; document.getElementById('po_code').value=''; document.getElementById('po_activite').value='Seem'; document.getElementById('po_couleur').value='#8b5cf6'; document.getElementById('po_ordre').value='100'; document.getElementById('posteModal').style.display='flex'; }
function openPosteEdit(id){ var p=(POSTES_JS||[]).find(function(x){return String(x.id)===String(id);}); if(!p){ pushNotif('err','fa-ban','Poste introuvable.'); return; } document.getElementById('po_id').value=p.id; document.getElementById('po_title').innerHTML='<i class="fas fa-edit" style="margin-right:8px;"></i>Modifier le poste'; document.getElementById('po_save').innerHTML='<i class="fas fa-save"></i> Enregistrer'; document.getElementById('po_nom').value=p.nom||''; document.getElementById('po_code').value=p.code||''; document.getElementById('po_activite').value=p.activite||'Seem'; document.getElementById('po_couleur').value=p.couleur||'#8b5cf6'; document.getElementById('po_ordre').value=(p.ordre!=null?p.ordre:100); document.getElementById('posteModal').style.display='flex'; }
function savePoste(){ var nom=(document.getElementById('po_nom').value||'').trim(); if(!nom){ pushNotif('err','fa-exclamation-circle','Nom du poste requis.'); return; } var id=document.getElementById('po_id').value; var payload={ nom:nom, code:(document.getElementById('po_code').value||'').trim(), activite:document.getElementById('po_activite').value, couleur:document.getElementById('po_couleur').value, ordre:parseInt(document.getElementById('po_ordre').value,10)||100 }; var url=id?('/api/production/poste/'+encodeURIComponent(id)):'/api/production/poste'; fetch(url,{method:id?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ pushNotif('ok','fa-check',id?'Poste modifié.':'Poste créé.'); setTimeout(function(){softReload();},700); } else pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); }).catch(function(){ pushNotif('err','fa-times','Erreur réseau.'); }); }
async function deletePosteFn(id,nom){ if(!await appConfirm('Supprimer le poste « '+nom+' » ? Les machines et process seront détachés (non supprimés).')) return; fetch('/api/production/poste/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ pushNotif('ok','fa-trash','Poste supprimé.'); setTimeout(function(){softReload();},600); } else pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); }).catch(function(){ pushNotif('err','fa-times','Erreur réseau.'); }); }
var MACH_POSTES = ${sjX(Object.fromEntries(MACH_REAL.map((m:any)=>{const op=machOpex[String(m.id)];return [String(m.id),{nom:m.nom,total:op?op.total:0,postes:op?Object.entries(op.postes).map(([art,v]:any)=>({art,qte:v.qte,cout:v.cout})).sort((a,b)=>b.cout-a.cout):[]}];})))};
// Coche les process du POSTE choisi rattachés à la machine (attachedIds). Multi : une machine peut couvrir PLUSIEURS process d'un poste.
function mcFillProcess(attachedIds){
  var host=document.getElementById('mc_proc_list'); if(!host) return;
  var poste=(document.getElementById('mc_poste')||{}).value||'';
  var att={}; (attachedIds||[]).forEach(function(x){ att[String(x)]=1; });
  if(!poste){ host.innerHTML='<div style="color:#94a3b8;font-size:.72rem;">Choisissez d abord un poste.</div>'; return; }
  var procs=(PROCESS||[]).filter(function(p){ return String(p.poste_id||'')===String(poste) && !isOasProc(p); });
  if(!procs.length){ host.innerHTML='<div style="color:#94a3b8;font-size:.72rem;">Aucun process dans ce poste — cochez « nouveau process » ou créez-en depuis « Postes & Process ».</div>'; return; }
  host.innerHTML=procs.map(function(p){ return '<label style="display:flex;align-items:center;gap:6px;padding:2px 0;cursor:pointer;font-size:.8rem;color:#374151;"><input type="checkbox" class="mc-proc-cb" value="'+p.id+'"'+(att[String(p.id)]?' checked':'')+'/> '+String(p.nom||'').replace(/</g,'&lt;')+'</label>'; }).join('');
}
// Sur changement de poste : recoche les process du NOUVEAU poste déjà rattachés à cette machine (édition), rien en création.
function mcPosteChange(){
  var mid=(document.getElementById('mc_id')||{}).value||'';
  var poste=(document.getElementById('mc_poste')||{}).value||'';
  var att=mid?(PROCESS||[]).filter(function(p){ return String(p.machine_id||'')===String(mid) && String(p.poste_id||'')===String(poste); }).map(function(p){return p.id;}):[];
  mcFillProcess(att);
}
function openMachineModal(){
  document.getElementById('mc_id').value='';
  document.getElementById('mc_modal_title').innerHTML='<i class="fas fa-cog" style="margin-right:8px;"></i>Nouvelle machine';
  document.getElementById('mc_save_btn').innerHTML='<i class="fas fa-plus"></i> Créer la machine';
  ['mc_nom','mc_code','mc_categorie','mc_operations'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('mc_capacite').value='8'; document.getElementById('mc_couth').value='35';
  document.getElementById('mc_activite').value='Seem'; document.getElementById('mc_statut').value='operationnel';
  var mp=document.getElementById('mc_poste'); if(mp) mp.innerHTML=_posteOptions('');
  var pnw=document.getElementById('mc_proc_new_wrap'); if(pnw) pnw.style.display='';
  var pn=document.getElementById('mc_proc_new'); if(pn) pn.checked=true;   // création : propose un nouveau process par défaut
  mcFillProcess([]);
  var cc=document.getElementById('mc_cnc'); if(cc) cc.checked=false;
  var m=document.getElementById('machineModal'); if(m) m.style.display='flex';
}
function editMachine(id){
  var m=(MACH_DATA||[]).find(function(x){return String(x.id)===String(id);}); if(!m){ pushNotif('err','fa-ban','Machine introuvable.'); return; }
  document.getElementById('mc_id').value=m.id;
  document.getElementById('mc_modal_title').innerHTML='<i class="fas fa-edit" style="margin-right:8px;"></i>Modifier la machine';
  document.getElementById('mc_save_btn').innerHTML='<i class="fas fa-save"></i> Enregistrer';
  document.getElementById('mc_nom').value=m.nom||''; document.getElementById('mc_code').value=m.code||'';
  document.getElementById('mc_activite').value=m.activite||'Seem'; document.getElementById('mc_categorie').value=m.categorie||'';
  document.getElementById('mc_capacite').value=m.capacite_h!=null?m.capacite_h:8; document.getElementById('mc_couth').value=m.cout_h!=null?m.cout_h:35;
  document.getElementById('mc_tolerance').value=m.tolerance_defaut!=null?m.tolerance_defaut:'';
  document.getElementById('mc_operations').value=m.operations||'';
  document.getElementById('mc_statut').value=(m.statut==='maintenance'||m.statut==='arret')?m.statut:'operationnel';
  document.getElementById('mc_process_wrap').style.display='';
  var mp=document.getElementById('mc_poste'); if(mp) mp.innerHTML=_posteOptions(m.poste_id||'');
  var pnw=document.getElementById('mc_proc_new_wrap'); if(pnw) pnw.style.display='none';   // édition : pas de création de process ici
  var pn=document.getElementById('mc_proc_new'); if(pn) pn.checked=false;
  var _att=(PROCESS||[]).filter(function(p){ return String(p.machine_id||'')===String(m.id) && String(p.poste_id||'')===String(m.poste_id||''); }).map(function(p){return p.id;});   // TOUS les process du poste déjà rattachés à cette machine
  mcFillProcess(_att);
  var cc=document.getElementById('mc_cnc'); if(cc) cc.checked=!!m.cnc;
  document.getElementById('machineModal').style.display='flex';
}
function createMachineFn(){
  var nom=(document.getElementById('mc_nom').value||'').trim(); if(!nom){ pushNotif('err','fa-exclamation-circle','Nom de la machine requis.'); return; }
  var id=document.getElementById('mc_id').value;
  var payload={ nom:nom, code:(document.getElementById('mc_code').value||'').trim(), activite:document.getElementById('mc_activite').value, categorie:(document.getElementById('mc_categorie').value||'').trim(), capacite_h:parseFloat(document.getElementById('mc_capacite').value)||8, cout_h:parseFloat(document.getElementById('mc_couth').value)||35, tolerance_defaut:(document.getElementById('mc_tolerance').value!==''?parseFloat(document.getElementById('mc_tolerance').value):null), statut:document.getElementById('mc_statut').value, operations:document.getElementById('mc_operations').value };
  if(POSTES_JS && POSTES_JS.length){ var _mp=document.getElementById('mc_poste'); if(_mp) payload.poste_id=_mp.value||''; }   // rattachement poste (seulement si des postes existent → compat pré-migration)
  var _cc=document.getElementById('mc_cnc'); if(_cc) payload.cnc=_cc.checked;   // CNC (le serveur réessaie sans si colonne absente)
  var poste=(document.getElementById('mc_poste')||{}).value||'';
  var checked=[].slice.call(document.querySelectorAll('#mc_proc_list .mc-proc-cb:checked')).map(function(cb){return String(cb.value);});   // process cochés (rattachés)
  var makeNew=!!((document.getElementById('mc_proc_new')||{}).checked);
  var url, method;
  if(id){ url='/api/production/machine/'+encodeURIComponent(id); method='PATCH'; }
  else { url='/api/production/machine'; method='POST'; payload.create_process=makeNew; }   // « nouveau process » = create_process serveur (POST)
  fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Enregistrement échoué.'); return; }
    var mid=(j.machine&&j.machine.id)||id;
    var done=function(){ pushNotif('ok','fa-cog','Machine <strong>'+nom+'</strong> '+(id?'modifiée':'créée')+'.',5000); setTimeout(function(){ softReload(); },750); };
    // SYNCHRONISATION machine ↔ process (le taux horaire machine → coût du CRU) : pour chaque process DU POSTE,
    //   coché & non rattaché → rattacher ; décoché & rattaché à CETTE machine → détacher. Les autres postes/machines intacts.
    var posteProcs=(PROCESS||[]).filter(function(p){ return String(p.poste_id||'')===String(poste); });
    var _pp=function(pid,body){ return fetch('/api/production/process/'+encodeURIComponent(pid),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(function(){}); };
    var patches=[];
    posteProcs.forEach(function(p){
      var isChecked=checked.indexOf(String(p.id))>=0;
      var wasMine=String(p.machine_id||'')===String(mid);
      if(isChecked && !wasMine) patches.push(_pp(p.id,{ machine_id:mid, requiert_machine:true, poste_id:(poste||null) }));   // rattacher
      else if(!isChecked && wasMine) patches.push(_pp(p.id,{ machine_id:null }));   // détacher (la machine ne couvre plus ce process)
    });
    if(patches.length) Promise.all(patches).then(done,done); else done();
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
async function deleteMachineFn(id,nom){
  if(!await appConfirm('Supprimer la machine '+nom+' ? Cette action est irréversible.')) return;
  fetch('/api/production/machine/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Suppression échouée.'); return; }
    pushNotif('ok','fa-trash','Machine supprimée.',3500); setTimeout(function(){ softReload(); },650);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function machDeclarerPanne(id,nom){
  var motif=prompt('Déclarer « '+nom+' » EN PANNE.\\nMotif / description de la panne (optionnel) :','');
  if(motif===null) return; // annulé
  fetch('/api/production/machine/'+encodeURIComponent(id)+'/panne',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({motif:motif||null})})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
      pushNotif('warn','fa-triangle-exclamation','« '+nom+' » déclarée en panne — elle apparaît dans le Service Maintenance.',5000); setTimeout(function(){ softReload(); },900);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
async function machReparer(id,nom){
  if(!await appConfirm('Remettre « '+nom+' » en service ?')) return;
  fetch('/api/production/machine/'+encodeURIComponent(id)+'/reparer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
      pushNotif('ok','fa-rotate-left','« '+nom+' » remise en service.',4000); setTimeout(function(){ softReload(); },800);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function machFmtEur(v){ return (Math.round((v||0)*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'; }
function machShowPostes(id){
  var d=MACH_POSTES[String(id)]; if(!d){ return; }
  document.getElementById('machPostesNom').textContent=d.nom+' · OPEX total '+machFmtEur(d.total);
  var rows=d.postes.map(function(p){ return '<tr style="border-bottom:1px solid #f9fafb;"><td style="padding:8px 14px;font-weight:600;color:#1e293b;">'+p.art+'</td><td style="padding:8px 14px;text-align:center;color:#6b7280;">'+p.qte+'</td><td style="padding:8px 14px;text-align:right;font-weight:700;color:#16a34a;">'+machFmtEur(p.cout)+'</td></tr>'; }).join('');
  document.getElementById('machPostesBody').innerHTML = rows || '<tr><td colspan="3" style="text-align:center;padding:20px;color:#94a3b8;">Aucune sortie consommable enregistrée.</td></tr>';
  var panel=document.getElementById('machPostesPanel'); panel.style.display=''; panel.scrollIntoView({behavior:'smooth',block:'nearest'});
}
</script>

<script>
// ─── Navigation onglets ──────────────────────────────────────
var PROD_TABS=['gantt-bdt','gantt-bst','presence','commandes','dash-prog','dash-prod','machines'];
function mach_filter(act, btn){
  document.querySelectorAll('#ppanel-machines button[id^="mf-"]').forEach(function(b){
    b.style.background='white'; b.style.color='#374151'; b.style.borderColor='#e2e8f0';
  });
  if(btn){ btn.style.background='#f97316'; btn.style.color='white'; btn.style.borderColor='#f97316'; }
  document.querySelectorAll('#mach-table tbody tr').forEach(function(r){
    r.style.display=(act==='all'||r.dataset.act===act)?'':'none';
  });
}
function showProdTab(id){
  PROD_TABS.forEach(function(t){
    var p=document.getElementById('ppanel-'+t); if(p) p.style.display=t===id?'':'none';
    var b=document.getElementById('ptab-'+t); if(b){ if(t===id) b.classList.add('active'); else b.classList.remove('active'); }
  });
  try{ sessionStorage.setItem('prodTab', id); }catch(e){}
  if(id==='gantt-bst' && typeof bstBuildAll==='function'){ try{ bstBuildAll(); }catch(e){} }
  if(id==='presence' && typeof presBuild==='function'){ try{ presBuild(); }catch(e){} }
}
// Sous-onglets « Commandes / Lots » dans le panel Commandes
function showCmdSub(w){
  ['commandes','lots'].forEach(function(s){
    var v=document.getElementById('subview-'+s); if(v) v.style.display=(s===w)?'':'none';
    var b=document.getElementById('subBtn-'+s);
    if(b){ if(s===w){ b.style.background='#fff'; b.style.color='#ea580c'; b.style.boxShadow='0 1px 3px rgba(0,0,0,.12)'; } else { b.style.background='transparent'; b.style.color='#64748b'; b.style.boxShadow='none'; } }
  });
  try{ sessionStorage.setItem('prodCmdSub', w); }catch(e){}
}
// ─── Process Ateliers (référentiel machine / manuel) ─────────
function proc_filter(type, btn){
  document.querySelectorAll('#ppanel-machines button[id^="pf-"]').forEach(function(b){ b.style.background='white'; b.style.color='#374151'; b.style.borderColor='#e2e8f0'; });
  if(btn){ btn.style.background='#f97316'; btn.style.color='white'; btn.style.borderColor='#f97316'; }
  document.querySelectorAll('#proc-table tbody tr').forEach(function(r){ r.style.display=(type==='all'||r.dataset.type===type)?'':'none'; });
}
function fillProcMachineSelect(){ var sel=document.getElementById('p_machine'); if(!sel) return; sel.innerHTML='<option value="">— Choisir une machine —</option>'+MACHINES_PROC.map(function(m){return '<option value="'+m.id+'">'+m.nom+' ('+m.activite+')</option>';}).join(''); }
function procTypeChange(){ var t=document.getElementById('p_type').value; var w=document.getElementById('p_machine_wrap'); if(w) w.style.display=(t==='machine')?'':'none'; }
function openProcModal(){ document.getElementById('p_nom').value=''; document.getElementById('p_code').value=''; document.getElementById('p_activite').value='Seem'; document.getElementById('p_type').value='machine'; document.getElementById('p_categorie').value=''; document.getElementById('p_ordre').value='100'; var pp=document.getElementById('p_poste'); if(pp) pp.innerHTML=_posteOptions(''); fillProcMachineSelect(); procTypeChange(); var m=document.getElementById('procModal'); if(m) m.style.display='flex'; }
function createProcess(){
  var nom=(document.getElementById('p_nom').value||'').trim(); if(!nom){ pushNotif('err','fa-exclamation-circle','Nom du process requis.'); return; }
  var type=document.getElementById('p_type').value; var reqM=(type==='machine'); var estOas=(type==='oas');
  var payload={nom:nom,code:(document.getElementById('p_code').value||'').trim(),activite:document.getElementById('p_activite').value,requiert_machine:reqM,est_oas:estOas,categorie:(document.getElementById('p_categorie').value||'').trim(),ordre:parseInt(document.getElementById('p_ordre').value)||100};
  if(reqM){ var mid=document.getElementById('p_machine').value; if(mid) payload.machine_id=mid; }
  if(POSTES_JS && POSTES_JS.length){ var _pp=document.getElementById('p_poste'); if(_pp) payload.poste_id=_pp.value||''; }
  fetch('/api/production/process',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Création échouée.'); return; }
    pushNotif('ok','fa-plus-circle','Process <strong>'+nom+'</strong> créé.'); setTimeout(function(){ softReload(); },650);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function toggleProcMachine(id, toMachine){
  fetch('/api/production/process/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({requiert_machine:toMachine})}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Mise à jour échouée.'); return; }
    pushNotif('ok','fa-exchange-alt','Process basculé en '+(toMachine?'Machine':'Manuel')+'.'); setTimeout(function(){ softReload(); },500);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function editProcMachineLink(id, isMachine){
  if(!isMachine){ pushNotif('info','fa-info-circle','Process Manuel : basculez-le en Machine avant de rattacher.'); return; }
  var opts=MACHINES_PROC.map(function(m,i){return (i+1)+') '+m.nom+' ['+m.id+']';}).join('\\n');
  var pick=prompt('Rattacher une machine — saisir le numéro :\\n'+opts); if(!pick) return; pick=pick.trim();
  var m=MACHINES_PROC.find(function(x){return x.id===pick;}); if(!m){ var n=parseInt(pick); if(n>=1&&n<=MACHINES_PROC.length) m=MACHINES_PROC[n-1]; }
  if(!m){ pushNotif('err','fa-ban','Machine introuvable.'); return; }
  fetch('/api/production/process/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({machine_id:m.id,requiert_machine:true})}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Rattachement échoué.'); return; }
    pushNotif('ok','fa-link','Machine <strong>'+m.nom+'</strong> rattachée.'); setTimeout(function(){ softReload(); },500);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
async function deleteProc(id, nom){
  if(!await appConfirm('Supprimer le process « '+nom+' » ?')) return;
  fetch('/api/production/process/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Suppression échouée.'); return; }
    pushNotif('ok','fa-trash','Process supprimé.'); setTimeout(function(){ softReload(); },500);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
// Édition d'un process : nom + machine rattachée (liste déroulante des machines existantes)
function openProcEdit(id){
  var p=(typeof PROCESS!=='undefined'?PROCESS:[]).find(function(x){return String(x.id)===String(id);}); if(!p){ pushNotif('err','fa-ban','Process introuvable.'); return; }
  document.getElementById('pe_id').value=id;
  document.getElementById('pe_nom').value=p.nom||'';
  var sel=document.getElementById('pe_machine');
  var machs=(typeof MACHINES_PROC!=='undefined'?MACHINES_PROC:[]);
  sel.innerHTML='<option value="">— Aucune (process manuel) —</option>'+machs.map(function(m){return '<option value="'+m.id+'"'+(String(m.id)===String(p.machine_id)?' selected':'')+'>'+m.nom+' ('+m.activite+')</option>';}).join('');
  var pp=document.getElementById('pe_poste'); if(pp) pp.innerHTML=_posteOptions(p.poste_id||'');
  peMachineChange();   // charge le taux horaire depuis la machine associée (ou désactive si process manuel)
  document.getElementById('procEditModal').style.display='flex';
}
// Le « taux horaire » d'un process = le coût horaire de sa machine (il alimente le CRU via le taux du poste).
function peMachineChange(){
  var mid=document.getElementById('pe_machine').value;
  var tx=document.getElementById('pe_taux'); var note=document.getElementById('pe_taux_note');
  var m=(typeof MACHINES_PROC!=='undefined'?MACHINES_PROC:[]).find(function(x){return String(x.id)===String(mid);});
  if(m){ tx.value=(m.cout_h!=null?m.cout_h:''); tx.disabled=false; if(note) note.innerHTML='<i class="fas fa-info-circle" style="margin-right:3px;"></i>Coût horaire de <strong>'+String(m.nom).replace(/</g,'&lt;')+'</strong> — modifier ce taux met à jour la machine (impacte le CRU via le taux du poste).'; }
  else { tx.value=''; tx.disabled=true; if(note) note.innerHTML='<i class="fas fa-info-circle" style="margin-right:3px;"></i>Process manuel (sans machine) : le taux MO est défini dans la nomenclature.'; }
}
window.peMachineChange=peMachineChange;
function saveProcEdit(){
  var id=document.getElementById('pe_id').value;
  var nom=(document.getElementById('pe_nom').value||'').trim(); if(!nom){ pushNotif('err','fa-exclamation-circle','Nom requis.'); return; }
  var mid=document.getElementById('pe_machine').value||null;
  var _pePatch={nom:nom, machine_id:mid, requiert_machine:!!mid};
  if(POSTES_JS && POSTES_JS.length){ var _pep=document.getElementById('pe_poste'); if(_pep) _pePatch.poste_id=_pep.value||''; }
  var tauxVal=(document.getElementById('pe_taux')||{}).value;
  var taux=(tauxVal!=null&&tauxVal!==''&&!isNaN(parseFloat(tauxVal)))?parseFloat(tauxVal):null;
  function done(msg){ pushNotif('ok','fa-check',msg); setTimeout(function(){ softReload(); },600); }
  fetch('/api/production/process/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(_pePatch)}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
    // Taux horaire = coût horaire de la machine associée → met à jour la machine (le CRU suit via le taux du poste).
    if(mid && taux!=null){
      fetch('/api/production/machine/'+encodeURIComponent(mid),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({cout_h:taux})}).then(function(r){return r.json();}).then(function(){ done('Process « '+nom+' » + taux machine ('+taux+' €/h) mis à jour.'); }).catch(function(){ done('Process mis à jour (taux machine non enregistré).'); });
    } else { done('Process « '+nom+' » mis à jour.'); }
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
// ─── Réordonnancement par glisser-déposer des lignes (process / machines) → champ ordre ───
var _rowDrag=null;
function rowDragStart(e,id,kind){ _rowDrag={id:id,kind:kind,el:e.currentTarget}; if(e.dataTransfer){ e.dataTransfer.effectAllowed='move'; try{e.dataTransfer.setData('text/plain',id);}catch(_){}} e.currentTarget.style.opacity='.4'; }
function rowDragOver(e){ if(_rowDrag) e.preventDefault(); }
function rowDrop(e,id,kind){
  e.preventDefault(); if(!_rowDrag||_rowDrag.kind!==kind||_rowDrag.id===id) return;
  var target=e.currentTarget, tbody=target.parentNode, dragged=_rowDrag.el;
  var rows=Array.prototype.slice.call(tbody.children), di=rows.indexOf(dragged), ti=rows.indexOf(target);
  if(di<0||ti<0) return;
  if(di<ti) tbody.insertBefore(dragged, target.nextSibling); else tbody.insertBefore(dragged, target);
  persistRowOrder(kind);
}
function rowDragEnd(){ if(_rowDrag&&_rowDrag.el) _rowDrag.el.style.opacity=''; _rowDrag=null; }
function persistRowOrder(kind){
  var tid=kind==='proc'?'proc-tbody':(kind==='poste'?'poste-tbody':'mach-tbody');
  var attr=kind==='proc'?'data-pid':(kind==='poste'?'data-poid':'data-mid');
  var tbody=document.getElementById(tid); if(!tbody) return;
  var ids=Array.prototype.slice.call(tbody.children).map(function(r){return r.getAttribute(attr);}).filter(Boolean);
  var url=kind==='proc'?'/api/production/process/reorder':(kind==='poste'?'/api/production/poste/reorder':'/api/production/machine/reorder');
  fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:ids})}).then(function(r){return r.json();}).then(function(j){ if(j&&j.ok){ pushNotif('ok','fa-sort','Ordre enregistré.'); if(kind==='poste' && typeof softReload==='function') softReload(); } else pushNotif('err','fa-ban',(j&&j.error)||'Réordonnancement échoué.'); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}

// ─── Gantt BDT (lignes = PROCESS atelier) ────────────────────
var PROCESS = ${PROCESS_J};
var MACHINES_PROC = ${MACHINES_PROC_J};
var OPERATEURS = ${OPS_J};
var SHIFTS_MAP = ${SHIFTS_J};
var ABSENCES_MAP = ${ABS_J};
var OPS_SEEM = ${OPS_SE};
var OPS_SEMRAC = ${OPS_SM};
var OPS_ST_OPS = ${OPS_ST_J};
var BDTS = JSON.parse('${escapeForJS(JSON.stringify(bdtsForGantt))}');
var currentDate = '${TODAY}';
var TODAY_REAL = '${TODAY}';                                  // date réelle figée (currentDate change à la navigation)
var AFFECTATIONS = ${sjX(dbAffectations || {})};   // { 'YYYY-MM-DD': { opId: [{p:process_id, s:shift}, …] } } (multi-affectation)
var dragOpId=null, selOpId=null, selBdtId=null;   // sélection au clic (clic-pour-sélectionner puis clic-pour-placer)
var filtAct='all', filtType='all', filtAffaire='', dragId=null, _grabDX=0, soldageBdtId=null, recuBdtId=null, focusLot=null;
var DAY_START=5,DAY_END=23,TOTAL_H=18,PX_H=50,LANE_W=TOTAL_H*50,SNAP=0.25;
// Un BDT s'affiche le jour de sa date prévue ; sans date prévue → rattaché au jour réel (à programmer)
function bdtOnDay(b){ return (b.datePrevue || TODAY_REAL) === currentDate; }
// Plage horaire (colonne) d'un opérateur selon sa présence du jour : matin / apmidi / soir / absent
function opShiftCol(opId){ var g=presGet(opId,currentDate); if(!g.shift||g.shift==='absent') return 'absent'; if(g.shift==='matin') return 'matin'; if(g.shift==='soir') return 'soir'; return 'apmidi'; }
function opPresent(opId){ var g=presGet(opId,currentDate); return !!(g.shift&&g.shift!=='absent'); }
// Affecte (ou retire) un opérateur à un process POUR UNE PLAGE HORAIRE — persisté & tracé (affectation_poste)
// Affecte un opérateur à un process (additif : plusieurs process/créneaux possibles par opérateur)
function affecterPoste(opId, procId, shift){
  var op=OPS_PRESENCE.find(function(o){return String(o.id)===String(opId);})||OPERATEURS.find(function(o){return String(o.id)===String(opId);});
  if(!AFFECTATIONS[currentDate]) AFFECTATIONS[currentDate]={};
  var list=(AFFECTATIONS[currentDate][opId]=AFFECTATIONS[currentDate][opId]||[]);
  if(!procId){ return; }
  var sh=shift||(presGet(opId,currentDate).shift)||'matin';
  if(list.some(function(a){ return String(a.p)===String(procId) && (a.s||'')===(sh||''); })){ pushNotif('info','fa-info-circle','Déjà affecté à ce process sur ce créneau.'); return; }
  list.push({p:procId,s:sh});
  var p=PROCESS.find(function(x){return String(x.id)===String(procId);});
  fetch('/api/planning/affectation-poste',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operateur_id:opId,process_id:procId,date_affectation:currentDate,shift:sh})})
    .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec affectation.'); return; } pushNotif('ok','fa-user-gear','<strong>'+(op?op.nom:opId)+'</strong> → <strong>'+(p?p.nom:procId)+'</strong>.'); }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  buildGantt(); buildOperatorsByShift();
}
// Retire UNE affectation précise (process + créneau) d'un opérateur
function retirerAffectation(opId, procId, shift){
  var sh=(shift==null?'':shift);
  if(!AFFECTATIONS[currentDate]) AFFECTATIONS[currentDate]={};
  var list=AFFECTATIONS[currentDate][opId]||[];
  AFFECTATIONS[currentDate][opId]=list.filter(function(a){ return !(String(a.p)===String(procId) && (a.s||'')===(sh||'')); });
  if(AFFECTATIONS[currentDate][opId].length===0) delete AFFECTATIONS[currentDate][opId];
  fetch('/api/planning/affectation-poste',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({operateur_id:opId,date_affectation:currentDate,process_id:procId,shift:sh})})
    .then(function(r){return r.json();}).then(function(j){ if(j&&j.ok) pushNotif('info','fa-user-slash','Affectation retirée.'); }).catch(function(){});
  buildGantt(); buildOperatorsByShift();
}
function procDrop(e,pid,shift){ e.preventDefault(); var el=e.currentTarget; if(el) el.classList.remove('drag-over'); if(dragOpId){ affecterPoste(dragOpId,pid,shift); dragOpId=null; } }
// ─── Clic-pour-sélectionner puis clic-pour-placer (en plus du drag&drop), façon planning ST ───
function selectOp(opId){
  selBdtId=null;
  selOpId=(selOpId===opId)?null:opId;
  if(selOpId){ var o=OPS_PRESENCE.find(function(x){return String(x.id)===String(opId);}); pushNotif('info','fa-mouse-pointer','<strong>'+(o?o.nom:opId)+'</strong> sélectionné — cliquez une sous-case (Matin / Après-midi / Soir) d\\'un process dans le planning.'); }
  buildOperatorsByShift();
}
function slotClick(e,pid,shift){ if(selOpId){ if(e&&e.stopPropagation) e.stopPropagation(); affecterPoste(selOpId,pid,shift); selOpId=null; } }
function selectPendBdt(bdtId){
  selOpId=null;
  selBdtId=(selBdtId===bdtId)?null:bdtId;
  // Focaliser le planning sur la route du lot du BDT sélectionné (ou tout réafficher au désélect)
  focusLot = selBdtId ? bdtId : null;   // focus = le BDT lui-meme (son poste + etape avant/apres)
  updateFocusBanner(); buildGantt();
  if(selBdtId) pushNotif('info','fa-mouse-pointer','BDT <strong>'+bdtId+'</strong> sélectionné — seuls les postes de son lot sont affichés. Cliquez un poste pour le placer.');
  buildPending();
}
function laneClickPlace(procId){ if(selBdtId){ affectBDT(selBdtId, procId, null); selBdtId=null; } }
// Opérateurs affectés à (process, plage horaire) le jour courant
function affOpsForSlot(procId, shift){ var aff=AFFECTATIONS[currentDate]||{}; var out=[]; Object.keys(aff).forEach(function(opId){ (aff[opId]||[]).forEach(function(a){ if(a&&String(a.p)===String(procId)&&(a.s||'matin')===shift) out.push(opId); }); }); return out; }
// 3 sous-cases (Matin / Après-midi / Soir) à insérer DANS la case process du Gantt
function procSlotsMiniHTML(proc){
  var SLOTS=[['matin','Matin','#3b82f6'],['apmidi','Ap-m','#8b5cf6'],['soir','Soir','#1e293b']];
  return '<div style="display:flex;gap:3px;margin-top:5px;">'+SLOTS.map(function(sl){
    var chips=affOpsForSlot(proc.id,sl[0]).map(function(opId){ var o=OPS_PRESENCE.find(function(x){return String(x.id)===String(opId);})||OPERATEURS.find(function(x){return String(x.id)===String(opId);}); var nm=o?o.nom:opId;
      return '<span style="display:inline-flex;align-items:center;gap:2px;background:'+sl[2]+'1a;color:'+sl[2]+';border-radius:999px;padding:0 4px;font-size:.54rem;font-weight:700;margin:1px;line-height:1.5;">'+nm+' <i class="fas fa-times" style="cursor:pointer;opacity:.7;" onclick="event.stopPropagation();retirerAffectation(\\''+opId+'\\',\\''+proc.id+'\\',\\''+sl[0]+'\\')"></i></span>'; }).join('');
    return '<div class="proc-slot" ondragover="event.preventDefault();this.classList.add(\\'drag-over\\')" ondragleave="this.classList.remove(\\'drag-over\\')" ondrop="procDrop(event,\\''+proc.id+'\\',\\''+sl[0]+'\\')" onclick="slotClick(event,\\''+proc.id+'\\',\\''+sl[0]+'\\')" style="flex:1;min-width:0;border:1px dashed #e2e8f0;border-top:2px solid '+sl[2]+';border-radius:5px;padding:2px 3px;min-height:30px;background:#fafafa;cursor:pointer;">'
      +'<div style="font-size:.5rem;font-weight:800;color:'+sl[2]+';text-transform:uppercase;">'+sl[1]+'</div>'
      +'<div style="line-height:1.3;">'+(chips||'<span style="font-size:.5rem;color:#d1d5db;">—</span>')+'</div></div>';
  }).join('')+'</div>';
}
// Tableau des opérateurs classés par plage horaire (colonnes Matin / Après-midi / Soir / Absent), cartes draggables
function buildOperatorsByShift(){
  var box=document.getElementById('opsByShift'); if(!box) return;
  var lbl=document.getElementById('rhPosteJour'); if(lbl){ try{ lbl.textContent=new Date(currentDate).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}); }catch(e){ lbl.textContent=currentDate; } }
  var COLS=[['matin','Matin','#3b82f6'],['apmidi','Après-midi','#8b5cf6'],['soir','Soir','#1e293b'],['absent','Absent','#ef4444']];
  var aff=AFFECTATIONS[currentDate]||{};
  var byCol={matin:[],apmidi:[],soir:[],absent:[]};
  OPS_PRESENCE.forEach(function(o){ if(filtAct!=='all'&&o.activite!==filtAct) return; var c=opShiftCol(o.id); (byCol[c]=byCol[c]||[]).push(o); });
  var cardOf=function(o,col){
    var draggable=col!=='absent';
    var alist=aff[o.id]||[]; var procNames=alist.map(function(x){ var pp=PROCESS.find(function(p){return String(p.id)===String(x.p);}); return pp?pp.nom:null; }).filter(Boolean); var proc=procNames.length?{nom:procNames.join(', ')}:null;
    var dragAttr=draggable?'draggable="true" ondragstart="dragOpId=\\''+o.id+'\\';try{event.dataTransfer.setData(\\'text/plain\\',\\'OP\\')}catch(_){}" ondragend="dragOpId=null" onclick="selectOp(\\''+o.id+'\\')"':'';
    var selCls=draggable?('ops-card'+(String(o.id)===String(selOpId)?' sel':'')):'';
    return '<div '+dragAttr+' class="'+selCls+'" style="display:flex;align-items:center;gap:6px;padding:5px 7px;border-radius:7px;background:white;border:1px solid #eef2f7;margin-bottom:5px;'+(draggable?'cursor:pointer;':'opacity:.55;')+'" title="'+(draggable?'Glisser ou cliquer pour sélectionner, puis cliquer une sous-case de process':'Absent / non planifié')+'">'
      +'<div style="width:24px;height:24px;border-radius:50%;flex-shrink:0;background:'+(o.activite==='Seem'?'#3b82f6':'#ec4899')+';color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.66rem;">'+(o.nom||'?').charAt(0)+'</div>'
      +'<div style="flex:1;min-width:0;"><div style="font-size:.74rem;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+o.nom+'</div>'+(proc?'<div style="font-size:.58rem;color:#6366f1;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">→ '+proc.nom+'</div>':'')+'</div>'
      +(draggable?'<i class="fas fa-grip-vertical" style="color:#cbd5e1;font-size:.62rem;"></i>':'')+'</div>';
  };
  box.innerHTML='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">'+COLS.map(function(c){
    var list=(byCol[c[0]]||[]).slice().sort(function(a,b){return String(a.nom).localeCompare(String(b.nom));});
    return '<div style="background:#f8fafc;border-radius:9px;padding:7px;border-top:3px solid '+c[2]+';min-height:60px;">'
      +'<div style="font-size:.66rem;font-weight:800;text-transform:uppercase;color:'+c[2]+';margin-bottom:6px;text-align:center;">'+c[1]+' <span style="color:#cbd5e1;">'+list.length+'</span></div>'
      +(list.map(function(o){return cardOf(o,c[0]);}).join('')||'<div style="font-size:.6rem;color:#d1d5db;text-align:center;padding:6px;">—</div>')+'</div>';
  }).join('')+'</div>';
}
// Process atelier en zones de drop : 3 sous-cases (Matin / Après-midi / Soir) par process
function buildProcessBoard(){
  var box=document.getElementById('processBoard'); if(!box) return;
  var aff=AFFECTATIONS[currentDate]||{};
  var byPS={}; Object.keys(aff).forEach(function(opId){ (aff[opId]||[]).forEach(function(a){ if(!a||!a.p) return; var k=a.p+'|'+(a.s||'matin'); (byPS[k]=byPS[k]||[]).push(opId); }); });
  var procs=PROCESS.filter(function(p){ return procMatchesAct(p); });
  if(!procs.length){ box.innerHTML='<div style="padding:14px;color:#94a3b8;font-size:.78rem;text-align:center;">Aucun process.</div>'; return; }
  var SLOTS=[['matin','Matin','#3b82f6'],['apmidi','Après-midi','#8b5cf6'],['soir','Soir','#1e293b']];
  box.innerHTML=procs.map(function(p){
    var col=p.activite==='Semrac'?'#ec4899':p.activite==='both'?'#8b5cf6':'#3b82f6';
    var slots=SLOTS.map(function(sl){
      var chips=(byPS[p.id+'|'+sl[0]]||[]).map(function(opId){ var o=OPS_PRESENCE.find(function(x){return String(x.id)===String(opId);})||OPERATEURS.find(function(x){return String(x.id)===String(opId);}); var nm=o?o.nom:opId;
        return '<span style="display:inline-flex;align-items:center;gap:3px;background:'+col+'1a;color:'+col+';border-radius:999px;padding:1px 6px;font-size:.62rem;font-weight:700;margin:1px;">'+nm+' <i class="fas fa-times" title="Retirer" style="cursor:pointer;opacity:.7;" onclick="retirerAffectation(\\''+opId+'\\',\\''+p.id+'\\',\\''+sl[0]+'\\')"></i></span>'; }).join('');
      return '<div class="proc-slot" ondragover="event.preventDefault();this.classList.add(\\'drag-over\\')" ondragleave="this.classList.remove(\\'drag-over\\')" ondrop="procDrop(event,\\''+p.id+'\\',\\''+sl[0]+'\\')" '
        +'style="flex:1;min-width:0;border:1px dashed #e2e8f0;border-top:2px solid '+sl[2]+';border-radius:7px;padding:4px 5px;min-height:42px;background:#fafafa;">'
        +'<div style="font-size:.55rem;font-weight:800;text-transform:uppercase;color:'+sl[2]+';margin-bottom:2px;">'+sl[1]+'</div>'
        +'<div style="line-height:1.6;">'+(chips||'<span style="font-size:.6rem;color:#d1d5db;">—</span>')+'</div></div>';
    }).join('');
    return '<div style="border:1px solid #eef2f7;border-left:4px solid '+col+';border-radius:10px;padding:8px 10px;margin-bottom:8px;background:white;">'
      +'<div style="font-size:.74rem;font-weight:800;color:#1e293b;display:flex;align-items:center;gap:6px;margin-bottom:6px;"><i class="fas fa-sitemap" style="color:'+col+';font-size:.7rem;"></i>'+p.nom+'<span style="margin-left:auto;font-size:.6rem;color:#94a3b8;font-weight:600;">'+(p.activite==='both'?'Seem/Semrac':p.activite)+'</span></div>'
      +'<div style="display:flex;gap:6px;">'+slots+'</div></div>';
  }).join('');
}
// ─── Couleurs par lot (file d'attente) + recherche par affaire ───
// LOT_PALETTE_BDT et LOT_COLORS (partagée avec le planning BST) sont définies en aval ;
// la map LOT_COLORS est construite côté serveur sur l'ensemble (BDT + BST + lots),
// pour garantir la même couleur sur les deux plannings d'un même lot.
var LOT_PALETTE=['#2563eb','#db2777','#f59e0b','#059669','#7c3aed','#0891b2','#dc2626','#65a30d','#ea580c','#0d9488','#9333ea','#ca8a04','#0ea5e9','#c026d3','#16a34a','#e11d48','#4f46e5','#d97706'];
function lotKey(b){ return b.lotId||b.numAffaire||b.cmdId||('id:'+b.id); }
function lotColorOf(b){
  var k=lotKey(b);
  if (typeof LOT_COLORS!=='undefined' && LOT_COLORS[k]) return LOT_COLORS[k];
  return '#64748b';
}
function computeLotColors(){
  // Au cas où des BDT n'auraient pas leur clé dans LOT_COLORS (création locale),
  // on complète la map à partir de la palette pour rester en cohérence.
  if (typeof LOT_COLORS==='undefined') { window.LOT_COLORS={}; }
  var existing=Object.keys(LOT_COLORS).length;
  var keys=[]; BDTS.forEach(function(b){ var k=lotKey(b); if(!LOT_COLORS[k] && keys.indexOf(k)<0) keys.push(k); });
  keys.sort();
  keys.forEach(function(k,i){ LOT_COLORS[k]=LOT_PALETTE[(existing+i)%LOT_PALETTE.length]; });
}
function fmtHour(h){ var H=Math.floor(h); var m=Math.round((h-H)*60); if(m===60){H++;m=0;} return H+'h'+(m>0?(m<10?'0'+m:m):''); }
function affaireMatch(b){ if(!filtAffaire) return true; var q=filtAffaire.toLowerCase(); return ((''+(b.numAffaire||'')).toLowerCase().indexOf(q)>=0)||((''+(b.lotId||'')).toLowerCase().indexOf(q)>=0)||((''+(b.cmdId||'')).toLowerCase().indexOf(q)>=0)||((''+(b.id||'')).toLowerCase().indexOf(q)>=0); }
function setAffaireFilter(v){ filtAffaire=(v||'').trim(); var b=document.getElementById('affClear'); if(b) b.style.display=filtAffaire?'inline-flex':'none'; buildAll(); }
function clearAffaireFilter(){ var i=document.getElementById('affSearch'); if(i) i.value=''; setAffaireFilter(''); }
// Ordre file d'attente : échéance client au plus tôt, puis chemin critique (lot + séquence d'opérations)
function pendSort(a,b){ var da=a.dateEcheance||'9999-12-31', db=b.dateEcheance||'9999-12-31'; if(da!==db) return da<db?-1:1; var ka=lotKey(a), kb=lotKey(b); if(ka!==kb) return ka<kb?-1:1; var sa=(a.seq==null?9999:a.seq), sb=(b.seq==null?9999:b.seq); if(sa!==sb) return sa-sb; return a.id<b.id?-1:1; }
// Surbrillance de tous les BDT d'un même lot dans le planning (pour repérer le précédent)
function highlightLot(key){ var bars=document.querySelectorAll('#ganttBody .bdt-bar'); for(var i=0;i<bars.length;i++){ var el=bars[i]; if(el.dataset.lot===key){ el.style.outline='3px solid #facc15'; el.style.outlineOffset='1px'; el.style.zIndex='25'; el.style.opacity='1'; } else { el.style.opacity='0.28'; } } }
function clearHighlight(){ var bars=document.querySelectorAll('#ganttBody .bdt-bar'); for(var i=0;i<bars.length;i++){ var el=bars[i]; el.style.outline=''; el.style.outlineOffset=''; el.style.zIndex=''; if(!filtAffaire) el.style.opacity=''; } if(filtAffaire) buildGantt(); }
// ── Focus « etape » : au clic d un BDT, ne garder que SON poste + celui de l etape
//    PRECEDENTE et de l etape SUIVANTE de la gamme (meme lot). Vue lean : 3 lignes max.
//    Les BDT du lot sont ordonnes par seq (ordre de gamme) ; a defaut par heure de debut.
// La gamme d un lot melange operations INTERNES (BDT) et SOUS-TRAITEES (BDS) : on fusionne
// les deux pour que « l etape d avant / d apres » soit juste meme quand c est un ST
// (zingage, anodisation…). Les BDS n ont pas de poste : ils n entrent pas dans le filtre
// des lignes du Gantt, mais ils sont nommes dans le bandeau.
function etapesDuLot(key){
  var l=BDTS.filter(function(b){ return lotKey(b)===key; }).map(function(b){ return { id:b.id, seq:b.seq, ord:(Number(b.debut)||0), st:false, ref:b }; });
  if(typeof BST_DATA!=='undefined' && BST_DATA){
    BST_DATA.forEach(function(s){
      if(bstLotKey(s)!==key) return;
      l.push({ id:s.id, seq:s.seq, ord:0, st:true, ref:s });
    });
  }
  l.sort(function(a,b){
    var sa=(a.seq==null?9999:Number(a.seq)), sb=(b.seq==null?9999:Number(b.seq));
    if(sa!==sb) return sa-sb;
    return a.ord-b.ord;
  });
  return l;
}
// Postes a afficher pour le BDT focalise : etape-1, etape, etape+1 (postes connus seulement).
function etapePostesSet(bdtId){
  var b=BDTS.find(function(x){return x.id===bdtId;}); if(!b) return null;
  var l=etapesDuLot(lotKey(b));
  var i=-1; for(var k=0;k<l.length;k++){ if(l[k].id===b.id){ i=k; break; } }
  if(i<0) return null;
  var s={};
  // Seules les etapes INTERNES ont un poste : une etape sous-traitee (x.st) n ajoute
  // aucune ligne au Gantt (elle est signalee dans le bandeau).
  [l[i-1], l[i], l[i+1]].forEach(function(x){ if(!x || x.st) return; var pid=posteOfBdt(x.ref); if(pid) s[String(pid)]=true; });
  return s;
}
// Nom lisible d une etape : poste (interne) ou « ST <nom> » (sous-traitance).
function etapeNom(x){
  if(!x) return null;
  if(x.st){
    var f=(typeof BST_FOURN!=='undefined'?BST_FOURN:[]).find(function(z){ return String(z.id)===String(x.ref.sous_traitant_id); });
    return 'ST ' + (f? f.nom : (x.ref.operation||'sous-traitance'));
  }
  var pid=posteOfBdt(x.ref);
  var po=(typeof POSTES_JS!=='undefined'?POSTES_JS:[]).find(function(p){ return String(p.id)===String(pid); });
  return po ? po.nom : (x.ref.operation||null);
}
// Libelle du bandeau : « LOT · etape 3/6 — Fraisage (avant : Tronconnage · apres : ST Zingage) »
function etapeFocusLabel(bdtId){
  var b=BDTS.find(function(x){return x.id===bdtId;}); if(!b) return '';
  var l=etapesDuLot(lotKey(b));
  var i=-1; for(var k=0;k<l.length;k++){ if(l[k].id===b.id){ i=k; break; } }
  var av=etapeNom(l[i-1]), ap=etapeNom(l[i+1]), moi=etapeNom(l[i])||b.operation||'';
  var ctx=[]; if(av) ctx.push('avant : '+av); if(ap) ctx.push('apres : '+ap);
  return lotKey(b)+' \\u00b7 etape '+(i+1)+'/'+l.length+' \\u2014 '+moi+(ctx.length?' ('+ctx.join(' \\u00b7 ')+')':' (seule etape)');
}
function updateFocusBanner(){
  var el=document.getElementById('lotFocusBanner'); if(!el) return;
  if(focusLot){ el.style.display='flex'; var lbl=document.getElementById('lotFocusLabel'); if(lbl) lbl.textContent=etapeFocusLabel(focusLot); }
  else { el.style.display='none'; }
}
// focusLot contient desormais l ID DU BDT focalise (et non la cle du lot).
function focusBdtLot(bdtId){ var b=BDTS.find(function(x){return x.id===bdtId;}); if(!b) return; focusLot=(focusLot===bdtId)?null:bdtId; updateFocusBanner(); buildGantt(); }
function clearFocusLot(){ focusLot=null; updateFocusBanner(); buildGantt(); }
// Guide visuel de dépôt (ligne + heure cible) pendant le glisser
function showDropGuide(lane,e){ var rect=lane.getBoundingClientRect(); var t=snapTime(lane,e); var g=document.getElementById('dropGuide'); if(!g){ g=document.createElement('div'); g.id='dropGuide'; g.style.cssText='position:fixed;width:2px;background:#f59e0b;z-index:60;pointer-events:none;box-shadow:0 0 8px #f59e0b;'; document.body.appendChild(g); } var px=rect.left+(t-DAY_START)*PX_H; g.style.left=px+'px'; g.style.top=rect.top+'px'; g.style.height=rect.height+'px'; g.style.display='block'; var lbl=document.getElementById('dropGuideLbl'); if(!lbl){ lbl=document.createElement('div'); lbl.id='dropGuideLbl'; lbl.style.cssText='position:fixed;background:#f59e0b;color:white;font-size:.62rem;font-weight:800;padding:1px 6px;border-radius:4px;z-index:61;pointer-events:none;white-space:nowrap;'; document.body.appendChild(lbl); } lbl.textContent=fmtHour(t); lbl.style.left=(px+4)+'px'; lbl.style.top=(rect.top-16)+'px'; lbl.style.display='block'; }
function hideDropGuide(){ var g=document.getElementById('dropGuide'); if(g) g.style.display='none'; var l=document.getElementById('dropGuideLbl'); if(l) l.style.display='none'; }
function snapTime(lane,e){ var rect=lane.getBoundingClientRect(); var x=e.clientX-rect.left-_grabDX; var t=DAY_START+x/PX_H; t=Math.round(t/SNAP)*SNAP; var b=dragId?BDTS.find(function(z){return z.id===dragId;}):null; var dur=(b&&b.duree)||1; if(t<DAY_START) t=DAY_START; if(t>DAY_END-dur) t=DAY_END-dur; return t; }
var PRIO_COLORS={normal:'#22c55e',urgent:'#f59e0b',critique:'#ef4444',st:'#6366f1'};
var STATUT_COLORS={a_programmer:'#94a3b8',affecte:'#3b82f6',programme:'#3b82f6',recu:'#f59e0b',solde:'#22c55e',st:'#6366f1'};
// Couleur d'un BDT selon son statut : bleu=programmé, jaune=reçu, vert=soldé, rouge=soldé avec NC
function bdtColor(b){
  if(b.statut==='solde') return (b.resultat==='nc')?'#ef4444':'#22c55e';
  if(b.statut==='recu') return '#f59e0b';
  if(b.statut==='st') return '#6366f1';
  return '#3b82f6';
}
function bdtStatutLabel(b){
  if(b.statut==='solde') return (b.resultat==='nc')?'Soldé · NC':'Soldé';
  if(b.statut==='recu') return 'Reçu';
  if(b.statut==='st') return 'Sous-traitance';
  if(b.statut==='programme'||b.statut==='affecte') return 'Programmé';
  if(b.statut==='a_programmer') return 'À programmer';
  return b.statut;
}
function procMatchesAct(p){ return filtAct==='all'||p.activite===filtAct||p.activite==='both'; }
function procMatchesType(p){ return filtType==='all'||(filtType==='machine'?p.requiert_machine:!p.requiert_machine); }

function buildAll(){ computeLotColors(); buildHoursHdr(); buildStats(); buildGantt(); buildPending(); buildOperatorsByShift(); }
// Présence opérateurs du jour sélectionné (sous le planning BDT), pilotée par PRESENCES + absences RH
function buildDayPresence(){
  var cont=document.getElementById('dayPresenceList'); if(!cont) return;
  var lbl=document.getElementById('dayPresLabel'); if(lbl){ var d=new Date(currentDate); lbl.textContent=d.toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'2-digit'}); }
  var present=0;
  var html=OPS_PRESENCE.map(function(o){
    var g=presGet(o.id,currentDate);
    var actCol=o.activite==='Seem'?'#3b82f6':'#ec4899';
    if(g.shift && g.shift!=='absent') present++;
    var sc=(g.shift&&PRES_SHIFTS[g.shift])?PRES_SHIFTS[g.shift]:['#f8fafc','#94a3b8','Non prog.'];
    var hours={matin:'06h-14h',journee:'08h-17h',soir:'14h-22h',absent:'—'}[g.shift]||'';
    return '<div style="display:flex;align-items:center;gap:8px;background:'+sc[0]+';border:1px solid '+sc[0]+';border-radius:10px;padding:6px 10px;min-width:170px;">'
      +'<span style="width:24px;height:24px;border-radius:50%;background:'+actCol+';color:white;font-size:.6rem;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">'+(o.nom||'').charAt(0)+'</span>'
      +'<div style="min-width:0;"><div style="font-size:.72rem;font-weight:700;color:#1e293b;white-space:nowrap;">'+o.nom+'</div>'
      +'<div style="font-size:.62rem;font-weight:700;color:'+sc[1]+';">'+(g.rh?'<i class="fas fa-lock" style="margin-right:3px;"></i>':'')+sc[2]+(hours&&g.shift&&g.shift!=='absent'?' · '+hours:'')+'</div></div></div>';
  }).join('');
  cont.innerHTML=html||'<div style="color:#94a3b8;font-size:.74rem;padding:8px;">Aucun opérateur enregistré.</div>';
  var cnt=document.getElementById('cntPresent'); if(cnt) cnt.textContent=present+' présent'+(present!==1?'s':'');
}
function shiftDate(d){ var dt=new Date(currentDate); dt.setDate(dt.getDate()+d); currentDate=dt.toISOString().split('T')[0]; document.getElementById('planDate').value=currentDate; buildAll(); }
function loadDay(v){ currentDate=v; buildAll(); }
function setAct(a){ filtAct=a; var ids=['all','Seem','Semrac']; ids.forEach(function(x){ var el=document.getElementById('fa-'+x); if(el) el.classList.toggle('active',x===a); }); buildAll(); }
function setType(t){ filtType=t; var ids=['all','machine','manuel']; ids.forEach(function(x){ var el=document.getElementById('ft-'+x); if(el) el.classList.toggle('active',x===t); }); buildAll(); }
function isAbsent(opId,date){ return !!(ABSENCES_MAP[opId]&&ABSENCES_MAP[opId].dates&&ABSENCES_MAP[opId].dates.indexOf(date)>=0); }
function buildHoursHdr(){
  var hdr=document.getElementById('hoursHdr'); if(!hdr) return;
  hdr.innerHTML=''; hdr.style.cssText='width:'+LANE_W+'px;position:relative;height:34px;';
  for(var h=DAY_START;h<=DAY_END;h++){
    var el=document.createElement('div');
    el.style.cssText='position:absolute;left:'+((h-DAY_START)*PX_H)+'px;width:'+PX_H+'px;text-align:center;padding:7px 0;font-size:.6rem;'+(h%2===0?'font-weight:700;color:#94a3b8;':'color:#64748b;');
    el.textContent=h+'h'; hdr.appendChild(el);
  }
}
// Un process de TRAITEMENT DE SURFACE / OXYDATION (OAS, Surtec, désox, anodisation…) ne s'affiche JAMAIS au
// planning (il a son propre onglet). Détection LARGE : flag est_oas, activité OAS, poste dont l'activité OU LE
// NOM vaut OAS/traitement de surface, ou nom de process évoquant l'oxydation.
// (Gotcha réel : ces process ont est_oas=false, activité Seem/both et un poste NOMMÉ « OAS » mais d'activité
//  « both » → aucune des conditions simples ne les attrapait.)
function isOasProc(p){
  if(!p) return false;
  if(p.est_oas||p.activite==='OAS') return true;
  var po=(typeof POSTES_JS!=='undefined'?POSTES_JS:[]).find(function(x){return String(x.id)===String(p.poste_id);});
  if(po){ var pn=String(po.nom||'').trim(); if(po.activite==='OAS'||pn.toUpperCase()==='OAS'||/oxyd|anodis|traitement.*surf|surtec/i.test(pn)) return true; }
  if(/oxyd|anodis|surtec|d[ée]sox|chromat|passiv/i.test(String(p.nom||''))) return true;
  return false;
}
// ── Le planning est organisé par POSTE (pas par process ni par machine). ──
function isOasPoste(po){ if(!po) return false; var nom=String(po.nom||'').trim(); return po.activite==='OAS' || nom.toUpperCase()==='OAS' || /oxyd|anodis|traitement.*surf|surtec|d[ée]sox|chromat/i.test(nom); }
function _procById(id){ return PROCESS.find(function(x){return String(x.id)===String(id);}); }
// poste d'un BDT : via son process assigné, sinon via son opération → process (nom / liste d'opérations) → poste
function posteOfBdt(b){
  if(!b) return '';
  if(b.process && b.process!=='pending'){ var pr=_procById(b.process); if(pr) return String(pr.poste_id||''); }
  var op=String(b.operation||'').trim().toLowerCase();
  var prc=PROCESS.find(function(x){ if(String(x.nom||'').trim().toLowerCase()===op) return true; var ops=Array.isArray(x.operations)?x.operations:[]; for(var i=0;i<ops.length;i++){ if(String(ops[i]).trim().toLowerCase()===op) return true; } return false; });
  return prc?String(prc.poste_id||''):'';
}
// process compatible d'un poste pour un BDT (préfère celui qui couvre l'opération)
function resolveProcForPoste(bdt,posteId){
  var cands=PROCESS.filter(function(p){ return String(p.poste_id||'')===String(posteId) && !isOasProc(p) && (p.activite==='both'||p.activite===bdt.activite); });
  if(!cands.length) return null;
  var op=String(bdt.operation||'').trim().toLowerCase();
  var m=cands.find(function(p){ if(String(p.nom||'').trim().toLowerCase()===op) return true; var ops=Array.isArray(p.operations)?p.operations:[]; for(var i=0;i<ops.length;i++){ if(String(ops[i]).trim().toLowerCase()===op) return true; } return false; });
  return (m||cands[0]).id;
}
function dropBdtOnPoste(bdtId,posteId,debut){
  var bd=BDTS.find(function(b){return b.id===bdtId;}); if(!bd) return;
  var pid=resolveProcForPoste(bd,posteId);
  if(!pid){ pushNotif('err','fa-ban','Aucun process compatible dans ce poste pour ce BDT ('+bd.activite+').'); return; }
  affectBDT(bdtId,pid,debut);
}
function buildGantt(){
  var body=document.getElementById('ganttBody'); if(!body) return; body.innerHTML='';
  var _focusSet=focusLot?etapePostesSet(focusLot):null;
  var postes=(typeof POSTES_JS!=='undefined'?POSTES_JS:[]).filter(function(po){ return po.statut!=='inactif' && !isOasPoste(po) && (filtAct==='all'||po.activite===filtAct||po.activite==='both') && (!_focusSet||_focusSet[String(po.id)]); }).slice().sort(function(a,b){ return (Number(a.ordre)||100)-(Number(b.ordre)||100); });
  if(postes.length===0){ body.innerHTML='<div style="text-align:center;padding:40px;color:#94a3b8;font-size:.82rem;"><i class="fas fa-cubes-stacked" style="font-size:2rem;display:block;margin-bottom:8px;opacity:.3;"></i>Aucun poste. Créez-en dans Production › Machines &amp; postes.</div>'; return; }
  postes.forEach(function(poste){
    var bdtsP=BDTS.filter(function(b){ return String(posteOfBdt(b))===String(poste.id) && bdtOnDay(b); });
    var actColor=poste.activite==='Semrac'?'#ec4899':poste.activite==='both'?'#8b5cf6':'#3b82f6';
    var procN=PROCESS.filter(function(p){ return String(p.poste_id||'')===String(poste.id) && !isOasProc(p); }).length;
    var machN=(typeof MACH_DATA!=='undefined'?MACH_DATA:[]).filter(function(m){ return String(m.poste_id||'')===String(poste.id); }).length;
    var row=document.createElement('div'); row.className='gantt-body-row';
    var info=document.createElement('div'); info.className='op-info-cell';
    info.innerHTML='<div style="display:flex;align-items:center;gap:6px;"><div style="width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;color:white;font-size:.7rem;flex-shrink:0;background:'+(poste.couleur||'#6366f1')+';"><i class="fas fa-cubes-stacked"></i></div><div style="min-width:0;"><div style="font-size:.73rem;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:155px;" title="'+poste.nom+'">'+poste.nom+'</div><div style="font-size:.62rem;color:#94a3b8;">'+procN+' process · '+machN+' machine(s)</div></div></div><div style="display:flex;align-items:center;gap:4px;margin-top:3px;flex-wrap:wrap;"><span style="font-size:.6rem;padding:1px 6px;border-radius:999px;font-weight:600;background:'+actColor+'22;color:'+actColor+';">'+poste.activite+'</span><span style="font-size:.6rem;color:#94a3b8;">'+bdtsP.filter(function(b){return b.statut!=='solde';}).length+' BDT</span></div>' + procSlotsMiniHTML(poste);
    var lane=document.createElement('div'); lane.className='gantt-lane';
    lane.style.cssText='position:relative;min-height:68px;width:'+LANE_W+'px;'; lane.dataset.posteid=poste.id;
    for(var h=0;h<=TOTAL_H;h++){ var t=document.createElement('div'); t.className='gantt-tick'+(h%2===0?' major':''); t.style.left=(h*PX_H)+'px'; lane.appendChild(t); }
    bdtsP.forEach(function(bdt){ lane.appendChild(makeBdtBar(bdt)); });
    lane.addEventListener('dragover',function(e){ e.preventDefault(); lane.classList.add('drag-over'); showDropGuide(lane,e); });
    lane.addEventListener('dragleave',function(){ lane.classList.remove('drag-over'); hideDropGuide(); });
    lane.addEventListener('drop',function(e){ e.preventDefault(); lane.classList.remove('drag-over'); hideDropGuide(); if(dragId){ var t=snapTime(lane,e); dropBdtOnPoste(dragId,poste.id,t); } dragId=null; _grabDX=0; clearHighlight(); });
    lane.addEventListener('click',function(){ if(selBdtId){ dropBdtOnPoste(selBdtId,poste.id,null); selBdtId=null; } });
    if(bdtsP.length===0){ var em=document.createElement('div'); em.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.68rem;color:#d1d5db;pointer-events:none;'; em.innerHTML='<i class="fas fa-inbox" style="margin-right:4px;"></i>Aucun BDT — glissez un BDT ici'; lane.appendChild(em); }
    row.appendChild(info); row.appendChild(lane); body.appendChild(row);
  });
}
function makeBdtBar(bdt){
  var startOff=Math.max(0,bdt.debut-DAY_START); var w=Math.max(bdt.duree*PX_H-4,30); var l=startOff*PX_H+2;
  var color=bdtColor(bdt);
  var lotCol=lotColorOf(bdt);
  var canDrag=(bdt.statut==='programme'||bdt.statut==='affecte');
  var el=document.createElement('div'); el.className='bdt-bar'+(bdt.statut==='solde'?' solde':'')+((bdt.statut==='programme'||bdt.statut==='affecte')?' programme':'');
  el.draggable=canDrag; el.dataset.bdtid=bdt.id; el.dataset.lot=lotKey(bdt);
  // Stripe lot à gauche (continuité visuelle avec BST) + couleur de statut sur le corps
  el.style.cssText='left:'+l+'px;width:'+w+'px;background:'+color+';color:white;border-left:5px solid '+lotCol+';'+(canDrag?'cursor:grab;':'');
  el.innerHTML='<div style="font-size:.58rem;font-weight:800;opacity:.85;">'+oxyBox(bdt.oxydation)+bdt.id+'</div><div style="font-size:.62rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+bdt.operation+'</div><div style="font-size:.58rem;opacity:.75;">'+bdt.client+' · '+fmtHour(bdt.debut)+' · '+bdt.duree+'h</div>';
  if(canDrag){
    el.addEventListener('dragstart',function(e){ dragId=bdt.id; _grabDX=e.clientX-el.getBoundingClientRect().left; if(e.dataTransfer){ e.dataTransfer.setData('text/plain',bdt.id); e.dataTransfer.effectAllowed='move'; } highlightLot(lotKey(bdt)); });
    el.addEventListener('dragend',function(){ clearHighlight(); hideDropGuide(); dragId=null; _grabDX=0; });
  }
  el.addEventListener('mouseenter',function(e){ showTT(e,bdt); }); el.addEventListener('mousemove',moveTT); el.addEventListener('mouseleave',hideTT);
  // Double-clic = déclaration de sortie matière liée au BDT. Clic droit = menu (Réceptionner / Solder).
  el.addEventListener('click',function(e){ e.stopPropagation(); if(el._clkT) return; el._clkT=setTimeout(function(){ el._clkT=null; focusBdtLot(bdt.id); },230); });
  el.addEventListener('dblclick',function(){ if(el._clkT){ clearTimeout(el._clkT); el._clkT=null; } openSortieMatiere(bdt); });
  el.addEventListener('contextmenu',function(e){ e.preventDefault(); openStatutMenu(e,bdt); });
  if(filtAffaire){ if(affaireMatch(bdt)){ el.style.outline='2px solid #f59e0b'; el.style.zIndex='15'; } else { el.style.opacity='0.18'; } }
  return el;
}
function openStatutMenu(e,bdt){
  var ex=document.getElementById('ctxMenu'); if(ex) ex.remove();
  var st=(bdt.statut==='affecte')?'programme':bdt.statut;
  var transitions={programme:['recu','deprogrammer'],recu:['solde']}; var next=transitions[st]||[];
  var menu=document.createElement('div'); menu.id='ctxMenu'; menu.style.cssText='position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;background:white;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.2);z-index:999;min-width:236px;overflow:hidden;border:1px solid #f1f5f9;';
  var title=document.createElement('div'); title.style.cssText='padding:.45rem .7rem;font-size:.7rem;font-weight:700;color:#64748b;background:#f8fafc;border-bottom:1px solid #f1f5f9;'; title.innerHTML='<i class="fas fa-id-badge" style="margin-right:4px;"></i>'+bdt.id; menu.appendChild(title);
  var cmdRef=bdt.cmdId||bdt.numAffaire||''; var lotRef=bdt.lotId||'';
  var nav=[];
  if(cmdRef) nav.push({icon:'fa-file-invoice',color:'#3b82f6',label:'Aller à la commande rattachée',href:'/production/commande/'+encodeURIComponent(cmdRef)});
  if(lotRef) nav.push({icon:'fa-layer-group',color:'#6366f1',label:'Aller au lot rattaché',href:'/production/lot/'+encodeURIComponent(lotRef)});
  nav.forEach(function(n){ var item=document.createElement('div'); item.style.cssText='padding:.45rem .7rem;font-size:.78rem;cursor:pointer;transition:background .1s;'; item.innerHTML='<i class="fas '+n.icon+'" style="margin-right:6px;color:'+n.color+';"></i>'+n.label; item.addEventListener('mouseenter',function(){ item.style.background='#f1f5f9'; }); item.addEventListener('mouseleave',function(){ item.style.background=''; }); item.addEventListener('click',function(){ menu.remove(); window.location.href=n.href; }); menu.appendChild(item); });
  var labels={recu:'<i class="fas fa-play" style="margin-right:6px;color:#f59e0b;"></i>Réceptionner (Reçu)',solde:'<i class="fas fa-check-double" style="margin-right:6px;color:#22c55e;"></i>Solder le BDT',deprogrammer:'<i class="fas fa-undo" style="margin-right:6px;color:#f97316;"></i>Déprogrammer (retour en attente)'};
  if(next.length){ var sep=document.createElement('div'); sep.style.cssText='padding:.32rem .7rem;font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;background:#fafbfc;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;'; sep.innerHTML='Statut · matricule + PIN'; menu.appendChild(sep); }
  next.forEach(function(s){ var item=document.createElement('div'); item.style.cssText='padding:.45rem .7rem;font-size:.78rem;cursor:pointer;transition:background .1s;'+(s==='deprogrammer'?'border-top:1px solid #f1f5f9;':''); item.innerHTML=labels[s]||s; item.addEventListener('mouseenter',function(){ item.style.background='#f1f5f9'; }); item.addEventListener('mouseleave',function(){ item.style.background=''; }); item.addEventListener('click',function(){ menu.remove(); if(s==='solde') openSoldageModal(bdt.id); else if(s==='deprogrammer') deprogramBDT(bdt.id); else openRecuModal(bdt.id); }); menu.appendChild(item); });
  // Action : séparer un BDT long en plusieurs morceaux (tant qu il n est ni reçu ni soldé)
  if(bdt.statut!=='recu' && bdt.statut!=='solde'){
    var sepItem=document.createElement('div'); sepItem.style.cssText='padding:.45rem .7rem;font-size:.78rem;cursor:pointer;transition:background .1s;border-top:1px solid #f1f5f9;';
    sepItem.innerHTML='<i class="fas fa-scissors" style="margin-right:6px;color:#8b5cf6;"></i>Séparer en morceaux';
    sepItem.addEventListener('mouseenter',function(){ sepItem.style.background='#f1f5f9'; });
    sepItem.addEventListener('mouseleave',function(){ sepItem.style.background=''; });
    sepItem.addEventListener('click',function(){ menu.remove(); splitBdt(bdt.id); });
    menu.appendChild(sepItem);
  }
  setTimeout(function(){ document.addEventListener('click',function h(){ menu.remove(); document.removeEventListener('click',h); },{once:true}); },50);
  document.body.appendChild(menu);
}
function openRecuModal(bdtId){
  recuBdtId=bdtId; var bdt=BDTS.find(function(b){return b.id===bdtId;}); if(!bdt) return;
  if(bdt.statut==='recu'){ pushNotif('info','fa-info-circle','BDT déjà reçu.'); return; }
  if(bdt.statut==='solde'){ pushNotif('info','fa-info-circle','BDT déjà soldé.'); return; }
  if(bdt.process==='pending'){ pushNotif('warn','fa-exclamation-triangle','Affectez ce BDT à un process avant de le réceptionner.'); return; }
  var proc=PROCESS.find(function(p){return p.id===bdt.process;});
  document.getElementById('recuInfo').innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.78rem;"><div><span style="color:#94a3b8;">BDT : </span><strong>'+bdt.id+'</strong></div><div><span style="color:#94a3b8;">Opération : </span>'+bdt.operation+'</div><div><span style="color:#94a3b8;">Process : </span>'+(proc?proc.nom:'—')+'</div><div><span style="color:#94a3b8;">Client : </span>'+bdt.client+'</div></div>';
  document.getElementById('r_matricule').value=''; document.getElementById('r_pin').value='';
  var m=document.getElementById('recuModal'); if(m) m.style.display='flex';
}
function confirmRecu(){
  var bdt=BDTS.find(function(b){return b.id===recuBdtId;}); if(!bdt) return;
  var matricule=(document.getElementById('r_matricule').value||'').trim(); var pin=(document.getElementById('r_pin').value||'').trim();
  if(!matricule||!pin){ pushNotif('err','fa-id-badge','Matricule + code PIN requis.'); return; }
  fetch('/api/production/bdt/'+encodeURIComponent(recuBdtId)+'/recu',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({matricule:matricule,pin:pin})})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Réception refusée (matricule / PIN incorrect ?).'); return; }
      bdt.statut='recu'; if(j.data&&j.data.debut_reel) bdt.debutReel=j.data.debut_reel; if(j.operateur_id) bdt.operateurId=j.operateur_id;
      closeModal('recuModal'); buildAll();
      pushNotif('ok','fa-play','BDT <strong>'+recuBdtId+'</strong> réceptionné par <strong>'+(j.operateur||matricule)+'</strong>.'); recuBdtId=null;
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function openSoldageModal(bdtId){
  soldageBdtId=bdtId; var bdt=BDTS.find(function(b){return b.id===bdtId;}); if(!bdt) return;
  if(bdt.statut==='solde'){ pushNotif('info','fa-info-circle','Déjà soldé.'); return; }
  if(bdt.statut!=='recu'){ pushNotif('warn','fa-exclamation-triangle','Le BDT doit être « Reçu » avant le soldage.'); return; }
  var proc=PROCESS.find(function(p){return p.id===bdt.process;});
  document.getElementById('soldageInfo').innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.78rem;"><div><span style="color:#94a3b8;">BDT : </span><strong>'+bdt.id+'</strong></div><div><span style="color:#94a3b8;">Opération : </span>'+bdt.operation+'</div><div><span style="color:#94a3b8;">Process : </span>'+(proc?proc.nom:'—')+'</div><div><span style="color:#94a3b8;">Client : </span>'+bdt.client+'</div><div><span style="color:#94a3b8;">Durée allouée : </span><strong>'+bdt.tempsAlloue+'h</strong></div><div><span style="color:#94a3b8;">Pièce : </span>'+bdt.piece+'</div></div>';
  var now=new Date(); document.getElementById('s_fin').value=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  document.getElementById('s_resultat').value='ok'; document.getElementById('s_obs').value=''; document.getElementById('s_matricule').value=''; document.getElementById('s_pin').value='';
  var sg=document.getElementById('s_gravite'); if(sg) sg.value='Majeure';
  sResultatChange();
  var sm=document.getElementById('soldageModal'); if(sm) sm.style.display='flex';
}
// La gravité n'est demandée que si le résultat est « non-conformité » (elle décide du blocage d'expédition).
function sResultatChange(){ var r=(document.getElementById('s_resultat')||{}).value; var w=document.getElementById('s_grav_wrap'); if(w) w.style.display=(r==='nc')?'block':'none'; }
window.sResultatChange=sResultatChange;
function confirmerSoldage(){
  var bdt=BDTS.find(function(b){return b.id===soldageBdtId;}); if(!bdt) return;
  var finStr=document.getElementById('s_fin').value; var resultat=document.getElementById('s_resultat').value;
  var matricule=(document.getElementById('s_matricule').value||'').trim(); var pin=(document.getElementById('s_pin').value||'').trim();
  var obs=document.getElementById('s_obs').value||'';
  var gravNc=(document.getElementById('s_gravite')||{value:'Majeure'}).value||'Majeure';
  if(!finStr){ pushNotif('err','fa-exclamation-circle','Heure de fin manquante.'); return; }
  if(!matricule||!pin){ pushNotif('err','fa-id-badge','Matricule + code PIN requis pour solder.'); return; }
  fetch('/api/production/bdt/'+encodeURIComponent(soldageBdtId)+'/solder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({matricule:matricule,pin:pin,fin:finStr,resultat:resultat,obs:obs,gravite_nc:(resultat==='nc'?gravNc:null)})})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Soldage refusé (matricule / PIN incorrect ?).'); return; }
      bdt.statut='solde'; bdt.finReel=finStr; bdt.resultat=resultat; if(j.data&&j.data.temps_reel!=null) bdt.tempsReel=j.data.temps_reel;
      closeModal('soldageModal'); buildAll();
      pushNotif('ok','fa-check-double','BDT <strong>'+soldageBdtId+'</strong> soldé par <strong>'+(j.operateur||matricule)+'</strong>'+(bdt.tempsReel!=null?'. Temps réel : '+bdt.tempsReel+'h':'')+'.');
      if(resultat==='nc') pushNotif('err','fa-exclamation-triangle','Non-conformité <strong>'+gravNc+'</strong> enregistrée → Qualité notifiée'+((gravNc==='Critique'||gravNc==='Bloquante')?' · <strong>expédition BLOQUÉE</strong>':' (non bloquant)')+'.');
      soldageBdtId=null;
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function affectBDT(bdtId,procId,debut){
  var bdt=BDTS.find(function(b){return b.id===bdtId;}); if(!bdt) return;
  var proc=PROCESS.find(function(p){return p.id===procId;}); if(!proc) return;
  if(bdt.statut==='solde'){ pushNotif('err','fa-ban','BDT déjà soldé — réaffectation impossible.'); return; }
  if(!(proc.activite==='both'||proc.activite===bdt.activite)){ pushNotif('err','fa-ban','Incompatibilité activité : process '+proc.nom+' ('+proc.activite+') ≠ BDT '+bdt.activite); return; }
  var hasD=(debut!=null&&!isNaN(debut)); if(hasD) debut=Math.round(debut*100)/100;
  var body={process_id:procId, date_prevue:currentDate}; if(hasD) body.debut=debut;
  fetch('/api/production/bdt/'+encodeURIComponent(bdtId)+'/affecter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Affectation échouée.'); return; }
      var wasPending=(bdt.process==='pending'); bdt.process=procId; bdt.machineId=proc.machine_id||null; bdt.datePrevue=currentDate; if(hasD) bdt.debut=debut; if(bdt.statut==='a_programmer'||bdt.statut==='pending'||!bdt.statut) bdt.statut='programme';
      focusLot=null; updateFocusBanner(); buildAll(); pushNotif('ok','fa-check-circle','BDT <strong>'+bdtId+'</strong> '+(wasPending?'affecté au process':'déplacé sur')+' <strong>'+proc.nom+'</strong>'+(hasD?' à '+fmtHour(debut):'')+'.');
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function deprogramBDT(bdtId){
  var bdt=BDTS.find(function(b){return b.id===bdtId;}); if(!bdt) return;
  if(bdt.statut==='recu'||bdt.statut==='solde'){ pushNotif('warn','fa-exclamation-triangle','BDT déjà '+(bdt.statut==='solde'?'soldé':'reçu')+' — déprogrammation impossible.'); return; }
  if(bdt.process==='pending'){ return; }
  fetch('/api/production/bdt/'+encodeURIComponent(bdtId)+'/deprogrammer',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Déprogrammation échouée.'); return; }
      bdt.process='pending'; bdt.machineId=null; bdt.statut='a_programmer';
      buildAll(); pushNotif('ok','fa-undo','BDT <strong>'+bdtId+'</strong> déprogrammé → retour en file d\\'attente.');
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function onPendingOver(e){ e.preventDefault(); if(e.dataTransfer) e.dataTransfer.dropEffect='move'; var z=document.getElementById('pendingDropZone'); if(z) z.style.outline='2px dashed #f97316'; hideDropGuide(); }
function onPendingLeave(e){ var z=document.getElementById('pendingDropZone'); if(z) z.style.outline=''; }
function onPendingDrop(e){ e.preventDefault(); var z=document.getElementById('pendingDropZone'); if(z) z.style.outline=''; if(dragId){ var b=BDTS.find(function(x){return x.id===dragId;}); if(b&&b.process!=='pending') deprogramBDT(dragId); } dragId=null; _grabDX=0; clearHighlight(); }
function onPendDragStart(e,el){ dragId=el.dataset.bdtid; _grabDX=0; if(e.dataTransfer){ e.dataTransfer.setData('text/plain',dragId); e.dataTransfer.effectAllowed='move'; } var b=BDTS.find(function(x){return x.id===dragId;}); if(b) highlightLot(lotKey(b)); }
function onPendDragEnd(){ clearHighlight(); hideDropGuide(); dragId=null; _grabDX=0; }
function buildStats(){
  var procs=PROCESS.filter(function(p){ return procMatchesAct(p)&&procMatchesType(p); });
  var procIds=procs.map(function(p){return p.id;});
  var inView=BDTS.filter(function(b){ return procIds.indexOf(b.process)>=0; });
  var prog=inView.filter(function(b){return b.statut==='programme'||b.statut==='affecte';}).length;
  var recu=inView.filter(function(b){return b.statut==='recu';}).length;
  var solde=inView.filter(function(b){return b.statut==='solde';}).length;
  var nc=inView.filter(function(b){return b.statut==='solde'&&b.resultat==='nc';}).length;
  var pend=BDTS.filter(function(b){return b.process==='pending'&&b.statut!=='st'&&b.op!=='ST';}).length;
  var st=BDTS.filter(function(b){return b.statut==='st'||b.op==='ST';}).length;
  var items=[{icon:'fa-clipboard-list',val:prog,label:'Programmés',color:'#3b82f6'},{icon:'fa-play-circle',val:recu,label:'Reçus',color:'#f59e0b'},{icon:'fa-check-double',val:solde,label:'Soldés',color:'#22c55e'},{icon:'fa-exclamation-triangle',val:nc,label:'Soldés NC',color:'#ef4444'},{icon:'fa-inbox',val:pend,label:'En attente',color:'#f97316'},{icon:'fa-industry',val:st,label:'Sous-trait.',color:'#6366f1'},{icon:'fa-sitemap',val:procs.length,label:'Process',color:'#10b981'}];
  var sb=document.getElementById('statsBar'); if(sb) sb.innerHTML=items.map(function(s){return '<div class="stat-pill"><i class="fas '+s.icon+'" style="color:'+s.color+';font-size:.9rem;"></i><div style="font-size:1.2rem;font-weight:900;color:#1e293b;margin:2px 0;">'+s.val+'</div><div style="font-size:.62rem;color:#94a3b8;">'+s.label+'</div></div>';}).join('');
}
function oxyBox(o){
  if(o==='incolore') return '<span title="Oxydation incolore à faire pour le lot" style="display:inline-block;width:11px;height:11px;border:1.5px solid #94a3b8;background:#ffffff;border-radius:2px;vertical-align:middle;margin-right:3px;"></span>';
  if(o==='noire') return '<span title="Oxydation noire à produire pour le lot" style="display:inline-block;width:11px;height:11px;border:1.5px solid #cbd5e1;background:#111111;border-radius:2px;vertical-align:middle;margin-right:3px;"></span>';
  return '';
}
function openCmdMere(ref){ if(ref){ window.location.href='/production/commande/'+encodeURIComponent(ref); } else { pushNotif('warn','fa-exclamation-triangle','Aucune commande rattachée à ce BDT.'); } }
function validerCongeOp(id, decision){
  fetch('/api/rh/conge/'+encodeURIComponent(id)+'/valider',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:decision,valide_par:'Production'})})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
      pushNotif(decision==='refuse'?'warn':'ok',decision==='refuse'?'fa-times':'fa-check',decision==='refuse'?'Congé refusé.':('Congé validé · '+(j.absences_creees||0)+' jour(s) posés en absence.'),5000);
      setTimeout(function(){ softReload(); },800);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function presView(which){
  var g=document.getElementById('presView-grid'), c=document.getElementById('presView-conges');
  var bg=document.getElementById('presViewBtn-grid'), bc=document.getElementById('presViewBtn-conges');
  if(g) g.style.display=(which==='conges')?'none':'';
  if(c) c.style.display=(which==='conges')?'':'none';
  if(bg) bg.classList.toggle('active',which!=='conges');
  if(bc) bc.classList.toggle('active',which==='conges');
}
function buildPending(){
  var p=BDTS.filter(function(b){return b.process==='pending'&&b.statut!=='st'&&b.op!=='ST'&&(filtAct==='all'||b.activite===filtAct)&&affaireMatch(b);}); p.sort(pendSort); document.getElementById('cntPend').textContent=p.length;
  document.getElementById('pendingList').innerHTML=p.length?p.map(function(b){
    var col=lotColorOf(b); var lotLabel=b.lotId||b.numAffaire||'—';
    return '<div class="pending-card'+(String(b.id)===String(selBdtId)?' sel':'')+'" draggable="true" data-bdtid="'+b.id+'" data-lot="'+lotKey(b)+'" ondragstart="onPendDragStart(event,this)" ondragend="onPendDragEnd()" onclick="selectPendBdt(\\''+b.id+'\\')" ondblclick="openCmdMere(\\''+(b.cmdId||b.numAffaire||b.lotId||'')+'\\')" title="Double-clic : ouvrir la commande mère" id="pend-'+b.id+'">'
      +'<div style="width:8px;align-self:stretch;min-height:34px;border-radius:4px;flex-shrink:0;background:'+col+'" title="Lot '+lotLabel+'"></div>'
      +'<div style="flex:1;min-width:0;">'
        +'<div style="font-weight:700;color:#1e293b;font-size:.75rem;">'+oxyBox(b.oxydation)+b.id+' <span style="color:#94a3b8;font-weight:400;">· '+b.operation+'</span></div>'
        +'<div style="color:#94a3b8;font-size:.68rem;">'+b.client+' · '+b.piece+' · '+b.duree+'h · <span style="color:'+(b.activite==='Seem'?'#3b82f6':'#ec4899')+';font-weight:600;">'+b.activite+'</span></div>'
        +'<div style="font-size:.6rem;margin-top:3px;display:flex;gap:5px;flex-wrap:wrap;align-items:center;">'
          +'<span style="background:'+col+'22;color:'+col+';font-weight:700;border-radius:999px;padding:1px 7px;"><i class="fas fa-layer-group" style="margin-right:3px;"></i>'+lotLabel+'</span>'
          +(b.numAffaire?'<span style="color:#94a3b8;">Aff. '+b.numAffaire+'</span>':'')
          +(b.seq!=null?'<span style="color:#94a3b8;">Op.'+b.seq+'</span>':'')
          +(b.dateEcheance?'<span style="color:#ef4444;font-weight:600;"><i class="fas fa-flag-checkered" style="margin-right:3px;"></i>'+b.dateEcheance+'</span>':'')
        +'</div>'
      +'</div></div>';
  }).join(''):(filtAffaire?'<div style="text-align:center;padding:20px;color:#d1d5db;font-size:.75rem;"><i class="fas fa-search" style="display:block;font-size:1.5rem;margin-bottom:4px;"></i>Aucun BDT en attente pour « '+filtAffaire+' »</div>':'<div style="text-align:center;padding:20px;color:#d1d5db;font-size:.75rem;"><i class="fas fa-check-circle" style="display:block;font-size:1.5rem;margin-bottom:4px;"></i>Tous les BDT sont affectés</div>');
}
function buildST(){
  var cnt=document.getElementById('cntST'); var list=document.getElementById('stList'); if(!cnt||!list) return;
  var s=BDTS.filter(function(b){return b.statut==='st'||b.op==='ST';}); cnt.textContent=s.length;
  list.innerHTML=s.length?s.map(function(b){return '<div style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:8px;background:#ede9fe;border:1px solid #c4b5fd;font-size:.72rem;margin-bottom:4px;"><i class="fas fa-industry" style="color:#6366f1;flex-shrink:0;"></i><div style="flex:1;"><div style="font-weight:700;color:#4338ca;">'+b.id+' · '+b.operation+'</div><div style="color:#6366f1;">'+b.client+' · '+b.piece+' · '+b.duree+'h</div></div></div>';}).join(''):'<div style="text-align:center;padding:12px;color:#d1d5db;font-size:.72rem;">Aucune ST en cours</div>';
}
function populateSTOps(){
  var cont=document.getElementById('stOpsList'); if(cont) cont.innerHTML=OPS_ST_OPS.map(function(op){return '<span style="background:#ede9fe;color:#5b21b6;border:1px solid #c4b5fd;border-radius:999px;padding:2px 8px;font-size:.65rem;">'+op+'</span>';}).join('');
  var sel=document.getElementById('st_op'); if(sel) sel.innerHTML=OPS_ST_OPS.map(function(op){return '<option>'+op+'</option>';}).join('');
}
function showTT(e,bdt){ var proc=PROCESS.find(function(p){return p.id===bdt.process;}); var tt=document.getElementById('ganttTT'); tt.style.display='block'; tt.innerHTML='<div style="font-weight:700;font-size:.85rem;margin-bottom:4px;">'+bdt.id+'</div><div style="color:#93c5fd;font-size:.72rem;margin-bottom:8px;">'+bdt.operation+' · '+bdt.activite+'</div><div style="font-size:.72rem;line-height:1.6;"><div><span style="opacity:.6;">Client : </span>'+bdt.client+'</div><div><span style="opacity:.6;">Pièce : </span>'+bdt.piece+'</div><div><span style="opacity:.6;">Durée : </span>'+bdt.tempsAlloue+'h</div><div><span style="opacity:.6;">Process : </span>'+(proc?proc.nom:'—')+'</div><div><span style="opacity:.6;">Statut : </span><strong style="color:'+bdtColor(bdt)+';">'+bdtStatutLabel(bdt)+'</strong></div>'+(bdt.oxydation?'<div><span style="opacity:.6;">Oxydation : </span>'+oxyBox(bdt.oxydation)+(bdt.oxydation==='noire'?'noire (carré noir)':'incolore (carré blanc)')+'</div>':'')+'<div style="margin-top:4px;color:#fde68a;font-size:.65rem;">Dbl-clic = étape suivante · Clic droit = Reçu / Solder</div></div>'; moveTT(e); }
function moveTT(e){ var tt=document.getElementById('ganttTT'); if(tt){tt.style.left=(e.clientX+16)+'px'; tt.style.top=(e.clientY+10)+'px';} }
function hideTT(){ var tt=document.getElementById('ganttTT'); if(tt) tt.style.display='none'; }
function closeModal(id){ var el=document.getElementById(id); if(el) el.style.display='none'; }
function openBdtModal(){ var m=document.getElementById('bdtModal'); if(m) m.style.display='flex'; }
function openSTModal(){ var m=document.getElementById('stModal'); if(m) m.style.display='flex'; }
function updateModalOps(){ var act=document.getElementById('m_activite').value; var ops2=act==='Seem'?OPS_SEEM:act==='Semrac'?OPS_SEMRAC:[]; document.getElementById('m_operation').innerHTML='<option value="">— Choisir opération —</option>'+ops2.map(function(o){return '<option>'+o+'</option>';}).join(''); fillProcessSelect(); }
function fillProcessSelect(){ var act=document.getElementById('m_activite').value; var sel=document.getElementById('m_process'); if(!sel) return; var pr=PROCESS.filter(function(p){ return !act||p.activite===act||p.activite==='both'; }); sel.innerHTML='<option value="">— Non affecté (laisser en attente) —</option>'+pr.map(function(p){return '<option value="'+p.id+'">'+p.nom+(p.requiert_machine?' (machine)':' (manuel)')+'</option>';}).join(''); }
function updateModalOpsEligibles(){ var h=document.getElementById('compHint'); if(h) h.textContent=''; }
function createBDT(){
  var cmd=document.getElementById('m_cmd').value; var client=document.getElementById('m_client').value; var op=document.getElementById('m_operation').value; var piece=document.getElementById('m_piece').value;
  var duree=parseFloat(document.getElementById('m_duree').value)||1; var debut=parseFloat((document.getElementById('m_debut').value||'06:00').split(':')[0]); var prio=document.getElementById('m_priorite').value; var procId=document.getElementById('m_process').value||'pending'; var act=document.getElementById('m_activite').value;
  if(!cmd||!client||!op||!piece){ pushNotif('err','fa-exclamation-circle','Champs obligatoires manquants.'); return; }
  var statut=procId==='pending'?'a_programmer':'programme';
  var payload={num_affaire:cmd,client_nom:client,operation:op,piece:piece,duree:duree,debut:debut,priorite:prio,statut:statut,activite:act,temps_alloue:duree};
  var pr=null; if(procId!=='pending'){ pr=PROCESS.find(function(p){return p.id===procId;}); payload.process_id=procId; if(pr&&pr.machine_id) payload.machine_id=pr.machine_id; }
  fetch('/api/production/bdts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-exclamation-circle','Création échouée : '+((j&&j.error)||'')); return; }
      var nid=(j.data&&j.data.id)||('BDT-'+(900+BDTS.length+1));
      BDTS.push({id:nid,op:'',process:procId,client:client,piece:piece,operation:op,duree:duree,debut:debut,priorite:prio,statut:statut,resultat:null,activite:act,machineId:(pr&&pr.machine_id)||null,tempsAlloue:duree,debutReel:null,finReel:null});
      closeModal('bdtModal'); buildAll(); pushNotif('ok','fa-plus-circle','BDT <strong>'+nid+'</strong> créé.');
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function createST(){ pushNotif('ok','fa-paper-plane','Commande ST envoyée. Fournisseur notifié.'); closeModal('stModal'); }

// ─── Déclaration de sortie matière (double-clic BDT) ─────────
var STOCK_ARTS = ${sjX(STOCK_ARTS)};
function smArticleOptions(cat){
  var arts = STOCK_ARTS.filter(function(a){
    if(cat==='consommable') return (a.categorie||'').toLowerCase().indexOf('consom')>=0 || (a.categorie||'').toLowerCase().indexOf('outill')>=0;
    return true;
  });
  if(arts.length===0) arts=STOCK_ARTS;
  return '<option value="">— Choisir un article —</option>'+arts.map(function(a){ return '<option value="'+a.id+'" data-unite="'+(a.unite||'')+'">'+(a.designation||a.reference||a.id)+' ('+(a.stock_actuel!=null?a.stock_actuel:'?')+' '+(a.unite||'')+')</option>'; }).join('');
}
function openSortieMatiere(bdt){
  document.getElementById('sm_bdt_id').value=bdt.id;
  document.getElementById('sm_lot_id').value=bdt.lotId||'';
  document.getElementById('sm_info').innerHTML='<strong>'+bdt.id+'</strong> · '+(bdt.operation||'')+' · '+(bdt.piece||'')+(bdt.lotId?' · Lot '+bdt.lotId:'');
  var ok=document.querySelector('input[name=sm_cat][value=matiere]'); if(ok) ok.checked=true;
  document.getElementById('sm_qte').value='';
  document.getElementById('sm_motif').value='';
  // Machines : préselectionne la machine du process du BDT si dispo
  var msel=document.getElementById('sm_machine');
  if(msel){ msel.innerHTML='<option value="">— Choisir une machine —</option>'+MACHINES_PROC.map(function(m){return '<option value="'+m.id+'"'+(bdt.machineId&&String(bdt.machineId)===String(m.id)?' selected':'')+'>'+m.nom+'</option>';}).join(''); }
  var psel=document.getElementById('sm_poste'), prow=document.getElementById('sm_poste_row');
  if(psel && prow){ if(POSTES_JS && POSTES_JS.length){ psel.innerHTML=_posteOptions(''); prow.style.display='block'; } else prow.style.display='none'; }
  smToggleCat();
  var m=document.getElementById('sortieModal'); if(m) m.style.display='flex';
}
function smToggleCat(){
  var sel=document.querySelector('input[name=sm_cat]:checked'); var cat=sel?sel.value:'matiere';
  document.getElementById('sm_article').innerHTML=smArticleOptions(cat);
  document.getElementById('sm_machine_wrap').style.display=(cat==='consommable')?'block':'none';
}
function confirmSortie(){
  var bdtId=document.getElementById('sm_bdt_id').value;
  var lotId=document.getElementById('sm_lot_id').value;
  var sel=document.querySelector('input[name=sm_cat]:checked'); var cat=sel?sel.value:'matiere';
  var artSel=document.getElementById('sm_article'); var articleId=artSel.value;
  var articleNom=artSel.options[artSel.selectedIndex]?artSel.options[artSel.selectedIndex].text:'';
  var qte=parseFloat(document.getElementById('sm_qte').value)||0;
  var machineId=cat==='consommable'?document.getElementById('sm_machine').value:null;
  var posteEl=document.getElementById('sm_poste');
  var posteId=(cat==='consommable' && POSTES_JS && POSTES_JS.length && posteEl)?(posteEl.value||null):null;
  if(!articleId){ pushNotif('err','fa-exclamation-circle','Choisissez un article.'); return; }
  if(qte<=0){ pushNotif('err','fa-exclamation-circle','Quantité invalide.'); return; }
  if(cat==='consommable'&&!machineId&&!posteId){ pushNotif('err','fa-exclamation-circle','Choisissez une machine OU un poste (traçage OPEX).'); return; }
  var _body={bdt_id:bdtId,lot_id:lotId||null,article_id:articleId,article_nom:articleNom,categorie:cat,quantite:qte,machine_id:machineId,motif:document.getElementById('sm_motif').value||null};
  if(posteId) _body.poste_id=posteId;
  fetch('/api/production/sortie-matiere',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(_body)})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Sortie échouée.'); return; }
      closeModal('sortieModal');
      pushNotif('ok','fa-dolly','Sortie matière enregistrée'+(j.stock_apres!=null?' · stock restant '+j.stock_apres:'')+(j.opex_machine?' · tracée OPEX machine':(posteId?' · tracée OPEX poste':''))+'.',6000);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}

// ─── Présence opérateurs (planning hebdo) ────────────────────
var OPS_PRESENCE = ${sjX(opsForPresence)};
var PRESENCES = ${sjX(PRESENCES_JS)};
var ABSENCES_RH = ${sjX(ABSENCES_RH_JS)};
var presFiltAct='all';
var presWeekStart=(function(){ var d=new Date('${TODAY}'); var diff=(d.getDay()+6)%7; d.setDate(d.getDate()-diff); return d.toISOString().slice(0,10); })();
var PRES_SHIFTS={matin:['#dbeafe','#1d4ed8','Matin'],journee:['#dcfce7','#15803d','Journée'],soir:['#ede9fe','#5b21b6','Soir'],absent:['#fef2f2','#b91c1c','Absent']};
var PRES_CYCLE=['matin','journee','soir','absent',''];
function presDays(){ var arr=[]; var d=new Date(presWeekStart); for(var i=0;i<7;i++){ var x=new Date(d); x.setDate(d.getDate()+i); arr.push(x.toISOString().slice(0,10)); } return arr; }
function presKey(op,date){ return op+'|'+date; }
function presGet(op,date){
  // Absence RH prioritaire
  for(var i=0;i<ABSENCES_RH.length;i++){ if(String(ABSENCES_RH[i].operateur_id)===String(op)&&ABSENCES_RH[i].date===date) return {shift:'absent',rh:true,type:ABSENCES_RH[i].type}; }
  for(var j=0;j<PRESENCES.length;j++){ if(String(PRESENCES[j].operateur_id)===String(op)&&PRESENCES[j].date===date) return {shift:PRESENCES[j].shift,rh:false}; }
  return {shift:'',rh:false};
}
function presBuild(){
  var grid=document.getElementById('presGrid'); if(!grid) return;
  var days=presDays();
  var fr=new Date(days[0]), to=new Date(days[6]);
  var lbl=document.getElementById('presWeekLabel'); if(lbl) lbl.textContent='Sem. du '+fr.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})+' au '+to.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'});
  var ops=OPS_PRESENCE.filter(function(o){ return presFiltAct==='all'||o.activite===presFiltAct; });
  var html='<table style="width:100%;border-collapse:collapse;font-size:.78rem;"><thead><tr style="background:#1e293b;color:white;">'
    +'<th style="text-align:left;padding:9px 12px;min-width:200px;position:sticky;left:0;background:#1e293b;">Opérateur</th>';
  days.forEach(function(iso){ var d=new Date(iso); var we=(d.getDay()===0||d.getDay()===6); html+='<th style="padding:7px 4px;text-align:center;min-width:92px;'+(we?'opacity:.6;':'')+'"><div style="font-size:.62rem;opacity:.7;text-transform:uppercase;">'+d.toLocaleDateString('fr-FR',{weekday:'short'})+'</div><div style="font-weight:800;">'+d.getDate().toString().padStart(2,'0')+'/'+(d.getMonth()+1).toString().padStart(2,'0')+'</div></th>'; });
  html+='</tr></thead><tbody>';
  if(ops.length===0){ html+='<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8;">Aucun opérateur '+(presFiltAct!=='all'?presFiltAct:'')+'.</td></tr>'; }
  ops.forEach(function(o){
    var actCol=o.activite==='Seem'?'#3b82f6':'#ec4899';
    html+='<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 12px;position:sticky;left:0;background:white;border-right:1px solid #f1f5f9;"><div style="display:flex;align-items:center;gap:8px;"><span style="width:26px;height:26px;border-radius:50%;background:'+actCol+';color:white;font-size:.62rem;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">'+(o.nom||'').charAt(0)+'</span><div><div style="font-weight:700;color:#1e293b;">'+o.nom+'</div><div style="font-size:.6rem;color:'+actCol+';font-weight:700;">'+o.activite+(o.poste?' · '+o.poste:'')+'</div></div></div></td>';
    days.forEach(function(iso){
      var g=presGet(o.id,iso);
      var st=g.shift; var sc=st&&PRES_SHIFTS[st]?PRES_SHIFTS[st]:['#f8fafc','#94a3b8','—'];
      var lockTitle=g.rh?('Absence RH ('+(g.type||'')+')'):'Cliquer pour changer';
      html+='<td style="padding:4px;text-align:center;"><button '+(g.rh?'disabled':'')+' onclick="presCycle(\\''+o.id+'\\',\\''+iso+'\\',\\''+(o.nom||'').replace(/\\x27/g,'')+'\\',\\''+o.activite+'\\')" title="'+lockTitle+'" style="width:84px;padding:6px 4px;border-radius:7px;border:1px solid '+sc[0]+';background:'+sc[0]+';color:'+sc[1]+';font-size:.68rem;font-weight:700;cursor:'+(g.rh?'not-allowed':'pointer')+';">'+(g.rh?'<i class=\\'fas fa-lock\\' style=\\'margin-right:3px;font-size:.6rem;\\'></i>':'')+(st?sc[2]:'—')+'</button></td>';
    });
    html+='</tr>';
  });
  html+='</tbody></table>';
  grid.innerHTML=html;
}
function presCycle(op,date,nom,act){
  var cur=presGet(op,date); if(cur.rh) return;
  var idx=PRES_CYCLE.indexOf(cur.shift||''); var nxt=PRES_CYCLE[(idx+1)%PRES_CYCLE.length];
  // maj locale
  PRESENCES=PRESENCES.filter(function(p){ return !(String(p.operateur_id)===String(op)&&p.date===date); });
  if(nxt) PRESENCES.push({operateur_id:op,date:date,shift:nxt});
  presBuild();
  fetch('/api/production/presence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operateur_id:op,operateur_nom:nom,activite:act,date_presence:date,shift:nxt||'absent'})})
    .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok) pushNotif('err','fa-ban','Sauvegarde présence échouée.'); }).catch(function(){});
}
function presShiftWeek(d){ var dt=new Date(presWeekStart); dt.setDate(dt.getDate()+d*7); presWeekStart=dt.toISOString().slice(0,10); presBuild(); }
function presSetAct(a,btn){ presFiltAct=a; ['all','Seem','Semrac'].forEach(function(x){ var e=document.getElementById('pres-fa-'+x); if(e) e.classList.toggle('active',x===a); }); presBuild(); }

// ─── Modal : programmer la semaine entière ───────────────────
function openPresWeekModal(){
  var list=document.getElementById('presWkOpsList');
  if(list){
    var ops=OPS_PRESENCE.filter(function(o){ return presFiltAct==='all'||o.activite===presFiltAct; });
    list.innerHTML=ops.map(function(o){
      var actCol=o.activite==='Seem'?'#3b82f6':'#ec4899';
      return '<label style="display:flex;align-items:center;gap:8px;padding:6px 8px;cursor:pointer;border-radius:6px;" onmouseover="this.style.background=\\'#eef2ff\\'" onmouseout="this.style.background=\\'\\'">'
        +'<input type="checkbox" class="presWkOp" value="'+o.id+'" data-act="'+o.activite+'" style="accent-color:#f97316;"/>'
        +'<span style="width:22px;height:22px;border-radius:50%;background:'+actCol+';color:white;font-size:.58rem;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">'+(o.nom||'').charAt(0)+'</span>'
        +'<span style="font-size:.82rem;color:#1e293b;font-weight:600;">'+o.nom+'</span>'
        +'<span style="font-size:.62rem;color:'+actCol+';font-weight:700;margin-left:auto;">'+o.activite+'</span>'
        +'</label>';
    }).join('');
  }
  document.getElementById('presWeekModal').style.display='flex';
}
function closePresWeekModal(){ document.getElementById('presWeekModal').style.display='none'; }
function presWkPickAll(v){ document.querySelectorAll('.presWkOp').forEach(function(cb){ cb.checked=!!v; }); }
function presWkPickAct(act){
  document.querySelectorAll('.presWkOp').forEach(function(cb){ cb.checked=(cb.getAttribute('data-act')===act); });
}
function applyPresWeek(){
  var shift=document.getElementById('presWkShift').value;
  var jours=document.getElementById('presWkJours').value;
  var picks=Array.prototype.slice.call(document.querySelectorAll('.presWkOp:checked')).map(function(cb){ return cb.value; });
  if(picks.length===0){ pushNotif('err','fa-exclamation-circle','Sélectionnez au moins un opérateur.'); return; }
  var days=presDays();
  var ndays=(jours==='ouvres')?5:7;
  var calls=[];
  picks.forEach(function(opId){
    var opObj=OPS_PRESENCE.find(function(o){ return String(o.id)===String(opId); });
    if(!opObj) return;
    for(var i=0;i<ndays;i++){
      var iso=days[i];
      // Ne pas écraser une absence RH
      var rh=ABSENCES_RH.find(function(a){ return String(a.operateur_id)===String(opId) && a.date===iso; });
      if(rh) continue;
      // maj locale
      PRESENCES=PRESENCES.filter(function(p){ return !(String(p.operateur_id)===String(opId)&&p.date===iso); });
      if(shift) PRESENCES.push({operateur_id:opId,date:iso,shift:shift});
      calls.push(fetch('/api/production/presence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operateur_id:opId,operateur_nom:opObj.nom,activite:opObj.activite,date_presence:iso,shift:shift||'absent'})}));
    }
  });
  closePresWeekModal();
  presBuild();
  Promise.all(calls).then(function(){
    pushNotif('ok','fa-calendar-week','Semaine programmée pour '+picks.length+' opérateur'+(picks.length>1?'s':'')+' ('+calls.length+' jours mis à jour).',5500);
  }).catch(function(){ pushNotif('err','fa-ban','Certaines mises à jour ont échoué.'); });
}

// ─── Planning BST jour-par-jour ──────────────────────────────
var BST_DATA = ${sjX(bdsRowsForBst)};
var BST_FOURN = ${sjX(fournForBst)};
var BST_LOTS_OPTS = ${sjX(LOTS_BST.map(l=>({id:l.id,client:l.client_nom,piece:l.piece,qte:l.qte,cmd_id:l.cmd_id})))};
var LOT_COLORS = ${sjX(LOT_COLOR_MAP)};
var BST_OPS_ST = ${OPS_ST_J};
var BST_DAYS_N = 21;
var bstStartDate = '${TODAY}';

// Meme convention que lotKey() cote BDT (lotId = lot_id sinon lot_ref) : sans lot_id ici,
// un BDS renseigne uniquement par lot_id ne rejoindrait pas la gamme de ses BDT.
function bstLotKey(b){ return b.lot_id || b.lot_ref || b.cmd_ref || b.cmd_id || ('id:'+b.id); }
function bstLotColor(b){ return LOT_COLORS[bstLotKey(b)] || '#6366f1'; }
function bstDuration(b){
  if (b.duree_days) return Math.max(1, Number(b.duree_days));
  if (b.date_envoi && b.date_retour_prevue) {
    var a=new Date(b.date_envoi), c=new Date(b.date_retour_prevue);
    return Math.max(1, Math.round((c.getTime()-a.getTime())/86400000));
  }
  return 5;
}
function bstStart(b){ return b.date_debut || b.date_envoi || null; }
function bstDayList(){
  var arr=[]; var d=new Date(bstStartDate);
  for(var i=0;i<BST_DAYS_N;i++){ var x=new Date(d); x.setDate(d.getDate()+i); arr.push(x.toISOString().slice(0,10)); }
  return arr;
}
function bstBuildKpis(){
  var c=document.getElementById('bstKpis'); if(!c) return;
  var nbT=BST_DATA.length;
  var nbPend=BST_DATA.filter(function(b){return !bstStart(b)||b.statut==='a_planifier';}).length;
  var nbAtt=BST_DATA.filter(function(b){return bstStart(b)&&b.statut==='a_envoyer';}).length;
  var nbEnv=BST_DATA.filter(function(b){return b.statut==='envoye';}).length;
  var nbRev=BST_DATA.filter(function(b){return b.statut==='recu'||b.statut==='solde';}).length;
  var items=[
    {ic:'fa-cube',col:'#6366f1',val:nbT,lbl:'BST total'},
    {ic:'fa-inbox',col:'#f97316',val:nbPend,lbl:'À planifier'},
    {ic:'fa-hourglass-half',col:'#f59e0b',val:nbAtt,lbl:"En attente d'envoi"},
    {ic:'fa-paper-plane',col:'#0ea5e9',val:nbEnv,lbl:'Envoyés (chez ST)'},
    {ic:'fa-check-double',col:'#22c55e',val:nbRev,lbl:'Revenus'},
  ];
  c.innerHTML=items.map(function(s){return '<div class="stat-pill" style="display:flex;align-items:center;gap:10px;padding:10px 12px;"><div style="width:34px;height:34px;border-radius:10px;background:'+s.col+'22;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas '+s.ic+'" style="color:'+s.col+';"></i></div><div style="text-align:left;"><div style="font-size:1.2rem;font-weight:900;color:#1e293b;line-height:1;">'+s.val+'</div><div style="font-size:.62rem;color:#94a3b8;margin-top:2px;">'+s.lbl+'</div></div></div>';}).join('');
}
function bstBuildHeader(){
  var hdr=document.getElementById('bstHeader'); if(!hdr) return;
  var days=bstDayList();
  var html='<div style="padding:10px 14px;font-weight:700;font-size:.7rem;color:#94a3b8;border-right:1px solid rgba(255,255,255,.1);align-self:center;">Sous-traitant · Process</div>';
  days.forEach(function(iso){
    var d=new Date(iso); var dow=d.getDay(); var isWE=(dow===0||dow===6); var isToday=iso==='${TODAY}';
    var bg=isToday?'background:#7c2d12;':isWE?'background:#0f172a;color:#475569;':'';
    html+='<div style="padding:5px 2px;text-align:center;border-left:1px solid rgba(255,255,255,.06);'+bg+'">'+
      '<div style="opacity:.55;text-transform:uppercase;font-size:.58rem;">'+d.toLocaleDateString('fr-FR',{weekday:'short'}).slice(0,3)+'</div>'+
      '<div style="font-weight:900;font-size:.78rem;">'+d.getDate().toString().padStart(2,'0')+'</div>'+
      '<div style="opacity:.45;font-size:.55rem;">'+(d.getMonth()+1).toString().padStart(2,'0')+'</div>'+
    '</div>';
  });
  hdr.innerHTML=html;
}
function bstBuildBody(){
  var body=document.getElementById('bstBody'); if(!body) return; body.innerHTML='';
  var days=bstDayList(); var startMs=new Date(days[0]).getTime();
  if(BST_FOURN.length===0){ body.innerHTML='<div style="text-align:center;padding:50px;color:#94a3b8;font-size:.82rem;"><i class="fas fa-industry" style="font-size:2rem;display:block;margin-bottom:8px;opacity:.3;"></i>Aucun sous-traitant en base de données.</div>'; return; }
  var _bstFocusSet=focusLotBst?bstLotFournSet(focusLotBst):null;
  BST_FOURN.filter(function(f){ return !_bstFocusSet||_bstFocusSet[String(f.id)]; }).forEach(function(f){
    var row=document.createElement('div'); row.className='bst-row bst-grid';
    var info=document.createElement('div'); info.className='bst-info-cell';
    var ops=(f.operations&&f.operations.length?f.operations:[f.operation]).filter(Boolean);
    var otd=f.otd; var otdC=(otd==null)?'#94a3b8':(otd>=90?'#22c55e':otd>=75?'#f59e0b':'#ef4444');
    var procPills=ops.slice(0,3).map(function(o){return '<span style="background:#ede9fe;color:#5b21b6;border:1px solid #c4b5fd;border-radius:999px;padding:1px 7px;font-size:.58rem;font-weight:700;">'+o+'</span>';}).join(' ');
    info.innerHTML='<div style="font-weight:800;color:#1e293b;font-size:.78rem;">'+f.nom+'</div>'+
      '<div style="font-size:.6rem;color:#64748b;">'+(f.localisation||'')+' · '+(f.qualification||'—')+'</div>'+
      '<div style="display:flex;gap:3px;flex-wrap:wrap;margin-top:2px;">'+procPills+'</div>'+
      '<div style="font-size:.6rem;display:flex;gap:6px;align-items:center;margin-top:auto;">'+
        '<span>OTD <strong style="color:'+otdC+';">'+(otd==null?'—':otd+'%')+'</strong></span>'+
        (f.statut!=='actif'?'<span style="background:#fef2f2;color:#b91c1c;border-radius:6px;padding:0 6px;font-weight:700;">'+f.statut+'</span>':'')+
      '</div>';
    row.appendChild(info);
    days.forEach(function(iso){
      var c=document.createElement('div'); c.className='bst-day';
      var d=new Date(iso); var dow=d.getDay(); var isWE=(dow===0||dow===6); var isToday=iso==='${TODAY}';
      if(isWE) c.classList.add('weekend'); if(isToday) c.classList.add('today');
      c.dataset.fourn=f.id; c.dataset.day=iso;
      c.addEventListener('dragover', function(e){ e.preventDefault(); c.classList.add('dragover'); });
      c.addEventListener('dragleave', function(){ c.classList.remove('dragover'); });
      c.addEventListener('drop', function(e){ e.preventDefault(); c.classList.remove('dragover'); var id=e.dataTransfer.getData('text/plain'); if(id) bstAssignDay(id, f.id, iso); });
      c.addEventListener('click', function(){ if(!bstSelectedId) return; bstAssignDay(bstSelectedId, f.id, iso); bstSelectedId=null; });
      row.appendChild(c);
    });
    body.appendChild(row);
    var bsts=BST_DATA.filter(function(b){ return String(b.sous_traitant_id||'')===String(f.id); });
    bsts.forEach(function(b){
      var s=bstStart(b); if(!s) return;
      var sMs=new Date(s).getTime();
      var startDay=Math.round((sMs-startMs)/86400000);
      var dur=bstDuration(b);
      if(startDay>=BST_DAYS_N) return;
      if(startDay+dur<=0) return;
      var leftDay=Math.max(0,startDay);
      var widthDay=Math.min(BST_DAYS_N-leftDay,(startDay+dur)-leftDay);
      if(widthDay<=0) return;
      var col=bstLotColor(b);
      var bar=document.createElement('div'); bar.className='bst-bar '+(b.statut||'');
      bar.draggable=true; bar.dataset.bstid=b.id; bar.dataset.lot=bstLotKey(b);
      bar.style.cssText+='background:'+col+';';
      var pctLeft=((240 + (row.clientWidth-240)*leftDay/BST_DAYS_N));
      var pctWidth=((row.clientWidth-240)*widthDay/BST_DAYS_N - 4);
      bar.style.left='calc(240px + '+leftDay+' * ((100% - 240px) / '+BST_DAYS_N+'))';
      bar.style.width='calc('+widthDay+' * ((100% - 240px) / '+BST_DAYS_N+') - 6px)';
      var stIcon=b.statut==='a_envoyer'?'<i class="fas fa-hourglass-half ic"></i>':b.statut==='envoye'?'<i class="fas fa-paper-plane ic"></i>':(b.statut==='recu'||b.statut==='solde')?'<i class="fas fa-check-double ic"></i>':'<i class="fas fa-industry ic"></i>';
      bar.innerHTML=
        '<div style="font-weight:800;font-size:.66rem;opacity:.95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+stIcon+b.id+'</div>'+
        '<div style="font-weight:700;font-size:.64rem;opacity:.92;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+(b.operation||'—')+'</div>'+
        '<div style="font-size:.58rem;opacity:.82;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><i class="fas fa-layer-group" style="margin-right:3px;opacity:.7;"></i>'+(b.lot_ref||'—')+' · '+(b.piece||'—')+'</div>'+
        '<div style="font-size:.55rem;opacity:.75;">'+dur+'j · qté '+(b.qte||'?')+'</div>';
      bar.addEventListener('dragstart', function(e){
        e.dataTransfer.setData('text/plain', b.id); e.dataTransfer.effectAllowed='move';
        bar.style.opacity='.5'; bstHighlightLot(bstLotKey(b));
      });
      bar.addEventListener('dragend', function(){ bar.style.opacity=''; bstClearHighlight(); });
      bar.addEventListener('contextmenu', function(e){ e.preventDefault(); bstOpenCtxMenu(e, b); });
      bar.addEventListener('click', function(e){ e.stopPropagation(); if(bar._clkT) return; bar._clkT=setTimeout(function(){ bar._clkT=null; focusBstLot(b.id); },230); });
      bar.addEventListener('dblclick', function(){ if(bar._clkT){ clearTimeout(bar._clkT); bar._clkT=null; } var ref=b.cmd_ref||b.cmd_id; if(ref){ window.location.href='/production/commande/'+encodeURIComponent(ref); } else { pushNotif('warn','fa-exclamation-triangle','Aucune commande rattachée à ce BST.'); } });
      bar.addEventListener('mouseenter', function(e){ bstShowTT(e, b); });
      bar.addEventListener('mousemove', bstMoveTT);
      bar.addEventListener('mouseleave', bstHideTT);
      row.appendChild(bar);
    });
  });
}
function bstBuildPending(){
  var cont=document.getElementById('bstPendingList'); if(!cont) return;
  var pending=BST_DATA.filter(function(b){ return !bstStart(b) || b.statut==='a_planifier' || !b.sous_traitant_id; });
  var cn=document.getElementById('bstPendingCnt'); if(cn) cn.textContent=String(pending.length);
  if(!pending.length){ cont.innerHTML='<div style="text-align:center;padding:18px;color:#cbd5e1;font-size:.78rem;width:100%;"><i class="fas fa-check-circle" style="display:block;font-size:1.4rem;margin-bottom:4px;"></i>Tous les BST sont planifiés</div>'; return; }
  cont.innerHTML=pending.map(function(b){
    var col=bstLotColor(b);
    return '<div class="bst-pending-card" draggable="true" data-bstid="'+b.id+'" data-lot="'+bstLotKey(b)+'" title="Double-clic : ouvrir la commande mère">'+
      '<div class="strip" style="background:'+col+';"></div>'+
      '<div style="margin-left:8px;">'+
        '<div style="font-size:.7rem;font-weight:800;color:#1e293b;">'+b.id+'</div>'+
        '<div style="font-size:.66rem;color:#475569;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">'+(b.operation||'—')+'</div>'+
        '<div style="font-size:.6rem;color:#94a3b8;">'+(b.lot_ref||'—')+' · '+(b.piece||'—')+' · qté '+(b.qte||'?')+'</div>'+
        '<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">'+
          '<span style="background:'+col+'22;color:'+col+';font-weight:700;border-radius:999px;padding:1px 6px;font-size:.56rem;"><i class="fas fa-layer-group" style="margin-right:2px;"></i>'+(b.lot_ref||'—')+'</span>'+
          (b.cmd_ref?'<span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:1px 6px;font-size:.56rem;font-weight:700;">'+b.cmd_ref+'</span>':'')+
        '</div>'+
      '</div></div>';
  }).join('');
  Array.prototype.forEach.call(cont.querySelectorAll('.bst-pending-card'), function(el){
    var id=el.dataset.bstid, lk=el.dataset.lot;
    el.addEventListener('dragstart', function(e){ e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed='move'; el.style.opacity='.5'; bstHighlightLot(lk); });
    el.addEventListener('dragend', function(){ el.style.opacity=''; bstClearHighlight(); });
    el.addEventListener('contextmenu', function(e){ e.preventDefault(); var b=BST_DATA.find(function(x){return x.id===id;}); if(b) bstOpenCtxMenu(e,b); });
    el.addEventListener('click', function(){ bstSelectedId=id; focusLotBst=id; updateBstFocusBanner(); bstBuildBody(); pushNotif('info','fa-mouse-pointer','BST <strong>'+id+'</strong> sélectionné — son sous-traitant et ceux des étapes voisines restent affichés. Cliquez une case jour pour planifier.'); });
    el.addEventListener('dblclick', function(){ var b=BST_DATA.find(function(x){return x.id===id;}); var ref=b&&(b.cmd_ref||b.cmd_id); if(ref){ window.location.href='/production/commande/'+encodeURIComponent(ref); } else { pushNotif('warn','fa-exclamation-triangle','Aucune commande rattachée à ce BST.'); } });
  });
}
var bstSelectedId=null;
// ── Focus « etape » BST : au clic d un BDS, ne garder que SON sous-traitant + celui de
//    l etape PRECEDENTE et de l etape SUIVANTE du meme lot (symetrie avec le Gantt BDT).
//    focusLotBst contient l ID DU BDS focalise (et non la cle du lot).
var focusLotBst=null;
// Gamme complete du lot vue depuis la sous-traitance : BDS + BDT internes (pour que
// « avant / apres » reste juste quand l etape voisine est faite a l atelier).
function bstEtapesDuLot(key){
  var l=BST_DATA.filter(function(b){ return bstLotKey(b)===key; })
    .map(function(b){ return { id:b.id, seq:b.seq, ord:String(b.date_envoi||b.date_debut||''), st:true, ref:b, sous_traitant_id:b.sous_traitant_id }; });
  if(typeof BDTS!=='undefined' && BDTS){
    BDTS.forEach(function(b){ if(lotKey(b)===key) l.push({ id:b.id, seq:b.seq, ord:'', st:false, ref:b, sous_traitant_id:null }); });
  }
  l.sort(function(a,b){
    var sa=(a.seq==null?9999:Number(a.seq)), sb=(b.seq==null?9999:Number(b.seq));
    if(sa!==sb) return sa-sb;
    return String(a.ord).localeCompare(String(b.ord));
  });
  return l;
}
function bstLotFournSet(bstId){
  var b=BST_DATA.find(function(x){return x.id===bstId;}); if(!b) return null;
  var l=bstEtapesDuLot(bstLotKey(b));
  var i=-1; for(var k=0;k<l.length;k++){ if(l[k].id===b.id){ i=k; break; } }
  if(i<0) return null;
  var s={};
  // Seules les etapes sous-traitees ont une ligne dans ce planning (les etapes internes
  // sont nommees dans le bandeau mais n ajoutent pas de sous-traitant).
  [l[i-1], l[i], l[i+1]].forEach(function(x){ if(x && x.st && x.sous_traitant_id) s[String(x.sous_traitant_id)]=true; });
  return s;
}
function bstEtapeLabel(bstId){
  var b=BST_DATA.find(function(x){return x.id===bstId;}); if(!b) return '';
  var l=bstEtapesDuLot(bstLotKey(b));
  var i=-1; for(var k=0;k<l.length;k++){ if(l[k].id===b.id){ i=k; break; } }
  var nomST=function(x){
    if(!x) return null;
    if(!x.st) return 'atelier ' + (x.ref.operation || '');            // etape interne
    var f=BST_FOURN.find(function(z){ return String(z.id)===String(x.sous_traitant_id); });
    return f?f.nom:(x.ref.operation||null);
  };
  var av=nomST(l[i-1]), ap=nomST(l[i+1]), moi=nomST(l[i])||b.operation||'';
  var ctx=[]; if(av) ctx.push('avant : '+av); if(ap) ctx.push('apres : '+ap);
  return bstLotKey(b)+' \\u00b7 etape '+(i+1)+'/'+l.length+' \\u2014 '+moi+(ctx.length?' ('+ctx.join(' \\u00b7 ')+')':' (seule etape)');
}
function updateBstFocusBanner(){ var el=document.getElementById('bstFocusBanner'); if(!el) return; if(focusLotBst){ el.style.display='flex'; var l=document.getElementById('bstFocusLabel'); if(l) l.textContent=bstEtapeLabel(focusLotBst); } else { el.style.display='none'; } }
function focusBstLot(bstId){ var b=BST_DATA.find(function(x){return x.id===bstId;}); if(!b) return; focusLotBst=(focusLotBst===bstId)?null:bstId; updateBstFocusBanner(); bstBuildBody(); }
function clearFocusLotBst(){ focusLotBst=null; updateBstFocusBanner(); bstBuildBody(); }
function bstHighlightLot(key){
  document.querySelectorAll('.bst-bar,.bst-pending-card').forEach(function(el){
    if(el.dataset.lot===key){ el.style.outline='3px solid #facc15'; el.style.outlineOffset='1px'; el.style.zIndex='25'; }
    else { el.style.opacity='.3'; }
  });
}
function bstClearHighlight(){
  document.querySelectorAll('.bst-bar,.bst-pending-card').forEach(function(el){ el.style.outline=''; el.style.outlineOffset=''; el.style.zIndex=''; el.style.opacity=''; });
}
function bstShowTT(e, b){
  var tt=document.getElementById('bstTT');
  if(!tt){ tt=document.createElement('div'); tt.id='bstTT'; tt.style.cssText='position:fixed;background:#0f172a;color:white;border-radius:10px;padding:10px 14px;font-size:.72rem;pointer-events:none;z-index:1000;max-width:300px;box-shadow:0 8px 28px rgba(0,0,0,.4);'; document.body.appendChild(tt); }
  tt.style.display='block';
  tt.innerHTML='<div style="font-weight:800;font-size:.85rem;margin-bottom:4px;">'+b.id+'</div>'+
    '<div style="color:#93c5fd;margin-bottom:6px;">'+(b.operation||'—')+'</div>'+
    '<div style="line-height:1.55;">'+
      '<div><span style="opacity:.6;">Lot :</span> <strong>'+(b.lot_ref||'—')+'</strong></div>'+
      '<div><span style="opacity:.6;">Commande :</span> '+(b.cmd_ref||b.cmd_id||'—')+'</div>'+
      '<div><span style="opacity:.6;">Pièce :</span> '+(b.piece||'—')+'</div>'+
      '<div><span style="opacity:.6;">Qté :</span> '+(b.qte||'?')+'</div>'+
      '<div><span style="opacity:.6;">Durée :</span> '+bstDuration(b)+' jours</div>'+
      '<div><span style="opacity:.6;">Statut :</span> <strong>'+(b.statut||'—')+'</strong></div>'+
      '<div style="margin-top:6px;color:#fde68a;font-size:.6rem;">Glisser pour déplacer · Clic droit = menu (commande/lot)</div>'+
    '</div>';
  bstMoveTT(e);
}
function bstMoveTT(e){ var tt=document.getElementById('bstTT'); if(tt){ tt.style.left=(e.clientX+16)+'px'; tt.style.top=(e.clientY+10)+'px'; } }
function bstHideTT(){ var tt=document.getElementById('bstTT'); if(tt) tt.style.display='none'; }
function bstOpenCtxMenu(e, b){
  var ex=document.getElementById('bstCtxMenu'); if(ex) ex.remove();
  var menu=document.createElement('div'); menu.id='bstCtxMenu';
  menu.style.cssText='position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;background:white;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.2);z-index:9999;min-width:240px;border:1px solid #f1f5f9;overflow:hidden;';
  var title=document.createElement('div');
  title.style.cssText='padding:.5rem .7rem;font-size:.7rem;font-weight:700;color:#64748b;background:#f8fafc;border-bottom:1px solid #f1f5f9;';
  title.innerHTML='<i class="fas fa-industry" style="margin-right:5px;color:#6366f1;"></i>'+b.id+' · '+(b.lot_ref||'');
  menu.appendChild(title);
  var actions=[];
  var cmdRef=b.cmd_ref||b.cmd_id;
  var lotRef=b.lot_ref||b.lot_id;
  if(cmdRef) actions.push({icon:'fa-file-invoice',color:'#3b82f6',label:'Ouvrir la commande ('+cmdRef+')',href:'/production/commande/'+encodeURIComponent(cmdRef)});
  if(lotRef) actions.push({icon:'fa-layer-group',color:'#6366f1',label:'Ouvrir le lot ('+lotRef+')',href:'/production/lot/'+encodeURIComponent(lotRef)});
  if(actions.length){
    var sep=document.createElement('div'); sep.style.cssText='padding:.32rem .7rem;font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;background:#fafbfc;border-bottom:1px solid #f1f5f9;'; sep.textContent='Navigation';
    menu.appendChild(sep);
  }
  // Le statut (envoyé / revenu) se pilote depuis le Bon de Commande ST en Expéditions,
  // pas depuis le planning. On propose donc un accès direct au BC lié.
  if(b.bc_id){
    var sep2=document.createElement('div'); sep2.style.cssText='padding:.32rem .7rem;font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;background:#fafbfc;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;'; sep2.textContent='Bon de commande ST · '+b.bc_id;
    menu.appendChild(sep2);
    actions.push({icon:'fa-file-contract',color:'#0ea5e9',label:'Ouvrir le BC sous-traitant',href:'/expeditions/service#bc'});
  }
  actions.push({icon:'fa-undo',color:'#f97316',label:'Déplanifier (retour à l\\'attente)',cb:function(){ bstUnschedule(b.id); }});
  actions.forEach(function(a){
    var item=document.createElement('div');
    item.style.cssText='padding:.48rem .7rem;font-size:.78rem;cursor:pointer;color:#374151;transition:background .1s;';
    item.innerHTML='<i class="fas '+a.icon+'" style="margin-right:6px;color:'+a.color+';width:16px;"></i>'+a.label;
    item.addEventListener('mouseenter', function(){ item.style.background='#f1f5f9'; });
    item.addEventListener('mouseleave', function(){ item.style.background=''; });
    item.addEventListener('click', function(){ menu.remove(); if(a.href) window.location.href=a.href; else if(a.cb) a.cb(); });
    menu.appendChild(item);
  });
  document.body.appendChild(menu);
  setTimeout(function(){ document.addEventListener('click', function h(){ menu.remove(); document.removeEventListener('click', h); }, {once:true}); }, 50);
}
function bstAssignDay(bstId, fournId, dayIso){
  var b=BST_DATA.find(function(x){return x.id===bstId;}); if(!b) return;
  var prev={sous_traitant_id:b.sous_traitant_id, date_envoi:b.date_envoi, date_debut:b.date_debut, statut:b.statut, bc_id:b.bc_id};
  b.sous_traitant_id=fournId; b.date_envoi=dayIso; b.date_debut=dayIso;
  // Affecter un BST = en attente d'envoi (le statut sera piloté ensuite par le BC ST).
  if(b.statut==='a_planifier'||!b.statut) b.statut='a_envoyer';
  bstSelectedId=null; focusLotBst=null; updateBstFocusBanner();
  bstBuildBody(); bstBuildPending(); bstBuildKpis();
  // Affectation : crée/relie automatiquement le BC sous-traitant (apparaît dans Expéditions).
  fetch('/api/production/bst/'+encodeURIComponent(bstId)+'/affecter-st', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({sous_traitant_id:fournId, day:dayIso, duree_days:b.duree_days||5})
  }).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){
      Object.assign(b, prev); bstBuildBody(); bstBuildPending(); bstBuildKpis();
      pushNotif('err','fa-ban',(j&&j.error)||'Affectation BST échouée.');
      return;
    }
    if(j.bc_id) b.bc_id=j.bc_id;
    bstBuildBody();
    pushNotif('ok','fa-check-circle','BST <strong>'+bstId+'</strong> affecté au '+dayIso+'. BC <strong>'+(j.bc_id||'')+'</strong> créé (en attente d\\'envoi).',6000);
  }).catch(function(){
    Object.assign(b, prev); bstBuildBody(); bstBuildPending(); bstBuildKpis();
    pushNotif('err','fa-exclamation-circle','Erreur réseau — modification annulée.');
  });
}
function bstSetStatus(id, st){
  var b=BST_DATA.find(function(x){return x.id===id;}); if(!b) return;
  var prev=b.statut; b.statut=st; bstBuildBody(); bstBuildKpis();
  fetch('/api/production/bds/'+encodeURIComponent(id), {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({statut:st})})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ b.statut=prev; bstBuildBody(); bstBuildKpis(); pushNotif('err','fa-ban','Échec mise à jour statut.'); return; }
      pushNotif('ok','fa-check','Statut BST → '+st);
    }).catch(function(){ b.statut=prev; bstBuildBody(); bstBuildKpis(); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function bstUnschedule(id){
  var b=BST_DATA.find(function(x){return x.id===id;}); if(!b) return;
  var prev={statut:b.statut, date_debut:b.date_debut, date_envoi:b.date_envoi};
  b.statut='a_planifier'; b.date_debut=null; b.date_envoi=null;
  bstBuildBody(); bstBuildPending(); bstBuildKpis();
  fetch('/api/production/bds/'+encodeURIComponent(id), {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({statut:'a_planifier', date_debut:null, date_envoi:null})})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ Object.assign(b, prev); bstBuildBody(); bstBuildPending(); bstBuildKpis(); pushNotif('err','fa-ban','Échec déplanification.'); return; }
      pushNotif('ok','fa-undo','BST '+id+' remis en attente.');
    }).catch(function(){ Object.assign(b, prev); bstBuildBody(); bstBuildPending(); bstBuildKpis(); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function bstShiftDate(d){ var dt=new Date(bstStartDate); dt.setDate(dt.getDate()+d); bstStartDate=dt.toISOString().slice(0,10); var i=document.getElementById('bstStartDate'); if(i) i.value=bstStartDate; bstBuildHeader(); bstBuildBody(); }
function bstReload(v){ bstStartDate=v; bstBuildHeader(); bstBuildBody(); }
function bstBuildAll(){ bstBuildKpis(); bstBuildHeader(); bstBuildBody(); bstBuildPending(); }
function bstOpenNewModal(){
  var ml=document.getElementById('bst_lot'); if(ml) ml.innerHTML='<option value="">— Choisir un lot —</option>'+BST_LOTS_OPTS.map(function(l){return '<option value="'+l.id+'" data-cmd="'+(l.cmd_id||'')+'" data-piece="'+(l.piece||'')+'" data-client="'+(l.client||'')+'" data-qte="'+(l.qte||'')+'">'+l.id+' · '+(l.piece||'')+'</option>';}).join('');
  var mf=document.getElementById('bst_fourn'); if(mf) mf.innerHTML='<option value="">— Choisir un sous-traitant —</option>'+BST_FOURN.map(function(f){return '<option value="'+f.id+'">'+f.nom+' ('+(f.operations&&f.operations[0]||f.operation||'')+')</option>';}).join('');
  var mo=document.getElementById('bst_op'); if(mo) mo.innerHTML=BST_OPS_ST.map(function(o){return '<option>'+o+'</option>';}).join('');
  var m=document.getElementById('bstNewModal'); if(m) m.style.display='flex';
}
function bstCreate(){
  var lotEl=document.getElementById('bst_lot'); var lotId=lotEl?lotEl.value:'';
  var lotOpt=lotEl&&lotEl.selectedOptions[0];
  var fournId=document.getElementById('bst_fourn').value;
  var op=document.getElementById('bst_op').value;
  var qte=parseInt(document.getElementById('bst_qte').value)||(lotOpt?(parseInt(lotOpt.dataset.qte)||1):1);
  var start=document.getElementById('bst_start').value||'${TODAY}';
  var dur=parseInt(document.getElementById('bst_dur').value)||5;
  if(!lotId){ pushNotif('err','fa-exclamation-circle','Sélectionner un lot.'); return; }
  if(!fournId){ pushNotif('err','fa-exclamation-circle','Sélectionner un sous-traitant.'); return; }
  fetch('/api/production/bst/affecter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lot_id:lotId,fournisseur_id:fournId})})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Création BST échouée.'); return; }
      var newId=(j.data&&j.data.id)||('BST-NEW-'+Date.now());
      var f=BST_FOURN.find(function(x){return x.id===fournId;});
      var newRow={
        id:newId, lot_ref:lotId, cmd_ref:lotOpt?lotOpt.dataset.cmd:null,
        sous_traitant_id:fournId, piece:lotOpt?lotOpt.dataset.piece:null, client_nom:lotOpt?lotOpt.dataset.client:null,
        operation:op, qte:qte, statut:'envoye', date_envoi:start, date_debut:start, duree_days:dur
      };
      BST_DATA.push(newRow);
      // Si la nouvelle clé de lot n'a pas de couleur, en attribuer une
      var k=lotId; if(!LOT_COLORS[k]){ var existing=Object.values(LOT_COLORS); var palette=['#2563eb','#db2777','#f59e0b','#059669','#7c3aed','#0891b2','#dc2626','#65a30d','#ea580c','#0d9488','#9333ea','#ca8a04','#0ea5e9','#c026d3','#16a34a','#e11d48','#4f46e5','#d97706']; LOT_COLORS[k]=palette[existing.length%palette.length]; }
      // Si la date d'envoi tombe au-delà de cette PATCH (création), on persiste aussi les dates
      fetch('/api/production/bds/'+encodeURIComponent(newId),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({date_envoi:start,date_debut:start,duree_days:dur,operation:op,qte:qte})}).catch(function(){});
      document.getElementById('bstNewModal').style.display='none';
      bstBuildAll();
      pushNotif('ok','fa-paper-plane','BST <strong>'+newId+'</strong> créé · '+(f?f.nom:'ST'));
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}

// ─── Recherche tableaux ──────────────────────────────────────
${PROD_SEARCH_FN}

// ─── Dashboard Programmation ─────────────────────────────────
function shiftWeek(d){ var dt=new Date(document.getElementById('dashDate').value); dt.setDate(dt.getDate()+d*7); document.getElementById('dashDate').value=dt.toISOString().split('T')[0]; }
function updateDashDay(v){}

// ─── Dashboard Production ────────────────────────────────────
var _dupBdtId=null;
var _dupBdtData=${sjX(bdtsToday2.map(b=>({id:b.id,client:b.client,piece:b.piece,operation:b.operation,duree:b.duree,priorite:b.priorite})))};
function dupBDT(id){ _dupBdtId=id; var bdt=_dupBdtData.find(function(b){return b.id===id;}); if(!bdt) return; document.getElementById('dupInfo').innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.78rem;"><div><span style="color:#94a3b8;">BDT: </span><strong>'+bdt.id+'</strong></div><div><span style="color:#94a3b8;">Opération: </span>'+bdt.operation+'</div><div><span style="color:#94a3b8;">Client: </span>'+bdt.client+'</div><div><span style="color:#94a3b8;">Durée: </span>'+bdt.duree+'h</div></div><div style="margin-top:8px;font-size:.72rem;color:#f59e0b;"><i class="fas fa-info-circle" style="margin-right:4px;"></i>Un nouveau BDT sera créé avec un nouvel identifiant.</div>'; var m=document.getElementById('dupModal'); if(m) m.style.display='flex'; }
function confirmDup(){ var m=document.getElementById('dupModal'); if(m) m.style.display='none'; pushNotif('ok','fa-copy','BDT <strong>'+_dupBdtId+'</strong> dupliqué → Opérateur réaffecté. Nouveau BDT créé.'); _dupBdtId=null; }
// ── Fractionnement d un BDT long en morceaux (par temps) ──
var _splitBdt=null;
function splitBdt(id){
  var bdt=BDTS.find(function(b){return b.id===id;}); if(!bdt) return;
  var total=Number(bdt.duree||bdt.tempsAlloue||0)||0;
  if(total<=0){ pushNotif('err','fa-ban','BDT sans durée — rien à fractionner.'); return; }
  _splitBdt={id:id,total:total};
  document.getElementById('splitInfo').innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.78rem;"><div><span style="color:#94a3b8;">BDT : </span><strong>'+id+'</strong></div><div><span style="color:#94a3b8;">Opération : </span>'+(bdt.operation||'')+'</div><div style="grid-column:1/-1;"><span style="color:#94a3b8;">Durée totale : </span><strong>'+total+' h</strong></div></div>';
  document.getElementById('splitN').value=2;
  splitRender(true);
  document.getElementById('splitModal').style.display='flex';
}
function splitPartsRead(){ return Array.prototype.map.call(document.querySelectorAll('#splitParts .split-part'),function(inp){ return Number(inp.value)||0; }); }
function splitRender(equal){
  if(!_splitBdt) return;
  var n=Math.max(2,Math.min(12,parseInt(document.getElementById('splitN').value,10)||2));
  var prev = equal ? [] : splitPartsRead();
  var each=Math.round(_splitBdt.total/n*10000)/10000;
  var html='';
  for(var i=0;i<n;i++){
    var val=(!equal && prev[i]!=null) ? prev[i] : each;
    html+='<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:.74rem;color:#64748b;width:82px;">Morceau '+(i+1)+'</span><input class="split-part" type="number" step="0.01" min="0" value="'+val+'" oninput="splitTotalCheck()" style="flex:1;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 9px;font-size:.82rem;"/><span style="font-size:.72rem;color:#94a3b8;">h</span></div>';
  }
  document.getElementById('splitParts').innerHTML=html;
  splitTotalCheck();
}
function splitTotalCheck(){
  if(!_splitBdt) return;
  var parts=splitPartsRead(); var sum=Math.round(parts.reduce(function(s,x){return s+x;},0)*10000)/10000;
  var allPos=parts.every(function(x){return x>0;});
  var ok=allPos && Math.abs(sum-_splitBdt.total)<0.001;
  var el=document.getElementById('splitTotal'); var btn=document.getElementById('splitConfirmBtn');
  el.innerHTML = ok
    ? '<span style="color:#16a34a;font-weight:700;"><i class="fas fa-circle-check" style="margin-right:4px;"></i>Somme = '+sum+' h (= durée d origine)</span>'
    : '<span style="color:#b45309;font-weight:700;"><i class="fas fa-triangle-exclamation" style="margin-right:4px;"></i>Somme = '+sum+' h · durée d origine '+_splitBdt.total+' h</span> <span style="color:#94a3b8;">— la répartition sera ajustée au prorata à l enregistrement.</span>';
  if(btn){ btn.disabled=!allPos; btn.style.opacity=allPos?'1':'.5'; }
}
function splitSave(){
  if(!_splitBdt) return;
  var parts=splitPartsRead();
  if(!parts.every(function(x){return x>0;})){ pushNotif('err','fa-ban','Chaque morceau doit avoir une durée supérieure à 0.'); return; }
  var url='/api/production/bdt/'+encodeURIComponent(_splitBdt.id)+'/separer';
  fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({parts:parts})})
    .then(function(r){return r.json();}).then(function(j){
      if(j&&j.ok){ var m=document.getElementById('splitModal'); if(m) m.style.display='none'; pushNotif('ok','fa-scissors','BDT séparé en '+j.count+' morceaux — les nouveaux sont à programmer.',4500); setTimeout(function(){ softReload(); },700); }
      else pushNotif('err','fa-ban',(j&&j.error)||'Fractionnement échoué.',4500);
    }).catch(function(){ pushNotif('err','fa-times','Erreur réseau.',4000); });
}

// ─── Initialisation ──────────────────────────────────────────
function restoreProdTab(){ try{ var u=new URLSearchParams(location.search); var qt=u.get('tab'); if(qt&&PROD_TABS.indexOf(qt)>=0){ showProdTab(qt); } else { var t=sessionStorage.getItem('prodTab'); if(t&&PROD_TABS.indexOf(t)>=0&&t!=='gantt-bdt') showProdTab(t); } var sub=u.get('sub')||sessionStorage.getItem('prodCmdSub'); if(sub==='lots') showCmdSub('lots'); }catch(e){} }
function prodInitAll(){ buildAll(); populateSTOps(); bstBuildAll(); restoreProdTab(); }
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', prodInitAll);
} else { prodInitAll(); }
</script>`

  return layout('Service Production', content, 'service-prod')
}
