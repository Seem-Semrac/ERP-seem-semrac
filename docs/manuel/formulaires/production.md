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
| Durée estimée (h) / Durée (h) | nombre | Oui | Le temps prévu pour l'opération, en heures (on peut mettre des demi-heures). | 2.5 |
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
**Où le trouver :** Sur le planning production, clic droit sur une barre de BDT → « Passer à Reçu », ce qui ouvre cette fenêtre de vérification.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Matricule | texte | Oui | Le matricule de l'opérateur qui prend le travail, pour prouver qui a démarré. | OP-001 |
| Code PIN | texte (masqué) | Oui | Le code secret à 4 chiffres de l'opérateur, qui confirme son identité. | •••• |

⚠️ **Attention :** Les deux cases sont obligatoires. C'est une signature : elle trace qui a démarré l'opération et à quelle heure.

## Soldage BDT (clôture d'opération)
**Quand l'utiliser :** Quand l'opération est terminée. On clôture le BDT, ce qui calcule automatiquement le temps réellement passé.
**Où le trouver :** Sur le planning, double-clic sur une barre de BDT (ou clic droit → « Solder le BDT »). Le BDT doit d'abord être au statut « Reçu ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Heure de fin réelle / Heure fin réelle | date (heure) | Oui | L'heure à laquelle le travail s'est vraiment terminé. Pré-remplie à l'heure actuelle. | 11:30 |
| Résultat | liste déroulante (Conforme – pièces OK, Reprise partielle nécessaire, Non-conformité – à déclarer) | Non | L'état des pièces produites. « Non-conformité » crée automatiquement une fiche NC pour la Qualité. | Conforme – pièces OK |
| Quantité produite | nombre | Non | Le nombre de pièces réellement fabriquées (présent sur le planning). | 100 |
| Observations / incidents | zone de texte | Non | Notes libres : anomalies, casses d'outils, écarts constatés. | Léger défaut d'aspect sur 2 pièces |
| Matricule / N° opérateur | texte | Oui | Le matricule de l'opérateur qui solde, pour signer la clôture. | OP-042 |
| Code PIN / Mot de passe | texte (masqué) | Oui | Le code secret de l'opérateur, qui confirme son identité. | •••• |

💡 **Astuce :** Vous n'avez pas besoin de calculer le temps passé : il est déduit tout seul de l'heure de début (à la réception) et de l'heure de fin.
⚠️ **Attention :** Sans heure de fin ni identification (matricule + PIN), le BDT ne peut pas être soldé. Si vous choisissez « Non-conformité », une fiche est envoyée automatiquement à la Qualité.

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
**Où le trouver :** Sur le planning production, double-clic sur une barre de BDT → fenêtre « Déclaration de sortie matière ».

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
| Type | liste déroulante (Machine, Manuel, OAS (traitement de surface)) | Oui | La nature du poste. « Machine » fait apparaître le choix de la machine rattachée. | Machine |
| Machine rattachée | liste déroulante (liste des machines) | Non | La machine associée au process (visible pour le type Machine). | Tour CNC Mazak QT-200 |
| Catégorie | texte | Non | Un regroupement libre pour classer le process. | Usinage |
| Ordre d'affichage | nombre | Non | La position du process dans les listes (plus petit = affiché en premier). Par défaut 100. | 100 |

💡 **Astuce :** Le type « OAS » sert aux traitements de surface (bains) ; il gère un enchaînement particulier des bons de travail.

## Modifier le process
**Quand l'utiliser :** Pour corriger le nom d'un poste existant ou changer la machine qui lui est rattachée.
**Où le trouver :** Depuis la liste des process, action « Modifier ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nom du process | texte | Oui | Le nouveau nom du poste. | Tournage CNC 2 |
| Machine rattachée | liste déroulante (liste des machines) | Non | La machine à associer au poste. | Tour CNC Mazak QT-250 |

## Nouvelle machine / Modifier la machine
**Quand l'utiliser :** Pour ajouter une machine de l'atelier au référentiel (ou modifier ses caractéristiques). Sert au planning, aux coûts et à la capabilité qualité.
**Où le trouver :** Onglet des machines → bouton « Nouvelle machine » (ou action « Modifier » sur une machine).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nom de la machine | texte | Oui | Le nom complet de la machine. | Tour CNC Mazak QT-200 |
| Code | texte | Non | Un code court pour repérer la machine. | CNC-03 |
| Activité | liste déroulante (Seem, Semrac, Seem & Semrac) | Oui | Le ou les sites où se trouve la machine. | Seem |
| Catégorie | texte | Non | Un regroupement libre (type de machine). | Usinage |
| Capacité (h/jour) | nombre | Non | Le nombre d'heures que la machine peut travailler par jour. Par défaut 8. | 8 |
| Coût machine (€/h) | nombre | Non | Le coût horaire de la machine, utilisé pour calculer le coût de revient. Par défaut 35. | 35 |
| Tolérance ± (mm) | nombre | Non | La tolérance dimensionnelle de la machine (précision), utilisée pour la capabilité qualité. | 0.05 |
| Statut | liste déroulante (Opérationnel, Maintenance, Arrêt) | Non | L'état actuel de la machine. | Opérationnel |
| Opérations possibles (séparées par virgule) | texte | Non | La liste des opérations que la machine sait faire, séparées par des virgules. | Usinage CN, Tronçonnage |
| Créer aussi le process atelier | case à cocher | Non | Si coché, crée automatiquement un poste atelier lié à cette machine pour le planning. Coché par défaut. | (coché) |

💡 **Astuce :** Laissez « Créer aussi le process atelier » coché si vous voulez pouvoir affecter directement des BDT à cette machine dans le planning.

## Programmer la semaine entière (présence opérateurs)
**Quand l'utiliser :** Pour définir d'un coup les plages horaires (shifts) de plusieurs opérateurs sur toute une semaine.
**Où le trouver :** Onglet présence / gestion des temps → bouton « Programmer la semaine ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Shift à appliquer | liste déroulante (Matin, Journée, Soir, Absent, Effacer (non programmé)) | Oui | La plage horaire à mettre en place. « Effacer » retire la programmation. | Matin |
| Jours concernés | liste déroulante (Lun → Ven (5 jours ouvrés), Lun → Dim (7 jours)) | Oui | Les jours de la semaine à programmer. | Lun → Ven (5 jours ouvrés) |
| Opérateurs cibles | case à cocher (une case par opérateur) | Oui | Les opérateurs auxquels appliquer le shift. Des boutons permettent de tout cocher/décocher ou de sélectionner par site (Seem / Semrac). | Antoine D., Karim B. |

💡 **Astuce :** Utilisez les boutons « Seem » / « Semrac » pour cocher rapidement tous les opérateurs d'un site.
⚠️ **Attention :** Les jours où un opérateur est déjà en absence RH ne sont pas modifiés, même s'il est coché.
