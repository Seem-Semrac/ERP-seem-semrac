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
//   · Non conforme : une réponse Oui / Non par ligne du BC (lignes relues par le SERVEUR avec
//     lignesBc : le client n'envoie que {idx, conforme, observation}) ; observation obligatoire sur
//     chaque « Non » ; au moins un « Non » OU le certificat exigé absent ; observation générale
//     facultative ; gravité de la NC (défaut Majeure).
//   · Contrôleur : un salarié ACTIF ayant l'écriture sur les Expéditions (même règle que canAccess :
//     direction `all`, rôle logistique, jeton `ecrire:expeditions`). Le compte de secours (BOOTSTRAP)
//     n'a pas de fiche salarié : il peut enregistrer, pas être choisi.
//   · Les valeurs de statut / decision / anomalie / nc_ouverte de pv_controle NE CHANGENT PAS
//     (contraintes CHECK du cloud).
// ══════════════════════════════════════════════════════════════
import type { LigneBc } from './reception'
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

/** Une ligne du BC telle que contrôlée : la ligne relue par le serveur + la réponse. */
export interface LignePV extends LigneBc {
  /** true = « Oui » (pas de problème). */
  conforme: boolean
  /** Observation (obligatoire si « Non », null sinon). */
  observation: string | null
}

export interface SaisiePV {
  resultat: ResultatPV
  /** Valeur de pv_controle.anomalie (true = non conforme). */
  anomalie: boolean
  controleur_id: string
  certificat: { requis: boolean; confirme: boolean | null }
  certificat_matiere: CertificatMatiere
  /** Toutes les lignes du BC (conformes implicitement si le PV est conforme). */
  lignes: LignePV[]
  /** Les lignes en « Non ». */
  lignes_non: LignePV[]
  observation_generale: string | null
  /** Gravité de la NC (null si conforme). */
  gravite: string | null
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
 * Valide la saisie du PV contre les lignes RELUES du BC (`lignesBc(bc)`) et l'exigence de certificat
 * (`certificatRequis(bc)`). Le premier défaut est rendu (400 + champ, + idx pour une ligne).
 * Ne juge PAS l'éligibilité du contrôleur (lecture des salariés : faite par la route, 403).
 */
export function validerSaisiePV(body: any, ctx: { lignes: LigneBc[]; certificatRequis: boolean }): ResultatSaisiePV {
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

  if (resultat === 'conforme') {
    if (requis && !confirme) {
      return ko('certificat_confirme', 'Le bon de commande exige un certificat matière : cochez « Certificat matière reçu et conforme ». '
        + 'S’il est absent ou non conforme, le PV est non conforme.')
    }
    const lignes = lignesBcRelues.map(l => ({ ...l, conforme: true, observation: null }))
    return { ok: true, valeurs: { resultat, anomalie: false, controleur_id: ctrl, certificat, certificat_matiere, lignes, lignes_non: [], observation_generale: null, gravite: null } }
  }

  // ── Non conforme ──
  if (!Array.isArray(b.lignes)) return ko('lignes', 'Non conforme : répondez Oui ou Non pour chaque ligne du bon de commande.')
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
  const lignes: LignePV[] = []
  for (const l of lignesBcRelues) {
    const r = reponses.get(l.idx)
    const c = r ? parseBooleen(r.conforme) : null
    if (c == null) return ko('lignes', 'Ligne ' + (l.idx + 1) + ' : répondez Oui (pas de problème) ou Non.', l.idx)
    let observation: string | null = null
    if (!c) {
      observation = texteLibre(r.observation, true)
      if (!observation) return ko('lignes', 'Ligne ' + (l.idx + 1) + ' en « Non » : l’observation est obligatoire.', l.idx)
      if (observation.length > OBS_LIGNE_MAX) return ko('lignes', 'Ligne ' + (l.idx + 1) + ' : observation trop longue (' + OBS_LIGNE_MAX + ' caractères maximum).', l.idx)
    }
    lignes.push({ ...l, conforme: c, observation })
  }
  const lignes_non = lignes.filter(l => !l.conforme)
  if (!lignes_non.length && certificat_matiere !== 'absent') {
    return ko('lignes', 'Non conforme : indiquez au moins une ligne en « Non »'
      + (requis ? ' (ou laissez « Certificat matière reçu et conforme » décoché s’il est absent)' : '')
      + '. Sans écart, le PV est conforme.')
  }
  const observation_generale = texteLibre(b.observation_generale, true)
  if (observation_generale && observation_generale.length > OBS_GENERALE_MAX) {
    return ko('observation_generale', 'Observation générale trop longue (' + OBS_GENERALE_MAX + ' caractères maximum).')
  }
  const gSaisie = texteLibre(b.gravite)
  const gravite = gSaisie ? GRAVITES_NC.find(g => g.toLowerCase() === gSaisie.toLowerCase()) : GRAVITE_DEFAUT
  if (!gravite) return ko('gravite', 'Gravité inconnue : choisissez ' + GRAVITES_NC.join(', ') + '.')

  return { ok: true, valeurs: { resultat, anomalie: true, controleur_id: ctrl, certificat, certificat_matiere, lignes, lignes_non, observation_generale, gravite } }
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

/** Contenu de pv_controle.detail (jsonb, version 1). */
export function construireDetailPV(p: {
  valeurs: SaisiePV; bc: any; bl: any | null; affaires: string[]
  controleur: { id: string; nom: string }; saisiPar: { id: string; nom: string } | null; date: string; numPv: string
}): Record<string, any> {
  const { valeurs: v, bc, bl } = p
  return {
    v: 1,
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
    })),
    observation_generale: v.observation_generale,
    gravite: v.gravite,
    certificat: { requis: v.certificat.requis, confirme: v.certificat.confirme },
    controleur: { id: p.controleur.id, nom: p.controleur.nom },
    saisi_par: p.saisiPar,
  }
}

