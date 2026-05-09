"use client";

import {
  BadgeCheck,
  Brain,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import type {
  InterviewPlan,
  InterviewReport as ReportType,
} from "@/lib/types";

type Props = {
  report:
    | ReportType
    | null;

  plan: InterviewPlan;
};

export function InterviewReport({
  report,

  plan,
}: Props) {
  if (!report) return null;

  const premium =
    plan === "PREMIUM";

  const pro =
    plan === "PRO";

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
            <Sparkles
              size={16}
            />
            AI Interview Analysis
          </div>

          <h2 className="mt-5 text-5xl font-black">
            Final Report
          </h2>

          <p className="mt-3 max-w-2xl text-slate-400">
            Recruiter-style
            evaluation of your
            interview
            performance,
            technical depth,
            communication, and
            overall readiness.
          </p>
        </div>

        {/* SCORE */}
        <div className="rounded-3xl bg-emerald-400 px-10 py-7 text-center text-slate-950 shadow-2xl shadow-emerald-400/20">
          <p className="text-sm font-black">
            OVERALL SCORE
          </p>

          <h2 className="mt-2 text-7xl font-black">
            {
              report.overallScore
            }
          </h2>

          <p className="mt-2 text-sm font-semibold">
            /100
          </p>
        </div>
      </div>

      {/* METRICS */}
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={
            <Brain
              size={20}
            />
          }
          title="Technical"
          value={
            report.technicalScore
          }
        />

        <Metric
          icon={
            <TrendingUp
              size={20}
            />
          }
          title="Communication"
          value={
            report.communicationScore
          }
        />

        <Metric
          icon={
            <Flame
              size={20}
            />
          }
          title="Confidence"
          value={
            report.confidenceEstimate
          }
        />

        <Metric
          icon={
            <Target
              size={20}
            />
          }
          title="Resume Match"
          value={
            report.resumeAlignmentScore
          }
        />
      </div>

      {/* ANSWER REVIEWS */}
      <div className="mt-12">
        <h3 className="text-3xl font-black">
          Answer Analysis
        </h3>

        <div className="mt-6 space-y-5">
          {report.answerReviews.map(
            (
              item,
              index
            ) => (
              <div
                key={`${item.question}-${index}`}
                className="rounded-3xl border border-white/10 bg-slate-900/60 p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-4xl">
                    <p className="text-sm text-slate-500">
                      Question
                    </p>

                    <h4 className="mt-2 text-xl font-bold leading-8">
                      {
                        item.question
                      }
                    </h4>
                  </div>

                  <div
                    className={`rounded-full px-5 py-2 text-sm font-black ${
                      item.score >=
                      80
                        ? "bg-emerald-400/10 text-emerald-300"
                        : item.score >=
                          55
                        ? "bg-yellow-400/10 text-yellow-300"
                        : "bg-rose-400/10 text-rose-300"
                    }`}
                  >
                    {
                      item.verdict
                    }{" "}
                    •{" "}
                    {
                      item.score
                    }
                    /100
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5">
                  <p className="text-sm text-slate-500">
                    Your Answer
                  </p>

                  <p className="mt-3 whitespace-pre-wrap leading-8 text-slate-300">
                    {
                      item.answer
                    }
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                  <p className="text-sm text-slate-500">
                    AI Feedback
                  </p>

                  <p className="mt-3 leading-8 text-slate-300">
                    {
                      item.feedback
                    }
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* STRENGTHS */}
      <div className="mt-12 rounded-3xl border border-emerald-400/10 bg-emerald-400/5 p-6">
        <div className="flex items-center gap-3">
          <BadgeCheck className="text-emerald-300" />

          <h3 className="text-3xl font-black text-emerald-300">
            Strengths
          </h3>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {report.strengths.map(
            (item) => (
              <div
                key={item}
                className="rounded-2xl border border-emerald-400/10 bg-black/20 p-5"
              >
                {item}
              </div>
            )
          )}
        </div>
      </div>

      {/* PRO + PREMIUM */}
      {(pro || premium) && (
        <>
          <div className="mt-10 rounded-3xl border border-rose-400/10 bg-rose-400/5 p-6">
            <h3 className="text-3xl font-black text-rose-300">
              Weaknesses
            </h3>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {report.weaknesses.map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-rose-400/10 bg-black/20 p-5"
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-amber-400/10 bg-amber-400/5 p-6">
            <h3 className="text-3xl font-black text-amber-300">
              Focus Areas
            </h3>

            <div className="mt-6 flex flex-wrap gap-3">
              {report.focusAreas.map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-amber-400/10 bg-black/20 px-5 py-3 text-sm"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </div>
        </>
      )}

      {/* PREMIUM */}
      {premium && (
        <>
          <div className="mt-10 rounded-3xl border border-sky-400/10 bg-sky-400/5 p-6">
            <h3 className="text-3xl font-black text-sky-300">
              Resume Improvements
            </h3>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {report.resumeAdditions.map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-sky-400/10 bg-black/20 p-5"
                  >
                    {item}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <h3 className="text-3xl font-black">
              7-Day Improvement Roadmap
            </h3>

            <div className="mt-8 space-y-5">
              {report.roadmap.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={item}
                    className="flex gap-5 rounded-2xl border border-white/10 bg-black/20 p-5"
                  >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-400 text-lg font-black text-slate-950">
                      {index + 1}
                    </div>

                    <p className="leading-8 text-slate-300">
                      {item}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({
  icon,

  title,

  value,
}: {
  icon: React.ReactNode;

  title: string;

  value: number;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {title}
        </p>

        <div className="text-emerald-300">
          {icon}
        </div>
      </div>

      <h3 className="mt-5 text-5xl font-black">
        {value}
      </h3>
    </div>
  );
}
