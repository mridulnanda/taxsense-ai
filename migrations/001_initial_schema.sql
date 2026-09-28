-- Initial schema for TaxSense AI
-- FY 2025-26 / AY 2026-27

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "hstore";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  pan VARCHAR(10) UNIQUE,
  aadhaar_hash VARCHAR(255),
  user_type VARCHAR(50) NOT NULL DEFAULT 'individual', -- individual, huf, partnership, corporation
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, suspended
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT pan_format CHECK (pan ~* '^[A-Z]{5}[0-9]{4}[A-Z]$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_pan ON users(pan);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  changes HSTORE,
  ip_address INET,
  user_agent VARCHAR(500),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Tax computations
CREATE TABLE computations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  financial_year VARCHAR(10) NOT NULL, -- 2025-26
  assessment_year VARCHAR(10) NOT NULL, -- 2026-27
  income_sources JSONB,
  deductions JSONB,
  tax_calculation JSONB,
  net_taxable_income DECIMAL(15, 2),
  tax_amount DECIMAL(15, 2),
  surcharge DECIMAL(15, 2),
  health_education_cess DECIMAL(15, 2),
  total_tax DECIMAL(15, 2),
  tax_refund DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'draft', -- draft, finalized, filed, rejected
  file_status VARCHAR(50),
  acknowledgment_no VARCHAR(255),
  filing_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_computations_user_id ON computations(user_id);
CREATE INDEX idx_computations_financial_year ON computations(financial_year);
CREATE INDEX idx_computations_status ON computations(status);
CREATE INDEX idx_computations_created_at ON computations(created_at);

-- Income sources
CREATE TABLE income_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  computation_id UUID NOT NULL REFERENCES computations(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL, -- salary, business, capital_gain, other
  description VARCHAR(500),
  amount DECIMAL(15, 2) NOT NULL,
  tax_treated DECIMAL(15, 2),
  exemptions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_income_sources_computation_id ON income_sources(computation_id);
CREATE INDEX idx_income_sources_source_type ON income_sources(source_type);

-- Deductions
CREATE TABLE deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  computation_id UUID NOT NULL REFERENCES computations(id) ON DELETE CASCADE,
  deduction_type VARCHAR(50) NOT NULL, -- 80c, 80d, 80tta, etc
  section VARCHAR(20),
  amount DECIMAL(15, 2) NOT NULL,
  description VARCHAR(500),
  documents JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deductions_computation_id ON deductions(computation_id);
CREATE INDEX idx_deductions_deduction_type ON deductions(deduction_type);

-- Document uploads
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  computation_id UUID REFERENCES computations(id),
  document_type VARCHAR(100) NOT NULL, -- aadhar, pan, income_certificate, etc
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  file_hash VARCHAR(64),
  mime_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);

-- Tax rules and rates
CREATE TABLE tax_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  financial_year VARCHAR(10) NOT NULL,
  rule_type VARCHAR(100) NOT NULL, -- slab, exemption, deduction, etc
  category VARCHAR(100),
  description TEXT,
  rule_data JSONB NOT NULL,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tax_rules_financial_year ON tax_rules(financial_year);
CREATE INDEX idx_tax_rules_rule_type ON tax_rules(rule_type);

-- Session management
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  token VARCHAR(500) NOT NULL UNIQUE,
  user_agent VARCHAR(500),
  ip_address INET,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Activity log
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  metadata JSONB,
  ip_address INET,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activity_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to computations
CREATE TRIGGER update_computations_updated_at
BEFORE UPDATE ON computations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to documents
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to tax_rules
CREATE TRIGGER update_tax_rules_updated_at
BEFORE UPDATE ON tax_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create view for computation summary
CREATE VIEW computation_summary AS
SELECT
  c.id,
  c.user_id,
  u.email,
  c.financial_year,
  c.assessment_year,
  c.net_taxable_income,
  c.tax_amount,
  c.total_tax,
  c.tax_refund,
  c.status,
  c.created_at,
  c.updated_at,
  COUNT(DISTINCT i.id) as income_source_count,
  COUNT(DISTINCT d.id) as deduction_count
FROM computations c
JOIN users u ON c.user_id = u.id
LEFT JOIN income_sources i ON c.id = i.computation_id
LEFT JOIN deductions d ON c.id = d.computation_id
GROUP BY c.id, u.email;
