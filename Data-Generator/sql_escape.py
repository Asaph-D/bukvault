"""Utilitaires SQL PostgreSQL."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any


def sql_str(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_bool(value: bool) -> str:
    return "true" if value else "false"


def sql_num(value: int | float) -> str:
    return str(value)


def sql_uuid(value: str) -> str:
    return f"{value}::uuid"


def sql_ts(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    iso = dt.strftime("%Y-%m-%d %H:%M:%S+00")
    return f"TIMESTAMP WITH TIME ZONE '{iso}'"


def sql_interval_days(days: int) -> str:
    return f"NOW() - INTERVAL '{days} days'"


def sql_interval_hours(hours: int) -> str:
    return f"NOW() - INTERVAL '{hours} hours'"


def sql_json_obj(obj: dict[str, Any]) -> str:
    return sql_str(json.dumps(obj, ensure_ascii=False))


def sql_array_uuid(uuids: list[str]) -> str:
    inner = ", ".join(sql_uuid(u) for u in uuids)
    return f"ARRAY[{inner}]::uuid[]"
