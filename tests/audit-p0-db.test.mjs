import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, readdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const run = promisify(execFile);
const container = `peppolpro-audit-tests-${process.pid}`;
const args = ['exec','-i',container,'psql','-U','postgres','-X','-qAt','-v','ON_ERROR_STOP=1'];
const sql = (text) => execFileSync('docker',args,{input:text,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const service = "select set_config('request.jwt.claim.role','service_role',false);\n";
const uid = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';

before(async () => {
 execFileSync('docker',['run','-d','--name',container,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17'],{stdio:'pipe'});
 let ready=false;
 for(let n=0;n<40;n++) {
  try { execFileSync('docker',['exec',container,'pg_isready','-U','postgres'],{stdio:'pipe'});ready=true;break; } catch { await delay(250); }
 }
 assert.ok(ready,'isolated PostgreSQL must start');
 // Minimal pre-audit schema fixture. Assertions execute real PostgreSQL functions,
 // ACLs, row locks and triggers; no credentials, network or customer records.
 sql(`create role anon; create role authenticated; create role hermes_operator; create role service_role bypassrls;
 create schema auth;
 create function auth.role() returns text language sql stable as $$ select nullif(current_setting('request.jwt.claim.role',true),'') $$;
 create table public.user_profiles(id uuid primary key,plan text,credits integer);
 create table public.ubl_credit_consumptions(user_id uuid,document_type text,normalized_document_number text,primary key(user_id,document_type,normalized_document_number));
 create table public.contact_messages(id uuid default gen_random_uuid(),name text,email text,message text);
 alter table public.contact_messages enable row level security;
 create policy contact_insert on public.contact_messages for insert with check(true);
 grant insert(name,email,message) on public.contact_messages to anon,authenticated;
 create table public.account_members(member_user_id uuid,accepted_at timestamptz,status text);
 grant update(member_user_id,accepted_at,status) on public.account_members to authenticated;
 create table public.monitoring_targets(id uuid default gen_random_uuid(),user_id uuid,identifier_type text,identifier_value text,label text);
 grant insert(user_id,identifier_type,identifier_value,label) on public.monitoring_targets to authenticated;
 create table public.subscriptions(user_id uuid,subscription_status text,current_period_end timestamptz);
 insert into public.user_profiles values('${uid}','monitoring',1),('${other}','free',0);
 insert into public.subscriptions values('${uid}','active',now()+interval '1 month');
 `);
 sql(readFileSync(new URL('../supabase/migrations/20260913200523_audit_p0_wallet_and_access.sql',import.meta.url),'utf8'));
 sql(`create table auth.users(id uuid primary key);
 insert into auth.users values('${uid}'),('${other}');
 alter table public.user_profiles add column recommand_verified boolean default true, add column recommand_company_id text default 'fixture', add column send_credits integer default 3, add column send_credits_expires_at timestamptz default now()+interval '1 year';
 create table public.conversions(id uuid primary key,user_id uuid,invoice_number text,document_type text,ubl_xml text,recommand_status text,sent_via_recommand_at timestamptz,recommand_claimed_at timestamptz);
 create table public.invoices(id uuid primary key,user_id uuid,invoice_number text,ubl_xml text,recommand_status text,sent_via_recommand_at timestamptz,recommand_claimed_at timestamptz);
 insert into public.conversions(id,user_id,invoice_number,document_type,ubl_xml) values
 ('00000000-0000-4000-8000-000000000011','${uid}','SEND-1','Invoice','<Invoice/>'),
 ('00000000-0000-4000-8000-000000000012','${uid}','send-1','Invoice','<Invoice/>');
 `);
 const migration = readdirSync(new URL('../supabase/migrations/',import.meta.url)).find(n=>n.endsWith('_audit_p0_send_reservations.sql'));
 sql(readFileSync(new URL(`../supabase/migrations/${migration}`,import.meta.url),'utf8'));
 sql(readFileSync(new URL('./fixtures/audit-billing-baseline.sql',import.meta.url),'utf8'));
 const adjustmentMigration = readdirSync(new URL('../supabase/migrations/',import.meta.url)).find(n=>n.endsWith('_audit_p0_payment_adjustments.sql'));
 sql(readFileSync(new URL(`../supabase/migrations/${adjustmentMigration}`,import.meta.url),'utf8'));


});
after(() => { execFileSync('docker',['rm','-f',container],{stdio:'pipe'}); });

test('P0-08/P0-02: column grants no longer allow contact insertion or invitation acceptance', () => {
 assert.equal(sql("select has_column_privilege('anon','public.contact_messages','name','INSERT')"),'f');
 assert.equal(sql("select has_column_privilege('authenticated','public.account_members','status','UPDATE')"),'f');
 assert.throws(()=>sql("set role anon; insert into public.contact_messages(name,email,message) values('audit','audit@example.invalid','test')"),/permission denied/);
});

test('P0-07: monitoring plan spends a generation credit, regeneration is free, a new document is denied at zero', () => {
 assert.equal(sql(service+`select allowed||','||credit_used from public.use_credit('${uid}','Invoice','ABC')`).split('\n').at(-1),'true,true');
 assert.equal(sql(service+`select allowed||','||credit_used from public.use_credit('${uid}','Invoice',' abc ')`).split('\n').at(-1),'true,false');
 assert.equal(sql(service+`select allowed from public.use_credit('${uid}','Invoice','NEW')`).split('\n').at(-1),'f');
 assert.equal(sql(service+`select public.can_use_credit('${uid}','Invoice','NEW')`).split('\n').at(-1),'f');
 assert.equal(sql(service+`select public.can_use_credit('${uid}','Invoice','abc')`).split('\n').at(-1),'t');
});

test('P0-05: atomic budgets limit exhausted-document retries, new accounts without credit, and public callers', () => {
 for(let n=0;n<3;n++) assert.equal(sql(service+`select public.claim_request_budget('parse','${uid}','${uid}')`).split('\n').at(-1),'allowed');
 assert.equal(sql(service+`select public.claim_request_budget('parse','${uid}','${uid}')`).split('\n').at(-1),'rate_limited');
 assert.equal(sql(service+`select public.claim_request_budget('parse','${other}','${other}')`).split('\n').at(-1),'no_credit');
 assert.throws(()=>sql(`set role anon; select public.claim_request_budget('parse','${uid}','${uid}')`),/permission denied/);
});

test('P0-06: direct authenticated concurrent inserts cannot exceed ten targets', async () => {
 const calls=Array.from({length:20},(_,n)=>run('docker',[...args,'-c',`set role authenticated; insert into public.monitoring_targets(user_id,identifier_type,identifier_value) values('${uid}','kvk','${n}')`]));
 const results=await Promise.allSettled(calls);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,10);
 assert.equal(sql(`select count(*) from public.monitoring_targets where user_id='${uid}'`),'10');
 for(const r of results.filter(r=>r.status==='rejected')) assert.match(r.reason.stderr,/monitoring target limit reached/);
 sql(`update public.subscriptions set current_period_end=now()-interval '1 day' where user_id='${uid}'`);
 assert.throws(()=>sql(`set role authenticated; insert into public.monitoring_targets(user_id,identifier_type,identifier_value) values('${uid}','kvk','expired')`),/active monitoring subscription required/);
});

test('P0-04: simultaneous cross-row sends reserve one credit; safe reclaim reuses it and fences the old worker', async () => {
 const target='00000000-0000-4000-8000-000000000011';
 const duplicate='00000000-0000-4000-8000-000000000012';
 const claim = (id) => service+`select row_to_json(r) from public.claim_recommand_send_with_credit('conversions','${id}','${uid}') r`;
 const results=await Promise.all(Array.from({length:12},(_,n)=>run('docker',[...args,'-c',claim(n%2?duplicate:target)])));
 const rows=results.map(r=>JSON.parse(r.stdout.trim().split('\n').at(-1)));
 assert.equal(rows.filter(r=>r.claimed).length,1);
 assert.equal(sql(`select send_credits from public.user_profiles where id='${uid}'`),'2');
 const first=rows.find(r=>r.claimed);
 sql(`update public.send_reservations set claimed_at=now()-interval '11 minutes'`);
 const second=JSON.parse(sql(claim(target)).split('\n').at(-1));
 assert.equal(second.claimed,true);
 assert.notEqual(second.claim_token,first.claim_token);
 assert.equal(sql(`select send_credits from public.user_profiles where id='${uid}'`),'2');
 assert.equal(sql(service+`select public.begin_recommand_submission('${first.reservation_id}','${first.claim_token}','${uid}')`).split('\n').at(-1),'f');
 assert.throws(()=>sql(service+`select * from public.release_recommand_reservation('${first.reservation_id}','${first.claim_token}','${uid}')`),/reservation_claim_lost/);
 assert.equal(sql(service+`select public.begin_recommand_submission('${second.reservation_id}','${second.claim_token}','${uid}')`).split('\n').at(-1),'t');
 sql(`update public.send_reservations set claimed_at=now()-interval '11 minutes'`);
 assert.equal(JSON.parse(sql(claim(duplicate)).split('\n').at(-1)).claimed,false,'submission uncertainty never permits resending');
 for(let n=0;n<2;n++) assert.equal(sql(service+`select * from public.release_recommand_reservation('${second.reservation_id}','${second.claim_token}','${uid}')`).split('\n').at(-1),'3');
 const third=JSON.parse(sql(claim(target)).split('\n').at(-1));
 assert.equal(third.claimed,true);
 sql(service+`select public.begin_recommand_submission('${third.reservation_id}','${third.claim_token}','${uid}')`);
 sql(`update public.conversions set sent_via_recommand_at=now(),recommand_status='sent' where id='${target}'`);
 assert.equal(sql(`select state from public.send_reservations where id='${third.reservation_id}'`),'used');
 assert.throws(()=>sql(service+`select * from public.release_recommand_reservation('${third.reservation_id}','${third.claim_token}','${uid}')`),/accepted_send_cannot_be_released/);
 assert.equal(JSON.parse(sql(claim(duplicate)).split('\n').at(-1)).claim_action,'duplicate_document');
 assert.equal(sql(`select sum(delta) from public.send_credit_ledger where user_id='${uid}'`),'-1');
});

test('P0-03: partial refunds are atomic, idempotent, create exact credit notes and preserve consumed-credit debt', () => {
 const buyer='00000000-0000-4000-8000-000000000003';
 const payment='00000000-0000-4000-8000-000000000021';
 sql(`insert into auth.users values('${buyer}');
 insert into public.user_profiles(id,plan,credits,send_credits,address,postal_code,city,address_validation_source) values('${buyer}','free',0,0,'Fixture street 1','1234AB','Fixture','manual');
 insert into public.payments(id,user_id,mollie_payment_id,mollie_mode,status,amount,credits,plan,type) values('${payment}','${buyer}','tr_Fixture','live','paid',9,10,'send_credits_10','credit_purchase');`);
 const apply=(rows)=>sql(service+`select * from public.apply_mollie_payment_adjustments('${payment}','${JSON.stringify(rows)}',now()+interval '1 year')`).split('\n').at(-1);
 const first={key:'refund:re_First',kind:'refund',cents:450};
 assert.equal(apply([first]),'450');
 assert.equal(sql(`select credits||','||send_credits from public.user_profiles where id='${buyer}'`),'5,5');
 assert.equal(sql(`select amount from public.invoices where payment_id='${payment}' and invoice_kind='credit'`),'-4.50');
 assert.equal(apply([first]),'450');
 assert.equal(sql(`select count(*) from public.invoices where payment_id='${payment}'`),'2');
 sql(`update public.user_profiles set credits=0,send_credits=0 where id='${buyer}'`);
 assert.equal(apply([first,{key:'refund:re_Second',kind:'refund',cents:450}]),'900');
 assert.equal(sql(`select ubl_credit_debt||','||send_credit_debt from public.user_profiles where id='${buyer}'`),'5,5');
 sql(`update public.user_profiles set credits=credits+3,send_credits=send_credits+3 where id='${buyer}'`);
 assert.equal(sql(`select credits||','||send_credits||','||ubl_credit_debt||','||send_credit_debt from public.user_profiles where id='${buyer}'`),'0,0,2,2');
 assert.equal(sql(`select sum(amount) from public.invoices where payment_id='${payment}'`),'0.00');
 assert.equal(sql(`select count(distinct invoice_number)=count(*) from public.invoices where payment_id='${payment}'`),'t');
 assert.throws(()=>sql(`set role anon; select * from public.apply_mollie_payment_adjustments('${payment}','[]',now())`),/permission denied/);
});

test('P0-03: a chargeback reversal restores only the previously reversed rights and is retry safe', () => {
 const buyer='00000000-0000-4000-8000-000000000004';
 const payment='00000000-0000-4000-8000-000000000022';
 sql(`insert into auth.users values('${buyer}');
 insert into public.user_profiles(id,plan,credits,send_credits,address,postal_code,city,address_validation_source) values('${buyer}','free',0,0,'Fixture street 1','1234AB','Fixture','manual');
 insert into public.payments(id,user_id,mollie_payment_id,mollie_mode,status,amount,credits,plan,type) values('${payment}','${buyer}','tr_Chargeback','live','paid',9,10,'send_credits_10','credit_purchase');`);
 const rows=[{key:'chargeback:chb_First',kind:'chargeback',cents:900},{key:'chargeback:chb_First:reversed',kind:'chargeback_reversed',cents:-900}];
 for(let n=0;n<2;n++) sql(service+`select * from public.apply_mollie_payment_adjustments('${payment}','${JSON.stringify(rows)}',now()+interval '1 year')`);
 assert.equal(sql(`select credits||','||send_credits from public.user_profiles where id='${buyer}'`),'10,10');
 assert.equal(sql(`select count(*) from public.invoices where payment_id='${payment}'`),'3');
 assert.equal(sql(`select sum(amount) from public.invoices where payment_id='${payment}'`),'9.00');
});
