"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, BookOpen } from "lucide-react";
import { studentSchema, type StudentFormInput, type StudentFormValues } from "@/lib/validation";
import { createStudentAction, updateStudentAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { useToast } from "@/components/ui/toast";
import { CourseMultiSelect } from "@/components/courses/course-multi-select";
import { CLASSES, ACADEMIC_YEARS, GENDERS } from "@/lib/constants";
import type { Course } from "@/lib/types";

export function StudentForm({
  mode,
  studentId,
  initialValues,
  courses,
}: {
  mode: "create" | "edit";
  studentId?: string;
  initialValues?: StudentFormValues;
  courses: Course[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentSchema),
    mode: "onBlur",
    defaultValues: initialValues ?? {
      student_id: "",
      student_name: "",
      parent_name: "",
      parent_phone: "",
      parent_email: "",
      address: "",
      class: "",
      section: "",
      academic_year: "2026-2027",
      dob: "",
      gender: "",
      course_ids: [],
    },
  });

  const courseIds = watch("course_ids") ?? [];

  function handleCoursesChange(ids: string[]) {
    setValue("course_ids", ids, { shouldDirty: true, shouldValidate: true });
  }

  async function onSubmit(values: StudentFormInput) {
    const parsed = studentSchema.parse(values) as StudentFormValues;
    const result =
      mode === "create"
        ? await createStudentAction(parsed)
        : await updateStudentAction(studentId!, parsed);

    if (result.success) {
      toast("success", mode === "create" ? "Student added successfully" : "Student updated");
      router.refresh();
      if (mode === "create") {
        router.push("/students");
      } else {
        router.push(`/students/${studentId}`);
      }
    } else {
      toast("error", result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Student Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="student_id">Student ID *</Label>
            <Input id="student_id" placeholder="e.g. STU-2026-001" {...register("student_id")} />
            <FieldError message={errors.student_id?.message} />
          </div>
          <div className="lg:col-span-2">
            <Label htmlFor="student_name">Student Name *</Label>
            <Input id="student_name" placeholder="Full name" {...register("student_name")} />
            <FieldError message={errors.student_name?.message} />
          </div>
          <div>
            <Label htmlFor="class">Class *</Label>
            <Input
              id="class"
              list="classes-list"
              placeholder="e.g. 8"
              {...register("class")}
            />
            <datalist id="classes-list">
              {CLASSES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <FieldError message={errors.class?.message} />
          </div>
          <div>
            <Label htmlFor="section">Grade / Section</Label>
            <Input id="section" placeholder="e.g. A" {...register("section")} />
            <FieldError message={errors.section?.message} />
          </div>
          <div>
            <Label htmlFor="academic_year">Academic Year *</Label>
            <Input
              id="academic_year"
              list="years-list"
              placeholder="e.g. 2026-2027"
              {...register("academic_year")}
            />
            <datalist id="years-list">
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y} />
              ))}
            </datalist>
            <FieldError message={errors.academic_year?.message} />
          </div>
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input id="dob" type="date" {...register("dob")} />
            <FieldError message={errors.dob?.message} />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select id="gender" {...register("gender")}>
              <option value="">Select</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            <FieldError message={errors.gender?.message} />
          </div>
        </div>

        <h3 className="mb-3 mt-6 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <BookOpen className="h-4 w-4 text-indigo-500" /> Courses Taken
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <CourseMultiSelect
              courses={courses}
              value={courseIds}
              onChange={handleCoursesChange}
            />
            <FieldError message={errors.course_ids?.message?.toString()} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Parent / Guardian Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="parent_name">Parent / Guardian Name *</Label>
            <Input id="parent_name" placeholder="Full name" {...register("parent_name")} />
            <FieldError message={errors.parent_name?.message} />
          </div>
          <div>
            <Label htmlFor="parent_phone">Mobile Number *</Label>
            <Input
              id="parent_phone"
              type="tel"
              placeholder="e.g. 9876543210"
              {...register("parent_phone")}
            />
            <FieldError message={errors.parent_phone?.message} />
          </div>
          <div>
            <Label htmlFor="parent_email">Email</Label>
            <Input id="parent_email" type="email" placeholder="parent@email.com" {...register("parent_email")} />
            <FieldError message={errors.parent_email?.message} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" placeholder="Full address" {...register("address")} />
            <FieldError message={errors.address?.message} />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Link href={mode === "edit" && studentId ? `/students/${studentId}` : "/students"}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "create" ? "Save Student" : "Update Student"}
        </Button>
      </div>
    </form>
  );
}