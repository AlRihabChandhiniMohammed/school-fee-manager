import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { InvoiceForm, type StudentOption } from "@/components/invoice/invoice-form";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { round2 } from "@/lib/utils";
import type { Course } from "@/lib/types";

export const metadata = { title: "Edit Invoice" };

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const settings = await getSettings();

  const [invoiceRes, studentsRes, balancesRes, coursesRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, items:invoice_items(fee_type, description, amount, course_id)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("students")
      .select(
        "id, student_name, parent_name, parent_phone, parent_email, address, academic_year"
      )
      .order("student_name", { ascending: true }),
    supabase.from("invoices").select("student_id, balance").gt("balance", 0),
    supabase.from("courses").select("id, name, code").order("name", { ascending: true }),
  ]);

  if (!invoiceRes.data) notFound();
  const invoice = invoiceRes.data;

  const outstanding = new Map<string, number>();
  for (const inv of balancesRes.data ?? []) {
    outstanding.set(
      inv.student_id,
      round2((outstanding.get(inv.student_id) ?? 0) + Number(inv.balance))
    );
  }

  const students: StudentOption[] = (studentsRes.data ?? []).map((s) => ({
    ...s,
    parent_email: s.parent_email ?? null,
    address: s.address ?? null,
    outstanding: outstanding.get(s.id) ?? 0,
  }));

  const invItems = (invoice.items ?? []).map(
    (it: { fee_type: string; description: string | null; course_id: string | null; amount: number }) => ({
      fee_type: it.fee_type,
      description: it.description ?? "",
      course_id: it.course_id ?? "",
      amount: Number(it.amount),
    })
  );

  return (
    <div>
      <PageHeader
        title={`Edit Invoice ${invoice.invoice_number}`}
        description="Update fee items, amounts and payment details. The invoice number stays the same."
        actions={
          <Link href={`/invoices/${id}`}>
            <Button variant="outline">View Invoice</Button>
          </Link>
        }
      />
      <InvoiceForm
        students={students}
        courses={(coursesRes.data ?? []) as Course[]}
        settings={settings}
        mode="edit"
        invoiceId={id}
        preselectStudentId={invoice.student_id}
        initialValues={{
          invoice_date: invoice.invoice_date,
          academic_year: invoice.academic_year,
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          payment_method: invoice.payment_method ?? "",
          transaction_reference: invoice.transaction_reference ?? "",
          notes: invoice.notes ?? "",
          discount: Number(invoice.discount),
          previous_due: Number(invoice.previous_due),
          amount_paid: Number(invoice.amount_paid),
          subtotal: Number(invoice.subtotal),
          total_amount: Number(invoice.total_amount),
          balance: Number(invoice.balance),
          items: invItems,
        }}
      />
    </div>
  );
}