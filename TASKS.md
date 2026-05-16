# BookVault — Liste des tâches

Suivi du développement (API en premier, conformément au cahier des charges et au MCD). Cocher `[x]` une tâche lorsqu’elle est **terminée et validée** (build / test manuel ou auto).

---

## Architecture micro-services (répo multi-modules)

Chaque service est un projet Maven Spring Boot autonome (`api-gateway`, `auth-service`, `user-service`, `catalog-service`, `file-service`, `order-service`, `review-service`, `wishlist-service`, `notification-service`, `author-service`, `admin-service`, `reading-service`).

- [ ] POM parent agrégateur (optionnel) + commande unique `mvn verify` sur tous les modules.
- [x] Réseau / ports par défaut (voir `api-gateway` `application.yml` + `server.port` de chaque service) ; URLs surchargables via variables (`AUTH_SERVICE_URI`, etc.).
- [x] `api-gateway` (port **8080**) : routage `spring.cloud.gateway.server.webmvc.routes` vers tous les services ; CORS `GatewayCorsConfig`.
- [x] `auth-service` : émission JWT (`/api/v1/auth/**`), refresh stockés en base, blacklist jti — détail dans `MICROSERVICES.md`.
- [ ] Les autres services en **resource server** alignés sur `JWT_SECRET` / claim `sub` (UUID).
- [ ] Orchestration locale : `docker-compose` (PostgreSQL par service ou schémas distincts, Kafka optionnel) — *à ajouter si besoin.*

---

## reading-service (session de lecture & audio)

**Responsabilités :** position de lecture (e-book / audio), signets, annotations, synchro multi-appareils (dernier `PUT` gagnant côté serveur pour la V1). **Ne stocke pas** les binaires — déléguer à `file-service`. **Droits** : appels à `order-service` (achat / abonnement) ou mode stub en dev.

- [x] Socle Spring Boot : JPA, PostgreSQL, sécurité JWT (resource server), API `/api/v1/reading/**`.
- [x] Modèle : progression (`ReadingProgress`), signets (`Bookmark`), annotations (`ReadingAnnotation`), type de média `EBOOK` / `AUDIOBOOK`.
- [x] Client HTTP configurable vers `order-service` pour vérifier l’accès (`reading.entitlement.stub` par défaut pour développement sans interconnexion).
- [ ] Streaming / téléchargement audio : exposition **uniquement** via URLs signées depuis `file-service` (ce service garde la position et les signets audio).
- [ ] Événements Kafka (ex. `BookPurchased`) pour invalider cache ou précharger droits — *optionnel si Kafka activé plus tard.*
- [ ] Tests d’intégration contractuels avec WireMock pour `order-service`.

---

## Préparation & alignement

- [x] Harmoniser le préfixe API : `BookVault` → `apiUrl: '/api/v1'` + `proxy.conf.json` → gateway `http://localhost:8080`.
- [ ] Schéma PostgreSQL / entités JPA : décider version « spec PDF » (User + role ENUM) vs enrichissement MCD (LECTEUR/AUTEUR/ADMIN séparés) pour la V1.

---

## Phase 1 — Fondations backend (`bukvaultapi`)

- [ ] Configuration : `application.properties` / profils `dev` (PostgreSQL, JPA, logs).
- [ ] Dépendances déjà présentes : valider Spring Security, JPA, Validation, springdoc-openapi, HATEOAS.
- [ ] Entités de base selon spec §6 : `User`, `Role` ou enum intégré, relations minimales pour Auth.
- [ ] JWT : access token + refresh token (stockage refresh) + filtres Spring Security.
- [ ] Blacklist / invalidation logout (table ou mécanisme minimal pour la V1).
- [ ] CORS pour le front Angular (origines dev).

---

## Phase 2 — Auth (`/api/v1/auth/**`) — micro-service **auth-service**

- [x] `POST /auth/register` — inscription, BCrypt, rôle USER par défaut.
- [x] `POST /auth/login` — JWT access + refresh, retour rôles.
- [x] `POST /auth/refresh`.
- [x] `POST /auth/logout`.
- [x] `GET /auth/me`.
- [ ] (Option V2) `POST /auth/forgot-password`, `POST /auth/reset-password` (501 pour l’instant).

