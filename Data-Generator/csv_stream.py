"""Écriture CSV en flux avec flush périodique."""
from __future__ import annotations

import csv
from pathlib import Path
from typing import Any, Iterable

from encoding_utils import CSV_ENCODING


class CsvStreamWriter:
    def __init__(self, path: Path, fieldnames: list[str], flush_every: int = 10_000) -> None:
        self.path = path
        self.fieldnames = fieldnames
        self.flush_every = flush_every
        self._count = 0
        path.parent.mkdir(parents=True, exist_ok=True)
        # utf-8-sig = BOM : Excel / Power BI affichent correctement é, è, à, ï, œ…
        self._file = path.open("w", newline="", encoding=CSV_ENCODING)
        self._writer = csv.DictWriter(self._file, fieldnames=fieldnames, extrasaction="ignore")
        self._writer.writeheader()

    def write_row(self, row: dict[str, Any]) -> None:
        self._writer.writerow(row)
        self._count += 1
        if self._count % self.flush_every == 0:
            self._file.flush()

    def write_rows(self, rows: Iterable[dict[str, Any]]) -> None:
        for row in rows:
            self.write_row(row)

    def close(self) -> int:
        self._file.flush()
        self._file.close()
        return self._count
