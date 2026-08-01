-- Retention policy for monitoring data and pending team invites.

alter table public.account_members
 add column if not exists status text;

update public.account_members
 set status = case when accepted_at is not null then 'accepted' else 'pending' end
 where status is null;

alter table public.account_members
 alter column status set default 'pending';

alter table public.account_members
 drop constraint if exists account_members_status_check;

alter table public.account_members
 add constraint account_members_status_check
 check (status in ('pending', 'accepted', 'expired'));

alter table public.account_members
 alter column invite_email drop not null;

alter table public.monitoring_webhook_configs
 add column if not exists disclaimer_accepted_at timestamptz;

-- Pending invite uniqueness only applies while the email PII is still retained.
drop index if exists account_members_pending_email_idx;
create unique index if not exists account_members_pending_email_idx
 on public.account_members(account_owner_id, lower(invite_email))
 where status = 'pending' and invite_email is not null;

-- Accepted-member access must disappear immediately when the row is deleted or status changes.
drop policy if exists "owner or member monitoring targets select" on public.monitoring_targets;
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
    and am.status = 'accepted'
  )
 );

drop policy if exists "owner or member monitoring events select" on public.monitoring_events;
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
    and am.status = 'accepted'
  )
 );

drop policy if exists "accepted members read membership" on public.account_members;
create policy "accepted members read membership"
 on public.account_members for select
 using (auth.uid() = member_user_id and accepted_at is not null and status = 'accepted');

drop policy if exists "invited user can accept membership" on public.account_members;
create policy "invited user can accept membership"
 on public.account_members for update
 using (lower(invite_email) = lower(coalesce(auth.jwt() ->> 'email', '')) and status = 'pending' and accepted_at is null)
 with check (lower(invite_email) = lower(coalesce(auth.jwt() ->> 'email', '')) and status = 'accepted');

comment on table public.monitoring_events is 'Monitoring event history is retained for 12 months; older events are deleted by retention cleanup.';
comment on table public.account_members is 'Pending team invites expire after 30 days; expired rows keep audit metadata but remove invite_email PII.';
