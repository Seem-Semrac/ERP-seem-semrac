# Référence des tables (base Supabase)

> **Fichier généré** par `python scripts_doc/gen_db_ref.py` (sonde REST par table). Régénéré le 2026-07-31.
> `n/c` = table absente ; colonnes listées uniquement si la table contient au moins une ligne.


## Commercial

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `clients` | 455 | activite, adresse, adresse_cp, adresse_rue, adresse_ville, code_client, company, contact, contact_principal, contacts, created_at, credit_montant, credits, email, fact_cp, fact_rue, fact_ville, facturation_differente, first_name, id, last_name, mode_facturation, nom, notes_internes, poste, siret, source, tel, tva_intra, updated_at, user_id |
| `demandes_travaux` | 1 | activite, affaire_id, analyste, besoins_achat, budget, cahier_charges, client_id, client_nom, commercial_id, contact, contact_client_id, created_at, date_dt, delai, id, montant, num_affaire, pieces, pieces_detail, priorite, statut, type_dt, updated_at |
| `offres` | 1 | adt_id, affaire_id, cgv, client_id, client_nom, coeff_marge, created_at, date_envoi, date_offre, dt_ref, frais_transport, has_st, id, lettre_offre, marge, methode_fact, mode_livraison, mode_reglement, montant, montant_revient, motif_negociation, num_affaire, pieces, rep, statut, updated_at, validite, vendeur, version |
| `credits` | 1 | client_id, client_nom, created_at, date_credit, facture_cible_id, facture_source_id, id, mode_restitution, montant, motif, nc_id, num_affaire, num_avoir, origine, saisi_par, solde, statut, type, updated_at, vendeur |
| `commandes_prioritaires` | 0 | — |
| `demandes_site` | 0 | — |
| `interlocuteurs` | 484 | created_at, email, entite_id, entite_type, fonction, id, nom, notes, principal, telephone, updated_at |

## BE / Nomenclatures

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `nomenclatures` | 1 | code_ref_produit, composants, cout_machine_h, cout_machine_unitaire, created_at, cree_par, date_validation, description, dimensions, entite, etapes_production, id, indice, lot_id, masse_kg, notes, num_affaire, num_nom, num_plan, parent_id, plan_fichier, prix_mo_unitaire, prix_revient_unitaire, qte_par_mere, statut, surface_totale_dm2, taux_mo, temps_machine_h, temps_matiere_h, type_nom, updated_at, valide_par, version_groupe |
| `fournitures_nomenclature` | 2 | categorie, created_at, designation, fournisseur, id, nb_par_tole, nomenclature_id, prix_total_par_piece, prix_unitaire, qte_paquet, quantite_par_piece, ref_stock, type_fourniture |
| `etapes_production` | _absente_ | — |
| `be_refs` | _absente_ | — |
| `ref_prix_historique` | 110 | activite, bc_id, bc_num, categorie_ref, created_at, date_prix, designation, fournisseur_id, fournisseur_nom, id, prix_unitaire, quantite, reference, source, stock_id |
| `produits_fournisseurs` | 144 | activite, categorie, conditionnement, created_at, date_prix, delai_jours, designation, devise, fournisseur_id, fournisseur_nom, id, mini_commande, notes, prix, reference, source_prix, statut, unite, updated_at |

## Achats / Fournisseurs

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `fournisseurs` | 155 | actif, activite, adresse, catalogue, categorie, code, conditions_paiement, conditions_standards, contact, created_at, delai_moyen_j, email, famille_produits, familles_fourniture, id, mode_reglement, nom, notes, otd_methode, qualification, scoring, siret, tel, tva_intracom |
| `sous_traitants` | 20 | actif, activite, adresse, approved, catalogue, categorie, certifications, code, conditions_paiement, conditions_standards, contact, couleur, created_at, delai_moyen_j, email, id, mode_reglement, nom, notes, otd_methode, prestations, qualification, scoring, siret, tarifs, taux_horaire_ht, tel |
| `demandes_prix` | 1 | activite, date_cloture, date_creation, date_envoi, demandeur, dt_id, dt_ref, id, nomenclature_id, notes, numero, origine, statut |
| `demandes_achat` | 3 | affaire_id, article, bc_draft, categorie, cmd_ref, created_at, date_da, demandeur, fournisseur, fournisseur_id, genere_par_adt, id, livraison, machine_id, num_affaire, operateur_id, poste_id, priorite, qte, statut, type_bc, type_da, updated_at, visible |
| `bons_commande` | _absente_ | — |
| `factures_fournisseur` | 0 | — |

