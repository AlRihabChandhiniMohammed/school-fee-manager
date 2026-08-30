-- ============================================================
-- Remove previous_due from invoices
-- Drops the invoices.previous_due column. Totals are now
-- computed as subtotal - discount.
-- ============================================================

alter table public.invoices
  drop column if exists previous_due;