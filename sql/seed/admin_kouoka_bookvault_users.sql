-- Profil aligné sur le même UUID que bookvault_auth
INSERT INTO user_profiles (
  user_id, email, first_name, last_name, role, active, bio, avatar_url,
  preferred_language, newsletter, created_at, updated_at
)
VALUES (
  'c0000001-0000-4000-a000-000000000001'::uuid,
  'kouokamasaph142@gmail.com',
  'Asaph',
  'Kouoka',
  'ADMIN',
  true,
  NULL,
  NULL,
  'fr',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  active = EXCLUDED.active,
  updated_at = NOW();
