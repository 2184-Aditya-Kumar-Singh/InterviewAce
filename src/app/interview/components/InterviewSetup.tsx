"use client";

import {
  Brain,
  Briefcase,
  Crown,
  FileText,
  Mic,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import type {
  Difficulty,
  InterviewPersona,
  InterviewRound,
  InterviewPlan,
  ParsedResume,
} from "@/lib/types";

type Props = {
  resumeFile: File | null;

  setResumeFile: (
    file: File | null
  ) => void;

  jdText: string;

  setJdText: (
    value: string
  ) => void;

  difficulty: Difficulty;

  setDifficulty: (
    value: Difficulty
  ) => void;

  round: InterviewRound;

  setRound: (
    value: InterviewRound
  ) => void;

  plan: InterviewPlan;

  setPlan: (
    value: InterviewPlan
  ) => void;

  persona: InterviewPersona;

  setPersona: (
    value: InterviewPersona
  ) => void;

  parsedResume:
    | ParsedResume
    | null;

  onAnalyze: () => void;

  onStart: () => void;

  loading: boolean;

  analyzing: boolean;
};

export function InterviewSetup({
  resumeFile,

  setResumeFile,

  jdText,

  setJdText,

  difficulty,

  setDifficulty,

  round,

  setRound,

  plan,

  setPlan,

  persona,

  setPersona,

  parsedResume,

  onAnalyze,

  onStart,

  loading,

  analyzing,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur-xl">
      {/* HEADER */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
          <Sparkles
            size={16}
          />
          AI Mock Interview
        </div>

        <h2 className="mt-5 text-5xl font-black leading-tight">
          Interview Setup
        </h2>

        <p className="mt-4 text-slate-400">
          Configure your AI
          interview environment
          for realistic
          recruiter-style mock
          interviews.
        </p>
      </div>

      <div className="mt-10 space-y-10">
        {/* RESUME */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3">
            <UploadCloud
              className="text-emerald-300"
              size={22}
            />

            <h3 className="text-2xl font-black">
              Resume Upload
            </h3>
          </div>

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) =>
              setResumeFile(
                e.target.files?.[0] ||
                  null
              )
            }
            className="mt-6 w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-5"
          />

          {resumeFile && (
            <div className="mt-5 rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4">
              <p className="font-semibold text-emerald-300">
                Uploaded:
              </p>

              <p className="mt-2 text-slate-300">
                {
                  resumeFile.name
                }
              </p>
            </div>
          )}

          {parsedResume && (
            <div className="mt-5 rounded-2xl border border-sky-400/10 bg-sky-400/5 p-5">
              <p className="font-semibold text-sky-300">
                Resume Summary
              </p>

              <p className="mt-3 leading-7 text-slate-300">
                {
                  parsedResume.summary
                }
              </p>
            </div>
          )}
        </div>

        {/* JD */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
          <div className="flex items-center gap-3">
            <FileText
              className="text-amber-300"
              size={22}
            />

            <h3 className="text-2xl font-black">
              Job Description
            </h3>
          </div>

          <textarea
            value={jdText}
            onChange={(e) =>
              setJdText(
                e.target.value
              )
            }
            rows={10}
            className="mt-6 w-full rounded-2xl border border-white/10 bg-slate-950 p-5 leading-7"
            placeholder="Paste the target job description here..."
          />

          <button
            onClick={onAnalyze}
            disabled={
              analyzing
            }
            className="mt-5 rounded-2xl bg-emerald-400 px-6 py-4 font-black text-slate-950 transition hover:scale-[1.02] disabled:opacity-70"
          >
            {analyzing
              ? "Analyzing JD..."
              : "Analyze Resume + JD"}
          </button>
        </div>

        {/* PLAN */}
        <div>
          <h3 className="text-3xl font-black">
            Select Plan
          </h3>

          <div className="mt-6 grid gap-5">
            <PlanCard
              title="FREE"
              active={
                plan ===
                "FREE"
              }
              icon={
                <Briefcase
                  size={24}
                />
              }
              description="Basic text interview with standard AI analysis."
              features={[
                "Text-based interview",
                "Basic report",
                "Resume matching",
              ]}
              onClick={() =>
                setPlan(
                  "FREE"
                )
              }
            />

            <PlanCard
              title="PRO"
              active={
                plan ===
                "PRO"
              }
              icon={
                <Mic
                  size={24}
                />
              }
              description="AI avatar speaks questions while you answer via text."
              features={[
                "AI speaking avatar",
                "Advanced reports",
                "Better technical analysis",
              ]}
              onClick={() =>
                setPlan(
                  "PRO"
                )
              }
            />

            <PlanCard
              title="PREMIUM"
              active={
                plan ===
                "PREMIUM"
              }
              icon={
                <Crown
                  size={24}
                />
              }
              description="Realtime voice-based interview simulation."
              features={[
                "Realtime AI interview",
                "Voice answers",
                "Recruiter-grade evaluation",
                "Advanced roadmap",
              ]}
              onClick={() =>
                setPlan(
                  "PREMIUM"
                )
              }
            />
          </div>
        </div>

        {/* SETTINGS */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* DIFFICULTY */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <Brain
                className="text-emerald-300"
                size={22}
              />

              <h3 className="text-2xl font-black">
                Difficulty
              </h3>
            </div>

            <select
              value={
                difficulty
              }
              onChange={(e) =>
                setDifficulty(
                  e.target
                    .value as Difficulty
                )
              }
              className="mt-6 w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4"
            >
              <option value="Easy">
                Easy
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Hard">
                Hard
              </option>
            </select>
          </div>

          {/* ROUND */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
            <h3 className="text-2xl font-black">
              Interview Type
            </h3>

            <select
              value={round}
              onChange={(e) =>
                setRound(
                  e.target
                    .value as InterviewRound
                )
              }
              className="mt-6 w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4"
            >
              <option value="HR">
                HR
              </option>

              <option value="Technical">
                Technical
              </option>

              <option value="Mixed">
                Mixed
              </option>
            </select>
          </div>
        </div>

        {/* PERSONA */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-6">
          <h3 className="text-2xl font-black">
            Interviewer Persona
          </h3>

          <select
            value={persona}
            onChange={(e) =>
              setPersona(
                e.target
                  .value as InterviewPersona
              )
            }
            className="mt-6 w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4"
          >
            <option value="Friendly HR">
              Friendly HR
            </option>

            <option value="Strict Technical Lead">
              Strict Technical
              Lead
            </option>

            <option value="Senior Engineering Manager">
              Senior Engineering
              Manager
            </option>

            <option value="Corporate VP">
              Corporate VP
            </option>
          </select>
        </div>

        {/* START */}
        <button
          onClick={onStart}
          disabled={loading}
          className="w-full rounded-3xl bg-white px-8 py-5 text-xl font-black text-slate-950 transition hover:scale-[1.01] disabled:opacity-70"
        >
          {loading
            ? "Starting Interview..."
            : "Start AI Interview"}
        </button>
      </div>
    </div>
  );
}

function PlanCard({
  title,

  description,

  features,

  icon,

  active,

  onClick,
}: {
  title: string;

  description: string;

  features: string[];

  icon: React.ReactNode;

  active: boolean;

  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-3xl border p-6 text-left transition ${
        active
          ? "border-emerald-400 bg-emerald-400/5"
          : "border-white/10 bg-slate-900/50 hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white/5 p-3 text-emerald-300">
            {icon}
          </div>

          <div>
            <h4 className="text-2xl font-black">
              {title}
            </h4>

            <p className="mt-2 text-sm text-slate-400">
              {
                description
              }
            </p>
          </div>
        </div>

        {active && (
          <div className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950">
            Selected
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {features.map(
          (feature) => (
            <span
              key={feature}
              className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-300"
            >
              {feature}
            </span>
          )
        )}
      </div>
    </button>
  );
}
