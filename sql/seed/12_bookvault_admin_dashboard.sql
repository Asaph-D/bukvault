-- =============================================================================
-- bookvault — enrichissement données pour l'API admin-service
-- GET /api/v1/admin/dashboard (agrégation user / catalog / reading / review)
--
-- Utilise les comptes du seed 02 et les livres du seed 04 (f0000001–f0000011).
-- Brouillons : f000000f, f0000010, f0000011 (file de validations admin).
--
-- Prérequis : seeds 01 à 11 déjà appliqués.
-- Exécution : psql -h localhost -U postgres -v ON_ERROR_STOP=1 -f sql/seed/12_bookvault_admin_dashboard.sql
-- =============================================================================

\connect bookvault_users

-- Réaligne les dates d'inscription pour la courbe admin (idempotent)
UPDATE user_profiles SET created_at = NOW() - INTERVAL '35 days', updated_at = NOW() - INTERVAL '1 day'
WHERE user_id = '30000000-0000-4000-a000-000000000001'::uuid;
UPDATE user_profiles SET created_at = NOW() - INTERVAL '13 days', updated_at = NOW() - INTERVAL '6 hours'
WHERE user_id = '30000000-0000-4000-a000-000000000002'::uuid;
UPDATE user_profiles SET created_at = NOW() - INTERVAL '7 days', updated_at = NOW() - INTERVAL '4 hours'
WHERE user_id = '30000000-0000-4000-a000-000000000003'::uuid;
UPDATE user_profiles SET created_at = NOW() - INTERVAL '12 days', updated_at = NOW() - INTERVAL '2 days'
WHERE user_id = '30000000-0000-4000-a000-000000000004'::uuid;
UPDATE user_profiles SET created_at = NOW() - INTERVAL '11 days', updated_at = NOW() - INTERVAL '1 day'
WHERE user_id = '30000000-0000-4000-a000-000000000005'::uuid;
UPDATE user_profiles SET created_at = NOW() - INTERVAL '9 days', updated_at = NOW() - INTERVAL '3 days'
WHERE user_id = '30000000-0000-4000-a000-000000000006'::uuid;
UPDATE user_profiles SET created_at = NOW() - INTERVAL '6 days', updated_at = NOW() - INTERVAL '8 hours'
WHERE user_id = '30000000-0000-4000-a000-000000000007'::uuid;
UPDATE user_profiles SET created_at = NOW() - INTERVAL '5 days', updated_at = NOW() - INTERVAL '12 hours'
WHERE user_id = '30000000-0000-4000-a000-000000000008'::uuid;
UPDATE user_profiles SET created_at = NOW() - INTERVAL '3 days', updated_at = NOW() - INTERVAL '1 day'
WHERE user_id = '30000000-0000-4000-a000-000000000009'::uuid;
UPDATE user_profiles SET created_at = NOW() - INTERVAL '1 day', updated_at = NOW() - INTERVAL '30 minutes'
WHERE user_id = '30000000-0000-4000-a000-00000000000a'::uuid;

\connect bookvault_catalog

-- Rafraîchit les métadonnées des livres seed 04 pour les KPI admin (idempotent)
UPDATE catalog_books SET updated_at = NOW()
WHERE id IN (
  'f0000001-0000-4000-8000-000000000001'::uuid,
  'f0000002-0000-4000-8000-000000000002'::uuid,
  'f0000005-0000-4000-8000-000000000005'::uuid,
  'f000000a-0000-4000-8000-00000000000a'::uuid
) AND status = 'PUBLISHED' AND deleted = false;

\connect bookvault_reading

