# Commercial

**Pour qui :** Chargé(e) d'affaires / commercial

Point d'entrée des affaires : réception des demandes, chiffrage, transformation en commande, gestion des avoirs et des relances.

![commercial-dt](../assets/commercial-dt.png)

## Les onglets
- **Demandes site internet** — Réceptionne les demandes envoyées depuis le site web (formulaire de contact).
- **DT / Demande travaux** — Crée une Demande de Travaux : client, pièces, plans, activité (Seem/Semrac). Génère le n° d'affaire.
- **Offre (PRC1-D5)** — Établit le devis à partir d'une DT (prix de revient + marge).
- **Avoirs & Commandes P** — Liste des avoirs (AV-AAAA-XX) et des commandes prioritaires (CMDP-AAAA-XX) issues des retours clients.
- **Liste clients** — Fiche client, interlocuteurs, adresses de facturation.
- **Commandes validées** — Commandes acceptées, suivi.
- **Dashboard** — Indicateurs commerciaux (CA, taux de transformation…).

## Procédures
### Créer une demande de travaux
1. Onglet **DT**, bouton « Nouvelle DT ».
2. Sélectionner le **client** (ou le créer) et l'**activité** (Seem/Semrac).
3. Ajouter un ou plusieurs **produits** (référence, plan, quantité).
4. Enregistrer → un **numéro d'affaire** est attribué.

### Traiter un retour client (avoir ou relance)
1. Le retour arrive depuis **Qualité › Non-Conformités** (bouton « Retour »). Voir le chapitre Qualité.
2. L'**avoir** créé apparaît dans **Avoirs & Commandes P › Avoirs**.
3. La **commande prioritaire** apparaît dans **Commandes P** ; bouton **« Lancer la production »** → crée la commande, le lot LOTP et les BDT prioritaires (encadrés rouge dans le planning).

---
> Détails techniques : `docs/technique/06-modules/commercial.md`. Droits d'accès : `docs/fiches-poste/`.
