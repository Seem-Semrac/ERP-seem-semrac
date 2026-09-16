# OAS (traitement de surface)

**Pour qui :** Opérateur OAS

Oxydation Anodique Sulfurique : suivi des lots/balancelles, relevés eau et bains.

![oas](../assets/oas.png)

## Les onglets
- **Lots & Balancelles** — Suivi des pièces en traitement ; en tête, **« Lots à venir »** : les lots dont l'étape qui précède l'OAS est programmée ou en cours au planning, avec leur fin prévue.
- **Relevé consommation eau** — Saisie des relevés d'eau.
- **Relevés périodiques bains** — Contrôle des bains (un bain non conforme génère une NC).
- **Dashboard OAS** — Indicateurs OAS.

## Procédures
### Anticiper les lots qui arrivent (« Lots à venir »)
L'OAS n'a ni BDT ni goulotte : c'est le BDT **qui précède** le traitement (badge « → OAS » au planning de production) qui annonce le lot.
1. Onglet **Lots & Balancelles** → tableau **« Lots à venir »** (en haut, compteur à côté du titre).
2. Une ligne par lot annoncé : Lot / affaire · Client · Pièce · Quantité · **Process OAS suivant** (ex. Desoxydation, Oxydation Incolore ; « OAS (process non retrouvé) » si la gamme ne le dit pas) · BDT précédent · **Fin prévue** · Statut du BDT (**Programmé** / **Reçu**).
3. Les lots sont triés par **fin prévue** (le plus proche en tête). La fin prévue compte la durée du BDT en **heures ouvrées** de la cadence usine (pauses, nuits et jours fermés sautés) ; un BDT reçu part de son heure réelle. Des morceaux restés dans la goulotte de la Production sont signalés à part.
4. Quand le BDT précédent est **soldé**, le lot quitte « Lots à venir » et apparaît dans **« Lots arrivés à l'OAS »**.

![Lots à venir](../assets/oas-lots-a-venir.png)

> Les process de la machine OAS (Surtec 650, Désoxydation, Oxydation noire, Oxydation incolore, Lavage) sont de **type OAS** depuis le 16/09/2026 : ce sont eux que le badge et la colonne « Process OAS suivant » affichent.

### Saisir un relevé de bain
1. Onglet **Relevés périodiques bains**.
2. Sélectionner le **bain**, saisir les valeurs mesurées.
3. Si hors tolérance → le système crée automatiquement une **non-conformité**.

---
> Détails techniques : `docs/technique/06-modules/oas.md`. Droits d'accès : `docs/fiches-poste/`.
