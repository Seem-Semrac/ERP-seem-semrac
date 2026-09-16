// ══════════════════════════════════════════════════════════════
// RÉCEPTION FOURNISSEUR — règles PURES (ni base, ni DOM)
// Lot D Expéditions (14/09/2026). Partagées par :
//   · POST /api/expeditions/bc/:id/receptionner (validation, quantité du BL, statut du BC) ;
//   · la vue des bons de commande de /expeditions/service (bcsView → BC_JSON) ;
//   · le PV de contrôle, qui relit les lignes du BC avec lignesBc() : mêmes lignes, mêmes `idx`.
// Testables sans rien démarrer.
//
// Règle de la quantité (décision 1 du lot D) : la quantité n'est plus saisie à la réception.
//   Quantité du BL = RESTE À RECEVOIR du BC (quantité commandée − quantité déjà reçue).
//   Quantité commandée = `qte_commandee` si numérique, sinon la somme des `lignes[].qte` quand
//   TOUTES les lignes en portent une numérique, sinon INCONNUE.
// Lot F (15/09/2026) : la « livraison partielle » n'est plus déclarée à la réception (case retirée, champ ignoré) ;
//   le reliquat se déclare au PV, ligne par ligne, et devient un bon de commande de reliquat (src/pv_reception.ts).
// Correctifs de la vérification (14/09/2026) — deux exceptions, seulement là où la règle menait à une impasse :
//   · LIVRAISON PARTIELLE (case, fournisseur qui annonce un reliquat) : la quantité livrée est saisie,
//     le BC passe « recu_partiel » et le reliquat reste à réceptionner (sinon le manquant devenait une
//     fausse non-conformité, un faux renvoi ou un faux avoir) ;
//   · QUANTITÉ COMMANDÉE INCONNUE : la quantité livrée (lue sur le BL fournisseur) est demandée — « corriger
//     le BC » était impossible (aucun écran ne modifie la quantité d'un BC) et le PV conforme ne créditait jamais rien.
//   BC à PLUSIEURS ARTICLES (lignes de références différentes) : la somme des lignes n'est qu'un total de pièces ;
//   l'entrée en stock se fait LIGNE PAR LIGNE, sur l'article de chaque ligne (repartitionStockMultiArticles),
//   et seulement quand la réception couvre toute la commande. Jamais « tout sur l'article de la 1ʳᵉ ligne ».
// ══════════════════════════════════════════════════════════════
import { estAnnule } from './shared'

/** Modes d'arrivée proposés (liste fermée, contrôlée par le serveur). */
export const MODES_ARRIVEE: readonly string[] = ['Routier', 'Maritime', 'Aérien', 'Ferroviaire', 'Messagerie / express']
/** Codes EWX acceptés. */
export const CODES_EWX: readonly number[] = [1, 2]
/** Longueur maximale d'une référence saisie (N° de commande / de BL fournisseur, nomenclature). */
export const LONGUEUR_MAX_REF = 100
/** Poids matière maximal accepté (kg) : garde-fou contre une faute de frappe grossière. */
export const POIDS_MAX_KG = 1000000
/** Quantité livrée maximale acceptée : garde-fou contre une faute de frappe grossière. */
export const QTE_LIVREE_MAX = 10000000

/** Colonnes ajoutées à `bons_de_livraison` par la migration 012 / le script cloud-10. */
export const COLONNES_BL_RECEPTION = ['num_commande_fournisseur', 'num_bl_fournisseur', 'hors_france', 'poids_matiere_kg', 'num_nomenclature', 'code_ewx', 'mode_arrivee'] as const

/** Statuts de BC qui signifient « tout est déjà reçu » : aucune nouvelle réception. */
export const STATUTS_BC_TOUT_RECU: readonly string[] = ['recu_total', 'recu', 'receptionne', 'controle', 'cloture']

/** Cœur du message « quantité inconnue » — repris tel quel par le PV conforme qui refuse l'entrée en stock.
 *  (Un BL sans quantité ne naît plus que d'un BC à plusieurs articles sans quantité exploitable, ou d'avant ce correctif.) */
export const MSG_QTE_INCONNUE = 'quantité reçue inconnue sur le BL : entrée en stock non faite'

