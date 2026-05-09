"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(() =>
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("error") || "",
  );
  const [loading, setLoading] = useState(false);

  async function googleLogin() {
    if (!supabase) return router.push("/dashboard");
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      setMessage(
        error.message.includes("provider is not enabled")
          ? "Google login is not enabled in Supabase yet. Enable the Google provider in Supabase Authentication > Providers."
          : error.message,
      );
      setLoading(false);
      return;
    }
    if (data.url) window.location.assign(data.url);
  }

  async function emailOtpLogin() {
    setLoading(true);
    setMessage("");
    if (!supabase) {
      router.push("/dashboard");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    setMessage(error ? error.message : "Check your email for the login link.");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#0f766e,transparent_34%),linear-gradient(135deg,#07111f,#101827)] px-4">
      <div className="glass w-full max-w-md rounded-lg p-6">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400 text-slate-950">
            <Sparkles size={20} />
          </span>
          InterviewAce
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Start your mock interview</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Persistent sessions are handled by Supabase Auth when configured. Without keys, this runs in local demo mode.
        </p>
        <button
          onClick={googleLogin}
          disabled={loading}
          className="focus-ring mt-6 w-full rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 hover:bg-slate-100 disabled:opacity-60"
        >
          Continue with Google
        </button>
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>
        <label className="text-sm text-slate-300" htmlFor="email">Email OTP login</label>
        <div className="mt-2 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3">
            <Mail size={18} className="text-slate-400" />
            <input
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="focus-ring w-full bg-transparent py-3 text-sm text-white placeholder:text-slate-500"
            />
          </div>
          <button
            onClick={emailOtpLogin}
            disabled={loading || (!email && isSupabaseConfigured)}
            className="focus-ring rounded-lg bg-emerald-400 px-4 font-semibold text-slate-950 disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {message && <p className="mt-4 rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</p>}
      </div>
    </main>
  );
}
