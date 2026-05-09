import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      role,
      skills,
      difficulty,
      experienceLevel,
    } = body;

    const prompt = `
Generate ONE realistic coding interview question.

Requirements:
- Role: ${role}
- Skills: ${skills?.join(", ")}
- Difficulty: ${difficulty}
- Experience: ${experienceLevel}

Return ONLY valid JSON in this format:

{
  "title": "",
  "topic": "",
  "difficulty": "",
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
- Create unique interview-style problem
- Similar to LeetCode/company OA
- Include proper constraints
- Avoid extremely easy questions
- Do NOT include markdown
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
        temperature: 0.9,
      });

    const text =
      response.choices[0].message.content;

    let parsed;

    try {
      parsed = JSON.parse(text || "{}");
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid AI response",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      question: parsed,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed generating coding question",
      },
      { status: 500 }
    );
  }
}
