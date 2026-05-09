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

const questionBank: Record<Exclude<InterviewRound, "Mixed">, Record<Difficulty, string[]>> = {
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
  "Open the Coding tab and solve Two Sum. Given nums = [2,7,11,15] and target = 9, return indices 0 and 1. Run your code, then paste the final approach back here.",
  "Open the Coding tab and write a function that checks whether a string is a palindrome after ignoring case and non-alphanumeric characters. Run it with at least two examples, then paste the final approach back here.",
  "Open the Coding tab and solve FizzBuzz for numbers 1 through n. Print Fizz for multiples of 3, Buzz for multiples of 5, and FizzBuzz for both. Run your code, then paste the final approach back here.",
];

export function getCodingPrompt(roundIndex: number) {
  return codingPrompts[roundIndex % codingPrompts.length];
}

export async function generateQuestion(input: {
  resume: ParsedResume;
  jd: JDAnalysis;
  difficulty: Difficulty;
  plan?: InterviewPlan;
  persona?: InterviewPersona;
  round?: InterviewRound;
  asked: string[];
}): Promise<InterviewQuestion> {
  const round = input.round || "HR";
  const resumeSkills = input.resume.skills.map((skill) => skill.toLowerCase());
  const jdSkills = input.jd.requiredSkills.map((skill) => skill.toLowerCase());
  const matchedTopics = jdSkills.filter((skill) => resumeSkills.includes(skill));
  const cseTopics = resumeSkills.filter((skill) =>
    /data structures|algorithms|operating systems|dbms|computer networks|oop|object oriented|software engineering|computer architecture/i.test(skill),
  );
  const topicPool = [...matchedTopics, ...cseTopics, ...jdSkills, ...resumeSkills].filter(Boolean);
  const primaryTopic = topicPool[input.asked.length % Math.max(topicPool.length, 1)] || "problem solving";
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                `Return one JSON interview question. Ask one question only. Do not repeat any item in asked. Round: ${round}. Prioritize topics present in both resume skills and JD required skills. If the resume includes common CSE subjects such as data structures, algorithms, operating systems, DBMS, computer networks, OOP, or software engineering, you may ask general degree-level CSE questions from those subjects. Current target topic: ${primaryTopic}. HR questions must be behavioral, communication, motivation, leadership, resume fit, or culture fit and must reference resume/JD fit. Technical questions must be about the target topic, resume projects, JD skills, architecture, debugging, database, API, frontend, backend, security, performance, or system design. Plan: ${input.plan || "FREE"}. If plan is FREE, do not ask follow-up questions. If plan is PRO or PREMIUM, ask smart cross questions using previous answers when useful. Interviewer persona: ${input.persona || "Friendly HR"}. Include focusArea, round, and expectedSignals array.`,
            },
            {
              role: "user",
              content: JSON.stringify(input),
            },
          ],
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      const parsed = JSON.parse(data.choices?.[0]?.message?.content || "{}");
      if (parsed.question) {
        return {
          id: crypto.randomUUID(),
          question: parsed.question,
          focusArea: parsed.focusArea || input.jd.role,
          round: parsed.round === "HR" || parsed.round === "Technical" || parsed.round === "Mixed" ? parsed.round : round,
          expectedSignals: parsed.expectedSignals || input.jd.requiredSkills.slice(0, 3),
        };
      }
    } catch {
      // Fall through to deterministic local generator.
    }
  }

  const effectiveRound: Exclude<InterviewRound, "Mixed"> =
    round === "Mixed" ? (input.asked.length % 2 === 0 ? "Technical" : "HR") : round;
  const bank = questionBank[effectiveRound][input.difficulty];
  const alreadyAsked = input.asked.map((question) => question.toLowerCase());
  const available = bank.filter(
    (question) => !alreadyAsked.some((asked) => asked.includes(question.toLowerCase())),
  );
  const base = available[0] || bank[input.asked.length % bank.length];
  const skill = primaryTopic;
  const resumeProject = input.resume.projects[input.asked.length % Math.max(input.resume.projects.length, 1)];
  const technicalTemplates = [
    `Your resume and the JD both point toward ${skill}. Explain the core concept, where you used it, and one failure case you would watch for.`,
    `In a project from your resume${resumeProject ? ` (${resumeProject})` : ""}, how would you apply ${skill} to meet this JD requirement?`,
    `Give a technical explanation of ${skill}, then design a small implementation or debugging plan for this role.`,
    `What are the trade-offs, complexity, and edge cases involved when using ${skill} in a production project?`,
  ];
  const hrTemplates = [
    `Your resume mentions ${skill}, and the JD also needs it. Tell me a project story that proves you can use it on the job.`,
    `Why should a recruiter believe your ${skill} experience is strong enough for this JD?`,
    `What is one gap between your resume and this JD, and how are you improving it?`,
    `Explain your strongest resume project in a way that highlights ${skill} for this role.`,
  ];
  const topicQuestion =
    effectiveRound === "Technical"
      ? technicalTemplates[input.asked.length % technicalTemplates.length]
      : hrTemplates[input.asked.length % hrTemplates.length];
  const personaPrefix =
    effectiveRound === "HR"
      ? "Answer like you are in an HR interview:"
      : input.persona === "Strict Technical Lead"
      ? "Be precise and technical:"
      : input.persona === "Corporate Manager"
        ? "Answer like you are speaking with a hiring manager:"
        : "Take your time and answer clearly:";

  return {
    id: crypto.randomUUID(),
    question: `${personaPrefix} ${topicQuestion} ${input.asked.length < bank.length ? `Also cover this angle: ${base}` : ""}`.trim(),
    focusArea: skill,
    round: effectiveRound,
    expectedSignals:
      effectiveRound === "Technical"
        ? [skill, "technical depth", "edge cases", "role relevance"]
        : [skill, "specific resume evidence", "JD relevance", "clear outcome"],
  };
}

