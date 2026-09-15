# Production

**Pour qui :** Programmation / opérateurs

Planification et suivi de la fabrication : planning Gantt des BDT (bons de travail) et BDS (sous-traitance), présence des opérateurs, lots.

![production-service](../assets/production-service.png)

## Les onglets
- **Planning Gantt BDT** — **Le seul planning de l'atelier.** Files « BDT à classer » et « BST à planifier » **au-dessus** du Gantt, puis un Gantt par poste, puis le bloc « Affectation des ressources aux postes » (opérateurs du jour par créneau). BDT/BDS prioritaires encadrés rouge. Bouton « Agrandir le planning ».
- **Planning Gantt BST** — Planning de la sous-traitance (vue de 21 jours). Chaque carte « BST à planifier » indique « **Dispo le …** » quand l'étape précédente du lot fixe un jour au plus tôt.
- **Présence opérateurs** — Programmation des horaires sur **4 créneaux** (Matin 6h-14h · Journée 7h-17h · Après-midi 14h-22h · Soirée 22h-6h) ou absent, par un **menu** au clic sur la case, et congés des opérateurs. Pilote qui est affectable dans le planning.
- **Commandes & Lots** — Vue des commandes à faire, découpées en lots et BDT.
- **Process Ateliers** — Référentiel des postes, machines et process. **Seul le process machine porte un coût horaire** (« Taux horaire machine »), saisi à la main ; machines et postes n'en ont plus.
- **Dashboards** — Programmation et production.

> Il n'y a **plus de page « Affectation » séparée** ni de sous-navigation « Programmation | Affectation » : tout se fait sur le planning unique.

## Procédures
### Affecter et solder un BDT
1. Ouvrir **/production/service** (onglet **Planning Gantt BDT**) — c'est le seul planning.
2. Dans « **BDT à classer** » (au-dessus du planning), **glisser** une carte sur le poste voulu, ou sur une sous-case **Matin / Journée / Après-midi / Soirée** pour affecter l'opérateur du créneau. Le **chemin critique** s'applique à la pose (voir ci-dessous).
3. Quand l'opération démarre : clic droit sur la barre → **Reçu**.
4. À la fin : clic droit → **Solder** → saisir le temps réel + **PIN** de l'opérateur (traçabilité). Un écart déclenche éventuellement une NC.

### Programmer la présence des opérateurs
1. Onglet **Présence opérateurs** → **Planning de présence** (grille opérateurs × 7 jours, ‹ › pour changer de semaine).
2. **Cliquer une case** : un menu s'ouvre — **Matin 6h-14h · Journée 7h-17h · Après-midi 14h-22h · Soirée 22h-6h · Absent · Effacer** (le créneau en place est coché). Un choix = **un seul** enregistrement. S'il échoue, la case revient à la dernière valeur enregistrée et un message rouge donne la raison. **Effacer** vide vraiment la case (« Non programmé »). Au clavier : Entrée ouvre le menu, flèches pour choisir, Échap pour refermer.
3. **Semaine entière** : « **Programmer la semaine** » → créneau (ou Effacer), jours, opérateurs cochés → « Appliquer à la semaine ». Le message final compte les cases enregistrées **et les échecs**.
4. Une semaine **jamais lue** a ses cases **verrouillées** (« … » pendant la lecture, « ? » + bouton « Réessayer » si elle a échoué) : on ne peut pas écraser une présence qu'on ne voit pas. Les absences RH (cadenas) ne se modifient pas ici.
5. **Congés des opérateurs** : vue « Demandes de congés à traiter » → **Approuver** (pose les absences, renvoie au pool les BDT de la période, décompte le solde) ou ✕. Réservé aux congés d'**opérateurs** ; **personne ne valide son propre congé** ; un congé déjà traité est refusé. Si un effet n'a pas pu se faire, un message orange le dit.

