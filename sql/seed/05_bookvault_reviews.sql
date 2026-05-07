-- bookvault_reviews — avis (alignés sur les livres seed)

DELETE FROM review_helpful;
DELETE FROM review_report;
DELETE FROM book_review;

INSERT INTO book_review (book_id, user_id, rating, title, body, verified_purchase, created_at, updated_at)
VALUES
  ('f0000001-0000-4000-8000-000000000001'::uuid,
   '30000000-0000-4000-a000-000000000001'::uuid,
   5,
   'Indispensable pour le master',
   'Les exemples de transport et d’affectation sont clairs ; parfait avec mon cours à Yaoundé.',
   true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('f0000001-0000-4000-8000-000000000001'::uuid,
   '30000000-0000-4000-a000-000000000002'::uuid,
   4,
   'Solide mais dense',
   'Chapitre files d’attente très utile pour la préparation des examens.',
   false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('f0000002-0000-4000-8000-000000000002'::uuid,
   '30000000-0000-4000-a000-000000000003'::uuid,
   5,
   'Python enfin contextualisé',
   'Les jeux de données « Cameroun » rendent les exercices concrets.',
   true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('f0000003-0000-4000-8000-000000000003'::uuid,
   '30000000-0000-4000-a000-000000000002'::uuid,
   4,
   'Trajectoire civique bien documentée',
   'Références précises sur Douala et Yaoundé.',
   false, NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
  ('f0000005-0000-4000-8000-000000000005'::uuid,
   '30000000-0000-4000-a000-000000000001'::uuid,
   5,
   'Magnifique transmission orale',
   'À lire à voix haute en famille.',
   true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');
