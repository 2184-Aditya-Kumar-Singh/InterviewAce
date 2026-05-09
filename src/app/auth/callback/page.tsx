"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function finishAuth() {
      try {
        // Check Supabase
        if (!supabase) {
          router.replace(
            "/auth?error=Authentication%20service%20unavailable"
          );
          return;
        }

        const url = new URL(window.location.href);

        // Handle auth errors
        if (url.searchParams.get("error")) {
          router.replace(
            `/auth?error=${encodeURIComponent(
              url.searchParams.get(
                "error_description"
              ) || "Authentication failed"
            )}`
          );
          return;
        }

        // Handle OAuth login
        if (url.searchParams.get("code")) {
          const {
            error: exchangeError,
          } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          );

          if (exchangeError) {
            console.error(exchangeError);

            router.replace(
              `/auth?error=${encodeURIComponent(
                exchangeError.message
              )}`
            );

            return;
          }
        }

        // Give Supabase time to restore session
        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );

        // Get session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          console.error(sessionError);

          router.replace(
            "/auth?error=Session%20not%20created"
          );

          return;
        }

        // CREATE / UPDATE USER PROFILE
        const { error: profileError } =
          await supabase
            .from("profiles")
            .upsert({
              id: session.user.id,
              email: session.user.email,
            });

        if (profileError) {
          console.error(
            "Profile insert failed:",
            profileError
          );
        }

        // Redirect
        router.replace("/dashboard");
      } catch (err) {
        console.error(err);

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

        <p className="mt-3 text-sm text-slate-400">
          Please wait while we prepare your
          dashboard.
        </p>
      </div>
    </main>
  );
}