/** Libellés des champs du formulaire, pour les messages. */
export const LIBELLES_CHAMPS_RECEPTION: Record<string, string> = {
  num_bl: 'N° BL interne',
  num_commande_fournisseur: 'N° de commande fournisseur',
  num_bl_fournisseur: 'N° de BL fournisseur',
  hors_france: 'Réception hors France ?',
  poids_matiere_kg: 'Poids matière (kg)',
  num_nomenclature: 'N° de nomenclature (douane)',
  code_ewx: 'Code EWX',
  mode_arrivee: "Mode d'arrivée",
  livraison_partielle: 'Livraison partielle',
  qte_livree: 'Quantité livrée',
}

export type ChampReception = 'num_bl' | 'num_commande_fournisseur' | 'num_bl_fournisseur' | 'hors_france'
  | 'poids_matiere_kg' | 'num_nomenclature' | 'code_ewx' | 'mode_arrivee' | 'livraison_partielle' | 'qte_livree'

// ─── Nombres ───────────────────────────────────────────────────
const arrondi3 = (n: number) => Math.round(n * 1000) / 1000

/** Nombre STRICT : 12 · "12" · "12,5" · "1 200,5". Refuse "12 barres", "", "abc", NaN, Infinity. */
export function nombreStrict(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v !== 'string') return null
  let s = v.trim()
  // Séparateur de milliers (espace, insécable, fine insécable) accepté seulement par groupes de 3.
  if (/^-?\d{1,3}([   ]\d{3})+([.,]\d+)?$/.test(s)) s = s.replace(/[   ]/g, '')
  if (!/^-?\d+(?:[.,]\d+)?$/.test(s)) return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
const positif = (n: number | null): number | null => (n != null && n > 0 ? n : null)
const txt = (v: unknown): string | null => {
  if (v == null) return null
  const s = String(v).replace(/[\x00-\x1f\x7f]+/g, ' ').trim()
  return s ? s : null
}

// ─── Lignes du BC ──────────────────────────────────────────────
/** Une ligne de BC, normalisée quel que soit le générateur (DA → BC, BC direct, BC de sous-traitance). */
export interface LigneBc {
  /** Position de la ligne dans `bons_de_commande.lignes` (0 pour la ligne reconstituée). Identifie la ligne au PV. */
  idx: number
  reference: string | null
  /** `designation`, sinon `article`. */
  designation: string | null
  /** Quantité commandée numérique (> 0), sinon null. */
  qte_commandee: number | null
  /** Quantité telle qu'écrite sur le BC (peut être « 12 barres »). */
  qte_texte: string | null
  unite: string | null
  prix_unitaire: number | null
  num_affaire: string | null
  da_id: string | null
  lot: string | null
  operation: string | null
  /** true : le BC n'a pas de lignes, celle-ci est reconstituée depuis `articles` + `qte_commandee`. */
  reconstituee: boolean
}

/** `lignes` du BC en tableau brut (jsonb en base, parfois JSON en chaîne). Jamais d'exception. */
export function lignesBrutesBc(bc: any): any[] {
  const l = bc?.lignes
  if (Array.isArray(l)) return l
  if (typeof l === 'string' && l.trim().startsWith('[')) { try { const p = JSON.parse(l); return Array.isArray(p) ? p : [] } catch { return [] } }
  return []
}

/** Lignes normalisées du BC. Un BC sans ligne exploitable rend UNE ligne reconstituée (idx 0). */
export function lignesBc(bc: any): LigneBc[] {
  const out: LigneBc[] = []
  lignesBrutesBc(bc).forEach((l: any, i: number) => {
    if (!l || typeof l !== 'object' || Array.isArray(l)) return
    const qRaw = l.qte ?? l.quantite ?? l.qte_commandee ?? l.quantite_estimee ?? null
    out.push({
      idx: i,
      reference: txt(l.reference),
      designation: txt(l.designation) ?? txt(l.article),
      qte_commandee: positif(nombreStrict(qRaw)),
      qte_texte: txt(qRaw),
      unite: txt(l.unite),
      prix_unitaire: positif(nombreStrict(l.prix_unitaire ?? l.pu ?? null)),
      num_affaire: txt(l.num_affaire),
      da_id: txt(l.da_id),
      lot: txt(l.lot),
      operation: txt(l.operation),
      reconstituee: false,
    })
  })
  if (out.length) return out
  const q = bc?.qte_commandee ?? null
  return [{
    idx: 0, reference: null, designation: txt(bc?.articles), qte_commandee: positif(nombreStrict(q)), qte_texte: txt(q),
    unite: null, prix_unitaire: null, num_affaire: txt(bc?.num_affaire), da_id: txt(bc?.demande_achat_id ?? bc?.da_id),
    lot: null, operation: null, reconstituee: true,
  }]
}

