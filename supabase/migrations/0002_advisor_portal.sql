-- TaxSense AI — Advisor Portal Schema (Session 6)
-- Multi-tenant architecture for tax advisors, CPAs, and CA firms
-- RLS: tenant-isolation with row-level security
-- Role hierarchy: Partner → Manager → Associate → Staff → Client

create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. ADVISOR ORGANIZATIONS (Multi-tenant core)
-- ============================================================================
create table public.advisor_organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  country text not null check (country in ('US', 'UK', 'CA', 'AU', 'IN', 'SG')),
  industry text check (industry in ('individual_advisory', 'firm', 'enterprise', 'startup')),
  -- Subscription & limits
  subscription_tier text default 'starter' check (subscription_tier in ('starter', 'professional', 'enterprise')),
  billing_email text,
  billing_phone text,
  max_clients integer default 100,
  max_team_members integer default 10,
  max_monthly_reports integer default 500,
  -- Feature flags
  features jsonb default '{
    "tax_planning": true,
    "compliance_monitoring": true,
    "e_signatures": true,
    "bulk_operations": true,
    "api_access": false,
    "custom_reports": false,
    "team_collaboration": true
  }'::jsonb,
  -- Branding
  logo_url text,
  primary_color text default '#1e40af',
  -- Tax jurisdictions covered
  jurisdictions text[] default '{"US"}'::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- ============================================================================
-- 2. TEAM MEMBERS & ROLES
-- ============================================================================
create type advisor_role as enum ('partner', 'manager', 'associate', 'staff');

create table public.advisor_team_members (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role advisor_role not null default 'staff',
  -- Specializations (for client assignment)
  specializations text[] default '{"general"}'::text[],
  -- Performance metrics
  billable_rate numeric(10, 2),
  active_clients integer default 0,
  total_clients_served integer default 0,
  -- Status
  status text default 'active' check (status in ('active', 'inactive', 'pending_invite')),
  invite_sent_at timestamptz,
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, user_id),
  unique (organization_id, email)
);

-- ============================================================================
-- 3. CLIENTS
-- ============================================================================
create type client_status as enum ('prospect', 'active', 'churned', 'paused');
create type client_type as enum ('individual', 'business', 'trust', 'nonprofit');

