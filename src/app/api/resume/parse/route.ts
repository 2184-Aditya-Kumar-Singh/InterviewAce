import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { parseResumeText } from "@/lib/resume";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

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

  return NextResponse.json({ resume: parseResumeText(text) });
}
