# Module RH

<!-- auto:entete -->
- **Route** : `/rh/service` · **Fichier source** : `src/rh_service.tsx`
- **Accès (RBAC)** : écriture — rh · lecture — production, sécurité, compta
<!-- /auto -->

## Mission
<!-- auto:mission -->
Employés, habilitations & certifications, matrice compétences, organigramme, temps, pointage.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `/rh/employes` — Employés
- `/rh/habilitations` — Habilitations & Certifications
- `/rh/competences` — Matrice Compétences
- `/rh/organigramme` — Organigramme
- `/rh/temps` — Gestion des Temps
- `/rh/service` — Dashboard
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`rh` · `salarie(s)` · `competence(s)` · `certification(s)` · `conge(s)` · `pointage`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`salaries` · `habilitations` · `certifications` · `conges` · `pointages` · `formations`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
Navigation par pages (pas de serviceHeader). Habilitations partagées RH+Qualité. Pointage = borne self-service (matricule+PIN). Congés → absences planning.
<!-- /auto -->

### Congés et créneaux — lot C Production (14/09/2026)
- **Trois routes décident d'un congé**, avec les mêmes effets (`effetsDecisionConge`, `src/index.tsx`) :
  `POST /api/rh/conge/:id/valider` (RH, et Direction via `validerCongeSupport`) et
  `POST /api/production/conge/:id/valider` (onglet Présence de Production, **congés d'opérateurs
  seulement** — `salaries.est_operateur = true`, sinon 403). Contrats : `07-api-reference.md`, section Lot C.
- **Décision conditionnelle** sur les deux routes : congé lu de façon ciblée (`getCongeCible`, 503 / 404),
  **409** si son statut n'est plus `demande`, mise à jour `majCongeSiStatut(id, 'demande', …)` (409 si traité
  entre-temps). Avant la revue du lot C, la route RH ne contrôlait rien : un double clic posait deux fois les
  absences et **décomptait deux fois le solde**.
- **Auto-validation refusée** sur la route Production (403 « Un congé ne se valide pas soi-même ») : le droit
  d'écriture Production peut être donné à un chef d'équipe opérateur par sa fiche RH. ⚠ La route RH n'a pas ce
  garde-fou (réservée aux droits RH / Direction).
- **Effets lus de façon ciblée et stricte** : salarié (`getSalarieCompletCible`) pour le solde, BDT de
  l'opérateur sur la période (`lireBDTOperateurPeriode`) pour les renvoyer au pool. La décision étant déjà
  écrite, **chaque effet raté est rendu dans `warning`** (absences manquantes, BDT non renvoyés, solde non
  décompté) ; RH (`rhValiderConge`), Direction (`validerCongeSupport`) et Production (`validerCongeOp`)
  l'affichent en notification orange.
- **Créneaux** : la liste des salariés et le `<select id="f_shift">` de la fiche sont générés depuis
  `CRENEAUX` / `libelleCreneau` (`src/presences.ts`, libellés et horaires tirés de `SHIFTS` de
  `src/shared.ts`) : Matin 6h-14h · Journée 7h-17h · Après-midi 14h-22h · **Soirée 22h-6h** (ancien libellé
  « Nuit » ; identifiant `soir` et horaires inchangés). ⚠ `SHIFT_HMS` (pointages déduits des présences) et la
  table `shifts` n'ont pas été modifiés.
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/rh.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
