"""
Construction du jeu de données BookVault (Cameroun) — modèle en mémoire.
"""
from __future__ import annotations

import random
import re
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from config import GeneratorConfig, DEFAULT_CONFIG
import locale_cameroon as LC


def _uid(prefix: str, index: int) -> str:
    return f"{prefix}-{index:012x}"


PREFIX_ADMIN = "10000000-0000-4000-a000"
PREFIX_AUTHOR = "20000000-0000-4000-a000"
PREFIX_USER = "30000000-0000-4000-a000"
PREFIX_BOOK = "f0000000-0000-4000-8000"
PREFIX_CAT = "e0000000-0000-4000-8000"
PREFIX_CONV = "c0000000-0000-4000-a000"
PREFIX_MSG = "d0000000-0000-4000-a000"
PREFIX_THREAD = "a0000000-0000-4000-a000"
PREFIX_EVENT = "b0000000-0000-4000-a000"
PREFIX_BUDDY = "e1000000-0000-4000-a000"
PREFIX_BM = "b2000000-0000-4000-8000"
PREFIX_ANN = "b3000000-0000-4000-8000"


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return text or "livre"


def weighted_choice(rng: random.Random, items: list[tuple[Any, float]]) -> Any:
    total = sum(w for _, w in items)
    x = rng.random() * total
    acc = 0.0
    for val, w in items:
        acc += w
        if x <= acc:
            return val
    return items[-1][0]


@dataclass
class Person:
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    city: str
    region: str
    created_at: datetime
    active: bool = True
    auth_provider: str = "LOCAL"
    email_verified: bool = True
    google_sub: str | None = None


@dataclass
class Book:
    id: str
    isbn: str
    title: str
    description: str
    price: float
    language: str
    format: str
    status: str
    author_id: str
    view_count: int
    average_rating: float
    review_count: int
    published_at: datetime | None
    created_at: datetime
    category_ids: list[str] = field(default_factory=list)
    unit_cost: float = 0.0
    editor_id: str | None = None


@dataclass
class BookVaultDataset:
    config: GeneratorConfig
    generated_at: str
    admins: list[Person] = field(default_factory=list)
    authors: list[Person] = field(default_factory=list)
    readers: list[Person] = field(default_factory=list)
    categories: list[dict[str, Any]] = field(default_factory=list)
    books: list[Book] = field(default_factory=list)
    book_categories: list[tuple[str, str]] = field(default_factory=list)
    author_profiles: list[dict[str, Any]] = field(default_factory=list)
    user_profiles: list[dict[str, Any]] = field(default_factory=list)
    reader_settings: list[dict[str, Any]] = field(default_factory=list)
    reviews: list[dict[str, Any]] = field(default_factory=list)
    review_helpful: list[tuple[int, str]] = field(default_factory=list)
    review_reports: list[dict[str, Any]] = field(default_factory=list)
    wishlist: list[dict[str, Any]] = field(default_factory=list)
    cart_lines: list[dict[str, Any]] = field(default_factory=list)
    orders: list[dict[str, Any]] = field(default_factory=list)
    order_lines: list[dict[str, Any]] = field(default_factory=list)
    notifications_prefs: list[dict[str, Any]] = field(default_factory=list)
    notifications: list[dict[str, Any]] = field(default_factory=list)
    book_subscriptions: list[dict[str, Any]] = field(default_factory=list)
    progress: list[dict[str, Any]] = field(default_factory=list)
    bookmarks: list[dict[str, Any]] = field(default_factory=list)
    annotations: list[dict[str, Any]] = field(default_factory=list)
    stored_files: list[dict[str, Any]] = field(default_factory=list)
    community_members: list[dict[str, Any]] = field(default_factory=list)
    hub_stat: dict[str, Any] = field(default_factory=dict)
    threads: list[dict[str, Any]] = field(default_factory=list)
    events: list[dict[str, Any]] = field(default_factory=list)
    book_likes: list[dict[str, Any]] = field(default_factory=list)
    buddy_suggestions: list[dict[str, Any]] = field(default_factory=list)
    conversations: list[dict[str, Any]] = field(default_factory=list)
    conversation_members: list[tuple[str, str]] = field(default_factory=list)
    chat_messages: list[dict[str, Any]] = field(default_factory=list)
    warehouse_editors: list[dict[str, Any]] = field(default_factory=list)
    warehouse_downloads: list[dict[str, Any]] = field(default_factory=list)
    warehouse_payments: list[dict[str, Any]] = field(default_factory=list)
    warehouse_dim_dates: list[dict[str, Any]] = field(default_factory=list)
    stats: dict[str, int] = field(default_factory=dict)


