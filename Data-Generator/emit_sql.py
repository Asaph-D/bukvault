"""
Émission des scripts SQL PostgreSQL (une base par microservice).
"""
from __future__ import annotations

from pathlib import Path

from bookvault_dataset import BookVaultDataset
from encoding_utils import SQL_CLIENT_ENCODING_HEADER, TEXT_ENCODING
from sql_escape import sql_bool, sql_interval_days, sql_num, sql_str, sql_ts, sql_uuid, sql_json_obj


def _header(name: str, ds: BookVaultDataset) -> str:
    return (
        SQL_CLIENT_ENCODING_HEADER
        + f"-- Généré par Data-Generator — {name}\n"
        + f"-- Encodage : UTF-8\n"
        + f"-- {ds.generated_at} — seed={ds.config.seed}\n"
        + f"-- Territoire : Cameroun (noms, villes, Mobile Money)\n"
        + f"-- Mot de passe démo : {ds.config.password_plain}\n\n"
    )


def emit_01_auth(ds: BookVaultDataset) -> str:
    lines = [
        _header("bookvault_auth", ds),
        "CREATE EXTENSION IF NOT EXISTS pgcrypto;\n",
        "DO $$\nBEGIN\n  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'auth_refresh_tokens') THEN\n    DELETE FROM auth_refresh_tokens;\n  END IF;\nEND $$;\n",
        "DELETE FROM auth_users;\n\n",
        "INSERT INTO auth_users (id, email, password_hash, first_name, last_name, role, active, created_at, "
        "auth_provider, email_verified, google_sub, terms_accepted_at)\nVALUES\n",
    ]
    rows = []
    for p in ds.admins + ds.authors + ds.readers:
        gh = "NULL" if not p.google_sub else sql_str(p.google_sub)
        rows.append(
            f"  ({sql_uuid(p.id)}, {sql_str(p.email)}, crypt({sql_str(ds.config.password_plain)}, gen_salt('bf', 12)), "
            f"{sql_str(p.first_name)}, {sql_str(p.last_name)}, {sql_str(p.role)}, {sql_bool(p.active)}, "
            f"{sql_ts(p.created_at)}, {sql_str(p.auth_provider)}, {sql_bool(p.email_verified)}, {gh}, {sql_ts(p.created_at)})"
        )
    lines.append(",\n".join(rows) + ";\n")
    return "".join(lines)


def emit_02_users(ds: BookVaultDataset) -> str:
    lines = [_header("bookvault_users", ds), "DELETE FROM user_reader_settings;\nDELETE FROM user_profiles;\n\n"]
    lines.append(
        "INSERT INTO user_profiles (user_id, email, first_name, last_name, role, active, bio, avatar_url, preferred_language, newsletter, created_at, updated_at) VALUES\n"
    )
    rows = []
    for u in ds.user_profiles:
        rows.append(
            f"  ({sql_uuid(u['user_id'])}, {sql_str(u['email'])}, {sql_str(u['first_name'])}, {sql_str(u['last_name'])}, "
            f"{sql_str(u['role'])}, {sql_bool(u['active'])}, {sql_str(u['bio'])}, NULL, {sql_str(u['preferred_language'])}, "
            f"{sql_bool(u['newsletter'])}, {sql_ts(u['created_at'])}, {sql_ts(u['updated_at'])})"
        )
    lines.append(",\n".join(rows) + ";\n\n")

    if ds.reader_settings:
        lines.append(
            "INSERT INTO user_reader_settings (user_id, theme, ui_density, locale_override, notify_orders, notify_promotions, notify_social, community_visibility, allow_direct_messages, reader_home_default, library_show_progress, reduce_motion, updated_at) VALUES\n"
        )
        rs = []
        for s in ds.reader_settings:
            rs.append(
                f"  ({sql_uuid(s['user_id'])}, {sql_str(s['theme'])}, {sql_str(s['ui_density'])}, {sql_str(s['locale_override'])}, "
                f"{sql_bool(s['notify_orders'])}, {sql_bool(s['notify_promotions'])}, {sql_bool(s['notify_social'])}, "
                f"{sql_str(s['community_visibility'])}, {sql_bool(s['allow_direct_messages'])}, {sql_str(s['reader_home_default'])}, "
                f"{sql_bool(s['library_show_progress'])}, {sql_bool(s['reduce_motion'])}, {sql_ts(s['updated_at'])})"
            )
        lines.append(",\n".join(rs) + ";\n")
    return "".join(lines)


