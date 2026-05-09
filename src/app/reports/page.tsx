"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarDays, Download, Flame, Sparkles, Target, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import type { InterviewAnswer, InterviewReport } from "@/lib/types";

type StoredReport = {
  id?: string;
  report: InterviewReport;
  answers: InterviewAnswer[];
  difficulty: string;
  role: string;
  createdAt: string;
};

const fallback: StoredReport = {
  role: "Frontend Developer",
  difficulty: "Medium",
  createdAt: new Date().toISOString(),
  answers: [],
    report: {
    overallScore: 78,
    technicalScore: 74,
    codingScore: 62,
    resumeAlignmentScore: 68,
    communicationScore: 82,
    confidenceEstimate: 76,
    answerReviews: [],
    strengths: [
      "Your examples connect well to the target role.",
      "You can explain project context in a recruiter-friendly way.",
      "You show strong learning velocity for fresher roles.",
    ],
    weaknesses: [
      "Add more metrics to prove project impact.",
      "Prepare deeper technical follow-ups for priority skills.",
      "Reduce filler and use a tighter answer structure.",
    ],
    resumeAdditions: [
      "Add project bullets that directly mention the JD's required technical skills.",
      "Add measurable outcomes for your strongest project.",
    ],
    resumeRemovals: [
      "Remove generic soft-skill claims that are not backed by evidence.",
      "Remove unrelated tools that do not support this target role.",
    ],
    focusAreas: [
      "Role-specific technical depth",
      "Coding implementation and complexity explanation",
      "Resume alignment with JD keywords",
    ],
    roadmap: [
      "Day 1: Record a 90-second resume pitch.",
      "Day 2: Rewrite two project stories with measurable outcomes.",
      "Day 3: Practice one weak JD skill with notes.",
      "Day 4: Explain a technical trade-off out loud.",
      "Day 5: Run a timed mock interview.",
      "Day 6: Review communication clarity.",
      "Day 7: Repeat hard-mode questions.",
    ],
  },
};

export default function ReportsPage() {
  const [history] = useState<StoredReport[]>(() => {
    if (typeof window === "undefined") return [];
    return JSON.parse(window.localStorage.getItem("interviewace:reports") || "[]") as StoredReport[];
  });
  const [data] = useState<StoredReport>(() => {
    if (typeof window === "undefined") return fallback;
    const raw = window.sessionStorage.getItem("interviewace:last-report");
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as StoredReport;
    return { ...parsed, report: { ...fallback.report, ...parsed.report } };
  });

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
                  A recruiter-style summary of your technical depth, communication clarity, confidence, and a focused
                  seven-day improvement plan.
                </p>
                <div className="mt-5 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white/70 px-3 py-1">{data.difficulty} mode</span>
                  <span className="rounded-full bg-white/70 px-3 py-1">
                    {new Date(data.createdAt).toLocaleDateString()}
                  </span>
                  <span className="rounded-full bg-white/70 px-3 py-1">{data.answers.length || 3} answers reviewed</span>
                </div>
              </div>
              <div className="rounded-lg bg-slate-950 p-5 text-white">
                <p className="text-sm text-slate-400">Overall score</p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-7xl font-semibold">{report.overallScore}</span>
                  <span className="pb-3 text-slate-400">/100</span>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${report.overallScore}%` }} />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {report.overallScore >= 80
                    ? "Strong interview readiness. Polish proof points and role-specific depth."
                    : "Solid base. A week of focused practice can noticeably lift your score."}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-xl font-semibold">Past interview reports</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(history.length ? history : [data]).map((item, index) => (
                <button
                  key={item.id || `${item.createdAt}-${index}`}
                  onClick={() => {
                    window.sessionStorage.setItem("interviewace:last-report", JSON.stringify(item));
                    window.location.reload();
                  }}
                  className="rounded-lg border border-white/10 bg-slate-950/70 p-4 text-left hover:bg-white/10"
                >
                  <p className="text-sm text-emerald-200">{item.role}</p>
                  <p className="mt-2 text-3xl font-semibold">{item.report.overallScore}/100</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.difficulty} | {new Date(item.createdAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <ScoreCard icon={Target} label="Technical" score={report.technicalScore} />
            <ScoreCard icon={BadgeCheck} label="Coding" score={report.codingScore} />
            <ScoreCard icon={Flame} label="Resume alignment" score={report.resumeAlignmentScore} />
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <ScoreCard icon={BadgeCheck} label="Communication" score={report.communicationScore} />
            <ScoreCard icon={Flame} label="Confidence" score={report.confidenceEstimate} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Strengths" items={report.strengths} tone="emerald" />
            <Panel title="Weaknesses" items={report.weaknesses} tone="amber" />
          </section>

          {!!report.answerReviews.length && (
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <h2 className="text-xl font-semibold">Answer correctness review</h2>
              <div className="mt-4 space-y-3">
                {report.answerReviews.map((item, index) => (
                  <div key={`${item.question}-${index}`} className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-emerald-100">Question {index + 1}: {item.verdict}</p>
                      <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-sm">{item.score}/100</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.question}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{item.feedback}</p>
                    {!!item.missingSignals.length && (
                      <p className="mt-2 text-sm text-amber-200">Missing: {item.missingSignals.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 lg:grid-cols-2">
            <Panel title="Add to resume as per JD" items={report.resumeAdditions} tone="emerald" />
            <Panel title="Remove or reduce from resume" items={report.resumeRemovals} tone="amber" />
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Target className="text-emerald-300" />
              <h2 className="text-xl font-semibold">Focus areas to get selected</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {report.focusAreas.map((item) => (
                <span key={item} className="rounded-full bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-100">
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-emerald-300" />
              <h2 className="text-xl font-semibold">7 day improvement roadmap</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {report.roadmap.map((item, index) => (
                <div key={item} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Day {index + 1}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{item.replace(/^Day \d+:\s*/, "")}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/interview" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 font-semibold text-slate-950">
              Practice again
              <ArrowRight size={18} />
            </Link>
            <Link href="/coding" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-5 py-3 font-semibold text-white">
              Try coding round
              <TrendingUp size={18} />
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-5 py-3 font-semibold text-white"
            >
              Download PDF
              <Download size={18} />
            </button>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function ScoreCard({ icon: Icon, label, score }: { icon: typeof Target; label: string; score: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/70 p-5">
      <Icon className="text-emerald-300" />
      <p className="mt-4 text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-4xl font-semibold">{score}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function Panel({ title, items, tone }: { title: string; items: string[]; tone: "emerald" | "amber" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded-lg bg-slate-950/70 p-4 text-sm leading-6 text-slate-200">
            <span className={`mr-2 inline-block h-2 w-2 rounded-full ${tone === "emerald" ? "bg-emerald-300" : "bg-amber-300"}`} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
