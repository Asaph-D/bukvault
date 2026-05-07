-- bookvault_community — communauté + messagerie + signaux recommandations

-- Nettoyage (ordre FK)
DELETE FROM chat_message;
DELETE FROM conversation_member;
DELETE FROM conversation;

DELETE FROM book_like;
DELETE FROM buddy_suggestion;
DELETE FROM community_event;
DELETE FROM community_thread;
DELETE FROM community_hub_stat;
DELETE FROM member_profile;

-- Patch schéma : anciennes versions pouvaient créer chat_message.content en OID (LOB).
-- Ici on force en TEXT pour que les inserts fonctionnent.
DO $$
DECLARE
  t text;
BEGIN
  SELECT data_type
  INTO t
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'chat_message' AND column_name = 'content';

  IF t = 'oid' THEN
    ALTER TABLE chat_message DROP COLUMN content;
    ALTER TABLE chat_message ADD COLUMN content text NOT NULL;
  END IF;
END $$;

-- Annuaire membres (reprend 02_bookvault_users.sql)
INSERT INTO member_profile (
  user_id, email, first_name, last_name, role, bio, avatar_url, active, updated_at
) VALUES
  ('10000000-0000-4000-a000-000000000001'::uuid, 'patricia.ngono@bookvault.cm', 'Patricia', 'Ngono', 'ADMIN', 'Administratrice plateforme BookVault — Douala.', NULL, true, NOW()),
  ('10000000-0000-4000-a000-000000000002'::uuid, 'kouokamasaph142@gmail.com', 'Eugene Asaph', 'Kouokam Talla', 'ADMIN', 'Administrateur plateforme BookVault — Dschang, Cameroun.', NULL, true, NOW()),
  ('20000000-0000-4000-a000-000000000001'::uuid, 'martin.ndongo@auteurs.cm', 'Martin', 'Ndongo', 'AUTHOR', 'Enseignant-chercheur en recherche opérationnelle, Université de Yaoundé I.', NULL, true, NOW()),
  ('20000000-0000-4000-a000-000000000002'::uuid, 'grace.fotso@auteurs.cm', 'Grace', 'Fotso', 'AUTHOR', 'Data scientist et formatrice Python — passionnée par l’open data au Cameroun.', NULL, true, NOW()),
  ('20000000-0000-4000-a000-000000000003'::uuid, 'jp.mbarga@auteurs.cm', 'Jean-Pierre', 'Mbarga', 'AUTHOR', 'Essayiste et historien — récits du Cameroun contemporain et du Grassfield.', NULL, true, NOW()),
  ('20000000-0000-4000-a000-000000000004'::uuid, 'armel.nkem@auteurs.cm', 'Armel', 'Nkem', 'AUTHOR', 'Ingénieur logiciel (Douala) — systèmes, OS et architecture.', NULL, true, NOW()),
  ('20000000-0000-4000-a000-000000000005'::uuid, 'nadia.tambe@auteurs.cm', 'Nadia', 'Tambe', 'AUTHOR', 'ML Engineer (Yaoundé) — MLOps, qualité des données et production.', NULL, true, NOW()),
  ('20000000-0000-4000-a000-000000000006'::uuid, 'mariette.ngassa@auteurs.cm', 'Mariette', 'Ngassa', 'AUTHOR', 'Enseignante APC — manuels et exercices (collège/lycée).', NULL, true, NOW()),
  ('30000000-0000-4000-a000-000000000001'::uuid, 'paul.atangana@users.cm', 'Paul', 'Atangana', 'USER', 'Lecteur à Yaoundé — sciences et essais.', NULL, true, NOW()),
  ('30000000-0000-4000-a000-000000000002'::uuid, 'marie.essama@users.cm', 'Marie', 'Essama', 'USER', 'Bibliothécaire à Douala, passionnée de littérature camerounaise.', NULL, true, NOW()),
  ('30000000-0000-4000-a000-000000000003'::uuid, 'samuel.beko@users.cm', 'Samuel', 'Beko', 'USER', 'Développeur à Bamenda — ebooks tech et IA.', NULL, true, NOW());

-- Hub
INSERT INTO community_hub_stat (id, active_readers, open_salons, tagline)
VALUES (1, 124, 8, 'Trouvez des passionnés qui lisent comme vous, aimez des livres pour affiner vos recos, puis discutez en DM.');

-- Threads
INSERT INTO community_thread (id, channel, title, hot, participant_count, last_activity_label, sort_index) VALUES
  ('a0000001-0000-4000-a000-000000000001'::uuid, '#ia', 'IA, data & livres tech', true, 38, 'à l’instant', 1),
  ('a0000002-0000-4000-a000-000000000002'::uuid, '#litterature', 'Littérature camerounaise', false, 22, 'il y a 12 min', 2),
  ('a0000003-0000-4000-a000-000000000003'::uuid, '#apc', 'APC — cours & exercices', false, 17, 'il y a 1 h', 3);

