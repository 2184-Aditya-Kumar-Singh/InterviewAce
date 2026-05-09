export type Difficulty = "Easy" | "Medium" | "Hard";

export type InterviewPersona =
  | "Friendly HR"
  | "Strict Technical Lead"
  | "Senior Engineering Manager"
  | "Corporate VP";

export type InterviewRound = "HR" | "Technical" | "Mixed";

export type UserRole = "user" | "admin";

export type PlanKey = "FREE" | "PRO" | "PREMIUM";

export type InterviewPlan = "FREE" | "PRO" | "PREMIUM";

export type ParsedResume = {
  rawText: string;
  skills: string[];
  education: string[];
  projects: string[];
  summary: string;
};

export type JDAnalysis = {
  role: string;
  requiredSkills: string[];
  matchPercent: number;
  missingSkills: string[];
  summary: string;
};

export type InterviewQuestion = {
  id: string;
  question: string;
  focusArea: string;
  round: InterviewRound;
  expectedSignals: string[];
  type?: "voice" | "coding";
  codingPrompt?: string;
};

export type InterviewAnswer = {
  questionId?: string;
  question: string;
  answer: string;
  secondsSpent: number;
  round?: InterviewRound;
  questionType?: "voice" | "coding";
  expectedSignals?: string[];
};

export type AnswerReview = {
  question: string;
  answer: string;
  score: number;
  verdict: "Strong" | "Partial" | "Weak" | "Missing";
  feedback: string;
  missingSignals: string[];
};

export type InterviewReport = {
  overallScore: number;
  technicalScore: number;
  codingScore: number;
  resumeAlignmentScore: number;
  communicationScore: number;
  confidenceEstimate: number;
  answerReviews: AnswerReview[];
  strengths: string[];
  weaknesses: string[];
  resumeAdditions: string[];
  resumeRemovals: string[];
  focusAreas: string[];
  roadmap: string[];
};

export type CodingTestCase = {
  input: string;
  expectedOutput: string;
};

export type CodingChallenge = {
  title: string;
  prompt: string;
  topic: string;
  difficulty: Difficulty;
  timeLimitSeconds: number;
  testCases: CodingTestCase[];
  solutionHint: string;
  referenceAnswer: string;
};
