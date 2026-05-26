"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { AppShell } from "@/components/AppShell";

import { AuthGuard } from "@/components/AuthGuard";

import { InterviewerAvatar } from "@/components/InterviewerAvatar";

import { supabase } from "@/lib/supabase";

import {
  generateQuestion,
  createInterviewReport,
} from "@/lib/interview-engine";

import type {
  Difficulty,
  InterviewAnswer,
  InterviewPlan,
  InterviewPersona,
  InterviewQuestion,
  InterviewReport as ReportType,
  InterviewRound,
  JDAnalysis,
  ParsedResume,
  CodingChallenge,
  CodeReview,
} from "@/lib/types";

import { InterviewSetup } from "./components/InterviewSetup";

import { InterviewSession } from "./components/InterviewSession";

import { InterviewCodingModal } from "./components/InterviewCodingModal";

import { InterviewReport } from "./components/InterviewReport";

const blankResume: ParsedResume =
  {
    rawText: "",
    skills: [],
    education: [],
    projects: [],
    summary: "",
  };

const planDuration: Record<
  InterviewPlan,
  number
> = {
  FREE: 900,
  PRO: 1800,
  PREMIUM: 2700,
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult:
    | ((
        event: {
          results: {
            [index: number]: {
              [index: number]: {
                transcript: string;
              };
            };
          };
        }
      ) => void)
    | null;
  start: () => void;
};

const historyLimit = 80;

function getHistory(
  kind: "interview" | "coding"
) {
  if (
    typeof window ===
    "undefined"
  )
    return [];

  try {
    const value =
      window.localStorage.getItem(
        `interviewace:${kind}-question-history`
      );

    const parsed =
      JSON.parse(value || "[]");

    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            typeof item ===
            "string"
        )
      : [];
  } catch {
    return [];
  }
}

function rememberQuestion(
  kind: "interview" | "coding",
  questionText: string
) {
  if (
    typeof window ===
      "undefined" ||
    !questionText.trim()
  )
    return;

  const key = `interviewace:${kind}-question-history`;
  const normalized =
    questionText
      .toLowerCase()
      .replace(
        /[^a-z0-9\s]/g,
        " "
      )
      .replace(/\s+/g, " ")
      .trim();

  const existing =
    getHistory(kind);

  const next = [
    questionText,
    ...existing.filter(
      (item) =>
        item
          .toLowerCase()
          .replace(
            /[^a-z0-9\s]/g,
            " "
          )
          .replace(/\s+/g, " ")
          .trim() !==
        normalized
    ),
  ].slice(0, historyLimit);

  window.localStorage.setItem(
    key,
    JSON.stringify(next)
  );
}

