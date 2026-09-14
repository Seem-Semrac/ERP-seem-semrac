# Module Maintenance

<!-- auto:entete -->
- **Route** : `/maintenance/service` · **Fichier source** : `src/maintenance_service.tsx`
- **Accès (RBAC)** : écriture — maintenance · lecture — achats, production, oas, sécurité, stock
<!-- /auto -->

## Mission
<!-- auto:mission -->
GMAO : interventions/OM, plan préventif, MTBF, fiche machine 360, pièces détachées.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `interventions` — Interventions / OM
- `preventif` — Plan Préventif
- `mtbf` — MTBF & Historique
- `fiche` — Fiche 360
- `postes` — Coûts postes
- `pieces` — Pièces & PDR
- `dashboard` — Dashboard
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`om` · `maintenance` · `piece(s)`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`ordres_maintenance` · `plans_preventif` · `pieces_detachees` · `machines`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
Fiche Machine 360 (TCO + heures via gamme + Disponibilité/TRS). Préventif → OM. Deep-link depuis le plan bâtiment (#machine=<id>).
<!-- /auto -->

## Coûts en euros, plus aucun taux horaire (14/09/2026)

Le taux horaire est désormais porté par le **process** (Production › Process Ateliers, colonne
`process_atelier.taux_horaire_machine`) ; la Maintenance n'en affiche plus aucun.

- **Coûts postes** (`panelPosteCosts(postes, cost)`) : colonne « Taux/h effectif » et `computePosteRates`
  retirés. OPEX du poste = somme de l'OPEX **saisi** (`machines_opex.cout_total_ht`, dernière année
  renseignée) de ses machines + coût des OM de l'année = TCO. Une machine sans OPEX saisi n'est plus
  estimée (`cout_h × capacité × 220` supprimé) : elle est **comptée** (`opexNR`, « N machine(s) sans OPEX
  saisi »).
- **Fiche 360** (`MNT_FICHE[id]`) : `taux`, `coutAbsorbeTot` et `coutAbsorbeAn` retirés (tuile « Coût
  absorbé prod. » supprimée : les heures machine reçues de la route ne disent pas de quel process elles
  viennent) ; `opexAnnuel` vaut `null` s'il n'est pas saisi (« — · non renseigné ») ; `opexAnnee` ajouté ;
  TCO = OPEX saisi (0 si absent) + maintenance de l'année.
- **Heures machine** (route `/maintenance/service`) : quand le BDT ne porte pas de temps machine, elles
  sont dérivées de la gamme par `etapeDecomp(e, construireTauxAtelier(process), null)` : **RGM + TMV** des
  étapes d'un process de **type machine** (`typeProcess`), quantité du lot comprise. Le ROP et le temps
  homme n'immobilisent pas la machine (avant : le réglage historique `temps_reglage_min` pouvait être
  compté machine).
- Tableau de bord Maintenance (`src/kpi.ts`, `src/dashboards.tsx`) : « coût horaire réel » (OPEX ÷ heures
  productives) retiré ; l'OPEX par machine reste en euros.
- ⚠ Ouvrir `/maintenance/service` lance `scanPreventifOM()` (création des OM préventifs dus) : ce n'est pas
  une lecture seule.
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/maintenance.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
