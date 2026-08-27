# 04 · Production — parcours guidé

> Comment ça marche **étape par étape** : ce qui arrive **avant**, ce que **vous remplissez ici** (et pourquoi), et **où ça part ensuite**. Écrit pour un nouvel utilisateur.

## En bref — le rôle du service dans la chaîne

La Production reçoit les **commandes** acceptées côté Commercial. Chaque commande est découpée en **lots**, et chaque lot en **BDT** (bons de travail) : une opération précise (tronçonnage, pliage, usinage…) à faire sur une pièce. Le service **planifie** ces BDT sur le planning Gantt, les **affecte** aux opérateurs ou aux postes atelier, suit leur **démarrage** et leur **clôture**, enregistre la **matière consommée**, et envoie certaines opérations en **sous-traitance** chez un prestataire extérieur.

En sortie, la Production alimente : la **Qualité** (une non-conformité déclarée en fin d'opération crée une fiche NC), le **Stock** (les sorties matière décrémentent le stock), et le **coût de revient** de la commande (temps réel + matière + coût machine). Quand tous les BDT d'une commande sont soldés, l'affaire peut avancer vers l'expédition et la facturation.

## Étape 1 — Créer et affecter un BDT (bon de travail)
**⬅️ Avant :** Une commande client a été acceptée (Commercial) et découpée en lots. Il reste à programmer les opérations une par une.
**📝 Ici, vous :** créez un bon de travail — une opération à faire sur une pièce — et l'attribuez à un opérateur ou à un poste atelier.

![Formulaire Nouveau BDT sur le planning production](../../assets/form-production-bdt.png)

Sur cet écran, vous renseignez :
- **N° Commande** — la commande client à laquelle rattacher ce travail : c'est le lien qui permet de retrouver le coût et l'avancement de l'affaire.
- **Client** — le nom de l'entreprise cliente, pour repérer le travail sur le planning.
- **Activité (Seem / Semrac)** — le site/atelier qui fabrique. À remplir **en premier** : ce choix filtre ensuite les opérations et les opérateurs proposés.
- **Opération** — le type de travail (pliage, usinage, soudure…). La liste ne se remplit **qu'après** avoir choisi l'activité.
- **Pièce / Référence** — la référence de la pièce à fabriquer.
- **Durée estimée (h)** — le temps prévu pour l'opération : il dessine la barre sur le Gantt et sert de repère face au temps réel.
- **Priorité** — Normal / Urgent / Critique. « Critique » affiche le BDT **en rouge** sur le planning.
- **Type** — Interne (opérateur) ou Sous-traitance. « Sous-traitance » fait apparaître des cases supplémentaires (sous-traitant, délai retour).
- **Opérateur assigné** — la personne ou le poste qui fera le travail. La liste ne se remplit **qu'après** avoir choisi l'opération.

**➡️ Ensuite :** le BDT apparaît sur le **planning Gantt**, au statut « Programmé ». Vous pouvez le **glisser** sur la ligne d'un opérateur au bon créneau. Il attend maintenant d'être démarré par l'opérateur.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/production.md).

## Étape 2 — Réceptionner le BDT (démarrage de l'opération)
**⬅️ Avant :** Le BDT est programmé sur le planning. L'opérateur arrive à son poste et commence réellement le travail.
**📝 Ici, vous :** faites passer le BDT de « Programmé » à « Reçu / En cours » ; l'heure de début est enregistrée automatiquement.

![Planning Gantt de la production avec les BDT affectés aux opérateurs](../../assets/production-service.png)

Depuis le planning, clic droit sur la barre du BDT → « Passer à Reçu ». Une petite fenêtre de signature s'ouvre :
- **Matricule** — le matricule de l'opérateur qui prend le travail : c'est la preuve de **qui** a démarré.
- **Code PIN** — son code secret à 4 chiffres, qui confirme son identité.

**➡️ Ensuite :** le BDT passe au statut « Reçu / En cours » et l'**heure de début** est figée. C'est elle qui servira à calculer le temps réellement passé au moment du soldage.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/production.md).

## Étape 3 — Déclarer la sortie matière
**⬅️ Avant :** L'opération est en cours. L'opérateur prélève de la matière, des fournitures ou un consommable machine pour fabriquer.
**📝 Ici, vous :** enregistrez ce qui est sorti du stock pour ce lot, afin de suivre la consommation et le coût.

Sur le planning, double-clic sur la barre du BDT → fenêtre « Déclaration de sortie matière ». Vous renseignez :
- **Type de sortie** — Matière, Fourniture ou Consommable machine. « Consommable machine » fait apparaître le choix de la machine.
- **Article (stock)** — l'article précis prélevé du stock.
- **Quantité** — la quantité sortie (les décimales sont autorisées). **Toujours obligatoire.**
- **Machine concernée (OPEX)** — obligatoire pour un consommable machine : elle reçoit le coût de la consommation.
- **Observations** — motif de la sortie ou numéro de lot matière, pour la traçabilité.

