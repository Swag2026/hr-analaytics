import json
from .db import get_conn


def log_action(user, action, entity=None, entity_id=None, details=None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO audit_log (user_id, username, action, entity, entity_id, details)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (user["id"], user["username"], action, entity, str(entity_id) if entity_id is not None else None,
                 json.dumps(details, ensure_ascii=False, default=str) if details is not None else None),
            )
        conn.commit()
    finally:
        conn.close()
