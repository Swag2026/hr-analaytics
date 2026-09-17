import json
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any

from .db import get_conn
from .auth import get_current_user
from .audit import log_action

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULT_SETTINGS = {
    "weights": {
        "attendance": 20, "turnover": 20, "payroll_efficiency": 20,
        "workforce_stability": 20, "overtime": 10, "data_quality": 10,
    },
    "alerts": {"payrollGap": 15, "quality": 70, "branchScore": 60, "turnover": 20},
    "turnoverDef": "full",
    "excludeTransfers": True,
    "display": {"currency": "SAR", "dateFormat": "dmy", "rowsPerPage": 50},
    "companyNameOverrides": {},
}


class SettingsIn(BaseModel):
    value: dict[str, Any]


@router.get("")
def get_settings(current_user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT value FROM app_settings WHERE key = 'main'")
            row = cur.fetchone()
            if not row:
                return DEFAULT_SETTINGS
            stored = row[0]
            # merge over defaults so newly-added setting fields still show up for old saved configs
            merged = {**DEFAULT_SETTINGS, **stored}
            return merged
    finally:
        conn.close()


@router.put("")
def put_settings(payload: SettingsIn, current_user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO app_settings (key, value, updated_by, updated_at)
                   VALUES ('main', %s, %s, now())
                   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()""",
                (json.dumps(payload.value, ensure_ascii=False), current_user["id"]),
            )
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "settings.update", "app_settings", "main", payload.value)
    return {"ok": True}
