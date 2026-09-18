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
2. Matière et accessoires : cherchez par **référence ou désignation** dans tout le catalogue (**pas de fournisseur à choisir**) + masse (g). Le « Prix estimé / pièce » est la **moyenne des fournisseurs** qui portent la référence ; badge « n fourn. · min–max », clic = détail. Orange = un prix a plus de 6 mois ; rouge = aucun prix (« coût incomplet », la pièce reste validable). Bouton libellé **« Demande de prix »** sur chaque ligne, à tout moment : bleu (prix récent), orange (demande conseillée), ambre « En attente / vérifier » (demande partie).
   - Accessoires : saisissez **Nb/pièce** ; la **quantité par paquet** se déclare **au catalogue** (tâche 2) — sans elle, le prix du paquet est compté à la pièce (« cond. ? » en orange).
   - ⚠ Une **même référence ne peut figurer qu'une fois** par nomenclature, matière et accessoires confondus.
3. Étapes (glisser-déposer) : type, poste, process, puis les temps en ‰h — ROP (réglage homme), RGM (réglage machine : homme + machine), MO (homme / pièce), Mach (machine / pièce). Heure homme = coût chargé RH moyen du site ; heure machine = taux du process (saisi en Production).
4. Prix de revient calculé → Enregistrer (indice A/B/C). Toute modification d'une fiche validée est tracée au **journal EN 9100**, tout en bas du formulaire, sur toute la largeur.

![form-be-nomenclature](../assets/form-be-nomenclature.png)

### 2. Créer une nomenclature mère et ordonner ses composants
1. BE › **Nomenclatures** › sous-onglet **Mères**, « + Nouvelle mère » : le bloc « Composants — ordre de fabrication » est en haut de la colonne de droite.
2. « Ajouter un composant » : cherchez parmi les **nomenclatures filles (standards)** et les **nomenclatures mères** (dernière révision validée) ; quantité par mère.
3. **L'ordre des lignes est l'ordre de fabrication**, du haut vers le bas : ▲ ▼, poignée (glisser-déposer) ou flèches du clavier. Le rang donne le n° de **sous-lot** en production (`.01`, `.02`…) ; les composants d'une sous-mère deviendront des sous-sous-lots.
4. Une mère ne peut pas se contenir elle-même et l'arbre s'arrête à **5 niveaux** : l'ERP le refuse (message avec le chemin), rien n'est enregistré. Une fiche encore composant d'une mère ne se supprime pas.
5. ⚠ Le prix de revient d'une mère = somme de ses composants ; dans l'analyse DT, ses sous-ensembles ne sont pas chiffrés (bandeau orange) : à signaler au Commercial.

![form-be-nomenclature-mere](../assets/form-be-nomenclature-mere.png)

### 3. Déclarer la quantité par paquet d'un accessoire
1. BE › **Références** : le bandeau orange compte les accessoires sans quantité par paquet ; colonne **Qté/paquet** (« non déclarée » en orange).
2. « **Éditer** » sur la ligne → **Quantité par paquet** (nombre de pièces du paquet auquel se rapporte le prix) → Enregistrer. Une case laissée vide ne change rien. Même champ côté Achats (fiche fournisseur › Références fournies) : c'est le même catalogue.
3. Au catalogue, le prix d'un accessoire est celui du **paquet**, celui d'une matière celui d'**une tôle** ; le prix à la pièce est calculé. Exemple : 10 € le paquet de 100 chez A et 6 € le paquet de 50 chez B → 0,10 € et 0,12 € la pièce → **0,11 € la pièce** en moyenne.

![be-refs](../assets/be-refs.png)

### 4. Analyser une DT
1. Onglet **Analyse DT**, sélectionner la DT.
2. Générer le dossier technique → BDT.

![be-analyse](../assets/be-analyse.png)

---
> Fiche générée (`scripts_doc/gen_fiches_poste.mjs`). Sécurité & traçabilité : `docs/technique/04-auth-rbac.md`.
