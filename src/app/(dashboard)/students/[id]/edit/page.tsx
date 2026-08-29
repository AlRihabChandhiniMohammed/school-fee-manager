import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Course } from "@/lib/types";

export const metadata = { title: "Edit Student" };

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!student) notFound();

  const [{ data: courses }, { data: studentCourses }] = await Promise.all([
    supabase.from("courses").select("id, name, code, created_at").order("name", { ascending: true }),
    supabase.from("student_courses").select("course_id").eq("student_id", id),
  ]);

  const initialCourseIds = (studentCourses ?? []).map((sc: { course_id: string }) => sc.course_id);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Edit Student"
        description={`Update details for ${student.student_name}.`}
        actions={
          <Link href={`/students/${id}`}>
            <Button variant="outline">View Profile</Button>
          </Link>
        }
      />
      <StudentForm
        mode="edit"
        studentId={id}
        courses={(courses ?? []) as Course[]}
        initialValues={{
          student_id: student.student_id,
          student_name: student.student_name,
          parent_name: student.parent_name,
          parent_phone: student.parent_phone,
          parent_email: student.parent_email ?? "",
          address: student.address ?? "",
          class: student.class,
          section: student.section,
          academic_year: student.academic_year,
          dob: student.dob ?? "",
          gender: student.gender ?? "",
          course_ids: initialCourseIds,
        }}
      />
    </div>
  );
}