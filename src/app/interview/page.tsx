"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { InterviewerAvatar } from "@/components/InterviewerAvatar";
import { InterviewCodingRound } from "./InterviewCodingRound";

import { supabase } from "@/lib/supabase";

import {
  generateQuestion,
  createInterviewReport,
} from "@/lib/interview-engine";

import type {
  Difficulty,
  InterviewAnswer,
  InterviewPlan,
  InterviewPersona,
  InterviewQuestion,
  InterviewReport,
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
  FREE: 900,
  PRO: 1800,
  PREMIUM: 2700,
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

  const [plan, setPlan] =
    useState<InterviewPlan>(
      "FREE"
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

  const [loading, setLoading] =
    useState("");

  const [
    interviewStarted,
    setInterviewStarted,
  ] = useState(false);

  const [question, setQuestion] =
    useState<InterviewQuestion | null>(
      null
    );

  const [answer, setAnswer] =
    useState("");

  const [answers, setAnswers] =
    useState<
      InterviewAnswer[]
    >([]);

  const [report, setReport] =
    useState<InterviewReport | null>(
      null
    );

  const [
    secondsLeft,
    setSecondsLeft,
  ] = useState(1800);

  const [
    showCoding,
    setShowCoding,
  ] = useState(false);

  const [
    codingSolved,
    setCodingSolved,
  ] = useState(false);

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
          const userPlan =
            data.plan as InterviewPlan;

          setPlan(userPlan);

          setSecondsLeft(
            planDuration[userPlan]
          );
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadPlan();
  }, []);

  useEffect(() => {
    if (!interviewStarted)
      return;

    const timer =
      setInterval(() => {
        setSecondsLeft(
          (prev) =>
            prev > 0
              ? prev - 1
              : 0
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [interviewStarted]);

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

  async function startInterview() {
    if (!jd) {
      alert(
        "Please analyze JD first."
      );

      return;
    }

    setInterviewStarted(true);

    const firstQuestion =
      await generateQuestion({
        resume,
        jd,
        difficulty,
        round,
        persona,
        plan,
        asked: [],
      });

    setQuestion(firstQuestion);
  }

  async function submitAnswer() {
    if (!question) return;

    const nextAnswers = [
      ...answers,

      {
        question:
          question.question,

        answer,

        round:
          question.round,

        expectedSignals:
          question.expectedSignals,
      },
    ];

    setAnswers(nextAnswers);

    setAnswer("");

    if (
      round !== "HR" &&
      Math.random() > 0.65 &&
      !codingSolved
    ) {
      setShowCoding(true);

      setSecondsLeft(600);

      return;
    }

    const nextQuestion =
      await generateQuestion({
        resume,
        jd,
        difficulty,
        round,
        persona,
        plan,
        asked:
          nextAnswers.map(
            (a) => a.question
          ),
      });

    setQuestion(nextQuestion);
  }

  async function finishInterview() {
    const generatedReport =
      await createInterviewReport({
        answers,
        difficulty,
        jd:
          jd || undefined,
        resume,
      });

    setReport(
      generatedReport
    );
  }

  async function handleCodingSolved() {
    setShowCoding(false);

    setCodingSolved(true);

    setSecondsLeft(
      planDuration[plan]
    );

    const nextQuestion =
      await generateQuestion({
        resume,
        jd:
          jd as JDAnalysis,
        difficulty,
        round,
        persona,
        plan,
        asked:
          answers.map(
            (a) => a.question
          ),
      });

    setQuestion(nextQuestion);
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

              {/* Resume */}
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

              {/* JD */}
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
                  rows={8}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 p-4"
                />
              </div>

              {/* PLAN */}
              <div className="mt-8">
                <label className="mb-3 block text-lg font-medium">
                  Plan
                </label>

                <select
                  value={plan}
                  onChange={(
                    e
                  ) =>
                    setPlan(
                      e.target
                        .value as InterviewPlan
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <option value="FREE">
                    FREE
                  </option>

                  <option value="PRO">
                    PRO
                  </option>

                  <option value="PREMIUM">
                    PREMIUM
                  </option>
                </select>
              </div>

              {/* ROUND */}
              <div className="mt-8">
                <label className="mb-3 block text-lg font-medium">
                  Interview Type
                </label>

                <select
                  value={round}
                  onChange={(
                    e
                  ) =>
                    setRound(
                      e.target
                        .value as InterviewRound
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <option value="Technical">
                    Technical
                  </option>

                  <option value="HR">
                    HR
                  </option>

                  <option value="Mixed">
                    Mixed
                  </option>
                </select>
              </div>

              {/* PERSONA */}
              <div className="mt-8">
                <label className="mb-3 block text-lg font-medium">
                  Interviewer
                </label>

                <select
                  value={persona}
                  onChange={(
                    e
                  ) =>
                    setPersona(
                      e.target
                        .value as InterviewPersona
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <option>
                    Strict Technical Lead
                  </option>

                  <option>
                    Senior Engineering Manager
                  </option>

                  <option>
                    Friendly HR
                  </option>

                  <option>
                    Corporate VP
                  </option>
                </select>
              </div>

              <button
                onClick={
                  analyzeJd
                }
                className="mt-8 rounded-xl bg-emerald-400 px-6 py-4 text-lg font-semibold text-black"
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
              {/* TOP */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg text-slate-400">
                    Timer
                  </p>

                  <p className="text-5xl font-bold">
                    {timerLabel}
                  </p>
                </div>

                {!interviewStarted ? (
                  <button
                    onClick={
                      startInterview
                    }
                    className="rounded-xl bg-white px-6 py-4 text-xl font-semibold text-black"
                  >
                    Start
                  </button>
                ) : (
                  <button
                    onClick={
                      finishInterview
                    }
                    className="rounded-xl bg-red-500 px-6 py-4 text-xl font-semibold text-white"
                  >
                    Finish
                  </button>
                )}
              </div>

              {loading && (
                <div className="mt-6 rounded-xl bg-white/10 p-4">
                  {loading}
                </div>
              )}

              {/* QUESTION */}
              {question &&
                !showCoding && (
                  <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/70 p-6">
                    <h2 className="text-xl font-bold">
                      AI Interviewer
                    </h2>

                    <p className="mt-4 text-lg leading-8">
                      {
                        question.question
                      }
                    </p>

                    <textarea
                      value={
                        answer
                      }
                      onChange={(
                        e
                      ) =>
                        setAnswer(
                          e.target
                            .value
                        )
                      }
                      rows={6}
                      placeholder="Write your answer..."
                      className="mt-6 w-full rounded-xl border border-white/10 bg-slate-900 p-4"
                    />

                    <button
                      onClick={
                        submitAnswer
                      }
                      className="mt-6 rounded-xl bg-emerald-400 px-6 py-4 text-lg font-semibold text-black"
                    >
                      Submit Answer
                    </button>
                  </div>
                )}

              {/* CODING */}
              {showCoding && (
                <div className="mt-8 rounded-2xl border border-emerald-500 bg-slate-950 p-6">
                  <InterviewCodingRound
  resume={resume}
  jd={jd}
  difficulty={difficulty}
  onSolved={
    handleCodingSolved
  }
/>
                </div>
              )}

              {/* REPORT */}
              {report && (
                <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/70 p-6">
                  <h2 className="text-3xl font-bold">
                    Interview Report
                  </h2>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-white/5 p-4">
                      <p className="text-slate-400">
                        Overall
                      </p>

                      <p className="text-4xl font-bold">
                        {
                          report.overallScore
                        }
                        %
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 p-4">
                      <p className="text-slate-400">
                        Technical
                      </p>

                      <p className="text-4xl font-bold">
                        {
                          report.technicalScore
                        }
                        %
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 p-4">
                      <p className="text-slate-400">
                        Communication
                      </p>

                      <p className="text-4xl font-bold">
                        {
                          report.communicationScore
                        }
                        %
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 p-4">
                      <p className="text-slate-400">
                        Confidence
                      </p>

                      <p className="text-4xl font-bold">
                        {
                          report.confidenceEstimate
                        }
                        %
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
