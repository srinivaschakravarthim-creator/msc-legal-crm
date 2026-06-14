-- Initial admin profile for MSC Legal CRM
-- Run this after creating the Supabase Auth user.

insert into profiles (id, firm_id, full_name, role, email, phone)
values (
  '2ef2e363-9ddd-4c48-a4a9-36962e869cf0',
  '2e16f34c-b1eb-40f0-be8f-790fadb3472b',
  'Srinivasa chakravarthi',
  'admin',
  'srinivaschakravarthim@gmail.com',
  null
)
on conflict (id) do update
set
  firm_id = excluded.firm_id,
  full_name = excluded.full_name,
  role = excluded.role,
  email = excluded.email,
  phone = excluded.phone
returning id, firm_id, full_name, role, email;
