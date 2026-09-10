// ══════════════════════════════════════════════════════════════
// ANNULATION DE COMMANDE — le moteur (lot L1)
// ══════════════════════════════════════════════════════════════
// Volontairement PUR : aucune lecture Supabase, aucun effet de bord. On lui donne
// l'état du monde, il rend l'inventaire de ce qui serait annulé et le chiffrage.
//
// Pourquoi pur : c'est le calcul qui décide combien un client va payer sur une
// commande interrompue. Il doit être rejouable à l'identique, testable sans base,
// et lisible par quelqu'un qui conteste le montant.
//
// La règle métier, actée avec l'exploitant le 10/09/2026 :
//
//   ÉTAT DU BON DE COMMANDE                          LE CLIENT DOIT
//   pas encore validé par le fournisseur             0
//   validé, en route — le fournisseur ACCEPTE        0
//   validé, en route — le fournisseur REFUSE         matière + marge
//   déjà reçu                                        matière + marge
//
//   Une étape de fabrication ENTAMÉE est due EN ENTIER (pas de prorata).
//   La préparation technique À FAIRE disparaît ; celle DÉJÀ FAITE est conservée.

import { estAnnule } from './shared'

// ─── Vocabulaire des états ────────────────────────────────────
/** Un BC dont la marchandise est arrivée : la matière est là, elle se facture. */
const BC_RECU = ['recu', 'recu_total', 'recu_partiel', 'receptionne', 'controle', 'cloture']

/** Étapes pas encore engagées : rien n'est dû dessus. */
const OP_NON_ENTAMEE = ['a_programmer', 'programme', 'a_planifier', 'planifie', 'en_attente', 'a_envoyer']

export type ReponseFournisseur = 'accepte' | 'refuse' | null

export type EtatBc =
  | 'annulable'          // pas encore validé par le fournisseur → on annule, le client ne doit rien
  | 'question'           // validé et parti → il faut demander au fournisseur
  | 'refus_fournisseur'  // il a refusé → la matière est due
  | 'recu'               // déjà arrivé → la matière est due

export interface OptionsAnnulation {
  /** Lots à annuler. Vide ou absent = TOUTE la commande. */
  lots?: string[]
  /** Taux de marque à appliquer, en %, proposé d'après le tableau de prix de l'offre. */
  margePct?: number
  /** Réponse du fournisseur, par identifiant de BC, pour ceux qui sont partis. */
  reponses?: Record<string, ReponseFournisseur>
  /** Destination de la matière refacturée. Sans effet sur le montant : le client paie dans les trois cas. */
  destinationMatiere?: 'chez_nous' | 'retour_client' | 'rebut'
}

export interface ContexteAnnulation {
  commande: any
  offre?: any | null
  lots: any[]
  bdts: any[]
  bds: any[]
  das: any[]
  bcs: any[]
  prepas: any[]
  /** (machineId, operateurId, activite) → € par heure. Fournis par computeAtelierRates. */
  tauxMachine?: (machineId: any) => number
  tauxMo?: (operateurId: any, activite: any) => number
}

const nb = (v: any) => { const n = Number(v); return isFinite(n) ? n : 0 }
const txt = (v: any) => String(v ?? '').trim()
const cle = (v: any) => txt(v).toLowerCase()

/** Une étape (BDT ou BDS) a-t-elle été entamée ? Si oui, elle est due EN ENTIER. */
export function opEntamee(op: any): boolean {
  if (!op) return false
  if (nb(op.temps_reel) > 0) return true
  if (txt(op.debut_reel)) return true
  if (txt(op.date_retour_effective)) return true          // BDS revenu de sous-traitance
  const s = cle(op.statut)
  if (!s) return false
  return !OP_NON_ENTAMEE.includes(s)
}

/** Rattachement d'une ligne à un lot : les deux champs coexistent selon l'origine. */
const lotDe = (op: any) => txt(op?.lot_id) || txt(op?.lot_ref)

/**
 * L'étape EN COURS d'un lot : la gamme est la fusion BDT + BDS, triée par `seq`.
 * C'est la dernière étape entamée — celle dont le travail est dû en entier.
 * Aucune fonction du dépôt ne le faisait avant ce lot.
 */
export function etapeEnCours(ops: any[]): any | null {
  const tri = [...ops].sort((a, b) => (a.seq == null ? 9999 : nb(a.seq)) - (b.seq == null ? 9999 : nb(b.seq)))
  let derniere: any = null
  for (const op of tri) if (opEntamee(op)) derniere = op
  return derniere
}

/** Coût d'une étape, temps ALLOUÉ × taux (machine + main-d'œuvre). */
function coutOp(op: any, ctx: ContexteAnnulation): number {
  const heures = nb(op.temps_alloue) || nb(op.duree) || 0
  if (heures <= 0) return 0
  const tm = op.machine_id && ctx.tauxMachine ? nb(ctx.tauxMachine(op.machine_id)) : 0
  const to = ctx.tauxMo ? nb(ctx.tauxMo(op.operateur_id, op.activite)) : 0
  return +(heures * (tm + to)).toFixed(2)
}

