-- Replace the one-off Red Productions goodwill RPC with one bounded generic operation.
-- This migration changes functions only; it does not mutate balances or audit rows.

create or replace function public.grant_goodwill_send_credits(
 p_user_id uuid,
 p_amount integer,
 p_reason text
)
returns table(
 ledger_id uuid,
 applied boolean,
 credits integer,
 send_credits integer,
 send_credits_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_ledger_id uuid;
 v_applied boolean := false;
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to grant goodwill send credits' using errcode = '42501';
 end if;

 if p_amount is null or p_amount < 1 or p_amount > 10 then
  raise exception 'amount must be between 1 and 10' using errcode = '22023';
 end if;
 if p_reason is null or regexp_replace(p_reason, '[[:space:]]', '', 'g') = '' or length(p_reason) > 200 then
  raise exception 'reason must be between 1 and 200 characters' using errcode = '22023';
 end if;

 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_reason, 0));

 select sl.id into v_ledger_id
 from public.scan_logs sl
 where sl.user_id = p_user_id and sl.action = p_reason
 order by sl.created_at asc, sl.id asc
 limit 1;

 if v_ledger_id is null then
  insert into public.scan_logs(user_id, action, meta)
  values (
   p_user_id,
   p_reason,
   jsonb_build_object('send_credits_delta', p_amount, 'reason', p_reason)
  )
  returning id into v_ledger_id;

  update public.user_profiles up
  set send_credits = up.send_credits + p_amount
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

revoke all on function public.grant_goodwill_send_credits(uuid, integer, text)
 from public, anon, authenticated, hermes_operator;
grant execute on function public.grant_goodwill_send_credits(uuid, integer, text)
 to service_role;

drop function if exists public.grant_red_goodwill_send_credits(uuid);
