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
  const limited = rateLimit(`code:${request.headers.get("x-forwarded-for") || "local"}`, 12, 60_000);
  if (limited) return limited;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code execution request." }, { status: 400 });
  }
    try {
    const languageMap: Record<
      string,
      { language: string; version: string; filename: string }
    > = {
      Java: { language: "java", version: "15.0.2", filename: "Main.java" },
      Python: { language: "python", version: "3.10.0", filename: "main.py" },
      "C++": { language: "c++", version: "10.2.0", filename: "main.cpp" },
      JavaScript: {
        language: "javascript",
        version: "18.15.0",
        filename: "main.js",
      },
      C: { language: "c", version: "10.2.0", filename: "main.c" },
    };

    const pistonUrl =
      process.env.PISTON_API_URL ||
      "https://emkc.org/api/v2/piston/execute";

    console.log("PISTON REQUEST URL:", pistonUrl);
    console.log("PISTON REQUEST LANGUAGE:", parsed.data.language);

    const response = await fetch(pistonUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.PISTON_API_KEY
          ? { Authorization: process.env.PISTON_API_KEY as string }
          : {}),
      },
      body: JSON.stringify({
        language: languageMap[parsed.data.language].language,
        version: languageMap[parsed.data.language].version,
        files: [
          {
            name: languageMap[parsed.data.language].filename,
            content: parsed.data.code,
          },
        ],
        stdin: parsed.data.stdin,
      }),
    });

    console.log("PISTON HTTP STATUS:", response.status);

    const result = await response.json();
    console.log("PISTON RAW RESULT:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      throw new Error(
        `Piston returned ${response.status}: ${JSON.stringify(result)}`
      );
    }

    const compileFailed = result.compile && result.compile.code !== 0;

    return NextResponse.json({
      language: parsed.data.language,
      version: "Piston",
      compile: compileFailed
        ? {
            stdout: "",
            stderr: result.compile.stderr || "",
            output: result.compile.output || result.compile.stderr || "",
            code: 1,
          }
        : null,
      run: {
        stdout: result.run?.stdout || "",
        stderr: result.run?.stderr || "",
        output:
          result.run?.output ||
          result.run?.stdout ||
          result.run?.stderr ||
          "Program finished with no output.",
        code: result.run?.code ?? 0,
      },
    });
  } catch (err) {
    return NextResponse.json({
      language: parsed.data.language,
      version: "Piston",
      compile: null,
      run: {
        stdout: "",
        stderr: "",
        output: `DEBUG ERROR: ${err instanceof Error ? err.message : JSON.stringify(err)}`,
        code: 1,
      },
    });
  }
}
