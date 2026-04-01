import Lexer            from './src/lib/lexer/Lexer.js';
import Parser           from './src/lib/parser/Parser.js';
import SemanticAnalyzer from './src/lib/semantic/SemanticAnalyzer.js';

function check(label, code, expectErrors = true) {
  const { tokens } = new Lexer(code).tokenize();
  const { ast, errors: pe } = new Parser(tokens, code).parse();
  const { errors: se } = new SemanticAnalyzer(code).analyze(ast);
  const all = [...pe, ...se];
  const hasError = all.length > 0;

  if (hasError === expectErrors) {
    console.log(`✅ ${label}`);
    if (hasError) all.forEach(e => console.log(`     → [${e.type||'sem'}] ${e.message}`));
  } else {
    console.log(`❌ ${label} — attendu erreur=${expectErrors} mais got ${hasError}`);
    all.forEach(e => console.log(`     → ${e.message}`));
  }
}

// ── Cas 1 : INTERDIT — T <- 3 sans indice ────────────────────────────────────
check('T <- 3 sans indice  [DOIT ÉCHOUER]', `
ALGORITHMETestTab;
VARIABLES:
  Tableau T[5] : ENTIER;
DEBUT
  T <- 3;
FIN
`, true);

// ── Cas 2 : VALIDE — T[0] <- 3 avec indice ──────────────────────────────────
check('T[0] <- 3 avec indice [DOIT RÉUSSIR]', `
ALGORITHMETestTab;
VARIABLES:
  Tableau T[5] : ENTIER;
DEBUT
  T[0] <- 3;
FIN
`, false);

// ── Cas 3 : VALIDE — x <- 3 variable simple ─────────────────────────────────
check('x <- 3 variable simple [DOIT RÉUSSIR]', `
ALGORITHMETestTab;
VARIABLES:
  x : ENTIER;
DEBUT
  x <- 3;
FIN
`, false);

// ── Cas 4 : VALIDE — T[i] <- valeur dans boucle ──────────────────────────────
check('T[i] <- val dans POUR [DOIT RÉUSSIR]', `
ALGORITHMETestTab;
VARIABLES:
  Tableau T[5] : ENTIER;
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 4 FAIRE
    T[i] <- i;
  FINPOUR
FIN
`, false);
