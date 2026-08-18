-- PeppolPro sending bundles and Recommand sender profile fields

alter table public.user_profiles
 add column if not exists postal_code text,
 add column if not exists city text,
 add column if not exists recommand_company_id text,
 add column if not exists recommand_verified boolean not null default false,
 add column if not exists recommand_verification_url text,
 add column if not exists recommand_raw_response jsonb;

create index if not exists user_profiles_recommand_company_id_idx
 on public.user_profiles (recommand_company_id)
 where recommand_company_id is not null;

alter table public.user_profiles
 drop constraint if exists user_profiles_plan_check;

alter table public.user_profiles
 add constraint user_profiles_plan_check
 check (plan in ('free','verzenden_25','verzenden_100','monitoring','monitoring_accountant','compleet','pro','accountant'));

alter table public.subscriptions
 drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
 add constraint subscriptions_plan_check
 check (plan in ('verzenden_25','verzenden_100','monitoring','monitoring_accountant'));
