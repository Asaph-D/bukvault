# BookVault — Catalogue des attributs (dimensions & faits)

Document de référence BI : **chaque ligne nomme un attribut** (`camelCase`, comme dans le JSON des API). Les blocs « imbriqués » détaillent les sous-objets champ par champ. Les attributs **entrepôt** complètent le MCD lorsqu’ils ne sont pas encore exposés par une API.

---

## Index — analyses couvertes

| Code | Analyse métier | Attributs principaux |
|------|----------------|----------------------|
| **A1** | Inscriptions & profils utilisateurs | `id`, `email`, `firstName`, `lastName`, `createdAt`, `role`, `active`, `PlatformUserStatsResponse.*` |
| **A2** | Catalogue, publications, modération | `Book*`, `status`, `publishedAt`, `PlatformCatalogStatsResponse.*`, `pendingModeration` |
| **A3** | Ventes, panier, chiffre d’affaires | `OrderResponse.*`, `OrderLineResponse.*`, `CartLineResponse.*`, `AuthorStatsResponse.*` |
| **A4** | Conversion wishlist → panier | `WishlistItemResponse.*`, `MoveToCartResponse.*` |
| **A5** | Avis & satisfaction | `ReviewResponse.*`, `averageRating`, `reviewCount`, `HelpfulResponse.*` |
| **A6** | Engagement lecture | `ProgressResponse.*`, `BookmarkResponse.*`, `AnnotationResponse.*`, `PlatformReadingStatsResponse.*` |
| **A7** | Popularité & classements | `viewCount`, `TopAuthorViewsDto.*`, `AdminTopAuthorDto.*` |
| **A8** | Fichiers, couvertures, ebooks | `stored_file.*`, `FileUploadResponse.*`, `PreviewResponse.*`, téléchargement (entrepôt) |
| **A9** | Notifications & alertes livre | `NotificationResponse.*`, `PreferencesResponse.*`, `BookSubscriptionItemResponse.*` |
| **A10** | Communauté & messagerie | `HubResponse.*`, `ThreadResponse.*`, `EventResponse.*`, `MemberResponse.*`, `ChatMessageResponse.*` |
| **A11** | Droits d’accès (achat) | `EntitlementResponse.allowed` |
| **A12** | Tableau de bord admin / auteur | `AdminDashboardResponse.*`, `AuthorDashboardResponse.*`, `AuthorStatsResponse.*` |
| **A13** | Dimension temps | `dateKey`, `year`, `month`, … (entrepôt) + dérivation depuis `*At` |
| **A14** | Marge & stock (MCD, hors API V1) | `unitCost`, `stockQuantity`, `weightKg`, … (entrepôt) |

---

## Conventions

| Colonne | Signification |
|---------|---------------|
| **Attribut** | Nom exact du champ JSON ou colonne logique entrepôt |
| **Type** | Type logique (UUID, STRING, DECIMAL, ENUM, …) |
| **Source** | Service / DTO / `entrepôt` |
| **Analyses** | Codes A1–A14 utilisant l’attribut |

---

## 1. UTILISATEUR

### 1.1 `UserResponse` — auth-service (`GET /api/v1/auth/me`, corps de `AuthResponse.user`)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | auth-service | A1, A3, A5, A6 |
| `email` | STRING | auth-service | A1 |
| `firstName` | STRING | auth-service | A1 |
| `lastName` | STRING | auth-service | A1 |
| `role` | ENUM `USER` \| `AUTHOR` \| `ADMIN` | auth-service | A1, A12 |
| `active` | BOOLEAN | auth-service | A1 |
| `emailVerified` | BOOLEAN | auth-service | A1 |
| `createdAt` | TIMESTAMP | auth-service | A1, A13 |

### 1.2 `UserResponse` — user-service (`GET /api/v1/users/{id}`, liste admin)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | user-service | A1 |
| `email` | STRING | user-service | A1 |
| `firstName` | STRING | user-service | A1 |
| `lastName` | STRING | user-service | A1 |
| `role` | ENUM `USER` \| `AUTHOR` \| `ADMIN` | user-service | A1 |
| `active` | BOOLEAN | user-service | A1 |
| `bio` | STRING | user-service | A1, A10 |
| `avatarUrl` | STRING | user-service | A1 |
| `preferredLanguage` | STRING | user-service | A1 |
| `newsletter` | BOOLEAN | user-service | A1, A9 |
| `createdAt` | TIMESTAMP | user-service | A1, A13 |
| `updatedAt` | TIMESTAMP | user-service | A1, A13 |

