import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StudentForm } from "@/components/students/student-form";

export const metadata = { title: "Add Student" };

export default async function NewStudentPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, code, created_at")
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Add Student"
        description="Register a new student along with their parent/guardian details."
      />
      <StudentForm mode="create" courses={courses ?? []} />
    </div>
  );
}