-- Admin Asaph Kouoka — bookvault_auth (mot de passe hashé bcrypt via pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth_users (id, email, password_hash, first_name, last_name, role, active, created_at)
VALUES (
  'c0000001-0000-4000-a000-000000000001'::uuid,
  'kouokamasaph142@gmail.com',
  crypt('01329Dam', gen_salt('bf', 12)),
  'Asaph',
  'Kouoka',
  'ADMIN',
  true,
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  active = EXCLUDED.active;
