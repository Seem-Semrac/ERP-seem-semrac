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

### Découper un BDT en plusieurs morceaux
Utile pour réaliser une opération en plusieurs fois (plusieurs créneaux, postes ou jours). La découpe se fait **uniquement dans la goulotte** « BDT à classer » : il n'y a plus de découpe depuis le planning (plus d'entrée dans le clic droit).
1. Dans la goulotte, cliquer le bouton **ciseaux** de la carte du BDT. La fenêtre rappelle le numéro, l'opération, la pièce et la durée actuelle.
2. Saisir les **heures de chaque morceau** (2 morceaux proposés, pré-remplis à la moitié de la durée actuelle). **« + Ajouter un morceau »** ajoute une ligne (12 au maximum), la corbeille en retire une (2 au minimum) ; les temps déjà saisis sont conservés.
3. Le pied affiche le **temps alloué total** et l'écart avec la durée d'origine (« +1,5 h », « identique », « −2 h ») — à titre indicatif : le temps est **libre**, le total peut différer de la durée d'origine.
4. **« Découper »** (grisé tant qu'un morceau est vide ou à 0) : le BDT d'origine devient le premier morceau et garde son numéro, les suivants sont créés avec les suffixes **-M2**, **-M3**… Chaque morceau reçoit **exactement** le temps saisi et reste dans la goulotte, à programmer séparément.

> Un BDT **posé sur le planning** ne se découpe pas : le déprogrammer d'abord (clic droit → « Déprogrammer », ou glisser la barre dans la goulotte). Un BDT reçu, soldé, annulé ou sous-traité ne se découpe pas non plus.

---
> Détails techniques : `docs/technique/06-modules/production.md`. Droits d'accès : `docs/fiches-poste/`.
