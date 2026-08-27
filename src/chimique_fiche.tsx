// ══════════════════════════════════════════════════════════════
// FICHE PRODUIT CHIMIQUE 360 — ERP Seem Semrac
// Vue unique par produit : danger/étiquetage + cotation SEIRICH (3 axes,
// produit + situations d'exposition) + FDS + péremption (lots) + stock + actions.
// Jointures souples (aucune migration) — cf. getHseChimiqueDetail (queries.ts).
// ══════════════════════════════════════════════════════════════
import { layout } from './shared'
import { brandBlockHTML, BRAND } from './brand'
import { clpRow, clpDefs } from './clp'
import { computeRisqueChimique, computeExpositionSante, computeExpositionIncendie, computeExpositionEnv, SEIRICH_NIVEAUX, EXPO_PROCEDE_LBL, EXPO_PROT_LBL } from './qref'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')
const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const d10 = (s: any) => (s ? String(s).slice(0, 10) : '—')
const ORANGE = '#ea580c'
const pill = (t: string, bg: string, fg: string) => `<span style="display:inline-block;padding:2px 9px;border-radius:999px;font-size:.66rem;font-weight:700;background:${bg};color:${fg};white-space:nowrap;">${esc(t)}</span>`
const nivChip = (n: number) => { const m = SEIRICH_NIVEAUX[n] || SEIRICH_NIVEAUX[0]; return `<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:800;background:${m[0]};color:${m[1]};">${m[2]}</span>` }

