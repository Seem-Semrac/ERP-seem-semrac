// ══════════════════════════════════════════════════════════════
// AFFECTATION BDT – GANTT + SOLDAGE + COMPÉTENCES + HORAIRES RH
// Conforme cahier des charges §4.8, §4.18
// ══════════════════════════════════════════════════════════════

// ─── DONNÉES PARTAGÉES ────────────────────────────────────────
export const OPS_SEMRAC = ['Poinçonnage / Laser','Ébavurage','Pliage','Montage','Soudure','Fraisage / Taraudage','Ponçage','Sérigraphie','Emballage']
export const OPS_SEEM   = ['Tronçonnage','Usinage','Ébavurage','Thermocollage','Oxydation anodique sulfurique','Emballage']
export const OPS_ST     = ['Oxydation anodique sulfurique','Sérigraphie','Traitement thermique','Zingage','Peinture poudre','Brunissage','Découpe jet d\'eau']

export const OPERATEURS = [
  { id:'op1', nom:'Antoine D.',   activite:'Seem',   poste:'Usinage CN1',    shift:'matin',    competences:['Tronçonnage','Usinage','Ébavurage'],                                     niveaux:{} },
  { id:'op2', nom:'Karim B.',     activite:'Seem',   poste:'Usinage CN2',    shift:'matin',    competences:['Usinage','Ébavurage','Emballage'],                                       niveaux:{} },
  { id:'op3', nom:'Isabelle R.',  activite:'Seem',   poste:'Contrôle',       shift:'journee',  competences:['Thermocollage','Oxydation anodique sulfurique','Emballage'],             niveaux:{} },
  { id:'op4', nom:'Marc T.',      activite:'Semrac', poste:'Presse / Laser', shift:'matin',    competences:['Poinçonnage / Laser','Ébavurage','Pliage'],                             niveaux:{} },
  { id:'op5', nom:'Sophie L.',    activite:'Semrac', poste:'Pliage',         shift:'matin',    competences:['Pliage','Montage','Ébavurage'],                                          niveaux:{} },
  { id:'op6', nom:'Julien M.',    activite:'Semrac', poste:'Soudure',        shift:'apmidi',   competences:['Soudure','Montage','Fraisage / Taraudage'],                              niveaux:{} },
  { id:'op7', nom:'Nadia K.',     activite:'Semrac', poste:'Montage',        shift:'apmidi',   competences:['Montage','Ponçage','Sérigraphie','Emballage'],                           niveaux:{} },
  { id:'op8', nom:'Frédéric G.',  activite:'Seem',   poste:'Tour CNC',       shift:'matin',    competences:['Tronçonnage','Usinage','Fraisage / Taraudage'],                          niveaux:{} },
  { id:'op9', nom:'Laura P.',     activite:'Semrac', poste:'Sérigraphie',    shift:'journee',  competences:['Sérigraphie','Emballage','Ponçage'],                                     niveaux:{} },
]

export const SHIFTS: Record<string,{label:string;start:number;end:number;color:string;icon:string}> = {
  matin:   { label:'Matin',       start:6,  end:14, color:'#3b82f6', icon:'fa-sun' },
  apmidi:  { label:'Après-midi',  start:14, end:22, color:'#8b5cf6', icon:'fa-cloud-sun' },
  soir:    { label:'Soirée/Nuit', start:22, end:30, color:'#1e293b', icon:'fa-moon' },
  journee: { label:'Journée',     start:7,  end:17, color:'#10b981', icon:'fa-briefcase' },
}

export const ABSENCES: Record<string,{type:string;dates:string[]}> = {
  op3: { type:'Congé payé',  dates:['2026-03-10','2026-03-11','2026-03-12'] },
  op6: { type:'Maladie',     dates:['2026-03-10'] },
}

export const BDT_INITIAL = [
  { id:'BDT-091', op:'op1', cmd:'CMD-081', client:'Legrand',   piece:'DISSIP-A24', operation:'Usinage',                   duree:2.5, debut:6,   priorite:'urgent',   statut:'recu',      activite:'Seem',   tempsAlloue:2.5, debutReel:'06:00', finReel:null },
  { id:'BDT-092', op:'op2', cmd:'CMD-082', client:'Bosch',     piece:'DISSIP-B11', operation:'Ébavurage',                 duree:1.5, debut:6,   priorite:'normal',   statut:'programme', activite:'Seem',   tempsAlloue:1.5, debutReel:null,    finReel:null },
  { id:'BDT-093', op:'op4', cmd:'CMD-083', client:'Valeo',     piece:'TOLE-C07',   operation:'Poinçonnage / Laser',       duree:3.0, debut:6,   priorite:'critique', statut:'recu',      activite:'Semrac', tempsAlloue:3.0, debutReel:'06:00', finReel:null },
  { id:'BDT-094', op:'op5', cmd:'CMD-084', client:'Faurecia',  piece:'SUPPORT-D4', operation:'Pliage',                   duree:2.0, debut:6,   priorite:'normal',   statut:'programme', activite:'Semrac', tempsAlloue:2.0, debutReel:null,    finReel:null },
  { id:'BDT-095', op:'op1', cmd:'CMD-085', client:'Schneider', piece:'DISSIP-E11', operation:'Tronçonnage',               duree:1.0, debut:8.5, priorite:'normal',   statut:'solde',     activite:'Seem',   tempsAlloue:1.0, debutReel:'08:30', finReel:'09:45', tempsReel:1.25 },
  { id:'BDT-096', op:'op4', cmd:'CMD-086', client:'Renault',   piece:'TOLE-F03',   operation:'Pliage',                   duree:2.0, debut:9,   priorite:'urgent',   statut:'programme', activite:'Semrac', tempsAlloue:2.0, debutReel:null,    finReel:null },
  { id:'BDT-097', op:'op6', cmd:'CMD-087', client:'Legrand',   piece:'CHASSIS-G2', operation:'Soudure',                  duree:4.0, debut:14,  priorite:'normal',   statut:'programme', activite:'Semrac', tempsAlloue:4.0, debutReel:null,    finReel:null },
  { id:'BDT-098', op:'op7', cmd:'CMD-088', client:'Valeo',     piece:'SUPPORT-H1', operation:'Montage',                  duree:3.0, debut:14,  priorite:'urgent',   statut:'programme', activite:'Semrac', tempsAlloue:3.0, debutReel:null,    finReel:null },
  { id:'BDT-099', op:'op3', cmd:'CMD-089', client:'Bosch',     piece:'DISSIP-I09', operation:'Thermocollage',             duree:2.0, debut:7,   priorite:'normal',   statut:'programme', activite:'Seem',   tempsAlloue:2.0, debutReel:null,    finReel:null },
  { id:'BDT-100', op:'op8', cmd:'CMD-090', client:'Faurecia',  piece:'PIECE-J05',  operation:'Fraisage / Taraudage',     duree:3.5, debut:6,   priorite:'critique', statut:'recu',      activite:'Seem',   tempsAlloue:3.5, debutReel:'06:00', finReel:null },
  { id:'BDT-101', op:'op2', cmd:'CMD-091', client:'Schneider', piece:'DISSIP-K14', operation:'Emballage',                 duree:1.0, debut:7.5, priorite:'normal',   statut:'programme', activite:'Seem',   tempsAlloue:1.0, debutReel:null,    finReel:null },
  { id:'BDT-102', op:'op5', cmd:'CMD-092', client:'Renault',   piece:'TOLE-L22',   operation:'Ébavurage',                 duree:1.5, debut:8,   priorite:'normal',   statut:'programme', activite:'Semrac', tempsAlloue:1.5, debutReel:null,    finReel:null },
  { id:'BDT-103', op:'op9', cmd:'CMD-093', client:'Legrand',   piece:'PLAQUE-M5',  operation:'Sérigraphie',               duree:2.0, debut:7,   priorite:'normal',   statut:'programme', activite:'Semrac', tempsAlloue:2.0, debutReel:null,    finReel:null },
  { id:'BDT-ST1', op:'ST',  cmd:'CMD-094', client:'Valeo',     piece:'PIECE-OXY',  operation:'Oxydation anodique sulfurique', duree:8.0, debut:6, priorite:'normal', statut:'st',       activite:'Seem',   tempsAlloue:8.0, debutReel:null,    finReel:null },
  { id:'BDT-ST2', op:'ST',  cmd:'CMD-095', client:'Renault',   piece:'PIECE-ZNG',  operation:'Zingage',                  duree:8.0, debut:6,   priorite:'urgent',   statut:'st',        activite:'Semrac', tempsAlloue:8.0, debutReel:null,    finReel:null },
]

