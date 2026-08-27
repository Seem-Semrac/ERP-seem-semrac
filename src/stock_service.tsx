// ══════════════════════════════════════════════════════════════
// SERVICE STOCK – Vue unifiée Seem + Semrac
// Stock temps réel · Gestion (supply chain) · Alertes · Dashboard
// ══════════════════════════════════════════════════════════════
import { escX, layout, serviceHeader, demandeAchatModal } from './shared'
import type { ArticleStock, MouvementStock, StatutStock } from './types'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

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
  <div id="stk-panel-rt" style="display:block;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
      <div style="font-size:1rem;font-weight:800;color:#111827;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-warehouse" style="color:${GRN};"></i>Stock en temps reel
        <span style="background:${GRN}20;color:${GRN_D};border-radius:999px;padding:1px 10px;font-size:.72rem;font-weight:800;">${arts.length} references</span>
      </div>
      <button onclick="stkOpenModal('article')" style="padding:8px 18px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;"><i class="fas fa-plus"></i>Ajouter article</button>
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
      <input type="text" placeholder="Rechercher article, ref…" oninput="stkSearch(this.value)" style="border:1.5px solid #e2e8f0;border-radius:8px;padding:6px 12px;font-size:.8rem;background:#f8fafc;outline:none;min-width:220px;margin-left:auto;"/>
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
            <tr data-statut="${s}" data-activite="${a.activite}" data-categorie="${a.categorie}" data-art="1"
                style="border-bottom:1px solid #f9fafb;${s==='critique'?'background:#fff5f5;':''}"
                onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='${s==='critique'?'#fff5f5':''}'">
              <td style="padding:8px 12px;vertical-align:middle;">
                <div style="font-weight:700;font-size:.8rem;color:#111827;">${escX(a.nom)}</div>
                <div style="font-size:.65rem;font-family:monospace;color:#9ca3af;">${a.reference != null ? escX(a.reference) : '—'}</div>
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
                  <button onclick="stkEntreeRapide('${a.id}')" title="Entree stock" style="padding:5px 8px;background:#dcfce7;color:#15803d;border:none;border-radius:6px;font-size:.68rem;cursor:pointer;font-weight:700;"><i class="fas fa-arrow-down"></i></button>
                  <button onclick="stkSortieRapide('${a.id}')" title="Sortie stock" style="padding:5px 8px;background:#fee2e2;color:#b91c1c;border:none;border-radius:6px;font-size:.68rem;cursor:pointer;font-weight:700;"><i class="fas fa-arrow-up"></i></button>
                  ${(s==='critique'||s==='bas') ? `<button onclick="stkCreerDA('${a.id}')" title="Creer DA" style="padding:5px 8px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:6px;font-size:.68rem;cursor:pointer;font-weight:700;"><i class="fas fa-shopping-cart"></i></button>` : ''}
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

