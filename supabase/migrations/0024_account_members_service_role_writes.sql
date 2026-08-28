-- Move account member creation/removal to server-side service-role routes.
-- Clients may only read visible membership rows and accept their own invite.

revoke insert, delete on table public.account_members from anon, authenticated;
revoke update on table public.account_members from anon, authenticated;
grant select on table public.account_members to authenticated;
grant update (member_user_id, accepted_at, status) on table public.account_members to authenticated;
grant all on table public.account_members to service_role;

drop policy if exists "account owners insert members" on public.account_members;
drop policy if exists "account owners delete members" on public.account_members;