def emit_03_authors(ds: BookVaultDataset) -> str:
    lines = [_header("bookvault_authors", ds), "DELETE FROM author_profile;\n\n"]
    lines.append("INSERT INTO author_profile (user_id, pen_name, website, bio) VALUES\n")
    rows = []
    for a in ds.author_profiles:
        web = "NULL" if not a.get("website") else sql_str(a["website"])
        rows.append(f"  ({sql_uuid(a['user_id'])}, {sql_str(a['pen_name'])}, {web}, {sql_str(a['bio'])})")
    lines.append(",\n".join(rows) + ";\n")
    return "".join(lines)


def emit_04_catalog(ds: BookVaultDataset) -> str:
    lines = [_header("bookvault_catalog", ds), "DELETE FROM catalog_book_categories;\nDELETE FROM catalog_books;\nDELETE FROM catalog_categories;\n\n"]
    lines.append(
        "INSERT INTO catalog_categories (id, name, slug, description, parent_id, display_order, icon_url, book_count_cache) VALUES\n"
    )
    crows = []
    for cat in ds.categories:
        crows.append(
            f"  ({sql_uuid(cat['id'])}, {sql_str(cat['name'])}, {sql_str(cat['slug'])}, {sql_str(cat['description'])}, "
            f"NULL, {sql_num(cat['display_order'])}, NULL, 0)"
        )
    lines.append(",\n".join(crows) + ";\n\n")

    lines.append(
        "INSERT INTO catalog_books (id, isbn, title, description, price, language, format, status, author_user_id, cover_url, view_count, average_rating, review_count, deleted, published_at, created_at, updated_at) VALUES\n"
    )
    brows = []
    for b in ds.books:
        pub = "NULL" if not b.published_at else sql_ts(b.published_at)
        brows.append(
            f"  ({sql_uuid(b.id)}, {sql_str(b.isbn)}, {sql_str(b.title)}, {sql_str(b.description)}, {sql_num(b.price)}, "
            f"{sql_str(b.language)}, {sql_str(b.format)}, {sql_str(b.status)}, {sql_uuid(b.author_id)}, NULL, "
            f"{sql_num(b.view_count)}, {sql_num(b.average_rating)}, {sql_num(b.review_count)}, false, {pub}, "
            f"{sql_ts(b.created_at)}, {sql_ts(b.created_at)})"
        )
    lines.append(",\n".join(brows) + ";\n\n")

    lines.append("INSERT INTO catalog_book_categories (book_id, category_id) VALUES\n")
    bc = [f"  ({sql_uuid(bid)}, {sql_uuid(cid)})" for bid, cid in ds.book_categories]
    lines.append(",\n".join(bc) + ";\n")
    return "".join(lines)


