# Données de démonstration BookVault

**Mot de passe unique pour tous les comptes seed :** `BukVault2026!`  
(Hash bcrypt généré avec `pgcrypto` dans `bookvault_auth`, compatible Spring `BCryptPasswordEncoder(12)`.)

## Prérequis

- PostgreSQL 14+ avec les bases `bookvault_*` déjà créées.
- Client `psql` dans le `PATH`, ou chemin complet vers `psql.exe`.

## Docker (recommandé)

Avec `docker compose up -d`, le conteneur **`db-seed`** (voir `docker-compose.yml`) attend que les services aient créé les tables (Hibernate), puis exécute automatiquement les scripts de ce dossier. Un marqueur est enregistré dans le volume **`seed_state`** pour ne pas re-seed à chaque `up`.

- Réinitialisation complète (bases + marqueur) : `docker compose down -v`
- Forcer un nouveau seed sans tout supprimer : `docker volume rm bookvault_seed_state` (puis `docker compose up -d` pour relancer le seed)

## Exécution (Windows PowerShell)

```powershell
$env:PGPASSWORD = "1234"
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"   # adapter la version
$dbUrl = "-h localhost -p 5432 -U postgres"

& $psql $dbUrl -d bookvault_auth -v ON_ERROR_STOP=1 -f sql/seed/01_bookvault_auth.sql
& $psql $dbUrl -d bookvault_users -v ON_ERROR_STOP=1 -f sql/seed/02_bookvault_users.sql
& $psql $dbUrl -d bookvault_authors -v ON_ERROR_STOP=1 -f sql/seed/03_bookvault_authors.sql
& $psql $dbUrl -d bookvault_catalog -v ON_ERROR_STOP=1 -f sql/seed/04_bookvault_catalog.sql
& $psql $dbUrl -d bookvault_reviews -v ON_ERROR_STOP=1 -f sql/seed/05_bookvault_reviews.sql
& $psql $dbUrl -d bookvault_wishlist -v ON_ERROR_STOP=1 -f sql/seed/06_bookvault_wishlist.sql
& $psql $dbUrl -d bookvault_order -v ON_ERROR_STOP=1 -f sql/seed/07_bookvault_order.sql
& $psql $dbUrl -d bookvault_notifications -v ON_ERROR_STOP=1 -f sql/seed/08_bookvault_notifications.sql
& $psql $dbUrl -d bookvault_reading -v ON_ERROR_STOP=1 -f sql/seed/09_bookvault_reading.sql
& $psql $dbUrl -d bookvault_files -v ON_ERROR_STOP=1 -f sql/seed/10_bookvault_files.sql
```

Ordre important : `auth` → `users` → `authors` → `catalog` → services qui référencent des UUID de livres/utilisateurs.

## Identifiants seed (UUID fixes)

| Rôle   | Email                       | UUID                                   |
|--------|-----------------------------|----------------------------------------|
| ADMIN  | patricia.ngono@bookvault.cm | `10000000-0000-4000-a000-000000000001` |
| Auteur | martin.ndongo@auteurs.cm    | `20000000-0000-4000-a000-000000000001` |
| Auteur | grace.fotso@auteurs.cm      | `20000000-0000-4000-a000-000000000002` |
| Auteur | jp.mbarga@auteurs.cm        | `20000000-0000-4000-a000-000000000003` |
| User   | paul.atangana@users.cm      | `30000000-0000-4000-a000-000000000001` |
| User   | marie.essama@users.cm       | `30000000-0000-4000-a000-000000000002` |
| User   | samuel.beko@users.cm        | `30000000-0000-4000-a000-000000000003` |

Les livres utilisent les UUID `f0000001-…` à `f0000005-…` (voir scripts catalog).

Pour réinitialiser : ré-exécuter chaque script (ils commencent par des `DELETE` / `TRUNCATE` ciblés là où c’est sûr).
