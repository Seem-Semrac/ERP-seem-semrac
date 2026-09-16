# Ressources Humaines

**Pour qui :** RH

Gestion du personnel : employés, habilitations & certifications, compétences, organigramme, temps, pointage.

![rh-employes](../assets/rh-employes.png)

## Les onglets
- **Employés** — Fiches salariés (matricule, rôles, PIN).
- **Habilitations & Certifications** — Suivi (partagé avec la Qualité).
- **Matrice Compétences** — Compétences × salariés.
- **Organigramme** — Structure.
- **Gestion des Temps** — Congés, absences → planning ; temps reconstitués depuis la présence avec les **horaires de la cadence usine** du site et du jour.
- **Dashboard** — Indicateurs RH.

## Procédures
### Provisionner un salarié (accès ERP)
1. Onglet **Employés**, « Nouveau salarié ».
2. Renseigner **matricule**, **rôle(s)** (définit les droits — voir fiches de poste) et **PIN** (4 chiffres).
3. Le salarié peut se connecter (matricule + PIN) et pointer.

### Lire les temps reconstitués depuis la présence (cadence usine)
Sans pointage, **Gestion des Temps** reconstitue les heures à partir de la présence saisie en Production. Depuis le 16/09/2026, les créneaux (Matin, Journée, Après-midi, Soirée) n'ont **plus d'horaires fixes** : ils suivent la **cadence usine** du site de l'opérateur, jour par jour (réglée en Production › Process Ateliers › Cadence usine).
1. Arrivée et départ = début et fin du créneau ce jour-là ; **Heures** = amplitude moins la pause (celle de la Journée ; sinon 30 min au-delà de 6 h). En cadence Moyen : Matin 05:30-13:15 → **7,25 h**, Journée 07:30-16:00 (pause 12:00-12:45) → **7,75 h**, Soirée 21:00-05:30 → **8 h**.
2. **Validé par** indique la source : « Planning présence · cadence Moyen ». « ⚠ créneau fermé en cadence X ce jour (horaires par défaut) » = présence saisie avant un changement de cadence : faire corriger la présence en Production.
3. Les modèles d'horaires ne sont pas historisés : si la Production les modifie, les heures des mois passés changent aussi. **Exporter la paie avant** toute modification de modèle.

> Colonne et champ **Shift** des employés : libellé seul (Matin, Journée, Après-midi, Soirée), horaires selon la cadence. La matrice de compétences garde visibles les process **OAS** avec les filtres Seem et Semrac.

---
> Détails techniques : `docs/technique/06-modules/rh.md`. Droits d'accès : `docs/fiches-poste/`.
