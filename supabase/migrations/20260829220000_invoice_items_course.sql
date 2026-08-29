-- ============================================================
-- Courses + student course enrolment + course on invoice items
-- Run this in the Supabase SQL Editor. It is the current migration
-- for the courses feature: idempotent, safe to run even if
-- 20260829210000_add_courses.sql was already applied.
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

-- RLS (drop+create to stay idempotent)
alter table public.courses enable row level security;
alter table public.student_courses enable row level security;

drop policy if exists "courses_all_authenticated" on public.courses;
create policy "courses_all_authenticated" on public.courses
  for all to authenticated using (true) with check (true);

drop policy if exists "student_courses_all_authenticated" on public.student_courses;
create policy "student_courses_all_authenticated" on public.student_courses
  for all to authenticated using (true) with check (true);

-- invoice_items: attach an optional course to each fee line
alter table public.invoice_items
  add column if not exists course_id uuid references public.courses(id) on delete set null;