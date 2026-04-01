/**
 * fullAuditTests.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests complets post-audit pour valider toutes les structures du langage.
 *
 * Lancer avec : node --experimental-vm-modules src/lib/tests/fullAuditTests.js
 * ou            node src/lib/tests/fullAuditTests.js  (si ESM configuré)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Lexer  from '../lexer/Lexer.js';
import Parser from '../parser/Parser.js';

// ── Utilitaire ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, code, expectNoErrors = true, extraChecks = null) {
  const lexer  = new Lexer(code);
  const { tokens, errors: lexErrors } = lexer.tokenize();
  const parser = new Parser(tokens, code);
  const { ast, errors: parseErrors } = parser.parse();

  const allErrors = [...lexErrors, ...parseErrors];
  const ok = expectNoErrors ? allErrors.length === 0 : allErrors.length > 0;

  if (ok) {
    if (extraChecks) {
      try {
        extraChecks(ast, allErrors);
        console.log(`  ✅ ${name}`);
        passed++;
      } catch (e) {
        console.log(`  ❌ ${name} — check failed: ${e.message}`);
        failed++;
      }
    } else {
      console.log(`  ✅ ${name}`);
      passed++;
    }
  } else {
    console.log(`  ❌ ${name}`);
    if (expectNoErrors) {
      console.log(`     Erreurs inattendues :`);
      allErrors.forEach(e => console.log(`       L${e.line}:C${e.column} ${e.message}`));
    } else {
      console.log(`     Des erreurs étaient attendues mais aucune trouvée.`);
    }
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════');
console.log(' AUDIT COMPLET — Tests du Lexer & Parser');
console.log('═══════════════════════════════════════════════════════════\n');

// ── 1. Structure générale ────────────────────────────────────────────────────
console.log('── 1. Structure générale ──────────────────────────────────');

test('Programme minimal valide', `
ALGORITHMEMinimal;
DEBUT
FIN
`);

test('Programme avec VARIABLES', `
ALGORITHMETest;
VARIABLES:
  x : ENTIER;
DEBUT
  x <- 5;
FIN
`);

test('Programme avec plusieurs variables sur une ligne', `
ALGORITHMETest;
VARIABLES:
  a, b, c : ENTIER;
DEBUT
  a <- 1;
FIN
`);

test('FIN manquant — doit générer erreur', `
ALGORITHMETest;
DEBUT
  x <- 5;
`, false);

// ── 2. Variables simples ──────────────────────────────────────────────────────
console.log('\n── 2. Variables simples ───────────────────────────────────');

test('Déclaration a,b : ENTIER', `
ALGORITHMETest;
VARIABLES:
  a, b : ENTIER;
DEBUT
  a <- 1;
  b <- 2;
FIN
`);

test('Déclaration x : REEL', `
ALGORITHMETest;
VARIABLES:
  x : REEL;
DEBUT
  x <- 3.14;
FIN
`);

test('Déclaration ok : BOOLEEN', `
ALGORITHMETest;
VARIABLES:
  ok : BOOLEEN;
DEBUT
  ok <- VRAI;
FIN
`);

test('Variable nommée "a" (minuscule) — pas confondue avec mot-clé A', `
ALGORITHMETest;
VARIABLES:
  a, b : ENTIER;
DEBUT
  a <- 5;
  b <- a + 1;
  ECRIRE(b);
FIN
`);

// ── 3. Tableaux 1D ────────────────────────────────────────────────────────────
console.log('\n── 3. Tableaux 1D ─────────────────────────────────────────');

test('Déclaration Tableau T[10] : ENTIER', `
ALGORITHMETest;
VARIABLES:
  Tableau T[10] : ENTIER;
DEBUT
  T[0] <- 42;
FIN
`);

test('ECRIRE(T[i])', `
ALGORITHMETest;
VARIABLES:
  Tableau T[5] : ENTIER;
  i : ENTIER;
DEBUT
  i <- 0;
  T[i] <- 10;
  ECRIRE(T[i]);
FIN
`);

test('LIRE(T[i]) — BUG-04 corrigé', `
ALGORITHMETest;
VARIABLES:
  Tableau T[10] : ENTIER;
  i : ENTIER;
DEBUT
  i <- 0;
  LIRE(T[i]);
FIN
`);

test('T[i] <- valeur', `
ALGORITHMETest;
VARIABLES:
  Tableau T[5] : ENTIER;
  i : ENTIER;
DEBUT
  i <- 2;
  T[i] <- 99;
FIN
`);

test('somme <- somme + T[i]', `
ALGORITHMETest;
VARIABLES:
  Tableau T[5] : ENTIER;
  i, somme : ENTIER;
DEBUT
  somme <- 0;
  i <- 0;
  somme <- somme + T[i];
FIN
`);

// ── 4. Boucle POUR ────────────────────────────────────────────────────────────
console.log('\n── 4. Boucle POUR ─────────────────────────────────────────');

test('POUR basique — BUG-01 corrigé', `
ALGORITHMETest;
VARIABLES:
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 5 FAIRE
    ECRIRE(i);
  FINPOUR
FIN
`, true, (ast) => {
  const forNode = ast.body.statements[0];
  assert(forNode.type === 'FOR', 'ForNode attendu');
  assert(forNode.variable === 'i', 'variable = i');
  assert(forNode.step === null, 'step = null (implicite)');
});

test('POUR avec PAS 2 — BUG-02 corrigé', `
ALGORITHMETest;
VARIABLES:
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 10 PAS 2 FAIRE
    ECRIRE(i);
  FINPOUR
FIN
`, true, (ast) => {
  const forNode = ast.body.statements[0];
  assert(forNode.step !== null, 'step devrait être non-null');
  assert(forNode.step.value === 2, 'step.value === 2');
});

test('POUR avec PAS -1 (décroissant)', `
ALGORITHMETest;
VARIABLES:
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 10 A 0 PAS -1 FAIRE
    ECRIRE(i);
  FINPOUR
FIN
`);

test('POUR avec variable comme borne', `
ALGORITHMETest;
VARIABLES:
  i, n : ENTIER;
DEBUT
  n <- 10;
  POUR i ALLANT DE 1 A n FAIRE
    ECRIRE(i);
  FINPOUR
FIN
`);

test('POUR avec PAS 1 — doit générer erreur', `
ALGORITHMETest;
VARIABLES:
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 5 PAS 1 FAIRE
    ECRIRE(i);
  FINPOUR
FIN
`, false);

test('POUR avec PAS 0 — doit générer erreur', `
ALGORITHMETest;
VARIABLES:
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 5 PAS 0 FAIRE
    ECRIRE(i);
  FINPOUR
FIN
`, false);

test('POUR imbriqué', `
ALGORITHMETest;
VARIABLES:
  i, j : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 3 FAIRE
    POUR j ALLANT DE 0 A 3 FAIRE
      ECRIRE(j);
    FINPOUR
  FINPOUR
FIN
`);

test('POUR avec variable nommée a (conflit potentiel avec A)', `
ALGORITHMETest;
VARIABLES:
  a : ENTIER;
DEBUT
  POUR a ALLANT DE 1 A 5 FAIRE
    ECRIRE(a);
  FINPOUR
FIN
`);

test('POUR + tableau', `
ALGORITHMETest;
VARIABLES:
  Tableau T[10] : ENTIER;
  i, somme : ENTIER;
DEBUT
  somme <- 0;
  POUR i ALLANT DE 0 A 9 FAIRE
    LIRE(T[i]);
    somme <- somme + T[i];
  FINPOUR
  ECRIRE(somme);
FIN
`);

// ── 5. Conditions SI ──────────────────────────────────────────────────────────
console.log('\n── 5. Conditions SI ───────────────────────────────────────');

test('SI simple', `
ALGORITHMETest;
VARIABLES:
  a : ENTIER;
DEBUT
  SI (a > 0) ALORS
    ECRIRE("positif");
  FINSI
FIN
`);

test('SI SINON', `
ALGORITHMETest;
VARIABLES:
  a : ENTIER;
DEBUT
  SI (a > 0) ALORS
    ECRIRE("positif");
  SINON
    ECRIRE("negatif");
  FINSI
FIN
`);

test('SI SINON SI SINON', `
ALGORITHMETest;
VARIABLES:
  a : ENTIER;
DEBUT
  SI (a > 0) ALORS
    ECRIRE("positif");
  SINON SI (a = 0) ALORS
    ECRIRE("zero");
  SINON
    ECRIRE("negatif");
  FINSI
FIN
`);

test('SI imbriqué', `
ALGORITHMETest;
VARIABLES:
  a, b : ENTIER;
DEBUT
  SI (a > 0) ALORS
    SI (b > 0) ALORS
      ECRIRE("ok");
    FINSI
  FINSI
FIN
`);

test('SI dans POUR', `
ALGORITHMETest;
VARIABLES:
  i, a : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 5 FAIRE
    SI (i > 2) ALORS
      ECRIRE(i);
    FINSI
  FINPOUR
FIN
`);

// ── 6. Boucle TANTQUE ─────────────────────────────────────────────────────────
console.log('\n── 6. Boucle TANTQUE ──────────────────────────────────────');

test('TANTQUE simple', `
ALGORITHMETest;
VARIABLES:
  n : ENTIER;
DEBUT
  n <- 0;
  TANTQUE (n < 10) FAIRE
    n <- n + 1;
  FINTANTQUE
FIN
`);

test('TANTQUE imbriqué dans POUR', `
ALGORITHMETest;
VARIABLES:
  i, j : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 3 FAIRE
    j <- 0;
    TANTQUE (j < 5) FAIRE
      j <- j + 1;
    FINTANTQUE
  FINPOUR
FIN
`);

// ── 7. Boucle REPETER ─────────────────────────────────────────────────────────
console.log('\n── 7. Boucle REPETER ──────────────────────────────────────');

test('REPETER JUSQUA simple', `
ALGORITHMETest;
VARIABLES:
  a : ENTIER;
DEBUT
  REPETER
    LIRE(a);
  JUSQUA (a > 0)
FIN
`);

test('REPETER avec ECRIRE', `
ALGORITHMETest;
VARIABLES:
  n : ENTIER;
DEBUT
  n <- 0;
  REPETER
    n <- n + 1;
    ECRIRE(n);
  JUSQUA (n >= 5)
FIN
`);

// ── 8. Structure SELON ────────────────────────────────────────────────────────
console.log('\n── 8. Structure SELON ─────────────────────────────────────');

test('SELON complet avec AUTRE', `
ALGORITHMETest;
VARIABLES:
  a : ENTIER;
DEBUT
  SELON (a) FAIRE
  CAS 1:
    ECRIRE("un");
  CAS 2:
    ECRIRE("deux");
  AUTRE:
    ECRIRE("autre");
  FINSELON
FIN
`);

test('SELON sans AUTRE', `
ALGORITHMETest;
VARIABLES:
  a : ENTIER;
DEBUT
  SELON (a) FAIRE
  CAS 1:
    ECRIRE("un");
  CAS 2:
    ECRIRE("deux");
  FINSELON
FIN
`);

// ── 9. Expressions ────────────────────────────────────────────────────────────
console.log('\n── 9. Expressions ─────────────────────────────────────────');

test('Expression arithmétique', `
ALGORITHMETest;
VARIABLES:
  a, b, c : ENTIER;
DEBUT
  c <- (a + b) * 2 - 1;
FIN
`);

test('Expression logique ET, OU, NON', `
ALGORITHMETest;
VARIABLES:
  a, b : ENTIER;
  ok : BOOLEEN;
DEBUT
  ok <- (a > 0) ET (b > 0);
FIN
`);

test('Comparaison !=', `
ALGORITHMETest;
VARIABLES:
  a, b : ENTIER;
DEBUT
  SI (a != b) ALORS
    ECRIRE("different");
  FINSI
FIN
`);

test('ECRIRE avec plusieurs arguments', `
ALGORITHMETest;
VARIABLES:
  a : ENTIER;
DEBUT
  ECRIRE("valeur : ", a);
FIN
`);

// ── 10. Erreurs attendues ────────────────────────────────────────────────────
console.log('\n── 10. Erreurs well-formed ─────────────────────────────────');

test('FINSI orphelin — doit générer erreur', `
ALGORITHMETest;
DEBUT
  FINSI
FIN
`, false);

test('FINPOUR orphelin — doit générer erreur', `
ALGORITHMETest;
DEBUT
  FINPOUR
FIN
`, false);

test('FINTANTQUE orphelin — doit générer erreur', `
ALGORITHMETest;
DEBUT
  FINTANTQUE
FIN
`, false);

test('POUR sans FINPOUR — doit générer erreur', `
ALGORITHMETest;
VARIABLES:
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 5 FAIRE
    ECRIRE(i);
FIN
`, false);

// ── Bilan ─────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════');
console.log(` RÉSULTATS : ${passed} passés, ${failed} échoués, ${passed + failed} total`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
}
