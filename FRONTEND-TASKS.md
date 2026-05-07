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
| `author.service.ts` | Profils publics + liste paginée. |
| `cart.service.ts` | Panier `order-service` (JWT requis). |

Pages lazy-loadées, composants **standalone**, navigation alignée sur le header (accueil, catégories, bestsellers, auteurs, à propos, contact, panier).

---

## Checklist d’intégration

### Auth
- [x] Connexion / inscription réelles (`POST /auth/login`, `POST /auth/register`).
- [x] Mot de passe inscription ≥ 8 caractères (aligné backend).
- [x] Session restaurée via `GET /auth/me` si access token valide.
- [x] Déconnexion `POST /auth/logout` avec refresh optionnel.
- [ ] **Refresh token** : interceptor 401 → `POST /auth/refresh` puis retry (non fait — déconnexion si access expiré).
- [ ] **Google OAuth** : volontairement désactivé (message d’erreur côté UI).

### Catalogue & auteurs
- [x] Liste catalogue, bestsellers, détail livre (nom d’auteur via `author-service`).
- [x] Catégories liste + livres par `slug` → `categoryId`.
- [x] Liste auteurs + fiche auteur + livres `GET /books?authorId=`.
- [ ] **Avis** : `review-service` (`/books/{id}/reviews`) non branchés sur le détail.
- [ ] **Création / édition livre** (auteur) : formulaire → `POST/PUT /books` (stub erreur dans `BookService`).

### Panier & commandes
- [x] Panier connecté `GET/POST/DELETE /cart**`.
- [x] Ajustement quantités (workaround delete + re-add pour diminuer).
- [ ] **Checkout** : paiement / commande réels (`POST /orders`, etc.).
- [ ] **Badge panier** : mis à jour au chargement / login — pas d’événement global après ajout depuis la fiche livre (rechargement page ou navigation).

### Lecture & fichiers
- [ ] Lecteur : contenu démo ; brancher `reading-service` / URLs signées `file-service` quand prêt.
- [ ] Téléchargement e-book sécurisé.

### Utilisateur & admin
- [ ] Profil utilisateur `user-service` au-delà de `/auth/me`.
- [ ] Dashboard auteur vs données réelles (`author-service` dashboard, ventes).
- [ ] **admin-service** : non exposé dans le front grand public.

### Qualité
- [ ] Tests unitaires services (mocks HTTP).
- [ ] Gestion d’erreurs API homogène (toast au lieu d’`alert` / messages inline seuls).
- [ ] Accessibilité et i18n si demandées.

---

## Prérequis locaux

1. Gateway **8080**, services nécessaires selon parcours (au minimum : **auth**, **catalog**, **order** pour panier, **author** pour noms sur fiche détail).
2. Front : `npm install` puis `ng serve` (proxy déjà configuré dans `angular.json`).

---

## Notes

- **author-service** écoute en **8091** par défaut (éviter conflit avec Jenkins sur 8089) — la gateway utilise `AUTHOR_SERVICE_URI` / défaut `8091`.
- Les routes **upload**, **wishlist**, **notifications** réelles restent à relier aux écrans existants ou placeholder du dashboard.
