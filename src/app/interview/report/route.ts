import { NextResponse } from "next/server";

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const {
      answers,
      difficulty,
      jd,
      resume,
    } = body;

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

    const prompt = `
You are an expert interview evaluator.

Analyze the complete mock interview.

Candidate Resume Summary:
${resume?.summary || ""}

Candidate Skills:
${resume?.skills?.join(
  ", "
)}

Target Role:
${jd?.role || ""}

Required Skills:
${jd?.requiredSkills?.join(
  ", "
)}

Interview Difficulty:
${difficulty}

Interview Answers:
${JSON.stringify(
  answers,
  null,
  2
)}

Instructions:

- Evaluate communication
- Evaluate technical depth
- Evaluate confidence
- Evaluate JD alignment
- Evaluate coding ability
- Detect weak answers
- Detect vague answers
- Give recruiter-style review
- Give actionable improvements

Return ONLY RAW JSON.

Format:

{
  "overallScore": 0,
  "technicalScore": 0,
  "codingScore": 0,
  "communicationScore": 0,
  "confidenceEstimate": 0,
  "resumeAlignmentScore": 0,

  "strengths": [],

  "weaknesses": [],

  "resumeAdditions": [],

  "resumeRemovals": [],

  "focusAreas": [],

  "roadmap": [],

  "answerReviews": []
}
`;

    const response =
      await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            model:
              "llama-3.3-70b-versatile",

            messages: [
              {
                role: "system",

                content:
                  "You are an expert mock interview evaluator.",
              },

              {
                role: "user",

                content: prompt,
              },
            ],

            temperature: 0.7,
          }),
        }
      );

    const data =
      await response.json();

    const text =
      data?.choices?.[0]
        ?.message?.content ||
      "";

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed =
        JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid AI report response",
          raw: cleaned,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      report: parsed,
    });
  } catch (err: unknown) {
    console.error(
      "INTERVIEW REPORT ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed generating report",
      },
      { status: 500 }
    );
  }
}
