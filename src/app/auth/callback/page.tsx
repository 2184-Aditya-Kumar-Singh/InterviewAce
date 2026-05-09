"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { syncCurrentProfile } from "@/lib/client-profile";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function finishAuth() {
      if (!supabase) {
        router.replace(
          "/auth?error=Authentication%20service%20unavailable"
        );
        return;
      }

      try {
        // Handle OAuth/code exchange if present
        const url = new URL(window.location.href);

        if (url.searchParams.get("error")) {
          router.replace(
            `/auth?error=${encodeURIComponent(
              url.searchParams.get("error_description") ||
                "Sign in failed"
            )}`
          );
          return;
        }

        if (url.searchParams.get("code")) {
          await supabase.auth.exchangeCodeForSession(
            window.location.href
          );
        }

        // Give Supabase time to store session
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Get current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          router.replace(
            "/auth?error=Session%20was%20not%20created"
          );
          return;
        }

        // Sync profile
        const profile = await syncCurrentProfile();

        if (profile?.role === "admin") {
          router.replace("/admin");
          return;
        }

        router.replace("/dashboard");
      } catch (err) {
        router.replace("/auth?error=Authentication%20failed");
      }
    }

    finishAuth();
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-center text-slate-200">
      <div>
        <p className="text-sm text-emerald-200">
          InterviewAce
        </p>

        <h1 className="mt-2 text-2xl font-semibold">
          Signing you in...
        </h1>
      </div>
    </main>
  );
}