function panelGestion(arts: ArticleStock[], mvts: MouvementStock[], fourn: any[] = []) {
  const recentMvts = mvts.slice(0, 8)
  const artOptions = arts.map(a => `${a.nom} (${a.quantite} ${a.unite})`).join('|')
  const artIds     = arts.map(a => a.nom).join('|')

  // Catalogue fournisseurs (jsonb) agrégé puis groupé par catégorie, avec le niveau de stock temps réel (match par réf)
  const catParse = (raw: any): any[] => {
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string' && raw.trim()) { try { const o = JSON.parse(raw); return Array.isArray(o) ? o : (o?.items || []) } catch { return [] } }
    return []
  }
  const stockByRef: Record<string, ArticleStock> = {}
  arts.forEach(a => { if (a.reference) stockByRef[String(a.reference).toLowerCase().trim()] = a })
  const catByCat: Record<string, any[]> = {}
  ;(fourn || []).forEach((f: any) => {
    catParse(f.catalogue).forEach((it: any) => {
      if (!it || (!it.ref && !it.designation)) return
      const cat = String(it.categorie || f.categorie || 'Autres')
      const st = stockByRef[String(it.ref || '').toLowerCase().trim()]
      ;(catByCat[cat] = catByCat[cat] || []).push({ ref: it.ref || '', designation: it.designation || '', prix: it.prix_moyen_ht, unite: it.unite || (st ? st.unite : ''), fournisseur: f.nom, stock: st ? st.quantite : null })
    })
  })
  const catKeys = Object.keys(catByCat).sort()
  const catLbl: Record<string,string> = { matiere: 'Matière', accessoire: 'Accessoires' }

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
      ${[['entree','Entrée stock','fa-arrow-down-to-bracket','#10b981','#059669'],['sortie','Sortie stock','fa-arrow-up-from-bracket','#f43f5e','#e11d48'],['ajustement','Ajustement / Inventaire','fa-scale-balanced','#3b82f6','#2563eb'],['catalogue','Catalogue & seuils','fa-sliders','#8b5cf6','#7c3aed']].map(([id,lbl,ic,c1,c2],i) => `
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
          <div style="font-size:.85rem;font-weight:800;color:#111827;margin-bottom:16px;display:flex;align-items:center;gap:6px;"><i class="fas fa-arrow-down" style="color:${GRN};"></i>Saisir une entree</div>
          <div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Article</div>
          <select id="gest-entree-art" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;margin-bottom:12px;">
            <option value="">-- Choisir article --</option>
            ${arts.map(a=>`<option value="${escX(a.id)}">${escX(a.nom)} (stock: ${a.quantite} ${escX(a.unite)})</option>`).join('')}
          </select>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div>
              <div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Quantite recue</div>
              <input type="number" id="gest-entree-qte" placeholder="0" min="0" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"/>
            </div>
            <div>
              <div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Date reception</div>
              <input type="date" id="gest-entree-date" value="${TODAY}" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"/>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div>
              <div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">BL fournisseur</div>
              <input type="text" placeholder="BLF-2026-XXX" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"/>
            </div>
            <div>
              <div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">DA liee</div>
              <input type="text" placeholder="DA-2026-XXX" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"/>
            </div>
          </div>
          <div>
            <div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Operateur</div>
            <input type="text" placeholder="Nom operateur" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;margin-bottom:16px;"/>
          </div>
          <button onclick="stkConfirmerEntree()" style="width:100%;padding:10px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:10px;font-weight:700;font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><i class="fas fa-check"></i>Valider entree</button>
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
          <div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Article</div>
          <select style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;margin-bottom:12px;">
            <option value="">-- Choisir article --</option>
            ${arts.map(a=>`<option value="${escX(a.id)}">${escX(a.nom)} (stock: ${a.quantite} ${escX(a.unite)})</option>`).join('')}
          </select>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div><div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Quantite sortie</div>
            <input type="number" placeholder="0" min="0" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"/></div>
            <div><div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Date</div>
            <input type="date" value="${TODAY}" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"/></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div><div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Reference BDT / LOT / CMD</div>
            <input type="text" placeholder="BDT-XXX ou CMD-2026-XXX" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"/></div>
            <div><div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Operateur</div>
            <input type="text" placeholder="Nom operateur" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"/></div>
          </div>
          <div><div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Motif</div>
          <select style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;margin-bottom:16px;">
            <option>Consommation production</option><option>Rebut / casse</option><option>Retour fournisseur</option><option>Transfert inter-atelier</option>
          </select></div>
          <button onclick="stkConfirmerSortie()" style="width:100%;padding:10px;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:10px;font-weight:700;font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><i class="fas fa-check"></i>Valider sortie</button>
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

    <!-- AJUSTEMENT / INVENTAIRE -->
    <div id="stk-gest-panel-ajustement" style="display:none;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:24px;">
          <div style="font-size:.85rem;font-weight:800;color:#111827;margin-bottom:12px;display:flex;align-items:center;gap:6px;"><i class="fas fa-balance-scale" style="color:#f59e0b;"></i>Ajustement / Inventaire physique</div>
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;margin-bottom:14px;font-size:.75rem;color:#92400e;">Utiliser lors d&#39;un ecart entre stock theorique et inventaire physique, perte, ou correction d&#39;erreur de saisie.</div>
          <div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Article</div>
          <select style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;margin-bottom:12px;">
            <option>-- Choisir article --</option>
            ${arts.map(a=>`<option>${escX(a.nom)} (stock: ${a.quantite} ${escX(a.unite)})</option>`).join('')}
          </select>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div><div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Stock reel constate</div>
            <input type="number" placeholder="Quantite reelle" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"/></div>
            <div><div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Date inventaire</div>
            <input type="date" value="${TODAY}" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"/></div>
          </div>
          <div><div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Motif</div>
          <select style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;margin-bottom:12px;">
            <option>Inventaire physique periodique</option><option>Ecart constate</option><option>Perte / deterioration</option><option>Correction erreur de saisie</option>
          </select></div>
          <div><div style="font-size:.7rem;color:#6b7280;text-transform:uppercase;font-weight:700;margin-bottom:.3rem;">Responsable inventaire</div>
          <input type="text" placeholder="Nom du responsable" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;margin-bottom:16px;"/></div>
          <button onclick="stkConfirmerAjustement()" style="width:100%;padding:10px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;border-radius:10px;font-weight:700;font-size:.85rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><i class="fas fa-check"></i>Valider ajustement</button>
        </div>
        <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);padding:24px;">
          <div style="font-size:.85rem;font-weight:800;color:#111827;margin-bottom:16px;">Historique complet mouvements</div>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:.75rem;">
              <thead><tr style="background:#f8fafc;">
                <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:700;">Date</th>
                <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:700;">Article</th>
                <th style="text-align:center;padding:6px 8px;color:#64748b;font-weight:700;">Type</th>
                <th style="text-align:center;padding:6px 8px;color:#64748b;font-weight:700;">Qt</th>
                <th style="text-align:left;padding:6px 8px;color:#64748b;font-weight:700;">Operateur</th>
              </tr></thead>
              <tbody>
                ${recentMvts.slice(0,10).map(m=>`
                <tr style="border-bottom:1px solid #f8fafc;">
                  <td style="padding:5px 8px;color:#6b7280;white-space:nowrap;">${m.date_mvt}</td>
                  <td style="padding:5px 8px;font-weight:600;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escX(m.article_nom)}</td>
                  <td style="padding:5px 8px;text-align:center;">${mvtTypeBadge(m.type)}</td>
                  <td style="padding:5px 8px;text-align:center;font-weight:700;color:${m.type==='entree'?GRN_D:m.type==='sortie'?'#b91c1c':'#92400e'};">${m.type==='entree'?'+':''}${m.quantite}</td>
                  <td style="padding:5px 8px;color:#6b7280;font-size:.68rem;">${m.operateur != null ? escX(m.operateur) : '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- CATALOGUE & SEUILS -->
    <div id="stk-gest-panel-catalogue" style="display:none;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="font-size:.85rem;font-weight:800;color:#111827;">Catalogue articles et parametrage des seuils</div>
        <button onclick="stkOpenModal('article')" style="padding:7px 16px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;"><i class="fas fa-plus"></i> Nouvel article</button>
      </div>
      <div style="background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:.76rem;">
            <thead><tr style="background:#f8fafc;border-bottom:2px solid #f1f5f9;">
              ${['Article','Activité','Stock','Seuil mini','Pt commande','Qté cmd','Réappro auto','Fournisseur','Action'].map((h,i)=>`<th style="text-align:${i===0||i===7?'left':'center'};padding:9px 10px;color:#64748b;font-weight:700;text-transform:uppercase;font-size:.65rem;white-space:nowrap;">${h}</th>`).join('')}
            </tr></thead>
            <tbody>
              ${arts.length ? arts.map(a=>`
              <tr class="seuil-row" data-id="${escX(a.id)}" style="border-bottom:1px solid #f9fafb;">
                <td style="padding:7px 10px;font-weight:700;color:#111827;">${escX(a.nom)}<div style="font-size:.62rem;font-family:monospace;color:#9ca3af;">${a.reference != null ? escX(a.reference) : ''}</div></td>
                <td style="padding:7px 10px;text-align:center;">${activiteBadge(a.activite)}</td>
                <td style="padding:7px 10px;text-align:center;font-weight:800;color:#111827;">${a.quantite}<span style="font-size:.6rem;color:#9ca3af;"> ${escX(a.unite)}</span></td>
                <td style="padding:7px 10px;text-align:center;"><input class="sf-mini" type="number" step="0.01" value="${a.seuil_mini}" style="width:60px;border:1.5px solid #e2e8f0;border-radius:6px;padding:4px;font-size:.74rem;text-align:center;outline:none;"/></td>
                <td style="padding:7px 10px;text-align:center;"><input class="sf-pc" type="number" step="0.01" value="${a.point_commande}" style="width:60px;border:1.5px solid #fed7aa;border-radius:6px;padding:4px;font-size:.74rem;text-align:center;outline:none;"/></td>
                <td style="padding:7px 10px;text-align:center;"><input class="sf-qc" type="number" step="0.01" value="${a.qte_commande ?? ''}" style="width:60px;border:1.5px solid #e2e8f0;border-radius:6px;padding:4px;font-size:.74rem;text-align:center;outline:none;"/></td>
                <td style="padding:7px 10px;text-align:center;"><input class="sf-auto" type="checkbox" ${(a as any).auto_reappro?'checked':''} title="DA générée automatiquement quand le stock passe sous le point de commande" style="width:17px;height:17px;accent-color:${GRN_D};cursor:pointer;"/></td>
                <td style="padding:7px 10px;color:#6b7280;font-size:.72rem;">${a.fournisseur != null ? escX(a.fournisseur) : '—'}</td>
                <td style="padding:7px 10px;text-align:center;"><button onclick="stkSaveSeuils('${escX(a.id)}',this)" title="Enregistrer les seuils" style="padding:5px 11px;background:${GRN}1a;color:${GRN_D};border:1px solid ${GRN}55;border-radius:7px;font-size:.7rem;font-weight:700;cursor:pointer;"><i class="fas fa-save"></i></button></td>
              </tr>`).join('') : `<tr><td colspan="9" style="padding:36px;text-align:center;color:#9ca3af;font-size:.82rem;">Aucun article en stock — les seuils se configureront ici une fois des références enregistrées.</td></tr>`}
            </tbody>
          </table>
        </div>
        <div style="padding:10px 16px;background:#fff7ed;border-top:1px solid #fed7aa;font-size:.72rem;color:#b45309;"><i class="fas fa-robot" style="margin-right:6px;"></i>Cochez <strong>Réappro auto</strong> pour qu'une <strong>demande d'achat soit créée automatiquement</strong> quand le stock passe sous le point de commande (uniquement pour les références cochées).</div>
      </div>

      <!-- F : catalogue de tous les fournisseurs, classé par catégorie, avec stock temps réel -->
      <div style="font-size:.85rem;font-weight:800;color:#111827;margin:24px 0 12px;display:flex;align-items:center;gap:8px;"><i class="fas fa-layer-group" style="color:#8b5cf6;"></i>Catalogue fournisseurs par catégorie<span style="font-size:.68rem;color:#9ca3af;font-weight:600;">· toutes les références fournisseurs · stock temps réel</span></div>
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
      </div>`).join('') : `<div style="background:white;border-radius:12px;padding:28px;text-align:center;color:#9ca3af;font-size:.82rem;box-shadow:0 1px 3px rgba(0,0,0,.07);">Aucune référence au catalogue fournisseurs. Renseignez le catalogue dans les fiches fournisseurs (Achats › Fournisseurs).</div>`}
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
    if (m.bdt_id) return ['BDT ' + m.bdt_id, '#6366f1', 'fa-screwdriver-wrench']
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
      <td style="padding:9px 12px;"><span style="display:inline-flex;align-items:center;gap:5px;background:${sc}14;color:${sc};border-radius:7px;padding:3px 9px;font-size:.7rem;font-weight:700;"><i class="fas ${si}"></i>${sl}</span></td>
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
  dbFournisseurs?: any[],
) => {
  // Stock RÉEL : si la DB renvoie des articles on les utilise (même tableau vide = pas de démo).
  const ARTS = dbArts ?? []
  const MVTS = dbMvts ?? []
  const FOURN = dbFournisseurs ?? []

  const TABS = [
    ['rt',       'Stock en temps reel',        'fa-warehouse'],
    ['gestion',  'Gestion du stock',            'fa-sliders-h'],
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
      tabs: TABS.map(([id,lbl,ic]) => ({ id, label: lbl, icon: ic, badge: id==='rt' ? (ARTS.length || undefined) : id==='mvts' ? (MVTS.length || undefined) : (id==='alertes' && nCrit>0) ? nCrit : undefined })),
      switchFn: 'stkShowTab',
      tabIdPrefix: 'stk-tab',
      activeId: 'rt'
    })}

    <div style="padding:22px 30px;">
      ${panelTempsReel(ARTS)}
      ${panelGestion(ARTS, MVTS, FOURN)}
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
  var STK_TABS=['rt','gestion','mvts','alertes','dashboard'];
  var STK_ARTS=${sjX(ARTS.map((a: any) => ({ id:a.id, nom:a.nom, reference:a.reference||'', qte:(a.qte_commande ?? Math.round(((a.seuil_maxi||0)-(a.quantite||0))*0.8)) || '', unite:a.unite||'', fournisseur:a.fournisseur||'' })))};
  var stkActFilter='all', stkStatFilter='all', stkCatFilter='all', stkSearch__q='';

  function stkShowTab(id){
    STK_TABS.forEach(function(t){
      var p=document.getElementById('stk-panel-'+t);
      var b=document.getElementById('stk-tab-'+t);
      if(p) p.style.display=(t===id)?'block':'none';
      if(b) b.classList.toggle('active',t===id);
    });
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

  function stkSwitchGestion(id){
    ['entree','sortie','ajustement','catalogue'].forEach(function(p){
      var el=document.getElementById('stk-gest-panel-'+p);
      var btn=document.getElementById('stk-gest-'+p);
      if(el) el.style.display=(p===id)?'block':'none';
      if(btn) btn.classList.toggle('exp-sub-active',p===id);
    });
  }

  function stkApplyFilters(){
    var rows=document.querySelectorAll('#stk-tbody tr[data-art]');
    rows.forEach(function(tr){
      var actOK = stkActFilter==='all' || tr.dataset.activite===stkActFilter || tr.dataset.activite==='both';
      var stOK  = stkStatFilter==='all'|| tr.dataset.statut===stkStatFilter;
      var catOK = stkCatFilter==='all' || tr.dataset.categorie===stkCatFilter;
      var srOK  = !stkSearch__q || tr.textContent.toLowerCase().indexOf(stkSearch__q)>=0;
      tr.style.display=(actOK&&stOK&&catOK&&srOK)?'':'none';
    });
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
    if(type==='article') box.innerHTML=modalArticleHTML();
    else if(type==='da') box.innerHTML=modalDAHTML();
  }

  function stkCloseModal(){
    var o=document.getElementById('stk-modal-overlay');
    if(o) o.style.display='none';
  }

  document.addEventListener('click',function(e){
    var o=document.getElementById('stk-modal-overlay');
    if(e.target===o) stkCloseModal();
  });

  function stkEntreeRapide(id){ pushNotif('ok','fa-arrow-down','Entree stock enregistree. Stock mis a jour.',4000); }
  function stkSortieRapide(id){ pushNotif('ok','fa-arrow-up','Sortie stock enregistree. Stock mis a jour.',4000); }
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
  function stkConfirmerEntree(){ pushNotif('ok','fa-check-circle','Entree validee. Stock et historique mis a jour.',5000); }
  function stkConfirmerSortie(){ pushNotif('ok','fa-check-circle','Sortie validee. Stock et historique mis a jour.',5000); }
  function stkConfirmerAjustement(){ pushNotif('ok','fa-balance-scale','Ajustement valide. Ecart trace dans le journal.',5000); }

  function fldS(label,type,placeholder){
    if(type==='select') return '<div style="margin-bottom:12px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">'+label+'</label><select style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;"><option value="">-- Choisir --</option>'+placeholder.split('|').map(function(o){return '<option>'+o+'</option>';}).join('')+'</select></div>';
    return '<div style="margin-bottom:12px;"><label style="display:block;font-size:.7rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:.3rem;">'+label+'</label><input type="'+type+'" placeholder="'+(placeholder||'')+'" style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:.45rem .75rem;font-size:.83rem;outline:none;box-sizing:border-box;"/></div>';
  }

  function fldRow2S(a,b){ return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'+a+b+'</div>'; }

  function stkSaveArticle(){ pushNotif('ok','fa-warehouse','Article ajoute au catalogue. Seuils enregistres.',5000); stkCloseModal(); }

  function modalArticleHTML(){
    return '<div style="font-weight:800;font-size:1.05rem;color:#111827;margin-bottom:20px;display:flex;align-items:center;gap:8px;"><i class="fas fa-warehouse" style="color:${GRN};"></i>Ajouter un article au catalogue</div>'+
    fldS('Designation (nom complet)','text','ex: Barres alu 2024-T3 Ø30')+
    fldRow2S(fldS('Reference','text','REF-XXX'),fldS('Activite','select','Seem|Semrac|both'))+
    fldRow2S(fldS('Categorie','select','matiere_premiere|consommable|chimique|emballage|securite|outillage|piece_rechange'),fldS('Unite','select','kg|L|pcs|m|bobine|bouteille|rouleau|paire|palette'))+
    fldS('Fournisseur prefere','text','Nom fournisseur')+
    fldRow2S(fldS('Seuil mini (stock securite)','number','0'),fldS('Point de commande','number','0'))+
    fldRow2S(fldS('Seuil maxi','number','100'),fldS('Quantite a commander (EOQ)','number','0'))+
    fldRow2S(fldS('Prix unitaire HT (EUR)','number','0'),fldS('Delai fournisseur (jours)','number','7'))+
    fldS('Emplacement magasin','text','ex: Rack A1 / Armoire C2')+
    '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:20px;">'+
    '<button onclick="stkCloseModal()" style="padding:9px 20px;background:#f1f5f9;color:#374151;border:none;border-radius:8px;font-weight:600;cursor:pointer;">Annuler</button>'+
    '<button onclick="stkSaveArticle()" style="padding:9px 20px;background:linear-gradient(135deg,${GRN},${GRN_D});color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Ajouter article</button>'+
    '</div>';
  }
  </script>

  <style>
  .stk-filter-btn{padding:5px 12px;border:none;border-radius:6px;background:transparent;color:#64748b;font-size:.76rem;font-weight:600;cursor:pointer;transition:all .15s;}
  .stk-f-active{background:${GRN};color:white !important;font-weight:700;}
  .stk-cat-btn{padding:4px 10px;border:1.5px solid #e2e8f0;border-radius:999px;background:#f8fafc;color:#6b7280;font-size:.7rem;font-weight:600;cursor:pointer;transition:all .15s;}
  .stk-cat-active{border-color:${GRN}80;background:${GRN}15;color:${GRN_D};font-weight:700;}
  </style>`

  return layout('Service Stock', content + demandeAchatModal('Stock', '#0ea5e9'), 'service-stock')
}
