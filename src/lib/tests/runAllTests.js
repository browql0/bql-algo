import './lexerTests.js';
import './parserTests.js';
import './executionTests.js';
import registerEncouragingFeedbackTests from './encouragingFeedbackTests.js';
import registerLogicFeedbackTests from './logicFeedbackTests.js';
import registerValidationMessageHumanizerTests from './validationMessageHumanizerTests.js';
import { runSuites } from './testUtils.js';
import { defineSuite } from './testUtils.js';

registerEncouragingFeedbackTests(defineSuite);
registerLogicFeedbackTests(defineSuite);
registerValidationMessageHumanizerTests(defineSuite);
await runSuites();
