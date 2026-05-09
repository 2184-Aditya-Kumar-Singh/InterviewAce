import type { ParsedResume } from "./types";

const skillDictionary = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node.js",
  "python",
  "java",
  "c++",
  "c",
  "sql",
  "postgresql",
  "mongodb",
  "aws",
  "docker",
  "kubernetes",
  "fastapi",
  "django",
  "machine learning",
  "data analysis",
  "excel",
  "communication",
  "leadership",
  "tailwind",
  "supabase",
  "data structures",
  "algorithms",
  "operating systems",
  "dbms",
  "computer networks",
  "oop",
  "object oriented programming",
  "software engineering",
  "computer architecture",
];

export function extractSkills(text: string) {
  const lower = text.toLowerCase();
  return skillDictionary
    .filter((skill) => {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = `(^|[^a-z0-9+#])${escaped}([^a-z0-9+#]|$)`;
      return new RegExp(pattern, "i").test(lower);
    })
    .slice(0, 14);
}

export function parseResumeText(text: string): ParsedResume {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const education = lines
    .filter((line) => /b\.?tech|bachelor|master|mca|bca|university|college|cgpa|gpa/i.test(line))
    .slice(0, 5);

  const projects = lines
    .filter((line) => /project|built|created|developed|implemented|deployed/i.test(line))
    .slice(0, 6);

  const skills = extractSkills(text);
  const summary = lines.slice(0, 4).join(" ").slice(0, 420);

  return {
    rawText: text,
    skills: skills.length ? skills : ["communication", "problem solving"],
    education,
    projects,
    summary: summary || "Resume parsed. Add more detail for stronger interview questions.",
  };
}
