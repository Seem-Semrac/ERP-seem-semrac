# -*- coding: utf-8 -*-
"""
GENERATEUR de l'inventaire des tables -> docs/technique/03b-tables-reference.md
Sonde chaque table connue via REST PostgREST (count + colonnes si des lignes existent).
Robuste : n'utilise PAS la racine OpenAPI (souvent 401). A relancer apres tout DDL.
Usage : python scripts_doc/gen_db_ref.py
"""
import json, urllib.request, urllib.error, os, re, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_ts = open(os.path.join(ROOT, "src", "db.ts"), encoding="utf-8").read()
URL = re.search(r"https://[a-z0-9]+\.supabase\.co", db_ts).group(0)
KEY = re.search(r"eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+", db_ts).group(0)
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "User-Agent": "Mozilla/5.0"}

# Tables connues par domaine (source : 03-base-de-donnees.md). Ajouter ici toute nouvelle table.
DOMAINES = [
    ("Commercial", ["clients", "demandes_travaux", "offres", "credits", "commandes_prioritaires", "demandes_site", "interlocuteurs"]),
    ("BE / Nomenclatures", ["nomenclatures", "fournitures_nomenclature", "etapes_production", "be_refs", "ref_prix_historique", "produits_fournisseurs"]),
    ("Achats / Fournisseurs", ["fournisseurs", "sous_traitants", "demandes_prix", "demandes_achat", "bons_commande", "factures_fournisseur"]),
    ("Production", ["commandes", "lots", "bons_de_travail", "bons_sous_traitance", "machines", "machines_opex", "shifts", "absences", "presences", "affectations_poste", "process_atelier"]),
    ("Qualite", ["non_conformites", "pv_controles", "quarantaines", "rapports_8d", "derogations", "actions_correctives", "plans_controle", "controles_cotes", "ecme", "produits_perissables", "mouvements_perissables"]),
    ("Securite / HSE", ["hse_risques", "hse_incidents", "hse_epi", "hse_epi_dotations", "hse_epi_zone", "hse_produits_chimiques", "hse_atex_zones", "hse_verifications", "hse_formations", "hse_conformite", "hse_mesures_env", "hse_dechets", "hse_rse", "hse_flash"]),
    ("Expeditions / Facturation / Compta", ["bons_de_livraison", "factures_client", "ecritures"]),
    ("Stock", ["stock", "mouvements_stock"]),
    ("RH", ["salaries", "habilitations", "certifications", "conges", "pointages", "formations"]),
    ("Maintenance", ["ordres_maintenance", "plans_preventif", "pieces_detachees"]),
    ("GED / Plan batiment", ["documents", "plans_batiment", "plan_marqueurs"]),
    ("Transverse", ["validations", "affaires", "kpi_objectifs"]),
]

def probe(t):
    # count exact + colonnes (via une ligne si elle existe)
    n = "?"
    try:
        h = dict(H); h["Prefer"] = "count=exact"; h["Range"] = "0-0"
        r = urllib.request.urlopen(urllib.request.Request(URL + "/rest/v1/" + t + "?select=*", headers=h), timeout=25)
        cr = r.headers.get("Content-Range") or ""
        n = cr.split("/")[-1] if "/" in cr else "0"
    except urllib.error.HTTPError as e:
        return None if e.code == 404 else "?", []
    except Exception:
        return "?", []
    cols = []
    try:
        row = json.load(urllib.request.urlopen(urllib.request.Request(URL + "/rest/v1/" + t + "?select=*&limit=1", headers=H), timeout=25))
        if row: cols = sorted(row[0].keys())
    except Exception:
        pass
    return n, cols

out = ["# Référence des tables (base Supabase)\n",
       "> **Fichier généré** par `python scripts_doc/gen_db_ref.py` (sonde REST par table). Régénéré le " + datetime.date.today().isoformat() + ".",
       "> `n/c` = table absente ; colonnes listées uniquement si la table contient au moins une ligne.\n"]
total = 0
for dom, tables in DOMAINES:
    out.append("\n## " + dom + "\n")
    out.append("| Table | Lignes | Colonnes (si données) |")
    out.append("|---|---|---|")
    for t in tables:
        n, cols = probe(t)
        if n is None:
            out.append("| `" + t + "` | _absente_ | — |")
        else:
            total += 1
            out.append("| `" + t + "` | " + str(n) + " | " + (", ".join(cols) if cols else "—") + " |")

dst = os.path.join(ROOT, "docs", "technique", "03b-tables-reference.md")
open(dst, "w", encoding="utf-8").write("\n".join(out) + "\n")
print("OK -> docs/technique/03b-tables-reference.md (" + str(total) + " tables sondées)")
