"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { settingsSchema, type SettingsFormInput, type SettingsFormValues } from "@/lib/validation";
import { saveSettingsAction } from "@/lib/actions";
import type { SchoolSettings } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { useToast } from "@/components/ui/toast";
import { CURRENCIES } from "@/lib/constants";

export function SettingsForm({ initial }: { initial: SchoolSettings }) {
  const router = useRouter();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormInput>({
    resolver: zodResolver(settingsSchema),
    mode: "onBlur",
    defaultValues: {
      school_name: initial.school_name,
      school_address: initial.school_address,
      school_phone: initial.school_phone,
      school_email: initial.school_email,
      school_website: initial.school_website,
      school_logo: initial.school_logo,
      invoice_prefix: initial.invoice_prefix,
      invoice_start: initial.invoice_start ?? 1,
      currency: initial.currency,
      invoice_footer: initial.invoice_footer,
      signature_name: initial.signature_name,
    },
  });

  const logoUrl = watch("school_logo");

  async function onSubmit(values: SettingsFormInput) {
    const parsed = settingsSchema.parse(values) as SettingsFormValues;
    const result = await saveSettingsAction(parsed);
    if (result.success) {
      toast("success", "Settings saved successfully");
      router.refresh();
    } else {
      toast("error", result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-base font-semibold text-slate-900">School Information</h2>
        <p className="mb-5 text-sm text-slate-500">
          Used on every generated invoice.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="school_name">School Name *</Label>
            <Input id="school_name" placeholder="e.g. Greenfield International School" {...register("school_name")} />
            <FieldError message={errors.school_name?.message} />
          </div>
          <div>
            <Label htmlFor="school_logo">School Logo URL</Label>
            <Input id="school_logo" placeholder="https://example.com/logo.png" {...register("school_logo")} />
            <FieldError message={errors.school_logo?.message} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="school_address">Address</Label>
            <Textarea id="school_address" placeholder="Street, City, State, PIN" {...register("school_address")} />
            <FieldError message={errors.school_address?.message} />
          </div>
          <div>
            <Label htmlFor="school_phone">Phone</Label>
            <Input id="school_phone" placeholder="+91 98765 43210" {...register("school_phone")} />
            <FieldError message={errors.school_phone?.message} />
          </div>
          <div>
            <Label htmlFor="school_email">Email</Label>
            <Input id="school_email" type="email" placeholder="office@school.com" {...register("school_email")} />
            <FieldError message={errors.school_email?.message} />
          </div>
          <div>
            <Label htmlFor="school_website">Website</Label>
            <Input id="school_website" placeholder="https://school.com" {...register("school_website")} />
            <FieldError message={errors.school_website?.message} />
          </div>
          <div className="flex items-end">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo preview" className="h-16 w-16 rounded-lg object-contain ring-1 ring-slate-200" />
            ) : (
              <p className="pb-2 text-xs text-slate-400">Logo appears in the invoice header when set.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Invoice Settings</h2>
        <p className="mb-5 text-sm text-slate-500">
          Controls how invoice numbers and the invoice document are generated.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
            <Input id="invoice_prefix" placeholder="INV" {...register("invoice_prefix")} />
            <FieldError message={errors.invoice_prefix?.message} />
            <p className="mt-1 text-xs text-slate-400">
              Result: {watch("invoice_prefix") || "INV"}-2026-0001
            </p>
          </div>
          <div>
            <Label htmlFor="invoice_start">Starting Invoice Number</Label>
            <Input id="invoice_start" type="number" min="1" {...register("invoice_start")} />
            <FieldError message={errors.invoice_start?.message} />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select id="currency" {...register("currency")}>
              {CURRENCIES.map((c) => (
                <option key={`${c.code}-${c.label}`} value={c.code}>
                  {c.label} ({c.symbol})
                </option>
              ))}
            </Select>
            <FieldError message={errors.currency?.message} />
          </div>
          <div>
            <Label htmlFor="signature_name">Authorized Signature Name</Label>
            <Input id="signature_name" placeholder="e.g. Principal" {...register("signature_name")} />
            <FieldError message={errors.signature_name?.message} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="invoice_footer">Invoice Footer Message</Label>
            <Input id="invoice_footer" placeholder="Thank you for your payment." {...register("invoice_footer")} />
            <FieldError message={errors.invoice_footer?.message} />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
}