#!/usr/bin/env python3
"""
Génère cover.jpg (1re page du PDF si possible) et place EPUB ou placeholders
sous FILE_STORAGE_ROOT (chemins = sql/seed/10_bookvault_files.sql).

  pip install pillow pymupdf
  set FILE_STORAGE_ROOT=%USERPROFILE%\\bookvault-files   (Windows)
  python scripts/generate_covers_from_books.py
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOKS = ROOT / "books"
MANIFEST = BOOKS / "manifest.json"
STORAGE = Path(os.environ.get("FILE_STORAGE_ROOT", Path.home() / "bookvault-files"))


def render_pdf_first_page(pdf: Path, out_jpg: Path) -> bool:
    try:
        import io

        import fitz  # PyMuPDF
        from PIL import Image
    except ImportError:
        return False
    try:
        doc = fitz.open(pdf)
        page = doc[0]
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        out_jpg.parent.mkdir(parents=True, exist_ok=True)
        img.save(out_jpg, format="JPEG", quality=88)
        doc.close()
        return True
    except Exception as e:
        print(f"  ! PDF render: {e}")
        return False


def synthetic_cover(book_id: str, out_jpg: Path) -> None:
    from PIL import Image, ImageDraw, ImageFont

    w, h = 600, 900
    n = int(hashlib.sha256(book_id.encode()).hexdigest()[:8], 16)
    img = Image.new("RGB", (w, h), color=(25 + n % 40, 35 + n % 50, 55 + n % 60))
    draw = ImageDraw.Draw(img)
    for i in range(0, h, 3):
        draw.line([(0, i), (w, i)], fill=(40 + i // 12, 50 + i // 15, 70 + i // 10))
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None
    label = book_id[:13] + "..."
    draw.text((36, 380), "BookVault seed\n" + label, fill=(245, 245, 250), font=font)
    out_jpg.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_jpg, format="JPEG", quality=90)
    print(f"  [synthetic] -> {out_jpg}")


def main() -> int:
    if not MANIFEST.exists():
        print(f"Créez {MANIFEST} à partir de books/manifest.example.json", file=sys.stderr)
        return 1

    entries = json.loads(MANIFEST.read_text(encoding="utf-8"))
    STORAGE.mkdir(parents=True, exist_ok=True)

    for row in entries:
        bid = row["bookId"]
        prefix = STORAGE / "seed" / "books" / bid
        cover_out = prefix / "cover.jpg"
        prefix.mkdir(parents=True, exist_ok=True)

        pdf_name = row.get("pdf")
        done = False
        pdf_path: Path | None = None
        if pdf_name:
            pdf_path = BOOKS / pdf_name
            if pdf_path.is_file():
                print(f"{pdf_path.name} -> cover.jpg")
                done = render_pdf_first_page(pdf_path, cover_out)
            else:
                print(f"  (PDF absent : {pdf_path})")
                pdf_path = None

        if not done:
            try:
                synthetic_cover(bid, cover_out)
            except ImportError:
                print("Installez Pillow : pip install pillow", file=sys.stderr)
                return 2

        # Seed e-book attendu par le file-service /sql/seed/10_bookvault_files.sql :
        # on privilégie un PDF réel (lisible dans l'iframe) plutôt qu'un EPUB stub.
        if pdf_path and pdf_path.is_file():
            dst_pdf = prefix / "ebook.pdf"
            shutil.copy2(pdf_path, dst_pdf)
            print(f"  PDF -> {dst_pdf}")
        else:
            # fallback minimal : stub EPUB (pour garder une présence sur disque si besoin)
            dst = prefix / "ebook.epub"
            dst.write_bytes(b"PK\x03\x04" + b"\x00" * 120)
            print(f"  (stub EPUB -> {dst})")

    print(f"\nRacine stockage : {STORAGE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
