# Production

**Pour qui :** Programmation / opérateurs

Planification et suivi de la fabrication : planning Gantt des BDT (bons de travail) et BDS (sous-traitance), présence des opérateurs, lots.

![production-service](../assets/production-service.png)

## Les onglets
- **Planning Gantt BDT** — **Le seul planning de l'atelier.** Files « BDT à classer » et « BST à planifier » **au-dessus** du Gantt, puis un Gantt par poste, puis le bloc « Affectation des ressources aux postes » (opérateurs du jour par créneau). BDT/BDS prioritaires encadrés rouge. Bouton « Agrandir le planning ».
- **Planning Gantt BST** — Planning de la sous-traitance (14 jours).
- **Présence opérateurs** — Programmation des horaires (matin / journée / soir / absent) et congés. Pilote qui est affectable dans le planning.
- **Commandes & Lots** — Vue des commandes à faire, découpées en lots et BDT.
- **Process Ateliers** — Référentiel des postes, machines et process (taux horaire, capacité).
- **Dashboards** — Programmation et production.

> Il n'y a **plus de page « Affectation » séparée** ni de sous-navigation « Programmation | Affectation » : tout se fait sur le planning unique.

## Procédures
### Affecter et solder un BDT
1. Ouvrir **/production/service** (onglet **Planning Gantt BDT**) — c'est le seul planning.
2. Dans « **BDT à classer** » (au-dessus du planning), **glisser** une carte sur le poste voulu, ou sur une sous-case **Matin / Ap-m / Soir** pour affecter l'opérateur du créneau.
3. Quand l'opération démarre : clic droit sur la barre → **Reçu**.
4. À la fin : clic droit → **Solder** → saisir le temps réel + **PIN** de l'opérateur (traçabilité). Un écart déclenche éventuellement une NC.

### Voir l'étape d'un BDT (focus)
Cliquer une carte BDT ou BST **isole son étape** : seul le poste (ou le sous-traitant) qui peut la prendre reste affiché, encadré de **l'étape précédente et de l'étape suivante** — gammes BDT et BDS confondues. Recliquer sort du focus.

### Fractionner un BDT en plusieurs morceaux
Utile quand une opération longue doit être répartie sur plusieurs créneaux, postes ou jours.
1. Clic droit sur la carte du BDT → **« Séparer en morceaux »**.
2. Choisir le **nombre de morceaux** (2 à 12) puis ajuster la **durée de chaque morceau**. Le contrôle de la somme se met à jour en direct.
3. **« Séparer »** : le BDT d'origine garde le premier morceau, les suivants sont créés avec les suffixes **-M2**, **-M3**… et retombent dans la file « BDT à classer », à programmer.

> Si la somme saisie diffère de la durée d'origine, la répartition est ajustée **au prorata** à l'enregistrement.

---
> Détails techniques : `docs/technique/06-modules/production.md`. Droits d'accès : `docs/fiches-poste/`.
