// ══════════════════════════════════════════════════════════════
// MISE EN STOCK (lot F, 15/09/2026) — règles PURES (ni base, ni DOM)
// Utilisées par les routes /api/stock/… et par ajouterAMettreEnStock (src/index.tsx).
//
// Demande : « un nouvel onglet qui sera la mise en stock, le premier onglet du stock, dans lequel
// quand on aura fini le PV de réception avec ce qui a été validé conforme ça va directement, référence
// par référence, dans la liste des choses à rentrer dans le stock. Un bouton pour accepter l'entrée en
// stock avec la ref et le type d'objet ; en fonction de ce type une liste déroulante de la zone
// géographique. Chaque ref a son endroit défini : ref nouvelle ⇒ on choisit l'endroit ; ref ancienne
// dont l'endroit est déterminé ⇒ il reste fixe (modifiable à la main dans les niveaux d'appro). »
//
// Règles :
//   · La FILE (`mises_en_stock`) reçoit des entrées : PV de réception (lignes conformes), décision de
//     la Qualité (part acceptée), excédent validé par la hiérarchie, entrée manuelle. Rien n'est
//     crédité au stock tant qu'une personne qui écrit en Stock n'a pas ACCEPTÉ le rangement.
//   · Type d'objet : liste modifiable dans l'ERP (`stock_types_objet`), pré-remplie par déduction ;
//     obligatoire au rangement.
//   · Emplacement : celui de la référence (`stock.emplacement`) est FIXE — une valeur différente est
//     refusée, le changement se fait dans Niveaux d'approvisionnement (historisé). Nouvelle référence
//     (ou référence sans emplacement) ⇒ zone OBLIGATOIRE dans la liste des zones du type ; un type
//     sans aucune zone ⇒ « nouvelle zone pour ce type » obligatoire (elle rejoint la liste : jamais
//     de texte libre non référencé).
//   · Ajustement = inventaire (nouvelle quantité + motif obligatoire, écart signé) ; sortie refusée si
//     le stock est insuffisant.
// ══════════════════════════════════════════════════════════════

export type OrigineMiseEnStock = 'pv' | 'decision_qualite' | 'excedent_valide' | 'entree_manuelle'
export const ORIGINES_MISE_EN_STOCK: readonly OrigineMiseEnStock[] = ['pv', 'decision_qualite', 'excedent_valide', 'entree_manuelle']
export type StatutMiseEnStock = 'a_ranger' | 'range' | 'annule'
export const STATUTS_MISE_EN_STOCK: readonly StatutMiseEnStock[] = ['a_ranger', 'range', 'annule']

/** Types d'objet de départ (amorcés par la migration 013 / cloud-11, puis modifiables dans l'ERP). */
export const TYPES_OBJET_DEPART: ReadonlyArray<{ code: string; libelle: string; ordre: number }> = [
  { code: 'matiere_premiere', libelle: 'Matière première', ordre: 10 },
  { code: 'accessoire', libelle: 'Accessoire', ordre: 20 },
  { code: 'consommable', libelle: 'Consommable', ordre: 30 },
  { code: 'outillage', libelle: 'Outillage', ordre: 40 },
  { code: 'chimique', libelle: 'Produit chimique', ordre: 50 },
  { code: 'epi', libelle: 'EPI', ordre: 60 },
]

export const MSG_CLOUD11 = 'Mise en stock indisponible : la base n’a pas encore les tables du lot F. Jouez la migration 013 (VM : erp-docker.sh maj) ou le script cloud-11 (Supabase Studio), puis rechargez.'
export const MSG_STOCK_RESERVE = 'Réservé aux personnes qui ont l’écriture sur le Stock.'
export const MSG_EMPLACEMENT_FIXE = 'Cette référence a déjà son emplacement fixe : il ne se change pas au rangement. Pour le déplacer, passez par Gestion du stock › Niveaux d’approvisionnement (le changement y est historisé).'
export const MOTIF_MVT_MISE_EN_STOCK = 'Mise en stock '
export const LONGUEUR_MAX_ZONE = 80

// ─── Petits outils ───────────────────────────────────────────────
const txt = (v: unknown): string => String(v ?? '').trim()
const txtOuNull = (v: unknown, max = 500): string | null => { const s = txt(v); return s ? s.slice(0, max) : null }
/** Clé de comparaison d'une référence / d'une zone : même règle que l'index unique (lower + btrim). */
export const cleRef = (v: unknown): string => txt(v).toLowerCase()
export const arrondi3 = (n: number): number => Math.round(n * 1000) / 1000
const sansAccents = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
/** Nombre saisi (« 12,5 » accepté). NaN si vide ou illisible. */
export function nombreSaisi(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN
  const s = txt(v).replace(/\s/g, '').replace(',', '.')
  if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return NaN
  return Number(s)
}

export type TypeObjet = { code: string; libelle?: string | null; ordre?: number | null; actif?: boolean | null }
export type ZoneStock = { id: string; type_objet: string; zone: string; ordre?: number | null; actif?: boolean | null }
const typeActif = (types: TypeObjet[], code: string): TypeObjet | null =>
  (types || []).find(t => t && t.code === code && t.actif !== false) || null
export const libelleType = (types: TypeObjet[], code: unknown): string => {
  const c = txt(code)
  if (!c) return ''
  const t = (types || []).find(x => x && x.code === c)
  return t ? txt(t.libelle) || c : c
}

