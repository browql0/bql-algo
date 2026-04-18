export const ADVANCED_PROJECT_SCHEMA = {
  id: 'string',
  level: 'number',
  validationMode: 'result_plus_constraints | concept_training | project_rubric',
  requiredModules: 'string[]',
  minimumFeatures: 'string[]',
  optionalBonusFeatures: 'string[]',
  complexityExpectations: 'string[]',
  structureSuggestions: 'string[]',
  multipleSuccessPaths: 'string[]',
  scoringWeights: {
    correctness: 'number',
    logic: 'number',
    structure: 'number',
    clarity: 'number',
  },
  hiddenScenarios: 'string[]',
  edgeCases: 'string[]',
  maintainabilitySignals: 'string[]',
};

export const ADVANCED_PROJECT_METADATA = {
  bilan_classe_advanced: {
    id: 'bilan_classe_advanced',
    level: 7,
    validationMode: 'concept_training',
    requiredModules: ['arrays', 'loops', 'conditions'],
    minimumFeatures: ['read class notes', 'calculate average', 'display a decision based on average'],
    optionalBonusFeatures: ['count passing notes', 'display class status categories'],
    complexityExpectations: ['one array traversal', 'one accumulator', 'one final condition'],
    structureSuggestions: ['separate reading, calculation, decision, and output sections'],
    multipleSuccessPaths: ['calculate sum during input loop', 'read first then traverse a second time'],
    scoringWeights: { correctness: 45, logic: 25, structure: 20, clarity: 10 },
    hiddenScenarios: ['all passing notes', 'all failing notes', 'average exactly 10'],
    edgeCases: ['decimal notes', 'same notes repeated'],
    maintainabilitySignals: ['clear variable names', 'no hardcoded average', 'single final decision block'],
  },
  notes_valides_advanced: {
    id: 'notes_valides_advanced',
    level: 7,
    validationMode: 'result_plus_constraints',
    requiredModules: ['arrays', 'loops', 'conditions', 'counter'],
    minimumFeatures: ['read five notes', 'count notes greater than or equal to 10', 'print the count'],
    optionalBonusFeatures: ['also calculate class average', 'track best note'],
    complexityExpectations: ['one loop over the array', 'one condition inside the loop'],
    structureSuggestions: ['initialize counter before loop', 'increment only inside the true branch'],
    multipleSuccessPaths: ['count during input', 'read first then count in a second loop'],
    scoringWeights: { correctness: 50, logic: 25, structure: 15, clarity: 10 },
    hiddenScenarios: ['no passing notes', 'all passing notes', 'only last note passes'],
    edgeCases: ['note exactly 10', 'note 0', 'note 20'],
    maintainabilitySignals: ['counter initialized once', 'condition is explicit', 'no repeated manual comparisons'],
  },
  debug_somme_trace: {
    id: 'debug_somme_trace',
    level: 7,
    validationMode: 'concept_training',
    requiredModules: ['debugging', 'trace table', 'accumulator'],
    minimumFeatures: ['show each accumulator value', 'identify divergence', 'explain fix'],
    optionalBonusFeatures: ['trace i and T[i]', 'compare expected and actual output'],
    complexityExpectations: ['student reasons about state, not only final output'],
    structureSuggestions: ['write a trace table before editing code'],
    multipleSuccessPaths: ['manual trace', 'temporary ECRIRE debug output'],
    scoringWeights: { correctness: 35, logic: 25, structure: 20, clarity: 20 },
    hiddenScenarios: ['accumulator not initialized', 'wrong loop bound', 'wrong increment'],
    edgeCases: ['first value only', 'last value skipped'],
    maintainabilitySignals: ['debug prints removed from final answer', 'trace explains the first wrong step'],
  },
  mini_gestion_notes: {
    id: 'mini_gestion_notes',
    level: 7,
    validationMode: 'project_rubric',
    requiredModules: ['records', 'arrays', 'loops', 'accumulators', 'maximum search'],
    minimumFeatures: ['read students', 'calculate class average', 'display best student'],
    optionalBonusFeatures: ['search student', 'display passing count', 'display ranking'],
    complexityExpectations: ['record type', 'array of records', 'one traversal for input/calculation', 'best index tracking'],
    structureSuggestions: ['TYPE Etudiant first', 'variables second', 'main algorithm split into input, processing, output'],
    multipleSuccessPaths: ['single traversal with live sum and best index', 'two traversals after reading all students'],
    scoringWeights: { correctness: 50, logic: 25, structure: 15, clarity: 10 },
    hiddenScenarios: ['best student first', 'best student last', 'tie in top notes'],
    edgeCases: ['decimal notes', 'same note repeated', 'names with spaces if supported by input UI'],
    maintainabilitySignals: ['field names are meaningful', 'no duplicated student variables', 'uses best index instead of copying fields manually'],
  },
  choix_structure_advanced: {
    id: 'choix_structure_advanced',
    level: 7,
    validationMode: 'concept_training',
    requiredModules: ['variables', 'arrays', 'matrices', 'records'],
    minimumFeatures: ['choose appropriate structure for each data shape', 'justify the choice'],
    optionalBonusFeatures: ['combine structures for a realistic example'],
    complexityExpectations: ['recognize list vs grid vs object-like data'],
    structureSuggestions: ['start from the shape of the data, then choose syntax'],
    multipleSuccessPaths: ['different realistic examples are acceptable'],
    scoringWeights: { correctness: 40, logic: 25, structure: 25, clarity: 10 },
    hiddenScenarios: ['grid data', 'student profile', 'list of prices'],
    edgeCases: ['single value that does not need an array', 'record field that should not be a separate parallel array'],
    maintainabilitySignals: ['data that belongs together is grouped together', 'parallel arrays are avoided when a record is clearer'],
  },
};

export function getAdvancedProjectMetadata(projectId) {
  return ADVANCED_PROJECT_METADATA[projectId] || null;
}

function inferProjectIdFromLesson(lesson = {}) {
  const rules = lesson.test_cases || {};
  if (rules.projectId || rules.exerciseId || rules.id) {
    return rules.projectId || rules.exerciseId || rules.id;
  }

  const type = lesson.lesson_type;
  if (type === 'advanced_decomposition') return 'bilan_classe_advanced';
  if (type === 'advanced_data_flow') return 'notes_valides_advanced';
  if (type === 'advanced_debug') return 'debug_somme_trace';
  if (type === 'advanced_mini_project') return 'mini_gestion_notes';
  if (type === 'advanced_review') return 'choix_structure_advanced';

  return null;
}

export function getAdvancedProjectForLesson(lesson = {}) {
  const projectId = inferProjectIdFromLesson(lesson);
  return getAdvancedProjectMetadata(projectId);
}
