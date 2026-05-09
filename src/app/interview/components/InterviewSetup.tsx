"use client";

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
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
      <h2 className="text-4xl font-black">
        Interview Setup
      </h2>

      <div className="mt-8 space-y-8">
        {/* Resume */}
        <div>
          <label className="mb-3 block text-xl font-semibold">
            Resume
          </label>

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) =>
              setResumeFile(
                e.target.files?.[0] ||
                  null
              )
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-5"
          />

          {parsedResume && (
            <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4">
              <p className="font-semibold text-emerald-300">
                Resume Parsed
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {
                  parsedResume.summary
                }
              </p>
            </div>
          )}
        </div>

        {/* JD */}
        <div>
          <label className="mb-3 block text-xl font-semibold">
            Job Description
          </label>

          <textarea
            value={jdText}
            onChange={(e) =>
              setJdText(
                e.target.value
              )
            }
            rows={10}
            className="w-full rounded-xl border border-white/10 bg-slate-900 p-4"
            placeholder="Paste Job Description here..."
          />
        </div>

        {/* Difficulty */}
        <div>
          <label className="mb-3 block text-xl font-semibold">
            Difficulty
          </label>

          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(
                e.target
                  .value as Difficulty
              )
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4"
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

        {/* Plan */}
        <div>
          <label className="mb-3 block text-xl font-semibold">
            Plan
          </label>

          <select
            value={plan}
            onChange={(e) =>
              setPlan(
                e.target
                  .value as InterviewPlan
              )
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4"
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

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
            {plan === "FREE" && (
              <p>
                Text interview +
                basic report.
              </p>
            )}

            {plan === "PRO" && (
              <p>
                Voice-to-text +
                detailed analysis.
              </p>
            )}

            {plan ===
              "PREMIUM" && (
              <p>
                Real-time AI voice
                interview +
                recruiter-grade
                report.
              </p>
            )}
          </div>
        </div>

        {/* Round */}
        <div>
          <label className="mb-3 block text-xl font-semibold">
            Interview Type
          </label>

          <select
            value={round}
            onChange={(e) =>
              setRound(
                e.target
                  .value as InterviewRound
              )
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4"
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

        {/* Persona */}
        <div>
          <label className="mb-3 block text-xl font-semibold">
            Interviewer
          </label>

          <select
            value={persona}
            onChange={(e) =>
              setPersona(
                e.target
                  .value as InterviewPersona
              )
            }
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-4"
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

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onAnalyze}
            disabled={analyzing}
            className="rounded-xl bg-emerald-400 px-6 py-4 font-bold text-slate-950"
          >
            {analyzing
              ? "Analyzing..."
              : "Analyze JD"}
          </button>

          <button
            onClick={onStart}
            disabled={loading}
            className="rounded-xl bg-white px-6 py-4 font-bold text-slate-950"
          >
            {loading
              ? "Starting..."
              : "Start Interview"}
          </button>
        </div>
      </div>
    </div>
  );
}
