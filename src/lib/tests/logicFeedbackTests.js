import { diagnoseSubmission } from '../../../server/validation/diagnosticEngine.js';
import { buildFactureSimplifieeExercise } from '../../../server/validation/exerciseRules/factureSimplifiee.js';
import { strictValidate } from '../../../server/validation/strictValidator.js';
import { assertEqual } from './testUtils.js';

const missingQuantityCode = `ALGORITHME_Facture;
VARIABLES
prixHT, quantite, total : REEL;
DEBUT
LIRE(prixHT);
LIRE(quantite);
total <- prixHT * 1.2;
ECRIRE(total);
FIN`;

const missingTvaCode = `ALGORITHME_Facture;
VARIABLES
prixHT, quantite, total : REEL;
DEBUT
LIRE(prixHT);
LIRE(quantite);
total <- prixHT * quantite;
ECRIRE(total);
FIN`;

export default function registerLogicFeedbackTests(defineSuite) {
  defineSuite('Logic feedback diagnosis', (test) => {
    test('prioritizes missing quantity over generic output mismatch', async () => {
      const exercise = buildFactureSimplifieeExercise();
      const strictResult = await strictValidate({ code: missingQuantityCode, exercise });
      const diagnosis = await diagnoseSubmission({ exercise, strictResult });

      assertEqual(strictResult.success, false);
      assertEqual(diagnosis.diagnostics[0].code, 'MISSING_QUANTITY');
      assertEqual(Boolean(diagnosis.diagnostics[0].testNext), true);
    });

    test('detects missing TVA from hidden test output pattern', async () => {
      const exercise = buildFactureSimplifieeExercise();
      const strictResult = await strictValidate({ code: missingTvaCode, exercise });
      const diagnosis = await diagnoseSubmission({ exercise, strictResult });

      assertEqual(strictResult.success, false);
      assertEqual(diagnosis.diagnostics[0].code, 'MISSING_TVA');
      assertEqual(Boolean(diagnosis.feedbackReport.testNext), true);
    });
  });
}
