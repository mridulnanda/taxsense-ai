/**
 * Cloud Accounting Platform Database Schema
 *
 * Comprehensive PostgreSQL schema for world-class accounting platform.
 * Supports multi-entity, multi-currency, double-entry bookkeeping.
 */

-- ============================================================================
-- ORGANIZATIONS & USERS
-- ============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  industry VARCHAR(100),
  country_code CHAR(2),
  base_currency CHAR(3) NOT NULL DEFAULT 'USD',
  fiscal_year_start SMALLINT NOT NULL DEFAULT 1,
  enabled_features TEXT[] DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_tax_id UNIQUE (tax_id)
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'EMPLOYEE',
  permissions TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_org_email UNIQUE (organization_id, email)
);

-- ============================================================================
-- CHART OF ACCOUNTS
-- ============================================================================

CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  account_type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  normal_balance VARCHAR(10) NOT NULL,
  is_reconciled BOOLEAN DEFAULT FALSE,
  last_reconciled_at TIMESTAMP,
  bank_account_id UUID,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  archived_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_org_code UNIQUE (organization_id, code),
  CONSTRAINT valid_normal_balance CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
  CONSTRAINT valid_account_type CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'COST_OF_GOODS_SOLD'))
);

CREATE INDEX idx_chart_org_type ON chart_of_accounts(organization_id, account_type);
CREATE INDEX idx_chart_parent ON chart_of_accounts(parent_account_id);
CREATE INDEX idx_chart_active ON chart_of_accounts(organization_id, is_active, is_archived);

-- ============================================================================
-- JOURNAL & ENTRIES (Core double-entry bookkeeping)
-- ============================================================================

CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reference_number VARCHAR(50) NOT NULL,
  journal_type VARCHAR(50) NOT NULL,
  total_debit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_credit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  is_balanced BOOLEAN NOT NULL DEFAULT FALSE,
  memo TEXT,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  posted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_org_ref UNIQUE (organization_id, reference_number),
  CONSTRAINT valid_journal_type CHECK (journal_type IN ('INVOICE', 'EXPENSE', 'TRANSFER', 'ADJUSTMENT', 'BANK_FEED')),
  CONSTRAINT valid_journal_status CHECK (status IN ('DRAFT', 'POSTED', 'LOCKED', 'REVERSED'))
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit DECIMAL(15, 2),
  credit DECIMAL(15, 2),
  description TEXT,
  tax_line_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_debit_credit CHECK ((debit IS NOT NULL AND credit IS NULL) OR (debit IS NULL AND credit IS NOT NULL) OR (debit IS NULL AND credit IS NULL))
);

CREATE INDEX idx_journal_org_date ON journals(organization_id, posted_at);
CREATE INDEX idx_journal_type ON journals(journal_type, status);
CREATE INDEX idx_entry_account ON journal_entries(account_id);

-- ============================================================================
-- INVOICING
-- ============================================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  sent_at TIMESTAMP,
  viewed_at TIMESTAMP,
  paid_at TIMESTAMP,
  customer_id VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_address JSONB,
  currency_code CHAR(3) NOT NULL,
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL,
  amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
  amount_due DECIMAL(15, 2) NOT NULL,
  notes TEXT,
  terms TEXT,
  memo TEXT,
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  approval_required BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  linked_journal_id UUID REFERENCES journals(id),
  linked_expense_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT unique_org_invoice UNIQUE (organization_id, invoice_number),
  CONSTRAINT valid_invoice_status CHECK (status IN ('DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'))
);

CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 4) NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  tax_rate DECIMAL(5, 2),
  line_total DECIMAL(15, 2) NOT NULL,
  tax_amount DECIMAL(15, 2),
  account_id UUID REFERENCES chart_of_accounts(id),
  project_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  payment_gateway VARCHAR(50) NOT NULL,
  external_link_id VARCHAR(255),
  public_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_org_date ON invoices(organization_id, invoice_date);
CREATE INDEX idx_invoice_status ON invoices(status);
CREATE INDEX idx_invoice_customer ON invoices(customer_id);
CREATE INDEX idx_invoice_due ON invoices(due_date);

