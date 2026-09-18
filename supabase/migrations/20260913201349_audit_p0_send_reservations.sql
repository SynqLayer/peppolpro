begin;
create table public.send_reservations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete restrict,
 document_type text not null check(document_type in ('Invoice','CreditNote')),
 document_number text not null check(length(document_number)>0),
 target_table text not null check(target_table in ('conversions','invoices')),
 target_id uuid not null,
 claim_token uuid not null default gen_random_uuid(),
 state text not null check(state in ('reserved','submitting','used','released')),
 claimed_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,document_type,document_number)
);
create table public.send_credit_ledger (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete restrict,
 reservation_id uuid not null references public.send_reservations(id),
 claim_token uuid not null,
 event text not null check(event in ('reserve','release','use')),
 delta integer not null,
 created_at timestamptz not null default now(),
 unique(reservation_id,claim_token,event)
);
alter table public.send_reservations enable row level security;
alter table public.send_credit_ledger enable row level security;
revoke all on public.send_reservations,public.send_credit_ledger from public,anon,authenticated,hermes_operator;
grant all on public.send_reservations,public.send_credit_ledger to service_role;
grant usage on sequence public.send_credit_ledger_id_seq to service_role;

create function public.claim_recommand_send_with_credit(p_target_table text,p_target_id uuid,p_user_id uuid)
returns table(claimed boolean,claim_action text,reservation_id uuid,claim_token uuid,send_credits integer,recommand_claimed_at timestamptz)
language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_profile public.user_profiles%rowtype;
 v_target record;
 v_res public.send_reservations%rowtype;
 v_type text;
 v_number text;
 v_now timestamptz := clock_timestamp();
 v_token uuid := gen_random_uuid();
 v_debit boolean := false;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
 if p_target_table not in ('conversions','invoices') then raise exception 'invalid target' using errcode='22023'; end if;
 select * into v_profile from public.user_profiles where id=p_user_id for update;
 if not found then raise exception 'profile_not_found'; end if;
 if not coalesce(v_profile.recommand_verified,false) or v_profile.recommand_company_id is null then
  raise exception 'verified company required' using errcode='42501';
 end if;
 execute format('select invoice_number,ubl_xml,recommand_status,sent_via_recommand_at from public.%I where id=$1 and user_id=$2 for update',p_target_table)
  into v_target using p_target_id,p_user_id;
 if v_target is null then raise exception 'target_not_found'; end if;
 v_type := case when v_target.ubl_xml like '%<ubl:CreditNote%' or v_target.ubl_xml like '%<CreditNote%' then 'CreditNote' else 'Invoice' end;
 v_number := lower(btrim(v_target.invoice_number));
 if coalesce(v_number,'')='' then raise exception 'document_number_required'; end if;
 -- A document has one identity even when regenerated into another conversion row.
 if exists(select 1 from public.conversions c where c.user_id=p_user_id and lower(btrim(c.invoice_number))=v_number and c.document_type=v_type
   and (c.sent_via_recommand_at is not null or c.recommand_status in ('sent','delivered','as4_received')))
 or exists(select 1 from public.invoices i where i.user_id=p_user_id and lower(btrim(i.invoice_number))=v_number
   and (case when i.ubl_xml like '%<ubl:CreditNote%' or i.ubl_xml like '%<CreditNote%' then 'CreditNote' else 'Invoice' end)=v_type
   and (i.sent_via_recommand_at is not null or i.recommand_status in ('sent','delivered','as4_received'))) then
  return query select false,'duplicate_document',null::uuid,null::uuid,v_profile.send_credits,null::timestamptz;return;
 end if;
 select * into v_res from public.send_reservations r where r.user_id=p_user_id and r.document_type=v_type and r.document_number=v_number for update;
 if found then
  if v_res.state in ('submitting','used') or (v_res.state='reserved' and v_res.claimed_at > now()-interval '10 minutes') then
   return query select false,'processing',v_res.id,v_res.claim_token,v_profile.send_credits,v_res.claimed_at;return;
  end if;
  v_debit := v_res.state='released';
 else
  -- Legacy claims have no reservation evidence. Never infer non-delivery from a
  -- negative provider search or charge a second time after an old crash.
  if exists(select 1 from public.conversions c where c.user_id=p_user_id and lower(btrim(c.invoice_number))=v_number and c.document_type=v_type and c.recommand_status in ('sending','send_outcome_unknown'))
   or exists(select 1 from public.invoices i where i.user_id=p_user_id and lower(btrim(i.invoice_number))=v_number and i.recommand_status in ('sending','send_outcome_unknown')) then
   return query select false,'manual_reconciliation',null::uuid,null::uuid,v_profile.send_credits,null::timestamptz;return;
  end if;
  v_debit := true;
 end if;
 if v_debit then
  if v_profile.send_credits<=0 or v_profile.send_credits_expires_at is null or v_profile.send_credits_expires_at<=now() then
   return query select false,'no_credit',null::uuid,null::uuid,v_profile.send_credits,null::timestamptz;return;
  end if;
  update public.user_profiles set send_credits=user_profiles.send_credits-1 where id=p_user_id returning * into v_profile;
 end if;
 if v_res.id is null then
  insert into public.send_reservations(user_id,document_type,document_number,target_table,target_id,claim_token,state,claimed_at)
   values(p_user_id,v_type,v_number,p_target_table,p_target_id,v_token,'reserved',v_now) returning * into v_res;
 else
  -- Reclaim a pre-submission reservation without another wallet debit. Keep the
  -- original ledger token for that debit; the new claim token fences old workers.
  update public.send_reservations set target_table=p_target_table,target_id=p_target_id,claim_token=v_token,state='reserved',claimed_at=v_now,updated_at=v_now
   where id=v_res.id returning * into v_res;
 end if;
 if v_debit then
  insert into public.send_credit_ledger(user_id,reservation_id,claim_token,event,delta) values(p_user_id,v_res.id,v_token,'reserve',-1);
 end if;
 execute format('update public.%I set recommand_status=''sending'',recommand_claimed_at=$1 where id=$2 and user_id=$3',p_target_table) using v_now,p_target_id,p_user_id;
 return query select true,'claimed',v_res.id,v_token,v_profile.send_credits,v_now;
