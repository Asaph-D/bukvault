# BookVault — Procédure Power BI & DAX Studio

Guide pas à pas après la génération des CSV (`output/warehouse/`).  
Référence attributs : `liste_des_dimensions.md` | Génération : `README.md` + `run_generate.ps1`.

---

## 0. Avant d’ouvrir Power BI

### Générer (ou vérifier) les données

```powershell
cd Data-Generator
.\run_generate.ps1
```

Contrôler que le dossier existe et contient les fichiers :

```
Data-Generator/output/warehouse/
  dim_utilisateur.csv
  dim_livre.csv
  dim_categorie.csv
  dim_livre_categorie.csv
  dim_auteur.csv
  dim_editeur.csv
  dim_date.csv
  fait_commande.csv
  fait_ligne_commande.csv
  fait_paiement.csv
  fait_avis.csv
  fait_telechargement.csv
  fait_progression_lecture.csv
  fait_notification.csv
  fait_wishlist.csv
  fait_book_like.csv
  agg_ventes_mois.csv
```

Consulter `output/manifest.json` pour les volumes réellement générés.

### Encodage UTF-8 (accents)

À l’import dans Power BI, pour **chaque** fichier texte :

- **Encodage** : `65001 : Unicode (UTF-8)` (ou laisser la détection automatique si les CSV ont été regénérés avec BOM).
- Si vous voyez `contextualisÃ©` : regénérer les CSV puis réimporter avec UTF-8.

---

## 1. Power BI Desktop — Créer le modèle

### 1.1 Nouveau rapport

1. Ouvrir **Power BI Desktop**.
2. **Fichier > Enregistrer sous** → ex. `BookVault_Analyse_Cameroun.pbix`.
3. **Fichier > Options > Paramètres régionaux** : langue d’affichage `Français`, format **France** ou personnalisé (séparateur décimal selon vos CSV).

### 1.2 Importer les tables (Obtenir des données)

**Accueil > Obtenir des données > Texte/CSV**.

Importer **une par une** (ou via dossier — voir §1.3) depuis :

`C:\...\bukvault\Data-Generator\output\warehouse\`

| Fichier | Nom de table suggéré dans Power BI |
|---------|----------------------------------|
| `dim_date.csv` | `Dim Date` |
| `dim_utilisateur.csv` | `Dim Utilisateur` |
| `dim_livre.csv` | `Dim Livre` |
| `dim_categorie.csv` | `Dim Categorie` |
| `dim_livre_categorie.csv` | `Dim Livre Categorie` |
| `dim_auteur.csv` | `Dim Auteur` |
| `dim_editeur.csv` | `Dim Editeur` |
| `fait_commande.csv` | `Fait Commande` |
| `fait_ligne_commande.csv` | `Fait Ligne Commande` |
| `fait_paiement.csv` | `Fait Paiement` |
| `fait_avis.csv` | `Fait Avis` |
| `fait_telechargement.csv` | `Fait Telechargement` |
| `fait_progression_lecture.csv` | `Fait Progression` |
| `fait_notification.csv` | `Fait Notification` |
| `fait_wishlist.csv` | `Fait Wishlist` |
| `fait_book_like.csv` | `Fait Book Like` |
| `agg_ventes_mois.csv` | `Agg Ventes Mois` (optionnel, déjà agrégé) |

Pour chaque import :

1. Aperçu : vérifier que les accents sont corrects (`é`, `è`, `à`).
2. **Transformer les données** si besoin (Power Query), sinon **Charger** directement.
3. Cocher **Utiliser la première ligne comme en-têtes**.

### 1.3 Astuce : importer tout le dossier (Power Query)

1. **Obtenir des données > Dossier**.
2. Sélectionner `output/warehouse`.
3. Filtrer les extensions `.csv`.
4. **Combiner > Combiner et transformer** → une requête par fichier ou combinaison manuelle ensuite.

Recommandation pour débuter : imports **séparés** (plus simple pour les relations).

### 1.4 Typage des colonnes (Power Query)

Dans **Éditeur Power Query**, pour chaque table :

| Colonne | Type |
|---------|------|
| `id`, `userId`, `bookId`, `authorId`, `categoryId`, `orderId` | Texte (UUID) |
| `dateKey` | Nombre entier |
| `createdAt`, `publishedAt`, `paidAt`, `downloadedAt`, … | **Date/heure** |
| `price`, `totalAmount`, `unitPrice`, `lineTotal`, `amount`, `unitCost` | Décimal |
| `quantity`, `rating`, `viewCount`, `percent`, … | Nombre entier |
| `active`, `verifiedPurchase`, `read`, `success` | Vrai/Faux |
| `role`, `status`, `format`, `paymentMethod`, `kind` | Texte |

**Dim Date** :

- `fullDate` → Date.
- Marquer comme **table de dates** : clic droit sur `Dim Date` > **Marquer comme table de dates** > choisir la colonne `fullDate` (après chargement, voir §1.6).

**Fermer et appliquer**.

### 1.5 Schéma en étoile — Relations

Ouvrir **Vue Modèle** (icône diagramme à gauche). Créer les relations **plusieurs-à-un** (côté fait = `*`, côté dimension = `1`) :

```
                    ┌─────────────┐
                    │  Dim Date   │
                    └──────┬──────┘
           dateKey ────────┼──────── dateKey (sur chaque fait)
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───▼────────┐      ┌──────▼──────┐       ┌──────▼──────┐
│Dim Utilis. │      │  Dim Livre  │       │ Dim Auteur  │
└───┬────────┘      └──────┬──────┘       └──────┬──────┘
    │                      │                      │
    │ userId               │ bookId               │ authorId
    │                      │                      │
