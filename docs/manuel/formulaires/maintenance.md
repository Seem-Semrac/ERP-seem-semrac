# Formulaires — Maintenance · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Ordre de maintenance (OM)
**Quand l'utiliser :** pour décrire, suivre et clôturer une intervention sur une machine (panne réparée, réglage, contrôle…).
**Où le trouver :** onglet « Interventions / OM » → dans le tableau « Ordres de maintenance en cours », bouton « Ouvrir » sur la ligne de l'OM. La fenêtre « Ordre de maintenance » s'affiche.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Titre | texte | Non | Résumé court de l'intervention, en une ligne. | Remplacement courroie broche |
| Description / diagnostic | zone de texte | Non | Explique le problème constaté et ce qui a été fait. | Bruit anormal à la mise en route, courroie usée détectée |
| Priorité | liste déroulante (Normale, Urgente, Critique) | Non | Indique le degré d'urgence de l'intervention. | Urgente |
| Statut | liste déroulante (Ouvert, En cours, En attente) | Non | Où en est l'intervention. « En attente » = on attend une pièce. | En cours |
| Responsable | recherche (liste) | Non | Personne qui pilote l'intervention. On tape le nom, une liste des salariés est proposée. | Marc Dubois |
| Intervenant | recherche (liste) | Non | Personne qui réalise concrètement la réparation (même liste que Responsable). | Ali Bennani |
| Coût réel (€) | nombre | Non | Coût total réel de l'intervention (main d'œuvre + pièces). | 320 |
| Pièces utilisées | texte | Non | Liste des pièces posées pendant l'intervention. | 1 courroie A38, 2 roulements |
| Cause racine | texte | Non | La vraie cause du problème, pour éviter qu'il revienne. | Défaut d'alignement de la poulie |
| Observations | zone de texte | Non | Remarques libres, conseils pour la prochaine fois. | Prévoir contrôle tension tous les 6 mois |

💡 **Astuce :** le bouton « Enregistrer » sauvegarde sans terminer l'intervention. Le bouton « Clôturer l'intervention » termine l'OM : la machine est remise en service et le temps de réparation (MTTR) est calculé automatiquement.
⚠️ **Attention :** un OM peut être créé automatiquement, sans passer par ce formulaire, avec le bouton « Créer un OM » sur une machine en panne (il suffit de choisir la machine, aucun champ à saisir). Vous complétez ensuite les cases via « Ouvrir ».

## Ajouter une pièce de rechange (PDR)
**Quand l'utiliser :** pour enregistrer une pièce de rechange rattachée à une machine (stock, fournisseur, usure).
**Où le trouver :** onglet « Pièces & PDR » → choisir d'abord une machine dans la liste « Machine : », puis remplir le bloc « Ajouter une pièce de rechange » et cliquer « Ajouter la pièce ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Machine | liste déroulante (liste des machines de l'atelier) | Oui | Machine à laquelle la pièce appartient. À choisir en haut avant de saisir. | Tour CN Mazak (M-012) |
| Désignation | texte | Oui | Nom clair de la pièce. | Courroie trapézoïdale A38 |
| Référence | texte | Non | Référence catalogue ou fabricant de la pièce. | A38-XPZ |
| Fournisseur | recherche (liste) | Non | Qui fournit la pièce. Les fournisseurs déjà saisis sont proposés. | RS Components |
| Prix unitaire (€) | nombre | Non | Prix d'achat d'une pièce. | 24.50 |
| Stock actuel | nombre | Non | Combien de pièces sont en magasin aujourd'hui. | 4 |
| Stock mini | nombre | Non | Seuil d'alerte : en dessous, il faut recommander. | 2 |
| Emplacement | texte | Non | Où trouver la pièce dans le magasin. | Magasin / casier B12 |
| Durée de vie conseillée (h) | nombre | Non | Nombre d'heures de fonctionnement avant remplacement conseillé (utilisé par le plan préventif). | 2000 |
| Dernier remplacement | date | Non | Date du dernier changement de la pièce ; sert de point de départ au compteur d'usure. | 2026-03-15 |

💡 **Astuce :** remplir « Durée de vie conseillée » et « Dernier remplacement » permet à l'onglet « Plan Préventif » de calculer tout seul les heures restantes avant le prochain changement.
⚠️ **Attention :** la « Désignation » est obligatoire, et il faut avoir choisi une machine : sans machine ou sans désignation, l'ajout est refusé.

## Demande d'achat — Maintenance
**Quand l'utiliser :** pour demander l'achat d'un article ou d'une pièce ; la demande part vers le service Achats.
**Où le trouver :** bouton « Demande d'achat » en haut à droite de l'écran Maintenance (dans la bannière du service).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Article / Désignation | texte | Oui | Ce que vous voulez acheter, décrit clairement. | Roulement à billes 6204 2RS |
| Type | liste déroulante (Matière, Outillage, Consommable, Chimique, EPI / Sécurité, Pièce détachée, Sous-traitance, Autre) | Non | Catégorie de l'achat, pour aider les Achats à traiter. | Pièce détachée |
| Quantité | texte | Non | Combien vous en voulez (avec l'unité). | 10 u |
| Fournisseur pressenti | recherche (liste) | Non | Fournisseur suggéré, si vous en avez un en tête (facultatif). | SKF |
| Priorité | liste déroulante (Normal, Urgent, Critique) | Non | Degré d'urgence de la demande. | Urgent |
| Livraison souhaitée | date | Non | Date à laquelle vous aimeriez recevoir l'article. | 2026-07-20 |
| Soumettre cette demande à la validation de la Direction (DA libre / investissement) | case à cocher | Non | Cochez si la demande doit être validée par la Direction avant traitement. | (cochée) |

💡 **Astuce :** cette demande est « libre » (non rattachée à une commande) ; elle est simplement transmise aux Achats pour traitement.
⚠️ **Attention :** l'« Article / Désignation » est obligatoire ; sans lui, la demande ne peut pas être envoyée.
