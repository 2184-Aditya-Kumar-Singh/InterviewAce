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
    <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
      {/* HEADER */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
          <Sparkles
            size={16}
          />
          AI Mock Interview
        </div>

        <h2 className="mt-4 text-3xl font-black leading-tight">
          Interview Setup
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          Configure your AI
          interview environment
          for realistic
          recruiter-style mock
          interviews.
        </p>
      </div>

      <div className="mt-7 space-y-7">
        {/* RESUME */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <UploadCloud
              className="text-emerald-300"
              size={22}
            />

            <h3 className="text-lg font-black">
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
            className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-4 text-sm"
          />

          {resumeFile && (
            <div className="mt-4 rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4 text-sm">
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
            <div className="mt-4 rounded-xl border border-sky-400/10 bg-sky-400/5 p-4 text-sm">
              <p className="font-semibold text-sky-300">
                Resume Summary
              </p>

              <p className="mt-2 leading-6 text-slate-300">
                {
                  parsedResume.summary
                }
              </p>
            </div>
          )}
        </div>

        {/* JD */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <div className="flex items-center gap-3">
            <FileText
              className="text-amber-300"
              size={22}
            />

            <h3 className="text-lg font-black">
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
            className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-sm leading-6"
            placeholder="Paste the target job description here..."
          />

          <button
            onClick={onAnalyze}
            disabled={
              analyzing
            }
            className="mt-4 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02] disabled:opacity-70"
          >
            {analyzing
              ? "Analyzing JD..."
              : "Analyze Resume + JD"}
          </button>
        </div>

        {/* PLAN */}
        <div>
          <h3 className="text-xl font-black">
            Select Plan
          </h3>

          <div className="mt-4 grid gap-3">
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
              description="Text interview with coding rounds and deeper AI review."
              features={[
                "Text-based interview",
                "2-3 coding rounds",
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
                "Live AI avatar call",
                "Voice answers",
                "2-3 coding rounds",
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
        <div className="space-y-4">
          {/* DIFFICULTY */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Brain
                className="text-emerald-300"
                size={22}
              />

              <h3 className="text-lg font-black">
                Difficulty
              </h3>
            </div>

            <OptionGroup
              value={difficulty}
              options={[
                "Easy",
                "Medium",
                "Hard",
              ]}
              onChange={(value) =>
                setDifficulty(
                  value as Difficulty
                )
              }
            />
          </div>

          {/* ROUND */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Briefcase
                className="text-amber-300"
                size={22}
              />

              <h3 className="text-lg font-black">
                Interview Type
              </h3>
            </div>

            <OptionGroup
              value={round}
              options={[
                "HR",
                "Technical",
                "Mixed",
              ]}
              onChange={(value) =>
                setRound(
                  value as InterviewRound
                )
              }
            />
          </div>
        </div>

        {/* PERSONA */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5">
          <h3 className="text-lg font-black">
            Interviewer Persona
          </h3>

          <div className="mt-4 grid gap-3">
            {[
              "Friendly HR",
              "Strict Technical Lead",
              "Senior Engineering Manager",
              "Corporate VP",
            ].map((item) => (
              <button
                key={item}
                onClick={() =>
                  setPersona(
                    item as InterviewPersona
                  )
                }
                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  persona === item
                    ? "border-emerald-400 bg-emerald-400/10 text-emerald-200"
                    : "border-white/10 bg-slate-950/70 text-slate-300 hover:border-white/20"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* START */}
        <button
          onClick={onStart}
          disabled={loading}
          className="w-full rounded-2xl bg-white px-6 py-4 text-base font-black text-slate-950 transition hover:scale-[1.01] disabled:opacity-70"
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
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-emerald-400 bg-emerald-400/5"
          : "border-white/10 bg-slate-900/50 hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white/5 p-3 text-emerald-300">
            {icon}
          </div>

          <div>
            <h4 className="text-lg font-black">
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
          <div className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-slate-950">
            Selected
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {features.map(
          (feature) => (
            <span
              key={feature}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-300"
            >
              {feature}
            </span>
          )
        )}
      </div>
    </button>
  );
}

function OptionGroup({
  value,
  options,
  onChange,
  className = "",
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-3 gap-2 ${className}`}
    >
      {options.map((option) => (
        <button
          key={option}
          onClick={() =>
            onChange(option)
          }
          className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
            value === option
              ? "border-emerald-400 bg-emerald-400 text-slate-950"
              : "border-white/10 bg-slate-950 text-slate-300 hover:border-white/20 hover:bg-white/5"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
