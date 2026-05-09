import { NextResponse } from "next/server";

import {
  GoogleGenerativeAI,
} from "@google/generative-ai";

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const {
      resume,
      jd,
      difficulty,
      round,
      persona,
      topic,
      asked,
      tone,
    } = body;

    if (
      !process.env.GEMINI_API_KEY
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing Gemini API key",
        },
        { status: 500 }
      );
    }

    const genAI =
      new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
      );

    const model =
      genAI.getGenerativeModel({
        model:
          "gemini-1.5-flash",
      });

    const prompt = `
You are conducting a professional mock interview.

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

Job Role:
${jd?.role || ""}

JD Required Skills:
${jd?.requiredSkills?.join(
  ", "
)}

Target Topic:
${topic}

Difficulty:
${difficulty}

Previously Asked Questions:
${asked?.join("\n")}

Instructions:

- Ask ONLY ONE interview question
- Make question realistic
- Question should match resume and JD
- Technical questions should feel company-level
- HR questions should feel realistic
- Avoid repeating old questions
- Mixed round can combine behavioral + technical
- If candidate appears strong, ask deeper follow-up
- Keep question concise but professional

Return ONLY RAW JSON.

Format:

{
  "question": "",
  "focusArea": "",
  "round": "",
  "expectedSignals": []
}
`;

    const result =
      await model.generateContent(
        prompt
      );

    const response =
      await result.response;

    const text =
      response.text();

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed =
        JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid AI response",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      question: parsed,
    });
  } catch (err: any) {
    console.error(
      "INTERVIEW QUESTION ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err?.message ||
          "Failed generating question",
      },
      { status: 500 }
    );
  }
}
