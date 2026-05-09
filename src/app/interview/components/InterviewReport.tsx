"use client";

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
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            AI Interview Report
          </p>

          <h2 className="mt-2 text-5xl font-black">
            Overall Score
          </h2>
        </div>

        <div className="rounded-3xl bg-emerald-400 px-8 py-6 text-center text-slate-950">
          <p className="text-sm font-semibold">
            FINAL SCORE
          </p>

          <h2 className="text-6xl font-black">
            {
              report.overallScore
            }
          </h2>
        </div>
      </div>

      {/* METRICS */}
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Technical"
          value={
            report.technicalScore
          }
        />

        <Metric
          title="Communication"
          value={
            report.communicationScore
          }
        />

        <Metric
          title="Confidence"
          value={
            report.confidenceEstimate
          }
        />

        <Metric
          title="Resume Match"
          value={
            report.resumeAlignmentScore
          }
        />
      </div>

      {/* FREE */}
      <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h3 className="text-2xl font-bold">
          Strengths
        </h3>

        <ul className="mt-5 space-y-3 text-slate-300">
          {report.strengths.map(
            (item) => (
              <li
                key={item}
                className="rounded-xl border border-emerald-400/10 bg-emerald-500/5 p-4"
              >
                {item}
              </li>
            )
          )}
        </ul>
      </div>

      {/* PRO */}
      {(pro || premium) && (
        <>
          <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h3 className="text-2xl font-bold">
              Weaknesses
            </h3>

            <ul className="mt-5 space-y-3 text-slate-300">
              {report.weaknesses.map(
                (item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-rose-400/10 bg-rose-500/5 p-4"
                  >
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h3 className="text-2xl font-bold">
              Focus Areas
            </h3>

            <div className="mt-5 flex flex-wrap gap-3">
              {report.focusAreas.map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-300"
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
          <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h3 className="text-2xl font-bold">
              Resume Improvements
            </h3>

            <ul className="mt-5 space-y-3 text-slate-300">
              {report.resumeAdditions.map(
                (item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-sky-400/10 bg-sky-500/5 p-4"
                  >
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h3 className="text-2xl font-bold">
              7-Day Roadmap
            </h3>

            <div className="mt-6 space-y-4">
              {report.roadmap.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={item}
                    className="flex gap-4 rounded-xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-400 font-black text-slate-950">
                      {index + 1}
                    </div>

                    <p className="text-slate-300">
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
  title,
  value,
}: {
  title: string;

  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <h3 className="mt-3 text-5xl font-black">
        {value}
      </h3>
    </div>
  );
}
