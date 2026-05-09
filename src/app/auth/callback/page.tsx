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
        const url = new URL(window.location.href);

        if (url.searchParams.get("error")) {
          router.replace(
            `/auth?error=${encodeURIComponent(
              url.searchParams.get(
                "error_description"
              ) || "Sign in failed"
            )}`
          );
          return;
        }

        if (url.searchParams.get("code")) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(
              window.location.href
            );

          if (exchangeError) {
            router.replace(
              `/auth?error=${encodeURIComponent(
                exchangeError.message
              )}`
            );
            return;
          }
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );

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

        // CREATE USER PROFILE
        await supabase.from("profiles").upsert({
          id: session.user.id,
          email: session.user.email,
        });

        const profile = await syncCurrentProfile();

        if (profile?.role === "admin") {
          router.replace("/admin");
          return;
        }

        router.replace("/dashboard");
      } catch (err) {
        router.replace(
          "/auth?error=Authentication%20failed"
        );
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