┌───▼──────────────────────▼──────────────────────▼───┐
│ Fait Commande │ Fait Ligne │ Fait Avis │ Fait ...   │
└─────────────────────────────────────────────────────┘
```

| Table fait | Colonne | Table dimension | Colonne |
|------------|---------|-----------------|---------|
| `Fait Commande` | `userId` | `Dim Utilisateur` | `id` |
| `Fait Commande` | `dateKey` | `Dim Date` | `dateKey` |
| `Fait Ligne Commande` | `bookId` | `Dim Livre` | `id` |
| `Fait Ligne Commande` | `orderId` | `Fait Commande` | `id` |
| `Fait Paiement` | `orderId` | `Fait Commande` | `id` |
| `Fait Paiement` | `dateKey` | `Dim Date` | `dateKey` |
| `Fait Avis` | `bookId` | `Dim Livre` | `id` |
| `Fait Avis` | `userId` | `Dim Utilisateur` | `id` |
| `Fait Avis` | `dateKey` | `Dim Date` | `dateKey` |
| `Fait Telechargement` | `bookId` | `Dim Livre` | `id` |
| `Fait Telechargement` | `userId` | `Dim Utilisateur` | `id` |
| `Fait Telechargement` | `dateKey` | `Dim Date` | `dateKey` |
| `Fait Progression` | `bookId` | `Dim Livre` | `id` |
| `Fait Progression` | `userId` | `Dim Utilisateur` | `id` |
| `Fait Wishlist` | `bookId` | `Dim Livre` | `id` |
| `Fait Wishlist` | `userId` | `Dim Utilisateur` | `id` |
| `Fait Book Like` | `bookId` | `Dim Livre` | `id` |
| `Fait Book Like` | `userId` | `Dim Utilisateur` | `id` |
| `Dim Livre` | `authorId` | `Dim Auteur` | `authorId` |
| `Dim Livre Categorie` | `bookId` | `Dim Livre` | `id` |
| `Dim Livre Categorie` | `categoryId` | `Dim Categorie` | `id` |

**Paramètres de chaque relation** :

- Cardinalité : **Plusieurs vers un**.
- Direction du filtre croisé : **Unique** (de la dimension vers les faits).
- **Activer la relation** : Oui.

# 📌 Relations Power BI pour BookVault

---

## 🔹 1. Relations avec **Dim Utilisateur** (A1)
   **Table source**       | **Colonne source** | **Table cible**     | **Colonne cible** | **Cardinalité** | **Direction**       | **État**  |
 |------------------------|--------------------|---------------------|------------------|----------------|----------------------|-----------|
 | `fait_commande`       | `userId`           | `Dim Utilisateur`   | `id`             | Plusieurs-à-un (*:1) | Unique (de Dim → Fait) | Actif |
 | `fait_avis`           | `userId`           | `Dim Utilisateur`   | `id`             | Plusieurs-à-un (*:1) | Unique                | Actif |
 | `fait_telechargement` | `userId`           | `Dim Utilisateur`   | `id`             | Plusieurs-à-un (*:1) | Unique                | Actif |
 | `fait_progression_lecture` | `userId`      | `Dim Utilisateur`   | `id`             | Plusieurs-à-un (*:1) | Unique                | Actif |
 | `fait_wishlist`       | `userId`           | `Dim Utilisateur`   | `id`             | Plusieurs-à-un (*:1) | Unique                | Actif |
 | `fait_book_like`      | `userId`           | `Dim Utilisateur`   | `id`             | Plusieurs-à-un (*:1) | Unique                | Actif |
 | `fait_notification`   | `userId`           | `Dim Utilisateur`   | `id`             | Plusieurs-à-un (*:1) | Unique                | Actif |

---

## 🔹 2. Relations avec **Dim Livre** (A2, A7)
 | **Table source**       | **Colonne source** | **Table cible** | **Colonne cible** | **Cardinalité** | **Direction** | **État**  |
 |------------------------|--------------------|-----------------|------------------|----------------|----------------|-----------|
 | `fait_ligne_commande` | `bookId`           | `Dim Livre`     | `id`             | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_avis`           | `bookId`           | `Dim Livre`     | `id`             | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_telechargement` | `bookId`           | `Dim Livre`     | `id`             | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_progression_lecture` | `bookId`      | `Dim Livre`     | `id`             | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_wishlist`       | `bookId`           | `Dim Livre`     | `id`             | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_book_like`      | `bookId`           | `Dim Livre`     | `id`             | Plusieurs-à-un (*:1) | Unique         | Actif |

