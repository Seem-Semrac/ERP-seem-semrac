// ══════════════════════════════════════════════════════════════
// EXPÉDITIONS – Service Expéditions unifié
// BL Clients · BST · BC Fournisseurs/ST · Commandes · Dashboard
// ══════════════════════════════════════════════════════════════
import { escX, layout, serviceHeader, demandeAchatModal, buildValDirMap, valDirBadge } from './shared'
import type { BonDeLivraison, BonDeCommande, Commande, DemandeAchat, FournisseurSt } from './types'


const AMB   = '#f59e0b'
const AMB_D = '#d97706'
const TODAY = new Date().toISOString().slice(0, 10)

// ─── Données de démonstration ─────────────────────────────────

const BL_CLIENTS_DEFAULT: BonDeLivraison[] = []

const BST_DEFAULT: BonDeLivraison[] = []

const BC_DEFAULT: BonDeCommande[] = []

const CMDS_DEFAULT: Commande[] = []

const DA_DEFAULT: DemandeAchat[] = []

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

function cmdStatutBadge(s: string, retard: boolean) {
  if (retard) return badge('#fee2e2','#b91c1c','En retard')
  const m: Record<string,[string,string,string]> = {
    en_cours:  ['#dbeafe','#1d4ed8','En production'],
    a_livrer:  ['#fef3c7','#92400e','A livrer'],
    livree:    ['#dcfce7','#15803d','Livree'],
  }
  const v = m[s] ?? ['#f1f5f9','#6b7280', s]
  return badge(v[0], v[1], v[2])
}

