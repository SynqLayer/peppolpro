begin;

-- P0-05/P0-08: shared database counters bound paid parsing and public contact writes.
create table public.request_budgets (
 bucket text not null,
 subject text not null,
 window_start timestamptz not null,
 used integer not null default 0 check (used >= 0),
 primary key (bucket, subject, window_start)
);
alter table public.request_budgets enable row level security;
revoke all on public.request_budgets from public, anon, authenticated, hermes_operator;
grant all on public.request_budgets to service_role;

create function public.claim_request_budget(p_kind text, p_subject text, p_user_id uuid default null)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
 v_day timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
 v_minute timestamptz := date_trunc('minute', now());
 v_limit integer;
 v_global_limit integer;
 v_used integer;
begin
 if coalesce(auth.role(), '') <> 'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
 if p_kind not in ('parse','contact') or p_subject is null or length(p_subject) > 128 then
  raise exception 'invalid budget' using errcode='22023';
 end if;
 if p_kind = 'parse' then
  if p_user_id is null or p_subject <> p_user_id::text then raise exception 'invalid user budget'; end if;
  select case when coalesce(credits,0) > 0 then 50 else 3 end into v_limit
   from public.user_profiles where id=p_user_id;
  if not found then return 'no_credit'; end if;
  -- Exhausted users may retry an existing document, but only three parses/day.
  if v_limit=3 and not exists(select 1 from public.ubl_credit_consumptions where user_id=p_user_id) then return 'no_credit'; end if;
  v_global_limit := 300;
 else
  v_limit := 5;
  v_global_limit := 100;
 end if;
 -- The global row serializes both checks; rejected calls consume no allowance.
 insert into public.request_budgets values(p_kind,'global',v_day,0) on conflict do nothing;
 select used into v_used from public.request_budgets where bucket=p_kind and subject='global' and window_start=v_day for update;
 if v_used >= v_global_limit then return 'rate_limited'; end if;
 insert into public.request_budgets values(p_kind,p_subject,v_day,0) on conflict do nothing;
 if (select used from public.request_budgets where bucket=p_kind and subject=p_subject and window_start=v_day) >= v_limit then return 'rate_limited'; end if;
 if p_kind='parse' then
  insert into public.request_budgets values('parse_minute',p_subject,v_minute,0) on conflict do nothing;
  if (select used from public.request_budgets where bucket='parse_minute' and subject=p_subject and window_start=v_minute) >= 3 then return 'rate_limited'; end if;
  update public.request_budgets set used=used+1 where bucket='parse_minute' and subject=p_subject and window_start=v_minute;
 end if;
 update public.request_budgets set used=used+1 where bucket=p_kind and subject in ('global',p_subject) and window_start=v_day;
 -- No source IP is stored; contact subjects are one-day HMACs. Bound counter retention.
 delete from public.request_budgets where window_start < now()-interval '2 days';
 return 'allowed';
end;
$$;
revoke all on function public.claim_request_budget(text,text,uuid) from public,anon,authenticated,hermes_operator;
grant execute on function public.claim_request_budget(text,text,uuid) to service_role;

-- P0-08: table-level REVOKE does not revoke existing column grants.
revoke all on public.contact_messages from anon,authenticated;
revoke insert(name,email,message) on public.contact_messages from anon,authenticated;

-- P0-02: clients must not accept invitations by changing columns directly.
revoke update(member_user_id,accepted_at,status) on public.account_members from anon,authenticated;

-- P0-06: enforce entitlement under the owner's profile lock, even via direct REST.
-- A trigger keeps existing self-service clients compatible while protecting all writers.
create function public.enforce_monitoring_target_quota()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_plan text;
begin
 if tg_op='UPDATE' and new.user_id is distinct from old.user_id then
  raise exception 'target owner is immutable' using errcode='42501';
 end if;
 select plan into v_plan from public.user_profiles where id=new.user_id for update;
 if not found or v_plan not in ('monitoring','monitoring_accountant') or not exists (
  select 1 from public.subscriptions where user_id=new.user_id
   and subscription_status='active' and current_period_end > now()
 ) then raise exception 'active monitoring subscription required' using errcode='42501'; end if;
 if tg_op='INSERT' and v_plan='monitoring' and (select count(*) from public.monitoring_targets where user_id=new.user_id)>=10 then
  raise exception 'monitoring target limit reached' using errcode='42501';
 end if;
 return new;
end;
$$;
revoke all on function public.enforce_monitoring_target_quota() from public,anon,authenticated,hermes_operator;
create trigger enforce_monitoring_target_quota before insert or update of user_id,identifier_type,identifier_value,label
 on public.monitoring_targets for each row execute function public.enforce_monitoring_target_quota();


-- P0-07: subscription labels never replace the document wallet.
create or replace function public.use_credit(
 p_user_id uuid,
 p_document_type text,
 p_document_number text
)
returns table(allowed boolean, credit_used boolean)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 v_type text;
 v_number text;
 v_plan text;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to use credit' using errcode = '42501';
 end if;

 v_type := case lower(regexp_replace(coalesce(p_document_type, ''), '[^a-zA-Z]', '', 'g'))
  when 'invoice' then 'Invoice'
  when 'creditnote' then 'CreditNote'
  else null
 end;
 v_number := lower(btrim(coalesce(p_document_number, '')));
 if v_type is null or v_number = '' then
  raise exception 'valid document type and number required' using errcode = '22023';
 end if;

 select coalesce(plan, 'free') into v_plan
 from public.user_profiles
 where id = p_user_id
 for update;
 if not found then
  raise exception 'profile_not_found';
 end if;


 if exists (
  select 1 from public.ubl_credit_consumptions c
  where c.user_id = p_user_id
    and c.document_type = v_type
    and c.normalized_document_number = v_number
 ) then
  return query select true, false;
  return;
 end if;

 update public.user_profiles
 set credits = credits - 1
 where id = p_user_id and credits > 0;
 if not found then
  return query select false, false;
  return;
 end if;

 insert into public.ubl_credit_consumptions(user_id, document_type, normalized_document_number)
 values (p_user_id, v_type, v_number);
 return query select true, true;
end;
$$;

-- P0-07: subscription labels never replace the document wallet.
create or replace function public.can_use_credit(
 p_user_id uuid,
 p_document_type text,
 p_document_number text
)
returns boolean
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
 v_type text;
 v_number text;
 v_plan text;
 v_credits integer;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to check credit' using errcode = '42501';
 end if;
 v_type := case lower(regexp_replace(coalesce(p_document_type, ''), '[^a-zA-Z]', '', 'g'))
  when 'invoice' then 'Invoice'
  when 'creditnote' then 'CreditNote'
  else null
 end;
 v_number := lower(btrim(coalesce(p_document_number, '')));
 if v_type is null then return false; end if;

 select coalesce(plan, 'free'), credits into v_plan, v_credits
 from public.user_profiles where id = p_user_id;
 if not found then return false; end if;
 if v_credits > 0 then return true; end if;
 if v_number = '' then return false; end if;
 return exists (
  select 1 from public.ubl_credit_consumptions c
  where c.user_id = p_user_id
    and c.document_type = v_type
    and c.normalized_document_number = v_number
 );
end;
$$;

commit;
