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
      answers,
      difficulty,
      jd,
      resume,
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
You are an expert interview evaluator.

Analyze the complete mock interview.

Candidate Resume Summary:
${resume?.summary || ""}

Candidate Skills:
${resume?.skills?.join(
  ", "
)}

Job Role:
${jd?.role || ""}

Required Skills:
${jd?.requiredSkills?.join(
  ", "
)}

Interview Difficulty:
${difficulty}

Interview Answers:
${JSON.stringify(
  answers,
  null,
  2
)}

Instructions:

- Evaluate communication
- Evaluate technical depth
- Evaluate confidence
- Evaluate JD alignment
- Evaluate coding ability
- Detect weak answers
- Detect vague answers
- Give realistic recruiter-style review
- Give actionable improvements

Return ONLY RAW JSON.

Format:

{
  "overallScore": 0,
  "technicalScore": 0,
  "codingScore": 0,
  "communicationScore": 0,
  "confidenceEstimate": 0,
  "resumeAlignmentScore": 0,

  "strengths": [],

  "weaknesses": [],

  "resumeAdditions": [],

  "resumeRemovals": [],

  "focusAreas": [],

  "roadmap": [],

  "answerReviews": []
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
            "Invalid AI report response",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      report: parsed,
    });
  } catch (err: any) {
    console.error(
      "INTERVIEW REPORT ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err?.message ||
          "Failed generating report",
      },
      { status: 500 }
    );
  }
}
