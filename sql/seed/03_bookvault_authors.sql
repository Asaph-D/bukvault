-- bookvault_authors — vitrines auteur (profils « plume »)

DELETE FROM author_profile;

INSERT INTO author_profile (user_id, pen_name, website, bio) VALUES
  ('20000000-0000-4000-a000-000000000001'::uuid,
   'Dr Martin Ndongo',
   'https://lab-ro.cm/martin-ndongo',
   'Spécialiste en optimisation et programmation linéaire ; cours et ouvrages pour les masters en gestion au Cameroun.'),
  ('20000000-0000-4000-a000-000000000002'::uuid,
   'Grace Fotso',
   'https://gracefotso.dev',
   'Formations Python & données ; valorisation des données publiques camerounaises.'),
  ('20000000-0000-4000-a000-000000000003'::uuid,
   'J.-P. Mbarga',
   NULL,
   'Essais sur la société civile et récits oraux du Nord-Ouest et de l’Ouest.');

INSERT INTO author_profile (user_id, pen_name, website, bio) VALUES
  ('20000000-0000-4000-a000-000000000004'::uuid,
   'Armel Nkem',
   'https://armelnkem.cm',
   'Systèmes & OS — vulgarisation et fiches pratiques pour étudiants.'),
  ('20000000-0000-4000-a000-000000000005'::uuid,
   'Nadia Tambe',
   'https://mlops-tambe.cm',
   'Ingénierie ML — pipelines, monitoring et robustesse en production.'),
  ('20000000-0000-4000-a000-000000000006'::uuid,
   'Mariette Ngassa',
   NULL,
   'Pédagogie APC — exercices gradués et méthodologie pour collège/lycée.');
