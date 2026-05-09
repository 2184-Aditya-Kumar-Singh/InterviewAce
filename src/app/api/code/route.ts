import { NextResponse } from "next/server";

import Groq from "groq-sdk";

const client = new Groq({
  apiKey:
    process.env.GROQ_API_KEY,
});

export async function POST(
  req: Request
) {
  try {
    if (
      !process.env.GROQ_API_KEY
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Missing GROQ API key",
        },
        { status: 500 }
      );
    }

    const body =
      await req.json();

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

Rules:
- Make it similar to LeetCode/company OA
- Problem statement must be VERY clear
- Include constraints
- Include input format
- Include output format
- Include realistic edge cases
- Include one sample testcase
- Hidden testcase count should be assumed as 5
- Avoid trivial questions
- Return ONLY RAW JSON
- NEVER return markdown

Return EXACT format:

{
  "title": "",
  "topic": "",
  "difficulty": "",
  "timeLimitSeconds": 600,
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
`;

    const response =
      await client.chat.completions.create(
        {
          model:
            "llama-3.3-70b-versatile",

          messages: [
            {
              role: "system",

              content:
                "You are an expert coding interviewer.",
            },

            {
              role: "user",

              content:
                prompt,
            },
          ],

          temperature: 0.7,
        }
      );

    const text =
      response.choices[0]
        ?.message?.content ||
      "";

    console.log(
      "GROQ RAW RESPONSE:",
      text
    );

    const cleaned = text
      .replace(
        /```json/g,
        ""
      )
      .replace(
        /```/g,
        ""
      )
      .trim();

    let parsed;

    try {
      parsed =
        JSON.parse(cleaned);
    } catch (
      parseError
    ) {
      console.error(
        "JSON Parse Error:",
        parseError
      );

      parsed = {
        title:
          "Two Sum",

        topic:
          "Arrays",

        difficulty:
          difficulty ||
          "Medium",

        timeLimitSeconds: 600,

        prompt: `
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

Input Format:
- First line contains integer n
- Second line contains n space-separated integers
- Third line contains target integer

Output Format:
- Print indices of the two numbers

Constraints:
- 2 <= nums.length <= 10^5
- Exactly one valid answer exists

Example:
Input:
4
2 7 11 15
9

Output:
0 1
        `,

        testCases: [
          {
            input:
              "4\n2 7 11 15\n9",

            expectedOutput:
              "0 1",
          },
        ],

        solutionHint:
          "Use hashmap for O(n) solution.",

        referenceAnswer:
          "Use a hash map to store previously seen numbers.",
      };
    }

    if (
      typeof parsed.prompt !==
      "string"
    ) {
      parsed.prompt =
        "Solve the coding problem efficiently.";
    }

    if (
      !Array.isArray(
        parsed.testCases
      )
    ) {
      parsed.testCases = [
        {
          input: "Sample",

          expectedOutput:
            "Sample",
        },
      ];
    }

    return NextResponse.json({
      success: true,

      question: parsed,
    });
  } catch (err: any) {
    console.error(
      "GROQ API ERROR:",
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
