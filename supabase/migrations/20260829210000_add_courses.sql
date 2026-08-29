-- ============================================================
-- Courses + student course enrolment
-- Run this in the Supabase SQL Editor (after the complete schema
-- migration) to add course management.
-- ============================================================

-- courses
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text,
  created_at timestamptz not null default now()
);

create index if not exists idx_courses_name on public.courses (name);

-- student_courses (many-to-many: which courses a student has taken)
create table if not exists public.student_courses (
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  primary key (student_id, course_id)
);

-- RLS
alter table public.courses enable row level security;
alter table public.student_courses enable row level security;

create policy "courses_all_authenticated" on public.courses
  for all to authenticated using (true) with check (true);

create policy "student_courses_all_authenticated" on public.student_courses
  for all to authenticated using (true) with check (true);