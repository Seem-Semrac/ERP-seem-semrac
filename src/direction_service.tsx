// ══════════════════════════════════════════════════════════════
// SERVICE DIRECTION — Cockpit de pilotage (data-driven)
// À valider · Jalons critiques · Pilotage (KPIs) · Budget
// ══════════════════════════════════════════════════════════════
import { escX, layout, refusMode } from './shared'

const GOLD = '#f59e0b'
const GOLD_D = '#d97706'
const eur0 = (n: any) => (Number(n) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const eur2 = (n: any) => (Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const d10 = (s: any) => (s ? String(s).slice(0, 10) : '—')

function kpi(icon: string, label: string, val: string, color: string, sub = '') {
  return `<div style="background:white;border-radius:14px;padding:16px 18px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-left:4px solid ${color};">
    <div style="width:32px;height:32px;border-radius:9px;background:${color}18;display:flex;align-items:center;justify-content:center;margin-bottom:8px;"><i class="fas ${icon}" style="color:${color};font-size:.9rem;"></i></div>
    <div style="font-size:1.5rem;font-weight:800;color:#111827;line-height:1.1;">${val}</div>
    <div style="font-size:.7rem;font-weight:600;color:#6b7280;margin-top:3px;">${label}</div>
    ${sub ? `<div style="font-size:.66rem;color:#9ca3af;margin-top:2px;">${sub}</div>` : ''}
  </div>`
}
function badge(txt: string, bg: string, col: string) {
  return `<span style="background:${bg};color:${col};border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:700;white-space:nowrap;">${esc(txt)}</span>`
}
const prioBadge = (p: string) => p === 'urgent' || p === 'critique'
  ? badge(p.toUpperCase(), '#fee2e2', '#b91c1c') : badge('normal', '#f0fdf4', '#15803d')
const DOM_LABEL: Record<string, string> = { compta: 'Compta', rh: 'RH', qualite: 'Qualité', securite: 'Sécurité', achats: 'Achats', commercial: 'Commercial' }

// ─── BLOC 1 : À VALIDER (file générique + factures + congés) ──
function panelAValider(validations: any[], facturesValidation: any[], congesSupport: any[]) {
  const doms = Array.from(new Set(validations.map((v: any) => v.domaine).filter(Boolean)))
  const pills = ['__all', ...doms].map((dmn, i) => `<button class="dv-pill" data-dom="${escX(dmn)}" onclick="dirFilterVal('${dmn}')" style="border:1.5px solid #e2e8f0;background:${i === 0 ? GOLD : 'white'};color:${i === 0 ? 'white' : '#475569'};border-radius:999px;padding:5px 13px;font-size:.74rem;font-weight:700;cursor:pointer;">${dmn === '__all' ? 'Tous' : (DOM_LABEL[dmn] || escX(dmn))}</button>`).join('')
  const rows = validations.length ? validations.map((v: any) => `
    <tr class="dv-row" data-dom="${escX(v.domaine || '')}" data-montant="${Number(v.montant) || 0}" data-date="${escX(v.created_at || '')}" style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:9px 12px;">${badge(DOM_LABEL[v.domaine] || v.domaine || '—', '#eef2ff', '#4338ca')}</td>
      <td style="padding:9px 12px;font-weight:700;font-size:.78rem;color:#111827;">${esc(v.type || '—')}</td>
      <td style="padding:9px 12px;font-size:.78rem;color:#374151;">${esc(v.objet || '—')}</td>
      <td style="padding:9px 12px;font-size:.74rem;color:#6b7280;">${esc(v.emetteur || '—')}</td>
      <td style="padding:9px 12px;text-align:right;font-weight:700;font-size:.78rem;color:#111827;white-space:nowrap;">${v.montant != null ? eur2(v.montant) : '—'}</td>
      <td style="padding:9px 12px;text-align:center;">${prioBadge(v.priorite || 'normal')}</td>
      <td style="padding:9px 12px;font-size:.72rem;color:#94a3b8;white-space:nowrap;">${d10(v.created_at)}</td>
      <td style="padding:9px 12px;text-align:right;white-space:nowrap;">
        ${(v.ref_table && v.ref_id != null && v.ref_id !== '') ? `<button class="src-eye" data-src-table="${escX(v.ref_table)}" data-src-id="${escX(v.ref_id)}" data-src-type="${escX(v.type || '')}" data-src-objet="${escX(v.objet || '')}" title="Consulter l'objet soumis" style="padding:6px 10px;background:#eef2ff;color:#4338ca;border:none;border-radius:7px;cursor:pointer;font-size:.74rem;font-weight:700;margin-right:5px;"><i class="fas fa-eye"></i></button>` : ''}
        <button onclick="decideValidation('${v.id}','valide')" style="padding:6px 12px;background:#10b981;color:white;border:none;border-radius:7px;cursor:pointer;font-size:.74rem;font-weight:700;"><i class="fas fa-check"></i></button>
        <button onclick="decideValidation('${v.id}','refuse')" style="padding:6px 10px;background:#fee2e2;color:#b91c1c;border:none;border-radius:7px;cursor:pointer;font-size:.74rem;font-weight:700;margin-left:5px;"><i class="fas fa-times"></i></button>
      </td>
    </tr>`).join('') : `<tr><td colspan="8" style="text-align:center;padding:26px;color:#cbd5e1;font-size:.82rem;">Aucune demande en attente de validation.</td></tr>`

  // factures (mécanisme historique) + congés
  const facHtml = facturesValidation.map((f: any) => cardValide(`${f.num_facture || f.id}`, 'PAIEMENT', '#fef3c7', '#92400e', `${f.client_nom || '—'}${f.num_affaire ? ' · ' + f.num_affaire : ''}`, `TTC ${eur2(f.montant_ttc)} · échéance ${d10(f.date_echeance)}`, `validerPaiement('${f.id}','valide')`, `validerPaiement('${f.id}','refuse')`, GOLD)).join('')
  const cgHtml = congesSupport.map((cg: any) => cardValide(`${cg.salarie_id || ''}`, (cg.type || 'congé').replace('_', ' '), '#ccfbf1', '#0f766e', `${cg.salarie_nom || '—'}`, `du ${d10(cg.date_debut)} au ${d10(cg.date_fin)}`, `validerCongeSupport('${cg.id}','valide')`, `validerCongeSupport('${cg.id}','refuse')`, '#14b8a6')).join('')

  return `
  <div style="padding:24px;background:#f8fafc;min-height:60vh;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;"><i class="fas fa-inbox" style="color:${GOLD};margin-right:7px;"></i>File à valider</div>
      <span style="background:#fef3c7;color:#92400e;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${validations.length}</span>
      <div style="margin-left:auto;display:flex;align-items:center;gap:6px;">
        <button onclick="scanAlertes()" title="Détecter retards / impayés / NC critiques / stocks critiques / marges faibles et les ajouter à la file de validation" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:8px;padding:6px 12px;font-size:.74rem;font-weight:700;cursor:pointer;"><i class="fas fa-bell" style="margin-right:5px;"></i>Scanner les alertes</button>
        <span style="font-size:.72rem;color:#94a3b8;">Trier :</span>
        <select onchange="dirSortVal(this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:5px 8px;font-size:.74rem;background:white;outline:none;"><option value="date">Plus récent</option><option value="montant">Montant ↓</option></select>
      </div>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">${pills}</div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:26px;">
      <div style="overflow-x:auto;"><table id="dv-table" style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">${['Domaine', 'Type', 'Objet', 'Émetteur', 'Montant', 'Priorité', 'Date', ''].map((h, i) => `<th style="padding:9px 12px;text-align:${i === 4 ? 'right' : i === 5 ? 'center' : 'left'};font-size:.62rem;text-transform:uppercase;color:#6b7280;font-weight:800;">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>
    ${facturesValidation.length ? `<div style="font-size:.82rem;font-weight:800;color:#374151;margin-bottom:10px;"><i class="fas fa-money-check-dollar" style="color:${GOLD};margin-right:6px;"></i>Paiements de factures (${facturesValidation.length})</div><div style="display:grid;gap:10px;margin-bottom:24px;">${facHtml}</div>` : ''}
    ${congesSupport.length ? `<div style="font-size:.82rem;font-weight:800;color:#374151;margin-bottom:10px;"><i class="fas fa-umbrella-beach" style="color:#14b8a6;margin-right:6px;"></i>Congés fonctions support (${congesSupport.length})</div><div style="display:grid;gap:10px;">${cgHtml}</div>` : ''}
  </div>`
}
function cardValide(ref: string, tag: string, tagBg: string, tagCol: string, titre: string, sub: string, okFn: string, noFn: string, accent: string) {
  return `<div style="background:white;border-radius:12px;padding:14px 18px;box-shadow:0 1px 3px rgba(0,0,0,.07);display:flex;align-items:center;gap:16px;border-left:4px solid ${accent};">
    <div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;"><span style="font-family:monospace;font-size:.7rem;color:#6b7280;">${esc(ref)}</span>${badge(tag, tagBg, tagCol)}</div>
    <div style="font-weight:700;font-size:.85rem;color:#111827;">${esc(titre)}</div><div style="font-size:.72rem;color:#6b7280;margin-top:2px;">${esc(sub)}</div></div>
    <div style="display:flex;gap:8px;flex-shrink:0;"><button onclick="${okFn}" style="padding:7px 16px;background:#10b981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:.78rem;font-weight:700;"><i class="fas fa-check" style="margin-right:5px;"></i>Valider</button><button onclick="${noFn}" style="padding:7px 12px;background:#fee2e2;color:#b91c1c;border:none;border-radius:8px;cursor:pointer;font-size:.78rem;font-weight:700;"><i class="fas fa-times"></i></button></div>
  </div>`
}

// ─── BLOC 2 : JALONS CRITIQUES (données réelles) ──────────────
function jalonSection(icon: string, color: string, titre: string, count: number, bodyHtml: string) {
  return `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:16px;">
    <div style="padding:12px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:9px;background:${color}0d;">
      <i class="fas ${icon}" style="color:${color};"></i><span style="font-weight:800;font-size:.84rem;color:#111827;">${titre}</span>
      <span style="margin-left:auto;background:${count ? color + '1a' : '#f1f5f9'};color:${count ? color : '#94a3b8'};border-radius:999px;padding:1px 11px;font-size:.72rem;font-weight:800;">${count}</span>
    </div>${count ? bodyHtml : `<div style="padding:16px 18px;color:#cbd5e1;font-size:.8rem;text-align:center;">Rien à signaler ✓</div>`}</div>`
}
function miniTable(rows: string[][], headers: string[], rights: number[] = []) {
  return `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.78rem;">
    <thead><tr style="background:#f8fafc;">${headers.map((h, i) => `<th style="padding:7px 14px;text-align:${rights.includes(i) ? 'right' : 'left'};font-size:.6rem;text-transform:uppercase;color:#94a3b8;font-weight:800;">${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr style="border-top:1px solid #f1f5f9;">${r.map((cell, i) => `<td style="padding:7px 14px;text-align:${rights.includes(i) ? 'right' : 'left'};color:#374151;">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
}
// Cellule d'action « Traiter » (ou pastille « Traité » si déjà tracé) pour un jalon critique.
// Utilise data-* + délégation d'événements (aucune chaîne onclick → zéro piège d'échappement).
function jalonAct(traiteMap: Record<string, any>, dom: string, cat: string, objet: string, table: string, id: any): string {
  const key = String(table) + '|' + String(id)
  const t = traiteMap[key]
  if (t) {
    const tip = 'Traité le ' + d10(t.decided_at) + ' par ' + (t.decided_by || '—') + (t.commentaire ? ' — ' + t.commentaire : '')
    return `<span title="${escX(tip)}" style="display:inline-flex;align-items:center;gap:4px;background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 9px;font-size:.64rem;font-weight:800;white-space:nowrap;"><i class="fas fa-check"></i>Traité</span>`
  }
  return `<button class="jt-btn" data-jt-dom="${escX(dom)}" data-jt-cat="${escX(cat)}" data-jt-objet="${escX(objet)}" data-jt-table="${escX(table)}" data-jt-id="${escX(id)}" style="background:#111827;color:white;border:none;border-radius:7px;padding:4px 11px;font-size:.66rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="fas fa-clipboard-check" style="margin-right:4px;"></i>Traiter</button>`
}
const JALON_CAT: Record<string, string> = { retard_commande: 'Retard commande', stock_critique: 'Stock critique', impaye: 'Impayé client', nc_critique: 'NC critique', echeance_secu: 'Échéance sécurité' }
function panelJalonsCritiques(d: any) {
  const today = new Date().toISOString().slice(0, 10)
  const retards = (d.retardsCommandes || []), stocks = (d.stocksCritiques || []), impayes = (d.facturesImpayees || []), ncCrit = (d.ncCritiques || []), secu = (d.echeancesSecu || [])
  const traites = Array.isArray(d.jalonsTraites) ? d.jalonsTraites : []
  const traiteMap: Record<string, any> = {}
  traites.forEach((v: any) => { if (v && v.ref_table && v.ref_id != null && v.ref_id !== '') { const k = String(v.ref_table) + '|' + String(v.ref_id); if (!traiteMap[k]) traiteMap[k] = v } })
  const joursRetard = (date: any) => Math.max(0, Math.round((Date.parse(today) - Date.parse(String(date).slice(0, 10))) / 86400000))
  const secuId = (e: any) => String(e.type || '') + '-' + String(e.objet || '')
  // ─ Historique des jalons traités (traçabilité) ─
  const histRows = traites.map((v: any) => [
    badge(DOM_LABEL[v.domaine] || v.domaine || '—', '#eef2ff', '#4338ca') + ' ' + esc(JALON_CAT[String(v.type)] || v.type || '—'),
    (v.ref_table && v.ref_id != null && v.ref_id !== '')
      ? `<button class="src-eye" data-src-table="${escX(v.ref_table)}" data-src-id="${escX(v.ref_id)}" data-src-type="${escX(JALON_CAT[String(v.type)] || v.type || '')}" data-src-objet="${escX(v.objet || '')}" title="Consulter l'objet" style="background:none;border:none;color:#6366f1;cursor:pointer;padding:0 5px 0 0;"><i class="fas fa-eye"></i></button>${esc(v.objet || '—')}`
      : esc(v.objet || '—'),
    d10(v.decided_at), esc(v.decided_by || '—'),
    v.commentaire ? esc(v.commentaire) : '<span style="color:#cbd5e1;">—</span>',
  ])
  const histoSection = `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-top:26px;">
    <div style="padding:12px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:9px;background:#16a34a0d;">
      <i class="fas fa-clipboard-check" style="color:#16a34a;"></i><span style="font-weight:800;font-size:.84rem;color:#111827;">Historique des jalons critiques traités</span>
      <span style="margin-left:auto;background:${traites.length ? '#dcfce7' : '#f1f5f9'};color:${traites.length ? '#15803d' : '#94a3b8'};border-radius:999px;padding:1px 11px;font-size:.72rem;font-weight:800;">${traites.length}</span>
    </div>
    ${traites.length ? miniTable(histRows, ['Catégorie', 'Objet', 'Traité le', 'Par', 'Note']) : `<div style="padding:16px 18px;color:#cbd5e1;font-size:.8rem;text-align:center;">Aucun jalon traité pour l'instant. Cliquez « Traiter » sur un jalon pour le tracer ici.</div>`}
  </div>`
  return `<div style="padding:24px;background:#f8fafc;min-height:60vh;">
    <div style="font-size:1rem;font-weight:800;color:#111827;margin-bottom:6px;"><i class="fas fa-triangle-exclamation" style="color:#dc2626;margin-right:7px;"></i>Jalons critiques — pilotage opérationnel & financier</div>
    <div style="font-size:.74rem;color:#94a3b8;margin-bottom:16px;">Cliquez <strong>« Traiter »</strong> pour tracer qu'un jalon a été pris en charge (avec note). L'historique est conservé ci-dessous, même après résolution.</div>
    ${jalonSection('fa-truck-clock', '#dc2626', 'Commandes en retard (vs date promise client)', retards.length,
      miniTable(retards.slice(0, 20).map((c: any) => [esc(c.num_affaire || c.id), esc(c.client_nom || '—'), `<span style="color:#b91c1c;font-weight:700;">${d10(c.date_liv)} (+${joursRetard(c.date_liv)}j)</span>`, eur0(c.montant), jalonAct(traiteMap, 'commercial', 'retard_commande', `Commande ${c.num_affaire || c.id} en retard — ${c.client_nom || ''}`, 'commandes', c.id)]), ['Affaire', 'Client', 'Livraison promise', 'Montant', ''], [3, 4]))}
    ${jalonSection('fa-boxes-stacked', '#ea580c', 'Stocks critiques (à réapprovisionner)', stocks.length,
      miniTable(stocks.slice(0, 20).map((s: any) => [esc(s.reference || s.id), esc(s.designation || '—'), `<strong>${Number(s.stock_actuel) || 0}</strong> / ${Number(s.point_commande || s.stock_mini) || 0} ${esc(s.unite || '')}`, esc(s.emplacement || '—'), jalonAct(traiteMap, 'achats', 'stock_critique', `Stock critique ${s.reference || s.id} — ${s.designation || ''}`, 'stock', s.id)]), ['Référence', 'Désignation', 'Stock / seuil', 'Emplacement', ''], [2, 4]))}
    ${jalonSection('fa-file-invoice-dollar', '#b45309', 'Factures clients impayées en retard', impayes.length,
      miniTable(impayes.slice(0, 20).map((f: any) => [esc(f.num_facture || f.id), esc(f.client_nom || '—'), `<span style="color:#b91c1c;font-weight:700;">${d10(f.date_echeance)} (+${joursRetard(f.date_echeance)}j)</span>`, eur2(f.montant_ttc), jalonAct(traiteMap, 'compta', 'impaye', `Facture ${f.num_facture || f.id} impayée — ${f.client_nom || ''}`, 'factures_client', f.id)]), ['Facture', 'Client', 'Échéance', 'Montant TTC', ''], [3, 4]))}
    ${jalonSection('fa-circle-exclamation', '#dc2626', 'Non-conformités critiques / bloquantes ouvertes', ncCrit.length,
      miniTable(ncCrit.slice(0, 20).map((n: any) => [esc(n.id), d10(n.date_nc), badge(n.gravite, '#fee2e2', '#b91c1c'), esc(n.lot_ref || n.type_nc || '—'), jalonAct(traiteMap, 'qualite', 'nc_critique', `NC ${n.gravite} ${n.id} — ${n.lot_ref || n.type_nc || ''}`, 'non_conformites', n.id)]), ['NC', 'Date', 'Gravité', 'Lot / type', ''], [4]))}
    ${jalonSection('fa-helmet-safety', '#0891b2', 'Échéances Sécurité dépassées (VGP, EPI, conformité, habilitations)', secu.length,
      miniTable(secu.slice(0, 25).map((e: any) => [badge(e.type, '#cffafe', '#0e7490'), esc(e.objet || '—'), `<span style="color:#b91c1c;font-weight:700;">${d10(e.date)}</span>`, jalonAct(traiteMap, 'securite', 'echeance_secu', `${e.type || ''} — ${e.objet || ''}`, 'hse_echeance', secuId(e))]), ['Type', 'Objet', 'Échéance', ''], [2, 3]))}
    ${histoSection}
  </div>`
}

// ─── BLOC 3 : PILOTAGE (KPIs réels) ───────────────────────────
function panelPilotage(k: any = {}) {
  const otd = k.otd != null ? k.otd + ' %' : '—'
  return `<div style="padding:24px;background:#f8fafc;min-height:60vh;">
    <div style="font-size:1rem;font-weight:800;color:#111827;margin-bottom:8px;"><i class="fas fa-gauge-high" style="color:${GOLD};margin-right:7px;"></i>Pilotage — financier & opérationnel</div>
    <div style="font-size:.72rem;color:#94a3b8;margin-bottom:18px;">Mois & année en cours, données live.</div>
    <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;margin-bottom:10px;">Financier</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:22px;">
      ${kpi('fa-euro-sign', 'CA facturé (mois)', eur0(k.caMonth), '#10b981', 'facturé ce mois')}
      ${kpi('fa-chart-line', 'CA facturé (année)', eur0(k.caYear), '#16a34a', 'cumul ' + new Date().getFullYear())}
      ${kpi('fa-book', 'Carnet de commandes', eur0(k.carnet), '#6366f1', 'backlog en cours')}
      ${kpi('fa-hand-holding-dollar', 'Encours clients', eur0(k.encours), '#3b82f6', 'à encaisser')}
      ${kpi('fa-triangle-exclamation', 'Impayés en retard', eur0(k.montantImpaye), '#dc2626', (k.nbImpayes || 0) + ' facture(s)')}
    </div>
    <div style="font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;margin-bottom:10px;">Opérationnel</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;">
      ${kpi('fa-clipboard-check', 'OTD livraison client', otd, k.otd != null && k.otd >= 95 ? '#16a34a' : '#ea580c', 'objectif ≥ 95%')}
      ${kpi('fa-circle-exclamation', 'NC critiques ouvertes', String(k.ncCritiques || 0), '#ef4444', 'à traiter')}
      ${kpi('fa-boxes-stacked', 'Stocks critiques', String(k.stocksCritiques || 0), '#ea580c', 'à réapprovisionner')}
      ${kpi('fa-helmet-safety', 'Échéances Sécurité', String(k.echeancesSecu || 0), '#0891b2', 'dépassées / proches')}
      ${kpi('fa-user-injured', 'Accidents YTD', String(k.accidentsYTD || 0), (k.accidentsYTD || 0) === 0 ? '#16a34a' : '#dc2626', 'objectif = 0')}
      ${kpi('fa-users', 'Effectif actif', String(k.effectif || 0), '#6366f1', 'salariés actifs')}
      ${kpi('fa-inbox', 'En attente de validation', String(k.nbAValider || 0), '#f59e0b', 'file Direction')}
    </div>
  </div>`
}

// ─── BLOC 4 : BUDGET & MARGE (données compta réelles) ─────────
function panelBudget(b: any = {}) {
  const ca = Number(b.caHT) || 0, achats = Number(b.achatsHT) || 0, marge = Number(b.marge) || 0
  const margePct = ca > 0 ? Math.round(marge / ca * 100) : 0
  const repart: Record<string, number> = b.repartCA || {}
  const totalRep = Object.values(repart).reduce((s: number, v: any) => s + (Number(v) || 0), 0)
  const repartRows = Object.entries(repart).sort((a: any, b2: any) => b2[1] - a[1]).map(([k, v]: any) => {
    const pct = totalRep > 0 ? Math.round(v / totalRep * 100) : 0
    return `<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:.75rem;font-weight:600;color:#374151;margin-bottom:4px;"><span>${esc(k)}</span><span>${eur0(v)} · ${pct}%</span></div><div style="background:#f1f5f9;border-radius:999px;height:8px;"><div style="width:${pct}%;height:100%;background:${GOLD};border-radius:999px;"></div></div></div>`
  }).join('') || '<div style="color:#cbd5e1;font-size:.8rem;text-align:center;padding:14px;">Aucune commande enregistrée.</div>'
  return `<div style="padding:24px;background:#f8fafc;min-height:60vh;">
    <div style="font-size:1rem;font-weight:800;color:#111827;margin-bottom:6px;"><i class="fas fa-chart-pie" style="color:${GOLD};margin-right:6px;"></i>Budget & Marge ${esc(b.annee || '')} <span style="font-size:.7rem;color:#16a34a;font-weight:600;">(données compta réelles)</span></div>
    <div style="font-size:.72rem;color:#94a3b8;margin-bottom:18px;">CA facturé HT, achats fournisseurs HT et marge sur achats — cumul de l'année en cours.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin-bottom:22px;">
      ${kpi('fa-arrow-up', 'CA facturé HT (année)', eur0(ca), '#10b981', 'factures clients')}
      ${kpi('fa-arrow-down', 'Achats fournisseurs HT', eur0(achats), '#ef4444', 'factures fournisseurs')}
      ${kpi('fa-scale-balanced', 'Marge sur achats', eur0(marge), '#6366f1', margePct + '% du CA')}
    </div>
    <div style="background:white;border-radius:14px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.07);max-width:580px;">
      <div style="font-size:.78rem;font-weight:800;color:#374151;margin-bottom:14px;"><i class="fas fa-layer-group" style="color:#6366f1;margin-right:6px;"></i>Carnet de commandes par activité</div>
      ${repartRows}
    </div>
  </div>`
}

// ─── PANEL : Pilotage par affaire (salle de contrôle) ─────────
function panelParAffaire(cmds: any[]) {
  const actifs = cmds.filter((c: any) => !c.clos)
  const carnet = actifs.reduce((s: number, c: any) => s + (c.montant || 0), 0)
  const enRetard = cmds.filter((c: any) => c.retard).length
  const mv = cmds.filter((c: any) => c.marge != null && c.montant > 0)
  const margeMoy = mv.length ? Math.round(mv.reduce((s: number, c: any) => s + c.marge / c.montant * 100, 0) / mv.length) : null
  const sorted = [...cmds].sort((a: any, b: any) => (b.retard ? 1 : 0) - (a.retard ? 1 : 0))
  const rows = sorted.length ? sorted.slice(0, 100).map((c: any) => {
    const av = c.bdtTotal > 0 ? Math.round(c.bdtSoldes / c.bdtTotal * 100) : 0
    const avCol = av === 100 ? '#22c55e' : (av > 0 ? '#f59e0b' : '#cbd5e1')
    const mPct = (c.marge != null && c.montant > 0) ? (c.marge / c.montant * 100) : null
    const mCol = mPct == null ? '#94a3b8' : (mPct >= 15 ? '#16a34a' : (mPct >= 0 ? '#d97706' : '#dc2626'))
    return `<tr style="border-bottom:1px solid #f4f4f5;">
      <td style="padding:9px 12px;font-weight:700;color:#1e293b;">${esc(c.num)}</td>
      <td style="padding:9px 12px;color:#475569;">${esc(c.client || '—')}</td>
      <td style="padding:9px 12px;"><div style="display:flex;align-items:center;gap:7px;"><div style="flex:1;min-width:46px;height:7px;background:#eef2f7;border-radius:6px;overflow:hidden;"><div style="height:100%;width:${av}%;background:${avCol};"></div></div><span style="font-size:.72rem;font-weight:700;color:${avCol};white-space:nowrap;">${c.bdtSoldes}/${c.bdtTotal}</span></div></td>
      <td style="padding:9px 12px;text-align:right;font-weight:600;">${eur0(c.montant)}</td>
      <td style="padding:9px 12px;text-align:right;font-weight:700;color:${mCol};">${mPct != null ? mPct.toFixed(0) + '%' : '—'}</td>
      <td style="padding:9px 12px;text-align:center;font-size:.74rem;${c.retard ? 'color:#dc2626;font-weight:700;' : 'color:#475569;'}">${c.dateLiv ? d10(c.dateLiv) : '—'}${c.retard ? ' ⚠' : ''}</td>
      <td style="padding:9px 12px;text-align:center;"><a href="/production/commande/${encodeURIComponent(c.id)}" style="color:#3b82f6;text-decoration:none;font-size:.72rem;font-weight:700;">détail</a></td>
    </tr>`
  }).join('') : `<tr><td colspan="7" style="text-align:center;padding:30px;color:#cbd5e1;font-size:.82rem;">Aucune commande en base.</td></tr>`
  return `<div style="padding:24px;background:#f8fafc;min-height:60vh;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px;">
      ${kpi('fa-folder-open', 'Affaires actives', String(actifs.length), '#3b82f6', 'commandes non soldées')}
      ${kpi('fa-wallet', 'Carnet de commandes', eur0(carnet), '#7c3aed', 'reste à produire/livrer')}
      ${kpi('fa-percent', 'Marge moyenne', margeMoy != null ? margeMoy + '%' : '—', margeMoy == null ? '#94a3b8' : (margeMoy >= 15 ? '#16a34a' : '#d97706'), 'commandes soldées')}
      ${kpi('fa-truck-clock', 'En retard', String(enRetard), enRetard ? '#dc2626' : '#22c55e', 'vs date promise')}
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="padding:13px 18px;font-weight:800;color:#111827;border-bottom:1px solid #f1f5f9;"><i class="fas fa-folder-tree" style="color:${GOLD_D};margin-right:7px;"></i>Pilotage par affaire & client</div>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;">
        <thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#64748b;">Affaire</th><th style="text-align:left;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#64748b;">Client</th><th style="text-align:left;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#64748b;">Avancement</th><th style="text-align:right;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#64748b;">Montant</th><th style="text-align:right;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#64748b;">Marge</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#64748b;">Livraison</th><th style="text-align:center;padding:9px 12px;font-size:.64rem;text-transform:uppercase;color:#64748b;"></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>
  </div>`
}

// ══════════════════════════════════════════════════════════════
// SANTÉ DES DONNÉES (DICT) — Disponibilité / Intégrité / Confidentialité / Traçabilité
// Recalculé à chaque chargement : flague orphelins, liens manquants, valeurs hors référentiel.
// ══════════════════════════════════════════════════════════════
type HealthCheck = { pillar: 'D' | 'I' | 'C' | 'T'; label: string; count: number; total: number; severity: 'ok' | 'warn' | 'crit'; detail: string; samples?: string[]; info?: boolean }

const _norm = (s: any) => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function computeDataHealth(ctx: any): any {
  const A = (x: any) => (Array.isArray(x) ? x : [])
  const today = (ctx.today as string) || new Date().toISOString().slice(0, 10)
  const dotations = A(ctx.dotations), epiCat = A(ctx.epiCat), peris = A(ctx.peris), chim = A(ctx.chim)
  const fournisseurs = A(ctx.fournisseurs), salaries = A(ctx.salaries), incidents = A(ctx.incidents)
  const certs = A(ctx.certs), ncs = A(ctx.ncs), conf = A(ctx.conf), validations = A(ctx.validations)
  const checks: HealthCheck[] = []
  const sev = (count: number, total: number): 'ok' | 'warn' | 'crit' => count === 0 ? 'ok' : (total > 0 && count / total <= 0.5 ? 'warn' : 'crit')
  const add = (pillar: HealthCheck['pillar'], label: string, count: number, total: number, detail: string, samples?: string[], info = false) =>
    checks.push({ pillar, label, count, total, severity: info ? (count ? 'warn' : 'ok') : sev(count, total), detail, samples: samples && samples.length ? samples.slice(0, 8) : undefined, info })

  // ── Référentiel fournisseurs (noms connus) ──
  const fournNoms = new Set(fournisseurs.map((f: any) => _norm(f.nom)).filter(Boolean))
  const salNoms = new Set<string>()
  salaries.forEach((s: any) => { const n = _norm((s.nom || '') + ' ' + (s.prenom || '')); if (n) salNoms.add(n); const r = _norm((s.prenom || '') + ' ' + (s.nom || '')); if (r) salNoms.add(r) })

  // ─── INTÉGRITÉ (liens / référentiels) ───
  add('I', 'Dotations EPI reliées à un fournisseur', dotations.filter((x: any) => !x.fournisseur_id).length, dotations.length, 'Rattacher chaque dotation au référentiel Fournisseurs (sinon pas de coût consolidé).')
  add('I', 'EPI catalogue reliés à un fournisseur', epiCat.filter((x: any) => !x.fournisseur_id).length, epiCat.length, 'Choisir le fournisseur dans la fiche EPI (Sécurité › EPI catalogue).')
  add('I', 'Périssables reliés à un fournisseur', peris.filter((x: any) => !x.fournisseur_id).length, peris.length, 'Renseigner le fournisseur du lot (Qualité › Produits périssables).')
  add('I', 'Produits chimiques reliés à un fournisseur', chim.filter((x: any) => !x.fournisseur_id).length, chim.length, 'Modèle déjà câblé : sélectionner le fournisseur dans la fiche FDS.')
  // Fournisseurs cités en texte : quelle fraction existe au référentiel ?
  // Dénominateur = noms distincts cités (in + hors réf) — sinon le ratio serait dégénéré (toujours 0%).
  const nameKey = (s: any) => _norm(s).split(' ').filter(Boolean).sort().join(' ')
  const citedFour = new Map<string, string>()
  ;[...dotations, ...peris, ...epiCat].forEach((x: any) => { const raw = (x.fournisseur || '').trim(); const n = _norm(raw); if (raw && !/^stock /i.test(raw)) citedFour.set(n, raw) })
  const fourHors = [...citedFour.entries()].filter(([n]) => !fournNoms.has(n)).map(([, raw]) => raw)
  add('I', 'Fournisseurs cités hors référentiel', fourHors.length, citedFour.size || 1, 'Créer ces fournisseurs dans Achats (ou corriger le nom) pour relier coûts et catalogue.', fourHors)
  add('I', 'Incidents rattachés à un salarié', incidents.filter((x: any) => !x.salarie_id).length, incidents.length, 'Lier l\'accident à la fiche salarié (sinon TF/TG non imputables).')
  add('I', 'Dotations EPI rattachées à un salarié', dotations.filter((x: any) => !x.salarie_id).length, dotations.length, 'Réconcilier les remises avec les salariés (voir « Salariés à rattacher »).')
  add('I', 'Certifications rattachées à un salarié', certs.filter((x: any) => !x.salarie_id).length, certs.length, 'Lier l\'habilitation à la fiche salarié pour alimenter la matrice formations.')
  // Noms cités (clé ordre-insensible « NOM Prénom » == « Prénom NOM ») : fraction présente dans la base.
  const salKeys = new Set([...salNoms].map(nameKey))
  const citedPeople = new Map<string, string>()
  ;[...dotations, ...incidents, ...certs].forEach((x: any) => { const raw = (x.salarie_nom || x.employe_nom || '').trim(); const k = nameKey(raw); if (raw && k) citedPeople.set(k, raw) })
  const nomsList = [...citedPeople.entries()].filter(([k]) => !salKeys.has(k)).map(([, raw]) => raw)
  add('I', 'Personnes citées absentes de la base salariés', nomsList.length, citedPeople.size || 1, 'Créer ces salariés (RH) puis relancer la réconciliation.', nomsList)

  // ─── DISPONIBILITÉ (données présentes pour piloter) ───
  add('D', 'Produits chimiques avec FDS', chim.filter((x: any) => !x.fds_ref && !x.fds_url).length, chim.length, 'Joindre la fiche de données de sécurité (obligation réglementaire).')
  const perimes = peris.filter((x: any) => x.date_expiration && String(x.date_expiration).slice(0, 10) < today && (Number(x.quantite) || 0) > 0)
  add('D', 'Périssables périmés encore en stock', perimes.length, peris.length, 'Enregistrer une sortie / mise au rebut pour ces lots.', perimes.map((x: any) => `${x.nom || x.code_produit || x.id} (exp. ${String(x.date_expiration).slice(0, 10)})`))
  add('D', 'Dotations EPI valorisées (prix saisi)', dotations.filter((x: any) => x.prix == null || x.prix === '').length, dotations.length, 'Renseigner le prix pour consolider les Dépenses HSE.')
  add('D', 'Obligations de conformité tenues', conf.filter((x: any) => x.statut === 'non_conforme' || (x.date_echeance && String(x.date_echeance).slice(0, 10) < today)).length, conf.length, 'Traiter les obligations non conformes ou échues (Sécurité › Conformité).')

  // ─── CONFIDENTIALITÉ (gouvernance des accès) ───
  const actifs = salaries.filter((s: any) => s.actif !== false && String(s.actif) !== 'False')
  add('C', 'Salariés actifs avec un rôle défini', actifs.filter((s: any) => !s.role && !(s.autorisations && String(s.autorisations).length)).length, actifs.length, 'Définir un rôle / des autorisations : l\'accès aux modules doit être cadré.')
  add('C', 'Salariés actifs avec identifiant de connexion', actifs.filter((s: any) => !s.matricule || !s.pin).length, actifs.length, 'Matricule + PIN requis pour tracer les accès (sinon connexion impossible).')
  add('C', 'Posture sécurité (clé anon, RLS)', 1, 1, 'Rotation de la clé anon committée et durcissement RLS à acter (Lot 6 / hardening).', undefined, true)

  // ─── TRAÇABILITÉ (horodatage, qui a fait quoi) ───
  const incClos = incidents.filter((x: any) => /clos|clotur|ferm/i.test(String(x.statut || '')))
  add('T', 'Incidents clôturés avec date de clôture', incClos.filter((x: any) => !x.date_cloture).length, incClos.length, 'Saisir la date de clôture pour la traçabilité de l\'accident.')
  add('T', 'NC avec horodatage de mise à jour', ncs.filter((x: any) => !x.updated_at).length, ncs.length, 'Champ updated_at vide : la chronologie de traitement n\'est pas tracée.')
  const decided = validations.filter((x: any) => (x.statut || 'en_attente') !== 'en_attente')
  add('T', 'Décisions de validation avec auteur', decided.filter((x: any) => !x.decided_by).length, decided.length, 'Enregistrer le décideur (decided_by) sur chaque validation.')
  add('T', 'Horodatage de modification (updated_at)', 0, 1, 'Auto-renseigné par trigger sur certifications / hse_incidents / hse_epi_dotations / competences_operateur (+ non_conformites).', undefined, true)

  // ── Scores par pilier ──
  const PILLARS = [
    { key: 'I', label: 'Intégrité', icon: 'fa-link', desc: 'Liens & référentiels' },
    { key: 'D', label: 'Disponibilité', icon: 'fa-database', desc: 'Données présentes' },
    { key: 'C', label: 'Confidentialité', icon: 'fa-user-shield', desc: 'Accès cadrés' },
    { key: 'T', label: 'Traçabilité', icon: 'fa-clock-rotate-left', desc: 'Horodatage & auteur' },
  ]
  const pillars = PILLARS.map(p => {
    const cs = checks.filter(c => c.pillar === p.key && !c.info)
    const ratios = cs.filter(c => c.total > 0).map(c => (c.total - c.count) / c.total)
    const score = ratios.length ? Math.round(ratios.reduce((s, r) => s + r, 0) / ratios.length * 100) : 100
    const issues = cs.reduce((s, c) => s + (c.count > 0 ? 1 : 0), 0)
    return { ...p, score, issues, checks: checks.filter(c => c.pillar === p.key) }
  })
  const globalScore = Math.round(pillars.reduce((s, p) => s + p.score, 0) / pillars.length)
  return { pillars, globalScore, today, totalIssues: checks.filter(c => !c.info && c.count > 0).length }
}

function _scoreColor(n: number) { return n >= 90 ? '#16a34a' : n >= 70 ? '#d97706' : '#dc2626' }

function panelSanteDonnees(report: any) {
  if (!report) return `<div style="padding:40px;text-align:center;color:#9ca3af;">Santé des données indisponible.</div>`
  const sevCol: Record<string, string> = { ok: '#16a34a', warn: '#d97706', crit: '#dc2626' }
  const sevBg: Record<string, string> = { ok: '#f0fdf4', warn: '#fffbeb', crit: '#fef2f2' }
  const gauges = report.pillars.map((p: any) => {
    const col = _scoreColor(p.score)
    return `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:16px 18px;border-top:4px solid ${col};">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><i class="fas ${p.icon}" style="color:${col};"></i><span style="font-weight:800;color:#111827;font-size:.86rem;">${p.label}</span></div>
      <div style="font-size:2rem;font-weight:800;color:${col};line-height:1;">${p.score}<span style="font-size:.9rem;color:#9ca3af;">/100</span></div>
      <div style="height:6px;background:#f1f5f9;border-radius:999px;margin-top:8px;overflow:hidden;"><div style="height:100%;width:${p.score}%;background:${col};"></div></div>
      <div style="font-size:.66rem;color:#9ca3af;margin-top:6px;">${p.desc} · ${p.issues ? p.issues + ' point(s) à corriger' : 'tout est lié'}</div>
    </div>`
  }).join('')
  const section = (p: any) => {
    const col = _scoreColor(p.score)
    const rows = p.checks.map((c: any, i: number) => {
      const ratio = c.total > 0 ? Math.round((c.total - c.count) / c.total * 100) : 100
      const cnt = c.info ? '<i class="fas fa-circle-info"></i>' : (c.count === 0 ? '<i class="fas fa-check"></i>' : `${c.count}${c.total > 1 ? ' / ' + c.total : ''}`)
      const sid = `dh-${p.key}-${i}`
      const samples = c.samples && c.samples.length
        ? `<div id="${sid}" style="display:none;margin-top:7px;padding:8px 10px;background:#f8fafc;border-radius:8px;font-size:.72rem;color:#475569;">${c.samples.map((s: string) => `<span style="display:inline-block;background:white;border:1px solid #e2e8f0;border-radius:6px;padding:2px 8px;margin:2px 3px 2px 0;">${esc(s)}</span>`).join('')}${c.count > c.samples.length ? `<span style="color:#9ca3af;"> +${c.count - c.samples.length} autre(s)…</span>` : ''}</div>`
        : ''
      return `<div style="padding:11px 14px;border-bottom:1px solid #f1f5f9;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="min-width:62px;text-align:center;font-weight:800;font-size:.78rem;color:${sevCol[c.severity]};background:${sevBg[c.severity]};border-radius:7px;padding:4px 8px;">${cnt}</span>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:.8rem;color:#111827;">${esc(c.label)}${c.samples && c.samples.length ? ` <button onclick="document.getElementById('${sid}').style.display=document.getElementById('${sid}').style.display==='none'?'block':'none'" style="border:none;background:none;color:${GOLD_D};cursor:pointer;font-size:.7rem;font-weight:700;">détails</button>` : ''}</div>
            <div style="font-size:.7rem;color:#6b7280;margin-top:1px;">${esc(c.detail)}</div>
            ${samples}
          </div>
          ${!c.info ? `<div style="width:60px;text-align:right;font-size:.72rem;font-weight:700;color:${_scoreColor(ratio)};">${ratio}%</div>` : ''}
        </div>
      </div>`
    }).join('')
    return `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:16px;">
      <div style="padding:12px 16px;border-bottom:2px solid ${col};display:flex;align-items:center;gap:9px;"><i class="fas ${p.icon}" style="color:${col};"></i><span style="font-weight:800;color:#111827;">${p.label}</span><span style="font-size:.7rem;color:#9ca3af;">${esc(p.desc)}</span><span style="margin-left:auto;font-weight:800;color:${col};">${p.score}/100</span></div>
      ${rows}
    </div>`
  }
  const gcol = _scoreColor(report.globalScore)
  return `<div style="padding:18px 22px;">
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
      <div style="background:linear-gradient(135deg,${gcol},${gcol}cc);border-radius:16px;padding:18px 24px;color:white;min-width:200px;">
        <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;opacity:.85;font-weight:700;">Score DICT global</div>
        <div style="font-size:2.6rem;font-weight:800;line-height:1;margin-top:4px;">${report.globalScore}<span style="font-size:1rem;opacity:.8;">/100</span></div>
        <div style="font-size:.72rem;opacity:.9;margin-top:6px;">${report.totalIssues} contrôle(s) à corriger</div>
      </div>
      <div style="flex:1;min-width:300px;font-size:.78rem;color:#475569;line-height:1.6;background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:14px 18px;">
        <strong><i class="fas fa-stethoscope" style="margin-right:6px;color:${GOLD_D};"></i>Santé des données (DICT)</strong> — recalculé à chaque ouverture. Vérifie que les données saisies <em>transitent</em> entre les modules : liens fournisseurs / salariés, valeurs hors référentiel, données manquantes, traçabilité. Un score < 100 signale ce qui reste à brancher pour rester conforme.
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:18px;">${gauges}</div>
    ${report.pillars.map((p: any) => section(p)).join('')}
  </div>`
}

// ─── BLOC « TRAITÉS » : historique des validations décidées (validées/refusées) ──
function panelTraites(decided: any[]) {
  const list = Array.isArray(decided) ? decided : []
  const doms = Array.from(new Set(list.map((v: any) => v.domaine).filter(Boolean)))
  const pills = ['__all', ...doms].map((dmn, i) => `<button class="dt-pill" data-dom="${escX(dmn)}" onclick="dirFilterTr('${dmn}')" style="border:1.5px solid #e2e8f0;background:${i === 0 ? GOLD : 'white'};color:${i === 0 ? 'white' : '#475569'};border-radius:999px;padding:5px 13px;font-size:.74rem;font-weight:700;cursor:pointer;">${dmn === '__all' ? 'Toutes catégories' : (DOM_LABEL[dmn] || escX(dmn))}</button>`).join('')
  const decPills = [['__all', 'Toutes décisions', '#475569'], ['valide', 'Validées', '#15803d'], ['refuse', 'Refusées', '#b91c1c']]
    .map(([k, lab, col], i) => `<button class="dt-dec" data-dec="${k}" onclick="dirDecTr('${k}')" style="border:1.5px solid #e2e8f0;background:${i === 0 ? '#111827' : 'white'};color:${i === 0 ? 'white' : col};border-radius:999px;padding:5px 13px;font-size:.74rem;font-weight:700;cursor:pointer;">${lab}</button>`).join('')
  const decBadge = (v: any) => v.statut === 'valide'
    ? badge('VALIDÉ', '#dcfce7', '#15803d')
    : (refusMode(v) === 'annulation' ? badge('REFUSÉ · ANNULATION', '#fee2e2', '#b91c1c') : badge('REFUSÉ · RÉVISION', '#ffedd5', '#c2410c'))
  const rows = list.length ? list.map((v: any) => `
    <tr class="dt-row" data-dom="${escX(v.domaine || '')}" data-dec="${escX(v.statut || '')}" data-date="${escX(v.decided_at || v.created_at || '')}" style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:9px 12px;">${badge(DOM_LABEL[v.domaine] || v.domaine || '—', '#eef2ff', '#4338ca')}</td>
      <td style="padding:9px 12px;font-weight:700;font-size:.78rem;color:#111827;">${esc(v.type || '—')}</td>
      <td style="padding:9px 12px;font-size:.78rem;color:#374151;">${esc(v.objet || '—')}</td>
      <td style="padding:9px 12px;font-size:.74rem;color:#6b7280;">${esc(v.emetteur || '—')}</td>
      <td style="padding:9px 12px;text-align:right;font-weight:700;font-size:.78rem;color:#111827;white-space:nowrap;">${v.montant != null ? eur2(v.montant) : '—'}</td>
      <td style="padding:9px 12px;text-align:center;">${decBadge(v)}</td>
      <td style="padding:9px 12px;font-size:.72rem;color:#94a3b8;white-space:nowrap;">${d10(v.decided_at)}</td>
      <td style="padding:9px 12px;font-size:.74rem;color:#6b7280;">${esc(v.decided_by || '—')}</td>
      <td style="padding:9px 12px;font-size:.74rem;color:#6b7280;max-width:260px;">${v.commentaire ? esc(v.commentaire) : '<span style="color:#cbd5e1;">—</span>'}</td>
      <td style="padding:9px 12px;text-align:right;white-space:nowrap;">${(v.ref_table && v.ref_id != null && v.ref_id !== '') ? `<button class="src-eye" data-src-table="${escX(v.ref_table)}" data-src-id="${escX(v.ref_id)}" data-src-type="${escX(v.type || '')}" data-src-objet="${escX(v.objet || '')}" title="Consulter l'objet" style="padding:5px 9px;background:#eef2ff;color:#4338ca;border:none;border-radius:7px;cursor:pointer;font-size:.72rem;"><i class="fas fa-eye"></i></button>` : ''}</td>
    </tr>`).join('') : `<tr><td colspan="10" style="text-align:center;padding:26px;color:#cbd5e1;font-size:.82rem;">Aucune décision enregistrée pour l'instant.</td></tr>`

  return `
  <div style="padding:24px;background:#f8fafc;min-height:60vh;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;"><i class="fas fa-clipboard-check" style="color:${GOLD};margin-right:7px;"></i>Historique des validations traitées</div>
      <span style="background:#e5e7eb;color:#374151;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${list.length}</span>
      <span style="margin-left:auto;font-size:.72rem;color:#94a3b8;">Décisions passées (validées / refusées) — classables par catégorie, indépendamment de la file à traiter.</span>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">${pills}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">${decPills}</div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;"><table id="dt-table" style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">${['Catégorie', 'Type', 'Objet', 'Émetteur', 'Montant', 'Décision', 'Décidé le', 'Par', 'Commentaire', ''].map((h, i) => `<th style="padding:9px 12px;text-align:${i === 4 ? 'right' : i === 5 ? 'center' : 'left'};font-size:.62rem;text-transform:uppercase;color:#6b7280;font-weight:800;">${h}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>
  </div>`
}

// ─── EXPORT ───────────────────────────────────────────────────
export function pageServiceDirection(data: any = {}): string {
  const d = data || {}
  const nbAValider = (d.validations || []).length + (d.facturesValidation || []).length + (d.congesSupport || []).length
  const nbJalons = (d.retardsCommandes || []).length + (d.stocksCritiques || []).length + (d.facturesImpayees || []).length + (d.ncCritiques || []).length + (d.echeancesSecu || []).length
  const TABS = [
    { label: 'À valider', icon: 'fa-inbox', badge: nbAValider },
    { label: 'Traités', icon: 'fa-clipboard-check', badge: (d.validationsDecidees || []).length || '' },
    { label: 'Jalons critiques', icon: 'fa-triangle-exclamation', badge: nbJalons },
    { label: 'Par affaire', icon: 'fa-folder-tree', badge: (d.commandesPilotage || []).length || '' },
    { label: 'Pilotage', icon: 'fa-gauge-high', badge: '' },
    { label: 'Budget', icon: 'fa-chart-pie', badge: '' },
    { label: 'Santé des données', icon: 'fa-stethoscope', badge: (d.santeDonnees && d.santeDonnees.totalIssues) || '' },
  ]
  const panels = [
    panelAValider(d.validations || [], d.facturesValidation || [], d.congesSupport || []),
    panelTraites(d.validationsDecidees || []),
    panelJalonsCritiques(d),
    panelParAffaire(d.commandesPilotage || []),
    panelPilotage(d.kpis || {}),
    panelBudget(d.budget || {}),
    panelSanteDonnees(d.santeDonnees),
  ]
  const content = `
<style>
  .dir-tab{padding:10px 18px;border-radius:8px 8px 0 0;font-size:.82rem;font-weight:600;cursor:pointer;background:rgba(255,255,255,.08);border:none;color:rgba(255,255,255,.65);transition:all .15s;white-space:nowrap;display:inline-flex;align-items:center;gap:7px;margin-bottom:-3px;}
  .dir-tab.active{background:white;color:${GOLD_D};font-weight:700;}
  .dir-tab:not(.active):hover{background:rgba(255,255,255,.16);color:white;}
  .dir-tab-badge{background:rgba(255,255,255,.25);border-radius:999px;padding:0 7px;font-size:.64rem;font-weight:800;}
  .dir-tab.active .dir-tab-badge{background:${GOLD}26;color:${GOLD_D};}
</style>
<div style="background:${GOLD};padding:12px 24px;display:flex;align-items:center;gap:12px;">
  <i class="fas fa-crown" style="color:white;font-size:1.1rem;"></i>
  <span style="color:white;font-weight:800;font-size:.95rem;">Direction Générale</span>
  <span style="color:rgba(255,255,255,.7);font-size:.72rem;">· Cockpit de pilotage · Seem Semrac</span>
</div>
<div style="background:linear-gradient(135deg,#7c4a03,#451a03);padding:12px 16px 0;display:flex;align-items:flex-end;gap:4px;overflow-x:auto;border-bottom:3px solid ${GOLD};">
  ${TABS.map((t, i) => `<button onclick="dirTab(${i})" id="dir-tab-${i}" class="dir-tab${i === 0 ? ' active' : ''}"><i class="fas ${t.icon}"></i>${t.label}${t.badge ? `<span class="dir-tab-badge">${t.badge}</span>` : ''}</button>`).join('')}
</div>
${panels.map((p, i) => `<div id="dir-panel-${i}" style="display:${i === 0 ? '' : 'none'};">${p}</div>`).join('')}
<div id="refus-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;align-items:center;justify-content:center;">
  <div style="background:white;border-radius:14px;padding:22px 24px;width:min(470px,92vw);box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="font-size:1rem;font-weight:800;color:#b91c1c;margin-bottom:4px;"><i class="fas fa-circle-xmark" style="margin-right:7px;"></i>Refuser cette validation</div>
    <div style="font-size:.76rem;color:#6b7280;margin-bottom:14px;">Indiquez le motif, puis choisissez l'effet du refus sur l'élément.</div>
    <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:5px;">Motif du refus *</label>
    <textarea id="refus-motif" rows="3" placeholder="Raison du refus…" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;outline:none;resize:vertical;margin-bottom:14px;box-sizing:border-box;"></textarea>
    <label style="display:flex;align-items:flex-start;gap:9px;background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:11px 13px;cursor:pointer;margin-bottom:16px;">
      <input type="checkbox" id="refus-annul" style="margin-top:3px;width:16px;height:16px;accent-color:#dc2626;cursor:pointer;"/>
      <span style="font-size:.8rem;color:#374151;"><strong>Annulation totale</strong> de l'élément.<br/><span style="font-size:.72rem;color:#9ca3af;">Décoché = <strong>renvoi en révision</strong> (l'émetteur corrige et resoumet).</span></span>
    </label>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button onclick="refusCancel()" style="padding:8px 16px;background:#f1f5f9;color:#475569;border:none;border-radius:8px;font-size:.8rem;font-weight:700;cursor:pointer;">Annuler</button>
      <button onclick="refusConfirm()" style="padding:8px 16px;background:linear-gradient(135deg,#ef4444,#b91c1c);color:white;border:none;border-radius:8px;font-size:.8rem;font-weight:700;cursor:pointer;">Confirmer le refus</button>
    </div>
  </div>
</div>
<div id="jalon-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;align-items:center;justify-content:center;">
  <div style="background:white;border-radius:14px;padding:22px 24px;width:min(470px,92vw);box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="font-size:1rem;font-weight:800;color:#111827;margin-bottom:4px;"><i class="fas fa-clipboard-check" style="color:#16a34a;margin-right:7px;"></i>Tracer le traitement du jalon</div>
    <div id="jalon-modal-obj" style="font-size:.76rem;color:#6b7280;margin-bottom:14px;"></div>
    <label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:5px;">Note / action menee (optionnel)</label>
    <textarea id="jalon-note" rows="3" placeholder="Ex : relance client, reappro lance, derogation..." style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;outline:none;resize:vertical;margin-bottom:16px;box-sizing:border-box;"></textarea>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button onclick="jalonCancel()" style="padding:8px 16px;background:#f1f5f9;color:#475569;border:none;border-radius:8px;font-size:.8rem;font-weight:700;cursor:pointer;">Annuler</button>
      <button onclick="jalonConfirm()" style="padding:8px 16px;background:linear-gradient(135deg,#16a34a,#15803d);color:white;border:none;border-radius:8px;font-size:.8rem;font-weight:700;cursor:pointer;">Marquer traite</button>
    </div>
  </div>
</div>
<div id="source-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;align-items:center;justify-content:center;" onclick="if(event.target===this)srcClose()">
  <div style="background:white;border-radius:14px;width:min(620px,94vw);max-height:86vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);">
    <div style="padding:16px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:flex-start;gap:10px;">
      <i class="fas fa-eye" style="color:#4338ca;margin-top:3px;"></i>
      <div style="flex:1;min-width:0;"><div id="src-title" style="font-weight:800;font-size:.92rem;color:#111827;">Consultation</div><div id="src-sub" style="font-size:.72rem;color:#6b7280;margin-top:2px;word-break:break-word;"></div></div>
      <button onclick="srcClose()" style="background:#f1f5f9;border:none;border-radius:8px;width:30px;height:30px;cursor:pointer;color:#475569;font-size:1rem;">&times;</button>
    </div>
    <div id="src-body" style="padding:16px 22px;overflow:auto;font-size:.8rem;">Chargement...</div>
    <div id="src-foot" style="padding:12px 22px;border-top:1px solid #f1f5f9;display:none;justify-content:flex-end;"></div>
  </div>
</div>
<script>
var DIR_N=${panels.length};
function dirTab(n){ for(var i=0;i<DIR_N;i++){ var p=document.getElementById('dir-panel-'+i),b=document.getElementById('dir-tab-'+i); if(p)p.style.display=(i===n)?'':'none'; if(b)b.classList.toggle('active',i===n);} }
function dirFilterVal(dom){
  document.querySelectorAll('.dv-pill').forEach(function(b){ var on=b.getAttribute('data-dom')===dom; b.style.background=on?'${GOLD}':'white'; b.style.color=on?'white':'#475569'; });
  document.querySelectorAll('#dv-table .dv-row').forEach(function(r){ r.style.display=(dom==='__all'||r.getAttribute('data-dom')===dom)?'':'none'; });
}
function dirSortVal(key){
  var tb=document.querySelector('#dv-table tbody'); if(!tb) return;
  var rows=[].slice.call(tb.querySelectorAll('.dv-row'));
  rows.sort(function(a,b){ if(key==='montant'){ return (parseFloat(b.getAttribute('data-montant'))||0)-(parseFloat(a.getAttribute('data-montant'))||0); } return (b.getAttribute('data-date')||'').localeCompare(a.getAttribute('data-date')||''); });
  rows.forEach(function(r){ tb.appendChild(r); });
}
var _trDom='__all', _trDec='__all';
function _trApply(){
  document.querySelectorAll('#dt-table .dt-row').forEach(function(r){
    var okD=(_trDom==='__all'||r.getAttribute('data-dom')===_trDom);
    var okC=(_trDec==='__all'||r.getAttribute('data-dec')===_trDec);
    r.style.display=(okD&&okC)?'':'none';
  });
}
function dirFilterTr(dom){ _trDom=dom;
  document.querySelectorAll('.dt-pill').forEach(function(b){ var on=b.getAttribute('data-dom')===dom; b.style.background=on?'${GOLD}':'white'; b.style.color=on?'white':'#475569'; });
  _trApply();
}
function dirDecTr(dec){ _trDec=dec;
  document.querySelectorAll('.dt-dec').forEach(function(b){ var d=b.getAttribute('data-dec'),on=d===dec; b.style.background=on?'#111827':'white'; b.style.color=on?'white':(d==='valide'?'#15803d':d==='refuse'?'#b91c1c':'#475569'); });
  _trApply();
}
var _refusId=null;
function decideValidation(id, decision){
  if(decision==='refuse'){ _refusId=id; var t=document.getElementById('refus-motif'); if(t)t.value=''; var a=document.getElementById('refus-annul'); if(a)a.checked=false; var m=document.getElementById('refus-modal'); if(m)m.style.display='flex'; return; }
  _postDecision(id,'valide',null,null);
}
function refusCancel(){ var m=document.getElementById('refus-modal'); if(m)m.style.display='none'; _refusId=null; }
function refusConfirm(){
  var motif=((document.getElementById('refus-motif')||{}).value||'').trim();
  if(!motif){ pushNotif('warn','fa-exclamation-triangle','Indiquez un motif de refus.',3000); return; }
  var mode=(document.getElementById('refus-annul')||{}).checked?'annulation':'revision';
  _postDecision(_refusId,'refuse',motif,mode); refusCancel();
}
function _postDecision(id, decision, comment, mode){
  fetch('/api/validations/'+encodeURIComponent(id)+'/decision',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:decision,commentaire:comment,refus_mode:mode})})
    .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
      var msg=decision==='refuse'?(mode==='annulation'?'Refusé — annulation totale.':'Refusé — renvoi en révision.'):'Validé.';
      pushNotif(decision==='refuse'?'warn':'ok',decision==='refuse'?'fa-times':'fa-check',msg,3800); setTimeout(function(){softReload();},700); })
    .catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function validerPaiement(id, decision){
  fetch('/api/factures/'+encodeURIComponent(id)+'/valider-paiement',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:decision,valide_par:'Direction'})})
    .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif(decision==='refuse'?'warn':'ok',decision==='refuse'?'fa-times':'fa-check',decision==='refuse'?('Paiement refusé · '+id):('Paiement validé · '+id),4500); setTimeout(function(){softReload();},700); })
    .catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function validerCongeSupport(id, decision){
  fetch('/api/rh/conge/'+encodeURIComponent(id)+'/valider',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision:decision,valide_par:'Direction'})})
    .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; } pushNotif(decision==='refuse'?'warn':'ok',decision==='refuse'?'fa-times':'fa-check',decision==='refuse'?'Congé refusé.':('Congé validé · '+(j.absences_creees||0)+' jour(s) posés.'),5000); setTimeout(function(){softReload();},800); })
    .catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function scanAlertes(){
  pushNotif('ok','fa-bell','Scan des alertes en cours...',2000);
  fetch('/api/direction/scan-alertes',{method:'POST'}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban','Échec du scan des alertes.'); return; }
    pushNotif('ok','fa-bell',j.created+' alerte(s) ajoutée(s) à la file ('+j.skipped+' déjà présente(s) / '+j.scanned+' détectée(s)).',6000);
    if(j.created>0) setTimeout(function(){softReload();},1200);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
// ── Délégation : boutons « Traiter » (jalon) et « œil » (consulter l'objet) ──
var _jt=null;
document.addEventListener('click',function(e){
  var jb=e.target.closest&&e.target.closest('.jt-btn');
  if(jb){ _jt={dom:jb.getAttribute('data-jt-dom'),cat:jb.getAttribute('data-jt-cat'),objet:jb.getAttribute('data-jt-objet'),table:jb.getAttribute('data-jt-table'),id:jb.getAttribute('data-jt-id')};
    var o=document.getElementById('jalon-modal-obj'); if(o)o.textContent=_jt.objet||''; var n=document.getElementById('jalon-note'); if(n)n.value=''; var m=document.getElementById('jalon-modal'); if(m)m.style.display='flex'; return; }
  var se=e.target.closest&&e.target.closest('.src-eye');
  if(se){ consulterSource(se.getAttribute('data-src-table'),se.getAttribute('data-src-id'),se.getAttribute('data-src-type'),se.getAttribute('data-src-objet')); }
});
function jalonCancel(){ var m=document.getElementById('jalon-modal'); if(m)m.style.display='none'; _jt=null; }
function jalonConfirm(){
  if(!_jt) return;
  var note=((document.getElementById('jalon-note')||{}).value||'').trim();
  fetch('/api/direction/jalon-traite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({domaine:_jt.dom,type:_jt.cat,objet:_jt.objet,ref_table:_jt.table,ref_id:_jt.id,commentaire:note})})
    .then(function(r){return r.json();}).then(function(j){ if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Echec.'); return; }
      pushNotif('ok','fa-check','Jalon trace comme traite.',3000); jalonCancel(); setTimeout(function(){softReload();},700); })
    .catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
// ── Consultation d'un objet source (table + id) ──
var SRC_SVC={commandes:'/commercial/service',factures_client:'/compta/service',factures_fournisseur:'/compta/service',non_conformites:'/qualite/service',stock:'/achats/service',credits:'/commercial/service',salaries:'/rh/service',bons_de_commande:'/achats/service',demandes_achat:'/achats/service',offres:'/commercial/service',lots:'/production/service',bons_de_travail:'/production/planning',demandes_travaux:'/commercial/service'};
function srcClose(){ var m=document.getElementById('source-modal'); if(m)m.style.display='none'; }
function consulterSource(table,id,type,objet){
  var m=document.getElementById('source-modal'); if(!m) return;
  document.getElementById('src-title').textContent=type||'Objet';
  document.getElementById('src-sub').textContent=(objet||'')+'  ·  '+table+' / '+id;
  var body=document.getElementById('src-body'); body.textContent='Chargement...';
  var foot=document.getElementById('src-foot'); foot.style.display='none'; foot.innerHTML='';
  m.style.display='flex';
  fetch('/api/direction/source?table='+encodeURIComponent(table)+'&id='+encodeURIComponent(id))
    .then(function(r){return r.json();}).then(function(j){
      body.innerHTML='';
      if(!j||!j.ok||!j.row){ var p=document.createElement('div'); p.style.color='#94a3b8'; p.textContent=(j&&j.error)?j.error:'Objet introuvable (supprime ou non consultable directement).'; body.appendChild(p); return; }
      var row=j.row, tbl=document.createElement('table'); tbl.style.cssText='width:100%;border-collapse:collapse;';
      Object.keys(row).forEach(function(k){ var val=row[k]; if(val===null||val===''||val===undefined) return;
        if(typeof val==='object'){ try{ val=JSON.stringify(val); }catch(err){ val=String(val); } }
        var tr=document.createElement('tr'); tr.style.borderTop='1px solid #f1f5f9';
        var tk=document.createElement('td'); tk.style.cssText='padding:6px 12px 6px 0;color:#6b7280;font-weight:700;font-size:.68rem;text-transform:uppercase;white-space:nowrap;vertical-align:top;'; tk.textContent=k;
        var tv=document.createElement('td'); tv.style.cssText='padding:6px 0;color:#111827;word-break:break-word;'; tv.textContent=String(val);
        tr.appendChild(tk); tr.appendChild(tv); tbl.appendChild(tr); });
      body.appendChild(tbl);
      var link=(table==='commandes'&&row.num_affaire)?('/commercial/affaire/'+encodeURIComponent(row.num_affaire)):(SRC_SVC[table]||'');
      if(link){ var a=document.createElement('a'); a.href=link; a.style.cssText='background:linear-gradient(135deg,#6366f1,#4338ca);color:white;text-decoration:none;padding:8px 16px;border-radius:8px;font-size:.78rem;font-weight:700;'; a.innerHTML='<i class="fas fa-arrow-up-right-from-square" style="margin-right:6px;"></i>Ouvrir dans le service'; foot.appendChild(a); foot.style.display='flex'; }
    }).catch(function(){ body.textContent='Erreur réseau.'; });
}
</script>`
  return layout('Direction Générale', content, 'service-direction')
}
