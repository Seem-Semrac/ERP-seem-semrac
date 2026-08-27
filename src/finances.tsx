// ══════════════════════════════════════════════════════════════
// MODULE FINANCES – TAUX HORAIRES, IMPUTATIONS, COÛT MACHINE
// COÛT DE REVIENT UNITAIRE
// Conforme cahier des charges §4.2 (coût de revient BE), §4.18
// §5 (Power BI), §4.17 (Direction)
// ══════════════════════════════════════════════════════════════
import { escX, computePosteRates } from './shared'


const CSS_FIN = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  *{font-family:'Inter',sans-serif;box-sizing:border-box;}
  body{background:#f1f5f9;}
  .card{background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07),0 4px 16px rgba(0,0,0,.04);}
  .notif-banner{position:fixed;top:1rem;right:1rem;z-index:2000;max-width:380px;}
  .notif{background:white;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.18);padding:.9rem 1.2rem;border-left:4px solid;margin-bottom:.5rem;font-size:.82rem;animation:slideIn .3s ease;}
  .notif-ok{border-color:#22c55e;}.notif-warn{border-color:#f59e0b;}.notif-err{border-color:#ef4444;}.notif-info{border-color:#3b82f6;}
  @keyframes slideIn{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
  .form-label{display:block;font-size:.72rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:.3rem;}
  .form-input{width:100%;border:1px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.82rem;color:#374151;background:#f8fafc;outline:none;transition:border-color .2s;}
  .form-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12);}
  .tab-btn{padding:.45rem 1.1rem;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .15s;color:#64748b;background:transparent;border:none;}
  .tab-btn.active{background:#f59e0b;color:white;}
  .tab-btn:not(.active):hover{background:#f1f5f9;}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:500;}
  .modal-box{background:white;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:740px;margin:1rem;overflow:hidden;max-height:92vh;overflow-y:auto;}
  .btn-primary{display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1.25rem;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border-radius:10px;font-size:.82rem;font-weight:700;border:none;cursor:pointer;transition:all .15s;box-shadow:0 2px 8px rgba(245,158,11,.3);}
  .btn-primary:hover{transform:translateY(-1px);}
  .btn-secondary{display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1.1rem;background:white;color:#374151;border-radius:10px;font-size:.82rem;font-weight:600;border:1px solid #e2e8f0;cursor:pointer;transition:all .15s;}
  .badge{border-radius:999px;padding:2px 8px;font-size:.62rem;font-weight:700;}
  .badge-ok{background:#dcfce7;color:#166534;}
  .badge-warn{background:#fef9c3;color:#854d0e;}
  .badge-err{background:#fee2e2;color:#991b1b;}
  .kpi-card{background:white;border-radius:12px;padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.07);border-left:4px solid;}
  .cost-row:hover{background:#fefce8;}
  tr.cost-row td{border-bottom:1px solid #f9fafb;}
`

const SIDEBAR_FIN = (active='') => `
<aside class="w-64 min-h-screen flex-shrink-0 text-white flex flex-col" style="background:linear-gradient(170deg,#0f172a 0%,#451a03 50%,#1e293b 100%)">
  <div class="p-4 border-b border-white/10">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
        <i class="fas fa-chart-line text-sm"></i>
      </div>
      <div>
        <div class="font-bold text-sm">Finances & Coûts</div>
        <div class="text-xs text-amber-300">Seem Semrac ERP</div>
      </div>
    </div>
  </div>
  <nav class="flex-1 p-3 space-y-0.5 text-sm">
    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">COÛTS</div>
    <a href="/finances/couts" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='couts'?'bg-white/15 border-l-4 border-amber-400 pl-2':'hover:bg-white/8'} text-slate-200 text-xs">
      <i class="fas fa-calculator w-4 text-amber-400"></i> Coûts de revient
    </a>
    <a href="/finances/taux" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='taux'?'bg-white/15 border-l-4 border-amber-400 pl-2':'hover:bg-white/8'} text-slate-200 text-xs">
      <i class="fas fa-users-cog w-4 text-amber-400"></i> Taux horaires opérateurs
    </a>
    <a href="/finances/machines" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='machines'?'bg-white/15 border-l-4 border-amber-400 pl-2':'hover:bg-white/8'} text-slate-200 text-xs">
      <i class="fas fa-industry w-4 text-orange-400"></i> Coûts horaires machines
    </a>
    <a href="/finances/imputations" class="flex items-center gap-2.5 px-3 py-2 rounded-lg ${active==='imput'?'bg-white/15 border-l-4 border-amber-400 pl-2':'hover:bg-white/8'} text-slate-200 text-xs">
      <i class="fas fa-stopwatch w-4 text-blue-400"></i> Imputations des temps
    </a>
    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2 mt-2">NAVIGATION</div>
    <a href="/" class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/8 text-slate-400 text-xs">
      <i class="fas fa-arrow-left w-4"></i> Accueil
    </a>
    <a href="/production/affectation" class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/8 text-slate-400 text-xs">
      <i class="fas fa-project-diagram w-4 text-orange-300"></i> Planning BDT
    </a>
    <a href="/stock" class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/8 text-slate-400 text-xs">
      <i class="fas fa-warehouse w-4 text-green-300"></i> Gestion Stock
    </a>
    <a href="/dashboard/direction" class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/8 text-slate-400 text-xs">
      <i class="fas fa-chart-bar w-4 text-amber-300"></i> Dashboard Direction
    </a>
  </nav>
  <div class="p-3 border-t border-white/10 text-xs text-slate-500 text-center">Maquette ERP 2026 v2.0</div>
</aside>`

// ─── MAPPING DONNÉES RÉELLES (DB) → FINANCES ──────────────────
const FIN_CHARGES = 0.45
const finOps = (salaries: any[] = []) => (salaries || [])
  .filter((s: any) => s && s.est_operateur === true && s.actif !== false)
  .map((s: any) => {
    const charge = Number(s.taux_horaire_charge) || 0
    return {
      id: s.id,
      nom: ((s.prenom ? s.prenom + ' ' : '') + (s.nom || '')).trim() || s.nom || '—',
      poste: s.poste || s.metier || '—',
      activite: s.entite || s.activite || 'Seem',
      categorie: s.metier || '—',
      taux_brut: charge ? +(charge / (1 + FIN_CHARGES)).toFixed(2) : 0,
      charges: FIN_CHARGES,
      taux_chargé: charge,
    }
  })
const finMacs = (machines: any[] = [], opex: any[] = [], postes: any[] = []) => {
  const opexBy: Record<string, any> = {}
  for (const o of opex || []) { const k = String(o.machine_id); if (!opexBy[k] || (o.annee || 0) > (opexBy[k].annee || 0)) opexBy[k] = o }
  // Phase E : taux horaire EFFECTIF réconcilié avec le CRU = base cout_h + incrément OPEX achats du POSTE (ou override manuel).
  const rates = computePosteRates(machines, opex, postes)
  return (machines || []).map((m: any) => {
    const ox = opexBy[String(m.id)] || {}
    const base = Number(m.cout_h) || 0
    const tauxEff = rates.machineRate(String(m.id), base)
    return {
      id: m.id, nom: m.nom, code: m.code || '', famille: m.categorie || '—',
      activite: m.activite || 'Seem', categorie: m.categorie || '—',
      cout_h: base, capacite_h: Number(m.capacite_h) || 0,
      taux_base: base, taux_horaire_total: tauxEff,   // taux_horaire_total intègre l'incrément achats poste (Phase E)
      opex_annuel: Number(ox.cout_total_ht) || 0, opex_heures: Number(ox.heures_productives) || 0, opex_taux: Number(ox.taux_horaire) || 0,
    }
  })
}
const finImps = (bdts: any[] = []) => (bdts || [])
  .filter((b: any) => /sold|termine|recu|cours/.test(String(b.statut || '').toLowerCase()))
  .map((b: any) => ({
    id: b.id, bdt: b.id, op: b.operateur_id || '', machine: b.machine_id || '',
    operation: b.operation || '—', cmd: b.cmd_id || b.num_affaire || '—', client: b.client_nom || '—',
    duree_allouee: Number(b.duree) || 0, duree_reelle: null as number | null,
    statut: /sold/.test(String(b.statut || '').toLowerCase()) ? 'solde' : 'en_cours',
  }))
const finCmds = (_commandes: any[] = []): any[] => []

// ─── DONNÉES FINANCES ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
// PAGE COÛT DE REVIENT
// ══════════════════════════════════════════════════════════════
export const pageFinancesCouts = (commandes: any[] = [], salaries: any[] = [], machines: any[] = [], opex: any[] = [], postes: any[] = []) => {
  const FCMDS = finCmds(commandes), FOPS = finOps(salaries), FMACS = finMacs(machines, opex, postes)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Coût de Revient · ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>${CSS_FIN}</style>
</head>
<body class="min-h-screen flex">
${SIDEBAR_FIN('couts')}

<main class="flex-1 overflow-y-auto">
  <div class="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
        <i class="fas fa-calculator"></i>
      </div>
      <div>
        <h1 class="text-lg font-bold text-gray-900">Coût de Revient Unitaire</h1>
        <p class="text-gray-400 text-xs">Calcul automatique BE · Intégré temps réels BDT · §4.2 + §4.18 Cahier des charges</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <a href="/finances/taux"><button class="tab-btn text-xs">Taux opérateurs</button></a>
      <a href="/finances/machines"><button class="tab-btn text-xs">Coûts machines</button></a>
      <a href="/finances/imputations"><button class="tab-btn text-xs">Imputations</button></a>
      <button onclick="openSimulModal()" class="btn-primary text-xs"><i class="fas fa-calculator"></i> Simuler CR</button>
    </div>
  </div>

  <div class="p-4">
    <!-- EXPLICATION MÉTHODE -->
    <div class="card p-4 mb-4 border-l-4 border-amber-400 bg-amber-50">
      <div class="flex items-start gap-3">
        <i class="fas fa-info-circle text-amber-500 mt-0.5"></i>
        <div class="text-xs text-amber-800">
          <div class="font-bold mb-1">Méthode de calcul du Coût de Revient (CR) – §4.2 & §4.18</div>
          <div><strong>CR unitaire = Σ (Temps opération × Taux horaire chargé opérateur) + Σ (Temps opération × Coût horaire machine) + Σ (Matières consommées × PU HT) + Frais généraux</strong></div>
          <div class="mt-1">Les temps réels des BDT (§4.18) alimentent automatiquement ce calcul via Power BI. Le CR s'ajuste en temps réel à chaque soldage BDT.</div>
        </div>
      </div>
    </div>

    <!-- COMMANDES -->
    ${FCMDS.map(cmd => {
      // Calcul CR
      const opsFin  = FOPS
      const machFin = FMACS
      let totalMO=0, totalMachine=0, totalMat=0
      const lignes = cmd.etapes.map((et: any) => {
        // Trouver opérateur type pour cette opération
        const tauxOp = opsFin[0].taux_chargé  // Simplifié pour démo
        const moAlloue = et.temps_alloue * tauxOp
        const moReel   = et.temps_reel   * tauxOp
        const mac      = machFin.find(m=>m.id===et.machine)
        const macAlloue= et.machine ? et.temps_alloue * (mac?.taux_horaire_total||0) : 0
        const macReel  = et.machine ? et.temps_reel   * (mac?.taux_horaire_total||0) : 0
        const matCout  = et.mat_qte * et.mat_pu
        totalMO      += moReel
        totalMachine += macReel
        totalMat     += matCout
        return { ...et, moAlloue, moReel, macAlloue, macReel, matCout, mac }
      })
      const fraisGen  = (totalMO + totalMachine) * 0.12  // 12% frais généraux
      const crTotal   = totalMO + totalMachine + totalMat + fraisGen
      const prixVente = cmd.prix_vente_unitaire
      const marge     = prixVente - crTotal
      const txMarge   = prixVente > 0 ? (marge/prixVente*100).toFixed(1) : '0'
      
      return `<div class="card p-4 mb-4">
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-bold text-gray-900 text-base">${escX(cmd.id)} – ${escX(cmd.piece)}</h3>
              <span class="badge" style="background:${cmd.activite==='Seem'?'#dbeafe':'#fce7f3'};color:${cmd.activite==='Seem'?'#1d4ed8':'#831843'}">${escX(cmd.activite)}</span>
              <span class="badge" style="background:#f3f4f6;color:#374151">${escX(cmd.client)}</span>
            </div>
            <div class="text-xs text-gray-400">Quantité : <strong>${cmd.qte} pièces</strong> · Coeff. vente : <strong>${cmd.coeff_vente}</strong> · Prix vente : <strong>${prixVente.toFixed(2)} €/pce</strong></div>
          </div>
          <div class="flex gap-3">
            <div class="text-center bg-amber-50 rounded-xl px-4 py-2 border border-amber-100">
              <div class="text-xs text-amber-600 font-semibold mb-0.5">CR unitaire</div>
              <div class="text-xl font-black text-amber-700">${crTotal.toFixed(2)} €</div>
            </div>
            <div class="text-center rounded-xl px-4 py-2 border ${parseFloat(txMarge)>=20?'bg-green-50 border-green-100':'bg-red-50 border-red-100'}">
              <div class="text-xs font-semibold mb-0.5 ${parseFloat(txMarge)>=20?'text-green-600':'text-red-600'}">Marge</div>
              <div class="text-xl font-black ${parseFloat(txMarge)>=20?'text-green-700':'text-red-700'}">${txMarge}%</div>
            </div>
            <div class="text-center bg-indigo-50 rounded-xl px-4 py-2 border border-indigo-100">
              <div class="text-xs text-indigo-600 font-semibold mb-0.5">CA total</div>
              <div class="text-xl font-black text-indigo-700">${(prixVente*cmd.qte).toLocaleString('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0})}</div>
            </div>
          </div>
        </div>

        <!-- DÉTAIL PAR ÉTAPE -->
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead><tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left py-2 px-2 text-gray-500 font-semibold">Opération</th>
              <th class="text-left py-2 px-2 text-gray-500 font-semibold">Machine</th>
              <th class="text-right py-2 px-2 text-gray-500 font-semibold">Tps alloué</th>
              <th class="text-right py-2 px-2 text-gray-500 font-semibold">Tps réel BDT</th>
              <th class="text-right py-2 px-2 text-gray-500 font-semibold">MO alloué</th>
              <th class="text-right py-2 px-2 text-gray-500 font-semibold">MO réel</th>
              <th class="text-right py-2 px-2 text-gray-500 font-semibold">Machine</th>
              <th class="text-right py-2 px-2 text-gray-500 font-semibold">Matière</th>
              <th class="text-right py-2 px-2 text-gray-500 font-semibold">Total étape</th>
              <th class="text-center py-2 px-2 text-gray-500 font-semibold">Écart</th>
            </tr></thead>
            <tbody>
              ${lignes.map((et: any)=>{
                const totalEtape = et.moReel + et.macReel + et.matCout
                const totalAlloue = et.moAlloue + et.macAlloue + et.matCout
                const ecart = totalEtape - totalAlloue
                const ecartCls = ecart>0?'text-red-600 font-bold':ecart<0?'text-green-600 font-semibold':'text-gray-400'
                return `<tr class="cost-row border-b border-gray-50">
                  <td class="py-1.5 px-2 font-semibold text-gray-700">${escX(et.operation)}</td>
                  <td class="py-1.5 px-2 text-gray-500">${escX(et.mac?.nom)||'Manuel'}</td>
                  <td class="py-1.5 px-2 text-right text-gray-500">${(et.temps_alloue*60).toFixed(0)} min</td>
                  <td class="py-1.5 px-2 text-right font-semibold ${et.temps_reel>et.temps_alloue?'text-red-500':'text-green-600'}">${(et.temps_reel*60).toFixed(0)} min</td>
                  <td class="py-1.5 px-2 text-right text-gray-400">${et.moAlloue.toFixed(3)} €</td>
                  <td class="py-1.5 px-2 text-right text-gray-700">${et.moReel.toFixed(3)} €</td>
                  <td class="py-1.5 px-2 text-right text-blue-600">${et.macReel.toFixed(3)} €</td>
                  <td class="py-1.5 px-2 text-right text-orange-600">${et.matCout.toFixed(3)} €</td>
                  <td class="py-1.5 px-2 text-right font-bold text-gray-800">${totalEtape.toFixed(3)} €</td>
                  <td class="py-1.5 px-2 text-center ${ecartCls}">${ecart>=0?'+':''}${ecart.toFixed(3)} €</td>
                </tr>`
              }).join('')}
              <tr class="bg-amber-50 border-t-2 border-amber-200 font-bold">
                <td class="py-2 px-2 text-gray-700" colspan="5">Sous-total</td>
                <td class="py-2 px-2 text-right text-gray-900">${totalMO.toFixed(3)} €</td>
                <td class="py-2 px-2 text-right text-blue-700">${totalMachine.toFixed(3)} €</td>
                <td class="py-2 px-2 text-right text-orange-700">${totalMat.toFixed(3)} €</td>
                <td class="py-2 px-2 text-right text-amber-700 text-sm">${(totalMO+totalMachine+totalMat).toFixed(3)} €</td>
                <td class="py-2 px-2"></td>
              </tr>
              <tr class="bg-gray-50">
                <td class="py-1.5 px-2 text-gray-500 text-xs" colspan="8">Frais généraux (12%) : ${fraisGen.toFixed(3)} €</td>
                <td class="py-1.5 px-2 text-right font-black text-gray-900 text-sm">${crTotal.toFixed(3)} €</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- RÉPARTITION VISUELLE -->
        <div class="grid grid-cols-4 gap-3 mt-3">
          ${[
            {label:'Main d\'œuvre', val:totalMO, color:'#3b82f6', pct:totalMO/crTotal},
            {label:'Machines',      val:totalMachine, color:'#8b5cf6', pct:totalMachine/crTotal},
            {label:'Matières',      val:totalMat, color:'#f59e0b', pct:totalMat/crTotal},
            {label:'Frais généraux',val:fraisGen, color:'#94a3b8', pct:fraisGen/crTotal},
          ].map(r=>`
          <div class="bg-gray-50 rounded-xl p-3 text-center">
            <div class="text-xs font-semibold text-gray-600 mb-1">${r.label}</div>
            <div class="text-base font-black" style="color:${r.color}">${r.val.toFixed(2)} €</div>
            <div class="text-xs text-gray-400">${(r.pct*100).toFixed(1)}% du CR</div>
            <div class="h-1.5 rounded-full bg-gray-200 mt-1.5"><div class="h-full rounded-full" style="width:${(r.pct*100).toFixed(0)}%;background:${r.color}"></div></div>
          </div>`).join('')}
        </div>
        <div class="flex justify-end mt-3 gap-2">
          <button onclick="exportCR('${cmd.id}')" class="btn-secondary text-xs"><i class="fas fa-file-pdf mr-1 text-red-500"></i>Export PDF</button>
          <button onclick="pushNotif('info','fa-sync','CR de ${cmd.id} recalculé avec les temps réels BDT. Power BI mis à jour.')" class="btn-secondary text-xs"><i class="fas fa-sync mr-1 text-blue-500"></i>Recalculer temps réels</button>
        </div>
      </div>`
    }).join('')}
  </div>
</main>

<!-- MODAL SIMULATION CR -->
<div id="simulModal" class="modal-overlay hidden">
  <div class="modal-box">
    <div class="px-5 py-3.5 border-b flex items-center justify-between" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
      <h3 class="font-bold text-white"><i class="fas fa-calculator mr-2"></i>Simulateur Coût de Revient – Bureau d'Études</h3>
      <button onclick="closeModal('simulModal')" class="text-white/70 hover:text-white text-xl"><i class="fas fa-times"></i></button>
    </div>
    <div class="p-5 space-y-4">
      <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
        <i class="fas fa-info-circle mr-1"></i>
        Utilisé par le Bureau d'Études (§4.2) pour calculer le CR avant de générer l'offre de prix. Se base sur les gammes opératoires, les temps alloués et les taux en vigueur.
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div><label class="form-label">Activité *</label>
          <select id="sim_act" class="form-input">
            <option value="Seem">Seem</option><option value="Semrac">Semrac</option>
          </select>
        </div>
        <div><label class="form-label">Référence pièce</label><input id="sim_piece" type="text" placeholder="DISSIP-XX" class="form-input"/></div>
        <div><label class="form-label">Quantité</label><input id="sim_qte" type="number" value="100" class="form-input"/></div>
      </div>

      <div id="sim_etapes" class="space-y-2">
        <div class="font-bold text-gray-700 text-sm">Gamme opératoire :</div>
        <div id="sim_etapes_list" class="space-y-2">
          <div class="grid grid-cols-5 gap-2 items-end sim-etape">
            <div><label class="form-label">Opération</label><input type="text" placeholder="Ex : Usinage" class="form-input sim-op"/></div>
            <div><label class="form-label">Temps (min)</label><input type="number" step="1" placeholder="15" class="form-input sim-temps"/></div>
            <div><label class="form-label">Taux MO (€/h)</label><input type="number" step="0.01" value="26.83" class="form-input sim-tauxmo"/></div>
            <div><label class="form-label">Coût machine (€/h)</label><input type="number" step="0.01" value="18.50" class="form-input sim-tauxmac"/></div>
            <div><button onclick="this.closest('.sim-etape').remove()" class="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 text-sm flex items-center justify-center"><i class="fas fa-times"></i></button></div>
          </div>
        </div>
        <button onclick="addEtape()" class="btn-secondary text-xs w-full"><i class="fas fa-plus mr-1"></i>Ajouter une opération</button>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div><label class="form-label">Matière (€/pièce)</label><input id="sim_mat" type="number" step="0.01" placeholder="5.50" class="form-input"/></div>
        <div><label class="form-label">Frais généraux (%)</label><input id="sim_fg" type="number" value="12" class="form-input"/></div>
        <div><label class="form-label">Coefficient de vente</label><input id="sim_coeff" type="number" step="0.01" value="1.35" class="form-input"/></div>
      </div>

      <div id="sim_result" class="hidden bg-amber-50 border border-amber-100 rounded-xl p-4">
        <div class="font-bold text-amber-800 mb-2"><i class="fas fa-calculator mr-1"></i>Résultat de simulation</div>
        <div id="sim_result_content" class="grid grid-cols-2 gap-2 text-sm"></div>
      </div>
    </div>
    <div class="px-5 py-3.5 border-t flex justify-end gap-2">
      <button onclick="closeModal('simulModal')" class="btn-secondary">Fermer</button>
      <button onclick="calculerSimul()" class="btn-primary"><i class="fas fa-calculator"></i> Calculer CR</button>
    </div>
  </div>
</div>

<div class="notif-banner" id="notifBanner"></div>
<script>
function openSimulModal() { document.getElementById('simulModal').classList.remove('hidden'); }
function closeModal(id)   { document.getElementById(id).classList.add('hidden'); }

function addEtape() {
  const tmpl = \`<div class="grid grid-cols-5 gap-2 items-end sim-etape">
    <div><input type="text" placeholder="Opération" class="form-input sim-op"/></div>
    <div><input type="number" step="1" placeholder="min" class="form-input sim-temps"/></div>
    <div><input type="number" step="0.01" value="26.83" class="form-input sim-tauxmo"/></div>
    <div><input type="number" step="0.01" value="0" class="form-input sim-tauxmac"/></div>
    <div><button onclick="this.closest('.sim-etape').remove()" class="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 text-sm flex items-center justify-center"><i class="fas fa-times"></i></button></div>
  </div>\`;
  document.getElementById('sim_etapes_list').insertAdjacentHTML('beforeend', tmpl);
}

function calculerSimul() {
  const etapes = [...document.querySelectorAll('.sim-etape')];
  let totalMO=0, totalMac=0;
  etapes.forEach(e => {
    const temps = parseFloat(e.querySelector('.sim-temps')?.value)||0;
    const tauxMO = parseFloat(e.querySelector('.sim-tauxmo')?.value)||0;
    const tauxMac = parseFloat(e.querySelector('.sim-tauxmac')?.value)||0;
    totalMO  += (temps/60)*tauxMO;
    totalMac += (temps/60)*tauxMac;
  });
  const mat   = parseFloat(document.getElementById('sim_mat').value)||0;
  const fg    = parseFloat(document.getElementById('sim_fg').value)||12;
  const coeff = parseFloat(document.getElementById('sim_coeff').value)||1.35;
  const frais = (totalMO+totalMac)*fg/100;
  const cr    = totalMO+totalMac+mat+frais;
  const prix  = cr*coeff;
  
  document.getElementById('sim_result').classList.remove('hidden');
  document.getElementById('sim_result_content').innerHTML = \`
    <div class="space-y-1 text-xs">
      <div class="flex justify-between"><span class="text-gray-500">Main d'œuvre :</span><span class="font-bold">\${totalMO.toFixed(3)} €</span></div>
      <div class="flex justify-between"><span class="text-gray-500">Machines :</span><span class="font-bold">\${totalMac.toFixed(3)} €</span></div>
      <div class="flex justify-between"><span class="text-gray-500">Matières :</span><span class="font-bold">\${mat.toFixed(3)} €</span></div>
      <div class="flex justify-between"><span class="text-gray-500">Frais généraux (\${fg}%) :</span><span class="font-bold">\${frais.toFixed(3)} €</span></div>
    </div>
    <div class="space-y-1 text-xs">
      <div class="flex justify-between border-t pt-1"><span class="text-gray-700 font-bold">CR unitaire :</span><span class="font-black text-amber-700 text-base">\${cr.toFixed(3)} €</span></div>
      <div class="flex justify-between"><span class="text-gray-500">Coeff. vente (\${coeff}) :</span><span></span></div>
      <div class="flex justify-between"><span class="text-green-700 font-bold">Prix de vente suggéré :</span><span class="font-black text-green-700 text-base">\${prix.toFixed(2)} €</span></div>
    </div>
  \`;
}

function exportCR(cmdId) {
  pushNotif('info','fa-file-pdf',\`CR de \${cmdId} exporté en PDF. Archivé dans GED SharePoint → dossier BE.\`);
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
</body></html>`
}

// ══════════════════════════════════════════════════════════════
// PAGE TAUX HORAIRES OPÉRATEURS
// ══════════════════════════════════════════════════════════════
export const pageFinancesTaux = (salaries: any[] = []) => {
  const FOPS = finOps(salaries)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Taux Horaires Opérateurs · ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>${CSS_FIN}</style>
</head>
<body class="min-h-screen flex">
${SIDEBAR_FIN('taux')}
<main class="flex-1 p-5 overflow-y-auto">
  <div class="flex items-center justify-between mb-5">
    <div class="flex items-center gap-4">
      <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg" style="background:linear-gradient(135deg,#f59e0b,#d97706)"><i class="fas fa-users-cog"></i></div>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Taux Horaires Opérateurs</h1>
        <p class="text-gray-400 text-xs">Taux brut + charges sociales = taux chargé · Utilisé dans le calcul du coût de revient</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="saveAll()" class="btn-primary"><i class="fas fa-save"></i> Enregistrer</button>
    </div>
  </div>

  <!-- EXPLICATION -->
  <div class="card p-3 mb-4 bg-amber-50 border-l-4 border-amber-400 text-xs text-amber-800">
    <i class="fas fa-info-circle mr-1"></i>
    <strong>Taux chargé = Taux brut horaire × (1 + taux de charges sociales)</strong> · Actuellement configuré à 45% de charges. Peut être ajusté selon les contrats.
    En production réelle, ces taux sont synchronisés avec Silae (gestion de paie) via l'interface ERP.
  </div>

  <!-- TABLEAU TAUX -->
  <div class="card overflow-hidden mb-4">
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-100">
            <th class="text-left px-4 py-3 text-gray-500 font-semibold">Opérateur</th>
            <th class="text-left px-4 py-3 text-gray-500 font-semibold">Poste</th>
            <th class="text-center px-4 py-3 text-gray-500 font-semibold">Activité</th>
            <th class="text-center px-4 py-3 text-gray-500 font-semibold">Catégorie</th>
            <th class="text-right px-4 py-3 text-gray-500 font-semibold">Taux brut (€/h)</th>
            <th class="text-right px-4 py-3 text-gray-500 font-semibold">Charges (%)</th>
            <th class="text-right px-4 py-3 text-gray-500 font-semibold font-bold text-amber-700">Taux chargé (€/h)</th>
            <th class="text-right px-4 py-3 text-gray-500 font-semibold">Coût journée (8h)</th>
            <th class="text-right px-4 py-3 text-gray-500 font-semibold">Coût annuel (1750h)</th>
          </tr>
        </thead>
        <tbody>
          ${FOPS.map(op=>`
          <tr class="border-b border-gray-50 hover:bg-amber-50/30 cost-row">
            <td class="px-4 py-2.5">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style="background:${op.activite==='Seem'?'#3b82f6':'#ec4899'}">${escX(op.nom.charAt(0))}</div>
                <span class="font-bold text-gray-800">${escX(op.nom)}</span>
              </div>
            </td>
            <td class="px-4 py-2.5 text-gray-500">${escX(op.poste)}</td>
            <td class="px-4 py-2.5 text-center">
              <span class="badge" style="background:${op.activite==='Seem'?'#dbeafe':'#fce7f3'};color:${op.activite==='Seem'?'#1d4ed8':'#831843'}">${escX(op.activite)}</span>
            </td>
            <td class="px-4 py-2.5 text-center">
              <span class="badge" style="background:#f3f4f6;color:#374151">${escX(op.categorie)}</span>
            </td>
            <td class="px-4 py-2.5 text-right">
              <input type="number" step="0.10" value="${op.taux_brut}" onchange="recalcTaux(this,'${op.id}')"
                class="w-20 text-right border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold bg-white focus:border-amber-400 outline-none"/>
            </td>
            <td class="px-4 py-2.5 text-right">
              <input type="number" step="1" value="${(op.charges*100).toFixed(0)}" onchange="recalcCharges(this,'${op.id}')"
                class="w-16 text-right border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold bg-white focus:border-amber-400 outline-none"/>%
            </td>
            <td class="px-4 py-2.5 text-right font-black text-amber-700 text-base" id="tc-${op.id}">${op.taux_chargé.toFixed(2)} €</td>
            <td class="px-4 py-2.5 text-right text-gray-600" id="jour-${op.id}">${(op.taux_chargé*8).toFixed(2)} €</td>
            <td class="px-4 py-2.5 text-right text-gray-600 font-semibold" id="an-${op.id}">${(op.taux_chargé*1750).toLocaleString('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0})}</td>
          </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr class="bg-amber-50 border-t-2 border-amber-200">
            <td colspan="4" class="px-4 py-2.5 font-bold text-gray-700 text-xs">Moyenne pondérée</td>
            <td class="px-4 py-2.5 text-right font-bold text-gray-800">${(FOPS.reduce((s,o)=>s+o.taux_brut,0)/FOPS.length).toFixed(2)} €/h</td>
            <td class="px-4 py-2.5 text-right text-gray-500">45%</td>
            <td class="px-4 py-2.5 text-right font-black text-amber-700">${(FOPS.reduce((s,o)=>s+o.taux_chargé,0)/FOPS.length).toFixed(2)} €/h</td>
            <td colspan="2" class="px-4 py-2.5 text-right text-gray-500 text-xs">
              Masse salariale annuelle : ${FOPS.reduce((s,o)=>s+o.taux_chargé*1750,0).toLocaleString('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0})}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- NOTE -->
  <div class="card p-4 text-xs text-gray-500">
    <div class="font-bold text-gray-700 mb-2"><i class="fas fa-link mr-1 text-blue-500"></i>Intégrations automatiques</div>
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-gray-50 rounded-xl p-3"><i class="fas fa-calculator text-amber-500 mr-1"></i><strong>Coût de revient</strong> – Les taux chargés alimentent le calcul CR du BE (§4.2)</div>
      <div class="bg-gray-50 rounded-xl p-3"><i class="fas fa-chart-bar text-blue-500 mr-1"></i><strong>Power BI</strong> – Les imputations réelles × taux = coût MO réel par BDT (§4.18)</div>
      <div class="bg-gray-50 rounded-xl p-3"><i class="fas fa-sync text-green-500 mr-1"></i><strong>Silae</strong> – Interface paie : mise à jour mensuelle des taux via connecteur ERP</div>
    </div>
  </div>
</main>

<div class="notif-banner" id="notifBanner"></div>
<script>
function recalcTaux(input, opId) {
  const brut = parseFloat(input.value)||0;
  const chargesEl = input.closest('tr').querySelectorAll('input')[1];
  const charges = (parseFloat(chargesEl?.value)||45)/100;
  const tc = brut*(1+charges);
  const tcEl = document.getElementById('tc-'+opId);
  const jEl  = document.getElementById('jour-'+opId);
  const aEl  = document.getElementById('an-'+opId);
  if(tcEl) tcEl.textContent = tc.toFixed(2)+' €';
  if(jEl)  jEl.textContent  = (tc*8).toFixed(2)+' €';
  if(aEl)  aEl.textContent  = (tc*1750).toLocaleString('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0});
}
function recalcCharges(input, opId) { recalcTaux(input.closest('tr').querySelector('input'), opId); }
function saveAll() { pushNotif('ok','fa-save','Taux horaires enregistrés. Calculs CR recalculés automatiquement. Synchronisation Silae en cours.'); }
function pushNotif(type,icon,msg){
  const b=document.getElementById('notifBanner');const id='n'+Date.now();const d=document.createElement('div');
  d.id=id;d.className='notif notif-'+type;
  d.innerHTML=\`<i class="fas \${icon} mr-2"></i>\${msg}<button onclick="this.parentElement.remove()" class="float-right ml-2 text-gray-400"><i class="fas fa-times"></i></button>\`;
  b.appendChild(d);
  setTimeout(()=>{const e=document.getElementById(id);if(e){e.style.opacity='0';setTimeout(()=>{const e2=document.getElementById(id);if(e2)e2.remove();},400);}},6000);
}
</script>
</body></html>`
}

// ══════════════════════════════════════════════════════════════
// PAGE COÛTS HORAIRES FMACS
// ══════════════════════════════════════════════════════════════
export const pageFinancesMachines = (machines: any[] = [], opex: any[] = [], postes: any[] = []) => {
  const FMACS = finMacs(machines, opex, postes)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Coûts Horaires Machines · ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>${CSS_FIN}</style>
</head>
<body class="min-h-screen flex">
${SIDEBAR_FIN('machines')}
<main class="flex-1 p-5 overflow-y-auto">
  <div class="flex items-center justify-between mb-5">
    <div class="flex items-center gap-4">
      <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg" style="background:linear-gradient(135deg,#6366f1,#4f46e5)"><i class="fas fa-industry"></i></div>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Coûts Horaires Machines</h1>
        <p class="text-gray-400 text-xs">Amortissement + maintenance + énergie = coût horaire total · Intégré au coût de revient</p>
      </div>
    </div>
    <button onclick="saveAll()" class="btn-primary" style="background:linear-gradient(135deg,#6366f1,#4f46e5);box-shadow:0 2px 8px rgba(99,102,241,.3)"><i class="fas fa-save"></i> Enregistrer</button>
  </div>

  <div class="card p-3 mb-4 bg-indigo-50 border-l-4 border-indigo-400 text-xs text-indigo-800">
    <i class="fas fa-info-circle mr-1"></i>
    <strong>Coût horaire machine = (Amortissement annuel + Maintenance annuelle + Coût énergie annuel) / Heures annuelles</strong><br>
    Le coût énergie annuel = coût énergie / heure × heures annuelles. Ces taux sont utilisés dans le calcul du coût de revient pour chaque opération utilisant une machine.
  </div>

  ${['Seem','Semrac'].map(act=>{
    const macs = FMACS.filter(m=>m.activite===act)
    if(!macs.length) return ''
    const coutMoy = macs.reduce((s,m)=>s+m.cout_h,0)/macs.length
    return `<div class="card p-4 mb-4">
      <div class="flex items-center gap-3 mb-3">
        <span class="px-3 py-1 rounded-full text-sm font-bold ${act==='Seem'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700'}">${act}</span>
        <h2 class="font-bold text-gray-800">Machines – ${act}</h2>
        <span class="text-xs text-gray-400 ml-auto">${macs.length} machine(s) · Coût horaire moyen : ${coutMoy.toFixed(2)} €/h</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead><tr class="bg-gray-50 border-b border-gray-100">
            <th class="text-left px-3 py-2 text-gray-500 font-semibold">Machine</th>
            <th class="text-left px-3 py-2 text-gray-500 font-semibold">Code</th>
            <th class="text-left px-3 py-2 text-gray-500 font-semibold">Famille</th>
            <th class="text-right px-3 py-2 text-gray-500 font-semibold">Capacité (h)</th>
            <th class="text-right px-3 py-2 text-gray-500 font-semibold">OPEX annuel (€)</th>
            <th class="text-right px-3 py-2 text-gray-500 font-semibold">H. productives</th>
            <th class="text-right px-3 py-2 text-gray-500 font-semibold font-bold text-indigo-700">Coût horaire (€/h)</th>
          </tr></thead>
          <tbody>
            ${macs.map(m=>`<tr class="border-b border-gray-50 cost-row">
              <td class="px-3 py-2 font-bold text-gray-800">${escX(m.nom)}</td>
              <td class="px-3 py-2 text-gray-500">${escX(m.code)||'—'}</td>
              <td class="px-3 py-2 text-gray-500">${escX(m.famille)}</td>
              <td class="px-3 py-2 text-right text-gray-600">${m.capacite_h?m.capacite_h.toLocaleString('fr-FR'):'—'}</td>
              <td class="px-3 py-2 text-right text-gray-600">${m.opex_annuel?m.opex_annuel.toLocaleString('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}):'—'}</td>
              <td class="px-3 py-2 text-right text-gray-600">${m.opex_heures?m.opex_heures.toLocaleString('fr-FR'):'—'}</td>
              <td class="px-3 py-2 text-right font-black text-indigo-700 text-base">${m.taux_horaire_total.toFixed(2)} €/h${(m.taux_horaire_total - m.taux_base) > 0.005 ? `<div class="text-xs font-semibold text-teal-600">dont +${(m.taux_horaire_total - m.taux_base).toFixed(2)} achats poste</div>` : ''}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`
  }).join('')}
</main>
<div class="notif-banner" id="notifBanner"></div>
<script>
function saveAll(){pushNotif('ok','fa-save','Coûts machines enregistrés. Calculs CR recalculés. Power BI mis à jour.');}
function pushNotif(type,icon,msg){
  const b=document.getElementById('notifBanner');const id='n'+Date.now();const d=document.createElement('div');
  d.id=id;d.className='notif notif-'+type;
  d.innerHTML=\`<i class="fas \${icon} mr-2"></i>\${msg}<button onclick="this.parentElement.remove()" class="float-right ml-2 text-gray-400"><i class="fas fa-times"></i></button>\`;
  b.appendChild(d);
  setTimeout(()=>{const e=document.getElementById(id);if(e){e.style.opacity='0';setTimeout(()=>{const e2=document.getElementById(id);if(e2)e2.remove();},400);}},5000);
}
</script>
</body></html>`
}

// ══════════════════════════════════════════════════════════════
// PAGE FIMPS DES TEMPS
// §4.18 – Calcul automatique via statuts BDT
// ══════════════════════════════════════════════════════════════
export const pageFinancesImputations = (bdts: any[] = [], salaries: any[] = [], machines: any[] = [], opex: any[] = [], postes: any[] = []) => {
  const FIMPS = finImps(bdts), FOPS = finOps(salaries), FMACS = finMacs(machines, opex, postes)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Imputations des Temps · ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
  <style>${CSS_FIN}</style>
</head>
<body class="min-h-screen flex">
${SIDEBAR_FIN('imput')}
<main class="flex-1 p-5 overflow-y-auto">
  <div class="flex items-center justify-between mb-5">
    <div class="flex items-center gap-4">
      <div class="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-lg" style="background:linear-gradient(135deg,#3b82f6,#2563eb)"><i class="fas fa-stopwatch"></i></div>
      <div>
        <h1 class="text-xl font-bold text-gray-900">Imputations des Temps – Journal BDT</h1>
        <p class="text-gray-400 text-xs">§4.18 · Calcul automatique début→fin BDT · Alimenté par les soldages opérateurs · Power BI intégré</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="pushNotif('info','fa-sync','Synchronisation Power BI effectuée. Tableaux de bord mis à jour.')" class="btn-secondary text-xs"><i class="fas fa-sync mr-1 text-blue-500"></i>Sync Power BI</button>
      <button onclick="pushNotif('info','fa-file-excel','Export imputations généré. Mail envoyé à la direction.')" class="btn-primary text-xs"><i class="fas fa-file-excel"></i> Exporter</button>
    </div>
  </div>

  <!-- RAPPEL PROCESSUS -->
  <div class="card p-4 mb-4">
    <h3 class="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2"><i class="fas fa-route text-blue-500"></i> Processus d'imputation automatique (§4.18)</h3>
    <div class="flex items-center gap-2 overflow-x-auto pb-2">
      ${[
        {icon:'fa-file-alt',label:'BDT créé',sub:'Programmé',color:'#3b82f6'},
        {icon:'fa-play',label:'Opérateur reçoit',sub:'Statut → Reçu',color:'#f59e0b'},
        {icon:'fa-clock',label:'Début auto enregistré',sub:'H:MM horodatée',color:'#8b5cf6'},
        {icon:'fa-check-double',label:'BDT soldé',sub:'Statut → Soldé',color:'#22c55e'},
        {icon:'fa-calculator',label:'Temps réel calculé',sub:'Fin – Début',color:'#f97316'},
        {icon:'fa-chart-bar',label:'Power BI',sub:'KPIs mis à jour',color:'#0ea5e9'},
        {icon:'fa-euro-sign',label:'CR recalculé',sub:'Coût réel MO + Mac',color:'#d97706'},
      ].map((s,i)=>`
      <div class="flex items-center gap-2 flex-shrink-0">
        <div class="flex flex-col items-center text-center">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm mb-1" style="background:${s.color}"><i class="fas ${s.icon}"></i></div>
          <div class="text-xs font-bold text-gray-700 whitespace-nowrap">${s.label}</div>
          <div class="text-xs text-gray-400 whitespace-nowrap">${s.sub}</div>
        </div>
        ${i<6?'<i class="fas fa-chevron-right text-gray-300 flex-shrink-0"></i>':''}
      </div>`).join('')}
    </div>
  </div>

  <!-- FIMPS DU JOUR -->
  <div class="card p-4 mb-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-bold text-gray-800 text-sm flex items-center gap-2">
        <i class="fas fa-calendar-day text-blue-500"></i> Imputations du jour – ${new Date().toLocaleDateString('fr-FR')}
      </h3>
      <div class="flex items-center gap-2">
        <input type="date" value="${new Date().toISOString().slice(0,10)}" class="form-input w-36 text-xs"/>
        <button onclick="pushNotif('info','fa-check','Pointages validés par Lénaïck (Responsable production). Transmission paie.')" class="btn-primary text-xs" style="background:linear-gradient(135deg,#22c55e,#16a34a);box-shadow:0 2px 6px rgba(34,197,94,.3)">
          <i class="fas fa-check-double"></i> Valider tout
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead><tr class="bg-gray-50 border-b border-gray-100">
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Imputation</th>
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">BDT</th>
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Opérateur</th>
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Machine</th>
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Opération</th>
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Commande</th>
          <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">Alloué (h)</th>
          <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">Réel (h)</th>
          <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">Coût MO (€)</th>
          <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">Coût Mac (€)</th>
          <th class="text-right px-3 py-2.5 text-gray-500 font-semibold font-bold">Total (€)</th>
          <th class="text-center px-3 py-2.5 text-gray-500 font-semibold">Statut</th>
        </tr></thead>
        <tbody>
          ${FIMPS.map(imp=>{
            const op  = FOPS.find(o=>o.id===imp.op)
            const mac = FMACS.find(m=>m.id===imp.machine)
            const duree = imp.duree_reelle || imp.duree_allouee
            const coutMO = duree * (op?.taux_chargé||18)
            const coutMac= duree * (mac?.taux_horaire_total||0)
            const total  = coutMO + coutMac
            const ecart  = imp.duree_reelle ? imp.duree_reelle - imp.duree_allouee : null
            return `<tr class="border-b border-gray-50 cost-row">
              <td class="px-3 py-2 font-bold text-gray-600">${escX(imp.id)}</td>
              <td class="px-3 py-2 text-blue-600 underline cursor-pointer">${escX(imp.bdt)}</td>
              <td class="px-3 py-2 text-gray-700">${escX(op?.nom||imp.op)}</td>
              <td class="px-3 py-2 text-gray-500 text-xs">${escX(mac?.nom)||'Manuel'}</td>
              <td class="px-3 py-2 text-gray-600">${escX(imp.operation)}</td>
              <td class="px-3 py-2">
                <div class="text-gray-700 font-semibold">${escX(imp.cmd)}</div>
                <div class="text-gray-400 text-xs">${escX(imp.client)}</div>
              </td>
              <td class="px-3 py-2 text-right text-gray-500">${imp.duree_allouee.toFixed(2)}</td>
              <td class="px-3 py-2 text-right font-bold ${imp.duree_reelle?(imp.duree_reelle>imp.duree_allouee?'text-red-600':'text-green-600'):'text-gray-300'}">${imp.duree_reelle?.toFixed(2)||'—'}</td>
              <td class="px-3 py-2 text-right text-blue-600">${coutMO.toFixed(2)} €</td>
              <td class="px-3 py-2 text-right text-indigo-600">${coutMac.toFixed(2)} €</td>
              <td class="px-3 py-2 text-right font-black text-gray-800">${total.toFixed(2)} €</td>
              <td class="px-3 py-2 text-center">
                <span class="badge ${imp.statut==='solde'?'badge-ok':'badge-warn'}">${imp.statut==='solde'?'Soldé':'En cours'}</span>
                ${ecart!==null?`<div class="text-xs ${ecart>0?'text-red-500':'text-green-500'} mt-0.5">${ecart>0?'+':''}${ecart.toFixed(2)}h</div>`:''}
              </td>
            </tr>`
          }).join('')}
        </tbody>
        <tfoot>
          <tr class="bg-amber-50 border-t-2 border-amber-200 font-bold">
            <td colspan="6" class="px-3 py-2 text-gray-700 font-bold text-xs">Total journée</td>
            <td class="px-3 py-2 text-right text-gray-600">${FIMPS.reduce((s,i)=>s+i.duree_allouee,0).toFixed(2)}h</td>
            <td class="px-3 py-2 text-right text-gray-700">${FIMPS.reduce((s,i)=>s+(i.duree_reelle||i.duree_allouee),0).toFixed(2)}h</td>
            <td class="px-3 py-2 text-right text-blue-700">${FIMPS.reduce((s,i)=>{const op=FOPS.find(o=>o.id===i.op);return s+(i.duree_reelle||i.duree_allouee)*(op?.taux_chargé||18);},0).toFixed(2)} €</td>
            <td class="px-3 py-2 text-right text-indigo-700">${FIMPS.reduce((s,i)=>{const mac=FMACS.find(m=>m.id===i.machine);return s+(i.duree_reelle||i.duree_allouee)*(mac?.taux_horaire_total||0);},0).toFixed(2)} €</td>
            <td class="px-3 py-2 text-right font-black text-amber-700 text-sm">${FIMPS.reduce((s,i)=>{
              const op=FOPS.find(o=>o.id===i.op);
              const mac=FMACS.find(m=>m.id===i.machine);
              const d=i.duree_reelle||i.duree_allouee;
              return s+d*(op?.taux_chargé||18)+d*(mac?.taux_horaire_total||0);
            },0).toFixed(2)} €</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</main>

<div class="notif-banner" id="notifBanner"></div>
<script>
function pushNotif(type,icon,msg){
  const b=document.getElementById('notifBanner');const id='n'+Date.now();const d=document.createElement('div');
  d.id=id;d.className='notif notif-'+type;
  d.innerHTML=\`<i class="fas \${icon} mr-2"></i>\${msg}<button onclick="this.parentElement.remove()" class="float-right ml-2 text-gray-400"><i class="fas fa-times"></i></button>\`;
  b.appendChild(d);
  setTimeout(()=>{const e=document.getElementById(id);if(e){e.style.opacity='0';setTimeout(()=>{const e2=document.getElementById(id);if(e2)e2.remove();},400);}},6000);
}
</script>
</body></html>`
}
