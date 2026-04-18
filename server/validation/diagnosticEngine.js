import { FACTURE_SIMPLIFIEE_ID, diagnoseFactureSimplifiee } from "./exerciseRules/factureSimplifiee.js";
import { genericLogicDiagnostic } from "./logicFeedback.js";

function engineErrorDiagnostic(strictResult) {
  const error = strictResult.engineError;
  if (!error) return null;

  const typeMap = {
    lexical: "syntax_error",
    syntax: "syntax_error",
    semantic: "semantic_error",
    runtime: "runtime_error",
  };

  return {
    type: typeMap[error.type] || "execution_error",
    code: "BQL_EXECUTION_FAILED",
    message: error.message || "Le code ne peut pas etre execute.",
    hint: error.hint || "Corrigez d'abord l'erreur signalee par le moteur BQL.",
  };
}

function constraintDiagnostics(strictResult) {
  const failed = strictResult.constraints?.failed || [];
  return failed.map((constraint) => ({
    type: "missing_required_concept",
    code: "CONSTRAINT_FAILED",
    message: constraint.message,
    hint: constraint.hint || null,
  }));
}

function outputFormatDiagnostics(strictResult) {
  const failedCases = strictResult.cases.filter((testCase) => !testCase.passed);
  const firstOutputFormat = failedCases.find(
    (testCase) => testCase.errorCode === "OUTPUT_FORMAT",
  );
  if (firstOutputFormat) {
    return [
      {
        type: "output_format",
        code: "OUTPUT_FORMAT",
        message:
          "Le resultat numerique semble correct, mais le format demande n'est pas respecte.",
        hint: "Affichez uniquement la valeur finale, sans phrase ni libelle.",
      },
    ];
  }

  return [];
}

function genericOutputMismatchDiagnostics(strictResult, diagnostics) {
  const hasSpecificLogic = diagnostics.some(
    (diagnostic) =>
      diagnostic.type === "logic_error" &&
      diagnostic.code !== "OUTPUT_MISMATCH" &&
      diagnostic.code !== "PARTIAL_FORMULA",
  );
  if (hasSpecificLogic) return [];

  const failedCases = strictResult.cases.filter((testCase) => !testCase.passed);
  if (failedCases.some((testCase) => testCase.errorCode === "OUTPUT_MISMATCH")) {
    return [genericLogicDiagnostic(strictResult)];
  }

  return [];
}

function successDiagnostic(exercise, strictResult) {
  if (!strictResult.success) return [];

  return [
    {
      type: "valid_alternative_solution",
      code: "VALID_SOLUTION",
      message:
        "Solution valide. Elle est acceptee parce que son comportement respecte les tests et les contraintes explicites, meme si sa structure differe d'une solution de reference.",
      hint: null,
      exerciseId: exercise.id,
    },
  ];
}

function buildFeedbackReport({ strictResult, diagnostics }) {
  if (strictResult.success) {
    return {
      errorType: null,
      subtitle: "Solution valide.",
      correctPoints: [
        "Les tests comportementaux passent.",
        "Les contraintes explicites de l'exercice sont respectees.",
      ],
      errorPoints: [],
      commonMistakes: [],
      hint: null,
    };
  }

  const primary = diagnostics[0];
  const errorTypeMap = {
    syntax_error: "SYNTAX_ERROR",
    semantic_error: "SEMANTIC_ERROR",
    runtime_error: "RUNTIME_ERROR",
    output_format: "OUTPUT_FORMAT",
    missing_required_concept: "MISSING_CONCEPT",
    logic_error: "LOGIC_ERROR",
    misunderstanding: "MISUNDERSTANDING",
  };

  const diagnosticCorrectPoints = diagnostics
    .flatMap((diagnostic) => diagnostic.alreadyCorrect || [])
    .filter(Boolean);

  return {
    errorType: errorTypeMap[primary?.type] || strictResult.errorCode || "VALIDATION_FAILED",
    subtitle: primary?.message || strictResult.message,
    correctPoints: [
      ...(strictResult.passed > 0
        ? [`${strictResult.passed} test(s) comportemental(aux) passent.`]
        : []),
      ...diagnosticCorrectPoints,
    ],
    errorPoints: diagnostics.map((diagnostic) => diagnostic.message),
    commonMistakes: diagnostics
      .filter((diagnostic) => diagnostic.type === "logic_error")
      .map((diagnostic) => diagnostic.message),
    hint: primary?.hint || null,
    testNext: primary?.testNext || null,
    example: primary?.example || null,
  };
}

export async function diagnoseSubmission({ exercise, strictResult }) {
  const diagnostics = [];
  const engineDiagnostic = engineErrorDiagnostic(strictResult);

  if (engineDiagnostic) {
    diagnostics.push(engineDiagnostic);
  } else {
    diagnostics.push(...constraintDiagnostics(strictResult));
    diagnostics.push(...outputFormatDiagnostics(strictResult));

    const hasOutputFormatProblem = diagnostics.some(
      (diagnostic) => diagnostic.code === "OUTPUT_FORMAT",
    );

    if (!hasOutputFormatProblem && exercise.id === FACTURE_SIMPLIFIEE_ID) {
      diagnostics.push(
        ...diagnoseFactureSimplifiee({
          strictResult,
          astAnalysis: strictResult.constraints?.astAnalysis || {
            inputCount: 0,
            outputCount: 0,
            constantCount: 0,
          },
        }),
      );
    }

    if (!hasOutputFormatProblem && typeof exercise.diagnose === "function") {
      diagnostics.push(
        ...exercise.diagnose({
          strictResult,
          astAnalysis: strictResult.constraints?.astAnalysis || {
            inputCount: 0,
            outputCount: 0,
            constantCount: 0,
          },
        }),
      );
    }

    if (!hasOutputFormatProblem) {
      diagnostics.push(...genericOutputMismatchDiagnostics(strictResult, diagnostics));
    }

    diagnostics.push(...successDiagnostic(exercise, strictResult));
  }

  const uniqueDiagnostics = [];
  const seen = new Set();
  for (const diagnostic of diagnostics) {
    const key = `${diagnostic.type}:${diagnostic.code}:${diagnostic.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueDiagnostics.push(diagnostic);
  }

  return {
    diagnostics: uniqueDiagnostics,
    feedbackReport: buildFeedbackReport({
      strictResult,
      diagnostics: uniqueDiagnostics,
    }),
  };
}
