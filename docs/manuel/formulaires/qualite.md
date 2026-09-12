# Formulaires — Qualite · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Nouvelle Non-Conformité (NC)
**Quand l'utiliser :** Pour signaler un problème qualité (pièce défectueuse, erreur de procédé, souci fournisseur ou réclamation client).
**Où le trouver :** Onglet « Non-Conformités » → bouton « Nouvelle NC ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Date détection | date | Non | Le jour où le problème a été constaté. | 04/07/2026 |
| Type NC | liste déroulante (NC Interne, NC Fournisseur, NC Client, NC Procédé) | Non | Précise l'origine du problème. « NC Interne » si détecté chez nous, « NC Fournisseur » à la réception, « NC Client » si le client se plaint. | NC Interne |
| Catégorie | liste déroulante (Administratif, Opération) | Oui | « Administratif » pour un souci de paperasse/commande ; « Opération » pour un défaut sur la fabrication elle-même. | Opération |
| Entité | liste déroulante (Seem, Semrac) | Oui | Le site concerné par la non-conformité. | Seem |
| Gravité | liste déroulante (Mineure, Majeure, Critique, Bloquante) | Non | Le niveau de sévérité. « Bloquante » ou « Critique » déclenche une priorité urgente. | Majeure |
| Détecteur | liste déroulante (Opérateur, Contrôleur, Client, Auditeur, Réception) | Non | Qui a repéré le problème. | Contrôleur |
| LOT / BDT / BL concerné | texte | Non | La référence du lot, du bon de travail ou du bon de livraison touché. | LOT-2026-091 |
| Client | texte | Non | Le nom du client concerné, s'il y en a un. | Legrand |
| Opération / process concerné | texte | Non | L'étape de fabrication où le défaut apparaît. | Fraisage |
| Description de la NC | zone de texte | Non | Décrivez le problème avec vos mots : ce qui ne va pas, où, combien de pièces. | Bavures excessives sur 12 pièces du lot |
| Soumettre à la validation de la Direction | case à cocher | Non | Cochez si la Direction doit valider cette NC. | coché |

⚠️ **Attention :** « Catégorie » et « Entité » sont obligatoires — la NC ne se crée pas tant qu'elles ne sont pas choisies.
💡 **Astuce :** Une fois la NC créée, vous pourrez ouvrir un rapport 8D dessus ou créer une dérogation liée, directement depuis la liste.

## Traiter le retour client
**Quand l'utiliser :** Quand un client renvoie des pièces non conformes et qu'il faut décider : lui faire un avoir, relancer une fabrication prioritaire, ou refuser le retour.
**Où le trouver :** Onglet « Non-Conformités » → sur une ligne de NC client, bouton « Retour ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° de facture | texte | Non | Le numéro de la facture d'origine des pièces retournées. | FA-2026-045 |
| N° d'affaire (base de la numérotation) | texte | Non | Le numéro d'affaire ; il sert à numéroter automatiquement l'avoir et la commande prioritaire. | AFF-2026-001 |
| Lot(s) concerné(s) | texte | Non | Le ou les lots des pièces retournées. | LOT-2026-091 |
| Pièces NC | nombre | Oui (pour avoir / commande) | Le nombre de pièces non conformes retournées. | 12 |
| Prix de vente unit. (€) → avoir | nombre | Oui (pour un avoir) | Le prix de vente d'une pièce ; sert à calculer le montant de l'avoir. | 24.50 |
| Coût de revient unit. (€) → cmd P | nombre | Non | Le coût de fabrication d'une pièce ; sert à estimer le coût d'une relance. Se remplit automatiquement depuis la nomenclature si laissé vide. | 11.20 |

💡 **Astuce :** Les montants « avoir » et « coût de relance » se calculent tout seuls dès que vous saisissez les pièces et les prix. Trois choix en bas : « Refuser le retour », « Faire un avoir » ou « Commande prioritaire ».
⚠️ **Attention :** Pour faire un avoir, il faut absolument un prix de vente et un nombre de pièces supérieurs à zéro.

