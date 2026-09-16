# Formulaires — Production · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Créer / Affecter un BDT (Nouveau BDT)
**Quand l'utiliser :** Pour créer un bon de travail (BDT), c'est-à-dire une opération à faire sur une pièce, et l'attribuer à un opérateur ou à un poste.
**Où le trouver :** Onglet Gantt / Planning production → bouton orange « Nouveau BDT » en haut à droite.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° Commande | texte | Oui | Le numéro de la commande client à laquelle rattacher ce travail. | CMD-2026-1081 |
| Client | texte | Oui | Le nom de l'entreprise cliente. | Legrand |
| Activité | liste déroulante (Seem, Semrac) | Oui | Choisissez le site/atelier qui va fabriquer. Ce choix filtre ensuite la liste des opérations et des opérateurs. | Semrac |
| Opération | liste déroulante (selon l'activité choisie : pour Seem — Tronçonnage, Usinage, Ébavurage, Thermocollage, Oxydation anodique sulfurique, Emballage ; pour Semrac — Poinçonnage / Laser, Ébavurage, Pliage, Montage, Soudure, Fraisage / Taraudage, Ponçage, Sérigraphie, Emballage) | Oui | Le type de travail à réaliser. La liste ne se remplit qu'après avoir choisi l'activité. | Pliage |
| Pièce / Référence | texte | Oui | La référence de la pièce à fabriquer. | DISSIP-A24 |
| Quantité | nombre | Non | Le nombre de pièces à produire (présent uniquement sur le planning). | 100 |
| Durée estimée (h) / Durée (h) | nombre | Oui | Le temps prévu pour l'opération, en heures (on peut mettre des demi-heures), réglage compris. | 2.5 |
| dont réglage (h) | nombre ≥ 0 (pas 0,05) | Non | La part de la durée consacrée au réglage : fixe, faite une seule fois, elle reste sur le morceau 1 si le BDT est découpé, et elle sert au chemin critique (l'étape suivante du lot démarre après). Vide = réglage inconnu. Ne peut pas dépasser la durée. | 0.5 |
| Heure de début / Heure début | date (heure) | Non | L'heure à laquelle l'opération commence dans la journée. Par défaut 06:00. | 06:00 |
| Priorité | liste déroulante (Normal, Urgent, Critique) | Non | L'importance du travail ; « Critique » l'affiche en rouge sur le planning. | Urgent |
| Type | liste déroulante (Interne – opérateur, Sous-traitance) | Non | Indique si l'opération est faite en interne ou envoyée chez un sous-traitant. « Sous-traitance » affiche des cases supplémentaires (uniquement sur le planning). | Interne – opérateur |
| Opérateur assigné / Opérateur / Process atelier | liste déroulante (liste des opérateurs ou des postes compatibles) | Non | La personne ou le poste atelier qui va faire le travail. La liste ne se remplit qu'après avoir choisi l'opération. | Sophie L. (Semrac · matin) |
| Sous-traitant | texte | Non | Nom de l'entreprise sous-traitante (visible seulement si Type = Sous-traitance). | Zinco SARL |
| Délai retour prévu | date | Non | Date à laquelle la pièce doit revenir du sous-traitant (visible seulement si Type = Sous-traitance). | 2026-04-04 |
| Instructions particulières | zone de texte | Non | Notes libres : points d'attention, outillage, tolérances (uniquement sur le planning). | Ébavurer tous les angles vifs |

💡 **Astuce :** Remplissez toujours l'Activité puis l'Opération dans cet ordre : les listes Opération et Opérateur ne se remplissent qu'ensuite.
⚠️ **Attention :** N° Commande, Client, Activité, Opération, Pièce et Durée sont obligatoires. Sans eux, le BDT ne peut pas être créé.

## Réceptionner le BDT (démarrage d'opération)
**Quand l'utiliser :** Quand l'opérateur commence réellement le travail : cela fait passer le BDT de « Programmé » à « Reçu / En cours » et enregistre l'heure de début.
**Où le trouver :** Sur le planning production, **double-clic sur la barre** d'un BDT programmé (ou clic droit → « Réceptionner (Reçu) »). Un BDT encore dans la goulotte doit d'abord être glissé sur le planning.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Matricule | texte | Oui | Le matricule de la personne qui prend le travail : un **opérateur**, ou une personne qui **écrit en Production** (chef d'atelier). | OP-001 |
| Code PIN | texte (masqué) | Oui | Le code secret de cette personne, qui confirme son identité. | •••• |

⚠️ **Attention :** Les deux cases sont obligatoires. C'est une signature : elle trace qui a démarré l'opération et à quelle heure. La personne qui reçoit devient celle qui **réalise** le bon (« Reçu par » au soldage) : c'est son coût horaire qui compte, et c'est elle (ou une personne qui écrit en Production) qui pourra le solder. Un matricule qui n'est ni opérateur ni en écriture Production est refusé : « Seuls un opérateur ou une personne habilitée à écrire en Production peuvent recevoir un BDT. ».

## Soldage BDT (clôture d'opération)
**Quand l'utiliser :** Quand l'opération est terminée. On clôture le BDT, ce qui calcule automatiquement le temps réellement passé.
**Où le trouver :** Sur le planning, clic droit sur la barre → « Solder le BDT ». Le BDT doit d'abord être au statut « Reçu ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Heure de fin réelle / Heure fin réelle | date (heure) | Oui | L'heure à laquelle le travail s'est vraiment terminé. Pré-remplie à l'heure actuelle. | 11:30 |
| Résultat | liste déroulante (Conforme – pièces OK, Reprise partielle nécessaire, Non-conformité – à déclarer) | Non | L'état des pièces produites. « Non-conformité » crée automatiquement une fiche NC pour la Qualité. | Conforme – pièces OK |
| Quantité produite | nombre | Non | Le nombre de pièces réellement fabriquées (présent sur le planning). | 100 |
| Observations / incidents | zone de texte | Non | Notes libres : anomalies, casses d'outils, écarts constatés. | Léger défaut d'aspect sur 2 pièces |
| Gravité de la non-conformité | liste déroulante (Mineure — non bloquant, Majeure — non bloquant, Critique — BLOQUE l'expédition, Bloquante — BLOQUE l'expédition) | Oui si Résultat = Non-conformité | Visible seulement pour une non-conformité. Critique ou Bloquante bloque l'expédition de l'affaire. | Majeure |
| Matricule | texte | Oui | Le matricule de la personne qui solde : **l'opérateur qui a reçu ce BDT** (nommé en « Reçu par » en haut de la fenêtre) ou **une personne habilitée à écrire en Production**. | OP-042 |
| Code PIN | texte (masqué) | Oui | Le code secret de cette personne, qui confirme son identité. | •••• |

💡 **Astuce :** Vous n'avez pas besoin de calculer le temps passé : il est déduit tout seul de l'heure de début (à la réception) et de l'heure de fin. Un chef d'atelier peut solder le bon reçu par un opérateur : le PV d'autocontrôle note « BDT reçu par X, soldé par Y ».
⚠️ **Attention :** Sans heure de fin ni identification (matricule + PIN), le BDT ne peut pas être soldé. Tout autre matricule est refusé : « Seuls l'opérateur qui a reçu ce BDT ou une personne habilitée à écrire en Production peuvent le solder. » (le PIN est alors effacé). La matrice de compétences ne bloque plus : si l'opérateur n'a pas de niveau pour ce process, le soldage passe et une notification orange invite à la mettre à jour (RH › Compétences). Si vous choisissez « Non-conformité », une fiche est envoyée automatiquement à la Qualité.

![Fenêtre de soldage d'un BDT](../../assets/form-production-soldage.png)

## Demande d'achat — Production
**Quand l'utiliser :** Pour demander aux Achats une matière, un accessoire ou une fourniture pour une machine, directement depuis l'atelier. Réservé aux personnes qui ont l'**écriture sur la Production**.
**Où le trouver :** Page Production, bandeau du service en haut à droite → bouton **« Demande d'achat »** (depuis n'importe quel onglet). Le formulaire complet s'ouvre dès le clic.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Matricule | texte | Oui | Le matricule de la personne qui fait la demande (vérifié à l'envoi : elle doit écrire en Production). | CHEF-01 |
| Code PIN | texte (masqué) | Oui | Son code secret. Effacé si l'envoi est refusé pour PIN incorrect. | •••• |
| Nature de l'achat | boutons (Matière, Accessoire, Machine (OPEX)) | Oui | Ce qui est acheté. « Machine (OPEX) » affiche le choix de la machine. | Accessoire |
| Machine concernée | liste déroulante (machines groupées par poste) | Oui si Machine | Le prix ira sur l'OPEX de cette machine à la réception. Choisir la machine remplit le poste. | Brown & Sharp |
| Article / désignation | texte (200 caractères max) | Oui | Ce qu'il faut acheter, en clair. | Plaquettes carbure |
| Référence | texte (80 max) | Non | Référence fabricant ou interne ; ajoutée à l'article « (réf. …) ». | CNMG 120408 |
| Quantité | nombre (virgule acceptée) | Oui | Supérieur à 0. | 10 |
| Unité | liste déroulante (u, kg, g, t, m, mm, m², m³, l, lot, boîte, rouleau, paire, jeu) | Non | Unité de la quantité (u par défaut). | boîte |
| Affaire | liste déroulante (Sans affaire, affaires en cours) | Non | L'affaire pour laquelle on achète, s'il y en a une. | 0001 — PROMISTEL |
| Poste concerné | liste déroulante | Non | Le poste de l'atelier concerné (celui de la machine l'emporte). | Cisaille |
| Priorité | liste déroulante (Normale, Urgente, Critique) | Non | L'urgence pour les Achats. | Urgente |
| Livraison souhaitée | date | Non | Pas dans le passé. | 2026-09-22 |
| Fournisseur suggéré | texte (120 max) | Non | Un fournisseur connu, à titre indicatif. | Sandvik |

💡 **Astuce :** La demande arrive dans Achats › Demandes d'achat au nom « Prénom Nom (Production) », statut « à traiter » ; l'acheteur la transforme en bon de commande comme toute demande.
⚠️ **Attention :** Un matricule sans écriture Production est refusé : « Seules les personnes habilitées à écrire en Production peuvent faire une demande d'achat depuis la Production. ». Depuis le 15/09/2026, un opérateur sans ce droit fait saisir sa demande par son chef.

![Formulaire Demande d'achat — Production](../../assets/form-production-da.png)

## PV de non-conformité — Production
**Quand l'utiliser :** Pour déclarer une non-conformité constatée à l'atelier, rattachée ou non à une affaire. Elle part dans la liste des NC de la Qualité. Réservé aux personnes qui ont l'**écriture sur la Production**.
**Où le trouver :** Page Production, bandeau du service → bouton rouge **« PV de non-conformité »**, juste à côté de « Demande d'achat ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Matricule | texte | Oui | Le matricule de la personne qui émet le PV (elle doit écrire en Production) ; son nom devient le détecteur de la NC. | CHEF-01 |
| Code PIN | texte (masqué) | Oui | Son code secret. | •••• |
| Date du constat | date | Oui | Aujourd'hui par défaut ; jamais dans le futur. | 2026-09-15 |
| Type de NC | liste déroulante (Interne, Client, Fournisseur) | Non | Origine de la non-conformité (Interne par défaut). | Interne |
| Entité | liste déroulante (Seem, Semrac) | Oui | Le site concerné. | Seem |
| Gravité | liste déroulante (Mineure, Majeure, Critique, Bloquante) | Non | Majeure par défaut. Critique ou Bloquante rattachée à une affaire bloque son expédition tant que la Qualité n'a pas clos la NC. | Majeure |
| Affaire | liste déroulante (Sans affaire, affaires en cours) | Non | L'affaire concernée ; filtre les listes Lot et BDT. | 0001 — PROMISTEL |
| Lot | liste déroulante (lots de l'affaire) | Non | Grisé tant qu'aucune affaire n'est choisie. | LOT-2026-0001-01 |
| BDT | liste déroulante (BDT de l'affaire, et du lot s'il est choisi) | Non | Choisir un BDT complète le lot et le code pièce. | BDT-2026-0001-01-01 |
| Code article / pièce | texte (80 max) | Non | Référence de la pièce. | 7365635125 |
| Désignation | texte (200 max) | Non | Nom de la pièce ou de l'objet. | Capot alu |
| Quantité concernée (pièces) | nombre entier | Non | Nombre de pièces touchées. | 12 |
| Poste (lieu de détection) | liste déroulante (postes de la liste Qualité) | Non | Où le défaut a été vu. | Plieuse Amada |
| Nature de la NC | liste déroulante (liste Qualité : Aspect - Rayures, Aspect - Chocs, Géométrie - Côtes hors tolérances…) | Non | Type de défaut. | Aspect - Rayures |
| Imputation (service responsable) | liste déroulante (liste Qualité : Achat (ACH), Qualité (QUAL), Oxydation (OXY)…) | Non | Service à l'origine du défaut. | Oxydation (OXY) |
| Description du défaut | zone de texte (4 000 max) | Oui | Ce qui a été constaté, précisément. | Rayures sur la face vue |
| Nature de la cause | liste déroulante (Main d'œuvre / manipulation, Machine / réglage, Méthode / gamme, Matière, Milieu / FOD, Sous-traitance, Programmation) | Non | Famille de cause (5M). | Machine / réglage |
| Cause présumée | texte (1 000 max) | Non | Recopiée dans la description. | Outil usé |
| Action immédiate | liste déroulante (Retouche interne, Rebut, Demande de dérogation, Retour fournisseur, Livraison en l'état) | Non | Ce qui a été fait tout de suite. « Rebut » inscrit aussi le rebut au registre des déchets. | Retouche interne |
| Traitement proposé | texte (1 000 max) | Non | Recopié dans la description. | Retouche et contrôle 100 % |
| Mettre en quarantaine | case à cocher | Non | Isole le lot ou les pièces jusqu'à la décision de la Qualité ; exige un lot, un BDT, un code article ou une désignation. | cochée |

💡 **Astuce :** La NC apparaît dans Qualité › Non-Conformités (filtre « Production »), statut « Ouvert », avec le nom de l'émetteur, la cause présumée et le traitement proposé recopiés dans la description.
⚠️ **Attention :** L'ERP vérifie que le lot et le BDT appartiennent bien à l'affaire choisie ; sinon l'envoi est refusé avec le motif. Une quarantaine bloque l'expédition du lot quelle que soit la gravité.

![Formulaire PV de non-conformité — Production](../../assets/form-production-pvnc.png)

## Découper le BDT en morceaux
**Quand l'utiliser :** Pour réaliser une opération en plusieurs fois (plusieurs créneaux, jours ou postes).
**Où le trouver :** Dans la goulotte « BDT à classer » du planning, bouton **ciseaux** de la carte du BDT (un BDT posé sur le planning se déprogramme d'abord).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Réglage (h) | nombre ≥ 0 | Non | **Verrouillé** quand le réglage est connu (enregistré sur le BDT, retrouvé sans ambiguïté dans la gamme, ou déjà porté par un autre morceau : il vaut alors 0). **Saisissable** seulement quand il est inconnu, sur le BDT d'origine : vide = tout le temps est traité en réalisation. Un bouton « Utiliser … h » recopie la valeur proposée par la gamme quand elle est incertaine. Ne peut pas dépasser la durée du BDT. | 0.5 |
| Réalisation (h) — une ligne par morceau | nombre | Oui | Le temps de réalisation de chaque morceau (2 à 12 morceaux, pré-remplis à la moitié de la réalisation). Supérieur à 0, sauf le morceau 1 qui peut ne porter que le réglage (0). Le morceau 1 affiche « soit … h au total ». | 2 |

💡 **Astuce :** Le pied de la fenêtre compare la réalisation répartie à la réalisation d'origine et donne le temps alloué total (réglage + réalisation) : le temps est libre, le total peut différer de la durée d'origine.
⚠️ **Attention :** Si la lecture du réglage échoue, « Découper » reste grisé : « Relire le réglage », ou saisissez-le. Si le BDT a changé depuis l'ouverture de la fenêtre (autre écran), la découpe est refusée « Page périmée » : rechargez le planning. Une découpe se défait tant qu'aucun morceau n'a commencé : bouton « Annuler la découpe » sur la carte d'un morceau.

## Nouvelle Sous-Traitance (commande ST)
**Quand l'utiliser :** Pour envoyer une opération (traitement de surface, peinture, zingage…) chez un prestataire extérieur.
**Où le trouver :** Dans le panneau « Sous-traitance en cours » → lien / bouton « Nouvelle ST ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° Commande (ERP) | texte | Non | Le numéro de la commande client concernée. | CMD-2026-1094 |
| Client / Client final | texte | Non | Le nom du client final de la pièce. | Valeo |
| Opération à sous-traiter / Opération à ST | liste déroulante (Oxydation anodique sulfurique, Sérigraphie, Traitement thermique, Zingage, Peinture poudre, Brunissage, Découpe jet d'eau) | Non | Le traitement à faire réaliser à l'extérieur. | Zingage |
| Sous-traitant | texte | Non | Le nom de l'entreprise prestataire. | Zinco SARL |
| Date retour prévue | date | Non | La date à laquelle les pièces doivent revenir. | 2026-04-04 |
| Priorité | liste déroulante (Normal, Urgent, Critique) | Non | L'importance de la commande. | Urgent |

💡 **Astuce :** Les opérations proposées sont celles habituellement confiées à l'extérieur. Choisissez-en une plutôt que de la retaper.

## Nouveau BST (bon de sous-traitance)
**Quand l'utiliser :** Pour créer un bon de sous-traitance rattaché à un lot en cours, depuis le Gantt sous-traitance.
**Où le trouver :** Onglet Gantt Sous-Traitance → bouton « Nouveau BST ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Lot lié | liste déroulante (liste des lots en cours) | Non | Le lot de production concerné par cette sous-traitance. | LOT-2026-1277-1 |
| Sous-traitant | liste déroulante (liste des fournisseurs sous-traitants) | Non | L'entreprise prestataire qui réalisera l'opération. | Anodex SA |
| Opération ST | liste déroulante (liste des opérations sous-traitées) | Non | Le traitement demandé. | Oxydation anodique sulfurique |
| Qté | nombre | Non | Le nombre de pièces à envoyer. | 50 |
| Date envoi | date | Non | La date de départ des pièces. Pré-remplie à la date du jour affichée. | 2026-03-10 |
| Durée (jours) | nombre | Non | Le nombre de jours prévus chez le sous-traitant (entre 1 et 60). | 5 |

## Déclaration de sortie matière
**Quand l'utiliser :** Pour enregistrer la consommation de matière, de fournitures ou de consommables machine sur un lot pendant la production.
**Où le trouver :** Sur le planning production, double-clic sur la barre d'un BDT **déjà reçu** → fenêtre « Déclaration de sortie matière ». Sur un BDT seulement programmé, le double-clic ouvre d'abord la réception.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type de sortie | case à cocher / choix (Matière, Fourniture, Consommable machine) | Oui | Ce que l'on sort du stock. « Consommable machine » fait apparaître le choix de la machine. | Matière |
| Article (stock) | liste déroulante (liste des articles en stock) | Non | L'article précis prélevé du stock. | Barre alu 6060 Ø20 |
| Quantité | nombre | Oui | La quantité sortie (chiffres à la virgule autorisés). | 12.5 |
| Machine concernée (OPEX) | liste déroulante (liste des machines) | Oui (si Consommable machine) | La machine sur laquelle le consommable est utilisé, pour lui affecter le coût. Apparaît seulement pour un consommable. | Tour CNC Mazak QT-200 |
| Observations | texte | Non | Motif de la sortie ou numéro de lot matière. | Lot matière M-2026-33 |

⚠️ **Attention :** La Quantité est toujours obligatoire. Si vous choisissez « Consommable machine », vous devez aussi indiquer la machine.

## Dupliquer le BDT
**Quand l'utiliser :** Pour recréer rapidement un BDT identique et le réattribuer à un autre opérateur (par exemple pour reprendre un travail).
**Où le trouver :** Sur le planning production, via l'option « Dupliquer » d'un BDT.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Réaffecter à l'opérateur | liste déroulante (liste des opérateurs avec activité et plage horaire) | Non | L'opérateur qui reprendra le travail dupliqué. | Karim B. (Seem · matin) |
| Heure de début | date (heure) | Non | L'heure de démarrage du BDT dupliqué. Par défaut 06:00. | 06:00 |

## Nouveau process (poste atelier)
**Quand l'utiliser :** Pour ajouter un poste de travail / une étape de fabrication au référentiel (utilisé ensuite pour affecter les BDT).
**Où le trouver :** Onglet des process/postes → bouton « Nouveau process ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nom du process | texte | Oui | Le nom du poste ou de l'étape de fabrication. | Tournage CNC |
| Code | texte | Non | Un code court pour repérer le process. | PROC-05 |
| Activité | liste déroulante (Seem, Semrac, Seem & Semrac) | Oui | Le ou les sites concernés par ce process. | Seem |
| Type | liste déroulante (Machine, Manuel, OAS (traitement de surface)) | Oui | La nature du process. « Machine » fait apparaître la machine rattachée **et le taux horaire machine** ; « Manuel » affiche la note « coût chargé RH » ; « OAS » n'a pas de taux (chiffré au prix). | Machine |
| Machine rattachée | liste déroulante (liste des machines) | Non | La machine associée au process (visible pour le type Machine). | Tour CNC Mazak QT-200 |
| Taux horaire machine (€/h HT) | nombre ≥ 0 | Non | **Visible pour le type Machine seulement.** Le coût d'une heure machine de ce process : il valorise le réglage machine et le temps machine des étapes. Saisi à la main. Vide = « taux à saisir » (le temps machine compte 0 € et le coût est signalé incomplet). | 55 |
| Catégorie | texte | Non | Un regroupement libre pour classer le process. | Usinage |
| Poste de travail | liste déroulante (postes) | Non | Le poste où le process est planifié. | Tournage |
| Ordre d'affichage | nombre | Non | La position du process dans les listes (plus petit = affiché en premier). Par défaut 100. | 100 |

💡 **Astuce :** Pour un process « Manuel », une note affiche la moyenne du coût chargé RH du site (ex. « moyenne atelier Seem 35,25 €/h ») : c'est elle qui valorise le temps homme. Le type « OAS » sert aux traitements de surface (bains) ; il gère un enchaînement particulier des bons de travail.

## Modifier le process
**Quand l'utiliser :** Pour corriger le nom, le type, la machine, le **taux horaire machine** ou le poste d'un process.
**Où le trouver :** Onglet Process Ateliers → volet « Postes & Process » → déplier le poste → crayon du process.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nom du process | texte | Oui | Le nouveau nom du process. | Tournage CNC 2 |
| Type | liste déroulante (Machine, Manuel, OAS) | Oui | Le type ne se déduit plus de la machine : un process machine sans machine reste « Machine ». Passer en « Manuel » grise le taux (sa saisie est restituée si l'on revient en « Machine ») ; « OAS » le masque. | Machine |
| Machine rattachée | liste déroulante (liste des machines) | Non | La machine du process (visible pour le type Machine). | Tour CNC Mazak QT-250 |
| Taux horaire machine (€/h HT) | nombre ≥ 0 | Non | Actif pour un process Machine. Le coût d'une heure machine de ce process. Vide = « taux à saisir ». | 48 |
| Poste de travail | liste déroulante (postes) | Non | Le poste où ce process est planifié (ses BDT s'y placent). | Tronçonnage |

💡 **Astuce :** Le nouveau taux s'applique aux chiffrages (nomenclatures, analyse DT) dès leur prochain affichage, et aux coûts réels calculés ensuite.
⚠️ **Attention :** Un taux négatif ou non numérique est refusé. Sur la base en ligne pas encore mise à jour, le message « Taux horaire machine NON enregistré… cloud-7 » signale que l'administrateur doit d'abord jouer le script de mise à jour ; le reste de la fiche est enregistré.

## Nouvelle machine / Modifier la machine
**Quand l'utiliser :** Pour ajouter une machine de l'atelier au référentiel (ou modifier ses caractéristiques). Sert au planning, à l'OPEX réel et à la capabilité qualité. **Une machine ne porte plus de coût horaire** : il se saisit sur ses process.
**Où le trouver :** Onglet des machines → bouton « Nouvelle machine » (ou action « Modifier » sur une machine).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nom de la machine | texte | Oui | Le nom complet de la machine. | Tour CNC Mazak QT-200 |
| Code | texte | Non | Un code court pour repérer la machine. | CNC-03 |
| Activité | liste déroulante (Seem, Semrac, Seem & Semrac) | Oui | Le ou les sites où se trouve la machine. | Seem |
| Catégorie | texte | Non | Un regroupement libre (type de machine). | Usinage |
| Capacité (h/jour) | nombre | Non | Le nombre d'heures que la machine peut travailler par jour (calcul d'utilisation). Par défaut 8. | 8 |
| Tolérance ± (mm) | nombre | Non | La tolérance dimensionnelle de la machine (précision), utilisée pour la capabilité qualité. | 0.05 |
| Statut | liste déroulante (Opérationnel, Maintenance, Arrêt) | Non | L'état actuel de la machine. | Opérationnel |
| Opérations possibles (séparées par virgule) | texte | Non | La liste des opérations que la machine sait faire, séparées par des virgules. | Usinage CN, Tronçonnage |
| Créer aussi un nouveau process (au nom de la machine) | case à cocher | Non | Si coché, crée un process machine lié à cette machine pour le planning. | (coché) |
| Taux horaire machine du nouveau process (€/h HT) | nombre ≥ 0 | Non | Apparaît quand la case précédente est cochée, à la création seulement. Vide = « taux à saisir » (un message le rappelle). | 55 |

💡 **Astuce :** Cochez « Créer aussi un nouveau process » si vous voulez pouvoir affecter directement des BDT à cette machine dans le planning, et saisissez tout de suite son taux horaire machine.
⚠️ **Attention :** Le champ « Coût machine (€/h) » a été supprimé le 14/09/2026. Supprimer une machine détache ses process : ils restent des process machine, avec leur taux.

## Programmer la semaine entière (présence opérateurs)
**Quand l'utiliser :** Pour définir d'un coup les plages horaires (shifts) de plusieurs opérateurs sur toute une semaine.
**Où le trouver :** Onglet présence / gestion des temps → bouton « Programmer la semaine ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Shift à appliquer | liste déroulante (Matin, Journée, Après-midi, Soirée, Absent, Effacer (non programmé)) | Oui | Le créneau à mettre en place. Ses horaires dépendent de la **cadence usine** du site de chaque opérateur et du jour. Les jours où ce créneau est **fermé** dans la cadence du site sont sautés (« N cases non programmées : créneau fermé ce jour-là dans la cadence du site »). « Effacer » vide réellement les cases. Le message final compte les cases enregistrées et les échecs. | Matin |
| Jours concernés | liste déroulante (Lun → Ven (5 jours ouvrés), Lun → Dim (7 jours)) | Oui | Les jours de la semaine à programmer. | Lun → Ven (5 jours ouvrés) |
| Opérateurs cibles | case à cocher (une case par opérateur) | Oui | Les opérateurs auxquels appliquer le shift. Des boutons permettent de tout cocher/décocher ou de sélectionner par site (Seem / Semrac). | Antoine D., Karim B. |

💡 **Astuce :** Utilisez les boutons « Seem » / « Semrac » pour cocher rapidement tous les opérateurs d'un site.
⚠️ **Attention :** Les jours où un opérateur est déjà en absence RH ne sont pas modifiés, même s'il est coché, ni les jours où le créneau est fermé dans la cadence de son site (dimanche toujours ; samedi, vendredi après-midi… selon la cadence). La semaine doit avoir été lue (sinon : « réessayez dans un instant »).

## Case de présence (menu d'un jour)
**Quand l'utiliser :** Pour programmer ou corriger le créneau d'un opérateur sur un jour.
**Où le trouver :** Onglet Présence opérateurs → clic (ou Entrée) sur la case de l'opérateur et du jour.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Créneau | menu (Matin, Journée, Après-midi, Soirée — chacun avec ses horaires du jour —, Absent, Effacer) | Oui | Un choix = un seul enregistrement. Les horaires affichés sont ceux de la **cadence usine** du site de l'opérateur ce jour-là (ex. vendredi en Moyen : Matin 04:50-13:15). Un créneau **fermé** ce jour-là est grisé « fermé · cadence Moyen » et ne se choisit pas (le serveur le refuse aussi : « Créneau « Matin » fermé en cadence Moyen ce jour … »). En cas d'échec, la case revient à la dernière valeur enregistrée et un message donne la raison. « Effacer » vide la case. Au clavier : flèches haut/bas, Entrée, Échap ou Tab pour refermer. | Journée (07:30-12:00 / 12:45-16:00) |

![Menu d'une case du vendredi en cadence Moyen](../../assets/production-presence-cadence.png)

💡 **Astuce :** Une case « fermé » = aucun créneau ouvert ce jour-là ; une case en pointillés rouges porte un créneau enregistré avant un changement de cadence qui l'a fermé (à corriger).
⚠️ **Attention :** Les cases d'une semaine jamais lue sont verrouillées (« … » pendant la lecture, « ? » en cas d'échec : bouton « Réessayer ») ; les absences RH (cadenas) ne se modifient pas ici.

## Changer la cadence d'un site (Cadence usine)
**Quand l'utiliser :** Pour passer un site (Seem ou Semrac) en cadence Bas, Moyen ou Haut à partir d'un jour donné : les horaires de la présence, du planning et de RH › Gestion des temps suivent aussitôt.
**Où le trouver :** Onglet Process Ateliers → bouton « Cadence usine » → bouton « Changer la cadence » sur la carte du site. Réservé à l'écriture Production.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| À partir du | date (demain par défaut ; 62 jours en arrière à 400 jours en avant) | Oui | Le premier jour où la nouvelle cadence s'applique. La fenêtre rappelle la cadence du site à cette date. **Aujourd'hui ou une date passée** : un avertissement orange s'affiche et une confirmation est demandée, car toute la journée passe dans la nouvelle cadence, heures déjà travaillées comprises. | 17/09/2026 |
| Niveau | choix unique (Bas, Moyen, Haut) | Oui | La nouvelle cadence. Le niveau déjà en vigueur à la date choisie est grisé. Choisir un niveau affiche l'aperçu de sa **semaine type** (première équipe → fin de la dernière, « +1j », « fermé »). | Haut |
| Motif | texte (500 caractères au plus) | Non | La raison du changement, visible sur la carte du site et dans l'historique. | Pic de charge |

![Fenêtre « Cadence de Seem »](../../assets/form-production-cadence.png)

💡 **Astuce :** Un changement dont la date est future apparaît sur la carte du site comme « Changement prévu » et dans l'historique avec la mention « prévu » : il ne s'applique qu'à partir de sa date.
⚠️ **Attention :** Si quelqu'un a changé la cadence entre-temps, l'enregistrement est refusé (« … a été modifiée entre-temps (maintenant : Moyen) : rechargez la page ») ; un site déjà dans ce niveau à cette date est refusé aussi. Le bouton de validation dit exactement ce qui va se passer : « Passer Seem en cadence Haut à partir du 17/09/2026 ».

## Modèles d'horaires d'une cadence (Cadence usine)
**Quand l'utiliser :** Pour corriger les horaires d'une équipe un jour donné, ou ouvrir / fermer un créneau, pour un niveau de cadence (Bas, Moyen ou Haut).
**Où le trouver :** Onglet Process Ateliers → bouton « Cadence usine » → bloc « Modèles d'horaires » → pastille du niveau. Réservé à l'écriture Production.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Niveau | pastilles (Bas, Moyen, Haut) | Oui | Le modèle à afficher et modifier ; les sites actuellement dans ce niveau sont indiqués à côté. Changer de niveau abandonne les saisies non enregistrées. | Moyen |
| Matin / Après-midi / Soirée — un jour | deux heures HH:MM (début → fin), croix pour fermer | Non | Les horaires du créneau ce jour-là. Case vide (croix) = créneau **fermé** ce jour-là. Une fin plus tôt que le début = créneau qui finit **le lendemain** (« +1j »), rattaché au jour où il commence. 16 h au plus. Un créneau du **samedi** ne peut pas finir le lendemain (le dimanche est fermé). | Soirée 21:00 → 05:30 (+1j) |
| Journée (1) / Journée (2, après pause) — un jour | deux heures HH:MM chacune, croix pour fermer | Non | La Journée en deux parties, avant et après la pause. La partie 2 exige la partie 1 et commence après sa fin ; aucune partie ne passe minuit. Journée en une seule partie : fermer la partie 2. | 07:30 → 12:00 puis 12:45 → 16:00 |

💡 **Astuce :** Les cases modifiées sont surlignées en jaune ; « Enregistrer » n'envoie qu'elles, « Annuler les modifications » les abandonne. Vos saisies non enregistrées restent affichées si vous changez de volet et revenez.
⚠️ **Attention :** Un modèle s'applique à **tous les sites** dans ce niveau et aussi aux dates passées (RH › Gestion des temps recalcule les heures des mois précédents). Le dimanche est toujours fermé. Si une case a été modifiée par quelqu'un d'autre entre-temps : « … a été modifié entre-temps : rechargez la page » (bouton « Relire »).

## Remettre en goulotte (déplacer une étape)
**Quand l'utiliser :** La fenêtre s'ouvre toute seule quand vous déplacez un BDT (ou planifiez un BST) et que ce déplacement rendrait incohérentes des étapes suivantes du lot déjà posées au planning.
**Où le trouver :** Planning Gantt BDT (glisser ou clic sur une barre) ou Planning Gantt BST — avant tout enregistrement.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Étapes remises en goulotte | lecture (liste) | — | Chaque étape suivante qui deviendrait incohérente, avec la raison : « BDT-… posé le 22/09 à 8h30 : au plus tôt le 22/09 à 9h29 (après le réglage de BDT-… (0,48 h)) ». | BDT-2026-0001-01-02 |
| Déplacer et remettre en goulotte | bouton | — | Déplace le BDT, puis déprogramme les étapes listées : elles reviennent **en tête** de la goulotte avec le badge « Remis en goulotte », à reprogrammer. | — |
| Annuler | bouton | — | Rien ne bouge. | — |

![Fenêtre « Remettre en goulotte »](../../assets/form-production-remise-goulotte.png)

💡 **Astuce :** Une étape déjà **reçue** n'est jamais déprogrammée : elle apparaît dans un second paragraphe (« Déjà reçue … seulement signalée ») ; si elle est seule, la fenêtre s'intitule « Étape déjà reçue » avec le bouton « Déplacer quand même ».
⚠️ **Attention :** Si le planning a changé entre-temps, la fenêtre peut se rouvrir avec une liste complétée : relisez-la avant de confirmer.
