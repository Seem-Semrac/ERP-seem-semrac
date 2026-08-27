# Qualité

**Pour qui :** Qualiticien(ne)

Maîtrise de la conformité : PV de contrôle, non-conformités, 8D, libération de lots, capabilité, dérogations, périssables.

![qualite-nc](../assets/qualite-nc.png)

## Les onglets
- **PV de Contrôle** — Procès-verbaux de contrôle.
- **Non-Conformités** — Déclaration et suivi des NC (interne, fournisseur, client, procédé).
- **Rapports 8D** — Résolution structurée (D1→D8).
- **Libération Lots** — Décision de libération / quarantaine.
- **Plan de contrôle** — Plans EN9100.
- **Audit Conformité** — Module d'audits **SMI QSE + SI** (voir « Audits de conformité » plus bas).
- **Capabilité** — Cp/Cpk via écart réduit.
- **ECME** — Équipements de contrôle.
- **Produits Périssables** — Suivi des dates de péremption.
- **Dérogations** — Dérogations liées aux NC.
- **Référentiels** — Vocabulaire QHSE.
- **Dashboard Qualité** — Indicateurs qualité.

## Procédures
### Déclarer une non-conformité
1. Onglet **Non-Conformités**, « Nouvelle NC ».
2. Renseigner **type** (interne/fournisseur/client/procédé), **détecteur**, **gravité**, **lot/référence**, **catégorie**, **entité**.
3. Enregistrer. Une NC critique/bloquante **bloque les BL** du lot (porte qualité) et peut remonter en validation Direction.

### Traiter un retour client
1. Sur une NC de **type client**, cliquer **« Retour »**.
2. Renseigner **n° facture/affaire**, **lot**, **nb de pièces NC**.
3. Saisir le **prix de vente unitaire** (→ montant de l'avoir) et/ou le **coût de revient** (→ commande prioritaire).
4. Choisir : **Refuser** · **Faire un avoir** (part dans Commercial › Avoirs) · **Commande prioritaire** (part dans Commercial › Commandes P).

## Audits de conformité (SMI QSE + SI)

Onglet **Audit Conformité** : programme d'audit interne **intégré** — Qualité (ISO 9001 / EN 9100), Sécurité (ISO 45001), Environnement (ISO 14001), Sécurité de l'information (ISO 27001). 4 sous-onglets : **Programme**, **Constats & plans d'action**, **Grilles**, **Référentiels**.

![Programme d'audit](../assets/qualite-audit-programme.png)

- **Programme** — l'**ordonnancement** annuel (planning par trimestre), toutes catégories réunies mais **séparées en sections** (Audits de processus / Poste & flash / Procédés spéciaux). **Sélecteur d'exercice** + **« Reconduire pour AAAA+1 »**. Chaque ligne : **✎ Modifier**, **✔ Réaliser** (fiche d'évaluation), **📄 Rapport** *(seulement une fois soldé)*, **🗑 Supprimer**.
- **Réaliser un audit** : cliquer **✔ Réaliser** → fiche agrandie ; pour chaque question, cocher **Conforme / Non conforme / Axe** + preuve (les questions **AUTO** sont pré-remplies depuis l'ERP). Puis **Enregistrer (réalisé)** (modifiable) ou **Solder l'audit** (clôture → le rapport PDF devient téléchargeable).
- **Constats & plans d'action** — chaque écart → **NC (détecteur « Audit »)** → cycle 8D → clôture.
- **Grilles** — questionnaires réutilisables (reprises **verbatim du classeur Excel** : contrôle final, soudure, emballage, informatique). Chaque question a un **mode** (Auto/Assisté/Manuel) + **sonde ERP** ; boutons ✎ / × / « + question » — **non figées**.
- **Référentiels** — thèmes A–K, T1–T9 + grilles clause-par-clause (9001, EN 9100, 45001, 14001, 27001).

> La **Conformité vive** (surveillance auto-observée : ECME/habilitations/DUER/FDS/VGP/bains/NC…) et le **tableau de bord des audits** sont dans le **Dashboard Qualité**.

---
> Détails techniques : `docs/technique/06-modules/qualite.md` + `docs/CHANGELOG.md`. Droits d'accès : `docs/fiches-poste/`.
