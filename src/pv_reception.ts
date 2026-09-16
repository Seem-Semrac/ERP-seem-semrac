// ══════════════════════════════════════════════════════════════
// PV DE CONTRÔLE D'UNE RÉCEPTION FOURNISSEUR — règles PURES (ni base, ni DOM)
// Lot D Expéditions · D2 + décision 3 (14/09/2026). Utilisées par :
//   · POST /api/expeditions/bc/:id/pv (validation, contrôleur, détail jsonb, NC, quarantaine) ;
//   · GET /expeditions/service (liste des contrôleurs éligibles, passée à la page).
// Testables sans rien démarrer (scratchpad lotd/test_pv.mjs).
//
// Demande : « Pour le PV de contrôle quand c'est conforme rien à mettre à part le fait que c'est
// conforme, quand c'est non conforme afficher tout ce qui appartient au bon de commande et indiquer
// sur quelle ligne il y a un problème avec deux cases oui non […] Laisser en bas une case
// d'observation générale. Il faut aussi pouvoir confirmer le certificat matière s'il le fallait
// dans le BC. Le contrôleur ne peut être que quelqu'un qui a les accès écriture dans expéditions. »
//
// Règles :
//   · Conforme : rien d'autre que le résultat, le contrôleur et (si le BC l'exige) la case
//     « Certificat matière reçu et conforme » — CONFORME IMPOSSIBLE sans cette case (décision 4).
//   · [remplacé par le Lot F, ci-dessous] Non conforme : une réponse Oui / Non par ligne du BC (lignes relues par le SERVEUR avec
//     lignesBc : le client n'envoie que {idx, conforme, observation}) ; observation obligatoire sur
//     chaque « Non » ; au moins un « Non » OU le certificat exigé absent ; observation générale
//     facultative ; gravité de la NC (défaut Majeure).
//   · Contrôleur : un salarié ACTIF ayant l'écriture sur les Expéditions (même règle que canAccess :
//     direction `all`, rôle logistique, jeton `ecrire:expeditions`). Le compte de secours (BOOTSTRAP)
//     n'a pas de fiche salarié : il peut enregistrer, pas être choisi.
//   · Les valeurs de statut / decision / anomalie / nc_ouverte de pv_controle NE CHANGENT PAS
//     (contraintes CHECK du cloud).
//
// Lot F (15/09/2026) — QUANTITÉ REÇUE PAR LIGNE, NC par ligne, excédent, reliquat, Mise en stock :
//   « je veux pouvoir avoir à côté de la case observations la quantité reçue à côté de la quantité prévue »
//   · le tableau des lignes est rempli en Conforme COMME en Non conforme : du client on ne prend que
//     {idx, qte_recue, reliquat, observation} (+ qte_prevue_affichee, garde-fou « rechargez ») ;
//   · Qté prévue : BC à un article → quantité de la réception (BL = reste attendu) ; BC à plusieurs articles
//     → quantité commandée de la ligne ; quantité non numérique → pas de comparaison (avertissement) ;
//   · une ligne est en écart QUANTITATIF si reçue < prévue sans reliquat annoncé, ou reçue > prévue (excédent) ;
//     QUALITATIF si une observation est écrite ; les deux possibles. Conforme / Non conforme reste un choix
//     manuel : Conforme refuse toute ligne en écart ; Non conforme en exige une (ou le certificat absent) ;
//   · un reliquat annoncé justifie le manque (pas de NC) : il n'empêche pas le PV conforme — le reçu est bon,
//     le reste est commandé à nouveau (bon de commande de reliquat, construireBcReliquat) ;
//   · effets par ligne : quantité BONNE À RANGER (min(reçue, prévue) sans observation) → file Mise en stock ;
//     ligne qualitative → quarantaine de la part PRÉVUE reçue (min(reçue, prévue)) ; excédent → TOUJOURS validation
//     hiérarchique (validationExcedentPV), rattachée à la quarantaine de la ligne quand elle est qualitative ou que
//     le certificat manque (la Direction ne l'accepte qu'après la décision de la Qualité) ; une NC fournisseur par
//     ligne en écart (ncsReceptionPV) ; certificat matière absent → une NC dédiée et la réception (hors lignes déjà
//     en quarantaine, hors excédents) bloquée.
//   Vérification lot F (16/09/2026) : l'excédent d'une ligne qualitative (ou d'une réception sans certificat) partait en
//     quarantaine avec le reste ; la Qualité le traitait comme de la matière commandée (manque, avoir, remplacement
//     réclamés à tort) et une dérogation le faisait entrer en stock SANS la validation hiérarchique demandée.
// ══════════════════════════════════════════════════════════════
import { lignesBrutesBc, nombreStrict, type LigneBc } from './reception'
import { parseBooleen } from './certificat_matiere'
import { peutEcrireService, type SessionUser } from './auth'

/** Gravités proposées pour la NC (liste de la Qualité). */
export const GRAVITES_NC: readonly string[] = ['Mineure', 'Majeure', 'Critique', 'Bloquante']
export const GRAVITE_DEFAUT = 'Majeure'
/** Détecteur de la NC : valeur de la liste Qualité (l'édition de la NC la conserve, le badge dit « Fournisseur »). */
export const DETECTEUR_RECEPTION = 'Réception'
/** Longueurs maximales des textes libres. */
export const OBS_LIGNE_MAX = 1000
export const OBS_GENERALE_MAX = 4000
export const ID_CONTROLEUR_MAX = 100
/** Valeurs de pv_controle.certificat_matiere (contrainte CHECK de la migration 012). */
export const CERTIFICAT_MATIERE_VALEURS = ['non_requis', 'confirme', 'absent'] as const
export type CertificatMatiere = typeof CERTIFICAT_MATIERE_VALEURS[number]
/** Colonnes ajoutées à pv_controle par la migration 012 / le script cloud-10. */
export const COLONNES_PV_012 = ['detail', 'controleur_id', 'controleur_nom', 'saisi_par', 'certificat_matiere'] as const
/** Ligne de la NC quand le certificat exigé manque. */
export const MSG_CERTIFICAT_ABSENT = 'Certificat matière absent ou non conforme'
/** Refus d'accès (handler). */
export const MSG_PV_RESERVE = 'Le PV de contrôle est réservé aux personnes ayant l’écriture sur les Expéditions.'
/** Contrôleur choisi non éligible (403). */
export const MSG_CONTROLEUR_NON_ELIGIBLE = 'Ce salarié ne peut pas être contrôleur : il n’a pas l’écriture sur les Expéditions, ou son compte est désactivé. Choisissez un contrôleur dans la liste.'
/** Avertissement quand la base n'a pas les colonnes 012 de pv_controle. */
export const AVERT_MIGRATION_012_PV = 'Base sans les colonnes du PV détaillé (migration 012 ; en cloud : docker/db/cloud/cloud-10-reception-fournisseur-pv.sql) : '
  + 'le détail ligne par ligne, le contrôleur et le certificat matière sont gardés en texte dans les observations du PV. Le PV, lui, est enregistré.'

