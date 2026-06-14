-- Row-level security policy draft for Supabase.
-- This assumes profiles.id is auth.uid().

alter table firms enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table matters enable row level security;
alter table hearings enable row level security;
alter table tasks enable row level security;
alter table timeline_events enable row level security;
alter table documents enable row level security;
alter table invoices enable row level security;
alter table communications enable row level security;
alter table cause_list_entries enable row level security;
alter table deadlines enable row level security;
alter table template_drafts enable row level security;
alter table private_notes enable row level security;
alter table courts enable row level security;
alter table audit_events enable row level security;

create or replace function current_firm_id()
returns uuid
language sql
security definer
stable
as $$
  select firm_id from profiles where id = auth.uid()
$$;

create or replace function current_role()
returns user_role
language sql
security definer
stable
as $$
  select role from profiles where id = auth.uid()
$$;

-- Internal users can read records belonging to their firm.
-- Client users should later be restricted through explicit matter/client membership.
create policy "firm members read clients"
on clients for select
using (firm_id = current_firm_id());

create policy "firm members read matters"
on matters for select
using (firm_id = current_firm_id());

create policy "firm members read operational records"
on timeline_events for select
using (firm_id = current_firm_id());

create policy "firm members read documents"
on documents for select
using (firm_id = current_firm_id());

create policy "firm members read invoices"
on invoices for select
using (firm_id = current_firm_id());

create policy "firm members read communications"
on communications for select
using (firm_id = current_firm_id());

-- Write access should be limited to internal roles.
create policy "internal users write matters"
on matters for all
using (firm_id = current_firm_id() and current_role() in ('admin', 'lawyer', 'staff'))
with check (firm_id = current_firm_id() and current_role() in ('admin', 'lawyer', 'staff'));

create policy "internal users write clients"
on clients for all
using (firm_id = current_firm_id() and current_role() in ('admin', 'lawyer', 'staff'))
with check (firm_id = current_firm_id() and current_role() in ('admin', 'lawyer', 'staff'));

create policy "admin reads audit"
on audit_events for select
using (firm_id = current_firm_id() and current_role() in ('admin', 'staff'));

-- Production note:
-- Add explicit policies for every table before enabling the hosted app.
-- Private notes should be restricted to admin/lawyer only.
-- Audit events should be append-only from trusted server-side functions.
