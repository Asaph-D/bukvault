#!/usr/bin/env python3
"""
Génère une masse de données BookVault (~5 ans) pour l'analyse BI.

Sortie principale : CSV dans output/warehouse/ (flux, millions de lignes possibles).
SQL optionnel : dimensions uniquement (--sql-dimensions) ou profil demo.

Usage:
  python generate_all.py
  python generate_all.py --profile demo
  python generate_all.py --readers 20000 --orders 300000 --days 1826
"""
from __future__ import annotations

import argparse
import sys
import time
from dataclasses import replace
from pathlib import Path

from config import DEFAULT_CONFIG, DEMO_CONFIG, GeneratorConfig
from encoding_utils import configure_console_utf8
from mass_pipeline import MassDataPipeline


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="BookVault Data-Generator — masse ~5 ans (Cameroun)")
    p.add_argument("--profile", choices=["mass5y", "demo"], default="mass5y")
    p.add_argument("--seed", type=int, default=None)
    p.add_argument("--days", type=int, default=None, help="Historique en jours (défaut ~1826 = 5 ans)")
    p.add_argument("--readers", type=int, default=None)
    p.add_argument("--authors", type=int, default=None)
    p.add_argument("--books", type=int, default=None)
    p.add_argument("--orders", type=int, default=None, help="Cible commandes (target_orders)")
    p.add_argument("--reviews", type=int, default=None)
    p.add_argument("--downloads", type=int, default=None)
    p.add_argument("--sql-dimensions", action="store_true", help="Émet aussi SQL pour dimensions (auth, users, catalog)")
    p.add_argument("--output", type=Path, default=Path(__file__).resolve().parent / "output")
    return p.parse_args()


def build_config(args: argparse.Namespace) -> GeneratorConfig:
    base = DEMO_CONFIG if args.profile == "demo" else DEFAULT_CONFIG
    overrides: dict = {}
    if args.seed is not None:
        overrides["seed"] = args.seed
    if args.days is not None:
        overrides["history_days"] = args.days
        overrides["years_label"] = round(args.days / 365.25, 2)
    if args.readers is not None:
        overrides["num_readers"] = args.readers
    if args.authors is not None:
        overrides["num_authors"] = args.authors
    if args.books is not None:
        overrides["num_books"] = args.books
    if args.orders is not None:
        overrides["target_orders"] = args.orders
    if args.reviews is not None:
        overrides["target_reviews"] = args.reviews
    if args.downloads is not None:
        overrides["target_downloads"] = args.downloads
    if args.sql_dimensions:
        overrides["output_sql_facts"] = False
    return replace(base, **overrides)


def maybe_emit_sql_dimensions(store, cfg: GeneratorConfig, output: Path) -> None:
    """SQL léger : uniquement dimensions (utilisateurs, livres, catégories) — pas les faits massifs."""
    from emit_sql_dimensions import write_dimension_sql

    sql_dir = output / "sql"
    print("Émission SQL (dimensions seulement)…")
    write_dimension_sql(store, sql_dir, cfg.password_plain)


def main() -> int:
    configure_console_utf8()
    args = parse_args()
    cfg = build_config(args)
    t0 = time.perf_counter()

    print("=" * 60)
    print("BookVault Data-Generator — MASSE ANALYTIQUE")
    print(f"  Période      : ~{cfg.history_days} jours ({cfg.years_label} ans)")
    print(f"  Lecteurs     : {cfg.num_readers:,}")
    print(f"  Livres       : {cfg.num_books:,}")
    print(f"  Commandes    : ~{cfg.target_orders:,}")
    print(f"  Télécharg.   : ~{cfg.target_downloads:,}")
    print(f"  Territoire   : Cameroun (lexique local)")
    print("  Référence    : aucun seed PostgreSQL")
    print("=" * 60)

    pipeline = MassDataPipeline(cfg)
    store = pipeline.run(args.output)

    if args.sql_dimensions or cfg.output_sql_facts or args.profile == "demo":
        maybe_emit_sql_dimensions(store, cfg, args.output)

    elapsed = time.perf_counter() - t0
    print("\n" + "=" * 60)
    print("Terminé en {:.1f} s".format(elapsed))
    print("Statistiques :")
    for k, v in sorted(store.stats.items()):
        print(f"  {k}: {v:,}" if isinstance(v, int) else f"  {k}: {v}")
    print(f"\nEntrepôt CSV : {args.output / 'warehouse'}")
    print(f"Manifeste    : {args.output / 'manifest.json'}")
    print("\nImport BI : Power BI / Excel / DuckDB / pandas - lire fait_*.csv et dim_*.csv")
    return 0


if __name__ == "__main__":
    sys.exit(main())
