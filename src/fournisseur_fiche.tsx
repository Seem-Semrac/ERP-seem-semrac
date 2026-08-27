// ══════════════════════════════════════════════════════════════
// FICHE DÉTAILLÉE — Fournisseur / Sous-traitant
// Catalogue produits · Prix · Conditions standards · Activité Seem/Semrac
// ══════════════════════════════════════════════════════════════
import { layout, interlocuteursPanel, bulkToolbar, bulkSelectAssets } from './shared'

// ─── Catégories normalisées ────────────────────────────────────
export const CATEGORIES_FOURNISSEURS = [
  'Matière première',
  'Visserie / Boulonnerie',
  'Outillage',
  'Consommables',
  'Produits chimiques',
  'Emballage',
  'Transport',
  'EPI / Sécurité',
  'Électronique / Câblage',
  'Autres',
] as const

export const CATEGORIES_SOUSTRAITANTS = [
  'Finition / Traitement surface',
  'Mécanique générale',
  'Soudure',
  'Découpe laser / eau',
  'Pliage / Emboutissage',
  'Contrôle / Qualité',
  'Logistique / Transport',
  'Études / Engineering',
  'Autres',
] as const

const ACTIVITES = ['Seem', 'Semrac', 'both'] as const

// ─── Listes paiement (créables — comme côté clients) ──────────
const MODES_REGLEMENT = ['Virement', 'Chèque', 'Prélèvement', 'Traite / LCR', 'Carte bancaire', 'Espèces'] as const
const CONDITIONS_PAIEMENT = ['Comptant', 'À réception', '30 jours', '30 jours fin de mois', '45 jours fin de mois', '60 jours', 'Paiement à la commande (proforma)'] as const

export function parseCatalogue(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const obj = JSON.parse(raw)
      if (Array.isArray(obj)) return obj
      if (obj && Array.isArray(obj.items)) return obj.items
    } catch (_e) { /* ignore */ }
  }
  return []
}

function activiteBadge(a: string) {
  const m: Record<string, [string, string, string]> = {
    Seem:   ['#dbeafe', '#1d4ed8', 'Seem'],
    Semrac: ['#fce7f3', '#be185d', 'Semrac'],
    both:   ['#ede9fe', '#6d28d9', 'Seem & Semrac'],
  }
  const [bg, co, l] = m[a] || ['#f1f5f9', '#475569', a || '—']
  return `<span style="background:${bg};color:${co};border-radius:6px;padding:2px 8px;font-size:.66rem;font-weight:700;">${l}</span>`
}

