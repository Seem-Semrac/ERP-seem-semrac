# Formulaires — Bureau Etudes · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Éditeur de nomenclature — Identification
**Quand l'utiliser :** Pour décrire une pièce (ou un assemblage) : son nom, son plan, son poids, avant de saisir la matière, les fournitures et la gamme de fabrication.
**Où le trouver :** Onglet « Nomenclatures » → bouton « Nouvelle nomenclature standard » (ou « Nouvelle mère »), ou « Ouvrir » sur une ligne existante. Bloc « Identification ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° Nomenclature = réf. pièce | texte | Oui | Le numéro qui identifie la pièce. C'est aussi la référence de la pièce. | SEEM-DISSIP-A24 |
| N° Affaire (optionnel) | texte | Non | Le numéro d'affaire du client, si la pièce est liée à une commande précise. Laissez vide pour une pièce « libre ». | 2026-081 |
| Entité | liste déroulante (Seem, Semrac) | Oui | Choisissez l'usine concernée : Seem ou Semrac. | Seem |
| Type de nomenclature | boutons (Standard (1 pièce), Mère (assemblage)) | Non | « Standard » = une seule pièce. « Mère » = un assemblage de plusieurs standards. Par défaut : Standard. | Standard (1 pièce) |
| Code produit | texte | Non | Un code produit interne. Si vous ne mettez rien, le N° de nomenclature est repris par défaut. | SEEM-DISSIP-A24-001 |
| Description produit | texte | Non | Le nom complet et lisible du produit. | Dissipateur aluminium 150mm |
| N° de plan | texte | Non | Le numéro du plan technique de la pièce, avec son indice. | PL-138001 ind. A |
| Nom du fichier CAO | texte | Non | Le nom du fichier de dessin informatique (CAO). Se remplit tout seul si vous joignez un plan CAO plus bas. | PL-138001_A.pdf |
| Masse pour 1 pc (g) | nombre | Non | Le poids d'une seule pièce, en grammes. | 320 |
| Dimensions pour 1 pc | texte | Non | Les dimensions d'une pièce (largeur, hauteur, épaisseur). | 150 × 80 × 20 mm |
| Surface totale pour 1 pc (mm²) | nombre | Non | La surface d'une pièce en mm². Sert au calcul de charge des balancelles de traitement de surface (OAS). | 24000 |
| Analyste (Créé par) | liste déroulante | Non | La personne qui crée la nomenclature — à choisir dans la liste des **utilisateurs ayant les droits BE** (plus de saisie libre). | Joël Martin |
| Notes | texte | Non | Toute remarque utile sur la pièce. | Ébavurage soigné exigé |

💡 **Astuce :** Le bouton « Standard / Mère » en haut à droite de la liste vous permet de basculer entre une pièce simple et un assemblage.
⚠️ **Attention :** Le « N° Nomenclature » et l'« Entité » sont obligatoires : sans eux, l'enregistrement est refusé.

## Éditeur de nomenclature — Composants (assemblage « mère »)
**Quand l'utiliser :** Uniquement pour une nomenclature de type « Mère » : pour lister les pièces standard qui composent l'assemblage et leur quantité.
**Où le trouver :** Éditeur de nomenclature, type « Mère (assemblage) » activé → encadré jaune « Composants » → bouton « Ajouter un standard ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Standard | liste déroulante (les nomenclatures standard existantes, format « N° NOM · Code produit ») | Non | Choisissez la pièce standard à ajouter à l'assemblage. Son prix se reprend automatiquement. | SEEM-CAPOT-A24 · CAPOT-001 |
| Quantité | nombre | Non | Combien de fois cette pièce entre dans l'assemblage. | 2 |

💡 **Astuce :** Le total des composants s'affiche en bas de l'encadré et alimente le prix de revient de la mère.
💡 **À la réouverture**, la fiche est relue en base : ses composants réapparaissent, et « Enregistrer » sans y toucher les conserve.
⚠️ **Attention :** Pour retirer des composants, cliquez leur croix puis enregistrez. Si l'ERP répond « Enregistrement refusé : cette nomenclature compte N composant(s) en base et la liste envoyée est vide », fermez et rouvrez la fiche pour recharger ses composants.

