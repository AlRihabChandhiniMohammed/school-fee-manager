"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { courseSchema, type CourseFormValues } from "@/lib/validation";
import { createCourseAction } from "@/lib/actions";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { FieldError } from "@/components/ui/field-error";

export function CourseForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = courseSchema.safeParse({ name, code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid course name");
      return;
    }
    const values = parsed.data as CourseFormValues;

    setLoading(true);
    const result = await createCourseAction(values);
    setLoading(false);

    if (result.success) {
      toast("success", `Course "${name}" added`);
      setName("");
      setCode("");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Course name (e.g. Mathematics)"
        />
        <FieldError message={error ?? undefined} />
      </div>
      <div className="sm:w-40">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (e.g. MATH)" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Add Course
      </Button>
    </form>
  );
}