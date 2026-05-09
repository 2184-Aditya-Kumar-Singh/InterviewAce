import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  language: z.enum(["Java", "Python", "C++", "C", "JavaScript"]),
  code: z.string().min(1).max(50_000),
  prompt: z.string().max(5_000),
});

function mockReview(code: string) {
  const hasHashMap = /map|dict|unordered_map|HashMap|object|Map/i.test(code);
  const score = hasHashMap ? 82 : 64;
  return {
    score,
    correctness: hasHashMap ? 85 : 62,
    timeComplexity: hasHashMap ? "O(n)" : "Likely O(n^2)",
    spaceComplexity: hasHashMap ? "O(n)" : "O(1)",
    readability: code.length > 80 ? 78 : 58,
    edgeCases: hasHashMap ? 76 : 50,
    optimization: hasHashMap ? "Good use of lookup storage." : "Use a hash map to reduce nested loops.",
    suggestions: [
      hasHashMap ? "Add comments explaining the lookup invariant." : "Replace brute force with a hash map.",
      "Handle empty arrays and no-solution cases explicitly.",
      "Mention complexity in your final explanation.",
    ],
  };
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(`code-review:${request.headers.get("x-forwarded-for") || "local"}`, 8, 60_000);
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code review request." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ review: mockReview(parsed.data.code) });
  }

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
              "Review candidate code for an interview. Return JSON with score, correctness, timeComplexity, spaceComplexity, readability, edgeCases, optimization, suggestions array.",
          },
          { role: "user", content: JSON.stringify(parsed.data) },
        ],
      }),
    });
    const data = await response.json();
    const review = JSON.parse(data.choices?.[0]?.message?.content || "{}");
    return NextResponse.json({ review: Object.keys(review).length ? review : mockReview(parsed.data.code) });
  } catch {
    return NextResponse.json({ review: mockReview(parsed.data.code) });
  }
}