// ─── Déduction du type d'objet ─────────────────────────────────────
/** Catégorie libre (stock, BC, DA, catalogue fournisseur, nomenclature) → code de type, ou null. */
export function codeDepuisCategorie(v: unknown): string | null {
  const k = sansAccents(txt(v)).toLowerCase().replace(/[\s_-]+/g, ' ').trim()
  if (!k) return null
  if (['matiere premiere', 'matiere', 'matieres', 'matiere 1ere', 'inox', 'alu', 'aluminium', 'acier', 'tole', 'toles', 'profile', 'profiles'].includes(k)) return 'matiere_premiere'
  if (k === 'accessoire' || k === 'accessoires') return 'accessoire'
  if (k === 'consommable' || k === 'consommables') return 'consommable'
  if (k === 'outillage' || k === 'outil' || k === 'outils') return 'outillage'
  if (k === 'chimique' || k === 'chimie' || k === 'produit chimique' || k === 'produits chimiques' || k === 'chimique oas') return 'chimique'
  if (k === 'epi' || k === 'securite' || k === 'epi securite' || k === 'epi / securite' || k === 'securite/epi' || k === 'securite epi') return 'epi'
  return null
}

export type SourceTypeObjet = 'stock' | 'stock_categorie' | 'bc' | 'catalogue' | 'chimique' | 'epi' | 'nomenclature'
export type ContexteTypeObjet = {
  /** Ligne `stock` de la référence (type_objet, categorie, famille) si elle existe. */
  stock?: { type_objet?: unknown; categorie?: unknown; famille?: unknown } | null
  /** Catégorie du bon de commande (catégories de DA : Matière, Outillage…). */
  bcCategorie?: unknown
  /** Catégorie du produit au catalogue fournisseur (produits_fournisseurs.categorie). */
  catalogueCategorie?: unknown
  /** La référence figure au registre des produits chimiques (hse_produits_chimiques.ref_stock). */
  chimique?: boolean
  /** La référence figure au catalogue EPI (hse_epi_catalogue.ref_stock). */
  epi?: boolean
  /** Catégorie dans une nomenclature (fournitures_nomenclature.categorie : matiere | accessoire). */
  nomenclatureCategorie?: unknown
  /** Codes des types ACTIFS : une déduction hors liste est ignorée (la personne choisit). */
  typesActifs?: string[] | null
}
/**
 * Type d'objet PROPOSÉ pour une référence (pré-remplissage de la fenêtre de rangement, jamais imposé).
 * Ordre : type déjà porté par la référence → catégorie / famille du stock → catégorie du BC →
 * catalogue fournisseur → registre chimique / catalogue EPI → nomenclature. Rien ⇒ choix obligatoire.
 */
export function deduireTypeObjet(ctx: ContexteTypeObjet): { code: string | null; source: SourceTypeObjet | null } {
  const actifs = Array.isArray(ctx?.typesActifs) ? ctx.typesActifs : null
  const ok = (code: string | null): code is string => !!code && (!actifs || actifs.includes(code))
  const st = ctx?.stock || null
  if (st) {
    const porte = txt(st.type_objet)
    if (ok(porte)) return { code: porte, source: 'stock' }
    // « consommable » de famille « outillage » : c'est un outil (3 références en base)
    if (codeDepuisCategorie(st.famille) === 'outillage' && ok('outillage')) return { code: 'outillage', source: 'stock_categorie' }
    const parCat = codeDepuisCategorie(st.categorie)
    if (ok(parCat)) return { code: parCat, source: 'stock_categorie' }
    const parFam = codeDepuisCategorie(st.famille)
    if (ok(parFam)) return { code: parFam, source: 'stock_categorie' }
  }
  const parBc = codeDepuisCategorie(ctx?.bcCategorie)
  if (ok(parBc)) return { code: parBc, source: 'bc' }
  const parCatalogue = codeDepuisCategorie(ctx?.catalogueCategorie)
  if (ok(parCatalogue)) return { code: parCatalogue, source: 'catalogue' }
  if (ctx?.chimique && ok('chimique')) return { code: 'chimique', source: 'chimique' }
  if (ctx?.epi && ok('epi')) return { code: 'epi', source: 'epi' }
  const parNom = codeDepuisCategorie(ctx?.nomenclatureCategorie)
  if (ok(parNom)) return { code: parNom, source: 'nomenclature' }
  return { code: null, source: null }
}

// ─── Entrée dans la file « À ranger » ─────────────────────────────
export type EntreeMiseEnStock = {
  origine: OrigineMiseEnStock
  bc_id?: string | null; bl_id?: string | null; pv_id?: string | null; ligne_idx?: number | null
  quarantaine_id?: string | null; validation_id?: string | null
  reference: string | null; designation: string | null; type_objet?: string | null
  quantite: number; unite?: string | null; num_affaire?: string | null; fournisseur_nom?: string | null
  cree_par?: string | null
  /** Facultatif (entrée manuelle : origine de l'entrée). */
  motif?: string | null
}
export type CleIdempotence =
  | { pv_id: string; ligne_idx: number | null; origine: OrigineMiseEnStock }
  | { bl_id: string; ligne_idx: number | null; origine: 'pv' }
  | { quarantaine_id: string; ligne_idx: number | null; origine: 'decision_qualite' }
  | { validation_id: string; ligne_idx: number | null; origine: 'excedent_valide' }
