import os
import psycopg2
import psycopg2.extras
from decimal import Decimal
from datetime import date, datetime

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/hr_analytics")


def get_conn():
    return psycopg2.connect(DATABASE_URL)


def native(v):
    """Convert psycopg2 return types (Decimal, date/datetime) into plain JSON-friendly values."""
    if isinstance(v, Decimal):
        f = float(v)
        return int(f) if f.is_integer() else f
    if isinstance(v, (date, datetime)):
        return v.isoformat()
    return v


def rows_as_dicts(cur):
    cols = [c.name for c in cur.description]
    out = []
    for row in cur.fetchall():
        out.append({col: native(val) for col, val in zip(cols, row)})
    return out


def query(sql, params=None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            return rows_as_dicts(cur)
    finally:
        conn.close()
