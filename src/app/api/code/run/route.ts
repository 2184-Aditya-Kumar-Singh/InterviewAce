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
      return { language: "python", version: "local", compile: null, run: await runProcess("python", [sourcePath], dir, stdin) };
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

  const config = languageConfig[parsed.data.language];
  const endpoint = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston/execute";
  const pistonApiKey = process.env.PISTON_API_KEY;
  const useLocal =
    process.env.CODE_EXECUTION_MODE === "local" ||
    (process.env.NODE_ENV !== "production" && !process.env.PISTON_API_URL);

  if (useLocal) {
    try {
      const result = await runLocally(parsed.data.language, parsed.data.code, parsed.data.stdin);
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Local code execution failed." },
        { status: 500 },
      );
    }
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(pistonApiKey ? { Authorization: `Bearer ${pistonApiKey}` } : {}),
      },
      body: JSON.stringify({
        language: config.language,
        version: config.version,
        files: [{ name: config.fileName, content: parsed.data.code }],
        stdin: parsed.data.stdin,
        compile_timeout: 10_000,
        run_timeout: 3_000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Piston execution failed." }, { status: response.status });
    }

    return NextResponse.json({
      language: data.language,
      version: data.version,
      compile: data.compile || null,
      run: data.run,
    });
  } catch {
    try {
      const result = await runLocally(parsed.data.language, parsed.data.code, parsed.data.stdin);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json(
        { error: "Could not reach Piston and local execution is unavailable on this server." },
        { status: 503 },
      );
    }
  }
}
