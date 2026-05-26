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
  <div className="fixed inset-0 z-[9999] bg-[#0b1020]">
    <div className="flex h-screen w-screen overflow-hidden">
      
      {/* LEFT PANEL */}
      <section className="w-[45%] overflow-y-auto border-r border-white/10 bg-[#0f172a] p-8">
        
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              <Code2 size={16} />
              Coding Round
            </div>

            <h1 className="mt-5 text-3xl font-black">
              {challenge.title}
            </h1>

            <p className="mt-3 text-slate-400">
              Topic: {challenge.topic}
            </p>
          </div>

          <div className="rounded-xl bg-white/5 px-4 py-2 text-sm font-bold">
            {challenge.difficulty}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-black">
            Problem Statement
          </h2>

          <div className="mt-5 whitespace-pre-wrap text-base leading-8 text-slate-300">
            {challenge.prompt}
          </div>
        </div>

        {challenge.testCases?.[0] && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-[#111827] p-6">
            <div className="flex items-center gap-2">
              <Terminal
                size={18}
                className="text-emerald-300"
              />

              <h2 className="text-xl font-black">
                Example
              </h2>
            </div>

            <div className="mt-5">
              <p className="font-semibold text-slate-300">
                Input
              </p>

              <pre className="mt-2 overflow-auto rounded-xl bg-black p-4 text-sm text-emerald-300">
                {challenge.testCases[0].input}
              </pre>
            </div>

            <div className="mt-5">
              <p className="font-semibold text-slate-300">
                Output
              </p>

              <pre className="mt-2 overflow-auto rounded-xl bg-black p-4 text-sm text-emerald-300">
                {
                  challenge.testCases[0]
                    .expectedOutput
                }
              </pre>
            </div>
          </div>
        )}
      </section>

      {/* RIGHT PANEL */}
      <section className="flex flex-1 flex-col bg-[#0d1117]">

        {/* TOP BAR */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          
          <div className="flex items-center gap-4">
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

            <p className="text-sm text-slate-400">
              Write your solution and submit for AI review
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitted || submitting}
              className="rounded-xl border border-white/10 px-5 py-3 font-semibold text-slate-300 hover:bg-white/5"
            >
              Close
            </button>

            <button
              onClick={handleSubmit}
              disabled={submitted || submitting}
              className="rounded-xl bg-emerald-400 px-6 py-3 font-black text-slate-950"
            >
              {submitting
                ? "Reviewing..."
                : submitted
                ? "Submitted"
                : "Submit Code"}
            </button>
          </div>
        </div>

        {/* EDITOR */}
        <div className="flex-1 overflow-hidden">
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
  </div>
);
}