## Nouveau PV de contrôle
**Quand l'utiliser :** Pour enregistrer un procès-verbal de contrôle qualité sur un lot ou une livraison.
**Où le trouver :** Onglet « PV de Contrôle » → bouton « Nouveau PV ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Date PV | date | Non | Le jour du contrôle. | 04/07/2026 |
| Type contrôle | liste déroulante (autocontrole, intermediaire, final, reception fournisseur) | Non | À quel moment le contrôle a lieu. | final |
| Lié a un Lot / Lié a un BL | boutons de choix | Non | Choisissez si le PV concerne un lot de fabrication ou un bon de livraison. | Lié a un Lot |
| N° Lot | texte | Non | La référence du lot contrôlé (si « Lié a un Lot »). | LOT-2026-XXX |
| N° BL | texte | Non | La référence du bon de livraison (si « Lié a un BL »). | BL-2026-XXX |
| Pièce | texte | Non | La référence de la pièce contrôlée. | DISSIP-A24 |
| Client | texte | Non | Le nom du client concerné. | Valeo |
| Cp | nombre | Non | Indice de capabilité du procédé (mesure de la régularité). | 1.33 |
| Cpk | nombre | Non | Indice de capabilité centré (tient compte du décentrage). | 1.20 |
| Observations | zone de texte | Non | Remarques libres sur le contrôle. | Conforme, RAS |

## Nouveau rapport 8D (création rapide)
**Quand l'utiliser :** Pour lancer un rapport 8D (méthode de résolution de problème) sans partir d'une NC existante.
**Où le trouver :** Onglet « Rapports 8D » → bouton « Créer un rapport 8D ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Titre du problème | texte | Oui | Une phrase courte qui résume le problème. | Bavures récurrentes DISSIP-A24 |
| Client concerné | texte | Non | Le client touché par le problème. | Legrand |
| Gravité | liste déroulante (Mineure, Majeure, Critique, Bloquante) | Non | Le niveau de sévérité du problème. | Majeure |
| Lot / Réf. produit | texte | Non | Le lot ou la référence produit concerné. | LOT-2026-091 |
| Responsable 8D | texte | Non | Le nom de la personne qui pilote le 8D. | Pierre-Yves |
| Date détection | date | Non | Le jour où le problème a été constaté. | 04/07/2026 |
| Description du problème (D2) | zone de texte | Non | Décrivez le problème (qui, quoi, où, quand, comment, combien, pourquoi). | Défaut de finition sur 47 pièces… |

⚠️ **Attention :** Le « Titre du problème » est obligatoire, sinon le rapport ne se crée pas.

## Rapport 8D — D1 : Constitution de l'équipe
**Quand l'utiliser :** Première étape du rapport 8D détaillé : constituer l'équipe et rattacher la NC.
**Où le trouver :** Page « Rapport 8D » (bouton « Compléter » sur un 8D) → section D1.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° 8D (auto) | texte | Non | Le numéro du rapport, généré automatiquement. | 8D-2026-003 |
| NC associée | recherche (liste) | Oui | La non-conformité à l'origine du 8D ; tapez pour retrouver la NC dans la liste. | NC-2026-012 |
| Chef de projet 8D | liste déroulante (salariés actifs) | Oui | La personne responsable du rapport ; choisie dans la liste du personnel. | Agathe |
| Date ouverture | date | Oui | Le jour où le 8D est ouvert. | 04/07/2026 |
| Gravité | liste déroulante (Mineure, Majeure, Critique, Bloquante) | Oui | Le niveau de sévérité. | Majeure |
| Membres de l'équipe | texte | Oui | Les noms des participants, séparés par des virgules. | Antoine, Isabelle, Joël |
| Compétences requises | texte | Non | Les savoir-faire nécessaires pour résoudre le problème. | Soudure, Métrologie |
| Raison de la sélection de l'équipe | zone de texte | Non | Pourquoi ces personnes ont été choisies. | Experts du poste concerné |
| Raison du problème (Réclamation client, Non-conformité interne, Audit qualité, Défaut en production, Retour terrain, Problème fournisseur) | cases à cocher | Non | Cochez la ou les origines du problème. | Réclamation client |

