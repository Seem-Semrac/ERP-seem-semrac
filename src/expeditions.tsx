// ══════════════════════════════════════════════════════════════
// EXPÉDITIONS – Service Expéditions unifié
// Réceptions · Envois · Calendrier · Fournisseurs · Dashboard
// ══════════════════════════════════════════════════════════════
import { escX, layout, serviceHeader, demandeAchatModal, buildValDirMap } from './shared'
import type { BonDeLivraison, BonDeCommande, Commande, DemandeAchat, FournisseurSt } from './types'


const AMB   = '#f59e0b'
const AMB_D = '#d97706'
const TODAY = new Date().toISOString().slice(0, 10)

// ─── Replis : listes vides quand la base ne renvoie rien ──────────────

const BL_CLIENTS_DEFAULT: BonDeLivraison[] = []

const BST_DEFAULT: BonDeLivraison[] = []

// ─── Helpers ──────────────────────────────────────────────────

const TH  = (t: string) => `<th style="text-align:left;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;">${t}</th>`
const THC = (t: string) => `<th style="text-align:center;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;">${t}</th>`
const TD  = (v: string, x = '') => `<td style="padding:8px 12px;font-size:.79rem;color:#374151;border-bottom:1px solid #f8fafc;vertical-align:middle;${x}">${v}</td>`
const TDC = (v: string, x = '') => `<td style="padding:8px 12px;font-size:.79rem;color:#374151;border-bottom:1px solid #f8fafc;vertical-align:middle;text-align:center;${x}">${v}</td>`

function badge(bg: string, col: string, txt: string) {
  return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:.68rem;font-weight:700;background:${bg};color:${col};">${txt}</span>`
}

function blStatutBadge(s: string) {
  const m: Record<string,[string,string,string]> = {
    a_envoyer: ['#dbeafe','#1d4ed8','A envoyer'],
    prepare:   ['#fef3c7','#92400e','Prepare'],
    expedie:   ['#fed7aa','#9a3412','Expedie'],
    en_transit:['#cffafe','#0e7490','En transit'],
    recu:      ['#dcfce7','#15803d','Recu retour'],
    livre:     ['#dcfce7','#15803d','Livre OK'],
  }
  const v = m[s] ?? ['#f1f5f9','#6b7280', s]
  return badge(v[0], v[1], v[2])
}

function bcStatutBadge(s: string) {
  const m: Record<string,[string,string,string]> = {
    brouillon:   ['#f1f5f9','#6b7280','Brouillon'],
    en_attente:  ['#fef3c7','#92400e','En attente'],
    envoye:      ['#fef3c7','#92400e','En attente'],
    confirme:    ['#fef3c7','#92400e','Confirmé'],
    accuse:      ['#dbeafe','#1d4ed8','Accusé'],
    receptionne: ['#cffafe','#0e7490','Réceptionné'],
    recu_partiel:['#cffafe','#0e7490','Réceptionné'],
    recu:        ['#dcfce7','#15803d','PV → Qualité'],
    controle:    ['#dcfce7','#15803d','PV → Qualité'],
    cloture:     ['#f1f5f9','#475569','Clôturé'],
  }
  const v = m[s] ?? ['#f1f5f9','#6b7280', s]
  return badge(v[0], v[1], v[2])
}

function kpiCard(icon: string, col: string, val: string|number, lbl: string, sub = '') {
  return `<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${col};">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div style="width:36px;height:36px;border-radius:10px;background:${col}18;display:flex;align-items:center;justify-content:center;">
        <i class="fas ${icon}" style="color:${col};font-size:.9rem;"></i>
      </div>
      <div style="font-size:1.5rem;font-weight:900;color:#111827;">${val}</div>
    </div>
    <div style="font-size:.75rem;font-weight:700;color:#374151;">${lbl}</div>
    ${sub ? `<div style="font-size:.68rem;color:#9ca3af;margin-top:2px;">${sub}</div>` : ''}
  </div>`
}

// Numéro AFFICHÉ d'un bon de livraison. La renumérotation par affaire écrit `num_bl`
// (migration 002) sans toucher à l'identifiant technique, qui porte les rattachements.
// Fail-soft : sans cette colonne, on retombe sur l'identifiant — qui EST déjà le bon
// numéro pour tout BL créé depuis la nouvelle numérotation.
const numBL = (b: any) => String(b?.num_bl || b?.id || '')

// Une echeance est en retard si elle est ANTERIEURE au jour de la requete. Comparaison
// sur les 10 premiers caracteres (AAAA-MM-JJ) : pas de Date, donc pas de fuseau qui
// ferait basculer une echeance du soir dans la veille.
const enRetardExp = (d: any, today: string) => !!d && String(d).slice(0, 10) < String(today)

// ══════════════════════════════════════════════════════════════
// PANEL 4 – DASHBOARD EXPÉDITIONS
// ══════════════════════════════════════════════════════════════

