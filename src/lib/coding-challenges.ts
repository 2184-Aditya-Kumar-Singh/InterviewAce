import type {
  CodingChallenge,
  Difficulty,
  JDAnalysis,
  ParsedResume,
} from "./types";

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

const codingBank: Record<
  string,
  CodingChallenge[]
> = {
  arrays: [
    {
      title: "Two Sum",
      topic: "arrays",
      difficulty: "Easy",
      timeLimitSeconds: 1800,
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
    },

    {
      title: "Maximum Subarray",
      topic: "arrays",
      difficulty: "Medium",
      timeLimitSeconds: 1800,
      prompt:
        "Find the contiguous subarray with maximum sum.",
      testCases: [
        {
          input: "8\n-2 1 -3 4 -1 2 1 -5",
          expectedOutput: "6",
        },
      ],
      solutionHint:
        "Kadane’s Algorithm.",
      referenceAnswer:
        "Track current and global maximum.",
    },
  ],

  strings: [
    {
      title: "Valid Palindrome",
      topic: "strings",
      difficulty: "Easy",
      timeLimitSeconds: 1800,
      prompt:
        "Check if given string is palindrome ignoring spaces and punctuation.",
      testCases: [
        {
          input: "A man a plan a canal Panama",
          expectedOutput: "true",
        },
      ],
      solutionHint:
        "Use two pointers.",
      referenceAnswer:
        "Normalize string and compare.",
    },

    {
      title: "Longest Unique Substring",
      topic: "strings",
      difficulty: "Medium",
      timeLimitSeconds: 1800,
      prompt:
        "Find length of longest substring without repeating characters.",
      testCases: [
        {
          input: "abcabcbb",
          expectedOutput: "3",
        },
      ],
      solutionHint:
        "Sliding window + set.",
      referenceAnswer:
        "Expand and shrink window.",
    },
  ],

  sql: [
    {
      title: "Top Scoring User",
      topic: "sql",
      difficulty: "Easy",
      timeLimitSeconds: 1800,
      prompt:
        "Find user with highest cumulative score.",
      testCases: [
        {
          input:
            "5\n1 10\n2 15\n1 20\n3 8\n2 5",
          expectedOutput: "1",
        },
      ],
      solutionHint:
        "Use hashmap aggregation.",
      referenceAnswer:
        "Track cumulative score per user.",
    },
  ],

  frontend: [
    {
      title: "Debounce Function",
      topic: "frontend",
      difficulty: "Medium",
      timeLimitSeconds: 1800,
      prompt:
        "Implement debounce function in JavaScript.",
      testCases: [
        {
          input: "debounce(fn,300)",
          expectedOutput:
            "Function delays execution.",
        },
      ],
      solutionHint:
        "Use setTimeout and clearTimeout.",
      referenceAnswer:
        "Store timer reference.",
    },

    {
      title: "Flatten Nested Array",
      topic: "frontend",
      difficulty: "Easy",
      timeLimitSeconds: 1800,
      prompt:
        "Flatten nested array without using flat().",
      testCases: [
        {
          input: "[1,[2,[3]],4]",
          expectedOutput: "[1,2,3,4]",
        },
      ],
      solutionHint:
        "Use recursion.",
      referenceAnswer:
        "Recursive DFS flattening.",
    },
  ],
};

function inferCategory(topic: string) {
  if (
    /sql|dbms|database/i.test(topic)
  )
    return "sql";

  if (
    /react|frontend|javascript|typescript/i.test(
      topic
    )
  )
    return "frontend";

  if (
    /string|communication/i.test(topic)
  )
    return "strings";

  return "arrays";
}

export function createCodingChallenge(input?: {
  resume?: ParsedResume;
  jd?: JDAnalysis | null;
  difficulty?: Difficulty;
  experienceLevel?: string;
  interviewMode?: boolean;
}): CodingChallenge {
  const resume =
    input?.resume || defaultResume;

  const jd = input?.jd || null;

  const topic = pickTopic(resume, jd);

  const category = inferCategory(topic);

  const questions =
    codingBank[category] ||
    codingBank.arrays;

  // RANDOM QUESTION
  const randomQuestion =
    questions[
      Math.floor(
        Math.random() * questions.length
      )
    ];

  return {
    ...randomQuestion,
    difficulty:
      input?.difficulty ||
      randomQuestion.difficulty,
    timeLimitSeconds:
      input?.interviewMode
        ? 900
        : randomQuestion.timeLimitSeconds,
  };
}