![Présence opérateurs — menu d'une case](../assets/production-presence.png)

### Voir l'étape d'un BDT (focus)
Cliquer une carte BDT ou BST **isole son étape** : seul le poste (ou le sous-traitant) qui peut la prendre reste affiché, encadré de **l'étape précédente et de l'étape suivante** — gammes BDT et BDS confondues. Recliquer sort du focus.

### Voir le réglage et la réalisation d'un BDT
Chaque BDT distingue son **réglage** (fixe, fait une seule fois) de sa **réalisation** : durée = réglage + réalisation.
- **Carte de la goulotte** : mini-barre hachurée (réglage) | bleue (réalisation) et « Réglage 0,5 h · Réalisation 3,5 h » — « réglage non renseigné » s'il est inconnu ; pastille « M2 · 2/3 » sur un morceau.
- **Barre du Gantt** : segment hachuré en tête, fin marquée d'un trait ; libellé « 8h · 0,5 + 3,5 h ».
- **Infobulle, réception, soldage** : lignes Réglage / Réalisation.
- **Nouveau BDT** : champ facultatif « dont réglage (h) ».

### Chemin critique : l'étape suivante démarre après le réglage de la précédente
Deux étapes consécutives d'un lot peuvent se chevaucher, mais l'étape d'après ne commence qu'après le **réglage** de l'étape d'avant (début + réglage). Cas particuliers : étape précédente soldée ou en goulotte → rien ; reçue → son début réel ; posée sans heure → comptée à 6 h ; porteur du réglage en goulotte mais morceaux posés → pas avant le plus tôt des morceaux ; OAS entre les deux ou étape suivante sous-traitée → **fin complète** ; étape précédente sous-traitée → jour de retour, 5 h. Grille 5 h–23 h (report au lendemain).
- Au glisser, une **zone rouge hachurée** montre la partie de journée interdite (« au plus tôt 9h30 · après le réglage de … »).
- Posé trop tôt le bon jour → **calé** à l'au plus tôt (« Calé à 9h30 (chemin critique) ») ; un jour avant → **refusé**. Posé au clic, sans heure → le BDT garde son heure, sinon 6 h.
- Déplacer une étape ne décale **jamais** les suivantes : elles sont signalées (message + carte rouge **« Enchaînements à revoir »** + pastille rouge sur la barre).
- BST : « **Dispo le …** » sur la carte ; un jour antérieur est refusé (aucun BC créé).

![Chemin critique — carte « Enchaînements à revoir », segment de réglage, pastille rouge](../assets/production-gantt-reglage.png)

### Découper un BDT en plusieurs morceaux
Utile pour réaliser une opération en plusieurs fois (plusieurs créneaux, postes ou jours). La découpe se fait **uniquement dans la goulotte** « BDT à classer ». **Seule la réalisation se découpe** : le réglage reste sur le morceau 1.
1. Dans la goulotte, cliquer le bouton **ciseaux** de la carte du BDT. La fenêtre décompose la durée : « Durée D h = Réglage R h + Réalisation V h ».
2. Le champ **Réglage** est verrouillé s'il est connu (ou porté par un autre morceau), saisissable s'il est inconnu (BDT d'origine seulement ; « Utiliser … h » recopie une proposition incertaine de la gamme). Lecture en échec → « Relire le réglage ».
3. La **jauge** montre tout le temps de réalisation à répartir (« Temps de réalisation à répartir : V h ») : un **segment coloré et numéroté par morceau**, proportionnel au temps alloué ; le libre en **gris** (« reste à répartir X h ») ; un dépassement en **orange rayé** (« +X h au-delà du temps prévu », repère « ▲ prévu V h ») ; « tout le temps est réparti » en vert. Le **réglage** est à part, bloc **hachuré** fixe « Réglage R h · morceau 1 ». La jauge reste visible en haut quand on fait défiler les morceaux. V = 0 → « aucun temps de réalisation à répartir » (curseurs sur 0–8 h).
4. Une ligne par morceau (couleur de son segment) : **curseur** de 0 à V (quart d'heure à la souris, aimanté sur la valeur qui complète exactement V ; clavier : flèches ± 0,25 h, Page ± 1 h, Début 0, Fin V), **champ en heures** au centième (synchronisé), **part en %**, corbeille. Ouverture : 2 morceaux à V/2. Rien ne bloque pendant le glissement (dépassement possible, signalé). Le morceau 1 peut ne porter que le réglage ; les autres doivent avoir du temps.
5. Aides : **« Répartir également »** (parts égales au centième, le dernier prend le reste), **« Mettre le reste sur le dernier morceau »**, **« + Ajouter un morceau »** (12 au maximum, reçoit le reste s'il y en a), corbeille (2 au minimum) ; ajouter ou retirer un morceau ne touche pas aux temps des autres.
6. **« Découper »** (actif quand chaque morceau a du temps, morceau 1 à 0 permis s'il porte le réglage) : somme = V → découpe directe ; somme ≠ V → confirmation « Le temps réparti (X h) diffère du temps de réalisation prévu (V h) : découper quand même ? ». Le BDT d'origine devient le morceau 1 (réglage compris) et garde son numéro ; les suivants **-M2**, **-M3**… ont un réglage 0. Tous restent dans la goulotte. Fenêtre ouverte sur un BDT modifié entre-temps → « Page périmée ».

![Fenêtre de découpe d'un BDT](../assets/form-production-separer.png)

### Annuler une découpe
Bouton **« Annuler la découpe »** (flèche orange) sur la carte d'un morceau → confirmation listant les morceaux → le BDT d'origine retrouve **sa durée d'avant la découpe** (ou la somme pour une découpe ancienne), réglage compté une fois. Refusé si un morceau est posé, reçu, soldé, affecté, sous-traité, annulé ou déjà utilisé (historique, NC, sortie de stock, cotes). Relançable sans risque après une coupure.

> Un BDT **posé sur le planning** ne se découpe pas : le déprogrammer d'abord (clic droit → « Déprogrammer », ou glisser la barre dans la goulotte). Un BDT reçu, soldé, annulé ou sous-traité ne se découpe pas non plus.

### Saisir le taux horaire machine d'un process
Depuis le 14/09/2026, le coût horaire se saisit **sur le process**, et seulement sur un process **machine**. Une machine ou un poste n'ont plus de taux (le champ « Coût machine (€/h) » a disparu).
1. Onglet **Process Ateliers** → volet **Postes & Process** → déplier le poste (flèche).
2. Chaque process affiche une pastille : **« X €/h »** (taux saisi), **« taux à saisir »** (process machine sans taux : son temps machine compte 0 €), **« coût RH »** (process manuel).
3. **Crayon** du process → **Type** (Machine / Manuel / OAS) → **Taux horaire machine (€/h HT)** → **Enregistrer**. Vide = « taux à saisir ».
4. Pour un process **manuel**, pas de taux : une note rappelle que le temps homme est valorisé au **coût chargé RH** des opérateurs (fiche salarié, service RH), avec la moyenne du site.

![Modifier le process](../assets/form-production-process-edit.png)

> **Taux de départ** : chaque process machine a reçu l'ancien coût horaire de sa machine — souvent **35 €/h**, l'ancienne valeur par défaut. À vérifier un par un.

### Comment se calcule le coût d'une étape
| Temps de la gamme | Homme | Machine | Compté |
|---|---|---|---|
| Réglage homme (ROP) | ✔ | — | une fois par lot |
| Réglage machine (RGM) | ✔ | ✔ | une fois par lot |
| Temps homme variable (MO) | ✔ | — | par pièce |
| Temps machine variable (Mach) | — | ✔ | par pièce |

Heures homme × coût chargé RH + heures machine × taux horaire machine du process (process machine seulement).
**Exemple** (lot de 10 pièces, machine à 60 €/h, coût chargé 35 €/h) : réglage homme 0,5 h + réglage machine 1 h + 0,1 h × 10 en homme + 0,2 h × 10 en machine → **2,5 h homme** (87,50 €) et **3 h machine** (180 €) = **267,50 €** le lot, 26,75 € la pièce.

---
> Détails techniques : `docs/technique/06-modules/production.md`. Droits d'accès : `docs/fiches-poste/`.