## Production

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `commandes` | 1 | activite, affaire_id, avoir_applique, bdt_soldes, bdt_total, client_id, client_nom, cout_reel, created_at, date_cmd, date_liv, has_st, id, marge_reelle, montant, nomenclature_id, num_affaire, offre_id, origine_nc, pieces, prioritaire, retard, statut, updated_at |
| `lots` | 1 | affaire_id, avancement, client_nom, cmd_id, cout_reel, created_at, date_debut, date_fin, id, libere_le, libere_par, piece, prioritaire, qte, qte_initiale, statut, statut_matiere, statut_prepa_tech, statut_ref_interne |
| `bons_de_travail` | 4 | activite, affaire_id, baseline, client_nom, cmd_id, cmd_ref, created_at, date_echeance, date_prevue, debut, debut_reel, duree, fin_reel, id, lot_id, lot_ref, machine_id, matiere_ok, num_affaire, oas_apres, oas_avant, operateur_id, operation, piece, poste_id, prioritaire, priorite, process_id, pv_requis, resultat, seq, statut, statut_init, temps_alloue, temps_machine_alloue, temps_reel, updated_at |
| `bons_sous_traitance` | 0 | — |
| `machines` | 15 | activite, capacite_h, categorie, cnc, code, couleur, cout_h, created_at, date_panne, duree_amortissement_ans, id, motif_panne, nom, operations, ordre, poste_id, shift_id, statut, tolerance_defaut, valeur_achat |
| `machines_opex` | 5 | achats_ht, annee, base_cout_h, cout_total_ht, heures_productives, id, machine_id, notes, taux_horaire |
| `shifts` | 4 | color, end_h, icon, id, label, start_h |
| `absences` | 4 | created_at, date_absence, id, operateur_id, type |
| `presences` | _absente_ | — |
| `affectations_poste` | _absente_ | — |
| `process_atelier` | 31 | activite, categorie, code, couleur, created_at, est_oas, id, machine_id, nom, operations, ordre, poste_id, requiert_machine, statut |

## Qualite

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `non_conformites` | 173 | action_corrective, affaire_id, avoir_id, bdt_id, categorie, client_nom, cmdp_id, created_at, date_nc, decision_retour, description, designation, detecteur, entite, fournisseur_nom, frc, gravite, id, lieu_detection, lieu_imputation, lot_ref, montant_avoir, n_commande, nb_litige, nb_pieces, nb_pieces_nc, num_affaire, num_facture, operation, prix_revient_unitaire, prix_vente_unitaire, ref_article, statut, type_cause, type_defaut, type_nc, updated_at |
| `pv_controles` | _absente_ | — |
| `quarantaines` | 1 | client_nom, created_at, date_mise_quarantaine, duree_jours, id, libere_le, libere_par, lot_id, motif, nc_id, piece, pv_id, statut |
| `rapports_8d` | 2 | affaire_id, client_id, created_at, d1_equipe, d2_probleme, d3_actions_imm, d4_causes_racines, d5_actions_corr, d6_mise_en_oeuvre, d7_prevention, d8_conclusion, date_cloture, date_ouverture, gravite, id, nc_id, responsable, statut, updated_at |
| `derogations` | 13 | ar, client, cmd_client, commentaire, contact, created_at, date_cloture, date_demande, decision, decision_client, descriptif, designation, email, emetteur, id, nc_ref, notre_ref, numero, quantite, ref_client, statut, tel, type_demande, updated_at |
| `actions_correctives` | 2 | action, analyse_5p, cause_racine, created_at, date_cloture, date_echeance, date_ouverture, description, diffusion, efficacite, id, numero, origine, responsable, source, source_ref, source_type, statut, type, updated_at |
| `plans_controle` | 19 | activite, classification_client, created_at, critere_acceptation, ecme_outils, frequence_echantillonnage, id, num_ligne, operation, ordre, parametres, plan_reaction, responsable, statut, type_controle, updated_at |
| `controles_cotes` | 0 | — |
| `ecme` | 265 | activite, certificat_ref, code, created_at, date_dernier_etalonnage, date_mise_service, date_prochain_etalonnage, designation, etendue_mesure, id, incertitude, localisation, marque, notes, numero_serie, organisme, periodicite_mois, resolution, statut, type |
| `produits_perissables` | 236 | code_produit, created_at, date_alerte, date_expiration, date_ouverture, date_reception, delai_appro, duree_vie_jours, emplacement, fournisseur, fournisseur_id, id, lieu_utilisation, n_commande_fournisseur, n_lot_fournisseur, nom, observations, qte_initiale, quantite, reference, statut, unite |
| `mouvements_perissables` | 451 | created_at, date_sortie, id, inventaire_apres, motif, n_commande_client, perissable_id, qte_sortie |

