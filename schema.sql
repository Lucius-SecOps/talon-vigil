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
create policy "profiles: own row only"
    on public.profiles for all
    using (auth.uid() = id);

create policy "scan_records: own rows only"
    on public.scan_records for all
    using (auth.uid() = user_id);

create policy "sender_baselines: own rows only"
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
$$ language plpgsql;

create trigger profiles_updated_at
    before update on public.profiles
    for each row execute function update_updated_at();
