// ══════════════════════════════════════════════════════════════
// CADENCE USINE — lectures / écritures STRICTES (logique pure : ./cadence.ts) — lot G · G1 (16/09/2026)
//
// ⚠ supabase-js ne lève jamais : il renvoie { data: null, error }. Chaque fonction distingue donc
//   · `absente` : la table n'existe pas (base cloud sans cloud-12, Docker/VM sans la migration 014) → repli toléré,
//     l'écran dit « jouez cloud-12 » et les horaires par défaut s'affichent ;
//   · `error`   : une PANNE (réseau, droits…) → jamais confondue avec « aucun modèle » (tout paraîtrait fermé).
// ══════════════════════════════════════════════════════════════
import { supabase } from './db'
import type { DonneesCadence, LigneCadenceSite, ModeleHoraire } from './cadence'

export type LectureCadence = { data: DonneesCadence | null; error: string | null; absente: boolean }
export type EcritureCadence = { data: any | null; error: string | null; code: string | null; absente: boolean }

const TABLES_CADENCE = ['horaires_modeles', 'cadence_site']

function tableAbsente(e: any): boolean {
  if (!e) return false
  if (e.code === '42P01' || e.code === 'PGRST205') return true
  const m = String(e.message || '')
  return TABLES_CADENCE.some(t => m.includes(t)) && !/column/i.test(m) && /(relation .*does not exist|could not find the table)/i.test(m)
}
const ecriture = (data: any, error: any): EcritureCadence => error
  ? { data: null, error: String(error.message || error.code || 'erreur inconnue'), code: error.code ?? null, absente: tableAbsente(error) }
  : { data: data ?? null, error: null, code: null, absente: false }

export const COLONNES_MODELE = 'id,niveau,jour_semaine,creneau,partie,debut,fin,actif,maj_le,maj_par'

// Lecture PAGINÉE (revue du 16/09/2026) : PostgREST plafonne une réponse à 1 000 lignes (PGRST_DB_MAX_ROWS, même valeur
// chez Supabase) sans erreur. cadence_site ne fait que grandir (ajout seul) : au-delà, les lignes les plus RÉCENTES
// disparaissaient et l'ancienne cadence restait « courante ». Pages de 1 000 dans un ordre total (tri + id), jusqu'à une
// page incomplète ; au-delà de PAGES_MAX pages, erreur (jamais un historique tronqué en silence).
const TAILLE_PAGE = 1000
const PAGES_MAX = 50
async function lireToutesLesLignes(construire: () => any): Promise<{ data: any[] | null; error: any }> {
  const out: any[] = []
  for (let page = 0; page < PAGES_MAX; page++) {
    const { data, error } = await construire().range(page * TAILLE_PAGE, (page + 1) * TAILLE_PAGE - 1)
    if (error) return { data: null, error }
    if (!Array.isArray(data)) return { data: null, error: { message: 'réponse vide' } }
    out.push(...data)
    if (data.length < TAILLE_PAGE) return { data: out, error: null }
  }
  return { data: null, error: { message: 'plus de ' + (PAGES_MAX * TAILLE_PAGE) + ' lignes : lecture interrompue' } }
}

/** Modèles d'horaires (toutes lignes, actives ou non) + historique complet des cadences par site. */
export async function lireDonneesCadence(): Promise<LectureCadence> {
  const [m, c] = await Promise.all([
    lireToutesLesLignes(() => supabase.from('horaires_modeles').select(COLONNES_MODELE).order('niveau').order('jour_semaine').order('creneau').order('partie').order('id')),
    // `*` : la colonne `effet` (date d'effet) peut manquer sur une base qui a joué une première version de 014 — la ligne
    // se lit alors avec le jour de `depuis` (src/cadence.ts jourEffetCadence) au lieu de tomber en panne.
    lireToutesLesLignes(() => supabase.from('cadence_site').select('*').order('depuis', { ascending: true }).order('id', { ascending: true })),
  ])
  if (m.error || c.error) {
    const absente = tableAbsente(m.error) || tableAbsente(c.error)
    const e: any = m.error || c.error
    return { data: null, error: String(e.message || e.code || 'lecture impossible'), absente }
  }
  if (!Array.isArray(m.data) || !Array.isArray(c.data)) return { data: null, error: 'réponse vide', absente: false }
  return { data: { modeles: m.data as ModeleHoraire[], cadences: c.data as LigneCadenceSite[] }, error: null, absente: false }
}

/** Nouvelle ligne d'historique de cadence (ajout seul), relue par le select. `effet` = jour d'effet (AAAA-MM-JJ). */
export async function insererCadenceSite(payload: { site: string; niveau: string; effet: string; par: string | null; motif: string | null }): Promise<EcritureCadence> {
  const { data, error } = await supabase.from('cadence_site').insert({ ...payload, depuis: new Date().toISOString() }).select('*').single()
  return ecriture(data, error)
}

/** Création d'une ligne de modèle. 23505 = une ligne (niveau, jour, créneau, partie) existe déjà (créée entre-temps). */
export async function insererModeleHoraire(payload: Record<string, any>): Promise<EcritureCadence> {
  const { data, error } = await supabase.from('horaires_modeles').insert(payload).select(COLONNES_MODELE).single()
  return ecriture(data, error)
}

/** Mise à jour CONDITIONNELLE d'une ligne de modèle : seulement si maj_le vaut encore celle lue. data = ligne relue, ou
 *  null si la condition n'a rien trouvé (modifiée entre-temps, ou refus silencieux des droits). */
export async function majModeleHoraireSi(id: string, majLeLu: string | null, patch: Record<string, any>): Promise<EcritureCadence> {
  let q = supabase.from('horaires_modeles').update(patch).eq('id', id)
  q = majLeLu == null ? q.is('maj_le', null) : q.eq('maj_le', majLeLu)
  const { data, error } = await q.select(COLONNES_MODELE)
  return ecriture(error ? null : (((data ?? []) as any[])[0] ?? null), error)
}