function panelDashboard(bls: BonDeLivraison[], bsts: BonDeLivraison[], bcs: BonDeCommande[], cmds: Commande[]) {
  const blAEnvoyer  = bls.filter(b => b.statut === 'a_envoyer').length
  const bstTransit  = bsts.filter(b => b.statut === 'en_transit').length
  const bstAujourd  = bsts.filter(b => b.statut === 'a_envoyer').length
  const bcEnCours   = bcs.filter(b => b.statut !== 'recu' && b.statut !== 'cloture').length
  const cmdsRetard  = cmds.filter(c => c.retard).length
  const blLivres    = bls.filter(b => b.statut === 'livre')
  const otdOK       = blLivres.filter(b => b.otd && b.otd <= b.date_bl).length
  const otdRate     = blLivres.length > 0 ? Math.round(otdOK / blLivres.length * 100) : 100
  const montantBC   = bcs.filter(b=>b.statut==='confirme'||b.statut==='envoye').reduce((s,b)=>s+(b.montant??0),0)

  const recentActivity = [
    ...bls.slice(0,3).map(b => ({ icon:'fa-truck-loading', col:AMB, txt:`BL ${b.id} – ${b.client_nom} – ${b.statut}`, date:b.date_bl })),
    ...bsts.slice(0,2).map(b => ({ icon:'fa-exchange-alt', col:'#0891b2', txt:`BST ${b.id} – ${b.client_nom} – ${b.statut}`, date:b.date_bl })),
    ...bcs.slice(0,2).map(b => ({ icon:'fa-file-contract', col:'#8b5cf6', txt:`BC ${b.id} – ${b.fournisseur} – ${b.statut}`, date:b.date_bc })),
  ].sort((a,b) => b.date.localeCompare(a.date)).slice(0,7)

  return `
  <div id="exp-panel-dashboard" style="display:none;">
    <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;margin-bottom:16px;">
      <i class="fas fa-tachometer-alt" style="color:${AMB};"></i>Dashboard Expeditions
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${kpiCard('fa-truck-loading',AMB, blAEnvoyer, 'BL a envoyer', 'En attente expedition')}
      ${kpiCard('fa-exchange-alt','#0891b2', bstTransit + bstAujourd, 'BST actifs', `${bstAujourd} a preparer aujourd&#39;hui`)}
      ${kpiCard('fa-file-contract','#8b5cf6', bcEnCours, 'BC en cours', `${montantBC.toLocaleString('fr-FR')} EUR engages`)}
      ${kpiCard('fa-check-circle','#22c55e', otdRate+'%', 'OTD', `${blLivres.length} livraisons analysees`)}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
        <div style="font-weight:800;color:#111827;margin-bottom:16px;font-size:.88rem;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-chart-bar" style="color:${AMB};"></i>Alertes & Priorites
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${cmdsRetard > 0 ? `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:#fee2e2;border-left:3px solid #ef4444;">
            <i class="fas fa-exclamation-circle" style="color:#b91c1c;"></i>
            <span style="font-size:.79rem;color:#b91c1c;font-weight:700;">${cmdsRetard} commande(s) client en retard de production</span>
          </div>` : ''}
          ${bstAujourd > 0 ? `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:#fffbeb;border-left:3px solid ${AMB};">
            <i class="fas fa-calendar-day" style="color:${AMB_D};"></i>
            <span style="font-size:.79rem;color:${AMB_D};font-weight:700;">${bstAujourd} BST a preparer et envoyer aujourd&#39;hui</span>
          </div>` : ''}
          ${blAEnvoyer > 0 ? `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:#eff6ff;border-left:3px solid #3b82f6;">
            <i class="fas fa-truck-loading" style="color:#1d4ed8;"></i>
            <span style="font-size:.79rem;color:#1d4ed8;font-weight:700;">${blAEnvoyer} BL client(s) en attente d&#39;expedition</span>
          </div>` : ''}
          ${cmdsRetard === 0 && bstAujourd === 0 && blAEnvoyer === 0 ? `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:#f0fdf4;">
            <i class="fas fa-check-circle" style="color:#15803d;"></i>
            <span style="font-size:.79rem;color:#15803d;font-weight:700;">Aucune alerte. Tout est a jour.</span>
          </div>` : ''}
        </div>
      </div>

      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
        <div style="font-weight:800;color:#111827;margin-bottom:16px;font-size:.88rem;display:flex;align-items:center;gap:8px;">
          <i class="fas fa-history" style="color:#6b7280;"></i>Activite recente
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${recentActivity.map(a => `
          <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f8fafc;">
            <div style="width:28px;height:28px;border-radius:8px;background:${a.col}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <i class="fas ${a.icon}" style="color:${a.col};font-size:.7rem;"></i>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:.75rem;color:#374151;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escX(a.txt)}</div>
              <div style="font-size:.68rem;color:#9ca3af;">${a.date}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
      <div style="font-weight:800;color:#111827;margin-bottom:16px;font-size:.88rem;">OTD par client (BL livres)</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">
        ${[...new Set(blLivres.map(b=>b.client_nom??''))].filter(Boolean).map(client => {
          const clientBLs = blLivres.filter(b=>b.client_nom===client)
          const clientOK  = clientBLs.filter(b=>b.otd&&b.otd<=b.date_bl).length
          const pct = Math.round(clientOK/clientBLs.length*100)
          return `<div style="padding:12px;border-radius:10px;background:#f8fafc;border:1px solid #f1f5f9;">
            <div style="font-size:.75rem;font-weight:700;color:#374151;margin-bottom:6px;">${escX(client)}</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="flex:1;height:6px;background:#e2e8f0;border-radius:999px;"><div style="height:100%;background:${pct>=95?'#22c55e':pct>=85?AMB:'#ef4444'};border-radius:999px;width:${pct}%;"></div></div>
              <span style="font-size:.72rem;font-weight:800;color:${pct>=95?'#15803d':pct>=85?AMB_D:'#b91c1c'};">${pct}%</span>
            </div>
            <div style="font-size:.65rem;color:#9ca3af;margin-top:3px;">${clientBLs.length} BL analyse(s)</div>
          </div>`
        }).join('')}
      </div>
    </div>
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// ORCHESTRATION EN 3 TEMPS (demande utilisateur 2026-08-18) :
//   1) RÉCEPTIONS — tout ce qui ARRIVE   : fournisseurs, retours de sous-traitance, retours clients
//   2) ENVOIS     — tout ce qui PART     : sous-traitance, commandes clients
//   3) CALENDRIER — arrivées + départs sur une même frise, puis le détail du JOUR
// Les trois vues lisent les MÊMES tables (bons_de_commande, bons_de_livraison,
// bons_sous_traitance, commandes, non_conformites) : une réception enregistrée ici
// se voit immédiatement dans le calendrier et dans le dashboard.
// ══════════════════════════════════════════════════════════════

// Un « mouvement » = une ligne de flux, quelle que soit son origine. C'est le socle
// commun des 3 onglets : le calendrier n'est qu'une projection de ces mouvements.
type Mvt = {
  sens: 'in' | 'out'          // in = arrive chez nous · out = part de chez nous
  kind: 'bc' | 'bds_retour' | 'retour_client' | 'bds_envoi' | 'bl_client'
  id: string
  ref: string                 // n° affiché (BC, BDS, BL, NC)
  tiers: string               // fournisseur, sous-traitant ou client
  objet: string               // articles / pièce / opération
  date: string | null         // date prévue (ou réelle si déjà fait)
  datePrevue: string | null
  dateReelle: string | null
  fait: boolean
  statut: string
  qte?: number | null
  cmd?: string | null         // commande client rattachée
}

const _d10 = (v: any) => (v ? String(v).slice(0, 10) : null)
const _frDate = (s: any) => { const p = String(s || '').slice(0, 10).split('-'); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : '—' }
const _bcRecu = (b: any) => ['recu_partiel', 'recu_total', 'recu', 'controle', 'cloture'].includes(String(b.statut)) || !!b.bl_id

// Construit TOUS les mouvements à partir des tables réelles. Utilisé par les 3 onglets.
function collecterMouvements(bcs: any[], bds: any[], blsClient: any[], blsRetour: any[], ncs: any[], cmds: any[]): Mvt[] {
  const out: Mvt[] = []

  // ── ARRIVÉES ──
  for (const b of bcs || []) {
    if (String(b.statut) === 'annule') continue
    const prevue = _d10(b.date_livraison_prevue), reelle = _d10(b.date_reception_reelle)
    out.push({
      sens: 'in', kind: 'bc', id: String(b.id), ref: b.num_bc || b.id,
      tiers: b.fournisseur || '—', objet: b.articles || '—',
      date: reelle || prevue, datePrevue: prevue, dateReelle: reelle,
      fait: _bcRecu(b), statut: b.statut || 'en_attente', qte: b.qte_commandee ?? null,
    })
  }
  for (const s of bds || []) {   // retour de sous-traitance = une arrivée
    if (['annule', 'annulé'].includes(String(s.statut))) continue
    const prevue = _d10(s.date_retour_prevue), reelle = _d10(s.date_retour_effective)
    if (!prevue && !reelle) continue
    out.push({
      sens: 'in', kind: 'bds_retour', id: String(s.id), ref: s.id, tiers: s.sous_traitant_nom || s.sous_traitant_id || '—',
      objet: [s.operation, s.piece].filter(Boolean).join(' · ') || '—',
      date: reelle || prevue, datePrevue: prevue, dateReelle: reelle,
      fait: !!reelle || ['recu', 'termine', 'cloture'].includes(String(s.statut)),
      statut: s.statut || 'envoye', qte: s.qte ?? null, cmd: s.cmd_ref || s.cmd_id || null,
    })
  }
  // Retours clients : annoncés par la Qualité sur la non-conformité, reçus via un BL de retour
  for (const n of ncs || []) {
    if (n.retour_attendu !== true) continue
    if (String(n.retour_statut || '') === 'annule') continue
    const prevue = _d10(n.date_retour_prevue), reelle = _d10(n.date_retour_reelle)
    out.push({
      sens: 'in', kind: 'retour_client', id: String(n.id), ref: String(n.id), tiers: n.client_nom || '—',
      objet: [n.ref_article, n.designation].filter(Boolean).join(' · ') || n.lot_ref || '—',
      date: reelle || prevue, datePrevue: prevue, dateReelle: reelle,
      fait: String(n.retour_statut || '') === 'recu' || !!n.bl_retour_id,
      statut: n.retour_statut || 'attendu',
      qte: n.qte_retour_attendue ?? n.nb_pieces ?? null, cmd: n.n_commande || null,
    })
  }

  // ── DÉPARTS ──
  for (const s of bds || []) {   // envoi chez le sous-traitant
    if (['annule', 'annulé'].includes(String(s.statut))) continue
    const prevue = _d10(s.date_envoi) || _d10(s.date_debut)
    if (!prevue) continue
    out.push({
      sens: 'out', kind: 'bds_envoi', id: String(s.id), ref: s.id, tiers: s.sous_traitant_nom || s.sous_traitant_id || '—',
      objet: [s.operation, s.piece].filter(Boolean).join(' · ') || '—',
      date: prevue, datePrevue: prevue, dateReelle: null,
      fait: !['a_envoyer', 'a_planifier', 'planifie'].includes(String(s.statut)),
      statut: s.statut || 'a_envoyer', qte: s.qte ?? null, cmd: s.cmd_ref || s.cmd_id || null,
    })
  }
  for (const b of blsClient || []) {   // livraison client
    const prevue = _d10(b.date_envoi_prevu) || _d10(b.date_bl)
    out.push({
      sens: 'out', kind: 'bl_client', id: String(b.id), ref: b.id, tiers: b.client_nom || '—',
      objet: b.piece || '—', date: prevue, datePrevue: prevue,
      dateReelle: ['expedie', 'livre'].includes(String(b.statut)) ? _d10(b.date_bl) : null,
      fait: ['expedie', 'livre'].includes(String(b.statut)), statut: b.statut || 'a_envoyer',
      qte: b.qte ?? null, cmd: b.cmd_id || null,
    })
  }
  return out
}

const MVT_LOOK: Record<string, [string, string, string]> = {
  bc:            ['#fef3c7', '#92400e', 'Fournisseur'],
  bds_retour:    ['#ede9fe', '#5b21b6', 'Retour ST'],
  retour_client: ['#fee2e2', '#b91c1c', 'Retour client'],
  bds_envoi:     ['#e0e7ff', '#3730a3', 'Vers ST'],
  bl_client:     ['#dcfce7', '#15803d', 'Client'],
}

// ══════════════════════════════════════════════════════════════
// ONGLET 1 — RÉCEPTIONS (ce qui arrive)
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// ONGLET — RÉCEPTIONS : ce qui est DÉJÀ ARRIVÉ
//   Trois familles : fournisseur, sous-traitance, retour client. Une ligne y entre au
//   moment de la réception, et c'est de là qu'on remplit le PV de contrôle.
//   ⚠ Les files « à réceptionner » ne sont plus ici : elles vivent dans le CALENDRIER
//     (demande utilisateur du 10/09/2026). La validation fournisseur, elle, est passée
//     dans Achats › Bons de commande : c'est un acte d'achat, pas d'expédition.
// ══════════════════════════════════════════════════════════════
function panelReceptions(bcs: any[], _bcsAttendus: any[], receptions: any[], bds: any[], _ncs: any[], blsRetour: any[], _vdMap: Record<string, any>, _hasAck: boolean, today: string) {
  const tr = (cells: string[]) => `<tr style="border-bottom:1px solid #f8fafc;">${cells.join('')}</tr>`
  const vide = (n: number, txt: string) => `<tr><td colspan="${n}" style="text-align:center;padding:22px;color:#9ca3af;font-size:.8rem;">${txt}</td></tr>`
  const card = (titre: string, icone: string, coul: string, cpt: number, sous: string, corps: string) => `
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:18px;border-top:3px solid ${coul};">
      <div style="padding:12px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-weight:800;color:#111827;font-size:.9rem;"><i class="fas ${icone}" style="color:${coul};margin-right:7px;"></i>${titre}</span>
        <span style="background:${coul}1a;color:${coul};border-radius:999px;padding:1px 9px;font-size:.68rem;font-weight:800;">${cpt}</span>
        <span style="font-size:.7rem;color:#94a3b8;">${sous}</span>
      </div>
      <div style="overflow-x:auto;">${corps}</div>
    </div>`
  const H = (cols: string[]) => `<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;">${cols.map(c => c.startsWith('#') ? THC(c.slice(1)) : TH(c)).join('')}</tr></thead><tbody>`

  // Fournisseur ou sous-traitant ? La réponse est portée par le BC d'origine.
  const typeParBc: Record<string, string> = {}
  ;(bcs || []).forEach((b: any) => { typeParBc[String(b.id)] = String(b.type || 'fournisseur') })
  const estSt = (b: any) => typeParBc[String(b.bc_id ?? '')] === 'st'

  const ligneRecue = (b: any, couleur: string) => tr([
    TD(`<div style="font-weight:700;color:${couleur};">${escX(numBL(b))}</div><div style="font-size:.65rem;color:#94a3b8;">${escX(b.bc_id ?? b.cmd_id ?? '')}</div>`),
    TD(escX(b.client_nom ?? b.fournisseur_nom ?? '—')),
    TD(`<span style="font-size:.75rem;color:#475569;">${escX(b.piece ?? b.operation ?? '—')}</span>`),
    TDC(`<span style="font-weight:700;">${_frDate(b.date_bl)}</span>`),
    TDC(`<span style="font-weight:700;">${b.qte ?? '—'}</span>`),
    TDC(b.bc_id
      ? `<button onclick="expOpenPV('${escX(b.bc_id)}')" title="Remplir le PV de contrôle de cette réception" style="background:#fef2f2;color:#b91c1c;border:none;border-radius:7px;padding:5px 10px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-clipboard-check" style="margin-right:4px;"></i>PV de contrôle</button>`
      : '<span style="color:#cbd5e1;font-size:.7rem;">—</span>'),
  ])

  const parDate = (a: any, b: any) => String(b.date_bl || '').localeCompare(String(a.date_bl || ''))
  const recFourn = (receptions || []).filter((b: any) => !estSt(b)).sort(parDate)
  const recSt    = (receptions || []).filter((b: any) => estSt(b)).sort(parDate)
  const recCli   = [...(blsRetour || [])].sort(parDate)

  // Retours de sous-traitance déjà rentrés : ils n'ont pas de BL, on lit le BDS lui-même.
  const bdsRevenus = (bds || []).filter((s: any) => ['recu', 'termine', 'cloture'].includes(String(s.statut || '')))
  const rowsBdsRevenus = bdsRevenus.map((s: any) => tr([
    TD(`<div style="font-weight:700;color:#5b21b6;">${escX(s.id)}</div><div style="font-size:.65rem;color:#94a3b8;">${escX(s.lot_ref ?? s.cmd_ref ?? '')}</div>`),
    TD(escX(s.sous_traitant_nom ?? s.sous_traitant_id ?? '—')),
    TD(`<span style="font-size:.75rem;color:#475569;">${escX([s.operation, s.piece].filter(Boolean).join(' · ') || '—')}</span>`),
    TDC(`<span style="font-weight:700;">${_frDate(s.date_retour ?? s.date_retour_prevu)}</span>`),
    TDC(`<span style="font-weight:700;">${s.qte ?? '—'}</span>`),
    TDC(s.bc_id
      ? `<button onclick="expOpenPV('${escX(s.bc_id)}')" title="Remplir le PV de contrôle de ce retour" style="background:#fef2f2;color:#b91c1c;border:none;border-radius:7px;padding:5px 10px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-clipboard-check" style="margin-right:4px;"></i>PV de contrôle</button>`
      : '<span style="color:#cbd5e1;font-size:.7rem;">—</span>'),
  ])).join('')

  const COLS = ['N° BL', 'Fournisseur / Client', 'Pièce / Articles', '#Reçu le', '#Qté', '#Contrôle']

  return `
  <div id="exp-panel-receptions" style="display:none;">
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 16px;margin-bottom:18px;font-size:.8rem;color:#1d4ed8;">
      <i class="fas fa-clipboard-check" style="margin-right:7px;"></i><strong>Ce qui est arrivé</strong> — une ligne entre ici au moment de la réception, et c'est d'ici qu'on remplit le <strong>PV de contrôle</strong>. Ce qui reste attendu est dans l'onglet <strong>Calendrier</strong>.
    </div>

    ${card('Fournisseur', 'fa-truck-ramp-box', '#0ea5e9', recFourn.length, 'matière et fournitures réceptionnées',
      H(COLS) + (recFourn.map((b: any) => ligneRecue(b, '#0369a1')).join('') || vide(6, 'Aucune réception fournisseur')) + '</tbody></table>')}

    ${card('Sous-traitance', 'fa-rotate-left', '#8b5cf6', recSt.length + bdsRevenus.length, 'pièces revenues de sous-traitance',
      H(COLS) + (recSt.map((b: any) => ligneRecue(b, '#5b21b6')).join('') + rowsBdsRevenus || vide(6, 'Aucun retour de sous-traitance')) + '</tbody></table>')}

    ${card('Retour client', 'fa-box-open', '#ef4444', recCli.length, 'pièces renvoyées par un client (non-conformité)',
      H(COLS) + (recCli.map((b: any) => ligneRecue(b, '#b91c1c')).join('') || vide(6, 'Aucun retour client reçu')) + '</tbody></table>')}
  </div>`
}

// ══════════════════════════════════════════════════════════════
// ONGLET — ENVOIS : ce qu'on aura à faire partir
//   Volontairement PROSPECTIF : on liste les commandes EN COURS (au minimum passées en
//   programmation) pour voir venir la charge d'expédition, en deux familles — ce qui part
//   chez le CLIENT, et ce qui part en SOUS-TRAITANCE.
//   ⚠ Les files « à envoyer aujourd'hui » ne sont plus ici : elles vivent dans le
//     CALENDRIER, qui est l'écran des échéances (demande utilisateur du 10/09/2026).
// ══════════════════════════════════════════════════════════════
function panelEnvois(bds: any[], blsClient: any[], cmds: any[], qualiteBloque: (c: any) => string | null, today: string) {
  const tr = (cells: string[]) => `<tr style="border-bottom:1px solid #f8fafc;">${cells.join('')}</tr>`
  const vide = (n: number, txt: string) => `<tr><td colspan="${n}" style="text-align:center;padding:22px;color:#9ca3af;font-size:.8rem;">${txt}</td></tr>`
  const card = (titre: string, icone: string, coul: string, cpt: number, sous: string, corps: string) => `
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:18px;border-top:3px solid ${coul};">
      <div style="padding:12px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-weight:800;color:#111827;font-size:.9rem;"><i class="fas ${icone}" style="color:${coul};margin-right:7px;"></i>${titre}</span>
        <span style="background:${coul}1a;color:${coul};border-radius:999px;padding:1px 9px;font-size:.68rem;font-weight:800;">${cpt}</span>
        <span style="font-size:.7rem;color:#94a3b8;">${sous}</span>
      </div>
      <div style="overflow-x:auto;">${corps}</div>
    </div>`
  const H = (cols: string[]) => `<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;">${cols.map(c => c.startsWith('#') ? THC(c.slice(1)) : TH(c)).join('')}</tr></thead><tbody>`

  // « Au minimum en programmation » : on écarte ce qui n'est pas encore lancé (nomenclature
  // en attente, brouillon) et ce qui est sorti du circuit (livrée, annulée).
  const HORS_COURS = ['livree', 'livre', 'annulee', 'annule', 'en_attente_nomenclature', 'brouillon']
  const cmdsEnCours = (cmds || []).filter((c: any) => !HORS_COURS.includes(String(c.statut || '')))

  // Un BL déjà préparé signale que l'expédition est engagée : on le montre sur la ligne.
  const blParCmd: Record<string, any> = {}
  ;(blsClient || []).forEach((b: any) => {
    if (String(b.statut || '') === 'annule') return
    const k = String(b.cmd_id ?? b.cmd_ref ?? '')
    if (k && !blParCmd[k]) blParCmd[k] = b
  })

  const rowsClient = cmdsEnCours.map((c: any) => {
    const bloc = qualiteBloque(c)
    const tot = Number(c.bdt_total) || 0
    const fait = Number(c.bdt_soldes) || 0
    const pct = tot ? Math.round((fait / tot) * 100) : 0
    const bl = blParCmd[String(c.id)] || blParCmd[String(c.num_affaire ?? '')]
    const prete = tot > 0 && fait === tot
    return tr([
      TD(`<div style="font-weight:700;color:#111827;">${escX(c.num_affaire ?? c.id)}</div>${bl ? `<div style="font-size:.64rem;color:#0369a1;">BL ${escX(numBL(bl))}</div>` : ''}`),
      TD(escX(c.client_nom ?? '—')),
      TD(`<span style="font-size:.75rem;color:#475569;">${escX(c.piece ?? c.designation ?? '—')}</span>`),
      TDC(tot
        ? `<div style="display:flex;align-items:center;gap:6px;justify-content:center;"><div style="width:56px;height:6px;background:#f1f5f9;border-radius:999px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${pct === 100 ? '#22c55e' : '#0ea5e9'};"></div></div><span style="font-size:.68rem;font-weight:700;color:#64748b;">${fait}/${tot}</span></div>`
        : '<span style="color:#cbd5e1;font-size:.7rem;">pas de BDT</span>'),
      TDC(`<span style="font-size:.72rem;color:${enRetardExp(c.date_liv ?? c.date_livraison, today) ? '#b91c1c' : '#64748b'};font-weight:${enRetardExp(c.date_liv ?? c.date_livraison, today) ? '700' : '400'};">${_frDate(c.date_liv ?? c.date_livraison)}</span>`),
      TDC(bloc
        ? `<span style="background:#fee2e2;color:#b91c1c;border-radius:999px;padding:2px 9px;font-size:.66rem;font-weight:700;"><i class="fas fa-lock" style="margin-right:4px;"></i>${escX(bloc)}</span>`
        : prete
          ? '<span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 9px;font-size:.66rem;font-weight:700;">Prête à expédier</span>'
          : '<span style="background:#e0f2fe;color:#0369a1;border-radius:999px;padding:2px 9px;font-size:.66rem;font-weight:700;">En production</span>'),
    ])
  }).join('')

  // Sous-traitance : tout ce qui n'est pas encore revenu est « à venir » côté envoi.
  const bdsEnCours = (bds || []).filter((s: any) => !['recu', 'termine', 'cloture', 'annule'].includes(String(s.statut || '')))
  const rowsSt = bdsEnCours.map((s: any) => tr([
    TD(`<div style="font-weight:700;color:#3730a3;">${escX(s.id)}</div><div style="font-size:.65rem;color:#94a3b8;">${escX(s.lot_ref ?? s.cmd_ref ?? '')}</div>`),
    TD(escX(s.sous_traitant_nom ?? s.sous_traitant_id ?? '— à affecter')),
    TD(`<span style="font-size:.75rem;color:#475569;">${escX([s.operation, s.piece].filter(Boolean).join(' · ') || '—')}</span>`),
    TDC(`<span style="font-weight:700;">${s.qte ?? '—'}</span>`),
    TDC(s.date_envoi
      ? `<span style="font-weight:700;color:${enRetardExp(s.date_envoi, today) ? '#b91c1c' : '#334155'};">${_frDate(s.date_envoi)}</span>`
      : '<span style="color:#cbd5e1;">à planifier</span>'),
    TDC(blStatutBadge(s.statut)),
  ])).join('')

  return `
  <div id="exp-panel-envois" style="display:none;">
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:10px 16px;margin-bottom:18px;font-size:.8rem;color:#047857;">
      <i class="fas fa-paper-plane" style="margin-right:7px;"></i><strong>Ce qui va partir</strong> — les commandes en cours, dès qu'elles sont passées en programmation, pour voir venir la charge d'expédition. Les échéances du jour et de la semaine sont dans l'onglet <strong>Calendrier</strong>.
    </div>

    ${card('Client', 'fa-truck-fast', '#16a34a', cmdsEnCours.length, 'commandes en cours — ce qu\'on aura à livrer',
      H(['N° affaire', 'Client', 'Pièce', '#Avancement', '#Livraison prévue', '#État']) + (rowsClient || vide(6, 'Aucune commande en cours')) + '</tbody></table>')}

    ${card('Sous-traitance', 'fa-arrow-right-arrow-left', '#4f46e5', bdsEnCours.length, 'pièces à faire partir chez un sous-traitant',
      H(['N° BDS', 'Sous-traitant', 'Opération / Pièce', '#Qté', '#Envoi prévu', '#Statut']) + (rowsSt || vide(6, 'Aucune sous-traitance en cours')) + '</tbody></table>')}
  </div>`
}

function panelCalendrier(mvts: Mvt[], today: string) {
  const dISO = (s: string) => new Date(String(s).slice(0, 10) + 'T00:00:00Z')
  const isoOf = (d: Date) => d.toISOString().slice(0, 10)
  const addDays = (s: string, n: number) => { const d = dISO(s); d.setUTCDate(d.getUTCDate() + n); return isoOf(d) }
  const diffDays = (a: string, b: string) => Math.round((dISO(b).getTime() - dISO(a).getTime()) / 86400000)
  const dow = (s: string) => (dISO(s).getUTCDay() + 6) % 7

  const avecDate = mvts.filter(m => !!m.date)
  // Fenêtre : 2 semaines en arrière → 8 semaines en avant, bornée aux mouvements réels
  let start = addDays(today, -14), end = addDays(today, 56)
  for (const m of avecDate) { const d = m.date as string; if (d < start) start = d < addDays(today, -60) ? addDays(today, -60) : d; if (d > end) end = d > addDays(today, 180) ? addDays(today, 180) : d }
  start = addDays(start, -dow(start)); end = addDays(end, 6 - dow(end))
  const totalDays = Math.max(14, diffDays(start, end))
  const PX = 16, LABW = 190, width = totalDays * PX
  const leftOf = (s: string) => Math.max(0, Math.min(totalDays, diffDays(start, s))) * PX

  // Deux lignes : ARRIVÉES et DÉPARTS (lecture immédiate du sens du flux)
  const lane = (sens: 'in' | 'out', titre: string, icone: string, coul: string) => {
    const items = avecDate.filter(m => m.sens === sens)
    const marks = items.map(m => {
      const look = MVT_LOOK[m.kind]
      const retard = !m.fait && (m.date as string) < today
      const bg = m.fait ? '#f1f5f9' : (retard ? '#fee2e2' : look[0])
      const bd = m.fait ? '#cbd5e1' : (retard ? '#dc2626' : look[1])
      const co = m.fait ? '#64748b' : (retard ? '#b91c1c' : look[1])
      return `<div class="mvt-mk" data-mvt="${escX(m.kind)}:${escX(m.id)}" title="${escX(look[2] + ' · ' + m.ref + ' · ' + m.tiers + ' · ' + _frDate(m.date))}"
        style="position:absolute;left:${leftOf(m.date as string)}px;top:6px;background:${bg};border:1.5px solid ${bd};color:${co};border-radius:7px;padding:2px 7px;font-size:.63rem;font-weight:700;white-space:nowrap;cursor:pointer;z-index:3;${m.fait ? 'opacity:.75;text-decoration:line-through;' : ''}">${escX(m.ref)}</div>`
    }).join('')
    return `<div style="display:flex;border-top:1px solid #f1f5f9;">
      <div style="width:${LABW}px;flex:none;position:sticky;left:0;background:#fff;z-index:4;padding:9px 12px;border-right:1px solid #e2e8f0;">
        <div style="font-weight:800;color:${coul};font-size:.8rem;"><i class="fas ${icone}" style="margin-right:6px;"></i>${titre}</div>
        <div style="font-size:.62rem;color:#94a3b8;margin-top:2px;">${items.length} mouvement(s)</div>
      </div>
      <div style="position:relative;width:${width}px;height:42px;flex:none;">${marks}</div>
    </div>`
  }

  let semaines = ''
  for (let d = start; d <= end; d = addDays(d, 7)) {
    semaines += `<div style="position:absolute;left:${leftOf(d)}px;top:0;bottom:0;border-left:1px solid #eef2f7;"></div>`
      + `<div style="position:absolute;left:${leftOf(d) + 4}px;top:5px;font-size:.6rem;color:#94a3b8;font-family:monospace;white-space:nowrap;">${_frDate(d).slice(0, 5)}</div>`
  }
  const ligneAuj = (today >= start && today <= end)
    ? `<div style="position:absolute;left:${leftOf(today)}px;top:0;bottom:0;width:2px;background:#ef4444;z-index:1;"></div><div style="position:absolute;left:${leftOf(today) + 3}px;top:5px;font-size:.58rem;color:#ef4444;font-weight:800;">auj.</div>`
    : ''

  // ── Détail du JOUR ──
  const duJour = (sens: 'in' | 'out') => mvts.filter(m => m.sens === sens && !m.fait && m.date && (m.date as string) <= today)
  const jourIn = duJour('in'), jourOut = duJour('out')
  const ligneJour = (m: Mvt) => {
    const look = MVT_LOOK[m.kind]
    const retard = (m.date as string) < today
    const act = m.kind === 'bc' ? `expOpenReception('${escX(m.id)}')`
      : m.kind === 'bds_retour' ? `expRetourBds('${escX(m.id)}')`
      : m.kind === 'retour_client' ? `expOpenRetourClient('${escX(m.id)}')`
      : m.kind === 'bds_envoi' ? `expEnvoyerBds('${escX(m.id)}')`
      : ''
    return `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid #f8fafc;flex-wrap:wrap;">
      <span style="background:${look[0]};color:${look[1]};border-radius:999px;padding:2px 9px;font-size:.63rem;font-weight:800;flex:none;">${look[2]}</span>
      <span style="font-weight:700;color:#111827;font-size:.8rem;">${escX(m.ref)}</span>
      <span style="font-size:.76rem;color:#475569;">${escX(m.tiers)}</span>
      <span style="font-size:.72rem;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:230px;">${escX(m.objet)}</span>
      ${retard ? `<span style="background:#fee2e2;color:#b91c1c;border-radius:999px;padding:1px 8px;font-size:.62rem;font-weight:800;">en retard — ${_frDate(m.date)}</span>` : ''}
      ${act ? `<button onclick="${act}" style="margin-left:auto;background:#0f172a;color:white;border:none;border-radius:7px;padding:5px 12px;font-size:.68rem;font-weight:700;cursor:pointer;">Traiter</button>` : ''}
    </div>`
  }
  const bloc = (titre: string, icone: string, coul: string, items: Mvt[], vide: string) => `
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;border-top:3px solid ${coul};">
      <div style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:800;color:#111827;font-size:.88rem;">
        <i class="fas ${icone}" style="color:${coul};margin-right:7px;"></i>${titre}
        <span style="background:${coul}1a;color:${coul};border-radius:999px;padding:1px 9px;font-size:.68rem;margin-left:7px;">${items.length}</span>
      </div>
      ${items.length ? items.map(ligneJour).join('') : `<div style="text-align:center;padding:22px;color:#9ca3af;font-size:.8rem;">${vide}</div>`}
    </div>`

  return `
  <div id="exp-panel-calendrier" style="display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;"><i class="fas fa-calendar-days" style="color:${AMB};margin-right:8px;"></i>Calendrier des flux <span style="font-weight:500;color:#94a3b8;font-size:.82rem;">arrivées &amp; départs</span></div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:.7rem;color:#64748b;align-items:center;">
        ${Object.keys(MVT_LOOK).map(k => `<span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:11px;height:11px;border-radius:3px;background:${MVT_LOOK[k][0]};border:1.5px solid ${MVT_LOOK[k][1]};"></span>${MVT_LOOK[k][2]}</span>`).join('')}
      </div>
    </div>

    ${avecDate.length === 0
      ? `<div style="text-align:center;padding:40px;color:#9ca3af;font-size:.85rem;background:#f8fafc;border-radius:12px;margin-bottom:18px;">Aucun mouvement daté à afficher. Les dates viennent des commandes fournisseurs (arrivée prévue), des bons de sous-traitance (envoi / retour) et des bons de livraison.</div>`
      : `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:20px;">
      <div style="overflow-x:auto;"><div style="min-width:${LABW + width}px;">
        <div style="display:flex;border-bottom:2px solid #f1f5f9;background:#fafafa;">
          <div style="width:${LABW}px;flex:none;position:sticky;left:0;background:#fafafa;z-index:5;padding:6px 12px;font-size:.62rem;font-weight:800;color:#64748b;border-right:1px solid #e2e8f0;text-transform:uppercase;">Sens du flux</div>
          <div style="position:relative;width:${width}px;height:24px;flex:none;">${semaines}${ligneAuj}</div>
        </div>
        ${lane('in', 'Arrivées', 'fa-arrow-down', '#0ea5e9')}
        ${lane('out', 'Départs', 'fa-arrow-up', '#16a34a')}
      </div></div>
    </div>`}

    <div style="font-size:.92rem;font-weight:800;color:#111827;margin-bottom:12px;"><i class="fas fa-bolt" style="color:${AMB};margin-right:7px;"></i>Aujourd'hui — ${_frDate(today)}<span style="font-weight:500;color:#94a3b8;font-size:.78rem;margin-left:8px;">ce qui doit être réceptionné et envoyé (retards inclus)</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;">
      ${bloc('À réceptionner', 'fa-dolly', '#0ea5e9', jourIn, 'Rien à réceptionner ce jour')}
      ${bloc('À envoyer', 'fa-paper-plane', '#16a34a', jourOut, 'Rien à envoyer ce jour')}
    </div>
  </div>`
}

// ══════════════════════════════════════════════════════════════
// ONGLET « FOURNISSEURS » — référentiel + historique BC / BL par fournisseur
// Consultation, ajout, suppression ; au clic sur un fournisseur : ses bons de
// commande envoyés et les bons de livraison reçus (avec transporteur et date),
// chaque ligne ouvrant la fiche AFFAIRE correspondante.
// ══════════════════════════════════════════════════════════════
function panelFournisseurs(FOURNS: any[], BCS: any[], BLS_ALL: any[]) {
  const FLBL = 'display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px;'
  const FINP = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;color:#374151;'
  // Index BL par BC : un BL de réception porte bc_id ; sinon on retombe sur bl_id du BC.
  const blParBc: Record<string, any[]> = {}
  for (const b of BLS_ALL as any[]) {
    const k = String(b.bc_id || '')
    if (k) (blParBc[k] = blParBc[k] || []).push(b)
  }
  // Rattachement BC → fournisseur : par id si présent, sinon par nom (le référentiel est
  // récent, beaucoup de BC anciens ne portent que fournisseur_nom).
  const norm = (s: any) => String(s || '').trim().toLowerCase()
  const data = (FOURNS as any[]).map((f: any) => {
    const bcs = (BCS as any[]).filter((b: any) =>
      (b.fournisseur_id && String(b.fournisseur_id) === String(f.id)) ||
      (!b.fournisseur_id && norm(b.fournisseur) === norm(f.nom)))
    const bls: any[] = []
    for (const b of bcs) {
      const linked = (blParBc[String(b.id)] || []).slice()
      if (!linked.length && b.bl_id) {
        const direct = (BLS_ALL as any[]).find((x: any) => String(x.id) === String(b.bl_id))
        if (direct) linked.push(direct)
      }
      for (const l of linked) bls.push({ ...l, _bc: b.num_bc || b.id, _affaire: b.num_affaire || b.affaire_id || '' })
    }
    return {
      id: f.id, nom: f.nom || f.id, code: f.code || '', contact: f.contact || '', email: f.email || '',
      tel: f.tel || '', categorie: f.categorie || '', actif: f.actif !== false,
      bcs: bcs.map((b: any) => ({
        id: b.id, num: b.num_bc || b.id, date: b.date_bc ? String(b.date_bc).slice(0, 10) : '',
        montant: Number(b.montant || 0) || 0, statut: b.statut || 'en_attente',
        affaire: b.num_affaire || b.affaire_id || '', recu: !!b.bl_id || !!b.date_reception_reelle,
        transporteur: b.transporteur || '',
      })).sort((x: any, y: any) => String(y.date).localeCompare(String(x.date))),
      bls: bls.map((l: any) => ({
        id: l.id, num: numBL(l), date: l.date_bl ? String(l.date_bl).slice(0, 10) : '',
        transporteur: l.transport || l.transporteur_ref || '', bc: l._bc, affaire: l._affaire,
      })).sort((x: any, y: any) => String(y.date).localeCompare(String(x.date))),
    }
  }).sort((a: any, b: any) => String(a.nom).localeCompare(String(b.nom), 'fr'))

  const F_JSON = JSON.stringify(data).replace(/</g, '\\u003c')

  const ligne = (f: any) => `
    <button onclick="expFournSel('${escX(f.id)}')" id="expf-row-${escX(f.id)}" class="expf-row" style="width:100%;text-align:left;border:none;background:white;border-bottom:1px solid #f1f5f9;padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;">
      <span style="width:30px;height:30px;border-radius:8px;background:#fff7ed;color:${AMB};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.72rem;font-weight:800;">${escX(String(f.nom).slice(0, 2).toUpperCase())}</span>
      <span style="min-width:0;flex:1;">
        <span style="display:block;font-weight:700;color:#111827;font-size:.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escX(f.nom)}</span>
        <span style="display:block;font-size:.66rem;color:#94a3b8;">${escX(f.code || '—')}${f.categorie ? ' · ' + escX(f.categorie) : ''}</span>
      </span>
      <span style="display:flex;gap:4px;flex-shrink:0;">
        <span title="bons de commande envoyés" style="background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:1px 7px;font-size:.62rem;font-weight:800;">${f.bcs.length} BC</span>
        <span title="bons de livraison reçus" style="background:#ecfdf5;color:#047857;border-radius:999px;padding:1px 7px;font-size:.62rem;font-weight:800;">${f.bls.length} BL</span>
      </span>
    </button>`

  return `
  <div id="exp-panel-fournisseurs" style="display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;"><i class="fas fa-industry" style="color:${AMB};margin-right:8px;"></i>Fournisseurs <span style="font-weight:500;color:#94a3b8;font-size:.82rem;">référentiel · commandes envoyées · livraisons reçues</span></div>
      <button onclick="expFournNew()" style="background:${AMB};color:white;border:none;border-radius:9px;padding:8px 16px;font-size:.8rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:6px;"></i>Nouveau fournisseur</button>
    </div>

    <div style="display:grid;grid-template-columns:320px 1fr;gap:16px;align-items:start;">
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;border-top:3px solid ${AMB};">
        <div style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
          <input id="expf-search" oninput="expFournFilter(this.value)" placeholder="Rechercher un fournisseur…" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 10px;font-size:.78rem;background:#f8fafc;outline:none;box-sizing:border-box;">
        </div>
        <div id="expf-list" style="max-height:640px;overflow-y:auto;">
          ${data.length ? data.map(ligne).join('') : '<div style="text-align:center;padding:28px;color:#9ca3af;font-size:.8rem;">Aucun fournisseur au référentiel.</div>'}
        </div>
      </div>

      <div id="expf-detail" style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:26px;min-height:260px;">
        <div style="text-align:center;color:#9ca3af;font-size:.85rem;padding:40px 0;">
          <i class="fas fa-hand-pointer" style="font-size:1.6rem;display:block;margin-bottom:10px;color:#cbd5e1;"></i>
          Sélectionnez un fournisseur dans la liste pour voir ses bons de commande envoyés et les bons de livraison reçus.
        </div>
      </div>
    </div>

    <div id="expf-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1100;align-items:center;justify-content:center;">
      <div style="background:white;border-radius:16px;padding:24px;max-width:520px;width:94%;box-shadow:0 20px 60px rgba(0,0,0,.3);">
        <div style="font-weight:800;color:#111827;font-size:1rem;margin-bottom:16px;"><i class="fas fa-industry" style="color:${AMB};margin-right:8px;"></i>Nouveau fournisseur</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="grid-column:1/-1;"><label style="${FLBL}">Nom <span style="color:#dc2626;">*</span></label><input id="expf-nom" style="${FINP}"></div>
          <div><label style="${FLBL}">Code</label><input id="expf-code" style="${FINP}"></div>
          <div><label style="${FLBL}">Catégorie</label><input id="expf-cat" style="${FINP}" placeholder="matière, outillage…"></div>
          <div><label style="${FLBL}">Contact</label><input id="expf-contact" style="${FINP}"></div>
          <div><label style="${FLBL}">Téléphone</label><input id="expf-tel" style="${FINP}"></div>
          <div style="grid-column:1/-1;"><label style="${FLBL}">E-mail</label><input id="expf-email" style="${FINP}"></div>
          <div style="grid-column:1/-1;"><label style="${FLBL}">Adresse</label><input id="expf-adr" style="${FINP}"></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;">
          <button onclick="expFournClose()" style="background:#f1f5f9;color:#475569;border:none;border-radius:9px;padding:9px 16px;font-weight:700;font-size:.8rem;cursor:pointer;">Annuler</button>
          <button onclick="expFournSave()" id="expf-save" style="background:${AMB};color:white;border:none;border-radius:9px;padding:9px 18px;font-weight:700;font-size:.8rem;cursor:pointer;">Enregistrer</button>
        </div>
      </div>
    </div>

    <script>
      window.EXPF = ${F_JSON};
      window.EXPF_SEL = '';

      function expFournFilter(q){
        var lq=(q||'').toLowerCase().trim();
        document.querySelectorAll('#expf-list .expf-row').forEach(function(r){
          r.style.display = (!lq || r.textContent.toLowerCase().indexOf(lq)>=0) ? 'flex' : 'none';
        });
      }
      function expFournNew(){ ['nom','code','cat','contact','tel','email','adr'].forEach(function(k){ var e=document.getElementById('expf-'+k); if(e) e.value=''; }); var o=document.getElementById('expf-overlay'); if(o) o.style.display='flex'; }
      function expFournClose(){ var o=document.getElementById('expf-overlay'); if(o) o.style.display='none'; }
      async function expFournSave(){
        var nom=(document.getElementById('expf-nom')||{}).value||'';
        if(!nom.trim()){ pushNotif('warn','fa-triangle-exclamation','Le nom est obligatoire.',4000); return; }
        var btn=document.getElementById('expf-save'); if(btn){ btn.disabled=true; btn.textContent='Enregistrement…'; }
        var body={ nom:nom.trim(),
          code:(document.getElementById('expf-code')||{}).value||null,
          categorie:(document.getElementById('expf-cat')||{}).value||null,
          contact:(document.getElementById('expf-contact')||{}).value||null,
          tel:(document.getElementById('expf-tel')||{}).value||null,
          email:(document.getElementById('expf-email')||{}).value||null,
          adresse:(document.getElementById('expf-adr')||{}).value||null };
        try{
          var r=await fetch('/api/achats/fournisseur',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
          var j=await r.json();
          if(j&&j.ok){ pushNotif('ok','fa-check','Fournisseur ajouté.',3000); expFournClose(); softReload(); }
          else { pushNotif('err','fa-times',(j&&j.error)||'Échec de l enregistrement.',6000); }
        }catch(e){ pushNotif('err','fa-times','Erreur réseau.',5000); }
        if(btn){ btn.disabled=false; btn.textContent='Enregistrer'; }
      }
      async function expFournDel(id,nom){
        var ok = await appConfirm('Supprimer le fournisseur « '+nom+' » du référentiel ? Ses bons de commande déjà émis ne sont pas supprimés.', {danger:true, okLabel:'Supprimer'});
        if(!ok) return;
        try{
          var r=await fetch('/api/fournisseurs/'+encodeURIComponent(id),{method:'DELETE'});
          var j=await r.json();
          if(j&&j.ok){ pushNotif('ok','fa-check','Fournisseur supprimé.',3000); softReload(); }
          else { pushNotif('err','fa-times',(j&&j.error)||'Suppression refusée.',6000); }
        }catch(e){ pushNotif('err','fa-times','Erreur réseau.',5000); }
      }
      function expFournAffaire(num){
        if(!num){ pushNotif('info','fa-circle-info','Aucun numéro d affaire sur cette ligne.',4000); return; }
        location.href='/commercial/affaire/'+encodeURIComponent(num);
      }
      function expFournSel(id){
        window.EXPF_SEL=id;
        document.querySelectorAll('#expf-list .expf-row').forEach(function(r){ r.style.background='white'; });
        var row=document.getElementById('expf-row-'+id); if(row) row.style.background='#fff7ed';
        var f=(window.EXPF||[]).find(function(x){ return String(x.id)===String(id); });
        var d=document.getElementById('expf-detail'); if(!d||!f) return;
        var esc=function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
        var eur=function(n){ return (Number(n)||0).toLocaleString('fr-FR')+' €'; };
        var fr=function(d0){ if(!d0) return '—'; var p=String(d0).split('-'); return p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : String(d0); };

        var bcRows = f.bcs.length ? f.bcs.map(function(b){
          return '<tr style="border-bottom:1px solid #f8fafc;cursor:pointer;" onclick="expFournAffaire(\\'' + esc(b.affaire) + '\\')" title="Ouvrir l affaire '+esc(b.affaire||'')+'">'
            + '<td style="padding:8px 10px;font-weight:700;color:#1d4ed8;font-size:.78rem;">'+esc(b.num)+'</td>'
            + '<td style="padding:8px 10px;font-size:.76rem;color:#475569;">'+fr(b.date)+'</td>'
            + '<td style="padding:8px 10px;font-size:.76rem;color:#475569;text-align:right;">'+eur(b.montant)+'</td>'
            + '<td style="padding:8px 10px;font-size:.72rem;">'+(b.recu?'<span style="background:#ecfdf5;color:#047857;border-radius:999px;padding:1px 8px;font-weight:800;">reçu</span>':'<span style="background:#fef3c7;color:#92400e;border-radius:999px;padding:1px 8px;font-weight:800;">en attente</span>')+'</td>'
            + '<td style="padding:8px 10px;font-size:.74rem;color:#6b7280;">'+(b.affaire?esc(b.affaire)+' <i class="fas fa-arrow-up-right-from-square" style="font-size:.62rem;color:#94a3b8;"></i>':'—')+'</td>'
            + '</tr>';
        }).join('') : '<tr><td colspan="5" style="padding:18px;text-align:center;color:#9ca3af;font-size:.78rem;">Aucun bon de commande envoyé à ce fournisseur.</td></tr>';

        var blRows = f.bls.length ? f.bls.map(function(l){
          return '<tr style="border-bottom:1px solid #f8fafc;cursor:pointer;" onclick="expFournAffaire(\\'' + esc(l.affaire) + '\\')" title="Ouvrir l affaire '+esc(l.affaire||'')+'">'
            + '<td style="padding:8px 10px;font-weight:700;color:#047857;font-size:.78rem;">'+esc(l.num)+'</td>'
            + '<td style="padding:8px 10px;font-size:.76rem;color:#475569;">'+fr(l.date)+'</td>'
            + '<td style="padding:8px 10px;font-size:.76rem;color:#475569;">'+(l.transporteur?esc(l.transporteur):'<span style="color:#cbd5e1;">non renseigné</span>')+'</td>'
            + '<td style="padding:8px 10px;font-size:.74rem;color:#6b7280;">'+esc(l.bc||'—')+'</td>'
            + '<td style="padding:8px 10px;font-size:.74rem;color:#6b7280;">'+(l.affaire?esc(l.affaire)+' <i class="fas fa-arrow-up-right-from-square" style="font-size:.62rem;color:#94a3b8;"></i>':'—')+'</td>'
            + '</tr>';
        }).join('') : '<tr><td colspan="5" style="padding:18px;text-align:center;color:#9ca3af;font-size:.78rem;">Aucun bon de livraison reçu de ce fournisseur.</td></tr>';

        var th='padding:7px 10px;text-align:left;font-size:.64rem;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:.04em;';
        d.innerHTML =
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:18px;">'
          + '<div><div style="font-size:1.05rem;font-weight:800;color:#111827;">'+esc(f.nom)+'</div>'
          + '<div style="font-size:.74rem;color:#94a3b8;margin-top:3px;">'+esc(f.code||'sans code')+(f.categorie?' · '+esc(f.categorie):'')+(f.contact?' · '+esc(f.contact):'')+(f.tel?' · '+esc(f.tel):'')+(f.email?' · '+esc(f.email):'')+'</div></div>'
          + '<div style="display:flex;gap:8px;">'
          + '<a href="/achats/fournisseur/'+encodeURIComponent(f.id)+'" style="text-decoration:none;background:#f1f5f9;color:#475569;border-radius:8px;padding:7px 13px;font-size:.75rem;font-weight:700;"><i class="fas fa-id-card" style="margin-right:5px;"></i>Fiche complète</a>'
          + '<button onclick="expFournDel(\\''+esc(f.id)+'\\',\\''+esc(f.nom).replace(/\\x27/g,"")+'\\')" style="background:#fee2e2;color:#b91c1c;border:none;border-radius:8px;padding:7px 13px;font-size:.75rem;font-weight:700;cursor:pointer;"><i class="fas fa-trash" style="margin-right:5px;"></i>Supprimer</button>'
          + '</div></div>'
          + '<div style="font-weight:800;color:#111827;font-size:.86rem;margin-bottom:8px;"><i class="fas fa-file-invoice" style="color:#1d4ed8;margin-right:7px;"></i>Bons de commande envoyés <span style="color:#94a3b8;font-weight:500;">('+f.bcs.length+')</span></div>'
          + '<div style="border:1px solid #eef2f7;border-radius:10px;overflow:hidden;margin-bottom:20px;"><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;"><th style="'+th+'">N° BC</th><th style="'+th+'">Date</th><th style="'+th+'text-align:right;">Montant</th><th style="'+th+'">Réception</th><th style="'+th+'">Affaire</th></tr></thead><tbody>'+bcRows+'</tbody></table></div></div>'
          + '<div style="font-weight:800;color:#111827;font-size:.86rem;margin-bottom:8px;"><i class="fas fa-truck-ramp-box" style="color:#047857;margin-right:7px;"></i>Bons de livraison reçus <span style="color:#94a3b8;font-weight:500;">('+f.bls.length+')</span></div>'
          + '<div style="border:1px solid #eef2f7;border-radius:10px;overflow:hidden;"><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;"><th style="'+th+'">N° BL</th><th style="'+th+'">Date</th><th style="'+th+'">Transporteur</th><th style="'+th+'">BC lié</th><th style="'+th+'">Affaire</th></tr></thead><tbody>'+blRows+'</tbody></table></div></div>'
          + '<div style="margin-top:12px;font-size:.7rem;color:#94a3b8;"><i class="fas fa-circle-info" style="margin-right:5px;"></i>Cliquez une ligne pour ouvrir la fiche de l affaire correspondante.</div>';
      }
    <\/script>
  </div>`
}


export const pageServiceExpeditions = (
  dbBLs?:   BonDeLivraison[],
  dbBCs?:   BonDeCommande[],
  dbCmds?:  Commande[],
  dbDAs?:   DemandeAchat[],
  dbFST?:   FournisseurSt[],
  dbLots?:  any[],
  dbNcs?:   any[],
  dbQuar?:  any[],
  dbValidations?: any[],
  dbHasAck?: boolean,   // la colonne bons_de_commande.accuse_fournisseur_le existe-t-elle (gate validation fournisseur) ?
  extra: { bds?: any[]; today?: string; fournisseurs?: any[] } = {},   // BDS réels (bons_sous_traitance) + date du jour calculée par requête
) => {
  const TODAY_REQ = extra.today || TODAY          // ⚠ le TODAY du module est figé au chargement (isolate réutilisée)
  const FOURNS = extra.fournisseurs ?? []   // référentiel fournisseurs (onglet Fournisseurs)
  const BDS = extra.bds ?? []                     // vrais bons de sous-traitance (la page n'en avait jamais eu)
  const VD_MAP = buildValDirMap(dbValidations || [])   // décisions Direction par (ref_table, ref_id)
  // Un BL annulé n'est ni une arrivée ni un départ : écarté des 3 onglets et du calendrier.
  const allBLs = (dbBLs ?? [...BL_CLIENTS_DEFAULT, ...BST_DEFAULT]).filter((b: any) => String(b.statut || '') !== 'annule')
  const BLS  = allBLs.filter((b: any) => !b.type_bl || b.type_bl === 'client')
  // Retour client = BL de réception rattaché à une non-conformité (contrainte type_bl en prod).
  const BLS_RETOUR = allBLs.filter((b: any) => b.type_bl === 'reception' && !!b.nc_id)
  const BSTS = allBLs.filter(b => b.type_bl === 'bst')
  const BLS_RECEPTION = allBLs.filter((b: any) => b.type_bl === 'reception' && !b.nc_id)
  // Un BC annulé n'est ni une arrivée, ni une dépense, ni un historique fournisseur :
  // il est écarté de TOUTES les vues du service — comme les BL annulés le sont déjà.
  const BCS  = ((dbBCs as any[]) ?? []).filter((b: any) => String(b.statut || '') !== 'annule')
  // BC validés par le fournisseur/ST → en attente de réception (repli sans la colonne : tout BC émis).
  const _bcEmise = (s: any) => ['en_attente', 'envoye', 'confirme', 'brouillon', 'accuse'].includes(s)
  const BCS_A_RECEVOIR = (BCS as any[]).filter((b: any) => _bcEmise(b.statut) && (!dbHasAck || !!b.accuse_fournisseur_le))
  // BC avec une date d'arrivée prévue, pas encore réceptionnés → badge du planning
  const BC_A_ARRIVER = (BCS as any[]).filter((b: any) => b.date_livraison_prevue && !['recu_partiel', 'recu_total', 'recu', 'controle', 'cloture', 'annule'].includes(b.statut) && !b.bl_id).length
  const CMDS = dbCmds  ?? []
  const DAS  = dbDAs   ?? []
  const FST  = dbFST   ?? []
  // ── Porte qualité : une commande prod-terminée reste BLOQUÉE tant qu'une NC bloquante OU une quarantaine active la concerne (lien souple par n° affaire / lot). ──
  const _qOpen = (s: any) => !['cloture', 'cloturé', 'clôturé', 'fermee', 'fermé', 'fermée', 'resolu', 'résolu', 'resolue', 'résolue', 'libere', 'libéré', 'liberee', 'libérée', 'rejete', 'rejeté'].includes(String(s || '').toLowerCase())
  const qualiteBloque = (c: any): string | null => {
    const aff = String(c.num_affaire || c.id)
    const lotIds = new Set((dbLots ?? []).filter((l: any) => String(l.cmd_id) === String(c.id) || String(l.id || '').indexOf(aff) !== -1).map((l: any) => String(l.id)))
    const nc = (dbNcs ?? []).find((n: any) => _qOpen(n.statut) && /critique|bloquante/i.test(String(n.gravite || '')) && String(n.lot_ref || '').indexOf(aff) !== -1)
    if (nc) return 'NC ' + (nc.id || '') + ' · ' + (nc.gravite || '')
    const q = (dbQuar ?? []).find((x: any) => _qOpen(x.statut) && (lotIds.has(String(x.lot_id)) || String(x.lot_id || '').indexOf(aff) !== -1))
    if (q) return 'Quarantaine ' + (q.id || '')
    // Porte LIBÉRATION : tous les lots de la commande doivent avoir été libérés (contrôle qualité final) avant expédition.
    const lotsC = (dbLots ?? []).filter((l: any) => String(l.cmd_id) === String(c.id) || String(l.id || '').indexOf(aff) !== -1)
    const nonLib = lotsC.filter((l: any) => l.statut !== 'libere' && l.statut !== 'expedie')
    if (lotsC.length > 0 && nonLib.length > 0) return nonLib.length + ' lot(s) à libérer'
    return null
  }
  // Socle commun aux 3 onglets : tous les flux (arrivees + departs) issus des memes tables.
  const MOUVEMENTS = collecterMouvements(BCS, BDS, BLS, BLS_RETOUR, dbNcs ?? [], CMDS)
  const RETOURS_JSON = JSON.stringify(((dbNcs ?? []) as any[])
    .filter((n: any) => n.retour_attendu === true)
    .map((n: any) => ({ id: n.id, client: n.client_nom || '', piece: [n.ref_article, n.designation].filter(Boolean).join(' · ') || n.lot_ref || '',
      cmd: n.n_commande || '', qte: n.qte_retour_attendue ?? n.nb_pieces ?? null })))
    .replace(/</g, '\\u003c')
  const BC_JSON = JSON.stringify((BCS as any[]).map((b: any) => ({ id:b.id, num_bc:b.num_bc||b.id, type:b.type, fournisseur:b.fournisseur||'', articles:b.articles||'', montant:b.montant||0, affaire_id:b.affaire_id||'', num_affaire:b.num_affaire||'', bl_propose:b.bl_propose||'', statut:b.statut, bl_id:b.bl_id||'', date_livraison_prevue:b.date_livraison_prevue||'' }))).replace(/</g, '\\u003c')   // sinon un '<' dans un libelle casse le <script>
  // Lots & commandes (pour le BL partiel) : SEULS les lots LIBÉRÉS (contrôle qualité final passé) sont expédiables.
  const LOTS_EXP = (dbLots ?? []).filter((l:any) => l.statut === 'libere')
  const LOTS_JSON = JSON.stringify((LOTS_EXP as any[]).map((l:any) => ({ id:l.id, cmd_id:l.cmd_id||'', client:l.client_nom||'', piece:l.piece||'', qte:l.qte!=null?l.qte:null })))
  const CMDS_JSON = JSON.stringify((CMDS as any[]).map((c:any) => ({ id:c.id, num_affaire:c.num_affaire||c.id, client:c.client_nom||'', montant:c.montant||0 })))
  const FLBL = 'display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px;'
  const FINP = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;color:#374151;'

  // Ordre logique du flux : on commande (BC) → on reçoit / on livre (BL)
  // Orchestration demandee : ce qui ARRIVE, ce qui PART, puis la vue calendrier + le jour.
  const TABS = [
    // Le CALENDRIER en premier : c'est la vue d'ensemble de ce qui arrive et de ce qui
    // part, donc l'ecran sur lequel on veut tomber en ouvrant le service (choix user).
    ['calendrier', 'Calendrier',   'fa-calendar-days'],
    ['envois',     'Envois',       'fa-paper-plane'],
    ['receptions', 'Réceptions',   'fa-dolly'],
    ['fournisseurs','Fournisseurs', 'fa-industry'],
    ['dashboard',  'Dashboard',    'fa-tachometer-alt'],
  ] as const

  const content = `
  <div style="font-family:Inter,system-ui,sans-serif;">

    ${serviceHeader({
      icon: 'fa-truck-loading',
      color: AMB,
      darkBg: '#451a03',
      title: 'Service Expéditions',
      subtitle: 'Sabine · Calendrier · Envois · Réceptions · Fournisseurs · OTD · EN 9100:2018',
      tabs: TABS.map(([id,lbl,ic]) => ({
        id, label: lbl, icon: ic,
        badge: id === 'receptions' ? (MOUVEMENTS.filter(m => m.sens === 'in' && !m.fait).length || undefined)
             : id === 'envois' ? (MOUVEMENTS.filter(m => m.sens === 'out' && !m.fait).length || undefined)
             : id === 'calendrier' ? (MOUVEMENTS.filter(m => !m.fait && m.date && m.date <= TODAY_REQ).length || undefined)
             : undefined,
      })),
      switchFn: 'expShowTab',
      tabIdPrefix: 'exp-tab',
      activeId: 'calendrier'
    })}

    <div style="padding:22px 30px;">
      ${panelEnvois(BDS, BLS, CMDS, qualiteBloque, TODAY_REQ)}
      ${panelReceptions(BCS, BCS_A_RECEVOIR, BLS_RECEPTION, BDS, dbNcs ?? [], BLS_RETOUR, VD_MAP, !!dbHasAck, TODAY_REQ)}
      ${panelCalendrier(MOUVEMENTS, TODAY_REQ)}
      ${panelFournisseurs(FOURNS, BCS, allBLs)}
      ${panelDashboard(BLS, BSTS, BCS, CMDS)}
    </div>
  </div>

  <!-- MODAL -->
  <div id="exp-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div id="exp-modal-box" style="background:white;border-radius:16px;padding:28px;max-width:560px;width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div id="exp-modal-content"></div>
    </div>
  </div>

  <!-- MODAL RÉCEPTION BC → BL -->
  <div id="exp-recep-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;max-width:540px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">
      <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#0ea5e9,#0284c7);">
        <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-truck-loading" style="margin-right:8px;"></i>Réception — Lier le BC à un BL</div>
        <button onclick="expCloseRecep()" style="color:rgba(255,255,255,.8);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:22px;">
        <input type="hidden" id="rec_bc_id"/>
        <div id="rec_info" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#075985;"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><label style="${FLBL}">N° BL interne <span style="font-weight:500;color:#94a3b8;text-transform:none;letter-spacing:0;">· repris du BC</span></label><input id="rec_numbl" type="text" placeholder="attribué automatiquement" style="${FINP}"/></div>
          <div><label style="${FLBL}">N° d'affaire <span style="font-weight:500;color:#94a3b8;text-transform:none;letter-spacing:0;">· repris du BC</span></label><input id="rec_affaire" type="text" placeholder="aucune affaire rattachée" style="${FINP}"/></div>
          <div><label style="${FLBL}">Transporteur</label>
            <select id="rec_transp" style="${FINP}"><option value="">— Choisir —</option><option>GLS</option><option>DHL</option><option>Chronopost</option><option>TNT</option><option>DPD</option><option>Geodis</option><option>Coursier</option><option>Enlèvement direct</option></select>
          </div>
          <div><label style="${FLBL}">N° réf. livraison transporteur</label><input id="rec_ref" type="text" placeholder="Tracking / BL transporteur" style="${FINP}"/></div>
          <div><label style="${FLBL}">Quantité reçue</label><input id="rec_qte" type="number" placeholder="0" style="${FINP}"/></div>
        </div>
      </div>
      <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="expCloseRecep()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="expSubmitRecep()" style="padding:9px 18px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i>Valider la réception</button>
      </div>
    </div>
  </div>

  <!-- MODAL PV DE CONTRÔLE RÉCEPTION -->
  <div id="exp-pv-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;max-width:540px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">
      <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#ef4444,#b91c1c);">
        <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-clipboard-check" style="margin-right:8px;"></i>PV de contrôle à réception</div>
        <button onclick="expClosePV()" style="color:rgba(255,255,255,.8);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:22px;">
        <input type="hidden" id="pv_bc_id"/>
        <div id="pv_info" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#991b1b;"></div>
        <div style="display:grid;grid-template-columns:1fr;gap:12px;">
          <div>
            <label style="${FLBL}">Résultat du contrôle</label>
            <div style="display:flex;gap:10px;">
              <label style="flex:1;display:flex;align-items:center;gap:8px;border:1.5px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:10px 12px;cursor:pointer;font-size:.82rem;font-weight:700;color:#15803d;"><input type="radio" name="pv_res" value="ok" checked onchange="expPVToggle()"/> Conforme (OK)</label>
              <label style="flex:1;display:flex;align-items:center;gap:8px;border:1.5px solid #fecaca;background:#fef2f2;border-radius:10px;padding:10px 12px;cursor:pointer;font-size:.82rem;font-weight:700;color:#b91c1c;"><input type="radio" name="pv_res" value="anomalie" onchange="expPVToggle()"/> Anomalie</label>
            </div>
          </div>
          <div id="pv_anom_box" style="display:none;border:1.5px dashed #fecaca;border-radius:10px;padding:12px;background:#fffbfb;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div><label style="${FLBL}">Gravité NC</label><select id="pv_gravite" style="${FINP}"><option>Mineure</option><option selected>Majeure</option><option>Critique</option><option>Bloquante</option></select></div>
              <div style="display:flex;align-items:flex-end;"><label style="display:flex;align-items:center;gap:8px;font-size:.8rem;font-weight:600;color:#92400e;cursor:pointer;"><input type="checkbox" id="pv_quarantaine" checked/> Mettre le lot en quarantaine</label></div>
            </div>
            <div style="font-size:.72rem;color:#b91c1c;margin-top:8px;"><i class="fas fa-exclamation-triangle" style="margin-right:5px;"></i>Une fiche de non-conformité sera créée automatiquement et envoyée au service Qualité.</div>
          </div>
          <div><label style="${FLBL}">Observations</label><textarea id="pv_obs" rows="3" placeholder="Constats, mesures, écarts…" style="${FINP}resize:vertical;"></textarea></div>
          <div><label style="${FLBL}">Contrôleur</label><input id="pv_op" type="text" placeholder="Nom du contrôleur" value="Expéditions" style="${FINP}"/></div>
        </div>
      </div>
      <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="expClosePV()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="expSubmitPV()" style="padding:9px 18px;background:linear-gradient(135deg,#ef4444,#b91c1c);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane" style="margin-right:5px;"></i>Valider le PV</button>
      </div>
    </div>
  </div>

  <!-- MODAL RETOUR CLIENT — enregistrer l'arrivée d'un retour annoncé par la Qualité -->
  <div id="exp-retour-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;max-width:520px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">
      <div style="padding:15px 20px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#ef4444,#b91c1c);">
        <div style="font-weight:800;color:white;font-size:.98rem;"><i class="fas fa-box-open" style="margin-right:8px;"></i>Retour client — enregistrer l'arrivée</div>
        <button onclick="expCloseRetourClient()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.15rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:20px;">
        <input type="hidden" id="ret_nc_id"/>
        <div id="ret_info" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px 14px;margin-bottom:15px;font-size:.8rem;color:#991b1b;"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><label style="${FLBL}">Commande client</label><input id="ret_cmd" type="text" placeholder="N° de commande" style="${FINP}"/></div>
          <div><label style="${FLBL}">Quantité reçue</label><input id="ret_qte" type="number" step="any" style="${FINP}"/></div>
          <div><label style="${FLBL}">Transporteur</label>
            <select id="ret_transp" style="${FINP}"><option value="">— Choisir —</option><option>GLS</option><option>DHL</option><option>Chronopost</option><option>TNT</option><option>DPD</option><option>Geodis</option><option>Coursier</option><option>Retour par le client</option></select>
          </div>
          <div><label style="${FLBL}">N° de suivi</label><input id="ret_ref" type="text" placeholder="Tracking / BL transporteur" style="${FINP}"/></div>
        </div>
        <div style="margin-top:14px;font-size:.72rem;color:#b91c1c;"><i class="fas fa-circle-info" style="margin-right:5px;"></i>Un bon de livraison de retour est créé et rattaché à la commande ; la non-conformité passe en « retour reçu » pour le contrôle qualité.</div>
      </div>
      <div style="padding:13px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="expCloseRetourClient()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="expSubmitRetourClient()" style="padding:9px 18px;background:linear-gradient(135deg,#ef4444,#b91c1c);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i>Enregistrer l'arrivée</button>
      </div>
    </div>
  </div>

  <!-- MODAL PLANNING — détail d'une arrivée : BC (+ BL si reçu) + changement de date -->

  <script>
  var EXP_TABS=['calendrier','envois','receptions','fournisseurs','dashboard'];
  var EXP_BC=${BC_JSON};
  var EXP_RETOURS=${RETOURS_JSON};
  var EXP_LOTS=${LOTS_JSON};
  var EXP_CMDS=${CMDS_JSON};

  // ── Réception : lier le BC à un BL ──
  function expOpenReception(id){
    var bc=EXP_BC.find(function(b){return b.id===id;}); if(!bc) return;
    document.getElementById('rec_bc_id').value=id;
    document.getElementById('rec_info').innerHTML='<strong>'+(bc.num_bc||id)+'</strong> · '+(bc.fournisseur||'')+' · '+(bc.articles||'');
    // Le N° de BL et le N° d'affaire viennent du bon de commande : on ne les redemande
    // pas. Champs verrouilles quand la valeur est connue — les retaper ne pourrait que
    // creer un ecart avec le BC. Ils restent saisissables si le BC ne porte rien.
    var blProp = bc.bl_propose || '';
    var affProp = bc.num_affaire || bc.affaire_id || '';
    var cBl = document.getElementById('rec_numbl');
    cBl.value = blProp;
    cBl.readOnly = !!blProp;
    cBl.title = blProp ? 'Numero derive du bon de commande ' + (bc.num_bc || bc.id) : '';
    cBl.style.background = blProp ? '#f1f5f9' : '';
    cBl.style.color = blProp ? '#475569' : '';
    var cAff = document.getElementById('rec_affaire');
    cAff.value = affProp;
    cAff.readOnly = !!affProp;
    cAff.title = affProp ? 'Affaire rattachee au bon de commande ' + (bc.num_bc || bc.id) : '';
    cAff.style.background = affProp ? '#f1f5f9' : '';
    cAff.style.color = affProp ? '#475569' : '';
    document.getElementById('rec_transp').value='';
    document.getElementById('rec_ref').value='';
    document.getElementById('rec_qte').value='';
    document.getElementById('exp-recep-overlay').style.display='flex';
  }
  function expCloseRecep(){ document.getElementById('exp-recep-overlay').style.display='none'; }
  function expSubmitRecep(){
    var id=document.getElementById('rec_bc_id').value;
    var payload={ num_bl:document.getElementById('rec_numbl').value.trim(), affaire_id:document.getElementById('rec_affaire').value.trim(), transporteur:document.getElementById('rec_transp').value, transporteur_ref:document.getElementById('rec_ref').value.trim(), qte:parseInt(document.getElementById('rec_qte').value)||0 };
    if(!payload.transporteur){ pushNotif('err','fa-exclamation-circle','Indiquez le transporteur.'); return; }
    fetch('/api/expeditions/bc/'+encodeURIComponent(id)+'/receptionner',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Réception échouée.'); return; }
        expCloseRecep(); pushNotif('ok','fa-truck-loading','Colis reçu · BL <strong>'+j.bl_id+'</strong> créé (entrée stock). Passez au PV de contrôle (onglet BC).',6500); setTimeout(function(){location.hash='receptions';softReload();},900);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }

  // ── PV de contrôle réception ──
  function expOpenPV(id){
    var bc=EXP_BC.find(function(b){return b.id===id;}); if(!bc) return;
    document.getElementById('pv_bc_id').value=id;
    document.getElementById('pv_info').innerHTML='<strong>'+(bc.num_bc||id)+'</strong> · '+(bc.fournisseur||'')+' · '+(bc.articles||'')+(bc.bl_id?' · BL '+bc.bl_id:'');
    var ok=document.querySelector('input[name=pv_res][value=ok]'); if(ok) ok.checked=true;
    document.getElementById('pv_obs').value='';
    expPVToggle();
    document.getElementById('exp-pv-overlay').style.display='flex';
  }
  function expClosePV(){ document.getElementById('exp-pv-overlay').style.display='none'; }
  function expPVToggle(){
    var sel=document.querySelector('input[name=pv_res]:checked');
    var anom=sel&&sel.value==='anomalie';
    document.getElementById('pv_anom_box').style.display=anom?'block':'none';
  }
  function expSubmitPV(){
    var id=document.getElementById('pv_bc_id').value;
    var sel=document.querySelector('input[name=pv_res]:checked');
    var anomalie=sel&&sel.value==='anomalie';
    var payload={ anomalie:anomalie, observations:document.getElementById('pv_obs').value.trim()||null, operateur:document.getElementById('pv_op').value.trim()||'Expéditions', gravite:document.getElementById('pv_gravite').value, quarantaine:document.getElementById('pv_quarantaine').checked };
    fetch('/api/expeditions/bc/'+encodeURIComponent(id)+'/pv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'PV échoué.'); return; }
        expClosePV();
        if(j.anomalie){ pushNotif('warn','fa-exclamation-triangle','PV <strong>'+j.pv_id+'</strong> · anomalie → NC '+(j.nc_id||'')+(j.quarantaine_id?' + quarantaine':'')+' créée en Qualité.',7000); }
        else { pushNotif('ok','fa-clipboard-check','PV <strong>'+j.pv_id+'</strong> conforme → libéré en Qualité (statut OK).',6000); }
        setTimeout(function(){location.hash='receptions';softReload();},1100);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }

  function expShowTab(id){
    EXP_TABS.forEach(function(t){
      var p=document.getElementById('exp-panel-'+t);
      var b=document.getElementById('exp-tab-'+t);
      if(p) p.style.display=(t===id)?'block':'none';
      if(b) b.classList.toggle('active',t===id);
    });
  }


  function expFilter(tableId, q){
    var tbl=document.getElementById(tableId);
    if(!tbl) return;
    var lq=q.toLowerCase().trim();
    tbl.querySelectorAll('tbody tr').forEach(function(tr){
      tr.style.display=(!lq||tr.textContent.toLowerCase().indexOf(lq)>=0)?'':'none';
    });
  }

  function expToggleSection(id){
    var el=document.getElementById(id);
    var ico=document.getElementById(id+'-ico');
    if(!el) return;
    var open=el.style.display==='none';
    el.style.display=open?'block':'none';
    if(ico) ico.style.transform=open?'rotate(180deg)':'';
  }

  function expOpenModal(type){
    var overlay=document.getElementById('exp-modal-overlay');
    var box=document.getElementById('exp-modal-content');
    if(!overlay||!box) return;
    overlay.style.display='flex';
    if(type==='bl') box.innerHTML=modalBLHTML();
    else if(type==='bst') box.innerHTML=modalBSTHTML();
    else if(type==='bc') box.innerHTML=modalBCHTML();
  }

  function expCloseModal(){
    var o=document.getElementById('exp-modal-overlay');
    if(o) o.style.display='none';
  }

  document.addEventListener('click',function(e){
    var o=document.getElementById('exp-modal-overlay');
    if(e.target===o) expCloseModal();
  });

  async function expEnvoyerBL(id){ if(await appConfirm('Confirmer l envoi du BL '+id+' ?')){ pushNotif('ok','fa-paper-plane','BL expedie. Notification client + transporteur envoyee.',5000); } }
  async function expEnvoyerBST(id){ if(await appConfirm('Confirmer l envoi du BST '+id+' au sous-traitant ?')){ pushNotif('ok','fa-exchange-alt','BST parti chez le sous-traitant. BC ST mis a jour.',5000); } }
  async function expReceptionnerBST(id){ if(await appConfirm('Confirmer la reception du retour BST '+id+' ?')){ pushNotif('ok','fa-check-circle','Retour BST confirme. Lot remis en production.',5000); } }
  async function expReceptionnerBC(id){ if(await appConfirm('Confirmer la reception BC '+id+' ?')){ pushNotif('ok','fa-boxes','Reception confirmee. Stock mis a jour.',5000); } }

  function expSaveBL(){ pushNotif('ok','fa-truck-loading','BL cree et ajoute a la liste d envoi.',5000); expCloseModal(); }
  function expSaveBST(){ pushNotif('ok','fa-exchange-alt','BST cree. Apparaitra le jour J dans la liste.',5000); expCloseModal(); }
  function expSaveBC(){ pushNotif('ok','fa-file-contract','BC cree et envoye au fournisseur.',5000); expCloseModal(); }

  function fldE(label,type,placeholder){
    if(type==='textarea') return '<div style="margin-bottom:14px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">'+label+'</label><textarea placeholder="'+placeholder+'" rows="3" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;resize:vertical;box-sizing:border-box;"></textarea></div>';
    if(type==='select') return '<div style="margin-bottom:14px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">'+label+'</label><select style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"><option value="">-- Choisir --</option>'+placeholder.split('|').map(function(o){return '<option>'+o+'</option>';}).join('')+'</select></div>';
    return '<div style="margin-bottom:14px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">'+label+'</label><input type="'+type+'" placeholder="'+(placeholder||'')+'" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;box-sizing:border-box;"/></div>';
  }

  function fldRow2(a,b){ return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'+a+b+'</div>'; }

  function modalBLHTML(){
    var lbl='display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;';
    var inp='width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;box-sizing:border-box;';
    var cmdOpts='<option value="">— Choisir une commande —</option>'+EXP_CMDS.map(function(c){return '<option value="'+c.id+'">'+(c.num_affaire||c.id)+' · '+c.client+'</option>';}).join('');
    return '<div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:18px;display:flex;align-items:center;gap:8px;"><i class="fas fa-truck-loading" style="color:${AMB};"></i>Nouveau BL Client — livraison (partielle possible)</div>'+
    '<div style="margin-bottom:12px;"><label style="'+lbl+'">N° Commande *</label><select id="bl_cmd" onchange="blLoadLots()" style="'+inp+'">'+cmdOpts+'</select></div>'+
    '<div style="margin-bottom:6px;"><label style="'+lbl+'">Lots à expédier (cochez + quantité à envoyer)</label></div>'+
    '<div id="bl_lots" style="border:1.5px solid #e2e8f0;border-radius:10px;padding:8px;max-height:200px;overflow-y:auto;margin-bottom:14px;background:#f8fafc;"><div style="text-align:center;color:#9ca3af;font-size:.78rem;padding:14px;">Choisissez d\\'abord une commande</div></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">'+
      '<div><label style="'+lbl+'">Transporteur *</label><select id="bl_transp" style="'+inp+'"><option value="">— Choisir —</option><option>GLS</option><option>DHL</option><option>Chronopost</option><option>TNT</option><option>DPD</option><option>Geodis</option><option>Coursier</option><option>Propre véhicule</option></select></div>'+
      '<div><label style="'+lbl+'">Prix transport (€ HT)</label><input id="bl_prix" type="number" step="0.01" placeholder="0.00" style="'+inp+'"/></div>'+
    '</div>'+
    '<label style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:.8rem;color:#374151;cursor:pointer;"><input type="checkbox" id="bl_facture" checked/> Générer automatiquement la facture partielle (→ Facturation)</label>'+
    '<label style="display:flex;align-items:center;gap:8px;margin-top:8px;font-size:.8rem;color:#374151;cursor:pointer;"><input type="checkbox" id="bl_validation"/> <span><i class="fas fa-user-shield" style="color:#f59e0b;margin-right:4px;"></i>Soumis à validation hiérarchique <span style="color:#94a3b8;">(le paiement passe en attente de validation Direction)</span></span></label>'+
    '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;">'+
    '<button onclick="expCloseModal()" style="padding:9px 20px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'+
    '<button onclick="expSubmitBLPartiel()" style="padding:9px 20px;background:linear-gradient(135deg,${AMB},${AMB_D});color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane" style="margin-right:5px;"></i>Créer BL + facture</button>'+
    '</div>';
  }
  function blLoadLots(){
    var cmdId=document.getElementById('bl_cmd').value;
    var lots=EXP_LOTS.filter(function(l){ return String(l.cmd_id)===String(cmdId); });
    var box=document.getElementById('bl_lots');
    if(!cmdId){ box.innerHTML='<div style="text-align:center;color:#9ca3af;font-size:.78rem;padding:14px;">Choisissez d\\'abord une commande</div>'; return; }
    if(lots.length===0){ box.innerHTML='<div style="text-align:center;color:#9ca3af;font-size:.78rem;padding:14px;">Aucun lot en cours pour cette commande</div>'; return; }
    box.innerHTML=lots.map(function(l){
      return '<div style="display:grid;grid-template-columns:24px 1fr 110px;gap:8px;align-items:center;padding:6px 8px;border-bottom:1px solid #eef2f7;">'
        +'<input type="checkbox" class="bl-lot-chk" data-lot="'+l.id+'" onchange="this.parentElement.querySelector(\\'.bl-lot-qte\\').disabled=!this.checked;"/>'
        +'<div style="min-width:0;"><div style="font-size:.76rem;font-weight:700;color:#1e293b;">'+l.id+'</div><div style="font-size:.66rem;color:#64748b;">'+(l.piece||'')+' · reste '+(l.qte!=null?l.qte:'?')+'</div></div>'
        +'<input type="number" class="bl-lot-qte" data-lot="'+l.id+'" min="1" max="'+(l.qte||'')+'" placeholder="Qté" disabled style="width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:5px 8px;font-size:.78rem;box-sizing:border-box;"/>'
        +'</div>';
    }).join('');
  }
  function expSubmitBLPartiel(){
    var cmdId=document.getElementById('bl_cmd').value;
    if(!cmdId){ pushNotif('err','fa-exclamation-circle','Choisissez une commande.'); return; }
    var transp=document.getElementById('bl_transp').value;
    if(!transp){ pushNotif('err','fa-exclamation-circle','Choisissez le transporteur.'); return; }
    var lignes=[];
    document.querySelectorAll('.bl-lot-chk:checked').forEach(function(chk){
      var lotId=chk.dataset.lot; var qInp=document.querySelector('.bl-lot-qte[data-lot="'+lotId+'"]'); var q=parseFloat(qInp&&qInp.value)||0;
      if(q>0) lignes.push({lot_id:lotId, qte:q});
    });
    if(lignes.length===0){ pushNotif('err','fa-exclamation-circle','Cochez au moins un lot avec une quantité.'); return; }
    var payload={ cmd_id:cmdId, transporteur:transp, prix_transport:parseFloat(document.getElementById('bl_prix').value)||0, generer_facture:document.getElementById('bl_facture').checked, validation_hierarchique:document.getElementById('bl_validation').checked, lignes:lignes };
    _expPostBL(payload);
  }
  // Envoi du BL, avec gestion de la DÉROGATION qualité : si la porte bloque (409 NC/quarantaine),
  // on propose d'expédier sous dérogation (motif obligatoire) → re-POST avec force + motif tracé sur la facture.
  async function _expPostBL(payload){
    try{
      var r=await fetch('/api/expeditions/bl-partiel',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      var j=await r.json();
      if(j&&j.ok){ expCloseModal(); pushNotif('ok','fa-truck-loading','BL <strong>'+j.bl_id+'</strong> créé'+(j.facture_id?' · facture <strong>'+j.facture_id+'</strong> générée':'')+(payload.force?' (sous dérogation)':'')+'. Lots décrémentés.',7000); setTimeout(function(){ softReload(); },1100); return; }
      if(j&&(j.bloque==='nc'||j.bloque==='quarantaine')&&!payload.force){
        var motif=window.prompt('Expédition bloquée par la qualité ('+(j.error||'')+').\\n\\nExpédier SOUS DÉROGATION ? Indiquez le motif (obligatoire, tracé sur la facture) :','');
        if(motif&&String(motif).trim()){ payload.force=true; payload.derogation_motif=String(motif).trim(); return _expPostBL(payload); }
        pushNotif('warn','fa-ban','Expédition annulée (pas de dérogation).',5000); return;
      }
      pushNotif('err','fa-ban',(j&&j.error)||'Création BL échouée.');
    }catch(e){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); }
  }

  function modalBSTHTML(){
    return '<div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:20px;display:flex;align-items:center;gap:8px;"><i class="fas fa-exchange-alt" style="color:#0891b2;"></i>Nouveau BST – Envoi Sous-Traitant</div>'+
    fldRow2(fldE('Sous-traitant','select','ST Anodisation Maurin|Serigraphie Rhone-Alpes|Zingage Express|Traitement Thermique Alpes'),fldE('Lot concerne','text','LOT-2026-XXX'))+
    fldRow2(fldE('Piece','text','Reference piece'),fldE('Quantite','number','0'))+
    fldRow2(fldE('Operation ST','select','Oxydation anodique sulfurique|Serigraphie|Traitement thermique|Zingage|Peinture poudre'),fldE('Date envoi prevue (Gantt)','date',''))+
    fldRow2(fldE('Date retour prevue','date',''),fldE('BC ST lie','text','BC-2026-XXX (optionnel)'))+
    fldE('Observations','textarea','')+
    '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">'+
    '<button onclick="expCloseModal()" style="padding:9px 20px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'+
    '<button onclick="expSaveBST()" style="padding:9px 20px;background:linear-gradient(135deg,#0891b2,#0e7490);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Creer BST</button>'+
    '</div>';
  }

  function modalBCHTML(){
    return '<div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:20px;display:flex;align-items:center;gap:8px;"><i class="fas fa-file-contract" style="color:${AMB};"></i>Nouveau Bon de Commande</div>'+
    fldE('Type','select','fournisseur|st')+
    fldRow2(fldE('Fournisseur / ST','text','Nom'),fldE('DA liee (si four.)','text','DA-2026-XXX (optionnel)'))+
    fldE('Articles commandes','textarea','')+
    fldRow2(fldE('Montant HT (EUR)','number','0'),fldE('Date livraison prevue','date',''))+
    fldE('Notes','textarea','')+
    '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">'+
    '<button onclick="expCloseModal()" style="padding:9px 20px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'+
    '<button onclick="expSaveBC()" style="padding:9px 20px;background:linear-gradient(135deg,${AMB},${AMB_D});color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Creer BC</button>'+
    '</div>';
  }

  // BC : télécharger le PDF (à envoyer au fournisseur) · marquer validée par le fournisseur
  // ── Actions des 3 onglets (Réceptions / Envois) ──
  // Retour de sous-traitance reçu : on horodate le retour sur le BDS (table bons_sous_traitance),
  // ce qui le fait disparaître des « retours attendus » et basculer dans le calendrier en « fait ».
  async function expRetourBds(id){
    if(!(await appConfirm("Confirmer le retour du BDS <strong>"+id+"</strong> ? Les pieces sont revenues de sous-traitance."))) return;
    var today=new Date().toISOString().slice(0,10);
    fetch('/api/production/bds/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({date_retour_effective:today,statut:'recu'})})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||j.ok===false){ pushNotif('err','fa-ban',(j&&j.error)||'Echec.'); return; }
        pushNotif('ok','fa-rotate-left','Retour <strong>'+id+'</strong> enregistre.',4500);
        setTimeout(function(){ location.hash='receptions'; softReload(); },700);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); });
  }
  // Départ en sous-traitance : horodate l'envoi ; la ligne passe des « à envoyer » aux retours attendus.
  async function expEnvoyerBds(id){
    if(!(await appConfirm("Confirmer l envoi du BDS <strong>"+id+"</strong> chez le sous-traitant ?"))) return;
    var today=new Date().toISOString().slice(0,10);
    fetch('/api/production/bds/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({date_envoi:today,statut:'envoye'})})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||j.ok===false){ pushNotif('err','fa-ban',(j&&j.error)||'Echec.'); return; }
        pushNotif('ok','fa-paper-plane','BDS <strong>'+id+'</strong> parti en sous-traitance.',4500);
        setTimeout(function(){ location.hash='envois'; softReload(); },700);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); });
  }
  // Arrivée d'un retour client annoncé par la Qualité : cree le BL de retour rattache a la commande.
  function expOpenRetourClient(ncId){
    var nc=EXP_RETOURS.find(function(x){return String(x.id)===String(ncId);}); if(!nc) return;
    document.getElementById('ret_nc_id').value=ncId;
    document.getElementById('ret_info').innerHTML='<strong>'+(nc.id||'')+'</strong> \\u00b7 '+(nc.client||'')+(nc.piece?' \\u00b7 '+nc.piece:'');
    document.getElementById('ret_cmd').value=nc.cmd||'';
    document.getElementById('ret_qte').value=(nc.qte!=null?nc.qte:'');
    document.getElementById('ret_transp').value='';
    document.getElementById('ret_ref').value='';
    document.getElementById('exp-retour-overlay').style.display='flex';
  }
  function expCloseRetourClient(){ var o=document.getElementById('exp-retour-overlay'); if(o) o.style.display='none'; }
  function expSubmitRetourClient(){
    var id=document.getElementById('ret_nc_id').value;
    var payload={ cmd_id:document.getElementById('ret_cmd').value.trim(), qte:parseFloat(document.getElementById('ret_qte').value)||0,
      transporteur:document.getElementById('ret_transp').value, transporteur_ref:document.getElementById('ret_ref').value.trim() };
    fetch('/api/expeditions/retour-client/'+encodeURIComponent(id)+'/receptionner',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Echec.'); return; }
        expCloseRetourClient();
        pushNotif('ok','fa-box-open','Retour client recu \\u00b7 BL <strong>'+j.bl_id+'</strong> cree'+(j.cmd_id?' (commande '+j.cmd_id+')':'')+'. Controle qualite a faire.',7000);
        setTimeout(function(){ location.hash='receptions'; softReload(); },900);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); });
  }


  // Onglet initial : honore le hash (#bc, #bl, …) sinon Bons de Commande par défaut
  (function(){ try{ var h=(location.hash||'').replace('#',''); expShowTab(EXP_TABS.indexOf(h)>=0?h:'calendrier'); }catch(e){} })();
  </script>

  <style>
  </style>`

  return layout('Service Expeditions', content + demandeAchatModal('Expéditions', '#f59e0b'), 'service-expeditions')
}
