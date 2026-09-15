// ══════════════════════════════════════════════════════════════
// CERTIFICAT MATIÈRE — exigence portée par le BON DE COMMANDE (Lot D, décision 4, 14/09/2026)
//
// L'acheteur décide, à la création du BC (DA → BC ou BC direct) ou plus tard depuis
// Achats › Bons de commande, que le fournisseur doit joindre un certificat matière.
// Cette exigence est :
//   · imprimée sur le PDF du BC (le fournisseur est prévenu) ;
//   · relue au PV de réception (Expéditions) : si elle est posée, « Conforme » exige la case
//     « Certificat matière reçu et conforme ».
//
// Colonne : bons_de_commande.certificat_matiere_requis (boolean) — migration 012 / cloud-10.
// ⚠ Tant que la colonne n'existe pas (base cloud avant cloud-10), une ligne lue en `select *`
//   n'a tout simplement pas la propriété : elle vaut « non requis ». Une écriture qui la porte
//   est refusée par PostgREST (PGRST204) ou Postgres (42703) : on réessaie sans elle et on
//   AVERTIT — une exigence cochée puis silencieusement perdue serait pire qu'un refus.
//
// Module PUR (aucun import) : testé seul (scratchpad lotd/test_certificat.mjs).
// ══════════════════════════════════════════════════════════════

export const COL_CERTIFICAT = 'certificat_matiere_requis'

// Message renvoyé quand l'exigence n'a pas pu être enregistrée faute de colonne.
export const AVERT_CLOUD10 = 'Certificat matière NON enregistré sur le bon de commande : la colonne bons_de_commande.certificat_matiere_requis n\'existe pas encore sur cette base. Jouez docker/db/cloud/cloud-10 (Studio Supabase en ligne, SQL Editor) — ou erp-docker.sh maj sur la VM — puis cochez à nouveau l\'exigence depuis Achats › Bons de commande.'

// Booléen reçu d'un client JSON. `null` = valeur non reconnue (à refuser quand la valeur est
// obligatoire). On n'accepte PAS n'importe quelle chaîne non vide comme « vrai » : « non » ou
// « false » en texte doivent rester faux.
export function parseBooleen(v: unknown): boolean | null {
  if (v === true || v === false) return v
  if (v === 1 || v === 0) return v === 1
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['true', '1', 'oui', 'on', 'yes'].includes(s)) return true
    if (['false', '0', 'non', 'off', 'no'].includes(s)) return false
  }
  return null
}

// Valeur à écrire à la CRÉATION d'un BC : absent ou illisible = non requis.
export function certificatDemande(v: unknown): boolean {
  return parseBooleen(v) === true
}

// Le BC lu en base exige-t-il un certificat ? Colonne absente, null ou false → non.
export function certificatRequis(bc: any): boolean {
  if (!bc || typeof bc !== 'object') return false
  const v = (bc as any)[COL_CERTIFICAT]
  return v === true || v === 'true' || v === 't'
}

// La ligne lue en `select *` porte-t-elle la colonne ? (false = base sans migration 012/cloud-10)
export function colonneCertificatPresente(bc: any): boolean {
  return !!bc && typeof bc === 'object' && Object.prototype.hasOwnProperty.call(bc, COL_CERTIFICAT)
}

// Erreur Supabase = colonne certificat inconnue de la base ? PGRST204 = inconnue du cache PostgREST,
// 42703 = inexistante. On exige AUSSI le nom de la colonne : une autre colonne manquante ne doit pas
// déclencher un réessai qui retirerait l'exigence pour rien.
export function colCertificatAbsente(err: any): boolean {
  if (!err) return false
  const code = String(err.code || '')
  const msg = String(err.message || '') + ' ' + String(err.details || '') + ' ' + String(err.hint || '')
  return (code === 'PGRST204' || code === '42703') && msg.toLowerCase().includes(COL_CERTIFICAT)
}

// PV de RÉCEPTION CONFORME ? Valeurs de pv_controle inchangées par le Lot D (CHECK cloud) :
//   conforme     → statut 'valide',     decision 'libere', anomalie false
//   non conforme → statut 'nc_ouverte', decision 'bloque', anomalie true
// Si le détail jsonb (migration 012) est présent et dit « non_conforme », il l'emporte.
export function pvReceptionConforme(pv: any): boolean {
  if (!pv || typeof pv !== 'object') return false
  if (String(pv.type_controle || '') !== 'reception') return false
  let detail: any = pv.detail
  if (typeof detail === 'string') { try { detail = JSON.parse(detail) } catch { detail = null } }
  if (detail && typeof detail === 'object' && typeof detail.resultat === 'string') {
    if (detail.resultat !== 'conforme') return false
  }
  const anomalie = pv.anomalie === true || pv.anomalie === 'true' || pv.anomalie === 't'
  return !anomalie && String(pv.decision || '') === 'libere'
}

// Premier PV de réception conforme d'un BC parmi une liste (tolère une liste non filtrée).
export function pvConformeDuBc(pvs: any[] | null | undefined, bcId: string): any | null {
  const id = String(bcId || '')
  if (!id || !Array.isArray(pvs)) return null
  return pvs.find(p => String(p?.bc_id || '') === id && pvReceptionConforme(p)) || null
}

// Décision de la bascule (route POST /api/achats/bc/:id/certificat-matiere), sans accès base.
//   bc        : la ligne lue en select * (null = introuvable)
//   pvsDuBc   : les PV du BC déjà lus (lecture STRICTE : une panne ne doit jamais arriver ici)
//   requis    : la valeur demandée (déjà validée par parseBooleen)
export type DecisionBascule =
  | { ok: true; inchange: boolean }
  | { ok: false; status: 404 | 409; error: string; needsMigration?: boolean; pv_id?: string | null }
export function deciderBascule(bc: any, pvsDuBc: any[], requis: boolean): DecisionBascule {
  if (!bc) return { ok: false, status: 404, error: 'Bon de commande introuvable.' }
  const num = String(bc.num_bc || bc.id || '')
  if (!colonneCertificatPresente(bc)) return { ok: false, status: 409, needsMigration: true, error: AVERT_CLOUD10 }
  if (String(bc.statut || '') === 'annule') return { ok: false, status: 409, error: 'Le bon de commande ' + num + ' est annulé : son exigence de certificat matière ne se modifie plus.' }
  if (certificatRequis(bc) === requis) return { ok: true, inchange: true }
  const pv = pvConformeDuBc(pvsDuBc, String(bc.id || ''))
  if (pv) {
    return {
      ok: false, status: 409, pv_id: pv.num_pv || pv.id || null,
      error: 'Le bon de commande ' + num + ' a déjà un PV de réception conforme (' + String(pv.num_pv || pv.id || '') + ') : la marchandise a été acceptée, l\'exigence de certificat matière ne se modifie plus.',
    }
  }
  return { ok: true, inchange: false }
}
