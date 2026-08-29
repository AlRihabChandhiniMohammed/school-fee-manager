export interface Student {
  id: string;
  student_id: string;
  student_name: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  address: string | null;
  class: string;
  section: string;
  academic_year: string;
  dob: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export type InvoiceStatus = "paid" | "partial" | "pending";

export interface Invoice {
  id: string;
  invoice_number: string;
  student_id: string;
  invoice_date: string;
  academic_year: string;
  subtotal: number;
  discount: number;
  previous_due: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_method: string | null;
  transaction_reference: string | null;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  fee_type: string;
  description: string | null;
  amount: number;
}

export interface Payment {
  id: string;
  invoice_id: string;
  student_id: string;
  amount: number;
  payment_method: string | null;
  transaction_reference: string | null;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export interface InvoiceWithRelations extends Invoice {
  student: Pick<
    Student,
    | "student_id"
    | "student_name"
    | "parent_name"
    | "parent_phone"
    | "parent_email"
    | "class"
    | "section"
    | "academic_year"
    | "address"
  >;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface StudentSummary extends Student {
  total_fees: number;
  total_paid: number;
  total_pending: number;
  invoice_count: number;
}

export interface SchoolSettings {
  school_name: string;
  school_address: string;
  school_phone: string;
  school_email: string;
  school_website: string;
  school_logo: string;
  invoice_prefix: string;
  invoice_start: number;
  currency: string;
  invoice_footer: string;
  signature_name: string;
}

export interface SchoolSettingsInput {
  school_name: string;
  school_address: string;
  school_phone: string;
  school_email: string;
  school_website: string;
  school_logo: string;
  invoice_prefix: string;
  invoice_start: number | null;
  currency: string;
  invoice_footer: string;
  signature_name: string;
}

export interface NewInvoiceInput {
  student_id: string;
  invoice_date: string;
  academic_year: string;
  items: { fee_type: string; description: string; amount: number }[];
  discount: number;
  previous_due: number;
  amount_paid: number;
  payment_method: string;
  transaction_reference: string;
  notes: string;
}

export interface ReportRow {
  invoice_number: string;
  invoice_id: string;
  student_id: string;
  student_name: string;
  parent_name: string;
  parent_phone: string;
  class: string;
  section: string;
  academic_year: string;
  invoice_date: string;
  payment_method: string | null;
  subtotal: number;
  discount: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: InvoiceStatus;
}

export interface InvoiceStudent {
  id: string;
  student_id: string;
  student_name: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  address: string | null;
  class: string;
  section: string;
  academic_year: string;
}

export interface InvoiceWithStudent extends Invoice {
  student: InvoiceStudent | null;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface StudentInvoiceRow {
  id: string;
  invoice_number: string;
  invoice_date: string;
  academic_year: string;
  amount_paid: number;
  balance: number;
  status: InvoiceStatus;
  total_amount: number;
  items: { fee_type: string; amount: number }[];
}

export interface FeeLedgerRow {
  id: string;
  fee_type: string;
  description: string | null;
  amount: number;
  invoice: {
    id: string;
    invoice_number: string;
    invoice_date: string;
    academic_year: string;
    total_amount: number;
    amount_paid: number;
    balance: number;
    status: string;
    student: {
      id: string;
      student_name: string;
      class: string;
      section: string;
    } | null;
  } | null;
}

export interface ReportRowInput {
  id: string;
  invoice_number: string;
  invoice_date: string;
  academic_year: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: InvoiceStatus;
  payment_method: string | null;
  student:
    | {
        student_id: string;
        student_name: string;
        parent_name: string;
        parent_phone: string;
        class: string;
        section: string;
      }
    | null;
}