export type ResultatPV = 'conforme' | 'non_conforme'
export type ChampPV = 'resultat' | 'controleur_id' | 'certificat_confirme' | 'lignes' | 'observation_generale' | 'gravite'

/** Quantité reçue maximale acceptée par ligne : garde-fou contre une faute de frappe grossière. */
export const QTE_RECUE_MAX = 10000000
/** Nature d'un écart de ligne (colonne non_conformites.categorie de la NC fournisseur). */
export type NatureEcart = 'quantitative' | 'qualitative' | 'quantitative et qualitative'
/** Type de la validation hiérarchique d'un excédent de réception (table validations, cockpit Direction). */
export const TYPE_VALIDATION_EXCEDENT = 'excedent_reception'
/** Valeurs écrites sur la NC fournisseur (listes existantes de la Qualité : NC_TYPE_OPTS, NC_NATURES). */
export const TYPE_NC_RECEPTION = 'Fournisseur'
export const NATURE_NC_QUANTITE = 'Logistique - Quantité'
export const NATURE_NC_CERTIFICAT = 'Logistique - Certificats'
export const NATURE_NC_A_REQUALIFIER = 'À requalifier'
const arr3 = (n: number) => Math.round(n * 1000) / 1000
const nbFr = (n: number | null | undefined) => (n == null ? '?' : String(arr3(n)).replace('.', ','))

/** Une ligne du BC telle que contrôlée : la ligne relue par le serveur + la saisie + ce qu'on en déduit. */
export interface LignePV extends LigneBc {
  /** Déduit : ni écart de quantité (hors reliquat annoncé) ni observation. */
  conforme: boolean
  /** Observation de la ligne (facultative ; écrite = écart qualitatif). */
  observation: string | null
  /** Quantité attendue sur cette réception (null = inconnue, pas de comparaison). */
  qte_prevue: number | null
  /** Quantité reçue saisie (≥ 0). */
  qte_recue: number
  /** Reliquat annoncé par le fournisseur (seulement si reçue < prévue). */
  reliquat: boolean
  /** Quantité du reliquat (= manque couvert par le reliquat annoncé, 0 sinon). */
  qte_reliquat: number
  /** reçue − prévue (négatif = manque, positif = excédent), null si prévue inconnue. */
  ecart: number | null
  manque: number
  excedent: number
  nature: NatureEcart | null
  /** Quantité bonne à ranger (file Mise en stock). */
  qte_a_ranger: number
  /** Quantité mise en quarantaine avec la NC de la ligne (ligne qualitative). */
  qte_quarantaine: number
  /** Excédent soumis à la validation hiérarchique (toujours : une quarantaine ne porte que la part prévue). */
  excedent_a_valider: number
  /** L'excédent dépend aussi de la décision de la Qualité (ligne qualitative, ou certificat absent). */
  excedent_sous_reserve_qualite: boolean
}

export interface SaisiePV {
  resultat: ResultatPV
  /** Valeur de pv_controle.anomalie (true = non conforme). */
  anomalie: boolean
  controleur_id: string
  certificat: { requis: boolean; confirme: boolean | null }
  certificat_matiere: CertificatMatiere
  /** Toutes les lignes du BC, avec leur quantité reçue. */
  lignes: LignePV[]
  /** Les lignes en écart (nature non nulle). */
  lignes_non: LignePV[]
  observation_generale: string | null
  /** Gravité de la NC (null si conforme). */
  gravite: string | null
  /** Certificat matière absent : quantité reçue bloquée en quarantaine avec la NC du certificat (hors lignes qualitatives). */
  qte_quarantaine_certificat: number
  /** Nombre de quarantaines que le PV doit créer (lignes qualitatives reçues + certificat) : sert à dire le BL « tranché ». */
  quarantaines_attendues: number
  /** Avertissements de saisie (quantité prévue inconnue…). */
  avertissements: string[]
}
export type ResultatSaisiePV = { ok: true; valeurs: SaisiePV } | { ok: false; champ: ChampPV; error: string; idx?: number }

