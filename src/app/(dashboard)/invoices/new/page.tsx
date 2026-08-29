import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { InvoiceForm, type StudentOption } from "@/components/invoice/invoice-form";
import { PageHeader } from "@/components/ui/page-header";
import { round2 } from "@/lib/utils";
import type { Course } from "@/lib/types";

export const metadata = { title: "Generate Invoice" };

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const settings = await getSettings();

  const [studentsRes, balancesRes, coursesRes] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, student_id, student_name, parent_name, parent_phone, parent_email, address, class, section, academic_year"
      )
      .order("student_name", { ascending: true }),
    supabase.from("invoices").select("student_id, balance").gt("balance", 0),
    supabase.from("courses").select("id, name, code").order("name", { ascending: true }),
  ]);

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

  return (
    <div>
      <PageHeader
        title="Generate Invoice"
        description="Select a student, add fee items, choose a course per item, enter payment details, preview and save. A unique invoice number will be generated automatically."
      />
      <InvoiceForm
        students={students}
        courses={(coursesRes.data ?? []) as Course[]}
        settings={settings}
        mode="create"
        preselectStudentId={sp.student}
      />
    </div>
  );
}