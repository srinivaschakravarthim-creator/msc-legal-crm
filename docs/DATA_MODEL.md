# Data Model

This maps the product features to database tables.

| Product area | Table |
| --- | --- |
| Law firm profile | `firms` |
| Users and roles | `profiles` |
| Clients | `clients` |
| Matters / cases | `matters` |
| Hearings | `hearings` |
| Tasks | `tasks` |
| Matter timeline | `timeline_events` |
| Documents | `documents` |
| GST invoices | `invoices` |
| WhatsApp/SMS/email updates | `communications` |
| Cause list tracker | `cause_list_entries` |
| Limitation/deadlines | `deadlines` |
| Draft templates | `template_drafts` |
| Private strategy notes | `private_notes` |
| Court directory | `courts` |
| Audit log | `audit_events` |

## Important Relationships

- One firm has many users, clients, matters, documents, invoices, and audit events.
- One client can have many matters.
- One matter can have hearings, tasks, documents, invoices, messages, timeline events, deadlines, cause list entries, templates, and private notes.
- Users are assigned roles: admin, lawyer, staff, or client.
- Client portal records must be explicitly marked client-visible where needed.
