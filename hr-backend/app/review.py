from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal

from .db import get_conn
from .auth import get_current_user
from .audit import log_action

router = APIRouter(prefix="/api/review-decisions", tags=["review"])

Decision = Literal["DOUBLE_PAYMENT", "TRANSFER", "DATA_ERROR", "CLOSED"]


class DecisionIn(BaseModel):
    decision: Decision


@router.put("/{case_id}")
def set_decision(case_id: int, payload: DecisionIn, current_user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM overlap_cases WHERE id = %s", (case_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="الحالة غير موجودة")
            cur.execute(
                """INSERT INTO review_decisions (case_id, decision, decided_by, decided_by_name, decided_at)
                   VALUES (%s, %s, %s, %s, now())
                   ON CONFLICT (case_id) DO UPDATE
                   SET decision = EXCLUDED.decision, decided_by = EXCLUDED.decided_by,
                       decided_by_name = EXCLUDED.decided_by_name, decided_at = now()""",
                (case_id, payload.decision, current_user["id"], current_user["full_name"] or current_user["username"]),
            )
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "review_decision.set", "overlap_cases", case_id, {"decision": payload.decision})
    return {"ok": True, "case_id": case_id, "decision": payload.decision}


@router.delete("/{case_id}")
def clear_decision(case_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM review_decisions WHERE case_id = %s", (case_id,))
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "review_decision.clear", "overlap_cases", case_id)
    return {"ok": True}
