-- ============================================================
-- School Fee Invoice Management System - Database Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor)
-- ============================================================

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- students
-- ------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_id text not null unique,
  student_name text not null,
  parent_name text not null,
  parent_phone text not null,
  parent_email text,
  address text,
  class text not null,
  section text not null default '',
  academic_year text not null,
  dob date,
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_name on public.students (student_name);
create index if not exists idx_students_parent_phone on public.students (parent_phone);
create index if not exists idx_students_class on public.students (class);
create index if not exists idx_students_academic_year on public.students (academic_year);

-- ------------------------------------------------------------
-- invoices
-- ------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  student_id uuid not null references public.students(id) on delete cascade,
  invoice_date date not null,
  academic_year text not null default '',
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  previous_due numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  payment_method text,
  transaction_reference text,
  status text not null default 'pending' check (status in ('paid','partial','pending')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_student on public.invoices (student_id);
create index if not exists idx_invoices_date on public.invoices (invoice_date);
create index if not exists idx_invoices_status on public.invoices (status);
create index if not exists idx_invoices_academic_year on public.invoices (academic_year);

-- ------------------------------------------------------------
-- invoice_items
-- ------------------------------------------------------------
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  fee_type text not null,
  description text,
  amount numeric(12,2) not null default 0
);

create index if not exists idx_invoice_items_invoice on public.invoice_items (invoice_id);

-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(12,2) not null default 0,
  payment_method text,
  transaction_reference text,
  payment_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_invoice on public.payments (invoice_id);
create index if not exists idx_payments_student on public.payments (student_id);

-- ------------------------------------------------------------
-- invoice_counters (used by generate_invoice_number())
-- ------------------------------------------------------------
create table if not exists public.invoice_counters (
  year integer primary key,
  last_number integer not null default 0
);

-- ------------------------------------------------------------
-- settings  (key/value application settings)
-- ------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value text
);

-- ------------------------------------------------------------
-- Keep totals consistent (balance + status always correct server-side)
-- ------------------------------------------------------------
create or replace function public.sync_invoice_totals()
returns trigger
language plpgsql
as $$
begin
  new.balance := round((coalesce(new.total_amount,0) - coalesce(new.amount_paid,0))::numeric, 2);
  if new.total_amount is null or new.total_amount <= 0 then
    new.status := 'pending';
  elsif new.amount_paid is null or new.amount_paid <= 0 then
    new.status := 'pending';
  elsif new.amount_paid >= new.total_amount then
    new.status := 'paid';
    new.amount_paid := new.total_amount;
    new.balance := 0;
  else
    new.status := 'partial';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invoices_sync on public.invoices;
create trigger trg_invoices_sync
before insert or update on public.invoices
for each row execute function public.sync_invoice_totals();

-- ------------------------------------------------------------
-- updated_at trigger
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_students_updated on public.students;
create trigger trg_students_updated
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists trg_invoices_updated on public.invoices;
create trigger trg_invoices_updated
before update on public.invoices
for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Invoice number generator (thread-safe, never duplicates)
-- Format: PREFIX-YEAR-0001  e.g. INV-2026-0001
-- Honors settings: invoice_prefix, invoice_start
-- ------------------------------------------------------------
create or replace function public.generate_invoice_number(p_year integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_num integer;
  v_prefix text;
  v_start integer;
begin
  select value into v_prefix from public.settings where key = 'invoice_prefix';
  if v_prefix is null or v_prefix = '' then
    v_prefix := 'INV';
  end if;

  select coalesce(cast(value as integer), 1) into v_start from public.settings where key = 'invoice_start';

  insert into public.invoice_counters (year, last_number)
  values (p_year, greatest(coalesce(v_start, 1) - 1, 0))
  on conflict (year) do nothing;

  select last_number into v_num
  from public.invoice_counters
  where year = p_year
  for update;

  if v_num is null then
    v_num := greatest(coalesce(v_start, 1) - 1, 0);
  end if;

  v_num := v_num + 1;

  update public.invoice_counters
  set last_number = v_num
  where year = p_year;

  return concat(v_prefix, '-', p_year::text, '-', lpad(v_num::text, 4, '0'));
end;
$$;

-- ------------------------------------------------------------
-- Non-Duplicate protection: unique index already set on invoice_number.
-- Fallback: if the generated number somehow collides, increment.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.students enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.settings enable row level security;
alter table public.invoice_counters enable row level security;

-- Authenticated admins can read/write all application data
create policy "students_all_authenticated" on public.students
  for all to authenticated using (true) with check (true);

create policy "invoices_all_authenticated" on public.invoices
  for all to authenticated using (true) with check (true);

create policy "invoice_items_all_authenticated" on public.invoice_items
  for all to authenticated using (true) with check (true);

create policy "payments_all_authenticated" on public.payments
  for all to authenticated using (true) with check (true);

create policy "settings_all_authenticated" on public.settings
  for all to authenticated using (true) with check (true);

-- invoice_counters: no direct access; only via generate_invoice_number()
-- (which is SECURITY DEFINER), keep RLS locked down.
revoke all on public.invoice_counters from anon, authenticated;
grant select on public.invoice_counters to postgres;

grant execute on function public.generate_invoice_number(integer) to authenticated;

-- ------------------------------------------------------------
-- courses  (subjects a student can take)
-- ------------------------------------------------------------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text,
  created_at timestamptz not null default now()
);

create index if not exists idx_courses_name on public.courses (name);

-- ------------------------------------------------------------
-- student_courses  (many-to-many enrolment)
-- ------------------------------------------------------------
create table if not exists public.student_courses (
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  primary key (student_id, course_id)
);

alter table public.courses enable row level security;
alter table public.student_courses enable row level security;

create policy "courses_all_authenticated" on public.courses
  for all to authenticated using (true) with check (true);

create policy "student_courses_all_authenticated" on public.student_courses
  for all to authenticated using (true) with check (true);