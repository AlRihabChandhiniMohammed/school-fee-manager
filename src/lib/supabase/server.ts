import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/config";

export async function createClient() {
  const { url, anonKey, configured } = getSupabaseEnv();

  if (!configured) {
    // Supabase not configured: send the user to the login page which
    // explains how to set it up, instead of crashing.
    redirect("/login");
  }

  const cookieStore = await cookies();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component - safe to ignore
            // when middleware is refreshing sessions.
          }
        },
      },
    }
  );
}

export async function getUserOrRedirect() {
  if (!getSupabaseEnv().configured) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}