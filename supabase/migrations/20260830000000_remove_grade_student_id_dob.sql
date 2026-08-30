-- ============================================================
-- Remove grade fields from students
-- Drops the four user-facing columns: student_id (code),
-- class, section and dob. The invoices/payments FKs that are
-- also named student_id (referencing students.id) are NOT
-- affected by this migration.
-- ============================================================

alter table public.students
  drop column if exists student_id,
  drop column if exists class,
  drop column if exists section,
  drop column if exists dob;

drop index if exists public.idx_students_class;