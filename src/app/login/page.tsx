import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign in | School Fee Invoice Manager",
};

export default async function LoginPage() {
  const { configured } = getSupabaseEnv();

  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50 px-4 py-12">
      <LoginForm configured={configured} />
    </div>
  );
}