-- ============================================================================
-- EXPENSE MANAGEMENT
-- ============================================================================

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reference_number VARCHAR(50) NOT NULL,
  expense_date DATE NOT NULL,
  submitted_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_date TIMESTAMP,
  vendor_id VARCHAR(100) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_email VARCHAR(255),
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  receipt_url TEXT,
  receipt_ocr JSONB,
  project_id VARCHAR(100),
  department_id VARCHAR(100),
  cost_center VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  tax_amount DECIMAL(15, 2),
  taxable_amount DECIMAL(15, 2),
  is_tax_deductible BOOLEAN DEFAULT TRUE,
  linked_journal_id UUID REFERENCES journals(id),
  account_id UUID REFERENCES chart_of_accounts(id),
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  requires_reimbursement BOOLEAN DEFAULT FALSE,
  reimbursed_amount DECIMAL(15, 2),
  reimbursed_date TIMESTAMP,
  reimbursed_via VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_org_expense UNIQUE (organization_id, reference_number),
  CONSTRAINT valid_expense_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REIMBURSED', 'CANCELLED'))
);

CREATE TABLE mileage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES users(id),
  start_location VARCHAR(255) NOT NULL,
  end_location VARCHAR(255) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  distance DECIMAL(10, 2) NOT NULL,
  mileage_rate DECIMAL(10, 4) NOT NULL,
  total_cost DECIMAL(15, 2) NOT NULL,
  purpose TEXT,
  project_id VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expense_org_date ON expenses(organization_id, expense_date);
CREATE INDEX idx_expense_status ON expenses(status);
CREATE INDEX idx_expense_vendor ON expenses(vendor_id);

-- ============================================================================
-- BANKING
-- ============================================================================

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bank_name VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50),
  routing_number VARCHAR(20),
  iban VARCHAR(34),
  swift VARCHAR(20),
  currency_code CHAR(3) NOT NULL,
  connection_provider VARCHAR(50),
  external_account_id VARCHAR(255),
  is_connected BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMP,
  current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  cleared_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  uncleared_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  last_reconciled_at TIMESTAMP,
  linked_account_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_transaction_id VARCHAR(255),
  transaction_date DATE NOT NULL,
  post_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  type VARCHAR(10) NOT NULL,
  description VARCHAR(255),
  counterparty_name VARCHAR(255),
  counterparty_account_number VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  matched_invoice_id UUID REFERENCES invoices(id),
  matched_expense_id UUID REFERENCES expenses(id),
  matched_journal_id UUID REFERENCES journals(id),
  suggested_account_id UUID REFERENCES chart_of_accounts(id),
  linked_account_id UUID REFERENCES chart_of_accounts(id),
  tags TEXT[] DEFAULT '{}',
  ai_confidence DECIMAL(3, 2),
  categorized_by VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_type CHECK (type IN ('DEBIT', 'CREDIT')),
  CONSTRAINT valid_status CHECK (status IN ('PENDING', 'CLEARED', 'RECONCILED', 'FLAGGED'))
);

CREATE TABLE bank_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reconciliation_date TIMESTAMP NOT NULL,
  statement_start_date DATE NOT NULL,
  statement_end_date DATE NOT NULL,
  statement_balance DECIMAL(15, 2) NOT NULL,
  reconciled_balance DECIMAL(15, 2) NOT NULL,
  outstanding_deposits DECIMAL(15, 2) NOT NULL DEFAULT 0,
  outstanding_checks DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  reconciled_transactions INTEGER DEFAULT 0,
  unreconciled_transactions INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('IN_PROGRESS', 'COMPLETE', 'APPROVED', 'REJECTED'))
);

CREATE TABLE discrepancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id UUID NOT NULL REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2),
  description TEXT,
  severity VARCHAR(20) NOT NULL DEFAULT 'WARNING',
  is_resolved BOOLEAN DEFAULT FALSE,
  resolution TEXT,
  CONSTRAINT valid_type CHECK (type IN ('MISSING_TRANSACTION', 'AMOUNT_MISMATCH', 'DATE_MISMATCH', 'DUPLICATE')),
  CONSTRAINT valid_severity CHECK (severity IN ('INFO', 'WARNING', 'ERROR'))
);

