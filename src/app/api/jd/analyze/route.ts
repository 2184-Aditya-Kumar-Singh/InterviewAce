import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeJobDescription } from "@/lib/jd";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  jdText: z.string().min(10).max(20_000),
  resume: z.any().optional(),
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(`jd:${request.headers.get("x-forwarded-for") || "local"}`);
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Paste a valid job description." }, { status: 400 });
  }

  return NextResponse.json({ analysis: analyzeJobDescription(parsed.data.jdText, parsed.data.resume) });
}
