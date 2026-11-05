-- Shared calendars: members record events and day notes together.

create table if not exists calendars (
  id text primary key,
  name text not null,
  invite_code text not null unique,
  owner_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists calendar_members (
  calendar_id text not null references calendars (id) on delete cascade,
  user_id text not null,
  display_name text not null,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (calendar_id, user_id)
);

create index if not exists calendar_members_user_idx on calendar_members (user_id);

create table if not exists events (
  id text primary key,
  calendar_id text not null references calendars (id) on delete cascade,
  author_id text not null,
  author_name text not null,
  title text not null,
  note text not null default '',
  starts_on date not null,
  start_time text,
  end_time text,
  all_day boolean not null default true,
  tag text not null default 'plan' check (tag in ('plan', 'task', 'mark', 'memo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_cal_day_idx on events (calendar_id, starts_on);

create table if not exists day_notes (
  id text primary key,
  calendar_id text not null references calendars (id) on delete cascade,
  author_id text not null,
  author_name text not null,
  day date not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists day_notes_cal_day_idx on day_notes (calendar_id, day);
