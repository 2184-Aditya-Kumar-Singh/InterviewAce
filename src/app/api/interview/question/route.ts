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
});

function fallbackQuestion(
  round: string
) {
  if (
    round === "HR"
  ) {
    return {
      id:
        crypto.randomUUID(),

      question:
        "Tell me about a challenging situation you handled in a team project.",

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

    question:
      "Explain a technical challenge you faced recently and how you solved it.",

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
    } = parsed.data;

    const personaBehavior =
      {
        "Friendly HR":
          "Warm, conversational, supportive, recruiter-like.",

        "Strict Technical Lead":
          "Strict, analytical, deep technical interviewer. Push candidate harder.",

        "Senior Engineering Manager":
          "Leadership-focused, architecture-focused, evaluates communication and ownership.",

        "Corporate VP":
          "Business-oriented executive interviewer focusing on impact and strategic thinking.",
      };

    const prompt = `
You are conducting a REALISTIC FAANG-style mock interview.

INTERVIEW SETTINGS:

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

PREVIOUS QUESTIONS:
${asked.join("\n")}

IMPORTANT RULES:

- Ask ONLY ONE question
- NEVER ask multiple questions
- NEVER return markdown
- NEVER return explanations
- Ask conversationally
- Avoid repeating previous questions
- Focus heavily on resume projects and JD skills
- Technical questions should feel company-level
- Ask realistic follow-up style questions
- Medium/Hard difficulty should become deeper and more analytical
- Mixed interviews should naturally alternate HR and technical
- HR questions should evaluate communication, ownership, teamwork, leadership
- Technical questions should evaluate depth, optimization, architecture, debugging, scalability
- Strict Technical Lead should ask tougher follow-ups
- Senior Engineering Manager should ask ownership/system-design style questions
- Corporate VP should focus on business impact and decision-making

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
                  prompt,
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

    let generatedQuestion;

    try {
      generatedQuestion =
        JSON.parse(
          cleaned
        );
    } catch {
      generatedQuestion =
        fallbackQuestion(
          round
        );
    }

    if (
      typeof generatedQuestion.question !==
      "string"
    ) {
      generatedQuestion =
        fallbackQuestion(
          round
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
  } catch (err: any) {
    console.error(
      "QUESTION ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,

        error:
          err?.message ||
          "Failed generating question",
      },
      { status: 500 }
    );
  }
}
