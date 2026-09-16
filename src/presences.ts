// ══════════════════════════════════════════════════════════════
// PRÉSENCES OPÉRATEUR — règles PURES (ni base, ni DOM), partagées par les routes
// /api/production/presence, la page /production/service (onglet Présence + planning) et la fiche RH.
// Testables sans rien démarrer (14/09/2026, lot C · C1/C2).
// ══════════════════════════════════════════════════════════════
import { SHIFTS } from './shared'

/** Les 4 créneaux de travail, dans l'ordre d'affichage : Matin · Journée · Après-midi · Soirée.
 *  Identifiants, libellés et couleurs viennent de SHIFTS (src/shared.ts). Identifiants historiques conservés.
 *  Horaires : depuis le lot G (16/09/2026), ceux de la CADENCE du site et du jour (src/cadence.ts) ; ceux de SHIFTS ne
 *  sont plus qu'un repli quand la cadence est illisible. Un créneau fermé ce jour-là est refusé à l'enregistrement. */
export const CRENEAUX = ['matin', 'journee', 'apmidi', 'soir'] as const

/** Valeurs acceptées pour une case de présence : un créneau, ou « absent ».
 *  Une case VIDE n'est pas une valeur : c'est l'absence de ligne (DELETE /api/production/presence). */
export const VALEURS_PRESENCE: readonly string[] = [...CRENEAUX, 'absent']

/** Fenêtre maximale acceptée par GET /api/production/presence (jours, bornes comprises). */
export const FENETRE_MAX_JOURS = 62

const RE_ISO = /^\d{4}-\d{2}-\d{2}$/

