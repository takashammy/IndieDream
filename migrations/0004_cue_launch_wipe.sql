-- Launch wipe + sessions. Runs once on next deploy.
-- Clears preview accounts/posts/bookings. Catalogue artists come back from app code.

create table if not exists cue_sessions (
  token text primary key,
  account_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists cue_sessions_account_id_idx on cue_sessions (account_id);
create index if not exists cue_sessions_expires_at_idx on cue_sessions (expires_at);

delete from cue_sessions;
delete from cue_replies;
delete from cue_posts;
delete from cue_notices;
delete from cue_songs;
delete from cue_events;
delete from cue_artists;
delete from cue_accounts;

update cue_studio set
  artists = '[]'::jsonb,
  accounts = '[]'::jsonb,
  events = '[]'::jsonb,
  posts = '[]'::jsonb,
  notices = '[]'::jsonb,
  deleted_post_ids = '[]'::jsonb,
  deleted_artist_ids = '[]'::jsonb,
  banned_user_ids = '[]'::jsonb,
  updated_at = now()
where id = 'indie-dream';
