function normalizeNumber(value) {
  const match = String(value ?? "").match(/-?\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ?parsed : null;
}

function numericInputs(testCase) {
  return String(testCase.input || "")
    .split("\n")
    .map((value) => Number(String(value).trim().replace(",", ".")))
    .filter((value) => Number.isFinite(value));
}

function nearlyEqual(a, b, tolerance = 1e-9) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
}

function caseFacts(testCase, tolerance) {
  return {
    ...testCase,
    inputs: numericInputs(testCase),
    actualNumber: normalizeNumber(testCase.actual),
    expectedNumber: normalizeNumber(testCase.expected),
    tolerance,
  };
}

function summarizePartialSuccess(strictResult) {
  if (!strictResult.total || strictResult.passed <= 0 || strictResult.passed >= strictResult.total) {
    return null;
  }

  return `Ton programme passe ${strictResult.passed}/${strictResult.total} tests: une partie de la logique est deja correcte.`;
}

export function createNumericFormulaPattern({
  code,
  message,
  hint,
  example,
  testNext,
  confidence = "medium",
  appliesTo = () => true,
  expectedActual,
}) {
  return {
    code,
    evaluate(testCase, context) {
      if (!appliesTo(testCase, context)) return false;
      const expected = expectedActual(testCase, context);
      return nearlyEqual(testCase.actualNumber, expected, testCase.tolerance);
    },
    diagnostic(context) {
      return {
        type: "logic_error",
        code,
        message,
        hint,
        example,
        testNext,
        confidence,
        alreadyCorrect: context.partialSuccess ?[context.partialSuccess] : [],
      };
    },
  };
}

export function diagnoseNumericLogicPatterns({
  strictResult,
  patterns = [],
  tolerance = 1e-9,
}) {
  const failedCases = (strictResult.cases || [])
    .filter((testCase) => !testCase.passed && testCase.errorCode === "OUTPUT_MISMATCH")
    .map((testCase) => caseFacts(testCase, tolerance))
    .filter((testCase) => Number.isFinite(testCase.actualNumber));

  if (failedCases.length === 0) return [];

  const context = {
    strictResult,
    failedCases,
    partialSuccess: summarizePartialSuccess(strictResult),
  };

  for (const pattern of patterns) {
    const matches = failedCases.filter((testCase) => pattern.evaluate(testCase, context));
    if (matches.length === 0) continue;

    return [
      {
        ...pattern.diagnostic({
          ...context,
          matches,
          firstMatch: matches[0],
        }),
        matchedCases: matches.map((testCase) => testCase.id).filter(Boolean),
      },
    ];
  }

  if (context.partialSuccess) {
    return [
      {
        type: "logic_error",
        code: "PARTIAL_FORMULA",
        message:
          "Le programme marche pour certains cas, mais la formule ne couvre pas toutes les entrees.",
        hint:
          "Cherchez ce qui change entre un test reussi et un test echoue: quantite, coefficient, condition ou variable affichee.",
        testNext:
          "Teste avec une valeur simple, puis change une seule entree pour voir si le resultat suit.",
        confidence: "low",
        alreadyCorrect: [context.partialSuccess],
      },
    ];
  }

  return [];
}

export function genericLogicDiagnostic(strictResult) {
  const partialSuccess = summarizePartialSuccess(strictResult);

  return {
    type: "logic_error",
    code: partialSuccess ?"PARTIAL_FORMULA" : "OUTPUT_MISMATCH",
    message: partialSuccess
      ?"Le programme marche pour certains cas, mais la formule semble incomplete."
      : "Le programme s'execute, mais le resultat calcule n'est pas encore le bon.",
    hint: partialSuccess
      ?"Compare un test qui passe et un test qui echoue pour trouver l'entree oubliee."
      : "Refais le calcul attendu a la main avec un petit exemple, puis compare chaque etape.",
    testNext: partialSuccess
      ?"Change une seule entree a la fois et verifie si ton resultat change aussi."
      : "Teste avec de petites valeurs faciles a verifier a la main.",
    confidence: "low",
    alreadyCorrect: partialSuccess ?[partialSuccess] : [],
  };
}
