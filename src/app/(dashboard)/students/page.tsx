import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StudentFilters } from "@/components/students/student-filters";
import { StudentRowActions } from "@/components/students/student-row-actions";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Students" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  const term = sp.q?.trim();
  if (term) {
    const escaped = term.replace(/'/g, "''");
    query = query.or(
      `student_name.ilike.%${escaped}%,parent_name.ilike.%${escaped}%,parent_phone.ilike.%${escaped}%`
    );
  }
  if (sp.year) query = query.eq("academic_year", sp.year);

  const { data: students, error } = await query;

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage student and parent/guardian information."
        actions={
          <Link href="/students/new">
            <Button>+ Add Student</Button>
          </Link>
        }
      />

      <StudentFilters />

      {error ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Could not load students"
          description={error.message}
        />
      ) : !students || students.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No students found"
          description={
            term || sp.year
              ? "Try adjusting your search or filters."
              : "Add your first student to start recording fee invoices."
          }
          action={
            !(term || sp.year) ? (
              <Link href="/students/new">
                <Button>+ Add Student</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <THead>
              <TR>
                <TH>Student</TH>
                <TH>Academic Year</TH>
                <TH>Parent</TH>
                <TH>Phone</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {students.map((s) => (
                <TR key={s.id}>
                  <TD>
                    <Link href={`/students/${s.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                      {s.student_name}
                    </Link>
                  </TD>
                  <TD>{s.academic_year}</TD>
                  <TD>{s.parent_name}</TD>
                  <TD>{s.parent_phone}</TD>
                  <TD className="text-right">
                    <StudentRowActions id={s.id} studentName={s.student_name} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}