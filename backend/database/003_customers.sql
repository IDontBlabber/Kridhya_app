-- Kridhya - customer accounts: saved bags, saved details and "My orders". Run AFTER 002_payments_shipping.sql
-- (Supabase Dashboard > SQL Editor > New query > paste > Run). Safe to re-run.

-- Saved bag per signed-in customer (restored on any device after sign-in)
create table if not exists public.carts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.carts enable row level security;
drop policy if exists "customers manage own cart" on public.carts;
create policy "customers manage own cart" on public.carts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Saved checkout details (name, phone, last delivery address) for faster checkout
create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text, phone text, address jsonb,
  updated_at timestamptz not null default now()
);
alter table public.customer_profiles enable row level security;
drop policy if exists "customers manage own profile" on public.customer_profiles;
create policy "customers manage own profile" on public.customer_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "admins read profiles" on public.customer_profiles;
create policy "admins read profiles" on public.customer_profiles for select using (public.is_admin());

-- Orders belong to the customer who placed them
alter table public.orders add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
drop policy if exists "customers read own orders" on public.orders;
create policy "customers read own orders" on public.orders for select using (user_id = auth.uid());
drop policy if exists "customers read own order events" on public.order_events;
create policy "customers read own order events" on public.order_events for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- create_order: the server passes the verified customer id as p.user_id; the no-payment fallback uses the caller's session.
create or replace function public.attach_order_user(p_order uuid, p_user uuid) returns void
language sql security definer set search_path = public as $$
  update public.orders set user_id = p_user where id = p_order and user_id is null
$$;
revoke all on function public.attach_order_user(uuid, uuid) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.attach_order_user(uuid, uuid) to service_role;
  end if;
end $$;

create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  r := public.create_order((p - 'shipping' - 'quote') || jsonb_build_object('payment', 'manual', 'shipping', 0));
  if auth.uid() is not null then
    update public.orders set user_id = auth.uid() where id = (r->>'id')::uuid;
  end if;
  return r;
end $$;
grant execute on function public.place_order(jsonb) to anon, authenticated;
