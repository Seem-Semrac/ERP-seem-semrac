// ══════════════════════════════════════════════════════════════
// MODULE GESTION DE STOCK & INCRÉMENTATION MATIÈRE
// Conforme cahier des charges §4.2 (vérif stock BE), §4.6 (achat)
// ══════════════════════════════════════════════════════════════

const CSS_STOCK = `
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
  .tab-btn.active{background:#22c55e;color:white;}
  .tab-btn:not(.active):hover{background:#f1f5f9;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:500;}
  .modal-box{background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:640px;margin:1rem;overflow:hidden;max-height:90vh;overflow-y:auto;}
  .btn-primary{display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1.25rem;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border-radius:10px;font-size:.82rem;font-weight:700;border:none;cursor:pointer;transition:all .15s;box-shadow:0 2px 8px rgba(34,197,94,.3);}
  .btn-primary:hover{transform:translateY(-1px);}
  .btn-secondary{display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1.1rem;background:white;color:#374151;border-radius:10px;font-size:.82rem;font-weight:600;border:1px solid #e2e8f0;cursor:pointer;transition:all .15s;}
  .btn-secondary:hover{background:#f8fafc;}
  .stock-ok{background:#f0fdf4;border-left:3px solid #22c55e;}
  .stock-warn{background:#fffbeb;border-left:3px solid #f59e0b;}
  .stock-crit{background:#fef2f2;border-left:3px solid #ef4444;}
  .progress-bar{height:6px;border-radius:999px;background:#e2e8f0;overflow:hidden;}
  .progress-fill{height:100%;border-radius:999px;transition:width .3s;}
  tr.hover-row:hover{background:#f8fafc;}
  .badge{border-radius:999px;padding:2px 8px;font-size:.62rem;font-weight:700;}
  .badge-ok{background:#dcfce7;color:#166534;}
  .badge-warn{background:#fef9c3;color:#854d0e;}
  .badge-crit{background:#fee2e2;color:#991b1b;}
  .badge-cmd{background:#dbeafe;color:#1e40af;}
`

const SIDEBAR_STOCK = (active='') => `
<aside class="w-64 min-h-screen flex-shrink-0 text-white flex flex-col" style="background:linear-gradient(170deg,#0f172a 0%,#064e3b 50%,#1e293b 100%)">
  <div class="p-4 border-b border-white/10">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black" style="background:linear-gradient(135deg,#22c55e,#16a34a)">
        <i class="fas fa-warehouse text-sm"></i>
      </div>
      <div>
        <div class="font-bold text-sm">Gestion de Stock</div>
        <div class="text-xs text-green-300">Seem Semrac ERP</div>
      </div>
    </div>
  </div>
  <nav class="flex-1 p-3 space-y-0.5 text-sm">
    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">MATIÈRES</div>
    <a href="/stock" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='stock'?'bg-white/15 border-l-4 border-green-400 pl-2':'hover:bg-white/8'} text-slate-200 text-xs">
      <i class="fas fa-boxes w-4 text-green-400"></i> Tableau de bord Stock
    </a>
    <a href="/stock/entrees" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='entrees'?'bg-white/15 border-l-4 border-green-400 pl-2':'hover:bg-white/8'} text-slate-200 text-xs">
      <i class="fas fa-arrow-circle-down w-4 text-green-400"></i> Entrées matière
    </a>
    <a href="/stock/sorties" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='sorties'?'bg-white/15 border-l-4 border-green-400 pl-2':'hover:bg-white/8'} text-slate-200 text-xs">
      <i class="fas fa-arrow-circle-up w-4 text-orange-400"></i> Sorties / Consommation
    </a>
    <a href="/stock/alertes" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='alertes'?'bg-white/15 border-l-4 border-red-400 pl-2':'hover:bg-white/8'} text-slate-200 text-xs">
      <i class="fas fa-exclamation-triangle w-4 text-red-400"></i> Alertes & Réappros
    </a>
    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mt-2">NAVIGATION</div>
    <a href="/" class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/8 text-slate-400 text-xs">
      <i class="fas fa-arrow-left w-4"></i> Accueil
    </a>
    <a href="/achats/demande" class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/8 text-slate-400 text-xs">
      <i class="fas fa-shopping-cart w-4 text-amber-300"></i> Demandes d'achat
    </a>
    <a href="/production/affectation" class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/8 text-slate-400 text-xs">
      <i class="fas fa-project-diagram w-4 text-orange-300"></i> Planning Production
    </a>
    <a href="/finances/couts" class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/8 text-slate-400 text-xs">
      <i class="fas fa-euro-sign w-4 text-yellow-300"></i> Finances / Coûts
    </a>
  </nav>
  <div class="p-3 border-t border-white/10 text-xs text-slate-500 text-center">Maquette ERP 2026 v2.0</div>
</aside>`

