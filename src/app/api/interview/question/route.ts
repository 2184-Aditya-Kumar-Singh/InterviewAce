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

  plan: z
    .enum([
      "FREE",
      "PRO",
      "PREMIUM",
    ])
    .optional(),

  persona: z
    .enum([
      "Friendly HR",
      "Strict Technical Lead",
      "Senior Engineering Manager",
      "Corporate VP",
    ])
    .optional(),

  asked: z
    .array(z.string())
    .default([]),

  topic: z
    .string()
    .optional(),

  tone: z
    .string()
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

  if (limited)
    return limited;

  const parsed =
    schema.safeParse(
      await request.json()
    );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid interview input.",
      },
      { status: 400 }
    );
  }

  try {
    if (
      !process.env.GROQ_API_KEY
    ) {
      return NextResponse.json(
        {
          error:
            "Missing GROQ API key",
        },
        { status: 500 }
      );
    }

    const {
      resume,
      jd,
      difficulty,
      round,
      persona,
      asked,
      topic,
      tone,
    } = parsed.data;

    const prompt = `
You are conducting a realistic professional mock interview.

Interview Type:
${round}

Interviewer Personality:
${persona}

Tone:
${tone}

Candidate Resume Summary:
${resume?.summary || ""}

Candidate Skills:
${resume?.skills?.join(
  ", "
)}

Candidate Projects:
${resume?.projects?.join(
  ", "
)}

Target Role:
${jd?.role || ""}

Required Skills:
${jd?.requiredSkills?.join(
  ", "
)}

Current Focus Topic:
${topic}

Difficulty:
${difficulty}

Previously Asked Questions:
${asked?.join("\n")}

Rules:

- Ask ONLY ONE question
- Make it realistic
- Match JD and Resume
- Technical questions should feel company-level
- HR questions should feel recruiter-level
- Avoid repeating previous questions
- Keep it concise
- If candidate appears strong ask deeper follow-up
- Mixed interviews should alternate naturally

Return ONLY RAW JSON.

Format:

{
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
                  "You are an expert AI interviewer.",
              },

              {
                role: "user",

                content:
                  prompt,
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
      return NextResponse.json(
        {
          error:
            "Invalid AI response",
          raw: cleaned,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      question:
        generatedQuestion,
    });
  } catch (err: any) {
    console.error(
      "QUESTION API ERROR:",
      err
    );

    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed generating question",
      },
      { status: 500 }
    );
  }
}