// ─── Quantités ─────────────────────────────────────────────────
export interface QuantitesBc {
  /** Quantité commandée exploitable, null si inconnue. */
  qte_commandee: number | null
  /** D'où elle vient : la colonne du BC, la somme des lignes, ou rien. */
  source: 'bc' | 'lignes' | null
  /** Déjà reçu (0 si vide ou illisible). */
  qte_recue: number
  /** Reste à recevoir (≥ 0), null si la quantité commandée est inconnue. */
  reste: number | null
}

export function quantitesBc(bc: any): QuantitesBc {
  const r = nombreStrict(bc?.qte_recue)
  const qte_recue = r != null && r > 0 ? arrondi3(r) : 0
  let qte_commandee = positif(nombreStrict(bc?.qte_commandee))
  let source: QuantitesBc['source'] = qte_commandee != null ? 'bc' : null
  if (qte_commandee == null) {
    const lg = lignesBc(bc).filter(l => !l.reconstituee)
    if (lg.length && lg.every(l => l.qte_commandee != null)) {
      qte_commandee = arrondi3(lg.reduce((s, l) => s + (l.qte_commandee as number), 0))
      source = 'lignes'
    }
  }
  const reste = qte_commandee == null ? null : Math.max(0, arrondi3(qte_commandee - qte_recue))
  return { qte_commandee: qte_commandee == null ? null : arrondi3(qte_commandee), source, qte_recue, reste }
}

// ─── Articles du BC (un ou plusieurs) ──────────────────────────
const normTxt = (s: string | null | undefined): string => (s == null ? '' : String(s).toLowerCase().replace(/\s+/g, ' ').trim())

/**
 * Deux lignes désignent-elles le MÊME article ? Références égales quand les deux en portent une, sinon
 * désignations égales ; deux unités renseignées et différentes = articles différents. Une ligne sans
 * référence ni désignation n'est comparable à rien (prudence : elle rend le BC « à plusieurs articles »).
 */
export function memeArticle(a: Pick<LigneBc, 'reference' | 'designation' | 'unite'>, b: Pick<LigneBc, 'reference' | 'designation' | 'unite'>): boolean {
  const ua = normTxt(a.unite), ub = normTxt(b.unite)
  if (ua && ub && ua !== ub) return false
  const ra = normTxt(a.reference), rb = normTxt(b.reference)
  if (ra && rb) return ra === rb
  const da = normTxt(a.designation), db = normTxt(b.designation)
  return !!da && da === db
}

/** Le BC porte-t-il au moins deux articles différents (lignes réelles, comparées deux à deux) ? */
export function bcMultiArticles(bc: any): boolean {
  const lg = lignesBc(bc).filter(l => !l.reconstituee)
  for (let i = 0; i < lg.length; i++) for (let j = i + 1; j < lg.length; j++) if (!memeArticle(lg[i], lg[j])) return true
  return false
}

export type RepartitionStock =
  | { ok: true; lignes: { idx: number; reference: string | null; designation: string | null; unite: string | null; qte: number }[] }
  | { ok: false; raison: string }

/**
 * Entrée en stock d'une réception d'un BC à PLUSIEURS ARTICLES : chaque ligne sur SON article, pour SA quantité.
 * Possible seulement quand la quantité entrée couvre TOUTE la commande (somme des lignes) : c'est le cas de la
 * réception normale (reste à recevoir = toute la commande) et d'une dérogation sur tout le lot. Une réception
 * partielle, un reliquat ou une entrée partielle décidée par la Qualité ne disent pas QUELLES lignes : refus
 * expliqué plutôt que tout créditer sur l'article de la 1ʳᵉ ligne (l'ancien défaut).
 */
