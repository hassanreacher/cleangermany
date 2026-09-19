-- =====================================================================
--  FIX 001 – run once in Supabase → SQL Editor (safe to run again).
--  Fixes "Database error saving new user" when a guest request with the same e-mail exists,
--  lets the server functions (service role) update orders/profiles, lets you promote admins
--  from the SQL editor, and lets team members really change the status of their jobs.
-- =====================================================================

-- orders: internal updates (signup trigger, server functions) and admins may change everything;
-- team members may only change the status of orders assigned to them.
create or replace function public.protect_order_columns()
returns trigger language plpgsql as $$
declare v_status public.order_status := new.status;
begin
  if auth.uid() is null or public.is_admin() then
    if new.assigned_to is distinct from old.assigned_to then
      new.assigned_at = case when new.assigned_to is null then null else now() end;
    end if;
  elsif public.is_team() and old.assigned_to = auth.uid() then
    new := old;
    new.status := v_status;
  else
    raise exception 'Keine Berechtigung';
  end if;
  if new.status = 'erledigt' and old.status <> 'erledigt' then new.completed_at = now(); end if;
  return new;
end $$;

-- profiles: roles may be changed by admins and from the SQL editor / server (no auth context)
create or replace function public.protect_profile_role()
returns trigger language plpgsql as $$
begin
  if new.role <> old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Nur Administratoren dürfen Rollen ändern';
  end if;
  if new.email <> old.email and auth.uid() is not null and not public.is_admin() then new.email = old.email; end if;
  return new;
end $$;

-- reviews: keep "pending" for customers, but let admins and the server decide
create or replace function public.reviews_force_pending()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then new.approved = false; end if;
  if auth.uid() is not null and new.customer_id is null then new.customer_id = auth.uid(); end if;
  return new;
end $$;

-- history entries written from the signup trigger / server have no actor – that is fine, but never fail because of it
create or replace function public.log_order_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, actor, type, message) values (new.id, auth.uid(), 'created', 'Anfrage eingegangen (' || new.source || ')');
  else
    if new.status is distinct from old.status then
      insert into public.order_events (order_id, actor, type, message) values (new.id, auth.uid(), 'status', 'Status: ' || new.status::text);
    end if;
    if new.assigned_to is distinct from old.assigned_to then
      insert into public.order_events (order_id, actor, type, message)
      values (new.id, auth.uid(), 'assigned', case when new.assigned_to is null then 'Zuweisung entfernt' else 'Zugewiesen an ' || coalesce((select full_name from public.profiles where id = new.assigned_to), 'Teammitglied') end);
    end if;
    if new.price is distinct from old.price then
      insert into public.order_events (order_id, actor, type, message) values (new.id, auth.uid(), 'price', 'Festpreis: ' || coalesce(new.price::text, '–') || ' € netto');
    end if;
    if new.customer_id is distinct from old.customer_id and new.customer_id is not null then
      insert into public.order_events (order_id, actor, type, message) values (new.id, new.customer_id, 'linked', 'Kundenkonto verknüpft');
    end if;
  end if;
  return new;
exception when others then
  return new; -- history must never block the actual change
end $$;

-- make the signup trigger itself robust: profile first, linking afterwards, never fail the signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, lower(new.email), new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone')
  on conflict (id) do update set full_name = coalesce(public.profiles.full_name, excluded.full_name), phone = coalesce(public.profiles.phone, excluded.phone);
  begin
    update public.orders set customer_id = new.id where customer_id is null and lower(customer_email) = lower(new.email);
    update public.reviews set customer_id = new.id where customer_id is null and lower(email) = lower(new.email);
  exception when others then
    null; -- linking is repeated by the website after login (api/link)
  end;
  return new;
end $$;