/**
 * Simule une annulation. NE MODIFIE RIEN.
 * Rend l'inventaire de ce qui serait annulé, et le montant dû par le client.
 */
export function simulerAnnulation(ctx: ContexteAnnulation, opts: OptionsAnnulation = {}) {
  const cmd = ctx.commande || {}
  const cmdId = txt(cmd.id)
  const affaire = txt(cmd.num_affaire) || txt(cmd.affaire_id)
  const reponses = opts.reponses || {}
  const margePct = Math.min(99.9, Math.max(0, nb(opts.margePct)))

  // ── 1. Les lots visés. Aucune sélection = toute la commande.
  const lotsCmd = (ctx.lots || []).filter((l: any) =>
    (txt(l.cmd_id) === cmdId || (affaire && txt(l.affaire_id) === affaire)) && !estAnnule(l.statut))
  const choisis = (opts.lots || []).map(txt).filter(Boolean)
  const lotsVises = choisis.length ? lotsCmd.filter((l: any) => choisis.includes(txt(l.id))) : lotsCmd
  const totale = lotsVises.length === lotsCmd.length && lotsCmd.length > 0
  const clesLots = new Set(lotsVises.map((l: any) => txt(l.id)))

  const dansLesLots = (op: any) => {
    const k = lotDe(op)
    if (k && clesLots.has(k)) return true
    // Repli : certaines lignes ne portent que la commande.
    return !choisis.length && (txt(op.cmd_ref) === cmdId || txt(op.cmd_id) === cmdId)
  }

  // ── 2. Les ordres de fabrication concernés, et ce qui est dû dessus.
  const bdts = (ctx.bdts || []).filter((b: any) => dansLesLots(b) && !estAnnule(b.statut))
  const bds  = (ctx.bds  || []).filter((s: any) => dansLesLots(s) && !estAnnule(s.statut))
  const ops  = [...bdts.map((b: any) => ({ ...b, _type: 'BDT' })), ...bds.map((s: any) => ({ ...s, _type: 'BDS' }))]

  const entamees = ops.filter(opEntamee)
  const travailHt = +entamees.reduce((t, op) => t + coutOp(op, ctx), 0).toFixed(2)

  // L'étape en cours, lot par lot : c'est ce qu'on montre à l'écran pour justifier le montant.
  const etapesEnCours = lotsVises.map((l: any) => {
    const e = etapeEnCours(ops.filter((o) => lotDe(o) === txt(l.id)))
    return e ? { lot: txt(l.id), piece: txt(l.piece), etape: txt(e.operation) || txt(e.piece), seq: nb(e.seq), type: e._type, cout: coutOp(e, ctx) } : null
  }).filter(Boolean)

  // ── 3. Les bons de commande, et ce que le client doit sur chacun.
  const bcsAffaire = (ctx.bcs || []).filter((b: any) => {
    if (estAnnule(b.statut)) return false
    const a = txt(b.num_affaire) || txt(b.affaire_id)
    return (affaire && a === affaire) || txt(b.cmd_ref) === cmdId
  })

  const bcs = bcsAffaire.map((b: any) => {
    const recu = BC_RECU.includes(cle(b.statut)) || !!txt(b.date_reception_reelle) || !!txt(b.bl_id)
    const valide = !!txt(b.accuse_fournisseur_le)
    const rep: ReponseFournisseur = (reponses[txt(b.id)] ?? null) as ReponseFournisseur
    let etat: EtatBc
    if (recu) etat = 'recu'
    else if (!valide) etat = 'annulable'
    else etat = rep === 'refuse' ? 'refus_fournisseur' : rep === 'accepte' ? 'annulable' : 'question'
    const du = (etat === 'recu' || etat === 'refus_fournisseur') ? nb(b.montant_ht) : 0
    return {
      id: txt(b.id), num_bc: txt(b.num_bc) || txt(b.id), fournisseur: txt(b.fournisseur_nom),
      statut: txt(b.statut), montant_ht: nb(b.montant_ht), etat, reponse: rep, du_client: du,
    }
  })

  const matiereHt = +bcs.reduce((t, b) => t + b.du_client, 0).toFixed(2)
  const enAttenteReponse = bcs.filter((b) => b.etat === 'question')

  // ── 4. Les demandes d'achat : seules celles PAS ENCORE transformées en BC s'annulent.
  const dasAvecBc = new Set(bcsAffaire.map((b: any) => txt(b.demande_achat_id)).filter(Boolean))
  const das = (ctx.das || [])
    .filter((d: any) => {
      if (estAnnule(d.statut)) return false
      const a = txt(d.num_affaire) || txt(d.affaire_id)
      return (affaire && a === affaire) || txt(d.cmd_ref) === cmdId
    })
    .map((d: any) => ({
      id: txt(d.id), article: txt(d.article), statut: txt(d.statut),
      // Une DA déjà devenue BC ne s'annule pas ici : c'est le BC qui décide.
      annulable: !dasAvecBc.has(txt(d.id)),
    }))

  // ── 5. La préparation technique. À faire → elle disparaît. Déjà faite → on n'y touche pas :
  //     la gamme est rentrée et sauvegardée, c'est autant de gagné si la pièce revient.
  const prepas = (ctx.prepas || [])
    .filter((p: any) => {
      if (estAnnule(p.statut)) return false
      const a = txt(p.num_affaire)
      return (affaire && a === affaire) || txt(p.cmd_ref) === cmdId
    })
    .map((p: any) => ({
      id: txt(p.id), piece: txt(p.piece) || txt(p.code_ref_produit), statut: txt(p.statut),
      action: cle(p.statut) === 'faite' ? 'conservee' : 'disparait',
    }))

  // ── 6. Le chiffrage. Marge sur la base TOTALE (matière + travail), conformément au
  //     tableau de prix de l'offre où le coefficient s'applique au coût de revient.
  const baseHt = +(matiereHt + travailHt).toFixed(2)
  const k = margePct > 0 ? 1 / (1 - margePct / 100) : 1
  const totalHt = +(baseHt * k).toFixed(2)

  const incertitudes: string[] = []
  if (enAttenteReponse.length) {
    incertitudes.push(
      enAttenteReponse.length + ' bon(s) de commande parti(s) chez le fournisseur : le montant reste PROVISOIRE '
      + 'tant qu\'on ne sait pas s\'il accepte d\'annuler. S\'il refuse, ' + enAttenteReponse.length
      + ' ligne(s) de matiere s\'ajouteront.')
  }
  if (!lotsCmd.length) incertitudes.push('Aucun lot ouvert sur cette commande.')
  // ⚠ LIMITE STRUCTURELLE, a dire plutot qu'a masquer : un bon de commande est rattache
  //   a l'AFFAIRE, jamais a un lot. Sur une annulation PARTIELLE, on ne sait donc pas
  //   quelle part de la matiere revient au lot annule — la totalite est comptee.
  //   Facturer trop est aussi faux que facturer trop peu : l'utilisateur doit arbitrer.
  if (!totale && matiereHt > 0) {
    incertitudes.push(
      "Annulation PARTIELLE : la matiere est rattachee a l’AFFAIRE, pas au lot. Les "
      + matiereHt.toLocaleString("fr-FR") + " EUR de matiere portent sur TOUTE l’affaire, "
      + "pas seulement sur le(s) lot(s) annule(s). A ajuster a la main avant d’emettre la facture.")
  }

  return {
    commande: { id: cmdId, num_affaire: affaire, client: txt(cmd.client_nom), statut: txt(cmd.statut) },
    portee: {
      totale,
      lots_vises: lotsVises.map((l: any) => ({ id: txt(l.id), piece: txt(l.piece), qte: nb(l.qte), statut: txt(l.statut) })),
      lots_conserves: lotsCmd.filter((l: any) => !clesLots.has(txt(l.id))).map((l: any) => ({ id: txt(l.id), piece: txt(l.piece) })),
    },
    // Sort de l'offre : totalement annulée → l'offre passe annulée ; partiellement → elle
    // reste acceptée, avec la mention du nombre de lots retirés.
    offre: ctx.offre ? {
      id: txt(ctx.offre.id), statut: txt(ctx.offre.statut),
      devient: totale ? 'annulee' : 'acceptee',
      mention: totale ? null : lotsVises.length + ' lot(s) annule(s) sur ' + lotsCmd.length,
    } : null,
    fabrication: {
      bdts: bdts.map((b: any) => ({ id: txt(b.id), operation: txt(b.operation), seq: nb(b.seq), statut: txt(b.statut), entamee: opEntamee(b) })),
      bds:  bds.map((s: any) => ({ id: txt(s.id), operation: txt(s.operation), seq: nb(s.seq), statut: txt(s.statut), entamee: opEntamee(s) })),
      etapes_en_cours: etapesEnCours,
      nb_entamees: entamees.length,
    },
    achats: { bcs, das, en_attente_reponse: enAttenteReponse.map((b) => b.num_bc) },
    preparations: prepas,
    chiffrage: {
      matiere_ht: matiereHt,
      travail_ht: travailHt,
      base_ht: baseHt,
      marge_pct: margePct,
      coefficient: +k.toFixed(4),
      marge_ht: +(totalHt - baseHt).toFixed(2),
      total_ht: totalHt,
      assiette_marge: 'base_totale',
      destination_matiere: opts.destinationMatiere || 'chez_nous',
      provisoire: enAttenteReponse.length > 0,
    },
    incertitudes,
  }
}