## Éditeur de nomenclature — Matière (tôle)
**Quand l'utiliser :** Pour indiquer la ou les matières premières (tôle) qui servent à fabriquer la pièce, et obtenir leur prix.
**Où le trouver :** Éditeur de nomenclature, **colonne de droite, tout en haut** (au-dessus des étapes), encadré « Matière (tôle) » → bouton « Ajouter matière ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Réf. matière | recherche (liste déroulante filtrée) | Non | La référence de la tôle. Tapez quelques lettres : la liste propose **tout le catalogue matière, tous fournisseurs confondus** (majuscules et accents sans importance). Choisir une entrée remplit aussi la désignation. La saisie libre est permise. | TOLE-ALU-2MM |
| Désignation | recherche (liste déroulante filtrée) | Non | Le nom de la matière. **La recherche marche aussi ici** : « tole alu » propose « Tôle aluminium ». Choisir une entrée remplit aussi la référence. | Tôle aluminium 2 mm |
| Pc/tôle | nombre | Non | Combien de pièces on tire d'une seule tôle (dépend de l'imbrication, c'est le BE qui le sait). Sert à répartir le prix de la tôle par pièce. | 12 |
| Prix estimé / pièce | calculé (non saisissable) | — | **Moyenne du prix d'une tôle chez tous les fournisseurs** qui portent la référence, ÷ Pc/tôle. Sous la valeur : « n fourn. · min–max €/tôle ». Survolez pour le détail, **cliquez** pour l'ouvrir en grand (fournisseur, prix, date). | 3,1200 € |
| *(bouton)* Demande de prix | bouton | — | Disponible **à tout moment**. Gris à côté d'un prix récent, **orange** si un prix a plus de 6 mois ou s'il n'y en a aucun ; sablier « vérifier » quand une demande est en cours. | — |
| *(bouton)* × | bouton | — | Retire la ligne. | — |

💡 **Il n'y a plus de case Fournisseur** : une ligne désigne une **référence**, et son prix est la moyenne des fournisseurs qui la portent (voir le [manuel du Bureau d'études](../be.md), « Comprendre le prix estimé / pièce »).
⚠️ **Attention :** une **même référence ne peut figurer qu'une seule fois** dans la nomenclature, matière et accessoires confondus. La ligne en double est refusée avec un message qui indique où est l'autre.
💡 **Couleurs du prix :** normal = à jour · **orange** = un prix a plus de 6 mois, ou le prix affiché vient d'une ancienne saisie (hors catalogue) · **rouge « coût incomplet »** = aucun prix connu (vous pouvez quand même enregistrer et valider).

## Éditeur de nomenclature — Accessoires
**Quand l'utiliser :** Pour lister les fournitures achetées (visserie, joints, etc.) qui entrent dans la pièce.
**Où le trouver :** Éditeur de nomenclature, **colonne de droite**, encadré « Accessoires » → bouton « Ajouter accessoire ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Réf catalogue | recherche (liste déroulante filtrée) | Non | La référence de l'accessoire, cherchée dans **tout le catalogue accessoires, tous fournisseurs confondus**. Saisie libre permise. | 136290 |
| Désignation | recherche (liste déroulante filtrée) | Non | Le nom de l'accessoire. La recherche marche aussi ici ; choisir une entrée remplit la référence. | Ecrou CLS M3-1 |
| Nb/pièce | nombre | Non | Le nombre d'accessoires nécessaires **par pièce fabriquée**. | 4 |
| Prix estimé / pièce | calculé (non saisissable) | — | **Moyenne du prix d'UNE pièce chez tous les fournisseurs** (prix du paquet ÷ quantité par paquet de chacun) × Nb/pièce. Badge « n fourn. · min–max €/pce » ; clic = détail par fournisseur. | 0,4400 € |
| *(bouton)* Demande de prix · × | boutons | — | Mêmes règles que pour la matière. | — |

