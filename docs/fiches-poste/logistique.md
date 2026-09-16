# Fiche de poste — Logistique (expéditions & stock)

> Rôle ERP : `logistique`. Voir aussi le manuel utilisateur (`docs/manuel/`).

## Mission
Livrer les commandes et tenir les stocks.

## Vos accès (droits)
| | Services |
|---|---|
| **Écriture** (créer/modifier) | expéditions, stock |
| **Lecture** | commercial, achats, production |

Vous vous connectez avec votre **matricule + PIN** (voir *Prise en main*). La barre latérale n'affiche que vos services autorisés.

## Vos tâches courantes
### 1. Créer un bon de livraison
1. Expéditions › **Bons de Livraison**, sélectionner la commande.
2. Quantités expédiées (BL partiel possible).
3. ⚠ Bloqué si quarantaine/NC : voir Qualité. Validation → facture.

![expeditions](../assets/expeditions.png)

### 2. Réceptionner une commande fournisseur
1. Expéditions › **Calendrier**, bloc « à réceptionner aujourd'hui » : **Traiter** sur la ligne du bon de commande.
2. Saisir le **N° de commande fournisseur** et le **N° de BL fournisseur** (obligatoires). Pas de quantité : c'est le reste à recevoir du BC (sauf BC sans quantité). Plus de « Livraison partielle » : le reliquat se déclare au PV.
3. **Réception hors France ?** Oui / Non. Si Oui : poids matière (kg), N° de nomenclature (douane), code EWX (1 ou 2), mode d'arrivée.
4. Valider : la réception passe dans l'onglet **Réceptions** (« PV à faire »). Faute de frappe → lien **Corriger**.

![form-expeditions-reception](../assets/form-expeditions-reception.png)

### 3. Faire le PV de contrôle à réception
1. Expéditions › **Réceptions**, bouton **PV à faire**.
2. Choisir **Conforme** ou **Non conforme** et le **contrôleur** (personnes ayant l'écriture Expéditions). BC exigeant un certificat matière : cocher « Certificat matière reçu et conforme » — sans elle, pas de conforme.
3. Pour **chaque ligne** : **Qté reçue** (pré-remplie avec la prévue), case **Reliquat** si le fournisseur annonce le reste, **observation** si un défaut est constaté. « Conforme ? » se calcule (quantitatif / qualitatif).
4. Effets : quantités conformes → **Stock › Mise en stock** ; une **NC par ligne en écart** ; ligne avec observation → quarantaine ; **excédent** → Direction ; reliquat → **BC de reliquat** aux Achats.

![form-expeditions-pv](../assets/form-expeditions-pv.png)

### 4. Ranger une entrée en stock
1. Stock › **Rangement / Mise en stock**, liste **À ranger** : bouton **Accepter l'entrée en stock**.
2. Confirmer le **type d'objet** ; emplacement verrouillé si la référence en a un, sinon choisir la **zone** (elle devient l'emplacement fixe) ou créer « Nouvelle zone pour ce type ».
3. **Ranger en stock** : le stock est crédité ; la matière d'une affaire est disponible pour les BDT quand tout est rangé.
4. Inventaire : sous-onglet **Ajustement de stock** (quantité constatée + motif). Zones : **Types & zones**. Emplacement fixe à changer : Gestion du stock › **Niveaux d'approvisionnement** (historisé).

![form-stock-rangement](../assets/form-stock-rangement.png)

### 5. Expédier un retour fournisseur
1. Expéditions › **Envois**, carte **Retours fournisseurs** : les lots que la Qualité a décidé de renvoyer.
2. Préparer le colis, puis **Expédié** ; la référence du bon de retour ou le n° de suivi est facultative.
3. La ligne quitte alors la liste ; un second clic est refusé.

![expeditions-envois](../assets/expeditions-envois.png)

### 6. Suivre les alertes de stock
1. Stock › **Alertes et Réappro.** : articles sous le seuil.
2. Stock en temps réel : « Masquer les produits vides » est cochée par défaut (mémorisée sur le poste).

![stock-rt](../assets/stock-rt.png)

---
> Fiche générée (`scripts_doc/gen_fiches_poste.mjs`). Sécurité & traçabilité : `docs/technique/04-auth-rbac.md`.
