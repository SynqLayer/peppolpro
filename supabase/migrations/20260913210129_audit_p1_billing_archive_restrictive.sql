-- P1-02 RESTRICTIVE: execute only after the application deployment is READY.
alter table public.invoices alter column user_id drop not null;
alter table public.invoices drop constraint invoices_user_id_fkey;
alter table public.invoices add constraint invoices_user_id_fkey
 foreign key (user_id) references auth.users(id) on delete set null;

alter table public.invoices add constraint invoices_exact_billing_retention check (
 invoice_kind not in ('subscription','credits','credit') or
 (pdf_retention_until is not null and pdf_retention_until =
  (public.invoice_retention_until(invoice_date)::timestamp at time zone 'UTC'))
);

create or replace function public.protect_billing_invoice_archive()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare v_mutable text[] := array['status','email_status','brevo_message_id','email_accepted_at',
 'email_delivered_at','email_error','updated_at','pdf_path','admin_pdf_path','pdf_stored_at',
 'pdf_sha256','admin_pdf_sha256','user_id','payment_id','subscription_id','client_id','original_invoice_id'];
 v_key text;
begin
 if old.invoice_kind not in ('subscription','credits','credit') then
  if tg_op = 'DELETE' then return old; end if;
  return new;
 end if;
 if tg_op = 'DELETE' then
  if current_date <= public.invoice_retention_until(old.invoice_date) then raise exception 'billing archive is within statutory retention'; end if;
  return old;
 end if;
 if (to_jsonb(old) - v_mutable) is distinct from (to_jsonb(new) - v_mutable) then
  raise exception 'issued billing invoice is immutable';
 end if;
 foreach v_key in array array['pdf_path','admin_pdf_path','pdf_sha256','admin_pdf_sha256','pdf_stored_at'] loop
  if to_jsonb(old)->>v_key is not null and (to_jsonb(old)->v_key) is distinct from (to_jsonb(new)->v_key) then
   raise exception 'billing archive cannot be replaced';
  end if;
 end loop;
 -- Foreign keys may detach deleted accounts/payments while snapshots remain intact.
 foreach v_key in array array['user_id','payment_id','subscription_id','client_id','original_invoice_id'] loop
  if (to_jsonb(new)->>v_key) is not null and (to_jsonb(old)->v_key) is distinct from (to_jsonb(new)->v_key) then
   raise exception 'billing identity cannot be reassigned';
  end if;
 end loop;
 return new;
end;
$$;
revoke all on function public.protect_billing_invoice_archive() from public, anon, authenticated, hermes_operator;
create trigger protect_billing_invoice_archive before update or delete on public.invoices
 for each row execute function public.protect_billing_invoice_archive();