// ─── DONNÉES STOCK ─────────────────────────────────────────────
const MATIERES = [
  // SEEM – Aluminium / barres
  { id:'MAT-001', ref:'AL6060-D30',    libelle:'Barre aluminium 6060 Ø30mm',   famille:'Aluminium', activite:'Seem',   unite:'kg',  stock:485,  mini:100, maxi:800,  en_cde:200,  fournisseur:'Metalium SA',      pu_ht:4.20, lieu:'A1-01' },
  { id:'MAT-002', ref:'AL6060-D50',    libelle:'Barre aluminium 6060 Ø50mm',   famille:'Aluminium', activite:'Seem',   unite:'kg',  stock:210,  mini:150, maxi:600,  en_cde:0,    fournisseur:'Metalium SA',      pu_ht:4.50, lieu:'A1-02' },
  { id:'MAT-003', ref:'AL6082-D80',    libelle:'Barre aluminium 6082 Ø80mm',   famille:'Aluminium', activite:'Seem',   unite:'kg',  stock:72,   mini:100, maxi:500,  en_cde:150,  fournisseur:'Euraluminium',     pu_ht:5.10, lieu:'A1-03' },
  { id:'MAT-004', ref:'AL-PLQ-3mm',    libelle:'Plaque aluminium 3mm 1000×2000',famille:'Aluminium',activite:'Seem',   unite:'m²', stock:18,   mini:10,  maxi:50,   en_cde:0,    fournisseur:'Metalium SA',      pu_ht:28.00,lieu:'A2-01' },
  { id:'MAT-005', ref:'AL-PLQ-5mm',    libelle:'Plaque aluminium 5mm 1000×2000',famille:'Aluminium',activite:'Seem',   unite:'m²', stock:5,    mini:8,   maxi:40,   en_cde:20,   fournisseur:'Euraluminium',     pu_ht:38.00,lieu:'A2-02' },
  // SEEM – Consommables
  { id:'MAT-006', ref:'HUILE-CNC-5L',  libelle:'Huile de coupe CNC 5L',        famille:'Consommable',activite:'Seem',  unite:'L',  stock:45,   mini:20,  maxi:100,  en_cde:0,    fournisseur:'Chimilub',         pu_ht:22.00,lieu:'C1-01' },
  { id:'MAT-007', ref:'PLAQ-CARBURE',  libelle:'Plaquettes carbure (boîte 10)', famille:'Outillage', activite:'Seem',  unite:'bte',stock:8,    mini:5,   maxi:30,   en_cde:10,   fournisseur:'Sandvik Coromant', pu_ht:85.00,lieu:'O1-01' },
  // SEMRAC – Tôlerie
  { id:'MAT-008', ref:'TOLE-INOX-1.5', libelle:'Tôle inox 304 1.5mm 1250×2500',famille:'Tôle',     activite:'Semrac', unite:'m²', stock:32,   mini:20,  maxi:100,  en_cde:0,    fournisseur:'Acerinox France',  pu_ht:42.00,lieu:'B1-01' },
  { id:'MAT-009', ref:'TOLE-GALVA-2',  libelle:'Tôle galvanisée 2mm 1250×2500',famille:'Tôle',     activite:'Semrac', unite:'m²', stock:12,   mini:25,  maxi:120,  en_cde:50,   fournisseur:'Tata Steel',       pu_ht:18.50,lieu:'B1-02' },
  { id:'MAT-010', ref:'TOLE-ACIER-3',  libelle:'Tôle acier S235 3mm 1500×3000',famille:'Tôle',     activite:'Semrac', unite:'m²', stock:45,   mini:15,  maxi:80,   en_cde:0,    fournisseur:'Tata Steel',       pu_ht:14.20,lieu:'B1-03' },
  { id:'MAT-011', ref:'TUBE-CARRE-40', libelle:'Tube carré acier 40×40×2mm',    famille:'Profilé',  activite:'Semrac', unite:'ml', stock:78,   mini:50,  maxi:200,  en_cde:0,    fournisseur:'Profiltech',       pu_ht:3.80, lieu:'B2-01' },
  { id:'MAT-012', ref:'FIL-SOUDER',    libelle:'Fil à souder MIG ER70S 0.8mm',  famille:'Consommable',activite:'Semrac',unite:'kg',stock:23,   mini:10,  maxi:50,   en_cde:0,    fournisseur:'Air Liquide',      pu_ht:6.50, lieu:'C2-01' },
  { id:'MAT-013', ref:'DISQUE-DECOUPE',libelle:'Disque découpe inox Ø125mm',    famille:'Consommable',activite:'Semrac',unite:'pc',stock:42,   mini:20,  maxi:100,  en_cde:50,   fournisseur:'Norton',           pu_ht:1.80, lieu:'C2-02' },
  // Commun
  { id:'MAT-014', ref:'EMBAL-CARTON',  libelle:'Carton emballage 400×300×200',  famille:'Emballage', activite:'Commun',unite:'pc',stock:186,  mini:50,  maxi:500,  en_cde:0,    fournisseur:'Raja',             pu_ht:0.85, lieu:'E1-01' },
  { id:'MAT-015', ref:'FILM-BUBBLE',   libelle:'Film bulle 50cm×100m',          famille:'Emballage', activite:'Commun',unite:'rl',stock:4,    mini:5,   maxi:20,   en_cde:0,    fournisseur:'Raja',             pu_ht:18.00,lieu:'E1-02' },
]

