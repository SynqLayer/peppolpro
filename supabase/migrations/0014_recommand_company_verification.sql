-- Recommand company-verification metadata only.
-- Core sender profile fields (recommand_company_id, recommand_verified,
-- postal_code, city) live in 0015, which also owns the company-id index.

alter table public.user_profiles
 add column if not exists recommand_verification_url text,
 add column if not exists recommand_raw_response jsonb;
