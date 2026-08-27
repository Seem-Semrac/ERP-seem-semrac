> 🧠 [Cerveau (accueil)](README.md) · Voisines : [🖥️ Frontend](01-frontend.md) · [⚙️ Backend](02-backend.md)

# 📖 Brique 07 — UTILISATION (le métier)

**État : ✅ Fait** — comment les équipes de Seem/Semrac s'en servent au quotidien.

## L'idée en une phrase
L'ERP couvre **toute la chaîne** d'un atelier d'usinage/traitement de surface aéronautique : du **devis client** jusqu'à la **facture**, en passant par bureau d'études, achats, production, qualité, expédition — chaque métier a son **espace** et ses **droits**.

## Connexion
**Matricule + PIN**. Selon le **rôle**, on voit et on modifie seulement les services autorisés (compte de secours `ADMIN` en bêta). Détail des droits : [⚙️ Backend](02-backend.md).

## Les 15 services (grandes portes de l'appli)
| Service | À quoi ça sert |
|---|---|
| **Commercial** | Clients, offres, commandes, demandes de travaux (DT), avoirs, fiche client. |
| **Bureau d'études (BE)** | Nomenclatures, gammes, plans/CAO (GED), répertoire des réfs clients. |
| **Achats** | Demandes d'achat → bons de commande → réception. |
| **Production** | Ordres de fabrication, BDT, lots, machines, planning. |
| **OAS** | Traitement de surface (bains, balancelles, relevés). |
| **Qualité** | Non-conformités, 8D, contrôles (Cp/Cpk), dérogations, plans de contrôle. |
| **Sécurité (HSE/RSE)** | DUER, accidents, EPI, chimie/FDS, ATEX, formations, environnement. |
| **Stock** | Matières, mouvements, périssables (FIFO). |
| **Expéditions** | Bons de livraison (partiels), PV. |
| **Maintenance** | Machines, préventif → ordres de maintenance. |
| **RH** | Salariés, rôles, congés/absences, habilitations. |
| **Comptabilité / Finances** | Factures client/fournisseur, marge, écritures. |
| **Direction** | Cockpit : à valider, jalons critiques, KPIs, salle de contrôle. |
| **Dashboards** | 14 tableaux de bord (finance, stock, fournisseurs…). |
| **Plan / Bâtiment** | Maquette BIM : zones, repères reliés aux fiches. |

## Les parcours métier (le fil rouge)
- **Vendre → produire → livrer → facturer** : offre → commande → OF/BDT au planning → BL → facture.
- **Retour client** : non-conformité → avoir *ou* commande prioritaire → relance de production.
- **Acheter** : demande d'achat → bon de commande → réception → contrôle.
- **Traiter une non-conformité** : NC → analyse 8D → actions correctives.
- **Nouvelle pièce** : DT → nomenclature (BE) → planning de production.

## Où l'utilisateur trouve de l'aide
- **Manuel utilisateur** : [`docs/manuel/`](../docs/manuel/) — un chapitre par service, avec captures.
- **Parcours guidés illustrés** : [`docs/manuel/parcours/`](../docs/manuel/parcours/) — avant → remplir → ensuite.
- **Guides des formulaires** : [`docs/manuel/formulaires/`](../docs/manuel/formulaires/) — chaque case expliquée.
- **Fiches de poste** (par rôle) : [`docs/fiches-poste/`](../docs/fiches-poste/).

## Quand cette brique change → à maintenir
Un écran/parcours change → mettre à jour le manuel + **captures** (skill [`erp-screenshots`](../.claude/skills/erp-screenshots/SKILL.md)) et, si un service apparaît, cette page.

## Pour aller plus loin
[`docs/manuel/`](../docs/manuel/) · [`docs/fiches-poste/`](../docs/fiches-poste/)
