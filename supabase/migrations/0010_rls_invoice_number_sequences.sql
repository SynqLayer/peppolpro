-- Applied manually to production on 2026-08-07; this migration records the same idempotent lock-down.
-- Lock down invoice number sequence table: internal billing helper only.
-- No anon/authenticated policies: access remains service-role / SECURITY DEFINER function only.

alter table public.invoice_number_sequences enable row level security;

revoke all on public.invoice_number_sequences from anon, authenticated;
