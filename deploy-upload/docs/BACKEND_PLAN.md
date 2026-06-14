# Backend Plan

## Recommended Stack

- Supabase Auth for login.
- PostgreSQL for CRM data.
- Supabase Storage for matter documents.
- Row-level security for firm isolation and role access.
- Server-side audit logging for sensitive actions.

## Roles

- Admin: full firm access, billing, deletes, audit log, settings.
- Lawyer: matters, hearings, documents, timeline, strategy notes, client updates.
- Staff: intake, hearings, tasks, documents, billing operations, audit visibility.
- Client: client portal only, limited to client-visible matter records.

## Migration Order

1. Create Supabase project in an India-friendly region if available, otherwise nearest acceptable region.
2. Run `supabase/schema.sql`.
3. Review and complete `supabase/rls_policies.sql`.
4. Add auth signup/invite flow for firm users.
5. Replace browser local storage with API/data client calls.
6. Move document metadata into `documents` and actual files into Supabase Storage.
7. Route all sensitive writes through functions that also insert `audit_events`.

## Security Notes

- Client-visible data must be explicitly marked, never inferred from normal internal records.
- Private notes should not be accessible to staff or clients.
- Audit logs should be append-only in production.
- File paths should not be guessable; use signed URLs for document download.
- Store data under firm ownership to keep future multi-firm SaaS support clean.
