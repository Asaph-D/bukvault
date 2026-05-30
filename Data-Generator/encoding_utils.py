"""
Encodage UTF-8 pour tout le Data-Generator (accents français / camerounais).

- CSV : UTF-8 avec BOM (utf-8-sig) → Excel et Power BI Windows reconnaissent les accents.
- SQL : UTF-8 sans BOM + SET client_encoding pour PostgreSQL.
"""
from __future__ import annotations

import sys

# BOM UTF-8 en tête des CSV (Excel, Power BI)
CSV_ENCODING = "utf-8-sig"

# Fichiers texte / SQL / JSON
TEXT_ENCODING = "utf-8"

SQL_CLIENT_ENCODING_HEADER = "SET client_encoding TO 'UTF8';\n\n"


def configure_console_utf8() -> None:
    """Évite les caractères cassés dans la console Windows (cp1252)."""
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except (AttributeError, OSError, ValueError):
            pass