/**
 * Valide et normalise une entrée de file. Chaque origine automatique porte sa clé d'idempotence
 * (PV + ligne, quarantaine + ligne, validation + ligne) : rejouer le même appel ne crée pas de doublon
 * (index uniques de la migration 013).
 */
export function normaliserEntreeFile(e: Partial<EntreeMiseEnStock> | null | undefined):
  { ok: true; payload: Record<string, any>; cle: CleIdempotence | null; cleReception: CleIdempotence | null } | { ok: false; error: string } {
  if (!e || typeof e !== 'object') return { ok: false, error: 'entrée vide' }
  const origine = txt(e.origine) as OrigineMiseEnStock
  if (!ORIGINES_MISE_EN_STOCK.includes(origine)) return { ok: false, error: 'origine « ' + txt(e.origine) + ' » inconnue (pv, decision_qualite, excedent_valide, entree_manuelle)' }
  const q = nombreSaisi(e.quantite)
  if (!(q > 0)) return { ok: false, error: 'quantité à ranger invalide (' + txt(e.quantite) + ')' }
  const reference = txtOuNull(e.reference, 120)
  const designation = txtOuNull(e.designation, 500)
  if (!reference && !designation) return { ok: false, error: 'ni référence ni désignation' }
  let ligneIdx: number | null = null
  if (e.ligne_idx != null && String(e.ligne_idx).trim() !== '') {
    const n = Number(e.ligne_idx)
    if (!Number.isInteger(n) || n < 0) return { ok: false, error: 'repère de ligne invalide (' + String(e.ligne_idx) + ')' }
    ligneIdx = n
  }
  const pvId = txtOuNull(e.pv_id, 120)
  const quarId = txtOuNull(e.quarantaine_id, 120)
  const valId = txtOuNull(e.validation_id, 120)
  if (origine === 'pv' && !pvId) return { ok: false, error: 'entrée issue d’un PV sans n° de PV' }
  if (origine === 'decision_qualite' && !quarId) return { ok: false, error: 'entrée issue d’une décision Qualité sans quarantaine' }
  if (origine === 'excedent_valide' && !valId) return { ok: false, error: 'excédent validé sans n° de validation' }
  const payload: Record<string, any> = {
    statut: 'a_ranger', origine,
    bc_id: txtOuNull(e.bc_id, 120), bl_id: txtOuNull(e.bl_id, 120), pv_id: pvId, ligne_idx: ligneIdx,
    quarantaine_id: quarId, validation_id: valId,
    reference, designation, type_objet: txtOuNull(e.type_objet, 60),
    quantite: arrondi3(q), unite: txtOuNull(e.unite, 30),
    num_affaire: txtOuNull(e.num_affaire, 120), fournisseur_nom: txtOuNull(e.fournisseur_nom, 200),
    cree_par: txtOuNull(e.cree_par, 200),
  }
  const motif = txtOuNull(e.motif, 300)
  if (motif) payload.motif = motif
  let cle: CleIdempotence | null = null
  if (pvId) cle = { pv_id: pvId, ligne_idx: ligneIdx, origine }
  else if (origine === 'decision_qualite' && quarId) cle = { quarantaine_id: quarId, ligne_idx: ligneIdx, origine }
  else if (origine === 'excedent_valide' && valId) cle = { validation_id: valId, ligne_idx: ligneIdx, origine }
  // Vérification lot F : UNE réception (BL) ne met chaque ligne en file qu'une fois, quel que soit le n° de PV — deux PV
  // du même BL (base sans l'index unique 012, saisie simultanée) ne créditeraient pas deux fois (index ux_mes_pv_bl_ligne).
  const blId = payload.bl_id as string | null
  const cleReception: CleIdempotence | null = (origine === 'pv' && blId) ? { bl_id: blId, ligne_idx: ligneIdx, origine: 'pv' } : null
  return { ok: true, payload, cle, cleReception }
}

// ─── Rangement (« Accepter l'entrée en stock ») ─────────────────────
export type LigneFile = { statut?: unknown; reference?: unknown; designation?: unknown; quantite?: unknown; unite?: unknown; type_objet?: unknown }
export type ArticleStockMin = { id: unknown; reference?: unknown; emplacement?: unknown; type_objet?: unknown; unite?: unknown } | null | undefined
export type SaisieRangement = { type_objet?: unknown; emplacement?: unknown; nouvelle_zone?: unknown; reference?: unknown }
export type ValeursRangement = {
  reference: string
  type_objet: string
  quantite: number
  /** Libellé de zone écrit dans stock.emplacement. */
  emplacement: string
  /** Zone à ajouter à la liste du type avant de ranger (null = zone existante). */
  zoneACreer: string | null
  /** L'emplacement vient de la référence (fixe) : rien à écrire côté emplacement. */
  emplacementFixe: boolean
  /** Première affectation d'un emplacement à la référence : à historiser. */
  premiereAffectation: boolean
}
export type ResultatRangement = { ok: true; valeurs: ValeursRangement } | { ok: false; error: string; champ: string | null; http: 400 | 409 }

/**
 * Règles du rangement d'une ligne de file, contre les données RELUES (ligne, article de stock de la même
 * référence, types et zones). N'écrit rien ; le serveur applique ensuite.
 */
