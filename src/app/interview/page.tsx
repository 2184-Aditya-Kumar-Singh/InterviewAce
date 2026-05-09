"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, Mic, MicOff } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { CodingWorkspace } from "@/components/CodingWorkspace";
import { InterviewerAvatar } from "@/components/InterviewerAvatar";
import type {
  Difficulty,
  InterviewAnswer,
  InterviewPlan,
  InterviewPersona,
  InterviewQuestion,
  InterviewReport,
  InterviewRound,
  JDAnalysis,
  ParsedResume,
} from "@/lib/types";

const blankResume: ParsedResume = { rawText: "", skills: [], education: [], projects: [], summary: "" };
const planRank: Record<InterviewPlan, number> = { FREE: 0, PRO: 1, PREMIUM: 2 };
const planDuration: Record<InterviewPlan, number> = { FREE: 600, PRO: 1800, PREMIUM: 1800 };

function getSavedPlan(): InterviewPlan {
  return "FREE";
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
  stop: () => void;
};

export default function InterviewPage() {
  const router = useRouter();
  const [resume, setResume] = useState<ParsedResume>(blankResume);
  const [jdText, setJdText] = useState("");
  const [jd, setJd] = useState<JDAnalysis | null>(null);
  const [plan, setPlan] = useState<InterviewPlan>(() => getSavedPlan());
  const [subscribedPlan] = useState<InterviewPlan>(() => getSavedPlan());
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [round, setRound] = useState<InterviewRound>("Technical");
  const [persona, setPersona] = useState<InterviewPersona>("Friendly HR");
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [codeAnswer, setCodeAnswer] = useState("");
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(() => (getSavedPlan() === "FREE" ? 600 : 1800));
  const [loading, setLoading] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const premiumVoiceOnly = plan === "PREMIUM";
useEffect(() => {
  async function loadPlan() {
    try {
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("plan")
        .eq("id", user.id)
        .single();

      if (
        data?.plan === "FREE" ||
        data?.plan === "PRO" ||
        data?.plan === "PREMIUM"
      ) {
        setPlan(data.plan);
        setSecondsLeft(
          planDuration[data.plan]
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  loadPlan();
}, []);
  useEffect(() => {
    if (!question || report || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [question, report, secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0 && question && !report) {
      finishInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, question, report]);

  async function parseResume(file: File) {
    setLoading("Parsing resume...");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/resume/parse", { method: "POST", body: form });
    const data = await response.json();
    setResume(data.resume);
    setLoading("");
  }

  async function analyzeJd() {
    setLoading("Analyzing JD...");
    const response = await fetch("/api/jd/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jdText, resume }),
    });
    const data = await response.json();
    setJd(data.analysis);
    setLoading("");
  }

  function speak(text: string) {
    if (!ttsEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const softerVoice = voices.find((voice) => /female|zira|heera|susan|google uk english/i.test(voice.name));
    if (softerVoice) utterance.voice = softerVoice;
    utterance.rate = persona === "Strict Technical Lead" ? 0.95 : persona === "Corporate Manager" ? 0.98 : 1.02;
    utterance.pitch = persona === "Strict Technical Lead" ? 1.02 : persona === "Corporate Manager" ? 1.06 : 1.12;
    utterance.volume = 0.92;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function startVoiceAnswer() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAnswer((current) => current || "Voice recognition is not available in this browser. Please use Chrome or Edge for Premium voice-only interviews.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || "")
        .join(" ");
      setAnswer(transcript.trim());
    };
    recognition.start();
  }

  async function nextQuestion(savedAnswer?: string) {
    if (!jd) return;
    const currentAnswer = question?.type === "coding" ? savedAnswer ?? codeAnswer : savedAnswer;
    const nextAnswers =
      question && savedAnswer !== undefined
        ? [
            ...answers,
            {
              questionId: question.id,
              question: question.question,
              answer: currentAnswer || "",
              secondsSpent: planDuration[plan] - secondsLeft,
              round: question.round,
              questionType: question.type,
              expectedSignals: question.expectedSignals,
            },
          ]
        : answers;
    if (question && savedAnswer !== undefined) {
      setAnswers(nextAnswers);
    }
    setAnswer("");
    setCodeAnswer("");
    setLoading("Preparing question...");
    const shouldAskCoding = plan !== "FREE" && nextAnswers.length > 0 && (nextAnswers.length + 1) % 3 === 0;
    const askedForRequest = nextAnswers.map((item) => item.question);
    const response = await fetch("/api/interview/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, jd, difficulty, round, persona, plan, asked: askedForRequest }),
    });
    const data = await response.json();
    const next = {
      ...data.question,
      type: shouldAskCoding ? "coding" : "voice",
      question: shouldAskCoding ? "This is the coding checkpoint in the middle of the interview." : data.question.question,
      codingPrompt: shouldAskCoding ? "Solve the coding task below. You have 15 minutes. When all test cases pass and you submit, the interview will continue automatically." : undefined,
    } satisfies InterviewQuestion;
    setQuestion(next);
    speak(shouldAskCoding ? `Coding round. Please solve the coding task shown below. You have fifteen minutes.` : next.question);
    setLoading("");
  }

  async function finishInterview() {
    const finalAnswers = question
      ? [
          ...answers,
          {
            questionId: question.id,
            question: question.question,
            answer: question.type === "coding" ? codeAnswer : answer,
            secondsSpent: planDuration[plan] - secondsLeft,
            round: question.round,
            questionType: question.type,
            expectedSignals: question.expectedSignals,
          },
        ]
      : answers;
    setAnswers(finalAnswers);
    setLoading("Scoring interview...");
    const response = await fetch("/api/interview/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: finalAnswers, difficulty, jd, resume }),
    });
    const data = await response.json();
    setReport(data.report);
    const storedReport = {
      id: crypto.randomUUID(),
      report: data.report,
      answers: finalAnswers,
      difficulty,
      role: jd?.role || "Mock interview",
      createdAt: new Date().toISOString(),
    };
    const {
  data: { user },
} = await supabase.auth.getUser();

if (user) {
  const reportsKey = `interviewace:reports:${user.id}`;
  const lastReportKey = `interviewace:last-report:${user.id}`;

  window.sessionStorage.setItem(
    lastReportKey,
    JSON.stringify(storedReport)
  );

  const history = JSON.parse(
    window.localStorage.getItem(reportsKey) || "[]"
  ) as typeof storedReport[];

  window.localStorage.setItem(
    reportsKey,
    JSON.stringify(
      [storedReport, ...history].slice(0, 25)
    )
  );
}
    setLoading("");
    window.speechSynthesis?.cancel();
    router.push("/reports");
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
          <section className="space-y-5">
            <div className="glass rounded-lg p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">Interview setup</h1>
                  <p className="mt-2 text-sm text-slate-300">
                    Premium runs like a voice interview call with a visible AI interviewer and coding checkpoints.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                  {round} | {difficulty}
                </span>
              </div>
              <label className="mt-5 block text-sm text-slate-300">Resume PDF/DOCX</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) => event.target.files?.[0] && parseResume(event.target.files[0])}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
              />
              <label className="mt-5 block text-sm text-slate-300">Job description</label>
              <textarea
                value={jdText}
                onChange={(event) => setJdText(event.target.value)}
                rows={7}
                className="focus-ring mt-2 w-full rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm text-white"
                placeholder="Paste JD here..."
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {(["FREE", "PRO", "PREMIUM"] as InterviewPlan[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      if (planRank[subscribedPlan] < planRank[item]) return;
                      setPlan(item);
                      setSecondsLeft(planDuration[item]);
                    }}
                    disabled={planRank[subscribedPlan] < planRank[item]}
                    className={`rounded-lg px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                      plan === item ? "bg-sky-300 text-slate-950" : "bg-white/10"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Your {subscribedPlan} subscription includes {subscribedPlan === "PREMIUM" ? "Premium, Pro, and Free" : subscribedPlan === "PRO" ? "Pro and Free" : "Free"} modes.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(["Easy", "Medium", "Hard"] as Difficulty[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setDifficulty(item)}
                    className={`rounded-lg px-4 py-2 text-sm ${difficulty === item ? "bg-emerald-400 text-slate-950" : "bg-white/10"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <label className="mt-5 block text-sm text-slate-300">Interview round</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {(["Technical", "HR", "Mixed"] as InterviewRound[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setRound(item);
                      if (item === "Technical") setPersona("Strict Technical Lead");
                      if (item === "HR") setPersona("Friendly HR");
                    }}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${
                      round === item
                        ? "border-sky-200 bg-sky-300 text-slate-950"
                        : "border-white/10 bg-white/5 text-slate-200"
                    }`}
                  >
                    <span className="block font-semibold">{item}</span>
                    <span className={round === item ? "text-xs text-slate-800" : "text-xs text-slate-400"}>
                      {item === "Technical" ? "DSA, architecture, debugging" : item === "HR" ? "Behavioral and culture fit" : "Alternates both styles"}
                    </span>
                  </button>
                ))}
              </div>
              <label className="mt-5 block text-sm text-slate-300">Interviewer persona</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {(["Friendly HR", "Strict Technical Lead", "Corporate Manager"] as InterviewPersona[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => setPersona(item)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${
                      persona === item
                        ? "border-emerald-300 bg-emerald-400 text-slate-950"
                        : "border-white/10 bg-white/5 text-slate-200"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button onClick={analyzeJd} className="mt-5 w-full rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 sm:w-auto">
                Analyze JD
              </button>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <h2 className="font-semibold">Editable parsed preview</h2>
              <textarea
                value={resume.summary}
                onChange={(event) => setResume({ ...resume, summary: event.target.value })}
                rows={4}
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm"
                placeholder="Parsed resume summary appears here."
              />
              <p className="mt-3 text-sm text-slate-300">Skills: {resume.skills.join(", ") || "Upload a resume to extract skills."}</p>
              {jd && (
                <div className="mt-4 rounded-lg bg-emerald-400/10 p-4 text-sm text-emerald-50">
                  <p className="font-semibold">{jd.role} match: {jd.matchPercent}%</p>
                  <p className="mt-1">Required: {jd.requiredSkills.join(", ")}</p>
                  <p className="mt-1">Missing: {jd.missingSkills.join(", ") || "No major gaps detected."}</p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            {plan === "FREE" ? (
              <div className="rounded-lg border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                Premium avatar mode is off on Free. Browser voice questions still work when supported.
              </div>
            ) : (
              <InterviewerAvatar
                persona={persona}
                speaking={speaking}
                listening={listening}
                ttsEnabled={ttsEnabled}
                variant={premiumVoiceOnly ? "call" : "compact"}
                onToggleTts={() => {
                  if (ttsEnabled) window.speechSynthesis?.cancel();
                  setTtsEnabled((value) => !value);
                  setSpeaking(false);
                }}
              />
            )}
            <div className="glass rounded-lg p-4 sm:p-5">
            <div className="sticky top-[73px] z-10 -mx-4 -mt-4 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/90 p-4 backdrop-blur sm:static sm:mx-0 sm:mt-0 sm:border-b-0 sm:bg-transparent sm:p-0">
              <div>
                <p className="text-sm text-slate-400">Timer</p>
                <p className="text-3xl font-semibold">{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</p>
              </div>
              <button
                disabled={!jd}
                onClick={() => nextQuestion()}
                className="rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 disabled:opacity-40"
              >
                Start
              </button>
            </div>

            {loading && <p className="mt-5 rounded-lg bg-white/10 p-3 text-sm text-slate-200">{loading}</p>}
            {question && !report && (
              <div className="mt-6">
                <p className="text-sm text-emerald-200">{question.focusArea}</p>
                <h2 className="mt-2 text-2xl font-semibold leading-snug">{question.question}</h2>
                {question.type === "coding" ? (
                  <div className="mt-5">
                    <div className="rounded-lg border border-sky-300/30 bg-sky-300/10 p-4 text-sm leading-6 text-sky-50">
                      <div className="flex items-center gap-2 font-semibold">
                        <Code2 size={18} />
                        Coding question
                      </div>
                      <p className="mt-2">{question.codingPrompt}</p>
                    </div>
                    <div className="mt-4">
                      <CodingWorkspace
                        initialResume={resume}
                        initialJd={jd}
                        initialDifficulty={difficulty}
                        interviewMode
                        onInterviewSubmit={(summary) => {
                          setCodeAnswer(summary);
                          nextQuestion(summary);
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-5">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={startVoiceAnswer}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 font-semibold ${
                          listening ? "bg-rose-400 text-slate-950" : "bg-emerald-400 text-slate-950"
                        }`}
                      >
                        {listening ? <MicOff size={18} /> : <Mic size={18} />}
                        {listening ? "Stop listening" : "Answer by voice"}
                      </button>
                      <span className="rounded-lg border border-white/10 px-4 py-3 text-sm text-slate-300">
                        {premiumVoiceOnly ? "Premium answers are captured by microphone only." : "Speech is required when supported. Text below is transcript/fallback."}
                      </span>
                    </div>
                    {premiumVoiceOnly ? (
                      <div className="mt-4 min-h-44 rounded-lg border border-emerald-300/20 bg-slate-950/70 p-4 text-base leading-7 text-slate-100">
                        {answer || "Your spoken answer transcript will appear here after you speak."}
                      </div>
                    ) : (
                      <textarea
                        value={answer}
                        onChange={(event) => setAnswer(event.target.value)}
                        rows={8}
                        className="mt-4 min-h-52 w-full rounded-lg border border-white/10 bg-slate-950/70 p-4 text-base leading-7 sm:text-sm"
                        placeholder="Your spoken transcript appears here..."
                      />
                    )}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  {question.type !== "coding" && (
                    <button onClick={() => nextQuestion(answer)} className="flex-1 rounded-lg bg-emerald-400 px-4 py-3 font-semibold text-slate-950 sm:flex-none">
                      Save and next
                    </button>
                  )}
                  <button onClick={finishInterview} className="flex-1 rounded-lg border border-white/10 px-4 py-3 font-semibold sm:flex-none">
                    End interview
                  </button>
                </div>
              </div>
            )}

            {report && (
              <div className="mt-6 space-y-4">
                <h2 className="text-2xl font-semibold">Score report</h2>
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    ["Overall", report.overallScore],
                    ["Technical", report.technicalScore],
                    ["Communication", report.communicationScore],
                    ["Confidence", report.confidenceEstimate],
                  ].map(([label, score]) => (
                    <div key={label} className="rounded-lg bg-white p-4 text-slate-950">
                      <p className="text-sm text-slate-600">{label}</p>
                      <p className="text-3xl font-semibold">{score}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <List title="Strengths" items={report.strengths} />
                  <List title="Weaknesses" items={report.weaknesses} />
                </div>
                <List title="7 day improvement roadmap" items={report.roadmap} />
              </div>
            )}
            </div>
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-300">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
