# Formulaires — Comptabilite · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Nouvelle facture client
**Quand l'utiliser :** Pour créer une facture à envoyer à un client (une prestation ou une livraison à facturer).
**Où le trouver :** Onglet « Facturation » › sous-onglet « Factures clients » › bouton « Créer facture » (en haut de la liste).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Client | liste déroulante (les clients déjà présents dans les factures) | Oui | Choisissez le client à facturer. Commencez par « — Sélectionner — ». | DASSAULT AVIATION |
| N° Affaire | texte | Oui | Le numéro de la commande / affaire concernée par la facture. | CMD-2026-014 |
| Date facture | date | Oui | Le jour où la facture est émise. | 11/05/2026 |
| Date d'échéance | date | Oui | La date limite avant laquelle le client doit payer. | 11/06/2026 |
| Désignation / Prestations | zone de texte | Oui | Décrivez ce qui est facturé : prestations réalisées ou références des articles livrés. | Usinage 200 pièces réf. DISSIP-12 |
| Montant HT (€) | nombre | Oui | Le montant hors taxes. La TVA et le TTC se calculent tout seuls dès que vous le saisissez. | 4500.00 |
| TVA 20% (€) | nombre (calculé, non modifiable) | Non | Se remplit automatiquement (20 % du HT). Vous ne le tapez pas. | 900.00 |
| Montant TTC (€) | nombre (calculé, non modifiable) | Non | Se remplit automatiquement (HT + TVA). Vous ne le tapez pas. | 5400.00 |
| Mode de paiement | liste déroulante (Virement, Chèque, Prélèvement, LCR) | Non | Comment le client réglera la facture. | Virement |
| Notes internes | zone de texte | Non | Remarques ou conditions particulières, visibles en interne (et reprises sur le PDF). | Remise fidélité appliquée |

