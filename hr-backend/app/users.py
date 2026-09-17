from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from .db import get_conn, native
from .auth import get_current_user, hash_password
from .audit import log_action

router = APIRouter(prefix="/api/users", tags=["users"])


def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="هذه الصفحة متاحة للمشرفين فقط")
    return current_user


class UserIn(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    role: str = "viewer"


class UserUpdateIn(BaseModel):
    full_name: Optional[str] = None
    role: str = "viewer"
    password: Optional[str] = None  # only set when changing the password


def row_to_dict(cur, row):
    cols = [c.name for c in cur.description]
    return {col: native(val) for col, val in zip(cols, row)}


@router.get("")
def list_users(current_user: dict = Depends(require_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, full_name, role, created_at FROM users ORDER BY created_at"
            )
            cols = [c.name for c in cur.description]
            return [{col: native(v) for col, v in zip(cols, row)} for row in cur.fetchall()]
    finally:
        conn.close()


@router.post("")
def create_user(payload: UserIn, current_user: dict = Depends(require_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE username = %s", (payload.username,))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="اسم المستخدم موجود بالفعل")
            cur.execute(
                """INSERT INTO users (username, password_hash, full_name, role)
                   VALUES (%s, %s, %s, %s) RETURNING id, username, full_name, role, created_at""",
                (payload.username, hash_password(payload.password), payload.full_name, payload.role),
            )
            row = row_to_dict(cur, cur.fetchone())
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "user.create", "users", row["id"], {"username": row["username"], "role": row["role"]})
    return row


@router.put("/{user_id}")
def update_user(user_id: int, payload: UserUpdateIn, current_user: dict = Depends(require_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="المستخدم غير موجود")
            if payload.password:
                cur.execute(
                    """UPDATE users SET full_name = %s, role = %s, password_hash = %s
                       WHERE id = %s RETURNING id, username, full_name, role, created_at""",
                    (payload.full_name, payload.role, hash_password(payload.password), user_id),
                )
            else:
                cur.execute(
                    """UPDATE users SET full_name = %s, role = %s
                       WHERE id = %s RETURNING id, username, full_name, role, created_at""",
                    (payload.full_name, payload.role, user_id),
                )
            row = row_to_dict(cur, cur.fetchone())
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "user.update", "users", user_id, {"role": row["role"], "password_changed": bool(payload.password)})
    return row


@router.delete("/{user_id}")
def delete_user(user_id: int, current_user: dict = Depends(require_admin)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="لا يمكنك حذف حسابك الحالي")
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username FROM users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="المستخدم غير موجود")
            cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
    finally:
        conn.close()
    log_action(current_user, "user.delete", "users", user_id, {"username": row[1]})
    return {"ok": True}