**➡️ Ensuite :** le **stock est décrémenté** et le coût de la matière/consommable est rattaché au lot (et à la machine pour un consommable). Ces montants alimentent le **coût de revient** de la commande.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/production.md).

## Étape 4 — Solder le BDT (clôture de l'opération)
**⬅️ Avant :** L'opération est terminée. Le BDT est au statut « Reçu » et son heure de début est connue.
**📝 Ici, vous :** clôturez le BDT ; le temps réellement passé est calculé automatiquement.

Sur le planning, double-clic sur la barre (ou clic droit → « Solder le BDT »). Vous renseignez :
- **Heure de fin réelle** — pré-remplie à l'heure actuelle. Combinée à l'heure de début, elle donne le **temps réel** sans calcul de votre part.
- **Résultat** — Conforme / Reprise partielle / Non-conformité. « Non-conformité » crée **automatiquement une fiche NC** envoyée à la Qualité.
- **Quantité produite** — le nombre de pièces réellement fabriquées.
- **Observations / incidents** — anomalies, casses d'outils, écarts constatés.
- **Matricule + Code PIN** — la signature de l'opérateur qui solde : elle trace **qui** a clôturé.

**➡️ Ensuite :** le BDT passe à « Soldé », le temps réel est comparé à l'estimé (l'écart nourrit les indicateurs). Si vous avez choisi « Non-conformité », une **fiche NC part vers la Qualité**. Quand tous les BDT d'une commande sont soldés, l'affaire peut avancer vers l'**expédition** et la **facturation**.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/production.md).

## Étape 5 — Envoyer une opération en sous-traitance
**⬅️ Avant :** Une opération (traitement de surface, peinture, zingage…) ne se fait pas en interne : il faut la confier à un prestataire extérieur.
**📝 Ici, vous :** créez une commande de sous-traitance pour envoyer les pièces chez le prestataire.

![Formulaire de nouvelle sous-traitance en production](../../assets/form-production-st.png)

Depuis le panneau « Sous-traitance en cours » → « Nouvelle ST ». Vous renseignez :
- **N° Commande (ERP)** — la commande client concernée, pour garder le lien avec l'affaire.
- **Client final** — le client final de la pièce.
- **Opération à sous-traiter** — le traitement à faire réaliser dehors (zingage, sérigraphie, traitement thermique…). Choisissez-en un dans la liste plutôt que de le retaper.
- **Sous-traitant** — l'entreprise prestataire qui réalisera l'opération.
- **Date retour prévue** — la date à laquelle les pièces doivent revenir : elle cadence le suivi.
- **Priorité** — Normal / Urgent / Critique.

**➡️ Ensuite :** la sous-traitance apparaît sur le **planning Gantt BST** (suivi sur 14 jours). Au retour des pièces, la production reprend son cours. Pour un bon rattaché à un lot précis, on utilise « Nouveau BST » depuis le Gantt sous-traitance (lot lié, quantité, dates d'envoi et durée).

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/production.md).

## Étape 6 — Programmer la présence des opérateurs
**⬅️ Avant :** Pour affecter des BDT, il faut savoir **qui** est présent et sur quel créneau (matin, journée, soir).
**📝 Ici, vous :** définissez d'un coup les plages horaires (shifts) de plusieurs opérateurs sur toute une semaine.

Onglet Présence opérateurs → « Programmer la semaine ». Vous renseignez :
- **Shift à appliquer** — Matin, Journée, Soir, Absent, ou Effacer (retire la programmation).
- **Jours concernés** — Lun → Ven (5 jours ouvrés) ou Lun → Dim (7 jours).
- **Opérateurs cibles** — une case par opérateur ; des boutons permettent de tout cocher/décocher ou de sélectionner par site (Seem / Semrac).

**➡️ Ensuite :** les créneaux de présence s'affichent sur le **planning Gantt**. Les opérateurs disponibles deviennent des lignes cibles pour glisser les BDT. Les jours déjà marqués en absence RH ne sont **pas** modifiés, même si l'opérateur est coché.

> 📋 Le détail de **chaque case** : [guide des formulaires](../formulaires/production.md).

---

> ℹ️ Autres formulaires de configuration du service (référentiels) : création/modification de **process ateliers** et de **machines**, duplication de BDT. Ils préparent le planning mais ne font pas partie du flux quotidien de fabrication — voir le [guide des formulaires](../formulaires/production.md).