export function repartitionStockMultiArticles(bc: any, qteBl: unknown, qteAcceptee?: number | null): RepartitionStock {
  const lg = lignesBc(bc).filter(l => !l.reconstituee)
  const n = lg.length
  const debut = 'bon de commande à ' + n + ' articles'
  if (lg.some(l => l.qte_commandee == null)) {
    return { ok: false, raison: debut + ' dont au moins une ligne sans quantité numérique : répartition par article impossible' }
  }
  const somme = arrondi3(lg.reduce((s, l) => s + (l.qte_commandee as number), 0))
  const q = typeof qteBl === 'number' ? (Number.isFinite(qteBl) ? qteBl : null) : nombreStrict(qteBl)
  if (q == null || arrondi3(q) !== somme) {
    return { ok: false, raison: debut + ' : la quantité reçue (' + (q == null ? 'inconnue' : String(arrondi3(q)).replace('.', ',')) + ') ne couvre pas la commande complète (' + String(somme).replace('.', ',') + ') — on ne sait pas quelles lignes sont arrivées' }
  }
  if (qteAcceptee != null && arrondi3(Number(qteAcceptee)) !== somme) {
    return { ok: false, raison: debut + ' : entrée partielle (' + String(arrondi3(Number(qteAcceptee))).replace('.', ',') + ' sur ' + String(somme).replace('.', ',') + ') non répartissable par article' }
  }
  return { ok: true, lignes: lg.map(l => ({ idx: l.idx, reference: l.reference, designation: l.designation, unite: l.unite, qte: l.qte_commandee as number })) }
}

/** Phrase d'avertissement quand un BC à plusieurs articles est reçu sans quantité exploitable. */
export function avertissementQteInconnue(numBc: string): string {
  return 'Bon de commande ' + numBc + ' à plusieurs articles sans quantité exploitable : la réception est enregistrée sans quantité ; '
    + 'au PV de contrôle, saisissez la quantité reçue de chaque ligne.'
}

// ─── Plan de réception ─────────────────────────────────────────
export type PlanReception =
  | {
      ok: true
      /** Quantité à écrire sur le BL (null = inconnue, JAMAIS 0). */
      qte_bl: number | null
      qte_commandee: number | null
      source: QuantitesBc['source']
      qte_recue_avant: number
      /** Nouvelle `qte_recue` du BC, null = ne pas l'écrire (quantité inconnue). */
      qte_recue_apres: number | null
      /** recu_partiel : livraison partielle déclarée, le reliquat reste à réceptionner. */
      statut_bc: 'recu_total' | 'recu_partiel'
      /** D'où vient la quantité du BL : le reste à recevoir calculé, ou la saisie (livraison partielle / quantité commandée inconnue). */
      origine_qte: 'reste' | 'saisie' | null
      partielle: boolean
      multi_articles: boolean
      /** Reste à recevoir APRÈS cette réception (null si la quantité commandée est inconnue). */
      reste_apres: number | null
      avertissement: string | null
    }
  | { ok: false; status: 409; code: 'annule' | 'deja_recu'; error: string }
  | { ok: false; status: 400; code: 'saisie'; champ: ChampReception; error: string }

const nb = (n: number) => String(n).replace('.', ',')

/** BC à plusieurs articles dont la réception ne pourra PAS entrer en stock ligne par ligne : on le dit dès la réception. */
// Lot F (15/09/2026) : obsolète — la quantité reçue est saisie LIGNE PAR LIGNE au PV et chaque ligne part dans la file
// « Mise en stock » du Stock. Plus rien à annoncer dès la réception.
function avertissementStockMulti(_bc: any, _num: string, _multi: boolean, _qteBl: number | null): string | null {
  return null
}