## Securite / HSE

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `hse_risques` | 172 | annee, cle_naturelle, coef, created_at, criticite, danger, echeance, entite, famille, famille_code, freq_expo, frequence, gravite, gravite_brute, id, maitrise, mesures_existantes, mesures_prevues, plan_action, priorite, probabilite, produits, responsable, risque, score_brut, situation, source, statut, unite_travail, updated_at, ut_source, zone |
| `hse_incidents` | 184 | actions_correctives, analyse_causes, avec_arret, created_at, date_cloture, date_incident, declaration_cpam_date, description, entite, gravite, heure, id, jours_arret, nature_lesion, partie_corps, poste, premiers_secours, responsable, salarie_id, salarie_nom, statut, temoins, type, updated_at, zone |
| `hse_epi` | _absente_ | — |
| `hse_epi_dotations` | 25 | categorie, created_at, date_peremption, date_remise, entite, epi_id, epi_nom, fournisseur, fournisseur_id, id, marque, prix, quantite, reference, salarie_id, salarie_nom, signature, statut, taille, updated_at |
| `hse_epi_zone` | 32 | consignes, created_at, entite, epi, id, obligatoire, updated_at, zone |
| `hse_produits_chimiques` | 86 | cas, cmr, compatibilites, created_at, entite, etat, fds_date, fds_ref, fds_url, fournisseur_id, fournisseur_nom, id, mentions_danger, nom, pictogrammes, quantite, ref_stock, retention, statut, unite, vlep, zone_stockage |
| `hse_atex_zones` | 0 | — |
| `hse_verifications` | 0 | — |
| `hse_formations` | _absente_ | — |
| `hse_conformite` | 22 | applicable, created_at, date_dernier_controle, date_echeance, domaine, entite, id, obligation, observations, preuve_url, reference_reglementaire, responsable, statut |
| `hse_mesures_env` | 0 | — |
| `hse_dechets` | 0 | — |
| `hse_rse` | _absente_ | — |
| `hse_flash` | 3 | created_at, date, diffusion, evenement, gravite, id, mesures, numero, pilote, secteur, statut, updated_at |

## Expeditions / Facturation / Compta

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `bons_de_livraison` | 1 | affaire_id, bc_id, client_nom, cmd_id, created_at, date_bl, date_envoi_prevu, facture_id, fournisseur_st_id, id, lignes, lot_id, operation, otd, partiel, piece, prix_transport, qte, statut, transport, transporteur_ref, type_bl, updated_at |
| `factures_client` | 0 | — |
| `ecritures` | _absente_ | — |

## Stock

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `stock` | 402 | actif, activite, auto_reappro, categorie, consommation_mensuelle, created_at, delai_appro_j, dernier_mouvement, derniere_entree, designation, emplacement, famille, fournisseur_id, id, notes, point_commande, prix_achat_ht, qte_commande, reference, stock_actuel, stock_maxi, stock_mini, unite, updated_at |
| `mouvements_stock` | 0 | — |

## RH

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `salaries` | 36 | actif, adresse, autorisations, competences, contrat, cout_horaire_note, created_at, date_entree, date_naissance, email, entite, est_operateur, habilitations, id, manager_id, matricule, metier, niveau, nom, pin, poste, prenom, role, roles, shift_id, solde_conges, solde_rtt, taux_horaire_charge, telephone, urgence_contact, urgence_tel, user_id |
| `habilitations` | 0 | — |
| `certifications` | 24 | created_at, critique, date_expiration, date_obtention, employe_nom, id, intitule, notes, organisme, salarie_id, statut, type, updated_at |
| `conges` | 0 | — |
| `pointages` | 1 | absent, correction_motif, created_at, date_pointage, duree_pause, duree_totale, duree_totale_s, employe_id, employe_nom, heure_arrivee, heure_depart, heure_depart_pause, heure_retour_pause, heures_decimales, heures_jour, heures_soir, heures_supp, heures_supp_s, heures_travaillees, id, motif_absence, notes, pause_min, salarie_id, seuil_journalier_h, statut, type, type_horaire, updated_at, valide, valide_le, valide_par |
| `formations` | _absente_ | — |

## Maintenance

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `ordres_maintenance` | 1 | action_preventive, cause_racine, cout_estime, cout_reel, created_at, date_debut, date_fin, date_prevue, date_signalement, description, duree_h, id, intervenant, machine_id, machine_nom, num_om, observations, origine, piece_id, pieces_utilisees, priorite, responsable, statut, titre, type, updated_at |
| `plans_preventif` | 0 | — |
| `pieces_detachees` | _absente_ | — |

## GED / Plan batiment

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `documents` | 4 | actif, categorie, etape_ordre, fichier_nom, id, mime, nomenclature_id, plan_indice, plan_num, storage_path, taille, uploaded_at, uploaded_par, version_groupe |
| `plans_batiment` | 1 | actif, created_at, entite, id, image_doc_id, nom, notes |
| `plan_marqueurs` | 47 | couleur, created_at, h, icone, id, label, notes, plan_id, ref_id, ref_table, type, w, x, y |

## Transverse

| Table | Lignes | Colonnes (si données) |
|---|---|---|
| `validations` | 3 | commentaire, created_at, decided_at, decided_by, domaine, emetteur, entite, id, montant, objet, payload, priorite, ref_id, ref_table, statut, type |
| `affaires` | 0 | — |
| `kpi_objectifs` | 16 | cible, code, entite, id, libelle, sens, seuil_alerte, unite, updated_at |
