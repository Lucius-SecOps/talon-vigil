-- TalonVigil Supabase Schema
-- Run this in the Supabase SQL editor to initialize the database.

-- ── Users (extends Supabase auth.users) ───────────────────────
create table if not exists public.profiles (
    id              uuid references auth.users(id) on delete cascade primary key,
    tier            text not null default 'scout'   check (tier in ('scout', 'shield', 'sentinel')),
    scans_this_month integer not null default 0,
    scan_limit      integer not null default 500,   -- Scout=500, Shield/Sentinel=unlimited (-1)
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

-- ── Scan Records (EAA audit log) ──────────────────────────────
create table if not exists public.scan_records (
    id               uuid primary key default gen_random_uuid(),
    user_id          uuid references public.profiles(id) on delete cascade not null,
    from_address     text not null,
    from_domain      text not null,
    subject_hash     text,               -- SHA256 of subject — never store plaintext
    composite_score  float not null,
    classification   text not null       check (classification in ('SAFE', 'SUSPICIOUS', 'QUARANTINE', 'VETO')),
    veto_triggered   boolean not null default false,
    action_taken     text not null       check (action_taken in ('deliver', 'warn', 'quarantine')),
    user_response    text                check (user_response in ('released', 'kept', 'reported', null)),
    layer_scores     jsonb not null,     -- Full EAA breakdown stored as JSON
    summary          text,
    scanned_at       timestamptz not null default now()
);

-- ── Sender Behavioral Baselines (Layer 7) ─────────────────────
-- PRIVACY CONTRACT: only derived signals stored, never email content
create table if not exists public.sender_baselines (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid references public.profiles(id) on delete cascade not null,
    sender_domain       text not null,          -- domain only, never full email address
    first_contact_at    timestamptz not null default now(),
    interaction_count   integer not null default 0,   -- rolling 90-day count
    avg_weekly_count    float not null default 0,     -- derived float
    typical_min_hour    integer not null default 0,   -- derived send window start (UTC hour)
    typical_max_hour    integer not null default 23,  -- derived send window end (UTC hour)
    last_seen_at        timestamptz not null default now(),
    unique(user_id, sender_domain)
);

-- ── Row Level Security ────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.scan_records     enable row level security;
alter table public.sender_baselines enable row level security;

-- Users can only read/write their own rows
create or replace policy "profiles: own row only"
    on public.profiles for all
    using (auth.uid() = id);

create or replace policy "scan_records: own rows only"
    on public.scan_records for all
    using (auth.uid() = user_id);

create or replace policy "sender_baselines: own rows only"
    on public.sender_baselines for all
    using (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists idx_scan_records_user_id   on public.scan_records(user_id);
create index if not exists idx_scan_records_scanned   on public.scan_records(scanned_at desc);
create index if not exists idx_baselines_user_domain  on public.sender_baselines(user_id, sender_domain);

-- ── Auto-update updated_at ────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql set search_path = '';

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
    before update on public.profiles
    for each row execute function update_updated_at();

-- ── Auto-create profile on signup ─────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id)
    values (new.id)
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer set search_path = '';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

-- ── Increment monthly scan counter (called after each scan) ───
create or replace function increment_scan_count(p_user_id uuid)
returns void as $$
begin
    update public.profiles
    set scans_this_month = scans_this_month + 1
    where id = p_user_id;
end;
$$ language plpgsql security definer set search_path = '';

-- ── Reset monthly counters (schedule with pg_cron) ────────────
-- Run on the 1st of every month at 00:00 UTC:
-- select cron.schedule('reset-scan-counts', '0 0 1 * *', $$
--   update public.profiles set scans_this_month = 0;
-- $$);
create or replace function reset_monthly_scan_counts()
returns void as $$
begin
    update public.profiles set scans_this_month = 0;
end;
$$ language plpgsql security definer set search_path = '';

-- ── Lock down SECURITY DEFINER functions ──────────────────────
-- Revoke public EXECUTE so anon/authenticated roles cannot call these
-- directly via REST. Service-role bypasses grants and calls them fine.
-- update_updated_at is excluded: it is NOT security definer, so no revoke needed.
revoke execute on function public.handle_new_user()            from anon, authenticated, public;
revoke execute on function public.increment_scan_count(uuid)   from anon, authenticated, public;
revoke execute on function public.reset_monthly_scan_counts()  from anon, authenticated, public;

-- ── Note: rls_auto_enable event trigger ───────────────────────
-- Supabase manages an internal rls_auto_enable event trigger that
-- auto-enables RLS on every CREATE TABLE in the public schema.
-- This is NOT recreated here — it is Supabase infrastructure and
-- cannot be reliably defined by user DDL without conflicting.
-- The explicit ALTER TABLE ... ENABLE ROW LEVEL SECURITY statements
-- above serve as the schema.sql equivalent for fresh-project deploys.
