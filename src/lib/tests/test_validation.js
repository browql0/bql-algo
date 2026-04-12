import { analyzeFeedback, ERROR_TYPES } from '../feedbackAnalyzer.js';
import { executeCode } from '../executeCode.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let passed = 0;
let failed = 0;

function assert(label, condition, details = '') {
  if (condition) {
    console.log(`  ${GREEN}✓${RESET} ${label}`);
    passed++;
  } else {
    console.log(`  ${RED}✗ FAIL${RESET} ${label}`);
    if (details) console.log(`    ${YELLOW}→ ${details}${RESET}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${CYAN}${BOLD}${'─'.repeat(60)}${RESET}`);
  console.log(`${CYAN}${BOLD}  ${title}${RESET}`);
  console.log(`${CYAN}${BOLD}${'─'.repeat(60)}${RESET}`);
}

// Helper to simulate the exact pipeline of EditorLayout
async function simulateValidation(source, testCases) {
  // 1. Dry run pour AST errors
  let astErrors = { lexicalErrors: [], syntaxErrors: [], semanticErrors: [], runtimeErrors: [] };
  try {
    const dryRun = await executeCode(source, { inputs: [], terminalSpeed: 'instant' });
    astErrors.lexicalErrors = dryRun.lexicalErrors || [];
    astErrors.syntaxErrors = dryRun.syntaxErrors || [];
    astErrors.semanticErrors = dryRun.semanticErrors || [];
  } catch (e) {}

  // 2. Loop test cases
  let evaluatedCases = [];
  for (const tc of testCases) {
    const inputsArray = String(tc.input).split('\n');
    let testResult = { input: tc.input, expected: tc.expected, got: '', passed: false, reason: null };
    try {
      const result = await executeCode(source, { inputs: inputsArray, terminalSpeed: 'instant' });
      if (!result.success || result.errors.length > 0) {
        testResult.passed = false;
        testResult.reason = "Le code a déclenché une erreur.";
        testResult._runtimeErrors = result.runtimeErrors || [];
      } else {
        const finalOutStr = result.output.join("\n").trim();
        testResult.got = finalOutStr;
        testResult.passed = (finalOutStr === tc.expected || finalOutStr.includes(tc.expected));
      }
    } catch (e) {}
    evaluatedCases.push(testResult);
  }

  // 3. Analyze
  const collectedRuntimeErrors = [];
  for (const tc of evaluatedCases) {
    if (tc._runtimeErrors) collectedRuntimeErrors.push(...tc._runtimeErrors);
  }
  astErrors.runtimeErrors = collectedRuntimeErrors;

  return analyzeFeedback(source, evaluatedCases, {}, astErrors);
}

async function runTests() {
  section('1. Validation Sémantique (Variables / Tableaux)');
  
  // Test 1: Variable non déclarée
  const src1 = `ALGORITHME_Test;
DEBUT
  y <- 5;
FIN`;
  let feedback = await simulateValidation(src1, [{ input: '', expected: '5' }]);
  assert('Variable non déclarée identifiée comme SEMANTIC_ERROR', feedback.errorType === ERROR_TYPES.SEMANTIC_ERROR, `Got: ${feedback.errorType}`);

  // Test 2: Matrice mal indexée
  const src2 = `ALGORITHME_Test;
VARIABLE
  Tableau M[3, 3] : ENTIER;
DEBUT
  M <- 4;
FIN`;
  feedback = await simulateValidation(src2, [{ input: '', expected: '4' }]);
  assert('Affectation matrice globale identifiée comme SEMANTIC_ERROR', feedback.errorType === ERROR_TYPES.SEMANTIC_ERROR, `Got: ${feedback.errorType}`);

  section('2. Validation Syntaxique');
  
  // Test 3: Oubli point virgule ou FIN manquant
  const src3 = `ALGORITHME_Test;
DEBUT
  x <- 5`; // missing FIN
  feedback = await simulateValidation(src3, [{ input: '', expected: '5' }]);
  assert('Structure incomplète identifiée comme SYNTAX_ERROR', feedback.errorType === ERROR_TYPES.SYNTAX_ERROR, `Got: ${feedback.errorType}`);

  section('3. Problèmes de Logique / Affichage');
  
  // Test 4: Mauvais calcul (10 au lieu de 5)
  const src4 = `ALGORITHME_Test;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 10;
  ECRIRE(x);
FIN`;
  feedback = await simulateValidation(src4, [{ input: '', expected: '5' }]);
  assert('Résultat différent (10 au lieu de 5) est un probléme LOGIQUE ou CALCUL', 
         [ERROR_TYPES.LOGIC_ERROR, ERROR_TYPES.CALC_ERROR].includes(feedback.errorType), 
         `Got: ${feedback.errorType}`);

  // Test 5: Bon calcul mais texte différent (espaces invisibles, etc)
  const src5 = `ALGORITHME_Test;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 5;
  ECRIRE("Resultat : " , x);
FIN`;
  feedback = await simulateValidation(src5, [{ input: '', expected: 'Resultat:5' }]);
  // The expected result doesn't perfectly match `Resultat : 5` but contains the numeric value correctly.
  assert('Résultat texte légèrement différent mais valeur numérique OK ➔ OUTPUT_FORMAT', feedback.errorType === ERROR_TYPES.OUTPUT_FORMAT, `Got: ${feedback.errorType}`);

  console.log(`\n${BOLD}Résultats : ${passed} passés, ${failed} total${RESET}\n`);
  if (failed === 0) console.log(`✅ Tous les tests sont passés !`);
  else process.exit(1);
}

runTests().catch(e => {
  console.error("Test framework error:", e);
  process.exit(1);
});
