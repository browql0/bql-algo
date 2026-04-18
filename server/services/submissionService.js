import { validateSubmission } from "./submissionValidator.js";

function log(event, payload = {}) {
  console.log(`[submissionService] ${event}`, payload);
}

function sanitizeValidationResult(result) {
  return {
    success: Boolean(result.success),
    passed: Number(result.passed || 0),
    total: Number(result.total || 0),
    message: result.message || "Validation terminee.",
    errorCode: result.errorCode || null,
    details: result.details || null,
    validationMode: result.validationMode || null,
    exerciseId: result.exerciseId || null,
    cases: Array.isArray(result.cases) ? result.cases : [],
    constraints: result.constraints || null,
    diagnostics: Array.isArray(result.diagnostics) ? result.diagnostics : [],
    feedbackReport: result.feedbackReport || null,
    httpStatus: result.httpStatus || (result.success ? 200 : 400),
  };
}

function hasValidationRules(secrets) {
  if (!secrets) return false;

  const hasExpectedOutput =
    typeof secrets.expected_output === "string" &&
    secrets.expected_output.trim() !== "";
  const testCases = secrets.test_cases;

  if (Array.isArray(testCases)) return testCases.length > 0 || hasExpectedOutput;
  if (testCases && typeof testCases === "object") {
    return Array.isArray(testCases.cases)
      ? testCases.cases.length > 0 || hasExpectedOutput
      : Object.keys(testCases).length > 0 || hasExpectedOutput;
  }
  if (typeof testCases === "string") return testCases.trim() !== "" || hasExpectedOutput;

  return hasExpectedOutput;
}

async function loadLessonSecrets(supabaseAdmin, lessonId) {
  log("loading private lesson secrets", { lessonId });

  const privateResult = await supabaseAdmin
    .schema("private")
    .from("lesson_secrets")
    .select("expected_output, test_cases")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (hasValidationRules(privateResult.data)) {
    log("private lesson secrets loaded", {
      lessonId,
      hasExpectedOutput: Boolean(privateResult.data?.expected_output),
      hasTestCases: Boolean(privateResult.data?.test_cases),
    });
    return {
      secrets: privateResult.data,
      source: "private.lesson_secrets",
      warning: privateResult.error?.message || null,
    };
  }

  log("private lesson secrets missing", {
    lessonId,
    error: privateResult.error?.message || null,
  });

  log("no validation tests found", {
    lessonId,
    privateError: privateResult.error?.message || null,
  });

  return {
    secrets: null,
    source: null,
    warning:
      privateResult.error?.message ||
      "No hidden tests were found in private.lesson_secrets.",
  };
}

export async function submitLessonSolution({
  supabaseAdmin,
  user,
  lessonId,
  code,
}) {
  log("submission received", {
    lessonId,
    userId: user?.id || null,
    hasCode: typeof code === "string" && code.trim() !== "",
  });

  if (!lessonId || typeof lessonId !== "string") {
    return {
      success: false,
      passed: 0,
      total: 0,
      message: "lessonId est requis pour valider ce defi.",
      errorCode: "LESSON_ID_REQUIRED",
      httpStatus: 400,
    };
  }

  if (typeof code !== "string" || code.trim() === "") {
    return {
      success: false,
      passed: 0,
      total: 0,
      message: "Le code BQL est vide.",
      errorCode: "CODE_REQUIRED",
      httpStatus: 400,
    };
  }

  const { data: lesson, error: lessonError } = await supabaseAdmin
    .from("lessons")
    .select("id, lesson_type, title")
    .eq("id", lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    log("lesson lookup failed", {
      lessonId,
      error: lessonError?.message || null,
    });
    return {
      success: false,
      passed: 0,
      total: 0,
      message: "Defi introuvable cote serveur.",
      errorCode: "LESSON_NOT_FOUND",
      details: lessonError?.message || null,
      httpStatus: 404,
    };
  }

  log("lesson loaded", {
    lessonId,
    title: lesson.title || null,
    lessonType: lesson.lesson_type || null,
  });

  const loadedSecrets = await loadLessonSecrets(supabaseAdmin, lessonId);
  if (!loadedSecrets.secrets) {
    return {
      success: false,
      passed: 0,
      total: 0,
      message: "Aucun test serveur configure pour ce defi.",
      errorCode: "TESTS_MISSING",
      details: loadedSecrets.warning,
      httpStatus: 500,
    };
  }

  const validation = sanitizeValidationResult(
    await validateSubmission({
      code,
      expectedOutput: loadedSecrets.secrets.expected_output,
      testCases: loadedSecrets.secrets.test_cases,
      lesson,
    }),
  );

  log("validation result", {
    lessonId,
    source: loadedSecrets.source,
    success: validation.success,
    passed: validation.passed,
    total: validation.total,
    errorCode: validation.errorCode,
  });

  if (loadedSecrets.warning && !validation.details) {
    validation.details = loadedSecrets.warning;
  }

  const attemptPayload = {
    user_id: user.id,
    lesson_id: lessonId,
    success: validation.success,
    code_submitted: code,
    error_message: validation.success ? null : validation.message,
  };

  const { error: attemptError } = await supabaseAdmin
    .from("exercise_attempts")
    .insert(attemptPayload);

  if (attemptError) {
    console.warn("Could not record exercise attempt:", attemptError.message);
  }

  if (validation.success) {
    const { error: progressError } = await supabaseAdmin
      .from("user_progress")
      .upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          completed: true,
        },
        { onConflict: "user_id,lesson_id" },
      );

    if (progressError) {
      console.warn("Could not update user progress:", progressError.message);
    }
  }

  return validation;
}