💡 **Astuce :** Ne touchez pas aux cases TVA et TTC : elles se calculent automatiquement à partir du montant HT. Corrigez le HT si le total est faux.
⚠️ **Attention :** Six champs sont obligatoires (Client, N° Affaire, Date facture, Date d'échéance, Désignation, Montant HT). La TVA est fixée à 20 %.

## Nouvelle facture fournisseur / sous-traitant
**Quand l'utiliser :** Pour saisir une facture reçue d'un fournisseur ou d'un sous-traitant, que l'entreprise doit régler.
**Où le trouver :** Onglet « Facturation » › sous-onglet « Factures fournisseurs / sous-traitants » › bouton « Nouvelle facture fournisseur / ST » (ouvre une fenêtre).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type | liste déroulante (Fournisseur, Sous-traitant) | Oui | Précisez si la facture vient d'un fournisseur ou d'un sous-traitant. | Fournisseur |
| N° Facture | texte | Non | Le numéro imprimé sur la facture reçue. | FOURN-2026-0231 |
| Fournisseur / Sous-traitant | texte | Oui | La raison sociale (nom) de l'entreprise qui a émis la facture. | ACIERS DE L'EST SARL |
| Date facture | date | Non | La date d'émission de la facture reçue (se remplit à la date du jour par défaut). | 03/06/2026 |
| Échéance | date | Non | La date limite avant laquelle vous devez payer. | 03/07/2026 |
| Montant HT | nombre | Oui | Le montant hors taxes de la facture. Le TTC se calcule tout seul. | 1250.00 |
| TVA % | nombre | Non | Le taux de TVA. Laissé à 20 si vous ne le changez pas. | 20 |
| Montant TTC | nombre (calculé) | Non | Se remplit automatiquement (HT + TVA). Affiche « auto » tant que le HT n'est pas saisi. | 1500.00 |
| Compte de charge | liste déroulante (601100 – Matières premières, 604100 – Sous-traitance, 606100 – Consommables, 606300 – Énergie, 615000 – Entretien/maintenance, Autres) | Non | Range la dépense dans la bonne catégorie comptable. | 601100 – Matières premières |
| Notes | texte | Non | Commentaire libre sur la facture. | Livraison partielle |
| Soumettre cette facture à la validation de la Direction | case à cocher | Non | Si cochée, la facture part en validation auprès de la Direction avant d'être payée. | (cochée) |

💡 **Astuce :** Le montant TTC se recalcule automatiquement dès que vous modifiez le HT ou le taux de TVA.
⚠️ **Attention :** Le nom du fournisseur/ST et le montant HT sont obligatoires : sans eux, l'enregistrement est refusé.

## Grand Livre — recherche et export FEC
**Quand l'utiliser :** Pour retrouver une écriture comptable, filtrer par journal, ou exporter les écritures d'une année pour l'expert-comptable / Sage.
**Où le trouver :** Onglet « Grand Livre » (barre de filtres en haut du tableau).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Rechercher compte / libellé | recherche (liste) | Non | Tapez un numéro de compte ou un mot du libellé pour filtrer les lignes affichées. | 411100 ou « Dassault » |
| Année d'exercice | nombre | Non | L'année dont vous voulez exporter les écritures (utilisée par le bouton Export FEC). | 2026 |

💡 **Astuce :** Les boutons de journaux (Tous journaux, VTE, ACH, BQ, OD, SAL) au-dessus filtrent le tableau par type d'écriture ; le bouton « Export FEC (Sage) » génère le fichier importable chez l'expert-comptable.
⚠️ **Attention :** Ce n'est pas un formulaire de saisie d'écriture : les écritures se créent automatiquement à partir des factures. Ici vous ne faites que rechercher, filtrer et exporter.

## Simulateur Coût de Revient (Bureau d'Études)
**Quand l'utiliser :** Pour estimer le coût de revient d'une pièce et le prix de vente suggéré, avant de faire une offre de prix.
**Où le trouver :** Page « Coûts de revient » (menu Finances & Coûts) › bouton « Simuler CR » en haut à droite (ouvre une fenêtre).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Activité | liste déroulante (Seem, Semrac) | Oui | La société / activité concernée par la pièce. | Seem |
| Référence pièce | texte | Non | Le repère ou la référence de la pièce simulée. | DISSIP-42 |
| Quantité | nombre | Non | Le nombre de pièces de la commande (par défaut 100). | 100 |
| Opération | texte | Non | Le nom de l'étape de fabrication (une ligne par opération de la gamme). | Usinage |
| Temps (min) | nombre | Non | La durée de l'opération, en minutes. | 15 |
| Taux MO (€/h) | nombre | Non | Le coût horaire chargé de l'opérateur (par défaut 26,83). | 26.83 |
| Coût machine (€/h) | nombre | Non | Le coût horaire de la machine utilisée (0 si opération manuelle). | 18.50 |
| Matière (€/pièce) | nombre | Non | Le coût de la matière pour une pièce. | 5.50 |
| Frais généraux (%) | nombre | Non | Le pourcentage de frais généraux ajouté (par défaut 12). | 12 |
| Coefficient de vente | nombre | Non | Le multiplicateur appliqué au coût pour obtenir le prix de vente (par défaut 1,35). | 1.35 |

💡 **Astuce :** Cliquez sur « Ajouter une opération » pour ajouter autant de lignes de gamme que nécessaire, puis « Calculer CR » pour voir le coût de revient et le prix de vente suggéré.
⚠️ **Attention :** C'est un outil de simulation : rien n'est enregistré en base, il sert uniquement à chiffrer une offre.

## Taux horaires opérateurs (tableau modifiable)
**Quand l'utiliser :** Pour ajuster le taux brut et le taux de charges sociales de chaque opérateur, qui servent au calcul des coûts.
**Où le trouver :** Page « Taux horaires opérateurs » (menu Finances & Coûts) — les cases se modifient directement dans le tableau, puis bouton « Enregistrer ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Taux brut (€/h) | nombre | Non | Le salaire horaire brut de l'opérateur, avant charges. | 17.50 |
| Charges (%) | nombre | Non | Le pourcentage de charges sociales (généralement 45 %). | 45 |

💡 **Astuce :** Le « Taux chargé », le « Coût journée » et le « Coût annuel » se recalculent tout seuls dès que vous changez le taux brut ou les charges. Pensez à cliquer « Enregistrer » pour sauver vos modifications.
⚠️ **Attention :** Ces taux alimentent directement le calcul du coût de revient : une erreur ici fausse tous les chiffrages.

## Imputations des temps — filtre du jour
**Quand l'utiliser :** Pour consulter les temps pointés (imputations) d'une journée donnée.
**Où le trouver :** Page « Imputations des temps » (menu Finances & Coûts), à côté du titre « Imputations du jour ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Date | date | Non | La journée dont vous voulez voir les imputations (par défaut, aujourd'hui). | 04/07/2026 |

💡 **Astuce :** Le bouton « Valider tout » valide les pointages de la journée affichée ; « Exporter » génère un fichier des imputations.
⚠️ **Attention :** Cette page ne saisit pas de temps : les imputations remontent automatiquement quand les opérateurs soldent leurs bons de travail (BDT).