### 1.3 `AuthResponse` — auth-service (login, register, refresh, Google)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `user` | OBJECT → §1.1 | auth-service | A1 |
| `user.id` | UUID | auth-service | A1 |
| `user.email` | STRING | auth-service | A1 |
| `user.firstName` | STRING | auth-service | A1 |
| `user.lastName` | STRING | auth-service | A1 |
| `user.role` | ENUM | auth-service | A1 |
| `user.active` | BOOLEAN | auth-service | A1 |
| `user.emailVerified` | BOOLEAN | auth-service | A1 |
| `user.createdAt` | TIMESTAMP | auth-service | A1 |
| `accessToken` | STRING | auth-service | — |
| `refreshToken` | STRING | auth-service | — |
| `expiresIn` | LONG (secondes) | auth-service | — |
| `tokenType` | STRING (`Bearer`) | auth-service | — |
| `emailVerificationRequired` | BOOLEAN | auth-service | A1 |

### 1.4 Auth — attributs base (`auth_users`, ETL, non tous dans `UserResponse`)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `authProvider` | ENUM `LOCAL` \| `GOOGLE` | auth-service (BDD) | A1 |
| `googleSub` | STRING | auth-service (BDD) | A1 |
| `termsAcceptedAt` | TIMESTAMP | auth-service (BDD) | A1 |

### 1.5 `ReaderSettingsResponse` — user-service (`GET/PUT /api/v1/users/{id}/reader-settings`)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `theme` | ENUM `LIGHT` \| `DARK` \| `SYSTEM` | user-service | A6 |
| `uiDensity` | ENUM `COMFORTABLE` \| `COMPACT` | user-service | A6 |
| `localeOverride` | STRING | user-service | A1 |
| `notifyOrders` | BOOLEAN | user-service | A9 |
| `notifyPromotions` | BOOLEAN | user-service | A9 |
| `notifySocial` | BOOLEAN | user-service | A9 |
| `communityVisibility` | ENUM `PUBLIC` \| `MEMBERS_ONLY` \| `PRIVATE` | user-service | A10 |
| `allowDirectMessages` | BOOLEAN | user-service | A10 |
| `readerHomeDefault` | ENUM `OVERVIEW` \| `CONTINUE` \| `DISCOVER` | user-service | A6 |
| `libraryShowProgress` | BOOLEAN | user-service | A6 |
| `reduceMotion` | BOOLEAN | user-service | A6 |
| `updatedAt` | TIMESTAMP | user-service | A13 |

### 1.6 `LibraryItemResponse` — user-service (`GET /api/v1/users/{id}/library`, placeholder)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `bookId` | UUID | user-service | A6, A11 |
| `title` | STRING | user-service | A6 |

### 1.7 `PlatformUserStatsResponse` — user-service (stats plateforme)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `totalUsers` | LONG | user-service | A1, A12 |
| `newUsersLast30Days` | LONG | user-service | A1, A12 |
| `newUsersPrevious30Days` | LONG | user-service | A1, A12 |
| `registrationsByDay` | ARRAY | user-service | A1, A13 |
| `registrationsByDay[].label` | STRING | user-service | A13 |
| `registrationsByDay[].count` | LONG | user-service | A1, A13 |

### 1.8 Utilisateur — attributs entrepôt (MCD / analyses non couvertes par l’API)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `country` | STRING | entrepôt | A1 |
| `city` | STRING | entrepôt | A1 |
| `lastLoginAt` | TIMESTAMP | entrepôt | A1, A13 |

---

## 2. LIVRE — catalogue

### 2.1 `BookListItemResponse` — catalog-service (listes, bestsellers, mine)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | catalog-service | A2, A3, A5, A7 |
| `title` | STRING | catalog-service | A2, A7 |
| `isbn` | STRING | catalog-service | A2 |
| `authorId` | UUID | catalog-service | A2, A7, A12 |
| `price` | DECIMAL | catalog-service | A3, A14 |
| `language` | STRING | catalog-service | A2 |
| `format` | ENUM `EBOOK` \| `PHYSICAL` \| `BOTH` | catalog-service | A2, A3, A8 |
| `status` | ENUM `DRAFT` \| `PUBLISHED` \| `REJECTED` | catalog-service | A2, A12 |
| `coverUrl` | STRING | catalog-service | A2, A8 |
| `averageRating` | DECIMAL | catalog-service | A5, A7 |
| `reviewCount` | INT | catalog-service | A5, A7 |
| `viewCount` | LONG | catalog-service | A2, A7 |
| `publishedAt` | TIMESTAMP | catalog-service | A2, A13 |
| `createdAt` | TIMESTAMP | catalog-service | A2, A13 |

