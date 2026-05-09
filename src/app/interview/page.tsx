"use client";

import {
  useEffect,
  useState,
} from "react";

import { AppShell } from "@/components/AppShell";

import { AuthGuard } from "@/components/AuthGuard";

import { supabase } from "@/lib/supabase";

type StoredReport = {
  id: string;

  created_at: string;

  report: {
    overallScore: number;

    technicalScore: number;

    codingScore: number;

    communicationScore: number;

    confidenceEstimate: number;

    strengths: string[];

    weaknesses: string[];

    roadmap: string[];
  };
};

export default function ReportsPage() {
  const [reports, setReports] =
    useState<
      StoredReport[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) return;

      const { data, error } =
        await supabase
          .from(
            "interview_reports"
          )
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (error)
        throw error;

      setReports(
        data || []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="mx-auto max-w-6xl">
          {/* HEADER */}
          <div className="mb-10">
            <h1 className="text-5xl font-black">
              Interview Reports
            </h1>

            <p className="mt-3 text-lg text-slate-400">
              View your
              previous mock
              interview
              performances and
              improvement
              roadmap.
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-10 text-center text-lg text-slate-300">
              Loading reports...
            </div>
          )}

          {/* EMPTY */}
          {!loading &&
            reports.length ===
              0 && (
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-12 text-center">
                <h2 className="text-3xl font-black">
                  No Reports Yet
                </h2>

                <p className="mt-4 text-slate-400">
                  Complete an
                  interview to
                  generate your
                  first report.
                </p>
              </div>
            )}

          {/* REPORTS */}
          <div className="grid gap-6">
            {reports.map(
              (item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-slate-950/70 p-8"
                >
                  {/* TOP */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-3xl font-black">
                        Overall Score:{" "}
                        {
                          item
                            .report
                            .overallScore
                        }
                        %
                      </h2>

                      <p className="mt-2 text-slate-400">
                        {new Date(
                          item.created_at
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div
                      className={`rounded-full px-5 py-2 text-sm font-black ${
                        item.report
                          .overallScore >=
                        75
                          ? "bg-emerald-400/10 text-emerald-300"
                          : item
                                .report
                                .overallScore >=
                              50
                          ? "bg-yellow-400/10 text-yellow-300"
                          : "bg-rose-400/10 text-rose-300"
                      }`}
                    >
                      {item.report
                        .overallScore >=
                      75
                        ? "Strong Performance"
                        : item
                              .report
                              .overallScore >=
                            50
                        ? "Average Performance"
                        : "Needs Improvement"}
                    </div>
                  </div>

                  {/* SCORES */}
                  <div className="mt-8 grid gap-4 md:grid-cols-4">
                    <ScoreCard
                      title="Technical"
                      value={
                        item.report
                          .technicalScore
                      }
                    />

                    <ScoreCard
                      title="Coding"
                      value={
                        item.report
                          .codingScore
                      }
                    />

                    <ScoreCard
                      title="Communication"
                      value={
                        item.report
                          .communicationScore
                      }
                    />

                    <ScoreCard
                      title="Confidence"
                      value={
                        item.report
                          .confidenceEstimate
                      }
                    />
                  </div>

                  {/* STRENGTHS */}
                  <div className="mt-8">
                    <h3 className="text-2xl font-black text-emerald-300">
                      Strengths
                    </h3>

                    <ul className="mt-4 space-y-3 text-slate-300">
                      {item.report.strengths.map(
                        (
                          strength
                        ) => (
                          <li
                            key={
                              strength
                            }
                          >
                            •{" "}
                            {
                              strength
                            }
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* WEAKNESSES */}
                  <div className="mt-8">
                    <h3 className="text-2xl font-black text-rose-300">
                      Weaknesses
                    </h3>

                    <ul className="mt-4 space-y-3 text-slate-300">
                      {item.report.weaknesses.map(
                        (
                          weakness
                        ) => (
                          <li
                            key={
                              weakness
                            }
                          >
                            •{" "}
                            {
                              weakness
                            }
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* ROADMAP */}
                  <div className="mt-8">
                    <h3 className="text-2xl font-black text-sky-300">
                      Improvement
                      Roadmap
                    </h3>

                    <ul className="mt-4 space-y-3 text-slate-300">
                      {item.report.roadmap.map(
                        (
                          step
                        ) => (
                          <li
                            key={step}
                          >
                            • {step}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function ScoreCard({
  title,

  value,
}: {
  title: string;

  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <h2 className="mt-3 text-4xl font-black">
        {value}%
      </h2>
    </div>
  );
}
