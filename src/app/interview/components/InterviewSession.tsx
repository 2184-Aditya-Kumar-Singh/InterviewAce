"use client";

import {
  Loader2,
  Sparkles,
} from "lucide-react";

import type {
  InterviewQuestion,
  InterviewAnswer,
} from "@/lib/types";

type Props = {
  question:
    | InterviewQuestion
    | null;

  answers:
    InterviewAnswer[];

  answer: string;

  setAnswer: (
    value: string
  ) => void;

  onSubmit: () => void;

  onSkip: () => void;

  loading: boolean;

  secondsLeft: number;

  premium?: boolean;

  listening?: boolean;

  speaking?: boolean;
};

export function InterviewSession({
  question,

  answers,

  answer,

  setAnswer,

  onSubmit,

  onSkip,

  loading,

  secondsLeft,

  premium = false,

  listening = false,

  speaking = false,
}: Props) {
  if (!question) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-10">
        <h2 className="text-3xl font-black">
          Interview not started
        </h2>

        <p className="mt-4 text-slate-400">
          Configure your
          interview settings
          and click Start
          Interview.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl border border-white/10 ${
        premium
          ? "bg-black"
          : "bg-slate-950/70"
      } p-8`}
    >
      {/* TOP */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* TIMER */}
        <div>
          <p className="text-sm text-slate-400">
            Interview Timer
          </p>

          <h2 className="text-6xl font-black tracking-tight">
            {Math.floor(
              secondsLeft / 60
            )}
            :
            {String(
              secondsLeft % 60
            ).padStart(2, "0")}
          </h2>
        </div>

        {/* STATUS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full bg-emerald-400/10 px-5 py-2 text-sm font-semibold text-emerald-300">
            {question.round}
          </div>

          {premium && (
            <div
              className={`rounded-full px-5 py-2 text-sm font-semibold ${
                listening
                  ? "bg-sky-400/10 text-sky-300"
                  : speaking
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {listening
                ? "Listening..."
                : speaking
                ? "AI Speaking"
                : "Ready"}
            </div>
          )}
        </div>
      </div>

      {/* QUESTION CARD */}
      <div
        className={`rounded-3xl border border-white/10 ${
          premium
            ? "bg-slate-950"
            : "bg-slate-900/60"
        } p-8`}
      >
        <div className="flex items-center gap-3">
          <Sparkles
            className="text-emerald-300"
            size={24}
          />

          <h3 className="text-3xl font-black">
            Interview Question
          </h3>
        </div>

        <p className="mt-6 whitespace-pre-wrap text-xl leading-10 text-slate-200">
          {typeof question.question ===
          "string"
            ? question.question
            : "Tell me about yourself and your recent work."}
        </p>

        {/* FOCUS */}
        {question.expectedSignals
          ?.length > 0 && (
          <div className="mt-8">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Focus Areas
            </p>

            <div className="flex flex-wrap gap-3">
              {question.expectedSignals.map(
                (signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300"
                  >
                    {signal}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* PREMIUM INFO */}
      {premium && (
        <div className="mt-5 rounded-2xl border border-sky-400/10 bg-sky-400/5 p-4 text-sm text-sky-200">
          🎤 Premium mode
          enabled. Click the
          mic button on the AI
          avatar and answer
          naturally through
          voice.
        </div>
      )}

      {/* ANSWER */}
      <div className="mt-8">
        <textarea
          value={answer}
          onChange={(e) =>
            setAnswer(
              e.target.value
            )
          }
          rows={10}
          disabled={listening}
          placeholder={
            premium
              ? "Your spoken answer will appear here automatically..."
              : "Write your answer here..."
          }
          className={`w-full rounded-3xl border border-white/10 bg-slate-900 p-5 text-lg outline-none transition ${
            listening
              ? "cursor-not-allowed opacity-70"
              : "focus:border-emerald-400/30"
          }`}
        />

        {/* HELP TEXT */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            If you don't know
            the answer, write:
            "I don't know"
          </p>

          <p className="text-sm text-slate-500">
            Questions Answered:{" "}
            {answers.length}
          </p>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          onClick={onSubmit}
          disabled={
            loading ||
            listening
          }
          className="flex items-center gap-2 rounded-2xl bg-emerald-400 px-7 py-4 font-black text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && (
            <Loader2
              className="animate-spin"
              size={18}
            />
          )}

          {loading
            ? "Submitting..."
            : "Submit Answer"}
        </button>

        <button
          onClick={onSkip}
          disabled={loading}
          className="rounded-2xl border border-white/10 px-7 py-4 font-semibold text-slate-300 transition hover:bg-white/5"
        >
          Skip Question
        </button>
      </div>
    </div>
  );
}
