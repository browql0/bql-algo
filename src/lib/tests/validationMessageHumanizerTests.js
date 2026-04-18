import {
  buildHumanizedValidationFeedback,
  humanizeParserError,
  humanizeSemanticError,
  humanizeValidationMessage,
} from '../validationMessageHumanizer.js';
import { assert, assertEqual } from './testUtils.js';

export default function registerValidationMessageHumanizerTests(defineSuite) {
  defineSuite('Validation message humanizer', (test) => {
    test('rewrites single constant syntax noise into a beginner message', () => {
      const message = humanizeParserError({
        message: 'Utiliser CONSTANTE pour une seule constante - Attendu : "CONSTANTE"',
      });

      assertEqual(message.title, 'Erreur de syntaxe');
      assert(message.problem.includes('CONSTANTES'));
      assert(message.fix.includes('CONSTANTE'));
      assert(message.example.includes('TVA'));
    });

    test('rewrites output format diagnostics without raw expected details', () => {
      const message = humanizeValidationMessage({
        type: 'output_format',
        code: 'OUTPUT_FORMAT',
        message: 'Le resultat numerique semble correct, mais le format demande nest pas respecte.',
      });

      assertEqual(message.title, 'Erreur de sortie');
      assert(message.problem.includes('trop de texte'));
      assert(!message.problem.includes('Attendu'));
    });

    test('rewrites semantic undeclared variable errors', () => {
      const message = humanizeSemanticError({
        message: "Identifiant 'total' non declare",
      });

      assertEqual(message.title, 'Erreur de declaration');
      assert(message.fix.includes('Declare'));
    });

    test('builds primary feedback and keeps technical details separate', () => {
      const feedback = buildHumanizedValidationFeedback({
        success: false,
        errorCode: 'BQL_EXECUTION_FAILED',
        message: 'Point-virgule manquant apres affectation',
        diagnostics: [
          {
            type: 'syntax_error',
            code: 'BQL_EXECUTION_FAILED',
            message: 'Point-virgule manquant apres affectation',
          },
        ],
      });

      assertEqual(feedback.primary.title, 'Erreur de syntaxe');
      assert(feedback.primary.fix.includes(';'));
      assertEqual(feedback.debug.errorCode, 'BQL_EXECUTION_FAILED');
    });
  });
}
