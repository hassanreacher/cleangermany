-- =====================================================================
--  Glanzgeschwister – Supabase schema
--  Run this file once in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
--  Afterwards: promote your own account to admin (see the last section).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- enums ----------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('client', 'admin', 'team');
  end if;
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('neu', 'besichtigung', 'angebot', 'bestaetigt', 'zugewiesen', 'in_arbeit', 'erledigt', 'storniert');
  end if;
end $$;

-- ---------- profiles (1 row per auth user) ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  full_name   text,
  phone       text,
  role        public.user_role not null default 'client',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- orders (Anfragen) ----------
create sequence if not exists public.order_code_seq start 1001;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique default ('GG-' || lpad(nextval('public.order_code_seq')::text, 5, '0')),
  customer_id      uuid references public.profiles (id) on delete set null,
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text not null,
  property_type    text not null,
  cleaning_type    text not null,
  size_sqm         integer,
  frequency        text,
  times_per_period integer,
  time_window      text,
  street           text,
  zip              text,
  city             text,
  floor            text,
  details          jsonb not null default '{}'::jsonb,   -- full form snapshot (floors, dirt, access, desks, WCs, add-ons …)
  notes            text,
  preferred_date   date,
  preferred_time   text,
  status           public.order_status not null default 'neu',
  price            numeric(10,2),                        -- final net price set by admin
  internal_estimate numeric(10,2),                       -- calculator hint for admin (never shown to customers)
  admin_notes      text,
  assigned_to      uuid references public.profiles (id) on delete set null,
  assigned_at      timestamptz,
  completed_at     timestamptz,
  source           text not null default 'web',          -- web | ki | telefon
  notified_at      timestamptz,                          -- set by the e-mail function (idempotency)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_email_idx on public.orders (lower(customer_email));
create index if not exists orders_assigned_idx on public.orders (assigned_to);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_date_idx on public.orders (preferred_date);

-- ---------- order history ----------
create table if not exists public.order_events (
  id          bigserial primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  actor       uuid references public.profiles (id) on delete set null,
  type        text not null,          -- created | status | assigned | price | note
  message     text,
  created_at  timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id);

-- ---------- reviews (Kundenstimmen, shown after approval) ----------
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references public.orders (id) on delete set null,
  customer_id  uuid references public.profiles (id) on delete set null,
  author_name  text not null,
  email        text,
  city         text,
  rating       integer not null check (rating between 1 and 5),
  text         text not null check (char_length(text) between 10 and 1200),
  approved     boolean not null default false,
  notified_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------- blocked slots (admin closes time windows) ----------
create table if not exists public.blocked_slots (
  id          bigserial primary key,
  slot_date   date not null,
  slot_time   text not null,          -- 'HH:MM'
  reason      text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (slot_date, slot_time)
);

-- ---------- helper functions ----------
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;
create or replace function public.is_team()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'team') from public.profiles where id = auth.uid()), false)
$$;
create or replace function public.current_email()
returns text language sql stable as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

-- new auth user → profile row, and attach earlier guest orders with the same e-mail
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
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- only admins may change roles; users may edit their own name / phone
create or replace function public.protect_profile_role()
returns trigger language plpgsql as $$
begin
  if new.role <> old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Nur Administratoren dürfen Rollen ändern';
  end if;
  if new.email <> old.email and auth.uid() is not null and not public.is_admin() then new.email = old.email; end if;
  return new;
end $$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_profile_role();

-- order rules: team members may only change status/completed_at of their own orders; customers only cancel via RPC
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
drop trigger if exists orders_protect_columns on public.orders;
create trigger orders_protect_columns before update on public.orders for each row execute function public.protect_order_columns();

-- automatic history entries
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
drop trigger if exists orders_log_insert on public.orders;
create trigger orders_log_insert after insert on public.orders for each row execute function public.log_order_event();
drop trigger if exists orders_log_update on public.orders;
create trigger orders_log_update after update on public.orders for each row execute function public.log_order_event();

-- reviews are never approved by the author
create or replace function public.reviews_force_pending()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not public.is_admin() then new.approved = false; end if;
  if auth.uid() is not null and new.customer_id is null then new.customer_id = auth.uid(); end if;
  return new;
end $$;
drop trigger if exists reviews_force_pending on public.reviews;
create trigger reviews_force_pending before insert on public.reviews for each row execute function public.reviews_force_pending();

-- ---------- RPCs used by the website ----------
-- occupied time windows (orders + blocked slots) – readable by everyone without exposing order data
create or replace function public.booked_slots(from_date date, to_date date)
returns table (slot_date date, slot_time text) language sql stable security definer set search_path = public as $$
  select preferred_date, preferred_time from public.orders
   where preferred_date between from_date and to_date and preferred_time is not null and status <> 'storniert'
  union
  select slot_date, slot_time from public.blocked_slots where slot_date between from_date and to_date
$$;

-- customer cancels their own open request
create or replace function public.cancel_my_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order_id;
  if o.id is null then raise exception 'Anfrage nicht gefunden'; end if;
  if not (o.customer_id = auth.uid() or lower(o.customer_email) = public.current_email()) then raise exception 'Keine Berechtigung'; end if;
  if o.status in ('erledigt', 'storniert') then raise exception 'Anfrage kann nicht mehr storniert werden'; end if;
  update public.orders set status = 'storniert' where id = p_order_id;
  insert into public.order_events (order_id, actor, type, message) values (p_order_id, auth.uid(), 'status', 'Vom Kunden storniert');