💡 **La « Qté/paquet » ne se saisit plus ici** : elle est déclarée **au catalogue**, par fournisseur — onglet **Références** (bouton « Éditer ») ou *Achats › Fournisseurs › fiche › Références fournies*. C'est ce qui permet de comparer un paquet de 100 et un paquet de 50.
⚠️ **« cond. ? » en orange** sous le prix = un fournisseur a un prix mais **personne n'a déclaré la quantité de son paquet** : son prix est compté **comme un prix à la pièce**. Déclarez-la, sinon la moyenne peut être fausse d'un facteur 100.
💡 **Ancienne nomenclature :** une fiche qui portait encore un fournisseur et une quantité par paquet s'affiche **avec le nouveau calcul** (mention « ancien modèle » dans le détail) ; elle ne bascule réellement qu'au prochain enregistrement que vous ferez.

## Éditeur de nomenclature — Étapes de production (gamme)
**Quand l'utiliser :** Pour décrire la suite des opérations de fabrication (usinage, pliage, sous-traitance…) et leurs temps.
**Où le trouver :** Éditeur de nomenclature, colonne de droite, encadré « Étapes de production » → bouton « Ajouter étape ». Les étapes se réordonnent en les glissant.

Les cases à choisir sont dans l'ordre : **1) Type → 2) Poste → 3) Process**.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type | liste déroulante (Interne, Sous-traité) | Non | **1ʳᵉ case.** Précise si l'étape est faite dans l'atelier (Interne) ou envoyée dehors (Sous-traité). | Interne |
| Poste | liste déroulante (les postes d'atelier, si interne ; le sous-traitant, si sous-traité) | Non | **2ᵉ case.** Le poste de l'atelier où se fait l'opération (interne), ou le sous-traitant (sous-traité). Choisir le poste **filtre** les process proposés. | Poinçonnage |
| Process | liste déroulante (**uniquement les process rattachés au poste choisi**, si interne ; les opérations du sous-traitant, si sous-traité) | Non | **3ᵉ case.** Le process interne (avec sa machine liée) parmi ceux du poste, ou l'opération tarifée du sous-traitant. **Choisissez d'abord un poste.** Sous le process, l'origine du coût horaire : « Machine · 48,00 €/h », « Machine · taux à saisir », « Manuel · homme au coût chargé RH ». | Cisaillage · Cisailleuse |
| N° programme machine | texte | Non | Apparaît pour une étape machine : le numéro du programme, imprimé sur l'OF. | PGM-4521 |
| Fichier programme (.nc, .mpf...) | texte | Non | Le nom du fichier du programme d'usinage. | dissip_op10.mpf |
| ROP ‰h | nombre | Non | Réglage **homme** (fait par l'opérateur), en millièmes d'heure (1000 = 1 h). Compté une seule fois par lot, au coût chargé RH. | 500 |
| RGM ‰h | nombre | Non | Réglage **machine**, en millièmes d'heure. Compté une seule fois par lot, **en homme et en machine** (l'opérateur est sur la machine) : coût chargé RH + taux horaire machine du process. Sur un process manuel, il compte en homme seulement. | 1000 |
| MO ‰h | nombre | Non | Temps **homme** par pièce, en millièmes d'heure (1000 = 1 h), au coût chargé RH moyen du site. | 100 |
| Mach ‰h | nombre | Non | Temps **machine** par pièce, en millièmes d'heure, au taux horaire machine du process. Grisé pour un process manuel. | 200 |
| €/pc (prix pièce ST) | nombre | Non | Pour une étape sous-traitée : le prix payé par pièce au sous-traitant. Se remplit depuis le tarif choisi. | 3,20 € |

💡 **Astuce :** Les temps se saisissent en millièmes d'heure : 1000 = 1 heure, 500 = 30 minutes. Exemple (lot de 10, machine à 60 €/h, coût chargé 35 €/h) : ROP 500 + RGM 1000 + MO 100 + Mach 200 → 2,5 h homme (87,50 €) + 3 h machine (180 €) = 267,50 € le lot.
⚠️ **Attention :** En « Sous-traité », les cases de temps (réglage, MO, machine) sont grisées : le coût vient du prix par pièce du sous-traitant. Un process « manuel » grise la case temps machine ; choisir un process manuel sur une étape qui avait du temps machine le reverse en temps homme. Les taux ne se saisissent pas ici : taux horaire machine sur le process (Production), coût chargé dans la fiche salarié (RH).

## Éditeur de nomenclature — Documents joints (GED)
**Quand l'utiliser :** Pour joindre les plans et programmes de la pièce (plan client, plan CAO, programmes machine).
**Où le trouver :** Éditeur de nomenclature, colonne de gauche, encadré « Documents (GED) ». Disponible une fois la nomenclature enregistrée.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Plan client | fichier | Non | Le plan fourni par le client (PDF, image, DWG…). Cliquez « Joindre » après avoir choisi le fichier. | plan_client_138001.pdf |
| Plan CAO | fichier | Non | Le fichier de dessin 3D/CAO (STEP, STL, PDF…). | dissip.step |
| Programmes FAO (par étape machine) | fichier | Non | Le programme d'usinage (.nc, .mpf…) rattaché à une étape machine précise de la gamme. | dissip_op10.nc |

⚠️ **Attention :** Il faut d'abord enregistrer la nomenclature en brouillon, puis la rouvrir, pour pouvoir joindre des fichiers.

## Éditeur de nomenclature — Journal des modifications (EN 9100)
**Quand l'utiliser :** Pour savoir qui a modifié une nomenclature validée, quand, et ce qui a changé (exigence de traçabilité EN 9100).
**Où le trouver :** Éditeur de nomenclature, sous l'encadré « Validation » : carte « Journal des modifications · EN 9100 ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Portée | liste | Non | « Cette révision » (l'indice ouvert) ou « Toutes les révisions » (tous les indices de la pièce). | Toutes les révisions |