export default function InterviewPage() {
  const [resume, setResume] =
    useState<ParsedResume>(
      blankResume
    );

  const [
    resumeFile,
    setResumeFile,
  ] = useState<File | null>(
    null
  );

  const [jdText, setJdText] =
    useState("");

  const [jd, setJd] =
    useState<JDAnalysis | null>(
      null
    );

  const [plan, setPlan] =
    useState<InterviewPlan>(
      "FREE"
    );

  const [difficulty, setDifficulty] =
    useState<Difficulty>(
      "Medium"
    );

  const [round, setRound] =
    useState<InterviewRound>(
      "Technical"
    );

  const [persona, setPersona] =
    useState<InterviewPersona>(
      "Friendly HR"
    );

  const [loading, setLoading] =
    useState("");

  const [analyzing, setAnalyzing] =
    useState(false);

  const [
    interviewStarted,
    setInterviewStarted,
  ] = useState(false);

  const [question, setQuestion] =
    useState<InterviewQuestion | null>(
      null
    );

  const [answer, setAnswer] =
    useState("");

  const [answers, setAnswers] =
    useState<
      InterviewAnswer[]
    >([]);

  const [report, setReport] =
    useState<ReportType | null>(
      null
    );

  const [
    secondsLeft,
    setSecondsLeft,
  ] = useState(1800);

  const [
    showCoding,
    setShowCoding,
  ] = useState(false);

  const [
    codingChallenge,
    setCodingChallenge,
  ] =
    useState<CodingChallenge | null>(
      null
    );

  const [
    voiceEnabled,
    setVoiceEnabled,
  ] = useState(false);

  const [speaking, setSpeaking] =
    useState(false);

  const [listening, setListening] =
    useState(false);

  const recognitionRef =
    useRef<SpeechRecognitionLike | null>(
      null
    );

  useEffect(() => {
    async function loadPlan() {
      try {
        const authResponse =
  await supabase?.auth.getUser();

const user =
  authResponse?.data?.user;

        if (!user) return;

        const response =
  await supabase?.
    from("users")
    .select("plan")
    .eq("id", user.id)
    .single();

const data =
  response?.data;

        if (
          data?.plan === "FREE" ||
          data?.plan === "PRO" ||
          data?.plan ===
            "PREMIUM"
        ) {
          setPlan(data.plan);

          setVoiceEnabled(
            data.plan !==
              "FREE" &&
              data.plan !==
                "PRO"
          );

          setSecondsLeft(
            planDuration[
              data.plan as InterviewPlan
            ]
          );
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadPlan();
  }, []);

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    )
      return;

    if (
      !(
        "webkitSpeechRecognition" in
        window
      )
    )
      return;

    const SpeechRecognition =
      (
        window as Window &
          typeof globalThis & {
            webkitSpeechRecognition: new () => SpeechRecognitionLike;
          }
      )
        .webkitSpeechRecognition;

    const recog =
      new SpeechRecognition();

    recog.continuous =
      false;

    recog.interimResults =
      false;

    recog.lang = "en-US";

    recog.onstart = () =>
      setListening(true);

    recog.onend = () =>
      setListening(false);

    recog.onresult = (
      event: {
        results: {
          [index: number]: {
            [index: number]: {
              transcript: string;
            };
          };
        };
      }
    ) => {
      const transcript =
        event.results[0][0]
          .transcript;

      setAnswer(
        transcript
      );

      if (
        plan ===
        "PREMIUM"
      ) {
        setTimeout(() => {
          submitAnswer(
            transcript
          );
        }, 1200);
      }
    };

    recognitionRef.current =
      recog;
  }, [plan]);

  useEffect(() => {
    if (!interviewStarted)
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
  }, [interviewStarted]);

  useEffect(() => {
    if (
      !voiceEnabled ||
      !question
    )
      return;

    if (
      plan === "FREE"
    )
      return;

    speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        question.question
      );

    utterance.rate = 1;

    utterance.pitch = 1;

    utterance.onstart =
      () =>
        setSpeaking(
          true
        );

    utterance.onend =
      () =>
        setSpeaking(
          false
        );

    speechSynthesis.speak(
      utterance
    );
  }, [
    question,
    voiceEnabled,
    plan,
  ]);

  async function analyzeJd() {
    try {
      setAnalyzing(true);

      let currentResume =
        resume;

      if (resumeFile) {
        const formData =
          new FormData();

        formData.append(
          "file",
          resumeFile
        );

        const resumeResponse =
          await fetch(
            "/api/resume/parse",
            {
              method: "POST",
              body: formData,
            }
          );

        const resumeData =
          await resumeResponse.json();

        if (
          resumeResponse.ok &&
          resumeData?.resume
        ) {
          currentResume =
            resumeData.resume;

          setResume(
            currentResume
          );
        }
      }

      const response =
        await fetch(
          "/api/jd/analyze",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              jdText,
              resume:
                currentResume,
            }),
          }
        );

      const data =
        await response.json();

      setJd(
        data.analysis
      );
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  }

  async function startInterview() {
    if (!jd) {
      alert(
        "Please analyze JD first."
      );

      return;
    }

    setInterviewStarted(true);

    const firstQuestion =
      await generateQuestion({
        resume,
        jd,
        difficulty,
        round,
        persona,
        plan,
        asked:
          getHistory(
            "interview"
          ),
      });

    setQuestion(firstQuestion);

    rememberQuestion(
      "interview",
      firstQuestion.question
    );
  }

  async function submitAnswer(
    customAnswer?: string
  ) {
    if (!question) return;

    const finalAnswer =
      customAnswer ||
      answer;

    const nextAnswers = [
      ...answers,

      {
        questionId:
          question.id,

        question:
          question.question,

        answer:
          finalAnswer,

        secondsSpent: 0,

        round:
          question.round,

        expectedSignals:
          question.expectedSignals,
      },
    ];

    rememberQuestion(
      "interview",
      question.question
    );

    setAnswers(nextAnswers);

    setAnswer("");

    const codingRoundsAsked =
      nextAnswers.filter(
        (a) =>
          a.questionType ===
          "coding"
      ).length;

    const codingLimit =
      plan === "FREE"
        ? 0
        : difficulty === "Hard"
        ? 3
        : 2;

    const shouldAskCoding =
      codingLimit > 0 &&
      (
        round ===
          "Technical" ||
        round === "Mixed"
      ) &&
      codingRoundsAsked <
        codingLimit &&
      nextAnswers.filter(
        (a) =>
          a.questionType !==
          "coding"
      ).length %
        3 ===
        0;

    if (
      shouldAskCoding
    ) {
      try {
        const codingResponse =
          await fetch(
            "/api/code",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                role:
                  jd?.role ||
                  "Software Engineer",

                skills:
                  jd?.requiredSkills ||
                  [],

                difficulty,

                experienceLevel:
                  "Intermediate",

                avoidedQuestions:
                  getHistory(
                    "coding"
                  ),
              }),
            }
          );

        const codingData =
          await codingResponse.json();

        setCodingChallenge(
          codingData.question
        );

        if (
          codingData.question
        ) {
          rememberQuestion(
            "coding",
            `${codingData.question.title}\n${codingData.question.prompt}`
          );
        }

        setShowCoding(true);

        return;
      } catch (err) {
        console.error(err);
      }
    }

    const nextQuestion =
      await generateQuestion({
        resume,

        jd:
          jd as JDAnalysis,

        difficulty,

        round,

        persona,

        plan,

        asked: [
          ...getHistory(
            "interview"
          ),
          ...nextAnswers.map(
            (a) =>
              a.question
          ),
        ],
      });

    setQuestion(
      nextQuestion
    );

    rememberQuestion(
      "interview",
      nextQuestion.question
    );
  }

  async function skipQuestion() {
    await submitAnswer(
      "I don't know"
    );
  }

  async function finishInterview() {
    const generatedReport =
      await createInterviewReport(
        {
          answers,
          difficulty,
          jd:
            jd ||
            undefined,
          resume,
        }
      );

    setReport(
      generatedReport
    );

    // Stop the interview
    setInterviewStarted(false);

    try {
      const authResponse =
  await supabase?.auth.getUser();

const user =
  authResponse?.data?.user;

      if (!user) return;

      const reportPayload =
        {
          report:
            generatedReport,

          answers,

          difficulty,

          role:
            jd?.role ||
            "Software Engineer",

          createdAt:
            new Date().toISOString(),
        };

      const reportsKey = `interviewace:reports:${user.id}`;

      const lastReportKey = `interviewace:last-report:${user.id}`;

      const existingReports =
        JSON.parse(
          window.localStorage.getItem(
            reportsKey
          ) || "[]"
        );

      existingReports.unshift(
        reportPayload
      );

      window.localStorage.setItem(
        reportsKey,
        JSON.stringify(
          existingReports
        )
      );

      window.sessionStorage.setItem(
        lastReportKey,
        JSON.stringify(
          reportPayload
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCodingSubmitted(
    result: {
      challenge: CodingChallenge;
      code: string;
      language: string;
      review: CodeReview | null;
    }
  ) {
    setShowCoding(false);

    const review =
      result.review;

    const codingAnswer:
      InterviewAnswer = {
        questionId:
          crypto.randomUUID(),

        question:
          `${result.challenge.title}\n\n${result.challenge.prompt}`,

        answer:
          `Language: ${result.language}\n\n${result.code}`,

        secondsSpent: 0,

        round:
          "Technical",

        questionType:
          "coding",

        expectedSignals: [
          "correctness",
          "edge cases",
          "time complexity",
          "readability",
        ],

        codeReview:
          review ||
          undefined,

        codingLanguage:
          result.language,
      };

    const nextAnswers = [
      ...answers,
      codingAnswer,
    ];

    rememberQuestion(
      "coding",
      `${result.challenge.title}\n${result.challenge.prompt}`
    );

    setAnswers(nextAnswers);

    const nextQuestion =
      await generateQuestion({
        resume,

        jd:
          jd as JDAnalysis,

        difficulty,

        round,

        persona,

        plan,

        asked: [
          ...getHistory(
            "interview"
          ),
          ...nextAnswers.map(
            (a) =>
              a.question
          ),
        ],
      });

    setQuestion(
      nextQuestion
    );

    rememberQuestion(
      "interview",
      nextQuestion.question
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <InterviewSetup
              resumeFile={
                resumeFile
              }
              setResumeFile={
                setResumeFile
              }
              jdText={jdText}
              setJdText={
                setJdText
              }
              difficulty={
                difficulty
              }
              setDifficulty={
                setDifficulty
              }
              round={round}
              setRound={
                setRound
              }
              plan={plan}
              setPlan={setPlan}
              persona={
                persona
              }
              setPersona={
                setPersona
              }
              parsedResume={
                resume
              }
              onAnalyze={
                analyzeJd
              }
              onStart={
                startInterview
              }
              loading={
                loading !==
                ""
              }
              analyzing={
                analyzing
              }
            />
          </div>

          <div className="space-y-6">
            {plan ===
              "PREMIUM" && (
              <InterviewerAvatar
                persona={
                  persona
                }
                speaking={
                  speaking
                }
                listening={
                  listening
                }
                ttsEnabled={
                  voiceEnabled
                }
                variant={
                  plan ===
                  "PREMIUM"
                    ? "call"
                    : "compact"
                }
                onToggleTts={() =>
                  setVoiceEnabled(
                    !voiceEnabled
                  )
                }
                onStartListening={() => {
                  if (
                    plan ===
                    "PREMIUM"
                  ) {
                    recognitionRef.current?.start();
                  }
                }}
              />
            )}

            <InterviewSession
              question={
                question
              }
              answers={answers}
              answer={answer}
              setAnswer={
                setAnswer
              }
              onSubmit={() =>
                submitAnswer()
              }
              onSkip={
                skipQuestion
              }
              loading={
                loading !== ""
              }
              secondsLeft={
                secondsLeft
              }
              premium={
                plan ===
                "PREMIUM"
              }
              listening={
                listening
              }
              speaking={
                speaking
              }
            />

            {interviewStarted && (
              <button
                onClick={
                  finishInterview
                }
                className="rounded-2xl bg-white px-7 py-4 font-black text-slate-950 w-full hover:bg-gray-100 transition"
              >
                Finish Interview
              </button>
            )}

            <InterviewReport
              report={report}
              plan={plan}
            />
          </div>
        </div>

        <InterviewCodingModal
          open={showCoding}
          challenge={
            codingChallenge
          }
          onClose={() =>
            setShowCoding(
              false
            )
          }
          onSolved={
            handleCodingSubmitted
          }
        />
      </AppShell>
    </AuthGuard>
  );
}
