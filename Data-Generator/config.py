"""Paramètres du générateur BookVault — analyse BI (masse de données, ~5 ans)."""
from dataclasses import dataclass


@dataclass(frozen=True)
class GeneratorConfig:
    """Volumes cibles — indépendants de tout seed PostgreSQL existant."""

    seed: int = 237251
    password_plain: str = "BukVault2026!"

    # ~5 ans glissants (1826 jours)
    history_days: int = 1826
    years_label: float = 5.0

    num_admins: int = 5
    num_authors: int = 200
    num_readers: int = 15_000

    num_categories: int = 10
    num_books: int = 3_000

    # Faits (cibles — le pipeline peut ajuster légèrement via loi de Poisson)
    target_orders: int = 200_000
    target_reviews: int = 120_000
    target_downloads: int = 800_000
    target_notifications: int = 350_000
    target_progress_rows: int = 90_000
    target_wishlist_items: int = 55_000
    target_book_likes: int = 220_000
    target_cart_lines: int = 12_000
    target_book_subscriptions: int = 18_000
    target_review_reports: int = 450
    target_bookmarks: int = 25_000
    target_annotations: int = 15_000
    target_conversations: int = 8_000
    target_chat_messages: int = 120_000
    target_buddy_suggestions: int = 15_000
    num_community_threads: int = 40
    num_community_events: int = 60

    # Croissance plateforme (commandes / jour : début → fin sur la période)
    orders_per_day_start: int = 35
    orders_per_day_end: int = 145

    order_currency: str = "EUR"
    sql_batch_size: int = 2_000
    csv_flush_every: int = 10_000

    output_sql_dir: str = "output/sql"
    output_warehouse_dir: str = "output/warehouse"
    output_sql_facts: bool = False
    """Par défaut : pas de SQL pour les millions de faits (trop volumineux). CSV uniquement."""


# Profil démo (petit échantillon local)
DEMO_CONFIG = GeneratorConfig(
    history_days=90,
    num_readers=80,
    num_authors=12,
    num_books=40,
    target_orders=400,
    target_reviews=600,
    target_downloads=2_000,
    target_notifications=500,
    target_progress_rows=300,
    target_wishlist_items=200,
    target_book_likes=400,
    target_cart_lines=60,
    target_book_subscriptions=40,
    target_review_reports=8,
    target_bookmarks=40,
    target_annotations=25,
    target_conversations=20,
    target_chat_messages=80,
    target_buddy_suggestions=30,
    orders_per_day_start=4,
    orders_per_day_end=12,
    output_sql_facts=True,
)

# Profil par défaut : masse analytique ~5 ans
DEFAULT_CONFIG = GeneratorConfig()
