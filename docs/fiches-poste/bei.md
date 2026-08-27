# Fiche de poste — Bureau d'Études (BE)

> Rôle ERP : `bei`. Voir aussi le manuel utilisateur (`docs/manuel/`).

## Mission
Définir techniquement les pièces (nomenclatures, gammes) et préparer la fabrication.

## Vos accès (droits)
| | Services |
|---|---|
| **Écriture** (créer/modifier) | be, achats |
| **Lecture** | commercial, production, oas, qualité, sécurité, stock, maintenance |

Vous vous connectez avec votre **matricule + PIN** (voir *Prise en main*). La barre latérale n'affiche que vos services autorisés.

## Vos tâches courantes
### 1. Créer une nomenclature
1. BE › **Nomenclatures**, « Nouvelle ».
2. Matière (réf → prix auto <3 mois) + masse (g).
3. Étapes (glisser-déposer) : opération, machine, temps, réglage.
4. Prix de revient calculé → Enregistrer (indice A/B/C).

![be-noms](../assets/be-noms.png)

### 2. Analyser une DT
1. Onglet **Analyse DT**, sélectionner la DT.
2. Générer le dossier technique → BDT.

![be-analyse](../assets/be-analyse.png)

---
> Fiche générée (`scripts_doc/gen_fiches_poste.mjs`). Sécurité & traçabilité : `docs/technique/04-auth-rbac.md`.
