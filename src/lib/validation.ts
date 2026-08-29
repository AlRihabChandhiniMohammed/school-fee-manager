import { z } from "zod";
import { FEE_TYPES } from "@/lib/constants";

export const studentSchema = z.object({
  student_id: z.string().trim().min(1, "Student ID is required"),
  student_name: z.string().trim().min(1, "Student name is required"),
  parent_name: z.string().trim().min(1, "Parent/guardian name is required"),
  parent_phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[+\d\s-]{7,20}$/, "Enter a valid phone number"),
  parent_email: z
    .union([z.string().trim().email("Enter a valid email"), z.literal("")])
    .optional()
    .default(""),
  address: z.string().trim().optional().default(""),
  class: z.string().trim().min(1, "Class is required"),
  section: z.string().trim().optional().default(""),
  academic_year: z.string().trim().min(1, "Academic year is required"),
  dob: z.union([z.string(), z.literal("")]).optional().default(""),
  gender: z.union([z.string(), z.literal("")]).optional().default(""),
  course_ids: z.array(z.string()).optional().default([]),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

export const courseSchema = z.object({
  name: z.string().trim().min(1, "Course name is required"),
  code: z.string().trim().optional().default(""),
});

export type CourseFormValues = z.output<typeof courseSchema>;
export type CourseFormInput = z.input<typeof courseSchema>;

const feeItemSchema = z.object({
  fee_type: z
    .string()
    .trim()
    .min(1, "Fee type is required")
    .refine(
      (value) => !value || FEE_TYPES.some((f) => f.toLowerCase() === value.toLowerCase()),
      { message: "Select a valid fee type" }
    ),
  description: z.string().trim().optional().default(""),
  amount: z.coerce
    .number({ message: "Amount must be a number" })
    .min(0.01, "Amount must be greater than 0"),
});

export const invoiceSchema = z
  .object({
    student_id: z.string().min(1, "Select a student"),
    invoice_date: z.string().min(1, "Invoice date is required"),
    academic_year: z.string().trim().min(1, "Academic year is required"),
    items: z
      .array(feeItemSchema)
      .min(1, "Add at least one fee item")
      .max(100),
    discount: z.coerce.number().min(0, "Discount cannot be negative"),
    previous_due: z.coerce.number().min(0, "Previous due cannot be negative"),
    amount_paid: z.coerce.number().min(0, "Amount paid cannot be negative"),
    payment_method: z.string().optional().default(""),
    transaction_reference: z.string().trim().optional().default(""),
    notes: z.string().trim().optional().default(""),
  })
  .superRefine((data, ctx) => {
    const subtotal = data.items.reduce((s, it) => s + it.amount, 0);
    const total = subtotal - data.discount + data.previous_due;
    if (data.discount > subtotal) {
      ctx.addIssue({
        code: "custom",
        path: ["discount"],
        message: "Discount cannot exceed subtotal",
      });
    }
    if (total < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount_paid"],
        message: "Total amount cannot be negative",
      });
    }
    if (data.amount_paid > total) {
      ctx.addIssue({
        code: "custom",
        path: ["amount_paid"],
        message: `Amount paid cannot exceed total amount`,
      });
    }
    if (data.amount_paid > 0 && !data.payment_method) {
      ctx.addIssue({
        code: "custom",
        path: ["payment_method"],
        message: "Select a payment method when recording a payment",
      });
    }
  });

export type InvoiceFormValues = z.output<typeof invoiceSchema>;
export type InvoiceFormInput = z.input<typeof invoiceSchema>;

export const settingsSchema = z.object({
  school_name: z.string().trim().min(1, "School name is required"),
  school_address: z.string().trim().optional().default(""),
  school_phone: z.string().trim().optional().default(""),
  school_email: z
    .union([z.string().trim().email("Enter a valid email"), z.literal("")])
    .optional()
    .default(""),
  school_website: z.string().trim().optional().default(""),
  school_logo: z.string().trim().optional().default(""),
  invoice_prefix: z
    .string()
    .trim()
    .min(1, "Invoice prefix is required")
    .regex(/^[A-Za-z-]+$/, "Prefix can contain letters and dashes only"),
  invoice_start: z.coerce.number().int().min(1, "Must be at least 1").optional(),
  currency: z.string().trim().min(1, "Currency is required"),
  invoice_footer: z.string().trim().optional().default(""),
  signature_name: z.string().trim().optional().default(""),
});

export type SettingsFormValues = z.output<typeof settingsSchema>;
export type SettingsFormInput = z.input<typeof settingsSchema>;
export type StudentFormInput = z.input<typeof studentSchema>;