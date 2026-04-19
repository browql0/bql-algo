import { createClient } from "@supabase/supabase-js";
import { resolveExerciseMetadata } from "../server/validation/exerciseRegistry.js";

const CHALLENGE_TYPES = new Set(["exercice", "challenge"]);

function getEnv(name) {
  return process.env[name] || "";
}

function parseJson(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  if (!value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractCases(rules, expectedOutput) {
  if (Array.isArray(rules)) return rules;
  if (Array.isArray(rules?.cases)) return rules.cases;
  if (typeof expectedOutput === "string" && expectedOutput.trim()) {
    return [{ input: "", output: expectedOutput }];
  }
  return [];
}

function hasExpectedOutput(testCase) {
  const expected = testCase.output ?? testCase.expected ?? "";
  return typeof expected === "string" && expected.trim() !== "";
}

function formatRow(status, lesson, exerciseId, reason) {
  const title = String(lesson.title || "").replace(/\s+/g, " ").trim();
  const suffix = reason ? ` - ${reason}` : "";
  return `${status} | ${lesson.id} | ${exerciseId || "-"} | ${title}${suffix}`;
}

function logSection(title) {
  console.log("\n" + title);
  console.log("-".repeat(title.length));
}

async function main() {
  const supabaseUrl = getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, title, lesson_type, course_id");

  if (lessonsError) {
    console.error("Failed to load lessons:", lessonsError.message || lessonsError);
    process.exit(1);
  }

  const challengeLessons = (lessons || []).filter((lesson) =>
    CHALLENGE_TYPES.has(String(lesson.lesson_type || "")),
  );

  const secretsByLesson = new Map();

  const okRows = [];
  const warningRows = [];
  const brokenRows = [];

  for (const lesson of challengeLessons) {
    let secret = secretsByLesson.get(lesson.id);
    if (!secret) {
      const { data: secretRows, error: secretError } = await supabase.rpc(
        "get_lesson_secrets",
        { p_lesson_id: lesson.id },
      );

      if (secretError) {
        const message = secretError.message || String(secretError);
        console.error(`RPC get_lesson_secrets failed for ${lesson.id}:`, message);
        console.error("Ensure database/validation_secrets_rpc.sql has been executed.");
        process.exit(2);
      }

      secret = Array.isArray(secretRows) ? secretRows[0] : secretRows;
      if (secret) secretsByLesson.set(lesson.id, secret);
    }

    if (!secret) {
      brokenRows.push(formatRow("BROKEN", lesson, null, "hidden tests missing"));
      continue;
    }

    const expectedOutput = secret.expected_output ?? "";
    const parsedRules = parseJson(secret.test_cases) ?? secret.test_cases;
    const cases = extractCases(parsedRules, expectedOutput);

    if (!parsedRules && !expectedOutput) {
      brokenRows.push(formatRow("BROKEN", lesson, null, "test_cases invalid JSON"));
      continue;
    }

    if (cases.length === 0) {
      brokenRows.push(formatRow("BROKEN", lesson, null, "no hidden test cases"));
      continue;
    }

    const missingOutputIndex = cases.findIndex((testCase) => !hasExpectedOutput(testCase));
    if (missingOutputIndex >= 0) {
      brokenRows.push(
        formatRow("BROKEN", lesson, null, `test ${missingOutputIndex + 1} missing output`),
      );
      continue;
    }

    let exercise;
    try {
      exercise = resolveExerciseMetadata({
        lesson,
        secrets: {
          test_cases: parsedRules,
          expected_output: expectedOutput,
        },
      });
    } catch (error) {
      brokenRows.push(formatRow("BROKEN", lesson, null, error?.message || "metadata error"));
      continue;
    }

    const exerciseId = exercise?.id || null;
    const strictTests = Array.isArray(exercise?.strictTests) ?exercise.strictTests : [];

    if (strictTests.length === 0) {
      brokenRows.push(formatRow("BROKEN", lesson, exerciseId, "no strict tests"));
      continue;
    }

    const hasMetadata = Boolean(parsedRules?.exerciseId || parsedRules?.exercise_id || parsedRules?.projectId);
    if (!hasMetadata) {
      warningRows.push(formatRow("WARNING", lesson, exerciseId, "missing exerciseId/projectId"));
    } else {
      okRows.push(formatRow("OK", lesson, exerciseId, ""));
    }
  }

  logSection("OK");
  okRows.forEach((row) => console.log(row));

  logSection("WARNING");
  warningRows.forEach((row) => console.log(row));

  logSection("BROKEN");
  brokenRows.forEach((row) => console.log(row));

  console.log("\nSummary");
  console.log("OK:", okRows.length);
  console.log("WARNING:", warningRows.length);
  console.log("BROKEN:", brokenRows.length);

  if (brokenRows.length > 0) process.exit(3);
}

main().catch((error) => {
  console.error("Audit failed:", error?.message || error);
  process.exit(1);
});