// ─── Textes ────────────────────────────────────────────────────
/** Texte libre nettoyé : caractères de contrôle neutralisés (retours à la ligne gardés si multiLigne). */
export function texteLibre(v: unknown, multiLigne = false): string | null {
  if (v == null || typeof v === 'object') return null
  let s = String(v).replace(/\r\n?/g, '\n')
  s = multiLigne
    ? s.replace(/[\x00-\x09\x0b-\x1f\x7f]+/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
    : s.replace(/[\x00-\x1f\x7f]+/g, ' ')
  s = s.trim()
  return s ? s : null
}

function lireResultat(v: unknown): ResultatPV | null {
  const s = String(v ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (['conforme', 'ok'].includes(s)) return 'conforme'
  if (['non_conforme', 'nonconforme', 'anomalie', 'nc'].includes(s)) return 'non_conforme'
  return null
}

/** Libellé d'une ligne du BC dans la NC : « Ligne n · réf · désignation ». */
export function libelleLigne(l: Pick<LigneBc, 'idx' | 'reference' | 'designation'>): string {
  return ['Ligne ' + (Number(l.idx) + 1), l.reference, l.designation].filter(x => x != null && String(x).trim() !== '').join(' · ')
}

// ─── Validation du corps de POST /api/expeditions/bc/:id/pv ─────
/**
 * Valide la saisie du PV contre les lignes RELUES du BC (`lignesBc(bc)`), la quantité de la réception
 * (`qteBl`, BL visé), le caractère multi-articles du BC (`bcMultiArticles`) et l'exigence de certificat
 * (`certificatRequis(bc)`). Le premier défaut est rendu (400 + champ, + idx pour une ligne).
 * Ne juge PAS l'éligibilité du contrôleur (lecture des salariés : faite par la route, 403).
 */
export function validerSaisiePV(body: any, ctx: { lignes: LigneBc[]; certificatRequis: boolean; qteBl?: unknown; multiArticles?: boolean }): ResultatSaisiePV {
  const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {}
  const ko = (champ: ChampPV, error: string, idx?: number): ResultatSaisiePV => (idx == null ? { ok: false, champ, error } : { ok: false, champ, error, idx })
  const lignesBcRelues: LigneBc[] = Array.isArray(ctx?.lignes) ? ctx.lignes : []

  const ctrl = texteLibre(b.controleur_id)
  if (!ctrl) return ko('controleur_id', 'Choisissez le contrôleur.')
  if (ctrl.length > ID_CONTROLEUR_MAX) return ko('controleur_id', 'Identifiant de contrôleur invalide.')

  let resultat = lireResultat(b.resultat)
  if (resultat == null && b.resultat == null && typeof b.anomalie === 'boolean') resultat = b.anomalie ? 'non_conforme' : 'conforme'
  if (resultat == null) return ko('resultat', 'Indiquez le résultat du contrôle : Conforme ou Non conforme.')

  const requis = !!ctx?.certificatRequis
  const confirme: boolean | null = requis ? parseBooleen(b.certificat_confirme) === true : null
  const certificat_matiere: CertificatMatiere = !requis ? 'non_requis' : (confirme ? 'confirme' : 'absent')
  const certificat = { requis, confirme }

  if (resultat === 'conforme' && requis && !confirme) {
    return ko('certificat_confirme', 'Le bon de commande exige un certificat matière : cochez « Certificat matière reçu et conforme ». '
      + 'S’il est absent ou non conforme, le PV est non conforme.')
  }

  // ── Lignes (Lot F) : quantité reçue, reliquat annoncé, observation — en Conforme comme en Non conforme ──
  if (!Array.isArray(b.lignes)) return ko('lignes', 'Indiquez la quantité reçue de chaque ligne du bon de commande (rechargez la page si le tableau des lignes n’apparaît pas).')
  const connus = new Set(lignesBcRelues.map(l => l.idx))
  const reponses = new Map<number, any>()
  for (const r of b.lignes as any[]) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) return ko('lignes', 'Réponse de ligne illisible : rechargez la page.')
    const idx = typeof r.idx === 'number' ? r.idx : (typeof r.idx === 'string' && /^\d+$/.test(r.idx.trim()) ? Number(r.idx.trim()) : NaN)
    if (!Number.isInteger(idx) || !connus.has(idx)) {
      return ko('lignes', 'Ligne inconnue sur ce bon de commande (il a peut-être été modifié entre-temps) : rechargez la page.')
    }
    if (reponses.has(idx)) return ko('lignes', 'Ligne ' + (idx + 1) + ' : réponse envoyée deux fois.', idx)
    reponses.set(idx, r)
  }
  const prevues = qtesPrevuesPV(lignesBcRelues, ctx?.qteBl ?? null, ctx?.multiArticles === true)
  // Certificat exigé et non confirmé (seulement possible en Non conforme) : rien de la réception ne se range.
  const certAbsent = certificat_matiere === 'absent'
  const lignes: LignePV[] = []
  const avertissements: string[] = []
  let qteQuarCert = 0
  for (let i = 0; i < lignesBcRelues.length; i++) {
    const l = lignesBcRelues[i]
    const num = l.idx + 1
    const r = reponses.get(l.idx)
    if (!r) return ko('lignes', 'Ligne ' + num + ' : indiquez la quantité reçue (0 si rien n’est arrivé).', l.idx)
    const vide = r.qte_recue == null || (typeof r.qte_recue === 'string' && r.qte_recue.trim() === '')
    const qn = vide ? null : nombreStrict(r.qte_recue)
    if (qn == null || qn < 0) return ko('lignes', 'Ligne ' + num + ' : quantité reçue invalide — un nombre, 0 si rien n’est arrivé.', l.idx)
    if (qn > QTE_RECUE_MAX) return ko('lignes', 'Ligne ' + num + ' : quantité reçue invraisemblable (plus de 10 000 000) : vérifiez la saisie.', l.idx)
    const recue = arr3(qn)
    const prevue = prevues[i] == null ? null : arr3(prevues[i] as number)
    // La page a-t-elle montré la même quantité prévue ? Sinon le BC ou la réception ont changé entre-temps : on recharge.
    if (Object.prototype.hasOwnProperty.call(r, 'qte_prevue_affichee')) {
      const a = r.qte_prevue_affichee
      const affichee = (a == null || (typeof a === 'string' && a.trim() === '')) ? null : nombreStrict(a)
      if ((affichee == null ? null : arr3(affichee)) !== prevue) {
        return ko('lignes', 'Ligne ' + num + ' : la quantité prévue a changé depuis l’ouverture de la page (' + nbFr(affichee) + ' affichée, ' + nbFr(prevue)
          + ' attendue) : rechargez la page, puis refaites le PV. Rien n’a été enregistré.', l.idx)
      }
    }
    const observation = texteLibre(r.observation, true)
    if (observation && observation.length > OBS_LIGNE_MAX) return ko('lignes', 'Ligne ' + num + ' : observation trop longue (' + OBS_LIGNE_MAX + ' caractères maximum).', l.idx)
    const manque = prevue != null && recue < prevue ? arr3(prevue - recue) : 0
    const excedent = prevue != null && recue > prevue ? arr3(recue - prevue) : 0
    // Le reliquat ne se déclare que sur un manque (case cachée à l'écran sinon) ; hors de ce cas il est ignoré.
    const reliquat = manque > 0 && parseBooleen(r.reliquat) === true
    const quanti = (manque > 0 && !reliquat) || excedent > 0
    const quali = !!observation
    const nature: NatureEcart | null = quanti && quali ? 'quantitative et qualitative' : (quanti ? 'quantitative' : (quali ? 'qualitative' : null))
    // Part COMMANDÉE de ce qui est arrivé : l'excédent n'en fait jamais partie (il va à la validation hiérarchique).
    const partCommandee = arr3(prevue != null ? Math.min(recue, prevue) : recue)
    let qte_a_ranger = 0, qte_quarantaine = 0
    const excedent_a_valider = excedent
    if (quali) qte_quarantaine = partCommandee                              // V1 : la ligne qualitative va en quarantaine (hors excédent)
    else if (certAbsent) qteQuarCert = arr3(qteQuarCert + partCommandee)   // le reçu attend la décision Qualité avec la NC du certificat
    else qte_a_ranger = partCommandee
    if (prevue == null) {
      avertissements.push('Ligne ' + num + ' : quantité prévue inconnue sur le bon de commande' + (l.qte_texte ? ' (« ' + l.qte_texte + ' »)' : '')
        + ' : écart non calculé, quantité reçue (' + nbFr(recue) + ') reprise telle quelle.')
    }
    lignes.push({
      ...l, qte_prevue: prevue, qte_recue: recue, reliquat, qte_reliquat: reliquat ? manque : 0,
      ecart: prevue == null ? null : arr3(recue - prevue), manque, excedent, observation, nature, conforme: nature == null,
      qte_a_ranger: arr3(qte_a_ranger), qte_quarantaine, excedent_a_valider,
      excedent_sous_reserve_qualite: excedent_a_valider > 0 && (quali || certAbsent),
    })
  }
  const lignes_non = lignes.filter(l => l.nature != null)
  const quarantaines_attendues = lignes.filter(l => l.qte_quarantaine > 0).length + (qteQuarCert > 0 ? 1 : 0)

  if (resultat === 'conforme') {
    const e = lignes_non[0]
    if (e) return ko('lignes', 'Ligne ' + (e.idx + 1) + ' : ' + motifEcart(e) + ' — le PV ne peut pas être conforme : passez en « Non conforme ».', e.idx)
    return { ok: true, valeurs: { resultat, anomalie: false, controleur_id: ctrl, certificat, certificat_matiere, lignes, lignes_non: [],
      observation_generale: null, gravite: null, qte_quarantaine_certificat: 0, quarantaines_attendues: 0, avertissements } }
  }

  // ── Non conforme ──
  if (!lignes_non.length && !certAbsent) {
    return ko('lignes', 'Non conforme : aucune ligne en écart. Une ligne est non conforme si la quantité reçue diffère de la quantité prévue '
      + '(sans reliquat annoncé par le fournisseur) ou si une observation est écrite'
      + (requis ? ' ; ou laissez « Certificat matière reçu et conforme » décoché s’il est absent' : '')
      + '. Sans écart, le PV est conforme.')
  }
  const observation_generale = texteLibre(b.observation_generale, true)
  if (observation_generale && observation_generale.length > OBS_GENERALE_MAX) {
    return ko('observation_generale', 'Observation générale trop longue (' + OBS_GENERALE_MAX + ' caractères maximum).')
  }
  const gSaisie = texteLibre(b.gravite)
  const gravite = gSaisie ? GRAVITES_NC.find(g => g.toLowerCase() === gSaisie.toLowerCase()) : GRAVITE_DEFAUT
  if (!gravite) return ko('gravite', 'Gravité inconnue : choisissez ' + GRAVITES_NC.join(', ') + '.')

  return { ok: true, valeurs: { resultat, anomalie: true, controleur_id: ctrl, certificat, certificat_matiere, lignes, lignes_non,
    observation_generale, gravite, qte_quarantaine_certificat: qteQuarCert, quarantaines_attendues, avertissements } }
}

