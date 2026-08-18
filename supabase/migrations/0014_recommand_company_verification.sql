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
