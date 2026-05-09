"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Play, Send, Terminal, Timer, XCircle } from "lucide-react";
import { createCodingChallenge } from "@/lib/coding-challenges";
import type { CodingChallenge, Difficulty, JDAnalysis, ParsedResume } from "@/lib/types";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const starters: Record<string, string> = {
  Python:
    "import sys\n\n# Read from stdin and print only the required answer.\n# Example:\n# data = sys.stdin.read().strip().split()\n\nprint('')",
  JavaScript:
    "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);\n\nconsole.log('');",
  Java:
    "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    System.out.println(\"\");\n  }\n}",
  "C++":
    "#include <bits/stdc++.h>\nusing namespace std;\nint main(){\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  cout << \"\";\n  return 0;\n}",
  C: "#include <stdio.h>\nint main(){\n  printf(\"\");\n  return 0;\n}",
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
  const [resumeText, setResumeText] = useState(initialResume?.summary || "");
  const [jdText, setJdText] = useState(initialJd?.summary || "");
  const [experienceLevel, setExperienceLevel] = useState("student/fresher");
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [challenge, setChallenge] = useState<CodingChallenge>(() =>
    createCodingChallenge({ resume: initialResume, jd: initialJd, difficulty: initialDifficulty, interviewMode }),
  );
  const [language, setLanguage] = useState("Python");
  const [code, setCode] = useState(starters.Python);
  const [output, setOutput] = useState("Run test cases to see output here.");
  const [results, setResults] = useState<TestResult[]>([]);
  const [review, setReview] = useState("");
  const [running, setRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(challenge.timeLimitSeconds);

  useEffect(() => {
    if (submitted || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft, submitted]);

  const timerLabel = useMemo(
    () => `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`,
    [secondsLeft],
  );

  function generateChallenge() {
    const resume: ParsedResume = {
      rawText: resumeText,
      summary: resumeText,
      skills: resumeText.toLowerCase().match(/python|javascript|java|c\+\+|sql|dbms|react|api|data structures|algorithms|operating systems/g) || [],
      education: [],
      projects: resumeText ? [resumeText] : [],
    };
    const jd: JDAnalysis | null = jdText
      ? {
          role: "Coding practice role",
          summary: jdText,
          requiredSkills: jdText.toLowerCase().match(/python|javascript|java|c\+\+|sql|dbms|react|api|data structures|algorithms|operating systems/g) || [],
          missingSkills: [],
          matchPercent: 0,
        }
      : initialJd || null;
    setNextChallenge(createCodingChallenge({ resume, jd, difficulty, experienceLevel, interviewMode }));
  }

  function setNextChallenge(nextChallenge: CodingChallenge) {
    setChallenge(nextChallenge);
    setSecondsLeft(nextChallenge.timeLimitSeconds);
    setSubmitted(false);
    setResults([]);
    setReview("");
    setOutput("Run test cases to see output here.");
  }

  async function parseResumeFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/resume/parse", { method: "POST", body: form });
    const data = await response.json();
    if (!response.ok) {
      setOutput(data.error || "Could not parse resume.");
      return;
    }
    setResumeText(data.resume.summary || data.resume.rawText || "");
    setNextChallenge(createCodingChallenge({ resume: data.resume, jd: initialJd, difficulty, experienceLevel, interviewMode }));
  }

  async function runOne(stdin: string) {
    const response = await fetch("/api/code/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, stdin }),
    });
    const data = await response.json();
    if (!response.ok) return data.error || "Execution failed.";
    return String(data.run?.stdout || data.run?.output || "").trim();
  }

  async function runTests(markSubmitted = false) {
    setRunning(true);
    setOutput("Running test cases...");
    try {
      const nextResults: TestResult[] = [];
      for (const testCase of challenge.testCases) {
        const actualOutput = await runOne(testCase.input);
        nextResults.push({
          ...testCase,
          actualOutput,
          passed: actualOutput.trim() === testCase.expectedOutput.trim(),
        });
      }
      setResults(nextResults);
      const passed = nextResults.filter((item) => item.passed).length;
      setOutput(`${passed}/${nextResults.length} test cases passed.`);
      if (markSubmitted) {
        setSubmitted(true);
        const reviewResponse = await fetch("/api/code/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language, code, prompt: challenge.prompt }),
        });
        const reviewData = await reviewResponse.json();
        const summary = `${challenge.title}: ${passed}/${nextResults.length} tests passed. ${JSON.stringify(reviewData.review)}`;
        setReview(JSON.stringify(reviewData.review, null, 2));
        if (interviewMode && onInterviewSubmit && passed === nextResults.length) onInterviewSubmit(summary);
      }
    } catch {
      setOutput("Could not execute code. Check the code runner and try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!interviewMode && (
        <section className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 lg:grid-cols-[1fr_1fr_auto]">
          <textarea
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            rows={4}
            className="rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm"
            placeholder="Paste resume text or summary"
          />
          <textarea
            value={jdText}
            onChange={(event) => setJdText(event.target.value)}
            rows={4}
            className="rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm"
            placeholder="Paste job description"
          />
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) => event.target.files?.[0] && parseResumeFile(event.target.files[0])}
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              value={experienceLevel}
              onChange={(event) => setExperienceLevel(event.target.value)}
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Experience"
            />
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
              className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >
              {(["Easy", "Medium", "Hard"] as Difficulty[]).map((item) => <option key={item}>{item}</option>)}
            </select>
            <button onClick={generateChallenge} className="rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950">
              Generate question
            </button>
          </div>
        </section>
      )}

      <section className="flex flex-col justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-emerald-200">{challenge.topic} | {challenge.difficulty}</p>
          <h1 className="text-2xl font-semibold">{challenge.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value);
              setCode(starters[event.target.value]);
            }}
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          >
            {Object.keys(starters).map((item) => <option key={item}>{item}</option>)}
          </select>
          <span className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${secondsLeft ? "bg-emerald-400/10 text-emerald-100" : "bg-rose-400/15 text-rose-100"}`}>
            <Timer size={16} />
            {timerLabel}
          </span>
          <button onClick={() => runTests(false)} disabled={running} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 font-semibold disabled:opacity-50">
            <Play size={16} />
            Run tests
          </button>
          <button onClick={() => runTests(true)} disabled={running || submitted} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">
            <Send size={16} />
            {submitted ? "Submitted" : "Submit"}
          </button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[.58fr_1.42fr]">
        <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm leading-6 text-slate-300">{challenge.prompt}</p>
          <div className="mt-5 space-y-3">
            {challenge.testCases.map((testCase, index) => (
              <div key={`${testCase.input}-${index}`} className="rounded-lg bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="font-semibold text-white">Test case {index + 1}</p>
                <pre className="mt-2 whitespace-pre-wrap">Input: {testCase.input}</pre>
                <pre className="mt-2 whitespace-pre-wrap">Expected: {testCase.expectedOutput}</pre>
              </div>
            ))}
          </div>
          {secondsLeft === 0 && (
            <div className="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-50">
              <p className="font-semibold">Time is up. Reference approach:</p>
              <p className="mt-2">{challenge.referenceAnswer}</p>
              <p className="mt-2">{challenge.solutionHint}</p>
            </div>
          )}
        </aside>

        <div className="grid gap-4 lg:grid-rows-[minmax(420px,1fr)_260px]">
          <div className="overflow-hidden rounded-lg border border-white/10">
            <Monaco
              height="100%"
              language={language === "C++" ? "cpp" : language.toLowerCase()}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 }, wordWrap: "on" }}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-[.9fr_1.1fr]">
            <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
              <p className="text-sm font-medium text-slate-300">Test results</p>
              <div className="mt-3 space-y-2">
                {results.length ? results.map((item, index) => (
                  <div key={`${item.input}-${index}`} className="flex items-center justify-between rounded-lg bg-black/30 p-3 text-sm">
                    <span>Case {index + 1}: expected {item.expectedOutput}, got {item.actualOutput || "(empty)"}</span>
                    {item.passed ? <CheckCircle2 className="text-emerald-300" size={18} /> : <XCircle className="text-rose-300" size={18} />}
                  </div>
                )) : <p className="text-sm text-slate-400">No tests run yet.</p>}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                <Terminal size={16} />
                Output console
              </div>
              <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-6 text-slate-200">
                {output}
              </pre>
            </div>
          </div>
          {review && (
            <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
              <p className="text-sm font-semibold text-emerald-100">AI code review</p>
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-5 text-emerald-50">
                {review}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
