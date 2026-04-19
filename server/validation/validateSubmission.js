import { resolveExerciseMetadata } from "./exerciseRegistry.js";
import { strictValidate } from "./strictValidator.js";
import { diagnoseSubmission } from "./diagnosticEngine.js";

function publicConstraints(constraints) {
  if (!constraints) return null;
  return {
    passed: constraints.passed,
    required: constraints.required.map((check) => ({
      id: check.id,
      label: check.label,
      passed: check.passed,
      actual: check.actual,
      expected: check.expected,
      message: check.passed ?null : check.message,
      hint: check.passed ?null : check.hint,
    })),
    forbidden: constraints.forbidden.map((check) => ({
      id: check.id,
      label: check.label,
      passed: check.passed,
      message: check.passed ?null : check.message,
      hint: check.passed ?null : check.hint,
    })),
  };
}

function messageFromResult(strictResult, diagnosis) {
  if (strictResult.success) {
    return "Challenge valide.";
  }

  const primary = diagnosis.diagnostics[0];
  return primary?.message || strictResult.message || "Validation échouée.";
}

export async function validateSubmission({
  code,
  testCases,
  expectedOutput,
  lesson,
}) {
  const exercise = resolveExerciseMetadata({
    lesson,
    secrets: {
      test_cases: testCases,
      expected_output: expectedOutput,
    },
  });

  const strictResult = await strictValidate({ code, exercise });
  const diagnosis = await diagnoseSubmission({ code, exercise, strictResult });

  return {
    success: strictResult.success,
    passed: strictResult.passed,
    total: strictResult.total,
    message: messageFromResult(strictResult, diagnosis),
    errorCode: strictResult.success ?null : strictResult.errorCode,
    validationMode: exercise.validationMode,
    exerciseId: exercise.id,
    cases: strictResult.publicCases,
    constraints: publicConstraints(strictResult.constraints),
    diagnostics: diagnosis.diagnostics,
    feedbackReport: diagnosis.feedbackReport,
    httpStatus:
      strictResult.errorCode === "TESTS_MISSING"
        ?500
        : strictResult.success
          ?200
          : 400,
  };
}
