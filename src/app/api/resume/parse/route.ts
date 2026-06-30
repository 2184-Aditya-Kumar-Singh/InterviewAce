import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import Groq from "groq-sdk";
import { parseResumeText } from "@/lib/resume";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(`resume:${request.headers.get("x-forwarded-for") || "local"}`, 8, 60_000);
  if (limited) return limited;

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Resume file is required." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";

  if (file.name.toLowerCase().endsWith(".pdf")) {
    let parser: { getText: () => Promise<{ text?: string }>; destroy: () => Promise<void> } | null = null;
    try {
      const { PDFParse } = await import("pdf-parse");
      parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      text = result.text || "";
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? `Could not extract text from this PDF: ${error.message}`
              : "Could not extract text from this PDF.",
        },
        { status: 422 },
      );
    } finally {
      await parser?.destroy().catch(() => undefined);
    }
  } else if (file.name.toLowerCase().endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    text = buffer.toString("utf8").replace(/\u0000/g, "");
  }

  if (text.trim().length < 20) {
    return NextResponse.json(
      { error: "Could not find enough resume text. Try a text-based PDF, DOCX, or TXT file." },
      { status: 422 },
    );
  }

  const fallback = parseResumeText(text);

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ resume: fallback });
  }

  try {
    const prompt = `
Parse this resume for mock interview generation.

Return ONLY raw JSON:
{
  "rawText": "",
  "name": "",
  "skills": [],
  "education": [],
  "projects": [],
  "summary": ""
}

Rules:
- name should be the candidate's full name as it appears at the top of the resume. If you cannot confidently identify a name, return an empty string.
- Keep rawText as the original resume text.
- skills should include technical and relevant soft skills, normalized and deduplicated.
- projects should be specific project lines with tech stack, role, and impact when present.
- education should include degree, institution, CGPA/GPA, and dates when present.
- summary should be a concise recruiter-style profile summary useful for asking interview questions.

Resume text:
${text.slice(0, 18000)}
`;

    const response = await getGroqClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume parser for technical interviews. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.15,
    });

    const raw = response.choices[0]?.message?.content || "";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      resume: {
        rawText: text,
        name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : fallback.name,
        skills: Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills : fallback.skills,
        education: Array.isArray(parsed.education) ? parsed.education : fallback.education,
        projects: Array.isArray(parsed.projects) ? parsed.projects : fallback.projects,
        summary: parsed.summary || fallback.summary,
      },
    });
  } catch (error) {
    console.error("RESUME AI PARSE ERROR:", error);
    return NextResponse.json({ resume: fallback });
  }
}
