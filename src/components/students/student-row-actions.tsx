"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { deleteStudentAction } from "@/lib/actions";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export function StudentRowActions({
  id,
  studentName,
}: {
  id: string;
  studentName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteStudentAction(id);
    setLoading(false);
    if (result.success) {
      toast("success", `Student ${studentName} deleted`);
      setConfirmOpen(false);
      router.refresh();
    } else {
      toast("error", result.error);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/students/${id}`}
        title="View profile"
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <Link
        href={`/students/${id}/edit`}
        title="Edit"
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        onClick={() => setConfirmOpen(true)}
        title="Delete"
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
        confirmLabel="Delete student"
        message={
          <>
            Delete <span className="font-semibold">{studentName}</span>?
            <br />
            <span className="text-rose-600">
              All invoices and payment records for this student will also be permanently deleted.
            </span>
          </>
        }
      />
    </div>
  );
}