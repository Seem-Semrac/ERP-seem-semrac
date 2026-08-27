-- ══════════════════════════════════════════════════════════════
-- Chimie / FDS — N° d'identification du produit chimique
-- Champ dédié (distinct de ref_stock = codes GPAO et de cas = n° CAS) :
-- identifiant interne / registre / UFI du produit, saisi sur la fiche.
--
-- Fail-soft côté app : la colonne est écrite seulement si présente ; exécuter
-- ce script (Supabase SQL Editor) puis, si utilisé, le miroir Docker.
-- ══════════════════════════════════════════════════════════════

alter table hse_produits_chimiques
  add column if not exists num_identification text;

comment on column hse_produits_chimiques.num_identification is
  'N° d''identification du produit chimique (interne / registre / UFI), distinct de ref_stock (codes GPAO) et cas (n° CAS).';
