# Fiche de poste — Acheteur(se)

> Rôle ERP : `achats`. Voir aussi le manuel utilisateur (`docs/manuel/`).

## Mission
Consulter les fournisseurs, passer les commandes, tenir le référentiel fournisseurs.

## Vos accès (droits)
| | Services |
|---|---|
| **Écriture** (créer/modifier) | achats, stock |
| **Lecture** | commercial, be, production, expéditions, maintenance |

Vous vous connectez avec votre **matricule + PIN** (voir *Prise en main*). La barre latérale n'affiche que vos services autorisés.

## Vos tâches courantes
### 1. Lancer une demande de prix (RFQ)
1. Achats › **Demandes de prix**, « Nouvelle RFQ ».
2. Fournisseur(s) + articles.
3. Saisir les prix reçus → alimente le catalogue.

![achats-rfq](../assets/achats-rfq.png)

### 2. Transformer une DA en BC
1. Onglet **Demandes d'achat**, sélectionner la DA.
2. Générer le bon de commande fournisseur.

![achats-da](../assets/achats-da.png)

---
> Fiche générée (`scripts_doc/gen_fiches_poste.mjs`). Sécurité & traçabilité : `docs/technique/04-auth-rbac.md`.
