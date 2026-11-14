-- Kridhya - fresh start before going live: clears test ORDERS only.
--
-- DELETES: orders, order timelines, refunds, Razorpay webhook log, saved bags, Shiprocket login cache.
-- KEEPS:   products (and their photos), users (customer + admin accounts and their saved details),
--          journal posts, pop-up banner / posters + site settings.
--
-- ⚠️ Cannot be undone. Supabase > SQL Editor > paste > Run.
-- Before: cancel the test orders in Shiprocket (Orders). Optional backup: Table Editor > orders > Export to CSV.
-- After:  set real stock in Admin > Products (test orders reduced stock; deleting them does not put it back).

begin;

-- 1. what will be removed / kept
select 'DELETE orders' as item, count(*) as rows from public.orders
union all select 'DELETE order timeline entries', count(*) from public.order_events
union all select 'DELETE refunds', count(*) from public.refunds
union all select 'DELETE payment webhook events', count(*) from public.payment_events
union all select 'DELETE saved bags', count(*) from public.carts
union all select 'KEEP users', count(*) from auth.users
union all select 'KEEP saved customer details', count(*) from public.customer_profiles
union all select 'KEEP admin accounts', count(*) from public.admins
union all select 'KEEP products', count(*) from public.products
union all select 'KEEP journal posts', count(*) from public.posts
union all select 'KEEP settings / banners', count(*) from public.settings;

-- 2. orders and payments
delete from public.payment_events;
delete from public.refunds;
delete from public.order_events;
delete from public.orders;

-- 3. test items left in saved bags (accounts themselves are kept)
delete from public.carts;

-- 4. integration cache (Shiprocket token / login pause) - the live account starts clean
delete from public.integration_state;

commit;

-- 5. check
select 'orders left (should be 0)' as item, count(*) as rows from public.orders
union all select 'users kept', count(*) from auth.users
union all select 'admins kept', count(*) from public.admins
union all select 'products kept', count(*) from public.products
union all select 'journal posts kept', count(*) from public.posts
union all select 'settings / banners kept', count(*) from public.settings;