/** Ce que la réception va écrire, ou pourquoi elle est refusée (409 état du BC · 400 quantité livrée). */
export function planReception(bc: any, saisie?: Pick<SaisieReception, 'livraison_partielle' | 'qte_livree'> | null): PlanReception {
  const num = String(bc?.num_bc || bc?.id || '')
  const statut = String(bc?.statut ?? '').trim()
  if (estAnnule(statut)) return { ok: false, status: 409, code: 'annule', error: 'Le bon de commande ' + num + ' est annulé : aucune réception possible.' }
  const q = quantitesBc(bc)
  if (STATUTS_BC_TOUT_RECU.includes(statut)) {
    return { ok: false, status: 409, code: 'deja_recu', error: 'Le bon de commande ' + num + ' est déjà entièrement reçu (statut « ' + statut + ' ») : aucune nouvelle réception. Pour un lot à remplacer, la Qualité rouvre le BC.' }
  }
  const multi = bcMultiArticles(bc)
  const partielle = saisie?.livraison_partielle === true
  const qteSaisie = saisie?.qte_livree ?? null
  const ko = (champ: ChampReception, error: string): PlanReception => ({ ok: false, status: 400, code: 'saisie', champ, error })
  if (partielle && multi) {
    return ko('livraison_partielle', 'Livraison partielle d’un bon de commande à plusieurs articles : non gérée article par article. '
      + 'Réceptionnez quand tout est arrivé, ou signalez les lignes manquantes au PV de contrôle (non conforme).')
  }
  const base = { qte_commandee: q.qte_commandee, source: q.source, qte_recue_avant: q.qte_recue, multi_articles: multi }
  if (q.qte_commandee != null) {
    if (!(q.reste != null && q.reste > 0)) {
      return { ok: false, status: 409, code: 'deja_recu', error: 'Le bon de commande ' + num + ' est déjà entièrement reçu (' + nb(q.qte_recue) + ' reçu(s) sur ' + nb(q.qte_commandee) + ' commandé(s)) : aucune nouvelle réception.' }
    }
    if (partielle) {
      if (qteSaisie == null) return ko('qte_livree', 'Livraison partielle : indiquez la quantité livrée (lue sur le BL fournisseur).')
      if (!(qteSaisie < q.reste)) {
        return ko('qte_livree', 'Quantité livrée (' + nb(qteSaisie) + ') égale ou supérieure au reste à recevoir (' + nb(q.reste) + ') : ce n’est pas une livraison partielle — décochez « Livraison partielle ».')
      }
      const apres = arrondi3(q.qte_recue + qteSaisie)
      return { ok: true, ...base, qte_bl: arrondi3(qteSaisie), qte_recue_apres: apres, statut_bc: 'recu_partiel', origine_qte: 'saisie',
        partielle: true, reste_apres: Math.max(0, arrondi3(q.qte_commandee - apres)), avertissement: null }
    }
    // Réception du reste : la quantité éventuellement envoyée est ignorée (la règle est le reste à recevoir).
    return { ok: true, ...base, qte_bl: q.reste, qte_recue_apres: arrondi3(q.qte_recue + q.reste), statut_bc: 'recu_total', origine_qte: 'reste',
      partielle: false, reste_apres: 0, avertissement: avertissementStockMulti(bc, num, multi, q.reste) }
  }
  // Quantité commandée INCONNUE : la quantité livrée est lue sur le BL fournisseur.
  if (qteSaisie != null) {
    return { ok: true, ...base, qte_bl: arrondi3(qteSaisie), qte_recue_apres: arrondi3(q.qte_recue + qteSaisie),
      statut_bc: partielle ? 'recu_partiel' : 'recu_total', origine_qte: 'saisie', partielle, reste_apres: null,
      avertissement: avertissementStockMulti(bc, num, multi, qteSaisie) }
  }
  if (partielle) return ko('qte_livree', 'Livraison partielle : indiquez la quantité livrée (lue sur le BL fournisseur).')
  if (!multi) {
    return ko('qte_livree', 'Le bon de commande ' + num + ' ne porte pas de quantité commandée exploitable : indiquez la quantité livrée, lue sur le BL fournisseur.')
  }
  return { ok: true, ...base, qte_bl: null, qte_recue_apres: null, statut_bc: 'recu_total', origine_qte: null,
    partielle: false, reste_apres: null, avertissement: avertissementQteInconnue(num) }
}

// ─── Saisie du formulaire ──────────────────────────────────────
export interface SaisieReception {
  /** N° de BL interne imposé par le formulaire (repris du BC), null = attribué par le serveur. */
  num_bl: string | null
  num_commande_fournisseur: string
  num_bl_fournisseur: string
  hors_france: boolean
  poids_matiere_kg: number | null
  num_nomenclature: string | null
  code_ewx: number | null
  mode_arrivee: string | null
  /** Case « Livraison partielle » : le fournisseur annonce un reliquat. */
  livraison_partielle: boolean
  /** Quantité livrée saisie (livraison partielle ou quantité commandée inconnue), null sinon. Contrôlée contre le BC par planReception. */
  qte_livree: number | null
}
export type ResultatSaisie = { ok: true; valeurs: SaisieReception } | { ok: false; champ: ChampReception; error: string }

const ouiNon = (v: unknown): boolean | null => {
  if (v === true || v === 1) return true
  if (v === false || v === 0) return false
  const s = String(v ?? '').trim().toLowerCase()
  if (['oui', 'true', '1', 'o', 'yes'].includes(s)) return true
  if (['non', 'false', '0', 'n', 'no'].includes(s)) return false
  return null
}

