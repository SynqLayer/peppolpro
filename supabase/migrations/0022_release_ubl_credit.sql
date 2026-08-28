-- Release one UBL generation credit after a server-side failure following use_credit.
-- Used by /api/generate and /api/convert to keep starter credits from being lost
-- when conversion persistence fails after an atomic debit.

create or replace function public.release_ubl_credit(p_user_id uuid)
returns table(credits integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
 if coalesce(auth.role(), '') <> 'service_role' then
  raise exception 'service_role required to release UBL credit' using errcode = '42501';
 end if;

 return query
 update public.user_profiles up
 set credits = up.credits + 1
 where up.id = p_user_id
 returning up.credits;
end;
$$;

revoke all on function public.release_ubl_credit(uuid) from public, anon, authenticated, hermes_operator;
grant execute on function public.release_ubl_credit(uuid) to service_role;
