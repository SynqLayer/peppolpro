-- Harden client-facing table privileges against privilege escalation.
-- Client roles keep only the least privileges needed by app flows; privileged writes use service_role.

-- clients: customer records are user-owned, but this app currently writes invoices via server conversion routes.
-- Keep client roles read-only to avoid cross-account/customer-data tampering.
revoke all on table public.clients from anon, authenticated;
grant select on table public.clients to authenticated;
grant all on table public.clients to service_role;

drop policy if exists "own clients" on public.clients;
drop policy if exists "own clients select" on public.clients;
create policy "own clients select"
 on public.clients for select
 using (auth.uid() = user_id);

-- invoice_lines: amounts and quantities are financial data; no direct client writes.
revoke all on table public.invoice_lines from anon, authenticated;
grant select on table public.invoice_lines to authenticated;
grant all on table public.invoice_lines to service_role;

drop policy if exists "own lines" on public.invoice_lines;
drop policy if exists "own invoice lines select" on public.invoice_lines;
create policy "own invoice lines select" on public.invoice_lines for select
 using (exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid()));

-- inbox_messages: users may read and mark their own inbox message status only; content is service-role written.
revoke all on table public.inbox_messages from anon, authenticated;
grant select on table public.inbox_messages to authenticated;
grant update (status) on table public.inbox_messages to authenticated;
grant all on table public.inbox_messages to service_role;

drop policy if exists "update own inbox" on public.inbox_messages;
drop policy if exists "update own inbox status" on public.inbox_messages;
create policy "update own inbox status"
 on public.inbox_messages for update
 using (auth.uid() = user_id)
 with check (auth.uid() = user_id);

-- contact_messages: public contact form can insert only visitor-supplied contact fields; never read/update/delete.
revoke all on table public.contact_messages from anon, authenticated;
grant insert (name, email, message) on table public.contact_messages to anon, authenticated;
grant all on table public.contact_messages to service_role;

-- scan_logs and monitoring_events are audit/history tables. Users may read their own rows only.
revoke all on table public.scan_logs from anon, authenticated;
grant select on table public.scan_logs to authenticated;
grant all on table public.scan_logs to service_role;

revoke all on table public.monitoring_events from anon, authenticated;
grant select on table public.monitoring_events to authenticated;
grant all on table public.monitoring_events to service_role;

-- invoice number sequencing is service-role/RPC only.
revoke all on table public.invoice_number_sequences from anon, authenticated;
grant all on table public.invoice_number_sequences to service_role;

-- user_profiles: authenticated users can read their own row and update onboarding/profile fields only.
revoke all on table public.user_profiles from anon, authenticated;
grant select on table public.user_profiles to authenticated;
grant update (company_name, country, kvk_kbo, btw_nr, address, postal_code, city, onboarding_complete)
 on table public.user_profiles to authenticated;
grant all on table public.user_profiles to service_role;

drop policy if exists "own profile" on public.user_profiles;
drop policy if exists "own profile select" on public.user_profiles;
drop policy if exists "own profile onboarding update" on public.user_profiles;
create policy "own profile select"
 on public.user_profiles for select
 using (auth.uid() = id);
create policy "own profile onboarding update"
 on public.user_profiles for update
 using (auth.uid() = id)
 with check (auth.uid() = id);

-- conversions: clients may only read their own rows; all writes are server/service-role only.
revoke all on table public.conversions from anon, authenticated;
grant select on table public.conversions to authenticated;
grant all on table public.conversions to service_role;

drop policy if exists "own conversions" on public.conversions;
drop policy if exists "own conversions select" on public.conversions;
create policy "own conversions select"
 on public.conversions for select
 using (auth.uid() = user_id);

-- invoices: clients may only read their own rows; all writes are server/service-role only.
revoke all on table public.invoices from anon, authenticated;
grant select on table public.invoices to authenticated;
grant all on table public.invoices to service_role;

drop policy if exists "own invoices" on public.invoices;
drop policy if exists "own invoices select" on public.invoices;
create policy "own invoices select"
 on public.invoices for select
 using (auth.uid() = user_id);

-- monitoring_targets: users can create and edit only non-system fields on owned targets.
revoke all on table public.monitoring_targets from anon, authenticated;
grant select on table public.monitoring_targets to authenticated;
grant insert (user_id, identifier_type, identifier_value, label) on table public.monitoring_targets to authenticated;
grant update (identifier_type, identifier_value, label) on table public.monitoring_targets to authenticated;
grant delete on table public.monitoring_targets to authenticated;
grant all on table public.monitoring_targets to service_role;

drop policy if exists "own monitoring targets insert" on public.monitoring_targets;
drop policy if exists "own monitoring targets update" on public.monitoring_targets;
drop policy if exists "own monitoring targets delete" on public.monitoring_targets;
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

-- account_members: owners can create/remove members; invite acceptance is column-limited.
revoke all on table public.account_members from anon, authenticated;
grant select on table public.account_members to authenticated;
grant insert (account_owner_id, invite_email, role, status) on table public.account_members to authenticated;
grant update (member_user_id, accepted_at, status) on table public.account_members to authenticated;
grant delete on table public.account_members to authenticated;
grant all on table public.account_members to service_role;

drop policy if exists "account owners manage members" on public.account_members;
drop policy if exists "account owners insert members" on public.account_members;
drop policy if exists "account owners delete members" on public.account_members;
drop policy if exists "invited user can accept membership" on public.account_members;
create policy "account owners insert members"
 on public.account_members for insert
 with check (auth.uid() = account_owner_id);
create policy "account owners delete members"
 on public.account_members for delete
 using (auth.uid() = account_owner_id or auth.uid() = member_user_id);
create policy "invited user can accept membership"
 on public.account_members for update
 using (lower(invite_email) = lower(coalesce(auth.jwt() ->> 'email', '')) and status = 'pending' and accepted_at is null)
 with check (
  lower(invite_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  and member_user_id = auth.uid()
  and status = 'accepted'
  and accepted_at is not null
 );

-- api_keys: users may list their keys, but creation/revocation/hash writes are server/service-role only.
revoke all on table public.api_keys from anon, authenticated;
grant select on table public.api_keys to authenticated;
grant all on table public.api_keys to service_role;

drop policy if exists "own api keys insert" on public.api_keys;
drop policy if exists "own api keys update" on public.api_keys;

-- monitoring_webhook_configs: visible to owner, writes/revocation only through server service-role routes.
revoke all on table public.monitoring_webhook_configs from anon, authenticated;
grant select on table public.monitoring_webhook_configs to authenticated;
grant all on table public.monitoring_webhook_configs to service_role;

drop policy if exists "own webhook config insert" on public.monitoring_webhook_configs;
drop policy if exists "own webhook config update" on public.monitoring_webhook_configs;
drop policy if exists "own webhook config delete" on public.monitoring_webhook_configs;
