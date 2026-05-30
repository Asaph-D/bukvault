"""
Lexique et gabarits BookVault — territoire Cameroun / Afrique centrale.
Noms, villes, établissements, paiements mobiles, titres d'ouvrages et avis.
"""
from __future__ import annotations

# --- Personnes ---
FIRST_NAMES_M = [
    "Paul", "Samuel", "Brice", "David", "Fabrice", "Martin", "Jean-Pierre", "Armel",
    "Ibrahim", "André", "Rodrigue", "Serge", "Alain", "Emmanuel", "Parfait", "Landry",
    "Boris", "Christian", "Didier", "Hervé", "Joseph", "Moïse", "Noël", "Olivier",
]
FIRST_NAMES_F = [
    "Marie", "Aïcha", "Clarisse", "Estelle", "Gisèle", "Grace", "Patricia", "Nadia",
    "Mariette", "Blandine", "Charlotte", "Diane", "Élodie", "Fatou", "Hélène",
    "Irène", "Jeanne", "Léa", "Madeleine", "Nadège", "Olivia", "Sandrine", "Thérèse",
    "Véronique", "Yolande",
]
LAST_NAMES = [
    "Atangana", "Essama", "Beko", "Mballa", "Owona", "Ndjock", "Fouda", "Kamga",
    "Tchinda", "Abega", "Ndongo", "Fotso", "Mbarga", "Nkem", "Tambe", "Ngassa",
    "Ngono", "Kouokam", "Talla", "Ebolo", "Tabi", "Nguema", "Mvondo", "Ekotto",
    "Biya", "Manga", "Nana", "Soppo", "Tchoumi", "Wamba", "Zang", "Abanda",
    "Belinga", "Djomo", "Etoa", "Fotsing", "Kengne", "Mefo", "Nkom", "Onana",
]

# --- Géographie & institutions ---
CITIES = [
    ("Douala", "Littoral"),
    ("Yaoundé", "Centre"),
    ("Bafoussam", "Ouest"),
    ("Garoua", "Nord"),
    ("Bamenda", "Nord-Ouest"),
    ("Maroua", "Extrême-Nord"),
    ("Limbé", "Sud-Ouest"),
    ("Kribi", "Sud"),
    ("Bertoua", "Est"),
    ("Dschang", "Ouest"),
    ("Ebolowa", "Sud"),
    ("Ngaoundéré", "Adamaoua"),
    ("Edéa", "Littoral"),
    ("Buea", "Sud-Ouest"),
]

UNIVERSITIES = [
    "Université de Yaoundé I",
    "Université de Douala",
    "Université de Dschang",
    "Université de Buea",
    "Université de Ngaoundéré",
    "ENS Yaoundé",
    "IRIC Yaoundé",
    "ISTY Yaoundé",
    "IFORD Yaoundé",
    "ENSP Yaoundé",
]

NEIGHBORHOODS = {
    "Douala": ["Akwa", "Bonanjo", "Bonapriso", "Deido", "Makepe", "Logpom", "Bépanda"],
    "Yaoundé": ["Bastos", "Nlongkak", "Mvan", "Emana", "Essos", "Mvog-Ada", "Odza"],
    "Bafoussam": ["Tamdja", "Famla", "Djeleng"],
    "Bamenda": ["Commercial Avenue", "Ntarinkon", "Mile 4 Nkwen"],
}

# --- Paiements mobiles Cameroun ---
PAYMENT_PREFIXES = [
    ("CM-MTN-MOMO", 0.62),
    ("CM-OM", 0.28),
    ("CM-CAMPOST-EXPRESS", 0.06),
    ("CM-EXPRESS-UNION", 0.04),
]

# --- Catégories catalogue ---
CATEGORIES = [
    ("Sciences & gestion", "sciences-gestion", "Mathématiques appliquées, RO, économie — programmes universitaires camerounais.", 10),
    ("Informatique & données", "informatique-donnees", "Programmation, data science, cybersécurité et numérique.", 20),
    ("Histoire & société", "histoire-societe", "Essais, société civile, urbanisation en Afrique centrale.", 30),
    ("Littérature", "litterature", "Contes, anthologies, fiction camerounaise et africaine.", 40),
    ("Scolaire (APC)", "scolaire-apc", "Manuels APC collège/lycée — séquences et exercices.", 50),
    ("Entrepreneuriat", "entrepreneuriat", "PME, finance inclusive, Mobile Money et agritech.", 60),
    ("Santé publique", "sante-publique", "Épidémiologie, politiques sanitaires, ONG terrain.", 70),
    ("Droit & gouvernance", "droit-gouvernance", "OHADA, droit des affaires, institutions.", 80),
    ("Langues & culture", "langues-culture", "Ewondo, Duala, Fulfulde — patrimoine et enseignement.", 90),
    ("Jeunesse & BD", "jeunesse-bd", "Albums, initiation lecture, clubs scolaires.", 100),
]

# --- Gabarits de titres (format avec {topic}, {level}, {place}) ---
BOOK_TITLE_TEMPLATES = [
    "Recherche opérationnelle : {topic} en gestion",
    "Introduction à {topic} — cas pratiques Cameroun",
    "{topic} pour les masters à {place}",
    "Manuel APC {level} : cours & exercices ({topic})",
    "APC {level} — {topic} : séquences et devoirs",
    "Essais sur {place} : {topic}",
    "Chroniques de {place} — {topic}",
    "Contes et récits du {region}",
    "Anthologie bilingue — {region}",
    "{topic} : de la théorie à la pratique",
    "Systèmes & architecture : {topic}",
    "Data science au Cameroun — {topic}",
    "MLOps et production — {topic}",
    "Cybersécurité des PME à {place}",
    "Mobile Money et inclusion financière",
    "Agritech & coopératives du {region}",
    "Santé communautaire — {topic}",
    "Droit OHADA simplifié — {topic}",
    "Poésie du {region}",
    "BD jeunesse — aventures à {place}",
]