-- Events
INSERT INTO community_event (id, title, starts_at, tag, sort_index) VALUES
  ('b0000001-0000-4000-a000-000000000001'::uuid, 'AMA: publier un ebook au Cameroun', NOW() + INTERVAL '2 days', 'AMA', 1),
  ('b0000002-0000-4000-a000-000000000002'::uuid, 'Club lecture: essais & sciences', NOW() + INTERVAL '5 days', 'CLUB', 2),
  ('b0000003-0000-4000-a000-000000000003'::uuid, 'Atelier: système & architecture (live)', NOW() + INTERVAL '9 days', 'LIVE', 3);

-- Signaux "j’aime" (bookvault_catalog ids f000000*-...)
-- Paul: sciences/essais + un livre tech
INSERT INTO book_like (user_id, book_id, liked_at) VALUES
  ('30000000-0000-4000-a000-000000000001'::uuid, 'f0000002-0000-4000-8000-000000000002'::uuid, NOW() - INTERVAL '7 days'),
  ('30000000-0000-4000-a000-000000000001'::uuid, 'f0000003-0000-4000-8000-000000000003'::uuid, NOW() - INTERVAL '6 days'),
  ('30000000-0000-4000-a000-000000000001'::uuid, 'f0000005-0000-4000-8000-000000000005'::uuid, NOW() - INTERVAL '2 days');

-- Marie: littérature + essais
INSERT INTO book_like (user_id, book_id, liked_at) VALUES
  ('30000000-0000-4000-a000-000000000002'::uuid, 'f0000002-0000-4000-8000-000000000002'::uuid, NOW() - INTERVAL '8 days'),
  ('30000000-0000-4000-a000-000000000002'::uuid, 'f0000007-0000-4000-8000-000000000007'::uuid, NOW() - INTERVAL '3 days'),
  ('30000000-0000-4000-a000-000000000002'::uuid, 'f0000008-0000-4000-8000-000000000008'::uuid, NOW() - INTERVAL '1 days');

-- Samuel: tech/IA
INSERT INTO book_like (user_id, book_id, liked_at) VALUES
  ('30000000-0000-4000-a000-000000000003'::uuid, 'f0000001-0000-4000-8000-000000000001'::uuid, NOW() - INTERVAL '10 days'),
  ('30000000-0000-4000-a000-000000000003'::uuid, 'f0000002-0000-4000-8000-000000000002'::uuid, NOW() - INTERVAL '9 days'),
  ('30000000-0000-4000-a000-000000000003'::uuid, 'f0000004-0000-4000-8000-000000000004'::uuid, NOW() - INTERVAL '4 days');

-- Auteurs: aiment (aussi) leur propre contenu / thématiques proches
INSERT INTO book_like (user_id, book_id, liked_at) VALUES
  ('20000000-0000-4000-a000-000000000004'::uuid, 'f0000001-0000-4000-8000-000000000001'::uuid, NOW() - INTERVAL '12 days'),
  ('20000000-0000-4000-a000-000000000004'::uuid, 'f0000004-0000-4000-8000-000000000004'::uuid, NOW() - INTERVAL '11 days'),
  ('20000000-0000-4000-a000-000000000002'::uuid, 'f0000002-0000-4000-8000-000000000002'::uuid, NOW() - INTERVAL '15 days'),
  ('20000000-0000-4000-a000-000000000006'::uuid, 'f000000a-0000-4000-8000-00000000000a'::uuid, NOW() - INTERVAL '20 days');

-- Suggestions buddies (affichage "Lecteurs comme vous") pour Paul (viewer)
INSERT INTO buddy_suggestion (id, viewer_user_id, display_name, match_percent, reading_hint, sort_index) VALUES
  ('e0000001-0000-4000-a000-000000000001'::uuid, '30000000-0000-4000-a000-000000000001'::uuid, 'Marie Essama', 82, 'Aime aussi « f0000002 » et « f0000007 »', 1),
  ('e0000002-0000-4000-a000-000000000002'::uuid, '30000000-0000-4000-a000-000000000001'::uuid, 'Samuel Beko', 74, 'Lecture tech/IA (plusieurs livres en commun)', 2),
  ('e0000003-0000-4000-a000-000000000003'::uuid, '30000000-0000-4000-a000-000000000001'::uuid, 'Grace Fotso', 68, 'Open data & analyses — échanges enrichissants', 3);

