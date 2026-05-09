"use client";

import { supabase } from "@/lib/supabase";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  Code2,
  Mic,
  MicOff,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";

import { AuthGuard } from "@/components/AuthGuard";

import { CodingWorkspace } from "@/components/CodingWorkspace";

import { InterviewerAvatar } from "@/components/InterviewerAvatar";

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

const planRank: Record<
  InterviewPlan,
  number
> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 2,
};

const planDuration: Record<
  InterviewPlan,
  number
> = {
  FREE: 600,
  PRO: 1800,
  PREMIUM: 1800,
};

function getSavedPlan(): InterviewPlan {
  return "FREE";
}

type SpeechRecognitionLike =
  {
    lang: string;

    interimResults: boolean;

    continuous: boolean;

    onstart:
      | (() => void)
      | null;

    onend:
      | (() => void)
      | null;

    onerror:
      | (() => void)
      | null;

    onresult:
      | ((
          event: {
            results: ArrayLike<
              ArrayLike<{
                transcript: string;
              }>
            >;
          }
        ) => void)
      | null;

    start: () => void;

    stop: () => void;
  };

export default function InterviewPage() {
  const router = useRouter();

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
      () => getSavedPlan()
    );

  const [
    subscribedPlan,
    setSubscribedPlan,
  ] =
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

  const [question, setQuestion] =
    useState<InterviewQuestion | null>(
      null
    );

  const [answer, setAnswer] =
    useState("");

  const [
    codeAnswer,
    setCodeAnswer,
  ] = useState("");

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
  ] = useState(600);

  const [loading, setLoading] =
    useState("");

  const [ttsEnabled, setTtsEnabled] =
    useState(true);

  const [speaking, setSpeaking] =
    useState(false);

  const [listening, setListening] =
    useState(false);

  const recognitionRef =
    useRef<SpeechRecognitionLike | null>(
      null
    );

  const premiumVoiceOnly =
    plan === "PREMIUM";

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
          setPlan(
            data.plan as InterviewPlan
          );

          setSubscribedPlan(
            data.plan as InterviewPlan
          );

          setSecondsLeft(
            planDuration[
              data.plan as InterviewPlan
            ]
          );
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadPlan();
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
    data?.analysis?.summary ||
    "",

  matchPercent:
    data?.analysis
      ?.matchPercent || 0,

  requiredSkills:
    data?.analysis
      ?.requiredSkills || [],

  missingSkills:
    data?.analysis
      ?.missingSkills || [],
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

  return (
    <AuthGuard>
      <AppShell>
        <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
          <section className="space-y-5">
            <div className="glass rounded-lg p-4 sm:p-5">
              <h1 className="text-2xl font-semibold">
                Interview Setup
              </h1>

              <label className="mt-5 block text-sm text-slate-300">
                Resume
              </label>

              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(
                  event
                ) =>
                  event
                    .target
                    .files?.[0] &&
                  parseResume(
                    event.target
                      .files[0]
                  )
                }
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
              />

              <label className="mt-5 block text-sm text-slate-300">
                Job Description
              </label>

              <textarea
                value={jdText}
                onChange={(
                  event
                ) =>
                  setJdText(
                    event.target
                      .value
                  )
                }
                rows={7}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm text-white"
              />

              <button
                onClick={
                  analyzeJd
                }
                className="mt-5 rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950"
              >
                Analyze JD
              </button>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <h2 className="font-semibold">
                Parsed Resume
              </h2>

              <textarea
                value={
                  resume?.summary ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  setResume({
                    ...resume,
                    summary:
                      event.target
                        .value,
                  })
                }
                rows={4}
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm"
              />

              <p className="mt-3 text-sm text-slate-300">
                Skills:{" "}
                {resume?.skills?.join(
                  ", "
                ) ||
                  "No skills extracted."}
              </p>

              {jd && (
                <div className="mt-4 rounded-lg bg-emerald-400/10 p-4 text-sm text-emerald-50">
                  <p className="font-semibold">
                    {jd?.role ||
                      "Role"}{" "}
                    match:{" "}
                    {jd?.matchPercent ||
                      0}
                    %
                  </p>

                  <p className="mt-1">
                    Required:{" "}
                    {jd?.requiredSkills?.join(
                      ", "
                    ) ||
                      "None"}
                  </p>

                  <p className="mt-1">
                    Missing:{" "}
                    {jd?.missingSkills?.join(
                      ", "
                    ) ||
                      "No major gaps"}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <InterviewerAvatar
              persona={persona}
              speaking={speaking}
              listening={listening}
              ttsEnabled={
                ttsEnabled
              }
              variant="compact"
              onToggleTts={() =>
                setTtsEnabled(
                  (v) => !v
                )
              }
            />

            <div className="glass rounded-lg p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Timer
                  </p>

                  <p className="text-3xl font-semibold">
                    {Math.floor(
                      secondsLeft /
                        60
                    )}
                    :
                    {String(
                      secondsLeft %
                        60
                    ).padStart(
                      2,
                      "0"
                    )}
                  </p>
                </div>

                <button
                  disabled={!jd}
                  className="rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 disabled:opacity-40"
                >
                  Start
                </button>
              </div>

              {loading && (
                <p className="mt-5 rounded-lg bg-white/10 p-3 text-sm text-slate-200">
                  {loading}
                </p>
              )}

              <div className="mt-6">
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
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
