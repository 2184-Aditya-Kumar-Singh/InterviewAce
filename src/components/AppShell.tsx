"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Code2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { syncCurrentProfile } from "@/lib/client-profile";
import type { UserRole } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/interview", label: "Interview", icon: BriefcaseBusiness },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/coding", label: "Coding", icon: Code2 },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/admin", label: "Admin", icon: Shield },
];

export function AppShell({
  children,
  contentClassName = "",
}: {
  children: React.ReactNode;
  contentClassName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<UserRole>("user");

  useEffect(() => {
    syncCurrentProfile().then((profile) => {
      if (profile?.role) setRole(profile.role);
    });
  }, []);

  const visibleNav = useMemo(() => nav.filter((item) => item.href !== "/admin" || role === "admin"), [role]);

  async function signOut() {
    await supabase?.auth.signOut();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#14532d_0,transparent_28%),linear-gradient(135deg,#07111f,#101827_52%,#03100b)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/88 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-base font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400 text-slate-950">
              <Sparkles size={18} />
            </span>
            InterviewAce
          </Link>
          <button
            aria-label="Toggle navigation"
            onClick={() => setOpen((value) => !value)}
            className="focus-ring rounded-lg border border-white/10 p-2 text-slate-200"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {open && (
          <nav className="mt-3 grid grid-cols-2 gap-2">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    active ? "bg-emerald-400 text-slate-950" : "bg-white/5 text-slate-200"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl lg:block">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400 text-slate-950">
            <Sparkles size={20} />
          </span>
          InterviewAce
        </Link>
        <nav className="mt-10 space-y-2">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active ? "bg-emerald-400 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {role === "admin" && (
          <div className="mt-6 rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-100">
            Admin
          </div>
        )}
        <button
          onClick={signOut}
          className="focus-ring absolute bottom-5 left-5 flex w-[calc(100%-40px)] items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10"
        >
          <LogOut size={18} />
          {isSupabaseConfigured ? "Sign out" : "Exit demo"}
        </button>
      </aside>
      <main className="lg:pl-64">
        <div className={`mx-auto min-h-screen max-w-7xl px-3 py-4 sm:px-6 lg:px-8 ${contentClassName}`}>{children}</div>
      </main>
    </div>
  );
}
