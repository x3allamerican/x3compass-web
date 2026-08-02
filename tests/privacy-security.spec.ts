import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { privacySafePromptTelemetry, sanitizeClientDiagnostic } from "../functions/_shared/privacy";

function publicCodeFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return publicCodeFiles(path);
    return [".html", ".js", ".json"].includes(extname(entry.name)) ? [path] : [];
  });
}

test("prompt telemetry excludes question, response, and provider error content", () => {
  const safe = privacySafePromptTelemetry({
    user_id: "user-1",
    user_question: "Driver Jane Doe failed a medical exam",
    response_text: "Jane should contact a physician",
    error_detail: "provider echoed Jane Doe",
    question_category: "DQF",
    cited_sections: ["391.41"],
    input_tokens: 42,
  });

  expect(safe).toEqual({
    user_id: "user-1",
    question_category: "DQF",
    cited_sections: ["391.41"],
    input_tokens: 42,
    question_length: 37,
    response_length: 31,
  });
  expect(JSON.stringify(safe)).not.toContain("Jane");
  expect(safe).not.toHaveProperty("error_detail");
});

test("client diagnostics redact common credentials and personal identifiers", () => {
  const diagnostic = "Bearer abc.def.ghi email jane@example.com SSN 123-45-6789 phone (313) 555-0199 ?token=secret-value";
  const safe = sanitizeClientDiagnostic(diagnostic, 500);

  expect(safe).not.toContain("abc.def.ghi");
  expect(safe).not.toContain("jane@example.com");
  expect(safe).not.toContain("123-45-6789");
  expect(safe).not.toContain("313) 555-0199");
  expect(safe).not.toContain("secret-value");
});

test("public assets never embed JWT credentials", () => {
  const exposed = publicCodeFiles(join(process.cwd(), "public")).filter((path) =>
    /eyJhbGciOi[A-Za-z0-9_-]+\./.test(readFileSync(path, "utf8")),
  );

  expect(exposed, "public files containing a JWT credential").toEqual([]);
});

test("tenant dashboard fetches only explicitly required database fields", () => {
  const source = readFileSync(join(process.cwd(), "functions/api/dashboard.ts"), "utf8");

  expect(source).not.toContain("select=*");
});

test("authenticated dashboard never presents demo compliance as tenant data", () => {
  const page = readFileSync(join(process.cwd(), "src/app/app/page.tsx"), "utf8");
  const api = readFileSync(join(process.cwd(), "functions/api/dashboard.ts"), "utf8");

  for (const fabricatedSignal of [
    "@/lib/demoData",
    "As of May 12, 2024",
    "Up 8%",
    "Math.max(15",
    "All Training Records Current",
    "IFTA Filing Up to Date",
    "const CSA_ROWS",
  ]) {
    expect(page).not.toContain(fabricatedSignal);
  }
  expect(api).not.toContain("const hosPct = 90");
});