export function validerRangement(p: { ligne: LigneFile; article: ArticleStockMin; saisie: SaisieRangement; types: TypeObjet[]; zones: ZoneStock[] }): ResultatRangement {
  const ligne = p?.ligne || {}
  const saisie = p?.saisie || {}
  const types = Array.isArray(p?.types) ? p.types : []
  const zones = Array.isArray(p?.zones) ? p.zones : []
  const art = p?.article || null
  if (txt(ligne.statut) !== 'a_ranger') return { ok: false, http: 409, champ: null, error: 'Cette ligne n’est plus à ranger (déjà rangée ou annulée) : rechargez la page.' }
  const q = nombreSaisi(ligne.quantite)
  if (!(q > 0)) return { ok: false, http: 400, champ: null, error: 'Quantité à ranger invalide sur cette ligne : annulez-la et recréez une entrée correcte.' }
  // La référence de la ligne est en lecture ; seule une ligne SANS référence en reçoit une.
  const reference = txt(ligne.reference) || txt(saisie.reference)
  if (!reference) return { ok: false, http: 400, champ: 'reference', error: 'Cette ligne ne porte pas de référence : saisissez la référence de stock sous laquelle la ranger.' }
  if (reference.length > 120) return { ok: false, http: 400, champ: 'reference', error: 'Référence trop longue (120 caractères au plus).' }
  // Type : celui choisi dans la fenêtre, sinon celui de la référence, sinon celui porté par la ligne (entrée manuelle typée).
  const type = txt(saisie.type_objet) || txt(art?.type_objet) || txt(ligne.type_objet)
  if (!type) return { ok: false, http: 400, champ: 'type_objet', error: 'Choisissez le type d’objet.' }
  if (!typeActif(types, type)) return { ok: false, http: 400, champ: 'type_objet', error: 'Type d’objet « ' + type + ' » inconnu ou désactivé : choisissez-en un dans la liste.' }

  const fixe = txt(art?.emplacement)
  const saisieEmp = txt(saisie.emplacement)
  const nouvelle = txt(saisie.nouvelle_zone)
  if (fixe) {
    if ((saisieEmp && cleRef(saisieEmp) !== cleRef(fixe)) || (nouvelle && cleRef(nouvelle) !== cleRef(fixe))) {
      return { ok: false, http: 409, champ: 'emplacement', error: MSG_EMPLACEMENT_FIXE + ' (emplacement actuel : ' + fixe + ')' }
    }
    return { ok: true, valeurs: { reference, type_objet: type, quantite: arrondi3(q), emplacement: fixe, zoneACreer: null, emplacementFixe: true, premiereAffectation: false } }
  }
  const zonesDuType = zones.filter(z => z && z.type_objet === type)
  const actives = zonesDuType.filter(z => z.actif !== false)
  if (nouvelle) {
    if (nouvelle.length > LONGUEUR_MAX_ZONE) return { ok: false, http: 400, champ: 'nouvelle_zone', error: 'Nom de zone trop long (' + LONGUEUR_MAX_ZONE + ' caractères au plus).' }
    const meme = zonesDuType.find(z => cleRef(z.zone) === cleRef(nouvelle))
    if (meme && meme.actif === false) return { ok: false, http: 409, champ: 'nouvelle_zone', error: 'La zone « ' + meme.zone + ' » existe déjà pour ce type mais elle est désactivée : réactivez-la dans Rangement › Types & zones, ou choisissez-en une autre.' }
    if (meme) return { ok: true, valeurs: { reference, type_objet: type, quantite: arrondi3(q), emplacement: meme.zone, zoneACreer: null, emplacementFixe: false, premiereAffectation: true } }
    return { ok: true, valeurs: { reference, type_objet: type, quantite: arrondi3(q), emplacement: nouvelle, zoneACreer: nouvelle, emplacementFixe: false, premiereAffectation: true } }
  }
  if (!actives.length) {
    return { ok: false, http: 400, champ: 'nouvelle_zone', error: 'Le type « ' + libelleType(types, type) + ' » n’a encore aucune zone de stockage : saisissez la nouvelle zone pour ce type (elle rejoindra sa liste).' }
  }
  if (!saisieEmp) return { ok: false, http: 400, champ: 'emplacement', error: 'Nouvelle référence (ou référence sans emplacement) : choisissez la zone où la ranger. Elle deviendra son emplacement fixe.' }
  const zone = actives.find(z => cleRef(z.zone) === cleRef(saisieEmp))
  if (!zone) return { ok: false, http: 400, champ: 'emplacement', error: 'La zone « ' + saisieEmp + ' » n’est pas dans la liste du type « ' + libelleType(types, type) + ' » : choisissez-en une, ou ajoutez-la.' }
  return { ok: true, valeurs: { reference, type_objet: type, quantite: arrondi3(q), emplacement: zone.zone, zoneACreer: null, emplacementFixe: false, premiereAffectation: true } }
}

// ─── Changement d'emplacement / de type (Niveaux d'approvisionnement) ─────
export type ResultatChangement =
  | { ok: true; valeurs: { typeCible: string | null; changeType: boolean; avant: string | null; apres: string | null; changeEmplacement: boolean; motif: string | null; avertissement: string | null } }
  | { ok: false; error: string; champ: string | null }
