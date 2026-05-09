"use client";

import {
  useEffect,
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
    codingSolved,
    setCodingSolved,
  ] = useState(false);

  const [
    voiceEnabled,
    setVoiceEnabled,
  ] = useState(false);

  const [speaking, setSpeaking] =
    useState(false);

  const [listening, setListening] =
    useState(false);

  const [
    recognition,
    setRecognition,
  ] = useState<any>(null);

  useEffect(() => {
    async function loadPlan() {
      try {
        if (!supabase) return;

        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!user) return;

        const { data } =
          await supabase
            .from("users")
            .select("plan")
            .eq("id", user.id)
            .single();

        if (
          data?.plan === "FREE" ||
          data?.plan === "PRO" ||
          data?.plan ===
            "PREMIUM"
        ) {
          const userPlan =
            data.plan as InterviewPlan;

          setPlan(userPlan);

          setVoiceEnabled(
            userPlan !==
              "FREE"
          );

          setSecondsLeft(
            planDuration[userPlan]
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
        window as any
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
      event: any
    ) => {
      const transcript =
        event.results[0][0]
          .transcript;

      setAnswer(
        transcript
      );

      setTimeout(() => {
        submitAnswer(
          transcript
        );
      }, 1200);
    };

    setRecognition(recog);
  }, []);

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
      resumeFile
    ) {
      parseResume(
        resumeFile
      );
    }
  }, [resumeFile]);

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
        typeof question.question ===
        "string"
          ? question.question
          : "Tell me about yourself."
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

  async function parseResume(
    file: File
  ) {
    try {
      setLoading(
        "Parsing resume..."
      );

      const form =
        new FormData();

      form.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/resume/parse",
          {
            method: "POST",

            body: form,
          }
        );

      const data =
        await response.json();

      setResume({
        rawText:
          data?.resume
            ?.rawText || "",

        skills:
          data?.resume
            ?.skills || [],

        education:
          data?.resume
            ?.education || [],

        projects:
          data?.resume
            ?.projects || [],

        summary:
          data?.resume
            ?.summary || "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading("");
    }
  }

  async function analyzeJd() {
    try {
      setAnalyzing(true);

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

              resume,
            }),
          }
        );

      const data =
        await response.json();

      setJd({
        role:
          data?.analysis?.role ||
          "Software Engineer",

        summary:
          data?.analysis
            ?.summary || "",

        matchPercent:
          data?.analysis
            ?.matchPercent || 0,

        requiredSkills:
          data?.analysis
            ?.requiredSkills ||
          [],

        missingSkills:
          data?.analysis
            ?.missingSkills ||
          [],
      });
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

        asked: [],
      });

    setQuestion(firstQuestion);
  }

  async function skipQuestion() {
    await submitAnswer(
      "I don't know."
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

    setAnswers(nextAnswers);

    setAnswer("");

    const codingRoundsAsked =
  answers.filter(
    (a) =>
      a.questionType ===
      "coding"
  ).length;

if (
  (
    round ===
      "Technical" ||
    round === "Mixed"
  ) &&
  codingRoundsAsked < 3 &&
  answers.length > 0 &&
  answers.length % 3 === 0
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
              }),
            }
          );

        const codingData =
          await codingResponse.json();

        setCodingChallenge(
          codingData.question
        );

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
          jd || {
            role:
              "Software Engineer",

            summary: "",

            matchPercent: 0,

            requiredSkills:
              [],

            missingSkills:
              [],
          },

        difficulty,

        round,

        persona,

        plan,

        asked:
          nextAnswers.map(
            (a) =>
              a.question
          ),
      });

    setQuestion(
      nextQuestion
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

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (user) {
        await supabase
          .from(
            "interview_reports"
          )
          .insert({
            user_id:
              user.id,

            report:
              generatedReport,
          });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCodingSolved() {
    setShowCoding(false);

    setCodingSolved(true);

    const nextQuestion =
      await generateQuestion({
        resume,

        jd:
          jd as JDAnalysis,

        difficulty,

        round,

        persona,

        plan,

        asked:
          answers.map(
            (a) =>
              a.question
          ),
      });

    setQuestion(
      nextQuestion
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
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
            {plan !==
              "FREE" && (
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
                    recognition?.start();
                  }
                }}
              />
            )}

            <InterviewSession
              question={
                question
              }
              answers={
                answers
              }
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
                loading !==
                ""
              }
              secondsLeft={
                secondsLeft
              }
              premium={
                plan ===
                "PREMIUM"
              }
            />

            {interviewStarted && (
              <button
                onClick={
                  finishInterview
                }
                className="rounded-2xl bg-white px-7 py-4 font-black text-slate-950"
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
            handleCodingSolved
          }
        />
      </AppShell>
    </AuthGuard>
  );
}