### 2.2 `BookDetailResponse` — catalog-service (`GET /api/v1/books/{id}`)

Tous les attributs de §2.1, plus :

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `description` | STRING | catalog-service | A2 |
| `deleted` | BOOLEAN | catalog-service | A2 |
| `updatedAt` | TIMESTAMP | catalog-service | A2, A13 |
| `categories` | ARRAY | catalog-service | A2, A7 |
| `categories[].id` | UUID | catalog-service | A2 |
| `categories[].name` | STRING | catalog-service | A2, A7 |
| `categories[].slug` | STRING | catalog-service | A2 |

### 2.3 `CategorySummaryResponse` (élément de `BookDetailResponse.categories`)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | catalog-service | A2 |
| `name` | STRING | catalog-service | A2, A7 |
| `slug` | STRING | catalog-service | A2 |

### 2.4 `CreateBookRequest` / `UpdateBookRequest` — écriture catalogue

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `isbn` | STRING | catalog-service | A2 |
| `title` | STRING | catalog-service | A2 |
| `description` | STRING | catalog-service | A2 |
| `price` | DECIMAL | catalog-service | A3, A14 |
| `language` | STRING | catalog-service | A2 |
| `format` | ENUM | catalog-service | A2 |
| `categoryIds` | ARRAY\<UUID\> | catalog-service | A2 |
| `coverUrl` | STRING | catalog-service | A8 |
| `authorUserId` | UUID (ADMIN) | catalog-service | A2, A12 |

### 2.5 `PublishBookRequest` — `PATCH /api/v1/books/{id}/publish`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `publish` | BOOLEAN | catalog-service | A2 |

### 2.6 `PreviewResponse` — `GET /api/v1/books/{id}/preview`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `signedUrl` | STRING | catalog-service | A8 |
| `expiresAt` | TIMESTAMP | catalog-service | A8, A13 |
| `note` | STRING | catalog-service | A8 |

### 2.7 `PlatformCatalogStatsResponse` — stats catalogue

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `publishedBooks` | LONG | catalog-service | A2, A12 |
| `newPublishedLast30Days` | LONG | catalog-service | A2, A12 |
| `newPublishedPrevious30Days` | LONG | catalog-service | A2, A12 |
| `pendingModeration` | LONG | catalog-service | A2, A12 |
| `totalViews` | LONG | catalog-service | A7, A12 |
| `viewsLast30Days` | LONG | catalog-service | A7, A12 |
| `viewsPrevious30Days` | LONG | catalog-service | A7, A12 |
| `categoryShares` | ARRAY | catalog-service | A2, A7 |
| `categoryShares[].name` | STRING | catalog-service | A7 |
| `categoryShares[].views` | LONG | catalog-service | A7 |
| `categoryShares[].pct` | INT | catalog-service | A7 |
| `topAuthors` | ARRAY | catalog-service | A7, A12 |
| `topAuthors[].authorUserId` | UUID | catalog-service | A7, A12 |
| `topAuthors[].totalViews` | LONG | catalog-service | A7 |

### 2.8 Livre numérique — fichier ebook (`stored_file`, `kind` = `EBOOK`)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | BIGINT | file-service | A8 |
| `bookId` | UUID | file-service | A8 |
| `kind` | ENUM `EBOOK` | file-service | A8 |
| `storageKey` | STRING | file-service | A8 |
| `mimeType` | STRING | file-service | A8 |
| `sizeBytes` | LONG | file-service | A8 |
| `originalFilename` | STRING | file-service | A8 |
| `uploadedBy` | UUID | file-service | A8 |
| `createdAt` | TIMESTAMP | file-service | A8, A13 |

### 2.9 Livre physique — attributs entrepôt (MCD, non API catalogue V1)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `stockQuantity` | INT | entrepôt | A3, A14 |
| `weightKg` | DECIMAL | entrepôt | A3 |
| `widthCm` | DECIMAL | entrepôt | A3 |
| `heightCm` | DECIMAL | entrepôt | A3 |
| `depthCm` | DECIMAL | entrepôt | A3 |
| `shippingClass` | STRING | entrepôt | A3 |

