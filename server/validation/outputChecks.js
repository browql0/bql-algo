import { compareOutputs, numericMatch } from "../../src/lib/outputUtils.js";

function normalizeLine(value) {
  return String(value ?? "").trim();
}

function normalizeOutput(outputLines) {
  return (outputLines || []).map(normalizeLine).filter((line) => line !== "");
}

function parseStrictNumber(value) {
  const text = normalizeLine(value).replace(",", ".");
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ?parsed : null;
}

function nearlyEqual(a, b, tolerance = 1e-9) {
  return Math.abs(a - b) <= tolerance;
}

function containsExpectedNumber(lines, expectedNumber, tolerance) {
  for (const line of lines) {
    const numbers = line.match(/-?\d+(?:[.,]\d+)?/g) || [];
    for (const raw of numbers) {
      const parsed = Number(raw.replace(",", "."));
      if (Number.isFinite(parsed) && nearlyEqual(parsed, expectedNumber, tolerance)) {
        return true;
      }
    }
  }
  return false;
}

function checkSingleNumber(outputLines, expected, options = {}) {
  const lines = normalizeOutput(outputLines);
  const expectedNumber = parseStrictNumber(expected);
  const tolerance = Number(options.numericTolerance ?? 1e-9);

  if (lines.length === 0) {
    return {
      passed: false,
      errorCode: "NO_OUTPUT",
      reason: "Le programme n'affiche aucun resultat.",
      expected: String(expected ?? ""),
      actual: "",
    };
  }

  if (!Number.isFinite(expectedNumber)) {
    return {
      passed: false,
      errorCode: "INVALID_EXPECTED_OUTPUT",
      reason: "La sortie attendue du test serveur n'est pas numerique.",
      expected: String(expected ?? ""),
      actual: lines.join("\n"),
    };
  }

  const actualSingleNumber = lines.length === 1 ?parseStrictNumber(lines[0]) : null;
  if (
    actualSingleNumber !== null &&
    nearlyEqual(actualSingleNumber, expectedNumber, tolerance)
  ) {
    return {
      passed: true,
      errorCode: null,
      reason: null,
      expected: String(expected ?? ""),
      actual: lines.join("\n"),
    };
  }

  if (containsExpectedNumber(lines, expectedNumber, tolerance)) {
    return {
      passed: false,
      errorCode: "OUTPUT_FORMAT",
      reason:
        "Le calcul semble correct, mais la sortie doit contenir uniquement le nombre attendu.",
      expected: String(expected ?? ""),
      actual: lines.join("\n"),
    };
  }

  return {
    passed: false,
    errorCode: "OUTPUT_MISMATCH",
    reason: "La valeur affichee ne correspond pas au resultat attendu.",
    expected: String(expected ?? ""),
    actual: lines.join("\n"),
  };
}

function checkFinalOutput(outputLines, expected, options = {}) {
  const lines = normalizeOutput(outputLines);
  const expectedText = normalizeLine(expected);
  const finalOutput = lines.join("\n").trim();
  const lastLine = lines.length > 0 ?lines[lines.length - 1] : "";
  const strict = options.strict !== false;

  if (lines.length === 0) {
    return {
      passed: false,
      errorCode: "NO_OUTPUT",
      reason: "Le programme n'affiche aucun resultat.",
      expected: expectedText,
      actual: "",
    };
  }

  const compared = strict
    ?compareOutputs(finalOutput, expectedText)
    : compareOutputs(lastLine, expectedText);

  if (
    compared.passed ||
    (!strict && (lastLine.includes(expectedText) || numericMatch(lastLine, expectedText)))
  ) {
    return {
      passed: true,
      errorCode: null,
      reason: null,
      expected: expectedText,
      actual: finalOutput,
    };
  }

  return {
    passed: false,
    errorCode: "OUTPUT_MISMATCH",
    reason: "La sortie ne correspond pas au resultat attendu.",
    expected: expectedText,
    actual: finalOutput,
  };
}

export function checkOutput({ outputLines, expected, expectedOutput = {} }) {
  const kind = expectedOutput.kind || "final_output";

  if (kind === "single_number") {
    return checkSingleNumber(outputLines, expected, expectedOutput);
  }

  return checkFinalOutput(outputLines, expected, expectedOutput);
}

export function outputContainsExpectedNumber(outputLines, expected, options = {}) {
  const lines = normalizeOutput(outputLines);
  const expectedNumber = parseStrictNumber(expected);
  const tolerance = Number(options.numericTolerance ?? 1e-9);
  if (!Number.isFinite(expectedNumber)) return false;
  return containsExpectedNumber(lines, expectedNumber, tolerance);
}
