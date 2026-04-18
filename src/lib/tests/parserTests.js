import Lexer from '../lexer/Lexer.js';
import Parser from '../parser/Parser.js';
import {
  assert,
  assertEqual,
  assertHasErrors,
  isDirectRun,
  assertNoErrors,
  defineSuite,
  runSuites,
} from './testUtils.js';

function parse(source) {
  const lexer = new Lexer(source);
  const lexed = lexer.tokenize();
  const parser = new Parser(lexed.tokens, source);
  const parsed = parser.parse();

  return {
    ast: parsed.ast,
    lexicalErrors: lexed.errors,
    syntaxErrors: parsed.errors,
    errors: [...lexed.errors, ...parsed.errors],
  };
}

function expectValid(source) {
  const result = parse(source);
  assertNoErrors(result.lexicalErrors, 'Unexpected lexer errors');
  assertNoErrors(result.syntaxErrors, 'Unexpected parser errors');
  assert(result.ast, 'Parser did not return an AST');
  return result;
}

function expectInvalid(source) {
  const result = parse(source);
  assertHasErrors(result.errors, 'Expected lexer or parser errors');
  return result;
}

defineSuite('Parser - official BQL specification', test => {
  test('accepts valid glued and underscored algorithm headers', () => {
    expectValid(`
ALGORITHMENom;
DEBUT
FIN
`);

    expectValid(`
ALGORITHME_Nom;
DEBUT
FIN
`);
  });

  test('rejects algorithm header with a space', () => {
    expectInvalid(`
ALGORITHME Nom;
DEBUT
FIN
`);
  });

  test('accepts keywords regardless of case', () => {
    expectValid(`
algorithme_Case;
variable x : entier;
debut
  x <- 1;
fin
`);
  });

  test('enforces VARIABLE and VARIABLES cardinality and no colon after keyword', () => {
    expectValid(`
ALGORITHME_One;
VARIABLE
  x : ENTIER;
DEBUT
FIN
`);

    expectValid(`
ALGORITHME_Many;
VARIABLES
  x : ENTIER;
  y : REEL;
DEBUT
FIN
`);

    expectInvalid(`
ALGORITHME_BadOne;
VARIABLE
  x, y : ENTIER;
DEBUT
FIN
`);

    expectInvalid(`
ALGORITHME_BadMany;
VARIABLES
  x : ENTIER;
DEBUT
FIN
`);

    expectInvalid(`
ALGORITHME_BadColon;
VARIABLES:
  x : ENTIER;
  y : ENTIER;
DEBUT
FIN
`);
  });

  test('parses record type declarations and rejects semicolon after ENREGISTREMENT', () => {
    expectValid(`
ALGORITHME_Record;
Type Personne = Enregistrement
  nom : CHAINE DE CARACTERE;
  age : ENTIER;
Fin Personne
VARIABLE
  p : Personne;
DEBUT
FIN
`);

    expectInvalid(`
ALGORITHME_BadRecord;
Type Personne = Enregistrement;
  nom : CHAINE DE CARACTERE;
Fin Personne
DEBUT
FIN
`);
  });

  test('stops CONSTANTES section before TYPE declarations', () => {
    const result = expectValid(`
ALGORITHME_ConstantsThenType;
CONSTANTES
  MAX = 10 : ENTIER;
  ACTIVE = VRAI : BOOLEEN;
TYPE Eleve = Enregistrement
  nom : CHAINE DE CARACTERE;
Fin Eleve
VARIABLES
  e : Eleve;
  x : ENTIER;
DEBUT
  x <- MAX;
  e.nom <- "Ali";
FIN
`);

    assertEqual(result.ast.constants.length, 2, 'Expected two constants');
    assertEqual(result.ast.customTypes.length, 1, 'Expected one type declaration');
    assertEqual(result.ast.declarations.length, 2, 'Expected two variable declarations');
  });

  test('accepts all official primitive types', () => {
    expectValid(`
ALGORITHME_Types;
VARIABLES
  n : ENTIER;
  r : REEL;
  s : CHAINE DE CARACTERE;
  c : CARACTERE;
  ok : BOOLEEN;
DEBUT
FIN
`);
  });

  test('accepts <- assignment and rejects = assignment', () => {
    expectValid(`
ALGORITHME_Assign;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 5;
FIN
`);

    expectInvalid(`
ALGORITHME_BadAssign;
VARIABLE
  x : ENTIER;
DEBUT
  x = 5;
FIN
`);
  });

  test('requires parentheses and semicolons for ECRIRE and LIRE', () => {
    expectValid(`
ALGORITHME_IO;
VARIABLE
  x : ENTIER;
DEBUT
  ECRIRE("Hello");
  LIRE(x);
FIN
`);

    expectInvalid(`
ALGORITHME_BadPrint;
DEBUT
  ECRIRE "Hello";
FIN
`);

    expectInvalid(`
ALGORITHME_BadRead;
VARIABLE
  x : ENTIER;
DEBUT
  LIRE(x)
FIN
`);
  });

  test('parses SI, SINONSI, and SINON with optional condition parentheses', () => {
    expectValid(`
ALGORITHME_IfPlain;
VARIABLE
  x : ENTIER;
DEBUT
  SI x > 0 ALORS
    ECRIRE("positive");
  SINONSI x = 0 ALORS
    ECRIRE("zero");
  SINON
    ECRIRE("negative");
  FINSI
FIN
`);

    expectValid(`
ALGORITHME_IfParen;
VARIABLE
  x : ENTIER;
DEBUT
  SI (x > 0) ALORS
    ECRIRE("positive");
  SINONSI (x = 0) ALORS
    ECRIRE("zero");
  SINON
    ECRIRE("negative");
  FINSI
FIN
`);
  });

  test('parses POUR with implicit step and explicit PAS', () => {
    const withoutStep = expectValid(`
ALGORITHME_ForDefault;
VARIABLE
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 10 FAIRE
    ECRIRE(i);
  FINPOUR
FIN
`);

    const withStep = expectValid(`
ALGORITHME_ForStep;
VARIABLE
  i : ENTIER;
DEBUT
  POUR i ALLANT DE 0 A 10 PAS 2 FAIRE
    ECRIRE(i);
  FINPOUR
FIN
`);

    assertEqual(withoutStep.ast.body.statements[0].step, null, 'PAS absent should produce null step');
    assertEqual(withStep.ast.body.statements[0].step.value, 2, 'PAS 2 should produce numeric step');
  });

  test('parses arrays, matrices, and rejects M[i][j]', () => {
    expectValid(`
ALGORITHME_ArrayMatrix;
VARIABLES
  Tableau T[5] : ENTIER;
  Tableau M[2,3] : ENTIER;
  i : ENTIER;
  j : ENTIER;
DEBUT
  T[i] <- 1;
  M[i,j] <- T[i];
FIN
`);

    expectInvalid(`
ALGORITHME_BadMatrixAccess;
VARIABLES
  Tableau M[2,3] : ENTIER;
  i : ENTIER;
  j : ENTIER;
DEBUT
  M[i][j] <- 1;
FIN
`);
  });

  test('parses record field access and rejects ->', () => {
    expectValid(`
ALGORITHME_FieldAccess;
Type Date = Enregistrement
  jour : ENTIER;
Fin Date
Type Personne = Enregistrement
  nom : CHAINE DE CARACTERE;
  naissance : Date;
Fin Personne
VARIABLES
  e : Personne;
  Tableau groupe[2] : Personne;
  i : ENTIER;
DEBUT
  e.nom <- "Ali";
  e.naissance.jour <- 1;
  groupe[i].nom <- e.nom;
FIN
`);

    expectInvalid(`
ALGORITHME_BadArrow;
Type Personne = Enregistrement
  nom : CHAINE DE CARACTERE;
Fin Personne
VARIABLE
  e : Personne;
DEBUT
  e->nom <- "Ali";
FIN
`);
  });

  test('parses TANTQUE with optional parentheses', () => {
    expectValid(`
ALGORITHME_WhilePlain;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 0;
  TANTQUE x < 10 FAIRE
    x <- x + 1;
  FINTANTQUE
FIN
`);

    expectValid(`
ALGORITHME_WhileParen;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 0;
  TANTQUE (x < 10) FAIRE
    x <- x + 1;
  FINTANTQUE
FIN
`);
  });

  test('parses REPETER JUSQUA with optional parentheses and no FINREPETER', () => {
    expectValid(`
ALGORITHME_RepeatPlain;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 0;
  REPETER
    x <- x + 1;
  JUSQUA x = 10
FIN
`);

    expectValid(`
ALGORITHME_RepeatParen;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 0;
  REPETER
    x <- x + 1;
  JUSQUA (x = 10)
FIN
`);
  });

  test('parses SELON, CAS, AUTRE, and FINSELON', () => {
    expectValid(`
ALGORITHME_SwitchPlain;
VARIABLE
  x : ENTIER;
DEBUT
  SELON x FAIRE
    CAS 1:
      ECRIRE("one");
    AUTRE:
      ECRIRE("other");
  FINSELON
FIN
`);

    expectValid(`
ALGORITHME_SwitchParen;
VARIABLE
  x : ENTIER;
DEBUT
  SELON (x) FAIRE
    CAS 1:
      ECRIRE("one");
    AUTRE:
      ECRIRE("other");
  FINSELON
FIN
`);
  });

  test('enforces semicolon rules', () => {
    expectValid(`
ALGORITHME_Semicolons;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 1;
  SI x = 1 ALORS
    ECRIRE("ok");
  FINSI
FIN
`);

    expectInvalid(`
ALGORITHME_MissingDeclarationSemicolon;
VARIABLE
  x : ENTIER
DEBUT
FIN
`);

    expectInvalid(`
ALGORITHME_MissingAssignmentSemicolon;
VARIABLE
  x : ENTIER;
DEBUT
  x <- 1
FIN
`);

    expectInvalid(`
ALGORITHME_MissingPrintSemicolon;
DEBUT
  ECRIRE("ok")
FIN
`);
  });
});

if (isDirectRun(import.meta.url)) {
  await runSuites();
}
