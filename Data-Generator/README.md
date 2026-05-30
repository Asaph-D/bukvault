# BookVault — Data-Generator (masse analytique ~5 ans)

Générateur **indépendant** du seed PostgreSQL du projet : il produit une **masse de données** sur environ **5 ans** (1 826 jours) pour l’analyse BI, avec un lexique **Cameroun / Afrique centrale**.

**Sortie principale : CSV** (`output/warehouse/`) — adaptés à Power BI, Excel, DuckDB, pandas, entrepôt décisionnel.

---

## Volumes par défaut (profil `mass5y`)

| Entité | Volume cible |
|--------|----------------|
| Période | **~5 ans** (1 826 jours) |
| Lecteurs | **15 000** |
| Auteurs | **200** |
| Livres | **3 000** |
| Commandes | **~200 000** (croissance 35→145 / jour + saison APC) |
| Avis | **~120 000** |
| Téléchargements | **~800 000** |
| Notifications | **~350 000** |
| Progressions lecture | **~90 000** |
| Wishlist / likes | **55 000** / **220 000** |

Les commandes sont **réparties dans le temps** (pas un amas « maintenant ») : courbe de croissance + pic rentrée scolaire sept.–fév.

---

## Génération

```powershell
cd Data-Generator
.\run_generate.ps1
```

Profil léger (test rapide) :

```powershell
python generate_all.py --profile demo
```

Personnaliser la masse :

```powershell
python generate_all.py --readers 25000 --orders 400000 --days 2000 --downloads 1200000
```

SQL **dimensions uniquement** (auth + users + catalog, sans les millions de faits) :

```powershell
python generate_all.py --sql-dimensions
```

---

## Fichiers produits (`output/warehouse/`)

| Fichier | Rôle analyse |
|---------|----------------|
| `dim_utilisateur.csv` | A1 — profils |
| `dim_livre.csv` | A2 — catalogue |
| `dim_categorie.csv` / `dim_livre_categorie.csv` | A2, A7 |
| `dim_auteur.csv` / `dim_editeur.csv` | Auteur, éditeur |
| `dim_date.csv` | A13 — calendrier |
| `fait_commande.csv` / `fait_ligne_commande.csv` | A3 — ventes |
| `fait_paiement.csv` | A3 — Mobile Money |
| `fait_avis.csv` | A5 — satisfaction |
| `fait_telechargement.csv` | A8 |
| `fait_progression_lecture.csv` | A6 |
| `fait_notification.csv` | A9 |
| `fait_wishlist.csv` / `fait_book_like.csv` | A4, A10 |
| `agg_ventes_mois.csv` | Agrégat mensuel prêt pour graphiques |

`output/manifest.json` : statistiques réelles générées.

---

## Logique métier (Cameroun)

- Villes : Douala, Yaoundé, Bafoussam, Garoua, Bamenda, Limbé, etc.
- Paiements : **CM-MTN-MOMO**, **CM-OM**, CamPost
- Manuels **APC**, essais, littérature Grassfield
- Universités : UY1, Udouala, ENS, IRIC…
- **Aucun UUID** repris du petit seed `sql/seed/` — génération autonome

---

## PostgreSQL (optionnel)

Le chargeur `run_load.ps1` ne convient **pas** à la masse complète (fichiers CSV trop volumineux pour INSERT SQL ligne à ligne).

Pour alimenter une base :

1. Charger les dimensions : `python generate_all.py --sql-dimensions` puis `run_load.ps1` (partiel)
2. Faits : `COPY` depuis les CSV, ou ETL (Airflow, DBeaver, script Python `copy_expert`)

---

## Structure code

| Module | Rôle |
|--------|------|
| `config.py` | Profils `mass5y` (défaut) et `demo` |
| `mass_pipeline.py` | Pipeline en flux (~5 ans) |
| `locale_cameroon.py` | Lexique local |
| `csv_stream.py` | Écriture CSV par flux |
| `generate_all.py` | CLI |
| `emit_sql_dimensions.py` | SQL léger (dimensions) |

---

## Encodage (accents : é, è, à, ï, œ…)

Les CSV sont générés en **UTF-8 avec BOM** (`utf-8-sig`) pour qu’Excel et Power BI sous Windows affichent correctement les accents (évite `contextualisÃ©` au lieu de `contextualisé`).

- **Excel** : double-clic sur le `.csv` ou *Données > Obtenir des données > CSV* (UTF-8 détecté automatiquement grâce au BOM).
- **Power BI** : source CSV — encodage **65001 UTF-8**.
- **PostgreSQL** : scripts SQL préfixés par `SET client_encoding TO 'UTF8';` ; avant `psql` sous Windows : `chcp 65001`.
- **Regénérer** après mise à jour : `.\run_generate.ps1` (les anciens CSV sans BOM peuvent afficher des caractères cassés).

---

## Exemple DuckDB (analyse rapide)

```sql
SELECT yearMonth, orderCount, revenueEur
FROM read_csv_auto('output/warehouse/agg_ventes_mois.csv')
ORDER BY yearMonth;
```
<!-- exe -->
$env:PYTHONUTF8 = "1"; python generate_all.py