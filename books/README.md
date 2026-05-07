# Corpus local (PDF / EPUB)

Placez ici les fichiers sources des ouvrages (surtout des **PDF** pour générer la **première page** comme image de couverture).

1. Copiez vos `*.pdf` / `*.epub` dans ce dossier.
2. Dupliquez `manifest.example.json` vers **`manifest.json`** et rempliez le mapping `fichier → bookId` (UUID issu de `sql/seed/04_bookvault_catalog.sql`).
3. Exécutez depuis la racine du dépôt :

   ```bash
   pip install pillow pymupdf
   set FILE_STORAGE_ROOT=%USERPROFILE%\bookvault-files
   python scripts\generate_covers_from_books.py
   ```

Le script crée les fichiers attendus par `sql/seed/10_bookvault_files.sql` sous `%FILE_STORAGE_ROOT%\seed\books\<uuid>\cover.jpg` (et copie les EPUB si présents). Sans PDF, une **image de substitution** est générée pour chaque entrée du manifeste afin que le `file-service` serve quand même une couverture.
