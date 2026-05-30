"""
Export CSV entrepôt BI (dimensions liste_des_dimensions.md — attributs hors API).
"""
from __future__ import annotations

import csv
from pathlib import Path

from bookvault_dataset import BookVaultDataset
from encoding_utils import CSV_ENCODING


def _write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding=CSV_ENCODING) as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def write_warehouse_exports(ds: BookVaultDataset, out_dir: Path) -> dict[str, Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    written: dict[str, Path] = {}

    users = []
    for p in ds.user_profiles:
        users.append({
            "id": p["user_id"],
            "email": p["email"],
            "firstName": p["first_name"],
            "lastName": p["last_name"],
            "role": p["role"],
            "active": p["active"],
            "country": p.get("country", "Cameroun"),
            "city": p.get("city", ""),
            "createdAt": p["created_at"].isoformat(),
            "updatedAt": p["updated_at"].isoformat(),
        })
    p = out_dir / "dim_utilisateur.csv"
    _write_csv(p, list(users[0].keys()) if users else ["id"], users)
    written["dim_utilisateur"] = p

    books = []
    for b in ds.books:
        books.append({
            "id": b.id,
            "title": b.title,
            "isbn": b.isbn,
            "authorId": b.author_id,
            "price": b.price,
            "format": b.format,
            "status": b.status,
            "viewCount": b.view_count,
            "averageRating": b.average_rating,
            "reviewCount": b.review_count,
            "unitCost": b.unit_cost,
            "editorId": b.editor_id or "",
            "publishedAt": b.published_at.isoformat() if b.published_at else "",
            "createdAt": b.created_at.isoformat(),
        })
    p = out_dir / "dim_livre.csv"
    _write_csv(p, list(books[0].keys()) if books else ["id"], books)
    written["dim_livre"] = p

    p = out_dir / "dim_editeur.csv"
    _write_csv(p, ["editorId", "name", "country", "city", "website"], ds.warehouse_editors)
    written["dim_editeur"] = p

    p = out_dir / "dim_date.csv"
    _write_csv(
        p,
        ["dateKey", "fullDate", "year", "month", "dayOfMonth", "isWeekend"],
        ds.warehouse_dim_dates,
    )
    written["dim_date"] = p

    orders = []
    for i, o in enumerate(ds.orders, start=1):
        orders.append({
            "id": i,
            "userId": o["user_id"],
            "status": o["status"],
            "totalAmount": o["total_amount"],
            "currency": o["currency"],
            "paymentReference": o.get("payment_reference") or "",
            "createdAt": o["created_at"].isoformat(),
        })
    p = out_dir / "fait_commande.csv"
    _write_csv(p, list(orders[0].keys()) if orders else ["id"], orders)
    written["fait_commande"] = p

    p = out_dir / "fait_paiement.csv"
    pay_rows = []
    for i, pay in enumerate(ds.warehouse_payments, start=1):
        pay_rows.append({
            "paymentId": f"pay-{i:06d}",
            "orderId": pay["order_index"],
            "amount": pay["amount"],
            "currency": pay["currency"],
            "paymentMethod": pay["payment_method"],
            "paymentStatus": pay["payment_status"],
            "paidAt": pay["paid_at"].isoformat(),
        })
    _write_csv(p, list(pay_rows[0].keys()) if pay_rows else ["paymentId"], pay_rows)
    written["fait_paiement"] = p

    p = out_dir / "fait_telechargement.csv"
    dl = []
    for i, d in enumerate(ds.warehouse_downloads, start=1):
        dl.append({
            "downloadId": i,
            "userId": d["user_id"],
            "bookId": d["book_id"],
            "downloadedAt": d["downloaded_at"].isoformat(),
            "bytesTransferred": d["bytes_transferred"],
            "clientIp": d["client_ip"],
            "success": d["success"],
        })
    _write_csv(p, list(dl[0].keys()) if dl else ["downloadId"], dl)
    written["fait_telechargement"] = p

    reviews = []
    for i, r in enumerate(ds.reviews, start=1):
        reviews.append({
            "id": i,
            "bookId": r["book_id"],
            "userId": r["user_id"],
            "rating": r["rating"],
            "title": r["title"],
            "verifiedPurchase": r["verified_purchase"],
            "createdAt": r["created_at"].isoformat(),
        })
    p = out_dir / "fait_avis.csv"
    _write_csv(p, list(reviews[0].keys()) if reviews else ["id"], reviews)
    written["fait_avis"] = p

    prog = []
    for p_row in ds.progress:
        pos = p_row["position_json"]
        prog.append({
            "userId": p_row["user_id"],
            "bookId": p_row["book_id"],
            "mediaType": p_row["media_type"],
            "percent": pos.get("percent", ""),
            "chapter": pos.get("chapter", ""),
            "deviceId": p_row["device_id"],
            "serverUpdatedAt": p_row["server_updated_at"].isoformat(),
        })
    path = out_dir / "fait_progression_lecture.csv"
    _write_csv(path, list(prog[0].keys()) if prog else ["userId"], prog)
    written["fait_progression_lecture"] = path

    return written
