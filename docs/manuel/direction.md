# Direction

**Pour qui :** Direction

Cockpit de pilotage : validations en attente, jalons critiques, vue par affaire, KPIs, budget, santé des données.

![direction](../assets/direction.png)

## Les onglets
- **À valider** — File des jalons soumis à la Direction.
- **Jalons critiques** — Retards, impayés, NC bloquantes, ruptures.
- **Par affaire** — Vue 360 d'une affaire.
- **Pilotage** — KPIs (cibles kpi_objectifs).
- **Budget** — Suivi budgétaire.
- **Santé des données** — Score DICT de complétude.

## Procédures
### Valider un jalon
1. Onglet **À valider**.
2. Pour chaque élément : consulter, puis **Valider** ou **Refuser** (avec commentaire). Réservé à la Direction.

### Décider d'un excédent de réception
1. Onglet **À valider** : ligne **Expéditions · « Excédent de réception »** (« … +N (reçu … pour … prévu) »), créée par le PV de réception quand plus de pièces que prévu sont arrivées.
2. **« Accepter »** : l'excédent part dans **Stock › Rangement / Mise en stock**.
3. **« Refuser »** : motif obligatoire (pas d'annulation / révision) ; rien n'entre en stock et un **retour à expédier** apparaît dans **Expéditions › Envois › Retours fournisseurs**.

> Excédent d'une ligne en quarantaine (observation ou certificat absent) : acceptable **seulement après la décision de la Qualité**, et pas si elle a tout renvoyé. Onglet Traités : « ACCEPTÉ · MISE EN STOCK » / « REFUSÉ · RETOUR FOURNISSEUR ».

![Refuser un excédent de réception](../assets/form-direction-refus-excedent.png)

### Lancer le scan d'alertes
1. Bouton **« Scanner les alertes »** : détecte retards/impayés/NC/ruptures et les matérialise dans la file de validation. Une référence dont une livraison attend son rangement n'est pas une rupture.

---
> Détails techniques : `docs/technique/06-modules/direction.md`. Droits d'accès : `docs/fiches-poste/`.