/** Description de la NC : observation générale, puis une ligne par « Non », certificat absent, contrôleur. */
export function descriptionNcPV(v: SaisiePV, controleurNom: string): string {
  return [
    v.observation_generale,
    ...v.lignes_non.map(l => libelleLigne(l) + ' : ' + (l.observation || '')),
    v.certificat_matiere === 'absent' ? MSG_CERTIFICAT_ABSENT : null,
    controleurNom ? 'Contrôleur : ' + controleurNom : null,
  ].filter(x => x != null && String(x).trim() !== '').join('\n')
}

/** Champs propres au PV sur la NC de réception (le reste — id, type, lot, fournisseur… — est posé par la route). */
export function champsNcPV(v: SaisiePV, ctx: { controleurNom: string; qteBl: unknown }): {
  description: string; ref_article: string | null; designation: string | null; nb_pieces: number | null; detecteur: string; gravite: string
} {
  const seule = v.lignes_non.length === 1 ? v.lignes_non[0] : null
  return {
    description: descriptionNcPV(v, ctx.controleurNom),
    ref_article: seule ? seule.reference : null,
    designation: seule ? seule.designation : null,
    nb_pieces: quantiteOuNull(ctx.qteBl),
    detecteur: DETECTEUR_RECEPTION,
    gravite: v.gravite || GRAVITE_DEFAUT,
  }
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
    v.certificat_matiere === 'confirme' ? 'certificat matière confirmé' : (v.certificat_matiere === 'absent' ? 'certificat matière absent' : null),
  ].filter(Boolean).join(' · ')
  let s = 'Contrôleur : ' + (ctx.controleurNom || '—') + ' — ' + resume
  if (ctx.complet && v.resultat === 'non_conforme') {
    const det = [
      v.observation_generale,
      ...v.lignes_non.map(l => libelleLigne(l) + ' : ' + (l.observation || '')),
      v.certificat_matiere === 'absent' ? MSG_CERTIFICAT_ABSENT : null,
    ].filter(x => x != null && String(x).trim() !== '').join('\n')
    if (det) s += '\n' + det
  }
  return s
}

/** Même ligne sans les colonnes de la migration 012 (base cloud avant cloud-10). */
export function sansColonnesPV(payload: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...payload }
  for (const k of COLONNES_PV_012) delete out[k]
  return out
}