---

## Phase 3 — Utilisateurs (`/api/v1/users/**`) — micro-service **user-service**

- [x] `GET /users` (ADMIN, pagination + filtres).
- [x] `GET /users/{id}`, `PUT /users/{id}`, `DELETE /users/{id}` (règles propriétaire / ADMIN).
- [x] `GET /users/{id}/orders`, `GET /users/{id}/library` (placeholders vides jusqu’à order-service).
- [x] `PUT /users/{id}/role` (ADMIN).
- [x] `POST /users/bootstrap` — création profil depuis JWT (voir `MICROSERVICES.md`).

---

## Phase 4 — Catalogue (`/api/v1/books/**`, `/api/v1/categories/**`) — micro-service **catalog-service**

- [x] Entités `Book`, `Category` + pagination `Pageable`.
- [x] `GET /books`, `GET /books/{id}` (+ incrément vues), `GET /books/search`, `GET /books/bestsellers`, `GET /books/recommended`.
- [x] `POST /books`, `PUT /books/{id}`, `DELETE /books/{id}`, `PATCH /books/{id}/publish` (AUTHOR / ADMIN).
- [x] `GET /books/{id}/preview` (stub — voir `MICROSERVICES.md`).
- [x] `GET /categories`, `GET /categories/{id}/books`, CRUD catégories (ADMIN).

---

## Phase 5 — Fichiers (`/api/v1/files/**`)

- [x] Upload e-book / couverture / avatar (validation MIME, taille).
- [x] `GET /files/ebook/{bookId}/download` (vérif achat via order-service ; stub possible via `file.entitlement.stub`).
- [x] `DELETE /files/{fileId}`.

---

## Phase 6 — Commandes & panier (`/api/v1/orders/**`)

- [x] Panier : `POST /cart/add`, `DELETE /cart/{itemId}`, `GET /cart`.
- [x] `POST /orders`, `GET /orders`, `GET /orders/{id}`, `POST /orders/{id}/pay`, `POST /orders/{id}/cancel`.
- [x] `POST /orders/webhook` (stub dev).
- [x] `GET /orders/{id}/invoice` (texte stub).
- [x] Entitlements internes pour `reading-service` / `file-service` : `GET /api/v1/internal/entitlements/users/{userId}/books/{bookId}`.

---

## Phase 7 — Avis, auteurs, souhaits, notifications

- [x] Avis : `GET /books/{id}/reviews`, `POST /books/{id}/reviews`, `PUT/DELETE /reviews/{id}`, helpful, report.
- [x] Auteurs : `GET /authors`, `GET /authors/{id}`, `GET /authors/{id}/books`, `/authors/me/dashboard`, `/authors/me/stats`, `PUT /authors/me/profile`.
- [x] Liste de souhaits : `GET/POST/DELETE /wishlist`, `POST /wishlist/move-to-cart`.
- [x] Notifications : liste, marquer lu, préférences.

---

## Phase 8 — Administration (`/api/v1/admin/**`)

- [x] Dashboard, livres en attente (stub), proxy publication catalog.
- [ ] Utilisateurs admin, commandes, rapports, promotions, logs (selon périmètre V1) — hors socle actuel.

---

## Documentation & qualité

- [ ] OpenAPI à jour ; Swagger UI accessible.
- [ ] Tests unitaires / intégration sur modules critiques (auth, books, orders).
- [ ] Journalisation et gestion d’erreurs centralisée (`@ControllerAdvice`).

---

## Front Angular (`BookVault`) — après stabilisation API

- [ ] Remplacer les mocks (`BookService`, `AuthService`, etc.) par appels `HttpClient` vers `/api/v1`.
- [ ] Intercepteur JWT + refresh ; guards par rôle.

---
docker compose down -v
docker compose up -d --build
_Dernière mise à jour : api-gateway + ports services + proxy Angular /api/v1._
