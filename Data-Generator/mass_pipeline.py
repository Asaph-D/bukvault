"""
Pipeline de génération massive (~5 ans) — sortie principale : CSV entrepôt BI.
Aucune dépendance aux volumes du seed PostgreSQL existant.
"""
from __future__ import annotations

import json
import math
import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from bookvault_dataset import (
    Book,
    Person,
    PREFIX_AUTHOR,
    PREFIX_BOOK,
    PREFIX_CAT,
    PREFIX_USER,
    _uid,
    slugify,
    weighted_choice,
)
from config import GeneratorConfig
from csv_stream import CsvStreamWriter
from encoding_utils import TEXT_ENCODING
import locale_cameroon as LC


@dataclass
class DimensionStore:
    config: GeneratorConfig
    generated_at: str
    start_date: datetime
    end_date: datetime
    admins: list[Person] = field(default_factory=list)
    authors: list[Person] = field(default_factory=list)
    readers: list[Person] = field(default_factory=list)
    categories: list[dict[str, Any]] = field(default_factory=list)
    books: list[Book] = field(default_factory=list)
    book_categories: list[tuple[str, str]] = field(default_factory=list)
    author_profiles: list[dict[str, Any]] = field(default_factory=list)
    published_book_ids: list[str] = field(default_factory=list)
    published_books: list[Book] = field(default_factory=list)
    reader_ids: list[str] = field(default_factory=list)
    stats: dict[str, int] = field(default_factory=dict)


