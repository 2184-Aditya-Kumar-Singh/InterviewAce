"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Clock3, Code2, Terminal } from "lucide-react";

import type {
  CodeReview,
  CodingChallenge,
} from "@/lib/types";

const starters: Record<string, string> = {
  Python:
    "import sys\n\n# Write your solution here\n",
  JavaScript:
    "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\n\n// Write your solution here\n",
  Java:
    "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    // Write your solution here\n  }\n}",
  "C++":
    "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  // Write your solution here\n  return 0;\n}",
  C:
    "#include <stdio.h>\n\nint main() {\n  // Write your solution here\n  return 0;\n}",
};

type Props = {
  open: boolean;
  challenge: CodingChallenge | null;
  onClose: () => void;
  onSolved: (result: {
    challenge: CodingChallenge;
    code: string;
    language: string;
    review: CodeReview | null;
  }) => void;
};

export function InterviewCodingModal({
  open,
  challenge,
  onClose,
  onSolved,
}: Props) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;

    queueMicrotask(() => {
      setSecondsLeft(
        challenge?.timeLimitSeconds || 600
      );
      setLanguage("Python");
      setCode(starters.Python);
      setSubmitted(false);
    });

    const interval = setInterval(() => {
      setSecondsLeft((prev) =>
        Math.max(0, prev - 1)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [open, challenge]);

  if (!open || !challenge) return null;

  async function handleSubmit() {
    if (submitted || !challenge) return;

    try {
      setSubmitting(true);
      setSubmitted(true);

      const response = await fetch(
        "/api/code/review",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            language,
            code,
            prompt: challenge.prompt,
          }),
        }
      );

      const data = await response.json();

      onSolved({
        challenge,
        code,
        language,
        review: data?.review || null,
      });
      onClose();
    } catch (err) {
      console.error(err);
      onSolved({
        challenge,
        code,
        language,
        review: null,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="fixed right-0 top-0 z-[999] h-screen w-full border-l border-white/10 bg-black/95 shadow-2xl shadow-black/60 backdrop-blur-sm lg:w-1/2">
      <div className="flex h-full flex-col overflow-hidden">
        <section className="max-h-[46vh] overflow-y-auto border-b border-white/10 bg-slate-950 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                <Code2 size={16} />
                Coding Round
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight">
                Solve this question
              </h1>
              <p className="mt-3 text-xl font-bold text-white">
                {challenge.title}
              </p>
              <p className="mt-2 text-slate-400">
                Topic: {challenge.topic}
              </p>
            </div>
            <div className="rounded-full bg-white/5 px-5 py-2 text-sm font-bold text-white">
              {challenge.difficulty}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5">
            <div className="flex items-center gap-3">
              <Clock3
                className="text-rose-300"
                size={20}
              />
              <p className="font-semibold text-rose-200">
                Time Remaining
              </p>
            </div>
            <h2 className="mt-3 text-4xl font-black">
              {Math.floor(secondsLeft / 60)}:
              {String(secondsLeft % 60).padStart(
                2,
                "0"
              )}
            </h2>
          </div>

          <div className="mt-7">
            <h2 className="text-2xl font-black">
              Problem Statement
            </h2>
            <div className="mt-4 whitespace-pre-wrap text-base leading-8 text-slate-300">
              {challenge.prompt}
            </div>
          </div>

          {challenge.testCases?.[0] && (
            <div className="mt-7 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <div className="flex items-center gap-3">
                <Terminal
                  size={20}
                  className="text-emerald-300"
                />
                <h2 className="text-xl font-black">
                  Sample Example
                </h2>
              </div>
              <p className="mt-5 font-semibold text-slate-300">
                Input
              </p>
              <pre className="mt-2 overflow-auto rounded-xl bg-black p-4 text-sm text-emerald-300">
                {challenge.testCases[0].input}
              </pre>
              <p className="mt-5 font-semibold text-slate-300">
                Output
              </p>
              <pre className="mt-2 overflow-auto rounded-xl bg-black p-4 text-sm text-emerald-300">
                {
                  challenge.testCases[0]
                    .expectedOutput
                }
              </pre>
            </div>
          )}
        </section>

        <section className="flex min-h-0 flex-1 flex-col bg-[#0d1117]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
            <div>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setCode(starters[e.target.value]);
                }}
                disabled={submitted || submitting}
                className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 font-semibold"
              >
                {Object.keys(starters).map(
                  (lang) => (
                    <option key={lang}>
                      {lang}
                    </option>
                  )
                )}
              </select>
              <p className="mt-2 text-sm text-slate-400">
                Choose a language, write the solution,
                and submit once for AI review.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onClose}
                disabled={submitted || submitting}
                className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitted || submitting}
                className="rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting
                  ? "Reviewing..."
                  : submitted
                  ? "Submitted"
                  : "Submit Code"}
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={
                language === "C++"
                  ? "cpp"
                  : language.toLowerCase()
              }
              value={code}
              onChange={(value) =>
                setCode(value || "")
              }
              theme="vs-dark"
              options={{
                minimap: {
                  enabled: false,
                },
                fontSize: 16,
                lineHeight: 28,
                padding: {
                  top: 20,
                },
                readOnly: submitted || submitting,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
        </section>
      </div>
    </aside>
  );
}
