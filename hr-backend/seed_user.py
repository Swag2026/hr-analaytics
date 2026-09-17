"""
Create or update a login user.

Usage:
    python3 seed_user.py <username> <password> ["Full Name"] [role]

Example:
    python3 seed_user.py admin "StrongPass123" "Tarique" admin

If the username already exists, this updates its password/name/role instead
of failing — handy for resetting a forgotten password.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db import get_conn
from app.auth import hash_password


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 seed_user.py <username> <password> [\"Full Name\"] [role]")
        sys.exit(1)

    username = sys.argv[1]
    password = sys.argv[2]
    full_name = sys.argv[3] if len(sys.argv) > 3 else username
    role = sys.argv[4] if len(sys.argv) > 4 else "admin"

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO users (username, password_hash, full_name, role)
                   VALUES (%s, %s, %s, %s)
                   ON CONFLICT (username) DO UPDATE
                   SET password_hash = EXCLUDED.password_hash,
                       full_name = EXCLUDED.full_name,
                       role = EXCLUDED.role""",
                (username, hash_password(password), full_name, role),
            )
        conn.commit()
        print(f"User '{username}' ready (role={role}).")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
