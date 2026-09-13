import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const migration = (suffix) => read('supabase/migrations/' + readdirSync(new URL('supabase/migrations/', root)).find(name => name.endsWith(suffix)));

test('P1-02 PostgreSQL preserves snapshots and billing metadata through account deletion', { timeout: 90000 }, async () => {
 const name = `peppolpro-p1-billing-test-${process.pid}`;
 const docker = (args, options = {}) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'], timeout: 60000, ...options });
 docker(['run','--detach','--rm','--name',name,'--network','none','--tmpfs','/var/lib/postgresql/data','--env','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17']);
 try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
   try { docker(['exec',name,'pg_isready','-U','postgres']); ready = true; break; } catch { await setTimeout(100); }
  }
  assert.ok(ready, 'isolated PostgreSQL must become ready');
  const fixture = read('tests/fixtures/p1-billing-schema.sql');
  const checks = `
do $$
declare fixture record;
begin
 for fixture in select * from (values
  ('2026-01-01'::date,'2033-12-31'::date),
  ('2026-12-31'::date,'2033-12-31'::date),
  ('2024-02-29'::date,'2031-12-31'::date),
  ('2020-06-15'::date,'2027-12-31'::date)
 ) as dates(invoice_date, expected) loop
  if public.invoice_retention_until(fixture.invoice_date) is distinct from fixture.expected then
   raise exception 'incorrect exact retention boundary for %',fixture.invoice_date;
  end if;
 end loop;
 if has_function_privilege('anon','public.invoice_retention_until(date)','execute') then
  raise exception 'anonymous RPC access is not permitted';
 end if;
end $$;
select 'EXACT_DATE_FIXTURES_PASS';
insert into auth.users values ('00000000-0000-4000-8000-000000000001');
insert into public.user_profiles(id,email,company_name) values ('00000000-0000-4000-8000-000000000001','test@example.invalid','Original company');
insert into public.payments(id,user_id,amount,type) values ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001',10,'credit_purchase');
insert into public.invoices(id,user_id,payment_id,invoice_number,invoice_date,invoice_kind,amount)
values ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','INV-TEST-001',current_date,'credits',10);
insert into public.invoices(user_id,invoice_number,invoice_date,invoice_kind,amount)
select '00000000-0000-4000-8000-000000000001','INV-FIXTURE-'||d::text,d,'credits',10
from unnest(array['2026-01-01'::date,'2026-12-31'::date,'2024-02-29'::date,'2020-06-15'::date]) as d;
update public.user_profiles set company_name='Changed company';
do $$
begin
 if exists(select 1 from public.invoices where billing_snapshot->'customer'->>'company_name' <> 'Original company') then raise exception 'snapshot changed'; end if;
 if exists(select 1 from public.invoices where pdf_retention_until is distinct from (public.invoice_retention_until(invoice_date)::timestamp at time zone 'UTC')) then raise exception 'retention not exact'; end if;
 begin
  update public.invoices set amount=99 where invoice_number='INV-TEST-001';
  raise exception 'P0: privileged financial mutation was accepted';
 exception when others then if sqlerrm <> 'issued billing invoice is immutable' then raise; end if; end;
 update public.invoices set pdf_path=invoice_number||'.pdf',pdf_sha256=repeat('a',64);
 begin
  update public.invoices set pdf_path='replacement.pdf' where invoice_number='INV-TEST-001';
  raise exception 'P0: archived path replacement was accepted';
 exception when others then if sqlerrm <> 'billing archive cannot be replaced' then raise; end if; end;
 begin
  delete from public.invoices where invoice_number='INV-TEST-001';
  raise exception 'P0: privileged invoice deletion was accepted';
 exception when others then if sqlerrm <> 'billing archive is within statutory retention' then raise; end if; end;
end $$;
-- Grant the attacker more table privileges than production so the trigger itself
-- must protect billing data; RLS still limits this test role to its own invoices.
alter table public.invoices enable row level security;
grant usage on schema public to authenticated;
grant select,update,delete on public.invoices to authenticated;
create policy own_fixture_invoices on public.invoices to authenticated
 using (user_id = current_setting('request.jwt.claim.sub',true)::uuid)
 with check (user_id = current_setting('request.jwt.claim.sub',true)::uuid);
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';
do $$
begin
 if (select count(*) from public.invoices where invoice_number='INV-TEST-001') <> 1 then raise exception 'attacker fixture not visible'; end if;
 begin
  update public.invoices set amount=99 where invoice_number='INV-TEST-001';
  raise exception 'P0: authenticated financial mutation was accepted';
 exception when others then if sqlerrm <> 'issued billing invoice is immutable' then raise; end if; end;
 begin
  delete from public.invoices where invoice_number='INV-TEST-001';
  raise exception 'P0: authenticated invoice deletion was accepted';
 exception when others then if sqlerrm <> 'billing archive is within statutory retention' then raise; end if; end;
end $$;
reset role;
select 'FINANCIAL_IMMUTABILITY_PRIVILEGED_AND_AUTHENTICATED_PASS';
delete from auth.users;
do $$
begin
 if (select count(*) from public.invoices) <> 5 then raise exception 'P0: invoices cascaded on account deletion'; end if;
 if exists(select 1 from public.invoices where user_id is not null or payment_id is not null) then raise exception 'account or payment not detached'; end if;
 if exists(select 1 from public.invoices where billing_snapshot->'customer'->>'company_name' <> 'Original company' or amount<>10 or pdf_path is null) then raise exception 'P0: invoice metadata lost'; end if;
 if (select count(*) from auth.users) <> 0 then raise exception 'account deletion did not finish'; end if;
end $$;
select 'ACCOUNT_DELETION_METADATA_PRESERVED_PASS';
select 'P1-02 archive SQL assertions passed';
`;
  const output = docker(['exec','-i',name,'psql','-X','-U','postgres','-v','ON_ERROR_STOP=1'], {
   input: fixture + migration('_audit_p1_billing_archive_additive.sql') + migration('_audit_p1_billing_archive_restrictive.sql') + checks,
  });
  for (const marker of ['EXACT_DATE_FIXTURES_PASS','FINANCIAL_IMMUTABILITY_PRIVILEGED_AND_AUTHENTICATED_PASS','ACCOUNT_DELETION_METADATA_PRESERVED_PASS','P1-02 archive SQL assertions passed']) {
   assert.ok(output.includes(marker), marker);
   console.log(marker);
  }
 } finally { docker(['stop','--time','1',name]); }
});
