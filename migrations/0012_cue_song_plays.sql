-- Durable play counts, independent of the studio JSON snapshot.
create table if not exists cue_song_plays (
  song_id text primary key,
  plays integer not null default 0,
  updated_at timestamptz not null default now()
);