export function pageChimiqueFiche(produit: any, detail: any): string {
  const p = produit || {}
  const D = detail || {}
  const nom = p.nom || 'Produit introuvable'
  const found = !!p && !!p.nom
  const dgr = computeRisqueChimique(p)
  const qmaxByUT: Record<string, number> = D.qmaxByUT || {}
  const expos = (D.expositions || []).map((e: any) => {
    const q = qmaxByUT[String(e.unite_travail || '—')]
    const r = computeExpositionSante(p, e, q), ri = computeExpositionIncendie(p, e, q), re = computeExpositionEnv(p, e, q)
    return { e, r, ri, re, nmax: Math.max(r.niveauSante, ri.niveauIncendie, re.niveauEnv) }
  }).sort((a: any, b: any) => b.nmax - a.nmax)
  const perissables = D.perissables || []
  const stock = D.stock || []
  const actions = D.actions || []
  const today = new Date().toISOString().slice(0, 10)
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

  // ─── KPIs ───
  const niveauProduit = Math.max(dgr.niveauMax, ...expos.map((x: any) => x.nmax), 0)
  const fdsOk = !!(p.fds_ref || p.fds_url)
  const peremProche = perissables.map((x: any) => x.date_expiration).filter(Boolean).sort()[0] || null
  const peremBadge = peremProche ? (String(peremProche).slice(0, 10) < today ? pill('périmé ' + d10(peremProche), '#fee2e2', '#b91c1c') : String(peremProche).slice(0, 10) <= soon ? pill(d10(peremProche), '#fef9c3', '#a16207') : d10(peremProche)) : '—'
  const stockQte = stock.reduce((t: number, s: any) => t + (Number(s.stock_actuel) || 0), 0)

  const card = (title: string, icon: string, inner: string, extra = '') => `
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:18px 20px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:12px;"><i class="fas ${icon}" style="color:${ORANGE};"></i><span style="font-weight:800;font-size:.95rem;color:#1e293b;">${title}</span>${extra ? `<span style="margin-left:auto;">${extra}</span>` : ''}</div>
      ${inner}
    </div>`
  const kpi = (val: string, label: string, color: string) => `<div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:14px 16px;flex:1;min-width:150px;"><div style="font-size:.64rem;text-transform:uppercase;font-weight:800;color:#94a3b8;letter-spacing:.04em;margin-bottom:6px;">${label}</div><div style="font-size:1.15rem;font-weight:800;color:${color};line-height:1.1;">${val}</div></div>`
  const kv = (l: string, v: string) => `<div style="display:flex;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:.82rem;"><span style="width:190px;color:#64748b;font-weight:600;flex-shrink:0;">${l}</span><span style="color:#374151;">${v}</span></div>`

  // ─── Danger & étiquetage ───
  const pictos = Array.isArray(p.pictogrammes) ? p.pictogrammes : []
  const hCodes = dgr.hCodes
  const dangerCard = card('Danger & étiquetage (CLP)', 'fa-triangle-exclamation',
    `<div style="display:flex;gap:24px;flex-wrap:wrap;">
      <div style="flex:1;min-width:280px;">
        ${kv('Pictogrammes', pictos.length ? clpRow(pictos, 34) : '<span style="color:#94a3b8;">—</span>')}
        ${kv('Mentions de danger (H)', hCodes.length ? hCodes.map((h: string) => `<span style="display:inline-block;background:#eef2ff;color:#4338ca;border-radius:5px;padding:1px 6px;font-size:.7rem;font-weight:700;margin:1px;">${esc(h)}</span>`).join('') : '<span style="color:#94a3b8;">non renseignées</span>')}
        ${kv('CMR', p.cmr ? pill(String(p.cmr), '#fee2e2', '#b91c1c') : '—')}
        ${kv('VLEP', esc(p.vlep || '—'))}
        ${kv('État physique', esc(p.etat || '—'))}
        ${kv('N° CAS', esc(p.cas || '—'))}
      </div>
      <div style="flex:1;min-width:280px;">
        <div style="font-size:.7rem;text-transform:uppercase;font-weight:800;color:#94a3b8;margin-bottom:8px;">Cotation SEIRICH (niveau produit) <span style="font-weight:700;color:#92400e;background:#fef3c7;border-radius:5px;padding:1px 6px;">INDICATIVE</span></div>
        <table style="width:100%;border-collapse:collapse;font-size:.82rem;">
          <tr><td style="padding:6px 0;color:#64748b;">Santé</td><td style="text-align:right;">${nivChip(dgr.niveauSante)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Incendie-Explosion</td><td style="text-align:right;">${nivChip(dgr.niveauIncendie)}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b;">Environnement</td><td style="text-align:right;">${nivChip(dgr.niveauEnv)}</td></tr>
        </table>
        ${dgr.dataQuality === 'incomplet' ? `<div style="margin-top:8px;font-size:.72rem;color:#c2410c;">⚠ Données de danger incomplètes (codes H / pictogrammes à compléter).</div>` : ''}
      </div>
    </div>`)

  // ─── Situations d'exposition ───
  const th = (t: string, c = 'left') => `<th style="text-align:${c};padding:7px 9px;font-size:.62rem;font-weight:800;color:#64748b;text-transform:uppercase;border-bottom:2px solid #f1f5f9;">${t}</th>`
  const td = (v: string, c = 'left') => `<td style="padding:6px 9px;font-size:.78rem;color:#374151;border-bottom:1px solid #f8fafc;text-align:${c};">${v}</td>`
  const expoCard = card('Exposition par situation de travail (SEIRICH)', 'fa-person-rays',
    expos.length ? `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#fafafa;">${th('Unité de travail / tâche')}${th('Procédé')}${th('Protection')}${th('Santé', 'center')}${th('Incendie', 'center')}${th('Environ.', 'center')}${th('Retenu', 'center')}</tr></thead>
      <tbody>${expos.map((x: any) => `<tr>
        ${td(`<span style="font-weight:600;">${esc(x.e.unite_travail || '—')}</span>${x.e.tache ? ` <span style="color:#94a3b8;font-size:.7rem;">${esc(x.e.tache)}</span>` : ''}`)}
        ${td(esc(EXPO_PROCEDE_LBL[x.e.procede] || x.e.procede || '—'))}
        ${td(esc(EXPO_PROT_LBL[x.e.protection_collective] || x.e.protection_collective || '—') + (x.e.epi ? ' +EPI' : '') + (x.ri.atexProbable ? ' <span style="color:#c2410c;font-weight:800;font-size:.6rem;">⚡ATEX</span>' : ''))}
        ${td(nivChip(x.r.niveauSante), 'center')}${td(nivChip(x.ri.niveauIncendie), 'center')}${td(nivChip(x.re.niveauEnv), 'center')}${td('<strong>' + nivChip(x.nmax) + '</strong>', 'center')}
      </tr>`).join('')}</tbody></table></div>`
      : `<div style="color:#94a3b8;font-size:.82rem;">Aucune situation d'exposition saisie. Ajoutez-en depuis <a href="/securite/service#chimie" style="color:${ORANGE};">Sécurité › Chimie › Exposition</a>.</div>`)

  // ─── FDS ─── (href durci : http(s) uniquement + échappement des guillemets d'attribut)
  const fdsUrlSafe = /^https?:\/\//i.test(String(p.fds_url || '')) ? esc(p.fds_url).replace(/"/g, '&quot;') : ''
  const fdsCard = card('Fiche de données de sécurité (FDS)', 'fa-file-shield',
    `${kv('Référence FDS', esc(p.fds_ref || '—'))}${kv('Date FDS', d10(p.fds_date))}${kv('Statut', fdsOk ? pill('disponible', '#dcfce7', '#15803d') : pill('manquante', '#fee2e2', '#b91c1c'))}`,
    fdsUrlSafe ? `<a href="${fdsUrlSafe}" target="_blank" rel="noopener" style="background:#eff6ff;color:#1d4ed8;border:1.5px solid #bfdbfe;border-radius:8px;padding:6px 12px;font-size:.76rem;font-weight:700;text-decoration:none;"><i class="fas fa-up-right-from-square" style="margin-right:5px;"></i>Voir la FDS</a>` : '')

  // ─── Péremption ───
  const perisCard = card('Péremption (lots — module Périssables)', 'fa-hourglass-half',
    perissables.length ? `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#fafafa;">${th('Lot / réf.')}${th('N° lot fourn.')}${th('Réception')}${th('Expiration')}${th('Quantité', 'right')}${th('Statut')}${th('Lien')}</tr></thead>
      <tbody>${perissables.map((pe: any) => `<tr>
        ${td(esc(pe.nom || pe.reference || '—'))}${td(esc(pe.n_lot_fournisseur || '—'))}${td(d10(pe.date_reception))}
        ${td(pe.date_expiration ? (String(pe.date_expiration).slice(0, 10) < today ? pill(d10(pe.date_expiration), '#fee2e2', '#b91c1c') : String(pe.date_expiration).slice(0, 10) <= soon ? pill(d10(pe.date_expiration), '#fef9c3', '#a16207') : d10(pe.date_expiration)) : '—')}
        ${td((pe.quantite != null ? esc(pe.quantite) + ' ' + esc(pe.unite || '') : '—'), 'right')}${td(esc(String(pe.statut || '').replace(/_/g, ' ') || '—'))}
        ${td(pe._match === 'code' ? pill('code', '#dcfce7', '#15803d') : pill('nom', '#fef9c3', '#a16207'))}
      </tr>`).join('')}</tbody></table></div><div style="margin-top:8px;font-size:.7rem;color:#94a3b8;">Rapprochement automatique par code produit (fiable) ou par nom (probable). Gestion des lots dans <a href="/qualite/service" style="color:${ORANGE};">Qualité › Produits Périssables</a>.</div>`
      : `<div style="color:#94a3b8;font-size:.82rem;">Aucun lot périssable rapproché (par code produit ou nom). Si ce produit a une péremption, vérifiez sa réf. ou son nom dans <a href="/qualite/service" style="color:${ORANGE};">Qualité › Produits Périssables</a>.</div>`)

  // ─── Stock ───
  const stockCard = card('Stock', 'fa-warehouse',
    stock.length ? `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#fafafa;">${th('Référence')}${th('Désignation')}${th('En stock', 'right')}${th('Mini', 'right')}${th('Emplacement')}</tr></thead>
      <tbody>${stock.map((s: any) => `<tr>
        ${td(esc(s.reference || '—'))}${td(esc(s.designation || '—'))}${td((Number(s.stock_actuel) || 0) + ' ' + esc(s.unite || ''), 'right')}${td(s.stock_mini != null ? esc(s.stock_mini) : '—', 'right')}${td(esc(s.emplacement || '—'))}
      </tr>`).join('')}</tbody></table></div>`
      : `<div style="color:#94a3b8;font-size:.82rem;">Aucun article de stock rapproché via la réf. « ${esc(p.ref_stock || '—')} ». La quantité affichée en fiche produit chimique (${p.quantite != null ? esc(p.quantite) + ' ' + esc(p.unite || '') : '—'}) provient de la saisie Chimie, pas du stock live.</div>`)

  // ─── Actions ───
  const actCard = card('Actions correctives liées', 'fa-screwdriver-wrench',
    actions.length ? `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#fafafa;">${th('Type')}${th('Origine')}${th('Action / constat')}${th('Pilote')}${th('Échéance')}${th('Statut')}</tr></thead>
      <tbody>${actions.map((a: any) => `<tr>${td(esc(a.type || '—'))}${td(esc(a.origine || '—'))}${td(esc(a.description || a.action || '—'))}${td(esc(a.responsable || '—'))}${td(d10(a.date_echeance))}${td(esc(String(a.statut || '').replace(/_/g, ' ') || '—'))}</tr>`).join('')}</tbody></table></div>`
      : `<div style="color:#94a3b8;font-size:.82rem;">Aucune action corrective liée à ce produit. Créez-en une via le bouton « → Action » sur une situation d'exposition.</div>`)

  // Données pour le PDF de marque
  const FICHE = {
    nom, ref: p.ref_stock || '', cas: p.cas || '', cmr: p.cmr || '', vlep: p.vlep || '', etat: p.etat || '',
    fds: fdsOk ? (p.fds_ref || 'oui') : 'manquante', fdsDate: d10(p.fds_date),
    h: hCodes, pic: pictos, nS: dgr.niveauSante, nI: dgr.niveauIncendie, nE: dgr.niveauEnv, nMax: niveauProduit,
    expos: expos.map((x: any) => ({ ut: x.e.unite_travail || '', tache: x.e.tache || '', proc: EXPO_PROCEDE_LBL[x.e.procede] || x.e.procede || '', nS: x.r.niveauSante, nI: x.ri.niveauIncendie, nE: x.re.niveauEnv, max: x.nmax, atex: x.ri.atexProbable })),
    peris: perissables.map((pe: any) => ({ nom: pe.nom || '', exp: d10(pe.date_expiration), qte: pe.quantite, statut: pe.statut || '', match: pe._match || 'nom' })),
    stock: stock.map((s: any) => ({ ref: s.reference || '', des: s.designation || '', qte: Number(s.stock_actuel) || 0, unite: s.unite || '', emp: s.emplacement || '' })),
    stockTotal: stockQte,
  }

  const content = `
  <div style="background:linear-gradient(135deg,${ORANGE},#431407);padding:16px 26px;color:white;">
    <a href="/securite/service#chimie" style="color:#fed7aa;text-decoration:none;font-size:.8rem;font-weight:600;display:inline-flex;align-items:center;gap:6px;margin-bottom:8px;"><i class="fas fa-arrow-left"></i>Retour Chimie / FDS</a>
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
      <div style="min-width:0;">
        <h1 style="margin:0;font-size:1.5rem;font-weight:800;"><i class="fas fa-flask-vial" style="margin-right:9px;"></i>${esc(nom)}</h1>
        <div style="font-size:.8rem;color:#fed7aa;margin-top:3px;">Fiche produit chimique 360${p.num_identification ? ' · N° ' + esc(p.num_identification) : ''} · réf. ${esc(p.ref_stock || '—')}${p.cas ? ' · CAS ' + esc(p.cas) : ''}</div>
      </div>
      <div style="margin-left:auto;display:flex;gap:9px;align-items:center;">
        <span style="background:rgba(255,255,255,.15);border-radius:999px;padding:5px 14px;font-size:.76rem;font-weight:700;">Niveau retenu : ${SEIRICH_NIVEAUX[niveauProduit] ? SEIRICH_NIVEAUX[niveauProduit][2] : '—'}</span>
        <button onclick="ficheChimiquePdf()" style="background:white;color:${BRAND.violet};border:none;border-radius:8px;padding:8px 15px;font-weight:700;cursor:pointer;font-size:.8rem;"><i class="fas fa-file-pdf" style="margin-right:6px;"></i>Fiche PDF</button>
      </div>
    </div>
  </div>
  ${found ? `<div style="padding:22px 30px;font-family:Inter,system-ui,sans-serif;background:#f8fafc;min-height:100vh;">
    ${clpDefs()}
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px;">
      ${kpi(SEIRICH_NIVEAUX[niveauProduit] ? SEIRICH_NIVEAUX[niveauProduit][2] : '—', 'Niveau SEIRICH retenu', niveauProduit >= 3 ? '#dc2626' : niveauProduit === 2 ? '#d97706' : '#16a34a')}
      ${kpi(fdsOk ? 'Disponible' : 'Manquante', 'FDS', fdsOk ? '#16a34a' : '#dc2626')}
      ${kpi(peremProche ? d10(peremProche) : '—', 'Péremption la plus proche', peremProche && String(peremProche).slice(0, 10) <= soon ? '#dc2626' : '#334155')}
      ${kpi(stock.length ? String(stockQte) + ' ' + esc(stock[0].unite || '') : (p.quantite != null ? esc(p.quantite) + ' ' + esc(p.unite || '') : '—'), stock.length ? 'Stock (live)' : 'Quantité (saisie)', '#334155')}
      ${kpi(String(expos.length), 'Situations d\'exposition', '#334155')}
    </div>
    ${dangerCard}${expoCard}${fdsCard}${perisCard}${stockCard}${actCard}
  </div>` : `<div style="padding:60px 30px;text-align:center;color:#94a3b8;">Produit chimique introuvable. <a href="/securite/service#chimie" style="color:${ORANGE};">Retour à la liste</a></div>`}

  <script>
  var FICHE=${sjX(FICHE)};
  var BRAND_BLOCK=${sjX(brandBlockHTML())}; var BRAND_VIOLET=${sjX(BRAND.violet)};
  var SEIR_NIV=${sjX(SEIRICH_NIVEAUX)};
  function ficheChimiquePdf(){
    function e(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    var today=new Date().toLocaleDateString('fr-FR'), f=FICHE;
    function nc(n){ var m=SEIR_NIV[n]||SEIR_NIV[0]; return '<span style="background:'+m[0]+';color:'+m[1]+';border-radius:5px;padding:1px 8px;font-weight:bold;">'+e(m[2])+'<\\/span>'; }
    function kv(l,v){ return '<tr><td class="l">'+l+'<\\/td><td>'+(v||'—')+'<\\/td><\\/tr>'; }
    var expoRows=f.expos.map(function(x){ return '<tr><td>'+e(x.ut)+(x.tache?(' / '+e(x.tache)):'')+'<\\/td><td>'+e(x.proc)+'<\\/td><td class="c">'+nc(x.nS)+'<\\/td><td class="c">'+nc(x.nI)+(x.atex?' ⚡':'')+'<\\/td><td class="c">'+nc(x.nE)+'<\\/td><td class="c">'+nc(x.max)+'<\\/td><\\/tr>'; }).join('')||'<tr><td colspan="6" style="text-align:center;color:#94a3b8;">Aucune situation<\\/td><\\/tr>';
    var perisRows=f.peris.map(function(x){ return '<tr><td>'+e(x.nom)+(x.match==='nom'?' <span style="color:#a16207;font-size:8px;">(rapproché par nom — à vérifier)<\\/span>':'')+'<\\/td><td>'+e(x.exp)+'<\\/td><td>'+(x.qte!=null?e(x.qte):'—')+'<\\/td><td>'+e(String(x.statut).replace(/_/g,' '))+'<\\/td><\\/tr>'; }).join('')||'<tr><td colspan="4" style="text-align:center;color:#94a3b8;">Aucun lot<\\/td><\\/tr>';
    var stockRows=f.stock.map(function(x){ return '<tr><td>'+e(x.ref)+'<\\/td><td>'+e(x.des)+'<\\/td><td>'+e(x.qte)+' '+e(x.unite)+'<\\/td><td>'+e(x.emp)+'<\\/td><\\/tr>'; }).join('')||'<tr><td colspan="4" style="text-align:center;color:#94a3b8;">Aucun article<\\/td><\\/tr>';
    var html='<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Fiche '+e(f.nom)+'<\\/title>'+
      '<style>*{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;}body{margin:0;padding:24px;color:#1e293b;font-size:11px;}'+
      '.hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid '+BRAND_VIOLET+';padding-bottom:12px;margin-bottom:14px;}.soc{text-align:right;font-size:11px;color:#475569;}'+
      'h2{font-size:12px;color:'+BRAND_VIOLET+';text-transform:uppercase;letter-spacing:.5px;margin:14px 0 6px;border-bottom:1px solid #e9d5ff;padding-bottom:3px;}'+
      'table{width:100%;border-collapse:collapse;margin-bottom:6px;}th,td{border:1px solid #e2e8f0;padding:4px 7px;text-align:left;}th{background:#faf5ff;color:'+BRAND_VIOLET+';font-size:9px;text-transform:uppercase;}td.c{text-align:center;}td.l{width:170px;color:#64748b;font-weight:bold;font-size:10px;}'+
      '.warn{background:#fffbeb;border:1px solid #fde68a;color:#92400e;padding:6px 10px;border-radius:6px;font-size:9.5px;margin:8px 0;}.ft{margin-top:16px;font-size:9px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:8px;}'+
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}@media print{body{padding:0;}@page{size:A4 portrait;margin:10mm;}}<\\/style><\\/head><body>'+
      '<div class="hd">'+BRAND_BLOCK+'<div class="soc"><div style="font-size:15px;font-weight:bold;color:'+BRAND_VIOLET+';">FICHE PRODUIT CHIMIQUE<\\/div><div>'+e(f.nom)+'<\\/div><div>'+today+' · niveau retenu '+nc(f.nMax)+'<\\/div><\\/div><\\/div>'+
      '<div class="warn"><b>Cotation SEIRICH INDICATIVE<\\/b> (INRS ND 2233 / R 409) — à valider par le référent QHSE. Alimente le volet chimique du DUER.<\\/div>'+
      '<h2>Identité & danger<\\/h2><table>'+kv('Référence',e(f.ref))+kv('N° CAS',e(f.cas))+kv('État physique',e(f.etat))+kv('CMR',e(f.cmr))+kv('VLEP',e(f.vlep))+kv('Codes H',f.h.length?e(f.h.join(' ')):'—')+kv('Pictogrammes',f.pic.length?e(f.pic.join(' ')):'—')+kv('FDS',e(f.fds)+(f.fdsDate&&f.fdsDate!=='—'?(' ('+e(f.fdsDate)+')'):''))+'<\\/table>'+
      '<h2>Cotation SEIRICH (produit)<\\/h2><table><tr><th>Santé<\\/th><th>Incendie<\\/th><th>Environnement<\\/th><th>Niveau max<\\/th><\\/tr><tr><td class="c">'+nc(f.nS)+'<\\/td><td class="c">'+nc(f.nI)+'<\\/td><td class="c">'+nc(f.nE)+'<\\/td><td class="c">'+nc(f.nMax)+'<\\/td><\\/tr><\\/table>'+
      '<h2>Situations d\\'exposition<\\/h2><table><thead><tr><th>Unité de travail / tâche<\\/th><th>Procédé<\\/th><th>Santé<\\/th><th>Incendie<\\/th><th>Env.<\\/th><th>Retenu<\\/th><\\/tr><\\/thead><tbody>'+expoRows+'<\\/tbody><\\/table>'+
      '<h2>Péremption (lots)<\\/h2><table><thead><tr><th>Lot<\\/th><th>Expiration<\\/th><th>Quantité<\\/th><th>Statut<\\/th><\\/tr><\\/thead><tbody>'+perisRows+'<\\/tbody><\\/table>'+
      '<h2>Stock<\\/h2><table><thead><tr><th>Référence<\\/th><th>Désignation<\\/th><th>En stock<\\/th><th>Emplacement<\\/th><\\/tr><\\/thead><tbody>'+stockRows+'<\\/tbody><\\/table>'+
      '<div class="ft">Document interne généré par l\\'ERP Seem Semrac le '+today+'. Fiche produit chimique — cotation SEIRICH indicative (INRS ND 2233 / R 409).<\\/div>'+
      '<script>window.onload=function(){window.print();}<\\/script><\\/body><\\/html>';
    var w=window.open('','_blank'); if(!w){ if(window.pushNotif)pushNotif('err','fa-ban','Autorisez les pop-ups pour le PDF.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
  }
  </script>`

  return layout('Produit chimique — ' + nom, content, 'service-securite')
}
