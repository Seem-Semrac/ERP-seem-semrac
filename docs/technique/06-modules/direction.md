# Module Direction

<!-- auto:entete -->
- **Route** : `/direction/service` · **Fichier source** : `src/direction_service.tsx`
- **Accès (RBAC)** : écriture — ALL (perm all) · lecture — ALL
<!-- /auto -->

## Mission
<!-- auto:mission -->
Cockpit : à valider, jalons critiques, par affaire, pilotage KPIs, budget, santé des données.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `avalider` — À valider
- `jalons` — Jalons critiques
- `affaire` — Par affaire
- `pilotage` — Pilotage
- `budget` — Budget
- `sante` — Santé des données
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`direction` · `validations` · `kpi-objectifs`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`validations` · `kpi_objectifs` · `affaires`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
File de validation générique (décision réservée Direction). Moteur d'alertes → validations (scan-alertes). Santé des données (DICT). Fiches 360.
<!-- /auto -->

### Congés des fonctions support (14/09/2026, lot C)
`validerCongeSupport` appelle `POST /api/rh/conge/:id/valider` (`valide_par: 'Direction'`). Depuis la revue du
lot C, la décision est **conditionnelle** (409 si le congé n'est plus `demande` — double clic, autre écran)
et un effet raté (absences, BDT renvoyés au pool, solde) revient dans `warning`, affiché en notification
orange. Les congés des **opérateurs** se traitent aussi dans Production › Présence
(`/api/production/conge/:id/valider`). Détail : `06-modules/rh.md`.
- **NC critiques ouvertes** (15/09/2026) : `/direction/service` et `POST /api/direction/scan-alertes` jugent une NC ouverte
  par `!ncEstClose(statut)` (`src/queries.ts`), la définition de la porte d'expédition. Elles avaient chacune leur regex,
  sans « Soldé » (statut de clôture de la liste Qualité) : une NC Critique soldée restait listée et alertée.
### Excédent de réception : accepter en stock ou renvoyer (lot F, 15/09/2026)

> « Ce qui est voulu va au stock, le reste, la décision est soumise à validation hiérarchique pour le moment. »

- **Origine** : le PV de réception (Expéditions) crée une demande `validations` par ligne reçue au-delà du prévu — domaine
  `expeditions` (libellé « Expéditions »), type `excedent_reception` (libellé « Excédent de réception »), objet « Excédent
  de réception BC · ligne · +N (reçu … pour … prévu) — accepter en stock ou refuser (retour au fournisseur) », montant = PU
 × excédent, `ref_table bons_de_commande`. `POST /api/validations` **refuse (403)** une demande de ce
  type fabriquée à la main.
- **À valider** : boutons **« Accepter »** et **« Refuser »** (au lieu des icônes seules). Refuser ouvre la fenêtre de refus
  **sans** « annulation / révision » (la demande ne se resoumet pas), avec la note « rien n'entre en stock : les pièces en
  trop sont à renvoyer au fournisseur ». Message de retour et avertissements **durables** (`notifDurable`).
- **Décision** (`POST /api/validations/:id/decision` → `deciderExcedentReception`) — la route lit d'abord la demande
  **strictement** pour **tous** les types (503 si la base est en panne) :
  - demande déjà décidée → 409 ;
  - **Accepter** : si `payload.qualite_requise` (ligne qualitative ou certificat absent), la quarantaine du lot doit être
    décidée par la Qualité — absente, en cours → 409 ; `retour_fournisseur` → 409 « refusez-le ». Puis transition
    **conditionnelle** `en_attente → valide` (payload conservé + `decision: 'accepte'`), puis l'excédent entre dans la file
    Stock › Mise en stock (origine `excedent_valide`, idempotente par validation + ligne). Si la file refuse (base sans
    cloud-11 → 409, autre erreur → 400), la demande est **remise en attente** (conditionnel) et l'échec est dit.
  - **Refuser** : motif obligatoire ; transition conditionnelle vers `refuse` avec `decision: 'refuse'`,
    `suite: 'retour_a_organiser'` ; création d'un **retour à expédier** `QEXC-<id>` (quarantaine déjà décidée,
    `retour_fournisseur`, `rejete`, `qte_retour` = excédent, compensation `aucune` — ni avoir, ni remplacement, ni manque
    matière), listé dans Expéditions › Envois › Retours fournisseurs ; `retour_quarantaine_id` noté sur la demande.
    Rien n'entre en stock.
- **Traités** : badges « ACCEPTÉ · MISE EN STOCK » et « REFUSÉ · RETOUR FOURNISSEUR ».
- **Cockpit** : les stocks critiques comptent la quantité à ranger ; `scan-alertes` ne crée pas de rupture pour une
  référence en attente de rangement (et n'évalue pas les ruptures si la file est illisible : `ruptures_non_evaluees`).
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/direction.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
