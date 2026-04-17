-- Auto-Videos 초기 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1) 프로젝트 테이블
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null default '새 프로젝트',
  fps integer not null default 30,
  width integer not null default 1920,
  height integer not null default 1080,
  duration_frames integer not null default 300,
  -- 타임라인 전체 상태를 JSON으로 저장 (tracks, clips)
  timeline jsonb not null default '{"tracks": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) 에셋 테이블 (업로드된 원본 파일 목록)
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  type text not null check (type in ('image','video','audio')),
  name text not null,
  storage_path text not null,           -- Supabase Storage 경로
  duration_seconds real,                 -- 오디오/비디오용
  width integer,                         -- 이미지/비디오용
  height integer,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 3) 렌더 작업 테이블
create table if not exists public.renders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','rendering','done','failed')),
  progress real not null default 0,
  output_path text,                      -- 렌더 완료 시 Storage 경로
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_renders_updated on public.renders;
create trigger trg_renders_updated before update on public.renders
  for each row execute function public.touch_updated_at();

-- MVP는 단일 사용자 전제: RLS 비활성 (배포 시 반드시 켜세요)
alter table public.projects disable row level security;
alter table public.assets disable row level security;
alter table public.renders disable row level security;
