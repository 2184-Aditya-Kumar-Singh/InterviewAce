"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";

import { AuthGuard } from "@/components/AuthGuard";

import { CodingWorkspace } from "@/components/CodingWorkspace";

import { InterviewerAvatar } from "@/components/InterviewerAvatar";

import { supabase } from "@/lib/supabase";

import type {
  Difficulty,
  InterviewPlan,
  InterviewPersona,
  InterviewRound,
  JDAnalysis,
  ParsedResume,
} from "@/lib/types";

const blankResume: ParsedResume =
  {
    rawText: "",

    skills: [],

    education: [],

    projects: [],

    summary: "",
  };

const planDuration: Record<
  InterviewPlan,
  number
> = {
  FREE: 600,

  PRO: 1800,

  PREMIUM: 1800,
};

export default function InterviewPage() {
  const [resume, setResume] =
    useState<ParsedResume>(
      blankResume
    );

  const [jdText, setJdText] =
    useState("");

  const [jd, setJd] =
    useState<JDAnalysis | null>(
      null
    );

  const [difficulty, setDifficulty] =
    useState<Difficulty>(
      "Medium"
    );

  const [round, setRound] =
    useState<InterviewRound>(
      "Technical"
    );

  const [persona, setPersona] =
    useState<InterviewPersona>(
      "Friendly HR"
    );

  const [plan, setPlan] =
    useState<InterviewPlan>(
      "FREE"
    );

  const [
    secondsLeft,
    setSecondsLeft,
  ] = useState(600);

  const [loading, setLoading] =
    useState("");

  useEffect(() => {
    async function loadPlan() {
      try {
        if (!supabase) return;

        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) return;

        const { data } =
          await supabase
            .from("users")
            .select("plan")
            .eq("id", user.id)
            .single();

        if (
          data?.plan === "FREE" ||
          data?.plan === "PRO" ||
          data?.plan ===
            "PREMIUM"
        ) {
          setPlan(data.plan);

          setSecondsLeft(
            planDuration[
              data.plan
            ]
          );
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadPlan();
  }, []);

  useEffect(() => {
    const timer =
      setInterval(() => {
        setSecondsLeft((prev) =>
          prev > 0
            ? prev - 1
            : 0
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, []);

  async function parseResume(
    file: File
  ) {
    try {
      setLoading(
        "Parsing resume..."
      );

      const form =
        new FormData();

      form.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/resume/parse",
          {
            method: "POST",
            body: form,
          }
        );

      const data =
        await response.json();

      setResume({
        rawText:
          data?.resume
            ?.rawText || "",

        skills:
          data?.resume
            ?.skills || [],

        education:
          data?.resume
            ?.education || [],

        projects:
          data?.resume
            ?.projects || [],

        summary:
          data?.resume
            ?.summary || "",
      });
    } catch (err) {
      console.error(err);

      alert(
        "Could not parse resume."
      );
    } finally {
      setLoading("");
    }
  }

  async function analyzeJd() {
    try {
      setLoading(
        "Analyzing JD..."
      );

      const response =
        await fetch(
          "/api/jd/analyze",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              jdText,
              resume,
            }),
          }
        );

      const data =
        await response.json();

      setJd({
        role:
          data?.analysis?.role ||
          "Software Engineer",

        summary:
          data?.analysis
            ?.summary || "",

        matchPercent:
          data?.analysis
            ?.matchPercent || 0,

        requiredSkills:
          data?.analysis
            ?.requiredSkills ||
          [],

        missingSkills:
          data?.analysis
            ?.missingSkills ||
          [],
      });
    } catch (err) {
      console.error(err);

      alert(
        "Could not analyze JD."
      );
    } finally {
      setLoading("");
    }
  }

  const timerLabel = `${Math.floor(
    secondsLeft / 60
  )}:${String(
    secondsLeft % 60
  ).padStart(2, "0")}`;

  return (
    <AuthGuard>
      <AppShell>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          {/* LEFT */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h1 className="text-4xl font-bold">
                Interview Setup
              </h1>

              <div className="mt-8">
                <label className="mb-3 block text-lg font-medium">
                  Resume
                </label>

                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(
                    e
                  ) =>
                    e.target
                      .files?.[0] &&
                    parseResume(
                      e.target
                        .files[0]
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-4"
                />
              </div>

              <div className="mt-8">
                <label className="mb-3 block text-lg font-medium">
                  Job Description
                </label>

                <textarea
                  value={jdText}
                  onChange={(
                    e
                  ) =>
                    setJdText(
                      e.target
                        .value
                    )
                  }
                  rows={10}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 p-4"
                />
              </div>

              <button
                onClick={
                  analyzeJd
                }
                className="mt-6 rounded-xl bg-emerald-400 px-6 py-4 text-lg font-semibold text-black"
              >
                Analyze JD
              </button>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-2xl font-bold">
                Parsed Resume
              </h2>

              <textarea
                value={
                  resume?.summary ||
                  ""
                }
                onChange={(
                  e
                ) =>
                  setResume({
                    ...resume,
                    summary:
                      e.target
                        .value,
                  })
                }
                rows={5}
                className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950/70 p-4"
              />

              <div className="mt-4 text-sm text-slate-300">
                <p>
                  Skills:
                </p>

                <p className="mt-2">
                  {resume?.skills?.join(
                    ", "
                  ) ||
                    "No skills extracted."}
                </p>
              </div>

              {jd && (
                <div className="mt-6 rounded-xl bg-emerald-500/10 p-4">
                  <p className="font-semibold text-emerald-300">
                    {jd?.role} Match:
                    {" "}
                    {jd?.matchPercent}
                    %
                  </p>

                  <p className="mt-3 text-sm">
                    Required:
                    {" "}
                    {jd?.requiredSkills?.join(
                      ", "
                    )}
                  </p>

                  <p className="mt-2 text-sm">
                    Missing:
                    {" "}
                    {jd?.missingSkills?.join(
                      ", "
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <InterviewerAvatar
              persona={persona}
              speaking={false}
              listening={false}
              ttsEnabled={true}
              variant="compact"
              onToggleTts={() => {}}
            />

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-slate-400">
                    Timer
                  </p>

                  <p className="text-5xl font-bold">
                    {timerLabel}
                  </p>
                </div>

                <button className="rounded-xl bg-white px-6 py-4 text-xl font-semibold text-black">
                  Start
                </button>
              </div>

              {loading && (
                <div className="mt-6 rounded-xl bg-white/10 p-4">
                  {loading}
                </div>
              )}

              <div className="mt-8">
                <CodingWorkspace
                  initialResume={
                    resume
                  }
                  initialJd={jd}
                  initialDifficulty={
                    difficulty
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
