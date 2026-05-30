-- Migration unique : convertir les montants stockés en EUR vers XAF (devise plateforme).
-- Exécuter une seule fois si vos prix catalogue sont encore en euros (< 500 par livre numérique).
-- psql -U postgres -d bookvault_catalog -f sql/migrations/convert_prices_eur_to_xaf.sql

BEGIN;

-- Catalogue (prix unitaires livres)
UPDATE catalog_books
SET price = ROUND(price * 655.957, 0)
WHERE price > 0 AND price < 500;

-- Panier et commandes (bases order)
UPDATE cart_line
SET unit_price = ROUND(unit_price * 655.957, 0)
WHERE unit_price > 0 AND unit_price < 500;

UPDATE order_line ol
SET unit_price = ROUND(unit_price * 655.957, 0)
FROM shop_order o
WHERE ol.order_id = o.id
  AND ol.unit_price > 0
  AND ol.unit_price < 500;

UPDATE shop_order
SET total_amount = ROUND(total_amount * 655.957, 0),
    currency = 'XAF'
WHERE total_amount > 0 AND total_amount < 500 AND (currency IS NULL OR currency = 'EUR');

UPDATE shop_order SET currency = 'XAF' WHERE currency = 'EUR' OR currency IS NULL;

COMMIT;
