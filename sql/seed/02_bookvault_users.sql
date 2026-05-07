-- bookvault_users — profils publics (alignés sur les UUID auth)

DELETE FROM user_profiles;

INSERT INTO user_profiles (
  user_id, email, first_name, last_name, role, active, bio, avatar_url,
  preferred_language, newsletter, created_at, updated_at
) VALUES
  ('10000000-0000-4000-a000-000000000001'::uuid,
   'patricia.ngono@bookvault.cm', 'Patricia', 'Ngono', 'ADMIN', true,
   'Administratrice plateforme BookVault — Douala.', NULL, 'fr', false, NOW(), NOW()),
  ('10000000-0000-4000-a000-000000000002'::uuid,
   'kouokamasaph142@gmail.com', 'Eugene Asaph', 'Kouokam Talla', 'ADMIN', true,
   'Administrateur plateforme BookVault — Dschang, Cameroun.', NULL, 'fr', false, NOW(), NOW()),
  ('20000000-0000-4000-a000-000000000001'::uuid,
   'martin.ndongo@auteurs.cm', 'Martin', 'Ndongo', 'AUTHOR', true,
   'Enseignant-chercheur en recherche opérationnelle, Université de Yaoundé I.', NULL, 'fr', true, NOW(), NOW()),
  ('20000000-0000-4000-a000-000000000002'::uuid,
   'grace.fotso@auteurs.cm', 'Grace', 'Fotso', 'AUTHOR', true,
   'Data scientist et formatrice Python — passionnée par l’open data au Cameroun.', NULL, 'fr', true, NOW(), NOW()),
  ('20000000-0000-4000-a000-000000000003'::uuid,
   'jp.mbarga@auteurs.cm', 'Jean-Pierre', 'Mbarga', 'AUTHOR', true,
   'Essayiste et historien — récits du Cameroun contemporain et du Grassfield.', NULL, 'fr', true, NOW(), NOW()),
  ('20000000-0000-4000-a000-000000000004'::uuid,
   'armel.nkem@auteurs.cm', 'Armel', 'Nkem', 'AUTHOR', true,
   'Ingénieur logiciel (Douala) — systèmes, OS et architecture.', NULL, 'fr', true, NOW(), NOW()),
  ('20000000-0000-4000-a000-000000000005'::uuid,
   'nadia.tambe@auteurs.cm', 'Nadia', 'Tambe', 'AUTHOR', true,
   'ML Engineer (Yaoundé) — MLOps, qualité des données et production.', NULL, 'fr', true, NOW(), NOW()),
  ('20000000-0000-4000-a000-000000000006'::uuid,
   'mariette.ngassa@auteurs.cm', 'Mariette', 'Ngassa', 'AUTHOR', true,
   'Enseignante APC — manuels et exercices (collège/lycée).', NULL, 'fr', true, NOW(), NOW()),
  ('30000000-0000-4000-a000-000000000001'::uuid,
   'paul.atangana@users.cm', 'Paul', 'Atangana', 'USER', true,
   'Lecteur à Yaoundé — sciences et essais.', NULL, 'fr', false, NOW(), NOW()),
  ('30000000-0000-4000-a000-000000000002'::uuid,
   'marie.essama@users.cm', 'Marie', 'Essama', 'USER', true,
   'Bibliothécaire à Douala, passionnée de littérature camerounaise.', NULL, 'fr', true, NOW(), NOW()),
  ('30000000-0000-4000-a000-000000000003'::uuid,
   'samuel.beko@users.cm', 'Samuel', 'Beko', 'USER', true,
   'Développeur à Bamenda — ebooks tech et IA.', NULL, 'fr', false, NOW(), NOW());
