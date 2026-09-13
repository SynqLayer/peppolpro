import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { withPostgres } from './helpers/postgres.mjs';
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const migration = (suffix) => read('supabase/migrations/' + readdirSync(new URL('supabase/migrations/', root)).find(name => name.endsWith(suffix)));
test('P1-03 concurrent billing retries allocate one invoice and one sequence number', { timeout: 300000 }, async () => {
 await withPostgres('idempotency', async (db) => {
  await db.query( read('tests/fixtures/p1-billing-schema.sql') + `
create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$;
create table public.invoice_number_sequences(year int primary key,last_number int not null,updated_at timestamptz default now());
` + migration('_audit_p1_billing_archive_additive.sql') + migration('_audit_p1_invoice_idempotency_additive.sql') + migration('_audit_p1_billing_archive_restrictive.sql') + `
insert into auth.users values ('00000000-0000-4000-8000-000000000001');
insert into public.user_profiles(id,email,address,postal_code,city,address_validation_source)
values ('00000000-0000-4000-8000-000000000001','test@example.invalid','Test 1','1234AB','Test','manual');
insert into public.payments(id,user_id,amount,type,status,plan,mollie_mode)
values ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001',10,'credit_purchase','paid','send_credits_10','live');
` );
  const call = "set request.jwt.claim.role='service_role'; select id,invoice_number from public.create_billing_invoice_for_payment('00000000-0000-4000-8000-000000000002','credits');";
  const results = await Promise.all(Array.from({ length: 20 }, () => db.command(call)));
  const rows = results.map(r => r.trim().split('\n').at(-1));
  assert.equal(new Set(rows).size, 1);
  assert.match(rows[0], /^[0-9a-f-]+\|INV-/);
  assert.equal((await db.command('select count(*) from public.invoices; select last_number from public.invoice_number_sequences;')).trim(), '1\n1');
  // Existing identity is returned even if the customer's current address is gone.
  await db.command('update public.user_profiles set address=null;');
  const retry = (await db.command(call)).trim().split('\n').at(-1);
  assert.equal(retry, rows[0]);
  await assert.rejects(db.command(`insert into public.invoices(user_id,payment_id,invoice_number,invoice_date,invoice_kind)
values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','ILLEGAL-DUPLICATE',current_date,'subscription');`), /invoices_payment_original_unique/);
  console.log('P1_03_CONCURRENCY attempts=20 unique_invoices=1 sequence_number=1');
 });
});
