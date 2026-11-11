-- Kridhya - admin sign-in with a one-time email code (password + 6-digit code).
-- Run once in Supabase: SQL Editor > New query > paste this whole file > Run. Safe to re-run.
--
-- How it works: a password alone no longer makes someone an admin. After the password, the server emails a
-- 6-digit code; only when that code is entered is THIS login session (the session_id inside the user's sign-in
-- token) marked as verified. public.is_admin() - which every admin permission in the database relies on -
-- now also requires a verified session, so the check cannot be skipped from the browser.

-- codes waiting to be entered (server only: row-level security on, no policies)
create table if not exists public.admin_login_codes (
  session_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  sent_at timestamptz not null default now()
);
alter table public.admin_login_codes enable row level security;

-- admin sessions that passed the code check (server only)
create table if not exists public.admin_verified_sessions (
  session_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  verified_at timestamptz not null default now()
);
alter table public.admin_verified_sessions enable row level security;

-- listed as an admin (password step) - used only to decide whether to send a code
create or replace function public.is_admin_account() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

-- full admin: listed AND this sign-in session entered a valid code within the last 12 hours
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
     and exists (
       select 1 from public.admin_verified_sessions v
       where v.user_id = auth.uid()
         and v.session_id::text = coalesce(auth.jwt() ->> 'session_id', '')
         and v.verified_at > now() - interval '12 hours'
     )
$$;

grant execute on function public.is_admin_account() to authenticated;

-- ───────────────────────── admins until hand-over ─────────────────────────
-- Each person must have a login first: Authentication > Users > Add user > Create new user
-- (email + password, tick "Auto Confirm User"), or sign up on the website. Then this adds them as admins:
insert into public.admins (user_id)
select id from auth.users where lower(email) in ('kridhyabydevanshi@gmail.com', 'idontblabber@gmail.com')
on conflict do nothing;

-- Later, to remove the developer (idontblabber@gmail.com) as admin after hand-over:
--   delete from public.admins where user_id = (select id from auth.users where lower(email) = 'idontblabber@gmail.com');

-- check: who is an admin now
select u.email, a.created_at as admin_since from public.admins a join auth.users u on u.id = a.user_id order by a.created_at;