Chaque entrée affiche l'événement (Création, Validation, Modification, Dévalidation, Préparation technique, Nouvel indice, Document ajouté / retiré, Référence client, Suppression), la date et l'heure, l'auteur (nom et matricule du compte connecté), l'indice, puis la liste des changements « champ : avant → après ». Survolez une valeur pour la lire en entier ; survolez un élément ajouté ou retiré pour voir sa définition complète.

💡 **Astuce :** Rien à saisir : le journal se remplit tout seul à chaque enregistrement d'une nomenclature validée. Un ré-enregistrement sans changement n'ajoute rien.
⚠️ **Attention :** Le journal ne se modifie pas et ne s'efface pas. Un message orange « le journal EN 9100 n'a pas pu… » signifie que la modification est enregistrée mais pas tracée : prévenez l'administrateur. Un message « refusé pour garantir la traçabilité » signifie que rien n'a été enregistré ni supprimé : réessayez un instant plus tard.

## Créer une machine ou un process d'atelier
> **Ce n'est plus dans le Bureau d'Études.** Les boutons « + Machine » et « + Process » au-dessus de la gamme ont été **retirés**. Machines et process se créent (et se rattachent à un poste) **uniquement dans le service Production → onglet « Postes & Process »**. Dans la gamme du BE, vous ne faites que **choisir** un poste puis un de ses process. Si le process voulu n'existe pas encore, demandez à la Production de le créer et de le rattacher au bon poste.

