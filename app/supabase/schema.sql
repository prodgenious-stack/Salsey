create table if not exists public.sales_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  offer text not null default '',
  script text not null default '',
  objections text not null default '',
  accent_color text not null default '#3b82f6',
  updated_at timestamptz not null default now()
);

alter table public.sales_profiles enable row level security;

create policy "Users manage own sales profile"
  on public.sales_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.call_transcripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transcript text not null,
  created_at timestamptz not null default now()
);

create index if not exists call_transcripts_user_id_created_at_idx
  on public.call_transcripts (user_id, created_at desc);

alter table public.call_transcripts enable row level security;

create policy "Users manage own call transcripts"
  on public.call_transcripts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.call_transcripts
  add column if not exists summary text,
  add column if not exists next_steps text,
  add column if not exists sentiment text,
  add column if not exists recap_generated_at timestamptz,
  add column if not exists company text,
  add column if not exists contact_name text;

create table if not exists public.call_objections (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.call_transcripts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  quote text not null,
  handled_well boolean not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists call_objections_user_id_idx on public.call_objections (user_id);
create index if not exists call_objections_category_idx on public.call_objections (user_id, category);

alter table public.call_objections enable row level security;

create policy "Users manage own call objections"
  on public.call_objections
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
