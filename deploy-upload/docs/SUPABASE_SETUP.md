# Supabase Setup

## What Is Already Done

- Supabase client package is installed.
- `.env.local` contains the project URL and publishable key.
- The frontend can now detect that Supabase is configured.
- Database schema is prepared in `supabase/schema.sql`.
- Starter security policies are prepared in `supabase/rls_policies.sql`.

## What You Need To Do In Supabase

1. Open your Supabase project dashboard.
2. Go to SQL Editor.
3. Open `supabase/schema.sql` from this project.
4. Paste the full SQL into Supabase SQL Editor.
5. Run it.
6. Then review `supabase/rls_policies.sql` before running it.

## Important

- Do not put the database password in frontend code.
- The publishable key is okay for browser usage.
- Real security comes from Supabase Row Level Security policies, not from hiding frontend code.
- Before production, audit events should be written by server-side functions so users cannot tamper with them.

## Next Development Step

After the schema is created in Supabase, replace local browser storage module by module:

1. Auth and profile loading.
2. Clients.
3. Matters.
4. Hearings and tasks.
5. Documents metadata and file storage.
6. Invoices.
7. Communications.
8. Audit logs.

## First Firm Seed

Run `supabase/seed_firm.sql` in Supabase SQL Editor to create the first firm:

- Name: MSC Legal CRM
- City: Visakhapatnam
- State: Andhra Pradesh
- GSTIN: skipped

Copy the returned `id`. It will be needed when creating the first admin profile.

## First Admin Profile

After creating the admin user in Supabase Authentication, run `supabase/seed_admin_profile.sql`.

Current admin:

- Name: Srinivasa chakravarthi
- Email: srinivaschakravarthim@gmail.com
- Role: admin

## Frontend Login

The app now includes an email/password login card. After the admin profile exists:

1. Open the local app.
2. Sign in with the Supabase Auth email/password.
3. The app loads the matching row from `profiles`.
4. The role banner uses the real profile role.
