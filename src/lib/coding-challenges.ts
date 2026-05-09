import type { CodingChallenge, Difficulty, JDAnalysis, ParsedResume } from "./types";

const defaultResume: ParsedResume = { rawText: "", skills: [], education: [], projects: [], summary: "" };

function pickTopic(resume: ParsedResume, jd?: JDAnalysis | null) {
  const resumeSkills = resume.skills.map((skill) => skill.toLowerCase());
  const jdSkills = jd?.requiredSkills.map((skill) => skill.toLowerCase()) ?? [];
  return (
    jdSkills.find((skill) => resumeSkills.includes(skill)) ||
    resumeSkills.find((skill) => /data structures|algorithms|python|javascript|java|c\+\+|sql|dbms|api/i.test(skill)) ||
    jdSkills[0] ||
    "arrays"
  );
}

export function createCodingChallenge(input?: {
  resume?: ParsedResume;
  jd?: JDAnalysis | null;
  difficulty?: Difficulty;
  experienceLevel?: string;
  interviewMode?: boolean;
}): CodingChallenge {
  const resume = input?.resume || defaultResume;
  const jd = input?.jd || null;
  const difficulty = input?.difficulty || "Medium";
  const topic = pickTopic(resume, jd);
  const role = jd?.role || "target role";
  const experience = input?.experienceLevel || "student/fresher";

  if (/sql|dbms|database/i.test(topic)) {
    return {
      title: "Aggregate User Activity",
      topic,
      difficulty,
      timeLimitSeconds: input?.interviewMode ? 900 : 1800,
      prompt:
        `For a ${role} JD, your resume/JD signal points to ${topic}. Write a program that reads user activity rows and prints the user id with the highest total score. If tied, print the smaller user id. First line is n, followed by n lines: userId score.`,
      testCases: [
        { input: "5\n1 10\n2 15\n1 20\n3 8\n2 5\n", expectedOutput: "1" },
        { input: "4\n4 7\n2 9\n4 2\n2 0\n", expectedOutput: "2" },
      ],
      solutionHint: "Use a map/dictionary keyed by user id and accumulate scores.",
      referenceAnswer:
        "Read n, aggregate score per user in a hash map, then scan entries to choose the highest score and smaller id on ties.",
    };
  }

  if (/string|communication|frontend|react|javascript|typescript/i.test(topic)) {
    return {
      title: "Normalize Skill Tags",
      topic,
      difficulty,
      timeLimitSeconds: input?.interviewMode ? 900 : 1800,
      prompt:
        `For a ${role} JD and ${experience} profile, normalize skill tags. Read n, then n lines of skill names. Print unique lowercase skills in first-seen order, separated by commas.`,
      testCases: [
        { input: "5\nReact\nreact\nNext JS\nSQL\nnext js\n", expectedOutput: "react,next js,sql" },
        { input: "4\nPython\nDBMS\npython\nOS\n", expectedOutput: "python,dbms,os" },
      ],
      solutionHint: "Trim each line, lowercase it, and keep first occurrences using a set.",
      referenceAnswer: "Use a set for seen skills and an array/list for output order.",
    };
  }

  return {
    title: "Two Sum for Role Fit",
    topic,
    difficulty,
    timeLimitSeconds: input?.interviewMode ? 900 : 1800,
    prompt:
      `Based on your resume/JD topic ${topic}, solve a core array/hash-map problem. Read n, then n integers, then target. Print the two indices whose values sum to target. If multiple answers exist, print the first valid pair found by left-to-right scan.`,
    testCases: [
      { input: "4\n2 7 11 15\n9\n", expectedOutput: "0 1" },
      { input: "5\n3 2 4 6 9\n10\n", expectedOutput: "2 3" },
    ],
    solutionHint: "Store value to index in a map. For each number, check whether target - value was seen.",
    referenceAnswer: "One pass hash map gives O(n) time and O(n) space.",
  };
}
