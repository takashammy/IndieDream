-- Web Push for signup alerts (Martin's PWA).
create table if not exists cue_push_keys (
  id integer primary key,
  public_key text not null,
  private_key text not null
);

create table if not exists cue_push_subs (
  endpoint text primary key,
  account_id text not null,
  p256dh text not null,
  auth text not null,
  updated_at timestamptz not null default now()
);