create table public.advisor_clients (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,

  -- Contact info
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  alternate_phone text,

  -- Client classification
  client_type client_type default 'individual',
  status client_status default 'prospect',
  industry text,
  annual_income numeric(15, 2),

  -- Tax info
  ssn_last_four text,
  tax_id_last_four text,
  ein text,  -- For businesses

  -- Addresses
  primary_address jsonb,
  correspondence_address jsonb,

  -- Status & tracking
  date_acquired timestamptz default now(),
  last_return_filed timestamptz,
  next_deadline timestamptz,

  -- Segment & tags
  segments text[] default '{"general"}'::text[],
  tags text[] default '{}'::text[],

  -- Primary advisor assignment
  primary_advisor_id uuid references public.advisor_team_members(id) on delete set null,

  -- Preferences & communication
  communication_preference text default 'email' check (communication_preference in ('email', 'phone', 'sms', 'portal')),
  preferred_contact_method text,
  notes text,

  -- Metrics
  lifetime_value numeric(15, 2) default 0,
  total_fees_paid numeric(15, 2) default 0,
  engagement_score numeric(3, 2) default 5.0,

  -- RLS
  created_by uuid references public.advisor_team_members(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Client secondary advisors (many-to-many)
create table public.advisor_client_secondary_advisors (
  client_id uuid not null references public.advisor_clients(id) on delete cascade,
  advisor_id uuid not null references public.advisor_team_members(id) on delete cascade,
  role text default 'reviewer' check (role in ('reviewer', 'preparer', 'specialist')),
  created_at timestamptz default now(),
  primary key (client_id, advisor_id)
);

-- ============================================================================
-- 4. TAX RETURNS
-- ============================================================================
create type return_status as enum ('prospect', 'intake', 'draft', 'review', 'ready_for_signature', 'client_review', 'filed', 'accepted', 'amended');
create type return_type as enum ('1040', '1041', '1065', '1120', '1120S', 'T1', 'T1 General', 'SA', 'ITR1', 'ITR2', 'ITR3', 'ITR4');

create table public.advisor_tax_returns (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,
  client_id uuid not null references public.advisor_clients(id) on delete cascade,

  -- Return details
  tax_year integer not null,
  return_type return_type not null,
  status return_status default 'draft',

  -- Workflow tracking
  intake_completed boolean default false,
  intake_completed_at timestamptz,
  draft_started_at timestamptz,
  ready_for_review_at timestamptz,
  client_review_started_at timestamptz,

  -- Filing info
  filing_date timestamptz,
  due_date timestamptz,
  extension_requested boolean default false,
  extension_deadline timestamptz,

  -- Amounts
  gross_income numeric(15, 2),
  total_tax numeric(15, 2),
  estimated_refund numeric(15, 2),
  tax_liability numeric(15, 2),

  -- Status tracking
  assigned_to uuid references public.advisor_team_members(id) on delete set null,
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),

  -- Document references
  documents_complete boolean default false,
  document_checklist jsonb default '{"income": false, "deductions": false, "credits": false}'::jsonb,

  -- Computation snapshot
  computation jsonb,

  -- E-signature tracking
  signature_request_sent boolean default false,
  signature_request_sent_at timestamptz,
  client_signed_at timestamptz,
  advisor_signed_at timestamptz,

  -- Amendment tracking
  amended_from_return_id uuid references public.advisor_tax_returns(id) on delete set null,
  amendment_reason text,

  -- Notes
  internal_notes text,
  client_notes text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 5. DOCUMENTS & VERSIONS
-- ============================================================================
create table public.advisor_documents (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,
  client_id uuid not null references public.advisor_clients(id) on delete cascade,

  -- Document metadata
  document_type text not null check (document_type in ('income', 'deduction', 'credit', 'supporting', 'return', 'correspondence')),
  file_name text not null,
  file_url text not null,
  file_size integer,
  file_hash text unique,  -- For deduplication

  -- Classification & OCR
  category text,
  extracted_data jsonb,  -- OCR results
  confidence_score numeric(3, 2),

  -- Status
  status text default 'uploaded' check (status in ('uploaded', 'verified', 'archived')),
  tax_year integer,

  -- Version control
  version_number integer default 1,
  parent_document_id uuid references public.advisor_documents(id) on delete set null,

  -- Retention
  retention_policy text default 'standard' check (retention_policy in ('standard', 'extended', 'archive')),
  retention_until timestamptz,

  uploaded_by uuid references public.advisor_team_members(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 6. REPORTS & TEMPLATES
-- ============================================================================
create table public.advisor_report_templates (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,

  -- Template metadata
  name text not null,
  description text,
  category text default 'general' check (category in ('tax_summary', 'planning', 'compliance', 'letter', 'analysis', 'custom')),

  -- Template design
  template_html text,  -- HTML template with {{placeholders}}
  footer_html text,
  header_html text,

  -- Branding
  use_organization_branding boolean default true,
  custom_css text,

  -- Metadata
  is_default boolean default false,
  is_public boolean default true,

  created_by uuid references public.advisor_team_members(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.advisor_reports (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,
  client_id uuid references public.advisor_clients(id) on delete set null,
  return_id uuid references public.advisor_tax_returns(id) on delete set null,

  -- Report details
  title text not null,
  report_type text not null,
  template_id uuid references public.advisor_report_templates(id) on delete set null,

  -- Content
  report_data jsonb,  -- Computed data for the report
  generated_html text,

  -- File outputs
  pdf_url text,
  excel_url text,
  word_url text,

  -- Distribution
  sent_to_client boolean default false,
  sent_at timestamptz,
  download_count integer default 0,
  last_downloaded_at timestamptz,

  -- Metadata
  generated_by uuid references public.advisor_team_members(id) on delete set null,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '1 year'
);

-- ============================================================================
-- 7. TASKS & COLLABORATION
-- ============================================================================
create table public.advisor_tasks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,
  client_id uuid references public.advisor_clients(id) on delete cascade,
  return_id uuid references public.advisor_tax_returns(id) on delete cascade,

  -- Task details
  title text not null,
  description text,
  category text default 'general' check (category in ('intake', 'preparation', 'review', 'filing', 'followup', 'general')),

  -- Assignment & status
  assigned_to uuid not null references public.advisor_team_members(id) on delete cascade,
  status text default 'open' check (status in ('open', 'in_progress', 'completed', 'blocked', 'closed')),
  priority text default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),

  -- Due dates
  due_date timestamptz,
  completed_at timestamptz,

  -- Time tracking
  estimated_hours numeric(5, 2),
  actual_hours numeric(5, 2),

  -- Collaboration
  created_by uuid not null references public.advisor_team_members(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Internal notes on tasks
create table public.advisor_task_comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.advisor_tasks(id) on delete cascade,
  commented_by uuid not null references public.advisor_team_members(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================================================
-- 8. BILLING & INVOICING
-- ============================================================================
create type billing_model as enum ('flat_fee', 'hourly', 'percentage', 'retainer', 'subscription');

create table public.advisor_billing_services (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,

  -- Service details
  name text not null,
  description text,
  category text default 'tax_return' check (category in ('tax_return', 'planning', 'consultation', 'compliance', 'custom')),

  -- Pricing
  billing_model billing_model not null,
  base_amount numeric(10, 2),
  hourly_rate numeric(10, 2),
  percentage_amount numeric(5, 2),

  -- Metadata
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.advisor_invoices (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,
  client_id uuid not null references public.advisor_clients(id) on delete cascade,

  -- Invoice details
  invoice_number text not null unique,
  invoice_date timestamptz default now(),
  due_date timestamptz,

  -- Amounts
  subtotal numeric(12, 2),
  tax_rate numeric(5, 2),
  tax_amount numeric(12, 2),
  total_amount numeric(12, 2),

  -- Items (services rendered)
  line_items jsonb,  -- [{service_id, description, qty, rate, amount}]

  -- Status
  status text default 'draft' check (status in ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  sent_at timestamptz,
  paid_at timestamptz,
  payment_method text,

  -- Notes
  notes text,

  created_by uuid references public.advisor_team_members(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payment tracking
create table public.advisor_payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.advisor_invoices(id) on delete cascade,

  amount_paid numeric(12, 2) not null,
  payment_date timestamptz default now(),
  payment_method text not null check (payment_method in ('credit_card', 'bank_transfer', 'check', 'ach', 'other')),
  reference_number text,

  created_at timestamptz default now()
);

-- ============================================================================
-- 9. COMPLIANCE & MONITORING
-- ============================================================================
create table public.advisor_compliance_alerts (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,
  client_id uuid references public.advisor_clients(id) on delete cascade,

  -- Alert details
  alert_type text not null check (alert_type in ('deadline', 'documentation', 'regulatory', 'audit_risk', 'filing_status')),
  title text not null,
  description text,
  severity text default 'info' check (severity in ('info', 'warning', 'critical')),

  -- Context
  jurisdiction text,
  tax_year integer,
  related_return_id uuid references public.advisor_tax_returns(id) on delete set null,

  -- Status
  status text default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  acknowledged_at timestamptz,
  resolved_at timestamptz,

  -- Due date
  due_date timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Audit risk scores
create table public.advisor_audit_risk_scores (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,
  client_id uuid not null references public.advisor_clients(id) on delete cascade,

  tax_year integer not null,
  risk_score numeric(3, 2),  -- 0.0 to 10.0
  risk_category text,  -- low, medium, high, critical

  -- Risk factors
  risk_factors jsonb,  -- {income_volatility, deduction_ratio, entity_type, industry, ...}
  recommendations jsonb,

  calculated_at timestamptz default now(),
  unique (organization_id, client_id, tax_year)
);

-- ============================================================================
-- 10. INTEGRATIONS
-- ============================================================================
create table public.advisor_integrations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,

  -- Integration details
  integration_type text not null check (integration_type in ('quickbooks', 'xero', 'freshbooks', 'stripe', 'docusign', 'salesforce', 'email', 'slack')),

  -- Credentials (encrypted)
  encrypted_credentials text not null,

  -- Status
  is_active boolean default true,
  last_synced_at timestamptz,

  -- Metadata
  sync_frequency text default 'daily' check (sync_frequency in ('realtime', 'hourly', 'daily', 'weekly', 'manual')),

  connected_by uuid references public.advisor_team_members(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 11. ANALYTICS & TRACKING
-- ============================================================================
create table public.advisor_analytics_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,
  user_id uuid references public.advisor_team_members(id) on delete set null,

  event_name text not null,
  event_type text,  -- page_view, form_submit, report_generated, return_filed, etc.

  -- Context
  resource_type text,  -- client, return, report, etc.
  resource_id uuid,

  metadata jsonb default '{}'::jsonb,

  created_at timestamptz default now()
);

-- ============================================================================
-- 12. AUDITS & SECURITY
-- ============================================================================
create table public.advisor_audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.advisor_organizations(id) on delete cascade,
  user_id uuid references public.advisor_team_members(id) on delete set null,

  action text not null,  -- created, updated, deleted, viewed, exported
  resource_type text,  -- client, return, document, invoice, etc.
  resource_id uuid,

  -- Changes
  old_values jsonb,
  new_values jsonb,

  ip_address text,
  user_agent text,

  created_at timestamptz default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.advisor_organizations enable row level security;
alter table public.advisor_team_members enable row level security;
alter table public.advisor_clients enable row level security;
alter table public.advisor_client_secondary_advisors enable row level security;
alter table public.advisor_tax_returns enable row level security;
alter table public.advisor_documents enable row level security;
alter table public.advisor_report_templates enable row level security;
alter table public.advisor_reports enable row level security;
alter table public.advisor_tasks enable row level security;
alter table public.advisor_task_comments enable row level security;
alter table public.advisor_billing_services enable row level security;
alter table public.advisor_invoices enable row level security;
alter table public.advisor_payments enable row level security;
alter table public.advisor_compliance_alerts enable row level security;
alter table public.advisor_audit_risk_scores enable row level security;
alter table public.advisor_integrations enable row level security;
alter table public.advisor_analytics_events enable row level security;
alter table public.advisor_audit_log enable row level security;

-- RLS: Users can only see their organization's data
create policy "org_members_read" on public.advisor_organizations
  for select using (
    exists (select 1 from public.advisor_team_members
      where advisor_team_members.organization_id = advisor_organizations.id
      and advisor_team_members.user_id = auth.uid())
  );

create policy "org_members_all" on public.advisor_team_members
  for all using (
    exists (select 1 from public.advisor_team_members tm
      where tm.organization_id = advisor_team_members.organization_id
      and tm.user_id = auth.uid())
  );

create policy "org_members_clients" on public.advisor_clients
  for all using (
    exists (select 1 from public.advisor_team_members
      where advisor_team_members.organization_id = advisor_clients.organization_id
      and advisor_team_members.user_id = auth.uid())
  );

create policy "org_members_returns" on public.advisor_tax_returns
  for all using (
    exists (select 1 from public.advisor_team_members
      where advisor_team_members.organization_id = advisor_tax_returns.organization_id
      and advisor_team_members.user_id = auth.uid())
  );

create policy "org_members_documents" on public.advisor_documents
  for all using (
    exists (select 1 from public.advisor_team_members
      where advisor_team_members.organization_id = advisor_documents.organization_id
      and advisor_team_members.user_id = auth.uid())
  );

create policy "org_members_tasks" on public.advisor_tasks
  for all using (
    exists (select 1 from public.advisor_team_members
      where advisor_team_members.organization_id = advisor_tasks.organization_id
      and advisor_team_members.user_id = auth.uid())
  );

create policy "org_members_invoices" on public.advisor_invoices
  for all using (
    exists (select 1 from public.advisor_team_members
      where advisor_team_members.organization_id = advisor_invoices.organization_id
      and advisor_team_members.user_id = auth.uid())
  );

create policy "org_members_compliance" on public.advisor_compliance_alerts
  for all using (
    exists (select 1 from public.advisor_team_members
      where advisor_team_members.organization_id = advisor_compliance_alerts.organization_id
      and advisor_team_members.user_id = auth.uid())
  );

-- ============================================================================
-- INDEXES & PERFORMANCE
-- ============================================================================
create index idx_advisor_clients_org on public.advisor_clients(organization_id);
create index idx_advisor_clients_status on public.advisor_clients(status);
create index idx_advisor_clients_primary_advisor on public.advisor_clients(primary_advisor_id);
create index idx_advisor_team_org on public.advisor_team_members(organization_id);
create index idx_advisor_team_user on public.advisor_team_members(user_id);
create index idx_tax_returns_org on public.advisor_tax_returns(organization_id);
create index idx_tax_returns_client on public.advisor_tax_returns(client_id);
create index idx_tax_returns_status on public.advisor_tax_returns(status);
create index idx_documents_org on public.advisor_documents(organization_id);
create index idx_documents_client on public.advisor_documents(client_id);
create index idx_tasks_org on public.advisor_tasks(organization_id);
create index idx_tasks_assigned on public.advisor_tasks(assigned_to);
create index idx_invoices_org on public.advisor_invoices(organization_id);
create index idx_invoices_client on public.advisor_invoices(client_id);
create index idx_analytics_org on public.advisor_analytics_events(organization_id);
create index idx_audit_org on public.advisor_audit_log(organization_id);

-- ============================================================================
-- TIMESTAMPS & TRIGGERS
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger advisor_orgs_touch before update on public.advisor_organizations
  for each row execute function public.touch_updated_at();

create trigger advisor_team_touch before update on public.advisor_team_members
  for each row execute function public.touch_updated_at();

create trigger advisor_clients_touch before update on public.advisor_clients
  for each row execute function public.touch_updated_at();

create trigger advisor_returns_touch before update on public.advisor_tax_returns
  for each row execute function public.touch_updated_at();

create trigger advisor_documents_touch before update on public.advisor_documents
  for each row execute function public.touch_updated_at();

create trigger advisor_invoices_touch before update on public.advisor_invoices
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get organization stats for dashboard
create or replace function public.advisor_org_stats(org_id uuid)
returns jsonb language sql security definer as $$
  select jsonb_build_object(
    'active_clients', (select count(*) from public.advisor_clients where organization_id = org_id and status = 'active'),
    'prospect_clients', (select count(*) from public.advisor_clients where organization_id = org_id and status = 'prospect'),
    'pending_returns', (select count(*) from public.advisor_tax_returns where organization_id = org_id and status in ('draft', 'review', 'ready_for_signature')),
    'team_members', (select count(*) from public.advisor_team_members where organization_id = org_id and status = 'active'),
    'total_revenue_mtd', (
      select coalesce(sum(total_amount), 0) from public.advisor_invoices
      where organization_id = org_id
      and status = 'paid'
      and paid_at >= date_trunc('month', now())
    )
  );
$$;
