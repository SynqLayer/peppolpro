-- PeppolPro schema v1 — bestaande tabelnamen behouden (code gebruikt ze al)
create table user_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text,
 company_name text,
 country text default 'NL',
 kvk_kbo text,
 btw_nr text,
 address text,
 iban text,
 peppol_id text,
 plan text default 'free' check (plan in ('free','compleet','pro','accountant')),
 credits int default 3,
 onboarding_complete boolean default false,
 created_at timestamptz default now()
);

create table clients (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 btw_nr text,
 peppol_id text,
 address text,
 country text default 'NL',
 created_at timestamptz default now()
);

create table invoices (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 client_id uuid references clients(id) on delete set null,
 invoice_number text not null,
 invoice_date date not null,
 due_date date,
 currency text default 'EUR',
 status text default 'draft' check (status in ('draft','generated','sent','delivered','failed')),
 ubl_xml text,
 total_excl numeric(12,2),
 vat_total numeric(12,2),
 total_incl numeric(12,2),
 peppol_message_id text,
 sent_at timestamptz,
 created_at timestamptz default now()
);

create table invoice_lines (
 id uuid primary key default gen_random_uuid(),
 invoice_id uuid not null references invoices(id) on delete cascade,
 description text not null,
 quantity numeric(12,2) default 1,
 unit_price numeric(12,2) not null,
 vat_pct numeric(5,2) default 21
);

create table inbox_messages (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 received_at timestamptz default now(),
 sender_name text,
 sender_peppol_id text,
 ubl_xml text,
 pdf_path text,
 amount numeric(12,2),
 status text default 'new' check (status in ('new','read','forwarded'))
);

create table conversions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 filename text,
 status text default 'done',
 ubl_xml text,
 created_at timestamptz default now()
);

create table payments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete set null,
 type text check (type in ('credit_purchase','subscription')),
 mollie_payment_id text,
 amount numeric(12,2),
 credits int default 0,
 status text default 'open',
 created_at timestamptz default now()
);

create table contact_messages (
 id uuid primary key default gen_random_uuid(),
 name text,
 email text,
 message text,
 status text default 'new' check (status in ('new','read','replied','archived')),
 created_at timestamptz default now()
);

create table scan_logs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete set null,
 action text,
 meta jsonb,
 created_at timestamptz default now()
);

-- RLS
alter table user_profiles enable row level security;
alter table clients enable row level security;
alter table invoices enable row level security;
alter table invoice_lines enable row level security;
alter table inbox_messages enable row level security;
alter table conversions enable row level security;
alter table payments enable row level security;
alter table contact_messages enable row level security;
alter table scan_logs enable row level security;

create policy "own profile" on user_profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own clients" on clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own invoices" on invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own lines" on invoice_lines for all
 using (exists (select 1 from invoices i where i.id = invoice_id and i.user_id = auth.uid()))
 with check (exists (select 1 from invoices i where i.id = invoice_id and i.user_id = auth.uid()));
create policy "read own inbox" on inbox_messages for select using (auth.uid() = user_id);
create policy "update own inbox" on inbox_messages for update using (auth.uid() = user_id);
create policy "own conversions" on conversions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "read own payments" on payments for select using (auth.uid() = user_id);
create policy "anyone can contact" on contact_messages for insert with check (true);
create policy "read own logs" on scan_logs for select using (auth.uid() = user_id);
-- inbox insert + payments insert/update + scan_logs insert: alleen via service role (geen policy nodig)

-- Credits RPC
create or replace function use_credit(p_user_id uuid)
returns boolean language plpgsql security definer as $$
declare ok boolean := false;
begin
 update user_profiles set credits = credits - 1
 where id = p_user_id and credits > 0;
 if found then ok := true; end if;
 return ok;
end $$;

-- Storage bucket 'invoices' handmatig aanmaken in dashboard (private)
