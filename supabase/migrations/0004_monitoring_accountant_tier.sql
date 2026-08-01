-- PeppolPro monitoring accountant tier

alter table public.user_profiles
 drop constraint if exists user_profiles_plan_check;

alter table public.user_profiles
 add constraint user_profiles_plan_check
 check (plan in ('free','compleet','monitoring','monitoring_accountant','pro','accountant'));

-- Target caps are intentionally enforced in the API layer, not in RLS/database constraints.
