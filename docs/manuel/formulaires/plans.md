# Formulaires — Plan / Batiment · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Nouveau plan
**Quand l'utiliser :** Pour créer un nouveau plan de bâtiment (par exemple le plan d'un atelier ou d'un site) avant d'y déposer ses zones et ses objets.
**Où le trouver :** Onglet « Maquette », bouton « Nouveau plan » en haut de la page. Une petite fenêtre de saisie s'ouvre.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nom du plan | texte | Oui | Le nom qui identifiera ce plan dans la liste des plans. Choisissez un nom clair. | Atelier SEEM — rez-de-chaussée |

💡 **Astuce :** Une fois le plan créé, il est automatiquement sélectionné. Passez ensuite en mode « Modifier » pour charger l'image de fond, puis dessiner vos zones.
⚠️ **Attention :** Si vous laissez le nom vide et validez, rien n'est créé.

## Remplacer le fond du plan (image)
**Quand l'utiliser :** Pour afficher une image de fond (le plan réel du bâtiment) sous la maquette, ou pour remplacer une image existante par une plus récente.
**Où le trouver :** Onglet « Maquette », après avoir cliqué sur « Modifier ». La barre grise « Fond » apparaît : choisissez un fichier puis cliquez « Remplacer l'image ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Fond (choisir un fichier) | fichier | Oui | L'image du plan à afficher. Formats acceptés : PNG, JPG, JPEG, WEBP, GIF, SVG. | plan-atelier.png |

💡 **Astuce :** Après avoir choisi le fichier, n'oubliez pas de cliquer sur « Remplacer l'image » pour lancer l'envoi.
⚠️ **Attention :** Le fond doit être une **image** (PNG, JPG…), pas un PDF. Il faut avoir sélectionné un plan avant de pouvoir charger une image.

## Fiche d'un élément (zone ou objet)
**Quand l'utiliser :** Pour renseigner ou modifier un repère du plan : une zone (rectangle, ex. un local) ou un objet posé dedans (une machine, un produit, un extincteur…). Sert à lui donner un nom, une couleur, et à le relier à une fiche de la base (machine, chimie, ATEX…).
**Où le trouver :** Onglet « Maquette », en mode « Modifier ». Dessinez une zone ou posez un objet, ou cliquez sur un repère existant : le panneau « Élément » s'ouvre à droite.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Zone | (information affichée) | Non | Pour un objet, indique automatiquement dans quelle zone (rectangle) il se trouve. Vous ne le saisissez pas : déplacez le repère dans un rectangle pour changer sa zone. | Z1 — Dissipation / Tronçonnage |
| Catégorie | liste déroulante (Atelier / Process ; Bureau / Local ; Logistique / Stock ; Utilité / Technique ; Social / Sanitaire ; Zone ATEX ; Machine / Équipement ; Produit périssable ; Chimie / FDS ; Sécurité (extincteur…) ; Autre / Point) | Oui | Le type du repère. Les cinq premières et « Zone ATEX » sont des zones (rectangles) ; les autres sont des objets (points) posés dans une zone. | Machine / Équipement |
| Élément lié (base) | recherche (liste) | Non | Relie le repère à une fiche réelle de l'ERP (une machine, une zone ATEX, un produit chimique, un périssable, une vérification…). Tapez pour rechercher, puis choisissez dans la liste proposée. La liste dépend de la catégorie choisie. | Presse hydraulique [M-014] |
| Libellé | texte | Non | Le nom affiché sur le repère et dans la liste. S'il est vide et qu'un élément est relié, le nom de la fiche est repris automatiquement. | Presse hydraulique |
| Couleur | couleur | Non | La couleur du repère sur le plan. Une couleur par défaut est proposée selon la catégorie. | (nuancier) |
| Notes | texte | Non | Un commentaire libre sur ce repère (précision, remarque). | Contrôle prévu en mars |

💡 **Astuce :** Après avoir renseigné les champs, cliquez « Appliquer » puis « Enregistrer » (bouton vert en haut) pour sauvegarder la maquette. « Appliquer » seul ne suffit pas à enregistrer.
⚠️ **Attention :** Si vous tapez un élément lié qui ne correspond à aucune fiche de la liste, il ne sera pas relié — sélectionnez-le bien dans la liste déroulante proposée.

## Créer une zone ATEX depuis le plan
**Quand l'utiliser :** Pour créer une nouvelle zone à risque d'explosion (ATEX) directement depuis le plan, quand elle n'existe pas encore dans le module Sécurité, et la relier au repère.
**Où le trouver :** Fiche d'un élément (panneau « Élément ») dont la catégorie est « Zone ATEX » : cliquez « Créer dans l'ERP (Sécurité) ». Un petit encadré de saisie apparaît.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nom de la zone ATEX | texte | Oui | Le nom de la zone à risque d'explosion. | Local peinture |
| Type de zone (0/1/2/20/21/22) | liste déroulante (0 ; 1 ; 2 ; 20 ; 21 ; 22) | Non | Le classement réglementaire de la zone ATEX (les numéros 0/1/2 concernent les gaz, 20/21/22 les poussières). | 1 |
| Localisation | texte | Non | Où se situe cette zone dans le bâtiment. | Atelier oxydation, mur nord |

💡 **Astuce :** Une fois créée, la zone est enregistrée dans le module Sécurité et automatiquement reliée au repère. Pensez ensuite à « Enregistrer » le plan.
⚠️ **Attention :** Sans le nom, la création est refusée.

## Créer une vérification (VGP / sécurité) depuis le plan
**Quand l'utiliser :** Pour créer une nouvelle vérification périodique (extincteur, levage, appareil sous pression…) directement depuis le plan et la relier au repère « Sécurité ».
**Où le trouver :** Fiche d'un élément (panneau « Élément ») dont la catégorie est « Sécurité (extincteur…) » : cliquez « Créer dans l'ERP (Sécurité) ». Un petit encadré de saisie apparaît.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Équipement (ex : Extincteur hall A) | texte | Oui | Le nom de l'équipement à vérifier. | Extincteur hall A |
| Type de vérification | liste déroulante (Incendie / extincteur ; Levage ; Électrique ; ESP (sous pression) ; Portes / portails ; Racks ; Ventilation ; ATEX) | Non | La nature de la vérification périodique concernée. | Incendie / extincteur |
| Organisme de contrôle | texte | Non | Le nom de l'organisme qui réalise la vérification. | APAVE |

💡 **Astuce :** Après création, la vérification apparaît dans le module Sécurité et est reliée au repère. Enregistrez ensuite le plan.
⚠️ **Attention :** Sans le nom de l'équipement, la création est refusée.