/** Valide le corps de POST /api/expeditions/bc/:id/receptionner. Le premier champ fautif est rendu. */
export function validerSaisieReception(body: any): ResultatSaisie {
  const b = body && typeof body === 'object' ? body : {}
  const ko = (champ: ChampReception, error: string): ResultatSaisie => ({ ok: false, champ, error })

  const numBl = txt(b.num_bl)
  if (numBl != null && !/^[A-Za-z0-9][A-Za-z0-9 ._\/-]{0,59}$/.test(numBl)) {
    return ko('num_bl', 'N° BL interne invalide : lettres, chiffres, espace, point, tiret ou barre oblique, 60 caractères maximum.')
  }
  const cmdF = txt(b.num_commande_fournisseur)
  if (!cmdF) return ko('num_commande_fournisseur', 'Indiquez le N° de commande fournisseur.')
  if (cmdF.length > LONGUEUR_MAX_REF) return ko('num_commande_fournisseur', 'N° de commande fournisseur trop long (' + LONGUEUR_MAX_REF + ' caractères maximum).')
  const blF = txt(b.num_bl_fournisseur)
  if (!blF) return ko('num_bl_fournisseur', 'Indiquez le N° de BL fournisseur.')
  if (blF.length > LONGUEUR_MAX_REF) return ko('num_bl_fournisseur', 'N° de BL fournisseur trop long (' + LONGUEUR_MAX_REF + ' caractères maximum).')

  const hf = ouiNon(b.hors_france)
  if (hf == null) return ko('hors_france', 'Indiquez si la réception vient de hors France (Oui / Non).')

  // Quantité livrée (seulement si saisie : quantité commandée du BC inconnue). La cohérence avec le BC est jugée par planReception.
  // ⚠ Lot F (15/09/2026) : la case « Livraison partielle » est RETIRÉE du formulaire — le reliquat annoncé par le fournisseur
  //   se déclare au PV de contrôle, ligne par ligne (bon de commande de reliquat aux Achats). Un ancien client qui l'enverrait
  //   encore n'a plus d'effet : la réception prend toujours le reste à recevoir.
  const vide = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '')
  const livraison_partielle = false
  let qte_livree: number | null = null
  if (!vide(b.qte_livree)) {
    const qn = nombreStrict(b.qte_livree)
    if (qn == null || !(qn > 0)) return ko('qte_livree', 'Quantité livrée : nombre supérieur à 0.')
    if (qn > QTE_LIVREE_MAX) return ko('qte_livree', 'Quantité livrée invraisemblable (plus de 10 000 000) : vérifiez la saisie.')
    qte_livree = qn
  }

  if (!hf) {
    // Réception France : les champs d'import sont ignorés, même s'ils ont été envoyés.
    return { ok: true, valeurs: { num_bl: numBl, num_commande_fournisseur: cmdF, num_bl_fournisseur: blF, hors_france: false,
      poids_matiere_kg: null, num_nomenclature: null, code_ewx: null, mode_arrivee: null, livraison_partielle, qte_livree } }
  }

  const poids = nombreStrict(b.poids_matiere_kg)
  if (poids == null || !(poids > 0)) return ko('poids_matiere_kg', 'Indiquez le poids matière en kg (nombre supérieur à 0).')
  if (poids > POIDS_MAX_KG) return ko('poids_matiere_kg', 'Poids matière invraisemblable (plus de 1 000 000 kg) : vérifiez la saisie.')
  const nomenc = txt(b.num_nomenclature)
  if (!nomenc) return ko('num_nomenclature', 'Indiquez le N° de nomenclature (douane).')
  if (nomenc.length > LONGUEUR_MAX_REF) return ko('num_nomenclature', 'N° de nomenclature trop long (' + LONGUEUR_MAX_REF + ' caractères maximum).')
  const ewx = nombreStrict(b.code_ewx)
  if (ewx == null || !CODES_EWX.includes(ewx)) return ko('code_ewx', 'Choisissez le code EWX (1 ou 2).')
  const modeSaisi = txt(b.mode_arrivee)
  const mode = modeSaisi ? MODES_ARRIVEE.find(m => m.toLowerCase() === modeSaisi.toLowerCase()) : undefined
  if (!mode) return ko('mode_arrivee', 'Choisissez le mode d’arrivée (' + MODES_ARRIVEE.join(', ') + ').')

  return { ok: true, valeurs: { num_bl: numBl, num_commande_fournisseur: cmdF, num_bl_fournisseur: blF, hors_france: true,
    poids_matiere_kg: poids, num_nomenclature: nomenc, code_ewx: ewx, mode_arrivee: mode, livraison_partielle, qte_livree } }
}

