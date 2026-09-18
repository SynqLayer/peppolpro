begin;
alter table public.user_profiles
 add column send_credit_debt integer not null default 0 check(send_credit_debt>=0),
 add column ubl_credit_debt integer not null default 0 check(ubl_credit_debt>=0);
alter table public.invoices add column payment_adjustment_key text;
create unique index invoices_payment_adjustment_unique on public.invoices(payment_id,payment_adjustment_key) where payment_adjustment_key is not null;
create table public.payment_adjustments (
 payment_id uuid not null references public.payments(id) on delete restrict,
 adjustment_key text not null,
 kind text not null check(kind in ('refund','chargeback','chargeback_reversed')),
 amount_cents integer not null check(amount_cents<>0),
 credit_delta integer not null,
 invoice_id uuid references public.invoices(id) on delete restrict,
 created_at timestamptz not null default now(),
 primary key(payment_id,adjustment_key)
);
alter table public.payment_adjustments enable row level security;
revoke all on public.payment_adjustments from public,anon,authenticated,hermes_operator;
grant all on public.payment_adjustments to service_role;

-- Consumed refunded rights become debt. Every later grant (including goodwill)
-- settles that debt before it can increase the available wallet.
create function public.settle_credit_debt()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare v_pay integer;
begin
 v_pay:=least(greatest(new.credits-old.credits,0),new.ubl_credit_debt);
 new.credits:=new.credits-v_pay;new.ubl_credit_debt:=new.ubl_credit_debt-v_pay;
 v_pay:=least(greatest(new.send_credits-old.send_credits,0),new.send_credit_debt);
 new.send_credits:=new.send_credits-v_pay;new.send_credit_debt:=new.send_credit_debt-v_pay;
 return new;
end;
$$;
revoke all on function public.settle_credit_debt() from public,anon,authenticated,hermes_operator;
create trigger settle_credit_debt before update of credits,send_credits on public.user_profiles for each row execute function public.settle_credit_debt();