end $$;

-- public rating summary for the start page
create or replace function public.review_stats()
returns table (avg_rating numeric, review_count bigint) language sql stable security definer set search_path = public as $$
  select round(avg(rating)::numeric, 1), count(*) from public.reviews where approved
$$;

-- admin dashboard KPIs
create or replace function public.admin_stats()
returns json language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Keine Berechtigung'; end if;
  return json_build_object(
    'open',      (select count(*) from public.orders where status in ('neu', 'besichtigung')),
    'active',    (select count(*) from public.orders where status in ('angebot', 'bestaetigt', 'zugewiesen', 'in_arbeit')),
    'done',      (select count(*) from public.orders where status = 'erledigt'),
    'revenue',   (select coalesce(sum(price), 0) from public.orders where status = 'erledigt'),
    'customers', (select count(distinct lower(customer_email)) from public.orders),
    'team',      (select count(*) from public.profiles where role = 'team'),
    'pending_reviews', (select count(*) from public.reviews where not approved),
    'by_month',  (select coalesce(json_agg(row_to_json(m) order by m.month), '[]'::json) from (
                    select to_char(date_trunc('month', created_at), 'YYYY-MM') as month, count(*) as orders, coalesce(sum(price) filter (where status = 'erledigt'), 0) as revenue
                    from public.orders where created_at > now() - interval '12 months' group by 1) m)
  );
end $$;

-- ---------- Row Level Security ----------
alter table public.profiles      enable row level security;
alter table public.orders        enable row level security;
alter table public.order_events  enable row level security;
alter table public.reviews       enable row level security;
alter table public.blocked_slots enable row level security;

-- profiles
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles for select using (id = auth.uid());
drop policy if exists "profiles: staff read all" on public.profiles;
create policy "profiles: staff read all" on public.profiles for select using (public.is_team());
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles: admin update" on public.profiles;
create policy "profiles: admin update" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- orders
drop policy if exists "orders: anyone can create" on public.orders;
create policy "orders: anyone can create" on public.orders for insert
  with check (customer_id is null or customer_id = auth.uid());
drop policy if exists "orders: customer reads own" on public.orders;
create policy "orders: customer reads own" on public.orders for select
  using (customer_id = auth.uid() or (auth.uid() is not null and lower(customer_email) = public.current_email()));
drop policy if exists "orders: team reads assigned" on public.orders;
create policy "orders: team reads assigned" on public.orders for select using (assigned_to = auth.uid());
drop policy if exists "orders: admin all" on public.orders;
create policy "orders: admin all" on public.orders for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders: team updates assigned" on public.orders;
create policy "orders: team updates assigned" on public.orders for update using (assigned_to = auth.uid()) with check (assigned_to = auth.uid());

-- order events: visible with the order
drop policy if exists "events: read with order" on public.order_events;
create policy "events: read with order" on public.order_events for select
  using (exists (select 1 from public.orders o where o.id = order_id));
drop policy if exists "events: staff insert" on public.order_events;
create policy "events: staff insert" on public.order_events for insert with check (public.is_team());

-- reviews
drop policy if exists "reviews: public reads approved" on public.reviews;
create policy "reviews: public reads approved" on public.reviews for select using (approved or public.is_admin() or customer_id = auth.uid());
drop policy if exists "reviews: anyone can submit" on public.reviews;
create policy "reviews: anyone can submit" on public.reviews for insert with check (true);
drop policy if exists "reviews: admin manages" on public.reviews;
create policy "reviews: admin manages" on public.reviews for all using (public.is_admin()) with check (public.is_admin());

-- blocked slots: admin only (public access via booked_slots RPC)
drop policy if exists "blocked: admin" on public.blocked_slots;
create policy "blocked: admin" on public.blocked_slots for all using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select, insert on public.orders to anon, authenticated;
grant update on public.orders to authenticated;
grant select, insert on public.reviews to anon, authenticated;
grant update, delete on public.reviews to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert on public.order_events to authenticated;
grant select, insert, update, delete on public.blocked_slots to authenticated;
grant usage, select on sequence public.order_code_seq to anon, authenticated;
grant usage, select on sequence public.order_events_id_seq to authenticated;
grant usage, select on sequence public.blocked_slots_id_seq to authenticated;
grant execute on function public.booked_slots(date, date) to anon, authenticated;
grant execute on function public.review_stats() to anon, authenticated;
grant execute on function public.cancel_my_order(uuid) to authenticated;
grant execute on function public.admin_stats() to authenticated;

-- ---------- realtime (live updates in the dashboards) ----------
do $$ begin
  begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.reviews; exception when duplicate_object then null; end;
end $$;

-- =====================================================================
--  AFTER RUNNING: create your account on the website (Registrieren), confirm the e-mail, then run:
--     update public.profiles set role = 'admin' where email = 'glanzgeschwister@gmx.de';
--  Team members: let them register, then set their role to 'team' in the admin dashboard (or with the same statement).
--
--  Supabase → Authentication → SMTP Settings: enter your own SMTP (host, port, user, password, sender)
--  so signup confirmations and password resets are sent from your address.
--  Order / assignment / review e-mails are sent by the website itself (api/notify.ts) with the SMTP_* variables on Vercel.
-- =====================================================================
