"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Play,
  Send,
  Terminal,
  Timer,
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

const starters: Record<string, string> = {
  Python:
    "import sys\n\n# Read from stdin and print only the required answer.\n\nprint('')",

  JavaScript:
    "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\n\nconsole.log('');",

  Java:
    'import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println("");\n  }\n}',

  "C++":
    '#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  cout << "";\n  return 0;\n}',

  C: '#include <stdio.h>\nint main(){\n  printf("");\n  return 0;\n}',
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
  onInterviewSubmit?: (summary: string) => void;
}) {
  const [resumeText, setResumeText] =
    useState(initialResume?.summary || "");

  const [jdText, setJdText] =
    useState(initialJd?.summary || "");

  const [experienceLevel, setExperienceLevel] =
    useState("student/fresher");

  const [difficulty, setDifficulty] =
    useState<Difficulty>(initialDifficulty);

  const [challenge, setChallenge] =
    useState<CodingChallenge | null>(null);

  const [language, setLanguage] =
    useState("Python");

  const [code, setCode] =
    useState(starters.Python);

  const [output, setOutput] =
    useState(
      "Run test cases to see output here."
    );

  const [results, setResults] =
    useState<TestResult[]>([]);

  const [review, setReview] =
    useState("");

  const [running, setRunning] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [secondsLeft, setSecondsLeft] =
    useState(0);

  useEffect(() => {
    async function loadChallenge() {
      const generatedChallenge =
        await createCodingChallenge({
          resume: initialResume,
          jd: initialJd,
          difficulty: initialDifficulty,
          interviewMode,
        });

      setChallenge(generatedChallenge);

      setSecondsLeft(
        generatedChallenge.timeLimitSeconds
      );
    }

    loadChallenge();
  }, []);

  useEffect(() => {
    if (!challenge) return;

    if (submitted || secondsLeft <= 0)
      return;

    const timer = window.setInterval(
      () =>
        setSecondsLeft((current) =>
          Math.max(0, current - 1)
        ),
      1000
    );

    return () => window.clearInterval(timer);
  }, [secondsLeft, submitted, challenge]);

  const timerLabel = useMemo(
    () =>
      `${Math.floor(
        secondsLeft / 60
      )}:${String(
        secondsLeft % 60
      ).padStart(2, "0")}`,
    [secondsLeft]
  );

  async function generateChallenge() {
    const resume: ParsedResume = {
      rawText: resumeText,
      summary: resumeText,

      skills:
        resumeText
          .toLowerCase()
          .match(
            /python|javascript|java|c\+\+|sql|dbms|react|api|data structures|algorithms|operating systems/g
          ) || [],

      education: [],

      projects: resumeText
        ? [resumeText]
        : [],
    };

    const jd: JDAnalysis | null = jdText
      ? {
          role: "Coding practice role",

          summary: jdText,

          requiredSkills:
            jdText
              .toLowerCase()
              .match(
                /python|javascript|java|c\+\+|sql|dbms|react|api|data structures|algorithms|operating systems/g
              ) || [],

          missingSkills: [],

          matchPercent: 0,
        }
      : initialJd || null;

    const nextChallenge =
      await createCodingChallenge({
        resume,
        jd,
        difficulty,
        experienceLevel,
        interviewMode,
      });

    setNextChallenge(nextChallenge);
  }

  function setNextChallenge(
    nextChallenge: CodingChallenge
  ) {
    setChallenge(nextChallenge);

    setSecondsLeft(
      nextChallenge.timeLimitSeconds
    );

    setSubmitted(false);

    setResults([]);

    setReview("");

    setOutput(
      "Run test cases to see output here."
    );
  }

  async function parseResumeFile(file: File) {
    const form = new FormData();

    form.append("file", file);

    const response = await fetch(
      "/api/resume/parse",
      {
        method: "POST",
        body: form,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setOutput(
        data.error ||
          "Could not parse resume."
      );

      return;
    }

    setResumeText(
      data.resume.summary ||
        data.resume.rawText ||
        ""
    );

    const nextChallenge =
      await createCodingChallenge({
        resume: data.resume,
        jd: initialJd,
        difficulty,
        experienceLevel,
        interviewMode,
      });

    setNextChallenge(nextChallenge);
  }

  async function runOne(stdin: string) {
    const response = await fetch(
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

    const data = await response.json();

    if (!response.ok)
      return (
        data.error ||
        "Execution failed."
      );

    return String(
      data.run?.stdout ||
        data.run?.output ||
        ""
    ).trim();
  }

  if (!challenge) {
    return (
      <div className="p-6 text-white">
        Loading coding challenge...
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <div className="mb-4 flex items-center gap-3">
        <Timer size={18} />

        <span>{timerLabel}</span>
      </div>

      <h1 className="text-2xl font-bold">
        {challenge.title}
      </h1>

      <p className="mt-2 text-slate-300">
        {challenge.prompt}
      </p>

      <div className="mt-6">
        <Monaco
          height="400px"
          language={
            language === "C++"
              ? "cpp"
              : language.toLowerCase()
          }
          theme="vs-dark"
          value={code}
          onChange={(value) =>
            setCode(value || "")
          }
        />
      </div>

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => runTests(false)}
          disabled={running}
          className="rounded-lg border border-white/10 px-4 py-2"
        >
          <Play size={16} />
        </button>

        <button
          onClick={() => runTests(true)}
          disabled={running || submitted}
          className="rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950"
        >
          <Send size={16} />
        </button>
      </div>

      <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-black p-4">
        {output}
      </pre>
    </div>
  );

  async function runTests(
    markSubmitted = false
  ) {
    setRunning(true);

    try {
      const nextResults: TestResult[] = [];

      for (const testCase of challenge.testCases) {
        const actualOutput =
          await runOne(testCase.input);

        nextResults.push({
          ...testCase,
          actualOutput,

          passed:
            actualOutput.trim() ===
            testCase.expectedOutput.trim(),
        });
      }

      setResults(nextResults);

      const passed = nextResults.filter(
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
          passed === nextResults.length
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
}
