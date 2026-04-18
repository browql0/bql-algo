const baseRubric = {
  difficulty: 'beginner',
  estimatedMinutes: 15,
  acceptableAlternatives: [
    'Different variable names are acceptable.',
    'Intermediate variables are acceptable.',
    'Equivalent formulas are acceptable when the output is correct.',
  ],
};

export const TEACHER_RUBRICS = {
  facture_simplifiee: {
    ...baseRubric,
    challengeId: 'facture_simplifiee',
    title: 'Facture simplifiee',
    objective: 'Read a unit price and quantity, calculate TTC with 20% TVA, and print only the final total.',
    difficulty: 'beginner',
    estimatedMinutes: 12,
    concepts: ['variables', 'LIRE', 'REEL', 'ENTIER', 'multiplication', 'constant_optional', 'ECRIRE'],
    commonMistakes: [
      'forgets quantity',
      'forgets TVA',
      'adds TVA as a fixed value',
      'prints text around the number',
      'prints an intermediate variable',
    ],
    partialSuccess: [
      'reads both inputs',
      'calculates a total HT',
      'uses an intermediate total variable',
      'prints one numeric result',
    ],
    misconceptions: [
      'TVA is a percentage, not +0.2 added to the final price',
      'quantity multiplies the unit price before TVA',
    ],
    gradingHints: [
      'Use hidden tests where quantity is greater than 1.',
      'Use a zero-price case to catch hardcoded output.',
      'Accept total <- prixHT * qte * 1.2 and total <- prixHT * qte + prixHT * qte * TVA.',
    ],
  },
  reduction_vip: {
    ...baseRubric,
    challengeId: 'reduction_vip',
    title: 'Reduction VIP',
    objective: 'Apply a conditional discount based on purchase amount and VIP status.',
    estimatedMinutes: 15,
    concepts: ['SI', 'SINON', 'comparisons', 'BOOLEEN', 'arithmetic'],
    commonMistakes: ['wrong threshold', 'inverted condition', 'discount applied twice', 'missing SINON'],
    partialSuccess: ['reads inputs correctly', 'handles one branch correctly', 'prints final price'],
    misconceptions: ['conditions choose a path; they do not automatically calculate both possibilities'],
    gradingHints: ['Test below, equal to, and above the threshold.', 'Include VIP and non-VIP scenarios.'],
  },
  caisse_enregistreuse: {
    ...baseRubric,
    challengeId: 'caisse_enregistreuse',
    title: 'Caisse enregistreuse',
    objective: 'Use a loop to process several prices and accumulate a total.',
    estimatedMinutes: 18,
    concepts: ['POUR', 'LIRE', 'accumulator', 'REEL', 'ECRIRE'],
    commonMistakes: ['accumulator not initialized', 'wrong loop bounds', 'overwrites total', 'prints every step instead of final total'],
    partialSuccess: ['uses a loop', 'reads all prices', 'adds at least some values'],
    misconceptions: ['an accumulator must keep its previous value at each iteration'],
    gradingHints: ['Use tests with three or more inputs.', 'Check output is the final total only.'],
  },
  evaluation_classe: {
    ...baseRubric,
    challengeId: 'evaluation_classe',
    title: 'Evaluation de classe',
    objective: 'Use an array and loop to calculate class-level information.',
    estimatedMinutes: 22,
    concepts: ['Tableau', 'POUR', 'sum', 'average', 'condition'],
    commonMistakes: ['wrong index range', 'divides by wrong count', 'uses a scalar instead of an array'],
    partialSuccess: ['declares an array', 'traverses all elements', 'calculates a partial sum'],
    misconceptions: ['array indices start at 0 in this course'],
    gradingHints: ['Use varied notes and edge cases around 10/20.'],
  },
  carte_tresors: {
    ...baseRubric,
    challengeId: 'carte_tresors',
    title: 'Carte aux tresors',
    objective: 'Use a matrix with nested loops to find or summarize grid values.',
    estimatedMinutes: 25,
    concepts: ['matrix', 'M[i,j]', 'nested loops', 'search'],
    commonMistakes: ['uses two bracket pairs for matrix access', 'swaps row and column', 'wrong nested loop bounds'],
    partialSuccess: ['declares matrix correctly', 'uses two loop indices', 'visits most cells'],
    misconceptions: ['BQL matrix access uses one bracket pair with a comma between row and column'],
    gradingHints: ['Use hidden tests where the target is not in the first row.'],
  },
  match_esport: {
    ...baseRubric,
    challengeId: 'match_esport',
    title: 'Match esport',
    objective: 'Model players with records and compare a numeric field.',
    estimatedMinutes: 25,
    concepts: ['TYPE', 'ENREGISTREMENT', 'record fields', 'SI', 'comparison'],
    commonMistakes: ['compares records directly', 'forgets field access', 'prints damage instead of pseudo'],
    partialSuccess: ['defines a record type', 'reads both players', 'compares numeric field'],
    misconceptions: ['records are compared through fields, not as whole values'],
    gradingHints: ['Use cases where player 1 wins and where player 2 wins.'],
  },
  moyenne_trois_notes: {
    ...baseRubric,
    challengeId: 'moyenne_trois_notes',
    title: 'Moyenne de trois notes',
    objective: 'Read three real numbers, calculate their average, and print it.',
    estimatedMinutes: 10,
    concepts: ['LIRE', 'REEL', 'addition', 'division', 'ECRIRE'],
    commonMistakes: ['forgets one note', 'divides by 2 or 4', 'prints sum instead of average'],
    partialSuccess: ['reads all inputs', 'calculates a sum', 'prints one value'],
    misconceptions: ['average means sum divided by the number of values'],
    gradingHints: ['Use decimals and unequal values to catch hardcoded formulas.'],
  },
  pair_ou_impair: {
    ...baseRubric,
    challengeId: 'pair_ou_impair',
    title: 'Pair ou impair',
    objective: 'Use MOD and a condition to classify an integer.',
    estimatedMinutes: 10,
    concepts: ['ENTIER', 'MOD', 'SI', 'SINON', 'ECRIRE'],
    commonMistakes: ['uses division instead of MOD', 'inverts Pair and Impair', 'prints lowercase text'],
    partialSuccess: ['reads n', 'uses a condition', 'handles one branch correctly'],
    misconceptions: ['n MOD 2 = 0 means the number is even'],
    gradingHints: ['Test positive, zero, and odd inputs.'],
  },
  somme_1_a_n: {
    ...baseRubric,
    challengeId: 'somme_1_a_n',
    title: 'Somme de 1 a n',
    objective: 'Use a loop and accumulator to sum integers from 1 to n.',
    estimatedMinutes: 14,
    concepts: ['POUR', 'ALLANT DE', 'accumulator', 'loop bounds'],
    commonMistakes: ['starts at 0 but still prints wrong result', 'forgets to initialize somme', 'overwrites somme with i'],
    partialSuccess: ['uses a loop', 'initializes an accumulator', 'adds several values'],
    misconceptions: ['somme <- somme + i keeps the old value and adds the new one'],
    gradingHints: ['Test n=1, n=5, and a larger value.'],
  },
  table_multiplication: {
    ...baseRubric,
    challengeId: 'table_multiplication',
    title: 'Table de multiplication',
    objective: 'Print the first ten multiples of an input number.',
    estimatedMinutes: 12,
    concepts: ['POUR', 'multiplication', 'counter', 'ECRIRE'],
    commonMistakes: ['wrong range', 'prints text when strict output expects numbers', 'uses addition only once'],
    partialSuccess: ['loops ten times', 'uses n and i', 'prints multiple lines'],
    misconceptions: ['n * i must be recalculated at every iteration'],
    gradingHints: ['Use n=3 and n=7 to catch hardcoded tables.'],
  },
  recherche_tableau: {
    ...baseRubric,
    challengeId: 'recherche_tableau',
    title: 'Recherche dans un tableau',
    objective: 'Read an array and target, then report whether the target is present.',
    estimatedMinutes: 18,
    concepts: ['Tableau', 'POUR', 'search', 'BOOLEEN', 'SI'],
    commonMistakes: ['resets trouve inside the loop', 'stops after first element', 'wrong output labels'],
    partialSuccess: ['reads array values', 'reads target', 'compares target with elements'],
    misconceptions: ['a boolean flag should remain true once the target is found'],
    gradingHints: ['Test target at first, middle, last, and absent.'],
  },
  moyenne_groupe_etudiants: {
    ...baseRubric,
    challengeId: 'moyenne_groupe_etudiants',
    title: 'Moyenne d un groupe d etudiants',
    objective: 'Use records in an array to read students and calculate average grade.',
    estimatedMinutes: 25,
    concepts: ['TYPE', 'ENREGISTREMENT', 'array of records', 'loop', 'average'],
    commonMistakes: ['forgets record field access', 'reads names but not notes', 'divides by wrong count'],
    partialSuccess: ['defines Etudiant', 'reads notes through groupe[i].note', 'accumulates sum'],
    misconceptions: ['groupe[i] is a full record; the note is groupe[i].note'],
    gradingHints: ['Use names with varied notes and check the output is numeric only.'],
  },
  mini_gestion_notes: {
    ...baseRubric,
    challengeId: 'mini_gestion_notes',
    title: 'Mini-projet gestion de notes',
    objective: 'Read students with records, compute class average, and identify the best student.',
    difficulty: 'intermediate',
    estimatedMinutes: 35,
    concepts: ['TYPE', 'array of records', 'POUR', 'accumulator', 'maximum search', 'structured output'],
    commonMistakes: ['initializes best index too late', 'compares names instead of notes', 'forgets to update sum'],
    partialSuccess: ['models student records', 'calculates average', 'finds best student in some cases'],
    misconceptions: ['the best student should be tracked by index so all fields stay available'],
    gradingHints: ['Accept different field names if behavior is correct.', 'Use hidden scenarios with best student at each position.'],
  },
};

