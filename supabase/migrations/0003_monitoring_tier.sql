-- PeppolPro monitoring tier

alter table public.user_profiles
 drop constraint if exists user_profiles_plan_check;

alter table public.user_profiles
 add constraint user_profiles_plan_check
 check (plan in ('free','compleet','monitoring','pro','accountant'));

create table if not exists public.monitoring_targets (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 identifier_type text not null check (identifier_type in ('kvk','btw','peppol_id','company_name')),
 identifier_value text not null,
 label text,
 status text not null default 'active' check (status in ('active','paused','error')),
 last_checked_at timestamptz,
 last_result jsonb,
 created_at timestamptz default now()
);

create index if not exists monitoring_targets_user_id_idx
 on public.monitoring_targets(user_id);

create index if not exists monitoring_targets_status_idx
 on public.monitoring_targets(status);

create table if not exists public.monitoring_events (
 id uuid primary key default gen_random_uuid(),
 target_id uuid not null references public.monitoring_targets(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 event_type text not null,
 severity text not null default 'info' check (severity in ('info','warning','critical')),
 payload jsonb,
 created_at timestamptz default now()
);

create index if not exists monitoring_events_user_id_created_at_idx
 on public.monitoring_events(user_id, created_at desc);

create index if not exists monitoring_events_target_id_created_at_idx
 on public.monitoring_events(target_id, created_at desc);

create index if not exists monitoring_events_severity_idx
 on public.monitoring_events(severity);

alter table public.monitoring_targets enable row level security;
alter table public.monitoring_events enable row level security;

drop policy if exists "own monitoring targets select" on public.monitoring_targets;
drop policy if exists "own monitoring targets insert" on public.monitoring_targets;
drop policy if exists "own monitoring targets update" on public.monitoring_targets;
drop policy if exists "own monitoring targets delete" on public.monitoring_targets;
drop policy if exists "read own monitoring events" on public.monitoring_events;

create policy "own monitoring targets select"
 on public.monitoring_targets for select
 using (auth.uid() = user_id);

create policy "own monitoring targets insert"
 on public.monitoring_targets for insert
 with check (auth.uid() = user_id);

create policy "own monitoring targets update"
 on public.monitoring_targets for update
 using (auth.uid() = user_id)
 with check (auth.uid() = user_id);

create policy "own monitoring targets delete"
 on public.monitoring_targets for delete
 using (auth.uid() = user_id);

create policy "read own monitoring events"
 on public.monitoring_events for select
 using (auth.uid() = user_id);

-- Geen insert/update/delete policy op monitoring_events voor authenticated users:
-- alleen service_role/admin context mag monitoring events schrijven.
