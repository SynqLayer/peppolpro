-- One-time +3 Peppol send-credit goodwill for Red Productions. Service-role only.
-- Idempotent via scan_logs(user_id, action) audit lookup under a transaction-scoped
-- per-account/reason advisory lock. Does not touch UBL document-generation credits
-- or the existing send-credit bundle expiry.

create or replace function public.grant_red_goodwill_send_credits(p_user_id uuid)
returns table(
 ledger_id uuid,
 applied boolean,
 credits integer,
 send_credits integer,
 send_credits_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
 v_reason constant text := 'goodwill_loyalty_20260911';
 v_amount constant integer := 3;
 v_ledger_id uuid;
 v_applied boolean := false;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to grant red goodwill send credits' using errcode = '42501';
 end if;

 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || v_reason, 0));

 select sl.id into v_ledger_id
 from public.scan_logs sl
 where sl.user_id = p_user_id and sl.action = v_reason
 limit 1;

 if v_ledger_id is null then
  insert into public.scan_logs(user_id, action, meta)
  values (p_user_id, v_reason, jsonb_build_object('send_credits_delta', v_amount, 'reason', v_reason))
  returning id into v_ledger_id;

  update public.user_profiles up
  set send_credits = up.send_credits + v_amount
  where up.id = p_user_id;
  if not found then raise exception 'profile_not_found'; end if;

  v_applied := true;
 end if;

 return query
 select v_ledger_id, v_applied, up.credits, up.send_credits, up.send_credits_expires_at
 from public.user_profiles up
 where up.id = p_user_id;
end;
$$;

revoke all on function public.grant_red_goodwill_send_credits(uuid) from public, anon, authenticated, hermes_operator;
grant execute on function public.grant_red_goodwill_send_credits(uuid) to service_role;
