-- Pre-launch waitlist. Written only by /api/waitlist with the service role key,
-- so RLS is on with no policies: nobody can read or write it from the browser.
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