---

## 🔹 3. Relations avec **Dim Date** (A13)
 | **Table source**       | **Colonne source** | **Table cible** | **Colonne cible** | **Cardinalité** | **Direction** | **État**  |
 |------------------------|--------------------|-----------------|------------------|----------------|----------------|-----------|
 | `fait_commande`       | `dateKey`          | `Dim Date`      | `dateKey`        | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_ligne_commande` | `dateKey`          | `Dim Date`      | `dateKey`        | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_paiement`       | `dateKey`          | `Dim Date`      | `dateKey`        | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_avis`           | `dateKey`          | `Dim Date`      | `dateKey`        | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_telechargement` | `dateKey`          | `Dim Date`      | `dateKey`        | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_progression_lecture` | `dateKey`      | `Dim Date`      | `dateKey`        | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_wishlist`       | `dateKey`          | `Dim Date`      | `dateKey`        | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_book_like`      | `dateKey`          | `Dim Date`      | `dateKey`        | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `fait_notification`   | `dateKey`          | `Dim Date`      | `dateKey`        | Plusieurs-à-un (*:1) | Unique         | Actif |

---

## 🔹 4. Relations entre **tables de faits**
 | **Table source**       | **Colonne source** | **Table cible**   | **Colonne cible** | **Cardinalité** | **Direction** | **État**  |
 |------------------------|--------------------|-------------------|------------------|----------------|----------------|-----------|
 | `fait_ligne_commande` | `orderId`          | `fait_commande`  | `id`             | Plusieurs-à-un (*:1) | **Les deux**    | Actif |
 | `fait_paiement`       | `orderId`          | `fait_commande`  | `id`             | Plusieurs-à-un (*:1) | Unique         | Actif |

---

## 🔹 5. Relations avec **Dim Auteur** (A2, A7, A12)
 | **Table source** | **Colonne source** | **Table cible** | **Colonne cible** | **Cardinalité** | **Direction** | **État**  |
 |------------------|--------------------|-----------------|------------------|----------------|----------------|-----------|
 | `Dim Livre`      | `authorId`         | `Dim Auteur`    | `id`             | Plusieurs-à-un (*:1) | Unique         | Actif |

---

## 🔹 6. Relations avec **Dim Editeur** (A2, A14)
 | **Table source** | **Colonne source** | **Table cible** | **Colonne cible** | **Cardinalité** | **Direction** | **État**  |
 |------------------|--------------------|-----------------|------------------|----------------|----------------|-----------|
 | `Dim Livre`      | `editorId`         | `Dim Editeur`   | `id`             | Plusieurs-à-un (*:1) | Unique         | Actif |

---
---
## 🔹 7. Relations avec **Dim Categorie** et **Dim Livre Categorie** (A2, A7)
 | **Table source**       | **Colonne source** | **Table cible**      | **Colonne cible** | **Cardinalité** | **Direction** | **État**  |
 |------------------------|--------------------|----------------------|------------------|----------------|----------------|-----------|
 | `Dim Livre Categorie`  | `bookId`           | `Dim Livre`          | `id`             | Plusieurs-à-un (*:1) | Unique         | Actif |
 | `Dim Livre Categorie`  | `categoryId`       | `Dim Categorie`     | `id`             | Plusieurs-à-un (*:1) | Unique         | Actif |

### 1.6 Table de dates

1. Clic droit sur `Dim Date` > **Marquer comme table de dates**.
2. Colonne de date : `fullDate`.
3. Dans chaque mesure temporelle, utiliser `Dim Date` pour les filtres année/mois (évite les erreurs de time intelligence).

Si l’option est grise : vérifier que `fullDate` est bien type Date sans heure parasite.

### 1.7 Mesures DAX de base (créer une table « Mesures »)

**Accueil > Entrer des données** > nom `Mesures` (une colonne vide) > **Charger**.

Puis **Modélisation > Nouvelle mesure** (table `Mesures`) :

```dax
// --- Ventes (A3) ---
CA Total = 
SUMX(
    FILTER(
        'Fait Ligne Commande',
        RELATED('Fait Commande'[status]) IN { "PAID", "DELIVERED", "SHIPPED" }
    ),
    'Fait Ligne Commande'[lineTotal]
)

