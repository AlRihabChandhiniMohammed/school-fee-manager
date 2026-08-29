import { PageHeader } from "@/components/ui/page-header";
import { StudentForm } from "@/components/students/student-form";

export const metadata = { title: "Add Student" };

export default function NewStudentPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Add Student"
        description="Register a new student along with their parent/guardian details."
      />
      <StudentForm mode="create" />
    </div>
  );
}