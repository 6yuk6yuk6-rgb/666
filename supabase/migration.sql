create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null default '',
  category_id uuid not null references categories(id) on delete restrict,
  base_prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prompt_sections (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references prompts(id) on delete cascade,
  section_name text not null,
  content text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profile (
  id integer primary key default 1 check (id = 1),
  profile_image_url text not null default '/profile-placeholder.svg',
  status_text text not null default '( ˘͈ ᵕ ˘͈ )',
  message text not null default '오늘도 작은 프롬프트를 정리하는 중',
  updated_at timestamptz not null default now()
);

create table if not exists cover_settings (
  id integer primary key default 1 check (id = 1),
  title text not null default 'i LoVe Y♥U',
  main_image_url text not null default '/cover-placeholder.svg',
  chibi_image_1_url text,
  chibi_image_2_url text,
  chibi_image_3_url text,
  chibi_image_4_url text,
  chibi_image_5_url text,
  updated_at timestamptz not null default now()
);

create index if not exists prompts_category_id_idx on prompts(category_id);
create index if not exists prompts_title_idx on prompts using gin (to_tsvector('simple', title));
create index if not exists prompts_created_at_idx on prompts(created_at desc);
create index if not exists prompts_updated_at_idx on prompts(updated_at desc);
create index if not exists prompt_sections_prompt_id_sort_idx on prompt_sections(prompt_id, sort_order);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prompts_set_updated_at on prompts;
create trigger prompts_set_updated_at
before update on prompts
for each row execute function set_updated_at();

drop trigger if exists prompt_sections_set_updated_at on prompt_sections;
create trigger prompt_sections_set_updated_at
before update on prompt_sections
for each row execute function set_updated_at();

drop trigger if exists profile_set_updated_at on profile;
create trigger profile_set_updated_at
before update on profile
for each row execute function set_updated_at();

drop trigger if exists cover_settings_set_updated_at on cover_settings;
create trigger cover_settings_set_updated_at
before update on cover_settings
for each row execute function set_updated_at();

alter table categories enable row level security;
alter table prompts enable row level security;
alter table prompt_sections enable row level security;
alter table profile enable row level security;
alter table cover_settings enable row level security;

insert into profile (id) values (1)
on conflict (id) do nothing;

insert into cover_settings (id) values (1)
on conflict (id) do nothing;
