"use client";

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
}: Props) {
  if (!question) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-10">
        <h2 className="text-3xl font-black">
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
    <div
      className={`rounded-3xl border border-white/10 ${
        premium
          ? "bg-black"
          : "bg-slate-950/70"
      } p-8`}
    >
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
      <div
        className={`rounded-3xl border border-white/10 ${
          premium
            ? "bg-slate-950"
            : "bg-slate-900/60"
        } p-8`}
      >
        <h3 className="text-3xl font-black">
          Interview Question
        </h3>

        <p className="mt-6 whitespace-pre-wrap text-xl leading-10 text-slate-200">
          {typeof question.question ===
          "string"
            ? question.question
            : "Tell me about yourself and your recent technical work."}
        </p>

        {/* SIGNALS */}
        {question.expectedSignals
          ?.length > 0 && (
          <div className="mt-8">
            <p className="mb-4 text-sm font-semibold text-slate-400">
              Interview Focus
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
          className="w-full rounded-3xl border border-white/10 bg-slate-900 p-5 text-lg"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
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

      {/* BUTTONS */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          onClick={onSubmit}
          disabled={loading}
          className="rounded-2xl bg-emerald-400 px-7 py-4 font-black text-slate-950"
        >
          {loading
            ? "Submitting..."
            : "Submit Answer"}
        </button>

        <button
          onClick={onSkip}
          className="rounded-2xl border border-white/10 px-7 py-4 font-semibold text-slate-300"
        >
          Skip Question
        </button>
      </div>
    </div>
  );
}
