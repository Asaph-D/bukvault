"""
SQL pour dimensions seulement (volumes modérés) — pas les faits massifs.
"""
from __future__ import annotations

from pathlib import Path

from encoding_utils import SQL_CLIENT_ENCODING_HEADER, TEXT_ENCODING
from mass_pipeline import DimensionStore
from sql_escape import sql_bool, sql_num, sql_str, sql_ts, sql_uuid


def _header(name: str, store: DimensionStore, password: str) -> str:
    return (
        SQL_CLIENT_ENCODING_HEADER
        + f"-- Généré par Data-Generator (dimensions) — {name}\n"
        + f"-- Encodage fichier : UTF-8\n"
        + f"-- Période {store.config.history_days} jours — seed={store.config.seed}\n"
        + f"-- Mot de passe démo : {password}\n\n"
    )


def _write_text(path, content: str) -> None:
    path.write_text(content, encoding=TEXT_ENCODING)


def write_dimension_sql(store: DimensionStore, out_dir: Path, password: str) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    # 01 auth
    lines = [
        _header("bookvault_auth", store, password),
        "CREATE EXTENSION IF NOT EXISTS pgcrypto;\nDELETE FROM auth_users;\n\n",
        "INSERT INTO auth_users (id, email, password_hash, first_name, last_name, role, active, created_at, "
        "auth_provider, email_verified, google_sub, terms_accepted_at)\nVALUES\n",
    ]
    rows = []
    for p in store.admins + store.authors + store.readers:
        gh = "NULL" if not p.google_sub else sql_str(p.google_sub)
        rows.append(
            f"  ({sql_uuid(p.id)}, {sql_str(p.email)}, crypt({sql_str(password)}, gen_salt('bf', 12)), "
            f"{sql_str(p.first_name)}, {sql_str(p.last_name)}, {sql_str(p.role)}, {sql_bool(p.active)}, "
            f"{sql_ts(p.created_at)}, {sql_str(p.auth_provider)}, {sql_bool(p.email_verified)}, {gh}, {sql_ts(p.created_at)})"
        )
    _write_text(out_dir / "01_bookvault_auth.sql", "".join(lines) + ",\n".join(rows) + ";\n")

    # 03 authors
    lines = [_header("bookvault_authors", store, password), "DELETE FROM author_profile;\n\nINSERT INTO author_profile (user_id, pen_name, website, bio) VALUES\n"]
    arows = []
    for a in store.author_profiles:
        web = "NULL" if not a.get("website") else sql_str(a["website"])
        arows.append(f"  ({sql_uuid(a['user_id'])}, {sql_str(a['pen_name'])}, {web}, {sql_str(a['bio'])})")
    _write_text(out_dir / "03_bookvault_authors.sql", "".join(lines) + ",\n".join(arows) + ";\n")

    # 02 users — par lots de 1000
    upath = out_dir / "02_bookvault_users.sql"
    with upath.open("w", encoding=TEXT_ENCODING) as f:
        f.write(_header("bookvault_users", store, password))
        f.write("DELETE FROM user_profiles;\n\n")
        people = store.admins + store.authors + store.readers
        batch = 1000
        for i in range(0, len(people), batch):
            chunk = people[i : i + batch]
            f.write(
                "INSERT INTO user_profiles (user_id, email, first_name, last_name, role, active, bio, avatar_url, "
                "preferred_language, newsletter, created_at, updated_at) VALUES\n"
            )
            urows = []
            for p in chunk:
                urows.append(
                    f"  ({sql_uuid(p.id)}, {sql_str(p.email)}, {sql_str(p.first_name)}, {sql_str(p.last_name)}, "
                    f"{sql_str(p.role)}, {sql_bool(p.active)}, {sql_str(f'Profil {p.city}, Cameroun.')}, NULL, 'fr', false, "
                    f"{sql_ts(p.created_at)}, {sql_ts(p.created_at)})"
                )
            f.write(",\n".join(urows) + ";\n\n")

    # 04 catalog — batch par 500 livres
    cat_path = out_dir / "04_bookvault_catalog.sql"
    with cat_path.open("w", encoding=TEXT_ENCODING) as f:
        f.write(_header("bookvault_catalog", store, password))
        f.write("DELETE FROM catalog_book_categories;\nDELETE FROM catalog_books;\nDELETE FROM catalog_categories;\n\n")
        f.write("INSERT INTO catalog_categories (id, name, slug, description, parent_id, display_order, icon_url, book_count_cache) VALUES\n")
        crows = [
            f"  ({sql_uuid(c['id'])}, {sql_str(c['name'])}, {sql_str(c['slug'])}, {sql_str(c['description'])}, NULL, {sql_num(c['display_order'])}, NULL, 0)"
            for c in store.categories
        ]
        f.write(",\n".join(crows) + ";\n\n")

        batch = 500
        for i in range(0, len(store.books), batch):
            chunk = store.books[i : i + batch]
            f.write(
                "INSERT INTO catalog_books (id, isbn, title, description, price, language, format, status, "
                "author_user_id, cover_url, view_count, average_rating, review_count, deleted, published_at, created_at, updated_at) VALUES\n"
            )
            brows = []
            for b in chunk:
                pub = "NULL" if not b.published_at else sql_ts(b.published_at)
                brows.append(
                    f"  ({sql_uuid(b.id)}, {sql_str(b.isbn)}, {sql_str(b.title)}, {sql_str(b.description)}, {sql_num(b.price)}, "
                    f"{sql_str(b.language)}, {sql_str(b.format)}, {sql_str(b.status)}, {sql_uuid(b.author_id)}, NULL, "
                    f"{sql_num(b.view_count)}, {sql_num(b.average_rating)}, {sql_num(b.review_count)}, false, {pub}, "
                    f"{sql_ts(b.created_at)}, {sql_ts(b.created_at)})"
                )
            f.write(",\n".join(brows) + ";\n\n")

        f.write("INSERT INTO catalog_book_categories (book_id, category_id) VALUES\n")
        bc = [f"  ({sql_uuid(bid)}, {sql_uuid(cid)})" for bid, cid in store.book_categories]
        for i in range(0, len(bc), 2000):
            f.write(",\n".join(bc[i : i + 2000]) + ";\n")
            if i + 2000 < len(bc):
                f.write("\nINSERT INTO catalog_book_categories (book_id, category_id) VALUES\n")

    _write_text(
        out_dir / "README_SQL.txt",
        "Ce dossier ne contient que les DIMENSIONS (auth, auteurs, catalogue).\n"
        "Encodage : UTF-8 (accents français). Chaque script SQL commence par SET client_encoding.\n"
        "Les FAITS sont dans ../warehouse/*.csv (UTF-8 avec BOM pour Excel).\n"
        "PostgreSQL COPY : ENCODING 'UTF8' ; psql sous Windows : chcp 65001 avant import.\n",
    )
