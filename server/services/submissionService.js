import { validateSubmission } from "./submissionValidator.js";

const LOG_LEVEL = process.env.SUBMISSION_LOG_LEVEL || "warn";
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function log(level, event, payload = {}) {
  const threshold = LOG_LEVELS[LOG_LEVEL] ?? LOG_LEVELS.warn;
  const severity = LOG_LEVELS[level] ?? LOG_LEVELS.warn;
  if (severity > threshold) return;

  const logger = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  logger(`[submissionService] ${event}`, payload);
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
    cases: Array.isArray(result.cases) ?result.cases : [],
    constraints: result.constraints || null,
    diagnostics: Array.isArray(result.diagnostics) ?result.diagnostics : [],
    feedbackReport: result.feedbackReport || null,
    xpAwarded: Number(result.xpAwarded || 0),
    progress: result.progress || null,
    httpStatus: result.httpStatus || (result.success ?200 : 400),
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
      ?testCases.cases.length > 0 || hasExpectedOutput
      : Object.keys(testCases).length > 0 || hasExpectedOutput;
  }
  if (typeof testCases === "string") return testCases.trim() !== "" || hasExpectedOutput;

  return hasExpectedOutput;
}

function describeSecretsWarning(error) {
  const message = error?.message || "";
  if (message.toLowerCase().includes("invalid schema") && message.includes("private")) {
    return "Schema 'private' non expose via Supabase API. Utilisez la RPC get_lesson_secrets pour eviter d'exposer ce schema.";
  }
  if (message.toLowerCase().includes("get_lesson_secrets") && message.toLowerCase().includes("does not exist")) {
    return "RPC get_lesson_secrets manquante. Executez database/validation_secrets_rpc.sql dans Supabase.";
  }
  return message || null;
}

async function loadLessonSecrets(supabaseAdmin, lessonId) {
  const rpcResult = await supabaseAdmin.rpc("get_lesson_secrets", {
    p_lesson_id: lessonId,
  });

  const rpcData = Array.isArray(rpcResult.data)
    ?rpcResult.data[0]
    : rpcResult.data;

  if (hasValidationRules(rpcData)) {
    return {
      secrets: rpcData,
      source: "rpc:get_lesson_secrets",
      warning: rpcResult.error?.message || null,
    };
  }

  log("warn", "private lesson secrets missing", {
    lessonId,
    error: rpcResult.error?.message || null,
  });

  return {
    secrets: null,
    source: null,
    warning:
      describeSecretsWarning(rpcResult.error) ||
      "No hidden tests were found in private.lesson_secrets.",
  };
}

export async function submitLessonSolution({
  supabaseAdmin,
  user,
  lessonId,
  code,
}) {
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
    log("warn", "lesson lookup failed", {
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

  log("info", "validation result", {
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
    error_message: validation.success ?null : validation.message,
    passed: validation.passed,
    total: validation.total,
    validation_mode: validation.validationMode,
    error_code: validation.errorCode,
  };

  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from("exercise_attempts")
    .insert(attemptPayload)
    .select("id")
    .single();

  if (attemptError) {
    log("warn", "exercise attempt record failed", { message: attemptError.message });
  }

  if (attempt?.id) {
    const { data: progressResult, error: progressError } = await supabaseAdmin.rpc(
      "record_challenge_result",
      {
        p_user_id: user.id,
        p_lesson_id: lessonId,
        p_attempt_id: attempt.id,
        p_success: validation.success,
        p_passed: validation.passed,
        p_total: validation.total,
        p_validation_mode: validation.validationMode,
        p_error_code: validation.errorCode,
      },
    );

    if (progressError) {
      log("warn", "challenge result record failed", { message: progressError.message });
    } else if (progressResult) {
      validation.xpAwarded = Number(progressResult.xpAwarded || 0);
      validation.progress = progressResult;
    }
  }

  return validation;
}