// ══════════════════════════════════════════════════════════════
// PAGE FICHE
// ══════════════════════════════════════════════════════════════
export function pageFournisseurFiche(entity: any, isSt: boolean = false, dbStockArticles: any[] = [], opts: { otd?: any; categoriesExistantes?: string[]; operationsExistantes?: string[]; produits?: any[] } = {}) {
  const type = isSt ? 'sous-traitant' : 'fournisseur'
  const apiPath = isSt ? '/api/sous-traitants' : '/api/fournisseurs'
  const backHref = '/achats/service#fourn'
  const couleurPrimaire = isSt ? '#7c3aed' : '#6366f1'
  const couleurSecondaire = isSt ? '#6d28d9' : '#4f46e5'
  const titre = entity?.nom || (isSt ? 'Sous-traitant' : 'Fournisseur')
  const catalogue = parseCatalogue(entity?.catalogue)
  // Catégories = liste figée selon le type ∪ valeurs déjà présentes en base (datalist créable)
  const baseCats = isSt ? CATEGORIES_SOUSTRAITANTS : CATEGORIES_FOURNISSEURS
  const categories = Array.from(new Set([...baseCats, ...(opts.categoriesExistantes || [])])).filter(Boolean)
  const operationsExistantes = Array.from(new Set(opts.operationsExistantes || [])).filter(Boolean)
  const activite = entity?.activite || 'both'
  const categorie = entity?.categorie || 'Autres'
  const conditions = entity?.conditions_standards || ''
  const otdStats = opts.otd || null
  const otdMethode = entity?.otd_methode || 'bc_bl'
  const modeReglement = entity?.mode_reglement || ''
  const famArr = Array.isArray(entity?.familles_fourniture) ? entity.familles_fourniture : []
  const FAM_OPTS: [string, string][] = [['matiere', 'Matière'], ['accessoire', 'Accessoires'], ['outils', 'Outils'], ['chimique', 'Produits chimiques'], ['consommable', 'Consommable'], ['autres', 'Autres']]
  const PRODUITS: any[] = opts.produits || []
  const pfEsc = (s: any) => String(s ?? '').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  const PF_CATS: Record<string, string> = { matiere_premiere: 'Matière', accessoire: 'Accessoires', outillage: 'Outils', chimique: 'Chimique', consommable: 'Consommable', autre: 'Autres' }
  const pfCatLabel = (c: string) => PF_CATS[c] || c || '—'

  const FINP = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;color:#374151;'
  const FLBL = 'display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'

  // ─── Catalogue rows ─────────────────────────────────────────
  const catalogueRowsHtml = catalogue.map((it: any, i: number) => `
  <tr class="cat-row" data-idx="${i}">
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;">
      <input class="cat-ref" data-idx="${i}" type="text" value="${(it.ref || '').replace(/"/g, '&quot;')}" style="${FINP}font-family:monospace;font-weight:700;"/>
    </td>
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;">
      <input class="cat-designation" data-idx="${i}" type="text" value="${(it.designation || '').replace(/"/g, '&quot;')}" style="${FINP}"/>
    </td>
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;">
      <select class="cat-categorie" data-idx="${i}" style="${FINP}">
        <option value=""${!it.categorie ? ' selected' : ''}>—</option>
        <option value="matiere"${it.categorie === 'matiere' ? ' selected' : ''}>Matière</option>
        <option value="accessoire"${it.categorie === 'accessoire' ? ' selected' : ''}>Accessoire</option>
      </select>
    </td>
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;">
      <input class="cat-unite" data-idx="${i}" type="text" value="${(it.unite || '').replace(/"/g, '&quot;')}" placeholder="kg/m/u" style="${FINP}text-align:center;"/>
    </td>
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;">
      <input class="cat-prix" data-idx="${i}" type="number" step="0.01" min="0" value="${it.prix_moyen_ht ?? ''}" placeholder="prix tôle/paquet" title="Matière : prix de la tôle · Accessoire : prix du paquet" style="${FINP}text-align:right;"/>
    </td>
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;">
      <input class="cat-qtepaq" data-idx="${i}" type="number" step="0.001" min="0" value="${it.qte_paquet ?? ''}" placeholder="quantité unitaire" title="Quantité unitaire (nb de pièces par conditionnement/paquet)" style="${FINP}text-align:right;"/>
    </td>
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;">
      <input class="cat-mini" data-idx="${i}" type="number" step="0.01" min="0" value="${it.prix_mini_cde_ht ?? ''}" style="${FINP}text-align:right;"/>
    </td>
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;">
      <input class="cat-delai" data-idx="${i}" type="number" min="0" value="${it.delai_j ?? ''}" placeholder="j" style="${FINP}text-align:center;"/>
    </td>
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;">
      <input class="cat-notes" data-idx="${i}" type="text" value="${(it.notes || '').replace(/"/g, '&quot;')}" placeholder="Conditions, MOQ, palette…" style="${FINP}"/>
    </td>
    <td style="padding:8px;border-bottom:1px solid #f9fafb;text-align:center;">
      <button onclick="removeCatRow(${i})" title="Supprimer" style="padding:6px 10px;background:#fef2f2;color:#b91c1c;border:1.5px solid #fca5a5;border-radius:7px;cursor:pointer;"><i class="fas fa-trash"></i></button>
    </td>
  </tr>`).join('')

  // ─── Tarifs sous-traitance (ST) : forfait minimum + prix unitaire pièce par opération ──
  const tarifs = isSt ? (Array.isArray((entity as any)?.tarifs) ? (entity as any).tarifs : []) : []
  const tarifsRowsHtml = (tarifs as any[]).map((t: any) => `
  <tr class="tar-row">
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="tar-op" type="text" list="st-op-datalist" value="${(t.operation || '').replace(/"/g, '&quot;')}" placeholder="ex: Anodisation dure" style="${FINP}"/></td>
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="tar-forfait" type="number" step="0.01" min="0" value="${t.forfait_ht ?? ''}" placeholder="0.00" style="${FINP}text-align:right;"/></td>
    <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="tar-pu" type="number" step="0.0001" min="0" value="${t.prix_unitaire_piece_ht ?? ''}" placeholder="0.0000" style="${FINP}text-align:right;"/></td>
    <td style="padding:8px;border-bottom:1px solid #f9fafb;text-align:center;"><button onclick="removeTarRow(this)" title="Supprimer" style="padding:6px 10px;background:#fef2f2;color:#b91c1c;border:1.5px solid #fca5a5;border-radius:7px;cursor:pointer;"><i class="fas fa-trash"></i></button></td>
  </tr>`).join('')

  // ─── Stock lié (articles dont fournisseur_principal_id = entity.id OU dont le nom de fournisseur matche) ──
  const nomLow = String(entity?.nom || '').toLowerCase().trim()
  const stockLies = (dbStockArticles || []).filter((a: any) => {
    if (String(a.fournisseur_principal_id ?? a.fournisseur_id ?? '') === String(entity?.id || '')) return true
    if (nomLow && String(a.fournisseur || '').toLowerCase().trim() === nomLow) return true
    return false
  })

  const ICON = isSt ? 'fa-industry' : 'fa-truck'

  const content = `
<style>
  .card{background:white;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.07);overflow:hidden;}
  .kpi{background:white;border-radius:12px;padding:14px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);}
  .kpi-ic{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
</style>

<div style="background:linear-gradient(135deg,${couleurPrimaire},${couleurSecondaire});padding:18px 24px;color:white;">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;">
    <div>
      <a href="${backHref}" style="display:inline-flex;align-items:center;gap:6px;font-size:.78rem;color:rgba(255,255,255,.85);text-decoration:none;margin-bottom:6px;"><i class="fas fa-arrow-left"></i>Retour Achats</a>
      <h1 style="font-size:1.45rem;font-weight:900;margin:0;display:flex;align-items:center;gap:10px;"><i class="fas ${ICON}"></i>${titre}</h1>
      <div style="font-size:.8rem;opacity:.88;margin-top:3px;">${type === 'sous-traitant' ? 'Fiche sous-traitant — catalogue prestations & politiques de vente' : 'Fiche fournisseur — catalogue produits & politiques de vente'}</div>
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="deleteFiche()" style="padding:10px 18px;background:rgba(255,255,255,.15);color:white;border:1.5px solid rgba(255,255,255,.6);border-radius:10px;font-weight:700;cursor:pointer;font-size:.85rem;"><i class="fas fa-trash" style="margin-right:6px;"></i>Supprimer</button>
      <button onclick="saveFicheFourn()" style="padding:10px 20px;background:white;color:${couleurPrimaire};border:none;border-radius:10px;font-weight:800;cursor:pointer;font-size:.85rem;"><i class="fas fa-save" style="margin-right:6px;"></i>Enregistrer la fiche</button>
    </div>
  </div>
</div>

<div style="padding:24px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;margin-bottom:18px;">
  <div class="kpi"><div class="kpi-ic" style="background:${couleurPrimaire}22;color:${couleurPrimaire};"><i class="fas fa-tags"></i></div><div><div style="font-size:.72rem;color:#64748b;font-weight:700;text-transform:uppercase;">Catégorie</div><div style="font-size:.95rem;font-weight:800;color:#1e293b;">${categorie}</div></div></div>
  <div class="kpi"><div class="kpi-ic" style="background:#10b98122;color:#059669;"><i class="fas fa-building"></i></div><div><div style="font-size:.72rem;color:#64748b;font-weight:700;text-transform:uppercase;">Activité</div><div style="font-size:.95rem;font-weight:800;color:#1e293b;">${activiteBadge(activite)}</div></div></div>
  <div class="kpi"><div class="kpi-ic" style="background:#f59e0b22;color:#d97706;"><i class="fas fa-box"></i></div><div><div style="font-size:.72rem;color:#64748b;font-weight:700;text-transform:uppercase;">${isSt ? 'Opérations déclarées' : 'Références au catalogue'}</div><div style="font-size:.95rem;font-weight:800;color:#1e293b;">${isSt ? (tarifs as any[]).length : catalogue.length}</div></div></div>
  <div class="kpi"><div class="kpi-ic" style="background:#0ea5e922;color:#0284c7;"><i class="fas fa-warehouse"></i></div><div><div style="font-size:.72rem;color:#64748b;font-weight:700;text-transform:uppercase;">Articles stock liés</div><div style="font-size:.95rem;font-weight:800;color:#1e293b;">${stockLies.length}</div></div></div>
</div>

<div style="padding:0 24px 24px;margin:0 auto;display:flex;flex-direction:column;gap:18px;">

  <!-- Identité & paramètres — formulaire HORIZONTAL pleine largeur -->
  <div class="card" style="padding:20px;">
    <div style="font-weight:800;color:#1e293b;font-size:.95rem;margin-bottom:14px;"><i class="fas fa-id-card" style="color:${couleurPrimaire};margin-right:6px;"></i>Identité &amp; paramètres</div>
    <input type="hidden" id="f_id" value="${entity?.id || ''}"/>
    <input type="hidden" id="f_is_st" value="${isSt ? '1' : '0'}"/>
    <datalist id="f-cat-datalist">${categories.map(c => `<option value="${(c || '').replace(/"/g, '&quot;')}"></option>`).join('')}</datalist>
    <datalist id="mode-regl-datalist">${MODES_REGLEMENT.map(m => `<option value="${m}"></option>`).join('')}</datalist>
    <datalist id="cond-paie-datalist">${CONDITIONS_PAIEMENT.map(m => `<option value="${m}"></option>`).join('')}</datalist>
    ${isSt ? `<datalist id="st-op-datalist">${operationsExistantes.map(o => `<option value="${(o || '').replace(/"/g, '&quot;')}"></option>`).join('')}</datalist>` : ''}
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;align-items:start;">
      <div><label style="${FLBL}">Nom *</label><input id="f_nom" type="text" value="${(entity?.nom || '').replace(/"/g, '&quot;')}" style="${FINP}"/></div>
      <div><label style="${FLBL}">Catégorie * <span style="font-weight:500;text-transform:none;color:#94a3b8;">(liste créable)</span></label>
        <input id="f_categorie" list="f-cat-datalist" value="${(categorie || '').replace(/"/g, '&quot;')}" placeholder="Choisir ou créer…" style="${FINP}"/>
      </div>
      ${!isSt ? `<div style="grid-column:1/-1;"><label style="${FLBL}">Catégories fournies <span style="font-weight:500;text-transform:none;color:#94a3b8;">(ce que livre ce fournisseur)</span></label>
        <div style="display:flex;gap:14px;align-items:center;padding:8px 2px;flex-wrap:wrap;">
          ${FAM_OPTS.map(([v, l]) => `<label style="display:flex;align-items:center;gap:5px;font-size:.82rem;cursor:pointer;color:#374151;"><input type="checkbox" class="f-fam-chk" value="${v}"${famArr.indexOf(v) >= 0 ? ' checked' : ''}/> ${l}</label>`).join('')}
        </div>
        <div style="font-size:.64rem;color:#64748b;line-height:1.4;">Compartiments où ce fournisseur apparaît dans les nomenclatures / achats.</div>
      </div>` : ''}
      <div><label style="${FLBL}">Activité — visibilité nomenclatures *</label>
        <select id="f_activite" style="${FINP}">
          ${ACTIVITES.map(a => `<option value="${a}"${a === activite ? ' selected' : ''}>${a === 'both' ? 'Seem & Semrac' : a}</option>`).join('')}
        </select>
        <div style="font-size:.66rem;color:#64748b;margin-top:4px;line-height:1.4;"><i class="fas fa-info-circle" style="margin-right:3px;"></i>Détermine si les références apparaissent dans les nomenclatures Seem et/ou Semrac.</div>
      </div>
      <div><label style="${FLBL}">Contact principal</label><input id="f_contact" type="text" value="${(entity?.contact || '').replace(/"/g, '&quot;')}" style="${FINP}"/></div>
      <div><label style="${FLBL}">Email</label><input id="f_email" type="email" value="${(entity?.email || '').replace(/"/g, '&quot;')}" style="${FINP}"/></div>
      <div><label style="${FLBL}">Téléphone</label><input id="f_tel" type="text" value="${(entity?.tel || entity?.telephone || '').replace(/"/g, '&quot;')}" style="${FINP}"/></div>
      <div><label style="${FLBL}">Localisation / adresse</label><input id="f_loc" type="text" value="${(entity?.localisation || entity?.adresse || '').replace(/"/g, '&quot;')}" style="${FINP}"/></div>
      <div><label style="${FLBL}">Délai moyen (jours)</label><input id="f_delai" type="number" min="0" value="${entity?.delai_moyen_j ?? ''}" style="${FINP}"/></div>
      <div><label style="${FLBL}">Mode de règlement</label><input id="f_mode_reglement" list="mode-regl-datalist" placeholder="Virement, Chèque…" value="${(modeReglement || '').replace(/"/g, '&quot;')}" style="${FINP}"/></div>
      <div><label style="${FLBL}">Conditions de paiement</label><input id="f_paie" list="cond-paie-datalist" placeholder="30 j fin de mois…" value="${(entity?.conditions_paiement || '').replace(/"/g, '&quot;')}" style="${FINP}"/></div>
      <div style="grid-column:1/-1;">
        <label style="${FLBL}">Conditions / instructions standards</label>
        <textarea id="f_conditions" rows="3" style="${FINP}resize:vertical;" placeholder="Exemples : minimum de commande franco 250 € HT, port en sus en-dessous, palettes non reprises, lots groupés, normes EN 9100…">${(conditions || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</textarea>
      </div>
      <div><label style="${FLBL}">Qualification / certifications</label><input id="f_qualif" type="text" value="${(entity?.qualification || (Array.isArray(entity?.certifications) ? entity.certifications.join(', ') : entity?.certifications) || '').replace(/"/g, '&quot;')}" placeholder="ISO 9001, EN 9100…" style="${FINP}"/></div>
      <div style="grid-column:1/-1;display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:10px;align-items:start;">
        <div><label style="${FLBL}">OTD — ponctualité (calculé)</label>
          <div style="${FINP}background:#f1f5f9;font-weight:800;color:${otdStats && otdStats.pct != null ? (otdStats.pct >= 90 ? '#059669' : otdStats.pct >= 70 ? '#d97706' : '#dc2626') : '#94a3b8'};">${otdStats && otdStats.pct != null ? `${otdStats.pct}% · ${otdStats.n_ontime}/${otdStats.n_total} réception${otdStats.n_total > 1 ? 's' : ''}` : '— (aucune réception datée)'}</div>
        </div>
        <div><label style="${FLBL}">Méthode de calcul OTD <span style="font-weight:500;text-transform:none;color:#94a3b8;">(recalcul au rechargement)</span></label>
          <select id="f_otd_methode" style="${FINP}">
            <option value="bc_bl"${otdMethode === 'bc_bl' ? ' selected' : ''}>Émission BC → réception BL</option>
            <option value="paiement_bl"${otdMethode === 'paiement_bl' ? ' selected' : ''}>Paiement proforma → réception BL</option>
          </select>
        </div>
        <div><label style="${FLBL}">Scoring qualité</label><input id="f_score" type="number" min="0" max="100" value="${entity?.scoring ?? ''}" style="${FINP}"/></div>
      </div>
    </div>
  </div>
  ${interlocuteursPanel(isSt ? 'sous_traitant' : 'fournisseur', entity?.id || '', couleurPrimaire)}

    ${isSt ? `
    <!-- Tarifs sous-traitance : forfait minimum + prix unitaire pièce par opération (références qu'il fournit + forfait) -->
    <div class="card" style="margin-bottom:16px;">
      <div style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;">
        <div style="font-weight:800;color:#1e293b;font-size:.95rem;"><i class="fas fa-coins" style="color:${couleurPrimaire};margin-right:6px;"></i>Opérations sous-traitées — forfait &amp; prix unitaire/pièce</div>
        <button onclick="addTarRow()" style="padding:7px 14px;background:${couleurPrimaire};color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.78rem;"><i class="fas fa-plus" style="margin-right:5px;"></i>Ajouter une opération</button>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.78rem;">
          <thead><tr style="background:#f8fafc;">
            <th style="text-align:left;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;">Opération</th>
            <th style="text-align:right;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;width:150px;">Forfait min. HT (€)</th>
            <th style="text-align:right;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;width:160px;">Prix unitaire HT (€/pc)</th>
            <th style="width:60px;"></th>
          </tr></thead>
          <tbody id="tarifsBody">${tarifsRowsHtml || '<tr><td colspan="4" style="text-align:center;padding:24px;color:#94a3b8;">Aucun tarif — ajoutez une opération sous-traitée.</td></tr>'}</tbody>
        </table>
      </div>
      <div style="padding:10px 18px;background:#fff7ed;border-top:1px solid #fed7aa;font-size:.72rem;color:#b45309;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-info-circle"></i>Coût réel d'une commande = <strong>max(forfait ; quantité × prix unitaire)</strong>. Ces tarifs alimentent les étapes sous-traitées des nomenclatures.
      </div>
    </div>` : ''}
    ${!isSt ? `<div class="card" style="margin-bottom:16px;">
      <div style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;">
        <div style="font-weight:800;color:#1e293b;font-size:.95rem;"><i class="fas fa-boxes" style="color:${couleurPrimaire};margin-right:6px;"></i>Catalogue produits — politique de prix</div>
        <button onclick="addCatRow()" style="padding:7px 14px;background:${couleurPrimaire};color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.78rem;"><i class="fas fa-plus" style="margin-right:5px;"></i>Ajouter une référence</button>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.78rem;">
          <thead><tr style="background:#f8fafc;">
            <th style="text-align:left;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;width:130px;">Réf.</th>
            <th style="text-align:left;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;">Désignation</th>
            <th style="text-align:center;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;width:110px;">Catégorie</th>
            <th style="text-align:center;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;width:85px;">Unité</th>
            <th style="text-align:right;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;width:115px;">Prix tôle/paquet</th>
            <th style="text-align:right;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;width:110px;">Quantité unitaire</th>
            <th style="text-align:right;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;width:130px;">Mini cde HT</th>
            <th style="text-align:center;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;width:80px;">Délai (j)</th>
            <th style="text-align:left;padding:9px 12px;font-size:.65rem;font-weight:800;color:#64748b;text-transform:uppercase;">Notes / conditions</th>
            <th style="width:60px;"></th>
          </tr></thead>
          <tbody id="catalogueBody">${catalogueRowsHtml || '<tr><td colspan="10" style="text-align:center;padding:24px;color:#94a3b8;">Catalogue vide — ajoutez une référence.</td></tr>'}</tbody>
        </table>
      </div>
      <div style="padding:10px 18px;background:#eff6ff;border-top:1px solid #dbeafe;font-size:.72rem;color:#1d4ed8;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-link"></i>Ces références sont proposées dans les nomenclatures BE (filtrées par activité ${activite === 'both' ? 'Seem &amp; Semrac' : activite}) et liées au stock par <strong>fournisseur principal</strong>.
      </div>
    </div>` : ''}

    <!-- Références fournies (catalogue commercial — produits_fournisseurs, SANS quantité de stock §5) -->
    ${!isSt ? `<div class="card">
      <div style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;">
        <div style="font-weight:800;color:#1e293b;font-size:.95rem;"><i class="fas fa-tags" style="color:${couleurPrimaire};margin-right:6px;"></i>Références fournies <span style="color:#94a3b8;font-weight:600;font-size:.8rem;">(${PRODUITS.length})</span></div>
        <div style="display:flex;align-items:center;gap:10px;">${bulkToolbar('pf', couleurPrimaire)}<span style="font-size:.66rem;color:#94a3b8;"><i class="fas fa-circle-info" style="margin-right:4px;"></i>Données commerciales — le stock est géré à part.</span></div>
      </div>
      <div style="padding:12px 18px;background:#f8fafc;border-bottom:1px solid #f1f5f9;display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
        <div><label style="${FLBL}">Référence *</label><input id="pf_ref" style="${FINP}width:140px;font-family:monospace;font-weight:700;"/></div>
        <div style="flex:1;min-width:160px;"><label style="${FLBL}">Désignation *</label><input id="pf_des" style="${FINP}"/></div>
        <div><label style="${FLBL}">Catégorie</label><select id="pf_cat" style="${FINP}width:130px;">${Object.entries(PF_CATS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
        <div><label style="${FLBL}">Prix <span style="color:#94a3b8;font-weight:500;text-transform:none;">(optionnel)</span></label><input id="pf_prix" type="number" step="0.01" min="0" placeholder="à chiffrer" style="${FINP}width:110px;"/></div>
        <div><label style="${FLBL}">Délai (j)</label><input id="pf_delai" type="number" min="0" style="${FINP}width:80px;"/></div>
        <input type="hidden" id="pf_id"/>
        <button id="pf_save_btn" onclick="pfDeclare('${entity?.id || ''}')" style="padding:8px 14px;background:${couleurPrimaire};color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.78rem;white-space:nowrap;"><i class="fas fa-plus" style="margin-right:5px;"></i>Déclarer</button>
      </div>
      ${PRODUITS.length === 0 ? `<div style="padding:24px;text-align:center;color:#94a3b8;font-size:.8rem;">Aucune référence déclarée. Référence + désignation suffisent — le prix se renseigne via une demande de prix (RFQ).</div>` : `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.78rem;">
          <thead><tr style="background:#f8fafc;">
            <th class="bcell bcell-pf" style="display:none;text-align:center;padding:9px 8px;"><input type="checkbox" onclick="bulkAll('pf',this.checked)" title="Tout sélectionner"/></th>
            ${['Réf.', 'Désignation', 'Catégorie', 'Prix', 'Délai', 'Source', 'Évol.', ''].map((h, i) => `<th style="text-align:${i === 3 ? 'right' : 'left'};padding:9px 12px;font-size:.62rem;font-weight:800;color:#64748b;text-transform:uppercase;">${h}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${PRODUITS.map((p: any) => `<tr style="border-bottom:1px solid #f9fafb;">
              <td class="bcell bcell-pf" style="display:none;text-align:center;"><input type="checkbox" class="bsel" data-bulk="pf" data-id="${pfEsc(p.id)}" onclick="bulkCount('pf')"/></td>
              <td style="padding:8px 12px;font-family:monospace;font-weight:700;color:${couleurPrimaire};">${pfEsc(p.reference)}</td>
              <td style="padding:8px 12px;">${pfEsc(p.designation)}</td>
              <td style="padding:8px 12px;"><span style="background:#eef2ff;color:#4338ca;border-radius:6px;padding:1px 8px;font-size:.64rem;font-weight:700;">${pfCatLabel(p.categorie)}</span></td>
              <td style="padding:8px 12px;text-align:right;font-weight:800;color:${p.prix != null ? '#0f766e' : '#f59e0b'};">${p.prix != null ? Number(p.prix).toFixed(2) + ' €' : '— à chiffrer'}</td>
              <td style="padding:8px 12px;">${p.delai_jours != null ? p.delai_jours + ' j' : '—'}</td>
              <td style="padding:8px 12px;"><span style="font-size:.6rem;color:#64748b;text-transform:uppercase;background:#f1f5f9;border-radius:5px;padding:1px 6px;">${p.source_prix || '—'}</span></td>
              <td style="padding:8px 12px;"><button onclick="ffEvol('${String(p.reference || '').replace(/[''\\]/g, '')}','${String(p.designation || '').replace(/[''\\<]/g, '')}')" style="background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:4px 9px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-chart-line"></i></button></td>
              <td style="padding:8px 12px;text-align:center;white-space:nowrap;"><button onclick="pfEdit(this)" data-id="${pfEsc(p.id)}" data-ref="${pfEsc(p.reference)}" data-des="${pfEsc(p.designation)}" data-cat="${pfEsc(p.categorie || '')}" data-prix="${p.prix != null ? p.prix : ''}" data-delai="${p.delai_jours != null ? p.delai_jours : ''}" title="Modifier cette référence" style="background:none;border:none;color:${couleurPrimaire};cursor:pointer;font-size:.92rem;margin-right:10px;"><i class="fas fa-pen"></i></button><button onclick="pfDelete('${p.id}')" title="Supprimer la référence" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1rem;">&times;</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`}
      <div style="padding:10px 18px;background:#eff6ff;border-top:1px solid #dbeafe;font-size:.72rem;color:#1d4ed8;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-shield-halved"></i>Le <strong>prix officiel</strong> se met à jour uniquement via les <strong>demandes de prix</strong> validées — jamais par les bons de commande.
      </div>
    </div>` : ''}

    <div id="ffEvolModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:3000;align-items:center;justify-content:center;" onclick="if(event.target===this)this.style.display='none'">
      <div style="background:white;border-radius:14px;padding:20px;width:620px;max-width:94vw;max-height:88vh;overflow:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <span id="ffEvolTitle" style="font-weight:800;color:#1e293b;font-size:.95rem;"></span>
          <button onclick="document.getElementById('ffEvolModal').style.display='none'" style="background:#f1f5f9;border:none;border-radius:8px;padding:6px 11px;cursor:pointer;font-size:.8rem;">Fermer</button>
        </div>
        <div id="ffEvolBody"></div>
      </div>
    </div>
    ${bulkSelectAssets([{ key: 'pf', base: '/api/produits-fournisseurs/', label: 'référence(s) catalogue' }])}
</div>

<script>
function pfDeclare(fid){
  var id=(document.getElementById('pf_id').value||'').trim();
  var ref=(document.getElementById('pf_ref').value||'').trim();
  var des=(document.getElementById('pf_des').value||'').trim();
  if(!ref||!des){ pushNotif('err','fa-exclamation-circle','Référence et désignation obligatoires.'); return; }
  var prixV=document.getElementById('pf_prix').value, delaiV=document.getElementById('pf_delai').value;
  var payload={ fournisseur_id:fid, reference:ref, designation:des, categorie:document.getElementById('pf_cat').value,
    prix:(prixV!==''?parseFloat(prixV):null), delai_jours:(delaiV!==''?parseInt(delaiV,10):null), source_prix:'manuel' };
  var url=id?('/api/produits-fournisseurs/'+encodeURIComponent(id)):'/api/produits-fournisseurs';
  var method=id?'PUT':'POST';
  fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
      pushNotif('ok','fa-check', id?'Référence modifiée.':'Référence déclarée.'); setTimeout(function(){softReload();},700);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function pfEdit(btn){
  document.getElementById('pf_id').value=btn.getAttribute('data-id')||'';
  document.getElementById('pf_ref').value=btn.getAttribute('data-ref')||'';
  document.getElementById('pf_des').value=btn.getAttribute('data-des')||'';
  document.getElementById('pf_cat').value=btn.getAttribute('data-cat')||'matiere_premiere';
  document.getElementById('pf_prix').value=btn.getAttribute('data-prix')||'';
  document.getElementById('pf_delai').value=btn.getAttribute('data-delai')||'';
  var b=document.getElementById('pf_save_btn'); if(b) b.innerHTML='<i class="fas fa-check" style="margin-right:5px;"></i>Enregistrer la modification';
  var r=document.getElementById('pf_ref'); if(r){ r.focus(); r.scrollIntoView({block:'center'}); }
}
async function pfDelete(id){
  if(!await appConfirm('Supprimer cette référence du catalogue fournisseur ?')) return;
  fetch('/api/produits-fournisseurs/'+id,{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
    pushNotif('ok','fa-check','Référence supprimée.'); setTimeout(function(){softReload();},500);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
async function ffEvol(reference, desig){
  var m=document.getElementById('ffEvolModal'), body=document.getElementById('ffEvolBody');
  document.getElementById('ffEvolTitle').innerHTML='<i class="fas fa-chart-line" style="color:#6366f1;margin-right:6px;"></i>'+reference+' — '+desig;
  body.innerHTML='<div style="text-align:center;padding:30px;color:#94a3b8;">Chargement…</div>'; m.style.display='flex';
  try{ var r=await fetch('/api/ref-prix/'+encodeURIComponent(reference)); var j=await r.json(); var h=(j.historique||[]);
    if(!h.length){ body.innerHTML='<div style="text-align:center;padding:30px;color:#cbd5e1;">Aucun historique de prix. Il se remplit à chaque bon de commande validé pour cette référence.</div>'; return; }
    var pts=h.map(function(x){return {d:(x.date_prix||'').slice(0,10),p:Number(x.prix_unitaire)||0,q:x.quantite,bc:x.bc_num||''};});
    var prices=pts.map(function(p){return p.p;}); var mn=Math.min.apply(null,prices),mx=Math.max.apply(null,prices); if(mx===mn){mx=mn+1;mn=Math.max(0,mn-1);}
    var W=540,H=150,ml=46,mr=12,mt=12,mb=20,n=pts.length;
    var X=function(i){return ml+(n<=1?(W-ml-mr)/2:i/(n-1)*(W-ml-mr));},Y=function(p){return mt+(1-(p-mn)/(mx-mn))*(H-mt-mb);};
    var poly=pts.map(function(p,i){return X(i).toFixed(1)+','+Y(p.p).toFixed(1);}).join(' ');
    var dots=pts.map(function(p,i){return '<circle cx="'+X(i).toFixed(1)+'" cy="'+Y(p.p).toFixed(1)+'" r="3" fill="#6366f1"><title>'+p.d+' : '+p.p.toFixed(2)+' €</title></circle>';}).join('');
    var last=prices[n-1],first=prices[0],delta=first?(last-first)/first*100:0;
    var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;"><line x1="'+ml+'" y1="'+(H-mb)+'" x2="'+(W-mr)+'" y2="'+(H-mb)+'" stroke="#e2e8f0"/><polyline points="'+poly+'" fill="none" stroke="#6366f1" stroke-width="2"/>'+dots+'<text x="'+(ml-5)+'" y="'+(Y(mx)+3).toFixed(1)+'" text-anchor="end" font-size="8" fill="#94a3b8">'+mx.toFixed(2)+'</text><text x="'+(ml-5)+'" y="'+(Y(mn)+3).toFixed(1)+'" text-anchor="end" font-size="8" fill="#94a3b8">'+mn.toFixed(2)+'</text></svg>';
    var rows=pts.slice().reverse().map(function(p){return '<tr style="border-bottom:1px solid #f8fafc;"><td style="padding:5px 10px;font-size:.74rem;color:#64748b;">'+p.d+'</td><td style="padding:5px 10px;text-align:right;font-weight:800;color:#0f766e;font-size:.78rem;">'+p.p.toFixed(2)+' €</td><td style="padding:5px 10px;text-align:right;font-size:.74rem;">'+(p.q!=null?p.q:'—')+'</td><td style="padding:5px 10px;font-size:.72rem;color:#94a3b8;">'+p.bc+'</td></tr>';}).join('');
    body.innerHTML='<div style="display:flex;gap:12px;margin-bottom:10px;"><div style="background:#f8fafc;border-radius:8px;padding:7px 13px;"><div style="font-size:.58rem;color:#94a3b8;text-transform:uppercase;font-weight:700;">Dernier prix</div><div style="font-size:1.05rem;font-weight:900;color:#0f766e;">'+last.toFixed(2)+' €</div></div><div style="background:#f8fafc;border-radius:8px;padding:7px 13px;"><div style="font-size:.58rem;color:#94a3b8;text-transform:uppercase;font-weight:700;">Évolution</div><div style="font-size:1.05rem;font-weight:900;color:'+(delta>0?'#b91c1c':delta<0?'#15803d':'#64748b')+';">'+(delta>0?'+':'')+delta.toFixed(1)+'%</div></div></div>'+svg+'<table style="width:100%;border-collapse:collapse;margin-top:8px;"><thead><tr style="background:#f8fafc;">'+['Date','PU','Qté','BC'].map(function(x,i){return '<th style="padding:5px 10px;text-align:'+(i===1||i===2?'right':'left')+';font-size:.58rem;text-transform:uppercase;color:#6b7280;">'+x+'</th>';}).join('')+'</tr></thead><tbody>'+rows+'</tbody></table>';
  }catch(e){ body.innerHTML='<div style="color:#b91c1c;padding:20px;">Erreur de chargement.</div>'; }
}
function _catRows(){ return Array.prototype.slice.call(document.querySelectorAll('#catalogueBody .cat-row')); }
function addCatRow(){
  var body = document.getElementById('catalogueBody');
  if(body.querySelector('.cat-row') === null) body.innerHTML = '';
  var idx = _catRows().length;
  var FINP = '${FINP.replace(/'/g, "\\'")}';
  var tr = document.createElement('tr');
  tr.className = 'cat-row';
  tr.setAttribute('data-idx', idx);
  tr.innerHTML = ''
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="cat-ref" type="text" placeholder="REF-XXX" style="'+FINP+'font-family:monospace;font-weight:700;"/></td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="cat-designation" type="text" placeholder="Désignation" style="'+FINP+'"/></td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><select class="cat-categorie" style="'+FINP+'"><option value="">—</option><option value="matiere">Matière</option><option value="accessoire">Accessoire</option></select></td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="cat-unite" type="text" placeholder="kg/m/u" style="'+FINP+'text-align:center;"/></td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="cat-prix" type="number" step="0.01" min="0" placeholder="prix tôle/paquet" style="'+FINP+'text-align:right;"/></td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="cat-qtepaq" type="number" step="0.001" min="0" placeholder="quantité unitaire" style="'+FINP+'text-align:right;"/></td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="cat-mini" type="number" step="0.01" min="0" style="'+FINP+'text-align:right;"/></td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="cat-delai" type="number" min="0" placeholder="j" style="'+FINP+'text-align:center;"/></td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="cat-notes" type="text" placeholder="MOQ, conditions…" style="'+FINP+'"/></td>'
    + '<td style="padding:8px;border-bottom:1px solid #f9fafb;text-align:center;"><button onclick="removeCatRow(this)" title="Supprimer" style="padding:6px 10px;background:#fef2f2;color:#b91c1c;border:1.5px solid #fca5a5;border-radius:7px;cursor:pointer;"><i class="fas fa-trash"></i></button></td>';
  body.appendChild(tr);
}
function removeCatRow(idxOrBtn){
  var rows = _catRows();
  if(typeof idxOrBtn === 'number'){
    if(rows[idxOrBtn]) rows[idxOrBtn].remove();
  } else {
    var tr = idxOrBtn; while(tr && tr.tagName !== 'TR') tr = tr.parentNode;
    if(tr) tr.remove();
  }
  var body = document.getElementById('catalogueBody');
  if(_catRows().length === 0) body.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:24px;color:#94a3b8;">Catalogue vide — ajoutez une référence.</td></tr>';
}
function collectCatalogue(){
  return _catRows().map(function(tr){
    var catSel = tr.querySelector('.cat-categorie');
    var qtePaq = tr.querySelector('.cat-qtepaq');
    return {
      ref: (tr.querySelector('.cat-ref').value || '').trim(),
      designation: (tr.querySelector('.cat-designation').value || '').trim(),
      categorie: catSel ? catSel.value : '',
      unite: (tr.querySelector('.cat-unite').value || '').trim(),
      prix_moyen_ht: parseFloat(tr.querySelector('.cat-prix').value) || null,
      qte_paquet: qtePaq ? (parseFloat(qtePaq.value) || null) : null,
      prix_mini_cde_ht: parseFloat(tr.querySelector('.cat-mini').value) || null,
      delai_j: parseInt(tr.querySelector('.cat-delai').value, 10) || null,
      notes: (tr.querySelector('.cat-notes').value || '').trim(),
    };
  }).filter(function(x){ return x.ref || x.designation; });
}
// ── Tarifs sous-traitance (forfait + prix unitaire par opération) ──
function _tarRows(){ return Array.prototype.slice.call(document.querySelectorAll('#tarifsBody .tar-row')); }
function addTarRow(){
  var body = document.getElementById('tarifsBody'); if(!body) return;
  if(body.querySelector('.tar-row') === null) body.innerHTML = '';
  var FINP = '${FINP.replace(/'/g, "\\'")}';
  var tr = document.createElement('tr');
  tr.className = 'tar-row';
  tr.innerHTML = ''
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="tar-op" type="text" list="st-op-datalist" placeholder="ex: Anodisation dure" style="'+FINP+'"/></td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="tar-forfait" type="number" step="0.01" min="0" placeholder="0.00" style="'+FINP+'text-align:right;"/></td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #f9fafb;"><input class="tar-pu" type="number" step="0.0001" min="0" placeholder="0.0000" style="'+FINP+'text-align:right;"/></td>'
    + '<td style="padding:8px;border-bottom:1px solid #f9fafb;text-align:center;"><button onclick="removeTarRow(this)" title="Supprimer" style="padding:6px 10px;background:#fef2f2;color:#b91c1c;border:1.5px solid #fca5a5;border-radius:7px;cursor:pointer;"><i class="fas fa-trash"></i></button></td>';
  body.appendChild(tr);
}
function removeTarRow(btn){
  var tr = btn; while(tr && tr.tagName !== 'TR') tr = tr.parentNode;
  if(tr) tr.remove();
  var body = document.getElementById('tarifsBody');
  if(body && _tarRows().length === 0) body.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:#94a3b8;">Aucun tarif — ajoutez une opération sous-traitée.</td></tr>';
}
function collectTarifs(){
  return _tarRows().map(function(tr){
    return {
      operation: (tr.querySelector('.tar-op').value || '').trim(),
      forfait_ht: parseFloat(tr.querySelector('.tar-forfait').value) || 0,
      prix_unitaire_piece_ht: parseFloat(tr.querySelector('.tar-pu').value) || 0,
    };
  }).filter(function(x){ return x.operation; });
}
function saveFicheFourn(){
  var id = document.getElementById('f_id').value;
  if(!id){ pushNotif('err','fa-exclamation-circle','Identifiant manquant.'); return; }
  var isSt = document.getElementById('f_is_st').value === '1';
  var payload = {
    nom: document.getElementById('f_nom').value.trim(),
    categorie: document.getElementById('f_categorie').value,
    activite: document.getElementById('f_activite').value,
    contact: document.getElementById('f_contact').value.trim(),
    email: document.getElementById('f_email').value.trim(),
    tel: document.getElementById('f_tel').value.trim(),
    localisation: document.getElementById('f_loc').value.trim(),
    delai_moyen_j: parseInt(document.getElementById('f_delai').value, 10) || null,
    mode_reglement: document.getElementById('f_mode_reglement').value.trim(),
    conditions_paiement: document.getElementById('f_paie').value.trim(),
    conditions_standards: document.getElementById('f_conditions').value,
    qualification: document.getElementById('f_qualif').value.trim(),
    otd_methode: document.getElementById('f_otd_methode').value,
    scoring: parseFloat(document.getElementById('f_score').value) || null,
    catalogue: isSt ? undefined : collectCatalogue(),
    tarifs: isSt ? collectTarifs() : undefined,
    // Prestations (capacités utilisées par le planning ST) = opérations déclarées dans les tarifs
    prestations: isSt ? collectTarifs().map(function(t){ return t.operation; }).filter(Boolean) : undefined,
    familles_fourniture: isSt ? undefined : (function(){ var a=[]; document.querySelectorAll('.f-fam-chk').forEach(function(c){ if(c.checked)a.push(c.value); }); return a; })(),
  };
  var url = (isSt ? '/api/sous-traitants/' : '/api/fournisseurs/') + encodeURIComponent(id);
  fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(function(r){ return r.json(); }).then(function(j){
      if(!j || !j.ok){ pushNotif('err','fa-ban', (j && j.error) || 'Enregistrement échoué.'); return; }
      var msg = isSt ? ('Fiche enregistrée — ' + (payload.prestations.length) + ' prestation' + (payload.prestations.length > 1 ? 's' : '') + '.') : ('Fiche enregistrée — catalogue de ' + (payload.catalogue.length) + ' référence' + (payload.catalogue.length > 1 ? 's' : '') + '.');
      pushNotif('ok','fa-save', msg, 5000);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
async function deleteFiche(){
  var id = document.getElementById('f_id').value;
  var isSt = document.getElementById('f_is_st').value === '1';
  var nom = (document.getElementById('f_nom')||{value:''}).value || id;
  if(!id){ pushNotif('err','fa-exclamation-circle','Identifiant manquant.'); return; }
  if(!await appConfirm('Supprimer définitivement '+(isSt?'le sous-traitant':'le fournisseur')+' « '+nom+' » ? Cette action est irréversible.')) return;
  var url = (isSt ? '/api/sous-traitants/' : '/api/fournisseurs/') + encodeURIComponent(id);
  fetch(url, { method: 'DELETE' })
    .then(function(r){ return r.json(); })
    .then(function(j){
      if(!j || !j.ok){ pushNotif('err','fa-ban', (j && j.error) || 'Suppression impossible (peut-être référencé ailleurs).', 6000); return; }
      pushNotif('ok','fa-trash', (isSt?'Sous-traitant':'Fournisseur')+' « '+nom+' » supprimé.', 4000);
      setTimeout(function(){ window.location.href = '/achats/service#fourn'; }, 800);
    })
    .catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
</script>`

  return layout((isSt ? 'Sous-traitant' : 'Fournisseur') + ' — ' + titre, content, 'service-achats')
}
