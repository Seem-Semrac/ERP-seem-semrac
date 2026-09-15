// ══════════════════════════════════════════════════════════════
// SOLDAGE D'UN BON DE TRAVAIL (BDT) — règles PURES (ni base, ni DOM)
// Utilisées par POST /api/production/bdt/:id/solder (src/index.tsx).
//
// Demande (15/09/2026) : « Seules les personnes habilitées à écrire dans la production ou
// l'opérateur ayant reçu le BDT peuvent le solder. Pour le moment ça bug, personne ne peut le
// faire, il annonce un problème dans la matrice des compétences. »
//
// Cause du blocage (reproduite sur la base Docker) :
//   · la matrice RH › Compétences enregistre `competences_operateur.operation` = IDENTIFIANT du
//     process (`proc-man-s1`, `PROC-2026-018`…), alors que l'ancien contrôle comparait le LIBELLÉ
//     d'opération du BDT (« Ebavurage / Finition SEEM ») : aucune égalité possible, donc tout
//     opérateur ayant au moins une ligne dans la matrice (20 opérateurs sur 22) était refusé ;
//   · le signataire était cherché avec verifyOperateurPin (est_operateur = true) : un chef de
//     production (fiche non opérateur) obtenait « Matricule ou code PIN incorrect ».
//
// Règles :
//   · Le signataire s'identifie par matricule + PIN : tout salarié ACTIF (verifySalariePin).
//   · Il peut solder SI (b) il a l'ÉCRITURE sur la Production (droits vivants de sa fiche, calculés
//     comme au login : sessionDeSalarie + peutEcrireService) OU (a) il est l'opérateur qui a REÇU
//     ce BDT (bons_de_travail.operateur_id, posé par /recu).
//   · Garde OAS conservée sur la voie (a) seulement : une fiche sans l'autorisation FONCTIONNELLE `soldage`
//     (opérateur OAS pur : autocontrôle et passage de lots) ne solde pas, même si elle a reçu le bon. Les
//     jetons d'accès lire:/ecrire: ne comptent pas : une fiche qui n'a qu'eux vit sur les autorisations de
//     ses rôles (autorisationsFonctionnelles). Les étapes OAS ne génèrent pas de BDT ; la voie (b) reste
//     ouverte à qui écrit en Production.
//   · La matrice de compétences NE BLOQUE PLUS : elle ne produit qu'un avertissement non bloquant.
// Le compte de secours (BOOTSTRAP) n'a pas de fiche salarié : il ne peut pas signer un soldage.
// ══════════════════════════════════════════════════════════════
import { peutEcrireService } from './auth'
import { sessionDeSalarie } from './pv_reception'

export const MSG_SOLDAGE_RESERVE = 'Seuls l’opérateur qui a reçu ce BDT ou une personne habilitée à écrire en Production peuvent le solder.'

export type VoieSoldage = 'ecriture_production' | 'operateur_recu'
export type DecisionSoldage = { ok: true; voie: VoieSoldage } | { ok: false; error: string }

/** Nom lisible d'un salarié (prénom nom, sinon matricule, sinon id). */
export function nomSalarie(s: any): string {
  const n = [s?.prenom, s?.nom].map(x => String(x ?? '').trim()).filter(Boolean).join(' ')
  return n || String(s?.matricule ?? s?.id ?? '')
}

/**
 * Le signataire (ligne `salaries` vérifiée par matricule + PIN) peut-il solder ce BDT (ligne lue en base) ?
 * `permsParDefaut` = autorisationsUnion côté serveur (autorisations des rôles quand la fiche n'en porte pas).
 */
export function droitSoldageBDT(signataire: any, bdt: any, permsParDefaut: (roles: string[]) => string[]): DecisionSoldage {
  if (!signataire || typeof signataire !== 'object' || !bdt || typeof bdt !== 'object') return { ok: false, error: MSG_SOLDAGE_RESERVE }
  const u = sessionDeSalarie(signataire, permsParDefaut)
  if (peutEcrireService(u, 'production')) return { ok: true, voie: 'ecriture_production' }
  const recuPar = String(bdt.operateur_id ?? '').trim()
  const sigId = String(signataire.id ?? '').trim()
  if (recuPar && sigId && recuPar === sigId) {
    const roles: string[] = Array.isArray(u.roles) ? u.roles : []
    const fonct = autorisationsFonctionnelles(signataire, roles, permsParDefaut)
    if (!fonct.includes('soldage') && !fonct.includes('all')) {
      const oas = roles.map(r => String(r).toLowerCase()).includes('oas')
      return { ok: false, error: nomSalarie(signataire) + ' a reçu ce BDT, mais sa fiche ne comporte pas le soldage'
        + (oas ? ' (opérateur OAS : autocontrôle et passage de lots uniquement)' : ' (autorisations de la fiche salarié, RH)')
        + '. Faites solder par une personne habilitée à écrire en Production.' }
    }
    return { ok: true, voie: 'operateur_recu' }
  }
  return { ok: false, error: MSG_SOLDAGE_RESERVE }
}

/**
 * Autorisations FONCTIONNELLES de la fiche (soldage, pointage, oas…), jetons d'accès par service (lire:/ecrire:) exclus.
 * Une fiche sans autorisation fonctionnelle — liste vide, ou seulement des jetons d'accès (cas d'une fiche ancienne
 * dont on a coché des accès dans la RH) — vit sur les autorisations de ses rôles. Sans ce repli, un opérateur dont
 * la fiche ne porte que « lire:production » était refusé au soldage du BDT qu'il avait reçu, avec un faux motif « OAS ».
 */
export function autorisationsFonctionnelles(signataire: any, roles: string[], permsParDefaut: (roles: string[]) => string[]): string[] {
  const propres = (Array.isArray(signataire?.autorisations) ? signataire.autorisations : [])
    .map((p: any) => String(p ?? '').trim())
    .filter((p: string) => p && !/^(lire|ecrire):/.test(p))
  return propres.length ? propres : permsParDefaut(roles)
}

/**
 * Avertissement NON BLOQUANT de la matrice de compétences pour l'opérateur qui a réalisé le BDT.
 * La matrice est indexée par identifiant de process (clé actuelle) ; l'ancien libellé d'opération est
 * aussi accepté. Aucune ligne pour cet opérateur = matrice non renseignée = rien à signaler.
 */
export function avertissementCompetence(comps: any[] | null | undefined, operateurId: string, operateurNom: string, bdt: any): string | null {
  const opId = String(operateurId ?? '').trim()
  if (!Array.isArray(comps) || !opId || !bdt) return null
  const norm = (s: any) => String(s ?? '').toLowerCase().trim()
  const siennes = comps.filter(cp => cp && String(cp.salarie_id ?? cp.employe_id ?? '').trim() === opId)
  if (!siennes.length) return null
  const cles = new Set([norm(bdt.process_id), norm(bdt.operation)].filter(Boolean))
  if (!cles.size) return null
  const maitrise = siennes.some(cp => cles.has(norm(cp.operation)) && Number(cp.niveau || 0) >= 1)
  if (maitrise) return null
  return 'Matrice de compétences : ' + (operateurNom || opId) + ' n’a pas de niveau renseigné pour ce process. Soldage enregistré ; pensez à mettre la matrice à jour (RH › Compétences).'
}

/** Heure de fin réelle « HH:MM » valide, sinon null. */
export function heureFinValide(v: unknown): string | null {
  const s = String(v ?? '').trim().slice(0, 5)
  const m = /^(\d{2}):(\d{2})$/.exec(s)
  if (!m) return null
  return Number(m[1]) <= 23 && Number(m[2]) <= 59 ? s : null
}
