import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SchoolSettings } from "@/lib/types";
import { currencyPrefix, formatNumber } from "@/lib/format";
import { formatDate, invoicePdfFilename } from "@/lib/format";
import { statusLabel } from "@/lib/utils";

export interface PdfInvoiceData {
  invoice_number: string;
  invoice_date: string;
  status: string;
  academic_year: string;
  student: {
    student_name: string;
    parent_name: string;
    parent_phone: string;
    parent_email?: string | null;
    address?: string | null;
  };
  items: { fee_type: string; description: string | null; amount: number }[];
  totals: {
    subtotal: number;
    discount: number;
    total: number;
    paid: number;
    balance: number;
  };
  notes: string | null;
}

function money(amount: number, currency: string): string {
  return `${currencyPrefix(currency)} ${formatNumber(amount)}`;
}

export async function downloadInvoicePdf(
  data: PdfInvoiceData,
  settings: SchoolSettings
): Promise<void> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  // ---------- Header ----------
  if (settings.school_logo) {
    try {
      const img = await loadImage(settings.school_logo);
      if (img) {
        doc.addImage(img, "PNG" as never, margin, y, 24, 24);
      }
    } catch {
      // ignore logo load failures
    }
  }

  const headerX = settings.school_logo ? margin + 30 : margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(30, 41, 59);
  doc.text(settings.school_name || "My School", headerX, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const infoLines = [
    settings.school_address,
    [settings.school_phone, settings.school_email].filter(Boolean).join("  •  ") || null,
    settings.school_website || null,
  ].filter(Boolean);
  let lineY = y + 10.5;
  for (const line of infoLines) {
    if (line) {
      doc.text(line as string, headerX, lineY);
      lineY += 3.8;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229);
  doc.text("INVOICE", pageWidth - margin, y + 6, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Invoice No: ${data.invoice_number}`, pageWidth - margin, y + 12, { align: "right" });
  doc.text(`Date: ${formatDate(data.invoice_date)}`, pageWidth - margin, y + 17, { align: "right" });
  doc.text(`Academic Year: ${data.academic_year}`, pageWidth - margin, y + 22, { align: "right" });

  const statusBoxW = 34;
  const statusColor =
    data.status === "paid" ? [16, 185, 129] : data.status === "partial" ? [245, 158, 11] : [244, 63, 94];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - margin - statusBoxW, y + 26, statusBoxW, 7, 1.2, 1.2, "F");
  doc.setFillColor(255, 255, 255);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text(statusLabel(data.status).toUpperCase(), pageWidth - margin - statusBoxW / 2, y + 30.6, {
    align: "center",
  });
  doc.setTextColor(30, 41, 59);

  y = lineY + 8;

  // ---------- Divider ----------
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ---------- Bill To / Student ----------
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("BILL TO", margin, y);
  doc.text("STUDENT", pageWidth / 2, y);

  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text(data.student.parent_name, margin, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Mobile: ${data.student.parent_phone}`, margin, y + 11);
  if (data.student.parent_email) {
    doc.text(data.student.parent_email, margin, y + 16);
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(data.student.student_name, pageWidth / 2, y + 6);

  y += 24;

  // ---------- Items table ----------
  autoTable(doc, {
    startY: y,
    head: [["#", "Description", "Amount"]],
    body: data.items.map((item, i) => {
      const parts = [
        item.fee_type,
        item.description ? `— ${item.description}` : null,
      ].filter(Boolean);
      return [
        String(i + 1),
        parts.join(" "),
        money(item.amount, settings.currency),
      ];
    }),
    theme: "striped",
    styles: { fontSize: 9.5, cellPadding: 4, textColor: [51, 65, 85] },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      2: { halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ---------- Summary ----------
  const summaryW = 70;
  const sumX = pageWidth - margin - summaryW;
  doc.setFontSize(9.5);
  const summaryRows: [string, number, boolean][] = [
    ["Subtotal", data.totals.subtotal, false],
    ["Discount", -data.totals.discount, false],
    ["Total Amount", data.totals.total, true],
    ["Amount Paid", -data.totals.paid, true],
  ];
  for (const [label, value, bold] of summaryRows) {
    const labelColor = label === "Total Amount" ? [30, 41, 59] : [71, 85, 105];
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text(label, sumX, y);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(
      `${value < 0 ? "− " : ""}${money(Math.abs(value), settings.currency)}`,
      sumX + summaryW,
      y,
      { align: "right" }
    );
    y += 6.5;
  }

  // Balance Due highlight
  doc.setFillColor(253, 230, 138);
  const balanceLabel = `Balance Due`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.roundedRect(sumX - 3, y - 1.5, summaryW + 6, 8, 1.5, 1.5, "F");
  doc.text(balanceLabel, sumX, y + 3.5);
  doc.text(money(data.totals.balance, settings.currency), sumX + 3 + summaryW - 3, y + 3.5, {
    align: "right",
  });
  y += 14;

  // ---------- Notes ----------
  if (data.notes) {
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(`Notes: ${data.notes}`, margin, y);
    y += 8;
  }

  // ---------- Footer / signature ----------
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  const footerY = 270;
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(
    settings.invoice_footer || "Thank you for your payment.",
    margin,
    footerY + 8
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${settings.school_name}  |  ${settings.school_phone || ""}`.trim(),
    margin,
    footerY + 14
  );

  // Authorized signature (right side)
  const sigX = pageWidth - margin;
  doc.text("Authorized Signature", sigX, footerY + 40, { align: "right" });
  doc.setDrawColor(71, 85, 105);
  doc.line(sigX - 60, footerY + 36, sigX, footerY + 36);
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.text(settings.signature_name || "Principal", sigX, footerY + 46, { align: "right" });

  // Stamp placeholder
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.4);
  doc.roundedRect(sigX - 46, footerY + 22, 30, 30, 2, 2, "S");
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.text("SCHOOL", sigX - 31, footerY + 36, { align: "center" });
  doc.text("STAMP", sigX - 31, footerY + 40.5, { align: "center" });

  doc.save(invoicePdfFilename(data.invoice_number, data.student.student_name));
}

function loadImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}