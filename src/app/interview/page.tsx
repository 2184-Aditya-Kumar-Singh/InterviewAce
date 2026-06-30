"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AppShell } from "@/components/AppShell";

import { AuthGuard } from "@/components/AuthGuard";

import { Avatar } from "@/components/interview/Avatar";
import { Microphone } from "@/components/interview/Microphone";
import {
  StatusIndicator,
} from "@/components/interview/StatusIndicator";
import {
  Transcript,
  type TranscriptItem,
} from "@/components/interview/Transcript";

import { supabase } from "@/lib/supabase";

import {
  generateQuestion,
  createInterviewReport,
} from "@/lib/interview-engine";
import { getHeyGenAvatarProfile } from "@/lib/heygen/avatar";
import { useAvatar } from "@/hooks/useAvatar";
import { useInterview } from "@/hooks/useInterview";

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
  FREE: 120,
  PRO: 120,
  PREMIUM: 120,
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
          resultIndex?: number;
          results: {
            length: number;
            [index: number]: {
              isFinal?: boolean;
              [index: number]: {
                transcript: string;
              };
            };
          };
        }
      ) => void)
    | null;
  start: () => void;
  stop: () => void;
};

const historyLimit = 80;
const voiceAutoSubmitDelayMs =
  7000;

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
    setupMessage,
    setSetupMessage,
  ] = useState("");

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
  ] = useState(120);

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

  const voiceAnswerRef =
    useRef("");

  const voiceSubmitTimerRef =
    useRef<number | null>(null);

  const keepListeningRef =
    useRef(false);

  const lastSpokenQuestionIdRef =
    useRef<string | null>(null);

  const avatarProfile =
    useMemo(
      () =>
        getHeyGenAvatarProfile(
          persona,
          round
        ),
      [persona, round]
    );

  const interview =
    useInterview();

  const avatar =
    useAvatar(
      avatarProfile,
      plan === "PREMIUM" &&
        interviewStarted
    );

  const [
    transcript,
    setTranscript,
  ] = useState<TranscriptItem[]>(
    []
  );

  function addTranscript(
    speaker:
      | "interviewer"
      | "candidate",
    text: string
  ) {
    setTranscript((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        speaker,
        text,
      },
    ]);
  }

  function clearVoiceSubmitTimer() {
    if (
      voiceSubmitTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        voiceSubmitTimerRef.current
      );
      voiceSubmitTimerRef.current =
        null;
    }
  }

  function scheduleVoiceSubmit(
    nextAnswer: string
  ) {
    clearVoiceSubmitTimer();

    voiceSubmitTimerRef.current =
      window.setTimeout(() => {
        const finalAnswer =
          voiceAnswerRef.current.trim() ||
          nextAnswer.trim();

        if (!finalAnswer) {
          return;
        }

        keepListeningRef.current =
          false;
        recognitionRef.current?.stop();
        submitAnswer(finalAnswer);
      }, voiceAutoSubmitDelayMs);
  }

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
      true;

    recog.interimResults =
      true;

    recog.lang = "en-US";

    recog.onstart = () =>
      {
        setListening(true);
        interview.transitionTo(
          "LISTENING"
        );
        avatar.showListening();
      };

    recog.onend = () =>
      {
        setListening(false);
        avatar.stopListening();

        if (
          keepListeningRef.current &&
          plan === "PREMIUM" &&
          interviewStarted &&
          !avatar.isSpeaking &&
          loading === ""
        ) {
          window.setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch (error) {
              console.error(error);
            }
          }, 450);
        }
      };

    recog.onresult = (
        event: {
          resultIndex?: number;
          results: {
            length: number;
            [index: number]: {
              isFinal?: boolean;
              [index: number]: {
                transcript: string;
              };
          };
        };
      }
    ) => {
      let finalText = "";
      let interimText = "";
      const startIndex =
        event.resultIndex || 0;

      for (
        let index = startIndex;
        index < event.results.length;
        index += 1
      ) {
        const result =
          event.results[index];
        const text =
          result[0]?.transcript || "";

        if (result.isFinal) {
          finalText += ` ${text}`;
        } else {
          interimText += ` ${text}`;
        }
      }

      if (finalText.trim()) {
        voiceAnswerRef.current =
          `${voiceAnswerRef.current} ${finalText}`
            .replace(/\s+/g, " ")
            .trim();
      }

      const visibleTranscript =
        `${voiceAnswerRef.current} ${interimText}`
          .replace(/\s+/g, " ")
          .trim();

      setAnswer(
        visibleTranscript
      );

      if (
        plan ===
          "PREMIUM" &&
        finalText.trim()
      ) {
        scheduleVoiceSubmit(
          voiceAnswerRef.current
        );
      }
    };

    recognitionRef.current =
      recog;
  }, [
    plan,
    avatar,
    interview,
    interviewStarted,
    loading,
  ]);

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
      plan === "FREE" ||
      plan === "PREMIUM"
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

  useEffect(() => {
    if (
      plan !== "PREMIUM" ||
      !interviewStarted ||
      !question ||
      lastSpokenQuestionIdRef.current ===
        question.id
    ) {
      return;
    }

    lastSpokenQuestionIdRef.current =
      question.id;

    recognitionRef.current?.stop();
    interview.transitionTo(
      "AVATAR_SPEAKING"
    );

    avatar
      .speak(question.question)
      .then(() => {
        interview.transitionTo(
          "WAITING_FOR_USER"
        );
        if (
          recognitionRef.current
        ) {
          keepListeningRef.current =
            true;
          voiceAnswerRef.current = "";
          setAnswer("");
          window.setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch (error) {
              console.error(error);
            }
          }, 600);
        }
      })
      .catch((error) => {
        console.error(error);
        interview.transitionTo(
          "ERROR"
        );
      });
  }, [
    avatar,
    interview,
    interviewStarted,
    plan,
    question,
  ]);

  async function analyzeJd() {
    try {
      setSetupMessage("");

      if (!jdText.trim()) {
        setSetupMessage(
          "Paste the job description first, then start the interview."
        );
        return null;
      }

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

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Could not analyze the job description."
        );
      }

      if (!data.analysis) {
        throw new Error(
          "The job description analysis did not return enough information."
        );
      }

      setJd(data.analysis);

      return data.analysis as JDAnalysis;
    } catch (err) {
      console.error(err);
      setSetupMessage(
        err instanceof Error
          ? err.message
          : "Could not analyze the resume and job description."
      );
      return null;
    } finally {
      setAnalyzing(false);
    }
  }

  async function startInterview() {
    setLoading("starting");
    setSetupMessage("");
    interview.transitionTo(
      "PROCESSING"
    );

    try {
      const currentJd =
        jd || (await analyzeJd());

      if (!currentJd) {
        interview.transitionTo(
          "WAITING_FOR_USER"
        );
        return;
      }

      setInterviewStarted(true);
      setTranscript([]);
      lastSpokenQuestionIdRef.current =
        null;

      const firstQuestion =
        await generateQuestion({
          resume,
          jd: currentJd,
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

      addTranscript(
        "interviewer",
        firstQuestion.question
      );

      rememberQuestion(
        "interview",
        firstQuestion.question
      );

      if (plan !== "PREMIUM") {
        interview.transitionTo(
          "WAITING_FOR_USER"
        );
      }
    } catch (error) {
      console.error(error);
      interview.transitionTo("ERROR");
      setSetupMessage(
        error instanceof Error
          ? error.message
          : "Could not start the interview."
      );
    } finally {
      setLoading("");
    }
  }

  async function submitAnswer(
    customAnswer?: string
  ) {
    if (!question) return;

    clearVoiceSubmitTimer();
    keepListeningRef.current =
      false;

    const finalAnswer =
      customAnswer ||
      answer;

    setLoading("thinking");
    interview.transitionTo(
      "PROCESSING"
    );

    addTranscript(
      "candidate",
      finalAnswer
    );

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
    voiceAnswerRef.current = "";

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
        setLoading("");

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

    addTranscript(
      "interviewer",
      nextQuestion.question
    );

    rememberQuestion(
      "interview",
      nextQuestion.question
    );

    if (plan !== "PREMIUM") {
      interview.transitionTo(
        "WAITING_FOR_USER"
      );
    }

    setLoading("");
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
    setLoading("thinking");
    interview.transitionTo(
      "PROCESSING"
    );

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

    addTranscript(
      "candidate",
      `Submitted ${result.language} solution for ${result.challenge.title}.`
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

    addTranscript(
      "interviewer",
      nextQuestion.question
    );

    rememberQuestion(
      "interview",
      nextQuestion.question
    );

    if (plan !== "PREMIUM") {
      interview.transitionTo(
        "WAITING_FOR_USER"
      );
    }

    setLoading("");
  }

  return (
    <AuthGuard>
      <AppShell
        contentClassName={
          interviewStarted &&
          plan === "PREMIUM"
            ? "max-w-none"
            : ""
        }
      >
        <div
          className={`grid min-w-0 gap-5 ${
            interviewStarted &&
            plan === "PREMIUM"
              ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
              : "lg:grid-cols-[360px_1fr]"
          }`}
        >
         <div
  className={`min-w-0 space-y-6 ${
    interviewStarted &&
    plan === "PREMIUM"
      ? "xl:sticky xl:top-6 xl:self-start xl:h-[calc(100vh-3rem)]"
      : ""
  }`}
>
            {interviewStarted &&
            plan === "PREMIUM" ? (
              <Avatar
                state={avatar.state}
                error={avatar.error}
                profile={
                  avatarProfile
                }
                onVideoReady={
                  avatar.attachVideo
                }
              />
            ) : (
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
                  loading !== ""
                }
                analyzing={
                  analyzing
                }
                message={
                  setupMessage
                }
              />
            )}
          </div>

          <div className="min-w-0 space-y-6">
            {interviewStarted && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <StatusIndicator
                  status={
                    avatar.error
                      ? "ERROR"
                      : interview.status
                  }
                />

                {plan ===
                  "PREMIUM" && (
                  <Microphone
                    listening={
                      listening
                    }
                    disabled={
                      loading !==
                        "" ||
                      avatar.isSpeaking ||
                      interview.isBusy
                    }
                    onClick={() => {
                      if (listening) {
                        keepListeningRef.current =
                          false;
                        clearVoiceSubmitTimer();
                        recognitionRef.current?.stop();
                        return;
                      }

                      keepListeningRef.current =
                        true;
                      voiceAnswerRef.current =
                        answer;
                      recognitionRef.current?.start();
                    }}
                  />
                )}
              </div>
            )}

            {interviewStarted && (
              <Transcript
                items={transcript}
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
                loading !== "" ||
                avatar.isSpeaking ||
                interview.isBusy
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
                avatar.isSpeaking ||
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
