# BookVault — Découpe microservices (évolution hypothétique)

Document de **cible possible** si le monolithe modulaire était découpé en services autonomes. Ce n’est pas le périmètre du cahier des charges V1 ; il sert de référence d’architecture distribuée.

---

## Vue d’ensemble

| Micro-service | Responsabilité métier principale |
|---------------|----------------------------------|
| **api-gateway** | Point d’entrée unique : routage, TLS, rate limiting, corrélation des requêtes (optionnel mais courant). |
| **auth-service** | Inscription, login, JWT (access/refresh), blacklist, réinitialisation mot de passe. |
| **user-service** | Profils, préférences, rôles métiers exposés aux autres services (après validation identité). |
| **catalog-service** | Livres, catégories, recherche, bestsellers, publication (métadonnées). |
| **file-service** | Stockage objet (S3/MinIO), upload e-book / couverture / avatar, URLs signées, téléchargement sécurisé. |
| **reading-service** | Progression de lecture (e-book / audio), signets, annotations, synchro multi-appareils ; pas de stockage des binaires. |
| **order-service** | Panier, commandes, statuts, intégration paiement (Stripe/PayPal), webhooks, factures. |
| **review-service** | Avis, notes, votes « utile », signalements ; règle « acheteur vérifié ». |
| **wishlist-service** | Liste de souhaits, transfert vers panier. |
| **notification-service** | Notifications in-app / e-mail, préférences, files d’événements. |
| **author-service** (optionnel) | Dashboard auteur, stats ventes — peut rester dans **catalog** + **order** en agrégation. |
| **admin-service** (optionnel) | Back-office transversal — souvent un **BFF admin** qui appelle les autres APIs. |

En pratique, on regroupe parfois **user + auth** (phase 1) ou **wishlist + catalog** (lecture seule) pour limiter le nombre de déploiements.

---

## Dépendances par micro-service

Ci-dessous, **dépendances** = autres services appelés en **HTTP/gRPC**, **événements** consommés (Kafka/RabbitMQ), ou **données externes** indispensables.

### 1. api-gateway

| Type | Dépendances |
|------|-------------|
| Appels sortants | Routage vers tous les services backend (`spring.cloud.gateway.server.webmvc.routes`, voir `api-gateway/src/main/resources/application.yml`) ; entrée unique port **8080**. |
| Données | Aucune base propre (stateless). |
| Infra | CORS pour Angular (`GatewayCorsConfig`) ; variables `*_SERVICE_URI` pour URLs backends ; éventuellement Redis pour rate limiting. |

---

### 2. auth-service

| Type | Dépendances |
|------|-------------|
| Appels sortants | **SMTP / SendGrid** (e-mails forgot-password) ; éventuellement **notification-service** pour envoyer les mails via une file. |
| Données | Base **PostgreSQL** (utilisateurs credentials, refresh tokens, blacklist) ou **Redis** pour sessions/blacklist selon design. |
| Événements émis | `UserRegistered`, `PasswordChanged`, `UserLoggedOut` (pour invalider caches ailleurs). |
| Infra | Secrets pour JWT ; BCrypt. |

---

### 3. user-service

| Type | Dépendances |
|------|-------------|
| Appels sortants | **auth-service** (validation token ou introspection) pour opérations protégées ; **file-service** (URL avatar) si upload délégué. |
| Données | Base **PostgreSQL** (profil : nom, bio, préférences, lien `userId` aligné avec auth). |
| Événements | Consomme `UserRegistered` ; émet `ProfileUpdated`. |

---

### 4. catalog-service

| Type | Dépendances |
|------|-------------|
| Appels sortants | **file-service** (métadonnées fichier / couverture après upload) ; **user-service** ou claims JWT pour savoir si l’appelant est AUTHOR. |
| Données | Base **PostgreSQL** (livres, catégories, statistiques vues). |
| Événements | Émet `BookPublished`, `BookUpdated` ; peut consommer `OrderPaid` (bestsellers agrégés via batch ou autre service). |

---

### 5. file-service

| Type | Dépendances |
|------|-------------|
| Appels sortants | **catalog-service** (vérifier `bookId`, droits auteur) ; **order-service** (preuve d’achat avant téléchargement e-book). |
| Données | Métadonnées fichiers en **PostgreSQL** ; blobs dans **S3 / MinIO**. |
| Infra | Stockage objet, génération d’URLs pré-signées. |

---

### 6. reading-service

