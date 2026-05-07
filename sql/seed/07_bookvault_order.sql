-- bookvault_order — panier + commande payée de démo

DELETE FROM order_line;
DELETE FROM shop_order;
DELETE FROM cart_line;

INSERT INTO cart_line (user_id, book_id, quantity, unit_price, format) VALUES
  ('30000000-0000-4000-a000-000000000001'::uuid, 'f0000003-0000-4000-8000-000000000003'::uuid, 1, 28.00, 'EBOOK'),
  ('30000000-0000-4000-a000-000000000002'::uuid, 'f0000004-0000-4000-8000-000000000004'::uuid, 1, 32.00, 'EBOOK'),
  ('30000000-0000-4000-a000-000000000003'::uuid, 'f0000002-0000-4000-8000-000000000002'::uuid, 1, 38.00, 'EBOOK');

WITH o AS (
  INSERT INTO shop_order (user_id, status, total_amount, currency, payment_reference, created_at, updated_at)
  VALUES (
    '30000000-0000-4000-a000-000000000001'::uuid,
    'PAID',
    45.00,
    'EUR',
    'CM-MTN-MOMO-DEMO-001',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  )
  RETURNING id
)
INSERT INTO order_line (order_id, book_id, quantity, unit_price, format)
SELECT o.id, 'f0000001-0000-4000-8000-000000000001'::uuid, 1, 45.00, 'EBOOK'
FROM o;

WITH o2 AS (
  INSERT INTO shop_order (user_id, status, total_amount, currency, payment_reference, created_at, updated_at)
  VALUES (
    '30000000-0000-4000-a000-000000000001'::uuid,
    'PAID',
    70.00,
    'EUR',
    'CM-MTN-MOMO-DEMO-002',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
  )
  RETURNING id
)
INSERT INTO order_line (order_id, book_id, quantity, unit_price, format)
SELECT o2.id, v.bid, 1, v.p, 'EBOOK'
FROM o2
CROSS JOIN (VALUES
  ('f0000002-0000-4000-8000-000000000002'::uuid, 38.00::numeric),
  ('f0000004-0000-4000-8000-000000000004'::uuid, 32.00::numeric)
) AS v(bid, p);

WITH o3 AS (
  INSERT INTO shop_order (user_id, status, total_amount, currency, payment_reference, created_at, updated_at)
  VALUES (
    '30000000-0000-4000-a000-000000000002'::uuid,
    'PAID',
    22.00,
    'EUR',
    'CM-OM-DEMO-003',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
  )
  RETURNING id
)
INSERT INTO order_line (order_id, book_id, quantity, unit_price, format)
SELECT o3.id, 'f0000005-0000-4000-8000-000000000005'::uuid, 1, 22.00, 'EBOOK'
FROM o3;
