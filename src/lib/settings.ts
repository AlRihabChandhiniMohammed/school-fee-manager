import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { SchoolSettings } from "@/lib/types";

const NUMERIC_KEYS = ["invoice_start"];

export async function getSettings(): Promise<SchoolSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("key, value");

  if (error) return buildDefaults();

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.key, row.value);
  }

  const merged: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const [key, value] of map) {
    merged[key] = value;
  }

  const settings = {} as SchoolSettings;
  for (const [key, value] of Object.entries(merged)) {
    (settings as unknown as Record<string, unknown>)[key] = NUMERIC_KEYS.includes(key)
      ? Number(value) || 1
      : value;
  }
  return settings;
}

function buildDefaults(): SchoolSettings {
  const settings = {} as SchoolSettings;
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    (settings as unknown as Record<string, unknown>)[key] = NUMERIC_KEYS.includes(key)
      ? Number(value) || 1
      : value;
  }
  return settings;
}