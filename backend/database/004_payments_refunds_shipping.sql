-- Kridhya - stronger payments (failures, refunds, webhook de-duplication) and shipping (token store, lockout guard).
-- Run AFTER 003_customers.sql (Supabase > SQL Editor > paste > Run). Safe to re-run.

-- ───────────── payment status + bookkeeping on orders ─────────────
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'cod', 'partially_refunded', 'refunded', 'failed'));
alter table public.orders add column if not exists refunded_amount integer not null default 0;
alter table public.orders add column if not exists payment_attempts integer not null default 0;
alter table public.orders add column if not exists last_payment_error text;
alter table public.orders add column if not exists paid_at timestamptz;

-- every Razorpay webhook event, stored once (x-razorpay-event-id) - replays are ignored, and it is an audit trail
create table if not exists public.payment_events (
  id bigint generated always as identity primary key,
  event_id text unique,
  order_id uuid references public.orders (id) on delete set null,
  type text not null,
  payment_id text,
  amount_paise bigint,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payment_events_order_idx on public.payment_events (order_id, created_at);

-- refunds (full or partial), kept in sync with Razorpay by the refund.* webhooks
create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  razorpay_refund_id text unique,
  amount integer not null check (amount > 0),          -- rupees
  status text not null default 'pending' check (status in ('pending', 'processed', 'failed')),
  reason text,
  created_by text,                                     -- admin email, or 'system'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists refunds_order_idx on public.refunds (order_id);

alter table public.payment_events enable row level security;
alter table public.refunds enable row level security;
drop policy if exists "admins read payment events" on public.payment_events;
create policy "admins read payment events" on public.payment_events for select using (public.is_admin());
drop policy if exists "admins read refunds" on public.refunds;
create policy "admins read refunds" on public.refunds for select using (public.is_admin());
drop policy if exists "customers read own refunds" on public.refunds;
create policy "customers read own refunds" on public.refunds for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- ───────────── integration state (server only: RLS on, no policies) ─────────────
-- Shiprocket token cache shared by all server instances + a login lockout guard.
create table if not exists public.integration_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.integration_state enable row level security;

-- ───────────── functions (server only) ─────────────
-- paid: also stamps paid_at and clears the last error
create or replace function public.mark_order_paid(p_razorpay_order text, p_payment_id text, p_amount_paise bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o record;
begin
  select * into o from public.orders where razorpay_order_id = p_razorpay_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.payment_status in ('paid', 'partially_refunded', 'refunded') then return jsonb_build_object('order_no', o.order_no, 'already', true); end if;
  if p_amount_paise <> o.total::bigint * 100 then raise exception 'AMOUNT_MISMATCH'; end if;
  if o.status = 'cancelled' then
    update public.orders set payment_status = 'paid', razorpay_payment_id = p_payment_id, paid_at = now(), updated_at = now() where id = o.id;
    insert into public.order_events (order_id, status, note) values (o.id, 'cancelled', 'Payment received after the order expired - refund it from the order page');
    return jsonb_build_object('order_no', o.order_no, 'late', true, 'id', o.id);
  end if;
  update public.orders set payment_status = 'paid', razorpay_payment_id = p_payment_id, paid_at = now(), last_payment_error = null,
    status = case when status = 'awaiting_payment' then 'placed' else status end, updated_at = now()
  where id = o.id;
  insert into public.order_events (order_id, status, note) values (o.id, 'placed', 'Payment received online (Razorpay ' || p_payment_id || ')');
  return jsonb_build_object('order_no', o.order_no, 'already', false, 'id', o.id);
end $$;

-- a failed attempt: the order stays open for retry until it expires
create or replace function public.record_payment_failure(p_razorpay_order text, p_payment_id text, p_error text) returns void
language plpgsql security definer set search_path = public as $$
declare o record;
begin
  select * into o from public.orders where razorpay_order_id = p_razorpay_order for update;
  if not found or o.payment_status <> 'pending' then return; end if;
  update public.orders set payment_attempts = payment_attempts + 1, last_payment_error = left(p_error, 300), updated_at = now() where id = o.id;
  insert into public.order_events (order_id, status, note) values (o.id, o.status, 'Payment attempt failed: ' || left(coalesce(p_error, 'unknown reason'), 200));
end $$;

-- refunds: recompute the order's refunded total + payment status from processed refunds
create or replace function public.apply_refund_status(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare done int; o record;
begin
  select * into o from public.orders where id = p_order for update;
  select coalesce(sum(amount), 0) into done from public.refunds where order_id = p_order and status = 'processed';
  update public.orders set refunded_amount = done,
    payment_status = case when done >= o.total then 'refunded' when done > 0 then 'partially_refunded'
                          when o.payment_status in ('refunded', 'partially_refunded') then 'paid' else o.payment_status end,
    updated_at = now()
  where id = p_order;
end $$;

-- cancelled unpaid orders: also mark the payment as failed so they are easy to filter
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
    insert into public.order_events (order_id, status, note) values (o.id, 'cancelled', 'Payment not completed in time - order expired and stock released');
    n := n + 1;
  end loop;
  return n;
end $$;

-- server-side stage change (webhooks, tracking sync, admin actions routed through the server); same stock rules as set_order_status
create or replace function public.server_set_order_status(p_order uuid, p_status text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o record; it jsonb;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_status in ('cancelled', 'returned') and o.status not in ('cancelled', 'returned') then
    for it in select * from jsonb_array_elements(o.items) loop
      update public.products set data = jsonb_set(data, array['variants', it->>'finish', 'stock'],
        to_jsonb(coalesce((data #>> array['variants', it->>'finish', 'stock'])::int, 0) + (it->>'qty')::int)) where slug = it->>'slug';
    end loop;
  end if;
  update public.orders set status = p_status, updated_at = now() where id = p_order;
  if p_status <> o.status or coalesce(p_note, '') <> '' then
    insert into public.order_events (order_id, status, note) values (p_order, p_status, nullif(p_note, ''));
  end if;
  return jsonb_build_object('from', o.status, 'to', p_status);
end $$;

revoke all on function public.server_set_order_status(uuid, text, text) from public, anon, authenticated;
revoke all on function public.record_payment_failure(text, text, text) from public, anon, authenticated;
revoke all on function public.apply_refund_status(uuid) from public, anon, authenticated;
revoke all on function public.mark_order_paid(text, text, bigint) from public, anon, authenticated;
revoke all on function public.expire_unpaid_orders(int) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.server_set_order_status(uuid, text, text) to service_role;
    grant execute on function public.record_payment_failure(text, text, text) to service_role;
    grant execute on function public.apply_refund_status(uuid) to service_role;
    grant execute on function public.mark_order_paid(text, text, bigint) to service_role;
    grant execute on function public.expire_unpaid_orders(int) to service_role;
  end if;
end $$;
