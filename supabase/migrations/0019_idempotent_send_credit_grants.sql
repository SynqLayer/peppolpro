-- Make send-credit bundle grants idempotent for Mollie webhook retries after partial success.

create or replace function public.grant_send_credit_bundle(
 p_user_id uuid,
 p_bundle_id text,
 p_credits integer,
 p_amount numeric,
 p_payment_id text,
 p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
 insert into public.send_credit_purchases(user_id, bundle_id, credits, amount, payment_id, expires_at)
 values (p_user_id, p_bundle_id, p_credits, p_amount, p_payment_id, p_expires_at)
 on conflict (payment_id) do nothing;

 if found then
  update public.user_profiles
  set send_credits = send_credits + p_credits,
      send_credits_expires_at = p_expires_at
  where id = p_user_id;
 end if;
end;
$$;

revoke all on function public.grant_send_credit_bundle(uuid, text, integer, numeric, text, timestamptz) from public;
grant execute on function public.grant_send_credit_bundle(uuid, text, integer, numeric, text, timestamptz) to service_role;
