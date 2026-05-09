import { NextResponse } from "next/server";

import {
  GoogleGenerativeAI,
} from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Gemini API key",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const {
      role,
      skills,
      difficulty,
      experienceLevel,
    } = body;

    const genAI =
      new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
      );

    const model =
      genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

    const prompt = `
Generate ONE realistic coding interview question.

Requirements:
- Role: ${role}
- Skills: ${skills?.join(", ")}
- Difficulty: ${difficulty}
- Experience: ${experienceLevel}

Return ONLY RAW JSON.

Do NOT wrap response in markdown.
Do NOT use markdown code blocks.
Do NOT explain anything.

Use this exact format:

{
  "title": "",
  "topic": "",
  "difficulty": "",
  "timeLimitSeconds": 1800,
  "prompt": "",
  "testCases": [
    {
      "input": "",
      "expectedOutput": ""
    }
  ],
  "solutionHint": "",
  "referenceAnswer": ""
}

Rules:
- Create unique interview-style problems
- Similar to LeetCode/company OA
- Include realistic constraints
- Avoid trivial problems
`;

    const result =
      await model.generateContent(prompt);

    const response =
      await result.response;

    const text = response.text();

    console.log(
      "GEMINI RAW RESPONSE:",
      text
    );

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error(
        "JSON Parse Error:",
        parseError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Gemini response format",
          raw: cleaned,
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
      "GEMINI API ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err?.message ||
          "Failed generating coding question",
      },
      { status: 500 }
    );
  }
}
