-- Kridhya - payments (Razorpay) + shipping (Shiprocket). Run AFTER schema.sql:
-- Supabase Dashboard > SQL Editor > New query > paste this file > Run. Safe to re-run.

-- ───────────── order columns ─────────────
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in
  ('awaiting_payment', 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'));
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (payment_status in ('pending', 'paid', 'cod', 'refunded', 'failed'));

alter table public.orders add column if not exists razorpay_order_id text;
alter table public.orders add column if not exists razorpay_payment_id text;
alter table public.orders add column if not exists shiprocket_order_id text;
alter table public.orders add column if not exists shiprocket_shipment_id text;
alter table public.orders add column if not exists awb text;
alter table public.orders add column if not exists label_url text;
alter table public.orders add column if not exists shipping_quote jsonb; -- { courier, etd, days } quoted at checkout
create unique index if not exists orders_razorpay_order_idx on public.orders (razorpay_order_id) where razorpay_order_id is not null;
create index if not exists orders_awb_idx on public.orders (awb) where awb is not null;

-- ───────────── create_order: server-only (prices + stock from the database, shipping from Shiprocket) ─────────────
-- p = { customer, address, items:[{slug,finish,qty}], note, payment: 'online'|'cod'|'manual', shipping: int, quote: {...} }
create or replace function public.create_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  it jsonb; prod record; qty int; fin text; stock int;
  lines jsonb := '[]'::jsonb; sub int := 0;
  ship int := greatest(0, coalesce((p->>'shipping')::int, 0));
  mode text := coalesce(p->>'payment', 'manual');
  st text; pay text; no text; oid uuid;
begin
  if mode not in ('online', 'cod', 'manual') then raise exception 'INVALID_PAYMENT'; end if;
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 or jsonb_array_length(p->'items') > 50 then
    raise exception 'EMPTY_BAG';
  end if;
  if coalesce(trim(p#>>'{customer,name}'), '') = '' or length(regexp_replace(coalesce(p#>>'{customer,phone}', ''), '\D', '', 'g')) < 10
     or coalesce(p#>>'{customer,email}', '') !~ '^\S+@\S+\.\S+$' or coalesce(p#>>'{address,pin}', '') !~ '^\d{6}$'
     or coalesce(trim(p#>>'{address,line1}'), '') = '' or coalesce(trim(p#>>'{address,city}'), '') = '' then
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
    -- stock is held now; an unpaid online order releases it again when it expires (expire_unpaid_orders)
    update public.products set data = jsonb_set(data, array['variants', fin, 'stock'], to_jsonb(stock - qty)), updated_at = now() where id = prod.id;
    lines := lines || jsonb_build_object('slug', prod.slug, 'name', prod.data->>'name', 'finish', fin, 'qty', qty,
               'price', (prod.data->>'price')::int, 'image', prod.data->'images'->>0,
               'sku', coalesce(nullif(prod.data #>> array['variants', fin, 'sku'], ''), upper(left(prod.slug, 20)) || '-' || upper(left(fin, 1))));
    sub := sub + qty * (prod.data->>'price')::int;
  end loop;

  st := case mode when 'online' then 'awaiting_payment' else 'placed' end;
  pay := case mode when 'cod' then 'cod' else 'pending' end;
  no := 'KRD-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
  insert into public.orders (order_no, status, customer, address, items, subtotal, shipping, total, payment_method, payment_status, note, shipping_quote)
  values (no, st,
          jsonb_build_object('name', trim(p#>>'{customer,name}'), 'email', trim(p#>>'{customer,email}'), 'phone', trim(p#>>'{customer,phone}')),
          p->'address', lines, sub, ship, sub + ship, mode, pay, left(p->>'note', 1000), p->'quote')
  returning id into oid;
  insert into public.order_events (order_id, status, note) values (oid, st,
    case mode when 'online' then 'Order created - waiting for online payment' when 'cod' then 'Order placed - Cash on Delivery' else 'Order placed on the website' end);
  return jsonb_build_object('id', oid, 'order_no', no, 'subtotal', sub, 'shipping', ship, 'total', sub + ship, 'status', st, 'items', lines);
end $$;

-- The shopper-callable place_order (from schema.sql) keeps working as a no-payment fallback (shipping 0, manual payment).
create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return public.create_order((p - 'shipping' - 'quote') || jsonb_build_object('payment', 'manual', 'shipping', 0));
end $$;

-- Razorpay payment verified by the server (checkout callback or webhook). Idempotent.
create or replace function public.mark_order_paid(p_razorpay_order text, p_payment_id text, p_amount_paise bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o record;
begin
  select * into o from public.orders where razorpay_order_id = p_razorpay_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.payment_status = 'paid' then return jsonb_build_object('order_no', o.order_no, 'already', true); end if;
  if p_amount_paise <> o.total::bigint * 100 then raise exception 'AMOUNT_MISMATCH'; end if;
  if o.status = 'cancelled' then
    -- paid after the hold expired: keep the record so the team can refund or re-confirm
    update public.orders set payment_status = 'paid', razorpay_payment_id = p_payment_id, updated_at = now() where id = o.id;
    insert into public.order_events (order_id, status, note) values (o.id, 'cancelled', 'Payment received after the order expired - refund or re-confirm manually');
    return jsonb_build_object('order_no', o.order_no, 'late', true);
  end if;
  update public.orders set payment_status = 'paid', razorpay_payment_id = p_payment_id,
    status = case when status = 'awaiting_payment' then 'placed' else status end, updated_at = now()
  where id = o.id;
  insert into public.order_events (order_id, status, note) values (o.id, 'placed', 'Payment received online (Razorpay ' || p_payment_id || ')');
  return jsonb_build_object('order_no', o.order_no, 'already', false);
end $$;

-- Online orders not paid within p_minutes are cancelled and their stock is released.
create or replace function public.expire_unpaid_orders(p_minutes int default 30) returns int
language plpgsql security definer set search_path = public as $$
declare o record; it jsonb; n int := 0;
begin
  for o in select * from public.orders where status = 'awaiting_payment' and created_at < now() - make_interval(mins => p_minutes) for update skip locked loop
    for it in select * from jsonb_array_elements(o.items) loop
      update public.products set data = jsonb_set(data, array['variants', it->>'finish', 'stock'],
        to_jsonb(coalesce((data #>> array['variants', it->>'finish', 'stock'])::int, 0) + (it->>'qty')::int)) where slug = it->>'slug';
    end loop;
    update public.orders set status = 'cancelled', payment_status = 'failed', updated_at = now() where id = o.id;
    insert into public.order_events (order_id, status, note) values (o.id, 'cancelled', 'Payment not completed - order expired and stock released');
    n := n + 1;
  end loop;
  return n;
end $$;

-- Admin stage changes: cancelling or a return (RTO) puts the stock back.
create or replace function public.set_order_status(p_order uuid, p_status text, p_note text default null,
  p_courier text default null, p_tracking_no text default null, p_tracking_url text default null) returns void
language plpgsql security definer set search_path = public as $$
declare o record; it jsonb;
begin
  if not public.is_admin() and coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', '') <> 'service_role' then
    raise exception 'NOT_ALLOWED';
  end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_status in ('cancelled', 'returned') and o.status not in ('cancelled', 'returned') then
    for it in select * from jsonb_array_elements(o.items) loop
      update public.products set data = jsonb_set(data, array['variants', it->>'finish', 'stock'],
        to_jsonb(coalesce((data #>> array['variants', it->>'finish', 'stock'])::int, 0) + (it->>'qty')::int)) where slug = it->>'slug';
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

-- Who may call what: the shop's server (secret key = service_role) creates/pays/expires orders.
revoke all on function public.create_order(jsonb) from public, anon, authenticated;
revoke all on function public.mark_order_paid(text, text, bigint) from public, anon, authenticated;
revoke all on function public.expire_unpaid_orders(int) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.create_order(jsonb) to service_role;
    grant execute on function public.mark_order_paid(text, text, bigint) to service_role;
    grant execute on function public.expire_unpaid_orders(int) to service_role;
  end if;
end $$;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.set_order_status(uuid, text, text, text, text, text) to authenticated;

-- Once online payments are live you can stop no-payment orders from the browser entirely:
--   revoke execute on function public.place_order(jsonb) from anon, authenticated;
