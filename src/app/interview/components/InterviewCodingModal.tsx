"use client";

import {
  useEffect,
  useState,
} from "react";

import Editor from "@monaco-editor/react";

import type {
  CodingChallenge,
} from "@/lib/types";

type Props = {
  open: boolean;

  challenge:
    | CodingChallenge
    | null;

  onClose: () => void;

  onSolved: (
    summary?: string
  ) => void;
};

export function InterviewCodingModal({
  open,

  challenge,

  onClose,

  onSolved,
}: Props) {
  const [code, setCode] =
    useState("");

  const [
    secondsLeft,
    setSecondsLeft,
  ] = useState(600);

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    if (!open) return;

    setSecondsLeft(600);

    const interval =
      setInterval(() => {
        setSecondsLeft(
          (prev) => {
            if (prev <= 1) {
              clearInterval(
                interval
              );

              return 0;
            }

            return prev - 1;
          }
        );
      }, 1000);

    return () =>
      clearInterval(interval);
  }, [open]);

  if (!open || !challenge)
    return null;

  async function handleSubmit() {
    setSubmitting(true);

    try {
      const response =
        await fetch(
          "/api/code/review",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              language:
                "JavaScript",

              code,

              prompt:
                challenge.prompt,
            }),
          }
        );

      const data =
        await response.json();

      onSolved(
        JSON.stringify(
          data.review
        )
      );

      onClose();
    } catch {
      onSolved(
        "Coding round completed."
      );

      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-6 backdrop-blur">
      <div className="flex h-[92vh] w-full max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950">
        {/* LEFT */}
        <div className="w-[42%] overflow-y-auto border-r border-white/10 p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">
                Coding Round
              </p>

              <h2 className="mt-2 text-4xl font-black">
                {
                  challenge.title
                }
              </h2>
            </div>

            <div className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              {
                challenge.difficulty
              }
            </div>
          </div>

          {/* TIMER */}
          <div className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5">
            <p className="text-sm text-rose-300">
              Time Remaining
            </p>

            <h3 className="mt-2 text-5xl font-black text-white">
              {Math.floor(
                secondsLeft / 60
              )}
              :
              {String(
                secondsLeft % 60
              ).padStart(2, "0")}
            </h3>
          </div>

          {/* PROMPT */}
          <div className="mt-8 whitespace-pre-wrap text-lg leading-9 text-slate-200">
            {challenge.prompt}
          </div>

          {/* SAMPLE */}
          {challenge.testCases
            ?.length > 0 && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <h3 className="text-2xl font-bold">
                Sample Test Case
              </h3>

              <div className="mt-5">
                <p className="font-semibold text-slate-300">
                  Input
                </p>

                <pre className="mt-2 overflow-auto rounded-xl bg-black p-4 text-sm text-emerald-300">
                  {
                    challenge
                      .testCases[0]
                      .input
                  }
                </pre>
              </div>

              <div className="mt-5">
                <p className="font-semibold text-slate-300">
                  Output
                </p>

                <pre className="mt-2 overflow-auto rounded-xl bg-black p-4 text-sm text-emerald-300">
                  {
                    challenge
                      .testCases[0]
                      .expectedOutput
                  }
                </pre>
              </div>
            </div>
          )}

          {/* HIDDEN */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h3 className="text-xl font-bold">
              Hidden Test Cases
            </h3>

            <p className="mt-3 text-slate-400">
              5 hidden test cases
              will be used during
              evaluation.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h3 className="text-xl font-bold">
                Code Editor
              </h3>

              <p className="text-sm text-slate-400">
                Write your
                solution below.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300"
              >
                Close
              </button>

              <button
                onClick={
                  handleSubmit
                }
                disabled={
                  submitting
                }
                className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Code"}
              </button>
            </div>
          </div>

          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code}
              onChange={(v) =>
                setCode(v || "")
              }
              theme="vs-dark"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