export function validerChangementEmplacement(p: {
  article: { type_objet?: unknown; emplacement?: unknown } | null | undefined
  saisie: { type_objet?: unknown; emplacement?: unknown; motif?: unknown }
  types: TypeObjet[]; zones: ZoneStock[]
}): ResultatChangement {
  const art = p?.article || {}
  const s = p?.saisie || {}
  const types = Array.isArray(p?.types) ? p.types : []
  const zones = Array.isArray(p?.zones) ? p.zones : []
  const typeActuel = txt(art.type_objet) || null
  const typeSaisi = ('type_objet' in s) ? (txt(s.type_objet) || null) : undefined
  if (typeSaisi && !typeActif(types, typeSaisi)) return { ok: false, champ: 'type_objet', error: 'Type d’objet « ' + typeSaisi + ' » inconnu ou désactivé.' }
  if (typeSaisi === null && typeActuel) return { ok: false, champ: 'type_objet', error: 'Le type d’objet d’une référence ne se vide pas : choisissez-en un autre.' }
  const typeCible = typeSaisi || typeActuel
  const changeType = !!typeSaisi && typeSaisi !== typeActuel
  const avant = txt(art.emplacement) || null
  let apres: string | null = avant
  let changeEmplacement = false
  if ('emplacement' in s) {
    const voulu = txt(s.emplacement) || null
    if (voulu) {
      if (!typeCible) return { ok: false, champ: 'type_objet', error: 'Choisissez d’abord le type d’objet de la référence : la zone se choisit dans la liste de son type.' }
      const zone = zones.find(z => z && z.type_objet === typeCible && z.actif !== false && cleRef(z.zone) === cleRef(voulu))
      if (!zone) return { ok: false, champ: 'emplacement', error: 'La zone « ' + voulu + ' » n’est pas dans la liste du type « ' + libelleType(types, typeCible) + ' ».' }
      apres = zone.zone
    } else apres = null
    changeEmplacement = (avant ?? null) !== (apres ?? null)   // la casse compte : on aligne sur le libellé de la zone
  }
  if (!changeType && !changeEmplacement) return { ok: false, champ: null, error: 'Rien à modifier.' }
  let avertissement: string | null = null
  if (changeType && !changeEmplacement && avant && typeCible) {
    const dansListe = zones.some(z => z && z.type_objet === typeCible && cleRef(z.zone) === cleRef(avant))
    if (!dansListe) avertissement = 'L’emplacement actuel « ' + avant + ' » ne figure pas dans les zones du type « ' + libelleType(types, typeCible) + ' » : pensez à le déplacer.'
  }
  return { ok: true, valeurs: { typeCible, changeType, avant, apres, changeEmplacement, motif: txtOuNull(s.motif, 300), avertissement } }
}

// ─── Mouvements manuels ─────────────────────────────────────────────
export type ResultatMouvement = { ok: true; valeurs: { avant: number; apres: number; quantite: number; motif: string } } | { ok: false; error: string; champ: string | null; http: 400 | 409 }
const MOTIF_MIN = 3
/** Ajustement d'inventaire : quantité constatée + motif obligatoire ; le mouvement porte l'écart SIGNÉ. */
export function validerAjustement(p: { stock_actuel: unknown; nouvelle_quantite: unknown; motif: unknown }): ResultatMouvement {
  const nq = nombreSaisi(p?.nouvelle_quantite)
  if (!Number.isFinite(nq) || nq < 0) return { ok: false, http: 400, champ: 'nouvelle_quantite', error: 'Saisissez la quantité réellement constatée (nombre positif ou nul).' }
  const motif = txt(p?.motif)
  if (motif.length < MOTIF_MIN) return { ok: false, http: 400, champ: 'motif', error: 'Motif obligatoire pour un ajustement de stock.' }
  const avant = Number(p?.stock_actuel) || 0
  const apres = arrondi3(nq)
  const ecart = arrondi3(apres - avant)
  if (ecart === 0) return { ok: false, http: 400, champ: 'nouvelle_quantite', error: 'Aucun écart : la quantité constatée est égale au stock actuel (' + avant + ').' }
  return { ok: true, valeurs: { avant, apres, quantite: ecart, motif: motif.slice(0, 300) } }
}
/** Sortie réelle : quantité > 0, motif obligatoire, refusée au-delà du stock disponible. */
export function validerSortie(p: { stock_actuel: unknown; quantite: unknown; motif: unknown }): ResultatMouvement {
  const q = nombreSaisi(p?.quantite)
  if (!(q > 0)) return { ok: false, http: 400, champ: 'quantite', error: 'Quantité à sortir invalide.' }
  const motif = txt(p?.motif)
  if (motif.length < MOTIF_MIN) return { ok: false, http: 400, champ: 'motif', error: 'Motif de sortie obligatoire.' }
  const avant = Number(p?.stock_actuel) || 0
  if (arrondi3(q) > arrondi3(avant)) return { ok: false, http: 409, champ: 'quantite', error: 'Stock insuffisant : ' + avant + ' disponible(s), sortie de ' + arrondi3(q) + ' refusée.' }
  return { ok: true, valeurs: { avant, apres: arrondi3(avant - q), quantite: arrondi3(q), motif: motif.slice(0, 300) } }
}
/** Entrée manuelle : elle ne crédite rien, elle ajoute une ligne à la file « À ranger ». */
export function validerEntreeManuelle(b: { reference?: unknown; designation?: unknown; quantite?: unknown; unite?: unknown; motif?: unknown; type_objet?: unknown; num_affaire?: unknown }, types: TypeObjet[]):
  { ok: true; entree: EntreeMiseEnStock; motif: string } | { ok: false; error: string; champ: string | null } {
  const reference = txt(b?.reference)
  if (!reference) return { ok: false, champ: 'reference', error: 'Référence obligatoire (existante ou nouvelle).' }
  if (reference.length > 120) return { ok: false, champ: 'reference', error: 'Référence trop longue (120 caractères au plus).' }
  const q = nombreSaisi(b?.quantite)
  if (!(q > 0)) return { ok: false, champ: 'quantite', error: 'Quantité reçue invalide.' }
  const motif = txt(b?.motif)
  if (motif.length < MOTIF_MIN) return { ok: false, champ: 'motif', error: 'Motif obligatoire (origine de l’entrée : retour atelier, régularisation, don…).' }
  const type = txt(b?.type_objet)
  if (type && !typeActif(Array.isArray(types) ? types : [], type)) return { ok: false, champ: 'type_objet', error: 'Type d’objet « ' + type + ' » inconnu ou désactivé.' }
  return {
    ok: true, motif: motif.slice(0, 300),
    entree: { origine: 'entree_manuelle', reference, designation: txtOuNull(b?.designation, 500), type_objet: type || null, quantite: arrondi3(q), unite: txtOuNull(b?.unite, 30), num_affaire: txtOuNull(b?.num_affaire, 120), motif: motif.slice(0, 300) },
  }
}

