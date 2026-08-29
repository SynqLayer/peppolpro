-- Admin access is stored on user_profiles and is never client-writable.

alter table public.user_profiles
 add column if not exists is_admin boolean not null default false;

comment on column public.user_profiles.is_admin is 'Grants access to the internal admin panel. Only service_role may write this column.';

-- Re-assert the hardened grants from 0023 and deliberately exclude is_admin.
revoke all on table public.user_profiles from anon, authenticated;
grant select on table public.user_profiles to authenticated;
grant update (company_name, country, kvk_kbo, btw_nr, address, postal_code, city, onboarding_complete)
 on table public.user_profiles to authenticated;
grant all on table public.user_profiles to service_role;

-- Exactly one current admin account.
update public.user_profiles
 set is_admin = false
 where lower(coalesce(email, '')) <> 'arthybagdas@gmail.com';

update public.user_profiles
 set is_admin = true
 where lower(email) = 'arthybagdas@gmail.com';
