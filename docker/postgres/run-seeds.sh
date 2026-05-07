#!/bin/sh
# Runs sql/seed/*.sql against each DB after Hibernate has created tables.
# Idempotent marker: /state/seeded (persisted volume).
set -eu

MARKER=/state/seeded
SEED_DIR=/seed

if [ -f "$MARKER" ]; then
  echo "[db-seed] Already seeded (remove volume seed_state or delete $MARKER to re-run)."
  exit 0
fi

export PGHOST="${PGHOST:-postgres}"
export PGUSER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:?POSTGRES_PASSWORD not set}"

echo "[db-seed] Waiting for Hibernate-created tables (timeout ~6 min)..."

i=0
max=72
while [ "$i" -lt "$max" ]; do
  ok=1
  psql -v ON_ERROR_STOP=1 -d bookvault_auth -tAc "SELECT to_regclass('public.auth_users')" | grep -q . || ok=0
  psql -v ON_ERROR_STOP=1 -d bookvault_users -tAc "SELECT to_regclass('public.user_profiles')" | grep -q . || ok=0
  psql -v ON_ERROR_STOP=1 -d bookvault_authors -tAc "SELECT to_regclass('public.author_profile')" | grep -q . || ok=0
  psql -v ON_ERROR_STOP=1 -d bookvault_catalog -tAc "SELECT to_regclass('public.catalog_books')" | grep -q . || ok=0
  psql -v ON_ERROR_STOP=1 -d bookvault_order -tAc "SELECT to_regclass('public.shop_order')" | grep -q . || ok=0
  psql -v ON_ERROR_STOP=1 -d bookvault_files -tAc "SELECT to_regclass('public.stored_file')" | grep -q . || ok=0
  psql -v ON_ERROR_STOP=1 -d bookvault_reviews -tAc "SELECT to_regclass('public.book_review')" | grep -q . || ok=0
  psql -v ON_ERROR_STOP=1 -d bookvault_wishlist -tAc "SELECT to_regclass('public.wishlist_item')" | grep -q . || ok=0
  psql -v ON_ERROR_STOP=1 -d bookvault_notifications -tAc "SELECT to_regclass('public.notification_preferences')" | grep -q . || ok=0
  psql -v ON_ERROR_STOP=1 -d bookvault_reading -tAc "SELECT to_regclass('public.reading_progress')" | grep -q . || ok=0

  if [ "$ok" -eq 1 ]; then
    echo "[db-seed] All target tables present."
    break
  fi
  i=$((i + 1))
  echo "[db-seed] Waiting... ($i/$max)"
  sleep 5
done

if [ "$i" -ge "$max" ]; then
  echo "[db-seed] Timeout: schemas not ready. Check microservice logs." >&2
  exit 1
fi

run_file() {
  db="$1"
  file="$2"
  echo "[db-seed] $db <= $(basename "$file")"
  psql -v ON_ERROR_STOP=1 -d "$db" -f "$file"
}

run_file bookvault_auth "$SEED_DIR/01_bookvault_auth.sql"
run_file bookvault_users "$SEED_DIR/02_bookvault_users.sql"
run_file bookvault_authors "$SEED_DIR/03_bookvault_authors.sql"
run_file bookvault_catalog "$SEED_DIR/04_bookvault_catalog.sql"
run_file bookvault_reviews "$SEED_DIR/05_bookvault_reviews.sql"
run_file bookvault_wishlist "$SEED_DIR/06_bookvault_wishlist.sql"
run_file bookvault_order "$SEED_DIR/07_bookvault_order.sql"
run_file bookvault_notifications "$SEED_DIR/08_bookvault_notifications.sql"
run_file bookvault_reading "$SEED_DIR/09_bookvault_reading.sql"
run_file bookvault_files "$SEED_DIR/10_bookvault_files.sql"

touch "$MARKER"
echo "[db-seed] Done. Marker written to $MARKER"