class BookVaultDatasetBuilder:
    def __init__(self, config: GeneratorConfig | None = None) -> None:
        self.cfg = config or DEFAULT_CONFIG
        self.rng = random.Random(self.cfg.seed)
        self.now = datetime.now(timezone.utc)

    def _ts_days_ago(self, days: float, hour_bias: bool = True) -> datetime:
        base = self.now - timedelta(days=days)
        if hour_bias:
            hour = int(weighted_choice(self.rng, [(h, 1.0 if 7 <= h <= 22 else 0.3) for h in range(24)]))
            base = base.replace(hour=hour, minute=self.rng.randint(0, 59), second=self.rng.randint(0, 59))
        return base

    def _school_season_weight(self, dt: datetime) -> float:
        m = dt.month
        if m in (9, 10, 11, 12, 1, 2):
            return 1.4
        if m in (6, 7):
            return 0.7
        return 1.0

    def _email(self, first: str, last: str, role: str, idx: int) -> str:
        f = slugify(first).replace("-", "")
        l = slugify(last).split("-")[0] if last else "user"
        domain = {"ADMIN": "bookvault.cm", "AUTHOR": "auteurs.cm", "USER": "lecteurs.cm"}[role]
        suffix = "" if idx < 3 else str(idx)
        return f"{f}.{l}{suffix}@{domain}"

    def _make_person(self, prefix: str, idx: int, role: str) -> Person:
        if role == "ADMIN" and idx == 1:
            return Person(_uid(prefix, idx), "patricia.ngono@bookvault.cm", "Patricia", "Ngono", role,
                          "Douala", "Littoral", self._ts_days_ago(400), True, "LOCAL", True)
        if role == "ADMIN" and idx == 2:
            return Person(_uid(prefix, idx), "kouokamasaph142@gmail.com", "Eugene Asaph", "Kouokam Talla", role,
                          "Dschang", "Ouest", self._ts_days_ago(380), True, "LOCAL", True)
        city, region = self.rng.choice(LC.CITIES)
        fn = self.rng.choice(LC.FIRST_NAMES_F if self.rng.random() < 0.48 else LC.FIRST_NAMES_M)
        ln = self.rng.choice(LC.LAST_NAMES)
        days = self.rng.uniform(1, self.cfg.history_days) * (1.0 / self._school_season_weight(self.now))
        provider = "GOOGLE" if self.rng.random() < 0.08 else "LOCAL"
        return Person(
            _uid(prefix, idx),
            self._email(fn, ln, role, idx),
            fn, ln, role, city, region,
            self._ts_days_ago(days),
            self.rng.random() > 0.03,
            provider,
            self.rng.random() > 0.05,
            f"google-{idx:012d}" if provider == "GOOGLE" else None,
        )

    def build(self) -> BookVaultDataset:
        ds = BookVaultDataset(config=self.cfg, generated_at=self.now.isoformat())
        c = self.cfg

        ds.admins = [self._make_person(PREFIX_ADMIN, i, "ADMIN") for i in range(1, c.num_admins + 1)]
        ds.authors = [self._make_person(PREFIX_AUTHOR, i, "AUTHOR") for i in range(1, c.num_authors + 1)]
        ds.readers = [self._make_person(PREFIX_USER, i, "USER") for i in range(1, c.num_readers + 1)]
        all_people = ds.admins + ds.authors + ds.readers

        for i, (name, slug, desc, order) in enumerate(LC.CATEGORIES[: c.num_categories], start=1):
            ds.categories.append({
                "id": _uid(PREFIX_CAT, i),
                "name": name,
                "slug": slug,
                "description": desc,
                "parent_id": None,
                "display_order": order,
            })

        for i in range(1, c.num_books + 1):
            author = self.rng.choice(ds.authors)
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
            cat_ids = []
            if is_apc:
                cat_ids.append(ds.categories[4]["id"])
            else:
                cat_ids.append(self.rng.choice(ds.categories[:4])["id"])
            if self.rng.random() < 0.25:
                cat_ids.append(self.rng.choice(ds.categories)["id"])

            status_roll = self.rng.random()
            if status_roll < 0.08:
                status = "DRAFT"
            elif status_roll < 0.11:
                status = "REJECTED"
            else:
                status = "PUBLISHED"

            fmt_roll = self.rng.random()
            fmt = "EBOOK" if fmt_roll < 0.82 else ("PHYSICAL" if fmt_roll < 0.92 else "BOTH")
            price = round(self.rng.uniform(5.5, 55.0) if not is_apc else self.rng.uniform(6.0, 14.0), 2)
            days_old = self.rng.randint(30, c.history_days)
            created = self._ts_days_ago(days_old)
            published = self._ts_days_ago(self.rng.randint(5, max(6, days_old - 5))) if status == "PUBLISHED" else None
            views = 0 if status != "PUBLISHED" else int(self.rng.paretovariate(1.2) * 2500)
            reviews_n = 0 if status != "PUBLISHED" else self.rng.randint(0, 18)
            avg = round(self.rng.uniform(3.6, 4.9), 2) if reviews_n else 0.0

            book = Book(
                _uid(PREFIX_BOOK, i),
                f"97823725{10000 + i:05d}",
                title,
                f"Ouvrage {status.lower()} — {topic}. Contextualisé pour les lecteurs de {city} et du Cameroun.",
                price, "fr", fmt, status, author.id, views, avg, reviews_n,
                published, created,
                list(dict.fromkeys(cat_ids)),
                round(price * self.rng.uniform(0.35, 0.62), 2),
                _uid("ed000000-0000-4000-9000", self.rng.randint(1, len(LC.EDITORS))),
            )
            ds.books.append(book)
            for cid in book.category_ids:
                ds.book_categories.append((book.id, cid))

        pen_names = [
            "Dr Martin Ndongo", "Grace Fotso", "J.-P. Mbarga", "Armel Nkem", "Nadia Tambe",
            "Mariette Ngassa", "Prof. Samuel Ebolo", "Aminata Tabi", "Innocent Nguema", "Clarisse Mvondo",
        ]
        for i, a in enumerate(ds.authors):
            ds.author_profiles.append({
                "user_id": a.id,
                "pen_name": pen_names[i % len(pen_names)],
                "website": f"https://{slugify(pen_names[i % len(pen_names)])}.cm" if self.rng.random() < 0.6 else None,
                "bio": f"Auteur basé à {a.city} — {self.rng.choice(LC.BOOK_TOPICS)} et essais pour le public camerounais.",
            })

        themes = ["LIGHT", "DARK", "SYSTEM"]
        densities = ["COMFORTABLE", "COMPACT"]
        visibilities = ["PUBLIC", "MEMBERS_ONLY", "PRIVATE"]
        homes = ["OVERVIEW", "CONTINUE", "DISCOVER"]

        for p in all_people:
            city = p.city
            hood = self.rng.choice(LC.NEIGHBORHOODS.get(city, ["Centre-ville"]))
            bio_templates = [
                f"Lecteur à {city} ({hood}) — {self.rng.choice(LC.BOOK_TOPICS)}.",
                f"Professionnel à {city}, passionné de littérature et essais camerounais.",
                f"Étudiant·e à {self.rng.choice(LC.UNIVERSITIES)} — manuels numériques APC.",
                f"Enseignant·e à {city} — préparation examens et clubs lecture.",
            ]
            ds.user_profiles.append({
                "user_id": p.id,
                "email": p.email,
                "first_name": p.first_name,
                "last_name": p.last_name,
                "role": p.role,
                "active": p.active,
                "bio": self.rng.choice(bio_templates),
                "avatar_url": None,
                "preferred_language": "fr" if self.rng.random() < 0.92 else "en",
                "newsletter": p.role == "AUTHOR" or self.rng.random() < 0.35,
                "created_at": p.created_at,
                "updated_at": self._ts_days_ago(self.rng.uniform(0, 14)),
                "country": "Cameroun",
                "city": city,
            })
            if p.role == "USER":
                ds.reader_settings.append({
                    "user_id": p.id,
                    "theme": self.rng.choice(themes),
                    "ui_density": self.rng.choice(densities),
                    "locale_override": "fr",
                    "notify_orders": self.rng.random() < 0.85,
                    "notify_promotions": self.rng.random() < 0.4,
                    "notify_social": self.rng.random() < 0.55,
                    "community_visibility": self.rng.choice(visibilities),
                    "allow_direct_messages": self.rng.random() < 0.7,
                    "reader_home_default": self.rng.choice(homes),
                    "library_show_progress": self.rng.random() < 0.9,
                    "reduce_motion": self.rng.random() < 0.15,
                    "updated_at": self._ts_days_ago(self.rng.uniform(0, 30)),
                })

        published = [b for b in ds.books if b.status == "PUBLISHED"]
        purchased_pairs: set[tuple[str, str]] = set()

        for _ in range(c.num_orders):
            user = self.rng.choice(ds.readers)
            if self.rng.random() < 0.12:
                continue
            n_lines = self.rng.randint(1, 3)
            lines = []
            total = 0.0
            for _l in range(n_lines):
                book = self.rng.choice(published)
                qty = 1
                unit = round(book.price * self.rng.uniform(0.92, 1.0), 2)
                total += unit * qty
                lines.append({"book_id": book.id, "quantity": qty, "unit_price": unit, "format": book.format if book.format != "BOTH" else "EBOOK"})
                purchased_pairs.add((user.id, book.id))
            status = weighted_choice(self.rng, [
                ("PAID", 0.72), ("PENDING", 0.1), ("SHIPPED", 0.05), ("DELIVERED", 0.1), ("CANCELLED", 0.03),
            ])
            prefix = weighted_choice(self.rng, LC.PAYMENT_PREFIXES)
            ref = f"{prefix[0]}-{self.rng.randint(100000, 999999)}"
            created = self._ts_days_ago(self.rng.uniform(0, c.history_days))
            ds.orders.append({
                "user_id": user.id,
                "status": status,
                "total_amount": round(total, 2),
                "currency": c.order_currency,
                "payment_reference": ref if status == "PAID" else None,
                "created_at": created,
                "updated_at": created + timedelta(hours=self.rng.randint(0, 48)),
                "lines": lines,
            })
            ds.warehouse_payments.append({
                "order_index": len(ds.orders),
                "payment_method": "MTN_MOMO" if "MTN" in ref else ("ORANGE_MONEY" if "OM" in ref else "OTHER"),
                "amount": round(total, 2),
                "currency": c.order_currency,
                "payment_status": "SUCCEEDED" if status == "PAID" else status,
                "paid_at": created,
            })

        for o in ds.orders:
            for ln in o["lines"]:
                ds.order_lines.append({**ln, "order_index": ds.orders.index(o) + 1})

        for _ in range(c.num_cart_lines):
            u = self.rng.choice(ds.readers)
            b = self.rng.choice(published)
            ds.cart_lines.append({
                "user_id": u.id,
                "book_id": b.id,
                "quantity": 1,
                "unit_price": round(b.price * 0.95, 2),
                "format": "EBOOK",
            })

        review_keys: set[tuple[str, str]] = set()
        for _ in range(c.num_reviews):
            book = self.rng.choice(published)
            user = self.rng.choice(ds.readers)
            key = (book.id, user.id)
            if key in review_keys:
                continue
            review_keys.add(key)
            city, _ = self.rng.choice(LC.CITIES)
            title = self.rng.choice(LC.REVIEW_TITLES).format(place=city)
            body = self.rng.choice(LC.REVIEW_BODIES).format(
                topic=self.rng.choice(LC.BOOK_TOPICS),
                place=city,
                uni=self.rng.choice(LC.UNIVERSITIES),
            )
            rating = min(5, max(1, int(round(book.average_rating + self.rng.uniform(-1.2, 1.2)))))
            verified = (user.id, book.id) in purchased_pairs or self.rng.random() < 0.35
            created = self._ts_days_ago(self.rng.uniform(0, 120))
            ds.reviews.append({
                "book_id": book.id,
                "user_id": user.id,
                "rating": rating,
                "title": title,
                "body": body,
                "verified_purchase": verified,
                "created_at": created,
                "updated_at": created,
            })

        for i, r in enumerate(ds.reviews[: c.num_review_reports]):
            ds.review_reports.append({
                "review_index": i + 1,
                "reporter_id": self.rng.choice(ds.readers).id,
                "reason": self.rng.choice(["SPAM", "OFFENSIVE", "INACCURATE", "OTHER"]),
                "details": "Signalement communauté — contenu signalé depuis le Cameroun.",
                "created_at": self._ts_days_ago(self.rng.uniform(0, 10)),
            })

        wish_keys: set[tuple[str, str]] = set()
        for _ in range(c.num_wishlist_items):
            u = self.rng.choice(ds.readers)
            b = self.rng.choice(published)
            k = (u.id, b.id)
            if k in wish_keys:
                continue
            wish_keys.add(k)
            ds.wishlist.append({"user_id": u.id, "book_id": b.id, "added_at": self._ts_days_ago(self.rng.uniform(0, 90))})

        for p in all_people:
            ds.notifications_prefs.append({
                "user_id": p.id,
                "email_enabled": True,
                "in_app_enabled": True,
                "marketing_enabled": p.role == "AUTHOR" or self.rng.random() < 0.4,
            })

        for _ in range(c.num_notifications):
            u = self.rng.choice(ds.readers + ds.admins)
            kind, title_tpl, msg_tpl = self.rng.choice(LC.NOTIF_TEMPLATES)
            book = self.rng.choice(published) if "{title}" in msg_tpl else None
            ref = f"CM-MTN-MOMO-{self.rng.randint(1000, 9999)}"
            ds.notifications.append({
                "user_id": u.id,
                "kind": kind,
                "title": title_tpl,
                "message": msg_tpl.format(
                    title=book.title[:60] if book else "votre livre",
                    ref=ref,
                    region=self.rng.choice(LC.REGIONS_CM),
                    place=self.rng.choice(LC.CITIES)[0],
                ),
                "read": self.rng.random() < 0.55,
                "created_at": self._ts_days_ago(self.rng.uniform(0, 60)),
            })

        sub_keys: set[tuple[str, str]] = set()
        for _ in range(c.num_book_subscriptions):
            u = self.rng.choice(ds.readers)
            b = self.rng.choice(published)
            k = (u.id, b.id)
            if k in sub_keys:
                continue
            sub_keys.add(k)
            ds.book_subscriptions.append({"user_id": u.id, "book_id": b.id, "created_at": self._ts_days_ago(self.rng.uniform(0, 200))})

        prog_keys: set[tuple[str, str, str]] = set()
        for _ in range(c.num_progress_rows):
            u = self.rng.choice(ds.readers)
            b = self.rng.choice(published)
            media = "EBOOK" if self.rng.random() < 0.88 else "AUDIOBOOK"
            k = (u.id, b.id, media)
            if k in prog_keys:
                continue
            prog_keys.add(k)
            pct = self.rng.randint(3, 98)
            pos = {"percent": pct, "chapter": max(1, pct // 8), "city": u.city}
            ds.progress.append({
                "user_id": u.id,
                "book_id": b.id,
                "media_type": media,
                "position_json": pos,
                "device_id": self.rng.choice(LC.DEVICES),
                "server_updated_at": self._ts_days_ago(self.rng.uniform(0, 45)),
                "client_updated_at": self._ts_days_ago(self.rng.uniform(0, 45)),
            })

        for i in range(c.num_bookmarks):
            u = self.rng.choice(ds.readers)
            b = self.rng.choice(published)
            ds.bookmarks.append({
                "id": _uid(PREFIX_BM, i),
                "user_id": u.id,
                "book_id": b.id,
                "anchor_json": {"cfi": f"/6/{self.rng.randint(1, 20)}", "page": self.rng.randint(1, 200)},
                "label": self.rng.choice(LC.BOOKMARK_LABELS),
                "created_at": self._ts_days_ago(self.rng.uniform(0, 80)),
            })

        for i in range(c.num_annotations):
            u = self.rng.choice(ds.readers)
            b = self.rng.choice(published)
            ds.annotations.append({
                "id": _uid(PREFIX_ANN, i),
                "user_id": u.id,
                "book_id": b.id,
                "anchor_json": {"page": self.rng.randint(1, 150)},
                "body": self.rng.choice(LC.ANNOTATION_BODIES).format(uni=self.rng.choice(LC.UNIVERSITIES)),
                "created_at": self._ts_days_ago(self.rng.uniform(0, 60)),
                "updated_at": self._ts_days_ago(self.rng.uniform(0, 30)),
            })

        for book in published:
            slug = slugify(book.title)[:40]
            ds.stored_files.append({
                "original_filename": f"{slug}.pdf",
                "kind": "EBOOK",
                "mime_type": "application/pdf",
                "size_bytes": self.rng.randint(800_000, 4_500_000),
                "storage_key": f"seed/books/{book.id}/ebook.pdf",
                "book_id": book.id,
                "owner_user_id": book.author_id,
                "uploaded_by": book.author_id,
                "created_at": book.created_at,
            })
            ds.stored_files.append({
                "original_filename": f"cover-{book.id[:8]}.jpg",
                "kind": "COVER",
                "mime_type": "image/jpeg",
                "size_bytes": self.rng.randint(120_000, 280_000),
                "storage_key": f"seed/books/{book.id}/cover.jpg",
                "book_id": book.id,
                "owner_user_id": book.author_id,
                "uploaded_by": book.author_id,
                "created_at": book.created_at,
            })
            for _ in range(self.rng.randint(1, 4)):
                u = self.rng.choice(ds.readers)
                ds.warehouse_downloads.append({
                    "user_id": u.id,
                    "book_id": book.id,
                    "downloaded_at": self._ts_days_ago(self.rng.uniform(0, c.history_days)),
                    "bytes_transferred": self.rng.randint(500_000, 3_000_000),
                    "client_ip": f"196.{self.rng.randint(0, 255)}.{self.rng.randint(0, 255)}.{self.rng.randint(1, 254)}",
                    "success": self.rng.random() < 0.97,
                })

        for i, (name, city, web) in enumerate(LC.EDITORS, start=1):
            ds.warehouse_editors.append({
                "editor_id": _uid("ed000000-0000-4000-9000", i),
                "name": name,
                "country": "Cameroun",
                "city": city,
                "website": web,
            })

        for d in range(c.history_days + 30):
            dt = (self.now - timedelta(days=d)).date()
            ds.warehouse_dim_dates.append({
                "date_key": int(dt.strftime("%Y%m%d")),
                "full_date": dt.isoformat(),
                "year": dt.year,
                "month": dt.month,
                "day_of_month": dt.day,
                "is_weekend": dt.weekday() >= 5,
            })

        for p in all_people[: min(40, len(all_people))]:
            ds.community_members.append({
                "user_id": p.id,
                "email": p.email,
                "first_name": p.first_name,
                "last_name": p.last_name,
                "role": p.role,
                "bio": next((x["bio"] for x in ds.user_profiles if x["user_id"] == p.id), ""),
                "active": p.active,
            })

        ds.hub_stat = {
            "active_readers": len(ds.readers) + self.rng.randint(20, 80),
            "open_salons": self.rng.randint(6, 14),
            "tagline": "Lisez, likez, échangez — la communauté BookVault Cameroun.",
        }

        for i in range(1, c.num_community_threads + 1):
            city = self.rng.choice(LC.CITIES)[0]
            ds.threads.append({
                "id": _uid(PREFIX_THREAD, i),
                "channel": self.rng.choice(LC.THREAD_CHANNELS),
                "title": self.rng.choice(LC.THREAD_TITLES).format(place=city, region=self.rng.choice(LC.REGIONS_CM)),
                "hot": self.rng.random() < 0.25,
                "participant_count": self.rng.randint(8, 120),
                "last_activity_label": self.rng.choice(["à l'instant", "il y a 5 min", "il y a 1 h", "il y a 3 h"]),
                "sort_index": i,
            })

        for i in range(1, c.num_community_events + 1):
            ds.events.append({
                "id": _uid(PREFIX_EVENT, i),
                "title": self.rng.choice(LC.EVENT_TITLES).format(place=self.rng.choice(LC.CITIES)[0], region=self.rng.choice(LC.REGIONS_CM)),
                "starts_at": self.now + timedelta(days=self.rng.randint(1, 21)),
                "tag": self.rng.choice(["AMA", "CLUB", "LIVE", "APC"]),
                "sort_index": i,
            })

        for _ in range(c.num_book_likes):
            ds.book_likes.append({
                "user_id": self.rng.choice(ds.readers + ds.authors).id,
                "book_id": self.rng.choice(published).id,
                "liked_at": self._ts_days_ago(self.rng.uniform(0, 120)),
            })

        for i in range(1, c.num_buddy_suggestions + 1):
            viewer = self.rng.choice(ds.readers)
            buddy = self.rng.choice(ds.readers)
            if buddy.id == viewer.id:
                continue
            ds.buddy_suggestions.append({
                "id": _uid(PREFIX_BUDDY, i),
                "viewer_user_id": viewer.id,
                "display_name": f"{buddy.first_name} {buddy.last_name}",
                "match_percent": self.rng.randint(55, 96),
                "reading_hint": f"Lit aussi des ouvrages à {buddy.city}",
                "sort_index": i % 5,
            })

        for i in range(1, c.num_conversations + 1):
            a, b = self.rng.sample(ds.readers, 2)
            conv_id = _uid(PREFIX_CONV, i)
            ds.conversations.append({
                "id": conv_id,
                "type": "DIRECT",
                "created_at": self._ts_days_ago(self.rng.uniform(5, 90)),
                "updated_at": self._ts_days_ago(self.rng.uniform(0, 5)),
                "last_message_preview": self.rng.choice([
                    "Tu as aimé ce livre aussi ?", "On compare nos notes ?", "Merci pour la reco !",
                ]),
            })
            ds.conversation_members.append((conv_id, a.id))
            ds.conversation_members.append((conv_id, b.id))

        msg_i = 0
        for conv in ds.conversations:
            members = [m[1] for m in ds.conversation_members if m[0] == conv["id"]]
            if len(members) < 2:
                continue
            for _ in range(self.rng.randint(2, 6)):
                msg_i += 1
                if msg_i > c.num_chat_messages:
                    break
                sender = self.rng.choice(members)
                ds.chat_messages.append({
                    "id": _uid(PREFIX_MSG, msg_i),
                    "conversation_id": conv["id"],
                    "sender_id": sender,
                    "content": self.rng.choice([
                        "Bonjour ! Tu lis quoi en ce moment à Douala ?",
                        "Salut — le manuel APC est très clair, non ?",
                        "On peut organiser un club lecture à Yaoundé ?",
                        "J'ai payé via MTN MoMo, ça a marché direct.",
                    ]),
                    "created_at": self._ts_days_ago(self.rng.uniform(0, 30)),
                })

        ds.stats = {
            "admins": len(ds.admins),
            "authors": len(ds.authors),
            "readers": len(ds.readers),
            "books": len(ds.books),
            "published_books": len(published),
            "orders": len(ds.orders),
            "reviews": len(ds.reviews),
            "progress_rows": len(ds.progress),
            "notifications": len(ds.notifications),
            "downloads": len(ds.warehouse_downloads),
        }
        return ds
