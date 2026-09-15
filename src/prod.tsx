// ══════════════════════════════════════════════════════════════
// PRODUCTION – Planning Gantt BDT/BST · Commandes · Lots · Dashboards
// ══════════════════════════════════════════════════════════════
import { escX, layout, serviceHeader, OPERATEURS as OPS_FB, BDT_DATA, SHIFTS, ABSENCES, MACHINES, estAnnule, badgeAnnule, construireTauxAtelier, typeProcess, alerteCoutReel, racineBdt, rangMorceauBdt } from './shared'
import { cleLot, violationsEnchainement, PLAN_DEBUT_JOUR, PLAN_FIN_JOUR, PLAN_HEURE_DEFAUT } from './gamme'
import { LOGO_SVG, BRAND } from './brand'
import { CRENEAUX, paletteCreneaux, joursChargesPage } from './presences'
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
      ${lkpi('Coût engagé', _LD.kpi.coutEngage != null ? eur0(_LD.kpi.coutEngage) : '—', '#7c3aed', 'matière+MO+machine' + ((_LD.kpi.manquants || []).length ? ' · incomplet' : ''))}
      ${lkpi('Matière', eur0(_LD.kpi.coutMat), '#d97706')}
      ${lkpi('MO', _LD.kpi.coutMO != null ? eur0(_LD.kpi.coutMO) : '—', '#6366f1', _LD.kpi.moH + ' h' + ((_LD.kpi.manquants || []).includes('taux_homme') ? ' · incomplet' : ''))}
      ${lkpi('Machine', _LD.kpi.coutMach != null ? eur0(_LD.kpi.coutMach) : '—', '#0d9488', _LD.kpi.machH + ' h' + (((_LD.kpi.manquants || []).includes('taux_machine') || (_LD.kpi.manquants || []).includes('sans_process')) ? ' · incomplet' : ''))}
      ${lkpi('NC', String(_LD.kpi.nbNC), _LD.kpi.ncBloq ? '#dc2626' : '#94a3b8', _LD.kpi.ncBloq + ' bloquante(s)')}
      ${lkpi('Quarantaine', String(_LD.kpi.enQuar), _LD.kpi.enQuar ? '#dc2626' : '#22c55e', _LD.kpi.nbPV + ' PV · ' + _LD.kpi.nb8d + ' 8D')}
    </div>
    ${alerteCoutReel(_LD.kpi)}
    ${(_LD.kpi.ncBloq > 0 || _LD.kpi.enQuar > 0) ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;font-size:.74rem;color:#b91c1c;margin-top:12px;"><i class="fas fa-triangle-exclamation" style="margin-right:5px;"></i>Lot à risque : ${_LD.kpi.coutEngage != null ? eur0(_LD.kpi.coutEngage) + ' déjà engagés' : 'coût engagé non calculé'}, lot bloqué (NC/quarantaine) — coût caché en cas de rebut.</div>` : ''}
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
    // Repli : pas de gamme trouvée → étapes depuis les BDT (temps alloué). Lot C : la colonne Réglage reprend le
    // temps_reglage du BDT (null / colonne absente = 0 affiché « — ») ; la colonne machine porte alors la RÉALISATION
    // du bon (temps total, pas unitaire : aucune quantité ne la multiplie dans les totaux).
    ofOps = ops.slice().sort(seqSort).map((op: any, i: number) => {
      const b = _bdtById[String(op.id)] || {}
      const t = Number(b.temps_alloue != null ? b.temps_alloue : (b.duree != null ? b.duree : 0)) || 0
      const isBds = op.kind === 'BDS'
      const trB = (!isBds && b.temps_reglage != null && b.temps_reglage !== '' && Number.isFinite(Number(b.temps_reglage))) ? Math.max(0, Math.min(t, Number(b.temps_reglage))) : 0
      return { seq: op.seq != null ? op.seq : (i + 1), phase: '', operation: op.operation, poste: isBds ? ('S/T' + (op.st ? ' — ' + op.st : '')) : (b.machine_id || ''), res: isBds ? 'S/T' : 'Machine', prog: '', progFic: '', reg: trB, moU: 0, machU: Math.max(0, t - trB), total: t }
    })
  }
  // Totaux : avec gamme, MO et machine sont UNITAIRES (× quantité) ; en repli ce sont déjà des temps du bon.
  const _mult = _etapes.length ? _qte : 1
  const _tot = ofOps.reduce((a: any, o: any) => ({ reg: a.reg + o.reg, mo: a.mo + o.moU * _mult, mach: a.mach + o.machU * _mult, total: a.total + o.total }), { reg: 0, mo: 0, mach: 0, total: 0 })
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
  dbPresences?:  any[] | null,   // null = lecture échouée : aucun jour déclaré chargé (le client relit la semaine)
  dbAbsences?:   any[],
  dbMouvements?: any[],
  dbAffectations?: Record<string, any>,
  dbCongesOps?:  any[],
  dbPostes?:     any[],
  dbMachinesOpex?: any[],
  dbBdtsVigilance?: { id: string; piece: string; operation: string; lot_ref: string; num_affaire: string; cmd_ref: string; raison: string }[],
  // Salariés (lignes brutes : taux_horaire_charge, entite, actif, est_operateur) — servent UNIQUEMENT à calculer, côté
  // serveur, la MOYENNE du coût chargé RH affichée pour un process manuel. Aucun taux individuel ne part au navigateur.
  // Absent (appelant pas encore à jour) → la moyenne n'est simplement pas affichée.
  dbSalaries?:   any[],
) => {
  const TODAY = new Date().toISOString().slice(0,10)
  // Postes : plus aucun taux (14/09/2026) — `taux_horaire_manuel` n'est plus ni lu ni écrit.
  const POSTES: any[] = (dbPostes ?? []).map((p:any) => ({ id:p.id, nom:p.nom, code:p.code||'', activite:p.activite||'', couleur:p.couleur||'#6366f1', ordre:p.ordre??100, statut:p.statut||'actif' }))
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
  // ─── OPEX PAR POSTE = somme de l'OPEX RÉEL des machines du poste (consommables) + conso tirées au poste (postes manuels) ───
  // C'est LE calcul régularisé : agrégation du même machOpex, réutilisé à l'identique en maintenance (fiche 360 / TCO par poste).
  // (14/09/2026) Plus d'OPEX « théorique » cout_h × capacité × 220 : aucun taux n'est porté par la machine ni par le poste.
  const posteOpex: Record<string, { reel: number; machines: string[] }> = {}
  const _posteInit = (pid: string) => (posteOpex[pid] = posteOpex[pid] || { reel: 0, machines: [] })
  for (const m of MACH_REAL) {
    const pid = m.poste_id ? String(m.poste_id) : ''
    if (!pid) continue
    const e = _posteInit(pid)
    e.machines.push(String(m.id))
    e.reel += (machOpex[String(m.id)]?.total || 0)
  }
  for (const mv of MOUV_ALL) {   // consommables rattachés directement à un poste (postes manuels, sans machine)
    if (String(mv.categorie || '') !== 'consommable' || !mv.poste_id) continue
    const pu = stockPrice[String(mv.article_id)] ?? stockPrice[String(mv.stock_id)] ?? 0
    _posteInit(String(mv.poste_id)).reel += Math.abs(Number(mv.quantite) || 0) * pu
  }
  // Comptage + LISTES machines / process par poste (pour l'admin postes + la vue imbriquée)
  const PROC_ALL: any[] = (dbProcess ?? [])
  const machCountByPoste: Record<string, number> = {}
  const procCountByPoste: Record<string, number> = {}
  const machListByPoste: Record<string, any[]> = {}
  const procListByPoste: Record<string, any[]> = {}
  for (const m of MACH_REAL) if (m.poste_id) { const k = String(m.poste_id); machCountByPoste[k] = (machCountByPoste[k] || 0) + 1; (machListByPoste[k] = machListByPoste[k] || []).push(m) }
  for (const p of PROC_ALL) if (p.poste_id) { const k = String(p.poste_id); procCountByPoste[k] = (procCountByPoste[k] || 0) + 1; (procListByPoste[k] = procListByPoste[k] || []).push(p) }
  // ─── Coût horaire porté par le PROCESS (14/09/2026, shared.ts construireTauxAtelier / typeProcess) ───
  //   · process machine : taux horaire machine SAISI sur le process (process_atelier.taux_horaire_machine), null = « à saisir » ;
  //     transition (colonne absente, base cloud avant cloud-7) : repris du cout_h de SA machine, en lecture seule ;
  //   · process manuel : aucun taux — le temps homme est valorisé au coût chargé RH (moyenne des opérateurs actifs) ;
  //   · process OAS : chiffré au prix, jamais au temps.
  // ⚠ construireTauxAtelier reçoit les lignes process BRUTES (select '*') : l'ABSENCE de la propriété est le signal de transition.
  const TX = construireTauxAtelier(PROC_ALL, dbSalaries ?? [], MACH_REAL)
  const LBL_TYPE: Record<string, string> = { machine: 'Machine', manuel: 'Manuel', oas: 'OAS' }
  const procType = (p: any) => LBL_TYPE[typeProcess(p)]
  // Moyennes du coût chargé RH (JAMAIS un taux individuel) — null si les salariés ne sont pas fournis à la page.
  const TAUX_HOMME_ATELIER = dbSalaries ? { ...TX.hommeParSite, manquant: TX.hommeManquant } : null
  const _hasOwn = (o: any, k: string) => !!o && Object.prototype.hasOwnProperty.call(o, k)
  const fmtTaux = (v: number) => (Math.round((Number(v) || 0) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  // Pastille « taux » d'un process (lignes dépliées des postes) — valeurs issues de TX.tauxMachine (transition comprise).
  const procTauxBadge = (p: any): string => {
    const t = typeProcess(p)
    if (t === 'oas') return ''
    if (t === 'manuel') return '<span style="font-size:.58rem;color:#64748b;border:1px dashed #cbd5e1;border-radius:5px;padding:1px 6px;" title="Process manuel : le temps homme est valorisé au coût chargé RH de l\'opérateur (fiche salarié)"><i class="fas fa-user" style="margin-right:3px;"></i>coût RH</span>'
    const r = TX.tauxMachine(p.id)
    if (r.source === 'process') return `<span style="font-size:.6rem;background:#ccfbf1;color:#0f766e;border-radius:5px;padding:1px 6px;font-weight:700;" title="Taux horaire machine saisi sur le process"><i class="fas fa-euro-sign" style="margin-right:3px;"></i>${fmtTaux(r.taux)} €/h</span>`
    if (r.source === 'transition_machine') return `<span style="font-size:.6rem;background:#fef3c7;color:#92400e;border-radius:5px;padding:1px 6px;font-weight:700;" title="Transition : repris du coût horaire de la machine — la colonne du taux process n'existe pas encore sur cette base (docker/db/cloud/cloud-7)"><i class="fas fa-euro-sign" style="margin-right:3px;"></i>${fmtTaux(r.taux)} €/h · transition</span>`
    return '<span style="font-size:.58rem;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:5px;padding:1px 6px;font-weight:800;" title="Process machine sans taux horaire : le coût machine vaut 0 tant que le taux n\'est pas saisi (crayon du process)"><i class="fas fa-triangle-exclamation" style="margin-right:3px;"></i>taux à saisir</span>'
  }
  const fmtEur = (v: number) => {
    const parts = (Math.round((Number(v) || 0) * 100) / 100).toFixed(2).split('.')
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + parts[1] + ' €'
  }

  // ─── Gantt BDT data ──────────────────────────────────────
  // Les lignes du planning sont désormais les PROCESS atelier (machine ou manuel),
  // séparés Seem / Semrac. Les BDT sont colorés par statut.
  // Projection process envoyée au navigateur (sjX). Le type vient de typeProcess (règle unique) : `requiert_machine`
  // en est le reflet (un process à requiert_machine null mais porteur d'une machine est « machine »).
  //   type                 : 'machine' | 'manuel' | 'oas'
  //   taux_horaire_machine : valeur SAISIE sur le process (null = à saisir ; null aussi si la colonne n'existe pas)
  //   taux_col             : la colonne existe sur cette base (false = base cloud avant cloud-7 → transition)
  //   taux_machine         : taux RÉSOLU par TX.tauxMachine (transition comprise), 0 si manquant / manuel / OAS
  //   taux_source          : 'process' | 'transition_machine' | 'manquant' | 'manuel' | 'oas' | 'sans_process'
  const procForGantt = (dbProcess && dbProcess.length > 0)
    ? dbProcess.map((p:any) => {
        const t = typeProcess(p)
        const r = TX.tauxMachine(p.id)
        const col = _hasOwn(p, 'taux_horaire_machine')
        return {id:p.id,nom:p.nom,activite:p.activite||'Seem',type:t,requiert_machine:t==='machine',est_oas:t==='oas',machine_id:p.machine_id||null,poste_id:p.poste_id||null,categorie:p.categorie||'',couleur:p.couleur||'#64748b',operations:Array.isArray(p.operations)?p.operations:[],
          taux_horaire_machine:(col && p.taux_horaire_machine != null && p.taux_horaire_machine !== '') ? Number(p.taux_horaire_machine) : null,
          taux_col:col, taux_machine:r.taux, taux_source:r.source}
      })
    : []
  const opsForGantt = (dbOps && dbOps.length > 0)
    ? dbOps.map(o => ({id:o.id,nom:o.nom,activite:o.activite,poste:o.poste||'',shift:deriveShift(o.shift_id),competences:o.competences||[]}))
    : OPS_DEFAULT
  // Familles de découpe (racine + morceaux « -Mk ») : rangs présents, pour la pastille « M2 · 2/3 ».
  const _rangsFamille: Record<string, number[]> = {}
  ;(dbBDTs ?? []).forEach((b: any) => { const r = racineBdt(b.id); (_rangsFamille[r] = _rangsFamille[r] || []).push(rangMorceauBdt(b.id)) })
  Object.keys(_rangsFamille).forEach((r) => _rangsFamille[r].sort((x, y) => x - y))
  // Projection du planning. Lot C (14/09/2026) :
  //   reglage     : temps_reglage (h) — null = inconnu (colonne absente avant cloud-9 comprise) ; réalisation = duree − reglage
  //   racine / rangMorceau / posMorceau / nbMorceaux : famille de découpe (pastille, « Annuler la découpe »)
  //   oasAvant / oasApres : étape OAS entre deux BDT (chemin critique : fin complète)
  //   cleLot      : clé de gamme (gamme.ts cleLot) ; sansHeure : `debut` vide en base (l'écran l'affiche à 6 h)
  // Les champs lus par le moteur de chemin critique client (ccRowBdt) doivent rester fidèles aux colonnes brutes.
  const bdtsForGantt = (dbBDTs && dbBDTs.length > 0)
    ? dbBDTs.map(b => {
        const racine = racineBdt(b.id), rang = rangMorceauBdt(b.id), rangs = _rangsFamille[racine] || [rang]
        const tr = (b as any).temps_reglage
        return {id:b.id,op:b.operateur_id||'',process:(b as any).process_id||'pending',client:b.client_nom||'',piece:b.piece,operation:b.operation,duree:b.duree,debut:b.debut!=null?Number(b.debut):PLAN_HEURE_DEFAUT,priorite:b.priorite,statut:b.statut,resultat:(b as any).resultat||null,activite:b.activite||'Seem',machineId:b.machine_id||null,tempsAlloue:(b as any).temps_alloue||b.duree,debutReel:(b as any).debut_reel||null,finReel:(b as any).fin_reel||null,lotId:(b as any).lot_id||(b as any).lot_ref||null,numAffaire:(b as any).num_affaire||null,dateEcheance:(b as any).date_echeance||null,seq:(b as any).seq!=null?(b as any).seq:null,cmdId:(b as any).cmd_id||null,datePrevue:(b as any).date_prevue||null,oxydation:(b as any).oxydation||null,
          reglage:(tr!=null&&tr!=='')?Number(tr):null, racine, rangMorceau:rang, posMorceau:rangs.indexOf(rang)+1, nbMorceaux:rangs.length,
          oasAvant:!!(b as any).oas_avant, oasApres:!!(b as any).oas_apres, cleLot:cleLot(b), sansHeure:(b.debut==null||(b.debut as any)==='')}
      })
    : BDT_DEFAULT
  const PROCESS_J = sjX(procForGantt)   // sjX (et non JSON.stringify) : un nom contenant « </script> » ne casse plus la page
  const OPS_J  = JSON.stringify(opsForGantt)
  const SHIFTS_J = JSON.stringify(SHIFTS)
  const ABS_J  = JSON.stringify(ABSENCES)
  const OPS_SE = JSON.stringify(OPS_SEEM_LIST)
  const OPS_SM = JSON.stringify(OPS_SEMRAC_LIST)
  const OPS_ST_J = JSON.stringify(OPS_ST_LIST)
  // Machines réelles (pour rattacher un process à une machine dans l'onglet Process Ateliers) — sans aucun taux (14/09/2026).
  const machinesForProc = (dbMachines && dbMachines.length > 0)
    ? dbMachines.map((m:any) => ({id:m.id,nom:m.nom,code:m.code,activite:m.activite}))
    : []
  const MACHINES_PROC_J = sjX(machinesForProc)
  // ─── Référentiel Process Ateliers ────
  const PROC_LIST: any[] = dbProcess ?? []
  const machNameById: Record<string,string> = {}
  ;(dbMachines ?? []).forEach((m:any)=>{ machNameById[m.id]=m.nom })
  // (procMgmtRows supprimé le 14/09/2026 : tableau à plat des process calculé mais jamais injecté depuis le retrait du
  //  référentiel à plat — les process se gèrent dans les postes. Ses fonctions clientes proc_filter / toggleProcMachine /
  //  editProcMachineLink et la branche « proc » de persistRowOrder, sans plus aucun appelant, sont retirées avec lui.)

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

  // ─── Chemin critique : enchaînements à revoir (lot C, src/gamme.ts) ─────
  // Calculés ICI sur les lignes mêmes que reçoit le script client (BDT bruts + BST au statut piloté par le BC),
  // pour que la carte rendue par le serveur et celle que le client recalcule après chaque pose soient identiques.
  const VIOL_CC: Record<string, string> = violationsEnchainement((dbBDTs ?? []) as any[], bdsRowsForBst)
  const violCcHtml = (() => {
    const bdtById: Record<string, any> = {}; (dbBDTs ?? []).forEach((b: any) => { bdtById[String(b.id)] = b })
    const bdsById: Record<string, any> = {}; bdsRowsForBst.forEach((x: any) => { bdsById[String(x.id)] = x })
    return Object.keys(VIOL_CC).map((id) => {
      const o = bdtById[id] || bdsById[id] || {}
      const lot = cleLot(o)
      return `<div class="cc-viol-ligne" data-id="${escX(id)}" onclick="ccVoir(this.getAttribute('data-id'))" title="Voir sur le planning" style="display:flex;align-items:baseline;gap:8px;padding:6px 8px;border-bottom:1px solid #fee2e2;cursor:pointer;font-size:.74rem;"><i class="fas ${bdsById[id] && !bdtById[id] ? 'fa-industry' : 'fa-screwdriver-wrench'}" style="color:#dc2626;font-size:.66rem;"></i><span style="color:#475569;">${escX(VIOL_CC[id])}</span>${lot ? `<span style="margin-left:auto;font-size:.62rem;color:#0d9488;font-family:monospace;white-space:nowrap;">${escX(lot)}</span>` : ''}</div>`
    }).join('')
  })()

  // ─── Présence opérateurs ─────────────────────────────────
  // Opérateurs de production (Seem / Semrac) — alimente le planning de présence.
  const opsForPresence = ((dbOps && dbOps.length > 0) ? dbOps : OPS_DEFAULT)
    .filter((o:any) => o.activite === 'Seem' || o.activite === 'Semrac')
    .map((o:any) => ({ id:o.id, nom:o.nom, activite:o.activite, poste:o.poste || '' }))
  const PRESENCES_JS = PRESENCES_DB.map((p:any) => ({ operateur_id:p.operateur_id, date:p.date_presence, shift:p.shift }))
  // 4 créneaux (Matin · Journée · Après-midi · Soirée) + Absent : libellés, horaires et teintes tirés de SHIFTS (shared.ts)
  const PRES_PALETTE = paletteCreneaux()
  const PRES_ORDRE = [...CRENEAUX, 'absent']
  // Jours dont les présences sont réellement chargées au rendu (⊆ fenêtre lue par la route). Lecture échouée (null) :
  // aucun — les cases restent verrouillées et le client relit la semaine affichée plutôt que d'écraser une valeur inconnue.
  const PRES_JOURS_CHARGES: Record<string, boolean> = {}
  if (Array.isArray(dbPresences)) joursChargesPage(TODAY).forEach(d => { PRES_JOURS_CHARGES[d] = true })
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
  // OPEX par machine = données réelles du parc (MACH_REAL) : OPEX consommables RÉEL (machOpex), utilisation = charge BDT
  // affectée à la machine / capacité hebdo. (14/09/2026) Plus de colonne « Taux/h » ni d'OPEX estimé taux × capacité ×
  // jours ouvrés quand aucun consommable n'est sorti : le taux horaire est porté par le process, l'OPEX reste en euros réels.
  const _dpPalette = ['#3b82f6','#0ea5e9','#ec4899','#a855f7','#f97316','#8b5cf6','#06b6d4','#6366f1','#14b8a6','#e11d48']
  const _machLoadH: Record<string, number> = {}
  ;(dbBDTs ?? []).forEach((b:any) => { if (b.machine_id) _machLoadH[String(b.machine_id)] = (_machLoadH[String(b.machine_id)]||0) + Number(b.duree||0) })
  const machinesOpex = (MACH_REAL as any[]).filter((m:any) => m.statut !== 'arret').map((m:any, i:number) => {
    const capaH = Number(m.capacite_h ?? 8)
    const opReel = machOpex[String(m.id)]
    const utilisation = capaH > 0 ? Math.min(100, Math.round((_machLoadH[String(m.id)]||0) / (capaH * 5) * 100)) : 0
    return { nom: m.nom, code: m.code ?? '—', utilisation, opex: opReel ? Math.round(opReel.total) : 0, couleur: _dpPalette[i % _dpPalette.length] }
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
  const opexRows2=machinesOpex.map(m=>`<tr>${TD(`<div style="display:flex;align-items:center;gap:8px;"><span style="width:10px;height:10px;border-radius:50%;background:${m.couleur};flex-shrink:0;"></span><span style="font-weight:700;">${escX(m.nom)}</span></div>`)}${TD(`<span style="color:#64748b;">${escX(m.code)}</span>`)}${TD(`<div style="display:flex;align-items:center;gap:6px;"><div style="flex:1;height:5px;background:#e2e8f0;border-radius:3px;min-width:60px;"><div style="height:100%;width:${m.utilisation}%;background:${m.couleur};border-radius:3px;"></div></div><span style="font-size:.7rem;">${m.utilisation}%</span></div>`)}${TD(m.opex > 0 ? `<span style="font-weight:700;color:#1e293b;">${m.opex.toLocaleString('fr-FR')} €</span>` : '<span style="color:#cbd5e1;">—</span>')}</tr>`).join('')

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

    <!-- ENCHAÎNEMENTS À REVOIR (chemin critique) : étapes posées avant leur au plus tôt (réglage, fin complète ou retour
         de sous-traitance de l'étape précédente). Rendue ici par le serveur, recalculée par le client après chaque pose (ccRenderCarte). -->
    <div id="ccCarte" class="card" style="padding:14px 16px;border-radius:14px;margin-bottom:14px;border-left:4px solid #dc2626;${Object.keys(VIOL_CC).length ? '' : 'display:none;'}">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <span style="font-weight:700;color:#1e293b;font-size:.82rem;"><i class="fas fa-link-slash" style="color:#dc2626;margin-right:6px;"></i>Enchaînements à revoir</span>
        <span id="ccCarteN" style="background:#fee2e2;color:#b91c1c;font-size:.65rem;font-weight:700;padding:1px 8px;border-radius:999px;">${Object.keys(VIOL_CC).length}</span>
        <span style="font-size:.66rem;color:#94a3b8;">étapes posées avant leur au plus tôt (réglage, fin complète ou retour de sous-traitance de l’étape précédente) · rien n’est décalé automatiquement · clic : voir sur le planning</span>
      </div>
      <div id="ccCarteListe" style="max-height:180px;overflow-y:auto;">${violCcHtml}</div>
    </div>

    <!-- GOULOTTE : BDT à classer AU-DESSUS du planning (pleine largeur) -->
    <div id="pendingDropZone" class="card" style="padding:14px 16px;border-radius:14px;transition:outline .12s;margin-bottom:14px;" ondragover="onPendingOver(event)" ondragleave="onPendingLeave(event)" ondrop="onPendingDrop(event)">
      <div style="margin-bottom:10px;">
        <div style="font-weight:700;color:#1e293b;font-size:.82rem;display:flex;align-items:center;gap:6px;"><i class="fas fa-inbox" style="color:#f97316;"></i> BDT à classer / en attente de programmation<span id="cntPend" style="background:#ffedd5;color:#c2410c;font-size:.65rem;font-weight:700;padding:1px 7px;border-radius:999px;margin-left:auto;">0</span></div>
        <div style="font-size:.62rem;color:#94a3b8;margin-top:3px;">Triés par échéance, puis par lot et ordre de gamme · Glisser une carte sur le planning pour la programmer (l’heure est calée après le réglage de l’étape précédente : chemin critique) · <i class="fas fa-rotate-left"></i> sur une carte découpée pour annuler la découpe · déposer ici une barre du planning pour la déprogrammer · <i class="fas fa-scissors"></i> sur une carte pour découper le BDT en morceaux (le réglage reste sur le 1er morceau, seule la réalisation se répartit) — la découpe se fait uniquement ici, dans la goulotte</div>
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
      <div style="font-size:.7rem;color:#94a3b8;margin-bottom:12px;">Glisse un opérateur <strong>ou</strong> clique-le pour le sélectionner, puis clique une sous-case (Matin / Journée / Après-midi / Soirée) d'un process <strong>dans le planning ci-dessus</strong> — affectation programmée &amp; tracée pour le jour.</div>
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
        <div><label class="form-label">dont réglage (h) <span style="color:#94a3b8;font-weight:400;font-size:.72rem;">facultatif</span></label><input id="m_reglage" type="number" step="0.05" min="0" placeholder="inconnu" title="Temps de réglage compris dans la durée (fait une seule fois, il reste sur le morceau 1 en cas de découpe). Vide = inconnu." class="form-input"/></div>
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
  <!-- Modal découpe d'un BDT de la GOULOTTE (ciseaux d'une carte) : seul le temps de RÉALISATION se découpe,
       le réglage (fait une seule fois) reste sur le morceau 1. Réglage lu par GET /api/production/bdt/:id/temps.
       Rangée dans CE panneau (planning) : dans un autre onglet, masqué, elle ne s'affichait pas.
       Répartition (15/09/2026) : une JAUGE montre tout le temps de réalisation à répartir (segment par morceau,
       reste en gris, dépassement en orange ; réglage à part, hachuré) et un CURSEUR par morceau l'alloue. -->
  <style>
    #splitModal .split-range{-webkit-appearance:auto;appearance:auto;height:22px;margin:0;cursor:pointer;background:transparent;}
    #splitModal .split-range:disabled{cursor:not-allowed;opacity:.5;}
    #splitModal .split-range:focus-visible,#splitModal .split-part:focus-visible,#splitModal .split-aide:focus-visible,#splitModal .split-del:focus-visible{outline:2px solid #6d28d9;outline-offset:2px;}
    #splitModal .split-aide{font-size:.72rem;font-weight:700;color:#5b21b6;background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:5px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}
    #splitModal .split-aide:disabled{opacity:.45;cursor:not-allowed;}
  </style>
  <div id="splitModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:500;">
    <div role="dialog" aria-modal="true" aria-labelledby="splitTitre" style="background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:720px;margin:1rem;overflow:hidden;max-height:92vh;display:flex;flex-direction:column;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><h3 id="splitTitre" style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-scissors" style="margin-right:8px;"></i>Découper le BDT en morceaux</h3><button type="button" onclick="closeModal('splitModal')" aria-label="Fermer" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div id="splitRappel" style="display:none;padding:8px 20px;background:#fffbeb;border-bottom:1px solid #fde68a;font-size:.72rem;color:#92400e;"></div>
      <div style="padding:20px;overflow-y:auto;">
        <div id="splitInfo" style="background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:12px;font-size:.82rem;"></div>
        <div id="splitReglageBox" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:9px 11px;margin-bottom:12px;">
          <label for="splitReglage" style="font-size:.74rem;font-weight:700;color:#475569;width:82px;"><i class="fas fa-screwdriver-wrench" style="margin-right:5px;color:#64748b;"></i>Réglage</label>
          <input id="splitReglage" type="number" step="0.05" min="0" inputmode="decimal" placeholder="inconnu" style="width:110px;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 9px;font-size:.82rem;"/>
          <span style="font-size:.72rem;color:#94a3b8;">h</span>
          <span id="splitReglageAide" style="flex:1;min-width:160px;font-size:.7rem;color:#64748b;"></span>
        </div>
        <div style="font-size:.72rem;color:#475569;background:#f5f3ff;border:1px solid #ede9fe;border-radius:9px;padding:8px 11px;margin-bottom:12px;"><i class="fas fa-circle-info" style="color:#7c3aed;margin-right:5px;"></i>Seul le temps de <strong>réalisation</strong> se répartit : la jauge le montre en entier, <strong>glissez le curseur</strong> de chaque morceau pour lui en allouer une part (ou saisissez la valeur exacte, au centième). Le <strong>réglage</strong> est fixe, fait une seule fois : il reste sur le morceau 1, qui garde le numéro du BDT (il peut ne porter que le réglage, réalisation 0). Chaque morceau reste dans la goulotte : vous le programmerez séparément.</div>
        <div id="splitJauge" role="group" aria-label="Jauge du temps de réalisation à répartir" style="position:sticky;top:-20px;z-index:3;background:white;padding-block:8px 10px;margin-bottom:6px;border-bottom:1px solid #f1f5f9;"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <div style="font-size:.74rem;font-weight:700;color:#334155;">Répartition par morceau <span style="font-weight:500;color:#64748b;">— curseur (pas de 0,25 h) ou saisie au centième</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" id="splitEgalBtn" class="split-aide" onclick="splitRepartirEgal()"><i class="fas fa-equals" aria-hidden="true"></i>Répartir également</button>
            <button type="button" id="splitResteBtn" class="split-aide" onclick="splitResteDernier()"><i class="fas fa-arrow-right-to-bracket" aria-hidden="true"></i>Mettre le reste sur le dernier morceau</button>
          </div>
        </div>
        <div id="splitParts" style="display:grid;gap:8px;"></div>
        <button type="button" id="splitAddBtn" onclick="splitAdd()" style="margin-top:10px;font-size:.74rem;font-weight:700;color:#6d28d9;background:#f5f3ff;border:1px dashed #a78bfa;border-radius:8px;padding:6px 12px;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Ajouter un morceau</button>
        <div id="splitTotal" style="margin-top:12px;font-size:.8rem;"></div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button type="button" onclick="closeModal('splitModal')" class="btn btn-secondary">Annuler</button><button type="button" id="splitConfirmBtn" onclick="splitSave()" class="btn btn-primary" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);"><i class="fas fa-scissors"></i> Découper</button></div>
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
    <style>.presview-pill{padding:8px 16px;border-radius:10px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:.82rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;box-shadow:0 1px 3px rgba(0,0,0,.06);}.presview-pill.active{background:linear-gradient(135deg,#0d9488,#14b8a6);color:white;border-color:transparent;}#presMenu .pres-choix:not([disabled]):hover,#presMenu .pres-choix:not([disabled]):focus{background:#f1f5f9 !important;outline:none;}</style>
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button id="presViewBtn-grid" onclick="presView('grid')" class="presview-pill active"><i class="fas fa-calendar-week" style="margin-right:7px;"></i>Planning de présence</button>
      <button id="presViewBtn-conges" onclick="presView('conges')" class="presview-pill"><i class="fas fa-umbrella-beach" style="margin-right:7px;"></i>Demandes de congés à traiter<span id="presCongesCount" style="background:#14b8a6;color:white;border-radius:999px;padding:0 8px;font-size:.66rem;margin-left:7px;">${CONGES_OPS.length}</span></button>
    </div>
    <div id="presView-grid">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
      <div><h1 style="font-size:1.3rem;font-weight:900;color:#1e293b;margin:0;">Présence opérateurs</h1><div style="font-size:.76rem;color:#64748b;margin-top:2px;">Programmez les créneaux (matin / journée / après-midi / soirée) par jour et par semaine · absences RH synchronisées</div></div>
      <div style="flex:1;"></div>
      <div style="display:flex;align-items:center;gap:8px;background:white;border-radius:10px;padding:6px 10px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
        <button onclick="presShiftWeek(-1)" style="width:26px;height:26px;border-radius:6px;background:#f1f5f9;border:none;cursor:pointer;">‹</button>
        <span id="presWeekLabel" style="font-size:.8rem;font-weight:700;color:#1e293b;min-width:180px;text-align:center;"></span>
        <button onclick="presShiftWeek(1)" style="width:26px;height:26px;border-radius:6px;background:#f1f5f9;border:none;cursor:pointer;">›</button>
        <span id="presWeekEtat" style="font-size:.7rem;font-weight:700;"></span>
      </div>
      <div style="display:flex;gap:2px;background:white;border-radius:10px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,.07);border:1px solid #f1f5f9;">
        <button onclick="presSetAct('all',this)" id="pres-fa-all" class="tab-gang active">Tous</button>
        <button onclick="presSetAct('Seem',this)" id="pres-fa-Seem" class="tab-gang">Seem</button>
        <button onclick="presSetAct('Semrac',this)" id="pres-fa-Semrac" class="tab-gang">Semrac</button>
      </div>
    </div>
    <div style="display:flex;gap:14px;font-size:.7rem;color:#64748b;margin-bottom:10px;flex-wrap:wrap;align-items:center;">
      ${PRES_ORDRE.map(k => { const p = PRES_PALETTE[k]; return `<span><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:${p[0]};border:1px solid ${p[1]}66;margin-right:4px;"></span>${escX(p[2])}${p[3] ? ` <span style="color:#94a3b8;">${escX(p[3])}</span>` : ''}</span>` }).join('\n      ')}
      <span><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:#f8fafc;border:1px solid #e2e8f0;margin-right:4px;"></span>Non programmé</span>
      <button onclick="openPresWeekModal()" style="margin-left:auto;display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;border:none;background:linear-gradient(135deg,#f97316,#ea580c);color:white;cursor:pointer;font-size:.78rem;font-weight:700;"><i class="fas fa-calendar-week"></i>Programmer la semaine</button>
      <span style="color:#94a3b8;flex-basis:100%;"><i class="fas fa-info-circle" style="margin-right:4px;"></i>Cliquez une case pour choisir Matin, Journée, Après-midi, Soirée, Absent ou Effacer · chaque choix est enregistré aussitôt (la case revient à sa valeur si l'enregistrement échoue) · ou utilisez « Programmer la semaine » pour appliquer un créneau à toute la semaine affichée</span>
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
            <button type="button" onclick="validerCongeOp('${cg.id}','valide',this)" style="padding:8px 16px;background:#10b981;color:white;border:none;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i>Approuver</button>
            <button type="button" onclick="validerCongeOp('${cg.id}','refuse',this)" title="Refuser" aria-label="Refuser" style="padding:8px 13px;background:#fee2e2;color:#b91c1c;border:none;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-times"></i></button>
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
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px 14px;font-size:.78rem;color:#9a3412;margin-bottom:18px;"><i class="fas fa-info-circle" style="margin-right:5px;"></i>Choisissez un ou plusieurs opérateurs et le créneau à appliquer à la semaine affichée (<strong id="presWkLabel"></strong>). Les jours en absence RH ne seront pas touchés.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
          <div>
            <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">Créneau à appliquer *</label>
            <select id="presWkShift" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.85rem;background:#f8fafc;outline:none;">
              ${PRES_ORDRE.map(k => `<option value="${k}">${escX(PRES_PALETTE[k][2])}${PRES_PALETTE[k][3] ? ` (${escX(PRES_PALETTE[k][3])})` : ''}</option>`).join('')}
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
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;"><div style="font-weight:700;color:#1e293b;font-size:.88rem;display:flex;align-items:center;gap:8px;"><i class="fas fa-euro-sign" style="color:#f59e0b;"></i>OPEX réel machines (consommables) · YTD ${new Date().getFullYear()}</div><div style="font-size:.88rem;font-weight:900;color:#1e293b;">${totalOpex.toLocaleString('fr-FR')} € total</div></div>
      <table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;">${TH('Machine')}${TH('Code')}${TH('Utilisation')}${TH('OPEX réel YTD')}</tr></thead><tbody>${opexRows2}</tbody></table>
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
</div>

<!-- ═══ PANEL 7 : MACHINES ATELIER ═══════════════════════════ -->
<div id="ppanel-machines" style="display:none;">
  <div style="padding:24px;margin:0 auto;">
    <div style="margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <div>
        <h1 style="font-size:1.2rem;font-weight:900;color:#1e293b;margin:0;"><i class="fas fa-sitemap" style="color:#f97316;margin-right:10px;"></i>Process Ateliers</h1>
        <div style="font-size:.78rem;color:#64748b;margin-top:2px;">Postes de travail · machines &amp; process regroupés · Seem &amp; Semrac · Taux horaire machine porté par le process · OPEX réel — ${new Date().getFullYear()}</div>
      </div>
      ${(() => {
        // Process machine sans taux horaire saisi : signalés (le coût machine de leurs étapes vaut 0 tant que le taux manque).
        const nbASaisir = PROC_ALL.filter((p: any) => p.statut !== 'inactif' && typeProcess(p) === 'machine' && TX.tauxMachine(p.id).source === 'manquant').length
        return nbASaisir > 0 ? `<div style="display:flex;gap:8px;align-items:center;">
        <span style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:8px;padding:6px 14px;font-size:.75rem;font-weight:700;" title="Process machine sans taux horaire machine : saisissez-le avec le crayon du process (lignes dépliées des postes)"><i class="fas fa-triangle-exclamation" style="margin-right:5px;"></i>${nbASaisir} process machine : taux à saisir</span>
      </div>` : ''
      })()}
    </div>

    <!-- KPIs synthèse -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${[
        ['fa-cogs',        'Machines actives',    String(MACH_REAL.filter((m: any) => m.statut === 'operationnel' || m.statut === 'actif').length) + ' / ' + MACH_REAL.length, '#10b981'],
        ['fa-wrench',      'En maintenance',      String(MACH_REAL.filter((m: any) => m.statut === 'maintenance').length), '#f59e0b'],
        ['fa-times-circle','Arrêtées',            String(MACH_REAL.filter((m: any) => m.statut === 'arret').length), '#ef4444'],
        ['fa-euro-sign',   'OPEX réel conso. (YTD)', fmtEur(opexTotalReel), '#16a34a'],
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
          <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Actions</th>
        </tr></thead>
        <tbody id="poste-tbody">${POSTES.map((p:any) => {
          const ox = posteOpex[String(p.id)] || { reel: 0, machines: [] }
          const nbM = machCountByPoste[String(p.id)] || 0, nbP = procCountByPoste[String(p.id)] || 0
          const dm = machListByPoste[String(p.id)] || [], dp = procListByPoste[String(p.id)] || []
          const canExpand = (dm.length + dp.length) > 0
          return `<tr data-poid="${p.id}" draggable="true" ondragstart="rowDragStart(event,'${p.id}','poste')" ondragover="rowDragOver(event)" ondrop="rowDrop(event,'${p.id}','poste')" ondragend="rowDragEnd(event)" style="border-bottom:1px solid #f9fafb;cursor:move;">
            <td style="padding:10px 14px;font-weight:700;color:#1e293b;"><i class="fas fa-grip-vertical" style="color:#cbd5e1;margin-right:6px;cursor:grab;" title="Glisser pour réordonner les postes"></i>${canExpand ? `<button id="postexp-${p.id}" onclick="postToggleDet('${p.id}')" title="Voir process & machines du poste" style="border:none;background:none;cursor:pointer;color:#94a3b8;margin-right:5px;font-size:.78rem;"><i class="fas fa-chevron-right"></i></button>` : '<span style="display:inline-block;width:15px;"></span>'}<span style="display:inline-block;width:9px;height:9px;border-radius:3px;background:${p.couleur};margin-right:7px;"></span>${escX(p.nom)}</td>
            <td style="padding:10px 14px;font-family:monospace;font-size:.75rem;color:#6b7280;">${escX(p.code||'—')}</td>
            <td style="padding:10px 14px;"><span style="background:${p.activite==='Seem'?'#dbeafe':p.activite==='Semrac'?'#fce7f3':p.activite==='OAS'?'#ccfbf1':'#f3e8ff'};color:${p.activite==='Seem'?'#1d4ed8':p.activite==='Semrac'?'#be185d':p.activite==='OAS'?'#0f766e':'#5b21b6'};border-radius:6px;padding:2px 8px;font-size:.7rem;font-weight:700;">${p.activite||'—'}</span>${p.activite==='OAS'?' <span title="Hors planning — alimente les bains OAS" style="font-size:.58rem;color:#0f766e;"><i class="fas fa-flask"></i></span>':''}</td>
            <td style="padding:10px 14px;text-align:center;font-weight:700;color:${nbM>0?'#0ea5e9':'#cbd5e1'};">${nbM||'—'}</td>
            <td style="padding:10px 14px;text-align:center;font-weight:700;color:${nbP>0?'#8b5cf6':'#cbd5e1'};">${nbP||'—'}</td>
            <td style="padding:10px 14px;text-align:center;font-weight:800;color:${ox.reel>0?'#16a34a':'#cbd5e1'};">${ox.reel>0?fmtEur(ox.reel):'—'}</td>
            <td style="padding:10px 14px;text-align:center;white-space:nowrap;">
              <button onclick="openProcModalForPoste('${p.id}')" title="Créer un process dans ce poste" style="background:#fff7ed;color:#ea580c;border:1px solid #fed7aa;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.68rem;font-weight:700;margin-right:8px;"><i class="fas fa-plus" style="margin-right:3px;"></i>Process</button>
              <button onclick="openPosteEdit('${p.id}')" title="Modifier" style="background:#f5f3ff;color:#7c3aed;border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:.7rem;font-weight:700;margin-right:4px;"><i class="fas fa-edit"></i></button>
              <button onclick="deletePosteFn('${p.id}','${(p.nom||'').replace(/[<>"'\\]/g,'')}')" title="Supprimer" style="background:#fef2f2;color:#dc2626;border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:.7rem;font-weight:700;"><i class="fas fa-trash"></i></button>
            </td>
          </tr>${canExpand ? `<tr id="postdet-${p.id}" style="display:none;background:#faf9ff;"><td colspan="7" style="padding:2px 14px 12px 42px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;padding-top:6px;">
              <div><div style="font-size:.62rem;font-weight:800;text-transform:uppercase;color:#8b5cf6;margin-bottom:5px;"><i class="fas fa-sitemap" style="margin-right:4px;"></i>Process (${dp.length})</div>${dp.length ? dp.map((x:any)=>`<div style="display:flex;align-items:center;gap:6px;font-size:.74rem;color:#374151;padding:3px 0;border-bottom:1px solid #f1f5f9;"><span style="font-weight:600;">${escX(x.nom)}</span><span style="font-size:.6rem;background:#ede9fe;color:#6d28d9;border-radius:5px;padding:1px 6px;">${procType(x)}</span>${typeProcess(x) === 'machine' && x.machine_id && machNameById[x.machine_id] ? `<span style="font-size:.6rem;background:#e0f2fe;color:#0369a1;border-radius:5px;padding:1px 6px;" title="Machine rattachée à ce process"><i class="fas fa-cog" style="margin-right:3px;"></i>${escX(machNameById[x.machine_id])}</span>` : (typeProcess(x) === 'machine' ? '<span style="font-size:.58rem;color:#f59e0b;font-weight:700;" title="Ce process nécessite une machine — aucune rattachée"><i class="fas fa-triangle-exclamation" style="margin-right:2px;"></i>machine à rattacher</span>' : '')}${procTauxBadge(x)}<button onclick="openProcEdit('${x.id}')" title="Modifier ce process (nom, type, machine, taux horaire machine, poste)" style="margin-left:auto;background:#eef2ff;color:#4f46e5;border:none;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:.66rem;font-weight:700;"><i class="fas fa-pen"></i></button><button onclick="deleteProc('${x.id}','${(x.nom||'').replace(/[<>"'\\]/g,'')}')" title="Supprimer ce process" style="background:#fef2f2;color:#dc2626;border:none;border-radius:5px;padding:2px 8px;cursor:pointer;font-size:.66rem;font-weight:700;"><i class="fas fa-trash"></i></button></div>`).join('') : '<div style="font-size:.7rem;color:#cbd5e1;">Aucun process rattaché</div>'}</div>
              <div><div style="font-size:.62rem;font-weight:800;text-transform:uppercase;color:#0ea5e9;margin-bottom:5px;"><i class="fas fa-cogs" style="margin-right:4px;"></i>Machines (${dm.length})</div>${dm.length ? dm.map((x:any)=>`<div style="font-size:.74rem;color:#374151;padding:3px 0;border-bottom:1px solid #f1f5f9;"><span style="font-weight:600;">${escX(x.nom)}</span>${x.cnc?' <span style="font-size:.58rem;background:#e0f2fe;color:#0369a1;border-radius:5px;padding:1px 6px;font-weight:700;">CNC</span>':''}<span style="float:right;color:${machOpex[String(x.id)]?'#16a34a':'#cbd5e1'};font-weight:700;">${machOpex[String(x.id)]?fmtEur(machOpex[String(x.id)].total):'—'}</span></div>`).join('') : '<div style="font-size:.7rem;color:#cbd5e1;">Aucune machine rattachée</div>'}</div>
            </div></td></tr>` : ''}`
        }).join('')}</tbody>
        <tfoot><tr style="background:#faf5ff;border-top:2px solid #ede9fe;">
          <td colspan="5" style="padding:10px 14px;font-weight:800;color:#7c3aed;">TOTAL POSTES</td>
          <td style="padding:10px 14px;text-align:center;font-weight:800;color:#16a34a;">${fmtEur(Object.values(posteOpex).reduce((s:number,o:any)=>s+o.reel,0))}</td>
          <td></td>
        </tr></tfoot>
      </table></div>`}
      <div style="padding:10px 18px;border-top:1px solid #f1f5f9;font-size:.7rem;color:#64748b;">
        <i class="fas fa-bolt" style="color:#8b5cf6;margin-right:5px;"></i><strong>OPEX poste</strong> = somme de l'OPEX réel de ses machines (consommables sortis du stock) + consommables tirés directement au poste (postes manuels). Ce calcul est repris à l'identique en Maintenance.<br><i class="fas fa-euro-sign" style="color:#0d9488;margin-right:5px;"></i><strong>Coût horaire</strong> : seul le <strong>process</strong> en porte un. Un process <strong>machine</strong> porte son <strong>taux horaire machine</strong>, saisi à la main (crayon du process) ; le temps homme est valorisé au <strong>coût chargé RH</strong> des opérateurs (fiche salarié)${TAUX_HOMME_ATELIER && TAUX_HOMME_ATELIER.moyen != null ? ` — moyenne atelier ${fmtTaux(TAUX_HOMME_ATELIER.moyen)} €/h` : ''}. Ni la machine ni le poste ne portent de taux.
      </div>
    </div>


    </div><!-- /vol-pp -->

    <!-- VOLET « Machines » -->
    <div id="vol-mach" style="display:none;">
    <!-- Liste machines -->
    <div class="card" style="overflow:hidden;margin-bottom:20px;">
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;font-weight:700;color:#1e293b;font-size:.88rem;display:flex;align-items:center;justify-content:space-between;">
        <span><i class="fas fa-table" style="color:#f97316;margin-right:7px;"></i>Parc machines — Détail OPEX réel</span>
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
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Capa./j</th>
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#16a34a;">OPEX réel conso. (YTD)</th>
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Postes</th>
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Statut</th>
            <th style="text-align:center;padding:10px 14px;font-size:.68rem;font-weight:800;text-transform:uppercase;color:#6b7280;">Actions</th>
          </tr></thead>
          <tbody id="mach-tbody">
            ${MACH_REAL.length === 0 ? '<tr><td colspan="9" style="text-align:center;padding:28px;color:#94a3b8;">Aucune machine. Cliquez sur « Nouvelle machine ».</td></tr>' : MACH_REAL.map((m: any) => {
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
                <td style="padding:10px 14px;text-align:center;color:#6b7280;">${m.capacite_h ?? 8} h</td>
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
              <td colspan="5" style="padding:10px 14px;font-weight:800;color:#c2410c;">TOTAL PARC</td>
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
        <div><label class="form-label">Activité *</label><select id="p_activite" class="form-input" onchange="procTypeChange()"><option value="Seem">Seem</option><option value="Semrac">Semrac</option><option value="both">Seem &amp; Semrac</option></select></div>
        <div><label class="form-label">Type *</label><select id="p_type" class="form-input" onchange="procTypeChange()"><option value="machine">Machine</option><option value="manuel">Manuel</option><option value="oas">OAS (traitement de surface)</option></select></div>
        <div id="p_machine_wrap"><label class="form-label">Machine rattachée</label><select id="p_machine" class="form-input"></select></div>
        <div id="p_taux_wrap" style="grid-column:span 2;"><label class="form-label">Taux horaire machine <span style="color:#0d9488;font-weight:600;">(€/h HT)</span></label><input id="p_taux" type="number" step="0.01" min="0" placeholder="À saisir — ex : 55" class="form-input"/>
          <div style="font-size:.66rem;color:#94a3b8;margin-top:4px;"><i class="fas fa-info-circle" style="margin-right:3px;"></i>Porté par le <strong>process</strong> (et non par la machine) : il valorise les heures machine (réglage machine + temps machine variable). Vide = « taux à saisir » (coût machine à 0 en attendant).</div></div>
        <div id="p_taux_note" style="grid-column:span 2;display:none;font-size:.7rem;color:#475569;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;padding:8px 10px;"></div>
        <div><label class="form-label">Catégorie</label><input id="p_categorie" type="text" placeholder="Usinage, Finition…" class="form-input"/></div>
        <div><label class="form-label">Poste <span style="color:#8b5cf6;font-weight:600;">de travail</span></label><select id="p_poste" class="form-input"></select></div>
        <div><label class="form-label">Ordre d'affichage</label><input id="p_ordre" type="number" value="100" class="form-input"/></div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('procModal')" class="btn btn-secondary">Annuler</button><button onclick="createProcess()" class="btn btn-primary"><i class="fas fa-plus"></i> Créer le process</button></div>
    </div>
  </div>
  <!-- Modal Modifier process (nom, type, machine rattachée, taux horaire machine, poste) -->
  <div id="procEditModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:520;">
    <div style="background:white;border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:460px;margin:1rem;overflow:hidden;">
      <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#6366f1,#4f46e5);"><h3 style="font-weight:700;color:white;font-size:.95rem;"><i class="fas fa-pen" style="margin-right:8px;"></i>Modifier le process</h3><button onclick="closeModal('procEditModal')" style="color:rgba(255,255,255,.7);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:14px;">
        <input type="hidden" id="pe_id"/>
        <div><label class="form-label">Nom du process *</label><input id="pe_nom" type="text" class="form-input"/></div>
        <div><label class="form-label">Type *</label><select id="pe_type" class="form-input" onchange="peTypeChange()"><option value="machine">Machine</option><option value="manuel">Manuel</option><option value="oas">OAS (traitement de surface)</option></select></div>
        <div id="pe_machine_wrap"><label class="form-label">Machine rattachée</label><select id="pe_machine" class="form-input"></select>
          <div style="font-size:.66rem;color:#94a3b8;margin-top:4px;"><i class="fas fa-info-circle" style="margin-right:3px;"></i>Un process machine sans machine rattachée reste « Machine » (signalé « machine à rattacher »).</div></div>
        <div id="pe_taux_wrap"><label id="pe_taux_lbl" class="form-label">Taux horaire machine <span style="color:#0d9488;font-weight:600;">(€/h HT)</span></label><input id="pe_taux" type="number" step="0.01" min="0" placeholder="À saisir — ex : 55" class="form-input"/>
          <div id="pe_taux_note" style="font-size:.66rem;color:#94a3b8;margin-top:4px;"></div></div>
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
        <div><label class="form-label">Tolérance ± (mm) <span style="color:#0d9488;font-weight:600;">capabilité</span></label><input id="mc_tolerance" type="number" step="any" placeholder="ex : 0.05" class="form-input"/></div>
        <div><label class="form-label">Statut</label><select id="mc_statut" class="form-input"><option value="operationnel">Opérationnel</option><option value="maintenance">Maintenance</option><option value="arret">Arrêt</option></select></div>
        <div><label class="form-label">Poste <span style="color:#8b5cf6;font-weight:600;">de travail</span></label><select id="mc_poste" class="form-input" onchange="mcPosteChange()"></select></div>
        <div style="grid-column:span 2;"><label style="display:flex;align-items:center;gap:8px;font-size:.82rem;color:#374151;cursor:pointer;"><input id="mc_cnc" type="checkbox" style="width:15px;height:15px;"/> <i class="fas fa-microchip" style="color:#0ea5e9;"></i> Machine <strong>CNC</strong> <span style="font-size:.7rem;color:#94a3b8;font-weight:600;">— porte des codes programme (saisis en préparation technique) ; les machines non-CNC n'en ont pas</span></label></div>
        <div style="grid-column:span 2;"><label class="form-label">Opérations possibles (séparées par virgule)</label><input id="mc_operations" type="text" placeholder="Usinage CN, Tronçonnage…" class="form-input"/></div>
        <div style="grid-column:span 2;" id="mc_process_wrap"><label class="form-label">Process rattachés <span style="color:#8b5cf6;font-weight:600;">(du poste — plusieurs possibles)</span></label><div id="mc_proc_list" style="max-height:130px;overflow:auto;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 11px;background:#f8fafc;"></div><label id="mc_proc_new_wrap" style="display:flex;align-items:center;gap:6px;margin-top:7px;font-size:.76rem;color:#374151;cursor:pointer;"><input id="mc_proc_new" type="checkbox" onchange="mcProcNewChange()"/> Créer aussi un nouveau process (au nom de la machine)</label><div id="mc_proc_taux_wrap" style="display:none;margin-top:6px;"><label class="form-label">Taux horaire machine du nouveau process <span style="color:#0d9488;font-weight:600;">(€/h HT)</span></label><input id="mc_proc_taux" type="number" step="0.01" min="0" placeholder="À saisir — ex : 55" class="form-input"/></div><div style="font-size:.66rem;color:#94a3b8;margin-top:3px;"><i class="fas fa-bolt" style="margin-right:3px;color:#f59e0b;"></i>La machine est rattachée à <strong>ces</strong> process. La machine ne porte <strong>aucun taux</strong> : le <strong>taux horaire machine (€/h)</strong> se saisit sur chaque <strong>process</strong> (crayon du process, volet « Postes &amp; Process »).</div></div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;"><button onclick="closeModal('machineModal')" class="btn btn-secondary">Annuler</button><button id="mc_save_btn" onclick="createMachineFn()" class="btn btn-primary"><i class="fas fa-plus"></i> Créer la machine</button></div>
    </div>
  </div>
</div>

<script>
// Machines : plus aucun taux (14/09/2026) — le taux horaire machine est porté par le PROCESS.
var MACH_DATA = ${sjX(MACH_REAL.map((m:any)=>({id:m.id,nom:m.nom,code:m.code,activite:m.activite,categorie:m.categorie,capacite_h:m.capacite_h,tolerance_defaut:(m.tolerance_defaut ?? null),poste_id:(m.poste_id ?? null),cnc:!!m.cnc,operations:Array.isArray(m.operations)?m.operations.join(', '):(m.operations||''),statut:m.statut})))};
var POSTES_JS = ${sjX(POSTES)};
// Moyennes du coût chargé RH des opérateurs actifs { moyen, seem, semrac, manquant } — null si non fournies à la page.
var TAUX_HOMME_ATELIER = ${sjX(TAUX_HOMME_ATELIER)};
function _posteOptions(sel){ return '<option value="">— Aucun poste —</option>'+(POSTES_JS||[]).map(function(p){ return '<option value="'+p.id+'"'+(String(sel)===String(p.id)?' selected':'')+'>'+String(p.nom||'').replace(/</g,'&lt;')+'</option>'; }).join(''); }
function postToggleDet(id){ var r=document.getElementById('postdet-'+id), b=document.getElementById('postexp-'+id); if(!r) return; var open=(r.style.display==='none'); r.style.display=open?'':'none'; if(b) b.innerHTML=open?'<i class="fas fa-chevron-down"></i>':'<i class="fas fa-chevron-right"></i>'; }
// ── Taux horaire (14/09/2026) : seul le PROCESS porte un taux, et seulement le process machine. ──
function _fmtTauxH(v){ return (Math.round((Number(v)||0)*100)/100).toLocaleString('fr-FR',{minimumFractionDigits:0,maximumFractionDigits:2}); }
// Note d un process manuel : le temps homme est valorisé au coût chargé RH (moyenne du site si connue, sinon de l atelier).
function _noteProcessManuel(activite){
  var t=TAUX_HOMME_ATELIER, site=String(activite||'').toLowerCase(), moy=null, lib='atelier';
  if(t){ if((site==='seem'||site==='semrac') && t[site]!=null){ moy=t[site]; lib='atelier '+(site==='seem'?'Seem':'Semrac'); } else if(t.moyen!=null){ moy=t.moyen; } }
  var txt='Process manuel : le temps homme est valorisé au coût chargé RH de l\\'opérateur (fiche salarié)';
  if(moy!=null) txt+=' — moyenne '+lib+' '+_fmtTauxH(moy)+' €/h.';
  else if(t && t.manquant) txt+=' — <strong style="color:#c2410c;">coût chargé RH à renseigner</strong> (aucun opérateur actif n\\'a de coût chargé).';
  else txt+='.';
  return '<i class="fas fa-user" style="margin-right:4px;color:#64748b;"></i>'+txt;
}
// Lecture d un champ taux : { ok, val } — val = null (vide = à saisir) ou nombre ≥ 0 ; ok=false si saisie invalide.
function _lireTaux(el){
  if(!el) return {ok:true,val:null};
  if(el.validity && el.validity.badInput) return {ok:false,val:null};
  var s=String(el.value==null?'':el.value).trim().replace(',', '.');
  if(s==='') return {ok:true,val:null};
  var n=Number(s);
  if(!isFinite(n)||n<0) return {ok:false,val:null};
  return {ok:true,val:n};
}
// Avertissement serveur (base cloud sans la colonne process_atelier.taux_horaire_machine : jouer cloud-7) — affiché longtemps.
// Le rechargement qui suit l enregistrement effacerait la notification avant qu elle soit lue : le message est aussi
// gardé en sessionStorage et RÉAFFICHÉ au chargement suivant de la page (voir l IIFE ci-dessous).
function _avertTaux(j){
  if(!(j && j.avertissement)) return;
  var m=String(j.avertissement).replace(/</g,'&lt;');
  pushNotif('warn','fa-triangle-exclamation',m,12000);
  try{ sessionStorage.setItem('__erpAvertTaux', JSON.stringify({ m:m, p:location.pathname, t:Date.now() })); }catch(e){}
}
(function(){ try{
  var raw=sessionStorage.getItem('__erpAvertTaux'); if(!raw) return; sessionStorage.removeItem('__erpAvertTaux');
  var o=JSON.parse(raw); if(!o||!o.m||o.p!==location.pathname||(Date.now()-(o.t||0))>60000) return;
  var show=function(){ if(typeof pushNotif==='function') pushNotif('warn','fa-triangle-exclamation',o.m,20000); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){ setTimeout(show,400); }); else setTimeout(show,400);
}catch(e){} })();
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
  document.getElementById('mc_capacite').value='8';
  document.getElementById('mc_activite').value='Seem'; document.getElementById('mc_statut').value='operationnel';
  var mp=document.getElementById('mc_poste'); if(mp) mp.innerHTML=_posteOptions('');
  var pnw=document.getElementById('mc_proc_new_wrap'); if(pnw) pnw.style.display='';
  var pn=document.getElementById('mc_proc_new'); if(pn) pn.checked=true;   // création : propose un nouveau process par défaut
  var pt=document.getElementById('mc_proc_taux'); if(pt) pt.value='';
  mcProcNewChange();
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
  document.getElementById('mc_capacite').value=m.capacite_h!=null?m.capacite_h:8;
  document.getElementById('mc_tolerance').value=m.tolerance_defaut!=null?m.tolerance_defaut:'';
  document.getElementById('mc_operations').value=m.operations||'';
  document.getElementById('mc_statut').value=(m.statut==='maintenance'||m.statut==='arret')?m.statut:'operationnel';
  document.getElementById('mc_process_wrap').style.display='';
  var mp=document.getElementById('mc_poste'); if(mp) mp.innerHTML=_posteOptions(m.poste_id||'');
  var pnw=document.getElementById('mc_proc_new_wrap'); if(pnw) pnw.style.display='none';   // édition : pas de création de process ici
  var pn=document.getElementById('mc_proc_new'); if(pn) pn.checked=false;
  mcProcNewChange();
  var _att=(PROCESS||[]).filter(function(p){ return String(p.machine_id||'')===String(m.id) && String(p.poste_id||'')===String(m.poste_id||''); }).map(function(p){return p.id;});   // TOUS les process du poste déjà rattachés à cette machine
  mcFillProcess(_att);
  var cc=document.getElementById('mc_cnc'); if(cc) cc.checked=!!m.cnc;
  document.getElementById('machineModal').style.display='flex';
}
// Case « Créer aussi un nouveau process » : le taux horaire machine de ce process peut être saisi tout de suite (création seulement).
function mcProcNewChange(){
  var pn=document.getElementById('mc_proc_new'), w=document.getElementById('mc_proc_taux_wrap');
  var creation=!((document.getElementById('mc_id')||{}).value);
  if(w) w.style.display=(creation && pn && pn.checked)?'':'none';
}
window.mcProcNewChange=mcProcNewChange;
function createMachineFn(){
  var nom=(document.getElementById('mc_nom').value||'').trim(); if(!nom){ pushNotif('err','fa-exclamation-circle','Nom de la machine requis.'); return; }
  var id=document.getElementById('mc_id').value;
  // Plus de cout_h (14/09/2026) : la machine ne porte aucun taux, le taux horaire machine se saisit sur le process.
  var payload={ nom:nom, code:(document.getElementById('mc_code').value||'').trim(), activite:document.getElementById('mc_activite').value, categorie:(document.getElementById('mc_categorie').value||'').trim(), capacite_h:parseFloat(document.getElementById('mc_capacite').value)||8, tolerance_defaut:(document.getElementById('mc_tolerance').value!==''?parseFloat(document.getElementById('mc_tolerance').value):null), statut:document.getElementById('mc_statut').value, operations:document.getElementById('mc_operations').value };
  if(POSTES_JS && POSTES_JS.length){ var _mp=document.getElementById('mc_poste'); if(_mp) payload.poste_id=_mp.value||''; }   // rattachement poste (seulement si des postes existent → compat pré-migration)
  var _cc=document.getElementById('mc_cnc'); if(_cc) payload.cnc=_cc.checked;   // CNC (le serveur réessaie sans si colonne absente)
  var poste=(document.getElementById('mc_poste')||{}).value||'';
  var checked=[].slice.call(document.querySelectorAll('#mc_proc_list .mc-proc-cb:checked')).map(function(cb){return String(cb.value);});   // process cochés (rattachés)
  var makeNew=!!((document.getElementById('mc_proc_new')||{}).checked);
  var url, method, tauxNouveau=null;
  if(id){ url='/api/production/machine/'+encodeURIComponent(id); method='PATCH'; }
  else {
    url='/api/production/machine'; method='POST'; payload.create_process=makeNew;   // « nouveau process » = create_process serveur (POST)
    if(makeNew){   // taux horaire machine du process créé avec la machine (optionnel : vide = « taux à saisir »)
      var lt=_lireTaux(document.getElementById('mc_proc_taux'));
      if(!lt.ok){ pushNotif('err','fa-ban','Taux horaire machine invalide : un nombre positif ou nul (€/h), ou vide.'); return; }
      if(lt.val!=null){ payload.taux_horaire_machine=lt.val; tauxNouveau=lt.val; }
    }
  }
  fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Enregistrement échoué.'); return; }
    var mid=(j.machine&&j.machine.id)||id;
    var done=function(){
      var suite='';
      if(!id && makeNew && j.process_id && tauxNouveau==null && !j.avertissement) suite=' Process créé : <strong>taux horaire machine à saisir</strong> (crayon du process).';
      else if(!id && makeNew && !j.process_id) suite=' Le process associé n\\'a pas pu être créé.';
      pushNotif('ok','fa-cog','Machine <strong>'+String(nom).replace(/</g,'&lt;')+'</strong> '+(id?'modifiée':'créée')+'.'+suite,6000);
      _avertTaux(j);
      setTimeout(function(){ softReload(); },j.avertissement?2500:750);
    };
    // SYNCHRONISATION machine ↔ process : pour chaque process DU POSTE,
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
  // Ses process sont détachés, PAS convertis : un process machine reste machine, avec son taux horaire (à rattacher).
  var nbP=(typeof PROCESS!=='undefined'?PROCESS:[]).filter(function(p){ return String(p.machine_id||'')===String(id); }).length;
  var suiteP=nbP?(' Ses '+nbP+' process restent des process machine, avec leur taux horaire : ils seront à rattacher à une autre machine.'):'';
  if(!await appConfirm('Supprimer la machine '+nom+' ?'+suiteP+' Cette action est irréversible.')) return;
  fetch('/api/production/machine/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',_escH((j&&j.error)||'Suppression échouée.'),8000); return; }
    pushNotif('ok','fa-trash','Machine supprimée.'+(j.process_detaches?(' '+j.process_detaches+' process détaché(s), toujours de type machine.'):''),4500); setTimeout(function(){ softReload(); },900);
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
// ─── Process Ateliers (référentiel machine / manuel / OAS) ─────────
// (14/09/2026) Seul le PROCESS porte un taux horaire, et seulement le process MACHINE (taux_horaire_machine, saisi à la main).
function _escH(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
var NOTE_PROCESS_OAS='<i class="fas fa-flask" style="margin-right:4px;color:#0e7490;"></i>Process OAS : chiffré au prix (forfait / prix unitaire), jamais au temps — aucun taux horaire.';
var MSG_TAUX_INVALIDE='Taux horaire machine invalide : un nombre positif ou nul (€/h), ou vide pour « taux à saisir ».';
function fillProcMachineSelect(){ var sel=document.getElementById('p_machine'); if(!sel) return; sel.innerHTML='<option value="">— Choisir une machine —</option>'+MACHINES_PROC.map(function(m){return '<option value="'+_escH(m.id)+'">'+_escH(m.nom)+' ('+_escH(m.activite)+')</option>';}).join(''); }
// Création : machine rattachée + taux horaire machine seulement pour un process MACHINE ; manuel = note coût chargé RH ; OAS = pas de taux.
function procTypeChange(){
  var t=document.getElementById('p_type').value;
  var w=document.getElementById('p_machine_wrap'); if(w) w.style.display=(t==='machine')?'':'none';
  var tw=document.getElementById('p_taux_wrap'); if(tw) tw.style.display=(t==='machine')?'':'none';
  var n=document.getElementById('p_taux_note');
  if(n){
    if(t==='manuel'){ n.innerHTML=_noteProcessManuel((document.getElementById('p_activite')||{}).value); n.style.display=''; }
    else if(t==='oas'){ n.innerHTML=NOTE_PROCESS_OAS; n.style.display=''; }
    else { n.innerHTML=''; n.style.display='none'; }
  }
}
function openProcModal(){ document.getElementById('p_nom').value=''; document.getElementById('p_code').value=''; document.getElementById('p_activite').value='Seem'; document.getElementById('p_type').value='machine'; document.getElementById('p_categorie').value=''; document.getElementById('p_ordre').value='100'; var pt=document.getElementById('p_taux'); if(pt) pt.value=''; var pp=document.getElementById('p_poste'); if(pp) pp.innerHTML=_posteOptions(''); fillProcMachineSelect(); procTypeChange(); var m=document.getElementById('procModal'); if(m) m.style.display='flex'; }
function createProcess(){
  var nom=(document.getElementById('p_nom').value||'').trim(); if(!nom){ pushNotif('err','fa-exclamation-circle','Nom du process requis.'); return; }
  var type=document.getElementById('p_type').value; var reqM=(type==='machine'); var estOas=(type==='oas');
  var payload={nom:nom,code:(document.getElementById('p_code').value||'').trim(),activite:document.getElementById('p_activite').value,requiert_machine:reqM,est_oas:estOas,categorie:(document.getElementById('p_categorie').value||'').trim(),ordre:parseInt(document.getElementById('p_ordre').value)||100};
  if(reqM){
    var mid=document.getElementById('p_machine').value; if(mid) payload.machine_id=mid;
    var lt=_lireTaux(document.getElementById('p_taux'));
    if(!lt.ok){ pushNotif('err','fa-ban',MSG_TAUX_INVALIDE); return; }
    if(lt.val!=null) payload.taux_horaire_machine=lt.val;   // vide : non envoyé → null en base = « taux à saisir »
  }
  if(POSTES_JS && POSTES_JS.length){ var _pp=document.getElementById('p_poste'); if(_pp) payload.poste_id=_pp.value||''; }
  fetch('/api/production/process',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',_escH((j&&j.error)||'Création échouée.')); return; }
    var suite=(reqM && payload.taux_horaire_machine==null) ? ' Taux horaire machine <strong>à saisir</strong> (crayon du process).' : '';
    pushNotif('ok','fa-plus-circle','Process <strong>'+_escH(nom)+'</strong> créé.'+suite,5000);
    _avertTaux(j);
    setTimeout(function(){ softReload(); },j.avertissement?2500:650);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
async function deleteProc(id, nom){
  if(!await appConfirm('Supprimer le process « '+nom+' » ?')) return;
  fetch('/api/production/process/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Suppression échouée.'); return; }
    pushNotif('ok','fa-trash','Process supprimé.'); setTimeout(function(){ softReload(); },500);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
// Édition d un process : nom, type, machine rattachée, taux horaire machine (process machine seulement), poste.
var _peProc=null;
function openProcEdit(id){
  var p=(typeof PROCESS!=='undefined'?PROCESS:[]).find(function(x){return String(x.id)===String(id);}); if(!p){ pushNotif('err','fa-ban','Process introuvable.'); return; }
  _peProc=p;
  document.getElementById('pe_id').value=id;
  document.getElementById('pe_nom').value=p.nom||'';
  var ty=document.getElementById('pe_type'); if(ty) ty.value=(p.type==='oas'||p.type==='manuel')?p.type:'machine';
  var sel=document.getElementById('pe_machine');
  var machs=(typeof MACHINES_PROC!=='undefined'?MACHINES_PROC:[]);
  sel.innerHTML='<option value="">— Aucune machine rattachée —</option>'+machs.map(function(m){return '<option value="'+_escH(m.id)+'"'+(String(m.id)===String(p.machine_id)?' selected':'')+'>'+_escH(m.nom)+' ('+_escH(m.activite)+')</option>';}).join('');
  var pp=document.getElementById('pe_poste'); if(pp) pp.innerHTML=_posteOptions(p.poste_id||'');
  // Taux : valeur SAISIE sur le process. Transition (colonne absente) : le taux en vigueur vient de la machine, pré-rempli
  // pour information et renvoyé seulement s il est modifié (data-init).
  var tx=document.getElementById('pe_taux');
  var init=p.taux_col ? p.taux_horaire_machine : (p.taux_source==='transition_machine' ? p.taux_machine : null);
  var initS=(init!=null?String(init):'');
  tx.setAttribute('data-init',initS); tx.setAttribute('data-last',initS); tx.value=''; tx.disabled=true;
  peTypeChange();
  document.getElementById('procEditModal').style.display='flex';
}
function peTypeChange(){
  var t=(document.getElementById('pe_type')||{}).value||'machine';
  var p=_peProc||{};
  var mw=document.getElementById('pe_machine_wrap'); if(mw) mw.style.display=(t==='machine')?'':'none';
  var tx=document.getElementById('pe_taux'), lbl=document.getElementById('pe_taux_lbl'), note=document.getElementById('pe_taux_note');
  if(!tx) return;
  if(t==='machine'){
    if(tx.disabled) tx.value=tx.getAttribute('data-last')||'';   // retour au type machine : restitue la saisie
    tx.disabled=false; tx.style.display=''; if(lbl) lbl.style.display='';
    var h='<i class="fas fa-info-circle" style="margin-right:3px;"></i>Porté par le <strong>process</strong>, saisi à la main : il valorise les heures machine (réglage machine + temps machine variable). Le temps homme est valorisé au coût chargé RH. Vide = « taux à saisir » (coût machine à 0).';
    if(p.taux_col===false) h+='<div style="margin-top:5px;color:#b45309;font-weight:600;"><i class="fas fa-triangle-exclamation" style="margin-right:3px;"></i>Cette base n\\'a pas encore la colonne du taux process : le coût utilise en transition le coût horaire de la machine'+(p.taux_source==='transition_machine'?' ('+_fmtTauxH(p.taux_machine)+' €/h)':' (non renseigné)')+'. Un nouveau taux ne sera enregistré qu\\'après le script docker/db/cloud/cloud-7 (Studio Supabase en ligne).</div>';
    if(note) note.innerHTML=h;
  } else {
    if(!tx.disabled) tx.setAttribute('data-last',tx.value);
    tx.value=''; tx.disabled=true;
    tx.style.display=(t==='oas')?'none':''; if(lbl) lbl.style.display=(t==='oas')?'none':'';
    if(note) note.innerHTML=(t==='oas')?NOTE_PROCESS_OAS:_noteProcessManuel(p.activite);
  }
}
window.peTypeChange=peTypeChange;
function saveProcEdit(){
  var id=document.getElementById('pe_id').value;
  var nom=(document.getElementById('pe_nom').value||'').trim(); if(!nom){ pushNotif('err','fa-exclamation-circle','Nom requis.'); return; }
  var t=(document.getElementById('pe_type')||{}).value||'machine';
  var p=_peProc||{};
  // Le type est choisi explicitement (plus déduit de la machine) : un process machine sans machine reste « machine ».
  var mid=(t==='machine')?(document.getElementById('pe_machine').value||null):null;
  var _pePatch={nom:nom, requiert_machine:(t==='machine'), est_oas:(t==='oas'), machine_id:mid};
  if(POSTES_JS && POSTES_JS.length){ var _pep=document.getElementById('pe_poste'); if(_pep) _pePatch.poste_id=_pep.value||''; }
  var tauxEnvoye=false;
  if(t==='machine'){
    var tx=document.getElementById('pe_taux');
    var lt=_lireTaux(tx);
    if(!lt.ok){ pushNotif('err','fa-ban',MSG_TAUX_INVALIDE); return; }
    var modifie=String(tx.value==null?'':tx.value).trim()!==String(tx.getAttribute('data-init')||'').trim();
    // Colonne présente : le taux est toujours renvoyé AU PROCESS (vide = à saisir). Transition : seulement s il a été modifié.
    if(p.taux_col || modifie){ _pePatch.taux_horaire_machine=lt.val; tauxEnvoye=true; }
  }
  fetch('/api/production/process/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(_pePatch)}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif(j&&j.cloud7?'warn':'err',j&&j.cloud7?'fa-triangle-exclamation':'fa-ban',_escH((j&&j.error)||'Échec.'),j&&j.cloud7?12000:5000); return; }
    var msg='Process « '+_escH(nom)+' » mis à jour';
    if(tauxEnvoye && !j.avertissement) msg+=(_pePatch.taux_horaire_machine!=null)?(' — taux horaire machine '+_fmtTauxH(_pePatch.taux_horaire_machine)+' €/h'):' — taux horaire machine à saisir';
    pushNotif('ok','fa-check',msg+'.',5000);
    _avertTaux(j);
    setTimeout(function(){ softReload(); },j.avertissement?2500:600);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
// ─── Réordonnancement par glisser-déposer des lignes (postes / machines) → champ ordre ───
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
  var tid=kind==='poste'?'poste-tbody':'mach-tbody';
  var attr=kind==='poste'?'data-poid':'data-mid';
  var tbody=document.getElementById(tid); if(!tbody) return;
  var ids=Array.prototype.slice.call(tbody.children).map(function(r){return r.getAttribute(attr);}).filter(Boolean);
  var url=kind==='poste'?'/api/production/poste/reorder':'/api/production/machine/reorder';
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
var DAY_START=${PLAN_DEBUT_JOUR},DAY_END=${PLAN_FIN_JOUR},TOTAL_H=DAY_END-DAY_START,PX_H=50,LANE_W=TOTAL_H*50,SNAP=0.25;   // grille du planning = gamme.ts PLAN_DEBUT_JOUR / PLAN_FIN_JOUR
// Un BDT s'affiche le jour de sa date prévue ; sans date prévue → rattaché au jour réel (à programmer)
function bdtOnDay(b){ return (b.datePrevue || TODAY_REAL) === currentDate; }
// UN BDT EST DANS LA GOULOTTE tant qu'il n'a pas ete POSE sur le planning (11/09/2026).
// « Quand les BDT sont a programmer ils ne doivent pas apparaitre dans le planning : ils sont
//   programmes quand on les passe de la goulotte au planning. » Avant, l'appartenance se lisait
//   sur le process : un BDT dont l'operation portait le nom d'un process etait rattache d'office
//   a un poste et pose a 6 h sur le jour courant, A LA FOIS dans la goulotte et sur le planning.
//   Programme = pose (process + jour), jamais par defaut.
function enGoulotte(b){ var s=String(b.statut||''); if(s==='st'||b.op==='ST'||s==='recu'||s==='solde'||/^annul/.test(s)) return false; return s==='a_programmer'||!s||b.process==='pending'||!b.datePrevue; }
// ==CC-MOTEUR-DEBUT==
// ── CHEMIN CRITIQUE (lot C, 14/09/2026) : moteur REPRIS ligne à ligne de src/gamme.ts (auPlusTot,
//    controleEnchainement, violationsEnchainement). Toute modification se reporte des DEUX côtés :
//    le serveur cale / refuse la pose avec la même règle (test de parité lotc/test_chemin.ts).
//    Règle : l étape suivante d un lot ne démarre pas avant la fin du RÉGLAGE de l étape précédente.
var CC_DEBUT=DAY_START, CC_FIN=DAY_END, CC_HJ=CC_FIN-CC_DEBUT, CC_EPS=1e-6, CC_HEURE_DEFAUT=${PLAN_HEURE_DEFAUT};
function ccTxt(v){ return String(v==null?'':v).trim(); }
function ccNb(v){ var n=Number(v); return isFinite(n)?n:0; }
function ccNum(v){ if(v==null||v==='') return null; var n=Number(v); return isFinite(n)?n:null; }
function ccArr6(x){ return Math.round(x*1e6)/1e6; }
function ccCleLot(op){ return ccTxt(op&&op.lot_id)||ccTxt(op&&op.lot_ref); }
function ccAnnulee(op){ return /^annul/i.test(ccTxt(op&&op.statut)); }
function ccSoldee(op){
  if(!op) return false;
  if(ccTxt(op.date_retour_effective)) return true;
  var s=ccTxt(op.statut).toLowerCase();
  var estB=('sous_traitant_id' in op)||('date_retour_prevue' in op)||('date_envoi' in op);
  if(estB&&(s==='recu'||s==='reçu')) return true;
  return ['solde','soldé','termine','terminé','cloture','clôture','fini'].indexOf(s)>=0;
}
function ccEstBds(op){ return !!op&&(('sous_traitant_id' in op)||('date_retour_prevue' in op)||('date_envoi' in op)||('duree_days' in op)||('date_debut' in op)||('date_retour_effective' in op)); }
function ccSeq(o){ return (o==null||o.seq==null)?null:ccNb(o.seq); }
function ccGamme(ops){ return (ops||[]).slice().sort(function(a,b){ var sa=(a==null||a.seq==null)?9999:ccNb(a.seq), sb=(b==null||b.seq==null)?9999:ccNb(b.seq); if(sa!==sb) return sa-sb; var x=ccTxt(a&&a.id), y=ccTxt(b&&b.id); return x<y?-1:(x>y?1:0); }); }
function ccGroupePrec(cible,ops){
  var tri=ccGamme(ops), idc=ccTxt(cible&&cible.id), i=-1;
  for(var q=0;q<tri.length;q++){ if(ccTxt(tri[q]&&tri[q].id)===idc){ i=q; break; } }
  if(i<0) return [];
  var sc=ccSeq(cible), j=i-1;
  while(j>=0&&(ccAnnulee(tri[j])||(sc!=null&&ccSeq(tri[j])===sc))) j--;
  if(j<0) return [];
  var sp=ccSeq(tri[j]); if(sp==null) return [tri[j]];
  return tri.filter(function(o){ return !ccAnnulee(o)&&ccSeq(o)===sp; });
}
function ccIsoJour(j){ return new Date(j*86400000).toISOString().slice(0,10); }
function ccJour(iso){ var m=/^(\\d{4})-(\\d{2})-(\\d{2})/.exec(ccTxt(iso)); if(!m) return null; var t=Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3])); if(!isFinite(t)) return null; var j=Math.round(t/86400000); return ccIsoJour(j)===m[0]?j:null; }
function ccBorner(h){ return Math.min(CC_FIN,Math.max(CC_DEBUT,h)); }
function ccGrille(date,heure){ var j=ccJour(date), h=ccNum(heure); if(j==null||h==null) return null; return ccArr6(j*CC_HJ+ccBorner(h)-CC_DEBUT); }
function ccParId(a,b){ var x=ccTxt(a&&a.id), y=ccTxt(b&&b.id); return x<y?-1:(x>y?1:0); }
function ccTrierTextes(l){ return l.slice().sort(function(a,b){ return a<b?-1:(a>b?1:0); }); }
function ccFmtH(h){ var H=Math.floor(h); var m=Math.round((h-H)*60); if(m===60){ H++; m=0; } return H+'h'+(m>0?(m<10?'0'+m:String(m)):''); }
function ccJJMM(iso){ var m=/^(\\d{4})-(\\d{2})-(\\d{2})/.exec(ccTxt(iso)); return m?m[3]+'/'+m[2]:ccTxt(iso); }
function ccFmtNb(x){ return String(Math.round(x*100)/100).replace('.',','); }
function ccAjouter(dateIso,heure,h){
  var j=ccJour(dateIso), hh=ccNum(heure); if(j==null||hh==null) return null;
  var hn=ccNum(h), d=Math.max(0,hn==null?0:hn), depart=ccBorner(hh);
  if(d<=0) return {date:ccIsoJour(j),heure:ccArr6(depart)};
  var g=ccArr6(j*CC_HJ+(depart-CC_DEBUT)+d), jour=Math.floor(g/CC_HJ), reste=ccArr6(g-jour*CC_HJ);
  if(reste<=0){ jour-=1; reste=CC_HJ; }
  return {date:ccIsoJour(jour),heure:ccArr6(CC_DEBUT+reste)};
}
function ccVersDebut(p){ if(p.heure>=CC_FIN-CC_EPS) return {date:ccIsoJour(ccJour(p.date)+1),heure:CC_DEBUT}; return p; }
function ccHeureReelle(v){ var m=/^\\s*(\\d{1,2})[:h](\\d{2})/.exec(ccTxt(v)); if(!m) return null; var H=Number(m[1]), M=Number(m[2]); return (H>23||M>59)?null:ccArr6(H+M/60); }
function ccDebutBdt(op){
  var s=ccTxt(op&&op.statut).toLowerCase(), d=ccTxt(op&&op.date_prevue), h;
  if(ccSoldee(op)||s==='recu'||s==='reçu'){ if(ccJour(d)==null) return null; h=ccHeureReelle(op.debut_reel); if(h==null) h=ccNum(op.debut); return {date:d.slice(0,10),heure:(h==null?CC_HEURE_DEFAUT:h)}; }
  if(!s||s==='a_programmer'||s==='st'||ccAnnulee(op)||ccTxt(op&&op.operateur_id)==='ST') return null;
  if(!ccTxt(op&&op.process_id)||ccJour(d)==null) return null;
  h=ccNum(op.debut); return {date:d.slice(0,10),heure:(h==null?CC_HEURE_DEFAUT:h)};
}
function ccDureeBdt(op){ var a=ccNum(op&&op.duree); if(a==null) a=ccNum(op&&op.temps_alloue); return Math.max(0,a==null?0:a); }
function ccReglage(op){ return ccNum(op&&op.temps_reglage); }
function ccDebutBds(op){ var d=ccTxt(op&&op.date_debut)||ccTxt(op&&op.date_envoi); return ccJour(d)==null?null:d.slice(0,10); }
function ccDureeJoursBds(op){ var n=Number(op&&op.duree_days); if(op&&op.duree_days&&isFinite(n)) return Math.ceil(Math.max(1,n)); var a=ccJour(op&&op.date_envoi), b=ccJour(op&&op.date_retour_prevue); if(a!=null&&b!=null) return Math.max(1,b-a); return 5; }
function ccRetourBds(op){ var eff=ccTxt(op&&op.date_retour_effective); if(ccJour(eff)!=null) return eff.slice(0,10); var d=ccDebutBds(op); return d==null?null:ccIsoJour(ccJour(d)+ccDureeJoursBds(op)); }
function ccAuPlusTot(cible,opsDuLot){
  function aucune(r){ return {date:null,heure:null,regle:'aucune',depuis:null,raison:r}; }
  if(!cible) return aucune('opération inconnue');
  var k=ccCleLot(cible);
  if(!k) return aucune('sans lot : pas de gamme à respecter');
  if(cible.seq==null) return aucune('sans rang dans la gamme');
  var idC=ccTxt(cible.id);
  var ops=(opsDuLot||[]).filter(function(o){ return !!o&&ccCleLot(o)===k&&ccTxt(o.id)!==idC; });
  ops.push(cible);
  var bdsCible=ccEstBds(cible), cands=[], infos=[], libres=[];
  function pousser(p,regle,depuis,raison){ if(!p) return; var g=ccGrille(p.date,p.heure); if(g==null) return; cands.push({date:p.date,heure:p.heure,g:g,regle:regle,depuis:depuis,raison:raison}); }
  var G=ccGroupePrec(cible,ops).slice().sort(ccParId);
  var bdsG=G.filter(function(o){ return ccEstBds(o); }), bdtG=G.filter(function(o){ return !ccEstBds(o); });
  bdsG.forEach(function(s){ var r=ccRetourBds(s); if(r) pousser({date:r,heure:CC_DEBUT},'retour_st',ccTxt(s.id),'après le retour de sous-traitance de '+ccTxt(s.id)); else infos.push('sous-traitance '+ccTxt(s.id)+' non planifiée'); });
  if(bdtG.length){
    var nonSoldes=bdtG.filter(function(o){ return !ccSoldee(o); });
    if(!nonSoldes.length) libres.push('étape précédente soldée');
    else if(bdsCible||!!cible.oas_avant){
      var manquants=[];
      nonSoldes.forEach(function(m){ var d=ccDebutBdt(m); var fin=d?ccAjouter(d.date,d.heure,ccDureeBdt(m)):null; if(fin) pousser(fin,'fin_complete',ccTxt(m.id),'après la fin de '+ccTxt(m.id)+(bdsCible?'':' (passage OAS entre les deux)')); else manquants.push(ccTxt(m.id)); });
      if(manquants.length) infos.push('étape précédente non programmée ('+ccTrierTextes(manquants).join(', ')+')');
    } else {
      var porteurs=bdtG.filter(function(o){ var r=ccReglage(o); return (r==null?0:r)>0; });
      if(porteurs.length){
        var nonProg=[];
        porteurs.forEach(function(p){ var R=ccReglage(p); if(ccSoldee(p)){ libres.push('réglage de '+ccTxt(p.id)+' déjà fait'); return; } var d=ccDebutBdt(p); if(!d){ nonProg.push(ccTxt(p.id)); return; } pousser(ccAjouter(d.date,d.heure,R),'reglage',ccTxt(p.id),'après le réglage de '+ccTxt(p.id)+' ('+ccFmtNb(R)+' h)'); });
        if(nonProg.length){
          var tot=null;
          bdtG.forEach(function(m){ if(ccSoldee(m)) return; var d=ccDebutBdt(m); if(!d) return; var g=ccGrille(d.date,d.heure); if(g==null) return; if(!tot||g<tot.g||(g===tot.g&&ccTxt(m.id)<tot.id)) tot={d:d,g:g,id:ccTxt(m.id)}; });
          var lesP=ccTrierTextes(nonProg).join(', ');
          if(tot) pousser(ccAjouter(tot.d.date,tot.d.heure,0),'reglage',tot.id,'après le début de '+tot.id+' (réglage de '+lesP+' non programmé)');
          else infos.push('étape précédente non programmée ('+lesP+', porteur du réglage)');
        }
      } else {
        var inconnu=bdtG.some(function(o){ return ccReglage(o)==null; }), best=null;
        bdtG.forEach(function(m){ var d=ccDebutBdt(m); if(!d) return; var g=ccGrille(d.date,d.heure); if(g==null) return; if(!best||g<best.g||(g===best.g&&ccTxt(m.id)<best.id)) best={d:d,g:g,id:ccTxt(m.id)}; });
        if(best) pousser(ccAjouter(best.d.date,best.d.heure,0),'reglage',best.id,'après le début de '+best.id+(inconnu?' (réglage non renseigné, compté 0)':' (sans réglage)'));
        else infos.push('étape précédente non programmée ('+ccTrierTextes(nonSoldes.map(function(o){ return ccTxt(o.id); })).join(', ')+')');
      }
    }
  }
  var rc=ccReglage(cible);
  if(!bdsCible&&!((rc==null?0:rc)>0)){
    var sc=ccNb(cible.seq);
    var freres=ops.filter(function(o){ var r=ccReglage(o); return o!==cible&&!ccAnnulee(o)&&!ccEstBds(o)&&o.seq!=null&&ccNb(o.seq)===sc&&(r==null?0:r)>0; }).sort(ccParId);
    freres.forEach(function(f){ if(ccSoldee(f)) return; var R=ccReglage(f), d=ccDebutBdt(f); if(!d){ infos.push('réglage de '+ccTxt(f.id)+' non programmé (même étape)'); return; } pousser(ccAjouter(d.date,d.heure,R),'reglage',ccTxt(f.id),'après le réglage de '+ccTxt(f.id)+' ('+ccFmtNb(R)+' h, même étape)'); });
  }
  if(!cands.length){
    if(infos.length) return {date:null,heure:null,regle:'inconnu',depuis:null,raison:infos.join(' · ')};
    return aucune(libres.length?libres[0]:(G.length?'étape précédente soldée':'tête de gamme'));
  }
  var b0=cands[0];
  cands.forEach(function(x){ if(x.g>b0.g||(x.g===b0.g&&x.depuis<b0.depuis)) b0=x; });
  var pos=bdsCible?{date:b0.date,heure:b0.heure}:ccVersDebut({date:b0.date,heure:b0.heure});
  return {date:pos.date,heure:pos.heure,regle:b0.regle,depuis:b0.depuis,raison:b0.raison+(infos.length?' · '+infos.join(' · '):'')};
}
function ccMessageCalage(h,apt){ return 'Calé à '+ccFmtH(h)+' (chemin critique) : '+apt.raison; }
function ccControle(cible,opsDuLot){
  var apt=ccAuPlusTot(cible,opsDuLot);
  var libre={etat:'libre',au_plus_tot:apt,cale_a:null,message:null};
  if(apt.regle==='aucune'||apt.regle==='inconnu'||apt.date==null||apt.heure==null) return libre;
  var jA=ccJour(apt.date);
  if(ccEstBds(cible)){
    var db=ccDebutBds(cible);
    if(db==null) return libre;
    if(ccJour(db)<jA) return {etat:'refus',au_plus_tot:apt,cale_a:null,message:ccTxt(cible.id)+' : dispo au plus tôt le '+ccJJMM(apt.date)+' ('+apt.raison+'). Planifiez-le ce jour-là ou après.'};
    return libre;
  }
  var j=ccJour(cible.date_prevue);
  if(j==null||j>jA) return libre;
  if(j<jA) return {etat:'refus',au_plus_tot:apt,cale_a:null,message:'Au plus tôt le '+ccJJMM(apt.date)+' à '+ccFmtH(apt.heure)+' ('+apt.raison+') : posez '+ccTxt(cible.id)+' ce jour-là ou après.'};
  var h=ccNum(cible.debut);
  if(h!=null&&ccGrille(cible.date_prevue,h)>=ccGrille(apt.date,apt.heure)-CC_EPS) return libre;
  var cale=Math.ceil(ccArr6(apt.heure*100))/100;
  return {etat:'cale',au_plus_tot:apt,cale_a:cale,message:ccMessageCalage(cale,apt)};
}
function ccViolations(bdtRows,bdsRows){
  var parLot=Object.create(null), out={};
  function ranger(op){ var k=ccCleLot(op); if(!k) return; (parLot[k]=parLot[k]||[]).push(op); }
  (bdtRows||[]).forEach(function(b){ if(b) ranger(b); });
  (bdsRows||[]).forEach(function(s){ if(s) ranger(s); });
  (bdtRows||[]).forEach(function(b){
    if(!b||ccAnnulee(b)) return;
    var k=ccCleLot(b); if(!k) return;
    var s=ccTxt(b.statut).toLowerCase();
    if(ccSoldee(b)||s==='recu'||s==='reçu') return;
    var d=ccDebutBdt(b); if(!d) return;
    var apt=ccAuPlusTot(b,parLot[k]||[]);
    if(apt.regle==='aucune'||apt.regle==='inconnu'||apt.date==null||apt.heure==null) return;
    if(ccGrille(d.date,d.heure)<ccGrille(apt.date,apt.heure)-CC_EPS) out[ccTxt(b.id)]=ccTxt(b.id)+' posé le '+ccJJMM(d.date)+' à '+ccFmtH(d.heure)+' : au plus tôt le '+ccJJMM(apt.date)+' à '+ccFmtH(apt.heure)+' ('+apt.raison+')';
  });
  (bdsRows||[]).forEach(function(x){
    if(!x||ccAnnulee(x)) return;
    var k=ccCleLot(x); if(!k) return;
    var st=ccTxt(x.statut).toLowerCase();
    if(ccTxt(x.date_retour_effective)||['envoye','envoyé','recu','reçu','solde','soldé'].indexOf(st)>=0) return;
    var d=ccDebutBds(x); if(d==null) return;
    var apt=ccAuPlusTot(x,parLot[k]||[]);
    if(apt.regle==='aucune'||apt.regle==='inconnu'||apt.date==null) return;
    if(ccJour(d)<ccJour(apt.date)) out[ccTxt(x.id)]=ccTxt(x.id)+' planifié le '+ccJJMM(d)+' : dispo au plus tôt le '+ccJJMM(apt.date)+' ('+apt.raison+')';
  });
  return out;
}
// Adaptateur : carte BDT du planning (projection bdtsForGantt) → ligne au format des colonnes brutes du moteur.
function ccRowBdt(b){ return {id:b.id,seq:b.seq,statut:b.statut,lot_id:b.cleLot,lot_ref:null,date_prevue:b.datePrevue,debut:(b.sansHeure?null:b.debut),duree:b.duree,temps_alloue:b.tempsAlloue,temps_reglage:b.reglage,debut_reel:b.debutReel,oas_avant:!!b.oasAvant,process_id:(b.process==='pending'?null:b.process),operateur_id:(b.op||null)}; }
function ccOpsDuLot(k){ var out=[]; if(!k) return out; BDTS.forEach(function(b){ if(b.cleLot===k) out.push(ccRowBdt(b)); }); if(typeof BST_DATA!=='undefined'&&BST_DATA) BST_DATA.forEach(function(s){ if(ccCleLot(s)===k) out.push(s); }); return out; }
function ccViolationsPage(){ return ccViolations(BDTS.map(ccRowBdt),(typeof BST_DATA!=='undefined'&&BST_DATA)?BST_DATA:[]); }
// ==CC-MOTEUR-FIN==
// ── Chemin critique et temps (lot C) : AFFICHAGE — goulotte, barres, info-bulle, glisser-déposer, carte « Enchaînements à revoir » ──
var CC_VIOL={};   // { id : message } — opérations posées avant leur au plus tôt, recalculées à chaque rendu
function ccMajViolations(){ try{ CC_VIOL=ccViolationsPage(); }catch(e){ CC_VIOL={}; } return CC_VIOL; }
function ccEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(ch){ return ch==='&'?'&amp;':ch==='<'?'&lt;':ch==='>'?'&gt;':'&quot;'; }); }
// Au plus tôt d un BDT du planning : ne dépend ni de son jour ni de son heure, seulement du reste du lot.
function ccAptBdt(b){ return ccAuPlusTot(ccRowBdt(b),ccOpsDuLot(b.cleLot)); }
// Durée D = réglage R (fixe, une seule fois) + réalisation V. R null = réglage non renseigné.
function ccTemps(b){ var D=Number(b&&b.duree); if(!isFinite(D)||D<0) D=0; var R=(b==null||b.reglage==null||b.reglage==='')?null:Number(b.reglage); if(R!=null&&!isFinite(R)) R=null; return {D:D,R:R,V:(R==null?null:Math.max(0,Math.round((D-R)*100)/100))}; }
function ccMiniBarre(b){
  var t=ccTemps(b), pct=(t.R!=null&&t.D>0)?Math.min(100,Math.round(t.R/t.D*1000)/10):0;
  var barre='<div style="display:flex;height:6px;width:100%;max-width:190px;border-radius:3px;overflow:hidden;background:#e2e8f0;margin-top:4px;'+(t.R==null?'outline:1px dashed #cbd5e1;outline-offset:-1px;':'')+'">'
    +(pct>0?'<div title="Réglage (fixe, une seule fois)" style="width:'+pct+'%;background:repeating-linear-gradient(135deg,#7c3aed 0,#7c3aed 2px,#c4b5fd 2px,#c4b5fd 4px);border-right:1.5px solid #4c1d95;"></div>':'')
    +'<div title="Réalisation" style="flex:1;background:'+(t.R==null?'#cbd5e1':'#0ea5e9')+';"></div></div>';
  var lib=(t.R==null)?'<span style="color:#b45309;">réglage non renseigné</span>':('Réglage '+ccFmtNb(t.R)+' h · Réalisation '+ccFmtNb(t.V)+' h');
  return barre+'<div style="font-size:.6rem;color:#64748b;margin-top:2px;">'+lib+'</div>';
}
function ccPastilleMorceau(b){ if(!(b&&b.nbMorceaux>=2)) return ''; return '<span title="Morceau '+b.posMorceau+' sur '+b.nbMorceaux+' de la découpe de '+ccEsc(b.racine)+'" style="background:#ede9fe;color:#6d28d9;font-weight:800;border-radius:999px;padding:1px 7px;"><i class="fas fa-scissors" style="margin-right:3px;"></i>M'+b.rangMorceau+' · '+b.posMorceau+'/'+b.nbMorceaux+'</span>'; }
function ccAuPlusTotCarte(b){
  var apt=ccAptBdt(b);
  if(apt.regle==='aucune') return '';
  if(apt.regle==='inconnu') return '<div title="'+ccEsc(apt.raison)+'" style="font-size:.6rem;color:#94a3b8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;"><i class="fas fa-route" style="margin-right:3px;"></i>au plus tôt : '+ccEsc(apt.raison)+'</div>';
  return '<div title="'+ccEsc(apt.raison)+'" style="font-size:.6rem;color:#0f766e;font-weight:700;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px;"><i class="fas fa-route" style="margin-right:3px;"></i>au plus tôt : '+ccJJMM(apt.date)+' '+ccFmtH(apt.heure)+' · '+ccEsc(apt.raison)+'</div>';
}
function ccCellulesTemps(b){ var t=ccTemps(b); return '<div><span style="color:#94a3b8;">Réglage : </span>'+(t.R==null?'<span style="color:#b45309;">non renseigné</span>':'<strong>'+ccFmtNb(t.R)+' h</strong> <span style="color:#94a3b8;font-size:.7rem;">(fixe, une seule fois)</span>')+'</div><div><span style="color:#94a3b8;">Réalisation : </span>'+(t.R==null?'—':'<strong>'+ccFmtNb(t.V)+' h</strong>')+'</div>'; }
// Carte « Enchaînements à revoir » (même rendu que le serveur, recalculé après chaque pose).
function ccRenderCarte(){
  var v=ccMajViolations(), ids=Object.keys(v);
  var carte=document.getElementById('ccCarte'), liste=document.getElementById('ccCarteListe'), n=document.getElementById('ccCarteN');
  if(!carte||!liste) return;
  carte.style.display=ids.length?'':'none'; if(n) n.textContent=String(ids.length);
  liste.innerHTML=ids.map(function(id){
    var b=BDTS.find(function(x){ return String(x.id)===String(id); });
    var s=b?null:((typeof BST_DATA!=='undefined'&&BST_DATA)?BST_DATA.find(function(x){ return String(x.id)===String(id); }):null);
    var lot=b?(b.cleLot||''):ccCleLot(s);
    return '<div class="cc-viol-ligne" data-id="'+ccEsc(id)+'" onclick="ccVoir(this.getAttribute(\\'data-id\\'))" title="Voir sur le planning" style="display:flex;align-items:baseline;gap:8px;padding:6px 8px;border-bottom:1px solid #fee2e2;cursor:pointer;font-size:.74rem;"><i class="fas '+(b?'fa-screwdriver-wrench':'fa-industry')+'" style="color:#dc2626;font-size:.66rem;"></i><span style="color:#475569;">'+ccEsc(v[id])+'</span>'+(lot?'<span style="margin-left:auto;font-size:.62rem;color:#0d9488;font-family:monospace;white-space:nowrap;">'+ccEsc(lot)+'</span>':'')+'</div>';
  }).join('');
}
function ccVoir(id){
  var b=BDTS.find(function(x){ return String(x.id)===String(id); });
  if(b){
    if(typeof showProdTab==='function') showProdTab('gantt-bdt');
    if(b.datePrevue&&b.datePrevue!==currentDate){ currentDate=b.datePrevue; var pd=document.getElementById('planDate'); if(pd) pd.value=currentDate; }
    focusLot=b.id; updateFocusBanner(); buildAll();
    return;
  }
  var s=(typeof BST_DATA!=='undefined'&&BST_DATA)?BST_DATA.find(function(x){ return String(x.id)===String(id); }):null;
  if(!s) return;
  if(typeof showProdTab==='function') showProdTab('gantt-bst');
  var d=s.date_debut||s.date_envoi; if(d){ bstStartDate=String(d).slice(0,10); var inp=document.getElementById('bstStartDate'); if(inp) inp.value=bstStartDate; }
  focusLotBst=s.id; updateBstFocusBanner(); bstBuildAll();
}
// Glisser-déposer : zone hachurée rouge avant l au plus tôt du jour affiché (calculé une fois par BDT et par jour).
var _ccDrag=null;
function ccAptDrag(){
  if(!dragId) return null;
  if(_ccDrag&&_ccDrag.id===dragId&&_ccDrag.date===currentDate) return _ccDrag.apt;
  var b=BDTS.find(function(z){ return z.id===dragId; }); if(!b) return null;
  _ccDrag={id:dragId,date:currentDate,apt:ccAptBdt(b)};
  return _ccDrag.apt;
}
function ccCacherZone(){ var z=document.getElementById('dropZoneCC'); if(z) z.style.display='none'; var l=document.getElementById('dropZoneCCLbl'); if(l) l.style.display='none'; }
function ccMontrerZone(lane){
  var apt=ccAptDrag();
  var jA=(apt&&apt.date)?ccJour(apt.date):null, jC=ccJour(currentDate);
  if(!apt||apt.regle==='aucune'||apt.regle==='inconnu'||jA==null||jC==null||jA<jC){ ccCacherZone(); return; }
  var hFin=(jA>jC)?DAY_END:Math.min(DAY_END,apt.heure);
  if(hFin<=DAY_START){ ccCacherZone(); return; }
  var rect=lane.getBoundingClientRect();
  var z=document.getElementById('dropZoneCC');
  if(!z){ z=document.createElement('div'); z.id='dropZoneCC'; z.style.cssText='position:fixed;z-index:58;pointer-events:none;background:repeating-linear-gradient(45deg,rgba(220,38,38,.22) 0,rgba(220,38,38,.22) 6px,rgba(220,38,38,.07) 6px,rgba(220,38,38,.07) 12px);border-right:2px solid #dc2626;'; document.body.appendChild(z); }
  z.style.left=rect.left+'px'; z.style.top=rect.top+'px'; z.style.height=rect.height+'px'; z.style.width=((hFin-DAY_START)*PX_H)+'px'; z.style.display='block';
  var l=document.getElementById('dropZoneCCLbl');
  if(!l){ l=document.createElement('div'); l.id='dropZoneCCLbl'; l.style.cssText='position:fixed;z-index:61;pointer-events:none;background:#dc2626;color:white;font-size:.6rem;font-weight:700;padding:1px 6px;border-radius:4px;white-space:nowrap;max-width:460px;overflow:hidden;text-overflow:ellipsis;'; document.body.appendChild(l); }
  l.textContent='au plus tôt '+(jA>jC?('le '+ccJJMM(apt.date)+' à '):'')+ccFmtH(apt.heure)+' · '+apt.raison;
  l.style.left=(rect.left+4)+'px'; l.style.top=(rect.top+rect.height-16)+'px'; l.style.display='block';
}
// Annuler une découpe (C6) : recolle la famille via POST /api/production/bdt/:id/recoller, après confirmation.
var CC_RECOLLAGE={};   // racine -> true pendant l appel : un double clic, ou les cartes M1 et M2 d une même famille, n envoient qu une annulation
function recollerBdt(id){
  var b=BDTS.find(function(x){ return String(x.id)===String(id); }); if(!b) return;
  if(CC_RECOLLAGE[b.racine]){ pushNotif('info','fa-hourglass-half',ccEsc('Annulation de la découpe de '+b.racine+' déjà en cours…'),3000); return; }
  var fam=BDTS.filter(function(x){ return x.racine===b.racine; }).sort(function(x,y){ return (Number(x.rangMorceau)||1)-(Number(y.rangMorceau)||1); });
  var lignes=fam.map(function(m){ var t=ccTemps(m); return '· M'+m.rangMorceau+' — '+m.id+' : '+ccFmtNb(t.D)+' h'+(t.R!=null&&t.R>0?' (dont réglage '+ccFmtNb(t.R)+' h)':'')+' · '+bdtStatutLabel(m); }).join('\\n');
  var msg='Annuler la découpe de '+b.racine+' ?\\n\\n'+lignes+'\\n\\nLes '+fam.length+' morceaux seront recollés en un seul BDT (la durée d’origine est reprise si elle est connue). Refusé si un morceau est posé, reçu ou déjà utilisé.';
  appConfirm(msg,{title:'Annuler la découpe',okLabel:'Recoller les morceaux',icon:'fa-rotate-left'}).then(function(oui){
    if(!oui||CC_RECOLLAGE[b.racine]) return;
    CC_RECOLLAGE[b.racine]=true; buildPending();
    var fini=function(){ delete CC_RECOLLAGE[b.racine]; buildPending(); };
    fetch('/api/production/bdt/'+encodeURIComponent(b.racine)+'/recoller',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})
      .then(function(r){ return r.json().catch(function(){ return {ok:false,error:'Réponse inattendue du serveur (HTTP '+r.status+').'}; }); })
      .then(function(j){
        if(!j||!j.ok){ fini(); pushNotif('err','fa-ban',ccEsc((j&&j.error)||'Annulation de la découpe refusée.'),9000); return; }
        pushNotif('ok','fa-rotate-left',ccEsc('Découpe annulée : '+j.racine+' recollé ('+ccFmtNb(Number(j.duree)||0)+' h'+(j.temps_reglage!=null?', dont réglage '+ccFmtNb(Number(j.temps_reglage))+' h':'')+').'),6000);
        if(j.avertissement) pushNotif('warn','fa-exclamation-triangle',ccEsc(j.avertissement),9000);
        setTimeout(function(){ softReload(); },700);
      }).catch(function(){ fini(); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  });
}
// Plage horaire (colonne) d'un opérateur selon sa présence du jour : matin / journee / apmidi / soir / absent.
// (Avant le 14/09/2026 la journée était rangée dans « Après-midi ».) Créneau inconnu ou vide = colonne Absent.
function opShiftCol(opId){ var g=presGet(opId,currentDate); return (g.shift && PLAN_CRENEAUX.indexOf(g.shift)>=0) ? g.shift : 'absent'; }
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
  if(selOpId){ var o=OPS_PRESENCE.find(function(x){return String(x.id)===String(opId);}); pushNotif('info','fa-mouse-pointer','<strong>'+(o?o.nom:opId)+'</strong> sélectionné — cliquez une sous-case (Matin / Journée / Après-midi / Soirée) d\\'un process dans le planning.'); }
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
// Les 4 créneaux du planning, dans l'ordre Matin · Journée · Après-midi · Soirée.
// Libellés, horaires et couleurs : SHIFTS (src/shared.ts), injecté dans SHIFTS_MAP — seule source.
var PLAN_CRENEAUX=['matin','journee','apmidi','soir'];
// [id, libellé, couleur (bordure, fond), horaires, couleur de TEXTE foncée et lisible (PRES_SHIFTS, presences.ts couleurTexteCreneau)]
function planCreneaux(){ return PLAN_CRENEAUX.map(function(k){ var s=SHIFTS_MAP[k]||{label:k,color:'#64748b',start:0,end:0}; var p=(typeof PRES_SHIFTS!=='undefined'&&PRES_SHIFTS&&PRES_SHIFTS[k])?PRES_SHIFTS[k]:null; return [k, s.label, s.color, (s.start%24)+'h-'+(s.end%24)+'h', p?p[1]:'#334155']; }); }
// 4 sous-cases (Matin / Journée / Après-midi / Soirée) à insérer DANS la case process du Gantt
function procSlotsMiniHTML(proc){
  var SLOTS=planCreneaux();
  return '<div style="display:flex;gap:3px;margin-top:5px;">'+SLOTS.map(function(sl){
    var chips=affOpsForSlot(proc.id,sl[0]).map(function(opId){ var o=OPS_PRESENCE.find(function(x){return String(x.id)===String(opId);})||OPERATEURS.find(function(x){return String(x.id)===String(opId);}); var nm=o?o.nom:opId;
      return '<span style="display:inline-flex;align-items:center;gap:2px;background:'+sl[2]+'1a;color:'+sl[4]+';border-radius:999px;padding:0 4px;font-size:.54rem;font-weight:700;margin:1px;line-height:1.5;">'+nm+' <i class="fas fa-times" style="cursor:pointer;opacity:.7;" onclick="event.stopPropagation();retirerAffectation(\\''+opId+'\\',\\''+proc.id+'\\',\\''+sl[0]+'\\')"></i></span>'; }).join('');
    return '<div class="proc-slot" ondragover="event.preventDefault();this.classList.add(\\'drag-over\\')" ondragleave="this.classList.remove(\\'drag-over\\')" ondrop="procDrop(event,\\''+proc.id+'\\',\\''+sl[0]+'\\')" onclick="slotClick(event,\\''+proc.id+'\\',\\''+sl[0]+'\\')" title="'+sl[1]+' '+sl[3]+'" style="flex:1;min-width:0;border:1px dashed #e2e8f0;border-top:2px solid '+sl[2]+';border-radius:5px;padding:2px 3px;min-height:30px;background:#fafafa;cursor:pointer;">'
      +'<div style="font-size:.5rem;font-weight:800;color:'+sl[4]+';text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+sl[1]+'</div>'
      +'<div style="line-height:1.3;">'+(chips||'<span style="font-size:.5rem;color:#d1d5db;">—</span>')+'</div></div>';
  }).join('')+'</div>';
}
// Tableau des opérateurs classés par plage horaire (colonnes Matin / Journée / Après-midi / Soirée / Absent), cartes draggables
function buildOperatorsByShift(){
  var box=document.getElementById('opsByShift'); if(!box) return;
  var lbl=document.getElementById('rhPosteJour'); if(lbl){ try{ lbl.textContent=new Date(currentDate).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}); }catch(e){ lbl.textContent=currentDate; } }
  // Présences du jour pas encore chargées (jour hors de la fenêtre initiale) : on les lit au lieu de ranger
  // tout le monde dans « Absent » à tort.
  if(!presJourCharge(currentDate)){
    var luP=presLundi(currentDate);
    if(PRES_CHARGEMENT[luP]!=='encours' && PRES_CHARGEMENT[luP]!=='echec') presChargerSemaine(luP);
    box.innerHTML='<div style="padding:12px;text-align:center;font-size:.74rem;color:#94a3b8;">'+(PRES_CHARGEMENT[luP]==='echec'
      ? '<i class="fas fa-exclamation-triangle" style="color:#f59e0b;margin-right:5px;"></i>Présences du jour non chargées. <button type="button" onclick="presChargerSemaine(\\''+luP+'\\')" style="border:none;background:none;color:#4f46e5;font-weight:700;cursor:pointer;text-decoration:underline;">Réessayer</button>'
      : '<i class="fas fa-spinner fa-spin" style="margin-right:5px;"></i>Chargement des présences du jour…')+'</div>';
    return;
  }
  var COLS=planCreneaux().concat([['absent','Absent','#ef4444','','#b91c1c']]);
  var aff=AFFECTATIONS[currentDate]||{};
  var byCol={matin:[],journee:[],apmidi:[],soir:[],absent:[]};
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
  box.innerHTML='<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;">'+COLS.map(function(c){
    var list=(byCol[c[0]]||[]).slice().sort(function(a,b){return String(a.nom).localeCompare(String(b.nom));});
    return '<div style="background:#f8fafc;border-radius:9px;padding:7px;border-top:3px solid '+c[2]+';min-height:60px;">'
      +'<div style="font-size:.66rem;font-weight:800;text-transform:uppercase;color:'+c[4]+';margin-bottom:6px;text-align:center;">'+c[1]+' <span style="color:#cbd5e1;">'+list.length+'</span></div>'
      +(list.map(function(o){return cardOf(o,c[0]);}).join('')||'<div style="font-size:.6rem;color:#d1d5db;text-align:center;padding:6px;">—</div>')+'</div>';
  }).join('')+'</div>';
}
// (buildProcessBoard supprimé le 14/09/2026 : il remplissait #processBoard, qui n'existe plus dans aucune page —
//  les sous-cases de créneau sont dans la case poste du Gantt, cf. procSlotsMiniHTML.)
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
// Ordre file d'attente : échéance client au plus tôt, puis lot, puis ordre de gamme (seq). C'est un TRI d'affichage,
// pas le chemin critique : celui-ci (réglage de l'étape précédente) est calculé par le moteur cc… plus bas.
function pendSort(a,b){ var da=a.dateEcheance||'9999-12-31', db=b.dateEcheance||'9999-12-31'; if(da!==db) return da<db?-1:1; var ka=lotKey(a), kb=lotKey(b); if(ka!==kb) return ka<kb?-1:1; var sa=(a.seq==null?9999:a.seq), sb=(b.seq==null?9999:b.seq); if(sa!==sb) return sa-sb; return String(a.id).localeCompare(String(b.id),undefined,{numeric:true}); }
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
// Les MORCEAUX « -Mk » d un BDT découpé partagent le même seq : ils forment UNE étape (comme gamme.ts
// groupeEtapePrecedente). Sans ce regroupement, l « étape d avant » d un M2 était son frère M1.
function grouperEtapesParSeq(items){
  var l=[];
  items.forEach(function(x){
    var der=l.length?l[l.length-1]:null;
    if(der&&x.seq!=null&&der.seq!=null&&Number(der.seq)===Number(x.seq)){ der.membres.push(x); der.ids.push(x.id); if(!x.st) der.st=false; return; }
    l.push({ id:x.id, ids:[x.id], seq:x.seq, st:x.st, ref:x.ref, sous_traitant_id:x.sous_traitant_id, membres:[x] });
  });
  return l;
}
function etapeIndexDe(l,id){ for(var k=0;k<l.length;k++){ if(l[k].ids.indexOf(id)>=0) return k; } return -1; }
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
  return grouperEtapesParSeq(l);
}
// Postes a afficher pour le BDT focalise : etape-1, etape, etape+1 (postes connus seulement, tous morceaux compris).
function etapePostesSet(bdtId){
  var b=BDTS.find(function(x){return x.id===bdtId;}); if(!b) return null;
  var l=etapesDuLot(lotKey(b));
  var i=etapeIndexDe(l,b.id);
  if(i<0) return null;
  var s={};
  // Seules les etapes INTERNES ont un poste : une etape sous-traitee (x.st) n ajoute
  // aucune ligne au Gantt (elle est signalee dans le bandeau).
  [l[i-1], l[i], l[i+1]].forEach(function(x){ if(!x) return; x.membres.forEach(function(m){ if(m.st) return; var pid=posteOfBdt(m.ref); if(pid) s[String(pid)]=true; }); });
  return s;
}
// Nom lisible d un membre d etape : poste (interne) ou « ST <nom> » (sous-traitance).
function etapeNomMembre(x){
  if(!x) return null;
  if(x.st){
    var f=(typeof BST_FOURN!=='undefined'?BST_FOURN:[]).find(function(z){ return String(z.id)===String(x.ref.sous_traitant_id); });
    return 'ST ' + (f? f.nom : (x.ref.operation||'sous-traitance'));
  }
  var pid=posteOfBdt(x.ref);
  var po=(typeof POSTES_JS!=='undefined'?POSTES_JS:[]).find(function(p){ return String(p.id)===String(pid); });
  return po ? po.nom : (x.ref.operation||null);
}
// Nom d une etape (morceaux posés sur plusieurs postes : noms distincts réunis).
function etapeNom(x){
  if(!x) return null;
  var noms=[]; (x.membres||[x]).forEach(function(m){ var n=etapeNomMembre(m); if(n&&noms.indexOf(n)<0) noms.push(n); });
  return noms.length?noms.join(' + '):null;
}
// Libelle du bandeau : « LOT · etape 3/6 — Fraisage (avant : Tronconnage · apres : ST Zingage) · au plus tôt … »
function etapeFocusLabel(bdtId){
  var b=BDTS.find(function(x){return x.id===bdtId;}); if(!b) return '';
  var l=etapesDuLot(lotKey(b));
  var i=etapeIndexDe(l,b.id);
  var av=etapeNom(l[i-1]), ap=etapeNom(l[i+1]), moi=etapeNom(l[i])||b.operation||'';
  var ctx=[]; if(av) ctx.push('avant : '+av); if(ap) ctx.push('apres : '+ap);
  var apt=ccAptBdt(b), apl='';
  if(apt.regle!=='aucune') apl=' \\u00b7 au plus tôt : '+(apt.date?ccJJMM(apt.date)+' '+ccFmtH(apt.heure)+' ('+apt.raison+')':apt.raison);
  return lotKey(b)+' \\u00b7 etape '+(i+1)+'/'+l.length+' \\u2014 '+moi+(ctx.length?' ('+ctx.join(' \\u00b7 ')+')':' (seule etape)')+apl+(CC_VIOL[b.id]?' \\u00b7 \\u26a0 enchaînement à revoir':'');
}
function updateFocusBanner(){
  var el=document.getElementById('lotFocusBanner'); if(!el) return;
  if(focusLot){ el.style.display='flex'; var lbl=document.getElementById('lotFocusLabel'); if(lbl) lbl.textContent=etapeFocusLabel(focusLot); }
  else { el.style.display='none'; }
}
// focusLot contient desormais l ID DU BDT focalise (et non la cle du lot).
function focusBdtLot(bdtId){ var b=BDTS.find(function(x){return x.id===bdtId;}); if(!b) return; focusLot=(focusLot===bdtId)?null:bdtId; updateFocusBanner(); buildGantt(); }
// Arrivee depuis un lien « Voir au planning » (?focusBdt=...) : on se place sur le jour du BDT,
// ou on le selectionne dans la goulotte s'il n'est pas encore programme.
window.addEventListener('load',function(){ try{ var fb=new URLSearchParams(location.search).get('focusBdt'); if(!fb) return; var b=BDTS.find(function(x){return String(x.id)===String(fb);}); if(!b) return; if(enGoulotte(b)){ selectPendBdt(b.id); return; } if(b.datePrevue&&b.datePrevue!==currentDate){ currentDate=b.datePrevue; var pd=document.getElementById('planDate'); if(pd) pd.value=currentDate; buildAll(); } focusBdtLot(b.id); }catch(e){} });
function clearFocusLot(){ focusLot=null; updateFocusBanner(); buildGantt(); }
// Guide visuel de dépôt (ligne + heure cible) pendant le glisser
function showDropGuide(lane,e){ var rect=lane.getBoundingClientRect(); var t=snapTime(lane,e); var g=document.getElementById('dropGuide'); if(!g){ g=document.createElement('div'); g.id='dropGuide'; g.style.cssText='position:fixed;width:2px;background:#f59e0b;z-index:60;pointer-events:none;box-shadow:0 0 8px #f59e0b;'; document.body.appendChild(g); } var px=rect.left+(t-DAY_START)*PX_H; g.style.left=px+'px'; g.style.top=rect.top+'px'; g.style.height=rect.height+'px'; g.style.display='block'; var lbl=document.getElementById('dropGuideLbl'); if(!lbl){ lbl=document.createElement('div'); lbl.id='dropGuideLbl'; lbl.style.cssText='position:fixed;background:#f59e0b;color:white;font-size:.62rem;font-weight:800;padding:1px 6px;border-radius:4px;z-index:61;pointer-events:none;white-space:nowrap;'; document.body.appendChild(lbl); } lbl.textContent=fmtHour(t); lbl.style.left=(px+4)+'px'; lbl.style.top=(rect.top-16)+'px'; lbl.style.display='block'; if(dragId) ccMontrerZone(lane); }
function hideDropGuide(){ var g=document.getElementById('dropGuide'); if(g) g.style.display='none'; var l=document.getElementById('dropGuideLbl'); if(l) l.style.display='none'; ccCacherZone(); _ccDrag=null; }
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

function buildAll(){ computeLotColors(); buildHoursHdr(); buildStats(); ccRenderCarte(); buildGantt(); buildPending(); buildOperatorsByShift(); }
// (buildDayPresence supprimé le 14/09/2026 : code mort — #dayPresenceList n'existe plus, et ses horaires « 08h-17h »
//  / « 14h-22h » contredisaient SHIFTS. La présence du jour se lit dans « Affectation des ressources aux postes ».)
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
    var bdtsP=BDTS.filter(function(b){ return !enGoulotte(b) && String(posteOfBdt(b))===String(poste.id) && bdtOnDay(b); });
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
  // Réglage (lot C) : segment HACHURÉ en tête de barre, largeur proportionnelle, fin marquée d un trait — c est le repère
  // du chemin critique (l étape suivante ne démarre pas avant). Badge rouge : barre posée avant son au plus tôt.
  // Le segment est dessiné dans le REPÈRE DU TEMPS : un enfant positionné part du bord intérieur de la barre, elle-même
  // décalée de 2 px (l) et bordée du liseré de lot (5 px). Sa fin, trait compris, tombe donc pile sur début + réglage
  // (avant : 5 à 7 px trop à droite). Bordé à l intérieur de la barre, il laisse toujours 3 px de réalisation visibles.
  var tps=ccTemps(bdt), viol=CC_VIOL[bdt.id], BORD_G=5, BORD_D=(bdt.statut==='programme'||bdt.statut==='affecte')?2:0;
  var interieur=Math.max(0,w-BORD_G-BORD_D), rglW=0;
  if(tps.R!=null&&tps.R>0&&interieur>0){ rglW=Math.round(tps.R*PX_H)-(2+BORD_G); rglW=Math.max(2,Math.min(rglW,interieur-((tps.V!=null&&tps.V>0)?3:0))); rglW=Math.min(rglW,interieur); }
  var OMBRE='text-shadow:0 0 2px rgba(0,0,0,.6);';   // lisible aussi sur la partie hachurée
  el.innerHTML=(rglW?'<div class="bdt-rgl" title="Réglage '+ccFmtNb(tps.R)+' h (fixe, une seule fois)" style="position:absolute;left:0;top:0;bottom:0;width:'+rglW+'px;background:repeating-linear-gradient(135deg,rgba(15,23,42,.3) 0,rgba(15,23,42,.3) 3px,transparent 3px,transparent 6px);border-right:2px solid rgba(15,23,42,.85);pointer-events:none;"></div>':'')
    +(viol?'<span class="bdt-viol" title="'+ccEsc(viol)+'" style="position:absolute;top:2px;right:3px;z-index:3;background:#dc2626;color:white;border-radius:999px;font-size:.52rem;line-height:1;padding:2px 4px;box-shadow:0 0 0 1.5px white;"><i class="fas fa-link-slash"></i></span>':'')
    +'<div style="position:relative;font-size:.58rem;font-weight:800;opacity:.9;'+OMBRE+'">'+oxyBox(bdt.oxydation)+bdt.id+'</div><div style="position:relative;font-size:.62rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'+OMBRE+'">'+bdt.operation+'</div><div style="position:relative;font-size:.58rem;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'+OMBRE+'">'+fmtHour(bdt.debut)+' · '+(tps.R!=null?ccFmtNb(tps.R)+' + '+ccFmtNb(tps.V)+' h':bdt.duree+'h')+' · '+bdt.client+'</div>';
  if(viol) el.style.boxShadow='0 0 0 2px #dc2626';
  if(canDrag){
    el.addEventListener('dragstart',function(e){ dragId=bdt.id; _grabDX=e.clientX-el.getBoundingClientRect().left; if(e.dataTransfer){ e.dataTransfer.setData('text/plain',bdt.id); e.dataTransfer.effectAllowed='move'; } highlightLot(lotKey(bdt)); });
    el.addEventListener('dragend',function(){ clearHighlight(); hideDropGuide(); dragId=null; _grabDX=0; });
  }
  el.addEventListener('mouseenter',function(e){ showTT(e,bdt); }); el.addEventListener('mousemove',moveTT); el.addEventListener('mouseleave',hideTT);
  // 1er double-clic = RECEVOIR le BDT (matricule + PIN, il passe « reçu ») ; ensuite le
  // double-clic ouvre la déclaration de sortie matière. Clic droit = menu.
  el.addEventListener('click',function(e){ e.stopPropagation(); if(el._clkT) return; el._clkT=setTimeout(function(){ el._clkT=null; focusBdtLot(bdt.id); },230); });
  el.addEventListener('dblclick',function(){ if(el._clkT){ clearTimeout(el._clkT); el._clkT=null; } if(bdt.statut==='programme'||bdt.statut==='affecte') openRecuModal(bdt.id); else openSortieMatiere(bdt); });
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
  // Pas de découpe depuis le planning : un BDT se découpe UNIQUEMENT dans la goulotte (ciseaux
  // de sa carte). Pour découper un BDT posé, le déprogrammer d abord.
  setTimeout(function(){ document.addEventListener('click',function h(){ menu.remove(); document.removeEventListener('click',h); },{once:true}); },50);
  document.body.appendChild(menu);
}
function openRecuModal(bdtId){
  recuBdtId=bdtId; var bdt=BDTS.find(function(b){return b.id===bdtId;}); if(!bdt) return;
  if(bdt.statut==='recu'){ pushNotif('info','fa-info-circle','BDT déjà reçu.'); return; }
  if(bdt.statut==='solde'){ pushNotif('info','fa-info-circle','BDT déjà soldé.'); return; }
  if(enGoulotte(bdt)){ pushNotif('warn','fa-exclamation-triangle','Programmez ce BDT avant de le recevoir : glissez-le de la goulotte sur le planning.'); return; }
  var proc=PROCESS.find(function(p){return p.id===bdt.process;});
  document.getElementById('recuInfo').innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.78rem;"><div><span style="color:#94a3b8;">BDT : </span><strong>'+bdt.id+'</strong></div><div><span style="color:#94a3b8;">Opération : </span>'+bdt.operation+'</div><div><span style="color:#94a3b8;">Process : </span>'+(proc?proc.nom:'—')+'</div><div><span style="color:#94a3b8;">Client : </span>'+bdt.client+'</div>'+ccCellulesTemps(bdt)+'</div>';
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
  document.getElementById('soldageInfo').innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.78rem;"><div><span style="color:#94a3b8;">BDT : </span><strong>'+bdt.id+'</strong></div><div><span style="color:#94a3b8;">Opération : </span>'+bdt.operation+'</div><div><span style="color:#94a3b8;">Process : </span>'+(proc?proc.nom:'—')+'</div><div><span style="color:#94a3b8;">Client : </span>'+bdt.client+'</div><div><span style="color:#94a3b8;">Durée allouée : </span><strong>'+bdt.tempsAlloue+'h</strong></div><div><span style="color:#94a3b8;">Pièce : </span>'+bdt.piece+'</div>'+ccCellulesTemps(bdt)+'</div>';
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
  if(bdt.statut==='solde'||bdt.statut==='recu'){ pushNotif('err','fa-ban','BDT déjà '+(bdt.statut==='solde'?'soldé':'reçu')+' : il ne se replanifie plus.'); return; }
  if(!(proc.activite==='both'||proc.activite===bdt.activite)){ pushNotif('err','fa-ban','Incompatibilité activité : process '+proc.nom+' ('+proc.activite+') ≠ BDT '+bdt.activite); return; }
  var hasD=(debut!=null&&!isNaN(debut)); if(hasD) debut=Math.round(debut*100)/100;
  // CHEMIN CRITIQUE : même contrôle que le serveur (src/gamme.ts controleEnchainement). Jour antérieur à l au plus
  // tôt → refusé sans appel ; même jour trop tôt (ou sans heure) → calé à l au plus tôt, et on le dit.
  // Sans heure (pose au clic) : le BDT garde la sienne, sinon il prend l heure où le planning l affiche — comme le serveur.
  var cib=ccRowBdt(bdt); cib.process_id=procId; cib.statut='programme'; cib.date_prevue=currentDate; if(hasD) cib.debut=debut; else if(cib.debut==null) cib.debut=CC_HEURE_DEFAUT;
  var ctl=ccControle(cib,ccOpsDuLot(bdt.cleLot));
  if(ctl.etat==='refus'){ pushNotif('err','fa-route',ccEsc(ctl.message),9000); return; }
  var noteCale=null;
  if(ctl.etat==='cale'){ debut=ctl.cale_a; hasD=true; noteCale=ctl.message; }
  var body={process_id:procId, date_prevue:currentDate}; if(hasD) body.debut=debut;
  fetch('/api/production/bdt/'+encodeURIComponent(bdtId)+'/affecter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){ return r.json().catch(function(){ return {ok:false,error:'Réponse inattendue du serveur (HTTP '+r.status+').'}; }); }).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',ccEsc((j&&j.error)||'Affectation échouée.'),(j&&j.au_plus_tot)?9000:5000); return; }
      // Le serveur fait foi : l heure RÉELLEMENT écrite (calage, heure par défaut, arrondi d une colonne entière) est celle affichée.
      if(j.cale_a!=null&&isFinite(Number(j.cale_a))){ debut=Number(j.cale_a); hasD=true; noteCale=j.avertissement||noteCale; }
      else if(j.avertissement) noteCale=j.avertissement;
      if(j.data&&j.data.debut!=null&&j.data.debut!==''&&isFinite(Number(j.data.debut))){ debut=Number(j.data.debut); hasD=true; }
      var wasPending=(bdt.process==='pending'); bdt.process=procId; bdt.machineId=proc.machine_id||null; bdt.datePrevue=currentDate; if(hasD){ bdt.debut=debut; bdt.sansHeure=false; } if(bdt.statut==='a_programmer'||bdt.statut==='pending'||!bdt.statut) bdt.statut='programme';
      focusLot=null; updateFocusBanner(); buildAll(); pushNotif('ok','fa-check-circle','BDT <strong>'+bdtId+'</strong> '+(wasPending?'affecté au process':'déplacé sur')+' <strong>'+proc.nom+'</strong>'+(hasD?' à '+fmtHour(debut):'')+'.');
      if(noteCale) pushNotif('warn','fa-route',ccEsc(noteCale),8000);
      var succ=Array.isArray(j.successeurs_en_violation)?j.successeurs_en_violation:[];
      if(succ.length) pushNotif('warn','fa-link-slash',ccEsc(succ.length+' étape'+(succ.length>1?'s':'')+' suivante'+(succ.length>1?'s':'')+' à revoir (rien n’a été décalé) : '+succ.map(function(x){ return x.message; }).join(' · ')),12000);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function deprogramBDT(bdtId){
  var bdt=BDTS.find(function(b){return b.id===bdtId;}); if(!bdt) return;
  if(bdt.statut==='recu'||bdt.statut==='solde'){ pushNotif('warn','fa-exclamation-triangle','BDT déjà '+(bdt.statut==='solde'?'soldé':'reçu')+' — déprogrammation impossible.'); return; }
  if(enGoulotte(bdt)){ return; }
  fetch('/api/production/bdt/'+encodeURIComponent(bdtId)+'/deprogrammer',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Déprogrammation échouée.'); return; }
      bdt.process='pending'; bdt.machineId=null; bdt.statut='a_programmer'; bdt.datePrevue=null; bdt.sansHeure=true;   // le serveur remet debut à vide
      buildAll(); pushNotif('ok','fa-undo','BDT <strong>'+bdtId+'</strong> déprogrammé → retour en file d\\'attente.');
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function onPendingOver(e){ e.preventDefault(); if(e.dataTransfer) e.dataTransfer.dropEffect='move'; var z=document.getElementById('pendingDropZone'); if(z) z.style.outline='2px dashed #f97316'; hideDropGuide(); }
function onPendingLeave(e){ var z=document.getElementById('pendingDropZone'); if(z) z.style.outline=''; }
function onPendingDrop(e){ e.preventDefault(); var z=document.getElementById('pendingDropZone'); if(z) z.style.outline=''; if(dragId){ var b=BDTS.find(function(x){return x.id===dragId;}); if(b&&!enGoulotte(b)) deprogramBDT(dragId); } dragId=null; _grabDX=0; clearHighlight(); }
function onPendDragStart(e,el){ dragId=el.dataset.bdtid; _grabDX=0; if(e.dataTransfer){ e.dataTransfer.setData('text/plain',dragId); e.dataTransfer.effectAllowed='move'; } var b=BDTS.find(function(x){return x.id===dragId;}); if(b) highlightLot(lotKey(b)); }
function onPendDragEnd(){ clearHighlight(); hideDropGuide(); dragId=null; _grabDX=0; }
function buildStats(){
  var procs=PROCESS.filter(function(p){ return procMatchesAct(p)&&procMatchesType(p); });
  var procIds=procs.map(function(p){return p.id;});
  var inView=BDTS.filter(function(b){ return !enGoulotte(b) && procIds.indexOf(b.process)>=0; });
  var prog=inView.filter(function(b){return b.statut==='programme'||b.statut==='affecte';}).length;
  var recu=inView.filter(function(b){return b.statut==='recu';}).length;
  var solde=inView.filter(function(b){return b.statut==='solde';}).length;
  var nc=inView.filter(function(b){return b.statut==='solde'&&b.resultat==='nc';}).length;
  var pend=BDTS.filter(function(b){return enGoulotte(b);}).length;
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
// Congé d'un opérateur : route de la famille PRODUCTION (avant : /api/rh/…, refusée au responsable de production).
// Les deux boutons de la carte sont désactivés pendant l'appel (un double clic affichait le succès PUIS un refus 409) ;
// ils ne reviennent qu'en cas d'échec.
function validerCongeOp(id, decision, btn){
  var carte=btn&&btn.parentNode, boutons=carte?Array.prototype.slice.call(carte.querySelectorAll('button')):[];
  if(boutons.some(function(b){ return b.disabled; })) return;
  var activer=function(on){ boutons.forEach(function(b){ b.disabled=!on; b.style.opacity=on?'':'.55'; b.style.cursor=on?'pointer':'wait'; }); };
  activer(false);
  fetch('/api/production/conge/'+encodeURIComponent(id)+'/valider',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:decision})})
    .then(function(r){ return r.json().then(function(j){ return {r:r,j:j}; },function(){ return {r:r,j:null}; }); })
    .then(function(x){
      var j=x.j;
      if(!x.r.ok||!j||!j.ok){ activer(true); pushNotif('err','fa-ban',presEsc((j&&j.error)||('Échec (HTTP '+x.r.status+').')),7000); return; }
      pushNotif(decision==='refuse'?'warn':'ok',decision==='refuse'?'fa-times':'fa-check',decision==='refuse'?'Congé refusé.':('Congé validé · '+(j.absences_creees||0)+' jour(s) posés en absence.'),5000);
      if(j.warning) pushNotif('warn','fa-exclamation-triangle',presEsc(j.warning),9000);
      setTimeout(function(){ softReload(); },800);
    }).catch(function(){ activer(true); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
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
  var p=BDTS.filter(function(b){return enGoulotte(b)&&(filtAct==='all'||b.activite===filtAct)&&affaireMatch(b);}); p.sort(pendSort); document.getElementById('cntPend').textContent=p.length;
  document.getElementById('pendingList').innerHTML=p.length?p.map(function(b){
    var col=lotColorOf(b); var lotLabel=b.lotId||b.numAffaire||'—';
    return '<div class="pending-card'+(String(b.id)===String(selBdtId)?' sel':'')+'" draggable="true" data-bdtid="'+b.id+'" data-lot="'+lotKey(b)+'" ondragstart="onPendDragStart(event,this)" ondragend="onPendDragEnd()" onclick="selectPendBdt(\\''+b.id+'\\')" ondblclick="openCmdMere(\\''+(b.cmdId||b.numAffaire||b.lotId||'')+'\\')" title="Double-clic : ouvrir la commande mère" id="pend-'+b.id+'">'
      +'<div style="width:8px;align-self:stretch;min-height:34px;border-radius:4px;flex-shrink:0;background:'+col+'" title="Lot '+lotLabel+'"></div>'
      +'<div style="flex:1;min-width:0;">'
        +'<div style="font-weight:700;color:#1e293b;font-size:.75rem;">'+oxyBox(b.oxydation)+b.id+' <span style="color:#94a3b8;font-weight:400;">· '+b.operation+'</span></div>'
        +'<div style="color:#94a3b8;font-size:.68rem;">'+b.client+' · '+b.piece+' · '+b.duree+'h · <span style="color:'+(b.activite==='Seem'?'#3b82f6':'#ec4899')+';font-weight:600;">'+b.activite+'</span></div>'
        +ccMiniBarre(b)
        +'<div style="font-size:.6rem;margin-top:3px;display:flex;gap:5px;flex-wrap:wrap;align-items:center;">'
          +'<span style="background:'+col+'22;color:'+col+';font-weight:700;border-radius:999px;padding:1px 7px;"><i class="fas fa-layer-group" style="margin-right:3px;"></i>'+lotLabel+'</span>'
          +ccPastilleMorceau(b)
          +(b.numAffaire?'<span style="color:#94a3b8;">Aff. '+b.numAffaire+'</span>':'')
          +(b.seq!=null?'<span style="color:#94a3b8;">Op.'+b.seq+'</span>':'')
          +(b.dateEcheance?'<span style="color:#ef4444;font-weight:600;"><i class="fas fa-flag-checkered" style="margin-right:3px;"></i>'+b.dateEcheance+'</span>':'')
        +'</div>'
        +ccAuPlusTotCarte(b)
      +'</div>'
      +'<div style="flex-shrink:0;align-self:center;display:flex;flex-direction:column;gap:4px;">'
      +'<button type="button" onclick="event.stopPropagation();splitBdt(\\''+b.id+'\\')" ondblclick="event.stopPropagation()" title="Découper ce BDT en morceaux" style="background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe;border-radius:7px;padding:4px 7px;cursor:pointer;font-size:.72rem;"><i class="fas fa-scissors"></i></button>'
      +(b.nbMorceaux>=2?'<button type="button" onclick="event.stopPropagation();recollerBdt(\\''+b.id+'\\')" ondblclick="event.stopPropagation()"'+(CC_RECOLLAGE[b.racine]?' disabled':'')+' title="Annuler la découpe ('+b.nbMorceaux+' morceaux)" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:7px;padding:4px 7px;cursor:'+(CC_RECOLLAGE[b.racine]?'wait;opacity:.5':'pointer')+';font-size:.72rem;"><i class="fas '+(CC_RECOLLAGE[b.racine]?'fa-spinner fa-spin':'fa-rotate-left')+'"></i></button>':'')
      +'</div>'
      +'</div>';
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
function showTT(e,bdt){ var proc=PROCESS.find(function(p){return p.id===bdt.process;}); var tt=document.getElementById('ganttTT'); tt.style.display='block';
  // Lot C : réglage / réalisation, morceau, au plus tôt (chemin critique) et enchaînement à revoir.
  var tps=ccTemps(bdt), apt=ccAptBdt(bdt), viol=CC_VIOL[bdt.id];
  var lignesTemps='<div><span style="opacity:.6;">Réglage : </span>'+(tps.R==null?'<span style="color:#fcd34d;">non renseigné</span>':ccFmtNb(tps.R)+' h <span style="opacity:.6;">(fixe, une seule fois)</span>')+'</div>'
    +'<div><span style="opacity:.6;">Réalisation : </span>'+(tps.R==null?'—':ccFmtNb(tps.V)+' h')+'</div>'
    +(bdt.nbMorceaux>=2?'<div><span style="opacity:.6;">Morceau : </span>M'+bdt.rangMorceau+' · '+bdt.posMorceau+'/'+bdt.nbMorceaux+'</div>':'')
    +(apt.regle!=='aucune'?'<div><span style="opacity:.6;">Au plus tôt : </span>'+(apt.date?ccJJMM(apt.date)+' '+ccFmtH(apt.heure)+' <span style="opacity:.6;">· '+ccEsc(apt.raison)+'</span>':ccEsc(apt.raison))+'</div>':'')
    +(viol?'<div style="color:#fca5a5;font-weight:700;"><i class="fas fa-link-slash" style="margin-right:4px;"></i>'+ccEsc(viol)+'</div>':'');
  tt.innerHTML='<div style="font-weight:700;font-size:.85rem;margin-bottom:4px;">'+bdt.id+'</div><div style="color:#93c5fd;font-size:.72rem;margin-bottom:8px;">'+bdt.operation+' · '+bdt.activite+'</div><div style="font-size:.72rem;line-height:1.6;"><div><span style="opacity:.6;">Client : </span>'+bdt.client+'</div><div><span style="opacity:.6;">Pièce : </span>'+bdt.piece+'</div><div><span style="opacity:.6;">Durée : </span>'+bdt.tempsAlloue+'h</div>'+lignesTemps+'<div><span style="opacity:.6;">Process : </span>'+(proc?proc.nom:'—')+'</div><div><span style="opacity:.6;">Statut : </span><strong style="color:'+bdtColor(bdt)+';">'+bdtStatutLabel(bdt)+'</strong></div>'+(bdt.oxydation?'<div><span style="opacity:.6;">Oxydation : </span>'+oxyBox(bdt.oxydation)+(bdt.oxydation==='noire'?'noire (carré noir)':'incolore (carré blanc)')+'</div>':'')+'<div style="margin-top:4px;color:#fde68a;font-size:.65rem;">Double-clic : recevoir (matricule + PIN), puis sortie matière · Clic droit : menu</div></div>'; moveTT(e); }
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
  if(statut==='programme') payload.date_prevue=currentDate;   // programme = pose sur le jour affiche, sinon il repartirait en goulotte
  // « dont réglage (h) » facultatif : vide = réglage inconnu (non envoyé) ; jamais supérieur à la durée.
  var rgEl=document.getElementById('m_reglage'); var rgS=rgEl?String(rgEl.value||'').trim().replace(',','.'):'';
  if(rgS!==''){ var rgN=Number(rgS); if(!isFinite(rgN)||rgN<0){ pushNotif('err','fa-exclamation-circle','Temps de réglage invalide : nombre d’heures positif ou nul.'); return; } rgN=Math.round(rgN*100)/100; if(rgN>duree){ pushNotif('err','fa-exclamation-circle','Le réglage ('+rgN+' h) ne peut pas dépasser la durée ('+duree+' h).'); return; } payload.temps_reglage=rgN; }
  var pr=null; if(procId!=='pending'){ pr=PROCESS.find(function(p){return p.id===procId;}); payload.process_id=procId; if(pr&&pr.machine_id) payload.machine_id=pr.machine_id; }
  fetch('/api/production/bdts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-exclamation-circle','Création échouée : '+((j&&j.error)||'')); return; }
      var nid=(j.data&&j.data.id)||('BDT-'+(900+BDTS.length+1));
      BDTS.push({id:nid,op:'',process:procId,client:client,piece:piece,operation:op,duree:duree,debut:debut,priorite:prio,statut:statut,resultat:null,activite:act,machineId:(pr&&pr.machine_id)||null,tempsAlloue:duree,debutReel:null,finReel:null,reglage:(payload.temps_reglage!=null?payload.temps_reglage:null)});
      closeModal('bdtModal'); buildAll(); pushNotif('ok','fa-plus-circle','BDT <strong>'+nid+'</strong> créé.');
      if(j.avertissement) pushNotif('warn','fa-exclamation-triangle',String(j.avertissement).replace(/[&<>"]/g,function(ch){ return ch==='&'?'&amp;':ch==='<'?'&lt;':ch==='>'?'&gt;':'&quot;'; }),8000);
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
// Dates calculees en UTC : une date AAAA-MM-JJ reste la meme quel que soit le fuseau du poste (plus de decalage d un jour).
function presIsoPlus(iso,n){ var d=new Date(iso+'T00:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
function presLundi(iso){ var d=new Date(iso+'T00:00:00Z'); return presIsoPlus(iso,-((d.getUTCDay()+6)%7)); }
function presDateFr(iso,opts){ try{ var o=opts||{day:'2-digit',month:'2-digit'}; o.timeZone='UTC'; return new Date(iso+'T00:00:00Z').toLocaleDateString('fr-FR',o); }catch(e){ return iso; } }
function presEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
var presWeekStart=presLundi('${TODAY}');
// 4 creneaux (Matin, Journee, Apres-midi, Soiree) + Absent : { id: [fond, texte, libelle, horaires] }, tires de SHIFTS (shared.ts).
var PRES_SHIFTS=${sjX(PRES_PALETTE)};
var PRES_ORDRE=${sjX(PRES_ORDRE)};
// Jours dont les presences viennent REELLEMENT du serveur. La case d un jour non charge est verrouillee :
// affichee vide et cliquable, elle ecraserait une vraie presence en base.
var PRES_JOURS_CHARGES=${sjX(PRES_JOURS_CHARGES)};
var PRES_CHARGEMENT={};   // lundi -> 'encours' | 'ok' | 'echec'
// Ecritures : UNE requete par choix, en FILE par case (l ordre en base est l ordre des clics), affichage optimiste,
// retour a la derniere valeur CONFIRMEE par le serveur si la requete echoue.
// PRES_TOUCHE[case] = horloge au DÉBUT de sa dernière écriture ; PRES_FIN[case] = horloge à la FIN d'une écriture.
var PRES_FILE={}, PRES_EN_COURS={}, PRES_CONFIRME={}, PRES_SEQ={}, PRES_TOUCHE={}, PRES_FIN={}, PRES_HORLOGE=0;
function presDays(){ var arr=[]; for(var i=0;i<7;i++) arr.push(presIsoPlus(presWeekStart,i)); return arr; }
function presKey(op,date){ return op+'|'+date; }
function presJourCharge(date){ return !!PRES_JOURS_CHARGES[date]; }
function presSemaineChargee(lundi){ for(var i=0;i<7;i++){ if(!PRES_JOURS_CHARGES[presIsoPlus(lundi,i)]) return false; } return true; }
function presOp(op){ return OPS_PRESENCE.find(function(o){ return String(o.id)===String(op); })||null; }
function presGet(op,date){
  // Absence RH prioritaire
  for(var i=0;i<ABSENCES_RH.length;i++){ if(String(ABSENCES_RH[i].operateur_id)===String(op)&&ABSENCES_RH[i].date===date) return {shift:'absent',rh:true,type:ABSENCES_RH[i].type,charge:true}; }
  var charge=presJourCharge(date);
  for(var j=0;j<PRESENCES.length;j++){ if(String(PRESENCES[j].operateur_id)===String(op)&&PRESENCES[j].date===date) return {shift:PRESENCES[j].shift,rh:false,charge:charge}; }
  return {shift:'',rh:false,charge:charge};
}
function presSetLocal(op,date,shift){
  PRESENCES=PRESENCES.filter(function(p){ return !(String(p.operateur_id)===String(op)&&p.date===date); });
  if(shift) PRESENCES.push({operateur_id:op,date:date,shift:shift});
}
// Etat de chargement de la semaine affichee, a cote de ses fleches.
function presMajEtat(){
  var el=document.getElementById('presWeekEtat'); if(!el) return;
  var s=PRES_CHARGEMENT[presWeekStart];
  if(s==='encours') el.innerHTML='<i class="fas fa-spinner fa-spin" style="color:#94a3b8;" title="Chargement des présences de la semaine"></i>';
  else if(s==='echec') el.innerHTML='<button type="button" onclick="presChargerSemaine(presWeekStart)" title="'+(presSemaineChargee(presWeekStart)?'Relecture impossible : affichage de la dernière lecture (cases modifiables)':'Présences de la semaine non chargées : les cases restent verrouillées')+'" style="border:none;background:#fef3c7;color:#b45309;border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-rotate-right" style="margin-right:4px;"></i>Réessayer</button>';
  else el.innerHTML='';
}
function presBuild(){
  var grid=document.getElementById('presGrid'); if(!grid) return;
  // Semaine jamais lue (page rendue sans ses presences, ou semaine hors fenetre) : on la lit d abord.
  if(!PRES_CHARGEMENT[presWeekStart] && !presSemaineChargee(presWeekStart)){ presChargerSemaine(presWeekStart); return; }
  // Un seul ecouteur pour toute la grille (delegation) : la case porte l operateur et la date en attributs.
  if(!grid.getAttribute('data-pres-deleg')){
    grid.setAttribute('data-pres-deleg','1');
    grid.addEventListener('click',function(e){ var b=(e.target&&e.target.closest)?e.target.closest('button[data-pres-op]'):null; if(!b||b.disabled) return; presOuvrirMenu(b,b.getAttribute('data-pres-op'),b.getAttribute('data-pres-date')); });
  }
  var days=presDays();
  var lbl=document.getElementById('presWeekLabel'); if(lbl) lbl.textContent='Sem. du '+presDateFr(days[0])+' au '+presDateFr(days[6],{day:'2-digit',month:'2-digit',year:'numeric'});
  presMajEtat();
  var ops=OPS_PRESENCE.filter(function(o){ return presFiltAct==='all'||o.activite===presFiltAct; });
  var html='<table style="width:100%;border-collapse:collapse;font-size:.78rem;"><thead><tr style="background:#1e293b;color:white;">'
    +'<th style="text-align:left;padding:9px 12px;min-width:200px;position:sticky;left:0;background:#1e293b;">Opérateur</th>';
  days.forEach(function(iso){ var dw=new Date(iso+'T00:00:00Z').getUTCDay(); var we=(dw===0||dw===6); html+='<th style="padding:7px 4px;text-align:center;min-width:92px;'+(we?'opacity:.6;':'')+'"><div style="font-size:.62rem;opacity:.7;text-transform:uppercase;">'+presDateFr(iso,{weekday:'short'})+'</div><div style="font-weight:800;">'+presDateFr(iso)+'</div></th>'; });
  html+='</tr></thead><tbody>';
  if(ops.length===0){ html+='<tr><td colspan="8" style="text-align:center;padding:30px;color:#94a3b8;">Aucun opérateur '+(presFiltAct!=='all'?presEsc(presFiltAct):'')+'.</td></tr>'; }
  ops.forEach(function(o){
    var actCol=o.activite==='Seem'?'#3b82f6':'#ec4899';
    html+='<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:8px 12px;position:sticky;left:0;background:white;border-right:1px solid #f1f5f9;"><div style="display:flex;align-items:center;gap:8px;"><span style="width:26px;height:26px;border-radius:50%;background:'+actCol+';color:white;font-size:.62rem;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">'+presEsc((o.nom||'').charAt(0))+'</span><div><div style="font-weight:700;color:#1e293b;">'+presEsc(o.nom)+'</div><div style="font-size:.6rem;color:'+actCol+';font-weight:700;">'+presEsc(o.activite)+(o.poste?' · '+presEsc(o.poste):'')+'</div></div></div></td>';
    days.forEach(function(iso){
      var g=presGet(o.id,iso);
      var st=g.shift||''; var connu=!!(st&&PRES_SHIFTS[st]);
      var sc=connu?PRES_SHIFTS[st]:['#f8fafc','#94a3b8',st||'—',''];
      var verrou=g.rh||!g.charge;
      var attente=!!PRES_EN_COURS[presKey(o.id,iso)];
      var titre=g.rh?('Absence RH ('+(g.type||'')+')')
        :(!g.charge?'Présences de cette semaine non chargées'
        :((st?(sc[2]+(sc[3]?' '+sc[3]:'')):'Non programmé')+(attente?' · enregistrement en cours':'')+' · cliquer pour choisir'));
      var txt=g.rh?('<i class="fas fa-lock" style="margin-right:3px;font-size:.6rem;"></i>'+presEsc(sc[2]))
        :(!g.charge?(PRES_CHARGEMENT[presLundi(iso)]==='encours'?'…':'?'):presEsc(st?sc[2]:'—'));
      html+='<td style="padding:4px;text-align:center;"><button type="button" '+(verrou?'disabled ':'')+'data-pres-op="'+presEsc(o.id)+'" data-pres-date="'+iso+'" title="'+presEsc(titre)+'" style="width:84px;padding:6px 4px;border-radius:7px;border:1px solid '+(connu?sc[1]+'40':'#e2e8f0')+';background:'+sc[0]+';color:'+sc[1]+';font-size:.68rem;font-weight:700;cursor:'+(verrou?'not-allowed':'pointer')+';'+(attente?'opacity:.65;':'')+'">'+txt+'</button></td>';
    });
    html+='</tr>';
  });
  html+='</tbody></table>';
  grid.innerHTML=html;
}
// ─── Menu d'une case : Matin · Journée · Après-midi · Soirée · Absent · Effacer ───
// (14/09/2026) Remplace le cycle au clic : atteindre « soir » demandait 3 clics, donc 3 POST en parallèle dont l'ordre
// d'arrivée n'était pas garanti — la base pouvait garder « matin ». Désormais : un choix = UN appel.
// Clavier (revue du lot C) : Échap et Tab referment le menu et RENDENT le focus à la case qui l'a ouvert (retrouvée par
// ses attributs : la grille est reconstruite par innerHTML) ; flèches haut/bas, Début/Fin entre les choix disponibles.
var PRES_MENU_ORIGINE=null;   // [operateur, date] de la case qui a ouvert le menu
function presFocusCase(op,date){
  var bs=document.querySelectorAll('#presGrid button[data-pres-op]');
  for(var i=0;i<bs.length;i++){ if(bs[i].getAttribute('data-pres-op')===String(op)&&bs[i].getAttribute('data-pres-date')===String(date)){ try{ bs[i].focus({preventScroll:true}); }catch(e){} return true; } }
  return false;
}
function presFermerMenu(rendreFocus){
  var m=document.getElementById('presMenu'); if(m&&m.parentNode) m.parentNode.removeChild(m);
  document.removeEventListener('mousedown',presMenuDehors,true);
  document.removeEventListener('keydown',presMenuTouche,true);
  window.removeEventListener('scroll',presMenuDefile,true);
  var o=PRES_MENU_ORIGINE; PRES_MENU_ORIGINE=null;
  if(rendreFocus===true&&o) presFocusCase(o[0],o[1]);
}
function presMenuDehors(e){ var m=document.getElementById('presMenu'); if(m&&!m.contains(e.target)) presFermerMenu(); }
function presMenuTouche(e){
  var m=document.getElementById('presMenu'); if(!m) return;
  if(e.key==='Escape'||e.key==='Esc'||e.key==='Tab'){ e.preventDefault(); e.stopPropagation(); presFermerMenu(true); return; }
  if(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Home'||e.key==='End'){
    var items=Array.prototype.slice.call(m.querySelectorAll('.pres-choix:not([disabled])')); if(!items.length) return;
    e.preventDefault();
    var i=items.indexOf(document.activeElement);
    var n=e.key==='Home'?0:(e.key==='End'?items.length-1:(e.key==='ArrowDown'?(i+1)%items.length:(i<=0?items.length-1:i-1)));
    try{ items[n].focus({preventScroll:true}); }catch(err){}
  }
}
function presMenuDefile(e){ var m=document.getElementById('presMenu'); if(m&&!(e&&e.target&&m.contains(e.target))) presFermerMenu(); }
// Entrées du menu pour une case dont la valeur actuelle est « cur » : [valeur, libellé, horaires, fond, texte, actif]
function presChoixMenu(cur){
  return PRES_ORDRE.concat(['']).map(function(k){
    var sc=k?PRES_SHIFTS[k]:null;
    return [k, sc?sc[2]:'Effacer', sc?sc[3]:'', sc?sc[0]:'', sc?sc[1]:'#64748b', (cur||'')===k];
  });
}
function presOuvrirMenu(btn,op,date){
  presFermerMenu();
  var g=presGet(op,date); if(g.rh||!g.charge) return;
  var o=presOp(op);
  var m=document.createElement('div'); m.id='presMenu'; m.setAttribute('role','menu');
  m.style.cssText='position:fixed;z-index:700;background:white;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 12px 32px rgba(15,23,42,.18);padding:5px;min-width:200px;';
  var h='<div style="padding:5px 8px 6px;font-size:.66rem;color:#64748b;font-weight:700;border-bottom:1px solid #f1f5f9;margin-bottom:3px;">'+presEsc(o?o.nom:op)+' · '+presEsc(presDateFr(date,{weekday:'short',day:'2-digit',month:'2-digit'}))+'</div>';
  presChoixMenu(g.shift).forEach(function(c){
    h+='<button type="button" role="menuitem" class="pres-choix" data-pres-choix="'+c[0]+'"'+(c[5]?' disabled':'')+' style="display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:none;border-radius:7px;background:'+(c[5]?'#f1f5f9':'white')+';cursor:'+(c[5]?'default':'pointer')+';font-size:.76rem;font-weight:700;text-align:left;">'
      +(c[0]?'<span style="width:12px;height:12px;border-radius:3px;flex-shrink:0;background:'+c[3]+';border:1px solid '+c[4]+';"></span>':'<i class="fas fa-eraser" style="width:12px;color:#94a3b8;"></i>')
      +'<span style="color:'+c[4]+';">'+presEsc(c[1])+'</span>'
      +'<span style="margin-left:auto;font-size:.64rem;color:#94a3b8;font-weight:600;">'+presEsc(c[2])+'</span>'
      +(c[5]&&c[0]?'<i class="fas fa-check" style="color:#10b981;font-size:.66rem;"></i>':'')
      +'</button>';
  });
  m.innerHTML=h;
  m.addEventListener('click',function(e){ var b=(e.target&&e.target.closest)?e.target.closest('[data-pres-choix]'):null; if(!b||b.disabled) return; var k=b.getAttribute('data-pres-choix')||''; presFermerMenu(true); presChoisir(op,date,k); });
  document.body.appendChild(m);
  PRES_MENU_ORIGINE=[String(op),String(date)];
  var r=btn.getBoundingClientRect(); var top=r.bottom+4, left=r.left;
  if(top+m.offsetHeight>window.innerHeight-8) top=Math.max(8,r.top-m.offsetHeight-4);
  if(left+m.offsetWidth>window.innerWidth-8) left=Math.max(8,window.innerWidth-m.offsetWidth-8);
  m.style.top=top+'px'; m.style.left=left+'px';
  document.addEventListener('mousedown',presMenuDehors,true);
  document.addEventListener('keydown',presMenuTouche,true);
  window.addEventListener('scroll',presMenuDefile,true);
  var premier=m.querySelector('button:not([disabled])'); if(premier){ try{ premier.focus({preventScroll:true}); }catch(e){} }
}
// Reconstruit la grille (innerHTML) sans perdre le focus clavier : la case qui l'avait le retrouve.
function presRafraichir(){
  var a=document.activeElement, op=null, dt=null;
  if(a&&a.getAttribute&&a.getAttribute('data-pres-op')!=null){ op=a.getAttribute('data-pres-op'); dt=a.getAttribute('data-pres-date'); }
  presBuild(); if(typeof buildOperatorsByShift==='function') buildOperatorsByShift();
  if(op!=null&&document.activeElement!==a) presFocusCase(op,dt);
}
// Un choix dans le menu. Même valeur que l'actuelle : rien à envoyer.
function presChoisir(op,date,k){
  var g=presGet(op,date); if(g.rh||!g.charge) return;
  if((g.shift||'')===(k||'')) return;
  var o=presOp(op);
  var p=presEcrire(op,date,k||'',o);
  presRafraichir();
  return p.then(function(res){
    presRafraichir();
    if(!res.ok) pushNotif('err','fa-ban','Présence non enregistrée — <strong>'+presEsc(o?o.nom:op)+'</strong>, '+presEsc(presDateFr(date,{weekday:'short',day:'2-digit',month:'2-digit'}))+' : '+presEsc(res.error)+'. La case affiche la dernière valeur enregistrée.',8000);
    return res;
  });
}
// UNE requête : POST (créneau ou absent) ou DELETE (vider la case). Ne rejette jamais : {ok} ou {ok:false,error}.
function presRequete(op,date,k,o){
  var corps=k?{operateur_id:op,operateur_nom:o?o.nom:'',activite:o?o.activite:'',date_presence:date,shift:k}:{operateur_id:op,date_presence:date};
  return fetch('/api/production/presence',{method:k?'POST':'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify(corps)})
    .then(function(r){
      return r.json().then(function(j){
        if(r.ok&&j&&j.ok) return {ok:true};
        var msg=(j&&j.error)||('HTTP '+r.status);
        if(r.status===403) msg+=' (droit d\\'écriture Production requis)';
        return {ok:false,error:msg};
      },function(){ return {ok:false,error:'réponse illisible (HTTP '+r.status+', session expirée ?)'}; });
    },function(){ return {ok:false,error:'erreur réseau'}; });
}
// Écriture d'une case : affichage optimiste, requêtes EN FILE par case, retour à la dernière valeur confirmée si la
// dernière requête de la case échoue. Renvoie une promesse {ok,error} qui ne rejette jamais.
function presEcrire(op,date,k,o){
  var key=presKey(op,date);
  if(!PRES_EN_COURS[key]) PRES_CONFIRME[key]=presGet(op,date).shift||'';
  PRES_EN_COURS[key]=(PRES_EN_COURS[key]||0)+1;
  var seq=PRES_SEQ[key]=(PRES_SEQ[key]||0)+1;
  PRES_TOUCHE[key]=++PRES_HORLOGE;
  presSetLocal(op,date,k);
  var lancer=function(){ return presRequete(op,date,k,o); };
  var p=(PRES_FILE[key]||Promise.resolve()).then(lancer,lancer);
  PRES_FILE[key]=p;
  return p.then(function(res){
    PRES_FIN[key]=++PRES_HORLOGE;
    PRES_EN_COURS[key]--;
    if(res.ok) PRES_CONFIRME[key]=k;
    else if(PRES_SEQ[key]===seq) presSetLocal(op,date,PRES_CONFIRME[key]);
    if(!PRES_EN_COURS[key]){ delete PRES_EN_COURS[key]; delete PRES_CONFIRME[key]; if(PRES_FILE[key]===p) delete PRES_FILE[key]; }
    return res;
  });
}
// Lecture des présences d'une semaine (GET /api/production/presence?from=&to=) : navigation de semaine, jour du planning
// hors fenêtre, ou page rendue sans ses présences. Tant qu'elle n'a pas abouti, les cases de la semaine restent verrouillées.
function presChargerSemaine(lundi){
  if(PRES_CHARGEMENT[lundi]==='encours') return;
  PRES_CHARGEMENT[lundi]='encours';
  var depuis=PRES_HORLOGE, to=presIsoPlus(lundi,6);
  if(lundi===presWeekStart) presBuild();
  return fetch('/api/production/presence?from='+lundi+'&to='+to,{headers:{'Accept':'application/json'}})
    .then(function(r){ return r.json().then(function(j){ return {r:r,j:j}; },function(){ return {r:r,j:null}; }); })
    .then(function(x){
      if(!x.r.ok||!x.j||!x.j.ok||!Array.isArray(x.j.presences)) throw new Error((x.j&&x.j.error)||(x.j?('HTTP '+x.r.status):'réponse illisible (session expirée ?)'));
      presFusionner(lundi,to,x.j.presences,depuis);
      PRES_CHARGEMENT[lundi]='ok';
    })
    .catch(function(e){
      PRES_CHARGEMENT[lundi]='echec';
      // Semaine déjà lue auparavant (rendu de la page ou lecture précédente) : ses cases restent utilisables, on le dit.
      var dejaLue=presSemaineChargee(lundi);
      pushNotif('err','fa-exclamation-circle','Présences de la semaine du '+presEsc(presDateFr(lundi))+' non '+(dejaLue?'relues':'chargées')+' : '+presEsc((e&&e.message)||'erreur réseau')+'. '+(dejaLue?'Affichage de la dernière lecture : les cases restent modifiables.':'Les cases de cette semaine restent verrouillées.'),8000);
    })
    .then(function(){ presRafraichir(); });
}
// Fusion d'une lecture dans PRESENCES. Une case garde sa valeur locale si une écriture y est en cours, a DÉMARRÉ après le
// départ de la lecture, ou s'est TERMINÉE après ce départ : dans les trois cas la lecture a pu être faite par le serveur
// avant que l'écriture soit validée, et rapporterait l'ancienne valeur. (Le 3ᵉ cas manquait : une écriture lancée juste
// avant la relecture et terminée avant sa réponse était écrasée à l'écran, et la base gardait l'autre valeur.)
function presFusionner(from,to,rows,depuis){
  var garde=function(op,date){ var k=presKey(op,date); return !!PRES_EN_COURS[k] || (PRES_TOUCHE[k]||0)>depuis || (PRES_FIN[k]||0)>depuis; };
  PRESENCES=PRESENCES.filter(function(p){ return !(p.date>=from&&p.date<=to) || garde(p.operateur_id,p.date); });
  rows.forEach(function(p){ if(p && p.date>=from && p.date<=to && !garde(p.operateur_id,p.date)) PRESENCES.push({operateur_id:String(p.operateur_id),date:p.date,shift:p.shift}); });
  for(var d=from; d<=to; d=presIsoPlus(d,1)) PRES_JOURS_CHARGES[d]=true;
}
function presShiftWeek(d){ presFermerMenu(); presWeekStart=presIsoPlus(presWeekStart,d*7); presBuild(); presChargerSemaine(presWeekStart); }
function presSetAct(a,btn){ presFiltAct=a; ['all','Seem','Semrac'].forEach(function(x){ var e=document.getElementById('pres-fa-'+x); if(e) e.classList.toggle('active',x===a); }); presBuild(); }

// ─── Modal : programmer la semaine entière ───────────────────
function openPresWeekModal(){
  presFermerMenu();
  var wl=document.getElementById('presWkLabel'); if(wl){ var dd=presDays(); wl.textContent='du '+presDateFr(dd[0])+' au '+presDateFr(dd[6],{day:'2-digit',month:'2-digit',year:'numeric'}); }
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
  if(shift && !PRES_SHIFTS[shift]){ pushNotif('err','fa-ban','Créneau inconnu.'); return; }
  // Jamais d'écriture sur une semaine non chargée : la valeur à rétablir en cas d'échec serait inconnue.
  if(!presSemaineChargee(presWeekStart)){
    pushNotif('warn','fa-hourglass-half','Les présences de la semaine affichée ne sont pas encore chargées : réessayez dans un instant.',5000);
    if(PRES_CHARGEMENT[presWeekStart]!=='encours') presChargerSemaine(presWeekStart);
    return;
  }
  var days=presDays();
  var ndays=(jours==='ouvres')?5:7;
  // « Effacer » = vrai DELETE (avant : enregistrait « absent ») ; chaque réponse est LUE (avant : succès affiché d'office).
  var ecritures=[], dejaAJour=0;
  picks.forEach(function(opId){
    var opObj=presOp(opId);
    if(!opObj) return;
    for(var i=0;i<ndays;i++){
      var g=presGet(opId,days[i]);
      if(g.rh) continue;                                   // Ne pas écraser une absence RH
      if((g.shift||'')===shift){ dejaAJour++; continue; }  // rien à envoyer
      ecritures.push(presEcrire(opId,days[i],shift,opObj));
    }
  });
  closePresWeekModal();
  presRafraichir();
  if(!ecritures.length){ pushNotif('info','fa-calendar-week','Rien à changer : ces cases avaient déjà cette valeur.',4500); return; }
  Promise.all(ecritures).then(function(res){
    presRafraichir();
    var n=res.length, ko=res.filter(function(x){ return !x.ok; });
    if(!ko.length){
      pushNotif('ok','fa-calendar-week','Semaine programmée pour '+picks.length+' opérateur'+(picks.length>1?'s':'')+' · '+n+' case'+(n>1?'s':'')+' enregistrée'+(n>1?'s':'')+(dejaAJour?' ('+dejaAJour+' déjà à jour)':'')+'.',5500);
    } else {
      pushNotif('err','fa-ban',ko.length+' case'+(ko.length>1?'s':'')+' sur '+n+' non enregistrée'+(ko.length>1?'s':'')+' : '+presEsc(ko[0].error)+'. Ces cases affichent la dernière valeur enregistrée.',9000);
    }
  });
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
      // Chemin critique (lot C) : BST planifié avant la fin de l étape précédente → liseré rouge + motif en info-bulle.
      if(CC_VIOL[b.id]){ bar.style.boxShadow='0 0 0 2px #dc2626'; }   // motif dans l info-bulle bstShowTT (pas de title : 2 bulles se superposaient)
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
        ccDispoBst(b)+
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
  return grouperEtapesParSeq(l);   // morceaux « -Mk » d un BDT = une seule étape (cf. etapesDuLot)
}
function bstLotFournSet(bstId){
  var b=BST_DATA.find(function(x){return x.id===bstId;}); if(!b) return null;
  var l=bstEtapesDuLot(bstLotKey(b));
  var i=etapeIndexDe(l,b.id);
  if(i<0) return null;
  var s={};
  // Seules les etapes sous-traitees ont une ligne dans ce planning (les etapes internes
  // sont nommees dans le bandeau mais n ajoutent pas de sous-traitant).
  [l[i-1], l[i], l[i+1]].forEach(function(x){ if(!x) return; x.membres.forEach(function(m){ if(m.st && m.sous_traitant_id) s[String(m.sous_traitant_id)]=true; }); });
  return s;
}
function bstEtapeLabel(bstId){
  var b=BST_DATA.find(function(x){return x.id===bstId;}); if(!b) return '';
  var l=bstEtapesDuLot(bstLotKey(b));
  var i=etapeIndexDe(l,b.id);
  var nomMembre=function(x){
    if(!x) return null;
    if(!x.st) return 'atelier ' + (x.ref.operation || '');            // etape interne
    var f=BST_FOURN.find(function(z){ return String(z.id)===String(x.sous_traitant_id); });
    return f?f.nom:(x.ref.operation||null);
  };
  var nomST=function(x){ if(!x) return null; var noms=[]; (x.membres||[x]).forEach(function(m){ var n=nomMembre(m); if(n&&noms.indexOf(n)<0) noms.push(n); }); return noms.length?noms.join(' + '):null; };
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
      (CC_VIOL[b.id]?'<div style="color:#fca5a5;font-weight:700;margin-top:4px;"><i class="fas fa-link-slash" style="margin-right:4px;"></i>'+ccEsc(CC_VIOL[b.id])+'</div>':'')+
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
// « Dispo le … » d un BST : jour où l étape précédente est finie (fin complète) ou revenue de sous-traitance.
function ccDispoBst(b){
  var apt=ccAuPlusTot(b,ccOpsDuLot(ccCleLot(b)));
  if(apt.regle==='aucune') return '';
  if(apt.regle==='inconnu'||!apt.date) return '<div title="'+ccEsc(apt.raison)+'" style="font-size:.58rem;color:#94a3b8;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;"><i class="fas fa-route" style="margin-right:3px;"></i>Dispo : '+ccEsc(apt.raison)+'</div>';
  return '<div title="'+ccEsc(apt.raison)+'" style="font-size:.6rem;color:#0f766e;font-weight:700;margin-top:3px;"><i class="fas fa-route" style="margin-right:3px;"></i>Dispo le '+ccJJMM(apt.date)+'</div>';
}
function bstAssignDay(bstId, fournId, dayIso){
  var b=BST_DATA.find(function(x){return x.id===bstId;}); if(!b) return;
  // CHEMIN CRITIQUE : contrôle au jour, identique au serveur (/api/production/bst/:id/affecter-st → 409).
  var ctlB=ccControle(Object.assign({}, b, {sous_traitant_id:fournId, date_envoi:dayIso, date_debut:dayIso}), ccOpsDuLot(ccCleLot(b)));
  if(ctlB.etat==='refus'){ pushNotif('err','fa-route',ccEsc(ctlB.message),9000); return; }
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
      pushNotif('err','fa-ban',ccEsc((j&&j.error)||'Affectation BST échouée.'),(j&&j.au_plus_tot)?9000:5000);
      return;
    }
    if(j.bc_id) b.bc_id=j.bc_id;
    ccMajViolations(); bstBuildBody(); bstBuildPending(); ccRenderCarte(); buildGantt(); buildPending();
    pushNotif('ok','fa-check-circle','BST <strong>'+bstId+'</strong> affecté au '+dayIso+'. BC <strong>'+(j.bc_id||'')+'</strong> créé (en attente d\\'envoi).',6000);
    var succB=Array.isArray(j.successeurs_en_violation)?j.successeurs_en_violation:[];
    if(succB.length) pushNotif('warn','fa-link-slash',ccEsc(succB.length+' étape'+(succB.length>1?'s':'')+' suivante'+(succB.length>1?'s':'')+' à revoir (rien n’a été décalé) : '+succB.map(function(x){ return x.message; }).join(' · ')),12000);
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
function bstBuildAll(){ ccMajViolations(); bstBuildKpis(); bstBuildHeader(); bstBuildBody(); bstBuildPending(); }
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
// ── Découpe d un BDT de la GOULOTTE en morceaux : seul le temps de RÉALISATION se découpe ──
//    Seul point d entrée : les ciseaux d une carte de goulotte (plus rien depuis le planning).
//    Le réglage (fait une seule fois) reste sur le morceau 1 : lu à l ouverture par
//    GET /api/production/bdt/:id/temps (verrouillé s il est connu, saisissable sinon).
//    Chaque morceau reçoit EXACTEMENT le temps alloué ; la somme peut différer de la réalisation
//    d origine (confirmation demandée avant d envoyer). Le serveur refuse (409) un BDT posé.
//    Interface (15/09/2026) : une JAUGE de tout le temps de réalisation V (un segment coloré par morceau,
//    reste en gris, dépassement en orange, réglage à part et hachuré) + un CURSEUR par morceau (0 à V,
//    pas de 0,25 h à la souris et au clavier, aimanté sur le reste exact) + un champ au centième synchronisé.
var _splitBdt=null, _splitWired=false, SPLIT_MIN=2, SPLIT_MAX=12;
// Couleur de chaque morceau (texte blanc lisible, contraste ≥ 4,5:1) ; l orange est réservé au dépassement.
var SPLIT_COULEURS=['#7c3aed','#2563eb','#0f766e','#be185d','#4d7c0f','#0369a1','#86198f','#15803d','#4338ca','#0e7490','#9f1239','#475569'];
function splitCouleur(i){ return SPLIT_COULEURS[i%SPLIT_COULEURS.length]; }
function splitEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(ch){ return ch==='&'?'&amp;':ch==='<'?'&lt;':ch==='>'?'&gt;':'&quot;'; }); }
function splitFmtH(x){ var r=Math.round((Number(x)||0)*1000)/1000; return String(r).replace('.',','); }
// Durée actuelle lue comme le serveur : duree, sinon temps alloué (0 si aucune).
function splitDureeOf(bdt){ var d=(bdt.duree!=null&&bdt.duree!=='')?Number(bdt.duree):Number(bdt.tempsAlloue||0); return (isFinite(d)&&d>0)?d:0; }
// Précision = le 1/100 d heure : c est ce que garde la colonne duree en base (cf. route /separer).
function splitR2(x){ return Math.round((Number(x)||0)*100)/100; }
// Réglage retenu (h) : le connu, sinon la saisie (vide = 0, tout est réalisation) ; NaN si la saisie est invalide.
function splitReglageVal(){
  if(!_splitBdt) return 0;
  if(_splitBdt.reglageConnu) return splitR2(_splitBdt.reglage);
  if(_splitBdt.saisiePossible===false) return 0;   // morceau d une étape dont le réglage se renseigne sur le BDT d origine
  var s=String(_splitBdt.reglageSaisi==null?'':_splitBdt.reglageSaisi).trim().replace(',','.');
  if(s==='') return 0;
  var n=Number(s); return (isFinite(n)&&n>=0)?splitR2(n):NaN;
}
// Réalisation valide : supérieure à 0 au centième ; le morceau 1 peut valoir 0 s il porte un réglage (« réglage seul »).
function splitValidAt(x,i){ if(!isFinite(x)||x<0) return false; var cts=Math.round(x*100); var R=splitReglageVal(); return (i===0&&isFinite(R)&&R>0)?cts>=0:cts>0; }
// Délégation d événements sur la liste des morceaux (posée une seule fois) + saisie du réglage.
//   curseur (input) : valeur aimantée (quart d heure, reste exact, bout de l échelle) puis jauge en direct ;
//   curseur (clavier) : flèches ± 0,25 h, Page ± 1 h, Début = 0, Fin = tout le temps ; champ : valeur libre au centième.
function splitWire(){
  if(_splitWired) return; var box=document.getElementById('splitParts'); if(!box) return; _splitWired=true;
  box.addEventListener('input',function(e){
    var t=e.target; if(!_splitBdt||_splitBdt.loading||!t||!t.classList) return;
    var i=Number(t.getAttribute('data-i')); if(!(i>=0&&i<_splitBdt.vals.length)) return;
    if(t.classList.contains('split-range')) splitPoser(i,splitAimant(Number(t.value),i));
    else if(t.classList.contains('split-part')){ _splitBdt.vals[i]=t.value; _splitBdt.valsTouchees=true; splitSyncCurseur(i); splitTotalCheck(); }
  });
  box.addEventListener('keydown',function(e){
    var t=e.target; if(!_splitBdt||_splitBdt.loading||!t||!t.classList||!t.classList.contains('split-range')) return;
    var i=Number(t.getAttribute('data-i')); if(!(i>=0&&i<_splitBdt.vals.length)) return;
    var k=e.key, x=splitValeur(i), nx=null;
    if(k==='ArrowRight'||k==='ArrowUp') nx=splitPas(x,1,0.25,i);
    else if(k==='ArrowLeft'||k==='ArrowDown') nx=splitPas(x,-1,0.25,i);
    else if(k==='PageUp') nx=splitPas(x,1,1,i);
    else if(k==='PageDown') nx=splitPas(x,-1,1,i);
    else if(k==='Home') nx=0;
    else if(k==='End') nx=splitEchelle();
    if(nx===null) return;
    e.preventDefault(); splitPoser(i,nx);
  });
  box.addEventListener('click',function(e){ var t=(e.target&&e.target.closest)?e.target.closest('.split-del'):null; if(!t||t.disabled||!_splitBdt) return; splitRemove(Number(t.getAttribute('data-i'))); });
  var rg=document.getElementById('splitReglage');
  // Réglage saisi : la réalisation V change, donc l échelle des curseurs aussi (pré-remplissage refait tant que rien n a été touché).
  if(rg) rg.addEventListener('input',function(){ if(!_splitBdt||_splitBdt.reglageConnu||_splitBdt.loading||_splitBdt.saisiePossible===false) return; _splitBdt.reglageSaisi=rg.value; splitPrefill(_splitBdt); splitRecap(); splitRender(); });
}
// Lecture d une valeur saisie (virgule acceptée) : NaN si vide ou invalide.
function splitNum(v){ var s=String(v==null?'':v).trim().replace(',','.'); return s===''?NaN:Number(s); }
function splitValeur(i){ var x=_splitBdt?splitNum(_splitBdt.vals[i]):NaN; return (isFinite(x)&&x>0)?x:0; }
// Réalisation à répartir V = durée − réglage (réglage invalide compté 0) ; échelle des curseurs = V, ou 8 h si V = 0.
function splitV(){ var cur=_splitBdt; if(!cur) return 0; var R=splitReglageVal(); var Rn=isFinite(R)?R:0; return Math.max(0,splitR2(cur.total-Rn)); }
function splitEchelle(){ var V=splitV(); return V>0?V:8; }
// Somme des temps alloués (en centièmes, sans erreur d arrondi), le morceau i exclu (i = -1 : tous).
function splitSommeSauf(i){ var cur=_splitBdt; if(!cur) return 0; var c=0; for(var k=0;k<cur.vals.length;k++){ if(k===i) continue; var x=splitNum(cur.vals[k]); if(isFinite(x)&&x>0) c+=Math.round(x*100); } return c/100; }
function splitRow(i){ return document.querySelector('#splitParts .split-row[data-i="'+i+'"]'); }
// Curseur à la souris : quart d heure, mais aimanté sur le reste exact (ce qui complète V) et sur le bout de l échelle.
function splitAimant(x,i){
  var E=splitEchelle(), V=splitV();
  if(!isFinite(x)||x<0) x=0; if(x>E) x=E;
  var seuil=Math.max(0.125,E*0.015), reste=splitR2(V-splitSommeSauf(i));
  if(V>0&&reste>0&&reste<=E&&Math.abs(x-reste)<=seuil) return reste;
  if(E-x<=seuil) return splitR2(E);
  return splitR2(Math.round(x*4)/4);
}
// Curseur au clavier : quart d heure (ou heure) suivant, avec un arrêt sur le reste exact s il est franchi.
function splitPas(x,dir,p,i){
  var E=splitEchelle(), V=splitV(), nx;
  if(dir>0&&x>=E-0.004) return splitR2(x);
  nx=dir>0?(Math.floor(x/p+1e-6)+1)*p:(Math.ceil(x/p-1e-6)-1)*p;
  var reste=splitR2(V-splitSommeSauf(i));
  if(V>0&&reste>0){ if(dir>0&&reste>x+0.004&&reste<nx-0.004) nx=reste; if(dir<0&&reste<x-0.004&&reste>nx+0.004) nx=reste; }
  return splitR2(Math.min(E,Math.max(0,nx)));
}
// Pose une valeur sur le morceau i (curseur, clavier, bouton) : champ et curseur alignés, jauge et pied recalculés.
function splitPoser(i,x){
  var cur=_splitBdt; if(!cur||!(i>=0&&i<cur.vals.length)) return;
  x=splitR2(Math.max(0,x)); cur.vals[i]=String(x); cur.valsTouchees=true;
  var row=splitRow(i);
  if(row){
    var num=row.querySelector('.split-part'); if(num&&splitNum(num.value)!==x) num.value=String(x);
    var r=row.querySelector('.split-range'), rv=String(Math.min(splitEchelle(),x)); if(r&&r.value!==rv) r.value=rv;
  }
  splitTotalCheck();
}
// Champ au centième modifié : le curseur suit (borné à son échelle ; la valeur réelle reste celle du champ).
function splitSyncCurseur(i){
  var row=splitRow(i); if(!row||!_splitBdt) return;
  var r=row.querySelector('.split-range'); if(!r) return;
  var x=splitNum(_splitBdt.vals[i]); r.value=String((isFinite(x)&&x>0)?Math.min(splitEchelle(),x):0);
}
// Pré-remplissage : la moitié de la RÉALISATION (durée moins réglage) ; le 2ᵉ morceau prend le reste.
// Jamais par-dessus une saisie de l utilisateur (relecture du réglage, bouton « Utiliser … »).
function splitPrefill(cur){
  if(cur.valsTouchees) return;
  var R=splitReglageVal(); if(!isFinite(R)) R=0;
  var V=Math.max(0,splitR2(cur.total-R));
  var h1=V>0?splitR2(V/2):0, h2=V>0?splitR2(V-h1):0;
  cur.vals=[V>0?String(h1):'',V>0?String(h2):''];
}
function splitBdt(id){
  var bdt=BDTS.find(function(b){return String(b.id)===String(id);}); if(!bdt) return;
  if(!enGoulotte(bdt)){ pushNotif('warn','fa-exclamation-triangle','Seul un BDT de la goulotte se découpe : déprogrammez-le d’abord.'); return; }
  splitWire();
  var cur={id:bdt.id,operation:bdt.operation,piece:bdt.piece,total:splitDureeOf(bdt),vals:['',''],busy:false,loading:true,
    reglage:null,reglageConnu:false,reglageSaisi:'',source:'',confiance:'',raison:'',erreurTemps:'',famille:[],
    tempsLus:false,saisiePossible:true,propose:null,porteur:''};
  _splitBdt=cur;
  var rg=document.getElementById('splitReglage'); if(rg) rg.value='';
  splitRecap(); splitRender();
  document.getElementById('splitModal').style.display='flex';
  splitLireTemps(cur);
}
// Lecture du réglage (GET /temps). Relancée par « Relire le réglage » après un échec : tant qu elle n a pas abouti, la
// découpe n est permise que si l utilisateur saisit lui-même le réglage (sinon le serveur appliquerait un réglage que
// l écran n a pas vu, et le temps alloué augmenterait d autant).
function splitLireTemps(cur){
  cur.loading=true; cur.erreurTemps=''; splitRecap(); splitRender();
  fetch('/api/production/bdt/'+encodeURIComponent(cur.id)+'/temps')
    .then(function(r){ return r.json().catch(function(){ return {ok:false,error:'Réponse inattendue du serveur (HTTP '+r.status+').'}; }); })
    .then(function(j){ if(_splitBdt!==cur) return; splitTempsLus(cur,j); })
    .catch(function(){ if(_splitBdt!==cur) return; splitTempsLus(cur,{ok:false,error:'Erreur réseau : réglage non lu.'}); });
}
function splitRelire(){ if(_splitBdt&&!_splitBdt.loading&&!_splitBdt.busy) splitLireTemps(_splitBdt); }
function splitTempsLus(cur,j){
  cur.loading=false;
  if(!j||!j.ok){ cur.erreurTemps=(j&&j.error)||'Lecture du réglage impossible.'; }
  else {
    cur.erreurTemps=''; cur.tempsLus=true;
    var d=Number(j.duree); if(isFinite(d)&&d>=0) cur.total=d;   // la base fait foi (la page peut dater)
    cur.source=j.source||''; cur.confiance=j.confiance||''; cur.raison=j.raison||''; cur.famille=Array.isArray(j.famille)?j.famille:[];
    cur.saisiePossible=(j.saisie_possible!==false); cur.porteur=j.porteur||'';
    cur.reglageConnu=false; cur.reglage=null;
    if(j.reglage!=null&&j.confiance==='certain'){ cur.reglageConnu=true; cur.reglage=Number(j.reglage)||0; }
    // Réglage INCERTAIN proposé par la gamme : jamais pré-saisi (il serait enregistré comme un fait sans que personne
    // l ait confirmé) — un bouton « Utiliser … » le recopie dans le champ, sur décision de l utilisateur.
    cur.propose=(!cur.reglageConnu&&cur.saisiePossible&&j.propose!=null&&isFinite(Number(j.propose)))?splitR2(j.propose):null;
    if(!cur.saisiePossible) cur.reglageSaisi='';
  }
  var rg=document.getElementById('splitReglage');
  if(rg) rg.value=cur.reglageConnu?String(splitR2(cur.reglage)):cur.reglageSaisi;
  splitPrefill(cur); splitRecap(); splitRender();
  var first=document.querySelector('#splitParts .split-range'); if(first){ try{ first.focus(); }catch(e){} }
}
function splitUtiliserPropose(){
  var cur=_splitBdt; if(!cur||cur.reglageConnu||cur.propose==null||cur.loading) return;
  cur.reglageSaisi=String(cur.propose);
  var rg=document.getElementById('splitReglage'); if(rg) rg.value=cur.reglageSaisi;
  splitPrefill(cur); splitRecap(); splitRender();
}
// Réglage saisi plus long que le BDT : refusé (le serveur répond 400), comme à la création manuelle.
function splitReglageTropGrand(){ var cur=_splitBdt; if(!cur||cur.reglageConnu) return false; var R=splitReglageVal(); return isFinite(R)&&R>splitR2(cur.total)+0.005; }
// Récapitulatif (durée = réglage + réalisation), champ réglage verrouillé ou non, rappel de famille.
function splitRecap(){
  var cur=_splitBdt; if(!cur) return;
  var R=splitReglageVal(), okR=isFinite(R), V=okR?Math.max(0,splitR2(cur.total-R)):0;
  var decomp;
  if(cur.loading) decomp='<span style="color:#64748b;"><i class="fas fa-spinner fa-spin" style="margin-right:5px;"></i>Lecture du réglage…</span>';
  else if(!okR) decomp='<span style="color:#b91c1c;">Réglage saisi invalide</span>';
  else decomp='<strong>'+splitFmtH(cur.total)+' h</strong> = Réglage <strong>'+splitFmtH(R)+' h</strong> <span style="color:#64748b;">(fixe, une seule fois, reste sur le morceau 1)</span> + Réalisation <strong>'+splitFmtH(V)+' h</strong>';
  var info=document.getElementById('splitInfo');
  if(info) info.innerHTML='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:.78rem;">'
    +'<div><span style="color:#94a3b8;">BDT : </span><strong>'+splitEsc(cur.id)+'</strong></div>'
    +'<div><span style="color:#94a3b8;">Opération : </span>'+splitEsc(cur.operation||'—')+'</div>'
    +'<div><span style="color:#94a3b8;">Pièce : </span>'+splitEsc(cur.piece||'—')+'</div>'
    +'</div>'
    +'<div style="margin-top:8px;font-size:.8rem;color:#1e293b;"><span style="color:#94a3b8;">Durée : </span>'+decomp+'</div>';
  var rg=document.getElementById('splitReglage'), aide=document.getElementById('splitReglageAide');
  var verrou=cur.loading||cur.reglageConnu||cur.saisiePossible===false;
  if(rg){ rg.readOnly=verrou; rg.style.background=verrou?'#e2e8f0':'white'; rg.style.color=verrou?'#475569':'#1e293b'; rg.style.cursor=verrou?'not-allowed':'text'; }
  if(aide){
    var t, BTN='border:1px solid #c4b5fd;background:#f5f3ff;color:#6d28d9;border-radius:6px;padding:1px 7px;font-size:.7rem;font-weight:700;cursor:pointer;margin-left:4px;';
    if(cur.loading) t='';
    else if(cur.reglageConnu&&cur.source==='famille') t='<i class="fas fa-lock" style="margin-right:4px;"></i>Réglage de l’étape déjà porté par '+splitEsc(cur.porteur||'un autre morceau')+' (fait une seule fois) : ce morceau ne porte que de la réalisation.';
    else if(cur.reglageConnu) t='<i class="fas fa-lock" style="margin-right:4px;"></i>'+(cur.source==='gamme'?'Retrouvé depuis la gamme':'Enregistré sur le BDT')+' : non découpable, il reste sur le morceau 1.';
    else if(cur.erreurTemps) t='<span style="color:#b91c1c;"><i class="fas fa-triangle-exclamation" style="margin-right:4px;"></i>'+splitEsc(cur.erreurTemps)+'</span> <button type="button" onclick="splitRelire()" style="'+BTN+'"><i class="fas fa-rotate-right" style="margin-right:3px;"></i>Relire le réglage</button> — ou saisissez-le si vous le connaissez.';
    else if(cur.saisiePossible===false) t='<i class="fas fa-lock" style="margin-right:4px;"></i>Réglage non renseigné : il se renseigne sur le BDT d’origine (morceau 1). Ce morceau ne porte que de la réalisation.';
    else t='<span style="color:#b45309;"><i class="fas fa-circle-question" style="margin-right:4px;"></i>Réglage non renseigné'+(cur.raison?' ('+splitEsc(cur.raison)+')':'')+'.</span> Saisissez-le ; vide = tout le temps est traité en réalisation.'
      +(cur.propose!=null?' <span style="color:#64748b;">La gamme donne '+splitFmtH(cur.propose)+' h, sans certitude :</span><button type="button" onclick="splitUtiliserPropose()" style="'+BTN+'">Utiliser '+splitFmtH(cur.propose)+' h</button>':'');
    aide.innerHTML=t;
  }
  var rap=document.getElementById('splitRappel');
  if(rap){
    var fam=cur.famille||[];
    if(fam.length>=2){
      rap.innerHTML='<i class="fas fa-rotate-left" style="margin-right:5px;"></i>Ce BDT fait déjà partie d’une découpe ('+fam.length+' morceaux : '+fam.map(function(m){ return 'M'+splitEsc(m.rang); }).join(', ')+'). Tant qu’aucun morceau n’est posé ni reçu, « Annuler la découpe » sur une carte de la goulotte les recolle.';
      rap.style.display='block';
    } else { rap.innerHTML=''; rap.style.display='none'; }
  }
}
// Une ligne par morceau : pastille de couleur (celle de son segment dans la jauge), curseur 0 → échelle,
// champ au centième, part de V en %, corbeille. Pourcentage / état / aria-valuetext : posés par splitTotalCheck.
function splitRender(){
  if(!_splitBdt) return;
  var cur=_splitBdt, vals=cur.vals, n=vals.length, lock=n<=SPLIT_MIN, html='';
  var E=splitEchelle(), dis=cur.loading?' disabled':'';
  for(var i=0;i<n;i++){
    var c=splitCouleur(i), x=splitNum(vals[i]), xr=(isFinite(x)&&x>0)?Math.min(E,x):0;
    html+='<div class="split-row" data-i="'+i+'" style="display:flex;align-items:center;gap:6px 10px;flex-wrap:wrap;padding:7px 10px;border:1px solid #e2e8f0;border-left:5px solid '+c+';border-radius:10px;background:#fff;">'
      +'<label for="splitRange'+i+'" style="display:flex;align-items:center;gap:6px;min-width:104px;font-size:.76rem;font-weight:700;color:#334155;cursor:pointer;">'
      +'<span aria-hidden="true" style="width:20px;height:20px;border-radius:6px;background:'+c+';color:#fff;font-size:.68rem;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex:none;">'+(i+1)+'</span>Morceau '+(i+1)+'</label>'
      +'<input type="range" id="splitRange'+i+'" class="split-range" data-i="'+i+'" min="0" max="'+E+'" step="0.01" value="'+xr+'" aria-label="Temps de réalisation du morceau '+(i+1)+', de 0 à '+splitFmtH(E)+' h"'+dis+' style="flex:1 1 170px;min-width:130px;accent-color:'+c+';"/>'
      +'<span style="display:inline-flex;align-items:center;gap:4px;"><input type="number" class="split-part" data-i="'+i+'" step="0.01" min="0" inputmode="decimal" placeholder="0" value="'+splitEsc(vals[i])+'" aria-label="Morceau '+(i+1)+' : réalisation en heures, au centième"'+dis+' style="width:82px;border:1.5px solid #e2e8f0;border-radius:8px;padding:5px 8px;font-size:.8rem;font-variant-numeric:tabular-nums;"/><span style="font-size:.72rem;color:#64748b;">h</span></span>'
      +'<span class="split-pct" data-i="'+i+'" title="Part du temps de réalisation à répartir" style="min-width:48px;text-align:right;font-size:.74rem;font-weight:700;color:#475569;font-variant-numeric:tabular-nums;"></span>'
      +'<button type="button" class="split-del" data-i="'+i+'"'+(lock?' disabled':'')+' aria-label="'+(lock?'Il faut au moins 2 morceaux':'Retirer le morceau '+(i+1))+'" title="'+(lock?'Il faut au moins 2 morceaux':'Retirer ce morceau (les autres gardent leur temps)')+'" style="background:#fff1f2;color:#be123c;border:1px solid #fecdd3;border-radius:7px;padding:5px 8px;font-size:.72rem;cursor:'+(lock?'not-allowed':'pointer')+';opacity:'+(lock?'.4':'1')+';"><i class="fas fa-trash-can" aria-hidden="true"></i></button>'
      +'<div class="split-note" data-i="'+i+'" style="flex-basis:100%;font-size:.7rem;display:none;"></div>'
      +'</div>';
  }
  document.getElementById('splitParts').innerHTML=html;
  var add=document.getElementById('splitAddBtn');
  if(add){ var full=n>=SPLIT_MAX; add.disabled=full||cur.loading; add.style.opacity=(full||cur.loading)?'.45':'1'; add.style.cursor=(full||cur.loading)?'not-allowed':'pointer'; add.title=full?'12 morceaux au maximum':''; }
  splitTotalCheck();
}
// Ajouter / retirer une ligne ne touche PAS aux temps déjà alloués (conservés dans _splitBdt.vals).
// Le nouveau morceau reçoit le reste à répartir s il y en a un, sinon rien (à allouer au curseur).
function splitAdd(){
  if(!_splitBdt||_splitBdt.loading||_splitBdt.vals.length>=SPLIT_MAX) return;
  var reste=splitR2(splitV()-splitSommeSauf(-1));
  _splitBdt.vals.push(reste>0?String(reste):''); _splitBdt.valsTouchees=true; splitRender();
  var ins=document.querySelectorAll('#splitParts .split-range'); var last=ins[ins.length-1]; if(last){ try{ last.focus(); }catch(e){} }
}
function splitRemove(i){
  if(!_splitBdt||_splitBdt.vals.length<=SPLIT_MIN||!(i>=0&&i<_splitBdt.vals.length)) return;
  _splitBdt.vals.splice(i,1); _splitBdt.valsTouchees=true; splitRender();
  var ins=document.querySelectorAll('#splitParts .split-range'); var f=ins[Math.min(i,ins.length-1)]; if(f){ try{ f.focus(); }catch(e){} }
}
// « Répartir également » : V en parts égales au centième (calcul en centièmes entiers), le dernier prend le reste.
function splitRepartirEgal(){
  var cur=_splitBdt; if(!cur||cur.loading||cur.busy) return;
  var n=cur.vals.length, Vc=Math.round(splitV()*100); if(!(Vc>0)||n<1) return;
  var pc=Math.floor(Vc/n), vals=[];
  for(var i=0;i<n-1;i++) vals.push(String(pc/100));
  vals.push(String((Vc-pc*(n-1))/100));
  cur.vals=vals; cur.valsTouchees=true; splitRender();
}
// « Mettre le reste sur le dernier morceau » : le dernier prend exactement ce qui complète V (réduit s il y a dépassement).
function splitResteDernier(){
  var cur=_splitBdt; if(!cur||cur.loading||cur.busy) return;
  var n=cur.vals.length; if(n<1) return;
  var cible=splitR2(splitV()-splitSommeSauf(n-1));
  if(!(cible>0)){ pushNotif('warn','fa-exclamation-triangle','Les autres morceaux prennent déjà tout le temps prévu : réduisez-les d’abord.'); return; }
  splitPoser(n-1,cible);
}
function splitPartsRead(){ return _splitBdt?_splitBdt.vals.map(splitNum):[]; }
// Jauge : tout le temps de réalisation V ; un segment par morceau (proportionnel), reste en gris, dépassement en orange
// (l échelle devient alors la somme allouée et un repère marque V). Le réglage est à part : bloc hachuré, fixe.
function splitJauge(parts,V,Rn,okR){
  var el=document.getElementById('splitJauge'), cur=_splitBdt; if(!el||!cur) return;
  if(cur.loading){ el.innerHTML='<div style="font-size:.76rem;color:#64748b;padding:6px 0;"><i class="fas fa-spinner fa-spin" style="margin-right:5px;"></i>Lecture du réglage…</div>'; return; }
  var cents=parts.map(function(x){ return (isFinite(x)&&x>0)?Math.round(x*100):0; });
  var Sc=0; cents.forEach(function(c){ Sc+=c; });
  var Vc=Math.round(V*100), Ec=Math.max(Vc,Sc), resteC=Vc-Sc;
  var etat='', etatTxt='';
  if(Vc===0&&Sc===0){ etatTxt='aucun temps de réalisation à répartir'; }
  else if(resteC>0){ etatTxt='reste à répartir '+splitFmtH(resteC/100)+' h'; etat='<span style="color:#334155;font-weight:700;"><i class="fas fa-hourglass-half" aria-hidden="true" style="margin-right:4px;color:#64748b;"></i>'+etatTxt+'</span>'; }
  else if(resteC<0){ etatTxt='+'+splitFmtH(-resteC/100)+' h au-delà du temps prévu'; etat='<span style="color:#c2410c;font-weight:800;"><i class="fas fa-triangle-exclamation" aria-hidden="true" style="margin-right:4px;"></i>'+etatTxt+'</span>'; }
  else { etatTxt='tout le temps est réparti'; etat='<span style="color:#15803d;font-weight:800;"><i class="fas fa-circle-check" aria-hidden="true" style="margin-right:4px;"></i>'+etatTxt+'</span>'; }
  var seg='', lu=[];
  if(Ec===0){
    seg='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:.74rem;color:#475569;font-style:italic;">aucun temps de réalisation à répartir</div>';
  } else {
    cents.forEach(function(c,i){
      if(c<=0) return;
      var w=c/Ec*100, h=splitFmtH(c/100);
      lu.push('morceau '+(i+1)+' '+h+' h');
      seg+='<div title="Morceau '+(i+1)+' : '+h+' h" style="width:'+w+'%;flex:none;min-width:0;background:'+splitCouleur(i)+';color:#fff;font-size:.7rem;font-weight:800;display:flex;align-items:center;justify-content:center;overflow:hidden;white-space:nowrap;box-shadow:inset -2px 0 0 #fff;text-shadow:0 0 3px rgba(0,0,0,.55);"><span style="position:relative;z-index:2;">'+(w>=14?(i+1)+' · '+h+' h':(w>=4?String(i+1):''))+'</span></div>';
    });
    if(resteC>0){
      var wr=resteC/Ec*100, hr=splitFmtH(resteC/100);
      seg+='<div title="Reste à répartir : '+hr+' h" style="flex:1;min-width:0;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:700;color:#334155;white-space:nowrap;overflow:hidden;">'+(wr>=30?'reste à répartir '+hr+' h':(wr>=9?hr+' h':''))+'</div>';
    }
    if(resteC<0){
      var g=Vc/Ec*100, hd=splitFmtH(-resteC/100);
      // Rayures orange SUR les segments (les morceaux restent visibles dessous) + repère foncé à V.
      seg+='<div title="Au-delà du temps prévu : +'+hd+' h" style="position:absolute;top:0;bottom:0;left:'+g+'%;right:0;pointer-events:none;background:repeating-linear-gradient(135deg,rgba(234,88,12,.9) 0 4px,rgba(234,88,12,.12) 4px 10px);border-left:3px solid #7c2d12;box-shadow:inset 0 -5px 0 #ea580c,inset 0 5px 0 #ea580c;"></div>';
    }
  }
  var graduation='';
  if(Ec>0){
    if(resteC<0){
      var gp=Vc/Ec*100, pos=Math.min(90,Math.max(10,gp));
      graduation=(gp>=18?'<span style="position:absolute;left:0;">0 h</span>':'')
        +'<span style="position:absolute;left:'+pos+'%;transform:translateX(-50%);color:#9a3412;font-weight:700;white-space:nowrap;">▲ prévu '+splitFmtH(V)+' h</span>'
        +(gp<=78?'<span style="position:absolute;right:0;color:#9a3412;">'+splitFmtH(Sc/100)+' h</span>':'');
    } else graduation='<span style="position:absolute;left:0;">0 h</span><span style="position:absolute;right:0;">'+splitFmtH(V)+' h</span>';
  }
  var reg=(okR&&Rn>0)?'<div title="Réglage fixe, fait une seule fois : il reste sur le morceau 1 et ne se répartit pas" style="flex:none;display:flex;align-items:center;height:34px;padding:0 8px;border-radius:8px;border:1px dashed #64748b;background:repeating-linear-gradient(135deg,#f1f5f9 0 6px,#cbd5e1 6px 12px);">'
    +'<span style="background:rgba(255,255,255,.85);border-radius:5px;padding:2px 7px;color:#1e293b;font-size:.72rem;font-weight:800;white-space:nowrap;"><i class="fas fa-lock" aria-hidden="true" style="margin-right:5px;color:#475569;"></i>Réglage '+splitFmtH(Rn)+' h · morceau 1</span></div>':'';
  var aria='Temps de réalisation à répartir '+splitFmtH(V)+' h'+(lu.length?' ; '+lu.join(', '):'')+' ; '+etatTxt+(reg?' ; réglage fixe '+splitFmtH(Rn)+' h sur le morceau 1, à part':'');
  el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:baseline;gap:4px 10px;flex-wrap:wrap;margin-bottom:7px;">'
      +'<div style="font-size:.8rem;color:#1e293b;"><i class="fas fa-gauge-high" aria-hidden="true" style="margin-right:6px;color:#6d28d9;"></i>Temps de réalisation à répartir : <strong style="font-size:.92rem;">'+splitFmtH(V)+' h</strong></div>'
      +'<div style="font-size:.76rem;">'+etat+'</div></div>'
    +'<div style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;">'+reg
      +'<div style="flex:1 1 260px;min-width:0;">'
        +'<div role="img" aria-label="'+aria+'" style="position:relative;height:34px;border-radius:8px;background:#e2e8f0;box-shadow:inset 0 0 0 1px #cbd5e1;overflow:hidden;display:flex;">'+seg+'</div>'
        +'<div aria-hidden="true" style="position:relative;height:14px;margin-top:3px;font-size:.64rem;color:#64748b;">'+graduation+'</div>'
      +'</div>'
    +'</div>';
}
function splitTotalCheck(){
  if(!_splitBdt) return;
  var cur=_splitBdt;
  var parts=splitPartsRead();
  var R=splitReglageVal(), okR=isFinite(R);
  var okParts=parts.length>=SPLIT_MIN&&parts.length<=SPLIT_MAX&&parts.every(function(x,i){ return splitValidAt(x,i); });
  // Réglage non lu (échec de GET /temps) et rien saisi : on ne découpe pas à l aveugle (le serveur appliquerait le réglage
  // stocké en plus des réalisations saisies : 10 h devenaient 12 h).
  var sansLecture=!!cur.erreurTemps&&!cur.reglageConnu&&String(cur.reglageSaisi==null?'':cur.reglageSaisi).trim()==='';
  var tropGrand=splitReglageTropGrand();
  var ok=!cur.loading&&okR&&okParts&&!sansLecture&&!tropGrand;
  var sumV=splitSommeSauf(-1);
  var Rn=okR?R:0;
  var V=Math.max(0,splitR2(cur.total-Rn));
  var diff=splitR2(sumV-V);
  splitJauge(parts,V,Rn,okR);
  // Lignes : part de V en %, texte lu par les lecteurs d écran, état du morceau (sans réécrire le champ en cours de saisie).
  for(var i=0;i<parts.length;i++){
    var row=splitRow(i); if(!row) continue;
    var x=parts[i], valide=cur.loading||splitValidAt(x,i), connu=isFinite(x)&&x>=0;
    var pc=(V>0&&connu)?Math.round(x/V*100):null;
    var pct=row.querySelector('.split-pct'), rng=row.querySelector('.split-range'), num=row.querySelector('.split-part'), note=row.querySelector('.split-note');
    if(pct) pct.textContent=pc===null?'— %':pc+' %';
    if(rng) rng.setAttribute('aria-valuetext',connu?splitFmtH(splitR2(x))+' h'+(pc===null?'':', soit '+pc+' % du temps de réalisation'):'non renseigné');
    if(num){ num.style.borderColor=valide?'#e2e8f0':'#f59e0b'; num.style.background=valide?'white':'#fffbeb'; num.setAttribute('aria-invalid',valide?'false':'true'); }
    if(note){
      var t='';
      if(!valide) t='<span style="color:#b45309;"><i class="fas fa-circle-exclamation" aria-hidden="true" style="margin-right:4px;"></i>'+(!isFinite(x)?'Temps à allouer : glissez le curseur ou saisissez une valeur.':(x<0?'Le temps ne peut pas être négatif.':'Un morceau sans temps ne se découpe pas : glissez le curseur ou retirez ce morceau.'))+'</span>';
      else if(i===0&&Rn>0&&connu&&!cur.loading) t='<span style="color:#6d28d9;"><i class="fas fa-lock" aria-hidden="true" style="margin-right:4px;"></i>Porte aussi le réglage ('+splitFmtH(Rn)+' h) : soit '+splitFmtH(splitR2(Rn+splitR2(x)))+' h au total.</span>';
      note.innerHTML=t; note.style.display=t?'block':'none';
    }
  }
  // Aides : désactivées quand elles ne changeraient rien.
  var eg=document.getElementById('splitEgalBtn'), rs=document.getElementById('splitResteBtn');
  if(eg){ eg.disabled=cur.loading||cur.busy||!(V>0); eg.title=(V>0)?'Partager '+splitFmtH(V)+' h en '+parts.length+' parts égales':'Aucun temps de réalisation à répartir'; }
  if(rs&&parts.length){
    var nD=parts.length, cible=splitR2(V-splitSommeSauf(nD-1)), dern=parts[nD-1], deja=isFinite(dern)&&splitR2(dern)===cible;
    rs.disabled=cur.loading||cur.busy||!(cible>0)||deja;
    rs.title=!(cible>0)?'Les autres morceaux prennent déjà tout le temps prévu':(deja?'Le temps prévu est déjà entièrement réparti':'Le morceau '+nD+' prendra '+splitFmtH(cible)+' h');
  }
  var cmp, colCmp;
  if(V===0&&sumV===0){ cmp='aucun temps de réalisation à répartir'; colCmp='#64748b'; }
  else if(diff===0){ cmp='tout le temps de réalisation prévu est réparti'; colCmp='#15803d'; }
  else if(diff<0){ cmp='reste '+splitFmtH(-diff)+' h à répartir'; colCmp='#475569'; }
  else { cmp='+'+splitFmtH(diff)+' h au-delà du temps prévu'; colCmp='#c2410c'; }
  var el=document.getElementById('splitTotal'), btn=document.getElementById('splitConfirmBtn');
  var msg='';
  if(cur.loading) msg='';
  else if(!okR) msg='Le réglage saisi doit être un nombre d’heures positif ou nul.';
  else if(sansLecture) msg='Réglage non lu : relisez-le, ou saisissez-le, avant de découper.';
  else if(tropGrand) msg='Le réglage ('+splitFmtH(R)+' h) ne peut pas dépasser la durée du BDT ('+splitFmtH(cur.total)+' h).';
  else if(!okParts) msg=Rn>0?'Allouez du temps à chaque morceau : supérieur à 0, sauf le morceau 1 qui peut ne porter que le réglage (0).':'Allouez un temps supérieur à 0 à chaque morceau.';
  if(el) el.innerHTML=cur.loading?'':'<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;"><span style="font-weight:800;color:#1e293b;">Réalisation répartie : '+splitFmtH(sumV)+' h sur '+splitFmtH(V)+' h</span><span style="color:'+colCmp+';font-size:.74rem;font-weight:700;">('+cmp+')</span></div>'
    +'<div style="margin-top:3px;font-size:.76rem;color:#475569;">Temps alloué total : <strong>'+splitFmtH(splitR2(Rn+sumV))+' h</strong> <span style="color:#64748b;">(réglage '+splitFmtH(Rn)+' h + réalisation '+splitFmtH(sumV)+' h)</span></div>'
    +((ok&&diff!==0)?'<div style="margin-top:4px;color:#475569;font-size:.72rem;"><i class="fas fa-circle-info" aria-hidden="true" style="margin-right:4px;"></i>Le temps réparti diffère du temps prévu : « Découper » demandera une confirmation.</div>':'')
    +(msg?'<div style="margin-top:4px;color:#b45309;font-size:.72rem;"><i class="fas fa-triangle-exclamation" aria-hidden="true" style="margin-right:4px;"></i>'+msg+'</div>':'');
  if(btn){ var dis=!ok||cur.busy; btn.disabled=dis; btn.style.opacity=dis?'.5':'1'; btn.style.cursor=dis?'not-allowed':'pointer'; }
}
// « Découper » : somme ≠ V → confirmation (appConfirm) ; somme = V → envoi direct. Contrat de /separer inchangé.
function splitSave(){
  var cur=_splitBdt;
  if(!cur||cur.busy||cur.loading||cur.confirmation) return;
  if(!splitPretAEnvoyer()) return;
  var R=splitReglageVal(), V=Math.max(0,splitR2(cur.total-R)), sumV=splitSommeSauf(-1);
  if(splitR2(sumV-V)!==0){
    cur.confirmation=true;
    appConfirm('Le temps réparti ('+splitFmtH(sumV)+' h) diffère du temps de réalisation prévu ('+splitFmtH(V)+' h) : découper quand même ?',{title:'Temps réparti différent du temps prévu',okLabel:'Découper quand même',icon:'fa-scale-unbalanced',danger:false})
      .then(function(oui){ cur.confirmation=false; if(oui&&_splitBdt===cur&&!cur.busy&&!cur.loading&&splitPretAEnvoyer()) splitEnvoyer(cur); });
    return;
  }
  splitEnvoyer(cur);
}
// Contrôles avant envoi (mêmes règles que le bouton) : un message et false si la découpe n est pas possible.
function splitPretAEnvoyer(){
  if(!_splitBdt) return false;
  var parts=splitPartsRead();
  var R=splitReglageVal();
  if(!isFinite(R)){ pushNotif('err','fa-ban','Réglage invalide : nombre d’heures positif ou nul.'); return false; }
  if(splitReglageTropGrand()){ pushNotif('err','fa-ban','Le réglage ne peut pas dépasser la durée du BDT.'); return false; }
  if(_splitBdt.erreurTemps&&!_splitBdt.reglageConnu&&String(_splitBdt.reglageSaisi==null?'':_splitBdt.reglageSaisi).trim()===''){ pushNotif('err','fa-ban','Réglage non lu : relisez-le, ou saisissez-le, avant de découper.'); return false; }
  if(parts.length<SPLIT_MIN||parts.length>SPLIT_MAX||!parts.every(function(x,i){ return splitValidAt(x,i); })){ pushNotif('err','fa-ban','Chaque morceau doit avoir une réalisation supérieure à 0 (le morceau 1 peut valoir 0 s’il porte le réglage).'); return false; }
  return true;
}
function splitEnvoyer(cur){
  var parts=splitPartsRead();
  var R=splitReglageVal();
  cur.busy=true; splitTotalCheck();
  // duree_lue / nb_membres : le serveur refuse (409 « page périmée ») si ce BDT ou sa découpe ont changé depuis la lecture.
  var body={realisation:parts.map(splitR2), duree_lue:splitR2(cur.total)};
  if(cur.tempsLus) body.nb_membres=Math.max(1,(cur.famille||[]).length);
  // Réglage connu : renvoyé tel quel (le serveur refuse s il a changé entre-temps) ; inconnu : la saisie, si elle existe.
  if(cur.reglageConnu) body.reglage=splitR2(cur.reglage);
  else if(cur.saisiePossible!==false&&String(cur.reglageSaisi==null?'':cur.reglageSaisi).trim()!=='') body.reglage=R;
  var url='/api/production/bdt/'+encodeURIComponent(cur.id)+'/separer';
  fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    .then(function(r){ return r.json().catch(function(){ return {ok:false,error:'Réponse inattendue du serveur (HTTP '+r.status+').'}; }); })
    .then(function(j){
      if(j&&j.ok){
        closeModal('splitModal'); _splitBdt=null;
        var txt='BDT découpé en '+j.count+' morceaux — '+(j.reglage!=null?'réglage '+splitFmtH(j.reglage)+' h sur le morceau 1 · ':'')+'réalisation répartie '+splitFmtH(j.realisation_apres)+' h · total alloué '+splitFmtH(j.total_apres)+' h';
        pushNotif('ok','fa-scissors',splitEsc(txt),5000);
        if(j.avertissement) pushNotif('warn','fa-exclamation-triangle',splitEsc(j.avertissement),8000);
        setTimeout(function(){ softReload(); },700);
      }
      else { cur.busy=false; if(_splitBdt===cur) splitTotalCheck(); pushNotif('err','fa-ban',splitEsc((j&&j.error)||'Découpe échouée.'),6000); }
    }).catch(function(){ cur.busy=false; if(_splitBdt===cur) splitTotalCheck(); pushNotif('err','fa-times','Erreur réseau.',4000); });
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