### 2.10 Livre — attributs entrepôt complémentaires

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `unitCost` | DECIMAL | entrepôt | A14 |
| `editorId` | UUID | entrepôt | A2, A14 |
| `drmEnabled` | BOOLEAN | entrepôt | A8 |

---

## 3. CATEGORIE

### 3.1 `CategoryResponse` — catalog-service

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | catalog-service | A2, A7 |
| `name` | STRING | catalog-service | A2, A7 |
| `slug` | STRING | catalog-service | A2 |
| `description` | STRING | catalog-service | A2 |
| `parentId` | UUID | catalog-service | A2 |
| `displayOrder` | INT | catalog-service | A2 |
| `iconUrl` | STRING | catalog-service | A2 |
| `bookCount` | LONG | catalog-service | A2, A7 |

### 3.2 `UpsertCategoryRequest` — CRUD admin

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `name` | STRING | catalog-service | A2 |
| `slug` | STRING | catalog-service | A2 |
| `description` | STRING | catalog-service | A2 |
| `parentId` | UUID | catalog-service | A2 |
| `displayOrder` | INT | catalog-service | A2 |
| `iconUrl` | STRING | catalog-service | A2 |

---

## 4. AUTEUR

### 4.1 `AuthorPublicProfileResponse` — author-service

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `authorId` | UUID | author-service | A2, A7, A12 |
| `penName` | STRING | author-service | A7, A12 |
| `website` | STRING | author-service | A12 |
| `bio` | STRING | author-service | A12 |
| `publishedBooksEstimate` | LONG | author-service | A2, A12 |

### 4.2 `AuthorDashboardResponse` — `GET /api/v1/authors/me/dashboard`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `publishedBooksEstimate` | LONG | author-service | A12 |
| `draftBooksEstimate` | LONG | author-service | A12 |
| `hint` | STRING | author-service | A12 |

### 4.3 `AuthorStatsResponse` — `GET /api/v1/authors/me/stats`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `totalSalesEstimate` | LONG | author-service | A3, A12 |
| `revenueEstimate` | DECIMAL | author-service | A3, A12, A14 |
| `note` | STRING | author-service | A12 |

### 4.4 Auteur — jointure profil utilisateur (pour analyses démographiques auteur)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `firstName` | STRING | user-service (jointure) | A12 |
| `lastName` | STRING | user-service (jointure) | A12 |
| `avatarUrl` | STRING | user-service (jointure) | A12 |

---

## 5. EDITEUR (entrepôt — hors API V1)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `editorId` | UUID | entrepôt | A2, A14 |
| `name` | STRING | entrepôt | A2 |
| `country` | STRING | entrepôt | A2 |
| `website` | STRING | entrepôt | A2 |
| `foundedYear` | INT | entrepôt | A2 |

---

## 6. FICHIER (file-service)

### 6.1 Entité `stored_file` (tous les `kind`)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | BIGINT | file-service | A8 |
| `originalFilename` | STRING | file-service | A8 |
| `kind` | ENUM `EBOOK` \| `COVER` \| `AVATAR` | file-service | A8 |
| `mimeType` | STRING | file-service | A8 |
| `sizeBytes` | LONG | file-service | A8 |
| `storageKey` | STRING | file-service | A8 |
| `bookId` | UUID | file-service | A8 |
| `ownerUserId` | UUID | file-service | A8 |
| `uploadedBy` | UUID | file-service | A8 |
| `createdAt` | TIMESTAMP | file-service | A8, A13 |

### 6.2 `FileUploadResponse` — réponse upload

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | LONG | file-service | A8 |
| `bookId` | UUID | file-service | A8 |
| `mimeType` | STRING | file-service | A8 |
| `sizeBytes` | LONG | file-service | A8 |

---

## 7. DATE (dimension calendrier entrepôt)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `dateKey` | INT (YYYYMMDD) | entrepôt | A13 |
| `fullDate` | DATE | entrepôt | A13 |
| `year` | INT | entrepôt | A13 |
| `quarter` | INT | entrepôt | A13 |
| `month` | INT | entrepôt | A13 |
| `monthName` | STRING | entrepôt | A13 |
| `week` | INT | entrepôt | A13 |
| `dayOfMonth` | INT | entrepôt | A13 |
| `dayOfWeek` | INT | entrepôt | A13 |
| `dayName` | STRING | entrepôt | A13 |
| `isWeekend` | BOOLEAN | entrepôt | A13 |
| `isHoliday` | BOOLEAN | entrepôt | A13 |

