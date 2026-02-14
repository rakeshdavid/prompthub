#!/usr/bin/env node

/**
 * Intent and Generative UI test runner.
 * For each test case: create a conversation via Convex mutation, POST to /api/chat,
 * parse SSE stream for first tool_call, record result. No UI.
 * Loads VITE_CONVEX_URL or CONVEX_URL from .env.local / .env when present.
 */

import { ConvexHttpClient } from "convex/browser";
import { existsSync, readFileSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const root = process.cwd();
for (const name of [".env.local", ".env"]) {
  const path = join(root, name);
  if (!existsSync(path)) continue;
  const content = readFileSync(path, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
const REQUEST_TIMEOUT_MS = 60_000;

if (!CONVEX_URL) {
  console.error(
    "Error: VITE_CONVEX_URL or CONVEX_URL not set. Set in .env.local or the environment.",
  );
  process.exit(1);
}

const SITE_URL = CONVEX_URL.replace(".cloud", ".site");
const client = new ConvexHttpClient(CONVEX_URL);

type TestCase = {
  promptSlug: string;
  testType: string;
  intentCategory: string;
  userMessage: string;
  expectedFirstTool: string;
};

type ResultRow = TestCase & {
  actualFirstTool: string;
  pass: boolean;
  error?: string;
};

async function runOneCase(
  testCase: TestCase,
  index: number,
  total: number,
): Promise<ResultRow> {
  const { promptSlug, userMessage, expectedFirstTool } = testCase;
  const result: ResultRow = {
    ...testCase,
    actualFirstTool: "",
    pass: false,
  };

  try {
    // Validate slug exists before running test
    const promptExists = await client.query("prompts:getPromptBySlugForTest", {
      slug: promptSlug,
    });

    if (!promptExists) {
      return {
        ...testCase,
        actualFirstTool: "",
        pass: false,
        error: `Prompt not found for slug: ${promptSlug}`,
      };
    }

    const conversationId = await client.mutation(
      "chat:createTestConversationForIntentTest",
      { promptSlug, userMessage },
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(`${SITE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok || !response.body) {
      result.error = `HTTP ${response.status}`;
      return result;
    }

    let actualFirstTool = "text_only";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") break outer;
        try {
          const parsed = JSON.parse(data);
          if (parsed.tool_call?.name) {
            actualFirstTool = parsed.tool_call.name;
            break outer;
          }
        } catch {
          // skip malformed JSON
        }
      }
    }

    result.actualFirstTool = actualFirstTool;
    result.pass =
      expectedFirstTool === "any" || expectedFirstTool === actualFirstTool;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }

  const status = result.error ? "error" : result.pass ? "pass" : "fail";
  console.log(
    `[${index + 1}/${total}] ${promptSlug} | ${testCase.intentCategory} | ${status} | first tool: ${result.actualFirstTool || result.error}`,
  );
  return result;
}

async function main() {
  const casesPath = join(process.cwd(), "tests", "intent-test-cases.json");
  const resultsPath = join(process.cwd(), "tests", "intent-test-results.json");

  const cases: TestCase[] = JSON.parse(await readFile(casesPath, "utf-8"));
  console.log(`Loaded ${cases.length} test cases from ${casesPath}`);
  console.log(`Convex: ${CONVEX_URL}, Site: ${SITE_URL}\n`);

  const results: ResultRow[] = [];
  for (let i = 0; i < cases.length; i++) {
    const row = await runOneCase(cases[i], i, cases.length);
    results.push(row);
  }

  await writeFile(resultsPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`\nWrote results to ${resultsPath}`);

  const withExpected = results.filter((r) => r.expectedFirstTool !== "any");
  const passed = results.filter((r) => r.pass);
  const errors = results.filter((r) => r.error);

  const byTool: Record<string, number> = {};
  for (const r of results) {
    const t = r.actualFirstTool || "error";
    byTool[t] = (byTool[t] ?? 0) + 1;
  }

  console.log("\n--- Summary ---");
  console.log(`Total: ${results.length}`);
  console.log(`By first tool: ${JSON.stringify(byTool)}`);
  if (withExpected.length > 0) {
    const passedWithExpected = withExpected.filter((r) => r.pass).length;
    console.log(
      `Pass rate (cases with expected tool): ${passedWithExpected}/${withExpected.length}`,
    );
  }
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
