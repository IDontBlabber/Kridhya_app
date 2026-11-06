-- Kridhya by Devanshi Agarwal - database for the store, admin portal, orders and journal.
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste this whole file > Run.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE).

-- ───────────────────────── admins ─────────────────────────
-- Supabase Auth users listed here can use /admin. Add the client after creating their login (see bottom of file).
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (user_id = auth.uid());

-- ───────────────────────── catalogue ─────────────────────────
-- Each product / post keeps its full editable record in `data` (jsonb); the indexed columns drive visibility.
create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.posts (
  id text primary key,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  publish_at timestamptz not null default now(), -- scheduling: published posts appear from this moment
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.settings (
  key text primary key, -- e.g. 'popup'
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
alter table public.posts enable row level security;
alter table public.settings enable row level security;

drop policy if exists "public reads published products" on public.products;
create policy "public reads published products" on public.products for select using (status = 'published' or public.is_admin());
drop policy if exists "admins write products" on public.products;
create policy "admins write products" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads live posts" on public.posts;
create policy "public reads live posts" on public.posts for select using ((status = 'published' and publish_at <= now()) or public.is_admin());
drop policy if exists "admins write posts" on public.posts;
create policy "admins write posts" on public.posts for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads settings" on public.settings;
create policy "public reads settings" on public.settings for select using (true);
drop policy if exists "admins write settings" on public.settings;
create policy "admins write settings" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- ───────────────────────── orders ─────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  status text not null default 'placed'
    check (status in ('placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
  customer jsonb not null,      -- { name, email, phone }
  address jsonb not null,       -- { line1, line2, city, state, pin }
  items jsonb not null,         -- [{ slug, name, finish, qty, price, image }]
  subtotal integer not null,
  shipping integer not null default 0,
  total integer not null,
  payment_method text,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded', 'failed')),
  courier text,
  tracking_no text,
  tracking_url text,
  note text,                    -- customer's note
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

alter table public.orders enable row level security;
alter table public.order_events enable row level security;
-- Shoppers never read or write these tables directly: they use place_order / track_order below.
drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage order events" on public.order_events;
create policy "admins manage order events" on public.order_events for all using (public.is_admin()) with check (public.is_admin());

-- Place an order: prices come from the database (never from the browser), stock is checked and reduced atomically.
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  it jsonb;
  prod record;
  qty int;
  fin text;
  stock int;
  lines jsonb := '[]'::jsonb;
  sub int := 0;
  ship int := 0;
  no text;
  oid uuid;
begin
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 or jsonb_array_length(p->'items') > 50 then
    raise exception 'EMPTY_BAG';
  end if;
  if coalesce(trim(p#>>'{customer,name}'), '') = '' or length(regexp_replace(coalesce(p#>>'{customer,phone}', ''), '\D', '', 'g')) < 10
     or coalesce(p#>>'{customer,email}', '') !~ '^\S+@\S+\.\S+$' or coalesce(p#>>'{address,pin}', '') !~ '^\d{6}$' then
    raise exception 'INVALID_DETAILS';
  end if;

  for it in select * from jsonb_array_elements(p->'items') loop
    qty := greatest(1, least(20, coalesce((it->>'qty')::int, 1)));
    fin := it->>'finish';
    select * into prod from public.products where slug = it->>'slug' and status = 'published' for update;
    if not found then raise exception 'UNAVAILABLE:%', coalesce(it->>'name', it->>'slug'); end if;
    if coalesce((prod.data #>> array['variants', fin, 'enabled'])::boolean, false) = false then
      raise exception 'UNAVAILABLE:% (%)', prod.data->>'name', fin;
    end if;
    stock := coalesce((prod.data #>> array['variants', fin, 'stock'])::int, 0);
    if stock < qty then raise exception 'OUT_OF_STOCK:% (%)|%', prod.data->>'name', fin, stock; end if;
    update public.products
      set data = jsonb_set(data, array['variants', fin, 'stock'], to_jsonb(stock - qty)), updated_at = now()
      where id = prod.id;
    lines := lines || jsonb_build_object('slug', prod.slug, 'name', prod.data->>'name', 'finish', fin, 'qty', qty,
                                         'price', (prod.data->>'price')::int, 'image', prod.data->'images'->>0);
    sub := sub + qty * (prod.data->>'price')::int;
  end loop;

  no := 'KRD-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
  insert into public.orders (order_no, customer, address, items, subtotal, shipping, total, payment_method, note)
  values (no,
          jsonb_build_object('name', trim(p#>>'{customer,name}'), 'email', trim(p#>>'{customer,email}'), 'phone', trim(p#>>'{customer,phone}')),
          p->'address', lines, sub, ship, sub + ship, left(p->>'payment', 30), left(p->>'note', 1000))
  returning id into oid;
  insert into public.order_events (order_id, status, note) values (oid, 'placed', 'Order placed on the website');
  return jsonb_build_object('order_no', no, 'total', sub + ship, 'items', lines);
end $$;

-- Customer tracking: order number + the phone number used at checkout. Returns no address or email.
create or replace function public.track_order(p_order_no text, p_phone text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'order_no', o.order_no, 'status', o.status, 'created_at', o.created_at, 'total', o.total,
    'name', split_part(o.customer->>'name', ' ', 1),
    'items', (select jsonb_agg(jsonb_build_object('name', i->>'name', 'finish', i->>'finish', 'qty', i->'qty', 'image', i->>'image')) from jsonb_array_elements(o.items) i),
    'courier', o.courier, 'tracking_no', o.tracking_no, 'tracking_url', o.tracking_url,
    'events', (select jsonb_agg(jsonb_build_object('status', e.status, 'note', e.note, 'at', e.created_at) order by e.created_at) from public.order_events e where e.order_id = o.id)
  )
  from public.orders o
  where upper(o.order_no) = upper(trim(p_order_no))
    and right(regexp_replace(o.customer->>'phone', '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10)
$$;

-- Admin: move an order to a new stage (logs the step; cancelling puts the stock back).
create or replace function public.set_order_status(p_order uuid, p_status text, p_note text default null,
  p_courier text default null, p_tracking_no text default null, p_tracking_url text default null) returns void
language plpgsql security definer set search_path = public as $$
declare o record; it jsonb;
begin
  if not public.is_admin() then raise exception 'NOT_ALLOWED'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_status = 'cancelled' and o.status <> 'cancelled' then
    for it in select * from jsonb_array_elements(o.items) loop
      update public.products
        set data = jsonb_set(data, array['variants', it->>'finish', 'stock'],
                   to_jsonb(coalesce((data #>> array['variants', it->>'finish', 'stock'])::int, 0) + (it->>'qty')::int))
        where slug = it->>'slug';
    end loop;
  end if;
  update public.orders set status = p_status,
    courier = coalesce(nullif(p_courier, ''), courier), tracking_no = coalesce(nullif(p_tracking_no, ''), tracking_no),
    tracking_url = coalesce(nullif(p_tracking_url, ''), tracking_url), updated_at = now()
  where id = p_order;
  if p_status <> o.status or coalesce(p_note, '') <> '' then
    insert into public.order_events (order_id, status, note) values (p_order, p_status, nullif(p_note, ''));
  end if;
end $$;

grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;
grant execute on function public.set_order_status(uuid, text, text, text, text, text) to authenticated;

-- ───────────────────────── photo storage ─────────────────────────
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
drop policy if exists "public reads media" on storage.objects;
create policy "public reads media" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "admins upload media" on storage.objects;
create policy "admins upload media" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "admins change media" on storage.objects;
create policy "admins change media" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists "admins delete media" on storage.objects;
create policy "admins delete media" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- ───────────────────────── make the client an admin ─────────────────────────
-- 1. Supabase Dashboard > Authentication > Users > Add user > Create new user (email + password, tick Auto Confirm).
-- 2. Run (with that email):
--    insert into public.admins (user_id) select id from auth.users where email = 'client@example.com' on conflict do nothing;