Nb Commandes = DISTINCTCOUNT('Fait Commande'[id])

Panier Moyen = DIVIDE([CA Total], [Nb Commandes])

// --- Catalogue (A2, A7) ---
Nb Livres Publies = 
CALCULATE(
    DISTINCTCOUNT('Dim Livre'[id]),
    'Dim Livre'[status] = "PUBLISHED"
)

Vues Total = SUM('Dim Livre'[viewCount])

// --- Utilisateurs (A1) ---
Nb Lecteurs = 
CALCULATE(
    DISTINCTCOUNT('Dim Utilisateur'[id]),
    'Dim Utilisateur'[role] = "USER",
    'Dim Utilisateur'[active] = TRUE()
)

// --- Satisfaction (A5) ---
Note Moyenne Avis = AVERAGE('Fait Avis'[rating])

Nb Avis = COUNTROWS('Fait Avis')

// --- Lecture (A6) ---
Progression Moyenne % = AVERAGE('Fait Progression'[percent])

// --- Téléchargements (A8) ---
Nb Telechargements = COUNTROWS('Fait Telechargement')

// --- Paiements Mobile Money (A3) ---
CA MTN MoMo =
CALCULATE(
    [CA Total],
    'Fait Paiement'[paymentMethod] = "MTN_MOMO"
)
```

### 1.8 Mesures temporelles (5 ans)

```dax
CA Annee en cours =
CALCULATE(
    [CA Total],
    'Dim Date'[year] = YEAR(TODAY())
)

CA Annee precedente =
CALCULATE(
    [CA Total],
    'Dim Date'[year] = YEAR(TODAY()) - 1
)