// ─── Référentiels modifiables (types d'objet, zones) ──────────────────
export function codeDepuisLibelle(libelle: unknown): string {
  return sansAccents(txt(libelle)).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)
}
export function validerTypeObjet(b: { code?: unknown; libelle?: unknown; ordre?: unknown }, existants: TypeObjet[]):
  { ok: true; valeurs: { code: string; libelle: string; ordre: number } } | { ok: false; error: string; champ: string | null; http: 400 | 409 } {
  const libelle = txt(b?.libelle)
  if (libelle.length < 2 || libelle.length > 60) return { ok: false, http: 400, champ: 'libelle', error: 'Libellé du type : 2 à 60 caractères.' }
  const code = txt(b?.code) ? codeDepuisLibelle(b?.code) : codeDepuisLibelle(libelle)
  if (!/^[a-z0-9_]{2,40}$/.test(code)) return { ok: false, http: 400, champ: 'code', error: 'Code du type invalide (lettres, chiffres, souligné).' }
  const liste = Array.isArray(existants) ? existants : []
  if (liste.some(t => t && t.code === code)) return { ok: false, http: 409, champ: 'code', error: 'Le type « ' + code + ' » existe déjà (réactivez-le s’il est désactivé).' }
  if (liste.some(t => t && cleRef(t.libelle) === cleRef(libelle))) return { ok: false, http: 409, champ: 'libelle', error: 'Un type porte déjà le libellé « ' + libelle + ' ».' }
  const o = nombreSaisi(b?.ordre)
  const ordre = Number.isFinite(o) ? Math.round(o) : (liste.reduce((m, t) => Math.max(m, Number(t?.ordre) || 0), 0) + 10)
  return { ok: true, valeurs: { code, libelle, ordre } }
}
export function validerZone(b: { type_objet?: unknown; zone?: unknown; ordre?: unknown }, types: TypeObjet[], zones: ZoneStock[]):
  { ok: true; valeurs: { type_objet: string; zone: string; ordre: number }; existante: ZoneStock | null } | { ok: false; error: string; champ: string | null; http: 400 | 409 } {
  const type = txt(b?.type_objet)
  if (!type || !typeActif(Array.isArray(types) ? types : [], type)) return { ok: false, http: 400, champ: 'type_objet', error: 'Choisissez un type d’objet actif pour la zone.' }
  const zone = txt(b?.zone)
  if (!zone) return { ok: false, http: 400, champ: 'zone', error: 'Nom de zone obligatoire.' }
  if (zone.length > LONGUEUR_MAX_ZONE) return { ok: false, http: 400, champ: 'zone', error: 'Nom de zone trop long (' + LONGUEUR_MAX_ZONE + ' caractères au plus).' }
  const liste = (Array.isArray(zones) ? zones : []).filter(z => z && z.type_objet === type)
  const existante = liste.find(z => cleRef(z.zone) === cleRef(zone)) || null
  const o = nombreSaisi(b?.ordre)
  const ordre = Number.isFinite(o) ? Math.round(o) : (liste.reduce((m, z) => Math.max(m, Number(z?.ordre) || 0), 0) + 10)
  return { ok: true, valeurs: { type_objet: type, zone, ordre }, existante }
}

// ─── Porte matière ────────────────────────────────────────────────
/** BC qui ont encore au moins une ligne « à ranger » : leur matière n'est pas encore disponible. */
export function bcsAvecLignesARanger(lignes: Array<{ statut?: unknown; bc_id?: unknown }> | null | undefined): Set<string> {
  const s = new Set<string>()
  for (const l of (Array.isArray(lignes) ? lignes : [])) if (l && txt(l.statut) === 'a_ranger' && txt(l.bc_id)) s.add(txt(l.bc_id))
  return s
}

// ─── Décision de la Qualité sur un lot reçu (F4) : quelles lignes du BC, quelle part acceptée par ligne ───
/** Ligne du BC couverte par une quarantaine de réception ; `qte` = quantité mise en quarantaine pour cette ligne (null = inconnue). */
export type LigneCouverte = { idx: number; reference: string | null; designation: string | null; unite: string | null; num_affaire: string | null; qte: number | null }
/**
 * `ligne` : quarantaine d'UNE ligne qualitative (PV v2) ; `certificat` : réception bloquée par le certificat matière absent
 * (toutes les lignes sans observation du PV v2) ; `reception` : toute la réception (PV d'avant le lot F, ou quarantaine
 * non rattachable à une ligne) — lignes du BC, quantité commandée.
 */
