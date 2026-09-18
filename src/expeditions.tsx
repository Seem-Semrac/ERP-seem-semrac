// ══════════════════════════════════════════════════════════════
// EXPÉDITIONS – Service Expéditions unifié
// Réceptions · Envois · Calendrier · Fournisseurs · Dashboard
// ══════════════════════════════════════════════════════════════
import { escX, layout, serviceHeader, demandeAchatModal, buildValDirMap } from './shared'
import type { BonDeLivraison, BonDeCommande, Commande, DemandeAchat, FournisseurSt } from './types'
import { MODES_ARRIVEE } from './reception'
import { GRAVITES_NC, GRAVITE_DEFAUT, OBS_GENERALE_MAX } from './pv_reception'
// Lot H2 (18/09/2026) : un sous-lot (LOT-…-01.02, lot_parent) est un sous-ensemble INTERNE d'une pièce mère — ni libéré
// seul, ni expédié : la libération et le BL portent sur le lot RACINE (arbitrage A8). Module pur, rendu serveur.
import { parentDuLot } from './nomenclature_arbre'


const AMB   = '#f59e0b'
const AMB_D = '#d97706'
const TODAY = new Date().toISOString().slice(0, 10)

// ─── Replis : listes vides quand la base ne renvoie rien ──────────────

const BL_CLIENTS_DEFAULT: BonDeLivraison[] = []

const BST_DEFAULT: BonDeLivraison[] = []

// ─── Helpers ──────────────────────────────────────────────────

const TH  = (t: string) => `<th style="text-align:left;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;">${t}</th>`
// En-tête qui PEUT passer à la ligne (tableau des lignes du PV : les en-têtes en nowrap élargissaient le tableau au-delà de la fenêtre).
const THW_STYLE = 'text-align:left;padding:8px 10px;font-size:.66rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;letter-spacing:.03em;vertical-align:bottom;'
const THW = (t: string) => `<th style="${THW_STYLE}">${t}</th>`
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
// Lot D (vérification 14/09/2026) : un BC « recu_partiel » qui a encore un reste à recevoir n'est PAS reçu —
// c'est le cas du lot à REMPLACER décidé par la Qualité (le BC est rouvert, qte_recue diminuée). Sans cela,
// « Traiter » disparaissait du planning alors que la route de réception accepte le reste : le lot de
// remplacement ne pouvait plus être réceptionné à l'écran (la quantité n'est plus saisie depuis le lot D).
// 15/09/2026 : le seul reste à recevoir ne suffit pas — des BC déjà réceptionnés et passés au PV avec
// l'ancienne saisie de quantité revenaient dans « À réceptionner ». « recu_partiel » n'est à réceptionner
// QUE si un reliquat est réellement attendu (attend_reliquat, calculé par bcsView : livraison partielle
// déclarée, ou lot de remplacement décidé par la Qualité). Sinon c'est une réception faite.
const _bcRecu = (b: any) => String(b.statut) === 'recu_partiel'
  ? b.attend_reliquat !== true
  : (['recu_total', 'recu', 'controle', 'cloture'].includes(String(b.statut)) || !!b.bl_id)

