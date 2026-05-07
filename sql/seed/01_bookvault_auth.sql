-- bookvault_auth — comptes d’authentification (mot de passe : BukVault2026!)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = current_schema() AND table_name = 'auth_refresh_tokens'
  ) THEN
    DELETE FROM auth_refresh_tokens;
  END IF;
END $$;

DELETE FROM auth_users;

INSERT INTO auth_users (id, email, password_hash, first_name, last_name, role, active, created_at)
VALUES
  ('10000000-0000-4000-a000-000000000001'::uuid,
   'patricia.ngono@bookvault.cm',
   crypt('BukVault2026!', gen_salt('bf', 12)),
   'Patricia', 'Ngono', 'ADMIN', true, NOW()),
  ('10000000-0000-4000-a000-000000000002'::uuid,
   'kouokamasaph142@gmail.com',
   crypt('BukVault2026!', gen_salt('bf', 12)),
   'Eugene Asaph', 'Kouokam Talla', 'ADMIN', true, NOW()),
  ('20000000-0000-4000-a000-000000000001'::uuid,
   'martin.ndongo@auteurs.cm',
   crypt('BukVault2026!', gen_salt('bf', 12)),
   'Martin', 'Ndongo', 'AUTHOR', true, NOW()),
  ('20000000-0000-4000-a000-000000000002'::uuid,
   'grace.fotso@auteurs.cm',
   crypt('BukVault2026!', gen_salt('bf', 12)),
   'Grace', 'Fotso', 'AUTHOR', true, NOW()),
  ('20000000-0000-4000-a000-000000000003'::uuid,
   'jp.mbarga@auteurs.cm',
   crypt('BukVault2026!', gen_salt('bf', 12)),
   'Jean-Pierre', 'Mbarga', 'AUTHOR', true, NOW()),
  ('30000000-0000-4000-a000-000000000001'::uuid,
   'paul.atangana@users.cm',
   crypt('BukVault2026!', gen_salt('bf', 12)),
   'Paul', 'Atangana', 'USER', true, NOW()),
  ('30000000-0000-4000-a000-000000000002'::uuid,
   'marie.essama@users.cm',
   crypt('BukVault2026!', gen_salt('bf', 12)),
   'Marie', 'Essama', 'USER', true, NOW()),
  ('30000000-0000-4000-a000-000000000003'::uuid,
   'samuel.beko@users.cm',
   crypt('BukVault2026!', gen_salt('bf', 12)),
   'Samuel', 'Beko', 'USER', true, NOW());
