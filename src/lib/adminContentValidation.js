const CHALLENGE_TYPES = new Set(['exercice', 'challenge']);
const VALIDATION_MODES = new Set(['result_only', 'result_plus_constraints', 'concept_training', 'project_rubric']);

export function parseJsonField(rawValue, fallback = []) {
  if (!rawValue || !String(rawValue).trim()) return fallback;
  try {
    return JSON.parse(rawValue);
  } catch {
    throw new Error('Les tests cachés doivent être un JSON valide.');
  }
}

export function normalizeValidationConfig(rawConfig) {
  const config = Array.isArray(rawConfig)
    ? { cases: rawConfig }
    : { ...(rawConfig || {}) };

  const cases = Array.isArray(config.cases) ? config.cases : [];
  return {
    ...config,
    cases: cases.map((testCase, index) => ({
      name: testCase.name || `Test ${index + 1}`,
      input: String(testCase.input ?? ''),
      output: String(testCase.output ?? testCase.expected ?? ''),
    })),
  };
}

export function validateValidationConfig(rawConfig) {
  const config = normalizeValidationConfig(rawConfig);

  if (config.validationMode && !VALIDATION_MODES.has(config.validationMode)) {
    throw new Error(`Mode de validation inconnu : ${config.validationMode}.`);
  }

  if (!config.exerciseId && !config.projectId) {
    throw new Error('La metadata de validation doit contenir exerciseId ou projectId.');
  }

  if (!Array.isArray(config.cases) || config.cases.length === 0) {
    throw new Error('Ajoute au moins un test caché dans la configuration de validation.');
  }

  config.cases.forEach((testCase, index) => {
    if (typeof testCase.input !== 'string') {
      throw new Error(`Le test ${index + 1} doit avoir une entrée texte.`);
    }
    if (!String(testCase.output ?? '').trim()) {
      throw new Error(`Le test ${index + 1} doit avoir une sortie attendue.`);
    }
  });

  return config;
}

export function validateAdminLessonPayload(values) {
  if (!values.course_id) throw new Error('Choisis un niveau/cours.');
  if (!String(values.title || '').trim()) throw new Error('Le titre est obligatoire.');

  const payload = {
    ...values,
    title: String(values.title || '').trim(),
    content: String(values.content || '').trim(),
    example_code: String(values.example_code || ''),
    exercise: String(values.exercise || ''),
    xp_value: Number(values.xp_value || 25),
  };

  if (payload.xp_value < 0) throw new Error('La valeur XP ne peut pas être négative.');

  if (CHALLENGE_TYPES.has(values.lesson_type)) {
    if (!payload.exercise.trim()) {
      throw new Error('Un challenge doit avoir un énoncé clair.');
    }

    const parsedTests = parseJsonField(values.test_cases, []);
    payload.test_cases = validateValidationConfig(parsedTests);
  } else {
    delete payload.solution;
    delete payload.expected_output;
    delete payload.test_cases;
  }

  return payload;
}