/** Informations de réception d'un BL (correction après coup) : mêmes règles que la réception, sans N° BL ni quantité. */
export function validerInfosReception(body: any): ResultatSaisie {
  const reste: Record<string, any> = body && typeof body === 'object' && !Array.isArray(body) ? { ...body } : {}
  delete reste.num_bl; delete reste.livraison_partielle; delete reste.qte_livree
  return validerSaisieReception(reste)
}

/** Patch `bons_de_livraison` des 7 colonnes de réception (correction). */
export function patchInfosReception(v: SaisieReception): Record<string, any> {
  return {
    num_commande_fournisseur: v.num_commande_fournisseur, num_bl_fournisseur: v.num_bl_fournisseur, hors_france: v.hors_france,
    poids_matiere_kg: v.poids_matiere_kg, num_nomenclature: v.num_nomenclature, code_ewx: v.code_ewx, mode_arrivee: v.mode_arrivee,
  }
}

// ─── Écritures ─────────────────────────────────────────────────
/** Ligne `bons_de_livraison` d'une réception. N'écrit NI `transport` NI `transporteur_ref` (retirés du formulaire). */
export function construireBlReception(bc: any, saisie: SaisieReception, plan: Extract<PlanReception, { ok: true }>,
  ctx: { blId: string; affaireId: string | null; affaireRaw: string | null; bcId: string; today: string }): Record<string, any> {
  return {
    id: ctx.blId,
    type_bl: 'reception',
    bc_id: ctx.bcId,
    affaire_id: ctx.affaireId,
    cmd_id: null,   // BL de réception fournisseur : pas de FK commande client
    client_nom: bc?.fournisseur_nom || null,
    date_bl: ctx.today,
    qte: plan.qte_bl,   // reste à recevoir, ou null si inconnu — JAMAIS 0
    // Livraison partielle DÉCLARÉE : c'est ce drapeau (colonne existante, cloud comme Docker) qui garde le BC
    // dans « À réceptionner » pour son reliquat. Un ancien « recu_partiel » sans ce drapeau est une réception faite.
    partiel: plan.partielle === true,
    statut: 'recu',
    piece: bc?.articles || null,
    operation: ctx.affaireRaw && !ctx.affaireId ? ('Réf. affaire ' + ctx.affaireRaw) : null,
    num_commande_fournisseur: saisie.num_commande_fournisseur,
    num_bl_fournisseur: saisie.num_bl_fournisseur,
    hors_france: saisie.hors_france,
    poids_matiere_kg: saisie.poids_matiere_kg,
    num_nomenclature: saisie.num_nomenclature,
    code_ewx: saisie.code_ewx,
    mode_arrivee: saisie.mode_arrivee,
  }
}

/** Même ligne sans les colonnes de la migration 012 (base cloud avant cloud-10). */
export function sansColonnesReception(payload: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...payload }
  for (const k of COLONNES_BL_RECEPTION) delete out[k]
  return out
}

/** Mise à jour du BC à la réception. N'écrit plus `transporteur` / `transporteur_ref` (ils écrasaient le BC à null). */
export function patchBcReception(plan: Extract<PlanReception, { ok: true }>, blId: string): Record<string, any> {
  const p: Record<string, any> = { statut: plan.statut_bc, bl_id: blId }
  if (plan.qte_recue_apres != null) p.qte_recue = plan.qte_recue_apres
  return p
}

/** L'erreur Supabase/PostgREST dit-elle « colonne absente » (schéma en retard) ? */
export function estColonneAbsente(err: any): boolean {
  if (!err) return false
  const code = String(err.code ?? '')
  if (code === 'PGRST204' || code === '42703') return true
  return /schema cache|column .* does not exist|could not find the .* column/i.test(String(err.message ?? err))
}

/** Avertissement quand la base n'a pas les colonnes de la migration 012. */
export const AVERT_MIGRATION_012 = 'Base sans les colonnes de réception (migration 012 ; en cloud : docker/db/cloud/cloud-10-reception-fournisseur-pv.sql) : '
  + 'N° de commande et de BL fournisseur, hors France, poids, nomenclature, code EWX et mode d’arrivée NON enregistrés. La réception, elle, est enregistrée.'
