// ══════════════════════════════════════════════════════════════
// SERVICE STOCK – Vue unifiée Seem + Semrac
// Stock temps réel · Gestion (supply chain) · Alertes · Dashboard
// ══════════════════════════════════════════════════════════════
import { escX, layout, serviceHeader, demandeAchatModal } from './shared'
import type { ArticleStock, MouvementStock, StatutStock } from './types'
import { libelleOrigine } from './mise_en_stock'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

// ─── Lot F (15/09/2026) : données de l'onglet « Rangement / Mise en stock » ───
export type DonneesMiseEnStock = {
  file?: any[]; rangees?: any[]; types?: any[]; zones?: any[]; historique?: any[]
  tableAbsente?: boolean; erreur?: string | null; peutEcrire?: boolean
  /** Vérification lot F : pannes distinguées — file illisible (≠ « rien à ranger ») ; types ou zones illisibles (rangement impossible). */
  erreurFile?: string | null; erreurTypes?: string | null
}
type Mes = { file: any[]; rangees: any[]; types: any[]; zones: any[]; historique: any[]; tableAbsente: boolean; erreur: string | null; peutEcrire: boolean; erreurFile: string | null; erreurTypes: string | null }
const tab = (v: any): any[] => Array.isArray(v) ? v.filter(x => x && typeof x === 'object') : []
function normMes(m: DonneesMiseEnStock | undefined | null): Mes {
  return {
    file: tab(m?.file), rangees: tab(m?.rangees), types: tab(m?.types), zones: tab(m?.zones), historique: tab(m?.historique),
    tableAbsente: m?.tableAbsente === true, erreur: typeof m?.erreur === 'string' ? m.erreur : null, peutEcrire: m?.peutEcrire !== false,
    erreurFile: typeof m?.erreurFile === 'string' ? m.erreurFile : null, erreurTypes: typeof m?.erreurTypes === 'string' ? m.erreurTypes : null,
  }
}
const str = (v: any) => (v == null ? '' : String(v))
const lblType = (mes: Mes, code: any) => { const c = str(code); if (!c) return ''; const t = mes.types.find(x => str(x.code) === c); return t ? str(t.libelle) || c : c }
const fmtQte = (n: any) => { const x = Number(n); return Number.isFinite(x) ? String(Math.round(x * 1000) / 1000).replace('.', ',') : '—' }
const fmtDateHeure = (v: any) => { const s = str(v); if (!s) return '—'; const d = new Date(s); return isNaN(d.getTime()) ? s.slice(0, 16) : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
/** Attribut des boutons d'écriture pour un lecteur : désactivés (style commun .stk-root button:disabled). */
const offSi = (peutEcrire: boolean) => peutEcrire ? '' : ' disabled title="Réservé aux personnes qui ont l’écriture sur le Stock"'

const GRN   = '#22c55e'
const GRN_D = '#16a34a'
const TODAY = new Date().toISOString().slice(0, 10)

// ─── Calcul statut stock ──────────────────────────────────────

function statut(a: ArticleStock): StatutStock {
  if (a.quantite <= a.seuil_mini)     return 'critique'
  if (a.quantite <= a.point_commande) return 'bas'
  if (a.quantite <  a.seuil_maxi * 0.75) return 'moyen'
  return 'haut'
}

function couvertureJours(a: ArticleStock): number | null {
  if (!a.consommation_mensuelle || a.consommation_mensuelle === 0) return null
  return Math.round(a.quantite / a.consommation_mensuelle * 30)
}

// ─── Données de démonstration ─────────────────────────────────

const ARTICLES_DEFAULT: ArticleStock[] = []

const MVTS_DEFAULT: MouvementStock[] = []

// ─── Helpers visuels ──────────────────────────────────────────

function gaugeBar(a: ArticleStock) {
  const s = statut(a)
  const pct = Math.min(Math.round(a.quantite / a.seuil_maxi * 100), 100)
  const pMini = Math.round(a.seuil_mini / a.seuil_maxi * 100)
  const pCmd  = Math.round(a.point_commande / a.seuil_maxi * 100)
  const col: Record<StatutStock, string> = { critique:'#ef4444', bas:'#f97316', moyen:'#f59e0b', haut:'#22c55e' }
  const c = col[s]
  return `<div style="min-width:160px;flex:1;">
    <div style="position:relative;height:10px;border-radius:5px;overflow:hidden;background:#f1f5f9;">
      <div style="position:absolute;left:0;width:${pMini}%;height:100%;background:#fee2e230;"></div>
      <div style="position:absolute;left:${pMini}%;width:${pCmd-pMini}%;height:100%;background:#fed7aa30;"></div>
      <div style="position:absolute;left:${pCmd}%;width:${75-pCmd}%;height:100%;background:#fef9c330;"></div>
      <div style="position:absolute;left:75%;width:25%;height:100%;background:#dcfce730;"></div>
      <div style="position:absolute;left:0;width:${pct}%;height:100%;background:${c};border-radius:5px;transition:width .3s;"></div>
      <div style="position:absolute;left:${pMini}%;width:2px;height:100%;background:rgba(0,0,0,.25);"></div>
      <div style="position:absolute;left:${pCmd}%;width:2px;height:100%;background:rgba(0,0,0,.25);"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:.58rem;color:#9ca3af;margin-top:2px;">
      <span style="font-weight:700;color:${c};">${a.quantite} ${escX(a.unite)}</span>
      <span>mini: ${a.seuil_mini}</span>
      <span>max: ${a.seuil_maxi}</span>
    </div>
  </div>`
}

function statutBadge(s: StatutStock) {
  const m: Record<StatutStock,[string,string,string]> = {
    critique: ['#fee2e2','#b91c1c','CRITIQUE'],
    bas:      ['#fed7aa','#9a3412','BAS'],
    moyen:    ['#fef9c3','#78350f','MOYEN'],
    haut:     ['#dcfce7','#15803d','HAUT'],
  }
  const [bg,col,lbl] = m[s]
  return `<span style="display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:.65rem;font-weight:800;background:${bg};color:${col};">${lbl}</span>`
}

function activiteBadge(a: 'Seem'|'Semrac'|'both') {
  if (a === 'Seem')   return `<span style="background:#dbeafe;color:#1d4ed8;border-radius:6px;padding:2px 8px;font-size:.65rem;font-weight:700;">SEEM</span>`
  if (a === 'Semrac') return `<span style="background:#f3e8ff;color:#6b21a8;border-radius:6px;padding:2px 8px;font-size:.65rem;font-weight:700;">SEMRAC</span>`
  return `<span style="background:#f1f5f9;color:#475569;border-radius:6px;padding:2px 8px;font-size:.65rem;font-weight:700;">LES DEUX</span>`
}

function catLabel(c: string) {
  const m: Record<string,string> = {
    matiere_premiere:'Matiere premiere', consommable:'Consommable',
    chimique:'Chimique OAS', emballage:'Emballage', securite:'Securite/EPI',
    outillage:'Outillage', piece_rechange:'Piece rechange'
  }
  return m[c] ?? c
}

function mvtTypeBadge(t: string) {
  const m: Record<string,[string,string]> = {
    entree:     ['#dcfce7','#15803d'],
    sortie:     ['#fee2e2','#b91c1c'],
    ajustement: ['#fef3c7','#92400e'],
    inventaire: ['#dbeafe','#1d4ed8'],
  }
  const [bg,col] = m[t] ?? ['#f1f5f9','#6b7280']
  return `<span style="background:${bg};color:${col};border-radius:999px;padding:2px 10px;font-size:.65rem;font-weight:700;">${t.toUpperCase()}</span>`
}

function kpiCard(icon: string, col: string, val: string|number, lbl: string, sub='') {
  return `<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-top:3px solid ${col};">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div style="width:36px;height:36px;border-radius:10px;background:${col}18;display:flex;align-items:center;justify-content:center;"><i class="fas ${icon}" style="color:${col};font-size:.9rem;"></i></div>
      <div style="font-size:1.5rem;font-weight:900;color:#111827;">${val}</div>
    </div>
    <div style="font-size:.75rem;font-weight:700;color:#374151;">${lbl}</div>
    ${sub ? `<div style="font-size:.68rem;color:#9ca3af;margin-top:2px;">${sub}</div>` : ''}
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PANEL 1 – STOCK EN TEMPS RÉEL
// ══════════════════════════════════════════════════════════════

function panelTempsReel(arts: ArticleStock[]) {
  const byStat: Record<StatutStock, number> = { critique:0, bas:0, moyen:0, haut:0 }
  arts.forEach(a => byStat[statut(a)]++)

  const cats = [...new Set(arts.map(a=>a.categorie))].sort()

  return `
  <div id="stk-panel-rt" style="display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-warehouse" style="color:${GRN};"></i>Stock en temps reel
        <span style="background:${GRN}20;color:${GRN_D};border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${arts.length} references</span>
      </div>
      <button onclick="stkNouvelleReference()" title="Une nouvelle référence entre par la file « À ranger » : Gestion du stock › Entrée stock" style="padding:8px 18px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Ajouter article</button>
    </div>

    <!-- Compteurs statut -->
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
      ${([['critique','#ef4444','fa-times-circle'],['bas','#f97316','fa-exclamation-circle'],['moyen','#f59e0b','fa-minus-circle'],['haut','#22c55e','fa-check-circle']] as const).map(([s,c,ic]) => `
      <div style="background:white;border-radius:10px;padding:10px 16px;display:flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(0,0,0,.07);border-left:3px solid ${c};cursor:pointer;" onclick="stkFiltreStatut('${s}')">
        <i class="fas ${ic}" style="color:${c};"></i>
        <div><div style="font-size:1.2rem;font-weight:900;color:#111827;">${byStat[s as StatutStock]}</div><div style="font-size:.65rem;color:#6b7280;font-weight:700;text-transform:uppercase;">${s}</div></div>
      </div>`).join('')}
      <div style="background:white;border-radius:10px;padding:10px 16px;display:flex;align-items:center;gap:8px;box-shadow:0 1px 3px rgba(0,0,0,.07);cursor:pointer;" onclick="stkFiltreStatut('all')">
        <i class="fas fa-list" style="color:#6b7280;"></i>
        <div><div style="font-size:1.2rem;font-weight:900;color:#111827;">${arts.length}</div><div style="font-size:.65rem;color:#6b7280;font-weight:700;text-transform:uppercase;">TOUT</div></div>
      </div>
    </div>

    <!-- Filtres -->
    <div style="background:white;border-radius:12px;padding:14px 16px;box-shadow:0 1px 3px rgba(0,0,0,.07);margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
      <div style="display:flex;gap:4px;background:#f1f5f9;border-radius:8px;padding:3px;">
        ${(['all','Seem','Semrac','both'] as const).map((a,i) => `<button onclick="stkFiltreActivite('${a}')" id="stk-act-${a}" class="stk-filter-btn${i===0?' stk-f-active':''}">${a==='all'?'Tout':a==='both'?'Les deux':a}</button>`).join('')}
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        <button onclick="stkFiltreCategorie('all')" id="stk-cat-all" class="stk-cat-btn stk-cat-active">Tout</button>
        ${cats.map(c => `<button onclick="stkFiltreCategorie('${c}')" id="stk-cat-${c}" class="stk-cat-btn">${escX(catLabel(c))}</button>`).join('')}
      </div>
      <label style="display:inline-flex;align-items:center;gap:6px;font-size:.76rem;font-weight:700;color:#374151;cursor:pointer;margin-left:auto;" title="Mémorisé sur ce poste">
        <input type="checkbox" class="stk-vides-cb" checked onchange="stkToggleVides(this.checked)" style="width:16px;height:16px;accent-color:${GRN_D};cursor:pointer;"/>Masquer les produits vides
      </label>
      <span class="stk-vides-info" style="font-size:.68rem;color:#94a3b8;"></span>
      <input type="text" placeholder="Rechercher article, ref…" oninput="stkSearch(this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;min-width:220px;"/>
    </div>

    <!-- Legende -->
    <div style="display:flex;gap:16px;font-size:.65rem;color:#6b7280;margin-bottom:10px;align-items:center;flex-wrap:wrap;">
      <span style="font-weight:700;">Legende jauge :</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:#ef4444;border-radius:2px;vertical-align:middle;"></span> Critique (&lt;seuil mini)</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:#f97316;border-radius:2px;vertical-align:middle;"></span> Bas (&lt;point de commande)</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:#f59e0b;border-radius:2px;vertical-align:middle;"></span> Moyen (&lt;75% max)</span>
      <span><span style="display:inline-block;width:10px;height:10px;background:#22c55e;border-radius:2px;vertical-align:middle;"></span> Haut (≥75% max)</span>
      <span style="color:#94a3b8;">| Marqueurs : seuil mini · point de commande</span>
    </div>

    <!-- Tableau -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;" id="stk-tbl-rt">
          <thead><tr style="background:#fafafa;border-bottom:2px solid #f1f5f9;">
            <th style="text-align:left;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;">Article / Ref</th>
            <th style="text-align:left;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;">Activite</th>
            <th style="text-align:left;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;">Categorie</th>
            <th style="padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;min-width:200px;">Niveau de stock</th>
            <th style="text-align:center;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;white-space:nowrap;">Couverture</th>
            <th style="text-align:center;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;white-space:nowrap;" title="Coefficient de rotation annuel = sorties annualisées / stock moyen (calculé dynamiquement depuis les mouvements)">Rotation</th>
            <th style="text-align:left;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;">Fournisseur</th>
            <th style="text-align:center;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;">Statut</th>
            <th style="text-align:center;padding:9px 12px;font-size:.68rem;font-weight:700;color:#64748b;border-bottom:2px solid #f1f5f9;text-transform:uppercase;">Actions</th>
          </tr></thead>
          <tbody id="stk-tbody">
            ${arts.map(a => {
              const s = statut(a)
              const cov = couvertureJours(a)
              return `
            <tr data-statut="${s}" data-activite="${escX(a.activite)}" data-categorie="${escX(a.categorie)}" data-art="1" data-qte="${Number(a.quantite) || 0}"
                style="border-bottom:1px solid #f9fafb;${s==='critique'?'background:#fff5f5;':''}"
                onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='${s==='critique'?'#fff5f5':''}'">
              <td style="padding:8px 12px;vertical-align:middle;">
                <div style="font-weight:700;font-size:.8rem;color:#111827;">${escX(a.nom)}</div>
                <div style="font-size:.65rem;font-family:monospace;color:#9ca3af;">${a.reference != null ? escX(a.reference) : '—'}</div>
                ${a.emplacement ? `<div style="font-size:.64rem;color:#0f766e;font-weight:700;"><i class="fas fa-location-dot" style="margin-right:3px;"></i>${escX(a.emplacement)}</div>` : ''}
              </td>
              <td style="padding:8px 12px;vertical-align:middle;">${activiteBadge(a.activite)}</td>
              <td style="padding:8px 12px;vertical-align:middle;font-size:.72rem;color:#6b7280;">${escX(catLabel(a.categorie))}</td>
              <td style="padding:8px 12px;vertical-align:middle;">${gaugeBar(a)}</td>
              <td style="padding:8px 12px;vertical-align:middle;text-align:center;">
                ${cov !== null
                  ? `<div style="font-size:.82rem;font-weight:800;color:${cov<7?'#b91c1c':cov<14?'#92400e':cov<30?'#374151':'#15803d'};">${cov}j</div>
                     <div style="font-size:.62rem;color:#9ca3af;">couverture</div>`
                  : '<span style="color:#d1d5db;font-size:.75rem;">N/A</span>'}
              </td>
              <td style="padding:8px 12px;vertical-align:middle;text-align:center;">
                ${(a as any).rotation != null
                  ? `<div style="font-size:.82rem;font-weight:800;color:#7c3aed;">${(a as any).rotation.toFixed(1)} <span style="font-size:.62rem;font-weight:600;">×/an</span></div>${(a as any).rotationJours != null ? `<div style="font-size:.62rem;color:#9ca3af;">${(a as any).rotationJours} j de stock</div>` : ''}`
                  : '<span style="color:#d1d5db;font-size:.75rem;">—</span>'}
              </td>
              <td style="padding:8px 12px;vertical-align:middle;font-size:.75rem;color:#6b7280;">${a.fournisseur != null ? escX(a.fournisseur) : '—'}</td>
              <td style="padding:8px 12px;vertical-align:middle;text-align:center;">${statutBadge(s)}</td>
              <td style="padding:8px 12px;vertical-align:middle;text-align:center;">
                <div style="display:flex;gap:4px;justify-content:center;">
                  <button data-act="entree-rapide" data-id="${escX(a.id)}" title="Entrée stock (ligne à ranger)" style="padding:5px 8px;background:#dcfce7;color:#15803d;border:none;border-radius:6px;font-size:.68rem;cursor:pointer;font-weight:700;"><i class="fas fa-arrow-down"></i></button>
                  <button data-act="sortie-rapide" data-id="${escX(a.id)}" title="Sortie stock" style="padding:5px 8px;background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;font-size:.68rem;cursor:pointer;font-weight:700;"><i class="fas fa-arrow-up"></i></button>
                  ${(s==='critique'||s==='bas') ? `<button onclick="stkCreerDA('${escX(a.id)}')" title="Creer DA" style="padding:5px 8px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:6px;font-size:.68rem;cursor:pointer;font-weight:700;"><i class="fas fa-shopping-cart"></i></button>` : ''}
                </div>
              </td>
            </tr>`}).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PANEL 2 – GESTION DU STOCK (supply chain expert)
// ══════════════════════════════════════════════════════════════

function panelGestion(arts: ArticleStock[], mvts: MouvementStock[], produits: any[] = [], mes: Mes = normMes(null)) {
  const recentMvts = mvts.slice(0, 8)
  const ecrit = mes.peutEcrire
  const typesActifs = mes.types.filter(t => t.actif !== false)
  const zonesActives = (type: string) => mes.zones.filter(z => str(z.type_objet) === type && z.actif !== false)
  const inputCss = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;box-sizing:border-box;'
  const lblCss = 'font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;'
  const artsTries = [...arts].sort((a, b) => str(a.nom).localeCompare(str(b.nom), 'fr'))
  const artOptions = arts.map(a => `${a.nom} (${a.quantite} ${a.unite})`).join('|')
  const artIds     = arts.map(a => a.nom).join('|')

  // Catalogue fournisseurs groupé par catégorie, avec le niveau de stock temps réel (match par réf).
  // Lot H1 (17/09/2026) : la source est la table `produits_fournisseurs` (une ligne par couple
  // fournisseur + référence), plus l'ancien jsonb `fournisseurs.catalogue` — vide partout (sonde en
  // lecture du 17/09/2026 : 0 item, cloud ET Docker) et remplacé par « Références fournies » de la
  // fiche fournisseur. Lecture volontairement tolérante : `qte_paquet` peut manquer (cloud sans
  // cloud-13) sans que rien ne casse, la colonne n'est jamais nommée dans une projection.
  const stockByRef: Record<string, ArticleStock> = {}
  arts.forEach(a => { if (a.reference) stockByRef[String(a.reference).toLowerCase().trim()] = a })
  const catByCat: Record<string, any[]> = {}
  ;(produits || []).forEach((p: any) => {
    if (!p || (!p.reference && !p.designation)) return
    const cat = String(p.categorie || 'Autres')
    const st = stockByRef[String(p.reference || '').toLowerCase().trim()]
    ;(catByCat[cat] = catByCat[cat] || []).push({
      ref: p.reference || '', designation: p.designation || '',
      prix: p.prix != null && p.prix !== '' ? Number(p.prix) : null,
      unite: p.unite || (st ? st.unite : ''), fournisseur: p.fournisseur_nom || '',
      stock: st ? st.quantite : null,
    })
  })
  Object.keys(catByCat).forEach(k => catByCat[k].sort((a: any, b: any) => String(a.ref).localeCompare(String(b.ref), 'fr')))
  const catKeys = Object.keys(catByCat).sort()
  const catLbl: Record<string, string> = { matiere: 'Matière', matiere_premiere: 'Matière', accessoire: 'Accessoires', outillage: 'Outils', chimique: 'Chimique', consommable: 'Consommable', autre: 'Autres' }

  return `
  <div id="stk-panel-gestion" style="display:none;">
    <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;margin-bottom:16px;">
      <i class="fas fa-sliders-h" style="color:${GRN};"></i>Gestion du stock
    </div>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 16px;margin-bottom:20px;font-size:.8rem;color:#15803d;display:flex;align-items:center;gap:10px;">
      <i class="fas fa-info-circle"></i>
      <span>Chaque mouvement est tracable : operateur, reference commande/lot, date. Les seuils pilotent les alertes et suggestions de reapprovisionnement.</span>
    </div>

    <!-- Sub-tabs gestion (segments à icônes colorées) -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
      ${[['entree','Entrée stock','fa-arrow-down-to-bracket','#10b981','#059669'],['sortie','Sortie stock','fa-arrow-up-from-bracket','#f43f5e','#e11d48'],['catalogue','Niveaux d’approvisionnement','fa-sliders','#8b5cf6','#7c3aed']].map(([id,lbl,ic,c1,c2],i) => `
      <button onclick="stkSwitchGestion('${id}')" id="stk-gest-${id}" class="stk-gtab${i===0?' exp-sub-active':''}" style="--g1:${c1};--g2:${c2};">
        <span class="stk-gtab-ic"><i class="fas ${ic}"></i></span><span>${lbl}</span>
      </button>`).join('')}
    </div>
    <style>
      .stk-gtab{display:inline-flex;align-items:center;gap:9px;padding:8px 16px 8px 8px;border:1.5px solid #e2e8f0;background:white;border-radius:12px;cursor:pointer;font-size:.82rem;font-weight:700;color:#64748b;transition:all .15s;box-shadow:0 1px 2px rgba(0,0,0,.04);}
      .stk-gtab .stk-gtab-ic{width:30px;height:30px;border-radius:9px;background:#f1f5f9;color:#94a3b8;display:flex;align-items:center;justify-content:center;font-size:.85rem;transition:all .15s;flex-shrink:0;}
      .stk-gtab:hover{border-color:#cbd5e1;color:#334155;}
      .stk-gtab.exp-sub-active{border-color:var(--g2);color:#1e293b;background:#fff;box-shadow:0 3px 10px color-mix(in srgb, var(--g1) 22%, transparent);}
      .stk-gtab.exp-sub-active .stk-gtab-ic{background:linear-gradient(135deg,var(--g1),var(--g2));color:white;box-shadow:0 2px 6px color-mix(in srgb, var(--g1) 40%, transparent);}
    </style>

    <!-- ENTREE STOCK -->
    <div id="stk-gest-panel-entree">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:24px;">
          <div style="font-size:.85rem;font-weight:800;color:#111827;margin-bottom:8px;display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-down" style="color:${GRN};"></i>Entrée manuelle</div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px 12px;margin-bottom:14px;font-size:.74rem;color:#15803d;"><i class="fas fa-dolly" style="margin-right:5px;"></i>L’entrée ne crédite pas le stock tout de suite : elle rejoint la liste <strong>Rangement › À ranger</strong>, où le type d’objet et l’emplacement sont confirmés.</div>
          <div style="${lblCss}">Référence * <span style="text-transform:none;font-weight:600;color:#9ca3af;">(existante ou nouvelle)</span></div>
          <input id="ent_ref" list="stk_refs" type="text" placeholder="Référence de stock" autocomplete="off" style="${inputCss}margin-bottom:12px;"/>
          <datalist id="stk_refs">${artsTries.filter(a => a.reference).map(a => `<option value="${escX(a.reference)}">${escX(a.nom)}</option>`).join('')}</datalist>
          <div style="${lblCss}">Désignation</div>
          <input id="ent_des" type="text" placeholder="Désignation (reprise pour une référence existante)" style="${inputCss}margin-bottom:12px;"/>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">
            <div><div style="${lblCss}">Quantité *</div><input id="ent_qte" type="number" step="any" min="0" placeholder="0" style="${inputCss}"/></div>
            <div><div style="${lblCss}">Unité</div><input id="ent_unite" type="text" placeholder="pce, kg, m…" style="${inputCss}"/></div>
            <div><div style="${lblCss}">Type d’objet</div><select id="ent_type" style="${inputCss}"><option value="">— à choisir au rangement —</option>${typesActifs.map(t => `<option value="${escX(t.code)}">${escX(t.libelle)}</option>`).join('')}</select></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px;margin-bottom:16px;">
            <div><div style="${lblCss}">Affaire</div><input id="ent_aff" type="text" placeholder="facultatif" style="${inputCss}"/></div>
            <div><div style="${lblCss}">Motif *</div><input id="ent_motif" type="text" placeholder="Retour atelier, régularisation, livraison sans BC…" style="${inputCss}"/></div>
          </div>
          <button id="ent_ok" data-act="entree-valider"${offSi(ecrit)} style="width:100%;padding:10px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:10px;font-weight:700;font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><i class="fas fa-dolly"></i>Ajouter à la liste « À ranger »</button>
        </div>
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:24px;">
          <div style="font-size:.85rem;font-weight:800;color:#111827;margin-bottom:16px;display:flex;align-items:center;gap:6px;"><i class="fas fa-history" style="color:#6b7280;"></i>Dernieres entrees</div>
          ${recentMvts.filter(m=>m.type==='entree').slice(0,5).map(m=>`
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f8fafc;">
            <div style="width:8px;height:8px;border-radius:50%;background:${GRN};flex-shrink:0;"></div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:.75rem;font-weight:700;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escX(m.article_nom)}</div>
              <div style="font-size:.65rem;color:#9ca3af;">${m.date_mvt} · +${m.quantite} · ${m.operateur != null ? escX(m.operateur) : ''}</div>
            </div>
            <div style="font-size:.75rem;font-weight:700;color:${GRN};">+${m.quantite}</div>
          </div>`).join('') || '<div style="color:#9ca3af;font-size:.8rem;text-align:center;padding:20px;">Aucune entree recente</div>'}
        </div>
      </div>
    </div>

    <!-- SORTIE STOCK -->
    <div id="stk-gest-panel-sortie" style="display:none;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:24px;">
          <div style="font-size:.85rem;font-weight:800;color:#111827;margin-bottom:16px;display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-up" style="color:#ef4444;"></i>Saisir une sortie</div>
          <div style="${lblCss}">Article *</div>
          <select id="sor_art" style="${inputCss}margin-bottom:12px;">
            <option value="">-- Choisir article --</option>
            ${artsTries.map(a=>`<option value="${escX(a.id)}"${a.quantite > 0 ? '' : ' disabled'}>${escX(a.nom)}${a.reference ? ' · ' + escX(a.reference) : ''} (stock : ${fmtQte(a.quantite)} ${escX(a.unite)})</option>`).join('')}
          </select>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div><div style="${lblCss}">Quantité sortie *</div><input id="sor_qte" type="number" step="any" min="0" placeholder="0" style="${inputCss}"/></div>
            <div><div style="${lblCss}">Motif *</div>
              <select id="sor_motif_type" style="${inputCss}"><option>Consommation production</option><option>Rebut / casse</option><option>Retour fournisseur</option><option>Transfert inter-atelier</option><option>Autre</option></select></div>
          </div>
          <div style="${lblCss}">Précision du motif</div>
          <input id="sor_motif_txt" type="text" placeholder="obligatoire pour « Autre »" style="${inputCss}margin-bottom:12px;"/>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
            <div><div style="${lblCss}">BDT</div><input id="sor_bdt" type="text" placeholder="facultatif" style="${inputCss}"/></div>
            <div><div style="${lblCss}">Affaire</div><input id="sor_aff" type="text" placeholder="facultatif" style="${inputCss}"/></div>
          </div>
          <button id="sor_ok" data-act="sortie-valider"${offSi(ecrit)} style="width:100%;padding:10px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:10px;font-weight:700;font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><i class="fas fa-check"></i>Valider la sortie</button>
        </div>
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:24px;">
          <div style="font-size:.85rem;font-weight:800;color:#111827;margin-bottom:16px;display:flex;align-items:center;gap:6px;"><i class="fas fa-history" style="color:#6b7280;"></i>Dernieres sorties</div>
          ${recentMvts.filter(m=>m.type==='sortie').slice(0,6).map(m=>`
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f8fafc;">
            <div style="width:8px;height:8px;border-radius:50%;background:#ef4444;flex-shrink:0;"></div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:.75rem;font-weight:700;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escX(m.article_nom)}</div>
              <div style="font-size:.65rem;color:#9ca3af;">${m.date_mvt} · ${m.motif != null ? escX(m.motif) : ''}</div>
            </div>
            <div style="font-size:.75rem;font-weight:700;color:#ef4444;">-${Math.abs(m.quantite)}</div>
          </div>`).join('') || '<div style="color:#9ca3af;font-size:.8rem;text-align:center;padding:20px;">Aucune sortie recente</div>'}
        </div>
      </div>
    </div>

    <!-- NIVEAUX D'APPROVISIONNEMENT (ex « Catalogue & seuils ») · l'ajustement d'inventaire est dans Rangement -->

    <div id="stk-gest-panel-catalogue" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
        <div style="font-size:.85rem;font-weight:800;color:#111827;">Niveaux d’approvisionnement · seuils, type d’objet et emplacement fixe de chaque référence</div>
        <div style="display:flex;align-items:center;gap:12px;">
          <label style="display:inline-flex;align-items:center;gap:6px;font-size:.76rem;font-weight:700;color:#374151;cursor:pointer;" title="Mémorisé sur ce poste">
            <input type="checkbox" class="stk-vides-cb" checked onchange="stkToggleVides(this.checked)" style="width:16px;height:16px;accent-color:${GRN_D};cursor:pointer;"/>Masquer les produits vides
          </label>
          <span class="stk-vides-info-niv" style="font-size:.68rem;color:#94a3b8;"></span>
          <input type="text" placeholder="Rechercher…" oninput="stkNivSearch(this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.78rem;background:#f8fafc;outline:none;width:200px;"/>
          <button onclick="stkNouvelleReference()" style="padding:7px 16px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus"></i> Nouvel article</button>
        </div>
      </div>
      <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:9px 14px;margin-bottom:12px;font-size:.74rem;color:#3730a3;"><i class="fas fa-location-dot" style="margin-right:6px;"></i>L’<strong>emplacement</strong> d’une référence est fixé à sa première mise en stock et reste le même ensuite. Le changer ici demande une confirmation (motif facultatif) et laisse une trace consultable (<i class="fas fa-clock-rotate-left"></i>).</div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:.76rem;">
            <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
              ${['Article','Activité','Stock','Type d’objet','Emplacement','Seuil mini','Pt commande','Qté cmd','Réappro auto','Fournisseur','Action'].map((h,i)=>`<th style="text-align:${i===0||i===9?'left':'center'};padding:9px 10px;color:#64748b;font-weight:700;text-transform:uppercase;font-size:.65rem;white-space:nowrap;">${h}</th>`).join('')}
            </tr></thead>
            <tbody id="stk-niv-tbody">
              ${arts.length ? arts.map(a=>{
                const ta = str(a.type_objet)
                const empA = str(a.emplacement)
                const zs = ta ? zonesActives(ta) : []
                const empDansListe = !!empA && zs.some(z => str(z.zone) === empA)
                const typeOpts = `<option value="">— type —</option>` + mes.types.filter(t => t.actif !== false || str(t.code) === ta).map(t => `<option value="${escX(t.code)}"${str(t.code) === ta ? ' selected' : ''}>${escX(t.libelle)}</option>`).join('')
                const empOpts = `<option value="">— aucun —</option>` + (empA && !empDansListe ? `<option value="${escX(empA)}" selected>${escX(empA)} (hors liste)</option>` : '') + zs.map(z => `<option value="${escX(z.zone)}"${str(z.zone) === empA ? ' selected' : ''}>${escX(z.zone)}</option>`).join('')
                return `
              <tr class="seuil-row" data-id="${escX(a.id)}" data-qte="${Number(a.quantite) || 0}" data-type="${escX(ta)}" data-emp="${escX(empA)}" data-ref="${escX(a.reference || '')}" data-s="${escX((str(a.nom) + ' ' + str(a.reference) + ' ' + empA).toLowerCase())}" style="border-bottom:1px solid #f9fafb;">
                <td style="padding:7px 10px;font-weight:700;color:#111827;">${escX(a.nom)}<div style="font-size:.62rem;font-family:monospace;color:#9ca3af;">${a.reference != null ? escX(a.reference) : ''}</div></td>
                <td style="padding:7px 10px;text-align:center;">${activiteBadge(a.activite)}</td>
                <td style="padding:7px 10px;text-align:center;font-weight:800;color:#111827;">${fmtQte(a.quantite)}<span style="font-size:.6rem;color:#9ca3af;"> ${escX(a.unite)}</span></td>
                <td style="padding:7px 10px;text-align:center;"><select class="sf-type" data-act-change="niv-type"${mes.tableAbsente ? ' disabled title="Jouez cloud-11"' : offSi(ecrit)} style="border:1.5px solid #e2e8f0;border-radius:6px;padding:3px 4px;font-size:.72rem;max-width:140px;">${typeOpts}</select></td>
                <td style="padding:7px 10px;text-align:center;white-space:nowrap;"><select class="sf-emp" data-act-change="niv-emp"${mes.tableAbsente ? ' disabled title="Jouez cloud-11"' : offSi(ecrit)} style="border:1.5px solid #99f6e4;border-radius:6px;padding:3px 4px;font-size:.72rem;max-width:150px;">${empOpts}</select> <button data-act="niv-hist" data-id="${escX(a.id)}" title="Historique des emplacements" style="padding:3px 6px;background:#f1f5f9;color:#475569;border:none;border-radius:6px;font-size:.68rem;cursor:pointer;"><i class="fas fa-clock-rotate-left"></i></button></td>
                <td style="padding:7px 10px;text-align:center;"><input class="sf-mini" type="number" step="0.01" value="${a.seuil_mini}" style="width:60px;border:1.5px solid #e2e8f0;border-radius:6px;padding:4px;font-size:.74rem;text-align:center;outline:none;"/></td>
                <td style="padding:7px 10px;text-align:center;"><input class="sf-pc" type="number" step="0.01" value="${a.point_commande}" style="width:60px;border:1.5px solid #fed7aa;border-radius:6px;padding:4px;font-size:.74rem;text-align:center;outline:none;"/></td>
                <td style="padding:7px 10px;text-align:center;"><input class="sf-qc" type="number" step="0.01" value="${a.qte_commande ?? ''}" style="width:60px;border:1.5px solid #e2e8f0;border-radius:6px;padding:4px;font-size:.74rem;text-align:center;outline:none;"/></td>
                <td style="padding:7px 10px;text-align:center;"><input class="sf-auto" type="checkbox" ${(a as any).auto_reappro?'checked':''} title="DA générée automatiquement quand le stock passe sous le point de commande" style="width:17px;height:17px;accent-color:${GRN_D};cursor:pointer;"/></td>
                <td style="padding:7px 10px;color:#6b7280;font-size:.72rem;">${a.fournisseur != null ? escX(a.fournisseur) : '—'}</td>
                <td style="padding:7px 10px;text-align:center;"><button onclick="stkSaveSeuils('${escX(a.id)}',this)"${offSi(ecrit)} title="Enregistrer les seuils" style="padding:5px 11px;background:${GRN}1a;color:${GRN_D};border:1px solid ${GRN}55;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-save"></i></button></td>
              </tr>`}).join('') : `<tr><td colspan="11" style="padding:36px;text-align:center;color:#9ca3af;font-size:.82rem;">Aucun article en stock — les seuils se configureront ici une fois des références enregistrées.</td></tr>`}
            </tbody>
          </table>
        </div>
        <div style="padding:10px 16px;background:#fff7ed;border-top:1px solid #fed7aa;font-size:.72rem;color:#b45309;"><i class="fas fa-robot" style="margin-right:6px;"></i>Cochez <strong>Réappro auto</strong> pour qu'une <strong>demande d'achat soit créée automatiquement</strong> quand le stock passe sous le point de commande (uniquement pour les références cochées).</div>
      </div>

      <!-- F : catalogue de tous les fournisseurs, classé par catégorie, avec stock temps réel -->
      <div style="font-size:.85rem;font-weight:800;color:#111827;margin:24px 0 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><i class="fas fa-layer-group" style="color:#8b5cf6;"></i>Catalogue fournisseurs par catégorie<span style="font-size:.68rem;color:#9ca3af;font-weight:600;">· références fournies déclarées dans les fiches fournisseurs · stock temps réel</span></div>
      ${catKeys.length ? catKeys.map(cat => `
      <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:12px;">
        <div style="padding:10px 16px;background:#faf5ff;border-bottom:1px solid #f1f5f9;font-weight:800;color:#6b21a8;font-size:.78rem;"><i class="fas fa-tag" style="margin-right:6px;"></i>${escX(catLbl[cat]||cat)}<span style="color:#a78bda;font-weight:600;"> (${catByCat[cat].length})</span></div>
        <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.76rem;">
          <thead><tr style="background:#fafafa;">${['Réf','Désignation','Fournisseur','Prix','Stock réel'].map((h,i)=>`<th style="text-align:${i>=3?'right':'left'};padding:7px 12px;color:#64748b;font-size:.63rem;font-weight:700;text-transform:uppercase;">${h}</th>`).join('')}</tr></thead>
          <tbody>${catByCat[cat].map((it:any)=>`<tr style="border-bottom:1px solid #f9fafb;">
            <td style="padding:6px 12px;font-family:monospace;font-weight:700;color:#6b21a8;">${it.ref ? escX(it.ref) : '—'}</td>
            <td style="padding:6px 12px;color:#374151;">${it.designation ? escX(it.designation) : '—'}</td>
            <td style="padding:6px 12px;color:#6b7280;font-size:.72rem;">${it.fournisseur ? escX(it.fournisseur) : '—'}</td>
            <td style="padding:6px 12px;text-align:right;color:#374151;">${it.prix!=null?Number(it.prix).toFixed(2)+' €':'—'}</td>
            <td style="padding:6px 12px;text-align:right;font-weight:800;">${it.stock!=null?`<span style="color:#15803d;">${it.stock}</span>`:'<span style="color:#cbd5e1;font-weight:600;">non stocké</span>'}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      </div>`).join('') : `<div style="background:white;border-radius:12px;padding:28px;text-align:center;color:#9ca3af;font-size:.82rem;box-shadow:0 1px 3px rgba(0,0,0,.07);">Aucune référence fournie déclarée. Elles se saisissent dans <strong>Achats › Fournisseurs</strong> → fiche du fournisseur → bloc « <strong>Références fournies</strong> ».</div>`}
    </div>
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PANEL 0 – RANGEMENT / MISE EN STOCK (lot F, 15/09/2026)
// Premier onglet : la file « À ranger » (PV de réception, décision Qualité, excédent validé,
// entrée manuelle), l'ajustement d'inventaire, les types d'objet et leurs zones.
// ══════════════════════════════════════════════════════════════

function panelMiseEnStock(arts: ArticleStock[], mvts: MouvementStock[], mes: Mes) {
  const ecrit = mes.peutEcrire
  const inputCss = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;box-sizing:border-box;'
  const lblCss = 'font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;'
  const th = (h: string, align = 'left') => `<th style="text-align:${align};padding:9px 10px;color:#64748b;font-weight:700;text-transform:uppercase;font-size:.64rem;white-space:nowrap;">${h}</th>`
  const ORIG: Record<string, [string, string]> = { pv: ['#0284c7', 'fa-clipboard-check'], decision_qualite: ['#7c3aed', 'fa-scale-balanced'], excedent_valide: ['#d97706', 'fa-circle-plus'], entree_manuelle: ['#475569', 'fa-hand'] }
  const origineChip = (l: any) => {
    const [c, ic] = ORIG[str(l.origine)] || ['#64748b', 'fa-circle']
    return `<span style="display:inline-flex;align-items:center;gap:5px;background:${c}14;color:${c};border-radius:7px;padding:3px 8px;font-size:.68rem;font-weight:700;white-space:nowrap;"><i class="fas ${ic}"></i>${escX(libelleOrigine(l))}</span>`
  }
  const SOURCE_LBL: Record<string, string> = { stock: 'type de la référence', ligne: 'type de la ligne', stock_categorie: 'd’après la catégorie en stock', bc: 'd’après le bon de commande', catalogue: 'd’après le catalogue fournisseur', chimique: 'registre chimique', epi: 'catalogue EPI', nomenclature: 'd’après la nomenclature' }
  // Vérification lot F : une panne n'est pas une absence — file illisible ⇒ jamais « Rien à ranger » ni « 0 à ranger » ;
  // types ou zones illisibles ⇒ rangement et administration désactivés (sinon « Aucun type » poussait à recréer un type existant).
  const errFile = mes.erreurFile || (!mes.erreurTypes ? mes.erreur : null)
  const errTypes = mes.erreurTypes
  const bandeauErr = (txt: string) => `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;margin-bottom:10px;font-size:.8rem;color:#b91c1c;"><i class="fas fa-triangle-exclamation" style="margin-right:6px;"></i>${txt}</div>`
  const bandeau = mes.tableAbsente
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:.8rem;color:#b91c1c;"><i class="fas fa-database" style="margin-right:6px;"></i><strong>Mise en stock indisponible sur cette base</strong> : les tables du lot F n’existent pas encore. Jouez la migration 013 (VM : erp-docker.sh maj) ou le script <strong>cloud-11</strong> (Supabase Studio), puis rechargez. En attendant, un PV de réception conforme continue d’entrer directement en stock.</div>`
    : (errFile ? bandeauErr('<strong>File illisible</strong> : ' + escX(errFile) + '. La liste « À ranger » n’a pas pu être lue : elle n’est PAS vide — rechargez la page.') : '')
      + (errTypes ? bandeauErr('<strong>Types d’objet ou zones illisibles</strong> : ' + escX(errTypes) + '. Le rangement et l’administration des types sont désactivés — rechargez la page.') : '')
  const offTypes = errTypes ? ' disabled title="Types d’objet ou zones illisibles : rechargez la page"' : ''
  const nbARanger = errFile ? '?' : String(mes.file.length)

  const rows = mes.file.map((l: any) => {
    const typeS = str(l.type_suggere)
    const typeCell = typeS
      ? `<div style="font-weight:700;color:#374151;">${escX(lblType(mes, typeS))}</div>${str(l.type_source) && !['stock', 'ligne'].includes(str(l.type_source)) ? `<div style="font-size:.62rem;color:#94a3b8;">proposé ${escX(SOURCE_LBL[str(l.type_source)] || '')}</div>` : ''}`
      : `<span style="color:#c2410c;font-weight:700;font-size:.72rem;">à choisir</span>`
    const empCell = str(l.emplacement_fixe)
      ? `<span style="display:inline-flex;align-items:center;gap:4px;background:#ccfbf1;color:#0f766e;border-radius:6px;padding:2px 8px;font-size:.7rem;font-weight:700;" title="Emplacement fixe de la référence"><i class="fas fa-lock"></i>${escX(l.emplacement_fixe)}</span>`
      : `<span style="color:#c2410c;font-weight:700;font-size:.72rem;">à choisir</span><div style="font-size:.62rem;color:#94a3b8;">${str(l.stock_id) ? 'référence sans emplacement' : 'nouvelle référence'}</div>`
    return `<tr class="mes-row" data-id="${escX(l.id)}" style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:8px 10px;font-size:.72rem;color:#6b7280;white-space:nowrap;">${escX(fmtDateHeure(l.cree_le))}</td>
      <td style="padding:8px 10px;">${origineChip(l)}${str(l.motif) ? `<div style="font-size:.64rem;color:#64748b;margin-top:2px;">${escX(l.motif)}</div>` : ''}${str(l.cree_par) ? `<div style="font-size:.62rem;color:#94a3b8;">par ${escX(l.cree_par)}</div>` : ''}</td>
      <td style="padding:8px 10px;font-family:monospace;font-weight:700;color:#111827;">${str(l.reference) ? escX(l.reference) : '<span style="color:#c2410c;font-family:inherit;">sans référence</span>'}</td>
      <td style="padding:8px 10px;color:#374151;max-width:260px;">${escX(l.designation || '—')}</td>
      <td style="padding:8px 10px;text-align:right;font-weight:800;color:#111827;white-space:nowrap;">${fmtQte(l.quantite)} <span style="font-size:.66rem;color:#9ca3af;font-weight:600;">${escX(l.unite || '')}</span>${l.stock_actuel != null ? `<div style="font-size:.6rem;color:#94a3b8;font-weight:600;">en stock : ${fmtQte(l.stock_actuel)}</div>` : ''}</td>
      <td style="padding:8px 10px;font-size:.72rem;color:#374151;">${escX(l.num_affaire || '—')}</td>
      <td style="padding:8px 10px;font-size:.72rem;color:#374151;">${escX(l.fournisseur_nom || '—')}</td>
      <td style="padding:8px 10px;font-size:.74rem;">${typeCell}</td>
      <td style="padding:8px 10px;">${empCell}</td>
      <td style="padding:8px 10px;text-align:center;white-space:nowrap;">
        <button data-act="mes-accepter" data-id="${escX(l.id)}"${offTypes || offSi(ecrit)} style="padding:6px 12px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:8px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-dolly" style="margin-right:4px;"></i>Accepter l’entrée en stock</button>
        <button data-act="mes-annuler" data-id="${escX(l.id)}"${offSi(ecrit)} style="padding:6px 9px;background:#f1f5f9;color:#475569;border:none;border-radius:8px;font-size:.72rem;font-weight:700;cursor:pointer;" title="Annuler cette ligne (motif obligatoire)"><i class="fas fa-ban"></i></button>
      </td>
    </tr>`
  }).join('')

  const rangees = mes.rangees.map((l: any) => {
    const annule = str(l.statut) === 'annule'
    return `<tr style="border-bottom:1px solid #f8fafc;">
      <td style="padding:6px 10px;font-size:.7rem;color:#6b7280;white-space:nowrap;">${escX(fmtDateHeure(annule ? l.annule_le : l.range_le))}</td>
      <td style="padding:6px 10px;">${annule ? '<span style="background:#f1f5f9;color:#64748b;border-radius:999px;padding:2px 8px;font-size:.66rem;font-weight:700;">ANNULÉE</span>' : '<span style="background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 8px;font-size:.66rem;font-weight:700;">RANGÉE</span>'}${!annule && !str(l.mouvement_id) ? ' <span title="Rangée sans mouvement de stock rattaché : vérifiez le stock de la référence" style="color:#c2410c;"><i class="fas fa-triangle-exclamation"></i></span>' : ''}</td>
      <td style="padding:6px 10px;font-family:monospace;font-weight:700;font-size:.74rem;">${escX(l.reference || '—')}</td>
      <td style="padding:6px 10px;font-size:.72rem;color:#374151;">${escX(l.designation || '')}</td>
      <td style="padding:6px 10px;text-align:right;font-size:.74rem;font-weight:700;">${fmtQte(l.quantite)} ${escX(l.unite || '')}</td>
      <td style="padding:6px 10px;font-size:.72rem;color:#0f766e;font-weight:700;">${annule ? '' : escX(l.emplacement || '')}</td>
      <td style="padding:6px 10px;font-size:.7rem;color:#6b7280;">${escX((annule ? l.annule_par : l.range_par) || '—')}${annule && l.annule_motif ? ' · ' + escX(l.annule_motif) : ''}</td>
    </tr>`
  }).join('')

  const ajustements = mvts.filter((m: any) => str(m.type) === 'ajustement').slice(0, 12)
  const artsTries = [...arts].sort((a, b) => str(a.nom).localeCompare(str(b.nom), 'fr'))
  const nbRefsType = (code: string) => arts.filter(a => str(a.type_objet) === code).length
  const nbRefsZone = (type: string, zone: string) => arts.filter(a => str(a.emplacement).toLowerCase() === zone.toLowerCase() && (!str(a.type_objet) || str(a.type_objet) === type)).length
  const typesTries = [...mes.types].sort((a, b) => (Number(a.ordre) || 0) - (Number(b.ordre) || 0))
  const miniIn = 'border:1.5px solid #e2e8f0;border-radius:6px;padding:4px 6px;font-size:.74rem;outline:none;'

  return `
  <div id="stk-panel-mes" style="display:block;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-dolly" style="color:${GRN};"></i>Rangement / Mise en stock
        <span style="background:${mes.file.length || errFile ? '#ffedd5' : '#f1f5f9'};color:${mes.file.length || errFile ? '#c2410c' : '#64748b'};border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${nbARanger} à ranger</span>
      </div>
    </div>
    ${bandeau}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px;">
      ${[['aranger', 'À ranger', 'fa-dolly', '#10b981', '#059669'], ['ajustement', 'Ajustement de stock', 'fa-scale-balanced', '#3b82f6', '#2563eb'], ['types', 'Types & zones', 'fa-map-location-dot', '#8b5cf6', '#7c3aed']].map(([id, lbl, ic, c1, c2], i) => `
      <button onclick="stkSwitchMes('${id}')" id="stk-mes-${id}" class="stk-gtab${i === 0 ? ' exp-sub-active' : ''}" style="--g1:${c1};--g2:${c2};">
        <span class="stk-gtab-ic"><i class="fas ${ic}"></i></span><span>${lbl}</span>${id === 'aranger' && (mes.file.length || errFile) ? `<span style="background:#f97316;color:white;border-radius:999px;padding:0 7px;font-size:.66rem;font-weight:800;">${nbARanger}</span>` : ''}
      </button>`).join('')}
    </div>

    <!-- À RANGER -->
    <div id="stk-mes-panel-aranger">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:10px 16px;margin-bottom:14px;font-size:.78rem;color:#15803d;">
        <i class="fas fa-circle-info" style="margin-right:6px;"></i>Ce qui a été <strong>validé conforme</strong> au PV de réception arrive ici, référence par référence (ainsi que la part acceptée par la Qualité, les excédents validés et les entrées manuelles). Le stock n’est crédité qu’à l’<strong>acceptation</strong> : type d’objet, puis zone de rangement. Une référence qui a déjà son emplacement le garde (<i class="fas fa-lock"></i> fixe) ; une nouvelle référence doit en recevoir un.
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:.76rem;">
            <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">${th('Arrivée')}${th('Origine')}${th('Référence')}${th('Désignation')}${th('Quantité', 'right')}${th('Affaire')}${th('Fournisseur')}${th('Type d’objet')}${th('Emplacement')}${th('Action', 'center')}</tr></thead>
            <tbody id="stk-mes-tbody">${rows || `<tr><td colspan="10" style="padding:40px;text-align:center;color:#9ca3af;font-size:.82rem;"><i class="fas fa-dolly" style="font-size:1.6rem;display:block;margin-bottom:8px;opacity:.3;"></i>${mes.tableAbsente ? 'File indisponible (jouez cloud-11).' : (errFile ? '<span style="color:#b91c1c;font-weight:700;">File illisible — rechargez la page.</span>' : 'Rien à ranger pour le moment.')}</td></tr>`}</tbody>
          </table>
        </div>
      </div>
      ${rangees ? `
      <details style="margin-top:16px;background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
        <summary style="padding:10px 16px;cursor:pointer;font-size:.8rem;font-weight:800;color:#374151;"><i class="fas fa-clock-rotate-left" style="margin-right:6px;color:#64748b;"></i>Derniers rangements et annulations</summary>
        <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#fafafa;">${th('Le')}${th('État')}${th('Référence')}${th('Désignation')}${th('Quantité', 'right')}${th('Emplacement')}${th('Par')}</tr></thead>
          <tbody>${rangees}</tbody>
        </table></div>
      </details>` : ''}
    </div>

    <!-- AJUSTEMENT DE STOCK (inventaire) -->
    <div id="stk-mes-panel-ajustement" style="display:none;">
      <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;">
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:24px;">
          <div style="font-size:.85rem;font-weight:800;color:#111827;margin-bottom:12px;display:flex;align-items:center;gap:6px;"><i class="fas fa-scale-balanced" style="color:#2563eb;"></i>Ajustement / inventaire physique</div>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 12px;margin-bottom:14px;font-size:.75rem;color:#1e40af;">Saisissez la quantité <strong>réellement constatée</strong> : le mouvement d’ajustement porte l’écart (positif ou négatif) et reste dans l’historique des mouvements. Motif obligatoire.</div>
          <div style="${lblCss}">Article *</div>
          <select id="adj_art" style="${inputCss}margin-bottom:12px;">
            <option value="">-- Choisir article --</option>
            ${artsTries.map(a => `<option value="${escX(a.id)}">${escX(a.nom)}${a.reference ? ' · ' + escX(a.reference) : ''} (stock : ${fmtQte(a.quantite)} ${escX(a.unite)})</option>`).join('')}
          </select>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div><div style="${lblCss}">Quantité constatée *</div><input id="adj_qte" type="number" step="any" min="0" placeholder="Quantité réelle" style="${inputCss}"/></div>
            <div><div style="${lblCss}">Motif *</div><select id="adj_motif_type" style="${inputCss}"><option>Inventaire physique périodique</option><option>Écart constaté</option><option>Perte / détérioration</option><option>Correction d’erreur de saisie</option><option>Autre</option></select></div>
          </div>
          <div style="${lblCss}">Précision du motif</div>
          <input id="adj_motif_txt" type="text" placeholder="obligatoire pour « Autre »" style="${inputCss}margin-bottom:16px;"/>
          <button id="adj_ok" data-act="ajust-valider"${offSi(ecrit)} style="width:100%;padding:10px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:10px;font-weight:700;font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><i class="fas fa-check"></i>Valider l’ajustement</button>
        </div>
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:24px;">
          <div style="font-size:.85rem;font-weight:800;color:#111827;margin-bottom:16px;">Derniers ajustements</div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:.75rem;">
              <thead><tr style="background:#f8fafc;">${th('Date')}${th('Article')}${th('Écart', 'center')}${th('Avant → après', 'center')}${th('Par')}</tr></thead>
              <tbody>${ajustements.map((m: any) => `
                <tr style="border-bottom:1px solid #f8fafc;">
                  <td style="padding:5px 8px;color:#6b7280;white-space:nowrap;">${escX(m.date_mvt || '')}</td>
                  <td style="padding:5px 8px;font-weight:600;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escX(m.motif || '')}">${escX(m.article_nom || '')}</td>
                  <td style="padding:5px 8px;text-align:center;font-weight:800;color:${Number(m.quantite) < 0 ? '#b91c1c' : GRN_D};">${Number(m.quantite) > 0 ? '+' : ''}${fmtQte(m.quantite)}</td>
                  <td style="padding:5px 8px;text-align:center;color:#6b7280;">${m.quantite_avant != null ? fmtQte(m.quantite_avant) : '—'} → ${m.quantite_apres != null ? fmtQte(m.quantite_apres) : '—'}</td>
                  <td style="padding:5px 8px;color:#6b7280;font-size:.68rem;">${escX(m.operateur || '—')}</td>
                </tr>`).join('') || `<tr><td colspan="5" style="padding:20px;text-align:center;color:#9ca3af;">Aucun ajustement récent</td></tr>`}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TYPES & ZONES -->
    <div id="stk-mes-panel-types" style="display:none;">
      <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.78rem;color:#6b21a8;"><i class="fas fa-circle-info" style="margin-right:6px;"></i>Chaque <strong>type d’objet</strong> a sa liste de <strong>zones de stockage</strong> : c’est elle que propose la fenêtre de rangement. Rien ne se supprime : un type ou une zone se <strong>désactive</strong>. Une zone qui est l’emplacement de références ne se renomme pas.</div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:20px;align-items:start;">
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
          <div style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:800;font-size:.84rem;color:#111827;"><i class="fas fa-tags" style="margin-right:6px;color:#7c3aed;"></i>Types d’objet</div>
          <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.76rem;">
            <thead><tr style="background:#fafafa;">${th('Libellé')}${th('Ordre', 'center')}${th('Actif', 'center')}${th('Réf.', 'center')}${th('', 'center')}</tr></thead>
            <tbody>${typesTries.map((t: any) => `
              <tr class="ty-row" data-code="${escX(t.code)}" style="border-bottom:1px solid #f8fafc;${t.actif === false ? 'opacity:.6;' : ''}">
                <td style="padding:6px 10px;"><input class="ty-lib" type="text" value="${escX(t.libelle)}" style="${miniIn}width:100%;box-sizing:border-box;"/><div style="font-size:.6rem;color:#94a3b8;font-family:monospace;">${escX(t.code)}</div></td>
                <td style="padding:6px 10px;text-align:center;"><input class="ty-ord" type="number" step="1" value="${Number(t.ordre) || 0}" style="${miniIn}width:56px;text-align:center;"/></td>
                <td style="padding:6px 10px;text-align:center;"><input class="ty-act" type="checkbox"${t.actif === false ? '' : ' checked'} style="width:16px;height:16px;accent-color:#7c3aed;"/></td>
                <td style="padding:6px 10px;text-align:center;color:#6b7280;">${nbRefsType(str(t.code))}</td>
                <td style="padding:6px 10px;text-align:center;"><button data-act="type-save" data-code="${escX(t.code)}"${offSi(ecrit)} style="padding:4px 9px;background:#f3e8ff;color:#6b21a8;border:1px solid #d8b4fe;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-save"></i></button></td>
              </tr>`).join('') || `<tr><td colspan="5" style="padding:20px;text-align:center;color:#9ca3af;">${mes.tableAbsente ? 'Indisponible (jouez cloud-11).' : (errTypes ? '<span style="color:#b91c1c;font-weight:700;">Lecture des types impossible — rechargez la page.</span>' : 'Aucun type d’objet.')}</td></tr>`}</tbody>
          </table></div>
          <div style="padding:12px 16px;border-top:1px solid #f1f5f9;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <input id="ty_new_lib" type="text" placeholder="Nouveau type (ex. Emballage)" style="${miniIn}flex:1;min-width:140px;"/>
            <input id="ty_new_ord" type="number" step="1" placeholder="Ordre" style="${miniIn}width:70px;"/>
            <button data-act="type-add"${mes.tableAbsente ? ' disabled' : (offTypes || offSi(ecrit))} style="padding:6px 12px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;border-radius:8px;font-size:.74rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus"></i> Ajouter le type</button>
          </div>
        </div>
        <div>
          ${typesTries.map((t: any) => {
            const zs = mes.zones.filter((z: any) => str(z.type_objet) === str(t.code)).sort((a: any, b: any) => (Number(a.ordre) || 0) - (Number(b.ordre) || 0))
            return `
          <div style="background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:12px;${t.actif === false ? 'opacity:.65;' : ''}">
            <div style="padding:9px 14px;background:#f8fafc;border-bottom:1px solid #f1f5f9;font-weight:800;color:#0f766e;font-size:.78rem;display:flex;align-items:center;gap:8px;"><i class="fas fa-location-dot"></i>${escX(t.libelle)}<span style="color:#94a3b8;font-weight:600;">(${zs.filter((z: any) => z.actif !== false).length} zone(s) active(s))</span>${t.actif === false ? '<span style="background:#f1f5f9;color:#64748b;border-radius:999px;padding:0 8px;font-size:.62rem;">type désactivé</span>' : ''}</div>
            ${zs.length ? `<table style="width:100%;border-collapse:collapse;font-size:.74rem;"><tbody>${zs.map((z: any) => `
              <tr class="zo-row" data-id="${escX(z.id)}" style="border-bottom:1px solid #f8fafc;${z.actif === false ? 'opacity:.6;' : ''}">
                <td style="padding:5px 10px;"><input class="zo-nom" type="text" value="${escX(z.zone)}" maxlength="80" style="${miniIn}width:100%;box-sizing:border-box;"/></td>
                <td style="padding:5px 10px;width:70px;"><input class="zo-ord" type="number" step="1" value="${Number(z.ordre) || 0}" style="${miniIn}width:56px;text-align:center;"/></td>
                <td style="padding:5px 10px;width:70px;text-align:center;"><label style="font-size:.66rem;color:#64748b;display:inline-flex;align-items:center;gap:4px;"><input class="zo-act" type="checkbox"${z.actif === false ? '' : ' checked'} style="accent-color:#0f766e;"/>active</label></td>
                <td style="padding:5px 10px;width:80px;text-align:center;color:#6b7280;font-size:.68rem;" title="Références dont c’est l’emplacement">${nbRefsZone(str(t.code), str(z.zone))} réf.</td>
                <td style="padding:5px 10px;width:50px;text-align:center;"><button data-act="zone-save" data-id="${escX(z.id)}"${offSi(ecrit)} style="padding:4px 9px;background:#ccfbf1;color:#0f766e;border:1px solid #99f6e4;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-save"></i></button></td>
              </tr>`).join('')}</tbody></table>` : `<div style="padding:10px 14px;font-size:.74rem;color:#c2410c;"><i class="fas fa-triangle-exclamation" style="margin-right:5px;"></i>Aucune zone : la première mise en stock d’une référence de ce type demandera d’en créer une.</div>`}
            <div style="padding:8px 14px;display:flex;gap:8px;align-items:center;border-top:1px solid #f8fafc;">
              <input class="zo-new" data-type="${escX(t.code)}" type="text" maxlength="80" placeholder="Nouvelle zone pour « ${escX(t.libelle)} »" style="${miniIn}flex:1;"/>
              <button data-act="zone-add" data-type="${escX(t.code)}"${t.actif === false ? ' disabled title="Type désactivé"' : (offTypes || offSi(ecrit))} style="padding:5px 11px;background:linear-gradient(135deg,#14b8a6,#0f766e);color:white;border:none;border-radius:8px;font-size:.72rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus"></i> Ajouter</button>
            </div>
          </div>`}).join('')}
        </div>
      </div>
    </div>
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PANEL 3 – ALERTES & RÉAPPROVISIONNEMENT
// ══════════════════════════════════════════════════════════════

function panelAlertes(arts: ArticleStock[]) {
  const critiques = arts.filter(a => statut(a) === 'critique')
  const bas       = arts.filter(a => statut(a) === 'bas')
  const valeurCom = [...critiques, ...bas].reduce((s, a) => s + (a.qte_commande ?? 0) * (a.prix_unitaire ?? 0), 0)
  const urgentLiv = critiques.filter(a => (a.delai_fournisseur ?? 7) <= 3)

  function alerteRow(a: ArticleStock, priorite: 'critique'|'bas') {
    const gap  = a.point_commande - a.quantite
    const cov  = couvertureJours(a)
    const col  = priorite === 'critique' ? '#ef4444' : '#f97316'
    const qCmd = a.qte_commande ?? Math.round((a.seuil_maxi - a.quantite) * 0.8)
    const montant = qCmd * (a.prix_unitaire ?? 0)
    return `
    <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#fafafa'" onmouseleave="this.style.background=''">
      <td style="padding:9px 12px;vertical-align:middle;">
        <div style="font-weight:700;color:#111827;font-size:.8rem;">${escX(a.nom)}</div>
        <div style="font-size:.65rem;font-family:monospace;color:#9ca3af;">${a.reference != null ? escX(a.reference) : ''}</div>
      </td>
      <td style="padding:9px 12px;text-align:center;vertical-align:middle;">${activiteBadge(a.activite)}</td>
      <td style="padding:9px 12px;text-align:center;vertical-align:middle;">
        <div style="font-size:1.1rem;font-weight:900;color:${col};">${a.quantite}</div>
        <div style="font-size:.62rem;color:#9ca3af;">${escX(a.unite)}</div>
      </td>
      <td style="padding:9px 12px;text-align:center;vertical-align:middle;font-weight:700;color:#6b7280;">${a.seuil_mini} ${escX(a.unite)}</td>
      <td style="padding:9px 12px;text-align:center;vertical-align:middle;">
        <div style="font-weight:800;color:${col};">-${Math.max(0,gap).toFixed(0)} ${escX(a.unite)}</div>
        <div style="font-size:.62rem;color:#9ca3af;">sous point cmd</div>
      </td>
      <td style="padding:9px 12px;text-align:center;vertical-align:middle;">
        ${cov !== null ? `<span style="font-weight:800;color:${cov<5?'#b91c1c':cov<10?'#92400e':'#374151'};">${cov}j</span>` : '—'}
      </td>
      <td style="padding:9px 12px;vertical-align:middle;">
        <div style="font-size:.78rem;font-weight:600;">${a.fournisseur != null ? escX(a.fournisseur) : '—'}</div>
        <div style="font-size:.65rem;color:#9ca3af;">Delai: ${a.delai_fournisseur ?? '?'}j</div>
      </td>
      <td style="padding:9px 12px;text-align:center;vertical-align:middle;">
        <div style="font-weight:700;color:#374151;">${qCmd} ${escX(a.unite)}</div>
        ${montant > 0 ? `<div style="font-size:.65rem;color:#9ca3af;">${montant.toLocaleString('fr-FR',{maximumFractionDigits:0})} EUR</div>` : ''}
      </td>
      <td style="padding:9px 12px;text-align:center;vertical-align:middle;">
        <button onclick="stkCreerDA('${a.id}')" style="padding:6px 14px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:8px;font-size:.72rem;font-weight:700;cursor:pointer;white-space:nowrap;"><i class="fas fa-shopping-cart"></i> Creer DA</button>
      </td>
    </tr>`
  }

  return `
  <div id="stk-panel-alertes" style="display:none;">
    <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;margin-bottom:16px;">
      <i class="fas fa-bell" style="color:#ef4444;"></i>Alertes et Reapprovisionnement
      ${(critiques.length + bas.length) > 0 ? `<span style="background:#fee2e2;color:#b91c1c;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${critiques.length + bas.length} articles a commander</span>` : ''}
      <button onclick="stkOpenModal('da')" style="margin-left:auto;padding:8px 16px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:10px;font-size:.8rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fas fa-shopping-cart"></i>Nouvelle DA</button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${kpiCard('fa-times-circle','#ef4444', critiques.length, 'Articles critiques', 'Sous le seuil mini')}
      ${kpiCard('fa-exclamation-circle','#f97316', bas.length, 'Articles bas', 'Sous le point de commande')}
      ${kpiCard('fa-euro-sign',GRN, valeurCom.toLocaleString('fr-FR',{maximumFractionDigits:0})+' EUR', 'Valeur a commander', 'Estimation commandes urgentes')}
      ${kpiCard('fa-truck','#0891b2', urgentLiv.length, 'Livraison urgente (≤3j)', 'Fournisseurs avec stock critique')}
    </div>

    ${critiques.length > 0 ? `
    <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#b91c1c;display:flex;align-items:center;gap:10px;">
      <i class="fas fa-exclamation-circle"></i>
      <span><strong>${critiques.length} reference(s) en stock CRITIQUE</strong> — En dessous du seuil de securite. Commander immediatement.</span>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;margin-bottom:24px;">
      <div style="padding:12px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-times-circle" style="color:#ef4444;"></i>
        <span style="font-weight:800;font-size:.85rem;color:#111827;">Stock CRITIQUE</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#fff5f5;">
            <th style="text-align:left;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Article</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Activite</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Stock actuel</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Seuil mini</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Ecart</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Couverture</th>
            <th style="text-align:left;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Fournisseur</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Qte a commander</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Action</th>
          </tr></thead>
          <tbody>${critiques.map(a=>alerteRow(a,'critique')).join('')}</tbody>
        </table>
      </div>
    </div>` : ''}

    ${bas.length > 0 ? `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px 16px;margin-bottom:16px;font-size:.8rem;color:#9a3412;display:flex;align-items:center;gap:10px;">
      <i class="fas fa-exclamation-triangle"></i>
      <span><strong>${bas.length} reference(s) en stock BAS</strong> — Point de commande atteint. Planifier l&#39;approvisionnement.</span>
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="padding:12px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-exclamation-circle" style="color:#f97316;"></i>
        <span style="font-weight:800;font-size:.85rem;color:#111827;">Stock BAS</span>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#fffbeb;">
            <th style="text-align:left;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Article</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Activite</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Stock actuel</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Seuil mini</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Ecart</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Couverture</th>
            <th style="text-align:left;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Fournisseur</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Qte a commander</th>
            <th style="text-align:center;padding:8px 12px;font-size:.65rem;font-weight:700;color:#64748b;text-transform:uppercase;">Action</th>
          </tr></thead>
          <tbody>${bas.map(a=>alerteRow(a,'bas')).join('')}</tbody>
        </table>
      </div>
    </div>` : ''}

    ${critiques.length === 0 && bas.length === 0 ? `
    <div style="background:white;border-radius:14px;padding:48px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.07);">
      <i class="fas fa-check-circle" style="font-size:2rem;color:${GRN};margin-bottom:12px;display:block;"></i>
      <div style="font-weight:800;color:#111827;margin-bottom:4px;">Tous les stocks sont corrects</div>
      <div style="color:#6b7280;font-size:.82rem;">Aucune alerte de reapprovisionnement.</div>
    </div>` : ''}
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PANEL 4 – DASHBOARD
// ══════════════════════════════════════════════════════════════

// ─── Onglet « Mouvements » : historique complet avec l'origine de chaque mouvement ───
function panelMouvements(mvts: MouvementStock[]) {
  const src = (m: any): [string, string, string] => {
    // Lot F : entrée par la file de rangement, ajustement d'inventaire, réception d'un BC (ancienne entrée au PV)
    if (m.mise_en_stock_id) return ['Mise en stock' + (m.bc_id ? ' · BC ' + m.bc_id : ''), '#16a34a', 'fa-dolly']
    if (String(m.type || '').toLowerCase() === 'ajustement') return ['Ajustement d’inventaire', '#2563eb', 'fa-scale-balanced']
    if (m.bdt_id) return ['BDT ' + m.bdt_id, '#6366f1', 'fa-screwdriver-wrench']
    if (m.bc_id) return ['Réception BC ' + m.bc_id, '#10b981', 'fa-truck-ramp-box']
    if (m.da_id) return ['Réception DA ' + m.da_id, '#10b981', 'fa-truck-ramp-box']
    if (m.bl_id) return ['BL ' + m.bl_id, '#0ea5e9', 'fa-file-import']
    if (m.lot_id) return ['Lot ' + m.lot_id, '#0891b2', 'fa-layer-group']
    if (m.cmd_id) return ['Commande ' + m.cmd_id, '#f59e0b', 'fa-clipboard-list']
    if (m.machine_id) return ['Conso. machine ' + m.machine_id, '#9333ea', 'fa-gears']
    return ['Sortie / saisie libre', '#64748b', 'fa-hand']
  }
  const typeChip = (t: string) => {
    const m: Record<string, [string, string, string]> = {
      entree: ['#dcfce7', '#15803d', '↓ Entrée'], sortie: ['#fee2e2', '#b91c1c', '↑ Sortie'],
      ajustement: ['#dbeafe', '#1d4ed8', '± Ajustement'], reception: ['#dcfce7', '#15803d', '↓ Réception'],
    }
    const [bg, co, lbl] = m[String(t || '').toLowerCase()] ?? ['#f1f5f9', '#475569', t || '—']
    return `<span style="background:${bg};color:${co};border-radius:999px;padding:2px 9px;font-size:.68rem;font-weight:700;white-space:nowrap;">${lbl}</span>`
  }
  const sorted = [...mvts].sort((a: any, b: any) => String(b.created_at || b.date_mvt || '').localeCompare(String(a.created_at || a.date_mvt || '')))
  const rows = sorted.map((m: any) => {
    const [sl, sc, si] = src(m)
    const av = m.quantite_avant, ap = m.quantite_apres
    return `<tr class="mvt-row" style="border-bottom:1px solid #f9fafb;"
      data-s="${(String(m.article_nom||'')+' '+(m.article_id||'')+' '+sl+' '+(m.operateur||'')+' '+(m.motif||'')).replace(/"/g,'&quot;').toLowerCase()}"
      onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
      <td style="padding:9px 12px;font-size:.74rem;color:#6b7280;white-space:nowrap;">${m.date_mvt || (m.created_at||'').slice(0,10) || '—'}</td>
      <td style="padding:9px 12px;"><div style="font-weight:700;color:#374151;font-size:.8rem;">${m.article_nom ? escX(m.article_nom) : '—'}</div><div style="font-size:.64rem;color:#9ca3af;font-family:monospace;">${m.article_id ? escX(m.article_id) : ''}</div></td>
      <td style="padding:9px 12px;text-align:center;">${typeChip(m.type)}</td>
      <td style="padding:9px 12px;text-align:right;font-weight:800;color:#111827;">${m.quantite ?? '—'}</td>
      <td style="padding:9px 12px;text-align:center;font-size:.72rem;color:#6b7280;white-space:nowrap;">${av != null && ap != null ? `${av} → <strong style="color:#111827;">${ap}</strong>` : '—'}</td>
      <td style="padding:9px 12px;"><span style="display:inline-flex;align-items:center;gap:5px;background:${sc}14;color:${sc};border-radius:7px;padding:3px 9px;font-size:.7rem;font-weight:700;"><i class="fas ${si}"></i>${escX(sl)}</span></td>
      <td style="padding:9px 12px;font-size:.76rem;color:#374151;font-weight:600;">${m.operateur ? escX(m.operateur) : '—'}</td>
      <td style="padding:9px 12px;font-size:.72rem;color:#6b7280;">${m.motif ? escX(m.motif) : '—'}</td>
    </tr>`
  }).join('')
  return `
  <div id="stk-panel-mvts" style="display:none;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-clock-rotate-left" style="color:${GRN};"></i>Historique des mouvements de stock
        <span style="background:#d1fae5;color:#065f46;border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${mvts.length}</span>
      </div>
      <input type="text" placeholder="Rechercher (article, source, opérateur…)" oninput="stkMvtSearch(this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:7px 12px;font-size:.8rem;background:#f8fafc;outline:none;width:280px;"/>
    </div>
    <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:9px 14px;margin-bottom:14px;font-size:.74rem;color:#3730a3;">
      <i class="fas fa-route" style="margin-right:6px;"></i>Chaque mouvement indique son <strong>origine</strong> : BDT (production), réception DA/BL, commande, consommation machine, ou sortie/saisie libre — avec l'opérateur et la date.
    </div>
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
            ${['Date','Article','Type','Qté','Avant→Après','Origine','Opérateur','Motif'].map(h=>`<th style="text-align:left;padding:10px 12px;color:#64748b;font-size:.66rem;text-transform:uppercase;font-weight:700;">${h}</th>`).join('')}
          </tr></thead>
          <tbody id="stk-mvt-tbody">${rows || `<tr><td colspan="8" style="padding:40px;text-align:center;color:#9ca3af;font-size:.82rem;"><i class="fas fa-clock-rotate-left" style="font-size:1.6rem;display:block;margin-bottom:8px;opacity:.3;"></i>Aucun mouvement de stock enregistré</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  </div>`
}

function panelDashboard(arts: ArticleStock[], mvts: MouvementStock[]) {
  const byStat: Record<StatutStock, number> = { critique:0, bas:0, moyen:0, haut:0 }
  arts.forEach(a => byStat[statut(a)]++)

  const valeurTotale = arts.reduce((s,a) => s + a.quantite*(a.prix_unitaire??0), 0)
  const critiques = arts.filter(a => statut(a) === 'critique').length
  const covMoy = arts.filter(a=>a.consommation_mensuelle&&a.consommation_mensuelle>0).map(a=>couvertureJours(a)??0)
  const covMoyen = covMoy.length > 0 ? Math.round(covMoy.reduce((s,v)=>s+v,0)/covMoy.length) : 0

  // Valeur par catégorie
  const catVals: Record<string, number> = {}
  arts.forEach(a => {
    const v = a.quantite * (a.prix_unitaire ?? 0)
    catVals[a.categorie] = (catVals[a.categorie] ?? 0) + v
  })
  const maxCatVal = Math.max(...Object.values(catVals), 1)

  // ABC analysis par valeur de stock
  const artsSorted = [...arts].sort((a,b) => (b.quantite*(b.prix_unitaire??0)) - (a.quantite*(a.prix_unitaire??0)))
  const totalVal = artsSorted.reduce((s,a)=>s+a.quantite*(a.prix_unitaire??0),0)
  let cumul = 0
  const abcArts = artsSorted.slice(0,12).map(a => {
    const val = a.quantite*(a.prix_unitaire??0)
    cumul += val
    const abc = cumul/totalVal < 0.70 ? 'A' : cumul/totalVal < 0.90 ? 'B' : 'C'
    return { ...a, val, abc }
  })

  return `
  <div id="stk-panel-dashboard" style="display:none;">
    <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;margin-bottom:16px;">
      <i class="fas fa-tachometer-alt" style="color:${GRN};"></i>Dashboard Stock
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${kpiCard('fa-euro-sign',GRN, valeurTotale.toLocaleString('fr-FR',{maximumFractionDigits:0})+' EUR', 'Valeur totale du stock', `${arts.length} references`)}
      ${kpiCard('fa-times-circle','#ef4444', critiques, 'Articles critiques', 'Action immediate requise')}
      ${kpiCard('fa-calendar-alt','#f59e0b', covMoyen+'j', 'Couverture moyenne', 'En jours de production')}
      ${kpiCard('fa-exchange-alt','#0891b2', mvts.filter(m=>m.date_mvt>=TODAY.slice(0,7)).length, 'Mouvements ce mois', 'Entrees + sorties')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <!-- Répartition par catégorie -->
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
        <div style="font-weight:800;color:#111827;margin-bottom:16px;font-size:.88rem;">Valeur par categorie</div>
        ${Object.entries(catVals).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>`
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
            <span style="font-size:.75rem;font-weight:600;color:#374151;">${escX(catLabel(cat))}</span>
            <span style="font-size:.72rem;font-weight:700;color:${GRN_D};">${val.toLocaleString('fr-FR',{maximumFractionDigits:0})} EUR</span>
          </div>
          <div style="height:7px;background:#f1f5f9;border-radius:999px;">
            <div style="height:100%;background:linear-gradient(90deg,${GRN},${GRN_D});border-radius:999px;width:${Math.round(val/maxCatVal*100)}%;transition:width .4s;"></div>
          </div>
        </div>`).join('')}
      </div>

      <!-- Répartition statut -->
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
        <div style="font-weight:800;color:#111827;margin-bottom:16px;font-size:.88rem;">Etat du stock global</div>
        ${([['critique','#ef4444'],['bas','#f97316'],['moyen','#f59e0b'],['haut','#22c55e']] as const).map(([s,c])=>`
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
            <span style="font-size:.75rem;font-weight:700;color:#374151;text-transform:uppercase;">${s}</span>
            <span style="font-size:.75rem;font-weight:800;color:${c};">${byStat[s]} articles</span>
          </div>
          <div style="height:8px;background:#f1f5f9;border-radius:999px;">
            <div style="height:100%;background:${c};border-radius:999px;width:${Math.round(byStat[s]/arts.length*100)}%;"></div>
          </div>
          <div style="font-size:.62rem;color:#9ca3af;margin-top:1px;">${Math.round(byStat[s]/arts.length*100)}% des references</div>
        </div>`).join('')}
        <div style="margin-top:16px;padding:12px;background:#f0fdf4;border-radius:8px;font-size:.78rem;color:${GRN_D};font-weight:700;text-align:center;">
          <i class="fas fa-info-circle"></i> Objectif : 0 critique, &lt;10% bas
        </div>
      </div>
    </div>

    <!-- ABC Analysis -->
    <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:20px;">
      <div style="font-weight:800;color:#111827;margin-bottom:8px;font-size:.88rem;">Analyse ABC – Top articles par valeur de stock</div>
      <div style="font-size:.72rem;color:#6b7280;margin-bottom:14px;">A = 70% de la valeur totale · B = 20% · C = 10% — Piloter les articles A en priorite</div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.76rem;">
          <thead><tr style="background:#f8fafc;">
            <th style="text-align:center;padding:7px 10px;color:#64748b;font-weight:700;font-size:.65rem;text-transform:uppercase;width:40px;">ABC</th>
            <th style="text-align:left;padding:7px 10px;color:#64748b;font-weight:700;font-size:.65rem;text-transform:uppercase;">Article</th>
            <th style="text-align:center;padding:7px 10px;color:#64748b;font-weight:700;font-size:.65rem;text-transform:uppercase;">Activite</th>
            <th style="text-align:center;padding:7px 10px;color:#64748b;font-weight:700;font-size:.65rem;text-transform:uppercase;">Quantite</th>
            <th style="text-align:right;padding:7px 10px;color:#64748b;font-weight:700;font-size:.65rem;text-transform:uppercase;">PU</th>
            <th style="text-align:right;padding:7px 10px;color:#64748b;font-weight:700;font-size:.65rem;text-transform:uppercase;">Valeur stock</th>
            <th style="text-align:center;padding:7px 10px;color:#64748b;font-weight:700;font-size:.65rem;text-transform:uppercase;">Couverture</th>
            <th style="text-align:center;padding:7px 10px;color:#64748b;font-weight:700;font-size:.65rem;text-transform:uppercase;">Statut</th>
          </tr></thead>
          <tbody>
            ${abcArts.map((a,i)=>{
              const abcCol = a.abc==='A'?'#ef4444':a.abc==='B'?'#f59e0b':'#22c55e'
              const cov = couvertureJours(a)
              return `
            <tr style="border-bottom:1px solid #f9fafb;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
              <td style="text-align:center;padding:7px 10px;">
                <span style="background:${abcCol}20;color:${abcCol};border-radius:6px;padding:2px 8px;font-size:.7rem;font-weight:900;">${a.abc}</span>
              </td>
              <td style="padding:7px 10px;font-weight:700;color:#111827;">${escX(a.nom)}</td>
              <td style="padding:7px 10px;text-align:center;">${activiteBadge(a.activite)}</td>
              <td style="padding:7px 10px;text-align:center;font-weight:700;">${a.quantite} ${escX(a.unite)}</td>
              <td style="padding:7px 10px;text-align:right;color:#6b7280;">${a.prix_unitaire ? a.prix_unitaire.toFixed(2) : '—'}</td>
              <td style="padding:7px 10px;text-align:right;font-weight:800;color:${GRN_D};">${a.val.toLocaleString('fr-FR',{maximumFractionDigits:0})} EUR</td>
              <td style="padding:7px 10px;text-align:center;">${cov !== null ? `<span style="font-weight:700;color:${cov<7?'#b91c1c':cov<14?'#92400e':'#374151'};">${cov}j</span>` : '—'}</td>
              <td style="padding:7px 10px;text-align:center;">${statutBadge(statut(a))}</td>
            </tr>`}).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`
}

// ══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════

export const pageServiceStock = (
  dbArts?: ArticleStock[],
  dbMvts?: MouvementStock[],
  /**
   * Lot H1 — conservé pour ne pas déplacer les arguments de l'appelant, mais PLUS UTILISÉ : le
   * catalogue ne se lit plus dans `fournisseurs.catalogue` (jsonb vide partout, sonde du
   * 17/09/2026) mais dans `produits_fournisseurs` → 5ᵉ argument `dbProduits`.
   */
  dbFournisseurs?: any[],
  dbMes?: DonneesMiseEnStock,
  /** Lignes de `produits_fournisseurs` (`select('*')`, jamais de projection nommant `qte_paquet`). */
  dbProduits?: any[],
) => {
  // Stock RÉEL : si la DB renvoie des articles on les utilise (même tableau vide = pas de démo).
  const ARTS = Array.isArray(dbArts) ? dbArts : []
  const MVTS = Array.isArray(dbMvts) ? dbMvts : []
  const PRODUITS = Array.isArray(dbProduits) ? dbProduits : []
  const MES = normMes(dbMes)
  void dbFournisseurs

  const TABS = [
    ['mes',      'Rangement / Mise en stock',  'fa-dolly'],
    ['gestion',  'Gestion du stock',            'fa-sliders-h'],   // 2ᵉ onglet (demande du 16/09/2026)
    ['rt',       'Stock en temps reel',        'fa-warehouse'],
    ['mvts',     'Mouvements',                  'fa-clock-rotate-left'],
    ['alertes',  'Alertes et Reappro.',         'fa-bell'],
    ['dashboard','Dashboard',                   'fa-tachometer-alt'],
  ] as const

  const nCrit = ARTS.filter(a => statut(a) === 'critique').length

  const content = `
  <div style="font-family:Inter,system-ui,sans-serif;">

    ${serviceHeader({
      icon: 'fa-warehouse',
      color: GRN,
      darkBg: '#052e16',
      title: 'Service Stock',
      subtitle: 'Magasin · Stock en temps réel · Gestion · Alertes & Réappro · EN 9100:2018',
      tabs: TABS.map(([id,lbl,ic]) => ({ id, label: lbl, icon: ic, badge: id==='mes' ? ((MES.erreurFile || (MES.erreur && !MES.erreurTypes)) ? '?' : (MES.file.length || undefined)) : id==='rt' ? (ARTS.length || undefined) : id==='mvts' ? (MVTS.length || undefined) : (id==='alertes' && nCrit>0) ? nCrit : undefined })),
      switchFn: 'stkShowTab',
      tabIdPrefix: 'stk-tab',
      activeId: 'mes'
    })}

    <div class="stk-root" style="padding:22px 30px;">
      ${panelMiseEnStock(ARTS, MVTS, MES)}
      ${panelTempsReel(ARTS)}
      ${panelGestion(ARTS, MVTS, PRODUITS, MES)}
      ${panelMouvements(MVTS)}
      ${panelAlertes(ARTS)}
      ${panelDashboard(ARTS, MVTS)}
    </div>
  </div>

  <!-- MODAL -->
  <div id="stk-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;">
    <div id="stk-modal-box" style="background:white;border-radius:16px;padding:28px;max-width:560px;width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);">
      <div id="stk-modal-content"></div>
    </div>
  </div>

  <script>
  var STK_TABS=['mes','gestion','rt','mvts','alertes','dashboard'];
  var STK_ARTS=${sjX(ARTS.map((a: any) => ({ id:a.id, nom:a.nom, reference:a.reference||'', qte:(a.qte_commande ?? Math.round(((a.seuil_maxi||0)-(a.quantite||0))*0.8)) || '', unite:a.unite||'', fournisseur:a.fournisseur||'', quantite:Number(a.quantite)||0, emplacement:a.emplacement||'', type_objet:a.type_objet||'' })))};
  // Lot F : référentiels et file « À ranger » (projection complète de ce que lit le JS ci-dessous)
  var STK_TYPES=${sjX(MES.types.map((t: any) => ({ code: str(t.code), libelle: str(t.libelle), actif: t.actif !== false })))};
  var STK_ZONES=${sjX(MES.zones.map((z: any) => ({ id: str(z.id), type_objet: str(z.type_objet), zone: str(z.zone), actif: z.actif !== false })))};
  var STK_FILE=${sjX(MES.file.map((l: any) => ({ id: str(l.id), reference: str(l.reference), designation: str(l.designation), quantite: Number(l.quantite) || 0, unite: str(l.unite), type_suggere: str(l.type_suggere), emplacement_fixe: str(l.emplacement_fixe), origine: libelleOrigine(l), num_affaire: str(l.num_affaire), fournisseur_nom: str(l.fournisseur_nom) })))};
  var stkActFilter='all', stkStatFilter='all', stkCatFilter='all', stkSearch__q='';
  var stkMasquerVides=true; try{ if(localStorage.getItem('stkMasquerVides')==='0') stkMasquerVides=false; }catch(e){}

  function stkHash(h){ try{ history.replaceState(null,'','#'+h); }catch(e){ try{ location.hash=h; }catch(e2){} } }
  function stkShowTab(id, sansHash){
    STK_TABS.forEach(function(t){
      var p=document.getElementById('stk-panel-'+t);
      var b=document.getElementById('stk-tab-'+t);
      if(p) p.style.display=(t===id)?'block':'none';
      if(b) b.classList.toggle('active',t===id);
    });
    if(!sansHash) stkHash(id);
  }
  var STK_MES_SUBS=['aranger','ajustement','types'];
  function stkSwitchMes(id, sansHash){
    if(STK_MES_SUBS.indexOf(id)<0) id='aranger';
    STK_MES_SUBS.forEach(function(p){
      var el=document.getElementById('stk-mes-panel-'+p);
      var btn=document.getElementById('stk-mes-'+p);
      if(el) el.style.display=(p===id)?'block':'none';
      if(btn) btn.classList.toggle('exp-sub-active',p===id);
    });
    if(!sansHash) stkHash(id==='aranger'?'mes':'mes-'+id);
  }
  function stkMvtSearch(q){
    q=(q||'').toLowerCase().trim();
    document.querySelectorAll('#stk-mvt-tbody tr.mvt-row').forEach(function(r){
      r.style.display=(!q||(r.getAttribute('data-s')||'').indexOf(q)>=0)?'':'none';
    });
  }
  // Enregistre les seuils + le flag réappro auto d'une référence
  function stkSaveSeuils(id, btn){
    var tr=btn; while(tr&&tr.tagName!=='TR') tr=tr.parentNode; if(!tr) return;
    var num=function(sel){ var e=tr.querySelector(sel); var v=e?parseFloat(e.value):NaN; return isNaN(v)?null:v; };
    var payload={ stock_mini:num('.sf-mini'), point_commande:num('.sf-pc'), qte_commande:num('.sf-qc'), auto_reappro:!!(tr.querySelector('.sf-auto')||{}).checked };
    if(btn){ btn.disabled=true; btn.style.opacity=.6; }
    fetch('/api/stock/'+encodeURIComponent(id)+'/seuils',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){
        if(btn){ btn.disabled=false; btn.style.opacity=1; }
        if(!j||!j.ok){ pushNotif('err','fa-times','Erreur: '+((j&&j.error)||'inconnu'),5000); return; }
        pushNotif('ok','fa-save','Seuils enregistrés'+(payload.auto_reappro?' · réappro auto activé':'')+'.',3500);
      }).catch(function(){ if(btn){btn.disabled=false;btn.style.opacity=1;} pushNotif('err','fa-times','Erreur réseau.',4000); });
  }

  var STK_GEST_SUBS=['entree','sortie','catalogue'];
  function stkSwitchGestion(id, sansHash){
    if(STK_GEST_SUBS.indexOf(id)<0) id='entree';
    STK_GEST_SUBS.forEach(function(p){
      var el=document.getElementById('stk-gest-panel-'+p);
      var btn=document.getElementById('stk-gest-'+p);
      if(el) el.style.display=(p===id)?'block':'none';
      if(btn) btn.classList.toggle('exp-sub-active',p===id);
    });
    if(!sansHash) stkHash('gestion-'+id);
  }

  function stkApplyFilters(){
    var rows=document.querySelectorAll('#stk-tbody tr[data-art]');
    var vides=0;
    rows.forEach(function(tr){
      var actOK = stkActFilter==='all' || tr.dataset.activite===stkActFilter || tr.dataset.activite==='both';
      var stOK  = stkStatFilter==='all'|| tr.dataset.statut===stkStatFilter;
      var catOK = stkCatFilter==='all' || tr.dataset.categorie===stkCatFilter;
      var srOK  = !stkSearch__q || tr.textContent.toLowerCase().indexOf(stkSearch__q)>=0;
      var vide  = (parseFloat(tr.getAttribute('data-qte'))||0) <= 0;
      if(vide && stkMasquerVides && actOK && stOK && catOK && srOK) vides++;
      tr.style.display=(actOK&&stOK&&catOK&&srOK&&!(vide&&stkMasquerVides))?'':'none';
    });
    document.querySelectorAll('.stk-vides-info').forEach(function(el){ el.textContent = vides ? (vides+' référence(s) vide(s) masquée(s)') : ''; });
  }
  // Niveaux d’approvisionnement : recherche + masquage des références vides
  var stkNivQ='';
  function stkNivSearch(q){ stkNivQ=String(q||'').toLowerCase().trim(); stkApplyNiveaux(); }
  function stkApplyNiveaux(){
    var vides=0;
    document.querySelectorAll('#stk-niv-tbody tr.seuil-row').forEach(function(tr){
      var vide=(parseFloat(tr.getAttribute('data-qte'))||0)<=0;
      var srOK=!stkNivQ||(tr.getAttribute('data-s')||'').indexOf(stkNivQ)>=0;
      if(vide&&stkMasquerVides&&srOK) vides++;
      tr.style.display=(srOK&&!(vide&&stkMasquerVides))?'':'none';
    });
    document.querySelectorAll('.stk-vides-info-niv').forEach(function(el){ el.textContent = vides ? (vides+' vide(s) masquée(s)') : ''; });
  }
  function stkToggleVides(v){
    stkMasquerVides=!!v;
    try{ localStorage.setItem('stkMasquerVides', v?'1':'0'); }catch(e){}
    document.querySelectorAll('.stk-vides-cb').forEach(function(cb){ cb.checked=stkMasquerVides; });
    stkApplyFilters(); stkApplyNiveaux();
  }

  function stkFiltreActivite(act){
    stkActFilter=act;
    ['all','Seem','Semrac','both'].forEach(function(a){
      var b=document.getElementById('stk-act-'+a);
      if(b) b.classList.toggle('stk-f-active',a===act);
    });
    stkApplyFilters();
  }

  function stkFiltreStatut(s){
    stkStatFilter=s;
    stkApplyFilters();
  }

  function stkFiltreCategorie(cat){
    stkCatFilter=cat;
    document.querySelectorAll('.stk-cat-btn').forEach(function(b){
      b.classList.remove('stk-cat-active');
    });
    var active=document.getElementById('stk-cat-'+cat);
    if(active) active.classList.add('stk-cat-active');
    stkApplyFilters();
  }

  function stkSearch(q){
    stkSearch__q=q.toLowerCase().trim();
    stkApplyFilters();
  }

  function stkOpenModal(type){
    var overlay=document.getElementById('stk-modal-overlay');
    var box=document.getElementById('stk-modal-content');
    if(!overlay||!box) return;
    overlay.style.display='flex';
    if(type==='da') box.innerHTML=modalDAHTML();
  }

  function stkCloseModal(){
    var o=document.getElementById('stk-modal-overlay');
    if(o) o.style.display='none';
  }

  document.addEventListener('click',function(e){
    var o=document.getElementById('stk-modal-overlay');
    if(e.target===o) stkCloseModal();
  });

  // ── Lot F : outils communs (échappement de tout texte venu de la base, appels API, anti double-clic) ──
  function stkEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function stkVal(id){ var e=document.getElementById(id); return e ? String(e.value||'').trim() : ''; }
  function stkNum(v){ var n=parseFloat(String(v==null?'':v).replace(',','.')); return isNaN(n)?NaN:n; }
  function stkFmt(n){ return String(n==null?'':n).replace('.',','); }
  function stkBusy(btn,on){ if(!btn) return; btn.disabled=!!on; btn.style.opacity=on?'.6':''; }
  function stkApi(url, method, body){
    return fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:body==null?undefined:JSON.stringify(body)})
      .then(function(r){ return r.json().catch(function(){ return { ok:false, error:'Réponse illisible du serveur ('+r.status+')' }; }); });
  }
  // Erreur : son message ET les avertissements joints (ex. « la ligne n’a pas pu être remise à ranger ») — sans rechargement.
  function stkErreur(j, defaut){ pushNotif('err','fa-ban',stkEsc((j&&j.error)||defaut),8000); ((j&&j.avertissements)||[]).forEach(function(a){ pushNotif('warn','fa-triangle-exclamation',stkEsc(a),30000); }); }
  // Succès suivi d’un rechargement : avertissements DURABLES (réaffichés sur la page rechargée).
  function stkAvertir(j){ ((j&&j.avertissements)||[]).forEach(function(a){ notifDurable('warn','fa-triangle-exclamation',stkEsc(a),60000); }); }
  function stkRecharger(h){ stkHash(h); setTimeout(function(){ softReload(); }, 700); }
  function stkArt(id){ for(var i=0;i<STK_ARTS.length;i++){ if(String(STK_ARTS[i].id)===String(id)) return STK_ARTS[i]; } return null; }
  function stkRefConnue(ref){ var k=String(ref||'').trim().toLowerCase(); if(!k) return null; for(var i=0;i<STK_ARTS.length;i++){ if(String(STK_ARTS[i].reference||'').trim().toLowerCase()===k) return STK_ARTS[i]; } return null; }
  function stkTypeLibelle(code){ for(var i=0;i<STK_TYPES.length;i++){ if(STK_TYPES[i].code===code) return STK_TYPES[i].libelle||code; } return code||''; }
  function stkZonesDuType(code){ return STK_ZONES.filter(function(z){ return z.type_objet===code && z.actif; }); }
  function stkDate(s){ try{ var d=new Date(s); if(isNaN(d.getTime())) return String(s||''); return d.toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(e){ return String(s||''); } }
  function stkModal(html){ var o=document.getElementById('stk-modal-overlay'); var b=document.getElementById('stk-modal-content'); if(!o||!b) return false; b.innerHTML=html; o.style.display='flex'; return true; }
  var STK_IN='width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;box-sizing:border-box;';
  var STK_LB='display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;';

  // ── Raccourcis de la liste « Stock en temps réel » ──
  function stkNouvelleReference(){ stkShowTab('gestion'); stkSwitchGestion('entree'); var r=document.getElementById('ent_ref'); if(r){ r.value=''; r.focus(); } }
  function stkEntreeRapide(id){
    var a=stkArt(id); stkShowTab('gestion'); stkSwitchGestion('entree');
    if(a){ var r=document.getElementById('ent_ref'); if(r) r.value=a.reference||''; var d=document.getElementById('ent_des'); if(d) d.value=a.nom||''; var u=document.getElementById('ent_unite'); if(u) u.value=a.unite||''; }
    var q=document.getElementById('ent_qte'); if(q) q.focus();
  }
  function stkSortieRapide(id){ stkShowTab('gestion'); stkSwitchGestion('sortie'); var s=document.getElementById('sor_art'); if(s) s.value=id; var q=document.getElementById('sor_qte'); if(q) q.focus(); }
  function stkEntreeRefConnue(){
    var a=stkRefConnue(stkVal('ent_ref')); if(!a) return;
    var d=document.getElementById('ent_des'); if(d && !d.value) d.value=a.nom||'';
    var u=document.getElementById('ent_unite'); if(u && !u.value) u.value=a.unite||'';
    var t=document.getElementById('ent_type'); if(t && !t.value && a.type_objet) t.value=a.type_objet;
  }

  // ── Entrée manuelle : une ligne dans la file « À ranger » ──
  function stkEntreeValider(btn){
    var body={ reference:stkVal('ent_ref'), designation:stkVal('ent_des'), quantite:stkVal('ent_qte'), unite:stkVal('ent_unite'), type_objet:stkVal('ent_type'), num_affaire:stkVal('ent_aff'), motif:stkVal('ent_motif') };
    if(!body.reference){ pushNotif('err','fa-exclamation-circle','Référence obligatoire (existante ou nouvelle).'); return; }
    if(!(stkNum(body.quantite)>0)){ pushNotif('err','fa-exclamation-circle','Quantité invalide.'); return; }
    if(body.motif.length<3){ pushNotif('err','fa-exclamation-circle','Motif obligatoire.'); return; }
    stkBusy(btn,true);
    stkApi('/api/stock/entree','POST',body).then(function(j){
      if(!j||!j.ok){ stkBusy(btn,false); stkErreur(j,'Entrée refusée.'); return; }
      pushNotif('ok','fa-dolly','Entrée ajoutée à la liste « À ranger » : acceptez-la dans Rangement pour créditer le stock.',5000);
      stkRecharger('mes');
    }).catch(function(){ stkBusy(btn,false); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  function stkMotifDe(typeId, txtId){ var t=stkVal(typeId), p=stkVal(txtId); if(t==='Autre') return p; return p ? (t+' : '+p) : t; }

  // ── Sortie réelle ──
  function stkSortieValider(btn){
    var id=stkVal('sor_art'); var a=stkArt(id); var q=stkNum(stkVal('sor_qte')); var motif=stkMotifDe('sor_motif_type','sor_motif_txt');
    if(!id||!a){ pushNotif('err','fa-exclamation-circle','Choisissez l’article à sortir.'); return; }
    if(!(q>0)){ pushNotif('err','fa-exclamation-circle','Quantité invalide.'); return; }
    if(q>(Number(a.quantite)||0)){ pushNotif('err','fa-ban','Stock insuffisant : '+stkFmt(a.quantite)+' disponible(s).'); return; }
    if(motif.length<3){ pushNotif('err','fa-exclamation-circle','Précisez le motif de sortie.'); return; }
    appConfirm('Sortir '+stkFmt(q)+' '+(a.unite||'')+' de « '+(a.nom||a.reference)+' » ?\\nMotif : '+motif, { title:'Sortie de stock', danger:false, okLabel:'Sortir du stock' }).then(function(ok){
      if(!ok) return;
      stkBusy(btn,true);
      stkApi('/api/stock/sortie','POST',{ stock_id:id, quantite:q, motif:motif, bdt_id:stkVal('sor_bdt'), num_affaire:stkVal('sor_aff') }).then(function(j){
        if(!j||!j.ok){ stkBusy(btn,false); stkErreur(j,'Sortie refusée.'); return; }
        pushNotif('ok','fa-arrow-up','Sortie enregistrée : stock '+stkEsc(stkFmt(j.stock_avant))+' → '+stkEsc(stkFmt(j.stock_apres))+(j.lot_id?' · imputée au lot '+stkEsc(j.lot_id):'')+'.',5000);
        stkAvertir(j);
        stkRecharger('gestion-sortie');
      }).catch(function(){ stkBusy(btn,false); pushNotif('err','fa-exclamation-circle','Erreur réseau : rechargez la page avant de réessayer.'); });
    });
  }

  // ── Ajustement d’inventaire ──
  function stkAjustValider(btn){
    var id=stkVal('adj_art'); var a=stkArt(id); var nq=stkNum(stkVal('adj_qte')); var motif=stkMotifDe('adj_motif_type','adj_motif_txt');
    if(!id||!a){ pushNotif('err','fa-exclamation-circle','Choisissez l’article à ajuster.'); return; }
    if(isNaN(nq)||nq<0){ pushNotif('err','fa-exclamation-circle','Saisissez la quantité constatée.'); return; }
    if(motif.length<3){ pushNotif('err','fa-exclamation-circle','Motif obligatoire.'); return; }
    var ecart=Math.round((nq-(Number(a.quantite)||0))*1000)/1000;
    if(ecart===0){ pushNotif('err','fa-exclamation-circle','Aucun écart avec le stock actuel.'); return; }
    appConfirm('Ajuster « '+(a.nom||a.reference)+' » de '+stkFmt(a.quantite)+' à '+stkFmt(nq)+' (écart '+(ecart>0?'+':'')+stkFmt(ecart)+') ?\\nMotif : '+motif, { title:'Ajustement de stock', danger:false, okLabel:'Ajuster' }).then(function(ok){
      if(!ok) return;
      stkBusy(btn,true);
      stkApi('/api/stock/ajustement','POST',{ stock_id:id, nouvelle_quantite:nq, motif:motif }).then(function(j){
        if(!j||!j.ok){ stkBusy(btn,false); stkErreur(j,'Ajustement refusé.'); return; }
        pushNotif('ok','fa-scale-balanced','Ajustement enregistré (écart '+(j.ecart>0?'+':'')+stkEsc(stkFmt(j.ecart))+').',5000);
        stkRecharger('mes-ajustement');
      }).catch(function(){ stkBusy(btn,false); pushNotif('err','fa-exclamation-circle','Erreur réseau : rechargez la page avant de réessayer.'); });
    });
  }

  // ── Rangement : « Accepter l’entrée en stock » ──
  var stkMesCourant=null;
  function stkOuvrirRangement(id){
    var l=null; for(var i=0;i<STK_FILE.length;i++){ if(STK_FILE[i].id===id){ l=STK_FILE[i]; break; } }
    if(!l){ pushNotif('err','fa-exclamation-circle','Ligne introuvable : rechargez la page.'); return; }
    stkMesCourant=l;
    var opts='<option value="">— choisir le type —</option>';
    STK_TYPES.forEach(function(t){ if(t.actif) opts+='<option value="'+stkEsc(t.code)+'"'+(t.code===l.type_suggere?' selected':'')+'>'+stkEsc(t.libelle)+'</option>'; });
    var ro=STK_IN+'background:#f8fafc;';
    var html='<div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:4px;display:flex;align-items:center;gap:8px;"><i class="fas fa-dolly" style="color:#16a34a;"></i>Accepter l’entrée en stock</div>'
      +'<div style="font-size:.74rem;color:#64748b;margin-bottom:14px;">'+stkEsc(l.origine)+(l.fournisseur_nom?' · '+stkEsc(l.fournisseur_nom):'')+(l.num_affaire?' · affaire '+stkEsc(l.num_affaire):'')+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">'
      +  '<div><label style="'+STK_LB+'">Référence'+(l.reference?'':' *')+'</label>'+(l.reference?'<div style="'+ro+'font-family:monospace;font-weight:700;">'+stkEsc(l.reference)+'</div>':'<input id="mes_ref" list="stk_refs" type="text" autocomplete="off" placeholder="Référence de stock" style="'+STK_IN+'"/>')+'</div>'
      +  '<div><label style="'+STK_LB+'">Quantité à ranger</label><div style="'+ro+'font-weight:800;">'+stkEsc(stkFmt(l.quantite))+' '+stkEsc(l.unite)+'</div></div>'
      +'</div>'
      +'<div style="margin-bottom:12px;"><label style="'+STK_LB+'">Désignation</label><div style="'+ro+'">'+stkEsc(l.designation||'—')+'</div></div>'
      +'<div style="margin-bottom:12px;"><label style="'+STK_LB+'">Type d’objet *</label><select id="mes_type" style="'+STK_IN+'">'+opts+'</select></div>'
      +'<div id="mes_emp_box" data-fixe="0" style="margin-bottom:6px;"></div>'
      +'<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;">'
      +  '<button type="button" onclick="stkCloseModal()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'
      +  '<button type="button" id="mes_ok" data-act="mes-valider" style="padding:9px 18px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-check" style="margin-right:5px;"></i>Ranger en stock</button>'
      +'</div>';
    if(stkModal(html)) stkMesMajEmplacement();
  }
  function stkMesEmplacementFixe(){
    var l=stkMesCourant; if(!l) return '';
    if(l.reference) return l.emplacement_fixe||'';
    var a=stkRefConnue(stkVal('mes_ref')); return (a&&a.emplacement)?a.emplacement:'';
  }
  function stkMesMajEmplacement(){
    var box=document.getElementById('mes_emp_box'); if(!box||!stkMesCourant) return;
    var fixe=stkMesEmplacementFixe();
    // Réécrite SEULEMENT si ce qu’elle montre change (emplacement fixe, type) : sinon un « change » sur la référence (au
    // blur) effaçait la zone choisie et remplaçait le lien sous le clic suivant.
    var etat=(fixe?'F:'+fixe:'L:'+stkVal('mes_type'));
    if(box.getAttribute('data-etat')===etat) return;
    box.setAttribute('data-etat',etat);
    if(fixe){
      box.setAttribute('data-fixe','1');
      box.innerHTML='<label style="'+STK_LB+'">Emplacement</label><div style="'+STK_IN+'background:#f0fdfa;border-color:#99f6e4;color:#0f766e;font-weight:700;"><i class="fas fa-lock" style="margin-right:6px;"></i>'+stkEsc(fixe)+'</div>'
        +'<div style="font-size:.68rem;color:#64748b;margin-top:4px;">Emplacement fixe de la référence — il se change dans Gestion du stock › Niveaux d’approvisionnement.</div>';
      return;
    }
    box.setAttribute('data-fixe','0');
    var type=stkVal('mes_type');
    var h='<label style="'+STK_LB+'">Zone de rangement * <span style="text-transform:none;font-weight:600;color:#94a3b8;">(deviendra l’emplacement fixe de la référence)</span></label>';
    if(!type){ box.innerHTML=h+'<div style="font-size:.76rem;color:#c2410c;">Choisissez d’abord le type d’objet : la zone se choisit dans sa liste.</div>'; return; }
    var zs=stkZonesDuType(type);
    if(zs.length){
      h+='<select id="mes_zone" style="'+STK_IN+'"><option value="">— choisir la zone —</option>';
      zs.forEach(function(z){ h+='<option value="'+stkEsc(z.zone)+'">'+stkEsc(z.zone)+'</option>'; });
      h+='</select><div style="margin-top:6px;"><a href="#" id="mes_nz_lien" data-act="mes-nz-toggle" style="font-size:.72rem;color:#0f766e;font-weight:700;text-decoration:none;"><i class="fas fa-plus"></i> Nouvelle zone pour ce type</a></div>'
        +'<div id="mes_nz_box" style="display:none;margin-top:6px;"><input id="mes_nz" type="text" maxlength="80" placeholder="Nom de la nouvelle zone" style="'+STK_IN+'"/></div>';
    } else {
      h+='<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:8px 10px;font-size:.74rem;color:#9a3412;margin-bottom:6px;">Le type « '+stkEsc(stkTypeLibelle(type))+' » n’a encore aucune zone : saisissez-en une, elle rejoindra sa liste.</div>'
        +'<div id="mes_nz_box"><input id="mes_nz" type="text" maxlength="80" placeholder="Nouvelle zone pour ce type" style="'+STK_IN+'"/></div>';
    }
    box.innerHTML=h;
  }
  function stkMesValider(btn){
    var l=stkMesCourant; if(!l) return;
    var body={ type_objet:stkVal('mes_type') };
    if(!l.reference){ body.reference=stkVal('mes_ref'); if(!body.reference){ pushNotif('err','fa-exclamation-circle','Saisissez la référence de stock.'); return; } }
    if(!body.type_objet){ pushNotif('err','fa-exclamation-circle','Choisissez le type d’objet.'); return; }
    var box=document.getElementById('mes_emp_box');
    if(box && box.getAttribute('data-fixe')!=='1'){
      var nzBox=document.getElementById('mes_nz_box');
      if(nzBox && nzBox.style.display!=='none'){
        // Saisie d’une nouvelle zone : la liste (grisée) n’est JAMAIS lue.
        var nz=stkVal('mes_nz');
        if(!nz){ pushNotif('err','fa-exclamation-circle', document.getElementById('mes_zone') ? 'Saisissez le nom de la nouvelle zone, ou revenez à la liste des zones.' : 'Saisissez la nouvelle zone pour ce type.'); var ni=document.getElementById('mes_nz'); if(ni) ni.focus(); return; }
        body.nouvelle_zone=nz;
      } else {
        var zone=stkVal('mes_zone');
        if(!zone){ pushNotif('err','fa-exclamation-circle','Choisissez la zone de rangement.'); return; }
        body.emplacement=zone;
      }
    }
    stkBusy(btn,true);
    stkApi('/api/stock/mise-en-stock/'+encodeURIComponent(l.id)+'/accepter','POST',body).then(function(j){
      if(!j||!j.ok){ stkBusy(btn,false); stkErreur(j,'Rangement refusé.'); return; }
      var msg='Rangé : <strong>'+stkEsc(j.reference)+'</strong> +'+stkEsc(stkFmt(j.quantite))+' '+stkEsc(j.unite||'')+' en « '+stkEsc(j.emplacement)+' »';
      if(j.stock_apres!=null) msg+=' · stock '+stkEsc(stkFmt(j.stock_apres));
      if(j.bdt_debloques>0) msg+=' · matière disponible : '+stkEsc(j.bdt_debloques)+' BDT débloqué(s)';
      else if(Number(j.manque_matiere)>0) msg+=' · porte matière encore fermée : '+stkEsc(stkFmt(j.manque_matiere))+' manquant(s) (renvoi sans remplacement)';
      notifDurable('ok','fa-dolly',msg,15000);
      stkAvertir(j);
      stkCloseModal();
      stkRecharger('mes');
    }).catch(function(){ stkBusy(btn,false); pushNotif('err','fa-exclamation-circle','Erreur réseau : rechargez la page avant de réessayer.'); });
  }
  function stkMesAnnuler(id, btn){
    var l=null; for(var i=0;i<STK_FILE.length;i++){ if(STK_FILE[i].id===id){ l=STK_FILE[i]; break; } }
    appMotif('Annuler la ligne « '+(l?(l.reference||l.designation):'')+' » de la liste à ranger ?\\nRien ne sera crédité au stock.', { title:'Annuler une ligne à ranger', min:3, okLabel:'Annuler la ligne' }).then(function(m){
      if(m===null) return;
      stkBusy(btn,true);
      stkApi('/api/stock/mise-en-stock/'+encodeURIComponent(id)+'/annuler','POST',{ motif:m }).then(function(j){
        if(!j||!j.ok){ stkBusy(btn,false); stkErreur(j,'Annulation refusée.'); return; }
        pushNotif('ok','fa-ban','Ligne annulée.'+(j.bdt_debloques>0?' Matière disponible : '+stkEsc(j.bdt_debloques)+' BDT débloqué(s).':''),3500);
        stkAvertir(j);
        stkRecharger('mes');
      }).catch(function(){ stkBusy(btn,false); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
    });
  }

  // ── Niveaux d’approvisionnement : type d’objet et emplacement fixe (historisé) ──
  function stkNivRemplirZones(tr){
    var sel=tr.querySelector('.sf-emp'); if(!sel) return;
    var type=tr.getAttribute('data-type')||''; var cur=tr.getAttribute('data-emp')||'';
    var zs=type?stkZonesDuType(type):[]; var dans=false;
    zs.forEach(function(z){ if(z.zone===cur) dans=true; });
    var h='<option value="">— aucun —</option>';
    if(cur && !dans) h+='<option value="'+stkEsc(cur)+'">'+stkEsc(cur)+' (hors liste)</option>';
    zs.forEach(function(z){ h+='<option value="'+stkEsc(z.zone)+'">'+stkEsc(z.zone)+'</option>'; });
    sel.innerHTML=h; sel.value=cur;
  }
  function stkNivType(sel){
    var tr=sel.closest('tr'); if(!tr) return;
    var id=tr.getAttribute('data-id'); var avant=tr.getAttribute('data-type')||''; var type=sel.value;
    if(!type){ sel.value=avant; pushNotif('err','fa-exclamation-circle','Le type d’objet d’une référence ne se vide pas.'); return; }
    sel.disabled=true;
    stkApi('/api/stock/'+encodeURIComponent(id)+'/emplacement','PATCH',{ type_objet:type }).then(function(j){
      sel.disabled=false;
      if(!j||!j.ok){ sel.value=avant; stkErreur(j,'Modification refusée.'); return; }
      tr.setAttribute('data-type',type);
      var a=stkArt(id); if(a) a.type_objet=type;
      stkNivRemplirZones(tr);
      pushNotif('ok','fa-tag','Type d’objet enregistré.',3000);
      stkAvertir(j);
    }).catch(function(){ sel.disabled=false; sel.value=avant; pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  function stkNivEmp(sel){
    var tr=sel.closest('tr'); if(!tr) return;
    var id=tr.getAttribute('data-id'); var avant=tr.getAttribute('data-emp')||''; var apres=sel.value; var ref=tr.getAttribute('data-ref')||'';
    if(apres===avant) return;
    if(!tr.getAttribute('data-type')){ sel.value=avant; pushNotif('err','fa-exclamation-circle','Choisissez d’abord le type d’objet de la référence.'); return; }
    appMotif('Déplacer « '+ref+' » de « '+(avant||'aucun emplacement')+' » vers « '+(apres||'aucun emplacement')+' » ?\\nLe changement est historisé (qui, quand, avant, après).', { title:'Changer l’emplacement fixe', min:0, placeholder:'Motif (facultatif)', okLabel:'Déplacer' }).then(function(m){
      if(m===null){ sel.value=avant; return; }
      sel.disabled=true;
      stkApi('/api/stock/'+encodeURIComponent(id)+'/emplacement','PATCH',{ emplacement:apres, motif:m||'' }).then(function(j){
        sel.disabled=false;
        if(!j||!j.ok){ sel.value=avant; stkErreur(j,'Déplacement refusé.'); return; }
        tr.setAttribute('data-emp',apres);
        var a=stkArt(id); if(a) a.emplacement=apres;
        pushNotif('ok','fa-location-dot','Emplacement modifié et historisé.',3500);
        stkAvertir(j);
      }).catch(function(){ sel.disabled=false; sel.value=avant; pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
    });
  }
  function stkNivHistorique(id){
    var a=stkArt(id);
    var ok=stkModal('<div style="font-weight:800;font-size:1rem;color:#111827;margin-bottom:12px;display:flex;align-items:center;gap:8px;"><i class="fas fa-clock-rotate-left" style="color:#0f766e;"></i>Historique des emplacements — '+stkEsc(a?(a.reference||a.nom):'')+'</div>'
      +'<div id="stk_hist_body" style="font-size:.8rem;color:#64748b;">Chargement…</div>'
      +'<div style="text-align:right;margin-top:14px;"><button type="button" onclick="stkCloseModal()" style="padding:8px 16px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Fermer</button></div>');
    if(!ok) return;
    stkApi('/api/stock/'+encodeURIComponent(id)+'/emplacement/historique','GET',null).then(function(j){
      var b=document.getElementById('stk_hist_body'); if(!b) return;
      if(!j||!j.ok){ b.innerHTML='<span style="color:#b91c1c;">'+stkEsc((j&&j.error)||'Lecture impossible.')+'</span>'; return; }
      if(!j.historique || !j.historique.length){ b.textContent='Aucun emplacement enregistré pour cette référence.'; return; }
      var h='<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:.74rem;"><thead><tr style="background:#f8fafc;"><th style="text-align:left;padding:6px;">Le</th><th style="text-align:left;padding:6px;">Avant</th><th style="text-align:left;padding:6px;">Après</th><th style="text-align:left;padding:6px;">Motif</th><th style="text-align:left;padding:6px;">Par</th></tr></thead><tbody>';
      j.historique.forEach(function(x){ h+='<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:5px 6px;white-space:nowrap;">'+stkEsc(stkDate(x.le))+'</td><td style="padding:5px 6px;">'+stkEsc(x.avant||'—')+'</td><td style="padding:5px 6px;font-weight:700;color:#0f766e;">'+stkEsc(x.apres||'—')+'</td><td style="padding:5px 6px;">'+stkEsc(x.motif||'')+'</td><td style="padding:5px 6px;">'+stkEsc(x.par||'')+'</td></tr>'; });
      b.innerHTML=h+'</tbody></table></div>';
    }).catch(function(){ var b=document.getElementById('stk_hist_body'); if(b) b.textContent='Erreur réseau.'; });
  }

  // ── Types d’objet & zones ──
  function stkTypeSave(code, btn){
    var tr=btn.closest('tr'); if(!tr) return;
    var body={ libelle:String((tr.querySelector('.ty-lib')||{}).value||'').trim(), ordre:(tr.querySelector('.ty-ord')||{}).value, actif:!!(tr.querySelector('.ty-act')||{}).checked };
    if(body.libelle.length<2){ pushNotif('err','fa-exclamation-circle','Libellé du type trop court.'); return; }
    stkBusy(btn,true);
    stkApi('/api/stock/types-objet/'+encodeURIComponent(code),'PATCH',body).then(function(j){
      if(!j||!j.ok){ stkBusy(btn,false); stkErreur(j,'Modification refusée.'); return; }
      pushNotif('ok','fa-save','Type d’objet enregistré.',3000); stkRecharger('mes-types');
    }).catch(function(){ stkBusy(btn,false); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  function stkTypeAdd(btn){
    var body={ libelle:stkVal('ty_new_lib'), ordre:stkVal('ty_new_ord') };
    if(body.libelle.length<2){ pushNotif('err','fa-exclamation-circle','Saisissez le libellé du nouveau type.'); return; }
    stkBusy(btn,true);
    stkApi('/api/stock/types-objet','POST',body).then(function(j){
      if(!j||!j.ok){ stkBusy(btn,false); stkErreur(j,'Création refusée.'); return; }
      pushNotif('ok','fa-plus','Type « '+stkEsc(j.type&&j.type.libelle)+' » ajouté.',3000); stkRecharger('mes-types');
    }).catch(function(){ stkBusy(btn,false); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  function stkZoneSave(id, btn){
    var tr=btn.closest('tr'); if(!tr) return;
    var body={ zone:String((tr.querySelector('.zo-nom')||{}).value||'').trim(), ordre:(tr.querySelector('.zo-ord')||{}).value, actif:!!(tr.querySelector('.zo-act')||{}).checked };
    if(!body.zone){ pushNotif('err','fa-exclamation-circle','Nom de zone obligatoire.'); return; }
    stkBusy(btn,true);
    stkApi('/api/stock/zones/'+encodeURIComponent(id),'PATCH',body).then(function(j){
      if(!j||!j.ok){ stkBusy(btn,false); stkErreur(j,'Modification refusée.'); return; }
      pushNotif('ok','fa-save','Zone enregistrée.',3000); stkRecharger('mes-types');
    }).catch(function(){ stkBusy(btn,false); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  function stkZoneAdd(type, btn){
    var inp=btn.parentNode ? btn.parentNode.querySelector('.zo-new') : null;
    var zone=inp ? String(inp.value||'').trim() : '';
    if(!zone){ pushNotif('err','fa-exclamation-circle','Saisissez le nom de la zone.'); return; }
    stkBusy(btn,true);
    stkApi('/api/stock/zones','POST',{ type_objet:type, zone:zone }).then(function(j){
      if(!j||!j.ok){ stkBusy(btn,false); stkErreur(j,'Création refusée.'); return; }
      pushNotif('ok','fa-location-dot', j.existante ? 'Cette zone existait déjà pour ce type.' : 'Zone ajoutée.',3000); stkRecharger('mes-types');
    }).catch(function(){ stkBusy(btn,false); pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }

  // ── Délégation d’événements (aucune donnée de la base dans un attribut onclick) ──
  document.addEventListener('click', function(e){
    var el=(e.target && e.target.closest) ? e.target.closest('[data-act]') : null;
    if(!el) return;
    if(el.tagName==='A') e.preventDefault();
    if(el.disabled) return;
    var act=el.getAttribute('data-act'); var id=el.getAttribute('data-id');
    if(act==='mes-accepter') stkOuvrirRangement(id);
    else if(act==='mes-annuler') stkMesAnnuler(id, el);
    else if(act==='mes-valider') stkMesValider(el);
    else if(act==='mes-nz-toggle'){
      var b=document.getElementById('mes_nz_box'); if(!b) return;
      var visible=b.style.display!=='none'; b.style.display=visible?'none':'block';
      var s=document.getElementById('mes_zone'), n=document.getElementById('mes_nz'), lien=document.getElementById('mes_nz_lien');
      if(!visible){
        // Vers la saisie : la liste est vidée et grisée (sa valeur ne sera pas envoyée).
        if(s){ s.value=''; s.disabled=true; }
        if(lien) lien.innerHTML='<i class="fas fa-list"></i> Revenir à la liste des zones';
        if(n) n.focus();
      } else {
        if(s) s.disabled=false;
        if(n) n.value='';
        if(lien) lien.innerHTML='<i class="fas fa-plus"></i> Nouvelle zone pour ce type';
      }
    }
    else if(act==='entree-valider') stkEntreeValider(el);
    else if(act==='sortie-valider') stkSortieValider(el);
    else if(act==='ajust-valider') stkAjustValider(el);
    else if(act==='entree-rapide') stkEntreeRapide(id);
    else if(act==='sortie-rapide') stkSortieRapide(id);
    else if(act==='niv-hist') stkNivHistorique(id);
    else if(act==='type-save') stkTypeSave(el.getAttribute('data-code'), el);
    else if(act==='type-add') stkTypeAdd(el);
    else if(act==='zone-save') stkZoneSave(id, el);
    else if(act==='zone-add') stkZoneAdd(el.getAttribute('data-type'), el);
  });
  document.addEventListener('change', function(e){
    var t=e.target; if(!t || !t.getAttribute) return;
    var act=t.getAttribute('data-act-change');
    if(act==='niv-type') stkNivType(t);
    else if(act==='niv-emp') stkNivEmp(t);
    else if(t.id==='mes_type' || t.id==='mes_ref') stkMesMajEmplacement();
    else if(t.id==='ent_ref') stkEntreeRefConnue();
  });
  // Crée une vraie DA depuis un article en alerte → arrive dans « DA à traiter » des Achats
  function stkCreerDA(id){
    var a=STK_ARTS.find(function(x){return x.id===id;})||{};
    var payload={ article:(a.nom||'Article')+(a.reference?' ('+a.reference+')':''), type_da:'Matière', qte:(a.qte!=null?String(a.qte):'')+(a.unite?' '+a.unite:''), fournisseur:a.fournisseur||'', priorite:'urgent', demandeur:'Stock' };
    fetch('/api/achats/da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Création DA échouée.'); return; }
        pushNotif('ok','fa-shopping-cart','DA <strong>'+j.da.id+'</strong> créée et transmise aux Achats (à traiter).',5500);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  // Création manuelle d'une DA hors alerte (bouton « Nouvelle DA »)
  function stkSubmitDA(){
    var article=document.getElementById('sda_article').value.trim();
    if(!article){ pushNotif('err','fa-exclamation-circle','La désignation est requise.'); return; }
    var payload={ article:article, type_da:document.getElementById('sda_type').value, qte:document.getElementById('sda_qte').value.trim(), fournisseur:document.getElementById('sda_fourn').value.trim(), priorite:document.getElementById('sda_prio').value, livraison:document.getElementById('sda_liv').value||null, affaire_id:document.getElementById('sda_aff').value.trim()||null, demandeur:'Stock' };
    fetch('/api/achats/da',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json();}).then(function(j){
        if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Création DA échouée.'); return; }
        stkCloseModal(); pushNotif('ok','fa-shopping-cart','DA <strong>'+j.da.id+'</strong> créée → Achats (à traiter).',5500);
      }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
  }
  function modalDAHTML(){
    var i='width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;box-sizing:border-box;';
    var l='display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;';
    return '<div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:18px;display:flex;align-items:center;gap:8px;"><i class="fas fa-shopping-cart" style="color:${GRN};"></i>Nouvelle demande d\\'achat</div>'+
      '<div style="margin-bottom:12px;"><label style="'+l+'">Article / Désignation *</label><input id="sda_article" type="text" placeholder="ex : Barres alu 2024-T3 Ø30" style="'+i+'"/></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'+
        '<div style="margin-bottom:12px;"><label style="'+l+'">Type</label><select id="sda_type" style="'+i+'"><option>Matière</option><option>Outillage</option><option>Consommable</option><option>Chimique</option><option>Sous-traitance</option></select></div>'+
        '<div style="margin-bottom:12px;"><label style="'+l+'">Quantité</label><input id="sda_qte" type="text" placeholder="ex : 12 barres" style="'+i+'"/></div>'+
        '<div style="margin-bottom:12px;"><label style="'+l+'">Fournisseur</label><input id="sda_fourn" type="text" placeholder="Nom" style="'+i+'"/></div>'+
        '<div style="margin-bottom:12px;"><label style="'+l+'">Priorité</label><select id="sda_prio" style="'+i+'"><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critique">Critique</option></select></div>'+
        '<div style="margin-bottom:12px;"><label style="'+l+'">Livraison souhaitée</label><input id="sda_liv" type="date" style="'+i+'"/></div>'+
        '<div style="margin-bottom:12px;"><label style="'+l+'">N° affaire (option)</label><input id="sda_aff" type="text" placeholder="AFF-2026-XXX" style="'+i+'"/></div>'+
      '</div>'+
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">'+
        '<button onclick="stkCloseModal()" style="padding:9px 18px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'+
        '<button onclick="stkSubmitDA()" style="padding:9px 18px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i class="fas fa-plus" style="margin-right:5px;"></i>Créer la DA</button>'+
      '</div>';
  }
  // Restauration de l’onglet (hash : mes, mes-ajustement, mes-types, rt, gestion-entree…, mvts…) + masquage des vides
  (function(){ try{
    document.querySelectorAll('.stk-vides-cb').forEach(function(cb){ cb.checked=stkMasquerVides; });
    stkApplyFilters(); stkApplyNiveaux();
    var h=(location.hash||'').replace('#','');
    var p=h.split('-'); var t=p[0]; var s=p.slice(1).join('-');
    if(STK_TABS.indexOf(t)<0){ t='mes'; s=''; }
    stkShowTab(t, true);
    if(t==='gestion' && s) stkSwitchGestion(s, true);
    if(t==='mes' && s) stkSwitchMes(s, true);
  }catch(e){} })();
  </script>

  <style>
  .stk-filter-btn{padding:5px 12px;border:none;border-radius:6px;background:transparent;color:#64748b;font-size:.76rem;font-weight:600;cursor:pointer;transition:all .15s;}
  .stk-f-active{background:${GRN};color:white !important;font-weight:700;}
  .stk-cat-btn{padding:4px 10px;border:1.5px solid #e2e8f0;border-radius:999px;background:#f8fafc;color:#6b7280;font-size:.7rem;font-weight:600;cursor:pointer;transition:all .15s;}
  .stk-cat-active{border-color:${GRN}80;background:${GRN}15;color:${GRN_D};font-weight:700;}
  .stk-root button:disabled,.stk-root select:disabled{opacity:.45;cursor:not-allowed;}
  </style>`

  return layout('Service Stock', content + demandeAchatModal('Stock', '#0ea5e9'), 'service-stock')
}