CREATE INDEX idx_bank_org ON bank_accounts(organization_id);
CREATE INDEX idx_transaction_account ON bank_transactions(bank_account_id, transaction_date);
CREATE INDEX idx_transaction_status ON bank_transactions(status);
CREATE INDEX idx_recon_org_date ON bank_reconciliations(organization_id, reconciliation_date);

-- ============================================================================
-- AUDIT & ATTACHMENTS
-- ============================================================================

CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  action VARCHAR(50) NOT NULL,
  changed_fields JSONB,
  performed_by UUID REFERENCES users(id),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'RECONCILE'))
);

CREATE INDEX idx_audit_org_entity ON audit_logs(organization_id, entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- ============================================================================
-- REPORTING & BUDGETS
-- ============================================================================

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  budget_amount DECIMAL(15, 2) NOT NULL,
  period VARCHAR(50) NOT NULL,
  fiscal_year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  report_data JSONB NOT NULL,
  pdf_url TEXT,
  excel_url TEXT,
  generated_by UUID REFERENCES users(id),
  generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_budget_org_account ON budgets(organization_id, account_id);
CREATE INDEX idx_report_org_type ON financial_reports(organization_id, report_type);
CREATE INDEX idx_report_date ON financial_reports(start_date, end_date);

-- ============================================================================
-- INTEGRATIONS & WEBHOOKS
-- ============================================================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_name VARCHAR(100) NOT NULL,
  provider_type VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  api_key_encrypted TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  config JSONB,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  status VARCHAR(50) DEFAULT 'PENDING',
  retry_count INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

CREATE VIEW account_balances AS
SELECT
  c.organization_id,
  c.id,
  c.code,
  c.name,
  c.account_type,
  c.normal_balance,
  COALESCE(SUM(CASE WHEN je.debit IS NOT NULL THEN je.debit ELSE 0 END) -
           SUM(CASE WHEN je.credit IS NOT NULL THEN je.credit ELSE 0 END), 0) AS balance,
  MAX(j.posted_at) AS last_transaction_date
FROM chart_of_accounts c
LEFT JOIN journal_entries je ON c.id = je.account_id
LEFT JOIN journals j ON je.journal_id = j.id AND j.status IN ('POSTED', 'LOCKED')
WHERE c.is_active = TRUE AND c.is_archived = FALSE
GROUP BY c.organization_id, c.id, c.code, c.name, c.account_type, c.normal_balance;

CREATE VIEW invoice_summary AS
SELECT
  i.organization_id,
  COUNT(*) as total_invoices,
  SUM(CASE WHEN i.status = 'PAID' THEN 1 ELSE 0 END) as paid_count,
  SUM(CASE WHEN i.status IN ('DRAFT', 'SENT', 'VIEWED') THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN i.status = 'OVERDUE' THEN 1 ELSE 0 END) as overdue_count,
  SUM(i.total_amount) as total_revenue,
  SUM(i.amount_paid) as total_collected,
  SUM(i.amount_due) as total_outstanding
FROM invoices i
WHERE i.deleted_at IS NULL
GROUP BY i.organization_id;

CREATE VIEW expense_summary AS
SELECT
  e.organization_id,
  COUNT(*) as total_expenses,
  SUM(CASE WHEN e.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN e.status IN ('DRAFT', 'SUBMITTED') THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN e.status = 'REIMBURSED' THEN 1 ELSE 0 END) as reimbursed_count,
  SUM(e.amount) as total_expenses,
  SUM(CASE WHEN e.status = 'APPROVED' THEN e.amount ELSE 0 END) as total_approved,
  SUM(CASE WHEN e.status = 'REIMBURSED' THEN e.amount ELSE 0 END) as total_reimbursed
FROM expenses e
GROUP BY e.organization_id;

-- ============================================================================
-- TRIGGERS FOR AUDIT & UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_timestamp BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chart_of_accounts_timestamp BEFORE UPDATE ON chart_of_accounts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_timestamp BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_expenses_timestamp BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Policies would be configured per application requirements
-- Default: deny all access, allow specific roles/users