| Type | Dépendances |
|------|-------------|
| Appels sortants | **order-service** (droits d’accès achat / abonnement) ; **file-service** uniquement côté client ou gateway pour les URLs de fichier — ce service persiste la **position** et les **métadonnées** (JSON), pas les EPUB/PDF/audio. |
| Données | Base **PostgreSQL** dédiée (`reading_progress`, `reading_bookmarks`, `reading_annotations`). |
| Événements | Optionnel : consommation `BookPurchased` / `SubscriptionActive` via Kafka pour pré-valider les droits ; sinon appels HTTP synchrones vers **order-service**. |
| Infra | JWT resource server (aligné sur **auth-service**) ; port typique **8095**. |

---

### 7. order-service

| Type | Dépendances |
|------|-------------|
| Appels sortants | **catalog-service** (prix, disponibilité, format) ; **payment** externe **Stripe / PayPal** ; **user-service** (adresse, TVA si besoin) ; **notification-service** (commande confirmée). |
| Données | Base **PostgreSQL** (commandes, lignes, panier persisté, idempotency keys paiement). |
| Événements | Émet `OrderCreated`, `PaymentSucceeded`, `OrderShipped` ; **review-service** consomme `PaymentSucceeded` pour « acheteur vérifié ». |

---

### 8. review-service

| Type | Dépendances |
|------|-------------|
| Appels sortants | **order-service** (ou événements) pour vérifier achat ; **catalog-service** (existence livre) ; **notification-service** (signalement modération). |
| Données | Base **PostgreSQL** (avis, votes). |
| Événements | Consomme `PaymentSucceeded` ; émet `ReviewCreated`, `ReviewReported`. |

---

### 9. wishlist-service

| Type | Dépendances |
|------|-------------|
| Appels sortants | **catalog-service** (prix à jour, disponibilité) ; **order-service** pour **move-to-cart** (création des lignes panier). |
| Données | Base **PostgreSQL** ou **Redis** (panier souvent volatile — ici liste durable par utilisateur). |

---

### 10. notification-service

| Type | Dépendances |
|------|-------------|
| Appels sortants | **SMTP / FCM / SSE** ; lecture préférences dans **user-service** ou réplica local synchronisé. |
| Données | File **Kafka/RabbitMQ** ou **PostgreSQL** (notifications + état lu) ; **Redis** pour temps réel optionnel. |
| Événements | Consomme événements de **order**, **catalog**, **review**, **auth** (events génériques). |

---

### 11. author-dashboard / admin (option BFF)

| Type | Dépendances |
|------|-------------|
| Appels sortants | Agrège **order-service**, **catalog-service**, **review-service**, **user-service**, **auth-service** (rôle ADMIN). |
| Données | Souvent **aucune** ou cache **Redis** pour tableaux de bord. |

---

## Schéma des flux de dépendances (simplifié)

```
                    [api-gateway :8080]
                           |
     +--------------------+--------------------+
     |                    |                    |
 [auth-service]    [user-service]      [catalog-service]
     |                    |                    |
     |                    |                    +------> [file-service]
     |                    |                    |
     +--------------------+--------------------+
                          |
                   [order-service] -----> Stripe/PayPal
                          |  ^
                          |  +---- [reading-service] (droits)
                          |
            +-------------+-------------+
            |             |             |
    [review-service] [wishlist]   [notification-service]
            |                           ^
            +---------------------------+
                    (événements)
```

---

## Dépendances techniques transverses

| Composant | Rôle |
|-----------|------|
| **Broker de messages** (Kafka, RabbitMQ) | Découpler commandes, paiements, avis, notifications ; éviter appels synchrones en chaîne. |
| **PostgreSQL** | En général **une base par service** (ou schéma isolé) pour l’autonomie des équipes et des déploiements. |
| **Redis** | Cache catalogue, rate limiting, sessions optionnelles. |
| **Service mesh** (optionnel) | mTLS, retries, observabilité entre pods. |
| **Observabilité** | Logs structurés, traces distribuées (OpenTelemetry), métriques par service. |

---

## Effort et risques d’une transformation

- Cohérence **sans transaction globale** : patterns **Saga** ou **eventual consistency** pour commande + stock + paiement.
- **Duplication** contrôlée de données (ex. snapshot prix sur `OrderItem`) pour ne pas dépendre du catalogue à vie.
- Complexité opérationnelle (CI/CD multi-repo ou mono-repo multi-artifacts, secrets, réseau).

Ce document peut évoluer avec les choix réels (regroupement de services, event bus unique, etc.).
