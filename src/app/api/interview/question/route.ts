import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateQuestion } from "@/lib/ai";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  resume: z.any(),
  jd: z.any(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  round: z.enum(["HR", "Technical", "Mixed"]).default("HR"),
  plan: z.enum(["FREE", "PRO", "PREMIUM"]).optional(),
  persona: z.enum(["Friendly HR", "Strict Technical Lead", "Corporate Manager"]).optional(),
  asked: z.array(z.string()).default([]),
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(`question:${request.headers.get("x-forwarded-for") || "local"}`, 30, 60_000);
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid interview input." }, { status: 400 });
  }

  return NextResponse.json({ question: await generateQuestion(parsed.data) });
}
