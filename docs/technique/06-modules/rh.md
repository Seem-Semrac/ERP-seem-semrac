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
Navigation par pages (pas de serviceHeader). Habilitations partagées RH+Qualité. Pointage = borne self-service (matricule+PIN). Congés → absences planning. Lot G (16/09/2026) : les créneaux (Matin, Journée, Après-midi, Soirée) n’ont plus d’horaires fixes — Gestion des Temps calcule arrivée, départ, pause et heures d’une présence d’après la cadence usine du site et du jour (tables horaires_modeles / cadence_site, Production › Process Ateliers › Cadence usine).
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
  `CRENEAUX` / `libelleCreneau` (`src/presences.ts`, libellés tirés de `SHIFTS` de `src/shared.ts`) : Matin ·
  Journée · Après-midi · **Soirée** (ancien libellé « Nuit » ; identifiant `soir`). ⚠ **Depuis le lot G
  (16/09/2026)**, plus d'horaires dans les libellés : voir la section suivante.
- **Matrice de compétences = identifiants de process** (constat du 15/09/2026) : `competences_operateur.operation`
  contient l'**id** du process (`buildOpsForMatrix` : `code = p.id`, ex. `proc-man-s1`, `PROC-2026-018`), pas le libellé
  d'opération. Tout contrôle qui la lit doit comparer `bons_de_travail.process_id` (le soldage d'un BDT comparait le
  libellé : il refusait tout le monde ; il n'avertit plus que, voir `production.md`). Remettre une cellule à « — » laisse
  une ligne de niveau 0.
- **`PATCH /api/rh/salarie/:id` avec `acces_services`** (15/09/2026) : quand la fiche n'a **aucune** autorisation
  fonctionnelle (hors jetons `lire:`/`ecrire:`), la base de fusion est `autorisationsUnion(rôles de la fiche)`. Avant,
  cocher un accès enregistrait des jetons seuls : au login la liste n'était plus vide et la personne perdait `pointage`,
  `soldage`… (un opérateur ne pouvait plus solder le BDT qu'il avait reçu).

### Horaires des créneaux selon la cadence usine — lot G (16/09/2026)
- Les horaires d'un créneau dépendent de la **cadence usine du site** (Seem, Semrac) **et du jour** : modèles Bas /
  Moyen / Haut (`horaires_modeles`), cadence par site avec date d'effet (`cadence_site`), réglés dans Production ›
  Process Ateliers › **Cadence usine** (`production.md`, section Lot G). `SHIFTS` ne garde que les identifiants,
  libellés et couleurs ; ses horaires ne servent que de repli.
- **Gestion des Temps** (`GET /rh/temps` → `pageRHTemps(pts, emps, conges, presences, cadence.data)`) : sans pointage
  réel, les lignes sont déduites des présences. Pour chacune : site = activité de l'opérateur (fiche salarié, sinon
  `activite` de la présence) ; `horairesCreneauSite(cadence, site, date, créneau)` donne l'arrivée (début de la 1ʳᵉ
  partie), le départ (fin de la dernière) et les heures = `heuresPresence` (`src/cadence.ts`) : amplitude − pause, pause =
  celle de la Journée, sinon **30 min forfaitaires au-delà de 6 h** (règle d'avant le lot G, gardée en attendant la
  décision RH : `PAUSE_PRESENCE_MIN`, `SEUIL_PAUSE_PRESENCE_H`). Exemples en Moyen : Matin 05:30-13:15 → 7,25 h ; Journée
  07:30-12:00 / 12:45-16:00 → 7,75 h ; Soirée 21:00-05:30 → 8 h. « Validé par » indique la source : « Planning présence ·
  cadence Moyen » ; « ⚠ créneau fermé en cadence X ce jour (horaires par défaut) » pour une présence enregistrée avant
  un changement de cadence ; « · horaires par défaut » quand la cadence est illisible (`SHIFT_HMS` : Matin 06:00-14:00
  7,5 h, Journée 07:00-17:00 9,5 h, Après-midi 14:00-22:00 7,5 h, Soirée 22:00-06:00 7,5 h).
- **Employés** : colonne « Shift » et champ `f_shift` sans horaires, infobulle qui renvoie à la cadence usine.
- **Matrice de compétences** : le filtre Seem / Semrac (`rhFilterMatrice`) garde visibles les process d'activité
  **« OAS »** (la migration 014 / `cloud-12` a passé les 5 process de la machine OAS de `both` / `Seem` à `OAS` ; sans cela ils
  disparaissaient des deux filtres).
- **Refus à la saisie** : un créneau fermé ce jour-là dans la cadence du site est refusé à l'enregistrement de la
  présence (`POST /api/production/presence`, 409 `creneau_ferme`) — la RH ne saisit pas les présences, mais les temps
  déduits n'ont donc pas de créneau fermé, sauf présences antérieures à un changement de cadence.
- ⚠ **Modèles non historisés** : modifier un modèle d'horaires change aussi les heures recalculées pour les mois passés
  dans Gestion des Temps (la cadence d'une date passée, elle, suit l'historique de `cadence_site`).
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/rh.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
