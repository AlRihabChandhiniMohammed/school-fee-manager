import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceWithStudent } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(
      "*, student:students(id, student_id, student_name, parent_name, parent_phone, parent_email, class, section, academic_year), items:invoice_items(id, fee_type, description, amount), payments(id, amount, payment_method, payment_date, transaction_reference)"
    )
    .eq("id", id)
    .maybeSingle();

  const invoice = (data ?? null) as unknown as InvoiceWithStudent | null;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}