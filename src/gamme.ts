// ═══════════════════════════════════════════════════════════════════════════
// LA GAMME D'UN LOT — l'ordre des opérations, et ce qu'il autorise
// ═══════════════════════════════════════════════════════════════════════════
// Règle métier arrêtée le 10/09/2026 :
//
//   « Les BDT et BST (ou BDS) d'un lot doivent être tous disponibles à la
//     programmation à partir du moment où la commande est arrivée. Mais pour
//     envoyer le BST au sous-traitant, il faut que le BDT juste avant soit soldé. »
//
// Deux choses distinctes, qu'on confondait :
//   · PROGRAMMER, c'est poser du travail sur un calendrier. On le fait à l'avance,
//     et justement AVANT que la matière soit là — sinon on ne voit pas venir la
//     charge. Rien ne doit donc être caché du planning.
//   · ENVOYER chez le sous-traitant, c'est un mouvement physique. Là, l'ordre de
//     la gamme s'impose : on n'expédie pas une pièce dont l'opération précédente
//     n'est pas finie, il n'y aurait rien à mettre dans le carton.
//
// La gamme d'un lot est la FUSION des bons de travail et des bons de sous-traitance,
// triée par `seq` — la colonne existe sur les deux tables, écrite par la cascade.

const nb = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }
const txt = (v: any) => String(v ?? '').trim()

/** Rattachement d'une ligne à son lot. Les deux colonnes coexistent selon l'origine
 *  (la cascade n'écrit que `lot_ref`, le planning écrit `lot_id`). */
export const cleLot = (op: any) => txt(op?.lot_id) || txt(op?.lot_ref)

/** Une opération annulée n'est plus dans la gamme : on l'enjambe. */
const estAnnulee = (op: any) => /^annul/i.test(txt(op?.statut))

/**
 * Cette opération est-elle SOLDÉE, au sens « il n'y a plus rien à y faire » ?
 *   · un BDT est soldé par l'atelier (`statut: 'solde'`, cf. /api/production/bdt/:id/solder) ;
 *   · un BDS est fini quand les pièces sont REVENUES du sous-traitant — la date de
 *     retour effective fait foi, le statut peut traîner.
 */
export function opSoldee(op: any): boolean {
  if (!op) return false
  if (txt(op.date_retour_effective)) return true
  return ['solde', 'soldé', 'termine', 'terminé', 'cloture', 'clôture', 'recu', 'reçu', 'fini']
    .includes(txt(op.statut).toLowerCase())
}

/** La gamme du lot, dans l'ordre : `seq` d'abord, puis l'identifiant pour départager. */
export function gammeDuLot(ops: any[]): any[] {
  return [...(ops || [])].sort((a, b) => {
    const sa = a?.seq == null ? 9999 : nb(a.seq), sb = b?.seq == null ? 9999 : nb(b.seq)
    return sa !== sb ? sa - sb : txt(a?.id).localeCompare(txt(b?.id))
  })
}

/** L'opération JUSTE AVANT `cible` dans la gamme, les annulées enjambées. */
export function etapePrecedente(cible: any, opsDuLot: any[]): any | null {
  const tri = gammeDuLot(opsDuLot)
  const i = tri.findIndex((o) => txt(o?.id) === txt(cible?.id))
  if (i < 0) return null
  for (let j = i - 1; j >= 0; j--) if (!estAnnulee(tri[j])) return tri[j]
  return null
}

/**
 * Peut-on envoyer ce BDS chez le sous-traitant ? Rend `null` si oui, sinon la raison,
 * rédigée pour être affichée telle quelle à l'expéditionnaire.
 *
 * `opsDuLot` = TOUTES les opérations du lot, BDT et BDS confondus.
 * Un BDS en tête de gamme (rien avant lui) part librement : c'est le cas d'un
 * traitement de surface sur matière brute.
 */
export function bdsEnvoiBlocage(bds: any, opsDuLot: any[]): string | null {
  if (!bds) return null
  const prec = etapePrecedente(bds, opsDuLot)
  if (!prec) return null
  if (opSoldee(prec)) return null
  const quoi = txt(prec.id) || 'l\u2019op\u00e9ration pr\u00e9c\u00e9dente'
  const lib = txt(prec.operation)
  return `${quoi}${lib ? ' (' + lib + ')' : ''} n\u2019est pas sold\u00e9`
}

/**
 * Le blocage d'envoi de CHAQUE BDS, indexé par son id.
 * Regroupe d'abord par lot : deux lots différents n'ont rien à s'imposer.
 */
export function blocagesEnvoiBds(bdsRows: any[], bdtRows: any[]): Record<string, string> {
  const parLot = new Map<string, any[]>()
  const ranger = (op: any) => {
    const k = cleLot(op); if (!k) return
    if (!parLot.has(k)) parLot.set(k, [])
    parLot.get(k)!.push(op)
  }
  for (const b of (bdtRows || [])) ranger(b)
  for (const s of (bdsRows || [])) ranger(s)

  const out: Record<string, string> = {}
  for (const s of (bdsRows || [])) {
    if (estAnnulee(s)) continue
    if (opSoldee(s)) continue                       // déjà revenu : plus rien à envoyer
    const k = cleLot(s)
    // Un BDS sans lot n'a pas de gamme à respecter : on ne l'invente pas.
    const raison = k ? bdsEnvoiBlocage(s, parLot.get(k) || []) : null
    if (raison) out[txt(s.id)] = raison
  }
  return out
}