BOOK_TOPICS = [
    "optimisation linéaire", "files d'attente", "Python", "Haskell", "Linux",
    "réseaux TCP/IP", "machine learning", "statistiques", "microéconomie",
    "macroéconomie locale", "gouvernance locale", "open data", "urbanisation",
    "algorithmique", "bases de données", "sécurité applicative", "cloud",
    "gestion de projet", "comptabilité analytique", "marketing digital",
]

BOOK_LEVELS = ["4ème", "3ème", "2nde A", "2nde C", "1ère A", "1ère CD", "Tle A", "Tle CD", "6ème"]
REGIONS_CM = ["Grassfield", "Littoral", "Adamaoua", "Sud-Ouest", "Nord", "Centre", "Est"]

# --- Avis ---
REVIEW_TITLES = [
    "Indispensable pour le master",
    "Très utile à {place}",
    "Clair et bien structuré",
    "Parfait pour la préparation aux examens",
    "Exemples concrets du Cameroun",
    "Dense mais complet",
    "Excellent pour débuter",
    "À recommander aux collègues",
    "Quelques coquilles, contenu solide",
    "Lecture agréable sur mobile",
    "Manuel APC très pratique",
    "Bon complément de cours",
]

REVIEW_BODIES = [
    "Les exercices sur {topic} m'ont aidé pour mes partiels à {uni}.",
    "J'ai apprécié les références à {place} et aux réalités locales.",
    "Chapitre sur {topic} particulièrement bien expliqué.",
    "Idéal pour réviser entre deux cours à {place}.",
    "Je l'ai lu sur téléphone — mise en page adaptée.",
    "Les corrigés détaillés font gagner du temps.",
    "Quelques passages techniques, mais la pédagogie est au rendez-vous.",
    "Parfait pour mon travail de bibliothécaire à {place}.",
    "Les données « open data » camerounaises sont un plus.",
    "À lire avec le club lecture de notre école à {place}.",
]

# --- Notifications ---
NOTIF_TEMPLATES = [
    ("ORDER", "Paiement confirmé", "Votre commande « {title} » est enregistrée (réf. {ref})."),
    ("ORDER", "Commande expédiée", "Votre ebook « {title} » est disponible dans votre bibliothèque."),
    ("PROMO", "Promo littérature camerounaise", "−15 % sur les essais et contes du {region} cette semaine."),
    ("PROMO", "Rentrée APC", "Manuels collège/lycée — offre groupée établissements de {place}."),
    ("SYSTEM", "Bienvenue sur BookVault", "Synchronisez votre progression sur tous vos appareils."),
    ("SYSTEM", "Synchronisation", "Progression mise à jour sur « {title} »."),
    ("REVIEW", "Nouvel avis", "Un lecteur a noté votre ouvrage « {title} »."),
    ("SOCIAL", "Nouveau message", "Vous avez un message non lu dans la communauté."),
    ("BOOK", "Alerte disponibilité", "« {title} » vient d'être publié — découvrez-le."),
]

# --- Communauté ---
THREAD_CHANNELS = ["#litterature-cm", "#ia-data", "#apc", "#histoire", "#entrepreneuriat", "#sante", "#jeunesse"]
THREAD_TITLES = [
    "Littérature camerounaise contemporaine",
    "IA, data & livres tech",
    "APC — cours, exercices et annales",
    "Histoire et société en Afrique centrale",
    "Entrepreneuriat & Mobile Money",
    "Santé publique et lecture",
    "BD et jeunesse à {place}",
    "Open data Cameroun",
    "Club lecture {region}",
]
EVENT_TITLES = [
    "AMA : publier un ebook au Cameroun",
    "Club lecture : essais & sciences à {place}",
    "Atelier : systèmes & architecture (live)",
    "Rencontre auteurs du {region}",
    "Session APC : préparer les examens",
    "Table ronde Mobile Money & édition numérique",
]

# --- Éditeurs (entrepôt) ---
EDITORS = [
    ("Éditions du Littoral", "Douala", "https://editions-littoral.cm"),
    ("Presses de l'Ouest", "Bafoussam", "https://presses-ouest.cm"),
    ("Maison du Grassfield", "Bamenda", "https://maison-grassfield.cm"),
    ("Éditions Centre", "Yaoundé", "https://editions-centre.cm"),
    ("Harmattan Cameroun", "Yaoundé", "https://harmattan-cm.org"),
]

# --- Signets / annotations ---
BOOKMARK_LABELS = [
    "Rappel exercice transport", "Définition clé", "Exemple Yaoundé", "Formule à retenir",
    "Citation importante", "Chapitre à revoir", "Annale type BAC", "Résumé cours",
]
ANNOTATION_BODIES = [
    "À revoir avec le professeur — notion difficile.",
    "Lien avec le cours de {uni}.",
    "Exemple Douala très parlant pour mes étudiants.",
    "Comparer avec le manuel papier de l'école.",
]

DEVICES = [
    "web-chrome-cm", "web-firefox-cm", "tablet-android", "iphone-bookvault",
    "samsung-a54", "tecno-camon", "infinix-note", "desktop-windows",
]
