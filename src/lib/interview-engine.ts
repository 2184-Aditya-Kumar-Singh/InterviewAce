import type {
  Difficulty,
  InterviewAnswer,
  InterviewPlan,
  InterviewPersona,
  InterviewQuestion,
  InterviewReport,
  InterviewRound,
  JDAnalysis,
  ParsedResume,
} from "./types";

export async function generateQuestion(
  input: {
    resume: ParsedResume;

    jd: JDAnalysis;

    difficulty: Difficulty;

    round: InterviewRound;

    persona: InterviewPersona;

    plan: InterviewPlan;

    asked: string[];
  }
): Promise<InterviewQuestion> {
  try {
    const response =
      await fetch(
        "/api/interview/question",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            input
          ),
        }
      );

    const data =
      await response.json();

    if (
      !data?.question
    ) {
      throw new Error(
        "No question returned"
      );
    }

    return {
      id:
        data.question.id ||
        crypto.randomUUID(),

      question:
        typeof data.question
          .question ===
        "string"
          ? data.question
              .question
          : "Tell me about yourself.",

      focusArea:
        data.question
          .focusArea ||
        "General",

      round:
        data.question
          .round ||
        input.round,

      expectedSignals:
        Array.isArray(
          data.question
            .expectedSignals
        )
          ? data.question
              .expectedSignals
          : [],
    };
  } catch (err) {
    console.error(err);

    return {
      id:
        crypto.randomUUID(),

      question:
        "Tell me about a technical challenge you recently solved.",

      focusArea:
        "Problem Solving",

      round:
        input.round,

      expectedSignals:
        [
          "technical depth",
          "communication",
          "decision making",
        ],
    };
  }
}

export async function createInterviewReport(
  input: {
    answers: InterviewAnswer[];

    difficulty: Difficulty;

    jd?: JDAnalysis;

    resume?: ParsedResume;
  }
): Promise<InterviewReport> {
  const answered =
    input.answers.filter(
      (a) =>
        a.answer &&
        a.answer.trim()
          .length > 0
    );

  const technical =
    answered.filter(
      (a) =>
        a.round ===
        "Technical"
    );

  const score =
    answered.length > 0
      ? Math.min(
          95,
          55 +
            answered.length *
              5
        )
      : 0;

  return {
    overallScore:
      score,

    technicalScore:
      technical.length > 0
        ? Math.min(
            95,
            60 +
              technical.length *
                4
          )
        : 50,

    codingScore: 75,

    resumeAlignmentScore:
      input.jd
        ?.matchPercent ||
      60,

    communicationScore: 80,

    confidenceEstimate: 78,

    answerReviews:
      answered.map(
        (a) => ({
          question:
            a.question,

          answer:
            a.answer,

          score: 75,

          verdict:
            "Strong",

          feedback:
            "Good answer with reasonable clarity and structure.",

          missingSignals:
            [],
        })
      ),

    strengths: [
      "Good communication",

      "Relevant examples",

      "Strong technical alignment",
    ],

    weaknesses: [
      "Could improve depth in some answers",

      "Add more measurable impact",

      "Practice concise delivery",
    ],

    resumeAdditions: [
      "Add measurable project outcomes",

      "Highlight deployment experience",

      "Mention scalability work",
    ],

    resumeRemovals: [
      "Remove repetitive skills",

      "Reduce generic wording",
    ],

    focusAreas: [
      "System Design",

      "Problem Solving",

      "Behavioral Confidence",
    ],

    roadmap: [
      "Practice mock interviews daily",

      "Revise DSA fundamentals",

      "Improve STAR storytelling",

      "Strengthen system design",

      "Prepare project deep-dives",

      "Practice coding under time pressure",

      "Improve concise communication",
    ],
  };
}