/**
 * Quantité PRÉVUE de chaque ligne sur CETTE réception (mêmes positions que `lignes`).
 *   · BC à plusieurs articles, ou réception sans quantité : quantité commandée de la ligne (null si non numérique) ;
 *   · une seule ligne : la quantité de la réception (BL = reste attendu) ;
 *   · un article sur plusieurs lignes : la quantité de la réception répartie dans l'ordre des lignes
 *     (égale à la somme des lignes lors d'une première réception complète).
 * Recopiée à l'identique par l'écran (expPvPrevues, src/expeditions.tsx) : la route compare avec qte_prevue_affichee.
 */
export function qtesPrevuesPV(lignes: LigneBc[], qteBl: unknown, multiArticles: boolean): (number | null)[] {
  const lg = Array.isArray(lignes) ? lignes : []
  if (!lg.length) return []
  const q = quantiteOuNull(qteBl)
  if (multiArticles || q == null) return lg.map(l => (l.qte_commandee == null ? null : arr3(l.qte_commandee)))
  if (lg.length === 1) return [arr3(q)]
  if (lg.some(l => l.qte_commandee == null)) return lg.map(l => (l.qte_commandee == null ? null : arr3(l.qte_commandee)))
  const somme = arr3(lg.reduce((s, l) => s + (l.qte_commandee as number), 0))
  if (somme === arr3(q)) return lg.map(l => arr3(l.qte_commandee as number))
  let reste = arr3(q)
  return lg.map((l, i) => {
    const v = i === lg.length - 1 ? reste : Math.min(reste, l.qte_commandee as number)
    reste = arr3(reste - v)
    return arr3(Math.max(0, v))
  })
}

/** Écart d'une ligne en clair : « manque de 2 pce (reçu 8 sur 10 prévu, sans reliquat annoncé) ; observation : … ». */
export function motifEcart(l: Pick<LignePV, 'manque' | 'excedent' | 'reliquat' | 'observation' | 'qte_recue' | 'qte_prevue' | 'unite'>): string {
  const u = l.unite ? ' ' + l.unite : ''
  const parts: string[] = []
  if (l.manque > 0 && !l.reliquat) parts.push('manque de ' + nbFr(l.manque) + u + ' (reçu ' + nbFr(l.qte_recue) + ' sur ' + nbFr(l.qte_prevue) + ' prévu, sans reliquat annoncé)')
  if (l.excedent > 0) parts.push('excédent de ' + nbFr(l.excedent) + u + ' (reçu ' + nbFr(l.qte_recue) + ' pour ' + nbFr(l.qte_prevue) + ' prévu)')
  if (l.observation) parts.push('observation : ' + l.observation)
  return parts.join(' ; ')
}

// ─── Contrôleurs éligibles ─────────────────────────────────────
export interface ControleurPV { id: string; nom: string; role: string }

