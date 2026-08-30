export const FEE_TYPES = [
  "Tuition Fee",
  "Admission Fee",
  "Exam Fee",
  "Transport Fee",
  "Library Fee",
  "Laboratory Fee",
  "Activity Fee",
  "Other Fee",
] as const;

export const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Card",
  "Cheque",
  "Other",
] as const;

export const PAYMENT_STATUSES = ["paid", "partial", "pending"] as const;

export const GENDERS = ["Male", "Female", "Other"] as const;

export const CURRENCIES = [
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", label: "Saudi Riyal", symbol: "﷼" },
  { code: "PKR", label: "Pakistani Rupee", symbol: "₨" },
  { code: "BDT", label: "Bangladeshi Taka", symbol: "৳" },
  { code: "LKR", label: "Sri Lankan Rupee", symbol: "₨" },
  { code: "NPR", label: "Nepalese Rupee", symbol: "₨" },
] as const;

export const DEFAULT_SETTINGS: Record<string, string> = {
  school_name: "Edu Alt Tech",
  school_address: "",
  school_phone: "",
  school_email: "",
  school_website: "",
  school_logo: "",
  invoice_prefix: "INV",
  invoice_start: "1",
  currency: "INR",
  invoice_footer: "Thank you for your payment.",
};

export const ACADEMIC_YEARS = [
  "2026-2027",
  "2025-2026",
  "2024-2025",
  "2023-2024",
] as const;