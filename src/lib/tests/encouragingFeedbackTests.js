import { buildEncouragingFeedback } from '../encouragingFeedback.js';
import { assert, assertEqual } from './testUtils.js';

export default function registerEncouragingFeedbackTests(defineSuite) {
  defineSuite('Encouraging validation feedback', (test) => {
    test('puts progress before a calculation issue', () => {
      const feedback = buildEncouragingFeedback({
        success: false,
        passed: 3,
        total: 4,
        errorCode: 'OUTPUT_MISMATCH',
        constraints: {
          passed: true,
          required: [
            { id: 'read_input', passed: true },
            { id: 'write_output', passed: true },
          ],
          forbidden: [],
        },
        diagnostics: [
          {
            type: 'logic_error',
            code: 'MISSING_QUANTITY',
            message: "Vous calculez le prix TTC d'un seul article.",
            hint: 'Multipliez aussi par la quantite.',
            testNext: 'Essaie prixHT = 100 et quantite = 2.',
          },
        ],
      });

      assertEqual(feedback.title, 'Bon progres: il reste une etape');
      assert(feedback.progress.some((item) => item.includes('Syntaxe correcte')));
      assert(feedback.progress.some((item) => item.includes('3/4 tests')));
      assert(feedback.progress.some((item) => item.includes('entrees')));
      assert(feedback.remainingIssue.includes('quantite'));
      assert(feedback.testNext.includes('100'));
    });

    test('does not claim syntax is correct for syntax errors', () => {
      const feedback = buildEncouragingFeedback({
        success: false,
        passed: 0,
        total: 0,
        errorCode: 'BQL_EXECUTION_FAILED',
        diagnostics: [
          {
            type: 'syntax_error',
            code: 'BQL_EXECUTION_FAILED',
            message: 'Point-virgule manquant apres affectation',
          },
        ],
      });

      assertEqual(feedback.title, 'Un point de structure a corriger');
      assert(!feedback.progress.some((item) => item.includes('Syntaxe correcte')));
      assert(feedback.remainingIssue.includes('point-virgule'));
    });

    test('reassures output format failures that the calculation is close', () => {
      const feedback = buildEncouragingFeedback({
        success: false,
        passed: 0,
        total: 2,
        errorCode: 'OUTPUT_FORMAT',
        diagnostics: [
          {
            type: 'output_format',
            code: 'OUTPUT_FORMAT',
            message: "Le resultat numerique semble correct, mais le format demande n'est pas respecte.",
          },
        ],
      });

      assertEqual(feedback.title, 'Presque: le format reste a ajuster');
      assert(feedback.progress.some((item) => item.includes('Syntaxe correcte')));
      assert(feedback.progress.some((item) => item.includes('bonne valeur')));
    });
  });
}
