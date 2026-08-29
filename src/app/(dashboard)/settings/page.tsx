import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your school information and invoice preferences."
      />
      <SettingsForm initial={settings} />
    </div>
  );
}