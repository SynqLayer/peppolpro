-- Harden billing table grants. Service-role writes only; authenticated subscription reads stay behind RLS.

-- payments and send_credit_purchases are written/read by server routes with service role.
revoke all on table public.payments from anon, authenticated;
revoke all on table public.send_credit_purchases from anon, authenticated;

grant all on table public.payments to service_role;
grant all on table public.send_credit_purchases to service_role;

-- subscriptions is read directly by signed-in SSR routes for dashboard/cancel/access checks.
-- Keep only SELECT for authenticated users and rely on the existing owner RLS policy.
revoke all on table public.subscriptions from anon, authenticated;
grant select on table public.subscriptions to authenticated;
grant all on table public.subscriptions to service_role;

drop policy if exists "read own subscriptions" on public.subscriptions;
create policy "read own subscriptions"
 on public.subscriptions for select
 using (auth.uid() = user_id);