**Champs source pour dériver la dimension date :** `createdAt`, `updatedAt`, `publishedAt`, `addedAt`, `subscribedAt`, `serverUpdatedAt`, `clientUpdatedAt`, `startsAt`, `expiresAt`, `registrationsByDay[].label`, `readsByDayLabels[]`.

---

## 8. COMMANDE

### 8.1 `OrderResponse` — order-service

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | LONG | order-service | A3, A13 |
| `userId` | UUID | order-service | A3 |
| `status` | ENUM `PENDING` \| `PAID` \| `SHIPPED` \| `DELIVERED` \| `CANCELLED` | order-service | A3 |
| `totalAmount` | DECIMAL | order-service | A3, A12, A14 |
| `currency` | STRING | order-service | A3 |
| `paymentReference` | STRING | order-service | A3, §10 |
| `createdAt` | TIMESTAMP | order-service | A3, A13 |
| `updatedAt` | TIMESTAMP | order-service | A3, A13 |
| `lines` | ARRAY | order-service | A3 |
| `lines[].id` | LONG | order-service | A3 |
| `lines[].bookId` | UUID | order-service | A3 |
| `lines[].quantity` | INT | order-service | A3 |
| `lines[].unitPrice` | DECIMAL | order-service | A3, A14 |
| `lines[].format` | STRING | order-service | A3 |
| `lines[].lineTotal` | DECIMAL | order-service | A3, A14 |

### 8.2 `OrderLineResponse` (objet autonome, même structure que `lines[]`)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | LONG | order-service | A3 |
| `bookId` | UUID | order-service | A3 |
| `quantity` | INT | order-service | A3 |
| `unitPrice` | DECIMAL | order-service | A3 |
| `format` | STRING | order-service | A3 |
| `lineTotal` | DECIMAL | order-service | A3 |

### 8.3 `OrderSummaryResponse` — user-service (placeholder historique commandes)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | user-service | A3 |
| `status` | STRING | user-service | A3 |

### 8.4 Commande — attributs entrepôt (MCD)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `shippingAddressLine1` | STRING | entrepôt | A3 |
| `shippingAddressLine2` | STRING | entrepôt | A3 |
| `shippingCity` | STRING | entrepôt | A3 |
| `shippingPostalCode` | STRING | entrepôt | A3 |
| `shippingCountry` | STRING | entrepôt | A3 |

---

## 9. PANIER

### 9.1 `CartLineResponse` — order-service (`GET /api/v1/cart`)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | LONG | order-service | A3, A4 |
| `bookId` | UUID | order-service | A3, A4 |
| `quantity` | INT | order-service | A3, A4 |
| `unitPrice` | DECIMAL | order-service | A3, A4 |
| `format` | STRING | order-service | A3, A4 |
| `lineTotal` | DECIMAL | order-service | A3, A4 |

### 9.2 Panier — attributs entrepôt (analyse abandon)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `userId` | UUID | order-service (BDD `cart_line`) | A3, A4 |
| `cartUpdatedAt` | TIMESTAMP | entrepôt | A4, A13 |

---

## 10. PAIEMENT

### 10.1 Attributs API (via commande)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `paymentReference` | STRING | order-service (`OrderResponse`) | A3 |

### 10.2 Paiement — attributs entrepôt (MCD, PSP futur)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `paymentId` | UUID | entrepôt | A3 |
| `orderId` | LONG | entrepôt | A3 |
| `amount` | DECIMAL | entrepôt | A3, A14 |
| `currency` | STRING | entrepôt | A3 |
| `paymentMethod` | ENUM `CARD` \| `PAYPAL` \| `MOBILE_MONEY` \| … | entrepôt | A3 |
| `paymentStatus` | ENUM `PENDING` \| `SUCCEEDED` \| `FAILED` \| `REFUNDED` | entrepôt | A3 |
| `paidAt` | TIMESTAMP | entrepôt | A3, A13 |
| `providerTransactionId` | STRING | entrepôt | A3 |

---

