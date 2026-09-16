// ═══════════════════════════════════════════════════════════════════════════
// PLANNING ADAPTÉ À LA CADENCE USINE — règles pures du lot G · G5 (16/09/2026)
// ═══════════════════════════════════════════════════════════════════════════
// « Le planning s'adapte à la cadence : grille = créneaux ouverts du jour, heures fermées grisées, chemin critique et
//   reports qui sautent heures et jours fermés. »
//
//   · heureFermee        : une pose (jour, heure) tombe-t-elle sur une heure FERMÉE de la cadence du site du BDT ?
//                          → refus client et serveur (409 « poste fermé à cette heure en cadence X ») ;
//   · intervallePosteOuvre : intervalle occupé sur le poste en HEURES OUVRÉES (G3, chevauchement du même process) ;
//   · ajouterPourOp      : fin prévue en heures ouvrées d'une opération (liste « Lots à venir » du service OAS) ;
//   · fenetreJour        : vue d'un jour du planning (axe des heures, union des deux sites).
// Le chemin critique lui-même est dans gamme.ts (horloge `tempsPlanning`).
//
// Site d'une opération = son activité (Seem, Semrac) ; toute autre valeur (both, vide) = union des deux sites (ouvert si
// l'un des deux travaille). Cadence illisible (tables absentes, non fournie) : grille 5 h-23 h, jamais d'heure « fermée ».
//
// BARRE QUI TRAVERSE UNE FERMETURE (choix V1, spécification G5) : la barre garde une largeur = durée (heures de travail) ;
// quand sa fin en heures ouvrées tombe plus tard que début + durée (pause non couverte, nuit, jour fermé), elle est
// signalée « déborde sur une fermeture » avec sa fin prévue, sans être allongée ni coupée en morceaux.
//
// ⚠ Copie client : bloc ==PLAN-CADENCE-DEBUT== / ==PLAN-CADENCE-FIN== du script de pageServiceProd (src/prod.tsx),
//   fonctions « pl… » (et ppIntervalle du bloc POSTE-OAS) : toute modification se reporte des deux côtés
//   (test de parité : scratchpad lotg/test_planning_cadence.ts).

import { tempsPlanning, fmtHeurePlanning, PLAN_DEBUT_JOUR, PLAN_FIN_JOUR, PLAN_HEURE_DEFAUT, type SourceTemps, type PosPlanning } from './gamme'
import { estOuvert, prochainInstantOuvert, plageOuverteCalendrier, niveauDuSite, versInstant, jourSemaineIso, JOURS_SEMAINE, LIBELLES_NIVEAU, NIVEAU_DEFAUT, type CalendrierCadence } from './cadence'
import { intervalleBrut, type IntervalleDe } from './poste_oas'

const txt = (v: any) => String(v ?? '').trim()
const numOuNull = (v: any): number | null => { if (v == null || v === '') return null; const n = Number(v); return isFinite(n) ? n : null }
const arr6 = (x: number) => Math.round(x * 1e6) / 1e6
const RE_ISO = /^(\d{4})-(\d{2})-(\d{2})/
const jjmm = (iso: string) => { const m = RE_ISO.exec(iso); return m ? m[3] + '/' + m[2] : iso }

/** « samedi 19/09 » */
export function jourLongPlanning(iso: string): string {
  const j = jourSemaineIso(iso)
  return (j ? JOURS_SEMAINE[j].toLowerCase() + ' ' : '') + jjmm(iso)
}

/** « Moyen (Seem) · Bas (Semrac) » : niveau de cadence de chaque site du calendrier à cette date. */
export function niveauxCalendrier(cal: CalendrierCadence, iso: string): string {
  return cal.sites.map((s) => LIBELLES_NIVEAU[(niveauDuSite(cal.cadences, s, iso) || NIVEAU_DEFAUT)] + ' (' + s + ')').join(' · ')
}

export interface HeureFermee {
  message: string
  /** prochain instant ouvert du site (null : aucun sur l'horizon) */
  prochain: PosPlanning | null
}

/**
 * La pose `op` (date_prevue, debut — sans heure : PLAN_HEURE_DEFAUT, activite) tombe-t-elle sur une heure FERMÉE de la
 * cadence de son site ? null = ouverte, ou cadence illisible (grille : rien n'est fermé), ou date illisible. (copie client)
 */
