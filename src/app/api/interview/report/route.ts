import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createInterviewReport } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      question: z.string(),
      answer: z.string(),
      secondsSpent: z.number(),
      round: z.enum(["HR", "Technical", "Mixed"]).optional(),
      questionType: z.enum(["voice", "coding"]).optional(),
      expectedSignals: z.array(z.string()).optional(),
    }),
  ),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  jd: z.any().optional(),
  resume: z.any().optional(),
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(`report:${request.headers.get("x-forwarded-for") || "local"}`, 12, 60_000);
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report input." }, { status: 400 });
  }

  return NextResponse.json({
    report: await createInterviewReport({
      answers: parsed.data.answers,
      difficulty: parsed.data.difficulty,
      jd: parsed.data.jd,
      resume: parsed.data.resume,
    }),
  });
}