## 11. TELECHARGEMENT (entrepôt — logs file-service)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `downloadId` | BIGINT | entrepôt | A8 |
| `userId` | UUID | entrepôt | A8 |
| `bookId` | UUID | entrepôt | A8 |
| `fileId` | BIGINT | entrepôt | A8 |
| `downloadedAt` | TIMESTAMP | entrepôt | A8, A13 |
| `bytesTransferred` | LONG | entrepôt | A8 |
| `clientIp` | STRING | entrepôt | A8 |
| `userAgent` | STRING | entrepôt | A8 |
| `success` | BOOLEAN | entrepôt | A8 |

---

## 12. AVIS

### 12.1 `ReviewResponse` — review-service

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | LONG | review-service | A5 |
| `bookId` | UUID | review-service | A5 |
| `userId` | UUID | review-service | A5 |
| `rating` | INT (1–5) | review-service | A5 |
| `title` | STRING | review-service | A5 |
| `body` | STRING | review-service | A5 |
| `verifiedPurchase` | BOOLEAN | review-service | A5 |
| `helpfulCount` | LONG | review-service | A5 |
| `createdAt` | TIMESTAMP | review-service | A5, A13 |
| `updatedAt` | TIMESTAMP | review-service | A5, A13 |

### 12.2 `HelpfulResponse` — `POST /api/v1/reviews/{id}/helpful`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `helpfulCount` | LONG | review-service | A5 |
| `markedByMe` | BOOLEAN | review-service | A5 |

### 12.3 Modération avis — stats & entrepôt

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `openReports` | LONG | review-service (`PlatformReviewStatsResponse`) | A2, A12 |

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `reportId` | LONG | entrepôt (BDD `review_report`) | A2 |
| `reviewId` | LONG | entrepôt | A2 |
| `reporterId` | UUID | entrepôt | A2 |
| `reportReason` | STRING | entrepôt | A2 |
| `reportedAt` | TIMESTAMP | entrepôt | A2, A13 |

---

## 13. LISTE DE SOUHAITS

### 13.1 `WishlistItemResponse` — wishlist-service

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | LONG | wishlist-service | A4 |
| `bookId` | UUID | wishlist-service | A4 |
| `addedAt` | TIMESTAMP | wishlist-service | A4, A13 |

### 13.2 Wishlist — attribut ETL (JWT / BDD)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `userId` | UUID | wishlist-service (BDD, non dans DTO) | A4 |

### 13.3 `MoveToCartResponse` — `POST /api/v1/wishlist/move-to-cart`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `addedToCart` | ARRAY\<UUID\> | wishlist-service | A4 |
| `errors` | ARRAY\<STRING\> | wishlist-service | A4 |

---

## 14. NOTIFICATIONS & ALERTES LIVRE

### 14.1 `NotificationResponse` — notification-service

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | LONG | notification-service | A9 |
| `kind` | ENUM `ORDER` \| `PROMO` \| `SYSTEM` \| `REVIEW` \| `SOCIAL` \| `BOOK` | notification-service | A9 |
| `title` | STRING | notification-service | A9 |
| `message` | STRING | notification-service | A9 |
| `actionUrl` | STRING | notification-service | A9 |
| `read` | BOOLEAN | notification-service | A9 |
| `createdAt` | TIMESTAMP | notification-service | A9, A13 |

### 14.2 `PreferencesResponse` — préférences notification

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `emailEnabled` | BOOLEAN | notification-service | A9 |
| `inAppEnabled` | BOOLEAN | notification-service | A9 |
| `marketingEnabled` | BOOLEAN | notification-service | A9 |

### 14.3 `BookSubscriptionItemResponse` — alertes livre

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `bookId` | UUID | notification-service | A9 |
| `subscribedAt` | TIMESTAMP | notification-service | A9, A13 |

### 14.4 `SubscriptionStatusResponse` — `GET .../subscriptions/books/{bookId}`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `subscribed` | BOOLEAN | notification-service | A9 |

### 14.5 Alerte livre — attribut ETL

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `userId` | UUID | notification-service (BDD, non dans DTO) | A9 |

### 14.6 Abonnement SaaS lecteur (entrepôt — hors microservices actuels)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `subscriptionPlan` | STRING | entrepôt | A9 |
| `subscriptionStartedAt` | TIMESTAMP | entrepôt | A9, A13 |
| `subscriptionExpiresAt` | TIMESTAMP | entrepôt | A9, A13 |
| `subscriptionStatus` | ENUM `ACTIVE` \| `EXPIRED` \| `CANCELLED` | entrepôt | A9 |

