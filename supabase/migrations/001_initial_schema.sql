create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan text not null default 'FREE',
  status text not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz
);

create unique index subscriptions_user_id_unique_idx on public.subscriptions(user_id);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_path text,
  raw_text text,
  skills jsonb not null default '[]',
  education jsonb not null default '[]',
  projects jsonb not null default '[]',
  parsed_preview text,
  created_at timestamptz not null default now()
);

create table public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role text,
  raw_text text not null,
  required_skills jsonb not null default '[]',
  match_percent integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  job_description_id uuid references public.job_descriptions(id) on delete set null,
  difficulty text not null,
  plan text not null default 'FREE',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  overall_score integer,
  technical_score integer,
  communication_score integer,
  confidence_estimate integer,
  report jsonb
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  interview_id uuid references public.interviews(id) on delete cascade,
  overall_score integer,
  technical_score integer,
  hr_score integer,
  communication_score integer,
  coding_score integer,
  hireability integer,
  strengths jsonb not null default '[]',
  weaknesses jsonb not null default '[]',
  mistakes jsonb not null default '[]',
  better_answers jsonb not null default '[]',
  roadmap jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  question text not null,
  answer text not null,
  focus_area text,
  seconds_spent integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.coding_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  interview_id uuid references public.interviews(id) on delete set null,
  language text not null,
  prompt text not null,
  code text not null,
  ai_review jsonb,
  score integer,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.resumes enable row level security;
alter table public.job_descriptions enable row level security;
alter table public.interviews enable row level security;
alter table public.reports enable row level security;
alter table public.answers enable row level security;
alter table public.coding_sessions enable row level security;
alter table public.analytics_events enable row level security;

create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users read own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users manage own resumes" on public.resumes for all using (auth.uid() = user_id);
create policy "Users manage own job descriptions" on public.job_descriptions for all using (auth.uid() = user_id);
create policy "Users manage own interviews" on public.interviews for all using (auth.uid() = user_id);
create policy "Users manage own reports" on public.reports for all using (auth.uid() = user_id);
create policy "Users manage own coding sessions" on public.coding_sessions for all using (auth.uid() = user_id);
create policy "Users create analytics events" on public.analytics_events for insert with check (auth.uid() = user_id);

create policy "Users manage answers through own interviews"
on public.answers for all
using (
  exists (
    select 1 from public.interviews
    where interviews.id = answers.interview_id
    and interviews.user_id = auth.uid()
  )
);

create index resumes_user_id_idx on public.resumes(user_id);
create index interviews_user_id_started_idx on public.interviews(user_id, started_at desc);
create index reports_user_id_created_idx on public.reports(user_id, created_at desc);
create index analytics_events_name_idx on public.analytics_events(event_name, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    case when lower(new.email) = 'aditya.k.singhh@gmail.com' then 'admin' else 'user' end
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    role = case
      when lower(excluded.email) = 'aditya.k.singhh@gmail.com' then 'admin'
      else public.users.role
    end;

  insert into public.subscriptions (user_id, plan, status)
  values (
    new.id,
    case when lower(new.email) = 'aditya.k.singhh@gmail.com' then 'PREMIUM' else 'FREE' end,
    'active'
  )
  on conflict (user_id) do update set
    plan = case
      when lower(new.email) = 'aditya.k.singhh@gmail.com' then 'PREMIUM'
      else public.subscriptions.plan
    end,
    status = 'active',
    expires_at = case
      when lower(new.email) = 'aditya.k.singhh@gmail.com' then null
      else public.subscriptions.expires_at
    end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
