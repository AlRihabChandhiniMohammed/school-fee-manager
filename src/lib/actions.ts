"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  courseSchema,
  invoiceSchema,
  settingsSchema,
  studentSchema,
  type CourseFormValues,
  type InvoiceFormValues,
  type SettingsFormValues,
  type StudentFormValues,
} from "@/lib/validation";
import { computeInvoiceTotals, round2 } from "@/lib/utils";

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getSupabase() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return supabase;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

// ---------------------------------------------------------------
// Students
// ---------------------------------------------------------------

export async function createStudentAction(
  input: StudentFormValues
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = studentSchema.parse(input);
    const supabase = await getSupabase();

    const { data, error } = await supabase
      .from("students")
      .insert({
        student_name: parsed.student_name,
        parent_name: parsed.parent_name,
        parent_phone: parsed.parent_phone,
        parent_email: parsed.parent_email || null,
        address: parsed.address || null,
        academic_year: parsed.academic_year,
        gender: parsed.gender || null,
      })
      .select("id")
      .single();

    if (error) throw error;

    const courseIds = parsed.course_ids ?? [];
    if (courseIds.length > 0) {
      const { error: linkError } = await supabase.from("student_courses").insert(
        courseIds.map((course_id) => ({ student_id: data.id, course_id }))
      );
      if (linkError) throw linkError;
    }

    revalidatePath("/", "layout");
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function updateStudentAction(
  id: string,
  input: StudentFormValues
): Promise<ActionResult> {
  try {
    const parsed = studentSchema.parse(input);
    const supabase = await getSupabase();

    const { error } = await supabase
      .from("students")
      .update({
        student_name: parsed.student_name,
        parent_name: parsed.parent_name,
        parent_phone: parsed.parent_phone,
        parent_email: parsed.parent_email || null,
        address: parsed.address || null,
        academic_year: parsed.academic_year,
        gender: parsed.gender || null,
      })
      .eq("id", id);

    if (error) throw error;

    const { error: delCoursesError } = await supabase
      .from("student_courses")
      .delete()
      .eq("student_id", id);
    if (delCoursesError) throw delCoursesError;

    const courseIds = parsed.course_ids ?? [];
    if (courseIds.length > 0) {
      const { error: linkError } = await supabase.from("student_courses").insert(
        courseIds.map((course_id) => ({ student_id: id, course_id }))
      );
      if (linkError) throw linkError;
    }

    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function deleteStudentAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

// ---------------------------------------------------------------
// Courses
// ---------------------------------------------------------------

export async function createCourseAction(
  input: CourseFormValues
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = courseSchema.parse(input);
    const supabase = await getSupabase();

    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("name", parsed.name)
      .maybeSingle();
    if (existing) {
      return { success: false, error: `Course "${parsed.name}" already exists.` };
    }

    const { data, error } = await supabase
      .from("courses")
      .insert({ name: parsed.name, code: parsed.code || null })
      .select("id")
      .single();

    if (error) throw error;
    revalidatePath("/", "layout");
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function deleteCourseAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

// ---------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------

export async function createInvoiceAction(
  input: InvoiceFormValues
): Promise<ActionResult<{ id: string; invoice_number: string }>> {
  try {
    const parsed = invoiceSchema.parse(input);
    const supabase = await getSupabase();

    const totals = computeInvoiceTotals(
      parsed.items,
      parsed.discount,
      parsed.amount_paid
    );

    const invoiceYear = new Date(parsed.invoice_date).getFullYear();
    const { data: invoiceNumber, error: numberError } = await supabase.rpc(
      "generate_invoice_number",
      { p_year: invoiceYear }
    );
    if (numberError || !invoiceNumber) throw numberError ?? new Error("Could not generate invoice number");

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        student_id: parsed.student_id,
        invoice_date: parsed.invoice_date,
        academic_year: parsed.academic_year,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total_amount: totals.total,
        amount_paid: totals.paid,
        balance: totals.balance,
        payment_method: totals.paid > 0 ? parsed.payment_method || null : null,
        transaction_reference: parsed.transaction_reference || null,
        status: totals.balance <= 0 ? "paid" : totals.paid > 0 ? "partial" : "pending",
        notes: parsed.notes || null,
      })
      .select("id, invoice_number")
      .single();

    if (error) throw error;

    const itemRows = parsed.items.map((item) => ({
      invoice_id: invoice.id,
      fee_type: item.fee_type,
      description: item.description || null,
      amount: round2(item.amount),
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemRows);
    if (itemsError) throw itemsError;

    if (totals.paid > 0) {
      const { error: paymentError } = await supabase.from("payments").insert({
        invoice_id: invoice.id,
        student_id: parsed.student_id,
        amount: round2(totals.paid),
        payment_method: parsed.payment_method || null,
        transaction_reference: parsed.transaction_reference || null,
        payment_date: parsed.invoice_date,
        notes: parsed.notes || null,
      });
      if (paymentError) throw paymentError;
    }

    revalidatePath("/", "layout");
    return { success: true, data: { id: invoice.id, invoice_number: invoice.invoice_number } };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function updateInvoiceAction(
  invoiceId: string,
  input: InvoiceFormValues
): Promise<ActionResult> {
  try {
    const parsed = invoiceSchema.parse(input);
    const supabase = await getSupabase();

    const { data: existing } = await supabase
      .from("invoices")
      .select("id")
      .eq("id", invoiceId)
      .maybeSingle();
    if (!existing) return { success: false, error: "Invoice not found" };

    const totals = computeInvoiceTotals(
      parsed.items,
      parsed.discount,
      parsed.amount_paid
    );

    const { error } = await supabase
      .from("invoices")
      .update({
        student_id: parsed.student_id,
        invoice_date: parsed.invoice_date,
        academic_year: parsed.academic_year,
        subtotal: totals.subtotal,
        discount: totals.discount,
        total_amount: totals.total,
        amount_paid: totals.paid,
        balance: totals.balance,
        payment_method: totals.paid > 0 ? parsed.payment_method || null : null,
        transaction_reference: parsed.transaction_reference || null,
        status: totals.balance <= 0 ? "paid" : totals.paid > 0 ? "partial" : "pending",
        notes: parsed.notes || null,
      })
      .eq("id", invoiceId);

    if (error) throw error;

    const { error: delItemsError } = await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", invoiceId);
    if (delItemsError) throw delItemsError;

    const itemRows = parsed.items.map((item) => ({
      invoice_id: invoiceId,
      fee_type: item.fee_type,
      description: item.description || null,
      amount: round2(item.amount),
    }));
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemRows);
    if (itemsError) throw itemsError;

    const { error: delPaymentsError } = await supabase
      .from("payments")
      .delete()
      .eq("invoice_id", invoiceId);
    if (delPaymentsError) throw delPaymentsError;

    if (totals.paid > 0) {
      const { error: paymentError } = await supabase.from("payments").insert({
        invoice_id: invoiceId,
        student_id: parsed.student_id,
        amount: round2(totals.paid),
        payment_method: parsed.payment_method || null,
        transaction_reference: parsed.transaction_reference || null,
        payment_date: parsed.invoice_date,
        notes: parsed.notes || null,
      });
      if (paymentError) throw paymentError;
    }

    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function deleteInvoiceAction(invoiceId: string): Promise<ActionResult> {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
    if (error) throw error;
    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

// ---------------------------------------------------------------
// Settings
// ---------------------------------------------------------------

export async function saveSettingsAction(
  input: SettingsFormValues
): Promise<ActionResult> {
  try {
    const parsed = settingsSchema.parse(input);
    const supabase = await getSupabase();

    const entries: { key: string; value: string }[] = [
      { key: "school_name", value: parsed.school_name },
      { key: "school_address", value: parsed.school_address },
      { key: "school_phone", value: parsed.school_phone },
      { key: "school_email", value: parsed.school_email },
      { key: "school_website", value: parsed.school_website },
      { key: "school_logo", value: parsed.school_logo },
      { key: "invoice_prefix", value: parsed.invoice_prefix },
      { key: "invoice_start", value: String(parsed.invoice_start ?? 1) },
      { key: "currency", value: parsed.currency },
      { key: "invoice_footer", value: parsed.invoice_footer },
    ];

    const { error } = await supabase.from("settings").upsert(entries, {
      onConflict: "key",
    });
    if (error) throw error;

    revalidatePath("/", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

// ---------------------------------------------------------------
// Auth
// ---------------------------------------------------------------

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}