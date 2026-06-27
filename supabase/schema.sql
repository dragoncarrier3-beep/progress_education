-- StudyTrack Supabase schema
-- Run in Supabase SQL Editor when switching from demo mode to production.

-- Grades (5–13)
create table if not exists grades (
  id serial primary key,
  level int not null unique,
  label text not null
);

insert into grades (level, label) values
  (5, 'Grade 5'), (6, 'Grade 6'), (7, 'Grade 7'), (8, 'Grade 8'), (9, 'Grade 9'),
  (10, 'Grade 10'), (11, 'Grade 11'), (12, 'Grade 12'), (13, 'Grade 13')
on conflict (level) do nothing;

-- Subjects
create table if not exists subjects (
  id serial primary key,
  name text not null,
  icon text default 'book',
  color text default '#3B82F6',
  sort_order int default 0
);

-- Topics (per grade + subject)
create table if not exists topics (
  id serial primary key,
  grade_level int not null references grades(level),
  subject_id int not null references subjects(id) on delete cascade,
  name text not null,
  sort_order int default 0
);

-- Learning items
create table if not exists learning_items (
  id serial primary key,
  topic_id int not null references topics(id) on delete cascade,
  content text not null,
  hint text,
  sort_order int default 0
);

-- User progress (only learning data stored per user)
create table if not exists progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id int not null references learning_items(id) on delete cascade,
  status text not null check (status in ('know', 'kinda', 'dont')),
  updated_at timestamptz default now(),
  primary key (user_id, item_id)
);

-- Admin users
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Row Level Security
alter table progress enable row level security;
alter table admin_users enable row level security;
alter table subjects enable row level security;
alter table topics enable row level security;
alter table learning_items enable row level security;
alter table grades enable row level security;

-- Public read for content tables
create policy "grades are public" on grades for select using (true);
create policy "subjects are public" on subjects for select using (true);
create policy "topics are public" on topics for select using (true);
create policy "items are public" on learning_items for select using (true);

-- Users manage own progress
create policy "users read own progress" on progress for select using (auth.uid() = user_id);
create policy "users write own progress" on progress for insert with check (auth.uid() = user_id);
create policy "users update own progress" on progress for update using (auth.uid() = user_id);

-- Admins can manage content
create policy "admins manage subjects" on subjects for all using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "admins manage topics" on topics for all using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "admins manage items" on learning_items for all using (
  exists (select 1 from admin_users where user_id = auth.uid())
);
create policy "users can self-admin" on admin_users for insert with check (auth.uid() = user_id);
create policy "admins read admin list" on admin_users for select using (auth.uid() = user_id);
