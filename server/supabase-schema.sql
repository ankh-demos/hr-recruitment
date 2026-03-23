-- Remax Sky HR Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- bcrypt hashed
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'manager', 'recruiter')) DEFAULT 'recruiter',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin user (password: admin123 - change in production!)
-- Hash generated with bcrypt for 'admin123'
INSERT INTO users (username, password, full_name, email, role, is_active)
VALUES ('admin', '$2b$10$hy.faUthtTGbrbt8KEPAY.ryfuaODyEMajLUowKpD00CN46Saapsu', 'System Admin', 'admin@hr.com', 'admin', true);

-- ============================================
-- CANDIDATES TABLE
-- ============================================
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  skills JSONB DEFAULT '[]',
  experience INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('new', 'screening', 'interviewing', 'offered', 'hired', 'rejected')) DEFAULT 'new',
  applied_job_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- JOBS TABLE
-- ============================================
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  type TEXT CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')) DEFAULT 'full-time',
  description TEXT,
  requirements JSONB DEFAULT '[]',
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'MNT',
  status TEXT CHECK (status IN ('draft', 'open', 'closed', 'on-hold')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTERVIEWS TABLE
-- ============================================
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INTEGER DEFAULT 60,
  type TEXT CHECK (type IN ('phone', 'video', 'onsite', 'technical')) DEFAULT 'video',
  interviewers JSONB DEFAULT '[]',
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- APPLICATIONS TABLE
-- ============================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Personal Information
  family_name TEXT, -- Ургийн овог
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  interested_office TEXT,
  available_date DATE,
  birth_place TEXT,
  ethnicity TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  register_number TEXT,
  home_address TEXT,
  phone TEXT,
  emergency_phone TEXT,
  email TEXT,
  facebook TEXT,
  -- Nested data as JSONB
  family_members JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  work_experience JSONB DEFAULT '[]',
  awards JSONB DEFAULT '[]',
  -- Additional fields
  other_skills TEXT,
  strengths_weaknesses TEXT,
  has_driver_license BOOLEAN DEFAULT false,
  photo_url TEXT,
  referral_source TEXT,
  signature_url TEXT,
  -- Meetings (3-level interviews)
  meeting1 JSONB,
  meeting2 JSONB,
  meeting3 JSONB,
  -- Fire UP training
  training_number TEXT,
  fireup_date DATE,
  -- Transfer flag
  is_transfer BOOLEAN DEFAULT false, -- Шилжиж орж ирсэн эсэх
  -- Status
  status TEXT CHECK (status IN ('new', 'interviewing', 'fireup', 'iconnect', 'cancelled')) DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  -- iConnect name
  iconnect_name TEXT,
  -- Personal Information
  family_name TEXT,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  interested_office TEXT,
  birth_place TEXT,
  ethnicity TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  register_number TEXT,
  home_address TEXT,
  phone TEXT,
  emergency_phone TEXT,
  email TEXT,
  facebook TEXT,
  -- Nested data as JSONB
  family_members JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  work_experience JSONB DEFAULT '[]',
  awards JSONB DEFAULT '[]',
  -- Additional fields
  other_skills TEXT,
  strengths_weaknesses TEXT,
  has_driver_license BOOLEAN DEFAULT false,
  photo_url TEXT,
  referral_source TEXT,
  signature_url TEXT,
  training_number TEXT,
  -- Employee specific fields
  certificate_number TEXT,
  citizen_registration_number TEXT,
  szh_certificate_number TEXT,
  certificate_date DATE,
  remax_email TEXT,
  mls TEXT UNIQUE,
  bank TEXT,
  account_number TEXT,
  district TEXT,
  detailed_address TEXT,
  children_count INTEGER DEFAULT 0,
  employment_start_date DATE,
  office_name TEXT,
  has_top BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('active', 'new_0_3', 'inactive_transaction', 'inactive', 'active_no_transaction', 'on_leave', 'maternity_leave', 'team_member')) DEFAULT 'active',
  hired_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESIGNED AGENTS TABLE
-- ============================================
CREATE TABLE resigned_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID, -- Original employee ID (may be deleted)
  application_id UUID,
  -- iConnect name
  iconnect_name TEXT,
  -- Personal Information (copied from employee)
  family_name TEXT,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  interested_office TEXT,
  birth_place TEXT,
  ethnicity TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  register_number TEXT,
  home_address TEXT,
  phone TEXT,
  emergency_phone TEXT,
  email TEXT,
  facebook TEXT,
  -- Nested data as JSONB
  family_members JSONB DEFAULT '[]',
  education JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  work_experience JSONB DEFAULT '[]',
  awards JSONB DEFAULT '[]',
  -- Additional fields
  other_skills TEXT,
  strengths_weaknesses TEXT,
  has_driver_license BOOLEAN DEFAULT false,
  photo_url TEXT,
  referral_source TEXT,
  signature_url TEXT,
  training_number TEXT,
  -- Employee fields
  certificate_number TEXT,
  citizen_registration_number TEXT,
  szh_certificate_number TEXT,
  certificate_date DATE,
  remax_email TEXT,
  mls TEXT,
  bank TEXT,
  account_number TEXT,
  district TEXT,
  detailed_address TEXT,
  children_count INTEGER DEFAULT 0,
  hired_date TIMESTAMPTZ,
  employment_start_date DATE,
  office_name TEXT,
  has_top BOOLEAN DEFAULT false,
  -- Resignation specific fields
  worked_months INTEGER DEFAULT 0,
  resigned_date DATE NOT NULL,
  resignation_reason TEXT CHECK (resignation_reason IN (
    'Шилжсэн', 'Ажиллах чадваргүй', 'Зайлшгүй шалтгаан', 
    'Байгууллагын соёл таалагдаагүй', 'Давхар ажилтай', 
    'Оффисын зүгээс гэрээ цуцалсан', 'Урт хугацааны чөлөө авсан'
  )),
  resignation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGENT RANKS TABLE
-- ============================================
CREATE TABLE agent_ranks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL, -- MLS number
  agent_name TEXT NOT NULL,
  contract_number TEXT,
  current_rank TEXT CHECK (current_rank IN ('Стандарт', 'Силвер', 'Голд', 'Платиниум', 'Даймонд')) DEFAULT 'Стандарт',
  current_start_date DATE NOT NULL,
  current_end_date DATE NOT NULL,
  rank_history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_mls ON employees(mls);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_resigned_agents_mls ON resigned_agents(mls);
CREATE INDEX idx_agent_ranks_agent_id ON agent_ranks(agent_id);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- ROW LEVEL SECURITY (OPTIONAL)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE resigned_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_ranks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to access all data (adjust as needed)
CREATE POLICY "Allow authenticated access" ON users FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON candidates FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON jobs FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON interviews FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON applications FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON employees FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON resigned_agents FOR ALL USING (true);
CREATE POLICY "Allow authenticated access" ON agent_ranks FOR ALL USING (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resigned_agents_updated_at BEFORE UPDATE ON resigned_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_ranks_updated_at BEFORE UPDATE ON agent_ranks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
