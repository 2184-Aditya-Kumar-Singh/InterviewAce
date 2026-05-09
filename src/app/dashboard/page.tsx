"use client";

import Link from "next/link";
import { ArrowRight, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { MetricCard } from "@/components/MetricCard";

import { plans } from "@/lib/plans";
import { supabase } from "@/lib/supabase";

import type { InterviewPlan } from "@/lib/types";

type DashboardStats = {
  interviewsTaken: number;
  latestScore: number;
};

export default function DashboardPage() {
  const [currentPlan, setCurrentPlan] =
    useState<InterviewPlan>("FREE");

  const [stats, setStats] =
    useState<DashboardStats>({
      interviewsTaken: 0,
      latestScore: 0,
    });

  useEffect(() => {
    async function loadPlan() {
      try {
        if (!supabase) return;

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data } = await supabase
          .from("users")
          .select("plan")
          .eq("id", user.id)
          .single();

        if (
          data?.plan === "FREE" ||
          data?.plan === "PRO" ||
          data?.plan === "PREMIUM"
        ) {
          setCurrentPlan(data.plan);
        }
      } catch (err) {
        console.error(err);
      }
    }

    async function loadStats() {
      try {
        if (!supabase) return;

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const reportsKey =
          `interviewace:reports:${user.id}`;

        const reports = JSON.parse(
          window.localStorage.getItem(
            reportsKey
          ) || "[]"
        );

        const interviewsTaken =
          reports.length;

        const latestScore =
          reports.length > 0
            ? reports[0]?.report
                ?.overallScore || 0
            : 0;

        setStats({
          interviewsTaken,
          latestScore,
        });
      } catch (err) {
        console.error(err);
      }
    }

    loadPlan();
    loadStats();
  }, []);

  return (
    <AuthGuard>
      <AppShell>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-emerald-200">
                Current plan:{" "}
                {plans[currentPlan].name}
              </p>

              <h1 className="mt-2 text-3xl font-semibold">
                Practice workspace
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Upload your resume, paste a
                job description, and run AI
                mock interviews.
              </p>
            </div>

            <Link
              href="/interview"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950"
            >
              Start interview
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label="Interviews taken"
              value={String(
                stats.interviewsTaken
              )}
              detail="Completed sessions."
            />

            <MetricCard
              label="Latest score"
              value={
                stats.latestScore
                  ? String(
                      stats.latestScore
                    )
                  : "--"
              }
              detail="Latest interview score."
            />

            <MetricCard
              label="Current plan"
              value={currentPlan}
              detail="Your active subscription."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <div className="glass rounded-lg p-6">
              <div className="flex items-center gap-3">
                <UploadCloud className="text-emerald-300" />

                <h2 className="text-xl font-semibold">
                  Resume pipeline
                </h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Upload resume and start
                personalized AI interviews.
              </p>

              <Link
                href="/interview"
                className="mt-5 inline-flex rounded-lg border border-white/10 px-4 py-2 text-sm"
              >
                Upload resume
              </Link>
            </div>

            <div className="grid gap-4">
              {(
                ["PRO", "PREMIUM"] as const
              ).map((key) => (
                <div
                  key={key}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-sm text-slate-400">
                    Upgrade
                  </p>

                  <h3 className="mt-1 text-lg font-semibold">
                    {plans[key].name} -{" "}
                    {plans[key].price}
                  </h3>

                  <p className="mt-2 text-sm text-slate-300">
                    {
                      plans[key]
                        .description
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
