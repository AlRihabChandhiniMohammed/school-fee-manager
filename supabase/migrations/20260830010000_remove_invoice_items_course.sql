-- ============================================================
-- Remove course from invoice fee items
-- Drops invoice_items.course_id (course attribution per fee
-- line). The courses table and student_courses enrollment stay.
-- ============================================================

alter table public.invoice_items
  drop column if exists course_id;