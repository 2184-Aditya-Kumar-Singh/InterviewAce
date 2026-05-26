import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Groq from "groq-sdk";
import { analyzeJobDescription } from "@/lib/jd";
import { rateLimit } from "@/lib/rate-limit";

function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

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

  const fallback = analyzeJobDescription(parsed.data.jdText, parsed.data.resume);

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ analysis: fallback });
  }

  try {
    const prompt = `
Analyze this job description against the candidate resume for interview preparation.

Return ONLY raw JSON:
{
  "role": "",
  "requiredSkills": [],
  "matchPercent": 0,
  "missingSkills": [],
  "summary": ""
}

Rules:
- Extract specific role title, core responsibilities, tools, frameworks, databases, CS topics, and soft skills.
- requiredSkills should be concise normalized skill names.
- missingSkills are required skills not clearly present in the resume.
- matchPercent must reflect realistic hiring alignment, not keyword stuffing.
- summary should explain what interview questions should focus on in 2-3 sentences.

Resume:
${JSON.stringify(parsed.data.resume || {}, null, 2)}

Job description:
${parsed.data.jdText}
`;

    const response = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an expert recruiter and technical interviewer. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const text = response.choices[0]?.message?.content || "";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const analysis = JSON.parse(cleaned);

    return NextResponse.json({
      analysis: {
        role: analysis.role || fallback.role,
        requiredSkills: Array.isArray(analysis.requiredSkills)
          ? analysis.requiredSkills
          : fallback.requiredSkills,
        matchPercent:
          typeof analysis.matchPercent === "number"
            ? Math.max(0, Math.min(100, Math.round(analysis.matchPercent)))
            : fallback.matchPercent,
        missingSkills: Array.isArray(analysis.missingSkills)
          ? analysis.missingSkills
          : fallback.missingSkills,
        summary: analysis.summary || fallback.summary,
      },
    });
  } catch (err) {
    console.error("JD AI ANALYSIS ERROR:", err);
    return NextResponse.json({ analysis: fallback });
  }
}