export type CouvertureQuarantaine = { source: 'ligne' | 'certificat' | 'reception'; lignes: LigneCouverte[] }
type LigneBcMin = { idx: number; reference?: unknown; designation?: unknown; unite?: unknown; num_affaire?: unknown; qte_commandee?: unknown; reconstituee?: boolean }
const positifOuNull = (v: unknown): number | null => { const n = nombreSaisi(v); return Number.isFinite(n) && n > 0 ? arrondi3(n) : null }
const entierOuNull = (v: unknown): number | null => {
  if (v == null || typeof v === 'boolean' || String(v).trim() === '') return null
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 ? n : null
}
/**
 * Lignes du bon de commande couvertes par une quarantaine de réception — pour savoir quelles références la part
 * acceptée par la Qualité envoie dans la file « À ranger ». Ordre de preuve : colonne `quarantaines.ligne_idx`
 * (migration 013) → identifiant de la quarantaine dans `pv_controle.detail` v2 (ligne, ou certificat absent) →
 * motif « Ligne n · … » / « Certificat matière absent … » (détail non complété) → toute la réception.
 */
export function lignesDeQuarantaine(p: { quarantaine: { id?: unknown; ligne_idx?: unknown; motif?: unknown } | null | undefined; detailPv?: unknown; lignesBc: LigneBcMin[] | null | undefined }): CouvertureQuarantaine {
  const q = p?.quarantaine || {}
  let d: any = p?.detailPv
  if (typeof d === 'string') { try { d = JSON.parse(d) } catch { d = null } }
  const v2 = !!d && typeof d === 'object' && Number(d.v) >= 2 && Array.isArray(d.lignes)
  const lignesDetail: any[] = v2 ? (d.lignes as any[]).filter(l => l && typeof l === 'object' && entierOuNull(l.idx) != null) : []
  const bc = Array.isArray(p?.lignesBc) ? p.lignesBc : []
  const deDetail = (l: any, qte: number | null): LigneCouverte => ({
    idx: Number(l.idx), reference: txtOuNull(l.reference, 120), designation: txtOuNull(l.designation, 500),
    unite: txtOuNull(l.unite, 30), num_affaire: txtOuNull(l.num_affaire, 120), qte,
  })
  const deBc = (l: LigneBcMin, qte: number | null): LigneCouverte => ({
    idx: l.idx, reference: txtOuNull(l.reference, 120), designation: txtOuNull(l.designation, 500),
    unite: txtOuNull(l.unite, 30), num_affaire: txtOuNull(l.num_affaire, 120), qte,
  })
  const ligneSeule = (l: any): CouvertureQuarantaine => ({ source: 'ligne', lignes: [deDetail(l, positifOuNull(l.qte_quarantaine) ?? partPrevue(l))] })
  // Part PRÉVUE de la ligne (l'excédent n'est pas en quarantaine : il attend la validation hiérarchique — vérification lot F).
  const partPrevue = (l: any): number | null => {
    const r = positifOuNull(l.qte_recue)
    const pv = positifOuNull(l.qte_prevue)
    return r == null ? null : (pv == null ? r : Math.min(r, pv))
  }
  const lignesCertificat = (): CouvertureQuarantaine => ({ source: 'certificat', lignes: lignesDetail.filter(l => !txt(l.observation) && partPrevue(l) != null).map(l => deDetail(l, partPrevue(l))) })
  const qid = txt(q.id)
  const idxCol = entierOuNull(q.ligne_idx)
  if (idxCol != null) {
    const ld = lignesDetail.find(l => Number(l.idx) === idxCol)
    if (ld) return ligneSeule(ld)
    const lb = bc.find(l => l && l.idx === idxCol)
    if (lb) return { source: 'ligne', lignes: [deBc(lb, null)] }
  }
  if (v2) {
    const parId = qid ? lignesDetail.find(l => txt(l.quarantaine_id) === qid) : null
    if (parId) return ligneSeule(parId)
    const cert = d.certificat_absent && typeof d.certificat_absent === 'object' ? d.certificat_absent : null
    if (cert && qid && txt(cert.quarantaine_id) === qid) return lignesCertificat()
    const motif = txt(q.motif)
    const m = motif.match(/^Ligne (\d+)\b/)
    if (m) {
      const ld = lignesDetail.find(l => Number(l.idx) === Number(m[1]) - 1 && positifOuNull(l.qte_quarantaine) != null)
      if (ld) return ligneSeule(ld)
    }
    if (cert && /^certificat mati[eè]re absent/i.test(motif)) return lignesCertificat()
    // PV v2 dont la quarantaine ne se rattache à rien : toute la réception, quantités reçues (la répartition sera demandée).
    if (lignesDetail.length) return { source: 'reception', lignes: lignesDetail.map(l => deDetail(l, positifOuNull(l.qte_recue))) }
  }
  // PV d'avant le lot F : la quarantaine portait toute la réception.
  return { source: 'reception', lignes: bc.filter(l => l && Number.isInteger(l.idx)).map(l => deBc(l, positifOuNull(l.qte_commandee))) }
}