Evolution CA YoY % =
DIVIDE([CA Annee en cours] - [CA Annee precedente], [CA Annee precedente])
```

Pour une courbe par mois, utiliser un graphique :

- **Axe X** : `Dim Date[year]` + `Dim Date[month]` ou colonne `yearMonth` dérivée dans Power Query depuis `dateKey`.
- **Valeurs** : `[CA Total]`.

Alternative rapide : importer `agg_ventes_mois.csv` et tracer `orderCount` / `revenueEur` par `yearMonth`.

### 1.9 Créer les visuels (exemples par analyse)

| Code | Analyse | Visuel Power BI | Champs |
|------|---------|-----------------|--------|
| A1 | Inscriptions | Histogramme | `Dim Utilisateur[createdAt]` (par mois), `Nb Lecteurs` |
| A1 | Répartition | Camembert | `Dim Utilisateur[city]`, `Nb Lecteurs` |
| A2 | Catalogue | Carte / table | `Nb Livres Publies`, `Vues Total` |
| A2 | Statuts | Barres empilées | `Dim Livre[status]`, `COUNTROWS` |
| A3 | Ventes | Graphique courbes | `Dim Date[fullDate]`, `[CA Total]` |
| A3 | Paiements | Donut | `Fait Paiement[paymentMethod]`, `[CA Total]` |
| A5 | Notes | Histogramme | `Fait Avis[rating]`, `Nb Avis` |
| A6 | Lecture | jauge | `[Progression Moyenne %]` |
| A7 | Top livres | Tableau | `Dim Livre[title]`, `Vues Total` (Top N filtre) |
| A8 | Téléchargements | Courbe | `Dim Date`, `[Nb Telechargements]` |
| A13 | Temps | Segment | `Dim Date[year]`, `Dim Date[month]` |

**Filtres recommandés (segments)** :

- `Dim Date[year]`
- `Dim Utilisateur[city]`
- `Dim Livre[format]` (EBOOK / PHYSICAL / BOTH)
- `Dim Categorie[name]`

### 1.10 Marge (A14) — si `unitCost` présent

```dax
Marge Ligne =
SUMX(
    'Fait Ligne Commande',
    'Fait Ligne Commande'[lineTotal]
        - RELATED('Dim Livre'[unitCost]) * 'Fait Ligne Commande'[quantity]
)

Taux Marge % = DIVIDE([Marge Ligne], [CA Total])
```

### 1.11 Enregistrer et publier

1. **Fichier > Enregistrer**.
2. (Optionnel) **Accueil > Publier** sur Power BI Service pour partage en ligne.

---

## 2. DAX Studio — Connexion et requêtes

DAX Studio sert à **écrire, tester et optimiser** le DAX sur le modèle déjà chargé dans Power BI (pas à importer les CSV).

### 2.1 Prérequis

- Power BI Desktop ouvert avec le fichier `.pbix` chargé (modèle en mémoire).
- [DAX Studio](https://daxstudio.org/) installé (gratuit).

### 2.2 Se connecter

1. Lancer **DAX Studio**.
2. **Connecter** (ou accueil) :
   - **PBI Desktop** : sélectionner l’instance du fichier `.pbix` ouvert.
   - Si rien n’apparaît : ouvrir le `.pbix` dans Power BI, puis rafraîchir la liste dans DAX Studio.
3. Statut connecté : nom du modèle affiché en haut.

### 2.3 Explorer le modèle

- Panneau **Modèle** / **Metadata** : tables, colonnes, mesures.
- Vérifier que les relations du §1.5 sont visibles (tables liées).

### 2.4 Exécuter des requêtes DAX (EVALUATE)

Onglet **Home** > zone de requête. Exemples :

**Top 10 villes par chiffre d’affaires**

```dax
EVALUATE
TOPN(
    10,
    SUMMARIZECOLUMNS(
        'Dim Utilisateur'[city],
        "CA", [CA Total]
    ),
    [CA], DESC
)
```

**Ventes par mois (table calculée)**

```dax
EVALUATE
SUMMARIZECOLUMNS(
    'Dim Date'[year],
    'Dim Date'[month],
    "Commandes", [Nb Commandes],
    "CA", [CA Total]
)
ORDER BY 'Dim Date'[year], 'Dim Date'[month]
```

**Note moyenne par catégorie**

```dax
EVALUATE
SUMMARIZECOLUMNS(
    'Dim Categorie'[name],
    "Note Moyenne", [Note Moyenne Avis],
    "Nb Avis", [Nb Avis]
)
```

**Lecteurs actifs par année**

```dax
EVALUATE
SUMMARIZECOLUMNS(
    'Dim Date'[year],
    "Lecteurs", [Nb Lecteurs]
)
ORDER BY 'Dim Date'[year]
```

Cliquer **Run** (F5). Résultat en grille ; export Excel possible.

### 2.5 Créer une mesure depuis DAX Studio

1. Clic droit sur table `Mesures` > **Define Measure**.
2. Saisir :

```dax
DEFINE
    MEASURE 'Mesures'[CA Douala] =
        CALCULATE([CA Total], 'Dim Utilisateur'[city] = "Douala")