## Rapport 8D — D2 : Description du problème (QQOQCCP)
**Quand l'utiliser :** Pour décrire le problème de façon complète et factuelle.
**Où le trouver :** Page « Rapport 8D » → section D2.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| QUOI ? (What) | zone de texte | Non | Le défaut observé, décrit précisément. | Bavures dépassant Ra 1.6 μm |
| QUI ? (Who) | zone de texte | Non | Qui a détecté le problème, qui est concerné. | Détecté par Isabelle au contrôle final |
| QUAND ? (When) | zone de texte | Non | Depuis quand, à quelle fréquence. | Depuis janvier, sur 3 commandes |
| OÙ ? (Where) | zone de texte | Non | Sur quelle machine, quel poste, quelle étape. | Tour CNC Mazak, finition |
| COMMENT ? (How) | zone de texte | Non | Comment le problème se manifeste et a été détecté. | Rugosimètre mesure 2.3 μm |
| COMBIEN ? (How many) | zone de texte | Non | Quantité affectée, pourcentage, coût estimé. | 47 pièces sur 200 (23,5 %) |
| POURQUOI traiter ? (Why important) | zone de texte | Non | Pourquoi c'est critique, l'impact si non traité. | Risque de pénalité client |
| Synthèse IS / IS NOT (Quoi, Où, Quand, Combien) | texte (2 colonnes : ce que c'est / ce que ce n'est pas) | Non | Délimitez le problème en précisant ce qu'il est et ce qu'il n'est pas. | Est : face C usinée / N'est pas : face A |

## Rapport 8D — D3 : Actions d'inhibition (containment)
**Quand l'utiliser :** Pour lister les actions immédiates qui protègent le client en attendant la solution définitive.
**Où le trouver :** Page « Rapport 8D » → section D3 (bouton « Ajouter une action inhibition »).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Action d'inhibition | texte | Non | L'action immédiate mise en place. | Tri à 100 % du stock |
| Responsable | liste déroulante (Pierre-Yves, Agathe, Lénaïck) | Non | Qui pilote cette action. | Agathe |
| Date | date | Non | La date prévue ou réalisée. | 05/07/2026 |
| Efficacité | liste déroulante (Efficace, Partielle, Insuffisante) | Non | Jugement sur l'effet de l'action. | Efficace |