-- Progressions étalées sur 14 jours — lecteurs du seed 02
INSERT INTO reading_progress (
  user_id, book_id, media_type, position_json, device_id, server_updated_at, client_updated_at
) VALUES
  ('30000000-0000-4000-a000-000000000004'::uuid, 'f0000001-0000-4000-8000-000000000001'::uuid, 'EBOOK',
   '{"percent": 12, "chapter": 1}', 'seed-admin', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days'),
  ('30000000-0000-4000-a000-000000000005'::uuid, 'f0000002-0000-4000-8000-000000000002'::uuid, 'EBOOK',
   '{"percent": 25, "chapter": 2}', 'seed-admin', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('30000000-0000-4000-a000-000000000006'::uuid, 'f0000003-0000-4000-8000-000000000003'::uuid, 'EBOOK',
   '{"percent": 40, "chapter": 3}', 'seed-admin', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),
  ('30000000-0000-4000-a000-000000000007'::uuid, 'f0000004-0000-4000-8000-000000000004'::uuid, 'EBOOK',
   '{"percent": 8, "chapter": 1}', 'seed-admin', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  ('30000000-0000-4000-a000-000000000008'::uuid, 'f0000005-0000-4000-8000-000000000005'::uuid, 'EBOOK',
   '{"percent": 55, "chapter": 5}', 'seed-admin', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
  ('30000000-0000-4000-a000-000000000004'::uuid, 'f0000006-0000-4000-8000-000000000006'::uuid, 'EBOOK',
   '{"percent": 30, "chapter": 2}', 'seed-admin', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('30000000-0000-4000-a000-000000000005'::uuid, 'f0000007-0000-4000-8000-000000000007'::uuid, 'EBOOK',
   '{"percent": 62, "chapter": 4}', 'seed-admin', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('30000000-0000-4000-a000-000000000006'::uuid, 'f0000008-0000-4000-8000-000000000008'::uuid, 'EBOOK',
   '{"percent": 18, "chapter": 1}', 'seed-admin', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ('30000000-0000-4000-a000-000000000007'::uuid, 'f0000009-0000-4000-8000-000000000009'::uuid, 'EBOOK',
   '{"percent": 44, "chapter": 3}', 'seed-admin', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('30000000-0000-4000-a000-000000000008'::uuid, 'f000000a-0000-4000-8000-00000000000a'::uuid, 'EBOOK',
   '{"percent": 70, "chapter": 6}', 'seed-admin', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('30000000-0000-4000-a000-000000000009'::uuid, 'f000000b-0000-4000-8000-00000000000b'::uuid, 'EBOOK',
   '{"percent": 22, "chapter": 2}', 'seed-admin', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('30000000-0000-4000-a000-00000000000a'::uuid, 'f000000c-0000-4000-8000-00000000000c'::uuid, 'EBOOK',
   '{"percent": 48, "chapter": 4}', 'seed-admin', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('30000000-0000-4000-a000-000000000001'::uuid, 'f000000d-0000-4000-8000-00000000000d'::uuid, 'EBOOK',
   '{"percent": 22, "chapter": 2}', 'seed-admin', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('30000000-0000-4000-a000-000000000002'::uuid, 'f000000e-0000-4000-8000-00000000000e'::uuid, 'EBOOK',
   '{"percent": 35, "chapter": 3}', 'seed-admin', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours')
ON CONFLICT (user_id, book_id, media_type) DO UPDATE SET
  position_json = EXCLUDED.position_json,
  server_updated_at = EXCLUDED.server_updated_at,
  client_updated_at = EXCLUDED.client_updated_at;

-- Activité semaine glissante (Paul, Marie, Samuel + nouveaux lecteurs)
INSERT INTO reading_progress (
  user_id, book_id, media_type, position_json, device_id, server_updated_at, client_updated_at
) VALUES
  ('30000000-0000-4000-a000-000000000003'::uuid, 'f0000003-0000-4000-8000-000000000003'::uuid, 'EBOOK',
   '{"percent": 95}', 'seed-week', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ('30000000-0000-4000-a000-000000000004'::uuid, 'f0000004-0000-4000-8000-000000000004'::uuid, 'EBOOK',
   '{"percent": 33}', 'seed-week', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('30000000-0000-4000-a000-000000000005'::uuid, 'f0000005-0000-4000-8000-000000000005'::uuid, 'EBOOK',
   '{"percent": 41}', 'seed-week', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('30000000-0000-4000-a000-000000000006'::uuid, 'f0000001-0000-4000-8000-000000000001'::uuid, 'EBOOK',
   '{"percent": 50}', 'seed-week', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('30000000-0000-4000-a000-000000000007'::uuid, 'f0000002-0000-4000-8000-000000000002'::uuid, 'EBOOK',
   '{"percent": 60}', 'seed-week', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('30000000-0000-4000-a000-000000000008'::uuid, 'f0000003-0000-4000-8000-000000000003'::uuid, 'EBOOK',
   '{"percent": 72}', 'seed-week', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('30000000-0000-4000-a000-000000000009'::uuid, 'f0000004-0000-4000-8000-000000000004'::uuid, 'EBOOK',
   '{"percent": 28}', 'seed-week', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours')
ON CONFLICT (user_id, book_id, media_type) DO UPDATE SET
  server_updated_at = EXCLUDED.server_updated_at,
  client_updated_at = EXCLUDED.client_updated_at;

\connect bookvault_reviews

-- Signalements — rapporteurs : Marie, Samuel, Paul (seed 02)
INSERT INTO review_report (review_id, reporter_id, reason, details, created_at)
SELECT br.id,
       '30000000-0000-4000-a000-000000000002'::uuid,
       'SPAM',
       'Lien externe répété dans l’avis.',
       NOW() - INTERVAL '2 days'
FROM book_review br
WHERE br.book_id = 'f0000001-0000-4000-8000-000000000001'::uuid
  AND br.user_id = '30000000-0000-4000-a000-000000000001'::uuid
ON CONFLICT (review_id, reporter_id) DO NOTHING;

INSERT INTO review_report (review_id, reporter_id, reason, details, created_at)
SELECT br.id,
       '30000000-0000-4000-a000-000000000003'::uuid,
       'OFFENSIVE',
       'Formulations inappropriées signalées par la communauté.',
       NOW() - INTERVAL '1 day'
FROM book_review br
WHERE br.book_id = 'f0000002-0000-4000-8000-000000000002'::uuid
  AND br.user_id = '30000000-0000-4000-a000-000000000003'::uuid
ON CONFLICT (review_id, reporter_id) DO NOTHING;

INSERT INTO review_report (review_id, reporter_id, reason, details, created_at)
SELECT br.id,
       '30000000-0000-4000-a000-000000000001'::uuid,
       'INACCURATE',
       'Note ne correspond pas au contenu du livre selon le lecteur.',
       NOW() - INTERVAL '5 hours'
FROM book_review br
WHERE br.book_id = 'f0000005-0000-4000-8000-000000000005'::uuid
  AND br.user_id = '30000000-0000-4000-a000-000000000001'::uuid
ON CONFLICT (review_id, reporter_id) DO NOTHING;