export function heureFermee(op: any, cadence: SourceTemps, nomPoste?: string): HeureFermee | null {
  const T = tempsPlanning(cadence)
  if (!T.cadence) return null
  const d = txt(op?.date_prevue).slice(0, 10)
  if (T.jourPlanning(d, null) == null) return null
  const h = numOuNull(op?.debut) ?? PLAN_HEURE_DEFAUT
  const cal = T.calendrier(op)
  if (!cal) return null
  const i = versInstant(d, h)
  if (estOuvert(i.date, i.heure, cal)) return null
  const p = prochainInstantOuvert(i.date, i.heure, cal)
  const nom = txt(nomPoste)
  return {
    message: (nom ? 'Le poste ' + nom + ' est' : 'Le poste est') + ' fermé à cette heure (' + jourLongPlanning(i.date) + ' à ' + fmtHeurePlanning(i.heure) + ') en cadence '
      + niveauxCalendrier(cal, i.date) + ' : posez le BDT sur un créneau ouvert' + (p ? ' — prochain : ' + jourLongPlanning(p.date) + ' à ' + fmtHeurePlanning(p.heure) : ' — aucun créneau ouvert') + '.',
    prochain: p ? { date: p.date, heure: arr6(p.heure) } : null,
  }
}

/**
 * G3 en heures OUVRÉES : du premier instant ouvert à partir du début prévu (sans heure : PLAN_HEURE_DEFAUT) jusqu'à la fin
 * en heures ouvrées (durée, sinon temps alloué), en heures absolues (jour × 24 + heure). Cadence illisible : intervalle
 * brut (poste_oas.ts intervalleBrut). (copie client : ppIntervalle)
 */
export function intervallePosteOuvre(cadence: SourceTemps): IntervalleDe {
  const T = tempsPlanning(cadence)
  if (!T.cadence) return intervalleBrut
  return (op: any) => {
    const j = T.jourPlanning(txt(op?.date_prevue).slice(0, 10), null)
    if (j == null) return null
    const iso = txt(op.date_prevue).slice(0, 10)
    const h = numOuNull(op?.debut) ?? PLAN_HEURE_DEFAUT
    const d = Math.max(0, numOuNull(op?.duree) ?? numOuNull(op?.temps_alloue) ?? 0)
    const fin = T.ajouter(op, iso, h, d)
    if (!fin) return intervalleBrut(op)
    const dep = T.versDebut(op, { date: iso, heure: h })
    return { debut: T.position(dep.date, dep.heure) as number, fin: T.position(fin.date, fin.heure) as number }
  }
}

/** Fin prévue d'une opération (« Lots à venir » OAS) : heures ouvrées du site de `op`, grille si la cadence est illisible. */
export function ajouterPourOp(cadence: SourceTemps): (dateIso: string, heure: number, h: number, op?: any) => PosPlanning | null {
  const T = tempsPlanning(cadence)
  return (d, h, x, op) => T.ajouter(op, d, h, x)
}

export interface FenetreJour {
  /** true : cadence lisible */
  cadence: boolean
  /** au moins un site ouvert ce jour-là (grille : toujours) */
  ouvert: boolean
  /** heure pleine du début de la vue (= début de fenêtre du jour) */
  debut: number
  /** heure pleine de fin de la plage ouverte (> 24 si la nuit travaille), bornée au début de la vue du lendemain */
  fin: number
  /** fin maximale de la vue : début de la vue du lendemain + 24 (au-delà, c'est le jour suivant) */
  finMax: number
  /** plage ouverte exacte (heures décimales), null si fermé ou grille */
  plage: { debut: number; fin: number } | null
}

/**
 * Vue d'un jour du planning (axe commun à toutes les lignes, union des deux sites — indépendant du filtre Seem / Semrac pour
 * qu'un BDT ne change pas de jour d'affichage selon le filtre). Grille : 5 h → 23 h. (copie client : plFenetre)
 */
export function fenetreJour(cadence: SourceTemps, dateIso: string): FenetreJour {
  const T = tempsPlanning(cadence)
  const m = RE_ISO.exec(txt(dateIso))
  const j = T.cadence && m ? T.jourPlanning(m[0], null) : null
  if (j == null || !m) return { cadence: false, ouvert: true, debut: PLAN_DEBUT_JOUR, fin: PLAN_FIN_JOUR, finMax: PLAN_FIN_JOUR, plage: null }
  const iso = m[0]
  const lendemain = new Date((j + 1) * 86400000).toISOString().slice(0, 10)
  const debut = T.debutFenetre(iso)
  const finMax = 24 + T.debutFenetre(lendemain)
  const p = plageOuverteCalendrier(T.calendrier(null) as CalendrierCadence, iso)
  const fin = p ? Math.min(finMax, Math.ceil(p.fin - 1e-9)) : Math.min(finMax, PLAN_FIN_JOUR)
  return { cadence: true, ouvert: !!p, debut, fin: Math.max(fin, debut + 1), finMax, plage: p ? { debut: arr6(p.debut), fin: arr6(p.fin) } : null }
}
