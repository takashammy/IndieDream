-- Indie Dream shared studio. One row in cue_studio is the live snapshot the app
-- reads and writes. The cue_* tables are a readable mirror for the Neon SQL editor.

create table if not exists cue_studio (
  id text primary key,
  artists jsonb not null default '[]'::jsonb,
  accounts jsonb not null default '[]'::jsonb,
  events jsonb not null default '[]'::jsonb,
  posts jsonb not null default '[]'::jsonb,
  notices jsonb not null default '[]'::jsonb,
  deleted_post_ids jsonb not null default '[]'::jsonb,
  deleted_artist_ids jsonb not null default '[]'::jsonb,
  banned_user_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists cue_accounts (
  id text primary key,
  username text not null unique,
  password text not null,
  kind text not null,
  name text not null,
  role text not null default '',
  location text not null default '',
  bio text not null default '',
  photo text not null default '',
  email text not null default '',
  whatsapp text not null default '',
  artist_id text,
  updated_at timestamptz not null default now()
);

create table if not exists cue_artists (
  id text primary key,
  name text not null,
  role text not null default '',
  city text not null default '',
  area text not null default '',
  photo text not null default '',
  genres jsonb not null default '[]'::jsonb,
  bio text not null default '',
  label text not null default '',
  label_approved boolean not null default false,
  verified boolean not null default false,
  spotify text,
  youtube text,
  updated_at timestamptz not null default now()
);

create table if not exists cue_songs (
  id text primary key,
  artist_id text not null,
  title text not null,
  duration text not null default '',
  plays text not null default '',
  cover text not null default '',
  uploaded_at text not null default '',
  status text not null default 'pending',
  spotify text,
  youtube text
);
create index if not exists cue_songs_artist_id_idx on cue_songs (artist_id);

create table if not exists cue_events (
  id text primary key,
  title text not null,
  date text not null default '',
  weekday text not null default '',
  time text not null default '',
  venue text not null default '',
  area text not null default '',
  photo text not null default '',
  artist_ids jsonb not null default '[]'::jsonb,
  blurb text not null default '',
  iso_date text not null default '',
  status text not null default 'pending',
  posted_by text
);

create table if not exists cue_posts (
  id text primary key,
  author text not null default '',
  author_id text,
  role text not null default '',
  category text not null default 'seeking',
  title text not null,
  body text not null default '',
  time text not null default '',
  created_at text not null default '',
  archived boolean not null default false
);

create table if not exists cue_replies (
  id text primary key,
  post_id text not null,
  author text not null default '',
  author_id text,
  role text not null default '',
  body text not null default '',
  created_at text not null default ''
);
create index if not exists cue_replies_post_id_idx on cue_replies (post_id);

create table if not exists cue_notices (
  id text primary key,
  kind text not null,
  title text not null,
  body text not null default '',
  status text not null default 'pending',
  ref_id text,
  created_at text not null default '',
  fields jsonb not null default '{}'::jsonb
);
create index if not exists cue_notices_status_idx on cue_notices (status);
