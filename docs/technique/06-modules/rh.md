# Module RH

<!-- auto:entete -->
- **Route** : `/rh/service` · **Fichier source** : `src/rh_service.tsx`
- **Accès (RBAC)** : écriture — rh · lecture — production, sécurité, compta
<!-- /auto -->

## Mission
<!-- auto:mission -->
Employés, habilitations & certifications, matrice compétences, organigramme, temps, pointage.
<!-- /auto -->
## Onglets
<!-- auto:onglets -->
- `/rh/employes` — Employés
- `/rh/habilitations` — Habilitations & Certifications
- `/rh/competences` — Matrice Compétences
- `/rh/organigramme` — Organigramme
- `/rh/temps` — Gestion des Temps
- `/rh/service` — Dashboard
<!-- /auto -->
## API (familles de routes)
<!-- auto:api -->
`rh` · `salarie(s)` · `competence(s)` · `certification(s)` · `conge(s)` · `pointage`
<!-- /auto -->
## Tables principales
<!-- auto:tables -->
`salaries` · `habilitations` · `certifications` · `conges` · `pointages` · `formations`
<!-- /auto -->
## Points d'attention
<!-- auto:notes -->
Navigation par pages (pas de serviceHeader). Habilitations partagées RH+Qualité. Pointage = borne self-service (matricule+PIN). Congés → absences planning.
<!-- /auto -->
---
> Fiche générée. Manuel utilisateur correspondant : `docs/manuel/rh.md`. Voir aussi `04-auth-rbac.md`, `07-api-reference.md`.
