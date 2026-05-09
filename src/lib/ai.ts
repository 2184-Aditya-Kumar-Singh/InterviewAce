import type {
  Difficulty,
  InterviewPlan,
  InterviewPersona,
  InterviewRound,
  AnswerReview,
  InterviewAnswer,
  InterviewQuestion,
  InterviewReport,
  JDAnalysis,
  ParsedResume,
} from "./types";

const questionBank: Record<
  Exclude<InterviewRound, "Mixed">,
  Record<Difficulty, string[]>
> = {
  HR: {
    Easy: [
      "Walk me through your resume and highlight one project you are proud of.",
      "Which skill from the job description feels strongest for you, and why?",
      "Tell me about a time you learned a new technical concept quickly.",
      "How do you decide what to work on first when you get a new task?",
      "Give an example of using feedback to improve your work.",
    ],

    Medium: [
      "Pick a project from your resume. What trade-offs did you make while building it?",
      "How would you close the biggest gap between your resume and this job description?",
      "Tell me about a time you had to choose between speed and code quality.",
      "How would you explain one of your projects to a non-technical stakeholder?",
      "Describe a time you handled ambiguity or changing requirements.",
    ],

    Hard: [
      "Defend one career decision from your resume as if the interviewer is skeptical.",
      "Which requirement in this JD exposes the most risk in your profile, and what is your mitigation plan?",
      "Tell me about a professional failure, including what changed in your behavior afterward.",
      "How would you build trust with a team during your first month in this role?",
      "Challenge one claim from your resume and support it with evidence.",
    ],
  },

  Technical: {
    Easy: [
      "Explain how you would design a REST API for one project on your resume.",
      "Describe the difference between client-side and server-side rendering using your stack.",
      "How would you debug a slow page load in a React or Next.js app?",
      "Explain how SQL indexing can improve query performance.",
      "What checks would you add before deploying a feature to production?",
    ],

    Medium: [
      "Design the data model for this role's core product workflow and explain key relationships.",
      "How would you make a React application more reliable when multiple API calls can fail?",
      "Walk through a production debugging process for an intermittent backend error.",
      "Compare two approaches for authentication and session management in this app.",
      "How would you optimize an endpoint that becomes slow when the database grows?",
    ],

    Hard: [
      "Design a scalable architecture for this job description's product, including API, database, caching, and failure handling.",
      "Explain how you would trace and fix a memory leak or resource leak in production.",
      "How would you guarantee data consistency when multiple users update the same record concurrently?",
      "Design an observability plan with logs, metrics, traces, and alert thresholds for this system.",
      "Evaluate one technical decision from your resume under security, latency, and cost constraints.",
    ],
  },
};

const codingPrompts = [
  "Open the Coding tab and solve Two Sum. Given nums = [2,7,11,15] and target = 9, return indices 0 and 1.",
  "Open the Coding tab and write a palindrome checker.",
  "Open the Coding tab and solve FizzBuzz.",
];

export function getCodingPrompt(roundIndex: number) {
  return codingPrompts[
    roundIndex % codingPrompts.length
  ];
}

