import Link from "next/link";
import { Search as SearchIcon, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { SearchBox } from "@/components/search/search-box";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { round2 } from "@/lib/utils";

export const metadata = { title: "Parent Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const supabase = await createClient();
  const settings = await getSettings();
  const currency = settings.currency;

  async function search() {
    if (!q) return null;
    const escaped = q.replace(/'/g, "''");
    const { data: students } = await supabase
      .from("students")
      .select(
        "id, student_name, parent_name, parent_phone, academic_year"
      )
      .or(
        `parent_name.ilike.%${escaped}%,parent_phone.ilike.%${escaped}%,student_name.ilike.%${escaped}%`
      )
      .order("student_name", { ascending: true })
      .limit(50);

    if (!students || students.length === 0) return [];

    const ids = students.map((s) => s.id);
    const { data: invoices } = await supabase
      .from("invoices")
      .select("student_id, amount_paid, balance")
      .in("student_id", ids);

    const byStudent = new Map<string, { paid: number; pending: number }>();
    for (const inv of invoices ?? []) {
      const entry = byStudent.get(inv.student_id) ?? { paid: 0, pending: 0 };
      entry.paid = round2(entry.paid + Number(inv.amount_paid));
      entry.pending = round2(entry.pending + Number(inv.balance));
      byStudent.set(inv.student_id, entry);
    }

    return students.map((s) => ({
      ...s,
      paid: byStudent.get(s.id)?.paid ?? 0,
      pending: byStudent.get(s.id)?.pending ?? 0,
    }));
  }

  const results = await search();

  return (
    <div>
      <PageHeader
        title="Parent Search"
        description="Quickly find a parent or student and view their fee summary."
      />

      <SearchBox defaultQuery={q} />

      <div className="mt-6">
        {!q ? (
          <EmptyState
            icon={<SearchIcon className="h-7 w-7" />}
            title="Search to get started"
            description="Enter a parent's name or mobile number, or a student name."
          />
        ) : results === null ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="Could not load results"
            description="Please try again."
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="No matches found"
            description={`No student or parent matches "${q}".`}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <Table>
              <THead>
                <TR>
                  <TH>Parent</TH>
                  <TH>Phone</TH>
                  <TH>Student</TH>
                  <TH>Academic Year</TH>
                  <TH className="text-right">Total Paid</TH>
                  <TH className="text-right">Pending</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {results.map((r) => (
                  <TR key={r.id}>
                    <TD>
                      <p className="font-medium text-slate-900">{r.parent_name}</p>
                    </TD>
                    <TD>{r.parent_phone}</TD>
                    <TD>
                      <p className="font-medium text-slate-900">{r.student_name}</p>
                    </TD>
                    <TD>{r.academic_year}</TD>
                    <TD className="text-right font-medium text-emerald-600">
                      {formatCurrency(r.paid, currency)}
                    </TD>
                    <TD className="text-right">
                      {r.pending > 0 ? (
                        <span className="font-medium text-rose-600">{formatCurrency(r.pending, currency)}</span>
                      ) : (
                        <span className="text-emerald-600">Clear</span>
                      )}
                    </TD>
                    <TD className="text-right">
                      <Link href={`/students/${r.id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}