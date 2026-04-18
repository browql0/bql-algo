import { executeCode } from "../../src/lib/executeCode.js";
import { checkConcepts } from "./conceptChecks.js";
import { checkOutput } from "./outputChecks.js";

function firstEngineError(result) {
  const error = result?.errors?.[0];
  if (!error) return null;
  return {
    type: error.type || "runtime",
    message: error.message || String(error),
    line: error.line || 0,
    column: error.column || 0,
    hint: error.hint || null,
  };
}

function inputsFromTestCase(testCase) {
  const rawInput = String(testCase.input ?? "");
  return rawInput.length === 0
    ? []
    : rawInput.split("\n").map((value) => value.trim());
}

function sanitizeCase(testCase) {
  return {
    id: testCase.id || null,
    passed: Boolean(testCase.passed),
    errorCode: testCase.errorCode || null,
    reason: testCase.reason || null,
  };
}

export async function strictValidate({ code, exercise }) {
  const source = String(code || "");
  const strictTests = Array.isArray(exercise.strictTests) ? exercise.strictTests : [];

  if (strictTests.length === 0) {
    return {
      success: false,
      passed: 0,
      total: 0,
      errorCode: "TESTS_MISSING",
      message: "Aucun test serveur configure pour cet exercice.",
      cases: [],
      publicCases: [],
      constraints: null,
      firstExecution: null,
      engineError: null,
    };
  }

  const cases = [];
  let passed = 0;
  let firstExecution = null;
  let engineError = null;
  let firstFailure = null;
  let firstErrorCode = null;

  for (let index = 0; index < strictTests.length; index += 1) {
    const testCase = strictTests[index];
    const result = await executeCode(source, {
      inputs: inputsFromTestCase(testCase),
      output: () => {},
      terminalSpeed: "instant",
      maxSteps: exercise.maxSteps || 100_000,
    });

    if (!firstExecution) firstExecution = result;

    if (!result.success || result.errors.length > 0) {
      const error = firstEngineError(result);
      engineError ||= error;
      firstErrorCode ||= "BQL_EXECUTION_FAILED";
      firstFailure ||= error?.message || "Le code BQL ne s'execute pas correctement.";
      cases.push({
        id: testCase.id || `case-${index + 1}`,
        input: testCase.input ?? "",
        expected: testCase.output ?? testCase.expected ?? "",
        actual: "",
        passed: false,
        errorCode: "BQL_EXECUTION_FAILED",
        reason: firstFailure,
      });
      continue;
    }

    const outputCheck = checkOutput({
      outputLines: result.output || [],
      expected: testCase.output ?? testCase.expected,
      expectedOutput: exercise.expectedOutput,
    });

    const caseResult = {
      id: testCase.id || `case-${index + 1}`,
      input: testCase.input ?? "",
      expected: outputCheck.expected,
      actual: outputCheck.actual,
      passed: outputCheck.passed,
      errorCode: outputCheck.errorCode,
      reason: outputCheck.reason,
    };

    if (outputCheck.passed) {
      passed += 1;
    } else {
      firstErrorCode ||= outputCheck.errorCode || "OUTPUT_MISMATCH";
      firstFailure ||= outputCheck.reason || "La sortie ne correspond pas aux tests.";
    }

    cases.push(caseResult);
  }

  const constraints =
    firstExecution?.ast && firstExecution.errors.length === 0
      ? checkConcepts({
          source,
          ast: firstExecution.ast,
          requiredConcepts: exercise.requiredConcepts,
          forbiddenPatterns: exercise.forbiddenPatterns,
        })
      : null;

  if (constraints && !constraints.passed) {
    firstErrorCode ||= "CONSTRAINT_FAILED";
    firstFailure ||= constraints.failed[0]?.message || "Une contrainte explicite n'est pas respectee.";
  }

  const testsPassed = passed === strictTests.length;
  const constraintsPassed = constraints ? constraints.passed : !engineError;
  const success = testsPassed && constraintsPassed;

  return {
    success,
    passed,
    total: strictTests.length,
    errorCode: success ? null : firstErrorCode || "VALIDATION_FAILED",
    message: success
      ? "Validation reussie."
      : firstFailure || "Certains tests serveur ont echoue.",
    cases,
    publicCases: cases.map(sanitizeCase),
    constraints,
    firstExecution,
    engineError,
  };
}
