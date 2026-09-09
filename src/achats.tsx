// ══════════════════════════════════════════════════════════════
// ACHATS – ERP Seem Semrac v2.0
// Service Achats : DA à traiter · Cmds fournisseurs · Dashboard · Fournisseurs
// ══════════════════════════════════════════════════════════════
import { escX, layout, pageHeader, serviceHeader, validationCheckbox, bulkToolbar, bulkSelectAssets } from './shared'
import type { DemandeAchat, FournisseurSt } from './types'
import { MODES_FACTURATION } from './commercial'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

// ─── STYLES COMMUNS ───────────────────────────────────────────
const TH = 'padding:10px 14px;color:#64748b;font-size:.68rem;text-transform:uppercase;font-weight:700;'
const TD = 'padding:10px 14px;'
const SEL = 'border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 10px;font-size:.78rem;background:#f8fafc;outline:none;color:#374151;'
const QI  = 'border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:220px;'
const LBL = 'display:block;font-size:.68rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;margin-bottom:4px;'
const INP = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;color:#374151;'

const searchBar = (id: string, cols: [string,string][]) =>
  `<div style="display:flex;gap:8px;align-items:center;">
    <select id="sel-${id}" onchange="achSearch('${id}')" style="${SEL}">
      <option value="all">Tous les champs</option>
      ${cols.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}
    </select>
    <input type="text" id="q-${id}" placeholder="Rechercher…" oninput="achSearch('${id}')" style="${QI}"/>
  </div>`

const emptyRow = (cols: number, msg: string) =>
  `<tr><td colspan="${cols}" style="padding:48px;text-align:center;color:#9ca3af;">
    <i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:8px;"></i>
    <div style="font-weight:600;">${msg}</div>
    <div style="font-size:.75rem;margin-top:4px;">Les données s'afficheront ici depuis Supabase</div>
  </td></tr>`

// ─── BADGES ───────────────────────────────────────────────────
const prioBadge = (p: string) => {
  const m: Record<string,[string,string]> = {
    critique: ['#fee2e2','#b91c1c'],
    urgent:   ['#fef9c3','#854d0e'],
    normal:   ['#f0fdf4','#15803d'],
  }
  const [bg,col] = m[p] ?? ['#f1f5f9','#6b7280']
  return `<span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${bg};color:${col};">${p}</span>`
}

const daStatutBadge = (s: string) => {
  const m: Record<string,[string,string,string]> = {
    a_traiter:  ['#fef9c3','#854d0e','À traiter'],
    nouveau:    ['#fef9c3','#854d0e','Nouveau'],
    en_attente: ['#dbeafe','#1d4ed8','En attente'],
    commandé:   ['#d1fae5','#065f46','Commandé ✓'],
    commande:   ['#d1fae5','#065f46','Commandé ✓'],
    en_cours:   ['#cffafe','#0e7490','En cours'],
    recu:       ['#dcfce7','#15803d','Reçu ✓'],
    annule:     ['#fee2e2','#b91c1c','Annulé'],
  }
  const [bg,col,lbl] = m[s] ?? ['#f1f5f9','#6b7280',s]
  return `<span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${bg};color:${col};">${lbl}</span>`
}

const fournStatutBadge = (s: string) => {
  const m: Record<string,[string,string,string]> = {
    actif:          ['#d1fae5','#065f46','Actif'],
    suspendu:       ['#fee2e2','#b91c1c','Suspendu'],
    en_evaluation:  ['#fef9c3','#854d0e','En évaluation'],
  }
  const [bg,col,lbl] = m[s] ?? ['#f1f5f9','#6b7280',s]
  return `<span style="padding:2px 10px;border-radius:999px;font-size:.68rem;font-weight:700;background:${bg};color:${col};">${lbl}</span>`
}

// ─── FALLBACK DATA ─────────────────────────────────────────────
const DA_DEFAULT: DemandeAchat[] = []

const FOURN_DEFAULT: FournisseurSt[] = []

