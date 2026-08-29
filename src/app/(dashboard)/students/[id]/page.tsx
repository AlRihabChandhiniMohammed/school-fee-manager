import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  User,
  Phone,
  GraduationCap,
  Pencil,
  FilePlus2,
  Mail,
  MapPin,
  BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { InvoiceQuickActions } from "@/components/invoice/invoice-quick-actions";
import { StudentDeleteButton } from "@/components/students/student-delete-button";
import { formatCurrency, formatDate } from "@/lib/format";
import { round2 } from "@/lib/utils";
import type { StudentInvoiceRow } from "@/lib/types";

export const metadata = { title: "Student Profile" };

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const settings = await getSettings();
  const currency = settings.currency;

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!student) notFound();

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, invoice_date, academic_year, amount_paid, balance, status, total_amount, items:invoice_items(fee_type, amount)"
    )
    .eq("student_id", id)
    .order("invoice_date", { ascending: false })
    .returns<StudentInvoiceRow[]>();

  const { data: studentCourses } = await supabase
    .from("student_courses")
    .select("course_id, courses(name)")
    .eq("student_id", id)
    .order("course_id", { ascending: true })
    .returns<{ course_id: string; courses: { name: string } | null }[]>();

  const totalFees = round2((invoices ?? []).reduce((s, inv) => s + Number(inv.total_amount), 0));
  const totalPaid = round2((invoices ?? []).reduce((s, inv) => s + Number(inv.amount_paid), 0));
  const totalPending = round2(totalFees - totalPaid);

  return (
    <div>
      <PageHeader
        title={student.student_name}
        description={`Student ID: ${student.student_id} • Registered ${formatDate(student.created_at)}`}
        actions={
          <>
            <Link href={`/invoices/new?student=${student.id}`}>
              <Button variant="success">
                <FilePlus2 className="h-4 w-4" /> Generate Invoice
              </Button>
            </Link>
            <Link href={`/students/${id}/edit`}>
              <Button variant="outline">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </Link>
            <StudentDeleteButton
              id={id}
              studentName={student.student_name}
              studentId={student.student_id}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Student & parent info */}
        <Card className="lg:row-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Student Information
            </h2>
          </div>
          <div className="space-y-3 px-5 py-5 text-sm">
            <InfoRow icon={<User className="h-4 w-4" />} label="Student">
              <span className="font-medium text-slate-900">{student.student_name}</span>
            </InfoRow>
            <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Class">
              Class {student.class}
              {student.section ? ` - ${student.section}` : ""}
            </InfoRow>
            <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Academic Year">
              {student.academic_year}
            </InfoRow>
            {studentCourses && studentCourses.length > 0 && (
              <InfoRow icon={<BookOpen className="h-4 w-4" />} label="Courses Taken">
                <div className="flex flex-wrap gap-1">
                  {studentCourses.map((sc) => (
                    <span
                      key={sc.course_id}
                      className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                    >
                      {sc.courses?.name}
                    </span>
                  ))}
                </div>
              </InfoRow>
            )}
            {student.gender && (
              <InfoRow icon={<User className="h-4 w-4" />} label="Gender">
                {student.gender}
              </InfoRow>
            )}
            {student.dob && (
              <InfoRow icon={<User className="h-4 w-4" />} label="Date of Birth">
                {formatDate(student.dob)}
              </InfoRow>
            )}

            <div className="my-2 border-t border-slate-100" />
            <InfoRow icon={<User className="h-4 w-4" />} label="Parent / Guardian">
              <span className="font-medium text-slate-900">{student.parent_name}</span>
            </InfoRow>
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone">
              {student.parent_phone}
            </InfoRow>
            {student.parent_email && (
              <InfoRow icon={<Mail className="h-4 w-4" />} label="Email">
                {student.parent_email}
              </InfoRow>
            )}
            {student.address && (
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address">
                {student.address}
              </InfoRow>
            )}
          </div>
        </Card>

        {/* Fee summary */}
        <Card className="lg:col-span-2">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Fee Summary</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <SummaryBox label="Total Fees" value={formatCurrency(totalFees, currency)} tone="text-slate-900" />
            <SummaryBox label="Total Paid" value={formatCurrency(totalPaid, currency)} tone="text-emerald-600" />
            <SummaryBox label="Total Pending" value={formatCurrency(totalPending, currency)} tone="text-rose-600" />
          </div>
        </Card>

        {/* Payment history */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Payment History</h2>
            <Link href={`/invoices?student=${student.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>

          {error || !invoices || invoices.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              description="Generate an invoice for this student to start tracking payments."
              action={
                <Link href={`/invoices/new?student=${student.id}`}>
                  <Button variant="success">Generate an invoice</Button>
                </Link>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <Table>
                <THead>
                  <TR>
                    <TH>Invoice</TH>
                    <TH>Date</TH>
                    <TH>Fee</TH>
                    <TH className="text-right">Paid</TH>
                    <TH className="text-right">Balance</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Actions</TH>
                  </TR>
                </THead>
                <TBody>
                  {invoices.map((inv) => (
                    <TR key={inv.id}>
                      <TD>
                        <Link href={`/invoices/${inv.id}`} className="font-semibold text-indigo-600 hover:text-indigo-700">
                          {inv.invoice_number}
                        </Link>
                      </TD>
                      <TD>{formatDate(inv.invoice_date)}</TD>
                      <TD>
                        <p className="max-w-[160px] truncate font-medium text-slate-900">
                          {(inv.items ?? []).map((it) => it.fee_type).join(", ")}
                        </p>
                      </TD>
                      <TD className="text-right font-medium text-emerald-600">
                        {formatCurrency(Number(inv.amount_paid), currency)}
                      </TD>
                      <TD className="text-right">
                        {Number(inv.balance) > 0 ? (
                          <span className="font-medium text-rose-600">
                            {formatCurrency(Number(inv.balance), currency)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TD>
                      <TD>
                        <StatusBadge status={inv.status} />
                      </TD>
                      <TD className="text-right">
                        <InvoiceQuickActions
                          invoiceId={inv.id}
                          settings={settings}
                        />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <div className="break-words text-sm text-slate-700">{children}</div>
      </div>
    </div>
  );
}

function SummaryBox({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1.5 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}