// ══════════════════════════════════════════════════════════════
// FICHE DÉTAILLÉE — Fournisseur / Sous-traitant
// Références fournies (produits_fournisseurs) · Prix · Conditions standards · Activité Seem/Semrac
// ══════════════════════════════════════════════════════════════
// Lot H1 (17/09/2026) — CATALOGUE UNIQUE : le bloc jsonb « Catalogue produits — politique de prix »
// (colonne `fournisseurs.catalogue`) a été RETIRÉ. Il faisait doublon avec « Références fournies »
// (table `produits_fournisseurs`), seule source des prix, des délais et désormais de la quantité par
// paquet. Sonde en LECTURE SEULE du 17/09/2026, cloud (REST anon) ET Docker local :
//   fournisseurs   : 155 lignes cloud / 155 Docker — 0 catalogue jsonb non vide (123 `[]`, 32 `null`)
//   sous_traitants :  20 lignes cloud /  20 Docker — 0 catalogue jsonb non vide ( 12 `[]`,  8 `null`)
// Aucun item n'existait donc nulle part : rien à migrer, rien à reprendre. La colonne reste en base
// (pas de DROP) et `parseCatalogue` reste exporté pour relire une éventuelle donnée héritée.
import {
  layout, interlocuteursPanel, bulkToolbar, bulkSelectAssets,
  qtePaquetDe, nombrePositif, arrondiPrix, prixPerime, prixMoyenClientJs, PRIX_VALIDITE_JOURS,
} from './shared'

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')

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

