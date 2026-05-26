import type {
  CodingChallenge,
  Difficulty,
  JDAnalysis,
  ParsedResume,
} from "./types";

export async function createCodingChallenge(input?: {
  resume?: ParsedResume;
  jd?: JDAnalysis | null;
  difficulty?: Difficulty;
  experienceLevel?: string;
  interviewMode?: boolean;
  avoidedQuestions?: string[];
}): Promise<CodingChallenge> {
  const fallbackChallenge: CodingChallenge = {
    title: "Two Sum",
    topic: "Arrays and Hash Maps",
    difficulty:
      input?.difficulty || "Medium",
    timeLimitSeconds:
      input?.interviewMode
        ? 900
        : 1800,
    prompt: `Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.

Input Format:
- First line contains integer n
- Second line contains n space-separated integers
- Third line contains target

Output Format:
- Print the two indices separated by a space

Example:
Input:
4
2 7 11 15
9

Output:
0 1`,
    testCases: [
      {
        input: "4\n2 7 11 15\n9",
        expectedOutput: "0 1",
      },
      {
        input: "3\n3 2 4\n6",
        expectedOutput: "1 2",
      },
      {
        input: "2\n3 3\n6",
        expectedOutput: "0 1",
      },
    ],
    solutionHint:
      "Use a hash map to remember previously seen values and their indices.",
    referenceAnswer:
      "Iterate once, check target - current in a map, otherwise store current value with its index.",
  };

  try {
    const response = await fetch("/api/code", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        role:
          input?.jd?.role ||
          "Software Engineer",

        skills:
          input?.resume?.skills || [],

        difficulty:
          input?.difficulty ||
          "Medium",

        experienceLevel:
          input?.experienceLevel ||
          "student/fresher",

        avoidedQuestions:
          input?.avoidedQuestions ||
          [],
      }),
    });

    const data = await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      console.warn(
        data.error ||
          "Failed generating coding challenge"
      );

      return fallbackChallenge;
    }

    return {
      ...data.question,

      timeLimitSeconds:
        input?.interviewMode
          ? 900
          : data.question
              .timeLimitSeconds ||
            1800,
    };
  } catch (error) {
    console.error(error);
    return fallbackChallenge;
  }
}
