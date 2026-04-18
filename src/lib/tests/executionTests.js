import { executeCode } from '../executeCode.js';
import { formatCode } from '../formatter/Formatter.js';
import {
  assert,
  assertDeepEqual,
  assertHasErrors,
  isDirectRun,
  assertNoErrors,
  defineSuite,
  runSuites,
} from './testUtils.js';

async function runProgram(source, options = {}) {
  const result = await executeCode(source, {
    terminalSpeed: 'instant',
    maxSteps: 10_000,
    ...options,
  });

  assertNoErrors(result.errors, 'Unexpected execution pipeline errors');
  return result;
}

defineSuite('Execution - BQL end to end', test => {
  test('does not auto-insert missing assignment semicolons', async () => {
    const result = await executeCode(`
ALGORITHME_MissingSemicolon;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 5
FIN
`, { terminalSpeed: 'instant' });

    assertHasErrors(result.syntaxErrors, 'Missing assignment semicolon must be a syntax error');
    assertDeepEqual(result.output, []);
  });

  test('accepts assignment when semicolon is present', async () => {
    const result = await runProgram(`
ALGORITHME_WithSemicolon;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 5;
  ECRIRE(x);
FIN
`);

    assertDeepEqual(result.output, ['5']);
  });

  test('does not require semicolons on control structure lines', async () => {
    const result = await runProgram(`
ALGORITHME_ControlSemicolons;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 0;
  SI x = 0 ALORS
    x <- 1;
  FINSI
  ECRIRE(x);
FIN
`);

    assertDeepEqual(result.output, ['1']);
  });

  test('formatter does not add missing semicolons', () => {
    const formatted = formatCode(`
ALGORITHME_FormatCheck;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 5
FIN
`);

    assert(formatted.includes('x <- 5\n'), 'Formatter must preserve missing semicolon');
    assert(!formatted.includes('x <- 5;'), 'Formatter must not insert semicolon');
  });

  test('runs simple assignment', async () => {
    const result = await runProgram(`
ALGORITHME_Assignment;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 5;
  ECRIRE(x);
FIN
`);

    assertDeepEqual(result.output, ['5']);
  });

  test('runs ECRIRE with text and values', async () => {
    const result = await runProgram(`
ALGORITHME_Print;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 7;
  ECRIRE("x=", x);
FIN
`);

    assertDeepEqual(result.output, ['x=7']);
  });

  test('runs SI', async () => {
    const result = await runProgram(`
ALGORITHME_If;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 0;
  SI x > 0 ALORS
    ECRIRE("positive");
  SINONSI x = 0 ALORS
    ECRIRE("zero");
  SINON
    ECRIRE("negative");
  FINSI
FIN
`);

    assertDeepEqual(result.output, ['zero']);
  });

  test('compares CARACTERE values case-insensitively without changing stored value', async () => {
    const result = await runProgram(`
ALGORITHME_CharCompare;
VARIABLE
  choix : CARACTERE;
DEBUT
  choix <- 'o';
  SI choix = 'O' ALORS
    ECRIRE("match");
  SINON
    ECRIRE("miss");
  FINSI
  ECRIRE(choix);
FIN
`);

    assertDeepEqual(result.output, ['match', 'o']);
  });

  test('compares CARACTERE inequality case-insensitively', async () => {
    const result = await runProgram(`
ALGORITHME_CharNotEqual;
VARIABLE
  choix : CARACTERE;
DEBUT
  choix <- 'n';
  SI choix <> 'N' ALORS
    ECRIRE("different");
  SINON
    ECRIRE("same");
  FINSI
FIN
`);

    assertDeepEqual(result.output, ['same']);
  });

  test('keeps CHAINE comparisons case-sensitive', async () => {
    const result = await runProgram(`
ALGORITHME_StringCaseSensitive;
VARIABLES
  a : CHAINE DE CARACTERE;
  b : CHAINE DE CARACTERE;
DEBUT
  a <- "abc";
  b <- "ABC";
  SI a = b ALORS
    ECRIRE("same");
  SINON
    ECRIRE("different");
  FINSI
FIN
`);

    assertDeepEqual(result.output, ['different']);
  });

  test('matches SELON CAS for CARACTERE case-insensitively without changing stored value', async () => {
    const result = await runProgram(`
ALGORITHME_SelonChar;
VARIABLE
  choix : CARACTERE;
DEBUT
  choix <- 'o';
  SELON choix FAIRE
    CAS 'O':
      ECRIRE("oui");
    CAS 'N':
      ECRIRE("non");
    AUTRE:
      ECRIRE("autre");
  FINSELON
  ECRIRE(choix);
FIN
`);

    assertDeepEqual(result.output, ['oui', 'o']);
  });

  test('runs POUR', async () => {
    const result = await runProgram(`
ALGORITHME_For;
VARIABLES
  i : ENTIER;
  s : ENTIER;
DEBUT
  s <- 0;
  POUR i ALLANT DE 0 A 3 FAIRE
    s <- s + i;
  FINPOUR
  ECRIRE(s);
FIN
`);

    assertDeepEqual(result.output, ['6']);
  });

  test('runs TANTQUE', async () => {
    const result = await runProgram(`
ALGORITHME_While;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 0;
  TANTQUE x < 3 FAIRE
    x <- x + 1;
  FINTANTQUE
  ECRIRE(x);
FIN
`);

    assertDeepEqual(result.output, ['3']);
  });

  test('runs arrays', async () => {
    const result = await runProgram(`
ALGORITHME_Array;
VARIABLE
  Tableau T[3] : ENTIER;
DEBUT
  T[0] <- 2;
  T[1] <- 5;
  ECRIRE(T[0] + T[1]);
FIN
`);

    assertDeepEqual(result.output, ['7']);
  });

  test('runs matrices', async () => {
    const result = await runProgram(`
ALGORITHME_Matrix;
VARIABLE
  Tableau M[2,3] : ENTIER;
DEBUT
  M[1,2] <- 9;
  ECRIRE(M[1,2]);
FIN
`);

    assertDeepEqual(result.output, ['9']);
  });

  test('runs records', async () => {
    const result = await runProgram(`
ALGORITHME_Record;
Type Personne = Enregistrement
  nom : CHAINE DE CARACTERE;
  age : ENTIER;
Fin Personne
VARIABLE
  p : Personne;
DEBUT
  p.nom <- "Ali";
  p.age <- 20;
  ECRIRE(p.nom, ":", p.age);
FIN
`);

    assertDeepEqual(result.output, ['Ali:20']);
  });

  test('runs array of records', async () => {
    const result = await runProgram(`
ALGORITHME_ArrayOfRecords;
Type Personne = Enregistrement
  nom : CHAINE DE CARACTERE;
  age : ENTIER;
Fin Personne
VARIABLES
  Tableau groupe[2] : Personne;
  i : ENTIER;
DEBUT
  i <- 1;
  groupe[i].nom <- "Sara";
  groupe[i].age <- 21;
  ECRIRE(groupe[i].nom, ":", groupe[i].age);
FIN
`);

    assertDeepEqual(result.output, ['Sara:21']);
  });
});

if (isDirectRun(import.meta.url)) {
  await runSuites();
}
