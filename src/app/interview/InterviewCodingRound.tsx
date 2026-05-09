"use client";

import dynamic from "next/dynamic";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Timer,
  Play,
  Send,
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

const starters: Record<
  string,
  string
> = {
  Python:
    "import sys\n\n",

  JavaScript:
    "function solve(){\n\n}\n\nsolve();",

  Java:
    'import java.util.*;\n\npublic class Main {\n  public static void main(String[] args){\n\n  }\n}',

  "C++":
    '#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n\nreturn 0;\n}',

  C: '#include <stdio.h>\n\nint main(){\n\nreturn 0;\n}',
};

type TestResult = {
  input: string;

  expectedOutput: string;

  actualOutput: string;

  passed: boolean;
};

export function InterviewCodingRound({
  resume,

  jd,

  difficulty,

  onSolved,
}: {
  resume?: ParsedResume;

  jd?: JDAnalysis | null;

  difficulty?: Difficulty;

  onSolved: (
    summary: string
  ) => void;
}) {
  const [
    challenge,
    setChallenge,
  ] =
    useState<CodingChallenge | null>(
      null
    );

  const [language, setLanguage] =
    useState("Python");

  const [code, setCode] =
    useState(starters.Python);

  const [running, setRunning] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [output, setOutput] =
    useState("");

  const [results, setResults] =
    useState<TestResult[]>([]);

  const [secondsLeft, setSecondsLeft] =
    useState(600);

  useEffect(() => {
    loadChallenge();
  }, []);

  useEffect(() => {
    if (
      submitted ||
      secondsLeft <= 0
    )
      return;

    const timer =
      setInterval(() => {
        setSecondsLeft(
          (prev) =>
            prev > 0
              ? prev - 1
              : 0
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [
    submitted,
    secondsLeft,
  ]);

  async function loadChallenge() {
    try {
      const generatedChallenge =
        await createCodingChallenge(
          {
            resume,

            jd,

            difficulty:
              difficulty ||
              "Medium",

            interviewMode:
              true,
          }
        );

      setChallenge(
        generatedChallenge
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function runOne(
    stdin: string
  ) {
    try {
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

      return String(
        data?.run?.stdout ||
          data?.run?.output ||
          ""
      ).trim();
    } catch {
      return "Execution failed";
    }
  }

  async function runTests(
    submit = false
  ) {
    if (!challenge) return;

    try {
      setRunning(true);

      const cases = submit
        ? challenge.testCases
        : challenge.testCases.slice(
            0,
            1
          );

      const nextResults: TestResult[] =
        [];

      for (const testCase of cases) {
        const actualOutput =
          await runOne(
            String(
              testCase.input
            )
          );

        nextResults.push({
          input: String(
            testCase.input
          ),

          expectedOutput:
            String(
              testCase.expectedOutput
            ),

          actualOutput:
            String(
              actualOutput
            ),

          passed:
            String(
              actualOutput
            ).trim() ===
            String(
              testCase.expectedOutput
            ).trim(),
        });
      }

      setResults(nextResults);

      const passed =
        nextResults.filter(
          (r) => r.passed
        ).length;

      setOutput(
        `${passed}/${nextResults.length} test cases passed`
      );

      if (submit) {
        setSubmitted(true);

        if (
          passed ===
          nextResults.length
        ) {
          onSolved(
            `${challenge.title} solved successfully`
          );
        }
      }
    } catch (err) {
      console.error(err);

      setOutput(
        "Execution failed"
      );
    } finally {
      setRunning(false);
    }
  }

  const timerLabel = useMemo(
    () =>
      `${Math.floor(
        secondsLeft / 60
      )}:${String(
        secondsLeft % 60
      ).padStart(2, "0")}`,
    [secondsLeft]
  );

  if (!challenge) {
    return (
      <div className="p-6">
        Loading coding round...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-500 bg-[#0f172a] p-6 text-white shadow-2xl">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            Coding Round
          </h2>

          <p className="mt-2 text-slate-400">
            Solve the coding
            question within
            10 minutes.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-black/30 px-5 py-3">
          <Timer size={20} />

          <span className="text-2xl font-bold">
            {timerLabel}
          </span>
        </div>
      </div>

      {/* QUESTION */}
      <div className="rounded-2xl bg-slate-900 p-6">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold">
            {String(
              challenge.title
            )}
          </h3>

          <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-sm text-emerald-300">
            {
              challenge.difficulty
            }
          </span>
        </div>

        <p className="mt-6 whitespace-pre-wrap leading-8 text-slate-300">
          {typeof challenge.prompt ===
          "string"
            ? challenge.prompt
            : JSON.stringify(
                challenge.prompt,
                null,
                2
              )}
        </p>

        {/* SAMPLE */}
        <div className="mt-8 rounded-xl bg-black/30 p-5">
          <h3 className="text-lg font-bold">
            Sample Test Case
          </h3>

          <div className="mt-4 space-y-4">
            <div>
              <p className="font-semibold">
                Input
              </p>

              <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-3">
{String(
  challenge.testCases?.[0]
    ?.input || ""
)}
              </pre>
            </div>

            <div>
              <p className="font-semibold">
                Output
              </p>

              <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-3">
{String(
  challenge.testCases?.[0]
    ?.expectedOutput ||
    ""
)}
              </pre>
            </div>
          </div>
        </div>

        {/* HIDDEN */}
        <div className="mt-6 rounded-xl border border-dashed border-white/10 p-5">
          <p className="text-slate-400">
            Hidden test cases
            will run during
            submission.
          </p>
        </div>
      </div>

      {/* EDITOR */}
      <div className="mt-6 rounded-2xl bg-slate-900 p-6">
        <div className="mb-5 flex items-center justify-between">
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
            className="rounded-xl bg-slate-800 px-4 py-3"
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

          <div className="rounded-xl bg-slate-800 px-4 py-3 text-sm">
            Status:
            <span className="ml-2 text-emerald-400">
              Ready
            </span>
          </div>
        </div>

        <Monaco
          height="420px"
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

        <div className="mt-6 flex gap-4">
          <button
            onClick={() =>
              runTests(false)
            }
            disabled={running}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3"
          >
            <Play size={18} />
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
            className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-black"
          >
            <Send size={18} />
            Submit
          </button>
        </div>
      </div>

      {/* OUTPUT */}
      <div className="mt-6 rounded-2xl bg-slate-900 p-6">
        <h2 className="text-xl font-bold">
          Output
        </h2>

        <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-black/30 p-4 text-sm text-slate-300">
{String(output)}
        </pre>
      </div>

      {/* RESULTS */}
      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          {results.map(
            (
              result,
              index
            ) => (
              <div
                key={index}
                className="rounded-2xl bg-slate-900 p-5"
              >
                <div className="mb-3 flex items-center gap-3">
                  {result.passed ? (
                    <CheckCircle2
                      className="text-emerald-400"
                      size={20}
                    />
                  ) : (
                    <XCircle
                      className="text-red-400"
                      size={20}
                    />
                  )}

                  <span className="font-semibold">
                    Test Case{" "}
                    {index + 1}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold">
                      Input
                    </p>

                    <pre className="rounded bg-black/30 p-3">
{String(
  result.input
)}
                    </pre>
                  </div>

                  <div>
                    <p className="font-semibold">
                      Expected
                    </p>

                    <pre className="rounded bg-black/30 p-3">
{String(
  result.expectedOutput
)}
                    </pre>
                  </div>

                  <div>
                    <p className="font-semibold">
                      Your Output
                    </p>

                    <pre className="rounded bg-black/30 p-3">
{String(
  result.actualOutput
)}
                    </pre>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
