"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { AuthGuard } from "@/components/AuthGuard";
import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { supabase } from "@/lib/supabase";

type AdminStats = {
  totalUsers: number;
  paidUsers: number;
  freeUsers: number;
  interviewsCompleted: number;
  revenue: string;
  conversionRate: string;
  feedbackReports: number;
  supportMessages: number;
  activeSubscriptions: number;
};

const fallbackStats: AdminStats = {
  totalUsers: 0,
  paidUsers: 0,
  freeUsers: 0,
  interviewsCompleted: 0,
  revenue: "₹0",
  conversionRate: "0%",
  feedbackReports: 0,
  supportMessages: 0,
  activeSubscriptions: 0,
};

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>(fallbackStats);
  const [status, setStatus] = useState("Loading admin metrics...");

  useEffect(() => {
    async function loadStats() {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      const response = await fetch("/api/admin/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        setStatus("Admin metrics unavailable.");
        return;
      }
      const data = await response.json();
      setStats(data.stats);
      setStatus("Live admin metrics");
    }
    loadStats();
  }, []);

  return (
    <AuthGuard>
      <AdminGuard>
        <AppShell>
          <div className="space-y-5">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-emerald-200">Admin panel</p>
                  <h1 className="mt-2 text-3xl font-semibold">Platform overview</h1>
                  <p className="mt-2 text-sm text-slate-300">{status}</p>
                </div>
                <span className="w-fit rounded-full bg-emerald-400 px-3 py-1 text-sm font-bold text-slate-950">
                  Admin
                </span>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              <MetricCard label="Total users" value={String(stats.totalUsers)} detail="All signed-up accounts" />
              <MetricCard label="Paid users" value={String(stats.paidUsers)} detail="Pro + Premium subscribers" />
              <MetricCard label="Free users" value={String(stats.freeUsers)} detail="Free plan accounts" />
              <MetricCard label="Completed interviews" value={String(stats.interviewsCompleted)} detail="Ended sessions" />
              <MetricCard label="Revenue" value={stats.revenue} detail="Placeholder until Razorpay is live" />
              <MetricCard label="Conversion rate" value={stats.conversionRate} detail="Paid users / total users" />
              <MetricCard label="Feedback reports" value={String(stats.feedbackReports)} detail="Generated reports" />
              <MetricCard label="Active subscriptions" value={String(stats.activeSubscriptions)} detail="Current active plans" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Support messages" value={stats.supportMessages} note="Ready for support inbox integration." />
              <Panel title="Feedback reports" value={stats.feedbackReports} note="Connect report quality feedback here." />
            </div>
          </div>
        </AppShell>
      </AdminGuard>
    </AuthGuard>
  );
}

function Panel({ title, value, note }: { title: string; value: number; note: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/70 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{note}</p>
    </div>
  );
}
