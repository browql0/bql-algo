import { buildHumanizedValidationFeedback } from './validationMessageHumanizer.js';

const SERVER_ERROR_CODES = new Set([
  'AUTH_REQUIRED',
  'INVALID_TOKEN',
  'SERVER_NOT_CONFIGURED',
  'CORS_NOT_CONFIGURED',
  'CORS_ORIGIN_DENIED',
  'BACKEND_TIMEOUT',
  'BACKEND_UNREACHABLE',
  'MALFORMED_VALIDATION_RESPONSE',
  'SERVER_EXCEPTION',
  'SUPABASE_AUTH_FAILED',
  'TESTS_MISSING',
]);

function addUnique(items, value) {
  if (!value || items.includes(value)) return;
  items.push(value);
}

function primaryDiagnostic(results = {}) {
  return Array.isArray(results.diagnostics) ?results.diagnostics[0] : null;
}

function failedConstraintItems(results = {}) {
  const constraints = results.constraints || {};
  return [
    ...(constraints.required || []),
    ...(constraints.forbidden || []),
  ].filter((item) => item && item.passed === false);
}

function passedConstraintItems(results = {}) {
  const constraints = results.constraints || {};
  return [
    ...(constraints.required || []),
    ...(constraints.forbidden || []),
  ].filter((item) => item && item.passed === true);
}

function hasBlockingServerIssue(results = {}) {
  return SERVER_ERROR_CODES.has(results.errorCode);
}

function hasEngineFailure(results = {}) {
  return (
    results.errorCode === 'BQL_EXECUTION_FAILED' ||
    (results.diagnostics || []).some((diagnostic) =>
      ['syntax_error', 'lexical_error', 'semantic_error', 'runtime_error'].includes(
        diagnostic.type,
      ),
    )
  );
}

function isSyntaxProblem(diagnostic) {
  return diagnostic?.type === 'syntax_error' || diagnostic?.type === 'lexical_error';
}

function isSemanticProblem(diagnostic) {
  return diagnostic?.type === 'semantic_error';
}

function isRuntimeProblem(diagnostic) {
  return diagnostic?.type === 'runtime_error';
}

function isOutputOrLogicProblem(diagnostic, results = {}) {
  return (
    diagnostic?.type === 'logic_error' ||
    diagnostic?.type === 'output_format' ||
    results.errorCode === 'OUTPUT_MISMATCH' ||
    results.errorCode === 'OUTPUT_FORMAT'
  );
}

function progressFromConstraints(results, progress) {
  const passed = passedConstraintItems(results);
  const failed = failedConstraintItems(results);

  if (passed.some((item) => item.id === 'read_input' || item.id === 'input_count')) {
    addUnique(progress, 'Les entrees semblent deja lues correctement.');
  }

  if (passed.some((item) => item.id === 'write_output' || item.id === 'output_count')) {
    addUnique(progress, 'Ton programme affiche deja un resultat.');
  }

  if (results.constraints?.passed === true) {
    addUnique(progress, 'Les contraintes explicites sont respectees.');
  } else if (passed.length > 0 && failed.length > 0) {
    addUnique(progress, 'Une partie des contraintes est deja respectee.');
  }
}

function buildProgressSignals(results = {}, primary = {}) {
  const progress = [];
  const diagnostic = primaryDiagnostic(results);
  const total = Number(results.total || 0);
  const passed = Number(results.passed || 0);
  const hasTests = total > 0;

  if (results.success) {
    return [
      'Syntaxe correcte.',
      'Ton programme s execute correctement.',
      hasTests ?`Tous les tests passent (${passed}/${total}).` : 'La validation officielle est acceptee.',
    ];
  }

  if (hasBlockingServerIssue(results)) {
    if (results.errorCode === 'TESTS_MISSING') {
      return [
        "Ce defi n'est pas encore configure correctement cote plateforme.",
        "Ta solution n'est pas forcement en cause.",
      ];
    }

    return [
      "Ton code semble correct jusqu'ici : la validation officielle est bloquee par la configuration du serveur.",
    ];
  }

  if (!isSyntaxProblem(diagnostic)) {
    addUnique(progress, 'Syntaxe correcte.');
  }

  if (!isSyntaxProblem(diagnostic) && !isSemanticProblem(diagnostic)) {
    addUnique(progress, 'Declarations et types acceptes.');
  }

  if (!hasEngineFailure(results) || isOutputOrLogicProblem(diagnostic, results)) {
    addUnique(progress, 'Ton programme s execute correctement.');
  } else if (isRuntimeProblem(diagnostic)) {
    addUnique(progress, 'La structure du programme est comprise.');
  }

  if (hasTests && passed > 0) {
    addUnique(progress, `${passed}/${total} tests passent deja.`);
  }

  if (primary.tone === 'output' || diagnostic?.type === 'output_format') {
    addUnique(progress, 'Le calcul semble deja produire la bonne valeur.');
  }

  progressFromConstraints(results, progress);

  if (progress.length === 0 && isSemanticProblem(diagnostic)) {
    addUnique(progress, 'Le validateur comprend la structure generale du programme.');
  }

  return progress;
}

function buildTitle(results = {}, primary = {}) {
  if (results.success) return 'Solution valide';
  if (hasBlockingServerIssue(results)) return 'Validation a relancer';
  if (primary.tone === 'syntax' || primary.tone === 'semantic') return 'Un point de structure a corriger';
  if (primary.tone === 'output') return 'Presque: le format reste a ajuster';
  if (primary.tone === 'logic') return 'Bon progres: il reste une etape';
  return 'Continue: il reste un point a corriger';
}

function buildSubtitle(results = {}, progress = []) {
  if (results.success) return 'Tout est valide cote serveur.';
  if (hasBlockingServerIssue(results)) return "Ton code n'a pas encore pu etre evalue officiellement.";
  if (progress.length > 0) return "Tout n'est pas a refaire: garde ce qui fonctionne deja.";
  return 'Corrige le point indique, puis relance la validation.';
}

export function buildProgressiveDiagnosis(results = {}) {
  const humanized = buildHumanizedValidationFeedback(results);
  const primary = humanized.primary;
  const progress = buildProgressSignals(results, primary);

  return {
    title: buildTitle(results, primary),
    subtitle: buildSubtitle(results, progress),
    progress,
    remainingIssue: primary.problem || results.message || 'Un point reste a corriger.',
    nextAction:
      primary.fix ||
      primary.testNext ||
      results.feedbackReport?.hint ||
      "Corrige ce point, puis relance la validation.",
    testNext: primary.testNext || results.feedbackReport?.testNext || null,
    example: primary.example || results.feedbackReport?.example || null,
    tone: primary.tone || 'validation',
    primary,
    secondary: humanized.secondary,
    debug: humanized.debug,
  };
}

export function buildEncouragingFeedback(results = {}) {
  return buildProgressiveDiagnosis(results);
}