export async function generateQuestion(
  input: {
    resume: ParsedResume;
    jd: JDAnalysis;
    difficulty: Difficulty;
    plan?: InterviewPlan;
    persona?: InterviewPersona;
    round?: InterviewRound;
    asked: string[];
  }
): Promise<InterviewQuestion> {
  const round =
    input.round || "HR";

  const resumeSkills =
    input.resume.skills.map((s) =>
      s.toLowerCase()
    );

  const jdSkills =
    input.jd.requiredSkills.map((s) =>
      s.toLowerCase()
    );

  const matchedTopics =
    jdSkills.filter((skill) =>
      resumeSkills.includes(skill)
    );

  const topicPool = [
    ...matchedTopics,
    ...jdSkills,
    ...resumeSkills,
  ].filter(Boolean);

  const primaryTopic =
    topicPool[
      input.asked.length %
        Math.max(topicPool.length, 1)
    ] || "problem solving";

  const effectiveRound:
    | "HR"
    | "Technical" =
    round === "Mixed"
      ? input.asked.length % 2 === 0
        ? "Technical"
        : "HR"
      : round;

  const bank =
    questionBank[effectiveRound][
      input.difficulty
    ];

  const base =
    bank[
      input.asked.length %
        bank.length
    ];

  const personaPrefix =
    effectiveRound === "HR"
      ? "Answer like an HR interview:"
      : "Answer technically and clearly:";

  return {
    id: crypto.randomUUID(),

    question: `${personaPrefix} ${base} Also explain how it relates to ${primaryTopic}.`,

    focusArea: primaryTopic,

    round: effectiveRound,

    expectedSignals:
      effectiveRound ===
      "Technical"
        ? [
            primaryTopic,
            "technical depth",
            "problem solving",
          ]
        : [
            primaryTopic,
            "communication",
            "resume relevance",
          ],
  };
}

export function createMockReport(
  answers: InterviewAnswer[],
  difficulty: Difficulty
): InterviewReport {
  return createLocalReport({
    answers,
    difficulty,
  });
}

function clampScore(score: number) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );
}

function normalizeWords(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(
        /[^a-z0-9+#.\s-]/g,
        " "
      )
      .split(/\s+/)
      .filter(
        (word) => word.length > 2
      )
  );
}

function reviewAnswer(
  answer: InterviewAnswer
): AnswerReview {
  const cleanAnswer =
    answer.answer.trim();

  if (!cleanAnswer) {
    return {
      question: answer.question,
      answer: cleanAnswer,
      score: 0,
      verdict: "Missing",
      feedback:
        "No answer captured.",
      missingSignals: [
        "specific answer",
      ],
    };
  }

  const answerWords =
    normalizeWords(cleanAnswer);

  const overlap =
    Array.from(answerWords)
      .length;

  const score = clampScore(
    overlap * 2 +
      cleanAnswer.length / 20
  );

  return {
    question: answer.question,
    answer: cleanAnswer,
    score,

    verdict:
      score >= 75
        ? "Strong"
        : score >= 50
        ? "Partial"
        : "Weak",

    feedback:
      score >= 75
        ? "Good answer with relevant detail."
        : "Needs more clarity and examples.",

    missingSignals: [],
  };
}

function createLocalReport(input: {
  answers: InterviewAnswer[];
  difficulty: Difficulty;
  jd?: JDAnalysis;
  resume?: ParsedResume;
}): InterviewReport {
  const reviews =
    input.answers.map(reviewAnswer);

  const avg =
    reviews.length
      ? reviews.reduce(
          (a, b) =>
            a + b.score,
          0
        ) / reviews.length
      : 0;

  const overallScore =
    clampScore(avg);

  return {
    overallScore,

    technicalScore:
      overallScore,

    codingScore:
      overallScore,

    resumeAlignmentScore:
      overallScore,

    communicationScore:
      overallScore,

    confidenceEstimate:
      overallScore,

    answerReviews: reviews,

    strengths: [
      "Good participation",
      "Relevant answers",
    ],

    weaknesses: [
      "Need more depth",
      "Need clearer structure",
    ],

    resumeAdditions: [
      "Add measurable achievements",
    ],

    resumeRemovals: [
      "Remove generic statements",
    ],

    focusAreas: [
      "Technical depth",
      "Communication",
    ],

    roadmap: [
      "Practice mock interviews daily.",
      "Improve resume storytelling.",
      "Solve coding problems consistently.",
    ],
  };
}

export async function createInterviewReport(
  input: {
    answers: InterviewAnswer[];
    difficulty: Difficulty;
    jd?: JDAnalysis;
    resume?: ParsedResume;
  }
): Promise<InterviewReport> {
  return createLocalReport(input);
}
