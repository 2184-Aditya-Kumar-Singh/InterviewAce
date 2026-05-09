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

  onSolved: () => void;
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
    try {
      setSubmitting(true);

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
              challenge?.prompt ||
              "",
          }),
        }
      );

      onSolved();

      onClose();
    } catch (err) {
      console.error(err);

      onSolved();

      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 p-4 backdrop-blur">
      <div className="flex h-[94vh] w-full max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950">
        {/* LEFT */}
        <div className="w-[42%] overflow-y-auto border-r border-white/10 p-8">
          {/* HEADER */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">
                Coding Round
              </p>

              <h2 className="mt-3 text-4xl font-black leading-tight">
                {
                  challenge.title
                }
              </h2>
            </div>

            <div className="rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
              {
                challenge.difficulty
              }
            </div>
          </div>

          {/* TIMER */}
          <div className="mt-8 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-6">
            <p className="text-sm text-rose-300">
              Coding Timer
            </p>

            <h2 className="mt-3 text-5xl font-black">
              {Math.floor(
                secondsLeft / 60
              )}
              :
              {String(
                secondsLeft % 60
              ).padStart(2, "0")}
            </h2>
          </div>

          {/* DESCRIPTION */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold">
              Problem Statement
            </h3>

            <div className="mt-5 whitespace-pre-wrap text-lg leading-9 text-slate-300">
              {
                challenge.prompt
              }
            </div>
          </div>

          {/* SAMPLE */}
          {challenge.testCases
            ?.length > 0 && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <h3 className="text-2xl font-bold">
                Sample Test Case
              </h3>

              <div className="mt-6">
                <p className="font-semibold text-slate-300">
                  Input
                </p>

                <pre className="mt-3 overflow-auto rounded-xl bg-black p-4 text-sm text-emerald-300">
                  {
                    challenge
                      .testCases[0]
                      .input
                  }
                </pre>
              </div>

              <div className="mt-6">
                <p className="font-semibold text-slate-300">
                  Expected Output
                </p>

                <pre className="mt-3 overflow-auto rounded-xl bg-black p-4 text-sm text-emerald-300">
                  {
                    challenge
                      .testCases[0]
                      .expectedOutput
                  }
                </pre>
              </div>
            </div>
          )}

          {/* INFO */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h3 className="text-xl font-bold">
              Evaluation
            </h3>

            <ul className="mt-5 space-y-3 text-slate-300">
              <li>
                • Hidden test
                cases will be
                checked
              </li>

              <li>
                • Time complexity
                matters
              </li>

              <li>
                • Edge cases are
                important
              </li>

              <li>
                • Clean readable
                code is preferred
              </li>

              <li>
                • You have 10
                minutes
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-1 flex-col">
          {/* TOP BAR */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h3 className="text-2xl font-black">
                JavaScript Editor
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Write your
                optimized
                solution below.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={
                  onClose
                }
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
                className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Code"}
              </button>
            </div>
          </div>

          {/* EDITOR */}
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code}
              onChange={(v) =>
                setCode(v || "")
              }
              theme="vs-dark"
              options={{
                minimap: {
                  enabled:
                    false,
                },

                fontSize: 16,

                padding: {
                  top: 18,
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
