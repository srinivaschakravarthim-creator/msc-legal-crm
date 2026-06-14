-- Initial firm record for MSC Legal CRM
-- Run this after supabase/schema.sql.

insert into firms (name, city, state, gstin)
values ('MSC Legal CRM', 'Visakhapatnam', 'Andhra Pradesh', null)
returning id, name, city, state, gstin;
