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

import Groq from "groq-sdk";

function getGroqClient() {
  return new Groq({
    apiKey:
      process.env.GROQ_API_KEY,
  });
}

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

  if (
    answer.questionType ===
      "coding" &&
    answer.codeReview
  ) {
    const score =
      clampScore(
        answer.codeReview.score
      );

    return {
      question: answer.question,
      answer: cleanAnswer,
      score,
      verdict:
        score >= 80
          ? "Strong"
          : score >= 55
          ? "Partial"
          : "Weak",
      feedback: `Code review: correctness ${answer.codeReview.correctness}/100, readability ${answer.codeReview.readability}/100, edge-case handling ${answer.codeReview.edgeCases}/100. Time complexity: ${answer.codeReview.timeComplexity}. Space complexity: ${answer.codeReview.spaceComplexity}. ${answer.codeReview.optimization} ${answer.codeReview.suggestions.join(" ")}`,
      missingSignals:
        answer.codeReview.suggestions,
    };
  }

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

  const questionWords =
    normalizeWords(
      answer.question
    );

  const signalWords =
    normalizeWords(
      answer.expectedSignals?.join(
        " "
      ) || ""
    );

  const relevance =
    Array.from(
      questionWords
    ).filter((word) =>
      answerWords.has(word)
    ).length;

  const signalCoverage =
    Array.from(
      signalWords
    ).filter((word) =>
      answerWords.has(word)
    ).length;

  const wordCount =
    cleanAnswer.split(/\s+/)
      .length;

  const hasExample =
    /(project|built|implemented|designed|debugged|improved|measured|result|impact|trade-off|tradeoff)/i.test(
      cleanAnswer
    );

  const score = clampScore(
    wordCount * 1.1 +
      relevance * 4 +
      signalCoverage * 8 +
      (hasExample ? 12 : 0)
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
        ? "Good answer with relevant detail, question alignment, and concrete evidence."
        : score >= 50
        ? "Partially relevant answer, but it needs stronger structure, clearer trade-offs, and more concrete evidence."
        : "Weak answer for this question. Add a direct answer, a specific example, measurable outcome, and address the expected signals.",

    missingSignals:
      answer.expectedSignals?.filter(
        (signal) =>
          !cleanAnswer
            .toLowerCase()
            .includes(
              signal.toLowerCase()
            )
      ) || [],
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
  if (
    process.env.GROQ_API_KEY
  ) {
    try {
      const prompt = `
You are a senior interviewer creating a final mock interview report.

Evaluate every answer against the exact question asked, expected signals, resume, job description, difficulty, and coding review data.

Be specific. Penalize vague, short, generic, memorized, or unrelated answers. For coding answers, evaluate correctness, edge cases, complexity, readability, and whether the submitted code solves the prompt.

Return ONLY raw JSON in this exact shape:

{
  "overallScore": 0,
  "technicalScore": 0,
  "codingScore": 0,
  "resumeAlignmentScore": 0,
  "communicationScore": 0,
  "confidenceEstimate": 0,
  "answerReviews": [
    {
      "question": "",
      "answer": "",
      "score": 0,
      "verdict": "Strong",
      "feedback": "",
      "missingSignals": []
    }
  ],
  "strengths": [],
  "weaknesses": [],
  "resumeAdditions": [],
  "resumeRemovals": [],
  "focusAreas": [],
  "roadmap": []
}

Difficulty: ${input.difficulty}

Resume:
${JSON.stringify(input.resume || {}, null, 2)}

Job description analysis:
${JSON.stringify(input.jd || {}, null, 2)}

Answers:
${JSON.stringify(input.answers, null, 2)}
`;

      const response =
        await getGroqClient().chat.completions.create(
          {
            model:
              "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content:
                  "You are a strict senior interviewer and code reviewer. Return ONLY valid JSON.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.25,
          }
        );

      const text =
        response.choices[0]
          ?.message?.content ||
        "";

      const cleaned =
        text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

      const parsed =
        JSON.parse(cleaned);

      if (
        parsed?.answerReviews &&
        Array.isArray(
          parsed.answerReviews
        )
      ) {
        return parsed;
      }
    } catch (err) {
      console.error(
        "AI REPORT ERROR:",
        err
      );
    }
  }

  return createLocalReport(input);
}
