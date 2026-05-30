# BookVault — Front Angular & intégration API

Suivi des travaux côté `BookVault/` (Angular) avec la gateway `http://localhost:8080` et le préfixe `/api/v1`.

---

## Architecture (validée pour la V1)

| Élément | Rôle |
|--------|------|
| `environment.ts` | `apiUrl: '/api/v1'` — en dev, `proxy.conf.json` envoie `/api` vers la gateway. |
| `auth.interceptor.ts` | Ajoute `Authorization: Bearer` sauf sur `login` / `register` / `refresh`. |
| `auth.service.ts` | Tokens `bookvault_access` / `bookvault_refresh`, appels réels `auth-service`. |
| `book.service.ts` | Catalogue : liste, détail, recherche, filtres, catégories. |
| `author.service.ts` | Profils publics + liste paginée + dashboard/stats auteur. |
| `cart.service.ts` | Panier `order-service` (JWT requis) + `cartCount$`. |
| `reading.service.ts` | Progression lecture (`reading-service`). |
| `file.service.ts` | Upload/download ebook/cover (entitlements via `order-service`). |
| `ui-toast.service.ts` | Toasts PrimeNG homogènes (succès / erreur). |

Pages lazy-loadées, composants **standalone**, navigation alignée sur le header (accueil, catégories, bestsellers, auteurs, à propos, contact, panier).

---

## Checklist d’intégration

### Auth
- [x] Connexion / inscription réelles (`POST /auth/login`, `POST /auth/register`).
- [x] Mot de passe inscription ≥ 8 caractères (aligné backend).
- [x] Session restaurée via `GET /auth/me` si access token valide.
- [x] Déconnexion `POST /auth/logout` avec refresh optionnel.
- [x] **Refresh token** : interceptor 401 → `POST /auth/refresh` puis retry (`auth.interceptor.ts` + `AuthRefreshCoordinator`).
- [x] **Google OAuth** : volontairement désactivé si `googleClientId` absent — message d’erreur UI login/register (`GoogleAuthService.isAvailable()`).

### Catalogue & auteurs
- [x] Liste catalogue, bestsellers, détail livre (nom d’auteur via `author-service`).
- [x] Catégories liste + livres par `slug` → `categoryId`.
- [x] Liste auteurs + fiche auteur + livres `GET /books?authorId=`.
- [x] **Avis** : `review-service` — liste + création sur l’onglet « Avis » de la fiche livre (`ReviewService`).
- [x] **Création / édition livre** (auteur) : wizard `author-upload-page` → `POST /books`, `PUT /books/{id}`, upload fichiers, `submit-for-review` ; gestion depuis `author-works` (publier / dépublier / supprimer).

### Panier & commandes
- [x] Panier connecté `GET/POST/DELETE /cart**`.
- [x] Ajustement quantités (workaround delete + re-add pour diminuer).
- [x] **Checkout** : `POST /orders` puis `POST /orders/{id}/pay` depuis la page paiement → confirmation avec détail commande.
- [x] **Badge panier** : `CartService.cartCount$` mis à jour après add/remove et au login.

### Lecture & fichiers
- [x] **Lecteur** : manuscrit via `file-service` (`GET /files/ebook/{id}/download`, entitlement) ; progression synchronisée via `reading-service` (`PUT /reading/progress/{bookId}`) depuis la fiche livre.
- [x] **Téléchargement e-book sécurisé** : lien téléchargement sur fiche livre (JWT + droits achat vérifiés côté `file-service`).

### Utilisateur & admin
- [x] **Profil utilisateur** `user-service` : page dashboard `DashboardAccountProfileComponent` (`GET/PUT /users/{id}`, reader-settings, bootstrap après inscription).
- [x] **Dashboard auteur** vs API : `GET /authors/me/dashboard` + `/authors/me/stats` — ventes agrégées via `order-service` (`POST /internal/sales/aggregate`).
- [x] **admin-service** : exposé uniquement sous `/dashboard/admin/*` (guard rôle), pas dans le front grand public.

### Qualité
- [x] **Tests unitaires services** (mocks HTTP) : `npm test` — specs `cart`, `order`, `review`, `reading`, `author`.
- [x] **Gestion d’erreurs API homogène** : toasts PrimeNG (`UiToastService` + `<p-toast>`) ; plus d’`alert()` (checkout).
- [x] **Accessibilité et i18n** : hors périmètre V1 (non demandé) — base HTML sémantique + labels existants ; pas de `@angular/localize` pour l’instant.

---

## Prérequis locaux

1. Gateway **8080**, services nécessaires selon parcours (au minimum : **auth**, **catalog**, **order** pour panier, **author** pour noms sur fiche détail ; **review**, **reading**, **file** pour avis/lecture).
2. Front : `npm install` puis `ng serve` (proxy déjà configuré dans `angular.json`).
3. Tests : `npm test` (Karma + ChromeHeadless).

---

## Notes

- **author-service** écoute en **8091** par défaut (éviter conflit avec Jenkins sur 8089) — la gateway utilise `AUTHOR_SERVICE_URI` / défaut `8091`.
- **Navigation dashboard** : depuis `/dashboard/*`, le header et les liens internes restent dans le dashboard (pas de renvoi vers `/books` ou `/categories` publics).
- Les routes **upload**, **wishlist**, **notifications** réelles sont branchées sur les écrans dashboard existants (auteur upload, favoris, centre notifications).
