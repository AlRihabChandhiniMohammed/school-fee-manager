import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { CourseForm } from "@/components/courses/course-form";
import { CourseDeleteButton } from "@/components/courses/course-delete-button";
import { formatDate } from "@/lib/format";
import type { Course } from "@/lib/types";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, code, created_at")
    .order("name", { ascending: true });

  const courseList = (courses ?? []) as Course[];

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Add the subjects students can take. They appear as a dropdown when adding students."
      />

      <Card className="mb-5">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Add New Course
          </h2>
        </div>
        <div className="p-5">
          <CourseForm />
        </div>
      </Card>

      {courseList.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" />}
          title="No courses yet"
          description="Add your first course above — e.g. Mathematics, English, Science. It will show as a dropdown in the student form."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <THead>
              <TR>
                <TH>Course</TH>
                <TH>Code</TH>
                <TH>Added</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {courseList.map((course) => (
                <TR key={course.id}>
                  <TD className="font-semibold text-slate-900">{course.name}</TD>
                  <TD>{course.code || "—"}</TD>
                  <TD>{formatDate(course.created_at)}</TD>
                  <TD className="text-right">
                    <CourseDeleteButton id={course.id} name={course.name} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}

      <p className="mt-4 text-sm text-slate-500">
        Tip: courses are linked to students on the{" "}
        <Link href="/students" className="font-medium text-indigo-600 hover:text-indigo-700">
          student registration
        </Link>{" "}
        page.
      </p>
    </div>
  );
}