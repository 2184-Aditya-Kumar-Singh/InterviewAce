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
}): Promise<CodingChallenge> {
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
        input?.difficulty || "Medium",

      experienceLevel:
        input?.experienceLevel ||
        "student/fresher",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error ||
        "Failed generating coding challenge"
    );
  }

  return {
    ...data.question,

    timeLimitSeconds:
      input?.interviewMode
        ? 900
        : data.question.timeLimitSeconds || 1800,
  };
}
