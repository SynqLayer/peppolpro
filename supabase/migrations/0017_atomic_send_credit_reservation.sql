-- Atomic prepaid send-credit reservation helpers for Recommand sends.
-- Used by /api/recommand/send to avoid read-then-write races.

create or replace function public.reserve_send_credit(p_user_id uuid)
returns table(send_credits integer, send_credits_expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
 if auth.uid() is null or auth.uid() <> p_user_id then
  raise exception 'not authorized to reserve send credit' using errcode = '42501';
 end if;

 return query
 update public.user_profiles up
 set send_credits = up.send_credits - 1
 where up.id = p_user_id
   and up.send_credits > 0
   and up.send_credits_expires_at is not null
   and up.send_credits_expires_at > now()
 returning up.send_credits, up.send_credits_expires_at;
end;
$$;

create or replace function public.release_send_credit(p_user_id uuid)
returns table(send_credits integer, send_credits_expires_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
 if auth.uid() is null or auth.uid() <> p_user_id then
  raise exception 'not authorized to release send credit' using errcode = '42501';
 end if;

 return query
 update public.user_profiles up
 set send_credits = up.send_credits + 1
 where up.id = p_user_id
 returning up.send_credits, up.send_credits_expires_at;
end;
$$;

grant execute on function public.reserve_send_credit(uuid) to authenticated;
grant execute on function public.release_send_credit(uuid) to authenticated;
