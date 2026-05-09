import OpenAI from "openai";

import type {
  CodingChallenge,
  Difficulty,
  JDAnalysis,
  ParsedResume,
} from "./types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const defaultResume: ParsedResume = {
  rawText: "",
  skills: [],
  education: [],
  projects: [],
  summary: "",
};

function pickTopic(
  resume: ParsedResume,
  jd?: JDAnalysis | null
) {
  const resumeSkills = resume.skills.map((s) =>
    s.toLowerCase()
  );

  const jdSkills =
    jd?.requiredSkills.map((s) =>
      s.toLowerCase()
    ) ?? [];

  return (
    jdSkills.find((skill) =>
      resumeSkills.includes(skill)
    ) ||
    resumeSkills[0] ||
    jdSkills[0] ||
    "arrays"
  );
}

export async function createCodingChallenge(input?: {
  resume?: ParsedResume;
  jd?: JDAnalysis | null;
  difficulty?: Difficulty;
  experienceLevel?: string;
  interviewMode?: boolean;
}): Promise<CodingChallenge> {
  const resume =
    input?.resume || defaultResume;

  const jd = input?.jd || null;

  const difficulty =
    input?.difficulty || "Medium";

  const experienceLevel =
    input?.experienceLevel ||
    "student/fresher";

  const topic = pickTopic(resume, jd);

  const role = jd?.role || "Software Engineer";

  try {
    const prompt = `
Generate ONE realistic coding interview question.

Requirements:
- Role: ${role}
- Topic: ${topic}
- Skills: ${resume.skills.join(", ")}
- Difficulty: ${difficulty}
- Experience Level: ${experienceLevel}

Return ONLY valid JSON in this format:

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
- Must resemble real LeetCode/company interview question
- Make it unique
- Include proper realistic test cases
- Avoid trivial questions
- No markdown
`;

    const response =
      await client.chat.completions.create({
        model: "gpt-4o-mini",

        messages: [
          {
            role: "system",
            content:
              "You are an expert technical interviewer generating realistic coding interview problems.",
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

    if (!text) {
      throw new Error(
        "No coding question generated"
      );
    }

    const parsed =
      JSON.parse(text) as CodingChallenge;

    return {
      ...parsed,

      timeLimitSeconds:
        input?.interviewMode
          ? 900
          : parsed.timeLimitSeconds || 1800,
    };
  } catch (err) {
    console.error(
      "AI coding generation failed:",
      err
    );

    // FALLBACK QUESTION
    return {
      title: "Two Sum",
      topic: "arrays",
      difficulty: "Easy",
      timeLimitSeconds:
        input?.interviewMode ? 900 : 1800,

      prompt:
        "Given an array and a target, print indices of two numbers whose sum equals target.",

      testCases: [
        {
          input: "4\n2 7 11 15\n9",
          expectedOutput: "0 1",
        },
      ],

      solutionHint:
        "Use hashmap for O(n) solution.",

      referenceAnswer:
        "Store visited numbers in a map.",
    };
  }
}
