-- Special Event Dashboard 2026 — Supabase Schema
-- Jalankan di: Supabase Dashboard → SQL Editor

create table if not exists events (
  id          int primary key,
  payload     jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

-- Row Level Security
alter table events enable row level security;

-- Semua orang bisa baca (viewer)
create policy "Public read events"
  on events for select
  using (true);

-- Hanya admin (authenticated) yang bisa write
create policy "Admin insert events"
  on events for insert
  with check (auth.role() = 'authenticated');

create policy "Admin update events"
  on events for update
  using (auth.role() = 'authenticated');

create policy "Admin delete events"
  on events for delete
  using (auth.role() = 'authenticated');

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on events
  for each row execute function update_updated_at();
