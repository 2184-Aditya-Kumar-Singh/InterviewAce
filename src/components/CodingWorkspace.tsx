"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import {
  Play,
  Send,
  Timer,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { createCodingChallenge } from "@/lib/coding-challenges";

import type {
  CodingChallenge,
  Difficulty,
  JDAnalysis,
  ParsedResume,
} from "@/lib/types";

const Monaco = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false }
);

const starters: Record<string, string> =
  {
    Python:
      "import sys\n\n# Read input and print output\n\nprint('')",

    JavaScript:
      "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8');\n\nconsole.log('');",

    Java:
      'import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println("");\n  }\n}',

    "C++":
      '#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n\n  cout << "";\n\n  return 0;\n}',

    C: '#include <stdio.h>\n\nint main(){\n  printf("");\n  return 0;\n}',
  };

type TestResult = {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
};

export function CodingWorkspace({
  initialResume,
  initialJd,
  initialDifficulty = "Medium",
  interviewMode = false,
  onInterviewSubmit,
}: {
  initialResume?: ParsedResume;

  initialJd?: JDAnalysis | null;

  initialDifficulty?: Difficulty;

  interviewMode?: boolean;

  onInterviewSubmit?: (
    summary: string
  ) => void;
}) {
  const [challenge, setChallenge] =
    useState<CodingChallenge | null>(
      null
    );

  const [language, setLanguage] =
    useState("Python");

  const [code, setCode] =
    useState(starters.Python);

  const [output, setOutput] =
    useState(
      "Run code to see output."
    );

  const [results, setResults] =
    useState<TestResult[]>([]);

  const [running, setRunning] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [secondsLeft, setSecondsLeft] =
    useState(0);

  const [loadingQuestion, setLoadingQuestion] =
    useState(false);

  useEffect(() => {
    loadChallenge();
  }, []);

  async function loadChallenge() {
    setLoadingQuestion(true);

    try {
      const generatedChallenge =
        await createCodingChallenge({
          resume: initialResume,

          jd: initialJd,

          difficulty:
            initialDifficulty,

          interviewMode,
        });

      setChallenge(
        generatedChallenge
      );

      setSecondsLeft(
        generatedChallenge.timeLimitSeconds
      );
    } finally {
      setLoadingQuestion(false);
    }
  }

  useEffect(() => {
    if (!challenge) return;

    if (
      submitted ||
      secondsLeft <= 0
    )
      return;

    const timer =
      window.setInterval(() => {
        setSecondsLeft((current) =>
          Math.max(0, current - 1)
        );
      }, 1000);

    return () =>
      window.clearInterval(timer);
  }, [
    secondsLeft,
    submitted,
    challenge,
  ]);

  const timerLabel = useMemo(
    () =>
      `${Math.floor(
        secondsLeft / 60
      )}:${String(
        secondsLeft % 60
      ).padStart(2, "0")}`,
    [secondsLeft]
  );

  async function generateNewQuestion() {
    await loadChallenge();

    setResults([]);

    setOutput(
      "Run code to see output."
    );

    setSubmitted(false);

    setCode(starters[language]);
  }

  async function runOne(
    stdin: string
  ) {
    const response =
      await fetch(
        "/api/code/run",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            language,
            code,
            stdin,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      return (
        data.error ||
        "Execution failed."
      );
    }

    return String(
      data.run?.stdout ||
        data.run?.output ||
        ""
    ).trim();
  }

  async function runTests(
    markSubmitted = false
  ) {
    if (!challenge) return;

    setRunning(true);

    try {
      const visibleCases =
        markSubmitted
          ? challenge.testCases
          : challenge.testCases.slice(
              0,
              2
            );

      const nextResults: TestResult[] =
        [];

      for (const testCase of visibleCases) {
        const actualOutput =
          await runOne(
            testCase.input
          );

        nextResults.push({
          ...testCase,

          actualOutput,

          passed:
            actualOutput.trim() ===
            testCase.expectedOutput.trim(),
        });
      }

      setResults(nextResults);

      const passed =
        nextResults.filter(
          (item) => item.passed
        ).length;

      setOutput(
        `${passed}/${nextResults.length} test cases passed.`
      );

      if (markSubmitted) {
        setSubmitted(true);

        if (
          interviewMode &&
          onInterviewSubmit &&
          passed ===
            nextResults.length
        ) {
          onInterviewSubmit(
            `${challenge.title} solved successfully`
          );
        }
      }
    } catch {
      setOutput(
        "Could not execute code."
      );
    } finally {
      setRunning(false);
    }
  }

  if (!challenge) {
    return (
      <div className="p-6 text-white">
        Loading coding challenge...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Timer size={18} />

          <span className="text-lg font-semibold">
            {timerLabel}
          </span>
        </div>

        <button
          onClick={
            generateNewQuestion
          }
          disabled={loadingQuestion}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-black hover:bg-emerald-400"
        >
          <RefreshCw size={16} />

          {loadingQuestion
            ? "Generating..."
            : "Generate Question"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT */}
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <h1 className="text-3xl font-bold">
            {challenge.title}
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-300">
            {challenge.prompt}
          </p>

          {/* Examples */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">
              Examples
            </h2>

            <div className="space-y-4">
              {challenge.testCases
                .slice(0, 2)
                .map(
                  (
                    testCase,
                    index
                  ) => (
                    <div
                      key={index}
                      className="rounded-xl bg-slate-950 p-4"
                    >
                      <p className="mb-2 font-semibold text-emerald-400">
                        Example{" "}
                        {index + 1}
                      </p>

                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-semibold">
                            Input
                          </p>

                          <pre className="mt-1 overflow-x-auto rounded bg-black/40 p-2">
{testCase.input}
                          </pre>
                        </div>

                        <div>
                          <p className="font-semibold">
                            Output
                          </p>

                          <pre className="mt-1 overflow-x-auto rounded bg-black/40 p-2">
{testCase.expectedOutput}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>

          {/* Constraints */}
          <div className="mt-8 rounded-xl bg-slate-950 p-4">
            <h2 className="mb-3 text-lg font-semibold">
              Constraints
            </h2>

            <ul className="list-disc space-y-2 pl-5 text-slate-300">
              <li>
                1 ≤ n ≤ 100000
              </li>

              <li>
                Optimize time
                complexity where
                possible
              </li>

              <li>
                Handle edge cases
              </li>

              <li>
                Expected interview-style
                solution
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT */}
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <select
              value={language}
              onChange={(e) => {
                setLanguage(
                  e.target.value
                );

                setCode(
                  starters[
                    e.target.value
                  ]
                );
              }}
              className="rounded-lg bg-slate-800 px-3 py-2"
            >
              {Object.keys(
                starters
              ).map((lang) => (
                <option
                  key={lang}
                >
                  {lang}
                </option>
              ))}
            </select>

            <div className="rounded-xl bg-slate-800 px-3 py-2 text-sm">
              Status:
              <span className="ml-2 font-semibold text-emerald-400">
                Ready
              </span>
            </div>
          </div>

          <Monaco
            height="500px"
            language={
              language === "C++"
                ? "cpp"
                : language.toLowerCase()
            }
            theme="vs-dark"
            value={code}
            onChange={(value) =>
              setCode(
                value || ""
              )
            }
          />

          <div className="mt-4 flex gap-3">
            <button
              onClick={() =>
                runTests(false)
              }
              disabled={running}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3"
            >
              <Play size={16} />
              Run Code
            </button>

            <button
              onClick={() =>
                runTests(true)
              }
              disabled={
                running ||
                submitted
              }
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black hover:bg-emerald-400"
            >
              <Send size={16} />
              Submit
            </button>
          </div>

          {/* Results */}
          <div className="mt-6 rounded-xl bg-black/40 p-4">
            <p className="mb-3 font-semibold">
              Console Output
            </p>

            <pre className="whitespace-pre-wrap text-sm text-slate-300">
              {output}
            </pre>
          </div>

          {/* Visible Cases */}
          {results.length > 0 && (
            <div className="mt-6 space-y-4">
              {results.map(
                (
                  result,
                  index
                ) => (
                  <div
                    key={index}
                    className="rounded-xl border border-white/10 bg-slate-950 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle2
                          className="text-emerald-400"
                          size={18}
                        />
                      ) : (
                        <XCircle
                          className="text-red-400"
                          size={18}
                        />
                      )}

                      <span className="font-semibold">
                        Test Case{" "}
                        {index + 1}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-semibold">
                          Input
                        </p>

                        <pre className="rounded bg-black/40 p-2">
{result.input}
                        </pre>
                      </div>

                      <div>
                        <p className="font-semibold">
                          Expected
                        </p>

                        <pre className="rounded bg-black/40 p-2">
{result.expectedOutput}
                        </pre>
                      </div>

                      <div>
                        <p className="font-semibold">
                          Your Output
                        </p>

                        <pre className="rounded bg-black/40 p-2">
{result.actualOutput}
                        </pre>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
