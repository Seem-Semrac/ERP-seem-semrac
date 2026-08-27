# Formulaires — RH · guide champ par champ

> Guide pour les nouveaux utilisateurs : chaque formulaire du service, **chaque case expliquée simplement**. Un champ marqué « Oui » en Obligatoire doit être rempli pour pouvoir valider.

## Fiche salarié (créer / modifier un employé)
**Quand l'utiliser :** Pour embaucher un nouveau salarié ou mettre à jour les informations d'un salarié existant (poste, contrat, accès à l'ERP, etc.).
**Où le trouver :** Onglet « Employés » → bouton « Nouvel employé » (en haut à droite) pour créer, ou bouton « Fiche » sur la ligne d'un salarié pour modifier.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Nom | texte | Oui | Le nom de famille du salarié. | Dupont |
| Prénom | texte | Non | Le prénom du salarié. | Alain |
| Rôle principal | liste déroulante (Opérateur, OAS (opérateur), Qualité, Commercial, Bureau d'Études, Achats, Logistique, Production, Comptable, Maintenance, RH, Direction) | Oui | Définit le métier du salarié et ses droits d'accès dans l'ERP. Un texte en bas du bloc « Identifiants ERP » rappelle les autorisations liées au rôle choisi. | Opérateur |
| Activité (opérateur) | liste déroulante (Seem, Semrac) | Non | L'usine de rattachement. N'apparaît que si le rôle est « Opérateur » ou « OAS ». | Seem |
| Poste | texte | Non | L'intitulé précis du poste occupé. | Usinage CN |
| Contrat | liste déroulante (CDI, CDD, Apprenti, Interim, Stage) | Non | Le type de contrat de travail. Par défaut CDI. | CDI |
| Shift | liste déroulante (Matin 6h-14h, Après-midi 14h-22h, Journée 7h-17h, Nuit) | Non | L'équipe / horaire de travail habituel. | Matin 6h-14h |
| Date d'entrée | date | Non | Le jour d'arrivée dans l'entreprise. | 01/09/2025 |
| Taux horaire chargé (€/h) | nombre **confidentiel** | Non | Coût horaire complet du salarié (salaire + charges). **Masqué par `***`** : réservé aux personnes ayant les **droits d'écriture RH** (RH / Direction) — pour les autres, la valeur n'est même pas dans la page. Pour le voir/éditer : **maintenir le clic** dessus (il réapparaît masqué au relâchement). | 28.50 |
| Email | texte | Non | L'adresse e-mail professionnelle. | a.dupont@seem.fr |
| Téléphone | texte | Non | Le numéro de téléphone. | 06 12 34 56 78 |
| Statut | liste déroulante (Actif, Inactif) | Non | Indique si le salarié est présent dans les effectifs. Un salarié « Inactif » n'apparaît plus comme actif. | Actif |
| Adresse | texte | Non | L'adresse postale du salarié. | 12 rue des Fleurs, 74000 |
| Rôles supplémentaires | cases à cocher (mêmes 12 rôles que « Rôle principal ») | Non | Cochez des rôles pour **ajouter** des droits d'accès en plus du rôle principal. Le rôle principal fixe le métier ; les cases ajoutent des permissions. | Cocher « Qualité » |
| Identifiant / Matricule | texte | Non | Le code personnel utilisé pour se connecter, pointer et solder les bons. | OP-010 |
| Code PIN (MDP) | texte | Non | Le mot de passe (chiffres) associé au matricule. Laissez vide pour ne pas le changer lors d'une modification. | 1234 |
| Solde congés payés (h) | nombre | Non | Le nombre d'heures de congés payés disponibles. Par défaut 175. | 175 |
| Solde RTT / repos (h) | nombre | Non | Le nombre d'heures de RTT ou de repos disponibles. Par défaut 0. | 21 |
| Matricule validateur | texte | Non | (Création uniquement) Le matricule du responsable RH ou Direction qui autorise l'embauche. | ADM001 |
| Code PIN validateur | texte | Non | (Création uniquement) Le code secret du responsable qui autorise l'embauche. | •••• |
| Soumettre cette fiche à la validation de la Direction | case à cocher | Non | Cochez pour envoyer la fiche en validation à la Direction (embauche ou changement de rôle). | Cochée |

💡 **Astuce :** Quand vous choisissez le rôle principal, un rappel des accès accordés s'affiche automatiquement en bas du bloc « Identifiants ERP ». Utile pour vérifier que le salarié aura les bons droits.
⚠️ **Attention :** Seul le champ « Nom » est strictement obligatoire pour enregistrer. Mais sans matricule et code PIN, le salarié ne pourra pas se connecter, pointer ni solder de bons de travail. À la création, le bloc jaune « Habilitation requise » demande le matricule et le code d'un responsable RH/Direction.

## Ajouter / modifier une habilitation ou certification
**Quand l'utiliser :** Pour déclarer une habilitation, un diplôme, une certification ou une formation obtenue par un salarié, et suivre sa date d'expiration.
**Où le trouver :** Onglet « Habilitations & Certifications » → bouton « Ajouter » (le formulaire s'ouvre en bas), ou bouton crayon (modifier) sur une ligne du tableau.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Salarié | liste déroulante (la liste des salariés enregistrés) | Oui | La personne concernée par l'habilitation. Choisissez-la dans la liste. | Alain Dupont |
| Type | liste déroulante (habilitation, diplome, certification, formation) | Oui | La nature du document. | habilitation |
| Intitulé | texte | Oui | Le nom de l'habilitation ou de la formation. | Soudure TIG niveau 2 |
| Organisme | texte | Non | L'organisme qui a délivré le document. | AFPA |
| Date obtention | date | Non | Le jour où l'habilitation a été obtenue. | 15/03/2024 |
| Date expiration | date | Non | Le jour où l'habilitation expire. Laissez vide si elle est illimitée. | 15/03/2027 |
| Habilitation critique (EN 9100) | case à cocher | Non | Cochez si cette habilitation est essentielle à la qualité (norme aéronautique EN 9100). Elle sera signalée en rouge. | Cochée |
| Notes | zone de texte | Non | Remarques libres sur l'habilitation. | Recyclage prévu en 2027 |

💡 **Astuce :** Les habilitations expirées ou proches de l'expiration remontent automatiquement dans l'onglet « Alertes » et sur le tableau de bord.
⚠️ **Attention :** Il faut obligatoirement choisir un salarié et saisir un intitulé, sinon l'enregistrement est refusé.

## Nouvelle demande de congé (côté RH)
**Quand l'utiliser :** Pour enregistrer une demande d'absence ou de congé au nom d'un salarié depuis le service RH.
**Où le trouver :** Onglet « Gestion des Temps » → encadré « Absences & congés » (colonne de droite) → bloc « Nouvelle demande ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Salarié | liste déroulante (la liste des salariés, avec leur solde de congés) | Oui | La personne qui prend le congé. | Alain Dupont (solde 175h) |
| Type | liste déroulante (Congé payé, RTT, Maladie, Sans solde, Événement familial, Formation, Récupération) | Non | La nature de l'absence. | Congé payé |
| Motif | texte | Non | La raison de l'absence (facultatif). | Vacances d'été |
| Date de début | date | Oui | Le premier jour d'absence. | 04/08/2025 |
| Date de fin | date | Oui | Le dernier jour d'absence. | 18/08/2025 |
| Heures | nombre | Non | Nombre d'heures d'absence. Laissez vide pour un calcul automatique (jours ouvrés × 7 h). | 70 |

💡 **Astuce :** Si vous ne connaissez pas le nombre d'heures exact, laissez le champ « Heures » vide : le système calcule automatiquement jours ouvrés × 7 h.
⚠️ **Attention :** Le salarié, la date de début et la date de fin sont obligatoires. Une fois validée, la demande pose automatiquement les jours d'absence au planning.

## Demande de correction de pointage
**Quand l'utiliser :** Pour corriger un horaire d'arrivée ou de départ mal enregistré, avec l'autorisation d'un responsable.
**Où le trouver :** Onglet « Gestion des Temps » → sous-onglet « Corrections ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Employé | liste déroulante (la liste des employés) | Oui | Le salarié dont le pointage doit être corrigé. | Alain Dupont |
| Date concernée | date | Oui | Le jour du pointage à corriger. | 10/06/2025 |
| Heure arrivée corrigée | date (heure) | Non | Le bon horaire d'arrivée. | 06:00 |
| Heure départ corrigée | date (heure) | Non | Le bon horaire de départ. | 14:00 |
| Autorisation accordée par | liste déroulante (Responsable Production (Sylvie R.), Responsable Qualité (P.-Y. Blanc), Direction Générale) | Oui | Le responsable qui autorise la correction. | Responsable Production (Sylvie R.) |
| Motif de correction | zone de texte | Oui | La raison de la correction. Elle est tracée et archivée. | Badgeuse en panne ce jour-là |

⚠️ **Attention :** Toute correction exige l'autorisation d'un responsable et un motif obligatoire. La raison saisie est conservée et archivée.

## Modifier un pointage (fenêtre rapide)
**Quand l'utiliser :** Pour corriger directement les heures d'un pointage du jour depuis le tableau, avec un contrôle d'accès responsable.
**Où le trouver :** Onglet « Gestion des Temps » → sous-onglet « Journée » → bouton « Modifier » sur la ligne d'un pointage.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Heure arrivée corrigée | date (heure) | Non | Le bon horaire d'arrivée. | 06:05 |
| Heure départ corrigée | date (heure) | Non | Le bon horaire de départ. | 14:00 |
| Motif | texte | Oui | La raison de la correction. | Oubli de badge |
| Matricule RH | texte | Oui | Le matricule du responsable RH qui autorise (ADM001 ou ADM002 uniquement). | ADM001 |
| Code secret | texte | Oui | Le code secret du responsable RH. | •••• |

⚠️ **Attention :** Seuls les matricules ADM001 ou ADM002 peuvent valider une correction. Le motif est obligatoire.

## Matrice des compétences (niveau par process)
**Quand l'utiliser :** Pour indiquer le niveau de maîtrise d'un opérateur sur chaque process de l'atelier.
**Où le trouver :** Onglet « Matrice Compétences » → sous-onglet « Matrice Production » → cliquer sur une case au croisement d'un opérateur (colonne) et d'un process (ligne).

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Niveau de compétence | case à cocher (clic qui fait défiler : — Non formé, ★ En formation, ★★ Autonome, ★★★ Expert) | Non | Chaque clic sur la case fait passer au niveau suivant. La sauvegarde est automatique. | ★★ Autonome |

💡 **Astuce :** Cliquez plusieurs fois sur une case pour faire évoluer le niveau (— → ★ → ★★ → ★★★ puis retour à —). La légende en haut rappelle la signification des étoiles.

## Liens hiérarchiques (organigramme)
**Quand l'utiliser :** Pour définir qui est le responsable hiérarchique de chaque salarié et construire l'organigramme.
**Où le trouver :** Onglet « Organigramme » → bouton « Liens hiérarchiques ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Responsable | liste déroulante (— Aucun (sommet) —, puis la liste des autres salariés) | Non | Le supérieur hiérarchique direct du salarié. Choisissez « Aucun (sommet) » pour la Direction. | Sylvie R. — Responsable Production |

💡 **Astuce :** Le choix est enregistré immédiatement et l'organigramme (onglet « Vue organigramme ») se met à jour tout seul.

## Terminal de pointage
**Quand l'utiliser :** Pour badger son arrivée, ses pauses et son départ sur la borne de pointage.
**Où le trouver :** Page « Pointage » → cliquer sur l'un des 4 boutons (Arrivée, Début Pause, Fin Pause, Sortie) : une fenêtre d'identification s'ouvre.

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Matricule | texte | Oui | Votre matricule / identifiant personnel. | OP-010 |
| Code secret | texte | Oui | Votre code PIN personnel. | •••• |

💡 **Astuce :** Vous pouvez valider en appuyant sur la touche Entrée après avoir saisi votre code.
⚠️ **Attention :** Le matricule et le code sont tous deux obligatoires. Sans identification, le pointage n'est pas enregistré.

## Demande de congé depuis la borne
**Quand l'utiliser :** Pour qu'un salarié fasse lui-même une demande de congé ou d'absence depuis le terminal de pointage.
**Où le trouver :** Page « Pointage » → bouton « Faire une demande de congé ».

| Champ | Saisie | Obligatoire | À quoi ça sert / comment le remplir | Exemple |
|---|---|---|---|---|
| Matricule | texte | Oui | Votre matricule / identifiant. | MAT-042 |
| Code secret | texte | Oui | Votre code PIN personnel. | •••• |
| Nom | texte | Oui | Votre nom de famille. | Dupont |
| Prénom | texte | Oui | Votre prénom. | Alain |
| Type | liste déroulante (Congé payé, RTT, Maladie, Sans solde, Autre) | Non | La nature de l'absence demandée. | Congé payé |
| Date début | date | Oui | Le premier jour d'absence souhaité. | 04/08/2025 |
| Date fin | date | Oui | Le dernier jour d'absence souhaité. | 18/08/2025 |
| Motif | texte | Non | La raison de la demande (facultatif). | Vacances |

💡 **Astuce :** La demande part automatiquement en validation vers la Direction (fonctions support) ou vers la Production / Présence (opérateurs).
⚠️ **Attention :** Le matricule, le code, le nom, le prénom et les deux dates sont requis. Une identification incorrecte fait échouer la demande.
