import { NextResponse } from "next/server";

import Groq from "groq-sdk";

function getGroqClient() {
  return new Groq({
    apiKey:
      process.env.GROQ_API_KEY,
  });
}

function normalizeQuestion(
  value: string
) {
  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function isSimilar(
  current: string,
  previous: string
) {
  const currentWords =
    new Set(
      normalizeQuestion(current)
        .split(" ")
        .filter(
          (word) =>
            word.length > 3
        )
    );

  const previousWords =
    new Set(
      normalizeQuestion(previous)
        .split(" ")
        .filter(
          (word) =>
            word.length > 3
        )
    );

  if (
    currentWords.size === 0 ||
    previousWords.size === 0
  )
    return false;

  const overlap = Array.from(
    currentWords
  ).filter((word) =>
    previousWords.has(word)
  ).length;

  return (
    overlap /
      Math.min(
        currentWords.size,
        previousWords.size
      ) >=
    0.55
  );
}

function hasBeenAsked(
  candidate: {
    title?: string;
    prompt?: string;
  },
  avoided: string[]
) {
  const combined = `${candidate.title || ""}\n${candidate.prompt || ""}`;

  return avoided.some(
    (previous) =>
      normalizeQuestion(
        candidate.title || ""
      ) ===
        normalizeQuestion(
          previous
        ) ||
      isSimilar(combined, previous)
  );
}

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

      avoidedQuestions = [],
    } = body;

    const difficultyRules =
      difficulty === "Easy"
        ? "Easy: arrays, strings, hash maps, simple loops, one clear trick, 15-20 minutes."
        : difficulty === "Hard"
        ? "Hard: graph/DP/heap/sliding-window/systematic optimization, multiple edge cases, 35-45 minutes."
        : "Medium: hash maps, two pointers, binary search, trees, stacks, queues, or greedy trade-offs, 25-30 minutes.";

    const prompt = `
Generate ONE realistic coding interview question.

Requirements:
- Role: ${role}
- Skills: ${skills?.join(", ")}
- Difficulty: ${difficulty}
- Experience: ${experienceLevel}
- Difficulty calibration: ${difficultyRules}

Already solved by this user. Do NOT repeat these titles, topics, patterns, or near-duplicates:
${Array.isArray(avoidedQuestions) ? avoidedQuestions.join("\n") : ""}

Rules:
- Make it similar to LeetCode/company OA
- Problem statement must be VERY clear
- Include constraints
- Include input format
- Include output format
- Include realistic edge cases and at least 3 runnable test cases
- Hidden testcase count should be assumed as 5
- Avoid trivia, syntax-only, or generic "write a CRUD API" questions
- Prefer topics connected to the role skills when possible
- Do not generate Two Sum, palindrome, fizzbuzz, or any question already listed above unless the avoided list is empty
- If a skill points to the same old problem, choose a different problem pattern
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

    let parsed;

    for (
      let attempt = 0;
      attempt < 2;
      attempt += 1
    ) {
      const response =
        await getGroqClient().chat.completions.create(
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
                attempt === 0
                  ? prompt
                  : `${prompt}

The previous generated coding question was too similar to the solved history. Generate a different topic and problem pattern.`,
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

        parsed = null;
      }

      if (
        parsed &&
        !hasBeenAsked(
          parsed,
          Array.isArray(
            avoidedQuestions
          )
            ? avoidedQuestions
            : []
        )
      ) {
        break;
      }

      parsed = null;
    }

    if (!parsed) {
      parsed = {
        title:
          Array.isArray(
            avoidedQuestions
          ) &&
          avoidedQuestions.some(
            (item: string) =>
              /two sum/i.test(
                item
              )
          )
            ? "Valid Parentheses"
            : "Two Sum",

        topic:
          Array.isArray(
            avoidedQuestions
          ) &&
          avoidedQuestions.some(
            (item: string) =>
              /two sum/i.test(
                item
              )
          )
            ? "Stack"
            : "Arrays",

        difficulty:
          difficulty ||
          "Medium",

        timeLimitSeconds: 600,

        prompt:
          Array.isArray(
            avoidedQuestions
          ) &&
          avoidedQuestions.some(
            (item: string) =>
              /two sum/i.test(
                item
              )
          )
            ? `
Given a string containing only parentheses characters '(', ')', '{', '}', '[' and ']', determine whether the string is valid.

Input Format:
- One line containing string s

Output Format:
- Print true if valid, otherwise false

Constraints:
- 1 <= s.length <= 10^5

Example:
Input:
()[]{}

Output:
true
        `
            : `
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

        testCases:
          Array.isArray(
            avoidedQuestions
          ) &&
          avoidedQuestions.some(
            (item: string) =>
              /two sum/i.test(
                item
              )
          )
            ? [
                {
                  input: "()[]{}",
                  expectedOutput:
                    "true",
                },
                {
                  input: "(]",
                  expectedOutput:
                    "false",
                },
              ]
            : [
                {
                  input:
                    "4\n2 7 11 15\n9",

                  expectedOutput:
                    "0 1",
                },
              ],

        solutionHint:
          Array.isArray(
            avoidedQuestions
          ) &&
          avoidedQuestions.some(
            (item: string) =>
              /two sum/i.test(
                item
              )
          )
            ? "Use a stack to track opening brackets and match each closing bracket."
            : "Use hashmap for O(n) solution.",

        referenceAnswer:
          Array.isArray(
            avoidedQuestions
          ) &&
          avoidedQuestions.some(
            (item: string) =>
              /two sum/i.test(
                item
              )
          )
            ? "Push opening brackets onto a stack, pop and compare when a closing bracket appears, and ensure the stack is empty at the end."
            : "Use a hash map to store previously seen numbers.",
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
  } catch (err: unknown) {
    console.error(
      "GROQ API ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,

        error:
          err instanceof Error
            ? err.message
            :
          "Failed generating coding question",
      },
      { status: 500 }
    );
  }
}