EVALUATE { [CA Douala] }
```

3. **Run** pour tester ; si OK, la mesure peut être ajoutée au modèle (selon version : bouton **Add to Power BI**).

### 2.6 Performance (gros volumes ~5 ans)

Menu **Advanced** > **Server Timings** :

1. Lancer une requête `EVALUATE` sur `Fait Commande` ou `[CA Total]`.
2. Lire **Durée**, **SE / FE** (Storage Engine / Formula Engine).
3. Si lent :
   - Réduire les colonnes dans `SUMMARIZECOLUMNS` (ne pas ramener toutes les lignes).
   - Utiliser `agg_ventes_mois` pour les graphiques annuels/mensuels.
   - Filtrer toujours par `Dim Date[year]` dans les requêtes exploratoires.

**VertiPaq Analyzer** (onglet dans DAX Studio) : taille mémoire par table — utile si le `.pbix` est lourd (> 500 Mo).

### 2.7 Bonnes pratiques DAX Studio

| Action | Pourquoi |
|--------|----------|
| Toujours filtrer par date en exploration | 200k+ commandes |
| Préférer `SUMMARIZECOLUMNS` + mesures | Évite d’importer des millions de lignes dans Excel |
| Tester une mesure avec `EVALUATE { [Ma Mesure] }` | Validation rapide |
| Copier le DAX validé vers Power BI | Une seule source de vérité |

---

## 3. Parcours type « de A à Z »

```mermaid
flowchart LR
  A[run_generate.ps1] --> B[CSV warehouse]
  B --> C[Power BI Import]
  C --> D[Relations etoile]
  D --> E[Mesures DAX]
  E --> F[Visuels]
  E --> G[DAX Studio test]
  F --> H[Rapport final]
  G --> E
```

| Étape | Outil | Durée indicative |
|-------|--------|----------------|
| 1. Générer CSV | PowerShell | 5–15 min |
| 2. Importer | Power BI Desktop | 10–30 min |
| 3. Relations + types | Vue Modèle / PQ | 20 min |
| 4. Mesures | Power BI ou DAX Studio | 30 min |
| 5. Visuels + filtres | Power BI | 1 h+ |
| 6. Optimiser DAX | DAX Studio | au besoin |

---

## 4. Dépannage

| Problème | Solution |
|----------|----------|
| Accents cassés (`Ã©`) | Réimporter en UTF-8 ou regénérer CSV (`run_generate.ps1`) |
| Relation inactive / ambiguë | Une seule relation active entre deux tables ; désactiver les doublons |
| Mesure vide | Vérifier filtres `status` PAID ; relation `dateKey` active |
| Fichier `.pbix` énorme | Importer moins de colonnes ; utiliser `agg_ventes_mois` pour tendances |
| DAX Studio ne voit pas PBI | Ouvrir le `.pbix` avant DAX Studio ; même version 64 bits |
| `RELATED` erreur | Relation manquante entre fait et dimension |
| Import très lent | Normal sur 800k+ lignes ; laisser finir ; mode Import (pas DirectQuery) |

---

## 5. Liens projet

| Document | Contenu |
|----------|---------|
| `liste_des_dimensions.md` | Liste des attributs et codes d’analyse A1–A14 |
| `README.md` | Génération des données |
| `output/manifest.json` | Volumes générés |

---

*Procédure alignée sur le Data-Generator BookVault (territoire Cameroun, ~5 ans).*
