// ══════════════════════════════════════════════════════════════
// MODULE FINANCES – TAUX HORAIRES, IMPUTATIONS, TAUX MACHINE DES PROCESS
// COÛT DE REVIENT UNITAIRE
// Conforme cahier des charges §4.2 (coût de revient BE), §4.18
// §5 (Power BI), §4.17 (Direction)
// ──────────────────────────────────────────────────────────────
// 14/09/2026 — COÛT HORAIRE PORTÉ PAR LE PROCESS (shared.ts construireTauxAtelier, règle UNIQUE) :
//   · taux MACHINE = process_atelier.taux_horaire_machine, saisi à la main sur le process machine ;
//   · taux HOMME   = coût chargé RH (salaries.taux_horaire_charge) — l'opérateur du BDT pour le coût
//                    réel, la moyenne des opérateurs actifs du site pour le coût estimé ;
//   · plus AUCUN taux sur la machine (cout_h), le poste (taux_horaire_manuel) ni l'OPEX : l'OPEX reste
//     affiché en euros, jamais converti en €/h (computePosteRates n'est plus appelé ici).
// Les pages Coûts, Machines et Imputations reçoivent les lignes BRUTES de process_atelier dans leur
// DERNIER paramètre ({ process, erreur }). Sans elles, le coût machine est déclaré indisponible — jamais
// remplacé par une valeur inventée.
// ══════════════════════════════════════════════════════════════
import { escX, construireTauxAtelier, coutReelBdt, typeProcess } from './shared'
import type { TauxAtelier, SourceTauxMachine, ManquantCout } from './shared'

const sjX = (v: any) => JSON.stringify(v ?? null).replace(/</g, '\\u003c')

