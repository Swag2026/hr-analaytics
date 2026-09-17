-- HR Analytics System — PostgreSQL schema
-- Mirrors the structure of HR_DATA.json 1:1, one table per top-level collection,
-- so the API can reassemble the exact same JSON shape the React frontend expects.

CREATE TABLE IF NOT EXISTS meta (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  last_updated TEXT,
  current_period TEXT,
  CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS companies (
  company TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS months (
  month INT PRIMARY KEY,
  month_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS monthly_stats (
  id SERIAL PRIMARY KEY,
  company TEXT NOT NULL REFERENCES companies(company) ON DELETE CASCADE,
  month INT NOT NULL,
  month_name TEXT,
  headcount INT,
  total_basic NUMERIC,
  total_net NUMERIC,
  total_gross NUMERIC,
  total_allowances NUMERIC,
  total_deductions NUMERIC,
  total_gosi NUMERIC,
  total_advances NUMERIC,
  total_absence_amount NUMERIC,
  total_absence_days NUMERIC,
  total_overtime NUMERIC,
  avg_basic NUMERIC,
  avg_net NUMERIC,
  UNIQUE(company, month)
);

CREATE TABLE IF NOT EXISTS company_summary (
  company TEXT PRIMARY KEY REFERENCES companies(company) ON DELETE CASCADE,
  label TEXT,
  headcount INT,
  total_net_payroll NUMERIC,
  avg_basic NUMERIC,
  exits_ytd INT,
  new_hires_ytd INT,
  branches_count INT,
  headcount_growth NUMERIC,
  headcount_growth_pct NUMERIC,
  payroll_growth_pct NUMERIC,
  exits_confidence TEXT,
  total_absence_amount NUMERIC,
  total_deductions NUMERIC
);

CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  company TEXT NOT NULL REFERENCES companies(company) ON DELETE CASCADE,
  branch TEXT NOT NULL,
  headcount INT,
  total_net NUMERIC,
  total_basic NUMERIC,
  avg_basic NUMERIC,
  total_absence_days NUMERIC,
  total_absence_amount NUMERIC,
  total_deductions NUMERIC,
  transfers_in INT,
  transfers_out INT,
  outflow_estimate INT,
  turnover_rate_estimate NUMERIC,
  UNIQUE(company, branch)
);

CREATE TABLE IF NOT EXISTS branches_monthly (
  id SERIAL PRIMARY KEY,
  company TEXT NOT NULL REFERENCES companies(company) ON DELETE CASCADE,
  branch TEXT NOT NULL,
  month INT NOT NULL,
  month_name TEXT,
  headcount INT,
  total_net NUMERIC,
  total_basic NUMERIC,
  absence_amount NUMERIC,
  absence_days NUMERIC,
  deductions NUMERIC,
  total_deductions NUMERIC
);

CREATE TABLE IF NOT EXISTS branch_transfers (
  id SERIAL PRIMARY KEY,
  name TEXT,
  national_id TEXT,
  company TEXT,
  company_label TEXT,
  previous_branch TEXT,
  new_branch TEXT,
  effective_month INT,
  effective_month_name TEXT,
  basic NUMERIC
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  national_id TEXT,
  job_no TEXT,
  name TEXT,
  company TEXT,
  company_label TEXT,
  branch TEXT,
  job_title TEXT,
  status TEXT,
  as_of_month INT,
  as_of_month_name TEXT,
  is_active BOOLEAN,
  basic NUMERIC,
  net NUMERIC,
  housing NUMERIC,
  transport NUMERIC,
  other_allowance NUMERIC,
  overtime NUMERIC,
  total_allowances NUMERIC,
  gross NUMERIC,
  absence_days NUMERIC,
  absence_amount NUMERIC,
  deductions NUMERIC,
  total_deductions NUMERIC,
  gosi NUMERIC,
  advances NUMERIC,
  other_total NUMERIC,
  total_deducted NUMERIC
);
CREATE INDEX IF NOT EXISTS idx_employees_national_id ON employees(national_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company);

CREATE TABLE IF NOT EXISTS payroll_records (
  id SERIAL PRIMARY KEY,
  month INT NOT NULL,
  month_name TEXT,
  company TEXT,
  company_label TEXT,
  job_no TEXT,
  national_id TEXT,
  name TEXT,
  branch TEXT,
  job_title TEXT,
  status TEXT,
  basic NUMERIC,
  housing NUMERIC,
  transport NUMERIC,
  other_allowance NUMERIC,
  overtime NUMERIC,
  total_allowances NUMERIC,
  gross NUMERIC,
  absence_days NUMERIC,
  absence_amount NUMERIC,
  deductions NUMERIC,
  total_deductions NUMERIC,
  advances NUMERIC,
  gosi NUMERIC,
  other_total NUMERIC,
  total_deducted NUMERIC,
  net NUMERIC
);
CREATE INDEX IF NOT EXISTS idx_payroll_national_id ON payroll_records(national_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month_company ON payroll_records(month, company);

CREATE TABLE IF NOT EXISTS movement_ledger (
  id SERIAL PRIMARY KEY,
  national_id TEXT,
  employee_name TEXT,
  previous_company TEXT,
  previous_branch TEXT,
  new_company TEXT,
  new_branch TEXT,
  movement_type TEXT,
  previous_salary NUMERIC,
  new_salary NUMERIC,
  salary_change NUMERIC,
  effective_month INT,
  evidence TEXT
);

CREATE TABLE IF NOT EXISTS overlap_cases (
  id SERIAL PRIMARY KEY,
  name TEXT,
  national_id TEXT,
  company_1 TEXT,
  company_1_label TEXT,
  company_2 TEXT,
  company_2_label TEXT,
  overlap_months_names TEXT,
  salary_1 NUMERIC,
  salary_2 NUMERIC,
  potential_exposure NUMERIC,
  risk_level TEXT,
  review_status TEXT,
  evidence TEXT
);

CREATE TABLE IF NOT EXISTS resolved_cases (
  id SERIAL PRIMARY KEY,
  national_id TEXT,
  employee_name TEXT,
  previous_company TEXT,
  previous_branch TEXT,
  new_company TEXT,
  new_branch TEXT,
  movement_type TEXT,
  previous_salary NUMERIC,
  new_salary NUMERIC,
  salary_change NUMERIC,
  effective_month INT,
  evidence TEXT,
  resolution TEXT
);

CREATE TABLE IF NOT EXISTS quality_summary (
  rule TEXT PRIMARY KEY,
  count INT
);

CREATE TABLE IF NOT EXISTS quality_scores (
  company TEXT PRIMARY KEY REFERENCES companies(company) ON DELETE CASCADE,
  score INT
);

CREATE TABLE IF NOT EXISTS quality_issues (
  issue_id SERIAL PRIMARY KEY,
  rule TEXT,
  severity TEXT,
  company TEXT,
  month INT,
  file TEXT,
  sheet TEXT,
  source_row TEXT,
  employee_name TEXT,
  detail TEXT
);

CREATE TABLE IF NOT EXISTS correction_log (
  id SERIAL PRIMARY KEY,
  legacy_id INT,
  file TEXT,
  sheet TEXT,
  source_row TEXT,
  field TEXT,
  original TEXT,
  corrected TEXT,
  type TEXT,
  reason TEXT,
  confidence INT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS files_summary (
  id SERIAL PRIMARY KEY,
  file TEXT,
  company TEXT,
  company_label TEXT,
  month INT,
  month_name TEXT
);

-- ---------------- Auth ----------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- Review Center decisions (persisted) ----------------
CREATE TABLE IF NOT EXISTS review_decisions (
  case_id INT PRIMARY KEY REFERENCES overlap_cases(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,       -- DOUBLE_PAYMENT | TRANSFER | DATA_ERROR | CLOSED
  decided_by INT REFERENCES users(id),
  decided_by_name TEXT,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- App settings (persisted, single JSON blob) ----------------
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by INT REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- Audit trail for write operations (CRUD + uploads) ----------------
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  username TEXT,
  action TEXT NOT NULL,          -- e.g. employee.create, employee.update, employee.delete, payroll.upload
  entity TEXT,                   -- e.g. employees, payroll_records
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------- Payroll uploads (real Excel import runs) ----------------
CREATE TABLE IF NOT EXISTS payroll_uploads (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  company TEXT,
  month INT,
  month_name TEXT,
  uploaded_by INT REFERENCES users(id),
  uploaded_by_name TEXT,
  row_count INT,
  issues_count INT,
  corrections_count INT,
  quality_score INT,
  status TEXT NOT NULL DEFAULT 'completed',   -- completed | failed
  summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
