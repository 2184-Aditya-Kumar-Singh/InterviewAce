"use client";

import dynamic from "next/dynamic";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Play,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
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
    "import sys\n\nprint('')",

  JavaScript:
    "const fs = require('fs');\nconst input = fs.readFileSync(0,'utf8');\nconsole.log('');",

  Java:
    'import java.util.*;\n\npublic class Main {\n public static void main(String[] args){\n Scanner sc=new Scanner(System.in);\n System.out.println("");\n }\n}',

  "C++":
    '#include <bits/stdc++.h>\nusing namespace std;\n\nint main(){\n cout<<"";\n return 0;\n}',

  C: '#include <stdio.h>\n\nint main(){\n printf("");\n return 0;\n}',
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

  initialDifficulty =
    "Medium",

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

  const [
    loadingQuestion,
    setLoadingQuestion,
  ] = useState(false);

  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadChallenge();
  }, []);

  async function loadChallenge() {
    try {
      setLoadingQuestion(true);

      const generatedChallenge =
        await createCodingChallenge(
          {
            resume:
              initialResume,

            jd: initialJd,

            difficulty:
              initialDifficulty,

            interviewMode,
          }
        );

      setChallenge(
        generatedChallenge
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestion(false);
    }
  }

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('split-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newPos = ((e.clientX - rect.left) / rect.width) * 100;
      
      // Clamp between 30% and 70%
      if (newPos >= 30 && newPos <= 70) {
        setSplitPos(newPos);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  async function generateNewQuestion() {
    await loadChallenge();

    setResults([]);

    setSubmitted(false);

    setOutput(
      "Run code to see output."
    );

    setCode(starters[language]);
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

      if (!response.ok) {
        return (
          data.error ||
          "Execution failed."
        );
      }

      return String(
  data.run?.output ||
  data.run?.stdout ||
  data.run?.stderr ||
  data.compile?.output ||
  data.error ||
  ""
).trim();
    } catch {
      return "Execution failed.";
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
            2
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
        `${passed}/${nextResults.length} test cases passed.`
      );

      if (submit) {
        setSubmitted(true);

        if (
          interviewMode &&
          onInterviewSubmit &&
          passed ===
            nextResults.length
        ) {
          onInterviewSubmit(
            `${String(
              challenge.title
            )} solved successfully`
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
    <div className="min-h-screen bg-[#0f172a] p-6 text-white flex flex-col">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-emerald-400">
            {String(challenge.title)}
          </h2>
        </div>

        <button
          onClick={
            generateNewQuestion
          }
          disabled={
            loadingQuestion
          }
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
        >
          <RefreshCw size={16} />

          {loadingQuestion
            ? "Generating..."
            : "Generate Question"}
        </button>
      </div>

      {/* SPLIT CONTAINER */}
      <div 
        id="split-container"
        className="flex-1 flex gap-0 overflow-hidden"
        style={{ 
          display: 'grid',
          gridTemplateColumns: `${splitPos}% 4px ${100 - splitPos}%`,
          gridTemplateRows: '1fr'
        }}
      >
        {/* LEFT - QUESTION PANEL */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <h1 className="text-3xl font-bold">
              {String(
                challenge.title
              )}
            </h1>

            <p className="mt-4 whitespace-pre-wrap text-lg leading-8 text-slate-300">
              {typeof challenge.prompt ===
              "string"
                ? challenge.prompt
                : JSON.stringify(
                    challenge.prompt,
                    null,
                    2
                  )}
            </p>

            {/* EXAMPLES */}
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-semibold">
                Examples
              </h2>

              <div className="space-y-4">
                {challenge.testCases
                  ?.slice(0, 2)
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
{typeof testCase.input ===
"string"
  ? testCase.input
  : JSON.stringify(
      testCase.input,
      null,
      2
    )}
                            </pre>
                          </div>

                          <div>
                            <p className="font-semibold">
                              Output
                            </p>

                            <pre className="mt-1 overflow-x-auto rounded bg-black/40 p-2">
{typeof testCase.expectedOutput ===
"string"
  ? testCase.expectedOutput
  : JSON.stringify(
      testCase.expectedOutput,
      null,
      2
    )}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )
                  )}
              </div>
            </div>

            {/* CONSTRAINTS */}
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
                  Expected
                  interview-style
                  solution
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div
          onMouseDown={() => setIsDragging(true)}
          className="group relative flex cursor-col-resize items-center justify-center bg-gradient-to-b from-transparent via-white/20 to-transparent hover:via-emerald-400/50 transition-colors"
        >
          <div className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft size={16} className="text-slate-400" />
            <ChevronRight size={16} className="text-slate-400" />
          </div>
        </div>

        {/* RIGHT - CODING PANEL */}
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 flex flex-col overflow-hidden">
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
              className="rounded-lg bg-slate-800 px-3 py-2 text-white"
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
            height="300px"
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
              className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 hover:bg-white/5 disabled:opacity-50"
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
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              <Send size={16} />
              Submit
            </button>
          </div>

          {/* OUTPUT */}
          <div className="mt-4 rounded-xl bg-black/40 p-4 flex-1 overflow-y-auto">
            <p className="mb-3 font-semibold">
              Console Output
            </p>

            <pre className="whitespace-pre-wrap text-sm text-slate-300">
              {String(output)}
            </pre>
          </div>

          {/* RESULTS */}
          {results.length > 0 && (
            <div className="mt-4 space-y-4 max-h-48 overflow-y-auto">
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

                        <pre className="rounded bg-black/40 p-2 overflow-x-auto text-xs">
{String(
  result.input
)}
                        </pre>
                      </div>

                      <div>
                        <p className="font-semibold">
                          Expected
                        </p>

                        <pre className="rounded bg-black/40 p-2 overflow-x-auto text-xs">
{String(
  result.expectedOutput
)}
                        </pre>
                      </div>

                      <div>
                        <p className="font-semibold">
                          Your Output
                        </p>

                        <pre className="rounded bg-black/40 p-2 overflow-x-auto text-xs">
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
      </div>
    </div>
  );
}