/**
 * Session équivalente à un salarié, calculée EXACTEMENT comme le login et le rafraîchissement des
 * droits (droitsAJour) : rôles = `roles` sinon `[role]` ; perms = `autorisations` si la liste est non
 * vide, sinon l'union des autorisations des rôles (`permsParDefaut`, autorisationsUnion côté serveur).
 */
export function sessionDeSalarie(s: any, permsParDefaut: (roles: string[]) => string[]): SessionUser {
  const roles: string[] = Array.isArray(s?.roles) && s.roles.length ? s.roles.map((r: any) => String(r)) : [String(s?.role || 'operateur')]
  const perms: string[] = Array.isArray(s?.autorisations) && s.autorisations.length ? s.autorisations.map((p: any) => String(p)) : permsParDefaut(roles)
  const nom = (String(s?.prenom ?? '').trim() + ' ' + String(s?.nom ?? '').trim()).trim() || String(s?.matricule || s?.id || '')
  return { sub: String(s?.id ?? ''), mat: String(s?.matricule || s?.id || ''), nom, role: String(s?.role || roles[0]), roles, perms, ent: String(s?.entite || '') }
}

/** Salariés ACTIFS ayant l'écriture sur les Expéditions, triés par nom. Identifiés par `id` (des matricules sont partagés). */
export function controleursEligibles(rows: any[] | null | undefined, permsParDefaut: (roles: string[]) => string[]): ControleurPV[] {
  const out: ControleurPV[] = []
  const vus = new Set<string>()
  for (const s of (Array.isArray(rows) ? rows : [])) {
    if (!s || typeof s !== 'object') continue
    const id = String(s.id ?? '').trim()
    if (!id || vus.has(id)) continue
    if (s.actif === false) continue                         // même règle que droitsAJour : seul `false` ferme le compte
    const u = sessionDeSalarie(s, permsParDefaut)
    if (!peutEcrireService(u, 'expeditions')) continue
    vus.add(id)
    out.push({ id, nom: u.nom, role: u.role })
  }
  return out.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
}

