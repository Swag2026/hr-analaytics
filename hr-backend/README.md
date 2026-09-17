# HR Analytics Backend

FastAPI + PostgreSQL backend for the HR Executive Analytics System.
Serves the same data shape the React frontend used to read from a static
`HR_DATA.json` file — now from a real database, behind login.

## What it does

- `POST /auth/login` — username + password → JWT access token
- `GET /auth/me` — current logged-in user
- `GET /api/hr-data` — the full dataset (protected, needs `Authorization: Bearer <token>`),
  reassembled from Postgres into the exact same JSON shape the frontend already expects
- `GET/PUT /api/settings` — persisted branch-score weights, alert thresholds, turnover
  definition, display prefs (used to be session-only in the frontend)
- `PUT/DELETE /api/review-decisions/{case_id}` — persist a Review Center decision
  (who decided, what, and when) on an overlap case
- `POST/PUT/DELETE /api/employees` — employee CRUD, with gross/net auto-calculated
  from the components (basic + allowances − deductions) when not supplied explicitly
- `POST/PUT/DELETE /api/payroll-records` — payroll record CRUD (same calc rules)
- `POST /api/upload` — **real** Excel (.xlsx) payroll upload: auto-detects the header
  row and column mapping from common Arabic column-name variants, cleans values
  (Arabic-Indic digits, stray commas), runs the same data-quality checks the original
  analysis used (missing/duplicate national ID, non-positive salary, cross-company
  overlap for the same month), writes corrections to `correction_log`, upserts
  `employees`, and replaces any previous upload for that exact company+month.
  `GET /api/upload/history` lists past uploads.
- `GET /api/payslip/{employee_id}?month=8` — generates a payslip PDF (Arabic, RTL) for
  one employee's payroll record
- `GET /health` — plain health check (no auth)

All write endpoints (`employees`, `payroll-records`, `settings`, `review-decisions`,
`upload`) log to `audit_log` (who did what, when) — check it for a change history:
`SELECT * FROM audit_log ORDER BY created_at DESC;`

### Column matching for uploads

The upload endpoint was built and tested against the field names visible in your
existing `HR_DATA.json` (اسم الموظف / الفرع / الوظيفة / الراتب الأساسي / بدل السكن /
etc. — see `HEADER_SYNONYMS` in `app/upload.py`). It was **not** tested against your
actual raw monthly Excel exports, since I only had the already-processed JSON to work
from. If a real file's column headers don't match, the endpoint returns a clear 422
error naming what it couldn't find — send me a real (or scrubbed) sample file and I'll
extend the synonym list to match your exact column names.


## Deploy on the shared VM (same pattern as rent-tracker / budget-system)

```powershell
# from your Windows laptop
scp -P 2245 -r hr-backend devt@swag-odoo.ddns.net:~/hr-backend
ssh -p 2245 devt@swag-odoo.ddns.net
```

Then on the VM:

```bash
cd ~/hr-backend
cp .env.example .env
nano .env   # set DB_PASSWORD, JWT_SECRET, ALLOWED_ORIGINS (your Vercel URL)

docker compose build
docker compose up -d

# first-time only: seed data + create your login
docker compose exec backend python3 import_data.py /app/HR_DATA.json   # see note below
docker compose exec backend python3 seed_user.py admin "YourStrongPassword" "Tarique" admin

# check it's alive
curl http://localhost:8430/health
```

**Getting HR_DATA.json into the container for import**: the Dockerfile doesn't bundle
`HR_DATA.json` (it's your data, not code). Easiest way — copy it in after the containers
are up:

```bash
docker cp HR_DATA.json hr-analytics-backend:/app/HR_DATA.json
docker compose exec backend python3 import_data.py /app/HR_DATA.json
```

Re-running `import_data.py` any time (e.g. after refreshing payroll data) safely wipes
and reloads all data tables — it does **not** touch the `users` table, so logins survive
a data refresh.

## Cloudflare Tunnel

Add this to `/etc/cloudflared/config.yml` (same tunnel ID `85137e11-a4ff-445c-b166-61eee6c09ccd`
as your other projects), then `sudo systemctl restart cloudflared`:

```yaml
  - hostname: hr-api.swag.sa
    service: http://localhost:8430
```

## Upgrading from the first version

If you already deployed the earlier version of this backend (data-only, no CRUD/upload/
settings), the schema changed (new tables, and `correction_log`'s primary key changed
from a manual ID to an auto-increment one). Easiest path — wipe and reload:

```bash
docker compose down
docker volume rm hr-backend_hr_pgdata
docker compose up -d
docker cp HR_DATA.json hr-analytics-backend:/app/HR_DATA.json
docker compose exec backend python3 import_data.py /app/HR_DATA.json
docker compose exec backend python3 seed_user.py admin "YourPassword" "Tarique" admin
```



```bash
docker compose up -d db
export DATABASE_URL=postgresql://hr_admin:changeme@localhost:5432/hr_analytics
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
psql "$DATABASE_URL" -f schema.sql   # only if not using docker-compose's auto-init
python3 import_data.py HR_DATA.json
python3 seed_user.py admin devpassword "Dev" admin
uvicorn app.main:app --reload
```

## Notes

- `employee_history` is derived from `payroll_records` at query time (grouped by
  `national_id`) rather than stored separately — same data, one less table to keep in sync.
- Review Center decisions and Settings are now persisted (see above) — no longer session-only.
- Real Excel upload replaces the old frontend simulation — see the column-matching note above.
- CORS: set `ALLOWED_ORIGINS` in `.env` to your actual Vercel domain(s), comma-separated,
  once you've confirmed it works with `*`.
- Re-running `import_data.py` (bulk JSON import) still works alongside the new upload
  endpoint — both write to the same tables, so either path keeps the data consistent.
