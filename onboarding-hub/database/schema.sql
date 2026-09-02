CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  role VARCHAR(120) NOT NULL,
  department VARCHAR(100) NOT NULL,
  location VARCHAR(120) NOT NULL,
  manager_name VARCHAR(120) NOT NULL,
  start_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'ON_TRACK', 'AT_RISK', 'READY')),
  progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  completed_tasks SMALLINT NOT NULL DEFAULT 0 CHECK (completed_tasks >= 0),
  total_tasks SMALLINT NOT NULL DEFAULT 6 CHECK (total_tasks > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  plan JSONB NOT NULL,
  model VARCHAR(100) NOT NULL,
  prompt_version VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'GENERATED'
    CHECK (status IN ('GENERATED', 'APPROVED', 'REJECTED')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS employees_start_date_idx ON employees(start_date);
CREATE INDEX IF NOT EXISTS employees_status_idx ON employees(status);
CREATE INDEX IF NOT EXISTS onboarding_plans_employee_created_idx
  ON onboarding_plans(employee_id, created_at DESC);

INSERT INTO employees
  (full_name, email, role, department, location, manager_name, start_date, status, progress, completed_tasks, total_tasks)
VALUES
  ('Ayesha Khan', 'ayesha@example.com', 'Product Designer', 'Product', 'Islamabad · Hybrid', 'Omar Farooq', CURRENT_DATE + 4, 'ON_TRACK', 72, 5, 7),
  ('Hamza Ali', 'hamza@example.com', 'Platform Engineer', 'Engineering', 'Lahore · Remote', 'Sara Ahmed', CURRENT_DATE + 7, 'AT_RISK', 38, 3, 8),
  ('Maya Chen', 'maya@example.com', 'Growth Lead', 'Marketing', 'Dubai · On-site', 'Daniel Roy', CURRENT_DATE + 11, 'READY', 100, 6, 6),
  ('Bilal Raza', 'bilal@example.com', 'Data Analyst', 'Data', 'Karachi · Hybrid', 'Omar Farooq', CURRENT_DATE + 14, 'ON_TRACK', 56, 4, 7)
ON CONFLICT (email) DO NOTHING;
