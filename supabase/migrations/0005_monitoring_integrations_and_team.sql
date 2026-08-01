-- Monitoring integrations and multi-user accounts.

create table if not exists public.api_keys (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 key_hash text not null,
 created_at timestamptz not null default now(),
 last_used_at timestamptz,
 revoked_at timestamptz
);

create index if not exists api_keys_user_id_idx
 on public.api_keys(user_id);

create unique index if not exists api_keys_key_hash_active_idx
 on public.api_keys(key_hash)
 where revoked_at is null;

create table if not exists public.monitoring_webhook_configs (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 webhook_url text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 revoked_at timestamptz,
 constraint monitoring_webhook_configs_user_unique unique (user_id),
 constraint monitoring_webhook_configs_https check (webhook_url ~ '^https://')
);

create table if not exists public.account_members (
 id uuid primary key default gen_random_uuid(),
 account_owner_id uuid not null references auth.users(id) on delete cascade,
 member_user_id uuid references auth.users(id) on delete cascade,
 invite_email text not null,
 role text not null default 'viewer' check (role in ('viewer','admin')),
 invited_at timestamptz not null default now(),
 accepted_at timestamptz,
 constraint account_members_owner_not_member check (member_user_id is null or account_owner_id <> member_user_id)
);

create unique index if not exists account_members_pending_email_idx
 on public.account_members(account_owner_id, lower(invite_email))
 where accepted_at is null;

create unique index if not exists account_members_accepted_member_idx
 on public.account_members(account_owner_id, member_user_id)
 where member_user_id is not null and accepted_at is not null;

alter table public.api_keys enable row level security;
alter table public.monitoring_webhook_configs enable row level security;
alter table public.account_members enable row level security;

create policy "own api keys select"
 on public.api_keys for select
 using (auth.uid() = user_id);

create policy "own api keys insert"
 on public.api_keys for insert
 with check (auth.uid() = user_id);

create policy "own api keys update"
 on public.api_keys for update
 using (auth.uid() = user_id)
 with check (auth.uid() = user_id);

create policy "own webhook config select"
 on public.monitoring_webhook_configs for select
 using (auth.uid() = user_id);

create policy "own webhook config insert"
 on public.monitoring_webhook_configs for insert
 with check (auth.uid() = user_id);

create policy "own webhook config update"
 on public.monitoring_webhook_configs for update
 using (auth.uid() = user_id)
 with check (auth.uid() = user_id);

create policy "own webhook config delete"
 on public.monitoring_webhook_configs for delete
 using (auth.uid() = user_id);

create policy "account owners manage members"
 on public.account_members for all
 using (auth.uid() = account_owner_id)
 with check (auth.uid() = account_owner_id);

create policy "accepted members read membership"
 on public.account_members for select
 using (auth.uid() = member_user_id and accepted_at is not null);

create policy "invited user can accept membership"
 on public.account_members for update
 using (lower(invite_email) = lower(coalesce(auth.jwt() ->> 'email', '')) and accepted_at is null)
 with check (lower(invite_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Extend monitoring target read access to accepted account members.
drop policy if exists "own monitoring targets select" on public.monitoring_targets;
create policy "owner or member monitoring targets select"
 on public.monitoring_targets for select
 using (
  auth.uid() = user_id
  or exists (
   select 1
   from public.account_members am
   where am.account_owner_id = monitoring_targets.user_id
    and am.member_user_id = auth.uid()
    and am.accepted_at is not null
  )
 );

-- Events are still service_role-write only, but accepted members may read events for shared targets.
drop policy if exists "read own monitoring events" on public.monitoring_events;
create policy "owner or member monitoring events select"
 on public.monitoring_events for select
 using (
  auth.uid() = user_id
  or exists (
   select 1
   from public.account_members am
   where am.account_owner_id = monitoring_events.user_id
    and am.member_user_id = auth.uid()
    and am.accepted_at is not null
  )
 );