## Nouveau fournisseur / sous-traitant
**Quand l'utiliser :** Pour créer un fournisseur (de matière/fournitures) ou un sous-traitant (opérations extérieures).
**Où le trouver :** Onglet « Références » → bouton « Fournisseur / Sous-traitant ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type | liste déroulante (Fournisseur, Sous-traitant) | Non | Précise s'il s'agit d'un fournisseur ou d'un sous-traitant. | Fournisseur |
| Code | texte | Non | Un code court d'identification. | FOU-042 |
| Nom | texte | Oui | La raison sociale (nom de l'entreprise). | Métaux Services SARL |
| Email | texte | Non | L'adresse email de contact. | contact@metaux.fr |
| Téléphone | texte | Non | Le numéro de téléphone. | 04 78 00 00 00 |
| Prestations (séparées par des virgules) | texte | Non | Apparaît pour un sous-traitant : la liste des opérations réalisées, séparées par des virgules. | Oxydation, Sérigraphie, Zingage |

⚠️ **Attention :** Le « Nom » est obligatoire. Le champ « Prestations » ne s'affiche que si le Type est « Sous-traitant ».

## Nouvelle entrée catalogue (et modification)
**Quand l'utiliser :** Pour ajouter un article (matière, accessoire, outillage…) au catalogue d'un fournisseur, **ou pour corriger une référence existante**.
**Où le trouver :** Onglet « Références » → bouton « Entrée catalogue » (pour ajouter) **ou** bouton **« Éditer »** sur une ligne de la liste (pour modifier). Le même formulaire s'ouvre, pré-rempli en cas de modification.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Fournisseur | liste déroulante (les fournisseurs existants) | Non | Le fournisseur qui vend cet article. | Métaux Services |
| Référence | texte | Oui | La référence de l'article au catalogue. | TOLE-ALU-2MM |
| Catégorie | liste déroulante (Matière, Accessoire, Outillage, Consommable, Chimique) | Non | La famille de l'article. | Matière |
| Désignation | texte | Oui | Le nom lisible de l'article. | Tôle aluminium 2 mm |
| Prix HT (optionnel) | nombre | Non | Le prix hors taxes : **prix d'UNE TÔLE** pour une matière, **prix du PAQUET** pour un accessoire (jamais le prix à la pièce, qui est calculé). Si vide, l'entrée reste « en attente de prix ». | 48,00 |
| Activité | liste déroulante (Les deux, Seem, Semrac) | Non | L'usine concernée. | Les deux |
| Quantité par paquet | nombre | Non | **Accessoires seulement** (la case n'apparaît que pour la catégorie « Accessoire ») : le nombre de **pièces** contenues dans le paquet auquel se rapporte le prix ci-dessus. Sans elle, le prix du paquet est compris comme un prix à la pièce dans toutes les nomenclatures. | 100 |

⚠️ **Attention :** La « Référence » et la « Désignation » sont obligatoires. Sans prix, l'article reste marqué « en attente de prix ».
💡 **En modification :** laissez le champ **Prix** vide pour ne **pas** toucher au prix existant (il reste piloté par les demandes de prix). Ne renseignez un prix ici que pour le fixer manuellement. Remettre le **même** prix ne change pas sa date.
⚠️ **Cases vides = inchangées** (depuis le 17/09/2026) : en modification, une case vide ne change rien (fournisseur, unité, délai, catégorie, activité). On ne peut donc plus vider un délai ni retirer le fournisseur d'une référence en effaçant la case.
💡 **Référence déjà au catalogue :** « Entrée catalogue » sur un couple fournisseur + référence qui existe déjà complète la ligne existante (pas de doublon) **sans changer sa catégorie ni son activité** — pour les changer, utilisez « Éditer ».
⚠️ **Deux fois la même référence chez le même fournisseur, c'est refusé** (message « Cette référence existe déjà chez ce fournisseur (à la casse près) : modifiez la ligne existante »). En revanche, la **même référence chez plusieurs fournisseurs est normale** : c'est elle qui fait la moyenne des prix.
💡 **Base pas encore à jour :** si l'ERP répond « *Référence enregistrée, sauf la quantité par paquet…* », tout le reste est bien enregistré — prévenez l'administrateur (script `cloud-13`).

## Nouvelle demande de prix (RFQ)
**Quand l'utiliser :** Pour demander au service Achats de chiffrer un ou plusieurs articles (matière, accessoire…). Un prix est à re-demander dès qu'il est **absent ou daté de plus de 6 mois**.
**Où le trouver — 3 accès, disponibles à tout moment :** onglet « Nomenclatures » (bouton sur **chaque** ligne matière / accessoire : gris à côté d'un prix récent, orange si le prix est ancien ou absent) · onglet « Analyse DT » (bouton « Demande de prix ») · onglet **« Références »** (bouton « Demande de prix » sur **chaque** ligne de catalogue, orange si le prix est absent ou périmé — la demande s'ouvre pré-remplie avec cette référence).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° affaire / DT à lier | texte | Non | Le n° d'affaire (ou de DT/nomenclature) concerné, pour **rattacher la demande à l'affaire**. **Laissé vide = demande libre** (non rattachée). | 2026-081 |
| Note (optionnel) | texte | Non | Une remarque libre pour le service Achats. | Urgent, besoin sous 5 jours |
| Référence | texte | Non | La référence de l'article à chiffrer (facultative). | TOLE-ALU-3MM |
| Désignation | texte | Oui | Le nom de l'article à chiffrer. C'est la seule case indispensable d'une ligne. | Tôle aluminium 3 mm |
| Qté est. | nombre | Non | La quantité estimée à chiffrer. | 50 |
| Catégorie | liste déroulante (Matière, Accessoires, Outils, Chimique, Consommable, Autres) | Non | La famille de l'article. | Matière |

💡 **Destinataires (depuis une ligne de nomenclature) :** la fenêtre s'ouvre pré-remplie et propose comme destinataires **tous les fournisseurs qui portent déjà cette référence**, cochés d'avance. Si personne ne la porte, choisissez librement. Plus vous en consultez, plus le prix estimé de la ligne sera juste : les Achats enregistrent **tous** les prix chiffrés, pas seulement celui du fournisseur retenu.
💡 **Astuce :** Cliquez « Ajouter un article » pour chiffrer plusieurs articles d'un coup. Le **demandeur** enregistré est **votre compte connecté** (pas besoin de le saisir). Le chiffrage se fait ensuite côté Achats, où l'on ajoute **plusieurs fournisseurs, un prix pour chacun** ; à la validation, **chaque** prix chiffré entre au catalogue chez **son** fournisseur, et le prix moyen se recalcule **partout** (nomenclatures, analyse DT).
⚠️ **Attention :** Une ligne sans « Désignation » est ignorée à l'envoi.

## Analyse DT — deux boutons sur chaque ligne de DT

**Où le trouver :** Onglet « Analyse DT » de `/be/service`. Chaque DT en attente propose **deux** boutons :
- **« Analyser »** → ouvre le **formulaire complet** `/be/analyse` (chiffrage **automatique**, un prix par quantité, ci-dessous).
- **« Visualiser » (œil)** → ouvre un **aperçu en LECTURE SEULE** : un tableau par pièce (Matière · MO · Machine · Sous-traitance · Total série · CRU €/pièce). On ne saisit rien, on ne génère rien — c'est un coup d'œil rapide sur le coût de revient et sa décomposition.

### Formulaire d'analyse (bouton « Analyser »)
**Quand l'utiliser :** Pour vérifier/compléter le chiffrage d'une DT (matière, gamme, CRU) et le valider. Le formulaire est **pré-rempli automatiquement** depuis la DT et les nomenclatures des pièces.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Analyste BE | liste déroulante | Oui | La personne qui réalise l'analyse — à choisir dans la liste des **salariés ayant les droits BE** (rôle BE ou direction). | Joël Dumont |
| Priorité | liste déroulante | Non | Standard / Urgent / Critique. **Enregistrée sur la DT** (colonne priorité). | Urgent |
| Type demande | liste déroulante | Non | Commande ferme / Prototype / Essai / Réclamation. | Prototype |
| Réf. interne pièce | texte (avec liste) | Oui | Notre référence de la pièce (= n° de nomenclature). Se lie automatiquement au n° de plan et à la réf. client. | 7365635125 |
| N° plan client | texte (avec liste) | Non | Le n°/nom du plan client. Si un plan a été **chargé** dans la nomenclature, le lien **« Ouvrir le plan client »** apparaît pour le consulter. | PREPLAQUE |
| Réf. pièce client | texte (avec liste) | Non | La référence de la pièce **chez le client**. Se lie automatiquement aux deux autres cases (répertoire). | 94402 |
| Quantité | nombre (lecture) | — | Quantité de référence reprise de la DT. Sert au calcul du besoin matière et des temps. Si la DT demande **plusieurs quantités** (champ « Quantités à chiffrer » de la DT), le tableau de chiffrage affiche **une ligne de prix par quantité**. | 4260 |
| Exigences normatives | cases à cocher | Non | **Exactement** les mêmes normes que la DT (ISO 9001, EN 9100, REACH, RoHS, EN 13485). Cochées d'après la pièce. | ☑ ISO 9001 |
| Couverture matière & accessoires | tableau (lecture) | — | Déversé de la nomenclature : pour chaque matière/accessoire, le **besoin** (nombre de **tôles** pour la matière, arrondi supérieur ; nombre de **pièces** pour les accessoires — le passage en paquets se fait au bon de commande, par les Achats) face au **stock restant** et au **seuil**, avec un état (Couvert / Sous seuil / Insuffisant / Rupture / Hors stock). Le prix unité est le **prix moyen des fournisseurs** du catalogue, recalculé à l'ouverture. | 136290 · besoin 400 pièces · Rupture |
| Gamme opératoire | tableau | — | Mêmes colonnes que la nomenclature. Les étapes de la nomenclature sont **verrouillées** 🔒 (non déplaçables). Le bouton **« Ajouter une étape »** crée une étape que l'on peut **glisser** pour l'insérer où l'on veut **dans** la gamme (sans jamais déplacer les étapes verrouillées). | Contrôle dim. inséré après Poinçonnage |
| Chiffrage — Coût de revient (CRU) | tableau (auto) + 1 champ saisissable | Non (auto) | Les coûts **Matière**, **Accessoire**, **MO+machine** et **Sous-traitance** sont **calculés automatiquement** depuis la nomenclature — **on ne peut pas les modifier**. Seul le champ **Frais généraux /lot** se saisit : c'est un **coût fixe par lot** (pas par pièce), amorti sur la quantité. **Il n'y a plus de marge ici** : le BE ne chiffre que le **coût de revient**. Le tableau donne **une ligne par quantité** : colonnes « ×q » (Matière · Access. · MO+mach · S-trait), **Frais g. (lot)** (compté une fois), **CRU total** (coût de la série) et **CRU/pc** (coût par pièce). Matière et accessoires comptés en **unités d'achat entières** (tôles / paquets, arrondi supérieur). La quantité de la DT est marquée « DT ». La **marge et le prix de vente** se fixent ensuite dans l'**offre de prix** (côté commercial). | Qté 4260 · frais g. 1 000 €/lot → CRU total 19 139 € · CRU/pc 4,49 € |
| Faisabilité *(sous les process)* | liste déroulante | Oui | Faisable sans réserve / Faisable avec adaptation / Non faisable – alternative proposée. | Faisable avec adaptation |
| Commentaires | zone de texte | Non | **Les risques techniques, réserves, conditions particulières** et points d'attention se notent ici (il n'y a plus de case « Risques » séparée). | Tolérance IT7 sur Ø, prévoir contrôle 100 % |
| Pièces jointes complémentaires pour l'offre (GED) | **fichier (upload)** | Non | On **joint un vrai document** (pas un lien) : choisir le fichier puis **« Joindre le document »** → il est rangé dans la GED (dossier « analyse DT »). Les documents joints s'affichent en dessous (ouvrir / supprimer). | analyse_note_DT-2026-0001.pdf |
| Décision BE | liste déroulante | Oui | ✅ Faisable / ⚠ Avec réserves / ❌ Non faisable. **« Non faisable » passe la DT en refus** ; sinon la DT bascule dans les offres. | ⚠ Faisable avec réserves |

💡 **Astuce :** Le triplet **Réf. interne ↔ N° plan client ↔ Réf. pièce client** fonctionne exactement comme dans la DT : saisir l'une remplit les autres depuis le répertoire.
⚠️ **Attention :** Le chiffrage n'est complet que si les pièces ont une nomenclature validée. La génération des BDT/BDS **ne se fait plus ici** : elle a lieu à la validation de la commande, puis les BDT/BDS sont visibles en production.