const CSS_COMMUN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *{font-family:'Inter',sans-serif;box-sizing:border-box;}
  body{background:#f1f5f9;}
  .card{background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.04);}
  .notif-banner{position:fixed;top:1rem;right:1rem;z-index:2000;max-width:380px;}
  .notif{background:white;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.18);padding:.9rem 1.2rem;border-left:4px solid;margin-bottom:.5rem;font-size:.82rem;animation:slideIn .3s ease;}
  .notif-ok{border-color:#22c55e;} .notif-warn{border-color:#f59e0b;} .notif-err{border-color:#ef4444;} .notif-info{border-color:#3b82f6;}
  @keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
  .form-label{display:block;font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;}
  .form-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.82rem;color:#374151;background:#f8fafc;outline:none;transition:border-color .2s;}
  .form-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12);}
  .tab-btn{padding:.45rem 1.1rem;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;background:transparent;border:none;}
  .tab-btn.active{background:#f97316;color:white;}
  .tab-btn:not(.active):hover{background:#f1f5f9;}
  .badge{border-radius:999px;padding:2px 8px;font-size:.62rem;font-weight:700;}
  .badge-critique{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;}
  .badge-urgent{background:#fffbeb;color:#b45309;border:1px solid #fde68a;}
  .badge-normal{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;}
  .badge-st{background:#ede9fe;color:#5b21b6;border:1px solid #c4b5fd;}
  .badge-programme{background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;}
  .badge-recu{background:#fef9c3;color:#854d0e;border:1px solid #fde68a;}
  .badge-solde{background:#dcfce7;color:#166534;border:1px solid #86efac;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:500;}
  .modal-box{background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:640px;margin:1rem;overflow:hidden;max-height:90vh;overflow-y:auto;}
  .btn-primary{display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1.25rem;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border-radius:10px;font-size:.82rem;font-weight:700;border:none;cursor:pointer;transition:all .15s;box-shadow:0 2px 8px rgba(234,88,12,.3);}
  .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(234,88,12,.4);}
  .btn-secondary{display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1.1rem;background:white;color:#374151;border-radius:10px;font-size:.82rem;font-weight:600;border:1px solid #e2e8f0;cursor:pointer;transition:all .15s;}
  .btn-secondary:hover{background:#f8fafc;border-color:#d1d5db;}
`

const SIDEBAR_AFF = (active = '') => `
<aside class="w-64 min-h-screen flex-shrink-0 text-white flex flex-col" style="background:linear-gradient(170deg,#0f172a 0%,#1e3a5f 50%,#1e293b 100%)">
  <div class="p-4 border-b border-white/10">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base" style="background:linear-gradient(135deg,#f97316,#ea580c)">
        <i class="fas fa-industry"></i>
      </div>
      <div>
        <div class="font-bold text-sm leading-tight">Production</div>
        <div class="text-xs text-orange-300">Seem Semrac ERP</div>
      </div>
    </div>
  </div>
  <nav class="flex-1 p-3 space-y-0.5 overflow-y-auto text-sm">
    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">PLANIFICATION</div>
    <a href="/production/programmation" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='prog'?'bg-white/15 border-l-4 border-amber-400 pl-2':'hover:bg-white/8'} text-slate-200 transition-all text-xs">
      <i class="fas fa-calendar-alt w-4 text-amber-400"></i> Programmation / Planification
    </a>
    <a href="/production/affectation" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='aff'?'bg-white/15 border-l-4 border-orange-400 pl-2':'hover:bg-white/8'} text-slate-200 transition-all text-xs">
      <i class="fas fa-project-diagram w-4 text-orange-400"></i> Affectation BDT – Gantt
    </a>
    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mt-2">OPÉRATEURS</div>
    <a href="/production/operateur" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='op'?'bg-white/15 border-l-4 border-orange-400 pl-2':'hover:bg-white/8'} text-slate-200 transition-all text-xs">
      <i class="fas fa-hard-hat w-4 text-orange-400"></i> BDT Opérateur & Pointage
    </a>
    <a href="/production/competences" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='comp'?'bg-white/15 border-l-4 border-purple-400 pl-2':'hover:bg-white/8'} text-slate-200 transition-all text-xs">
      <i class="fas fa-medal w-4 text-purple-400"></i> Compétences & Habilitations
    </a>
    <a href="/production/horaires" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='hor'?'bg-white/15 border-l-4 border-teal-400 pl-2':'hover:bg-white/8'} text-slate-200 transition-all text-xs">
      <i class="fas fa-business-time w-4 text-teal-400"></i> Horaires & Disponibilités
    </a>
    <a href="/production/pilotage" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='pilot'?'bg-white/15 border-l-4 border-orange-400 pl-2':'hover:bg-white/8'} text-slate-200 transition-all text-xs">
      <i class="fas fa-tachometer-alt w-4 text-orange-400"></i> Pilotage Production
    </a>
    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mt-2">MODULES LIÉS</div>
    <a href="/stock" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='stock'?'bg-white/15 border-l-4 border-green-400 pl-2':'hover:bg-white/8'} text-slate-200 transition-all text-xs">
      <i class="fas fa-warehouse w-4 text-green-400"></i> Gestion de Stock
    </a>
    <a href="/finances/couts" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='fin'?'bg-white/15 border-l-4 border-yellow-400 pl-2':'hover:bg-white/8'} text-slate-200 transition-all text-xs">
      <i class="fas fa-euro-sign w-4 text-yellow-400"></i> Finances / Coûts
    </a>
    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mt-2">NAVIGATION</div>
    <a href="/" class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/8 text-slate-400 transition-all text-xs">
      <i class="fas fa-arrow-left w-4"></i> Retour accueil
    </a>
    <a href="/dashboard/production" class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/8 text-slate-400 transition-all text-xs">
      <i class="fas fa-chart-bar w-4 text-orange-300"></i> Dashboard Production
    </a>
  </nav>
  <div class="p-3 border-t border-white/10 text-xs text-slate-500 text-center">Maquette ERP 2026 v2.0</div>
</aside>`

// ══════════════════════════════════════════════════════════════
// PAGE AFFECTATION BDT – GANTT INTERACTIF
// §4.8 – Sylvie (Programmation production)
// ══════════════════════════════════════════════════════════════
export const pageAffectation = () => {
  const TODAY = '2026-03-10'
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Affectation BDT – Gantt · ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>
    ${CSS_COMMUN}
    .gantt-wrap{overflow-x:auto;}
    .gantt-header-row{display:grid;grid-template-columns:230px 1fr;background:#1e293b;color:white;border-radius:12px 12px 0 0;}
    .gantt-body-row{display:grid;grid-template-columns:230px 1fr;border-bottom:1px solid #f1f5f9;}
    .gantt-body-row:last-child{border-bottom:none;}
    .op-info-cell{background:white;padding:10px 12px;display:flex;flex-direction:column;gap:3px;min-height:72px;border-right:2px solid #f1f5f9;}
    .op-info-cell.absent{background:#fef2f2;}
    .op-info-cell.weekend{background:#f8fafc;}
    .gantt-lane{position:relative;background:white;min-height:72px;}
    .gantt-lane.absent{background:repeating-linear-gradient(45deg,#fef2f2,#fef2f2 8px,#fee2e2 8px,#fee2e2 16px);}
    .gantt-lane.weekend{background:#fafbfc;}
    .gantt-tick{position:absolute;top:0;bottom:0;border-left:1px solid #f1f5f9;pointer-events:none;}
    .gantt-tick.major{border-left:1px solid #e2e8f0;}
    .shift-zone{position:absolute;top:0;bottom:0;opacity:.08;pointer-events:none;z-index:0;}
    .bdt-bar{position:absolute;top:8px;bottom:8px;border-radius:8px;display:flex;flex-direction:column;justify-content:center;padding:0 7px;cursor:pointer;font-size:.67rem;font-weight:700;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.15);z-index:2;transition:all .15s;}
    .bdt-bar:hover{filter:brightness(.9);z-index:10;box-shadow:0 4px 14px rgba(0,0,0,.25);}
    .bdt-bar.solde{opacity:.6;filter:grayscale(.3);}
    .bdt-bar.programme{border:2px dashed rgba(255,255,255,.5);}
    .drag-over{background:#dbeafe !important;outline:2px dashed #3b82f6;outline-offset:-2px;}
    .tooltip-box{position:fixed;background:#0f172a;color:white;border-radius:10px;padding:10px 14px;font-size:.75rem;pointer-events:none;z-index:1000;max-width:280px;box-shadow:0 8px 28px rgba(0,0,0,.4);display:none;}
    .stat-pill{background:white;border-radius:10px;padding:.65rem 1rem;box-shadow:0 1px 3px rgba(0,0,0,.07);text-align:center;}
    .pending-card{display:flex;align-items:center;gap:3px;padding:.55rem .75rem;border-radius:10px;border:1.5px dashed #fbd38d;background:#fffbeb;cursor:grab;font-size:.72rem;}
    .pending-card:active{cursor:grabbing;}
    .solde-row{background:#f0fdf4;}
    .bdt-status-chip{display:inline-flex;align-items:center;gap:3px;padding:1px 7px;border-radius:999px;font-size:.62rem;font-weight:700;}
  </style>
</head>
<body class="min-h-screen flex">
${SIDEBAR_AFF('aff')}

<main class="flex-1 overflow-y-auto">
  <!-- HEADER -->
  <div class="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white" style="background:linear-gradient(135deg,#f97316,#ea580c)">
        <i class="fas fa-project-diagram"></i>
      </div>
      <div>
        <h1 class="text-lg font-bold text-gray-900">Affectation BDT – Planning Gantt</h1>
        <p class="text-gray-400 text-xs">Sylvie (Programmation) · Glisser-déposer · Statuts BDT : Programmé → Reçu → Soldé</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <a href="/production/programmation"><button class="tab-btn text-xs">Programmation</button></a>
      <button class="tab-btn active text-xs">Affectation Gantt</button>
      <a href="/production/competences"><button class="tab-btn text-xs">Compétences</button></a>
      <a href="/production/horaires"><button class="tab-btn text-xs">Horaires RH</button></a>
    </div>
  </div>

  <div class="p-4">
    <!-- BARRE OUTILS -->
    <div class="flex items-center gap-2.5 mb-3 flex-wrap">
      <div class="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
        <i class="fas fa-calendar text-orange-500 text-sm"></i>
        <input type="date" id="planDate" value="${TODAY}" onchange="loadDay(this.value)" class="text-sm font-bold text-gray-800 border-0 outline-none bg-transparent cursor-pointer"/>
        <button onclick="shiftDate(-1)" class="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-xs">‹</button>
        <button onclick="shiftDate(1)"  class="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-xs">›</button>
      </div>
      <div class="flex gap-0.5 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
        <button onclick="setAct('all')"    id="fa-all"    class="tab-btn active text-xs px-2.5 py-1">Tous</button>
        <button onclick="setAct('Seem')"   id="fa-Seem"   class="tab-btn text-xs px-2.5 py-1">Seem</button>
        <button onclick="setAct('Semrac')" id="fa-Semrac" class="tab-btn text-xs px-2.5 py-1">Semrac</button>
      </div>
      <div class="flex gap-0.5 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
        <button onclick="setShift('all')"    id="fs-all"    class="tab-btn active text-xs px-2.5 py-1">Tous shifts</button>
        <button onclick="setShift('matin')"  id="fs-matin"  class="tab-btn text-xs px-2.5 py-1">Matin</button>
        <button onclick="setShift('apmidi')" id="fs-apmidi" class="tab-btn text-xs px-2.5 py-1">Après-midi</button>
        <button onclick="setShift('journee')"id="fs-journee"class="tab-btn text-xs px-2.5 py-1">Journée</button>
      </div>
      <div class="flex-1"></div>
      <!-- Légende statuts -->
      <div class="flex items-center gap-2.5 text-xs text-gray-500">
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm" style="background:#3b82f6;border:2px dashed rgba(255,255,255,.5)"></span>Programmé</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm" style="background:#f59e0b"></span>Reçu/En cours</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm" style="background:#22c55e"></span>Soldé</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm" style="background:#ef4444"></span>Critique</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm" style="background:#6366f1"></span>Sous-trait.</span>
      </div>
      <button onclick="openBdtModal()" class="btn-primary text-xs">
        <i class="fas fa-plus"></i> Nouveau BDT
      </button>
    </div>

    <!-- STATS -->
    <div class="grid grid-cols-7 gap-2 mb-3" id="statsBar"></div>

    <!-- GANTT -->
    <div class="card overflow-hidden mb-4">
      <div class="gantt-header-row">
        <div class="px-3 py-2.5 border-r border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-2">
          <i class="fas fa-users text-slate-400"></i> Opérateur
        </div>
        <div id="hoursHdr" class="relative" style="min-height:36px;"></div>
      </div>
      <div id="ganttBody" class="rounded-b-xl overflow-hidden"></div>
    </div>

    <!-- BAS : En attente + ST -->
    <div class="grid grid-cols-2 gap-3">
      <div class="card p-4">
        <div class="flex items-center justify-between mb-2.5">
          <div class="font-bold text-gray-800 text-sm flex items-center gap-2">
            <i class="fas fa-inbox text-orange-500"></i> BDT en attente d'affectation
            <span id="cntPend" class="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">0</span>
          </div>
          <span class="text-xs text-gray-400">Glisser sur un opérateur</span>
        </div>
        <div id="pendingList" class="space-y-1.5 min-h-12"></div>
      </div>
      <div class="card p-4">
        <div class="flex items-center justify-between mb-2.5">
          <div class="font-bold text-gray-800 text-sm flex items-center gap-2">
            <i class="fas fa-industry text-indigo-500"></i> Sous-traitance en cours
            <span id="cntST" class="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">0</span>
          </div>
          <button onclick="openSTModal()" class="text-xs text-indigo-600 hover:underline font-semibold"><i class="fas fa-plus mr-1"></i>Nouvelle ST</button>
        </div>
        <div id="stList" class="space-y-1.5"></div>
        <div class="mt-3 pt-2.5 border-t border-gray-100">
          <div class="text-xs text-gray-400 mb-1.5 font-semibold">Opérations typiquement sous-traitées :</div>
          <div class="flex flex-wrap gap-1">
            ${OPS_ST.map(op=>`<span class="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2 py-0.5 rounded-full">${op}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- JOURNAL TEMPS RÉELS -->
    <div class="card p-4 mt-3">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-gray-800 text-sm flex items-center gap-2">
          <i class="fas fa-stopwatch text-blue-500"></i> Journal des temps d'opération (§4.18 – Calcul automatique)
        </h3>
        <button onclick="exportJournal()" class="btn-secondary text-xs"><i class="fas fa-file-excel mr-1 text-green-600"></i>Exporter Excel</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead><tr class="border-b border-gray-100">
            <th class="text-left py-2 pr-4 text-gray-500 font-semibold">BDT</th>
            <th class="text-left py-2 pr-4 text-gray-500 font-semibold">Opérateur</th>
            <th class="text-left py-2 pr-4 text-gray-500 font-semibold">Opération</th>
            <th class="text-left py-2 pr-4 text-gray-500 font-semibold">Client · Pièce</th>
            <th class="text-center py-2 pr-4 text-gray-500 font-semibold">Début réel</th>
            <th class="text-center py-2 pr-4 text-gray-500 font-semibold">Fin réelle</th>
            <th class="text-center py-2 pr-4 text-gray-500 font-semibold">Tps alloué</th>
            <th class="text-center py-2 pr-4 text-gray-500 font-semibold">Tps réel</th>
            <th class="text-center py-2 text-gray-500 font-semibold">Écart</th>
          </tr></thead>
          <tbody id="journalBody"></tbody>
        </table>
      </div>
    </div>
  </div>
