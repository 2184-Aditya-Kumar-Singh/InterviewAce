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

Return ONLY RAW JSON.

DO NOT wrap response in markdown.
DO NOT use \`\`\`json.
DO NOT explain anything.

Format:

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

    console.log("AI RESPONSE:", text);

    // CLEAN MARKDOWN IF AI ADDS IT
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
