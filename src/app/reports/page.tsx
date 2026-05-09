"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Download,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import type { InterviewAnswer, InterviewReport } from "@/lib/types";

type StoredReport = {
  id?: string;
  report: InterviewReport;
  answers: InterviewAnswer[];
  difficulty: string;
  role: string;
  createdAt: string;
};

export default function ReportsPage() {
  const [history, setHistory] = useState<StoredReport[]>([]);
  const [data, setData] = useState<StoredReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const reportsKey = `interviewace:reports:${user.id}`;
        const lastReportKey = `interviewace:last-report:${user.id}`;

        const reports = JSON.parse(
          window.localStorage.getItem(reportsKey) || "[]"
        ) as StoredReport[];

        const lastReportRaw =
          window.sessionStorage.getItem(lastReportKey);

        setHistory(reports);

        if (lastReportRaw) {
          setData(JSON.parse(lastReportRaw));
        } else if (reports.length > 0) {
          setData(reports[0]);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  if (loading) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="text-center text-slate-300">
            Loading reports...
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  if (!data) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
            <h1 className="text-3xl font-semibold">
              No interview reports yet
            </h1>

            <p className="mt-3 text-slate-400">
              Complete your first mock interview to generate a
              personalized report.
            </p>

            <Link
              href="/interview"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950"
            >
              Start interview
              <ArrowRight size={18} />
            </Link>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  const { report } = data;

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-lg border border-emerald-300/20 bg-[linear-gradient(135deg,#f8fafc,#dcfce7_42%,#bbf7d0)] p-5 text-slate-950 shadow-2xl shadow-emerald-950/20 sm:p-8">
            <div className="absolute right-[-90px] top-[-120px] h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1 text-sm text-emerald-100">
                  <Sparkles size={15} />
                  Premium readiness report
                </div>

                <h1 className="mt-5 text-3xl font-semibold tracking-normal sm:text-5xl">
                  {data.role} interview scorecard
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
                  A recruiter-style summary of your technical
                  depth, communication clarity, confidence, and
                  a focused seven-day improvement plan.
                </p>

                <div className="mt-5 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white/70 px-3 py-1">
                    {data.difficulty} mode
                  </span>

                  <span className="rounded-full bg-white/70 px-3 py-1">
                    {new Date(
                      data.createdAt
                    ).toLocaleDateString()}
                  </span>

                  <span className="rounded-full bg-white/70 px-3 py-1">
                    {data.answers.length} answers reviewed
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-950 p-5 text-white">
                <p className="text-sm text-slate-400">
                  Overall score
                </p>

                <div className="mt-3 flex items-end gap-2">
                  <span className="text-7xl font-semibold">
                    {report.overallScore}
                  </span>

                  <span className="pb-3 text-slate-400">
                    /100
                  </span>
                </div>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{
                      width: `${report.overallScore}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-xl font-semibold">
              Past interview reports
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {history.map((item, index) => (
                <button
                  key={
                    item.id ||
                    `${item.createdAt}-${index}`
                  }
                  onClick={() => {
                    if (!supabase) return;

                    supabase.auth.getUser().then(({ data }) => {
                      const user = data.user;

                      if (!user) return;

                      const lastReportKey = `interviewace:last-report:${user.id}`;

                      window.sessionStorage.setItem(
                        lastReportKey,
                        JSON.stringify(item)
                      );

                      window.location.reload();
                    });
                  }}
                  className="rounded-lg border border-white/10 bg-slate-950/70 p-4 text-left hover:bg-white/10"
                >
                  <p className="text-sm text-emerald-200">
                    {item.role}
                  </p>

                  <p className="mt-2 text-3xl font-semibold">
                    {item.report.overallScore}/100
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {item.difficulty} |{" "}
                    {new Date(
                      item.createdAt
                    ).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