def emit_05_reviews(ds: BookVaultDataset) -> str:
    lines = [_header("bookvault_reviews", ds), "DELETE FROM review_helpful;\nDELETE FROM review_report;\nDELETE FROM book_review;\n\n"]
    if not ds.reviews:
        return "".join(lines)
    lines.append(
        "INSERT INTO book_review (book_id, user_id, rating, title, body, verified_purchase, created_at, updated_at) VALUES\n"
    )
    rows = []
    for r in ds.reviews:
        rows.append(
            f"  ({sql_uuid(r['book_id'])}, {sql_uuid(r['user_id'])}, {sql_num(r['rating'])}, {sql_str(r['title'])}, "
            f"{sql_str(r['body'])}, {sql_bool(r['verified_purchase'])}, {sql_ts(r['created_at'])}, {sql_ts(r['updated_at'])})"
        )
    lines.append(",\n".join(rows) + ";\n\n")

    if ds.review_reports:
        lines.append(
            "-- Signalements (nécessite des ids book_review — résolution par sous-requête)\n"
        )
        for rep in ds.review_reports:
            idx = rep["review_index"] - 1
            if idx >= len(ds.reviews):
                continue
            r = ds.reviews[idx]
            lines.append(
                f"INSERT INTO review_report (review_id, reporter_id, reason, details, created_at)\n"
                f"SELECT br.id, {sql_uuid(rep['reporter_id'])}, {sql_str(rep['reason'])}, {sql_str(rep['details'])}, {sql_ts(rep['created_at'])}\n"
                f"FROM book_review br WHERE br.book_id = {sql_uuid(r['book_id'])} AND br.user_id = {sql_uuid(r['user_id'])}\n"
                f"ON CONFLICT (review_id, reporter_id) DO NOTHING;\n"
            )
    return "".join(lines)


def emit_06_wishlist(ds: BookVaultDataset) -> str:
    lines = [_header("bookvault_wishlist", ds), "DELETE FROM wishlist_item;\n\n"]
    if not ds.wishlist:
        return "".join(lines)
    lines.append("INSERT INTO wishlist_item (user_id, book_id, added_at) VALUES\n")
    rows = [f"  ({sql_uuid(w['user_id'])}, {sql_uuid(w['book_id'])}, {sql_ts(w['added_at'])})" for w in ds.wishlist]
    lines.append(",\n".join(rows) + ";\n")
    return "".join(lines)


def emit_07_order(ds: BookVaultDataset) -> str:
    lines = [_header("bookvault_order", ds), "DELETE FROM order_line;\nDELETE FROM shop_order;\nDELETE FROM cart_line;\n\n"]
    if ds.cart_lines:
        lines.append("INSERT INTO cart_line (user_id, book_id, quantity, unit_price, format) VALUES\n")
        crows = [
            f"  ({sql_uuid(c['user_id'])}, {sql_uuid(c['book_id'])}, {sql_num(c['quantity'])}, {sql_num(c['unit_price'])}, {sql_str(c['format'])})"
            for c in ds.cart_lines
        ]
        lines.append(",\n".join(crows) + ";\n\n")

    for o in ds.orders:
        pay = "NULL" if not o.get("payment_reference") else sql_str(o["payment_reference"])
        lines.append(
            f"WITH o AS (\n  INSERT INTO shop_order (user_id, status, total_amount, currency, payment_reference, created_at, updated_at)\n"
            f"  VALUES ({sql_uuid(o['user_id'])}, {sql_str(o['status'])}, {sql_num(o['total_amount'])}, {sql_str(o['currency'])}, "
            f"{pay}, {sql_ts(o['created_at'])}, {sql_ts(o['updated_at'])})\n  RETURNING id\n)\n"
        )
        for ln in o["lines"]:
            lines.append(
                f"INSERT INTO order_line (order_id, book_id, quantity, unit_price, format)\n"
                f"SELECT o.id, {sql_uuid(ln['book_id'])}, {sql_num(ln['quantity'])}, {sql_num(ln['unit_price'])}, {sql_str(ln['format'])} FROM o;\n"
            )
    return "".join(lines)


