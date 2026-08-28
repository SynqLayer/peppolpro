do $$
begin
 if not exists (select 1 from pg_roles where rolname = 'hermes_operator') then
  create role hermes_operator nologin;
 end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
 return new;
end;
$$;