end;
$$;

create function public.begin_recommand_submission(p_reservation_id uuid,p_claim_token uuid,p_user_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
 update public.send_reservations set state='submitting',updated_at=now()
  where id=p_reservation_id and claim_token=p_claim_token and user_id=p_user_id and state='reserved';
 return found;
end;
$$;

create function public.release_recommand_reservation(p_reservation_id uuid,p_claim_token uuid,p_user_id uuid)
returns table(send_credits integer) language plpgsql security definer set search_path=public,pg_temp as $$
declare v_res public.send_reservations%rowtype;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
 perform 1 from public.user_profiles where id=p_user_id for update;
 select * into v_res from public.send_reservations where id=p_reservation_id and user_id=p_user_id for update;
 if not found or v_res.claim_token<>p_claim_token then raise exception 'reservation_claim_lost'; end if;
 if v_res.state='used' then raise exception 'accepted_send_cannot_be_released'; end if;
 if v_res.state<>'released' then
  update public.user_profiles set send_credits=user_profiles.send_credits+1 where id=p_user_id;
  update public.send_reservations set state='released',updated_at=now() where id=v_res.id;
  insert into public.send_credit_ledger(user_id,reservation_id,claim_token,event,delta) values(p_user_id,v_res.id,p_claim_token,'release',1);
  execute format('update public.%I set recommand_status=''send_failed'',recommand_claimed_at=null where id=$1 and user_id=$2 and sent_via_recommand_at is null',v_res.target_table) using v_res.target_id,p_user_id;
 end if;
 return query select p.send_credits from public.user_profiles p where id=p_user_id;
end;
$$;

create function public.record_recommand_reservation_use()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_res public.send_reservations%rowtype;
begin
 if new.sent_via_recommand_at is not null then
  update public.send_reservations set state='used',updated_at=now()
   where target_table=tg_table_name and target_id=new.id and user_id=new.user_id and state in ('reserved','submitting') returning * into v_res;
  if found then
   insert into public.send_credit_ledger(user_id,reservation_id,claim_token,event,delta) values(new.user_id,v_res.id,v_res.claim_token,'use',0) on conflict do nothing;
  end if;
 end if;
 return new;
end;
$$;
create trigger record_recommand_reservation_use after update of sent_via_recommand_at on public.conversions for each row execute function public.record_recommand_reservation_use();
create trigger record_recommand_reservation_use after update of sent_via_recommand_at on public.invoices for each row execute function public.record_recommand_reservation_use();
revoke all on function public.claim_recommand_send_with_credit(text,uuid,uuid),public.begin_recommand_submission(uuid,uuid,uuid),public.release_recommand_reservation(uuid,uuid,uuid),public.record_recommand_reservation_use() from public,anon,authenticated,hermes_operator;
grant execute on function public.claim_recommand_send_with_credit(text,uuid,uuid),public.begin_recommand_submission(uuid,uuid,uuid),public.release_recommand_reservation(uuid,uuid,uuid) to service_role;
commit;