const MOUVEMENTS = [
  { id:'MOV-001', type:'entree', mat:'MAT-001', qte:200, date:'2026-03-08', ref:'BC-2024-089', motif:'Réapprovisionnement fournisseur', user:'Morgane', cmd:'CMD-081' },
  { id:'MOV-002', type:'sortie', mat:'MAT-001', qte:45,  date:'2026-03-09', ref:'BDT-091',     motif:'Consommation production Seem', user:'Antoine D.', cmd:'CMD-081' },
  { id:'MOV-003', type:'sortie', mat:'MAT-008', qte:8,   date:'2026-03-09', ref:'BDT-093',     motif:'Consommation tôlerie Semrac',  user:'Marc T.',    cmd:'CMD-083' },
  { id:'MOV-004', type:'entree', mat:'MAT-009', qte:50,  date:'2026-03-10', ref:'BC-2024-090', motif:'Réapprovisionnement fournisseur', user:'Morgane', cmd:null },
  { id:'MOV-005', type:'ajust',  mat:'MAT-003', qte:-5,  date:'2026-03-07', ref:'INV-2026-01', motif:'Ajustement inventaire – écart constaté', user:'Lénaïck', cmd:null },
  { id:'MOV-006', type:'sortie', mat:'MAT-012', qte:3,   date:'2026-03-09', ref:'BDT-097',     motif:'Consommation soudure Semrac',  user:'Julien M.',  cmd:'CMD-087' },
]

