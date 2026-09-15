// ══════════════════════════════════════════════════════════════
// DEMANDE D'ACHAT et PV DE NON-CONFORMITÉ émis depuis la PRODUCTION (15/09/2026)
// ──────────────────────────────────────────────────────────────
// Demande : « Il faut dans la production que les personnes habilitées à écrire puissent instruire
// des non-conformités librement en la rattachant à une affaire ou pas pour que ça aille ensuite dans
// la liste des NC en qualité. […] l'ouverture d'un PV [est] un bouton juste à côté de la demande
// d'achat ; pour la demande d'achat seules les personnes ayant l'autorisation d'écriture sur la
// production peuvent en faire une depuis ici. Le matricule et le mot de passe doivent être mis […]
// il faut aussi afficher le formulaire de demande d'achat dès qu'on appuie sur le bouton. »
//
// Ce fichier porte :
//   · les règles PURES (ni base, ni DOM) — testables sans rien démarrer ;
//   · les deux formulaires (HTML + JS client) posés dans /production/service (pageServiceProd).
// Routes : POST /api/production/demande-achat-operateur et POST /api/production/nc (src/index.tsx),
// toutes deux self-service (src/auth.ts, borne partagée) : la personne qui signe est celle du
// matricule + PIN, et elle doit avoir l'ÉCRITURE Production (droits recalculés comme au login).
//
// Pourquoi l'ancien parcours n'affichait jamais le formulaire : la fenêtre ne montrait d'abord que
// « Matricule / PIN / Identifier » ; le formulaire n'apparaissait qu'après une identification
// réussie, or celle-ci (POST /api/production/operateur-contexte, supprimée) exigeait une affectation
// à un poste LE JOUR MÊME (403 « Vous n'êtes affecté à aucun poste aujourd'hui » dès que le planning
// du jour n'était pas saisi) et ne reconnaissait que les salariés `est_operateur` (401 pour un chef
// d'atelier). Enfin ces routes n'étaient pas self-service : un compte d'atelier en lecture seule sur
// la Production était refusé par le middleware avant même la vérification du PIN.
//
// ⚠ JS client dans des template literals : apostrophes typographiques (’) ou \\', jamais de
//   backtick ni de dollar-accolade dans le JS client ; données injectées par sjX ; textes de la base
//   posés en textContent (jamais en innerHTML).
// ══════════════════════════════════════════════════════════════
import { escX, estAnnule } from './shared'
import { NC_TYPE_OPTS, NC_NATURES, NC_CAUSE_OPTS, NC_ACTIONS_IMMEDIATES, NC_POSTES_LISTE, NC_IMPUTATIONS } from './qref'
import { peutEcrireService } from './auth'
import { sessionDeSalarie, texteLibre, GRAVITES_NC, GRAVITE_DEFAUT } from './pv_reception'

// ─── Messages ──────────────────────────────────────────────────
export const MSG_DA_RESERVE = 'Seules les personnes habilitées à écrire en Production peuvent faire une demande d’achat depuis la Production.'
export const MSG_NC_RESERVE = 'Seules les personnes habilitées à écrire en Production peuvent émettre un PV de non-conformité depuis la Production.'
export const MSG_PIN_INCORRECT = 'Matricule ou PIN incorrect.'

export type Refus = { ok: false; champ: string | null; error: string }

// ─── Identification (matricule + PIN) ──────────────────────────
export function lireIdentification(body: any): { ok: true; matricule: string; pin: string } | Refus {
  const matricule = texteLibre(body?.matricule)
  const pin = texteLibre(body?.pin)
  if (!matricule) return { ok: false, champ: 'matricule', error: 'Saisissez votre matricule.' }
  if (!pin) return { ok: false, champ: 'pin', error: 'Saisissez votre code PIN.' }
  if (matricule.length > 60 || pin.length > 60) return { ok: false, champ: 'pin', error: MSG_PIN_INCORRECT }
  return { ok: true, matricule, pin }
}

/** Le salarié (ligne `salaries`) a-t-il l'écriture Production ? Même calcul que le login (sessionDeSalarie). */
export function ecritEnProduction(sal: any, permsParDefaut: (roles: string[]) => string[]): boolean {
  if (!sal || typeof sal !== 'object' || sal.actif === false) return false
  return peutEcrireService(sessionDeSalarie(sal, permsParDefaut), 'production')
}

export function nomSalarie(sal: any): string {
  return (String(sal?.prenom ?? '').trim() + ' ' + String(sal?.nom ?? '').trim()).trim() || String(sal?.matricule || sal?.id || '')
}

// ─── Date du jour de l'ATELIER ─────────────────────────────────
// Le serveur tourne en UTC ; l'atelier est en France et le créneau « Soirée » va de 22 h à 6 h. Entre 00:00 et
// 02:00 (heure d'été, 01:00 en hiver), la date UTC est encore la veille : une date de constat « du jour » saisie
// au poste passait pour une date future (400). « Aujourd'hui » se calcule donc dans le fuseau de l'atelier.
export const FUSEAU_ATELIER = 'Europe/Paris'
export function dateAtelier(instant: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: FUSEAU_ATELIER, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant)
    const val = (t: string) => parts.find(p => p.type === t)?.value || ''
    const iso = val('year') + '-' + val('month') + '-' + val('day')
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  } catch { /* moteur sans données de fuseaux : repli UTC ci-dessous */ }
  return instant.toISOString().slice(0, 10)
}