</main>

<!-- TOOLTIP -->
<div class="tooltip-box" id="tooltip"></div>

<!-- NOTIFICATIONS -->
<div class="notif-banner" id="notifBanner"></div>

<!-- MODAL NOUVEAU BDT -->
<div id="bdtModal" class="modal-overlay hidden">
  <div class="modal-box">
    <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between" style="background:linear-gradient(135deg,#f97316,#ea580c)">
      <h3 class="font-bold text-white"><i class="fas fa-plus-circle mr-2"></i>Créer / Affecter un BDT</h3>
      <button onclick="closeModal('bdtModal')" class="text-white/70 hover:text-white text-xl"><i class="fas fa-times"></i></button>
    </div>
    <div class="p-5 space-y-4">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="form-label">N° Commande ERP *</label><input id="m_cmd" type="text" placeholder="CMD-2026-XXXX" class="form-input"/></div>
        <div><label class="form-label">Client *</label><input id="m_client" type="text" placeholder="Raison sociale" class="form-input"/></div>
        <div>
          <label class="form-label">Activité *</label>
          <select id="m_activite" class="form-input" onchange="updateOps()">
            <option value="">— Choisir —</option>
            <option>Seem</option><option>Semrac</option>
          </select>
        </div>
        <div>
          <label class="form-label">Opération *</label>
          <select id="m_operation" class="form-input" onchange="updateOpsEligibles()">
            <option value="">— Choisir activité d'abord —</option>
          </select>
        </div>
        <div><label class="form-label">Pièce / Référence *</label><input id="m_piece" type="text" placeholder="DISSIP-A24" class="form-input"/></div>
        <div><label class="form-label">Quantité</label><input id="m_qte" type="number" placeholder="100" class="form-input"/></div>
        <div><label class="form-label">Durée estimée (h) *</label><input id="m_duree" type="number" step="0.5" placeholder="2.5" class="form-input"/></div>
        <div><label class="form-label">Heure de début</label><input id="m_debut" type="time" value="06:00" class="form-input"/></div>
        <div>
          <label class="form-label">Priorité</label>
          <select id="m_priorite" class="form-input">
            <option value="normal">Normal</option>
            <option value="urgent">Urgent</option>
            <option value="critique">Critique</option>
          </select>
        </div>
        <div>
          <label class="form-label">Type</label>
          <select id="m_type" class="form-input" onchange="toggleST(this.value)">
            <option value="interne">Interne – opérateur</option>
            <option value="st">Sous-traitance</option>
          </select>
        </div>
      </div>
      <div id="opWrap">
        <label class="form-label">Opérateur assigné * <span id="compHint" class="text-orange-500 font-normal italic text-xs"></span></label>
        <select id="m_operateur" class="form-input">
          <option value="">— Choisir opération d'abord —</option>
        </select>
      </div>
      <div id="stWrap" class="hidden grid grid-cols-2 gap-3">
        <div><label class="form-label">Sous-traitant</label><input id="m_st" type="text" placeholder="Raison sociale ST" class="form-input"/></div>
        <div><label class="form-label">Délai retour prévu</label><input id="m_stdate" type="date" class="form-input"/></div>
      </div>
      <div><label class="form-label">Instructions particulières</label>
        <textarea id="m_notes" rows="2" placeholder="Points d'attention, outillage, tolérances…" class="form-input resize-none"></textarea>
      </div>
      <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
        <i class="fas fa-info-circle mr-1"></i>
        Après création, l'opérateur recevra une notification Teams/Outlook. Le BDT sera automatiquement archivé dans la GED SharePoint.
      </div>
    </div>
    <div class="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2">
      <button onclick="closeModal('bdtModal')" class="btn-secondary">Annuler</button>
      <button onclick="createBDT()" class="btn-primary"><i class="fas fa-plus"></i> Créer le BDT</button>
    </div>
  </div>
</div>

<!-- MODAL SOLDAGE BDT -->
<div id="soldageModal" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:520px">
    <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between" style="background:linear-gradient(135deg,#22c55e,#16a34a)">
      <h3 class="font-bold text-white"><i class="fas fa-check-double mr-2"></i>Soldage BDT – Clôture opération</h3>
      <button onclick="closeModal('soldageModal')" class="text-white/70 hover:text-white text-xl"><i class="fas fa-times"></i></button>
    </div>
    <div class="p-5 space-y-3">
      <div id="soldageInfo" class="bg-gray-50 rounded-xl p-3 text-sm"></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="form-label">Heure de fin réelle *</label><input id="s_fin" type="time" class="form-input"/></div>
        <div>
          <label class="form-label">Résultat</label>
          <select id="s_resultat" class="form-input">
            <option value="ok">✅ Conforme – pièces OK</option>
            <option value="reprise">⚠️ Reprise partielle nécessaire</option>
            <option value="nc">❌ Non-conformité – à déclarer</option>
          </select>
        </div>
      </div>
      <div><label class="form-label">Quantité produite</label><input id="s_qte" type="number" placeholder="Ex : 100" class="form-input"/></div>
      <div><label class="form-label">Observations / incidents</label>
        <textarea id="s_obs" rows="2" placeholder="Anomalies, casses outils, écarts…" class="form-input resize-none"></textarea>
      </div>
      <div class="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700">
        <i class="fas fa-robot mr-1"></i>
        <strong>Automatisations :</strong> Temps réel calculé automatiquement · Intégration Power BI · Mise à jour coût de revient · Archivage GED · Notification responsable production (Lénaïck)
      </div>
    </div>
    <div class="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2">
      <button onclick="closeModal('soldageModal')" class="btn-secondary">Annuler</button>
      <button onclick="confirmerSoldage()" class="btn-primary" style="background:linear-gradient(135deg,#22c55e,#16a34a);box-shadow:0 2px 8px rgba(34,197,94,.3)">
        <i class="fas fa-check-double"></i> Solder le BDT
      </button>
    </div>
  </div>
</div>

<!-- MODAL ST -->
<div id="stModal" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:560px">
    <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between" style="background:linear-gradient(135deg,#6366f1,#4338ca)">
      <h3 class="font-bold text-white"><i class="fas fa-industry mr-2"></i>Nouvelle commande de sous-traitance</h3>
      <button onclick="closeModal('stModal')" class="text-white/70 hover:text-white text-xl"><i class="fas fa-times"></i></button>
    </div>
    <div class="p-5 space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div><label class="form-label">N° Commande ERP</label><input type="text" placeholder="CMD-2026-XXXX" class="form-input"/></div>
        <div><label class="form-label">Client final</label><input type="text" placeholder="Client" class="form-input"/></div>
        <div>
          <label class="form-label">Opération à sous-traiter</label>
          <select class="form-input">
            ${OPS_ST.map(op=>`<option>${op}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Sous-traitant</label><input type="text" placeholder="Raison sociale" class="form-input"/></div>
        <div><label class="form-label">Pièces / Références</label><input type="text" placeholder="Réf · Quantité" class="form-input"/></div>
        <div><label class="form-label">Date envoi prévue</label><input type="date" class="form-input"/></div>
        <div><label class="form-label">Date retour prévue</label><input type="date" class="form-input"/></div>
        <div>
          <label class="form-label">Priorité</label>
          <select class="form-input"><option>Normal</option><option>Urgent</option><option>Critique</option></select>
        </div>
      </div>
      <div><label class="form-label">Spécifications / Tolérances</label>
        <textarea rows="2" placeholder="Finition, certifications, tolérances requises…" class="form-input resize-none"></textarea>
      </div>
    </div>
    <div class="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2">
      <button onclick="closeModal('stModal')" class="btn-secondary">Annuler</button>
      <button onclick="createST()" class="btn-primary" style="background:linear-gradient(135deg,#6366f1,#4338ca);box-shadow:0 2px 8px rgba(99,102,241,.3)">
        <i class="fas fa-paper-plane"></i> Commander la ST
      </button>
    </div>
  </div>
</div>

<!-- MODAL RÉAFFECTATION -->
<div id="reaffModal" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:560px">
    <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-amber-500">
      <h3 class="font-bold text-white"><i class="fas fa-exclamation-triangle mr-2"></i>Réaffectation requise</h3>
      <button onclick="closeModal('reaffModal')" class="text-white/70 hover:text-white text-xl"><i class="fas fa-times"></i></button>
    </div>
    <div class="p-5">
      <div id="reaffContent"></div>
    </div>
    <div class="px-5 py-3.5 border-t border-gray-100 flex justify-end gap-2">
      <button onclick="closeModal('reaffModal')" class="btn-secondary">Fermer</button>
    </div>
  </div>
</div>

<script>
// ─── DONNÉES ─────────────────────────────────────────────────
const OPERATEURS = ${JSON.stringify(OPERATEURS)};
const ABSENCES   = ${JSON.stringify(ABSENCES)};
const SHIFTS     = ${JSON.stringify(SHIFTS)};
const OPS_SEMRAC = ${JSON.stringify(OPS_SEMRAC)};
const OPS_SEEM   = ${JSON.stringify(OPS_SEEM)};

let BDTS = JSON.parse(JSON.stringify(${JSON.stringify(BDT_INITIAL)}));
let currentDate = '${TODAY}';
let filtAct = 'all', filtShift = 'all';
let dragId = null, soldageBdtId = null;

const DAY_START = 5, DAY_END = 23, TOTAL_H = DAY_END - DAY_START;
const PX_H = 52; // pixels par heure
const LANE_W = TOTAL_H * PX_H;

const PRIO_COLORS = { normal:'#22c55e', urgent:'#f59e0b', critique:'#ef4444', st:'#6366f1' };
const STATUT_COLORS = { programme:'#3b82f6', recu:'#f59e0b', solde:'#22c55e', st:'#6366f1' };

// ─── INIT ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => { buildAll(); checkAbsenceAlerts(); });

function buildAll() {
  buildHoursHdr();
  buildStats();
  buildGantt();
  buildPending();
  buildST();
  buildJournal();
}

function shiftDate(d) {
  const dt = new Date(currentDate); dt.setDate(dt.getDate()+d);
  currentDate = dt.toISOString().split('T')[0];
  document.getElementById('planDate').value = currentDate;
  buildAll();
}
function loadDay(v) { currentDate = v; buildAll(); }

function setAct(a) {
  filtAct = a;
  ['all','Seem','Semrac'].forEach(x => { const el=document.getElementById('fa-'+x); if(el) el.classList.toggle('active', x===a); });
  buildAll();
}
function setShift(s) {
  filtShift = s;
  ['all','matin','apmidi','journee'].forEach(x => { const el=document.getElementById('fs-'+x); if(el) el.classList.toggle('active', x===s); });
  buildAll();
}

// ─── GANTT ───────────────────────────────────────────────────
function buildHoursHdr() {
  const hdr = document.getElementById('hoursHdr');
  hdr.innerHTML = '';
  hdr.style.cssText = \`width:\${LANE_W}px;position:relative;height:36px;\`;
  for(let h=DAY_START; h<=DAY_END; h++) {
    const el = document.createElement('div');
    el.style.cssText = \`position:absolute;left:\${(h-DAY_START)*PX_H}px;width:\${PX_H}px;text-align:center;padding:8px 0;font-size:.62rem;\${h%2===0?'font-weight:700;color:#cbd5e1;':'color:#64748b;'}\`;
    el.textContent = h+'h';
    hdr.appendChild(el);
  }
}

function buildGantt() {
  const dow = new Date(currentDate).getDay();
  const isWE = (dow===0||dow===6);
  const body = document.getElementById('ganttBody');
  body.innerHTML = '';

  const ops = OPERATEURS.filter(op => {
    if(filtAct!=='all' && op.activite!==filtAct) return false;
    if(filtShift!=='all' && op.shift!==filtShift) return false;
    return true;
  });

  ops.forEach(op => {
    const absent = isAbsent(op.id, currentDate);
    const bdts   = BDTS.filter(b => b.op===op.id);
    const sh     = SHIFTS[op.shift]||SHIFTS.matin;

    const row = document.createElement('div');
    row.className = 'gantt-body-row';

    // Colonne info
    const info = document.createElement('div');
    info.className = 'op-info-cell' + (absent?' absent':(isWE?' weekend':''));
    info.innerHTML = \`
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style="background:\${op.activite==='Seem'?'#3b82f6':'#ec4899'}">\${op.nom.charAt(0)}</div>
        <div class="min-w-0">
          <div class="text-xs font-bold text-gray-800 truncate">\${op.nom}</div>
          <div class="text-xs text-gray-400 truncate">\${op.poste}</div>
        </div>
        \${absent?'<span class="ml-auto badge badge-critique text-xs">'+ABSENCES[op.id].type+'</span>':''}
      </div>
      <div class="flex items-center gap-1.5 mt-1 flex-wrap">
        <span class="text-xs px-1.5 py-0.5 rounded-full font-semibold" style="background:\${sh.color+'22'};color:\${sh.color}">\${sh.label}</span>
        <span class="text-xs px-1.5 py-0.5 rounded-full font-semibold \${op.activite==='Seem'?'bg-blue-50 text-blue-700':'bg-pink-50 text-pink-700'}">\${op.activite}</span>
        <span class="text-xs text-gray-400">\${bdts.filter(b=>b.statut!=='solde').length} BDT actifs</span>
      </div>
    \`;

    // Couloir Gantt
    const lane = document.createElement('div');
    lane.className = 'gantt-lane' + (absent?' absent':(isWE?' weekend':''));
    lane.style.cssText = \`position:relative;min-height:72px;width:\${LANE_W}px;\`;
    lane.dataset.opid = op.id;

    // Ticks
    for(let h=0; h<=TOTAL_H; h++) {
      const t = document.createElement('div');
      t.className = 'gantt-tick'+(h%2===0?' major':'');
      t.style.left = (h*PX_H)+'px';
      lane.appendChild(t);
    }

    // Zone shift
    if(!absent && !isWE) {
      const z = document.createElement('div');
      z.className = 'shift-zone';
      z.style.cssText = \`left:\${Math.max(0,(sh.start-DAY_START))*PX_H}px;width:\${Math.min(TOTAL_H,(sh.end-sh.start))*PX_H}px;background:\${sh.color};\`;
      lane.appendChild(z);
    }

    // BDTs
    if(!absent && !isWE) {
      bdts.forEach(bdt => lane.appendChild(makeBdtBar(bdt)));
    }

    // Message si vide / absent / WE
    if(absent) {
      const m = document.createElement('div');
      m.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;color:#b91c1c;opacity:.5;pointer-events:none;';
      m.innerHTML = '<i class="fas fa-ban mr-2"></i>'+(ABSENCES[op.id]?.type||'Absent')+' – non disponible';
      lane.appendChild(m);
    } else if(isWE) {
      const m = document.createElement('div');
      m.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.72rem;color:#94a3b8;pointer-events:none;';
      m.innerHTML = '<i class="fas fa-moon mr-2"></i>Week-end – repos';
      lane.appendChild(m);
    } else if(bdts.length===0) {
      const m = document.createElement('div');
      m.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#d1d5db;pointer-events:none;';
      m.innerHTML = '<i class="fas fa-inbox mr-2"></i>Aucun BDT planifié – Journée disponible';
      lane.appendChild(m);
    }

    // Drag & drop
    if(!absent && !isWE) {
      lane.addEventListener('dragover', e => { e.preventDefault(); lane.classList.add('drag-over'); });
      lane.addEventListener('dragleave', () => lane.classList.remove('drag-over'));
      lane.addEventListener('drop', e => {
        e.preventDefault(); lane.classList.remove('drag-over');
        if(dragId) affectBDT(dragId, op.id);
        dragId = null;
      });
    }

    row.appendChild(info);
    row.appendChild(lane);
    body.appendChild(row);
  });
}

function makeBdtBar(bdt) {
  const startOff = Math.max(0, bdt.debut - DAY_START);
  const w = Math.max(bdt.duree * PX_H - 4, 36);
  const l = startOff * PX_H + 2;
  const color = bdt.statut==='solde'?'#22c55e': bdt.statut==='recu'?'#f59e0b': PRIO_COLORS[bdt.priorite]||'#22c55e';
  const el = document.createElement('div');
  el.className = 'bdt-bar' + (bdt.statut==='solde'?' solde':'') + (bdt.statut==='programme'?' programme':'');
  el.draggable = true;
  el.dataset.bdtid = bdt.id;
  el.style.cssText = \`left:\${l}px;width:\${w}px;background:\${color};color:white;\`;
  el.innerHTML = \`
    <div style="font-size:.6rem;font-weight:800;opacity:.85">\${bdt.id}</div>
    <div style="font-size:.65rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">\${bdt.operation}</div>
    <div style="font-size:.6rem;opacity:.75">\${bdt.client} · \${bdt.duree}h</div>
    \${bdt.statut==='solde'?'<div style="font-size:.55rem;opacity:.8"><i class="fas fa-check mr-0.5"></i>Soldé</div>':
      bdt.statut==='recu'?'<div style="font-size:.55rem;opacity:.8"><i class="fas fa-play mr-0.5"></i>En cours</div>':''}
  \`;
  el.addEventListener('dragstart', e => { dragId = bdt.id; e.dataTransfer.setData('text/plain', bdt.id); });
  el.addEventListener('mouseenter', e => showTT(e, bdt));
  el.addEventListener('mousemove',  e => moveTT(e));
  el.addEventListener('mouseleave', hideTT);
  el.addEventListener('dblclick', () => openSoldageModal(bdt.id));
  // Clic droit → menu
  el.addEventListener('contextmenu', e => { e.preventDefault(); openStatutMenu(e, bdt); });
  return el;
}

// ─── STATUTS BDT ─────────────────────────────────────────────
function openStatutMenu(e, bdt) {
  // Petit menu contextuel pour changer statut
  const existingMenu = document.getElementById('contextMenu');
  if(existingMenu) existingMenu.remove();
  
  const transitions = { programme:['recu'], recu:['solde','programme'], solde:[] };
  const next = transitions[bdt.statut]||[];
  if(!next.length && bdt.statut!=='solde') return;
  
  const menu = document.createElement('div');
  menu.id = 'contextMenu';
  menu.style.cssText = \`position:fixed;left:\${e.clientX}px;top:\${e.clientY}px;background:white;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.2);z-index:999;min-width:200px;overflow:hidden;border:1px solid #f1f5f9;\`;
  
  const title = document.createElement('div');
  title.style.cssText = 'padding:.5rem .75rem;font-size:.72rem;font-weight:700;color:#64748b;background:#f8fafc;border-bottom:1px solid #f1f5f9;';
  title.innerHTML = '<i class="fas fa-exchange-alt mr-1"></i>' + bdt.id + ' – Changer statut';
  menu.appendChild(title);
  
  if(bdt.statut!=='solde') {
    const labels = { recu:'<i class="fas fa-play mr-2 text-amber-500"></i>Passer à <strong>Reçu</strong> (début op.)', solde:'<i class="fas fa-check-double mr-2 text-green-500"></i>Solder le BDT' };
    next.forEach(s => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:.5rem .75rem;font-size:.78rem;cursor:pointer;transition:background .1s;';
      item.innerHTML = labels[s]||s;
      item.addEventListener('mouseenter', ()=> item.style.background='#f1f5f9');
      item.addEventListener('mouseleave', ()=> item.style.background='');
      item.addEventListener('click', () => {
        menu.remove();
        if(s==='solde') { openSoldageModal(bdt.id); }
        else { changerStatut(bdt.id, s); }
      });
      menu.appendChild(item);
    });
  }
  
  // Fermer menu au clic extérieur
  setTimeout(() => document.addEventListener('click', function handler() { menu.remove(); document.removeEventListener('click', handler); }), 50);
  document.body.appendChild(menu);
}

function changerStatut(bdtId, newStatut) {
  const bdt = BDTS.find(b=>b.id===bdtId);
  if(!bdt) return;
  const old = bdt.statut;
  bdt.statut = newStatut;
  
  if(newStatut==='recu') {
    const now = new Date();
    bdt.debutReel = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
    pushNotif('info','fa-play',\`BDT <strong>\${bdtId}</strong> passé à <strong>Reçu</strong>. Heure début enregistrée : \${bdt.debutReel}\`);
  }
  buildAll();
}

function openSoldageModal(bdtId) {
  soldageBdtId = bdtId;
  const bdt = BDTS.find(b=>b.id===bdtId);
  if(!bdt || bdt.statut==='solde') { pushNotif('info','fa-info-circle','Ce BDT est déjà soldé.'); return; }
  if(bdt.statut==='programme') {
    pushNotif('warn','fa-exclamation-triangle','Le BDT doit passer à "Reçu" avant soldage.');
    return;
  }
  const op = OPERATEURS.find(o=>o.id===bdt.op);
  document.getElementById('soldageInfo').innerHTML = \`
    <div class="grid grid-cols-2 gap-2 text-xs">
      <div><span class="text-gray-500">BDT :</span> <strong>\${bdt.id}</strong></div>
      <div><span class="text-gray-500">Opération :</span> \${bdt.operation}</div>
      <div><span class="text-gray-500">Opérateur :</span> \${op?.nom||'—'}</div>
      <div><span class="text-gray-500">Client :</span> \${bdt.client}</div>
      <div><span class="text-gray-500">Pièce :</span> \${bdt.piece}</div>
      <div><span class="text-gray-500">Début réel :</span> \${bdt.debutReel||'—'}</div>
      <div><span class="text-gray-500">Tps alloué :</span> <strong>\${bdt.tempsAlloue}h</strong></div>
      <div><span class="text-gray-500">Priorité :</span> <span class="badge badge-\${bdt.priorite}">\${bdt.priorite}</span></div>
    </div>
  \`;
  const now = new Date();
  document.getElementById('s_fin').value = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  document.getElementById('s_obs').value = '';
  document.getElementById('s_qte').value = '';
  document.getElementById('soldageModal').classList.remove('hidden');
}

function confirmerSoldage() {
  const bdt = BDTS.find(b=>b.id===soldageBdtId);
  if(!bdt) return;
  const finStr = document.getElementById('s_fin').value;
  const resultat = document.getElementById('s_resultat').value;
  const obs = document.getElementById('s_obs').value;
  if(!finStr) { pushNotif('err','fa-exclamation-circle','Heure de fin manquante.'); return; }
  
  bdt.statut = 'solde';
  bdt.finReel = finStr;
  
  // Calcul temps réel
  if(bdt.debutReel) {
    const [dh,dm] = bdt.debutReel.split(':').map(Number);
    const [fh,fm] = finStr.split(':').map(Number);
    bdt.tempsReel = parseFloat(((fh*60+fm - dh*60-dm)/60).toFixed(2));
  }
  
  closeModal('soldageModal');
  buildAll();
  
  const ecart = bdt.tempsReel ? (bdt.tempsReel - bdt.tempsAlloue).toFixed(2) : 0;
  const ecartTxt = ecart>0 ? \`⚠ Dépassement : +\${ecart}h\` : \`✅ Dans les temps (\${ecart}h)\`;
  
  pushNotif('ok','fa-check-double',\`BDT <strong>\${soldageBdtId}</strong> soldé. Tps réel : \${bdt.tempsReel||'—'}h. \${ecartTxt}. Notification Lénaïck · Archivage GED · Power BI mis à jour.\`);
  
  if(resultat==='nc') pushNotif('err','fa-exclamation-triangle', \`Non-conformité signalée sur <strong>\${bdt.id}</strong>. Fiche NC créée automatiquement → Pierre-Yves (Qualité).\`);
  if(resultat==='reprise') pushNotif('warn','fa-redo', \`Reprise partielle signalée sur <strong>\${bdt.id}</strong>. Notification envoyée à Lénaïck.\`);
  
  soldageBdtId = null;
}

// ─── AFFECTATION / DRAG ───────────────────────────────────────
function affectBDT(bdtId, opId) {
  const bdt = BDTS.find(b=>b.id===bdtId); if(!bdt) return;
  const op  = OPERATEURS.find(o=>o.id===opId); if(!op) return;

  if(op.activite !== bdt.activite) {
    pushNotif('err','fa-ban',\`Incompatibilité : \${op.nom} (\${op.activite}) ≠ BDT \${bdt.activite}\`); return;
  }
  if(!op.competences.includes(bdt.operation)) {
    pushNotif('err','fa-ban',\`<strong>\${op.nom}</strong> – Habilitation manquante pour : <strong>\${bdt.operation}</strong>. Compétences disponibles : \${op.competences.join(' | ')}\`); return;
  }
  if(isAbsent(opId, currentDate)) {
    pushNotif('err','fa-calendar-times',\`\${op.nom} est absent (\${ABSENCES[opId]?.type}). Affectation impossible.\`); return;
  }
  bdt.op = opId;
  pushNotif('ok','fa-check-circle',\`BDT <strong>\${bdtId}</strong> affecté à <strong>\${op.nom}</strong>. Notification Teams envoyée.\`);
  buildAll();
}

// ─── ABSENCES ────────────────────────────────────────────────
function isAbsent(opId, date) { return ABSENCES[opId]?.dates.includes(date)||false; }

function checkAbsenceAlerts() {
  Object.keys(ABSENCES).forEach(opId => {
    if(ABSENCES[opId].dates.includes(currentDate)) {
      const bdtsAffectes = BDTS.filter(b=>b.op===opId && b.statut!=='solde');
      if(bdtsAffectes.length>0) {
        const op = OPERATEURS.find(o=>o.id===opId);
        showReaffModal(op, bdtsAffectes);
      }
    }
  });
}

function showReaffModal(op, bdts) {
  document.getElementById('reaffContent').innerHTML = \`
    <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-sm">
      <i class="fas fa-exclamation-triangle text-amber-500 mr-2"></i>
      <strong>\${op.nom}</strong> est absent (\${ABSENCES[op.id]?.type}) à la date <strong>\${currentDate}</strong> et a <strong>\${bdts.length} BDT(s)</strong> non soldé(s) affecté(s).
    </div>
    <div class="space-y-2">
      \${bdts.map(b=>\`
      <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-gray-100 text-xs">
        <div class="w-2 h-10 rounded-full flex-shrink-0" style="background:\${PRIO_COLORS[b.priorite]||'#22c55e'}"></div>
        <div class="flex-1">
          <div class="font-bold text-gray-800">\${b.id} · \${b.operation}</div>
          <div class="text-gray-400">\${b.client} · \${b.piece} · \${b.duree}h · \${b.activite}</div>
        </div>
        <select class="form-input w-36 text-xs" onchange="reassignBDT('\${b.id}',this.value)">
          <option value="">— Réaffecter à —</option>
          \${OPERATEURS.filter(o=>o.id!==op.id&&o.activite===b.activite&&o.competences.includes(b.operation)&&!isAbsent(o.id,currentDate))
            .map(o=>\`<option value="\${o.id}">\${o.nom}</option>\`).join('')}
        </select>
      </div>\`).join('')}
    </div>
    <div class="mt-3 text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl p-2.5">
      <i class="fas fa-robot mr-1 text-blue-500"></i> En production : ce panneau déclencherait automatiquement une alerte Teams/Outlook à Sylvie (Programmation) et Lénaïck (Production).
    </div>
  \`;
  document.getElementById('reaffModal').classList.remove('hidden');
}

function reassignBDT(bdtId, newOpId) {
  if(!newOpId) return;
  const bdt = BDTS.find(b=>b.id===bdtId);
  const op = OPERATEURS.find(o=>o.id===newOpId);
  if(bdt && op) {
    bdt.op = newOpId;
    pushNotif('ok','fa-check',\`BDT <strong>\${bdtId}</strong> réaffecté à <strong>\${op.nom}</strong>.\`);
    buildAll();
  }
}

// ─── STATS ───────────────────────────────────────────────────
function buildStats() {
  const ops    = OPERATEURS.filter(o=>filtAct==='all'||o.activite===filtAct);
  const bdtOps = BDTS.filter(b=>b.op!=='ST'&&b.op!=='pending'&&ops.find(o=>o.id===b.op));
  const absIds = Object.keys(ABSENCES).filter(id=>ABSENCES[id].dates.includes(currentDate));
  const chargeH= bdtOps.reduce((s,b)=>s+b.duree,0);
  const dispOps= ops.filter(o=>!absIds.includes(o.id)).length;
  const capaTot= dispOps*8;
  const taux   = capaTot>0?Math.round(chargeH/capaTot*100):0;
  
  const items = [
    { icon:'fa-clipboard-list', val:bdtOps.filter(b=>b.statut==='programme').length, label:'Programmés',  color:'#3b82f6' },
    { icon:'fa-play-circle',    val:bdtOps.filter(b=>b.statut==='recu').length,      label:'En cours',    color:'#f59e0b' },
    { icon:'fa-check-double',   val:bdtOps.filter(b=>b.statut==='solde').length,     label:'Soldés',      color:'#22c55e' },
    { icon:'fa-inbox',          val:BDTS.filter(b=>b.op==='pending').length,          label:'En attente',  color:'#ef4444' },
    { icon:'fa-industry',       val:BDTS.filter(b=>b.op==='ST').length,              label:'Sous-trait.', color:'#6366f1' },
    { icon:'fa-users',          val:dispOps+'/'+ops.length,                           label:'Opér. dispo', color:'#10b981' },
    { icon:'fa-chart-bar',      val:taux+'%',                                         label:'Charge jour', color:'#f97316' },
  ];
  document.getElementById('statsBar').innerHTML = items.map(s=>\`
    <div class="stat-pill flex flex-col items-center gap-1">
      <i class="fas \${s.icon} text-base" style="color:\${s.color}"></i>
      <div class="text-lg font-black text-gray-900">\${s.val}</div>
      <div class="text-xs text-gray-500 text-center leading-tight">\${s.label}</div>
    </div>
  \`).join('');
}

// ─── PENDING & ST ────────────────────────────────────────────
function buildPending() {
  const p = BDTS.filter(b=>b.op==='pending');
  document.getElementById('cntPend').textContent = p.length;
  document.getElementById('pendingList').innerHTML = p.length
    ? p.map(b=>\`
      <div class="pending-card" draggable="true" ondragstart="dragId='\${b.id}'" id="pend-\${b.id}">
        <div class="w-2 h-8 rounded-full flex-shrink-0" style="background:\${PRIO_COLORS[b.priorite]||'#22c55e'}"></div>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-gray-800">\${b.id} <span class="font-normal text-gray-500">· \${b.operation}</span></div>
          <div class="text-gray-400 text-xs">\${b.client} · \${b.piece} · \${b.duree}h · <span class="\${b.activite==='Seem'?'text-blue-600':'text-pink-600'} font-semibold">\${b.activite}</span></div>
        </div>
        <span class="badge badge-\${b.priorite}">\${b.priorite}</span>
      </div>\`).join('')
    : '<div class="text-center py-5 text-gray-300 text-xs"><i class="fas fa-check-circle text-xl mb-1 block"></i>Tous les BDT sont affectés</div>';
}

function buildST() {
  const s = BDTS.filter(b=>b.op==='ST');
  document.getElementById('cntST').textContent = s.length;
  document.getElementById('stList').innerHTML = s.length
    ? s.map(b=>\`
      <div class="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs">
        <i class="fas fa-industry text-indigo-400 flex-shrink-0"></i>
        <div class="flex-1 min-w-0">
          <div class="font-bold text-indigo-800">\${b.id} · \${b.operation}</div>
          <div class="text-indigo-500">\${b.client} · \${b.piece} · \${b.duree}h prév.</div>
        </div>
        <span class="badge badge-\${b.priorite==='urgent'?'urgent':'st'}">\${b.priorite}</span>
      </div>\`).join('')
    : '<div class="text-center py-3 text-gray-300 text-xs">Aucune ST en cours</div>';
}

// ─── JOURNAL TEMPS ───────────────────────────────────────────
function buildJournal() {
  const soldés = BDTS.filter(b=>b.statut==='solde'||(b.debutReel));
  const tbody = document.getElementById('journalBody');
  tbody.innerHTML = soldés.map(b => {
    const op = OPERATEURS.find(o=>o.id===b.op);
    const ecart = b.tempsReel ? (b.tempsReel-b.tempsAlloue).toFixed(2) : null;
    const ecartCls = ecart===null?'text-gray-400': parseFloat(ecart)>0?'text-red-600 font-bold':parseFloat(ecart)<0?'text-green-600 font-semibold':'text-gray-500';
    return \`<tr class="border-b border-gray-50 \${b.statut==='solde'?'solde-row':''} hover:bg-gray-50/50">
      <td class="py-1.5 pr-3 font-bold text-gray-700">\${b.id}</td>
      <td class="py-1.5 pr-3 text-gray-500">\${op?.nom||'—'}</td>
      <td class="py-1.5 pr-3 text-gray-600">\${b.operation}</td>
      <td class="py-1.5 pr-3 text-gray-400">\${b.client} · \${b.piece}</td>
      <td class="py-1.5 pr-3 text-center \${b.debutReel?'text-gray-700 font-semibold':'text-gray-300'}">\${b.debutReel||'—'}</td>
      <td class="py-1.5 pr-3 text-center \${b.finReel?'text-gray-700 font-semibold':'text-gray-300'}">\${b.finReel||'—'}</td>
      <td class="py-1.5 pr-3 text-center text-gray-600">\${b.tempsAlloue}h</td>
      <td class="py-1.5 pr-3 text-center \${b.tempsReel?'text-gray-800 font-bold':'text-gray-300'}">\${b.tempsReel||'—'}h</td>
      <td class="py-1.5 text-center \${ecartCls}">\${ecart!==null?(parseFloat(ecart)>0?'+':'')+ecart+'h':'—'}</td>
    </tr>\`;
  }).join('');
  if(!soldés.length) tbody.innerHTML = '<tr><td colspan="9" class="text-center py-6 text-gray-300 text-xs">Aucun BDT démarré ou soldé sur cette journée</td></tr>';
}

// ─── TOOLTIP ────────────────────────────────────────────────
function showTT(e, bdt) {
  const op = OPERATEURS.find(o=>o.id===bdt.op);
  const tt = document.getElementById('tooltip');
  tt.style.display='block';
  tt.innerHTML=\`
    <div class="font-bold text-base mb-1">\${bdt.id}</div>
    <div class="text-blue-300 text-xs mb-2">\${bdt.operation} · \${bdt.activite}</div>
    <div class="space-y-0.5 text-xs">
      <div><span class="opacity-60">Client :</span> \${bdt.client}</div>
      <div><span class="opacity-60">Pièce :</span> \${bdt.piece}</div>
      <div><span class="opacity-60">Durée allouée :</span> \${bdt.tempsAlloue}h</div>
      <div><span class="opacity-60">Opérateur :</span> \${op?.nom||'—'}</div>
      <div><span class="opacity-60">Début réel :</span> \${bdt.debutReel||'—'}</div>
      <div><span class="opacity-60">Statut :</span> <strong style="color:\${STATUT_COLORS[bdt.statut]}">\${bdt.statut}</strong></div>
      <div class="mt-1 text-yellow-300 text-xs">Dbl-clic = Soldage · Clic droit = Changer statut</div>
    </div>
  \`;
  moveTT(e);
}
function moveTT(e) { const tt=document.getElementById('tooltip'); tt.style.left=(e.clientX+16)+'px'; tt.style.top=(e.clientY+10)+'px'; }
function hideTT() { document.getElementById('tooltip').style.display='none'; }

// ─── NOTIFICATIONS ────────────────────────────────────────────
function pushNotif(type, icon, msg) {
  const banner=document.getElementById('notifBanner');
  const id='n'+Date.now();
  const d=document.createElement('div');
  d.id=id; d.className='notif notif-'+type;
  d.innerHTML=\`<i class="fas \${icon} mr-2"></i>\${msg}
    <button onclick="this.parentElement.remove()" class="float-right text-gray-400 hover:text-gray-600 ml-2"><i class="fas fa-times"></i></button>\`;
  banner.appendChild(d);
  setTimeout(()=>{const e=document.getElementById(id);if(e){e.style.transition='opacity .4s';e.style.opacity='0';setTimeout(()=>{const e2=document.getElementById(id);if(e2)e2.remove();},400);}},6000);
}

// ─── MODALS ──────────────────────────────────────────────────
function openBdtModal() { document.getElementById('bdtModal').classList.remove('hidden'); }
function openSTModal()  { document.getElementById('stModal').classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function updateOps() {
  const act = document.getElementById('m_activite').value;
  const ops = act==='Seem'?OPS_SEEM:act==='Semrac'?OPS_SEMRAC:[];
  document.getElementById('m_operation').innerHTML = ops.length
    ? ops.map(o=>\`<option>\${o}</option>\`).join('')
    : '<option value="">— Choisir activité —</option>';
  updateOpsEligibles();
}
function updateOpsEligibles() {
  const op=document.getElementById('m_operation').value;
  const act=document.getElementById('m_activite').value;
  const sel=document.getElementById('m_operateur');
  const hint=document.getElementById('compHint');
  if(!op){sel.innerHTML='<option>— Choisir une opération —</option>';hint.textContent='';return;}
  const elig=OPERATEURS.filter(o=>o.activite===act&&o.competences.includes(op)&&!isAbsent(o.id,currentDate));
  const inelig=OPERATEURS.filter(o=>o.activite===act&&!o.competences.includes(op));
  hint.textContent=elig.length?\`✅ \${elig.length} habilité(s)\`:'⚠ Aucun habilité disponible';
  sel.innerHTML=
    (elig.length?'<optgroup label="✅ Habilités">'+elig.map(o=>\`<option value="\${o.id}">\${o.nom} · \${o.poste} (\${SHIFTS[o.shift]?.label||o.shift})</option>\`).join('')+'</optgroup>':'')+
    (inelig.length?'<optgroup label="❌ Non habilités">'+inelig.map(o=>\`<option value="" disabled>\${o.nom} – \${o.competences.join(', ')}</option>\`).join('')+'</optgroup>':'');
}
function toggleST(v) {
  document.getElementById('opWrap').classList.toggle('hidden', v==='st');
  document.getElementById('stWrap').classList.toggle('hidden', v!=='st');
}

function createBDT() {
  const activite=document.getElementById('m_activite').value;
  const operation=document.getElementById('m_operation').value;
  const cmd=document.getElementById('m_cmd').value;
  const client=document.getElementById('m_client').value;
  const piece=document.getElementById('m_piece').value;
  const duree=parseFloat(document.getElementById('m_duree').value)||2;
  const priorite=document.getElementById('m_priorite').value;
  const opId=document.getElementById('m_operateur').value||'pending';
  const type=document.getElementById('m_type').value;
  const debutStr=document.getElementById('m_debut').value||'06:00';
  const debut=parseInt(debutStr.split(':')[0])+parseInt(debutStr.split(':')[1])/60;
  if(!activite||!operation||!cmd||!client||!piece){pushNotif('err','fa-exclamation-circle','Veuillez remplir tous les champs obligatoires.');return;}
  const newId='BDT-'+(200+BDTS.length);
  let finalOp = type==='st'?'ST':(opId||'pending');
  
  if(type==='interne' && opId && opId!=='pending') {
    const op=OPERATEURS.find(o=>o.id===opId);
    if(op && !op.competences.includes(operation)){pushNotif('err','fa-ban',\`\${op.nom} non habilité. BDT mis en attente.\`);finalOp='pending';}
    if(op && isAbsent(opId,currentDate)){pushNotif('warn','fa-calendar-times',\`\${op.nom} absent. BDT mis en attente.\`);finalOp='pending';}
  }
  BDTS.push({id:newId,op:finalOp,cmd,client,piece,operation,duree,debut,priorite,statut:type==='st'?'st':'programme',activite,tempsAlloue:duree,debutReel:null,finReel:null});
  closeModal('bdtModal');
  buildAll();
  if(finalOp!=='pending'&&finalOp!=='ST'){
    const op=OPERATEURS.find(o=>o.id===finalOp);
    pushNotif('ok','fa-check-circle',\`BDT <strong>\${newId}</strong> créé et affecté à <strong>\${op?.nom}</strong>. Notification envoyée.\`);
  } else if(finalOp==='ST'){
    pushNotif('ok','fa-industry',\`BDT ST <strong>\${newId}</strong> créé. Envoi sous-traitant en cours.\`);
  } else {
    pushNotif('warn','fa-inbox',\`BDT <strong>\${newId}</strong> créé – en attente (sans opérateur).\`);
  }
}

function createST() {
  closeModal('stModal');
  pushNotif('ok','fa-paper-plane','Commande sous-traitance créée. Mail sous-traitant envoyé. BC archivé GED SharePoint.');
}

function exportJournal() {
  pushNotif('info','fa-file-excel','Export Excel du journal des temps généré. Fichier envoyé par mail à Sylvie et Lénaïck.');
}

// Lancer
buildAll();
</script>
</body>
</html>`
}

// ══════════════════════════════════════════════════════════════
// PAGE COMPÉTENCES OPÉRATEURS
// §4.8 – Matrice habilitations
// ══════════════════════════════════════════════════════════════
export const pageCompetences = () => {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Compétences Opérateurs · ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>
    ${CSS_COMMUN}
    .comp-cell{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .12s;font-size:.8rem;}
    .comp-cell.on{background:#22c55e;color:white;} .comp-cell.on:hover{background:#16a34a;}
    .comp-cell.off{background:#f1f5f9;color:#d1d5db;border:1.5px dashed #e2e8f0;} .comp-cell.off:hover{background:#dbeafe;border-color:#93c5fd;}
    .level-dot{width:14px;height:14px;border-radius:3px;cursor:pointer;transition:all .1s;}
    .level-dot:hover{opacity:.8;transform:scale(1.15);}
  </style>
</head>
<body class="min-h-screen flex">
${SIDEBAR_AFF('comp')}
<main class="flex-1 p-5 overflow-y-auto">
  <div class="flex items-center justify-between mb-5">
    <div class="flex items-center gap-4">
      <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed)"><i class="fas fa-medal"></i></div>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Compétences & Habilitations</h1>
        <p class="text-gray-400 text-xs">Matrice opérateurs × opérations – contrôle des affectations BDT · Niveaux 1–5</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div class="text-xs text-gray-400 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-amber-700">
        <i class="fas fa-sync-alt mr-1"></i> Modifications synchronisées avec le Gantt d'affectation
      </div>
      <button onclick="saveComps()" class="btn-primary" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);box-shadow:0 2px 8px rgba(139,92,246,.3)">
        <i class="fas fa-save"></i> Enregistrer
      </button>
    </div>
  </div>

  <!-- LÉGENDE -->
  <div class="card p-4 mb-4 flex flex-wrap gap-4 items-center text-sm text-gray-600">
    <span class="flex items-center gap-2"><span class="w-7 h-7 rounded-md bg-green-500 flex items-center justify-center text-white text-xs"><i class="fas fa-check"></i></span> Habilité</span>
    <span class="flex items-center gap-2"><span class="w-7 h-7 rounded-md bg-gray-100 border-2 border-dashed border-gray-300"></span> Non habilité</span>
    <div class="flex items-center gap-1 ml-4">
      <span class="text-xs text-gray-500 mr-1">Niveau :</span>
      ${[1,2,3,4,5].map(l=>`<span class="level-dot" style="background:${l<=2?'#fde68a':l<=3?'#6ee7b7':l<=4?'#60a5fa':'#22c55e'}" title="Niveau ${l}"></span>`).join('')}
      <span class="text-xs text-gray-400 ml-1">1=Débutant → 5=Expert</span>
    </div>
    <div class="flex-1"></div>
    <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Seem</span>
    <span class="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700">Semrac</span>
  </div>

  ${['Seem','Semrac'].map(act => {
    const ops_list = act==='Seem' ? OPS_SEEM : OPS_SEMRAC
    const oprs = OPERATEURS.filter(o=>o.activite===act)
    return `<div class="card p-4 mb-4 overflow-x-auto">
      <div class="flex items-center gap-3 mb-4">
        <span class="px-3 py-1 rounded-full text-sm font-bold ${act==='Seem'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700'}">${act}</span>
        <h2 class="font-bold text-gray-800">Matrice des compétences – ${act}</h2>
        <span class="text-xs text-gray-400 ml-auto">${oprs.length} opérateur(s) · ${ops_list.length} opération(s)</span>
      </div>
      <table class="border-collapse">
        <thead>
          <tr>
            <th class="text-left text-xs font-semibold text-gray-500 pr-5 pb-3 min-w-40">Opérateur</th>
            ${ops_list.map(op=>`<th class="text-center pb-3 px-1" style="min-width:38px;"><div class="text-xs font-semibold text-gray-600 whitespace-nowrap" style="writing-mode:vertical-rl;transform:rotate(180deg);max-height:80px;font-size:.62rem">${op}</div></th>`).join('')}
            <th class="text-left text-xs font-semibold text-gray-500 pl-5 pb-3">Niveaux de maîtrise</th>
          </tr>
        </thead>
        <tbody>
          ${oprs.map(opr=>`
          <tr class="border-t border-gray-50 hover:bg-gray-50/50">
            <td class="py-2 pr-5">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style="background:${act==='Seem'?'#3b82f6':'#ec4899'}">${opr.nom.charAt(0)}</div>
                <div>
                  <div class="text-xs font-bold text-gray-800">${opr.nom}</div>
                  <div class="text-xs text-gray-400">${opr.poste} · <span class="font-semibold">${SHIFTS[opr.shift]?.label||opr.shift}</span></div>
                </div>
              </div>
            </td>
            ${ops_list.map(op=>{
              const has=opr.competences.includes(op)
              return `<td class="text-center py-2 px-1">
                <div class="comp-cell ${has?'on':'off'} mx-auto" onclick="toggleComp(this,'${opr.id}','${op}')" title="${has?'✅ Habilité':'❌ Non habilité'} – ${op}">
                  ${has?'<i class="fas fa-check"></i>':'<i class="fas fa-times text-gray-300"></i>'}
                </div>
              </td>`
            }).join('')}
            <td class="py-2 pl-5">
              <div class="space-y-1">
                ${opr.competences.map(c=>`
                <div class="flex items-center gap-2 text-xs">
                  <span class="text-gray-500 w-36 truncate" title="${c}">${c}</span>
                  <div class="flex gap-0.5">
                    ${[1,2,3,4,5].map(l=>`<div class="level-dot" style="background:${l<=3?(l<=1?'#fde68a':l<=2?'#86efac':'#60a5fa'):'#22c55e'};opacity:${l<=3?1:.3}" onclick="setLevel(this,'${opr.id}','${c}',${l})" title="Niveau ${l}"></div>`).join('')}
                  </div>
                </div>`).join('')}
              </div>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`
  }).join('')}

  <!-- AJOUT OPÉRATEUR -->
  <div class="card p-4">
    <h3 class="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2"><i class="fas fa-user-plus text-violet-500"></i> Ajouter / Modifier un opérateur</h3>
    <div class="grid grid-cols-4 gap-3">
      <div><label class="form-label">Nom</label><input type="text" placeholder="Prénom N." class="form-input"/></div>
      <div><label class="form-label">Poste</label><input type="text" placeholder="Ex : Pliage Semrac" class="form-input"/></div>
      <div><label class="form-label">Activité</label><select class="form-input"><option>Seem</option><option>Semrac</option></select></div>
      <div><label class="form-label">Shift par défaut</label>
        <select class="form-input">
          ${Object.entries(SHIFTS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="mt-3 flex justify-end">
      <button onclick="pushNotif('ok','fa-user-plus','Opérateur ajouté. Accès ERP créé. Notification RH envoyée.')" class="btn-primary">
        <i class="fas fa-plus"></i> Ajouter l'opérateur
      </button>
    </div>
  </div>
</main>

<div class="notif-banner" id="notifBanner"></div>

<script>
const SHIFTS=${JSON.stringify(SHIFTS)};
function toggleComp(cell, opId, op) {
  const isOn=cell.classList.contains('on');
  cell.classList.toggle('on',!isOn); cell.classList.toggle('off',isOn);
  cell.innerHTML=isOn?'<i class="fas fa-times text-gray-300"></i>':'<i class="fas fa-check"></i>';
}
function setLevel(dot, opId, op, level) {
  const row=dot.closest('div.flex');
  const dots=row.querySelectorAll('.level-dot');
  dots.forEach((d,i)=>{ d.style.opacity=(i<level?1:.3); });
}
function saveComps() { pushNotif('ok','fa-save','Compétences enregistrées. Affectations BDT recalculées automatiquement.'); }
function pushNotif(type, icon, msg) {
  const banner=document.getElementById('notifBanner');
  const id='n'+Date.now();
  const d=document.createElement('div');
  d.id=id; d.className='notif notif-'+type;
  d.innerHTML=\`<i class="fas \${icon} mr-2"></i>\${msg}<button onclick="this.parentElement.remove()" class="float-right ml-2 text-gray-400"><i class="fas fa-times"></i></button>\`;
  banner.appendChild(d);
  setTimeout(()=>{const e=document.getElementById(id);if(e){e.style.opacity='0';setTimeout(()=>{const e2=document.getElementById(id);if(e2)e2.remove();},400);}},5000);
}
</script>
</body></html>`
}

// ══════════════════════════════════════════════════════════════
// PAGE HORAIRES RH
// §4.16 – Pointage / Disponibilités
// ══════════════════════════════════════════════════════════════
export const pageHoraires = () => {
  const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Horaires & Disponibilités · ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>
    ${CSS_COMMUN}
    .shift-pill{border-radius:8px;padding:5px 8px;font-size:.7rem;font-weight:700;cursor:pointer;border:2px solid transparent;transition:all .12s;text-align:center;}
    .shift-pill.matin{background:#dbeafe;color:#1d4ed8;border-color:#93c5fd;}
    .shift-pill.apmidi{background:#ede9fe;color:#5b21b6;border-color:#c4b5fd;}
    .shift-pill.soir{background:#1e293b;color:#94a3b8;border-color:#334155;}
    .shift-pill.journee{background:#dcfce7;color:#15803d;border-color:#86efac;}
    .shift-pill.conge{background:#fef2f2;color:#b91c1c;border-color:#fca5a5;}
    .shift-pill.off{background:#f8fafc;color:#94a3b8;border-color:#e2e8f0;}
  </style>
</head>
<body class="min-h-screen flex">
${SIDEBAR_AFF('hor')}
<main class="flex-1 p-5 overflow-y-auto">
  <div class="flex items-center justify-between mb-5">
    <div class="flex items-center gap-4">
      <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg" style="background:linear-gradient(135deg,#14b8a6,#0d9488)"><i class="fas fa-business-time"></i></div>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Horaires & Disponibilités</h1>
        <p class="text-gray-400 text-xs">Shifts, congés et absences – synchronisé avec le Gantt BDT · Alerte auto si BDT affecté</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <a href="/production/affectation" class="btn-secondary text-xs"><i class="fas fa-project-diagram text-orange-500 mr-1"></i>Voir Gantt</a>
      <button onclick="saveAll()" class="btn-primary" style="background:linear-gradient(135deg,#14b8a6,#0d9488);box-shadow:0 2px 8px rgba(20,184,166,.3)">
        <i class="fas fa-save"></i> Enregistrer
      </button>
    </div>
  </div>

  <!-- LÉGENDE -->
  <div class="card p-3 mb-4 flex flex-wrap gap-3 items-center">
    <span class="shift-pill matin"><i class="fas fa-sun mr-1"></i>Matin 6h–14h</span>
    <span class="shift-pill apmidi"><i class="fas fa-cloud-sun mr-1"></i>Après-midi 14h–22h</span>
    <span class="shift-pill soir"><i class="fas fa-moon mr-1"></i>Soirée/Nuit</span>
    <span class="shift-pill journee"><i class="fas fa-briefcase mr-1"></i>Journée 7h–17h</span>
    <span class="shift-pill conge"><i class="fas fa-umbrella-beach mr-1"></i>Congé/Absence</span>
    <span class="shift-pill off"><i class="fas fa-bed mr-1"></i>Repos</span>
    <div class="flex-1"></div>
    <div class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
      <i class="fas fa-sync-alt mr-1"></i> Modification → alerte si BDT affectés · Synchronisé RH Silae
    </div>
  </div>

  <!-- GRILLES PAR OPÉRATEUR -->
  ${OPERATEURS.map(op => {
    const absInfo = ABSENCES[op.id]
    const absent  = !!absInfo
    return `<div class="card p-4 mb-3" id="card-${op.id}">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style="background:${op.activite==='Seem'?'#3b82f6':'#ec4899'}">${op.nom.charAt(0)}</div>
          <div>
            <div class="font-bold text-gray-900">${op.nom}</div>
            <div class="text-xs text-gray-400">${op.poste} · <span class="${op.activite==='Seem'?'text-blue-600':'text-pink-600'} font-semibold">${op.activite}</span> · Shift : <span class="font-semibold">${SHIFTS[op.shift]?.label}</span></div>
          </div>
          ${absent?`<span class="badge badge-critique ml-2"><i class="fas fa-ban mr-1"></i>${absInfo.type}</span>`:''}
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400">Shift défaut :</span>
          <select class="form-input w-40 text-xs" onchange="updateShiftDef('${op.id}',this.value)">
            ${Object.entries(SHIFTS).map(([k,v])=>`<option value="${k}" ${op.shift===k?'selected':''}>${v.label}</option>`).join('')}
          </select>
          <button onclick="applyWeek('${op.id}')" class="btn-secondary text-xs"><i class="fas fa-copy mr-1"></i>Toute la semaine</button>
        </div>
      </div>
      <!-- Semaine -->
      <div class="grid grid-cols-7 gap-2 mb-3">
        ${JOURS.map((j,i)=>{
          const isWE=i>=5
          const isAbs=absInfo?.dates?.length>0 && i<3
          const sh=isWE?'off':isAbs?'conge':op.shift
          const icons={matin:'fa-sun',apmidi:'fa-cloud-sun',soir:'fa-moon',journee:'fa-briefcase',conge:'fa-umbrella-beach',off:'fa-bed'}
          const labels={matin:'Matin',apmidi:'Après-midi',soir:'Soirée',journee:'Journée',conge:'Congé',off:'Repos'}
          return `<div class="text-center">
            <div class="text-xs font-semibold text-gray-500 mb-1">${j.slice(0,3)}</div>
            <div class="shift-pill ${sh}" id="${op.id}-${j}" onclick="cycleShift('${op.id}','${j}',this)" title="Cliquer pour changer">
              <i class="fas ${(icons as Record<string,string>)[sh]||'fa-sun'}"></i>
              <div class="text-xs mt-0.5">${(labels as Record<string,string>)[sh]||sh}</div>
            </div>
          </div>`
        }).join('')}
      </div>
      <!-- Absences -->
      <div class="border-t border-gray-100 pt-2.5">
        <div class="flex items-center justify-between mb-1.5">
          <div class="text-xs font-bold text-gray-600 uppercase tracking-wide">Absences & Congés déclarés</div>
          <button onclick="addAbsForm('${op.id}')" class="text-xs text-red-600 hover:underline font-semibold"><i class="fas fa-plus mr-1"></i>Ajouter</button>
        </div>
        <div id="abs-${op.id}" class="space-y-1">
          ${absent && absInfo ? absInfo.dates.map(d=>`
          <div class="flex items-center gap-2 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
            <i class="fas fa-calendar-times text-red-400"></i>
            <span class="font-semibold text-red-700">${absInfo.type}</span>
            <span class="text-red-500">${d}</span>
            <span class="ml-auto text-red-300 cursor-pointer hover:text-red-500" onclick="removeAbs(this,'${op.id}','${d}')"><i class="fas fa-times"></i></span>
          </div>`).join('') : '<div class="text-xs text-gray-300 italic">Aucune absence déclarée</div>'}
        </div>
        <div id="form-abs-${op.id}" class="hidden mt-2 grid grid-cols-3 gap-2">
          <select id="abstype-${op.id}" class="form-input text-xs">
            <option>Congé payé</option><option>RTT</option><option>Maladie</option>
            <option>Congé sans solde</option><option>Événement familial</option><option>Formation</option>
          </select>
          <input type="date" id="absdate-${op.id}" class="form-input text-xs"/>
          <button onclick="confirmAbs('${op.id}')" class="bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold px-2">Confirmer</button>
        </div>
      </div>
    </div>`
  }).join('')}
</main>

<div class="notif-banner" id="notifBanner"></div>
<script>
const SHIFTS=${JSON.stringify(SHIFTS)};
const CYCLE=['matin','apmidi','soir','journee','conge','off'];
const ICONS={matin:'fa-sun',apmidi:'fa-cloud-sun',soir:'fa-moon',journee:'fa-briefcase',conge:'fa-umbrella-beach',off:'fa-bed'};
const LABELS={matin:'Matin',apmidi:'Après-midi',soir:'Soirée',journee:'Journée',conge:'Congé',off:'Repos'};

function cycleShift(opId,jour,el){
  const cur=CYCLE.find(s=>el.classList.contains(s))||'matin';
  const next=CYCLE[(CYCLE.indexOf(cur)+1)%CYCLE.length];
  CYCLE.forEach(s=>el.classList.remove(s));
  el.classList.add(next);
  el.innerHTML=\`<i class="fas \${ICONS[next]}"></i><div class="text-xs mt-0.5">\${LABELS[next]}</div>\`;
  if(next==='conge'||next==='off') checkBDTAlert(opId,jour);
}
function checkBDTAlert(opId,jour){
  pushNotif('warn','fa-exclamation-triangle',\`Opérateur déclaré absent (\${jour}). Vérifiez les BDT affectés – réaffectation peut être nécessaire.\`);
}
function applyWeek(opId){
  const sel=document.querySelector(\`[onchange*="\${opId}"]\`);
  const sh=sel?.value||'matin';
  ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'].forEach(j=>{
    const el=document.getElementById(opId+'-'+j);
    if(!el)return;
    CYCLE.forEach(s=>el.classList.remove(s));
    el.classList.add(sh);
    el.innerHTML=\`<i class="fas \${ICONS[sh]}"></i><div class="text-xs mt-0.5">\${LABELS[sh]}</div>\`;
  });
  pushNotif('ok','fa-copy','Shift appliqué sur toute la semaine ouvrée.');
}
function updateShiftDef(opId,v){pushNotif('ok','fa-check','Shift par défaut mis à jour. Gantt recalculé.');}
function addAbsForm(opId){document.getElementById('form-abs-'+opId).classList.toggle('hidden');}
function confirmAbs(opId){
  const type=document.getElementById('abstype-'+opId).value;
  const date=document.getElementById('absdate-'+opId).value;
  if(!date)return;
  const container=document.getElementById('abs-'+opId);
  const empty=container.querySelector('.italic');if(empty)empty.remove();
  const div=document.createElement('div');
  div.className='flex items-center gap-2 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-1.5';
  div.innerHTML=\`<i class="fas fa-calendar-times text-red-400"></i><span class="font-semibold text-red-700">\${type}</span><span class="text-red-500">\${date}</span><span class="ml-auto text-red-300 cursor-pointer hover:text-red-500" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></span>\`;
  container.appendChild(div);
  document.getElementById('form-abs-'+opId).classList.add('hidden');
  pushNotif('warn','fa-calendar-times',\`Absence déclarée le \${date}. BDT affectés à vérifier dans le Gantt. Alerte envoyée à Sylvie.\`);
}
function removeAbs(el,opId,date){
  el.parentElement.remove();
  pushNotif('ok','fa-check','Absence supprimée. Opérateur remis disponible dans le Gantt.');
}
function saveAll(){pushNotif('ok','fa-save','Horaires enregistrés. Synchronisation Gantt & RH Silae effectuée.');}
function pushNotif(type,icon,msg){
  const banner=document.getElementById('notifBanner');
  const id='n'+Date.now();
  const d=document.createElement('div');
  d.id=id;d.className='notif notif-'+type;
  d.innerHTML=\`<i class="fas \${icon} mr-2"></i>\${msg}<button onclick="this.parentElement.remove()" class="float-right ml-2 text-gray-400"><i class="fas fa-times"></i></button>\`;
  banner.appendChild(d);
  setTimeout(()=>{const e=document.getElementById(id);if(e){e.style.opacity='0';setTimeout(()=>{const e2=document.getElementById(id);if(e2)e2.remove();},400);}},5000);
}
</script>
</body></html>`
}
