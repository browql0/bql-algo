/**
 * errorExample.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Démonstration du système de gestion des erreurs (LexicalError,
 * AlgoSyntaxError, AlgoRuntimeError) et du formatage pédagogique.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Lexer        from './lexer/Lexer.js';
import Parser       from './parser/Parser.js';
import Interpreter  from './interpreter/Interpreter.js';
import { formatErrors } from './errors/index.js';

// 1. Code avec une erreur syntaxique (mot-clé mal orthographié "ALOR")
const CODE_SYNTAX_ERROR = `
ALGORITHME_TEST;
VARIABLES
  x : entier;
DEBUT
  x <- 10;
  SI x > 5 ALOR
    ecrire("Grand");
  FINSI
FIN
`;

// 2. Code avec une erreur lexicale (caractère inconnu @)
const CODE_LEXICAL_ERROR = `
ALGORITHME_TEST2;
DEBUT
  @inconnu <- 5;
FIN
`;

// 3. Code avec une erreur d'exécution (division par zéro)
const CODE_RUNTIME_ERROR = `
ALGORITHME_TEST3;
VARIABLES
  a : entier;
  b : entier;
DEBUT
  a <- 10;
  b <- 0;
  ecrire(a / b);
FIN
`;

/**
 * Exécute un code donné et affiche les erreurs formatées.
 */
function testError(title, code, inputs = []) {
  console.log('═'.repeat(60));
  console.log(`  🧪 Test : ${title}`);
  console.log('═'.repeat(60));

  try {
    // Phase 1 : Lexer
    const lexer = new Lexer(code);
    const { tokens, errors: lexErrors } = lexer.tokenize();

    if (lexErrors.length > 0) {
      console.log(formatErrors(lexErrors, code, { emoji: true, color: true }));
      return;
    }

    // Phase 2 : Parser
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Phase 3 : Interpreter
    const interp = new Interpreter({ inputs });
    interp.run(ast);

    console.log("✅ Exécution réussie sans erreur.");

  } catch (err) {
    // Si c'est une de nos erreurs structurées (SyntaxError, RuntimeError)
    if (err.name === 'SyntaxError' || err.name === 'RuntimeError') {
      console.log(formatErrors([err], code, { emoji: true }));
    } else {
      // Erreur native inattendue
      console.error("Erreur non gérée :", err);
    }
  }
  console.log('\n');
}

// ── Auto-run ──────────────────────────────────────────────────────────────────
if (typeof process !== 'undefined') {
  const { fileURLToPath } = await import('url');
  if (fileURLToPath(import.meta.url) === process.argv[1]) {
    testError('Erreur Syntaxique (Suggestion ALOR → ALORS)', CODE_SYNTAX_ERROR);
    testError('Erreur Lexicale (Caractère inconnu)', CODE_LEXICAL_ERROR);
    testError('Erreur d\'Exécution (Division par zéro)', CODE_RUNTIME_ERROR);
  }
}

export { testError };