// ─── Écritures ─────────────────────────────────────────────────
/** Nombre STRICTEMENT positif, sinon null (jamais 0) — quantité du BL recopiée sur la NC, montant du BC. */
export function quantiteOuNull(v: unknown): number | null {
  if (v == null || typeof v === 'boolean') return null
  if (typeof v === 'string' && v.trim() === '') return null
  const n = Number(typeof v === 'string' ? v.trim().replace(',', '.') : v)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Contenu de pv_controle.detail (jsonb, version 2 — Lot F : quantités par ligne ; les clés de la version 1 sont gardées). */
export function construireDetailPV(p: {
  valeurs: SaisiePV; bc: any; bl: any | null; affaires: string[]
  controleur: { id: string; nom: string }; saisiPar: { id: string; nom: string } | null; date: string; numPv: string
}): Record<string, any> {
  const { valeurs: v, bc, bl } = p
  return {
    v: 2,
    num_pv: p.numPv,
    date: p.date,
    resultat: v.resultat,
    bc: {
      id: String(bc?.id ?? ''),
      num_bc: String(bc?.num_bc || bc?.id || ''),
      type_bc: bc?.type_bc ?? null,
      fournisseur: bc?.fournisseur_nom || bc?.fournisseur || null,
      num_affaire: bc?.num_affaire || null,
      affaires: Array.isArray(p.affaires) ? p.affaires : [],
      date_bc: bc?.date_bc || null,
      date_livraison: bc?.date_livraison || bc?.date_livraison_prevue || null,
      montant_ht: quantiteOuNull(bc?.montant_ht),
      conditions_paiement: bc?.conditions_paiement || null,
      notes: bc?.notes || null,
      articles: bc?.articles || null,
    },
    bl: bl ? {
      id: String(bl.id),
      qte: quantiteOuNull(bl.qte),
      num_commande_fournisseur: bl.num_commande_fournisseur ?? null,
      num_bl_fournisseur: bl.num_bl_fournisseur ?? null,
    } : null,
    lignes: v.lignes.map(l => ({
      idx: l.idx, reference: l.reference, designation: l.designation, qte_commandee: l.qte_commandee, qte_texte: l.qte_texte,
      unite: l.unite, prix_unitaire: l.prix_unitaire, num_affaire: l.num_affaire, da_id: l.da_id, lot: l.lot, operation: l.operation,
      reconstituee: l.reconstituee, conforme: l.conforme, observation: l.observation,
      // v2 — Lot F
      qte_prevue: l.qte_prevue, qte_recue: l.qte_recue, reliquat: l.reliquat, qte_reliquat: l.qte_reliquat,
      ecart: l.ecart, type_ecart: l.manque > 0 ? 'manque' : (l.excedent > 0 ? 'excedent' : null), manque: l.manque, excedent: l.excedent,
      nature: l.nature, qte_a_ranger: l.qte_a_ranger, qte_quarantaine: l.qte_quarantaine, excedent_a_valider: l.excedent_a_valider,
      nc_id: null, quarantaine_id: null, validation_id: null, bc_reliquat_id: null,
    })),
    observation_generale: v.observation_generale,
    gravite: v.gravite,
    certificat: { requis: v.certificat.requis, confirme: v.certificat.confirme },
    controleur: { id: p.controleur.id, nom: p.controleur.nom },
    saisi_par: p.saisiPar,
    // v2 — Lot F : effets du PV (identifiants complétés par completerDetailPV une fois créés)
    certificat_absent: v.certificat_matiere === 'absent' ? { qte_quarantaine: v.qte_quarantaine_certificat, nc_id: null, quarantaine_id: null } : null,
    quarantaines_attendues: v.quarantaines_attendues,
    bc_reliquat_id: null,
    mise_en_stock: null,
  }
}

/** Identifiants créés par la route après l'enregistrement du PV, reportés dans le détail v2. */
export interface EffetsPV {
  lignes: Record<number, { nc_id?: string | null; quarantaine_id?: string | null; validation_id?: string | null }>
  certificat: { nc_id: string | null; quarantaine_id: string | null } | null
  bc_reliquat_id: string | null
  mise_en_stock: { ids: string[]; deja: string[]; repli: boolean; error: string | null } | null
}
export function effetsPVVides(): EffetsPV {
  return { lignes: {}, certificat: null, bc_reliquat_id: null, mise_en_stock: null }
}

/** Détail v2 complété des identifiants (NC, quarantaine, validation, BC de reliquat, file Mise en stock). Pur, ne modifie pas l'entrée. */
export function completerDetailPV(detail: Record<string, any>, effets: EffetsPV): Record<string, any> {
  const d: Record<string, any> = { ...(detail || {}) }
  d.lignes = (Array.isArray(d.lignes) ? d.lignes : []).map((l: any) => {
    const e = effets.lignes[Number(l?.idx)] || {}
    return {
      ...l,
      nc_id: e.nc_id ?? l?.nc_id ?? null,
      quarantaine_id: e.quarantaine_id ?? l?.quarantaine_id ?? null,
      validation_id: e.validation_id ?? l?.validation_id ?? null,
      bc_reliquat_id: (Number(l?.qte_reliquat) > 0 ? effets.bc_reliquat_id : null) ?? l?.bc_reliquat_id ?? null,
    }
  })
  if (d.certificat_absent && effets.certificat) d.certificat_absent = { ...d.certificat_absent, ...effets.certificat }
  d.bc_reliquat_id = effets.bc_reliquat_id ?? d.bc_reliquat_id ?? null
  d.mise_en_stock = effets.mise_en_stock ?? d.mise_en_stock ?? null
  return d
}

// ─── NC fournisseur par ligne (Lot F) ──────────────────────────
/** Une NC à créer : champs propres (type, statut, lot, fournisseur… sont posés par la route). */
export interface NcPV {
  /** Ligne du BC concernée ; null = NC du certificat matière absent. */
  ligne_idx: number | null
  categorie: NatureEcart
  type_defaut: string
  ref_article: string | null
  designation: string | null
  nb_pieces: number | null
  description: string
  detecteur: string
  gravite: string
  /** Quantité à mettre en quarantaine avec cette NC (0 = pas de quarantaine). */
  qte_quarantaine: number
  motif_quarantaine: string
  /** Libellé de la pièce en quarantaine. */
  piece: string | null
}

/**
 * Une NC fournisseur par ligne de BC en écart (quantitative, qualitative ou les deux) + une NC « certificat matière
 * absent » si c'est le cas. Rien pour un PV conforme.
 *   · type_defaut : « Logistique - Quantité » pour un écart purement quantitatif ; « À requalifier » dès qu'il y a une
 *     observation (la Qualité précise la nature) ; « Logistique - Certificats » pour le certificat ;
 *   · nb_pieces : le manque ou l'excédent (quantitatif), la quantité reçue (qualitatif, ou les deux).
 */
export function ncsReceptionPV(v: SaisiePV, ctx: { controleurNom: string; numPv: string; numBc: string; blId: string | null }): NcPV[] {
  if (v.resultat !== 'non_conforme') return []
  const tete = 'Réception fournisseur · PV ' + ctx.numPv + ' · BC ' + ctx.numBc + (ctx.blId ? ' · BL ' + ctx.blId : '')
  const gravite = v.gravite || GRAVITE_DEFAUT
  const fin = [
    v.observation_generale ? 'Observation générale : ' + v.observation_generale : null,
    ctx.controleurNom ? 'Contrôleur : ' + ctx.controleurNom : null,
  ]
  const joindre = (xs: (string | null)[]) => xs.filter(x => x != null && String(x).trim() !== '').join('\n')
  const out: NcPV[] = []
  for (const l of v.lignes_non) {
    const nature = l.nature as NatureEcart
    const quanti = nature !== 'qualitative'
    const u = l.unite ? ' ' + l.unite : ''
    const qteQuanti = l.manque > 0 && !l.reliquat ? l.manque : l.excedent
    const nb = nature === 'quantitative' ? qteQuanti : (l.qte_recue > 0 ? l.qte_recue : qteQuanti)
    const ecartQte = quanti ? motifEcart({ ...l, observation: null }) : null
    out.push({
      ligne_idx: l.idx,
      categorie: nature,
      type_defaut: nature === 'quantitative' ? NATURE_NC_QUANTITE : NATURE_NC_A_REQUALIFIER,
      ref_article: l.reference,
      designation: l.designation,
      nb_pieces: quantiteOuNull(nb),
      description: joindre([
        tete,
        libelleLigne(l),
        'Nature : non-conformité ' + nature,
        ecartQte ? 'Écart de quantité : ' + ecartQte : null,
        l.observation ? 'Observation : ' + l.observation : null,
        l.reliquat ? 'Reliquat annoncé par le fournisseur : ' + nbFr(l.qte_reliquat) + u + ' (bon de commande de reliquat aux Achats)' : null,
        l.excedent_a_valider > 0 ? 'Excédent de ' + nbFr(l.excedent_a_valider) + u + ' soumis à la validation de la Direction (entrée en stock ou retour)'
          + (l.excedent_sous_reserve_qualite ? ', hors quarantaine : il n’entre en stock qu’après la décision de la Qualité sur le lot' : '') : null,
        l.qte_quarantaine > 0 ? 'Quantité en quarantaine : ' + nbFr(l.qte_quarantaine) + u + (l.excedent_a_valider > 0 ? ' (part prévue, excédent à part)' : '') : null,
        ...fin,
      ]),
      detecteur: DETECTEUR_RECEPTION,
      gravite,
      qte_quarantaine: l.qte_quarantaine,
      motif_quarantaine: joindre([libelleLigne(l) + ' — ' + motifEcart(l), tete]),
      piece: [l.reference, l.designation].filter(x => x != null && String(x).trim() !== '').join(' · ') || null,
    })
  }
  if (v.certificat_matiere === 'absent') {
    const q = v.qte_quarantaine_certificat
    out.push({
      ligne_idx: null,
      categorie: 'qualitative',
      type_defaut: NATURE_NC_CERTIFICAT,
      ref_article: null,
      designation: null,
      nb_pieces: quantiteOuNull(q),
      description: joindre([
        tete,
        MSG_CERTIFICAT_ABSENT,
        'Nature : non-conformité qualitative',
        q > 0 ? 'Réception bloquée en quarantaine (hors lignes déjà en quarantaine, hors excédents) : ' + nbFr(q) : null,
        ...fin,
      ]),
      detecteur: DETECTEUR_RECEPTION,
      gravite,
      qte_quarantaine: q,
      motif_quarantaine: joindre([MSG_CERTIFICAT_ABSENT + ' — réception bloquée', tete]),
      piece: null,
    })
  }
  return out
}

// ─── Excédent → validation hiérarchique (Lot F) ────────────────
/** Ligne `validations` (cockpit Direction › À valider) pour l'excédent d'une ligne. Accepter = file Mise en stock ; refuser = retour à organiser. */
export function validationExcedentPV(l: LignePV, ctx: {
  bcId: string; numBc: string; blId: string | null; numPv: string; fournisseur: string | null; numAffaire: string | null; emetteur: string | null; ncId: string | null
  /** Quarantaine de la ligne (qualitative) ou du certificat absent : l'excédent attend aussi la décision de la Qualité. */
  quarantaineId?: string | null
}): Record<string, any> {
  const u = l.unite ? ' ' + l.unite : ''
  const reserve = l.excedent_sous_reserve_qualite === true
  return {
    domaine: 'expeditions',
    type: TYPE_VALIDATION_EXCEDENT,
    objet: 'Excédent de réception ' + ctx.numBc + ' · ' + libelleLigne(l) + ' · +' + nbFr(l.excedent_a_valider) + u
      + ' (reçu ' + nbFr(l.qte_recue) + ' pour ' + nbFr(l.qte_prevue) + ' prévu) — accepter en stock ou refuser (retour au fournisseur)'
      + (reserve ? ' · lot en quarantaine' + (ctx.quarantaineId ? ' ' + ctx.quarantaineId : '') + ' : acceptable seulement après la décision de la Qualité' : ''),
    montant: l.prix_unitaire != null ? Math.round(l.prix_unitaire * l.excedent_a_valider * 100) / 100 : null,
    priorite: 'normal',
    emetteur: ctx.emetteur || 'Réception',
    ref_table: 'bons_de_commande',
    ref_id: ctx.bcId,
    payload: {
      v: 1, pv_id: ctx.numPv, bc_id: ctx.bcId, num_bc: ctx.numBc, bl_id: ctx.blId, ligne_idx: l.idx,
      reference: l.reference, designation: l.designation, unite: l.unite, quantite: l.excedent_a_valider,
      qte_prevue: l.qte_prevue, qte_recue: l.qte_recue, num_affaire: l.num_affaire || ctx.numAffaire || null,
      fournisseur_nom: ctx.fournisseur || null, nc_id: ctx.ncId,
      qualite_requise: reserve, quarantaine_id: reserve ? (ctx.quarantaineId || null) : null,
    },
    statut: 'en_attente',
  }
}

/** Entrée de la file Mise en stock tirée d'une validation d'excédent (payload relu), ou pourquoi c'est impossible. */
export function entreeExcedentValide(val: any): { ok: true; entree: {
  origine: 'excedent_valide'; bc_id: string | null; bl_id: string | null; pv_id: string | null; ligne_idx: number | null
  reference: string | null; designation: string | null; quantite: number; unite: string | null; num_affaire: string | null; fournisseur_nom: string | null
} } | { ok: false; error: string } {
  let p: any = val?.payload
  if (typeof p === 'string') { try { p = JSON.parse(p) } catch { p = null } }
  if (!p || typeof p !== 'object') return { ok: false, error: 'Demande d’excédent illisible (détail absent) : rien n’entre en stock.' }
  const q = quantiteOuNull(p.quantite)
  if (q == null) return { ok: false, error: 'Demande d’excédent sans quantité : rien n’entre en stock.' }
  const txt = (x: any) => (x == null || String(x).trim() === '' ? null : String(x))
  const idx = Number.isInteger(Number(p.ligne_idx)) && p.ligne_idx !== null && p.ligne_idx !== '' ? Number(p.ligne_idx) : null
  return { ok: true, entree: {
    origine: 'excedent_valide', bc_id: txt(p.bc_id), bl_id: txt(p.bl_id), pv_id: txt(p.pv_id), ligne_idx: idx,
    reference: txt(p.reference), designation: txt(p.designation), quantite: q, unite: txt(p.unite),
    num_affaire: txt(p.num_affaire), fournisseur_nom: txt(p.fournisseur_nom),
  } }
}

// ─── Reliquat annoncé → bon de commande de reliquat (Lot F) ────
/** Colonnes de bons_de_commande ajoutées par la migration 013 / le script cloud-11. */
export const COLONNES_BC_RELIQUAT = ['bc_parent_id', 'date_a_valider'] as const

/** N° du BC de reliquat : « <n° du BC d'origine>-R1 », « -R2 »… (suffixe suivant parmi les id / num_bc existants). */
export function numeroBcReliquat(numParent: string, existants: (string | null | undefined)[]): string {
  const base = String(numParent ?? '').trim()
  const echappe = base.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&')
  const re = new RegExp('^' + echappe + '-R(\\d+)$')
  let max = 0
  for (const x of (existants || [])) {
    const m = String(x ?? '').trim().match(re)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return base + '-R' + (max + 1)
}

/**
 * Nouveau `bons_de_commande` pour le reste à recevoir des lignes à reliquat annoncé : mêmes fournisseur, affaire(s),
 * DA, catégorie et exigence de certificat ; lignes = quantité prévue − reçue ; SANS date d'arrivée (`date_a_valider`,
 * les Achats la fixent) ; statut « envoye » (valeur existante) ; montant 0 (porté par le BC d'origine : pas de double
 * comptage des achats) ; validation fournisseur NON reprise (sinon la date serait figée avant d'être fixée).
 * null s'il n'y a aucun reliquat.
 */
export function construireBcReliquat(bc: any, lignes: LignePV[], ctx: { id: string; today: string; numPv: string; blId: string | null; prixUnitaireParent?: number | null }): Record<string, any> | null {
  const aReliquat = (lignes || []).filter(l => l.qte_reliquat > 0)
  if (!aReliquat.length || !bc) return null
  const brutes = lignesBrutesBc(bc)
  const numParent = String(bc.num_bc || bc.id || '')
  const out = aReliquat.map(l => {
    const b = brutes[l.idx]
    const src: Record<string, any> = (!l.reconstituee && b && typeof b === 'object' && !Array.isArray(b))
      ? { ...b }
      : { article: l.designation || bc.articles || null, designation: l.designation, reference: l.reference, fournisseur: bc.fournisseur_nom || null, num_affaire: l.num_affaire }
    delete src.quantite; delete src.qte_commandee; delete src.quantite_estimee
    src.qte = l.qte_reliquat
    // Vérification lot F : le BC de reliquat naît à 0 € (montant porté par le BC d'origine) ; sans prix unitaire sur sa ligne,
    // un avoir ou un excédent sur la livraison du reliquat était chiffré à 0 €. Prix de la ligne, sinon celui du BC d'origine.
    const puLigne = Number(src.prix_unitaire) > 0 ? Number(src.prix_unitaire) : (l.prix_unitaire != null && l.prix_unitaire > 0 ? l.prix_unitaire : null)
    const pu = puLigne ?? (Number(ctx.prixUnitaireParent) > 0 ? Number(ctx.prixUnitaireParent) : null)
    if (pu != null) src.prix_unitaire = pu
    src.reliquat_de = { bc_id: String(bc.id), num_bc: numParent, ligne_idx: l.idx, pv_id: ctx.numPv, bl_id: ctx.blId }
    return src
  })
  const total = arr3(aReliquat.reduce((s, l) => s + l.qte_reliquat, 0))
  const libelles = Array.from(new Set(out.map(x => String(x.designation || x.article || '').trim()).filter(Boolean)))
  const payload: Record<string, any> = {
    id: ctx.id,
    num_bc: ctx.id,
    type_bc: bc.type_bc ?? null,
    fournisseur_id: bc.fournisseur_id ?? null,
    sous_traitant_id: bc.sous_traitant_id ?? null,
    fournisseur_nom: bc.fournisseur_nom ?? null,
    articles: libelles.join(', ') || bc.articles || null,
    demande_achat_id: bc.demande_achat_id ?? null,
    affaire_id: bc.affaire_id ?? null,
    num_affaire: bc.num_affaire ?? null,
    cmd_ref: bc.cmd_ref ?? null,
    montant_ht: 0,
    devise: bc.devise || 'EUR',
    qte_commandee: total,
    date_bc: ctx.today,
    date_livraison: null,
    conditions_paiement: bc.conditions_paiement ?? null,
    statut: 'envoye',
    notes: 'Reliquat du bon de commande ' + numParent + ' annoncé par le fournisseur au PV ' + ctx.numPv + (ctx.blId ? ' (BL ' + ctx.blId + ')' : '')
      + ' : ' + aReliquat.map(l => nbFr(l.qte_reliquat) + (l.unite ? ' ' + l.unite : '') + ' × ' + (l.reference || l.designation || ('ligne ' + (l.idx + 1)))).join(', ')
      + '. Montant porté par le bon de commande d’origine. Date d’arrivée à valider.',
    lignes: out,
    categorie: bc.categorie ?? null,
    machine_id: bc.machine_id ?? null,
    poste_id: bc.poste_id ?? null,
    bc_parent_id: String(bc.id),
    date_a_valider: true,
  }
  if (Object.prototype.hasOwnProperty.call(bc, 'certificat_matiere_requis')) payload.certificat_matiere_requis = bc.certificat_matiere_requis === true
  return payload
}

/** Même BC de reliquat sans les colonnes de la migration 013 (cloud avant cloud-11). */
export function sansColonnesReliquat(payload: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...payload }
  for (const k of COLONNES_BC_RELIQUAT) delete out[k]
  return out
}

/**
 * pv_controle.observations. Garde le préfixe « Contrôleur : X — » (lu par deriverOriginePV, qualite.tsx)
 * puis un résumé. `complet` (base sans les colonnes 012) : ajoute tout le détail en texte, sinon perdu.
 * Un BC de sous-traitance est dit « Retour sous-traitant » : l'origine du PV s'affiche alors « BL Sous-traitant ».
 */
export function observationsPV(v: SaisiePV, ctx: { controleurNom: string; sousTraitance: boolean; complet: boolean }): string {
  const resume = [
    ctx.sousTraitance ? 'Retour sous-traitant' : null,
    v.resultat === 'conforme' ? 'Conforme' : 'Non conforme',
    v.lignes_non.length ? (v.lignes_non.length + ' ligne(s) en écart sur ' + v.lignes.length) : null,
    v.lignes.some(l => l.reliquat) ? (v.lignes.filter(l => l.reliquat).length + ' reliquat(s) annoncé(s)') : null,
    v.certificat_matiere === 'confirme' ? 'certificat matière confirmé' : (v.certificat_matiere === 'absent' ? 'certificat matière absent' : null),
  ].filter(Boolean).join(' · ')
  let s = 'Contrôleur : ' + (ctx.controleurNom || '—') + ' — ' + resume
  if (ctx.complet) {
    // Base sans la colonne `detail` : les quantités ligne par ligne ne sont gardées qu'ici.
    const det = [
      v.observation_generale,
      ...v.lignes.map(l => libelleLigne(l) + ' : reçu ' + nbFr(l.qte_recue) + (l.qte_prevue != null ? ' / prévu ' + nbFr(l.qte_prevue) : '')
        + (l.reliquat ? ' · reliquat ' + nbFr(l.qte_reliquat) : '') + (l.nature ? ' · ' + motifEcart(l) : '')),
      v.certificat_matiere === 'absent' ? MSG_CERTIFICAT_ABSENT : null,
      // Relu par recalculerStatutBc (quarantainesAttenduesObservations) : sans `detail`, une réception non conforme purement
      // quantitative (aucune quarantaine) ne serait jamais « tranchée » et le BC resterait reçu pour toujours.
      v.resultat === 'non_conforme' ? MARQUE_QUARANTAINES_ATTENDUES + v.quarantaines_attendues + ']' : null,
    ].filter(x => x != null && String(x).trim() !== '').join('\n')
    if (det) s += '\n' + det
  }
  return s
}

/** Repère écrit dans pv_controle.observations quand la base n'a pas `detail` (cloud avant cloud-10). */
export const MARQUE_QUARANTAINES_ATTENDUES = '[Quarantaines attendues : '
/** Nombre de quarantaines annoncé par un PV sans `detail` (repère des observations), null si absent. */
export function quarantainesAttenduesObservations(obs: unknown): number | null {
  const m = String(obs ?? '').match(/\[Quarantaines attendues : (\d+)\]/)
  return m ? Number(m[1]) : null
}

/** Même ligne sans les colonnes de la migration 012 (base cloud avant cloud-10). */
export function sansColonnesPV(payload: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...payload }
  for (const k of COLONNES_PV_012) delete out[k]
  return out
}