def emit_08_notifications(ds: BookVaultDataset) -> str:
    lines = [_header("bookvault_notifications", ds), "DELETE FROM book_subscription;\nDELETE FROM app_notification;\nDELETE FROM notification_preferences;\n\n"]
    if ds.notifications_prefs:
        lines.append("INSERT INTO notification_preferences (user_id, email_enabled, in_app_enabled, marketing_enabled) VALUES\n")
        pr = [
            f"  ({sql_uuid(p['user_id'])}, {sql_bool(p['email_enabled'])}, {sql_bool(p['in_app_enabled'])}, {sql_bool(p['marketing_enabled'])})"
            for p in ds.notifications_prefs
        ]
        lines.append(",\n".join(pr) + ";\n\n")
    if ds.notifications:
        lines.append("INSERT INTO app_notification (user_id, kind, title, message, read_flag, created_at) VALUES\n")
        nr = [
            f"  ({sql_uuid(n['user_id'])}, {sql_str(n['kind'])}, {sql_str(n['title'])}, {sql_str(n['message'])}, {sql_bool(n['read'])}, {sql_ts(n['created_at'])})"
            for n in ds.notifications
        ]
        lines.append(",\n".join(nr) + ";\n\n")
    if ds.book_subscriptions:
        lines.append("INSERT INTO book_subscription (user_id, book_id, created_at) VALUES\n")
        sr = [f"  ({sql_uuid(s['user_id'])}, {sql_uuid(s['book_id'])}, {sql_ts(s['created_at'])})" for s in ds.book_subscriptions]
        lines.append(",\n".join(sr) + ";\n")
    return "".join(lines)


def emit_09_reading(ds: BookVaultDataset) -> str:
    lines = [_header("bookvault_reading", ds), "DELETE FROM reading_annotations;\nDELETE FROM reading_bookmarks;\nDELETE FROM reading_progress;\n\n"]
    if ds.progress:
        lines.append(
            "INSERT INTO reading_progress (user_id, book_id, media_type, position_json, device_id, server_updated_at, client_updated_at) VALUES\n"
        )
        pr = []
        for p in ds.progress:
            pr.append(
                f"  ({sql_uuid(p['user_id'])}, {sql_uuid(p['book_id'])}, {sql_str(p['media_type'])}, {sql_json_obj(p['position_json'])}, "
                f"{sql_str(p['device_id'])}, {sql_ts(p['server_updated_at'])}, {sql_ts(p['client_updated_at'])})"
            )
        lines.append(",\n".join(pr) + "\nON CONFLICT (user_id, book_id, media_type) DO UPDATE SET\n"
                      "  position_json = EXCLUDED.position_json,\n"
                      "  server_updated_at = EXCLUDED.server_updated_at,\n"
                      "  client_updated_at = EXCLUDED.client_updated_at;\n\n")
    if ds.bookmarks:
        lines.append("INSERT INTO reading_bookmarks (id, user_id, book_id, anchor_json, label, created_at) VALUES\n")
        br = [
            f"  ({sql_uuid(b['id'])}, {sql_uuid(b['user_id'])}, {sql_uuid(b['book_id'])}, {sql_json_obj(b['anchor_json'])}, "
            f"{sql_str(b['label'])}, {sql_ts(b['created_at'])})"
            for b in ds.bookmarks
        ]
        lines.append(",\n".join(br) + ";\n\n")
    if ds.annotations:
        lines.append("INSERT INTO reading_annotations (id, user_id, book_id, anchor_json, body, created_at, updated_at) VALUES\n")
        ar = [
            f"  ({sql_uuid(a['id'])}, {sql_uuid(a['user_id'])}, {sql_uuid(a['book_id'])}, {sql_json_obj(a['anchor_json'])}, "
            f"{sql_str(a['body'])}, {sql_ts(a['created_at'])}, {sql_ts(a['updated_at'])})"
            for a in ds.annotations
        ]
        lines.append(",\n".join(ar) + ";\n")
    return "".join(lines)