-- Messagerie : conversations + messages (bonne quantité)
-- C1 Paul <-> Marie
INSERT INTO conversation (id, type, created_at, updated_at, last_message_preview)
VALUES ('c0000001-0000-4000-a000-000000000001'::uuid, 'DIRECT', NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day', 'Tu as aimé ce livre aussi ?');
INSERT INTO conversation_member (conversation_id, user_id) VALUES
  ('c0000001-0000-4000-a000-000000000001'::uuid, '30000000-0000-4000-a000-000000000001'::uuid),
  ('c0000001-0000-4000-a000-000000000001'::uuid, '30000000-0000-4000-a000-000000000002'::uuid);
INSERT INTO chat_message (id, conversation_id, sender_id, content, created_at) VALUES
  ('d0000001-0000-4000-a000-000000000001'::uuid, 'c0000001-0000-4000-a000-000000000001'::uuid, '30000000-0000-4000-a000-000000000001'::uuid, 'Salut Marie, je vois qu’on aime tous les deux certains essais. Tu lis quoi en ce moment ?', NOW() - INTERVAL '6 days'),
  ('d0000002-0000-4000-a000-000000000002'::uuid, 'c0000001-0000-4000-a000-000000000001'::uuid, '30000000-0000-4000-a000-000000000002'::uuid, 'Hello Paul ! Je viens de finir un chapitre sur la méthode. Et toi ?', NOW() - INTERVAL '6 days' + INTERVAL '15 min'),
  ('d0000003-0000-4000-a000-000000000003'::uuid, 'c0000001-0000-4000-a000-000000000001'::uuid, '30000000-0000-4000-a000-000000000001'::uuid, 'Je suis sur « f0000002 » en ce moment. Très clair.', NOW() - INTERVAL '5 days'),
  ('d0000004-0000-4000-a000-000000000004'::uuid, 'c0000001-0000-4000-a000-000000000001'::uuid, '30000000-0000-4000-a000-000000000002'::uuid, 'Ah oui ! Je l’ai aimé aussi. On peut en discuter ce soir ?', NOW() - INTERVAL '3 days'),
  ('d0000005-0000-4000-a000-000000000005'::uuid, 'c0000001-0000-4000-a000-000000000001'::uuid, '30000000-0000-4000-a000-000000000001'::uuid, 'Carrément. Tu as aimé ce livre aussi ?', NOW() - INTERVAL '1 day');

-- C2 Paul <-> Samuel
INSERT INTO conversation (id, type, created_at, updated_at, last_message_preview)
VALUES ('c0000002-0000-4000-a000-000000000002'::uuid, 'DIRECT', NOW() - INTERVAL '9 days', NOW() - INTERVAL '2 days', 'On compare nos notes IA ?');
INSERT INTO conversation_member (conversation_id, user_id) VALUES
  ('c0000002-0000-4000-a000-000000000002'::uuid, '30000000-0000-4000-a000-000000000001'::uuid),
  ('c0000002-0000-4000-a000-000000000002'::uuid, '30000000-0000-4000-a000-000000000003'::uuid);
INSERT INTO chat_message (id, conversation_id, sender_id, content, created_at) VALUES
  ('d0000011-0000-4000-a000-000000000011'::uuid, 'c0000002-0000-4000-a000-000000000002'::uuid, '30000000-0000-4000-a000-000000000003'::uuid, 'Salut Paul, j’ai vu que tu as liké « f0000002 ». Tu l’as trouvé comment ?', NOW() - INTERVAL '9 days'),
  ('d0000012-0000-4000-a000-000000000012'::uuid, 'c0000002-0000-4000-a000-000000000002'::uuid, '30000000-0000-4000-a000-000000000001'::uuid, 'Super accessible. Ça m’a donné envie de pousser sur l’IA.', NOW() - INTERVAL '9 days' + INTERVAL '10 min'),
  ('d0000013-0000-4000-a000-000000000013'::uuid, 'c0000002-0000-4000-a000-000000000002'::uuid, '30000000-0000-4000-a000-000000000003'::uuid, 'On compare nos notes IA ?', NOW() - INTERVAL '2 days');

-- C3 Marie <-> Grace (auteur)
INSERT INTO conversation (id, type, created_at, updated_at, last_message_preview)
VALUES ('c0000003-0000-4000-a000-000000000003'::uuid, 'DIRECT', NOW() - INTERVAL '14 days', NOW() - INTERVAL '5 days', 'Merci pour vos travaux !');
INSERT INTO conversation_member (conversation_id, user_id) VALUES
  ('c0000003-0000-4000-a000-000000000003'::uuid, '30000000-0000-4000-a000-000000000002'::uuid),
  ('c0000003-0000-4000-a000-000000000003'::uuid, '20000000-0000-4000-a000-000000000002'::uuid);
INSERT INTO chat_message (id, conversation_id, sender_id, content, created_at) VALUES
  ('d0000021-0000-4000-a000-000000000021'::uuid, 'c0000003-0000-4000-a000-000000000003'::uuid, '30000000-0000-4000-a000-000000000002'::uuid, 'Bonsoir Grace, votre contenu sur l’open data est top.', NOW() - INTERVAL '14 days'),
  ('d0000022-0000-4000-a000-000000000022'::uuid, 'c0000003-0000-4000-a000-000000000003'::uuid, '20000000-0000-4000-a000-000000000002'::uuid, 'Merci Marie ! Vous travaillez sur quel sujet en ce moment ?', NOW() - INTERVAL '14 days' + INTERVAL '30 min'),
  ('d0000023-0000-4000-a000-000000000023'::uuid, 'c0000003-0000-4000-a000-000000000003'::uuid, '30000000-0000-4000-a000-000000000002'::uuid, 'Archivage & bibliothèques numériques.', NOW() - INTERVAL '13 days'),
  ('d0000024-0000-4000-a000-000000000024'::uuid, 'c0000003-0000-4000-a000-000000000003'::uuid, '20000000-0000-4000-a000-000000000002'::uuid, 'Génial. On peut faire un mini-club lecture sur le sujet.', NOW() - INTERVAL '5 days');