export function createMockReport(answers: InterviewAnswer[], difficulty: Difficulty): InterviewReport {
  return createLocalReport({ answers, difficulty });
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeWords(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

function reviewAnswer(answer: InterviewAnswer): AnswerReview {
  const cleanAnswer = answer.answer.trim();
  if (!cleanAnswer) {
    return {
      question: answer.question,
      answer: cleanAnswer,
      score: 0,
      verdict: "Missing",
      feedback: "No answer was captured, so correctness could not be evaluated.",
      missingSignals: answer.expectedSignals?.length ? answer.expectedSignals : ["specific answer", "role relevance"],
    };
  }

  const answerWords = normalizeWords(cleanAnswer);
  const questionWords = normalizeWords(answer.question);
  const expectedSignals = answer.expectedSignals?.length ? answer.expectedSignals : ["specific example", "clear reasoning", "role relevance"];
  const signalHits = expectedSignals.filter((signal) => {
    if (/complexity|time|space/i.test(signal) && /o\([^)]+\)|time|space|linear|constant|quadratic/i.test(cleanAnswer)) return true;
    if (/algorithm|correct/i.test(signal) && /hash|map|two sum|sort|loop|return|function|edge case/i.test(cleanAnswer)) return true;
    if (/measurement|performance/i.test(signal) && /latency|benchmark|measure|load test|profile|metric|before and after/i.test(cleanAnswer)) return true;
    if (/database|query/i.test(signal) && /index|query|sql|database|cache|join/i.test(cleanAnswer)) return true;
    const signalWords = Array.from(normalizeWords(signal)).filter((word) => word.length > 4);
    return signalWords.length ? signalWords.some((word) => answerWords.has(word)) : Array.from(normalizeWords(signal)).some((word) => answerWords.has(word));
  });
  const overlap = Array.from(questionWords).filter((word) => answerWords.has(word)).length;
  const lengthScore = cleanAnswer.length > 450 ? 28 : cleanAnswer.length > 220 ? 23 : cleanAnswer.length > 90 ? 16 : 8;
  const specificityScore = /\d|because|therefore|trade-off|metric|tested|debug|designed|implemented|optimized|deployed|index|latency|cache|hash|complexity|o\(/i.test(cleanAnswer)
    ? 26
    : 12;
  const relevanceScore = Math.min(30, overlap * 6 + signalHits.length * 8);
  const structureScore = /first|second|finally|situation|action|result|for example|in my project/i.test(cleanAnswer) ? 15 : 7;
  const penalty = /don't know|not sure|no idea|can't answer/i.test(cleanAnswer) ? 25 : 0;
  const score = clampScore(lengthScore + specificityScore + relevanceScore + structureScore - penalty);
  const verdict = score >= 78 ? "Strong" : score >= 55 ? "Partial" : score >= 25 ? "Weak" : "Missing";
  const missingSignals = expectedSignals.filter((signal) => !signalHits.includes(signal));

  return {
    question: answer.question,
    answer: cleanAnswer,
    score,
    verdict,
    feedback:
      score >= 78
        ? "This answer is relevant and specific enough for the question. Add measurable impact if possible."
        : score >= 55
          ? "This partially answers the question, but needs more proof, examples, or technical depth."
          : "This does not fully answer the question yet. Use a concrete example, explain your reasoning, and tie it back to the role.",
    missingSignals,
  };
}

function createLocalReport(input: {
  answers: InterviewAnswer[];
  difficulty: Difficulty;
  jd?: JDAnalysis;
  resume?: ParsedResume;
}): InterviewReport {
  const { answers, difficulty, jd, resume } = input;
  const answerReviews = answers.map(reviewAnswer);
  const answered = answers.filter((item) => item.answer.trim().length > 20);
  const completion = Math.min(100, Math.round((answered.length / Math.max(answers.length, 1)) * 100));
  const averageAnswerScore = answerReviews.length
    ? Math.round(answerReviews.reduce((sum, item) => sum + item.score, 0) / answerReviews.length)
    : 0;
  const strictness = difficulty === "Hard" ? -8 : difficulty === "Easy" ? 8 : 0;
  const technicalAnswers = answers.filter((item) => item.round === "Technical" || /technical|architecture|debug|api|database|code|system/i.test(item.question));
  const codingAnswers = answers.filter((item) => item.questionType === "coding" || /coding|code|function|algorithm|solve/i.test(item.question));
  const technicalReviews = answerReviews.filter((_, index) => technicalAnswers.includes(answers[index]));
  const codingReviews = answerReviews.filter((_, index) => codingAnswers.includes(answers[index]));
  const resumeSkills = resume?.skills.map((skill) => skill.toLowerCase()) ?? [];
  const requiredSkills = jd?.requiredSkills.map((skill) => skill.toLowerCase()) ?? [];
  const matchedSkills = requiredSkills.filter((skill) => resumeSkills.includes(skill));
  const resumeAlignmentScore = requiredSkills.length ? clampScore((matchedSkills.length / requiredSkills.length) * 100) : jd?.matchPercent ?? 50;
  const technicalScore = technicalReviews.length
    ? clampScore(technicalReviews.reduce((sum, item) => sum + item.score, 0) / technicalReviews.length + strictness)
    : clampScore(averageAnswerScore + strictness - 4);
  const codingScore = codingReviews.length
    ? clampScore(codingReviews.reduce((sum, item) => sum + item.score, 0) / codingReviews.length)
    : 0;
  const communicationScore = clampScore(averageAnswerScore + (completion > 80 ? 8 : 0));
  const confidenceEstimate = clampScore(averageAnswerScore + (answered.length >= answers.length ? 4 : -8));
  const overallScore = clampScore(
    technicalScore * 0.35 +
      communicationScore * 0.2 +
      confidenceEstimate * 0.1 +
      resumeAlignmentScore * 0.2 +
      (codingScore || technicalScore) * 0.15,
  );
  const missingSkills = jd?.missingSkills?.length
    ? jd.missingSkills
    : requiredSkills.filter((skill) => !resumeSkills.includes(skill));
  const weakReviews = answerReviews.filter((item) => item.score < 65);

  return {
    overallScore,
    technicalScore,
    codingScore,
    resumeAlignmentScore,
    communicationScore,
    confidenceEstimate,
    answerReviews,
    strengths: [
      averageAnswerScore >= 70 ? "Most answers stayed relevant to the questions asked." : "You completed the interview flow and created a baseline for improvement.",
      technicalScore >= 70 ? "Your technical responses show role-relevant understanding." : "You have identifiable technical gaps that can be fixed with focused practice.",
      resumeAlignmentScore >= 70 ? "Your resume already includes several JD-aligned skills." : "The JD comparison clearly shows which skills to strengthen on the resume.",
    ],
    weaknesses: [
      weakReviews[0]?.feedback || "Add more measurable outcomes to project answers.",
      "Use a tighter structure: situation, action, result, reflection.",
      missingSkills.length ? `Prepare deeper proof for: ${missingSkills.slice(0, 4).join(", ")}.` : "Prepare deeper follow-up details for high-priority JD skills.",
    ],
    resumeAdditions: [
      ...missingSkills.slice(0, 5).map((skill) => `Add a concrete project bullet showing ${skill} experience.`),
      "Add measurable impact: latency reduced, users served, accuracy improved, revenue saved, or time saved.",
      "Add tools, APIs, databases, and deployment details for your strongest projects.",
    ].slice(0, 6),
    resumeRemovals: [
      "Remove generic claims like hard-working or quick learner unless backed by evidence.",
      "Remove outdated or unrelated tools that do not support the target JD.",
      "Shorten long project descriptions that do not mention role-relevant impact.",
    ],
    focusAreas: [
      ...missingSkills.slice(0, 5),
      ...(weakReviews.length ? ["Answer structure and question relevance"] : []),
      ...(codingScore && codingScore < 70 ? ["Coding implementation and complexity explanation"] : []),
      "Role-specific project storytelling",
    ].filter(Boolean),
    roadmap: [
      `Day 1: Rewrite your resume bullets around ${jd?.role || "the target role"} requirements.`,
      `Day 2: Prepare examples for ${missingSkills.slice(0, 2).join(" and ") || "your weakest JD skills"}.`,
      "Day 3: Practice technical explanations with architecture, trade-offs, and verification steps.",
      "Day 4: Solve one coding problem and explain complexity out loud.",
      "Day 5: Record a mock interview and remove vague or off-topic answers.",
      "Day 6: Add metrics and deployment details to your best projects.",
      "Day 7: Repeat the hardest questions until answers are specific and concise.",
    ],
  };
}

export async function createInterviewReport(input: {
  answers: InterviewAnswer[];
  difficulty: Difficulty;
  jd?: JDAnalysis;
  resume?: ParsedResume;
}): Promise<InterviewReport> {
  const fallback = createLocalReport(input);
  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Evaluate a mock interview. For every answer, judge if it correctly answers the exact question asked. Return JSON with overallScore, technicalScore, codingScore, resumeAlignmentScore, communicationScore, confidenceEstimate, answerReviews array, strengths, weaknesses, resumeAdditions, resumeRemovals, focusAreas, roadmap. Scores must be 0-100.",
          },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
    });
    const data = await response.json();
    const report = JSON.parse(data.choices?.[0]?.message?.content || "{}") as Partial<InterviewReport>;
    return {
      ...fallback,
      ...report,
      answerReviews: report.answerReviews?.length ? report.answerReviews : fallback.answerReviews,
    };
  } catch {
    return fallback;
  }
}
