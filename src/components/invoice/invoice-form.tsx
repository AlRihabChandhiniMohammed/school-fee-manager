"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  Search,
  ChevronDown,
  Eye,
  Loader2,
  BookOpen,
} from "lucide-react";
import { invoiceSchema, type InvoiceFormInput, type InvoiceFormValues } from "@/lib/validation";
import { createInvoiceAction, updateInvoiceAction } from "@/lib/actions";
import { FEE_TYPES, PAYMENT_METHODS, ACADEMIC_YEARS } from "@/lib/constants";
import type { Course, SchoolSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { InvoiceDocument } from "@/components/invoice/invoice-document";
import { parseNumber, round2 } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export interface StudentOption {
  id: string;
  student_id: string;
  student_name: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  address: string | null;
  class: string;
  section: string;
  academic_year: string;
  outstanding: number;
}

interface InvoiceFormProps {
  students: StudentOption[];
  courses: Course[];
  settings: SchoolSettings;
  mode: "create" | "edit";
  invoiceId?: string;
  preselectStudentId?: string;
  initialValues?: {
    invoice_date: string;
    academic_year: string;
    invoice_number?: string;
    status?: string;
    payment_method?: string;
    transaction_reference?: string;
    notes?: string;
    discount: number | string;
    previous_due: number | string;
    amount_paid: number | string;
    items: {
      fee_type: string;
      description: string;
      course_id?: string;
      amount: number | string;
    }[];
    subtotal?: number;
    total_amount?: number;
    balance?: number;
  };
}

function amountStr(v: unknown, fallback = ""): string {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : fallback;
}

export function InvoiceForm({
  students,
  courses,
  settings,
  mode,
  invoiceId,
  preselectStudentId,
  initialValues,
}: InvoiceFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const currency = settings.currency;

  const courseName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses) map.set(c.id, c.name);
    return (id: string) => map.get(id) ?? "";
  }, [courses]);

  const preselected = preselectStudentId
    ? students.find((s) => s.id === preselectStudentId)
    : undefined;

  const [selected, setSelected] = useState<StudentOption | null>(preselected ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormInput>({
    resolver: zodResolver(invoiceSchema),
    mode: "onBlur",
    defaultValues: {
      student_id: preselected?.id ?? "",
      invoice_date: initialValues?.invoice_date ?? new Date().toISOString().slice(0, 10),
      academic_year: initialValues?.academic_year ?? preselected?.academic_year ?? "2026-2027",
      items:
        initialValues?.items.length
          ? initialValues.items.map((it) => ({
              fee_type: it.fee_type,
              description: it.description ?? "",
              course_id: it.course_id ?? "",
              amount: amountStr(it.amount),
            }))
          : [{ fee_type: "Tuition Fee", description: "", course_id: "", amount: "" }],
      discount: amountStr(initialValues?.discount, "0"),
      previous_due: amountStr(initialValues?.previous_due, preselected?.outstanding ? String(preselected.outstanding) : "0"),
      amount_paid: amountStr(initialValues?.amount_paid, "0"),
      payment_method: initialValues?.payment_method ?? "",
      transaction_reference: initialValues?.transaction_reference ?? "",
      notes: initialValues?.notes ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const values = watch();
  const calc = useMemo(() => {
    const subtotal = round2(
      (values.items ?? []).reduce((s, it) => s + parseNumber(it.amount), 0)
    );
    const discount = round2(Math.max(0, parseNumber(values.discount)));
    const previousDue = round2(Math.max(0, parseNumber(values.previous_due)));
    const total = round2(subtotal - discount + previousDue);
    const paid = round2(Math.min(Math.max(0, parseNumber(values.amount_paid)), Math.max(0, total)));
    const balance = round2(total - paid);
    return { subtotal, discount, previousDue, total, paid, balance };
  }, [values.items, values.discount, values.previous_due, values.amount_paid]);

  const filteredStudents = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.student_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.parent_name.toLowerCase().includes(q) ||
        s.parent_phone.includes(q)
    );
  }, [students, pickerQuery]);

  function selectStudent(s: StudentOption) {
    setSelected(s);
    setValue("student_id", s.id, { shouldValidate: true });
    setValue("academic_year", s.academic_year, { shouldValidate: true });
    setValue("previous_due", String(s.outstanding));
    clearErrors("student_id");
    setPickerOpen(false);
    setPickerQuery("");
  }

  function removeItem(index: number) {
    if (fields.length === 1) {
      toast("info", "An invoice must have at least one fee item");
      return;
    }
    remove(index);
  }

  async function onSubmit(v: InvoiceFormInput) {
    const parsed = invoiceSchema.parse(v) as InvoiceFormValues;
    const result =
      mode === "create"
        ? await createInvoiceAction(parsed)
        : await updateInvoiceAction(invoiceId!, parsed);

    if (result.success) {
      toast(
        "success",
        mode === "create"
          ? `Invoice ${(result as { data: { invoice_number: string } }).data.invoice_number} saved successfully`
          : "Invoice updated successfully"
      );
      router.refresh();
      const targetId = mode === "create" ? (result as { data: { id: string } }).data.id : invoiceId;
      router.push(`/invoices/${targetId}`);
    } else {
      toast("error", result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* ---------- Left: 2 cols ---------- */}
      <div className="space-y-6 lg:col-span-2">
        {/* Student selection */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">1. Select Student</h2>
            <span className="text-xs text-slate-400">
              Parent details are shown automatically
            </span>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-left text-sm shadow-sm transition hover:border-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {selected ? (
                <span>
                  <span className="font-medium text-slate-900">{selected.student_name}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {selected.student_id} • Class {selected.class}
                    {selected.section ? `-${selected.section}` : ""}
                  </span>
                </span>
              ) : (
                <span className="text-slate-400">Search and select a student…</span>
              )}
            </button>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <input type="hidden" {...register("student_id")} />
          <FieldError message={errors.student_id?.message} />

          {pickerOpen && (
            <div className="relative z-10 mt-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 p-3">
                  <Input
                    autoFocus
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Search by student name, ID, parent or phone…"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-400">
                      No students match.&nbsp;
                      <Link href="/students/new" className="font-medium text-indigo-600">
                        Add a student
                      </Link>
                    </p>
                  ) : (
                    filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectStudent(s)}
                        className="flex w-full items-start justify-between gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-indigo-50/60"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">{s.student_name}</p>
                          <p className="text-xs text-slate-400">
                            {s.student_id} • Class {s.class}
                            {s.section ? `-${s.section}` : ""} • {s.academic_year}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {s.parent_name} • {s.parent_phone}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          {s.outstanding > 0 && (
                            <p className="font-medium text-rose-600">
                              Due {formatCurrency(s.outstanding, currency)}
                            </p>
                          )}
                          {s.outstanding === 0 && <p className="text-emerald-600">No dues</p>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {selected && !pickerOpen && (
            <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Parent Information</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{selected.parent_name}</p>
                <p className="text-xs text-slate-500">{selected.parent_phone}</p>
                {selected.parent_email && <p className="text-xs text-slate-500">{selected.parent_email}</p>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Student Information</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{selected.student_name}</p>
                <p className="text-xs text-slate-500">ID: {selected.student_id}</p>
                <p className="text-xs text-slate-500">
                  Class {selected.class}
                  {selected.section ? ` - ${selected.section}` : ""} • {selected.academic_year}
                </p>
              </div>
              {selected.outstanding > 0 && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 sm:col-span-2">
                  Previous outstanding balance of {formatCurrency(selected.outstanding, currency)} has
                  been pre-filled as Previous Due. Adjust if needed.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Fee details */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">2. Fee Details</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ fee_type: "Tuition Fee", description: "", course_id: "", amount: "" })}>
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="mb-3 rounded-lg border border-slate-200 p-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_150px_auto]">
                <div>
                  <Label htmlFor={`items.${index}.fee_type`}>Fee Type</Label>
                  <Select id={`items.${index}.fee_type`} {...register(`items.${index}.fee_type`)}>
                    {FEE_TYPES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </Select>
                  <FieldError message={errors.items?.[index]?.fee_type?.message} />
                </div>
                <div>
                  <Label htmlFor={`items.${index}.course_id`}>Course</Label>
                  <Select id={`items.${index}.course_id`} {...register(`items.${index}.course_id`)}>
                    <option value="">— No course —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`items.${index}.description`}>Description</Label>
                  <Input
                    id={`items.${index}.description`}
                    placeholder="e.g. Term 1"
                    {...register(`items.${index}.description`)}
                  />
                </div>
                <div>
                  <Label htmlFor={`items.${index}.amount`}>Amount</Label>
                  <Input
                    id={`items.${index}.amount`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register(`items.${index}.amount`)}
                  />
                  <FieldError message={errors.items?.[index]?.amount?.message} />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded-lg p-2.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {errors.items?.root?.message && (
            <FieldError message={errors.items.root.message} />
          )}

          <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="invoice_date">Invoice Date</Label>
              <Input id="invoice_date" type="date" {...register("invoice_date")} />
              <FieldError message={errors.invoice_date?.message} />
            </div>
            <div>
              <Label htmlFor="academic_year">Academic Year</Label>
              <Input id="academic_year" list="inv-years" {...register("academic_year")} />
              <datalist id="inv-years">
                {ACADEMIC_YEARS.map((y) => (
                  <option key={y} value={y} />
                ))}
              </datalist>
              <FieldError message={errors.academic_year?.message} />
            </div>
            <div>
              <Label htmlFor="discount">Discount</Label>
              <Input id="discount" type="number" step="0.01" min="0" placeholder="0.00" {...register("discount")} />
              <FieldError message={errors.discount?.message} />
            </div>
            <div>
              <Label htmlFor="previous_due">Previous Due</Label>
              <Input id="previous_due" type="number" step="0.01" min="0" placeholder="0.00" {...register("previous_due")} />
              <FieldError message={errors.previous_due?.message} />
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">3. Payment</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="amount_paid">Amount Paid</Label>
              <Input id="amount_paid" type="number" step="0.01" min="0" placeholder="0.00" {...register("amount_paid")} />
              <FieldError message={errors.amount_paid?.message} />
            </div>
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select id="payment_method" {...register("payment_method")}>
                <option value="">Select method</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.payment_method?.message} />
            </div>
            <div>
              <Label htmlFor="transaction_reference">Transaction ID / Cheque No / Reference</Label>
              <Input
                id="transaction_reference"
                placeholder="Optional"
                {...register("transaction_reference")}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" placeholder="Optional" {...register("notes")} />
            </div>
          </div>
        </section>
      </div>

      {/* ---------- Right: totals + actions ---------- */}
      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Payment Summary</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd>{formatCurrency(calc.subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Discount</dt>
              <dd>− {formatCurrency(calc.discount, currency)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Previous Due</dt>
              <dd>{formatCurrency(calc.previousDue, currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2.5 font-semibold text-slate-900">
              <dt>Total Amount</dt>
              <dd>{formatCurrency(calc.total, currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 font-semibold text-emerald-600">
              <dt>Amount Paid</dt>
              <dd>− {formatCurrency(calc.paid, currency)}</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-amber-100 px-3 py-2.5 font-bold text-slate-900">
              <dt>Balance Due</dt>
              <dd>{formatCurrency(calc.balance, currency)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-400">
            Totals are recalculated and verified on the server before saving.
          </p>
        </section>

        <div className="space-y-2.5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="h-4 w-4" /> Preview Invoice
          </Button>
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !selected}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "Save & Generate Invoice" : "Save Changes"}
          </Button>
          <Link href={mode === "edit" && invoiceId ? `/invoices/${invoiceId}` : "/invoices"} className="block">
            <Button type="button" variant="ghost" size="lg" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </div>

      {/* ---------- Preview modal ---------- */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Invoice Preview"
        description="Review the invoice before saving."
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Back to edit
            </Button>
            <Button onClick={() => setPreviewOpen(false)}>
              Edit details
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="overflow-y-auto rounded-xl border border-slate-200 bg-slate-100 p-4">
            <InvoiceDocument
              invoice={{
                invoice_number: initialValues?.invoice_number ?? `${settings.invoice_prefix}-PREVIEW`,
                invoice_date: values.invoice_date || new Date().toISOString().slice(0, 10),
                academic_year: values.academic_year || selected.academic_year,
                status: initialValues?.status ?? "pending",
                notes: values.notes || null,
                subtotal: calc.subtotal,
                discount: calc.discount,
                previous_due: calc.previousDue,
                total_amount: calc.total,
                amount_paid: calc.paid,
                balance: calc.balance,
                payment_method: values.payment_method || null,
              }}
              student={{
                student_name: selected.student_name,
                student_id: selected.student_id,
                class: selected.class,
                section: selected.section,
                parent_name: selected.parent_name,
                parent_phone: selected.parent_phone,
                parent_email: selected.parent_email,
                address: selected.address,
              }}
              items={(values.items ?? [])
                .filter((it) => parseNumber(it.amount) > 0)
                .map((it) => ({
                  fee_type: it.fee_type,
                  description: it.description ?? null,
                  course: courseName(it.course_id ?? "") || null,
                  amount: parseNumber(it.amount),
                }))}
              settings={settings}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-sm text-slate-500">
            <BookOpen className="h-8 w-8 text-slate-300" />
            Select a student to preview the invoice.
          </div>
        )}
      </Modal>
    </form>
  );
}