class MassDataPipeline:
    def __init__(self, config: GeneratorConfig) -> None:
        self.cfg = config
        self.rng = random.Random(config.seed)
        self.now = datetime.now(timezone.utc)
        self.start = self.now - timedelta(days=config.history_days)

    def _random_ts(self) -> datetime:
        """Instant uniforme sur [start, now] avec biais horaire Cameroun (7h–22h)."""
        span = (self.now - self.start).total_seconds()
        t = self.start + timedelta(seconds=self.rng.random() * span)
        hour = int(weighted_choice(self.rng, [(h, 1.0 if 7 <= h <= 22 else 0.25) for h in range(24)]))
        return t.replace(hour=hour, minute=self.rng.randint(0, 59), second=self.rng.randint(0, 59), microsecond=0)

    def _ts_for_day(self, day_offset: int) -> datetime:
        """day_offset=0 → il y a history_days jours."""
        base = self.now - timedelta(days=self.cfg.history_days - day_offset)
        hour = int(weighted_choice(self.rng, [(h, 1.0 if 7 <= h <= 22 else 0.25) for h in range(24)]))
        return base.replace(hour=hour, minute=self.rng.randint(0, 59), second=self.rng.randint(0, 59), microsecond=0)

    def _growth_orders_for_day(self, day_index: int) -> int:
        """Courbe de croissance + saison APC (sept–fév) + bruit."""
        total = max(1, self.cfg.history_days - 1)
        t = day_index / total
        base = self.cfg.orders_per_day_start + t * (self.cfg.orders_per_day_end - self.cfg.orders_per_day_start)
        dt = self.start + timedelta(days=day_index)
        season = 1.35 if dt.month in (9, 10, 11, 12, 1, 2) else (0.75 if dt.month in (7, 8) else 1.0)
        noise = self.rng.gauss(0, base * 0.12)
        return max(0, int(base * season + noise))

    def _email(self, first: str, last: str, role: str, idx: int) -> str:
        f = slugify(first).replace("-", "")[:20]
        l = slugify(last).split("-")[0][:20] if last else "user"
        domain = {"ADMIN": "bookvault.cm", "AUTHOR": "auteurs.cm", "USER": "lecteurs.cm"}[role]
        return f"{f}.{l}.{idx}@{domain}"

    def _make_person(self, prefix: str, idx: int, role: str) -> Person:
        city, region = self.rng.choice(LC.CITIES)
        fn = self.rng.choice(LC.FIRST_NAMES_F if self.rng.random() < 0.48 else LC.FIRST_NAMES_M)
        ln = self.rng.choice(LC.LAST_NAMES)
        created = self._random_ts()
        provider = "GOOGLE" if self.rng.random() < 0.09 else "LOCAL"
        return Person(
            _uid(prefix, idx),
            self._email(fn, ln, role, idx),
            fn, ln, role, city, region,
            created,
            self.rng.random() > 0.025,
            provider,
            self.rng.random() > 0.04,
            f"google-sub-{idx:016x}" if provider == "GOOGLE" else None,
        )

    def build_dimensions(self) -> DimensionStore:
        c = self.cfg
        store = DimensionStore(
            config=c,
            generated_at=self.now.isoformat(),
            start_date=self.start,
            end_date=self.now,
        )
        store.admins = [self._make_person("10000000-0000-4000-a000", i, "ADMIN") for i in range(1, c.num_admins + 1)]
        store.authors = [self._make_person(PREFIX_AUTHOR, i, "AUTHOR") for i in range(1, c.num_authors + 1)]
        store.readers = [self._make_person(PREFIX_USER, i, "USER") for i in range(1, c.num_readers + 1)]
        store.reader_ids = [r.id for r in store.readers]

        for i, (name, slug, desc, order) in enumerate(LC.CATEGORIES[: c.num_categories], start=1):
            store.categories.append({
                "id": _uid(PREFIX_CAT, i),
                "name": name,
                "slug": slug,
                "description": desc,
                "display_order": order,
            })

        for i in range(1, c.num_books + 1):
            author = self.rng.choice(store.authors)
            city, _ = self.rng.choice(LC.CITIES)
            topic = self.rng.choice(LC.BOOK_TOPICS)
            tpl = self.rng.choice(LC.BOOK_TITLE_TEMPLATES)
            title = tpl.format(
                topic=topic,
                level=self.rng.choice(LC.BOOK_LEVELS),
                place=city,
                region=self.rng.choice(LC.REGIONS_CM),
            )
            is_apc = "APC" in title or "Manuel" in title
            cat_ids = [store.categories[4]["id"]] if is_apc else [self.rng.choice(store.categories[:4])["id"]]
            if self.rng.random() < 0.3:
                cat_ids.append(self.rng.choice(store.categories)["id"])

            r = self.rng.random()
            status = "DRAFT" if r < 0.07 else ("REJECTED" if r < 0.095 else "PUBLISHED")
            fmt = weighted_choice(self.rng, [("EBOOK", 0.8), ("PHYSICAL", 0.12), ("BOTH", 0.08)])
            price = round(self.rng.uniform(5.0, 58.0) if not is_apc else self.rng.uniform(5.5, 16.0), 2)
            created = self._random_ts()
            published = self._random_ts() if status == "PUBLISHED" else None
            views = 0 if status != "PUBLISHED" else int(self.rng.paretovariate(1.15) * 8000)
            rev_n = 0 if status != "PUBLISHED" else self.rng.randint(0, 40)
            avg = round(self.rng.uniform(3.4, 4.95), 2) if rev_n else 0.0

            book = Book(
                _uid(PREFIX_BOOK, i),
                f"97823725{(100000 + i) % 1000000:06d}",
                title,
                f"{topic} — ouvrage contextualisé pour {city}, Cameroun.",
                price, "fr", fmt, status, author.id, views, avg, rev_n,
                published, created,
                list(dict.fromkeys(cat_ids)),
                round(price * self.rng.uniform(0.32, 0.65), 2),
                f"ed000000-0000-4000-9000-{self.rng.randint(1, len(LC.EDITORS)):012x}",
            )
            store.books.append(book)
            for cid in book.category_ids:
                store.book_categories.append((book.id, cid))

        store.published_books = [b for b in store.books if b.status == "PUBLISHED"]
        store.published_book_ids = [b.id for b in store.published_books]

        for i, a in enumerate(store.authors):
            pen = f"{a.first_name} {a.last_name}"
            if self.rng.random() < 0.4:
                pen = f"Dr {pen}" if self.rng.random() < 0.5 else pen
            store.author_profiles.append({
                "user_id": a.id,
                "pen_name": pen,
                "website": f"https://{slugify(pen)}.cm" if self.rng.random() < 0.55 else None,
                "bio": f"Auteur·e à {a.city} — {self.rng.choice(LC.BOOK_TOPICS)}.",
            })

        return store

    def _write_dimension_csv(self, store: DimensionStore, out: Path) -> dict[str, Path]:
        written: dict[str, Path] = {}
        fe = self.cfg.csv_flush_every

        w = CsvStreamWriter(out / "dim_utilisateur.csv", [
            "id", "email", "firstName", "lastName", "role", "active", "country", "city", "region",
            "authProvider", "emailVerified", "preferredLanguage", "newsletter", "createdAt",
        ], fe)
        for p in store.admins + store.authors + store.readers:
            w.write_row({
                "id": p.id,
                "email": p.email,
                "firstName": p.first_name,
                "lastName": p.last_name,
                "role": p.role,
                "active": p.active,
                "country": "Cameroun",
                "city": p.city,
                "region": p.region,
                "authProvider": p.auth_provider,
                "emailVerified": p.email_verified,
                "preferredLanguage": "fr" if self.rng.random() < 0.91 else "en",
                "newsletter": p.role == "AUTHOR" or self.rng.random() < 0.33,
                "createdAt": p.created_at.isoformat(),
            })
        written["dim_utilisateur"] = w.path
        store.stats["users"] = w.close()

        w = CsvStreamWriter(out / "dim_livre.csv", [
            "id", "isbn", "title", "description", "price", "language", "format", "status",
            "authorId", "viewCount", "averageRating", "reviewCount", "unitCost", "editorId",
            "publishedAt", "createdAt",
        ], fe)
        for b in store.books:
            w.write_row({
                "id": b.id,
                "isbn": b.isbn,
                "title": b.title,
                "description": b.description,
                "price": b.price,
                "language": b.language,
                "format": b.format,
                "status": b.status,
                "authorId": b.author_id,
                "viewCount": b.view_count,
                "averageRating": b.average_rating,
                "reviewCount": b.review_count,
                "unitCost": b.unit_cost,
                "editorId": b.editor_id or "",
                "publishedAt": b.published_at.isoformat() if b.published_at else "",
                "createdAt": b.created_at.isoformat(),
            })
        written["dim_livre"] = w.path
        store.stats["books"] = w.close()

        w = CsvStreamWriter(out / "dim_categorie.csv", [
            "id", "name", "slug", "description", "displayOrder",
        ], fe)
        for cat in store.categories:
            w.write_row({
                "id": cat["id"],
                "name": cat["name"],
                "slug": cat["slug"],
                "description": cat["description"],
                "displayOrder": cat["display_order"],
            })
        written["dim_categorie"] = w.path
        w.close()

        w = CsvStreamWriter(out / "dim_livre_categorie.csv", ["bookId", "categoryId"], fe)
        for bid, cid in store.book_categories:
            w.write_row({"bookId": bid, "categoryId": cid})
        written["dim_livre_categorie"] = w.path
        store.stats["book_categories"] = w.close()

        w = CsvStreamWriter(out / "dim_auteur.csv", ["authorId", "penName", "website", "bio", "city"], fe)
        for a in store.author_profiles:
            author = next(x for x in store.authors if x.id == a["user_id"])
            w.write_row({
                "authorId": a["user_id"],
                "penName": a["pen_name"],
                "website": a.get("website") or "",
                "bio": a["bio"],
                "city": author.city,
            })
        written["dim_auteur"] = w.path
        w.close()

        for i, (name, city, web) in enumerate(LC.EDITORS, start=1):
            pass
        w = CsvStreamWriter(out / "dim_editeur.csv", ["editorId", "name", "country", "city", "website"], fe)
        for i, (name, city, web) in enumerate(LC.EDITORS, start=1):
            w.write_row({
                "editorId": f"ed000000-0000-4000-9000-{i:012x}",
                "name": name,
                "country": "Cameroun",
                "city": city,
                "website": web,
            })
        written["dim_editeur"] = w.path
        w.close()

        w = CsvStreamWriter(out / "dim_date.csv", [
            "dateKey", "fullDate", "year", "quarter", "month", "dayOfMonth", "dayOfWeek", "dayName", "isWeekend",
        ], fe)
        for d in range(self.cfg.history_days + 5):
            dt = (self.now - timedelta(days=d)).date()
            w.write_row({
                "dateKey": dt.strftime("%Y%m%d"),
                "fullDate": dt.isoformat(),
                "year": dt.year,
                "quarter": (dt.month - 1) // 3 + 1,
                "month": dt.month,
                "dayOfMonth": dt.day,
                "dayOfWeek": dt.weekday() + 1,
                "dayName": ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"][dt.weekday()],
                "isWeekend": dt.weekday() >= 5,
            })
        written["dim_date"] = w.path
        store.stats["dim_date"] = w.close()

        return written

    def _stream_orders(self, store: DimensionStore, out: Path) -> tuple[int, int]:
        """Commandes réparties sur toute la période (~5 ans) avec croissance."""
        fe = self.cfg.csv_flush_every
        pub = store.published_books
        if not pub:
            return 0, 0

        w_order = CsvStreamWriter(out / "fait_commande.csv", [
            "id", "userId", "status", "totalAmount", "currency", "paymentReference",
            "createdAt", "updatedAt", "dateKey",
        ], fe)
        w_line = CsvStreamWriter(out / "fait_ligne_commande.csv", [
            "orderId", "bookId", "quantity", "unitPrice", "format", "lineTotal",
        ], fe)
        w_pay = CsvStreamWriter(out / "fait_paiement.csv", [
            "paymentId", "orderId", "amount", "currency", "paymentMethod", "paymentStatus", "paidAt", "dateKey",
        ], fe)

        purchased: set[tuple[str, str]] = set()
        order_id = 0
        line_count = 0
        target = self.cfg.target_orders

        for day in range(self.cfg.history_days):
            if order_id >= target:
                break
            n_day = self._growth_orders_for_day(day)
            for _ in range(n_day):
                if order_id >= target:
                    break
                order_id += 1
                user = self.rng.choice(store.readers)
                n_lines = self.rng.choices([1, 2, 3, 4], weights=[0.55, 0.28, 0.12, 0.05])[0]
                total = 0.0
                created = self._ts_for_day(day)
                date_key = created.strftime("%Y%m%d")

                for _ in range(n_lines):
                    book = self.rng.choice(pub)
                    qty = self.rng.choices([1, 2, 3], weights=[0.88, 0.1, 0.02])[0]
                    unit = round(book.price * self.rng.uniform(0.9, 1.0), 2)
                    lt = round(unit * qty, 2)
                    total += lt
                    fmt = book.format if book.format != "BOTH" else self.rng.choice(["EBOOK", "PHYSICAL"])
                    w_line.write_row({
                        "orderId": order_id,
                        "bookId": book.id,
                        "quantity": qty,
                        "unitPrice": unit,
                        "format": fmt,
                        "lineTotal": lt,
                    })
                    line_count += 1
                    purchased.add((user.id, book.id))

                status = weighted_choice(self.rng, [
                    ("PAID", 0.74), ("DELIVERED", 0.12), ("SHIPPED", 0.04),
                    ("PENDING", 0.06), ("CANCELLED", 0.04),
                ])
                prefix = weighted_choice(self.rng, LC.PAYMENT_PREFIXES)[0]
                ref = f"{prefix}-{self.rng.randint(1000000, 9999999)}" if status == "PAID" else ""
                method = "MTN_MOMO" if "MTN" in prefix else ("ORANGE_MONEY" if "OM" in prefix else "OTHER")

                w_order.write_row({
                    "id": order_id,
                    "userId": user.id,
                    "status": status,
                    "totalAmount": round(total, 2),
                    "currency": self.cfg.order_currency,
                    "paymentReference": ref,
                    "createdAt": created.isoformat(),
                    "updatedAt": (created + timedelta(hours=self.rng.randint(0, 72))).isoformat(),
                    "dateKey": date_key,
                })
                w_pay.write_row({
                    "paymentId": f"pay-{order_id:08d}",
                    "orderId": order_id,
                    "amount": round(total, 2),
                    "currency": self.cfg.order_currency,
                    "paymentMethod": method,
                    "paymentStatus": "SUCCEEDED" if status == "PAID" else status,
                    "paidAt": created.isoformat(),
                    "dateKey": date_key,
                })

        store.stats["orders"] = w_order.close()
        store.stats["order_lines"] = w_line.close()
        w_pay.close()
        store._purchased_pairs = purchased  # type: ignore[attr-defined]
        return order_id, line_count

    def _stream_reviews(self, store: DimensionStore, out: Path) -> int:
        fe = self.cfg.csv_flush_every
        pub = store.published_books
        purchased = getattr(store, "_purchased_pairs", set())
        w = CsvStreamWriter(out / "fait_avis.csv", [
            "id", "bookId", "userId", "rating", "title", "body", "verifiedPurchase",
            "createdAt", "dateKey",
        ], fe)
        seen: set[tuple[str, str]] = set()
        rid = 0
        attempts = 0
        max_attempts = self.cfg.target_reviews * 4
        while rid < self.cfg.target_reviews and attempts < max_attempts:
            attempts += 1
            book = self.rng.choice(pub)
            user = self.rng.choice(store.readers)
            key = (book.id, user.id)
            if key in seen:
                continue
            seen.add(key)
            rid += 1
            city, _ = self.rng.choice(LC.CITIES)
            created = self._random_ts()
            w.write_row({
                "id": rid,
                "bookId": book.id,
                "userId": user.id,
                "rating": min(5, max(1, int(round(book.average_rating + self.rng.uniform(-1.5, 1.3))))),
                "title": self.rng.choice(LC.REVIEW_TITLES).format(place=city),
                "body": self.rng.choice(LC.REVIEW_BODIES).format(
                    topic=self.rng.choice(LC.BOOK_TOPICS), place=city, uni=self.rng.choice(LC.UNIVERSITIES),
                ),
                "verifiedPurchase": key in purchased or self.rng.random() < 0.28,
                "createdAt": created.isoformat(),
                "dateKey": created.strftime("%Y%m%d"),
            })
        store.stats["reviews"] = w.close()
        return rid

    def _stream_downloads(self, store: DimensionStore, out: Path) -> int:
        fe = self.cfg.csv_flush_every
        w = CsvStreamWriter(out / "fait_telechargement.csv", [
            "downloadId", "userId", "bookId", "downloadedAt", "bytesTransferred", "clientIp", "success", "dateKey",
        ], fe)
        n = 0
        pub = store.published_books
        while n < self.cfg.target_downloads:
            book = self.rng.choice(pub)
            user = self.rng.choice(store.readers)
            created = self._random_ts()
            n += 1
            w.write_row({
                "downloadId": n,
                "userId": user.id,
                "bookId": book.id,
                "downloadedAt": created.isoformat(),
                "bytesTransferred": self.rng.randint(200_000, 5_000_000),
                "clientIp": f"196.{self.rng.randint(0,255)}.{self.rng.randint(0,255)}.{self.rng.randint(1,254)}",
                "success": self.rng.random() < 0.965,
                "dateKey": created.strftime("%Y%m%d"),
            })
        store.stats["downloads"] = w.close()
        return n

    def _stream_progress(self, store: DimensionStore, out: Path) -> int:
        fe = self.cfg.csv_flush_every
        w = CsvStreamWriter(out / "fait_progression_lecture.csv", [
            "userId", "bookId", "mediaType", "percent", "chapter", "deviceId",
            "serverUpdatedAt", "clientUpdatedAt", "dateKey",
        ], fe)
        seen: set[tuple[str, str, str]] = set()
        n = 0
        while n < self.cfg.target_progress_rows:
            u = self.rng.choice(store.readers)
            b = self.rng.choice(store.published_books)
            media = "EBOOK" if self.rng.random() < 0.86 else "AUDIOBOOK"
            k = (u.id, b.id, media)
            if k in seen:
                continue
            seen.add(k)
            n += 1
            pct = self.rng.randint(2, 99)
            ts = self._random_ts()
            w.write_row({
                "userId": u.id,
                "bookId": b.id,
                "mediaType": media,
                "percent": pct,
                "chapter": max(1, pct // 7),
                "deviceId": self.rng.choice(LC.DEVICES),
                "serverUpdatedAt": ts.isoformat(),
                "clientUpdatedAt": (ts - timedelta(minutes=self.rng.randint(1, 120))).isoformat(),
                "dateKey": ts.strftime("%Y%m%d"),
            })
        store.stats["progress"] = w.close()
        return n

    def _stream_notifications(self, store: DimensionStore, out: Path) -> int:
        fe = self.cfg.csv_flush_every
        w = CsvStreamWriter(out / "fait_notification.csv", [
            "id", "userId", "kind", "title", "message", "read", "createdAt", "dateKey",
        ], fe)
        pub = store.published_books
        all_users = store.admins + store.authors + store.readers
        for i in range(1, self.cfg.target_notifications + 1):
            u = self.rng.choice(all_users)
            kind, tit, msg_tpl = self.rng.choice(LC.NOTIF_TEMPLATES)
            book = self.rng.choice(pub) if "{title}" in msg_tpl else None
            ts = self._random_ts()
            w.write_row({
                "id": i,
                "userId": u.id,
                "kind": kind,
                "title": tit,
                "message": msg_tpl.format(
                    title=book.title[:70] if book else "votre livre",
                    ref=f"CM-MTN-MOMO-{self.rng.randint(10000,99999)}",
                    region=self.rng.choice(LC.REGIONS_CM),
                    place=self.rng.choice(LC.CITIES)[0],
                ),
                "read": self.rng.random() < 0.52,
                "createdAt": ts.isoformat(),
                "dateKey": ts.strftime("%Y%m%d"),
            })
        store.stats["notifications"] = w.close()
        return self.cfg.target_notifications

    def _stream_wishlist_and_likes(self, store: DimensionStore, out: Path) -> None:
        fe = self.cfg.csv_flush_every
        pub = store.published_books
        w = CsvStreamWriter(out / "fait_wishlist.csv", ["id", "userId", "bookId", "addedAt", "dateKey"], fe)
        seen: set[tuple[str, str]] = set()
        wid = 0
        while wid < self.cfg.target_wishlist_items:
            u = self.rng.choice(store.readers)
            b = self.rng.choice(pub)
            if (u.id, b.id) in seen:
                continue
            seen.add((u.id, b.id))
            wid += 1
            ts = self._random_ts()
            w.write_row({"id": wid, "userId": u.id, "bookId": b.id, "addedAt": ts.isoformat(), "dateKey": ts.strftime("%Y%m%d")})
        store.stats["wishlist"] = w.close()

        w = CsvStreamWriter(out / "fait_book_like.csv", ["userId", "bookId", "likedAt", "dateKey"], fe)
        for _ in range(self.cfg.target_book_likes):
            u = self.rng.choice(store.readers + store.authors)
            b = self.rng.choice(pub)
            ts = self._random_ts()
            w.write_row({"userId": u.id, "bookId": b.id, "likedAt": ts.isoformat(), "dateKey": ts.strftime("%Y%m%d")})
        store.stats["book_likes"] = w.close()

    def _stream_aggregates(self, store: DimensionStore, out: Path) -> None:
        """Agrégats mensuels pré-calculés pour BI rapide."""
        import csv
        from collections import defaultdict

        monthly: dict[str, dict[str, float]] = defaultdict(lambda: {"orders": 0, "revenue": 0.0})
        path_orders = out / "fait_commande.csv"
        if path_orders.exists():
            with path_orders.open(encoding="utf-8-sig") as f:
                r = csv.DictReader(f)
                for row in r:
                    if row["status"] not in ("PAID", "DELIVERED", "SHIPPED"):
                        continue
                    ym = row["dateKey"][:6]
                    monthly[ym]["orders"] += 1
                    monthly[ym]["revenue"] += float(row["totalAmount"])

        w = CsvStreamWriter(out / "agg_ventes_mois.csv", ["yearMonth", "orderCount", "revenueEur", "territory"], flush_every=1000)
        for ym in sorted(monthly.keys()):
            w.write_row({
                "yearMonth": ym,
                "orderCount": int(monthly[ym]["orders"]),
                "revenueEur": round(monthly[ym]["revenue"], 2),
                "territory": "Cameroun",
            })
        w.close()

    def run(self, output_dir: Path) -> DimensionStore:
        wh = output_dir / "warehouse"
        wh.mkdir(parents=True, exist_ok=True)

        print(f"  [1/8] Dimensions ({self.cfg.num_readers} lecteurs, {self.cfg.num_books} livres)…")
        store = self.build_dimensions()
        dim_files = self._write_dimension_csv(store, wh)

        print(f"  [2/8] Commandes (~{self.cfg.target_orders} sur {self.cfg.history_days} jours)…")
        self._stream_orders(store, wh)

        print(f"  [3/8] Avis (~{self.cfg.target_reviews})…")
        self._stream_reviews(store, wh)

        print(f"  [4/8] Téléchargements (~{self.cfg.target_downloads})…")
        self._stream_downloads(store, wh)

        print(f"  [5/8] Progression lecture (~{self.cfg.target_progress_rows})…")
        self._stream_progress(store, wh)

        print(f"  [6/8] Notifications (~{self.cfg.target_notifications})…")
        self._stream_notifications(store, wh)

        print(f"  [7/8] Wishlist & likes…")
        self._stream_wishlist_and_likes(store, wh)

        print("  [8/8] Agrégats mensuels…")
        self._stream_aggregates(store, wh)

        store.stats["period_days"] = self.cfg.history_days
        store.stats["period_years"] = round(self.cfg.history_days / 365.25, 2)
        store.stats["dim_files"] = len(dim_files)

        manifest = {
            "generatedAt": store.generated_at,
            "seed": self.cfg.seed,
            "territory": "Cameroun / Afrique centrale",
            "period": {
                "start": store.start_date.isoformat(),
                "end": store.end_date.isoformat(),
                "days": self.cfg.history_days,
                "years": self.cfg.years_label,
            },
            "stats": store.stats,
            "warehouseDir": str(wh),
            "note": "Données générées pour analyse BI — indépendantes du seed PostgreSQL.",
        }
        (output_dir / "manifest.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False), encoding=TEXT_ENCODING
        )
        return store
