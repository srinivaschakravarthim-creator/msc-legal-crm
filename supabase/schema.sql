-- Indian Legal CRM database schema
-- Target: PostgreSQL / Supabase

create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'lawyer', 'staff', 'client');
create type matter_status as enum ('active', 'awaiting_order', 'drafting', 'billing', 'closed');
create type priority_level as enum ('high', 'medium', 'low');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue');
create type communication_channel as enum ('whatsapp', 'sms', 'email');
create type communication_status as enum ('draft', 'sent', 'scheduled');
create type deadline_status as enum ('open', 'filed', 'delayed');
create type note_sensitivity as enum ('normal', 'sensitive', 'privileged');

create table firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gstin text,
  city text,
  state text,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key,
  firm_id uuid not null references firms(id) on delete cascade,
  full_name text not null,
  role user_role not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  name text not null,
  client_type text not null,
  phone text,
  email text,
  city text,
  created_at timestamptz not null default now()
);

create table matters (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  title text not null,
  court text not null,
  case_no text not null,
  status matter_status not null default 'active',
  next_date text,
  owner_id uuid references profiles(id),
  outstanding_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table hearings (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  hearing_time text not null,
  court_room text not null,
  purpose text not null,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  title text not null,
  due_date text not null,
  priority priority_level not null default 'medium',
  completed boolean not null default false,
  assigned_to uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  event_date text not null,
  category text not null,
  title text not null,
  body text not null,
  author_id uuid references profiles(id),
  client_visible boolean not null default false,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  name text not null,
  category text not null,
  filed_on text,
  owner_id uuid references profiles(id),
  storage_path text,
  file_name text,
  note text,
  client_visible boolean not null default false,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  invoice_no text not null,
  issue_date text not null,
  due_date text not null,
  professional_fee numeric(12,2) not null,
  gst_rate numeric(5,2) not null default 18,
  tds numeric(12,2) not null default 0,
  status invoice_status not null default 'draft',
  note text,
  created_at timestamptz not null default now(),
  unique(firm_id, invoice_no)
);

create table communications (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  channel communication_channel not null,
  status communication_status not null default 'draft',
  subject text not null,
  message text not null,
  communication_date text not null,
  sender_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table cause_list_entries (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  list_date text not null,
  court text not null,
  bench text not null,
  courtroom text not null,
  item_no text not null,
  stage text not null,
  next_action text not null,
  created_at timestamptz not null default now()
);

create table deadlines (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  title text not null,
  due_date text not null,
  basis text not null,
  status deadline_status not null default 'open',
  created_at timestamptz not null default now()
);

create table template_drafts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  template_type text not null,
  title text not null,
  content text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table private_notes (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  title text not null,
  note text not null,
  author_id uuid references profiles(id),
  sensitivity note_sensitivity not null default 'normal',
  created_at timestamptz not null default now()
);

create table courts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  name text not null,
  city text not null,
  court_type text not null,
  contact text,
  filing_notes text,
  created_at timestamptz not null default now()
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references firms(id) on delete cascade,
  actor_id uuid references profiles(id),
  actor_role user_role not null,
  action text not null,
  target text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

create index idx_profiles_firm_role on profiles(firm_id, role);
create index idx_clients_firm on clients(firm_id);
create index idx_matters_firm_client on matters(firm_id, client_id);
create index idx_matters_status on matters(firm_id, status);
create index idx_timeline_matter on timeline_events(matter_id, created_at desc);
create index idx_documents_matter on documents(matter_id);
create index idx_invoices_matter_status on invoices(matter_id, status);
create index idx_audit_firm_created on audit_events(firm_id, created_at desc);
