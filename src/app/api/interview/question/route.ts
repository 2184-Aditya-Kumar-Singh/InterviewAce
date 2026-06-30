import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  resume: z.any(),

  jd: z.any(),

  difficulty: z.enum([
    "Easy",
    "Medium",
    "Hard",
  ]),

  round: z.enum([
    "HR",
    "Technical",
    "Mixed",
  ]),

  plan: z.enum([
    "FREE",
    "PRO",
    "PREMIUM",
  ]),

  persona: z.enum([
    "Friendly HR",
    "Strict Technical Lead",
    "Senior Engineering Manager",
    "Corporate VP",
  ]),

  asked: z
    .array(z.string())
    .optional(),

  qaHistory: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
});

function normalizeQuestion(
  value: string
) {
  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function wordSet(value: string) {
  return new Set(
    normalizeQuestion(value)
      .split(" ")
      .filter(
        (word) =>
          word.length > 3 &&
          ![
            "tell",
            "about",
            "your",
            "what",
            "would",
            "this",
            "that",
            "with",
            "from",
            "question",
            "explain",
          ].includes(word)
      )
  );
}

function similarity(
  a: string,
  b: string
) {
  const left = wordSet(a);
  const right = wordSet(b);

  if (
    left.size === 0 ||
    right.size === 0
  )
    return 0;

  const overlap = Array.from(
    left
  ).filter((word) =>
    right.has(word)
  ).length;

  return (
    overlap /
    Math.min(
      left.size,
      right.size
    )
  );
}

function isRepeatedQuestion(
  question: string,
  asked: string[]
) {
  const normalized =
    normalizeQuestion(question);

  return asked.some((previous) => {
    const normalizedPrevious =
      normalizeQuestion(previous);

    return (
      normalized ===
        normalizedPrevious ||
      normalized.includes(
        normalizedPrevious
      ) ||
      normalizedPrevious.includes(
        normalized
      ) ||
      similarity(
        question,
        previous
      ) >= 0.62
    );
  });
}

function fallbackQuestion(
  round: string,
  difficulty = "Medium",
  askedCount = 0,
  asked: string[] = []
) {
  const effectiveRound =
    round === "Mixed"
      ? askedCount % 2 === 0
        ? "Technical"
        : "HR"
      : round;

  const hrQuestions =
    difficulty === "Hard"
      ? [
          "Describe a time you had to defend an unpopular technical or project decision. What evidence did you use, and what was the outcome?",
          "Tell me about a time your decision created a measurable project risk. What did you do, what trade-off did you make, and what changed afterward?",
          "Give me an example of a failure where your initial judgment was wrong. How did you discover it and change your approach?",
          "Tell me about a time you influenced someone senior or more experienced without authority.",
        ]
      : difficulty === "Easy"
      ? [
          "Walk me through one resume project you are proud of and explain your exact contribution.",
          "Which skill in this job description is strongest for you, and what is one example that proves it?",
          "Tell me about a time you learned something new quickly for a project or class.",
          "How do you organize your work when you receive a new task?",
        ]
      : [
          "Tell me about a challenging situation you handled in a team project. What was your role, what action did you take, and what was the result?",
          "Describe a time you had to choose between speed and quality. What did you decide and why?",
          "Tell me about feedback you received and how it changed your work.",
          "Describe a time requirements changed midway through work. How did you respond?",
        ];

  const technicalQuestions =
    difficulty === "Hard"
      ? [
          "Pick the most complex project on your resume. If it suddenly had 100x traffic, what would break first and how would you redesign it?",
          "Choose one system you built and explain how you would handle concurrency, data consistency, and failure recovery.",
          "Describe how you would investigate a production performance issue where users report intermittent slowness.",
          "Take one technical decision from your resume and evaluate it under security, latency, and cost constraints.",
        ]
      : difficulty === "Easy"
      ? [
          "Choose one project from your resume and explain the main API, database, or algorithm you used.",
          "Explain how you would debug a feature that works locally but fails after deployment.",
          "Pick one listed skill and explain a simple real project where you used it.",
          "Describe how data flows from the UI to the database in one of your projects.",
        ]
      : [
          "Explain a technical challenge you faced recently, the alternatives you considered, and why your final solution was the right trade-off.",
          "Design the data model for one workflow in this job description and explain the important relationships.",
          "How would you make one of your resume projects more reliable when multiple API calls can fail?",
          "Walk me through how you would optimize a slow database-backed endpoint as data grows.",
        ];

  const bank =
    effectiveRound === "HR"
      ? hrQuestions
      : technicalQuestions;

  const question =
    bank.find(
      (candidate) =>
        !isRepeatedQuestion(
          candidate,
          asked
        )
    ) ||
    `${bank[askedCount % bank.length]} Give a different example than any you have already used.`;

  if (
    effectiveRound === "HR"
  ) {
    return {
      id:
        crypto.randomUUID(),

      question,

      focusArea:
        "Behavioral",

      round: "HR",

      expectedSignals:
        [
          "communication",
          "ownership",
          "teamwork",
        ],
    };
  }

  return {
    id:
      crypto.randomUUID(),

    question,

    focusArea:
      "Problem Solving",

    round:
      "Technical",

    expectedSignals:
      [
        "technical depth",
        "problem solving",
        "decision making",
      ],
  };
}

export async function POST(
  request: NextRequest
) {
  const limited =
    rateLimit(
      `question:${
        request.headers.get(
          "x-forwarded-for"
        ) || "local"
      }`,
      30,
      60_000
    );

  if (limited)
    return limited;

  try {
    const parsed =
      schema.safeParse(
        await request.json()
      );

    if (
      !parsed.success
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid interview request",
        },
        {
          status: 400,
        }
      );
    }

    const {
      resume,

      jd,

      difficulty,

      round,

      persona,

      asked = [],

      qaHistory = [],
    } = parsed.data;

    // FIRST QUESTION: greet by name (if available) and ask for an introduction
    if (asked.length === 0) {
      const candidateName =
        typeof resume?.name === "string" &&
        resume.name.trim()
          ? resume.name
              .trim()
              .split(/\s+/)[0]
          : "";

      const greeting = candidateName
        ? `Hi ${candidateName}, welcome! `
        : `Hi, welcome! `;

      return NextResponse.json({
        success: true,

        question: {
          id: crypto.randomUUID(),

          question: `${greeting}Let's get started — could you please introduce yourself? Walk me through your background, what you've worked on, and what you're looking for in this role.`,

          focusArea:
            "Introduction",

          round: "HR",

          expectedSignals: [
            "clarity",
            "relevant background",
            "communication",
          ],
        },
      });
    }

    const personaBehavior = {
  "Friendly HR":
    "Warm, conversational, supportive, recruiter-like.",

  "Strict Technical Lead":
    "Strict, analytical, deep technical interviewer. Push candidate harder.",

  "Senior Engineering Manager":
    "Leadership-focused, architecture-focused, evaluates communication and ownership.",

  "Corporate VP":
    "Business-oriented executive interviewer focusing on impact and strategic thinking.",
};

const roundInstruction =
  round === "Technical"
    ? `
STRICT TECHNICAL ROUND RULES:
- Ask ONLY technical/software engineering questions
- NEVER ask HR or behavioral questions
- NEVER ask teamwork, leadership, strengths/weaknesses, communication, conflict, or personality questions
- Focus ONLY on coding, projects, debugging, APIs, databases, system design, architecture, DSA, optimization, scalability, backend, frontend, and engineering trade-offs
`
    : round === "HR"
    ? `
STRICT HR ROUND RULES:
- Ask ONLY HR/behavioral questions
- NEVER ask coding or technical implementation questions
- Focus on teamwork, communication, leadership, ownership, conflict resolution, motivation, and behavior
`
    : `
MIXED ROUND RULES:
- Alternate between HR and Technical questions
`;

const lastAnswer =
  qaHistory[qaHistory.length - 1]
    ?.answer || "";

const isFollowingUpOnIntro =
  qaHistory.length === 1;

const followUpInstruction =
  qaHistory.length > 0
    ? `
CANDIDATE'S MOST RECENT ANSWER:
"${lastAnswer}"

${
  isFollowingUpOnIntro
    ? `
This was their self-introduction. Your task now:
1. First, check if anything they mentioned (a project, skill, technology, or responsibility) connects to the job description's required skills (${jd?.requiredSkills?.join(", ") || ""}). If yes, ask a natural follow-up question that digs deeper into that specific thing they mentioned.
2. If their introduction did NOT mention anything relevant or questionable in relation to the JD, do NOT force a follow-up on it — instead, pivot and ask a fresh question of your own, grounded in the JD's required skills or the candidate's resume (skills/projects), as a natural interviewer would after a generic intro.
3. Make the transition feel conversational, e.g. "Thanks for that — you mentioned X, can you tell me more about..." or, if pivoting, "Thanks for the introduction. Let's dive into..."
`
    : `
Ask a natural follow-up that builds on this specific answer where relevant, or moves to a new but related competency if the answer was thin, generic, or didn't leave anything substantive to follow up on.
`
}
`
    : "";

    const prompt = `
You are conducting a REALISTIC FAANG-style mock interview.

INTERVIEW SETTINGS:
${roundInstruction}
Interview Type:
${round}

Difficulty:
${difficulty}

Interviewer Personality:
${persona}

Behavior Style:
${
  personaBehavior[
    persona
  ]
}

CANDIDATE INFORMATION:

Resume Summary:
${resume?.summary || ""}

Skills:
${resume?.skills?.join(", ") || ""}

Projects:
${resume?.projects?.join(", ") || ""}

Education:
${resume?.education?.join(", ") || ""}

TARGET ROLE:

Role:
${jd?.role || ""}

Required Skills:
${jd?.requiredSkills?.join(", ") || ""}

Missing Skills:
${jd?.missingSkills?.join(", ") || ""}

NOTE: "Missing Skills" means the candidate's resume does NOT show this skill. If you reference a missing skill, only ask a gap-check question (see rules below), never a deep technical question assuming hands-on expertise.

PREVIOUS QUESTIONS:
${asked.join("\n")}
${followUpInstruction}

IMPORTANT RULES:

- Ask ONLY ONE question
- NEVER ask multiple questions
- NEVER return markdown
- NEVER return explanations
- Ask conversationally like a real interviewer, not like a quiz generator
- Treat PREVIOUS QUESTIONS as a strict do-not-ask list
- Do not repeat the same question, same scenario, same concept, or same resume project angle from PREVIOUS QUESTIONS
- If a similar question would be useful, change the competency being tested instead of rewording it
- CRITICAL — SKILL GROUNDING RULE: Do NOT ask deep technical questions about a specific tool, language, or framework (e.g. "explain how R handles X") unless that exact skill appears in the candidate's resume Skills or Projects, OR the candidate mentioned it themselves in a previous answer in this interview. The JD's required skills list is for identifying GAPS, not for assuming the candidate has hands-on knowledge.
- If a skill is in the JD's requiredSkills or missingSkills but NOT in the candidate's resume or prior answers, you may only ask an honest GAP-CHECK question like "This role requires experience with [skill] — have you worked with it, even briefly, or how would you approach learning it quickly?" Do NOT ask them to explain internals, write code, or demonstrate deep expertise in a skill they have never claimed to know.
- Prioritize anchoring questions in: (1) something the candidate said in a previous answer this interview, (2) a specific resume project or skill, (3) a JD responsibility that overlaps with resume skills. Only fall back to a pure gap-check question (as defined above) if none of the above give you anything to ask about.
- Technical questions must evaluate real engineering judgment: debugging, trade-offs, scalability, APIs, databases, algorithms, testing, security, or production incidents
- HR questions must evaluate ownership, conflict, teamwork, clarity, motivation, and evidence from past work
- Mixed interviews must alternate between HR and Technical using previous questions as history
- Easy: ask clear foundation or project-explanation questions suitable for entry-level candidates
- Medium: ask scenario and trade-off questions that require specific examples and reasoning
- Hard: ask deep follow-up style questions with constraints, failure modes, scale, ambiguity, or skeptical interviewer pressure
- Strict Technical Lead should ask tougher follow-ups
- Senior Engineering Manager should ask ownership/system-design style questions
- Corporate VP should focus on business impact and decision-making
- The "round" field must be "HR" for HR behavior and "Technical" for technical behavior
- Expected signals must be concrete scoring criteria for this exact question

RETURN ONLY RAW VALID JSON.

FORMAT:

{
  "id": "",
  "question": "",
  "focusArea": "",
  "round": "",
  "expectedSignals": []
}
`;

    let generatedQuestion;

    for (
      let attempt = 0;
      attempt < 2;
      attempt += 1
    ) {
      const response =
        await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            model:
              "llama-3.3-70b-versatile",

            messages: [
              {
                role: "system",

                content:
                  "You are a strict senior FAANG interviewer. Return ONLY valid JSON.",
              },

              {
                role: "user",

                content:
                  attempt === 0
                    ? prompt
                    : `${prompt}

The last generated question was too similar to previous history. Generate a completely different question that tests a new competency.`,
              },
            ],

            temperature: 0.7,
          }),
        }
      );

      const data =
        await response.json();

      const text =
        data?.choices?.[0]
          ?.message
          ?.content || "";

      console.log(
        "QUESTION RESPONSE:",
        text
      );

      const cleaned =
        text
          .replace(
            /```json/g,
            ""
          )
          .replace(
            /```/g,
            ""
          )
          .trim();

      try {
        generatedQuestion =
          JSON.parse(
            cleaned
          );
      } catch {
        generatedQuestion =
          null;
      }

      if (
        generatedQuestion &&
        typeof generatedQuestion.question ===
          "string" &&
        !isRepeatedQuestion(
          generatedQuestion.question,
          asked
        )
      ) {
        break;
      }

      generatedQuestion =
        null;
    }

    if (!generatedQuestion) {
      generatedQuestion =
        fallbackQuestion(
          round,
          difficulty,
          asked.length,
          asked
        );
    }

    return NextResponse.json({
      success: true,

      question: {
        id:
          generatedQuestion.id ||
          crypto.randomUUID(),

        question:
          generatedQuestion.question,

        focusArea:
          generatedQuestion.focusArea ||
          "General",

        round:
          generatedQuestion.round ||
          round,

        expectedSignals:
          Array.isArray(
            generatedQuestion.expectedSignals
          )
            ? generatedQuestion.expectedSignals
            : [],
      },
    });
  } catch (err: unknown) {
    console.error(
      "QUESTION ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,

        error:
          err instanceof Error
            ? err.message
            : "Failed generating question",
      },
      { status: 500 }
    );
  }
}
