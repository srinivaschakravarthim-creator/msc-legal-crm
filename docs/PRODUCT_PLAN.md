# Indian Legal CRM Product Plan

## MVP Goal

Build a web-based practice management system for Indian lawyers and small law firms. The first version should help a firm see clients, matters, hearing dates, tasks, documents, and billing status in one place.

## Version 1 Scope

- Role-based login for firm admin, lawyer, staff, and client.
- Client and contact management.
- Matter register with court, case number, parties, status, assigned lawyer, and next hearing date.
- Hearing calendar and deadline reminders.
- Task tracking for filings, drafts, client updates, and payments.
- Document upload linked to each matter.
- Basic invoices with GST-ready fields.
- Dashboard for upcoming hearings, pending deadlines, pending tasks, and unbilled value.

## Current Prototype

- Interactive dashboard with matters, clients, hearings, and tasks.
- Create forms for clients, matters, hearing entries, and work queue tasks.
- Browser local storage so prototype records remain after refresh.
- Clickable matter register with selected matter detail panel.
- Search and status filtering for matter records.
- Edit and delete controls for matters and clients.
- Task completion and delete controls for the work queue.
- Matter timeline with notes, hearing updates, filings, documents, invoices, and client updates.
- Automatic timeline entries when a new matter, hearing, or task is created.
- Matter document register for petitions, affidavits, orders, notices, invoices, vakalatnama, evidence, and other files.
- Document additions automatically appear in the selected matter timeline.
- GST-ready invoice register with professional fee, GST, TDS, invoice status, due date, and payment tracking.
- Invoice creation and payment updates automatically appear in the selected matter timeline.
- Client portal preview showing client-linked matters, hearings, documents, invoices, and recent updates.
- Role-based view simulation for Admin, Lawyer, Staff, and Client access.
- Client communication center for WhatsApp, SMS, and email-style matter updates with draft/sent/scheduled status.
- Compliance audit log for important actions such as creating, updating, deleting, sending, and marking records paid/completed.
- Cause list tracker with court, bench, courtroom, item number, stage, and next action.
- Limitation and deadline tracker with due dates, basis, and filing status.
- Document template generator/saver for notices, affidavits, petition indexes, and other drafts.
- Private internal strategy notes separated from client-visible updates.
- Advanced global search across matters, clients, documents, invoices, messages, and courts.
- Reports dashboard for matters, open tasks, deadlines, and unpaid billing.
- Court/forum directory for filing notes, registry contacts, and local court practice.
- Team workload board for active matters and open tasks by person.

## Later Indian Legal Features

- Court-specific document templates.
- WhatsApp, SMS, and email updates.
- Client portal for documents, case status, invoices, and payments.
- eCourts or cause-list integrations where reliable access is available.
- GST reports, TDS tracking, UPI/Razorpay payments.
- Multilingual UI and legal document translation workflow.
- AI-assisted drafting, document review, and case summaries.
- DPDPA controls including audit logs, data retention, role access, and India-region hosting.

## Build Order

1. Frontend prototype with realistic workflows.
2. Database design for clients, matters, hearings, tasks, documents, invoices, and users. Initial schema now lives in `supabase/schema.sql`.
3. Authentication and role permissions.
4. Real create, edit, search, and filtering flows.
5. File storage and document management.
6. Billing and invoice module.
7. Notifications and client portal.
8. Indian court, payment, and AI integrations.
