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

  if (limited) return limited;

  try {
    const parsed =
      schema.safeParse(
        await request.json()
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Invalid interview request",
        },
        { status: 400 }
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

    const prompt = `
You are an expert AI interviewer conducting a realistic mock interview.

Candidate Resume Summary:
${resume?.summary || ""}

Candidate Skills:
${resume?.skills?.join(", ") || ""}

Candidate Projects:
${resume?.projects?.join(", ") || ""}

Target Role:
${jd?.role || ""}

Required Skills:
${jd?.requiredSkills?.join(", ") || ""}

Difficulty:
${difficulty}

Interview Type:
${round}

Interviewer Persona:
${persona}

Previously Asked Questions:
${asked.join("\n")}

Rules:
- Ask ONLY ONE interview question
- Make it realistic
- Keep it conversational
- Technical questions should feel like FAANG/company interviews
- HR questions should feel recruiter-like
- Mixed should naturally alternate
- NEVER return objects as question
- ALWAYS return plain string question
- Avoid repeating questions
- Focus on resume + JD alignment

Return ONLY valid raw JSON.

Format:

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
                  "You are a senior interviewer.",
              },

              {
                role: "user",

                content: prompt,
              },
            ],

            temperature: 0.8,
          }),
        }
      );

    const data =
      await response.json();

    const text =
      data?.choices?.[0]
        ?.message?.content ||
      "";

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let generatedQuestion;

    try {
      generatedQuestion =
        JSON.parse(cleaned);
    } catch {
      generatedQuestion = {
        id: crypto.randomUUID(),

        question:
          "Tell me about a technical challenge you recently solved.",

        focusArea:
          "Problem Solving",

        round,

        expectedSignals:
          [
            "communication",
            "technical depth",
            "decision making",
          ],
      };
    }

    if (
      typeof generatedQuestion.question !==
      "string"
    ) {
      generatedQuestion.question =
        "Tell me about a technical challenge you recently solved.";
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