## Rapport 8D — D4 : Causes racines (Ishikawa + 5 Pourquoi)
**Quand l'utiliser :** Pour rechercher la vraie cause du problème.
**Où le trouver :** Page « Rapport 8D » → section D4.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Causes possibles (branches Méthode, Matière, Machine, Milieu, Main-d'oeuvre, Management) | texte | Non | Notez les causes potentielles dans chaque famille du diagramme 6M. | Usure de l'outil (Machine) |
| Pourquoi 1 à 5 | zone de texte | Non | Remontez de cause en cause : P1 = symptôme observé, P5 = cause racine finale. | P1 : bavures en sortie d'usinage |
| Cause racine validée (synthèse) | zone de texte | Oui | Le résumé de la cause racine identifiée après analyse. | Outil non changé au bon intervalle |

## Rapport 8D — D5 : Actions correctives permanentes
**Quand l'utiliser :** Pour définir les actions qui éliminent définitivement la cause racine.
**Où le trouver :** Page « Rapport 8D » → section D5 (bouton « Ajouter une action corrective »).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Action corrective permanente | zone de texte | Oui (par action) | Description précise de l'action à mettre en place. | Réviser la fréquence de changement d'outil |
| Responsable | liste déroulante (Pierre-Yves, Agathe, Lénaïck, Joël) | Oui (par action) | Qui met en œuvre l'action. | Joël |
| Délai | date | Oui (par action) | La date limite. | 15/07/2026 |
| Ressources nécessaires | texte | Non | Outillage, budget, personnel requis. | Budget outils |
| Indicateur de suivi | texte | Non | Le KPI qui permet de vérifier l'avancement. | Taux de rebut |
| Plan d'action global (synthèse D5) | zone de texte | Non | Résumé du plan avec les jalons clés. | Déploiement sur 2 semaines |

## Rapport 8D — D6 : Validation de l'efficacité
**Quand l'utiliser :** Pour vérifier que les actions ont bien réglé le problème.
**Où le trouver :** Page « Rapport 8D » → section D6.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Date de validation | date | Oui | Le jour de la vérification d'efficacité. | 20/07/2026 |
| Validé par | liste déroulante (Responsable Qualité, Directeur Technique, Client) | Oui | Qui a validé l'efficacité. | Responsable Qualité |
| Statut validation | liste déroulante (En cours, Validé, Non validé) | Oui | Où en est la validation. | Validé |
| Preuves recueillies (Mesures après correction, Audit de processus, Contrôle pièces, Tests fonctionnels) | cases à cocher + texte (résultat) | Non | Cochez les preuves obtenues et notez le résultat à côté. | Contrôle pièces : 0 défaut |
| Points de vigilance | zone de texte | Non | Risques résiduels, points à surveiller. | Surveiller lots suivants |
| Comparaison avant/après (indicateurs chiffrés) | zone de texte | Non | Chiffres avant et après correction. | Rebut 4,2 % → 0,3 % |
| Commentaires du valideur | zone de texte | Non | Observations ou réserves. | Efficacité confirmée |

## Rapport 8D — D7 : Actions préventives
**Quand l'utiliser :** Pour empêcher le problème de réapparaître ailleurs.
**Où le trouver :** Page « Rapport 8D » → section D7.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Processus / produits similaires concernés | zone de texte | Non | Les autres produits ou machines qui pourraient être touchés par la même cause. | Toutes les pièces usinées face C |
| Processus/Produit (plan de généralisation) | texte | Non | Le processus ou produit visé par une action préventive. | DISSIP-B12 |
| Action préventive à déployer | texte | Non | L'action à généraliser. | Même intervalle de changement d'outil |
| Responsable | liste déroulante (Pierre-Yves, Agathe, Lénaïck, Joël) | Non | Qui déploie l'action. | Lénaïck |
| Échéance | date | Non | La date limite. | 31/07/2026 |
| Statut | liste déroulante (À faire, En cours, Fait, N/A) | Non | Où en est l'action. | En cours |
| Mise à jour documentation | zone de texte | Non | Plans de contrôle, gammes, procédures à modifier. | Mettre à jour le plan de contrôle |
| Formation / sensibilisation | zone de texte | Non | Personnes à former ou informer. | Former les opérateurs tour |
| Leçon apprise (retour d'expérience) | zone de texte | Non | Le résumé à partager avec toutes les équipes. | Vérifier l'usure outil en autocontrôle |

## Rapport 8D — D8 : Clôture
**Quand l'utiliser :** Dernière étape : reconnaître l'équipe et clôturer officiellement le 8D et la NC.
**Où le trouver :** Page « Rapport 8D » → section D8.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Reconnaissance de l'équipe 8D (Chef de projet, Membres 1 à 4, Support technique) | listes déroulantes (Pierre-Yves, Agathe, Lénaïck, Joël, Mathieu) | Non | Nommez les membres à remercier. | Chef : Agathe |
| Message de félicitations à l'équipe | zone de texte | Non | Un mot de remerciement pour l'équipe. | Merci à tous pour ce 8D |
| Date de clôture officielle | date | Oui | Le jour de clôture du rapport. | 01/08/2026 |
| Clôturé par | liste déroulante (Responsable Qualité, Directeur, Client) | Non | Qui prononce la clôture. | Directeur |
| Statut final | liste déroulante (Clôturé, Clôturé avec réserves) | Non | Le résultat final du rapport. | Clôturé |
| N° NC clôturée | texte | Oui | La NC que ce 8D vient clore. | NC-2026-012 |
| Référence archivage GED | texte | Non | Où le rapport est archivé (SharePoint, GED…). | 8D-2026-003 |
| Checklist de clôture finale (D1 à D7) | cases à cocher | Non | Cochez chaque étape terminée avant de clôturer. | D4 – Cause racine identifiée |

## Libérer un lot en quarantaine
**Quand l'utiliser :** Pour décider du sort d'un lot mis en quarantaine (le libérer pour expédition ou le rejeter).
**Où le trouver :** Onglet « Libération Lots » → boutons « Libérer » ou rejet (croix) sur une ligne.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Libérer / Rejeter | boutons de confirmation | — | « Libérer » débloque le lot pour l'expédition ; la croix rouge le rejette. Une confirmation est demandée. | Libérer |

⚠️ **Attention :** Il n'y a pas de formulaire à remplir ici — c'est une décision par bouton, avec demande de confirmation avant validation.

## Décider d'un lot reçu non conforme (quarantaine fournisseur)
**Quand l'utiliser :** Quand un PV de contrôle de réception non conforme a envoyé en quarantaine un lot reçu d'un fournisseur ou d'un sous-traitant, et qu'il faut dire ce qu'on en fait : le renvoyer, l'accepter par dérogation, ou n'en garder qu'une partie.
**Où le trouver :** Onglet « Quarantaine » → bouton rouge « Décider » sur la ligne du lot. (Les quarantaines internes gardent le bouton « Statuer ».)

En haut de la fenêtre, un rappel non modifiable : fournisseur, n° de bon de commande, n° de BL, n° de NC et motif de mise en quarantaine.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Quantité du lot | nombre | Non | Reprise du bon de livraison. À corriger **seulement si elle est inconnue** : c'est elle qui sert à répartir accepté / renvoyé / rebut. | 10 |
| Que fait-on de ce lot ? | choix (Renvoyer au fournisseur, Dérogation avec le fournisseur, Entrée partielle en stock) | Oui | « Renvoyer » : tout repart, rien n'entre en stock. « Dérogation » : le lot est accepté en l'état et entre en stock. « Entrée partielle » : une partie entre en stock après tri. | Entrée partielle en stock |
| Quantité acceptée | nombre | Oui (entrée partielle) | Ce qui entre réellement en stock. Le reste s'affiche à côté. Doit être inférieur à la quantité du lot — tout accepter, c'est une dérogation. | 6 |
| Le reste (entrée partielle) | choix (Le reste repart chez le fournisseur, Le reste part au rebut chez nous) | Oui (entrée partielle) | Dit où va ce qu'on n'a pas gardé. Le rebut est inscrit au registre des déchets (service Environnement). | Le reste repart chez le fournisseur |
| Réf. de la dérogation | texte | Non (dérogation) | Le numéro ou la référence de l'accord passé avec le fournisseur, si vous l'avez. | DER-2026-014 |
| Réfaction obtenue € HT | nombre | Non (dérogation) | Le geste commercial obtenu pour accepter le lot en l'état. Un montant saisi ici crée un avoir fournisseur. | 180.00 |
| Compensation du fournisseur | choix (Avoir, Remplacement) | Oui (renvoi et entrée partielle) | « Avoir » : le fournisseur nous doit de l'argent (l'avoir part dans Achats › Avoirs fournisseurs). « Remplacement » : il relivre — la réception du bon de commande rouvre de la quantité non acceptée. | Avoir |
| Montant de l'avoir € HT | nombre | Non | Pré-rempli au prix unitaire du bon de commande × la quantité non acceptée. Modifiable. Si le prix unitaire est inconnu, saisissez-le. | 96.00 |
| Motif de la décision | zone de texte | Oui (3 caractères minimum) | Ce qui a été constaté et ce qui a été convenu avec le fournisseur. Enregistré avec l'auteur et la date. | 4 pièces hors tolérance, retour accepté par le fournisseur |

💡 **Astuce :** Après validation, la ligne affiche ce qui a été fait (« Renvoyé au fournisseur », « Dérogation fournisseur », « Entrée partielle 6/10 ») et ce qui reste à faire (« Retour à expédier », « Avoir réclamé (Achats) », « Remplacement attendu »).
⚠️ **Attention :** La décision ne se prend **qu'une fois** — un second clic est refusé. Si la matière est renvoyée **sans remplacement**, un message prévient qu'elle manque à l'affaire : il faut **repasser commande**. Si la base n'a pas encore la mise à jour (migration 008 / script cloud-6), la décision est refusée.

## Nouvelle ligne de plan de contrôle
**Quand l'utiliser :** Pour ajouter une ligne d'inspection au plan de contrôle EN9100 (ce qu'on vérifie, comment, à quelle fréquence).
**Où le trouver :** Onglet « Plan de contrôle » → bouton « Nouvelle ligne ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° ligne | nombre | Non | Le numéro d'ordre de la ligne dans le plan. | 10 |
| Opération | recherche (liste) | Oui | L'opération de fabrication contrôlée ; tapez pour choisir dans la liste des process. | Fraisage |
| Classification client | texte | Non | Le niveau d'exigence demandé par le client (caractéristique clé…). | Critique |
| Paramètres à contrôler | zone de texte | Non | Ce qu'on vérifie précisément. | Diamètre Ø12, rugosité |
| ECME / Outils | recherche (liste) | Non | L'instrument de mesure utilisé ; tapez pour choisir dans la liste des ECME. | Pied à coulisse |
| Fréquence & échantillonnage | texte | Non | À quelle fréquence et sur combien de pièces on contrôle. | 1 pièce sur 10 |
| Critère d'acceptation | texte | Non | La règle qui dit si c'est bon ou pas. | C=0 (Zéro défaut) |
| Responsable | texte | Non | Qui réalise le contrôle. | Opérateur poste |
| Type de contrôle | texte | Non | Destructif ou non destructif. | Non destructif |
| Activité | liste déroulante (Seem, Semrac, Seem & Semrac) | Non | Le site concerné par la ligne. | Seem |
| Plan de réaction (en cas d'écart) | zone de texte | Non | Ce qu'on fait si le contrôle échoue. | Isoler le lot, alerter la qualité |

⚠️ **Attention :** L'« Opération » est obligatoire, sinon la ligne ne s'enregistre pas.

## Étude de capabilité — paramètres et mesures
**Quand l'utiliser :** Pour analyser la régularité d'une machine/procédé à partir d'une série de mesures (calcul Cp/Cpk).
**Où le trouver :** Onglet « Étude de capabilité » → sélectionnez un process/machine à gauche, puis renseignez le panneau de saisie.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Caractéristique | texte | Non | La cote ou la dimension étudiée. | Ø12 H7 |
| Unité | texte | Non | L'unité de mesure. | mm |
| Seuil capabilité | nombre | Non | Le seuil minimum de Cp/Cpk acceptable (souvent 1,33). | 1.33 |
| Production totale | nombre | Non | Le nombre total de pièces produites (pour l'estimation). | 1000000 |
| LSL (tol. mini) | nombre | Non | La tolérance basse : plus petite valeur acceptable. | 11.98 |
| Valeur nominale | nombre | Non | La valeur cible ; laissée vide, elle se met au milieu des tolérances. | 12.00 |
| USL (tol. maxi) | nombre | Non | La tolérance haute : plus grande valeur acceptable. | 12.02 |
| Opérateur | texte | Non | La personne qui a fait les mesures. | Antoine |
| Mesures | zone de texte | Non | Toutes vos mesures, séparées par un espace, une virgule ou un retour à la ligne. | 12.01 12.03 11.99 12.00 |

💡 **Astuce :** Les indices Cp/Cpk et les graphiques se calculent automatiquement au fur et à mesure de votre saisie.

## Contrôle de cote (nouveau relevé)
**Quand l'utiliser :** Pour enregistrer une mesure individuelle sur une machine ; elle alimente la carte de contrôle et la capabilité de la machine.
**Où le trouver :** Onglet « Étude de capabilité » → bouton « Nouveau contrôle » (modale « Contrôle de cote »).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Machine | liste déroulante (machines de l'atelier) | Non | La machine sur laquelle la pièce a été produite. | Tour CNC-01 |
| Pièce | texte | Non | La référence de la pièce mesurée. | DISSIP-A24 |
| Cote | texte | Oui | La dimension contrôlée. | Ø12 H7 |
| Nominale | nombre | Oui | La valeur cible visée. | 12.00 |
| Mesure | nombre | Oui | La valeur réellement mesurée. | 12.01 |
| Tol. mini (LSL) | nombre | Oui | La tolérance basse. | 11.98 |
| Tol. maxi (USL) | nombre | Oui | La tolérance haute. | 12.02 |
| Contrôleur | texte | Non | Qui a réalisé la mesure. | Isabelle |

⚠️ **Attention :** Cote, nominale, mesure et les deux tolérances sont obligatoires — sans elles, le relevé ne s'enregistre pas.
💡 **Astuce :** Si la machine a une tolérance connue, les cases LSL et USL se pré-remplissent dès que vous saisissez la nominale.

## Nouvel ECME (instrument de mesure)
**Quand l'utiliser :** Pour ajouter ou modifier un équipement de contrôle, de mesure et d'essai (instrument à étalonner).
**Où le trouver :** Onglet « Contrôle des ECME » → bouton « Nouvel ECME » (ou crayon pour modifier).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Code | texte | Non | L'identifiant interne de l'instrument. | ECME-001 |
| Désignation | texte | Oui | Le nom de l'instrument. | Pied à coulisse 0-150 |
| Type | recherche (liste : Pied à coulisse, Micromètre, Comparateur, Cale étalon, Jauge de profondeur, Rapporteur d'angle, Colonne de mesure, Tampon / Bague, Balance, Thermomètre, Manomètre) | Non | La famille de l'instrument ; tapez ou choisissez dans la liste. | Pied à coulisse |
| Marque | texte | Non | Le fabricant. | Mitutoyo |
| N° série | texte | Non | Le numéro de série du fabricant. | 12345 |
| Localisation | texte | Non | Où se trouve l'instrument. | Métrologie |
| Activité | liste déroulante (Seem, Semrac, Seem & Semrac) | Non | Le site qui utilise l'instrument. | Seem |
| Étendue mesure | texte | Non | La plage de mesure de l'instrument. | 0-150 mm |
| Résolution | texte | Non | La plus petite graduation lisible. | 0,01 mm |
| Périodicité (mois) | nombre | Non | Tous les combien de mois il faut l'étalonner (12 par défaut). | 12 |
| Dernier étalonnage | date | Non | La date du dernier étalonnage réalisé. | 01/03/2026 |
| Organisme | texte | Non | Qui a fait l'étalonnage (labo externe ou interne). | Labo externe |
| Incertitude | texte | Non | L'incertitude de mesure de l'instrument. | ±0,02 mm |
| Réf. certificat | texte | Non | La référence du certificat d'étalonnage. | CERT-2026-14 |
| Mise en service | date | Non | La date de première mise en service. | 15/01/2024 |
| Notes | texte | Non | Remarques libres. | Réservé au contrôle final |

⚠️ **Attention :** La « Désignation » est obligatoire pour enregistrer l'ECME.

## Nouveau lot périssable
**Quand l'utiliser :** Pour enregistrer un produit périssable reçu (avec sa péremption et son suivi de stock par lot).
**Où le trouver :** Onglet « Produits Périssables » → bouton « Nouveau lot » (ou crayon pour modifier).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Produit | texte | Oui | Le nom du produit. | Colle époxy bicomposant |
| Code produit | texte | Non | La référence interne du produit. | CHM-045 |
| Fournisseur | recherche (liste) | Non | Le fournisseur ; tapez pour choisir dans la liste. | Loctite |
| N° lot fournisseur | texte | Non | Le numéro de lot indiqué par le fournisseur. | LOT-F-8821 |
| N° commande fourn. | texte | Non | Le numéro de la commande d'achat. | BC-2026-210 |
| Date réception | date | Non | Le jour de réception du lot. | 04/07/2026 |
| Date péremption | date | Non | La date limite d'utilisation. | 04/01/2027 |
| Date d'alerte | date | Non | La date à partir de laquelle le système prévient qu'il faut renouveler. | 04/12/2026 |
| Délai appro | texte | Non | Le délai pour réapprovisionner. | 8 semaines |
| Lieu d'utilisation | texte | Non | Où le produit est stocké/utilisé. | Zone collage |
| Qté initiale | nombre | Non | La quantité reçue au départ. | 10 |
| Inventaire courant | nombre | Non | La quantité restante actuellement. | 7 |
| Unité | texte | Non | L'unité de mesure. | boîtier / L / kg |
| Observations | texte | Non | Remarques libres. | Conserver au frais |

💡 **Astuce :** Le statut (Valide / À renouveler / Expiré) est recalculé automatiquement à partir des dates.

## Sortie de stock périssable
**Quand l'utiliser :** Pour enregistrer une consommation d'un lot périssable (le stock diminue en FIFO).
**Où le trouver :** Onglet « Produits Périssables » → icône « sortie » sur une ligne.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Quantité sortie | nombre | Oui | La quantité consommée. | 2 |
| Date | date | Non | Le jour de la sortie. | 04/07/2026 |
| N° commande client | texte | Non | La commande pour laquelle le produit a été utilisé. | CMD-2026-330 |
| Motif | texte | Non | La raison de la sortie. | mise en œuvre |

⚠️ **Attention :** La quantité doit être supérieure à zéro, sinon la sortie est refusée.

## Nouvelle demande de dérogation
**Quand l'utiliser :** Pour demander au client l'autorisation de livrer malgré un écart (dérogation PMQ3-D3).
**Où le trouver :** Onglet « Dérogations » → bouton « Nouvelle dérogation » (ou depuis une NC via l'icône dérogation).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Date / Date | date | Non | La date d'émission de la demande. | 04/07/2026 |
| Émise par / Issued by | texte | Non | La personne qui émet la demande. | Agathe |
| Service | texte | Non | Le service émetteur (pré-rempli « Qualité »). | Qualité |
| Tél. / Phone | texte | Non | Le téléphone de l'émetteur. | 03 xx xx xx xx |
| Email (émetteur) | texte | Non | L'email de l'émetteur (pré-rempli). | qualite@seem-semrac.com |
| Société / Company | texte | Non (au moins la société OU la désignation) | Le client destinataire. | Legrand |
| Nom / Name | texte | Non | Le contact chez le client. | M. Dupont |
| Tél. / Phone (destinataire) | texte | Non | Le téléphone du contact client. | 01 xx xx xx xx |
| Email (destinataire) | texte | Non | L'email du contact client. | contact@legrand.com |
| Désignation | texte | Non (au moins la société OU la désignation) | La désignation de la pièce concernée. | Dissipateur DISSIP-A24 |
| Votre Cde / Your order | texte | Non | Le numéro de commande du client. | CMD-CLI-556 |
| Votre Réf. / Your réf. | texte | Non | La référence côté client. | REF-L-778 |
| AR | texte | Non | L'accusé de réception. | AR-2026-88 |
| Notre Réf. / Our réf. | texte | Non | Notre référence interne (souvent le lot). | LOT-2026-091 |
| Quantité | nombre | Non | La quantité concernée par la dérogation. | 47 |
| Type de demande | liste déroulante (AC, AE, AR) | Non | Le type de dérogation demandée. | AC |
| Descriptif de la demande / Description | zone de texte | Non | L'écart précis pour lequel on demande la dérogation. | Rugosité légèrement hors tolérance |
| Décision | liste déroulante (en attente, AT — Accord total, AL — Accord limité, R — Refus) | Non | La réponse du client. | AT — Accord total |
| Statut | liste déroulante (En cours, Soldée, Annulée) | Non | L'état d'avancement de la demande. | En cours |
| Commentaire | zone de texte | Non | Remarques ou conditions du client. | Accord pour ce lot uniquement |

💡 **Astuce :** Depuis une NC, le bouton dérogation pré-remplit client, désignation, référence et description. Un bouton « Exporter PDF » génère le formulaire imprimable.
⚠️ **Attention :** Il faut renseigner au moins la société OU la désignation pour enregistrer.

## Planifier un audit
**Quand l'utiliser :** Pour planifier un audit de conformité (ISO 9001, EN 9100, ISO 27001, ISO 14001…).
**Où le trouver :** Onglet « Audit Conformité » → choisir la norme, puis bouton « Planifier audit ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Date audit | date | Non | Le jour prévu de l'audit. | 15/09/2026 |
| Auditeur | texte | Non | L'organisme ou la personne qui audite. | Bureau Veritas |
| Observations / périmètre | zone de texte | Non | Le périmètre de l'audit et remarques. | Audit de surveillance annuel |