/** Données de taux transmises par la route (dernier paramètre des pages Coûts, Machines et Imputations). */
export interface DonneesTauxFinances {
  /** Lignes BRUTES de process_atelier (select '*' : l'absence de la propriété taux_horaire_machine
   *  signale la transition, base sans cloud-7). null / absent = non transmises → taux machine indisponibles. */
  process?: any[] | null
  /** Échec de lecture des taux (ex. getTauxAtelier().error) : jamais confondu avec « aucun taux ». */
  erreur?: string | null
}

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
  .form-input:disabled{background:#f1f5f9;color:#9ca3af;}
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
      <i class="fas fa-industry w-4 text-orange-400"></i> Taux machine des process
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

// ─── HELPERS ──────────────────────────────────────────────────
const fmt2 = (n: any) => (Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtEur0 = (n: any) => (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const lcTxt = (v: any) => String(v ?? '').trim().toLowerCase()
/** Sites dans l'ordre Seem, Semrac, puis les autres (OAS…) par ordre alphabétique. */
const ordreSites = (vals: any[]): string[] => {
  const uniques = Array.from(new Set((vals || []).map((v: any) => String(v ?? '').trim() || '—')))
  const rang = (s: string) => (s === 'Seem' ? 0 : s === 'Semrac' ? 1 : 2)
  return uniques.sort((a, b) => rang(a) - rang(b) || a.localeCompare(b, 'fr'))
}
const couleurSite = (s: string): [string, string] => (s === 'Seem' ? ['#dbeafe', '#1d4ed8'] : s === 'Semrac' ? ['#fce7f3', '#831843'] : ['#f3f4f6', '#374151'])
/** Base sans la colonne taux_horaire_machine (cloud avant cloud-7) : le taux affiché vient de machines.cout_h. */
const enTransition = (process: any[]) => (process || []).some((p: any) => p && !Object.prototype.hasOwnProperty.call(p, 'taux_horaire_machine'))
const MSG_CLOUD7 = 'La colonne <code>process_atelier.taux_horaire_machine</code> n’existe pas encore sur cette base : jouez <code>docker/db/cloud/cloud-7-process-taux-horaire-machine.sql</code> dans le Studio en ligne. En attendant, le taux affiché est le coût horaire actuel de la machine du process.'

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

/** Taux machine RÉSOLU d'un process (source unique : TauxAtelier.tauxMachine). `taux` null = à saisir. */
interface ProcTaux { id: string; nom: string; code: string; activite: string; machine_id: string; inactif: boolean; taux: number | null; source: SourceTauxMachine }
const finProcTaux = (p: any, tx: TauxAtelier): ProcTaux => {
  const t = tx.tauxMachine(p.id)
  return {
    id: String(p.id), nom: String(p.nom || p.code || p.id), code: String(p.code || ''), activite: String(p.activite || ''),
    machine_id: p.machine_id == null ? '' : String(p.machine_id),
    inactif: lcTxt(p.statut) === 'inactif',
    taux: (t.source === 'process' || t.source === 'transition_machine') ? t.taux : null,
    source: t.source,
  }
}
const processMachine = (process: any[] = []) => (process || []).filter((p: any) => p && p.id != null && typeProcess(p) === 'machine')
const badgeTaux = (pt: ProcTaux) => pt.taux == null
  ? `<span class="badge badge-warn" title="Saisir le taux dans Production › Process Ateliers">taux à saisir</span>`
  : `<span class="font-black text-indigo-700 whitespace-nowrap">${fmt2(pt.taux)} €/h</span>${pt.source === 'transition_machine' ? ` <span class="badge" style="background:#e0f2fe;color:#075985" title="Taux repris du coût horaire de la machine tant que cloud-7 n’est pas joué">transition</span>` : ''}`

/** Page Machines : pour chaque machine, ses process MACHINE et leur taux saisi. L'OPEX reste en euros. */
const finMacs = (machines: any[] = [], opex: any[] = [], process: any[] = [], tx: TauxAtelier) => {
  const opexBy: Record<string, any> = {}
  for (const o of opex || []) { const k = String(o.machine_id); if (!opexBy[k] || (Number(o.annee) || 0) > (Number(opexBy[k].annee) || 0)) opexBy[k] = o }
  const procMach = processMachine(process)
  return (machines || []).map((m: any) => {
    const ox = opexBy[String(m.id)] || null
    return {
      id: m.id, nom: m.nom, code: m.code || '', famille: m.categorie || '—',
      activite: String(m.activite || '').trim() || '—',
      capacite_h: Number(m.capacite_h) || 0,
      opex_annuel: ox && ox.cout_total_ht != null ? Number(ox.cout_total_ht) : null,
      opex_annee: ox && ox.annee != null ? Number(ox.annee) : null,
      process: procMach.filter((p: any) => String(p.machine_id ?? '') === String(m.id)).map((p: any) => finProcTaux(p, tx)),
    }
  })
}

/** Imputations : BDT reçus / en cours / soldés, valorisés par la règle UNIQUE du coût réel (coutReelBdt). */
const finImps = (bdts: any[] = [], tx: TauxAtelier, salById: Record<string, any>) => (bdts || [])
  .filter((b: any) => b && /sold|termine|recu|cours/.test(lcTxt(b.statut)))
  .map((b: any) => ({
    id: b.id, op: b.operateur_id || '', machine: b.machine_id || '', process_id: b.process_id || '',
    operation: b.operation || '—', cmd: b.cmd_id || b.num_affaire || '—', client: b.client_nom || '—',
    duree_allouee: Number(b.duree) || 0,
    duree_reelle: (b.temps_reel != null && b.temps_reel !== '' && Number.isFinite(Number(b.temps_reel))) ? Number(b.temps_reel) : null,
    statut: /sold/.test(lcTxt(b.statut)) ? 'solde' : 'en_cours',
    // t = temps_reel ?? duree ; homme = t × taux chargé de l'opérateur (repli moyenne du site) ;
    // machine = t × taux du process du BDT si ce process est de type machine.
    cout: coutReelBdt(b, tx, salById),
  }))

const LIB_SOURCE_HOMME: Record<string, string> = { operateur: 'taux de l’opérateur', moyenne: 'moyenne du site', manquant: 'coût chargé RH manquant' }
const LIB_SOURCE_MACHINE: Record<string, string> = { process: 'taux du process', transition_machine: 'transition : coût machine', manquant: 'taux à saisir', sans_process: 'BDT machine sans process', manuel: 'process manuel', oas: 'OAS' }
const LIB_MANQUANT: Record<ManquantCout, string> = { taux_homme: 'coût chargé RH manquant', taux_machine: 'taux machine à saisir', sans_process: 'BDT machine sans process' }

// ══════════════════════════════════════════════════════════════
// PAGE COÛT DE REVIENT
// ══════════════════════════════════════════════════════════════
export const pageFinancesCouts = (_commandes: any[] = [], salaries: any[] = [], machines: any[] = [], _opex: any[] = [], _postes: any[] = [], donnees: DonneesTauxFinances = {}) => {
  const process = Array.isArray(donnees?.process) ? donnees.process : null
  const erreur = donnees?.erreur || null
  const tx = construireTauxAtelier(process || [], salaries, machines)
  const H = tx.hommeParSite
  const procMach = processMachine(process || []).map((p: any) => finProcTaux(p, tx))
  const nbSaisis = procMach.filter(p => p.taux != null).length
  const transition = process ? enTransition(process) : false
  // Simulateur : process internes (machine / manuel) non inactifs et leur taux machine RÉSOLU.
  // Aucune donnée individuelle ne part au navigateur (taux homme = MOYENNES uniquement).
  const SIM_PROCESS = (process || [])
    .filter((p: any) => p && p.id != null && typeProcess(p) !== 'oas' && lcTxt(p.statut) !== 'inactif')
    .map((p: any) => { const t = finProcTaux(p, tx); const ty = typeProcess(p); return { id: t.id, nom: t.nom, activite: t.activite, type: ty, taux: ty === 'machine' ? t.taux : null } })
  const moyTxt = (v: number | null) => v != null ? `${fmt2(v)} €/h` : '<span class="text-sm text-amber-700">non renseigné</span>'
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Coût de Revient · ERP Seem Semrac</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
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
        <p class="text-gray-400 text-xs">Méthode · taux en vigueur · simulateur · §4.2 + §4.18 Cahier des charges</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <a href="/finances/taux"><button class="tab-btn text-xs">Taux opérateurs</button></a>
      <a href="/finances/machines"><button class="tab-btn text-xs">Taux machine</button></a>
      <a href="/finances/imputations"><button class="tab-btn text-xs">Imputations</button></a>
      <button onclick="openSimulModal()" class="btn-primary text-xs"><i class="fas fa-calculator"></i> Simuler CR</button>
    </div>
  </div>

  <div class="p-4">
    ${erreur ? `<div class="card p-3 mb-4 border-l-4 border-red-500 bg-red-50 text-xs text-red-800"><i class="fas fa-triangle-exclamation mr-1"></i><strong>Lecture des taux impossible</strong> : ${escX(erreur)}. Les taux ci-dessous ne sont pas fiables.</div>` : ''}

    <!-- EXPLICATION MÉTHODE -->
    <div class="card p-4 mb-4 border-l-4 border-amber-400 bg-amber-50">
      <div class="flex items-start gap-3">
        <i class="fas fa-info-circle text-amber-500 mt-0.5"></i>
        <div class="text-xs text-amber-800 space-y-1.5">
          <div class="font-bold">Méthode de calcul du Coût de Revient (CR) – §4.2 & §4.18</div>
          <div><strong>CR = Σ heures homme × taux homme + Σ heures machine × taux machine du process + matière + accessoires + sous-traitance / OAS (au prix)</strong></div>
          <div class="overflow-x-auto">
            <table class="text-xs bg-white/70 rounded-lg">
              <thead><tr class="text-amber-900"><th class="text-left px-2 py-1">Temps de l’étape</th><th class="px-2 py-1">Homme</th><th class="px-2 py-1">Machine</th><th class="text-left px-2 py-1">Nature</th></tr></thead>
              <tbody>
                <tr><td class="px-2 py-0.5">Réglage homme (ROP)</td><td class="text-center">✔</td><td class="text-center">—</td><td class="px-2">fixe / lot</td></tr>
                <tr><td class="px-2 py-0.5">Réglage machine (RGM)</td><td class="text-center">✔</td><td class="text-center">✔</td><td class="px-2">fixe / lot</td></tr>
                <tr><td class="px-2 py-0.5">Temps homme variable (THV)</td><td class="text-center">✔</td><td class="text-center">—</td><td class="px-2">par pièce (fixe / lot si opération fixe)</td></tr>
                <tr><td class="px-2 py-0.5">Temps machine variable (TMV)</td><td class="text-center">—</td><td class="text-center">✔</td><td class="px-2">par pièce (fixe / lot si opération fixe)</td></tr>
              </tbody>
            </table>
          </div>
          <div><strong>Taux homme</strong> = coût chargé RH (fiche salarié). Coût <em>estimé</em> (nomenclature, analyse DT) : moyenne des opérateurs actifs du site ; coût <em>réel</em> (BDT) : taux de l’opérateur pointé.</div>
          <div><strong>Taux machine</strong> = taux saisi sur le <em>process machine</em> (Production › Process Ateliers), appliqué seulement aux process de type machine. Machines, postes et OPEX ne portent plus de taux horaire.</div>
          <div><strong>Coût réel d’une commande</strong> = temps pointé des BDT × (taux de l’opérateur + taux machine si process machine) + matière sortie + bons de commande de sous-traitance. Aucun frais général n’est ajouté par l’ERP.</div>
        </div>
      </div>
    </div>

    <!-- TAUX EN VIGUEUR -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div class="kpi-card" style="border-color:#3b82f6">
        <div class="text-xs font-semibold text-gray-500 mb-1">Taux homme moyen · Seem</div>
        <div class="text-xl font-black text-gray-900">${moyTxt(H.seem)}</div>
        <div class="text-xs text-gray-400 mt-0.5">coût chargé RH, opérateurs actifs</div>
      </div>
      <div class="kpi-card" style="border-color:#ec4899">
        <div class="text-xs font-semibold text-gray-500 mb-1">Taux homme moyen · Semrac</div>
        <div class="text-xl font-black text-gray-900">${moyTxt(H.semrac)}</div>
        <div class="text-xs text-gray-400 mt-0.5">coût chargé RH, opérateurs actifs</div>
      </div>
      <div class="kpi-card" style="border-color:#f59e0b">
        <div class="text-xs font-semibold text-gray-500 mb-1">Taux homme moyen · atelier</div>
        <div class="text-xl font-black text-gray-900">${moyTxt(H.moyen)}</div>
        <div class="text-xs text-gray-400 mt-0.5">repli quand le site n’a aucun taux</div>
      </div>
      <div class="kpi-card" style="border-color:#6366f1">
        <div class="text-xs font-semibold text-gray-500 mb-1">Process machine · taux saisis</div>
        <div class="text-xl font-black text-gray-900">${process ? `${nbSaisis} / ${procMach.length}` : '—'}</div>
        <div class="text-xs mt-0.5 ${process && procMach.length - nbSaisis > 0 ? 'text-amber-700 font-semibold' : 'text-gray-400'}">${process ? (procMach.length - nbSaisis > 0 ? `${procMach.length - nbSaisis} taux à saisir` : 'aucun taux à saisir') : 'process non transmis'} · <a href="/finances/machines" class="underline">détail</a></div>
      </div>
    </div>
    ${tx.hommeManquant ? `<div class="card p-3 mb-3 border-l-4 border-amber-500 bg-amber-50 text-xs text-amber-800"><i class="fas fa-user-slash mr-1"></i><strong>Coût chargé RH à renseigner</strong> : aucun opérateur actif n’a de taux horaire chargé. Le temps homme est compté 0 € et signalé partout.</div>` : ''}
    ${process == null ? `<div class="card p-3 mb-3 border-l-4 border-amber-500 bg-amber-50 text-xs text-amber-800"><i class="fas fa-circle-exclamation mr-1"></i>Les process ne sont pas transmis à cette page : les taux machine ne peuvent pas être affichés ni proposés au simulateur.</div>` : ''}
    ${transition ? `<div class="card p-3 mb-3 border-l-4 border-sky-500 bg-sky-50 text-xs text-sky-800"><i class="fas fa-database mr-1"></i>${MSG_CLOUD7}</div>` : ''}

    <!-- OÙ VOIR LES COÛTS -->
    <div class="card p-4 mb-4 text-xs text-gray-600">
      <div class="font-bold text-gray-800 text-sm mb-2"><i class="fas fa-route mr-1 text-amber-500"></i>Où consulter les coûts de revient</div>
      <div class="grid md:grid-cols-3 gap-3">
        <a href="/be/service" class="block bg-gray-50 hover:bg-amber-50 rounded-xl p-3"><i class="fas fa-drafting-compass text-amber-500 mr-1"></i><strong>Coût estimé</strong> – nomenclatures et analyse des demandes de travaux (Bureau d’études)</a>
        <a href="/commercial/commandes-validees" class="block bg-gray-50 hover:bg-amber-50 rounded-xl p-3"><i class="fas fa-folder-open text-blue-500 mr-1"></i><strong>Coût réel</strong> – fiche affaire / commande : temps pointés, matière, sous-traitance, marge</a>
        <a href="/finances/imputations" class="block bg-gray-50 hover:bg-amber-50 rounded-xl p-3"><i class="fas fa-stopwatch text-indigo-500 mr-1"></i><strong>Imputations</strong> – coût homme et machine de chaque BDT</a>
      </div>
    </div>
  </div>
</main>

<!-- MODAL SIMULATION CR -->
<div id="simulModal" class="modal-overlay hidden">
  <div class="modal-box" style="max-width:1060px">
    <div class="px-5 py-3.5 border-b flex items-center justify-between" style="background:linear-gradient(135deg,#f59e0b,#d97706)">
      <h3 class="font-bold text-white"><i class="fas fa-calculator mr-2"></i>Simulateur Coût de Revient – Bureau d'Études</h3>
      <button onclick="closeModal('simulModal')" class="text-white/70 hover:text-white text-xl"><i class="fas fa-times"></i></button>
    </div>
    <div class="p-5 space-y-4">
      <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
        <i class="fas fa-info-circle mr-1"></i>
        Simulation libre, rien n’est enregistré. Les taux proposés viennent du référentiel : moyenne du coût chargé RH du site pour le temps homme, taux saisi sur le process pour le temps machine. Toute valeur modifiée ici reste une hypothèse.
      </div>
      <div class="grid grid-cols-4 gap-3">
        <div><label class="form-label">Activité *</label>
          <select id="sim_act" class="form-input" onchange="simSite()">
            <option value="Seem">Seem</option><option value="Semrac">Semrac</option>
          </select>
        </div>
        <div><label class="form-label">Référence pièce</label><input id="sim_piece" type="text" placeholder="DISSIP-XX" class="form-input"/></div>
        <div><label class="form-label">Quantité du lot</label><input id="sim_qte" type="number" min="1" value="1" class="form-input" title="Les réglages (ROP, RGM) sont comptés une fois par lot puis répartis sur les pièces"/></div>
        <div><label class="form-label">Taux homme (€/h)</label><input id="sim_tauxh" type="number" step="any" min="0" placeholder="à saisir" class="form-input" oninput="this.setAttribute('data-touche','1')"/></div>
      </div>
      <div id="sim_tauxh_hint" class="text-xs text-gray-500 -mt-2"></div>

      <div id="sim_etapes" class="space-y-2">
        <div class="font-bold text-gray-700 text-sm">Gamme opératoire :</div>
        <div class="grid gap-2 text-gray-500" style="grid-template-columns:1.2fr 1.7fr .9fr repeat(4,.75fr) .9fr 34px;font-size:.62rem;font-weight:700;text-transform:uppercase;">
          <div>Opération</div><div>Process</div><div>Type</div>
          <div title="Réglage homme : homme, fixe par lot">ROP min/lot</div>
          <div title="Réglage machine : homme + machine, fixe par lot">RGM min/lot</div>
          <div title="Temps homme variable : homme, par pièce">THV min/pce</div>
          <div title="Temps machine variable : machine, par pièce">TMV min/pce</div>
          <div>Taux machine €/h</div><div></div>
        </div>
        <div id="sim_etapes_list" class="space-y-2"></div>
        <button onclick="addEtape()" class="btn-secondary text-xs w-full"><i class="fas fa-plus mr-1"></i>Ajouter une opération</button>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div><label class="form-label">Matière (€/pièce)</label><input id="sim_mat" type="number" step="0.01" placeholder="0" class="form-input"/></div>
        <div><label class="form-label">Frais généraux (%) – hypothèse</label><input id="sim_fg" type="number" step="any" placeholder="0" class="form-input" title="Non compté par l’ERP dans le coût de revient"/></div>
        <div><label class="form-label">Coefficient de vente (×)</label><input id="sim_coeff" type="number" step="0.01" placeholder="ex. 1,35" class="form-input"/></div>
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

<script>
var SIM_PROCESS=${sjX(SIM_PROCESS)};
var SIM_TH=${sjX(H)};
function simEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function simNum(v){ if(v==null) return null; var t=String(v).trim().replace(',','.'); if(t==='') return null; var n=parseFloat(t); return isFinite(n)?n:null; }
function simFmt(n,d){ return (Number(n)||0).toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d}); }
function simVal(r,sel){ var el=r.querySelector(sel); if(!el||el.disabled) return 0; var n=simNum(el.value); return (n!=null&&n>0)?n:0; }
function openSimulModal(){ document.getElementById('simulModal').classList.remove('hidden'); if(!document.querySelector('.sim-etape')) addEtape(); simSite(); }
function closeModal(id){ document.getElementById(id).classList.add('hidden'); }

// Taux homme proposé = moyenne du site (repli : moyenne de tous les opérateurs) — même règle que le coût estimé.
function simSite(){
  var site=String(document.getElementById('sim_act').value||'').toLowerCase();
  var duSite=!!(SIM_TH&&SIM_TH[site]!=null);
  var t=duSite?SIM_TH[site]:(SIM_TH?SIM_TH.moyen:null);
  var inp=document.getElementById('sim_tauxh'), hint=document.getElementById('sim_tauxh_hint');
  if(inp&&inp.getAttribute('data-touche')!=='1') inp.value=(t!=null)?String(t):'';
  if(hint) hint.textContent=(t!=null)?('Proposé : moyenne du coût chargé RH des opérateurs actifs '+(duSite?'du site':'de l’atelier (aucun taux sur ce site)')+' = '+simFmt(t,2)+' €/h'):'Coût chargé RH non renseigné dans les fiches salariés : saisir un taux homme pour simuler.';
}
function simProcOptions(){
  var h='<option value="">Saisie libre</option>';
  SIM_PROCESS.forEach(function(p){
    var lib=(p.activite?'['+p.activite+'] ':'')+p.nom+' · '+(p.type==='machine'?('machine · '+(p.taux!=null?simFmt(p.taux,2)+' €/h':'taux à saisir')):'manuel');
    h+='<option value="'+simEsc(p.id)+'">'+simEsc(lib)+'</option>';
  });
  return h;
}
function addEtape(){
  var d=document.createElement('div');
  d.className='grid gap-2 items-end sim-etape';
  d.style.gridTemplateColumns='1.2fr 1.7fr .9fr repeat(4,.75fr) .9fr 34px';
  d.innerHTML='<div><input type="text" placeholder="Opération" class="form-input sim-op"/></div>'
    +'<div><select class="form-input sim-proc">'+simProcOptions()+'</select></div>'
    +'<div><select class="form-input sim-type"><option value="manuel">Manuel</option><option value="machine">Machine</option></select></div>'
    +'<div><input type="number" step="any" min="0" placeholder="0" class="form-input sim-rop" title="Réglage homme (ROP) : homme, fixe par lot"/></div>'
    +'<div><input type="number" step="any" min="0" placeholder="0" class="form-input sim-rgm" title="Réglage machine (RGM) : homme + machine, fixe par lot"/></div>'
    +'<div><input type="number" step="any" min="0" placeholder="0" class="form-input sim-thv" title="Temps homme variable (THV) : homme, par pièce"/></div>'
    +'<div><input type="number" step="any" min="0" placeholder="0" class="form-input sim-tmv" title="Temps machine variable (TMV) : machine, par pièce"/></div>'
    +'<div><input type="number" step="any" min="0" placeholder="à saisir" class="form-input sim-tauxm" title="Taux horaire machine du process"/></div>'
    +'<div><button type="button" class="sim-del w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 text-sm flex items-center justify-center" title="Retirer"><i class="fas fa-times"></i></button></div>';
  document.getElementById('sim_etapes_list').appendChild(d);
  simTypeChange(d);
}
function simProcChange(r){
  var id=r.querySelector('.sim-proc').value, typ=r.querySelector('.sim-type'), tm=r.querySelector('.sim-tauxm');
  var p=null;
  for(var i=0;i<SIM_PROCESS.length;i++){ if(String(SIM_PROCESS[i].id)===String(id)){ p=SIM_PROCESS[i]; break; } }
  if(p){
    typ.value=(p.type==='machine')?'machine':'manuel'; typ.disabled=true;
    tm.value=(p.type==='machine'&&p.taux!=null)?String(p.taux):'';
    var op=r.querySelector('.sim-op'); if(op&&!op.value) op.value=p.nom;
  } else { typ.disabled=false; }
  simTypeChange(r);
}
// Process manuel : pas de temps machine variable ni de taux machine (le RGM compte en homme seulement).
function simTypeChange(r){
  var mach=r.querySelector('.sim-type').value==='machine';
  ['.sim-tmv','.sim-tauxm'].forEach(function(s){ var el=r.querySelector(s); if(el){ el.disabled=!mach; if(!mach) el.value=''; } });
}
document.addEventListener('change',function(e){
  var t=e.target; if(!t||!t.closest) return;
  var r=t.closest('.sim-etape'); if(!r) return;
  if(t.classList.contains('sim-proc')) simProcChange(r);
  else if(t.classList.contains('sim-type')) simTypeChange(r);
});
document.addEventListener('click',function(e){
  var t=e.target; if(!t||!t.closest) return;
  var b=t.closest('.sim-del'); if(!b) return;
  var r=b.closest('.sim-etape'); if(r) r.remove();
});
function simLigne(lib,val){ return '<div class="flex justify-between gap-2"><span class="text-gray-500">'+simEsc(lib)+' :</span><span class="font-bold whitespace-nowrap">'+val+'</span></div>'; }

// Même classement que le moteur (shared.ts etapeDecomp) : ROP → homme ; RGM → homme + machine ;
// THV → homme ; TMV → machine. Réglages par lot, répartis sur la quantité.
function calculerSimul(){
  var q=Math.max(1,simNum(document.getElementById('sim_qte').value)||1);
  var th=simNum(document.getElementById('sim_tauxh').value);
  var hH=0, mH=0, macEur=0, nbSansTaux=0;
  var rows=document.querySelectorAll('.sim-etape');
  for(var i=0;i<rows.length;i++){
    var r=rows[i];
    var mach=r.querySelector('.sim-type').value==='machine';
    var rop=simVal(r,'.sim-rop'), rgm=simVal(r,'.sim-rgm'), thv=simVal(r,'.sim-thv'), tmv=mach?simVal(r,'.sim-tmv'):0;
    var hPc=(rop+rgm)/60/q+thv/60;
    var mPc=mach?(rgm/60/q+tmv/60):0;
    hH+=hPc; mH+=mPc;
    if(mPc>0){ var tm=simNum(r.querySelector('.sim-tauxm').value); if(tm==null||tm<0) nbSansTaux++; else macEur+=mPc*tm; }
  }
  var moEur=(th!=null&&th>=0)?hH*th:0;
  var mat=simNum(document.getElementById('sim_mat').value)||0;
  var fg=simNum(document.getElementById('sim_fg').value)||0;
  var coeff=simNum(document.getElementById('sim_coeff').value);
  var frais=(moEur+macEur)*fg/100;
  var cr=moEur+macEur+mat+frais;
  var alertes=[];
  if((th==null||th<0)&&hH>0) alertes.push('Taux homme vide : le temps homme est compté 0 €.');
  if(nbSansTaux) alertes.push(nbSansTaux+' opération(s) machine sans taux machine : leur temps machine est compté 0 €.');
  var prix=(coeff!=null&&coeff>0)
    ? '<div class="flex justify-between"><span class="text-gray-500">Coefficient ×'+simFmt(coeff,2)+' (taux de marque '+simFmt((1-1/coeff)*100,1)+' %)</span><span></span></div>'
      +'<div class="flex justify-between"><span class="text-green-700 font-bold">Prix de vente simulé :</span><span class="font-black text-green-700 text-base">'+simFmt(cr*coeff,2)+' €</span></div>'
    : '<div class="text-gray-400">Saisir un coefficient de vente pour obtenir un prix.</div>';
  document.getElementById('sim_result').classList.remove('hidden');
  document.getElementById('sim_result_content').innerHTML='<div class="space-y-1 text-xs">'
      +simLigne('Homme ('+simFmt(hH*60,2)+' min/pce)', simFmt(moEur,3)+' €')
      +simLigne('Machine ('+simFmt(mH*60,2)+' min/pce)', simFmt(macEur,3)+' €')
      +simLigne('Matière', simFmt(mat,3)+' €')
      +simLigne('Frais généraux (hypothèse '+simFmt(fg,1)+' %)', simFmt(frais,3)+' €')
    +'</div><div class="space-y-1 text-xs">'
      +'<div class="flex justify-between border-t pt-1"><span class="text-gray-700 font-bold">CR unitaire simulé :</span><span class="font-black text-amber-700 text-base">'+simFmt(cr,3)+' €</span></div>'
      +prix
    +'</div>'
    +(alertes.length?('<div class="col-span-2 text-xs text-amber-800 bg-amber-100 rounded-lg p-2">'+alertes.map(simEsc).join('<br>')+'</div>'):'');
}
</script>
</body></html>`
}

// ══════════════════════════════════════════════════════════════
// PAGE TAUX HORAIRES OPÉRATEURS
// ══════════════════════════════════════════════════════════════
export const pageFinancesTaux = (salaries: any[] = []) => {
  const FOPS = finOps(salaries)
  const nOps = FOPS.length || 1
  // Moyennes utilisées par le coût ESTIMÉ (même règle que le moteur : opérateurs actifs, taux > 0, par site).
  const H = construireTauxAtelier([], salaries).hommeParSite
  const moyTxt = (v: number | null) => v != null ? `${fmt2(v)} €/h` : 'non renseigné'
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

  <!-- MOYENNES UTILISÉES PAR LE COÛT ESTIMÉ -->
  <div class="card p-3 mb-4 text-xs text-gray-600 flex flex-wrap items-center gap-x-5 gap-y-1">
    <span class="font-bold text-gray-800"><i class="fas fa-calculator mr-1 text-amber-500"></i>Taux homme du coût de revient estimé</span>
    <span>Seem : <strong>${moyTxt(H.seem)}</strong></span>
    <span>Semrac : <strong>${moyTxt(H.semrac)}</strong></span>
    <span>Atelier : <strong>${moyTxt(H.moyen)}</strong></span>
    <span class="text-gray-400">Moyenne du taux chargé des opérateurs actifs (taux &gt; 0) du site, repli sur l’atelier. Le coût réel d’un BDT utilise le taux de son opérateur.</span>
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
            <td class="px-4 py-2.5 text-right font-bold text-gray-800">${(FOPS.reduce((s,o)=>s+o.taux_brut,0)/nOps).toFixed(2)} €/h</td>
            <td class="px-4 py-2.5 text-right text-gray-500">45%</td>
            <td class="px-4 py-2.5 text-right font-black text-amber-700">${(FOPS.reduce((s,o)=>s+o.taux_chargé,0)/nOps).toFixed(2)} €/h</td>
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
// PAGE TAUX MACHINE DES PROCESS
// Seul le PROCESS machine porte un taux horaire (saisi à la main en Production).
// Pour chaque machine : ses process machine et leur taux. L'OPEX reste en euros.
// ══════════════════════════════════════════════════════════════
export const pageFinancesMachines = (machines: any[] = [], opex: any[] = [], _postes: any[] = [], donnees: DonneesTauxFinances = {}) => {
  const process = Array.isArray(donnees?.process) ? donnees.process : null
  const erreur = donnees?.erreur || null
  const lisible = !erreur && process != null
  const tx = construireTauxAtelier(process || [], [], machines)
  const FMACS = finMacs(machines, opex, process || [], tx)
  const procMach = processMachine(process || []).map((p: any) => finProcTaux(p, tx))
  const idsMachines = new Set((machines || []).map((m: any) => String(m.id)))
  const orphelins = procMach.filter(p => !p.machine_id || !idsMachines.has(p.machine_id))
  const nbSaisis = procMach.filter(p => p.taux != null).length
  const nbTransition = procMach.filter(p => p.source === 'transition_machine').length
  const transition = process ? enTransition(process) : false
  const celluleProcess = (procs: ProcTaux[]) => {
    if (!lisible) return '<span class="text-gray-400">—</span>'
    if (!procs.length) return '<span class="text-gray-400">Aucun process machine rattaché</span>'
    return procs.map(pt => `<div class="flex items-center justify-between gap-3 py-0.5">
      <span class="text-gray-700 font-semibold">${escX(pt.nom)}${pt.code ? ` <span class="text-gray-400 font-normal">${escX(pt.code)}</span>` : ''}${pt.inactif ? ' <span class="badge" style="background:#f1f5f9;color:#64748b">inactif</span>' : ''}</span>
      <span>${badgeTaux(pt)}</span>
    </div>`).join('')
  }
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Taux Machine des Process · ERP Seem Semrac</title>
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
        <h1 class="text-xl font-bold text-gray-900">Taux Machine des Process</h1>
        <p class="text-gray-400 text-xs">Seul le process machine porte un taux horaire · saisi à la main · intégré au coût de revient</p>
      </div>
    </div>
    <a href="/production/service?tab=machines" class="btn-primary" style="background:linear-gradient(135deg,#6366f1,#4f46e5);box-shadow:0 2px 8px rgba(99,102,241,.3)"><i class="fas fa-pen"></i> Saisir les taux (Production)</a>
  </div>

  <div class="card p-3 mb-4 bg-indigo-50 border-l-4 border-indigo-400 text-xs text-indigo-800 space-y-1">
    <div><i class="fas fa-info-circle mr-1"></i><strong>Taux machine = taux horaire saisi sur le process machine</strong> (Production › Process Ateliers). Il valorise le réglage machine (RGM) et le temps machine variable (TMV) des étapes de ce process. Un process manuel n’a pas de taux machine.</div>
    <div>Le temps homme est valorisé au <a href="/finances/taux" class="underline">coût chargé RH</a>. Les machines et les postes ne portent plus de taux ; l’OPEX, la maintenance et les achats restent suivis <strong>en euros</strong>, jamais convertis en €/h.</div>
  </div>

  ${erreur ? `<div class="card p-3 mb-4 border-l-4 border-red-500 bg-red-50 text-xs text-red-800"><i class="fas fa-triangle-exclamation mr-1"></i><strong>Lecture des process impossible</strong> : ${escX(erreur)}. Les taux ne sont pas affichés.</div>` : ''}
  ${!erreur && process == null ? `<div class="card p-3 mb-4 border-l-4 border-amber-500 bg-amber-50 text-xs text-amber-800"><i class="fas fa-circle-exclamation mr-1"></i>Les process ne sont pas transmis à cette page : les taux ne peuvent pas être affichés.</div>` : ''}
  ${lisible && transition ? `<div class="card p-3 mb-4 border-l-4 border-sky-500 bg-sky-50 text-xs text-sky-800"><i class="fas fa-database mr-1"></i>${MSG_CLOUD7}</div>` : ''}

  ${lisible ? `<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
    <div class="kpi-card" style="border-color:#6366f1"><div class="text-xs font-semibold text-gray-500 mb-1">Process machine</div><div class="text-xl font-black text-gray-900">${procMach.length}</div></div>
    <div class="kpi-card" style="border-color:#22c55e"><div class="text-xs font-semibold text-gray-500 mb-1">Taux renseignés</div><div class="text-xl font-black text-gray-900">${nbSaisis}</div>${nbTransition ? `<div class="text-xs text-sky-700 mt-0.5">dont ${nbTransition} en transition</div>` : ''}</div>
    <div class="kpi-card" style="border-color:#f59e0b"><div class="text-xs font-semibold text-gray-500 mb-1">Taux à saisir</div><div class="text-xl font-black ${procMach.length - nbSaisis > 0 ? 'text-amber-700' : 'text-gray-900'}">${procMach.length - nbSaisis}</div></div>
    <div class="kpi-card" style="border-color:#94a3b8"><div class="text-xs font-semibold text-gray-500 mb-1">Machines</div><div class="text-xl font-black text-gray-900">${FMACS.length}</div></div>
  </div>` : ''}

  ${ordreSites(FMACS.map(m => m.activite)).map(act => {
    const macs = FMACS.filter(m => m.activite === act)
    if (!macs.length) return ''
    const [bg, fg] = couleurSite(act)
    const procsSite = macs.reduce((s, m) => s + m.process.length, 0)
    const aSaisirSite = macs.reduce((s, m) => s + m.process.filter(p => p.taux == null).length, 0)
    return `<div class="card p-4 mb-4">
      <div class="flex items-center gap-3 mb-3">
        <span class="px-3 py-1 rounded-full text-sm font-bold" style="background:${bg};color:${fg}">${escX(act)}</span>
        <h2 class="font-bold text-gray-800">Machines – ${escX(act)}</h2>
        <span class="text-xs text-gray-400 ml-auto">${macs.length} machine(s)${lisible ? ` · ${procsSite} process machine${aSaisirSite ? ` · <span class="text-amber-700 font-semibold">${aSaisirSite} taux à saisir</span>` : ''}` : ''}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead><tr class="bg-gray-50 border-b border-gray-100">
            <th class="text-left px-3 py-2 text-gray-500 font-semibold">Machine</th>
            <th class="text-left px-3 py-2 text-gray-500 font-semibold">Code</th>
            <th class="text-left px-3 py-2 text-gray-500 font-semibold">Famille</th>
            <th class="text-right px-3 py-2 text-gray-500 font-semibold">Capacité (h)</th>
            <th class="text-left px-3 py-2 text-gray-500 font-semibold font-bold text-indigo-700" style="min-width:280px">Process machine · taux horaire</th>
            <th class="text-right px-3 py-2 text-gray-500 font-semibold" title="machines_opex, dernière année renseignée — suivi en euros">OPEX annuel (€)</th>
          </tr></thead>
          <tbody>
            ${macs.map(m => `<tr class="border-b border-gray-50 cost-row align-top">
              <td class="px-3 py-2 font-bold text-gray-800">${escX(m.nom)}</td>
              <td class="px-3 py-2 text-gray-500">${escX(m.code) || '—'}</td>
              <td class="px-3 py-2 text-gray-500">${escX(m.famille)}</td>
              <td class="px-3 py-2 text-right text-gray-600">${m.capacite_h ? m.capacite_h.toLocaleString('fr-FR') : '—'}</td>
              <td class="px-3 py-2">${celluleProcess(m.process)}</td>
              <td class="px-3 py-2 text-right text-gray-600">${m.opex_annuel != null ? fmtEur0(m.opex_annuel) + (m.opex_annee ? `<div class="text-gray-400">${m.opex_annee}</div>` : '') : '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`
  }).join('')}

  ${lisible && orphelins.length ? `<div class="card p-4 mb-4">
    <div class="flex items-center gap-3 mb-2">
      <h2 class="font-bold text-gray-800">Process machine sans machine rattachée</h2>
      <span class="text-xs text-gray-400 ml-auto">${orphelins.length} process · ils restent des process machine et gardent leur taux</span>
    </div>
    <div class="grid md:grid-cols-2 gap-x-6">${orphelins.map(pt => `<div class="flex items-center justify-between gap-3 py-1 border-b border-gray-50 text-xs">
      <span class="text-gray-700 font-semibold">${escX(pt.nom)}${pt.activite ? ` <span class="text-gray-400 font-normal">${escX(pt.activite)}</span>` : ''}${pt.inactif ? ' <span class="badge" style="background:#f1f5f9;color:#64748b">inactif</span>' : ''}</span>
      <span>${badgeTaux(pt)}</span>
    </div>`).join('')}</div>
  </div>` : ''}
</main>
</body></html>`
}

// ══════════════════════════════════════════════════════════════
// PAGE IMPUTATIONS DES TEMPS
// §4.18 – Coût réel de chaque BDT : règle UNIQUE du dépôt (shared.ts coutReelBdt)
// ══════════════════════════════════════════════════════════════
export const pageFinancesImputations = (bdts: any[] = [], salaries: any[] = [], machines: any[] = [], _opex: any[] = [], _postes: any[] = [], donnees: DonneesTauxFinances = {}) => {
  const process = Array.isArray(donnees?.process) ? donnees.process : null
  const erreur = donnees?.erreur || null
  const hommeLisible = !erreur
  const machineLisible = !erreur && process != null
  const tx = construireTauxAtelier(process || [], salaries, machines)
  const salById: Record<string, any> = {}
  for (const s of (salaries || [])) if (s && s.id != null) salById[String(s.id)] = s
  const macById: Record<string, any> = {}
  for (const m of (machines || [])) if (m && m.id != null) macById[String(m.id)] = m
  const FIMPS = finImps(bdts, tx, salById)
  const nomSal = (id: any) => { const s = salById[String(id)]; return s ? (((s.prenom ? s.prenom + ' ' : '') + (s.nom || '')).trim() || String(id)) : (id ? String(id) : '—') }
  // Données manquantes (montant compté 0 €) — la part machine n'est comptée que si les process sont lisibles.
  const manq: Record<string, number> = { taux_homme: 0, taux_machine: 0, sans_process: 0 }
  let nbIncomplets = 0
  for (const imp of FIMPS) {
    const ms = imp.cout.manquants.filter((m: ManquantCout) => (m === 'taux_homme' ? hommeLisible : machineLisible))
    if (ms.length) nbIncomplets++
    for (const m of ms) manq[m]++
  }
  const tHeures = FIMPS.reduce((s, i) => s + i.cout.heures, 0)
  const tHomme = FIMPS.reduce((s, i) => s + i.cout.coutHomme, 0)
  const tMachine = FIMPS.reduce((s, i) => s + i.cout.coutMachine, 0)
  const eur = (n: number) => `${n.toFixed(2)} €`
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
        <p class="text-gray-400 text-xs">§4.18 · Coût réel = temps pointé × (coût chargé RH de l’opérateur + taux machine du process si process machine)</p>
      </div>
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
        {icon:'fa-user-clock',label:'Taux homme',sub:'Coût chargé opérateur',color:'#0ea5e9'},
        {icon:'fa-euro-sign',label:'Coût réel',sub:'Homme + machine du process',color:'#d97706'},
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

  ${erreur ? `<div class="card p-3 mb-4 border-l-4 border-red-500 bg-red-50 text-xs text-red-800"><i class="fas fa-triangle-exclamation mr-1"></i><strong>Lecture des taux impossible</strong> : ${escX(erreur)}. Les coûts ne sont pas affichés.</div>` : ''}
  ${!erreur && process == null ? `<div class="card p-3 mb-4 border-l-4 border-amber-500 bg-amber-50 text-xs text-amber-800"><i class="fas fa-circle-exclamation mr-1"></i>Les process ne sont pas transmis à cette page : le coût machine ne peut pas être calculé (affiché « — »).</div>` : ''}
  ${nbIncomplets ? `<div class="card p-3 mb-4 border-l-4 border-amber-500 bg-amber-50 text-xs text-amber-800"><i class="fas fa-circle-exclamation mr-1"></i><strong>${nbIncomplets} BDT au coût incomplet</strong> : ${(Object.keys(manq) as ManquantCout[]).filter(k => manq[k] > 0).map(k => `${manq[k]} × ${LIB_MANQUANT[k]}`).join(' · ')}. La part concernée est comptée 0 € et signalée en orange.</div>` : ''}

  <!-- IMPUTATIONS -->
  <div class="card p-4 mb-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-bold text-gray-800 text-sm flex items-center gap-2">
        <i class="fas fa-list-check text-blue-500"></i> BDT reçus, en cours et soldés
      </h3>
      <span class="text-xs text-gray-400">${FIMPS.length} BDT</span>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead><tr class="bg-gray-50 border-b border-gray-100">
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">BDT</th>
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Opérateur</th>
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Process</th>
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Machine</th>
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Opération</th>
          <th class="text-left px-3 py-2.5 text-gray-500 font-semibold">Commande</th>
          <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">Alloué (h)</th>
          <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">Réel (h)</th>
          <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">Coût homme (€)</th>
          <th class="text-right px-3 py-2.5 text-gray-500 font-semibold">Coût machine (€)</th>
          <th class="text-right px-3 py-2.5 text-gray-500 font-semibold font-bold">Total (€)</th>
          <th class="text-center px-3 py-2.5 text-gray-500 font-semibold">Statut</th>
        </tr></thead>
        <tbody>
          ${FIMPS.length ? FIMPS.map(imp => {
            const c = imp.cout
            const proc = tx.processDe(imp.process_id) || (imp.machine ? tx.processMachineDeMachine(imp.machine) : null)
            const mac = macById[String(imp.machine)]
            const ecart = imp.duree_reelle != null ? imp.duree_reelle - imp.duree_allouee : null
            const hommeManq = c.manquants.includes('taux_homme')
            const machManq = c.manquants.includes('taux_machine') || c.manquants.includes('sans_process')
            const cellHomme = !hommeLisible ? '<span class="text-gray-300">—</span>'
              : `<span class="${hommeManq ? 'text-amber-700 font-bold' : 'text-blue-600'}">${eur(c.coutHomme)}</span><div class="text-gray-400 whitespace-nowrap">${hommeManq ? LIB_SOURCE_HOMME.manquant : `× ${fmt2(c.tauxHomme)} €/h · ${LIB_SOURCE_HOMME[c.sourceTauxHomme] || ''}`}</div>`
            const cellMachine = !machineLisible ? '<span class="text-gray-300">—</span>'
              : c.typeProcess !== 'machine' ? '<span class="text-gray-300">—</span>'
              : `<span class="${machManq ? 'text-amber-700 font-bold' : 'text-indigo-600'}">${eur(c.coutMachine)}</span><div class="${machManq ? 'text-amber-700' : 'text-gray-400'} whitespace-nowrap">${machManq ? (LIB_SOURCE_MACHINE[c.sourceTauxMachine] || '') : `× ${fmt2(c.tauxMachine)} €/h · ${LIB_SOURCE_MACHINE[c.sourceTauxMachine] || ''}`}</div>`
            const total = (hommeLisible ? c.coutHomme : 0) + (machineLisible ? c.coutMachine : 0)
            return `<tr class="border-b border-gray-50 cost-row align-top">
              <td class="px-3 py-2 font-bold text-gray-600 whitespace-nowrap">${escX(imp.id)}</td>
              <td class="px-3 py-2 text-gray-700">${escX(nomSal(imp.op))}</td>
              <td class="px-3 py-2 text-gray-600">${proc ? `${escX(proc.nom || proc.id)}<div class="text-gray-400">${c.typeProcess}</div>` : (c.typeProcess === 'machine' ? '<span class="text-amber-700">sans process</span>' : '<span class="text-gray-300">—</span>')}</td>
              <td class="px-3 py-2 text-gray-500">${mac ? escX(mac.nom) : '—'}</td>
              <td class="px-3 py-2 text-gray-600">${escX(imp.operation)}</td>
              <td class="px-3 py-2">
                <div class="text-gray-700 font-semibold">${escX(imp.cmd)}</div>
                <div class="text-gray-400 text-xs">${escX(imp.client)}</div>
              </td>
              <td class="px-3 py-2 text-right text-gray-500">${imp.duree_allouee.toFixed(2)}</td>
              <td class="px-3 py-2 text-right font-bold ${imp.duree_reelle != null ? (imp.duree_reelle > imp.duree_allouee ? 'text-red-600' : 'text-green-600') : 'text-gray-300'}">${imp.duree_reelle != null ? imp.duree_reelle.toFixed(2) : '—'}</td>
              <td class="px-3 py-2 text-right whitespace-nowrap">${cellHomme}</td>
              <td class="px-3 py-2 text-right whitespace-nowrap">${cellMachine}</td>
              <td class="px-3 py-2 text-right font-black text-gray-800 whitespace-nowrap">${hommeLisible ? eur(total) : '—'}</td>
              <td class="px-3 py-2 text-center">
                <span class="badge ${imp.statut === 'solde' ? 'badge-ok' : 'badge-warn'}">${imp.statut === 'solde' ? 'Soldé' : 'En cours'}</span>
                ${ecart !== null ? `<div class="text-xs ${ecart > 0 ? 'text-red-500' : 'text-green-500'} mt-0.5">${ecart > 0 ? '+' : ''}${ecart.toFixed(2)}h</div>` : ''}
              </td>
            </tr>`
          }).join('') : `<tr><td colspan="12" class="px-3 py-6 text-center text-gray-400">Aucun BDT reçu, en cours ou soldé.</td></tr>`}
        </tbody>
        <tfoot>
          <tr class="bg-amber-50 border-t-2 border-amber-200 font-bold">
            <td colspan="6" class="px-3 py-2 text-gray-700 font-bold text-xs">Total <span class="font-normal text-gray-500">(temps valorisé = réel, sinon alloué : ${tHeures.toFixed(2)} h)</span></td>
            <td class="px-3 py-2 text-right text-gray-600">${FIMPS.reduce((s, i) => s + i.duree_allouee, 0).toFixed(2)}h</td>
            <td class="px-3 py-2 text-right text-gray-700">${FIMPS.reduce((s, i) => s + (i.duree_reelle || 0), 0).toFixed(2)}h</td>
            <td class="px-3 py-2 text-right text-blue-700">${hommeLisible ? eur(tHomme) : '—'}</td>
            <td class="px-3 py-2 text-right text-indigo-700">${machineLisible ? eur(tMachine) : '—'}</td>
            <td class="px-3 py-2 text-right font-black text-amber-700 text-sm whitespace-nowrap">${hommeLisible ? eur(tHomme + (machineLisible ? tMachine : 0)) : '—'}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</main>
</body></html>`
}
