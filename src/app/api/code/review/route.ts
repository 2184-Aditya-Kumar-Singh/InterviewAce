import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import Groq from "groq-sdk";

import { rateLimit } from "@/lib/rate-limit";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const schema = z.object({
  language: z.enum([
    "Java",
    "Python",
    "C++",
    "C",
    "JavaScript",
  ]),

  code: z
    .string()
    .min(1)
    .max(50_000),

  prompt: z
    .string()
    .max(10_000),
});

function mockReview(
  code: string
) {
  const normalized =
    code.toLowerCase();

  const hasMap =
    /map|hashmap|unordered_map|dict|object|set/i.test(
      normalized
    );

  const hasLoop =
    /for|while/i.test(
      normalized
    );

  const nestedLoop =
    /(for[\s\S]*for)|(while[\s\S]*while)/i.test(
      normalized
    );

  const hasFunction =
    /function|def|public|class/i.test(
      normalized
    );

  const hasComments =
    /\/\/|#|\/\*/.test(
      normalized
    );

  let score = 45;

  if (hasFunction)
    score += 10;

  if (hasLoop)
    score += 10;

  if (hasMap)
    score += 18;

  if (hasComments)
    score += 5;

  if (nestedLoop)
    score -= 12;

  score = Math.max(
    20,
    Math.min(95, score)
  );

  return {
    score,

    correctness:
      score >= 75
        ? 84
        : score >= 60
        ? 68
        : 45,

    timeComplexity:
      nestedLoop
        ? "O(n²)"
        : hasMap
        ? "O(n)"
        : "O(n log n)",

    spaceComplexity:
      hasMap
        ? "O(n)"
        : "O(1)",

    readability:
      hasComments
        ? 82
        : 62,

    edgeCases:
      score >= 75
        ? 80
        : 55,

    optimization:
      hasMap
        ? "Good use of optimized lookup-based approach."
        : nestedLoop
        ? "Current solution may become slow for large inputs."
        : "Can be optimized further using better data structures.",

    suggestions: [
      nestedLoop
        ? "Avoid nested loops where possible."
        : "Good attempt on optimization.",

      "Handle null, empty, and edge cases explicitly.",

      "Explain time complexity clearly during interviews.",

      "Improve variable naming for readability.",
    ],
  };
}

export async function POST(
  request: NextRequest
) {
  const limited =
    rateLimit(
      `code-review:${
        request.headers.get(
          "x-forwarded-for"
        ) || "local"
      }`,
      8,
      60_000
    );

  if (limited)
    return limited;

  const parsed =
    schema.safeParse(
      await request.json()
    );

  if (
    !parsed.success
  ) {
    return NextResponse.json(
      {
        error:
          "Invalid code review request.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    code,
    prompt,
    language,
  } = parsed.data;

  if (
    !process.env
      .GROQ_API_KEY
  ) {
    return NextResponse.json({
      review:
        mockReview(code),
    });
  }

  try {
    const aiPrompt = `
You are an expert FAANG-level coding interviewer.

Analyze this coding interview submission realistically.

Judge:
- correctness
- optimization
- edge cases
- readability
- interview readiness
- time complexity
- brute force vs optimized thinking

Be strict and realistic.

If the code is weak, score low.

Return ONLY RAW JSON.

FORMAT:

{
  "score": 0,
  "correctness": 0,
  "timeComplexity": "",
  "spaceComplexity": "",
  "readability": 0,
  "edgeCases": 0,
  "optimization": "",
  "suggestions": []
}

QUESTION:
${prompt}

LANGUAGE:
${language}

CODE:
${code}
`;

    const response =
      await client.chat.completions.create(
        {
          model:
            "llama-3.3-70b-versatile",

          messages: [
            {
              role:
                "system",

              content:
                "You are a strict senior coding interviewer. Return ONLY valid JSON.",
            },

            {
              role:
                "user",

              content:
                aiPrompt,
            },
          ],

          temperature: 0.3,
        }
      );

    const text =
      response.choices[0]
        ?.message
        ?.content || "";

    console.log(
      "GROQ REVIEW:",
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

    let review;

    try {
      review =
        JSON.parse(
          cleaned
        );
    } catch (
      parseError
    ) {
      console.error(
        "JSON PARSE ERROR:",
        parseError
      );

      return NextResponse.json({
        review:
          mockReview(
            code
          ),
      });
    }

    return NextResponse.json({
      review:
        Object.keys(
          review
        ).length > 0
          ? review
          : mockReview(
              code
            ),
    });
  } catch (err) {
    console.error(
      "GROQ REVIEW ERROR:",
      err
    );

    return NextResponse.json({
      review:
        mockReview(code),
    });
  }
}
