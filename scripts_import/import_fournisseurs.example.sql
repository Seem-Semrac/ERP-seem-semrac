-- ══════════════════════════════════════════════════════════════
-- EXEMPLE (anonymisé) — import fournisseurs / sous-traitants.
-- Le fichier réel `import_fournisseurs.sql` (données d'entreprise :
-- noms, SIRET, codes SAGE) est VOLONTAIREMENT hors dépôt (gitignore) —
-- il est transmis hors-ligne, pas via GitHub. Voir aussi
-- `scripts_import/fournisseurs_classes.json` (idem, hors dépôt).
--
-- Ce fichier montre uniquement le FORMAT attendu, avec des valeurs fictives.
-- ══════════════════════════════════════════════════════════════

-- Sous-traitants (procédés spéciaux, finition…)
insert into public.sous_traitants (code, nom, adresse, siret, categorie, activite, prestations, catalogue, approved, actif, notes) values
  ('ST-0001', 'EXEMPLE TRAITEMENT SURFACE', '1 RUE DEMO, 00000 VILLE', '00000000000000', 'Finition / Traitement surface', 'both', array['Anodisation','Chromatation']::text[], '[]'::jsonb, true, true, 'Fournisseur fictif — exemple de format')
on conflict (code) do nothing;

-- Fournisseurs (matière, accessoires, négoce…)
insert into public.fournisseurs (code, nom, adresse, siret, categorie, activite, catalogue, actif, notes) values
  ('F-0001', 'EXEMPLE MATIERE ALU', '2 AVENUE DEMO, 00000 VILLE', '00000000000000', 'Matière première', 'Seem', '[]'::jsonb, true, 'Fournisseur fictif — exemple de format')
on conflict (code) do nothing;

notify pgrst, 'reload schema';