export type LigneAcceptee = LigneCouverte & { qte: number }
/**
 * Part acceptée par la Qualité (dérogation = tout le lot, entrée partielle = `qteAcceptee`) répartie sur les lignes couvertes.
 *   · une seule ligne (ou plusieurs lignes du même article) : toute la part sur elle ;
 *   · plusieurs articles : `saisie` [{idx, qte}] (somme = part acceptée, chaque ligne ≤ sa quantité en quarantaine) ;
 *     sans saisie, seulement si la part acceptée est EXACTEMENT la somme des lignes (tout accepté) — sinon la répartition
 *     est demandée : on n'invente jamais quelle référence entre en stock.
 */
export function repartirPartAcceptee(p: { couverture: CouvertureQuarantaine; qteAcceptee: unknown; saisie?: unknown }):
  { ok: true; lignes: LigneAcceptee[] } | { ok: false; error: string; repartition_requise: boolean } {
  const acc = nombreSaisi(p?.qteAcceptee)
  if (!(acc > 0)) return { ok: true, lignes: [] }
  const total = arrondi3(acc)
  const lignes = Array.isArray(p?.couverture?.lignes) ? p.couverture.lignes : []
  if (!lignes.length) return { ok: false, repartition_requise: false, error: 'Aucune ligne du bon de commande n’est rattachée à ce lot : la part acceptée ne peut pas partir en Mise en stock.' }
  const nomLigne = (l: LigneCouverte) => ['ligne ' + (l.idx + 1), l.reference, l.designation].filter(x => x != null && String(x).trim() !== '').join(' · ')
  const fr = (n: number) => String(arrondi3(n)).replace('.', ',')
  const saisie = Array.isArray(p?.saisie) ? (p.saisie as any[]) : null
  if (saisie && saisie.length) {
    const vus = new Set<number>()
    const out: LigneAcceptee[] = []
    let somme = 0
    for (const s of saisie) {
      const idx = entierOuNull(s && typeof s === 'object' ? s.idx : null)
      const l = idx == null ? null : lignes.find(x => x.idx === idx)
      if (!l) return { ok: false, repartition_requise: true, error: 'Répartition : ligne inconnue pour ce lot, rechargez la page.' }
      if (vus.has(l.idx)) return { ok: false, repartition_requise: true, error: 'Répartition : la ' + nomLigne(l) + ' est indiquée deux fois.' }
      vus.add(l.idx)
      const brut = s.qte
      const n = (brut == null || String(brut).trim() === '') ? 0 : nombreSaisi(brut)
      if (!Number.isFinite(n) || n < 0) return { ok: false, repartition_requise: true, error: 'Répartition : quantité acceptée invalide sur la ' + nomLigne(l) + '.' }
      if (l.qte != null && arrondi3(n) > l.qte) return { ok: false, repartition_requise: true, error: 'Répartition : ' + fr(n) + ' accepté(s) sur la ' + nomLigne(l) + ', qui n’en a que ' + fr(l.qte) + ' en quarantaine.' }
      somme = arrondi3(somme + n)
      if (n > 0) out.push({ ...l, qte: arrondi3(n) })
    }
    if (somme !== total) return { ok: false, repartition_requise: true, error: 'Répartition : la somme des lignes (' + fr(somme) + ') doit être égale à la quantité acceptée (' + fr(total) + ').' }
    return { ok: true, lignes: out }
  }
  if (lignes.length === 1) return { ok: true, lignes: [{ ...lignes[0], qte: total }] }
  const cle = (l: LigneCouverte) => cleRef(l.reference) || ('d:' + cleRef(l.designation))
  if (lignes.every(l => cle(l) === cle(lignes[0])) && cle(lignes[0]) !== 'd:') return { ok: true, lignes: [{ ...lignes[0], qte: total }] }
  if (lignes.every(l => l.qte != null) && arrondi3(lignes.reduce((s, l) => s + (l.qte as number), 0)) === total) {
    return { ok: true, lignes: lignes.map(l => ({ ...l, qte: l.qte as number })) }
  }
  return { ok: false, repartition_requise: true, error: 'Ce lot couvre ' + lignes.length + ' lignes du bon de commande (' + lignes.map(nomLigne).join(' ; ')
    + ') : indiquez la quantité acceptée de chaque ligne (la somme doit faire ' + fr(total) + ').' }
}

// ─── Affichage ────────────────────────────────────────────────────
export function libelleOrigine(l: { origine?: unknown; pv_id?: unknown; bc_id?: unknown; bl_id?: unknown; quarantaine_id?: unknown; validation_id?: unknown; ligne_idx?: unknown }): string {
  const o = txt(l?.origine)
  const ligne = (l?.ligne_idx != null && String(l.ligne_idx) !== '') ? ' · ligne ' + (Number(l.ligne_idx) + 1) : ''
  const bc = txt(l?.bc_id) ? ' · BC ' + txt(l.bc_id) : ''
  const bl = txt(l?.bl_id) ? ' · BL ' + txt(l.bl_id) : ''
  if (o === 'pv') { const pv = txt(l.pv_id); return (/^pv/i.test(pv) ? pv : 'PV ' + pv) + bc + bl + ligne }
  if (o === 'decision_qualite') return 'Décision Qualité' + (txt(l.quarantaine_id) ? ' (quarantaine)' : '') + bc + bl + ligne
  if (o === 'excedent_valide') return 'Excédent validé' + bc + bl + ligne
  if (o === 'entree_manuelle') return 'Entrée manuelle'
  return o || '—'
}