// Construit TOUS les mouvements à partir des tables réelles. Utilisé par les 3 onglets.
function collecterMouvements(bcs: any[], bds: any[], blsClient: any[], blsRetour: any[], ncs: any[], cmds: any[]): Mvt[] {
  const out: Mvt[] = []

  // ── ARRIVÉES ──
  for (const b of bcs || []) {
    if (String(b.statut) === 'annule') continue
    // Lot F : un BC de reliquat dont la date d'arrivée attend la validation des Achats n'est pas encore une arrivée.
    if (b.date_a_valider === true && !b.bl_id && !b.date_reception_reelle) continue
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
function panelReceptions(bcs: any[], _bcsAttendus: any[], receptions: any[], bds: any[], _ncs: any[], blsRetour: any[], _vdMap: Record<string, any>, _hasAck: boolean, today: string, pvParBl: Record<string, any> = {}, quarParBl: Record<string, any> = {}, peutEcrire = true) {
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

  // Bouton d'ouverture du PV (Lot D · D2) : délégation d'événements (classe exp-pv-open + data-bc / data-bl), jamais
  // de chaîne venue de la base dans un onclick. Grisé pour qui n'a pas l'écriture Expéditions (le serveur refuse : 403).
  const boutonPV = (bcId: any, blId: any, libelle: string, icone: string, style: string, titre: string): string => peutEcrire
    ? `<button type="button" class="exp-pv-open" data-bc="${escX(bcId)}" data-bl="${escX(blId ?? '')}" title="${escX(titre)}" style="${style}cursor:pointer;"><i class="fas ${icone}" style="margin-right:4px;"></i>${libelle}</button>`
    : `<button type="button" disabled title="PV réservé aux personnes ayant l’écriture sur les Expéditions" style="${style}cursor:not-allowed;opacity:.55;"><i class="fas fa-lock" style="margin-right:4px;"></i>${libelle}</button>`
  // L'état du contrôle de la réception : c'est lui qui décide si le contenu est en stock.
  const etatPV = (b: any): string => {
    if (!b.bc_id) return '<span style="color:#cbd5e1;font-size:.7rem;">—</span>'
    const pv = pvParBl[String(b.id)]
    if (!pv) return boutonPV(b.bc_id, b.id, 'PV à faire', 'fa-hourglass-half', 'background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:7px;padding:5px 10px;font-size:.68rem;font-weight:700;', 'Faire le PV de contrôle : quantité reçue ligne par ligne, puis les quantités conformes partent en Mise en stock')
    if (String(pv.decision || '') === 'libere') return `<span title="PV conforme : les quantités reçues sont parties dans Stock › Mise en stock" style="background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:700;white-space:nowrap;"><i class="fas fa-check" style="margin-right:4px;"></i>Conforme · ${escX(pv.num_pv || '')}</span>`
    // Non conforme : dire ce que la Qualité en a fait, sinon la ligne reste « bloquée » pour
    // toujours à l'écran alors que le lot est renvoyé, dérogé ou partiellement accepté.
    // Lot F : un PV peut porter PLUSIEURS quarantaines (une par ligne qualitative) — ou aucune (écarts quantitatifs seuls).
    const qs: any[] = Array.isArray(quarParBl[String(b.id)]) ? quarParBl[String(b.id)] : []
    const nb = (v: any) => String(Math.round((Number(v) || 0) * 1000) / 1000).replace('.', ',')
    const suiteDe = (q: any): string => String(q.issue || '') === 'retour_fournisseur' ? ('renvoyé au fournisseur' + (q.retour_expedie_le ? ' · expédié' : ' · à expédier'))
      : String(q.issue || '') === 'derogation_fournisseur' ? 'dérogation fournisseur · accepté'
      : String(q.issue || '') === 'entree_partielle' ? ('entrée partielle ' + nb(q.qte_acceptee) + '/' + nb(q.qte))
      : (String(q.statut || '') === 'en_cours' ? 'en quarantaine — décision Qualité attendue' : '')
    const suites = Array.from(new Set(qs.map(suiteDe).filter(Boolean)))
    const suite = qs.length > 1 ? (qs.length + ' quarantaines : ' + suites.join(' · ')) : suites.join(' · ')
    return `<span title="PV non conforme : lignes en écart en non-conformité (et en quarantaine si qualitatives) ; les quantités conformes sont parties en Mise en stock" style="background:#fee2e2;color:#b91c1c;border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:700;white-space:nowrap;"><i class="fas fa-ban" style="margin-right:4px;"></i>Non conforme · ${escX(pv.num_pv || '')}</span>${suite ? `<div style="font-size:.62rem;color:#64748b;margin-top:3px;">→ ${escX(suite)}</div>` : ''}`
  }

  // Informations saisies à la réception (Lot D) : N° de BL / de commande fournisseur et, hors France, poids,
  // nomenclature douane, code EWX, mode d'arrivée. Relues ICI (sinon seulement en SQL) et corrigibles (écriture Expéditions).
  const nbFr = (v: any) => String(Math.round((Number(v) || 0) * 1000) / 1000).replace('.', ',')
  const infosReception = (b: any): string => {
    if (!b.bc_id || b.nc_id) return ''
    const refs = [b.num_bl_fournisseur ? 'BL fourn. ' + b.num_bl_fournisseur : '', b.num_commande_fournisseur ? 'Cde fourn. ' + b.num_commande_fournisseur : ''].filter(Boolean).join(' · ')
    const hf = b.hors_france === true
      ? [b.poids_matiere_kg != null ? nbFr(b.poids_matiere_kg) + ' kg' : '', b.num_nomenclature ? 'nomenclature ' + b.num_nomenclature : '', b.code_ewx != null ? 'EWX ' + b.code_ewx : '', b.mode_arrivee || ''].filter(Boolean).join(' · ')
      : ''
    const corriger = ('num_bl_fournisseur' in b)
      ? (peutEcrire
        ? `<button type="button" class="exp-rec-edit" data-bl="${escX(b.id)}" title="Corriger les informations de réception (N° fournisseur, douane…)" style="margin-left:6px;background:none;border:none;color:#0369a1;font-size:.62rem;font-weight:700;cursor:pointer;text-decoration:underline;padding:0;"><i class="fas fa-pen" style="margin-right:3px;"></i>Corriger</button>`
        : '')
      : ''
    if (!refs && !hf && !corriger) return ''
    return `<div style="font-size:.64rem;color:#0369a1;margin-top:3px;">${escX(refs || 'Aucune référence fournisseur')}${corriger}</div>`
      + (hf ? `<div style="margin-top:3px;"><span title="Réception hors France" style="background:#e0f2fe;color:#075985;border-radius:999px;padding:1px 8px;font-size:.6rem;font-weight:800;">Hors France</span> <span style="font-size:.64rem;color:#475569;">${escX(hf)}</span></div>` : '')
  }
  const ligneRecue = (b: any, couleur: string) => tr([
    TD(`<div style="font-weight:700;color:${couleur};">${escX(numBL(b))}</div><div style="font-size:.65rem;color:#94a3b8;">${escX(b.bc_id ?? b.cmd_id ?? '')}</div>`),
    TD(escX(b.client_nom ?? b.fournisseur_nom ?? '—')),
    TD(`<span style="font-size:.75rem;color:#475569;">${escX(b.piece ?? b.operation ?? '—')}</span>${infosReception(b)}`),
    TDC(`<span style="font-weight:700;">${_frDate(b.date_bl)}</span>`),
    TDC(`<span style="font-weight:700;">${b.qte != null && String(b.qte).trim() !== '' ? escX(nbFr(b.qte)) : '—'}</span>`),
    TDC(etatPV(b)),
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
      ? boutonPV(s.bc_id, '', 'PV de contrôle', 'fa-clipboard-check', 'background:#fef2f2;color:#b91c1c;border:none;border-radius:7px;padding:5px 10px;font-size:.68rem;font-weight:700;', 'Remplir le PV de contrôle de ce retour')
      : '<span style="color:#cbd5e1;font-size:.7rem;">—</span>'),
  ])).join('')

  const COLS = ['N° BL', 'Fournisseur / Client', 'Pièce / Articles', '#Reçu le', '#Qté', '#Contrôle']

  return `
  <div id="exp-panel-receptions" style="display:none;">
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 16px;margin-bottom:18px;font-size:.8rem;color:#1d4ed8;">
      <i class="fas fa-clipboard-check" style="margin-right:7px;"></i><strong>Ce qui est arrivé</strong> — une ligne entre ici au moment de la réception, et c'est d'ici qu'on remplit le <strong>PV de contrôle</strong> (quantité reçue ligne par ligne). Les quantités conformes partent dans <strong>Stock › Mise en stock</strong> ; le stock est crédité au rangement. Ce qui reste attendu est dans l'onglet <strong>Calendrier</strong>.
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
function panelEnvois(bds: any[], blsClient: any[], cmds: any[], qualiteBloque: (c: any) => string | null, today: string, bdsBloc: Record<string, string> = {}, retoursFourn: any[] = []) {
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
    // La porte de gamme prime sur le statut : tant que l'opération précédente n'est pas
    // soldée, ce BST ne peut pas partir — autant le lire ici plutôt qu'au moment du refus.
    TDC(bdsBloc[String(s.id)]
      ? `<span style="background:#fef3c7;color:#92400e;border-radius:999px;padding:2px 9px;font-size:.66rem;font-weight:700;" title="${escX(bdsBloc[String(s.id)])}"><i class="fas fa-lock" style="margin-right:4px;"></i>attend ${escX(bdsBloc[String(s.id)].split(' ')[0])}</span>`
      : blStatutBadge(s.statut)),
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

    ${card('Retours fournisseurs', 'fa-truck-arrow-right', '#b91c1c', (retoursFourn || []).length, 'lots refusés au contrôle que la Qualité a décidé de renvoyer',
      H(['BL / Lot', 'Fournisseur', 'Pièce', '#Qté à renvoyer', '#Décidé le', '#Départ']) + ((retoursFourn || []).map((q: any) => tr([
        TD(`<div style="font-weight:700;color:#b91c1c;">${escX(q.bl_id || q.lot_id || q.id)}</div><div style="font-size:.65rem;color:#94a3b8;">${escX([q.bc_id ? 'BC ' + q.bc_id : '', q.nc_id ? 'NC ' + q.nc_id : ''].filter(Boolean).join(' · '))}</div>`),
        TD(escX(q.fournisseur_nom ?? q.client_nom ?? '—')),
        TD(`<span style="font-size:.75rem;color:#475569;">${escX(q.piece ?? '—')}</span><div style="font-size:.63rem;color:#94a3b8;">${escX(String(q.compensation || '') === 'remplacement' ? 'remplacement attendu' : 'avoir réclamé')}</div>`),
        TDC(`<span style="font-weight:700;">${escX(String(q.qte_retour ?? '—'))}</span>`),
        TDC(`<span style="font-size:.72rem;color:#64748b;">${_frDate(q.decision_le)}</span>`),
        TDC(`<button onclick="expRetourFournExpedie('${escX(q.id)}','${escX(q.bl_id || q.lot_id || q.id)}')" title="Le lot est parti chez le fournisseur" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:7px;padding:5px 10px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-truck-arrow-right" style="margin-right:4px;"></i>Expédié</button>`),
      ])).join('') || vide(6, 'Aucun lot à renvoyer')) + '</tbody></table>')}
    <div style="font-size:.7rem;color:#94a3b8;margin-top:-8px;margin-bottom:16px;padding-left:4px;">
      <i class="fas fa-lock" style="margin-right:5px;"></i>Un BST ne part chez le sous-traitant qu'une fois l'opération précédente de la gamme soldée. Le départ se déclenche depuis l'onglet <strong>Calendrier</strong>.
    </div>
  </div>`
}

function panelCalendrier(mvts: Mvt[], today: string, bdsBloc: Record<string, string> = {}) {
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
    // Porte de gamme : un BST dont l'opération précédente n'est pas soldée ne peut pas
    // partir. On retire le bouton ET on affiche la raison — un bouton qui s'évapore sans
    // explication fait croire à une panne.
    const verrou = m.kind === 'bds_envoi' ? (bdsBloc[String(m.id)] || '') : ''
    const act = verrou ? ''
      : m.kind === 'bc' ? `expOpenReception('${escX(m.id)}')`
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
      ${verrou ? `<span style="margin-left:auto;background:#fef3c7;color:#92400e;border-radius:999px;padding:3px 11px;font-size:.66rem;font-weight:700;"><i class="fas fa-lock" style="margin-right:5px;"></i>${escX(verrou)}</span>` : ''}
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
        // Lot D : la réception ne saisit plus le transporteur → à défaut, le N° de BL du fournisseur.
        transporteur: l.transport || l.transporteur_ref || '', bl_fournisseur: l.num_bl_fournisseur || '', bc: l._bc, affaire: l._affaire,
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
            + '<td style="padding:8px 10px;font-size:.76rem;color:#475569;">'+(l.transporteur?esc(l.transporteur):(l.bl_fournisseur?'<span style="color:#64748b;">BL fourn. </span>'+esc(l.bl_fournisseur):'<span style="color:#cbd5e1;">non renseigné</span>'))+'</td>'
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
          + '<div style="border:1px solid #eef2f7;border-radius:10px;overflow:hidden;"><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;"><th style="'+th+'">N° BL</th><th style="'+th+'">Date</th><th style="'+th+'">Transporteur / BL fourn.</th><th style="'+th+'">BC lié</th><th style="'+th+'">Affaire</th></tr></thead><tbody>'+blRows+'</tbody></table></div></div>'
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
  extra: { bds?: any[]; today?: string; fournisseurs?: any[]; bdsBlocages?: Record<string, string>; pvs?: any[];
    // Lot D · D2 (PV de contrôle) : contrôleurs éligibles (id + nom), lecture des salariés en échec, droit d'écriture
    // Expéditions de la personne connectée, son id (pré-sélection du contrôleur), lien PDF du BC autorisé.
    controleurs?: { id: string; nom: string }[]; controleursIndisponibles?: boolean; peutEcrireExpeditions?: boolean; utilisateurId?: string | null; pdfBcAutorise?: boolean } = {},   // BDS réels (bons_sous_traitance) + date du jour calculée par requête
) => {
  const TODAY_REQ = extra.today || TODAY          // ⚠ le TODAY du module est figé au chargement (isolate réutilisée)
  const FOURNS = extra.fournisseurs ?? []   // référentiel fournisseurs (onglet Fournisseurs)
  const BDS = extra.bds ?? []                     // vrais bons de sous-traitance (la page n'en avait jamais eu)
  // Porte de gamme : pour CHAQUE BST, l'opération qui le retient encore — calculée par le
  // serveur avec la fonction qui refusera vraiment l'envoi (src/gamme.ts). On n'expédie pas
  // une pièce dont l'opération précédente n'est pas soldée.
  const BDS_BLOC: Record<string, string> = extra.bdsBlocages ?? {}
  // PV de contrôle (Lot D · D2). Repli sans données (harnais, captures) : aucun contrôleur, écriture permise (le serveur tranche).
  const CONTROLEURS = (Array.isArray(extra.controleurs) ? extra.controleurs : []).filter((x: any) => x && x.id != null).map((x: any) => ({ id: String(x.id), nom: String(x.nom ?? x.id) }))
  const PEUT_ECRIRE_EXP = extra.peutEcrireExpeditions !== false
  const PV_JSON = JSON.stringify({ controleurs: CONTROLEURS, indisponibles: extra.controleursIndisponibles === true,
    utilisateur: typeof extra.utilisateurId === 'string' ? extra.utilisateurId : null, peutEcrire: PEUT_ECRIRE_EXP, pdfBc: extra.pdfBcAutorise !== false }).replace(/</g, '\\u003c')
  // État du PV de CHAQUE réception (clé : n° de BL) : l'écran doit dire, ligne par ligne, où en est le contrôle
  // (Lot F : les quantités conformes partent en Mise en stock au PV, le stock est crédité au rangement).
  const PV_PAR_BL: Record<string, any> = {}
  ;(extra.pvs ?? []).forEach((p: any) => { if (p && p.bl_id && String(p.type_controle || '') === 'reception') PV_PAR_BL[String(p.bl_id)] = p })
  // Quarantaines de RÉCEPTION par n° de BL : l'écran doit dire ce que la Qualité a décidé du lot
  // refusé (renvoyé, dérogé, partiellement accepté) — et lister ce qui reste à faire PARTIR.
  // Lot F (15/09/2026) : une LISTE par BL — un PV crée une quarantaine par ligne qualitative (avant : la dernière gagnait).
  const QUAR_PAR_BL: Record<string, any[]> = {}
  ;(dbQuar ?? []).forEach((q: any) => { if (!q || (!q.bc_id && !q.pv_id)) return; const k = String(q.bl_id || q.lot_id || ''); if (k) (QUAR_PAR_BL[k] = QUAR_PAR_BL[k] || []).push(q) })
  const RETOURS_FOURN = (dbQuar ?? []).filter((q: any) => q && q.issue && Number(q.qte_retour) > 0 && !q.retour_expedie_le)
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
  // ⚠ 'libere_derogation' manquait : un lot libéré sous dérogation restait « ouvert » et bloquait
  //   l'expédition de l'affaire pour toujours.
  const _qOpen = (s: any) => !['cloture', 'cloturé', 'clôturé', 'fermee', 'fermé', 'fermée', 'resolu', 'résolu', 'resolue', 'résolue', 'libere', 'libéré', 'liberee', 'libérée', 'libere_derogation', 'rejete', 'rejeté'].includes(String(s || '').toLowerCase())
  const qualiteBloque = (c: any): string | null => {
    const aff = String(c.num_affaire || c.id)
    const lotIds = new Set((dbLots ?? []).filter((l: any) => String(l.cmd_id) === String(c.id) || String(l.id || '').indexOf(aff) !== -1).map((l: any) => String(l.id)))
    const nc = (dbNcs ?? []).find((n: any) => _qOpen(n.statut) && /critique|bloquante/i.test(String(n.gravite || '')) && String(n.lot_ref || '').indexOf(aff) !== -1)
    if (nc) return 'NC ' + (nc.id || '') + ' · ' + (nc.gravite || '')
    const q = (dbQuar ?? []).find((x: any) => _qOpen(x.statut) && (lotIds.has(String(x.lot_id)) || String(x.lot_id || '').indexOf(aff) !== -1))
    if (q) return 'Quarantaine ' + (q.id || '')
    // Porte LIBÉRATION : tous les lots de la commande doivent avoir été libérés (contrôle qualité final) avant expédition.
    // Lot H2 : lots RACINES seulement — un sous-lot n'est jamais libéré seul (il suit son lot racine). Les quarantaines
    // ci-dessus, elles, comptent aussi les sous-lots (voulu : un sous-ensemble en quarantaine bloque l'affaire).
    const lotsC = (dbLots ?? []).filter((l: any) => !parentDuLot(l) && (String(l.cmd_id) === String(c.id) || String(l.id || '').indexOf(aff) !== -1))
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
  // Contenu COMMERCIAL du BC (lignes et prix unitaires, notes, conditions de paiement, montant HT) : il ne sert qu'à la
  // réception et au PV, réservés à l'écriture Expéditions. Un lecteur (opérateur, qualité, commercial…) ne le reçoit pas
  // dans la page ; les prix unitaires suivent en plus le droit au PDF du BC (famille achats) — même règle que ce PDF.
  const DETAIL_BC = PEUT_ECRIRE_EXP
  const PRIX_BC = DETAIL_BC && extra.pdfBcAutorise !== false
  const BC_JSON = JSON.stringify((BCS as any[]).map((b: any) => ({ id:b.id, num_bc:b.num_bc||b.id, type:b.type, fournisseur:b.fournisseur||'', articles:b.articles||'', montant:b.montant||0, affaire_id:b.affaire_id||'', num_affaire:b.num_affaire||'', bl_propose:b.bl_propose||'', statut:b.statut, bl_id:b.bl_id||'', date_livraison_prevue:b.date_livraison_prevue||'',
    // Lot D (14/09/2026) — réception + PV : valeurs CALCULÉES par le serveur (bcsView, src/reception.ts). Tout champ lu
    // par le JS client DOIT être ici : une projection tronquée ne réaffiche pas et fait réécrire vide.
    qte_commandee: (b.qte_commandee_num ?? null), qte_commandee_texte: (b.qte_commandee == null ? '' : String(b.qte_commandee)), qte_source: (b.qte_source || null),
    qte_recue: (Number(b.qte_recue_num) || 0), reste: (b.reste_a_recevoir ?? null),
    multi_articles: b.multi_articles === true, stock_multi_ok: (b.stock_multi_ok === true ? true : (b.stock_multi_ok === false ? false : null)),
    lignes: (DETAIL_BC && Array.isArray(b.lignes) ? b.lignes.map((l: any) => (PRIX_BC ? l : { ...l, prix_unitaire: null })) : []), affaires: (Array.isArray(b.affaires) ? b.affaires : []),
    certificat_matiere_requis: b.certificat_matiere_requis === true,
    date_bc: b.date_bc || '', montant_ht: (DETAIL_BC ? (Number(b.montant_ht ?? b.montant ?? 0) || 0) : 0), notes: (DETAIL_BC ? (b.notes || '') : ''), conditions_paiement: (DETAIL_BC ? (b.conditions_paiement || '') : ''), categorie: b.categorie || '' }))).replace(/</g, '\\u003c')   // sinon un '<' dans un libelle casse le <script>
  // Réceptions enregistrées (BL) : quantité reçue et informations de réception, lues par le PV et la correction.
  const BLREC_JSON = JSON.stringify(Object.fromEntries((BLS_RECEPTION as any[]).map((l: any) => [String(l.id), {
    bc_id: l.bc_id || '', qte: (l.qte == null || String(l.qte).trim() === '' ? null : Number(l.qte)), date_bl: l.date_bl || '',
    num_commande_fournisseur: l.num_commande_fournisseur || '', num_bl_fournisseur: l.num_bl_fournisseur || '',
    hors_france: (l.hors_france === true ? true : (l.hors_france === false ? false : null)),
    poids_matiere_kg: (l.poids_matiere_kg == null ? null : Number(l.poids_matiere_kg)), num_nomenclature: l.num_nomenclature || '',
    code_ewx: (l.code_ewx == null ? null : Number(l.code_ewx)), mode_arrivee: l.mode_arrivee || '',
    infos_col: ('num_bl_fournisseur' in l),
  }]))).replace(/</g, '\\u003c')
  // Lots & commandes (pour le BL partiel) : SEULS les lots LIBÉRÉS (contrôle qualité final passé) sont expédiables.
  // Lot H2 : et seulement les lots RACINES — un sous-lot s'expédie avec son lot racine (le serveur refuse : 409 sous_lot_non_expediable).
  const LOTS_EXP = (dbLots ?? []).filter((l:any) => l.statut === 'libere' && !parentDuLot(l))
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
             : id === 'envois' ? ((MOUVEMENTS.filter(m => m.sens === 'out' && !m.fait).length + RETOURS_FOURN.length) || undefined)
             : id === 'calendrier' ? (MOUVEMENTS.filter(m => !m.fait && m.date && m.date <= TODAY_REQ).length || undefined)
             : undefined,
      })),
      switchFn: 'expShowTab',
      tabIdPrefix: 'exp-tab',
      activeId: 'calendrier'
    })}

    <div style="padding:22px 30px;">
      ${panelEnvois(BDS, BLS, CMDS, qualiteBloque, TODAY_REQ, BDS_BLOC, RETOURS_FOURN)}
      ${panelReceptions(BCS, BCS_A_RECEVOIR, BLS_RECEPTION, BDS, dbNcs ?? [], BLS_RETOUR, VD_MAP, !!dbHasAck, TODAY_REQ, PV_PAR_BL, QUAR_PAR_BL, PEUT_ECRIRE_EXP)}
      ${panelCalendrier(MOUVEMENTS, TODAY_REQ, BDS_BLOC)}
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
    <div style="background:white;border-radius:16px;max-width:620px;width:94%;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">
      <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#0ea5e9,#0284c7);flex-shrink:0;">
        <div id="rec_titre" style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-truck-loading" style="margin-right:8px;"></i>Réception — Lier le BC à un BL</div>
        <button onclick="expCloseRecep()" style="color:rgba(255,255,255,.8);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:22px;overflow-y:auto;">
        <input type="hidden" id="rec_bc_id"/>
        <input type="hidden" id="rec_bl_corr"/>
        <div id="rec_info" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#075985;"></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
          <div id="rec_numbl_box"><label style="${FLBL}">N° BL interne <span style="font-weight:500;color:#94a3b8;text-transform:none;letter-spacing:0;">· repris du BC</span></label><input id="rec_numbl" type="text" placeholder="attribué automatiquement" style="${FINP}"/></div>
          <div id="rec_affaire_box"><label style="${FLBL}">N° d'affaire <span style="font-weight:500;color:#94a3b8;text-transform:none;letter-spacing:0;">· repris du BC</span></label><input id="rec_affaire" type="text" placeholder="aucune affaire rattachée" style="${FINP}"/></div>
          <div><label for="rec_numcmdf" style="${FLBL}">N° de commande fournisseur <span style="color:#dc2626;">*</span></label><input id="rec_numcmdf" type="text" maxlength="100" autocomplete="off" placeholder="N° de commande chez le fournisseur" style="${FINP}"/></div>
          <div><label for="rec_numblf" style="${FLBL}">N° de BL fournisseur <span style="color:#dc2626;">*</span></label><input id="rec_numblf" type="text" maxlength="100" autocomplete="off" placeholder="N° du bon de livraison du fournisseur" style="${FINP}"/></div>
        </div>
        <div id="rec_qte_info" style="margin-top:12px;border-radius:10px;padding:9px 12px;font-size:.76rem;white-space:pre-line;"></div>
        <!-- Quantité : pas de champ dans le cas normal (reste à recevoir). Une exception : quantité commandée du BC inconnue
             (vérification du lot D, 14/09/2026). Lot F (15/09/2026) : la case « Livraison partielle » est retirée — la quantité
             reçue et le reliquat annoncé se déclarent au PV de contrôle, ligne par ligne. -->

        <div id="rec_qte_box" style="display:none;margin-top:10px;max-width:280px;">
          <label for="rec_qte_livree" id="rec_qte_lbl" style="${FLBL}">Quantité livrée <span style="color:#dc2626;">*</span></label>
          <input id="rec_qte_livree" type="text" inputmode="decimal" autocomplete="off" placeholder="lue sur le BL fournisseur" style="${FINP}"/>
          <div id="rec_qte_note" style="font-size:.68rem;color:#64748b;margin-top:4px;"></div>
        </div>
        <div style="margin-top:14px;">
          <div style="${FLBL}">Réception hors France ? <span style="color:#dc2626;">*</span></div>
          <div id="rec_hf_group" style="display:flex;gap:10px;border-radius:10px;">
            <label style="flex:1;display:flex;align-items:center;gap:8px;border:1.5px solid #e2e8f0;background:#f8fafc;border-radius:10px;padding:9px 12px;cursor:pointer;font-size:.82rem;font-weight:700;color:#374151;"><input type="radio" name="rec_hf" id="rec_hf_oui" value="oui" onchange="expRecHF()"/> Oui</label>
            <label style="flex:1;display:flex;align-items:center;gap:8px;border:1.5px solid #e2e8f0;background:#f8fafc;border-radius:10px;padding:9px 12px;cursor:pointer;font-size:.82rem;font-weight:700;color:#374151;"><input type="radio" name="rec_hf" id="rec_hf_non" value="non" onchange="expRecHF()"/> Non</label>
          </div>
        </div>
        <div id="rec_hf_box" style="display:none;margin-top:12px;border:1.5px dashed #bae6fd;border-radius:10px;padding:12px;background:#f8fcff;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
            <div><label for="rec_poids" style="${FLBL}">Poids matière (kg) <span style="color:#dc2626;">*</span></label><input id="rec_poids" type="text" inputmode="decimal" autocomplete="off" placeholder="ex. 125,5" style="${FINP}"/></div>
            <div><label for="rec_nomenc" style="${FLBL}">N° de nomenclature (douane) <span style="color:#dc2626;">*</span></label><input id="rec_nomenc" type="text" maxlength="100" autocomplete="off" placeholder="code douanier du produit" style="${FINP}"/></div>
            <div><label for="rec_ewx" style="${FLBL}">Code EWX <span style="color:#dc2626;">*</span></label><select id="rec_ewx" style="${FINP}"><option value="">— Choisir —</option><option value="1">1</option><option value="2">2</option></select></div>
            <div><label for="rec_mode" style="${FLBL}">Mode d'arrivée <span style="color:#dc2626;">*</span></label><select id="rec_mode" style="${FINP}"><option value="">— Choisir —</option>${MODES_ARRIVEE.map(m => `<option value="${escX(m)}">${escX(m)}</option>`).join('')}</select></div>
          </div>
        </div>
      </div>
      <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;">
        <button onclick="expCloseRecep()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button id="rec_btn" onclick="expSubmitRecep()" style="padding:9px 18px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i><span id="rec_btn_lbl">Valider la réception</span></button>
      </div>
    </div>
  </div>

  <!-- MODAL PV DE CONTRÔLE RÉCEPTION — Lot D · D2 (14/09/2026) : Conforme / Non conforme ligne par ligne, certificat matière, contrôleur -->
  <div id="exp-pv-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;max-width:1040px;width:96%;max-height:94vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">
      <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#ef4444,#b91c1c);flex-shrink:0;">
        <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-clipboard-check" style="margin-right:8px;"></i>PV de contrôle à réception</div>
        <button type="button" onclick="expClosePV()" style="color:rgba(255,255,255,.8);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:20px 22px;overflow-y:auto;">
        <input type="hidden" id="pv_bc_id"/>
        <input type="hidden" id="pv_bl_id"/>
        <div id="pv_info" style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#991b1b;"></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;align-items:start;">
          <div>
            <div style="${FLBL}">Résultat du contrôle <span style="color:#dc2626;">*</span></div>
            <div id="pv_res_group" style="display:flex;gap:10px;border-radius:10px;">
              <label style="flex:1;display:flex;align-items:center;gap:8px;border:1.5px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:10px 12px;cursor:pointer;font-size:.82rem;font-weight:700;color:#15803d;"><input type="radio" name="pv_res" id="pv_res_ok" value="conforme" onchange="expPVToggle()"/> Conforme</label>
              <label style="flex:1;display:flex;align-items:center;gap:8px;border:1.5px solid #fecaca;background:#fef2f2;border-radius:10px;padding:10px 12px;cursor:pointer;font-size:.82rem;font-weight:700;color:#b91c1c;"><input type="radio" name="pv_res" id="pv_res_nc" value="non_conforme" onchange="expPVToggle()"/> Non conforme</label>
            </div>
          </div>
          <div>
            <label for="pv_ctrl" style="${FLBL}">Contrôleur <span style="color:#dc2626;">*</span></label>
            <select id="pv_ctrl" style="${FINP}"><option value="">— Choisir le contrôleur —</option></select>
            <div id="pv_ctrl_note" style="font-size:.68rem;color:#64748b;margin-top:4px;">Seules les personnes ayant l’écriture sur les Expéditions peuvent être contrôleur.</div>
          </div>
        </div>
        <div id="pv_cert_box" style="display:none;margin-top:14px;border:1.5px solid #c4b5fd;background:#f5f3ff;border-radius:10px;padding:10px 12px;">
          <label style="display:flex;align-items:center;gap:8px;font-size:.84rem;font-weight:700;color:#5b21b6;cursor:pointer;"><input type="checkbox" id="pv_cert"/> Certificat matière reçu et conforme</label>
          <div style="font-size:.7rem;color:#6d28d9;margin-top:4px;">Exigé par le bon de commande. Sans cette case cochée, le PV ne peut pas être conforme : il passe en non conforme (« certificat matière absent ou non conforme »).</div>
        </div>
        <!-- Lot F (15/09/2026) : en-tête du BC en non conforme ; tableau des lignes (quantité reçue à côté de la prévue) TOUJOURS visible -->
        <div id="pv_bc_box" style="display:none;margin-top:16px;">
          <div style="${FLBL}">Bon de commande</div>
          <div id="pv_bc_head" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:.78rem;"></div>
        </div>
        <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:14px;flex-wrap:wrap;">
          <div style="flex:1;min-width:260px;">
            <div style="${FLBL}margin-bottom:2px;">Lignes du bon de commande · quantité reçue à côté de la quantité prévue</div>
            <div style="font-size:.68rem;color:#64748b;margin-bottom:6px;">Une ligne est <strong>non conforme</strong> si la quantité reçue diffère de la prévue sans reliquat annoncé par le fournisseur (quantitatif) ou si une observation est écrite (qualitatif). Un reliquat annoncé n’est pas un écart : il devient un bon de commande de reliquat aux Achats.</div>
          </div>
          <button type="button" onclick="expPvToutRecu()" style="margin-bottom:6px;padding:4px 10px;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;border-radius:7px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-check-double" style="margin-right:4px;"></i>Tout reçu comme prévu</button>
        </div>
        <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:10px;">
          <table style="width:100%;border-collapse:collapse;font-size:.76rem;">
            <thead><tr style="background:#fafafa;">${['N°', 'Référence', 'Désignation', 'Qté prévue', 'Qté reçue', 'Reliquat annoncé', 'Conforme ?', 'Observation'].map(t => THW(t)).join('')}<th id="pv_th_pu" style="${THW_STYLE}">PU HT</th>${['Affaire', 'DA · Lot · Opération'].map(t => THW(t)).join('')}</tr></thead>
            <tbody id="pv_lignes"></tbody>
          </table>
        </div>
        <div id="pv_lignes_note" style="display:none;font-size:.68rem;color:#64748b;margin-top:4px;">* Ligne reconstituée : le bon de commande ne détaille pas ses lignes (articles et quantité commandée).</div>
        <div id="pv_ok_note" style="display:none;font-size:.72rem;color:#15803d;margin-top:10px;"><i class="fas fa-dolly" style="margin-right:5px;"></i>Conforme : les quantités reçues partent dans <strong>Stock › Mise en stock</strong> (rangement) ; un reliquat annoncé génère un bon de commande de reliquat aux Achats, date d’arrivée à valider.</div>
        <div id="pv_nc_box" style="display:none;margin-top:16px;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:14px;">
            <div style="grid-column:1/-1;"><label for="pv_obs_gen" style="${FLBL}">Observation générale <span style="font-weight:500;color:#94a3b8;text-transform:none;letter-spacing:0;">· facultative</span></label><textarea id="pv_obs_gen" rows="3" maxlength="${OBS_GENERALE_MAX}" placeholder="Constat d’ensemble sur la réception…" style="${FINP}resize:vertical;"></textarea></div>
            <div><label for="pv_gravite" style="${FLBL}">Gravité de la non-conformité</label><select id="pv_gravite" style="${FINP}">${GRAVITES_NC.map(g => `<option value="${escX(g)}"${g === GRAVITE_DEFAUT ? ' selected' : ''}>${escX(g)}</option>`).join('')}</select></div>
          </div>
          <div style="font-size:.72rem;color:#b91c1c;margin-top:10px;"><i class="fas fa-exclamation-triangle" style="margin-right:5px;"></i>Une fiche de non-conformité fournisseur est créée <strong>pour chaque ligne en écart</strong> (quantitative, qualitative ou les deux) et envoyée au service Qualité. Une ligne qualitative part <strong>en quarantaine</strong> (la Qualité y décide du renvoi, d’une dérogation ou d’une entrée partielle) ; les quantités conformes partent dans Stock › Mise en stock ; un excédent est soumis à la Direction ; un reliquat annoncé génère un bon de commande de reliquat aux Achats. Certificat matière absent : toute la réception reste bloquée en quarantaine.</div>
        </div>
      </div>
      <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0;">
        <button type="button" onclick="expClosePV()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button type="button" id="pv_btn" onclick="expSubmitPV()" style="padding:9px 18px;background:linear-gradient(135deg,#ef4444,#b91c1c);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane" style="margin-right:5px;"></i>Valider le PV</button>
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
  var EXP_PV=${PV_JSON};   // PV de contrôle : contrôleurs éligibles, droit d’écriture, lien PDF du BC
  var EXP_BLREC=${BLREC_JSON};   // réceptions (BL) : quantité reçue + informations de réception (PV, correction)
  var EXP_RETOURS=${RETOURS_JSON};
  var EXP_LOTS=${LOTS_JSON};
  var EXP_CMDS=${CMDS_JSON};
  // Ce qui retient chaque BST au départ (gamme du lot). Même source que le refus serveur.
  var EXP_BDS_BLOC=${JSON.stringify(BDS_BLOC).replace(/</g, '\\u003c')};

  // ── Réception : lier le BC à un BL ──
  // Lot D (14/09/2026) : plus de transporteur ni de quantité saisis. La quantité reçue est le RESTE À
  // RECEVOIR du BC (calculé par le serveur, affiché pour information) ; un écart se signale au PV.
  // Vérification (14/09/2026) : la quantité livrée ne se saisit que si la quantité commandée du BC est inconnue (Lot F :
  // la case « Livraison partielle » est retirée, le reliquat se déclare au PV) — et la même fenêtre corrige les informations
  // de réception d’un BL déjà enregistré (mode « correction », route /api/expeditions/bl/:id/reception-infos).
  var REC_CHAMPS={num_bl:'rec_numbl',num_commande_fournisseur:'rec_numcmdf',num_bl_fournisseur:'rec_numblf',poids_matiere_kg:'rec_poids',num_nomenclature:'rec_nomenc',code_ewx:'rec_ewx',mode_arrivee:'rec_mode',qte_livree:'rec_qte_livree'};
  var _recEnCours=false;   // un double-clic sur « Valider la réception » ne doit rien envoyer deux fois
  var _recBc=null, _recMode='reception';
  function expRecEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  // Mêmes règles que nombreStrict (src/reception.ts) : « 12 », « 12,5 », « 1 250,5 » (milliers séparés par groupes de 3).
  function expRecNombre(v){ var s=String(v==null?'':v).trim(); if(/^\\d{1,3}([ \\u00a0\\u202f]\\d{3})+([.,]\\d+)?$/.test(s)) s=s.replace(/[ \\u00a0\\u202f]/g,''); if(!/^\\d+([.,]\\d+)?$/.test(s)) return null; var n=parseFloat(s.replace(',','.')); return isFinite(n)?n:null; }
  function expRecFmt(n){ return String(n).replace('.',','); }
  // Encadre en rouge le champ fautif (ou le choix Oui / Non) et lui donne le focus ; null = tout effacer.
  function expRecMarque(champ){
    Object.keys(REC_CHAMPS).forEach(function(k){ var el=document.getElementById(REC_CHAMPS[k]); if(el) el.style.borderColor='#e2e8f0'; });
    var g=document.getElementById('rec_hf_group'); if(g) g.style.boxShadow='';
    if(!champ) return;
    if(champ==='hors_france'){ if(g) g.style.boxShadow='0 0 0 2px #fca5a5'; return; }
    if(champ==='qte_livree'){ var qb=document.getElementById('rec_qte_box'); if(qb) qb.style.display='block'; }
    var el=document.getElementById(REC_CHAMPS[champ]);
    if(el){ el.style.borderColor='#ef4444'; try{ el.focus(); }catch(e){} }
  }
  function expRecHF(){
    var oui=document.getElementById('rec_hf_oui').checked;
    document.getElementById('rec_hf_box').style.display=oui?'block':'none';
    expRecMarque(null);
  }
  function expRecBouton(occupe){
    var b=document.getElementById('rec_btn'); if(!b) return;
    b.disabled=!!occupe; b.style.opacity=occupe?'.6':''; b.style.cursor=occupe?'wait':'pointer';
  }
  // Quantité à saisir ? 'reste' : non (reste à recevoir) · 'inconnue' : oui, obligatoire (le BC ne porte pas de quantité
  // exploitable) · 'inconnue_multi' : facultative (BC à plusieurs articles). Lot F : plus de livraison partielle ici (PV).
  function expRecQteMode(){
    var bc=_recBc||{};
    if(bc.qte_commandee==null) return bc.multi_articles?'inconnue_multi':'inconnue';
    return 'reste';
  }
  function expRecPartiel(){
    var mode=expRecQteMode();
    var box=document.getElementById('rec_qte_box'), note=document.getElementById('rec_qte_note'), lbl=document.getElementById('rec_qte_lbl');
    box.style.display=(mode==='reste')?'none':'block';
    lbl.textContent=(mode==='inconnue_multi')?'Quantité livrée (facultative)':'Quantité livrée *';
    note.textContent=(mode==='inconnue') ? 'Le bon de commande ne porte pas de quantité exploitable : lisez-la sur le BL fournisseur.'
      : (mode==='inconnue_multi') ? 'Total de pièces, repris sur la non-conformité éventuelle ; il ne sert pas à l’entrée en stock.'
      : '';
    expRecMarque(null);
  }
  function expRecModeUi(corr){
    var t=document.getElementById('rec_titre'); t.textContent='';
    var ic=document.createElement('i'); ic.className='fas '+(corr?'fa-pen':'fa-truck-loading'); ic.style.marginRight='8px'; t.appendChild(ic);
    t.appendChild(document.createTextNode(corr?'Réception — Corriger les informations':'Réception — Lier le BC à un BL'));
    document.getElementById('rec_numbl_box').style.display=corr?'none':'';
    document.getElementById('rec_affaire_box').style.display=corr?'none':'';
    document.getElementById('rec_qte_info').style.display=corr?'none':'';
    if(corr){ document.getElementById('rec_qte_box').style.display='none'; }
    document.getElementById('rec_btn_lbl').textContent=corr?'Enregistrer la correction':'Valider la réception';
  }
  function expOpenReception(id){
    var bc=EXP_BC.find(function(b){return b.id===id;}); if(!bc) return;
    _recBc=bc; _recMode='reception';
    document.getElementById('rec_bc_id').value=id;
    document.getElementById('rec_bl_corr').value='';
    expRecModeUi(false);
    // Bandeau construit en texte (jamais en HTML) : fournisseur et articles viennent de la base.
    var info=document.getElementById('rec_info');
    info.textContent='';
    var fort=document.createElement('strong'); fort.textContent=bc.num_bc||id; info.appendChild(fort);
    info.appendChild(document.createTextNode(' · '+(bc.fournisseur||'')+' · '+(bc.articles||'')));
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
    ['rec_numcmdf','rec_numblf','rec_poids','rec_nomenc','rec_ewx','rec_mode','rec_qte_livree'].forEach(function(k){ var el=document.getElementById(k); if(el) el.value=''; });
    document.getElementById('rec_hf_oui').checked=false;
    document.getElementById('rec_hf_non').checked=false;
    expRecHF();
    // Quantité : information (même calcul que la route, src/reception.ts), saisie seulement dans les cas d’exception.
    var qi=document.getElementById('rec_qte_info');
    var peint=function(fond,bord,coul,texte){ qi.style.background=fond; qi.style.border='1px solid '+bord; qi.style.color=coul; qi.textContent=texte; };
    var multi=!!bc.multi_articles;
    var detail=(multi&&Array.isArray(bc.lignes)&&bc.lignes.length) ? bc.lignes.map(function(l){ return (l.qte_commandee!=null?expRecFmt(l.qte_commandee):(l.qte_texte||'?'))+(l.unite?' '+l.unite:'')+' × '+(l.reference||l.designation||'—'); }).join(' · ') : '';
    var noteStock=!multi?'':'\\nBon de commande à plusieurs articles : au PV, la quantité reçue se saisit ligne par ligne et chaque ligne conforme part en Mise en stock.';
    if(bc.qte_commandee==null){
      if(multi) peint('#fffbeb','#fde68a','#92400e','Bon de commande à plusieurs articles sans quantité exploitable'+(detail?' ('+detail+')':'')+'. Quantité livrée facultative.'+noteStock);
      else peint('#fffbeb','#fde68a','#92400e','Le bon de commande ne porte pas de quantité commandée exploitable : indiquez la quantité livrée, lue sur le BL fournisseur.');
    } else if(!(bc.reste>0)){
      peint('#fef2f2','#fecaca','#991b1b','Ce bon de commande est déjà entièrement reçu ('+expRecFmt(bc.qte_recue)+' sur '+expRecFmt(bc.qte_commandee)+') : la réception sera refusée.');
    } else if(multi){
      peint('#f0fdf4','#bbf7d0','#166534','Réception de tout le reste du bon de commande'+(detail?' : '+detail:'')+' — '+expRecFmt(bc.reste)+' pièce(s) au total'+(bc.qte_recue>0?', dont '+expRecFmt(bc.qte_recue)+' déjà reçue(s)':'')+'. Un écart se signale au PV de contrôle, sur la ligne concernée.'+noteStock);
    } else {
      peint('#f0fdf4','#bbf7d0','#166534','Quantité réceptionnée : '+expRecFmt(bc.reste)+' — reste à recevoir sur '+expRecFmt(bc.qte_commandee)+' commandé(s)'+(bc.qte_recue>0?', dont '+expRecFmt(bc.qte_recue)+' déjà reçu(s)':'')+'. La quantité réellement reçue, un écart ou un reliquat annoncé par le fournisseur se déclarent au PV de contrôle, ligne par ligne.');
    }
    expRecPartiel();
    _recEnCours=false; expRecBouton(false);
    document.getElementById('exp-recep-overlay').style.display='flex';
  }
  // Corriger les informations de réception d’un BL déjà enregistré (faute de frappe sur le code douanier, le poids…).
  function expOpenCorrectionReception(blId){
    if(EXP_PV&&EXP_PV.peutEcrire===false){ pushNotif('err','fa-lock','Correction réservée aux personnes ayant l’écriture sur les Expéditions.',6000); return; }
    var r=EXP_BLREC?EXP_BLREC[blId]:null; if(!r) return;
    if(!r.infos_col){ pushNotif('warn','fa-database','Base sans les colonnes de réception (migration 012 ; en cloud : cloud-10) : correction impossible.',8000); return; }
    var bc=EXP_BC.find(function(b){return b.id===r.bc_id;})||{ id:r.bc_id, num_bc:r.bc_id, fournisseur:'', articles:'' };
    _recBc=bc; _recMode='correction';
    document.getElementById('rec_bc_id').value=bc.id||'';
    document.getElementById('rec_bl_corr').value=blId;
    expRecModeUi(true);
    var info=document.getElementById('rec_info'); info.textContent='';
    var fort=document.createElement('strong'); fort.textContent='BL '+blId; info.appendChild(fort);
    info.appendChild(document.createTextNode(' · '+(bc.num_bc||r.bc_id||'')+' · '+(bc.fournisseur||'')));
    var sous=document.createElement('div'); sous.setAttribute('style','margin-top:4px;font-size:.72rem;color:#0369a1;'); sous.textContent='Seules les informations de réception se corrigent : la quantité, le contrôle et le stock ne changent pas.'; info.appendChild(sous);
    document.getElementById('rec_numcmdf').value=r.num_commande_fournisseur||'';
    document.getElementById('rec_numblf').value=r.num_bl_fournisseur||'';
    document.getElementById('rec_poids').value=(r.poids_matiere_kg!=null?expRecFmt(r.poids_matiere_kg):'');
    document.getElementById('rec_nomenc').value=r.num_nomenclature||'';
    document.getElementById('rec_ewx').value=(r.code_ewx!=null?String(r.code_ewx):'');
    document.getElementById('rec_mode').value=r.mode_arrivee||'';
    document.getElementById('rec_hf_oui').checked=(r.hors_france===true);
    document.getElementById('rec_hf_non').checked=(r.hors_france===false);
    expRecHF();
    _recEnCours=false; expRecBouton(false);
    document.getElementById('exp-recep-overlay').style.display='flex';
  }
  function expCloseRecep(){ document.getElementById('exp-recep-overlay').style.display='none'; }
  function expSubmitRecep(){
    if(_recEnCours) return;
    var corr=(_recMode==='correction');
    var id=document.getElementById('rec_bc_id').value;
    var blCorr=document.getElementById('rec_bl_corr').value;
    var val=function(k){ var el=document.getElementById(k); return el?String(el.value||'').trim():''; };
    var hfOui=document.getElementById('rec_hf_oui').checked, hfNon=document.getElementById('rec_hf_non').checked;
    var payload=corr
      ? { num_commande_fournisseur:val('rec_numcmdf'), num_bl_fournisseur:val('rec_numblf'), hors_france:(hfOui?true:(hfNon?false:null)) }
      : { num_bl:val('rec_numbl'), affaire_id:val('rec_affaire'), num_commande_fournisseur:val('rec_numcmdf'), num_bl_fournisseur:val('rec_numblf'), hors_france:(hfOui?true:(hfNon?false:null)) };
    var refus=function(champ,msg){ expRecMarque(champ); pushNotif('err','fa-exclamation-circle',msg); };
    // Mêmes règles que le serveur (validerSaisieReception + planReception), qui revérifie tout et répond 400 + champ.
    if(!payload.num_commande_fournisseur) return refus('num_commande_fournisseur','Indiquez le N° de commande fournisseur.');
    if(!payload.num_bl_fournisseur) return refus('num_bl_fournisseur','Indiquez le N° de BL fournisseur.');
    if(payload.hors_france===null) return refus('hors_france','Indiquez si la réception vient de hors France (Oui / Non).');
    if(!corr){
      var mode=expRecQteMode();
      if(mode!=='reste'){
        var qs=val('rec_qte_livree'), q=qs?expRecNombre(qs):null;
        if(qs&&(q===null||!(q>0))) return refus('qte_livree','Quantité livrée : nombre supérieur à 0.');
        if(q===null&&mode!=='inconnue_multi') return refus('qte_livree','Indiquez la quantité livrée, lue sur le BL fournisseur : le bon de commande ne porte pas de quantité exploitable.');
        if(q!==null) payload.qte_livree=q;
      }
    }
    if(payload.hors_france){
      var poids=expRecNombre(val('rec_poids'));
      if(poids===null||!(poids>0)) return refus('poids_matiere_kg','Indiquez le poids matière en kg (nombre supérieur à 0 ; virgule décimale, milliers séparés par une espace).');
      payload.poids_matiere_kg=poids;
      payload.num_nomenclature=val('rec_nomenc');
      if(!payload.num_nomenclature) return refus('num_nomenclature','Indiquez le N° de nomenclature (douane).');
      var ewx=val('rec_ewx');
      if(ewx!=='1'&&ewx!=='2') return refus('code_ewx','Choisissez le code EWX (1 ou 2).');
      payload.code_ewx=Number(ewx);
      payload.mode_arrivee=val('rec_mode');
      if(!payload.mode_arrivee) return refus('mode_arrivee','Choisissez le mode d’arrivée.');
    }
    expRecMarque(null);
    _recEnCours=true; expRecBouton(true);
    var url=corr ? '/api/expeditions/bl/'+encodeURIComponent(blCorr)+'/reception-infos' : '/api/expeditions/bc/'+encodeURIComponent(id)+'/receptionner';
    fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){ return r.json().then(function(j){
          // 403 du contrôle d'accès général : il ne dit que « Accès refusé » — on dit pourquoi.
          if(r.status===403&&j&&!j.ok&&/^Accès refusé/.test(String(j.error||''))) j.error=(corr?'Correction':'Réception')+' réservée aux personnes ayant l’écriture sur les Expéditions.';
          return j;
        }, function(){ return {ok:false,error:'Réponse illisible du serveur (HTTP '+r.status+').'}; }); })
      .then(function(j){
        _recEnCours=false; expRecBouton(false);
        if(!j||!j.ok){ if(j&&j.champ) expRecMarque(j.champ); pushNotif('err','fa-ban',expRecEsc((j&&j.error)||(corr?'Correction échouée.':'Réception échouée.')),9000); return; }
        expCloseRecep();
        if(corr){
          pushNotif('ok','fa-pen','Informations de réception du BL <strong>'+expRecEsc(j.bl_id)+'</strong> corrigées.',6000);
        } else {
          pushNotif('ok','fa-truck-loading','Colis reçu · BL <strong>'+expRecEsc(j.bl_id)+'</strong> créé'+(j.qte!=null?' ('+expRecEsc(expRecFmt(j.qte))+' attendu(s))':'')+'. Faites maintenant le PV de contrôle (onglet Réceptions) : quantité reçue ligne par ligne, puis les quantités conformes partent en Mise en stock.',9000);
        }
        (Array.isArray(j.avertissements)?j.avertissements:[]).forEach(function(a){ pushNotif('warn','fa-exclamation-triangle',expRecEsc(a),12000); });
        setTimeout(function(){location.hash='receptions';softReload();},900);
      }).catch(function(){ _recEnCours=false; expRecBouton(false); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  // Boutons « Corriger » de l’onglet Réceptions : délégation (aucune chaîne de la base dans un onclick).
  document.addEventListener('click',function(e){
    var t=e.target, b=(t&&t.closest)?t.closest('.exp-rec-edit'):null;
    if(b&&!b.disabled) expOpenCorrectionReception(b.getAttribute('data-bl')||'');
  });

  // ── PV de contrôle réception — Lot D · D2 (14/09/2026), Lot F (15/09/2026) ──
  // Conforme comme Non conforme : le tableau des lignes (quantité reçue à côté de la prévue, reliquat annoncé, observation),
  // le contrôleur, la case certificat matière quand le BC l’exige (pas de conforme sans elle).
  // Non conforme : en plus, en-tête du BC, observation générale, gravité. Tout est construit en DOM TEXTE (fournisseur, lignes, notes viennent de la base) et les boutons passent par
  // délégation d’événements (classe exp-pv-open + data-bc / data-bl). Le serveur relit les lignes du BC et revérifie tout
  // (400 + champ + idx), dont le contrôleur (403 s’il n’a pas l’écriture sur les Expéditions).
  var _pvBc=null;
  var _pvEnCours=false;   // un double-clic sur « Valider le PV » ne doit rien envoyer deux fois
  function expPvEl(tag,style,texte){ var e=document.createElement(tag); if(style) e.setAttribute('style',style); if(texte!=null) e.textContent=String(texte); return e; }
  function expPvNb(n){ return String(n).replace('.',','); }
  function expPvDate(d){ var s=String(d||''); return /^\\d{4}-\\d{2}-\\d{2}/.test(s)?(s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4)):(s||'—'); }
  function expPvMontant(n){ var v=Number(n); return (isFinite(v)&&v>0)?(v.toFixed(2).replace('.',',')+' € HT'):'—'; }
  function expPvResultat(){ var s=document.querySelector('input[name=pv_res]:checked'); return s?String(s.value):''; }
  function expPvArr(n){ return Math.round(Number(n)*1000)/1000; }
  var _pvPrevues={};   // idx → quantité prévue affichée (null = inconnue), renvoyée au serveur (qte_prevue_affichee)
  function expPvBouton(occupe){ var b=document.getElementById('pv_btn'); if(!b) return; b.disabled=!!occupe; b.style.opacity=occupe?'.6':''; b.style.cursor=occupe?'wait':'pointer'; }
  // Encadre en rouge ce qui est fautif (champ, choix, ligne) ; null = tout effacer.
  // sous : 'obs' quand la faute porte sur l'observation de la ligne (le curseur va dans l'observation, pas dans la quantité).
  function expPvMarque(champ,idx,sous){
    var g=document.getElementById('pv_res_group'); if(g) g.style.boxShadow='';
    var s=document.getElementById('pv_ctrl'); if(s) s.style.borderColor='#e2e8f0';
    var cb=document.getElementById('pv_cert_box'); if(cb) cb.style.boxShadow='';
    var og=document.getElementById('pv_obs_gen'); if(og) og.style.borderColor='#e2e8f0';
    var gr=document.getElementById('pv_gravite'); if(gr) gr.style.borderColor='#e2e8f0';
    var rows=document.querySelectorAll('#pv_lignes tr'); for(var i=0;i<rows.length;i++){ rows[i].style.background=''; }
    if(!champ) return;
    if(champ==='resultat'){ if(g) g.style.boxShadow='0 0 0 2px #fca5a5'; }
    else if(champ==='controleur_id'){ if(s){ s.style.borderColor='#ef4444'; try{ s.focus(); }catch(e){} } }
    else if(champ==='certificat_confirme'){ if(cb) cb.style.boxShadow='0 0 0 2px #fca5a5'; }
    else if(champ==='observation_generale'){ if(og) og.style.borderColor='#ef4444'; }
    else if(champ==='gravite'){ if(gr) gr.style.borderColor='#ef4444'; }
    else if(champ==='lignes'&&idx!=null){
      var tr=document.querySelector('#pv_lignes tr[data-idx="'+Number(idx)+'"]');
      if(tr){ tr.style.background='#fef2f2'; try{ tr.scrollIntoView({block:'center'}); }catch(e){} }
      var qi=document.getElementById((sous==='obs'?'pv_lobs_':'pv_lqte_')+Number(idx)); if(qi){ try{ qi.focus(); }catch(e){} }
    }
  }
  function expPvControleurs(){
    var cfg=EXP_PV||{}, liste=Array.isArray(cfg.controleurs)?cfg.controleurs:[];
    var sel=document.getElementById('pv_ctrl'); sel.textContent='';
    var vide=document.createElement('option'); vide.value=''; vide.textContent=liste.length?'— Choisir le contrôleur —':'Aucun contrôleur disponible'; sel.appendChild(vide);
    var moi=false;
    liste.forEach(function(ct){
      var o=document.createElement('option'); o.value=String(ct.id); o.textContent=String(ct.nom||ct.id); sel.appendChild(o);
      if(cfg.utilisateur!=null&&String(ct.id)===String(cfg.utilisateur)) moi=true;
    });
    // Pré-sélection : la personne connectée, si elle peut être contrôleur (sinon rien : il faut choisir).
    sel.value=moi?String(cfg.utilisateur):'';
    var note=document.getElementById('pv_ctrl_note');
    if(cfg.indisponibles){ note.style.color='#b91c1c'; note.textContent='Liste des contrôleurs indisponible (lecture des salariés impossible) : rechargez la page.'; }
    else if(!liste.length){ note.style.color='#b91c1c'; note.textContent='Aucun salarié actif n’a l’écriture sur les Expéditions : ce droit se coche dans la fiche salarié (RH).'; }
    else { note.style.color='#64748b'; note.textContent='Seules les personnes ayant l’écriture sur les Expéditions peuvent être contrôleur.'; }
  }
  // En-tête du bon de commande (non conforme) : tout ce qui appartient au BC, en texte.
  function expPvEnTete(bc){
    var h=document.getElementById('pv_bc_head'); h.textContent='';
    var aff=(Array.isArray(bc.affaires)&&bc.affaires.length)?bc.affaires.join(', '):(bc.num_affaire||bc.affaire_id||'—');
    var champs=[['N° BC',bc.num_bc||bc.id],['Fournisseur',bc.fournisseur||'—'],['Date du BC',expPvDate(bc.date_bc)],['Livraison prévue',expPvDate(bc.date_livraison_prevue)],['Affaire(s)',aff],['Montant HT',expPvMontant(bc.montant_ht)],['Conditions de paiement',bc.conditions_paiement||'—'],['Articles',bc.articles||'—'],['Notes',bc.notes||'—']];
    champs.forEach(function(c){
      var d=expPvEl('div',c[0]==='Notes'?'grid-column:1/-1;':'');
      d.appendChild(expPvEl('div','font-size:.62rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.03em;',c[0]));
      d.appendChild(expPvEl('div','color:#1e293b;font-weight:600;white-space:pre-line;word-break:break-word;',c[1]));
      h.appendChild(d);
    });
    if(EXP_PV&&EXP_PV.pdfBc){
      var dp=expPvEl('div','');
      var a=expPvEl('a','color:#1d4ed8;font-weight:700;text-decoration:underline;','Ouvrir le PDF du bon de commande');
      a.setAttribute('href','/api/bc/'+encodeURIComponent(bc.id)+'/pdf'); a.setAttribute('target','_blank'); a.setAttribute('rel','noopener');
      dp.appendChild(a); h.appendChild(dp);
    }
  }
  // Quantité PRÉVUE de chaque ligne sur cette réception — même calcul que le serveur (qtesPrevuesPV, src/pv_reception.ts) :
  // BC à plusieurs articles ou réception sans quantité → quantité commandée de la ligne ; une seule ligne → quantité du BL ;
  // un article sur plusieurs lignes → quantité du BL répartie dans l’ordre. Le serveur recompare (qte_prevue_affichee).
  function expPvPrevues(bc, qteBl){
    var lg=Array.isArray(bc.lignes)?bc.lignes:[];
    if(!lg.length) return [];
    var parLigne=function(){ return lg.map(function(l){ return l.qte_commandee!=null?expPvArr(l.qte_commandee):null; }); };
    var q=(qteBl!=null&&isFinite(Number(qteBl))&&Number(qteBl)>0)?expPvArr(qteBl):null;
    if(bc.multi_articles||q===null) return parLigne();
    if(lg.length===1) return [q];
    if(lg.some(function(l){ return l.qte_commandee==null; })) return parLigne();
    var somme=expPvArr(lg.reduce(function(s,l){ return s+Number(l.qte_commandee); },0));
    if(somme===q) return parLigne();
    var reste=q;
    return lg.map(function(l,i){ var v=(i===lg.length-1)?reste:Math.min(reste,Number(l.qte_commandee)); reste=expPvArr(reste-v); return expPvArr(Math.max(0,v)); });
  }
  // Tableau des lignes du BC (Conforme comme Non conforme) : Qté prévue · Qté reçue (pré-remplie = prévue) · Reliquat annoncé
  // (case, seulement si reçue < prévue) · Conforme ? (déduit) · Observation (facultative, rend la ligne qualitative).
  // Tout en DOM texte ; les champs passent par délégation (classes pv-l-qte, pv-l-rel, pv-l-obs + data-idx).
  function expPvLignes(bc, qteBl){
    var tb=document.getElementById('pv_lignes'); tb.textContent='';
    _pvPrevues={};
    var lignes=Array.isArray(bc.lignes)?bc.lignes:[];
    var prev=expPvPrevues(bc,qteBl);
    var avecPu=lignes.some(function(l){ return l&&l.prix_unitaire!=null; });
    var th=document.getElementById('pv_th_pu'); if(th) th.style.display=avecPu?'':'none';
    var TDS='padding:7px 10px;border-top:1px solid #f1f5f9;vertical-align:top;color:#374151;';
    var TXT=TDS+'overflow-wrap:anywhere;word-break:break-word;max-width:240px;';
    document.getElementById('pv_lignes_note').style.display=lignes.some(function(l){ return l&&l.reconstituee; })?'block':'none';
    if(!lignes.length){ var tr0=expPvEl('tr',''); var td0=expPvEl('td',TDS+'text-align:center;color:#9ca3af;','Aucune ligne sur ce bon de commande.'); td0.setAttribute('colspan','11'); tr0.appendChild(td0); tb.appendChild(tr0); return; }
    lignes.forEach(function(l,i){
      var idx=Number(l.idx), p=(prev[i]==null?null:prev[i]);
      _pvPrevues[idx]=p;
      var u=l.unite?' '+l.unite:'';
      var tr=expPvEl('tr',''); tr.setAttribute('data-idx',String(idx));
      var suivi=[l.da_id?'DA '+l.da_id:'',l.lot?'Lot '+l.lot:'',l.operation||''].filter(Boolean).join(' · ')||'—';
      tr.appendChild(expPvEl('td',TDS+'font-weight:700;white-space:nowrap;',String(idx+1)+(l.reconstituee?' *':'')));
      tr.appendChild(expPvEl('td',TXT,l.reference||'—'));
      tr.appendChild(expPvEl('td',TXT,l.designation||'—'));
      tr.appendChild(expPvEl('td',TDS+'white-space:nowrap;font-weight:700;',p!==null?(expPvNb(p)+u):((l.qte_texte?l.qte_texte:'inconnue')+u)));
      var tdR=expPvEl('td',TDS+'white-space:nowrap;');
      var inp=document.createElement('input'); inp.type='text'; inp.id='pv_lqte_'+idx; inp.className='pv-l-qte'; inp.setAttribute('data-idx',String(idx));
      inp.setAttribute('inputmode','decimal'); inp.setAttribute('autocomplete','off'); inp.value=(p!==null?expPvNb(p):''); inp.placeholder=(p!==null?'':'à saisir');
      inp.setAttribute('style','width:84px;border:1.5px solid #e2e8f0;border-radius:7px;padding:5px 7px;font-size:.78rem;box-sizing:border-box;');
      tdR.appendChild(inp); if(l.unite) tdR.appendChild(document.createTextNode(' '+l.unite));
      tr.appendChild(tdR);
      var tdL=expPvEl('td',TDS+'white-space:nowrap;');
      var lab=expPvEl('label','display:none;align-items:center;gap:5px;cursor:pointer;font-size:.72rem;font-weight:700;color:#1d4ed8;'); lab.id='pv_lrel_box_'+idx;
      var cb=document.createElement('input'); cb.type='checkbox'; cb.id='pv_lrel_'+idx; cb.className='pv-l-rel'; cb.setAttribute('data-idx',String(idx));
      lab.appendChild(cb); lab.appendChild(document.createTextNode('Reliquat'));
      var na=expPvEl('span','color:#cbd5e1;font-size:.7rem;','—'); na.id='pv_lrel_na_'+idx;
      tdL.appendChild(lab); tdL.appendChild(na); tr.appendChild(tdL);
      var tdC=expPvEl('td',TDS+'white-space:nowrap;'); tdC.id='pv_lconf_'+idx; tr.appendChild(tdC);
      var tdO=expPvEl('td',TDS+'min-width:200px;');
      var ta=document.createElement('textarea'); ta.id='pv_lobs_'+idx; ta.className='pv-l-obs'; ta.setAttribute('data-idx',String(idx)); ta.rows=2; ta.maxLength=1000;
      ta.placeholder='Facultative : une observation rend la ligne non conforme (qualitatif)';
      ta.setAttribute('style','width:100%;border:1.5px solid #e2e8f0;border-radius:7px;padding:5px 7px;font-size:.76rem;box-sizing:border-box;resize:vertical;background:#fff;');
      tdO.appendChild(ta); tr.appendChild(tdO);
      var tdPu=expPvEl('td',TDS+'white-space:nowrap;',l.prix_unitaire!=null?expPvNb(l.prix_unitaire)+' €':'—'); tdPu.style.display=avecPu?'':'none'; tr.appendChild(tdPu);
      tr.appendChild(expPvEl('td',TXT,l.num_affaire||'—'));
      tr.appendChild(expPvEl('td',TXT,suivi));
      tb.appendChild(tr);
      expPvLigneMaj(idx);
    });
  }
  // État d’une ligne, mêmes règles que le serveur (validerSaisiePV) : manque sans reliquat ou excédent = quantitatif ; observation = qualitatif.
  function expPvEtat(idx){
    var inp=document.getElementById('pv_lqte_'+idx); if(!inp) return null;
    var s=String(inp.value||'').trim(), r=(s===''?null:expRecNombre(s));
    var p=Object.prototype.hasOwnProperty.call(_pvPrevues,idx)?_pvPrevues[idx]:null;
    var ta=document.getElementById('pv_lobs_'+idx), obs=ta?String(ta.value||'').trim():'';
    var cb=document.getElementById('pv_lrel_'+idx);
    if(r===null) return { lisible:false, recue:null, prevue:p, obs:obs, reliquat:false, manque:0, excedent:0, quanti:false, quali:!!obs };
    r=expPvArr(r);
    var manque=(p!==null&&r<p)?expPvArr(p-r):0, excedent=(p!==null&&r>p)?expPvArr(r-p):0;
    var rel=manque>0&&!!(cb&&cb.checked);
    return { lisible:true, recue:r, prevue:p, obs:obs, reliquat:rel, manque:manque, excedent:excedent, quanti:(manque>0&&!rel)||excedent>0, quali:!!obs };
  }
  function expPvLigneMaj(idx){
    var e=expPvEtat(idx); if(!e) return;
    var peutRel=e.lisible&&e.manque>0;
    var box=document.getElementById('pv_lrel_box_'+idx), na=document.getElementById('pv_lrel_na_'+idx), cb=document.getElementById('pv_lrel_'+idx);
    if(box) box.style.display=peutRel?'inline-flex':'none';
    if(na) na.style.display=peutRel?'none':'';
    if(cb&&!peutRel&&cb.checked){ cb.checked=false; e=expPvEtat(idx); }
    var inp=document.getElementById('pv_lqte_'+idx); if(inp) inp.style.borderColor=!e.lisible?'#ef4444':(e.quanti?'#fca5a5':'#e2e8f0');
    var ta=document.getElementById('pv_lobs_'+idx); if(ta) ta.style.borderColor=e.quali?'#fca5a5':'#e2e8f0';
    var tr=document.querySelector('#pv_lignes tr[data-idx="'+Number(idx)+'"]'); if(tr) tr.style.background='';
    var td=document.getElementById('pv_lconf_'+idx); if(!td) return;
    td.textContent='';
    var badge=function(txt,bg,col){ td.appendChild(expPvEl('span','background:'+bg+';color:'+col+';border-radius:999px;padding:2px 9px;font-size:.66rem;font-weight:800;',txt)); };
    if(!e.lisible) badge('Qté à saisir','#fef2f2','#b91c1c');
    else if(e.quanti&&e.quali) badge('Non · quantitatif et qualitatif','#fee2e2','#b91c1c');
    else if(e.quanti) badge('Non · quantitatif','#fee2e2','#b91c1c');
    else if(e.quali) badge('Non · qualitatif','#fee2e2','#b91c1c');
    else badge('Oui','#dcfce7','#15803d');
    var det=[];
    if(e.lisible&&e.manque>0) det.push((e.reliquat?'reliquat ':'manque ')+expPvNb(e.manque));
    if(e.lisible&&e.excedent>0) det.push('excédent +'+expPvNb(e.excedent)+(e.quali?'':' · validation Direction'));
    if(e.lisible&&e.prevue===null) det.push('prévu inconnu : écart non calculé');
    if(e.quali&&e.lisible&&e.recue>0) det.push('quarantaine');
    if(det.length) td.appendChild(expPvEl('div','font-size:.62rem;color:#64748b;margin-top:3px;white-space:normal;max-width:180px;',det.join(' · ')));
  }
  // « Tout reçu comme prévu » : quantité reçue = quantité prévue et reliquat décoché (les observations restent).
  function expPvToutRecu(){
    var bc=_pvBc; if(!bc||!Array.isArray(bc.lignes)) return;
    bc.lignes.forEach(function(l){
      var idx=Number(l.idx), p=Object.prototype.hasOwnProperty.call(_pvPrevues,idx)?_pvPrevues[idx]:null;
      var inp=document.getElementById('pv_lqte_'+idx), cb=document.getElementById('pv_lrel_'+idx);
      if(inp&&p!==null) inp.value=expPvNb(p);
      if(cb) cb.checked=false;
      expPvLigneMaj(idx);
    });
  }
  function expOpenPV(id, blId){
    var bc=EXP_BC.find(function(b){return b.id===id;}); if(!bc) return;
    if(EXP_PV&&EXP_PV.peutEcrire===false){ pushNotif('err','fa-lock','PV réservé aux personnes ayant l’écriture sur les Expéditions.',6000); return; }
    _pvBc=bc;
    document.getElementById('pv_bc_id').value=id;
    // Le PV vise la réception de la ligne cliquée, pas le dernier BL du bon de commande.
    var bl=blId||bc.bl_id||'';
    document.getElementById('pv_bl_id').value=bl;
    var info=document.getElementById('pv_info'); info.textContent='';
    var fort=document.createElement('strong'); fort.textContent=bc.num_bc||id; info.appendChild(fort);
    info.appendChild(document.createTextNode(' · '+(bc.fournisseur||'')+' · '+(bc.articles||'')+(bl?' · BL '+bl:'')));
    // La réception contrôlée : quantité attendue sur ce BL (base de la quantité prévue) + informations saisies à la réception.
    var rec=(bl&&EXP_BLREC)?EXP_BLREC[bl]:null;
    if(rec){
      var qteTxt=(rec.qte!=null)?('Quantité attendue sur la réception : '+expPvNb(rec.qte)+(bc.multi_articles?' pièce(s) au total':'')):'Quantité attendue sur la réception : inconnue (saisissez la quantité reçue de chaque ligne)';
      var refs=[rec.num_bl_fournisseur?'BL fournisseur '+rec.num_bl_fournisseur:'',rec.num_commande_fournisseur?'commande fournisseur '+rec.num_commande_fournisseur:''].filter(Boolean).join(' · ');
      info.appendChild(expPvEl('div','margin-top:4px;font-size:.74rem;color:#7f1d1d;font-weight:700;',qteTxt+(refs?' · '+refs:'')));
      if(rec.hors_france===true){
        info.appendChild(expPvEl('div','margin-top:2px;font-size:.72rem;color:#7f1d1d;','Hors France · '+[rec.poids_matiere_kg!=null?expPvNb(rec.poids_matiere_kg)+' kg':'',rec.num_nomenclature?'nomenclature '+rec.num_nomenclature:'',rec.code_ewx!=null?'EWX '+rec.code_ewx:'',rec.mode_arrivee||''].filter(Boolean).join(' · ')));
      }
    }
    info.appendChild(expPvEl('div','margin-top:4px;font-size:.72rem;color:#92400e;','Saisissez la quantité reçue de chaque ligne : les quantités conformes partent dans Stock › Mise en stock, le stock est crédité au rangement.'+(bc.certificat_matiere_requis?' Ce bon de commande exige un certificat matière.':'')));
    var rOk=document.getElementById('pv_res_ok'), rNc=document.getElementById('pv_res_nc');
    if(rOk) rOk.checked=false; if(rNc) rNc.checked=false;   // aucun résultat par défaut : il se choisit
    document.getElementById('pv_cert').checked=false;
    document.getElementById('pv_cert_box').style.display=bc.certificat_matiere_requis?'block':'none';
    expPvControleurs();
    expPvEnTete(bc);
    expPvLignes(bc, rec?rec.qte:null);
    document.getElementById('pv_obs_gen').value='';
    document.getElementById('pv_gravite').value='Majeure';
    expPVToggle();
    expPvMarque(null);
    _pvEnCours=false; expPvBouton(false);
    document.getElementById('exp-pv-overlay').style.display='flex';
  }
  function expClosePV(){ document.getElementById('exp-pv-overlay').style.display='none'; }
  function expPVToggle(){
    var res=expPvResultat(), nc=(res==='non_conforme');
    document.getElementById('pv_nc_box').style.display=nc?'block':'none';
    document.getElementById('pv_bc_box').style.display=nc?'block':'none';
    document.getElementById('pv_ok_note').style.display=(res==='conforme')?'block':'none';
    var g=document.getElementById('pv_res_group'); if(g) g.style.boxShadow='';
  }
  function expSubmitPV(){
    if(_pvEnCours) return;
    var id=document.getElementById('pv_bc_id').value;
    var bc=(_pvBc&&_pvBc.id===id)?_pvBc:EXP_BC.find(function(b){return b.id===id;});
    if(!bc) return;
    var refus=function(champ,msg,idx,sous){ expPvMarque(champ,idx,sous); pushNotif('err','fa-exclamation-circle',msg,7000); };
    var resultat=expPvResultat();
    var ctrl=String(document.getElementById('pv_ctrl').value||'');
    var requis=!!bc.certificat_matiere_requis;
    var certOk=requis&&!!document.getElementById('pv_cert').checked;
    // Mêmes règles que le serveur (validerSaisiePV, src/pv_reception.ts), qui revérifie tout.
    if(!resultat) return refus('resultat','Indiquez le résultat du contrôle : Conforme ou Non conforme.');
    if(!ctrl) return refus('controleur_id','Choisissez le contrôleur.');
    // certificat_requis_affiche : ce que la page a montré. Si les Achats ont changé l’exigence entre-temps, le serveur refuse (409 « rechargez »).
    var payload={ resultat:resultat, controleur_id:ctrl, bl_id:document.getElementById('pv_bl_id').value||null, certificat_requis_affiche:requis };
    if(requis) payload.certificat_confirme=certOk;
    if(resultat==='conforme'&&requis&&!certOk){
      // Pas de conforme sans certificat matière confirmé : le PV bascule en non conforme, à vérifier puis valider.
      var rNc=document.getElementById('pv_res_nc'); if(rNc) rNc.checked=true;
      expPVToggle(); expPvMarque('certificat_confirme');
      pushNotif('warn','fa-certificate','Certificat matière non confirmé : le PV ne peut pas être conforme. Il passe en non conforme (« certificat matière absent ou non conforme ») : vérifiez les lignes puis validez.',10000);
      return;
    }
    // Lignes (Lot F) : quantité reçue obligatoire, reliquat annoncé, observation — dans les deux cas.
    var lignes=[], nbEcart=0, faute=null;
    (Array.isArray(bc.lignes)?bc.lignes:[]).forEach(function(l){
      if(faute) return;
      var idx=Number(l.idx), e=expPvEtat(idx);
      if(!e||!e.lisible){ faute=['lignes','Ligne '+(idx+1)+' : indiquez la quantité reçue — un nombre, 0 si rien n’est arrivé.',idx]; return; }
      if(e.obs.length>1000){ faute=['lignes','Ligne '+(idx+1)+' : observation trop longue (1000 caractères maximum).',idx,'obs']; return; }
      if(e.quanti||e.quali){
        nbEcart++;
        if(resultat==='conforme'){ faute=['lignes','Ligne '+(idx+1)+' : '+(e.quali?'observation écrite':(e.excedent>0?'excédent de '+expPvNb(e.excedent):'manque de '+expPvNb(e.manque)+' sans reliquat annoncé'))+' — le PV ne peut pas être conforme : passez en « Non conforme ».',idx,(e.quali&&!e.quanti)?'obs':'']; return; }
      }
      lignes.push({ idx:idx, qte_recue:e.recue, reliquat:e.reliquat, observation:e.obs||null, qte_prevue_affichee:e.prevue });
    });
    if(faute) return refus(faute[0],faute[1],faute[2],faute[3]);
    payload.lignes=lignes;
    if(resultat!=='conforme'){
      if(!nbEcart&&!(requis&&!certOk)) return refus('lignes','Non conforme : aucune ligne en écart. Une ligne est non conforme si la quantité reçue diffère de la prévue sans reliquat annoncé, ou si une observation est écrite'+(requis?' (ou laissez « Certificat matière reçu et conforme » décoché s’il est absent)':'')+'. Sans écart, le PV est conforme.');
      payload.observation_generale=String(document.getElementById('pv_obs_gen').value||'').trim()||null;
      payload.gravite=document.getElementById('pv_gravite').value||'Majeure';
    }
    expPvMarque(null);
    _pvEnCours=true; expPvBouton(true);
    fetch('/api/expeditions/bc/'+encodeURIComponent(id)+'/pv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){ return r.json().then(function(j){
          // 403 du contrôle d’accès général : il ne dit que « Accès refusé » — on dit pourquoi.
          if(r.status===403&&j&&!j.ok&&/^Accès refusé/.test(String(j.error||''))) j.error='PV réservé aux personnes ayant l’écriture sur les Expéditions.';
          return j;
        }, function(){ return {ok:false,error:'Réponse illisible du serveur (HTTP '+r.status+').'}; }); })
      .then(function(j){
        _pvEnCours=false; expPvBouton(false);
        if(!j||!j.ok){
          // Faute du serveur sur une ligne : l'observation si le message ne parle que d'elle.
          var errTxt=String((j&&j.error)||'');
          var sousSrv=(j&&j.champ==='lignes'&&/observation/i.test(errTxt)&&!/(manque|exc[ée]dent|quantit)/i.test(errTxt))?'obs':'';
          if(j&&j.champ) expPvMarque(j.champ,j.idx,sousSrv);
          pushNotif('err','fa-ban',expRecEsc(errTxt||'PV échoué.'),9000); return;
        }
        expClosePV();
        // Résumé des effets (Lot F) : file Mise en stock (ou entrée directe de repli), NC par ligne, quarantaines, excédents, reliquat.
        var parts=[], st=j.stock||null, liste=function(a){ return Array.isArray(a)?a:[]; };
        if(j.mise_en_stock&&j.mise_en_stock.lignes) parts.push(expRecEsc(j.mise_en_stock.lignes)+' ligne(s) en Mise en stock (Stock)');
        else if(st) parts.push(st.entre?('<strong>'+expRecEsc(expPvNb(st.qte))+'</strong> entré(s) directement en stock'):('stock NON crédité : '+expRecEsc(st.raison||'raison inconnue')));
        if(liste(j.nc_ids).length) parts.push(liste(j.nc_ids).length+' NC fournisseur ('+liste(j.nc_ids).map(function(x){ return expRecEsc(x); }).join(', ')+')');
        if(liste(j.quarantaine_ids).length) parts.push(liste(j.quarantaine_ids).length+' quarantaine(s) en Qualité');
        if(liste(j.validation_ids).length) parts.push(liste(j.validation_ids).length+' excédent(s) soumis à la Direction');
        if(j.bc_reliquat_id) parts.push('BC de reliquat <strong>'+expRecEsc(j.bc_reliquat_id)+'</strong> aux Achats (date à valider)');
        pushNotif(j.anomalie?'warn':'ok',j.anomalie?'fa-exclamation-triangle':'fa-clipboard-check','PV <strong>'+expRecEsc(j.pv_id)+'</strong> '+(j.anomalie?'non conforme':'conforme')+(parts.length?' · '+parts.join(' · '):'')+'.',10000);
        // Avertissements DURABLES : réaffichés après le rechargement (parfois la seule trace d'un effet à reprendre à la main).
        (Array.isArray(j.avertissements)?j.avertissements:[]).forEach(function(a){ notifDurable('warn','fa-exclamation-triangle',expRecEsc(a),60000); });
        setTimeout(function(){location.hash='receptions';softReload();},1100);
      }).catch(function(){ _pvEnCours=false; expPvBouton(false); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  // Boutons « PV à faire » / « PV de contrôle » : délégation (aucune chaîne de la base dans un onclick).
  document.addEventListener('click',function(e){
    var t=e.target, b=(t&&t.closest)?t.closest('.exp-pv-open'):null;
    if(b&&!b.disabled) expOpenPV(b.getAttribute('data-bc')||'',b.getAttribute('data-bl')||'');
  });
  document.addEventListener('change',function(e){
    var t=e.target;
    if(t&&t.classList&&(t.classList.contains('pv-l-rel')||t.classList.contains('pv-l-qte'))) expPvLigneMaj(Number(t.getAttribute('data-idx')));
    else if(t&&t.id==='pv_cert') expPvMarque(null);
  });
  // Saisie au fil de la frappe : quantité reçue et observation recalculent « Conforme ? » et la case reliquat.
  document.addEventListener('input',function(e){
    var t=e.target;
    if(t&&t.classList&&(t.classList.contains('pv-l-qte')||t.classList.contains('pv-l-obs'))) expPvLigneMaj(Number(t.getAttribute('data-idx')));
  });

  // Le lot refusé part physiquement chez le fournisseur : on note la date, qui l’envoie, et la
  // référence du bon de retour. La ligne quitte alors la liste « à renvoyer ».
  async function expRetourFournExpedie(qid, lib){
    var ref = await appMotif('Le lot ' + lib + ' part chez le fournisseur.\\nRéférence du bon de retour ou n° de suivi (facultatif) :', {title:'Retour fournisseur expédié', okLabel:'Expédié', min:0, placeholder:'Référence (facultatif)'});
    if(ref===null) return;
    fetch('/api/expeditions/retour-fournisseur/'+encodeURIComponent(qid)+'/expedie',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:ref})})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.',7000); return; }
        pushNotif('ok','fa-truck-arrow-right','Retour fournisseur expédié.',4500);
        setTimeout(function(){location.hash='envois';softReload();},900);
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
    // ⚠ /api/EXPEDITIONS/... et non /api/production/... : le service est deduit du 1er
    //   segment apres /api/, et le role logistique n'a que la LECTURE sur la production.
    //   L'ancien appel etait refuse en silence pour ceux dont c'est le metier.
    fetch('/api/expeditions/bds/'+encodeURIComponent(id)+'/retour',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date_retour_effective:today})})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||j.ok===false){ pushNotif('err','fa-ban',(j&&j.error)||'Echec.'); return; }
        pushNotif('ok','fa-rotate-left','Retour <strong>'+id+'</strong> enregistre.',4500);
        setTimeout(function(){ location.hash='receptions'; softReload(); },700);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); });
  }
  // Départ en sous-traitance : horodate l'envoi ; la ligne passe des « à envoyer » aux retours attendus.
  async function expEnvoyerBds(id){
    // La gamme d'abord : on n'expedie pas une piece dont l'operation precedente n'est
    // pas soldee. Le serveur refuse de toute facon (409) ; ici on l'explique avant.
    var bloc=EXP_BDS_BLOC[id];
    if(bloc){ pushNotif('err','fa-lock','Envoi impossible : '+bloc+'.',6000); return; }
    if(!(await appConfirm("Confirmer l envoi du BDS <strong>"+id+"</strong> chez le sous-traitant ?"))) return;
    var today=new Date().toISOString().slice(0,10);
    fetch('/api/expeditions/bds/'+encodeURIComponent(id)+'/envoyer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date_envoi:today})})
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