create function public.apply_mollie_payment_adjustments(p_payment_id uuid,p_adjustments jsonb,p_expires_at timestamptz default null)
returns table(net_refunded_cents integer)
language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_payment public.payments%rowtype;
 v_profile public.user_profiles%rowtype;
 v_original public.invoices%rowtype;
 v_item jsonb;
 v_key text;
 v_kind text;
 v_cents integer;
 v_before integer;
 v_after integer;
 v_total integer;
 v_delta integer;
 v_previous integer;
 v_bundle_credits integer := 0;
 v_amount numeric(12,2);
 v_vat numeric(12,2);
 v_year integer := extract(year from now());
 v_seq integer;
 v_number text;
 v_invoice_id uuid;
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'service_role required' using errcode='42501'; end if;
 if jsonb_typeof(p_adjustments) is distinct from 'array' or jsonb_array_length(p_adjustments)>1000 then raise exception 'invalid adjustments'; end if;
 select * into v_payment from public.payments where id=p_payment_id for update;
 if not found or v_payment.user_id is null or v_payment.mollie_mode is distinct from 'live' or v_payment.status is distinct from 'paid' then raise exception 'live paid payment required'; end if;
 v_total := round(v_payment.amount*100)::integer;
 if v_total<=0 then raise exception 'invalid paid amount'; end if;
 select * into v_profile from public.user_profiles where id=v_payment.user_id for update;
 if not found then raise exception 'profile_not_found'; end if;
 select * into v_original from public.invoices where payment_id=p_payment_id and invoice_kind<>'credit' and payment_adjustment_key is null order by created_at limit 1;
 if not found then
  perform public.create_billing_invoice_for_payment(p_payment_id,null,null,null,null,'live');
  select * into strict v_original from public.invoices where payment_id=p_payment_id and invoice_kind<>'credit' and payment_adjustment_key is null;
 end if;
 if v_payment.plan in ('send_credits_10','send_credits_25','send_credits_50') then
  v_bundle_credits := case v_payment.plan when 'send_credits_10' then 10 when 'send_credits_25' then 25 else 50 end;
  if v_payment.credits<>v_bundle_credits or p_expires_at is null then raise exception 'invalid bundle grant'; end if;
  -- The original grant and every newly observed reversal commit together.
  perform public.grant_send_credit_bundle(v_payment.user_id,v_payment.plan,v_bundle_credits,v_payment.amount,v_payment.mollie_payment_id,p_expires_at);
 end if;
 for v_item in select value from jsonb_array_elements(p_adjustments) order by value->>'key' loop
  v_key:=v_item->>'key';v_kind:=v_item->>'kind';v_cents:=(v_item->>'cents')::integer;
  if v_key is null or v_kind is null or v_cents is null or length(v_key)>160 or v_kind not in ('refund','chargeback','chargeback_reversed') or v_cents=0 or abs(v_cents)>v_total
   or (v_kind='chargeback_reversed')<>(v_cents<0) then raise exception 'invalid provider adjustment'; end if;
  select amount_cents into v_previous from public.payment_adjustments where payment_id=p_payment_id and adjustment_key=v_key;
  if found then
   if v_previous<>v_cents then raise exception 'provider adjustment changed amount'; end if;
   continue;
  end if;
  select coalesce(sum(amount_cents),0)::integer into v_before from public.payment_adjustments where payment_id=p_payment_id;
  v_after:=v_before+v_cents;
  if v_after<0 then raise exception 'chargeback reversal requires original chargeback'; end if;
  v_delta:=ceil(least(v_total,v_after)::numeric*v_bundle_credits/v_total)::integer-ceil(least(v_total,v_before)::numeric*v_bundle_credits/v_total)::integer;
  if v_delta>0 then
   update public.user_profiles set
    send_credit_debt=send_credit_debt+greatest(v_delta-send_credits,0),
    ubl_credit_debt=ubl_credit_debt+greatest(v_delta-credits,0),
    send_credits=greatest(send_credits-v_delta,0),credits=greatest(credits-v_delta,0)
   where id=v_payment.user_id;
  elsif v_delta<0 then
   update public.user_profiles set send_credits=send_credits-v_delta,credits=credits-v_delta where id=v_payment.user_id;
  end if;
  v_amount:=-v_cents::numeric/100;
  v_vat:=round(v_amount-v_amount/1.21,2);
  insert into public.invoice_number_sequences(year,last_number) values(v_year,1)
   on conflict(year) do update set last_number=public.invoice_number_sequences.last_number+1,updated_at=now() returning last_number into v_seq;
  v_number:='INV-'||v_year||'-'||lpad(v_seq::text,5,'0');
  insert into public.invoices(user_id,invoice_number,invoice_date,currency,status,total_excl,vat_total,total_incl,payment_id,amount,vat_amount,vat_rate,issued_at,invoice_kind,original_invoice_id,original_invoice_number,payment_adjustment_key,pdf_retention_until,legal_supplier_name,legal_supplier_address,legal_supplier_postal_code,legal_supplier_city,legal_supplier_country,legal_supplier_vat_id,legal_supplier_kvk)
   values(v_payment.user_id,v_number,current_date,'EUR','generated',v_amount-v_vat,v_vat,v_amount,p_payment_id,v_amount,v_vat,21,now(),case when v_cents>0 then 'credit' else v_original.invoice_kind end,v_original.id,v_original.invoice_number,v_key,now()+interval '7 years',v_original.legal_supplier_name,v_original.legal_supplier_address,v_original.legal_supplier_postal_code,v_original.legal_supplier_city,v_original.legal_supplier_country,v_original.legal_supplier_vat_id,v_original.legal_supplier_kvk)
   returning id into v_invoice_id;
  insert into public.payment_adjustments(payment_id,adjustment_key,kind,amount_cents,credit_delta,invoice_id) values(p_payment_id,v_key,v_kind,v_cents,-v_delta,v_invoice_id);
 end loop;
 select coalesce(sum(amount_cents),0)::integer into v_after from public.payment_adjustments where payment_id=p_payment_id;
 if v_bundle_credits=0 and v_after>0 then
  -- An old refund must not cancel a newer paid period.
  update public.subscriptions set subscription_status='suspended',updated_at=now() where user_id=v_payment.user_id and last_payment_id=v_payment.mollie_payment_id;
  if found then update public.user_profiles set plan='free' where id=v_payment.user_id; end if;
 end if;
 return query select v_after;
end;
$$;
revoke all on function public.apply_mollie_payment_adjustments(uuid,jsonb,timestamptz) from public,anon,authenticated,hermes_operator;
grant execute on function public.apply_mollie_payment_adjustments(uuid,jsonb,timestamptz) to service_role;
commit;
