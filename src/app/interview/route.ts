import { NextResponse } from "next/server";

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const {
      resume,
      jd,
      difficulty,
      round,
      persona,
      topic,
      asked,
      tone,
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
You are conducting a realistic professional mock interview.

Interview Type:
${round}

Interviewer Personality:
${persona}

Tone:
${tone}

Candidate Resume Summary:
${resume?.summary || ""}

Candidate Skills:
${resume?.skills?.join(
  ", "
)}

Candidate Projects:
${resume?.projects?.join(
  ", "
)}

Target Role:
${jd?.role || ""}

Required Skills:
${jd?.requiredSkills?.join(
  ", "
)}

Current Focus Topic:
${topic}

Difficulty:
${difficulty}

Previously Asked Questions:
${asked?.join("\n")}

Rules:

- Ask ONLY ONE question
- Make it realistic
- Match JD and Resume
- Technical questions should feel company-level
- HR questions should feel recruiter-level
- Avoid repeating previous questions
- Keep it concise
- If candidate appears strong ask deeper follow-up
- If interview type is Mixed then alternate HR and Technical naturally

Return ONLY RAW JSON.

Format:

{
  "question": "",
  "focusArea": "",
  "round": "",
  "expectedSignals": []
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
                  "You are an expert AI interviewer.",
              },

              {
                role: "user",

                content: prompt,
              },
            ],

            temperature: 0.8,
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
            "Invalid AI response",
          raw: cleaned,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      question: parsed,
    });
  } catch (err: any) {
    console.error(
      "INTERVIEW ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          err?.message ||
          "Failed generating question",
      },
      { status: 500 }
    );
  }
}
