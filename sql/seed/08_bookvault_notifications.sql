-- bookvault_notifications

DELETE FROM app_notification;
DELETE FROM notification_preferences;

INSERT INTO notification_preferences (user_id, email_enabled, in_app_enabled, marketing_enabled) VALUES
  ('10000000-0000-4000-a000-000000000001'::uuid, true, true, false),
  ('20000000-0000-4000-a000-000000000001'::uuid, true, true, true),
  ('20000000-0000-4000-a000-000000000002'::uuid, true, true, true),
  ('20000000-0000-4000-a000-000000000003'::uuid, true, true, false),
  ('30000000-0000-4000-a000-000000000001'::uuid, true, true, false),
  ('30000000-0000-4000-a000-000000000002'::uuid, true, true, true),
  ('30000000-0000-4000-a000-000000000003'::uuid, true, true, false);

-- Colonne booléenne « read_flag » (Spring : champ readFlag)
INSERT INTO app_notification (user_id, kind, title, message, read_flag, created_at) VALUES
  ('30000000-0000-4000-a000-000000000001'::uuid, 'ORDER', 'Paiement confirmé',
   'Votre commande du livre « Recherche opérationnelle… » a été enregistrée (réf. CM-MTN-MOMO-DEMO-001).',
   true, NOW() - INTERVAL '10 days'),
  ('30000000-0000-4000-a000-000000000001'::uuid, 'SYSTEM', 'Bienvenue sur BookVault',
   'Synchronisez votre progression de lecture sur tous vos appareils.',
   false, NOW() - INTERVAL '2 days'),
  ('30000000-0000-4000-a000-000000000002'::uuid, 'PROMO', 'Nouveautés littérature',
   'Découvrez « Contes du Grassfield » et les essais de J.-P. Mbarga.',
   false, NOW() - INTERVAL '1 day'),
  ('30000000-0000-4000-a000-000000000001'::uuid, 'SYSTEM', 'Synchronisation',
   'Votre progression sur « Python pour la science des données » a été mise à jour.',
   false, NOW() - INTERVAL '6 hours'),
  ('10000000-0000-4000-a000-000000000001'::uuid, 'SYSTEM', 'File de validation',
   '2 ouvrages en attente de publication — voir le tableau de bord admin.',
   false, NOW() - INTERVAL '4 hours');
