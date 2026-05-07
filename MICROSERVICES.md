# BookVault — Documentation des micro-services

Ce fichier est mis à jour au fil de l’implémentation : pour chaque service, résumé fonctionnel, endpoints exposés, données et intégrations.  
**Légende de statut :** `TERMINÉ` | `EN COURS` | `À FAIRE`

---

## Table des matières

1. [api-gateway](#1-api-gateway) — `TERMINÉ` (routage)
2. [auth-service](#2-auth-service) — `TERMINÉ`
3. [user-service](#3-user-service) — `TERMINÉ`
4. [catalog-service](#4-catalog-service) — `TERMINÉ`
5. [file-service](#5-file-service) — `TERMINÉ`
6. [order-service](#6-order-service) — `TERMINÉ`
7. [review-service](#7-review-service) — `TERMINÉ`
8. [wishlist-service](#8-wishlist-service) — `TERMINÉ`
9. [notification-service](#9-notification-service) — `TERMINÉ`
10. [author-service](#10-author-service) — `TERMINÉ`
11. [admin-service](#11-admin-service) — `TERMINÉ`
12. [reading-service](#12-reading-service) — `TERMINÉ` (socle API)

---

## 1. api-gateway

**Port :** 8080 (défaut)  
**Rôle :** point d’entrée unique ; routage `spring.cloud.gateway.server.webmvc.routes` vers les backends ; CORS pour le front.  
**Config :** `api-gateway/src/main/resources/application.yml`.  
**Variables :** `AUTH_SERVICE_URI`, `USER_SERVICE_URI`, `CATALOG_SERVICE_URI`, etc.

---

## 2. auth-service

**Statut :** `TERMINÉ`  
**Port :** 8081  
**Base PostgreSQL (défaut) :** `bookvault_auth`

### Rôle métier

- Inscription / connexion avec **BCrypt** (force 12).
- Émission de **JWT d’accès** (HS256, claims `sub` = UUID utilisateur, `email`, `role`) et de **refresh tokens** opaques stockés en base (hash SHA-256).
- **Révocation :** liste noire des **jti** des access tokens à la déconnexion ; révocation des refresh (un jeton ou tous).
- Rôles : `USER`, `AUTHOR`, `ADMIN` — défaut à l’inscription : `USER`.
- **Non implémenté (501) :** `forgot-password`, `reset-password` (SMTP à brancher plus tard).

### Endpoints (`/api/v1/auth`)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| POST | `/register` | Création de compte + tokens |
| POST | `/login` | Connexion + tokens |
| POST | `/refresh` | Rotation refresh + nouvelle paire |
| POST | `/logout` | Authentifié ; body optionnel `{ "refreshToken" }` |
| GET | `/me` | Profil utilisateur |
| POST | `/forgot-password` | 501 |
| POST | `/reset-password` | 501 |

### Tables JPA

- `auth_users` — comptes
- `auth_refresh_tokens` — refresh (hash, expiration, révoqué)
- `auth_blacklisted_jti` — jti des access tokens invalidés

### Configuration partagée

- **`JWT_SECRET` / `auth.jwt.secret`** : même valeur que `reading-service` (`spring.security.oauth2.resourceserver.jwt.secret-key`) pour que les resource servers valident les mêmes JWT.

### Références

- `AuthController`, `AuthService`, `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig`

---

## 3. user-service

**Statut :** `TERMINÉ`  
**Port :** 8082  
**Base PostgreSQL (défaut) :** `bookvault_users`

### Rôle métier

- **Profil étendu** aligné sur l’identité **auth** : clé primaire = `userId` (claim JWT `sub`, UUID).
- **Resource server** : validation HS256 avec le même `JWT_SECRET` qu’**auth-service** / **reading-service** ; rôle issu du claim `role` → `ROLE_USER`, `ROLE_AUTHOR`, `ROLE_ADMIN`.
- **Bootstrap** : `POST /api/v1/users/bootstrap` crée une ligne `UserProfile` à partir du JWT (après inscription / premier appel), si elle n’existe pas encore.
- **Commandes / bibliothèque** : endpoints paginés renvoient des **pages vides** tant que **order-service** / agrégation ne sont pas branchés (placeholders documentés en OpenAPI).

### Endpoints (`/api/v1/users`)

| Méthode | Chemin | Accès | Description |
|---------|--------|-------|-------------|
| POST | `/bootstrap` | Authentifié | Création idempotente du profil |
| GET | `/` | ADMIN | Liste filtrée `role`, `active`, pagination |
| GET | `/{id}` | Propriétaire ou ADMIN | Détail profil |
| PUT | `/{id}` | Propriétaire ou ADMIN | Mise à jour (nom, bio, avatar, langue, newsletter) |
| DELETE | `/{id}` | Propriétaire ou ADMIN | Désactivation logique (`active=false`) |
| GET | `/{id}/orders` | Propriétaire ou ADMIN | Placeholder (page vide) |
| GET | `/{id}/library` | Propriétaire ou ADMIN | Placeholder (page vide) |
| PUT | `/{id}/role` | ADMIN | Change le rôle **dans ce service** — en production, synchroniser avec **auth-service**. |

### Table JPA

- `user_profiles` — email, noms, rôle métier (copie fonctionnelle), préférences lecteur, statut actif.

### Références

- `UserController`, `UserProfileService`, `UserProfile`, `SecurityConfig` (`JwtAuthenticationConverter` sur le claim `role`).

---

## 4. catalog-service

**Statut :** `TERMINÉ`  
**Port :** 8083  
**Base PostgreSQL (défaut) :** `bookvault_catalog`

### Rôle métier

- **Livres** : métadonnées, ISBN unique, formats `EBOOK` / `PHYSICAL` / `BOTH`, statuts `DRAFT` / `PUBLISHED` / `REJECTED`, liaison **plusieurs catégories**, compteur de **vues**, notes agrégées (`averageRating`, `reviewCount` — alimentés plus tard par **review-service**).
- **Visibilité** : catalogue public = **PUBLISHED** et non supprimé ; brouillons / fiches auteur visibles par **auteur** ou **ADMIN** uniquement.
- **Écriture** : création / édition **AUTHOR** ou **ADMIN** ; `authorUserId` dans le corps réservé à l’**ADMIN** (création pour un autre auteur).
- **Catégories** : arbre via `parent`, slug unique auto ; CRUD **ADMIN** ; suppression bloquée si livres ou sous-catégories liés.
- **Endpoints annexe** : `GET .../preview` renvoie un **stub** (URL signée = **file-service** plus tard) ; **recommandations** = stub type bestsellers tant que l’historique d’achat n’est pas branché.

### Tables JPA

- `catalog_books`, `catalog_categories`, `catalog_book_categories` (association).

### Références

- `BookController`, `CategoryController`, `BookCatalogService`, `CategoryCatalogService`, `BookSpecs`, `SecurityConfig` (JWT claim `role`).

---

## 4b. (note gateway)

Les avis sur `/api/v1/books/{id}/reviews` sont routés par la gateway vers **review-service**, pas ce module.

---

## 5. file-service

**Statut :** `TERMINÉ`  
**Port :** 8085  
**Base PostgreSQL (défaut) :** `bookvault_files`

### Rôle métier

- Stockage **sur disque local** (racine `file.storage.root`, ex. `~/bookvault-files`) avec métadonnées JPA (`stored_file`).
- Upload **e-book** / **couverture** : rôle **AUTHOR** ; **avatar** : utilisateur authentifié (claim `sub`).
- Téléchargement **e-book** : JWT + vérification des droits via **order-service** (`GET /api/v1/internal/entitlements/...`) ; variables `file.entitlement.stub` / `file.entitlement.fail-open` pour le dev (alignées sur le principe de `reading-service`).
- Couverture et avatar : lecture **publique** (`GET /cover/{bookId}`, `GET /avatar/{userId}`).
- Suppression : déposant ou **ADMIN**.

### Endpoints (`/api/v1/files`)

| Méthode | Chemin | Accès |
|---------|--------|--------|
| POST | `/upload/ebook` | AUTHOR (multipart `bookId`, `file`) |
| POST | `/upload/cover` | AUTHOR |
| POST | `/upload/avatar` | Authentifié |
| GET | `/ebook/{bookId}/download` | Authentifié + droit achat |
| GET | `/cover/{bookId}` | Public |
| GET | `/avatar/{userId}` | Public |
| DELETE | `/{fileId}` | Déposant ou ADMIN |

### Références

- `FileController`, `StoredFileService`, `LocalDiskStorage`, `OrderEntitlementClient`, `SecurityConfig`

---

## 6. order-service

**Statut :** `TERMINÉ`  
**Port :** 8084  
**Base PostgreSQL (défaut) :** `bookvault_order`

### Rôle métier

- **Panier** persistant par utilisateur (`cart_line`) ; prix et disponibilité via **catalog-service** (`order.catalog.base-url`) — livre **PUBLISHED** uniquement.
- **Commande** créée depuis le panier (`POST /orders`) ; états `PENDING` → paiement stub (`POST .../pay` → `PAID`) ; annulation si `PENDING`.
- **Webhook** PSP : stub (`POST /orders/webhook`, corps JSON libre, 204).
- **Facture** : texte brut (`GET /orders/{id}/invoice`).
- **Entitlements internes** (sans JWT, réseau de confiance) : `GET /api/v1/internal/entitlements/users/{userId}/books/{bookId}` → `{ "allowed": true/false }` si au moins une ligne de commande **PAID** / **SHIPPED** / **DELIVERED** pour ce livre.

### Endpoints principaux

| Zone | Méthode | Chemin | Description |
|------|---------|--------|-------------|
| Panier | GET | `/api/v1/cart` | Liste |
| Panier | POST | `/api/v1/cart/add` | Ajout / fusion ligne |
| Panier | DELETE | `/api/v1/cart/{itemId}` | Retrait |
| Commandes | POST | `/api/v1/orders` | Création depuis panier |
| Commandes | GET | `/api/v1/orders` | Paginé (utilisateur courant) |
| Commandes | GET | `/api/v1/orders/{id}` | Détail |
| Commandes | POST | `/api/v1/orders/{id}/pay` | Paiement mock |
| Commandes | POST | `/api/v1/orders/{id}/cancel` | Annulation |
| Commandes | GET | `/api/v1/orders/{id}/invoice` | Facture texte |
| Commandes | POST | `/api/v1/orders/webhook` | Webhook (public stub) |
| Interne | GET | `/api/v1/internal/entitlements/users/{userId}/books/{bookId}` | Droits lecture |

### Références

- `CartController`, `OrderController`, `InternalEntitlementController`, `CartService`, `OrderService`, `PurchaseEntitlementService`, `CatalogBookClient`, `SecurityConfig`

---

## 7. review-service

**Statut :** `TERMINÉ`  
**Port :** 8086  
**Base PostgreSQL (défaut) :** `bookvault_reviews`

### Rôle métier

- Avis **un par utilisateur et par livre** ; note 1–5, titre optionnel, texte ; badge **acheteur vérifié** si **order-service** confirme l’achat (`review.entitlement.stub` / `fail-open`, comme reading/file).
- **Utile** : vote alternable par lecteur (pas sur son propre avis).
- **Signalement** : une fois par paire (avis, rapporteur).

### Endpoints

| Zone | Méthode | Chemin | Accès |
|------|---------|--------|--------|
| Livre | GET | `/api/v1/books/{bookId}/reviews` | Public |
| Livre | POST | `/api/v1/books/{bookId}/reviews` | Authentifié |
| Avis | GET | `/api/v1/reviews/{id}` | Public |
| Avis | PUT/DELETE | `/api/v1/reviews/{id}` | Auteur ou ADMIN |
| Avis | POST | `/api/v1/reviews/{id}/helpful` | Authentifié |
| Avis | POST | `/api/v1/reviews/{id}/report` | Authentifié |

### Références

- `BookReviewsController`, `ReviewsRestController`, `ReviewService`, `OrderEntitlementClient`, `SecurityConfig`

---

## 8. wishlist-service

**Statut :** `TERMINÉ`  
**Port :** 8087  
**Base PostgreSQL (défaut) :** `bookvault_wishlist`

### Rôle métier

- Lignes **(userId, bookId)** uniques.
- **Transfert panier** : `POST /api/v1/wishlist/move-to-cart` appelle **order-service** `/api/v1/cart/add` pour chaque livre avec le **même en-tête `Authorization`** ; retire de la liste les lignes ajoutées avec succès.

### Endpoints (`/api/v1/wishlist`)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/` | Liste |
| POST | `/` | Body `{ "bookId" }` |
| DELETE | `/{bookId}` | Retrait |
| POST | `/move-to-cart` | Transfert (JWT requis) |

### Références

- `WishlistController`, `WishlistService`, `SecurityConfig`

---

## 9. notification-service

**Statut :** `TERMINÉ`  
**Port :** 8088  
**Base PostgreSQL (défaut) :** `bookvault_notifications`

### Rôle métier

- Notifications **in-app** (JPA) ; préférences par utilisateur (email / in-app / marketing).
- Pas de Kafka ni SMTP dans cette version (évolution possible).

### Endpoints (`/api/v1/notifications`)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/` | Paginé |
| PATCH | `/{id}/read` | Marquer lue |
| POST | `/read-all` | Tout lu |
| GET/PUT | `/preferences` | Préférences |

### Références

- `NotificationController`, `NotificationService`, `SecurityConfig`

---

## 10. author-service

**Statut :** `TERMINÉ`  
**Port :** 8091  
**Base PostgreSQL (défaut) :** `bookvault_authors`

### Rôle métier

- Profil public auteur (`penName`, `website`, `bio`) ; exposition des livres via **catalog-service** (`author.catalog.base-url`).
- **GET /authors** : page vide (annuaire à enrichir).
- Dashboard / stats : **stubs** avec messages d’orientation.

### Endpoints (`/api/v1/authors`)

| Méthode | Chemin | Accès |
|---------|--------|--------|
| GET | `/` | Public (vide) |
| GET | `/{authorId}` | Public |
| GET | `/{authorId}/books` | Public (JSON page Spring Data du catalogue) |
| GET | `/me/dashboard`, `/me/stats` | AUTHOR |
| PUT | `/me/profile` | AUTHOR |

### Références

- `AuthorController`, `AuthorService`, `CatalogBrowseClient`, `SecurityConfig`

---

## 11. admin-service

**Statut :** `TERMINÉ` (BFF sans base propre)  
**Port :** 8090

### Rôle métier

- Agrégation / **proxy** vers les autres APIs ; uniquement **ADMIN** (`@PreAuthorize` sur le contrôleur).
- Dashboard et file d’attente livres : **stubs** documentés.
- Publication : **proxy** `PATCH` vers **catalog-service** `/api/v1/books/{id}/publish` avec le JWT admin du client.

### Endpoints (`/api/v1/admin`)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/dashboard` | Compteurs stub |
| GET | `/books/pending` | Liste vide + message |
| POST | `/books/{bookId}/publish` | Query `publish=true/false`, proxy catalog |

### Références

- `AdminController`, `AdminFacadeService`, `RestClientConfig`, `SecurityConfig`

---

## 12. reading-service

**Statut :** `TERMINÉ` (socle)  
**Port :** 8095  
**Rôle :** progression e-book / audiobook, signets, annotations ; client HTTP vers **order-service** pour les droits ; pas de stockage des fichiers binaires.

**Détail :** voir code dans `reading-service/` et section correspondante dans `TASKS.md`.

---

_Mise à jour : review, wishlist, notification, author, admin implémentés._
