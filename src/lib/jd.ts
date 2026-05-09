import { extractSkills } from "./resume";
import type { JDAnalysis, ParsedResume } from "./types";

export function analyzeJobDescription(jdText: string, resume?: ParsedResume): JDAnalysis {
  const roleMatch =
    jdText.match(/(?:hiring|role|position|opening)\s*(?:for|:|-)?\s*([A-Za-z0-9 +#./-]*?(?:developer|engineer|analyst|intern|designer|manager))/i) ||
    jdText.match(/([A-Za-z +#./-]{3,40}?(?:developer|engineer|analyst|intern|designer|manager))/i);

  const requiredSkills = extractSkills(jdText);
  const resumeSkills = resume?.skills.map((skill) => skill.toLowerCase()) ?? [];
  const matched = requiredSkills.filter((skill) => resumeSkills.includes(skill.toLowerCase()));
  const missingSkills = requiredSkills.filter((skill) => !resumeSkills.includes(skill.toLowerCase()));
  const matchPercent = requiredSkills.length
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : resumeSkills.length
      ? 65
      : 40;

  return {
    role: roleMatch?.[1]?.trim() || "Software role",
    requiredSkills: requiredSkills.length ? requiredSkills : ["communication", "problem solving", "sql"],
    matchPercent,
    missingSkills,
    summary:
      jdText.slice(0, 260) ||
      "Paste a job description to tune questions, score expectations, and skill matching.",
  };
}
