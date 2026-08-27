# Fiche de poste — Programmation production

> Rôle ERP : `production`. Voir aussi le manuel utilisateur (`docs/manuel/`).

## Mission
Planifier la fabrication et suivre l'avancement des BDT/BDS.

## Vos accès (droits)
| | Services |
|---|---|
| **Écriture** (créer/modifier) | production |
| **Lecture** | be, achats, oas, qualité, sécurité, expéditions, stock, maintenance |

Vous vous connectez avec votre **matricule + PIN** (voir *Prise en main*). La barre latérale n'affiche que vos services autorisés.

## Vos tâches courantes
### 1. Affecter un BDT à un opérateur
1. **/production/service** → onglet **Planning Gantt BDT** (planning unique).
2. Glisser une carte de « **BDT à classer** » (au-dessus du planning) sur le poste, ou sur la sous-case **Matin / Ap-m / Soir** de l'opérateur.
3. Un clic sur un BDT n'affiche que **son poste + l'étape d'avant et d'après** ; « Tout afficher » lève le focus.
3. Les BDT prioritaires (BDTP) sont encadrés en rouge.

![production-service](../assets/production-service.png)

### 2. Suivre les commandes à faire
1. Onglet **Commandes & Lots** : commandes → lots → BDT.

![production-service](../assets/production-service.png)

---
> Fiche générée (`scripts_doc/gen_fiches_poste.mjs`). Sécurité & traçabilité : `docs/technique/04-auth-rbac.md`.
