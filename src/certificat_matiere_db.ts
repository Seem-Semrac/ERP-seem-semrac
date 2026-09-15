// ══════════════════════════════════════════════════════════════
// CERTIFICAT MATIÈRE — lectures / écriture STRICTES (logique pure : ./certificat_matiere.ts)
//
// ⚠ supabase-js ne lève jamais : il renvoie { data: null, error }. Chaque fonction remonte donc
//   l'échec au lieu de le confondre avec « absent » : un BC illisible n'est pas un BC introuvable,
//   et une lecture des PV en panne n'est surtout pas « aucun PV conforme » (la bascule passerait).
// ══════════════════════════════════════════════════════════════
import { supabase } from './db'
import { COL_CERTIFICAT, pvReceptionConforme } from './certificat_matiere'

// Un bon de commande par id, en select * (la présence de la clé dit si la colonne existe).
export async function lireBcStrict(id: string): Promise<{ data: any | null; error: string | null }> {
  const { data, error } = await supabase.from('bons_de_commande').select('*').eq('id', id).maybeSingle()
  if (error) return { data: null, error: error.message || 'lecture du bon de commande impossible' }
  return { data: data ?? null, error: null }
}

// PV de RÉCEPTION d'un bon de commande (tous résultats confondus).
export async function lirePvReceptionDuBcStrict(bcId: string): Promise<{ data: any[] | null; error: string | null }> {
  const { data, error } = await supabase.from('pv_controle').select('*').eq('bc_id', bcId).eq('type_controle', 'reception')
  if (error || !Array.isArray(data)) return { data: null, error: error?.message || 'lecture des PV de réception impossible' }
  return { data, error: null }
}

// Ensemble des bc_id ayant déjà un PV de réception conforme (page Achats : verrou d'affichage).
// Colonnes plates seulement (pas `detail`, absente avant la migration 012) : statut/decision/anomalie
// suffisent, leurs valeurs n'ont pas changé. En cas d'échec : `null` (l'écran ne verrouille rien,
// le serveur reste l'autorité et refusera la bascule).
export async function bcIdsAvecPvReceptionConforme(): Promise<{ data: Set<string> | null; error: string | null }> {
  const { data, error } = await supabase.from('pv_controle').select('bc_id,type_controle,anomalie,decision,statut').eq('type_controle', 'reception')
  if (error || !Array.isArray(data)) return { data: null, error: error?.message || 'lecture des PV de réception impossible' }
  const s = new Set<string>()
  for (const p of data as any[]) if (p && p.bc_id && pvReceptionConforme(p)) s.add(String(p.bc_id))
  return { data: s, error: null }
}

// Pose / retire l'exigence. L'update RELIT la ligne (select) : une écriture sans effet (RLS qui
// filtre sans erreur) se voit, au lieu d'annoncer un succès qui n'a pas eu lieu.
export async function ecrireCertificatRequis(id: string, requis: boolean): Promise<{ data: any | null; error: any | null }> {
  const { data, error } = await supabase.from('bons_de_commande').update({ [COL_CERTIFICAT]: requis }).eq('id', id).select('*')
  if (error) return { data: null, error }
  const row = Array.isArray(data) ? data[0] : null
  if (!row) return { data: null, error: { code: 'NO_ROW', message: 'Aucune ligne modifiée (bon de commande absent ou écriture refusée par la base).' } }
  return { data: row, error: null }
}