def emit_10_files(ds: BookVaultDataset) -> str:
    lines = [
        _header("bookvault_files", ds),
        "-- Métadonnées stockage : python ../scripts/generate_covers_from_books.py (FILE_STORAGE_ROOT)\n\n",
        "DELETE FROM stored_file;\n\n",
    ]
    if not ds.stored_files:
        return "".join(lines)
    lines.append(
        "INSERT INTO stored_file (original_filename, kind, mime_type, size_bytes, storage_key, book_id, owner_user_id, uploaded_by, created_at) VALUES\n"
    )
    rows = []
    for f in ds.stored_files:
        rows.append(
            f"  ({sql_str(f['original_filename'])}, {sql_str(f['kind'])}, {sql_str(f['mime_type'])}, {sql_num(f['size_bytes'])}, "
            f"{sql_str(f['storage_key'])}, {sql_uuid(f['book_id'])}, {sql_uuid(f['owner_user_id'])}, {sql_uuid(f['uploaded_by'])}, {sql_ts(f['created_at'])})"
        )
    lines.append(",\n".join(rows) + ";\n")
    return "".join(lines)


def emit_11_community(ds: BookVaultDataset) -> str:
    lines = [
        _header("bookvault_community", ds),
        "DELETE FROM chat_message;\nDELETE FROM conversation_member;\nDELETE FROM conversation;\n",
        "DELETE FROM book_like;\nDELETE FROM buddy_suggestion;\nDELETE FROM community_event;\n",
        "DELETE FROM community_thread;\nDELETE FROM community_hub_stat;\nDELETE FROM member_profile;\n\n",
        "DO $$\nDECLARE t text;\nBEGIN\n  SELECT data_type INTO t FROM information_schema.columns\n  WHERE table_schema = 'public' AND table_name = 'chat_message' AND column_name = 'content';\n  IF t = 'oid' THEN\n    ALTER TABLE chat_message DROP COLUMN content;\n    ALTER TABLE chat_message ADD COLUMN content text NOT NULL;\n  END IF;\nEND $$;\n\n",
    ]
    if ds.community_members:
        lines.append(
            "INSERT INTO member_profile (user_id, email, first_name, last_name, role, bio, avatar_url, active, updated_at) VALUES\n"
        )
        mr = [
            f"  ({sql_uuid(m['user_id'])}, {sql_str(m['email'])}, {sql_str(m['first_name'])}, {sql_str(m['last_name'])}, "
            f"{sql_str(m['role'])}, {sql_str(m['bio'])}, NULL, {sql_bool(m.get('active', True))}, NOW())"
            for m in ds.community_members
        ]
        lines.append(",\n".join(mr) + ";\n\n")

    h = ds.hub_stat
    lines.append(
        f"INSERT INTO community_hub_stat (id, active_readers, open_salons, tagline) VALUES (1, {sql_num(h['active_readers'])}, {sql_num(h['open_salons'])}, {sql_str(h['tagline'])});\n\n"
    )

    if ds.threads:
        lines.append(
            "INSERT INTO community_thread (id, channel, title, hot, participant_count, last_activity_label, sort_index) VALUES\n"
        )
        tr = [
            f"  ({sql_uuid(t['id'])}, {sql_str(t['channel'])}, {sql_str(t['title'])}, {sql_bool(t['hot'])}, "
            f"{sql_num(t['participant_count'])}, {sql_str(t['last_activity_label'])}, {sql_num(t['sort_index'])})"
            for t in ds.threads
        ]
        lines.append(",\n".join(tr) + ";\n\n")

    if ds.events:
        lines.append("INSERT INTO community_event (id, title, starts_at, tag, sort_index) VALUES\n")
        ev = [
            f"  ({sql_uuid(e['id'])}, {sql_str(e['title'])}, {sql_ts(e['starts_at'])}, {sql_str(e['tag'])}, {sql_num(e['sort_index'])})"
            for e in ds.events
        ]
        lines.append(",\n".join(ev) + ";\n\n")

    if ds.book_likes:
        lines.append("INSERT INTO book_like (user_id, book_id, liked_at) VALUES\n")
        lk = [f"  ({sql_uuid(l['user_id'])}, {sql_uuid(l['book_id'])}, {sql_ts(l['liked_at'])})" for l in ds.book_likes]
        lines.append(",\n".join(lk) + ";\n\n")

    if ds.buddy_suggestions:
        lines.append(
            "INSERT INTO buddy_suggestion (id, viewer_user_id, display_name, match_percent, reading_hint, sort_index) VALUES\n"
        )
        bs = [
            f"  ({sql_uuid(b['id'])}, {sql_uuid(b['viewer_user_id'])}, {sql_str(b['display_name'])}, {sql_num(b['match_percent'])}, "
            f"{sql_str(b['reading_hint'])}, {sql_num(b['sort_index'])})"
            for b in ds.buddy_suggestions
        ]
        lines.append(",\n".join(bs) + ";\n\n")

    for conv in ds.conversations:
        lines.append(
            f"INSERT INTO conversation (id, type, created_at, updated_at, last_message_preview) VALUES "
            f"({sql_uuid(conv['id'])}, {sql_str(conv['type'])}, {sql_ts(conv['created_at'])}, {sql_ts(conv['updated_at'])}, {sql_str(conv['last_message_preview'])});\n"
        )
    for cid, uid in ds.conversation_members:
        lines.append(f"INSERT INTO conversation_member (conversation_id, user_id) VALUES ({sql_uuid(cid)}, {sql_uuid(uid)});\n")
    if ds.chat_messages:
        lines.append("\nINSERT INTO chat_message (id, conversation_id, sender_id, content, created_at) VALUES\n")
        cm = [
            f"  ({sql_uuid(m['id'])}, {sql_uuid(m['conversation_id'])}, {sql_uuid(m['sender_id'])}, {sql_str(m['content'])}, {sql_ts(m['created_at'])})"
            for m in ds.chat_messages
        ]
        lines.append(",\n".join(cm) + ";\n")
    return "".join(lines)