export function getTeacherRubric(challengeId) {
  return TEACHER_RUBRICS[challengeId] || null;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function inferChallengeIdFromLesson(lesson = {}) {
  const explicit = lesson.test_cases?.exerciseId || lesson.test_cases?.exercise_id || lesson.test_cases?.id;
  if (explicit) return explicit;

  const title = normalizeText(lesson.title);
  if (title.includes('niveau 1')) return 'facture_simplifiee';
  if (title.includes('niveau 2')) return 'reduction_vip';
  if (title.includes('niveau 3')) return 'caisse_enregistreuse';
  if (title.includes('niveau 4')) return 'evaluation_classe';
  if (title.includes('niveau 5')) return 'carte_tresors';
  if (title.includes('niveau 6')) return 'match_esport';
  if (title.includes('moyenne de trois')) return 'moyenne_trois_notes';
  if (title.includes('pair ou impair')) return 'pair_ou_impair';
  if (title.includes('somme de 1 a n')) return 'somme_1_a_n';
  if (title.includes('table de multiplication')) return 'table_multiplication';
  if (title.includes('recherche dans un tableau')) return 'recherche_tableau';
  if (title.includes('moyenne d') && title.includes('groupe')) return 'moyenne_groupe_etudiants';
  if (title.includes('gestion de notes')) return 'mini_gestion_notes';
  return null;
}

export function getRubricForLesson(lesson = {}) {
  const challengeId = inferChallengeIdFromLesson(lesson);
  return getTeacherRubric(challengeId);
}