// ══════════════════════════════════════════════════════════════
export const pageServiceAchats = (
  dbDas?:       DemandeAchat[],
  dbFournisseurs?: any[],
  dbSousTraitants?: any[],
  dbRefCount?:  Record<string, number>,
  dbDemandesPrix?: any[],
  dbSansPrixCount?: number,
  dbScorecard?: any[],
  dbCatalogue?: any[],
  dbProchainLibre?: string,
  dbAffaires?: string[],
) => {
  const DAS   = dbDas          ?? []
  const FOURN = dbFournisseurs ?? []
  const STRAIT: any[] = dbSousTraitants ?? []
  const REFCOUNT: Record<string, number> = dbRefCount ?? {}
  const DPRIX: any[] = dbDemandesPrix ?? []
  const SANS_PRIX: number = dbSansPrixCount ?? 0
  const SCORE: any[] = dbScorecard ?? []
  const CATALOGUE: any[] = dbCatalogue ?? []
  const PROCHAIN_LIBRE: string = dbProchainLibre ?? 'LIBRE-001'
  const AFFAIRES_CONNUES: string[] = dbAffaires ?? []
  // Cibles RFQ (fournisseurs + sous-traitants) exposees au client pour la creation de demande de prix.
  const RFQ_CIBLES_DATA = [
    ...FOURN.map((f: any) => ({ id: f.id, nom: f.nom })),
    ...STRAIT.map((s: any) => ({ id: s.id, nom: s.nom })),
  ].filter((x: any) => x && x.nom)
  // Nb de références liées à un fournisseur = lignes de stock (fournisseur_id) ∪ catalogue manuel
  const refCountFor = (f: any) => (REFCOUNT[String(f.id)] || 0) || parseCatLen(f.catalogue)

  // Une DA est « traitée » dès qu'un BC a été créé (statut commande/envoyé/reçu/clôturé…)
  // « traitée » = un BC a été créé pour la DA. ⚠ BUG CORRIGÉ : l'ancienne regex `trait[eé]`
  // capturait le « traite » de « a_traiter » → toute DA neuve (statut 'a_traiter') tombait à tort
  // dans « déjà traitées ». On écarte d'abord explicitement les statuts « à traiter ».
  const isTraitee = (s: string) => {
    const v = (s || '').toLowerCase().trim()
    if (v === '' || v.startsWith('a_traiter') || v === 'nouveau' || v === 'en_attente' || v === 'brouillon') return false
    return /(command|envoy|re[çc]u|recu|clotur|cl[oô]tur|trait[eé]|solde|\bbc\b)/i.test(v)
  }
  const isBrouillon = (s: string) => /brouillon/i.test(s || '')
  // DA absorbée par un regroupement fournisseur → masquée des deux listes.
  const isMasquee = (d: any) => d.statut === 'regroupee' || d.visible === false
  const DA_TRAITER  = DAS.filter(d => !isMasquee(d) && !isTraitee(d.statut))
  const DA_TRAITEES = DAS.filter(d => !isMasquee(d) && isTraitee(d.statut))
  const DA_CMDS     = DA_TRAITEES // compat dashboard

  // ── ONGLET DEMANDES D'ACHAT (à traiter en haut · traitées en bas) ──
  const rowTraiter = (d: DemandeAchat) => {
    const draft = isBrouillon(d.statut)
    return `
    <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''"
      data-article="${(d.article||'').replace(/"/g,'&quot;')}"
      data-fournisseur="${(d.fournisseur||'').replace(/"/g,'&quot;')}"
      data-demandeur="${(d.demandeur||'').replace(/"/g,'&quot;')}"
      data-type="${(d.type_da||'').replace(/"/g,'&quot;')}"
      data-priorite="${d.priorite}">
      <td style="${TD}font-weight:700;color:#374151;">${escX(d.id)}${(d as any).genere_par_adt?' <span style="font-size:.6rem;font-weight:700;color:#0369a1;background:#e0f2fe;border-radius:5px;padding:1px 5px;">AUTO</span>':''}</td>
      <td style="${TD}font-weight:600;color:#374151;max-width:220px;">${escX(d.article)}${(d as any).affaire_id?`<div style="font-size:.65rem;color:#6366f1;">Affaire ${escX((d as any).affaire_id)}</div>`:''}</td>
      <td style="${TD}color:#6b7280;font-size:.78rem;">${escX(d.fournisseur)||'—'}</td>
      <td style="${TD}color:#374151;font-size:.78rem;">${escX(d.qte)||'—'}</td>
      <td style="${TD}text-align:center;font-size:.75rem;color:#374151;">${escX(d.type_da)||'—'}</td>
      <td style="${TD}text-align:center;">${prioBadge(d.priorite)}</td>
      <td style="${TD}text-align:center;font-size:.75rem;color:#6b7280;">${d.date_da}</td>
      <td style="${TD}text-align:center;font-size:.75rem;color:#374151;font-weight:600;">${escX(d.livraison)||'—'}</td>
      <td style="${TD}text-align:center;">${draft?'<span style="padding:2px 9px;border-radius:999px;font-size:.66rem;font-weight:700;background:#e0e7ff;color:#4338ca;">Brouillon</span>':daStatutBadge('a_traiter')}</td>
      <td style="${TD}text-align:center;">
        <button onclick="achOpenBC('${d.id}')" style="padding:5px 12px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;">
          <i class="fas fa-file-invoice" style="margin-right:4px;"></i>${draft?'Reprendre':'Traiter → BC'}
        </button>
      </td>
    </tr>`
  }
  const rowTraitee = (d: DemandeAchat) => `
    <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
      <td style="${TD}font-weight:700;color:#374151;">${escX(d.id)}</td>
      <td style="${TD}font-weight:600;color:#374151;max-width:220px;">${escX(d.article)}</td>
      <td style="${TD}color:#6b7280;font-size:.78rem;">${escX(d.fournisseur)||'—'}</td>
      <td style="${TD}color:#374151;font-size:.78rem;">${escX(d.qte)||'—'}</td>
      <td style="${TD}text-align:center;font-size:.75rem;color:#374151;">${(d as any).type_bc==='st'?'<span style="color:#8b5cf6;font-weight:700;">Sous-traitant</span>':'Fournisseur'}</td>
      <td style="${TD}text-align:center;">${daStatutBadge(d.statut)}</td>
      <td style="${TD}text-align:center;font-size:.72rem;color:#3b82f6;font-weight:700;"><a href="/expeditions/service#bc" style="color:#3b82f6;text-decoration:none;"><i class="fas fa-arrow-right" style="margin-right:4px;"></i>Voir BC</a></td>
    </tr>`

  const tabDA = `
  <div id="ach-panel-da" style="display:block;">
    <!-- DA À TRAITER -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-inbox" style="color:#10b981;"></i>Demandes d'achat à traiter
        <span style="background:#d1fae5;color:#065f46;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${DA_TRAITER.length}</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        ${searchBar('ach-da',[['article','Article'],['fournisseur','Fournisseur'],['demandeur','Demandeur'],['type','Type'],['priorite','Priorité']])}
        <button onclick="daRegrouper()" title="Fusionner les demandes d'achat à traiter d'un même fournisseur en une seule" style="padding:7px 14px;background:#ede9fe;color:#6d28d9;border:none;border-radius:9px;font-size:.78rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="fas fa-object-group" style="margin-right:5px;"></i>Regrouper par fournisseur</button>
        <button onclick="achNewBC()" style="padding:7px 14px;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:white;border:none;border-radius:9px;font-size:.78rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="fas fa-file-contract" style="margin-right:5px;"></i>Créer un BC</button>
      </div>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:24px;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="ach-da">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;${TH}">N° DA</th>
            <th style="text-align:left;${TH}">Article</th>
            <th style="text-align:left;${TH}">Fournisseur</th>
            <th style="text-align:left;${TH}">Qté</th>
            <th style="text-align:center;${TH}">Type</th>
            <th style="text-align:center;${TH}">Priorité</th>
            <th style="text-align:center;${TH}">Date DA</th>
            <th style="text-align:center;${TH}">Livraison souhaitée</th>
            <th style="text-align:center;${TH}">Statut</th>
            <th style="text-align:center;${TH}">Action</th>
          </tr></thead>
          <tbody>
            ${DA_TRAITER.length === 0 ? emptyRow(10,'Aucune DA à traiter') : DA_TRAITER.map(rowTraiter).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- DA TRAITÉES -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-check-double" style="color:#3b82f6;"></i>Demandes d'achat traitées
        <span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${DA_TRAITEES.length}</span>
        <span style="font-size:.72rem;color:#9ca3af;font-weight:600;">· un BC a été généré, suivi côté Expéditions</span>
      </div>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;${TH}">N° DA</th>
            <th style="text-align:left;${TH}">Article</th>
            <th style="text-align:left;${TH}">Fournisseur</th>
            <th style="text-align:left;${TH}">Qté</th>
            <th style="text-align:center;${TH}">Type BC</th>
            <th style="text-align:center;${TH}">Statut</th>
            <th style="text-align:center;${TH}">BC</th>
          </tr></thead>
          <tbody>
            ${DA_TRAITEES.length === 0 ? emptyRow(7,'Aucune DA traitée pour le moment') : DA_TRAITEES.map(rowTraitee).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`

  // BC modal data (DA en cours de traitement)
  const DA_JSON = JSON.stringify(DA_TRAITER.map(d => ({ id:d.id, article:d.article, fournisseur:d.fournisseur||'', qte:d.qte||'', type_da:d.type_da||'', type_bc:(d as any).type_bc||'fournisseur', livraison:d.livraison||'', affaire_id:(d as any).affaire_id||'', bc_draft:(d as any).bc_draft||null })))

  // ── ONGLET DASHBOARD ──────────────────────────────────────────
  const totDA    = DAS.length
  const aTraiter = DA_TRAITER.length
  const enCours  = DA_CMDS.length
  const recus    = DAS.filter(d => d.statut === 'recu').length
  const critiques = DA_TRAITER.filter(d => d.priorite === 'critique').length

  const tabDashboard = `
  <div id="ach-panel-dashboard" style="display:none;">
    <div style="font-size:1rem;font-weight:800;color:#111827;margin-bottom:16px;display:flex;align-items:center;gap:8px;">
      <i class="fas fa-chart-bar" style="color:#f59e0b;"></i>Dashboard Achats
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${([
        ['DAs à traiter',         aTraiter,'#f59e0b','fa-inbox'],
        ['Commandes en cours',    enCours, '#3b82f6','fa-truck'],
        ['Réceptions à valider',  recus,   '#10b981','fa-box-open'],
        ['Total DAs (tous statuts)', totDA,'#64748b','fa-list-alt'],
      ] as [string,number,string,string][]).map(([l,v,c,ic]) => `
      <div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${c};text-align:center;">
        <i class="fas ${ic}" style="font-size:1.2rem;color:${c};margin-bottom:8px;display:block;"></i>
        <div style="font-size:1.8rem;font-weight:800;color:${c};">${v}</div>
        <div style="font-size:.7rem;color:#6b7280;font-weight:600;margin-top:4px;">${l}</div>
      </div>`).join('')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
        <div style="font-size:.78rem;font-weight:800;color:#374151;margin-bottom:14px;"><i class="fas fa-exclamation-triangle" style="color:#f59e0b;margin-right:6px;"></i>Alertes</div>
        ${critiques > 0 ? `<div style="background:#fee2e2;border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;">
          <i class="fas fa-fire" style="color:#b91c1c;font-size:1.1rem;"></i>
          <div><div style="font-size:.82rem;font-weight:700;color:#b91c1c;">${critiques} DA(s) CRITIQUE(S) en attente</div>
          <div style="font-size:.7rem;color:#ef4444;">Traitement prioritaire immédiat</div></div></div>` : ''}
        ${aTraiter > 0 ? `<div style="background:#fef3c7;border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;">
          <i class="fas fa-clock" style="color:#854d0e;font-size:1.1rem;"></i>
          <div><div style="font-size:.82rem;font-weight:700;color:#854d0e;">${aTraiter} demande(s) en attente de traitement</div></div></div>` : ''}
        ${aTraiter === 0 && critiques === 0 ? `<div style="text-align:center;padding:24px;color:#9ca3af;">
          <i class="fas fa-check-circle" style="font-size:1.8rem;color:#bbf7d0;display:block;margin-bottom:8px;"></i>
          <div style="font-weight:600;">Aucune alerte active</div></div>` : ''}
      </div>

      <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
        <div style="font-size:.78rem;font-weight:800;color:#374151;margin-bottom:14px;"><i class="fas fa-stream" style="color:#10b981;margin-right:6px;"></i>Répartition par type</div>
        ${(['Matière','Outillage','Consommable','Chimique'] as string[]).map(type => {
          const cnt = DAS.filter(d => d.type_da === type).length
          const pct = totDA > 0 ? Math.round(cnt/totDA*100) : 0
          return `<div style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:.78rem;margin-bottom:4px;">
              <span style="font-weight:600;color:#374151;">${type}</span>
              <span style="font-weight:700;color:#374151;">${cnt} <span style="color:#9ca3af;font-weight:400;">(${pct}%)</span></span>
            </div>
            <div style="background:#f1f5f9;border-radius:999px;height:8px;overflow:hidden;">
              <div style="background:linear-gradient(90deg,#10b981,#059669);height:100%;width:${pct}%;border-radius:999px;"></div>
            </div>
          </div>`
        }).join('')}
      </div>
    </div>

    <div style="background:white;border-radius:12px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,.07);">
      <div style="font-size:.78rem;font-weight:800;color:#374151;margin-bottom:14px;"><i class="fas fa-bolt" style="color:#f59e0b;margin-right:6px;"></i>Accès rapides</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        ${([
          ['javascript:achNewBC()', '#0ea5e9','fa-file-contract',   'Créer un BC',        'Bon de commande direct'],
          ['/achats/reception',     '#0ea5e9','fa-box-open',       'Réception & Stock',  'Valider réception'],
          ['/achats/fournisseurs-st','#8b5cf6','fa-handshake',     'Fournisseurs SS-T',  'Liste complète'],
        ] as [string,string,string,string,string][]).map(([url,col,ic,titre,sous]) => `
        <a href="${url}" style="background:${col}11;border:1.5px solid ${col}33;border-radius:10px;padding:14px;text-decoration:none;text-align:center;display:block;"
           onmouseenter="this.style.background='${col}22'" onmouseleave="this.style.background='${col}11'">
          <i class="fas ${ic}" style="font-size:1.4rem;color:${col};display:block;margin-bottom:8px;"></i>
          <div style="font-size:.8rem;font-weight:700;color:${col};">${titre}</div>
          <div style="font-size:.68rem;color:#6b7280;margin-top:3px;">${sous}</div>
        </a>`).join('')}
      </div>
    </div>
  </div>`

  // ── ONGLET FOURNISSEURS / SOUS-TRAITANTS (2 listes + bascule) ──
  const arr = (v: any) => Array.isArray(v) ? v.join(', ') : (v || '')
  const parseCatLen = (raw: any): number => {
    if (Array.isArray(raw)) return raw.length
    if (typeof raw === 'string' && raw.trim()) {
      try { const o = JSON.parse(raw); return Array.isArray(o) ? o.length : (Array.isArray(o?.items) ? o.items.length : 0) } catch (_e) { return 0 }
    }
    return 0
  }
  const activiteBadge = (a: string | undefined) => {
    const v = a || 'both'
    const m: Record<string, string> = { Seem:'#3b82f6', Semrac:'#ec4899', both:'#8b5cf6' }
    const l = v === 'both' ? 'Seem &amp; Semrac' : v
    return `<span style="background:${m[v]||'#64748b'}20;color:${m[v]||'#64748b'};border-radius:6px;padding:1px 7px;font-size:.65rem;font-weight:700;">${l}</span>`
  }
  const ALL_CATS = Array.from(new Set([
    ...FOURN.map((f:any) => f.categorie).filter(Boolean),
    ...STRAIT.map((s:any) => s.categorie).filter(Boolean),
    'Matière première','Visserie / Boulonnerie','Outillage','Consommables','Produits chimiques','Emballage','Transport','EPI / Sécurité','Électronique / Câblage','Finition / Traitement surface','Mécanique générale','Soudure','Découpe laser / eau','Pliage / Emboutissage','Contrôle / Qualité','Études / Engineering','Autres'
  ]))
  // Prestations de sous-traitance existantes (toutes les ST) + référentiel standard → liste déroulante
  const ALL_PRESTATIONS = Array.from(new Set([
    ...STRAIT.flatMap((s:any) => Array.isArray(s.prestations) ? s.prestations : []),
    'Oxydation anodique sulfurique','Oxydation anodique chromique','Oxydation noire','Zingage','Nickelage','Chromage dur','Peinture poudre','Sérigraphie','Traitement thermique','Brunissage','Passivation','Découpe jet d\'eau','Rectification','Galvanisation'
  ].filter(Boolean))).sort()
  // Familles de fourniture existantes (tous les fournisseurs) + référentiel standard → liste déroulante
  const ALL_FAMILLES = Array.from(new Set([
    ...FOURN.flatMap((f:any) => Array.isArray(f.famille_produits) ? f.famille_produits : []),
    'Aluminium','Acier','Inox','Visserie / Boulonnerie','Outillage','Consommables','Produits chimiques','Emballage','Joints / Étanchéité','Électronique / Câblage','Lubrifiants'
  ].filter(Boolean))).sort()
  const fournRows = FOURN.length === 0 ? emptyRow(8,'Aucun fournisseur en base') : FOURN.map((f: any) => `
    <tr class="ref-row" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''"
      data-nom="${(f.nom||'').replace(/"/g,'&quot;')}" data-categorie="${(f.categorie||'').replace(/"/g,'&quot;')}" data-activite="${f.activite||'both'}" data-contact="${(f.contact||'').replace(/"/g,'&quot;')}" data-email="${(f.email||'').replace(/"/g,'&quot;')}">
      <td class="bcell bcell-fou" style="display:none;text-align:center;"><input type="checkbox" class="bsel" data-bulk="fou" data-id="${escX(f.id)}" onclick="bulkCount('fou')"/></td>
      <td style="${TD}"><div style="font-weight:700;color:#374151;">${escX(f.nom)}</div><div style="font-size:.65rem;color:#9ca3af;font-family:monospace;">${escX(f.code||f.id||'')}</div></td>
      <td style="${TD}"><span style="background:#f1f5f9;color:#475569;border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:700;">${escX(f.categorie)||'—'}</span></td>
      <td style="${TD}">${activiteBadge(f.activite)}</td>
      <td style="${TD}font-size:.78rem;color:#374151;">${escX(f.contact)||'—'}</td>
      <td style="${TD}font-size:.76rem;color:#2563eb;">${escX(f.email)||'—'}<div style="font-size:.7rem;color:#9ca3af;">${escX(f.tel||'')}</div></td>
      <td style="${TD}text-align:center;"><span style="background:#eef2ff;color:#4338ca;border-radius:999px;padding:2px 9px;font-size:.7rem;font-weight:700;">${refCountFor(f)} réf.</span></td>
      <td style="${TD}text-align:center;font-size:.78rem;color:#374151;">${f.delai_moyen_j!=null?f.delai_moyen_j+' j':'—'}</td>
      <td style="${TD}text-align:center;white-space:nowrap;"><button onclick="rfqNew('${f.id}')" title="Demander un prix à ce fournisseur" style="margin-right:5px;padding:5px 10px;background:#e0f2fe;color:#0369a1;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-file-invoice-dollar"></i></button><a href="/achats/fournisseur/${encodeURIComponent(f.id)}" title="Ouvrir / modifier la fiche" style="display:inline-flex;align-items:center;gap:4px;padding:5px 11px;background:#eef2ff;color:#4338ca;border:none;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;"><i class="fas fa-folder-open"></i>Fiche</a><button onclick="achDeleteRef('fournisseur','${f.id}',this)" title="Supprimer" style="margin-left:5px;width:28px;height:26px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#b91c1c;cursor:pointer;"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('')
  const stRows = STRAIT.length === 0 ? emptyRow(8,'Aucun sous-traitant en base') : STRAIT.map((s: any) => `
    <tr class="ref-row" style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''"
      data-nom="${(s.nom||'').replace(/"/g,'&quot;')}" data-categorie="${(s.categorie||'').replace(/"/g,'&quot;')}" data-activite="${s.activite||'both'}" data-contact="${(s.contact||'').replace(/"/g,'&quot;')}" data-presta="${arr(s.prestations).replace(/"/g,'&quot;')}">
      <td class="bcell bcell-st" style="display:none;text-align:center;"><input type="checkbox" class="bsel" data-bulk="st" data-id="${escX(s.id)}" onclick="bulkCount('st')"/></td>
      <td style="${TD}"><div style="font-weight:700;color:#374151;">${escX(s.nom)}${s.approved===false?' <span style="font-size:.6rem;font-weight:700;color:#b45309;background:#fffbeb;border-radius:5px;padding:1px 5px;">à qualifier</span>':''}</div><div style="font-size:.65rem;color:#9ca3af;font-family:monospace;">${escX(s.code||s.id||'')}</div></td>
      <td style="${TD}"><span style="background:#f1f5f9;color:#475569;border-radius:6px;padding:2px 8px;font-size:.68rem;font-weight:700;">${escX(s.categorie)||'—'}</span></td>
      <td style="${TD}">${activiteBadge(s.activite)}</td>
      <td style="${TD}font-size:.78rem;color:#374151;">${escX(s.contact)||'—'}</td>
      <td style="${TD}font-size:.76rem;color:#2563eb;">${escX(s.email)||'—'}<div style="font-size:.7rem;color:#9ca3af;">${escX(s.tel||'')}</div></td>
      <td style="${TD}text-align:center;"><span style="background:#ede9fe;color:#5b21b6;border-radius:999px;padding:2px 9px;font-size:.7rem;font-weight:700;">${parseCatLen(s.catalogue)} réf.</span></td>
      <td style="${TD}font-size:.74rem;color:#374151;">${(Array.isArray(s.prestations)&&s.prestations.length)?s.prestations.slice(0,4).map((p:string)=>`<span style="display:inline-block;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:1px 7px;font-size:.62rem;font-weight:700;margin:1px;">${escX(p)}</span>`).join('')+(s.prestations.length>4?` <span style="color:#94a3b8;font-size:.62rem;">+${s.prestations.length-4}</span>`:''):'<span style="color:#cbd5e1;">—</span>'}</td>
      <td style="${TD}text-align:center;white-space:nowrap;"><button onclick="rfqNew('${s.id}')" title="Demander un prix à ce sous-traitant" style="margin-right:5px;padding:5px 10px;background:#ede9fe;color:#5b21b6;border:none;border-radius:6px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-file-invoice-dollar"></i></button><a href="/achats/sous-traitant/${encodeURIComponent(s.id)}" title="Ouvrir / modifier la fiche" style="display:inline-flex;align-items:center;gap:4px;padding:5px 11px;background:#ede9fe;color:#5b21b6;border:none;border-radius:6px;font-size:.7rem;font-weight:700;text-decoration:none;"><i class="fas fa-folder-open"></i>Fiche</a><button onclick="achDeleteRef('sous_traitant','${s.id}',this)" title="Supprimer" style="margin-left:5px;width:28px;height:26px;border-radius:6px;border:1px solid #fca5a5;background:#fef2f2;color:#b91c1c;cursor:pointer;"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('')

  const tabFourn = `
  <div id="ach-panel-fourn" style="display:none;">
    ${SANS_PRIX > 0 ? `<div style="display:flex;align-items:center;gap:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px 14px;margin-bottom:12px;">
      <i class="fas fa-broom" style="color:#d97706;"></i>
      <span style="font-size:.78rem;color:#92400e;"><strong>${SANS_PRIX}</strong> référence(s) sans prix dans le catalogue fournisseur.</span>
      <button onclick="nettoieOpen()" style="margin-left:auto;background:#f59e0b;color:white;border:none;border-radius:7px;padding:6px 12px;font-size:.74rem;font-weight:700;cursor:pointer;"><i class="fas fa-broom" style="margin-right:5px;"></i>Nettoyer</button>
    </div>` : ''}
    <!-- Bascule des 2 listes -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
      <div style="display:inline-flex;background:#f1f5f9;border-radius:11px;padding:3px;gap:2px;">
        <button id="ach-ref-btn-fournisseurs" onclick="achRefSwitch('fournisseurs')" style="display:inline-flex;align-items:center;gap:7px;border:none;cursor:pointer;border-radius:9px;padding:8px 16px;font-size:.8rem;font-weight:700;background:#fff;color:#5b21b6;box-shadow:0 1px 3px rgba(0,0,0,.12);"><i class="fas fa-truck"></i> Fournisseurs <span style="background:#ede9fe;color:#5b21b6;font-size:.64rem;padding:1px 7px;border-radius:999px;">${FOURN.length}</span></button>
        <button id="ach-ref-btn-soustraitants" onclick="achRefSwitch('soustraitants')" style="display:inline-flex;align-items:center;gap:7px;border:none;cursor:pointer;border-radius:9px;padding:8px 16px;font-size:.8rem;font-weight:700;background:transparent;color:#64748b;"><i class="fas fa-industry"></i> Sous-traitants <span style="background:#e2e8f0;color:#475569;font-size:.64rem;padding:1px 7px;border-radius:999px;">${STRAIT.length}</span></button>
      </div>
      <a href="/api/export/fournisseurs.xlsx" title="Exporter TOUS les fournisseurs ET sous-traitants + leur catalogue/prestations (Excel : feuille Données + feuille TCD)" style="padding:8px 16px;background:#ecfdf5;color:#047857;border:1.5px solid #a7f3d0;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-file-excel"></i>Exporter (Excel)</a>
      <button id="ach-ref-add" onclick="achRefAdd()" style="padding:8px 18px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i><span id="ach-ref-add-label">Nouveau fournisseur</span></button>
    </div>

    <!-- Filtres catégorie / activité / recherche -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;padding:10px 14px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:.66rem;font-weight:800;color:#64748b;text-transform:uppercase;">Catégorie</span>
        <select id="ref-fcat" onchange="achFilterRefs()" style="border:1.5px solid #e2e8f0;border-radius:7px;padding:5px 9px;font-size:.76rem;background:white;outline:none;">
          <option value="">Toutes</option>
          ${ALL_CATS.map(c => `<option value="${escX(c)}">${escX(c)}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:.66rem;font-weight:800;color:#64748b;text-transform:uppercase;">Activité</span>
        <select id="ref-fact" onchange="achFilterRefs()" style="border:1.5px solid #e2e8f0;border-radius:7px;padding:5px 9px;font-size:.76rem;background:white;outline:none;">
          <option value="">Toutes</option>
          <option value="Seem">Seem</option>
          <option value="Semrac">Semrac</option>
          <option value="both">Seem &amp; Semrac</option>
        </select>
      </div>
      <input type="text" id="ref-fsearch" oninput="achFilterRefs()" placeholder="Rechercher par nom / contact / email…" style="flex:1;min-width:220px;border:1.5px solid #e2e8f0;border-radius:7px;padding:6px 12px;font-size:.78rem;background:white;outline:none;"/>
    </div>

    <!-- LISTE FOURNISSEURS -->
    <div id="ach-ref-fournisseurs" style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="padding:9px 14px;border-bottom:1px solid #f1f5f9;">${bulkToolbar('fou', '#8b5cf6')}</div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="ach-fourn">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th class="bcell bcell-fou" style="display:none;text-align:center;${TH}"><input type="checkbox" onclick="bulkAll('fou',this.checked)" title="Tout sélectionner"/></th>
            <th style="text-align:left;${TH}">Fournisseur</th><th style="text-align:left;${TH}">Catégorie</th><th style="text-align:left;${TH}">Activité</th><th style="text-align:left;${TH}">Contact</th><th style="text-align:left;${TH}">Email / Tél</th><th style="text-align:center;${TH}">Catalogue</th><th style="text-align:center;${TH}">Délai</th><th style="text-align:center;${TH}">Fiche</th>
          </tr></thead>
          <tbody>${fournRows}</tbody>
        </table>
      </div>
    </div>

    <!-- LISTE SOUS-TRAITANTS -->
    <div id="ach-ref-soustraitants" style="display:none;background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="padding:9px 14px;border-bottom:1px solid #f1f5f9;">${bulkToolbar('st', '#6d28d9')}</div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.8rem;" id="ach-st">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            <th class="bcell bcell-st" style="display:none;text-align:center;${TH}"><input type="checkbox" onclick="bulkAll('st',this.checked)" title="Tout sélectionner"/></th>
            <th style="text-align:left;${TH}">Sous-traitant</th><th style="text-align:left;${TH}">Catégorie</th><th style="text-align:left;${TH}">Activité</th><th style="text-align:left;${TH}">Contact</th><th style="text-align:left;${TH}">Email / Tél</th><th style="text-align:center;${TH}">Catalogue</th><th style="text-align:left;${TH}">Prestations</th><th style="text-align:center;${TH}">Fiche</th>
          </tr></thead>
          <tbody>${stRows}</tbody>
        </table>
      </div>
    </div>
    ${bulkSelectAssets([{ key: 'fou', base: '/api/fournisseurs/', label: 'fournisseur(s)' }, { key: 'st', base: '/api/sous-traitants/', label: 'sous-traitant(s)' }])}
  </div>`

  // ── ONGLET DEMANDES DE PRIX (RFQ) ────────────────────────────
  const dEsc = (s: any) => String(s ?? '').replace(/</g, '&lt;').replace(/"/g, '&quot;')
  const DP_STATUTS: [string, string, string, string][] = [
    ['a_traiter', 'À traiter', '#92400e', '#fef3c7'],
    ['envoyee', 'Envoyée', '#1d4ed8', '#dbeafe'],
    ['reponse_recue', 'Réponse reçue', '#6d28d9', '#ede9fe'],
    ['cloturee', 'Clôturée', '#065f46', '#d1fae5'],
  ]
  const dpBadge = (s: string) => { const m = DP_STATUTS.find(x => x[0] === s) || ['', s, '#475569', '#f1f5f9']; return `<span style="background:${m[3]};color:${m[2]};border-radius:999px;padding:2px 10px;font-size:.66rem;font-weight:700;">${m[1]}</span>` }
  const dpOrigine = (o: string) => o === 'analyse_dt' ? 'Analyse DT' : o === 'nomenclature' ? 'Nomenclature' : 'Libre'
  const dpRows = DPRIX.map((d: any) => `<tr data-statut="${d.statut}" style="border-bottom:1px solid #f1f5f9;">
    <td style="padding:8px 12px;font-weight:800;color:#0f766e;font-size:.78rem;">${dEsc(d.numero || d.id)}</td>
    <td style="padding:8px 12px;font-size:.76rem;color:#334155;font-weight:600;">${dEsc(d.fournisseur_nom || '—')}</td>
    <td style="padding:8px 12px;font-size:.76rem;color:#475569;">${dpOrigine(d.origine)}</td>
    <td style="padding:8px 12px;font-size:.76rem;color:#475569;">${dEsc(d.demandeur || '—')}</td>
    <td style="padding:8px 12px;font-size:.74rem;color:#94a3b8;">${String(d.date_creation || '').slice(0, 10)}</td>
    <td style="padding:8px 12px;">${dpBadge(d.statut)}${d.a_relancer ? ' <span style="background:#ffedd5;color:#9a3412;border-radius:999px;padding:2px 8px;font-size:.62rem;font-weight:800;">à relancer</span>' : ''}</td>
    <td style="padding:8px 12px;text-align:right;white-space:nowrap;">
      <button onclick="rfqPdf('${d.id}')" title="Télécharger le PDF (à envoyer au fournisseur)" style="background:#eef2ff;color:#4338ca;border:none;border-radius:7px;padding:5px 10px;font-size:.72rem;font-weight:700;cursor:pointer;margin-right:5px;"><i class="fas fa-file-pdf"></i></button>
      ${d.a_relancer ? `<button onclick="rfqPdf('${d.id}')" title="Régénérer le PDF pour relancer" style="background:#ffedd5;color:#9a3412;border:none;border-radius:7px;padding:5px 10px;font-size:.72rem;font-weight:700;cursor:pointer;margin-right:5px;"><i class="fas fa-rotate-right" style="margin-right:4px;"></i>Relancer</button>` : ''}
      <button onclick="rfqOpen('${d.id}')" style="background:#10b981;color:white;border:none;border-radius:7px;padding:5px 12px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-arrow-right-to-bracket" style="margin-right:4px;"></i>Traiter</button>
    </td>
  </tr>`).join('')
  const rfqPill = (id: string, lbl: string, active: boolean) => `<button onclick="rfqFilter('${id}')" id="rfqf-${id}" class="rfq-pill" style="border:1.5px solid #e2e8f0;background:${active ? '#10b981' : 'white'};color:${active ? 'white' : '#475569'};border-radius:999px;padding:5px 13px;font-size:.74rem;font-weight:700;cursor:pointer;">${lbl}</button>`
  const tabRFQ = `<div id="ach-panel-rfq" style="display:none;">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
      <span style="font-weight:800;font-size:1rem;color:#1e293b;"><i class="fas fa-file-invoice-dollar" style="color:#10b981;margin-right:7px;"></i>Demandes de prix (RFQ)</span>
      <span style="color:#94a3b8;font-size:.74rem;">${DPRIX.length} demande(s)</span>
      <button onclick="rfqNew()" style="margin-left:auto;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:white;border:none;border-radius:8px;padding:7px 15px;font-size:.76rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:6px;"></i>Demande de prix</button>
    </div>
    <div style="font-size:.74rem;color:#64748b;margin-bottom:12px;">Une demande peut viser <strong>plusieurs références</strong> et <strong>plusieurs fournisseurs</strong> (à choisir par référence) : elle se <strong>scinde en une RFQ par fournisseur</strong>. ⚠️ La <strong>validation d'une réponse</strong> met à jour le <strong>prix officiel</strong> du fournisseur — les bons de commande n'y touchent jamais.</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;align-items:center;">
      ${rfqPill('all', 'Toutes', true)}${DP_STATUTS.map(s => rfqPill(s[0], s[1], false)).join('')}
    </div>
    <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table id="rfq-table" style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">${['N°', 'Fournisseur', 'Origine', 'Demandeur', 'Créée', 'Statut', ''].map(h => `<th style="padding:9px 12px;text-align:left;font-size:.62rem;text-transform:uppercase;color:#6b7280;font-weight:800;">${h}</th>`).join('')}</tr></thead>
          <tbody>${dpRows || '<tr><td colspan="7" style="text-align:center;padding:30px;color:#cbd5e1;font-size:.8rem;">Aucune demande de prix. Cliquez « Demande de prix » pour en créer une.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  </div>`

  // ── Scorecard Fournisseurs / Sous-traitants ──────────────────
  const tabScorecard = `<div id="ach-panel-scorecard" style="display:none;">
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="font-weight:800;color:#111827;font-size:.95rem;"><i class="fas fa-ranking-star" style="color:#ec4899;margin-right:7px;"></i>Scorecard Fournisseurs / Sous-traitants</div>
        <span style="font-size:.72rem;color:#94a3b8;">Score = OTD (50%) + qualité réception (35%) + ponctualité paiement (15%)</span>
        <span style="margin-left:auto;font-size:.72rem;color:#64748b;font-weight:600;">${SCORE.length} fournisseurs/ST en base · ${SCORE.filter((s: any) => s.nbBC > 0).length} avec activité d'achat</span>
      </div>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.8rem;">
        <thead><tr style="background:#fdf2f8;">
          <th style="text-align:left;padding:9px 12px;font-size:.63rem;text-transform:uppercase;color:#9d174d;">Fournisseur</th>
          <th style="text-align:center;padding:9px 12px;font-size:.63rem;text-transform:uppercase;color:#9d174d;">Type</th>
          <th style="text-align:center;padding:9px 12px;font-size:.63rem;text-transform:uppercase;color:#9d174d;">Score</th>
          <th style="text-align:center;padding:9px 12px;font-size:.63rem;text-transform:uppercase;color:#9d174d;">OTD</th>
          <th style="text-align:center;padding:9px 12px;font-size:.63rem;text-transform:uppercase;color:#9d174d;">Qualité récept.</th>
          <th style="text-align:center;padding:9px 12px;font-size:.63rem;text-transform:uppercase;color:#9d174d;">Délai paiement</th>
          <th style="text-align:center;padding:9px 12px;font-size:.63rem;text-transform:uppercase;color:#9d174d;">Nb BC</th>
          <th style="text-align:right;padding:9px 12px;font-size:.63rem;text-transform:uppercase;color:#9d174d;">Montant</th>
        </tr></thead>
        <tbody>
          ${SCORE.filter((s: any) => s.nbBC > 0).map((s: any) => {
            const sCol = s.score == null ? '#94a3b8' : (s.score >= 85 ? '#16a34a' : (s.score >= 65 ? '#d97706' : '#dc2626'))
            const oCol = s.otdPct == null ? '#94a3b8' : (s.otdPct >= 90 ? '#16a34a' : (s.otdPct >= 75 ? '#d97706' : '#dc2626'))
            const qCol = s.ncPct == null ? '#94a3b8' : (s.ncPct >= 98 ? '#16a34a' : (s.ncPct >= 90 ? '#d97706' : '#dc2626'))
            const url = s.type === 'Sous-traitant' ? '/achats/sous-traitant/' + s.id : '/achats/fournisseur/' + s.id
            return `<tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fdf2f8'" onmouseleave="this.style.background=''">
              <td style="padding:9px 12px;font-weight:700;"><a href="${url}" style="color:#1e293b;text-decoration:none;">${escX(s.nom)}</a>${s.categorie ? ` <span style="color:#9ca3af;font-size:.68rem;">${escX(s.categorie)}</span>` : ''}</td>
              <td style="padding:9px 12px;text-align:center;font-size:.72rem;color:#64748b;">${s.type}</td>
              <td style="padding:9px 12px;text-align:center;"><span style="display:inline-block;min-width:40px;font-weight:800;color:white;background:${sCol};border-radius:999px;padding:3px 10px;">${s.score != null ? s.score : '—'}</span></td>
              <td style="padding:9px 12px;text-align:center;font-weight:700;color:${oCol};">${s.otdPct != null ? s.otdPct + '%' : '—'}<div style="font-size:.59rem;color:#cbd5e1;">${s.otdN || 0} liv.</div></td>
              <td style="padding:9px 12px;text-align:center;font-weight:700;color:${qCol};">${s.ncPct != null ? s.ncPct + '%' : '—'}${s.recNc ? `<div style="font-size:.59rem;color:#dc2626;">${s.recNc} NC</div>` : ''}</td>
              <td style="padding:9px 12px;text-align:center;color:#374151;">${s.delaiPaiement != null ? s.delaiPaiement + ' j' : '—'}</td>
              <td style="padding:9px 12px;text-align:center;color:#374151;">${s.nbBC || 0}</td>
              <td style="padding:9px 12px;text-align:right;font-weight:600;color:#374151;">${(s.montantTotal || 0).toLocaleString('fr-FR')} €</td>
            </tr>`
          }).join('') || `<tr><td colspan="8" style="text-align:center;padding:30px;color:#cbd5e1;">Aucune donnée fournisseur — il faut des BC / livraisons / factures fournisseur.</td></tr>`}
        </tbody>
      </table></div>
    </div>
  </div>`

  // ── ASSEMBLAGE ───────────────────────────────────────────────
  const ACH_TABS = [
    ['rfq',       'Demandes de prix',           'fa-file-invoice-dollar', '#0ea5e9', DPRIX.length.toString()],
    ['da',        'Demandes d\'achat',          'fa-inbox',        '#10b981', DA_TRAITER.length.toString()],
    ['fourn',     'Fournisseurs / ST',          'fa-industry',     '#8b5cf6', (FOURN.length + STRAIT.length).toString()],
    ['scorecard', 'Scorecard',                  'fa-ranking-star', '#ec4899', SCORE.length ? String(SCORE.length) : ''],
    ['dashboard', 'Dashboard achats',           'fa-chart-bar',    '#f59e0b', ''],
  ]

  const content = `
  ${serviceHeader({
    icon: 'fa-shopping-cart',
    color: '#10b981',
    darkBg: '#052e16',
    title: 'Service Achats',
    subtitle: 'Morgane · DAs · Commandes fournisseurs · Réception · EN 9100:2018',
    tabs: (ACH_TABS as any[]).map(([id,lbl,ic,_col,cnt]) => ({ id, label: lbl, icon: ic, badge: cnt || undefined })),
    switchFn: 'switchAchTab',
    tabIdPrefix: 'ach-tab',
    activeId: 'da'
  })}
  <div style="padding:22px 30px;">

    ${tabDA}
    ${tabRFQ}
    ${tabDashboard}
    ${tabFourn}
    ${tabScorecard}

  </div>

  <!-- MODAL : RFQ — traiter une demande de prix -->
  <div id="rfq-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1100;align-items:center;justify-content:center;" onclick="if(event.target===this)this.style.display='none'">
    <div style="background:white;border-radius:16px;width:880px;max-width:95vw;max-height:90vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div id="rfq-modal-body"></div>
    </div>
  </div>

  <!-- MODAL : Créer une demande de prix (RFQ multi-références, 1 fournisseur) -->
  <div id="rfq-new-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1100;align-items:center;justify-content:center;" onclick="if(event.target===this)this.style.display='none'">
    <div style="background:white;border-radius:16px;max-width:960px;width:96%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#0ea5e9,#0369a1);border-radius:16px 16px 0 0;">
        <div style="font-weight:800;font-size:1rem;color:white;display:flex;align-items:center;gap:8px;"><i class="fas fa-file-invoice-dollar"></i>Nouvelle demande de prix</div>
        <button onclick="rfqNewClose()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:22px;">
        <div style="font-size:.72rem;color:#64748b;margin-bottom:12px;">Ajoutez vos références et, <strong>pour chacune</strong>, les fournisseurs à consulter (tapez un nom puis Entrée). À la création, la demande se <strong>scinde en une RFQ par fournisseur</strong>.</div>
        <datalist id="rfqn_fourn_list">${RFQ_CIBLES_DATA.map((x: any) => `<option value="${escX(x.nom)}"></option>`).join('')}</datalist>
        <label style="${LBL}">Références à chiffrer</label>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:.78rem;margin-bottom:8px;">
            <thead><tr style="background:#f8fafc;">
              <th style="text-align:left;padding:6px 8px;font-size:.6rem;color:#6b7280;text-transform:uppercase;font-weight:800;">Référence</th>
              <th style="text-align:left;padding:6px 8px;font-size:.6rem;color:#6b7280;text-transform:uppercase;font-weight:800;">Désignation *</th>
              <th style="text-align:center;padding:6px 8px;font-size:.6rem;color:#6b7280;text-transform:uppercase;font-weight:800;">Qté</th>
              <th style="text-align:center;padding:6px 8px;font-size:.6rem;color:#6b7280;text-transform:uppercase;font-weight:800;">Unité</th>
              <th style="text-align:left;padding:6px 8px;font-size:.6rem;color:#6b7280;text-transform:uppercase;font-weight:800;">Fournisseurs à consulter *</th>
              <th></th>
            </tr></thead>
            <tbody id="rfqn_lines"></tbody>
          </table>
        </div>
        <button onclick="rfqNewAddLine()" style="background:#e0f2fe;color:#0369a1;border:1px dashed #7dd3fc;border-radius:8px;padding:7px 14px;font-size:.74rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Ajouter une référence</button>
        <div style="margin-top:14px;"><label style="${LBL}">Notes (optionnel)</label><textarea id="rfqn_notes" rows="2" placeholder="Précisions, délai souhaité…" style="${INP}resize:vertical;"></textarea></div>
      </div>
      <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;gap:8px;">
        <button onclick="rfqNewClose()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="rfqNewSubmit()" style="padding:9px 18px;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane" style="margin-right:5px;"></i>Créer la demande de prix</button>
      </div>
    </div>
  </div>

  <!-- MODAL : Nettoyage des références sans prix -->
  <div id="nettoie-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1100;align-items:center;justify-content:center;" onclick="if(event.target===this)this.style.display='none'">
    <div style="background:white;border-radius:16px;width:680px;max-width:95vw;max-height:88vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="padding:16px 22px;background:#f59e0b;border-radius:16px 16px 0 0;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-weight:800;color:white;"><i class="fas fa-broom" style="margin-right:8px;"></i>Références sans prix</div>
        <button onclick="document.getElementById('nettoie-overlay').style.display='none'" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:14px 20px;">
        <div style="font-size:.74rem;color:#64748b;margin-bottom:10px;">Références déclarées sans prix. Celles « éligibles » (sans prix depuis &gt; 90 jours) peuvent être purgées en masse ; vous pouvez aussi en supprimer individuellement.</div>
        <div id="nettoie-body"></div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;border-top:1px solid #f1f5f9;padding-top:12px;">
          <button onclick="nettoiePurge()" style="background:#ef4444;color:white;border:none;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:.76rem;"><i class="fas fa-trash" style="margin-right:5px;"></i>Purger les éligibles (&gt; 90 j)</button>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL : Traiter une DA → créer un BC -->
  <div id="ach-bc-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:0;max-width:560px;width:92%;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="padding:16px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#10b981,#059669);border-radius:16px 16px 0 0;">
        <div style="font-weight:800;font-size:1rem;color:white;display:flex;align-items:center;gap:8px;"><i class="fas fa-file-invoice"></i>Traiter la DA — Bon de Commande</div>
        <button onclick="achCloseBC()" style="color:rgba(255,255,255,.8);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:22px;">
        <input type="hidden" id="bc_da_id"/>
        <div id="bc_da_info" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:.8rem;color:#065f46;"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><label style="${LBL}">Type de commande</label>
            <select id="bc_type" style="${INP}"><option value="fournisseur">BC Fournisseur</option><option value="st">BC Sous-Traitant</option></select>
          </div>
          <div><label style="${LBL}">Fournisseur / ST</label><select id="bc_fourn" style="${INP}"><option value="">— Choisir un fournisseur —</option></select></div>
          <div style="grid-column:1/-1;"><label style="${LBL}">Articles / Prestation</label><input id="bc_articles" type="text" placeholder="Désignation des articles commandés" style="${INP}"/></div>
          <div><label style="${LBL}">Montant HT (€)</label><input id="bc_montant" type="number" step="0.01" placeholder="0.00" style="${INP}"/></div>
          <div><label style="${LBL}">Livraison prévue</label><input id="bc_livraison" type="date" style="${INP}"/></div>
          <div><label style="${LBL}">Mode de règlement</label>
            <select id="bc_reglement" onchange="bcReglementChange()" style="${INP}">
              <option value="">— Choisir —</option>
              ${MODES_FACTURATION.map(m => `<option value="${escX(m)}">${escX(m)}</option>`).join('')}
            </select>
          </div>
          <div><label style="${LBL}">N° d'affaire</label>
            <input id="bc_affaire" type="text" list="dl_bc_affaires" title="Repris de la demande d'achat. Modifiable : rattachez une demande libre à une affaire en la choisissant ici." style="${INP}font-weight:700;"/>
            <datalist id="dl_bc_affaires">${AFFAIRES_CONNUES.map((a: string) => `<option value="${escX(a)}"></option>`).join('')}</datalist>
            <div style="font-size:.66rem;color:#94a3b8;margin-top:3px;">Repris de la demande. Une demande libre peut être rattachée à une affaire.</div>
          </div>
          <div style="grid-column:1/-1;"><label style="${LBL}">Facture du fournisseur (PDF, image)</label>
            <input id="bc_facture" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style="${INP}padding:7px;"/>
            <div style="font-size:.66rem;color:#94a3b8;margin-top:3px;">Jointe au bon de commande et consultable depuis la facture fournisseur en Comptabilité.</div>
          </div>
          <div id="bc_proforma_note" style="grid-column:1/-1;display:none;background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:10px 14px;font-size:.78rem;color:#92400e;">
            <b>Proforma :</b> une facture fournisseur sera créée immédiatement en Comptabilité. Le bon de commande restera <b>en attente de paiement</b> et n'apparaîtra dans les réceptions à venir qu'une fois cette facture réglée.
          </div>
          <div style="grid-column:1/-1;"><label style="${LBL}">Notes</label><textarea id="bc_notes" rows="2" placeholder="Conditions, remarques…" style="${INP}resize:vertical;"></textarea></div>
        </div>
      </div>
      <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:space-between;gap:8px;">
        <button onclick="achCloseBC()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <div style="display:flex;gap:8px;">
          <button onclick="achSaveDraft()" style="padding:9px 18px;background:white;color:#4338ca;border:1.5px solid #c7d2fe;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-save" style="margin-right:5px;"></i>Enregistrer (brouillon)</button>
          <button onclick="achSubmitBC()" style="padding:9px 18px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane" style="margin-right:5px;"></i>Soumettre → créer BC</button>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL : Création directe d'un Bon de Commande -->
  <div id="ach-newda-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;padding:0;max-width:540px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div style="padding:16px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#0ea5e9,#0369a1);border-radius:16px 16px 0 0;">
        <div style="font-weight:800;font-size:1rem;color:white;display:flex;align-items:center;gap:8px;"><i class="fas fa-file-contract"></i>Nouveau bon de commande</div>
        <button onclick="achCloseNewBC()" style="color:rgba(255,255,255,.8);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:22px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="grid-column:1/-1;font-size:.72rem;color:#6b7280;"><i class="fas fa-info-circle" style="margin-right:5px;color:#0ea5e9;"></i>Les achats créent directement le bon de commande. Il apparaîtra dans la liste des BC des Expéditions (en attente de réception).</div>
        <div><label style="${LBL}">Destinataire</label><select id="bcw_type" style="${INP}"><option value="fournisseur">Fournisseur</option><option value="st">Sous-traitant</option></select></div>
        <div><label style="${LBL}">Fournisseur / sous-traitant *</label><input id="bcw_fourn" type="text" placeholder="Nom" style="${INP}"/></div>
        <div style="grid-column:1/-1;"><label style="${LBL}">Articles / désignation *</label><input id="bcw_articles" type="text" placeholder="Désignation des articles commandés" style="${INP}"/></div>
        <div><label style="${LBL}">Quantité</label><input id="bcw_qte" type="text" placeholder="ex : 12 barres" style="${INP}"/></div>
        <div><label style="${LBL}">Montant HT (€)</label><input id="bcw_montant" type="number" step="0.01" min="0" placeholder="0.00" style="${INP}"/></div>
        <div><label style="${LBL}">Livraison prévue</label><input id="bcw_liv" type="date" style="${INP}"/></div>
        <div><label style="${LBL}">N° d'affaire (option)</label><input id="bcw_aff" type="text" placeholder="AFF-2026-XXX" style="${INP}"/></div>
        <div style="grid-column:1/-1;"><label style="${LBL}">Notes</label><input id="bcw_notes" type="text" placeholder="Remarques…" style="${INP}"/></div>
        <div style="grid-column:1/-1;border-top:1px dashed #e2e8f0;padding-top:10px;margin-top:2px;">
          <label style="${LBL}">Lignes commandées <span style="font-weight:500;text-transform:none;color:#94a3b8;">(détail de la commande · réf · qté · prix)</span></label>
          <table style="width:100%;border-collapse:collapse;margin-top:4px;">
            <thead><tr style="background:#f8fafc;">
              <th style="text-align:left;padding:5px 6px;font-size:.58rem;color:#64748b;text-transform:uppercase;">Référence</th>
              <th style="text-align:left;padding:5px 6px;font-size:.58rem;color:#64748b;text-transform:uppercase;">Désignation</th>
              <th style="text-align:left;padding:5px 6px;font-size:.58rem;color:#64748b;text-transform:uppercase;width:118px;">Catégorie</th>
              <th style="text-align:right;padding:5px 6px;font-size:.58rem;color:#64748b;text-transform:uppercase;width:60px;">Qté</th>
              <th style="text-align:right;padding:5px 6px;font-size:.58rem;color:#64748b;text-transform:uppercase;width:84px;">PU €</th>
              <th style="width:28px;"></th>
            </tr></thead>
            <tbody id="bcw_lines"></tbody>
          </table>
          <button type="button" onclick="bcwAddLine()" style="margin-top:6px;padding:5px 11px;background:#eef2ff;color:#4338ca;border:none;border-radius:7px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:4px;"></i>Ajouter une ligne</button>
          <span style="font-size:.64rem;color:#94a3b8;margin-left:8px;">Détail de ce qui est commandé — le montant HT se calcule tout seul. ⚠️ Le prix officiel fournisseur se met à jour via les <strong>Demandes de prix</strong>, pas via les BC.</span>
        </div>
      </div>
      <div style="padding:0 22px 4px;">${validationCheckbox('bcw_vd', 'Soumettre ce BC à la validation de la Direction (achat stratégique / montant élevé)')}</div>
      <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="achCloseNewBC()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="achCreateBC()" style="padding:9px 18px;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-paper-plane" style="margin-right:5px;"></i>Créer le BC</button>
      </div>
    </div>
  </div>

  <!-- MODAL Nouveau fournisseur -->
  <div id="ach-fourn-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;max-width:560px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">
      <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#8b5cf6,#6d28d9);">
        <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-truck" style="margin-right:8px;"></i>Nouveau fournisseur</div>
        <button onclick="achCloseRef('fournisseur')" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:22px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="grid-column:1/-1;"><label style="${LBL}">Raison sociale *</label><input id="fr_nom" type="text" placeholder="Nom du fournisseur" style="${INP}"/></div>
        <div><label style="${LBL}">Code</label><input id="fr_code" type="text" placeholder="FOUR-XXX" style="${INP}"/></div>
        <div><label style="${LBL}">SIRET</label><input id="fr_siret" type="text" style="${INP}"/></div>
        <div><label style="${LBL}">Contact</label><input id="fr_contact" type="text" style="${INP}"/></div>
        <div><label style="${LBL}">Email</label><input id="fr_email" type="email" style="${INP}"/></div>
        <div><label style="${LBL}">Téléphone</label><input id="fr_tel" type="text" style="${INP}"/></div>
        <div><label style="${LBL}">Délai moyen (j)</label><input id="fr_delai" type="number" style="${INP}"/></div>
        <div style="grid-column:1/-1;"><label style="${LBL}">Familles de fourniture <span style="font-weight:500;color:#94a3b8;text-transform:none;">(liste + ajout libre · un fournisseur peut en avoir plusieurs)</span></label>
          <div id="fr_famille_box" style="display:flex;flex-wrap:wrap;gap:4px;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px;background:#f8fafc;min-height:34px;"></div>
          <div style="display:flex;gap:6px;margin-top:4px;">
            <input id="fr_famille_input" list="ach-famille-dl" placeholder="Choisir une famille ou en saisir une…" onkeydown="achTagKey(event,'fr_famille')" style="${INP}flex:1;"/>
            <button type="button" onclick="achTagAddFromInput('fr_famille')" style="padding:0 14px;background:#8b5cf6;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:1rem;">+</button>
          </div>
        </div>
        <div style="grid-column:1/-1;"><label style="${LBL}">Conditions de paiement</label><input id="fr_cond" type="text" placeholder="Virement 30j…" style="${INP}"/></div>
        <div style="grid-column:1/-1;"><label style="${LBL}">Adresse</label><input id="fr_adresse" type="text" style="${INP}"/></div>
      </div>
      <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="achCloseRef('fournisseur')" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="achSubmitFournisseur()" style="padding:9px 18px;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Créer</button>
      </div>
    </div>
  </div>

  <!-- MODAL Nouveau sous-traitant -->
  <div id="ach-st-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div style="background:white;border-radius:16px;max-width:560px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3);overflow:hidden;">
      <div style="padding:16px 22px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#6366f1,#4338ca);">
        <div style="font-weight:800;color:white;font-size:1rem;"><i class="fas fa-industry" style="margin-right:8px;"></i>Nouveau sous-traitant</div>
        <button onclick="achCloseRef('st')" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <div style="padding:22px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="grid-column:1/-1;"><label style="${LBL}">Raison sociale *</label><input id="st_nom" type="text" placeholder="Nom du sous-traitant" style="${INP}"/></div>
        <div><label style="${LBL}">Code</label><input id="st_code" type="text" placeholder="ST-XXX" style="${INP}"/></div>
        <div><label style="${LBL}">SIRET</label><input id="st_siret" type="text" style="${INP}"/></div>
        <div><label style="${LBL}">Contact</label><input id="st_contact" type="text" style="${INP}"/></div>
        <div><label style="${LBL}">Email</label><input id="st_email" type="email" style="${INP}"/></div>
        <div><label style="${LBL}">Téléphone</label><input id="st_tel" type="text" style="${INP}"/></div>
        <div style="grid-column:1/-1;"><label style="${LBL}">Prestations de sous-traitance <span style="font-weight:500;color:#94a3b8;text-transform:none;">(liste + ajout libre · plusieurs possibles)</span></label>
          <div id="st_presta_box" style="display:flex;flex-wrap:wrap;gap:4px;border:1.5px solid #e2e8f0;border-radius:8px;padding:6px;background:#f8fafc;min-height:34px;"></div>
          <div style="display:flex;gap:6px;margin-top:4px;">
            <input id="st_presta_input" list="ach-presta-dl" placeholder="Choisir une prestation ou en saisir une…" onkeydown="achTagKey(event,'st_presta')" style="${INP}flex:1;"/>
            <button type="button" onclick="achTagAddFromInput('st_presta')" style="padding:0 14px;background:#6366f1;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:1rem;">+</button>
          </div>
        </div>
        <div style="grid-column:1/-1;"><label style="${LBL}">Certifications (séparées par virgule)</label><input id="st_cert" type="text" placeholder="ISO 9001, EN 9100…" style="${INP}"/></div>
        <div><label style="${LBL}">Délai moyen (j)</label><input id="st_delai" type="number" style="${INP}"/></div>
        <div style="grid-column:1/-1;"><label style="${LBL}">Adresse</label><input id="st_adresse" type="text" style="${INP}"/></div>
      </div>
      <div style="padding:14px 22px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="achCloseRef('st')" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>
        <button onclick="achSubmitSousTraitant()" style="padding:9px 18px;background:linear-gradient(135deg,#6366f1,#4338ca);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Créer</button>
      </div>
    </div>
  </div>

  <datalist id="ach-presta-dl">${ALL_PRESTATIONS.map(p=>`<option value="${(p||'').replace(/"/g,'&quot;')}"></option>`).join('')}</datalist>
  <datalist id="ach-famille-dl">${ALL_FAMILLES.map(p=>`<option value="${(p||'').replace(/"/g,'&quot;')}"></option>`).join('')}</datalist>
  <script>
  var ACH_REF_VIEW='fournisseurs';
  // Éditeur de tags réutilisable (prestations ST / familles fournisseur)
  var ACH_TAGS={st_presta:[],fr_famille:[]};
  function achTagRender(name){
    var box=document.getElementById(name+'_box'); if(!box) return;
    box.innerHTML=ACH_TAGS[name].length?ACH_TAGS[name].map(function(t,i){ var safe=String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;'); return '<span style="display:inline-flex;align-items:center;gap:5px;background:#ede9fe;color:#5b21b6;border-radius:999px;padding:2px 9px;font-size:.72rem;font-weight:700;">'+safe+'<i class="fas fa-times" style="cursor:pointer;opacity:.7;" onclick="achTagDelIdx(\\''+name+'\\','+i+')"></i></span>'; }).join(''):'<span style="color:#cbd5e1;font-size:.72rem;align-self:center;">Aucune — ajoutez ci-dessous</span>';
  }
  function achTagAdd(name,val){ val=(val||'').trim(); if(!val) return; if(ACH_TAGS[name].indexOf(val)<0){ ACH_TAGS[name].push(val); achTagRender(name); } }
  function achTagAddFromInput(name){ var inp=document.getElementById(name+'_input'); if(inp){ achTagAdd(name,inp.value); inp.value=''; inp.focus(); } }
  function achTagDelIdx(name,i){ ACH_TAGS[name].splice(i,1); achTagRender(name); }
  function achTagKey(e,name){ if(e.key==='Enter'||e.key===','){ e.preventDefault(); achTagAddFromInput(name); } }
  function achRefSwitch(which){
    ACH_REF_VIEW=which;
    var f=document.getElementById('ach-ref-fournisseurs'), s=document.getElementById('ach-ref-soustraitants');
    if(f) f.style.display=(which==='fournisseurs')?'block':'none';
    if(s) s.style.display=(which==='soustraitants')?'block':'none';
    var bf=document.getElementById('ach-ref-btn-fournisseurs'), bs=document.getElementById('ach-ref-btn-soustraitants');
    if(bf){ var on=which==='fournisseurs'; bf.style.background=on?'#fff':'transparent'; bf.style.color=on?'#5b21b6':'#64748b'; bf.style.boxShadow=on?'0 1px 3px rgba(0,0,0,.12)':'none'; }
    if(bs){ var on2=which==='soustraitants'; bs.style.background=on2?'#fff':'transparent'; bs.style.color=on2?'#4338ca':'#64748b'; bs.style.boxShadow=on2?'0 1px 3px rgba(0,0,0,.12)':'none'; }
    var lbl=document.getElementById('ach-ref-add-label'); if(lbl) lbl.textContent=(which==='fournisseurs')?'Nouveau fournisseur':'Nouveau sous-traitant';
  }
  function achRefAdd(){ if(ACH_REF_VIEW==='fournisseurs'){ ACH_TAGS.fr_famille=[]; achTagRender('fr_famille'); document.getElementById('ach-fourn-overlay').style.display='flex'; } else { ACH_TAGS.st_presta=[]; achTagRender('st_presta'); document.getElementById('ach-st-overlay').style.display='flex'; } }
  // Suppression d'un fournisseur / sous-traitant depuis la liste
  async function achDeleteRef(type, id, btn){
    var tr = btn; while(tr && tr.tagName!=='TR') tr = tr.parentNode;
    var nom = (tr && tr.getAttribute('data-nom')) || id;
    if(!await appConfirm('Supprimer définitivement '+(type==='sous_traitant'?'le sous-traitant':'le fournisseur')+' « '+nom+' » ?')) return;
    var url = (type==='sous_traitant' ? '/api/sous-traitants/' : '/api/fournisseurs/') + encodeURIComponent(id);
    fetch(url, { method:'DELETE' })
      .then(function(r){ return r.json(); })
      .then(function(j){
        if(!j || !j.ok){ pushNotif('err','fa-ban', (j && j.error) || 'Suppression impossible (référencé ailleurs ?).', 6000); return; }
        if(tr && tr.parentNode) tr.parentNode.removeChild(tr);
        pushNotif('ok','fa-trash','« '+nom+' » supprimé.', 3500);
      })
      .catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  function achCloseRef(kind){ document.getElementById(kind==='fournisseur'?'ach-fourn-overlay':'ach-st-overlay').style.display='none'; }
  function achFilterRefs(){
    var cat=(document.getElementById('ref-fcat').value||'');
    var act=(document.getElementById('ref-fact').value||'');
    var q=(document.getElementById('ref-fsearch').value||'').toLowerCase().trim();
    document.querySelectorAll('.ref-row').forEach(function(r){
      var okC=!cat||(r.getAttribute('data-categorie')||'')===cat;
      var rowAct=r.getAttribute('data-activite')||'both';
      var okA=!act||rowAct===act||(act==='both'&&rowAct==='both');
      var hay=((r.getAttribute('data-nom')||'')+' '+(r.getAttribute('data-contact')||'')+' '+(r.getAttribute('data-email')||'')+' '+(r.getAttribute('data-categorie')||'')).toLowerCase();
      var okS=!q||hay.indexOf(q)>=0;
      r.style.display=(okC&&okA&&okS)?'':'none';
    });
  }
  function achSubmitFournisseur(){
    var nom=document.getElementById('fr_nom').value.trim(); if(!nom){ pushNotif('err','fa-exclamation-circle','Raison sociale obligatoire.'); return; }
    var p={ nom:nom, code:document.getElementById('fr_code').value.trim(), siret:document.getElementById('fr_siret').value.trim(), contact:document.getElementById('fr_contact').value.trim(), email:document.getElementById('fr_email').value.trim(), tel:document.getElementById('fr_tel').value.trim(), delai_moyen_j:document.getElementById('fr_delai').value||null, famille_produits:ACH_TAGS.fr_famille.slice(), conditions_paiement:document.getElementById('fr_cond').value.trim(), adresse:document.getElementById('fr_adresse').value.trim() };
    fetch('/api/achats/fournisseur',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}).then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Création échouée.'); return; }
      achCloseRef('fournisseur'); pushNotif('ok','fa-truck','Fournisseur « '+nom+' » créé.',4500); setTimeout(function(){ location.href='/achats/service#fourn'; softReload(); },800);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  function achSubmitSousTraitant(){
    var nom=document.getElementById('st_nom').value.trim(); if(!nom){ pushNotif('err','fa-exclamation-circle','Raison sociale obligatoire.'); return; }
    var p={ nom:nom, code:document.getElementById('st_code').value.trim(), siret:document.getElementById('st_siret').value.trim(), contact:document.getElementById('st_contact').value.trim(), email:document.getElementById('st_email').value.trim(), tel:document.getElementById('st_tel').value.trim(), prestations:ACH_TAGS.st_presta.slice(), certifications:document.getElementById('st_cert').value, delai_moyen_j:document.getElementById('st_delai').value||null, adresse:document.getElementById('st_adresse').value.trim() };
    fetch('/api/achats/sous-traitant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}).then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Création échouée.'); return; }
      achCloseRef('st'); pushNotif('ok','fa-industry','Sous-traitant « '+nom+' » créé.',4500); setTimeout(function(){ location.href='/achats/service#fourn'; softReload(); },800);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  </script>

  <script>
  var ACH_TABS=['da','rfq','dashboard','fourn','scorecard'];
  var ACH_DA=${DA_JSON};
  var RFQ_FOURN=${sjX((FOURN as any[]).map((f: any) => ({ id: f.id, nom: f.nom })))};
  // Catalogue fournisseur : sert a proposer, pour la reference demandee dans la DA,
  // les seuls fournisseurs qui la portent reellement.
  var ACH_CATALOGUE=${sjX((CATALOGUE as any[]).map((p: any) => ({
    r: String(p.reference || '').trim(),
    d: String(p.designation || '').trim(),
    n: String(p.fournisseur_nom || '').trim(),
  })).filter((p: any) => p.n && (p.r || p.d)))};
  // Reference d'affaire attribuee aux achats qui ne proviennent d'aucune affaire.
  var ACH_PROCHAIN_LIBRE=${sjX(PROCHAIN_LIBRE)};
  var ACH_TOUS_FOURN=${sjX([...new Set([
    ...(FOURN as any[]).map((f: any) => String(f.nom || '').trim()),
    ...(STRAIT as any[]).map((s: any) => String(s.nom || '').trim()),
  ].filter(Boolean))].sort())};

  // Fournisseurs portant une reference donnee (comparaison souple : reference OU designation).
  function achFournPourRef(article){
    var a=String(article||'').toLowerCase().trim();
    if(!a) return [];
    var vus={}, out=[];
    ACH_CATALOGUE.forEach(function(p){
      var r=p.r.toLowerCase(), d=p.d.toLowerCase();
      var match = (r && (r===a || a.indexOf(r)>=0 || r.indexOf(a)>=0))
               || (d && (d===a || a.indexOf(d)>=0 || d.indexOf(a)>=0));
      if(match && !vus[p.n]){ vus[p.n]=1; out.push(p.n); }
    });
    return out.sort();
  }

  // Remplit un <select> de fournisseurs : ceux du catalogue d'abord, puis tous les autres.
  function achRemplirFourn(selectId, article, valeurCourante){
    var sel=document.getElementById(selectId); if(!sel) return;
    var lies=achFournPourRef(article);
    var html='<option value="">— Choisir un fournisseur —</option>';
    if(lies.length){
      html+='<optgroup label="Referencés pour '+String(article||'').replace(/[<>&"]/g,'')+'">';
      lies.forEach(function(n){ html+='<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>'; });
      html+='</optgroup>';
    }
    var autres=ACH_TOUS_FOURN.filter(function(n){ return lies.indexOf(n)<0; });
    if(autres.length){
      html+='<optgroup label="'+(lies.length?'Autres fournisseurs':'Aucun fournisseur referencé pour cette référence')+'">';
      autres.forEach(function(n){ html+='<option value="'+n.replace(/"/g,'&quot;')+'">'+n+'</option>'; });
      html+='</optgroup>';
    }
    sel.innerHTML=html;
    var v=String(valeurCourante||'');
    if(v){
      var trouve=false;
      for(var i=0;i<sel.options.length;i++){ if(sel.options[i].value===v){ trouve=true; break; } }
      if(!trouve){ var o=document.createElement('option'); o.value=v; o.textContent=v+' (hors catalogue)'; sel.appendChild(o); }
      sel.value=v;
    }
  }

  function switchAchTab(id){
    ACH_TABS.forEach(function(t){
      var p=document.getElementById('ach-panel-'+t);
      var b=document.getElementById('ach-tab-'+t);
      if(p) p.style.display=(t===id)?'block':'none';
      if(b) b.classList.toggle('active',t===id);
    });
  }

  function achSearch(tableId){
    var sel=document.getElementById('sel-'+tableId);
    var inp=document.getElementById('q-'+tableId);
    var col=sel?sel.value:'all';
    var lq=inp?inp.value.toLowerCase().trim():'';
    var tbl=document.getElementById(tableId);
    if(!tbl) return;
    tbl.querySelectorAll('tbody tr').forEach(function(tr){
      var text=col==='all'?tr.textContent:(tr.dataset[col]||'');
      tr.style.display=(!lq||text.toLowerCase().indexOf(lq)>=0)?'':'none';
    });
  }

  // ── Traiter une DA → BC ──
  function achOpenBC(id){
    var da=ACH_DA.find(function(d){return d.id===id;}); if(!da) return;
    var dr=da.bc_draft||{};
    document.getElementById('bc_da_id').value=id;
    document.getElementById('bc_da_info').innerHTML='<strong>'+id+'</strong> · '+da.article+(da.affaire_id?' · Affaire '+da.affaire_id:'');
    document.getElementById('bc_type').value=dr.type_bc||da.type_bc||'fournisseur';
    // La DA porte la reference du produit demande : on ne propose que les fournisseurs
    // qui la referencent au catalogue, les autres restant accessibles en second groupe.
    achRemplirFourn('bc_fourn', dr.articles||da.article||'', dr.fournisseur||da.fournisseur||'');
    document.getElementById('bc_articles').value=dr.articles||da.article||'';
    // Affaire reprise de la DA, jamais ressaisie. Hors affaire -> reference libre attribuee par le serveur.
    document.getElementById('bc_affaire').value = da.num_affaire || da.affaire_id || dr.affaire_id || ACH_PROCHAIN_LIBRE;
    var _rg=document.getElementById('bc_reglement'); if(_rg){ _rg.value = dr.conditions_paiement || ''; }
    bcReglementChange();
    document.getElementById('bc_montant').value=dr.montant_ht||'';
    document.getElementById('bc_livraison').value=dr.date_livraison||da.livraison||'';
    document.getElementById('bc_affaire').value=dr.affaire_id||da.affaire_id||'';
    document.getElementById('bc_notes').value=dr.notes||'';
    document.getElementById('ach-bc-overlay').style.display='flex';
  }
  function achCloseBC(){ document.getElementById('ach-bc-overlay').style.display='none'; }
  // Affiche l'avertissement quand le reglement choisi est une proforma.
  // Joint la facture du fournisseur au bon de commande (GED). Sans fichier : ne fait rien.
  function bcEnvoyerFacture(bcId){
    var inp=document.getElementById('bc_facture');
    if(!inp || !inp.files || !inp.files.length || !bcId) return Promise.resolve(false);
    var fd=new FormData();
    fd.append('file', inp.files[0]);
    fd.append('ref', 'BC:'+bcId);
    fd.append('categorie', 'facture_fournisseur');
    return fetch('/api/ged/upload',{method:'POST',body:fd})
      .then(function(r){return r.json();})
      .then(function(j){ if(!j||!j.ok){ pushNotif('warn','fa-paperclip','BC créé, mais la facture n a pas pu être jointe : '+((j&&j.error)||'erreur'),7000); return false; } return true; })
      .catch(function(){ pushNotif('warn','fa-paperclip','BC créé, mais la facture n a pas pu être jointe (réseau).',7000); return false; });
  }
  function bcReglementChange(){
    var v=((document.getElementById('bc_reglement')||{}).value||'').toLowerCase();
    var n=document.getElementById('bc_proforma_note');
    if(n) n.style.display = (v==='proforma') ? 'block' : 'none';
  }
  function achCollectBC(){
    return {
      type_bc:document.getElementById('bc_type').value,
      fournisseur:document.getElementById('bc_fourn').value.trim(),
      articles:document.getElementById('bc_articles').value.trim(),
      montant_ht:parseFloat(document.getElementById('bc_montant').value)||0,
      date_livraison:document.getElementById('bc_livraison').value||null,
      affaire_id:document.getElementById('bc_affaire').value.trim()||null,
      conditions_paiement:(document.getElementById('bc_reglement')||{}).value||null,
      notes:document.getElementById('bc_notes').value.trim()||null
    };
  }
  function achSaveDraft(){
    var id=document.getElementById('bc_da_id').value; var d=achCollectBC();
    fetch('/api/achats/da/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({type_bc:d.type_bc,fournisseur:d.fournisseur,bc_draft:d})})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Sauvegarde échouée.'); return; }
        achCloseBC(); pushNotif('ok','fa-save','DA '+id+' enregistrée en brouillon.',4000); setTimeout(function(){softReload();},700);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  function achSubmitBC(){
    var id=document.getElementById('bc_da_id').value; var d=achCollectBC();
    if(!d.fournisseur){ pushNotif('err','fa-exclamation-circle','Indiquez le fournisseur / sous-traitant.'); return; }
    fetch('/api/achats/da/'+encodeURIComponent(id)+'/soumettre',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Création BC échouée.'); return; }
        var _msg='BC <strong>'+j.bc_id+'</strong> créé ('+(j.type_bc==='st'?'sous-traitant':'fournisseur')+').';
        if(j.facture_proforma){ _msg+=' Facture <strong>'+j.facture_proforma+'</strong> à régler en Comptabilité — le BC attend le paiement.'; }
        else { _msg+=' Visible dans Expéditions.'; }
        achCloseBC();
        bcEnvoyerFacture(j.bc_id).then(function(joint){
          pushNotif('ok','fa-paper-plane', _msg + (joint ? ' Facture jointe.' : ''), 7000);
          setTimeout(function(){softReload();},900);
        });
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }

  // ── Création directe d'un Bon de Commande (les achats créent les BC directement) ──
  function achNewBC(){ var b=document.getElementById('bcw_lines'); if(b && !b.querySelector('.bcw-line')) bcwAddLine(); document.getElementById('ach-newda-overlay').style.display='flex'; }
  function achCloseNewBC(){ document.getElementById('ach-newda-overlay').style.display='none'; }
  function bcwLineHtml(){ return '<tr class="bcw-line">'
    +'<td style="padding:3px 6px;"><input class="bcw-ref" placeholder="Réf." style="width:100%;border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 7px;font-family:monospace;font-weight:700;font-size:.74rem;"/></td>'
    +'<td style="padding:3px 6px;"><input class="bcw-des" placeholder="Désignation" style="width:100%;border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 7px;font-size:.74rem;"/></td>'
    +'<td style="padding:3px 6px;"><select class="bcw-fam" style="width:100%;border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 4px;font-size:.72rem;"><option value="matiere_premiere">Matière</option><option value="accessoire">Accessoires</option><option value="outillage">Outils</option><option value="chimique">Chimique</option><option value="consommable">Consommable</option><option value="autre">Autres</option></select></td>'
    +'<td style="padding:3px 6px;"><input class="bcw-qte" type="number" step="any" min="0" style="width:100%;border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 5px;text-align:right;font-size:.74rem;" oninput="bcwSum()"/></td>'
    +'<td style="padding:3px 6px;"><input class="bcw-pu" type="number" step="0.01" min="0" style="width:100%;border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 5px;text-align:right;font-size:.74rem;" oninput="bcwSum()"/></td>'
    +'<td style="text-align:center;"><button type="button" onclick="bcwDel(this)" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1rem;">×</button></td>'
    +'</tr>'; }
  function bcwAddLine(){ document.getElementById('bcw_lines').insertAdjacentHTML('beforeend', bcwLineHtml()); }
  function bcwDel(b){ var tr=b.closest('tr'); if(tr) tr.remove(); bcwSum(); }
  function bcwSum(){ var t=0; document.querySelectorAll('#bcw_lines .bcw-line').forEach(function(tr){ var q=parseFloat(tr.querySelector('.bcw-qte').value)||0; var p=parseFloat(tr.querySelector('.bcw-pu').value)||0; t+=q*p; }); if(t>0) document.getElementById('bcw_montant').value=t.toFixed(2); }
  function bcwCollectLines(){ var out=[]; document.querySelectorAll('#bcw_lines .bcw-line').forEach(function(tr){ var ref=tr.querySelector('.bcw-ref').value.trim(); var pu=parseFloat(tr.querySelector('.bcw-pu').value); if(ref && isFinite(pu)){ out.push({ reference:ref, designation:tr.querySelector('.bcw-des').value.trim()||ref, famille:tr.querySelector('.bcw-fam').value, qte:parseFloat(tr.querySelector('.bcw-qte').value)||null, prix_unitaire:pu, activite:'both' }); } }); return out; }
  function achCreateBC(){
    var fourn=document.getElementById('bcw_fourn').value.trim();
    var lines=bcwCollectLines();
    var articles=document.getElementById('bcw_articles').value.trim();
    if(!articles && lines.length) articles=lines.map(function(l){return l.designation;}).join(', ');
    if(!fourn){ pushNotif('err','fa-exclamation-circle','Indiquez le fournisseur / sous-traitant.'); return; }
    if(!articles){ pushNotif('err','fa-exclamation-circle','Indiquez les articles ou au moins une ligne.'); return; }
    var payload={ type_bc:document.getElementById('bcw_type').value, fournisseur:fourn, articles:articles, qte:document.getElementById('bcw_qte').value.trim(), montant_ht:parseFloat(document.getElementById('bcw_montant').value)||0, date_livraison:document.getElementById('bcw_liv').value||null, affaire_id:document.getElementById('bcw_aff').value.trim()||null, notes:document.getElementById('bcw_notes').value.trim()||null, lignes_detail:lines };
    fetch('/api/achats/bc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Création BC échouée.'); return; }
        achCloseNewBC(); if(window.submitValidation) submitValidation('achats','bcw_vd',{type:'Bon de commande',objet:fourn+' — '+articles,montant:payload.montant_ht,priorite:'normal',ref_table:'bons_de_commande',ref_id:j.bc_id||null}); pushNotif('ok','fa-paper-plane','BC <strong>'+j.bc_id+'</strong> créé ('+(j.type_bc==='st'?'sous-traitant':'fournisseur')+'). Visible dans Expéditions.',6000); setTimeout(function(){softReload();},900);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }

  // ─── Demandes de prix (RFQ) ───────────────────────────────────
  var RFQ_CUR=null;
  function rfqClose(){ document.getElementById('rfq-modal-overlay').style.display='none'; }
  function rfqEsc(s){ return String(s==null?'':s).replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
  function rfqFilter(s){
    document.querySelectorAll('.rfq-pill').forEach(function(b){ b.style.background='white'; b.style.color='#475569'; });
    var el=document.getElementById('rfqf-'+s); if(el){ el.style.background='#10b981'; el.style.color='white'; }
    var tb=document.getElementById('rfq-table'); if(!tb) return;
    tb.querySelectorAll('tbody tr').forEach(function(tr){ tr.style.display=(s==='all'||tr.getAttribute('data-statut')===s)?'':'none'; });
  }
  function rfqFournOptions(sel){
    return '<option value="">— fournisseur —</option>'+RFQ_FOURN.map(function(f){ return '<option value="'+f.id+'"'+(String(f.id)===String(sel)?' selected':'')+'>'+rfqEsc(f.nom)+'</option>'; }).join('');
  }
  function rfqStatutLbl(s){ return s==='a_traiter'?'À traiter':s==='envoyee'?'Envoyée':s==='reponse_recue'?'Réponse reçue':s==='cloturee'?'Clôturée':s; }
  async function rfqOpen(id){
    var ov=document.getElementById('rfq-modal-overlay'), body=document.getElementById('rfq-modal-body');
    body.innerHTML='<div style="padding:40px;text-align:center;color:#94a3b8;">Chargement…</div>'; ov.style.display='flex';
    try{ var r=await fetch('/api/demandes-prix/'+id); var j=await r.json(); if(!j.ok){ body.innerHTML='<div style="padding:30px;color:#b91c1c;">Introuvable.</div>'; return; } RFQ_CUR=j; body.innerHTML=rfqRender(j); }
    catch(e){ body.innerHTML='<div style="padding:30px;color:#b91c1c;">Erreur de chargement.</div>'; }
  }
  function rfqRespRow(ligneId, rep){
    var rid=rep.id||''; var fixed=(!rep._new && rep.fournisseur_id);
    var fcell = fixed ? ('<input type="hidden" class="rr-fourn" value="'+rep.fournisseur_id+'"/><span style="font-size:.76rem;font-weight:700;color:#334155;">'+rfqEsc(rep.fournisseur_nom)+'</span>')
      : ('<select class="rr-fourn" style="width:100%;border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 6px;font-size:.74rem;">'+rfqFournOptions(rep.fournisseur_id)+'</select>');
    return '<tr class="rfq-resp" data-rid="'+rid+'" data-ligne="'+ligneId+'">'
      +'<td style="padding:3px 8px;">'+fcell+'</td>'
      +'<td style="padding:3px 8px;text-align:right;"><input class="rr-prix" type="number" step="0.01" min="0" value="'+(rep.prix_unitaire!=null?rep.prix_unitaire:'')+'" style="width:90px;border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 6px;text-align:right;font-size:.74rem;"/></td>'
      +'<td style="padding:3px 8px;text-align:right;"><input class="rr-delai" type="number" min="0" value="'+(rep.delai_jours!=null?rep.delai_jours:'')+'" style="width:64px;border:1.5px solid #e2e8f0;border-radius:6px;padding:5px 6px;text-align:right;font-size:.74rem;"/></td>'
      +'<td style="padding:3px 8px;text-align:center;"><input class="rr-ret" type="radio" name="ret-'+ligneId+'"'+(rep.retenu?' checked':'')+'/></td>'
      +'</tr>';
  }
  function rfqRender(j){
    var d=j.demande, lignes=j.lignes||[], reps=j.reponses||[];
    var h='<div style="padding:16px 22px;background:linear-gradient(135deg,#0ea5e9,#0369a1);border-radius:16px 16px 0 0;display:flex;justify-content:space-between;align-items:center;">';
    h+='<div style="color:white;"><div style="font-weight:800;font-size:1rem;"><i class="fas fa-file-invoice-dollar" style="margin-right:8px;"></i>'+rfqEsc(d.numero)+'</div>';
    h+='<div style="font-size:.72rem;opacity:.85;margin-top:2px;">'+(d.origine==='analyse_dt'?'Analyse DT':d.origine==='nomenclature'?'Nomenclature':'Libre')+(d.dt_ref?' · '+rfqEsc(d.dt_ref):'')+' · '+rfqEsc(d.demandeur)+'</div></div>';
    h+='<button onclick="rfqClose()" style="color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button></div>';
    var b='<div style="padding:18px 22px;">';
    b+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center;"><span style="font-size:.72rem;color:#64748b;">Statut : <strong>'+rfqStatutLbl(d.statut)+'</strong></span>';
    b+='<button onclick="rfqPdfCur()" style="margin-left:auto;background:#eef2ff;color:#4338ca;border:none;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer;font-size:.76rem;"><i class="fas fa-file-pdf" style="margin-right:5px;"></i>Télécharger le PDF</button>';
    if(d.statut==='a_traiter') b+='<button onclick="rfqEnvoyer()" style="background:#3b82f6;color:white;border:none;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer;font-size:.76rem;"><i class="fas fa-paper-plane" style="margin-right:5px;"></i>Accepter et envoyer</button>';
    b+='</div>';
    lignes.forEach(function(l,idx){
      var lr=reps.filter(function(x){ return String(x.ligne_id)===String(l.id); });
      if(!lr.length) lr=[{ligne_id:l.id,_new:true}];
      b+='<div style="border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:12px;">';
      b+='<div style="font-weight:800;color:#1e293b;font-size:.84rem;margin-bottom:2px;">'+(l.reference?'<span style="font-family:monospace;color:#4338ca;">'+rfqEsc(l.reference)+'</span> · ':'')+rfqEsc(l.designation)+'</div>';
      b+='<div style="font-size:.7rem;color:#94a3b8;margin-bottom:8px;">Qté estimée : '+(l.quantite_estimee!=null?l.quantite_estimee:'—')+' '+rfqEsc(l.unite)+'</div>';
      b+='<table data-ligne="'+l.id+'" data-ref="'+rfqEsc(l.reference)+'" data-des="'+rfqEsc(l.designation)+'" data-cat="'+rfqEsc(l.categorie||'matiere_premiere')+'" style="width:100%;border-collapse:collapse;">';
      b+='<thead><tr style="background:#f8fafc;"><th style="padding:4px 8px;text-align:left;font-size:.58rem;text-transform:uppercase;color:#6b7280;">Fournisseur</th><th style="padding:4px 8px;text-align:right;font-size:.58rem;text-transform:uppercase;color:#6b7280;">Prix unit.</th><th style="padding:4px 8px;text-align:right;font-size:.58rem;text-transform:uppercase;color:#6b7280;">Délai (j)</th><th style="padding:4px 8px;text-align:center;font-size:.58rem;text-transform:uppercase;color:#6b7280;">Retenu</th></tr></thead><tbody>';
      lr.forEach(function(rep){ b+=rfqRespRow(l.id, rep); });
      b+='</tbody></table>';
      b+='<button onclick="rfqAddResp('+idx+')" style="margin-top:6px;background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:4px 10px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:4px;"></i>Ajouter un fournisseur</button>';
      b+='</div>';
    });
    b+='<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;border-top:1px solid #f1f5f9;padding-top:14px;">';
    b+='<button onclick="rfqDelete()" style="background:#fef2f2;color:#b91c1c;border:none;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:.76rem;margin-right:auto;"><i class="fas fa-trash" style="margin-right:5px;"></i>Supprimer</button>';
    b+='<button onclick="rfqSaveResponses()" style="background:#f1f5f9;color:#374151;border:none;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:.76rem;"><i class="fas fa-save" style="margin-right:5px;"></i>Enregistrer les réponses</button>';
    b+='<button onclick="rfqValider()" style="background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:8px;padding:8px 14px;font-weight:800;cursor:pointer;font-size:.76rem;"><i class="fas fa-circle-check" style="margin-right:5px;"></i>Valider &amp; mettre à jour les prix</button>';
    b+='</div></div>';
    return h+b;
  }
  function rfqAddResp(idx){
    if(!RFQ_CUR||!RFQ_CUR.lignes[idx]) return;
    var ligneId=RFQ_CUR.lignes[idx].id;
    var tb=document.querySelector('table[data-ligne="'+ligneId+'"] tbody'); if(!tb) return;
    var tmp=document.createElement('tbody'); tmp.innerHTML=rfqRespRow(ligneId,{_new:true}); tb.appendChild(tmp.firstChild);
  }
  function rfqCollectResponses(){
    var out=[];
    document.querySelectorAll('#rfq-modal-body tr.rfq-resp').forEach(function(tr){
      var fEl=tr.querySelector('.rr-fourn'); var fid=fEl?fEl.value:''; if(!fid) return;
      var fnom=''; if(fEl.tagName==='SELECT'){ fnom=fEl.options[fEl.selectedIndex].text; } else { var sp=tr.querySelector('span'); fnom=sp?sp.textContent:''; }
      var prix=tr.querySelector('.rr-prix').value, delai=tr.querySelector('.rr-delai').value;
      out.push({ id:tr.getAttribute('data-rid')||null, ligne_id:tr.getAttribute('data-ligne'), fournisseur_id:fid, fournisseur_nom:fnom, prix_unitaire:(prix!==''?parseFloat(prix):null), delai_jours:(delai!==''?parseInt(delai,10):null), retenu:tr.querySelector('.rr-ret').checked });
    });
    return out;
  }
  function rfqCollectRetenus(){
    var retenus=[];
    document.querySelectorAll('#rfq-modal-body table[data-ligne]').forEach(function(tbl){
      var checked=tbl.querySelector('.rr-ret:checked'); if(!checked) return;
      var tr=checked.closest('tr');
      var fEl=tr.querySelector('.rr-fourn'); var fid=fEl?fEl.value:''; if(!fid) return;
      var fnom=''; if(fEl.tagName==='SELECT'){ fnom=fEl.options[fEl.selectedIndex].text; } else { var sp=tr.querySelector('span'); fnom=sp?sp.textContent:''; }
      var prix=tr.querySelector('.rr-prix').value; if(prix==='') return;
      retenus.push({ reference:tbl.getAttribute('data-ref'), designation:tbl.getAttribute('data-des'), categorie:tbl.getAttribute('data-cat'), fournisseur_id:fid, fournisseur_nom:fnom, prix_unitaire:parseFloat(prix), reponse_id:tr.getAttribute('data-rid')||null });
    });
    return retenus;
  }
  function rfqId(){ return RFQ_CUR&&RFQ_CUR.demande?RFQ_CUR.demande.id:''; }
  function rfqEnvoyer(){ var id=rfqId(); fetch('/api/demandes-prix/'+id+'/envoyer',{method:'POST'}).then(function(r){return r.json();}).then(function(j){ if(j.ok){ pushNotif('ok','fa-paper-plane','RFQ envoyée aux fournisseurs.'); rfqOpen(id); } else pushNotif('err','fa-ban','Échec.'); }); }
  function rfqSaveResponses(){ var id=rfqId(); fetch('/api/demandes-prix/'+id+'/reponses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reponses:rfqCollectResponses()})}).then(function(r){return r.json();}).then(function(j){ if(j.ok){ pushNotif('ok','fa-save','Réponses enregistrées.'); rfqOpen(id); } else pushNotif('err','fa-ban','Échec.'); }); }
  function rfqValider(){
    var id=rfqId(); var retenus=rfqCollectRetenus();
    if(!retenus.length){ pushNotif('err','fa-exclamation-circle','Cochez au moins un prix « retenu » (avec un prix saisi).'); return; }
    fetch('/api/demandes-prix/'+id+'/reponses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reponses:rfqCollectResponses()})})
      .then(function(){ return fetch('/api/demandes-prix/'+id+'/valider',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({retenus:retenus})}); })
      .then(function(r){return r.json();}).then(function(j){ if(j.ok){ pushNotif('ok','fa-circle-check',(j.prix_maj||0)+' prix officiel(s) mis à jour. RFQ clôturée.',6000); rfqClose(); setTimeout(function(){softReload();},1000); } else pushNotif('err','fa-ban','Échec de la validation.'); });
  }
  async function rfqDelete(){ var id=rfqId(); if(!await appConfirm('Supprimer cette demande de prix ?')) return; fetch('/api/demandes-prix/'+id,{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){ if(j.ok){ pushNotif('ok','fa-trash','RFQ supprimée.'); rfqClose(); setTimeout(function(){softReload();},700); } else pushNotif('err','fa-ban','Échec.'); }); }

  // ─── Nettoyage des références sans prix ───────────────────────
  function nettoieEsc(s){ return String(s==null?'':s).replace(/</g,'&lt;'); }
  async function nettoieOpen(){
    var ov=document.getElementById('nettoie-overlay'), body=document.getElementById('nettoie-body');
    body.innerHTML='<div style="padding:20px;text-align:center;color:#94a3b8;">Chargement…</div>'; ov.style.display='flex';
    try{ var r=await fetch('/api/produits-fournisseurs/sans-prix'); var j=await r.json(); var l=j.produits||[];
      if(!l.length){ body.innerHTML='<div style="padding:20px;text-align:center;color:#10b981;">Aucune référence sans prix. 👍</div>'; return; }
      body.innerHTML='<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:5px 8px;font-size:.58rem;text-transform:uppercase;color:#6b7280;">Réf.</th><th style="text-align:left;padding:5px 8px;font-size:.58rem;text-transform:uppercase;color:#6b7280;">Désignation</th><th style="text-align:left;padding:5px 8px;font-size:.58rem;text-transform:uppercase;color:#6b7280;">Fournisseur</th><th style="text-align:center;padding:5px 8px;font-size:.58rem;text-transform:uppercase;color:#6b7280;">Éligible</th><th></th></tr></thead><tbody>'+l.map(function(p){ return '<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:5px 8px;font-family:monospace;font-weight:700;font-size:.74rem;color:#4338ca;">'+nettoieEsc(p.reference)+'</td><td style="padding:5px 8px;font-size:.74rem;">'+nettoieEsc(p.designation)+'</td><td style="padding:5px 8px;font-size:.72rem;color:#64748b;">'+nettoieEsc(p.fournisseur_nom)+'</td><td style="padding:5px 8px;text-align:center;">'+(p.eligible?'<span style="color:#b91c1c;font-weight:700;font-size:.7rem;">oui</span>':'<span style="color:#94a3b8;font-size:.7rem;">—</span>')+'</td><td style="padding:5px 8px;text-align:center;"><button onclick="nettoieDel(this)" data-id="'+p.id+'" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1rem;">×</button></td></tr>'; }).join('')+'</tbody></table>';
    }catch(e){ body.innerHTML='<div style="padding:20px;color:#b91c1c;">Erreur de chargement.</div>'; }
  }
  function nettoieDel(b){ var id=b.getAttribute('data-id'); fetch('/api/produits-fournisseurs/'+id,{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){ if(j.ok){ var tr=b.closest('tr'); if(tr) tr.remove(); pushNotif('ok','fa-trash','Référence supprimée.'); } else pushNotif('err','fa-ban','Échec.'); }); }
  async function nettoiePurge(){ if(!await appConfirm('Purger toutes les références sans prix de plus de 90 jours ?')) return; fetch('/api/produits-fournisseurs/purge',{method:'POST'}).then(function(r){return r.json();}).then(function(j){ if(j.ok){ pushNotif('ok','fa-broom',(j.supprimes||0)+' référence(s) purgée(s).'); document.getElementById('nettoie-overlay').style.display='none'; setTimeout(function(){softReload();},800); } else pushNotif('err','fa-ban','Échec.'); }); }

  // ─── Création d'une demande de prix (RFQ v2 : multi-références, fournisseurs PAR référence) ───
  var RFQ_CIBLES = ${sjX(RFQ_CIBLES_DATA)};
  function rfqNewChip(tr, f){
    if(!f || !f.nom) return;
    var key=String(f.id||f.nom); tr._fourns=tr._fourns||[];
    if(tr._fourns.some(function(x){return String(x.id||x.nom)===key;})) return;
    tr._fourns.push({id:f.id||null, nom:f.nom});
    var chips=tr.querySelector('.rfqn-chips');
    var span=document.createElement('span');
    span.style.cssText='display:inline-flex;align-items:center;gap:4px;background:#e0f2fe;color:#0369a1;border-radius:999px;padding:2px 8px;font-size:.7rem;font-weight:700;';
    span.appendChild(document.createTextNode(f.nom));
    var x=document.createElement('button'); x.type='button'; x.innerHTML='&times;';
    x.style.cssText='border:none;background:none;color:#0369a1;cursor:pointer;font-size:.95rem;line-height:1;padding:0;';
    x.addEventListener('click', function(){ tr._fourns=tr._fourns.filter(function(y){return String(y.id||y.nom)!==key;}); chips.removeChild(span); });
    span.appendChild(x); chips.appendChild(span);
  }
  function rfqNewAddFourn(input){
    var v=(input.value||'').trim(); if(!v) return;
    var tr=input.closest('tr');
    var hit=RFQ_CIBLES.filter(function(c){return String(c.nom||'').toLowerCase()===v.toLowerCase();})[0];
    rfqNewChip(tr, hit || {id:null, nom:v}); input.value='';
  }
  function rfqNewLineRow(){
    var tr=document.createElement('tr'); tr.className='rfqn-line'; tr.style.borderBottom='1px solid #f1f5f9'; tr._fourns=[];
    tr.innerHTML='<td style="padding:4px 6px;"><input class="rfqn-ref" type="text" style="width:100px;border:1px solid #e2e8f0;border-radius:6px;padding:5px 7px;font-size:.76rem;box-sizing:border-box;"/></td>'
      +'<td style="padding:4px 6px;"><input class="rfqn-des" type="text" style="width:100%;min-width:140px;border:1px solid #e2e8f0;border-radius:6px;padding:5px 7px;font-size:.76rem;box-sizing:border-box;"/></td>'
      +'<td style="padding:4px 6px;"><input class="rfqn-qte" type="number" min="0" step="any" style="width:64px;border:1px solid #e2e8f0;border-radius:6px;padding:5px 7px;font-size:.76rem;text-align:center;box-sizing:border-box;"/></td>'
      +'<td style="padding:4px 6px;"><input class="rfqn-unite" type="text" value="pce" style="width:58px;border:1px solid #e2e8f0;border-radius:6px;padding:5px 7px;font-size:.76rem;text-align:center;box-sizing:border-box;"/></td>'
      +'<td style="padding:4px 6px;min-width:210px;"><div class="rfqn-chips" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-bottom:4px;"></div><input class="rfqn-fadd" list="rfqn_fourn_list" placeholder="+ fournisseur" style="width:160px;border:1px solid #e2e8f0;border-radius:6px;padding:4px 7px;font-size:.72rem;box-sizing:border-box;"/></td>'
      +'<td style="padding:4px 6px;text-align:center;"><button type="button" class="rfqn-del" title="Retirer" style="width:26px;height:26px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;border-radius:6px;cursor:pointer;"><i class="fas fa-times"></i></button></td>';
    document.getElementById('rfqn_lines').appendChild(tr);
    var fadd=tr.querySelector('.rfqn-fadd');
    fadd.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); rfqNewAddFourn(fadd); } });
    fadd.addEventListener('change', function(){ rfqNewAddFourn(fadd); });
    tr.querySelector('.rfqn-del').addEventListener('click', function(){ tr.remove(); });
    return tr;
  }
  function rfqNewAddLine(){ rfqNewLineRow(); }
  function rfqNew(id){
    document.getElementById('rfqn_notes').value='';
    document.getElementById('rfqn_lines').innerHTML='';
    var tr=rfqNewLineRow();
    if(id){ var hit=RFQ_CIBLES.filter(function(c){return String(c.id)===String(id);})[0]; if(hit) rfqNewChip(tr, hit); }
    document.getElementById('rfq-new-overlay').style.display='flex';
  }
  function rfqNewClose(){ document.getElementById('rfq-new-overlay').style.display='none'; }
  function rfqNewSubmit(){
    var rows=document.querySelectorAll('#rfqn_lines .rfqn-line'); var lignes=[]; var missingFourn=false;
    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      var ref=(r.querySelector('.rfqn-ref').value||'').trim();
      var des=(r.querySelector('.rfqn-des').value||'').trim();
      if(!ref && !des) continue;
      var fs=(r._fourns||[]).slice();
      var pending=(r.querySelector('.rfqn-fadd').value||'').trim();
      if(pending){ var hitp=RFQ_CIBLES.filter(function(c){return String(c.nom||'').toLowerCase()===pending.toLowerCase();})[0]; fs.push(hitp||{id:null,nom:pending}); }
      if(!fs.length){ missingFourn=true; continue; }
      var q=(r.querySelector('.rfqn-qte').value||'').trim();
      lignes.push({ reference:ref||null, designation:des||ref, quantite_estimee:q||null, unite:(r.querySelector('.rfqn-unite').value||'pce').trim()||'pce', categorie:'matiere_premiere', fournisseurs:fs });
    }
    if(!lignes.length){ pushNotif('err','fa-exclamation-circle', missingFourn?'Chaque référence doit avoir au moins un fournisseur à consulter.':'Ajoutez au moins une référence.'); return; }
    var payload={ origine:'libre', notes:(document.getElementById('rfqn_notes').value||'').trim()||null, lignes:lignes };
    fetch('/api/demandes-prix/grouped',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){
        if(j.ok){ rfqNewClose(); pushNotif('ok','fa-paper-plane',(j.count||0)+' demande(s) de prix créée(s) — 1 par fournisseur.',5000); setTimeout(function(){softReload();},900); }
        else pushNotif('err','fa-ban', j.error||'Création impossible.');
      }).catch(function(){ pushNotif('err','fa-ban','Erreur réseau.'); });
  }
  function rfqPdf(id){ window.open('/api/demandes-prix/'+id+'/pdf','_blank'); }
  function rfqPdfCur(){ var id=rfqId(); if(id) window.open('/api/demandes-prix/'+id+'/pdf','_blank'); }
  async function daRegrouper(){
    if(!await appConfirm('Fusionner les demandes d\\'achat à traiter d\\'un même fournisseur en une seule demande par fournisseur ?')) return;
    fetch('/api/achats/da/regrouper',{method:'POST'}).then(function(r){return r.json();}).then(function(j){
      if(j.ok){ if(j.fusions>0){ pushNotif('ok','fa-object-group', j.fusions+' fournisseur(s) regroupe(s), '+j.absorbees+' demande(s) fusionnee(s).',5000); setTimeout(function(){softReload();},900); } else pushNotif('info','fa-circle-info','Aucun fournisseur en double parmi les demandes a traiter.'); }
      else pushNotif('err','fa-ban', j.error||'Echec du regroupement.');
    }).catch(function(){ pushNotif('err','fa-ban','Erreur reseau.'); });
  }

  (function(){
    var hash=(window.location.hash||'').replace('#','');
    if(ACH_TABS.indexOf(hash)>=0) switchAchTab(hash);
    else switchAchTab('da');
  })();
  </script>`

  return layout('Service Achats', content, 'achats-service')
}