---

## 15. PROGRES, SIGNETS, ANNOTATIONS (reading-service)

### 15.1 `ProgressResponse` — `GET/PUT /api/v1/reading/progress`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `bookId` | UUID | reading-service | A6 |
| `mediaType` | ENUM `EBOOK` \| `AUDIOBOOK` | reading-service | A6 |
| `positionJson` | STRING (JSON) | reading-service | A6 |
| `deviceId` | STRING | reading-service | A6 |
| `serverUpdatedAt` | TIMESTAMP | reading-service | A6, A13 |
| `clientUpdatedAt` | TIMESTAMP | reading-service | A6, A13 |

### 15.2 Champs usuels **dans** `positionJson` (dérivés ETL, non champs API séparés)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `percent` | DECIMAL | dérivé de `positionJson` | A6 |
| `page` | INT | dérivé de `positionJson` | A6 |
| `chapter` | INT | dérivé de `positionJson` | A6 |
| `offsetCfi` | STRING | dérivé de `positionJson` | A6 |
| `audioSeconds` | INT | dérivé de `positionJson` | A6 |

### 15.3 Progression — clé composite BDD (`reading_progress`, ETL)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `userId` | UUID | reading-service (BDD) | A6 |
| `bookId` | UUID | reading-service (BDD) | A6 |
| `mediaType` | ENUM | reading-service (BDD) | A6 |

### 15.4 `BookmarkResponse`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | reading-service | A6 |
| `bookId` | UUID | reading-service | A6 |
| `anchorJson` | STRING (JSON) | reading-service | A6 |
| `label` | STRING | reading-service | A6 |
| `createdAt` | TIMESTAMP | reading-service | A6, A13 |

### 15.5 `AnnotationResponse`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | reading-service | A6 |
| `bookId` | UUID | reading-service | A6 |
| `anchorJson` | STRING (JSON) | reading-service | A6 |
| `body` | STRING | reading-service | A6 |
| `createdAt` | TIMESTAMP | reading-service | A6, A13 |
| `updatedAt` | TIMESTAMP | reading-service | A6, A13 |

### 15.6 `PlatformReadingStatsResponse`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `readsByDay` | ARRAY | reading-service | A6, A12 |
| `readsByDay[].label` | STRING | reading-service | A13 |
| `readsByDay[].count` | LONG | reading-service | A6, A7 |
| `activityByWeekday` | ARRAY | reading-service | A6, A12 |
| `activityByWeekday[].label` | STRING | reading-service | A13 |
| `activityByWeekday[].count` | LONG | reading-service | A6 |

---

## 16. DROIT D’ACCÈS (achat / bibliothèque)

### 16.1 `EntitlementResponse` — order-service (interne + lecture/fichiers)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `allowed` | BOOLEAN | order-service | A11 |

---

## 17. TABLEAU DE BORD ADMIN

### 17.1 `AdminDashboardResponse` — admin-service

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `kpis` | ARRAY | admin-service | A12 |
| `kpis[].label` | STRING | admin-service | A12 |
| `kpis[].value` | LONG | admin-service | A12 |
| `kpis[].delta` | STRING | admin-service | A12 |
| `kpis[].up` | BOOLEAN | admin-service | A12 |
| `kpis[].severity` | STRING | admin-service | A12 |
| `readsByDay` | ARRAY\<LONG\> | admin-service | A6, A7 |
| `readsByDayLabels` | ARRAY\<STRING\> | admin-service | A13 |
| `totalReads` | LONG | admin-service | A6, A7 |
| `categoryShares` | ARRAY | admin-service | A7 |
| `categoryShares[].name` | STRING | admin-service | A7 |
| `categoryShares[].pct` | INT | admin-service | A7 |
| `categoryShares[].color` | STRING | admin-service | A7 |
| `topAuthors` | ARRAY | admin-service | A7, A12 |
| `topAuthors[].name` | STRING | admin-service | A12 |
| `topAuthors[].reads` | STRING | admin-service | A7 |
| `topAuthors[].load` | INT | admin-service | A12 |
| `activityByWeekday` | ARRAY\<LONG\> | admin-service | A6 |
| `activityWeekdayLabels` | ARRAY\<STRING\> | admin-service | A13 |
| `pendingModeration` | LONG | admin-service | A2, A12 |
| `openReports` | LONG | admin-service | A2, A5 |
| `note` | STRING | admin-service | A12 |

