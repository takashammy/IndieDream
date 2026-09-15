-- Daily snapshots of the live studio so a wipe or bad write can be rolled back.
create table if not exists cue_backups (
  id text primary key,
  taken_at timestamptz not null default now(),
  source text not null default 'cron',
  studio jsonb not null,
  bytes integer not null default 0
);
create index if not exists cue_backups_taken_at_idx on cue_backups (taken_at desc);
