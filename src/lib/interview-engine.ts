export async function createInterviewReport(
  input: {
    answers: InterviewAnswer[];

    difficulty: Difficulty;

    jd?: JDAnalysis;

    resume?: ParsedResume;
  }
): Promise<InterviewReport> {
  const reviews =
    input.answers.map(
      (a) => {
        const answer =
          a.answer
            ?.toLowerCase()
            .trim() || "";

        let score = 0;

        let verdict:
          | "Strong"
          | "Partial"
          | "Weak"
          | "Missing" =
          "Weak";

        let feedback =
          "";

        const wordCount =
          answer.split(
            /\s+/
          ).length;

        const hasProjectExample =
          answer.includes(
            "project"
          ) ||
          answer.includes(
            "built"
          ) ||
          answer.includes(
            "implemented"
          );

        const hasTechnicalTerms =
          /(api|database|algorithm|system|react|next|node|sql|optimization|backend|frontend|architecture)/i.test(
            answer
          );

        if (
          !answer ||
          wordCount < 3
        ) {
          score = 5;

          verdict =
            "Missing";

          feedback =
            "No meaningful answer provided.";
        } else if (
          answer.includes(
            "i don't know"
          )
        ) {
          score = 20;

          verdict =
            "Weak";

          feedback =
            "Candidate admitted lack of knowledge. Try attempting the problem with logical thinking.";
        } else if (
          wordCount < 12
        ) {
          score = 35;

          verdict =
            "Weak";

          feedback =
            "Answer is too short and lacks explanation.";
        } else if (
          wordCount < 35
        ) {
          score = 55;

          verdict =
            "Partial";

          feedback =
            "Decent attempt but lacks depth and technical clarity.";
        } else {
          score = 70;

          verdict =
            "Partial";

          feedback =
            "Reasonably structured answer.";
        }

        if (
          hasTechnicalTerms
        ) {
          score += 10;
        }

        if (
          hasProjectExample
        ) {
          score += 10;
        }

        score = Math.min(
          95,
          score
        );

        if (
          score >= 80
        ) {
          verdict =
            "Strong";

          feedback =
            "Strong answer with good technical depth and structured explanation.";
        }

        return {
          question:
            a.question,

          answer:
            a.answer,

          score,

          verdict,

          feedback,

          missingSignals:
            [],
        };
      }
    );

  const overall =
    reviews.length > 0
      ? Math.round(
          reviews.reduce(
            (
              acc,
              curr
            ) =>
              acc +
              curr.score,
            0
          ) /
            reviews.length
        )
      : 0;

  const weakAnswers =
    reviews.filter(
      (r) =>
        r.score < 50
    ).length;

  const strongAnswers =
    reviews.filter(
      (r) =>
        r.score >= 80
    ).length;

  return {
    overallScore:
      overall,

    technicalScore:
      Math.max(
        20,
        overall - 3
      ),

    codingScore:
      Math.max(
        15,
        overall - 5
      ),

    resumeAlignmentScore:
      input.jd
        ?.matchPercent ||
      50,

    communicationScore:
      Math.max(
        25,
        overall - 8
      ),

    confidenceEstimate:
      Math.max(
        20,
        overall - 10
      ),

    answerReviews:
      reviews,

    strengths:
      strongAnswers >= 3
        ? [
            "Good communication clarity",

            "Strong technical articulation",

            "Provided practical examples",

            "Reasonable confidence in answers",
          ]
        : [
            "Attempted most interview questions",
          ],

    weaknesses:
      weakAnswers >= 3
        ? [
            "Weak technical depth",

            "Answers lacked detailed explanations",

            "Insufficient confidence in responses",

            "Needs stronger project understanding",
          ]
        : [
            "Can improve answer precision",

            "Need stronger real-world examples",
          ],

    resumeAdditions: [
      "Add measurable project outcomes",

      "Mention scalability/performance improvements",

      "Highlight deployment experience",

      "Add quantified technical achievements",
    ],

    resumeRemovals: [
      "Reduce repetitive wording",

      "Remove generic skill descriptions",
    ],

    focusAreas: [
      "Problem Solving",

      "Technical Communication",

      "Project Explanation",

      "Behavioral Confidence",
    ],

    roadmap:
      overall < 45
        ? [
            "Revise programming fundamentals",

            "Practice technical interview questions daily",

            "Strengthen DSA concepts",

            "Prepare project explanations deeply",

            "Improve communication confidence",

            "Practice mock interviews regularly",
          ]
        : overall < 70
        ? [
            "Improve technical depth",

            "Practice structured STAR responses",

            "Revise system design basics",

            "Solve medium-level coding problems daily",

            "Improve concise communication",
          ]
        : [
            "Practice advanced interview rounds",

            "Focus on leadership communication",

            "Strengthen system design skills",

            "Prepare for senior-level technical discussions",
          ],
  };
}
