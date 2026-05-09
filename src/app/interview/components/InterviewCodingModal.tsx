"use client";

import {
  useEffect,
  useState,
} from "react";

import Editor from "@monaco-editor/react";

import {
  Clock3,
  Code2,
  Terminal,
} from "lucide-react";

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

    setCode(`function solve() {

  // Write your solution here

}`);

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
    <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm">
      <div className="flex h-screen w-full flex-col overflow-hidden xl:flex-row">
        {/* LEFT PANEL */}
        <div className="w-full overflow-y-auto border-b border-white/10 bg-slate-950 xl:w-[42%] xl:border-b-0 xl:border-r">
          <div className="p-6 sm:p-8">
            {/* TOP */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                  <Code2
                    size={16}
                  />
                  Coding Round
                </div>

                <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                  {
                    challenge.title
                  }
                </h1>

                <p className="mt-3 text-slate-400">
                  Topic:{" "}
                  {
                    challenge.topic
                  }
                </p>
              </div>

              <div className="rounded-full bg-white/5 px-5 py-2 text-sm font-bold text-white">
                {
                  challenge.difficulty
                }
              </div>
            </div>

            {/* TIMER */}
            <div className="mt-8 rounded-3xl border border-rose-400/20 bg-rose-500/10 p-6">
              <div className="flex items-center gap-3">
                <Clock3
                  className="text-rose-300"
                  size={20}
                />

                <p className="font-semibold text-rose-200">
                  Time Remaining
                </p>
              </div>

              <h2 className="mt-4 text-5xl font-black">
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
            <div className="mt-10">
              <h2 className="text-2xl font-black">
                Problem Statement
              </h2>

              <div className="mt-5 whitespace-pre-wrap text-base leading-8 text-slate-300 sm:text-lg">
                {
                  challenge.prompt
                }
              </div>
            </div>

            {/* SAMPLE */}
            {challenge
              .testCases?.[0] && (
              <div className="mt-10 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
                <div className="flex items-center gap-3">
                  <Terminal
                    size={20}
                    className="text-emerald-300"
                  />

                  <h2 className="text-2xl font-black">
                    Sample Example
                  </h2>
                </div>

                <div className="mt-6">
                  <p className="font-semibold text-slate-300">
                    Input
                  </p>

                  <pre className="mt-3 overflow-auto rounded-2xl bg-black p-5 text-sm text-emerald-300">
                    {
                      challenge
                        .testCases[0]
                        .input
                    }
                  </pre>
                </div>

                <div className="mt-6">
                  <p className="font-semibold text-slate-300">
                    Output
                  </p>

                  <pre className="mt-3 overflow-auto rounded-2xl bg-black p-5 text-sm text-emerald-300">
                    {
                      challenge
                        .testCases[0]
                        .expectedOutput
                    }
                  </pre>
                </div>
              </div>
            )}

            {/* CONSTRAINTS */}
            <div className="mt-10 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
              <h2 className="text-2xl font-black">
                Evaluation Criteria
              </h2>

              <ul className="mt-5 space-y-4 text-slate-300">
                <li>
                  • Hidden test
                  cases will be
                  evaluated
                </li>

                <li>
                  • Time &
                  space complexity
                  matter
                </li>

                <li>
                  • Edge cases
                  should be handled
                </li>

                <li>
                  • Clean readable
                  code is preferred
                </li>

                <li>
                  • Use optimized
                  approaches where
                  possible
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-1 flex-col bg-[#0d1117]">
          {/* TOP BAR */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="text-2xl font-black">
                JavaScript Editor
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Write your
                optimized
                solution below
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={
                  onClose
                }
                className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5"
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
                className="rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:scale-[1.02] disabled:opacity-70"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Code"}
              </button>
            </div>
          </div>

          {/* EDITOR */}
          <div className="flex-1 overflow-hidden">
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
                  top: 20,
                },

                lineHeight: 28,

                scrollBeyondLastLine:
                  false,

                roundedSelection:
                  true,

                automaticLayout:
                  true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
