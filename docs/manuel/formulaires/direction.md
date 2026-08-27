# Formulaires — Direction · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

Le service Direction est un **cockpit de pilotage** : la plupart des écrans affichent des chiffres et des tableaux, sans rien à saisir. Les seuls moments où vous remplissez ou choisissez quelque chose sont regroupés ci-dessous.

## Décision sur une demande à valider (Valider / Refuser)
**Quand l'utiliser :** pour accepter ou rejeter une demande qui attend l'accord de la Direction (dépense, décision d'un service, etc.).
**Où le trouver :** onglet « À valider », dans le grand tableau « File à valider », colonne de droite de chaque ligne — bouton vert (coche) pour valider, bouton rouge (croix) pour refuser.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Décision | deux boutons (bouton vert = valider / bouton rouge = refuser) | Oui | Cliquez le bouton vert pour approuver la demande, le bouton rouge pour la rejeter. | Valider |
| Motif du refus | zone de texte (fenêtre qui s'ouvre) | Oui (uniquement si vous refusez) | Une petite fenêtre s'ouvre quand vous refusez : écrivez pourquoi vous rejetez. Sert de trace pour le service concerné. | « Budget dépassé, à revoir au prochain trimestre » |

💡 **Astuce :** valider ne demande aucune saisie, c'est un simple clic. Le motif n'est demandé qu'en cas de refus.
⚠️ **Attention :** si vous refusez et laissez le motif vide (ou cliquez Annuler dans la fenêtre), le refus n'est pas enregistré. Le motif est obligatoire pour refuser.

## Trier la file à valider
**Quand l'utiliser :** pour réorganiser la liste des demandes en attente, par date ou par montant.
**Où le trouver :** onglet « À valider », en haut à droite du bloc, menu « Trier : ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Trier | liste déroulante (Plus récent, Montant ↓) | Non | Choisit l'ordre d'affichage : « Plus récent » met les demandes les plus récentes en haut ; « Montant ↓ » met les plus gros montants en haut. | Montant ↓ |

💡 **Astuce :** utilisez « Montant ↓ » pour repérer d'abord les grosses dépenses à arbitrer.

## Filtrer la file par service
**Quand l'utiliser :** pour n'afficher que les demandes d'un service précis (par exemple ne voir que les demandes de la Compta ou du RH).
**Où le trouver :** onglet « À valider », juste au-dessus du grand tableau, la rangée de pastilles (« Tous », « Compta », « RH », « Qualité », « Sécurité », « Achats », « Commercial »).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Service | pastilles à cliquer (Tous, Compta, RH, Qualité, Sécurité, Achats, Commercial) | Non | Cliquez une pastille pour ne garder que les demandes de ce service ; « Tous » réaffiche tout. Seuls les services ayant au moins une demande en attente apparaissent. | Compta |

💡 **Astuce :** combinez ce filtre avec le tri par montant pour arbitrer service par service.

## Décision sur un paiement de facture (Valider / Refuser)
**Quand l'utiliser :** pour autoriser ou refuser le paiement d'une facture fournisseur/client en attente.
**Où le trouver :** onglet « À valider », bloc « Paiements de factures », bouton « Valider » ou bouton croix rouge sur chaque carte.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Décision | deux boutons (bouton « Valider » / croix rouge) | Oui | Cliquez « Valider » pour autoriser le paiement, la croix rouge pour le refuser. Aucune autre saisie n'est demandée. | Valider |

⚠️ **Attention :** la décision est enregistrée immédiatement au clic, il n'y a pas d'écran de confirmation.

## Décision sur un congé (fonctions support)
**Quand l'utiliser :** pour approuver ou refuser une demande de congé d'un salarié des fonctions support.
**Où le trouver :** onglet « À valider », bloc « Congés fonctions support », bouton « Valider » ou bouton croix rouge sur chaque carte.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Décision | deux boutons (bouton « Valider » / croix rouge) | Oui | Cliquez « Valider » pour accorder le congé (les jours sont alors posés automatiquement au planning), la croix rouge pour le refuser. | Valider |

💡 **Astuce :** quand vous validez, un message vous indique combien de jours de congé ont été posés au planning.

## Scanner les alertes
**Quand l'utiliser :** pour demander à l'outil de rechercher automatiquement les problèmes (retards, impayés, non-conformités critiques, stocks critiques, marges faibles) et de les ajouter à la file à valider.
**Où le trouver :** onglet « À valider », bouton « Scanner les alertes » en haut à droite.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Scanner les alertes | bouton d'action | Non | Un simple clic lance la détection. Aucune saisie. À la fin, un message indique combien d'alertes ont été ajoutées à la file. | (clic) |

💡 **Astuce :** relancez-le régulièrement pour que la file à valider reste à jour. Les alertes déjà présentes ne sont pas ajoutées en double.