/** Lecture tolérante de l'ancienne colonne jsonb `catalogue` (héritage — plus jamais écrite). */
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
  // Échappement HTML complet (texte ET attributs) : `>` et `'` compris — les désignations
  // fournisseur viennent d'imports et ont déjà porté du HTML.
  const pfEsc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  const PF_CATS: Record<string, string> = { matiere_premiere: 'Matière', accessoire: 'Accessoires', outillage: 'Outils', chimique: 'Chimique', consommable: 'Consommable', autre: 'Autres' }
  const pfCatLabel = (c: string) => PF_CATS[c] || pfEsc(c) || '—'
  // Lot H1 — le prix catalogue d'un accessoire reste le prix du PAQUET ; le prix à la pièce est un
  // CALCUL (jamais une donnée stockée) et il vient du module partagé `src/prix_moyen.ts` : aucune
  // règle de prix n'est recopiée ici. `qtePaquetDe` retombe sur l'ancien libellé texte
  // `conditionnement` s'il porte un nombre, puis sur `null` (= « non déclaré », signalé en orange).
  const pfQtePaquet = (p: any) => qtePaquetDe(p)
  const pfEstAccessoire = (p: any) => String(p?.categorie || '') === 'accessoire'
  const pfPrixPiece = (p: any): number | null => {
    const prix = nombrePositif(p?.prix)
    if (prix == null || !pfEstAccessoire(p)) return null
    const q = pfQtePaquet(p)
    return arrondiPrix(prix / (q != null && q > 0 ? q : 1))
  }
  const pfPerime = (p: any) => nombrePositif(p?.prix) != null && prixPerime(p?.date_prix, PRIX_VALIDITE_JOURS)
  // Lignes exposées au navigateur : « Modifier » recharge le formulaire unique depuis CES données
  // (plus d'attributs data-* à échapper) et le contrôle de doublon se fait avant l'aller-retour.
  const PF_LIGNES = PRODUITS.map((p: any) => ({
    id: String(p.id ?? ''), reference: p.reference ?? '', designation: p.designation ?? '',
    categorie: p.categorie ?? '', prix: p.prix != null && p.prix !== '' ? Number(p.prix) : null,
    delai_jours: p.delai_jours != null && p.delai_jours !== '' ? Number(p.delai_jours) : null,
    unite: p.unite ?? '', qte_paquet: pfQtePaquet(p), conditionnement: p.conditionnement ?? '',
  }))

  const FINP = 'width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:.82rem;background:#f8fafc;outline:none;box-sizing:border-box;color:#374151;'
  const FLBL = 'display:block;font-size:.66rem;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px;'

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
      <div style="font-size:.8rem;opacity:.88;margin-top:3px;">${type === 'sous-traitant' ? 'Fiche sous-traitant — catalogue prestations & politiques de vente' : 'Fiche fournisseur — références fournies & politiques de vente'}</div>
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
  <div class="kpi"><div class="kpi-ic" style="background:#f59e0b22;color:#d97706;"><i class="fas fa-box"></i></div><div><div style="font-size:.72rem;color:#64748b;font-weight:700;text-transform:uppercase;">${isSt ? 'Opérations déclarées' : 'Références fournies'}</div><div style="font-size:.95rem;font-weight:800;color:#1e293b;">${isSt ? (tarifs as any[]).length : PRODUITS.length}</div></div></div>
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
    <!-- ════════════════════════════════════════════════════════════════════════════
         RÉFÉRENCES FOURNIES — FORMULAIRE UNIQUE du catalogue de ce fournisseur (lot H1)
         Table produits_fournisseurs. L'ancien bloc jsonb « Catalogue produits » a été retiré
         (sonde du 17/09/2026 : 0 item, cloud et Docker). C'est ICI, et nulle part ailleurs, que se
         déclare la quantité par paquet d'un accessoire : la nomenclature ne la porte plus.
         Ouvert en écriture au BE ET aux Achats (exception de chemin de canAccess, lot H1).
         ════════════════════════════════════════════════════════════════════════════ -->
    ${!isSt ? `<div class="card">
      <div style="padding:14px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;flex-wrap:wrap;gap:8px;">
        <div style="font-weight:800;color:#1e293b;font-size:.95rem;"><i class="fas fa-tags" style="color:${couleurPrimaire};margin-right:6px;"></i>Références fournies <span style="color:#94a3b8;font-weight:600;font-size:.8rem;">(${PRODUITS.length})</span></div>
        <div style="display:flex;align-items:center;gap:10px;">${bulkToolbar('pf', couleurPrimaire)}<span style="font-size:.66rem;color:#94a3b8;"><i class="fas fa-circle-info" style="margin-right:4px;"></i>Catalogue unique — le stock est géré à part.</span></div>
      </div>
      <div style="padding:12px 18px;background:#f8fafc;border-bottom:1px solid #f1f5f9;">
        <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
          <div><label style="${FLBL}">Référence *</label><input id="pf_ref" style="${FINP}width:140px;font-family:monospace;font-weight:700;"/></div>
          <div style="flex:1;min-width:170px;"><label style="${FLBL}">Désignation *</label><input id="pf_des" style="${FINP}"/></div>
          <div><label style="${FLBL}">Catégorie</label><select id="pf_cat" onchange="pfHint()" style="${FINP}width:132px;">${Object.entries(PF_CATS).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
          <div><label style="${FLBL}">Qté / paquet <span style="color:#94a3b8;font-weight:500;text-transform:none;">(accessoires)</span></label><input id="pf_qtepaq" type="number" step="0.001" min="0" placeholder="ex. 100" title="Nombre de PIÈCES contenues dans le conditionnement auquel se rapporte le prix. Sans elle, le prix est compris comme un prix à la pièce." style="${FINP}width:112px;text-align:right;"/></div>
          <div><label style="${FLBL}">Unité</label><input id="pf_unite" placeholder="pce, kg, m…" title="Unité de la référence (pièce, kilo, mètre…). Le libellé libre du conditionnement n'est plus saisi : la quantité par paquet le remplace." style="${FINP}width:100px;text-align:center;"/></div>
          <div><label style="${FLBL}">Délai (j)</label><input id="pf_delai" type="number" min="0" style="${FINP}width:80px;"/></div>
          <div><label style="${FLBL}">Prix HT <span style="color:#94a3b8;font-weight:500;text-transform:none;">(optionnel)</span></label><input id="pf_prix" type="number" step="0.01" min="0" placeholder="à chiffrer" title="Matière : prix d'UNE TÔLE · Accessoire : prix du PAQUET (jamais le prix à la pièce, qui est calculé)." style="${FINP}width:112px;text-align:right;"/></div>
          <input type="hidden" id="pf_id"/>
          <input type="hidden" id="pf_fid" value="${pfEsc(entity?.id || '')}"/>
          <button id="pf_save_btn" onclick="pfDeclare()" style="padding:8px 14px;background:${couleurPrimaire};color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.78rem;white-space:nowrap;"><i class="fas fa-plus" style="margin-right:5px;"></i>Déclarer</button>
          <button id="pf_cancel_btn" onclick="pfReset()" style="display:none;padding:8px 12px;background:#f1f5f9;color:#475569;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:.78rem;white-space:nowrap;">Annuler</button>
        </div>
        <div id="pf_hint" style="font-size:.68rem;color:#64748b;margin-top:7px;line-height:1.45;"></div>
      </div>
      ${PRODUITS.length === 0 ? `<div style="padding:24px;text-align:center;color:#94a3b8;font-size:.8rem;">Aucune référence déclarée. Référence + désignation suffisent — le prix se renseigne via une demande de prix (RFQ).</div>` : `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:.78rem;">
          <thead><tr style="background:#f8fafc;">
            <th class="bcell bcell-pf" style="display:none;text-align:center;padding:9px 8px;"><input type="checkbox" onclick="bulkAll('pf',this.checked)" title="Tout sélectionner"/></th>
            ${[['Réf.', 'left'], ['Désignation', 'left'], ['Catégorie', 'left'], ['Qté / paquet', 'right'], ['Unité', 'center'], ['Prix HT', 'right'], ['Délai', 'left'], ['Source', 'left'], ['Évol.', 'left'], ['', 'left']].map(([h, al]) => `<th style="text-align:${al};padding:9px 12px;font-size:.62rem;font-weight:800;color:#64748b;text-transform:uppercase;white-space:nowrap;">${h}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${PRODUITS.map((p: any) => {
    const q = pfQtePaquet(p)
    const acc = pfEstAccessoire(p)
    const piece = pfPrixPiece(p)
    const perime = pfPerime(p)
    return `<tr style="border-bottom:1px solid #f9fafb;">
              <td class="bcell bcell-pf" style="display:none;text-align:center;"><input type="checkbox" class="bsel" data-bulk="pf" data-id="${pfEsc(p.id)}" onclick="bulkCount('pf')"/></td>
              <td style="padding:8px 12px;font-family:monospace;font-weight:700;color:${couleurPrimaire};">${pfEsc(p.reference)}</td>
              <td style="padding:8px 12px;">${pfEsc(p.designation)}</td>
              <td style="padding:8px 12px;"><span style="background:#eef2ff;color:#4338ca;border-radius:6px;padding:1px 8px;font-size:.64rem;font-weight:700;">${pfCatLabel(p.categorie)}</span></td>
              <td style="padding:8px 12px;text-align:right;white-space:nowrap;">${q != null
      ? `<span style="font-weight:800;color:#334155;">${q}</span><span style="font-size:.62rem;color:#94a3b8;"> pce/paquet</span>${p.qte_paquet == null && String(p.conditionnement || '').trim() ? `<div style="font-size:.6rem;color:#94a3b8;font-style:italic;" title="Libellé hérité de la colonne texte « conditionnement » — plus jamais écrit">${pfEsc(p.conditionnement)}</div>` : ''}`
      : (acc
        ? `<span style="background:#fff7ed;color:#b45309;border-radius:6px;padding:1px 8px;font-size:.62rem;font-weight:700;" title="Sans quantité par paquet, le prix est compris comme un prix à la pièce dans le prix moyen.">non déclaré</span>${String(p.conditionnement || '').trim() ? `<div style="font-size:.6rem;color:#94a3b8;font-style:italic;" title="Libellé hérité de la colonne texte « conditionnement » — illisible comme nombre, à ressaisir dans « Qté / paquet »">${pfEsc(p.conditionnement)}</div>` : ''}`
        : '<span style="color:#cbd5e1;">—</span>')}</td>
              <td style="padding:8px 12px;text-align:center;color:#64748b;font-size:.72rem;">${pfEsc(p.unite) || '—'}</td>
              <td style="padding:8px 12px;text-align:right;white-space:nowrap;font-weight:800;color:${p.prix != null ? (perime ? '#b45309' : '#0f766e') : '#f59e0b'};">${p.prix != null ? Number(p.prix).toFixed(2) + ' €' : '— à chiffrer'}${perime ? `<i class="fas fa-clock" style="margin-left:5px;font-size:.66rem;" title="Prix de plus de ${PRIX_VALIDITE_JOURS} jours — demande de prix conseillée"></i>` : ''}${piece != null ? `<div style="font-size:.6rem;color:#94a3b8;font-weight:600;">≈ ${piece.toFixed(4)} €/pièce</div>` : ''}</td>
              <td style="padding:8px 12px;white-space:nowrap;">${p.delai_jours != null ? p.delai_jours + ' j' : '—'}</td>
              <td style="padding:8px 12px;"><span style="font-size:.6rem;color:#64748b;text-transform:uppercase;background:#f1f5f9;border-radius:5px;padding:1px 6px;">${pfEsc(p.source_prix) || '—'}</span></td>
              <td style="padding:8px 12px;"><button onclick="ffEvolRow(this)" data-ref="${pfEsc(p.reference)}" data-des="${pfEsc(p.designation)}" title="Historique de prix" style="background:#eef2ff;color:#4338ca;border:none;border-radius:6px;padding:4px 9px;font-size:.68rem;font-weight:700;cursor:pointer;"><i class="fas fa-chart-line"></i></button></td>
              <td style="padding:8px 12px;text-align:center;white-space:nowrap;"><button onclick="pfEdit(this)" data-id="${pfEsc(p.id)}" title="Modifier cette référence" style="background:none;border:none;color:${couleurPrimaire};cursor:pointer;font-size:.92rem;margin-right:10px;"><i class="fas fa-pen"></i></button><button onclick="pfDelete(this)" data-id="${pfEsc(p.id)}" title="Supprimer la référence" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1rem;">&times;</button></td>
            </tr>`
  }).join('')}
          </tbody>
        </table>
      </div>`}
      <div style="padding:10px 18px;background:#eff6ff;border-top:1px solid #dbeafe;font-size:.72rem;color:#1d4ed8;display:flex;align-items:flex-start;gap:8px;line-height:1.5;">
        <i class="fas fa-shield-halved" style="margin-top:2px;"></i><span>Le <strong>prix officiel</strong> se met à jour par les <strong>demandes de prix</strong> validées (source <em>rfq</em>) ou à la main ici (source <em>manuel</em>) — <strong>jamais</strong> par un bon de commande. Le prix d'un accessoire est celui du <strong>paquet</strong> : la nomenclature en déduit le prix à la pièce et fait la <strong>moyenne de tous les fournisseurs</strong> qui portent la référence.</span>
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
${prixMoyenClientJs()}
// Lignes du catalogue de CE fournisseur (même normalisation de référence que le serveur et que
// l'index SQL : normaliserReference vient du module partagé injecté juste au-dessus).
var PF_LIGNES = ${sjX(PF_LIGNES)};
function pfEl(id){ return document.getElementById(id); }
function pfVal(id){ var e=pfEl(id); return e?(e.value||'').trim():''; }
function pfLigneParId(id){
  for(var i=0;i<PF_LIGNES.length;i++){ if(String(PF_LIGNES[i].id)===String(id)) return PF_LIGNES[i]; }
  return null;
}
function pfLigneParRef(ref, saufId){
  var k=normaliserReference(ref); if(!k) return null;
  for(var i=0;i<PF_LIGNES.length;i++){
    var l=PF_LIGNES[i];
    if(saufId && String(l.id)===String(saufId)) continue;
    if(normaliserReference(l.reference)===k) return l;
  }
  return null;
}
// Aide contextuelle : ce qu'on attend dans « Prix » et « Qté / paquet » depend de la catégorie.
function pfHint(){
  var h=pfEl('pf_hint'); if(!h) return;
  var cat=pfVal('pf_cat'), mode=pfVal('pf_id')?'Modification':'Déclaration';
  var txt;
  if(cat==='accessoire') txt='<strong>Accessoire</strong> — « Prix HT » = prix du <strong>paquet</strong> et « Qté / paquet » = nombre de <strong>pièces</strong> dedans. Sans la quantité, le prix sera compris comme un prix à la pièce et signalé en orange dans les nomenclatures.';
  else if(cat==='matiere_premiere') txt='<strong>Matière</strong> — « Prix HT » = prix d\\'<strong>une tôle</strong>. Le nombre de pièces par tôle dépend de la géométrie : il reste saisi au BE, pas ici. La quantité par paquet ne sert pas.';
  else txt='« Prix HT » est le prix de l\\'unité de commande. La quantité par paquet ne sert qu\\'aux accessoires.';
  h.innerHTML=mode+' · '+txt+' Laisser le prix vide n\\'efface jamais le prix en base (il est piloté par les demandes de prix).';
}
function pfReset(){
  ['pf_id','pf_ref','pf_des','pf_qtepaq','pf_unite','pf_delai','pf_prix'].forEach(function(k){ var e=pfEl(k); if(e) e.value=''; });
  var c=pfEl('pf_cat'); if(c) c.value='matiere_premiere';
  var b=pfEl('pf_save_btn'); if(b) b.innerHTML='<i class="fas fa-plus" style="margin-right:5px;"></i>Déclarer';
  var a=pfEl('pf_cancel_btn'); if(a) a.style.display='none';
  pfHint();
}
// Charge une ligne du catalogue dans le formulaire unique.
// conserverSaisie : ne remplit que les champs VIDES — la saisie en cours n'est jamais écrasée
// (cas du doublon détecté à la volée : l'utilisateur vient de taper un prix, on le garde).
function pfRemplir(l, conserverSaisie){
  var pose=function(k, v){
    var e=pfEl(k); if(!e) return;
    var vide=String(e.value||'').trim()==='';
    if(!conserverSaisie || vide) e.value=(v==null?'':v);
  };
  pfEl('pf_id').value=l.id||'';
  pose('pf_ref', l.reference||'');
  pose('pf_des', l.designation||'');
  var c=pfEl('pf_cat');
  if(c && (!conserverSaisie || !c.value)) c.value=l.categorie||'matiere_premiere';
  pose('pf_qtepaq', l.qte_paquet);
  pose('pf_unite', l.unite||'');
  pose('pf_delai', l.delai_jours);
  pose('pf_prix', l.prix);
  var b=pfEl('pf_save_btn'); if(b) b.innerHTML='<i class="fas fa-check" style="margin-right:5px;"></i>Enregistrer la modification';
  var a=pfEl('pf_cancel_btn'); if(a) a.style.display='';
  pfHint();
  var r=pfEl('pf_ref'); if(r){ r.focus(); r.scrollIntoView({block:'center'}); }
}
function pfDeclare(){
  var fid=pfVal('pf_fid');
  var id=pfVal('pf_id'), ref=pfVal('pf_ref'), des=pfVal('pf_des');
  if(!ref||!des){ pushNotif('err','fa-exclamation-circle','Référence et désignation obligatoires.'); return; }
  // Doublon catalogue : la même référence ne peut exister qu'UNE fois chez CE fournisseur, à la
  // casse et aux espaces près (index ux_produits_fournisseurs_ref_norm). On le dit AVANT
  // l'aller-retour et on charge la ligne existante plutôt que de laisser un 409 sans suite.
  var jumeau=pfLigneParRef(ref, id);
  if(jumeau){
    pushNotif('err','fa-triangle-exclamation','Référence « '+ref+' » déjà déclarée chez ce fournisseur (« '+(jumeau.designation||'sans désignation')+' ») : une même référence ne peut apparaître qu\\'une fois par fournisseur. Le formulaire passe en MODIFICATION de cette ligne (votre saisie est conservée, les champs vides sont pré-remplis) : vérifiez puis enregistrez.',14000);
    pfRemplir(jumeau, true);
    return;
  }
  var prixV=pfVal('pf_prix'), delaiV=pfVal('pf_delai'), qteV=pfVal('pf_qtepaq'), uniteV=pfVal('pf_unite');
  var payload={ fournisseur_id:fid, reference:ref, designation:des, categorie:pfVal('pf_cat'),
    prix:(prixV!==''?parseFloat(prixV):null), delai_jours:(delaiV!==''?parseInt(delaiV,10):null),
    qte_paquet:(qteV!==''?parseFloat(qteV):null), unite:(uniteV!==''?uniteV:null), source_prix:'manuel' };
  var url=id?('/api/produits-fournisseurs/'+encodeURIComponent(id)):'/api/produits-fournisseurs';
  var method=id?'PUT':'POST';
  fetch(url,{method:method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json();}).then(function(j){
      if(!j||!j.ok){
        if(j&&j.code==='doublon_reference'){ pushNotif('err','fa-ban',String(j.error||'Référence en doublon.'),14000); return; }
        if(j&&j.code==='doublon_catalogue'){ pushNotif('err','fa-ban',String(j.error||'Cette référence existe déjà chez ce fournisseur (à la casse près) : modifiez la ligne existante.'),14000); return; }
        pushNotif('err','fa-ban',(j&&j.error)||'Échec.',10000); return;
      }
      // Repli cloud sans la colonne qte_paquet (cloud-13 pas encore joué) : tout le reste est
      // enregistré, le serveur le DIT — on le répète à l'écran sans bloquer.
      if(j.avertissement) pushNotif('warn','fa-triangle-exclamation',String(j.avertissement),14000);
      var msg = id?'Référence modifiée.':(j.existant?'Référence déjà au catalogue : champs mis à jour (aucun prix effacé).':'Référence déclarée.');
      pushNotif('ok','fa-check',msg); setTimeout(function(){softReload();},900);
    }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function pfEdit(btn){
  var l=pfLigneParId(btn.getAttribute('data-id'));
  if(!l){ pushNotif('err','fa-ban','Référence introuvable — rechargez la page.'); return; }
  pfRemplir(l);
}
async function pfDelete(btn){
  var id=btn.getAttribute('data-id')||'';
  if(!id) return;
  if(!await appConfirm('Supprimer cette référence du catalogue fournisseur ?')) return;
  fetch('/api/produits-fournisseurs/'+encodeURIComponent(id),{method:'DELETE'}).then(function(r){return r.json();}).then(function(j){
    if(!j||!j.ok){ pushNotif('err','fa-ban',(j&&j.error)||'Échec.'); return; }
    pushNotif('ok','fa-check','Référence supprimée.'); setTimeout(function(){softReload();},500);
  }).catch(function(){ pushNotif('err','fa-exclamation-circle','Erreur réseau.'); });
}
function ffEvolRow(btn){ ffEvol(btn.getAttribute('data-ref')||'', btn.getAttribute('data-des')||''); }
async function ffEvol(reference, desig){
  var m=document.getElementById('ffEvolModal'), body=document.getElementById('ffEvolBody');
  var ffE=function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); };
  document.getElementById('ffEvolTitle').innerHTML='<i class="fas fa-chart-line" style="color:#6366f1;margin-right:6px;"></i>'+ffE(reference)+' — '+ffE(desig);
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
    // Lot H1 : catalogue (jsonb) n'est PLUS envoyé — le catalogue vit dans produits_fournisseurs
    // (bloc « Références fournies »). La colonne reste en base, elle n'est simplement plus écrite.
    tarifs: isSt ? collectTarifs() : undefined,
    // Prestations (capacités utilisées par le planning ST) = opérations déclarées dans les tarifs
    prestations: isSt ? collectTarifs().map(function(t){ return t.operation; }).filter(Boolean) : undefined,
    familles_fourniture: isSt ? undefined : (function(){ var a=[]; document.querySelectorAll('.f-fam-chk').forEach(function(c){ if(c.checked)a.push(c.value); }); return a; })(),
  };
  var url = (isSt ? '/api/sous-traitants/' : '/api/fournisseurs/') + encodeURIComponent(id);
  fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(function(r){ return r.json(); }).then(function(j){
      if(!j || !j.ok){ pushNotif('err','fa-ban', (j && j.error) || 'Enregistrement échoué.'); return; }
      var msg = isSt ? ('Fiche enregistrée — ' + (payload.prestations.length) + ' prestation' + (payload.prestations.length > 1 ? 's' : '') + '.') : 'Fiche enregistrée. Les références fournies s\\'enregistrent ligne par ligne, dans leur propre bloc.';
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
// Aide du formulaire unique posée dès l'ouverture (le bloc est visible, pas sous un onglet caché).
if(document.getElementById('pf_hint')) pfHint();
</script>`

  return layout((isSt ? 'Sous-traitant' : 'Fournisseur') + ' — ' + titre, content, 'service-achats')
}