function daStatutBadge(s: string) {
  const m: Record<string,[string,string,string]> = {
    en_attente: ['#fef3c7','#92400e','En attente'],
    commandee:  ['#dbeafe','#1d4ed8','Commandee'],
    en_transit: ['#cffafe','#0e7490','En transit'],
    recu:       ['#dcfce7','#15803d','Recu'],
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

function subTabBar(tabs: [string,string,string][], activeFirst: string, fn: string) {
  return `<div style="display:flex;gap:4px;background:#f1f5f9;border-radius:10px;padding:4px;width:fit-content;margin-bottom:20px;">
    ${tabs.map(([id,lbl,ic],i) => `<button onclick="${fn}('${id}')" id="exp-sub-${id}" class="exp-sub-tab${i===0?' exp-sub-active':''}">
      <i class="fas ${ic}"></i>${lbl}
    </button>`).join('')}
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PANEL 1 – BONS DE LIVRAISON
// ══════════════════════════════════════════════════════════════

// Numéro AFFICHÉ d'un bon de livraison. La renumérotation par affaire écrit `num_bl`
// (migration 002) sans toucher à l'identifiant technique, qui porte les rattachements.
// Fail-soft : sans cette colonne, on retombe sur l'identifiant — qui EST déjà le bon
// numéro pour tout BL créé depuis la nouvelle numérotation.
const numBL = (b: any) => String(b?.num_bl || b?.id || '')

function panelBL(bls: BonDeLivraison[], bsts: BonDeLivraison[], receptions: any[] = [], bcAttendus: any[] = []) {
  const aEnvoyer = bls.filter(b => b.statut === 'a_envoyer' || b.statut === 'prepare')
  const historique = bls.filter(b => b.statut === 'expedie' || b.statut === 'livre')
  const bstAujourdhui = bsts.filter(b => b.statut === 'a_envoyer')
  const bstTransit = bsts.filter(b => b.statut === 'en_transit')
  const bstHisto = bsts.filter(b => b.statut === 'recu' || b.statut === 'livre')
  const otdLivres = bls.filter(b => b.statut === 'livre')
  const otdOK = otdLivres.filter(b => b.otd && b.otd <= b.date_bl).length
  const otdRate = otdLivres.length > 0 ? Math.round(otdOK / otdLivres.length * 100) : 100

  return `
  <div id="exp-panel-bl" style="display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-truck-loading" style="color:${AMB};"></i>Bons de Livraison
        <span style="background:${AMB}20;color:${AMB_D};border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${bls.length + bsts.length}</span>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <div style="font-size:.78rem;color:#374151;">OTD : <strong style="color:${otdRate>=95?'#15803d':otdRate>=85?'#92400e':'#b91c1c'};">${otdRate}%</strong></div>
        <button onclick="expOpenModal('bl')" style="padding:8px 18px;background:linear-gradient(135deg,${AMB},${AMB_D});color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Nouveau BL</button>
      </div>
    </div>

    ${subTabBar([['bl-reception','Réceptions Fourn./ST','fa-dolly'],['bl-client','BL Clients','fa-users'],['bl-bst','BST Sous-Traitants','fa-exchange-alt']], 'bl-reception', 'expSwitchBLType')}

    <!-- RÉCEPTIONS FOURNISSEURS / SOUS-TRAITANTS (BC validés → BL de réception à l'arrivée du colis) -->
    <div id="exp-sub-panel-bl-reception">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#1d4ed8;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-dolly"></i>
        <span>Les bons de commande <strong>validés par le fournisseur/ST</strong> attendent ici la <strong>réception du colis</strong> : à l'arrivée, cliquez <strong>Réceptionner</strong> pour générer le bon de livraison de réception (entrée en stock + PV de contrôle).</span>
      </div>
      <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-truck-loading" style="color:${AMB};"></i>Réceptions attendues
        <span style="background:${AMB}20;color:${AMB_D};border-radius:999px;padding:1px 8px;font-size:.68rem;">${bcAttendus.length}</span>
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
        <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;">
          ${TH('N° BC')}${TH('Fournisseur / ST')}${TH('Articles')}${THC('Montant')}${THC('Affaire')}${THC('Action')}
        </tr></thead><tbody>
          ${bcAttendus.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:24px;color:#9ca3af;font-size:.82rem;">Aucune réception attendue — les BC validés par le fournisseur apparaîtront ici.</td></tr>` :
          bcAttendus.map((bc: any) => `
          <tr onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
            ${TD(`<div style="font-weight:700;color:${AMB};">${escX(bc.num_bc ?? bc.id)}</div><button onclick="bcPdf('${bc.id}')" style="margin-top:4px;background:#f5f3ff;color:#6d28d9;border:none;border-radius:6px;padding:3px 8px;font-size:.62rem;font-weight:700;cursor:pointer;"><i class="fas fa-file-pdf"></i> PDF</button>`)}
            ${TD(`<span style="font-weight:600;">${escX(bc.fournisseur ?? '—')}</span>${bc.type==='st'?' <span style="font-size:.6rem;color:#8b5cf6;font-weight:700;">ST</span>':''}`)}
            ${TD(`<span style="font-size:.73rem;color:#6b7280;">${escX(bc.articles ?? '—')}</span>`)}
            ${TDC(`<span style="font-weight:700;color:#374151;">${(bc.montant||0).toLocaleString('fr-FR')} €</span>`)}
            ${TDC(`<span style="font-size:.72rem;color:#6366f1;">${escX(bc.affaire_id ?? '—')}</span>`)}
            ${TDC(`<button onclick="expOpenReception('${bc.id}')" style="padding:5px 12px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-dolly"></i> Réceptionner</button>`)}
          </tr>`).join('')}
        </tbody></table></div>
      </div>
      <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-box-open" style="color:#10b981;"></i>Réceptions effectuées
        <span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:1px 8px;font-size:.68rem;">${receptions.length}</span>
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
        <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;">
          ${TH('N° BL')}${TH('Fournisseur / ST')}${TH('BC')}${TH('Articles')}${THC('Qté')}${THC('Date')}${THC('Statut')}
        </tr></thead><tbody>
          ${receptions.length === 0 ? `<tr><td colspan="7" style="text-align:center;padding:24px;color:#9ca3af;font-size:.82rem;">Aucune réception enregistrée</td></tr>` :
          receptions.map((bl: any) => `
          <tr onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
            ${TD(`<div style="font-weight:700;color:${AMB};">${escX(bl.id)}</div>`)}
            ${TD(escX(bl.client_nom ?? '—'))}
            ${TD(`<span style="font-size:.73rem;color:#6b7280;">${escX(bl.bc_id ?? '—')}</span>`)}
            ${TD(`<span style="font-weight:600;">${escX(bl.piece ?? '—')}</span>`)}
            ${TDC(`<strong>${bl.qte ?? '—'}</strong>`)}
            ${TDC(`<span style="font-size:.75rem;color:#6b7280;">${bl.date_bl ?? '—'}</span>`)}
            ${TDC(blStatutBadge(bl.statut))}
          </tr>`).join('')}
        </tbody></table></div>
      </div>
    </div>

    <!-- BL CLIENTS -->
    <div id="exp-sub-panel-bl-client" style="display:none;">
      ${aEnvoyer.length > 0 ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#1d4ed8;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-exclamation-circle"></i>
        <span><strong>${aEnvoyer.length} bon(s) de livraison</strong> en attente de depart.</span>
      </div>` : ''}
      <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-clock" style="color:${AMB};"></i>A envoyer
        <span style="background:${AMB}20;color:${AMB_D};border-radius:999px;padding:1px 8px;font-size:.68rem;">${aEnvoyer.length}</span>
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#fafafa;">
              ${TH('N° BL')}${TH('Client')}${TH('Commande')}${TH('Piece')}${THC('Qte')}${TH('Transport')}${THC('Date prevue')}${THC('Statut')}${THC('Actions')}
            </tr></thead>
            <tbody>
              ${aEnvoyer.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:24px;color:#9ca3af;font-size:.82rem;">Aucun BL a envoyer</td></tr>` :
              aEnvoyer.map(bl => `
              <tr onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
                ${TD(`<div style="font-weight:700;color:${AMB};">${escX(bl.id)}</div>`)}
                ${TD(escX(bl.client_nom ?? '—'))}
                ${TD(`<span style="font-size:.73rem;color:#6b7280;">${escX(bl.cmd_id ?? '—')}</span>`)}
                ${TD(`<span style="font-weight:600;">${escX(bl.piece ?? '—')}</span>`)}
                ${TDC(`<strong>${bl.qte}</strong>`)}
                ${TD(escX(bl.transport ?? '—'))}
                ${TDC(`<span style="font-size:.75rem;color:#6b7280;">${bl.date_bl}</span>`)}
                ${TDC(blStatutBadge(bl.statut))}
                ${TDC(`<div style="display:flex;gap:6px;justify-content:center;">
                  <button onclick="expEnvoyerBL('${bl.id}')" style="padding:5px 12px;background:linear-gradient(135deg,${AMB},${AMB_D});color:white;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane"></i> Envoyer</button>
                  <button onclick="expImprimerBL('${bl.id}')" style="padding:5px 10px;background:#f1f5f9;color:#475569;border:none;border-radius:7px;font-size:.7rem;cursor:pointer;" title="Imprimer"><i class="fas fa-print"></i></button>
                </div>`)}
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="expToggleSection('bl-histo')">
        <i class="fas fa-history" style="color:#6b7280;"></i>Historique (12 mois)
        <span style="background:#f1f5f9;color:#6b7280;border-radius:999px;padding:1px 8px;font-size:.68rem;">${historique.length}</span>
        <i class="fas fa-chevron-down" id="bl-histo-ico" style="margin-left:auto;color:#94a3b8;font-size:.65rem;"></i>
      </div>
      <div id="bl-histo" style="display:none;">
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr style="background:#fafafa;">
                ${TH('N° BL')}${TH('Client')}${TH('Commande')}${TH('Piece')}${THC('Qte')}${TH('Transport')}${THC('Date BL')}${THC('OTD')}${THC('Statut')}
              </tr></thead>
              <tbody>
                ${historique.map(bl => `
                <tr onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
                  ${TD(`<div style="font-weight:700;color:#6b7280;">${escX(bl.id)}</div>`)}
                  ${TD(escX(bl.client_nom ?? '—'))}
                  ${TD(`<span style="font-size:.73rem;color:#6b7280;">${escX(bl.cmd_id ?? '—')}</span>`)}
                  ${TD(escX(bl.piece ?? '—'))}
                  ${TDC(`${bl.qte}`)}
                  ${TD(escX(bl.transport ?? '—'))}
                  ${TDC(`<span style="font-size:.75rem;color:#6b7280;">${bl.date_bl}</span>`)}
                  ${TDC(bl.otd ? (bl.otd <= bl.date_bl ? badge('#dcfce7','#15803d','Dans les delais') : badge('#fee2e2','#b91c1c','En retard')) : '—')}
                  ${TDC(blStatutBadge(bl.statut))}
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- BST SOUS-TRAITANTS -->
    <div id="exp-sub-panel-bl-bst" style="display:none;">
      ${bstAujourdhui.length > 0 ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#78350f;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-calendar-day"></i>
        <span><strong>${bstAujourdhui.length} BST a preparer aujourd&#39;hui</strong> selon le Gantt sous-traitance.</span>
      </div>` : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#15803d;display:flex;align-items:center;gap:10px;"><i class="fas fa-check-circle"></i><span>Aucun BST a preparer aujourd&#39;hui.</span></div>`}
      <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-calendar-day" style="color:${AMB};"></i>A preparer aujourd&#39;hui
        <span style="background:${AMB}20;color:${AMB_D};border-radius:999px;padding:1px 8px;font-size:.68rem;">${bstAujourdhui.length}</span>
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#fafafa;">
              ${TH('N° BST')}${TH('Sous-traitant')}${TH('Lot')}${TH('Piece')}${TH('Operation ST')}${THC('Qte')}${THC('Date prevue Gantt')}${THC('Actions')}
            </tr></thead>
            <tbody>
              ${bstAujourdhui.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:24px;color:#9ca3af;">Aucun BST prevu aujourd&#39;hui</td></tr>` :
              bstAujourdhui.map(b => `
              <tr onmouseenter="this.style.background='#fffbeb'" onmouseleave="this.style.background=''">
                ${TD(`<div style="font-weight:700;color:${AMB};">${escX(b.id)}</div>`)}
                ${TD(`<span style="font-weight:600;">${escX(b.client_nom ?? '—')}</span>`)}
                ${TD(`<span style="font-size:.73rem;color:#374151;font-weight:600;">${escX(b.lot_id ?? '—')}</span>`)}
                ${TD(escX(b.piece ?? '—'))}
                ${TD(`<span style="font-size:.73rem;color:#6b7280;">${escX(b.operation ?? '—')}</span>`)}
                ${TDC(`<strong>${b.qte}</strong>`)}
                ${TDC(`<span style="font-size:.75rem;font-weight:700;color:${AMB_D};">${b.date_envoi_prevu ?? b.date_bl}</span>`)}
                ${TDC(`<div style="display:flex;gap:6px;justify-content:center;">
                  <button onclick="expEnvoyerBST('${b.id}')" style="padding:5px 12px;background:linear-gradient(135deg,${AMB},${AMB_D});color:white;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane"></i> Envoyer</button>
                  <button onclick="expOpenModal('bst')" style="padding:5px 10px;background:#f1f5f9;color:#475569;border:none;border-radius:7px;font-size:.7rem;cursor:pointer;"><i class="fas fa-file-alt"></i></button>
                </div>`)}
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-shipping-fast" style="color:#0891b2;"></i>En transit (retour attendu)
        <span style="background:#cffafe;color:#0e7490;border-radius:999px;padding:1px 8px;font-size:.68rem;">${bstTransit.length}</span>
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#fafafa;">
              ${TH('N° BST')}${TH('Sous-traitant')}${TH('Lot')}${TH('Piece')}${TH('Operation ST')}${THC('Qte')}${THC('Date envoi')}${THC('Statut')}${THC('Action')}
            </tr></thead>
            <tbody>
              ${bstTransit.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:24px;color:#9ca3af;">Aucun BST en transit</td></tr>` :
              bstTransit.map(b => `
              <tr onmouseenter="this.style.background='#f0fdfa'" onmouseleave="this.style.background=''">
                ${TD(`<div style="font-weight:700;color:#0891b2;">${escX(b.id)}</div>`)}
                ${TD(escX(b.client_nom ?? '—'))}
                ${TD(`<span style="font-size:.73rem;font-weight:600;">${escX(b.lot_id ?? '—')}</span>`)}
                ${TD(escX(b.piece ?? '—'))}
                ${TD(`<span style="font-size:.73rem;color:#6b7280;">${escX(b.operation ?? '—')}</span>`)}
                ${TDC(b.qte.toString())}
                ${TDC(`<span style="font-size:.75rem;color:#6b7280;">${b.date_bl}</span>`)}
                ${TDC(blStatutBadge(b.statut))}
                ${TDC(`<button onclick="expReceptionnerBST('${b.id}')" style="padding:5px 12px;background:#dcfce7;color:#15803d;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-check"></i> Retour recu</button>`)}
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div style="font-size:.75rem;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;cursor:pointer;" onclick="expToggleSection('bst-histo')">
        <i class="fas fa-history" style="color:#6b7280;"></i> Historique BST (${bstHisto.length})
      </div>
      <div id="bst-histo" style="display:none;">
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:16px;">
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr style="background:#fafafa;">${TH('N° BST')}${TH('Sous-traitant')}${TH('Lot')}${TH('Piece')}${THC('Qte')}${THC('Date envoi')}${THC('Statut')}</tr></thead>
              <tbody>
                ${bstHisto.map(b => `
                <tr onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
                  ${TD(`<span style="font-weight:700;color:#6b7280;">${escX(b.id)}</span>`)}
                  ${TD(escX(b.client_nom ?? '—'))}
                  ${TD(`<span style="font-size:.73rem;">${escX(b.lot_id ?? '—')}</span>`)}
                  ${TD(escX(b.piece ?? '—'))}
                  ${TDC(b.qte.toString())}
                  ${TDC(`<span style="font-size:.75rem;color:#6b7280;">${b.date_bl}</span>`)}
                  ${TDC(blStatutBadge(b.statut))}
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PANEL 2 – BONS DE COMMANDE
// ══════════════════════════════════════════════════════════════

function panelBC(bcs: any[], _fstList: FournisseurSt[], vdMap: Record<string, any> = {}, hasAck = false) {
  // Mapping statuts DB → cycle métier :
  //  envoye/en_attente/confirme/brouillon/accuse = commande émise (avant réception)
  //  recu_partiel/receptionne                    = réceptionné, PV de contrôle à faire
  //  recu/controle/cloture                       = PV fait, parti en Qualité
  const isEnAttente   = (s: string) => ['en_attente','envoye','confirme','brouillon','accuse'].includes(s)
  const isReceptionne = (s: string) => ['receptionne','recu_partiel','recu','controle','cloture'].includes(s)
  const pvDone        = (s: string) => ['recu','controle','cloture'].includes(s)
  // Chaîne : BC émis → EN ATTENTE DE VALIDATION fournisseur (tant que non validé) → une fois
  // validé (accuse_fournisseur_le), EN ATTENTE DE RÉCEPTION. Repli sans la colonne (base non
  // migrée, ex. Cloudflare) : on saute la validation → tout BC émis va direct en réception.
  const enValidation = (b: any) => hasAck && isEnAttente(b.statut) && !b.accuse_fournisseur_le
  const bcOuverts = bcs.filter(b => isEnAttente(b.statut) || b.statut === 'recu_partiel' || b.statut === 'receptionne').length

  // Rendu d'un tableau de BC selon l'étape du cycle métier :
  //  'validation' → BC envoyé, EN ATTENTE DE VALIDATION par le fournisseur/ST (bouton Valider ; Relancer à J+7)
  //  'attente'    → BC validé par le fournisseur → EN ATTENTE DE RÉCEPTION (bouton Réceptionner)
  //  'recus'      → réceptionné → PV de contrôle → Qualité
  const bcTable = (rows: any[], kind: 'four' | 'st', mode: 'validation' | 'attente' | 'recus') => {
    const stCol = kind === 'st'
    const headCols = stCol
      ? `${TH('N° BC')}${TH('Sous-traitant')}${TH('Operation / Lot')}${THC('Montant')}${THC('Affaire')}${THC('Livraison')}${THC('Statut')}${THC('Action')}`
      : `${TH('N° BC')}${TH('Fournisseur')}${TH('Articles')}${TH('DA liée')}${THC('Montant')}${THC('Affaire')}${THC('Statut')}${THC('Action')}`
    const colspan = 8
    const emptyMsg = mode === 'validation' ? 'Aucune commande en attente de validation' : mode === 'attente' ? 'Aucune commande en attente de réception' : 'Aucune commande réceptionnée'
    const body = rows.length === 0
      ? `<tr><td colspan="${colspan}" style="text-align:center;padding:22px;color:#9ca3af;">${emptyMsg}</td></tr>`
      : rows.map(bc => {
          // Relance suggérée : sans validation fournisseur au bout de 7 jours calendaires
          // (repart de la dernière relance notifiée si elle existe, sinon de la date du BC).
          const _base = bc.date_relance || bc.date_bc
          const _baseMs = _base ? new Date(_base).getTime() : 0
          const bcRelance = mode === 'validation' && _baseMs > 0 && (Date.now() - _baseMs) >= 7 * 86400000
          const action = mode === 'validation'
            ? `<button onclick="bcAccuse('${bc.id}')" title="Le fournisseur/ST a validé la commande → passe en attente de réception" style="padding:5px 12px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-check"></i> Valider</button>`
            : mode === 'attente'
              ? `<button onclick="expOpenReception('${bc.id}')" style="padding:5px 12px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-truck-loading"></i> Réceptionner</button>`
              : (pvDone(bc.statut)
                  ? `<a href="/qualite/service" style="padding:5px 10px;background:#dcfce7;color:#15803d;border:none;border-radius:7px;font-size:.7rem;font-weight:700;text-decoration:none;display:inline-block;"><i class="fas fa-clipboard-check"></i> PV → Qualité</a>`
                  : `<button onclick="expOpenPV('${bc.id}')" style="padding:5px 12px;background:linear-gradient(135deg,#ef4444,#b91c1c);color:white;border:none;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-clipboard-check"></i> PV de contrôle</button>`)
          const mid = stCol
            ? `${TDC(`<span style="font-weight:700;color:#374151;">${(bc.montant||0).toLocaleString('fr-FR')} €</span>`)}${TDC(`<span style="font-size:.72rem;color:#6366f1;">${escX(bc.affaire_id ?? '—')}</span>`)}${TDC(`<span style="font-size:.75rem;color:#6b7280;">${bc.date_livraison_prevue ?? '—'}</span>`)}`
            : `${TD(bc.da_id ? `<span style="font-size:.72rem;font-weight:600;color:#3b82f6;">${escX(bc.da_id)}</span>` : '<span style="color:#9ca3af;">—</span>')}${TDC(`<span style="font-weight:700;color:#374151;">${(bc.montant||0).toLocaleString('fr-FR')} €</span>`)}${TDC(`<span style="font-size:.72rem;color:#6366f1;">${escX(bc.affaire_id ?? '—')}</span>`)}`
          // PDF toujours accessible ; Relancer n'apparaît qu'en attente de validation passé J+7.
          const bcTools = `<div style="display:flex;gap:4px;margin-top:5px;flex-wrap:wrap;">`
            + `<button onclick="bcPdf('${bc.id}')" title="Exporter / envoyer le BC en PDF" style="background:#f5f3ff;color:#6d28d9;border:none;border-radius:6px;padding:3px 8px;font-size:.63rem;font-weight:700;cursor:pointer;"><i class="fas fa-file-pdf"></i> PDF</button>`
            + (bcRelance ? `<button onclick="bcRelancer('${bc.id}')" title="Noter la relance (régénère le PDF à renvoyer)" style="background:#ffedd5;color:#9a3412;border:none;border-radius:6px;padding:3px 8px;font-size:.63rem;font-weight:700;cursor:pointer;"><i class="fas fa-rotate-right"></i> Relancer</button>` : '')
            + `</div>`
          return `
          <tr onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
            ${TD(`<div style="font-weight:700;color:${AMB};">${escX(bc.num_bc ?? bc.id)}</div>${bc.bl_id?`<div style="font-size:.64rem;color:#0369a1;">BL ${escX(bc.bl_id)}</div>`:''}${bcTools}`)}
            ${TD(`<span style="font-weight:600;">${escX(bc.fournisseur ?? '—')}</span>`)}
            ${TD(`<span style="font-size:.73rem;color:#6b7280;">${escX(bc.articles ?? '—')}</span>`)}
            ${mid}
            ${TDC(`<div style="display:flex;flex-direction:column;align-items:center;gap:3px;">${bcStatutBadge(bc.statut)}${bc.accuse_fournisseur_le?'<span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:1px 8px;font-size:.58rem;font-weight:800;">validée fournisseur</span>':''}${bcRelance?'<span style="background:#ffedd5;color:#9a3412;border-radius:999px;padding:1px 8px;font-size:.58rem;font-weight:800;">à relancer</span>':''}${valDirBadge(vdMap, 'bons_de_commande', bc.id)}</div>`)}
            ${TDC(action)}
          </tr>`
        }).join('')
    const hdr = mode === 'validation'
      ? { ic: 'fa-user-clock', col: '#f59e0b', bg: '#fef3c7', fg: '#92400e', lbl: kind === 'st' ? 'En attente de validation sous-traitant' : 'En attente de validation fournisseur' }
      : mode === 'attente'
        ? { ic: 'fa-hourglass-half', col: '#0ea5e9', bg: '#e0f2fe', fg: '#0369a1', lbl: 'En attente de réception' }
        : { ic: 'fa-box-open', col: '#10b981', bg: '#dcfce7', fg: '#15803d', lbl: 'Commandes réceptionnées' }
    return `<div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:20px;">
      <div style="padding:11px 16px;border-bottom:1px solid #f1f5f9;font-size:.82rem;font-weight:700;color:#374151;display:flex;align-items:center;gap:8px;">
        <i class="fas ${hdr.ic}" style="color:${hdr.col};"></i>
        ${hdr.lbl}
        <span style="background:${hdr.bg};color:${hdr.fg};border-radius:999px;padding:1px 9px;font-size:.68rem;font-weight:800;">${rows.length}</span>
      </div>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;">${headCols}</tr></thead><tbody>${body}</tbody></table></div>
    </div>`
  }

  const bcFourVal = bcs.filter(b => b.type === 'fournisseur' && enValidation(b))
  const bcFourRec = bcs.filter(b => b.type === 'fournisseur' && isReceptionne(b.statut))
  const bcSTVal   = bcs.filter(b => b.type === 'st' && enValidation(b))
  const bcSTRec   = bcs.filter(b => b.type === 'st' && isReceptionne(b.statut))

  return `
  <div id="exp-panel-bc" style="display:block;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-file-contract" style="color:${AMB};"></i>Bons de Commande
        <span style="background:${AMB}20;color:${AMB_D};border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${bcOuverts} en cours</span>
      </div>
      <span style="font-size:.74rem;color:#92400e;background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:6px 12px;"><i class="fas fa-info-circle" style="margin-right:5px;"></i>Les BC se créent uniquement depuis une Demande d'Achat (Service Achats)</span>
    </div>

    <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#78350f;display:flex;align-items:center;gap:10px;">
      <i class="fas fa-info-circle"></i>
      <span>Les BC sont générés depuis les <strong>Demandes d'Achat soumises</strong> (Service Achats). Ouvrez une commande <strong>en attente</strong> pour la lier à un bon de livraison à réception ; puis remplissez le <strong>PV de contrôle</strong> qui part en Qualité.</span>
    </div>

    ${subTabBar([['bc-four','BC Fournisseurs','fa-truck'],['bc-st','BC Sous-Traitants','fa-industry']], 'bc-four', 'expSwitchBCType')}

    <!-- BC FOURNISSEURS · réception déplacée dans l'onglet Bons de Livraison (Réceptions Fourn./ST) -->
    <div id="exp-sub-panel-bc-four">
      ${bcTable(bcFourVal, 'four', 'validation')}
      ${bcTable(bcFourRec, 'four', 'recus')}
    </div>

    <!-- BC SOUS-TRAITANTS -->
    <div id="exp-sub-panel-bc-st" style="display:none;">
      ${bcTable(bcSTVal, 'st', 'validation')}
      ${bcTable(bcSTRec, 'st', 'recus')}
    </div>
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PANEL 3 – COMMANDES EN COURS
// ══════════════════════════════════════════════════════════════

function panelCommandes(cmds: Commande[], das: DemandeAchat[], qualiteBloque: (c: any) => string | null) {
  const cmdsEnCours = cmds.filter(c => c.statut !== 'livree' && c.statut !== 'annulee')
  const dasPending  = das.filter(d => d.statut === 'commandee' || d.statut === 'en_attente' || d.statut === 'en_transit')
  const retards = cmdsEnCours.filter(c => c.retard).length

  return `
  <div id="exp-panel-commandes" style="display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-stream" style="color:${AMB};"></i>Commandes en cours
        ${retards > 0 ? `<span style="background:#fee2e2;color:#b91c1c;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${retards} en retard</span>` : ''}
      </div>
    </div>

    ${subTabBar([['cmd-client','Production clients','fa-industry'],['cmd-four','Fournisseurs / ST en attente','fa-truck']], 'cmd-client', 'expSwitchCmdType')}

    <!-- COMMANDES CLIENTS EN PRODUCTION -->
    <div id="exp-sub-panel-cmd-client">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#1d4ed8;display:flex;align-items:center;gap:10px;">
        <i class="fas fa-eye"></i>
        <span>Vue lecture seule depuis le Commercial. Consultez le Service Commercial pour modifier les commandes.</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
        ${kpiCard('fa-layer-group',AMB, cmdsEnCours.length, 'Commandes en production', '')}
        ${kpiCard('fa-exclamation-triangle','#ef4444', retards, 'En retard', 'Date livraison depassee')}
        ${kpiCard('fa-check-circle','#22c55e', cmdsEnCours.filter(c=>c.bdt_soldes===c.bdt_total&&c.bdt_total>0&&!qualiteBloque(c)).length, 'Prets a expedier', 'BDT soldes + qualite OK')}
        ${kpiCard('fa-lock','#b91c1c', cmdsEnCours.filter(c=>c.bdt_soldes===c.bdt_total&&c.bdt_total>0&&qualiteBloque(c)).length, 'Bloquees qualite', 'NC bloquante / quarantaine')}
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#fafafa;">${TH('N° Affaire')}${TH('Client')}${TH('Pieces')}${THC('Montant')}${THC('Date livraison')}${THC('Avancement BDT')}${THC('ST')}${THC('Statut')}</tr></thead>
            <tbody>
              ${cmdsEnCours.length === 0 ? `<tr><td colspan="8" style="text-align:center;padding:24px;color:#9ca3af;">Aucune commande en cours</td></tr>` :
              cmdsEnCours.map(c => {
                const pct = c.bdt_total > 0 ? Math.round(c.bdt_soldes / c.bdt_total * 100) : 0
                return `
                <tr onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
                  ${TD(`<div style="font-weight:700;color:${AMB};">${escX(c.num_affaire)}</div>`)}
                  ${TD(`<span style="font-weight:600;">${escX(c.client_nom ?? '—')}</span>`)}
                  ${TD(`<span style="font-size:.73rem;color:#6b7280;">${escX(c.pieces?.join(', ') ?? '—')}</span>`)}
                  ${TDC(`<span style="font-weight:700;">${c.montant?.toLocaleString('fr-FR')} EUR</span>`)}
                  ${TDC(`<span style="font-size:.75rem;font-weight:700;color:${c.retard?'#b91c1c':'#374151'};">${c.date_liv ?? '—'}</span>`)}
                  ${TDC(`<div style="display:flex;align-items:center;gap:6px;">
                    <div style="flex:1;height:6px;background:#f1f5f9;border-radius:999px;min-width:60px;"><div style="height:100%;background:${pct===100?'#22c55e':AMB};border-radius:999px;width:${pct}%;"></div></div>
                    <span style="font-size:.68rem;font-weight:700;color:#374151;">${c.bdt_soldes}/${c.bdt_total}</span>
                  </div>`)}
                  ${TDC(c.has_st ? badge('#fef3c7','#92400e','ST') : '<span style="color:#9ca3af;">—</span>')}
                  ${TDC(cmdStatutBadge(c.statut, c.retard) + (c.bdt_total > 0 && c.bdt_soldes === c.bdt_total && qualiteBloque(c) ? `<div style="margin-top:4px;font-size:.58rem;font-weight:800;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:1px 6px;display:inline-block;"><i class="fas fa-lock" style="margin-right:3px;"></i>Bloqué : ${escX(qualiteBloque(c))}</div>` : ''))}
                </tr>`
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- FOURNISSEURS / ST EN ATTENTE -->
    <div id="exp-sub-panel-cmd-four" style="display:none;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
        ${kpiCard('fa-clock','#f59e0b', dasPending.length, 'DA / livraisons en attente', '')}
        ${kpiCard('fa-exclamation-circle','#ef4444', dasPending.filter(d=>(d.livraison??'') < TODAY && d.statut!=='recu').length, 'Livraisons en retard', 'Date depassee')}
        ${kpiCard('fa-truck','#0891b2', dasPending.filter(d=>d.statut==='en_transit').length, 'En transit', 'En cours de livraison')}
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#fafafa;">${TH('N° DA')}${TH('Article')}${TH('Fournisseur')}${THC('Qte')}${THC('Priorite')}${THC('Date commande')}${THC('Livraison prevue')}${THC('Statut')}${THC('BC lie')}</tr></thead>
            <tbody>
              ${dasPending.length === 0 ? `<tr><td colspan="9" style="text-align:center;padding:24px;color:#9ca3af;">Aucune livraison en attente</td></tr>` :
              dasPending.map(d => `
              <tr onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
                ${TD(`<div style="font-weight:700;color:#6b7280;">${escX(d.id)}</div>`)}
                ${TD(`<span style="font-weight:600;font-size:.79rem;">${escX(d.article)}</span>`)}
                ${TD(escX(d.fournisseur ?? '—'))}
                ${TDC(d.qte ?? '—')}
                ${TDC(d.priorite === 'urgent' ? badge('#fee2e2','#b91c1c','Urgent') : badge('#f1f5f9','#6b7280','Normal'))}
                ${TDC(`<span style="font-size:.75rem;color:#6b7280;">${d.date_da}</span>`)}
                ${TDC(`<span style="font-size:.75rem;font-weight:700;color:${(d.livraison??'') < TODAY && d.statut!=='recu' ? '#b91c1c' : '#374151'};">${d.livraison ?? '—'}</span>`)}
                ${TDC(daStatutBadge(d.statut))}
                ${TDC('<span style="color:#9ca3af;font-size:.73rem;">—</span>')}
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`
}

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
// PANEL – PLANNING DES ARRIVÉES (BC fournisseurs/ST → date d'arrivée prévue)
//   Timeline/Gantt par fournisseur ; statuts colorés ; retards en rouge ;
//   OTD figé sur la 1ʳᵉ date prévue (date_livraison_initiale).
// ══════════════════════════════════════════════════════════════
function panelPlanningArrivees(bcsRaw: any[]) {
  const dISO = (s: string) => new Date(String(s).slice(0, 10) + 'T00:00:00Z')
  const isoOf = (d: Date) => d.toISOString().slice(0, 10)
  const addDays = (s: string, n: number) => { const d = dISO(s); d.setUTCDate(d.getUTCDate() + n); return isoOf(d) }
  const diffDays = (a: string, b: string) => Math.round((dISO(b).getTime() - dISO(a).getTime()) / 86400000)
  const dow = (s: string) => (dISO(s).getUTCDay() + 6) % 7            // 0 = lundi
  const frDate = (s: string) => { const p = String(s).slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] : s }
  const attr = (s: any) => escX(String(s ?? '')).replace(/"/g, '&quot;')

  const recu = (b: any) => ['recu_partiel', 'recu_total', 'recu', 'controle', 'cloture'].includes(String(b.statut)) || !!b.bl_id
  const norm = (b: any) => ({
    id: b.id, num_bc: b.num_bc || b.id,
    type: b.type === 'st' ? 'st' : 'fournisseur',
    fournisseur: b.fournisseur || '—',
    montant: Number(b.montant || 0) || 0,
    prevue: b.date_livraison_prevue ? String(b.date_livraison_prevue).slice(0, 10) : null,
    initiale: b.date_livraison_initiale ? String(b.date_livraison_initiale).slice(0, 10) : null,
    reception: b.date_reception_reelle ? String(b.date_reception_reelle).slice(0, 10) : null,
    bl_id: b.bl_id || null,
    statut: b.statut || 'en_attente',
  })
  const all = (bcsRaw || []).map(norm)
  const planifiables = all.filter(b => b.prevue && b.statut !== 'annule')
  const sansDate = all.filter(b => !b.prevue && !recu(b) && b.statut !== 'annule' && b.statut !== 'cloture')

  const stateOf = (b: any) => recu(b)
    ? (b.statut === 'recu_partiel' ? 'partiel' : 'recu')
    : (b.prevue < TODAY ? 'retard' : (b.statut === 'accuse' ? 'accuse' : 'attente'))
  const COL: Record<string, [string, string, string]> = {
    attente: ['#fef3c7', '#d97706', '#92400e'],
    accuse:  ['#dbeafe', '#2563eb', '#1d4ed8'],
    retard:  ['#fee2e2', '#dc2626', '#b91c1c'],
    partiel: ['#cffafe', '#0891b2', '#0e7490'],
    recu:    ['#dcfce7', '#16a34a', '#15803d'],
  }
  const LABELS: Record<string, string> = { attente: 'En attente', accuse: 'Accusé', retard: 'En retard', partiel: 'Reçu partiel', recu: 'Réceptionné' }

  const nRetard = planifiables.filter(b => stateOf(b) === 'retard').length
  const nAttente = planifiables.filter(b => ['attente', 'accuse'].includes(stateOf(b))).length
  const nRecu = planifiables.filter(b => recu(b)).length
  let otdTot = 0, otdOk = 0
  for (const b of planifiables) { if (!recu(b)) continue; const prom = b.initiale || b.prevue; const act = b.reception; if (!prom || !act) continue; otdTot++; if (act <= prom) otdOk++ }
  const otdGlobal = otdTot ? Math.round(otdOk / otdTot * 100) : null

  // ── Fenêtre temporelle : passé borné à −21 j, futur à +120 j, snap lundi→dimanche ──
  let minD = TODAY, maxD = TODAY
  for (const b of planifiables) { if ((b.prevue as string) < minD) minD = b.prevue as string; if ((b.prevue as string) > maxD) maxD = b.prevue as string }
  let start = minD < addDays(TODAY, -21) ? addDays(TODAY, -21) : (minD < TODAY ? minD : TODAY)
  let end = maxD > addDays(TODAY, 120) ? addDays(TODAY, 120) : (maxD > addDays(TODAY, 21) ? maxD : addDays(TODAY, 21))
  start = addDays(start, -dow(start)); end = addDays(end, 6 - dow(end))
  const totalDays = Math.max(7, diffDays(start, end))
  const PX = 15, LABW = 200, width = totalDays * PX
  const leftOf = (s: string) => Math.max(0, Math.min(totalDays, diffDays(start, s))) * PX

  const byF: Record<string, any[]> = {}
  for (const b of planifiables) { (byF[b.fournisseur] = byF[b.fournisseur] || []).push(b) }
  const lanes = Object.keys(byF).sort((a, b) => a.localeCompare(b)).map(k => ({ nom: k, type: byF[k][0].type, list: byF[k] }))

  let weekCells = ''
  for (let d = start; d <= end; d = addDays(d, 7)) {
    weekCells += `<div style="position:absolute;left:${leftOf(d)}px;top:0;bottom:0;border-left:1px solid #eef2f7;"></div>`
      + `<div style="position:absolute;left:${leftOf(d) + 4}px;top:5px;font-size:.6rem;color:#94a3b8;font-family:monospace;white-space:nowrap;">${frDate(d)}</div>`
  }
  const todayLine = (TODAY >= start && TODAY <= end)
    ? `<div style="position:absolute;left:${leftOf(TODAY)}px;top:0;bottom:0;width:2px;background:#ef4444;z-index:1;"></div>`
      + `<div style="position:absolute;left:${leftOf(TODAY) + 3}px;top:5px;font-size:.58rem;color:#ef4444;font-weight:800;">auj.</div>` : ''

  const marker = (b: any) => {
    const st = stateOf(b); const c = COL[st]
    const slip = b.initiale && b.prevue && b.initiale !== b.prevue
    const ghost = slip
      ? `<div title="Date initiale : ${attr(frDate(b.initiale))}" style="position:absolute;left:${leftOf(b.initiale)}px;top:12px;width:9px;height:9px;border-radius:50%;border:1.5px dashed #cbd5e1;background:#fff;z-index:2;"></div>`
        + `<div style="position:absolute;left:${Math.min(leftOf(b.initiale), leftOf(b.prevue))}px;top:16px;width:${Math.abs(leftOf(b.prevue) - leftOf(b.initiale))}px;border-top:1.5px dashed #cbd5e1;"></div>`
      : ''
    return ghost + `<div class="arr-mk" data-bc="${attr(b.id)}" data-state="${st}" title="${attr(b.num_bc + ' · ' + b.fournisseur + ' · prevu ' + frDate(b.prevue) + ' · ' + LABELS[st])}" `
      + `style="position:absolute;left:${leftOf(b.prevue)}px;top:6px;background:${c[0]};border:1.5px solid ${c[1]};color:${c[2]};border-radius:7px;padding:2px 7px;font-size:.64rem;font-weight:700;white-space:nowrap;cursor:pointer;z-index:3;box-shadow:0 1px 2px rgba(0,0,0,.08);">`
      + `${slip ? '<i class="fas fa-clock-rotate-left" style="font-size:.55rem;margin-right:3px;opacity:.7;"></i>' : ''}${escX(b.num_bc)}</div>`
  }
  const laneOtd = (list: any[]) => { let t = 0, o = 0; for (const b of list) { if (!recu(b)) continue; const p = b.initiale || b.prevue; const a = b.reception; if (!p || !a) continue; t++; if (a <= p) o++ } return t ? Math.round(o / t * 100) : null }

  const lanesHtml = lanes.map(ln => {
    const otd = laneOtd(ln.list)
    const tBadge = ln.type === 'st'
      ? '<span style="background:#ede9fe;color:#6d28d9;border-radius:5px;padding:0 5px;font-size:.55rem;font-weight:800;">ST</span>'
      : '<span style="background:#fef3c7;color:#92400e;border-radius:5px;padding:0 5px;font-size:.55rem;font-weight:800;">FOU</span>'
    return `<div class="arr-lane" data-type="${ln.type}" style="display:flex;border-top:1px solid #f1f5f9;">`
      + `<div style="width:${LABW}px;flex:none;position:sticky;left:0;background:#fff;z-index:4;padding:7px 10px;border-right:1px solid #e2e8f0;">`
        + `<div style="display:flex;align-items:center;gap:6px;"><span style="font-size:.75rem;font-weight:700;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;">${escX(ln.nom)}</span>${tBadge}</div>`
        + `<div style="font-size:.6rem;color:#94a3b8;margin-top:2px;">${ln.list.length} BC${otd != null ? ` · OTD <b style="color:${otd >= 95 ? '#15803d' : otd >= 85 ? '#b45309' : '#b91c1c'};">${otd}%</b>` : ''}</div>`
      + `</div>`
      + `<div class="arr-track" style="position:relative;width:${width}px;height:36px;flex:none;">${ln.list.map(marker).join('')}</div>`
      + `</div>`
  }).join('')

  const fbtns = [['all', 'Tous', 'fa-layer-group'], ['fournisseur', 'Fournisseurs', 'fa-industry'], ['st', 'Sous-traitants', 'fa-exchange-alt'], ['attente', 'À recevoir', 'fa-hourglass-half'], ['retard', 'En retard', 'fa-triangle-exclamation']]
    .map(([f, l, ic], i) => `<button class="arr-fbtn${i === 0 ? ' arr-fbtn-on' : ''}" data-f="${f}" onclick="expArrFilter('${f}')"><i class="fas ${ic}"></i> ${l}</button>`).join('')

  return `
  <div id="exp-panel-planning" style="display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-calendar-week" style="color:${AMB};"></i>Planning des arrivées <span style="font-weight:500;color:#94a3b8;font-size:.82rem;">fournisseurs &amp; sous-traitants</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">${fbtns}</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;">
      ${kpiCard('fa-hourglass-half', AMB, nAttente, 'À recevoir', 'BC en attente de réception')}
      ${kpiCard('fa-triangle-exclamation', '#dc2626', nRetard, 'En retard', 'date prévue dépassée')}
      ${kpiCard('fa-boxes-packing', '#16a34a', nRecu, 'Réceptionnés', 'sur la période affichée')}
      ${kpiCard('fa-bullseye', otdGlobal != null && otdGlobal >= 95 ? '#16a34a' : otdGlobal != null && otdGlobal >= 85 ? '#d97706' : '#dc2626', otdGlobal != null ? otdGlobal + '%' : '—', 'OTD figé', 'vs 1ʳᵉ date promise')}
    </div>

    ${planifiables.length === 0 ? `<div style="text-align:center;padding:40px;color:#9ca3af;font-size:.85rem;background:#f8fafc;border-radius:12px;">Aucune commande fournisseur/ST avec une date d'arrivée prévue.</div>` : `
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="overflow-x:auto;">
        <div style="min-width:${LABW + width}px;">
          <div style="display:flex;border-bottom:2px solid #f1f5f9;background:#fafafa;">
            <div style="width:${LABW}px;flex:none;position:sticky;left:0;background:#fafafa;z-index:5;padding:6px 10px;font-size:.62rem;font-weight:800;color:#64748b;border-right:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:.04em;">Fournisseur / ST</div>
            <div style="position:relative;width:${width}px;height:24px;flex:none;">${weekCells}${todayLine}</div>
          </div>
          ${lanesHtml}
        </div>
      </div>
    </div>`}

    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:14px;font-size:.7rem;color:#64748b;align-items:center;">
      ${Object.keys(LABELS).map(k => `<span style="display:inline-flex;align-items:center;gap:5px;"><span style="width:11px;height:11px;border-radius:3px;background:${COL[k][0]};border:1.5px solid ${COL[k][1]};"></span>${LABELS[k]}</span>`).join('')}
      <span style="display:inline-flex;align-items:center;gap:5px;"><i class="fas fa-clock-rotate-left" style="color:#94a3b8;"></i>date repoussée (1ʳᵉ date gardée pour l'OTD)</span>
    </div>

    ${sansDate.length ? `<div style="margin-top:18px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;">
      <div style="font-size:.78rem;font-weight:700;color:#92400e;margin-bottom:8px;"><i class="fas fa-circle-question" style="margin-right:6px;"></i>${sansDate.length} BC sans date d'arrivée prévue — à planifier</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${sansDate.map(b => `<button class="arr-mk" data-bc="${attr(b.id)}" style="background:#fff;border:1px solid #fcd34d;color:#92400e;border-radius:7px;padding:3px 9px;font-size:.68rem;font-weight:700;cursor:pointer;">${escX(b.num_bc)} · ${escX(b.fournisseur)}</button>`).join('')}</div>
    </div>` : ''}
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
function panelReceptions(bcs: any[], bcsAttendus: any[], receptions: any[], bds: any[], ncs: any[], blsRetour: any[], vdMap: Record<string, any>, hasAck: boolean, today: string) {
  const enRetard = (d: any) => !!d && String(d).slice(0, 10) < today
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

  // 1. Fournisseurs & sous-traitants attendus (le cœur : bouton Réceptionner)
  const rowsAtt = (bcsAttendus || []).map((b: any) => {
    const d = b.date_livraison_prevue
    return tr([
      TD(`<div style="font-weight:700;color:${AMB};">${escX(b.num_bc ?? b.id)}</div><div style="font-size:.65rem;color:#94a3b8;">${b.type === 'st' ? 'Sous-traitant' : 'Fournisseur'}</div>`),
      TD(escX(b.fournisseur ?? '—')),
      TD(`<span style="font-size:.75rem;color:#475569;">${escX(b.articles ?? '—')}</span>`),
      // Date d'arrivée MODIFIABLE ici comme au planning : même route, donc même gel de la
      // 1ʳᵉ date prévue (`date_livraison_initiale`) — la ponctualité (OTD) reste honnête quel
      // que soit l'endroit où l'utilisateur a cliqué.
      TDC(`<button onclick="expOpenArrivee('${escX(b.id)}')" title="Modifier la date d'arrivée prévue" style="background:none;border:none;cursor:pointer;padding:2px 6px;border-radius:6px;font:inherit;">`
        + (d ? `<span style="font-weight:700;color:${enRetard(d) ? '#b91c1c' : '#334155'};">${_frDate(d)}</span>${enRetard(d) ? '<div style="font-size:.62rem;color:#b91c1c;font-weight:700;">en retard</div>' : ''}` : '<span style="color:#cbd5e1;">à planifier</span>')
        + `<i class="fas fa-pen" style="margin-left:6px;font-size:.6rem;color:#cbd5e1;"></i></button>`),
      TDC(bcStatutBadge(b.statut)),
      TDC(`<button onclick="expOpenReception('${escX(b.id)}')" style="background:#0ea5e9;color:white;border:none;border-radius:7px;padding:5px 12px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-dolly"></i> Réceptionner</button>
           <button onclick="bcPdf('${escX(b.id)}')" style="margin-left:5px;background:#f5f3ff;color:#6d28d9;border:none;border-radius:7px;padding:5px 9px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-file-pdf"></i></button>`),
    ])
  }).join('')

  // 2. Retours de sous-traitance attendus (vrais BDS)
  // Un BDS pas encore parti n'est pas « attendu au retour » : sans cette exclusion il figurait
  // à la fois dans « À envoyer en sous-traitance » (Envois) et ici — le même bon, deux fois.
  const bdsAtt = (bds || []).filter((s: any) => !['recu', 'termine', 'cloture', 'annule'].includes(String(s.statut))
    && !['a_envoyer', 'a_planifier', 'planifie'].includes(String(s.statut))
    && !s.date_retour_effective && (s.date_retour_prevue || s.date_envoi))
  const rowsBds = bdsAtt.map((s: any) => tr([
    TD(`<div style="font-weight:700;color:#5b21b6;">${escX(s.id)}</div><div style="font-size:.65rem;color:#94a3b8;">${escX(s.lot_ref ?? s.cmd_ref ?? '')}</div>`),
    TD(escX(s.sous_traitant_nom ?? s.sous_traitant_id ?? '—')),
    TD(`<span style="font-size:.75rem;color:#475569;">${escX([s.operation, s.piece].filter(Boolean).join(' · ') || '—')}</span>`),
    TDC(s.date_retour_prevue ? `<span style="font-weight:700;color:${enRetard(s.date_retour_prevue) ? '#b91c1c' : '#334155'};">${_frDate(s.date_retour_prevue)}</span>` : '<span style="color:#cbd5e1;">—</span>'),
    TDC(`<span style="font-size:.72rem;color:#64748b;">${escX(s.statut ?? '')}</span>`),
    TDC(`<button onclick="expRetourBds('${escX(s.id)}')" style="background:#8b5cf6;color:white;border:none;border-radius:7px;padding:5px 12px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-rotate-left"></i> Retour reçu</button>`),
  ])).join('')

  // 3. Retours clients annoncés par la Qualité (NC avec retour attendu)
  const retAtt = (ncs || []).filter((n: any) => n.retour_attendu === true && String(n.retour_statut || 'attendu') === 'attendu')
  const rowsRet = retAtt.map((n: any) => tr([
    TD(`<div style="font-weight:700;color:#b91c1c;">${escX(n.id)}</div><div style="font-size:.65rem;color:#94a3b8;">NC ${escX(n.gravite ?? '')}</div>`),
    TD(escX(n.client_nom ?? '—')),
    TD(`<span style="font-size:.75rem;color:#475569;">${escX([n.ref_article, n.designation].filter(Boolean).join(' · ') || n.lot_ref || '—')}</span>`),
    TDC(n.n_commande ? `<span style="font-family:monospace;font-size:.7rem;color:#334155;">${escX(n.n_commande)}</span>` : '<span style="color:#cbd5e1;">—</span>'),
    TDC(n.date_retour_prevue ? `<span style="font-weight:700;color:${enRetard(n.date_retour_prevue) ? '#b91c1c' : '#334155'};">${_frDate(n.date_retour_prevue)}</span>` : '<span style="color:#cbd5e1;">—</span>'),
    TDC(`<span style="font-weight:700;">${n.qte_retour_attendue ?? n.nb_pieces ?? '—'}</span>`),
    TDC(`<button onclick="expOpenRetourClient('${escX(n.id)}')" style="background:#ef4444;color:white;border:none;border-radius:7px;padding:5px 12px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-box-open"></i> Enregistrer l'arrivée</button>`),
  ])).join('')

  // 4. Arrivées enregistrées (BL de réception + BL de retour client) — enfin alimenté
  const recAll = [...(receptions || []).map((b: any) => ({ ...b, _t: 'Réception fournisseur/ST' })), ...(blsRetour || []).map((b: any) => ({ ...b, _t: 'Retour client' }))]
    .sort((a, b) => String(b.date_bl || '').localeCompare(String(a.date_bl || '')))
  const rowsRec = recAll.map((b: any) => tr([
    TD(`<div style="font-weight:700;color:#0369a1;">${escX(numBL(b))}</div><div style="font-size:.65rem;color:#94a3b8;">${escX(b._t)}</div>`),
    TD(escX(b.client_nom ?? '—')),
    TD(`<span style="font-size:.75rem;color:#475569;">${escX(b.piece ?? '—')}</span>`),
    TDC(`<span style="font-weight:700;">${_frDate(b.date_bl)}</span>`),
    TDC(`<span style="font-weight:700;">${b.qte ?? '—'}</span>`),
    TDC(b.bc_id ? `<button onclick="expOpenPV('${escX(b.bc_id)}')" style="background:#fef2f2;color:#b91c1c;border:none;border-radius:7px;padding:5px 10px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-clipboard-check"></i> PV</button>` : '<span style="color:#cbd5e1;font-size:.7rem;">—</span>'),
  ])).join('')

  // 5. BC en attente de validation fournisseur (amont de l'arrivée)
  const bcVal = (bcs || []).filter((b: any) => hasAck && ['en_attente', 'envoye', 'confirme', 'brouillon'].includes(String(b.statut)) && !b.accuse_fournisseur_le)
  const rowsVal = bcVal.map((b: any) => tr([
    TD(`<div style="font-weight:700;color:${AMB};">${escX(b.num_bc ?? b.id)}</div>${valDirBadge(vdMap, 'bons_de_commande', b.id)}`),
    TD(escX(b.fournisseur ?? '—')),
    TD(`<span style="font-size:.75rem;color:#475569;">${escX(b.articles ?? '—')}</span>`),
    TDC(`<span style="font-size:.72rem;color:#64748b;">${_frDate(b.date_bc)}</span>`),
    TDC(`<button onclick="expOpenArrivee('${escX(b.id)}')" title="Modifier la date d'arrivée prévue" style="background:none;border:none;cursor:pointer;padding:2px 6px;border-radius:6px;font:inherit;">`
      + (b.date_livraison_prevue ? `<span style="font-weight:700;color:${enRetard(b.date_livraison_prevue) ? '#b91c1c' : '#334155'};">${_frDate(b.date_livraison_prevue)}</span>` : '<span style="color:#cbd5e1;">à planifier</span>')
      + `<i class="fas fa-pen" style="margin-left:6px;font-size:.6rem;color:#cbd5e1;"></i></button>`),
    TDC(`<button onclick="bcAccuse('${escX(b.id)}')" style="background:#dcfce7;color:#15803d;border:none;border-radius:7px;padding:5px 11px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-check"></i> Validé</button>
         <button onclick="bcRelancer('${escX(b.id)}')" style="margin-left:5px;background:#fef3c7;color:#92400e;border:none;border-radius:7px;padding:5px 11px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-rotate-right"></i> Relancer</button>`),
  ])).join('')

  const H = (cols: string[]) => `<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;">${cols.map(c => c.startsWith('#') ? THC(c.slice(1)) : TH(c)).join('')}</tr></thead><tbody>`

  // ⚠ Il y avait ici une carte « Autres commandes — date modifiable » (commandes déjà reçues
  //   ou proforma en attente de paiement). Elle a été RETIRÉE : sa seule action visible était
  //   un bouton qui téléchargeait le PDF du bon de commande — on croyait corriger une date,
  //   on récupérait un document. Le crayon, lui, se perdait dans la cellule.
  //   Le changement de date d'arrivée vit désormais dans **Achats › Bons de commande**, sur
  //   un bouton explicite, et cette liste-là ne filtre rien : les commandes reçues et les
  //   proforma y sont, ce qui referme le trou que cette carte bouchait maladroitement.

  return `
  <div id="exp-panel-receptions" style="display:none;">
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 16px;margin-bottom:18px;font-size:.8rem;color:#1d4ed8;">
      <i class="fas fa-dolly" style="margin-right:7px;"></i><strong>Tout ce qui arrive</strong> — commandes fournisseurs et sous-traitants, retours de sous-traitance, et retours clients annoncés par la Qualité. Enregistrer une arrivée met à jour le stock, le calendrier et l'OTD.
    </div>

    ${card('À réceptionner — fournisseurs &amp; sous-traitants', 'fa-truck-ramp-box', '#0ea5e9', (bcsAttendus || []).length, 'commandes validées, en attente du colis',
      H(['N° BC', 'Fournisseur / ST', 'Articles', '#Arrivée prévue', '#Statut', '#Action']) + (rowsAtt || vide(6, 'Aucune commande en attente de réception')) + '</tbody></table>')}

    ${card('Retours de sous-traitance attendus', 'fa-rotate-left', '#8b5cf6', bdsAtt.length, 'pièces parties en sous-traitance, à récupérer',
      H(['N° BDS', 'Sous-traitant', 'Opération / Pièce', '#Retour prévu', '#Statut', '#Action']) + (rowsBds || vide(6, 'Aucun retour de sous-traitance attendu')) + '</tbody></table>')}

    ${card('Retours clients attendus', 'fa-box-open', '#ef4444', retAtt.length, 'déclarés en Qualité sur une non-conformité client',
      H(['N° NC', 'Client', 'Pièce', '#Commande', '#Retour prévu', '#Qté', '#Action']) + (rowsRet || vide(7, 'Aucun retour client annoncé — la Qualité déclare le retour sur la non-conformité')) + '</tbody></table>')}

    ${bcVal.length ? card('En attente de validation fournisseur', 'fa-hourglass-half', '#f59e0b', bcVal.length, 'commandes envoyées, pas encore confirmées',
      H(['N° BC', 'Fournisseur', 'Articles', '#Émis le', '#Arrivée prévue', '#Action']) + rowsVal + '</tbody></table>') : ''}

    ${card('Arrivées enregistrées', 'fa-clipboard-check', '#16a34a', recAll.length, 'historique des réceptions et retours reçus',
      H(['N° BL', 'Fournisseur / Client', 'Pièce / Articles', '#Reçu le', '#Qté', '#Contrôle']) + (rowsRec || vide(6, 'Aucune arrivée enregistrée')) + '</tbody></table>')}
  </div>`
}

// ══════════════════════════════════════════════════════════════
// ONGLET 2 — ENVOIS (ce qui part)
// ══════════════════════════════════════════════════════════════
function panelEnvois(bds: any[], blsClient: any[], cmds: any[], qualiteBloque: (c: any) => string | null, today: string) {
  const tr = (cells: string[]) => `<tr style="border-bottom:1px solid #f8fafc;">${cells.join('')}</tr>`
  const vide = (n: number, txt: string) => `<tr><td colspan="${n}" style="text-align:center;padding:22px;color:#9ca3af;font-size:.8rem;">${txt}</td></tr>`
  const card = (titre: string, icone: string, coul: string, cpt: number, sous: string, corps: string, action = '') => `
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:18px;border-top:3px solid ${coul};">
      <div style="padding:12px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-weight:800;color:#111827;font-size:.9rem;"><i class="fas ${icone}" style="color:${coul};margin-right:7px;"></i>${titre}</span>
        <span style="background:${coul}1a;color:${coul};border-radius:999px;padding:1px 9px;font-size:.68rem;font-weight:800;">${cpt}</span>
        <span style="font-size:.7rem;color:#94a3b8;">${sous}</span>
        ${action ? `<span style="margin-left:auto;">${action}</span>` : ''}
      </div>
      <div style="overflow-x:auto;">${corps}</div>
    </div>`
  const H = (cols: string[]) => `<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#fafafa;">${cols.map(c => c.startsWith('#') ? THC(c.slice(1)) : TH(c)).join('')}</tr></thead><tbody>`

  // 1. Sous-traitance à envoyer (vrais BDS)
  const bdsOut = (bds || []).filter((s: any) => ['a_envoyer', 'a_planifier', 'planifie'].includes(String(s.statut)))
  const rowsBds = bdsOut.map((s: any) => tr([
    TD(`<div style="font-weight:700;color:#3730a3;">${escX(s.id)}</div><div style="font-size:.65rem;color:#94a3b8;">${escX(s.lot_ref ?? s.cmd_ref ?? '')}</div>`),
    TD(escX(s.sous_traitant_nom ?? s.sous_traitant_id ?? '— à affecter')),
    TD(`<span style="font-size:.75rem;color:#475569;">${escX([s.operation, s.piece].filter(Boolean).join(' · ') || '—')}</span>`),
    TDC(`<span style="font-weight:700;">${s.qte ?? '—'}</span>`),
    TDC(s.date_envoi ? `<span style="font-weight:700;color:${String(s.date_envoi).slice(0, 10) < today ? '#b91c1c' : '#334155'};">${_frDate(s.date_envoi)}</span>` : '<span style="color:#cbd5e1;">à planifier</span>'),
    TDC(`<button onclick="expEnvoyerBds('${escX(s.id)}')" style="background:#6366f1;color:white;border:none;border-radius:7px;padding:5px 12px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane"></i> Envoyer</button>`),
  ])).join('')

  // 2. BL clients à expédier
  const blOut = (blsClient || []).filter((b: any) => ['a_envoyer', 'prepare'].includes(String(b.statut)))
  const rowsBl = blOut.map((b: any) => tr([
    TD(`<div style="font-weight:700;color:#15803d;">${escX(numBL(b))}</div><div style="font-size:.65rem;color:#94a3b8;">${escX(b.cmd_id ?? '')}</div>`),
    TD(escX(b.client_nom ?? '—')),
    TD(`<span style="font-size:.75rem;color:#475569;">${escX(b.piece ?? '—')}</span>`),
    TDC(`<span style="font-weight:700;">${b.qte ?? '—'}</span>`),
    TDC(`<span style="font-size:.72rem;color:#64748b;">${escX(b.transport ?? '—')}</span>`),
    TDC(blStatutBadge(b.statut)),
  ])).join('')

  // 3. Commandes clients prêtes à expédier (production soldée) + celles bloquées qualité
  const cmdsOuv = (cmds || []).filter((c: any) => !['livree', 'annulee'].includes(String(c.statut)))
  // Une commande dont le BL est deja prepare figure dans la carte « Bons de livraison a envoyer » :
  // la laisser ici affichait la meme expedition deux fois, et invitait a creer un SECOND BL.
  const cmdAvecBl = new Set((blsClient || [])
    .filter((b: any) => String(b.statut || '') !== 'annule')
    .map((b: any) => String(b.cmd_id ?? b.cmd_ref ?? '')).filter(Boolean))
  const pretes = cmdsOuv.filter((c: any) => Number(c.bdt_total) > 0 && Number(c.bdt_soldes) === Number(c.bdt_total)
    && !cmdAvecBl.has(String(c.id)) && !cmdAvecBl.has(String(c.num_affaire ?? '')))
  const rowsCmd = pretes.map((c: any) => {
    const bloc = qualiteBloque(c)
    return tr([
      TD(`<div style="font-weight:700;color:#111827;">${escX(c.num_affaire ?? c.id)}</div>`),
      TD(escX(c.client_nom ?? '—')),
      TD(`<span style="font-size:.75rem;color:#475569;">${escX(c.piece ?? c.designation ?? '—')}</span>`),
      TDC(`<span style="font-size:.72rem;color:#64748b;">${_frDate(c.date_liv ?? c.date_livraison)}</span>`),
      TDC(bloc
        ? `<span style="background:#fee2e2;color:#b91c1c;border-radius:999px;padding:2px 9px;font-size:.66rem;font-weight:700;"><i class="fas fa-lock" style="margin-right:4px;"></i>${escX(bloc)}</span>`
        : `<span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 9px;font-size:.66rem;font-weight:700;">Prête à expédier</span>`),
    ])
  }).join('')

  const btnNouveauBL = `<button onclick="expOpenModal('bl')" style="padding:7px 15px;background:linear-gradient(135deg,${AMB},${AMB_D});color:white;border:none;border-radius:9px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Nouveau BL client</button>`

  return `
  <div id="exp-panel-envois" style="display:none;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 16px;margin-bottom:18px;font-size:.8rem;color:#15803d;">
      <i class="fas fa-paper-plane" style="margin-right:7px;"></i><strong>Tout ce qui part</strong> — pièces envoyées en sous-traitance et livraisons clients. Un BL client ne peut être créé que si la porte qualité est levée (NC bloquante ou quarantaine).
    </div>

    ${card('Commandes prêtes à expédier', 'fa-boxes-packing', '#16a34a', pretes.length, 'production soldée — créez le BL client',
      H(['Affaire', 'Client', 'Pièce', '#Livraison prévue', '#État']) + (rowsCmd || vide(5, 'Aucune commande prête à expédier')) + '</tbody></table>', btnNouveauBL)}

    ${card('Bons de livraison à envoyer', 'fa-truck-fast', '#22c55e', blOut.length, 'BL préparés, en attente de départ',
      H(['N° BL', 'Client', 'Pièce', '#Qté', '#Transport', '#Statut']) + (rowsBl || vide(6, 'Aucun BL pret a partir')) + '</tbody></table>')}

    ${card('À envoyer en sous-traitance', 'fa-industry', '#6366f1', bdsOut.length, 'bons de sous-traitance à expédier chez le prestataire',
      H(['N° BDS', 'Sous-traitant', 'Opération / Pièce', '#Qté', '#Envoi prévu', '#Action']) + (rowsBds || vide(6, 'Aucun envoi en sous-traitance en attente')) + '</tbody></table>')}
  </div>`
}

// ══════════════════════════════════════════════════════════════
// ONGLET 3 — CALENDRIER (arrivées + départs) + détail du jour
// ══════════════════════════════════════════════════════════════
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
  const BC_JSON = JSON.stringify((BCS as any[]).map((b: any) => ({ id:b.id, num_bc:b.num_bc||b.id, type:b.type, fournisseur:b.fournisseur||'', articles:b.articles||'', montant:b.montant||0, affaire_id:b.affaire_id||'', statut:b.statut, bl_id:b.bl_id||'', date_livraison_prevue:b.date_livraison_prevue||'' }))).replace(/</g, '\\u003c')   // sinon un '<' dans un libelle casse le <script>
  // Données du planning des arrivées (côté client : détail au clic + changement de date)
  const PLAN_JSON = JSON.stringify((BCS as any[]).map((b: any) => ({
    id: b.id, num_bc: b.num_bc || b.id, type: (b.type === 'st' ? 'st' : 'fournisseur'), fournisseur: b.fournisseur || '—',
    articles: b.articles || '—', montant: Number(b.montant || 0) || 0, statut: b.statut || 'en_attente',
    prevue: b.date_livraison_prevue ? String(b.date_livraison_prevue).slice(0, 10) : '',
    initiale: b.date_livraison_initiale ? String(b.date_livraison_initiale).slice(0, 10) : '',
    reception: b.date_reception_reelle ? String(b.date_reception_reelle).slice(0, 10) : '',
    bl_id: b.bl_id || '', qte_commandee: b.qte_commandee ?? null, qte_recue: b.qte_recue ?? null,
  }))).replace(/</g, '\\u003c')
  // Lots & commandes (pour le BL partiel) : SEULS les lots LIBÉRÉS (contrôle qualité final passé) sont expédiables.
  const LOTS_EXP = (dbLots ?? []).filter((l:any) => l.statut === 'libere')
  const LOTS_JSON = JSON.stringify((LOTS_EXP as any[]).map((l:any) => ({ id:l.id, cmd_id:l.cmd_id||'', client:l.client_nom||'', piece:l.piece||'', qte:l.qte!=null?l.qte:null })))
  const CMDS_JSON = JSON.stringify((CMDS as any[]).map((c:any) => ({ id:c.id, num_affaire:c.num_affaire||c.id, client:c.client_nom||'', montant:c.montant||0 })))
  const FLBL = 'display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px;'
  const FINP = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;color:#374151;'

  // Ordre logique du flux : on commande (BC) → on reçoit / on livre (BL)
  // Orchestration demandee : ce qui ARRIVE, ce qui PART, puis la vue calendrier + le jour.
  const TABS = [
    ['envois',     'Envois',       'fa-paper-plane'],
    ['receptions', 'Réceptions',   'fa-dolly'],
    ['calendrier', 'Calendrier',   'fa-calendar-days'],
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
      subtitle: 'Sabine · BL Clients · BST · BC Fournisseurs/ST · Commandes · OTD · EN 9100:2018',
      tabs: TABS.map(([id,lbl,ic]) => ({
        id, label: lbl, icon: ic,
        badge: id === 'receptions' ? (MOUVEMENTS.filter(m => m.sens === 'in' && !m.fait).length || undefined)
             : id === 'envois' ? (MOUVEMENTS.filter(m => m.sens === 'out' && !m.fait).length || undefined)
             : id === 'calendrier' ? (MOUVEMENTS.filter(m => !m.fait && m.date && m.date <= TODAY_REQ).length || undefined)
             : undefined,
      })),
      switchFn: 'expShowTab',
      tabIdPrefix: 'exp-tab',
      activeId: 'envois'
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
          <div><label style="${FLBL}">N° BL interne</label><input id="rec_numbl" type="text" placeholder="laisser vide = auto" style="${FINP}"/></div>
          <div><label style="${FLBL}">N° d'affaire</label><input id="rec_affaire" type="text" placeholder="AFF-2026-XXX" style="${FINP}"/></div>
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
  <div id="exp-arrivee-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;max-width:520px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">
      <div style="padding:14px 20px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,${AMB},${AMB_D});">
        <div style="font-weight:800;color:white;font-size:.95rem;"><i class="fas fa-calendar-week" style="margin-right:8px;"></i>Arrivée — BC &amp; BL</div>
        <button onclick="expCloseArrivee()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div id="arr_modal_content" style="padding:20px;"></div>
    </div>
  </div>

  <script>
  var EXP_TABS=['envois','receptions','calendrier','fournisseurs','dashboard'];
  var EXP_BC=${BC_JSON};
  var EXP_PLAN=${PLAN_JSON};
  var EXP_RETOURS=${RETOURS_JSON};
  var _arrCur=null;
  var EXP_LOTS=${LOTS_JSON};
  var EXP_CMDS=${CMDS_JSON};

  // ── Réception : lier le BC à un BL ──
  function expOpenReception(id){
    var bc=EXP_BC.find(function(b){return b.id===id;}); if(!bc) return;
    document.getElementById('rec_bc_id').value=id;
    document.getElementById('rec_info').innerHTML='<strong>'+(bc.num_bc||id)+'</strong> · '+(bc.fournisseur||'')+' · '+(bc.articles||'');
    document.getElementById('rec_numbl').value='';
    document.getElementById('rec_affaire').value=bc.affaire_id||'';
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

  function expSwitchBLType(type){
    var panels=['bl-reception','bl-client','bl-bst'];
    panels.forEach(function(p){
      var el=document.getElementById('exp-sub-panel-'+p);
      if(el) el.style.display=(p===type)?'block':'none';
      var btn=document.getElementById('exp-sub-'+p);
      if(btn) btn.classList.toggle('exp-sub-active',p===type);
    });
  }

  function expSwitchBCType(type){
    var panels=['bc-four','bc-st'];
    panels.forEach(function(p){
      var el=document.getElementById('exp-sub-panel-'+p);
      if(el) el.style.display=(p===type)?'block':'none';
      var btn=document.getElementById('exp-sub-'+p);
      if(btn) btn.classList.toggle('exp-sub-active',p===type);
    });
  }

  function expSwitchCmdType(type){
    var panels=['cmd-client','cmd-four'];
    panels.forEach(function(p){
      var el=document.getElementById('exp-sub-panel-'+p);
      if(el) el.style.display=(p===type)?'block':'none';
      var btn=document.getElementById('exp-sub-'+p);
      if(btn) btn.classList.toggle('exp-sub-active',p===type);
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
  function expImprimerBL(id){ pushNotif('ok','fa-print','Impression BL '+id+' en cours.',3000); }

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
  function bcPdf(id){ window.open('/api/bc/'+id+'/pdf','_blank'); }
  function bcAccuse(id){
    fetch('/api/bc/'+id+'/accuse',{method:'POST'}).then(function(r){return r.json();}).then(function(j){
      if(j.ok){ pushNotif('ok','fa-check-circle','Commande validee par le fournisseur -> en attente de reception.'); setTimeout(function(){softReload();},700); }
      else pushNotif('err','fa-triangle-exclamation', j.error||'Echec.', 7000);
    }).catch(function(){ pushNotif('err','fa-ban','Erreur reseau.'); });
  }
  function bcRelancer(id){
    fetch('/api/bc/'+id+'/relance',{method:'POST'}).then(function(r){return r.json();}).then(function(j){
      if(j.ok){ window.open('/api/bc/'+id+'/pdf','_blank'); pushNotif('ok','fa-rotate-right','Relance notee. PDF regenere a renvoyer au fournisseur.'); setTimeout(function(){softReload();},900); }
      else pushNotif('err','fa-triangle-exclamation', j.error||'Echec.', 7000);
    }).catch(function(){ pushNotif('err','fa-ban','Erreur reseau.'); });
  }

  // ── Planning des arrivées : filtre, détail au clic, changement de date ──
  function expArrFilter(mode){
    var pn=document.getElementById('exp-panel-planning'); if(!pn) return;
    pn.querySelectorAll('.arr-fbtn').forEach(function(b){ b.classList.toggle('arr-fbtn-on', b.getAttribute('data-f')===mode); });
    pn.querySelectorAll('.arr-lane').forEach(function(ln){
      var showLane=(mode==='all'||mode==='attente'||mode==='retard')?true:(ln.getAttribute('data-type')===mode);
      ln.style.display=showLane?'flex':'none';
      ln.querySelectorAll('.arr-mk').forEach(function(mk){
        var st=mk.getAttribute('data-state'); var show=true;
        if(mode==='retard') show=(st==='retard');
        else if(mode==='attente') show=(st==='attente'||st==='accuse'||st==='retard');
        mk.style.display=show?'':'none';
      });
    });
  }
  function expOpenArrivee(id){
    var b=null; for(var i=0;i<EXP_PLAN.length;i++){ if(EXP_PLAN[i].id===id){ b=EXP_PLAN[i]; break; } }
    if(!b) return; _arrCur=b;
    var recu=(b.statut==='recu_partiel'||b.statut==='recu_total'||b.statut==='recu'||b.statut==='controle'||b.statut==='cloture'||!!b.bl_id);
    var slip=b.initiale&&b.prevue&&b.initiale!==b.prevue;
    var lbl='display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px;';
    var inp='width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.85rem;background:#f8fafc;box-sizing:border-box;color:#374151;';
    var h='';
    h+='<div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:2px;">'+b.num_bc+'</div>';
    h+='<div style="font-size:.82rem;color:#475569;margin-bottom:12px;">'+b.fournisseur+' \\u00b7 '+(b.type==='st'?'Sous-traitant':'Fournisseur')+'</div>';
    h+='<div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:10px 12px;font-size:.8rem;color:#334155;margin-bottom:14px;">'+b.articles+(b.montant?' \\u00b7 <b>'+b.montant.toLocaleString('fr-FR')+' \\u20ac</b>':'')+(b.qte_commandee!=null?' \\u00b7 '+(b.qte_recue!=null?b.qte_recue:0)+'/'+b.qte_commandee+' recu':'')+'</div>';
    h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
    h+='<div><label style="'+lbl+'">Date d\\'arrivee prevue</label><input id="arr_date" type="date" value="'+(b.prevue||'')+'" style="'+inp+'"/></div>';
    h+='<div><label style="'+lbl+'">'+(recu?'Arrivee reelle':'Statut')+'</label><div style="'+inp+'background:#fff;">'+(recu?(b.reception||'recu'):b.statut)+'</div></div>';
    h+='</div>';
    if(slip) h+='<div style="font-size:.7rem;color:#b45309;margin-top:8px;"><i class="fas fa-clock-rotate-left"></i> Date repoussee \\u2014 1re date prevue <b>'+b.initiale+'</b> gardee pour l\\'OTD.</div>';
    h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;align-items:center;">';
    // Ni PDF ni navigation ici : on est venu changer une date, rien d'autre.
    // (Le bouton « BL » qui ouvrait un onglet supprime vidait la page — il est devenu un simple rappel.)
    if(b.bl_id) h+='<div style="font-size:.72rem;color:#0e7490;font-weight:700;"><i class="fas fa-receipt"></i> Recu \u2014 BL '+b.bl_id+'</div>';
    h+='<button onclick="expSaveArriveeDate()" style="margin-left:auto;padding:8px 13px;background:linear-gradient(135deg,${AMB},${AMB_D});color:#fff;border:none;border-radius:8px;font-weight:700;font-size:.8rem;cursor:pointer;"><i class="fas fa-calendar-check"></i> Enregistrer la date</button>';
    h+='</div>';
    document.getElementById('arr_modal_content').innerHTML=h;
    document.getElementById('exp-arrivee-overlay').style.display='flex';
  }
  function expCloseArrivee(){ var o=document.getElementById('exp-arrivee-overlay'); if(o) o.style.display='none'; }
  function expSaveArriveeDate(){
    if(!_arrCur) return;
    var d=document.getElementById('arr_date').value;
    if(!d){ pushNotif('err','fa-exclamation-circle','Choisissez une date.'); return; }
    fetch('/api/expeditions/bc/'+encodeURIComponent(_arrCur.id)+'/date-arrivee',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:d})})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Echec.'); return; }
        expCloseArrivee();
        pushNotif('ok','fa-calendar-check','Date d\\'arrivee mise a jour'+(j.date_livraison_initiale?' \\u00b7 1re date gardee pour l\\'OTD':'')+'.',5000);
        setTimeout(function(){ softReload(); },700);   // on reste sur l'onglet en cours
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur reseau.'); });
  }
  function expVoirBL(blId){
    expCloseArrivee(); location.hash='receptions'; expShowTab('bl');
    if(typeof expSwitchBLType==='function') expSwitchBLType('bl-reception');
    pushNotif('ok','fa-receipt','BL '+blId+' \\u2014 onglet Bons de Livraison, Receptions.',4500);
    var el=document.getElementById('exp-panel-bl'); if(el) el.scrollIntoView({behavior:'smooth'});
  }
  document.addEventListener('click',function(e){
    var mk=(e.target&&e.target.closest)?e.target.closest('.arr-mk'):null;
    if(mk&&mk.getAttribute('data-bc')){ expOpenArrivee(mk.getAttribute('data-bc')); return; }
    var ov=document.getElementById('exp-arrivee-overlay');
    if(e.target===ov) expCloseArrivee();
  });

  // Onglet initial : honore le hash (#bc, #bl, …) sinon Bons de Commande par défaut
  (function(){ try{ var h=(location.hash||'').replace('#',''); expShowTab(EXP_TABS.indexOf(h)>=0?h:'envois'); }catch(e){} })();
  </script>

  <style>
  .exp-sub-tab{padding:7px 14px;border:none;border-radius:8px;background:transparent;color:#64748b;font-size:.79rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .15s;}
  .exp-sub-active{background:white;color:${AMB_D};font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,.1);}
  .exp-sub-tab:hover:not(.exp-sub-active){color:#374151;}
  .exp-sub-tab i{font-size:.7rem;}
  .arr-fbtn{padding:6px 11px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#64748b;font-size:.73rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}
  .arr-fbtn:hover{background:#f8fafc;color:#334151;}
  .arr-fbtn-on{background:${AMB};color:#fff;border-color:${AMB};}
  .arr-fbtn-on:hover{background:${AMB_D};color:#fff;}
  .arr-mk:hover{filter:brightness(.96);transform:translateY(-1px);}
  .arr-lane:hover{background:#fcfcfd;}
  </style>`

  return layout('Service Expeditions', content + demandeAchatModal('Expéditions', '#f59e0b'), 'service-expeditions')
}
