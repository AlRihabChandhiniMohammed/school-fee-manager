"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Pencil, Download, Printer, Trash2, Eye, Loader2 } from "lucide-react";
import type { SchoolSettings } from "@/lib/types";
import { deleteInvoiceAction } from "@/lib/actions";
import { downloadInvoicePdf, type PdfInvoiceData } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

export interface InvoiceDetailData extends Omit<PdfInvoiceData, "student"> {
  id: string;
  student: PdfInvoiceData["student"] & {
    parent_email: string | null;
    address: string | null;
  };
}

export function InvoiceActionBar({
  invoice,
  settings,
}: {
  invoice: InvoiceDetailData;
  settings: SchoolSettings;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(invoice, settings);
      toast("success", "PDF downloaded");
    } catch {
      toast("error", "Could not generate the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteInvoiceAction(invoice.id);
    setDeleting(false);
    if (result.success) {
      toast("success", `Invoice ${invoice.invoice_number} deleted`);
      router.push("/invoices");
      router.refresh();
    } else {
      toast("error", result.error);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" onClick={handleDownload} disabled={downloading}>
        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Download PDF
      </Button>
      <Link href={`/invoices/${invoice.id}/print`} target="_blank">
        <Button variant="outline">
          <Printer className="h-4 w-4" /> Print
        </Button>
      </Link>
      <Link href={`/invoices/${invoice.id}`}>
        <Button variant="outline">
          <Eye className="h-4 w-4" /> View
        </Button>
      </Link>
      <Link href={`/invoices/${invoice.id}/edit`}>
        <Button variant="outline">
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      </Link>
      <Button variant="danger" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="h-4 w-4" /> Delete
      </Button>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        confirmLabel="Delete invoice"
        message={
          <>
            Delete invoice <span className="font-semibold">{invoice.invoice_number}</span> for{" "}
            <span className="font-semibold">{invoice.student.student_name}</span>?
            <br />
            <span className="text-rose-600">
              The invoice and its payment record will be permanently removed.
            </span>
          </>
        }
      />
    </div>
  );
}