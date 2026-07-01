import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  language: z.enum(["Java", "Python", "C++", "C", "JavaScript"]),
  code: z.string().min(1).max(50_000),
  stdin: z.string().max(10_000).optional().default(""),
});

const languageConfig = {
  Java: { language: "java", version: "*", fileName: "Main.java" },
  Python: { language: "python", version: "*", fileName: "main.py" },
  "C++": { language: "cpp", version: "*", fileName: "main.cpp" },
  C: { language: "c", version: "*", fileName: "main.c" },
  JavaScript: { language: "javascript", version: "*", fileName: "main.js" },
} as const;

type RunResult = {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null | "timeout";
};

function runProcess(command: string, args: string[], cwd: string, stdin = "", timeoutMs = 5000): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, windowsHide: true });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timeout = setTimeout(() => {
      settled = true;
      child.kill();
      resolve({
        stdout,
        stderr,
        output: `${stdout}${stderr ? `${stdout ? "\n" : ""}${stderr}` : ""}` || "Execution timed out.",
        code: "timeout",
      });
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({ stdout, stderr: error.message, output: error.message, code: 1 });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const output = `${stdout}${stderr ? `${stdout ? "\n" : ""}${stderr}` : ""}`.trim();
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), output: output || "Program finished with no output.", code });
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
}

async function runLocally(language: keyof typeof languageConfig, code: string, stdin: string) {
  const config = languageConfig[language];
  const dir = await mkdtemp(path.join(tmpdir(), `interviewace-${randomUUID()}-`));
  try {
    const sourcePath = path.join(dir, config.fileName);
    await writeFile(sourcePath, code, "utf8");

    if (language === "Python") {
      const result = await runProcess("python3", [sourcePath], dir, stdin);
      if (result.code === "timeout" || (typeof result.code === "number" && result.code !== 0 && result.stderr.includes("ENOENT"))) {
        return { language: "python", version: "local", compile: null, run: await runProcess("python", [sourcePath], dir, stdin) };
      }
      return { language: "python", version: "local", compile: null, run: result };
    }
    if (language === "JavaScript") {
      return { language: "javascript", version: "local", compile: null, run: await runProcess("node", [sourcePath], dir, stdin) };
    }
    if (language === "Java") {
      const compileResult = await runProcess("javac", [sourcePath], dir, "", 10_000);
      const compile = compileResult.code === 0 ? { ...compileResult, output: "" } : compileResult;
      if (compile.code !== 0) return { language: "java", version: "local", compile, run: { output: "", stdout: "", stderr: "", code: null } };
      return { language: "java", version: "local", compile, run: await runProcess("java", ["-cp", dir, "Main"], dir, stdin) };
    }
    if (language === "C++") {
      const exe = path.join(dir, process.platform === "win32" ? "main.exe" : "main");
      const compileResult = await runProcess("g++", [sourcePath, "-std=c++17", "-O2", "-o", exe], dir, "", 10_000);
      const compile = compileResult.code === 0 ? { ...compileResult, output: "" } : compileResult;
      if (compile.code !== 0) return { language: "cpp", version: "local", compile, run: { output: "", stdout: "", stderr: "", code: null } };
      return { language: "cpp", version: "local", compile, run: await runProcess(exe, [], dir, stdin) };
    }

    const exe = path.join(dir, process.platform === "win32" ? "main.exe" : "main");
    const compileResult = await runProcess("gcc", [sourcePath, "-std=c11", "-O2", "-o", exe], dir, "", 10_000);
    const compile = compileResult.code === 0 ? { ...compileResult, output: "" } : compileResult;
    if (compile.code !== 0) return { language: "c", version: "local", compile, run: { output: "", stdout: "", stderr: "", code: null } };
    return { language: "c", version: "local", compile, run: await runProcess(exe, [], dir, stdin) };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function POST(request: NextRequest) {
  const limited = rateLimit(
    `code:${request.headers.get("x-forwarded-for") || "local"}`,
    12,
    60_000
  );
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid code execution request." },
      { status: 400 }
    );
  }

  // CodeX-API language codes
  // Swap this map to change provider without touching anything else
  const languageMap: Record<string, string> = {
    Python: "py",
    JavaScript: "js",
    Java: "java",
    "C++": "cpp",
    C: "c",
  };

  const codexLanguage = languageMap[parsed.data.language];

  if (!codexLanguage) {
    return NextResponse.json({
      language: parsed.data.language,
      version: "CodeX",
      compile: null,
      run: {
        stdout: "",
        stderr: "",
        output: `Language "${parsed.data.language}" is not supported.`,
        code: 1,
      },
    });
  }

  try {
    const codexUrl =
      process.env.CODEX_API_URL || "https://api.codex.jaagrav.in";

    const response = await fetch(codexUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: parsed.data.code,
        language: codexLanguage,
        input: parsed.data.stdin || "",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `CodeX API returned ${response.status}: ${text}`
      );
    }

    const result = await response.json();

    // CodeX returns { success, output, error, timeStamp }
    const hasError =
      !result.success ||
      (typeof result.error === "string" && result.error.trim().length > 0);

    const output = result.output || "";
    const errorText = result.error || "";

    return NextResponse.json({
      language: parsed.data.language,
      version: "CodeX",
      compile: null,
      run: {
        stdout: output,
        stderr: errorText,
        output: output || errorText || "Program finished with no output.",
        code: hasError ? 1 : 0,
      },
    });
  } catch (err) {
    return NextResponse.json({
      language: parsed.data.language,
      version: "CodeX",
      compile: null,
      run: {
        stdout: "",
        stderr: "",
        output: `Execution error: ${
          err instanceof Error ? err.message : JSON.stringify(err)
        }`,
        code: 1,
      },
    });
  }
}