def emit_12_admin(ds: BookVaultDataset) -> str:
    """Enrichissement multi-bases pour KPI admin (lectures / signalements)."""
    lines = [
        _header("admin_dashboard_enrichment", ds),
        "\\connect bookvault_reading\n\n",
        "-- Progressions supplémentaires (14 derniers jours) pour courbes admin\n",
    ]
    published = [b for b in ds.books if b.status == "PUBLISHED"][:14]
    for i, (p, book) in enumerate(zip(ds.progress[:14], published)):
        lines.append(
            f"INSERT INTO reading_progress (user_id, book_id, media_type, position_json, device_id, server_updated_at, client_updated_at) VALUES\n"
            f"  ({sql_uuid(p['user_id'])}, {sql_uuid(book.id)}, 'EBOOK', '{{\"percent\": {40 + i * 3}}}', 'seed-admin', "
            f"{sql_interval_days(13 - i)}, {sql_interval_days(13 - i)})\n"
            f"ON CONFLICT (user_id, book_id, media_type) DO UPDATE SET server_updated_at = EXCLUDED.server_updated_at;\n"
        )
    lines.append("\n\\connect bookvault_reviews\n\n")
    if ds.review_reports:
        lines.append("-- openReports alimentés via review_report (voir 05)\n")
    return "".join(lines)


def write_all_sql(ds: BookVaultDataset, out_dir: Path) -> dict[str, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    emitters = {
        "01_bookvault_auth.sql": emit_01_auth,
        "02_bookvault_users.sql": emit_02_users,
        "03_bookvault_authors.sql": emit_03_authors,
        "04_bookvault_catalog.sql": emit_04_catalog,
        "05_bookvault_reviews.sql": emit_05_reviews,
        "06_bookvault_wishlist.sql": emit_06_wishlist,
        "07_bookvault_order.sql": emit_07_order,
        "08_bookvault_notifications.sql": emit_08_notifications,
        "09_bookvault_reading.sql": emit_09_reading,
        "10_bookvault_files.sql": emit_10_files,
        "11_bookvault_community.sql": emit_11_community,
        "12_bookvault_admin_dashboard.sql": emit_12_admin,
    }
    written: dict[str, Path] = {}
    for name, fn in emitters.items():
        path = out_dir / name
        path.write_text(fn(ds), encoding=TEXT_ENCODING)
        written[name] = path
    return written
