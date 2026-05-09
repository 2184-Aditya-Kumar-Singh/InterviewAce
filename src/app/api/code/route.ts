import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing OpenAI API key",
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

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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

    const response =
      await client.chat.completions.create({
        model: "gpt-4o-mini",

        messages: [
          {
            role: "system",
            content:
              "You are an expert coding interview generator.",
          },

          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 1,
      });

    const text =
      response.choices[0].message.content || "";

    console.log("RAW AI RESPONSE:", text);

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
            "Invalid AI response format",
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
      "CODE API ERROR:",
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