/** Date calendaire « AAAA-MM-JJ » réellement valide (le 2026-02-30 est refusé). */
export function estDateIso(s: unknown): s is string {
  if (typeof s !== 'string' || !RE_ISO.test(s)) return false
  const d = new Date(s + 'T00:00:00Z')
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

/** Décale une date ISO de n jours, en UTC (aucun effet de fuseau ni d'heure d'été). */
export function isoPlusJours(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Lundi de la semaine d'une date ISO (UTC, semaine du lundi au dimanche). */
export function lundiDe(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  return isoPlusJours(iso, -((d.getUTCDay() + 6) % 7))
}

/** Nombre de jours de from à to, bornes comprises (0 si to < from). */
export function nbJours(from: string, to: string): number {
  const n = Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000) + 1
  return n > 0 ? n : 0
}

const heure = (h: number) => `${((h % 24) + 24) % 24}h`

/** Horaires PAR DÉFAUT d'un créneau (SHIFTS) : « 6h-14h » ; « 22h-6h » pour la soirée (fin stockée 30 = 6h du lendemain).
 *  ⚠ Lot G (16/09/2026) : les horaires AFFICHÉS viennent de la cadence du site et du jour (src/cadence.ts,
 *  horairesCreneauSite). Ceux-ci ne servent plus que de repli quand la cadence est illisible (cloud sans cloud-12). */
export function horairesCreneau(id: string): string {
  const s = SHIFTS[id]
  return s ? `${heure(s.start)}-${heure(s.end)}` : ''
}

/** Libellé d'un créneau : « Matin », « Soirée »… (identifiant inconnu : rendu tel quel). Sans horaires depuis le lot G :
 *  ils dépendent du site et du jour (cadence usine) — voir horairesCreneauSite dans src/cadence.ts. */
export function libelleCreneau(id: string): string {
  const s = SHIFTS[id]
  return s ? s.label : id
}

/** Couleur de TEXTE d'un créneau : la teinte SHIFTS foncée. La couleur SHIFTS brute écrite sur son propre fond pâle (ou
 *  sur blanc) tombait sous le contraste AA de 4,5:1 pour du texte de 11 px (« Journée » #10b981 : 2,3:1). */
const TEXTE_CRENEAU: Record<string, string> = { matin: '#1d4ed8', journee: '#047857', apmidi: '#6d28d9', soir: '#0f172a' }
export function couleurTexteCreneau(id: string): string {
  return TEXTE_CRENEAU[id] || '#334155'
}

/** Palette de l'onglet Présence : { id: [fond, texte, libellé, horaires] }, créneaux puis « absent ».
 *  Fond dérivé de la couleur SHIFTS (même teinte sur la grille et sur le planning), texte foncé lisible (couleurTexteCreneau).
 *  Horaires : '' depuis le lot G — le navigateur les calcule par site et par jour (cadHorairesCreneau, src/cadence_ui.ts). */
export function paletteCreneaux(): Record<string, [string, string, string, string]> {
  const out: Record<string, [string, string, string, string]> = {}
  for (const k of CRENEAUX) {
    const s = SHIFTS[k]
    const col = s ? s.color : '#64748b'
    out[k] = [col + '1f', couleurTexteCreneau(k), s ? s.label : k, '']
  }
  out.absent = ['#fef2f2', '#b91c1c', 'Absent', '']
  return out
}

export type CorpsPresence =
  | { ok: true; operateur_id: string; date_presence: string; shift: string }
  | { ok: false; error: string }

/** Contrôle du corps d'une écriture de présence.
 *  - `ecrire` (POST) : opérateur + date + créneau connu. Un créneau inconnu est REFUSÉ (avant : repli silencieux sur
 *    « journee », qui enregistrait autre chose que ce qui avait été cliqué).
 *  - `effacer` (DELETE) : opérateur + date. */
export function validerCorpsPresence(b: any, mode: 'ecrire' | 'effacer'): CorpsPresence {
  const op = b && b.operateur_id != null ? String(b.operateur_id).trim() : ''
  if (!op || op.length > 120) return { ok: false, error: 'operateur_id requis' }
  const date = b ? b.date_presence : undefined
  if (!estDateIso(date)) return { ok: false, error: 'date_presence requise au format AAAA-MM-JJ' }
  if (mode === 'effacer') return { ok: true, operateur_id: op, date_presence: date, shift: '' }
  const shift = b.shift == null ? '' : String(b.shift)
  if (!VALEURS_PRESENCE.includes(shift)) {
    return {
      ok: false,
      error: shift === ''
        ? 'Créneau manquant : attendu matin, journee, apmidi, soir ou absent (pour vider une case : DELETE /api/production/presence).'
        : `Créneau inconnu « ${shift.slice(0, 40)} » : attendu matin, journee, apmidi, soir ou absent.`,
    }
  }
  return { ok: true, operateur_id: op, date_presence: date, shift }
}

export type Fenetre = { ok: true; from: string; to: string } | { ok: false; error: string }

/** Fenêtre de lecture ?from=&to= : deux dates valides, from ≤ to, au plus FENETRE_MAX_JOURS jours. */
export function validerFenetre(from: unknown, to: unknown, maxJours = FENETRE_MAX_JOURS): Fenetre {
  if (!estDateIso(from) || !estDateIso(to)) return { ok: false, error: 'from et to requis au format AAAA-MM-JJ' }
  if (to < from) return { ok: false, error: 'to doit être postérieur ou égal à from' }
  if (nbJours(from, to) > maxJours) return { ok: false, error: `fenêtre trop large (${nbJours(from, to)} jours, maximum ${maxJours})` }
  return { ok: true, from, to }
}

/** Fenêtre LUE par la route /production/service : lundi de la semaine courante → +20 jours (3 semaines).
 *  Plus large que ce que la page déclare chargé (2 semaines, joursChargesPage) : si minuit du dimanche passe entre la
 *  lecture et le rendu, le lundi de la page avance de 7 jours et reste DANS la fenêtre lue. Une case déclarée chargée
 *  l'est donc toujours réellement — sinon un clic sur une case « vide » écraserait une vraie présence. */
export function fenetreChargementPresences(aujourdhui: string): { from: string; to: string } {
  const lundi = lundiDe(aujourdhui)
  return { from: lundi, to: isoPlusJours(lundi, 20) }
}

/** Jours que la page déclare chargés au rendu : semaine courante + suivante (⊆ fenetreChargementPresences). */
export function joursChargesPage(aujourdhui: string): string[] {
  const lundi = lundiDe(aujourdhui)
  return Array.from({ length: 14 }, (_, i) => isoPlusJours(lundi, i))
}

/** Message d'échec d'un upsert à clé composite. 42P10 = la base n'a pas l'index unique que `onConflict` exige
 *  (cas prouvé sur Docker/VM : operateur_presence n'avait que sa clé primaire). */
export function messageEchecUpsert(error: { code?: string; message?: string } | null | undefined, colonnes: string): { status: 400 | 500; error: string } {
  const detail = (error && error.message) || 'erreur inconnue'
  if (error && error.code === '42P10') {
    return {
      status: 500,
      error: `Enregistrement impossible : la base n'a pas d'index unique sur (${colonnes}). ` +
        `À appliquer : migration 010 (Docker/VM : erp-docker.sh maj) ou docker/db/cloud/cloud-8-index-uniques-upsert.sql (cloud). Détail : ${detail}`,
    }
  }
  return { status: 400, error: detail }
}