// ══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE STOCK
// ══════════════════════════════════════════════════════════════
export const pageStock = () => {
  const alertesCrit = MATIERES.filter(m=>m.stock < m.mini)
  const alertesWarn = MATIERES.filter(m=>m.stock >= m.mini && m.stock < m.mini*1.5)
  const valeurTotale = MATIERES.reduce((s,m)=>s+m.stock*m.pu_ht,0)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Gestion de Stock · ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>${CSS_STOCK}</style>
</head>
<body class="min-h-screen flex">
${SIDEBAR_STOCK('stock')}

<main class="flex-1 overflow-y-auto">
  <!-- HEADER -->
  <div class="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white" style="background:linear-gradient(135deg,#22c55e,#16a34a)">
        <i class="fas fa-warehouse"></i>
      </div>
      <div>
        <h1 class="text-lg font-bold text-gray-900">Gestion de Stock – Matières & Consommables</h1>
        <p class="text-gray-400 text-xs">Seem + Semrac · Alertes automatiques · Connecté achats & production</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <a href="/stock/entrees"><button class="tab-btn text-xs">Entrées</button></a>
      <a href="/stock/sorties"><button class="tab-btn text-xs">Sorties</button></a>
      <a href="/stock/alertes"><button class="tab-btn text-xs">Alertes</button></a>
      <button onclick="openEntreeModal()" class="btn-primary text-xs"><i class="fas fa-plus"></i> Entrée matière</button>
      <button onclick="openSortieModal()" class="btn-primary text-xs" style="background:linear-gradient(135deg,#f97316,#ea580c);box-shadow:0 2px 8px rgba(234,88,12,.3)"><i class="fas fa-minus"></i> Sortie</button>
    </div>
  </div>

  <div class="p-4">
    <!-- KPIs -->
    <div class="grid grid-cols-5 gap-3 mb-4">
      <div class="card p-4 text-center">
        <i class="fas fa-boxes text-2xl text-green-500 mb-1"></i>
        <div class="text-2xl font-black text-gray-900">${MATIERES.length}</div>
        <div class="text-xs text-gray-500">Références actives</div>
      </div>
      <div class="card p-4 text-center">
        <i class="fas fa-exclamation-triangle text-2xl text-red-500 mb-1"></i>
        <div class="text-2xl font-black text-red-600">${alertesCrit.length}</div>
        <div class="text-xs text-gray-500">Stock critique</div>
      </div>
      <div class="card p-4 text-center">
        <i class="fas fa-exclamation-circle text-2xl text-amber-500 mb-1"></i>
        <div class="text-2xl font-black text-amber-600">${alertesWarn.length}</div>
        <div class="text-xs text-gray-500">Seuil bas</div>
      </div>
      <div class="card p-4 text-center">
        <i class="fas fa-truck text-2xl text-blue-500 mb-1"></i>
        <div class="text-2xl font-black text-gray-900">${MATIERES.filter(m=>m.en_cde>0).length}</div>
        <div class="text-xs text-gray-500">Commandes en cours</div>
      </div>
      <div class="card p-4 text-center">
        <i class="fas fa-euro-sign text-2xl text-indigo-500 mb-1"></i>
        <div class="text-xl font-black text-gray-900">${valeurTotale.toLocaleString('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0})}</div>
        <div class="text-xs text-gray-500">Valeur stock totale</div>
      </div>
    </div>

    <!-- ALERTES CRITIQUES -->
    ${alertesCrit.length > 0 ? `
    <div class="card p-4 mb-4 border-l-4 border-red-500 bg-red-50">
      <div class="flex items-center gap-2 mb-2">
        <i class="fas fa-bell text-red-500"></i>
        <h3 class="font-bold text-red-700 text-sm">⚠ Alertes stock critique – Demandes d'achat générées automatiquement</h3>
      </div>
      <div class="grid grid-cols-3 gap-2">
        ${alertesCrit.map(m=>`
        <div class="bg-white rounded-xl p-3 border border-red-200 text-xs">
          <div class="font-bold text-gray-800">${m.ref}</div>
          <div class="text-gray-500 mb-1.5">${m.libelle}</div>
          <div class="flex items-center justify-between">
            <span class="text-red-600 font-bold">${m.stock} ${m.unite}</span>
            <span class="text-gray-400">/ mini ${m.mini} ${m.unite}</span>
          </div>
          <div class="progress-bar mt-1.5"><div class="progress-fill" style="width:${Math.round(m.stock/m.maxi*100)}%;background:#ef4444;"></div></div>
          <button onclick="genDA('${m.id}')" class="mt-2 w-full text-xs bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg py-1 transition">
            <i class="fas fa-file-alt mr-1"></i>Générer DA automatique
          </button>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- FILTRES -->
    <div class="flex items-center gap-2 mb-3 flex-wrap">
      <div class="flex gap-0.5 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
        <button onclick="setFilt('all')" id="filt-all" class="tab-btn active text-xs px-2.5 py-1">Tous</button>
        <button onclick="setFilt('Seem')" id="filt-Seem" class="tab-btn text-xs px-2.5 py-1">Seem</button>
        <button onclick="setFilt('Semrac')" id="filt-Semrac" class="tab-btn text-xs px-2.5 py-1">Semrac</button>
        <button onclick="setFilt('Commun')" id="filt-Commun" class="tab-btn text-xs px-2.5 py-1">Commun</button>
      </div>
      <div class="flex gap-0.5 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
        <button onclick="setFiltFam('all')" id="ff-all" class="tab-btn active text-xs px-2.5 py-1">Toutes familles</button>
        <button onclick="setFiltFam('Aluminium')" id="ff-Aluminium" class="tab-btn text-xs px-2.5 py-1">Aluminium</button>
        <button onclick="setFiltFam('Tôle')" id="ff-Tôle" class="tab-btn text-xs px-2.5 py-1">Tôle</button>
        <button onclick="setFiltFam('Outillage')" id="ff-Outillage" class="tab-btn text-xs px-2.5 py-1">Outillage</button>
        <button onclick="setFiltFam('Consommable')" id="ff-Consommable" class="tab-btn text-xs px-2.5 py-1">Consommable</button>
      </div>
      <input type="text" id="searchStock" placeholder="Rechercher référence, libellé…" oninput="filterTable()" class="form-input w-56 text-xs"/>
      <div class="flex-1"></div>
      <button onclick="exportStock()" class="btn-secondary text-xs"><i class="fas fa-file-excel mr-1 text-green-600"></i>Export Excel</button>
    </div>

    <!-- TABLEAU STOCK -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-xs" id="stockTable">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Référence</th>
              <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Libellé</th>
              <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Famille</th>
              <th class="text-center px-3 py-2.5 text-gray-500 font-semibold">Activité</th>
              <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">Stock actuel</th>
              <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">Mini</th>
              <th class="text-center px-3 py-2.5 text-gray-500 font-semibold">Niveau</th>
              <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">En commande</th>
              <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">PU HT</th>
              <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">Valeur</th>
              <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Lieu</th>
              <th class="text-center px-3 py-2.5 text-gray-500 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody id="stockBody">
            ${MATIERES.map(m => {
              const pct = Math.round(m.stock/m.maxi*100)
              const statusClass = m.stock < m.mini ? 'stock-crit' : m.stock < m.mini*1.5 ? 'stock-warn' : 'stock-ok'
              const badgeCls    = m.stock < m.mini ? 'badge-crit' : m.stock < m.mini*1.5 ? 'badge-warn' : 'badge-ok'
              const badgeTxt    = m.stock < m.mini ? 'CRITIQUE' : m.stock < m.mini*1.5 ? 'BAS' : 'OK'
              const valeur      = (m.stock * m.pu_ht).toLocaleString('fr-FR',{style:'currency',currency:'EUR'})
              return `<tr class="border-b border-gray-50 hover-row ${statusClass}" data-activite="${m.activite}" data-famille="${m.famille}" data-search="${m.ref.toLowerCase()} ${m.libelle.toLowerCase()}">
                <td class="px-3 py-2 font-bold text-gray-700">${m.ref}</td>
                <td class="px-3 py-2 text-gray-600 max-w-xs truncate" title="${m.libelle}">${m.libelle}</td>
                <td class="px-3 py-2 text-gray-500">${m.famille}</td>
                <td class="px-3 py-2 text-center">
                  <span class="badge ${m.activite==='Seem'?'badge-cmd':m.activite==='Semrac'?'':'badge-ok'}" style="${m.activite==='Semrac'?'background:#fce7f3;color:#831843;border:1px solid #f9a8d4':''}">
                    ${m.activite}
                  </span>
                </td>
                <td class="px-3 py-2 text-right font-bold text-gray-800">${m.stock} ${m.unite}</td>
                <td class="px-3 py-2 text-right text-gray-400">${m.mini} ${m.unite}</td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <div class="progress-bar flex-1" style="min-width:60px">
                      <div class="progress-fill" style="width:${pct}%;background:${m.stock<m.mini?'#ef4444':m.stock<m.mini*1.5?'#f59e0b':'#22c55e'}"></div>
                    </div>
                    <span class="badge ${badgeCls} flex-shrink-0">${badgeTxt}</span>
                  </div>
                </td>
                <td class="px-3 py-2 text-right ${m.en_cde>0?'text-blue-600 font-semibold':'text-gray-300'}">${m.en_cde>0?m.en_cde+' '+m.unite:'—'}</td>
                <td class="px-3 py-2 text-right text-gray-600">${m.pu_ht.toFixed(2)} €</td>
                <td class="px-3 py-2 text-right text-gray-700 font-semibold">${valeur}</td>
                <td class="px-3 py-2 text-gray-400 text-xs">${m.lieu}</td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-1 justify-center">
                    <button onclick="openIncrement('${m.id}')" class="w-6 h-6 rounded-md bg-green-100 hover:bg-green-200 text-green-700 text-xs flex items-center justify-center" title="Entrée matière"><i class="fas fa-plus"></i></button>
                    <button onclick="openDecrement('${m.id}')" class="w-6 h-6 rounded-md bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs flex items-center justify-center" title="Sortie matière"><i class="fas fa-minus"></i></button>
                    <button onclick="genDA('${m.id}')" class="w-6 h-6 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs flex items-center justify-center" title="Générer demande d'achat"><i class="fas fa-file-alt"></i></button>
                  </div>
                </td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- JOURNAL DES MOUVEMENTS -->
    <div class="card p-4 mt-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-bold text-gray-800 text-sm flex items-center gap-2">
          <i class="fas fa-history text-blue-500"></i> Journal des mouvements de stock (trçabilité GED)
        </h3>
        <button onclick="pushNotif('info','fa-file-excel','Export mouvements généré. Archivé dans GED SharePoint.')" class="btn-secondary text-xs">
          <i class="fas fa-file-excel mr-1 text-green-600"></i>Exporter
        </button>
      </div>
      <table class="w-full text-xs">
        <thead><tr class="border-b border-gray-100">
          <th class="text-left py-2 pr-3 text-gray-500 font-semibold">N°</th>
          <th class="text-left py-2 pr-3 text-gray-500 font-semibold">Type</th>
          <th class="text-left py-2 pr-3 text-gray-500 font-semibold">Référence</th>
          <th class="text-right py-2 pr-3 text-gray-500 font-semibold">Quantité</th>
          <th class="text-left py-2 pr-3 text-gray-500 font-semibold">Réf. document</th>
          <th class="text-left py-2 pr-3 text-gray-500 font-semibold">Motif</th>
          <th class="text-left py-2 pr-3 text-gray-500 font-semibold">Opérateur</th>
          <th class="text-left py-2 text-gray-500 font-semibold">Date</th>
        </tr></thead>
        <tbody>
          ${MOUVEMENTS.map(mv => {
            const mat = MATIERES.find(m=>m.id===mv.mat)
            const typeCls = mv.type==='entree'?'badge-ok':mv.type==='sortie'?'badge-warn':'badge-cmd'
            const typeLabel = mv.type==='entree'?'Entrée':mv.type==='sortie'?'Sortie':'Ajust.'
            const qteStr = mv.type==='entree'?'+'+mv.qte:mv.qte>0?'-'+mv.qte:mv.qte.toString()
            const qteCls = mv.type==='entree'?'text-green-600 font-bold':mv.type==='sortie'?'text-orange-600 font-bold':'text-blue-600 font-bold'
            return `<tr class="border-b border-gray-50 hover:bg-gray-50/50">
              <td class="py-1.5 pr-3 font-bold text-gray-600">${mv.id}</td>
              <td class="py-1.5 pr-3"><span class="badge ${typeCls}">${typeLabel}</span></td>
              <td class="py-1.5 pr-3 text-gray-700 font-semibold">${mat?.ref||mv.mat}</td>
              <td class="py-1.5 pr-3 text-right ${qteCls}">${qteStr} ${mat?.unite||''}</td>
              <td class="py-1.5 pr-3 text-blue-600 underline cursor-pointer">${mv.ref}</td>
              <td class="py-1.5 pr-3 text-gray-500 max-w-xs truncate">${mv.motif}</td>
              <td class="py-1.5 pr-3 text-gray-600">${mv.user}</td>
              <td class="py-1.5 text-gray-400">${mv.date}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>
</main>

<!-- MODAL ENTRÉE MATIÈRE (INCRÉMENTATION) -->
<div id="entreeModal" class="modal-overlay hidden">
  <div class="modal-box">
    <div class="px-5 py-3.5 border-b flex items-center justify-between" style="background:linear-gradient(135deg,#22c55e,#16a34a)">
      <h3 class="font-bold text-white"><i class="fas fa-arrow-circle-down mr-2"></i>Entrée matière – Incrémentation stock</h3>
      <button onclick="closeM('entreeModal')" class="text-white/70 hover:text-white text-xl"><i class="fas fa-times"></i></button>
    </div>
    <div class="p-5 space-y-4">
      <div class="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700">
        <i class="fas fa-info-circle mr-1"></i>
        Déclenché automatiquement à la réception BL fournisseur. Connecté au module Achats (§4.6) et Qualité fournisseur (§4.7).
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Référence matière *</label>
          <select id="e_mat" class="form-input">
            <option value="">— Choisir —</option>
            ${MATIERES.map(m=>`<option value="${m.id}">${m.ref} – ${m.libelle}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Quantité reçue *</label><input id="e_qte" type="number" step="0.1" placeholder="Ex : 200" class="form-input"/></div>
        <div><label class="form-label">N° BL fournisseur</label><input id="e_bl" type="text" placeholder="BL-2026-XXXX" class="form-input"/></div>
        <div><label class="form-label">N° BC interne</label><input id="e_bc" type="text" placeholder="BC-2026-XXXX" class="form-input"/></div>
        <div><label class="form-label">Date de réception</label><input id="e_date" type="date" value="2026-03-10" class="form-input"/></div>
        <div>
          <label class="form-label">Contrôle qualité</label>
          <select id="e_cq" class="form-input">
            <option value="ok">✅ Conforme – mise en stock directe</option>
            <option value="attente">⏳ En attente de contrôle qualité</option>
            <option value="nc">❌ Non-conforme – retour fournisseur</option>
          </select>
        </div>
        <div><label class="form-label">Emplacement de stockage</label><input id="e_lieu" type="text" placeholder="Ex : A1-01" class="form-input"/></div>
        <div><label class="form-label">Lot / Traçabilité</label><input id="e_lot" type="text" placeholder="LOT-2026-XXXX" class="form-input"/></div>
      </div>
      <div><label class="form-label">Observations</label>
        <textarea id="e_obs" rows="2" placeholder="Conditionnement, défauts mineurs, observations réception…" class="form-input resize-none"></textarea>
      </div>
    </div>
    <div class="px-5 py-3.5 border-t flex justify-end gap-2">
      <button onclick="closeM('entreeModal')" class="btn-secondary">Annuler</button>
      <button onclick="validerEntree()" class="btn-primary"><i class="fas fa-check"></i> Valider l'entrée</button>
    </div>
  </div>
</div>

<!-- MODAL SORTIE MATIÈRE -->
<div id="sortieModal" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:540px">
    <div class="px-5 py-3.5 border-b flex items-center justify-between" style="background:linear-gradient(135deg,#f97316,#ea580c)">
      <h3 class="font-bold text-white"><i class="fas fa-arrow-circle-up mr-2"></i>Sortie matière – Consommation production</h3>
      <button onclick="closeM('sortieModal')" class="text-white/70 hover:text-white text-xl"><i class="fas fa-times"></i></button>
    </div>
    <div class="p-5 space-y-4">
      <div class="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
        <i class="fas fa-robot mr-1"></i>
        En production réelle : déclenchée automatiquement à l'ouverture d'un BDT (changement de statut Programmé → Reçu). Reliée au calcul de coût de revient.
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="form-label">Référence matière *</label>
          <select id="s_mat" class="form-input">
            <option value="">— Choisir —</option>
            ${MATIERES.map(m=>`<option value="${m.id}">${m.ref} – ${m.libelle}</option>`).join('')}
          </select>
        </div>
        <div><label class="form-label">Quantité consommée *</label><input id="s_qte" type="number" step="0.1" placeholder="Ex : 45" class="form-input"/></div>
        <div>
          <label class="form-label">Lié au BDT / Commande</label>
          <input id="s_bdt" type="text" placeholder="BDT-091 ou CMD-081" class="form-input"/>
        </div>
        <div><label class="form-label">Opérateur / Service</label><input id="s_user" type="text" placeholder="Prénom N. ou service" class="form-input"/></div>
      </div>
      <div><label class="form-label">Motif de sortie</label>
        <select id="s_motif" class="form-input">
          <option>Consommation production</option>
          <option>Rebut / chute</option>
          <option>Retour sous-traitant</option>
          <option>Inventaire / ajustement</option>
          <option>Autre</option>
        </select>
      </div>
    </div>
    <div class="px-5 py-3.5 border-t flex justify-end gap-2">
      <button onclick="closeM('sortieModal')" class="btn-secondary">Annuler</button>
      <button onclick="validerSortie()" class="btn-primary" style="background:linear-gradient(135deg,#f97316,#ea580c);box-shadow:0 2px 8px rgba(234,88,12,.3)">
        <i class="fas fa-check"></i> Valider la sortie
      </button>
    </div>
  </div>
</div>

<div class="notif-banner" id="notifBanner"></div>

<script>
const MATIERES = ${JSON.stringify(MATIERES)};
let filtActiv = 'all', filtFamille = 'all';

function setFilt(v) {
  filtActiv = v;
  ['all','Seem','Semrac','Commun'].forEach(x=>{const e=document.getElementById('filt-'+x);if(e)e.classList.toggle('active',x===v);});
  filterTable();
}
function setFiltFam(v) {
  filtFamille = v;
  ['all','Aluminium','Tôle','Outillage','Consommable'].forEach(x=>{const e=document.getElementById('ff-'+x);if(e)e.classList.toggle('active',x===v);});
  filterTable();
}
function filterTable() {
  const q = document.getElementById('searchStock').value.toLowerCase();
  const rows = document.querySelectorAll('#stockBody tr');
  rows.forEach(r=>{
    const act = r.dataset.activite||'';
    const fam = r.dataset.famille||'';
    const srch = r.dataset.search||'';
    const showAct = filtActiv==='all'||act===filtActiv;
    const showFam = filtFamille==='all'||fam===filtFamille;
    const showQ = !q||srch.includes(q);
    r.style.display = (showAct&&showFam&&showQ)?'':'none';
  });
}

function openIncrement(matId) {
  const mat = MATIERES.find(m=>m.id===matId);
  if(mat) { document.getElementById('e_mat').value=matId; document.getElementById('e_lieu').value=mat.lieu; }
  document.getElementById('entreeModal').classList.remove('hidden');
}
function openDecrement(matId) {
  const mat = MATIERES.find(m=>m.id===matId);
  if(mat) document.getElementById('s_mat').value=matId;
  document.getElementById('sortieModal').classList.remove('hidden');
}
function openEntreeModal() { document.getElementById('entreeModal').classList.remove('hidden'); }
function openSortieModal() { document.getElementById('sortieModal').classList.remove('hidden'); }
function closeM(id) { document.getElementById(id).classList.add('hidden'); }

function validerEntree() {
  const matId = document.getElementById('e_mat').value;
  const qte = parseFloat(document.getElementById('e_qte').value)||0;
  const cq = document.getElementById('e_cq').value;
  if(!matId||!qte){pushNotif('err','fa-exclamation-circle','Référence et quantité obligatoires.');return;}
  const mat = MATIERES.find(m=>m.id===matId);
  if(!mat)return;
  closeM('entreeModal');
  if(cq==='nc'){
    pushNotif('err','fa-times-circle',\`Matière <strong>\${mat.ref}</strong> non-conforme. Retour fournisseur déclenché. Fiche anomalie créée → Pierre-Yves (Qualité).\`);
  } else if(cq==='attente'){
    pushNotif('warn','fa-hourglass-half',\`<strong>\${qte} \${mat.unite}</strong> de <strong>\${mat.ref}</strong> en attente contrôle qualité (quarantaine). Pierre-Yves notifié.\`);
  } else {
    pushNotif('ok','fa-check-circle',\`<strong>+\${qte} \${mat.unite}</strong> de <strong>\${mat.ref}</strong> en stock. BL archivé GED. Stock mis à jour. Alerte stock résolue si applicable.\`);
  }
}

function validerSortie() {
  const matId = document.getElementById('s_mat').value;
  const qte = parseFloat(document.getElementById('s_qte').value)||0;
  const bdt = document.getElementById('s_bdt').value;
  if(!matId||!qte){pushNotif('err','fa-exclamation-circle','Référence et quantité obligatoires.');return;}
  const mat = MATIERES.find(m=>m.id===matId);
  if(!mat)return;
  closeM('sortieModal');
  pushNotif('ok','fa-minus-circle',\`<strong>-\${qte} \${mat.unite}</strong> de <strong>\${mat.ref}</strong> sortis. \${bdt?'Lié à '+bdt+'. ':''} Coût de revient recalculé automatiquement.\`);
  if((mat.stock-qte)<mat.mini) {
    setTimeout(()=>pushNotif('warn','fa-exclamation-triangle',\`Stock <strong>\${mat.ref}</strong> sous le seuil minimum après sortie. Demande d'achat générée automatiquement → Morgane (Achats).\`),1500);
  }
}

function genDA(matId) {
  const mat = MATIERES.find(m=>m.id===matId);
  if(!mat)return;
  const qte = mat.maxi - mat.stock;
  pushNotif('info','fa-file-alt',\`Demande d'achat générée pour <strong>\${mat.ref}</strong> : <strong>\${qte} \${mat.unite}</strong> à commander chez \${mat.fournisseur}. Notification Morgane (Achats).\`);
}

function exportStock() {
  pushNotif('info','fa-file-excel','Export stock généré. Archivé dans GED SharePoint. Mail envoyé à Morgane.');
}

function pushNotif(type, icon, msg) {
  const banner=document.getElementById('notifBanner');
  const id='n'+Date.now();
  const d=document.createElement('div');
  d.id=id;d.className='notif notif-'+type;
  d.innerHTML=\`<i class="fas \${icon} mr-2"></i>\${msg}<button onclick="this.parentElement.remove()" class="float-right ml-2 text-gray-400"><i class="fas fa-times"></i></button>\`;
  banner.appendChild(d);
  setTimeout(()=>{const e=document.getElementById(id);if(e){e.style.opacity='0';setTimeout(()=>{const e2=document.getElementById(id);if(e2)e2.remove();},400);}},7000);
}
</script>
</body>
</html>`
}

// ══════════════════════════════════════════════════════════════
// PAGE ALERTES STOCK
// ══════════════════════════════════════════════════════════════
export const pageStockAlertes = () => {
  const alertes = MATIERES.filter(m=>m.stock <= m.mini*1.5)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Alertes Stock · ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>${CSS_STOCK}</style>
</head>
<body class="min-h-screen flex">
${SIDEBAR_STOCK('alertes')}
<main class="flex-1 p-5">
  <div class="flex items-center gap-4 mb-5">
    <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg" style="background:linear-gradient(135deg,#ef4444,#dc2626)"><i class="fas fa-bell"></i></div>
    <div>
      <h1 class="text-xl font-bold text-gray-900">Alertes Stock & Réapprovisionnements</h1>
      <p class="text-gray-400 text-xs">${alertes.length} alerte(s) active(s) · Génération automatique de demandes d'achat</p>
    </div>
    <div class="ml-auto">
      <button onclick="genAllDA()" class="btn-primary" style="background:linear-gradient(135deg,#ef4444,#dc2626);box-shadow:0 2px 8px rgba(239,68,68,.3)">
        <i class="fas fa-bolt"></i> Générer toutes les DA
      </button>
    </div>
  </div>

  ${alertes.length===0
    ? '<div class="card p-10 text-center text-gray-300"><i class="fas fa-check-circle text-5xl mb-3 text-green-300"></i><div class="text-lg font-bold text-gray-400">Tous les stocks sont au niveau requis</div></div>'
    : alertes.map(m=>{
      const isCrit = m.stock < m.mini
      const qteToOrder = m.maxi - m.stock
      const valCommandee = (qteToOrder * m.pu_ht).toLocaleString('fr-FR',{style:'currency',currency:'EUR'})
      return `<div class="card p-4 mb-3 border-l-4 ${isCrit?'border-red-500':'border-amber-400'}">
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCrit?'bg-red-100':'bg-amber-100'}">
              <i class="fas fa-exclamation-triangle ${isCrit?'text-red-500':'text-amber-500'}"></i>
            </div>
            <div>
              <div class="font-bold text-gray-900 flex items-center gap-2">
                ${m.ref}
                <span class="badge ${isCrit?'badge-crit':'badge-warn'}">${isCrit?'CRITIQUE':'SEUIL BAS'}</span>
                <span class="badge" style="background:#ede9fe;color:#5b21b6">${m.activite}</span>
              </div>
              <div class="text-sm text-gray-500 mb-2">${m.libelle}</div>
              <div class="flex items-center gap-4 text-xs text-gray-500">
                <span><strong>Stock actuel :</strong> <span class="${isCrit?'text-red-600':'text-amber-600'} font-bold">${m.stock} ${m.unite}</span></span>
                <span><strong>Seuil mini :</strong> ${m.mini} ${m.unite}</span>
                <span><strong>Stock maxi :</strong> ${m.maxi} ${m.unite}</span>
                <span><strong>À commander :</strong> <span class="text-blue-600 font-bold">${qteToOrder} ${m.unite}</span> (${valCommandee})</span>
                ${m.en_cde>0?`<span class="text-blue-500"><i class="fas fa-truck mr-1"></i>Déjà en commande : ${m.en_cde} ${m.unite}</span>`:''}
              </div>
              <div class="text-xs text-gray-400 mt-1"><i class="fas fa-building mr-1"></i>Fournisseur habituel : <strong>${m.fournisseur}</strong> · Emplacement : ${m.lieu}</div>
            </div>
          </div>
          <div class="flex flex-col gap-2 flex-shrink-0 ml-4">
            <button onclick="genDA1('${m.id}','${m.ref}',${qteToOrder},'${m.unite}','${m.fournisseur}')" class="btn-primary text-xs" style="background:linear-gradient(135deg,#3b82f6,#2563eb);box-shadow:0 2px 6px rgba(59,130,246,.3)">
              <i class="fas fa-file-alt"></i> Générer DA
            </button>
            <a href="/stock"><button class="btn-secondary text-xs"><i class="fas fa-edit mr-1"></i>Voir stock</button></a>
          </div>
        </div>
        <div class="mt-3">
          <div class="text-xs text-gray-400 mb-1">Niveau de stock :</div>
          <div class="progress-bar" style="height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden;">
            <div class="progress-fill" style="width:${Math.round(m.stock/m.maxi*100)}%;background:${isCrit?'#ef4444':'#f59e0b'};height:100%;border-radius:999px;"></div>
          </div>
          <div class="flex justify-between text-xs text-gray-400 mt-0.5"><span>0</span><span>Mini: ${m.mini}</span><span>Maxi: ${m.maxi} ${m.unite}</span></div>
        </div>
      </div>`
    }).join('')}
</main>
<div class="notif-banner" id="notifBanner"></div>
<script>
function genDA1(matId, ref, qte, unite, fournisseur) {
  pushNotif('info','fa-file-alt',\`DA générée pour <strong>\${ref}</strong> : <strong>\${qte} \${unite}</strong> chez \${fournisseur}. Envoyée à Morgane (Achats) pour validation.\`);
}
function genAllDA() {
  pushNotif('ok','fa-bolt',\`Toutes les DA critiques ont été générées et envoyées à Morgane (Achats). Archivage GED en cours.\`);
}
function pushNotif(type,icon,msg){
  const banner=document.getElementById('notifBanner');const id='n'+Date.now();const d=document.createElement('div');
  d.id=id;d.className='notif notif-'+type;
  d.innerHTML=\`<i class="fas \${icon} mr-2"></i>\${msg}<button onclick="this.parentElement.remove()" class="float-right ml-2 text-gray-400"><i class="fas fa-times"></i></button>\`;
  banner.appendChild(d);
  setTimeout(()=>{const e=document.getElementById(id);if(e){e.style.opacity='0';setTimeout(()=>{const e2=document.getElementById(id);if(e2)e2.remove();},400);}},7000);
}
</script>
</body></html>`
}
