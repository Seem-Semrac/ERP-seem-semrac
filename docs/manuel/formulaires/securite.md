# Formulaires — Securite (HSE/RSE) · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Risque (DUER)
**Quand l'utiliser :** Pour recenser un danger du travail dans le Document Unique (DUERP) et décider comment le maîtriser.
**Où le trouver :** Onglet « DUER / Risques » → bouton « Nouveau risque » (ou l'icône crayon d'une ligne pour modifier).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Année (exercice) | nombre | Non | L'année du DUERP concernée. Un DUERP par année. | 2026 |
| Famille de risque | liste déroulante (1. Chutes de plain-pied ; 2. Chute de hauteur ; 3. Circulation / engins ; 4. Accidents routiers ; 5. Charge physique de travail / TMS ; 6. Manutention mecanique ; 7. Produits chimiques, dechets ; 8. Agents biologiques ; 9. Equipements de travail ; 10. Chutes d'objet / effondrements ; 11. Bruit ; …) | Non | La grande catégorie du danger, selon la liste INRS. | 11. Bruit |
| Unité de travail | recherche (liste) (Bureaux / Administratif ; Usinage ; Découpe et façonnage ; Traitement / procédés spécifiques ; Montage ; Montage puissance ; Magasins ; Maintenance ; Emballage ; Chaufferie / four ; Réfectoire / parties communes ; Déplacements extérieurs ; Parking ; Tout le personnel / Global usine) | Oui | Le groupe de postes concerné. Tapez ou choisissez dans la liste. | Usinage |
| Zone / secteur | recherche (liste) (Oxydation ; Sérigraphie ; Tôlerie ; Usinage ; Dissipation ; Tronçonnage ; Découpe ; Pliage ; Poinçonnage ; Ébavurage ; Ponçage ; Soudure ; Collage ; Montage ; Montage puissance ; Magasin ; Expédition ; Bureaux ; Maintenance ; Parties communes ; Autre) | Non | L'endroit précis de l'atelier où le danger existe. | Tôlerie |
| Danger | texte | Oui | Ce qui peut causer un dommage, en quelques mots. | Machine bruyante > 85 dB |
| Risque résiduel | texte | Non | Ce qui reste comme risque une fois les protections en place. | Gêne auditive prolongée |
| Situation dangereuse | zone de texte | Non | Décrivez concrètement quand et comment le danger se présente. | Opérateur près de la scie 6 h/jour sans protection |
| Gravité (1-4) | nombre | Non | À quel point c'est grave, de 1 (léger) à 4 (très grave). | 3 |
| Fréquence (1-4) | nombre | Non | À quelle fréquence on est exposé, de 1 (rare) à 4 (permanent). | 4 |
| Maîtrise (1-4) | nombre | Non | Niveau de maîtrise actuel du risque, de 1 à 4. | 2 |
| Mesures existantes | zone de texte | Non | Ce qui est déjà en place pour se protéger. | Bouchons d'oreilles fournis |
| Mesures prévues (plan d'action) | zone de texte | Non | Les actions à mener pour réduire le risque (le PAPRIPACT). | Encoffrer la scie, capotage acoustique |
| Responsable | texte | Non | La personne qui pilote l'action. | J. Martin |
| Échéance | date | Non | La date visée pour traiter le risque. | 2026-09-30 |
| Statut | liste déroulante (À traiter ; En cours ; Maîtrisé) | Non | Où en est le traitement du risque. | En cours |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement concerné. | Seem |

💡 **Astuce :** La cotation gravité × fréquence calcule automatiquement une criticité et une priorité P1/P2/P3, qui donnent l'ordre de traitement.
⚠️ **Attention :** « Unité de travail » et « Danger » sont obligatoires ; sans eux la fiche ne peut pas être enregistrée.

## Action corrective (AC / PAC / SD)
**Quand l'utiliser :** Pour ouvrir et suivre une action de correction après un problème, un presqu'accident ou une situation dangereuse.
**Où le trouver :** Onglet « Événements » → panneau Actions correctives → bouton d'ajout (ou l'icône clé à molette sur un accident pour en créer une liée).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° | nombre | Non | Le numéro d'ordre de l'action. | 12 |
| Type | liste déroulante (AC — Action corrective ; PAC — Presque accident ; SD — Situation dangereuse) | Non | La nature de la fiche. | AC — Action corrective |
| Date | date | Non | La date d'ouverture. Se remplit à aujourd'hui par défaut. | 2026-07-04 |
| Secteur | recherche (liste) (mêmes secteurs d'atelier que ci-dessus) | Non | L'endroit concerné. | Oxydation |
| Diffusion | texte | Non | À qui la fiche a été communiquée. | Équipe atelier, encadrement |
| Constat / faits | zone de texte | Non | Ce qui a été observé, sans interprétation. | Flaque d'huile devant la presse |
| Cause racine (5 Pourquoi) | zone de texte | Non | La vraie cause de fond, trouvée en se demandant « pourquoi » plusieurs fois. | Joint usé non remplacé au préventif |
| Action(s) d'éradication | zone de texte | Non | Ce qu'on fait pour que le problème ne revienne pas. | Remplacer le joint, ajouter au plan préventif |
| Pilote / délai | texte | Non | Qui s'en occupe et pour quand. | M. Durand — 15/07 |
| Échéance | date | Non | La date limite de l'action. | 2026-07-15 |
| Efficacité vérifiée | texte | Non | Comment on a vérifié que l'action a bien marché. | Contrôle visuel après 1 mois : OK |
| Statut | liste déroulante (En cours ; Soldé ; Annulé) | Non | Où en est l'action. | En cours |

## Flash Sécurité
**Quand l'utiliser :** Pour diffuser rapidement une alerte ou une consigne de sécurité à la suite d'un événement.
**Où le trouver :** Onglet « Événements » → panneau Flash Sécurité → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° | texte | Non | Le numéro du flash. | FLASH-2026-03 |
| Date | date | Non | La date du flash. | 2026-07-04 |
| Secteur | recherche (liste) (mêmes secteurs d'atelier) | Non | Le secteur concerné. | Montage |
| Rédacteur | texte | Non | La personne qui a rédigé le flash. | Resp. HSE |
| Description du flash | zone de texte | Non | L'événement ou la situation à porter à la connaissance de tous. | Coupure lors d'un démontage sans consignation |
| Mesures / consignes | zone de texte | Non | Ce qu'il faut faire ou éviter désormais. | Toujours consigner avant intervention |
| Diffusion | texte | Non | À qui le flash est envoyé. | Tous secteurs |
| Statut | liste déroulante (Diffusé ; En cours ; Soldé ; À supprimer) | Non | Où en est le flash. | Diffusé |

## Accident / presqu'accident
**Quand l'utiliser :** Pour déclarer un accident du travail, un accident de trajet, une maladie pro, un presqu'accident, une situation dangereuse ou un soin.
**Où le trouver :** Onglet « Événements » → panneau Accidents → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type | liste déroulante (Accident du travail ; Accident de trajet ; Maladie professionnelle ; Presqu'accident ; Situation dangereuse ; Soin / premiers secours) | Non | La nature de l'événement. | Accident du travail |
| Date | date | Non | Le jour de l'événement. Se remplit à aujourd'hui par défaut. | 2026-07-04 |
| Heure | texte | Non | L'heure de l'événement. | 14:30 |
| Salarié | liste déroulante (salariés de l'entreprise) | Non | La personne concernée. Choisissez-la dans la liste. | Dupont Jean |
| Zone / secteur | recherche (liste) (mêmes secteurs d'atelier) | Non | L'endroit où c'est arrivé. | Usinage |
| Poste | texte | Non | Le poste de travail occupé. | Tour CN |
| Partie du corps | texte | Non | La partie du corps touchée (sert au schéma corporel). | Main droite / index |
| Nature de la lésion | texte | Non | Le type de blessure. | Coupure |
| Gravité | liste déroulante (Bénin ; Léger ; Grave ; Mortel) | Non | La gravité de la blessure. | Léger |
| Avec arrêt | case à cocher | Non | Cochez si l'accident a entraîné un arrêt de travail. | Coché |
| Jours d'arrêt | nombre | Non | Le nombre de jours d'arrêt (sert aux taux TF/TG). | 3 |
| Témoins | texte | Non | Les personnes présentes. | M. Petit |
| Décl. CPAM le | date | Non | La date de déclaration à la CPAM. | 2026-07-05 |
| Description | zone de texte | Non | Le récit factuel de l'événement. | Doigt coincé lors du changement d'outil |
| Premiers secours | zone de texte | Non | Les soins immédiats donnés. | Nettoyage, pansement par le SST |
| Analyse des causes | zone de texte | Non | Pourquoi c'est arrivé. | Outil mal fixé |
| Actions correctives | zone de texte | Non | Ce qui est mis en place pour éviter la répétition. | Formation changement d'outil |
| Responsable | texte | Non | Qui suit le dossier. | Resp. HSE |
| Statut | liste déroulante (Nouveau ; Enquête ; Actions ; Clos) | Non | Où en est le traitement. | Enquête |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement concerné. | Semrac |

💡 **Astuce :** La « Partie du corps » que vous saisissez alimente le schéma corporel du tableau de bord (heatmap des zones les plus touchées).

## EPI (catalogue)
**Quand l'utiliser :** Pour référencer un modèle d'équipement de protection (EPI) disponible dans l'entreprise.
**Où le trouver :** Onglet « EPI » → panneau catalogue → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Désignation | texte | Oui | Le nom de l'EPI. | Casque anti-bruit |
| Catégorie | liste déroulante (Tête ; Yeux ; Audition ; Voies respiratoires ; Mains ; Pieds ; Corps ; Antichute) | Non | La partie du corps protégée. | Audition |
| Norme EN | texte | Non | La norme européenne de l'EPI. | EN 352-1 |
| Durée de vie (mois) | nombre | Non | La durée de vie du produit en mois. | 36 |
| Réf. stock | texte | Non | La référence produit / code stock. | EPI-CAS-002 |
| Fournisseur | liste déroulante (fournisseurs enregistrés) | Non | Le fournisseur du produit. | 3M |
| Notes | zone de texte | Non | Toute information utile. | À remplacer après tout choc |

⚠️ **Attention :** La « Désignation » est obligatoire.

## Remise EPI / matériel
**Quand l'utiliser :** Pour enregistrer la remise d'un EPI ou d'un matériel à un salarié (dotation).
**Où le trouver :** Onglet « EPI » → panneau dotations → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Salarié | liste déroulante (salariés) | Non | La personne à qui l'on remet l'équipement. | Dupont Jean |
| EPI du catalogue (optionnel) | liste déroulante (EPI du catalogue) | Non | Choisissez un EPI déjà référencé, ou laissez vide et saisissez le nom libre. | Casque anti-bruit |
| Fourniture / EPI (libre) | texte | Non | Le nom de l'équipement si non listé au catalogue. | Chaussures S3 |
| Type | liste déroulante (EPI ; Matériel) | Non | Distingue un EPI d'un simple matériel. | EPI |
| Taille | texte | Non | La taille remise. | 42 |
| Quantité | nombre | Non | Le nombre d'unités remises. | 1 |
| Fournisseur | liste déroulante (fournisseurs) | Non | Le fournisseur. | Uvex |
| Marque | texte | Non | La marque de l'équipement. | Uvex |
| Référence | texte | Non | La référence du produit. | UX-S3-42 |
| Prix (€) | nombre | Non | Le prix, pour valoriser les dépenses EPI. | 45 |
| Remis le | date | Non | La date de remise. Se remplit à aujourd'hui par défaut. | 2026-07-04 |
| Péremption | date | Non | La date de fin de vie / péremption. | 2029-07-04 |
| Signature obtenue | case à cocher | Non | Cochez si le salarié a signé la remise. | Coché |
| Statut | liste déroulante (En service ; À renouveler ; Restitué) | Non | L'état actuel de la dotation. | En service |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement. | Seem |

💡 **Astuce :** Si vous choisissez un EPI du catalogue, vous n'avez pas besoin de remplir « Fourniture / EPI (libre) ».

## Produit chimique / FDS
**Quand l'utiliser :** Pour inscrire un produit chimique et sa fiche de données de sécurité (FDS) au registre.
**Où le trouver :** Onglet « Chimie / FDS » → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Produit | texte | Oui | Le nom commercial du produit. | Soude caustique 30% |
| Fournisseur | liste déroulante (fournisseurs) | Non | Le fournisseur du produit. | Brenntag |
| Réf. produit (codes) | texte | Non | La référence / code interne du produit. | CHM-014 |
| État | liste déroulante (Liquide ; Solide ; Gaz / aérosol) | Non | La forme physique du produit. | Liquide |
| Pictogrammes CLP (cliquer pour sélectionner) | cases à cocher (grille de pictogrammes CLP à cliquer) | Non | Cliquez les pictogrammes de danger figurant sur l'étiquette. | Corrosif, Toxique |
| Mentions de danger (H/P) | texte | Non | Les phrases H et P (séparées par des virgules). | H314, H290, P280 |
| CMR (cat.) | texte | Non | Catégorie CMR (cancérogène/mutagène/reprotoxique) le cas échéant. | 1B |
| VLEP | texte | Non | La valeur limite d'exposition professionnelle. | 2 mg/m³ |
| Réf. FDS | texte | Non | La référence de la fiche de données de sécurité. | FDS-014 |
| Date FDS | date | Non | La date de la FDS. | 2025-01-15 |
| Lien FDS (URL) | texte | Non | Un lien vers la FDS en ligne. | https://… |
| Zone de stockage | texte | Non | L'endroit où le produit est stocké. | Local acides |
| Rétention | case à cocher | Non | Cochez si le produit est sur bac de rétention. | Coché |
| Compatibilités | zone de texte | Non | Les produits à ne pas stocker avec / à côté. | Séparer des bases |
| Quantité | nombre | Non | La quantité en stock. | 200 |
| Unité | texte | Non | L'unité de la quantité. | L |
| Statut | liste déroulante (En stock ; En commande ; Périmé) | Non | L'état du produit. | En stock |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement. | Seem |

💡 **Astuce :** Une fois le produit enregistré, l'icône PDF sur sa ligne exporte sa fiche FDS.
⚠️ **Attention :** Le « Produit » (nom) est obligatoire. Un produit sans FDS apparaît en alerte au tableau de bord.

## Déchet (registre)
**Quand l'utiliser :** Pour tracer un enlèvement de déchet (registre déchets / Trackdéchets).
**Où le trouver :** Onglet « Environnement » → panneau déchets → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Date | date | Non | La date de l'enlèvement. Se remplit à aujourd'hui par défaut. | 2026-07-04 |
| Code déchet (nomenclature) | texte | Non | Le code de la nomenclature déchets. | 12 01 09 |
| Désignation | texte | Oui | Le nom du déchet. | Boues d'hydroxyde |
| Dangereux | case à cocher | Non | Cochez si le déchet est dangereux. | Coché |
| Quantité | nombre | Non | La quantité enlevée. | 500 |
| Unité | texte | Non | L'unité de la quantité. | kg |
| Zone productrice | texte | Non | Où le déchet a été produit. | Oxydation |
| Filière | texte | Non | La filière de traitement. | Traitement physico-chimique |
| Transporteur | texte | Non | Le transporteur du déchet. | Sarp |
| Exutoire | texte | Non | Le centre de traitement final. | Centre agréé X |
| N° BSDD | texte | Non | Le numéro du bordereau de suivi de déchet dangereux. | BSDD-2026-045 |
| ID Trackdéchets | texte | Non | L'identifiant Trackdéchets. | TD-… |
| Statut | liste déroulante (Enlevé ; En attente) | Non | L'état de l'enlèvement. | Enlevé |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement. | Semrac |

⚠️ **Attention :** La « Désignation » est obligatoire.

## Mesure environnementale
**Quand l'utiliser :** Pour enregistrer une mesure environnementale (eau, air, bruit, énergie…).
**Où le trouver :** Onglet « Environnement » → panneau mesures → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type | liste déroulante (Consommation eau ; Rejet eau ; Émission air ; Bruit ; Énergie) | Non | La nature de la mesure. | Rejet eau |
| Date | date | Non | La date de la mesure. Se remplit à aujourd'hui par défaut. | 2026-07-04 |
| Point de mesure | texte | Non | L'endroit précis de la mesure. | Point de rejet réseau |
| Paramètre | texte | Non | Le paramètre mesuré. | pH |
| Valeur | nombre | Non | La valeur mesurée. | 7.2 |
| Unité | texte | Non | L'unité de la valeur. | — |
| Valeur limite (VLE) | nombre | Non | La limite réglementaire à ne pas dépasser. | 9 |
| Conforme | case à cocher | Non | Cochez si la mesure respecte la limite. | Coché |
| Organisme | texte | Non | L'organisme qui a fait la mesure. | Laboratoire X |
| Observations | zone de texte | Non | Toute remarque utile. | Prélèvement du matin |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement. | Seem |

## Zone ATEX
**Quand l'utiliser :** Pour déclarer une zone à atmosphère explosive (ATEX) et ses exigences.
**Où le trouver :** Onglet « Environnement » → panneau ATEX → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nom de la zone | texte | Oui | Le nom de la zone ATEX. | Chaufferie gaz |
| Type de zone | liste déroulante (0 ; 1 ; 2 ; 20 ; 21 ; 22) | Non | Le classement ATEX (0/1/2 gaz, 20/21/22 poussières). | 2 |
| Localisation | texte | Non | L'emplacement de la zone. | Local chaudière |
| Origine du risque | liste déroulante (Gaz / vapeur ; Poussière) | Non | Ce qui crée l'atmosphère explosive. | Gaz / vapeur |
| Substances | texte | Non | Les substances en cause. | Gaz naturel |
| Matériel requis | texte | Non | Le matériel autorisé dans la zone. | Matériel ATEX cat. 2 |
| Mesures de prévention | zone de texte | Non | Les moyens de prévention en place. | Détection gaz, ventilation |
| Date de revue | date | Non | La date de la prochaine revue de la zone. | 2027-01-01 |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement. | Seem |

⚠️ **Attention :** Le « Nom de la zone » est obligatoire.

## Vérification périodique (VGP)
**Quand l'utiliser :** Pour suivre une vérification générale périodique réglementaire d'un équipement.
**Où le trouver :** Onglet « Contrôles & prévention » → panneau vérifications → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type | liste déroulante (Levage ; Électrique ; Incendie ; ESP (sous pression) ; Portes/portails ; Racks ; Ventilation ; ATEX) | Non | La nature de la vérification. | Levage |
| Équipement | texte | Oui | L'équipement vérifié. | Pont roulant n°2 |
| Machine liée | liste déroulante (machines) | Non | La machine du parc à rattacher, si applicable. | Pont roulant atelier |
| Organisme | texte | Non | L'organisme de contrôle. | Apave |
| Date contrôle | date | Non | La date du contrôle réalisé. Se remplit à aujourd'hui par défaut. | 2026-07-04 |
| Prochaine échéance | date | Non | La date du prochain contrôle attendu. | 2027-07-04 |
| Périodicité (mois) | nombre | Non | L'intervalle entre deux contrôles, en mois. | 12 |
| Résultat | liste déroulante (Conforme ; Avec observations ; Non conforme) | Non | Le verdict du contrôle. | Conforme |
| Levée des réserves | zone de texte | Non | Comment les réserves ont été levées. | Remplacement du câble le 10/07 |
| Lien rapport (URL) | texte | Non | Un lien vers le rapport de contrôle. | https://… |
| Statut | liste déroulante (À jour ; À prévoir ; En retard) | Non | L'état du suivi. | À jour |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement. | Seem |

⚠️ **Attention :** L'« Équipement » est obligatoire. Une échéance dépassée passe l'équipement en « VGP en retard » au tableau de bord.

## Formation requise
**Quand l'utiliser :** Pour définir qu'une formation est nécessaire pour un poste (sert à la matrice de suivi).
**Où le trouver :** Onglet « Contrôles & prévention » → panneau formations → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Poste / famille | texte | Oui | Le poste ou la famille de postes concerné. | Cariste |
| Formation | texte | Oui | La formation exigée. | CACES R489 |
| Obligatoire | case à cocher | Non | Cochez si la formation est obligatoire. | Coché |
| Périodicité (mois) | nombre | Non | Le délai de recyclage en mois (vide = formation unique). | 60 |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement. | Seem |

⚠️ **Attention :** « Poste / famille » et « Formation » sont obligatoires.

## Exercice d'évacuation
**Quand l'utiliser :** Pour consigner un exercice d'évacuation, incendie ou POI.
**Où le trouver :** Onglet « Contrôles & prévention » → panneau prévention → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type | liste déroulante (Évacuation ; Incendie ; POI) | Non | Le type d'exercice. | Évacuation |
| Date | date | Non | La date de l'exercice. Se remplit à aujourd'hui par défaut. | 2026-07-04 |
| Site | texte | Non | Le site où s'est déroulé l'exercice. | Seem |
| Participants | nombre | Non | Le nombre de personnes ayant participé. | 42 |
| Durée (min) | nombre | Non | La durée de l'exercice en minutes. | 8 |
| Scénario | zone de texte | Non | Le scénario joué. | Départ de feu simulé zone oxydation |
| Observations | zone de texte | Non | Ce qui a été constaté (points forts / faibles). | Point de rassemblement atteint en 8 min |
| Conforme | case à cocher | Non | Cochez si l'exercice s'est déroulé conformément. | Coché |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement (champ distinct du site texte ci-dessus). | Seem |

💡 **Astuce :** Il y a deux champs « Site » : un champ libre texte et une liste des établissements Seem/Semrac.

## Plan de prévention / permis
**Quand l'utiliser :** Pour formaliser un plan de prévention, un protocole de chargement ou un permis de feu avec une entreprise extérieure.
**Où le trouver :** Onglet « Contrôles & prévention » → panneau prévention → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Type | liste déroulante (Plan de prévention ; Protocole chargement ; Permis de feu) | Non | La nature du document. | Permis de feu |
| Entreprise extérieure | texte | Non | L'entreprise intervenante. | Sté Toiture Sud |
| Opération | texte | Non | La nature de l'intervention. | Étanchéité toiture (soudure) |
| Début | date | Non | La date de début. | 2026-07-10 |
| Fin | date | Non | La date de fin. | 2026-07-12 |
| Risques | zone de texte | Non | Les risques identifiés de l'opération. | Travail par point chaud, hauteur |
| Mesures | zone de texte | Non | Les mesures de prévention retenues. | Extincteur à poste, surveillance 1 h après |
| Signataires | texte | Non | Les personnes qui signent le document. | Chef de chantier, resp. site |
| Validé par | texte | Non | Qui a validé le document. | Resp. HSE |
| Statut | liste déroulante (En cours ; Clos) | Non | L'état du document. | En cours |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement. | Seem |

## Indicateur RSE
**Quand l'utiliser :** Pour saisir un indicateur de responsabilité sociétale (social, environnement, gouvernance).
**Où le trouver :** Onglet « Conformité » → panneau RSE → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Période (ex: 2026) | texte | Non | La période concernée par l'indicateur. | 2026 |
| Catégorie | liste déroulante (Social ; Environnement ; Gouvernance) | Non | Le pilier RSE. | Social |
| Code | texte | Non | Un code de repère pour l'indicateur. | S-01 |
| Libellé | texte | Oui | Le nom de l'indicateur. | Taux d'absentéisme |
| Valeur | nombre | Non | La valeur mesurée. | 3.4 |
| Unité | texte | Non | L'unité de la valeur. | % |
| Cible | nombre | Non | L'objectif à atteindre. | 3 |
| Site | liste déroulante (sites Seem / Semrac) | Non | L'établissement. | Seem |

⚠️ **Attention :** Le « Libellé » est obligatoire.

## Obligation réglementaire
**Quand l'utiliser :** Pour lister une obligation légale ou normative et suivre sa conformité.
**Où le trouver :** Onglet « Conformité » → panneau conformité → bouton d'ajout.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Domaine | liste déroulante (Code du travail ; Risque chimique ; ATEX ; ICPE / Environnement ; RSE ; ISO 45001 ; ISO 14001 ; ISO 9001 ; EN 9100 ; ISO 26000) | Non | Le domaine de l'obligation. | ICPE / Environnement |
| Obligation | texte | Oui | La description de l'obligation à respecter. | Contrôle annuel des rejets aqueux |
| Référence réglementaire | texte | Non | Le texte de loi ou la norme de référence. | Arrêté préfectoral n°… |
| Applicable | case à cocher | Non | Cochez si l'obligation s'applique à l'entreprise. | Coché |
| Statut | liste déroulante (À vérifier ; Conforme ; Partiel ; Non conforme ; Non applicable) | Non | L'état de conformité. | Conforme |
| Dernier contrôle | date | Non | La date de la dernière vérification. | 2026-03-01 |
| Échéance | date | Non | La date limite / prochaine échéance. | 2027-03-01 |
| Responsable | texte | Non | La personne qui pilote la conformité. | Resp. HSE |
| Preuve (URL) | texte | Non | Un lien vers la preuve de conformité. | https://… |
| Observations | zone de texte | Non | Toute remarque utile. | Rapport annuel disponible |

⚠️ **Attention :** L'« Obligation » est obligatoire. Une obligation « non conforme » ou dont l'échéance est dépassée alimente les « Alertes conformité » du tableau de bord.

## Matrice EPI × zone
**Quand l'utiliser :** Pour définir quels EPI sont obligatoires dans chaque zone de l'atelier.
**Où le trouver :** Onglet « EPI » → panneau « EPI obligatoires par zone » → bouton « Modifier la matrice » puis « Sauvegarder ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Cases EPI × zone | cases à cocher (tableau à cliquer : lignes = Casque, Lunettes de sécurité, Bouchons d'oreilles, Vêtements de travail, Gants anti-coupure, Chaussures de sécurité ; colonnes = zones Z1 Dissipation/Tronçonnage, Z2 Oxydation, Z3 Tôlerie, Z4 Bureaux, Z5 Magasin/Expédition, Z6 Collage/Labo, Z7 Montage Puissance, A Allée piétonne) | Non | Cliquez une case pour rendre un EPI obligatoire (✓) ou non (—) dans une zone. | Gants anti-coupure obligatoires en Z3 Tôlerie |

💡 **Astuce :** Ce n'est pas une modale : on active « Modifier la matrice », on clique les cases, puis on clique « Sauvegarder ». Le bouton « Annuler » abandonne les changements.
⚠️ **Attention :** Rien n'est enregistré tant que vous n'avez pas cliqué « Sauvegarder ».
