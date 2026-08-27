# Formulaires — OAS (traitement de surface) · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Nouvelle balancelle OAS (multi-références)
**Quand l'utiliser :** Pour démarrer une session de traitement OAS, c'est-à-dire quand vous chargez des pièces sur une balancelle et les plongez dans le bain.
**Où le trouver :** Onglet « Lots & Balancelles » → bouton « Nouvelle balancelle » (en haut à droite), ou bouton « Balancelle » sur une ligne de lot.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| N° Session (auto) | texte | Non | Numéro de la session, généré automatiquement. Vous n'avez rien à taper, il est déjà rempli et non modifiable. | OAS-2026-4821 |
| Type de traitement (bain) | liste déroulante | Oui | Le type de bain / traitement de surface appliqué. **Les choix sont les process du/des poste(s) OAS** (créés dans Production → Postes en activité « OAS » : ex. désoxydation, oxydation incolore, oxydation noire, lavage, Surtec 650). Choisissez celui prévu sur la fiche du lot. | Oxydation incolore |
| Bain | liste déroulante (Principal OAS / Bain de lavage / Rinçage 1 / Rinçage 2 / Neutralisation / Bain 2 (essais)) | Oui | Le bain dans lequel la balancelle est plongée. En général « Principal OAS ». | Principal OAS |
| Heure entrée | date et heure | Oui | Le moment où vous mettez la balancelle dans le bain. Pré-rempli avec l'heure actuelle ; corrigez si besoin. | 04/07/2026 09:30 |
| Lot | liste déroulante (lots arrivés à l'OAS) | Oui | Le lot d'où viennent les pièces posées sur la balancelle. La liste montre le lot, la pièce et le nombre de pièces restant à traiter. | LOT-2026-018 · DISSIP-A24 · reste 40 pcs |
| Référence pièce | texte | Non | La référence de la pièce posée. Se remplit toute seule quand vous choisissez le lot ; modifiez-la si besoin. | DISSIP-A24 |
| Surface unitaire (mm²) | nombre | Oui | La surface d'UNE pièce, en mm². Se pré-remplit d'après la nomenclature ; sert à calculer la charge de la balancelle. | 1000 |
| Nb pièces | nombre | Oui | Combien de pièces de cette référence vous mettez sur la balancelle. | 25 |
| Observations | zone de texte | Non | Remarques libres sur la session (particularités, consignes). | Pièces fragiles, manipuler avec soin |

💡 **Astuce :** Vous pouvez ajouter plusieurs références sur la même balancelle avec le bouton « Ajouter une référence ». La jauge de charge se met à jour toute seule (surface unitaire × nombre de pièces, pour chaque ligne).
⚠️ **Attention :** La charge totale ne doit pas dépasser 550 000 mm². Si la jauge passe au rouge (« Charge dépassée »), retirez des pièces avant d'enregistrer, sinon l'enregistrement sera refusé. Chaque ligne doit avoir un lot, une surface supérieure à 0 et une quantité supérieure à 0.

## Clôture balancelle — Autocontrôle OAS
**Quand l'utiliser :** À la sortie du bain, pour clôturer la balancelle et enregistrer l'autocontrôle qualité des pièces traitées.
**Où le trouver :** Onglet « Lots & Balancelles » → tableau des balancelles → bouton « Clore + autocontrôle » sur une balancelle en cours.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| pH final bain | nombre | Non | Le pH mesuré dans le bain à la fin du traitement. | 0.85 |
| Température finale (°C) | nombre | Non | La température du bain relevée à la sortie. | 21.0 |
| Épaisseur anodique (µm) | nombre | Non | L'épaisseur de la couche d'oxydation obtenue sur les pièces, en micromètres. | 20 |
| Cp | nombre | Non | Indice de capabilité du procédé (mesure de régularité). Renseignez-le si vous en disposez. | 1.33 |
| Cpk | nombre | Non | Indice de capabilité centré (régularité tenant compte du centrage). | 1.20 |
| Heure de sortie | date et heure | Oui | Le moment où vous sortez la balancelle du bain. Pré-rempli avec l'heure actuelle. | 04/07/2026 11:15 |
| Aspect visuel | liste déroulante (Uniforme — couleur homogène / Léger voile / Tache locale / Coulure / Brûlure) | Non | L'aspect des pièces à l'œil après traitement. « Uniforme » = tout va bien ; les autres signalent un défaut. | Uniforme — couleur homogène |
| Résultat autocontrôle | liste déroulante (Conforme — libéré / Non conforme — bloqué (NC ouverte)) | Oui | Votre verdict : les pièces sont-elles bonnes ou non ? « Non conforme » bloque le lot et ouvre une non-conformité. | Conforme — libéré |
| Observations / anomalies | zone de texte | Non | Détails sur d'éventuelles anomalies ou actions correctives. | Couleur bain, résistances, anomalies |
| Matricule | texte | Oui | Votre matricule opérateur, pour signer la clôture. Se met en majuscules automatiquement. | M042 |
| Code PIN | texte (masqué) | Oui | Votre code PIN secret qui confirme votre identité. | (code personnel) |

💡 **Astuce :** À la validation, un PV de contrôle (procès-verbal d'autocontrôle) est créé automatiquement dans le service Qualité. Vous n'avez rien à faire de plus de ce côté.
⚠️ **Attention :** Matricule ET code PIN sont obligatoires : sans eux, la clôture est refusée. L'heure de sortie est également obligatoire. Si vous choisissez « Non conforme », le lot est bloqué et une NC part vers la Qualité.

## Relevé consommation d'eau
**Quand l'utiliser :** Pour enregistrer un relevé de la consommation et de la qualité de l'eau du service (suivi environnemental).
**Où le trouver :** Onglet « Relevé consommation eau » → bouton « Nouveau relevé ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Date | date | Oui | Le jour du relevé. Pré-rempli avec la date du jour. | 04/07/2026 |
| Volume (m³) | nombre | Non | Le volume d'eau consommé, en mètres cubes. | 1.250 |
| pH | nombre | Non | Le pH de l'eau mesuré. | 7.0 |
| Température (°C) | nombre | Non | La température de l'eau. | 18.0 |
| Turbidité (NTU) | nombre | Non | Le trouble de l'eau (plus le chiffre est haut, plus l'eau est trouble). | 1.0 |
| Chlore (mg/L) | nombre | Non | La teneur en chlore de l'eau, en milligrammes par litre. | 0.10 |
| Observations | zone de texte | Non | Remarques libres sur le relevé. | Contrôle mensuel |
| Conforme aux seuils réglementaires | case à cocher | Non | Cochée = l'eau respecte les seuils autorisés. Décochez si un paramètre dépasse. Cochée par défaut. | Cochée |

💡 **Astuce :** Un relevé d'eau peut créer automatiquement une ou plusieurs mesures environnementales (HSE). Une notification vous le confirme après l'enregistrement.
⚠️ **Attention :** Seule la date est obligatoire ; les mesures sont facultatives, mais renseignez ce que vous pouvez pour un suivi utile.

## Relevé périodique bain
**Quand l'utiliser :** Pour enregistrer les mesures d'un bain (contrôle régulier de la chimie du bain).
**Où le trouver :** Onglet « Relevés périodiques bains » → bouton « Nouveau relevé ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Date | date | Oui | Le jour du relevé. Pré-rempli avec la date du jour. | 04/07/2026 |
| Bain | liste déroulante (Principal OAS / Bain de lavage / Rinçage 1 / Rinçage 2 / Neutralisation) | Oui | Le bain concerné par le relevé. | Principal OAS |
| pH | nombre | Non | Le pH mesuré dans le bain. | 0.85 |
| Température (°C) | nombre | Non | La température du bain. | 21.0 |
| Concentration (g/L) | nombre | Non | La concentration du bain, en grammes par litre. | 180 |
| Densité | nombre | Non | La densité du bain. | 1.127 |
| Titrage H₂SO₄ (g/L) | nombre | Non | Le dosage d'acide sulfurique dans le bain, en grammes par litre. | 185 |
| Titrage Al (g/L) | nombre | Non | Le dosage d'aluminium dissous dans le bain, en grammes par litre. | 8.2 |
| Conductivité (mS/cm) | nombre | Non | La conductivité électrique du bain. | 420 |
| Conforme | case à cocher | Non | Cochée = le bain est dans les seuils. Décochez si un paramètre est hors seuil. Cochée par défaut. | Cochée |
| Observations | zone de texte | Non | Remarques libres sur le bain. | Ajout d'acide prévu |

💡 **Astuce :** Si vous décochez « Conforme », une non-conformité est ouverte automatiquement côté Qualité. Une notification vous prévient.
⚠️ **Attention :** Date et bain sont obligatoires. Les valeurs chimiques sont facultatives, mais servent au suivi de la conformité du bain.

## Demande d'achat (OAS)
**Quand l'utiliser :** Pour demander l'achat d'un produit ou d'un service nécessaire au service OAS (consommables, chimie, etc.).
**Où le trouver :** Modale de demande d'achat commune au service OAS (bouton de demande d'achat).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| — | — | — | Ce formulaire est un composant partagé (demandeAchatModal). Ses champs exacts sont décrits dans la fiche du module Achats / Demandes d'achat. | — |

💡 **Astuce :** Ce formulaire est identique dans tous les services ; référez-vous au guide des demandes d'achat pour le détail des cases.
