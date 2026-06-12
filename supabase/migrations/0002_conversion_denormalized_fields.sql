alter table public.conversions
 add column if not exists customer_name text,
 add column if not exists total_amount numeric(12,2),
 add column if not exists invoice_number text,
 add column if not exists currency text default 'EUR';

