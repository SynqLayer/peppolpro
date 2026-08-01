-- Ensure PostgREST/Supabase upsert can target payments.mollie_payment_id.
-- The earlier partial unique index enforces uniqueness for non-null values,
-- but PostgREST ON CONFLICT requires a real unique/exclusion constraint.

alter table public.payments
 add constraint payments_mollie_payment_id_key unique (mollie_payment_id);