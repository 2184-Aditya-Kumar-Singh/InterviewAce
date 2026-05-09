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

function pickSkill(
  resume: ParsedResume,
  jd: JDAnalysis
) {
  const resumeSkills =
    resume.skills.map((s) =>
      s.toLowerCase()
    );

  const jdSkills =
    jd.requiredSkills.map((s) =>
      s.toLowerCase()
    );

  return (
    jdSkills.find((skill) =>
      resumeSkills.includes(skill)
    ) ||
    resumeSkills[0] ||
    jdSkills[0] ||
    "problem solving"
  );
}

function getPersonaTone(
  persona: InterviewPersona
) {
  switch (persona) {
    case "Strict Technical Lead":
      return "strict, technical, analytical";

    case "Senior Engineering Manager":
      return "senior engineering manager style";

    case "Corporate VP":
      return "corporate executive style";

    default:
      return "friendly HR interviewer";
  }
}

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
  const topic = pickSkill(
    input.resume,
    input.jd
  );

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

          body: JSON.stringify({
            ...input,
            topic,
            tone:
              getPersonaTone(
                input.persona
              ),
          }),
        }
      );

    const data =
      await response.json();

    if (
      data?.success &&
      data?.question
    ) {
      return {
        id:
          crypto.randomUUID(),

        question:
          data.question.question,

        focusArea:
          data.question
            .focusArea ||
          topic,

        round:
          data.question
            .round ||
          input.round,

        expectedSignals:
          data.question
            .expectedSignals ||
          [],
      };
    }
  } catch (err) {
    console.error(err);
  }

  const fallbackQuestions =
    {
      HR: [
        `Tell me about yourself and explain how your background fits this ${input.jd.role} role.`,

        `Why do you think you are a good fit for this company and role?`,

        `Describe a challenge you faced in one of your projects and how you solved it.`,
      ],

      Technical: [
        `Explain how you would use ${topic} in a real production application.`,

        `Walk me through a technical project from your resume involving ${topic}.`,

        `What are the common performance issues related to ${topic}?`,
      ],

      Mixed: [
        `Explain one project from your resume and also discuss the technical decisions behind it.`,

        `How would your technical skills help in solving business problems?`,

        `Tell me about a challenging debugging issue you solved.`,
      ],
    };

  const bank =
    fallbackQuestions[
      input.round
    ];

  return {
    id:
      crypto.randomUUID(),

    question:
      bank[
        input.asked.length %
          bank.length
      ],

    focusArea: topic,

    round: input.round,

    expectedSignals: [
      topic,
      "clarity",
      "technical depth",
      "real examples",
    ],
  };
}

export async function createInterviewReport(
  input: {
    answers: InterviewAnswer[];

    difficulty: Difficulty;

    jd?: JDAnalysis;

    resume?: ParsedResume;
  }
): Promise<InterviewReport> {
  try {
    const response =
      await fetch(
        "/api/interview/report",
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
      data?.success &&
      data?.report
    ) {
      return data.report;
    }
  } catch (err) {
    console.error(err);
  }

  return {
    overallScore: 72,

    technicalScore: 74,

    codingScore: 70,

    communicationScore: 76,

    confidenceEstimate: 71,

    resumeAlignmentScore: 80,

    strengths: [
      "Good communication skills",

      "Relevant project experience",

      "Understands core technical concepts",
    ],

    weaknesses: [
      "Needs deeper technical explanations",

      "Could improve optimization discussion",

      "Should provide more measurable outcomes",
    ],

    resumeAdditions: [
      "Add metrics to projects",

      "Mention deployment technologies",

      "Include scalability details",
    ],

    resumeRemovals: [
      "Remove generic statements",
    ],

    focusAreas: [
      "System design",

      "DSA",

      "Project explanation",
    ],

    roadmap: [
      "Practice mock interviews daily",

      "Solve more coding questions",

      "Improve behavioral storytelling",
    ],

    answerReviews: [],
  };
}
