"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteCourseAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export function CourseDeleteButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteCourseAction(id);
    setLoading(false);
    if (result.success) {
      toast("success", `Course "${name}" deleted`);
      router.refresh();
    } else {
      toast("error", result.error);
      setOpen(false);
    }
  }

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" /> Delete
      </Button>
      <ConfirmDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
        confirmLabel="Delete course"
        message={
          <>
            Delete course <span className="font-semibold">{name}</span>?
            <br />
            <span className="text-rose-600">
              Students taking this course will no longer be linked to it.
            </span>
          </>
        }
      />
    </>
  );
}