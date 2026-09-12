# Guides des formulaires — champ par champ

**Pour qui :** tout nouvel utilisateur qui doit remplir un écran de l'ERP sans le connaître.
**Ce que c'est :** pour **chaque formulaire** de **chaque service**, un tableau qui explique **chaque case** — à quoi elle sert, comment la remplir, si elle est obligatoire, avec un exemple. Langage simple, sans jargon.

> Ces guides complètent le [manuel utilisateur](../00-index.md) (qui décrit les procédures) et les [fiches de poste](../../fiches-poste/00-index.md) (qui décrivent le rôle). Ici, on descend **au niveau de la case**.

## Comment lire un tableau
| Colonne | Signification |
|---|---|
| **Champ** | Le libellé affiché à l'écran. |
| **Saisie** | Comment on remplit : texte, nombre, date, **liste déroulante** (choix imposés, cités entre parenthèses), case à cocher, zone de texte, fichier, recherche. |
| **Obligatoire** | « Oui » = à remplir pour pouvoir valider ; « Non » = facultatif. |
| **À quoi ça sert** | L'explication en clair. |
| **Exemple** | Une valeur réaliste. |

Chaque formulaire se termine par 💡 une astuce et ⚠️ un point d'attention.

## Les guides par service
| Service | Guide | Formulaires | Champs | Qui l'utilise surtout |
|---|---|---|---|---|
| Commercial | [commercial.md](commercial.md) | 13 | 78 | Commercial |
| Bureau d'Études | [be.md](be.md) | 12 | 57 | BE (bei) |
| Achats | [achats.md](achats.md) | 12 | 76 | Achats |
| Production | [production.md](production.md) | 11 | 62 | Production, Opérateur |
| OAS (traitement de surface) | [oas.md](oas.md) | 5 | 40 | OAS |
| Qualité | [qualite.md](qualite.md) | 22 | 152 | Qualité, Opérateur |
| Sécurité (HSE/RSE) | [securite.md](securite.md) | 17 | 173 | Qualité / HSE |
| Expéditions | [expeditions.md](expeditions.md) | 6 | 34 | Logistique |
| Stock | [stock.md](stock.md) | 6 | 37 | Logistique, Magasin |
| Maintenance | [maintenance.md](maintenance.md) | 3 | 27 | Maintenance |
| RH | [rh.md](rh.md) | 9 | 54 | RH |
| Comptabilité | [compta.md](compta.md) | 6 | 36 | Comptable |
| Direction | [direction.md](direction.md) | 5 | 6 | Direction |
| Plan / Bâtiment | [plans.md](plans.md) | 5 | 16 | BE / Maintenance / Prod / Qualité |

**Total : 132 formulaires · 848 champs documentés.**

> Guides générés depuis le code source (les champs réels des formulaires) puis relus. À régénérer si les formulaires changent — voir le skill `erp-doc-sync`.
