-- bookvault_reading — progression + signet

DELETE FROM reading_bookmarks;
DELETE FROM reading_progress;

INSERT INTO reading_progress (
  user_id, book_id, media_type, position_json, device_id, server_updated_at, client_updated_at
) VALUES
  ('30000000-0000-4000-a000-000000000001'::uuid,
   'f0000001-0000-4000-8000-000000000001'::uuid,
   'EBOOK',
   '{"percent": 37, "chapter": 4, "note": "Revu simplexe tableau"}',
   'web-chrome-cm',
   NOW() - INTERVAL '1 hour',
   NOW() - INTERVAL '2 hours'),
  ('30000000-0000-4000-a000-000000000001'::uuid,
   'f0000002-0000-4000-8000-000000000002'::uuid,
   'EBOOK',
   '{"percent": 52, "chapter": 6}',
   'web-chrome-cm',
   NOW() - INTERVAL '3 days',
   NOW() - INTERVAL '3 days'),
  ('30000000-0000-4000-a000-000000000001'::uuid,
   'f0000004-0000-4000-8000-000000000004'::uuid,
   'EBOOK',
   '{"percent": 18, "chapter": 2}',
   'web-chrome-cm',
   NOW() - INTERVAL '8 days',
   NOW() - INTERVAL '8 days'),
  ('30000000-0000-4000-a000-000000000002'::uuid,
   'f0000005-0000-4000-8000-000000000005'::uuid,
   'EBOOK',
   '{"percent": 72, "chapter": 12}',
   'tablet-android',
   NOW() - INTERVAL '30 minutes',
   NOW() - INTERVAL '45 minutes'),
  ('30000000-0000-4000-a000-000000000003'::uuid,
   'f0000003-0000-4000-8000-000000000003'::uuid,
   'EBOOK',
   '{"percent": 91, "chapter": 14}',
   'iphone-bookvault',
   NOW() - INTERVAL '20 minutes',
   NOW() - INTERVAL '25 minutes');

INSERT INTO reading_bookmarks (id, user_id, book_id, anchor_json, label, created_at) VALUES
  ('b1000001-0000-4000-8000-000000000001'::uuid,
   '30000000-0000-4000-a000-000000000001'::uuid,
   'f0000001-0000-4000-8000-000000000001'::uuid,
   '{"cfi": "/6/4[chap-4]!", "page": 89}',
   'Rappel exercice transport',
   NOW() - INTERVAL '3 days');
