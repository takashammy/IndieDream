-- Rate-limit login, registration, and first-admin bootstrap (persists across serverless).
create table if not exists cue_auth_attempts (
  key text primary key,
  failures integer not null default 0,
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);