// ─── Petites lectures ──────────────────────────────────────────
function texteBorne(v: unknown, max: number, multiLigne = false): string | null | undefined {
  const s = texteLibre(v, multiLigne)
  if (s == null) return null
  return s.length > max ? undefined : s     // undefined = trop long
}
/** Nombre strictement positif (virgule acceptée), sinon null. */
export function nombrePositif(v: unknown): number | null {
  if (v == null || typeof v === 'boolean' || typeof v === 'object') return null
  const s = String(v).trim().replace(/\s/g, '').replace(',', '.')
  if (!s || !/^\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? n : null
}
/** Entier strictement positif, sinon null. */
export function entierPositif(v: unknown): number | null {
  const n = nombrePositif(v)
  return n != null && Number.isInteger(n) ? n : null
}
/** Date calendaire AAAA-MM-JJ réelle, sinon null. */
export function dateIso(v: unknown): string | null {
  const s = String(v ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(s + 'T00:00:00Z')
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : null
}
function dansListe(v: unknown, liste: readonly string[]): string | null {
  const s = texteLibre(v)
  if (!s) return null
  return liste.find(x => x.toLowerCase() === s.toLowerCase()) ?? ''   // '' = hors liste
}

/** Nom de la colonne refusée par la base (PostgREST PGRST204 / Postgres 42703), sinon null. */
export function colonneAbsente(err: any): string | null {
  if (!err) return null
  const code = String(err.code ?? '')
  const msg = String(err.message ?? err)
  if (code !== 'PGRST204' && code !== '42703' && !/schema cache|does not exist|could not find/i.test(msg)) return null
  const m = msg.match(/'([A-Za-z0-9_]+)' column/) || msg.match(/column "?([A-Za-z0-9_]+)"? (?:of relation "?[A-Za-z0-9_]+"? )?does not exist/)
  return m ? m[1] : null
}

// ═══ DEMANDE D'ACHAT ═══════════════════════════════════════════
export const CATEGORIES_DA: Record<string, string> = { matiere: 'Matière', accessoire: 'Accessoire', machine: 'Machine' }
export const UNITES_DA: readonly string[] = ['u', 'kg', 'g', 't', 'm', 'mm', 'm²', 'm³', 'l', 'lot', 'boîte', 'rouleau', 'paire', 'jeu']
export const PRIORITES_DA: readonly string[] = ['normal', 'urgent', 'critique']

export interface SaisieDaProd {
  categorie: 'matiere' | 'accessoire' | 'machine'
  article: string
  reference: string | null
  qte: number
  unite: string | null
  machine_id: string | null
  poste_id: string | null
  num_affaire: string | null
  priorite: string
  livraison: string | null
  fournisseur: string | null
}

export function validerSaisieDaProd(body: any, aujourdhui: string): { ok: true; valeurs: SaisieDaProd } | Refus {
  const cat = String(body?.categorie ?? '').trim().toLowerCase()
  if (!CATEGORIES_DA[cat]) return { ok: false, champ: 'categorie', error: 'Choisissez : matière, accessoire ou machine.' }
  const article = texteBorne(body?.article, 200)
  if (article === undefined) return { ok: false, champ: 'article', error: 'Désignation trop longue (200 caractères au plus).' }
  if (!article) return { ok: false, champ: 'article', error: 'Indiquez l’article ou sa désignation.' }
  const reference = texteBorne(body?.reference, 80)
  if (reference === undefined) return { ok: false, champ: 'reference', error: 'Référence trop longue (80 caractères au plus).' }
  const brutQte = texteLibre(body?.qte)
  if (!brutQte) return { ok: false, champ: 'qte', error: 'Indiquez la quantité.' }
  const qte = nombrePositif(brutQte)
  if (qte == null || qte > 1e6) return { ok: false, champ: 'qte', error: 'Quantité invalide : un nombre supérieur à 0.' }
  const unite = dansListe(body?.unite, UNITES_DA)
  if (unite === '') return { ok: false, champ: 'unite', error: 'Unité inconnue : choisissez-la dans la liste.' }
  const machine = texteBorne(body?.machine_id, 100)
  if (machine === undefined) return { ok: false, champ: 'machine_id', error: 'Machine inconnue : rechargez la page.' }
  if (cat === 'machine' && !machine) return { ok: false, champ: 'machine_id', error: 'Choisissez la machine concernée (le prix ira sur son OPEX).' }
  const poste = texteBorne(body?.poste_id, 100)
  if (poste === undefined) return { ok: false, champ: 'poste_id', error: 'Poste inconnu : rechargez la page.' }
  const affaire = texteBorne(body?.num_affaire, 60)
  if (affaire === undefined) return { ok: false, champ: 'num_affaire', error: 'Affaire inconnue : rechargez la page.' }
  const prio = String(body?.priorite ?? '').trim().toLowerCase() || 'normal'
  if (!PRIORITES_DA.includes(prio)) return { ok: false, champ: 'priorite', error: 'Priorité inconnue.' }
  const brutLiv = texteLibre(body?.livraison)
  const livraison = brutLiv ? dateIso(brutLiv) : null
  if (brutLiv && !livraison) return { ok: false, champ: 'livraison', error: 'Date de livraison souhaitée invalide.' }
  if (livraison && livraison < aujourdhui) return { ok: false, champ: 'livraison', error: 'La livraison souhaitée ne peut pas être dans le passé.' }
  const fournisseur = texteBorne(body?.fournisseur, 120)
  if (fournisseur === undefined) return { ok: false, champ: 'fournisseur', error: 'Nom du fournisseur trop long (120 caractères au plus).' }
  return {
    ok: true,
    valeurs: {
      categorie: cat as SaisieDaProd['categorie'], article, reference: reference ?? null, qte, unite: unite ?? null,
      // Une machine n'est retenue que pour une DA « Machine » : c'est elle qui envoie le prix sur l'OPEX à la réception.
      machine_id: cat === 'machine' ? (machine ?? null) : null,
      poste_id: poste ?? null, num_affaire: affaire ?? null, priorite: prio, livraison, fournisseur: fournisseur ?? null,
    },
  }
}

/** Existence (relue en base) de la machine, du poste et de l'affaire choisis. */
export function rattacherDaProd(v: SaisieDaProd, ctx: { machine: any | null; poste: any | null; commande: any | null }):
  { ok: true; machine_id: string | null; poste_id: string | null; affaire_id: string | null } | Refus {
  if (v.machine_id && !ctx.machine) return { ok: false, champ: 'machine_id', error: 'Machine inconnue : rechargez la page.' }
  if (v.poste_id && !ctx.poste) return { ok: false, champ: 'poste_id', error: 'Poste inconnu : rechargez la page.' }
  if (v.num_affaire && !ctx.commande) return { ok: false, champ: 'num_affaire', error: 'Affaire ' + v.num_affaire + ' inconnue : choisissez-la dans la liste.' }
  const posteMachine = ctx.machine && ctx.machine.poste_id != null && String(ctx.machine.poste_id).trim() ? String(ctx.machine.poste_id) : null
  return {
    ok: true,
    machine_id: ctx.machine ? String(ctx.machine.id) : null,
    poste_id: posteMachine || (ctx.poste ? String(ctx.poste.id) : null),   // la machine désigne son poste
    affaire_id: ctx.commande && ctx.commande.affaire_id ? String(ctx.commande.affaire_id) : null,
  }
}

/** « 12,5 kg » : lu tel quel par les Achats (parseFloat après remplacement de la virgule). */
export function qteDa(v: Pick<SaisieDaProd, 'qte' | 'unite'>): string {
  return String(v.qte).replace('.', ',') + (v.unite ? ' ' + v.unite : '')
}
export function articleDa(v: Pick<SaisieDaProd, 'article' | 'reference'>): string {
  return v.article + (v.reference ? ' (réf. ' + v.reference + ')' : '')
}

export function payloadDaProd(v: SaisieDaProd, ctx: { id: string; today: string; salarie: any; machineId: string | null; posteId: string | null; affaireId: string | null }): Record<string, any> {
  return {
    id: ctx.id,
    demandeur: nomSalarie(ctx.salarie) + ' (Production)',
    type_da: CATEGORIES_DA[v.categorie],
    article: articleDa(v),
    qte: qteDa(v),
    priorite: v.priorite,
    statut: 'a_traiter',
    date_da: ctx.today,
    livraison: v.livraison,
    visible: true,
    genere_par_adt: false,
    type_bc: 'fournisseur',
    fournisseur: v.fournisseur,
    categorie: v.categorie,
    machine_id: ctx.machineId,
    poste_id: ctx.posteId,
    operateur_id: String(ctx.salarie?.id ?? ''),   // le salarié authentifié (colonne historique de la borne)
    num_affaire: v.num_affaire,
    affaire_id: ctx.affaireId,
  }
}
/** Colonnes sans lesquelles la DA n'a pas de sens : jamais retirées sur « colonne absente ». */
export const COLONNES_DA_OBLIGATOIRES = new Set(['id', 'demandeur', 'type_da', 'article', 'qte', 'priorite', 'statut', 'date_da', 'visible'])

// ═══ PV DE NON-CONFORMITÉ ══════════════════════════════════════
export const ENTITES_NC: readonly string[] = ['Seem', 'Semrac']
export const TYPE_NC_DEFAUT = 'Interne'
/** 1ʳᵉ valeur de NC_STATUTS_LISTE (qref.ts) : c'est ce que crée le formulaire Qualité, conservé à la réédition. */
export const STATUT_NC_OUVERT = 'Ouvert'
export const DESCRIPTION_NC_MAX = 4000

export interface SaisieNcProd {
  date_nc: string
  type_nc: string
  entite: string
  gravite: string
  num_affaire: string | null
  lot_ref: string | null
  bdt_id: string | null
  ref_article: string | null
  designation: string | null
  nb_pieces: number | null
  lieu_detection: string | null
  lieu_imputation: string | null
  type_defaut: string | null
  type_cause: string | null
  cause_detail: string | null
  action_corrective: string | null
  traitement: string | null
  description: string
  quarantaine: boolean
}

function vrai(v: unknown): boolean {
  return v === true || ['true', '1', 'oui', 'on'].includes(String(v ?? '').trim().toLowerCase())
}

export function validerSaisieNcProd(body: any, aujourdhui: string): { ok: true; valeurs: SaisieNcProd } | Refus {
  const brutDate = texteLibre(body?.date_nc)
  const date_nc = brutDate ? dateIso(brutDate) : aujourdhui
  if (!date_nc) return { ok: false, champ: 'date_nc', error: 'Date de constat invalide.' }
  if (date_nc > aujourdhui) return { ok: false, champ: 'date_nc', error: 'La date de constat ne peut pas être dans le futur.' }
  const type_nc = texteLibre(body?.type_nc) ? dansListe(body?.type_nc, NC_TYPE_OPTS) : TYPE_NC_DEFAUT
  if (!type_nc) return { ok: false, champ: 'type_nc', error: 'Type de NC inconnu : choisissez-le dans la liste.' }
  const entite = dansListe(body?.entite, ENTITES_NC)
  if (!entite) return { ok: false, champ: 'entite', error: 'Choisissez l’entité (Seem ou Semrac).' }
  const gravite = texteLibre(body?.gravite) ? dansListe(body?.gravite, GRAVITES_NC) : GRAVITE_DEFAUT
  if (!gravite) return { ok: false, champ: 'gravite', error: 'Gravité inconnue : choisissez-la dans la liste.' }
  const num_affaire = texteBorne(body?.num_affaire, 60)
  if (num_affaire === undefined) return { ok: false, champ: 'num_affaire', error: 'Affaire inconnue : rechargez la page.' }
  const lot_ref = texteBorne(body?.lot_ref, 80)
  if (lot_ref === undefined) return { ok: false, champ: 'lot_ref', error: 'Lot inconnu : rechargez la page.' }
  const bdt_id = texteBorne(body?.bdt_id, 100)
  if (bdt_id === undefined) return { ok: false, champ: 'bdt_id', error: 'BDT inconnu : rechargez la page.' }
  const ref_article = texteBorne(body?.ref_article, 80)
  if (ref_article === undefined) return { ok: false, champ: 'ref_article', error: 'Code article trop long (80 caractères au plus).' }
  const designation = texteBorne(body?.designation, 200)
  if (designation === undefined) return { ok: false, champ: 'designation', error: 'Désignation trop longue (200 caractères au plus).' }
  const brutPieces = texteLibre(body?.nb_pieces)
  const nb_pieces = brutPieces ? entierPositif(brutPieces) : null
  if (brutPieces && (nb_pieces == null || nb_pieces > 1e7)) return { ok: false, champ: 'nb_pieces', error: 'Quantité concernée invalide : un nombre entier de pièces, supérieur à 0.' }
  const listes: Array<[keyof SaisieNcProd, readonly string[], string]> = [
    ['lieu_detection', NC_POSTES_LISTE, 'Poste de détection inconnu : choisissez-le dans la liste.'],
    ['lieu_imputation', NC_IMPUTATIONS, 'Imputation inconnue : choisissez-la dans la liste.'],
    ['type_defaut', NC_NATURES, 'Nature de la NC inconnue : choisissez-la dans la liste.'],
    ['type_cause', NC_CAUSE_OPTS, 'Nature de la cause inconnue : choisissez-la dans la liste.'],
    ['action_corrective', NC_ACTIONS_IMMEDIATES, 'Action immédiate inconnue : choisissez-la dans la liste.'],
  ]
  const choix: Record<string, string | null> = {}
  for (const [k, liste, msg] of listes) {
    const x = dansListe(body?.[k], liste)
    if (x === '') return { ok: false, champ: k, error: msg }
    choix[k] = x
  }
  const description = texteBorne(body?.description, DESCRIPTION_NC_MAX, true)
  if (description === undefined) return { ok: false, champ: 'description', error: 'Description trop longue (' + DESCRIPTION_NC_MAX + ' caractères au plus).' }
  if (!description) return { ok: false, champ: 'description', error: 'Décrivez le défaut constaté.' }
  const cause_detail = texteBorne(body?.cause_detail, 1000, true)
  if (cause_detail === undefined) return { ok: false, champ: 'cause_detail', error: 'Cause présumée trop longue (1000 caractères au plus).' }
  const traitement = texteBorne(body?.traitement, 1000, true)
  if (traitement === undefined) return { ok: false, champ: 'traitement', error: 'Traitement proposé trop long (1000 caractères au plus).' }
  const quarantaine = vrai(body?.quarantaine)
  if (quarantaine && !lot_ref && !bdt_id && !ref_article && !designation) {
    return { ok: false, champ: 'quarantaine', error: 'Pour une mise en quarantaine, désignez ce qui est isolé : lot, BDT, code article ou désignation.' }
  }
  return {
    ok: true,
    valeurs: {
      date_nc, type_nc, entite, gravite,
      num_affaire: num_affaire ?? null, lot_ref: lot_ref ?? null, bdt_id: bdt_id ?? null,
      ref_article: ref_article ?? null, designation: designation ?? null, nb_pieces,
      lieu_detection: choix.lieu_detection, lieu_imputation: choix.lieu_imputation, type_defaut: choix.type_defaut,
      type_cause: choix.type_cause, action_corrective: choix.action_corrective,
      cause_detail: cause_detail ?? null, traitement: traitement ?? null, description, quarantaine,
    },
  }
}

export interface RattachementNc { num_affaire: string | null; affaire_id: string | null; lot_ref: string | null; bdt_id: string | null; client_nom: string | null; operation: string | null; piece: string | null }

/** Lot désigné par un BDT (lot_ref, sinon lot_id), sinon null. */
export function lotDuBdt(bdt: any): string | null {
  if (!bdt) return null
  const s = (x: any) => (x == null ? '' : String(x).trim())
  return s(bdt.lot_ref) || s(bdt.lot_id) || null
}

/**
 * Lignes relues en base pour vérifier le rattachement d'une NC :
 *   · commande      = commande de l'affaire saisie (num_affaire) ;
 *   · lot           = lot saisi, SINON le lot du BDT (la route le relit aussi quand seul le BDT est saisi) ;
 *   · commandeDuLot = commande du lot (lot.cmd_id) ;
 *   · bdt           = BDT saisi ;
 *   · commandeDuBdt = commande du BDT (bdt.cmd_id), utile quand le BDT ne porte pas son num_affaire.
 */
export interface ContexteRattachementNc { commande: any | null; lot: any | null; commandeDuLot: any | null; bdt: any | null; commandeDuBdt?: any | null }

/**
 * Affaire, lot et BDT RELUS en base (le navigateur n'envoie que des identifiants) et cohérents entre eux.
 * Le lot désigne son affaire (via sa commande), le BDT désigne son lot et son affaire : on complète ce qui manque.
 * Règle de sûreté (revue du 15/09/2026) : dès qu'une affaire est établie (saisie, ou déduite du lot / du BDT),
 * chaque lot et chaque BDT rattachés doivent lui appartenir DE FAÇON VÉRIFIABLE — par la commande (num_affaire),
 * sinon par l'affaire_id de la commande. Invérifiable = refus (400) : une NC Critique/Bloquante bloque les BL de
 * son affaire et, par la sous-chaîne de lot_ref, ceux de l'affaire du lot ; on ne recopie donc jamais un lot étranger.
 */
export function rattacherNcProd(v: Pick<SaisieNcProd, 'num_affaire' | 'lot_ref' | 'bdt_id'>, ctx: ContexteRattachementNc): ({ ok: true } & RattachementNc) | Refus {
  const s = (x: any) => (x == null ? '' : String(x).trim())
  const premier = (...xs: any[]) => { for (const x of xs) { const t = s(x); if (t) return t } return null }
  if (v.num_affaire && !ctx.commande) return { ok: false, champ: 'num_affaire', error: 'Affaire ' + v.num_affaire + ' inconnue : choisissez-la dans la liste.' }
  if (v.lot_ref && !ctx.lot) return { ok: false, champ: 'lot_ref', error: 'Lot ' + v.lot_ref + ' inconnu.' }
  if (v.bdt_id && !ctx.bdt) return { ok: false, champ: 'bdt_id', error: 'BDT ' + v.bdt_id + ' inconnu.' }
  const bdt = v.bdt_id ? ctx.bdt : null
  const lotBdt = lotDuBdt(bdt)
  if (v.lot_ref && lotBdt && lotBdt !== v.lot_ref) {
    return { ok: false, champ: 'bdt_id', error: 'Le BDT ' + v.bdt_id + ' appartient au lot ' + lotBdt + ', pas au lot ' + v.lot_ref + '.' }
  }
  // Lot effectif : le lot saisi, sinon celui du BDT — qui doit exister (sinon rien ne dit à quelle affaire il appartient).
  const lotId = v.lot_ref || lotBdt || null
  if (lotId && (!ctx.lot || s(ctx.lot.id) !== lotId)) {
    return { ok: false, champ: v.lot_ref ? 'lot_ref' : 'bdt_id', error: 'Le lot ' + lotId + (v.lot_ref ? '' : ' du BDT ' + v.bdt_id) + ' est introuvable : rattachement impossible à vérifier.' }
  }
  const lot = lotId ? ctx.lot : null
  const champLot = v.lot_ref ? 'lot_ref' : 'bdt_id'
  const cmdLot = lot ? ctx.commandeDuLot : null
  const cmdBdt = bdt ? (ctx.commandeDuBdt || null) : null
  const affLot = s(cmdLot?.num_affaire) || null
  const affBdt = bdt ? (s(bdt.num_affaire) || s(cmdBdt?.num_affaire) || null) : null
  if (v.num_affaire && affLot && affLot !== v.num_affaire) {
    return { ok: false, champ: champLot, error: 'Le lot ' + lotId + ' appartient à l’affaire ' + affLot + ', pas à l’affaire ' + v.num_affaire + '.' }
  }
  if (v.num_affaire && affBdt && affBdt !== v.num_affaire) {
    return { ok: false, champ: 'bdt_id', error: 'Le BDT ' + v.bdt_id + ' appartient à l’affaire ' + affBdt + ', pas à l’affaire ' + v.num_affaire + '.' }
  }
  if (affLot && affBdt && affLot !== affBdt) {
    return { ok: false, champ: 'bdt_id', error: 'Le BDT ' + v.bdt_id + ' (affaire ' + affBdt + ') et le lot ' + lotId + ' (affaire ' + affLot + ') ne désignent pas la même affaire.' }
  }
  const affaire = v.num_affaire || affLot || affBdt || null
  // affaire_id de référence : uniquement celui d'une commande de l'affaire établie (jamais l'affaire_id d'un lot ou d'un BDT).
  const refAffId = affaire ? premier(ctx.commande?.affaire_id, affLot === affaire ? cmdLot?.affaire_id : null, affBdt === affaire ? cmdBdt?.affaire_id : null) : null
  const memeAffId = (x: any) => !!(s(x) && refAffId && s(x) === refAffId)
  if (affaire && lot && !affLot && !memeAffId(lot.affaire_id)) {
    return { ok: false, champ: champLot, error: 'Impossible de vérifier que le lot ' + lotId + ' appartient à l’affaire ' + affaire + ' (lot sans commande connue).' }
  }
  const bdtParSonLot = !!(bdt && lot && lotBdt && lotBdt === s(lot.id))   // lot du BDT déjà vérifié ci-dessus
  if (affaire && bdt && !affBdt && !bdtParSonLot && !memeAffId(bdt.affaire_id)) {
    return { ok: false, champ: 'bdt_id', error: 'Impossible de vérifier que le BDT ' + v.bdt_id + ' appartient à l’affaire ' + affaire + ' (BDT sans affaire ni commande connues).' }
  }
  // Sans affaire établie : le lot et le BDT ne peuvent pas porter deux affaire_id différents.
  if (!affaire && lot && bdt && s(lot.affaire_id) && s(bdt.affaire_id) && s(lot.affaire_id) !== s(bdt.affaire_id)) {
    return { ok: false, champ: 'bdt_id', error: 'Le BDT ' + v.bdt_id + ' et le lot ' + lotId + ' ne désignent pas la même affaire.' }
  }
  return {
    ok: true,
    num_affaire: affaire,
    affaire_id: affaire ? refAffId : premier(lot?.affaire_id, bdt?.affaire_id),
    lot_ref: lotId,
    bdt_id: bdt ? s(bdt.id) : null,
    client_nom: premier(ctx.commande?.client_nom, cmdLot?.client_nom, cmdBdt?.client_nom, lot?.client_nom, bdt?.client_nom),
    operation: premier(bdt?.operation),
    piece: premier(bdt?.piece, lot?.piece),
  }
}

/** Même numérotation que la création de NC de la Qualité (POST /api/production/non-conformites) : NC-AAAA-NNN, compteur continu. */
export function prochainNumeroNc(ids: Array<string | null | undefined>, annee: number): string {
  let max = 0
  for (const id of ids) {
    const m = String(id ?? '').match(/NC-\d{4}-(\d+)/)
    if (m) { const n = parseInt(m[1], 10); if (n > max) max = n }
  }
  return 'NC-' + annee + '-' + String(max + 1).padStart(3, '0')
}

/** Description de la NC : le défaut, la cause présumée, le traitement proposé, puis l'émetteur (survit à la réédition en Qualité). */
export function descriptionNcProd(v: Pick<SaisieNcProd, 'description' | 'cause_detail' | 'traitement' | 'date_nc'>, emetteur: string): string {
  return [
    v.description,
    v.cause_detail ? 'Cause présumée : ' + v.cause_detail : null,
    v.traitement ? 'Traitement proposé : ' + v.traitement : null,
    'PV de non-conformité émis en Production par ' + (emetteur || '—') + ' (constat du ' + v.date_nc.split('-').reverse().join('/') + ').',
  ].filter(Boolean).join('\n')
}

export function payloadNcProd(v: SaisieNcProd, r: RattachementNc, ctx: { id: string; salarie: any }): Record<string, any> {
  const nom = nomSalarie(ctx.salarie)
  return {
    id: ctx.id,
    date_nc: v.date_nc,
    type_nc: v.type_nc,
    gravite: v.gravite,
    statut: STATUT_NC_OUVERT,
    categorie: 'prod',
    entite: v.entite,
    lot_ref: r.lot_ref,
    num_affaire: r.num_affaire,
    affaire_id: r.affaire_id,
    bdt_id: r.bdt_id,
    operation: r.operation,
    client_nom: r.client_nom,
    ref_article: v.ref_article || r.piece,
    designation: v.designation,
    nb_pieces: v.nb_pieces,
    lieu_detection: v.lieu_detection,
    lieu_imputation: v.lieu_imputation,
    type_defaut: v.type_defaut,
    type_cause: v.type_cause,
    action_corrective: v.action_corrective,
    description: descriptionNcProd(v, nom),
    detecteur: nom,   // l'émetteur authentifié (même convention que la NC du soldage et que la Qualité)
  }
}
/** Colonnes sans lesquelles la NC n'a pas de sens : jamais retirées sur « colonne absente ». */
export const COLONNES_NC_OBLIGATOIRES = new Set(['id', 'date_nc', 'type_nc', 'gravite', 'statut', 'description', 'detecteur'])

/** Quarantaine créée à la demande (case cochée) : mêmes champs que « Mettre en quarantaine » de la Qualité. */
export function quarantaineNcProd(ncId: string, v: SaisieNcProd, r: RattachementNc, today: string): Record<string, any> {
  const premiereLigne = v.description.split('\n')[0].slice(0, 300)
  return {
    nc_id: ncId,
    lot_id: r.lot_ref || null,
    piece: v.designation || v.ref_article || r.piece || r.lot_ref || r.bdt_id || 'Objet',
    client_nom: r.client_nom || null,
    date_mise_quarantaine: today,
    motif: 'NC ' + ncId + ' : ' + premiereLigne + (v.nb_pieces ? ' (' + v.nb_pieces + ' pièce' + (v.nb_pieces > 1 ? 's' : '') + ')' : ''),
    statut: 'en_cours',
  }
}

// ═══ FORMULAIRES (page /production/service) ════════════════════
export interface RefFormulairesProd {
  affaires: { num: string; client: string }[]
  lots: { id: string; aff: string; piece: string }[]
  bdts: { id: string; lot: string; aff: string; piece: string; op: string }[]
  machines: { id: string; nom: string; poste_id: string; poste: string; cnc: boolean }[]
  postes: { id: string; nom: string }[]
}

/** Listes des deux formulaires, calculées côté serveur à partir des lignes déjà chargées par la page. */
export function refFormulairesProd(p: { commandes?: any[]; lots?: any[]; bdts?: any[]; machines?: any[]; postes?: any[] }): RefFormulairesProd {
  const s = (x: any) => (x == null ? '' : String(x).trim())
  const cmds = (p.commandes || []).filter(c => c && !estAnnule(c.statut) && s(c.num_affaire))
  const affDeCmd = new Map<string, string>()
  const affaires = new Map<string, string>()
  for (const c of cmds) {
    affDeCmd.set(s(c.id), s(c.num_affaire))
    if (!affaires.has(s(c.num_affaire)) || (!affaires.get(s(c.num_affaire)) && s(c.client_nom))) affaires.set(s(c.num_affaire), s(c.client_nom))
  }
  const lots = (p.lots || []).filter(l => l && s(l.id) && !estAnnule(l.statut))
    .map(l => ({ id: s(l.id), aff: affDeCmd.get(s(l.cmd_id)) || '', piece: s(l.piece) }))
    .filter(l => l.aff)
    .sort((a, b) => b.id.localeCompare(a.id, 'fr', { numeric: true }))
  const affDeLot = new Map(lots.map(l => [l.id, l.aff]))
  const bdts = (p.bdts || []).filter(b => b && s(b.id) && !estAnnule(b.statut))
    .map(b => { const lot = s(b.lot_ref) || s(b.lot_id); return { id: s(b.id), lot, aff: s(b.num_affaire) || affDeLot.get(lot) || '', piece: s(b.piece), op: s(b.operation) } })
    .filter(b => b.aff)
    .sort((a, b) => a.id.localeCompare(b.id, 'fr', { numeric: true }))
  const postes = (p.postes || []).filter(x => x && s(x.id) && s(x.statut || 'actif') !== 'inactif')
    .map(x => ({ id: s(x.id), nom: s(x.nom) || s(x.id) }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
  const nomPoste = new Map(postes.map(x => [x.id, x.nom]))
  const machines = (p.machines || []).filter(m => m && s(m.id))
    .map(m => ({ id: s(m.id), nom: s(m.nom) || s(m.id), poste_id: s(m.poste_id), poste: nomPoste.get(s(m.poste_id)) || '', cnc: !!m.cnc }))
    .sort((a, b) => (a.poste || '~').localeCompare(b.poste || '~', 'fr') || a.nom.localeCompare(b.nom, 'fr'))
  return {
    affaires: [...affaires.entries()].map(([num, client]) => ({ num, client })).sort((a, b) => b.num.localeCompare(a.num, 'fr', { numeric: true })),
    lots, bdts, machines, postes,
  }
}

const sjX = (v: any) => JSON.stringify(v).replace(/</g, '\\u003c')
const opt = (v: string, t: string, sel = false) => '<option value="' + escX(v) + '"' + (sel ? ' selected' : '') + '>' + escX(t) + '</option>'
const opts = (liste: readonly string[], defaut?: string) => liste.map(x => opt(x, x, x === defaut)).join('')

/** Boutons « Demande d'achat » + « PV de non-conformité » du bandeau Production, leurs fenêtres et leur JS. */
export function blocDaNcProduction(ref: RefFormulairesProd): string {
  const optAffaires = ref.affaires.map(a => opt(a.num, a.num + (a.client ? ' — ' + a.client : ''))).join('')
  const optPostes = ref.postes.map(p => opt(p.id, p.nom)).join('')
  const groupes = new Map<string, typeof ref.machines>()
  for (const m of ref.machines) { const k = m.poste || 'Sans poste'; if (!groupes.has(k)) groupes.set(k, []); groupes.get(k)!.push(m) }
  const optMachines = [...groupes.entries()].map(([g, ms]) => '<optgroup label="' + escX(g) + '">' + ms.map(m => opt(m.id, m.nom + (m.cnc ? ' (CNC)' : ''))).join('') + '</optgroup>').join('')
  const auj = dateAtelier()   // bornes min/max des dates : jour de l'atelier (Europe/Paris), pas le jour UTC du serveur
  return `
<style>
  #prod-hdr-actions{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;}
  #prod-hdr-actions .pf-hdr-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;color:white;border-radius:8px;font-size:.77rem;font-weight:700;cursor:pointer;min-height:32px;}
  #prod-hdr-actions .pf-hdr-btn:focus-visible{outline:3px solid white;outline-offset:2px;}
  .pf-modal{display:none;position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);align-items:center;justify-content:center;z-index:7000;padding:1rem;box-sizing:border-box;}
  .pf-carte{background:white;border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.25);width:100%;max-width:680px;max-height:100%;display:flex;flex-direction:column;overflow:hidden;}
  .pf-tete{padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .pf-tete h3{font-weight:800;color:white;font-size:.98rem;margin:0;display:flex;align-items:center;gap:8px;}
  .pf-tete button{color:rgba(255,255,255,.85);background:none;border:none;font-size:1.2rem;cursor:pointer;min-width:36px;min-height:36px;border-radius:8px;}
  .pf-tete button:focus-visible{outline:2px solid white;}
  .pf-corps{padding:18px 20px;overflow-y:auto;}
  .pf-pied{padding:12px 20px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;}
  .pf-grille{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px;margin-bottom:12px;}
  .pf-grille .pf-large{grid-column:1/-1;}
  @media (max-width:560px){ .pf-grille{grid-template-columns:1fr;} }
  .pf-ident{background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:12px;padding:12px 14px;margin-bottom:14px;}
  .pf-ident-titre{font-size:.72rem;font-weight:800;color:#334155;text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px;display:flex;align-items:center;gap:6px;}
  .pf-ident .pf-grille{margin-bottom:6px;}
  .pf-aide{font-size:.7rem;color:#64748b;margin-top:3px;line-height:1.35;}
  .pf-section{font-size:.7rem;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:.03em;margin:4px 0 8px;}
  .pf-obl{color:#dc2626;}
  .pf-err{background:#fef2f2;border:1.5px solid #fecaca;color:#991b1b;border-radius:10px;padding:9px 12px;font-size:.8rem;font-weight:600;margin-top:4px;}
  .pf-invalide{border-color:#dc2626 !important;box-shadow:0 0 0 3px rgba(220,38,38,.15) !important;}
  .pf-modal [hidden]{display:none !important;}
  .pf-cats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;}
  .pf-cats label{flex:1;min-width:120px;display:flex;align-items:center;justify-content:center;gap:6px;border:1.5px solid #e2e8f0;border-radius:9px;padding:8px 10px;cursor:pointer;font-size:.8rem;font-weight:700;color:#374151;}
  .pf-cats label:has(input:checked){border-color:#d97706;background:#fffbeb;color:#92400e;}
  .pf-quar{display:flex;align-items:flex-start;gap:9px;padding:10px 12px;margin-top:4px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:10px;font-size:.8rem;color:#92400e;font-weight:600;cursor:pointer;}
  .pf-quar input{width:17px;height:17px;margin-top:1px;accent-color:#d97706;flex-shrink:0;}
</style>
<span id="prod-hdr-actions">
  <button type="button" id="oda-hdr-btn" class="pf-hdr-btn" onclick="odaOpen()" aria-haspopup="dialog" title="Demande d’achat (réservée à l’écriture Production, signée par matricule et PIN)" style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.35);"><i class="fas fa-cart-plus" aria-hidden="true"></i>Demande d’achat</button>
  <button type="button" id="pvnc-hdr-btn" class="pf-hdr-btn" onclick="pvncOpen()" aria-haspopup="dialog" title="PV de non-conformité (réservé à l’écriture Production, signé par matricule et PIN)" style="background:#b91c1c;border:1px solid rgba(255,255,255,.45);box-shadow:0 1px 4px rgba(0,0,0,.18);"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i>PV de non-conformité</button>
</span>
<script>
(function(){ try{ var w=document.getElementById('prod-hdr-actions'), bar=document.getElementById('svc-hdr-bar'); if(w&&bar){ w.style.marginLeft='auto'; bar.appendChild(w); } else if(w){ w.style.position='fixed'; w.style.top='12px'; w.style.right='24px'; w.style.zIndex='6900'; } }catch(e){} })();
</script>

<div id="odaModal" class="pf-modal" role="dialog" aria-modal="true" aria-labelledby="oda_titre">
  <form id="oda_form" class="pf-carte" novalidate onsubmit="return odaSubmit(event)">
    <div class="pf-tete" style="background:linear-gradient(135deg,#f59e0b,#d97706);">
      <h3 id="oda_titre"><i class="fas fa-cart-plus" aria-hidden="true"></i>Demande d’achat — Production</h3>
      <button type="button" onclick="pfFermer('odaModal')" aria-label="Fermer"><i class="fas fa-times" aria-hidden="true"></i></button>
    </div>
    <div class="pf-corps">
      <div class="pf-ident">
        <div class="pf-ident-titre"><i class="fas fa-id-badge" aria-hidden="true"></i>Qui fait la demande ?</div>
        <div class="pf-grille">
          <div><label class="form-label" for="oda_matricule">Matricule <span class="pf-obl">*</span></label><input id="oda_matricule" type="text" class="form-input" autocomplete="off" required/></div>
          <div><label class="form-label" for="oda_pin">Code PIN <span class="pf-obl">*</span></label><input id="oda_pin" type="password" class="form-input" inputmode="numeric" autocomplete="off" required/></div>
        </div>
        <div class="pf-aide">Réservé aux personnes habilitées à écrire en Production. La demande part aux Achats à votre nom.</div>
      </div>
      <div class="pf-section" id="oda_categorie_lbl">Nature de l’achat <span class="pf-obl">*</span></div>
      <div class="pf-cats" role="radiogroup" aria-labelledby="oda_categorie_lbl">
        <label><input type="radio" name="oda_categorie" id="oda_categorie" value="matiere" checked onchange="odaCategorie()"/> Matière</label>
        <label><input type="radio" name="oda_categorie" value="accessoire" onchange="odaCategorie()"/> Accessoire</label>
        <label><input type="radio" name="oda_categorie" value="machine" onchange="odaCategorie()"/> Machine (OPEX)</label>
      </div>
      <div id="oda_machine_wrap" hidden style="margin-bottom:12px;">
        <label class="form-label" for="oda_machine_id">Machine concernée <span class="pf-obl">*</span></label>
        <select id="oda_machine_id" class="form-input" onchange="odaMachine()"><option value="">— Choisir la machine —</option>${optMachines}</select>
        <div class="pf-aide">Le prix ira sur l’OPEX de cette machine à la réception.</div>
      </div>
      <div class="pf-grille">
        <div><label class="form-label" for="oda_article">Article / désignation <span class="pf-obl">*</span></label><input id="oda_article" type="text" class="form-input" maxlength="200" placeholder="Ex : plaquette carbure, huile de coupe…" required/></div>
        <div><label class="form-label" for="oda_reference">Référence</label><input id="oda_reference" type="text" class="form-input" maxlength="80" placeholder="Réf. fabricant ou interne"/></div>
        <div><label class="form-label" for="oda_qte">Quantité <span class="pf-obl">*</span></label><input id="oda_qte" type="text" inputmode="decimal" class="form-input" value="1" required/></div>
        <div><label class="form-label" for="oda_unite">Unité</label><select id="oda_unite" class="form-input">${opts(UNITES_DA, 'u')}</select></div>
        <div><label class="form-label" for="oda_num_affaire">Affaire</label><select id="oda_num_affaire" class="form-input"><option value="">Sans affaire</option>${optAffaires}</select></div>
        <div><label class="form-label" for="oda_poste_id">Poste concerné</label><select id="oda_poste_id" class="form-input"><option value="">— Aucun —</option>${optPostes}</select></div>
        <div><label class="form-label" for="oda_priorite">Priorité</label><select id="oda_priorite" class="form-input"><option value="normal" selected>Normale</option><option value="urgent">Urgente</option><option value="critique">Critique</option></select></div>
        <div><label class="form-label" for="oda_livraison">Livraison souhaitée</label><input id="oda_livraison" type="date" min="${auj}" class="form-input"/></div>
        <div class="pf-large"><label class="form-label" for="oda_fournisseur">Fournisseur suggéré</label><input id="oda_fournisseur" type="text" class="form-input" maxlength="120" placeholder="Facultatif"/></div>
      </div>
      <div id="oda_err" class="pf-err" role="alert" hidden></div>
    </div>
    <div class="pf-pied">
      <button type="button" onclick="pfFermer('odaModal')" class="btn btn-secondary">Annuler</button>
      <button type="submit" id="oda_envoyer" class="btn btn-primary" style="background:linear-gradient(135deg,#f59e0b,#d97706);"><i class="fas fa-paper-plane" aria-hidden="true"></i> Envoyer aux Achats</button>
    </div>
  </form>
</div>

<div id="pvncModal" class="pf-modal" role="dialog" aria-modal="true" aria-labelledby="pvnc_titre">
  <form id="pvnc_form" class="pf-carte" novalidate onsubmit="return pvncSubmit(event)">
    <div class="pf-tete" style="background:linear-gradient(135deg,#dc2626,#991b1b);">
      <h3 id="pvnc_titre"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i>PV de non-conformité — Production</h3>
      <button type="button" onclick="pfFermer('pvncModal')" aria-label="Fermer"><i class="fas fa-times" aria-hidden="true"></i></button>
    </div>
    <div class="pf-corps">
      <div class="pf-ident">
        <div class="pf-ident-titre"><i class="fas fa-id-badge" aria-hidden="true"></i>Qui émet le PV ?</div>
        <div class="pf-grille">
          <div><label class="form-label" for="pvnc_matricule">Matricule <span class="pf-obl">*</span></label><input id="pvnc_matricule" type="text" class="form-input" autocomplete="off" required/></div>
          <div><label class="form-label" for="pvnc_pin">Code PIN <span class="pf-obl">*</span></label><input id="pvnc_pin" type="password" class="form-input" inputmode="numeric" autocomplete="off" required/></div>
        </div>
        <div class="pf-aide">Réservé aux personnes habilitées à écrire en Production. La non-conformité part dans la liste des NC de la Qualité, à votre nom.</div>
      </div>
      <div class="pf-section">Constat</div>
      <div class="pf-grille">
        <div><label class="form-label" for="pvnc_date_nc">Date du constat <span class="pf-obl">*</span></label><input id="pvnc_date_nc" type="date" max="${auj}" class="form-input" required/></div>
        <div><label class="form-label" for="pvnc_type_nc">Type de NC</label><select id="pvnc_type_nc" class="form-input">${opts(NC_TYPE_OPTS, TYPE_NC_DEFAUT)}</select></div>
        <div><label class="form-label" for="pvnc_entite">Entité <span class="pf-obl">*</span></label><select id="pvnc_entite" class="form-input" required><option value="">— Choisir —</option>${opts(ENTITES_NC)}</select></div>
        <div><label class="form-label" for="pvnc_gravite">Gravité</label><select id="pvnc_gravite" class="form-input" aria-describedby="pvnc_gravite_aide">${opts(GRAVITES_NC, GRAVITE_DEFAUT)}</select></div>
        <div class="pf-large pf-aide" id="pvnc_gravite_aide">Critique ou Bloquante rattachée à une affaire : l’expédition de cette affaire reste bloquée tant que la Qualité n’a pas clos la NC. La mise en quarantaine bloque aussi l’expédition du lot, quelle que soit la gravité.</div>
      </div>
      <div class="pf-section">Rattachement (facultatif)</div>
      <div class="pf-grille">
        <div class="pf-large"><label class="form-label" for="pvnc_num_affaire">Affaire</label><select id="pvnc_num_affaire" class="form-input" onchange="pvncAffaire()"><option value="">Sans affaire</option>${optAffaires}</select></div>
        <div><label class="form-label" for="pvnc_lot_ref">Lot</label><select id="pvnc_lot_ref" class="form-input" onchange="pvncLot()"></select></div>
        <div><label class="form-label" for="pvnc_bdt_id">BDT</label><select id="pvnc_bdt_id" class="form-input" onchange="pvncBdt()"></select></div>
        <div><label class="form-label" for="pvnc_ref_article">Code article / pièce</label><input id="pvnc_ref_article" type="text" class="form-input" maxlength="80"/></div>
        <div><label class="form-label" for="pvnc_designation">Désignation</label><input id="pvnc_designation" type="text" class="form-input" maxlength="200"/></div>
        <div><label class="form-label" for="pvnc_nb_pieces">Quantité concernée (pièces)</label><input id="pvnc_nb_pieces" type="text" inputmode="numeric" class="form-input"/></div>
        <div><label class="form-label" for="pvnc_lieu_detection">Poste (lieu de détection)</label><select id="pvnc_lieu_detection" class="form-input"><option value="">— Choisir —</option>${opts(NC_POSTES_LISTE)}</select></div>
      </div>
      <div class="pf-section">Défaut</div>
      <div class="pf-grille">
        <div><label class="form-label" for="pvnc_type_defaut">Nature de la NC</label><select id="pvnc_type_defaut" class="form-input"><option value="">— Choisir —</option>${opts(NC_NATURES)}</select></div>
        <div><label class="form-label" for="pvnc_lieu_imputation">Imputation (service responsable)</label><select id="pvnc_lieu_imputation" class="form-input"><option value="">— Choisir —</option>${opts(NC_IMPUTATIONS)}</select></div>
        <div class="pf-large"><label class="form-label" for="pvnc_description">Description du défaut <span class="pf-obl">*</span></label><textarea id="pvnc_description" class="form-input" rows="3" maxlength="${DESCRIPTION_NC_MAX}" required style="resize:vertical;"></textarea></div>
        <div><label class="form-label" for="pvnc_type_cause">Nature de la cause</label><select id="pvnc_type_cause" class="form-input"><option value="">— Choisir —</option>${opts(NC_CAUSE_OPTS)}</select></div>
        <div><label class="form-label" for="pvnc_cause_detail">Cause présumée</label><input id="pvnc_cause_detail" type="text" class="form-input" maxlength="1000"/></div>
        <div><label class="form-label" for="pvnc_action_corrective">Action immédiate</label><select id="pvnc_action_corrective" class="form-input"><option value="">— Choisir —</option>${opts(NC_ACTIONS_IMMEDIATES)}</select></div>
        <div><label class="form-label" for="pvnc_traitement">Traitement proposé</label><input id="pvnc_traitement" type="text" class="form-input" maxlength="1000"/></div>
      </div>
      <label class="pf-quar" for="pvnc_quarantaine"><input type="checkbox" id="pvnc_quarantaine"/><span><i class="fas fa-box-archive" aria-hidden="true"></i> Mettre en quarantaine — isoler le lot ou les pièces en attendant la décision de la Qualité</span></label>
      <div id="pvnc_err" class="pf-err" role="alert" hidden style="margin-top:10px;"></div>
    </div>
    <div class="pf-pied">
      <button type="button" onclick="pfFermer('pvncModal')" class="btn btn-secondary">Annuler</button>
      <button type="submit" id="pvnc_envoyer" class="btn btn-primary" style="background:linear-gradient(135deg,#dc2626,#991b1b);"><i class="fas fa-file-signature" aria-hidden="true"></i> Émettre le PV</button>
    </div>
  </form>
</div>
<script>
var PRODFORM_REF=${sjX(ref)};
function pfEl(id){ return document.getElementById(id); }
function pfVal(id){ var e=pfEl(id); return e ? String(e.value||'').trim() : ''; }
// pushNotif insère en innerHTML : tout texte (avertissements du serveur, messages de la base) est échappé ici.
function pfEsc(t){ return String(t==null?'':t).replace(/[&<>"']/g,function(ch){ return ch==='&'?'&amp;':ch==='<'?'&lt;':ch==='>'?'&gt;':ch==='"'?'&quot;':'&#39;'; }); }
function pfNotif(type,icone,texte,ms){ if(typeof pushNotif==='function') pushNotif(type,icone,pfEsc(texte),ms||5000); }
function pfAujourdhui(){ var d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
function pfOptions(sel,items,vide){
  if(!sel) return; var cur=sel.value; sel.innerHTML='';
  var o=document.createElement('option'); o.value=''; o.textContent=vide; sel.appendChild(o);
  items.forEach(function(it){ var op=document.createElement('option'); op.value=it.v; op.textContent=it.t; sel.appendChild(op); });
  sel.value=cur; if(sel.value!==cur) sel.value='';
}
function pfErreur(prefixe,champ,message){
  var form=pfEl(prefixe+'_form');
  if(form){ Array.prototype.forEach.call(form.querySelectorAll('.pf-invalide'),function(x){ x.classList.remove('pf-invalide'); x.removeAttribute('aria-invalid'); }); }
  var box=pfEl(prefixe+'_err'); if(box){ box.textContent=message||''; box.hidden=!message; }
  if(champ){ var e=pfEl(prefixe+'_'+champ); if(e){ e.classList.add('pf-invalide'); e.setAttribute('aria-invalid','true'); try{ e.focus(); }catch(x){} } }
  return false;
}
var PF_DERNIER_FOCUS=null;
function pfOuvrir(id,premier){
  var m=pfEl(id); if(!m) return;
  PF_DERNIER_FOCUS=document.activeElement;
  m.style.display='flex';
  setTimeout(function(){ var e=pfEl(premier); if(e) e.focus(); },30);
}
function pfFermer(id){
  var m=pfEl(id); if(m) m.style.display='none';
  var p=pfEl(id==='odaModal'?'oda_pin':'pvnc_pin'); if(p) p.value='';
  if(PF_DERNIER_FOCUS&&PF_DERNIER_FOCUS.focus){ try{ PF_DERNIER_FOCUS.focus(); }catch(e){} }
}
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape') return;
  ['odaModal','pvncModal'].forEach(function(id){ var m=pfEl(id); if(m&&m.style.display==='flex') pfFermer(id); });
});
function pfEnvoyer(prefixe,url,payload,succes){
  var btn=pfEl(prefixe+'_envoyer');
  if(btn){ if(btn.disabled) return; btn.disabled=true; btn.setAttribute('aria-busy','true'); }
  pfErreur(prefixe,null,'');
  fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){ return r.json().catch(function(){ return {ok:false,error:'Réponse illisible du serveur (code '+r.status+') : rien n’a été confirmé.'}; }); })
    .then(function(j){
      if(j&&j.ok){ succes(j); (j.avertissements||[]).forEach(function(a){ pfNotif('warn','fa-triangle-exclamation',a,12000); }); return; }
      if(j&&j.champ==='pin'){ var e=pfEl(prefixe+'_pin'); if(e) e.value=''; }
      pfErreur(prefixe,(j&&j.champ)||null,(j&&j.error)||'Envoi refusé.');
    })
    .catch(function(){ pfErreur(prefixe,null,'Erreur réseau : rien n’a été enregistré, réessayez.'); })
    .then(function(){ if(btn){ btn.disabled=false; btn.removeAttribute('aria-busy'); } });
}

// ── Demande d’achat : le formulaire complet s’ouvre tout de suite, l’identification est vérifiée à l’envoi ──
function odaOpen(){
  var f=pfEl('oda_form'); if(f) f.reset();
  pfErreur('oda',null,'');
  var l=pfEl('oda_livraison'); if(l) l.min=pfAujourdhui();
  odaCategorie();
  pfOuvrir('odaModal','oda_matricule');
}
function odaCategorie(){
  var c=(document.querySelector('input[name=oda_categorie]:checked')||{}).value;
  var w=pfEl('oda_machine_wrap'); if(w) w.hidden=(c!=='machine');
}
function odaMachine(){
  var id=pfVal('oda_machine_id');
  var m=(PRODFORM_REF.machines||[]).filter(function(x){ return String(x.id)===id; })[0];
  var p=pfEl('oda_poste_id'); if(m&&m.poste_id&&p) p.value=String(m.poste_id);
}
function odaSubmit(ev){
  if(ev) ev.preventDefault();
  var cat=(document.querySelector('input[name=oda_categorie]:checked')||{}).value||'';
  var p={ matricule:pfVal('oda_matricule'), pin:pfVal('oda_pin'), categorie:cat, machine_id:(cat==='machine'?pfVal('oda_machine_id'):''),
    article:pfVal('oda_article'), reference:pfVal('oda_reference'), qte:pfVal('oda_qte'), unite:pfVal('oda_unite'),
    num_affaire:pfVal('oda_num_affaire'), poste_id:pfVal('oda_poste_id'), priorite:pfVal('oda_priorite'), livraison:pfVal('oda_livraison'), fournisseur:pfVal('oda_fournisseur') };
  if(!p.matricule) return pfErreur('oda','matricule','Saisissez votre matricule.');
  if(!p.pin) return pfErreur('oda','pin','Saisissez votre code PIN.');
  if(cat==='machine'&&!p.machine_id) return pfErreur('oda','machine_id','Choisissez la machine concernée.');
  if(!p.article) return pfErreur('oda','article','Indiquez l’article ou sa désignation.');
  var q=parseFloat(String(p.qte).replace(',','.'));
  if(!(q>0)) return pfErreur('oda','qte','Quantité invalide : un nombre supérieur à 0.');
  pfEnvoyer('oda','/api/production/demande-achat-operateur',p,function(j){
    pfFermer('odaModal');
    pfNotif('ok','fa-cart-plus','Demande d’achat '+j.id+' envoyée aux Achats.',6000);
  });
  return false;
}

// ── PV de non-conformité ──
function pvncOpen(){
  var f=pfEl('pvnc_form'); if(f) f.reset();
  pfErreur('pvnc',null,'');
  var d=pfEl('pvnc_date_nc'); if(d){ var a=pfAujourdhui(); d.value=a; d.max=a; }
  pvncAffaire();
  pfOuvrir('pvncModal','pvnc_matricule');
}
function pvncAffaire(){
  var aff=pfVal('pvnc_num_affaire');
  var lots=(PRODFORM_REF.lots||[]).filter(function(l){ return aff&&String(l.aff)===aff; });
  var sl=pfEl('pvnc_lot_ref');
  pfOptions(sl,lots.map(function(l){ return {v:l.id,t:l.id+(l.piece?' · '+l.piece:'')}; }),aff?'— Aucun lot —':'— Choisissez d’abord une affaire —');
  if(sl) sl.disabled=!aff;
  pvncLot();
}
function pvncLot(){
  var aff=pfVal('pvnc_num_affaire'), lot=pfVal('pvnc_lot_ref');
  var bdts=(PRODFORM_REF.bdts||[]).filter(function(b){ return aff&&String(b.aff)===aff&&(!lot||String(b.lot)===lot); });
  var sb=pfEl('pvnc_bdt_id');
  pfOptions(sb,bdts.map(function(b){ return {v:b.id,t:b.id+(b.op?' · '+b.op:'')}; }),aff?'— Aucun BDT —':'— Choisissez d’abord une affaire —');
  if(sb) sb.disabled=!aff;
}
function pvncBdt(){
  var id=pfVal('pvnc_bdt_id');
  var b=(PRODFORM_REF.bdts||[]).filter(function(x){ return String(x.id)===id; })[0];
  if(!b) return;
  var sl=pfEl('pvnc_lot_ref'); if(sl&&b.lot&&!sl.value){ sl.value=String(b.lot); }
  var ra=pfEl('pvnc_ref_article'); if(ra&&!ra.value&&b.piece) ra.value=b.piece;
}
function pvncSubmit(ev){
  if(ev) ev.preventDefault();
  var ids=['date_nc','type_nc','entite','gravite','num_affaire','lot_ref','bdt_id','ref_article','designation','nb_pieces','lieu_detection','type_defaut','lieu_imputation','description','type_cause','cause_detail','action_corrective','traitement'];
  var p={ matricule:pfVal('pvnc_matricule'), pin:pfVal('pvnc_pin'), quarantaine:!!(pfEl('pvnc_quarantaine')||{}).checked };
  ids.forEach(function(k){ p[k]=pfVal('pvnc_'+k); });
  if(!p.matricule) return pfErreur('pvnc','matricule','Saisissez votre matricule.');
  if(!p.pin) return pfErreur('pvnc','pin','Saisissez votre code PIN.');
  if(!p.entite) return pfErreur('pvnc','entite','Choisissez l’entité (Seem ou Semrac).');
  if(!p.description) return pfErreur('pvnc','description','Décrivez le défaut constaté.');
  pfEnvoyer('pvnc','/api/production/nc',p,function(j){
    pfFermer('pvncModal');
    pfNotif('ok','fa-triangle-exclamation','PV de non-conformité '+j.id+' émis : il est dans la liste des NC de la Qualité'+(j.quarantaine_id?', lot mis en quarantaine.':'.'),7000);
  });
  return false;
}
</script>`
}
