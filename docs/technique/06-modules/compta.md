# Module Comptabilité

<!-- auto:entete -->
- **Route** : `/compta/service` · **Fichier source** : `src/compta_service.tsx + src/finances.tsx`
- **Accès (RBAC)** : écriture — compta (comptable) · lecture — —
<!-- /auto -->

## Mission
<!-- auto:mission -->
Facturation, grand livre, TVA & déclarations, balance & trésorerie, coûts & marges.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `0` — Facturation
- `1` — Grand Livre
- `2` — TVA & Déclarations
- `3` — Balance & Trésorerie
- `4` — Dashboard
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`factures` · `factures-fournisseur` · `ecritures` · `compta`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`factures_client` · `factures_fournisseur` · `ecritures`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
Écritures format FEC (export /api/compta/export-fec, réservé compta/direction). Marge brute + base 100. Pages /finances/* (taux, coûts) réservées compta.
<!-- /auto -->

## Pages `/finances/*` : coût horaire porté par le process (14/09/2026)

Source : `src/finances.tsx` (routes dans `src/index.tsx`). Règle de coût commune : `src/shared.ts`
(`construireTauxAtelier`, `etapeDecomp`, `coutReelBdt`) — voir [production.md](production.md).

- **Routes** : `/finances/couts`, `/finances/machines` et `/finances/imputations` chargent les process
  **bruts** (`getProcessAtelier`) et `getTauxAtelier().error`, passés en dernier argument
  `{ process, erreur }` (`DonneesTauxFinances`). `erreur` ⇒ taux et coûts **masqués** (jamais remplacés
  par 0) ; `process` absent ⇒ bandeau « process non transmis ». Les paramètres `_commandes`, `_opex`,
  `_postes` sont conservés pour la compatibilité mais ignorés.
- **Coûts de revient** (`pageFinancesCouts`) : la boucle sur `finCmds` (toujours vide) est remplacée par
  la méthode ROP/RGM/THV/TMV, les moyennes du coût chargé RH (Seem, Semrac, atelier), le nombre de
  process machine avec / sans taux et des liens vers les coûts estimés (BE) et réels (fiches affaire /
  commande, imputations). **Simulateur** « Simuler CR » : activité (propose la moyenne RH du site),
  quantité du lot, taux homme, lignes de gamme (opération, process au choix qui pré-remplit type et taux
  machine, ROP / RGM / THV / TMV en minutes, taux machine), matière, frais généraux et coefficient
  présentés comme **hypothèses** ; rien n'est enregistré. Les défauts inventés (26,83 / 18,50 €/h,
  12 %, ×1,35) sont supprimés.
- **Taux machine des process** (`pageFinancesMachines`, ex-« coûts horaires machines ») : par machine,
  ses process machine et leur taux (badges « taux à saisir » / « transition »), OPEX annuel en euros,
  section des process machine sans machine ; lien « Saisir les taux (Production) ». `computePosteRates`
  et `cout_h` retirés ; la machine d'activité OAS n'est plus masquée.
- **Imputations** (`pageFinancesImputations`) : chaque BDT valorisé par `coutReelBdt` — taux et origine
  (opérateur / moyenne du site), coût homme, coût machine, total ; bandeau « N BDT au coût incomplet ».
- **Taux opérateurs** (`pageFinancesTaux`) : ligne des moyennes utilisées par le coût estimé ; division par
  zéro corrigée. ⚠ Le « taux brut » y est déduit du taux chargé avec **45 % de charges codés en dur**, et le
  bouton « Enregistrer » **n'écrit rien** (notification seule) : la source réelle est le **taux horaire
  chargé** de la fiche salarié (RH).
- **Supprimés** (ils notifiaient sans rien faire) : « Enregistrer » de la page machines, « Sync Power BI »,
  « Exporter », « Valider tout » et le faux sélecteur de date des imputations, « Export PDF » /
  « Recalculer » de la page Coûts.
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/compta.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
