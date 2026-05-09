"use client";

import { useState } from "react";

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
}: Props) {
  const [expanded, setExpanded] =
    useState(false);

  if (!question) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-8">
        <h2 className="text-2xl font-bold">
          Interview not started
        </h2>

        <p className="mt-4 text-slate-400">
          Configure interview
          settings and click
          Start Interview.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-8">
      {/* TIMER */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">
            Timer
          </p>

          <h2 className="text-6xl font-black">
            {Math.floor(
              secondsLeft / 60
            )}
            :
            {String(
              secondsLeft % 60
            ).padStart(2, "0")}
          </h2>
        </div>

        <div className="rounded-full bg-emerald-400/10 px-5 py-2 text-sm font-semibold text-emerald-300">
          {question.round}
        </div>
      </div>

      {/* QUESTION */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-3xl font-bold">
            Interview Question
          </h3>

          <button
            onClick={() =>
              setExpanded(
                !expanded
              )
            }
            className="text-sm text-emerald-300"
          >
            {expanded
              ? "Collapse"
              : "Expand"}
          </button>
        </div>

        <div
          className={`overflow-hidden transition-all ${
            expanded
              ? "max-h-[1200px]"
              : "max-h-[220px]"
          }`}
        >
          <p className="mt-6 whitespace-pre-wrap text-lg leading-9 text-slate-200">
            {
              question.question
            }
          </p>
        </div>

        {/* Signals */}
        {question.expectedSignals
          ?.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold text-slate-400">
              Interview Focus
            </p>

            <div className="flex flex-wrap gap-3">
              {question.expectedSignals.map(
                (signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300"
                  >
                    {signal}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>

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
          placeholder="Write your answer here..."
          className="w-full rounded-2xl border border-white/10 bg-slate-900 p-5 text-lg"
        />

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            If you don't know
            the answer, write:
            "I don't know"
          </p>

          <p className="text-sm text-slate-500">
            Answers:{" "}
            {answers.length}
          </p>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="rounded-xl bg-emerald-400 px-6 py-4 font-bold text-slate-950"
        >
          {loading
            ? "Submitting..."
            : "Submit Answer"}
        </button>

        <button
          onClick={onSkip}
          className="rounded-xl border border-white/10 px-6 py-4 font-semibold text-slate-300"
        >
          Skip Question
        </button>
      </div>
    </div>
  );
}