### 17.2 `PendingBooksResponse` — file d’attente modération

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `content` | ARRAY | admin-service | A2 |
| `message` | STRING | admin-service | A2 |

---

## 18. COMMUNAUTÉ (community-service)

### 18.1 `HubResponse`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `activeReaders` | INT | community-service | A10 |
| `openSalons` | INT | community-service | A10 |
| `tagline` | STRING | community-service | A10 |

### 18.2 `ThreadResponse`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | community-service | A10 |
| `title` | STRING | community-service | A10 |
| `channel` | STRING | community-service | A10 |
| `users` | INT | community-service | A10 |
| `hot` | BOOLEAN | community-service | A10 |
| `last` | STRING | community-service | A10 |

### 18.3 `EventResponse`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | community-service | A10 |
| `title` | STRING | community-service | A10 |
| `when` | STRING (JSON `when`) | community-service | A10 |
| `tag` | STRING | community-service | A10 |
| `startsAt` | TIMESTAMP | community-service | A10, A13 |

### 18.4 `MemberResponse`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | community-service | A10 |
| `email` | STRING | community-service | A10 |
| `displayName` | STRING | community-service | A10 |
| `role` | STRING | community-service | A10 |
| `bio` | STRING | community-service | A10 |

### 18.5 `BuddyResponse`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | community-service | A10 |
| `name` | STRING | community-service | A10 |
| `reading` | STRING | community-service | A10 |
| `match` | INT | community-service | A10 |

### 18.6 `ConversationSummaryResponse`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | community-service | A10 |
| `peerUserId` | UUID | community-service | A10 |
| `lastMessagePreview` | STRING | community-service | A10 |
| `updatedAt` | TIMESTAMP | community-service | A10, A13 |

### 18.7 `ChatMessageResponse`

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `id` | UUID | community-service | A10 |
| `senderId` | UUID | community-service | A10 |
| `content` | STRING | community-service | A10 |
| `createdAt` | TIMESTAMP | community-service | A10, A13 |

### 18.8 `LikeStatusResponse` — like livre (community-service)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `liked` | BOOLEAN | community-service | A10 |
| `likeCount` | LONG | community-service | A10 |

---

## 19. PAGINATION (listes API Spring)

| Attribut | Type | Source | Analyses |
|----------|------|--------|----------|
| `content` | ARRAY | Spring `Page` | toutes listes |
| `totalElements` | LONG | Spring `Page` | toutes listes |
| `totalPages` | INT | Spring `Page` | toutes listes |
| `size` | INT | Spring `Page` | toutes listes |
| `number` | INT | Spring `Page` | toutes listes |

---

## 20. Correspondance ancien modèle BI → attributs actuels

| Ancien attribut BI | Attribut(s) actuel(s) |
|--------------------|------------------------|
| `id_utilisateur` | `id` |
| `nom` | `lastName` |
| `prenom` | `firstName` |
| `date_inscription` | `createdAt` |
| `statut` (ACTIF/INACTIF) | `active` |
| `id_livre` | `id` (livre) |
| `titre` | `title` |
| `vues` | `viewCount` |
| `note_moyenne` | `averageRating` |
| `nb_avis` | `reviewCount` |
| `id_auteur` | `authorId` |
| `id_categorie` | `categories[].id` ou `categoryIds[]` |
| `id_commande` | `id` (commande) |
| `montant_total` | `totalAmount` |
| `id_ligne_commande` | `lines[].id` ou `id` (ligne) |
| `prix_unitaire` | `unitPrice` |
| `note` (avis) | `rating` |
| `commentaire` | `body` (+ `title`) |
| `est_acheteur_verifie` | `verifiedPurchase` |
| `date_ajout` (wishlist) | `addedAt` |
| `page_derniere_lue` | `positionJson` → `page` |
| `pourcentage_lu` | `positionJson` → `percent` |
| `type_fichier` | `kind` |
| `uri` | `storageKey` ou `coverUrl` |
| `taille` | `sizeBytes` |
| `date_commande` | `createdAt` (commande) |
| `mode_paiement` | `paymentMethod` (entrepôt) ou `paymentReference` (API) |

---

*Dernière revue : alignement sur les DTOs Java et `BookVault/src/app/models/api.types.ts`. Attributs `entrepôt` = MCD ou analyses non encore exposées en REST.*


