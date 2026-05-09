import {
  NextRequest,
  NextResponse,
} from "next/server";

import { z } from "zod";

import {
  GoogleGenerativeAI,
} from "@google/generative-ai";

import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  language: z.enum([
    "Java",
    "Python",
    "C++",
    "C",
    "JavaScript",
  ]),

  code: z.string().min(1).max(50_000),

  prompt: z.string().max(5_000),
});

function mockReview(code: string) {
  const hasHashMap =
    /map|dict|unordered_map|HashMap|object|Map/i.test(
      code
    );

  const score = hasHashMap
    ? 82
    : 64;

  return {
    score,

    correctness: hasHashMap
      ? 85
      : 62,

    timeComplexity: hasHashMap
      ? "O(n)"
      : "Likely O(n^2)",

    spaceComplexity: hasHashMap
      ? "O(n)"
      : "O(1)",

    readability:
      code.length > 80 ? 78 : 58,

    edgeCases: hasHashMap
      ? 76
      : 50,

    optimization: hasHashMap
      ? "Good use of lookup storage."
      : "Use a hash map to reduce nested loops.",

    suggestions: [
      hasHashMap
        ? "Add comments explaining the lookup invariant."
        : "Replace brute force with a hash map.",

      "Handle empty arrays and no-solution cases explicitly.",

      "Mention complexity in your final explanation.",
    ],
  };
}

export async function POST(
  request: NextRequest
) {
  const limited = rateLimit(
    `code-review:${
      request.headers.get(
        "x-forwarded-for"
      ) || "local"
    }`,
    8,
    60_000
  );

  if (limited) return limited;

  const parsed = schema.safeParse(
    await request.json()
  );

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Invalid code review request.",
      },
      { status: 400 }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      review: mockReview(
        parsed.data.code
      ),
    });
  }

  try {
    const genAI =
      new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
      );

    const model =
      genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

    const prompt = `
Review this coding interview submission.

Return ONLY RAW JSON.

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

Submission:
${JSON.stringify(parsed.data)}
`;

    const result =
      await model.generateContent(
        prompt
      );

    const response =
      await result.response;

    const text = response.text();

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const review =
      JSON.parse(cleaned);

    return NextResponse.json({
      review:
        Object.keys(review).length
          ? review
          : mockReview(
              parsed.data.code
            ),
    });
  } catch (err) {
    console.error(
      "GEMINI REVIEW ERROR:",
      err
    );

    return NextResponse.json({
      review: mockReview(
        parsed.data.code
      ),
    });
  }
}
