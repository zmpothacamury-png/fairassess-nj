-- FairAssess NJ waitlist table.
-- Run this whole file in the Supabase dashboard: SQL Editor > New query > Run.

create extension if not exists pgcrypto; -- provides gen_random_uuid()

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now(),
  constraint waitlist_email_lowercase check (email = lower(email))
);

-- Row Level Security: locked down by default once enabled. We add exactly
-- one policy, for INSERT only. There is no SELECT, UPDATE, or DELETE
-- policy for the anon role, so the public anon key (which ships in the
-- browser bundle) can only add new rows - it can never read, change, or
-- delete anyone's email. That is why it is safe to expose that key
-- client-side.
alter table public.waitlist enable row level security;

create policy "anon can insert waitlist signups"
  on public.waitlist
  for insert
  to anon
  with check (true);
