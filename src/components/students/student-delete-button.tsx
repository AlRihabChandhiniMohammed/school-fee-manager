"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteStudentAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export function StudentDeleteButton({
  id,
  studentName,
  studentId,
}: {
  id: string;
  studentName: string;
  studentId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteStudentAction(id);
    setLoading(false);
    if (result.success) {
      toast("success", "Student deleted");
      router.push("/students");
      router.refresh();
    } else {
      toast("error", result.error);
      setOpen(false);
    }
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" /> Delete
      </Button>
      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
        confirmLabel="Delete student"
        message={
          <>
            Delete <span className="font-semibold">{studentName}</span> (ID: {studentId})?
            <br />
            <span className="text-rose-600">
              All invoices and payment records for this student will also be permanently deleted.
            </span>
          </>
        }
      />
    </>
  );
}