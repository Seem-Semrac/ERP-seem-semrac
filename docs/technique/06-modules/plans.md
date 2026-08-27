# Module Plan / Bâtiment

<!-- auto:entete -->
- **Route** : `/plans/service` · **Fichier source** : `src/plans.tsx`
- **Accès (RBAC)** : écriture — BE, production, maintenance, qualité, direction · lecture — tout connecté
<!-- /auto -->

## Mission
<!-- auto:mission -->
Maquette « BIM » : zones (rectangles) + objets (machines, périssables, chimie, ATEX, extincteurs) reliés à la base, états live.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `plan` — Maquette
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`plans` · `marqueurs`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`plans_batiment` · `plan_marqueurs` · `documents (GED)`
<!-- /auto -->
## Points d'attention
Zones = rectangles dessinables, objets = pins rangés dedans (classement par zone). Couleurs d'état live. Deep-links vers fiches. Auto-placement. **Vue « Risque chimique » (SEIRICH Phase 4)** : bouton qui colore les repères chimie/ATEX par niveau de risque (niveau précalculé serveur via `computeRisqueChimique` + expositions ; couleur au rendu, non persistée) + légende par niveau ; deep-link repère chimie → fiche produit `/securite/chimique/:id`. Route charge `getHseExpositions`. Aucune migration.


### Le plan ne CRÉE rien : il POSE (2026-08-25)
- Refonte demandée : « on peut ajouter tout ce qu on veut, on va pas faire comme ça ». La légende latérale devient un **catalogue** des fiches de l ERP ; on clique une fiche puis on la place. **Aucune saisie de libellé, aucune création d entité depuis le plan.**
- `CATS` : 9 catégories, **toutes** avec un `link` obligatoire. Zones — `poste` (passé de point à **rect**, porte ses process et machines), `atelier` (zonage Z1–Z7/A + matrice EPI), `atex`. Objets — `machine`, `chimie`, `perissable`, `ecme` (**nouveau**, 265 fiches), `vgp`, `dechet` (**nouveau**).
- 🐞 La catégorie `machine` **manquait de `CATS`** alors que 8 repères l utilisaient : ils s affichaient en « Autre / Point ». Rétablie.
- Route : `getEcme()` et `getHseDechets()` ajoutés ; `MACHINES`, `ECME`, `DECHETS` injectés dans la page.
- **Repères hors catalogue conservés** : les 40 tracés à la main (salles) restent affichés dans un bloc ambré dédié, non créables, supprimables. On ne détruit pas le travail existant — mais le fond de plan porte déjà les noms de salles.
- Éditeur réduit : plus de `pe-label`, `pe-type`, `pe-col`, ni bouton « Créer dans l ERP » (`planShowCreate` / `planCreateEntitySubmit` supprimées). Ne reste que la **note de placement** + le lien vers la fiche d origine.
- 🐞 Compteur : seuls les repères **liés** comptent comme posés — sinon l onglet affichait « 15 / 8 » (les hors-catalogue gonflaient le total).
- ⚠ Piège : les **backticks dans un commentaire à l intérieur du template literal** cassent le parsing TS (4 erreurs `TS1005`). Les commentaires du bloc script n en contiennent plus.
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/plans.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
